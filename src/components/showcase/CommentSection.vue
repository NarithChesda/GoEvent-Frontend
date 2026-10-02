<template>
  <!--
    The guestbook.

    Not a comment thread: a book of blessings. Each wish is a small card in the
    template's own colours, framed by a hairline with a diamond set into its top
    edge, the message centred, and the guest's name signed beneath it in the
    template's heading face, the way a wish card is signed at a ceremony. There
    is no avatar and no "2 hours ago": what a blessing says and who gave it are
    the two facts it has, and a feed's chrome around them made the section read
    as an app inside an invitation.

    The card's colours come from the template's own base (wishSurface.ts): a
    pale tint of its secondary on a white or cream template, its base colour
    deepened on a green, maroon or navy one. A white card on a solid dark
    template was the look this replaced, and it fitted none of them.
  -->
  <div id="comment-section" class="wb" :class="`wb--${card.tone}`" :style="wbVars">
    <!-- ══ Heading ══════════════════════════════════════════════════════
         A sibling of the Agenda and RSVP headings: same size ladder, same
         ornament, and it keeps the template's primary face through its own
         inline style (see the guestbook type rule in the unscoped block).
         Under the scroll story (scroll-story.css) it comes into focus as it
         rises and its ornament opens, the way every chapter title does. -->
    <header class="wb-head story-title">
      <h2
        class="wb-title"
        :class="[{ 'khmer-text-fix': currentLanguage === 'kh' }, fx('primary')]"
        :style="{ fontFamily: primaryFont || currentFont }"
      >
        <span class="tfx-ink">{{ commentHeaderText }}</span>
      </h2>
      <span class="wb-orn" aria-hidden="true">
        <span class="wb-orn__rule story-rule story-rule--lead"></span>
        <span class="wb-orn__gem story-gem"></span>
        <span class="wb-orn__rule story-rule story-rule--trail"></span>
      </span>
    </header>

    <div ref="panelRef" class="wb-book" :class="{ 'is-revealed': isRevealed }">
      <!-- ── Where a guest writes ───────────────────────────────────────
           A blank card above the blessings, its frame dashed where the
           written ones are drawn. Signed out, the same card is the way to sign
           in: the guest taps the thing they wanted to do and is asked who they
           are, rather than meeting a sign-in button before any blessing. -->

      <!-- Private event opened without an invitation link: a card that
           cannot be written on, so it is not a button. -->
      <div v-if="showInviteOnlyPrompt" class="wb-blank is-static">
        <Lock class="wb-blank__icon" aria-hidden="true" />
        <span class="wb-blank__sub">{{ commentInviteOnlyPromptText }}</span>
      </div>

      <!-- Already signed. One quiet line: their blessing is first below,
           marked as theirs. -->
      <p v-else-if="hasAlreadyCommented" class="wb-done">
        <Check class="wb-done__tick" aria-hidden="true" />
        <span>{{ commentAlreadyCommentedText }}</span>
      </p>

      <button
        v-else-if="showBlankNote"
        type="button"
        class="wb-blank"
        @click="handleBlankNoteClick"
      >
        <span class="wb-blank__label">
          <PenLine class="wb-blank__icon" aria-hidden="true" />
          <span class="wb-blank__text">{{ commentComposeCtaText }}</span>
        </span>
        <span v-if="blankNoteSubline" class="wb-blank__sub">{{ blankNoteSubline }}</span>
      </button>

      <!-- The card being written. Set in the size and leading a blessing is
           shown in, so a guest writes into the shape they are about to
           appear in. -->
      <form
        v-else-if="canShowCommentForm"
        class="wb-card wb-compose"
        @submit.prevent="submitComment"
      >
        <span class="wb-card__gem" aria-hidden="true"></span>
        <p v-if="authorName" class="wb-compose__as">
          {{ commentCommentingAsText }} <strong>{{ authorName }}</strong>
        </p>

        <textarea
          ref="composerTextareaRef"
          v-model="newComment.message"
          class="wb-field"
          :class="{
            'is-khmer': isKhmer(newComment.message),
            'is-invalid': !commentValidation.isValid,
          }"
          :placeholder="commentPlaceholderText"
          :aria-label="commentPlaceholderText"
          rows="3"
          maxlength="500"
          required
          @input="handleCommentInput"
          @blur="validateCommentOnBlur"
        />

        <!-- The count appears only once it is close enough to matter. -->
        <p
          v-if="!commentValidation.isValid && commentValidation.errors.length > 0"
          class="wb-hint is-error"
          role="alert"
        >
          {{ commentValidation.errors[0] }}
        </p>
        <p v-else-if="newComment.message.length >= 400" class="wb-hint">
          {{ newComment.message.length }}/500
        </p>

        <div class="wb-actions">
          <button
            v-if="comments.length > 0"
            type="button"
            class="wb-btn wb-btn--ghost"
            @click="closeComposer"
          >
            {{ commentCancelText }}
          </button>
          <button
            type="submit"
            class="wb-btn wb-btn--solid wb-btn--grow"
            :disabled="
              isSubmittingComment || !newComment.message.trim() || !commentValidation.isValid
            "
          >
            <span v-if="isSubmittingComment" class="wb-spinner" aria-hidden="true"></span>
            {{ isSubmittingComment ? commentPostingButtonText : commentPostButtonText }}
          </button>
        </div>
      </form>

      <!-- ── The blessings ──────────────────────────────────────────────
           Flows with the page rather than scrolling inside itself: a fixed
           overflow box would be a third nested scroller on a phone. Length is
           handled where it comes from, the number of blessings. -->
      <div v-if="loadingComments" class="wb-quiet">
        <span class="wb-spinner" aria-hidden="true"></span>
        <span>{{ commentLoadingText }}</span>
      </div>

      <p v-else-if="comments.length === 0" class="wb-empty">{{ commentNoCommentsText }}</p>

      <div v-else class="wb-list">
        <article
          v-for="(wish, index) in visibleWishes"
          :key="wish.comment.id"
          class="wb-card wb-wish"
          :class="{ 'is-mine': wish.mine }"
          :style="{ '--wish-index': index }"
        >
          <span class="wb-card__gem" aria-hidden="true"></span>

          <!-- The guest's own card: "You" in one top corner, its two actions
               behind the button in the other, both inside the frame. -->
          <span v-if="wish.mine" class="wb-you">{{ commentYouBadgeText }}</span>
          <button
            v-if="wish.mine && editingCommentId !== wish.comment.id"
            type="button"
            class="wb-wish__more"
            :aria-label="commentOptionsText"
            :aria-expanded="actionsOpenId === wish.comment.id"
            :aria-controls="`wb-actions-${wish.comment.id}`"
            @click="toggleActions(wish.comment.id)"
          >
            <MoreHorizontal class="wb-wish__more-icon" aria-hidden="true" />
          </button>

          <!-- Line breaks the guest typed are kept: a blessing is often
               written in short lines. Kept on one line here, because a
               newline inside the tag would print under pre-line. -->
          <p
            v-if="editingCommentId !== wish.comment.id"
            class="wb-wish__text"
            :class="{ 'is-khmer': isKhmer(wish.comment.comment_text) }"
          >{{ capitalizeFirstLetter(wish.comment.comment_text) }}</p>

          <div v-else class="wb-edit">
            <textarea
              v-model="editCommentText"
              class="wb-field"
              :class="{ 'is-khmer': isKhmer(editCommentText) }"
              :aria-label="commentEditText"
              rows="3"
              maxlength="500"
              :placeholder="commentPlaceholderText"
            />
            <div class="wb-edit__foot">
              <span class="wb-edit__count">{{ editCommentText.length }}/500</span>
              <span class="wb-actions">
                <button
                  type="button"
                  class="wb-btn wb-btn--ghost wb-btn--sm"
                  :disabled="isUpdatingComment"
                  @click="cancelEditComment"
                >
                  {{ commentCancelText }}
                </button>
                <button
                  type="button"
                  class="wb-btn wb-btn--solid wb-btn--sm"
                  :disabled="
                    isUpdatingComment ||
                    !editCommentText.trim() ||
                    editCommentText === wish.comment.comment_text
                  "
                  @click="updateComment(wish.comment.id)"
                >
                  {{ isUpdatingComment ? commentSavingText : commentSaveText }}
                </button>
              </span>
            </div>
          </div>

          <!-- The signature: the guest's name between two short rules, in
               the template's heading face, as a wish card is signed. -->
          <footer class="wb-sign">
            <span class="wb-sign__rule" aria-hidden="true"></span>
            <span class="wb-sign__name" :class="fx('primary')">
              <span class="tfx-ink">{{ wish.name }}</span>
            </span>
            <span class="wb-sign__rule" aria-hidden="true"></span>
          </footer>

          <!-- The guest's own two actions, opened in place on their card. -->
          <div
            v-if="actionsOpenId === wish.comment.id && editingCommentId !== wish.comment.id"
            :id="`wb-actions-${wish.comment.id}`"
            class="wb-wish__actions"
          >
            <button
              type="button"
              class="wb-btn wb-btn--ghost wb-btn--sm"
              @click="startEditComment(wish.comment)"
            >
              <Pencil class="wb-btn__icon" aria-hidden="true" />
              {{ commentEditText }}
            </button>
            <button
              type="button"
              class="wb-btn wb-btn--ghost wb-btn--sm wb-btn--danger"
              :disabled="isDeletingComment === wish.comment.id"
              @click="requestDelete(wish)"
            >
              <Trash2 class="wb-btn__icon" aria-hidden="true" />
              {{ commentDeleteText }}
            </button>
          </div>
        </article>

        <!-- An explicit ask is cheaper than infinite scroll (nothing loads
             until a guest wants it) and honest about how many blessings there
             are, which on a wedding is a number the couple wants seen. -->
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

      <p v-if="errorMessage" class="wb-error" role="alert">
        <AlertCircle class="wb-error__icon" aria-hidden="true" />
        <span>{{ errorMessage }}</span>
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
import { useTextEffect } from '@/composables/showcase/useTextEffects'
import { ref, computed, onMounted, nextTick, onUnmounted, watch } from 'vue'
import { AlertCircle, Check, Lock, MoreHorizontal, PenLine, Pencil, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { commentsService, type EventComment } from '../../services/api'
import DeleteConfirmModal from '../DeleteConfirmModal.vue'
import AuthModal from '../AuthModal.vue'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'
import { createShowcaseRevealObserver } from '../../composables/showcase/useScrollProgress'
import { useAuthModal } from '../../composables/useAuthModal'
import { wishSurface } from './wishSurface'
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
  /**
   * The template's declared base colour (its `template` colour, else its
   * `blur-effect` colour). The blessing cards are drawn in it when it is dark,
   * see wishSurface.ts.
   */
  groundColor?: string | null
  /** Heading only. The wishes below set their own type - see the guestbook rule in the unscoped style block. */
  currentFont?: string
  primaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  eventType?: string
}

