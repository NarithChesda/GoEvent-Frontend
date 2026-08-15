<template>
  <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 border border-white/20">
    <!-- Header (click to expand/collapse) -->
    <div class="flex items-start justify-between gap-3">
      <button
        type="button"
        class="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 rounded-lg"
        :aria-expanded="isExpanded"
        :aria-label="t('management.media.sectionToggle')"
        @click="toggleExpanded"
      >
        <h5 class="font-semibold text-slate-900">{{ t('management.dressCode.section.title') }}</h5>
        <p class="text-sm text-slate-600">{{ t('management.dressCode.section.subtitle') }}</p>
        <p
          v-if="canEdit && dressCodes.length > 1"
          class="hidden sm:flex items-center gap-1 text-xs text-slate-400 mt-1"
        >
          <ArrowUpDown class="w-3 h-3" aria-hidden="true" />
          {{ t('management.dressCode.section.dragHint') }}
        </p>
      </button>

      <div class="flex items-center gap-1 flex-shrink-0">
        <!-- Add pill — only while the section is open; a collapsed card shows
             nothing but its chevron. -->
        <button
          v-if="isExpanded && canEdit && dressCodes.length > 0"
          @click="openAddDrawer"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 border border-dashed border-slate-300 rounded-full hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-50 transition-all"
          :title="t('management.dressCode.section.addCard.label')"
        >
          <Plus class="w-3.5 h-3.5" aria-hidden="true" />
          <span>{{ t('management.dressCode.section.addCard.label') }}</span>
        </button>
        <button
          type="button"
          class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          :aria-expanded="isExpanded"
          :aria-label="t('management.media.sectionToggle')"
          :title="t('management.media.sectionToggle')"
          @click="toggleExpanded"
        >
          <ChevronDown class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': isExpanded }" aria-hidden="true" />
        </button>
      </div>
    </div>

    <Transition name="collapse">
    <div v-if="isExpanded" class="grid grid-rows-[1fr]">
    <div class="min-h-0 overflow-hidden">
    <div class="pt-6">
    <!-- Loading State -->
    <div v-if="loading" aria-hidden="true">
      <div class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        <div v-for="i in 3" :key="i" class="p-3 sm:p-4 flex items-center gap-3">
          <div class="w-10 h-10 bg-slate-200 rounded-lg animate-pulse flex-shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3 w-32 bg-slate-200 rounded animate-pulse"></div>
            <div class="h-3 w-48 bg-slate-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error">
      <div class="bg-red-50 border border-red-200 rounded-2xl p-4">
        <div class="flex items-center space-x-2">
          <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" aria-hidden="true" />
          <div class="flex-1">
            <p class="text-sm text-red-600 font-medium">{{ error }}</p>
            <button
              @click="fetchDressCodes"
              class="text-red-600 text-sm hover:text-red-700 underline mt-1"
            >
              {{ t('management.dressCode.section.tryAgain') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="dressCodes.length === 0"
      @click="canEdit ? openAddDrawer() : null"
      :class="[
        'border-2 border-dashed rounded-2xl p-8 transition-all duration-300 text-center',
        canEdit
          ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group'
          : 'border-slate-300 bg-slate-50'
      ]"
    >
      <div class="flex flex-col items-center justify-center">
        <Shirt
          :class="[
            'w-8 h-8 mb-3 transition-colors',
            canEdit ? 'text-slate-400 group-hover:text-emerald-600' : 'text-slate-400'
          ]"
          aria-hidden="true"
        />
        <p :class="[
          'font-semibold transition-colors',
          canEdit ? 'text-slate-600 group-hover:text-slate-900' : 'text-slate-600'
        ]">{{ t('management.dressCode.section.empty.title') }}</p>
        <p class="text-sm text-slate-500 mt-1">{{ t('management.dressCode.section.empty.description') }}</p>
        <p v-if="canEdit" class="text-xs text-slate-400 mt-1">{{ t('management.dressCode.section.empty.hint') }}</p>
      </div>
    </div>

    <!-- Dress Code Rows -->
    <div v-else class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
      <button
        v-for="dressCode in sortedDressCodes"
        :key="dressCode.id"
        @click="canEdit ? openEditDrawer(dressCode) : null"
        :aria-label="t('management.dressCode.section.rowAriaLabel', { name: dressCode.title || dressCode.dress_code_type_display })"
        :draggable="canEdit"
        @dragstart="handleDragStart(dressCode, $event)"
        @dragend="handleDragEnd"
        @dragover.prevent="dragOverId = dressCode.id"
        @dragleave="dragOverId === dressCode.id && (dragOverId = null)"
        @drop.prevent="handleDrop(dressCode)"
        class="w-full flex items-center gap-3 p-3 sm:p-4 min-h-[56px] text-left hover:bg-slate-50 active:bg-slate-100 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-inset"
        :class="{
          'opacity-50': draggedDressCode?.id === dressCode.id,
          'bg-sky-50': dragOverId === dressCode.id && draggedDressCode && draggedDressCode.id !== dressCode.id,
          'cursor-default': !canEdit,
        }"
        :style="{ boxShadow: `inset 3px 0 0 0 ${withAlpha(dressCode.color || '#3498db', '66')}` }"
      >
        <!-- Leading: image thumbnail or tinted icon disc -->
        <img
          v-if="dressCode.image"
          :src="dressCode.image"
          :alt="dressCode.title || dressCode.dress_code_type_display"
          class="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-100"
        />
        <div
          v-else
          class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          :style="{ backgroundColor: withAlpha(dressCode.color || '#3498db', '14') }"
        >
          <Shirt class="w-4 h-4" :style="{ color: dressCode.color || '#3498db' }" aria-hidden="true" />
        </div>

        <!-- Body -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-slate-900 truncate">
              {{ dressCode.title || dressCode.dress_code_type_display }}
            </p>
            <span
              v-if="!dressCode.is_active"
              class="text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase bg-amber-50 text-amber-600 border-amber-200 flex-shrink-0"
            >
              {{ t('management.dressCode.card.inactive') }}
            </span>
          </div>
          <p class="text-xs sm:text-sm text-slate-500 line-clamp-1 mt-0.5">
            {{ rowMeta(dressCode) }}
          </p>
        </div>

        <ChevronRight v-if="canEdit" class="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
      </button>
    </div>
    </div>
    </div>
    </div>
    </Transition>

    <!-- Create/Edit Drawer -->
    <EditDressCodeDrawer
      v-model="showDrawer"
      :event-id="eventId"
      :dress-code="selectedDressCode"
      :max-order="Math.max(0, dressCodes.length - 1)"
      @saved="handleSaved"
      @delete="openDeleteModal"
    />

    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="deleting"
      :title="t('management.dressCode.section.deleteModal.title')"
      :item-name="dressCodeToDelete?.title || dressCodeToDelete?.dress_code_type_display || t('management.dressCode.section.deleteModal.title')"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Shirt, AlertCircle, ArrowUpDown, ChevronDown, ChevronRight, Plus } from 'lucide-vue-next'
