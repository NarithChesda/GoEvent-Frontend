# Tickets Door Check-In — Backend Asks

> **Status: CLOSED — superseded by [TICKETS_CHECKIN_API_DOCS.md](../../GoEvent/TICKETS_CHECKIN_API_DOCS.md) (backend release 2026-05-06).**
> **Resolution:** All P0 + P1 items shipped. P2 #11 (suspicious-scan flag) shipped. P2 #10 (SSE) and #12 (venue capacity) deferred — not blocking v1.
> **Audience:** GoEvent backend team (historical).
> **Related:** [TICKETS_FRONTEND_GUIDE.md](../../GoEvent/TICKETS_FRONTEND_GUIDE.md), [TICKETS_API_DOCS.md](../../GoEvent/TICKETS_API_DOCS.md), [TICKETS_CHECKIN_API_DOCS.md](../../GoEvent/TICKETS_CHECKIN_API_DOCS.md), [TICKETS_FEATURE_PLAN.md](TICKETS_FEATURE_PLAN.md).

## Resolution summary (2026-05-06)

Backend shipped the full P0 + P1 list plus the suspicious-scan flag from P2. The status table below maps each ask to its delivered endpoint. The original ask details are preserved beneath for historical reference.

| Ask | Status | Delivered as |
|---|---|---|
| #1 Idempotent + batch | ✅ shipped | `idempotency_key` + `device_id` + `replayed:true` on the existing endpoint, plus new `POST /api/events/{id}/check-in/batch/` (≤200 scans, 7-day cap on `scanned_at`) |
| #2 Order-level / group check-in | ✅ shipped | `POST /api/ticket-orders/{code}/check-in/` with optional `ticket_ids[]`, returns `summary` + per-ticket `results[]` |
| #3 Undo | ✅ shipped | `POST /api/tickets/{code}/check-in/undo/` — no time cap (frontend can soft-cap) |
| #4 Permission scope | ✅ shipped | Documented: organizer + admin/editor collaborators only, 403 otherwise |
| #5 Cross-event guard | ✅✅ shipped | Both options delivered: `ticket.event_id` always populated **and** batch endpoint event-scoped |
| #6 Server-side attendee search | ✅ shipped | `?search=` on `/ticket-attendees/` matches name/email/buyer/confirmation/check-in code |
| #7 Tier scoping | ✅ shipped | `allowed_tier_ids[]` on every endpoint, server-enforced, `wrong_tier:true` flag |
| #8 Audit log | ✅ shipped | `GET /api/events/{id}/check-in-log/` with all requested filters; `audit_id` returned on every scan |
| #9 Walk-up door sales | ✅ shipped | `POST /api/events/{id}/door-sales/` with `auto_check_in`, no account required, atomic seat lock, sale-window bypass |
| #10 SSE counter | ⏳ deferred | Polling analytics is acceptable for v1 |
| #11 Suspicious-scan flag | ✅ shipped | `suspicious:true` (advisory, independent of `ok`), 30s window, cross-device |
| #12 Venue capacity cap | ⏳ deferred | Soft signal only; needs exit-tracking to be a hard cap |

Bonuses delivered beyond the asks: `audit_id` on every scan response, `replayed:true` flag on cache hits, `wrong_tier:true` to distinguish tier rejection from other rejections, `source` enum on each scan (`qr` / `manual` / `attendee_search` / `order` / `batch_sync`), and `server_recorded_at` alongside client-claimed `scanned_at` on audit rows.

Schema changes for existing consumers (apply to frontend types):

- `TicketOrder.buyer` is now nullable (was non-null).
- New `TicketOrder.is_door_sale: boolean` and `door_payment_type: 'cash' | 'card_offline' | 'other' | ''` fields.
- `Ticket.event_id` is guaranteed on the check-in response (was previously absent).

Frontend type definitions updated in [src/services/api/types/ticket.types.ts](../src/services/api/types/ticket.types.ts).

---

## Original asks (historical)

The paid ticketing feature is live (buyer checkout, organizer order review, analytics, attendee CSV). The remaining gap is **door check-in on event day**. Frontend is planning a `/events/:id/scan` mobile-first scanner view that wraps the existing `POST /api/tickets/check-in/` endpoint.

The current endpoint is sufficient for a **minimum viable** door experience, but several gaps prevent us from calling the platform "feature-rich" against competing event-management systems. This document enumerates those gaps with proposed API shapes — open to the backend team's preferred design.

