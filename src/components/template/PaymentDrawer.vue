<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="emit('close')"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="open"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[32.5rem] laptop-sm:w-[35rem] laptop-md:w-[38.75rem] desktop:w-[42.5rem] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center px-3 py-2.5">
            <div class="flex items-center gap-2 flex-1">
              <button
                @click="emit('close')"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                :title="t('management.templatePaymentTab.paymentDrawer.close')"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <div class="min-w-0">
                <p
                  v-if="templateName"
                  class="text-[0.625rem] uppercase tracking-wide text-white/80"
                >
                  {{ templateName }}
                </p>
                <h2 class="text-base font-semibold text-white leading-tight">
                  {{ t('management.templatePaymentTab.paymentDrawer.title') }}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <div class="p-3 laptop-sm:p-4 space-y-3 laptop-sm:space-y-4">
            <!--
              What is being activated and what it costs on the path currently
              chosen — a quiet slate region rather than a bordered card, since
              nothing in it is separable from the drawer it sits in. It is the
              same opening block the credit-pack checkout uses, so the two
              purchases a partner makes read as one product rather than two
              unrelated forms. It is also the only place the credit path ever
              names the plan: everything below it disappears when a credit is
              spent.
            -->
            <section class="rounded-xl bg-slate-50 p-4">
              <div class="flex items-baseline justify-between gap-3">
                <p class="min-w-0 truncate text-sm font-medium text-slate-900">
                  {{
                    templatePackage?.name || t('management.templatePaymentTab.paymentDrawer.total')
                  }}
                </p>
                <div class="flex flex-shrink-0 items-baseline gap-2">
                  <p
                    v-if="!payingWithCredit && strikethroughPrice"
                    class="text-xs text-slate-400 line-through tabular-nums"
                  >
                    ${{ strikethroughPrice }}
                  </p>
                  <p class="text-xl font-bold leading-none text-slate-900 tabular-nums">
                    {{ headlineAmount }}
                  </p>
                </div>
              </div>

              <!-- Why the figure above is not the list price. A pay-as-you-go
                   partner code discounts the normal path rather than zeroing it,
                   so the rate is named where the price is. -->
              <div v-if="promoDiscount || partnerRate" class="mt-2 flex flex-wrap gap-1.5">
                <span
                  v-if="promoDiscount"
                  class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[0.6875rem] font-medium text-emerald-700"
                >
                  -${{ promoDiscount.discount }}
                </span>
                <span
                  v-else-if="partnerRate"
                  class="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[0.6875rem] font-medium text-sky-700"
                >
                  {{ t('management.templatePaymentTab.paymentDrawer.funding.partnerRate') }}
                </span>
              </div>

              <div
                v-if="currentPayment"
                class="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3"
              >
                <p class="min-w-0 truncate text-xs text-slate-500">
                  {{ t('management.templatePaymentTab.paymentDrawer.currentPayment') }}
                  <span v-if="currentPayment.plan_name">· {{ currentPayment.plan_name }}</span>
                </p>
                <span
                  class="inline-flex flex-shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="statusBadgeClass(currentPayment.status)"
                >
                  {{ statusDisplay(currentPayment.status) }}
                </span>
              </div>
            </section>

            <!--
              How this activation gets funded.

              Only rendered for a partner who actually holds a credit for *this*
              plan — everyone else sees the transfer flow they always saw, with
              no extra decision to make. Credits are plan-scoped, so the answer
              can be yes for a Premium template and no for a Basic one; that is
              why the options are re-fetched per plan rather than per account.

              Shaped to match PaymentMethodPicker below it — same heading, same
              selected treatment — because it is the same kind of question asked
              twice, and a partner should not have to re-read the pattern. The
              section carries no border of its own: a bordered box holding two
              bordered rows makes the rows look nested rather than choosable.
            -->
            <section v-if="creditOption" class="space-y-3">
              <h3 class="text-sm sm:text-base font-semibold text-slate-800">
                {{ t('management.templatePaymentTab.paymentDrawer.funding.heading') }}
              </h3>

              <!--
                Real radios, visually hidden. The rows carry an icon rather than
                a dot, but the input still has to be a radio: it is what gives
                arrow-key movement between the two options and lets a screen
                reader say "1 of 2". The ring follows focus through
                `focus-within`, since the focused element is the hidden input.
              -->
              <div class="space-y-2">
                <label
                  class="flex w-full cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 focus-within:ring-2 focus-within:ring-sky-200"
                  :class="
                    payingWithCredit
                      ? 'border-[#1e90ff] bg-[#F1F8FF] ring-2 ring-[#D6EDFF]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  "
                >
                  <input
                    type="radio"
                    class="sr-only"
                    name="activation-funding"
                    :checked="payingWithCredit"
                    @change="selectFunding('credit')"
                  />
                  <span
                    class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
                    :class="
                      payingWithCredit
                        ? 'bg-white text-[#1e90ff] shadow-sm'
                        : 'bg-slate-100 text-slate-500'
                    "
                  >
                    <Zap class="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="flex items-baseline justify-between gap-2">
                      <span class="text-sm font-medium text-slate-900">
                        {{ t('management.templatePaymentTab.paymentDrawer.funding.credit.title') }}
                      </span>
                      <span class="flex-shrink-0 text-sm font-semibold text-slate-900 tabular-nums">
                        {{ creditCostLabel }}
                      </span>
                    </span>
                    <span class="mt-0.5 block text-xs text-slate-500">
                      {{
                        t(
                          'management.templatePaymentTab.paymentDrawer.funding.credit.remaining',
                          { n: creditOption.credits_remaining ?? 0 },
                          creditOption.credits_remaining ?? 0,
                        )
                      }}
                      <template v-if="creditOption.instant">
                        ·
                        {{
                          t('management.templatePaymentTab.paymentDrawer.funding.credit.instant')
                        }}
                      </template>
                    </span>
                    <span v-if="creditExpiryLabel" class="mt-0.5 block text-xs text-slate-400">
                      {{ creditExpiryLabel }}
                    </span>
                  </span>
                </label>

                <label
                  class="flex w-full cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 focus-within:ring-2 focus-within:ring-sky-200"
                  :class="
                    payingWithCredit
                      ? 'border-slate-200 bg-white hover:border-slate-300'
                      : 'border-[#1e90ff] bg-[#F1F8FF] ring-2 ring-[#D6EDFF]'
                  "
                >
                  <input
                    type="radio"
                    class="sr-only"
                    name="activation-funding"
                    :checked="!payingWithCredit"
                    @change="selectFunding('standard')"
                  />
                  <span
                    class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
                    :class="
                      payingWithCredit
                        ? 'bg-slate-100 text-slate-500'
                        : 'bg-white text-[#1e90ff] shadow-sm'
                    "
                  >
                    <Landmark class="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="flex items-baseline justify-between gap-2">
                      <span class="text-sm font-medium text-slate-900">
                        {{
                          t('management.templatePaymentTab.paymentDrawer.funding.standard.title')
                        }}
                      </span>
                      <span class="flex-shrink-0 text-sm font-semibold text-slate-900 tabular-nums">
                        ${{ standardAmount }}
                      </span>
                    </span>
                    <span class="mt-0.5 block text-xs text-slate-500">
                      {{ t('management.templatePaymentTab.paymentDrawer.funding.standard.hint') }}
                    </span>
                  </span>
                </label>
              </div>
            </section>

            <!--
              Paying with a credit skips everything below: the partner prepaid
              when they bought the pack, so there is no amount to transfer, no
              receipt to attach and no code to type. One field, one call — which
              leaves nothing between the choice and the button, so the drawer
              spends that space saying what the button is about to do.
            -->
            <p
              v-if="payingWithCredit"
              class="flex items-start gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600"
            >
              <Zap class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" aria-hidden="true" />
              <span>{{ creditOutcomeLabel }}</span>
            </p>

            <template v-else>
              <!-- Promo code. A real label rather than a bare placeholder: a
                   placeholder disappears exactly when it is needed. -->
              <section>
                <label
                  v-if="!appliedPromoCode"
                  for="activationPromoCode"
                  class="block text-sm font-medium text-slate-700"
                >
                  {{ t('management.templatePaymentTab.paymentDrawer.promoLabel') }}
                  <span class="font-normal text-slate-400">
                    ({{ t('management.templatePaymentTab.paymentDrawer.optional') }})
                  </span>
                </label>

                <div
                  v-if="appliedPromoCode"
                  class="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2"
                >
                  <div class="flex min-w-0 items-center gap-2">
                    <CheckCircle
                      class="h-4 w-4 flex-shrink-0 text-emerald-500"
                      aria-hidden="true"
                    />
                    <span class="truncate text-sm font-medium text-emerald-700">
                      {{ appliedPromoCode.code }}
                    </span>
                    <span class="flex-shrink-0 text-[0.6875rem] text-emerald-600">
                      ({{
                        appliedPromoCode.discount_type === 'percentage'
                          ? `${appliedPromoCode.discount_value}%`
                          : `$${appliedPromoCode.discount_value}`
                      }})
                    </span>
                  </div>
                  <button
                    type="button"
                    class="flex-shrink-0 rounded-md p-1 transition-colors hover:bg-emerald-100"
                    :title="t('management.templatePaymentTab.paymentDrawer.removePromoTitle')"
                    :aria-label="t('management.templatePaymentTab.paymentDrawer.removePromoTitle')"
                    @click="removePromoCode"
                  >
                    <X class="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  </button>
                </div>

                <div v-else class="mt-1.5 space-y-1">
                  <div class="flex gap-2">
                    <div class="relative min-w-0 flex-1">
                      <Tag
                        class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        id="activationPromoCode"
                        v-model="promoCodeInput"
                        type="text"
                        class="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm uppercase placeholder:normal-case focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        :placeholder="
                          t('management.templatePaymentTab.paymentDrawer.promoPlaceholder')
                        "
                        @keyup.enter="validatePromoCode"
                      />
                    </div>
                    <button
                      type="button"
                      :disabled="validatingPromoCode || !promoCodeInput.trim()"
                      class="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      @click="validatePromoCode"
                    >
                      <Loader v-if="validatingPromoCode" class="h-3.5 w-3.5 animate-spin" />
                      <span>
                        {{
                          validatingPromoCode
                            ? t('management.templatePaymentTab.paymentDrawer.applyingPromo')
                            : t('management.templatePaymentTab.paymentDrawer.applyPromo')
                        }}
                      </span>
                    </button>
                  </div>
                  <p v-if="promoCodeError" class="text-xs text-red-600">
                    {{ promoCodeError }}
                  </p>
                </div>
              </section>

              <PaymentMethodPicker
                v-model="selectedMethod"
                :methods="paymentMethods"
                :loading="loadingMethods"
                group-name="activation-payment-method"
              />

              <PaymentInstructions
                v-if="selectedMethod"
                ref="instructions"
                :method="selectedMethod"
                :amount="finalAmount"
                :proof="paymentForm.payment_proof"
                input-id="activationPaymentProof"
                @update:proof="paymentForm.payment_proof = $event"
                @error="handleProofError"
              />

              <!-- Nothing to instruct until a method is picked -->
              <div
                v-else
                class="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center"
              >
                <div
                  class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"
                >
                  <CreditCard class="h-6 w-6 text-slate-400" aria-hidden="true" />
                </div>
                <p class="text-sm font-medium text-slate-600">
                  {{ t('management.templatePaymentTab.paymentDrawer.noMethodSelected.title') }}
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  {{ t('management.templatePaymentTab.paymentDrawer.noMethodSelected.hint') }}
                </p>
              </div>

              <!-- Additional details, collapsed by default -->
              <div v-if="selectedMethod" class="overflow-hidden rounded-xl border border-slate-200">
                <button
                  type="button"
                  class="flex w-full items-center justify-between bg-slate-50/80 px-3 py-2.5 text-left transition-colors hover:bg-slate-100/80"
                  :aria-expanded="showAdditionalDetails"
                  @click="showAdditionalDetails = !showAdditionalDetails"
                >
                  <span class="text-xs font-medium text-slate-700 sm:text-sm">
                    {{ t('management.templatePaymentTab.paymentDrawer.additionalDetails') }}
                    <span class="text-slate-400">
                      ({{ t('management.templatePaymentTab.paymentDrawer.optional') }})
                    </span>
                  </span>
                  <ChevronDown
                    class="h-4 w-4 text-slate-500 transition-transform duration-200"
                    :class="{ 'rotate-180': showAdditionalDetails }"
                    aria-hidden="true"
                  />
                </button>
                <Transition name="collapse">
                  <div v-if="showAdditionalDetails" class="grid grid-rows-[1fr]">
                    <div class="min-h-0 overflow-hidden">
                      <div class="space-y-3 border-t border-slate-200 bg-white px-3 py-3">
                        <div class="space-y-1.5">
                          <label
                            for="transactionRef"
                            class="block text-sm font-medium text-slate-700"
                          >
                            {{ t('management.templatePaymentTab.paymentDrawer.transactionRef') }}
                          </label>
                          <input
                            id="transactionRef"
                            v-model="paymentForm.transaction_reference"
                            type="text"
                            class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            :placeholder="
                              t(
                                'management.templatePaymentTab.paymentDrawer.transactionRefPlaceholder',
                              )
                            "
                          />
                        </div>

                        <div class="space-y-1.5">
                          <label
                            for="paymentNotes"
                            class="block text-sm font-medium text-slate-700"
                          >
                            {{ t('management.templatePaymentTab.paymentDrawer.notes') }}
                          </label>
                          <textarea
                            id="paymentNotes"
                            v-model="paymentForm.user_notes"
                            rows="2"
                            class="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            :placeholder="
                              t('management.templatePaymentTab.paymentDrawer.notesPlaceholder')
                            "
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </template>

            <!-- Error Display -->
            <div
              v-if="error"
              class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 sm:text-sm"
            >
              {{ error }}
            </div>
          </div>
        </div>

        <!-- Footer with Submit Button -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <button
            @click="submitPayment"
            :disabled="submittingPayment || !isFormValid"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1e90ff] to-[#2ecc71] hover:from-[#1873cc] hover:to-[#27ae60] text-white text-sm font-semibold rounded-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-[#1e90ff] disabled:hover:to-[#2ecc71]"
          >
            <Loader v-if="submittingPayment" class="w-4 h-4 animate-spin" />
            <Zap v-else-if="payingWithCredit" class="w-4 h-4" />
            <CheckCircle v-else class="w-4 h-4" />
            <span>{{ submitLabel }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * The template activation checkout: pick a method, transfer, upload the
 * receipt — or, for a partner holding a credit for this plan, one click.
 *
 * Extracted verbatim out of EventTemplatePaymentTab.vue so the Design Studio
 * can open the *same* checkout inline from its activation pill — the buy moment
 * belongs where the organizer is admiring the live preview, not one tab away.
 * Both mount this component; neither owns the flow.
 *
 * The funding question is answered by the server, not inferred here:
 * `/activation-options/` is authenticated but not partner-gated, so it is safe
 * to call on every open and a normal user simply gets `credit: null` and never
 * sees a choice. Amounts always come back from that call (or from promo-code
 * validation) — this component never computes a total, because the backend
 * re-validates any `amount` we send and rejects a figure it disagrees with.
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  CreditCard,
  Landmark,
  Loader,
  Tag,
  X,
  Zap,
} from 'lucide-vue-next'
import { apiService, partnerCreditsService } from '../../services/api'
import type { ActivationOptions } from '../../services/api'
import { useNotifications } from '../../composables/useNotifications'
import { usePlatformPaymentMethods } from '../../composables/usePlatformPaymentMethods'
import PaymentMethodPicker from '../payment/PaymentMethodPicker.vue'
import PaymentInstructions from '../payment/PaymentInstructions.vue'
import { validatePaymentProofFile } from '../payment/paymentProof'
import type { Payment, PaymentMethod, PaymentFormData, PaymentStatus } from '../../types/payment'

interface PricingPlan {
  id: number
  name: string
  price: string
}

interface PromoCodeValidation {
  valid: boolean
  promo_code?: {
    id: string
    code: string
    description: string
    discount_type: 'percentage' | 'fixed'
    discount_value: string
    max_discount_amount: string | null
    minimum_purchase_amount: string
    valid_until: string | null
  }
  calculation?: {
    original_amount: string
    discount_amount: string
    final_amount: string
  }
  error?: string
}

interface Props {
  open: boolean
  eventId: string
  /** The template's pricing plan — what's actually being purchased. */
  templatePackage?: PricingPlan | null
  /** Selected template id, sent alongside the payment so the backend can link them. */
  templateId?: number | string | null
  templateName?: string | null
  /** An already-open (pending/confirmed) payment for this template, if any. */
  currentPayment?: Payment | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  /** A payment row was created — the parent should refresh its payment list. */
  submitted: []
}>()

const { t } = useI18n()
const { success: showSuccess, error: showError } = useNotifications()

const { paymentMethods, loadingMethods, ensurePaymentMethods } = usePlatformPaymentMethods()

const selectedMethod = ref<PaymentMethod | null>(null)
const submittingPayment = ref(false)
const error = ref<string | null>(null)
const showAdditionalDetails = ref(false)
const instructions = ref<InstanceType<typeof PaymentInstructions> | null>(null)

const paymentForm = ref<PaymentFormData>({
  transaction_reference: '',
  user_notes: '',
  payment_proof: null,
})

// Promo code state
const promoCodeInput = ref('')
const validatingPromoCode = ref(false)
const appliedPromoCode = ref<PromoCodeValidation['promo_code'] | null>(null)
const promoDiscount = ref<{ original: string; discount: string; final: string } | null>(null)
const promoCodeError = ref<string | null>(null)

// Funding options
const activationOptions = ref<ActivationOptions | null>(null)
const fundingChoice = ref<'standard' | 'credit'>('standard')

const creditOption = computed(() => activationOptions.value?.credit ?? null)
const partnerRate = computed(() => activationOptions.value?.partner_rate ?? null)
const payingWithCredit = computed(() => fundingChoice.value === 'credit' && !!creditOption.value)

/**
 * What the transfer path costs, in order of authority: a validated promo code,
 * then the partner's own pay-as-you-go rate, then whatever the server quoted,
 * and only as a last resort the plan's list price (when `/activation-options/`
 * is unavailable — an older backend, or an offline moment).
 */
const standardAmount = computed(
  () =>
    promoDiscount.value?.final ??
    partnerRate.value?.amount_due ??
    activationOptions.value?.standard.amount_due ??
    props.templatePackage?.price ??
    '0.00',
)

const finalAmount = computed(() =>
  payingWithCredit.value ? (creditOption.value?.amount_due ?? '0.00') : standardAmount.value,
)

/** The list price, shown struck through only when something actually reduced it. */
const strikethroughPrice = computed(() => {
  if (promoDiscount.value) return promoDiscount.value.original
  const listPrice = activationOptions.value?.pricing_plan.price ?? props.templatePackage?.price
  if (partnerRate.value && listPrice && listPrice !== partnerRate.value.amount_due) {
    return listPrice
  }
  return null
})

/**
 * What the credit path costs, in its own unit.
 *
 * A credit is not a discount, so `$0.00` next to the transfer price reads as one
 * — the partner already paid, wholesale, when they bought the pack. Say what is
 * actually spent. A partially-covered credit still leaves money owing, so the
 * server's `amount_due` decides which of the two sentences this is.
 */
const creditCostLabel = computed(() => {
  const due = Number(creditOption.value?.amount_due ?? 0)
  return Number.isFinite(due) && due > 0
    ? t('management.templatePaymentTab.paymentDrawer.funding.credit.costPlus', {
        amount: creditOption.value?.amount_due ?? '0.00',
      })
    : t('management.templatePaymentTab.paymentDrawer.funding.credit.cost')
})

/** The figure in the summary block: the chosen path's price, in its own unit. */
const headlineAmount = computed(() =>
  payingWithCredit.value ? creditCostLabel.value : `${standardAmount.value}`,
)

/**
 * What pressing the button does, spelled out — the credit path has no receipt,
 * no method and no code, so without this the drawer asks for a decision and then
 * says nothing at all about its consequence.
 */
const creditOutcomeLabel = computed(() => {
  const remaining = creditOption.value?.credits_remaining
  if (typeof remaining !== 'number') {
    return t('management.templatePaymentTab.paymentDrawer.funding.credit.outcomeSimple')
  }
  const left = Math.max(0, remaining - 1)
  return t('management.templatePaymentTab.paymentDrawer.funding.credit.outcome', { n: left })
})

const creditExpiryLabel = computed(() => {
  const expiresAt = creditOption.value?.expires_at
  if (!expiresAt) return null
  const date = new Date(expiresAt)
  if (Number.isNaN(date.getTime())) return null
  return t('management.templatePaymentTab.paymentDrawer.funding.credit.expires', {
    date: date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
  })
})

const isFormValid = computed(() => {
  if (!props.templatePackage) return false
  return payingWithCredit.value || Boolean(selectedMethod.value)
})

const submitLabel = computed(() => {
  if (submittingPayment.value) {
    return payingWithCredit.value
      ? t('management.templatePaymentTab.paymentDrawer.activating')
      : t('management.templatePaymentTab.paymentDrawer.submitting')
  }
  return payingWithCredit.value
    ? t('management.templatePaymentTab.paymentDrawer.activateBtn')
    : t('management.templatePaymentTab.paymentDrawer.submitBtn')
})

const sanitizeInput = (input: string): string =>
  input.trim().replace(/[<>"'&]/g, (match) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
    }
    return entities[match] || match
  })

