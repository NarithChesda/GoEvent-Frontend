<template>
  <div>
    <!-- Loading. Shaped like what arrives — title, balance panel, then the buy
         grid — so nothing shoves anything else down when it lands. -->
    <div v-if="isBootstrapping" class="animate-pulse" aria-hidden="true">
      <div class="h-8 w-48 rounded bg-slate-200"></div>
      <div class="mt-2.5 h-4 w-64 max-w-full rounded bg-slate-100"></div>
      <div class="mt-6 h-40 rounded-2xl bg-slate-100"></div>
      <div class="mt-8 h-5 w-32 rounded bg-slate-200"></div>
      <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="n in 3" :key="n" class="h-44 rounded-2xl border border-slate-200/60 bg-white">
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
      Not a partner. The API answers 403 here rather than an empty list —
      wholesale pricing is confidential — so this is the state, not an error.

      It used to carry no call to action, on the grounds that partner status is a
      flag an admin sets and there was nothing a visitor could do here to earn
      it. That reasoning held only while there was no way to ask: the page told
      people to "get in touch with the GoEvent team" and then offered them no
      way to do so, which is a dead end inside the product. There is now an
      application, so this state has four shapes rather than one — never asked,
      asked and waiting, turned down, and the desync where we were approved but
      the API still says no.

      The CTA is `bg-slate-900`, not the brand gradient, because the drawer it
      opens is headed by that gradient and the two would otherwise be on screen
      together — the drawer header is the one that establishes context.
    -->
    <div v-else-if="isPartnerGated" class="px-4 py-12 text-center lg:py-16">
      <div
        class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        :class="gatedVisual.disc"
      >
        <component
          :is="gatedVisual.icon"
          class="h-8 w-8"
          :class="gatedVisual.tone"
          aria-hidden="true"
        />
      </div>
      <h3 class="mb-2 text-lg font-semibold text-slate-900">{{ gatedCopy.title }}</h3>
      <p class="mx-auto max-w-md text-sm leading-relaxed text-slate-500">
        {{ gatedCopy.subtitle }}
      </p>

      <!-- When the application was made, said quietly — it answers "did that go
           through?" without competing with the sentence above it. -->
      <p v-if="partnerRequest" class="mt-3 text-xs text-slate-400">
        {{
          t('settings.credits.request.submittedOn', { date: formatDate(partnerRequest.created_at) })
        }}
      </p>

      <!-- Why we said no, when the reviewer wrote a reason. A tinted region
           rather than a card: it belongs to the state above it, and a card here
           would be a card with nothing separable inside it. -->
      <p
        v-if="rejectionNote"
        class="mx-auto mt-4 max-w-md rounded-xl bg-slate-50 px-4 py-3 text-left text-sm leading-relaxed text-slate-600"
      >
        {{ rejectionNote }}
      </p>

      <button
        v-if="canRequestPartner"
        type="button"
        class="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        @click="requestDrawerOpen = true"
      >
        <Store class="h-4 w-4" aria-hidden="true" />
        {{
          partnerRequest
            ? t('settings.credits.request.ctaAgain')
            : t('settings.credits.request.cta')
        }}
      </button>

      <!-- Approved, but this endpoint still says otherwise. Re-reading the
           account is the whole fix, so offer exactly that. -->
      <button
        v-else-if="partnerRequest?.status === 'approved'"
        type="button"
        :disabled="isLoading"
        class="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        @click="reloadAsPartner"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" aria-hidden="true" />
        {{ t('settings.credits.tryAgain') }}
      </button>

      <!--
        The same destination as the header link on the other half of this page,
        because this is the half whose reader has not read the pitch yet. Bare
        rather than pilled: it sits under a primary CTA, and someone who is not
        a partner needs the application first and the sales page second. The
        wrapper is what puts it on its own line — the CTAs above are inline-flex
        inside a centred column, so a bare sibling would sit beside them.
      -->
      <div class="mt-5">
        <RouterLink
          to="/partners"
          class="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-slate-500 transition-[color,transform] duration-200 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 active:scale-[0.97]"
        >
          {{ t('settings.credits.programmeLink') }}
          <ArrowRight class="h-4 w-4 flex-none" aria-hidden="true" />
        </RouterLink>
      </div>
    </div>

    <template v-else>
      <!--
        The title, and beside it the way back to the argument this page is the
        answer to. `basis-64` on the text column is what decides when the two
        stop being one row: below ~16rem the link wraps under the subtitle
        rather than squeezing the heading into two lines to make room for it.
        Top-aligned, so the link sits on the heading's line and not in the
        middle of a two-line block.
      -->
      <header class="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div class="min-w-0 flex-1 basis-64">
          <h2 class="text-2xl font-bold text-slate-900 sm:text-3xl">
            {{ t('settings.credits.title') }}
          </h2>
          <p class="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">
            {{ t('settings.credits.subtitle') }}
          </p>
        </div>

        <!--
          An outline pill, not a filled one: it leaves the page, and the only
          filled controls here are the ones that spend money. The arrow trails
          the label because it points at where you land, and the padding is
          uneven to sit the glyph optically inside the pill's end.
        -->
        <RouterLink
          to="/partners"
          class="inline-flex min-h-[40px] flex-none items-center gap-1.5 rounded-full border border-slate-200 bg-white pl-3.5 pr-3 text-[13px] font-medium text-slate-700 shadow-sm transition-[color,background-color,border-color,transform] duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 active:scale-[0.97]"
        >
          {{ t('settings.credits.programmeLink') }}
          <ArrowRight class="h-4 w-4 flex-none" aria-hidden="true" />
        </RouterLink>
      </header>

      <!--
        What the partner holds, as one object: the balance and the batches it is
        made of. A brand-tinted band rather than a white card — the page opens a
        gradient-headed drawer, and without a single tinted surface of its own it
        reads as a different product from the checkout it launches. The tint is
        texture, not a second gradient object (the only one on this page is the
        hairline meter inside each row).
      -->
      <section
        class="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[#2ecc71]/[0.12] via-white to-[#1e90ff]/[0.12] ring-1 ring-slate-900/5"
      >
        <div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 p-5 sm:p-6">
          <p class="flex items-baseline gap-2">
            <span class="text-4xl font-bold leading-none text-slate-900 tabular-nums sm:text-5xl">
              {{ totalCreditsRemaining }}
            </span>
            <span class="text-sm font-medium text-slate-500">
              {{ t('settings.credits.balanceLabel') }}
            </span>
          </p>

          <!-- Only what needs acting on. A quiet balance says nothing here. -->
          <ul v-if="alerts.length" class="flex flex-wrap items-center gap-1.5">
            <li
              v-for="alert in alerts"
              :key="alert"
              class="inline-flex items-center rounded-full bg-amber-100/80 px-2.5 py-1 text-xs font-medium text-amber-700"
            >
              {{ alert }}
            </li>
          </ul>
        </div>

        <!-- Each batch, and how much of it is left. Divided rows inside the band
             rather than a second list below it: a batch is not a separate
             subject, it is what the number above is made of. -->
        <ul
          v-if="codes.length"
          class="divide-y divide-slate-900/[0.06] border-t border-slate-900/5"
        >
          <li
            v-for="code in codes"
            :key="code.id"
            class="px-5 py-3.5 sm:px-6"
            :class="{ 'opacity-50': isCodeSpent(code) }"
          >
            <div class="flex items-start gap-3">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-slate-900">
                  {{
                    code.applicable_plan_names?.length
                      ? code.applicable_plan_names.join(', ')
                      : t('settings.credits.allPlans')
                  }}
                </p>
                <p class="mt-0.5 truncate font-mono text-xs text-slate-500">{{ code.code }}</p>
                <!-- What this batch is good for beyond its plans. Only the
                     narrow scope says anything, so the unrestricted batches
                     stay silent rather than all carrying an "any template"
                     label that distinguishes nothing. -->
                <p
                  v-if="isOwnDesignsCode(code)"
                  class="mt-1 inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[0.6875rem] font-medium text-slate-600 ring-1 ring-slate-900/[0.06]"
                >
                  <PenTool class="h-3 w-3 flex-shrink-0 text-slate-400" aria-hidden="true" />
                  {{ t('settings.credits.ownDesignsOnly') }}
                </p>
              </div>

              <div class="flex-shrink-0 text-right">
                <p class="text-sm font-semibold text-slate-900 tabular-nums">
                  {{ remainingLabel(code) }}
                </p>
                <p class="mt-0.5 text-xs" :class="expiryToneClass(code)">
                  {{ expiryLabel(code) }}
                </p>
              </div>
            </div>

            <div
              v-if="remainingFraction(code) !== null"
              class="mt-2.5 h-1 overflow-hidden rounded-full bg-slate-900/10"
              role="presentation"
            >
              <div
                class="h-full rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]"
                :style="{ width: `${Math.round(remainingFraction(code)! * 100)}%` }"
              ></div>
            </div>
          </li>
        </ul>

        <p
          v-else
          class="border-t border-slate-900/5 px-5 py-4 text-sm leading-relaxed text-slate-500 sm:px-6"
        >
          {{ t('settings.credits.noCodes') }}
        </p>
      </section>

      <!-- The catalogue. Each pack is a separable, buyable object, so it earns a
           card — and the card itself is the control, which keeps the page's one
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
            class="group flex flex-col rounded-2xl border border-slate-200/60 bg-white p-4 text-left transition-all duration-300 hover:border-slate-300/80 hover:shadow-lg hover:shadow-slate-200/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-slate-200/60 disabled:hover:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:p-5"
            @click="openBuyDrawer(pack)"
          >
            <div class="flex items-start justify-between gap-2">
              <p class="min-w-0 truncate text-sm font-semibold text-slate-900">{{ pack.name }}</p>
              <span
                v-if="savingsPercent(pack)"
                class="inline-flex flex-shrink-0 items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-emerald-700 ring-1 ring-emerald-200"
              >
                {{ t('settings.credits.savePercent', { n: savingsPercent(pack) }) }}
              </span>
            </div>

            <!--
              What separates this pack from an otherwise identical one, so it
              sits with the name rather than in the fine print at the foot of
              the card: an own-designs pack is a different product at a
              different rate, and finding that out at checkout is finding it out
              after paying.
            -->
            <p
              v-if="isOwnDesignsPack(pack)"
              class="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[0.6875rem] font-medium text-slate-600"
            >
              <PenTool class="h-3 w-3 flex-shrink-0 text-slate-400" aria-hidden="true" />
              {{ t('settings.credits.ownDesignsOnly') }}
            </p>

            <p class="mt-3 text-2xl font-bold leading-none text-slate-900 tabular-nums">
              {{ Number(pack.price) === 0 ? t('settings.credits.free') : `$${pack.price}` }}
            </p>
            <p class="mt-1.5 text-xs text-slate-600">
              {{ t('settings.credits.creditCount', { n: pack.credit_count }, pack.credit_count) }}
              <span v-if="Number(pack.price) !== 0" class="text-slate-400">
                · {{ t('settings.credits.perCredit', { amount: pack.price_per_credit }) }}
              </span>
            </p>

            <!-- The comparison that makes wholesale worth buying, said once and
                 in the retail terms the partner's own customer would pay. -->
            <p v-if="retailPrice(pack)" class="mt-2.5 text-xs text-slate-500">
              <span class="text-slate-400 line-through tabular-nums">${{ retailPrice(pack) }}</span>
              {{ t('settings.credits.retailPerEvent') }}
            </p>

            <div class="mt-auto pt-4">
              <div class="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <p class="min-w-0 truncate text-xs text-slate-500">
                  {{ t('settings.credits.forPlan', { plan: pack.pricing_plan_name }) }}
                  ·
                  {{ validityLabel(pack) }}
                </p>
                <ChevronRight
                  class="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </div>
              <p v-if="packNote(pack)" class="mt-2 text-xs font-medium text-amber-600">
                {{ packNote(pack) }}
              </p>
            </div>
          </button>
        </div>

        <p v-else class="mt-4 text-sm text-slate-500">
          {{ t('settings.credits.catalogue.empty') }}
        </p>
      </section>

      <!-- Orders. Divided rows, but this list acts: a pending row can be proven
           or cancelled. -->
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

    <PartnerRequestDrawer
      :open="requestDrawerOpen"
      :submitting="isSubmittingRequest"
      :field-errors="requestFieldErrors"
      @close="closeRequestDrawer"
      @submit="handleRequestPartner"
    />

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
 * Three surfaces, three deliberately different shapes — a tinted balance band
 * carrying its own batch rows, a grid of buyable packs, and a divided order list
 * — because six identical white cards down a page is the generic tell, and these
 * are genuinely three kinds of thing rather than three instances of one.
 *
 * This is the only place credits are written from: the drawer emits payloads and
 * everything routes through the one `usePartnerCredits` instance below, so the
 * balance can never disagree with the order that changed it.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  PenTool,
  RefreshCw,
  Store,
  Upload,
} from 'lucide-vue-next'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import CreditPackOrderDrawer from './credits/CreditPackOrderDrawer.vue'
import PartnerRequestDrawer from './credits/PartnerRequestDrawer.vue'
import { usePartnerCredits } from '@/composables/settings/usePartnerCredits'
import { usePartnerRequest } from '@/composables/settings/usePartnerRequest'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import type {
  CreatePartnerRequestData,
  CreditPack,
  CreditPackOrder,
  CreditPackOrderStatus,
  PartnerCreditCode,
} from '@/services/api'

