<template>
  <div id="comment-section" class="mb-8">
    <div class="text-center laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8 laptop-sm:-mt-2 laptop-md:-mt-2 laptop-lg:-mt-3">
      <h2
        :class="[
          'leading-tight py-2 text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-regular sm:mb-4 md:mb-6 capitalize',
          currentLanguage === 'kh' && 'khmer-text-fix',
        ]"
        :style="{
          fontFamily: primaryFont || currentFont,
          color: primaryColor,
        }"
      >
        {{ commentHeaderText }}
      </h2>
    </div>

    <!-- Comment Form -->
    <div
      ref="commentFormRef"
      class="comment-form-liquid mb-3 animate-form-reveal"
      :style="{
        backgroundColor: `${primaryColor}20`,
        border: `1px solid ${primaryColor}40`,
      }"
    >
      <!-- Sign In Prompt for Unauthenticated Users -->
      <div v-if="!isUserAuthenticated" class="text-center py-4">
        <p
          class="text-sm mb-3"
          :style="{ color: primaryColor, fontFamily: secondaryFont || currentFont }"
        >
          {{ commentSigninPromptText }}
        </p>
        <button
          @click="handleSignInClick"
          class="liquid-glass-button w-full text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
          :style="{
            background: primaryColor,
            color: '#ffffff',
            border: `1px solid ${primaryColor}60`,
          }"
        >
          <span :style="{ fontFamily: secondaryFont || currentFont }">{{
            commentSigninButtonText
          }}</span>
        </button>
      </div>

      <!-- Already Commented Message -->
      <div v-else-if="hasAlreadyCommented" class="text-center py-4">
        <p
          class="text-sm"
          :style="{ color: primaryColor, fontFamily: secondaryFont || currentFont }"
        >
          {{ commentAlreadyCommentedText }}
        </p>
      </div>

      <!-- Comment Form for Authenticated Users -->
      <form v-else @submit.prevent="submitComment">
        <!-- Comment Textarea -->
        <div class="mb-3">
          <textarea
            v-model="newComment.message"
            :placeholder="commentPlaceholderText"
            rows="3"
            maxlength="500"
            class="liquid-glass-textarea w-full px-3 py-2 text-sm focus:outline-none resize-none"
            :style="{
              backgroundColor: `${primaryColor}25`,
              '--tw-ring-color': primaryColor + '80',
              color: primaryColor,
              border: `1px solid ${commentValidation.isValid ? primaryColor + '30' : '#dc262630'}`,
              fontFamily: secondaryFont || currentFont,
            }"
            @input="handleCommentInput"
            @blur="validateCommentOnBlur"
            required
          />
          <div class="text-xs text-right mt-1 flex justify-between items-center">
            <!-- Validation Errors -->
            <div
              v-if="!commentValidation.isValid && commentValidation.errors.length > 0"
              class="text-red-500 text-xs"
            >
              {{ commentValidation.errors[0] }}
            </div>
            <div v-else></div>
            <!-- Character Count -->
            <div :style="{ color: primaryColor, fontFamily: secondaryFont || currentFont }">
              {{ newComment.message.length }}/500
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="
            isSubmittingComment || !newComment.message.trim() || !commentValidation.isValid
          "
          class="liquid-glass-button w-full text-sm font-medium transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          :style="{
            background: primaryColor,
            color: '#ffffff',
            border: `1px solid ${primaryColor}60`,
          }"
        >
          <span :style="{ fontFamily: secondaryFont || currentFont }">{{
            isSubmittingComment ? commentPostingButtonText : commentPostButtonText
          }}</span>
        </button>
      </form>
    </div>

    <!-- Comments List -->
    <div class="relative">
      <div
        ref="commentsContainer"
        class="h-[26rem] overflow-y-auto space-y-3 comments-scrollbar"
        @scroll="handleScroll"
      >
        <!-- Loading State -->
        <div
          v-if="loadingComments"
          class="liquid-glass-state text-center py-8"
          :style="{
            backgroundColor: `${primaryColor}18`,
            border: `1px solid ${primaryColor}40`,
          }"
        >
          <div class="inline-flex items-center gap-2">
            <div
              class="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
              :style="{ borderColor: `${primaryColor}60`, borderTopColor: 'transparent' }"
            ></div>
            <span
              class="text-sm"
              :style="{
                color: primaryColor,
                opacity: '0.8',
                fontFamily: secondaryFont || currentFont,
              }"
              >{{ commentLoadingText }}</span
            >
          </div>
        </div>

        <!-- No Comments State -->
        <div
          v-else-if="comments.length === 0"
          class="liquid-glass-state text-center py-8"
          :style="{
            backgroundColor: `${primaryColor}18`,
            border: `1px solid ${primaryColor}40`,
          }"
        >
          <div
            class="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
            :style="{ backgroundColor: `${primaryColor}15` }"
          >
            <MessageCircle class="w-6 h-6" :style="{ color: primaryColor, opacity: '0.6' }" />
          </div>
          <p
            class="text-sm"
            :style="{
              color: primaryColor,
              opacity: '0.8',
              fontFamily: secondaryFont || currentFont,
            }"
          >
            {{ commentNoCommentsText }}
          </p>
        </div>

        <!-- Comments -->
        <div v-else>
          <div
            v-for="(comment, index) in comments"
            :key="comment.id"
            :ref="(el) => setupCommentAnimation(el, `comment-${comment.id}`, index)"
            class="comment-card-liquid p-4 mb-3 last:mb-0 animate-comment-reveal"
            :class="{ 'mt-6': index === 0 }"
            :style="
              isUserCommentOwner(comment)
                ? {
                    backgroundColor: `${primaryColor}25`,
                    border: `1px solid ${primaryColor}60`,
                    transform: 'translateY(-2px)',
                  }
                : {
                    backgroundColor: `${primaryColor}15`,
                    border: `1px solid ${primaryColor}40`,
                  }
            "
          >
            <!-- Comment Header -->
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <!-- User Avatar -->
                <div
                  class="w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center relative"
                >
                  <img
                    v-if="getCommentAvatarUrl(comment) && !isAvatarError(comment.id)"
                    :src="getCommentAvatarUrl(comment)!"
                    :alt="getCommentDisplayName(comment)"
                    class="w-full h-full object-cover"
                    @error="() => setAvatarError(comment.id)"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center text-white text-xs font-semibold"
                    :style="{ backgroundColor: primaryColor }"
                  >
                    {{ getCommentInitial(comment) }}
                  </div>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p
                      class="text-sm font-medium"
                      :style="{ color: primaryColor, fontFamily: primaryFont || currentFont }"
                    >
                      {{ getCommentDisplayName(comment) }}
                    </p>
                    <span
                      v-if="isUserCommentOwner(comment)"
                      class="text-[0.625rem] px-1.5 py-0.5 rounded-full text-white font-medium"
                      :style="{
                        backgroundColor: primaryColor + '80',
                        fontFamily: secondaryFont || currentFont,
                      }"
                    >
                      {{ commentYouBadgeText }}
                    </span>
                  </div>
                  <p
                    class="text-xs"
                    :style="{
                      color: primaryColor,
                      opacity: 0.7,
                      fontFamily: secondaryFont || currentFont,
                    }"
                  >
                    {{ formatCommentDate(comment.created_at) }}
                  </p>
                </div>
              </div>

              <!-- Action Buttons (only for comment owner) -->
              <div v-if="isUserCommentOwner(comment)" class="flex items-center gap-1">
                <button
                  @click="startEditComment(comment)"
                  class="liquid-glass-action-button p-1.5 transition-all duration-200 hover:scale-110"
                  :style="{
                    backgroundColor: `${primaryColor}08`,
                    color: primaryColor,
                    boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 2px 6px ${primaryColor}15`,
                  }"
                  title="Edit comment"
                >
                  <Edit class="w-3.5 h-3.5" />
                </button>
                <button
                  @click="
                    openDeleteModal(comment.id, comment.user_info?.first_name || 'this comment')
                  "
                  class="liquid-glass-action-button p-1.5 transition-all duration-200 hover:scale-110 group"
                  :style="{
                    backgroundColor: `${primaryColor}08`,
                    color: primaryColor,
                    boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 2px 6px ${primaryColor}15`,
                  }"
                  title="Delete comment"
                  :disabled="isDeletingComment === comment.id"
                >
                  <Trash2
                    v-if="isDeletingComment !== comment.id"
                    class="w-3.5 h-3.5 group-hover:text-red-400 transition-colors"
                  />
                  <div
                    v-else
                    class="w-3.5 h-3.5 border border-t-transparent rounded-full animate-spin"
                    :style="{ borderColor: `${primaryColor}60` }"
                  ></div>
                </button>
              </div>
            </div>

            <!-- Comment Message (Read Mode) -->
            <p
              v-if="editingCommentId !== comment.id"
              class="text-sm leading-relaxed"
              :style="{
                color: primaryColor,
                opacity: 0.9,
                fontFamily: secondaryFont || currentFont,
              }"
            >
              {{ capitalizeFirstLetter(comment.comment_text) }}
            </p>

            <!-- Comment Message (Edit Mode) -->
            <div v-else class="space-y-3">
              <textarea
                v-model="editCommentText"
                class="liquid-glass-textarea w-full px-3 py-2 text-sm focus:outline-none resize-none"
                :style="{
                  backgroundColor: `${primaryColor}08`,
                  boxShadow: `inset 0 2px 4px ${primaryColor}15, 0 2px 8px ${primaryColor}10`,
                  '--tw-ring-color': primaryColor + '60',
                  color: primaryColor,
                  fontFamily: secondaryFont || currentFont,
                }"
                rows="3"
                maxlength="500"
                placeholder="Edit your comment..."
              />
              <div class="flex items-center justify-between">
                <div
                  class="text-xs"
                  :style="{ color: primaryColor, fontFamily: secondaryFont || currentFont }"
                >
                  {{ editCommentText.length }}/500
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click="cancelEditComment"
                    class="liquid-glass-edit-button px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:scale-105"
                    :style="{
                      backgroundColor: `${primaryColor}06`,
                      color: primaryColor,
                      opacity: '0.8',
                      boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 6px ${primaryColor}10`,
                      fontFamily: secondaryFont || currentFont,
                    }"
                    :disabled="isUpdatingComment"
                  >
                    Cancel
                  </button>
                  <button
                    @click="updateComment(comment.id)"
                    :disabled="
                      isUpdatingComment ||
                      !editCommentText.trim() ||
                      editCommentText === comment.comment_text
                    "
                    class="liquid-glass-edit-button px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    :style="{
                      background: `${primaryColor}12`,
                      color: primaryColor,
                      boxShadow: `
                        0 4px 16px -2px ${primaryColor}20,
                        inset 0 2px 4px rgba(255, 255, 255, 0.1),
                        inset 0 -1px 2px ${primaryColor}10
                      `,
                      fontFamily: secondaryFont || currentFont,
                    }"
                  >
                    <span v-if="!isUpdatingComment">Save</span>
                    <span v-else class="flex items-center gap-1">
                      <div
                        class="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin"
                      ></div>
                      Saving...
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading More Indicator -->
          <div
            v-if="loadingMoreComments"
            class="liquid-glass-state text-center py-4 mt-2"
            :style="{
              backgroundColor: `${primaryColor}04`,
            }"
          >
            <div class="inline-flex items-center gap-2">
              <div
                class="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                :style="{ borderColor: `${primaryColor}60`, borderTopColor: 'transparent' }"
              ></div>
              <span
                class="text-xs"
                :style="{
                  color: primaryColor,
                  opacity: '0.7',
                  fontFamily: secondaryFont || currentFont,
                }"
                >Loading more comments...</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="errorMessage"
      class="liquid-glass-error mt-3 p-3"
      :style="{
        backgroundColor: '#dc262620',
        boxShadow: '0 4px 16px -2px #dc262615, inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        border: '1px solid #dc262640',
      }"
    >
      <p
        class="text-sm"
        :style="{ color: '#dc2626', opacity: 0.9, fontFamily: secondaryFont || currentFont }"
      >
        {{ errorMessage }}
      </p>
    </div>
  </div>

  <!-- Delete Confirmation Modal -->
  <DeleteConfirmModal
    :show="showDeleteModal"
    title="Delete Comment"
    :item-name="`${commentToDeleteName}'s comment`"
    :loading="isDeletingComment !== null"
    @confirm="handleDeleteConfirm"
    @cancel="handleDeleteCancel"
  />

  <!-- Authentication Modal (Teleported to body for proper full-screen backdrop) -->
  <Teleport to="body">
    <AuthModal
      :is-visible="showAuthModal"
      @close="onAuthModalClose"
      @authenticated="handleUserAuthenticated"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onUnmounted, watch } from 'vue'
