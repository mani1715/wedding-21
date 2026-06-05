# MAJA Wedding Studio — PRD

## Origin
Cloned from `https://github.com/mani1715/wedding-19` on 2026-06-05.
Massive existing codebase (FastAPI + React) — luxury Indian wedding invitation
SaaS for photographers.

## Problem statement (this iteration)
The photographer panel had multiple paper-cuts:
1. Couple photo upload returned **401 Unauthorized** because the field tried to
   hit `/api/users/upload-image` (public-user endpoint) instead of an admin one.
2. Theme step felt clumsy — the photographer wanted a guided 3-stage picker
   (10 themes → 6 events → 3 designs) with credit costs surfaced and a real
   preview that does NOT render as a white screen.
3. Theme preview previously redirected to a route with poor styling.
4. AI Story Composer needed to use **Gemini** (was Claude) and to redirect
   focus into the form (not require scrolling up).
5. The legacy "Events" step in the wizard duplicated what the new theme flow
   already captures — needed to be removed.
6. Venue step needed an optional **Parking** section (toggle + text + map link).
7. Media step needed curated background-music presets.
8. Features step needed **credit / Free** label per feature, and the
   Multi-language flag needed a language picker.
9. Publish step needed an **Expiry Tier** selector (1m/3m/6m/1y) whose
   days & credits are admin-configurable.

## Architecture
- Stack: **FastAPI + MongoDB** backend, **React (CRA)** frontend, **Supervisor**.
- Auth: JWT bearer for photographer/admin, separate cookie/bearer for public
  users (wedding guests).
- AI: **Emergent Universal LLM Key** → Gemini-2.5-flash for story composer.
- Media: Local `uploads/` dir served by FastAPI.

## What's been implemented (2026-06-05)
### Backend
- `POST /api/admin/upload-image` — pre-save photographer upload (no profile_id
  required). Returns `{url, file_size}`.
- `GET /api/admin/expiry-tiers` — seeds 4 defaults on first call.
- `PUT /api/admin/expiry-tiers` — super-admin can replace the full tier list.
- `GET /api/music/presets` — returns 60 royalty-free tracks across
  devotional / classical / pleasant / cinematic / romantic moods.
- `POST /api/admin/ai/story` — switched from Claude Sonnet 4.5 to
  **Gemini-2.5-flash** via emergentintegrations.

### Frontend
- `LuxuryProfileForm` — removed `events` step; restructured Couple, Venue,
  Features, Publish.
- New `ThemeDesignWizard` (3-stage cascading picker w/ credit header).
- New `ThemeDesignPreviewModal` (full-screen invitation preview with hero,
  bride/groom slide-in cards, story, date/venue cards, closing — background
  music auto-plays with mute toggle).
- `PhotoUploadField` — defaults to `admin-presave` mode (no profile_id needed).
- `FeatureFlagsPanel` — now shows `Free` or `N credit(s)` per flag.
- `MultiLangPicker` — inline picker for additional languages.
- `ExpiryTierSelector` — pulled from `/api/admin/expiry-tiers`.

## Personas
- **Photographer (admin)**: Creates and publishes invitations for clients.
- **Super-admin**: Configures pricing, expiry tiers, themes, credits.
- **Wedding guest (public user)**: Views the published invitation.

## Backlog / Future
- P1: Build the super-admin UI for editing expiry tiers (endpoint exists).
- P2: Hook the chosen `expiry_tier` into the actual publish-cost calculation
  on the backend (currently theme cost only).
- P2: Auto-translate using Gemini for the additional languages selected.
- P3: Wire the parking field into the public invitation venue card.
- P3: Replace the demo soundhelix track in ThemeDesignPreviewModal with the
  selected music_url from the form when available.

## Verified (testing agent — iteration 1)
100% frontend pass, 83% backend (single flaky AI throttle).
All 9 wedding-wizard steps render and validate.
