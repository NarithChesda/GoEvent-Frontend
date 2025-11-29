<template>
  <div class="space-y-6">
    <!-- Header with Create Button -->
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Event Agenda</h3>
        <p class="text-lg text-slate-600 mt-1 leading-relaxed">
          Manage your event schedule and agenda items
        </p>
        <!-- Drag and Drop Hint (Desktop Only) -->
        <div v-if="canEdit && agendaItems.length > 0" class="hidden sm:flex items-center gap-1.5 mt-2 text-sm text-slate-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
          </svg>
          <span>Drag items to reorder or move between dates</span>
        </div>
      </div>
      <button
        v-if="canEdit"
        @click="openCreateDrawer"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-emerald-500/25 flex items-center space-x-2"
      >
        <Plus class="w-4 h-4" />
        <span>Add Agenda Item</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="bg-slate-200 rounded-2xl p-6">
          <div class="h-4 bg-slate-300 rounded mb-2"></div>
          <div class="h-3 bg-slate-300 rounded w-2/3"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <div class="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md mx-auto">
        <AlertCircle class="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p class="text-lg text-red-600 font-semibold leading-relaxed">{{ error }}</p>
        <button
          @click="fetchAgendaItems"
          class="mt-4 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!Array.isArray(agendaItems) || agendaItems.length === 0"
      class="text-center py-12"
    >
      <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 max-w-md mx-auto">
        <Calendar class="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h4 class="text-xl font-bold text-slate-900 mb-2 leading-tight tracking-tight">
          No Agenda Items Yet
        </h4>
        <p class="text-lg text-slate-600 mb-6 leading-relaxed">
          Start building your event schedule by adding agenda items.
        </p>
        <button
          v-if="canEdit"
          @click="openCreateDrawer"
          class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-emerald-500/25 flex items-center space-x-2 mx-auto"
        >
          <Plus class="w-4 h-4" />
          <span>Add First Item</span>
        </button>
      </div>
    </div>

    <!-- Reordering Overlay -->
    <Transition name="fade">
      <div
        v-if="isReordering"
        class="fixed inset-0 bg-black/10 z-40 flex items-center justify-center pointer-events-none"
      >
        <div
          class="bg-white rounded-xl shadow-2xl p-5 flex items-center space-x-3 border-2 border-blue-400"
        >
          <div
            class="animate-spin w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full"
          ></div>
          <div class="flex flex-col">
            <span class="text-base font-semibold text-slate-900">Reordering agenda...</span>
            <span class="text-xs text-slate-600">Please wait</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Agenda Items -->
    <div v-else class="space-y-4">
      <!-- Grouped by Date Cards -->
      <div v-for="(group, date) in groupedAgendaItems" :key="date">
        <!-- Date Card -->
        <div
          class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden"
        >
          <!-- Date Header (Entire header is clickable) -->
          <div
            @click="toggleDateExpanded(date)"
            class="group/header cursor-pointer p-6 hover:bg-gradient-to-r hover:from-emerald-50/40 hover:to-sky-50/40 transition-all duration-300 select-none"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4 flex-1">
                <!-- Date Icon (Calendar Page Style) -->
                <div
                  v-if="!isUnscheduled(date)"
                  class="w-12 h-12 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border border-emerald-200/50"
                >
                  <span class="text-[10px] font-semibold text-emerald-600 uppercase leading-none">{{ getMonthAbbr(date) }}</span>
                  <span class="text-xl font-bold text-slate-900 leading-tight">{{ getDayOfMonth(date) }}</span>
                </div>
                <div
                  v-else
                  class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-200/50"
                >
                  <Calendar class="w-6 h-6 text-slate-400" />
                </div>

                <!-- Date Info -->
                <div>
                  <h3 class="text-xl font-bold text-slate-900 leading-tight tracking-tight">
                    {{ group.date_text || 'Unscheduled' }}
                  </h3>
                  <p class="text-base text-slate-600 leading-relaxed">
                    {{ group.items.length }} {{ group.items.length === 1 ? 'item' : 'items' }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <!-- Edit/Delete buttons for date group -->
                <div
                  v-if="canEdit"
                  class="flex items-center gap-1 mr-2 opacity-0 group-hover/header:opacity-100 transition-opacity"
                >
                  <button
                    @click.stop="openEditDateGroupModal(date, group.items.length)"
                    class="p-2 text-slate-400 hover:text-[#1e90ff] hover:bg-[#E6F4FF] rounded-lg transition-colors"
                    title="Change date for all items"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button
                    @click.stop="openDeleteDateGroupModal(date, group.items.length)"
                    class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete all items in this date"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <!-- Expand/Collapse Icon -->
                <div
                  class="w-8 h-8 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-full flex items-center justify-center transition-transform duration-300"
                  :class="{ 'rotate-180': expandedDates.has(date) }"
                >
                  <ChevronDown class="w-4 h-4 text-[#1e90ff]" />
                </div>
              </div>
            </div>
          </div>

          <!-- Agenda Items (Collapsible) -->
          <Transition
            name="collapse"
            @enter="onEnter"
            @after-enter="onAfterEnter"
            @leave="onLeave"
            @after-leave="onAfterLeave"
          >
            <div v-if="expandedDates.has(date)" class="overflow-hidden">
              <div class="p-6 pt-4 space-y-3 border-t border-white/20">
                <div ref="sortableContainer" class="space-y-3" :data-date="date">
                  <AgendaItemCard
                    v-for="item in group.items"
                    :key="item.id"
                    :item="item"
                    :can-edit="canEdit"
                    :draggable="canEdit"
                    @edit="editAgendaItem"
                    @delete="deleteAgendaItem"
                    @drag-start="handleDragStart"
                    @drag-end="handleDragEnd"
                    class="agenda-item"
                    :data-id="item.id"
                  />
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Unified Agenda Drawer (for both create and edit) -->
    <EditAgendaDrawer
      v-model="showAgendaDrawer"
      :event-id="eventId"
      :item="selectedItem || undefined"
      :existing-agenda-items="agendaItems"
      @created="handleAgendaItemCreated"
      @updated="handleAgendaItemUpdated"
    />

    <!-- Delete Confirmation Modal (Single Item) -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="deleting"
      title="Delete Agenda Item"
      :item-name="itemToDelete?.title"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />

    <!-- Delete Date Group Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteDateGroupModal"
      :loading="isDeletingDateGroup"
      title="Delete All Items in Date Group"
      :item-name="dateGroupToDelete ? `all ${dateGroupToDelete.itemCount} agenda items on ${formatDateWithOrdinal(isUnscheduled(dateGroupToDelete.date) ? null : dateGroupToDelete.date, '')}` : ''"
      message="This will permanently delete all agenda items scheduled for this date. This action cannot be undone."
      @confirm="deleteDateGroup"
      @cancel="closeDeleteDateGroupModal"
    />

    <!-- Edit Date Group Modal -->
    <EditDateGroupModal
      :show="showEditDateGroupModal"
      v-model="newDateForGroup"
      :current-date-display="dateGroupToEdit ? formatDateWithOrdinal(isUnscheduled(dateGroupToEdit.date) ? null : dateGroupToEdit.date, '') : ''"
      :item-count="dateGroupToEdit?.itemCount || 0"
      :loading="isUpdatingDateGroup"
      @confirm="updateDateGroup"
      @cancel="closeEditDateGroupModal"
    />

    <!-- Toast Messages -->
    <Transition name="slide-up">
      <div v-if="toast.message.value" class="fixed bottom-8 right-8 z-50">
        <div
          :class="toast.message.value.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-6 py-4 rounded-xl shadow-lg flex items-center"
        >
          <CheckCircle v-if="toast.message.value.type === 'success'" class="w-5 h-5 mr-2" />
          <AlertCircle v-else class="w-5 h-5 mr-2" />
          {{ toast.message.value.text }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, toRef } from 'vue'
import { Plus, Calendar, AlertCircle, ChevronDown, Edit2, Trash2, CheckCircle } from 'lucide-vue-next'
import { agendaService, type EventAgendaItem } from '../services/api'
import AgendaItemCard from './AgendaItemCard.vue'
import EditAgendaDrawer from './EditAgendaDrawer.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import EditDateGroupModal from './EditDateGroupModal.vue'
import { useDateGroupOperations } from '@/composables/useDateGroupOperations'
import { useToast } from '@/composables/useToast'
import { isUnscheduled, fromApiDate } from '@/constants/agenda'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()

// State
const agendaItems = ref<EventAgendaItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showAgendaDrawer = ref(false)
const showDeleteModal = ref(false)
const selectedItem = ref<EventAgendaItem | null>(null)
const itemToDelete = ref<EventAgendaItem | null>(null)
const deleting = ref(false)

// Drag and drop state
const draggedItem = ref<EventAgendaItem | null>(null)
const isReordering = ref(false)

// Expanded dates state
const expandedDates = ref<Set<string>>(new Set())

// Toast notifications
const toast = useToast()

// Date group operations (composable)
const {
  showEditDateGroupModal,
  dateGroupToEdit,
  newDateForGroup,
  isUpdatingDateGroup,
  openEditDateGroupModal,
  closeEditDateGroupModal,
  updateDateGroup,
  showDeleteDateGroupModal,
  dateGroupToDelete,
  isDeletingDateGroup,
  openDeleteDateGroupModal,
  closeDeleteDateGroupModal,
  deleteDateGroup,
} = useDateGroupOperations({
  eventId: toRef(props, 'eventId'),
  agendaItems,
  expandedDates,
  onSuccess: (message) => toast.showSuccess(message),
  onError: (message) => toast.showError(message),
})

// Date formatting helpers for calendar icon
const getMonthAbbr = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
}

