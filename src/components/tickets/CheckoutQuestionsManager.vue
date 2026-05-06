<template>
  <div class="space-y-4">
    <!-- Header / Actions Bar (sticky, matches guest/expense pattern) -->
    <div class="sticky top-0 z-20">
      <div class="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm">
        <div class="flex items-center gap-2 sm:gap-3 p-3">
          <!-- Title with icon -->
          <div class="flex items-center gap-2 min-w-0 flex-shrink">
            <MessageSquareText class="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span class="text-sm font-semibold text-slate-900 truncate">
              {{ t('management.tickets.questions.header') }}
            </span>
          </div>

          <!-- Divider -->
          <div class="w-px h-5 bg-slate-200 hidden sm:block"></div>

          <!-- Question count -->
          <div class="hidden sm:flex items-center gap-1 text-sm text-slate-500 tabular-nums flex-shrink-0">
            <span class="font-medium text-slate-700">{{ orderedQuestions.length }}</span>
          </div>

          <!-- Spacer -->
          <div class="flex-1"></div>

          <!-- Add Question -->
          <button
            v-if="canEdit"
            type="button"
            class="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all duration-200 flex-shrink-0"
            :aria-label="t('management.tickets.questions.addButton')"
            @click="openAddModal"
          >
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline">{{ t('management.tickets.questions.addButton') }}</span>
          </button>
        </div>

        <!-- Subtitle row -->
        <div class="px-3 pb-3 -mt-1">
          <p class="text-xs text-slate-500">
            {{ t('management.tickets.questions.subtitle') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div>
      <!-- Loading -->
      <div v-if="loading && questions.length === 0" class="flex justify-center items-center py-12">
        <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Empty (Editable) -->
      <div
        v-else-if="questions.length === 0 && canEdit"
        class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-8 sm:p-12 hover:bg-slate-100/50 hover:border-emerald-400 transition-all duration-300 cursor-pointer group"
        @click="openAddModal"
      >
        <div class="flex flex-col items-center justify-center text-center">
          <div
            class="w-16 h-16 bg-slate-200 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300"
          >
            <MessageSquareText class="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          <h4 class="font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
            {{ t('management.tickets.questions.empty.title') }}
          </h4>
          <p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm">
            {{ t('management.tickets.questions.empty.description') }}
          </p>
        </div>
      </div>

      <!-- Empty (Read-only) -->
      <div
        v-else-if="questions.length === 0"
        class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-8 sm:p-12 text-center"
      >
        <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageSquareText class="w-8 h-8 text-slate-400" />
        </div>
        <h4 class="font-semibold text-slate-900 mb-1.5 sm:mb-2">
          {{ t('management.tickets.questions.empty.title') }}
        </h4>
        <p class="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          {{ t('management.tickets.questions.empty.description') }}
        </p>
      </div>

      <!-- List -->
      <ul v-else class="space-y-2">
        <li
          v-for="(q, idx) in orderedQuestions"
          :key="q.id"
          class="bg-white/80 border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:bg-white transition-all duration-200"
        >
          <div class="flex items-start gap-3 px-4 py-3">
            <!-- Order badge -->
            <div
              class="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-100 text-slate-600 text-sm font-semibold flex items-center justify-center tabular-nums"
              :aria-label="`Question ${idx + 1}`"
            >
              {{ idx + 1 }}
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <p class="text-sm font-semibold text-slate-900 break-words">
                  {{ q.question_text }}
                </p>
                <span
                  class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium text-slate-600 bg-slate-100"
                >
                  {{ getTypeLabel(q.question_type) }}
                </span>
                <span
                  v-if="q.is_required"
                  class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium text-rose-700 bg-rose-50"
                >
                  {{ t('management.tickets.questions.requiredBadge') }}
                </span>
                <span
                  v-if="!q.is_active"
                  class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium text-slate-600 bg-slate-100"
                >
                  {{ t('management.tickets.questions.inactiveBadge') }}
                </span>
                <span
                  class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium text-sky-700 bg-sky-50"
                >
                  {{ tierScopeLabel(q) }}
                </span>
              </div>
              <p
                v-if="q.choices && q.choices.length > 0"
                class="text-xs text-slate-500 break-words"
              >
                {{ q.choices.join(', ') }}
              </p>
            </div>

            <!-- Actions (Desktop) -->
            <div v-if="canEdit" class="hidden sm:flex items-center gap-0.5 flex-shrink-0">
              <button
                type="button"
                class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="idx === 0 || isReordering"
                :title="t('management.tickets.questions.actions.moveUp')"
                :aria-label="t('management.tickets.questions.actions.moveUp')"
                @click="moveQuestion(idx, -1)"
              >
                <ArrowUp class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="idx === orderedQuestions.length - 1 || isReordering"
                :title="t('management.tickets.questions.actions.moveDown')"
                :aria-label="t('management.tickets.questions.actions.moveDown')"
                @click="moveQuestion(idx, 1)"
              >
                <ArrowDown class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                :title="t('management.tickets.questions.actions.edit')"
                :aria-label="t('management.tickets.questions.actions.edit')"
                @click="openEditModal(q)"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                :title="t('management.tickets.questions.actions.delete')"
                :aria-label="t('management.tickets.questions.actions.delete')"
                @click="confirmDelete(q)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Actions (Mobile) -->
          <div
            v-if="canEdit"
            class="sm:hidden flex items-center justify-end gap-0.5 px-3 pb-2 pt-0 border-t border-slate-100"
          >
            <button
              type="button"
              class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              :disabled="idx === 0 || isReordering"
              :aria-label="t('management.tickets.questions.actions.moveUp')"
              @click="moveQuestion(idx, -1)"
            >
              <ArrowUp class="w-4 h-4" />
            </button>
            <button
              type="button"
              class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              :disabled="idx === orderedQuestions.length - 1 || isReordering"
              :aria-label="t('management.tickets.questions.actions.moveDown')"
              @click="moveQuestion(idx, 1)"
            >
              <ArrowDown class="w-4 h-4" />
            </button>
            <button
              type="button"
              class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              :aria-label="t('management.tickets.questions.actions.edit')"
              @click="openEditModal(q)"
            >
              <Edit2 class="w-4 h-4" />
            </button>
            <button
              type="button"
              class="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              :aria-label="t('management.tickets.questions.actions.delete')"
              @click="confirmDelete(q)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Add / edit modal -->
    <CheckoutQuestionModal
      ref="modalRef"
      :show="showModal"
      :question="editTarget"
      :tiers="tiers"
      :is-saving="isSaving"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Delete confirm -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :title="t('management.tickets.questions.deleteConfirm.title')"
      :item-name="deleteTarget?.question_text || ''"
      :loading="isDeleting"
      @confirm="confirmDeleteQuestion"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
import CheckoutQuestionModal from './CheckoutQuestionModal.vue'
import { checkoutQuestionsService, ticketTypesService } from '@/services/api'
import type {
  CheckoutQuestionType,
  CreateCheckoutQuestionRequest,
  TicketCheckoutQuestion,
  TicketType,
  UpdateCheckoutQuestionRequest,
} from '@/services/api'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  message: [type: 'success' | 'error', text: string]
}>()

const { t } = useAppLanguage()

// ---- State ---------------------------------------------------------------
const questions = ref<TicketCheckoutQuestion[]>([])
const tiers = ref<TicketType[]>([])
const loading = ref(false)

const showModal = ref(false)
const editTarget = ref<TicketCheckoutQuestion | null>(null)
const isSaving = ref(false)
const modalRef = ref<InstanceType<typeof CheckoutQuestionModal> | null>(null)

const showDeleteModal = ref(false)
const deleteTarget = ref<TicketCheckoutQuestion | null>(null)
const isDeleting = ref(false)

const isReordering = ref(false)

// ---- Computed ------------------------------------------------------------
const orderedQuestions = computed(() =>
  [...questions.value].sort((a, b) => a.order - b.order),
)

const typeLabels: Record<CheckoutQuestionType, string> = {
  text: 'text',
  long_text: 'long_text',
  yes_no: 'yes_no',
  single_choice: 'single_choice',
  multi_choice: 'multi_choice',
}

const getTypeLabel = (type: CheckoutQuestionType) =>
  t(`management.tickets.questions.types.${typeLabels[type]}`)

const tierScopeLabel = (q: TicketCheckoutQuestion): string => {
  if (!q.ticket_type_id) return t('management.tickets.questions.scopeAllTiers')
  const tier = tiers.value.find((tt) => tt.id === q.ticket_type_id)
  if (!tier) return t('management.tickets.questions.scopeAllTiers')
  return t('management.tickets.questions.scopeTier', { tier: tier.name })
}

// ---- Load ----------------------------------------------------------------
const loadAll = async () => {
  loading.value = true
  try {
    // Run both fetches in parallel — questions are the primary content but
    // tiers are needed to render the per-tier scope label and to populate
    // the modal's scope dropdown.
    const [questionsRes, tiersRes] = await Promise.all([
      checkoutQuestionsService.list(props.eventId),
      ticketTypesService.list(props.eventId),
    ])
    if (questionsRes.success && questionsRes.data) {
      questions.value = questionsRes.data
    } else if (questionsRes.message) {
      emit('message', 'error', questionsRes.message)
    }
    if (tiersRes.success && tiersRes.data) {
      tiers.value = tiersRes.data
    }
  } catch {
    emit('message', 'error', t('management.tickets.questions.modal.errorGeneric'))
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)

// ---- Add / edit ----------------------------------------------------------
const openAddModal = () => {
  editTarget.value = null
  showModal.value = true
}

const openEditModal = (q: TicketCheckoutQuestion) => {
  editTarget.value = q
  showModal.value = true
}

const closeModal = () => {
  if (isSaving.value) return
  showModal.value = false
  editTarget.value = null
}

const handleSave = async (
  payload: CreateCheckoutQuestionRequest | UpdateCheckoutQuestionRequest,
) => {
  isSaving.value = true
  try {
    if (editTarget.value) {
      const response = await checkoutQuestionsService.update(
        props.eventId,
        editTarget.value.id,
        payload,
      )
      if (response.success) {
        showModal.value = false
        editTarget.value = null
        emit('message', 'success', t('management.tickets.questions.actions.save'))
        await loadAll()
      } else {
        const msg =
          response.message || t('management.tickets.questions.modal.errorGeneric')
        modalRef.value?.setErrorMessage(msg)
        emit('message', 'error', msg)
      }
    } else {
      const nextOrder =
        orderedQuestions.value.length > 0
          ? orderedQuestions.value[orderedQuestions.value.length - 1].order + 1
          : 0
      const response = await checkoutQuestionsService.create(props.eventId, {
        ...(payload as CreateCheckoutQuestionRequest),
        order: nextOrder,
      })
      if (response.success) {
        showModal.value = false
        editTarget.value = null
        emit('message', 'success', t('management.tickets.questions.actions.save'))
        await loadAll()
      } else {
        const msg =
          response.message || t('management.tickets.questions.modal.errorGeneric')
        modalRef.value?.setErrorMessage(msg)
        emit('message', 'error', msg)
      }
    }
  } catch {
    const msg = t('management.tickets.questions.modal.errorGeneric')
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
    const response = await checkoutQuestionsService.bulkReorder(props.eventId, {
      updates,
    })
    if (response.success) {
      await loadAll()
    } else {
      emit(
        'message',
        'error',
        response.message || t('management.tickets.questions.modal.errorGeneric'),
      )
    }
  } catch {
    emit('message', 'error', t('management.tickets.questions.modal.errorGeneric'))
  } finally {
    isReordering.value = false
  }
}

// ---- Delete --------------------------------------------------------------
const confirmDelete = (q: TicketCheckoutQuestion) => {
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
    const response = await checkoutQuestionsService.remove(
      props.eventId,
      deleteTarget.value.id,
    )
    if (response.success) {
      showDeleteModal.value = false
      deleteTarget.value = null
      await loadAll()
    } else {
      emit(
        'message',
        'error',
        response.message || t('management.tickets.questions.modal.errorGeneric'),
      )
    }
  } catch {
    emit('message', 'error', t('management.tickets.questions.modal.errorGeneric'))
  } finally {
    isDeleting.value = false
  }
}
</script>
