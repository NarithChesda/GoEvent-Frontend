# Tickets Feature — Frontend Implementation Plan

> Source contract: [`C:/Users/narit/Code/GoEvent/TICKETS_FRONTEND_GUIDE.md`](../../GoEvent/TICKETS_FRONTEND_GUIDE.md)
> Backend reference: `TICKETS_API_DOCS.md` (in the same backend repo)
> Status of backend: service layer + models + notification triggers built and tested. DRF endpoints are designed but not yet exposed; this doc tracks the design contract until the OpenAPI schema lands.

---

## Scope

A **paid public-event ticketing** system covering three audiences:

1. **Buyer** — browse tiers on the public event page → checkout → upload payment proof → view tickets at `/my-tickets/...`.
2. **Organizer** — manage tiers, checkout questions, orders, refunds, comp tickets, analytics, attendee CSV inside `/events/:id/manage` under a new "Tickets" tab cluster.
3. **Door staff** — QR / short-code scanner at `/events/:id/scan` that calls the check-in endpoint.

Out of scope for v1: Stripe/PayPal gateway (manual proof only), email delivery (in-app + Telegram only), live user-search dropdown for comp tickets (email-input only), backend-enforced mutual exclusivity between RSVP and ticketing (UI enforces it).

---

## Architectural decisions

These are the questions raised during planning and the answers from the backend team's "Backend Decisions / Open Questions Answered" section of the guide.

| # | Question | Decision |
|---|----------|----------|
| 1 | OpenAPI schema available? | Not yet — `drf-spectacular` ships with the viewset rollout. **Hand-write types** from the Data Shapes section. |
| 2 | Reuse existing `paymentMethodsService`? | Yes — same `payment.PaymentMethod` FK, no new model. Filter client-side on `is_active=true` and matching `currency` before showing options. |
| 3 | Mutual exclusivity (RSVP vs paid tickets)? | **Not enforced backend-side**. Frontend discriminates on `event.has_ticketed_sales` (with `ticket_types.length > 0` as fallback). |
| 4 | `min_ticket_price` for Explore badge? | **Available now** on `EventListSerializer` — three new fields: `has_ticketed_sales`, `min_ticket_price`, `min_ticket_currency`. |
| 5 | Comp ticket recipient lookup? | Email-input only. Submit-then-handle `404 { recipient_email: [...] }` inline; no autocomplete. |

---

## Discriminator (used in PublicEventView, ExploreView, EventManageView)

```ts
if (event.has_ticketed_sales === true || (event.ticket_types?.length ?? 0) > 0) {
  // Ticketed: show tier list + Buy Tickets, hide RSVP / registration_required UI
} else if (event.rsvp_enabled) {
  // Free RSVP (existing flow)
} else {
  // Display-only event
}
```

---

## Routes to add ([src/router/index.ts](../src/router/index.ts))

| Path | Name | Auth | Purpose |
|---|---|---|---|
| `/my-tickets` | `my-tickets` | yes | Buyer's order + ticket history |
| `/my-tickets/:code` | `my-ticket-order` | yes | Order detail; proof upload, refund, QR display |
| `/events/:id/checkout` | `event-checkout` | yes | Multi-step checkout |
| `/events/:id/scan` | `event-scan` | yes | Door scanner (mobile-first) |

`event-scan` and `event-checkout` join the `sensitiveRoutes` list so tokens are validated before entry.

The organizer tab lives under the existing `/events/:id/manage?tab=tickets[&sub=...&order=...]` pattern — no new route.

---

## API layer

### New types — `src/services/api/types/ticket.types.ts`

Mirror exactly the Data Shapes section from the guide:

- Enums: `TicketOrderStatus`, `TicketStatus`, `RefundStatus`, `CheckoutQuestionType`, `TicketCurrency`
- Resources: `TicketType`, `TicketOrderListItem`, `TicketOrderDetail`, `Ticket`, `TicketCheckoutQuestion`, `TicketAnswer`, `TicketRefund`
- Analytics: `TicketAnalyticsSummary`, `TicketAnalyticsByTier`, `TicketAnalyticsByDay`, `TicketAnalyticsByRefund`, `TicketAnalytics`
- Promo: `PromoValidationRequest`, `PromoValidationSuccess`
- Check-in: `CheckInRequest`, `CheckInResponse`
- Comp: `CompTicketRequest`
- Request payloads: `CreateTicketTypeRequest`, `UpdateTicketTypeRequest`, `CreateCheckoutQuestionRequest`, `UpdateCheckoutQuestionRequest`, `BulkReorderCheckoutQuestionsRequest`, `CreateTicketOrderRequest`, `SubmitProofRequest` (FormData), `RefundRequest`, `ConfirmOrderRequest`, `RejectOrderRequest`, `ApproveRefundRequest`, `RejectRefundRequest`, filters

All money is `string` (DRF Decimal). Never coerce to `number` before display.

### Type extension — `event.types.ts`

Add three optional fields to the unified `Event` interface (used for both list and detail rows):

```ts
has_ticketed_sales?: boolean
min_ticket_price?: string | null
min_ticket_currency?: 'USD' | 'KHR' | null
```

### Notification extension — `notification.types.ts`

Extend `NotificationType` union with the eight ticket types, and add `notify_ticket_status` to `NotificationPreferences` (check-in reuses the existing `notify_check_in`).

### New modules — `src/services/api/modules/`