import { dressCodeService, type EventDressCode } from '../services/api'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useNotifications } from '@/composables/useNotifications'
import { useCollapsibleSection } from '@/composables/useCollapsibleSection'
import EditDressCodeDrawer from './EditDressCodeDrawer.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()

const { t } = useAppLanguage()
const notify = useNotifications()
const { isExpanded, toggle: toggleExpanded } = useCollapsibleSection('dressCode')

// State
const dressCodes = ref<EventDressCode[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showDrawer = ref(false)
const showDeleteModal = ref(false)
const selectedDressCode = ref<EventDressCode | null>(null)
const dressCodeToDelete = ref<EventDressCode | null>(null)
const deleting = ref(false)

// Drag and drop state
const draggedDressCode = ref<EventDressCode | null>(null)
const dragOverId = ref<number | null>(null)

// Computed
const sortedDressCodes = computed(() => {
  return [...dressCodes.value].sort((a, b) => a.order - b.order)
})

// Hex color + 2-digit alpha suffix (e.g. '66' ≈ 40%, '14' ≈ 8%)
const withAlpha = (hex: string, alpha: string): string => {
  return /^#[0-9A-Fa-f]{6}$/.test(hex) ? `${hex}${alpha}` : `#3498db${alpha}`
}

const rowMeta = (dressCode: EventDressCode): string => {
  const parts = [dressCode.dress_code_type_display, dressCode.time_period_display, dressCode.gender_display]
  return parts.filter(Boolean).join(' · ')
}

// Methods
const fetchDressCodes = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await dressCodeService.getDressCodes(props.eventId, {
      ordering: 'order',
    })

    if (response.success && response.data) {
      if (Array.isArray(response.data.results)) {
        dressCodes.value = response.data.results
      } else if (Array.isArray(response.data)) {
        dressCodes.value = response.data
      } else {
        dressCodes.value = []
      }
    } else {
      error.value = response.message || t('management.dressCode.section.toast.loadFailed')
      dressCodes.value = []
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : t('management.dressCode.section.toast.loadNetworkError')
    error.value = errorMessage
    dressCodes.value = []
  } finally {
    loading.value = false
  }
}

