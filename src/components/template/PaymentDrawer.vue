<template>
  <CheckoutDrawer
    :open="open"
    :title="t('management.templatePaymentTab.paymentDrawer.title')"
    :eyebrow="templateName"
    @close="emit('close')"
  >
    <!--
      What is being activated and what it costs on the path currently chosen.
      It is also the only place the credit path ever names the plan: everything
      below it disappears when a credit is spent.
    -->
    <CheckoutSummary
      :title="planName"
      :amount="headlineAmount"
      :strikethrough="payingWithCredit ? null : strikethroughPrice"
    >
      <!-- Why the figure is not the list price. A pay-as-you-go partner code
           discounts the normal path rather than zeroing it, so the rate is
           named where the price is. An applied promo says so in its own row
           below instead, and doesn't need a second chip here. -->
      <template v-if="showPartnerRateBadge" #badges>
        <span
          class="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[0.6875rem] font-medium text-sky-700"
        >
          {{ t('management.templatePaymentTab.paymentDrawer.funding.partnerRate') }}
        </span>
      </template>

      <template v-if="showSummaryDetails" #details>
        <div class="space-y-2">
          <!--
            The promo code sits with the price it changes rather than as a
            section of its own mid-flow: it is optional, most organizers never
            use it, and asking for it between "how do you want to pay" and
            "where do you want to send it" interrupts the one decision the
            drawer is actually for.
          -->
          <template v-if="!payingWithCredit">
            <div v-if="appliedPromoCode" class="flex items-center gap-2">
              <CheckCircle class="h-4 w-4 flex-shrink-0 text-emerald-600" aria-hidden="true" />
              <span class="min-w-0 truncate text-sm font-medium text-emerald-700">
                {{ appliedPromoCode.code }}
              </span>
              <span class="flex-shrink-0 text-xs text-emerald-600 tabular-nums">
                {{ promoValueLabel }}
              </span>
              <button
                type="button"
                class="-my-1 ml-auto grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg text-emerald-600 transition-colors duration-200 hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                :title="t('management.templatePaymentTab.paymentDrawer.removePromoTitle')"
                :aria-label="t('management.templatePaymentTab.paymentDrawer.removePromoTitle')"
                @click="removePromoCode"
              >
                <X class="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div v-else>
              <button
                type="button"
                class="flex min-h-[40px] w-full items-center gap-2 rounded-lg text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                :aria-expanded="showPromoField"
                aria-controls="activationPromoField"
                @click="showPromoField = !showPromoField"
              >
                <Tag class="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                <span class="flex-1 text-sm font-medium text-slate-600">
                  {{ t('management.templatePaymentTab.paymentDrawer.promoPrompt') }}
                </span>
                <ChevronDown
                  class="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200"
                  :class="{ 'rotate-180': showPromoField }"
                  aria-hidden="true"
                />
              </button>

              <Transition name="collapse">
                <div v-if="showPromoField" id="activationPromoField" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <div class="space-y-1.5 pt-2">
                      <div class="flex gap-2">
                        <!-- The disclosure row above is this field's visible
                             label, so the bound one only has to exist. -->
                        <label for="activationPromoCode" class="sr-only">
                          {{ t('management.templatePaymentTab.paymentDrawer.promoLabel') }}
                        </label>
                        <input
                          id="activationPromoCode"
                          v-model="promoCodeInput"
                          type="text"
                          autocapitalize="characters"
                          autocomplete="off"
                          spellcheck="false"
                          class="min-h-[44px] w-full min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm uppercase placeholder:normal-case focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                          :placeholder="
                            t('management.templatePaymentTab.paymentDrawer.promoPlaceholder')
                          "
                          @keyup.enter="validatePromoCode"
                        />
                        <button
                          type="button"
                          :disabled="validatingPromoCode || !promoCodeInput.trim()"
                          class="inline-flex min-h-[44px] flex-shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                          @click="validatePromoCode"
                        >
                          <Loader
                            v-if="validatingPromoCode"
                            class="h-3.5 w-3.5 animate-spin"
                            aria-hidden="true"
                          />
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
                  </div>
                </div>
              </Transition>
            </div>
          </template>

          <div
            v-if="currentPayment"
            class="flex min-h-[32px] items-center justify-between gap-3"
            :class="!payingWithCredit ? 'border-t border-slate-200/80 pt-2' : ''"
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
        </div>
      </template>
    </CheckoutSummary>

    <!--
      How this activation gets funded.

      Only rendered for a partner who actually holds a credit for *this* plan —
      everyone else sees the transfer flow they always saw, with no extra
      decision to make. Credits are plan-scoped, so the answer can be yes for a
      Premium template and no for a Basic one; that is why the options are
      re-fetched per plan rather than per account.

      Deliberately the same grouped-list shape as the method picker below it:
      it is the same kind of question asked twice, and a partner should not
      have to re-read the pattern to answer it.
    -->
    <section v-if="creditOption" class="space-y-2.5">
      <h3 class="text-sm font-semibold text-slate-900">
        {{ t('management.templatePaymentTab.paymentDrawer.funding.heading') }}
      </h3>

      <!--
        Real radios, visually hidden. The rows carry an icon rather than a dot,
        but the input still has to be a radio: it is what gives arrow-key
        movement between the two options and lets a screen reader say "1 of 2".
        The ring follows focus through `focus-within`, since the focused
        element is the hidden input.
      -->
      <div
        class="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white"
      >
        <label
          class="flex min-h-[56px] w-full cursor-pointer items-start gap-3 px-3.5 py-3 transition-colors duration-200 focus-within:ring-2 focus-within:ring-inset focus-within:ring-sky-200"
          :class="payingWithCredit ? 'bg-[#F1F8FF]' : 'hover:bg-slate-50 active:bg-slate-100'"
        >
          <input
            type="radio"
            class="sr-only"
            name="activation-funding"
            :checked="payingWithCredit"
            @change="selectFunding('credit')"
          />
          <span
            class="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg transition-colors duration-200"
            :class="
              payingWithCredit ? 'bg-white text-[#1e90ff] shadow-sm' : 'bg-slate-100 text-slate-500'
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
            <span class="mt-0.5 block text-xs leading-relaxed text-slate-500">
              {{
                t(
                  'management.templatePaymentTab.paymentDrawer.funding.credit.remaining',
                  { n: creditOption.credits_remaining ?? 0 },
                  creditOption.credits_remaining ?? 0,
                )
              }}
              <template v-if="creditOption.instant">
                ·
                {{ t('management.templatePaymentTab.paymentDrawer.funding.credit.instant') }}
              </template>
            </span>
            <span v-if="creditExpiryLabel" class="mt-0.5 block text-xs text-slate-400">
              {{ creditExpiryLabel }}
            </span>
          </span>
        </label>

        <label
          class="flex min-h-[56px] w-full cursor-pointer items-start gap-3 px-3.5 py-3 transition-colors duration-200 focus-within:ring-2 focus-within:ring-inset focus-within:ring-sky-200"
          :class="payingWithCredit ? 'hover:bg-slate-50 active:bg-slate-100' : 'bg-[#F1F8FF]'"
        >
          <input
            type="radio"
            class="sr-only"
            name="activation-funding"
            :checked="!payingWithCredit"
            @change="selectFunding('standard')"
          />
          <span
            class="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg transition-colors duration-200"
            :class="
              payingWithCredit ? 'bg-slate-100 text-slate-500' : 'bg-white text-[#1e90ff] shadow-sm'
            "
          >
            <Landmark class="h-4 w-4" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-baseline justify-between gap-2">
              <span class="text-sm font-medium text-slate-900">
                {{ t('management.templatePaymentTab.paymentDrawer.funding.standard.title') }}
              </span>
              <span class="flex-shrink-0 text-sm font-semibold text-slate-900 tabular-nums">
                ${{ standardAmount }}
              </span>
            </span>
            <span class="mt-0.5 block text-xs leading-relaxed text-slate-500">
              {{ t('management.templatePaymentTab.paymentDrawer.funding.standard.hint') }}
            </span>
          </span>
        </label>
      </div>
    </section>

    <!--
      Paying with a credit skips everything below: the partner prepaid when
      they bought the pack, so there is no amount to transfer, no receipt to
      attach and no code to type. One field, one call — which leaves nothing
      between the choice and the button, so the drawer spends that space
      saying what the button is about to do.
    -->
    <p
      v-if="payingWithCredit"
      class="flex items-start gap-2.5 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600"
    >
      <Zap class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" aria-hidden="true" />
      <span>{{ creditOutcomeLabel }}</span>
    </p>

    <!--
      The transfer path, shown whole from the first frame. Choosing a method
      expands that row's own details in place — nothing further down the
      drawer appears, disappears or moves, so the organizer can see the size
      of the task before starting it.
    -->
    <template v-else>
      <PaymentMethodPicker
        v-model="selectedMethod"
        :methods="paymentMethods"
        :loading="loadingMethods"
        :amount="standardAmount"
        group-name="activation-payment-method"
        @error="handleProofError"
      />

      <PaymentProofField
        ref="proofField"
        :proof="paymentForm.payment_proof"
        input-id="activationPaymentProof"
        @update:proof="paymentForm.payment_proof = $event"
        @error="handleProofError"
      />

      <PaymentDetailsDisclosure
        ref="detailsDisclosure"
        id-prefix="activation"
        :reference="paymentForm.transaction_reference"
        :notes="paymentForm.user_notes"
        :notes-placeholder="t('management.templatePaymentTab.paymentDrawer.notesPlaceholder')"
        @update:reference="paymentForm.transaction_reference = $event"
        @update:notes="paymentForm.user_notes = $event"
      />
    </template>

    <template #footer>
      <p
        v-if="error"
        class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
        role="alert"
      >
        {{ error }}
      </p>
      <!-- Stays enabled-looking while confirming: the drawer is about to close
           on its own, and greying the button out at the moment it reports
           success reads as the action having been revoked. -->
      <button
        type="button"
        :disabled="submittingPayment || confirmed || !isFormValid"
        class="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:hover:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2"
        :class="confirmed ? 'disabled:opacity-100 disabled:hover:opacity-100' : 'disabled:opacity-50'"
        @click="submitPayment"
      >
        <Check v-if="confirmed" class="h-4 w-4" aria-hidden="true" />
        <Loader v-else-if="submittingPayment" class="h-4 w-4 animate-spin" aria-hidden="true" />
        <Zap v-else-if="payingWithCredit" class="h-4 w-4" aria-hidden="true" />
        <CheckCircle v-else class="h-4 w-4" aria-hidden="true" />
        <span>{{ submitLabel }}</span>
      </button>
    </template>
  </CheckoutDrawer>
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
 *
 * Everything that is not activation-specific — the panel, the header, the
 * method list, the receipt field, the optional fields — is shared with the
 * partner credit-pack order under `components/payment/`, so the two purchases
 * a partner makes read as one product rather than two unrelated forms.
 */
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, CheckCircle, ChevronDown, Landmark, Loader, Tag, X, Zap } from 'lucide-vue-next'
import { apiService, partnerCreditsService } from '../../services/api'
import type { ActivationOptions } from '../../services/api'
import { useNotifications } from '../../composables/useNotifications'
import { useActionConfirmation } from '../../composables/useActionConfirmation'
import { usePlatformPaymentMethods } from '../../composables/usePlatformPaymentMethods'
import CheckoutDrawer from '../payment/CheckoutDrawer.vue'
import CheckoutSummary from '../payment/CheckoutSummary.vue'
import PaymentMethodPicker from '../payment/PaymentMethodPicker.vue'
import PaymentProofField from '../payment/PaymentProofField.vue'
import PaymentDetailsDisclosure from '../payment/PaymentDetailsDisclosure.vue'
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
const { error: showError } = useNotifications()

