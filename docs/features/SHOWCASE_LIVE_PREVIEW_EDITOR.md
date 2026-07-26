# Showcase Live Preview + Inline Editor — Implementation Notes

**Status: superseded for new work by [SHOWCASE_PREVIEW_EDITOR_PLAN.md](SHOWCASE_PREVIEW_EDITOR_PLAN.md)** — the July 2026 refactor moved these files into a feature module (`src/components/showcase-preview/{edit,bridge,editors,renderers}/`), extracted the save layer, added a preview-renderer registry, and added media edit intents (logo, gmap embed, host image, photos) handled by full-size parent-side editors. File paths below reflect the original implementation; see the plan doc for current locations and the progress checklist. The architectural rationale in this doc (iframes, CoverStage layering, inert shields, inline-edit provide/inject) still applies unchanged.

## Overview

A new **"Live Preview"** tab on the event manage page (`EventManageView.vue`, tab id `showcase-preview`, sidebar icon `monitor`, between "Showcase" and "Template & Payment") shows the real public showcase — split into 3 stacked mobile-sized frames (Cover / Transition / Main Content), like pages of a document — with text directly click-to-edit, Photoshop-style, saving through the same APIs the existing form tabs (Event Texts, Hosts, Agenda, Dress Code) already use.

Scope: **V1 showcase only** (the classic cover → transition → main-content pipeline in `src/components/showcase/`). The V2 "Storybook Romance" scroll-story showcase is a structurally different rendering model and is out of scope — see [showcase-template-version.md](../backend-api-requirements/showcase-template-version.md).

## Architecture

### Why iframes, not directly-mounted components

The first implementation attempt mounted `CoverStage`/`MainContentStage` directly inside a `div` scaled down with `transform: scale()`. This broke visually: the showcase components (`VideoContainer.vue`, `MainContentStage.vue`, host/agenda layouts, `PhotoGallery.vue`, etc.) size things with raw `100vh`/`100vw` CSS units, which always resolve against the *real browser viewport*, not a transformed ancestor. Content rendered at real-viewport size and got clipped by the scaled box.

The fix: each frame is a same-origin `<iframe>` pointed at a **new dedicated route**, `/events/:id/showcase-preview-frame?stage=cover|transition|main`, rendered by [`src/views/ShowcasePreviewFrameView.vue`](../../src/views/ShowcasePreviewFrameView.vue). The iframe's actual CSS size is a real mobile viewport — **390×844px** (iPhone 12/13/14 dimensions) — so `100vh`/`100vw` inside it resolve exactly like they would on a guest's phone. [`src/components/showcase-preview/PreviewFrame.vue`](../../src/components/showcase-preview/PreviewFrame.vue) then visually shrinks that iframe from the *outside* via `transform: scale(S)` (computed to fit both the available tab width and the visible viewport height), which doesn't affect the iframe's internal viewport at all — this is the standard "device preview" trick.

Cover and Main Content **both render through `CoverStage`** (mirroring `EventShowcaseRefactored.vue` exactly — `current-showcase-stage` forced to `'cover'` or `'main_content'`), because `MainContentStage` has no background of its own; in production it's slotted inside `CoverStage` and relies on `CoverStage`'s always-rendered `VideoContainer` for the background image/video. Mounting `MainContentStage` standalone silently drops that background — this was a real regression caught mid-build, not a hypothetical.

### Data pipeline

