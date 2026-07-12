# Ticketing UI — Unification Pass + Settings Nav Fix

> Companion to `docs/TICKETS_FEATURE_UPDATES.md`. This pass is purely visual + a small navigation fix — no business-logic changes, no contract changes.
>
> Goal: make the entire ticketing surface (organizer admin, buyer flow, settings) feel like the same product as the Guest Management and Expense tabs, across every screen size. And keep the Settings shell visible when a user drills into one of their orders.

---

## What changed at a glance

- **Design language unified** across 17 ticketing files to match the canonical patterns already in use by the Guest Management and Expense tabs.
- **Settings → Tickets → order detail** no longer leaves the Settings shell — the user sees the Settings header + tab navigation the entire time and can switch tabs or step back without losing context.
- One pre-existing TypeScript error (`v-model` cast in checkout) cleaned up as part of the styling pass.

No props, emits, i18n keys (one tiny addition aside), routing behaviour, or API calls were changed.

---

## Design tokens extracted from Guest + Expense

These are the shared patterns the rest of the work is anchored to. They're worth keeping handy for future ticket-adjacent work.

| Surface | Class string |
|---|---|
| Page header (responsive) | `text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight`, subtitle `text-xs sm:text-sm text-slate-600 mt-1` |
| Sub-tab pills | `flex gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-fit`, active = `bg-white text-slate-900 shadow-sm`, inactive = `text-slate-500 hover:text-slate-700` |
| Sticky filter / actions bar | `sticky top-0 z-20 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm`, inner `flex items-center gap-3 p-3` |
| List row card | `bg-white/80 border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:bg-white transition-all duration-200` with `flex items-center gap-3 px-4 py-3` |
| Status / type badges | `flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium` with semantic palette: emerald-50/700, amber-50/700, rose-50/700, sky-50/700, slate-100/700 |
| Icon-only action button | `p-2 rounded-xl` with intent-tinted hover (44×44 minimum tap target) |
| Empty state (CTA) | `bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-12` with 16×16 icon container, `hover:border-emerald-400` for editable variants |
| Modal / drawer chrome | backdrop `bg-black/40 backdrop-blur-sm z-[998]`, panel `z-[999]`, `bg-white md:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] md:max-h-[calc(100vh-100px)]` |
| Modal / drawer header | `bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]` with `w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm` icon circle |
| Form input | `w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90` |
| Form label | `block text-sm font-medium text-slate-700 mb-2` |
| Primary CTA (action) | `bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl` |
| Primary CTA (commit) | gradient `from-[#2ecc71] to-[#1e90ff]` |
| Toast | `fixed bottom-20 lg:bottom-8 right-4 sm:right-8 left-4 sm:left-auto z-[100]` with slide-up |

---

## Files restyled — organizer side

- [`EventTicketsTab.vue`](../src/components/EventTicketsTab.vue) — header scales `text-xl sm:text-2xl`, sub-tab pills picked up lucide icons (`Inbox` / `Ticket` / `MessageSquareText`), toast restyled to match guest-tab toast, content area `min-h-[400px]`.
- [`TicketOrdersList.vue`](../src/components/tickets/TicketOrdersList.vue) — old horizontally-scrolling pill row replaced with the canonical sticky filter/actions bar. Status filter is now a dropdown matching `ExpenseBudgetsView`'s pattern (slate-900 fill when active, chevron rotation, click-outside dismissal). Order rows use the unified white/80 card surface, status icons in `w-9 h-9 rounded-lg` chips, badges as `rounded-lg text-[10px]` pills, dashed empty state.
- [`TicketTypesManager.vue`](../src/components/tickets/TicketTypesManager.vue) and [`CheckoutQuestionsManager.vue`](../src/components/tickets/CheckoutQuestionsManager.vue) — sticky header with primary emerald "Add" button (label hidden `<sm`), unified row cards, mobile-only action footer (`sm:hidden border-t border-slate-100`) so tap targets stay 44×44 on small screens, normalized status badges.
- [`TicketTypeFormModal.vue`](../src/components/tickets/TicketTypeFormModal.vue) and [`CheckoutQuestionModal.vue`](../src/components/tickets/CheckoutQuestionModal.vue) — backdrop and z-index unified to canonical drawer chrome (`bg-black/40 backdrop-blur-sm z-[998]`, panel `z-[999]`).
- [`TicketOrderReviewDrawer.vue`](../src/components/tickets/TicketOrderReviewDrawer.vue) — reshaped to the floating right-side drawer (`md:top-4 md:bottom-4 md:right-4 w-full md:w-[580px] lg:w-[640px]`, rounded on all sides) instead of the old flush edge. Gradient header with `Receipt` icon, status badge moved into the body. All sub-section cards converted from `bg-slate-50 rounded-xl` to `bg-white/80 border border-slate-200/60 rounded-2xl`. Confirm/Reject moved out of the body into a sticky footer with the brand-gradient primary CTA.