import { MessageCircle, Edit, Trash2 } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { commentsService, type EventComment, apiService } from '../../services/api'
import DeleteConfirmModal from '../DeleteConfirmModal.vue'
import AuthModal from '../AuthModal.vue'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'
import { useStaggerAnimation, useEntranceAnimation } from '../../composables/useAdvancedAnimations'
import { ANIMATION_CONSTANTS } from '../../composables/useScrollAnimations'
import { useAuthModal } from '../../composables/useAuthModal'
import {
  sanitizeComment,
  sanitizePlainText,
  validateAndSanitize,
  containsSuspiciousContent,
  type ValidationResult,
} from '../../utils/sanitize'

interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  eventId: string
  guestName?: string
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  currentFont?: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  commentSubmitted: [EventComment]
}>()

// Animation setup for comment reveals
const { observeStaggerElement } = useStaggerAnimation({
  animationType: 'slideLeft',
  duration: ANIMATION_CONSTANTS.DURATION.NORMAL,
  staggerDelay: 100,
  easing: ANIMATION_CONSTANTS.EASING.EXPO,
  threshold: 0.2,
})

// Entrance animation for form interactions
const { triggerEntrance } = useEntranceAnimation({
  type: 'elastic',
  duration: ANIMATION_CONSTANTS.DURATION.NORMAL,
  easing: ANIMATION_CONSTANTS.EASING.ELASTIC,
})

