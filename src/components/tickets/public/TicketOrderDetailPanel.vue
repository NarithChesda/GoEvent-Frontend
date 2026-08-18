<template>
  <div>
    <!-- Optional consumer-injected header actions (e.g. an inline back button). -->
    <slot name="header-actions" />

    <!--
      Loading: the sheet's own silhouette rather than a lone spinner, so the
      panel doesn't jump from a centred dot to a full page of content.
    -->
    <div v-if="loading" :class="sheetClass" aria-busy="true">
      <div class="flex items-start gap-3 px-4 py-4 sm:px-6 sm:py-5 bg-slate-50">
        <div class="w-10 h-10 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
        <div class="flex-1 min-w-0 space-y-2 pt-1.5">
          <div class="h-3.5 w-28 rounded bg-slate-200 animate-pulse" />
          <div class="h-3 w-3/4 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
      <div class="px-4 py-4 sm:px-6 sm:py-5 space-y-3 border-t border-slate-100">
        <h2
          v-if="fallbackTitle"
          class="text-base sm:text-lg font-semibold text-slate-900 leading-snug"
        >
          {{ fallbackTitle }}
        </h2>
        <div v-else class="h-4 w-2/3 rounded bg-slate-200 animate-pulse" />
        <div class="h-3 w-1/2 rounded bg-slate-200 animate-pulse" />
        <div class="h-[52px] rounded-xl bg-slate-100 animate-pulse" />
      </div>
      <div class="px-4 py-4 sm:px-6 sm:py-5 space-y-2.5 border-t border-slate-100">
        <div class="h-3 w-full rounded bg-slate-200 animate-pulse" />
        <div class="h-3 w-5/6 rounded bg-slate-200 animate-pulse" />
      </div>
    </div>

    <!-- Error / empty -->
    <div v-else-if="error || !order" :class="[sheetClass, 'p-8 sm:p-12 text-center']">
      <div class="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle class="w-7 h-7 text-red-500" />
      </div>
      <p class="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
        {{ error || t('events.tickets.order.notFound') }}
      </p>
    </div>

    <!--
      One continuous ticket rather than a stack of cards on grey. The panel used
      to float five separately-bordered boxes, each with its own uppercase
      heading, which on a phone spent most of the screen on gutters and chrome —
      and put the QR a full scroll below the fold on the one status where the QR
      *is* the reason the buyer opened the screen. Now the whole thing is a
      single sheet whose sections are divided by hairlines, ordered by what the
      buyer has to do next: where the order stands, what it is, then the thing to
      act on (tickets when paid, payment when pending), then the money.
    -->
    <article v-else :class="sheetClass">
      <!--
        Status leads, said once. It used to be stated three times over — a pill
        beside the code, a tinted strip below it, and a help line under that.
        Here the tone of the band, the label and the sentence are one object.
      -->
      <div class="flex items-start gap-3 px-4 py-4 sm:px-6 sm:py-5" :class="bandClass">
        <span
          class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          :class="statusIconClass"
          aria-hidden="true"
        >
          <component :is="statusIcon" class="w-5 h-5" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p class="text-sm sm:text-base font-semibold leading-tight">{{ statusLabel }}</p>
            <span
              v-if="order.is_comp"
              class="inline-flex items-center px-2 py-0.5 rounded-full bg-white/70 text-[10px] font-semibold uppercase tracking-wide"
            >
              {{ t('events.tickets.list.compBadge') }}
            </span>
          </div>
          <p class="mt-1 text-sm leading-snug">{{ statusLine }}</p>
          <p v-if="statusHelp" class="mt-1 text-xs leading-relaxed opacity-80">{{ statusHelp }}</p>
          <p
            v-if="refundCountdown"
            class="mt-2 inline-block px-2.5 py-1 rounded-full bg-white/70 text-[11px] font-semibold uppercase tracking-wide"
          >
            {{ refundCountdown }}
          </p>
        </div>
      </div>

      <!--
        What the ticket is for, and the string you quote at the door. The event
        title is printed here on every surface now — the modal's head above is
        pure chrome, so skipping it when embedded left a phone-sized sheet that
        never named its own event.
      -->
      <section class="px-4 py-4 sm:px-6 sm:py-5 border-t border-slate-100">
        <h2
          v-if="eventTitle"
          class="text-base sm:text-lg font-semibold text-slate-900 leading-snug"
        >
          {{ eventTitle }}
        </h2>
        <dl v-if="eventWhen || eventLocation" class="mt-2 space-y-1.5">
          <div v-if="eventWhen" class="flex items-start gap-2 text-sm text-slate-600">
            <CalendarDays class="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
            <dt class="sr-only">{{ t('events.tickets.order.whenLabel') }}</dt>
            <dd class="min-w-0">{{ eventWhen }}</dd>
          </div>
          <div v-if="eventLocation" class="flex items-start gap-2 text-sm text-slate-600">
            <MapPin class="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
            <dt class="sr-only">{{ t('events.tickets.order.whereLabel') }}</dt>
            <dd class="min-w-0 break-words">{{ eventLocation }}</dd>
          </div>
        </dl>

        <!-- The code is what a buyer reads out or pastes into an email, so it
             gets a copy button rather than only a selection. -->
        <div
          class="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-2 py-2"
        >
          <div class="min-w-0 flex-1">
            <p class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              {{ t('events.tickets.order.confirmationCodeLabel') }}
            </p>
            <p
              class="font-mono text-sm sm:text-base font-bold text-slate-900 break-all leading-tight"
            >
              {{ order.confirmation_code }}
            </p>
          </div>
          <button
            type="button"
            class="flex-shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            :class="
              copied
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/70'
            "
            :aria-label="t('events.tickets.order.copyCode')"
            @click="copyCode"
          >
            <Check v-if="copied" class="w-4 h-4" />
            <Copy v-else class="w-4 h-4" />
          </button>
          <span class="sr-only" role="status" aria-live="polite">
            {{ copied ? t('events.tickets.order.codeCopied') : '' }}
          </span>
        </div>
      </section>

      <!--
        Paid: the tickets come before the receipt — at that point the QR is the
        whole reason the screen is open. On a phone they are a swipe strip, not
        a vertical stack: three QR cards end to end is over a thousand pixels of
        scroll for what is one glance at the door.
      -->
      <section
        v-if="order.status === 'paid' && order.tickets.length > 0"
        class="px-4 py-4 sm:px-6 sm:py-5 border-t border-slate-100 bg-slate-50/70"
      >
        <div class="flex items-center justify-between gap-3 mb-3">
          <h2 class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {{ t('events.tickets.order.ticketsHeader') }}
          </h2>
          <p
            v-if="order.tickets.length > 1"
            class="sm:hidden text-[11px] font-semibold text-slate-400 tabular-nums"
            aria-live="polite"
          >
            {{
              t('events.tickets.order.ticketPosition', {
                current: activeTicket + 1,
                total: order.tickets.length,
              })
            }}
          </p>
        </div>

        <div v-if="order.tickets.length === 1" class="mx-auto max-w-[20rem]">
          <TicketCard :ticket="order.tickets[0]" />
        </div>

        <template v-else>
          <!--
            One list, two layouts. Rendering a phone strip and a desktop grid as
            separate branches meant every ticket existed twice in the DOM — two
            QR codes generated per ticket, and every check-in code announced
            twice to a screen reader. The strip becomes the grid at `sm`
            instead: the flex/snap/peek properties simply stop applying.
          -->
          <div
            ref="stripRef"
            class="relative -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto scrollbar-hide px-4 pb-1 sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 sm:[grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]"
            @scroll.passive="syncActiveTicket"
          >
            <div
              v-for="ticket in order.tickets"
              :key="ticket.id"
              class="w-[82%] flex-shrink-0 snap-start sm:w-auto"
            >
              <TicketCard :ticket="ticket" />
            </div>
          </div>
          <!-- Swipe is the primary way through the strip; the dots are a
               position readout you can also press. -->
          <div class="mt-1 flex items-center justify-center sm:hidden">
            <button
              v-for="(ticket, index) in order.tickets"
              :key="ticket.id"
              type="button"
              class="rounded-lg px-1.5 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              :aria-label="
                t('events.tickets.order.ticketPosition', {
                  current: index + 1,
                  total: order.tickets.length,
                })
              "
              :aria-current="index === activeTicket ? 'true' : undefined"
              @click="scrollToTicket(index)"
            >
              <span
                class="block h-1.5 rounded-full transition-all duration-200"
                :class="index === activeTicket ? 'w-5 bg-slate-400' : 'w-1.5 bg-slate-300'"
              />
            </button>
          </div>
        </template>
      </section>

      <!--
        The receipt, under a perforation — it is the stub of the sheet. One line
        per ticket type, one line for what it came to; the subtotal rows only
        appear when a discount makes them differ from the total, since the same
        figure printed twice under a rule reads as an error, not a breakdown.
      -->
      <section class="receipt px-4 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5">
        <h2 class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {{ t('events.tickets.order.itemsHeader') }}
        </h2>
        <ul class="mt-2.5 space-y-2.5">
          <li
            v-for="(item, idx) in order.items"
            :key="idx"
            class="flex items-start justify-between gap-3"
          >
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-900 truncate">
                {{ item.ticket_type.name }}
              </p>
              <p class="text-xs text-slate-500 tabular-nums mt-0.5">
                {{ item.quantity }} ×
                {{ formatCurrency(item.unit_price, order.currency as CurrencyCode) }}
              </p>
            </div>
            <p class="text-sm font-semibold text-slate-900 tabular-nums flex-shrink-0">
              {{ formatCurrency(item.subtotal, order.currency as CurrencyCode) }}
            </p>
          </li>
        </ul>

        <div v-if="showSubtotal" class="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-sm">
          <div class="flex items-center justify-between gap-3">
            <span class="text-slate-500">{{ t('events.tickets.order.subtotalLabel') }}</span>
            <span class="text-slate-700 tabular-nums flex-shrink-0">
              {{ formatCurrency(order.subtotal, order.currency as CurrencyCode) }}
            </span>
          </div>
          <div v-if="order.promo_code" class="flex items-center justify-between gap-3">
            <span class="text-slate-500 min-w-0 truncate">
              {{ t('events.tickets.order.discountLabel') }}
              <span
                class="font-mono text-[11px] ml-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700"
              >
                {{ order.promo_code }}
              </span>
            </span>
            <span class="text-emerald-700 font-medium tabular-nums flex-shrink-0">
              − {{ formatCurrency(order.promo_discount, order.currency as CurrencyCode) }}
            </span>
          </div>
        </div>

        <!-- While an order is unpaid this figure is an instruction, not a
             record, so it is labelled and coloured as one. -->
        <div class="mt-3 pt-3 border-t border-slate-200 flex items-baseline justify-between gap-3">
          <span class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {{
              order.status === 'pending'
                ? t('events.tickets.order.amountDueLabel')
                : t('events.tickets.order.totalLabel')
            }}
          </span>
          <span
            class="text-xl sm:text-2xl font-bold tabular-nums leading-none"
            :class="order.status === 'pending' ? 'text-amber-700' : 'text-slate-900'"
          >
            {{ formatCurrency(order.total, order.currency as CurrencyCode) }}
          </span>
        </div>
      </section>

      <!-- Pending: proof upload, directly under the amount it has to match. The
           detail endpoint may serve either the nested `event` object (documented
           shape) or the slim shape with a flat UUID `event` + `event_id`;
           `eventId` resolves both. -->
      <section
        v-if="order.status === 'pending' && eventId"
        class="px-4 py-4 sm:px-6 sm:py-5 border-t border-slate-100"
      >
        <TicketProofUploadForm
          :event-id="eventId"
          :confirmation-code="order.confirmation_code"
          @submitted="handleOrderUpdated"
          @message="handleMessage"
        />
      </section>

      <!-- Refund summary (when present) -->
      <section v-if="order.refund" class="px-4 py-4 sm:px-6 sm:py-5 border-t border-slate-100">
        <h2 class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {{ t('events.tickets.order.refund.summaryHeader') }}
        </h2>
        <div class="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 sm:p-4 text-sm space-y-2">
          <div class="flex items-baseline gap-2 flex-wrap">
            <span
              class="text-[11px] font-semibold uppercase tracking-wide text-rose-600 flex-shrink-0"
            >
              {{ t('events.tickets.order.refund.statusLabel') }}
            </span>
            <span class="text-rose-900 font-medium">
              {{ t(`events.tickets.order.refund.statuses.${order.refund.status}`) }}
            </span>
          </div>
          <div v-if="order.refund.reason" class="flex items-baseline gap-2 flex-wrap">
            <span
              class="text-[11px] font-semibold uppercase tracking-wide text-rose-600 flex-shrink-0"
            >
              {{ t('events.tickets.order.refund.reasonLabel') }}
            </span>
            <span class="text-rose-900 leading-relaxed">{{ order.refund.reason }}</span>
          </div>
          <div v-if="order.refund.admin_notes" class="flex items-baseline gap-2 flex-wrap">
            <span
              class="text-[11px] font-semibold uppercase tracking-wide text-rose-600 flex-shrink-0"
            >
              {{ t('events.tickets.order.refund.adminNotesLabel') }}
            </span>
            <span class="text-rose-900 leading-relaxed">{{ order.refund.admin_notes }}</span>
          </div>
        </div>
      </section>

      <!-- Actions close the sheet as a footer: full-width on mobile, comfortable
           touch targets, and never above the thing they act on. -->
      <div
        v-if="canCancel || canRequestRefund"
        class="px-4 py-4 sm:px-6 sm:py-5 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:justify-end gap-2"
      >
        <button
          v-if="canCancel"
          type="button"
          class="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-sm font-medium bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          :disabled="isCancelling"
          @click="cancelOrder"
        >
          <span
            v-if="isCancelling"
            class="w-4 h-4 animate-spin border-2 border-slate-400 border-t-transparent rounded-full"
          />
          {{
            isCancelling ? t('events.tickets.order.cancelling') : t('events.tickets.order.cancel')
          }}
        </button>
        <button
          v-if="canRequestRefund"
          type="button"
          class="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-sm font-medium bg-white border border-rose-200 hover:border-rose-300 hover:bg-rose-50 rounded-xl text-rose-700 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
          @click="showRefundModal = true"
        >
          {{ t('events.tickets.order.requestRefund') }}
        </button>
      </div>
    </article>

    <!-- Refund modal -->
    <RefundRequestModal
      ref="refundModalRef"
      :show="showRefundModal"
      :is-submitting="isRequestingRefund"
      @close="showRefundModal = false"
      @submit="submitRefund"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AlertCircle, CalendarDays, Check, Copy, MapPin } from 'lucide-vue-next'