const { t } = useI18n()
const { showSuccess, showError } = useToast()
const authStore = useAuthStore()

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

const {
  request: partnerRequest,
  isLoading: isLoadingRequest,
  hasLoadedOnce: hasLoadedRequestOnce,
  isSubmitting: isSubmittingRequest,
  fieldErrors: requestFieldErrors,
  load: loadPartnerRequest,
  submit: submitPartnerRequest,
  clearFieldErrors: clearRequestFieldErrors,
} = usePartnerRequest()

const drawerOpen = ref(false)
const requestDrawerOpen = ref(false)
const activePack = ref<CreditPack | null>(null)
const activeOrder = ref<CreditPackOrder | null>(null)
const orderResult = ref<CreditPackOrder | null>(null)
const orderToCancel = ref<CreditPackOrder | null>(null)

/** What the account itself claims. The API's 403 is the authority on this page. */
const isPartnerAccount = computed(() => authStore.user?.is_partner ?? false)

/**
 * The gated state cannot render until we know whether an application is already
 * open — showing "Request partner access" to someone who applied last week and
 * then swapping it for "under review" a moment later is worse than a longer
 * skeleton, and the button in that flash leads to a guaranteed 400.
 */
const isBootstrapping = computed(
  () =>
    (isLoading.value && !hasLoadedOnce.value) ||
    (isPartnerGated.value && !hasLoadedRequestOnce.value),
)

