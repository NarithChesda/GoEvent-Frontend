<template>
  <div>
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <MessageSquareText class="w-4 h-4 text-slate-500" />
          {{ t('management.tickets.questions.header') }}
        </h3>
        <p class="mt-1 text-xs text-slate-500">
          {{ t('management.tickets.questions.subtitle') }}
        </p>
      </div>
      <button
        v-if="canEdit"
        type="button"
        class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0"
        @click="openAddModal"
      >
        <Plus class="w-3.5 h-3.5" />
        {{ t('management.tickets.questions.addButton') }}
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
          {{ t('management.tickets.questions.empty.title') }}
        </p>
        <p class="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
          {{ t('management.tickets.questions.empty.description') }}
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
                  {{ q.question_text }}
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
                  {{ t('management.tickets.questions.requiredBadge') }}
                </span>
                <span
                  v-if="!q.is_active"
                  class="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-slate-600 bg-slate-100"
                >
                  {{ t('management.tickets.questions.inactiveBadge') }}
                </span>
                <span
                  class="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-sky-700 bg-sky-50"
                >
                  {{ tierScopeLabel(q) }}
                </span>
              </div>
              <p
                v-if="q.choices && q.choices.length > 0"
                class="mt-1 text-xs text-slate-500 break-words"
              >
                {{ q.choices.join(', ') }}
              </p>
            </div>

            <!-- Actions -->
            <div v-if="canEdit" class="flex-shrink-0 flex items-center gap-0.5">
              <button
                type="button"
                class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="idx === 0 || isReordering"
                :title="t('management.tickets.questions.actions.moveUp')"
                :aria-label="t('management.tickets.questions.actions.moveUp')"
                @click="moveQuestion(idx, -1)"
              >
                <ArrowUp class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="idx === orderedQuestions.length - 1 || isReordering"
                :title="t('management.tickets.questions.actions.moveDown')"
                :aria-label="t('management.tickets.questions.actions.moveDown')"
                @click="moveQuestion(idx, 1)"
              >
                <ArrowDown class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                :title="t('management.tickets.questions.actions.edit')"
                :aria-label="t('management.tickets.questions.actions.edit')"
                @click="openEditModal(q)"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                :title="t('management.tickets.questions.actions.delete')"
                :aria-label="t('management.tickets.questions.actions.delete')"
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
