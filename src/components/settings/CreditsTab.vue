<template>
  <div>
    <!-- Loading. Shaped like what arrives — headline figure, then the buy row —
         so the balance doesn't shove the catalogue down when it lands. -->
    <div v-if="isBootstrapping" class="animate-pulse" aria-hidden="true">
      <div class="h-6 w-40 rounded bg-slate-200"></div>
      <div class="mt-2.5 h-4 w-56 max-w-full rounded bg-slate-100"></div>
      <div class="mt-6 h-10 w-28 rounded bg-slate-200"></div>
      <div class="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="n in 3" :key="n" class="h-36 rounded-2xl border border-slate-200/60 bg-white">
          <div class="p-4">
            <div class="h-4 w-24 rounded bg-slate-200"></div>
            <div class="mt-4 h-7 w-20 rounded bg-slate-200"></div>
            <div class="mt-3 h-3 w-32 rounded bg-slate-100"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load failure -->
    <div v-else-if="loadError" class="px-4 py-12 text-center lg:py-16">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle class="h-8 w-8 text-red-600" aria-hidden="true" />
      </div>
      <h3 class="mb-2 text-lg font-semibold text-slate-900">
        {{ t('settings.credits.errorTitle') }}
      </h3>
      <p class="mx-auto mb-6 max-w-md text-sm text-slate-500">{{ loadError }}</p>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        @click="load"
      >
        <RefreshCw class="h-4 w-4" aria-hidden="true" />
        {{ t('settings.credits.tryAgain') }}
      </button>
    </div>

    <!--
      Not a partner yet. The API answers 403 here rather than an empty list —
      wholesale pricing is confidential — so this is the state, not an error, and
      the way in is one tab over.
    -->
    <div v-else-if="isPartnerGated" class="px-4 py-12 text-center lg:py-16">
      <div
        class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20"
      >
        <Store class="h-8 w-8 text-[#2ecc71]" aria-hidden="true" />
      </div>
      <h3 class="mb-2 text-lg font-semibold text-slate-900">
        {{ t('settings.credits.gated.title') }}
      </h3>
      <p class="mx-auto max-w-md text-sm leading-relaxed text-slate-500">
        {{ t('settings.credits.gated.subtitle') }}
      </p>
      <div class="mt-6">
        <button
          type="button"
          class="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          @click="goToVendorTab"
        >
          {{ t('settings.credits.gated.cta') }}
          <ArrowRight
            class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>

    <template v-else>
      <header class="mb-6 min-w-0">
        <h2 class="text-xl font-semibold text-slate-900">{{ t('settings.credits.title') }}</h2>
        <p class="mt-1 text-sm text-slate-500">{{ headerLine }}</p>
      </header>

      <!--
        The balance, as a figure on the page rather than a card containing a
        figure. It is the one number this tab exists to report; wrapping it in
        chrome would make it a peer of the packs below it instead of the answer
        they lead to.
      -->
      <section class="mb-8">
        <p class="flex items-baseline gap-2">
          <span class="text-4xl font-bold leading-none text-slate-900 tabular-nums">
            {{ totalCreditsRemaining }}
          </span>
          <span class="text-sm font-medium text-slate-500">
            {{ t('settings.credits.balanceLabel') }}
          </span>
        </p>

        <!-- Each batch, and when it lapses. A list is a list — divided rows,
             not a second grid of cards. -->
        <ul v-if="codes.length" class="mt-4 divide-y divide-slate-200 border-t border-slate-200">
          <li
            v-for="code in codes"
            :key="code.id"
            class="flex items-center gap-3 py-3"
            :class="{ 'opacity-50': isCodeSpent(code) }"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-slate-900">
                {{
                  code.applicable_plan_names?.length
                    ? code.applicable_plan_names.join(', ')
                    : t('settings.credits.allPlans')
                }}
              </p>
              <p class="mt-0.5 truncate font-mono text-xs text-slate-500">{{ code.code }}</p>
            </div>

            <div class="flex-shrink-0 text-right">
              <p class="text-sm font-semibold text-slate-900 tabular-nums">
                {{ remainingLabel(code) }}
              </p>
              <p class="mt-0.5 text-xs" :class="expiryToneClass(code)">
                {{ expiryLabel(code) }}
              </p>
            </div>
          </li>
        </ul>

        <p v-else class="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
          {{ t('settings.credits.noCodes') }}
        </p>
      </section>

      <!-- The catalogue. Each pack is a separable, buyable object, so it earns a
           card — and the card itself is the control, which keeps the tab's one
           gradient object in the drawer that opens. -->
      <section class="mb-8">
        <h3 class="text-base font-semibold text-slate-900">
          {{ t('settings.credits.catalogue.title') }}
        </h3>
        <p class="mt-1 text-sm text-slate-500">{{ t('settings.credits.catalogue.subtitle') }}</p>

        <div
          v-if="packs.length"
          class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
        >
          <button
            v-for="pack in packs"
            :key="pack.id"
            type="button"
            :disabled="packDisabled(pack)"
            class="group flex flex-col rounded-2xl border border-slate-200/60 bg-white p-4 text-left transition-all duration-300 hover:border-slate-300/80 hover:shadow-lg hover:shadow-slate-200/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-slate-200/60 disabled:hover:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            @click="openBuyDrawer(pack)"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="min-w-0 truncate text-sm font-semibold text-slate-900">{{ pack.name }}</p>
              <ChevronRight
                class="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </div>

            <p class="mt-3 text-2xl font-bold leading-none text-slate-900">
              {{ Number(pack.price) === 0 ? t('settings.credits.free') : `$${pack.price}` }}
            </p>
            <p class="mt-1.5 text-xs text-slate-600">
              {{ t('settings.credits.creditCount', { n: pack.credit_count }, pack.credit_count) }}
              <span v-if="Number(pack.price) !== 0" class="text-slate-400">
                · {{ t('settings.credits.perCredit', { amount: pack.price_per_credit }) }}
              </span>
            </p>

            <div class="mt-auto pt-3">
              <p class="truncate text-xs text-slate-500">
                {{ t('settings.credits.forPlan', { plan: pack.pricing_plan_name }) }}
                ·
                {{ t('settings.credits.dayCount', { n: pack.validity_days }, pack.validity_days) }}
              </p>
              <p v-if="packNote(pack)" class="mt-1 text-xs font-medium text-amber-600">
                {{ packNote(pack) }}
              </p>
            </div>
          </button>
        </div>

        <p v-else class="mt-4 text-sm text-slate-500">
          {{ t('settings.credits.catalogue.empty') }}
        </p>
      </section>

      <!-- Orders. Divided rows again, but this list acts: a pending row can be
           proven or cancelled. -->
      <section v-if="orders.length">
        <h3 class="text-base font-semibold text-slate-900">
          {{ t('settings.credits.orders.title') }}
        </h3>

        <ul class="mt-3 divide-y divide-slate-200 border-t border-slate-200">
          <li v-for="order in orders" :key="order.id" class="py-3">
            <div class="flex items-start gap-3">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-slate-900">{{ order.pack_name }}</p>
                <p class="mt-0.5 text-xs text-slate-500">
                  {{ order.order_reference }} · {{ formatDate(order.created_at) }}
                </p>
              </div>

              <div class="flex flex-shrink-0 items-center gap-2">
                <span class="text-sm font-medium text-slate-700 tabular-nums">
                  ${{ order.amount }}
                </span>
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="orderStatusClass(order.status)"
                >
                  {{ orderStatusLabel(order) }}
                </span>
              </div>
            </div>

            <!-- Rejections deliberately carry no reason: `admin_notes` is not on
                 the partner serializer, so pointing at support is the only
                 honest thing this row can say. -->
            <p v-if="order.status === 'rejected'" class="mt-1.5 text-xs text-slate-500">
              {{ t('settings.credits.orders.rejectedHint') }}
            </p>

            <div v-if="order.status === 'pending'" class="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                @click="openProofDrawer(order)"
              >
                <Upload class="h-3.5 w-3.5" aria-hidden="true" />
                {{
                  order.payment_proof
                    ? t('settings.credits.orders.replaceProof')
                    : t('settings.credits.orders.uploadProof')
                }}
              </button>
              <button
                type="button"
                :disabled="isSubmitting"
                class="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors duration-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                @click="orderToCancel = order"
              >
                {{ t('settings.credits.orders.cancel') }}
              </button>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <CreditPackOrderDrawer
      :open="drawerOpen"
      :pack="activePack"
      :order="activeOrder"
      :submitting="isSubmitting"
      :result="orderResult"
      @close="closeDrawer"
      @place-order="handlePlaceOrder"
      @upload-proof="handleUploadProof"
    />

    <DeleteConfirmModal
      :show="!!orderToCancel"
      :title="t('settings.credits.orders.cancelConfirm.title')"
      :message="t('settings.credits.orders.cancelConfirm.message')"
      :loading="isSubmitting"
      @confirm="confirmCancel"
      @cancel="orderToCancel = null"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Partner credits: what the partner holds, what they can buy, and where their
 * orders stand.
 *
 * Three surfaces, three deliberately different shapes — a headline figure, a
 * grid of buyable packs, and two divided lists — because six identical white
 * cards down a page is the generic tell, and these are genuinely three kinds of
 * thing rather than three instances of one.
 *
 * This is the only place credits are written from: the drawer emits payloads and
 * everything routes through the one `usePartnerCredits` instance below, so the
 * balance can never disagree with the order that changed it.
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, ArrowRight, ChevronRight, RefreshCw, Store, Upload } from 'lucide-vue-next'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import CreditPackOrderDrawer from './credits/CreditPackOrderDrawer.vue'
import { usePartnerCredits } from '@/composables/settings/usePartnerCredits'
import { useToast } from '@/composables/useToast'
import type {
  CreditPack,
  CreditPackOrder,
  CreditPackOrderStatus,
  PartnerCreditCode,
} from '@/services/api'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { showSuccess, showError } = useToast()