## Files restyled — buyer side

- [`TicketCheckoutView.vue`](../src/views/TicketCheckoutView.vue) — canonical page header, "label outside + body card" form sections, all inputs/labels swapped to canonical styles, gradient submit, `ShoppingCart` empty-cart state, totals card `bg-slate-50/80 border border-slate-200/60 rounded-2xl`. **TS fix:** the `v-model="(answers[q.id] as { text: string }).text"` casts (which `vue-tsc` rejected) replaced with typed accessor helpers in `<script setup>` — `answerText(id)`, `setAnswerText(id, value)`, `answerChoices(id)`, `toggleAnswerChoice(id, choice, checked)`. Template now uses `:value` / `@input` / `@change`. Behaviour identical, type-checker clean.
- [`MyTicketsView.vue`](../src/views/MyTicketsView.vue) — now mirrors `TicketOrdersList.vue` exactly. Sticky white/80 backdrop-blur header bar with `Ticket` icon, count, refresh button. White/80 row cards with status icon chips (`Clock`, `AlertCircle`, `CheckCircle2`, `RotateCcw`, `Ban`, `Hourglass`), `awaiting_review` rows ringed with `ring-1 ring-amber-200/80`, canonical badge palette, chevron affordance. Mobile bottom-padding accounts for safe-area + tab bar.
- [`MyTicketOrderView.vue`](../src/views/MyTicketOrderView.vue) — gradient header (matches the order-review drawer), white/80 sub-section cards, unified action buttons, canonical toast positioning, spinner on cancel. **Slimmed from ~487 lines to ~38 lines** as part of the Settings nav fix below — see next section.
- [`TicketCard.vue`](../src/components/tickets/public/TicketCard.vue) — outer shell `bg-white/80 rounded-2xl shadow-sm`, brand-gradient strip header, `rounded-2xl` QR container with responsive sizing (`w-44 h-44 sm:w-48 sm:h-48`), badges flipped from `rounded-full` to canonical `rounded-lg text-[11px]`.
- [`TicketTierList.vue`](../src/components/tickets/public/TicketTierList.vue) — outer `bg-white/80 rounded-2xl`, tier-state badges as `rounded-lg text-[10px]`, quantity steppers `w-9 h-9 sm:w-8 sm:h-8` (36px tap target on mobile, compact on desktop), brand-gradient checkout CTA.
- [`TicketProofUploadForm.vue`](../src/components/tickets/public/TicketProofUploadForm.vue) — wrapped in canonical card surface, all labels/inputs migrated to canonical styles, method-picker buttons `min-h-[56px]` for comfortable mobile tap with `bg-slate-50` hover, copy-to-clipboard button bumped to `p-2 rounded-xl` (44×44) with `aria-label`, brand-gradient submit.
- [`RefundRequestModal.vue`](../src/components/tickets/public/RefundRequestModal.vue) — full canonical modal chrome: `bg-black/40 backdrop-blur-sm z-[998]/[999]`, gradient header with `RotateCcw` icon, body wrapped in `overflow-y-auto overscroll-contain`, sticky footer with `flex-col-reverse sm:flex-row` button stack (destructive rose-600 primary), `min-h-[44px]` tap targets, spinner during submit.

---

## Settings nav fix — order detail stays inside Settings

### Problem

When a user accessed their tickets through **Settings → Tickets** and clicked an order, they were navigated to `/my-tickets/:code` — a standalone full-page view (`MyTicketOrderView.vue`) that uses `MainLayout` directly. This dropped them out of the Settings shell, so the Settings header and tab navigation disappeared. They couldn't switch to Account / Security / Notifications / etc. without using the browser back button.

### Solution

The order-detail UI is now a reusable component, rendered inline inside the Settings shell when the user came from Settings. Standalone deep links (e.g., notification emails) still work.

#### 1. Extracted reusable panel — [`TicketOrderDetailPanel.vue`](../src/components/tickets/public/TicketOrderDetailPanel.vue)

New component takes a `code: string` prop and owns:

- Data loading via `ticketOrdersService.get(code)` — re-fetches on prop change (`watch(code, ..., { immediate: true })`).
- All loading / error / empty states (canonical patterns).
- The gradient header card, status banner, items list, refund modal, cancel-order action, refund-window countdown ticker, and toast.
- **Does NOT** render its own back button — leaves that to the consumer.

#### 2. Slimmed [`MyTicketOrderView.vue`](../src/views/MyTicketOrderView.vue)

