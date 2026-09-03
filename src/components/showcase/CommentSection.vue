<template>
  <!--
    The guestbook.

    Not a comment thread. A guest writes one blessing, signs it, and everyone
    who opens the invitation reads it — so this is a signed page, not a feed:
    one glass sheet tinted in the template's own colour, wishes separated by a
    hairline rather than each boxed on its own, and every entry closed by a
    signature rather than opened by an avatar.

    What that replaced, and why: each wish used to be its own bordered card
    carrying a 28px avatar disc, an inner hairline, a name row and a relative
    time — four pieces of chrome around two facts, stacked N deep inside a card
    that is itself glass. On a 390px phone that is roughly a third of the
    section spent on frames, and the frames read as a comment app. Each card
    also ran its own `backdrop-filter`, so a list of wishes cost N compositor
    passes on the phone least able to pay them; the sheet blurs once.
  -->
  <div id="comment-section" class="wb" :style="wbVars">
    <!-- ══ Heading ══════════════════════════════════════════════════════
         A sibling of the Agenda and RSVP headings: same size ladder, same
         ornament, and it keeps the template's primary face through its own
         inline style (see the guestbook type rule in the unscoped block). -->
    <header class="wb-head">
      <h2
        class="wb-title"
        :class="{ 'khmer-text-fix': currentLanguage === 'kh' }"
        :style="{ fontFamily: primaryFont || currentFont }"
      >
        {{ commentHeaderText }}
      </h2>
      <span class="wb-orn" aria-hidden="true">
        <span class="wb-orn__rule"></span>
        <span class="wb-orn__gem"></span>
        <span class="wb-orn__rule"></span>
      </span>
    </header>

    <!-- ══ The book ═════════════════════════════════════════════════════
         One surface. Everything below — the composer, its notices, the
         wishes, the ask for more — lives on it, separated by hairlines. -->
    <div ref="panelRef" class="wb-panel" :class="{ 'is-revealed': isRevealed }">
      <!-- ── Where a guest signs ────────────────────────────────────────
           Kept above the wishes and collapsed to a single row: expanded it
           is a textarea, a counter and a button, and an empty box asking a
           guest to write before they have read anything is the wrong first
           screen. It opens by default when there is nothing to read, since
           composing is then the only thing this section can offer. -->
      <div class="wb-compose">
        <!-- Private event opened without an invitation link -->
        <p v-if="showInviteOnlyPrompt" class="wb-note">
          {{ commentInviteOnlyPromptText }}
        </p>

        <!-- Public event, signed out -->
        <div v-else-if="showLoginPrompt" class="wb-note-stack">
          <p class="wb-note">{{ commentSigninPromptText }}</p>
          <button type="button" class="wb-submit" @click="handleSignInClick">
            {{ commentSigninButtonText }}
          </button>
        </div>

        <!-- Already signed. One quiet line: their wish is at the top of the
             list below, marked as theirs, so a padded block restating it is
             chrome over an answer the page already gives. -->
        <p v-else-if="hasAlreadyCommented" class="wb-note wb-note--done">
          <Check class="wb-note__tick" aria-hidden="true" />
          <span>{{ commentAlreadyCommentedText }}</span>
        </p>

        <!-- Collapsed composer -->
        <button v-else-if="composerCollapsed" type="button" class="wb-trigger" @click="openComposer">
          <span class="wb-trigger__mark" aria-hidden="true">
            <PenLine class="wb-trigger__pen" />
          </span>
          <span class="wb-trigger__label">{{ commentComposeCtaText }}</span>
        </button>

        <!-- Open composer -->
        <form v-else-if="canShowCommentForm" class="wb-form" @submit.prevent="submitComment">
          <p v-if="commentAuthMode === 'guest' && guestName" class="wb-form__as">
            {{ commentCommentingAsText }} <strong>{{ guestName }}</strong>
          </p>

          <!-- Set in the size and leading the wish itself will be shown in, so
               a guest writes into the shape they are about to appear in. -->
          <textarea
            ref="composerTextareaRef"
            v-model="newComment.message"
            class="wb-field"
            :class="{
              'is-khmer': isKhmer(newComment.message),
              'is-invalid': !commentValidation.isValid,
            }"
            :placeholder="commentPlaceholderText"
            rows="3"
            maxlength="500"
            required
            @input="handleCommentInput"
            @blur="validateCommentOnBlur"
          />

          <!-- The count appears only once it is close enough to matter. At
               0/500 it is a rule the guest has not come near, printed under an
               empty box. -->
          <p
            v-if="!commentValidation.isValid && commentValidation.errors.length > 0"
            class="wb-form__hint is-error"
          >
            {{ commentValidation.errors[0] }}
          </p>
          <p v-else-if="newComment.message.length >= 400" class="wb-form__hint">
            {{ newComment.message.length }}/500
          </p>

          <button
            type="submit"
            class="wb-submit"
            :disabled="
              isSubmittingComment || !newComment.message.trim() || !commentValidation.isValid
            "
          >
            {{ isSubmittingComment ? commentPostingButtonText : commentPostButtonText }}
          </button>
        </form>
      </div>

      <div class="wb-seam" aria-hidden="true"></div>

      <!-- ── The wishes ─────────────────────────────────────────────────
           Flows with the page rather than scrolling inside itself: a fixed
           overflow box is a third nested scroller on a phone, and it reserves
           its height whether or not there is anything to put in it. Length is
           handled where it comes from — the number of wishes. -->
      <div v-if="loadingComments" class="wb-quiet">
        <span class="wb-spinner" aria-hidden="true"></span>
        <span>{{ commentLoadingText }}</span>
      </div>

      <div v-else-if="comments.length === 0" class="wb-empty">
        <span class="wb-orn wb-orn--sm" aria-hidden="true">
          <span class="wb-orn__rule"></span>
          <span class="wb-orn__gem"></span>
          <span class="wb-orn__rule"></span>
        </span>
        <p class="wb-empty__text">{{ commentNoCommentsText }}</p>
      </div>

      <div v-else class="wb-list">
        <article
          v-for="(comment, index) in visibleComments"
          :key="comment.id"
          class="wb-wish"
          :class="{ 'is-mine': isUserCommentOwner(comment) }"
          :style="{ '--wish-index': index }"
        >
          <!-- The wish is the loudest thing on the sheet: set larger than
               anything around it and given its own leading, which is the only
               emphasis it needs. Line breaks the guest typed are kept — a
               blessing is often written in short lines. -->
          <p
            v-if="editingCommentId !== comment.id"
            class="wb-wish__text"
            :class="{ 'is-khmer': isKhmer(comment.comment_text) }"
          >{{ capitalizeFirstLetter(comment.comment_text) }}</p>

          <div v-else class="wb-edit">
            <textarea
              v-model="editCommentText"
              class="wb-field"
              :class="{ 'is-khmer': isKhmer(editCommentText) }"
              rows="3"
              maxlength="500"
              :placeholder="commentPlaceholderText"
            />
            <div class="wb-edit__foot">
              <span class="wb-edit__count">{{ editCommentText.length }}/500</span>
              <span class="wb-edit__actions">
                <button
                  type="button"
                  class="wb-ghost"
                  :disabled="isUpdatingComment"
                  @click="cancelEditComment"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="wb-solid"
                  :disabled="
                    isUpdatingComment ||
                    !editCommentText.trim() ||
                    editCommentText === comment.comment_text
                  "
                  @click="updateComment(comment.id)"
                >
                  {{ isUpdatingComment ? 'Saving…' : 'Save' }}
                </button>
              </span>
            </div>
          </div>

          <!-- The signature. Right-aligned and dashed, the way a card is
               signed rather than the way a comment is attributed — which is
               what lets the avatar, the name row and the inner hairline all go
               and gives the message its full measure back. -->
          <footer class="wb-sign">
            <span class="wb-sign__name">— {{ getCommentDisplayName(comment) }}</span>
            <span v-if="isUserCommentOwner(comment)" class="wb-sign__you">
              {{ commentYouBadgeText }}
            </span>
            <span class="wb-sign__sep" aria-hidden="true">·</span>
            <time class="wb-sign__time" :datetime="comment.created_at">
              {{ formatCommentDate(comment.created_at) }}
            </time>
            <span
              v-if="isUserCommentOwner(comment)"
              :ref="(el) => setMenuButtonRef(el, comment.id)"
              class="wb-sign__menu comment-options-menu"
            >
              <button
                type="button"
                class="wb-sign__menu-btn"
                aria-label="Options"
                @click.stop="toggleCommentMenu(comment.id)"
              >
                <MoreVertical class="wb-sign__menu-icon" />
              </button>
            </span>
          </footer>
        </article>

        <!-- The list's own length control. An explicit ask is cheaper than
             infinite scroll (nothing loads until a guest wants it) and honest
             about how many wishes there are, which on a wedding is a number
             the couple wants seen. -->
        <button v-if="canRevealMoreWishes" type="button" class="wb-more" @click="revealMoreWishes">
          <span class="wb-more__rule"></span>
          <span class="wb-more__label">{{ showAllWishesText }}</span>
          <span class="wb-more__rule"></span>
        </button>

        <div v-if="loadingMoreComments" class="wb-quiet wb-quiet--sm">
          <span class="wb-spinner" aria-hidden="true"></span>
          <span>{{ commentLoadingText }}</span>
        </div>
      </div>
    </div>

    <p v-if="errorMessage" class="wb-error" role="alert">{{ errorMessage }}</p>
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
        :style="{ color: '#ffffff' }"
      >
        <Edit class="w-3 h-3" />
        Edit
      </button>
      <button
        @click="handleDeleteFromMenu(getCommentById(openMenuId))"
        class="w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 transition-colors hover:bg-white/10"
        :style="{ color: '#ffffff' }"
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
import { Check, Edit, Trash2, MoreVertical, PenLine } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { commentsService, type EventComment } from '../../services/api'
import DeleteConfirmModal from '../DeleteConfirmModal.vue'
import AuthModal from '../AuthModal.vue'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'
import { showcaseRevealObserverInit } from '../../composables/showcase/useScrollProgress'
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
  /** Heading only. The wishes below set their own type - see the guestbook rule in the unscoped style block. */
  currentFont?: string
  primaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  eventType?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  commentSubmitted: [EventComment]
}>()

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
    comment_compose_cta: 'comment_compose_cta',
    comment_compose_cta_funeral: 'comment_compose_cta_funeral',
    comment_show_all: 'comment_show_all',
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
const composerTextareaRef = ref<HTMLTextAreaElement | null>(null)

