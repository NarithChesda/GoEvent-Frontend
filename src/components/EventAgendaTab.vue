<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">Event Agenda</h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1">Manage your event schedule and agenda items</p>
      </div>
      <button
        v-if="canEdit"
        @click="showCreateModal = true"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-3 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center text-sm sm:text-base"
      >
        <Plus class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        <span class="hidden sm:inline">Add Agenda Item</span>
        <span class="sm:hidden">Add Item</span>
      </button>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8"
    >
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff]"></div>
        <span class="ml-2 sm:ml-3 text-xs sm:text-sm text-slate-600">Loading agenda...</span>
      </div>
    </div>

    <!-- Agenda Days -->
    <div v-else-if="groupedAgendaDays.length > 0" class="space-y-6">
      <div
        v-for="day in groupedAgendaDays"
        :key="day.date"
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden"
      >
        <!-- Date Header -->
        <div
          @click="toggleDay(day.date)"
          class="bg-gradient-to-r from-emerald-600/5 to-sky-600/5 p-4 sm:p-6 border-b border-white/20 cursor-pointer hover:from-emerald-600/10 hover:to-sky-600/10 transition-all duration-200"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3 sm:space-x-4">
              <div
                class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white text-sm sm:text-base font-bold"
              >
                {{ new Date(day.date).getDate() }}
              </div>
              <div>
                <h3 class="text-base sm:text-xl font-bold text-slate-900">{{ formatDayHeader(day.date) }}</h3>
                <p class="text-xs sm:text-sm text-slate-600">{{ day.items.length }} agenda items</p>
              </div>
            </div>
            <div class="p-1 sm:p-2">
              <ChevronDown
                class="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 transition-transform duration-200"
                :class="{ 'rotate-180': expandedDays.includes(day.date) }"
              />
            </div>
          </div>
        </div>

        <!-- Agenda Items -->
        <Transition name="slide-down">
          <div v-if="expandedDays.includes(day.date)" class="border-t border-white/20">
            <div class="p-4 sm:p-6 pt-3 sm:pt-4 space-y-2 sm:space-y-3">
              <div ref="sortableContainer" class="space-y-2 sm:space-y-3" :data-date="day.date">
                <AgendaItemCard
                  v-for="item in day.items"
                  :key="item.id"
                  :item="item"
                  :can-edit="canEdit"
                  :draggable="canEdit"
                  @edit="editAgendaItem"
                  @delete="confirmDeleteItem"
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

    <!-- Empty State -->
    <div
      v-else-if="!loading"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
    >
      <Calendar class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">No Agenda Items Yet</h3>
      <p class="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6">Start building your event schedule by adding agenda items.</p>
      <button
        v-if="canEdit"
        @click="showCreateModal = true"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center mx-auto text-sm sm:text-base"
      >
        <Plus class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        Add Your First Agenda Item
      </button>
    </div>

    <!-- Session Types Info -->
    <div
      class="bg-gradient-to-br from-emerald-50 to-sky-50 border border-[#87CEEB]/50 rounded-3xl p-4 sm:p-6"
    >
      <h3 class="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-4 flex items-center">
        <Info class="w-4 h-4 sm:w-5 sm:h-5 text-[#1e90ff] mr-1.5 sm:mr-2" />
        Session Types
      </h3>
      <ul class="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 list-none p-0 m-0">
        <li
          v-for="legend in legendItems"
          :key="legend.type"
          class="legend-entry border rounded-lg sm:rounded-xl p-2 sm:p-3"
          :style="legendCardStyle(legend.color)"
          role="listitem"
        >
          <div class="flex items-center justify-between gap-2 mb-0.5 sm:mb-1">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <span
                class="inline-flex h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full ring-2 ring-white/80"
                :style="{ backgroundColor: legend.color || '#1e90ff' }"
                aria-hidden="true"
              ></span>
              <span class="text-xs sm:text-sm font-semibold text-slate-700">{{ legend.label }}</span>
            </div>
            <span
              v-if="legend.count"
              class="text-[9px] sm:text-[10px] text-slate-500 font-medium whitespace-nowrap"
            >
              {{ legend.count }} {{ legend.count === 1 ? 'item' : 'items' }}
            </span>
          </div>
          <p class="text-[10px] sm:text-xs text-slate-600 leading-snug">
            {{ legend.description }}
          </p>
        </li>
      </ul>
    </div>

    <!-- Create/Edit Modal -->
    <CreateAgendaModal
      v-if="showCreateModal"
      :event-id="eventId"
      @close="showCreateModal = false"
      @created="handleAgendaCreated"
    />

    <EditAgendaModal
      v-if="showEditModal && selectedItem"
      :item="selectedItem"
      :event-id="eventId"
      @close="closeEditModal"
      @updated="handleAgendaUpdated"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="isDeleting"
      title="Delete Agenda Item"
      :item-name="itemToDelete?.title || 'this agenda item'"
      message="This will permanently remove this item from your event agenda."
      @confirm="deleteAgendaItem"
      @cancel="closeDeleteModal"
    />

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-8 right-8 z-50">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-6 py-4 rounded-xl shadow-lg flex items-center"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 mr-2" />
          <AlertCircle v-else class="w-5 h-5 mr-2" />
          {{ message.text }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { Calendar, Plus, ChevronDown, Info, CheckCircle, AlertCircle } from 'lucide-vue-next'
import { agendaService, type EventAgendaItem } from '../services/api'
import AgendaItemCard from './AgendaItemCard.vue'
import CreateAgendaModal from './CreateAgendaModal.vue'
import EditAgendaModal from './EditAgendaModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()

// State
const agendaItems = ref<EventAgendaItem[]>([])
const loading = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const selectedItem = ref<EventAgendaItem | null>(null)
const itemToDelete = ref<EventAgendaItem | null>(null)
const expandedDays = ref<string[]>([])
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const draggedItem = ref<EventAgendaItem | null>(null)

interface LegendItem {
  type: string
  label: string
  description: string
  color: string
  count: number
}

const DEFAULT_LEGEND: LegendItem[] = [
  {
    type: 'keynote',
    label: 'Keynote',
    description: 'Main presentations and headline talks',
    color: '#1e90ff',
    count: 0,
  },
  {
    type: 'workshop',
    label: 'Workshop',
    description: 'Hands-on or interactive learning sessions',
    color: '#8B5CF6',
    count: 0,
  },
  {
    type: 'break',
    label: 'Break',
    description: 'Rest, networking, or informal moments',
    color: '#22c55e',
    count: 0,
  },
  {
    type: 'panel',
    label: 'Panel',
    description: 'Facilitated group discussions or Q&A',
    color: '#f97316',
    count: 0,
  },
]

const normalizeHex = (color: string): string | null => {
  if (!color || !color.startsWith('#')) return null
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
  }
  if (color.length === 7 || color.length === 9) {
    return color.slice(0, 7)
  }
  return null
}

