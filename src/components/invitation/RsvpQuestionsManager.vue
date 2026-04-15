<template>
  <div>
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <MessageSquareText class="w-4 h-4 text-slate-500" />
          {{ t('management.guestGroupsView.rsvpQuestions.header') }}
        </h3>
        <p class="mt-1 text-xs text-slate-500">
          {{ t('management.guestGroupsView.rsvpQuestions.subtitle') }}
        </p>
      </div>
      <button
        type="button"
        class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0"
        @click="openAddModal"
      >
        <Plus class="w-3.5 h-3.5" />
        {{ t('management.guestGroupsView.rsvpQuestions.addButton') }}
      </button>
    </div>

    <!-- Body -->
    <div class="mt-4">
      <!-- Loading -->
      <div v-if="loading && questions.length === 0" class="flex items-center justify-center py-8">
        <div class="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>

      <!-- Empty -->
      <div
        v-else-if="questions.length === 0"
        class="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/40 px-4 py-6 text-center"
      >
        <MessageSquareText class="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p class="text-sm font-medium text-slate-600">
          {{ t('management.guestGroupsView.rsvpQuestions.empty.title') }}
        </p>
        <p class="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
          {{ t('management.guestGroupsView.rsvpQuestions.empty.description') }}
        </p>
      </div>

      <!-- List -->
      <ul v-else class="space-y-2">
        <li
          v-for="(q, idx) in orderedQuestions"
          :key="q.id"
          class="rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
        >
          <div class="flex items-start gap-3 p-3">
            <!-- Order badge -->
            <div
              class="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold flex items-center justify-center tabular-nums"
            >
              {{ idx + 1 }}
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-medium text-slate-900 break-words">
                  {{ localizeQuestionText(q) }}
                </p>
                <span
                  class="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-slate-600 bg-slate-100"
                >
                  {{ getTypeLabel(q.question_type) }}
                </span>
                <span
                  v-if="q.is_required"
                  class="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-rose-700 bg-rose-50"
                >
                  {{ t('management.guestGroupsView.rsvpQuestions.requiredBadge') }}
                </span>
              </div>
              <p
                v-if="q.choices && q.choices.length > 0"
                class="mt-1 text-xs text-slate-500 break-words"
              >
                {{ localizeChoices(q).join(', ') }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex-shrink-0 flex items-center gap-0.5">
              <button
                type="button"
                class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="idx === 0 || isReordering"
                :title="t('management.guestGroupsView.rsvpQuestions.actions.moveUp')"
                :aria-label="t('management.guestGroupsView.rsvpQuestions.actions.moveUp')"
                @click="moveQuestion(idx, -1)"
              >
                <ArrowUp class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="idx === orderedQuestions.length - 1 || isReordering"
                :title="t('management.guestGroupsView.rsvpQuestions.actions.moveDown')"
                :aria-label="t('management.guestGroupsView.rsvpQuestions.actions.moveDown')"
                @click="moveQuestion(idx, 1)"
              >
                <ArrowDown class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                :title="t('management.guestGroupsView.rsvpQuestions.actions.edit')"
                :aria-label="t('management.guestGroupsView.rsvpQuestions.actions.edit')"
                @click="openEditModal(q)"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                :title="t('management.guestGroupsView.rsvpQuestions.actions.delete')"
                :aria-label="t('management.guestGroupsView.rsvpQuestions.actions.delete')"
                @click="confirmDelete(q)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Add / edit modal -->
    <RsvpQuestionModal
      ref="modalRef"
      :show="showModal"
      :question="editTarget"
      :is-saving="isSaving"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Delete confirm -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :title="t('management.guestGroupsView.rsvpQuestions.deleteConfirm.title')"
      :item-name="deleteTarget ? localizeQuestionText(deleteTarget) : ''"
      :loading="isDeleting"
      @confirm="confirmDeleteQuestion"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  MessageSquareText,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
} from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import DeleteConfirmModal from '../DeleteConfirmModal.vue'
import RsvpQuestionModal from './RsvpQuestionModal.vue'
import { rsvpQuestionsService } from '../../services/api'
import type {
  CreateRsvpQuestionRequest,
  EventRsvpQuestion,
  EventRsvpQuestionType,
} from '../../services/api'

const { t, locale } = useAppLanguage()

/**
 * Return the question label in the current locale, falling back to the
 * base `question_text` when no translation exists for the current locale.
 */
const localizeQuestionText = (q: EventRsvpQuestion): string => {
  if (locale.value === 'en') return q.question_text
  const match = q.translations?.find((tr) => tr.language === locale.value)
  return match?.question_text?.trim() || q.question_text
}

/**
 * Return the localised preview line of choices for a question. The
 * translated `choices` array is index-paired with the base `choices`, so
 * each slot falls back individually if its translation is blank.
 */
const localizeChoices = (q: EventRsvpQuestion): string[] => {
  if (!q.choices || q.choices.length === 0) return []
  if (locale.value === 'en') return q.choices
  const match = q.translations?.find((tr) => tr.language === locale.value)
  if (!match?.choices) return q.choices
  return q.choices.map(
    (base, idx) => match.choices?.[idx]?.trim() || base,
  )
}

