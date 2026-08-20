<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          {{ t('management.templatePaymentTab.header.title') }}
        </h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1">
          {{ headerDescription }}
        </p>
      </div>

      <!-- Browsing lives in the Design Studio now, where a candidate template is
           previewed live on the organizer's own content before they commit. A
           second, plainer entry point here would only be the worse of two —
           so this is a link to that one, not a duplicate of it. -->
      <button
        v-if="canEdit && hasTemplate"
        type="button"
        @click="emit('change-template')"
        class="flex-shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white/70 border border-slate-200/70 rounded-xl shadow-sm hover:text-slate-900 hover:border-[#2ecc71]/40 hover:bg-white transition-all duration-200"
      >
        <Wand2 class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span class="hidden sm:inline">{{ t('management.activation.changeTemplate') }}</span>
        <span class="sm:hidden">{{ t('management.activation.changeTemplateShort') }}</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- No template yet: nothing to activate, and choosing one belongs in the
         studio — so this state's only job is to hand the organizer over. -->
    <div
      v-if="!hasTemplate"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <div
        class="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
      >
        <Palette class="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
      </div>
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">
        {{ t('management.activation.empty.title') }}
      </h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto">
        {{ t('management.activation.empty.description') }}
      </p>
      <button
        v-if="canEdit"
        @click="emit('change-template')"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center mx-auto text-sm sm:text-base"
      >
        <Wand2 class="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
        {{ t('management.activation.empty.cta') }}
      </button>
    </div>

    <!-- What was chosen, what it costs, how far activation has got. -->
    <TemplateActivationCard
      v-else
      :state="activationState"
      :resolved="activationResolved"
      :template="templateForCard"
      :can-preview="canPreview"
      :can-edit="canEdit"
      @activate="handleStartPayment"
      @open-studio="emit('open-studio')"
      @preview-video="openYoutubePreview"
    />

    <!-- Referrer Section -->
    <EventReferrerSection
      v-if="hasTemplate"
      :event-id="event.id"
      :can-edit="canEdit"
      :referrer-details="event?.referrer_details"
      :organizer-email="event?.organizer_details?.email"
      @referrer-updated="handleReferrerUpdated"
    />

    <!-- Billing record. Secondary to activation, so it sits last; the card above
         already reports the status that used to need its own panel. -->
    <PaymentHistoryList
      v-if="hasTemplate"
      :payments="payments"
      :loading="loadingPayments"
      @update-payment="startUpdatePayment"
    />

    <!-- Checkout — the same drawer the Design Studio's activation pill opens. -->
    <PaymentDrawer
      :open="showPaymentDrawer"
      :event-id="event.id"
      :template-package="templatePackage"
      :template-id="event.event_template ?? null"
      :template-name="templateName"
      :current-payment="currentPayment"
      @close="showPaymentDrawer = false"
      @submitted="refreshPayments"
    />

    <!-- Update Payment Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showUpdateModal"
          class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          @click="cancelUpdate"
        >
          <div
            class="bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col"
            @click.stop
          >
            <div
              class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 py-4 sm:px-8 sm:py-6 text-white flex-shrink-0"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div
                    class="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <Pencil class="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h2 class="text-lg sm:text-2xl font-bold truncate">
                    {{ t('management.templatePaymentTab.updateModal.title') }}
                  </h2>
                </div>
                <button
                  @click="cancelUpdate"
                  class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200 flex-shrink-0 ml-2"
                >
                  <X class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            <div class="p-4 sm:p-8 overflow-y-auto flex-1">
              <form @submit.prevent="updatePayment" class="space-y-4 sm:space-y-6">
                <div>
                  <label class="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                    {{ t('management.templatePaymentTab.updateModal.transactionRef') }}
                    <span class="text-slate-400"
                      >({{ t('management.templatePaymentTab.updateModal.optional') }})</span
                    >
                  </label>
                  <input
                    v-model="updateForm.transaction_reference"
                    type="text"
                    class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm text-sm sm:text-base"
                    :placeholder="t('management.templatePaymentTab.paymentDrawer.transactionRefPlaceholder')"
                  />
                </div>

                <div>
                  <label class="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                    {{ t('management.templatePaymentTab.updateModal.notes') }}
                  </label>
                  <textarea
                    v-model="updateForm.user_notes"
                    rows="3"
                    class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none text-sm sm:text-base"
                  ></textarea>
                </div>

                <div>
                  <label class="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5 sm:mb-2">
                    {{ t('management.templatePaymentTab.updateModal.proof') }}
                    <span class="text-slate-500"
                      >({{ t('management.templatePaymentTab.updateModal.optional') }})</span
                    >
                  </label>
                  <input
                    ref="updateFileInput"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                    @change="handleUpdateFileSelect"
                    class="w-full px-3 py-2 sm:px-4 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-3 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-[#E6F4FF] file:text-[#1873cc] hover:file:bg-[#B0E0E6] text-xs sm:text-base"
                  />
                </div>

                <div class="flex space-x-3 sm:space-x-4 pt-4 sm:pt-6">
                  <button
                    type="button"
                    @click="cancelUpdate"
                    class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-200 text-sm sm:text-base"
                  >
                    {{ t('management.templatePaymentTab.updateModal.cancelBtn') }}
                  </button>
                  <button
                    type="submit"
                    :disabled="updatingPayment"
                    class="flex-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2.5 sm:py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {{
                      updatingPayment
                        ? t('management.templatePaymentTab.updateModal.updating')
                        : t('management.templatePaymentTab.updateModal.updateBtn')
                    }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * Template activation & billing.
 *
 * This tab used to be "select a template, then pay for it". Selection moved to
 * the Design Studio, where a candidate is tried on live against the organizer's
 * own content — so what's left here is the half the studio can't own: turning a
 * previewed template into one guests can actually see, and keeping the record of
 * that transaction.
 *
 * The checkout itself lives in PaymentDrawer, shared with the studio's
 * activation pill, and the status shown here comes from useTemplateActivation so
 * the two views can't disagree about whether the showcase is live.
 */
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Palette, X, Pencil, Wand2, ArrowRight } from 'lucide-vue-next'
import { type Event, apiService } from '../services/api'
import EventReferrerSection from './EventReferrerSection.vue'
import PaymentHistoryList from './template/PaymentHistoryList.vue'
import PaymentDrawer from './template/PaymentDrawer.vue'
import TemplateActivationCard from './template/TemplateActivationCard.vue'
import { useTemplateActivation } from '../composables/useTemplateActivation'
import { useNotifications } from '../composables/useNotifications'
import { useTemplateLoader } from '../composables/useTemplateLoader'
import type { Payment, UpdateFormData } from '../types/payment'