// How many wishes are on the page. Three is what fits under the composer on a
// 390px phone without the section running past a screen, which is the length
// at which a guest still reads them rather than scrolls them.
const WISHES_PER_REVEAL = 3
const visibleWishCount = ref(WISHES_PER_REVEAL)
const composerOpenedByGuest = ref(false)
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

/**
 * The three colours the whole sheet is drawn from, published once on the root
 * rather than bound inline on every node.
 *
 * Every surface below is a `color-mix` of `--wb-tone` (the template's own
 * colour) so the glass carries the template rather than a neutral grey, and
 * every piece of copy is a mix of `--wb-ink`. Binding those per element is what
 * produced ~40 inline style objects here, several of them re-evaluated for each
 * wish in the list.
 */
const wbVars = computed<Record<string, string>>(() => ({
  '--wb-ink': props.primaryColor,
  '--wb-tone': backgroundColor.value,
  '--wb-accent': props.accentColor || props.primaryColor,
}))

/**
 * Khmer is detected per wish, from the wish itself — never from the language
 * picker at the top of the invitation.
 *
 * A guest writes in whatever script they write in, and one Cambodian wedding's
 * guestbook holds Khmer and English wishes side by side; the picker says which
 * language the *couple's* copy is in, which is a different question. The face
 * already resolves per glyph (Karla carries no Khmer, so a Khmer cluster falls
 * through to Kantumruy Pro on its own) — this is the leading and the wrapping
 * doing the same, since coeng subscripts clip at Latin leading and Khmer does
 * not hyphenate.
 */
