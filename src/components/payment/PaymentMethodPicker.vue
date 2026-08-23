<template>
  <section class="space-y-2.5">
    <h3 class="text-sm font-semibold text-slate-900">
      {{ t('management.templatePaymentTab.paymentDrawer.paymentMethod') }}
    </h3>

    <!-- Loading mirrors the rows it will become, so the list doesn't jump -->
    <div
      v-if="loading"
      class="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200"
      role="status"
      :aria-label="t('management.templatePaymentTab.paymentDrawer.loadingMethods')"
    >
      <div v-for="n in 2" :key="n" class="flex animate-pulse items-center gap-3 px-3.5 py-3.5">
        <span class="h-9 w-9 flex-shrink-0 rounded-lg bg-slate-200" />
        <span class="min-w-0 flex-1 space-y-1.5">
          <span class="block h-3 w-28 rounded bg-slate-200" />
          <span class="block h-2.5 w-16 rounded bg-slate-100" />
        </span>
      </div>
    </div>

    <p
      v-else-if="methods.length === 0"
      class="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500"
    >
      {{ t('management.templatePaymentTab.paymentDrawer.noMethods') }}
    </p>

    <!--
      One list, not a list plus a panel below it. Picking a method used to
      reveal a separate "How to Pay" card further down the drawer, which pushed
      the page around and left a dashed placeholder holding its space until
      then. The details now open inside the row that was chosen, so the answer
      arrives where the question was asked and nothing below it moves.
    -->
    <div
      v-else
      class="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <div
        v-for="method in methods"
        :key="method.id"
        :class="isSelected(method) ? 'bg-[#F1F8FF]' : ''"
      >
        <label
          class="flex min-h-[56px] w-full cursor-pointer items-center gap-3 px-3.5 py-3 transition-colors duration-200 focus-within:ring-2 focus-within:ring-inset focus-within:ring-sky-200"
          :class="isSelected(method) ? '' : 'hover:bg-slate-50 active:bg-slate-100'"
        >
          <!-- A real radio, visually hidden: it is what gives arrow-key
               movement through the list and lets a screen reader say "2 of 3". -->
          <input
            type="radio"
            class="sr-only"
            :name="groupName"
            :checked="isSelected(method)"
            @change="emit('update:modelValue', method)"
          />
          <span
            class="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg transition-colors duration-200"
            :class="
              isSelected(method)
                ? 'bg-white text-[#1e90ff] shadow-sm'
                : 'bg-slate-100 text-slate-500'
            "
          >
            <component :is="iconFor(method)" class="h-4 w-4" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium text-slate-900">{{ method.name }}</span>
            <span class="block truncate text-xs text-slate-500">
              {{ method.payment_type_display }}
            </span>
          </span>
          <Check
            v-if="isSelected(method)"
            class="h-4 w-4 flex-shrink-0 text-[#1e90ff]"
            aria-hidden="true"
          />
        </label>

        <Transition name="collapse">
          <div v-if="isSelected(method)" class="grid grid-rows-[1fr]">
            <div class="min-h-0 overflow-hidden">
              <div class="space-y-3 border-t border-[#CFE7FF] px-3.5 pb-4 pt-3">
                <!-- What to send. This replaces the old numbered "step 1:
                     copy the amount" — the figure belongs beside the account
                     it is being sent to, not as a ceremony of its own. -->
                <div
                  class="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm"
                >
                  <div class="min-w-0">
                    <p class="text-[0.6875rem] font-medium uppercase tracking-wide text-slate-500">
                      {{ t('management.templatePaymentTab.paymentDrawer.sendExactly') }}
                    </p>
                    <p class="text-lg font-bold leading-tight text-slate-900 tabular-nums">
                      ${{ amount }}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="inline-flex min-h-[40px] flex-shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                    :class="
                      isCopied(method, 'amount')
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
                    "
                    @click="copyValue(method, 'amount', amount)"
                  >
                    <Check
                      v-if="isCopied(method, 'amount')"
                      class="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    <Copy v-else class="h-3.5 w-3.5" aria-hidden="true" />
                    {{ copyLabel(method, 'amount') }}
                  </button>
                </div>

                <div
                  v-if="method.qr_code_image"
                  class="rounded-xl bg-white p-3 text-center shadow-sm"
                >
                  <img
                    :src="method.qr_code_image"
                    :alt="
                      t('management.templatePaymentTab.paymentDrawer.qrAlt', { name: method.name })
                    "
                    class="mx-auto h-40 w-40 rounded-lg object-contain sm:h-44 sm:w-44"
                    loading="lazy"
                    @error="handleImageError"
                  />
                  <p class="mt-2 text-xs text-slate-500">
                    {{ t('management.templatePaymentTab.paymentDrawer.step2.scanQr') }}
                  </p>
                </div>

                <!--
                  Tap-to-copy rows rather than a 24px copy chip beside each
                  value: on a phone the whole row is the target, which is the
                  only way these clear the 40px minimum without the chip
                  crowding an account number out of its own line.
                -->
                <div
                  v-if="hasBankDetails(method)"
                  class="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm"
                >
                  <div
                    v-if="method.bank_name"
                    class="flex min-h-[48px] items-center gap-3 px-3 py-2.5"
                  >
                    <span class="min-w-[3.5rem] flex-shrink-0 text-xs text-slate-500">
                      {{ t('management.templatePaymentTab.paymentDrawer.step2.bank') }}
                    </span>
                    <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                      {{ method.bank_name }}
                    </span>
                  </div>

                  <button
                    v-if="method.account_number"
                    type="button"
                    class="flex min-h-[48px] w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-200 hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-200"
                    :aria-label="`${t('management.templatePaymentTab.paymentDrawer.copy')} ${method.account_number}`"
                    @click="copyValue(method, 'account', method.account_number)"
                  >
                    <span class="min-w-[3.5rem] flex-shrink-0 text-xs text-slate-500">
                      {{ t('management.templatePaymentTab.paymentDrawer.step2.account') }}
                    </span>
                    <span
                      class="min-w-0 flex-1 truncate font-mono text-sm font-medium text-slate-800"
                    >
                      {{ method.account_number }}
                    </span>
                    <Check
                      v-if="isCopied(method, 'account')"
                      class="h-4 w-4 flex-shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    <Copy v-else class="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                  </button>

                  <button
                    v-if="method.account_name"
                    type="button"
                    class="flex min-h-[48px] w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-200 hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-200"
                    :aria-label="`${t('management.templatePaymentTab.paymentDrawer.copy')} ${method.account_name}`"
                    @click="copyValue(method, 'name', method.account_name)"
                  >
                    <span class="min-w-[3.5rem] flex-shrink-0 text-xs text-slate-500">
                      {{ t('management.templatePaymentTab.paymentDrawer.step2.name') }}
                    </span>
                    <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                      {{ method.account_name }}
                    </span>
                    <Check
                      v-if="isCopied(method, 'name')"
                      class="h-4 w-4 flex-shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    <Copy v-else class="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                  </button>
                </div>

                <!-- Only offered where a banking app can actually receive the
                     handoff. Slate rather than the brand gradient: the drawer
                     header already spends the one gradient this view gets, and
                     the submit button below is the primary action. -->
                <button
                  v-if="method.payment_link && isMobileDevice"
                  type="button"
                  class="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-slate-800 active:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  @click="openPaymentLink(method.payment_link)"
                >
                  <Smartphone class="h-4 w-4" aria-hidden="true" />
                  {{ t('management.templatePaymentTab.paymentDrawer.step2.openBankApp') }}
                  <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * Where the money goes, and how to send it there — GoEvent's own receiving
 * accounts as an accordion of radio rows.
 *
 * It absorbed what used to be the first two steps of `PaymentInstructions`
 * (copy the amount, transfer to this account), because those steps were only
 * ever *about* the row above them. Splitting them into a second card meant the
 * drawer answered a question a screen away from where it was asked, and had to
 * hold that space with a dashed placeholder until the organizer chose. What is
 * left of that component is the receipt, which is genuinely a separate act and
 * lives on as `PaymentProofField`.
 *
 * Shared by both checkouts, so template activation and the partner credit-pack
 * order cannot drift apart in how they ask for a transfer.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Landmark,
  QrCode,
  Smartphone,
} from 'lucide-vue-next'
import type { PaymentMethod } from '@/types/payment'