/** Kept identical to PaymentHistoryList's badges — same statuses, same recipe. */
const statusBadgeClass = (status?: PaymentStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
    case 'confirmed':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    case 'failed':
      return 'bg-red-50 text-red-700 ring-1 ring-red-200'
    case 'refunded':
      return 'bg-purple-50 text-purple-700 ring-1 ring-purple-200'
    default:
      return 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
  }
}

const statusDisplay = (status?: PaymentStatus) =>
  status
    ? t(`management.paymentHistoryList.status.${status}`)
    : t('management.paymentHistoryList.status.unknown')

/**
 * Ask the server how this plan can be funded.
 *
 * A failure here is deliberately silent: the endpoint is new, and an older
 * backend that 404s it must still leave the transfer checkout fully working
 * rather than showing the organizer an error about a feature they don't have.
 */
const loadActivationOptions = async (): Promise<void> => {
  const plan = props.templatePackage
  if (!plan) return

  try {
    const response = await partnerCreditsService.getActivationOptions(plan.id)
    if (response.success && response.data) {
      activationOptions.value = response.data
      // A credit is the cheapest and only instant path, so it leads when one
      // exists — but it stays a choice, since a partner may want to keep a
      // credit back and pay for this one event.
      fundingChoice.value = response.data.credit ? 'credit' : 'standard'
    } else {
      activationOptions.value = null
      fundingChoice.value = 'standard'
    }
  } catch (err) {
    console.error('Error loading activation options:', err)
    activationOptions.value = null
    fundingChoice.value = 'standard'
  }
}

