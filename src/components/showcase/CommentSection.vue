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
      <!-- Ornamental divider under heading -->
      <div class="flex items-center justify-center gap-2 -mt-1 mb-1">
        <span
          class="h-px w-10 sm:w-14"
          :style="{ background: `linear-gradient(90deg, transparent, ${primaryColor}66)` }"
        ></span>
        <span
          class="w-1.5 h-1.5 rotate-45 flex-shrink-0"
          :style="{ backgroundColor: `${primaryColor}59` }"
        ></span>
        <span
          class="h-px w-10 sm:w-14"
          :style="{ background: `linear-gradient(90deg, ${primaryColor}66, transparent)` }"
        ></span>
      </div>
    </div>

    <!-- Comment Form -->
    <div
      ref="commentFormRef"
      class="comment-form-liquid mb-3 animate-form-reveal"
      :class="{ 'is-collapsed': composerCollapsed }"
      :style="{
        backgroundColor: `${backgroundColor}20`,
        border: `1px solid ${backgroundColor}40`,
      }"
    >
      <!-- Private event without an invitation link -->
      <div v-if="showInviteOnlyPrompt" class="text-center py-4">
        <p
          class="text-sm"
          :style="{ color: primaryColor, fontFamily: secondaryFont || currentFont }"
        >
          {{ commentInviteOnlyPromptText }}
        </p>
      </div>

      <!-- Sign In Prompt for Unauthenticated Users on PUBLIC events -->
      <div v-else-if="showLoginPrompt" class="text-center py-4">
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
            background: backgroundColor,
            color: '#ffffff',
            border: `1px solid ${backgroundColor}60`,
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

      <!-- Collapsed composer.

           Expanded, the form is a textarea, a counter and a button: about
           200px, and it sat above the wishes, so the first screen of the
           guestbook was an empty box asking a guest to write before they had
           read anything. On a wedding the wishes are the reason the section
           exists; writing one is what a guest does *after* being moved by
           them. Collapsed it costs one row, and it opens on tap into exactly
           the form that was there before.

           It opens by default when there is nothing to read - with no wishes
           yet, composing is the only thing this section can offer, and asking
           for a second tap to reach it would be perverse. -->
      <button
        v-else-if="canShowCommentForm && composerCollapsed"
        type="button"
        class="composer-trigger w-full flex items-center gap-2.5 text-left"
        :style="{ color: primaryColor }"
        @click="openComposer"
      >
        <span
          class="composer-trigger__mark flex-shrink-0 flex items-center justify-center rounded-full"
          :style="{
            backgroundColor: `${backgroundColor}22`,
            boxShadow: `0 0 0 1px ${backgroundColor}30`,
          }"
        >
          <PenLine class="w-3.5 h-3.5" :style="{ color: primaryColor, opacity: 0.75 }" />
        </span>
        <span
          class="text-sm truncate"
          :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
          :style="{ opacity: 0.75, fontFamily: secondaryFont || currentFont }"
        >{{ commentComposeCtaText }}</span>
      </button>

      <!-- Comment Form (visible whenever the form can be shown) -->
      <form v-else-if="canShowCommentForm" @submit.prevent="submitComment">
        <!-- "Commenting as <guestName>" hint for guest authors -->
        <p
          v-if="commentAuthMode === 'guest' && guestName"
          class="text-xs mb-2"
          :style="{
            color: primaryColor,
            opacity: 0.85,
            fontFamily: secondaryFont || currentFont,
          }"
        >
          {{ commentCommentingAsText }} <strong>{{ guestName }}</strong>
        </p>
        <!-- Comment Textarea -->
        <div class="mb-3">
          <textarea
            ref="composerTextareaRef"
            v-model="newComment.message"
            :placeholder="commentPlaceholderText"
            rows="3"
            maxlength="500"
            class="liquid-glass-textarea w-full px-3 py-2 text-sm focus:outline-none resize-none"
            :style="{
              backgroundColor: `${backgroundColor}25`,
              '--tw-ring-color': backgroundColor + '80',
              color: primaryColor,
              border: `1px solid ${commentValidation.isValid ? backgroundColor + '30' : '#dc262630'}`,
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
            <!-- Character Count: only once it is close enough to matter. At
                 0/500 it is a rule the guest has not come near, printed under
                 an empty box. -->
            <div
              v-if="newComment.message.length >= 400"
              :style="{ color: primaryColor, fontFamily: secondaryFont || currentFont }"
            >
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
            background: backgroundColor,
            color: '#ffffff',
            border: `1px solid ${backgroundColor}60`,
          }"
        >
          <span :style="{ fontFamily: secondaryFont || currentFont }">{{
            isSubmittingComment ? commentPostingButtonText : commentPostButtonText
          }}</span>
        </button>
      </form>
    </div>

    <!-- Comments List

         Flows with the page rather than scrolling inside itself. It was a
         fixed `h-[26rem]` overflow box, which on a phone bought two problems
         and no benefit: it is a third nested scroller (inside .stage-scroll,
         inside the card wrapper), so a flick over the wishes moved the list
         and not the invitation; and it reserved 394px of an 844px viewport
         whatever the content, so an event with one wish rendered that wish
         followed by a third of a screen of nothing. Length is now handled
         where it actually comes from - the number of wishes - by showing the
         most recent few and letting the guest ask for the rest. -->
    <div class="relative">
      <div ref="commentsContainer" class="space-y-3">
        <!-- Loading State -->
        <div
          v-if="loadingComments"
          class="liquid-glass-state text-center py-8"
          :style="{
            backgroundColor: `${backgroundColor}18`,
            border: `1px solid ${backgroundColor}40`,
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
            backgroundColor: `${backgroundColor}18`,
            border: `1px solid ${backgroundColor}40`,
          }"
        >
          <div
            class="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
            :style="{
              backgroundColor: `${backgroundColor}15`,
              boxShadow: `0 0 0 1px ${backgroundColor}30, 0 0 0 6px ${backgroundColor}0D`,
            }"
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
            v-for="(comment, index) in visibleComments"
            :key="comment.id"
            :ref="(el) => setupCommentAnimation(el, `comment-${comment.id}`, index)"
            class="comment-card-liquid wish-card p-3.5 mb-3 last:mb-0 animate-comment-reveal relative"
            :style="{
              '--wish-index': index,
              '--wish-rule': `${backgroundColor}80`,
              '--wish-rule-fade': `${backgroundColor}1F`,
              backgroundColor: `${backgroundColor}${isUserCommentOwner(comment) ? '25' : '15'}`,
              border: `1px solid ${backgroundColor}${isUserCommentOwner(comment) ? '60' : '40'}`,
            }"
          >
            <!-- Quotation is marked by a rule down the message, not by a
                 glyph. The 4xl Georgia quote that was here sat at 40% over the
                 first line and forced a 28px left inset - 9% of the measure on
                 a 390px phone, which Khmer cannot spare: it does not hyphenate
                 and `word-break: keep-all` means a lost column becomes a lost
                 line. The rule reads as a pull-quote, costs 10px, and overlaps
                 nothing. -->

            <!-- Options Button (only for comment owner) - Top Right -->
            <div
              v-if="isUserCommentOwner(comment)"
              class="absolute top-2 right-2 z-10 comment-options-menu"
              :ref="(el) => setMenuButtonRef(el, comment.id)"
            >
              <button
                @click.stop="toggleCommentMenu(comment.id)"
                class="p-1.5 rounded-full transition-all duration-200 hover:scale-110 hover:bg-white/10"
                :style="{
                  color: primaryColor,
                }"
                title="Options"
              >
                <MoreVertical class="w-4 h-4" />
              </button>
            </div>

            <!-- Comment Message (Read Mode) -->
            <p
              v-if="editingCommentId !== comment.id"
              class="wish-message text-sm leading-relaxed mb-2.5"
              :class="isUserCommentOwner(comment) ? 'pr-7' : 'pr-1'"
              :style="{
                color: primaryColor,
                fontFamily: secondaryFont || currentFont,
                lineHeight: '1.8',
              }"
            >
              {{ capitalizeFirstLetter(comment.comment_text) }}
            </p>

            <!-- Comment Message (Edit Mode) -->
            <div v-else class="wish-message space-y-3 pr-7 mb-3">
              <textarea
                v-model="editCommentText"
                class="liquid-glass-textarea w-full px-3 py-2 text-sm focus:outline-none resize-none"
                :style="{
                  backgroundColor: `${backgroundColor}08`,
                  boxShadow: `inset 0 2px 4px ${backgroundColor}15, 0 2px 8px ${backgroundColor}10`,
                  '--tw-ring-color': backgroundColor + '60',
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
                      backgroundColor: `${backgroundColor}06`,
                      color: primaryColor,
                      opacity: '0.8',
                      boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.08), 0 2px 6px ${backgroundColor}10`,
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
                      background: `${backgroundColor}12`,
                      color: primaryColor,
                      boxShadow: `
                        0 4px 16px -2px ${backgroundColor}20,
                        inset 0 2px 4px rgba(255, 255, 255, 0.1),
                        inset 0 -1px 2px ${backgroundColor}10
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

            <!-- Author Signature (Bottom) -->
            <div class="comment-author-row relative flex items-center gap-2.5 pt-2.5">
              <!-- Gradient hairline divider -->
              <div
                class="absolute top-0 left-0 right-0 h-px pointer-events-none"
                :style="{
                  background: `linear-gradient(90deg, ${backgroundColor}50, ${backgroundColor}15, transparent)`,
                }"
              ></div>

              <!-- User Avatar -->
              <div
                class="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                :style="{
                  backgroundColor: `${backgroundColor}25`,
                  boxShadow: `0 0 0 2px ${backgroundColor}35`,
                }"
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
                  :style="{ backgroundColor: backgroundColor }"
                >
                  {{ getCommentInitial(comment) }}
                </div>
              </div>

              <!-- Name + Date (stacked so long names never wrap) -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <p
                    class="text-sm font-medium truncate"
                    :style="{ color: primaryColor, fontFamily: primaryFont || currentFont }"
                  >
                    {{ getCommentDisplayName(comment) }}
                  </p>
                  <span
                    v-if="isUserCommentOwner(comment)"
                    class="text-[0.6875rem] px-1.5 py-0.5 rounded-full text-white font-medium flex-shrink-0"
                    :style="{
                      backgroundColor: backgroundColor + '80',
                      fontFamily: secondaryFont || currentFont,
                    }"
                  >
                    {{ commentYouBadgeText }}
                  </span>
                </div>
                <p
                  class="text-xs leading-tight mt-px"
                  :style="{
                    color: primaryColor,
                    opacity: 0.5,
                    fontFamily: secondaryFont || currentFont,
                  }"
                >
                  {{ formatCommentDate(comment.created_at) }}
                </p>
              </div>
            </div>
          </div>

          <!-- The list's own length control. Infinite scroll was the right
               answer only while the box scrolled inside itself; with the list
               on the page, an explicit ask is both cheaper (nothing loads
               until a guest wants it) and honest about how many wishes there
               are, which on a wedding is a number the couple wants seen. -->
          <button
            v-if="canRevealMoreWishes"
            type="button"
            class="wish-more-button w-full text-xs font-medium"
            :style="{
              color: primaryColor,
              borderColor: `${backgroundColor}38`,
              fontFamily: secondaryFont || currentFont,
            }"
            @click="revealMoreWishes"
          >
            <span
              class="wish-more-rule"
              :style="{ background: `linear-gradient(90deg, transparent, ${backgroundColor}45)` }"
            ></span>
            <span class="wish-more-label">{{ showAllWishesText }}</span>
            <span
              class="wish-more-rule"
              :style="{ background: `linear-gradient(90deg, ${backgroundColor}45, transparent)` }"
            ></span>
          </button>

          <!-- Loading More Indicator -->
          <div
            v-if="loadingMoreComments"
            class="liquid-glass-state text-center py-4 mt-2"
            :style="{
              backgroundColor: `${backgroundColor}04`,
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

  <!-- Teleported Dropdown Menu (to escape overflow clipping) -->
  <Teleport to="body">
    <div
      v-if="openMenuId !== null"
      class="comment-dropdown-menu fixed py-1 rounded-lg shadow-xl min-w-[100px] z-[9999] backdrop-blur-sm"
      :style="{
        backgroundColor: backgroundColor,
        border: `1px solid ${backgroundColor}80`,
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
      }"
    >
      <button
        @click="handleEditFromMenu(getCommentById(openMenuId))"
        class="w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 transition-colors hover:bg-white/10"
        :style="{ color: '#ffffff', fontFamily: secondaryFont || currentFont }"
      >
        <Edit class="w-3 h-3" />
        Edit
      </button>
      <button
        @click="handleDeleteFromMenu(getCommentById(openMenuId))"
        class="w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 transition-colors hover:bg-white/10"
        :style="{ color: '#ffffff', fontFamily: secondaryFont || currentFont }"
        :disabled="isDeletingComment === openMenuId"
      >
        <Trash2 class="w-3 h-3" />
        Delete
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onUnmounted, watch, type ComponentPublicInstance } from 'vue'
import { MessageCircle, Edit, Trash2, MoreVertical, PenLine } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { commentsService, type EventComment, apiService } from '../../services/api'
import DeleteConfirmModal from '../DeleteConfirmModal.vue'
import AuthModal from '../AuthModal.vue'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'
import { useStaggerAnimation } from '../../composables/useAdvancedAnimations'
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
  /**
   * Event privacy. Determines which auth flow is required to comment:
   *  - 'public'  → JWT only (login required)
   *  - 'private' → guest_shortcode only (invitation link required)
   * Defaults to 'public' if not provided (preserves legacy behavior).
   */
  eventPrivacy?: 'public' | 'private'
  guestName?: string
  /** Guest shortcode from `?g=...`. Required to comment on a private event. */
  guestShortcode?: string | null
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string | null
  currentFont?: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  eventType?: string
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
    comment_header_funeral: 'comment_header_funeral',
    comment_placeholder: 'comment_placeholder',
    comment_placeholder_funeral: 'comment_placeholder_funeral',
    comment_signin_prompt: 'comment_signin_prompt',
    comment_signin_button: 'comment_signin_button',
    comment_post_button: 'comment_post_button',
    comment_posting_button: 'comment_posting_button',
    comment_no_comments: 'comment_no_comments',
    comment_loading: 'comment_loading',
    comment_already_commented: 'comment_already_commented',
    comment_one_per_user: 'comment_one_per_user',
    comment_you_badge: 'comment_you_badge',
    comment_invite_only_prompt: 'comment_invite_only_prompt',
    comment_commenting_as: 'comment_commenting_as',
  }

  const translationKey = keyMap[textType]
  if (translationKey) {
    return translateRSVP(translationKey, currentLang)
  }

  return fallback
}

