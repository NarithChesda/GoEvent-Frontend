<template>
  <V2ChapterShell
    section-id="comment-section"
    :chapter-number="chapterNumber"
    :title="title"
    :current-language="currentLanguage"
  >
    <div ref="rootEl" class="v2-form-card">
      <!-- Compose -->
      <div v-if="canShowForm">
        <label class="v2-form-label" for="v2-gb-msg">{{ t('your_message') }}</label>
        <textarea
          id="v2-gb-msg"
          v-model="message"
          class="v2-input"
          rows="2"
          maxlength="500"
          :placeholder="t('leave_blessing')"
        ></textarea>
        <p v-if="errorMessage" class="v2-form-error" role="alert">{{ errorMessage }}</p>
        <button
          type="button"
          class="v2-btn v2-btn--ghost w-full"
          :disabled="submitting || !message.trim()"
          @click="submit"
        >
          {{ submitting ? t('posting') : t('post_guestbook') }}
        </button>
      </div>

      <!-- Already posted / gated states -->
      <p v-else-if="hasAlreadyCommented" class="v2-gb-note">{{ t('already_blessed') }}</p>
      <div v-else-if="isPrivateEvent" class="v2-gb-note">{{ t('invite_only_comment') }}</div>
      <div v-else class="text-center py-2">
        <button type="button" class="v2-btn v2-btn--primary" @click="$emit('showAuthModal')">
          {{ t('sign_in_to_comment') }}
        </button>
      </div>

      <!-- Entries -->
      <div class="v2-gb-list">
        <div v-if="loadingComments" class="flex justify-center py-6">
          <span class="v2-spinner" aria-hidden="true"></span>
        </div>

        <p v-else-if="comments.length === 0" class="v2-gb-note">{{ t('be_first') }}</p>

        <TransitionGroup v-else name="v2-gb" tag="div">
          <div v-for="comment in comments" :key="comment.id" class="v2-gb-entry">
            <div class="flex items-baseline">
              <span class="v2-gb-name">{{ authorName(comment) }}</span>
              <span class="v2-gb-time">{{ entryDate(comment) }}</span>
              <!-- Own-comment actions -->
              <span v-if="isOwnComment(comment) && editingId !== comment.id" class="v2-gb-actions">
                <button type="button" class="v2-gb-action" @click="startEdit(comment)">
                  {{ t('edit_action') }}
                </button>
                <button
                  type="button"
                  class="v2-gb-action v2-gb-action--danger"
                  @click="confirmDeleteId = comment.id"
                >
                  {{ t('delete_action') }}
                </button>
              </span>
            </div>

            <!-- Inline edit -->
            <div v-if="editingId === comment.id" class="mt-2">
              <textarea
                v-model="editMessage"
                class="v2-input"
                rows="2"
                maxlength="500"
              ></textarea>
              <div class="flex justify-end gap-2">
                <button type="button" class="v2-gb-action" @click="cancelEdit">
                  {{ t('cancel_action') }}
                </button>
                <button
                  type="button"
                  class="v2-gb-action v2-gb-action--strong"
                  :disabled="savingEdit || !editMessage.trim()"
                  @click="saveEdit(comment)"
                >
                  {{ savingEdit ? t('posting') : t('save_action') }}
                </button>
              </div>
            </div>
            <p v-else class="v2-gb-msg">{{ commentText(comment) }}</p>

            <!-- Inline delete confirm -->
            <div v-if="confirmDeleteId === comment.id" class="v2-gb-confirm">
              <span>{{ t('delete_confirm') }}</span>
              <button type="button" class="v2-gb-action" @click="confirmDeleteId = null">
                {{ t('cancel_action') }}
              </button>
              <button
                type="button"
                class="v2-gb-action v2-gb-action--danger"
                :disabled="deleting"
                @click="removeComment(comment)"
              >
                {{ t('delete_action') }}
              </button>
            </div>
          </div>
        </TransitionGroup>

        <div v-if="hasMore && !loadingComments" class="mt-4 text-center">
          <button
            type="button"
            class="v2-btn v2-btn--ghost"
            :disabled="loadingMore"
            @click="loadMore"
          >
            {{ t('load_more') }}
          </button>
        </div>
      </div>
    </div>
  </V2ChapterShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import V2ChapterShell from './V2ChapterShell.vue'
import {
  translateV2,
  type V2TranslationKey,
  type V2CategoryTranslations,
} from '../../../composables/showcase-v2/v2Translations'
import { formatDateLocalized, type SupportedLanguage } from '../../../utils/translations'
import { commentsService } from '../../../services/api'
import { useAuthStore } from '../../../stores/auth'
import { sanitizeComment } from '../../../utils/sanitize'

