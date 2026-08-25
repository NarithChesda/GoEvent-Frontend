# Backend API Requirements: Standard-mode Transition Video (`standard_transition_video`)

> **Status: PENDING** — Frontend implemented and shipped; the field does not
> exist server-side yet, so nothing a partner uploads into it survives a save.
> Until it lands, the standard flow behaves exactly as it did before.

## The ask, in one line

Add one nullable video `FileField` — `standard_transition_video` — to the event
template, alongside the `standard_cover_video` / `standard_background_video`
pair it sits between, and expose it on every read path those two already appear
on.

## Why this exists

A **standard** template's guest flow has three beats:

```
cover (standard_cover_video, looping)
  → tap
middle stage  ← this one
  → ends
main content over standard_background_video
```

The middle beat has only ever had one source: the organizer's own
`event.event_video`. That made sense when standard templates were built per
client — the film *was* the event. It does not work for a general-purpose
standard template sold to many organizers: most of them never upload a video, so
the beat is skipped entirely and the showcase cuts from the cover straight to
the invitation. The template has no way to ship a transition of its own.

`standard_transition_video` is that fallback. Resolution order, which the
frontend already implements (`eventVideoUrl` in
[`src/composables/useEventShowcase.ts`](../../src/composables/useEventShowcase.ts)):

1. `event.event_video` — the organizer's own film. Always wins; a client who
   shot something for this event still sees exactly that.
2. `template_assets.assets.standard_transition_video` — the template's film.
3. Neither → the beat is skipped, as today.

Nothing else about the stage changes: same player, same unmuted playback, same
music handling, same auto-advance to main content when the video ends.

## The failure mode, stated up front

Same trap as [`spark-field`](spark-field.md) and
[`falling_effect.speed`](falling-effect-speed.md): **if the field is dropped,
nothing looks broken.** The partner template form and its live preview both run
off local form state, so an upload keeps previewing correctly for the rest of
the session — the multipart POST returns `200` with the key silently ignored,
and it is gone on the next page load. Downstream, the showcase just skips the
middle beat, which is indistinguishable from "this template has no transition".

**Test with an explicit save-and-reload, then with a real guest showcase URL for
an event that has no `event_video` of its own.**

## Where the field has to appear

| Path | Shape | Why |
| --- | --- | --- |
| `GET /api/core-data/partner-templates/` and `/{id}/` | `standard_transition_video: string \| null` (flat, absolute URL) | The partner editor's saved-asset state (`hasSavedAsset`) and its live preview read it here |
| `POST` / `PATCH` `/api/core-data/partner-templates/{id}/` | multipart file part | The upload itself — see the three-state write convention below |
| Paid showcase (`template_assets`) | `assets.standard_transition_video` | What a real guest's showcase resolves the middle stage from |
| `GET /api/core-data/event-templates/{id}/public_template_assets/` | `template_data.assets.standard_transition_video` | The manage-page live preview's unpaid fallback, which is also what the Templates browse-and-try-on pushes into the frames |
| `EventTemplate` browse payload | `standard_transition_video?: string` | Parity with the other two videos; not read by any gate today |

### Write semantics (unchanged convention)

The frontend sends this field through the same three-state path as every other
template file (`TEMPLATE_FILE_FIELDS` in
[`templates.service.ts`](../../src/services/api/modules/templates.service.ts)):

- a `File` part → upload/replace
- an **empty string** → delete what is stored (Django clears a `FileField` on a
  blank value)
- **key absent** → leave the stored file alone

That distinction is what makes "I didn't touch this" different from "remove
this", and the partner form's clear button depends on it — see
[partner-template-asset-removal.md](partner-template-asset-removal.md).

## Plan scope

The upload is offered **only on standard-plan templates** in the partner form,
because that is the only plan whose flow has this stage (the basic flow's middle
beat is `TransitionStage`, built from the event's own featured photo). That is a
frontend affordance, not a constraint worth enforcing server-side: a plain
nullable field on every template is enough, and gating it in the serializer
would only make the plan switch destructive.

## Validation

Same validator as `standard_cover_video` / `standard_background_video` — this is
a video file, not an image. No new size or format rule is being asked for.

## Test checklist

1. Partner uploads a transition video on a standard template → **save, reload**
   → the field is still populated and the preview still plays it.
2. Partner clears it → save, reload → it is gone (empty string honoured, not
   ignored as "untouched").
3. An event on that template with **no** `event_video` → guest showcase plays the
   template's film between cover and invitation.
4. An event on that template **with** an `event_video` → guest showcase plays the
   organizer's film, not the template's.
5. Unpaid event on that template → the manage-page live preview's Event Video
   frame appears and plays the template's film (this comes from
   `public_template_assets`, so it is a separate serializer to check).
