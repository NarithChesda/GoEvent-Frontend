<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="slide-right">
      <div
        v-if="open"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[32.5rem] laptop-sm:w-[35rem] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center gap-2 px-3 py-2.5">
            <button
              type="button"
              class="p-1.5 hover:bg-white/20 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              :title="t('common.actions.close')"
              :aria-label="t('common.actions.close')"
              @click="emit('close')"
            >
              <ArrowRight class="w-5 h-5 text-white" />
            </button>
            <div class="min-w-0">
              <p
                v-if="subjectName"
                class="text-[0.625rem] uppercase tracking-wide text-white/80 truncate"
              >
                {{ subjectName }}
              </p>
              <h2 class="text-base font-semibold text-white leading-tight">
                {{ headerTitle }}
              </h2>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <!--
            The order landed. Which screen this is depends on the status the
            server sent back, never on the price: a free pack without
            `requires_approval` is confirmed in the same request, and telling a
            partner to wait for a review that already happened would send them
            looking for an email that never arrives.
          -->
          <div v-if="result" class="p-4 space-y-4">
            <div v-if="issuedCode" class="text-center">
              <div
                class="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 flex items-center justify-center"
              >
                <Sparkles class="w-7 h-7 text-[#2ecc71]" aria-hidden="true" />
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

              <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p class="text-xs text-slate-500">
                  {{ t('settings.credits.drawer.issued.codeLabel') }}
                </p>
                <div class="mt-1.5 flex items-center justify-center gap-2">
                  <code class="font-mono text-base font-semibold tracking-wide text-slate-900">
                    {{ issuedCode.code }}
                  </code>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors duration-200"
                    :class="
                      copied
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    "
                    @click="copyCode(issuedCode.code)"
                  >
                    <Check v-if="copied" class="w-3 h-3" aria-hidden="true" />
                    <Copy v-else class="w-3 h-3" aria-hidden="true" />
                    {{
                      copied
                        ? t('management.templatePaymentTab.paymentDrawer.copied')
                        : t('management.templatePaymentTab.paymentDrawer.copy')
                    }}
                  </button>
                </div>
              </div>

              <!-- The lock is the selling point, and it is also the answer to
                   "can I just give this code to my client?" — so it is said
                   here, next to the code, rather than in a help article. -->
              <p class="mt-3 text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                {{ t('settings.credits.drawer.issued.accountLocked') }}
              </p>
            </div>

            <div v-else class="text-center">
              <div
                class="w-14 h-14 mx-auto rounded-full bg-amber-50 flex items-center justify-center"
              >
                <Clock class="w-7 h-7 text-amber-500" aria-hidden="true" />
              </div>
              <h3 class="mt-3 text-lg font-semibold text-slate-900">
                {{ t('settings.credits.drawer.awaiting.title') }}
              </h3>
              <p class="mt-1 text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                {{ t('settings.credits.drawer.awaiting.subtitle') }}
              </p>
              <p class="mt-3 text-xs text-slate-500">
                {{
                  t('settings.credits.drawer.awaiting.reference', {
                    reference: result.order_reference,
                  })
                }}
              </p>
            </div>
          </div>

          <!-- The form, in either of its two shapes -->
          <div v-else class="p-3 laptop-sm:p-4 space-y-3 laptop-sm:space-y-4">
            <!-- What is being bought. A quiet slate region rather than a second
                 card: nothing here is separable from the drawer it is in. -->
            <div v-if="pack" class="rounded-xl bg-slate-50 p-4">
              <div class="flex items-baseline justify-between gap-3">
                <p class="text-sm font-medium text-slate-900 min-w-0 truncate">{{ pack.name }}</p>
                <p class="text-xl font-bold text-slate-900 flex-shrink-0">
                  {{ isFreePack ? t('settings.credits.free') : `$${pack.price}` }}
                </p>
              </div>
              <dl class="mt-3 space-y-1.5 text-xs">
                <div class="flex items-center justify-between gap-3">
                  <dt class="text-slate-500">{{ t('settings.credits.drawer.summary.credits') }}</dt>
                  <dd class="text-slate-700 font-medium">
                    {{
                      t('settings.credits.creditCount', { n: pack.credit_count }, pack.credit_count)
                    }}
                  </dd>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <dt class="text-slate-500">{{ t('settings.credits.drawer.summary.plan') }}</dt>
                  <dd class="text-slate-700 font-medium truncate">{{ pack.pricing_plan_name }}</dd>
                </div>
                <div v-if="!isFreePack" class="flex items-center justify-between gap-3">
                  <dt class="text-slate-500">
                    {{ t('settings.credits.drawer.summary.perCredit') }}
                  </dt>
                  <dd class="text-slate-700 font-medium">${{ pack.price_per_credit }}</dd>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <dt class="text-slate-500">
                    {{ t('settings.credits.drawer.summary.validity') }}
                  </dt>
                  <dd class="text-slate-700 font-medium">
                    {{
                      t('settings.credits.dayCount', { n: pack.validity_days }, pack.validity_days)
                    }}
                  </dd>
                </div>
              </dl>
              <p v-if="pack.description" class="mt-3 text-xs text-slate-500 leading-relaxed">
                {{ pack.description }}
              </p>
            </div>

            <!-- Uploading proof onto an order placed earlier -->
            <div v-else-if="order" class="rounded-xl bg-slate-50 p-4">
              <div class="flex items-baseline justify-between gap-3">
                <p class="text-sm font-medium text-slate-900 min-w-0 truncate">
                  {{ order.pack_name }}
                </p>
                <p class="text-xl font-bold text-slate-900 flex-shrink-0">${{ order.amount }}</p>
              </div>
              <p class="mt-1 text-xs text-slate-500">
                {{
                  t('settings.credits.drawer.awaiting.reference', {
                    reference: order.order_reference,
                  })
                }}
              </p>
            </div>

            <!-- Nothing to transfer: a free pack has no payment to prove. -->
            <div
              v-if="isFreePack"
              class="rounded-xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 leading-relaxed"
            >
              {{
                pack?.requires_approval
                  ? t('settings.credits.drawer.freeNeedsApproval')
                  : t('settings.credits.drawer.freeInstant')
              }}
            </div>

            <template v-else>
              <PaymentMethodPicker
                v-model="selectedMethod"
                :methods="paymentMethods"
                :loading="loadingMethods"
                group-name="credit-pack-payment-method"
              />

              <PaymentInstructions
                v-if="selectedMethod"
                ref="instructions"
                :method="selectedMethod"
                :amount="amountDue"
                :proof="proof"
                input-id="creditPackProof"
                @update:proof="proof = $event"
                @error="onProofError"
              />

              <div
                v-else
                class="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center"
              >
                <div
                  class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3"
                >
                  <CreditCard class="w-6 h-6 text-slate-400" aria-hidden="true" />
                </div>
                <p class="text-sm font-medium text-slate-600">
                  {{ t('management.templatePaymentTab.paymentDrawer.noMethodSelected.title') }}
                </p>
                <p class="text-xs text-slate-500 mt-1">
                  {{ t('management.templatePaymentTab.paymentDrawer.noMethodSelected.hint') }}
                </p>
              </div>

              <div v-if="selectedMethod" class="space-y-3">
                <div class="space-y-1.5">
                  <label for="creditPackRef" class="block text-sm font-medium text-slate-700">
                    {{ t('management.templatePaymentTab.paymentDrawer.transactionRef') }}
                    <span class="text-slate-400 font-normal"
                      >({{ t('management.templatePaymentTab.paymentDrawer.optional') }})</span
                    >
                  </label>
                  <input
                    id="creditPackRef"
                    v-model="transactionReference"
                    type="text"
                    :class="fieldClass"
                    :placeholder="
                      t('management.templatePaymentTab.paymentDrawer.transactionRefPlaceholder')
                    "
                  />
                </div>

                <div v-if="pack" class="space-y-1.5">
                  <label for="creditPackNotes" class="block text-sm font-medium text-slate-700">
                    {{ t('management.templatePaymentTab.paymentDrawer.notes') }}
                    <span class="text-slate-400 font-normal"
                      >({{ t('management.templatePaymentTab.paymentDrawer.optional') }})</span
                    >
                  </label>
                  <textarea
                    id="creditPackNotes"
                    v-model="vendorNotes"
                    rows="2"
                    :class="`${fieldClass} resize-none`"
                    :placeholder="t('settings.credits.drawer.notesPlaceholder')"
                  ></textarea>
                </div>
              </div>
            </template>

            <div
              v-if="localError"
              class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-600"
            >
              {{ localError }}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <button
            v-if="result"
            type="button"
            class="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors duration-200"
            @click="emit('close')"
          >
            {{ t('settings.credits.drawer.done') }}
          </button>
          <button
            v-else
            type="button"
            :disabled="submitting || !canSubmit"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:opacity-90 text-white text-sm font-semibold rounded-lg shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleSubmit"
          >
            <Loader v-if="submitting" class="w-4 h-4 animate-spin" aria-hidden="true" />
            <span>{{ submitLabel }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
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
 */
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowRight, Check, Clock, Copy, CreditCard, Loader, Sparkles } from 'lucide-vue-next'
import PaymentMethodPicker from '@/components/payment/PaymentMethodPicker.vue'
import PaymentInstructions from '@/components/payment/PaymentInstructions.vue'
import { usePlatformPaymentMethods } from '@/composables/usePlatformPaymentMethods'
import { fieldClass } from '@/components/settings/settingsFormChrome'
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
const instructions = ref<InstanceType<typeof PaymentInstructions> | null>(null)

/** A `0.00` pack has nothing to verify, so it skips the transfer flow entirely. */
const isFreePack = computed(() => Boolean(props.pack) && Number(props.pack?.price ?? 0) === 0)

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

/** Escape closes the drawer — §10, and the only exit on a keyboard. */
const onKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') emit('close')
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
  instructions.value?.reset()
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // A free pack never shows the transfer flow, so it never needs the list.
      if (!isFreePack.value) ensurePaymentMethods()
      document.addEventListener('keydown', onKeydown)
    } else {
      document.removeEventListener('keydown', onKeydown)
      reset()
    }
  },
)

onUnmounted(() => document.removeEventListener('keydown', onKeydown))

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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>
