"""
Super Admin Pricing Hub — unified pricing/discounts module.

Audience-aware (photographer | normal_user) configuration of:
  1. Credit packs (audience.credit_packs)
  2. Monthly subscription plans (photographer only)
  3. Post-subscription credit options (photographer only — two modes: packs OR per-credit rate)
  4. Theme prices (whole-theme rate)
  5. Design prices (per-design rate inside theme)
  6. Invitation option prices (per-feature rate, with "free" toggle)

Every priced row supports:
  - base_price          : integer rupees (for money rows) or integer credits (for credit-spend rows)
  - discount_enabled    : bool
  - discount_price      : optional integer (shown in UI as struck-through old + new)
  - is_free             : bool (only for option_prices) — when true the option is free for that audience

Collections:
  - pricing_credit_packs           (audience-aware)
  - pricing_subscription_plans     (photographer only)
  - pricing_post_sub_config        (photographer only, single doc)
  - pricing_theme_prices           (audience-aware, one per theme_id)
  - pricing_design_prices          (audience-aware, one per theme_id+design_key)
  - pricing_option_prices          (audience-aware, one per option_key)
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional, Literal, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

from auth import require_super_admin


# ---------------------------------------------------------------------------
# Canonical lists (locked — referenced by /catalog endpoint)
# ---------------------------------------------------------------------------
THEMES: List[Dict[str, str]] = [
    {"id": "royal_mughal", "name": "Royal Mughal"},
    {"id": "south_indian_temple", "name": "South Indian Temple"},
    {"id": "modern_minimal", "name": "Modern Minimal"},
    {"id": "beach_destination", "name": "Beach Destination"},
    {"id": "punjabi_sangeet", "name": "Punjabi Sangeet"},
    {"id": "bengali_traditional", "name": "Bengali Traditional"},
    {"id": "christian_elegant", "name": "Christian Elegant"},
    {"id": "muslim_nikah", "name": "Muslim Nikah"},
    {"id": "nature_eco_wedding", "name": "Nature / Eco Wedding"},
    {"id": "kerala_backwaters", "name": "Kerala Backwaters"},
]

INVITATION_OPTIONS: List[Dict[str, str]] = [
    {"key": "qr_code",         "label": "QR Code"},
    {"key": "rsvp_form",       "label": "RSVP Form"},
    {"key": "live_photo_wall", "label": "Live Photo Wall"},
    {"key": "find_my_photos",  "label": "Find-My-Photos (AI Selfie Search)"},
    {"key": "music_player",    "label": "Background Music Player"},
    {"key": "countdown",       "label": "Save-the-Date Countdown"},
    {"key": "maps_directions", "label": "Google Maps / Directions"},
    {"key": "gift_registry",   "label": "Gift Registry / Cash Gift"},
    {"key": "whatsapp_share",  "label": "WhatsApp Share Button"},
    {"key": "photo_gallery",   "label": "Post-Event Photo Gallery"},
    {"key": "calendar_add",    "label": "Calendar Add (.ics)"},
    {"key": "prewedding_story","label": "Pre-Wedding Story Slideshow"},
]

# Default per-theme designs (matches /themes/configs/*.designs.js)
DEFAULT_DESIGNS_PER_THEME: int = 6
DESIGN_KEYS = ["design_1", "design_2", "design_3", "design_4", "design_5", "design_6"]

Audience = Literal["photographer", "normal_user"]


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class _Priced(BaseModel):
    """Common discount/free fields."""
    base_price: int = Field(..., ge=0)
    discount_enabled: bool = False
    discount_price: Optional[int] = Field(None, ge=0)


class CreditPack(_Priced):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    audience: Audience
    credits: int = Field(..., gt=0)
    label: Optional[str] = None  # e.g. "Starter", "Pro", "Studio"
    is_active: bool = True


class SubscriptionPlan(_Priced):
    """Photographer monthly subscription only."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Monthly Pro"
    credits_per_month: int = Field(..., gt=0)
    duration_days: int = 30
    is_active: bool = True


class PostSubConfig(BaseModel):
    """Photographer post-subscription pricing (single doc, _id='singleton')."""
    mode: Literal["packs", "per_credit"] = "per_credit"
    per_credit_rate: int = 4                 # rupees per 1 credit
    packs: List[CreditPack] = Field(default_factory=list)


class ThemePrice(_Priced):
    """Per-audience whole-theme credit cost."""
    audience: Audience
    theme_id: str
    # base_price here = CREDITS (not rupees)


class DesignPrice(_Priced):
    audience: Audience
    theme_id: str
    design_key: str
    # base_price = CREDITS


class OptionPrice(_Priced):
    audience: Audience
    option_key: str
    is_free: bool = False
    # base_price = CREDITS (ignored if is_free)


# Request payloads
class CreditPackUpsert(_Priced):
    id: Optional[str] = None
    audience: Audience
    credits: int = Field(..., gt=0)
    label: Optional[str] = None
    is_active: bool = True


class SubscriptionUpsert(_Priced):
    id: Optional[str] = None
    name: str
    credits_per_month: int = Field(..., gt=0)
    duration_days: int = 30
    is_active: bool = True


