<template>
  <section class="space-y-2">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-sm font-semibold text-slate-900">
        {{ t('management.templatePaymentTab.paymentDrawer.receipt.title') }}
      </h3>

      <button
        v-if="proof"
        type="button"
        class="-mr-1 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        @click="clear"
      >
        <X class="h-3.5 w-3.5" aria-hidden="true" />
        {{ t('management.templatePaymentTab.paymentDrawer.receipt.remove') }}
      </button>
      <span
        v-else-if="required"
        class="flex-shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[0.6875rem] font-medium text-amber-700"
      >
        {{ t('management.templatePaymentTab.paymentDrawer.receipt.required') }}
      </span>
      <span
        v-else
        class="flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[0.6875rem] font-medium text-slate-500"
      >
        {{ t('management.templatePaymentTab.paymentDrawer.receipt.recommended') }}
      </span>
    </div>

    <p class="text-xs leading-relaxed text-slate-500">
      {{ t('management.templatePaymentTab.paymentDrawer.step3.hint') }}
    </p>

    <div class="relative">
      <input
        :id="inputId"
        ref="fileInput"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
        class="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        :aria-label="t('management.templatePaymentTab.paymentDrawer.receipt.title')"
        @change="handleFileSelect"
      />
      <div
        class="flex min-h-[68px] items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-3 transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-200"
        :class="
          proof
            ? 'border-emerald-300 bg-emerald-50/70'
            : 'border-slate-200 bg-slate-50/60 hover:border-[#1e90ff] hover:bg-[#F1F8FF]'
        "
      >
        <span
          class="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg"
          :class="proof ? 'bg-emerald-100' : 'bg-white shadow-sm'"
        >
          <Check v-if="proof" class="h-5 w-5 text-emerald-600" aria-hidden="true" />
          <Upload v-else class="h-5 w-5 text-slate-400" aria-hidden="true" />
        </span>
        <span class="min-w-0 flex-1">
          <span
            class="block truncate text-sm font-medium"
            :class="proof ? 'text-emerald-800' : 'text-slate-700'"
          >
            {{
              proof ? proof.name : t('management.templatePaymentTab.paymentDrawer.step3.chooseFile')
            }}
          </span>
          <span
            class="block truncate text-xs"
            :class="proof ? 'text-emerald-700' : 'text-slate-500'"
          >
            {{
              proof
                ? formatBytes(proof.size)
                : t('management.templatePaymentTab.paymentDrawer.step3.fileTypes')
            }}
          </span>
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * The receipt — what is left of `PaymentInstructions` once the amount and the
 * account details moved into the method row they describe.
 *
 * It stays a section of its own because it is a genuinely separate act: the
 * organizer leaves for their banking app and comes back with a screenshot, and
 * that screenshot is what an admin later confirms against. Burying it at the
 * bottom of an expanded method row would hide the one thing the drawer asks
 * the organizer to bring back with them.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, Upload, X } from 'lucide-vue-next'
import { validatePaymentProofFile } from './paymentProof'

withDefaults(
  defineProps<{
    proof: File | null
    /** Distinct per drawer so two mounted file inputs don't share an id. */
    inputId?: string
    /** Uploading proof onto an order placed earlier can't be skipped. */
    required?: boolean
  }>(),
  { inputId: 'paymentProof', required: false },
)

const emit = defineEmits<{
  'update:proof': [file: File | null]
  /** A rejected file, already worded for the user. */
  error: [message: string]
}>()

const { t } = useI18n()

const fileInput = ref<HTMLInputElement | null>(null)

/** Reassurance that the right screenshot landed, not a precise figure. */
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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

/** Clears the native input too — a parent resetting `proof` cannot reach it. */
const reset = (): void => {
  if (fileInput.value) fileInput.value.value = ''
}

const clear = (): void => {
  reset()
  emit('update:proof', null)
}

defineExpose({ reset })
</script>
