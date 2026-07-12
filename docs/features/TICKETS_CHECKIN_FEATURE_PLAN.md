# Door Check-In Feature Plan

> **Status:** Drafted 2026-05-06 against backend release [TICKETS_CHECKIN_API_DOCS.md](../../GoEvent/TICKETS_CHECKIN_API_DOCS.md).
> **Supersedes:** the inline plan from the 2026-05-06 chat.
> **Sibling docs:** [TICKETS_CHECKIN_BACKEND_ASKS.md](TICKETS_CHECKIN_BACKEND_ASKS.md) (closed), [TICKETS_FEATURE_PLAN.md](TICKETS_FEATURE_PLAN.md).

## Context

Backend shipped the full door check-in API surface — single scan, undo, group check-in, offline batch sync, audit log, attendee search, walk-up door sales, plus the suspicious-scan flag. This plan turns that surface into a feature-rich frontend.

**Design intent:** the primary deliverable is a mobile-first `/events/:id/scan` view that works offline and handles real door-operations stress (bad wifi, group arrivals, fat-finger errors, multi-gate VIP scoping). Walk-up sales and the organizer-side audit-log viewer are scoped as separate surfaces (Phase H), not bolted onto the scanner.

## What's already in place

- Service: `ticketsService.checkIn` at [src/services/api/modules/tickets.service.ts:50](../src/services/api/modules/tickets.service.ts#L50). Other ticket services exist for orders, analytics, attendees.
- Types: [src/services/api/types/ticket.types.ts](../src/services/api/types/ticket.types.ts) updated 2026-05-06 to cover the full check-in API surface (single scan extended, undo, group, batch sync, audit log, door sale, attendee `search` filter, `TicketOrder.buyer` nullable, `is_door_sale` + `door_payment_type` fields).
- Generic QR scanner: [src/components/QRCodeScanner.vue](../src/components/QRCodeScanner.vue) — single-shot today, used by `RegistrationCheckinModal`. Door scanning needs a continuous mode.
- Existing analytics + attendee services already support the door view's needs.

## What ships in v1 vs v1.5

| Phase | Surface | Ships in |
|---|---|---|
| A | Foundations: services, route, i18n, scanner extension | v1 |
| B | Online single-scan view (camera + manual entry + tier scoping + suspicious flag + live counter) | v1 |
| C | Group check-in via order code (one scan, whole party in) | v1 |
| D | Undo button | v1 |
| E | Attendee search drawer (server-side `?search=`) | v1 |
| F | Offline queue + batch sync | v1 |
| G | Suspicious-scan UI badge + audit-log link | v1 (G1 only); G2 needs Phase H |
| H | Organizer surfaces: audit log viewer + walk-up door sales | v1.5 |
| I | Tests + manual QA | rolls with each phase |

The v1 line covers the door operator experience end-to-end. The v1.5 line covers the organizer's "see what happened at the door" + "sell at the door" surfaces, which can ship after the scanner is in real use.

---

## Phase A — Foundations

### A1. Continuous-scan mode on `QRCodeScanner.vue` — S

File: [src/components/QRCodeScanner.vue](../src/components/QRCodeScanner.vue)

Add a `continuous?: boolean` prop. When true:

- Skip the success-view branch (camera stays live).
- Track recently-decoded codes in a `Map<string, timestamp>`. Suppress duplicate `scan-success` emissions for the same code within a 1500 ms cooldown.
- Add a 500 ms global cooldown so html5-qrcode's per-frame decodes don't fire dozens of events for one held QR.

Default behavior unchanged (single-shot) so `RegistrationCheckinModal.vue` keeps working.

### A2. Service layer additions — M

**Extend [src/services/api/modules/tickets.service.ts](../src/services/api/modules/tickets.service.ts):**

```ts
checkIn(payload: CheckInRequest): Promise<ApiResponse<CheckInResponse>>          // existing — types upgraded
undo(code: string, payload: UndoCheckInRequest): Promise<ApiResponse<UndoCheckInResponse>>
batchSync(eventId: string, payload: BatchSyncRequest): Promise<ApiResponse<BatchSyncResponse>>
```

**Extend [src/services/api/modules/ticket-orders.service.ts](../src/services/api/modules/ticket-orders.service.ts):**

```ts
groupCheckIn(confirmationCode: string, payload: OrderCheckInRequest): Promise<ApiResponse<OrderCheckInResponse>>
createDoorSale(eventId: string, payload: DoorSaleRequest): Promise<ApiResponse<TicketOrderDetail>>
```

**New module [src/services/api/modules/ticket-checkin-log.service.ts](../src/services/api/modules/ticket-checkin-log.service.ts):**

```ts
list(eventId: string, filters?: CheckInLogFilters): Promise<ApiResponse<PaginatedResponse<CheckInLogEntry>>>
```

Re-export from [src/services/api.ts](../src/services/api.ts) and [src/services/api/modules/index.ts](../src/services/api/modules/index.ts) (if a barrel exists — verify).

### A3. Router + entry points — XS

File: [src/router/index.ts](../src/router/index.ts)

```ts
{
  path: '/events/:id/scan',
  name: 'event-scan',
  component: () => import('../views/EventTicketScanView.vue'),
  meta: { requiresAuth: true, title: 'Scan Tickets - GoEvent' },
}
```

Don't add to `sensitiveRoutes` — the additional token-validation latency hurts on event-day reload. The route guard's `requiresAuth` is sufficient; permission gating (organizer + admin/editor collaborator) happens client-side via `event.can_edit` and the backend rejects with 403 if the gate is wrong.

Entry-point CTA in [src/components/EventTicketsTab.vue](../src/components/EventTicketsTab.vue): "Scan tickets at the door" button visible when `canEdit`. Routes to the new view in the same tab.

### A4. i18n keys — XS

Files: [src/i18n/locales/en/management.json](../src/i18n/locales/en/management.json), [src/i18n/locales/kh/management.json](../src/i18n/locales/kh/management.json)

New block under `management.tickets.scan.*`. Keys to enumerate (translation deferred to delivery):

- `title`, `subtitle`
- `counter.checkedIn`, `counter.of`, `counter.refresh`
- `modes.qr`, `modes.manual`
- `manualEntry.label`, `manualEntry.placeholder`, `manualEntry.submit`, `manualEntry.helper`, `manualEntry.invalidChar`
- `outcomes.entry`, `outcomes.reentry`, `outcomes.rejected`, `outcomes.invalid`, `outcomes.wrongEvent`, `outcomes.wrongTier`, `outcomes.alreadyCheckedIn`, `outcomes.refunded`, `outcomes.cancelled`, `outcomes.eventNotRunning`, `outcomes.replayed`
- `suspicious.warning`, `suspicious.viewAudit`
- `actions.scanNext`, `actions.findAttendee`, `actions.undoLast`, `actions.exit`, `actions.toggleSound`, `actions.toggleHaptic`, `actions.configureGates`
- `gateConfig.title`, `gateConfig.allTiers`, `gateConfig.selectedCount`, `gateConfig.save`
- `attendeeSearch.title`, `attendeeSearch.placeholder`, `attendeeSearch.empty`, `attendeeSearch.loading`, `attendeeSearch.checkInLabel`, `attendeeSearch.alreadyChecked`
- `recent.heading`, `recent.empty`
- `offline.banner`, `offline.queued`, `offline.syncing`, `offline.syncFailed`, `offline.synced`
- `group.title`, `group.summary`, `group.allEntered`, `group.partial`, `group.alreadyUsed`
- `undo.confirm`, `undo.expired`, `undo.success`
- `access.restricted`
- `errors.cameraDenied`, `errors.cameraNotFound`, `errors.scanFailed`, `errors.networkError`
- `entrypoint.button`

A1, A2, A3, A4 are independent — parallelizable.

---

## Phase B — Online single-scan MVP

### B1. `useTicketCheckIn` composable — M

File: [src/composables/tickets/useTicketCheckIn.ts](../src/composables/tickets/useTicketCheckIn.ts)

Wraps `ticketsService.checkIn`, normalizes outcomes into a discriminated union. **Always generates an `idempotency_key` upfront** (UUID v4 via `crypto.randomUUID()`) so retries are safe and the same key threads into Phase F's offline queue.

```ts
type ScanOutcome =
  | { kind: 'entry';        ticket: Ticket; checkInCount: number; auditId: string; suspicious: boolean }
  | { kind: 'reentry';      ticket: Ticket; checkInCount: number; auditId: string; suspicious: boolean }
  | { kind: 'rejected';     ticket?: Ticket; reason: 'already_checked_in' | 'refunded' | 'cancelled' | 'event_not_running' | 'wrong_tier' | 'unknown'; rawMessage: string; auditId?: string }
  | { kind: 'wrong_event';  ticket: Ticket }
  | { kind: 'invalid';      rawMessage: string }
  | { kind: 'network_error'; rawMessage: string; queuedKey?: string }
  | { kind: 'replayed';     original: ScanOutcome }   // for offline-sync surfacing
```

Public shape:

```ts
useTicketCheckIn({ eventId, deviceId, allowedTierIds })
  → { scan, isScanning, lastOutcome, recent, clearLast }
```

Internal logic:

- Build payload: `{ qr_code | check_in_code, idempotency_key, device_id, source, allowed_tier_ids }`. Normalize manual codes (uppercase + trim).
- On `success && data.ok && !was_reentry` → `entry`.
- On `ok && was_reentry` → `reentry`.
- On `replayed: true` → wrap the original outcome in `replayed` so the UI can mute the green flash and indicate "from offline queue".
- On `wrong_tier: true` → `rejected` with `reason: 'wrong_tier'` (the message contains the correct gate name; surface verbatim).
- On `ok === false` and not `wrong_tier` → map message to reason via case-insensitive includes.
- On `success === false` → distinguish HTTP 400 (`invalid`) from network errors (`network_error`).
- **Cross-event guard:** if outcome would be `entry`/`reentry` AND `ticket.event_id !== eventId` → coerce to `wrong_event`. The backend now guarantees `event_id`, so this is a hard check, not a fallback.
- `recent`: capped 10-entry FIFO with timestamp + scan source.

### B2. View `EventTicketScanView.vue` — L

File: [src/views/EventTicketScanView.vue](../src/views/EventTicketScanView.vue)

Mobile-first full-screen layout. Sections top-to-bottom:

1. **Slim header bar:** event title (truncate), close button (`router.back()` falling back to `/events/:id/manage?tab=tickets`), gear menu (gate config, sound/haptic toggles, exit).
2. **Live counter:** `{tickets_used} / {tickets_issued}` from `ticketAnalyticsService.getAnalytics(eventId)`. Optimistic local increment on entry/reentry; debounced refetch every 5s and on every successful scan to reconcile.
3. **Camera area** (~60vh): `QRCodeScanner` in `continuous` mode. Beneath, a "Tap here to enter code manually" link toggles the camera off and shows a 10-char input (auto-uppercase; reject `0OIL1` with helper hint; submit on Enter).
4. **Outcome banner** overlays the camera as a card after each scan. Dismiss on `Scan next` (or auto-dismiss after 3s for entries; sticky for rejections):
   - **Green ENTRY** for `entry` — big check icon, attendee name, tier name.
   - **Yellow RE-ENTRY (#N)** for `reentry`.
   - **Red REJECTED** for `rejected` — localized reason, raw message as sub-line.
   - **Red WRONG EVENT** for `wrong_event` — show "configured for {currentEventTitle}".
   - **Red INVALID** for `invalid` / `network_error`.
   - **Amber SUSPICIOUS** chip overlaid on green/yellow banners when `suspicious: true`.
5. **Action row:** primary `Scan next`, secondary `Find attendee` (Phase E), tertiary `Undo last scan` (Phase D, hidden when no recent successful scan or after the 5-min cap).
6. **Recent scans drawer** (collapsible): last 10 with name + tier + outcome chip + relative timestamp.

Permission gate at the top of `<script setup>`: load event via `eventsService.getById(eventId)`; if `!event.can_edit` render the existing Lock-icon "Access Restricted" card (mirror [EventManageView.vue:299-310](../src/views/EventManageView.vue#L299)).

UX details:

- **Sound:** synthesized Web Audio beep with distinct frequencies per outcome. Cache the `AudioContext` once. Persist mute toggle in `localStorage` keyed per device.
- **Haptic:** `navigator.vibrate?.([100])` on entry; `[50, 50, 50]` on rejection. Gated by toggle.
- **Auto-rearm:** off by default for v1 — explicit `Scan next` is safer for staff. Add as a setting if requested.
- **Gate config:** loaded from `localStorage` (`scan:eventId:allowedTierIds`); if unset, opens a one-time picker on first launch listing the event's tiers. Saved selection threads into every scan as `allowed_tier_ids`.

No `v-html`. All API strings render via `{{ }}` (Vue auto-escapes); attendee names from the API are already trusted-ish but stay safe.

### B3. Component test for manual happy path — S

File: [src/views/EventTicketScanView.spec.ts](../src/views/EventTicketScanView.spec.ts)

Mount the view with mocked composables/services; type a valid code → click submit → assert green banner + attendee name + counter increment + recent-scans entry. Camera path deferred to manual QA.

B1 → B2 → B3 sequential. B2 is the largest single piece in the plan.

---

## Phase C — Group check-in via order code

### C1. Detect order code, route to group endpoint — S

When the scanner emits a code (QR or manual), parse it before calling `useTicketCheckIn.scan`. Order codes are `TIX-` prefixed and 12 chars total — distinct from QR tokens (32 hex) and ticket check-in codes (10 alphanumeric).

If detected, call `ticketOrdersService.groupCheckIn(code, { idempotency_key, device_id, allowed_tier_ids })` instead. Wrap in `useTicketGroupCheckIn` composable that returns a normalized `GroupCheckInOutcome` carrying the `summary` + per-ticket `results`.

### C2. Group result UI — M

In place of the single-ticket banner, show a group result card:

- Header: "Group check-in — {summary.entered}/{summary.total} entered".
- Sub-line: counts for `reentered`, `rejected`, `replayed`.
- Expandable list of per-ticket rows: attendee name + tier + outcome chip. Already-used tickets show in muted yellow with "checked in earlier".
- If any ticket failed `wrong_tier`, show tier-name redirection text inline.

Reuse the suspicious badge pattern at the row level when individual tickets carry `suspicious: true`.

C1 → C2 sequential. Plugs into B2 by branching at the parse step.

---

## Phase D — Undo

### D1. `useUndoCheckIn` composable — S

File: [src/composables/tickets/useUndoCheckIn.ts](../src/composables/tickets/useUndoCheckIn.ts)

Wraps `ticketsService.undo`. Tracks the most recent successful scan (entry / reentry) with its timestamp + check-in code; exposes `canUndo` (computed from `Date.now() - lastSuccessAt < 5 * 60 * 1000`) and `undo(reason?)`.

Persists `lastSuccess` in memory only — by design the undo button shouldn't survive a page reload.

### D2. Undo button + confirm — S

Tertiary action in the scan view's action row. Shows when `canUndo`. Tap → confirmation sheet ("Undo check-in for {attendee_name}?") → call composable → on success show a brief "Check-in undone" toast + revert the optimistic counter increment.

D1 → D2 sequential.

---

## Phase E — Attendee search drawer

### E1. `AttendeeSearchDrawer.vue` — M

File: [src/components/tickets/AttendeeSearchDrawer.vue](../src/components/tickets/AttendeeSearchDrawer.vue)

Drawer styled like `RegistrationCheckinModal.vue`. Opens from the scan view's "Find attendee" CTA.

- Debounced search input (300ms) → `ticketAnalyticsService.listAttendees(eventId, { search, status: 'valid', page_size: 50 })`.
- Server-side search now matches name/email/buyer/confirmation/check-in code, so client-side filtering is no longer needed.
- Per-row: attendee name, tier, status pill (greyed if `check_in_count > 0`), buyer email if different from attendee.
- Tap row → emit `select(check_in_code)`; parent dispatches via `useTicketCheckIn.scan(code, 'attendee_search')` and closes the drawer.
- Empty state: "No attendees found for {query}".
- Loading + error states inline.

### E2. Wire into scan view — S

Add the "Find attendee" button to the action row; mount the drawer at the view level; pass `eventId` and a `select` handler that re-uses the same composable scan path.

E1 → E2 sequential.

---

## Phase F — Offline queue + batch sync

### F1. `useOfflineScanQueue` composable — M

File: [src/composables/tickets/useOfflineScanQueue.ts](../src/composables/tickets/useOfflineScanQueue.ts)

`localStorage`-backed queue (key `scan:eventId:queue`). Each entry:

```ts
{
  idempotency_key: string,    // generated upfront in B1
  qr_code?: string | check_in_code?: string,
  scanned_at: string,         // ISO timestamp captured at scan time
  device_id: string,
  source: 'qr' | 'manual' | 'attendee_search' | 'order',
  allowed_tier_ids?: number[],
  enqueuedAt: number,         // for the 7-day cap warning
}
```

Operations:

- `enqueue(entry)` — append, persist.
- `peek(n)` — read up to N (default 200).
- `remove(keys)` — drop reconciled entries.
- `size` reactive ref.

The composable also runs an auto-sync loop: when `navigator.onLine` flips true (or every 30s while online and queue non-empty), POST in batches of ≤200 to `ticketsService.batchSync(eventId, { scans })`. Reconcile by `idempotency_key` from `response.results[]` — drop every returned key from the queue regardless of whether `ok` is true (the audit row is permanent either way).

Stale guard: warn (don't block) if any queued entry's `enqueuedAt` is more than 6 days old; drop entries past 7 days (backend rejects them anyway).

### F2. Online ↔ offline transitions in `useTicketCheckIn` — M

When `scan()` is called and `!navigator.onLine`, skip the live POST and call `offlineQueue.enqueue` instead. Synthesize an immediate optimistic outcome (`entry`/`reentry`) for the UI based on the local cache of the ticket if available, or a `queued` outcome otherwise:

```ts
{ kind: 'queued'; idempotency_key: string; scannedAt: string }
```

Add `queued` to the `ScanOutcome` union. The view shows a blue "Queued — will sync" banner.

When the live POST fails with a network error, also enqueue. Don't double-enqueue if the same idempotency_key is already in the queue.

### F3. Offline status banner + sync indicator — S

Persistent thin bar at the bottom of the scan view:

- Online + empty queue: hidden.
- Online + queue non-empty: "Syncing N scans…" with a progress dot.
- Offline: "Offline — N scans queued".
- After sync: brief "Synced N scans (M issues)" toast with a tap-through to a queue-results modal that shows per-scan outcomes from the last batch.

### F4. Reconciliation review modal — S

When the batch sync returns, surface any non-`ok: true` results in a brief "Sync issues" modal so staff know which queued scans failed (e.g. "3 already used", "1 ticket not found"). Auto-dismiss after acknowledgment.

F1 → F2 → F3 → F4 sequential.

---

## Phase G — Suspicious-scan UI

### G1. Amber badge — XS

In the entry / reentry banner, when `outcome.suspicious === true`, overlay an amber chip: "Possible duplicate — same QR scanned at another station within 30s". This is advisory; the entry still counts.

### G2. Tap-through to filtered audit log — depends on Phase H

Make the chip tappable; route to `/events/:id/manage?tab=checkin-log&ticket={ticket_id}`. Disabled until Phase H1 ships.

---

## Phase H — Organizer surfaces (v1.5)

### H1. Audit log viewer — M

New tab on the manage view: `/events/:id/manage?tab=checkin-log`.

File: [src/components/EventCheckinLogTab.vue](../src/components/EventCheckinLogTab.vue) (or under `src/components/tickets/`).

- Paginated table backed by `ticketCheckinLogService.list(eventId, filters)`.
- Filters: ticket, staff, outcome, source, device_id, since/until.
- Columns: timestamp (`scanned_at` with `server_recorded_at` tooltip), attendee, tier, staff email, device, source, outcome, idempotency_key (truncated, click-to-copy).
- Outcome chips colored consistently with the scan view.
- Export to CSV: client-side (DRF endpoint not specced in the new doc — verify before scoping).

### H2. Walk-up door sales drawer — M

Drawer launched from the tickets manage tab.

File: [src/components/tickets/DoorSaleDrawer.vue](../src/components/tickets/DoorSaleDrawer.vue).

- Form: tier picker with quantities (max-per-order enforced client-side), `door_payment_type` radio (cash / card_offline / other), optional buyer name/email/phone, `transaction_reference` input, `admin_notes` textarea, `auto_check_in` toggle (default on).
- Submit → `ticketOrdersService.createDoorSale(eventId, payload)`.
- On success: receipt-style result card with confirmation code, items, total, "Tickets issued and checked in" badge if `auto_check_in`, and a "Print receipt" CTA (browser print of the result card for v1).
- Refresh the analytics counter on the manage tab after a sale.

H1 and H2 are independent — parallelizable.

---

## Phase I — Tests + manual QA

### I1. Unit tests for composables — S each

- `useTicketCheckIn`: every `ScanOutcome` branch including `replayed`, `wrong_event`, `wrong_tier`, `network_error`. Verify manual code is uppercased; verify idempotency key is generated and threaded through.
- `useUndoCheckIn`: `canUndo` time gate; success path; reject when no recent scan.
- `useOfflineScanQueue`: enqueue, peek, remove, stale-7d cap, reconciliation by idempotency key.

### I2. Component tests — S

- `EventTicketScanView`: manual happy path (B3), already-checked-in rejection, group code branching, queued-when-offline banner.
- `AttendeeSearchDrawer`: search debounce + select callback.

### I3. Manual QA checklist (real device)

Run before each release on iOS Safari + Android Chrome:

- Golden path: scan valid QR → green ENTRY + sound + haptic.
- Re-entry tier: scan twice → green ENTRY then yellow RE-ENTRY (#2).
- Non-reentry tier: scan twice → green then red REJECTED with timestamp.
- Refunded ticket → red REJECTED.
- Cancelled ticket → red REJECTED.
- Before event window → red REJECTED with "Event is not currently running".
- Mismatched event (scan event B's QR while on event A's `/scan`) → red WRONG EVENT.
- Garbage QR → red INVALID.
- Manual entry with `0OIL1` chars → blocked with helper hint.
- Camera permission denied → error card with retry.
- Mute toggle survives reload (localStorage).
- Group: scan a `TIX-` order code → group result card with mixed entered/already-used.
- Undo: successful scan → tap Undo → confirm → ticket back to valid; tap again 6+ minutes later → undo button gone.
- Tier scoping: configure scanner for VIP tier; scan a GA ticket → red WRONG GATE with VIP entrance text.
- Suspicious: scan a valid ticket on device A; within 30s scan again on device B → green ENTRY + amber suspicious badge (or red ALREADY CHECKED IN + amber, on non-reentry tiers).
- Attendee search: open drawer, type 2 chars → server results; tap row → entry banner.
- Offline: airplane mode → scan 5 codes → all show "Queued"; toggle online → batch sync runs → "Synced 5 (0 issues)"; reload → queue is empty.
- Replay: scan once online; force-quit; rescan same QR → response should NOT double-count (idempotency_key cache).

---

## Sequencing summary

| Order | Step | Size | Depends on |
|-------|------|------|------------|
| 1a | A1 — Continuous scanner mode | S | — |
| 1b | A2 — Service layer additions | M | — |
| 1c | A3 — Router + entry CTA | XS | — |
| 1d | A4 — i18n keys | XS | — |
| 2  | B1 — `useTicketCheckIn` | M | A2 |
| 3  | B2 — Scan view | L | A1, A3, A4, B1 |
| 4  | B3 — View test | S | B2 |
| 5  | C1 + C2 — Group check-in branch + UI | S + M | A2, B2 |
| 6  | D1 + D2 — Undo composable + button | S + S | A2, B2 |
| 7  | E1 + E2 — Attendee drawer | M + S | B2 |
| 8a | F1 — Offline queue composable | M | A2 |
| 8b | F2 — Online/offline integration | M | B1, F1 |
| 8c | F3 + F4 — Status banner + sync results | S + S | F2 |
| 9  | G1 — Suspicious badge | XS | B2 |
| 10a | H1 — Audit log tab (v1.5) | M | A2 |
| 10b | H2 — Door sale drawer (v1.5) | M | A2 |
| 11 | I1, I2, I3 — Tests + QA | rolls with each phase | — |

Phase A items are parallel. Phases C/D/E are independent of each other once B2 is in (can be parallel). Phase F has internal serial deps but is independent of C/D/E. Phase H is parallel with v1 if a second pair of hands is available.

---

## Open questions

1. **Audit-log CSV export** — backend doc doesn't mention an export endpoint for the check-in log. Confirm before committing to the export feature in H1; otherwise client-side CSV serialization is fine.
2. **Receipt printing for door sales** — browser print of a styled card is the v1 plan. Native receipt-printer integration (ESC/POS via WebUSB) is out of scope unless product asks.
3. **`source` value for group check-ins triggered from a `TIX-` scan** — backend has both `qr` and `order` source values; we'll use `order` for the `groupCheckIn` calls.
4. **Permission for the audit log tab (H1)** — assume the same `event.can_edit` gate as the rest. If product wants a more granular "can-view-log-but-not-edit" permission, that's a backend ask.
