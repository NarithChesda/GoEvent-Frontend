<template>
  <section class="bg-white border border-slate-200 rounded-xl overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
      <Ticket class="w-4 h-4 text-emerald-600" />
      <h3 class="text-sm font-semibold text-slate-900">
        {{ t('events.tickets.public.title') }}
      </h3>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Empty / error -->
    <div
      v-else-if="tiers.length === 0"
      class="px-4 py-6 text-center text-sm text-slate-500"
    >
      {{ t('events.tickets.public.empty') }}
    </div>

    <!-- Tier rows -->
    <ul v-else class="divide-y divide-slate-100">
      <li
        v-for="tier in tiers"
        :key="tier.id"
        class="px-4 py-3"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-semibold text-slate-900 break-words">
                {{ tier.name }}
              </p>
              <span
                v-if="tierState(tier).label"
                :class="[
                  'px-1.5 py-0.5 rounded-md text-[10px] font-medium',
                  tierState(tier).className,
                ]"
              >
                {{ tierState(tier).label }}
              </span>
            </div>
            <p class="text-base font-semibold text-slate-900 tabular-nums mt-0.5">
              {{ formatCurrency(tier.price, tier.currency as CurrencyCode) }}
            </p>
            <p
              v-if="tier.description"
              class="mt-1 text-xs text-slate-500 line-clamp-2"
            >
              {{ tier.description }}
            </p>
            <p class="mt-1 text-[11px] text-slate-400">
              {{ t('events.tickets.public.remaining', { remaining: tier.quantity_remaining }) }}
            </p>
          </div>

          <!-- Quantity stepper or disabled state -->
          <div class="flex-shrink-0 flex items-center gap-2">
            <template v-if="tier.is_on_sale && !tier.is_sold_out">
              <button
                type="button"
                class="w-8 h-8 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                :disabled="store.getQuantity(tier.id) === 0"
                :aria-label="t('events.tickets.public.decrease')"
                @click="decrement(tier)"
              >
                <Minus class="w-4 h-4" />
              </button>
              <span
                class="w-6 text-center text-sm font-semibold text-slate-900 tabular-nums"
              >
                {{ store.getQuantity(tier.id) }}
              </span>
              <button
                type="button"
                class="w-8 h-8 rounded-full border border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                :disabled="!canIncrement(tier)"
                :aria-label="t('events.tickets.public.increase')"
                @click="increment(tier)"
              >
                <Plus class="w-4 h-4" />
              </button>
            </template>
            <span
              v-else
              class="text-xs font-medium text-slate-400"
            >
              {{ tierState(tier).label }}
            </span>
          </div>
        </div>
      </li>
    </ul>

    <!-- Footer: cart summary + CTA -->
    <div
      v-if="tiers.length > 0"
      class="px-4 py-3 bg-slate-50 border-t border-slate-100"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-slate-500">
          {{ t('events.tickets.public.subtotalLabel') }}
        </span>
        <span class="text-base font-semibold text-slate-900 tabular-nums">
          {{ subtotalDisplay }}
        </span>
      </div>
      <p
        v-if="store.hasMixedCurrency"
        class="text-xs text-rose-600 mb-2"
      >
        {{ t('events.tickets.public.mixedCurrencyError') }}
      </p>
      <button
        v-if="!isAuthenticated"
        type="button"
        class="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors"
        @click="$emit('login-required')"
      >
        {{ t('events.tickets.public.loginToBuy') }}
      </button>
      <button
        v-else
        type="button"
        class="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all shadow-sm"
        :disabled="!canCheckout"
        @click="goToCheckout"
      >
        {{ checkoutCta }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Ticket, Plus, Minus } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useAuthStore } from '@/stores/auth'
import { useTicketCheckoutStore } from '@/stores/ticketCheckout'
import { ticketTypesService, type TicketType } from '@/services/api'
import { formatCurrency, type CurrencyCode } from '@/utils/currency'