interface Props {
  eventId: string
  questions: EventRsvpQuestion[]
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  refresh: []
  /** Bubble a lightweight notice to the parent's message toast system. */
  message: [type: 'success' | 'error', text: string]
}>()

// ---- State ---------------------------------------------------------------
const showModal = ref(false)
const editTarget = ref<EventRsvpQuestion | null>(null)
const isSaving = ref(false)
const modalRef = ref<InstanceType<typeof RsvpQuestionModal> | null>(null)

const showDeleteModal = ref(false)
const deleteTarget = ref<EventRsvpQuestion | null>(null)
const isDeleting = ref(false)

const isReordering = ref(false)

// ---- Computed ------------------------------------------------------------
const orderedQuestions = computed(() =>
  [...props.questions].sort((a, b) => a.order - b.order),
)

const typeLabels: Record<EventRsvpQuestionType, string> = {
  text: 'text',
  long_text: 'long_text',
  yes_no: 'yes_no',
  single_choice: 'single_choice',
  multi_choice: 'multi_choice',
}

const getTypeLabel = (type: EventRsvpQuestionType) =>
  t(`management.guestGroupsView.rsvpQuestions.types.${typeLabels[type]}`)

// ---- Add / edit ----------------------------------------------------------
const openAddModal = () => {
  editTarget.value = null
  showModal.value = true
}

const openEditModal = (q: EventRsvpQuestion) => {
  editTarget.value = q
  showModal.value = true
}

const closeModal = () => {
  if (isSaving.value) return
  showModal.value = false
  editTarget.value = null
}

const handleSave = async (payload: CreateRsvpQuestionRequest) => {
  isSaving.value = true
  try {
    if (editTarget.value) {
      const response = await rsvpQuestionsService.updateQuestion(
        props.eventId,
        editTarget.value.id,
        payload,
      )
      if (response.success) {
        showModal.value = false
        editTarget.value = null
        emit('refresh')
      } else {
        const msg =
          response.message ||
          t('management.guestGroupsView.rsvpQuestions.modal.errorGeneric')
        modalRef.value?.setErrorMessage(msg)
        emit('message', 'error', msg)
      }
    } else {
      // Append at the end by default.
      const nextOrder =
        orderedQuestions.value.length > 0
          ? orderedQuestions.value[orderedQuestions.value.length - 1].order + 1
          : 0
      const response = await rsvpQuestionsService.createQuestion(props.eventId, {
        ...payload,
        order: nextOrder,
      })
      if (response.success) {
        showModal.value = false
        editTarget.value = null
        emit('refresh')
      } else {
        const msg =
          response.message ||
          t('management.guestGroupsView.rsvpQuestions.modal.errorGeneric')
        modalRef.value?.setErrorMessage(msg)
        emit('message', 'error', msg)
      }
    }
  } catch {
    const msg = t('management.guestGroupsView.rsvpQuestions.modal.errorGeneric')
    modalRef.value?.setErrorMessage(msg)
    emit('message', 'error', msg)
  } finally {
    isSaving.value = false
  }
}

// ---- Reorder -------------------------------------------------------------
const moveQuestion = async (index: number, delta: -1 | 1) => {
  const next = index + delta
  if (next < 0 || next >= orderedQuestions.value.length) return

  const reordered = [...orderedQuestions.value]
  const [moved] = reordered.splice(index, 1)
  reordered.splice(next, 0, moved)

  const updates = reordered.map((q, i) => ({ id: q.id, order: i }))

  isReordering.value = true
  try {
    const response = await rsvpQuestionsService.bulkReorderQuestions(props.eventId, {
      updates,
    })
    if (response.success) {
      emit('refresh')
    } else {
      const msg =
        response.message ||
        t('management.guestGroupsView.rsvpQuestions.modal.errorGeneric')
      emit('message', 'error', msg)
    }
  } catch {
    emit(
      'message',
      'error',
      t('management.guestGroupsView.rsvpQuestions.modal.errorGeneric'),
    )
  } finally {
    isReordering.value = false
  }
}

// ---- Delete --------------------------------------------------------------
const confirmDelete = (q: EventRsvpQuestion) => {
  deleteTarget.value = q
  showDeleteModal.value = true
}

const cancelDelete = () => {
  if (isDeleting.value) return
  showDeleteModal.value = false
  deleteTarget.value = null
}

const confirmDeleteQuestion = async () => {
  if (!deleteTarget.value) return
  isDeleting.value = true
  try {
    const response = await rsvpQuestionsService.deleteQuestion(
      props.eventId,
      deleteTarget.value.id,
    )
    if (response.success) {
      showDeleteModal.value = false
      deleteTarget.value = null
      emit('refresh')
    } else {
      emit(
        'message',
        'error',
        response.message ||
          t('management.guestGroupsView.rsvpQuestions.modal.errorGeneric'),
      )
    }
  } catch {
    emit(
      'message',
      'error',
      t('management.guestGroupsView.rsvpQuestions.modal.errorGeneric'),
    )
  } finally {
    isDeleting.value = false
  }
}
</script>