/** A credit and a promo code are mutually exclusive server-side (400 if both). */
const selectFunding = (choice: 'standard' | 'credit'): void => {
  fundingChoice.value = choice
  error.value = null
  if (choice === 'credit') removePromoCode()
}

const handleProofError = (message: string): void => {
  error.value = message
  showError(t('management.templatePaymentTab.paymentDrawer.errorTitle'), message)
}

const validatePromoCode = async (): Promise<void> => {
  const code = promoCodeInput.value.trim().toUpperCase()
  if (!code) {
    promoCodeError.value = t('management.templatePaymentTab.paymentDrawer.promoRequired')
    return
  }
  if (!props.templatePackage) {
    promoCodeError.value = t('management.templatePaymentTab.paymentDrawer.promoNoTemplate')
    return
  }

  validatingPromoCode.value = true
  promoCodeError.value = null

  try {
    const response = await apiService.post<PromoCodeValidation>(
      '/api/payment/promo-codes/validate/',
      {
        code,
        pricing_plan_id: props.templatePackage.id,
        amount: props.templatePackage.price,
      },
    )

    if (response.success && response.data?.valid) {
      appliedPromoCode.value = response.data.promo_code || null
      if (response.data.calculation) {
        promoDiscount.value = {
          original: response.data.calculation.original_amount,
          discount: response.data.calculation.discount_amount,
          final: response.data.calculation.final_amount,
        }
      }
      promoCodeInput.value = ''
      showSuccess(
        t('management.templatePaymentTab.paymentDrawer.promoAppliedTitle'),
        t('management.templatePaymentTab.paymentDrawer.promoAppliedMessage', { code }),
      )
    } else {
      // These strings are written for end users by the backend — render verbatim.
      promoCodeError.value =
        response.data?.error ||
        response.message ||
        t('management.templatePaymentTab.paymentDrawer.promoInvalid')
    }
  } catch (err: unknown) {
    console.error('Error validating promo code:', err)
    promoCodeError.value =
      err instanceof Error
        ? err.message
        : t('management.templatePaymentTab.paymentDrawer.promoFailed')
  } finally {
    validatingPromoCode.value = false
  }
}