// Backend now decorates comments with author/guest info beyond the base type
interface GuestbookComment {
  id: number
  comment_text?: string
  message?: string
  created_at: string
  author_name?: string
  user_info?: { id: number; username?: string; first_name?: string; last_name?: string }
  guest_info?: { name?: string }
}

interface Props {
  chapterNumber: number
  title: string
  eventId: string
  eventPrivacy?: 'public' | 'private'
  guestName?: string
  guestShortcode?: string | null
  currentLanguage?: string
  /** Category-flavored copy overrides (e.g. wedding's "blessing" wording) — see the active variant's `translations`. */
  categoryTranslations?: V2CategoryTranslations
}

const props = defineProps<Props>()

const emit = defineEmits<{
  commentSubmitted: [comment: unknown]
  showAuthModal: []
}>()

const authStore = useAuthStore()
const rootEl = ref<HTMLElement | null>(null)

const t = (key: V2TranslationKey) => translateV2(key, props.currentLanguage, props.categoryTranslations)
const lang = computed(() => (props.currentLanguage as SupportedLanguage) || 'en')

const PAGE_SIZE = 6

const comments = ref<GuestbookComment[]>([])
const loadingComments = ref(false)
const loadingMore = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const message = ref('')
const hasMore = ref(false)
const currentPage = ref(1)
const hasAlreadyCommented = ref(false)

const isPrivateEvent = computed(() => props.eventPrivacy === 'private')
const hasGuestCredential = computed(() => isPrivateEvent.value && !!props.guestShortcode)

// One blessing per author; private events need an invitation credential,
// public events need an account (gate button opens the auth modal)
const canShowForm = computed(() => {
  if (hasAlreadyCommented.value) return false
  if (isPrivateEvent.value) return hasGuestCredential.value
  return authStore.isAuthenticated
})

const authorName = (comment: GuestbookComment): string => {
  if (comment.author_name) return comment.author_name
  if (comment.guest_info?.name) return comment.guest_info.name
  const user = comment.user_info
  if (user) {
    const full = [user.first_name, user.last_name].filter(Boolean).join(' ')
    return full || user.username || 'Guest'
  }
  return 'Guest'
}

const commentText = (comment: GuestbookComment) => comment.comment_text || comment.message || ''

const entryDate = (comment: GuestbookComment) => {
  try {
    return formatDateLocalized(comment.created_at, 'compact', lang.value)
  } catch {
    return ''
  }
}

const isOwnComment = (comment: GuestbookComment): boolean => {
  if (isPrivateEvent.value) {
    return hasGuestCredential.value && !!props.guestName && comment.guest_info?.name === props.guestName
  }
  return authStore.isAuthenticated && !!authStore.user && comment.user_info?.id === authStore.user.id
}

// ---- edit / delete own comment ----
const editingId = ref<number | null>(null)
const editMessage = ref('')
const savingEdit = ref(false)
const confirmDeleteId = ref<number | null>(null)
const deleting = ref(false)

const startEdit = (comment: GuestbookComment) => {
  confirmDeleteId.value = null
  editingId.value = comment.id
  editMessage.value = commentText(comment)
}

const cancelEdit = () => {
  editingId.value = null
  editMessage.value = ''
}

const saveEdit = async (comment: GuestbookComment) => {
  const clean = sanitizeComment(editMessage.value).trim()
  if (!clean || savingEdit.value) return
  savingEdit.value = true
  errorMessage.value = ''
  try {
    const shortcode = isPrivateEvent.value ? props.guestShortcode : null
    const response = await commentsService.updateComment(comment.id, clean, shortcode)
    if (response.success && response.data) {
      const idx = comments.value.findIndex((c) => c.id === comment.id)
      if (idx !== -1) comments.value.splice(idx, 1, response.data as GuestbookComment)
      cancelEdit()
    } else {
      errorMessage.value = response.message || 'Failed to update. Please try again.'
    }
  } catch {
    errorMessage.value = 'An error occurred. Please try again.'
  } finally {
    savingEdit.value = false
  }
}