// Enhanced translation function that combines database content with frontend translations
const getTextContent = (textType: string, fallback = ''): string => {
  // First, try to get content from database (eventTexts)
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(
      (text) => text.text_type === textType && text.language === props.currentLanguage,
    )
    if (text?.content) {
      return text.content
    }
  }

  // Fallback to frontend translation system
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'

  // Map text types to translation keys
  const keyMap: Record<
    string,
    keyof typeof import('../../utils/translations').rsvpTranslations.en
  > = {
    comment_header: 'comment_header',
    comment_placeholder: 'comment_placeholder',
    comment_signin_prompt: 'comment_signin_prompt',
    comment_signin_button: 'comment_signin_button',
    comment_post_button: 'comment_post_button',
    comment_posting_button: 'comment_posting_button',
    comment_no_comments: 'comment_no_comments',
    comment_loading: 'comment_loading',
    comment_already_commented: 'comment_already_commented',
    comment_one_per_user: 'comment_one_per_user',
    comment_you_badge: 'comment_you_badge',
  }

  const translationKey = keyMap[textType]
  if (translationKey) {
    return translateRSVP(translationKey, currentLang)
  }

  return fallback
}

// Computed properties for all translatable text
const commentHeaderText = computed(() => getTextContent('comment_header', 'Comments & Wishes'))
const commentPlaceholderText = computed(() =>
  getTextContent('comment_placeholder', 'Share your thoughts, wishes, or congratulations...'),
)
const commentSigninPromptText = computed(() =>
  getTextContent('comment_signin_prompt', 'Please sign in to leave a comment'),
)
const commentSigninButtonText = computed(() =>
  getTextContent('comment_signin_button', 'Sign In to Comment'),
)
const commentPostButtonText = computed(() => getTextContent('comment_post_button', 'Post Comment'))
const commentPostingButtonText = computed(() =>
  getTextContent('comment_posting_button', 'Posting...'),
)
const commentNoCommentsText = computed(() =>
  getTextContent('comment_no_comments', 'Be the first to leave a comment!'),
)
const commentLoadingText = computed(() => getTextContent('comment_loading', 'Loading comments...'))
const commentAlreadyCommentedText = computed(() =>
  getTextContent('comment_already_commented', 'You have already left a comment for this event'),
)
const commentOnePerUserText = computed(() =>
  getTextContent('comment_one_per_user', 'Each user can only comment once per event'),
)
const commentYouBadgeText = computed(() => getTextContent('comment_you_badge', 'You'))