const props = defineProps<Props>()

// Metallic lettering for the section heading, if the template struck its
// primary slot in one (see useTextEffects.ts).
const fx = useTextEffect()

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
    comment_options: 'comment_options',
    comment_edit: 'comment_edit',
    comment_delete: 'comment_delete',
    comment_cancel: 'comment_cancel',
    comment_save: 'comment_save',
    comment_saving: 'comment_saving',
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
// The blank note's label. Short enough to sit in one row beside its mark at
// 390px, in both languages.
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
const commentOptionsText = computed(() => getTextContent('comment_options', 'Options'))
const commentEditText = computed(() => getTextContent('comment_edit', 'Edit'))
const commentDeleteText = computed(() => getTextContent('comment_delete', 'Delete'))
const commentCancelText = computed(() => getTextContent('comment_cancel', 'Cancel'))
const commentSaveText = computed(() => getTextContent('comment_save', 'Save'))
const commentSavingText = computed(() => getTextContent('comment_saving', 'Saving…'))

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

// How many wishes are on the page. Three is what fits under the blank note on a
// 390px phone without the section running past a screen, which is the length
// at which a guest still reads them rather than scrolls them.
const WISHES_PER_REVEAL = 3
const visibleWishCount = ref(WISHES_PER_REVEAL)
const composerOpenedByGuest = ref(false)
// Set when a signed-out guest taps the blank note: once they have signed in,
// the note they asked for opens instead of making them tap it twice.
const composeAfterSignIn = ref(false)
const hasMoreComments = ref(true)
const errorMessage = ref('')
const hasAlreadyCommented = ref(false)

