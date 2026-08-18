<template>
  <!--
    One order, drawn as the thing it will become: a ticket with a tear-off stub.

    The wrapper owns the shadow because the button owns the mask — a filter on a
    masked element is computed before the mask clips it, so the shadow would be
    cut off square at the notches instead of tracing them. Same split as
    [TicketCard.vue](src/components/tickets/public/TicketCard.vue), whose
    perforation language this borrows so the list and the ticket it opens read
    as the same object.
  -->
  <div class="stub-frame" :class="{ 'is-muted': meta.closed }">
    <button
      type="button"
      class="stub group block w-full text-left"
      :aria-label="ariaLabel"
      @click="emit('select', order.confirmation_code)"
    >
      <!-- Upper half: what it is, what it cost, where it stands -->
      <div class="flex items-start gap-3 px-4 pt-3.5 pb-3 sm:px-5">
        <span
          class="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          :class="iconClasses"
          aria-hidden="true"
        >
          <component :is="meta.icon" class="w-4 h-4" />
        </span>

        <div class="min-w-0 flex-1">
          <p
            class="truncate text-sm sm:text-[15px] font-semibold leading-snug"
            :class="meta.closed ? 'text-slate-500' : 'text-slate-900'"
          >
            {{ order.event_title }}
          </p>
          <!--
            State leads this line and the softer facts trail it, so when the
            column is narrow it is the ticket count that gets cut rather than
            the one word telling the buyer where the order stands.
          -->
          <div class="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
            <span
              class="inline-flex flex-shrink-0 items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
              :class="badgeClasses"
            >
              {{ statusLabel }}
            </span>
            <span
              v-if="order.is_comp"
              class="inline-flex flex-shrink-0 items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-sky-50 text-sky-700"
            >
              {{ t('events.tickets.list.compBadge') }}
            </span>
            <!-- Tickets only exist once an order is paid; "0 tickets" on every
                 other row was noise standing in for that fact. -->
            <span v-if="order.ticket_count > 0" class="truncate tabular-nums">
              {{ ticketCountLabel }}
            </span>
          </div>
        </div>

        <span
          class="flex-shrink-0 text-sm sm:text-[15px] font-bold tabular-nums leading-snug"
          :class="meta.closed ? 'text-slate-400 line-through' : 'text-slate-900'"
        >
          {{ amount }}
        </span>
      </div>

      <!-- The stub: the code you quote, and the one thing to do next. Its height
           is fixed because the notch mask has to know where the seam is. -->
      <div class="stub-tear flex items-center gap-2 h-11 px-4 sm:px-5" :class="stubGround">
        <!-- The code is the thing a buyer reads out at a door or quotes in an
             email, so it is the one part of the row that never truncates. -->
        <span class="flex-shrink-0 font-mono text-[11px] tracking-wider text-slate-500">
          {{ order.confirmation_code }}
        </span>
        <span class="flex-shrink-0 text-slate-300" aria-hidden="true">·</span>
        <span class="min-w-0 truncate text-[11px] text-slate-400">{{ orderedOn }}</span>
        <span
          class="ml-auto pl-1 inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap"
          :class="actionClasses"
        >
          {{ actionLabel }}
          <ChevronRight
            class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type { TicketOrderListItem } from '@/services/api'
import { formatCurrency, type CurrencyCode } from '@/utils/currency'
import {
  ticketOrderBadgeClasses,
  ticketOrderIconClasses,
  ticketOrderStatusMeta,
} from '@/utils/ticketOrderStatus'

const props = defineProps<{
  order: TicketOrderListItem
}>()

const emit = defineEmits<{
  select: [code: string]
}>()

const { t, locale } = useAppLanguage()

const meta = computed(() => ticketOrderStatusMeta(props.order.status))
const badgeClasses = computed(() => ticketOrderBadgeClasses(props.order.status))
const iconClasses = computed(() => ticketOrderIconClasses(props.order.status))

const statusLabel = computed(() => t(`events.tickets.order.statuses.${props.order.status}`))

const amount = computed(() =>
  formatCurrency(props.order.total, props.order.currency as CurrencyCode),
)

const ticketCountLabel = computed(() =>
  t(
    'events.tickets.list.ticketCount',
    { count: props.order.ticket_count },
    props.order.ticket_count,
  ),
)

