# Table Seating Feature — Implementation Notes

> Backend contract: `C:\Users\narit\Code\GoEvent\TABLE_SEATING_API_DOCS.md` (table CRUD + guest assignment) and `C:\Users\narit\Code\GoEvent\RSVP_API_DOCS.md` (guest-facing `table` field on the shortcode RSVP endpoint).

## Overview

Two related pieces landed together:

1. **Organizer-facing seating board** — a new "Table Seating" sub-tab inside Guest Management where hosts create tables and drag guests onto them (or manage a table's full guest list from a detail modal).
2. **Guest-facing seat display** — once a host assigns a guest to a table, the guest sees which table (and seat, if labelled) they're at directly on their personal invitation/showcase page.

---

## 1. Organizer seating board

### API layer

- New types in [`src/services/api/types/guest.types.ts`](../src/services/api/types/guest.types.ts): `EventTable`, `EventTableGuestSummary`, `CreateTableRequest`, `UpdateTableRequest`, `TableListFilters`, `BulkReorderTablesRequest`, `BulkAssignTableRequest`/`Response`, plus `table` / `table_details` / `seat_number` added to `EventGuest` and `UpdateGuestRequest`, and `unassigned` / `table` added to `GuestListFilters`.
- New service [`src/services/api/modules/tables.service.ts`](../src/services/api/modules/tables.service.ts): `getTables`, `getTable`, `createTable`, `updateTable`, `deleteTable`, `bulkReorderTables` against `/api/events/{event_id}/tables/`.
- `guestService.bulkAssignTable` added to [`guests.service.ts`](../src/services/api/modules/guests.service.ts) — `POST /api/events/{id}/guests/bulk-assign-table/`.
- Both re-exported through [`src/services/api.ts`](../src/services/api.ts) and `modules/index.ts`.

### UI

- [`src/components/invitation/SeatingTablesView.vue`](../src/components/invitation/SeatingTablesView.vue) — the board itself:
  - Left panel: searchable, paginated "Unassigned Guests" pool with multi-select checkboxes and a bulk "Assign to..." dropdown.
  - Right panel: table cards in a responsive grid, each showing a capacity bar (`occupied_seats` / `capacity`), seated guests, and an editable seat-number input per guest.
  - Native HTML5 drag-and-drop (no external library): dragging a single guest card calls `PATCH /guests/{id}/ { table }`; dragging a multi-selected set calls `bulk-assign-table`. Dragging back onto the "Unassigned" panel sets `table: null`. Capacity/duplicate-seat-number errors from the API surface as a toast.
  - Clicking a table card (or its "View & manage guests" link) opens [`TableDetailModal.vue`](../src/components/invitation/TableDetailModal.vue) — added after initial delivery because compact card chips truncate long guest names. The modal shows full names, seat-number editing, per-guest unassign, and an "Add Guest to This Table" search box that assigns straight from the unassigned pool without dragging.
  - [`TableFormModal.vue`](../src/components/invitation/TableFormModal.vue) — shared create/edit modal (name, capacity, color, notes).
- [`src/components/EventGuestManagementTab.vue`](../src/components/EventGuestManagementTab.vue) — added a visible sub-tab bar ("Guest List" / "Table Seating"). The `subTabs` array already existed in code but was never rendered; this was the first time a second sub-tab existed, so the switcher itself was added.

---

## 2. Guest-facing seat display

The `GET/POST /api/events/{event_id}/guest-rsvp/` endpoint (used by `GuestRSVPSection.vue` for private events) now returns a `table` object on the form state:

```json
"table": { "id": 3, "name": "Table 5", "color": "#3498db", "seat_number": "A3" }
```

`table` is `null` until the host assigns a table; `seat_number` is an empty string if the host never labelled individual seats.

### Changes

- [`src/services/api/types/rsvp.types.ts`](../src/services/api/types/rsvp.types.ts) — added `GuestRsvpTableInfo` and the `table` field on `GuestRsvpFormState`.
- [`src/components/showcase/GuestRSVPSection.vue`](../src/components/showcase/GuestRSVPSection.vue) — renders a small pill badge ("You're seated at Table 5 · Seat A3") right under the RSVP header whenever `formState.table` is present. Shown regardless of whether the guest is mid-wizard or viewing the collapsed post-submit summary, since seating is independent of RSVP editing state.
- [`src/utils/translations.ts`](../src/utils/translations.ts) — added `rsvp_table_assigned` / `rsvp_table_seat` keys (`{table}` / `{seat}` placeholders, replaced client-side) in all three supported languages (`en`, `kh`, `zh-cn`).

### Known limitation

`GuestRSVPSection` only mounts when the event's RSVP slot renders, which is gated by `event.rsvp_enabled !== false`. If a host disables RSVP entirely but still seats a guest via the organizer board, that guest won't see the seat badge (the component never mounts to fetch it). This is a pre-existing conditional in `MainContentStage.vue`/`EventInfo.vue`, not something introduced by this feature — flagged here in case it needs a follow-up (e.g. rendering the table badge independently of the RSVP slot).

---

## Manual verification

Type-check (`vue-tsc --noEmit`), lint, and a full `vite build` all pass. Drag-and-drop and the guest-facing badge were confirmed working in the browser during development (see screenshot feedback in the corresponding session) — no automated test coverage was added for the new components.
