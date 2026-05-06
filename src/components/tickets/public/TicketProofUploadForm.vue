<template>
  <section class="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
    <div>
      <h2 class="text-sm font-semibold text-slate-900">
        {{ t('events.tickets.order.proof.header') }}
      </h2>
      <p class="mt-1 text-xs text-slate-500">
        {{ t('events.tickets.order.proof.subtitle') }}
      </p>
    </div>

    <!-- Payment method picker — uses the event-scoped methods the organizer
         configured for this event (same source as PublicDonationForm). Buyers
         pay the organizer directly via these accounts; the platform-level
         methods at /api/payment/payment-methods/ are for buyers paying GoEvent
         for templates/plans, which is a separate flow. -->
    <div>
      <label class="block text-xs font-medium text-slate-700 mb-2">
        {{ t('events.tickets.order.proof.methodLabel') }}
        <span class="text-red-500">*</span>
      </label>
      <div v-if="loadingMethods" class="text-xs text-slate-500">
        {{ t('events.tickets.order.proof.loadingMethods') }}
      </div>
      <div
        v-else-if="methods.length === 0"
        class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
      >
        {{
          rawMethodCount > 0
            ? t('events.tickets.order.proof.noMethodsForTickets')
            : t('events.tickets.order.proof.noMethods')
        }}
      </div>
      <div v-else class="space-y-2">
        <button
          v-for="method in methods"
          :key="method.id"
          type="button"
          :class="[
            'w-full p-3 text-left rounded-xl border-2 transition-all',
            selectedMethodId === method.id
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-slate-200 hover:border-emerald-300',
          ]"
          @click="selectedMethodId = method.id"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Building2
                v-if="method.payment_method === 'bank_transfer'"
                class="w-4 h-4 text-slate-600"
              />
              <QrCode
                v-else-if="method.payment_method === 'qr_code'"
                class="w-4 h-4 text-slate-600"
              />
              <LinkIcon v-else class="w-4 h-4 text-slate-600" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-900">{{ method.name }}</p>
              <p class="text-xs text-slate-500 truncate">
                <template v-if="method.payment_method === 'bank_transfer'">
                  {{ method.bank_name }}<template v-if="method.account_number"> · {{ method.account_number }}</template>
                </template>
                <template v-else>
                  {{ formatPaymentMethod(method.payment_method) }}
                </template>
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Selected method details — bank info / QR / payment URL -->
    <div
      v-if="selectedPaymentMethod"
      class="bg-slate-50 rounded-xl p-4 space-y-3"
    >
      <h4 class="text-xs font-semibold text-slate-700 uppercase tracking-wide">
        {{ t('events.tickets.order.proof.detailsHeader') }}
      </h4>

      <!-- Bank details -->
      <div
        v-if="selectedPaymentMethod.payment_method === 'bank_transfer'"
        class="space-y-2 text-sm"
      >
        <div v-if="selectedPaymentMethod.bank_name" class="flex justify-between gap-3">
          <span class="text-slate-500">{{ t('events.tickets.order.proof.bankName') }}</span>
          <span class="font-medium text-slate-900 text-right">
            {{ selectedPaymentMethod.bank_name }}
          </span>
        </div>
        <div v-if="selectedPaymentMethod.account_name" class="flex justify-between gap-3">
          <span class="text-slate-500">{{ t('events.tickets.order.proof.accountName') }}</span>
          <span class="font-medium text-slate-900 text-right">
            {{ selectedPaymentMethod.account_name }}
          </span>
        </div>
        <div
          v-if="selectedPaymentMethod.account_number"
          class="flex justify-between items-center gap-3"
        >
          <span class="text-slate-500">{{ t('events.tickets.order.proof.accountNumber') }}</span>
          <div class="flex items-center gap-2">
            <span class="font-mono font-medium text-slate-900">
              {{ selectedPaymentMethod.account_number }}
            </span>
            <button
              type="button"
              class="p-1 hover:bg-slate-200 rounded transition-colors"
              :title="t('events.tickets.order.proof.copyAccountNumber')"
              @click="copyAccountNumber"
            >
              <Copy class="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      <!-- QR Code image -->
      <div
        v-if="selectedPaymentMethod.qr_code_image"
        class="flex justify-center pt-2"
      >
        <img
          :src="resolveMediaUrl(selectedPaymentMethod.qr_code_image)"
          :alt="selectedPaymentMethod.name"
          class="w-36 h-36 rounded-lg border border-slate-200 bg-white object-contain"
        />
      </div>

      <!-- External payment URL -->
      <div v-if="selectedPaymentMethod.payment_url" class="pt-2">
        <a
          :href="selectedPaymentMethod.payment_url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <ExternalLink class="w-4 h-4" />
          {{ t('events.tickets.order.proof.openPaymentLink') }}
        </a>
      </div>

      <!-- Optional method description -->
      <p
        v-if="selectedPaymentMethod.description"
        class="text-xs text-slate-500 pt-1 border-t border-slate-200"
      >
        {{ selectedPaymentMethod.description }}
      </p>
    </div>

    <!-- File picker -->
    <div>
      <label class="block text-xs font-medium text-slate-700 mb-1">
        {{ t('events.tickets.order.proof.fileLabel') }}
        <span class="text-red-500">*</span>
      </label>
      <input
        ref="fileInput"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
        class="block w-full text-sm text-slate-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:text-sm hover:file:bg-slate-200"
        @change="onFileChange"
      />
      <p class="mt-1 text-[11px] text-slate-500">
        {{ t('events.tickets.order.proof.fileHint') }}
      </p>
      <p v-if="fileError" class="mt-1 text-xs text-red-600">{{ fileError }}</p>
    </div>

    <!-- Transaction reference -->
    <div>
      <label class="block text-xs font-medium text-slate-700 mb-1">
        {{ t('events.tickets.order.proof.transactionRefLabel') }}
      </label>
      <input
        v-model="transactionReference"
        type="text"
        maxlength="120"
        :placeholder="t('events.tickets.order.proof.transactionRefPlaceholder')"
        class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
      />
    </div>

    <!-- Notes -->
    <div>
      <label class="block text-xs font-medium text-slate-700 mb-1">
        {{ t('events.tickets.order.proof.notesLabel') }}
      </label>
      <textarea
        v-model="buyerNotes"
        rows="2"
        maxlength="500"
        :placeholder="t('events.tickets.order.proof.notesPlaceholder')"
        class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 resize-y"
      />
    </div>

    <!-- Generic error -->
    <div v-if="submitError" class="rounded-lg bg-red-50 border border-red-200 p-3">
      <p class="text-sm text-red-800">{{ submitError }}</p>
    </div>

    <!-- Submit -->
    <button
      type="button"
      class="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
      :disabled="!canSubmit || isSubmitting"
      @click="submit"
    >
      <span
        v-if="isSubmitting"
        class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"
      />
      {{ isSubmitting ? t('events.tickets.order.proof.submitting') : t('events.tickets.order.proof.submit') }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Building2, QrCode, Link as LinkIcon, Copy, ExternalLink } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import {
  apiClient,
  paymentMethodsService,
  ticketOrdersService,
  type EventPaymentMethod,
  type TicketOrderDetail,
} from '@/services/api'