const removePromoCode = (): void => {
  appliedPromoCode.value = null
  promoDiscount.value = null
  promoCodeError.value = null
  promoCodeInput.value = ''
}

const validateTransactionReference = (reference: string): string | null => {
  const sanitized = sanitizeInput(reference)
  if (!sanitized || sanitized.length < 3) {
    return t('management.templatePaymentTab.paymentDrawer.refTooShort')
  }
  if (sanitized.length > 100) {
    return t('management.templatePaymentTab.paymentDrawer.refTooLong')
  }
  if (!/^[a-zA-Z0-9\-_\s]+$/.test(sanitized)) {
    return t('management.templatePaymentTab.paymentDrawer.refInvalidChars')
  }
  return null
}

const resetForm = (): void => {
  paymentForm.value = { transaction_reference: '', user_notes: '', payment_proof: null }
  instructions.value?.reset()
  error.value = null
  removePromoCode()
  // Dropped rather than kept: the organizer may change template between opens,
  // and a credit for the previous plan is not a credit for this one. Showing the
  // stale option for the frame before the refetch lands would offer a partner a
  // credit they cannot actually spend here.
  activationOptions.value = null
  fundingChoice.value = 'standard'
}

/**
 * Paying with a credit is the whole payload: no amount, no method, no code, no
 * proof. The partner prepaid when they bought the pack, so there is nothing to
 * verify and the response comes back already confirmed.
 */