`useEventShowcase()` ([`src/composables/useEventShowcase.ts`](../../src/composables/useEventShowcase.ts)) now accepts optional `{ eventId, skipMetaTags }`. With no args (the real `/events/:id/showcase` route's call site) behavior is byte-identical to before. The frame view calls it with `skipMetaTags: true` since it owns its own `document.title`/meta tags separately from the manage page.

### Blocking interaction (read-only frames)

[`src/components/showcase-preview/InertIframe.vue`](../../src/components/showcase-preview/InertIframe.vue) wraps each iframe with a transparent shield `<div>` that:
- Blocks all clicks/taps from reaching the real showcase page inside the iframe. This matters beyond UX — `RSVPSection.vue` calls `eventsService.rsvpForEvent()` directly, so an unshielded preview could let someone accidentally submit a real RSVP, open the real Google Maps link, or start audio/video while just browsing the manage page.
- Still forwards scroll: the shield maps wheel/touch deltas into the iframe's own coordinate space (correcting for the current preview scale factor), finds whichever scrollable ancestor sits under the cursor via `elementFromPoint` (the showcase's real scroll container is a nested `overflow-y-auto` div, not the iframe's window/document — the outer stage is deliberately `overflow: hidden`), and scrolls that element directly.
- Optionally supports a `click-message` prop: clicking posts `{ type: clickMessage }` into the iframe via `postMessage` — used by the Transition frame to replay its animation (see below) without allowing any other interaction.

### Transition frame: freeze + replay

`TransitionStage.vue` gained an opt-in `freeze-at-peak` prop: the mount timeline runs normally (photo veil-lift, footer scrim, "Save the Date" letter-bloom, date track-in) but the fade-out/`transitionComplete` timers are never scheduled, so it holds indefinitely at the fully-revealed state. The live showcase never passes this prop. The preview frame passes it, and clicking the frame (via `InertIframe`'s `click-message="showcase-preview-replay"`) posts a message that `ShowcasePreviewFrameView.vue` catches and uses to bump a `:key` on `TransitionStage`, remounting it to replay the whole sequence.

### Inline editing (click-to-edit)

Wiring uses **provide/inject**, not prop-threading, to keep the diff to the shared showcase components minimal and to guarantee zero behavior change on the public showcase page:

- [`src/components/showcase-preview/inlineEditContext.ts`](../../src/components/showcase-preview/inlineEditContext.ts) — defines `InlineEditKey` (a Vue `InjectionKey`) and `InlineEditTarget`, a discriminated union covering the four save shapes: `eventText` (upsert by `text_type` + language), `host` (patch by host id), `agenda` (patch by agenda item id), `dressCode` (patch by dress code id).
- [`src/components/showcase-preview/InlineEditableText.vue`](../../src/components/showcase-preview/InlineEditableText.vue) — the reusable wrapper. `inject(InlineEditKey, undefined)`: if nothing was provided (i.e. the real public showcase, or a read-only preview viewer), it renders `<slot />` completely bare — no extra DOM, no behavior change. If a context *is* provided, view mode renders the slot content plus a hover outline + pencil affordance; clicking swaps to an `<input>`/`<textarea>` styled to match, with Enter/blur committing and Esc cancelling (in the multiline field Enter inserts a line break and Ctrl/Cmd+Enter commits).

  The field is a **measured mirror** of the text it replaces, not an approximation: on click, `measureDisplay()` reads the live computed typography (font family/size/weight/style, letter- and word-spacing, line-height, text-transform, colour) off the element that actually paints the glyphs, and the geometry (width, horizontal offset, padding, text-align, wrap/hyphenation rules) off the block box that text wraps inside, then applies both as inline styles. Typography and geometry are sourced separately on purpose — the animated showcase text wraps every word in its own `<span>`, and `AutoFitText` writes its fitted font-size onto an inner span rather than the container, so the box and the type source are usually different elements. The `input-style` prop survives only as a fallback for whatever measurement can't resolve. The edit affordance is drawn with `outline` rather than `border` (a border would shrink the content box and move the wrap points), and the textarea auto-grows to its content so it breaks across the same lines as the rendered text. The field's backing plate is picked from the mirrored text's own luminance (light type gets a dark plate, everything else a light one) — with the text colour now copied verbatim, a fixed white plate made the calendar design's white-on-map location header an invisible field. The one deliberate deviation from the rendered text is iOS, which zooms the page whenever a focused field computes under 16px — a font-size floor is applied there and nowhere else.

  For that mirror to mean anything, the rendered text has to honour the line breaks typed into the field: the word-by-word reveal in `EventInfo.vue` and `HostMessageSection.vue` splits with `splitToLines` + `<br>` (staggering across breaks via the shared `getGlobalWordIndex`) rather than flattening on `/\s+/`.
- `ShowcasePreviewFrameView.vue` provides the context **only** when the route has `?editable=1`, and owns a single `handleInlineSave(target, value)` that switches on `target.kind` and calls the matching real service (`eventTextsService`, `hostsService.patchHost`, `agendaService.patchAgendaItem`, `dressCodeService.updateDressCode`), then mutates the loaded `showcaseData` in place so the preview reflects the change without a refetch. The EventText path replicates `EditEventTextDrawer.vue`'s exact find-or-create-or-delete-by-`(text_type, language)` upsert rule (PATCH if a row exists, POST if not and non-empty, DELETE if cleared to empty) — **not yet extracted to a shared util**, see gaps below.
- `ShowcasePreviewTab.vue` only sets `editable=1` on the frame URL when `props.canEdit` is true (same `event.can_edit` permission gate as every other management tab). A hand-crafted `?editable=1` URL gains nothing regardless — the backend enforces permissions on every save call independent of this flag.
- In edit mode, `InertIframe`'s shield is dropped entirely (`interactive` prop) so real clicks/keyboard reach the iframe. Instead, `ShowcasePreviewFrameView.vue`'s `.preview-editable-mode` CSS disables every live interactive element (`a`, `button`, `input`, `textarea`, `select`, `iframe`, `[role=button]`, `audio`, `video`) except elements carrying the `.inline-edit-control` class (the editable text controls themselves) or living inside a `[data-preview-safe]` region — used on `DressCodeSection.vue`'s time-period/gender tabs so every dress-code record stays reachable for editing even though nothing else in that frame is clickable.

### Editable fields (current coverage)

| Field | Save target | Leaf component |
|---|---|---|
| Cover header / "You're Invited" | EventText `cover_header` / `invite_text` | `cover/CoverContentRows.vue` |
| Welcome message | EventText `welcome_message` | `host-layouts/shared/WelcomeHeader.vue` |
| Description title/text | EventText `description` (title/content) | `EventInfo.vue` |
| Location text | EventText `location_text` | `EventInfo.vue` (both panel and calendar designs) |
| Thank-you / Sorry message title+content | EventText `thank_you_message` / `sorry_message` | `HostMessageSection.vue` |
| Host name, title, parent A/B names | Host PATCH | `host-layouts/HostInfoWedding.vue` (simple + standard designs) |
| Agenda item title | AgendaItem PATCH | `AgendaItem.vue` |
| Dress code title/description | DressCode PATCH | `DressCodeSection.vue` |

`invite_text` was previously rendered on the cover but absent from `EVENT_TEXT_SLOTS` (`src/utils/eventTextSlots.ts`) — added as part of this work, so it's now also editable from the existing Event Texts form tab, not just the new preview.

## Known gaps / next steps

- **No error feedback on save failure.** `InlineEditableText.commit()` calls the injected `save()` and swallows the result other than stopping the "saving" spinner state — since the displayed value is always the parent's real data (never a duplicated local copy), a failed save just silently reverts to showing the unchanged value with no toast/message explaining why. Needs a toast surface, probably threaded back up from `ShowcasePreviewFrameView.vue`'s `handleInlineSave`.
- **EventText upsert logic is duplicated**, not shared. `ShowcasePreviewFrameView.vue`'s `saveEventText()` reimplements the same find-or-create-or-delete-by-`(text_type, language)` rule already in `EditEventTextDrawer.vue`. Extracting it to a shared util (e.g. `src/utils/eventTextUpsert.ts`) was flagged during planning as a nice-to-have so the two editors can't drift — not done yet.
- **Transition frame has no inline-editable fields.** It only shows the event's featured photo + formatted date (no EventText slot backs either), so it's replay-only, not edit-capable. If a future ask wants the date editable there, it'd need to write to `Event.start_date` directly (a different save shape than the four above) or a new EventText slot.
- **No automated test coverage** for any of the new components (`PreviewFrame`, `InertIframe`, `InlineEditableText`, `ShowcasePreviewFrameView`) or the inline-edit save paths — verified manually only (type-check + lint + manual click-through per iteration).
- **Combining the Showcase (forms) tab and Live Preview tab was explicitly decided against** in favor of click-to-edit on the preview — the forms tab remains the only way to manage things editing can't cover (photo uploads, ordering, dress-code images, music, logos).
- Frame native size (390×844) is fixed — no UI to preview at other device sizes/orientations.

## Key files

- `src/router/index.ts` — new route `event-showcase-preview-frame`
- `src/views/ShowcasePreviewFrameView.vue` — renders one forced stage; owns the inline-edit save handlers and the interactive-mode CSS lockdown
- `src/components/ShowcasePreviewTab.vue` — the manage-page tab; owns the 3 `PreviewFrame`/`InertIframe` pairs, language switcher, and `canEdit`-gated `editable=1` URL param
- `src/components/showcase-preview/PreviewFrame.vue` — scaled-mobile-viewport wrapper (fit-to-width-and-height)
- `src/components/showcase-preview/InertIframe.vue` — click-blocking + scroll-forwarding shield, with an `interactive` escape hatch for edit mode
- `src/components/showcase-preview/InlineEditableText.vue` + `inlineEditContext.ts` — the click-to-edit primitive
- `src/composables/useEventShowcase.ts` — `eventId`/`skipMetaTags` options addition (backward compatible)
- `src/components/showcase/TransitionStage.vue` — `freeze-at-peak` prop addition

## Verification performed

Type-check (`vue-tsc --noEmit`) and lint were run after each change and are clean on every touched/new file (a few pre-existing, unrelated errors remain elsewhere in the codebase — confirmed via baseline diff, not introduced by this work). Manual browser verification was done by the user at each iteration (screenshots) rather than automated, since installing the Playwright browser binary was declined.