const {
  packs,
  codes,
  orders,
  totalCreditsRemaining,
  isLoading,
  hasLoadedOnce,
  loadError,
  isPartnerGated,
  isSubmitting,
  isCodeSpent,
  isExpiringSoon,
  daysUntilExpiry,
  isPackClaimed,
  pendingOrderForPack,
  load,
  placeOrder,
  uploadProof,
  cancelOrder,
} = usePartnerCredits()

const drawerOpen = ref(false)
const activePack = ref<CreditPack | null>(null)
const activeOrder = ref<CreditPackOrder | null>(null)
const orderResult = ref<CreditPackOrder | null>(null)
const orderToCancel = ref<CreditPackOrder | null>(null)

const isBootstrapping = computed(() => isLoading.value && !hasLoadedOnce.value)

/** What is in here, in one line — the pattern the tickets and listings tabs use. */
const headerLine = computed(() => {
  const parts = [
    t(
      'settings.credits.summary.balance',
      { n: totalCreditsRemaining.value },
      totalCreditsRemaining.value,
    ),
  ]
  const pending = orders.value.filter((o) => o.status === 'pending').length
  if (pending > 0) parts.push(t('settings.credits.summary.pending', { n: pending }, pending))
  const expiring = codes.value.filter((c) => isExpiringSoon(c)).length
  if (expiring > 0) parts.push(t('settings.credits.summary.expiring', { n: expiring }, expiring))
  return parts.join(' · ')
})

