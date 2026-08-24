<template>
  <CheckoutDrawer :open="open" :title="headerTitle" :eyebrow="subjectName" @close="emit('close')">
    <!--
      The order landed. Which screen this is depends on the status the server
      sent back, never on the price: a free pack without `requires_approval` is
      confirmed in the same request, and telling a partner to wait for a review
      that already happened would send them looking for an email that never
      arrives.
    -->
    <template v-if="result">
      <div v-if="issuedCode" class="text-center">
        <div
          class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20"
        >
          <Sparkles class="h-7 w-7 text-[#2ecc71]" aria-hidden="true" />
        </div>
        <h3 class="mt-3 text-lg font-semibold text-slate-900">
          {{
            t(
              'settings.credits.drawer.issued.title',
              { n: result.credit_count },
              result.credit_count,
            )
          }}
        </h3>
        <p class="mt-1 text-sm text-slate-600">
          {{
            t('settings.credits.drawer.issued.subtitle', {
              plan: issuedCode.applicable_plan_names?.[0] ?? result.pack_name,
            })
          }}
        </p>

        <div class="mt-4 rounded-2xl bg-slate-50 p-4">
          <p class="text-xs text-slate-500">
            {{ t('settings.credits.drawer.issued.codeLabel') }}
          </p>
          <div class="mt-1.5 flex items-center justify-center gap-2">
            <code class="font-mono text-base font-semibold tracking-wide text-slate-900">
              {{ issuedCode.code }}
            </code>
            <button
              type="button"
              class="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              :class="
                copied
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-white text-slate-600 shadow-sm hover:bg-slate-100'
              "
              @click="copyCode(issuedCode.code)"
            >
              <Check v-if="copied" class="h-3.5 w-3.5" aria-hidden="true" />
              <Copy v-else class="h-3.5 w-3.5" aria-hidden="true" />
              {{
                copied
                  ? t('management.templatePaymentTab.paymentDrawer.copied')
                  : t('management.templatePaymentTab.paymentDrawer.copy')
              }}
            </button>
          </div>
        </div>

        <!-- The lock is the selling point, and it is also the answer to "can I
             just give this code to my client?" — so it is said here, next to
             the code, rather than in a help article. -->
        <p class="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-slate-500">
          {{ t('settings.credits.drawer.issued.accountLocked') }}
        </p>
      </div>

      <div v-else class="text-center">
        <div class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-50">
          <Clock class="h-7 w-7 text-amber-500" aria-hidden="true" />
        </div>
        <h3 class="mt-3 text-lg font-semibold text-slate-900">
          {{ t('settings.credits.drawer.awaiting.title') }}
        </h3>
        <p class="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-slate-600">
          {{ t('settings.credits.drawer.awaiting.subtitle') }}
        </p>
        <p class="mt-3 text-xs text-slate-500">
          {{
            t('settings.credits.drawer.awaiting.reference', { reference: result.order_reference })
          }}
        </p>
      </div>
    </template>

    <!-- The form, in either of its two shapes -->
    <template v-else>
      <CheckoutSummary
        v-if="pack"
        :title="pack.name"
        :amount="isFreePack ? t('settings.credits.free') : `$${pack.price}`"
      >
        <!-- The same figure the catalogue card promised, restated where the
             order is confirmed rather than left behind on the page. -->
        <template v-if="savingsPercent" #badges>
          <span
            class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[0.6875rem] font-medium text-emerald-700"
          >
            {{ t('settings.credits.savePercent', { n: savingsPercent }) }}
          </span>
        </template>

        <template #details>
          <dl class="space-y-1.5 text-xs">
            <div class="flex items-center justify-between gap-3">
              <dt class="text-slate-500">{{ t('settings.credits.drawer.summary.credits') }}</dt>
              <dd class="font-medium text-slate-700">
                {{ t('settings.credits.creditCount', { n: pack.credit_count }, pack.credit_count) }}
              </dd>
            </div>
            <div class="flex items-center justify-between gap-3">
              <dt class="text-slate-500">{{ t('settings.credits.drawer.summary.plan') }}</dt>
              <dd class="min-w-0 truncate font-medium text-slate-700">
                {{ pack.pricing_plan_name }}
              </dd>
            </div>
            <div v-if="!isFreePack" class="flex items-center justify-between gap-3">
              <dt class="text-slate-500">{{ t('settings.credits.drawer.summary.perCredit') }}</dt>
              <dd class="font-medium text-slate-700 tabular-nums">${{ pack.price_per_credit }}</dd>
            </div>
            <!-- What one event costs at retail — the number the rate above is
                 only meaningful against. -->
            <div v-if="retailPrice" class="flex items-center justify-between gap-3">
              <dt class="text-slate-500">{{ t('settings.credits.drawer.summary.retail') }}</dt>
              <dd class="text-slate-500 line-through tabular-nums">${{ retailPrice }}</dd>
            </div>
            <div class="flex items-center justify-between gap-3">
              <dt class="text-slate-500">{{ t('settings.credits.drawer.summary.validity') }}</dt>
              <dd class="font-medium text-slate-700">
                {{ validityLabel }}
              </dd>
            </div>
          </dl>
          <p v-if="pack.description" class="mt-3 text-xs leading-relaxed text-slate-500">
            {{ pack.description }}
          </p>
        </template>
      </CheckoutSummary>

      <!-- Uploading proof onto an order placed earlier -->
      <CheckoutSummary
        v-else-if="order"
        :title="order.pack_name"
        :amount="`$${order.amount}`"
        :subtitle="
          t('settings.credits.drawer.awaiting.reference', { reference: order.order_reference })
        "
      />

      <!-- Nothing to transfer: a free pack has no payment to prove. -->
      <p
        v-if="isFreePack"
        class="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600"
      >
        {{
          pack?.requires_approval
            ? t('settings.credits.drawer.freeNeedsApproval')
            : t('settings.credits.drawer.freeInstant')
        }}
      </p>

      <template v-else>
        <PaymentMethodPicker
          v-model="selectedMethod"
          :methods="paymentMethods"
          :loading="loadingMethods"
          :amount="amountDue"
          group-name="credit-pack-payment-method"
          @error="onProofError"
        />

        <PaymentProofField
          ref="proofField"
          :proof="proof"
          :required="Boolean(order)"
          input-id="creditPackProof"
          @update:proof="proof = $event"
          @error="onProofError"
        />

        <PaymentDetailsDisclosure
          ref="detailsDisclosure"
          id-prefix="creditPack"
          :reference="transactionReference"
          :notes="vendorNotes"
          :show-notes="Boolean(pack)"
          :notes-placeholder="t('settings.credits.drawer.notesPlaceholder')"
          @update:reference="transactionReference = $event"
          @update:notes="vendorNotes = $event"
        />
      </template>
    </template>

    <template #footer>
      <p
        v-if="localError"
        class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
        role="alert"
      >
        {{ localError }}
      </p>
      <button
        v-if="result"
        type="button"
        class="min-h-[48px] w-full rounded-xl bg-slate-100 px-4 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        @click="emit('close')"
      >
        {{ t('settings.credits.drawer.done') }}
      </button>
      <button
        v-else
        type="button"
        :disabled="submitting || !canSubmit"
        class="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2"
        @click="handleSubmit"
      >
        <Loader v-if="submitting" class="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>{{ submitLabel }}</span>
      </button>
    </template>
  </CheckoutDrawer>