const removeComment = async (comment: GuestbookComment) => {
  if (deleting.value) return
  deleting.value = true
  errorMessage.value = ''
  try {
    const shortcode = isPrivateEvent.value ? props.guestShortcode : null
    const response = await commentsService.deleteComment(comment.id, shortcode)
    if (response.success) {
      comments.value = comments.value.filter((c) => c.id !== comment.id)
      hasAlreadyCommented.value = false
      confirmDeleteId.value = null
    } else {
      errorMessage.value = response.message || 'Failed to delete. Please try again.'
    }
  } catch {
    errorMessage.value = 'An error occurred. Please try again.'
  } finally {
    deleting.value = false
  }
}

const detectOwnComment = () => {
  if (isPrivateEvent.value) {
    if (hasGuestCredential.value && props.guestName) {
      hasAlreadyCommented.value = comments.value.some(
        (c) => c.guest_info?.name === props.guestName,
      )
    }
  } else if (authStore.isAuthenticated && authStore.user) {
    hasAlreadyCommented.value = comments.value.some(
      (c) => c.user_info?.id === authStore.user!.id,
    )
  }
}

const loadComments = async () => {
  loadingComments.value = true
  try {
    const response = await commentsService.getEventComments(props.eventId, 1, PAGE_SIZE)
    if (response.success && response.data) {
      comments.value = response.data.results as GuestbookComment[]
      hasMore.value = response.data.next !== null
      currentPage.value = 1
      detectOwnComment()
    }
  } catch {
    comments.value = []
    hasMore.value = false
  } finally {
    loadingComments.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value) return
  loadingMore.value = true
  try {
    const response = await commentsService.getEventComments(
      props.eventId,
      currentPage.value + 1,
      PAGE_SIZE,
    )
    if (response.success && response.data) {
      comments.value = [...comments.value, ...(response.data.results as GuestbookComment[])]
      hasMore.value = response.data.next !== null
      currentPage.value++
    }
  } catch {
    hasMore.value = false
  } finally {
    loadingMore.value = false
  }
}

const submit = async () => {
  const clean = sanitizeComment(message.value).trim()
  if (!clean || submitting.value) return

  submitting.value = true
  errorMessage.value = ''
  try {
    const shortcode = isPrivateEvent.value ? props.guestShortcode : null
    const response = await commentsService.createComment(props.eventId, clean, shortcode)
    if (response.success && response.data) {
      // Optimistic prepend — the TransitionGroup staggers the new entry in
      comments.value = [response.data as GuestbookComment, ...comments.value]
      hasAlreadyCommented.value = true
      message.value = ''
      emit('commentSubmitted', response.data)
    } else if (response.message?.includes('unique')) {
      errorMessage.value = t('already_blessed')
      hasAlreadyCommented.value = true
    } else {
      errorMessage.value = response.message || 'Failed to post. Please try again.'
    }
  } catch {
    errorMessage.value = 'An error occurred. Please try again.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadComments)
</script>

<style scoped src="./v2-forms.css"></style>

<style scoped>
.v2-gb-list {
  margin-top: 22px;
}

.v2-gb-entry {
  border-bottom: 1px dashed rgba(168, 181, 160, 0.5);
  padding: 16px 0;
}

.v2-gb-entry:last-child {
  border-bottom: none;
}

.v2-gb-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--v2-charcoal);
}

.v2-gb-time {
  font-size: 11px;
  color: var(--v2-sage-deep);
  margin-left: 8px;
}

.v2-gb-msg {
  font-size: 14px;
  color: var(--v2-ink-soft);
  margin-top: 4px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.v2-gb-note {
  font-family: var(--v2-display);
  font-style: italic;
  font-size: 16px;
  text-align: center;
  color: var(--v2-sage-deep);
  padding: 8px 0;
}

.v2-gb-actions {
  margin-left: auto;
  display: inline-flex;
  gap: 4px;
  flex-shrink: 0;
}

.v2-gb-action {
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--v2-body);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--v2-sage-deep);
  padding: 4px 8px;
  min-height: 32px;
  border-radius: 8px;
  transition: background 0.2s;
}

.v2-gb-action:hover:not(:disabled),
.v2-gb-action:focus-visible {
  background: rgba(168, 181, 160, 0.15);
}

.v2-gb-action--danger {
  color: #b4544f;
}

.v2-gb-action--strong {
  color: var(--v2-charcoal);
  font-weight: 600;
}

.v2-gb-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.v2-gb-confirm {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 8px;
  font-size: 13px;
  color: var(--v2-ink-soft);
}

/* New entries slide in (used on optimistic post) */
.v2-gb-enter-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}

.v2-gb-enter-from {
  opacity: 0;
  transform: translateY(14px);
}

@media (prefers-reduced-motion: reduce) {
  .v2-gb-enter-active {
    transition: none;
  }
}
</style>