const KHMER_SCRIPT = /\p{Script=Khmer}/u
const isKhmer = (text: string | null | undefined): boolean => KHMER_SCRIPT.test(text || '')

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

/**
 * The wishes settle in sequence when the sheet comes into view.
 *
 * One observer on the panel, not one per wish: the stagger is a CSS delay keyed
 * off each entry's own `--wish-index`, so the only thing JavaScript has to
 * decide is *when the page has been reached*. It replaced a per-element stagger
 * observer that wrote inline `opacity`/`transform` on every card while the CSS
 * keyframe animated the same two properties — two entrance systems on one
 * element, with the winner decided by which finished last.
 *
 * `showcaseRevealObserverInit()` is the showcase's shared config; its root is
 * the liquid-glass card's own scroller, which is where all scrolling actually
 * happens.
 */
const panelRef = ref<HTMLElement | null>(null)
const isRevealed = ref(false)
let revealObserver: IntersectionObserver | null = null

const setupRevealObserver = () => {
  // No observer support (or no element to watch) must never leave the wishes
  // hidden — they are the content this section exists for.
  if (!panelRef.value || typeof IntersectionObserver === 'undefined') {
    isRevealed.value = true
    return
  }

  revealObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      isRevealed.value = true
      revealObserver?.disconnect()
      revealObserver = null
    }
  }, showcaseRevealObserverInit())

  revealObserver.observe(panelRef.value)
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
  setupRevealObserver()

  await loadComments()
  // Check if user should be redirected to comment section (after login)
  checkForCommentRedirect()

  // Add click outside listener to close menus
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  revealObserver?.disconnect()
  revealObserver = null
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* ===========================================================================
 * The guestbook
 *
 * One glass sheet, tinted in the template's own colour, with the wishes written
 * on it. Three custom properties come in from the component (`--wb-ink`,
 * `--wb-tone`, `--wb-accent`) and everything below is a mix of them, so a
 * template's palette reaches every surface without a single inline style.
 *
 * Sizing is mobile-first and scaled by ONE number, `--wb-s`. The showcase card
 * is 85vh, so on a 13–15" laptop every section has to render at roughly
 * two-thirds size; that used to be ~200 lines of `!important` overrides here,
 * one per element, drifting from the values they were meant to track. Now the
 * two laptop media queries set `--wb-s` and nothing else.
 * ======================================================================== */

