# Showcase Preview Editor — Architecture Plan & Progress Anchor

**Status: living document — Phases 1 & 2 implemented 2026-07-22** (foundation refactor + media
edit intents with silent in-place refresh; manual browser click-through still pending). Phase 3
items remain open. This is the agreed target architecture for evolving the manage-page
"Live Preview" tab into the primary GUI for editing the showcase. Check items off as they land —
this doc is the anchor for how much has been achieved.

**2026-07-24 — Design Studio merge.** The manage page's Showcase (`media`), Live Preview
(`showcase-preview`), and template-browsing surfaces were merged into one `design-studio` tab
(`ShowcasePreviewTab.vue`, still living at this path). It gained a side-panel mode toggle —
`content` mounts `EventMediaTab.vue` wholesale (new `compactLayout` prop keeps its photo grids
usable in a ~420px column); `templates` mounts a new `templates/TemplateStagingPanel.vue` that
reuses `BrowseTemplateModal.vue`'s own composables/components for browsing, but stages a clicked
template as a **live, non-destructive preview** instead of selecting-then-modal-confirming: it
fetches `getPublicTemplateAssets` and broadcasts the result to every mounted frame via a new
`preview-template` bridge message, handled frame-side by `setStagedTemplatePreview` (a
`force: true` variant of `applyPreviewTemplateFallback` in `useEventShowcase.ts` that also
overwrites `template_colors`/`template_fonts`, since those computeds are read before
`template_assets.colors/fonts`). Reverting needs no dedicated bridge message — the existing
`refresh` message already re-fetches real data wholesale, which naturally clears the staged
override. `template-payment` (payment/billing) stays a separate, unmerged tab; the Templates
panel only cross-links to it via a `go-to-payment` emit. See `TemplateStagingPanel.vue` and the
`stagedTemplateData` handling in `ShowcasePreviewTab.vue` for the concrete wiring.

**2026-07-27 — Optimistic saves, scoped refresh, local try-on revert.** Three data-flow fixes,
prompted by the inline editor feeling slow/flickery in practice:
1. **Optimistic inline-edit saves.** `useShowcaseEditSaves.ts`/`eventTextUpsert.ts` now mutate the
   local `showcaseData` copy *before* awaiting the PATCH/POST/DELETE (rolling back on failure)
   instead of after. `InlineEditableText.commit()` flips out of edit mode synchronously, so
   mutating only on success meant the display briefly re-rendered the stale value for the
   round-trip's duration before jumping to the new one — a flash on every save. Mutating first
   keeps both changes in the same synchronous tick.
2. **Refresh scoped to visible frames.** `onEditorSaved()` (parent-side editor saves — host image,
   embeds, agenda, dress code, payment, photos) used to post `refresh` to *every* mounted frame,
   including ones hidden by desktop's "single" focus mode or not the mobile sheet's current stage
   — each triggering its own full showcase re-fetch. Hidden/inactive frames are now marked stale in
   `ShowcasePreviewTab.vue` and only refetched once actually shown (`catchUpFrame`); the mobile
   sheet reports its active stage up via a new `active-frame-changed` emit so this works there too.
3. **Local try-on revert.** Cancelling a staged template try-on (closing the browse modal without
   confirming, the docs above previously said this "needs no dedicated bridge message — the
   existing `refresh` message already re-fetches real data wholesale") turned out to cost a real
   full showcase re-fetch just to undo a client-side-only overlay. `useEventShowcase.ts` now
   snapshots the real `template_assets`/`colors`/`fonts` the first time a try-on is staged, and a
   new `preview-template-clear` bridge message (`clearStagedTemplatePreview`) restores that
   snapshot locally, no request — since the try-on never touched the backend, undoing it doesn't
   need to either.

Separately verified live: the backend's `public_template_assets` gap (see
[public-template-assets-decorations.md](../backend-api-requirements/public-template-assets-decorations.md),
already marked done there) is confirmed fixed — the endpoint now returns the border/frame
decoration + guest-title-frame fields matching the paid showcase endpoint field-for-field. The
stale "known gap" comment in `ShowcasePreviewFrameView.vue` referencing this has been updated.

Prerequisite reading: [SHOWCASE_LIVE_PREVIEW_EDITOR.md](SHOWCASE_LIVE_PREVIEW_EDITOR.md) — the
implementation notes for what already shipped (iframe frames, click-to-edit text). This plan
builds directly on that foundation and supersedes parts of its "Known gaps / next steps" section.

## Goal

The Showcase (forms) tab and the Live Preview tab are two halves of one workflow: configure, then
see. Today the preview only click-to-edits **text**. The goal is **full showcase editing from the
preview** — replace logo, Google-Maps embed, event photos, host images, music, etc. — plus room
for **multiple template renderers** (V1 wedding today; V2 scroll-story and other categories later)
without rework.