/**
 * Which of the four gated shapes we are in.
 *
 * Keyed off the application, not off `is_partner`: reaching this branch already
 * means the API refused, so the only open question is what the account has done
 * about it.
 */
const gatedState = computed<'none' | 'pending' | 'rejected' | 'approved'>(() => {
  if (!partnerRequest.value) return 'none'
  return partnerRequest.value.status
})

/**
 * Whether asking (or asking again) is allowed.
 *
 * `can_reapply` is the backend's call, never inferred from the status — a
 * rejection may be final or may invite a retry, and only the reviewer knows.
 */
const canRequestPartner = computed(() => {
  if (gatedState.value === 'none') return true
  return gatedState.value === 'rejected' && Boolean(partnerRequest.value?.can_reapply)
})

/** Only a rejection carries a reason, and only when the reviewer wrote one. */
const rejectionNote = computed(() =>
  gatedState.value === 'rejected' ? partnerRequest.value?.review_note || null : null,
)

const gatedVisual = computed(() => {
  switch (gatedState.value) {
    case 'pending':
      return { icon: Clock, disc: 'bg-amber-50', tone: 'text-amber-500' }
    case 'rejected':
      return { icon: Store, disc: 'bg-slate-100', tone: 'text-slate-400' }
    case 'approved':
      return { icon: Check, disc: 'bg-emerald-50', tone: 'text-emerald-600' }
    default:
      return {
        icon: Store,
        disc: 'bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20',
        tone: 'text-[#2ecc71]',
      }
  }
})