import TicketCard from '@/components/tickets/public/TicketCard.vue'
import TicketProofUploadForm from '@/components/tickets/public/TicketProofUploadForm.vue'
import RefundRequestModal from '@/components/tickets/public/RefundRequestModal.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useToast } from '@/composables/useToast'
import { ticketOrdersService, type TicketOrderDetail } from '@/services/api'
import { formatCurrency, type CurrencyCode } from '@/utils/currency'
import {
  ticketOrderBandClasses,
  ticketOrderIconClasses,
  ticketOrderStatusMeta,
} from '@/utils/ticketOrderStatus'

const props = defineProps<{
  code: string
  /** Rendered inside a surface that already draws the ticket chrome (TicketOrderModal). */
  embedded?: boolean
  /**
   * Event title the opener already knows. Named while the fetch is still in
   * flight, so tapping an order shows *which* order immediately instead of a
   * grey bar — and it also covers the slim serializer shape, where
   * `event_title` is optional and can come back absent.
   */
  fallbackTitle?: string
}>()

const { t, locale } = useAppLanguage()

const order = ref<TicketOrderDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const showRefundModal = ref(false)
const isRequestingRefund = ref(false)
const refundModalRef = ref<InstanceType<typeof RefundRequestModal> | null>(null)

const isCancelling = ref(false)

