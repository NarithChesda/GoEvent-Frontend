# Tickets — Payment Method Picker & Settings Tab Update

Follow-up to `docs/TICKETS_FEATURE_UPDATES.md` (commit `9ae24e4`). This pass closes
two gaps in the paid-ticketing rollout:

1. **Buyers couldn't pick a payment method** when uploading proof for a ticket
   order — the picker rendered but the list was always empty.
2. **"My Tickets" had no first-class home in the user's settings flow.**

It also adds a `ticket_sales` option to the organizer's payment-method type
dropdown, which had been blocking the only way to surface methods to buyers.

---

## What broke and why

### 1. `event` field shape mismatch on the buyer order detail endpoint

`GET /api/ticket-orders/{confirmation_code}/` was returning the **slim list
serializer** payload for the `retrieve` action — the same backend bug we
already filed for the organizer-side `EventTicketOrderListViewSet`. The slim
shape carries flat companions (`event_id`, `event_title`, `event_slug`,
`event_start_date`, `event_end_date`, `event_location`) plus `event` as a bare
UUID string (the FK as PK), and omits a nested `event` object entirely.

Symptom on the page: `order.event.id` resolved to `undefined`, the buyer's
proof form mounted with `:event-id="undefined"`, the methods endpoint was
hit at `/api/events/undefined/payment-methods/`, and Django returned a 500
`ValidationError` HTML page. The picker silently rendered empty.

We diagnosed this with a temporary in-page debug panel that ran a parallel
raw `fetch` against the methods endpoint (independent of `apiClient`) and
echoed URL / status / auth-header / body. The body proved Django was being
asked for event `undefined`, which immediately localized the bug to the order
serializer rather than the methods endpoint.

#### Backend ↔ frontend round-trips

The backend dev shipped a `TicketOrderDetailSerializer` change
(commit `0384f25` per their report) intending to:

- Return `event` as a nested `OrderEventBrief` (`{ id, title, slug, start_date,
  end_date, location, is_virtual, banner_image, timezone }`)
- Drop the redundant flat companions
- Standardize on `payment_proof` (file URL) instead of the never-implemented
  `payment_proof_url`

We removed the frontend's defensive layer (`resolvedEventId` /
`resolvedEventTitle` computeds, `payment_proof_url ?? payment_proof`
fallback, `TicketOrderDetail.event?` optional flag) — only to find on
verification that the live response *still* serves the slim flat shape.
Console output:

```
keys = [
  'id', 'confirmation_code', 'event', 'event_id', 'event_title',
  'event_slug', 'event_start_date', 'event_end_date', 'event_location',
  'buyer', 'buyer_name', 'buyer_email', 'buyer_phone', 'subtotal',
  'promo_code', 'promo_discount', 'total', 'currency', 'status',
  'is_comp', 'payment_method', 'payment_method_name', 'payment_proof',
  'transaction_reference', 'buyer_notes', 'admin_notes', 'confirmed_by',
  'confirmed_at', 'proof_submitted_at', 'refund_window_ends_at',
  'is_refundable', 'cancelled_at', 'items', 'tickets', 'answers',
  'refund', 'created_at', 'updated_at',
]
event field = 'b3b1e384-36d7-4f47-b9d7-8083106e6f5a'   // string, not object
```

The backend's reported "removed redundant flat fields" change is not deployed
on the running Django instance — either the serializer override didn't reach
detail, or the commit didn't ship. Sending the keys list back to the backend
team for confirmation.

#### Frontend resolution

We made `TicketOrderDetail` model **what the live response actually returns**:

- `event: string | OrderEventBrief` — string today, object once the backend
  ships the documented detail serializer
- Flat companions kept as required fields: `event_id`, `event_title` plus
  optional `event_slug`, `event_start_date`, `event_end_date`, `event_location`
- `payment_proof: string | null` (kept; no `payment_proof_url`)

[`MyTicketOrderView`](src/views/MyTicketOrderView.vue) reads `order.event_id`
flat for the proof form and `order.event_title` flat for the header. Once the
backend ships the documented nested shape we widen reads to `order.event.id`
/ `order.event.title` and drop the flat fields.

### 2. Organizer's payment-method type dropdown lacked `ticket_sales`

[`PaymentMethodModal`](src/components/PaymentMethodModal.vue) listed only
`donation`, `gift`, `sponsorship` in its `<select>`. Backend Decision #2 in
`TICKETS_FRONTEND_GUIDE.md` requires `payment_type === 'ticket_sales'` on the
chosen `EventPayment` row at submit-proof time, otherwise the API returns
`400 { "payment_method": [...] }`. So organizers literally could not configure
the row buyers needed.

Fix: added `<option value="ticket_sales">` plus `typeTicketSales` i18n keys in
en/kh management bundles. Also fleshed out the organizer-side card display so
saved rows show a green **"Ticket Sales"** badge — `formatPaymentType` and
`getPaymentTypeStyle` in [`PaymentMethodsSection.vue`](src/components/PaymentMethodsSection.vue)
were both falling back to a gray "Ticket_sales" pill.

### 3. Buyer empty-state was ambiguous

The "no methods available" amber message couldn't distinguish *the organizer
hasn't set up any payment methods* from *the organizer's methods exist but
none are tagged for ticket sales*. We split the message:

- `events.tickets.order.proof.noMethods` — zero rows on the event
- `events.tickets.order.proof.noMethodsForTickets` — rows exist but none with
  `payment_type === 'ticket_sales' && is_active`