class ThemePriceUpsert(_Priced):
    audience: Audience
    theme_id: str


class DesignPriceUpsert(_Priced):
    audience: Audience
    theme_id: str
    design_key: str


class OptionPriceUpsert(_Priced):
    audience: Audience
    option_key: str
    is_free: bool = False


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------
router = APIRouter(prefix="/api/super-admin/pricing", tags=["Super Admin · Pricing"])


def _db_dep():
    """Lazy DB accessor — set by main server during include_router wiring."""
    raise RuntimeError("DB not wired. Call attach(router, db_instance) at startup.")


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _strip_id(doc: Dict[str, Any]) -> Dict[str, Any]:
    if doc and "_id" in doc:
        doc = {**doc, "_id": str(doc["_id"])}
        del doc["_id"]
    return doc


# Module-level DB holder — set via attach()
_DB: Optional[AsyncIOMotorDatabase] = None


def attach(db: AsyncIOMotorDatabase) -> APIRouter:
    """Wire the DB instance and return the router (to be included in main app)."""
    global _DB
    _DB = db
    return router


def db() -> AsyncIOMotorDatabase:
    if _DB is None:
        raise RuntimeError("Pricing module DB not attached")
    return _DB


# ---------------------------------------------------------------------------
# 0. CATALOG — themes + options (read-only)
# ---------------------------------------------------------------------------
@router.get("/catalog")
async def get_catalog(_: str = Depends(require_super_admin)):
    return {
        "themes": THEMES,
        "options": INVITATION_OPTIONS,
        "design_keys": DESIGN_KEYS,
    }


# ---------------------------------------------------------------------------
# 1. CREDIT PACKS (audience-aware)
# ---------------------------------------------------------------------------
@router.get("/credit-packs")
async def list_credit_packs(audience: Audience, _: str = Depends(require_super_admin)):
    cursor = db().pricing_credit_packs.find({"audience": audience}).sort("credits", 1)
    return [_strip_id(d) async for d in cursor]


@router.post("/credit-packs")
async def upsert_credit_pack(payload: CreditPackUpsert, _: str = Depends(require_super_admin)):
    doc = payload.model_dump()
    if not doc.get("id"):
        doc["id"] = str(uuid.uuid4())
    doc["updated_at"] = _now()
    await db().pricing_credit_packs.update_one(
        {"id": doc["id"]}, {"$set": doc, "$setOnInsert": {"created_at": _now()}},
        upsert=True,
    )
    saved = await db().pricing_credit_packs.find_one({"id": doc["id"]})
    return _strip_id(saved)