const { paymentMethods, loadingMethods, ensurePaymentMethods } = usePlatformPaymentMethods()

const selectedMethod = ref<PaymentMethod | null>(null)
const submittingPayment = ref(false)
const error = ref<string | null>(null)
const proofField = ref<InstanceType<typeof PaymentProofField> | null>(null)
const detailsDisclosure = ref<InstanceType<typeof PaymentDetailsDisclosure> | null>(null)

const paymentForm = ref<PaymentFormData>({
  transaction_reference: '',
  user_notes: '',
  payment_proof: null,
})

// Promo code state
const showPromoField = ref(false)
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

const planName = computed(
  () => props.templatePackage?.name || t('management.templatePaymentTab.paymentDrawer.total'),
)

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
  payingWithCredit.value ? creditCostLabel.value : `$${standardAmount.value}`,
)

const showPartnerRateBadge = computed(
  () => !payingWithCredit.value && !!partnerRate.value && !promoDiscount.value,
)

const showSummaryDetails = computed(() => !payingWithCredit.value || !!props.currentPayment)

/** What the applied code took off, in whichever unit the server expressed it. */
const promoValueLabel = computed(() => {
  if (promoDiscount.value) return `-$${promoDiscount.value.discount}`
  const code = appliedPromoCode.value
  if (!code) return ''
  return code.discount_type === 'percentage'
    ? `-${code.discount_value}%`
    : `-$${code.discount_value}`
})

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