const orderedOn = computed(() => {
  const d = new Date(props.order.created_at)
  if (Number.isNaN(d.getTime())) return ''
  // The year is only worth its width when it isn't this one — on a 360px phone
  // it is what pushes the line into an ellipsis mid-number ("May 6, 20…").
  const sameYear = d.getFullYear() === new Date().getFullYear()
  const formatted = new Intl.DateTimeFormat(locale.value === 'kh' ? 'km-KH' : 'en-US', {
    ...(sameYear ? {} : { year: 'numeric' }),
    month: 'short',
    day: 'numeric',
  }).format(d)
  return t('events.tickets.list.orderedOn', { date: formatted })
})

// One verb per state — the stub says what this card is for, not just that it
// opens. Only the two states worth acting on are coloured.
const actionLabel = computed(() => {
  if (props.order.status === 'paid') return t('events.tickets.list.actions.viewTickets')
  if (props.order.status === 'pending') return t('events.tickets.list.actions.completePayment')
  return t('events.tickets.list.actions.viewOrder')
})

const actionClasses = computed(() => {
  if (props.order.status === 'pending') return 'text-amber-700'
  if (props.order.status === 'paid') return 'text-emerald-700'
  return 'text-slate-500 group-hover:text-slate-700'
})

const stubGround = computed(() => {
  if (props.order.status === 'pending') return 'bg-amber-50/70'
  if (props.order.status === 'paid') return 'bg-emerald-50/60'
  return meta.value.closed ? 'bg-slate-100/70' : 'bg-slate-50'
})

const ariaLabel = computed(
  () => `${props.order.event_title} — ${statusLabel.value}, ${amount.value}`,
)
</script>

<style scoped>
/*
  The silhouette. `--stub-h` is the one number the shape depends on: the tear
  line sits at the top edge of the stub row, and both notches are centred on it,
  so the row's height is fixed in the template rather than left to its content.
*/
.stub-frame {
  --notch-r: 8px;
  --stub-h: 2.75rem; /* h-11 on the stub row */
  filter: drop-shadow(0 0 0.5px rgb(148 163 184 / 0.55)) drop-shadow(0 1px 2px rgb(15 23 42 / 0.06))
    drop-shadow(0 4px 10px rgb(15 23 42 / 0.05));
  transition: filter 0.2s ease;
}

/* No border to hover — the outline here is the innermost drop-shadow, since a
   border would be sliced open by the notch mask. Deepen the whole stack. */
.stub-frame:hover {
  filter: drop-shadow(0 0 0.5px rgb(100 116 139 / 0.7)) drop-shadow(0 2px 4px rgb(15 23 42 / 0.08))
    drop-shadow(0 8px 18px rgb(15 23 42 / 0.08));
}

/* Focus lives on the frame for the same reason the shadow does: a ring painted
   by the masked button is clipped away with it. */
.stub-frame:has(:focus-visible) {
  outline: 2px solid rgb(125 211 252);
  outline-offset: 3px;
  border-radius: 1.125rem;
}

/* Closed orders recede, but a card with no edge at all stops reading as an
   object you can press — keep the hairline, drop only the lift. */
.stub-frame.is-muted {
  filter: drop-shadow(0 0 0.5px rgb(148 163 184 / 0.55)) drop-shadow(0 1px 1px rgb(15 23 42 / 0.04));
}

.stub-frame.is-muted:hover {
  filter: drop-shadow(0 0 0.5px rgb(100 116 139 / 0.7)) drop-shadow(0 2px 6px rgb(15 23 42 / 0.06));
}

.stub {
  position: relative;
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  -webkit-mask:
    radial-gradient(
      circle var(--notch-r) at 0 calc(100% - var(--stub-h)),
      transparent 98%,
      #000 100%
    ),
    radial-gradient(
      circle var(--notch-r) at 100% calc(100% - var(--stub-h)),
      transparent 98%,
      #000 100%
    );
  -webkit-mask-composite: source-in;
  mask:
    radial-gradient(
      circle var(--notch-r) at 0 calc(100% - var(--stub-h)),
      transparent 98%,
      #000 100%
    ),
    radial-gradient(
      circle var(--notch-r) at 100% calc(100% - var(--stub-h)),
      transparent 98%,
      #000 100%
    );
  mask-composite: intersect;
  transition: background-color 0.2s ease;
}

.is-muted .stub {
  background: rgb(248 250 252); /* slate-50 — closed orders recede */
}

/* The tear line, drawn inside the stub row so the row contributes exactly
   `--stub-h` to the height. Inset from both edges to clear the notch arcs. */
.stub-tear {
  position: relative;
}

.stub-tear::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0.875rem;
  right: 0.875rem;
  border-top: 2px dashed rgb(226 232 240); /* slate-200 */
}

@media (prefers-reduced-motion: reduce) {
  .stub-frame,
  .stub {
    transition: none;
  }
}
</style>