const props = withDefaults(
  defineProps<{
    methods: readonly PaymentMethod[]
    loading?: boolean
    modelValue: PaymentMethod | null
    /** Already formatted, e.g. "700.00" — this component never computes a total. */
    amount: string
    /** Radio group name — distinct per drawer so two mounted lists don't merge. */
    groupName?: string
  }>(),
  { loading: false, groupName: 'payment-method' },
)

const emit = defineEmits<{
  'update:modelValue': [method: PaymentMethod]
  /** A failed clipboard write, already worded for the user. */
  error: [message: string]
}>()

const { t } = useI18n()

/** Keyed `${methodId}:${field}` so two open rows can't share a "Copied!". */
const copiedKey = ref<string | null>(null)

const isMobileDevice = computed(() => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

const isSelected = (method: PaymentMethod): boolean => props.modelValue?.id === method.id

const hasBankDetails = (method: PaymentMethod): boolean =>
  Boolean(method.bank_name || method.account_number || method.account_name)

/**
 * Read off what the method actually carries rather than off `payment_type`,
 * which is a free-form string on this endpoint — a new backend value would
 * otherwise silently fall through to the generic card icon.
 */
const iconFor = (method: PaymentMethod) => {
  if (method.qr_code_image) return QrCode
  if (method.bank_name || method.account_number) return Landmark
  if (method.payment_link) return Smartphone
  return CreditCard
}

const isCopied = (method: PaymentMethod, field: string): boolean =>
  copiedKey.value === `${method.id}:${field}`

const copyLabel = (method: PaymentMethod, field: string): string =>
  isCopied(method, field)
    ? t('management.templatePaymentTab.paymentDrawer.copied')
    : t('management.templatePaymentTab.paymentDrawer.copy')

const copyValue = async (method: PaymentMethod, field: string, value: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(value)
    copiedKey.value = `${method.id}:${field}`
    setTimeout(() => {
      if (copiedKey.value === `${method.id}:${field}`) copiedKey.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
    emit('error', t('management.templatePaymentTab.paymentDrawer.copyFailed'))
  }
}

const openPaymentLink = (paymentLink: string): void => {
  if (!paymentLink || typeof paymentLink !== 'string') return
  try {
    const url = new URL(paymentLink)
    if (!url.protocol) return
    window.location.href = paymentLink
  } catch (err) {
    console.error('Invalid payment link format:', err)
  }
}

const handleImageError = (event: globalThis.Event): void => {
  const img = event.target as HTMLImageElement
  if (img?.src) {
    console.error('Failed to load QR code image:', img.src)
    img.style.display = 'none'
  }
}
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