const { showToast } = useToast()
const handleMessage = (type: 'success' | 'error', text: string) => {
  showToast(type, text)
}

// Embedded, the modal already supplies the border, radius and shadow — a second
// set inside it draws a card inside a card.
const sheetClass = computed(() =>
  props.embedded
    ? 'bg-white overflow-hidden'
    : 'bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden',
)

// ---- Live ticking for the refund-window countdown ------------------------
const now = ref(Date.now())
let tickInterval: number | null = null
onMounted(() => {
  // Update every 30s — fine-grained enough for a "1h 23m" display.
  tickInterval = window.setInterval(() => {
    now.value = Date.now()
  }, 30_000)
})

let copyTimer: number | null = null
onBeforeUnmount(() => {
  if (tickInterval !== null) clearInterval(tickInterval)
  if (copyTimer !== null) clearTimeout(copyTimer)
})

// ---- Ticket strip (mobile) -----------------------------------------------
const stripRef = ref<HTMLElement | null>(null)
const activeTicket = ref(0)

const stripItems = (): HTMLElement[] =>
  stripRef.value ? (Array.from(stripRef.value.children) as HTMLElement[]) : []

// Measured from element geometry rather than assumed from an item width, so the
// readout stays honest whatever the gap and peek work out to at this width.
const syncActiveTicket = () => {
  const el = stripRef.value
  const items = stripItems()
  if (!el || items.length === 0) return
  const midpoint = el.scrollLeft + el.clientWidth / 2
  let nearest = 0
  let nearestDistance = Number.POSITIVE_INFINITY
  items.forEach((item, index) => {
    const distance = Math.abs(item.offsetLeft + item.offsetWidth / 2 - midpoint)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearest = index
    }
  })
  activeTicket.value = nearest
}