const activateWithCredit = async (): Promise<void> => {
  const payload: Record<string, unknown> = {
    event: sanitizeInput(props.eventId),
    pricing_plan: props.templatePackage!.id,
    pay_with_credit: true,
  }
  if (props.templateId) payload.event_template = props.templateId

  const response = await apiService.post<Payment | { payment: Payment }>(
    '/api/payment/payments/',
    payload,
  )

  if (!response.success) {
    throw new Error(
      response.message || t('management.templatePaymentTab.paymentDrawer.submitFailed'),
    )
  }

  // A fully-covered payment confirms on the spot; a partially-covered one still
  // needs proof and an admin, so the success message follows the status rather
  // than assuming the happy path.
  const payment = unwrapPayment(response.data)

  if (payment?.status === 'confirmed') {
    showSuccess(
      t('management.templatePaymentTab.paymentDrawer.creditSuccessTitle'),
      t('management.templatePaymentTab.paymentDrawer.creditSuccessMessage'),
    )
  } else {
    showSuccess(
      t('management.templatePaymentTab.paymentDrawer.submitSuccessTitle'),
      t('management.templatePaymentTab.paymentDrawer.submitSuccessMessage'),
    )
  }
}

const submitByTransfer = async (): Promise<void> => {
  const templatePackage = props.templatePackage!
  const formData = new FormData()

  formData.append('event', sanitizeInput(props.eventId))
  formData.append('pricing_plan', templatePackage.id.toString())
  formData.append('payment_method', selectedMethod.value!.id.toString())

  // `amount` is optional and re-validated server-side, so it has to be the same
  // figure the drawer just showed — sending the list price while displaying a
  // partner rate would be rejected rather than honoured.
  formData.append('amount', standardAmount.value)
  formData.append(
    'original_price',
    promoDiscount.value?.original ??
      activationOptions.value?.pricing_plan.price ??
      templatePackage.price,
  )
  if (promoDiscount.value) {
    formData.append('promo_discount', promoDiscount.value.discount)
  }

  // Backend expects the code itself, not the promo code's UUID
  if (appliedPromoCode.value?.code) {
    formData.append('promo_code_string', appliedPromoCode.value.code)
  }

  if (paymentForm.value.transaction_reference.trim()) {
    formData.append('transaction_reference', sanitizeInput(paymentForm.value.transaction_reference))
  }

  if (paymentForm.value.user_notes.trim()) {
    formData.append('user_notes', sanitizeInput(paymentForm.value.user_notes))
  }

  if (paymentForm.value.payment_proof) {
    formData.append('payment_proof', paymentForm.value.payment_proof)
  }

  if (props.templateId) {
    formData.append('event_template', String(props.templateId))
  }

  const response = await apiService.postFormData<Payment | { payment: Payment }>(
    '/api/payment/payments/',
    formData,
  )

  if (!response.success) {
    throw new Error(
      response.message || t('management.templatePaymentTab.paymentDrawer.submitFailed'),
    )
  }

  const payment = unwrapPayment(response.data)

  if (payment?.status === 'confirmed') {
    showSuccess(
      t('management.templatePaymentTab.paymentDrawer.creditSuccessTitle'),
      t('management.templatePaymentTab.paymentDrawer.creditSuccessMessage'),
    )
  } else {
    showSuccess(
      t('management.templatePaymentTab.paymentDrawer.submitSuccessTitle'),
      t('management.templatePaymentTab.paymentDrawer.submitSuccessMessage'),
    )
  }
}