</template>

<script setup lang="ts">
/**
 * Buying a credit pack, and attaching the proof for one bought earlier.
 *
 * Two jobs in one drawer because they are two points on the same line: an order
 * is placed, then proven, then confirmed. Splitting them would mean two drawers
 * asking for the same bank transfer with the same QR and the same file input,
 * and one of them would drift.
 *
 * It performs no API calls of its own — the tab owns `usePartnerCredits` and is
 * the only place credits are written from, so this emits the payload and renders
 * whatever order comes back as `result`.
 *
 * The panel, header, summary, method list, receipt field and optional fields
 * are all shared with the template-activation checkout under
 * `components/payment/`: same company, same accounts, same words.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, Clock, Copy, Loader, Sparkles } from 'lucide-vue-next'
import CheckoutDrawer from '@/components/payment/CheckoutDrawer.vue'
import CheckoutSummary from '@/components/payment/CheckoutSummary.vue'
import PaymentMethodPicker from '@/components/payment/PaymentMethodPicker.vue'
import PaymentProofField from '@/components/payment/PaymentProofField.vue'
import PaymentDetailsDisclosure from '@/components/payment/PaymentDetailsDisclosure.vue'
import { usePlatformPaymentMethods } from '@/composables/usePlatformPaymentMethods'
import type { CreditPack, CreditPackOrder } from '@/services/api'
import type { PaymentMethod } from '@/types/payment'

const props = defineProps<{
  open: boolean
  /** Buying: the pack being ordered. Mutually exclusive with `order`. */
  pack?: CreditPack | null
  /** Proving: a pending order that still needs its receipt. */
  order?: CreditPackOrder | null
  submitting?: boolean
  /** The order the server returned — switches the drawer to its result screen. */
  result?: CreditPackOrder | null
}>()

const emit = defineEmits<{
  close: []
  'place-order': [
    payload: {
      pack: string
      payment_method?: number
      transaction_reference?: string
      vendor_notes?: string
      proof: File | null
    },
  ]
  'upload-proof': [
    payload: {
      orderId: string
      proof: File
      payment_method?: number
      transaction_reference?: string
    },
  ]
}>()