@router.delete("/credit-packs/{pack_id}")
async def delete_credit_pack(pack_id: str, _: str = Depends(require_super_admin)):
    result = await db().pricing_credit_packs.delete_one({"id": pack_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pack not found")
    return {"ok": True}


# ---------------------------------------------------------------------------
# 2. SUBSCRIPTION PLANS (photographer only)
# ---------------------------------------------------------------------------
@router.get("/subscriptions")
async def list_subscriptions(_: str = Depends(require_super_admin)):
    cursor = db().pricing_subscription_plans.find({}).sort("credits_per_month", 1)
    return [_strip_id(d) async for d in cursor]


@router.post("/subscriptions")
async def upsert_subscription(payload: SubscriptionUpsert, _: str = Depends(require_super_admin)):
    doc = payload.model_dump()
    if not doc.get("id"):
        doc["id"] = str(uuid.uuid4())
    doc["updated_at"] = _now()
    await db().pricing_subscription_plans.update_one(
        {"id": doc["id"]}, {"$set": doc, "$setOnInsert": {"created_at": _now()}},
        upsert=True,
    )
    saved = await db().pricing_subscription_plans.find_one({"id": doc["id"]})
    return _strip_id(saved)


@router.delete("/subscriptions/{plan_id}")
async def delete_subscription(plan_id: str, _: str = Depends(require_super_admin)):
    result = await db().pricing_subscription_plans.delete_one({"id": plan_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return {"ok": True}


# ---------------------------------------------------------------------------
# 3. POST-SUBSCRIPTION CONFIG (photographer only, singleton)
# ---------------------------------------------------------------------------
@router.get("/post-sub")
async def get_post_sub(_: str = Depends(require_super_admin)):
    doc = await db().pricing_post_sub.find_one({"_id": "singleton"})
    if not doc:
        return PostSubConfig().model_dump()
    doc.pop("_id", None)
    return doc


@router.put("/post-sub")
async def put_post_sub(payload: PostSubConfig, _: str = Depends(require_super_admin)):
    doc = payload.model_dump()
    doc["updated_at"] = _now()
    await db().pricing_post_sub.update_one(
        {"_id": "singleton"}, {"$set": doc, "$setOnInsert": {"created_at": _now()}},
        upsert=True,
    )
    return doc


# ---------------------------------------------------------------------------
# 4. THEME PRICES (audience-aware)
# ---------------------------------------------------------------------------
@router.get("/themes")
async def list_theme_prices(audience: Audience, _: str = Depends(require_super_admin)):
    cursor = db().pricing_theme_prices.find({"audience": audience})
    existing = {d["theme_id"]: _strip_id(d) async for d in cursor}
    # Always return one row per theme, filling defaults for missing ones
    out = []
    for t in THEMES:
        row = existing.get(t["id"]) or {
            "audience": audience,
            "theme_id": t["id"],
            "base_price": 8 if audience == "photographer" else 12,
            "discount_enabled": False,
            "discount_price": None,
        }
        row["theme_name"] = t["name"]
        out.append(row)
    return out


@router.post("/themes")
async def upsert_theme_price(payload: ThemePriceUpsert, _: str = Depends(require_super_admin)):
    doc = payload.model_dump()
    doc["updated_at"] = _now()
    await db().pricing_theme_prices.update_one(
        {"audience": doc["audience"], "theme_id": doc["theme_id"]},
        {"$set": doc, "$setOnInsert": {"created_at": _now()}},
        upsert=True,
    )
    saved = await db().pricing_theme_prices.find_one(
        {"audience": doc["audience"], "theme_id": doc["theme_id"]}
    )
    return _strip_id(saved)


# ---------------------------------------------------------------------------
# 5. DESIGN PRICES (audience + theme + design_key)
# ---------------------------------------------------------------------------
@router.get("/designs")
async def list_design_prices(audience: Audience, theme_id: str, _: str = Depends(require_super_admin)):
    cursor = db().pricing_design_prices.find({"audience": audience, "theme_id": theme_id})
    existing = {d["design_key"]: _strip_id(d) async for d in cursor}
    out = []
    for k in DESIGN_KEYS:
        row = existing.get(k) or {
            "audience": audience, "theme_id": theme_id, "design_key": k,
            "base_price": 2 if audience == "photographer" else 4,
            "discount_enabled": False, "discount_price": None,
        }
        out.append(row)
    return out


@router.post("/designs")
async def upsert_design_price(payload: DesignPriceUpsert, _: str = Depends(require_super_admin)):
    doc = payload.model_dump()
    doc["updated_at"] = _now()
    await db().pricing_design_prices.update_one(
        {"audience": doc["audience"], "theme_id": doc["theme_id"], "design_key": doc["design_key"]},
        {"$set": doc, "$setOnInsert": {"created_at": _now()}},
        upsert=True,
    )
    saved = await db().pricing_design_prices.find_one({
        "audience": doc["audience"], "theme_id": doc["theme_id"], "design_key": doc["design_key"]
    })
    return _strip_id(saved)


# ---------------------------------------------------------------------------
# 6. OPTION PRICES (audience + option_key)
# ---------------------------------------------------------------------------
@router.get("/options")
async def list_option_prices(audience: Audience, _: str = Depends(require_super_admin)):
    cursor = db().pricing_option_prices.find({"audience": audience})
    existing = {d["option_key"]: _strip_id(d) async for d in cursor}
    out = []
    for o in INVITATION_OPTIONS:
        row = existing.get(o["key"]) or {
            "audience": audience, "option_key": o["key"],
            "base_price": 3 if audience == "photographer" else 5,
            "is_free": False,
            "discount_enabled": False, "discount_price": None,
        }
        row["label"] = o["label"]
        out.append(row)
    return out


@router.post("/options")
async def upsert_option_price(payload: OptionPriceUpsert, _: str = Depends(require_super_admin)):
    doc = payload.model_dump()
    doc["updated_at"] = _now()
    await db().pricing_option_prices.update_one(
        {"audience": doc["audience"], "option_key": doc["option_key"]},
        {"$set": doc, "$setOnInsert": {"created_at": _now()}},
        upsert=True,
    )
    saved = await db().pricing_option_prices.find_one({
        "audience": doc["audience"], "option_key": doc["option_key"]
    })
    return _strip_id(saved)


# ---------------------------------------------------------------------------
# Public read endpoint — for the photographer / user UI to display final prices
# (no auth needed; only returns the effective rate after discount/free logic)
# ---------------------------------------------------------------------------
def _effective(row: Dict[str, Any]) -> int:
    if row.get("is_free"):
        return 0
    if row.get("discount_enabled") and isinstance(row.get("discount_price"), int):
        return row["discount_price"]
    return int(row.get("base_price", 0))


public_router = APIRouter(prefix="/api/public/pricing", tags=["Public · Pricing"])


@public_router.get("/effective")
async def effective_prices(audience: Audience):
    """Effective prices for the current audience. No auth."""
    themes_cur = db().pricing_theme_prices.find({"audience": audience})
    themes = {d["theme_id"]: _effective(d) async for d in themes_cur}
    options_cur = db().pricing_option_prices.find({"audience": audience})
    options = {d["option_key"]: {
        "credits": _effective(d), "is_free": bool(d.get("is_free")),
    } async for d in options_cur}
    packs_cur = db().pricing_credit_packs.find({"audience": audience, "is_active": True}).sort("credits", 1)
    packs = []
    async for d in packs_cur:
        packs.append({
            "credits": d["credits"],
            "price": _effective(d),
            "base_price": d["base_price"],
            "label": d.get("label"),
        })
    return {"themes": themes, "options": options, "packs": packs}