/**
 * The outcome the button reports while the drawer holds open, before closing.
 *
 * A fully-covered payment activates on the spot; a partially-covered one is
 * only lodged and still needs an admin — so this is the one thing about the
 * result that genuinely differs, and the button says which. It used to be a
 * toast fired as the drawer closed; the drawer now stays up long enough to say
 * it itself, and the activation card behind it carries the status from there.
 */
const submittedOutcome = ref<'activated' | 'pending' | null>(null)
const { confirmed, confirm, reset: resetConfirmation } = useActionConfirmation()

const submitLabel = computed(() => {
  if (confirmed.value) {
    return submittedOutcome.value === 'activated'
      ? t('management.templatePaymentTab.paymentDrawer.creditSuccessTitle')
      : t('management.templatePaymentTab.paymentDrawer.submitSuccessTitle')
  }
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
      showPromoField.value = false
      // No toast: the field collapses into a chip carrying the code, and the
      // summary right beside it redraws with the discount. The toast said the
      // same code back to the user while both were already on screen.
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
  showPromoField.value = false
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
  proofField.value?.reset()
  detailsDisclosure.value?.collapse()
  selectedMethod.value = null
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
  // needs proof and an admin, so the outcome follows the status rather than
  // assuming the happy path.
  const payment = unwrapPayment(response.data)
  submittedOutcome.value = payment?.status === 'confirmed' ? 'activated' : 'pending'
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
  submittedOutcome.value = payment?.status === 'confirmed' ? 'activated' : 'pending'
}

/** The create endpoint answers with the payment either bare or under `payment`. */
const unwrapPayment = (data: Payment | { payment: Payment } | undefined): Payment | null => {
  if (!data) return null
  if ('payment' in data && data.payment) return data.payment
  return data as Payment
}

const submitPayment = async (): Promise<void> => {
  if (submittingPayment.value || confirmed.value) return

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

    // Report the outcome on the button, then close. `submitted` fires with the
    // close so the activation card behind repaints as the drawer clears, rather
    // than under it while the confirmation is still being read.
    confirm(() => {
      resetForm()
      submittedOutcome.value = null
      emit('submitted')
      emit('close')
    })
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
      // Dismissed mid-confirmation (backdrop, Esc): drop the held state without
      // running its follow-up, so reopening doesn't start on a stale tick.
      resetConfirmation()
      submittedOutcome.value = null
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
</script>

<style scoped>
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
  .collapse-enter-active,
  .collapse-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>