const gatedCopy = computed(() => {
  if (gatedState.value === 'none') {
    return {
      title: t('settings.credits.gated.title'),
      subtitle: t('settings.credits.gated.subtitle'),
    }
  }
  return {
    title: t(`settings.credits.request.${gatedState.value}.title`),
    subtitle: t(`settings.credits.request.${gatedState.value}.subtitle`),
  }
})

/**
 * Only the things that want acting on.
 *
 * The balance is already the largest thing on the page, so restating it here
 * would spend the one slot next to it on information the eye has just read.
 */
const alerts = computed(() => {
  const notes: string[] = []
  const pending = orders.value.filter((o) => o.status === 'pending').length
  if (pending > 0) notes.push(t('settings.credits.summary.pending', { n: pending }, pending))
  const expiring = codes.value.filter((c) => isExpiringSoon(c)).length
  if (expiring > 0) notes.push(t('settings.credits.summary.expiring', { n: expiring }, expiring))
  return notes
})

const remainingLabel = (code: PartnerCreditCode): string => {
  // `null` is the pay-as-you-go case: no fixed number of uses, no commitment.
  if (code.remaining_uses === null) return t('settings.credits.unlimited')
  if (code.max_total_uses === null) return String(code.remaining_uses)
  return `${code.remaining_uses} / ${code.max_total_uses}`
}

