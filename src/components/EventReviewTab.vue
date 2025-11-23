<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          Event Review
        </h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1">
          Share your experience hosting this event on GoEvent
        </p>
      </div>
      <button
        @click="loadReview"
        class="bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl p-2 hover:bg-white/90 transition-all duration-200 hover:scale-[1.02] shadow-lg"
        :disabled="loading"
      >
        <RefreshCw class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" :class="{ 'animate-spin': loading }" />
      </button>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8"
    >
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff]"></div>
        <span class="ml-2 sm:ml-3 text-xs sm:text-sm text-slate-600">Loading review...</span>
      </div>
    </div>

    <!-- Review Form/Display -->
    <div v-else class="space-y-4">
      <!-- Existing Review Display (if user has already reviewed) -->
      <div
        v-if="existingReview && !isEditing"
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-600 to-sky-600 rounded-full flex items-center justify-center text-white font-bold text-sm"
            >
              {{ getInitials(existingReview.user_info.first_name, existingReview.user_info.last_name) }}
            </div>
            <div>
              <h3 class="font-semibold text-slate-900">
                {{ displayUserName }}
              </h3>
              <p class="text-xs text-slate-500">
                {{ formattedReviewDate }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="startEdit"
              class="text-[#1e90ff] hover:text-[#1873cc] p-2 rounded-lg hover:bg-[#E6F4FF] transition-colors"
              title="Edit review"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              @click="confirmDelete"
              class="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete review"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Star Rating Display -->
        <div class="flex items-center mb-3">
          <div class="flex space-x-1">
            <Star
              v-for="star in 5"
              :key="star"
              class="w-5 h-5"
              :class="star <= existingReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'"
            />
          </div>
          <span class="ml-2 text-sm font-medium text-slate-700">
            {{ existingReview.rating }} out of 5 stars
          </span>
        </div>

        <!-- Review Text -->
        <p class="text-slate-700 leading-relaxed whitespace-pre-wrap">{{ sanitizedReviewText }}</p>
      </div>

      <!-- Review Form (Create or Edit) -->
      <div
        v-else
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6"
      >
        <form @submit.prevent="submitReview" class="space-y-4">
          <!-- Rating Selection -->
          <div>
            <label class="block text-sm font-semibold text-slate-900 mb-2">
              Rate your hosting experience
              <span class="text-red-500">*</span>
            </label>
            <div class="flex items-center space-x-2">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                @click="formData.rating = star"
                @mouseenter="hoverRating = star"
                @mouseleave="hoverRating = 0"
                class="transition-transform hover:scale-110"
              >
                <Star
                  class="w-8 h-8"
                  :class="
                    star <= (hoverRating || formData.rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-slate-300'
                  "
                />
              </button>
              <span v-if="formData.rating" class="ml-2 text-sm font-medium text-slate-700">
                {{ formData.rating }} out of 5 stars
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              Rate the GoEvent platform's tools, features, and support
            </p>
            <p v-if="errors.rating" class="text-xs text-red-600 mt-1">{{ errors.rating }}</p>
          </div>

          <!-- Review Text -->
          <div>
            <label for="review-text" class="block text-sm font-semibold text-slate-900 mb-2">
              Your feedback
              <span class="text-red-500">*</span>
            </label>
            <textarea
              id="review-text"
              v-model="formData.review_text"
              rows="6"
              placeholder="Share your experience hosting this event on GoEvent. How were the planning tools? Was the support helpful? Any suggestions for improvement?"
              class="w-full px-4 py-3 bg-white/60 backdrop-blur-md border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff]/30 transition-all duration-200 text-sm resize-none text-slate-800 placeholder-slate-400"
              :class="{ 'border-red-300 focus:ring-red-500': errors.review_text }"
            ></textarea>
            <p class="text-xs text-slate-500 mt-1">
              Tell us about your experience with GoEvent's platform and services
            </p>
            <p v-if="errors.review_text" class="text-xs text-red-600 mt-1">{{ errors.review_text }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end space-x-3 pt-2">
            <button
              v-if="isEditing"
              type="button"
              @click="cancelEdit"
              class="px-4 py-2 text-sm font-medium text-slate-700 bg-white/60 border border-white/30 rounded-xl hover:bg-white/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <span v-if="submitting" class="flex items-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {{ isEditing ? 'Updating...' : 'Submitting...' }}
              </span>
              <span v-else class="flex items-center">
                <Send class="w-4 h-4 mr-2" />
                {{ isEditing ? 'Update Review' : 'Submit Review' }}
              </span>
            </button>
          </div>
        </form>
      </div>

      <!-- Info Card -->
      <div class="bg-blue-50/80 backdrop-blur-sm border border-blue-100 rounded-2xl p-4">
        <div class="flex items-start space-x-3">
          <Info class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div class="text-sm text-blue-900">
            <p class="font-semibold mb-1">About Event Reviews</p>
            <p class="text-blue-800">
              Your review helps us improve GoEvent's platform and services. Share your honest feedback
              about the event creation tools, guest management features, showcase templates, and any
              support you received. You can edit or delete your review at any time.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-20 lg:bottom-4 right-6 z-50">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-6 py-4 rounded-xl shadow-lg flex items-center"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 mr-2" />
          <AlertCircle v-else class="w-5 h-5 mr-2" />
          {{ message.text }}
        </div>
      </div>
    </Transition>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteConfirm"
      title="Delete Review"
      message="Are you sure you want to delete your review? You can always submit a new review later."
      :loading="deleting"
      @confirm="deleteReview"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {
  Star,
  RefreshCw,
  Pencil,
  Trash2,
  Send,
  Info,
  CheckCircle,
  AlertCircle,
} from 'lucide-vue-next'
import { reviewsService, type EventReview } from '../services/api'
import { useAuthStore } from '@/stores/auth'
import { sanitizePlainText } from '@/utils/sanitize'
import { inputValidator } from '@/utils/inputValidation'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()

// Auth store
const authStore = useAuthStore()

// State
const loading = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const existingReview = ref<EventReview | null>(null)
const isEditing = ref(false)
const hoverRating = ref(0)
const showDeleteConfirm = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Form data
const formData = ref({
  rating: 0,
  review_text: '',
})

const errors = ref<Record<string, string>>({})
const messageTimeout = ref<number | null>(null)

// Computed properties
const sanitizedReviewText = computed(() => {
  if (!existingReview.value) return ''
  return sanitizePlainText(existingReview.value.review_text, 5000)
})

const displayUserName = computed(() => {
  if (!existingReview.value?.user_info) return 'Unknown User'

  const firstName = existingReview.value.user_info.first_name || ''
  const lastName = existingReview.value.user_info.last_name || ''
  const username = existingReview.value.user_info.username || 'User'

  // Show first + last name if available, otherwise username
  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim()
  }
  return username
})

const formattedReviewDate = computed(() => {
  if (!existingReview.value) return ''
  const date = new Date(existingReview.value.created_at)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

// Load existing review
const loadReview = async () => {
  if (!props.canEdit) return

  const userId = authStore.user?.id
  if (!userId) {
    console.warn('Cannot load review: user not authenticated')
    return
  }

  loading.value = true
  errors.value = {}

  try {
    const userReview = await reviewsService.getUserReview(props.eventId, userId)
    existingReview.value = userReview
  } catch (error) {
    console.error('Failed to load review:', error)
  } finally {
    loading.value = false
  }
}

// Start editing
const startEdit = () => {
  if (!existingReview.value) return

  formData.value = {
    rating: existingReview.value.rating,
    review_text: existingReview.value.review_text,
  }
  isEditing.value = true
  errors.value = {}
}

// Cancel editing
const cancelEdit = () => {
  isEditing.value = false
  formData.value = {
    rating: 0,
    review_text: '',
  }
  errors.value = {}
}

// Validate form with comprehensive checks
const validateForm = (): boolean => {
  errors.value = {}

  // Validate rating
  if (!formData.value.rating || formData.value.rating < 1 || formData.value.rating > 5) {
    errors.value.rating = 'Please select a rating between 1 and 5 stars'
  }

  // Validate review text using inputValidator
  const reviewValidation = inputValidator.validateText(formData.value.review_text, {
    required: true,
    minLength: 10,
    maxLength: 5000,
    sanitize: false, // Don't sanitize yet - we'll send raw to backend
  })

  if (!reviewValidation.isValid) {
    errors.value.review_text = reviewValidation.errors[0]
  }

  return Object.keys(errors.value).length === 0
}

// Submit review (create or update)
const submitReview = async () => {
  if (!validateForm()) return

  submitting.value = true
  errors.value = {}

  try {
    let response

    if (isEditing.value && existingReview.value) {
      // Update existing review
      response = await reviewsService.updateReview(existingReview.value.id, {
        rating: formData.value.rating,
        review_text: formData.value.review_text,
      })
    } else {
      // Create new review
      response = await reviewsService.createReview({
        event: props.eventId,
        rating: formData.value.rating,
        review_text: formData.value.review_text,
      })
    }

    if (response.success && response.data) {
      // Capture editing state BEFORE mutation
      const wasEditing = isEditing.value

      existingReview.value = response.data
      isEditing.value = false
      formData.value = {
        rating: 0,
        review_text: '',
      }
      showMessage('success', wasEditing ? 'Review updated successfully!' : 'Review submitted successfully!')
    } else {
      // Handle validation errors
      if (response.errors) {
        Object.entries(response.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            errors.value[field] = messages[0]
          }
        })
      }
      showMessage('error', response.message || 'Failed to submit review')
    }
  } catch (error) {
    console.error('Failed to submit review:', error)
    showMessage('error', 'An error occurred while submitting your review')
  } finally {
    submitting.value = false
  }
}

// Confirm delete
const confirmDelete = () => {
  showDeleteConfirm.value = true
}

// Delete review
const deleteReview = async () => {
  if (!existingReview.value) return

  deleting.value = true

  try {
    const response = await reviewsService.deleteReview(existingReview.value.id)

    if (response.success) {
      existingReview.value = null
      isEditing.value = false
      showDeleteConfirm.value = false
      formData.value = {
        rating: 0,
        review_text: '',
      }
      showMessage('success', 'Review deleted successfully')
    } else {
      showMessage('error', response.message || 'Failed to delete review')
    }
  } catch (error) {
    console.error('Failed to delete review:', error)
    showMessage('error', 'An error occurred while deleting your review')
  } finally {
    deleting.value = false
  }
}

// Helper: Get user initials with proper null handling
const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return `${first}${last}` || 'U'
}

// Helper: Show message with cleanup
const showMessage = (type: 'success' | 'error', text: string) => {
  // Clear any existing timeout
  if (messageTimeout.value) {
    clearTimeout(messageTimeout.value)
  }

  message.value = { type, text }
  messageTimeout.value = window.setTimeout(() => {
    message.value = null
    messageTimeout.value = null
  }, 5000)
}

// Lifecycle
onMounted(() => {
  loadReview()
})

onUnmounted(() => {
  // Clear message timeout to prevent memory leak
  if (messageTimeout.value) {
    clearTimeout(messageTimeout.value)
  }
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