// Edit/Delete state
const editingCommentId = ref<number | null>(null)
const editCommentText = ref('')
const actionsOpenId = ref<number | null>(null)
const isUpdatingComment = ref(false)
const isDeletingComment = ref<number | null>(null)

// Delete modal state
const showDeleteModal = ref(false)
const commentToDelete = ref<number | null>(null)
const commentToDeleteName = ref<string>('')

// Auth modal using composable
const {
  showAuthModal,
  openAuthModal,
  onAuthModalClose,
  onUserAuthenticated: handleUserAuthenticated,
} = useAuthModal({
  onAuthenticated: () => {
    if (composeAfterSignIn.value) {
      composeAfterSignIn.value = false
      composerOpenedByGuest.value = true
    }
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
 * The cards' colours, fitted to the template (wishSurface.ts): a pale tint of
 * the secondary on a light-based template, the template's own base deepened on
 * a dark one, and the primary as the text on both, moved only as far as it
 * needs to read.
 *
 * Only what sits on the invitation's own ground (the heading, the quiet lines)
 * uses the template's primary as is.
 */
const card = computed(() =>
  wishSurface({
    ink: props.primaryColor,
    ground: props.groundColor,
    tint: props.secondaryColor,
  }),
)

/**
 * The signature's face: the template's heading face, with Kantumruy Pro
 * slotted in straight after it. Guests sign in Khmer as often as in English,
 * and a Latin-only face would otherwise hand a Khmer name to whatever font the
 * phone has, which is a different face on every platform.
 */
const signatureFont = computed(() => {
  const [face, ...fallbacks] = (props.primaryFont || props.currentFont || '').split(',')
  return [face, "'Kantumruy Pro'", ...fallbacks, 'sans-serif']
    .map((family) => family.trim())
    .filter(Boolean)
    .join(', ')
})

/**
 * Every colour the section draws with, published once on the root rather than
 * bound inline on every node.
 */
const wbVars = computed<Record<string, string>>(() => ({
  '--wb-ink': props.primaryColor,
  '--wb-tone': backgroundColor.value,
  '--wb-surface': card.value.surface,
  '--wb-card-ink': card.value.ink,
  '--wb-card-muted': card.value.muted,
  '--wb-frame': card.value.frame,
  '--wb-signature-font': signatureFont.value,
  // Error red that reads on the card: the usual red is 3:1 on a deep one.
  '--wb-danger': card.value.tone === 'deep' ? '#fda29b' : '#b42318',
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

// The name a new wish will be signed with, said before the guest writes it.
const authorName = computed(() => {
  if (commentAuthMode.value === 'guest') return props.guestName || ''
  if (commentAuthMode.value === 'user' && authStore.user) {
    return (
      buildFullName(authStore.user.first_name, authStore.user.last_name) ||
      authStore.user.username ||
      ''
    )
  }
  return ''
})

// The wishes actually on the page, each with what its note needs resolved once
// rather than per binding.
const visibleWishes = computed(() =>
  comments.value.slice(0, visibleWishCount.value).map((comment) => ({
    comment,
    name: getCommentDisplayName(comment),
    mine: isUserCommentOwner(comment),
  })),
)
type Wish = (typeof visibleWishes.value)[number]

// Whether there are more to ask for - either still in the buffer, or on a page
// the API has not been asked for yet.
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

// The draft is kept: a guest who closes the note by mistake gets it back.
const closeComposer = () => {
  composerOpenedByGuest.value = false
  commentValidation.value = { isValid: true, sanitized: '', errors: [] }
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

// The blank note: the way in, whether or not the guest is signed in yet.
const showBlankNote = computed(() => showLoginPrompt.value || composerCollapsed.value)
const blankNoteSubline = computed(() => {
  if (showLoginPrompt.value) return commentSigninPromptText.value
  return authorName.value ? `${commentCommentingAsText.value} ${authorName.value}` : ''
})

// Methods
const handleBlankNoteClick = () => {
  if (showLoginPrompt.value) {
    composeAfterSignIn.value = true
    openAuthModal()
    return
  }
  openComposer()
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

const toggleActions = (commentId: number) => {
  actionsOpenId.value = actionsOpenId.value === commentId ? null : commentId
}

const startEditComment = (comment: EventComment) => {
  actionsOpenId.value = null
  editingCommentId.value = comment.id
  editCommentText.value = comment.comment_text
  errorMessage.value = ''
}

const requestDelete = (wish: Wish) => {
  actionsOpenId.value = null
  openDeleteModal(wish.comment.id, wish.name || 'this comment')
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
      actionsOpenId.value = null
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
 * The wishes settle in sequence when the book comes into view.
 *
 * One observer on the book, not one per wish: the stagger is a CSS delay keyed
 * off each note's own `--wish-index`, so the only thing JavaScript has to decide
 * is *when the page has been reached*.
 *
 * `createShowcaseRevealObserver()` is the showcase's shared observer; its root
 * is the liquid-glass card's own scroller, which is where all scrolling
 * actually happens, and under the scroll story it reports at the reading line.
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

  revealObserver = createShowcaseRevealObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      isRevealed.value = true
      revealObserver?.disconnect()
      revealObserver = null
    }
  })

  revealObserver.observe(panelRef.value)
}

// Lifecycle
onMounted(async () => {
  setupRevealObserver()

  await loadComments()
  // Check if user should be redirected to comment section (after login)
  checkForCommentRedirect()
})

onUnmounted(() => {
  revealObserver?.disconnect()
  revealObserver = null
})
</script>

<style scoped>
/* Hallmark · component: guestbook (blessing cards) · genre: editorial
 * theme: template-driven — colours fitted to the template's base (wishSurface.ts), not a catalog theme
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: card text is the primary moved only as far as 4.5:1 needs (wishSurface.ts)
 */

/* ===========================================================================
 * The guestbook
 *
 * Two grounds, and every colour belongs to one of them:
 *
 *   - the invitation's own ground, under the heading and the quiet lines.
 *     That is where the template's primary was designed to sit, so it is used
 *     as is (`--wb-ink`, `--wb-tone`).
 *   - the card, under every blessing: `--wb-surface`, with `--wb-card-ink`,
 *     `--wb-card-muted` and `--wb-frame` chosen against it in wishSurface.ts.
 *
 * Sizing is mobile-first and scaled by ONE number, `--wb-s`, which the two
 * laptop media queries set and nothing else does.
 * ======================================================================== */

.wb {
  --wb-s: 1;
  --wb-ease: cubic-bezier(0.23, 1, 0.32, 1);
  --wb-hair: color-mix(in srgb, var(--wb-tone) 24%, transparent);
  --wb-card-radius: 0.5rem;
  /* Where the inner frame sits inside the card's edge. */
  --wb-frame-inset: 0.375rem;
  --wb-card-shadow:
    0 1px 2px rgb(0 0 0 / 0.06),
    0 14px 30px -20px rgb(0 0 0 / 0.4);

  color: var(--wb-ink);
  margin-bottom: calc(2rem * var(--wb-s));
}

/* A deep card is the template's own base a step darker: it needs more shadow
   to leave the page at all, and a faint light edge to read as a surface. */
.wb--deep {
  --wb-card-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.06),
    0 1px 2px rgb(0 0 0 / 0.25),
    0 16px 34px -18px rgb(0 0 0 / 0.65);
}

/* ---------------------------------------------------------------------------
 * Heading
 * ------------------------------------------------------------------------ */

.wb-head {
  text-align: center;
  margin-bottom: calc(1.25rem * var(--wb-s));
}

.wb-title {
  font-size: calc(1.5rem * var(--wb-s));
  line-height: 1.25;
  font-weight: 400;
  text-transform: capitalize;
  padding-block: calc(0.25rem * var(--wb-s));
  color: var(--wb-ink);
}

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
 * The book: the blank card, then the blessings, one column
 * ------------------------------------------------------------------------ */

.wb-book,
.wb-list {
  display: flex;
  flex-direction: column;
  gap: calc(0.875rem * var(--wb-s));
}

/* A blessing card: the fitted surface, a hairline frame inset from its edge,
   and a diamond set into the frame's top edge. The frame and the diamond are
   the whole of the ornament; everything inside is the guest's. */
.wb-card {
  position: relative;
  min-width: 0;
  border-radius: var(--wb-card-radius);
  padding: calc(1.625rem * var(--wb-s)) calc(1.375rem * var(--wb-s)) calc(1.375rem * var(--wb-s));
  background: var(--wb-surface);
  color: var(--wb-card-ink);
  box-shadow: var(--wb-card-shadow);
  text-align: center;
}

.wb-card::before {
  content: '';
  position: absolute;
  inset: var(--wb-frame-inset);
  border: 1px solid var(--wb-frame);
  border-radius: calc(var(--wb-card-radius) - 0.1875rem);
  pointer-events: none;
}

/* The diamond on the frame's top edge. The ring in the card's own colour is
   what cuts the frame line either side of it. */
.wb-card__gem {
  position: absolute;
  top: var(--wb-frame-inset);
  left: 50%;
  width: calc(0.4375rem * var(--wb-s));
  height: calc(0.4375rem * var(--wb-s));
  background: var(--wb-frame);
  box-shadow: 0 0 0 calc(0.25rem * var(--wb-s)) var(--wb-surface);
  transform: translate(-50%, -50%) rotate(45deg);
  pointer-events: none;
}

/* ---------------------------------------------------------------------------
 * The blank card
 *
 * The same surface lying flat, its frame dashed rather than drawn: a card
 * that has not been written yet. The written ones never carry the dash.
 * ------------------------------------------------------------------------ */

.wb-blank {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  width: 100%;
  min-width: 0;
  min-height: calc(4rem * var(--wb-s));
  padding: calc(0.875rem * var(--wb-s)) calc(1.25rem * var(--wb-s));
  border: 0;
  border-radius: var(--wb-card-radius);
  background: var(--wb-surface);
  color: var(--wb-card-ink);
  text-align: center;
  cursor: pointer;
  transition: transform 160ms var(--wb-ease);
}

.wb-blank::before {
  content: '';
  position: absolute;
  inset: var(--wb-frame-inset);
  border: 1px dashed var(--wb-frame);
  border-radius: calc(var(--wb-card-radius) - 0.1875rem);
  pointer-events: none;
  transition: border-color 160ms ease;
}

.wb-blank.is-static {
  flex-direction: row;
  gap: 0.625rem;
  cursor: default;
}

.wb-blank:not(.is-static):active {
  transform: scale(0.985);
}

.wb-blank:focus-visible {
  outline: 2px solid var(--wb-ink);
  outline-offset: 3px;
}

/* One line: a button whose words wrap reads as two controls. */
.wb-blank__label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 100%;
  font-size: calc(0.9375rem * var(--wb-s));
  font-weight: 600;
  line-height: 1.35;
}

.wb-blank__text,
.wb-blank:not(.is-static) .wb-blank__sub {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wb-blank__icon {
  flex: 0 0 auto;
  width: calc(1rem * var(--wb-s));
  height: calc(1rem * var(--wb-s));
}

.wb-blank__sub {
  font-size: calc(0.75rem * var(--wb-s));
  line-height: 1.5;
  color: var(--wb-card-muted);
}

/* The invite-only card is prose, not a label, and may take two lines. */
.wb-blank.is-static .wb-blank__sub {
  font-size: calc(0.8125rem * var(--wb-s));
  line-height: 1.6;
  text-align: left;
}

.wb-blank.is-static .wb-blank__icon {
  color: var(--wb-card-muted);
}

/* ---------------------------------------------------------------------------
 * Already signed
 * ------------------------------------------------------------------------ */

.wb-done {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  font-size: calc(0.8125rem * var(--wb-s));
  line-height: 1.6;
  text-align: center;
  color: color-mix(in srgb, var(--wb-ink) 82%, transparent);
}

.wb-done__tick {
  flex: 0 0 auto;
  width: calc(0.875rem * var(--wb-s));
  height: calc(0.875rem * var(--wb-s));
}

/* ---------------------------------------------------------------------------
 * The card being written
 * ------------------------------------------------------------------------ */

.wb-compose__as {
  margin-bottom: calc(0.625rem * var(--wb-s));
  font-size: calc(0.75rem * var(--wb-s));
  color: var(--wb-card-muted);
  overflow-wrap: anywhere;
}

.wb-compose__as strong {
  font-weight: 600;
  color: var(--wb-card-ink);
}

/* A well pressed into the card rather than a box on it. Left-aligned: a
   guest writes from the start of the line, even into a centred card. */
.wb-field {
  display: block;
  width: 100%;
  border: 0;
  border-radius: 0.375rem;
  padding: calc(0.75rem * var(--wb-s));
  font-size: calc(0.9375rem * var(--wb-s));
  line-height: 1.65;
  text-align: left;
  color: var(--wb-card-ink);
  background: color-mix(in srgb, var(--wb-card-ink) 6%, var(--wb-surface));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--wb-card-ink) 18%, transparent);
  resize: none;
  transition: box-shadow 200ms ease;
}

.wb-field::placeholder {
  color: var(--wb-card-muted);
}

/* Focus is said with light, not movement: a field that moves on focus lands
   in the same frames as the phone keyboard's own slide-up. */
.wb-field:focus {
  outline: none;
  box-shadow:
    inset 0 0 0 1.5px color-mix(in srgb, var(--wb-card-ink) 60%, transparent),
    0 0 0 3px color-mix(in srgb, var(--wb-card-ink) 14%, transparent);
}

.wb-field.is-khmer {
  font-size: calc(0.875rem * var(--wb-s));
  line-height: 2;
}

.wb-field.is-invalid {
  box-shadow: inset 0 0 0 1.5px var(--wb-danger);
}

.wb-hint {
  margin-top: calc(0.375rem * var(--wb-s));
  font-size: calc(0.75rem * var(--wb-s));
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--wb-card-muted);
}

.wb-hint.is-error {
  text-align: left;
  color: var(--wb-danger);
}

.wb-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: calc(0.5rem * var(--wb-s));
}

