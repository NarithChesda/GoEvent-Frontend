<template>
  <section
    class="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3 laptop-sm:p-4 space-y-4"
  >
    <div class="flex items-center gap-2">
      <div class="w-7 h-7 rounded-full bg-[#1e90ff]/10 flex items-center justify-center">
        <Banknote class="w-4 h-4 text-[#1e90ff]" />
      </div>
      <div>
        <h3 class="text-sm sm:text-base font-semibold text-slate-800">
          {{ t('management.templatePaymentTab.paymentDrawer.howToPay') }}
        </h3>
        <p class="text-[0.6875rem] text-slate-500">{{ method.name }}</p>
      </div>
    </div>

    <!-- Step 1: Copy Amount -->
    <div class="flex gap-3">
      <div class="flex flex-col items-center">
        <div
          class="w-6 h-6 rounded-full bg-[#1e90ff] text-white text-xs font-bold flex items-center justify-center"
        >
          1
        </div>
        <div class="w-0.5 flex-1 bg-slate-200 mt-1"></div>
      </div>
      <div class="flex-1 pb-4">
        <p class="text-sm font-medium text-slate-800 mb-2">
          {{ t('management.templatePaymentTab.paymentDrawer.step1.title') }}
        </p>
        <div class="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 py-2">
          <span class="text-lg font-semibold text-slate-900">${{ amount }}</span>
          <button
            type="button"
            @click="copyToClipboard(amount, 'amount')"
            class="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors duration-200"
            :class="
              copiedField === 'amount'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            "
          >
            <Check v-if="copiedField === 'amount'" class="w-3.5 h-3.5" />
            <Copy v-else class="w-3.5 h-3.5" />
            {{
              copiedField === 'amount'
                ? t('management.templatePaymentTab.paymentDrawer.copied')
                : t('management.templatePaymentTab.paymentDrawer.copy')
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- Step 2: Transfer Payment -->
    <div class="flex gap-3">
      <div class="flex flex-col items-center">
        <div
          class="w-6 h-6 rounded-full bg-[#1e90ff] text-white text-xs font-bold flex items-center justify-center"
        >
          2
        </div>
        <div class="w-0.5 flex-1 bg-slate-200 mt-1"></div>
      </div>
      <div class="flex-1 pb-4">
        <p class="text-sm font-medium text-slate-800 mb-2">
          {{ t('management.templatePaymentTab.paymentDrawer.step2.title') }}
        </p>

        <div
          v-if="method.qr_code_image"
          class="rounded-xl border border-slate-200 bg-white p-4 text-center"
        >
          <img
            :src="method.qr_code_image"
            :alt="`QR Code for ${method.name}`"
            class="mx-auto h-40 w-40 laptop-sm:h-44 laptop-sm:w-44 object-contain rounded-lg"
            loading="lazy"
            @error="handleImageError"
          />
          <p class="text-xs text-slate-500 mt-2">
            {{ t('management.templatePaymentTab.paymentDrawer.step2.scanQr') }}
          </p>
        </div>

        <!-- Only offered where a banking app can actually receive the handoff. -->
        <button
          v-if="method.payment_link && isMobileDevice"
          type="button"
          @click="openPaymentLink(method.payment_link)"
          class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1e90ff] to-[#2ecc71] hover:from-[#1873cc] hover:to-[#27ae60] text-white font-semibold px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm mt-3"
        >
          <Smartphone class="w-4 h-4" />
          {{ t('management.templatePaymentTab.paymentDrawer.step2.openBankApp') }}
          <ExternalLink class="w-3.5 h-3.5 ml-1" />
        </button>

        <div
          v-if="method.bank_name || method.account_number || method.account_name"
          class="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-3"
        >
          <p class="text-xs text-slate-500 font-medium uppercase tracking-wide">
            {{ t('management.templatePaymentTab.paymentDrawer.step2.bankDetails') }}
          </p>
          <div v-if="method.bank_name" class="text-sm text-slate-700">
            <span class="text-slate-500">{{
              t('management.templatePaymentTab.paymentDrawer.step2.bank')
            }}</span>
            {{ method.bank_name }}
          </div>
          <div v-if="method.account_number" class="flex items-center justify-between gap-2">
            <div class="text-sm">
              <span class="text-slate-500">{{
                t('management.templatePaymentTab.paymentDrawer.step2.account')
              }}</span>
              <span class="font-mono font-medium text-slate-800 ml-1">{{
                method.account_number
              }}</span>
            </div>
            <button
              type="button"
              @click="copyToClipboard(method.account_number, 'account')"
              class="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors duration-200"
              :class="
                copiedField === 'account'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              "
            >
              <Check v-if="copiedField === 'account'" class="w-3 h-3" />
              <Copy v-else class="w-3 h-3" />
              {{
                copiedField === 'account'
                  ? t('management.templatePaymentTab.paymentDrawer.copied')
                  : t('management.templatePaymentTab.paymentDrawer.copy')
              }}
            </button>
          </div>
          <div v-if="method.account_name" class="flex items-center justify-between gap-2">
            <div class="text-sm">
              <span class="text-slate-500">{{
                t('management.templatePaymentTab.paymentDrawer.step2.name')
              }}</span>
              <span class="font-medium text-slate-800 ml-1">{{ method.account_name }}</span>
            </div>
            <button
              type="button"
              @click="copyToClipboard(method.account_name, 'name')"
              class="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors duration-200"
              :class="
                copiedField === 'name'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              "
            >
              <Check v-if="copiedField === 'name'" class="w-3 h-3" />
              <Copy v-else class="w-3 h-3" />
              {{
                copiedField === 'name'
                  ? t('management.templatePaymentTab.paymentDrawer.copied')
                  : t('management.templatePaymentTab.paymentDrawer.copy')
              }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 3: Upload Receipt -->
    <div class="flex gap-3">
      <div class="flex flex-col items-center">
        <div
          class="w-6 h-6 rounded-full bg-[#1e90ff] text-white text-xs font-bold flex items-center justify-center"
        >
          3
        </div>
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium text-slate-800 mb-1">
          {{ t('management.templatePaymentTab.paymentDrawer.step3.title') }}
        </p>
        <p class="text-[0.6875rem] text-slate-500 mb-2">
          {{ t('management.templatePaymentTab.paymentDrawer.step3.hint') }}
        </p>
        <div class="relative">
          <input
            :id="inputId"
            ref="fileInput"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
            @change="handleFileSelect"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div
            class="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-colors duration-200"
            :class="
              proof
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-slate-200 bg-white hover:border-[#1e90ff] hover:bg-[#F1F8FF]'
            "
          >
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="proof ? 'bg-emerald-100' : 'bg-slate-100'"
            >
              <Check v-if="proof" class="w-5 h-5 text-emerald-600" />
              <Upload v-else class="w-5 h-5 text-slate-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-medium truncate"
                :class="proof ? 'text-emerald-700' : 'text-slate-700'"
              >
                {{
                  proof
                    ? proof.name
                    : t('management.templatePaymentTab.paymentDrawer.step3.chooseFile')
                }}
              </p>
              <p class="text-[0.6875rem] text-slate-500">
                {{ t('management.templatePaymentTab.paymentDrawer.step3.fileTypes') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * "Copy the amount, transfer, upload the receipt" - the three steps that follow
 * picking a method, for any payment made to GoEvent.
 *
 * Extracted from PaymentDrawer alongside PaymentMethodPicker so the partner
 * credit-pack order asks for a transfer in exactly the same words, with the same
 * QR, the same copy buttons and the same accepted file types.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Banknote, Check, Copy, ExternalLink, Smartphone, Upload } from 'lucide-vue-next'
import type { PaymentMethod } from '@/types/payment'
import { validatePaymentProofFile } from './paymentProof'

withDefaults(
  defineProps<{
    method: PaymentMethod
    /** Already formatted, e.g. "700.00" - this component never computes a total. */
    amount: string
    proof: File | null
    /** Distinct per drawer so two mounted file inputs don't share an id. */
    inputId?: string
  }>(),
  { inputId: 'paymentProof' },
)

const emit = defineEmits<{
  'update:proof': [file: File | null]
  /** A rejected file or a failed copy, already worded for the user. */
  error: [message: string]
}>()

const { t } = useI18n()

const copiedField = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const isMobileDevice = computed(() => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

const copyToClipboard = async (text: string, fieldName: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)
    copiedField.value = fieldName
    setTimeout(() => {
      copiedField.value = null
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

const handleFileSelect = (event: globalThis.Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null

  if (file) {
    const validationError = validatePaymentProofFile(file, t)
    if (validationError) {
      emit('error', validationError)
      target.value = ''
      return
    }
  }

  emit('update:proof', file)
}

/** Clears the native input too - a parent resetting `proof` cannot reach it. */
const reset = (): void => {
  if (fileInput.value) fileInput.value.value = ''
}

defineExpose({ reset })
</script>
