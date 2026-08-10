# Backend API Requirements: Music Start Stage (`music_start_stage`)

> **Status: PENDING.** One new nullable field on the Event model. No new
> endpoint, no change to any existing field.

## The ask, in one line

Add `music_start_stage` — a nullable choice field, `cover` | `transition` |
`main_content`, **default `NULL`** — to the Event model, readable and writable
everywhere the existing `music_start_time` / `music_end_time` fields already are.

## Why `NULL` is a real value and not "unset"

This is the one thing worth reading twice before writing the migration.

Music timing is currently **not uniform across templates** — it depends on which
showcase flow the event's template produces:

| Flow | Where music starts today |
| --- | --- |
| Basic wedding (cover → transition → invitation) | with the invitation |
| Template with an event video | on the envelope tap, under the video's opening |
| No video, no transition stage | with the invitation, ~1s after the tap |

`NULL` means **"keep whatever this event's flow does today"**, and the frontend
maps it back to exactly the table above. It is not a synonym for any of the three
values, and it must not be migrated to one — backfilling every row to
`main_content` would silently retime every video-template event in production.

Please make the column `null=True` with **no default**, and do not add a data
migration that fills it.

## Overview

`music_start_stage` lets the organizer choose how early the background music
comes in. The three values are the three moments **at or after** the envelope tap
— the browser's autoplay policy needs a user gesture and that tap is the only one
available, so nothing earlier is technically possible:

- `cover` — the instant the guest opens the envelope. The track plays under the
  cover animating away and through the transition.
- `transition` — as the transition scene (featured photo / door reveal) takes the
  screen, after the cover has gone.
- `main_content` — when the invitation itself is revealed.

A value naming a stage that a given template's flow never reaches falls through
to the next stage it *does* reach, so all three are meaningful for every
template. That resolution is entirely frontend-side; the backend only needs to
store and return the string.

## Shape

```jsonc
// GET /api/events/<id>/  and  GET /api/events/<id>/showcase/
{
  "music": "https://…/track.mp3",
  "music_start_time": 12,
  "music_end_time": 96,

  // --- NEW ---
  "music_start_stage": "cover"   // or "transition" | "main_content" | null
}
```

| Field | Type | Default | Values | Meaning |
| --- | --- | --- | --- | --- |
| `music_start_stage` | string \| null | `null` | `cover`, `transition`, `main_content`, `null` | Showcase stage the background music starts on. `null` = keep the template flow's original timing |

## What to do

1. **Model** — `models.CharField(max_length=16, choices=..., null=True, blank=True, default=None)`
   on the same model that holds `music_start_time`. Migration is additive and
   nullable, so it needs no backfill and no downtime.
2. **Serializers** — add to the event serializer used by the manage screens
   (the field is written by `PATCH /api/events/<id>/`, alongside
   `music_start_time` / `music_end_time`, which is the pattern the frontend
   already uses for the loop-trim editor).
3. **Showcase serializer** — add to `GET /api/events/<id>/showcase/`. **This one
   is what actually drives playback**; without it the setting saves and displays
   correctly in the manage screen and does nothing for guests, which is the same
   silent half-working failure `coverGilding` had.

### Validation

- Accept exactly `cover`, `transition`, `main_content`, or `null`/omitted.
- Reject an unrecognised string with a normal `400` field error — unlike the
  template blobs, this is a single enum written by a four-button control, so a
  bad value means a client bug rather than hand-authored config, and silently
  dropping it would hide that.
- No cross-field constraint. It is independent of `music_start_time` /
  `music_end_time` (which trim the *audio file*, not the *invitation's* pacing)
  and is harmless to store on an event with no `music` at all.

### Test procedure

1. On an event with background music, open **Media → Background Music** and pick
   **Cover** under *Start Music At*.
2. Confirm the `PATCH` returns `200`.
3. **Reload** the manage page — the Cover button must still be selected.
4. Open the event's showcase URL and tap the envelope: the music must start
   immediately, under the cover animation, rather than when the invitation
   appears.
5. Switch to **Invitation**, reload the showcase, and confirm the music now waits
   for the invitation.
6. Set it back to **Default** and confirm the field round-trips as `null` (not as
   the string `"null"` or `""`).

## Frontend reference

- Type: [`src/services/api/types/event.types.ts`](../../src/services/api/types/event.types.ts) —
  `MusicStartStage`, `Event.music_start_stage`
- The start gate (one place decides when the track begins, so the `null` fallback
  is provably the old behaviour):
  [`src/composables/showcase/useShowcaseStages.ts`](../../src/composables/showcase/useShowcaseStages.ts) —
  `MUSIC_CUE_ORDER`, `MUSIC_STAGE_FALLBACK`, `armMusic`, `cueMusic`
- Organizer control: [`src/components/MediaUploadsSection.vue`](../../src/components/MediaUploadsSection.vue) —
  the *Start Music At* row in the background-music card
- Wiring: [`src/views/EventShowcaseRefactored.vue`](../../src/views/EventShowcaseRefactored.vue)