const scrollToTicket = (index: number) => {
  const el = stripRef.value
  const items = stripItems()
  const target = items[index]
  const first = items[0]
  if (!el || !target || !first) return
  el.scrollTo({ left: target.offsetLeft - first.offsetLeft, behavior: 'smooth' })
  activeTicket.value = index
}

// ---- Load ----------------------------------------------------------------
const loadOrder = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await ticketOrdersService.get(props.code)
    if (response.success && response.data) {
      order.value = response.data
    } else {
      error.value = response.message || t('events.tickets.order.loadFailed')
    }
  } catch {
    error.value = t('events.tickets.order.loadFailed')
  } finally {
    loading.value = false
  }
}

// Refetch whenever the parent swaps in a different code (e.g. user navigates
// between orders within the Settings tab without unmounting the panel).
watch(
  () => props.code,
  (next, prev) => {
    if (next && next !== prev) {
      activeTicket.value = 0
      loadOrder()
    }
  },
  { immediate: true },
)

// ---- Event identity ------------------------------------------------------
// `event` is either a nested OrderEventBrief or a bare UUID string (FK PK)
// depending on which serializer the backend is currently serving. Flat
// companions (`event_id`, `event_title`, …) may or may not be present.
const eventId = computed<string>(() => {
  const o = order.value
  if (!o) return ''
  if (o.event && typeof o.event === 'object') return o.event.id
  if (typeof o.event === 'string') return o.event
  return o.event_id ?? ''
})

