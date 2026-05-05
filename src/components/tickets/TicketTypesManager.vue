<template>
  <div>
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Ticket class="w-4 h-4 text-slate-500" />
          {{ t('management.tickets.tiers.header') }}
        </h3>
        <p class="mt-1 text-xs text-slate-500">
          {{ t('management.tickets.tiers.subtitle') }}
        </p>
      </div>
      <button
        v-if="canEdit"
        type="button"
        class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0"
        @click="openAddModal"
      >
        <Plus class="w-3.5 h-3.5" />
        {{ t('management.tickets.tiers.addButton') }}
      </button>
    </div>

    <!-- Body -->
    <div class="mt-4">
      <!-- Loading -->
      <div v-if="loading && tiers.length === 0" class="flex items-center justify-center py-8">
        <div class="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>

      <!-- Empty -->
      <div
        v-else-if="tiers.length === 0"
        class="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/40 px-4 py-6 text-center"
      >
        <Ticket class="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p class="text-sm font-medium text-slate-600">
          {{ t('management.tickets.tiers.empty.title') }}
        </p>
        <p class="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
          {{ t('management.tickets.tiers.empty.description') }}
        </p>
      </div>

      <!-- List -->
      <ul v-else class="space-y-2">
        <li
          v-for="(tier, idx) in orderedTiers"
          :key="tier.id"
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
                <p class="text-sm font-semibold text-slate-900 break-words">
                  {{ tier.name }}
                </p>
                <span class="text-sm text-slate-700 tabular-nums">
                  {{ formatCurrency(tier.price, tier.currency as CurrencyCode) }}
                </span>
                <!-- State badges -->
                <span
                  v-if="tier.is_sold_out"
                  class="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-rose-700 bg-rose-50"
                >
                  {{ t('management.tickets.tiers.soldOut') }}
                </span>
                <span
                  v-else-if="!tier.is_active"
                  class="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-slate-600 bg-slate-100"
                >
                  {{ t('management.tickets.tiers.inactive') }}
                </span>
                <span
                  v-else-if="saleNotStarted(tier)"
                  class="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-amber-700 bg-amber-50"
                >
                  {{ t('management.tickets.tiers.saleNotStarted', { when: formatSaleDate(tier.sale_start) }) }}
                </span>
                <span
                  v-else-if="saleEnded(tier)"
                  class="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-slate-600 bg-slate-100"
                >
                  {{ t('management.tickets.tiers.saleClosed') }}
                </span>
                <span
                  v-else
                  class="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-emerald-700 bg-emerald-50"
                >
                  {{ t('management.tickets.tiers.active') }}
                </span>
                <span
                  v-if="tier.allow_reentry"
                  class="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-sky-700 bg-sky-50"
                >
                  {{ t('management.tickets.tiers.reentry') }}
                </span>
              </div>
              <p class="mt-1 text-xs text-slate-500">
                {{ t('management.tickets.tiers.soldRemaining', { sold: tier.quantity_sold, remaining: tier.quantity_remaining }) }}
              </p>
              <p
                v-if="tier.description"
                class="mt-1 text-xs text-slate-500 break-words line-clamp-2"
              >
                {{ tier.description }}
              </p>
            </div>

            <!-- Actions -->
            <div v-if="canEdit" class="flex-shrink-0 flex items-center gap-0.5">
              <button
                type="button"
                class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="idx === 0 || isReordering"
                :title="t('management.tickets.tiers.actions.moveUp')"
                :aria-label="t('management.tickets.tiers.actions.moveUp')"
                @click="moveTier(idx, -1)"
              >
                <ArrowUp class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="idx === orderedTiers.length - 1 || isReordering"
                :title="t('management.tickets.tiers.actions.moveDown')"
                :aria-label="t('management.tickets.tiers.actions.moveDown')"
                @click="moveTier(idx, 1)"
              >
                <ArrowDown class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="togglingId === tier.id"
                :title="t('management.tickets.tiers.actions.toggleActive')"
                :aria-label="t('management.tickets.tiers.actions.toggleActive')"
                @click="toggleActive(tier)"
              >
                <ToggleRight v-if="tier.is_active" class="w-4 h-4" />
                <ToggleLeft v-else class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                :title="t('management.tickets.tiers.actions.edit')"
                :aria-label="t('management.tickets.tiers.actions.edit')"
                @click="openEditModal(tier)"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                :title="t('management.tickets.tiers.actions.delete')"
                :aria-label="t('management.tickets.tiers.actions.delete')"
                @click="confirmDelete(tier)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Add / edit modal -->
    <TicketTypeFormModal
      ref="modalRef"
      :show="showModal"
      :tier="editTarget"
      :is-saving="isSaving"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Delete confirm -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :title="t('management.tickets.tiers.deleteConfirm.title')"
      :item-name="deleteTarget?.name || ''"
      :loading="isDeleting"
      @confirm="confirmDeleteTier"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Ticket,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import DeleteConfirmModal from '../DeleteConfirmModal.vue'
import TicketTypeFormModal from './TicketTypeFormModal.vue'
import { ticketTypesService } from '@/services/api'
import type {
  CreateTicketTypeRequest,
  TicketType,
  UpdateTicketTypeRequest,
} from '@/services/api'
import { formatCurrency, type CurrencyCode } from '@/utils/currency'

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
const tiers = ref<TicketType[]>([])
const loading = ref(false)

const showModal = ref(false)
const editTarget = ref<TicketType | null>(null)
const isSaving = ref(false)
const modalRef = ref<InstanceType<typeof TicketTypeFormModal> | null>(null)

