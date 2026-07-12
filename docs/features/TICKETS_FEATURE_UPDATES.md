# Ticketing Feature — Implementation Update

> Companion to `docs/TICKETS_FEATURE_PLAN.md`. Captures everything that landed since the original plan: phases shipped, contract realignments, and outstanding backend issues we found during integration.
>
> Backend contract: `C:\Users\narit\Code\GoEvent\TICKETS_FRONTEND_GUIDE.md` and `C:\Users\narit\Code\GoEvent\TICKETS_API_DOCS.md`.

---

## Phases shipped

### Phase 1 — Foundation (API layer + Explore badge)

- New types: [`src/services/api/types/ticket.types.ts`](../src/services/api/types/ticket.types.ts) — every shape from the guide (TicketType, TicketOrder list/detail, Ticket, Refund, CheckoutQuestion, Analytics, Promo, CheckIn, Comp).
- Three optional fields added to `Event` in [`event.types.ts`](../src/services/api/types/event.types.ts): `has_ticketed_sales`, `min_ticket_price`, `min_ticket_currency`. Plus `total_capacity` and `total_tickets_remaining` once the backend exposed them.
- Five new ticketing filters added to `EventFilters`: `has_ticketed_sales`, `on_sale`, `min_price`, `max_price`, `currency`.
- Notification surface extended: 8 new `NotificationType` literals + `notify_ticket_status` preference.
- Seven new service modules under [`src/services/api/modules/`](../src/services/api/modules/):
  - `ticket-types.service.ts`
  - `checkout-questions.service.ts`
  - `ticket-orders.service.ts`
  - `tickets.service.ts`
  - `ticket-refunds.service.ts`
  - `ticket-analytics.service.ts`
  - `promo-codes.service.ts`
- Re-exports wired through [`src/services/api.ts`](../src/services/api.ts) and [`api/types/index.ts`](../src/services/api/types/index.ts).
- Explore-card badge: "From $X" or "Free RSVP" pill in [`EventCard.vue`](../src/components/events/EventCard.vue) on both mobile + desktop variants. Two new i18n keys (`events.card.fromPrice`, `events.card.freeRsvp`).

### Phase 2 — Organizer setup (tiers + checkout questions)

- New `tickets` parent tab in [`EventManageView.vue`](../src/views/EventManageView.vue) gated by the existing `canViewRestrictedTabs` rule. Lucide `Ticket` icon registered in [`EventNavigationTabs.vue`](../src/components/EventNavigationTabs.vue) and [`EventManageMobileTabBar.vue`](../src/components/EventManageMobileTabBar.vue).
- Parent component [`EventTicketsTab.vue`](../src/components/EventTicketsTab.vue) with internal sub-tab nav (`orders | tiers | questions`) and `?sub=` URL sync that preserves the parent's `?tab=tickets`.
- New components under [`src/components/tickets/`](../src/components/tickets/):
  - `TicketTypesManager.vue` + `TicketTypeFormModal.vue` — tier list with state badges (sold-out/inactive/sale-window state/re-entry), drag-order swap (no bulk-reorder backend), edit, delete, **toggle-active** via `PATCH { is_active }` on the detail endpoint.
  - `CheckoutQuestionsManager.vue` + `CheckoutQuestionModal.vue` — question list with required/inactive/scope badges, **bulk-reorder fallback** (parallel `PATCH` calls — backend has no bulk endpoint).
- Full `management.tickets.*` i18n namespace in `en` + `kh` with action labels, type labels, validation messages.

### Phase 3 — Buyer flow

- `qrcode` + `@types/qrcode` added to dependencies for client-side QR rendering.
- New routes in [`router/index.ts`](../src/router/index.ts):
  - `/events/:id/checkout` → `TicketCheckoutView`
  - `/my-tickets` → `MyTicketsView`
  - `/my-tickets/:code` → `MyTicketOrderView`
