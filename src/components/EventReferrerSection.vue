<template>
  <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-bold text-slate-900 flex items-center">
          <UserPlus class="w-5 h-5 text-[#1e90ff] mr-2" />
          Event Referrer
        </h3>
        <p class="text-sm text-slate-600 mt-1">Manage who referred this event</p>
      </div>
    </div>

    <!-- Current Referrer Display -->
    <div v-if="referrerDetails && !isEditing" class="mb-4">
      <div
        class="p-4 bg-gradient-to-br from-emerald-50 to-sky-50 rounded-2xl border border-[#87CEEB]/50"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-[#B0E0E6] flex items-center justify-center">
              <User class="w-5 h-5 text-[#1e90ff]" />
            </div>
            <div>
              <p class="font-semibold text-slate-900">
                {{ referrerDetails.first_name }} {{ referrerDetails.last_name }}
              </p>
              <p class="text-sm text-slate-600">{{ referrerDetails.email }}</p>
            </div>
          </div>
          <div v-if="canEdit" class="flex items-center space-x-2">
            <button
              @click="startEditing"
              class="p-2 text-[#1e90ff] hover:bg-[#B0E0E6] rounded-lg transition-colors"
              title="Edit referrer"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              @click="confirmRemoveReferrer"
              class="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              title="Remove referrer"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- No Referrer State -->
    <div v-else-if="!referrerDetails && !isEditing" class="mb-4">
      <div class="p-8 bg-slate-50/50 rounded-2xl border border-slate-200/50 text-center">
        <UserX class="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p class="text-slate-600 mb-4">No referrer has been set for this event</p>
        <button
          v-if="canEdit"
          @click="startEditing"
          class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 inline-flex items-center"
        >
          <UserPlus class="w-4 h-4 mr-2" />
          Add Referrer
        </button>
      </div>
    </div>

    <!-- Edit/Add Referrer Form -->
    <div v-if="isEditing" class="mb-4">
      <form @submit.prevent="saveReferrer" class="space-y-4">
        <div>
          <label for="referrerEmail" class="block text-sm font-medium text-slate-700 mb-2">
            Referrer Email <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              id="referrerEmail"
              v-model="referrerEmail"
              type="email"
              required
              :disabled="isSaving"
              class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm disabled:opacity-50"
              placeholder="Enter referrer's email address"
            />
            <Mail
              class="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            />
          </div>
          <p class="text-xs text-slate-500 mt-1">The referrer must have an account in the system</p>
          <p v-if="error" class="text-xs text-red-600 mt-1">{{ error }}</p>
        </div>

        <div class="flex space-x-3">
          <button
            type="button"
            @click="cancelEditing"
            :disabled="isSaving"
            class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSaving || !referrerEmail"
            class="flex-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 inline-flex items-center justify-center"
          >
            <span v-if="isSaving" class="flex items-center">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </span>
            <span v-else class="flex items-center">
              <Check class="w-4 h-4 mr-2" />
              {{ referrerDetails ? 'Update' : 'Add' }} Referrer
            </span>
          </button>
        </div>
      </form>
    </div>

    <!-- Referrer Benefits Info -->
    <div class="mt-6 p-4 bg-[#E6F4FF]/50 rounded-xl border border-[#87CEEB]/50">
      <div class="flex items-start space-x-3">
        <Info class="w-5 h-5 text-[#1e90ff] flex-shrink-0 mt-0.5" />
        <div class="text-sm text-slate-700">
          <p class="font-medium mb-1">About Event Referrers</p>
          <p>
            Referrers help promote your event and may receive special benefits or commissions based
            on your agreement.
          </p>
        </div>
      </div>
    </div>

    <!-- Remove Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showRemoveConfirm"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
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
                Remove Referrer?
              </h3>
              <p class="text-sm text-slate-600 text-center mb-6">
                Are you sure you want to remove
                <span class="font-medium"
                  >{{ referrerDetails?.first_name }} {{ referrerDetails?.last_name }}</span
                >
                as the referrer for this event?
              </p>
              <div class="flex space-x-3">
                <button
                  @click="cancelRemove"
                  class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  @click="removeReferrer"
                  :disabled="isRemoving"
                  class="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200"
                >
                  {{ isRemoving ? 'Removing...' : 'Remove' }}
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

const { success: showSuccess, error: showError } = useNotifications()

// State
const isEditing = ref(false)
const isSaving = ref(false)
const isRemoving = ref(false)
const showRemoveConfirm = ref(false)
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
    error.value = 'Please enter a valid email address'
    return
  }

  // Check if email is the same as organizer
  if (
    props.organizerEmail &&
    referrerEmail.value.toLowerCase() === props.organizerEmail.toLowerCase()
  ) {
    error.value = 'Referrer cannot be the same as the event organizer'
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
        props.referrerDetails ? 'Referrer Updated' : 'Referrer Added',
        `${props.referrerDetails ? 'Updated' : 'Added'} referrer successfully`,
      )

      // Log the response to debug
      console.log('Referrer update response:', response.data)

      // If the response doesn't include referrer_details, fetch the full event
      if (!response.data.referrer_details && response.data.referrer) {
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
      error.value = apiError.message || 'Failed to update referrer. Please try again.'
    }

    showError('Update Failed', error.value)
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
      showSuccess('Referrer Removed', 'Referrer has been removed from this event')
      emit('referrer-updated', { ...response.data, referrer_details: null })
      showRemoveConfirm.value = false
    } else {
      throw new Error(response.message || 'Failed to remove referrer')
    }
  } catch (err) {
    console.error('Error removing referrer:', err)
    const apiError = err as { message?: string }
    const errorMessage = apiError.message || 'Failed to remove referrer. Please try again.'
    showError('Remove Failed', errorMessage)
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
</style>
