<template>
  <div class="flex-shrink-0 border-t border-slate-200 bg-white/90 backdrop-blur-sm">
    <!-- Calendar targets. Collapse per design system §15 (grid-rows, not
         max-height) so both directions ease evenly. -->
    <Transition name="collapse">
      <div v-if="showCalendar" class="grid grid-rows-[1fr]">
        <div class="min-h-0 overflow-hidden">
          <div class="flex gap-2 px-4 pt-3">
            <button
              v-for="target in calendarTargets"
              :key="target.key"
              @click="target.run"
              class="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            >
              {{ target.label }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <div
      class="flex items-center gap-3 px-4 py-3"
      style="padding-bottom: max(env(safe-area-inset-bottom), 0.75rem)"
    >
      <!-- Status. Answers "what does this cost / where do I stand" next to the
           button that acts on it, rather than three screens up the scroll. -->
      <div class="flex-1 min-w-0">
        <p v-if="statusLine" class="text-sm font-semibold text-slate-900 truncate">
          {{ statusLine }}
        </p>
        <p v-if="attendanceLabel" class="text-xs text-slate-500 truncate">
          {{ attendanceLabel }}
        </p>
      </div>

      <!-- Secondary calendar toggle. Hidden when the primary CTA is itself the
           calendar, which is the display-only case. -->
      <button
        v-if="cta.kind !== 'calendar'"
        @click="showCalendar = !showCalendar"
        class="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        :aria-expanded="showCalendar"
        :title="t('events.drawer.addToCalendar')"
        :aria-label="t('events.drawer.addToCalendar')"
      >
        <CalendarPlus class="w-4 h-4" />
      </button>

      <!-- Primary CTA. Exactly one, always reachable. -->
      <div
        v-if="cta.kind === 'unavailable'"
        class="min-w-[9rem] px-4 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-sm font-medium text-center flex-shrink-0"
      >
        {{ cta.label }}
      </div>
      <button
        v-else
        @click="handleCta"
        :disabled="cta.busy || cta.disabled"
        class="min-w-[9rem] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        :class="ctaClass"
      >
        <span
          v-if="cta.busy"
          class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0"
          aria-hidden="true"
        ></span>
        <component
          :is="cta.icon"
          v-else-if="cta.icon"
          class="w-4 h-4 flex-shrink-0"
          aria-hidden="true"
        />
        <!-- Allowed to shrink and truncate: Khmer labels run considerably longer
             than their English equivalents and would otherwise push the row wide. -->
        <span class="truncate">{{ cta.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * The drawer's pinned action bar.
 *
 * The primary action used to live inside a card between Location and About, so
 * on any event with an agenda and a map you scrolled straight past the only
 * thing you opened the drawer to do. It also competed with a second "Add to
 * calendar" row and a duplicated Share, each with its own open state.
 *
 * This resolves the whole panel down to **one** CTA, chosen by priority, and
 * keeps it on screen. Ticketed events read the checkout cart directly from the
 * store (the tier list no longer carries its own footer), so the subtotal stays
 * visible while the reader scrolls the tiers.
 */

import { computed, ref, watch, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { CalendarPlus, Ticket, Heart, QrCode, LogIn } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useTicketCheckoutStore } from '@/stores/ticketCheckout'
import { formatCurrency, type CurrencyCode } from '@/utils/currency'

interface Props {
  eventId: string
  /** Signed-in state; drives the "sign in to…" variants. */
  isAuthenticated: boolean
  isQuiet: boolean

  hasTicketedSales: boolean
  isFundraising: boolean
  registrationRequired: boolean
  isRegistered: boolean
  confirmationCode: string | null | undefined

  canRegister: boolean
  isRegistering: boolean
  isEventFull: boolean
  isRegistrationClosed: boolean
  isPast: boolean

  /** "Free entry" / "From $25", or null when the event states no price. */
  priceLabel?: string | null
  /** "240 going" / "12 interested", or null. */
  attendanceLabel?: string | null
}

interface Emits {
  (e: 'register'): void
  (e: 'login-required'): void
  (e: 'donate'): void
  (e: 'show-qr'): void
  (e: 'focus-tickets'): void
  (e: 'add-to-google'): void
  (e: 'add-to-outlook'): void
  (e: 'download-ics'): void
}

const props = withDefaults(defineProps<Props>(), {
  priceLabel: null,
  attendanceLabel: null,
})
const emit = defineEmits<Emits>()

const { t } = useAppLanguage()
const router = useRouter()
const cartStore = useTicketCheckoutStore()

const showCalendar = ref(false)

// Prev/next swaps the event under this component without remounting it.
watch(
  () => props.eventId,
  () => {
    showCalendar.value = false
  }
)

const calendarTargets = computed(() => [
  {
    key: 'google',
    label: t('events.drawer.calendarOptions.google'),
    run: () => {
      emit('add-to-google')
      showCalendar.value = false
    },
  },
  {
    key: 'outlook',
    label: t('events.drawer.calendarOptions.outlook'),
    run: () => {
      emit('add-to-outlook')
      showCalendar.value = false
    },
  },
  {
    key: 'ics',
    label: t('events.drawer.calendarOptions.ics'),
    run: () => {
      emit('download-ics')
      showCalendar.value = false
    },
  },
])

const cartIsThisEvent = computed(() => cartStore.eventId === props.eventId)
const cartQuantity = computed(() => (cartIsThisEvent.value ? cartStore.totalQuantity : 0))
const canCheckout = computed(
  () => cartIsThisEvent.value && cartStore.totalQuantity > 0 && !cartStore.hasMixedCurrency
)

type CtaKind =
  | 'pick-tickets'
  | 'checkout'
  | 'donate'
  | 'register'
  | 'signin'
  | 'qr'
  | 'calendar'
  | 'unavailable'

interface Cta {
  kind: CtaKind
  label: string
  icon?: Component
  busy?: boolean
  disabled?: boolean
  /** Renders as a quiet outline rather than the brand gradient. */
  soft?: boolean
}

/**
 * The one action this event is asking for, in priority order.
 *
 * Already-registered wins over everything: once you're in, the useful action is
 * your ticket, not another way to sign up. Tickets outrank free registration
 * because a ticketed event's RSVP card is suppressed anyway.
 */
const cta = computed<Cta>(() => {
  if (props.registrationRequired && props.isRegistered) {
    return props.confirmationCode
      ? { kind: 'qr', label: t('events.drawer.action.viewTicket'), icon: QrCode, soft: true }
      : { kind: 'calendar', label: t('events.drawer.addToCalendar'), icon: CalendarPlus, soft: true }
  }

  if (props.hasTicketedSales) {
    if (!props.isAuthenticated) {
      return { kind: 'signin', label: t('events.tickets.public.loginToBuy'), icon: LogIn }
    }
    // With an empty cart there is nothing to check out yet, so the button takes
    // the reader to the tiers rather than sitting there disabled.
    if (cartQuantity.value === 0) {
      return { kind: 'pick-tickets', label: t('events.tickets.public.selectTickets'), icon: Ticket }
    }
    return {
      kind: 'checkout',
      label: t('events.tickets.public.proceedToCheckout', { count: cartQuantity.value }),
      icon: Ticket,
      disabled: cartStore.hasMixedCurrency,
    }
  }

  if (props.isFundraising) {
    return { kind: 'donate', label: t('events.drawer.action.donate'), icon: Heart }
  }

  if (props.registrationRequired) {
    if (props.canRegister) {
      return {
        kind: 'register',
        label: props.isRegistering
          ? t('events.drawer.action.registering')
          : t('events.drawer.action.register'),
        busy: props.isRegistering,
      }
    }
    if (!props.isAuthenticated) {
      return { kind: 'signin', label: t('events.drawer.action.signInToRegister'), icon: LogIn }
    }
    return { kind: 'unavailable', label: unavailableReason.value }
  }

  // Display-only listing — the only thing left worth doing is keeping it.
  return { kind: 'calendar', label: t('events.drawer.addToCalendar'), icon: CalendarPlus }
})

const unavailableReason = computed(() => {
  if (props.isEventFull) return t('events.drawer.action.soldOut')
  if (props.isRegistrationClosed) return t('events.drawer.action.registrationClosed')
  if (props.isPast) return t('events.drawer.action.eventEnded')
  return t('events.drawer.action.unavailable')
})

const ctaClass = computed(() => {
  if (cta.value.soft) {
    return 'border bg-[var(--evt-tint)] border-[var(--evt-ring)] text-[var(--evt-accent)] hover:bg-[var(--evt-tint-strong)]'
  }
  // A memorial should not get a festive green-to-blue button; the design
  // system's dark-solid variant carries the same weight without the mood.
  if (props.isQuiet) {
    return 'bg-slate-900 hover:bg-slate-800 text-white shadow-md'
  }
  return 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md hover:opacity-90'
})

/** Ticketed events show the live cart subtotal; everything else shows price. */
const statusLine = computed(() => {
  if (props.registrationRequired && props.isRegistered) {
    return t('events.drawer.action.registeredStatus')
  }

  if (props.hasTicketedSales && cartQuantity.value > 0) {
    const currency = cartStore.cartCurrency
    if (currency) return formatCurrency(cartStore.subtotal, currency as CurrencyCode)
  }

  return props.priceLabel
})

const handleCta = () => {
  switch (cta.value.kind) {
    case 'qr':
      emit('show-qr')
      break
    case 'pick-tickets':
      emit('focus-tickets')
      break
    case 'checkout':
      if (canCheckout.value) {
        router.push({ name: 'event-checkout', params: { id: props.eventId } })
      }
      break
    case 'donate':
      emit('donate')
      break
    case 'register':
      emit('register')
      break
    case 'signin':
      emit('login-required')
      break
    case 'calendar':
      showCalendar.value = !showCalendar.value
      break
  }
}
</script>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none;
  }
}
</style>