.wb-compose .wb-actions {
  margin-top: calc(0.75rem * var(--wb-s));
}

/* ---------------------------------------------------------------------------
 * Buttons on a card
 *
 * The solid one is the card's own text colour with the card as its label:
 * whatever the template, the pair already reads at 4.5:1.
 * ------------------------------------------------------------------------ */

.wb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  min-height: calc(2.75rem * var(--wb-s));
  padding: 0 calc(1.125rem * var(--wb-s));
  border: 0;
  border-radius: 999px;
  font-size: calc(0.875rem * var(--wb-s));
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    transform 140ms var(--wb-ease),
    background-color 160ms ease,
    opacity 160ms ease;
}

.wb-btn--grow {
  flex: 1 1 auto;
}

.wb-btn--solid {
  background: var(--wb-card-ink);
  color: var(--wb-surface);
}

.wb-btn--ghost {
  background: transparent;
  color: var(--wb-card-ink);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--wb-card-ink) 30%, transparent);
}

.wb-btn--danger {
  color: var(--wb-danger);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--wb-danger) 45%, transparent);
}

.wb-btn--sm {
  min-height: calc(2.5rem * var(--wb-s));
  padding: 0 calc(0.875rem * var(--wb-s));
  font-size: calc(0.8125rem * var(--wb-s));
}