interface Props {
  event: Event
  canEdit: boolean
  /** Whether this event's category has a Design Studio — drives whether the
   *  card offers a link to it under the template artwork. */
  canPreview?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'event-updated': [event: Event]
  /** Go to the Design Studio (keep designing). */
  'open-studio': []
  /** Go to the Design Studio and open its template browser. */
  'change-template': []
}>()

const { t } = useI18n()
const { success: showSuccess, error: showError } = useNotifications()

// Template details aren't always on the event payload (e.g. right after a
// selection elsewhere), so keep loading them separately and let the activation
// composable fall back to them.
const { selectedTemplateDetails, loadTemplateDetails, clearTemplate, setTemplateDetails } =
  useTemplateLoader()

const {
  state: activationState,
  isResolved: activationResolved,
  hasTemplate,
  canStartPayment,
  templateName,
  templatePackage,
  currentPayment,
  payments,
  loadingPayments,
  loadPayments,
  refreshPayments,
} = useTemplateActivation(
  () => props.event,
  () => selectedTemplateDetails.value,
)

const showPaymentDrawer = ref(false)
const showUpdateModal = ref(false)
const updatingPayment = ref(false)
const paymentToUpdate = ref<Payment | null>(null)
const updateFileInput = ref<HTMLInputElement | null>(null)

const updateForm = ref<UpdateFormData>({
  transaction_reference: '',
  user_notes: '',
  payment_proof: null,
})

const headerDescription = computed((): string => {
  // Until the payment rows land, `activationState` optimistically reads as
  // `unpaid` — say nothing about activation rather than telling someone whose
  // showcase is already live that it isn't.
  if (hasTemplate.value && !activationResolved.value) {
    return t('management.activation.header.descChecking')
  }

  switch (activationState.value) {
    case 'active':
      return t('management.templatePaymentTab.header.descActive')
    case 'pending':
      return t('management.activation.header.descPending')
    case 'unpaid':
      return t('management.templatePaymentTab.header.descPendingPayment')
    default:
      return t('management.templatePaymentTab.header.descNoTemplate')
  }
})

/** TemplateActivationCard wants the full template record, not just the plan. */
const templateForCard = computed(
  () => props.event.event_template_details ?? selectedTemplateDetails.value ?? null,
)

