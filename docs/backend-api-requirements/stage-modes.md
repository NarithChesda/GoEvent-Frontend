# Backend API Requirements: Per-Stage Modes (`stage_modes`)

> **Status: PENDING** — Frontend is complete and bound to
> `template_assets.stage_modes`. Until the backend serves the field, every template
> reads as absent, which resolves to the asset fallback below — i.e. every
> published showcase renders as it does today, and the partner form's three new
> pickers cannot persist.

## Overview

A V1 showcase is three stages: a **cover**, a **middle beat**, and the
**invitation** (main content). Each stage is either built from **artwork** and
animated, or plays a **film**.

Until now the showcase never asked the template which it was. It guessed, from
two things that are not the template's intent:

1. **Whether a `standard_cover_video` file happened to be uploaded.** That single
   fact switched the cover, the middle beat **and** the invitation's backdrop to
   video together. It was a proxy for "this template is on the standard package
   plan", inferred from an asset.
2. **The event's category.** The animated middle beat — the Save the Date title
   card over the featured photograph — was hard-limited to
   `category === 'wedding'`. Every other category silently had no middle beat.

So a partner could not build a template with a filmed cover and a photographed
invitation backdrop, or an animated cover leading into a short film, or a
birthday template with the Save the Date beat. The only way to change any of it
was to upload or delete a video file.

`stage_modes` replaces the guess with a declaration: **one small JSON object on
the template, with one key per stage, each holding `"animation"` or `"video"` —
and, on `transition` only, `"none"`.**

```json
{
  "cover": "video",
  "transition": "animation",
  "background": "animation"
}
```

This is the same shape and the same plumbing as the existing
`host_info_design` / `info_card_design` / `save_the_date_design` configs: one
nullable JSON field on the partner-template model, accepted on create/update as a
JSON-encoded string inside `multipart/form-data`, returned on read, and surfaced
inside the event's `template_assets` payload. **The backend stores and returns it
verbatim** — every rule below about what a mode means is the frontend's business.

## The package plan decides nothing here

**The package plan is a pricing decision and must not constrain these values.**
Any plan may put any mode on any stage — a basic-plan template can film its
middle beat, a standard-plan template can have an artwork cover. Do not add
plan-based validation, and do not derive a default from the plan.

---

## Data Contract

### Config object

All three keys are **optional** and the whole field may be `null`. `cover` and
`background` take `"animation"` or `"video"`; `transition` takes those plus
`"none"`.

| Key | Values | `animation` draws | `video` draws | `none` draws |
|---|---|---|---|---|
| `cover` | `animation` \| `video` | `basic_decoration_photo`, exited by the cover animation (`cover_stage_layout.showcaseAnimationType`) | `standard_cover_video`, looping full-bleed | *not accepted* |
| `transition` | `animation` \| `video` \| `none` | the Save the Date card over the event's featured photograph | the event's `event_video`, else `standard_transition_video`, full screen | nothing — the cover hands straight over to the invitation |
| `background` | `animation` \| `video` | `basic_background_photo` → template colour → white | `standard_background_video`, looping | *not accepted* |

**`none` is transition-only, and that asymmetry is deliberate.** A cover and an
invitation backdrop are always *something*, so "remove this stage" is not a
question those two can be asked. The middle beat is the one stage a template may
simply not have — a birthday or funeral design that goes straight from the cover
to the invitation — and before this it could only say so by accident, by being
used on an event that happened to have no featured photograph.

**`null` and `"none"` are different answers.** An absent `transition` key still
means *infer* (follow the resolved cover); `"none"` means *remove the stage*. The
inference never produces `"none"`, so no already-published template can acquire
it, and none loses its middle beat.

Reject any other value with a `400` and a field-specific error under
`stage_modes`. **Do not reject unknown keys or a partially-filled object** — a
missing key is a normal, deliberate state (see below), and keeping the object
open lets a fourth stage be added later without a breaking change, exactly as
`host_info_design` was kept open for `frame_style`.

### A missing key is not an error — it is "infer it from the assets"

This is the whole backward-compatibility story, so it is worth being precise. The
frontend resolves each key independently
([`resolveStageModes`](../../src/composables/showcase/useStageModes.ts) — the one
place this table exists):

| Resolved key | When the key is absent, the frontend infers… |
|--------------|----------------------------------------------|
| `cover`      | `standard_cover_video` present → `video`, else `animation` |
| `transition` | follows the resolved cover |
| `background` | `standard_background_video` present, **or** resolved cover is `video` → `video`; else `animation` |

Consequences the backend should know about:

- `null` and `{}` are equivalent to the frontend, and both are valid stored
  states. `null` must survive a round trip and must not be coerced to an object.
- A partner may declare **one** stage and leave the other two inferred; the
  inference for those reads the *resolved* cover, not the raw files.
- The inference reads **no category**. Nothing about the event may change what a
  stage renders.

---

## Required Changes

### 1. Partner Template model

Add a nullable JSON field alongside the existing design-config JSON fields.

```python
# Example (Django) — mirror however host_info_design is defined
stage_modes = models.JSONField(null=True, blank=True, default=None)
```

No default needs to be stored: `null` already means "infer every stage".

### 2. Validation

On create and update, validate the field when present:

- Accept `null` (clears the field → every stage inferred).
- When an object is provided, validate only the keys that are present. `cover`
  and `background` must each be `"animation"` or `"video"`; `transition` must be
  one of `"animation"`, `"video"` or `"none"`. Each stage's error message
  should read back only the words that stage accepts.
- An object with **no** keys is valid (equivalent to `null`).
- Reject an invalid value with `400` and a field-specific error.

```json
{
  "success": false,
  "errors": {
    "stage_modes": ["cover must be one of: animation, video"]
  }
}
```