.wb {
  --wb-s: 1;
  --wb-ease: cubic-bezier(0.23, 1, 0.32, 1);
  --wb-hair: color-mix(in srgb, var(--wb-tone) 24%, transparent);
  --wb-hair-soft: color-mix(in srgb, var(--wb-tone) 13%, transparent);

  color: var(--wb-ink);
  margin-bottom: calc(2rem * var(--wb-s));
}

/* ---------------------------------------------------------------------------
 * Heading
 * ------------------------------------------------------------------------ */

.wb-head {
  text-align: center;
  margin-bottom: calc(1.125rem * var(--wb-s));
}

.wb-title {
  font-size: calc(1.5rem * var(--wb-s));
  line-height: 1.25;
  font-weight: 400;
  text-transform: capitalize;
  padding-block: calc(0.25rem * var(--wb-s));
  color: var(--wb-ink);
}

/* The section's one ornament, reused rather than reinvented: under the heading
   at full width, and once more (shortened) in the empty state, which is the
   only other place a mark is earned. */
.wb-orn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.wb-orn__rule {
  height: 1px;
  width: calc(2.5rem * var(--wb-s));
  background: linear-gradient(90deg, transparent, var(--wb-hair));
}

.wb-orn__rule:last-child {
  background: linear-gradient(90deg, var(--wb-hair), transparent);
}

.wb-orn__gem {
  flex: 0 0 auto;
  width: calc(0.375rem * var(--wb-s));
  height: calc(0.375rem * var(--wb-s));
  transform: rotate(45deg);
  background: color-mix(in srgb, var(--wb-tone) 45%, transparent);
}

/* ---------------------------------------------------------------------------
 * The sheet
 *
 * The one element in this section that is really glass. It sits inside the
 * main content card, which is itself translucent — so the tint stays low and
 * the light top edge, not a border, is what makes it read as a material.
 *
 * The blur is not decorative: when a template turns the card's own glass off
 * (`display_liquid_glass_background: false`), this sheet is all that stands
 * between the wishes and a playing background video.
 * ------------------------------------------------------------------------ */

.wb-panel {
  position: relative;
  overflow: hidden;
  border-radius: 1.25rem;
  padding: calc(0.875rem * var(--wb-s)) calc(1rem * var(--wb-s));
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--wb-tone) 9%, transparent),
    color-mix(in srgb, var(--wb-tone) 4%, transparent)
  );
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--wb-tone) 14%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    0 10px 30px -20px color-mix(in srgb, var(--wb-tone) 70%, transparent);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  backdrop-filter: blur(14px) saturate(150%);
  contain: layout style paint;
}

/* ---------------------------------------------------------------------------
 * Where a guest signs
 * ------------------------------------------------------------------------ */

.wb-trigger {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  /* 44px on a phone: this row is the only way into the composer, so it is a
     touch target before it is a label. */
  min-height: calc(2.75rem * var(--wb-s));
  padding: 0;
  background: none;
  border: 0;
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition: transform 140ms var(--wb-ease);
}