const withAlpha = (color: string, alphaHex = '24'): string => {
  const normalized = normalizeHex(color)
  if (normalized) {
    return `${normalized}${alphaHex}`
  }
  if (color && !color.startsWith('#')) {
    return color
  }
  return `#1e90ff${alphaHex}`
}

// Computed
const groupedAgendaDays = computed(() => {
  const grouped: { date: string; items: EventAgendaItem[] }[] = []
  const dateMap = new Map<string, EventAgendaItem[]>()

  agendaItems.value.forEach((item) => {
    const date = item.date || 'no-date' // Handle null dates
    if (!dateMap.has(date)) {
      dateMap.set(date, [])
    }
    dateMap.get(date)!.push(item)
  })

  // Sort dates and create grouped array
  Array.from(dateMap.entries())
    .sort((a, b) => {
      if (a[0] === 'no-date') return 1
      if (b[0] === 'no-date') return -1
      return new Date(a[0]).getTime() - new Date(b[0]).getTime()
    })
    .forEach(([date, items]) => {
      grouped.push({
        date,
        items: items.sort((a, b) => a.order - b.order), // Use order field instead
      })
    })

  // Auto-expand first day
  if (grouped.length > 0 && expandedDays.value.length === 0) {
    // This will be handled in onMounted instead
  }

  return grouped
})

const legendItems = computed<LegendItem[]>(() => {
  const byType = new Map<string, LegendItem>()

  agendaItems.value.forEach((item) => {
    if (!item) return
    const typeKey = (item.agenda_type || 'other').toLowerCase()
    const base =
      DEFAULT_LEGEND.find((entry) => entry.type === typeKey) ||
      {
        type: typeKey,
        label: item.agenda_type || 'Other',
        description: 'Additional sessions',
        color: '#64748b',
        count: 0,
      }
    const color = item.color?.trim() || base.color

    if (!byType.has(typeKey)) {
      byType.set(typeKey, { ...base, color, count: 1 })
    } else {
      const current = byType.get(typeKey)!
      current.count += 1
      if (!current.color && color) {
        current.color = color
      }
    }
  })

  if (byType.size === 0) {
    return DEFAULT_LEGEND.map((entry) => ({ ...entry }))
  }

  const ordered: LegendItem[] = []

  DEFAULT_LEGEND.forEach((entry) => {
    if (byType.has(entry.type)) {
      const value = byType.get(entry.type)!
      ordered.push({ ...entry, color: value.color, count: value.count })
      byType.delete(entry.type)
    }
  })

  byType.forEach((value) => ordered.push({ ...value }))

  return ordered
})

const legendCardStyle = (color: string) => {
  const fallback = color?.trim() || '#1e90ff'
  return {
    borderColor: withAlpha(fallback, '33'),
    background: `linear-gradient(135deg, ${withAlpha(fallback, '12')} 0%, ${withAlpha(fallback, '05')} 100%)`,
  }
}

// Methods
const loadAgenda = async () => {
  loading.value = true
  try {
    const response = await agendaService.getAgendaItems(props.eventId)
    if (response.success && response.data) {
      agendaItems.value = response.data.results || []
    } else {
      showMessage('error', response.message || 'Failed to load agenda')
    }
  } catch (error) {
    console.error('Error loading agenda:', error)
    showMessage('error', 'An error occurred while loading the agenda')
  } finally {
    loading.value = false
  }
}