const showDeleteModal = ref(false)
const deleteTarget = ref<TicketType | null>(null)
const isDeleting = ref(false)

const isReordering = ref(false)
const togglingId = ref<number | null>(null)

// ---- Computed ------------------------------------------------------------
const orderedTiers = computed(() =>
  [...tiers.value].sort((a, b) => a.display_order - b.display_order),
)

const saleNotStarted = (t: TicketType) =>
  Boolean(t.sale_start && new Date(t.sale_start).getTime() > Date.now())

const saleEnded = (t: TicketType) =>
  Boolean(t.sale_end && new Date(t.sale_end).getTime() < Date.now())

const formatSaleDate = (iso: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

// ---- Load ----------------------------------------------------------------
const loadTiers = async () => {
  loading.value = true
  try {
    const response = await ticketTypesService.list(props.eventId)
    if (response.success && response.data) {
      tiers.value = response.data
    } else if (response.message) {
      emit('message', 'error', response.message)
    }
  } catch {
    emit('message', 'error', t('management.tickets.tiers.modal.errorGeneric'))
  } finally {
    loading.value = false
  }
}

onMounted(loadTiers)

// ---- Add / edit ----------------------------------------------------------
const openAddModal = () => {
  editTarget.value = null
  showModal.value = true
}

const openEditModal = (tier: TicketType) => {
  editTarget.value = tier
  showModal.value = true
}

const closeModal = () => {
  if (isSaving.value) return
  showModal.value = false
  editTarget.value = null
}

const handleSave = async (
  payload: CreateTicketTypeRequest | UpdateTicketTypeRequest,
) => {
  isSaving.value = true
  try {
    if (editTarget.value) {
      const response = await ticketTypesService.update(
        props.eventId,
        editTarget.value.id,
        payload,
      )
      if (response.success) {
        showModal.value = false
        editTarget.value = null
        emit('message', 'success', t('management.tickets.tiers.actions.save'))
        await loadTiers()
      } else {
        const msg = response.message || t('management.tickets.tiers.modal.errorGeneric')
        modalRef.value?.setErrorMessage(msg)
        emit('message', 'error', msg)
      }
    } else {
      const nextOrder =
        orderedTiers.value.length > 0
          ? orderedTiers.value[orderedTiers.value.length - 1].display_order + 1
          : 0
      const response = await ticketTypesService.create(props.eventId, {
        ...(payload as CreateTicketTypeRequest),
        display_order: nextOrder,
      })
      if (response.success) {
        showModal.value = false
        editTarget.value = null
        emit('message', 'success', t('management.tickets.tiers.actions.save'))
        await loadTiers()
      } else {
        const msg = response.message || t('management.tickets.tiers.modal.errorGeneric')
        modalRef.value?.setErrorMessage(msg)
        emit('message', 'error', msg)
      }
    }
  } catch {
    const msg = t('management.tickets.tiers.modal.errorGeneric')
    modalRef.value?.setErrorMessage(msg)
    emit('message', 'error', msg)
  } finally {
    isSaving.value = false
  }
}

// ---- Reorder -------------------------------------------------------------
// The backend has no bulk-reorder for tiers, so swap two adjacent rows by
// PATCHing each one's display_order individually. Two requests; runs in
// parallel and we refresh from the server afterwards to avoid drift.
const moveTier = async (index: number, delta: -1 | 1) => {
  const next = index + delta
  if (next < 0 || next >= orderedTiers.value.length) return

  const a = orderedTiers.value[index]
  const b = orderedTiers.value[next]

  isReordering.value = true
  try {
    await Promise.all([
      ticketTypesService.update(props.eventId, a.id, { display_order: b.display_order }),
      ticketTypesService.update(props.eventId, b.id, { display_order: a.display_order }),
    ])
    await loadTiers()
  } catch {
    emit('message', 'error', t('management.tickets.tiers.modal.errorGeneric'))
  } finally {
    isReordering.value = false
  }
}

// ---- Toggle active -------------------------------------------------------
// Backend has no dedicated /toggle-active/ endpoint — flipping the flag is a
// PATCH on the detail row with the desired next value.
const toggleActive = async (tier: TicketType) => {
  togglingId.value = tier.id
  try {
    const response = await ticketTypesService.toggleActive(
      props.eventId,
      tier.id,
      !tier.is_active,
    )
    if (response.success && response.data) {
      const updated = response.data
      const i = tiers.value.findIndex((t) => t.id === updated.id)
      if (i !== -1) tiers.value[i] = updated
    } else if (response.message) {
      emit('message', 'error', response.message)
    }
  } catch {
    emit('message', 'error', t('management.tickets.tiers.modal.errorGeneric'))
  } finally {
    togglingId.value = null
  }
}

// ---- Delete --------------------------------------------------------------
const confirmDelete = (tier: TicketType) => {
  deleteTarget.value = tier
  showDeleteModal.value = true
}

const cancelDelete = () => {
  if (isDeleting.value) return
  showDeleteModal.value = false
  deleteTarget.value = null
}

const confirmDeleteTier = async () => {
  if (!deleteTarget.value) return
  isDeleting.value = true
  try {
    const response = await ticketTypesService.remove(props.eventId, deleteTarget.value.id)
    if (response.success) {
      showDeleteModal.value = false
      deleteTarget.value = null
      await loadTiers()
    } else {
      emit(
        'message',
        'error',
        response.message || t('management.tickets.tiers.modal.errorGeneric'),
      )
    }
  } catch {
    emit('message', 'error', t('management.tickets.tiers.modal.errorGeneric'))
  } finally {
    isDeleting.value = false
  }
}
</script>