const eventTitle = computed<string>(() => {
  const o = order.value
  if (!o) return props.fallbackTitle ?? ''
  if (o.event && typeof o.event === 'object') return o.event.title
  return o.event_title || (props.fallbackTitle ?? '')
})

const eventStart = computed<string>(() => {
  const o = order.value
  if (!o) return ''
  if (o.event && typeof o.event === 'object') return o.event.start_date
  return o.event_start_date ?? ''
})

const eventLocation = computed<string>(() => {
  const o = order.value
  if (!o) return ''
  if (o.event && typeof o.event === 'object') return o.event.location ?? ''
  return o.event_location ?? ''
})

// A ticket that doesn't say when the doors open is missing the other half of
// its job. Render in the event's own timezone when the serializer supplies one,
// so a buyer abroad isn't shown a start time shifted into their local clock.
const eventWhen = computed<string>(() => {
  if (!eventStart.value) return ''
  const d = new Date(eventStart.value)
  if (Number.isNaN(d.getTime())) return ''
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }
  if (d.getFullYear() !== new Date().getFullYear()) options.year = 'numeric'
  const intlLocale = locale.value === 'kh' ? 'km-KH' : 'en-US'
  const o = order.value
  const timezone = o && o.event && typeof o.event === 'object' ? o.event.timezone : null
  if (timezone) {
    try {
      return new Intl.DateTimeFormat(intlLocale, { ...options, timeZone: timezone }).format(d)
    } catch {
      // Unknown/invalid IANA zone — fall through to the viewer's local clock.
    }
  }
  return new Intl.DateTimeFormat(intlLocale, options).format(d)
})

// ---- Status presentation -------------------------------------------------
// Tone, icon and copy all come from the shared status map, so a status can't be
// amber on the list and slate on the order it opens. See utils/ticketOrderStatus.ts.
const statusMeta = computed(() => (order.value ? ticketOrderStatusMeta(order.value.status) : null))

const statusIcon = computed(() => statusMeta.value?.icon ?? null)

const bandClass = computed(() =>
  order.value ? ticketOrderBandClasses(order.value.status) : 'bg-slate-50 text-slate-700',
)

const statusIconClass = computed(() =>
  order.value ? ticketOrderIconClasses(order.value.status) : 'bg-slate-100 text-slate-500',
)