const toggleDay = (date: string) => {
  const index = expandedDays.value.indexOf(date)
  if (index > -1) {
    expandedDays.value.splice(index, 1)
  } else {
    expandedDays.value.push(date)
  }
}

const formatDayHeader = (date: string): string => {
  if (date === 'no-date') {
    return 'Unscheduled Items'
  }
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const editAgendaItem = (item: EventAgendaItem) => {
  selectedItem.value = item
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedItem.value = null
}

const confirmDeleteItem = (item: EventAgendaItem) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  itemToDelete.value = null
}

const deleteAgendaItem = async () => {
  if (!itemToDelete.value) return

  isDeleting.value = true
  try {
    const response = await agendaService.deleteAgendaItem(props.eventId, itemToDelete.value.id)
    if (response.success) {
      showMessage('success', 'Agenda item deleted successfully')
      agendaItems.value = agendaItems.value.filter((item) => item.id !== itemToDelete.value!.id)
      closeDeleteModal()
    } else {
      showMessage('error', response.message || 'Failed to delete agenda item')
    }
  } catch (error) {
    console.error('Error deleting agenda item:', error)
    showMessage('error', 'An error occurred while deleting the agenda item')
  } finally {
    isDeleting.value = false
  }
}

const handleAgendaCreated = (newItem: EventAgendaItem) => {
  agendaItems.value.push(newItem)
  showMessage('success', 'Agenda item added successfully')
  showCreateModal.value = false
}

const handleAgendaUpdated = (updatedItem: EventAgendaItem) => {
  const index = agendaItems.value.findIndex((item) => item.id === updatedItem.id)
  if (index !== -1) {
    agendaItems.value[index] = updatedItem
  }
  showMessage('success', 'Agenda item updated successfully')
  closeEditModal()
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Drag and drop handlers
const handleDragStart = (item: EventAgendaItem) => {
  draggedItem.value = item
}

const handleDragEnd = async (targetItem: EventAgendaItem | null) => {
  if (!draggedItem.value || !targetItem || draggedItem.value.id === targetItem.id) {
    draggedItem.value = null
    return
  }

  // Ensure agendaItems.value is an array
  if (!Array.isArray(agendaItems.value)) {
    draggedItem.value = null
    return
  }

  // Check if items are in the same date group (only allow reordering within same date)
  if (draggedItem.value.date !== targetItem.date) {
    draggedItem.value = null
    return
  }

  // Find both items in the current array
  const draggedIndex = agendaItems.value.findIndex((item) => item.id === draggedItem.value!.id)
  const targetIndex = agendaItems.value.findIndex((item) => item.id === targetItem.id)

  if (draggedIndex === -1 || targetIndex === -1) {
    draggedItem.value = null
    return
  }

  // Create new array with reordered items
  const newItems = [...agendaItems.value]
  const [draggedItemData] = newItems.splice(draggedIndex, 1)
  newItems.splice(targetIndex, 0, draggedItemData)

  // Update the order values for all items (and update the actual items' order property)
  newItems.forEach((item, index) => {
    item.order = index
  })

  const updates = newItems.map((item, index) => ({
    id: item.id,
    order: index,
  }))

  // Optimistic update - force reactivity by creating new array reference
  agendaItems.value = [...newItems]

  // Force Vue to update the computed property
  await nextTick()

  try {
    const response = await agendaService.bulkReorderAgendaItems(props.eventId, { updates })
    if (!response.success) {
      // Rollback on failure
      await loadAgenda()
      showMessage('error', response.message || 'Failed to reorder agenda items')
    } else {
      showMessage('success', 'Agenda items reordered successfully')
      // Force a refresh from server to ensure UI is in sync
      setTimeout(async () => {
        await loadAgenda()
      }, 100)
    }
  } catch (err) {
    // Rollback on failure
    await loadAgenda()
    showMessage('error', 'Failed to reorder agenda items')
  } finally {
    draggedItem.value = null
  }
}

// Lifecycle
onMounted(() => {
  loadAgenda().then(() => {
    // Auto-expand first day after loading
    if (groupedAgendaDays.value.length > 0 && expandedDays.value.length === 0) {
      expandedDays.value.push(groupedAgendaDays.value[0].date)
    }
  })
})

// Expose method for parent component (Smart FAB)
defineExpose({
  openAddModal: () => {
    showCreateModal.value = true
  }
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

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

.agenda-item {
  transition: transform 0.2s ease;
}

.agenda-item.dragging {
  transform: rotate(2deg) scale(1.02);
  z-index: 10;
}

.legend-entry {
  backdrop-filter: blur(8px);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.legend-entry:hover,
.legend-entry:focus-within {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px -18px rgba(30, 144, 255, 0.28);
}

/* Collapse transition */
.collapse-enter-active,
.collapse-leave-active {
  transition: height 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  height: 0;
}
</style>