const templateIdAsString = computed((): string => {
  const id = props.event.event_template
  return typeof id === 'string' ? id : String(id || '')
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

const openYoutubePreview = (url: string): void => {
  if (!url) return

  let videoUrl = url
  if (url.includes('youtube.com/embed/')) {
    const videoId = url.split('embed/')[1]?.split('?')[0]
    if (videoId) videoUrl = `https://www.youtube.com/watch?v=${videoId}`
  }

  window.open(videoUrl, '_blank', 'noopener,noreferrer')
}

const initializeTemplateData = async (): Promise<void> => {
  if (!props.event.event_template) {
    clearTemplate()
    return
  }

  try {
    await loadTemplateDetails({
      templateId: templateIdAsString.value,
      eventId: props.event.id,
      existingDetails: props.event.event_template_details,
    })
  } catch (err) {
    console.error('Error initializing template data:', err)
    showError('Error', 'Failed to load template details. Please refresh the page.')
  }
}

const handleStartPayment = () => {
  if (!canStartPayment.value) {
    showError(
      'Payment in progress',
      'Please wait for the current payment to be confirmed or rejected before submitting a new payment.',
    )
    return
  }
  showPaymentDrawer.value = true
}

// ---------------------------------------------------------------------------
// Updating an already-submitted payment (from the history list) — the one
// payment operation that isn't part of checkout, so it stays here rather than
// moving into the shared drawer.
// ---------------------------------------------------------------------------
const validateTransactionReference = (reference: string): string | null => {
  const sanitized = sanitizeInput(reference)
  if (!sanitized || sanitized.length < 3) {
    return 'Transaction reference must be at least 3 characters long'
  }
  if (sanitized.length > 100) {
    return 'Transaction reference must be less than 100 characters'
  }
  if (!/^[a-zA-Z0-9\-_\s]+$/.test(sanitized)) {
    return 'Transaction reference can only contain letters, numbers, dashes, underscores, and spaces'
  }
  return null
}

const validateFile = (file: File): string | null => {
  const maxSize = 10 * 1024 * 1024
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ]

  if (file.size > maxSize) return 'File size must be less than 10MB'
  if (!allowedTypes.includes(file.type)) {
    return 'File type not allowed. Please use JPG, PNG, GIF, WebP, or PDF files'
  }
  return null
}

const handleUpdateFileSelect = (event: globalThis.Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null

  if (file) {
    const validationError = validateFile(file)
    if (validationError) {
      showError('Error', validationError)
      target.value = ''
      return
    }
  }

  updateForm.value.payment_proof = file
}

const startUpdatePayment = (payment: Payment) => {
  paymentToUpdate.value = payment
  updateForm.value = {
    transaction_reference: payment.transaction_reference,
    user_notes: payment.user_notes || '',
    payment_proof: null,
  }
  showUpdateModal.value = true
}

const updatePayment = async (): Promise<void> => {
  if (!paymentToUpdate.value || updatingPayment.value) return

  if (updateForm.value.transaction_reference.trim()) {
    const transactionRefError = validateTransactionReference(updateForm.value.transaction_reference)
    if (transactionRefError) {
      showError('Error', transactionRefError)
      return
    }
  }

  if (updateForm.value.payment_proof) {
    const fileError = validateFile(updateForm.value.payment_proof)
    if (fileError) {
      showError('Error', fileError)
      return
    }
  }

  updatingPayment.value = true

  try {
    const formData = new FormData()

    if (updateForm.value.transaction_reference.trim()) {
      formData.append(
        'transaction_reference',
        sanitizeInput(updateForm.value.transaction_reference),
      )
    }

    if (updateForm.value.user_notes.trim()) {
      formData.append('user_notes', sanitizeInput(updateForm.value.user_notes))
    }

    if (updateForm.value.payment_proof) {
      formData.append('payment_proof', updateForm.value.payment_proof)
    }

    const response = await apiService.patchFormData<Payment>(
      `/api/payment/payments/${sanitizeInput(paymentToUpdate.value.id)}/`,
      formData,
    )

    if (!response.success) {
      throw new Error(response.message || 'Failed to update payment')
    }

    showUpdateModal.value = false
    paymentToUpdate.value = null
    await refreshPayments()

    showSuccess('Payment Updated', 'Your payment details have been updated successfully.')
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Error updating payment. Please try again.'
    console.error('Error updating payment:', err)
    showError('Update Failed', errorMessage)
  } finally {
    updatingPayment.value = false
  }
}

const cancelUpdate = () => {
  showUpdateModal.value = false
  paymentToUpdate.value = null
  updateForm.value = {
    transaction_reference: '',
    user_notes: '',
    payment_proof: null,
  }
  if (updateFileInput.value) updateFileInput.value.value = ''
}

const handleReferrerUpdated = (updatedEvent: unknown) => {
  if (props.event && updatedEvent && typeof updatedEvent === 'object') {
    emit('event-updated', updatedEvent as Event)
  }
}

watch(
  () => ({ templateId: props.event.event_template, eventId: props.event.id }),
  async (newData, oldData) => {
    if (newData.templateId !== oldData?.templateId || newData.eventId !== oldData?.eventId) {
      await initializeTemplateData()
    }
  },
  { immediate: true },
)

watch(
  () => props.event.event_template_details,
  (newDetails) => {
    if (newDetails) setTemplateDetails(newDetails)
  },
  { immediate: true },
)

onMounted(async () => {
  await nextTick()
  await Promise.allSettled([initializeTemplateData(), loadPayments()])
})

// Kept for the guest-management tab's "activate to send invitations" shortcut,
// which switches to this tab and opens checkout in one step.
defineExpose({
  openPaymentModal: () => handleStartPayment(),
})
</script>

<style scoped>
/* Modal transition for Update Payment modal */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
