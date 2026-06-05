# MAJA Wedding Studio — PRD

## Origin
Cloned from `https://github.com/mani1715/wedding-19` on 2026-06-05.
Massive existing codebase (FastAPI + React) — luxury Indian wedding invitation
SaaS for photographers AND retail users (couples).

## What's been implemented this run (2026-06-05)

### Iteration 3 — Normal-user (couple) purchase flow (2026-06-05)
**Backend (in `/app/backend/user_features.py`)**
- `GET /api/public/expiry-tiers` (no auth) — lists expiry tiers (auto-seeds 4 defaults on first request)
- `GET /api/public/addons` (no auth) — lists 10 default add-ons (music, live_gallery, ai_story, rsvp, whatsapp, parking, gift_registry, digital_shagun, ai_face_match, save_the_date)
- `POST /api/users/profiles/{profile_id}/buy-addon` — body `{addon_id}`, deducts credits, pushes to `profile.add_ons`, ledger entry. Idempotent; 402 on shortage; 404 on unknown profile/addon.

**Frontend**
- **NEW** `/app/frontend/src/pages/PurchaseOptionsWizard.jsx` — wizard at `/user/buy-theme/:themeId` and `/user/buy-design/:themeId/:event/:designId`. Picks addons + expiry tier; live total; checkout sends to `/user/create-invitation/...?addons=…&expiry=…` or `/user/buy-credits?return=…` on shortage.
- `LandingPage.jsx` — every theme card has a "Buy this theme" CTA (`theme-buy-btn-{id}`). Hero copy polished.
- `EventDesignPicker.jsx` — design cards now split into "Preview" + "Buy this design" + credit-cost badge (`design-preview-btn-{n}`, `design-buy-btn-{n}`, `design-credit-badge-{n}`).
- `UserInvitationForm.jsx` — parses `?addons=` and `?expiry=`, shows ✓ Purchased — included panel; after profile create loops and applies each addon via `/buy-addon`.
- `UserProfile.jsx` — "Add features" button per invitation card opens `AddFeaturesModal` (rows: `add-feature-row-{id}`, buttons: `add-feature-buy-{id}`, owned: `add-feature-owned-{id}`).
- `UserDashboard.jsx` — added `user-browse-themes-btn` → `/` then `#themes`.
- `LuxuryPublicInvitation.jsx` — top-right `lang-switcher` when `data.translations` has entries (translations applied via `tr(field, fallback)` helper across venue, story, about, parking). New `section-parking` rendered when `profile.parking.enabled` is true.

**Tests added**: `/app/backend/tests/test_user_purchase_wizard.py` (8/8 passing, full pytest coverage of the new endpoints + idempotency + 402 + 404 + auth).

**Test credentials** (in `/app/memory/test_credentials.md`):
- `testuser+maja@example.com` / `MajaTest@2026` (50 credits)



### Iteration 1 — Photographer Panel Overhaul
- `POST /api/admin/upload-image` — pre-save photographer photo upload
- `GET /api/admin/expiry-tiers`, `PUT /api/admin/expiry-tiers`
- `GET /api/music/presets` — 60 royalty-free tracks
- `POST /api/admin/ai/story` → switched to Gemini-2.5-flash
- New components: `ThemeDesignWizard`, `ThemeDesignPreviewModal`
- `LuxuryProfileForm` — removed Events step, added Parking, MultiLangPicker,
  ExpiryTierSelector, credit-cost labels in Features step
- `PhotoUploadField` defaults to `admin-presave` mode (no more 401s)

### Iteration 2 — Finish the 4 deferred items + Landing-page polish
1. **Super-admin Expiry Tiers UI** at `/super-admin/expiry-tiers` —
   `SuperAdminExpiryTiers.jsx` lets the owner add/edit/delete tiers
   (days & credits fully customisable, e.g. 45 days = 2 credits).
2. **Expiry-tier credits wired into publish cost**
   `WeddingLifecycleService.calculate_credit_cost(design, features, expiry_credits)`
   The publish flow now resolves `theme_settings.maja.expiry_tier`, looks up
   `db.expiry_tiers`, and adds those credits to `total_cost`. The
   `/api/weddings/estimate-cost` endpoint accepts `expiry_tier` too.
3. **Background music piped into preview** — `ThemeDesignPreviewModal`
   already accepted `couple.background_music_url`; `LuxuryProfileForm` now
   passes `form.background_music_url` through `coupleData`.
4. **Auto-translate with Gemini** —
   `POST /api/admin/profiles/{id}/translate` translates every translatable
   field into every additional language selected; stored under
   `profile.translations[language] = {field: value, ...}`. UI: new
   "Auto-translate with Gemini" button inside `MultiLangPicker`.
5. **Landing page header cleanup** — when a normal user is signed in, the
   "Photographer Studio" button is hidden; it reappears after sign-out.

## What's verified
- Iteration 1: testing agent — 100% frontend, 83% backend (1 flaky AI throttle)
- Iteration 2: manual curl on `/api/weddings/estimate-cost` with `expiry_tier`
  returns the correct `expiry_cost` and total; `/api/admin/expiry-tiers`
  GET + PUT both work; translation endpoint validates correctly.

## Personas
- **Photographer (admin)** — creates and publishes invitations for clients.
- **Super-admin** — configures pricing, expiry tiers, themes, credits.
- **Normal User (couple)** — buys credits, picks design, creates their own
  invitation. Flow exists at `/user/dashboard`, `/user/create-invitation`,
  `/user/profile`, `/user/buy-credits`, but several gaps remain (see backlog).

## Backlog / Future
- P1: Normal-user flow polish — see the "next chat" hand-off prompt
- P2: Wire the parking card into the public invitation venue section
- P2: Render translations on the public invite (language switcher pulls from
  `profile.translations`)
- P3: Multi-track music queue & crossfade on the live invitation