Reduced from ~487 lines to ~38. Keeps `MainLayout :hide-mobile-tab-bar="true"`, the outer container with mobile-safe padding, and the existing back button (`router.push({ name: 'my-tickets' })`). Renders `<TicketOrderDetailPanel :code="code" />` for everything else. **Pixel-equivalent to before** — markup was lifted unchanged.

#### 3. Made [`TicketsTab.vue`](../src/components/settings/TicketsTab.vue) URL-driven

Two sub-states based on `route.query.order`:

- **No `?order`** — renders the orders list. Restyled to match `MyTicketsView.vue`: white/80 row cards, status icon chips, canonical badges, `awaiting_review` ring, chevron affordance. Empty state restyled to canonical dashed card. Header inside TicketsTab kept simpler (no sticky filter bar, since Settings has its own page-level header).
- **`?order=<code>`** — renders `<TicketOrderDetailPanel>` inline above a "Back to my tickets" button. Closing the detail re-fetches the list so newly-changed orders refresh.

Row clicks now push the order code as a query param instead of navigating to `/my-tickets/:code`:

```ts
router.push({ query: { ...route.query, tab: 'tickets', order: code } })
```

Rows are `<button>` elements rather than `<RouterLink>` — destination is a query-only change on the same route, and using a button keeps it explicit that the navigation stays in-place. Touch target stays comfortable (`px-4 py-3` plus 36px icon chip → > 48px effective height) and rows are full-width.

`RouterLink` is still imported in `TicketsTab.vue` because the empty-state "Explore events" link uses it.

#### 4. New i18n key

| Key | en | kh |
|---|---|---|
| `events.tickets.order.backToList` | Back to my tickets | ត្រឡប់ទៅសំបុត្ររបស់ខ្ញុំ |

### Resulting flow

| Step | URL | Settings nav visible? |
|---|---|---|
| Open Settings → Tickets | `/settings?tab=tickets` | yes |
| Click an order | `/settings?tab=tickets&order=ABC123` | **yes — detail renders inline** |
| Click "Back to my tickets" | `/settings?tab=tickets` (clears `?order`, preserves `?tab`) | yes |
| Click another Settings tab from detail | `/settings?tab=account` | yes (tab nav was always there) |
| Browser back / forward / refresh | URL drives state, all paths work | n/a |
| Deep link from email or push | `/my-tickets/ABC123` | n/a — standalone `MyTicketOrderView` still pixel-equivalent |

---

## Type safety

`npm run type-check` is clean on every file touched in this pass. The pre-existing v-model cast errors in `TicketCheckoutView.vue` are now resolved. Other unrelated TS errors elsewhere in the repo (PublicEventDrawer, DonationsTab, useFundraising, etc.) are untouched and not within the scope of this work.

---

## Files touched (final list)

**New**
- `src/components/tickets/public/TicketOrderDetailPanel.vue`

**Modified — organizer**
- `src/components/EventTicketsTab.vue`
- `src/components/tickets/TicketOrdersList.vue`
- `src/components/tickets/TicketTypesManager.vue`
- `src/components/tickets/CheckoutQuestionsManager.vue`
- `src/components/tickets/TicketTypeFormModal.vue`
- `src/components/tickets/CheckoutQuestionModal.vue`
- `src/components/tickets/TicketOrderReviewDrawer.vue`

**Modified — buyer**
- `src/views/TicketCheckoutView.vue`
- `src/views/MyTicketsView.vue`
- `src/views/MyTicketOrderView.vue`
- `src/components/tickets/public/TicketCard.vue`
- `src/components/tickets/public/TicketTierList.vue`
- `src/components/tickets/public/TicketProofUploadForm.vue`
- `src/components/tickets/public/RefundRequestModal.vue`

**Modified — settings**
- `src/components/settings/TicketsTab.vue`

**Modified — i18n**
- `src/i18n/locales/en/events.json`
- `src/i18n/locales/kh/events.json`

---

## Follow-ups worth considering (not blocking)

1. **Sticky bottom checkout summary on mobile** — current checkout is short enough that totals + submit stay visible without one. Worth revisiting if more form fields land above the totals strip.
2. **`MyTicketOrderView.vue`** has no status-filter dropdown (buyers don't filter their own orders meaningfully) — intentional simplification.
3. **`RefundRequestModal`** reuses one i18n string for both modal title and the textarea label. Splitting would need a new `reasonLabel` key — easy add if stronger labelling is desired.
4. **`TicketCard.vue`** QR is fixed-size (44/48 rem). Acceptable for the door-scan use case but `aspect-square` + `min-w-0` would make it bulletproof on <340px viewports.
5. The `RefundRequestModal` Khmer translation follows the structure of existing `back...` keys in the file. A native speaker may want to refine.