/** How much of a batch is still spendable — `null` when there is no fixed size. */
const remainingFraction = (code: PartnerCreditCode): number | null => {
  const total = code.max_total_uses
  const left = code.remaining_uses
  if (total === null || left === null || total <= 0) return null
  return Math.min(1, Math.max(0, left / total))
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

/**
 * Whether a pack or a batch is restricted to the partner's own designs.
 *
 * An absent `template_scope` is `any`, not "unknown" — it is what every credit
 * sold before the field existed was, and the backend defaults it at the column
 * level. So this only ever reads true on a positively narrowed pack, and a
 * frontend running ahead of the backend simply says nothing.
 */
const isOwnDesignsPack = (pack: CreditPack): boolean => pack.template_scope === 'own_partner'

const isOwnDesignsCode = (code: PartnerCreditCode): boolean => code.template_scope === 'own_partner'

/** The retail price of the one event a credit covers — the thing being beaten. */
const retailPrice = (pack: CreditPack): string | null => {
  const retail = Number(pack.pricing_plan_price)
  return Number.isFinite(retail) && retail > 0 ? pack.pricing_plan_price : null
}

/**
 * How far under retail this pack's per-credit rate lands.
 *
 * This is the whole reason wholesale exists, and until now it was derivable only
 * by dividing two numbers the partner had to find on different lines. Rendered
 * only when both figures are real and the pack is genuinely cheaper — a backend
 * that omits `pricing_plan_price` simply drops the badge.
 */
const savingsPercent = (pack: CreditPack): number | null => {
  const retail = Number(pack.pricing_plan_price)
  const each = Number(pack.price_per_credit)
  if (!Number.isFinite(retail) || !Number.isFinite(each) || retail <= 0 || each < 0) return null
  const percent = Math.round((1 - each / retail) * 100)
  return percent > 0 ? percent : null
}

/**
 * How long the credits stay redeemable.
 *
 * A blank `validity_days` is not missing data — it is the term of sale for a
 * pack whose credits never expire. Handing that `null` to a plural string picks
 * the singular branch and interpolates the count away, so the pack that never
 * expires was the one advertising itself as lasting " day".
 */
const validityLabel = (pack: CreditPack): string =>
  typeof pack.validity_days === 'number'
    ? t('settings.credits.dayCount', { n: pack.validity_days }, pack.validity_days)
    : t('settings.credits.noExpiry')

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

const closeRequestDrawer = () => {
  requestDrawerOpen.value = false
  clearRequestFieldErrors()
}

/** The fields the drawer actually renders, so an error can be shown *at* one. */
const REQUEST_FORM_FIELDS = [
  'business_name',
  'contact_phone',
  'contact_telegram',
  'expected_monthly_events',
  'message',
]

const handleRequestPartner = async (payload: CreatePartnerRequestData) => {
  const result = await submitPartnerRequest(payload)

  if (!result.success) {
    // A complaint about a field the form shows stays in the drawer, next to the
    // input that caused it. Anything else — `detail`, `non_field_errors`, a
    // field we do not render — has nowhere to land there, so it takes the toast
    // rather than disappearing.
    const shownInline = Object.keys(requestFieldErrors.value ?? {}).some((field) =>
      REQUEST_FORM_FIELDS.includes(field),
    )
    if (!shownInline) showError(result.error)
    return
  }

  requestDrawerOpen.value = false
  showSuccess(t('settings.credits.request.messages.sent'))
}

/** The approved-but-still-403 case: re-read the account, then the credits. */
const reloadAsPartner = async () => {
  await authStore.fetchProfile()
  await load()
}

const confirmCancel = async () => {
  const order = orderToCancel.value
  if (!order) return

  const result = await cancelOrder(order.id)
  orderToCancel.value = null

  if (result.success) showSuccess(t('settings.credits.messages.orderCancelled'))
  else showError(result.error ?? t('settings.credits.messages.cancelFailed'))
}

onMounted(async () => {
  // An account that already knows it is not a partner is asked about its
  // application *alongside* the credit fetch that is going to 403 anyway, so
  // the gated state resolves in one paint instead of two round trips.
  if (!isPartnerAccount.value) loadPartnerRequest()

  await load()

  // Flag desync, in either direction. The API is the authority: if it gated us
  // and we did not pre-fetch, ask now; if it let us through while the cached
  // account still says otherwise, re-read the profile so the nav gains its
  // Credits link without waiting for the next sign-in.
  if (isPartnerGated.value && !hasLoadedRequestOnce.value && !isLoadingRequest.value) {
    await loadPartnerRequest()
  } else if (!isPartnerGated.value && !isPartnerAccount.value) {
    await authStore.fetchProfile()
  }
})
</script>