const statusLabel = computed(() => {
  if (!order.value) return ''
  return t(`events.tickets.order.statuses.${order.value.status}`)
})

// The breakdown earns its space only when something was taken off; otherwise
// subtotal and total are the same number printed twice.
const showSubtotal = computed(() => {
  if (!order.value) return false
  if (order.value.promo_code) return true
  return parseFloat(order.value.subtotal) !== parseFloat(order.value.total)
})

const statusLine = computed(() => {
  if (!order.value) return ''
  return t(`events.tickets.order.banners.${order.value.status}.line`)
})

const statusHelp = computed(() => {
  if (!order.value) return ''
  // Intentional: helpKey may be missing for some statuses; fall back to ''.
  const key = `events.tickets.order.banners.${order.value.status}.help`
  const localized = t(key)
  return localized === key ? '' : localized
})

const refundCountdown = computed(() => {
  if (!order.value || order.value.status !== 'paid') return null
  if (!order.value.is_refundable) return null
  if (!order.value.refund_window_ends_at) return null
  const ends = new Date(order.value.refund_window_ends_at).getTime()
  if (Number.isNaN(ends)) return null
  const remaining = ends - now.value
  if (remaining <= 0) return null
  const hours = Math.floor(remaining / 3_600_000)
  const minutes = Math.floor((remaining % 3_600_000) / 60_000)
  // Show the warning banner only when within 2h of close — matches the
  // guide's UX recommendation.
  if (remaining > 2 * 3_600_000) return null
  return t('events.tickets.order.refund.windowClosing', { hours, minutes })
})

// ---- Order code copy -----------------------------------------------------
const copied = ref(false)

const copyCode = async () => {
  const code = order.value?.confirmation_code
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
    copied.value = true
    if (copyTimer !== null) clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Clipboard is unavailable on insecure origins and can be denied outright.
    // The code is on screen and selectable, so a failure needs no alarm.
  }
}

// ---- Action gating -------------------------------------------------------
const canCancel = computed(() => {
  if (!order.value) return false
  return order.value.status === 'pending' || order.value.status === 'awaiting_review'
})

const canRequestRefund = computed(() => {
  if (!order.value) return false
  return (
    order.value.status === 'paid' &&
    order.value.is_refundable &&
    !order.value.is_comp &&
    !order.value.refund
  )
})

// ---- Action handlers -----------------------------------------------------
const handleOrderUpdated = (updated: TicketOrderDetail) => {
  order.value = updated
}

const cancelOrder = async () => {
  if (!order.value) return
  if (!confirm(t('events.tickets.order.cancelConfirm'))) return
  isCancelling.value = true
  try {
    const response = await ticketOrdersService.cancel(order.value.confirmation_code)
    if (response.success && response.data) {
      order.value = response.data
      handleMessage('success', t('events.tickets.order.cancelSuccess'))
    } else {
      handleMessage('error', response.message || t('events.tickets.order.cancelFailed'))
    }
  } catch {
    handleMessage('error', t('events.tickets.order.cancelFailed'))
  } finally {
    isCancelling.value = false
  }
}

const submitRefund = async (reason: string) => {
  if (!order.value) return
  isRequestingRefund.value = true
  try {
    const response = await ticketOrdersService.requestRefund(order.value.confirmation_code, {
      reason,
    })
    if (response.success) {
      showRefundModal.value = false
      handleMessage('success', t('events.tickets.order.refund.successMessage'))
      await loadOrder()
    } else {
      const msg = response.message || t('events.tickets.order.refund.errorGeneric')
      refundModalRef.value?.setErrorMessage(msg)
    }
  } catch {
    refundModalRef.value?.setErrorMessage(t('events.tickets.order.refund.errorGeneric'))
  } finally {
    isRequestingRefund.value = false
  }
}
</script>

<style scoped>
/*
  The receipt hangs below a perforation rather than a hairline — the same tear
  language the stub card and the modal frame use, so the sheet reads as one
  ticket whose lower half is the part you keep. Inset from both edges so the
  dashes stop clear of the modal's notch arcs.
*/
.receipt {
  position: relative;
}

.receipt::before {
  content: '';
  position: absolute;
  top: 0;
  left: 1rem;
  right: 1rem;
  border-top: 2px dashed rgb(226 232 240); /* slate-200 */
}

@media (min-width: 640px) {
  .receipt::before {
    left: 1.5rem;
    right: 1.5rem;
  }
}
</style>