const remainingLabel = (code: PartnerCreditCode): string => {
  // `null` is the pay-as-you-go case: no fixed number of uses, no commitment.
  if (code.remaining_uses === null) return t('settings.credits.unlimited')
  if (code.max_total_uses === null) return String(code.remaining_uses)
  return `${code.remaining_uses} / ${code.max_total_uses}`
}

const expiryLabel = (code: PartnerCreditCode): string => {
  if (code.is_usage_limit_reached) return t('settings.credits.allSpent')
  if (code.is_expired) return t('settings.credits.expired')
  if (!code.is_active) return t('settings.credits.inactive')
  if (!code.valid_until) return t('settings.credits.noExpiry')

  const days = daysUntilExpiry(code)
  if (days !== null && days <= 30) return t('settings.credits.expiresInDays', { n: days }, days)
  return t('settings.credits.expiresOn', { date: formatDate(code.valid_until) })
}

const expiryToneClass = (code: PartnerCreditCode): string =>
  isExpiringSoon(code) ? 'text-amber-600 font-medium' : 'text-slate-500'

/** A claimed trial and an open order both make a second attempt a certain 400. */
const packDisabled = (pack: CreditPack): boolean =>
  isPackClaimed(pack) || Boolean(pendingOrderForPack(pack))

const packNote = (pack: CreditPack): string | null => {
  if (isPackClaimed(pack)) return t('settings.credits.alreadyClaimed')
  if (pendingOrderForPack(pack)) return t('settings.credits.orderPending')
  if (pack.requires_approval) return t('settings.credits.needsApproval')
  return null
}