## The two growth axes (and why the architecture separates them)

1. **What can be edited** — text (shipped) → media, embeds, photo gallery, music.
2. **What renders the preview** — V1 cover/transition/main (shipped) → V2 scroll-story,
   per-category variants.

The pre-refactor code entangled both inside `ShowcasePreviewFrameView.vue` (hardcoded V1 stages +
inline save logic). Target: adding an edit capability never touches renderer files; adding a
renderer never touches edit-layer files.

## Decision 1 — media edits happen in the *parent* page, not inside the iframe

Text stays inline (`InlineEditableText`). Media edits need real UI (file pickers with crop, URL
validation, gallery management) — inside a 390×844 iframe scaled to ~40 %, any modal is unusably
tiny. So the frame emits **edit intents** over a typed `postMessage` bridge; the parent manage
page catches them and opens the **existing full-size editors**:

| Intent | Parent-side editor (reused, not rebuilt) | Save path |
|---|---|---|
| Replace logo | hidden file input + `useMediaUpload('logo_one')` | `eventsService.updateEventWithFiles` (FormData) |
| Google-Maps embed | compact modal reusing `embedExtractor.ts` extraction | `eventsService.patchEvent({ google_map_embed_link })` (same as `EmbedsSection.vue`) |
| Host image | `EditHostDrawer.vue` (`modelValue`, `eventId`, `host`) | its own save flow (crop included) |
| Event photos | `UploadMediaDrawer.vue` (`eventId`) for uploads; gallery manage is a later item | `mediaService` |
| Agenda item (edit/add) | `EditAgendaDrawer.vue` (`item?`, `existingAgendaItems`) + `DeleteConfirmModal` for its `delete` emit | `agendaService` create/update/delete (multi-language translations included) |
| Agenda day-group date | `EditDateGroupModal.vue` via `useDateGroupOperations` | `agendaService.bulkUpdateDate` |
| Music / banner / video (later) | `useMediaUpload` field variants | FormData PATCH |

After a parent-side save the parent posts a `refresh` message into every frame → frames refetch
(`loadShowcase()`), and the tab emits `event-updated` upward so `EventManageView` and sibling tabs
stay fresh (same contract as `EventMediaTab`).

Because the preview *invokes* the forms' own editors instead of duplicating them, the two surfaces
can't drift. (This softens the earlier "keep tabs fully separate" decision recorded in the shipped
doc — the forms tab remains the fallback/primary for bulk work.)

## Decision 2 — a preview-renderer registry, mirroring the V2 category-variant pattern

`resolvePreviewRenderer(ctx)` returns a descriptor; the tab renders whatever frames it declares
(V1: cover / transition / main; a V2 renderer will declare different pages; a category may drop
the transition):

```ts
interface PreviewFrameDescriptor {
  id: string                    // becomes the ?stage= query param
  labelKey: string              // i18n key for the frame label
  editable: boolean             // gets ?editable=1 when the user can edit
  clickMessage?: string         // frames that replay on click (transition)
  isVisible?: (ctx) => boolean  // e.g. transition only for basic-wedding + featured photo
}
interface PreviewRendererDescriptor {
  frames: PreviewFrameDescriptor[]
  FrameComponent: Component     // renders ONE frame given the forced stage id
}
```

`ShowcasePreviewFrameView.vue` becomes a thin shell (load data → resolve renderer → provide edit
context → mount `FrameComponent`). Version/category resolution must eventually be **shared with
the public showcase route** so both flip together when the backend template-version field lands
(see [showcase-template-version.md](../backend-api-requirements/showcase-template-version.md)).

## Decision 3 — two edit primitives, both inert-by-default

Both render a bare `<slot />` when no context is injected, so the public showcase page is
byte-identical and V2 components can adopt them ahead of time at zero cost:

- **`InlineEditableText`** (shipped) — commits text in place via the injected save context.
- **`EditableRegion`** (new) — overlays a hover/tap affordance ("Replace logo", "Edit map") on any
  image/embed area; click posts an `EditIntent` through the bridge to the parent. No in-frame UI.

## Target file tree