```json
{
  "success": false,
  "errors": {
    "stage_modes": ["transition must be one of: animation, video, none"]
  }
}
```

**Do not cross-validate against the uploaded assets.** A template legitimately
declares `cover: "video"` before the partner has uploaded the film — the studio
form shows the right upload slot *because* the mode is declared. A stage whose
asset is missing degrades gracefully on the client (see below), and blocking the
save would make the form unusable.

### 3. Create / Update endpoints

```
POST  /api/core-data/partner-templates/
PATCH /api/core-data/partner-templates/{id}/
```

These endpoints receive `multipart/form-data`. The frontend sends `stage_modes`
as a **JSON-encoded string field**, exactly like `host_info_design`,
`save_the_date_design`, `falling_effect` and `cover_stage_layout`:

```
stage_modes = '{"cover":"animation","transition":"video","background":"animation"}'
```

Backend must `JSON.parse` this string before validating/storing it. The form
always sends all three keys (its pickers have no "leave it to the system"
option), but the field must still accept a partial object and `null`, because
that is what every template stores until it is next opened and saved.

> Reference — frontend serialization (identical pattern to `host_info_design`):
> [src/services/api/modules/templates.service.ts](../../src/services/api/modules/templates.service.ts)
> (`createTemplate` / `updateTemplate`), built by `buildStageModesPayload` in
> [src/components/template/PartnerTemplateForm.vue](../../src/components/template/PartnerTemplateForm.vue).

### 4. Read endpoints (template)

```
GET /api/core-data/partner-templates/
GET /api/core-data/partner-templates/{id}/
```

Return the stored value (object or `null`) as `stage_modes`, next to the other
design configs in the serialized `PartnerTemplate`:

```json
{
  "id": 42,
  "name": "Elegant Wedding",
  "host_info_design": { "type": "arch" },
  "save_the_date_design": { "type": "medallion" },
  "stage_modes": { "cover": "video", "transition": "animation", "background": "animation" }
}
```

### 5. Event showcase payload (most important for rendering)

The showcase reads the modes from the event's `template_assets`, **not** from the
partner-template endpoint. Wherever the backend assembles `template_assets` for an
event (the same place that already emits `host_info_design`), include the
template's `stage_modes` **at the top level of `template_assets`**, beside the
other configs — not inside the `assets` sub-object:

```json
{
  "event": {
    "id": "…",
    "template_assets": {
      "assets": { "standard_cover_video": "…", "basic_background_photo": "…" },
      "cover_stage_layout": { "...": "..." },
      "host_info_design": { "type": "arch" },
      "stage_modes": { "cover": "video", "background": "animation" }
    }
  }
}
```

If the template has no value, emit `null` (or omit the key) — the frontend infers
every stage either way.

### 6. Public template-assets endpoint

```
GET /api/core-data/event-templates/{id}/public-assets/
```

The manage page's live preview resolves its frame list from this endpoint (it is
the only source for both paid and unpaid templates). It must carry `stage_modes`
in the same place, or the preview will show the wrong stages for a template whose
modes differ from what its uploaded videos imply.

> Reference — frontend consumption:
> [src/components/showcase-preview/ShowcasePreviewTab.vue](../../src/components/showcase-preview/ShowcasePreviewTab.vue)
> (`toStageAssets`) →
> [resolvePreviewRenderer.ts](../../src/components/showcase-preview/renderers/resolvePreviewRenderer.ts).

---

## What a missing asset does (frontend, for context)

The backend does not implement any of this; it is here so the field's values are
not mysterious, and so it is clear why validating modes against assets would be
wrong.

| Mode | Missing its asset |
|------|-------------------|
| `cover: "video"` | Cover renders on the template colour with no backdrop. |
| `cover: "animation"` | Same as today when no decoration photo is set. |
| `transition: "animation"` | No featured photo on the event → the cover's own exit *is* the beat, then the invitation. Indistinguishable from `none`, but arrived at by accident rather than by design — which is what `none` exists to fix. |
| `transition: "video"` | No `event_video` and no `standard_transition_video` → the beat is skipped. |
| `transition: "none"` | Has no asset. The cover hands straight over to the invitation, and the frontend resolves no `event_video` at all — a film the design says it does not show is never even downloaded. |
| `background: "video"` | No `standard_background_video` → the showcase wrapper's own colour shows through. Deliberately **no** fallback to the artwork ladder: that is precisely what standard templates do today, and the fallback would change how every one of them looks. |

---

## Acceptance Criteria

- [ ] Partner-template create accepts `stage_modes` (JSON string in form-data)
      and persists it.
- [ ] Partner-template update accepts and updates the field; sending the string
      `null` clears it, and a cleared field round-trips as `null` on the next read.
- [ ] A partial object (e.g. `{"transition":"animation"}`) is accepted and stored
      as-is — absent keys are **not** filled in by the backend.
- [ ] An empty object `{}` is accepted.
- [ ] Invalid values return `400` with a field-specific error under `stage_modes`.
- [ ] `{"transition":"none"}` is accepted; `{"cover":"none"}` and
      `{"background":"none"}` are rejected with `400`.
- [ ] An absent `transition` key is **not** backfilled with `"none"` (or anything
      else) — absent means infer, and the two are different states.
- [ ] No validation couples a mode to the package plan or to the uploaded assets.
- [ ] Partner-template read endpoints return the field (object or `null`).
- [ ] Event showcase payload exposes the field at
      `template_assets.stage_modes` (top level, not inside `assets`).
- [ ] Public template-assets endpoint exposes the field in the same place.
- [ ] Existing templates (no value stored) continue to work — see the note in
      CLAUDE.md for the one deliberate exception (non-wedding templates with an
      artwork cover gain the Save the Date beat).