- Pinia store [`src/stores/ticketCheckout.ts`](../src/stores/ticketCheckout.ts) — single-event cart persisted to `sessionStorage` so a refresh on checkout doesn't drop selections.
- QR helper [`src/utils/qrcode.ts`](../src/utils/qrcode.ts) — wraps `qrcode.toDataURL` with consistent options.
- Public-event drawer integration: [`PublicEventDrawer.vue`](../src/components/PublicEventDrawer.vue) shows [`TicketTierList`](../src/components/tickets/public/TicketTierList.vue) when the event has ticketed sales and hides the legacy registration card.
- [`TicketTierList.vue`](../src/components/tickets/public/TicketTierList.vue) — tier rows with quantity steppers bounded by `max_per_order` and `quantity_remaining`; live subtotal; "Buy N tickets" CTA; "Sign in to buy" fallback for anonymous visitors.
- [`TicketCheckoutView.vue`](../src/views/TicketCheckoutView.vue) — single-page checkout: cart review, buyer info (prefilled from auth), checkout questions filtered to cart tiers, debounced promo-code preview, totals, submit.
- [`MyTicketOrderView.vue`](../src/views/MyTicketOrderView.vue) — state-machine UI driven by `order.status`. Embeds proof upload form for `pending`, ticket cards (with QR + check-in code) for `paid`, refund modal when `is_refundable`, live ticking refund-window countdown for the last 2h.
- [`TicketProofUploadForm.vue`](../src/components/tickets/public/TicketProofUploadForm.vue) — payment-method picker (button cards matching the donation form), inline image preview / PDF link for the proof file, transaction reference, notes, copy-to-clipboard for account numbers.
- [`TicketCard.vue`](../src/components/tickets/public/TicketCard.vue), [`RefundRequestModal.vue`](../src/components/tickets/public/RefundRequestModal.vue) — supporting components.
- "My Tickets" navigation links added to both [`AppSidebar.vue`](../src/components/AppSidebar.vue) (desktop user dropdown) and [`MobileTabBar.vue`](../src/components/MobileTabBar.vue) (mobile user menu), both auth-gated by being inside the user menu.
- Full `events.tickets.*` i18n namespace in `en` + `kh`.

### Phase 4 — Organizer order review

- New `orders` sub-tab in [`EventTicketsTab.vue`](../src/components/EventTicketsTab.vue) — promoted to **default** sub-tab since it's the daily destination once tickets go on sale.
- [`TicketOrdersList.vue`](../src/components/tickets/TicketOrdersList.vue) — paginated list with horizontal status-filter pills (All / Awaiting review / Pending / Paid / Refund requested / Refunded / Cancelled). `awaiting_review` rows highlighted with amber border. Click → opens drawer + writes `?order=` to URL. Refresh button. Status icon + status badge per row.
- [`TicketOrderReviewDrawer.vue`](../src/components/tickets/TicketOrderReviewDrawer.vue) — right-side drawer (bottom sheet on mobile). Sections: Buyer / Items / Payment (method + transaction ref + buyer notes + **inline image preview** for jpg/png/gif/webp proofs, "Open file" link for PDF) / Comp callout / Review history / Refund summary. Action area visible only on `awaiting_review`: admin-notes textarea, **Confirm** + **Reject** buttons. Reject requires notes (validated client-side before hitting the API). On success the row in the list is patched in-place.
- Notification deep link `/events/{id}/manage?tab=tickets&order={code}` resolves end-to-end:
  1. `EventManageView` reads `?tab=tickets` → renders `EventTicketsTab`.
  2. `EventTicketsTab.initialSub()` sees `?order=` without `?sub=` → jumps to `orders`.
  3. `TicketOrdersList` watches `route.query.order` → pops the drawer.
  4. Closing the drawer strips `?order=` from the URL.
- Full `management.tickets.orders.*` i18n namespace in `en` + `kh`.

---

## Backend contract realignments

The backend contract evolved during integration. Each row below was a fix we applied after the docs or live behaviour shifted.