.wb-btn__icon {
  width: calc(0.875rem * var(--wb-s));
  height: calc(0.875rem * var(--wb-s));
}

.wb-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.wb-btn:focus-visible {
  outline: 2px solid var(--wb-card-ink);
  outline-offset: 2px;
}

.wb-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.wb-btn .wb-spinner {
  border-color: color-mix(in srgb, currentColor 40%, transparent);
  border-top-color: transparent;
}

/* ---------------------------------------------------------------------------
 * A blessing
 * ------------------------------------------------------------------------ */

/* The guest's own card makes room above the message for the corner marks. */
.wb-wish.is-mine {
  padding-top: calc(2.75rem * var(--wb-s));
}

.wb-wish__text {
  font-size: calc(0.9375rem * var(--wb-s));
  line-height: 1.7;
  overflow-wrap: break-word;
  white-space: pre-line;
}

.wb-wish__text.is-khmer {
  font-size: calc(0.875rem * var(--wb-s));
  line-height: 2;
  word-break: keep-all;
  overflow-wrap: anywhere;
  hyphens: none;
  -webkit-hyphens: none;
}

.wb-sign {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  min-width: 0;
  margin-top: calc(0.875rem * var(--wb-s));
}

.wb-sign__rule {
  flex: 0 0 auto;
  width: calc(1.25rem * var(--wb-s));
  height: 1px;
  background: var(--wb-frame);
}