// Router and Auth
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Comment form state
const newComment = ref({
  guestName: props.guestName || '',
  message: '',
})

// Input validation state
const commentValidation = ref<ValidationResult>({ isValid: true, sanitized: '', errors: [] })
const isValidatingComment = ref(false)

// Comments state
const comments = ref<EventComment[]>([])
const loadingComments = ref(false)
const isSubmittingComment = ref(false)
const loadingMoreComments = ref(false)
const totalComments = ref(0)
const currentPage = ref(1)
const commentsPerPage = 20 // Match API default
const commentsContainer = ref<HTMLElement | null>(null)
const commentFormRef = ref<HTMLElement | null>(null)
const hasMoreComments = ref(true)
const errorMessage = ref('')
const hasAlreadyCommented = ref(false)

// Edit/Delete state
const editingCommentId = ref<number | null>(null)
const editCommentText = ref('')
const isUpdatingComment = ref(false)
const isDeletingComment = ref<number | null>(null)

// Delete modal state
const showDeleteModal = ref(false)
const commentToDelete = ref<number | null>(null)
const commentToDeleteName = ref<string>('')

// Avatar error tracking
const avatarErrors = ref<Set<number>>(new Set())

// Auth modal using composable
const {
  showAuthModal,
  openAuthModal,
  onAuthModalClose,
  onUserAuthenticated: handleUserAuthenticated,
  withAuth,
} = useAuthModal({
  onAuthenticated: () => {
    // User successfully authenticated via modal
    // Trigger scroll and highlight animation for comment form
    nextTick(() => {
      scrollToCommentSection()
    })
  },
})

// Computed
const canLoadMore = computed(() => hasMoreComments.value && !loadingMoreComments.value)

// Helper function to process comments (simplified since backend now provides user_info)
const processComments = (comments: EventComment[]): EventComment[] => {
  const processedComments = comments.map((comment) => {
    // Backend now provides user_info, so we sanitize and return the comment
    const sanitizedComment = sanitizeApiResponse(comment)

    // If for some reason user_info is missing, we can add minimal fallback
    if (!sanitizedComment.user_info) {
      sanitizedComment.user_info = {
        id: sanitizedComment.user,
        username: sanitizePlainText(`user_${sanitizedComment.user}`, 50),
        first_name: '',
        last_name: '',
        profile_picture: '',
      }
    }
    return sanitizedComment
  })

  // Sort comments to show user's own comment at the top
  return sortCommentsWithUserFirst(processedComments)
}

// Helper function to sort comments with user's own comment at the top
const sortCommentsWithUserFirst = (comments: EventComment[]): EventComment[] => {
  if (!authStore.isAuthenticated || !authStore.user) {
    return comments
  }

  const currentUserId = authStore.user.id
  const userComment = comments.find((comment) => comment.user === currentUserId)
  const otherComments = comments.filter((comment) => comment.user !== currentUserId)

  // If user has a comment, put it first, otherwise return original order
  if (userComment) {
    return [userComment, ...otherComments]
  }

  return comments
}

const isUserAuthenticated = computed(() => {
  return authStore.isAuthenticated
})

// Methods
const handleSignInClick = () => {
  // Open the authentication modal using composable
  openAuthModal()
}

const getCommentDisplayName = (comment: EventComment): string => {
  // If this is the current user's comment and we have auth store data, use it
  if (authStore.isAuthenticated && authStore.user && comment.user === authStore.user.id) {
    if (authStore.user.first_name && authStore.user.last_name) {
      return `${authStore.user.first_name} ${authStore.user.last_name}`
    }
    if (authStore.user.username) {
      return authStore.user.username
    }
  }

  // Use user_info from the API response (updated backend)
  if (comment.user_info?.first_name && comment.user_info?.last_name) {
    return `${comment.user_info.first_name} ${comment.user_info.last_name}`
  }

  if (comment.user_info?.username) {
    return comment.user_info.username
  }

  // Fallback for cases where user_info is missing
  return `Guest User ${comment.user}`
}

const getCommentInitial = (comment: EventComment): string => {
  const displayName = getCommentDisplayName(comment)
  return displayName.charAt(0).toUpperCase()
}

const getCommentAvatarUrl = (comment: EventComment): string | null => {
  // If this is the current user's comment, try to use auth store profile picture
  if (authStore.isAuthenticated && authStore.user && comment.user === authStore.user.id) {
    if (authStore.user.profile_picture) {
      return apiService.getProfilePictureUrl(authStore.user.profile_picture)
    }
  }

  // Use user_info profile picture if available (backend now provides full URLs)
  if (comment.user_info?.profile_picture) {
    return comment.user_info.profile_picture
  }

  return null
}

const isAvatarError = (commentId: number): boolean => {
  return avatarErrors.value.has(commentId)
}

const setAvatarError = (commentId: number) => {
  avatarErrors.value.add(commentId)
}

const isUserCommentOwner = (comment: EventComment): boolean => {
  if (!authStore.isAuthenticated || !authStore.user) return false
  return comment.user === authStore.user.id
}

