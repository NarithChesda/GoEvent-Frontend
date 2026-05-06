<template>
  <div class="space-y-4">
    <!-- Header / Actions Bar (sticky, matches guest/expense pattern) -->
    <div class="sticky top-0 z-20">
      <div class="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm">
        <div class="flex items-center gap-2 sm:gap-3 p-3">
          <!-- Title with icon -->
          <div class="flex items-center gap-2 min-w-0 flex-shrink">
            <Ticket class="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span class="text-sm font-semibold text-slate-900 truncate">
              {{ t('management.tickets.tiers.header') }}
            </span>
          </div>

          <!-- Divider -->
          <div class="w-px h-5 bg-slate-200 hidden sm:block"></div>

          <!-- Tier count -->
          <div class="hidden sm:flex items-center gap-1 text-sm text-slate-500 tabular-nums flex-shrink-0">
            <span class="font-medium text-slate-700">{{ orderedTiers.length }}</span>
          </div>

          <!-- Spacer -->
          <div class="flex-1"></div>

          <!-- Add Tier -->
          <button
            v-if="canEdit"
            type="button"
            class="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all duration-200 flex-shrink-0"
            :aria-label="t('management.tickets.tiers.addButton')"
            @click="openAddModal"
          >
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline">{{ t('management.tickets.tiers.addButton') }}</span>
          </button>
        </div>

        <!-- Subtitle row -->
        <div class="px-3 pb-3 -mt-1">
          <p class="text-xs text-slate-500">
            {{ t('management.tickets.tiers.subtitle') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div>
      <!-- Loading -->
      <div v-if="loading && tiers.length === 0" class="flex justify-center items-center py-12">
        <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Empty (Editable) -->
      <div
        v-else-if="tiers.length === 0 && canEdit"
        class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-8 sm:p-12 hover:bg-slate-100/50 hover:border-emerald-400 transition-all duration-300 cursor-pointer group"
        @click="openAddModal"
      >
        <div class="flex flex-col items-center justify-center text-center">
          <div
            class="w-16 h-16 bg-slate-200 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300"
          >
            <Ticket class="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          <h4 class="font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
            {{ t('management.tickets.tiers.empty.title') }}
          </h4>
          <p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm">
            {{ t('management.tickets.tiers.empty.description') }}
          </p>
        </div>
      </div>

      <!-- Empty (Read-only) -->
      <div
        v-else-if="tiers.length === 0"
        class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-8 sm:p-12 text-center"
      >
        <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Ticket class="w-8 h-8 text-slate-400" />
        </div>
        <h4 class="font-semibold text-slate-900 mb-1.5 sm:mb-2">
          {{ t('management.tickets.tiers.empty.title') }}
        </h4>
        <p class="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          {{ t('management.tickets.tiers.empty.description') }}
        </p>
      </div>

      <!-- List -->
      <ul v-else class="space-y-2">
        <li
          v-for="(tier, idx) in orderedTiers"
          :key="tier.id"
          class="bg-white/80 border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:bg-white transition-all duration-200"
        >
          <div class="flex items-start gap-3 px-4 py-3">
            <!-- Order badge -->
            <div
              class="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-100 text-slate-600 text-sm font-semibold flex items-center justify-center tabular-nums"
              :aria-label="`Tier ${idx + 1}`"
            >
              {{ idx + 1 }}
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <!-- Top row: name + price + state badges -->
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <p class="text-sm font-semibold text-slate-900 break-words">
                  {{ tier.name }}
                </p>
                <span class="text-sm font-semibold text-slate-900 tabular-nums">
                  {{ formatCurrency(tier.price, tier.currency as CurrencyCode) }}
                </span>
                <!-- State badges -->
                <span
                  v-if="tier.is_sold_out"
                  class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium text-rose-700 bg-rose-50"
                >
                  {{ t('management.tickets.tiers.soldOut') }}
                </span>
                <span
                  v-else-if="!tier.is_active"
                  class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium text-slate-600 bg-slate-100"
                >
                  {{ t('management.tickets.tiers.inactive') }}
                </span>
                <span
                  v-else-if="saleNotStarted(tier)"
                  class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium text-amber-700 bg-amber-50"
                >
                  {{ t('management.tickets.tiers.saleNotStarted', { when: formatSaleDate(tier.sale_start) }) }}
                </span>
                <span
                  v-else-if="saleEnded(tier)"
                  class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium text-slate-600 bg-slate-100"
                >
                  {{ t('management.tickets.tiers.saleClosed') }}
                </span>
                <span
                  v-else
                  class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium text-emerald-700 bg-emerald-50"
                >
                  {{ t('management.tickets.tiers.active') }}
                </span>
                <span
                  v-if="tier.allow_reentry"
                  class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium text-sky-700 bg-sky-50"
                >
                  {{ t('management.tickets.tiers.reentry') }}
                </span>
              </div>

              <!-- Quantity row -->
              <p class="text-xs text-slate-500 tabular-nums">
                {{ t('management.tickets.tiers.soldRemaining', { sold: tier.quantity_sold, remaining: tier.quantity_remaining }) }}
              </p>
              <p
                v-if="tier.description"
                class="mt-1 text-xs text-slate-500 break-words line-clamp-2"
              >
                {{ tier.description }}
              </p>
            </div>

            <!-- Actions (Desktop) -->
            <div v-if="canEdit" class="hidden sm:flex items-center gap-0.5 flex-shrink-0">
              <button
                type="button"
                class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="idx === 0 || isReordering"
                :title="t('management.tickets.tiers.actions.moveUp')"
                :aria-label="t('management.tickets.tiers.actions.moveUp')"
                @click="moveTier(idx, -1)"
              >
                <ArrowUp class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="idx === orderedTiers.length - 1 || isReordering"
                :title="t('management.tickets.tiers.actions.moveDown')"
                :aria-label="t('management.tickets.tiers.actions.moveDown')"
                @click="moveTier(idx, 1)"
              >
                <ArrowDown class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
                class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                :title="t('management.tickets.tiers.actions.edit')"
                :aria-label="t('management.tickets.tiers.actions.edit')"
                @click="openEditModal(tier)"
              >
                <Edit2 class="w-4 h-4" />
              </button>
              <button
                type="button"
                class="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                :title="t('management.tickets.tiers.actions.delete')"
                :aria-label="t('management.tickets.tiers.actions.delete')"
                @click="confirmDelete(tier)"
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
              :aria-label="t('management.tickets.tiers.actions.moveUp')"
              @click="moveTier(idx, -1)"
            >
              <ArrowUp class="w-4 h-4" />
            </button>
            <button
              type="button"
              class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              :disabled="idx === orderedTiers.length - 1 || isReordering"
              :aria-label="t('management.tickets.tiers.actions.moveDown')"
              @click="moveTier(idx, 1)"
            >
              <ArrowDown class="w-4 h-4" />
            </button>
            <button
              type="button"
              class="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              :disabled="togglingId === tier.id"
              :aria-label="t('management.tickets.tiers.actions.toggleActive')"
              @click="toggleActive(tier)"
            >
              <ToggleRight v-if="tier.is_active" class="w-4 h-4" />
              <ToggleLeft v-else class="w-4 h-4" />
            </button>
            <button
              type="button"
              class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              :aria-label="t('management.tickets.tiers.actions.edit')"
              @click="openEditModal(tier)"
            >
              <Edit2 class="w-4 h-4" />
            </button>
            <button
              type="button"
              class="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              :aria-label="t('management.tickets.tiers.actions.delete')"
              @click="confirmDelete(tier)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
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