const getDayOfMonth = (dateStr: string): string => {
  return new Date(dateStr).getDate().toString()
}

// Helper function to format date with ordinal
const formatDateWithOrdinal = (dateString: string | null, dateText: string) => {
  if (dateText && dateText.trim() !== '') {
    return dateText
  }

  if (!dateString) {
    return 'Unscheduled'
  }

  try {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleDateString('en-US', { month: 'long' })

    // Add ordinal suffix
    const ordinal = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd']
      const v = n % 100
      return n + (s[(v - 20) % 10] || s[v] || s[0])
    }

    return `${month} ${ordinal(day)}`
  } catch {
    return dateString
  }
}

// Computed
const groupedAgendaItems = computed(() => {
  const groups: Record<string, { date_text: string; items: EventAgendaItem[] }> = {}

  if (!Array.isArray(agendaItems.value)) {
    return groups
  }

  agendaItems.value.forEach((item) => {
    const date = fromApiDate(item.date)
    if (!groups[date]) {
      groups[date] = {
        date_text: formatDateWithOrdinal(item.date, item.date_text),
        items: [],
      }
    }
    groups[date].items.push(item)
  })

  // Sort items within each group by order
  Object.values(groups).forEach((group) => {
    group.items.sort((a, b) => a.order - b.order)
  })

  return groups
})