const capitalizeFirstLetter = (text: string): string => {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Sanitization and validation helpers
const validateCommentInput = (input: string): ValidationResult => {
  // Check for suspicious content first
  if (containsSuspiciousContent(input)) {
    return {
      isValid: false,
      sanitized: '',
      errors: ['Input contains potentially malicious content'],
    }
  }

  return validateAndSanitize(input, {
    profile: 'COMMENT',
    required: true,
    minLength: 1,
    maxLength: 500,
    trimWhitespace: true,
  })
}

const sanitizeApiResponse = (comment: EventComment): EventComment => {
  const sanitizedComment = { ...comment }

  // Sanitize comment text
  sanitizedComment.comment_text = sanitizeComment(comment.comment_text)

  // Sanitize user info if present
  if (sanitizedComment.user_info) {
    sanitizedComment.user_info = {
      ...sanitizedComment.user_info,
      first_name: sanitizePlainText(sanitizedComment.user_info.first_name || '', 50),
      last_name: sanitizePlainText(sanitizedComment.user_info.last_name || '', 50),
      username: sanitizePlainText(sanitizedComment.user_info.username || '', 50),
    }
  }

  return sanitizedComment
}

// Input handling methods
const handleCommentInput = () => {
  // Debounced validation will be handled in the next phase
  // For now, just reset validation errors on input
  if (!commentValidation.value.isValid) {
    commentValidation.value = { isValid: true, sanitized: '', errors: [] }
  }
}

const validateCommentOnBlur = () => {
  if (newComment.value.message.trim()) {
    commentValidation.value = validateCommentInput(newComment.value.message)
  }
}

const startEditComment = (comment: EventComment) => {
  editingCommentId.value = comment.id
  editCommentText.value = comment.comment_text
  errorMessage.value = ''
}

const cancelEditComment = () => {
  editingCommentId.value = null
  editCommentText.value = ''
  errorMessage.value = ''
}

const updateComment = async (commentId: number) => {
  if (!editCommentText.value.trim()) return

  // Validate the edited comment
  const validation = validateCommentInput(editCommentText.value)
  if (!validation.isValid) {
    errorMessage.value = validation.errors[0] || 'Invalid comment content'
    return
  }

  isUpdatingComment.value = true
  errorMessage.value = ''

  try {
    const response = await commentsService.updateComment(commentId, validation.sanitized)

    if (response.success && response.data) {
      // Sanitize the response data
      const sanitizedComment = sanitizeApiResponse(response.data)

      // Update the comment in the local array
      const commentIndex = comments.value.findIndex((c) => c.id === commentId)
      if (commentIndex !== -1) {
        comments.value[commentIndex] = {
          ...comments.value[commentIndex],
          ...sanitizedComment,
        }
      }

      // Exit edit mode
      cancelEditComment()
    } else {
      errorMessage.value = response.message || 'Failed to update comment. Please try again.'
    }
  } catch {
    errorMessage.value = 'An error occurred while updating your comment. Please try again.'
  } finally {
    isUpdatingComment.value = false
  }
}

const openDeleteModal = (commentId: number, userName: string) => {
  commentToDelete.value = commentId
  commentToDeleteName.value = userName
  showDeleteModal.value = true
}

const handleDeleteConfirm = async () => {
  if (!commentToDelete.value) return

  isDeletingComment.value = commentToDelete.value
  errorMessage.value = ''

  try {
    const response = await commentsService.deleteComment(commentToDelete.value)

    if (response.success) {
      // Remove comment from local array
      comments.value = comments.value.filter((c) => c.id !== commentToDelete.value)
      totalComments.value--

      // Reset already commented state if this was the user's comment
      if (authStore.isAuthenticated) {
        hasAlreadyCommented.value = false
      }

      // Close modal
      showDeleteModal.value = false
      commentToDelete.value = null
      commentToDeleteName.value = ''
    } else {
      errorMessage.value = response.message || 'Failed to delete comment. Please try again.'
      showDeleteModal.value = false
    }
  } catch {
    errorMessage.value = 'An error occurred while deleting your comment. Please try again.'
    showDeleteModal.value = false
  } finally {
    isDeletingComment.value = null
  }
}

const handleDeleteCancel = () => {
  showDeleteModal.value = false
  commentToDelete.value = null
  commentToDeleteName.value = ''
}

const formatCommentDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes} min ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
      } else {
        return date.toLocaleDateString()
      }
    }
  } catch (error) {
    return 'Recently'
  }
}

