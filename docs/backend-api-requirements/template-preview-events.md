# Backend API Requirements: Template preview events

> **Status: PENDING** — the frontend is built and shipped against this contract.
> It degrades safely without it (see [What the frontend does meanwhile](#what-the-frontend-does-meanwhile)):
> the public design catalogue keeps rendering its bundled sample invitation, so
> this can land whenever the backend team is ready and nothing has to be
> un-picked on the frontend afterwards.

## The ask, in one line

One boolean on the Event model, and one public endpoint that lists the events
carrying it:

| | |
| --- | --- |
| **Field** | `Event.is_template_preview` — `BooleanField(default=False)`, **staff-set only** |
| **Endpoint** | `GET /api/events/template-previews/` — **no auth**, lists the flagged events |

No change to `GET /api/events/{id}/showcase/`. The catalogue picks an id from
the list and then fetches that event through the ordinary public showcase
endpoint, exactly as a guest's invitation link does.

## Why this exists

`/partners/templates` is the public design catalogue: a shop owner with no
account picks a design and reads a whole invitation rendered in it — cover,
save-the-date and the invitation itself, in English and Khmer.

Until now every design was previewed through **one bundled JSON sample**
(`src/assets/demo-showcase-event.json`), a wedding. That is right for a wedding
template and wrong for every other kind, and a catalogue that shows a wedding
behind every card is quietly arguing that every design is a wedding design —
while the funeral, birthday and housewarming designs on the same shelves go
unsold because nobody can see what they actually do.

It has a second cost. A checked-in fixture drifts: it is a hand-written copy of
a showcase response, and every field the showcase gains has to be added to it by
hand or that section previews empty. A real event cannot drift, because it *is*
the product.

So: staff flag a handful of real published events as the ones the catalogue may
draw, one or more per event category, and the page picks the one whose category
matches the design being previewed.

## Shape

### The field

```python
is_template_preview = models.BooleanField(
    default=False,
    help_text="Show this event as the sample invitation on the public design catalogue.",
)
```

- **Staff-only.** It must not be settable through the organizer-facing event
  serializer — an event on the public catalogue is a marketing decision, not an
  organizer's. An admin checkbox plus `list_filter` is the whole surface it needs.
- Expose it read-only on the event detail serializer if that is convenient; the
  frontend types it as optional and never writes it.

### `GET /api/events/template-previews/`

**Public — no token.** The page it serves has no signed-in visitor. Paginated or
a plain array; the frontend accepts both.

```jsonc
{
  "count": 4,
  "next": null,
  "previous": null,
  "results": [
    { "id": "8f2c…", "title": "Sophea & Dara",        "category": 1,    "category_name": "Wedding" },
    { "id": "1a77…", "title": "Rathana turns 21",     "category": 3,    "category_name": "Birthday" },
    { "id": "b904…", "title": "In memory of Chan Sok","category": 5,    "category_name": "Funeral" },
    { "id": "cc10…", "title": "House blessing",       "category": null, "category_name": null }
  ]
}
```

Deliberately thin rows. The catalogue only has to **pick** one — the invitation
itself arrives from the showcase endpoint afterwards — so nothing else is read,
and anything more is bytes on a page that is already booting three iframes.

**Filtering**: `?category=<id>` is welcome but not required; the roster is small
enough that the frontend fetches it once and filters in memory.

**Only events that are actually renderable.** The one real condition is that
`GET /api/events/{id}/showcase/` will serve the event **without a token** — a
flagged event the showcase endpoint refuses leaves a blank frame on the
catalogue, and the page cannot tell that apart from a slow network. Please
mirror whatever that endpoint already allows rather than inventing a stricter
filter here: in particular, do **not** require `privacy = public` unless the
showcase endpoint does. Real invitations are routinely private and opened by
link, and those are the best candidates to flag.

### `category` is the axis, and `null` is the catch-all

The catalogue is organised by the event category named on the template's package
plan (`plan.category`), and matches an event's own `category` against it — the
same category table on both sides, matched by **id**.

- One or more flagged events per category is ideal: the page picks **at random**
  among them, once per page load, so a repeat visitor is not always looking at
  the same wedding.
- A flagged event with **`category = null`** is the catch-all — it answers for
  every type that has no dedicated sample of its own.
- There is deliberately **no** cross-category borrowing beyond that. Putting a
  wedding behind a funeral design is the exact failure this replaces, so a
  category with neither a match nor a catch-all falls back to the bundled sample
  instead.

## Which events to flag

This is curation, not configuration — the rows are the shop window.

- **Complete.** Hosts, a full agenda, a gallery, a payment method, a dress code,
  both languages. Whatever is empty on the event previews as empty on every
  design, and reads as the design missing a feature.
- **Purpose-made, not borrowed.** Prefer events created for this by staff over a
  real customer's wedding. This is a public page and the showcase endpoint
  carries the event's real content — including its **comments**, which are real
  guests' words. They are already public on that event's own invitation link,
  but this puts them in front of a different audience entirely.
- **Dated ahead.** The invitation shows a countdown, so an event in the past
  previews as one that is over. Roll the dates forward, or re-flag.
- **Partner branding is handled for you.** The frontend substitutes its own
  placeholder shop over the event's `referrer` before rendering, because the
  caption under those frames promises the visitor that the mark at the foot of
  the invitation will be *theirs* — a page selling to shop owners must not stamp
  a competitor's logo on that promise. So it does not matter which partner a
  flagged event is attributed to; nothing else about the event is altered.

## What the frontend does meanwhile

Shipped, and inert until the endpoint exists:

- The roster request is best-effort. A `404` (endpoint absent), a `403`, an
  error and an empty list all mean the same thing — "nothing published yet" —
  and none of them is surfaced to the visitor.
- With no event for a category, the frames render the bundled sample exactly as
  they did before this existed. That fallback is permanent, not scaffolding: it
  also covers an event being unpublished mid-session.
- The chosen id reaches the preview frames as `?eventId=` on their first mount,
  and over the preview bridge (`preview-event`) afterwards, so changing design
  never re-navigates an iframe.

Frontend touchpoints, for whoever verifies this once it lands:

- `src/composables/showcase-preview/useTemplatePreviewEvents.ts` — the roster, and the per-category pick
- `src/composables/showcase-preview/useTemplatePreviewShowcase.ts` — fetch, partner substitution, fallback
- `src/services/api/modules/events.service.ts` — `listTemplatePreviewEvents()`
- `src/views/PartnerTemplateGalleryView.vue` and `src/views/TemplateShowcasePreviewFrameView.vue` — page and frame

## How to verify

1. Flag one published event per category, plus one with no category.
2. Open `/partners/templates` signed out. Every design previews an invitation of
   its own event type; the funeral designs show a funeral.
3. Click between two designs on the same shelf — the invitation stays put (one
   pick per category, per page load). Reload, and a different one may be dealt.
4. Click a design of another category — the invitation changes, and the iframes
   do **not** re-navigate: no white flash, and no spinner on frames whose event
   is not changing.
5. Un-flag every event. The catalogue keeps working, on the bundled sample.