/** The create endpoint answers with the payment either bare or under `payment`. */
const unwrapPayment = (data: Payment | { payment: Payment } | undefined): Payment | null => {
  if (!data) return null
  if ('payment' in data && data.payment) return data.payment
  return data as Payment
}

const submitPayment = async (): Promise<void> => {
  if (submittingPayment.value) return

  if (!isFormValid.value || !props.templatePackage) {
    error.value = t('management.templatePaymentTab.paymentDrawer.selectMethodError')
    showError(
      t('management.templatePaymentTab.paymentDrawer.errorTitle'),
      t('management.templatePaymentTab.paymentDrawer.selectMethodError'),
    )
    return
  }

  if (!payingWithCredit.value) {
    if (paymentForm.value.transaction_reference.trim()) {
      const transactionRefError = validateTransactionReference(
        paymentForm.value.transaction_reference,
      )
      if (transactionRefError) {
        error.value = transactionRefError
        showError(t('management.templatePaymentTab.paymentDrawer.errorTitle'), transactionRefError)
        return
      }
    }

    if (paymentForm.value.payment_proof) {
      const fileError = validatePaymentProofFile(paymentForm.value.payment_proof, t)
      if (fileError) {
        error.value = fileError
        showError(t('management.templatePaymentTab.paymentDrawer.errorTitle'), fileError)
        return
      }
    }
  }

  submittingPayment.value = true
  error.value = null

  try {
    if (payingWithCredit.value) {
      await activateWithCredit()
    } else {
      await submitByTransfer()
    }

    resetForm()
    emit('submitted')
    emit('close')
  } catch (err) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : t('management.templatePaymentTab.paymentDrawer.submitFailed')
    console.error('Error submitting payment:', err)
    error.value = errorMessage
    showError(t('management.templatePaymentTab.paymentDrawer.submitFailedTitle'), errorMessage)
    // The credit may have been spent elsewhere since the drawer opened; refetch
    // so the options on screen match what the server will accept next time.
    if (payingWithCredit.value) await loadActivationOptions()
  } finally {
    submittingPayment.value = false
  }
}

// Methods and funding options are fetched on first open rather than on mount —
// the drawer is mounted (closed) by both the studio and the activation tab, and
// neither should pay for a request the organizer may never need.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      ensurePaymentMethods()
      loadActivationOptions()
    } else {
      resetForm()
    }
  },
)

// A different template can mean a different plan, and credits are plan-scoped —
// so the funding options have to be re-asked, not carried over.
watch(
  () => props.templatePackage?.id,
  () => {
    if (props.open) loadActivationOptions()
  },
)

// Prevent body scroll while the drawer is open, compensating for the
// scrollbar's own width so the page behind doesn't visibly shift.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  },
)
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide from right on desktop, from bottom on mobile */
.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
  }
}

/* Expand/collapse via grid rows — never max-height (§15). */
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
  .fade-enter-active,
  .fade-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active,
  .collapse-enter-active,
  .collapse-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>