const submitComment = async () => {
  if (!newComment.value.message.trim()) return

  // Validate the comment before submission
  const validation = validateCommentInput(newComment.value.message)
  if (!validation.isValid) {
    errorMessage.value = validation.errors[0] || 'Invalid comment content'
    commentValidation.value = validation
    return
  }

  // Double-check authentication
  if (!authStore.isAuthenticated) {
    openAuthModal()
    return
  }

  // Check if user has already commented (API constraint: one comment per user per event)
  if (hasAlreadyCommented.value) {
    errorMessage.value = 'You have already commented on this event.'
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
    return
  }

  isSubmittingComment.value = true
  errorMessage.value = ''

  try {
    // Call the actual API with sanitized content
    const response = await commentsService.createComment(props.eventId, validation.sanitized)

    if (response.success && response.data) {
      // Add user info to the comment for display (if not provided by backend)
      const commentWithUserInfo: EventComment = {
        ...response.data,
        user_info: response.data.user_info || {
          id: authStore.user?.id || response.data.user,
          username: authStore.user?.username || '',
          first_name: authStore.user?.first_name || '',
          last_name: authStore.user?.last_name || '',
          profile_picture: authStore.user?.profile_picture || '',
        },
      }

      // Sanitize the response data
      const sanitizedComment = sanitizeApiResponse(commentWithUserInfo)

      // Since user can only comment once per event, just add to beginning
      // The backend constraint ensures there won't be duplicates
      comments.value.unshift(sanitizedComment)
      totalComments.value++
      hasAlreadyCommented.value = true

      // Reset form and validation
      newComment.value.message = ''
      commentValidation.value = { isValid: true, sanitized: '', errors: [] }

      emit('commentSubmitted', sanitizedComment)
    } else {
      // Handle API errors
      if (response.message?.includes('unique')) {
        errorMessage.value = 'You have already commented on this event.'
        hasAlreadyCommented.value = true
      } else {
        errorMessage.value = response.message || 'Failed to post comment. Please try again.'
      }
    }
  } catch {
    errorMessage.value = 'An error occurred while posting your comment. Please try again.'
  } finally {
    isSubmittingComment.value = false
  }
}

const loadComments = async () => {
  loadingComments.value = true
  errorMessage.value = ''
  // Clear avatar errors when loading fresh comments
  avatarErrors.value.clear()

  try {
    // Load comments from API
    const response = await commentsService.getEventComments(props.eventId, 1, commentsPerPage)

    if (response.success && response.data) {
      // Process comments (backend now provides user_info directly)
      comments.value = processComments(response.data.results)

      totalComments.value = response.data.count
      hasMoreComments.value = response.data.next !== null
      currentPage.value = 1

      // Check if current user has already commented
      if (authStore.isAuthenticated) {
        hasAlreadyCommented.value = await commentsService.hasUserCommented(props.eventId)
      }
    } else {
      comments.value = []
      totalComments.value = 0
      hasMoreComments.value = false
    }
  } catch {
    comments.value = []
    totalComments.value = 0
    hasMoreComments.value = false
  } finally {
    loadingComments.value = false
  }
}

const loadMoreComments = async () => {
  if (!canLoadMore.value) return

  loadingMoreComments.value = true
  const nextPage = currentPage.value + 1

  try {
    // Load more comments from API
    const response = await commentsService.getEventComments(
      props.eventId,
      nextPage,
      commentsPerPage,
    )

    if (response.success && response.data) {
      // Process new comments (backend now provides user_info directly)
      const processedNewComments = response.data.results.map((comment) => {
        // Sanitize the comment data
        const sanitizedComment = sanitizeApiResponse(comment)

        // If for some reason user_info is missing, we can add minimal fallback
        if (!sanitizedComment.user_info) {
          sanitizedComment.user_info = {
            id: sanitizedComment.user,
            username: sanitizePlainText(`user_${sanitizedComment.user}`, 50),
            first_name: '',
            last_name: '',
            profile_picture: '',
          }
        }
        return sanitizedComment
      })

      // For pagination, we don't want to re-sort everything, just append
      // But we need to make sure user's comment stays at the top if it exists
      const currentUserId = authStore.user?.id
      if (currentUserId) {
        // Check if any of the new comments belongs to current user
        const userCommentFromNewPage = processedNewComments.find(
          (comment) => comment.user === currentUserId,
        )
        const otherNewComments = processedNewComments.filter(
          (comment) => comment.user !== currentUserId,
        )

        if (userCommentFromNewPage) {
          // Remove user's comment from existing comments if it exists there
          const existingCommentsWithoutUser = comments.value.filter(
            (comment) => comment.user !== currentUserId,
          )
          // Put user comment at the top, then existing comments, then other new comments
          comments.value = [
            userCommentFromNewPage,
            ...existingCommentsWithoutUser,
            ...otherNewComments,
          ]
        } else {
          // No user comment in new batch, just append normally
          comments.value.push(...processedNewComments)
        }
      } else {
        // User not authenticated, just append normally
        comments.value.push(...processedNewComments)
      }

      hasMoreComments.value = response.data.next !== null
      currentPage.value = nextPage
    } else {
      hasMoreComments.value = false
    }
  } catch {
    hasMoreComments.value = false
  } finally {
    loadingMoreComments.value = false
  }
}

// Handle infinite scroll
const handleScroll = () => {
  if (!commentsContainer.value) return

  // Only trigger load more if we can load more
  if (canLoadMore.value) {
    const container = commentsContainer.value
    const scrollPosition = container.scrollTop + container.clientHeight
    const scrollHeight = container.scrollHeight

    // Load more when user is within 100px of bottom
    if (scrollPosition >= scrollHeight - 100) {
      loadMoreComments()
    }
  }
}

// Watchers
watch(
  () => authStore.isAuthenticated,
  async (isAuth, wasAuth) => {
    if (isAuth && !wasAuth) {
      // User just logged in, check if they have already commented
      hasAlreadyCommented.value = await commentsService.hasUserCommented(props.eventId)

      // Reload comments to get proper sorting with user's comment at top
      await loadComments()

      // Check if we should scroll to comment section (after login redirect)
      checkForCommentRedirect()
    } else if (!isAuth) {
      // User logged out, reset comment state
      hasAlreadyCommented.value = false
      newComment.value.message = ''
      errorMessage.value = ''

      // Cancel any ongoing edit
      cancelEditComment()
    }
  },
)