| File | Service | Surface |
|---|---|---|
| `ticket-types.service.ts` | `ticketTypesService` | list (public via `getPublic` for buyers, authed for organizers), get, create, update, delete, toggleActive |
| `checkout-questions.service.ts` | `checkoutQuestionsService` | list (public, supports `?ticket_type_id=`), get, create, update, delete, bulkReorder. Normalize paginated envelope like `rsvpQuestionsService` does |
| `ticket-orders.service.ts` | `ticketOrdersService` | buyer: listMine, get, create, submitProof (FormData), cancel, requestRefund. Organizer: listForEvent, confirm, reject, issueComp |
| `tickets.service.ts` | `ticketsService` | listMyTickets, getByCode, checkIn |
| `ticket-refunds.service.ts` | `ticketRefundsService` | listForEvent, approve, reject |
| `ticket-analytics.service.ts` | `ticketAnalyticsService` | getAnalytics, listAttendees (paginated JSON), downloadAttendeesCsv (returns Blob via fetch directly because `apiClient` doesn't expose blob support yet) |
| `promo-codes.service.ts` | `promoCodesService` | validate(eventId, payload) |

### Re-exports

- Add new type files to `src/services/api/types/index.ts` (`export * from './ticket.types'`).
- Re-export each new service + types from `src/services/api.ts` (the backward-compat barrel) so callers can keep using `import { ticketsService } from '@/services/api'`.

---

## UI: discovery (Explore)

Phase-1 lightweight badge on every event card in [src/components/events/EventCard.vue](../src/components/events/EventCard.vue):

```html
<span v-if="event.has_ticketed_sales && event.min_ticket_price" class="...">
  {{ t('events.card.fromPrice', { price: formatCurrency(event.min_ticket_price, event.min_ticket_currency) }) }}
</span>
<span v-else-if="event.rsvp_enabled" class="...">
  {{ t('events.card.freeRsvp') }}
</span>
```

Visible on both mobile + desktop card variants. Two new i18n keys (`events.card.fromPrice`, `events.card.freeRsvp`) in `en` and `kh`.

---

## UI: public event detail

[src/views/PublicEventView.vue](../src/views/PublicEventView.vue) gains a new "Tickets" section between Registration and Donation. Wraps `TicketTierList` (under `src/components/tickets/public/`):

- Fetches `ticketTypesService.list(eventId)` on mount when `has_ticketed_sales`.
- Disabled-with-label states for `is_sold_out`, `sale_start > now` (countdown), `sale_end < now`.
- Quantity stepper bounded by `max_per_order` and `quantity_remaining`.
- "Buy Tickets" → `router.push({ name: 'event-checkout', params: { id }, query })` with cart stashed in `useTicketCheckoutStore` (Pinia, sessionStorage-backed).
- When ticketed, hide the existing free RSVP / registration_required panel (UI-side mutual exclusivity).

---

## UI: buyer checkout & order pages

### `TicketCheckoutView.vue`

Single page with stages (no sub-routes — local state machine):

1. **Cart** — quantities editable, subtotal live
2. **Buyer info** — prefilled from `authStore.user`
3. **Questions** — `checkoutQuestionsService.list(eventId)` filtered to question.ticket_type_id null OR matching cart tiers; renderer reuses RSVP question pattern (text / yes_no / single_choice / multi_choice)
4. **Promo code** — debounced call to `promoCodesService.validate` with cart contents
5. **Submit** — `ticketOrdersService.create()` → on 201, push to `/my-tickets/{code}` with proof step open

Mirror server-side validation client-side (max_per_order, currency consistency, required questions).

### `MyTicketsView.vue`

Two tabs: **Orders** (`ticketOrdersService.listMine`) and **Tickets** (`ticketsService.listMyTickets`). Empty state links to `/explore`.

### `MyTicketOrderView.vue`

State machine driven by `order.status`:

- `pending` → `TicketProofUploadForm` (payment method picker filtered by `is_active && currency`, file picker for pdf/jpg/jpeg/png/gif/webp, transaction reference, notes)
- `awaiting_review` → spinner + "We'll notify you" banner
- `paid` → `TicketCard` per issued ticket (QR via `qrcode` package + `check_in_code` underneath), `RefundRequestModal` button if `is_refundable`
- `refund_requested` / `refunded` / `cancelled` / `expired` → terminal banners with status copy from the guide
- 2-hour refund-window-closing warning banner

---

## UI: organizer "Tickets" tab

Add **one** parent tab to `EventManageView.navigationTabs`:

```ts
{ id: 'tickets', label: t('management.tabs.tickets'), icon: 'ticket', mobileLabel: t('management.tabs.ticketsMobile') }
```

Visibility gated by `canViewRestrictedTabs` (existing computed). Inside, a sub-tab nav using the same `activeSubTab` pattern already used by guest-management/expenses. Sub-tabs:

| Sub-tab | Component | Pattern reuse |
|---|---|---|
| `orders` (default) | `TicketOrdersList` + `TicketOrderReviewDrawer` | drawer auto-opens when `?order={code}` is present (notification deep link) |
| `tiers` | `TicketTypesManager` + `TicketTypeFormModal` | mirrors `RsvpQuestionsManager` (drag-reorder + toggle-active) |
| `questions` | `CheckoutQuestionsManager` + `CheckoutQuestionModal` | near-clone of `RsvpQuestionsManager` |
| `refunds` | `RefundQueueList` + `RefundReviewModal` | approve (transaction ref) / reject (notes) |
| `attendees` | `AttendeeTable` | paginated, status filter, CSV export button |
| `analytics` | `TicketAnalyticsDashboard` | KPI cards + bar (by_tier) + line (by_day) using existing `chart.js` + `vue-chartjs` |
| `comps` | `CompTicketModal` | email-input pattern (mirror collaborator invite UX) |

URL state `?tab=tickets&sub=orders&order=TIX-...` — extend the existing `route.query.tab` watcher to also forward `sub` and `order` into the tab component.

---

## UI: door scanner

[src/views/EventScanView.vue](../src/views/EventScanView.vue) — mobile-first single page using the already-installed `html5-qrcode` package. Components:

- Camera viewfinder (with manual code entry fallback)
- Result banner per outcome:
  - `ok=true, was_reentry=false` → big green ✓ ENTRY
  - `ok=true, was_reentry=true` → big yellow ↻ RE-ENTRY (#N)
  - `ok=false` → big red ✗ REJECTED with `message`
- Always shows attendee name + tier so staff can spot fraud
- Sound + `navigator.vibrate()` per outcome
- Last-10 scan log

Authorization: same rule as `canViewRestrictedTabs` (organizer + collaborators with edit perms).

---

## State management

Add **one** Pinia store: [`src/stores/ticketCheckout.ts`](../src/stores/ticketCheckout.ts) — current cart (eventId, items, answers, promo) persisted to `sessionStorage` for refresh resilience across the public-page → checkout-page navigation.

No global stores for orders / tickets / analytics — fetch on view mount with focused composables under `src/composables/tickets/`:

- `useTicketTypes(eventId)` — reactive list of tiers
- `useTicketOrder(code)` — reactive order + actions (submitProof, cancel, requestRefund)
- `usePromoValidation(eventId)` — debounced validator
- `useDoorScanner(eventId)` — wraps `html5-qrcode` + check-in API + audio/haptic feedback

---

## Helpers

- [src/utils/currency.ts](../src/utils/currency.ts) — already handles USD/KHR including KHR's no-decimals rule. **No changes needed.**
- [src/utils/qrcode.ts](../src/utils/qrcode.ts) — **new** — wraps `qrcode.toDataURL` with the recommended options. Used by `TicketCard` and the printable-ticket view. Add `qrcode` + `@types/qrcode` to deps before this lands.

---

## i18n

New namespace files (or existing `events.json` extension) for the `tickets.*` namespace covering:
- Tier states (sold out, opens in X, sales closed)
- 7 order-status labels + 5 ticket-status labels + 4 refund-status labels
- Checkout step titles
- Scanner outcome strings
- All error messages from the guide's Validation Rules section

Two badge keys go into `events.card`: `fromPrice`, `freeRsvp` (added in Phase 1).

---

## Rollout phases

| Phase | Scope | Output |
|---|---|---|
| **1. Foundation** | Types + 7 service modules + notification-type extension + `Event` field extension + Explore badge + plan doc | API layer testable from console; badge live |
| **2. Organizer setup** | `tiers` + `questions` sub-tabs in EventManageView | Organizers can seed tickets; mirrors RSVP patterns we know work |
| **3. Buyer flow** | TicketTierList in PublicEventView → checkout → MyTicketOrderView (incl. proof upload + ticket cards with QR) | End-to-end buyer journey, plus `qrcode` dep added here |
| **4. Organizer review** | `orders` sub-tab + confirm/reject + notification deep links resolve | Closes the payment loop |
| **5. Refunds** | Refund button on order detail + `refunds` sub-tab | |
| **6. Door scanner** | `/events/:id/scan` + `useDoorScanner` | Independent — can ship parallel with Phase 5 |
| **7. Analytics + attendees + CSV** | `analytics` + `attendees` sub-tabs | Polish |
| **8. Comp tickets + ticket commissions** | `CompTicketModal`, ticket commission service & UI | Lower priority |

---

## Acceptance for Phase 1 (tracked in this PR)

- [ ] `docs/TICKETS_FEATURE_PLAN.md` exists and reflects the latest backend decisions.
- [ ] `src/services/api/types/ticket.types.ts` defines every shape from the guide.
- [ ] `Event` interface gains `has_ticketed_sales`, `min_ticket_price`, `min_ticket_currency` (optional).
- [ ] `NotificationType` union includes the 8 ticket types; `NotificationPreferences` adds `notify_ticket_status`.
- [ ] All 7 new service modules exist and compile.
- [ ] Re-exports wired through `src/services/api/types/index.ts` and `src/services/api.ts`.
- [ ] Explore event cards render a "From $X" or "Free RSVP" badge using the new fields.
- [ ] `npm run type-check` passes.

No user-visible flows are wired yet — Phase 1 is a foundation drop. The badge is the only visible change and it gracefully no-ops when the backend hasn't yet started returning the new event fields.