const orderStatusClass = (status: CreditPackOrderStatus): string => {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    case 'pending':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
    case 'rejected':
      return 'bg-red-50 text-red-700 ring-1 ring-red-200'
    default:
      return 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
  }
}

/** Prefer the server's own wording; fall back to ours if it sent none. */
const orderStatusLabel = (order: CreditPackOrder): string =>
  order.status_display || t(`settings.credits.orders.status.${order.status}`)

const formatDate = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const goToVendorTab = () => {
  router.replace({ query: { ...route.query, tab: 'vendor' } })
}

const openBuyDrawer = (pack: CreditPack) => {
  if (packDisabled(pack)) return
  activePack.value = pack
  activeOrder.value = null
  orderResult.value = null
  drawerOpen.value = true
}

const openProofDrawer = (order: CreditPackOrder) => {
  activePack.value = null
  activeOrder.value = order
  orderResult.value = null
  drawerOpen.value = true
}

const closeDrawer = () => {
  drawerOpen.value = false
  activePack.value = null
  activeOrder.value = null
  orderResult.value = null
}

const handlePlaceOrder = async (payload: {
  pack: string
  payment_method?: number
  transaction_reference?: string
  vendor_notes?: string
  proof: File | null
}) => {
  const { proof, ...data } = payload
  const result = await placeOrder(data, proof)

  if (!result.success) {
    showError(result.error)
    return
  }

  // Branch on the status the server sent, never on the price — see the drawer's
  // result screen, which shows the issued code rather than an awaiting-review
  // message when a free pack was confirmed in the same request.
  orderResult.value = result.order
  showSuccess(
    result.order.status === 'confirmed'
      ? t(
          'settings.credits.messages.creditsIssued',
          { n: result.order.credit_count },
          result.order.credit_count,
        )
      : t('settings.credits.messages.orderPlaced'),
  )
}

const handleUploadProof = async (payload: {
  orderId: string
  proof: File
  payment_method?: number
  transaction_reference?: string
}) => {
  const result = await uploadProof(payload.orderId, payload.proof, {
    payment_method: payload.payment_method,
    transaction_reference: payload.transaction_reference,
  })

  if (!result.success) {
    showError(result.error)
    return
  }

  showSuccess(t('settings.credits.messages.proofUploaded'))
  closeDrawer()
}

const confirmCancel = async () => {
  const order = orderToCancel.value
  if (!order) return

  const result = await cancelOrder(order.id)
  orderToCancel.value = null

  if (result.success) showSuccess(t('settings.credits.messages.orderCancelled'))
  else showError(result.error ?? t('settings.credits.messages.cancelFailed'))
}

onMounted(load)
</script>