// Function to scroll to comment section
const scrollToCommentSection = () => {
  const commentSection = document.getElementById('comment-section')
  if (commentSection) {
    commentSection.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })

    // Add a gentle highlight animation using the event's primary color
    commentSection.style.boxShadow = `0 0 20px ${props.primaryColor}40`
    commentSection.style.transition = 'box-shadow 0.5s ease-out'

    // Remove the highlight after animation
    setTimeout(() => {
      commentSection.style.boxShadow = 'none'
    }, 2000)
  }
}

// Check if user should be redirected to comment section after login
const checkForCommentRedirect = () => {
  const hash = window.location.hash
  const queryParams = new URLSearchParams(window.location.search)

  if (hash === '#comment-section' || queryParams.get('scrollTo') === 'comment-section') {
    // Small delay to ensure DOM is ready and comments are loaded
    setTimeout(() => {
      scrollToCommentSection()
      // Remove the hash and scrollTo parameter from URL after scrolling
      const url = new URL(window.location.href)
      url.hash = ''
      url.searchParams.delete('scrollTo')
      window.history.replaceState(window.history.state, '', url.toString())
    }, 200)
  }
}

// Setup comment animation for staggered reveals
const setupCommentAnimation = (el: any, id: string, index: number) => {
  if (el && typeof el === 'object' && 'tagName' in el) {
    nextTick(() => {
      observeStaggerElement(el, id, 'comments')
    })
  }
}

// Lifecycle
onMounted(async () => {
  await loadComments()
  // Check if user should be redirected to comment section (after login)
  checkForCommentRedirect()

  // Ensure container is scrollable if there's not much content
  await nextTick()
  if (commentsContainer.value) {
    // Add scroll listener regardless of initial comment count
    commentsContainer.value.addEventListener('scroll', handleScroll, { passive: true })
  }
})

onUnmounted(() => {
  if (commentsContainer.value) {
    commentsContainer.value.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
/* Liquid Glass Container - Comment Form */
.comment-form-liquid {
  border-radius: 1.5rem;
  padding: 1rem;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 0.25rem;
  margin-right: 0.25rem;
  margin-bottom: 0.75rem;
  box-sizing: border-box;
}

.comment-form-liquid:hover {
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  transform: translateY(-1px);
}

.comment-form-liquid::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  pointer-events: none;
}

/* Liquid Glass Button */
.liquid-glass-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 1rem;
  font-weight: 600;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  position: relative;
  overflow: hidden;
  border: none;
  cursor: pointer;
  box-sizing: border-box;
}

.liquid-glass-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  pointer-events: none;
}

.liquid-glass-button::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transition: left 0.5s ease;
  pointer-events: none;
}

.liquid-glass-button:hover::after {
  left: 100%;
}

.liquid-glass-button:hover {
  transform: translateY(-1px);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Liquid Glass Textarea */
.liquid-glass-textarea {
  border-radius: 1rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: none;
  position: relative;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.liquid-glass-textarea::placeholder {
  opacity: 0.8;
  color: inherit;
}

.liquid-glass-textarea:focus {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transform: translateY(-1px);
}

/* Comment Card Liquid Glass */
.comment-card-liquid {
  border-radius: 1.5rem;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 0.25rem;
  margin-right: 0.25rem;
  box-sizing: border-box;
}

.comment-card-liquid:hover {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transform: translateY(-1px) !important;
}

.comment-card-liquid::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
  pointer-events: none;
}

/* Liquid Glass Action Buttons */
.liquid-glass-action-button {
  border-radius: 0.75rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: none;
  cursor: pointer;
  position: relative;
}

.liquid-glass-action-button:hover {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* Liquid Glass Edit Buttons */
.liquid-glass-edit-button {
  border-radius: 0.75rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: none;
  cursor: pointer;
  position: relative;
}

.liquid-glass-edit-button:hover {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* Liquid Glass State Containers */
.liquid-glass-state {
  border-radius: 1.5rem;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  position: relative;
  overflow: hidden;
}

.liquid-glass-state::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  pointer-events: none;
}

/* Liquid Glass Error Container */
.liquid-glass-error {
  border-radius: 1rem;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  position: relative;
  overflow: hidden;
}

.liquid-glass-error::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  pointer-events: none;
}

/* Focus ring color */
input:focus,
textarea:focus {
  --tw-ring-opacity: 0.5;
  box-shadow: 0 0 0 2px rgba(var(--tw-ring-color), var(--tw-ring-opacity));
}

/* Hidden scrollbar for comments container */
.comments-scrollbar::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}

.comments-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.comments-scrollbar::-webkit-scrollbar-thumb {
  background: transparent;
}

.comments-scrollbar::-webkit-scrollbar-thumb:hover {
  background: transparent;
}

/* For Firefox - hide scrollbar */
.comments-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* Custom scrollbar for textarea */
textarea::-webkit-scrollbar {
  width: 4px;
}

textarea::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

textarea::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.4);
  border-radius: 2px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.6);
}
/* Animation Styles for Comments - Start visible, let animations enhance */
.animate-form-reveal {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
  will-change: opacity, transform;
}

.animate-comment-reveal {
  opacity: 1;
  transform: translateX(0);
  transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
  will-change: opacity, transform;
}

/* Enhanced form interactions */
.liquid-glass-textarea:focus {
  transform: scale(1.01);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
}

.liquid-glass-button:active {
  transform: scale(0.98);
}