.wb-sign__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--wb-signature-font);
  font-size: calc(0.9375rem * var(--wb-s));
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: 0.01em;
  color: var(--wb-card-ink);
}

.wb-you {
  position: absolute;
  top: calc(0.9375rem * var(--wb-s));
  left: calc(0.9375rem * var(--wb-s));
  padding: 0.125em 0.5em;
  border-radius: 999px;
  background: var(--wb-card-ink);
  color: var(--wb-surface);
  font-size: calc(0.625rem * var(--wb-s));
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.4;
}

/* 40px, tucked into the frame's top-right corner. */
.wb-wish__more {
  position: absolute;
  top: calc(0.5rem * var(--wb-s));
  right: calc(0.5rem * var(--wb-s));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: calc(2.5rem * var(--wb-s));
  height: calc(2.5rem * var(--wb-s));
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: none;
  color: var(--wb-card-muted);
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.wb-wish__more[aria-expanded='true'] {
  background: color-mix(in srgb, var(--wb-card-ink) 10%, transparent);
  color: var(--wb-card-ink);
}

.wb-wish__more:focus-visible {
  outline: 2px solid var(--wb-card-ink);
  outline-offset: -2px;
}

.wb-wish__more-icon {
  width: calc(1.125rem * var(--wb-s));
  height: calc(1.125rem * var(--wb-s));
}

.wb-wish__actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: calc(0.5rem * var(--wb-s));
  margin-top: calc(0.875rem * var(--wb-s));
  animation: wbActionsIn 180ms var(--wb-ease) both;
}