.wb-trigger:active {
  transform: scale(0.99);
}

.wb-trigger__mark {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(1.875rem * var(--wb-s));
  height: calc(1.875rem * var(--wb-s));
  border-radius: 999px;
  background: color-mix(in srgb, var(--wb-tone) 12%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--wb-tone) 20%, transparent);
}

.wb-trigger__pen {
  width: calc(0.875rem * var(--wb-s));
  height: calc(0.875rem * var(--wb-s));
  opacity: 0.75;
}

.wb-trigger__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: calc(0.875rem * var(--wb-s));
  color: color-mix(in srgb, var(--wb-ink) 72%, transparent);
}

.wb-form__as {
  margin-bottom: calc(0.5rem * var(--wb-s));
  font-size: calc(0.75rem * var(--wb-s));
  color: color-mix(in srgb, var(--wb-ink) 72%, transparent);
}

/* An inset well rather than another pane of glass: a translucent field on a
   translucent sheet is where legibility collapses, and a well also says
   "write here" without a label. */
.wb-field {
  display: block;
  width: 100%;
  border: 0;
  border-radius: calc(0.875rem * var(--wb-s));
  padding: calc(0.75rem * var(--wb-s));
  font-size: calc(0.9375rem * var(--wb-s));
  line-height: 1.75;
  color: var(--wb-ink);
  background: color-mix(in srgb, var(--wb-tone) 7%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--wb-tone) 16%, transparent);
  resize: none;
  transition: box-shadow 200ms ease;
}

.wb-field::placeholder {
  color: color-mix(in srgb, var(--wb-ink) 42%, transparent);
}

/* Focus is said with light, not movement. The field used to lift and scale on
   focus, which on a phone lands in the same frames as the keyboard's own
   slide-up — the field moved twice at once — and a transform on a focused text
   field resamples its glyphs, visible on Khmer diacritics at this size. */
.wb-field:focus {
  outline: none;
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--wb-tone) 46%, transparent),
    0 0 0 3px color-mix(in srgb, var(--wb-tone) 12%, transparent);
}

.wb-field.is-khmer {
  font-size: calc(0.875rem * var(--wb-s));
  line-height: 2;
}

.wb-field.is-invalid {
  box-shadow: inset 0 0 0 1px rgba(220, 38, 38, 0.45);
}

.wb-form__hint {
  margin-top: calc(0.375rem * var(--wb-s));
  font-size: calc(0.6875rem * var(--wb-s));
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--wb-ink) 50%, transparent);
}

.wb-form__hint.is-error {
  text-align: left;
  color: #dc2626;
}

.wb-submit {
  display: block;
  width: 100%;
  margin-top: calc(0.75rem * var(--wb-s));
  min-height: calc(2.75rem * var(--wb-s));
  padding: calc(0.625rem * var(--wb-s)) 1rem;
  border: 0;
  border-radius: 999px;
  background: var(--wb-tone);
  color: #ffffff;
  font-size: calc(0.875rem * var(--wb-s));
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 8px 20px -12px color-mix(in srgb, var(--wb-tone) 90%, transparent);
  transition:
    transform 140ms var(--wb-ease),
    opacity 160ms ease;
}

.wb-submit:active:not(:disabled) {
  transform: scale(0.98);
}

.wb-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ---------------------------------------------------------------------------
 * Notices — one line each, never a padded block
 * ------------------------------------------------------------------------ */

.wb-note {
  padding-block: calc(0.5rem * var(--wb-s));
  font-size: calc(0.8125rem * var(--wb-s));
  line-height: 1.7;
  text-align: center;
  color: color-mix(in srgb, var(--wb-ink) 75%, transparent);
}

.wb-note--done {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
}

.wb-note__tick {
  flex: 0 0 auto;
  width: calc(0.875rem * var(--wb-s));
  height: calc(0.875rem * var(--wb-s));
  opacity: 0.7;
}

.wb-note-stack .wb-note {
  padding-bottom: 0;
}

/* ---------------------------------------------------------------------------
 * Seams
 * ------------------------------------------------------------------------ */

.wb-seam {
  height: 1px;
  margin-block: calc(0.75rem * var(--wb-s));
  background: linear-gradient(90deg, transparent, var(--wb-hair), transparent);
}