const { t } = useI18n()
const { paymentMethods, loadingMethods, ensurePaymentMethods } = usePlatformPaymentMethods()

const selectedMethod = ref<PaymentMethod | null>(null)
const proof = ref<File | null>(null)
const transactionReference = ref('')
const vendorNotes = ref('')
const localError = ref<string | null>(null)
const copied = ref(false)
const proofField = ref<InstanceType<typeof PaymentProofField> | null>(null)
const detailsDisclosure = ref<InstanceType<typeof PaymentDetailsDisclosure> | null>(null)

/** A `0.00` pack has nothing to verify, so it skips the transfer flow entirely. */
const isFreePack = computed(() => Boolean(props.pack) && Number(props.pack?.price ?? 0) === 0)

/** Retail price of the one event a credit covers, when the server sent one. */
const retailPrice = computed(() => {
  if (isFreePack.value) return null
  const retail = Number(props.pack?.pricing_plan_price)
  return Number.isFinite(retail) && retail > 0 ? props.pack!.pricing_plan_price : null
})

/**
 * How far under retail this pack's per-credit rate lands — kept identical to the
 * catalogue card's arithmetic so the badge cannot change between the page and
 * the drawer it opens.
 */
const savingsPercent = computed(() => {
  const retail = Number(props.pack?.pricing_plan_price)
  const each = Number(props.pack?.price_per_credit)
  if (!Number.isFinite(retail) || !Number.isFinite(each) || retail <= 0 || each < 0) return null
  const percent = Math.round((1 - each / retail) * 100)
  return percent > 0 ? percent : null
})

/**
 * How long the credits stay redeemable, restated where the money is committed.
 *
 * `null` days means they never expire rather than expiring immediately — the
 * plural string would otherwise drop the count and read as a bare " day".
 */
const validityLabel = computed(() => {
  const days = props.pack?.validity_days
  return typeof days === 'number'
    ? t('settings.credits.dayCount', { n: days }, days)
    : t('settings.credits.noExpiry')
})

const amountDue = computed(() => props.pack?.price ?? props.order?.amount ?? '0.00')

const subjectName = computed(() => props.pack?.name ?? props.order?.pack_name ?? null)

const headerTitle = computed(() => {
  if (props.result) return t('settings.credits.drawer.resultTitle')
  if (props.order) return t('settings.credits.drawer.proofTitle')
  return t('settings.credits.drawer.buyTitle')
})

const issuedCode = computed(() => props.result?.promo_code_detail ?? null)

const canSubmit = computed(() => {
  if (props.order) return Boolean(proof.value && selectedMethod.value)
  if (!props.pack) return false
  if (isFreePack.value) return true
  return Boolean(selectedMethod.value)
})

const submitLabel = computed(() => {
  if (props.submitting) return t('settings.credits.drawer.submitting')
  if (props.order) return t('settings.credits.drawer.uploadProofBtn')
  if (isFreePack.value) {
    return props.pack?.requires_approval
      ? t('settings.credits.drawer.requestBtn')
      : t('settings.credits.drawer.claimBtn')
  }
  return t('settings.credits.drawer.placeOrderBtn')
})

const onProofError = (message: string): void => {
  localError.value = message
}

const copyCode = async (code: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(code)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy credit code:', err)
  }
}

const handleSubmit = (): void => {
  localError.value = null

  if (props.order) {
    if (!proof.value) {
      localError.value = t('settings.credits.drawer.proofRequired')
      return
    }
    emit('upload-proof', {
      orderId: props.order.id,
      proof: proof.value,
      payment_method: selectedMethod.value?.id,
      transaction_reference: transactionReference.value.trim() || undefined,
    })
    return
  }

  if (!props.pack) return

  emit('place-order', {
    pack: props.pack.id,
    payment_method: isFreePack.value ? undefined : selectedMethod.value?.id,
    transaction_reference: transactionReference.value.trim() || undefined,
    vendor_notes: vendorNotes.value.trim() || undefined,
    proof: isFreePack.value ? null : proof.value,
  })
}

const reset = (): void => {
  selectedMethod.value = null
  proof.value = null
  transactionReference.value = ''
  vendorNotes.value = ''
  localError.value = null
  copied.value = false
  proofField.value?.reset()
  detailsDisclosure.value?.collapse()
}

watch(
  () => props.open,
  (isOpen) => {
    // A free pack never shows the transfer flow, so it never needs the list.
    if (isOpen) {
      if (!isFreePack.value) ensurePaymentMethods()
    } else {
      reset()
    }
  },
)
</script>