// Methods
const fetchAgendaItems = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await agendaService.getAgendaItems(props.eventId)
    if (response.success && response.data) {
      // Handle paginated response format
      if (response.data.results && Array.isArray(response.data.results)) {
        agendaItems.value = response.data.results
      } else if (Array.isArray(response.data)) {
        agendaItems.value = response.data
      } else {
        console.warn('API response data is not in expected format:', response.data)
        agendaItems.value = []
      }

      // Auto-expand first date group after data is loaded
      await nextTick()
      if (agendaItems.value.length > 0) {
        const firstDate = Object.keys(groupedAgendaItems.value)[0]
        if (firstDate && !expandedDates.value.has(firstDate)) {
          expandedDates.value.add(firstDate)
        }
      }
    } else {
      error.value = response.message || 'Failed to load agenda items'
      agendaItems.value = []
    }
  } catch (err) {
    error.value = 'Network error while loading agenda items'
    agendaItems.value = []
    console.error('Error fetching agenda items:', err)
  } finally {
    loading.value = false
  }
}

const editAgendaItem = (item: EventAgendaItem) => {
  selectedItem.value = item
  showAgendaDrawer.value = true
}

const deleteAgendaItem = (item: EventAgendaItem) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!itemToDelete.value) return

  deleting.value = true
  try {
    const response = await agendaService.deleteAgendaItem(props.eventId, itemToDelete.value.id)
    if (response.success) {
      if (Array.isArray(agendaItems.value)) {
        agendaItems.value = agendaItems.value.filter((item) => item.id !== itemToDelete.value!.id)
      } else {
        agendaItems.value = []
      }
      showDeleteModal.value = false
      itemToDelete.value = null
      toast.showSuccess('Agenda item deleted successfully')
    } else {
      toast.showError(response.message || 'Failed to delete agenda item')
    }
  } catch (err) {
    toast.showError('Network error while deleting agenda item')
    console.error('Error deleting agenda item:', err)
  } finally {
    deleting.value = false
  }
}

const handleAgendaItemCreated = (newItem: EventAgendaItem) => {
  if (Array.isArray(agendaItems.value)) {
    agendaItems.value.push(newItem)
  } else {
    agendaItems.value = [newItem]
  }
  selectedItem.value = null
}