// Computed properties for all translatable text
const commentHeaderText = computed(() => {
  if (props.eventType?.toLowerCase() === 'funeral') {
    return getTextContent('comment_header_funeral', 'Condolence Message')
  }
  return getTextContent('comment_header', 'Comments & Wishes')
})
const commentPlaceholderText = computed(() => {
  if (props.eventType?.toLowerCase() === 'funeral') {
    return getTextContent('comment_placeholder_funeral', 'Share your thoughts and condolences')
  }
  return getTextContent('comment_placeholder', 'Share your thoughts, wishes, or congratulations...')
})
const commentSigninPromptText = computed(() =>
  getTextContent('comment_signin_prompt', 'Please sign in to leave a comment'),
)
const commentSigninButtonText = computed(() =>
  getTextContent('comment_signin_button', 'Sign In to Comment'),
)
// The collapsed composer's label. Short enough to sit in one row beside its
// mark at 390px, in both languages.
const commentComposeCtaText = computed(() => {
  if (props.eventType?.toLowerCase() === 'funeral') {
    return getTextContent('comment_compose_cta_funeral', 'Leave a message')
  }
  return getTextContent('comment_compose_cta', 'Write your wish')
})
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
const commentYouBadgeText = computed(() => getTextContent('comment_you_badge', 'You'))
const commentInviteOnlyPromptText = computed(() =>
  getTextContent(
    'comment_invite_only_prompt',
    'This is a private event. Please open your invitation link to leave a message.',
  ),
)
const commentCommentingAsText = computed(() =>
  getTextContent('comment_commenting_as', 'Commenting as'),
)