interface Props {
  eventId: string
  confirmationCode: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  /** Emitted with the updated order after a successful submit-proof call. */
  submitted: [order: TicketOrderDetail]
  message: [type: 'success' | 'error', text: string]
}>()

const { t } = useAppLanguage()

const methods = ref<EventPaymentMethod[]>([])
const rawMethodCount = ref(0)
const loadingMethods = ref(false)
const selectedMethodId = ref<number | null>(null)

const file = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const fileError = ref('')

const transactionReference = ref('')
const buyerNotes = ref('')

const isSubmitting = ref(false)
const submitError = ref('')

const ALLOWED_EXT = /\.(pdf|jpe?g|png|gif|webp)$/i
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

const formatPaymentMethod = (method: EventPaymentMethod['payment_method']): string => {
  switch (method) {
    case 'bank_transfer':
      return t('events.tickets.order.proof.methods.bank')
    case 'qr_code':
      return t('events.tickets.order.proof.methods.qr')
    case 'payment_url':
      return t('events.tickets.order.proof.methods.url')
    default:
      return method
  }
}

const resolveMediaUrl = (raw: string): string => {
  return apiClient.getProfilePictureUrl(raw) || raw
}

const selectedPaymentMethod = computed<EventPaymentMethod | null>(() => {
  if (selectedMethodId.value === null) return null
  return methods.value.find((m) => m.id === selectedMethodId.value) ?? null
})