const handleAgendaItemUpdated = (updatedItem: EventAgendaItem) => {
  if (Array.isArray(agendaItems.value)) {
    const index = agendaItems.value.findIndex((item) => item.id === updatedItem.id)
    if (index !== -1) {
      agendaItems.value[index] = updatedItem
    }
  } else {
    agendaItems.value = [updatedItem]
  }
  selectedItem.value = null
}

const openCreateDrawer = () => {
  selectedItem.value = null
  showAgendaDrawer.value = true
}

// Drag and drop handlers
const handleDragStart = (item: EventAgendaItem) => {
  draggedItem.value = item
}

const handleDragEnd = async (targetItem: EventAgendaItem | null, targetDate?: string | null) => {
  // Prevent concurrent reorder operations
  if (isReordering.value) {
    console.warn('Reorder operation already in progress')
    draggedItem.value = null
    return
  }

  if (!draggedItem.value || !targetItem || draggedItem.value.id === targetItem.id) {
    draggedItem.value = null
    return
  }

  if (!Array.isArray(agendaItems.value)) {
    draggedItem.value = null
    return
  }

  isReordering.value = true
  const originalItems = [...agendaItems.value]

  try {
    const isChangingDate = draggedItem.value.date !== targetItem.date
    const draggedIndex = agendaItems.value.findIndex((item) => item.id === draggedItem.value!.id)
    const targetIndex = agendaItems.value.findIndex((item) => item.id === targetItem.id)

    if (draggedIndex === -1 || targetIndex === -1) {
      return
    }

    const newItems = [...agendaItems.value]
    const [draggedItemData] = newItems.splice(draggedIndex, 1)

    if (isChangingDate && targetDate !== undefined) {
      draggedItemData.date = targetDate
      draggedItemData.date_text = ''
    }

    newItems.splice(targetIndex, 0, draggedItemData)

    const itemsByDate = new Map<string | null, EventAgendaItem[]>()
    newItems.forEach((item) => {
      const dateKey = item.date
      if (!itemsByDate.has(dateKey)) {
        itemsByDate.set(dateKey, [])
      }
      itemsByDate.get(dateKey)!.push(item)
    })

    const updatedItems: EventAgendaItem[] = []
    itemsByDate.forEach((items) => {
      items.forEach((item, index) => {
        item.order = index
        updatedItems.push(item)
      })
    })

    agendaItems.value = [...newItems]
    await nextTick()

    const updates = updatedItems.map((item) => ({
      id: item.id,
      order: item.order,
      date: item.date,
    }))

    const response = await agendaService.bulkReorderAgendaItems(props.eventId, { updates })

    if (!response.success) {
      agendaItems.value = originalItems
      await nextTick()
      toast.showError(response.message || 'Failed to reorder agenda items')
    } else if (isChangingDate) {
      toast.showSuccess('Agenda item moved to new date successfully')
    }
  } catch (err) {
    agendaItems.value = originalItems
    await nextTick()
    toast.showError('Network error while reordering agenda items')
    console.error('Error reordering agenda items:', err)
  } finally {
    isReordering.value = false
    draggedItem.value = null
  }
}

// Expand/Collapse functionality
const toggleDateExpanded = (date: string) => {
  if (expandedDates.value.has(date)) {
    expandedDates.value.delete(date)
  } else {
    expandedDates.value.add(date)
  }
}

// Collapse/Expand transition hooks for smooth animation
const onEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = '0'
  element.style.opacity = '0'
  // Force reflow
  void element.offsetHeight
  element.style.height = element.scrollHeight + 'px'
  element.style.opacity = '1'
}

const onAfterEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = 'auto'
}

const onLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = element.scrollHeight + 'px'
  // Force reflow
  void element.offsetHeight
  element.style.height = '0'
  element.style.opacity = '0'
}

const onAfterLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = 'auto'
  element.style.opacity = '1'
}

// Lifecycle
onMounted(async () => {
  await fetchAgendaItems()
  await nextTick()
  const firstDate = Object.keys(groupedAgendaItems.value)[0]
  if (firstDate) {
    expandedDates.value.add(firstDate)
  }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.agenda-item {
  transition: transform 0.2s ease;
}

.agenda-item.dragging {
  transform: rotate(2deg) scale(1.02);
  z-index: 10;
}

/* Collapse/Expand transition for agenda groups */
.collapse-enter-active,
.collapse-leave-active {
  transition: height 0.3s ease-out, opacity 0.25s ease-out;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  height: 0;
  opacity: 0;
}

/* Fade transition for reordering overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide up transition for toast */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
