<template>
  <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
    <div class="flex items-center justify-between gap-2 mb-3">
      <h3 class="text-base sm:text-lg font-bold text-slate-900 flex items-center min-w-0">
        <UserPlus class="w-4 h-4 sm:w-5 sm:h-5 text-[#1e90ff] mr-1.5 sm:mr-2 flex-shrink-0" />
        <span class="truncate">{{ t('management.eventReferrerSection.title') }}</span>
      </h3>
      <button
        type="button"
        @click="showInfo = !showInfo"
        class="p-1.5 text-slate-400 hover:text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors flex-shrink-0"
        :aria-label="t('management.eventReferrerSection.info.title')"
        :aria-expanded="showInfo"
      >
        <Info class="w-4 h-4" />
      </button>
    </div>

    <!-- Current Referrer Display -->
    <div
      v-if="referrerDetails && !isEditing"
      class="bg-white rounded-2xl border border-slate-200 overflow-hidden"
    >
      <div class="flex items-center gap-3 p-3 min-h-[56px]">
        <div class="w-10 h-10 rounded-full bg-[#B0E0E6] flex items-center justify-center flex-shrink-0">
          <User class="w-5 h-5 text-[#1e90ff]" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-900 truncate">
            {{ referrerDetails.first_name }} {{ referrerDetails.last_name }}
          </p>
          <p class="text-xs sm:text-sm text-slate-500 truncate">{{ referrerDetails.email }}</p>
        </div>
        <div v-if="canEdit" class="flex items-center gap-1 flex-shrink-0">
          <button
            @click="startEditing"
            class="p-2 text-slate-400 hover:text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors"
            :title="t('management.eventReferrerSection.editTitle')"
            :aria-label="t('management.eventReferrerSection.editTitle')"
          >
            <Pencil class="w-4 h-4" />
          </button>
          <button
            @click="confirmRemoveReferrer"
            class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            :title="t('management.eventReferrerSection.removeTitle')"
            :aria-label="t('management.eventReferrerSection.removeTitle')"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- No Referrer State (editable) -->
    <button
      v-else-if="!referrerDetails && !isEditing && canEdit"
      type="button"
      @click="startEditing"
      class="w-full flex items-center gap-3 p-3 min-h-[56px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-emerald-50/50 hover:border-emerald-300 active:bg-emerald-50 transition-colors text-left group"
    >
      <div
        class="w-9 h-9 rounded-full bg-white border border-slate-200 group-hover:border-emerald-300 flex items-center justify-center flex-shrink-0 transition-colors"
      >
        <UserPlus class="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-700 group-hover:text-emerald-700 transition-colors">
          {{ t('management.eventReferrerSection.addReferrerBtn') }}
        </p>
        <p class="text-xs text-slate-500 truncate">{{ t('management.eventReferrerSection.noReferrer') }}</p>
      </div>
      <ChevronRight
        class="w-4 h-4 text-slate-300 group-hover:text-emerald-500 flex-shrink-0 transition-colors"
      />
    </button>

    <!-- No Referrer State (read-only) -->
    <div
      v-else-if="!referrerDetails && !isEditing"
      class="flex items-center gap-3 p-3 min-h-[56px] rounded-2xl border border-slate-200 bg-slate-50/50"
    >
      <div class="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
        <UserX class="w-4 h-4 text-slate-400" />
      </div>
      <p class="text-sm text-slate-500">{{ t('management.eventReferrerSection.noReferrer') }}</p>
    </div>

    <!-- Edit/Add Referrer Form -->
    <div v-if="isEditing">
      <form @submit.prevent="saveReferrer" class="space-y-4">
        <div>
          <label for="referrerEmail" class="block text-sm font-medium text-slate-700 mb-2">
            {{ t('management.eventReferrerSection.form.emailLabel') }} <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              id="referrerEmail"
              v-model="referrerEmail"
              type="email"
              required
              :disabled="isSaving"
              class="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm disabled:opacity-50"
              :placeholder="t('management.eventReferrerSection.form.emailPlaceholder')"
            />
            <Mail
              class="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            />
          </div>
          <p class="text-xs text-slate-500 mt-1">{{ t('management.eventReferrerSection.form.emailHint') }}</p>
          <p v-if="error" class="text-xs text-red-600 mt-1">{{ error }}</p>
        </div>

        <div class="flex space-x-2 sm:space-x-3">
          <button
            type="button"
            @click="cancelEditing"
            :disabled="isSaving"
            class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
          >
            {{ t('management.eventReferrerSection.form.cancelBtn') }}
          </button>
          <button
            type="submit"
            :disabled="isSaving || !referrerEmail"
            class="flex-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 inline-flex items-center justify-center text-sm sm:text-base"
          >
            <span v-if="isSaving" class="flex items-center">
              <div class="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-white mr-1.5 sm:mr-2"></div>
              <span class="hidden sm:inline">{{ t('management.eventReferrerSection.form.savingLong') }}</span>
              <span class="sm:hidden">{{ t('management.eventReferrerSection.form.savingShort') }}</span>
            </span>
            <span v-else class="flex items-center">
              <Check class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span class="hidden sm:inline">{{ referrerDetails ? t('management.eventReferrerSection.form.updateReferrer') : t('management.eventReferrerSection.form.addReferrer') }}</span>
              <span class="sm:hidden">{{ referrerDetails ? t('management.eventReferrerSection.form.update') : t('management.eventReferrerSection.form.add') }}</span>
            </span>
          </button>
        </div>
      </form>
    </div>

    <!-- Referrer Benefits Info (collapsible) -->
    <Transition name="collapse">
      <div v-if="showInfo" class="grid grid-rows-[1fr]">
        <div class="min-h-0 overflow-hidden">
          <div class="pt-3">
            <div class="p-3 bg-[#E6F4FF]/50 rounded-xl border border-[#87CEEB]/50 flex items-start gap-2.5">
              <Info class="w-4 h-4 text-[#1e90ff] flex-shrink-0 mt-0.5" />
              <div class="text-xs sm:text-sm text-slate-700">
                <p>{{ t('management.eventReferrerSection.info.body') }}</p>
                <p class="italic text-slate-500 mt-1">{{ t('management.eventReferrerSection.info.note') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Remove Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showRemoveConfirm"
          class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          @click="cancelRemove"
        >
          <div
            class="bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            @click.stop
          >
            <div class="p-6">
              <div
                class="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4"
              >
                <AlertTriangle class="w-6 h-6 text-red-600" />
              </div>
              <h3 class="text-lg font-semibold text-slate-900 text-center mb-2">
                {{ t('management.eventReferrerSection.removeModal.title') }}
              </h3>
              <p class="text-sm text-slate-600 text-center mb-6">
                {{ t('management.eventReferrerSection.removeModal.body', { name: `${referrerDetails?.first_name} ${referrerDetails?.last_name}` }) }}
              </p>
              <div class="flex space-x-3">
                <button
                  @click="cancelRemove"
                  class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-xl transition-all duration-200"
                >
                  {{ t('management.eventReferrerSection.removeModal.cancelBtn') }}
                </button>
                <button
                  @click="removeReferrer"
                  :disabled="isRemoving"
                  class="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200"
                >
                  {{ isRemoving ? t('management.eventReferrerSection.removeModal.removingBtn') : t('management.eventReferrerSection.removeModal.removeBtn') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  UserPlus,
  User,
  UserX,
  Pencil,
  Trash2,
  Check,
  Mail,
  Info,
  AlertTriangle,
  ChevronRight,
} from 'lucide-vue-next'
import { apiService } from '../services/api'
import { useNotifications } from '../composables/useNotifications'

interface Props {
  eventId: string
  canEdit?: boolean
  referrerDetails?: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
  } | null
  organizerEmail?: string
}

interface EventUpdatePayload {
  referrer_email?: string
  referrer?: number | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'referrer-updated': [referrerDetails: unknown]
}>()

const { t } = useI18n()
const { success: showSuccess, error: showError } = useNotifications()

// State
const isEditing = ref(false)
const isSaving = ref(false)
const isRemoving = ref(false)
const showRemoveConfirm = ref(false)
const showInfo = ref(false)
const referrerEmail = ref('')
const error = ref('')

// Methods
const startEditing = () => {
  isEditing.value = true
  referrerEmail.value = props.referrerDetails?.email || ''
  error.value = ''
}

const cancelEditing = () => {
  isEditing.value = false
  referrerEmail.value = ''
  error.value = ''
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const saveReferrer = async () => {
  if (!referrerEmail.value || isSaving.value) return

  // Validate email format
  if (!validateEmail(referrerEmail.value)) {
    error.value = t('management.eventReferrerSection.notifications.invalidEmail')
    return
  }

  isSaving.value = true
  error.value = ''

  try {
    const payload: EventUpdatePayload = {
      referrer_email: referrerEmail.value,
    }

    const response = await apiService.patch(`/api/events/${props.eventId}/`, payload)

    if (response.success && response.data) {
      showSuccess(
        props.referrerDetails
          ? t('management.eventReferrerSection.notifications.referrerUpdatedTitle')
          : t('management.eventReferrerSection.notifications.referrerAddedTitle'),
        props.referrerDetails
          ? t('management.eventReferrerSection.notifications.referrerUpdatedBody')
          : t('management.eventReferrerSection.notifications.referrerAddedBody'),
      )

      // Log the response to debug
      console.log('Referrer update response:', response.data)

      // If the response doesn't include referrer_details, fetch the full event
      if (!(response.data as any)?.referrer_details && (response.data as any)?.referrer) {
        try {
          const fullEventResponse = await apiService.get(`/api/events/${props.eventId}/`)
          if (fullEventResponse.success && fullEventResponse.data) {
            console.log('Full event fetched:', fullEventResponse.data)
            emit('referrer-updated', fullEventResponse.data)
          } else {
            emit('referrer-updated', response.data)
          }
        } catch (fetchError) {
          console.error('Error fetching full event:', fetchError)
          emit('referrer-updated', response.data)
        }
      } else {
        emit('referrer-updated', response.data)
      }

      cancelEditing()
    } else {
      throw new Error(response.message || 'Failed to update referrer')
    }
  } catch (err) {
    console.error('Error updating referrer:', err)

    // Handle specific error messages from the API
    const apiError = err as {
      response?: { data?: { referrer_email?: string[]; detail?: string } }
      message?: string
    }
    if (apiError.response?.data?.referrer_email) {
      error.value = apiError.response.data.referrer_email[0]
    } else if (apiError.response?.data?.detail) {
      error.value = apiError.response.data.detail
    } else {
      error.value = apiError.message || t('management.eventReferrerSection.notifications.failedToUpdate')
    }

    showError(t('management.eventReferrerSection.notifications.updateFailedTitle'), error.value)
  } finally {
    isSaving.value = false
  }
}

const confirmRemoveReferrer = () => {
  showRemoveConfirm.value = true
}

const cancelRemove = () => {
  showRemoveConfirm.value = false
}

const removeReferrer = async () => {
  if (isRemoving.value) return

  isRemoving.value = true

  try {
    // Try setting referrer field directly to null instead of using referrer_email
    const payload: EventUpdatePayload = {
      referrer: null,
    }

    const response = await apiService.patch(`/api/events/${props.eventId}/`, payload)

    if (response.success) {
      showSuccess(
        t('management.eventReferrerSection.notifications.referrerRemovedTitle'),
        t('management.eventReferrerSection.notifications.referrerRemovedBody'),
      )
      emit('referrer-updated', { ...(response.data || {}), referrer_details: null })
      showRemoveConfirm.value = false
    } else {
      throw new Error(response.message || 'Failed to remove referrer')
    }
  } catch (err) {
    console.error('Error removing referrer:', err)
    const apiError = err as { message?: string }
    const errorMessage = apiError.message || t('management.eventReferrerSection.notifications.failedToRemove')
    showError(t('management.eventReferrerSection.notifications.removeFailedTitle'), errorMessage)
  } finally {
    isRemoving.value = false
  }
}

// Watch for external changes to referrer details
watch(
  () => props.referrerDetails,
  () => {
    if (isEditing.value) {
      cancelEditing()
    }
  },
)
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: all 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}

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
    transition: opacity 0.2s ease;
  }
}
</style>