```
src/components/showcase-preview/
  ShowcasePreviewTab.vue          ← moved from components/ root; iterates renderer.frames;
                                    hosts PreviewEditorHost; accepts :event-data + emits event-updated
  PreviewFrame.vue                (unchanged)
  InertIframe.vue                 (unchanged; click-message now typed via bridge constants)
  bridge/
    previewBridge.ts              typed postMessage protocol: frame→parent edit-intents,
                                    parent→frame replay/refresh; origin-checked type guards
  edit/
    editContext.ts                ← renamed from inlineEditContext.ts; adds EditIntent union +
                                    EditIntentKey ("request an edit" context for EditableRegion)
    InlineEditableText.vue        ← moved
    EditableRegion.vue            new media/embed affordance primitive
  editors/
    PreviewEditorHost.vue         parent-side switchboard: intent → existing drawer/modal/input
    GmapEmbedModal.vue            compact URL-entry modal (only genuinely new editor UI)
  renderers/
    resolvePreviewRenderer.ts     the registry (V1 today; V2 later)
    V1PreviewFrame.vue            ← CoverStage/Transition/Main wiring extracted from the frame view

src/composables/showcase-preview/
  useShowcaseEditSaves.ts         ← inline-save switchboard extracted from the frame view
src/utils/eventTextUpsert.ts      ← shared find-or-create-or-delete-by-(text_type, language) rule
src/views/ShowcasePreviewFrameView.vue   thin shell only
```

## Why this shape holds

- **New edit capability** = one `EditIntent` kind + one `EditableRegion` wrapper in a leaf showcase
  component + one case in `PreviewEditorHost`. No renderer files touched.
- **New template version/category** = one renderer file + one registry entry. No edit-layer files
  touched.
- **No duplicated editor logic** — parent-side editors are the same components the forms tab uses.

## Progress checklist

### Phase 1 — Foundation refactor (zero behavior change) — **done 2026-07-22**

- [x] Move `ShowcasePreviewTab.vue` into `src/components/showcase-preview/`; update
      `EventManageView.vue` import; pass `:event-data="event"` and listen for `event-updated`
- [x] Rename `inlineEditContext.ts` → `edit/editContext.ts`; move `InlineEditableText.vue` →
      `edit/`; update all importing showcase leaf components
- [x] Extract `src/utils/eventTextUpsert.ts`; use it in the preview save layer
- [ ] Adopt `eventTextUpsert` in `EditEventTextDrawer.vue` too (closes the duplication gap flagged
      in the shipped doc) — *deferred: the drawer's save is a multi-language, multi-field diff
      batch; forcing it through the single-field util would contort it. Revisit if the upsert rule
      ever changes.*
- [x] Extract `useShowcaseEditSaves.ts` composable from `ShowcasePreviewFrameView.vue`
- [x] Create `renderers/resolvePreviewRenderer.ts` + `V1PreviewFrame.vue`; slim the frame view to
      a shell; `ShowcasePreviewTab` iterates `renderer.frames` (transition visibility becomes a
      frame `isVisible` predicate)
- [x] Create `bridge/previewBridge.ts`; replace the raw `'showcase-preview-replay'` string on both
      ends with typed bridge messages
- [x] Type-check + lint clean on all touched files

### Phase 2 — Edit intents + parent-side editors — **done 2026-07-22 (pending manual click-through)**