/* ---------------------------------------------------------------------------
 * Loading and empty
 * ------------------------------------------------------------------------ */

.wb-quiet {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding-block: calc(1.25rem * var(--wb-s));
  font-size: calc(0.8125rem * var(--wb-s));
  color: color-mix(in srgb, var(--wb-ink) 65%, transparent);
}

.wb-quiet--sm {
  padding-block: calc(0.75rem * var(--wb-s));
}

.wb-spinner {
  flex: 0 0 auto;
  width: calc(0.875rem * var(--wb-s));
  height: calc(0.875rem * var(--wb-s));
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--wb-ink) 32%, transparent);
  border-top-color: transparent;
  animation: wbSpin 0.7s linear infinite;
}

@keyframes wbSpin {
  to {
    transform: rotate(360deg);
  }
}

.wb-empty {
  text-align: center;
  padding-block: calc(0.75rem * var(--wb-s)) calc(1.25rem * var(--wb-s));
}

.wb-orn--sm {
  margin-bottom: calc(0.625rem * var(--wb-s));
}

.wb-orn--sm .wb-orn__rule {
  width: calc(1.75rem * var(--wb-s));
}

.wb-empty__text {
  font-size: calc(0.8125rem * var(--wb-s));
  line-height: 1.7;
  color: color-mix(in srgb, var(--wb-ink) 62%, transparent);
}

/* ---------------------------------------------------------------------------
 * A wish
 *
 * No box, no border, no avatar: an entry on a page, separated from the next by
 * a hairline that fades out at both ends the way the heading's ornament does.
 * Everything drawn here is taken out of the message — on a 390px phone a wish
 * has about 26 Khmer characters of line — so the only two things drawn are the
 * message and the signature.
 * ------------------------------------------------------------------------ */

.wb-wish {
  position: relative;
  padding-block: calc(1rem * var(--wb-s));
}

.wb-wish:first-child {
  padding-top: calc(0.25rem * var(--wb-s));
}

.wb-wish:last-child {
  padding-bottom: calc(0.25rem * var(--wb-s));
}

.wb-wish + .wb-wish::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--wb-hair-soft) 18%,
    var(--wb-hair-soft) 82%,
    transparent
  );
}

.wb-wish__text {
  font-size: calc(0.9375rem * var(--wb-s));
  line-height: 1.8;
  color: var(--wb-ink);
  overflow-wrap: break-word;
  /* A blessing is often written in short lines. Keeping the guest's own breaks
     costs nothing and is the difference between a verse and a paragraph. */
  white-space: pre-line;
}

.wb-wish__text.is-khmer {
  font-size: calc(0.875rem * var(--wb-s));
  line-height: 2.05;
  word-break: keep-all;
  overflow-wrap: anywhere;
  hyphens: none;
  -webkit-hyphens: none;
}

/* ---------------------------------------------------------------------------
 * The signature
 * ------------------------------------------------------------------------ */

.wb-sign {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.125rem 0.375rem;
  margin-top: calc(0.5rem * var(--wb-s));
}

.wb-sign__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: calc(0.8125rem * var(--wb-s));
  font-weight: 500;
  letter-spacing: 0.01em;
  color: color-mix(in srgb, var(--wb-ink) 80%, transparent);
}

/* The guest's own wish is the only thing the accent is spent on in this
   section, and it is spent on the name rather than on a tinted band — a band
   would put the box back that this design just removed. */
.wb-wish.is-mine .wb-sign__name {
  color: var(--wb-accent);
}

.wb-sign__you {
  flex: 0 0 auto;
  padding: 0.1em 0.5em;
  border-radius: 999px;
  font-size: calc(0.625rem * var(--wb-s));
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--wb-accent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--wb-accent) 38%, transparent);
}

.wb-sign__sep,
.wb-sign__time {
  flex: 0 0 auto;
  color: color-mix(in srgb, var(--wb-ink) 46%, transparent);
}

.wb-sign__time {
  font-size: calc(0.6875rem * var(--wb-s));
  font-variant-numeric: tabular-nums;
}

/* At the trailing edge of the signature, not floating over the message: the
   old top-right position cost every wish a 28px right inset whether or not the
   guest owned it. */
.wb-sign__menu {
  flex: 0 0 auto;
  display: inline-flex;
  margin-right: calc(-0.5rem * var(--wb-s));
}