const loadMethods = async () => {
  // Guard: a missing event id would be sent to the backend as the literal
  // string "undefined" and crash with a UUID ValidationError.
  if (!props.eventId) return
  loadingMethods.value = true
  try {
    const response = await paymentMethodsService.getPaymentMethods(props.eventId)
    if (response.success && response.data) {
      const raw = response.data
      // Endpoint may return either a paginated envelope or a bare array — handle both.
      const list: EventPaymentMethod[] = Array.isArray(raw)
        ? raw
        : (raw as { results?: EventPaymentMethod[] }).results ?? []
      rawMethodCount.value = list.length
      // Backend requires `payment_type === 'ticket_sales'` for ticket payments
      // (TICKETS_FRONTEND_GUIDE Backend Decision #2): the submit-proof endpoint
      // validates the chosen method belongs to this event AND is tagged for
      // ticket sales AND is active, otherwise rejects with `400 { payment_method }`.
      methods.value = list
        .filter((m) => m.is_active && m.payment_type === 'ticket_sales')
        .sort((a, b) => a.order - b.order)
    }
  } finally {
    loadingMethods.value = false
  }
}

onMounted(loadMethods)

const onFileChange = (event: globalThis.Event) => {
  fileError.value = ''
  const target = event.target as HTMLInputElement
  const picked = target.files?.[0]
  if (!picked) {
    file.value = null
    return
  }
  if (!ALLOWED_EXT.test(picked.name)) {
    fileError.value = t('events.tickets.order.proof.errors.fileType')
    file.value = null
    return
  }
  if (picked.size > MAX_BYTES) {
    fileError.value = t('events.tickets.order.proof.errors.fileSize')
    file.value = null
    return
  }
  file.value = picked
}

const copyAccountNumber = async () => {
  const num = selectedPaymentMethod.value?.account_number
  if (!num) return
  try {
    await navigator.clipboard.writeText(num)
    emit('message', 'success', t('events.tickets.order.proof.accountNumberCopied'))
  } catch {
    // Clipboard may be denied (insecure origin, permission); silent fail is fine.
  }
}

const canSubmit = computed(() => {
  return selectedMethodId.value !== null && file.value !== null
})

const submit = async () => {
  submitError.value = ''
  if (!canSubmit.value || !file.value || selectedMethodId.value === null) return

  isSubmitting.value = true
  try {
    const formData = new FormData()
    formData.append('payment_method', String(selectedMethodId.value))
    formData.append('payment_proof', file.value)
    if (transactionReference.value.trim()) {
      formData.append('transaction_reference', transactionReference.value.trim())
    }
    if (buyerNotes.value.trim()) {
      formData.append('buyer_notes', buyerNotes.value.trim())
    }

    const response = await ticketOrdersService.submitProof(
      props.confirmationCode,
      formData,
    )
    if (response.success && response.data) {
      emit('submitted', response.data)
      emit('message', 'success', t('events.tickets.order.proof.successMessage'))
    } else {
      submitError.value = response.message || t('events.tickets.order.proof.errors.submitFailed')
    }
  } catch {
    submitError.value = t('events.tickets.order.proof.errors.submitFailed')
  } finally {
    isSubmitting.value = false
  }
}
</script>