/* Reduce motion for accessibility - Let useAdvancedAnimations handle this */
@media (prefers-reduced-motion: reduce) {
  .liquid-glass-textarea:focus,
  .liquid-glass-button:active {
    transform: none !important;
  }
}

/* Performance optimizations */
.comment-card-liquid {
  contain: layout style paint;
  transform: translateZ(0);
}

.liquid-glass-button,
.liquid-glass-textarea {
  backface-visibility: hidden;
}

/* Enhanced Khmer font rendering */
.khmer-text-fix {
  line-height: 1.8 !important;
  padding-top: 0.3em !important;
  padding-bottom: 0.3em !important;
  margin-top: 0.2em;
  margin-bottom: 0.2em;
}

/* Laptop responsive styles - Match mobile sizing and spacing for all laptops */

/* Small laptops 13-inch (1024px-1365px) - Scaled to 67.5% matching mobile exactly */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Header text - scaled to 67.5% from mobile md:text-3xl (1.875rem) */
  h2 {
    font-size: 1.265625rem !important; /* 1.875rem * 0.675 - exact mobile ratio matching AgendaSection */
    line-height: 1.25 !important; /* Match mobile leading-tight */
    padding-top: 0rem !important; /* Removed top padding to reduce space */
    padding-bottom: 0.3375rem !important; /* 0.5rem * 0.675 (py-2) */
  }
}

/* Medium laptops 14-15 inch (1366px-1535px) - Scaled to 75% matching mobile exactly */
@media (min-width: 1366px) and (max-width: 1535px) {
  /* Header text - scaled to 75% from mobile md:text-3xl (1.875rem) */
  h2 {
    font-size: 1.40625rem !important; /* 1.875rem * 0.75 - exact mobile ratio matching AgendaSection */
    line-height: 1.25 !important; /* Match mobile leading-tight */
    padding-top: 0rem !important; /* Removed top padding to reduce space */
    padding-bottom: 0.375rem !important; /* 0.5rem * 0.75 (py-2) */
  }
}

/* Desktop (1536px+) - Clean desktop styles */
@media (min-width: 1536px) {
  h2 {
    font-size: 1.875rem !important; /* 30px - text-3xl matching AgendaSection */
  }
}

/* All laptop sizes - Common responsive styles */
@media (min-width: 1024px) {

  /* Remove the custom laptop sizing to match mobile */
  .comment-form-liquid {
    border-radius: 1.5rem !important;
    padding: 1rem !important;
    margin-left: 0.25rem !important;
    margin-right: 0.25rem !important;
    margin-bottom: 0.75rem !important;
  }

  /* Text sizing - match mobile */
  .text-sm {
    font-size: 0.875rem !important; /* 14px - standard mobile text-sm */
  }

  .text-xs {
    font-size: 0.75rem !important; /* 12px - standard mobile text-xs */
  }

  /* Button sizing - match mobile */
  .liquid-glass-button {
    padding: 0.75rem 1.5rem !important;
    border-radius: 1rem !important;
  }

  /* Textarea sizing - match mobile */
  .liquid-glass-textarea {
    border-radius: 1rem !important;
    padding: 0.5rem 0.75rem !important; /* py-2 px-3 - match template exactly */
    font-size: 0.875rem !important; /* text-sm */
  }

  /* Comment cards - match mobile */
  .comment-card-liquid {
    border-radius: 1.5rem !important;
    padding: 1rem !important;
    margin-left: 0.25rem !important;
    margin-right: 0.25rem !important;
  }

  /* Action buttons - match mobile */
  .liquid-glass-action-button {
    padding: 0.375rem !important; /* p-1.5 */
    border-radius: 0.75rem !important;
  }

  .liquid-glass-edit-button {
    padding: 0.375rem 0.75rem !important; /* px-3 py-1.5 */
    font-size: 0.75rem !important; /* text-xs */
    border-radius: 0.75rem !important;
  }

  /* Avatar sizing - match mobile */
  .w-8.h-8 {
    width: 2rem !important; /* 32px - w-8 */
    height: 2rem !important; /* 32px - h-8 */
  }

  /* State containers - match mobile */
  .liquid-glass-state {
    border-radius: 1.5rem !important;
    padding: 2rem !important; /* py-8 */
  }

  .liquid-glass-error {
    border-radius: 1rem !important;
    padding: 0.75rem !important; /* p-3 */
  }

  /* Icons sizing - preserve original mobile sizes */
  svg.w-6 {
    width: 1.5rem !important;
    height: 1.5rem !important;
  }

  svg.w-4 {
    width: 1rem !important;
    height: 1rem !important;
  }

  svg.w-3\.5 {
    width: 0.875rem !important;
    height: 0.875rem !important;
  }

  svg.w-3 {
    width: 0.75rem !important;
    height: 0.75rem !important;
  }

  /* Comments container - match mobile */
  .h-\[26rem\] {
    height: 26rem !important; /* Keep same height as mobile */
  }

  /* Overall comment section spacing - match mobile */
  #comment-section.mb-8 {
    margin-bottom: 2rem !important; /* mb-8 */
  }

  /* Character counter and validation messages */
  .text-right.mt-1 {
    margin-top: 0.25rem !important;
  }

  /* Loading spinner sizing */
  .w-4.h-4 {
    width: 1rem !important;
    height: 1rem !important;
  }

  .w-12.h-12 {
    width: 3rem !important;
    height: 3rem !important;
  }
}
</style>