const authStore = useAuthStore()

// Comment form state
const newComment = ref({
  guestName: props.guestName || '',
  message: '',
})

// Input validation state
const commentValidation = ref<ValidationResult>({ isValid: true, sanitized: '', errors: [] })

// Comments state
const comments = ref<EventComment[]>([])
const loadingComments = ref(false)
const isSubmittingComment = ref(false)
const loadingMoreComments = ref(false)
const totalComments = ref(0)
const currentPage = ref(1)
const commentsPerPage = 20 // Match API default
const commentsContainer = ref<HTMLElement | null>(null)
const composerTextareaRef = ref<HTMLTextAreaElement | null>(null)

// How many wishes are on the page. Three is what fits under the composer on a
// 390px phone without the section running past a screen, which is the length
// at which a guest still reads them rather than scrolls them.
const WISHES_PER_REVEAL = 3
const visibleWishCount = ref(WISHES_PER_REVEAL)
const composerOpenedByGuest = ref(false)
const commentFormRef = ref<HTMLElement | null>(null)
const hasMoreComments = ref(true)
const errorMessage = ref('')
const hasAlreadyCommented = ref(false)

// Edit/Delete state
const editingCommentId = ref<number | null>(null)
const editCommentText = ref('')
const openMenuId = ref<number | null>(null)
const isUpdatingComment = ref(false)
const isDeletingComment = ref<number | null>(null)

// Delete modal state
const showDeleteModal = ref(false)
const commentToDelete = ref<number | null>(null)
const commentToDeleteName = ref<string>('')

// Avatar error tracking
const avatarErrors = ref<Set<number>>(new Set())

// Dropdown menu positioning for Teleport
const menuButtonRefs = ref<Map<number, HTMLElement>>(new Map())
const dropdownPosition = ref({ top: 0, left: 0 })