- [x] `EditIntent` union + `EditIntentKey` context in `editContext.ts`
- [x] `EditableRegion.vue` primitive (inert-by-default, hover/tap affordance, posts intent;
      per-kind i18n'd labels, en + kh)
- [x] Frame view provides the intent context (editable mode only) → posts through bridge
- [x] `PreviewEditorHost.vue` in the tab: window `message` listener with origin + shape guards
- [x] Logo replace: `EditableRegion` on the cover logo (`CoverContentRows.vue`) and on the
      main-content host-logo row (`HostLogo` usages in `HostInfoWedding.vue` +
      `HostInfoHousewarming.vue`) → hidden file input + `useMediaUpload('logo_one')`
- [x] Google-Maps embed: `EditableRegion` on the map area (`EventInfo.vue`) → `GmapEmbedModal`;
      when no map exists yet, an "Add Google Map" placeholder shows in edit mode only
- [x] Host image: `EditableRegion` on host photos (`HostInfoWedding.vue`) → `EditHostDrawer`
      (host record fetched by id on demand via `hostsService.getHost`)
- [x] Event photos: "Manage photos" `EditableRegion` on the gallery section
      (`MainContentStage.vue`) → `UploadMediaDrawer`
- [x] Post-save `refresh` → frames refetch; tab emits `event-updated` upward
- [x] Silent post-save refresh: `useEventShowcase.refreshShowcaseData()` refetches and swaps
      data in place with **no `loading` toggle** (pattern borrowed from `updateLanguageContent`,
      incl. its same-language event_texts merge). Both the frames' `refresh` handler and the
      tab's own post-save reload use it — a full `loadShowcase()` in the tab flips its `loading`
      gate and unmounts/reloads every iframe (spinner flash + replayed mount animations), which
      read as a whole-page refresh
- [x] Type-check + lint clean
- [ ] Manual click-through verification in the browser (each intent → editor → save → frames
      refresh; public showcase unchanged)

### Phase 2.5 — Full agenda management from preview — **done 2026-07-23 (pending manual click-through)**

- [x] `agendaItem` / `agendaAdd` / `agendaDate` intents in `editContext.ts` + `EditableRegion`
      label keys (en + kh)
- [x] Whole agenda card (`showcase/AgendaItem.vue`) wrapped in `EditableRegion` → opens
      `EditAgendaDrawer` parent-side for everything: title/times/description/icon/date/speaker/
      translations/delete. The title's inline edit was **removed** (2026-07-23) — with the whole
      card clickable the two click targets fought each other, and the drawer handles translations
      correctly where the inline PATCH wrote the base `title` regardless of preview language. The
      `agenda` kind was dropped from `InlineEditTarget`/`useShowcaseEditSaves`
- [x] `AgendaWedding.vue` day tabs marked `data-preview-safe` (they were dead in edit mode —
      items on non-first days were unreachable; same fix `DressCodeSection` already had)
- [x] "Change this day's date" chip under the day tabs (edit mode only) → `agendaDate` intent
      carrying the active tab's date + item count → `EditDateGroupModal` via
      `useDateGroupOperations` (`agendaService.bulkUpdateDate`, same as the forms tab)
- [x] "Add activity" row appended in `AgendaSection.vue` after whichever category layout renders
      (edit mode only) → `agendaAdd` intent → `EditAgendaDrawer` in create mode (existing
      auto-fill: date/order/languages from the latest item)
- [x] `MainContentStage.vue` renders the agenda section in edit mode even with zero items, so the
      first activity can be added from the preview
- [x] `PreviewEditorHost` fetches the full agenda list fresh (`agendaService.getAgendaItems` —
      the showcase's localized copy lacks `translations`), routes the three intents, and reuses
      `DeleteConfirmModal` for the drawer's `delete` emit
- [x] **`data-preview-safe` specificity fix (2026-07-23)**: the Phase-2 `:not(.edit-region-control)`
      addition silently raised the disable rule's specificity above the `[data-preview-safe]`
      re-enable rule, killing every safe region (dress-code tabs + agenda day tabs) in edit mode.
      The safe-region exclusion now lives inside the disable rule's own `:not()` (as a complex
      selector), making the whitelist order- and specificity-independent
- [x] **Reorder (2026-07-23)**: up/down arrow buttons on each agenda card in edit mode →
      `agendaReorder` intent → parent renumbers the item's day 0..n-1 (same convention as the
      forms tab's drag-reorder) via `agendaService.bulkReorderAgendaItems`. Deliberately arrows,
      not drag-and-drop: HTML5 drag inside a `transform: scale()`d iframe has broken coordinate
      math and no touch support — full drag-and-drop remains in the forms tab
- [x] Floating action menu (`.floating-action-menu`) hidden in all preview frames via the frame
      view's stage CSS — it's guest navigation chrome that only obscures content in a preview
- [x] `EditableRegion`'s hover badge position made overridable via `--edit-badge-top`/
      `--edit-badge-right` CSS vars (was hardcoded top-right, colliding with the agenda card's
      reorder arrows); `AgendaItem.vue` sets `--edit-badge-right` to clear them
- [x] Type-check + lint clean
- [ ] Manual click-through verification in the browser

Known caveat (pre-existing): inline saves PATCH base fields while the frame shows
backend-localized values — editing inline while previewing a non-base language overwrites the
base value instead of that language's translation. The agenda case was resolved by removing the
inline title edit (the drawer handles translations); **host names still have this caveat** and
making that save language-aware is tracked as a follow-up.

### Phase 3 — Later (not in current scope)

- [ ] Photo gallery full management from preview (reorder / delete / set featured)
- [ ] Music replace/trim intent (reusing `MediaUploadsSection`'s trim editor in a drawer)
- [x] Toast feedback surface for inline-text save failures (gap carried from shipped doc;
      closed 2026-07-27 alongside the optimistic-save fix — see note above)
- [ ] V2 renderer (`V2PreviewFrame.vue`) + registry entry once the V2 preview approach is decided
- [ ] Backend template-version field replaces env-based resolution, shared with the public route
- [ ] Device-size presets for frames (390×844 is currently fixed)
- [ ] Automated tests for bridge protocol + save layer

## Verification bar

Every phase: `npm run type-check-noEmit` + `npm run lint` clean on touched files, plus manual
click-through of the preview tab (text edit still works, no interaction leaks through inert
frames, public showcase route unchanged).