@keyframes wbActionsIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* ---------------------------------------------------------------------------
 * Editing your own blessing
 * ------------------------------------------------------------------------ */

.wb-edit__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: calc(0.625rem * var(--wb-s));
}

.wb-edit__count {
  font-size: calc(0.75rem * var(--wb-s));
  font-variant-numeric: tabular-nums;
  color: var(--wb-card-muted);
}

/* ---------------------------------------------------------------------------
 * On the invitation's ground: loading, empty
 * ------------------------------------------------------------------------ */

.wb-quiet {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding-block: calc(1.25rem * var(--wb-s));
  font-size: calc(0.8125rem * var(--wb-s));
  color: color-mix(in srgb, var(--wb-ink) 75%, transparent);
}

.wb-quiet--sm {
  padding-block: calc(0.5rem * var(--wb-s));
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
  padding-block: calc(0.5rem * var(--wb-s));
  font-size: calc(0.8125rem * var(--wb-s));
  line-height: 1.7;
  text-align: center;
  color: color-mix(in srgb, var(--wb-ink) 78%, transparent);
}

/* ---------------------------------------------------------------------------
 * "Read all"
 *
 * A rule with a label in it rather than a filled button: a way to keep
 * reading, not a second action competing with Post. The label sits on a tab
 * of the card's surface, because it is a control and the template's primary
 * on its own ground can be pink on pink.
 * ------------------------------------------------------------------------ */