const openAddDrawer = () => {
  selectedDressCode.value = null
  showDrawer.value = true
}

const openEditDrawer = (dressCode: EventDressCode) => {
  selectedDressCode.value = dressCode
  showDrawer.value = true
}

const handleSaved = async (saved: EventDressCode, requestedOrder?: number) => {
  const wasEditing = !!selectedDressCode.value
  await fetchDressCodes()

  if (requestedOrder !== undefined) {
    await applyRequestedOrder(saved, requestedOrder)
  }

  notify.success(wasEditing ? t('management.dressCode.section.toast.updated') : t('management.dressCode.section.toast.added'))
}

const openDeleteModal = (dressCode: EventDressCode) => {
  dressCodeToDelete.value = dressCode
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!dressCodeToDelete.value) return

  deleting.value = true

  try {
    const response = await dressCodeService.deleteDressCode(props.eventId, dressCodeToDelete.value.id)

    if (response.success) {
      dressCodes.value = dressCodes.value.filter((dc) => dc.id !== dressCodeToDelete.value!.id)
      showDeleteModal.value = false
      dressCodeToDelete.value = null
      showDrawer.value = false
      notify.success(t('management.dressCode.section.toast.deleted'))
    } else {
      notify.error(response.message || t('management.dressCode.section.toast.deleteFailed'))
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : t('management.dressCode.section.toast.deleteNetworkError')
    notify.error(errorMessage)
  } finally {
    deleting.value = false
  }
}

// Persist a fully reordered list (optimistic, rolls back by refetching)
const persistOrder = async (newList: EventDressCode[]) => {
  const updates = newList.map((item, index) => ({
    id: item.id,
    order: index,
  }))

  dressCodes.value = newList.map((item, index) => ({ ...item, order: index }))

  try {
    const response = await dressCodeService.bulkReorderDressCodes(props.eventId, { updates })

    if (!response.success) {
      await fetchDressCodes()
      notify.error(response.message || t('management.dressCode.section.toast.reorderFailed'))
    }
  } catch (err) {
    await fetchDressCodes()
    const errorMessage = err instanceof Error ? err.message : t('management.dressCode.section.toast.reorderNetworkError')
    notify.error(errorMessage)
  }
}

// Apply the position chosen in the drawer's mobile position control
const applyRequestedOrder = async (item: EventDressCode, requestedOrder: number) => {
  const list = [...sortedDressCodes.value]
  const from = list.findIndex((dc) => dc.id === item.id)
  if (from === -1) return

  const to = Math.min(Math.max(requestedOrder, 0), list.length - 1)
  if (from === to) return

  const [moved] = list.splice(from, 1)
  list.splice(to, 0, moved)
  await persistOrder(list)
}

// Drag and drop handlers (desktop)
const handleDragStart = (dressCode: EventDressCode, event: DragEvent) => {
  if (!props.canEdit) return
  draggedDressCode.value = dressCode
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', dressCode.id.toString())
  }
}

const handleDragEnd = () => {
  draggedDressCode.value = null
  dragOverId.value = null
}

const handleDrop = async (targetDressCode: EventDressCode) => {
  dragOverId.value = null

  if (!draggedDressCode.value || draggedDressCode.value.id === targetDressCode.id) {
    draggedDressCode.value = null
    return
  }

  const list = [...sortedDressCodes.value]
  const draggedIndex = list.findIndex((dc) => dc.id === draggedDressCode.value!.id)
  const targetIndex = list.findIndex((dc) => dc.id === targetDressCode.id)

  if (draggedIndex === -1 || targetIndex === -1) {
    draggedDressCode.value = null
    return
  }

  const [draggedItem] = list.splice(draggedIndex, 1)
  list.splice(targetIndex, 0, draggedItem)
  draggedDressCode.value = null

  await persistOrder(list)
}

// Lifecycle
onMounted(() => {
  fetchDressCodes()
})

// Expose method for parent component
defineExpose({
  openAddModal: openAddDrawer,
})
</script>

<style scoped>
/* Collapse/expand via grid-template-rows 0fr↔1fr — tracks real content
   height so both directions ease evenly (no max-height dead time) */
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none !important;
  }
}
</style>