| Topic | Before | After (current) | Change applied |
|---|---|---|---|
| Tier toggle-active | `POST .../toggle-active/` | `PATCH detail { is_active }` | Service + caller updated |
| Checkout-question bulk reorder | Documented bulk endpoint | Backend says "NOT yet built" | Service shimmed to fan out parallel `PATCH` calls; caller signature unchanged |
| Organizer orders URL | `/events/{id}/ticket-orders/` | `/events/{id}/organizer/ticket-orders/` | Service URL fixed; new `getForEvent` helper added |
| Drawer discriminator (public event) | `event.has_ticketed_sales` from event-detail endpoint | Detail endpoint may not include the field | Drawer fetches tiers itself; `hasTicketedSales = event.has_ticketed_sales ?? tiers.length > 0`. Tier list passed down to `TicketTierList` to avoid duplicate fetch |
| Buyer payment method source | Confused with platform-level `payment.PaymentMethod` | Event-scoped `events.EventPayment` with `payment_type='ticket_sales'` | Filter on the picker is `is_active && payment_type === 'ticket_sales'`; rest of the picker UI matches the existing donation-form pattern |
| `EventPaymentMethod.payment_type` union | `'donation' \| 'gift' \| 'sponsorship'` | + `'ticket_sales'` | Union extended in `payment.types.ts` for both list response and create request |
| `TicketOrder.payment_method` shape | Nested object `{id, name, payment_type}` | Plain int FK + sibling `payment_method_name` string | Type changed to `payment_method: number \| null` + `payment_method_name: string \| null`. Drawer reads `order.payment_method_name` |
| `TicketOrder.payment_proof_url` | Documented as `payment_proof_url` | Live serializer returns `payment_proof` (raw FileField name) | Type lists both keys. Drawer uses `rawProofUrl = payment_proof_url ?? payment_proof ?? null` to be tolerant either way |
| `Event` ticketing summary fields | 3 fields | 5 fields (added `total_capacity`, `total_tickets_remaining`) | Added to `Event` type for "only X left" badges later |
| Comp recipient | Tentative spec | `recipient_email` required + optional `recipient_name`, 404 with field-level error if email unknown | `CompTicketRequest` type accepts optional `recipient_name` |
| Ticket cart store | Auto-`startCart(tier.event_id)` on every `setQuantity` | Caller controls cart eventId; store no longer reads `tier.event_id` | Fixes the "+ button stuck at 1, Buy disabled" bug that triggered when the live API didn't include `event_id` on tier rows |

---

## Outstanding backend issues we found

These are gating real flows in the UI but require backend changes — there are no clean frontend workarounds.

### 🔴 BLOCKER — Organizer order detail returns the slim list serializer

Endpoint `GET /api/events/{event_pk}/organizer/ticket-orders/{code}/` is wired to `EventTicketOrderListViewSet`, which uses `TicketOrderListSerializer` for both list **and** retrieve. The slim serializer is missing every field the order-review drawer needs:

- `payment_proof` (the receipt the organizer is supposed to verify) ❌
- `payment_method_name` ❌
- `items` (line items) ❌
- `tickets` (issued tickets) ❌
- `answers` (checkout question answers) ❌
- `transaction_reference` / `buyer_notes` / `admin_notes` ❌
- `proof_submitted_at` / `is_refundable` / `refund` ❌

**Where:** `tickets/views.py:432` and `tickets/urls.py:68-76` (backend repo).

**One-line fix:** override `get_serializer_class` on the viewset:

```py
def get_serializer_class(self):
    if self.action == 'retrieve':
        return TicketOrderDetailSerializer
    return TicketOrderListSerializer
```

**Impact until fixed:** the order review drawer is empty — organizer cannot see the proof image, line items, or anything actionable. Confirm/Reject buttons still hit the right endpoints once status is `awaiting_review`, but the organizer is approving blind.

### 🟡 MINOR — Doc/code mismatch on `payment_proof` field name

[TICKETS_FRONTEND_GUIDE.md line 462](../GoEvent/TICKETS_FRONTEND_GUIDE.md) documents the proof URL as `payment_proof_url`. The live serializer returns it as `payment_proof`. Either:

1. Add `payment_proof_url = SerializerMethodField()` on `TicketOrderDetailSerializer` to match the docs, OR
2. Update the docs to say `payment_proof`.

Frontend now reads either key, so this is not blocking.

### 🟡 MINOR — Bulk-reorder for checkout questions

Backend explicitly lists this as "NOT yet built" in [TICKETS_API_DOCS.md → API Status](../GoEvent/TICKETS_API_DOCS.md). Frontend falls back to parallel per-row `PATCH` calls; will benefit from a real bulk endpoint if/when it ships.

### 🟡 MINOR — `has_ticketed_sales` only on list serializer

The discriminator field is documented as part of `EventListSerializer`. The detail endpoint (used by `PublicEventDrawer`) doesn't reliably surface it. We work around this by fetching tiers directly in the drawer and using "tier exists" as the gate.

---

## Files changed in this drop

### New files

```
src/components/EventTicketsTab.vue
src/components/tickets/CheckoutQuestionModal.vue
src/components/tickets/CheckoutQuestionsManager.vue
src/components/tickets/TicketOrderReviewDrawer.vue
src/components/tickets/TicketOrdersList.vue
src/components/tickets/TicketTypeFormModal.vue
src/components/tickets/TicketTypesManager.vue
src/components/tickets/public/RefundRequestModal.vue
src/components/tickets/public/TicketCard.vue
src/components/tickets/public/TicketProofUploadForm.vue
src/components/tickets/public/TicketTierList.vue
src/services/api/modules/checkout-questions.service.ts
src/services/api/modules/promo-codes.service.ts
src/services/api/modules/ticket-analytics.service.ts
src/services/api/modules/ticket-orders.service.ts
src/services/api/modules/ticket-refunds.service.ts
src/services/api/modules/ticket-types.service.ts
src/services/api/modules/tickets.service.ts
src/services/api/types/ticket.types.ts
src/stores/ticketCheckout.ts
src/utils/qrcode.ts
src/views/MyTicketOrderView.vue
src/views/MyTicketsView.vue
src/views/TicketCheckoutView.vue
```

### Modified files

```
src/components/AppSidebar.vue                              + My Tickets link, Ticket icon
src/components/EventManageMobileTabBar.vue                 + canViewTickets prop
src/components/EventNavigationTabs.vue                     + canViewTickets prop, Ticket icon
src/components/MobileTabBar.vue                            + My Tickets link
src/components/PublicEventDrawer.vue                       + TicketTierList integration, tier prefetch
src/components/events/EventCard.vue                        + price/RSVP badge
src/i18n/locales/{en,kh}/events.json                       + events.tickets.* namespace
src/i18n/locales/{en,kh}/management.json                   + management.tickets.* namespace
src/router/index.ts                                        + 3 new buyer routes
src/services/api.ts                                        + re-exports for new modules/types
src/services/api/types/event.types.ts                      + ticketing fields + filters
src/services/api/types/index.ts                            + ticket.types export
src/services/api/types/notification.types.ts               + 8 ticket notif types + preference
src/services/api/types/payment.types.ts                    + 'ticket_sales' to payment_type union
src/views/EventManageView.vue                              + Tickets tab + canViewTickets gate
package.json / package-lock.json                           + qrcode + @types/qrcode
```

---

## What to test once the backend ships the serializer fix

1. **Organizer setup:** create a tier, set up an event payment method with `payment_type='ticket_sales'`, optionally add a checkout question.
2. **Buyer purchase:** open the event drawer → pick a tier → checkout → upload proof.
3. **Organizer review:** notification arrives → click → lands on `/events/{id}/manage?tab=tickets&order=TIX-...` with the drawer open and the proof image inline. Confirm or Reject.
4. **Buyer sees confirmed tickets:** order detail page now shows `TicketCard`s with QR + check-in code.

Phase 5 (refund queue under a `refunds` sub-tab), Phase 6 (door scanner), Phase 7 (analytics + attendee CSV), Phase 8 (comp tickets + ticket commissions) are all unstarted but their service-layer methods are already in place.