.wb-sign__menu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(2.25rem * var(--wb-s));
  height: calc(2.25rem * var(--wb-s));
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: none;
  cursor: pointer;
  color: color-mix(in srgb, var(--wb-ink) 55%, transparent);
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.wb-sign__menu-icon {
  width: calc(1rem * var(--wb-s));
  height: calc(1rem * var(--wb-s));
}

/* Every hover state in this file is gated on a real pointer. On a touch screen
   :hover latches after a tap and does not release until something else is
   tapped, so an ungated one leaves a control lit for as long as the guest
   keeps reading. */
@media (hover: hover) and (pointer: fine) {
  .wb-sign__menu-btn:hover {
    background: color-mix(in srgb, var(--wb-tone) 12%, transparent);
    color: var(--wb-ink);
  }
}

/* ---------------------------------------------------------------------------
 * Editing your own wish
 * ------------------------------------------------------------------------ */

.wb-edit__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: calc(0.5rem * var(--wb-s));
}

.wb-edit__count {
  font-size: calc(0.6875rem * var(--wb-s));
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--wb-ink) 46%, transparent);
}

.wb-edit__actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.wb-ghost,
.wb-solid {
  border: 0;
  border-radius: 999px;
  padding: calc(0.4rem * var(--wb-s)) calc(0.875rem * var(--wb-s));
  font-size: calc(0.75rem * var(--wb-s));
  font-weight: 500;
  cursor: pointer;
  transition:
    opacity 160ms ease,
    transform 140ms var(--wb-ease);
}

.wb-ghost {
  background: none;
  color: color-mix(in srgb, var(--wb-ink) 65%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--wb-tone) 22%, transparent);
}

.wb-solid {
  background: var(--wb-tone);
  color: #ffffff;
}

.wb-ghost:active:not(:disabled),
.wb-solid:active:not(:disabled) {
  transform: scale(0.97);
}

.wb-ghost:disabled,
.wb-solid:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ---------------------------------------------------------------------------
 * "Read all wishes"
 *
 * A rule with a label in it rather than a button with a fill: it is a way to
 * continue reading, not a second action competing with Post.
 * ------------------------------------------------------------------------ */

.wb-more {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  margin-top: calc(0.25rem * var(--wb-s));
  padding: calc(0.875rem * var(--wb-s)) 0.25rem calc(0.25rem * var(--wb-s));
  background: none;
  border: 0;
  cursor: pointer;
  color: var(--wb-ink);
  font-size: calc(0.75rem * var(--wb-s));
  transition: opacity 160ms ease;
}

.wb-more__rule {
  flex: 1;
  min-width: 1.5rem;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--wb-hair));
}

.wb-more__rule:last-child {
  background: linear-gradient(90deg, var(--wb-hair), transparent);
}

.wb-more__label {
  white-space: nowrap;
  font-weight: 500;
  letter-spacing: 0.05em;
  opacity: 0.78;
}

.wb-more:active {
  opacity: 0.6;
}

/* ---------------------------------------------------------------------------
 * Error
 * ------------------------------------------------------------------------ */

.wb-error {
  margin-top: calc(0.75rem * var(--wb-s));
  padding: calc(0.625rem * var(--wb-s)) calc(0.875rem * var(--wb-s));
  border-radius: calc(0.875rem * var(--wb-s));
  background: rgba(220, 38, 38, 0.1);
  box-shadow: inset 0 0 0 1px rgba(220, 38, 38, 0.25);
  color: #b91c1c;
  font-size: calc(0.8125rem * var(--wb-s));
  line-height: 1.6;
}

/* ---------------------------------------------------------------------------
 * Arrival
 *
 * Wishes settle in sequence rather than all at once — a guestbook is read one
 * entry at a time, and 70ms is short enough that the last one is still arriving
 * as the eye reaches it. Capped at six steps: past that the delay stops reading
 * as rhythm and starts reading as lag.
 * ------------------------------------------------------------------------ */

.wb-panel .wb-wish {
  opacity: 0;
}

.wb-panel.is-revealed .wb-wish {
  animation: wbWishIn 420ms var(--wb-ease) both;
  animation-delay: calc(min(var(--wish-index, 0), 6) * 70ms);
}

@keyframes wbWishIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* ---------------------------------------------------------------------------
 * Larger phones and tablets
 * ------------------------------------------------------------------------ */

