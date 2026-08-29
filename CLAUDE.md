# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GoEvent is a Vue 3 + TypeScript event management platform with a sophisticated event showcase system. The application features:
- Event creation, editing, and management with templates
- Multi-language support for event showcases
- Partner credit packs bought wholesale and spent on template activation
- Real-time event check-ins and registrations
- Collaborative event management
- Advanced media handling (photos, videos, QR codes)
- Guest invitation system with tracking
- Payment method integration

## Documentation Map

- **[DESIGN.md](DESIGN.md)** — the authoritative brand & design standard (logos, brand colors, typography, layout, motion, accessibility, definition-of-done checklist). Read it before any UI work.
- **[.claude/skills/goevent-design/SKILL.md](.claude/skills/goevent-design/SKILL.md)** — component-by-component Tailwind recipes implementing DESIGN.md (auto-loaded as the `goevent-design` skill).
- **[.claude/skills/goevent-taste/SKILL.md](.claude/skills/goevent-taste/SKILL.md)** — design *judgment* layer (auto-loaded as the `goevent-taste` skill). DESIGN.md says which token, `goevent-design` says which classes, this says **whether, how many, and how much**: hierarchy without color, gradient economy, when a card is earned, eyebrow/label restraint, CTA and motion discipline, density in English and Khmer. Ported from Taste Skill’s framework-agnostic craft directives and grounded in this repo’s measured patterns. It never introduces a new token — DESIGN.md still wins every conflict.
- **[docs/README.md](docs/README.md)** — index of all other docs: backend API references in [docs/backend-api/](docs/backend-api/), feature/deployment guides in [docs/guides/](docs/guides/).
- **Third-party design skills** (installed Aug 2026, vendored in `.claude/skills/`):
  - `emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-vocabulary`, `apple-design` — Emil Kowalski's motion/polish rules ([emilkowalski/skill](https://github.com/emilkowalski/skill)). CSS-first and framework-agnostic, so they transpose to Vue/GSAP cleanly. Update with `npx skills update`.
  - `impeccable` — design vocabulary + a deterministic anti-pattern detector ([pbakaus/impeccable](https://github.com/pbakaus/impeccable), Apache-2.0). Run it with `npx impeccable detect src/` (no LLM, no API key). Rule config lives in [.impeccable/config.json](.impeccable/config.json).
  - `web-design-guidelines` — audits UI code against Vercel's Web Interface Guidelines ([antfu/skills](https://github.com/antfu/skills), rules authored by Vercel). 190 lines of concrete a11y / focus-state / form / touch-target rules, zero framework coupling. Fetches the rules over the network at run time. Best complement to `impeccable`, which covers aesthetics rather than accessibility.
  - `frontend-design` — Anthropic's official aesthetic-direction skill ([anthropics/skills](https://github.com/anthropics/skills)). **Greenfield-oriented**: it sets a *new* visual direction, so it is the right tool for genuinely new visual worlds — a new showcase V2 category variant (birthday, housewarming) that needs its own palette and type pairing — and the wrong tool for routine work inside the existing app shell, where DESIGN.md already fixed the direction. The skill defers to a pinned brief by its own rule ("the brief's own words always win"); DESIGN.md is that brief.
  - **Precedence: [DESIGN.md](DESIGN.md) and `goevent-design` always win.** These skills encode generic taste and do not know this brand. Where they disagree with DESIGN.md — the brand gradient, the slate-only palette, light-mode-only — DESIGN.md is binding.
  - **Do NOT run `/impeccable init` or `/impeccable document`.** Both write or replace a root `DESIGN.md`, which would clobber the authoritative brand standard.
  - Two detector rules are disabled in [.impeccable/config.json](.impeccable/config.json): `gray-on-color` (the rule pairs a base `text-slate-*` with a `hover:bg-*` and ignores the paired `hover:text-*` — all 133 hits in this repo were false positives) and `gradient-text` (the brand gradient is deliberate). Re-check these if the detector is upgraded.
  - Taste Skill (`Leonxlnx/taste-skill`) was evaluated and **deliberately not installed** — twice. Beyond being React/shadcn/Radix-specific, it is an *aesthetic-direction* skill: it answers "what should this look like?", which DESIGN.md already answers. Its sibling skills in that repo (`minimalist-skill`, `brutalist-skill`, `soft-skill`, `brandkit`) are framework-free but prescribe whole competing identities (e.g. `minimalist-skill` bans gradients and `rounded-full`), so they conflict with the brand rather than refine it. What raises craft in an already-committed design system is execution discipline, which is what the skills above provide.
- **Doc hygiene**: durable docs live in `docs/`; never leave loose `.md` files in the repo root (the root is reserved for README.md, CLAUDE.md, DESIGN.md). Do not commit one-off session reports (fix summaries, refactor reports) — summarize in the PR/commit instead.

## Common Development Commands

### Development & Build
```bash
npm run dev              # Start dev server on port 5173
npm run build            # Type-check + production build
npm run build-skip-typecheck  # Build without type checking (faster)
npm run build-cloudflare # Optimized build for Cloudflare Pages
npm run preview          # Preview production build on port 4173
```

### Testing & Quality
```bash
npm run test:unit        # Run Vitest unit tests
npm run test:e2e         # Run Playwright E2E tests
npm run type-check       # Run Vue TSC type checking (vue-tsc --build) - THE REAL ONE
npm run type-check-noEmit # DOES NOTHING - see the warning below
npm run lint             # Run ESLint with auto-fix
npm run format           # Format code with Prettier
```

**`npm run type-check-noEmit` type-checks NOTHING — always use `npm run type-check`.**
It runs `vue-tsc --noEmit` against the root [tsconfig.json](tsconfig.json), which is a
solution-style config (`"files": []` plus project references). Without `--build`, vue-tsc
resolves zero input files and exits 0 having checked nothing. Verified twice: it reports
"clean" on a file containing a completely undefined identifier, and on
`const x: number = 'a string'`. `npm run type-check` is `vue-tsc --build`, which follows the
references and actually checks. It surfaces ~31 **pre-existing** errors, so diff against a
stashed baseline rather than expecting zero.

## Architecture Overview

### State Management
- **Pinia stores** ([src/stores/](src/stores/)):
  - `auth.ts`: Authentication state, login/logout, profile management, Google/Telegram OAuth
  - `guestManagement.ts`: Guest list state management with optimistic updates and local filtering
  - `language.ts`: App-wide locale state, kept in sync with vue-i18n, localStorage, and `<html lang>` (prefer the `useAppLanguage` composable in components)
  - `counter.ts`: Example counter store
- Authentication uses JWT tokens stored in secure storage with automatic refresh
- Auth initialization happens in [App.vue](src/App.vue) on mount

### API Layer Architecture
- **Modular API architecture** - The API layer has been refactored into a modular structure:
  - **Core infrastructure** ([src/services/api/core/](src/services/api/core/)):
    - `ApiClient.ts`: Central HTTP client with automatic token injection, request deduplication, and retry logic
    - `NetworkManager.ts`: Network state monitoring and offline detection
    - `SecureLogger.ts`: Secure logging with sensitive data redaction
  - **Type definitions** ([src/services/api/types/](src/services/api/types/)): Domain-specific types organized by feature
  - **Service modules** ([src/services/api/modules/](src/services/api/modules/)): Specialized services for each domain

- **Backward compatibility layer** ([src/services/api.ts](src/services/api.ts)):
  - Re-exports all services and types for backward compatibility
  - Existing imports continue to work: `import { eventsService } from '@/services/api'`
  - New code can import directly from modules: `import { eventsService } from '@/services/api/modules/events.service'`

- **Service layer** exports from [api.ts](src/services/api.ts):
  - `eventsService`: Event CRUD, registrations, RSVP, check-ins
  - `agendaService`: Agenda item management with bulk reordering
  - `hostsService`: Event host management with profile images
  - `mediaService`: Photo uploads (single and bulk), reordering
  - `eventTextsService`: Multi-language event text content
  - `paymentMethodsService`: Payment method management (bank, QR, URL)
  - `guestService`, `guestGroupService`: Guest list and group management with invitation tracking
  - `commentsService`: Event comments and feedback
  - `eventTemplateService`: Template browsing and selection
  - `eventCategoriesService`: Event categories
  - `teamMembersService`, `userService`: Team member and user data
  - `coreDataService`: Core data like icons
  - `expenseCategoriesService`, `expenseBudgetsService`, `expensesService`: Expense tracking
  - `dressCodeService`: Dress code management for events
  - `reviewsService`: Event reviews and ratings

- **Additional services**:
  - [src/services/auth.ts](src/services/auth.ts): Authentication operations (login, register, OAuth)
  - [src/services/tokenManager.ts](src/services/tokenManager.ts): JWT token management with automatic refresh
  - [src/services/upload.ts](src/services/upload.ts): File upload utilities

- **Core API features**:
  - Automatic token injection and refresh via `tokenManager`
  - Network state management with offline detection
  - Request timeout handling (30s default)
  - Request deduplication to prevent duplicate concurrent requests
  - User-friendly error messages with field-specific validation errors
  - Support for JSON and FormData payloads
  - Public endpoints available via `apiClient.getPublic()` for unauthenticated access

### Routing & Navigation
- Vue Router with dynamic imports for code-splitting ([src/router/index.ts](src/router/index.ts))
- Route guards enforce authentication and validate tokens on sensitive routes
- Meta tags managed with `metaUtils` for SEO
- Special handling for showcase pages with meta tag reset

### Event Showcase System
The showcase system is a complex, multi-stage component system for displaying event invitations:

- **Main showcase** ([src/views/EventShowcaseRefactored.vue](src/views/EventShowcaseRefactored.vue)):
  - Uses composables for modular functionality
  - Multi-language support with language switching
  - Guest-specific personalization via URL params
  - Template-driven rendering with custom fonts and colors

- **Key composables** ([src/composables/showcase/](src/composables/showcase/)):
  - `useShowcaseStages.ts`: Stage progression logic
  - `useTemplateProcessor.ts`: Template asset processing
  - `useFontManager.ts`: Dynamic font loading
  - `useVideoResourceManager.ts`: Video preloading and memory management
  - `useCoverStageVideo.ts`: Cover video handling
  - `useShowcaseRedirect.ts`: Redirect logic for showcase navigation
  - `useShowcaseAnimation.ts`: Showcase transition animation management (decoration vs door animations)

- **Showcase components** ([src/components/showcase/](src/components/showcase/)):
  - Stage-specific components for different showcase phases
  - Photo modal for gallery viewing
  - RSVP forms and payment method displays
  - Error boundaries and loading states

- **Standard flow's middle stage** (cover → *this* → background video + main content): the video it plays is resolved by `eventVideoUrl` in [useEventShowcase.ts](src/composables/useEventShowcase.ts) as `event.event_video` **then** `template_assets.assets.standard_transition_video`. The organizer's own film always wins; the template's is the fallback that gives a general-purpose standard template a transition of its own instead of cutting straight to the invitation. Neither → the beat is skipped, as before. Everything downstream (CoverStage, VideoContainer, useCoverStageVideo, the preview's Event Video frame) still calls this one URL `eventVideoUrl` and does not care which source it came from — the only other place that must know is the preview frame gate (`standardMiddleStageVideo` in [resolvePreviewRenderer.ts](src/components/showcase-preview/renderers/resolvePreviewRenderer.ts)). Uploaded per template on standard plans only, in the partner template form's Cover section. Backend field is **pending**: [docs/backend-api-requirements/standard-transition-video.md](docs/backend-api-requirements/standard-transition-video.md)

- **Stage-spanning decorations** (falling particles + drifting sparks): both fields are mounted **once by `CoverStage`**, not by any single stage, because `CoverStage` lives for the whole showcase — so one field drifts unbroken from the cover, through the transition, into the main content. A field spawned per-stage would visibly restart at each boundary. They are re-layered rather than re-spawned as stages change (`fallingEffectZIndex` / `sparkFieldZIndex`: above the cover artwork and door panels while the cover is up, behind the main content card afterwards), which is safe because every particle is `pointer-events: none`.
  - `falling_effect` ([FallingEffect.vue](src/components/showcase/FallingEffect.vue) + [useFallingParticles.ts](src/composables/showcase/useFallingParticles.ts)) — WAAPI-driven petals/confetti/snow/etc. with per-type motion profiles, depth-layer parallax, and a custom image option
  - `sparks` ([CoverSparks.vue](src/components/showcase/cover/CoverSparks.vue) + [useSparkField.ts](src/composables/showcase/useSparkField.ts)) — CSS-animated motes that blink and drift; configurable count, blink speed, size range, built-in shape, colour and custom image. The blink and the drift are two animations on one element, split across the individual `scale` and `translate` transform longhands so each keeps its own period — a mote breathes over seconds and wanders a slow ellipse over a minute and a half, and one `transform` track cannot hold both. Drift radius is derived from the mote's own size (bigger = nearer = wanders further, so it reads as parallax) and is deliberately **not** configurable or tied to `blink_speed`. **Previously nested inside `cover_stage_layout.coverGilding`** as `sparkCount`/`colorSource`/`customColor`, which gated ambient sparkle on the cover's band lighting; now standalone. `resolveSparkField` falls back to those deprecated gilding fields whenever `template_assets.sparks` is absent, so every already-published template renders unchanged — **do not remove them**. Backend field is pending: [docs/backend-api-requirements/spark-field.md](docs/backend-api-requirements/spark-field.md)

- **Host title + avatar frames, and the couple ornament** ([host-layouts/shared/frames/](src/components/showcase/host-layouts/shared/frames/)): chrome around the host's title and avatar, plus the motif between the two hosts. Selected per template by **sibling keys on `host_info_design`** — `frame_style` and `couple_ornament` — not by fields of their own; that config was always documented as an extensible object and these are the first to take that path, so the backend needs no new field (see [docs/backend-api-requirements/host-info-design.md](docs/backend-api-requirements/host-info-design.md)).
  - **`frame_style` is one choice drawn twice** — `HostTitleFrame.vue` and `HostAvatarFrame.vue` render the same style name in two geometries (`none` / `banner` / `plaque` / `ribbon` / `laurel`), so a partner can't pair a ribbon title with a laurel avatar. Both default to `none`, which is byte-for-byte the pre-frames look, so frames are opt-in and no existing template changes. Drawn by the **grid** layouts (`standard`, `portrait`) only — `arch` has its own frames and `simple` has neither a title nor an avatar.
  - **All chrome is anchored to the avatar, never to the frame wrapper.** The avatar's width is a percentage set by HostProfilePicture and overridden again by the portrait layout, so it lands at ~62% of the wrapper in `portrait` and 100% in `standard` — anything sized or positioned against the wrapper is right in one design and wrong in the other. Rings are `box-shadow` spreads (drawn from the avatar's own `border-radius`); the gem, ribbon tails and laurel wreath are pseudo-elements **of the avatar**, the two drawn ones via `mask-image` data URIs built in the component from the shared path data (a mask keeps the colour in CSS, which a `background-image` data URI cannot — it can't read a custom property). Do not reintroduce a width on `.avatar-frame`: an earlier version took the avatar's sizing over and the portrait layout's own `:deep` rule outranked it in one design and not the other.
  - **`.avatar-frame` needs its vertical padding.** `.profile-picture-row` is `overflow: hidden` and exactly as tall as its content ([host-info-base.css](src/components/showcase/host-layouts/shared/host-info-base.css)), so without padding every ring, tail and sprig is cut off at the circle's edge. Padding grows the row because the row's height is content-driven.
  - **The ornament fills `.center-spacer`** — the grid's middle `auto` track, which has always existed and never carried anything — so it costs no structural change. Only the profile row's spacer widens; the others stay at 1rem so turning a motif on can't narrow the parent/title/name columns.
  - Drawn shapes live in [ornamentPaths.ts](src/components/showcase/host-layouts/shared/frames/ornamentPaths.ts), stroked not filled: a filled heart at this size reads as a tappable icon, a drawn one reads as ornament. The laurel sprig is authored **once** and mirrored — its leaves are deliberately small and many, because at ~7px anything rounder merges into a mass that reads as a wing.
  - **The avatar row is gated on the *preview* context, not the edit one** ([previewContext.ts](src/components/showcase-preview/previewContext.ts)). `ShowcasePreviewFrameView` provides `EditIntentKey` only with `?editable=1`, and the partner-template preview opens the frame with `canEdit: false` — so `showProfilePictures`, which used `editIntentCtx` to mean "show empty slots", hid the entire profile row there, taking the frames *and* the ornament with it on every design. `PreviewFrameKey` is provided unconditionally by that view and means only "this is a preview": guests still need both photos before the row appears. Use it for any other "render a slot that has no content yet" decision.

- **Save the Date title card** on the transition stage ([save-the-date/](src/components/showcase/save-the-date/)): the block over the featured photograph, between the cover and the invitation. Six compositions, picked per template by `template_assets.save_the_date_design` the way `host_info_design` picks a host layout — `SaveTheDate.vue` dispatches to `designs/Std*.vue` with `v-bind="$props"`. **Both transition stages render all six**, so this is independent of `showcaseAnimationType`.
  - **The fallback is per-stage, not global** — absent/`null` renders `script` on [TransitionStage.vue](src/components/showcase/TransitionStage.vue) and `engraved` on [TransitionStageDoor.vue](src/components/showcase/TransitionStageDoor.vue), the designs each stage shipped with, so nothing about an already-published template changes. The partner form models that as an explicit `Match the transition` option persisting as `null`; **never backfill a type** onto templates that have none. Backend field is pending: [docs/backend-api-requirements/save-the-date-design.md](docs/backend-api-requirements/save-the-date-design.md)
  - **The design owns the composition; the stage owns the ground and the clock.** A design never reads a template colour or a stage class — it reads the CSS contract documented at the top of [save-the-date-base.css](src/components/showcase/save-the-date/save-the-date-base.css) (`--std-ink`, `--std-hot`, `--std-halo`, `--std-w`, `--std-t0`) plus its own `is-revealed` root class. That is what lets the decoration stage draw a design in flat primary ink over its pale mist band while the door stage draws the same one as struck metal over a near-black scrim.
  - **`--std-t0` keeps the two clocks separate.** Every beat is `calc(var(--std-t0) + Nms)`, so a design keeps its own rhythm while each stage decides when the block may begin: `0ms` on the decoration stage (its footer scrim has already risen) and `1000ms` on the door (`COPY_START_MS` — the leaves are still gathering and the frame has only just drawn). `script`'s and `engraved`'s internal beats are their original stages' numbers rebased to start at 0, so on their home stages the timings are byte-identical to before.
  - **`save-the-date-base.css` is loaded unscoped, once, from `SaveTheDate.vue`.** Vue rewrites `@keyframes` names inside a scoped block *per component*, so a scoped copy per design would give each one a differently-mangled `stdWipe`/`stdSheen`/`stdRuleDraw` and none would resolve. Keep it a `<style src>` without `scoped`; every selector is under `.std`.
  - **`script` deliberately ignores `ink` and is always solid.** Its per-character bloom needs each letter to be its own box animating its own opacity, and a `background-clip: text` fill paints from the *parent* — so under metal ink the spans inherit a transparent text fill, have no background of their own, and the label renders as nothing. Its gleam overlay is additive and draws from the same `--std-ink-lit`/`--std-hot` pair, so it still catches a near-white pass on the door.

- **Font sizing is normalized at the font, never per section** ([fontMetrics.ts](src/utils/fontMetrics.ts) + `injectFontFaceCSS` in [useFontManager.ts](src/composables/showcase/useFontManager.ts)): the showcase carries ~400 hard-coded `font-size` declarations (375 of them in `rem`, so no container-level scale variable can ever reach them), and a partner picks the family they render in. Two faces at the same `font-size` do **not** look the same size — cap height per em is the type designer's choice — and Khmer faces vary further because coeng subscripts and stacked diacritics push their ascent/descent far past a Latin face's. The fix is CSS `@font-face` descriptors (`size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`), which scale the glyphs **inside** the em box: `2rem` still computes to the same pixel value, no line box moves, and every existing declaration keeps working untouched.
  - **Two numbers multiply into one `size-adjust`.** `size_adjust` on the **font library** record is a fact about the typeface ("Moul renders 12% large"), set once and inherited by every template that picks it. `size_scale` on the **template's language × type row** is the partner's taste knob, and because those rows are already per-language it is also how a template says "Khmer a touch smaller" without touching its English. Both default to 1, so a template carrying neither renders byte-identically to before this existed. Backend fields are pending: [docs/backend-api-requirements/font-metric-normalization.md](docs/backend-api-requirements/font-metric-normalization.md)
  - **Do NOT add per-section font-size fields.** The cost is sections × languages × font slots, a partner cannot hold that in their head or preview it meaningfully, and every entry would be a workaround for a face that was never normalized. It would also permanently fork the responsive ladders (`--dd-scale` in [EventInfo.vue](src/components/showcase/EventInfo.vue)). The residue that a scale genuinely cannot fix is **containment** — a long name in a fixed frame — which is a measurement problem: use [AutoFitText.vue](src/components/showcase/host-layouts/shared/AutoFitText.vue), not a number. `CoverElementBox.fontScale` stays as-is; free-placement blocks do need per-block control.
  - **The CSS rule and the `FontFace` object must carry the same descriptors**, and both are keyed by family + URL in module-scope registries so a re-injection at a new size *replaces* rather than stacks — two faces under one family name with different `sizeAdjust` have no defined answer about which paints. The metric signature is also folded into the font cache key: family and URL are unchanged while a partner drags the size slider, so without it the preview freezes at the first size tried. `cleanup()` must clear those registries alongside removing the `<style>` tag.
  - Auto-calibration (`deriveSizeScale`) measures a probe glyph — `H` for Latin, `ក` for Khmer, deliberately *without* diacritics — against the reference face the showcase's sizes were tuned on (`METRIC_REFERENCE_FAMILY`: Inter for Latin, Kantumruy Pro for Khmer). Both faces must be loaded before measuring; canvas silently falls back to a generic family for one that is not, yielding a confidently wrong ratio.

- **Font library, and partner uploads** (`customFontsService` in [templates.service.ts](src/services/api/modules/templates.service.ts), studio controls in the **Fonts** section of [PartnerTemplateForm.vue](src/components/template/PartnerTemplateForm.vue)): one `CustomFont` library holds both staff-curated `source: 'system'` fonts and partner uploads. `GET /api/core-data/custom-fonts/` is **already scoped by the API** to what the caller may see — active system fonts, plus a partner's own uploads — so there is never a second "my fonts" request to merge in; `source`/`mine`/`search`/`ordering` only narrow it further. A partner may upload (`.ttf/.otf/.woff/.woff2`, ≤5MB, name unique **per partner** so two partners may both have a "Moul"), and may edit or delete only their own: a system font answers `403` and another partner's answers `404`, so `is_owner` is what gates every management control.
  - **`EventTemplateLanguageFont.font` is nullable, and null is a normal steady state** — deleting a library font nulls the reference on every template row that used it rather than removing the row, and the showcase then falls back to its own default for that language. So a null font reads as "System default", never "Unknown font"; the latter is reserved for an id that isn't in the library this account can see. Deleting also requires refetching the current template's rows, since one of them may have just been nulled.
  - **The parent template read expands `font` into the full object; the nested `/fonts/` endpoints return it as an integer id with the object under `font_detail`.** The studio reads fonts via `getTemplate()` (the expanded form) precisely so `startEditFont` can take `f.font?.id` directly.
  - **`font_type` gained `v2-body` and `v2-display`** — the scroll-story slots, kept apart from V1's four so a template's V1 type never leaks into V2 (`V2_FONT_TYPES` in [v2Theme.ts](src/composables/showcase-v2/v2Theme.ts)). They are offered in the picker but flagged, since V2 is still behind `VITE_SHOWCASE_TEMPLATE_VERSION`. **Cover blocks must NOT offer them**: `CoverElementBox.fontType` is narrowed to `CoverFontSlot` (V1's four) because the cover stage publishes a CSS variable only for those (`COVER_FONT_SLOT_VARS`), and a block pointed at a V2 slot would inherit nothing and render in no font. Drive that picker from `COVER_FONT_SLOT_VARS`' keys, never from `FONT_TYPE_LABELS`.

- **Showcase V2 scroll-story template** (currently wedding-only, gated by `VITE_SHOWCASE_TEMPLATE_VERSION=v2`; architected for more categories — see below):
  - GSAP + ScrollTrigger scroll-story presentation layer, split into a **category-agnostic engine** (`components/showcase-v2/core/`) reused by every category, and **category variants** (`components/showcase-v2/wedding/` today; `birthday/`, `housewarming/`, etc. follow the same shape later) that supply the cover gate, hero, and pinned "story" section plus their own theme/copy defaults.
  - **`ShowcaseV2Experience.vue`** (the orchestrator, stays at `showcase-v2/` root) resolves the active variant via `resolveV2Variant(eventType)` in [useV2CategoryVariant.ts](src/composables/showcase-v2/useV2CategoryVariant.ts) and renders `variant.CoverGate`/`variant.HeroSection`/`variant.StorySection` through `<component :is="...">`. This is the **only** place the orchestrator branches on category — every other section (agenda, venue, gallery, RSVP, guestbook, footer, progress dots, particle field) is rendered identically regardless of variant. `variant.deriveHeroProps(hosts)` supplies whatever extra props the variant's own cover/hero need (e.g. wedding's `coupleNames`) via `v-bind`, so the orchestrator never hardcodes a category-specific prop name.
  - **Theme**: colors/fonts are template-driven the same way V1's are — `resolveV2Colors()`/`useTemplateProcessor` in `v2Theme.ts` resolve `event.template_colors`/`event.template_fonts`, falling back to the **active variant's** default palette/fonts (e.g. wedding's "Storybook Romance": ivory/blush/sage/gold/charcoal, Cormorant Garamond + Karla, defined in `categories/wedding.data.ts`) for any color/font a template doesn't define. The 8 color slot names (`ivory`, `blush`, `gold`, …) are a **fixed design-token contract** shared by every category — `core/` components' `<style>` blocks reference these exact `--v2-*` CSS var names, so a new category only supplies new *values* for the same slots, never new names. Color lookup uses a `v2-*`-prefixed `TemplateColor.name` convention (`v2-ivory`, `v2-gold`, etc., see [docs/backend-api-requirements/showcase-v2-theming.md](docs/backend-api-requirements/showcase-v2-theming.md)); fonts reuse the existing `primary`/`secondary` `font_type` slots (body/display)
  - **Copy**: `v2Translations.ts` holds shared, category-neutral strings with generic defaults (e.g. `chapter_gift: 'Gift'`). A variant's translation file (`categories/wedding.data.ts`'s `WEDDING_TRANSLATIONS`) overrides specific keys with flavored wording (`'Wedding Gift'`) and defines wholly variant-only keys with no generic equivalent (`tying_knot`). `translateV2(key, lang, categoryTranslations?)` merges variant → shared → key-as-fallback. Components permanently tied to one category (the wedding cover/hero) import that variant's translations directly; reused `core/` components that need occasional flavor (`V2GuestbookSection`) accept a `categoryTranslations` prop from the orchestrator instead.
  - **Adding a new category** (e.g. birthday): create `components/showcase-v2/birthday/{V2CoverGate,V2HeroSection,V2StorySection}.vue`, a `composables/showcase-v2/categories/birthday.data.ts` (palette/fonts/translations/monogram fallback) + `birthday.ts` (assembles the `V2CategoryVariant`, mirroring `categories/wedding.ts`), then register it in `V2_CATEGORY_VARIANTS` in `useV2CategoryVariant.ts`. No changes needed to `core/` components, the orchestrator's wiring, or the theme/translation *mechanism* — only new variant data and 3 new leaf components.
  - New V2-native sections: envelope cover gate, hero (countdown + cursor parallax), pinned **3D scroll-storytelling** story pages, timeline-accordion agenda, snap-strip gallery, venue card, petal parallax field, progress dots, floating bottom tab bar, footer
  - Reuses only the V1 *form/logic* sections (RSVP, Payment, Comments, DressCode, YouTube) wrapped in V2 cards with the resolved V2 palette/font values passed as props
  - [src/components/showcase-v2/](src/components/showcase-v2/): `ShowcaseV2Experience.vue` orchestrator; `core/` = category-agnostic engine components; `wedding/` = the wedding cover/hero/story components
  - [src/composables/showcase-v2/](src/composables/showcase-v2/): `useScrollStory.ts` (gsap.matchMedia + context boilerplate — **all GSAP animations must be created through it** so cleanup/reduced-motion is automatic), `useCountdown.ts`, `v2Theme.ts` (generic theme mechanism + `deriveV2Monogram`), `v2Translations.ts` (shared copy + merge function), `useV2CategoryVariant.ts` (the category registry), `categories/` (one `{category}.data.ts` + `{category}.ts` pair per variant)
  - [src/plugins/gsap.ts](src/plugins/gsap.ts): the **only** place ScrollTrigger is registered — import `gsap`/`ScrollTrigger` from here, never from `'gsap'` directly. Deliberately not imported from `main.ts` so GSAP ships in the lazy showcase-v2 chunk, not the app entry
  - **Directional chapter snap + pin glide** ([ShowcaseV2Experience.vue](src/components/showcase-v2/ShowcaseV2Experience.vue)): a single `ScrollTrigger` with a custom `snap.snapTo` resolves the nearest chapter stop (centered if it fits the viewport, paged in viewport-sized steps if taller) in the direction of travel. Entering the pinned story stage ([wedding/V2StorySection.vue](src/components/showcase-v2/wedding/V2StorySection.vue)) is handed off to `glideThroughPin`, which drives the shared `ScrollTrigger` scroll tween (`trigger.tweenTo`, not a plain `gsap.to`) through the pin's full scrubbed timeline at a matched pace — a plain tween there fights the snap systems and yanks/stalls. `scrollToSection` (progress-dot nav) uses the same glide so dot clicks and organic scrolling land identically. `PIN_PLAY_DURATION` in the experience component must stay in sync with the story stage's own snap `duration.max`. The candidate-stop de-dupe filter collapses only near-duplicate stops within a **small fixed pixel gap** (24px) — keep it fixed, not viewport-relative (`vh * ...`): a vh-relative threshold silently drops the snap stop for any chapter whose centered point lands close to a neighbor's, which happens easily for short, back-to-back chapters (e.g. Gift between RSVP and Guestbook) and makes scrolling jump straight over them
  - **Floating bottom tab bar** ([core/V2FloatingActionBar.vue](src/components/showcase-v2/core/V2FloatingActionBar.vue)): replaces the reused V1 `FloatingActionMenu` (side crescent slide-out) for V2 — a fixed, centered pill bar of icon-only buttons (More, Music, Map, Gift, RSVP) with a hover/long-press tooltip and an overflow popover (other chapters + language/reminder) centered above the bar. No sign-in/sign-out option — the showcase no longer uses account sign-in from either quick menu. On touch devices only (`matchMedia('(hover: none) and (pointer: coarse)')`) it fades out on `scroll` and only reappears on a genuine `click` (a tap, not a scroll/drag gesture) — desktop/mouse users always see it
  - **Gold thread reveal** (wedding/V2StorySection.vue): the visible thread is a dotted path (`stroke-dasharray`) that can't animate via `strokeDashoffset` directly — that would march the dots instead of drawing the line. A solid path sweeps behind it inside an SVG `<mask>` to reveal the dots progressively. Curve coordinates are authored in a 100×100 design space and rescaled to stage pixels on mount/resize (`scaleThreadToStage`) so the stroke stays a uniform hairline without `vector-effect: non-scaling-stroke` (which has a Chromium dash-normalization bug that breaks the pathLength draw effect)
  - **Ring ornament hand-off** (core/V2Tunnel.vue + ShowcaseV2Experience.vue): the interlocked-rings ornament is a single persistent WebGL object, not a hero decoration plus a separate 2D icon in the story stage. `V2Tunnel` exposes `setRingLock(0→1)`, which blends the ring's world position every frame (in its render loop) between its natural drifting tunnel placement and a point computed fresh each frame via `camera.localToWorld(...)` a fixed distance in front of the camera — so at lock level 1 the ring rides along with the camera and stays visually pinned to screen-center. At lock level 1 with no fade yet (`frozen` in loop()), the tunnel's own scroll-driven fly-through (camera z/x/y + lookAt) is paused entirely, resuming the instant fade starts — the ring being screen-fixed relative to a *moving, swaying* camera still let it visibly drift over the length of the pin; stopping the camera outright makes every frame's position byte-for-byte identical. Locked-state size is also scaled by `camera.aspect` (down to a 0.22 floor) since the ring's world size was tuned for a landscape aspect and would otherwise eat a much bigger fraction of a narrow phone's width. The orchestrator locates the story stage's *live* pin `ScrollTrigger` (`ScrollTrigger.getAll().find(st => st.pin && ...)`, same technique `scrollToSection` uses) and drives lock-in over `pin.start - 90vh → pin.start`, so it finishes exactly as the pin begins — then `setRingFade(0→1)` dissolves it (and un-freezes the camera) over `pin.end → pin.end + 50vh` once the pin releases. Both are keyed off the pin's own start/end, not a page-scroll fraction or hero-relative offset, so the timing doesn't drift with page length (guest count, agenda size, …). There's no local ring element in `V2StorySection.vue` — the gold thread's reveal is timed independently and just happens to pause roughly where the locked ring sits (both converge near center by construction, not by pixel-matched coordination)
  - **Story chapter copy layout** (wedding/V2StorySection.vue): `welcomeText` renders as a subtitle directly under the chapter heading (both the pinned couple-stage header and the no-hosts flow header), not as its own passage — it reads as part of the invitation, not a separate block. The passages section below the couple stage holds only `descriptionTitle`/`descriptionText`; keep its top margin small (`clamp(20px, 4vh, 40px)`) so that invitation text stays visually anchored to the host photos above it instead of floating in a large gap
  - Version selection is currently env-only and category-based, not template-driven — see [docs/backend-api-requirements/showcase-template-version.md](docs/backend-api-requirements/showcase-template-version.md) for the pending backend field that will replace it

### Component Organization
- **Feature-based structure**:
  - `components/settings/`: Settings page components
  - `components/template/`: Template selection and management
  - `components/showcase/`: Event showcase components (stages, RSVP, payment, galleries)
  - `components/expense/`: Expense tracking components (budgets, categories, records)
  - `components/host/`: Host-related components
  - `components/agenda/`: Agenda item components
  - `components/invitation/`: Invitation management components
  - `components/common/`: Shared/common components
- Components use composition API with `<script setup>`
- TypeScript for type safety across all components

### Utilities & Helpers
- [src/utils/secureStorage.ts](src/utils/secureStorage.ts): Wrapper around localStorage with error handling
- [src/utils/sanitize.ts](src/utils/sanitize.ts): DOMPurify integration for XSS protection
- [src/utils/inputValidation.ts](src/utils/inputValidation.ts): Input validation utilities
- [src/utils/timezones.ts](src/utils/timezones.ts): Timezone handling
- [src/utils/translations.ts](src/utils/translations.ts): Translation utilities
- [src/utils/embedExtractor.ts](src/utils/embedExtractor.ts): Extract embed URLs from various formats
- [src/utils/performance.ts](src/utils/performance.ts): Performance monitoring utilities
- [src/utils/browserDetection.ts](src/utils/browserDetection.ts): Browser detection utilities
- [src/utils/budgetCalculations.ts](src/utils/budgetCalculations.ts): Budget and expense calculation utilities
- [src/utils/guestValidation.ts](src/utils/guestValidation.ts): Guest data validation utilities
- [src/utils/currency.ts](src/utils/currency.ts): Currency formatting utilities
- [src/utils/jwtUtils.ts](src/utils/jwtUtils.ts): JWT token parsing and validation

### Type Definitions
- [src/types/showcase.ts](src/types/showcase.ts): Comprehensive type definitions for showcase system
- API types organized by domain in [src/services/api/types/](src/services/api/types/):
  - `api.types.ts`: Core API types (ApiResponse, PaginatedResponse, QueryParams, ErrorData)
  - `event.types.ts`: Event, agenda, host, photo, collaborator, registration types
  - `guest.types.ts`: Guest, guest group, and invitation types
  - `expense.types.ts`: Budget, expense category, and expense record types
  - `payment.types.ts`: Payment method types
  - `template.types.ts`: Event template and asset types
  - `dress-code.types.ts`: Dress code types
  - `review.types.ts`: Event review types
- All components use proper TypeScript typing

## Important Development Notes

### Deployment & production environment

- **Deploy branch is `clean-production`.** Deploying = `git checkout clean-production && git merge main && git push origin clean-production`. Cloudflare Pages auto-builds the branch with `npm run build-cloudflare`. `main` is never deployed directly.
- **`clean-production` carries its own `.env`** (real API URL; testing-only toggles such as `VITE_SHOWCASE_TEMPLATE_VERSION` and `VITE_SERVICES_PORTFOLIO_PLACEHOLDER` deliberately removed so they stay off in production). A merge from `main` must never overwrite it — verify with `git diff origin/clean-production -- .env .env.example` after merging, and expect an empty diff.
- **The committed `.env` does not decide what production runs.** The deployed build takes its `VITE_*` values from the Cloudflare Pages project's environment variables, configured per-environment in the dashboard. So the value of a flag in the repo (e.g. `VITE_IMAGEKIT_ENABLED=false` in `clean-production`'s `.env`) is *not* evidence of what the live site does. Changing a production flag means changing it there, not in the repo. **The full production variable list is recorded in [docs/guides/FRONTEND_DEPLOYMENT_GUIDE.md](docs/guides/FRONTEND_DEPLOYMENT_GUIDE.md#13-environment-variables)** — check it before reasoning about live behaviour, and keep it updated when the dashboard changes.
- **Never set a secret as a `VITE_*` variable.** Vite inlines every referenced `VITE_*` value into the client bundle, where it is world-readable. Secrets belong in the Django backend only.

### Environment Variables
Required env vars (see [.env.example](.env.example)):
- `VITE_API_BASE_URL`: Backend API URL (default: http://127.0.0.1:8000)
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID
- `VITE_TELEGRAM_BOT_USERNAME`: Telegram bot username for login

Optional env vars:
- `VITE_GENERATE_SOURCEMAP`: Emit JS source maps in production builds (default: off). Enable for easier debugging of minified bundles; disable for public deploys to avoid shipping original source.
- ~~`VITE_TELEGRAM_BOT_TOKEN`~~: **Removed** — Telegram notifications now go through the backend (`POST /notifications/telegram/`). Token must be set as a server-side env var in Django only, never in the frontend.
- ~~`VITE_TELEGRAM_ADMIN_CHAT_ID`~~: **Removed** — same as above.
- `VITE_IMAGEKIT_ENABLED`: Enable ImageKit CDN image optimization (default: true, can toggle via `localStorage.setItem('imagekit_enabled', 'false')`)
- `VITE_ASSET_PROTECTION_ENABLED`: Enable asset protection in dev mode (default: false, auto-enabled in production)
- `VITE_SHOWCASE_ANIMATION_TYPE`: **Vestigial** — read by `getAnimationType()` but never reaches the showcase, because `CoverStage` resolves the type as `props.animationType || 'decoration'` before that fallback can apply. The live selector is the template field `template_assets.cover_stage_layout.showcaseAnimationType` (`decoration` default, or `door`), editable in the partner template form. Each value picks both the cover animation *and* its paired transition stage: `decoration` → decorations slide out + `TransitionStage.vue` (veil reveal), `door` → cover splits into swinging panels + `TransitionStageDoor.vue` (curtain-and-cartouche). See §16 of the `goevent-design` skill.
- `VITE_SHOWCASE_CONTENT_WIDTH`: **Temporary, for visual testing only** — widens the main-content liquid glass card and shrinks its inner horizontal padding. Options: `standard` (default), `wide`. Will be replaced by a `template_assets` backend field (mirroring how `showcase_animation_type` evolved from an env-only toggle into a template-driven prop).
- `VITE_SHOWCASE_TEMPLATE_VERSION`: **Temporary, for visual testing only** — `v2` renders the new GSAP-driven "Storybook Romance" scroll-story showcase for **all wedding-category events**; `v1` (default) keeps the existing cover/transition/main-content showcase. Will move to backend event template data later (same evolution path as `showcase_animation_type`).
- `VITE_SERVICES_PORTFOLIO_PLACEHOLDER`: **Visual testing only** — when `true`, vendors with no uploaded listing photos get a category-themed placeholder portfolio on their storefront page (`/services/vendors/:id` hero slideshow + portfolio strip). Default: off. Real vendor portfolios are aggregated from listing cover images + gallery media; a dedicated backend portfolio field may replace this later.

### Authentication Flow
1. User authenticates via email/password, Google OAuth, or Telegram
2. Backend returns `{ tokens: { access, refresh }, user }`
3. Tokens stored in secure storage, user data in Pinia store
4. Access token auto-injected in API requests via `getAuthHeaders()`
5. Route guards validate tokens on protected routes
6. Token refresh handled automatically by `authService.ensureValidToken()`

### Backend Testing Credential
Email: admin@goevent.com
Password (local): 123123123@
Password (production): 2025Password@admin

### API Response Format
All API responses follow this structure:
```typescript
{
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}
```

Field-specific errors come as: `{ "field_name": ["Error message"] }`

### Working with Events
- Events use string IDs (UUIDs from backend)
- Full event data includes nested relations: hosts, agenda, photos, collaborators, registrations
- Use `eventsService.getEvent(id)` for detailed event data
- Use `eventsService.getEvents(filters)` for paginated lists
- Event updates support both JSON and FormData (for file uploads)

### Media/File Uploads
- Use FormData for file uploads (images, videos, QR codes)
- API client has dedicated methods: `postFormData`, `putFormData`, `patchFormData`
- Media URLs returned by API may be relative - use `apiClient.getProfilePictureUrl()` for full URLs
- Bulk upload supported for photos (up to 50 per request)
- File validation handled by upload utilities in [src/services/upload.ts](src/services/upload.ts)

### Showcase System Development
- Showcase uses template-driven rendering with dynamic font/color loading
- Video resources are carefully managed to avoid memory leaks
- Multi-language support requires proper translation data structure
- Guest names can be passed via URL params for personalization
- Template assets cached using composables

### Partner Credit Packs

Replaced the commission system, which was removed in August 2026 — do not reintroduce
referral/commission UI without checking the current business model first. `Event.referrer`
survives the removal because it still drives partner branding on the showcase
([MainContentStage.vue](src/components/showcase/MainContentStage.vue)); it no longer pays anyone.

A **shop partner** buys credits at wholesale for one specific pricing plan, then spends one per
event at template-activation checkout. The partner owns the event and sets up the invitation on
behalf of their customer, so the partner is the organizer *and* the payer — the customer has no
account, and appears only as an event `host`.

- Service: `partnerCreditsService` ([credits.service.ts](src/services/api/modules/credits.service.ts)), types in [credit.types.ts](src/services/api/types/credit.types.ts)
- State: [usePartnerCredits.ts](src/composables/settings/usePartnerCredits.ts) — catalogue, balance and orders fetched together; a `403` means "not a partner", not a failure
- Buying: `/credits` ([CreditsView.vue](src/views/CreditsView.vue) wrapping [CreditsTab.vue](src/components/settings/CreditsTab.vue)), linked from the profile menu of **every signed-in account** — the link is deliberately *not* gated on `is_partner` (see below). Deliberately **not** a Settings tab — Settings is one page every account sees
- **Becoming a partner**: the non-partner half of `/credits` is an application, not a dead end. It has four shapes — never asked, pending, rejected, and approved-but-still-403 — driven by [usePartnerRequest.ts](src/composables/settings/usePartnerRequest.ts) and [PartnerRequestDrawer.vue](src/components/settings/credits/PartnerRequestDrawer.vue). **This is why the nav link is ungated in all three menus** ([TopNavBar](src/components/TopNavBar.vue), [MobileTabBar](src/components/MobileTabBar.vue), [AppSidebar](src/components/AppSidebar.vue)): gating it on `is_partner` — as it was, and on a vendor profile before that — hid the application from the only people who need it. No wholesale pricing leaks, because the catalogue is behind the API's 403, not behind the link. The backend endpoints are **pending** ([docs/backend-api-requirements/partner-access-request.md](docs/backend-api-requirements/partner-access-request.md)); until they land a `GET .../me/` `404` is read as "never applied" (identical to a missing endpoint, and the same screen is right for both) and a `404`/`405` on the POST surfaces "requests aren't open yet, contact us" rather than a generic failure. `can_reapply` is the server's call and is never inferred from `status`
- **Partner ≠ vendor.** Buying credits and spending one at activation are gated on the account's `is_partner` flag alone; the backend dropped its vendor-profile requirement on 2026-08-23. A partner with no storefront is a valid customer, so anything deciding whether to offer credits reads `authStore.user?.is_partner` — never `useVendorProfile`, which answers a different question (does this account sell services on the marketplace)
- Spending: [PaymentDrawer.vue](src/components/template/PaymentDrawer.vue) calls `/activation-options/?pricing_plan_id=` on open and offers a credit when one covers that plan. A credit-funded payment posts `pay_with_credit: true` with no amount/method/proof and returns `confirmed` — branch on the returned `status`, never on price
- Credits are **plan-scoped and not interchangeable**; a pack's price is coupled to current plan prices
- `/activation-options/` is the one endpoint here that is *not* partner-gated, so the shared checkout calls it unconditionally and a normal user simply gets `credit: null`

### Expense Tracking System
- Three-tier expense tracking: Categories → Budgets → Expense Records
- Real-time budget calculations with spent/remaining amounts
- Quick add modal for rapid expense entry ([components/expense/QuickAddModal.vue](src/components/expense/QuickAddModal.vue))
- Budget calculations handled by [src/utils/budgetCalculations.ts](src/utils/budgetCalculations.ts)
- Services: `expenseCategoriesService`, `expenseBudgetsService`, `expensesService`

### Guest Management System
- Centralized guest state management via `guestManagement` Pinia store
- Optimistic UI updates for better UX during network operations
- Local filtering and searching for responsive guest list interactions
- Guest group organization with stats tracking
- Bulk operations supported (import, export, invitation sending)
- Validation utilities in [src/utils/guestValidation.ts](src/utils/guestValidation.ts)
- Services: `guestService`, `guestGroupService`
- **Table seating** ([src/components/invitation/SeatingTablesView.vue](src/components/invitation/SeatingTablesView.vue)): drag-and-drop or tap-to-select board for assigning guests to tables, with bulk assign, seat number entry, and a guest-facing seat display on the showcase RSVP flow
  - `TableFormModal.vue` / `TableDetailModal.vue`: create/edit tables and manage seated guests per table
  - Service: `tablesService` ([src/services/api/modules/tables.service.ts](src/services/api/modules/tables.service.ts))
  - Fully localized via `management.seatingView.*` i18n keys (en/kh)

### Testing
- Unit tests use Vitest with Vue Test Utils
- E2E tests use Playwright — see **[docs/guides/PLAYWRIGHT.md](docs/guides/PLAYWRIGHT.md)**
- Test files co-located with components (`.spec.ts` or `.test.ts`); E2E specs live in [e2e/](e2e/)

**Playwright: browsers are already installed — never run `npx playwright install`.** That command
hangs on this machine: it finishes the download, then deadlocks before extracting, leaving a
0-byte `chrome.dll` and no `INSTALLATION_COMPLETE` marker. Playwright then treats the install as
broken and demands a reinstall on every later run — which hangs again. Just run `npm run test:e2e`.
If browsers genuinely need repair, use `npm run test:e2e:install`
([scripts/install-playwright-browsers.ps1](scripts/install-playwright-browsers.ps1), idempotent,
downloads + extracts in seconds).

Other things worth knowing before writing E2E tests:
- Import `test`/`expect` from [e2e/fixtures.ts](e2e/fixtures.ts), which adds `consoleErrors`
  capture, a backend `stubApi`, and `waitForAppMount`
- **Never scope an API stub with a path glob like `**/api/**`** — under Vite dev it matches the
  app's own module URLs (`/src/services/api/core/ApiClient.ts`) and answers its JavaScript with
  JSON, so the app never mounts. Scope stubs to the backend *origin*
- Chromium only (desktop + Pixel 7 projects); headless by default, `HEADED=1` to watch
- The HTML reporter is set to `open: 'never'` because the default auto-opens a blocking report
  server; read reports with `npm run test:e2e:report`

### Build Optimization
- Vite config optimized for Cloudflare Pages deployment
- Manual code splitting configured for vendor, UI, auth, and styles
- CSS code splitting enabled
- Small assets inlined as base64
- Production builds use esbuild minification

### Error Handling
- API layer provides user-friendly error messages
- Network state monitored with offline detection
- Components should use error boundaries for resilience
- Auth errors automatically clear invalid tokens

### Security Considerations
- All user input sanitized with DOMPurify before rendering
- XSS protection via input validation utilities
- CSRF protection via `X-Requested-With` header
- Sensitive routes validate tokens server-side
- Auth tokens stored in secure storage with proper cleanup

## Path Aliases
- `@/` maps to [src/](src/) directory (configured in [vite.config.ts](vite.config.ts))

## Styling
- Tailwind CSS with custom theme extensions ([tailwind.config.js](tailwind.config.js))
- Custom color palette (primary green/blue, extended purple)
- Custom breakpoints: 2xl (1536px), 3xl (1920px), 4xl (2560px)
- Custom font: Figtree, Kantumruy Pro
- Tailwind forms plugin included
- **Design standard**: [DESIGN.md](DESIGN.md) — brand identity (logos, brand colors), color system, typography, layout, motion, accessibility, and the definition-of-done checklist. The binding standard for all UI.
- **Design system recipes**: [.claude/skills/goevent-design/SKILL.md](.claude/skills/goevent-design/SKILL.md) — component-by-component Tailwind class recipes (navigation, buttons, cards, forms, drawers, modals, toasts, loading/empty states, z-index layers, and animation patterns including the showcase transition stages). Follow it for all UI implementation.
- **Neutral palette is `slate` only** — the codebase was fully migrated from `gray-*` to `slate-*` (July 2026); never reintroduce `gray`/`zinc`/`neutral`/`stone` utilities
- Brand gradient: `bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]` (raw hex form is the convention)
- Light mode only — no dark-mode variants

## Important Implementation Patterns

### Composables
- Keep composables focused and single-purpose
- Export clear interfaces from composables
- Use composables for shared logic across components
- Composables can access stores but should remain testable

### Component Communication
- Props down, events up
- Use Pinia stores for global state
- Emit events with proper TypeScript types

### Performance
- Use dynamic imports for route-level code splitting
- Lazy load heavy components (media viewers, modals)
- Optimize images before upload when possible
- Use IntersectionObserver for lazy loading sections
- Monitor video memory usage in showcase system

### Accessibility
- Use semantic HTML elements
- Include ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers when possible
