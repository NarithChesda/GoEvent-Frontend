<template>
  <div>
    <!-- Panel. Two icon buttons used to sit in this header: an Info toggle hiding
         a sixty-word paragraph, and a manual Refresh for a single record the user
         wrote themselves. Both were chrome standing in for something missing —
         the guidance belongs beside the fields it is about (it is already there,
         as their hints), and a refresh button is not an error state. So the
         paragraph and the toggle are gone, and a failed load now says so and
         offers the retry, which is what the Refresh was silently for. -->
    <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
      <h2 class="text-base font-semibold text-slate-900 truncate mb-4">
        {{ existingReview && !isEditing ? t('management.reviewTab.yourReview') : t('management.reviewTab.title') }}
      </h2>

      <!-- Loading -->
      <div v-if="loading" class="space-y-3" aria-hidden="true">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
          <div class="flex-1 min-w-0 space-y-1.5">
            <div class="h-3.5 w-32 max-w-full rounded bg-slate-200 animate-pulse" />
            <div class="h-3 w-24 max-w-full rounded bg-slate-100 animate-pulse" />
          </div>
        </div>
        <div class="h-3.5 w-full rounded bg-slate-100 animate-pulse" />
        <div class="h-3.5 w-2/3 rounded bg-slate-100 animate-pulse" />
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="text-center py-8">
        <div class="w-12 h-12 mx-auto rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle class="w-6 h-6 text-red-500" />
        </div>
        <p class="mt-3 text-sm font-medium text-slate-900">{{ t('management.reviewTab.error.title') }}</p>
        <button
          type="button"
          @click="loadReview"
          class="mt-3 min-h-[40px] px-4 text-sm font-semibold text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors"
        >
          {{ t('management.reviewTab.error.tryAgain') }}
        </button>
      </div>

      <!-- Existing review. This is your own review under a heading that already
           says "Your Review", so it no longer shows you your own face and name
           back — three lines of chrome identifying the one person guaranteed to
           be reading it. What is left is what you wrote and when: the stars, the
           text, the date. The stars are also the only rating readout; the
           "4 out of 5 stars" line beside them said what five stars already say,
           and survives where it is actually needed, as the group's aria-label. -->
      <div v-else-if="existingReview && !isEditing">
        <div class="flex items-start justify-between gap-3">
          <div
            class="flex gap-0.5 pt-0.5"
            role="img"
            :aria-label="t('management.reviewTab.ratingDisplay', { rating: existingReview.rating })"
          >
            <Star
              v-for="star in 5"
              :key="star"
              class="w-5 h-5"
              :class="star <= existingReview.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'"
              aria-hidden="true"
            />
          </div>
          <div v-if="canEdit" class="flex items-center flex-shrink-0 -mr-2 -mt-2">
            <button
              type="button"
              @click="startEdit"
              class="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              :title="t('management.reviewTab.editReview')"
              :aria-label="t('management.reviewTab.editReview')"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              type="button"
              @click="confirmDelete"
              class="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              :title="t('management.reviewTab.deleteReview')"
              :aria-label="t('management.reviewTab.deleteReview')"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <p class="mt-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{{ sanitizedReviewText }}</p>
        <p class="mt-3 text-xs text-slate-400">{{ formattedReviewDate }}</p>
      </div>

      <!-- Review Form (Create or Edit) -->
      <form v-else @submit.prevent="submitReview" class="space-y-5">
        <!-- Rating. A radiogroup, because that is what five mutually exclusive
             stars are — arrow keys move, space commits, and the live label names
             the value so the control is legible without hovering it. The press
             feedback is a scale *down* on pointer-down, not a grow on hover: a
             star that swells when the cursor passes and does nothing when you
             actually press it has its feedback on the wrong event. -->
        <!-- Both fields are required, so an asterisk on both marks nothing: it
             only tells you what you already learn by pressing Submit. -->
        <div>
          <p id="ratingLabel" class="block text-sm font-medium text-slate-700 mb-2">
            {{ t('management.reviewTab.form.ratingLabel') }}
          </p>
          <div class="flex items-center gap-1 flex-wrap" role="radiogroup" aria-labelledby="ratingLabel">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              role="radio"
              :aria-checked="formData.rating === star"
              :tabindex="formData.rating === star || (formData.rating === 0 && star === 1) ? 0 : -1"
              :aria-label="t('management.reviewTab.ratingDisplay', { rating: star })"
              @click="formData.rating = star"
              @keydown="onRatingKeydown"
              @mouseenter="hoverRating = star"
              @mouseleave="hoverRating = 0"
              class="w-10 h-10 flex items-center justify-center rounded-lg transition-transform duration-100 ease-out active:scale-90 motion-reduce:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            >
              <Star
                class="w-7 h-7 transition-colors duration-150"
                :class="
                  star <= (hoverRating || formData.rating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-200 fill-slate-200'
                "
                aria-hidden="true"
              />
            </button>
            <span class="ml-1 text-sm font-medium text-slate-700">
              {{ ratingLabel }}
            </span>
          </div>
          <p v-if="errors.rating" class="text-xs text-red-600 mt-1.5">{{ errors.rating }}</p>
        </div>

        <!-- Review Text. One hint for the form, not one per field: the rating hint
             ("rate the tools, features and support"), the feedback hint and the
             textarea's own placeholder were three phrasings of the same sentence,
             and the live word beside the stars already names the rating. -->
        <div>
          <label for="review-text" class="block text-sm font-medium text-slate-700 mb-2">
            {{ t('management.reviewTab.form.feedbackLabel') }}
          </label>
          <textarea
            id="review-text"
            v-model="formData.review_text"
            rows="4"
            :placeholder="t('management.reviewTab.form.feedbackPlaceholder')"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-colors duration-200 resize-none bg-white"
            :class="{ 'border-red-300 focus:ring-red-200 focus:border-red-400': errors.review_text }"
          ></textarea>
          <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {{ t('management.reviewTab.form.feedbackHint') }}
          </p>
          <p v-if="errors.review_text" class="text-xs text-red-600 mt-1">{{ errors.review_text }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <button
            v-if="isEditing"
            type="button"
            @click="cancelEdit"
            class="w-full sm:w-auto min-h-[40px] px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {{ t('management.reviewTab.form.cancel') }}
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="w-full sm:w-auto min-h-[40px] bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white text-sm font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span
              v-if="submitting"
              class="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full"
              aria-hidden="true"
            ></span>
            <Send v-else class="w-4 h-4" aria-hidden="true" />
            {{
              submitting
                ? (isEditing ? t('management.reviewTab.form.updating') : t('management.reviewTab.form.submitting'))
                : (isEditing ? t('management.reviewTab.form.updateReview') : t('management.reviewTab.form.submitReview'))
            }}
          </button>
        </div>
      </form>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteConfirm"
      :title="t('management.reviewTab.deleteModal.title')"
      :message="t('management.reviewTab.deleteModal.message')"
      :loading="deleting"
      @confirm="deleteReview"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useToast } from '@/composables/useToast'
import { Star, Pencil, Trash2, Send, AlertCircle } from 'lucide-vue-next'
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
const { t } = useAppLanguage()
const { showToast } = useToast()

// Auth store
const authStore = useAuthStore()

// State
const loading = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const existingReview = ref<EventReview | null>(null)
const isEditing = ref(false)
const hoverRating = ref(0)
const loadError = ref(false)
const showDeleteConfirm = ref(false)

// Form data
const formData = ref({
  rating: 0,
  review_text: '',
})

const errors = ref<Record<string, string>>({})

// Computed properties
const sanitizedReviewText = computed(() => {
  if (!existingReview.value) return ''
  return sanitizePlainText(existingReview.value.review_text, 5000)
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

const ratingLabel = computed(() => {
  const rating = hoverRating.value || formData.value.rating
  if (!rating) return t('management.reviewTab.form.ratingPlaceholder')
  return t(`management.reviewTab.form.ratingLabels.${rating}`)
})

// Load existing review
/**
 * Roving arrow keys across the five stars. Home/End jump to the ends; Space and
 * Enter are handled by the button element itself.
 */
const onRatingKeydown = (event: KeyboardEvent): void => {
  const current = formData.value.rating || 1
  let next = current

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      next = current === 5 ? 1 : current + 1
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      next = current === 1 ? 5 : current - 1
      break
    case 'Home':
      next = 1
      break
    case 'End':
      next = 5
      break
    default:
      return
  }

  event.preventDefault()
  formData.value.rating = next
  const group = (event.currentTarget as HTMLElement).parentElement
  const target = group?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next - 1]
  target?.focus()
}

const loadReview = async () => {
  if (!props.canEdit) return

  const userId = authStore.user?.id
  if (!userId) {
    console.warn('Cannot load review: user not authenticated')
    return
  }

  loading.value = true
  loadError.value = false
  errors.value = {}

  try {
    const userReview = await reviewsService.getUserReview(props.eventId, userId)
    existingReview.value = userReview
  } catch (error) {
    // Swallowing this left the panel showing an empty form as though the user had
    // never written a review — the one state a review panel must not invent.
    console.error('Failed to load review:', error)
    loadError.value = true
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
    errors.value.rating = t('management.reviewTab.form.ratingError')
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
      showMessage('success', wasEditing ? t('management.reviewTab.toast.updated') : t('management.reviewTab.toast.submitted'))
    } else {
      // Handle validation errors
      if (response.errors) {
        Object.entries(response.errors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            errors.value[field] = messages[0]
          }
        })
      }
      showMessage('error', response.message || t('management.reviewTab.toast.submitFailed'))
    }
  } catch (error) {
    console.error('Failed to submit review:', error)
    showMessage('error', t('management.reviewTab.toast.submitError'))
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
      showMessage('success', t('management.reviewTab.toast.deleted'))
    } else {
      showMessage('error', response.message || t('management.reviewTab.toast.deleteFailed'))
    }
  } catch (error) {
    console.error('Failed to delete review:', error)
    showMessage('error', t('management.reviewTab.toast.deleteError'))
  } finally {
    deleting.value = false
  }
}

// Helper: Show message with cleanup
const showMessage = (type: 'success' | 'error', text: string) => {
  showToast(type, text)
}

// Lifecycle
onMounted(() => {
  loadReview()
})
</script>

<style scoped>
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
