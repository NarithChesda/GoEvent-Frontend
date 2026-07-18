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
- [showcase-template-version.md](backend-api-requirements/showcase-template-version.md) — per-template V1/V2 showcase selection (V2 "Storybook Romance"), currently gated by `VITE_SHOWCASE_TEMPLATE_VERSION` env var

## Feature plans & implementation records ([features/](features/))

Living documentation for large multi-phase features:

- [TICKETS_FEATURE_PLAN.md](features/TICKETS_FEATURE_PLAN.md) → [TICKETS_FEATURE_UPDATES.md](features/TICKETS_FEATURE_UPDATES.md) → [TICKETS_PAYMENT_METHOD_FIX.md](features/TICKETS_PAYMENT_METHOD_FIX.md) → [TICKETS_UI_UNIFICATION.md](features/TICKETS_UI_UNIFICATION.md) — ticketing rollout chain
- [TICKETS_CHECKIN_FEATURE_PLAN.md](features/TICKETS_CHECKIN_FEATURE_PLAN.md) / [TICKETS_CHECKIN_BACKEND_ASKS.md](features/TICKETS_CHECKIN_BACKEND_ASKS.md) (closed) — door check-in
- [TABLE_SEATING_FEATURE.md](features/TABLE_SEATING_FEATURE.md) — table seating

## Guides ([guides/](guides/))

Deployment, workflow, and subsystem how-tos:

- [CLOUDFLARE_DEPLOYMENT_GUIDE.md](guides/CLOUDFLARE_DEPLOYMENT_GUIDE.md) / [FRONTEND_DEPLOYMENT_GUIDE.md](guides/FRONTEND_DEPLOYMENT_GUIDE.md) / [LOCAL_WORKFLOW_GUIDE.md](guides/LOCAL_WORKFLOW_GUIDE.md) — deployment & dev workflow
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