@media (min-width: 640px) {
  .wb-title {
    font-size: calc(1.875rem * var(--wb-s));
  }

  .wb-orn__rule {
    width: calc(3.5rem * var(--wb-s));
  }

  .wb-panel {
    padding: calc(1.125rem * var(--wb-s)) calc(1.375rem * var(--wb-s));
  }

  .wb-wish__text {
    font-size: calc(1rem * var(--wb-s));
  }

  .wb-wish__text.is-khmer {
    font-size: calc(0.9375rem * var(--wb-s));
  }
}

@media (min-width: 1024px) {
  /* Matches the event info card's shell radius above 1024px, so the sheet
     reads as part of the same card system. */
  .wb-panel {
    border-radius: 1.5rem;
  }
}

/* ---------------------------------------------------------------------------
 * Laptops — the whole section on one number
 *
 * The showcase card is 85vh, so on a short laptop screen every section renders
 * at roughly two-thirds size. These are the two values the rest of the showcase
 * uses (AgendaSection, RSVPSection); at 1536px and above `--wb-s` stays 1.
 * ------------------------------------------------------------------------ */

@media (min-width: 1024px) and (max-width: 1365px) {
  .wb {
    --wb-s: 0.68;
  }
}

@media (min-width: 1366px) and (max-width: 1535px) {
  .wb {
    --wb-s: 0.76;
  }
}

/* ---------------------------------------------------------------------------
 * Accessibility
 * ------------------------------------------------------------------------ */

/* The wishes still fade in — that is what says one arrived — but they no
   longer travel, and they arrive together rather than in sequence. */
@media (prefers-reduced-motion: reduce) {
  .wb-panel.is-revealed .wb-wish {
    animation: wbFadeIn 200ms ease-out both;
    animation-delay: 0ms;
  }

  .wb-trigger:active,
  .wb-submit:active,
  .wb-ghost:active,
  .wb-solid:active,
  .wb-more:active {
    transform: none;
  }

  @keyframes wbFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}

/* Frostier, not blurrier: the sheet keeps the template's colour but stops
   being a window. */
@media (prefers-reduced-transparency: reduce) {
  .wb-panel {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    background: color-mix(in srgb, var(--wb-tone) 12%, #ffffff);
  }
}

@media (prefers-contrast: more) {
  .wb-panel {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--wb-tone) 55%, transparent);
  }

  .wb-sign__name,
  .wb-sign__time,
  .wb-note,
  .wb-empty__text {
    color: var(--wb-ink);
  }
}
</style>

<style>
/* ---------------------------------------------------------------------------
 * The guestbook's own type.
 *
 * Every other section of this card is set in the template's fonts, because it
 * carries the couple's voice. A wish does not. It is the guest's, it arrives in
 * whatever script that guest writes in, and its language has nothing to do with
 * the language picker at the top of the invitation - one Cambodian wedding's
 * list holds Khmer and English wishes side by side. So no per-language switch
 * can be right here: the family has to resolve per *glyph*, not per selection.
 *
 * Karla covers Latin and carries no Khmer, so a Khmer cluster falls through to
 * Kantumruy Pro on its own - inside the same paragraph where a wish is mixed.
 * Both are already loaded (index.html, main.css), and Karla is what the V2
 * showcase already sets its body copy in, so the guestbook reads in the
 * showcase's own text voice rather than in a display face drawn for a name at
 * 40px.
 *
 * What this replaced: secondaryFont || currentFont on roughly thirty
 * elements here. A template whose secondary face is Latin-only (Great Vibes,
 * Cormorant) left every Khmer wish to the operating system - Khmer UI on
 * Windows, Noto Sans Khmer on Android, Khmer Sangam MN on iOS. One wish, three
 * faces, none of them chosen by anyone. A Khmer display face failed the same
 * way in reverse, and neither is drawn for a 300-character paragraph at 14px.
 *
 * The heading is deliberately NOT included. It is a sibling of the Agenda and
 * RSVP headings and keeps primaryFont through its own inline style, which
 * outranks this rule - making it the one section heading in a different face
 * would trade this inconsistency for a worse one.
 *
 * Unscoped for the same reason the menu rules below are: the options menu is
 * teleported to <body>, and the guest's own name renders inside it.
 * ------------------------------------------------------------------------- */
#comment-section,
#comment-section :is(input, textarea, button, select),
.comment-dropdown-menu,
.comment-dropdown-menu button {
  font-family: 'Karla', 'Kantumruy Pro', system-ui, sans-serif;
}

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
