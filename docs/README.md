# GoEvent Frontend Documentation

Index of project documentation. The two root-level docs are the entry points:

- [../CLAUDE.md](../CLAUDE.md) — codebase guide for AI assistants (architecture, commands, conventions)
- [../DESIGN.md](../DESIGN.md) — the authoritative brand & design standard

## Design system

| Doc | Purpose |
|---|---|
| [../DESIGN.md](../DESIGN.md) | Brand identity, logos, colors, typography, layout, motion — the standard |
| [../.claude/skills/goevent-design/SKILL.md](../.claude/skills/goevent-design/SKILL.md) | Component-by-component Tailwind recipes (auto-loaded by Claude Code for UI work) |
| [../src/components/invitation/DROPDOWN_STYLING_GUIDE.md](../src/components/invitation/DROPDOWN_STYLING_GUIDE.md) | Detailed dropdown styling reference |

## Backend API references ([backend-api/](backend-api/))

Contracts and guides for backend endpoints and template-driven systems this frontend consumes:

- [EVENT_SHOWCASE_FRONTEND_GUIDE.md](backend-api/EVENT_SHOWCASE_FRONTEND_GUIDE.md) — showcase system, SSR, shortlinks (largest, most important)
- [CHECKIN_API_GUIDE.md](backend-api/CHECKIN_API_GUIDE.md) — attendee check-in
- [COMMISSION_API_FRONTEND_GUIDE.md](backend-api/COMMISSION_API_FRONTEND_GUIDE.md) — referral commissions
- [EVENT_PHOTO_API.md](backend-api/EVENT_PHOTO_API.md) — photo galleries
- [CAREER_API_DOCUMENTATION.md](backend-api/CAREER_API_DOCUMENTATION.md) / [CAREER_API_USAGE_EXAMPLES.md](backend-api/CAREER_API_USAGE_EXAMPLES.md) — career page
- [SERVICES_API_DOCS.md](backend-api/SERVICES_API_DOCS.md) — vendor service listings
- [TELEGRAM_LOGIN_GUIDE.md](backend-api/TELEGRAM_LOGIN_GUIDE.md) — Telegram auth
- [telegram-notifications-backend-spec.md](backend-api/telegram-notifications-backend-spec.md) — backend-proxied admin notifications
- [AMBIENT_CREATURES_BACKEND_GUIDE.md](backend-api/AMBIENT_CREATURES_BACKEND_GUIDE.md) / [AMBIENT_CREATURES_BACKEND_NOTE.md](backend-api/AMBIENT_CREATURES_BACKEND_NOTE.md) — showcase ambient creatures config
- [FALLING_EFFECT_BACKEND_GUIDE.md](backend-api/FALLING_EFFECT_BACKEND_GUIDE.md) — showcase falling-particle effect config

## Backend API requirements ([backend-api-requirements/](backend-api-requirements/))

Frontend-authored design requests for backend changes (the reverse direction of `backend-api/`).