[`TicketProofUploadForm`](src/components/tickets/public/TicketProofUploadForm.vue)
tracks `rawMethodCount` to pick the right message. Buyers now know whether
to refresh or to pester the organizer.

### 4. Settings → My Tickets

Surfaced the existing buyer ticket list as a tab in `/settings`. Top-nav
"My Tickets" links now go to `/settings?tab=tickets`. Standalone `/my-tickets`
route stays in place so notification deep-links and the order-detail back
button keep working.

New component: [`src/components/settings/TicketsTab.vue`](src/components/settings/TicketsTab.vue) —
same paginated order list as `MyTicketsView` minus the `MainLayout` wrapper.

---

## Files changed

### Type contracts

- **`src/services/api/types/ticket.types.ts`** — `TicketOrderDetail.event`
  widened to `string | OrderEventBrief`; added required `event_id` /
  `event_title` and optional `event_slug` / `event_start_date` /
  `event_end_date` / `event_location`; `payment_proof` simplified to
  `string | null`; comment block records the live-vs-docs mismatch and the
  trigger condition for cleanup.

### Buyer flow

- **`src/views/MyTicketOrderView.vue`** — header reads `order.event_title`;
  proof form receives `:event-id="order.event_id"`. Earlier `resolvedEventId`
  / `resolvedEventTitle` computeds and the temporary debug `console.log` block
  removed.
- **`src/components/tickets/public/TicketProofUploadForm.vue`** — empty-state
  split via `rawMethodCount`. The dev-only debug panel that captured URL /
  status / auth / body was useful for triage and has been removed.
- **`src/components/tickets/TicketOrderReviewDrawer.vue`** — proof preview
  reads `order.payment_proof` directly; `rawProofUrl` tolerance computed
  removed; `proofIsImage` reads from the same field.

### Organizer flow

- **`src/components/PaymentMethodModal.vue`** — `<option value="ticket_sales">`
  added at the top of the type select.
- **`src/components/PaymentMethodsSection.vue`** — `formatPaymentType` and
  `getPaymentTypeStyle` now have a `ticket_sales` branch (i18n label, emerald
  badge).

### Settings tab

- **`src/components/settings/TicketsTab.vue`** *(new)* — ticket-orders list
  for the settings page.
- **`src/views/SettingsView.vue`** — `'tickets'` added to `TabId` union,
  `validTabIds`, the tabs computed, and the conditional render block.
- **`src/components/AppSidebar.vue`** — desktop dropdown "My Tickets" →
  `/settings?tab=tickets`.
- **`src/components/MobileTabBar.vue`** — mobile dropdown "My Tickets" →
  `/settings?tab=tickets`.

### i18n

- **`src/i18n/locales/en/events.json`** + **`kh/events.json`** —
  `noMethodsForTickets` empty-state copy.
- **`src/i18n/locales/en/management.json`** + **`kh/management.json`** —
  `typeTicketSales` payment-method type label.
- **`src/i18n/locales/en/settings.json`** + **`kh/settings.json`** —
  `tabs.tickets` ("My Tickets" / "សំបុត្ររបស់ខ្ញុំ").

---

## Outstanding backend issues

🔴 **Buyer order detail endpoint still returns the slim list shape.** The
backend dev's `0384f25` change does not appear to be live on the dev
instance. Frontend is unblocked via flat-field reads; once the response
matches `TICKETS_FRONTEND_GUIDE.md` (nested `event` object, no flat
companions) we should:

1. Drop `event_id` / `event_title` / `event_slug` / `event_start_date` /
   `event_end_date` / `event_location` from `TicketOrderDetail`
2. Narrow `event: string | OrderEventBrief` back to `event: OrderEventBrief`
3. Switch [`MyTicketOrderView`](src/views/MyTicketOrderView.vue) reads back
   to `order.event.id` / `order.event.title`

Verification command we sent the backend team:

```bash
python manage.py shell
>>> from tickets.serializers import TicketOrderDetailSerializer
>>> from tickets.models import TicketOrder
>>> data = TicketOrderDetailSerializer(TicketOrder.objects.first()).data
>>> type(data['event'])    # should be dict, currently str
>>> 'event_id' in data     # should be False, currently True
```

🟡 **Cosmetic docs reconciliation.** Once the detail shape really ships, the
sample JSON in `TICKETS_FRONTEND_GUIDE.md` (lines ~437-480) and
`TICKETS_API_DOCS.md` matches the code, and the backend's report becomes
accurate.

---

## Smoke tests

- [x] Type check (`npm run type-check`) — clean except pre-existing
      `TicketCheckoutView.vue` template-parser errors (unrelated, present
      before this branch).
- [x] Buyer creates ticket order, lands on `/my-tickets/{code}` → header
      shows event title, proof form renders the picker with the organizer's
      `ticket_sales` method.
- [x] Organizer creates a payment method with type "Ticket Sales" → row
      shows up immediately with the green badge.
- [x] Empty-state messages: deleting all `ticket_sales` rows on the event
      surfaces the "none tagged for ticket sales" copy; deleting *all*
      payment methods surfaces the "no methods available" copy.
- [x] Settings → Tickets tab renders the order list and deep-links to
      individual orders.
- [x] Top-nav and mobile-tab dropdown "My Tickets" both land on
      `/settings?tab=tickets`.