The frontend v1 scanner is unblocked and can ship against the existing endpoint. The asks below are sequenced so that the highest-impact items land before next release.

---

## Priority Legend

| Tier | Meaning |
|---|---|
| **P0** | Required to call door check-in production-ready. Real-world events will fail without these. |
| **P1** | Feature-rich differentiators. Distinguishes the platform vs competitors. |
| **P2** | Nice-to-have. Performance / observability upgrades. |

---

## P0 — Required for production door operations

### 1. Idempotent + batch check-in (offline support)

**Problem.** Venues have unreliable wifi. Today, each scan is a one-shot POST with no idempotency key. If the request times out, staff don't know if it landed; retrying may double-count. There's no way to queue scans offline and sync when connectivity returns.

**Asks.**

(a) Add `idempotency_key` (client-generated UUID v4, dedupe window ≥24h) to the existing endpoint:

```http
POST /api/tickets/check-in/
{
  "qr_code": "...",
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
  "device_id": "scanner-gate-A-iphone15"
}
```

If the same key is replayed, return the **original** stored outcome rather than re-processing. `device_id` is free-text from the client (used for the audit log, ask #8).

(b) New batch endpoint for offline sync:

```http
POST /api/events/{event_id}/check-in/batch/
{
  "scans": [
    {
      "idempotency_key": "uuid",
      "qr_code": "...",
      "scanned_at": "2026-05-06T19:42:18.123Z",
      "device_id": "scanner-gate-A"
    },
    ...
  ]
}
```

Response: array of per-scan outcomes (matching the single-scan shape) keyed by `idempotency_key`. Preserve the client-provided `scanned_at` in the audit log so reports reflect when staff actually scanned, not when the device synced.

**Why P0.** Without this, scanners on flaky wifi are unusable. Competitors (Eventbrite, Ticket Tailor) all support offline mode.

---

### 2. Order-level / group check-in

**Problem.** A buyer with 5 tickets currently requires 5 separate scans (one QR per ticket). At a busy entrance this routes around the system — staff resort to paper checklists.

**Asks.**

(a) Either expose `confirmation_code` as a scannable code (it's already short and unique), or add an `order_qr_code` field on `TicketOrder`.

(b) New endpoint:

```http
POST /api/ticket-orders/{confirmation_code}/check-in/
{
  "ticket_ids": ["uuid", "uuid"],   // optional; default = all valid tickets on order
  "idempotency_key": "...",
  "device_id": "..."
}
```

Response: array of per-ticket outcomes (one entry per ticket processed), so the staff UI can display "3 of 5 checked in (2 already used)".

**Why P0.** Group attendance is the norm, not the exception. Wedding parties, corporate blocks, family events.

---

### 3. Undo / revert check-in

**Problem.** Fat-finger scans happen — wrong tier, accidental double-tap, scanned the wrong attendee from the search drawer. Today the ticket is permanently `used` with no recovery.

**Ask.**

```http
POST /api/tickets/{ticket_id}/check-in/undo/
{
  "reason": "Scanned wrong attendee — staff error",
  "idempotency_key": "..."
}
```

Behavior:
- Reverts `Ticket.status` to `valid`, decrements `check_in_count`.
- **Keeps an audit row** (see ask #8) — the undo itself is logged.
- Optional time-window cap (e.g. only undoable within N minutes); backend's call.
- Same permission gate as check-in.

**Why P0.** Without undo, every staff error is permanent. Refund/dispute conversations get harder.

---

### 4. Permission scope clarification on `/check-in/`

**Problem.** [TICKETS_FRONTEND_GUIDE.md](../../GoEvent/TICKETS_FRONTEND_GUIDE.md) says "organizer + collaborators" can check in but doesn't specify which collaborator levels. Frontend currently gates at the route level by `event.can_edit`. If the backend lets viewers (or anyone with the URL) through, that's a security gap we can't fix client-side.

**Asks.**

(a) Document and confirm: the check-in endpoint requires `event.can_edit` (organizer + admin/editor collaborators) on the ticket's parent event. Reject with `403` otherwise.

(b) Optional follow-up: a dedicated **"door staff" collaborator role** — scan-only, can't edit tiers/orders/analytics. Useful for events that hire temporary gate staff and don't want to grant them the full editor role.

**Why P0.** Security correctness. Currently relying on UI-level gating for an authorization rule.

---

### 5. Event-scoped check-in OR guaranteed `ticket.event.id` in response

**Problem.** Today `POST /api/tickets/check-in/` is global — staff at event A can scan event B's QR and the backend will accept it (assuming event B is also "currently running"). The frontend planned a defensive cross-event guard, but the doc's example response **omits `ticket.event`** ([TICKETS_FRONTEND_GUIDE.md lines 369-384](../../GoEvent/TICKETS_FRONTEND_GUIDE.md)) so the guard can't be enforced reliably.

**Asks** (pick one):

**Option A (preferred):** Add an event-scoped endpoint:

```http
POST /api/events/{event_id}/check-in/
```

Returns `404` if the scanned code belongs to a different event. Eliminates client-side guards entirely.

**Option B:** Guarantee `ticket.event.id` (and ideally `ticket.event.title`) is **always** populated on the check-in response so the frontend can client-side reject mismatches.

**Why P0.** Without this, multi-event venues (festivals, conference centers running parallel events) will see cross-event leakage.

---

## P1 — Feature-rich differentiators

### 6. Server-side attendee search

**Problem.** The attendee fallback drawer (used when QR scan fails and staff needs to look up by name) currently loads a page of attendees and filters client-side. For events with thousands of attendees this is slow and incomplete (matches only within the loaded page).

**Ask.** Add `?search=<query>` to `GET /api/events/{event_id}/ticket-attendees/`, matching `attendee_name` and `attendee_email` (case-insensitive contains). Composes with existing `?status=` and `?ticket_type_id=` filters.

**Why P1.** Without this, the door fallback fails for large events — exactly the events most likely to have a scan failure.

---

### 7. Per-gate / per-tier scanner scoping

**Problem.** A VIP gate should reject GA tickets ("wrong entrance, please use Gate B") rather than checking them in. Today any scanner can check in any tier.

**Asks.**

(a) Optional body field on check-in:

```json
{
  "qr_code": "...",
  "allowed_tier_ids": [1, 3]
}
```

If the scanned ticket's tier isn't in the allow-list, return `ok: false` with `message: "Wrong gate — please use the {tier_name} entrance"`. Frontend stores the allow-list in scanner session config.

(b) Lighter alternative: just rely on the existing `ticket.ticket_type.id` in the response and let the frontend reject. But server-side enforcement is more robust against URL/header tampering.

**Why P1.** Premium events with VIP zones / staged entry depend on this.

---

### 8. Check-in audit log

**Problem.** When a refund dispute or fraud claim arises, "who scanned this ticket, on what device, at what time, was it ever undone?" is not answerable today. Only the latest `checked_in_at` and `check_in_count` are stored on the ticket.

**Asks.**

(a) Persist a new model:

```
TicketCheckInEvent {
  id: uuid
  ticket_id: uuid (fk)
  scanned_by_user_id: int (fk)
  device_id: string (nullable)
  scanned_at: datetime
  source: 'qr' | 'manual' | 'attendee_search' | 'batch_sync'
  outcome: 'entry' | 'reentry' | 'rejected' | 'undone'
  rejection_reason: string (nullable)
  idempotency_key: uuid (unique)
}
```

(b) Expose `GET /api/events/{event_id}/check-in-log/` (organizer only, paginated, filterable by ticket / staff / outcome / time range) for post-event auditing.

**Why P1.** Required for any dispute resolution. Also unlocks staff-performance analytics ("Gate A processed 320 scans in the first hour").

---

### 9. Walk-up sales → instant check-in flow

**Problem.** Real events sell at the door. Today the only paths are:

- Comp issuance: organizer → enter buyer email → buyer must already have an account → scan QR. Too slow at the gate; requires the walk-up to have signed up.
- Standard buyer flow: create order → upload payment proof → organizer reviews → buyer shows QR. Even slower.

**Ask.** Either:

(a) **Door-side sale shortcut:**

```http
POST /api/events/{event_id}/door-sales/
{
  "items": [{"ticket_type_id": 1, "quantity": 1}],
  "attendee_name": "Walk-up customer",
  "attendee_email": "optional@email.com",   // no account required
  "payment_method_recorded": "cash" | "card_offline" | "other",
  "payment_amount_received": "25.00",
  "auto_check_in": true
}
```

Creates an order (marked paid out-of-band, with the staff user as `confirmed_by`), issues tickets, and optionally checks them in immediately. Skips the email-must-exist constraint of the comp endpoint by accepting attendee-only records.

(b) Or document explicitly that walk-up sales are out of scope and direct staff to the comp flow with a generic "walk-up@event.example" placeholder account.

**Why P1.** Most physical events sell at the door. Without this, organizers run a parallel cash drawer outside our system.

---

## P2 — Nice-to-have

### 10. Real-time counter via SSE or WebSocket

**Problem.** Polling `ticket-analytics` after every scan is wasteful at scale (multiple scanners + organizer dashboard all polling the same endpoint).

**Ask.** Optional `GET /api/events/{event_id}/check-in/stream/` (Server-Sent Events) emitting `{ tickets_used, tickets_valid, last_scan: { attendee_name, tier_name, at } }` events on each successful check-in.

Polling is fine for v1; this is a perf upgrade for events with 5+ active scanners.

---

### 11. Suspicious-scan flag

**Problem.** Same QR scanned at two physically-separate stations within seconds = stolen/screenshotted ticket being passed around. Today the second scan is just `was_reentry` (if allowed) or `already_checked_in` (if not) — no signal to staff that it's suspicious.

**Ask.** When a scan happens within N seconds of a prior scan from a **different** `device_id`, return:

```json
{
  "ok": false,
  "suspicious": true,
  "message": "Possible duplicate — already scanned at {time} from station {device_id}"
}
```

Staff can override via the undo endpoint (#3) or a dedicated "force entry" endpoint with a reason. Depends on `device_id` (#1) and audit log (#8).

---

### 12. Venue capacity cap

**Problem.** A venue may have a fire-marshal cap of 500 across all tiers, even if 600 tickets were sold (overbooking is a real practice). Today nothing prevents over-capacity entries.

**Ask.** Optional `Event.venue_capacity` field (int, nullable). Once `tickets_used >= venue_capacity`, the check-in endpoint returns:

```json
{
  "ok": false,
  "message": "Venue at capacity ({n}/{capacity})",
  "venue_full": true
}
```

Note: this is a soft signal unless we also track exits, which we don't today. Frontend can surface this as a warning rather than a hard block.

---

## Suggested rollout order

| Sprint | Items | Rationale |
|---|---|---|
| **1** | #4, #5, #6 | Small wins: clarification + one query param + one search param. Unblocks frontend cross-event guard and large-event attendee fallback. |
| **2** | #1, #3 | Reliability — idempotency + undo. Table-stakes for any production door deployment. |
| **3** | #2, #8 | Group check-in + audit log. Audit log depends on idempotency key (#1) so order matters. |
| **Backlog** | #7, #9, #10, #11, #12 | When product prioritizes. #11 depends on #1 + #8; #12 is a soft signal until exit-tracking exists. |

---

## What the frontend ships in the meantime

The v1 scanner ships against the **existing** `POST /api/tickets/check-in/` with these client-side compromises (each lifted by the corresponding ask):

| Frontend compromise | Ask that lifts it |
|---|---|
| No offline mode — scans require network at time of scan | #1 |
| Buyers with multi-ticket orders show 5 separate QRs | #2 |
| No undo — staff errors are permanent | #3 |
| Permission gate inferred from `event.can_edit` (UI-level) | #4 |
| Cross-event guard runs only when `ticket.event.id` happens to be in the response, otherwise silently accepts | #5 |
| Attendee search filters client-side on a single loaded page | #6 |
| Any scanner accepts any tier | #7 (acceptable for v1) |
| No audit trail beyond `checked_in_at` / `check_in_count` | #8 |
| Door sales require pre-existing accounts via the comp flow | #9 |

---

## Questions / clarifications needed

1. Does the existing `POST /api/tickets/check-in/` response **always** include `ticket.event.id`, or only sometimes (the doc example omits it)? If always, ask #5 collapses to a doc fix.
2. Are there any current rate limits on `/check-in/`? At a 1000-person event with 5 scanners, peak throughput could hit 50+ requests/second.
3. Do `TicketCheckInEvent`-style audit rows already exist in the database (just not exposed)? If so, asks #8 and parts of #11 are just an API surface, not new infrastructure.
4. Is there an existing pattern in this codebase for idempotency keys (other endpoints, `payment` app, etc.) that the check-in endpoint should follow?