.wb-more {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: calc(2.75rem * var(--wb-s));
  padding: 0 0.25rem;
  background: none;
  border: 0;
  cursor: pointer;
  font-size: calc(0.8125rem * var(--wb-s));
  transition: opacity 160ms ease;
}

.wb-more:focus-visible {
  outline: none;
}

.wb-more:focus-visible .wb-more__label {
  outline: 2px solid var(--wb-ink);
  outline-offset: 2px;
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
  padding: calc(0.4375rem * var(--wb-s)) calc(0.875rem * var(--wb-s));
  border-radius: 999px;
  background: var(--wb-surface);
  color: var(--wb-card-ink);
  box-shadow: inset 0 0 0 1px var(--wb-frame);
  white-space: nowrap;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.wb-more:active {
  opacity: 0.6;
}

/* ---------------------------------------------------------------------------
 * Error — on the card's surface too, so it reads on every template
 * ------------------------------------------------------------------------ */

.wb-error {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: calc(0.75rem * var(--wb-s)) calc(0.875rem * var(--wb-s));
  border-radius: var(--wb-card-radius);
  background: var(--wb-surface);
  color: var(--wb-card-ink);
  box-shadow: var(--wb-card-shadow);
  font-size: calc(0.8125rem * var(--wb-s));
  line-height: 1.55;
}

.wb-error__icon {
  flex: 0 0 auto;
  width: calc(1rem * var(--wb-s));
  height: calc(1rem * var(--wb-s));
  margin-top: 0.1em;
  color: var(--wb-danger);
}

/* ---------------------------------------------------------------------------
 * Hover — gated on a real pointer. On a touch screen :hover latches after a
 * tap, so an ungated one leaves a control lit for as long as the guest reads.
 * ------------------------------------------------------------------------ */

@media (hover: hover) and (pointer: fine) {
  .wb-blank:not(.is-static):hover::before {
    border-color: var(--wb-card-ink);
  }

  .wb-btn--solid:hover:not(:disabled) {
    opacity: 0.88;
  }

  .wb-btn--ghost:hover:not(:disabled) {
    background: color-mix(in srgb, var(--wb-card-ink) 8%, transparent);
  }

  .wb-wish__more:hover {
    background: color-mix(in srgb, var(--wb-card-ink) 10%, transparent);
    color: var(--wb-card-ink);
  }

  .wb-more:hover .wb-more__label {
    text-decoration: underline;
    text-underline-offset: 0.25em;
  }
}

/* ---------------------------------------------------------------------------
 * Arrival
 *
 * Cards settle in sequence rather than all at once: a guestbook is read one
 * entry at a time, and 70ms is short enough that the last one is still
 * arriving as the eye reaches it. Capped at six steps: past that the delay
 * stops reading as rhythm and starts reading as lag.
 * ------------------------------------------------------------------------ */

.wb-book .wb-wish {
  opacity: 0;
}

.wb-book.is-revealed .wb-wish {
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

  .wb-card {
    padding-inline: calc(1.75rem * var(--wb-s));
  }

  .wb-wish__text {
    font-size: calc(1rem * var(--wb-s));
  }

  .wb-wish__text.is-khmer {
    font-size: calc(0.9375rem * var(--wb-s));
  }

  .wb-sign__name {
    font-size: calc(1rem * var(--wb-s));
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

/* The cards still fade in — that is what says one arrived — but they no
   longer travel, and they arrive together rather than in sequence. */
@media (prefers-reduced-motion: reduce) {
  .wb-book.is-revealed .wb-wish {
    animation: wbFadeIn 150ms ease-out both;
    animation-delay: 0ms;
  }

  .wb-wish__actions {
    animation: wbFadeIn 150ms ease-out both;
  }

  .wb-blank:active,
  .wb-btn:active,
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

@media (prefers-contrast: more) {
  .wb-card::before,
  .wb-blank::before {
    border-color: var(--wb-card-ink);
  }

  .wb-blank__sub,
  .wb-hint,
  .wb-edit__count,
  .wb-compose__as {
    color: var(--wb-card-ink);
  }

  .wb-done,
  .wb-empty,
  .wb-quiet {
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
 * The heading is deliberately NOT included. It is a sibling of the Agenda and
 * RSVP headings and keeps primaryFont through its own inline style, which
 * outranks this rule - making it the one section heading in a different face
 * would trade this inconsistency for a worse one.
 * ------------------------------------------------------------------------- */
#comment-section,
#comment-section :is(input, textarea, button, select) {
  font-family: 'Karla', 'Kantumruy Pro', system-ui, sans-serif;
}
</style>