// Auth modal using composable
const {
  showAuthModal,
  openAuthModal,
  onAuthModalClose,
  onUserAuthenticated: handleUserAuthenticated,
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

// Background color with fallback to primaryColor
const backgroundColor = computed(() => props.backgroundColor || props.primaryColor)

// Helper function to process comments
const processComments = (comments: EventComment[]): EventComment[] => {
  const processedComments = comments.map((comment) => sanitizeApiResponse(comment))

  // Sort comments so the current author's own comment surfaces at the top.
  return sortCommentsWithOwnerFirst(processedComments)
}

// Float the current author's comment to the top regardless of whether they
// authored it as a logged-in user or as a guest via shortlink.
const sortCommentsWithOwnerFirst = (comments: EventComment[]): EventComment[] => {
  const ownIndex = comments.findIndex((c) => isUserCommentOwner(c))
  if (ownIndex <= 0) return comments
  const own = comments[ownIndex]
  return [own, ...comments.slice(0, ownIndex), ...comments.slice(ownIndex + 1)]
}

const isUserAuthenticated = computed(() => {
  return authStore.isAuthenticated
})

// ---- Privacy partition ---------------------------------------------------
// Private events are shortcode-only; public events are JWT-only. Comment auth
// is decided here so the rest of the component can branch on it cleanly.

const isPrivateEvent = computed(() => props.eventPrivacy === 'private')

const hasGuestCredential = computed(
  () => Boolean(props.guestShortcode && props.guestName),
)

const commentAuthMode = computed<'guest' | 'user' | null>(() => {
  if (isPrivateEvent.value) {
    return hasGuestCredential.value ? 'guest' : null
  }
  return isUserAuthenticated.value ? 'user' : null
})

const canShowCommentForm = computed(() => commentAuthMode.value !== null)

// The wishes actually on the page, and whether there are more to ask for -
// either still in the buffer, or on a page the API has not been asked for yet.
const visibleComments = computed(() => comments.value.slice(0, visibleWishCount.value))
const canRevealMoreWishes = computed(
  () =>
    !loadingComments.value &&
    !loadingMoreComments.value &&
    (visibleWishCount.value < comments.value.length || hasMoreComments.value),
)
const showAllWishesText = computed(() => {
  const label = getTextContent('comment_show_all', 'Read all wishes')
  const total = totalComments.value || comments.value.length
  return total > visibleWishCount.value ? `${label} (${total})` : label
})

// Collapsed unless the guest asked for it, or there is nothing else to do here.
//
// Guarded on the same conditions the <form> branch is, not just on
// canShowCommentForm: the shell also carries the sign-in, invite-only and
// already-commented notices, and those are one short paragraph each. Cropping
// their padding to composer height reads as a clipped card, and there is
// nothing to expand into anyway.
const composerCollapsed = computed(
  () =>
    canShowCommentForm.value &&
    !showsComposerNotice.value &&
    !composerOpenedByGuest.value &&
    comments.value.length > 0,
)

const openComposer = async () => {
  composerOpenedByGuest.value = true
  await nextTick()
  composerTextareaRef.value?.focus()
}

// Reveals the next few from the buffer, and only asks the API for another page
// once the buffer is spent - so the first tap is always instant.
const revealMoreWishes = async () => {
  if (visibleWishCount.value < comments.value.length) {
    visibleWishCount.value += WISHES_PER_REVEAL
    return
  }
  if (hasMoreComments.value) {
    await loadMoreComments()
    visibleWishCount.value += WISHES_PER_REVEAL
  }
}
const showInviteOnlyPrompt = computed(
  () => isPrivateEvent.value && !hasGuestCredential.value,
)
const showLoginPrompt = computed(
  () => !isPrivateEvent.value && !isUserAuthenticated.value,
)

// The shell is showing a notice rather than the composer.
const showsComposerNotice = computed(
  () => showInviteOnlyPrompt.value || showLoginPrompt.value || hasAlreadyCommented.value,
)

// Methods
const handleSignInClick = () => {
  // Open the authentication modal using composable
  openAuthModal()
}

const buildFullName = (firstName?: string | null, lastName?: string | null): string => {
  return [firstName, lastName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ')
}

const getCommentDisplayName = (comment: EventComment): string => {
  // Backend-provided canonical name covers both author types.
  if (comment.author_name) return comment.author_name

  // Fallbacks below only matter if the backend response is malformed.
  if (comment.guest_info?.name) return comment.guest_info.name

  if (authStore.isAuthenticated && authStore.user && comment.user === authStore.user.id) {
    const fullName = buildFullName(authStore.user.first_name, authStore.user.last_name)
    if (fullName) return fullName
    if (authStore.user.username) return authStore.user.username
  }

  const userInfoFullName = buildFullName(
    comment.user_info?.first_name,
    comment.user_info?.last_name,
  )
  if (userInfoFullName) return userInfoFullName

  if (comment.user_info?.username) {
    return comment.user_info.username
  }

  return 'Guest'
}

const getCommentInitial = (comment: EventComment): string => {
  const displayName = getCommentDisplayName(comment)
  return displayName.charAt(0).toUpperCase()
}

const getCommentAvatarUrl = (comment: EventComment): string | null => {
  // Guest comments have no avatar — render initials placeholder.
  if (comment.guest) return null

  // Backend now ships an absolute URL for the user's avatar.
  if (comment.author_avatar) return comment.author_avatar

  // If this is the current user's comment, try to use auth store profile picture
  if (authStore.isAuthenticated && authStore.user && comment.user === authStore.user.id) {
    if (authStore.user.profile_picture) {
      return apiService.getProfilePictureUrl(authStore.user.profile_picture)
    }
  }

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
  // Guest-authored comment: stored shortcode + matching guest name claims it.
  if (comment.guest_info && hasGuestCredential.value) {
    return comment.guest_info.name === props.guestName
  }
  // User-authored comment: JWT identifies the author.
  if (comment.user_info && authStore.isAuthenticated && authStore.user) {
    return comment.user_info.id === authStore.user.id
  }
  return false
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

  // Canonical author name (always present for both author types)
  if (sanitizedComment.author_name) {
    sanitizedComment.author_name = sanitizePlainText(sanitizedComment.author_name, 100)
  }

  // Sanitize user info if present
  if (sanitizedComment.user_info) {
    sanitizedComment.user_info = {
      ...sanitizedComment.user_info,
      first_name: sanitizePlainText(sanitizedComment.user_info.first_name || '', 50),
      last_name: sanitizePlainText(sanitizedComment.user_info.last_name || '', 50),
      username: sanitizePlainText(sanitizedComment.user_info.username || '', 50),
    }
  }

  // Sanitize guest info if present
  if (sanitizedComment.guest_info) {
    sanitizedComment.guest_info = {
      ...sanitizedComment.guest_info,
      name: sanitizePlainText(sanitizedComment.guest_info.name || '', 100),
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

// Menu toggle functions
const toggleCommentMenu = (commentId: number) => {
  if (openMenuId.value === commentId) {
    openMenuId.value = null
  } else {
    openMenuId.value = commentId
    // Calculate dropdown position after menu opens
    nextTick(() => {
      updateDropdownPosition(commentId)
    })
  }
}

const closeCommentMenu = () => {
  openMenuId.value = null
}

// Set ref for menu button to calculate dropdown position
const setMenuButtonRef = (el: Element | ComponentPublicInstance | null, commentId: number) => {
  if (el) {
    menuButtonRefs.value.set(commentId, el as HTMLElement)
  } else {
    menuButtonRefs.value.delete(commentId)
  }
}

// Update dropdown position based on button location
const updateDropdownPosition = (commentId: number) => {
  const buttonEl = menuButtonRefs.value.get(commentId)
  if (buttonEl) {
    const rect = buttonEl.getBoundingClientRect()
    dropdownPosition.value = {
      top: rect.bottom + 4, // 4px gap below button
      left: rect.right - 100, // Align right edge with button (100px is min-width)
    }
  }
}

// Get comment by ID for teleported dropdown
const getCommentById = (commentId: number | null): EventComment | undefined => {
  if (commentId === null) return undefined
  return comments.value.find(c => c.id === commentId)
}

const handleEditFromMenu = (comment: EventComment | undefined) => {
  if (!comment) return
  closeCommentMenu()
  startEditComment(comment)
}

const handleDeleteFromMenu = (comment: EventComment | undefined) => {
  if (!comment) return
  closeCommentMenu()
  openDeleteModal(comment.id, getCommentDisplayName(comment) || 'this comment')
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

  // Guest comments must re-send the shortcode on every write.
  const shortcode = isPrivateEvent.value ? props.guestShortcode : null

  try {
    const response = await commentsService.updateComment(
      commentId,
      validation.sanitized,
      shortcode,
    )

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

  const shortcode = isPrivateEvent.value ? props.guestShortcode : null

  try {
    const response = await commentsService.deleteComment(commentToDelete.value, shortcode)

    if (response.success) {
      // Remove comment from local array
      comments.value = comments.value.filter((c) => c.id !== commentToDelete.value)
      totalComments.value--

      // Reset already commented state — applies to both flows.
      hasAlreadyCommented.value = false

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
  } catch {
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

  // Decide credential per privacy partition.
  if (isPrivateEvent.value) {
    if (!hasGuestCredential.value) {
      // No invitation → can't comment on a private event. UI hides the form,
      // but guard here in case of race conditions.
      errorMessage.value = commentInviteOnlyPromptText.value
      return
    }
  } else if (!authStore.isAuthenticated) {
    openAuthModal()
    return
  }

  // Check if user/guest has already commented (one per author per event)
  if (hasAlreadyCommented.value) {
    errorMessage.value = 'You have already commented on this event.'
    setTimeout(() => {
      errorMessage.value = ''
    }, 5000)
    return
  }

  isSubmittingComment.value = true
  errorMessage.value = ''

  // Pass shortcode only on private events; backend ignores it on public.
  const shortcode = isPrivateEvent.value ? props.guestShortcode : null

  try {
    const response = await commentsService.createComment(
      props.eventId,
      validation.sanitized,
      shortcode,
    )

    if (response.success && response.data) {
      // Sanitize the response data (backend now provides author_name/avatar,
      // user_info or guest_info — no need to synthesise user_info anymore).
      const sanitizedComment = sanitizeApiResponse(response.data)

      // Since each author can only comment once per event, just add to beginning.
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

      // Check if the current author (user OR guest) has already commented.
      if (isPrivateEvent.value) {
        if (hasGuestCredential.value) {
          hasAlreadyCommented.value = comments.value.some(
            (c) => c.guest_info?.name === props.guestName,
          )
        }
      } else if (authStore.isAuthenticated && authStore.user) {
        hasAlreadyCommented.value = comments.value.some(
          (c) => c.user_info?.id === authStore.user!.id,
        )
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
      const processedNewComments = response.data.results.map((c) => sanitizeApiResponse(c))

      // Append the new page, then float the current author's comment to the
      // top (handles both user- and guest-authored cases via isUserCommentOwner).
      const ownIndexExisting = comments.value.findIndex((c) => isUserCommentOwner(c))
      const ownComment = ownIndexExisting >= 0 ? comments.value[ownIndexExisting] : null

      const merged = [...comments.value, ...processedNewComments]
      const newOwnIndex = merged.findIndex((c) => isUserCommentOwner(c))

      if (newOwnIndex > 0) {
        const own = ownComment || merged[newOwnIndex]
        comments.value = [
          own,
          ...merged.filter((_, idx) => idx !== newOwnIndex),
        ]
      } else {
        comments.value = merged
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

// A wish the guest just posted has to be on the page, or posting reads as
// having failed. The list is capped, so growing the cap alongside the buffer is
// what keeps the newest one visible.
watch(
  () => comments.value.length,
  (len, prev) => {
    if (len > prev && visibleWishCount.value < WISHES_PER_REVEAL) {
      visibleWishCount.value = WISHES_PER_REVEAL
    }
  },
)

// Watchers
watch(
  () => authStore.isAuthenticated,
  async (isAuth, wasAuth) => {
    // Auth changes only matter for the JWT (public) flow. Private events
    // are shortcode-only and the JWT is irrelevant.
    if (isPrivateEvent.value) return

    if (isAuth && !wasAuth) {
      // User just logged in — reload comments to surface their own comment
      // at the top and update hasAlreadyCommented.
      await loadComments()
      checkForCommentRedirect()
    } else if (!isAuth) {
      hasAlreadyCommented.value = false
      newComment.value.message = ''
      errorMessage.value = ''
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
const setupCommentAnimation = (el: any, id: string, _index: number) => {
  if (el && typeof el === 'object' && 'tagName' in el) {
    nextTick(() => {
      observeStaggerElement(el, id, 'comments')
    })
  }
}

// Click outside handler to close menu
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (openMenuId.value !== null && !target.closest('.comment-options-menu')) {
    closeCommentMenu()
  }
}

// Lifecycle
onMounted(async () => {
  await loadComments()
  // Check if user should be redirected to comment section (after login)
  checkForCommentRedirect()

  // Add click outside listener to close menus
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Liquid Glass Container - Comment Form */
.comment-form-liquid {
  border-radius: 1.5rem;
  padding: 1rem;
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  transition:
    padding 220ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
  margin-bottom: 0.75rem;
  box-sizing: border-box;
}

/* Every lift in this file is gated on a real pointer. On a touch screen :hover
   latches after a tap and does not release until something else is tapped, so
   an ungated lift leaves a card sitting 1px high with a heavier blur for as
   long as the guest keeps reading. */
@media (hover: hover) and (pointer: fine) {
  .comment-form-liquid:hover {
    -webkit-backdrop-filter: blur(24px);
    backdrop-filter: blur(24px);
    transform: translateY(-1px);
  }
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
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
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

@media (hover: hover) and (pointer: fine) {
  .liquid-glass-button:hover::after {
    left: 100%;
  }

  .liquid-glass-button:hover {
    transform: translateY(-1px);
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
  }
}

/* Liquid Glass Textarea */
.liquid-glass-textarea {
  border-radius: 1rem;
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
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
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
}

/* Comment Card Liquid Glass */
.comment-card-liquid {
  border-radius: 1.5rem;
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  position: relative;
  overflow: visible;
  transition: transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
  box-sizing: border-box;
}

@media (hover: hover) and (pointer: fine) {
  .comment-card-liquid:hover {
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    transform: translateY(-1px) !important;
  }
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
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border: none;
  cursor: pointer;
  position: relative;
}

.liquid-glass-action-button:hover {
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
}

/* Liquid Glass Edit Buttons */
.liquid-glass-edit-button {
  border-radius: 0.75rem;
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border: none;
  cursor: pointer;
  position: relative;
}

.liquid-glass-edit-button:hover {
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
}

/* Liquid Glass State Containers */
.liquid-glass-state {
  border-radius: 1.5rem;
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
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
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
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

/* ---------------------------------------------------------------------------
 * The wish card
 *
 * A wedding guestbook on a 390px phone has about 318px of card and, in Khmer,
 * roughly 26 characters of line. Everything drawn on that card is taken out of
 * the message, so each piece of chrome has to earn its width: the rule marks
 * the quotation, the hairline separates the message from who signed it, and
 * the avatar says who. Nothing else is drawn.
 * ------------------------------------------------------------------------ */

/* The rule runs the height of the message, not the card - it marks the quote,
   and the signature underneath is not part of the quote. */
.wish-message {
  position: relative;
  padding-left: 0.75rem;
}

.wish-message::before {
  content: '';
  position: absolute;
  inset-block: 0.15em 0.15em;
  left: 0;
  width: 2px;
  border-radius: 1px;
  background: linear-gradient(
    180deg,
    var(--wish-rule, currentColor) 0%,
    var(--wish-rule-fade, transparent) 100%
  );
  pointer-events: none;
}

/* Wishes settle in sequence rather than all at once - a guestbook is read one
   entry at a time, and 60ms is short enough that the last one is still
   arriving as the eye reaches it. Capped at six steps: past that the delay
   stops reading as rhythm and starts reading as lag. */
.wish-card {
  animation: wishIn 380ms cubic-bezier(0.23, 1, 0.32, 1) backwards;
  animation-delay: calc(min(var(--wish-index, 0), 6) * 60ms);
}

@keyframes wishIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

/* ---------------------------------------------------------------------------
 * "Read all wishes"
 *
 * A rule with a label in it rather than a button with a fill: it is a way to
 * continue reading, not a second action competing with Post.
 * ------------------------------------------------------------------------ */
.wish-more-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 0.25rem;
  margin-top: 0.25rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: opacity 160ms ease-out;
}

.wish-more-rule {
  flex: 1;
  height: 1px;
  min-width: 1.5rem;
}

.wish-more-label {
  opacity: 0.8;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.wish-more-button:active {
  opacity: 0.6;
}

/* ---------------------------------------------------------------------------
 * Collapsed composer
 * ------------------------------------------------------------------------ */
.comment-form-liquid.is-collapsed {
  padding: 0.6875rem 0.875rem;
}

.composer-trigger {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: transform 140ms cubic-bezier(0.23, 1, 0.32, 1);
}

.composer-trigger:active {
  transform: scale(0.985);
}

.composer-trigger__mark {
  width: 1.75rem;
  height: 1.75rem;
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

/* The textarea used to lift and scale to 1.01 on focus. On a phone, focus and
   the keyboard's own slide-up land in the same frames, so the field moved
   twice at once; and a transform on a focused text field resamples its glyphs,
   which is visible on Khmer diacritics at this size. The blur alone says
   "focused" without moving anything. */
.liquid-glass-textarea:focus {
  -webkit-backdrop-filter: blur(24px);
  backdrop-filter: blur(24px);
}

.liquid-glass-button {
  transition: transform 140ms cubic-bezier(0.23, 1, 0.32, 1);
}

.liquid-glass-button:active {
  transform: scale(0.97);
}

/* Reduce motion for accessibility - Let useAdvancedAnimations handle this */
@media (prefers-reduced-motion: reduce) {
  .liquid-glass-textarea:focus,
  .liquid-glass-button:active,
  .composer-trigger:active {
    transform: none !important;
  }

  /* The wishes still fade in - that is what says a new one arrived - but they
     no longer travel, and they arrive together rather than in sequence. */
  .wish-card {
    animation: wishFade 200ms ease-out backwards;
    animation-delay: 0ms;
  }

  @keyframes wishFade {
    from {
      opacity: 0;
    }
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

/* Khmer text fix now defined globally in src/assets/main.css */

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

/* Mobile (<1024px) - match the event info card shell radius (EventInfo.vue's
   .gradient-stroke-container is 1.25rem below 1024px) so the comment cards read
   as part of the same card system. */
@media (max-width: 1023px) {
  .comment-form-liquid,
  .comment-card-liquid,
  .liquid-glass-state {
    border-radius: 1.25rem;
  }
}

/* Small laptops 13-inch (1024px-1365px) - scaled to 67.5% matching RSVPSection */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Comment form container - 67.5% scale */
  .comment-form-liquid {
    border-radius: 1.01rem !important; /* 1.5rem * 0.675 */
    padding: 0.675rem !important; /* 1rem * 0.675 */
    margin-bottom: 0.5rem !important;
  }

  /* Text sizing - 67.5% scale */
  .text-sm {
    font-size: 0.6rem !important; /* Match RSVPSection location text size */
  }

  .text-xs {
    font-size: 0.5rem !important; /* 8px */
  }

  /* Sign-in button - Match RSVPSection exactly */
  .liquid-glass-button {
    padding: 0.5rem 1rem !important; /* Match RSVPSection */
    border-radius: 1.2rem !important; /* Match RSVPSection */
    font-size: 0.7rem !important; /* 11.2px - Match RSVPSection */
  }

  /* Textarea sizing - 67.5% scale */
  .liquid-glass-textarea {
    border-radius: 0.675rem !important; /* 1rem * 0.675 */
    padding: 0.34rem 0.5rem !important; /* Scaled down */
    font-size: 0.6rem !important; /* Match text-sm */
  }

  /* Comment text content */
  .comment-card-liquid p {
    font-size: 0.5rem !important; /* 8px */
  }

  /* Comment cards - 67.5% scale */
  .comment-card-liquid {
    border-radius: 1.01rem !important; /* 1.5rem * 0.675 */
    padding: 0.5rem !important; /* Reduced */
    margin-bottom: 0.4rem !important;
  }

  /* Action buttons */
  .liquid-glass-action-button {
    padding: 0.2rem !important;
    border-radius: 0.4rem !important;
  }

  .liquid-glass-edit-button {
    padding: 0.2rem 0.5rem !important;
    font-size: 0.5rem !important; /* 8px */
    border-radius: 0.4rem !important;
  }

  /* Edit mode container */
  .comment-card-liquid .space-y-3 {
    padding-left: 0.4rem !important;
    padding-right: 0.4rem !important;
    margin-bottom: 0.4rem !important;
    padding-top: 0.2rem !important;
  }

  /* Edit mode textarea */
  .comment-card-liquid .space-y-3 .liquid-glass-textarea {
    font-size: 0.5rem !important; /* 8px */
  }

  .comment-card-liquid .space-y-3 > * + * {
    margin-top: 0.4rem !important;
  }

  /* Edit mode buttons container */
  .comment-card-liquid .space-y-3 .flex.items-center.gap-2 {
    gap: 0.3rem !important;
  }

  /* Character counter in edit mode */
  .comment-card-liquid .space-y-3 .text-xs {
    font-size: 0.4rem !important; /* 6.4px */
  }

  /* Avatar sizing - 67.5% scale */
  .w-8.h-8 {
    width: 1.35rem !important; /* 2rem * 0.675 */
    height: 1.35rem !important;
  }

  /* Author signature row - 67.5% scale */
  .comment-author-row {
    gap: 0.3rem !important;
    padding-left: 0.3rem !important;
    padding-right: 0.3rem !important;
    padding-top: 0.4rem !important;
  }

  /* Quote mark sizing - 67.5% scale */
  .comment-card-liquid .text-4xl {
    font-size: 1.5rem !important; /* 2.25rem * 0.675 */
  }

  /* User name sizing */
  .comment-card-liquid .text-sm.font-medium {
    font-size: 0.5rem !important; /* 8px */
  }

  /* "You" badge sizing */
  .comment-card-liquid .text-\[0\.625rem\] {
    font-size: 0.4rem !important; /* 6.4px */
    padding: 0.05rem 0.2rem !important;
  }

  /* Timestamp sizing */
  .comment-card-liquid .text-xs {
    font-size: 0.4rem !important; /* 6.4px */
  }

  /* State containers - 67.5% scale */
  .liquid-glass-state {
    border-radius: 1.01rem !important;
    padding: 1.35rem !important; /* 2rem * 0.675 */
  }

  .liquid-glass-error {
    border-radius: 0.675rem !important;
    padding: 0.5rem !important;
  }

  /* Icons sizing - 67.5% scale */
  svg.w-6 {
    width: 1.01rem !important; /* 1.5rem * 0.675 */
    height: 1.01rem !important;
  }

  svg.w-4 {
    width: 0.675rem !important; /* 1rem * 0.675 */
    height: 0.675rem !important;
  }

  svg.w-3\.5 {
    width: 0.59rem !important;
    height: 0.59rem !important;
  }

  svg.w-3 {
    width: 0.5rem !important;
    height: 0.5rem !important;
  }

  /* Comments container height - 67.5% scale */
  .h-\[26rem\] {
    height: 17.55rem !important; /* 26rem * 0.675 */
  }

  /* Overall comment section spacing */
  #comment-section.mb-8 {
    margin-bottom: 1.35rem !important; /* 2rem * 0.675 */
  }

  /* Character counter and validation messages */
  .text-right.mt-1 {
    margin-top: 0.2rem !important;
  }

  /* Loading spinner sizing - 67.5% scale */
  .w-4.h-4 {
    width: 0.675rem !important;
    height: 0.675rem !important;
  }

  .w-12.h-12 {
    width: 2rem !important; /* 3rem * 0.675 */
    height: 2rem !important;
  }

  /* Sign-in prompt text in form */
  .comment-form-liquid .text-center.py-4 {
    padding-top: 0.675rem !important; /* 1rem * 0.675 */
    padding-bottom: 0.675rem !important;
  }

  .comment-form-liquid .text-center .mb-3 {
    margin-bottom: 0.5rem !important;
  }

  /* Options menu button - keep visible */
  .comment-options-menu {
    top: 0.4rem !important;
    right: 0.4rem !important;
    z-index: 50 !important;
  }

  .comment-options-menu button.p-1\.5 {
    padding: 0.25rem !important;
  }

  .comment-options-menu button.p-1\.5 svg {
    width: 0.75rem !important;
    height: 0.75rem !important;
  }
}

/* Medium laptops 14-15 inch (1366px-1535px) - scaled to 75% */
@media (min-width: 1366px) and (max-width: 1535px) {
  /* Comment form container - 75% scale */
  .comment-form-liquid {
    border-radius: 1.125rem !important; /* 1.5rem * 0.75 */
    padding: 0.75rem !important; /* 1rem * 0.75 */
    margin-bottom: 0.56rem !important;
  }

  /* Text sizing - 75% scale */
  .text-sm {
    font-size: 0.66rem !important; /* Match RSVPSection proportions */
  }

  .text-xs {
    font-size: 0.56rem !important;
  }

  /* Sign-in button - Match RSVPSection proportions for medium laptop */
  .liquid-glass-button {
    padding: 0.56rem 1.125rem !important; /* 75% scale */
    border-radius: 1.125rem !important;
    font-size: 0.75rem !important; /* 12px */
  }

  /* Textarea sizing - 75% scale */
  .liquid-glass-textarea {
    border-radius: 0.75rem !important;
    padding: 0.375rem 0.56rem !important;
    font-size: 0.66rem !important;
  }

  /* Comment text content */
  .comment-card-liquid p {
    font-size: 0.56rem !important;
  }

  /* Comment cards - 75% scale */
  .comment-card-liquid {
    border-radius: 1.125rem !important;
    padding: 0.56rem !important;
    margin-bottom: 0.45rem !important;
  }

  /* Action buttons */
  .liquid-glass-action-button {
    padding: 0.225rem !important;
    border-radius: 0.45rem !important;
  }

  .liquid-glass-edit-button {
    padding: 0.225rem 0.56rem !important;
    font-size: 0.56rem !important;
    border-radius: 0.45rem !important;
  }

  /* Edit mode container */
  .comment-card-liquid .space-y-3 {
    padding-left: 0.45rem !important;
    padding-right: 0.45rem !important;
    margin-bottom: 0.45rem !important;
    padding-top: 0.225rem !important;
  }

  /* Edit mode textarea */
  .comment-card-liquid .space-y-3 .liquid-glass-textarea {
    font-size: 0.56rem !important;
  }

  .comment-card-liquid .space-y-3 > * + * {
    margin-top: 0.45rem !important;
  }

  /* Edit mode buttons container */
  .comment-card-liquid .space-y-3 .flex.items-center.gap-2 {
    gap: 0.34rem !important;
  }

  /* Character counter in edit mode */
  .comment-card-liquid .space-y-3 .text-xs {
    font-size: 0.45rem !important;
  }

  /* Avatar sizing - 75% scale */
  .w-8.h-8 {
    width: 1.5rem !important; /* 2rem * 0.75 */
    height: 1.5rem !important;
  }

  /* Author signature row - 75% scale */
  .comment-author-row {
    gap: 0.34rem !important;
    padding-left: 0.34rem !important;
    padding-right: 0.34rem !important;
    padding-top: 0.45rem !important;
  }

  /* Quote mark sizing - 75% scale */
  .comment-card-liquid .text-4xl {
    font-size: 1.7rem !important; /* 2.25rem * 0.75 */
  }

  /* User name sizing */
  .comment-card-liquid .text-sm.font-medium {
    font-size: 0.56rem !important;
  }

  /* "You" badge sizing */
  .comment-card-liquid .text-\[0\.625rem\] {
    font-size: 0.45rem !important;
    padding: 0.06rem 0.225rem !important;
  }

  /* Timestamp sizing */
  .comment-card-liquid .text-xs {
    font-size: 0.45rem !important;
  }

  /* State containers - 75% scale */
  .liquid-glass-state {
    border-radius: 1.125rem !important;
    padding: 1.5rem !important; /* 2rem * 0.75 */
  }

  .liquid-glass-error {
    border-radius: 0.75rem !important;
    padding: 0.56rem !important;
  }

  /* Icons sizing - 75% scale */
  svg.w-6 {
    width: 1.125rem !important;
    height: 1.125rem !important;
  }

  svg.w-4 {
    width: 0.75rem !important;
    height: 0.75rem !important;
  }

  svg.w-3\.5 {
    width: 0.66rem !important;
    height: 0.66rem !important;
  }

  svg.w-3 {
    width: 0.56rem !important;
    height: 0.56rem !important;
  }

  /* Comments container height - 75% scale */
  .h-\[26rem\] {
    height: 19.5rem !important; /* 26rem * 0.75 */
  }

  /* Overall comment section spacing */
  #comment-section.mb-8 {
    margin-bottom: 1.5rem !important;
  }

  /* Character counter and validation messages */
  .text-right.mt-1 {
    margin-top: 0.225rem !important;
  }

  /* Loading spinner sizing - 75% scale */
  .w-4.h-4 {
    width: 0.75rem !important;
    height: 0.75rem !important;
  }

  .w-12.h-12 {
    width: 2.25rem !important;
    height: 2.25rem !important;
  }

  /* Sign-in prompt text in form */
  .comment-form-liquid .text-center.py-4 {
    padding-top: 0.75rem !important;
    padding-bottom: 0.75rem !important;
  }

  .comment-form-liquid .text-center .mb-3 {
    margin-bottom: 0.56rem !important;
  }

  /* Options menu button - keep visible */
  .comment-options-menu {
    top: 0.45rem !important;
    right: 0.45rem !important;
  }

  .comment-options-menu button.p-1\.5 {
    padding: 0.28rem !important;
  }

  .comment-options-menu button.p-1\.5 svg {
    width: 0.8rem !important;
    height: 0.8rem !important;
  }
}

/* Teleported dropdown menu - global styles (not scoped) */
</style>

<style>
/* Teleported dropdown menu styles - must be unscoped to affect teleported content */
.comment-dropdown-menu {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* Small laptops dropdown sizing */
@media (min-width: 1024px) and (max-width: 1365px) {
  .comment-dropdown-menu {
    min-width: 70px !important;
    padding: 0.25rem 0 !important;
    border-radius: 0.5rem !important;
  }

  .comment-dropdown-menu button {
    padding: 0.3rem 0.5rem !important;
    font-size: 0.5rem !important;
    gap: 0.25rem !important;
  }

  .comment-dropdown-menu button svg {
    width: 0.5rem !important;
    height: 0.5rem !important;
  }
}

/* Medium laptops dropdown sizing */
@media (min-width: 1366px) and (max-width: 1535px) {
  .comment-dropdown-menu {
    min-width: 75px !important;
    padding: 0.28rem 0 !important;
    border-radius: 0.56rem !important;
  }

  .comment-dropdown-menu button {
    padding: 0.34rem 0.56rem !important;
    font-size: 0.56rem !important;
    gap: 0.28rem !important;
  }

  .comment-dropdown-menu button svg {
    width: 0.56rem !important;
    height: 0.56rem !important;
  }
}
</style>