interface Props {
  eventId: string
  /**
   * Optional pre-fetched tier list. When provided we skip our own fetch and
   * stay reactive to changes from the parent. Useful when the parent already
   * needs the list (e.g. the drawer uses it as the discriminator) and we
   * want to avoid a duplicate request.
   */
  tiers?: TicketType[]
}

const props = withDefaults(defineProps<Props>(), {
  tiers: undefined,
})
const emit = defineEmits<{
  'login-required': []
}>()
void emit

const { t } = useAppLanguage()
const router = useRouter()
const authStore = useAuthStore()
const store = useTicketCheckoutStore()

const fetchedTiers = ref<TicketType[]>([])
const loading = ref(false)

// When the parent supplies tiers, mirror them; otherwise fall back to our own
// fetched list. Keeping the two sources separate (instead of writing into a
// shared `tiers` ref) means parent updates are always reflected without
// fighting our local state.
const tiers = computed<TicketType[]>(() => props.tiers ?? fetchedTiers.value)

const isAuthenticated = computed(() => authStore.isAuthenticated)

const loadTiers = async (eventId: string) => {
  loading.value = true
  try {
    // Public list — works without auth so the buyer can browse before logging in.
    const response = await ticketTypesService.listPublic(eventId)
    fetchedTiers.value = response.success && response.data ? response.data : []
  } catch {
    fetchedTiers.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (props.tiers === undefined) loadTiers(props.eventId)
})

// Reload if the parent mounts us against a different event (drawer reuse) —
// only when we own the fetch (parent isn't supplying tiers).
watch(
  () => props.eventId,
  (next) => {
    if (next && props.tiers === undefined) loadTiers(next)
  },
)

interface TierStateBadge {
  label: string
  className: string
}

const tierState = (tier: TicketType): TierStateBadge => {
  if (tier.is_sold_out) {
    return { label: t('events.tickets.public.soldOut'), className: 'bg-rose-50 text-rose-700' }
  }
  if (tier.sale_start && new Date(tier.sale_start).getTime() > Date.now()) {
    return {
      label: t('events.tickets.public.opensOn', { when: shortDate(tier.sale_start) }),
      className: 'bg-amber-50 text-amber-700',
    }
  }
  if (tier.sale_end && new Date(tier.sale_end).getTime() < Date.now()) {
    return { label: t('events.tickets.public.salesClosed'), className: 'bg-slate-100 text-slate-600' }
  }
  if (!tier.is_on_sale) {
    return { label: t('events.tickets.public.unavailable'), className: 'bg-slate-100 text-slate-600' }
  }
  return { label: '', className: '' }
}

const shortDate = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const canIncrement = (tier: TicketType): boolean => {
  const current = store.getQuantity(tier.id)
  if (current >= tier.max_per_order) return false
  if (current >= tier.quantity_remaining) return false
  return true
}

const ensureCurrentEvent = () => {
  if (store.eventId !== props.eventId) {
    store.startCart(props.eventId)
  }
}

const increment = (tier: TicketType) => {
  ensureCurrentEvent()
  const next = store.getQuantity(tier.id) + 1
  store.setQuantity(tier, next)
}

const decrement = (tier: TicketType) => {
  ensureCurrentEvent()
  const next = store.getQuantity(tier.id) - 1
  store.setQuantity(tier, next)
}

const subtotalDisplay = computed(() => {
  const currency = store.cartCurrency
  if (!currency) return formatCurrency('0', 'USD')
  return formatCurrency(store.subtotal, currency as CurrencyCode)
})

const canCheckout = computed(() => {
  return (
    store.eventId === props.eventId &&
    store.totalQuantity > 0 &&
    !store.hasMixedCurrency
  )
})

const checkoutCta = computed(() => {
  if (store.totalQuantity === 0) {
    return t('events.tickets.public.selectTickets')
  }
  return t('events.tickets.public.proceedToCheckout', { count: store.totalQuantity })
})

const goToCheckout = () => {
  if (!canCheckout.value) return
  router.push({ name: 'event-checkout', params: { id: props.eventId } })
}
</script>