- [event-details-design.md](backend-api-requirements/event-details-design.md) / [host-info-design.md](backend-api-requirements/host-info-design.md) — per-template date/location and host-info block designs
- [cover-free-placement.md](backend-api-requirements/cover-free-placement.md) — `layoutMode` + `coverElements` inside the existing `cover_stage_layout` blob, so cover blocks can be dragged/resized freely instead of stacking in fixed rows, plus optional per-block `fontType`/`colorSource`/`customColor` slot overrides (no schema change if the blob is stored verbatim — verify the serializer doesn't allow-list keys)
- [cover-gilding.md](backend-api-requirements/cover-gilding.md) — `coverGilding` inside the same `cover_stage_layout` blob: printed-gold lighting over the cover artwork (bevel, travelling speculars, corner glints, sparks) plus a cast shadow under the cover decorations. Third additive key in that blob; `guestFrame` was silently dropped by a key allow-list, so the serializer very likely needs the same fix — ideally fixed generally rather than per key
- [music-start-stage.md](backend-api-requirements/music-start-stage.md) — nullable `music_start_stage` (`cover`/`transition`/`main_content`) on the Event model so organizers choose how early the background music comes in; `null` deliberately means "keep the template flow's original timing" and must not be backfilled
- [falling-effect-speed.md](backend-api-requirements/falling-effect-speed.md) — one new optional `speed` multiplier (default `1` = today's speed) on the existing `falling_effect` blob, so partners can tune how fast petals fall independently of how many there are
- [spark-field.md](backend-api-requirements/spark-field.md) — new `sparks` blob + `spark_custom_image` file field, promoting the drifting sparks out of `coverGilding` into a standalone decoration (blink speed, size range, count, colour, built-in shapes, custom upload). The deprecated `coverGilding.sparkCount`/`colorSource`/`customColor` must keep round-tripping — they are the legacy fallback every already-published template still renders from
- [showcase-template-version.md](backend-api-requirements/showcase-template-version.md) — per-template V1/V2 showcase selection (V2 "Storybook Romance"), currently gated by `VITE_SHOWCASE_TEMPLATE_VERSION` env var
- [showcase-v2-theming.md](backend-api-requirements/showcase-v2-theming.md) — `v2-*` color names and font-type convention for template-driven V2 colors/fonts (informational, no schema change)
- [showcase-v2-template-presets.md](backend-api-requirements/showcase-v2-template-presets.md) — 6 ready-to-enter color/font presets for V2 templates, plus per-slot admin-panel help text ("which color is used where")
- [featured-photo-crop.md](backend-api-requirements/featured-photo-crop.md) — `crop_x`/`crop_y`/`crop_width`/`crop_height` on event photos so organizers can crop the transition stage's full-screen photo instead of always getting a centre crop
- [public-template-assets-decorations.md](backend-api-requirements/public-template-assets-decorations.md) — decoration assets in the pre-payment public template payload for the live preview
- [partner-template-asset-removal.md](backend-api-requirements/partner-template-asset-removal.md) — accept `''` on the template's file fields so a partner can remove a saved asset, not only replace it
- [event-banner-image-sizing.md](backend-api-requirements/event-banner-image-sizing.md) — **on hold** (implemented then reverted with an SSR change) — raise the banner optimizer bound to 1920×1005 and derive a ≤300KB 1200×630 `og:image` variant so messaging-app link previews render the large card
- [partner-access-request.md](backend-api-requirements/partner-access-request.md) — `GET /api/payment/partner-requests/me/` + `POST /api/payment/partner-requests/`, the first two `/api/payment/` endpoints that must **not** be partner-gated, so a non-partner can apply for the `is_partner` flag from the credits page instead of being told to "get in touch" with no way to do so. The frontend ships against this already and reads a `404` as "never applied", so it degrades safely until the endpoints land
- [vendor-cover-image.md](backend-api-requirements/vendor-cover-image.md) — **delivered** — exposes the `cover_image` field in the vendor **brief** serializer so the featured-vendor spotlight can use a vendor's own banner instead of borrowing (and mis-cropping) a listing photo; also removes up to six extra requests per services-page load

## Feature plans & implementation records ([features/](features/))

Living documentation for large multi-phase features:

- [TICKETS_FEATURE_PLAN.md](features/TICKETS_FEATURE_PLAN.md) → [TICKETS_FEATURE_UPDATES.md](features/TICKETS_FEATURE_UPDATES.md) → [TICKETS_PAYMENT_METHOD_FIX.md](features/TICKETS_PAYMENT_METHOD_FIX.md) → [TICKETS_UI_UNIFICATION.md](features/TICKETS_UI_UNIFICATION.md) — ticketing rollout chain
- [TICKETS_CHECKIN_FEATURE_PLAN.md](features/TICKETS_CHECKIN_FEATURE_PLAN.md) / [TICKETS_CHECKIN_BACKEND_ASKS.md](features/TICKETS_CHECKIN_BACKEND_ASKS.md) (closed) — door check-in
- [TABLE_SEATING_FEATURE.md](features/TABLE_SEATING_FEATURE.md) — table seating
- [SHOWCASE_LIVE_PREVIEW_EDITOR.md](features/SHOWCASE_LIVE_PREVIEW_EDITOR.md) — manage-page live preview + click-to-edit (in progress)
- [SHOWCASE_PREVIEW_EDITOR_PLAN.md](features/SHOWCASE_PREVIEW_EDITOR_PLAN.md) — target architecture + progress anchor for full showcase editing from the preview (media intents, renderer registry)

## Guides ([guides/](guides/))

Deployment, workflow, and subsystem how-tos:

- [CLOUDFLARE_DEPLOYMENT_GUIDE.md](guides/CLOUDFLARE_DEPLOYMENT_GUIDE.md) / [FRONTEND_DEPLOYMENT_GUIDE.md](guides/FRONTEND_DEPLOYMENT_GUIDE.md) / [LOCAL_WORKFLOW_GUIDE.md](guides/LOCAL_WORKFLOW_GUIDE.md) — deployment & dev workflow
- [PLAYWRIGHT.md](guides/PLAYWRIGHT.md) — E2E testing setup, fixtures, and why `npx playwright install` must never be run
- [API_SERVICE_TECHNICAL_REFERENCE.md](guides/API_SERVICE_TECHNICAL_REFERENCE.md) — API core internals (SecureLogger, type guards)
- [VIDEO_MEMORY_MANAGEMENT.md](guides/VIDEO_MEMORY_MANAGEMENT.md) — showcase video memory system
- [REDIRECT_SYSTEM_IMPLEMENTATION.md](guides/REDIRECT_SYSTEM_IMPLEMENTATION.md) — showcase redirect state
- [SSR_META_IMPLEMENTATION.md](guides/SSR_META_IMPLEMENTATION.md) — social-share meta tags
- [DECORATIVE-FRAME-GUIDE.md](guides/DECORATIVE-FRAME-GUIDE.md) — guest-name decorative frames
- [MODAL_AUTH_INTEGRATION_GUIDE.md](guides/MODAL_AUTH_INTEGRATION_GUIDE.md) — modal-based auth
- [GUEST_BULK_IMPORT_GUIDE.md](guides/GUEST_BULK_IMPORT_GUIDE.md) / [GUEST_GROUP_MANDATORY_UPDATE.md](guides/GUEST_GROUP_MANDATORY_UPDATE.md) — guest management
- [SIDEBAR_IMPLEMENTATION.md](guides/SIDEBAR_IMPLEMENTATION.md) / [SIDEBAR_USAGE_EXAMPLES.md](guides/SIDEBAR_USAGE_EXAMPLES.md) — sidebar navigation

## Conventions

- New durable docs go in the matching subfolder above — never loose in the repo root or bare `docs/`. The repo root is reserved for `README.md`, `CLAUDE.md`, and `DESIGN.md`.
- One-off session reports (fix summaries, refactor reports, readiness audits, "polish pass" notes) should **not** be committed; git history and PR descriptions are the record of completed work.
- When a doc describes behavior that changes, update or delete it in the same PR. Add new docs to this index.
