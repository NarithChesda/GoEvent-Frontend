<template>
  <div class="space-y-6">
    <!-- Header with Create Button -->
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Event Agenda</h3>
        <p class="text-lg text-slate-600 mt-1 leading-relaxed">
          Manage your event schedule and agenda items
        </p>
      </div>
      <button
        v-if="canEdit"
        @click="showCreateModal = true"
        class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center space-x-2"
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
          @click="showCreateModal = true"
          class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center space-x-2 mx-auto"
        >
          <Plus class="w-4 h-4" />
          <span>Add First Item</span>
        </button>
      </div>
    </div>

    <!-- Agenda Items -->
    <div v-else class="space-y-4">
      <!-- Grouped by Date Cards -->
      <div v-for="(group, date) in groupedAgendaItems" :key="date">
        <!-- Date Card -->
        <div
          class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden"
        >
          <!-- Date Header (Clickable) -->
          <div
            @click="toggleDateExpanded(date)"
            class="cursor-pointer p-6 hover:bg-gradient-to-r hover:from-blue-50/40 hover:to-purple-50/40 transition-all duration-300"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <!-- Date Icon -->
                <div
                  class="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center"
                >
                  <Calendar class="w-6 h-6 text-blue-600" />
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

              <!-- Expand/Collapse Icon -->
              <div class="flex items-center space-x-2">
                <div
                  class="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center transition-transform duration-300"
                  :class="{ 'rotate-180': expandedDates.has(date) }"
                >
                  <ChevronDown class="w-4 h-4 text-blue-600" />
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
            <div v-if="expandedDates.has(date)" class="border-t border-white/20">
              <div class="p-6 pt-4 space-y-3">
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

    <!-- Create Modal -->
    <CreateAgendaModal
      v-if="showCreateModal"
      :event-id="eventId"
      @close="showCreateModal = false"
      @created="handleAgendaItemCreated"
    />

    <!-- Edit Modal -->
    <EditAgendaModal
      v-if="showEditModal && selectedItem"
      :event-id="eventId"
      :item="selectedItem"
      @close="showEditModal = false"
      @updated="handleAgendaItemUpdated"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="deleting"
      title="Delete Agenda Item"
      :item-name="itemToDelete?.title"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { Plus, Calendar, AlertCircle, ChevronDown } from 'lucide-vue-next'
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
const error = ref<string | null>(null)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedItem = ref<EventAgendaItem | null>(null)
const itemToDelete = ref<EventAgendaItem | null>(null)
const deleting = ref(false)

// Drag and drop state
const draggedItem = ref<EventAgendaItem | null>(null)

// Expanded dates state
const expandedDates = ref<Set<string>>(new Set())

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

  // Ensure agendaItems.value is an array before using forEach
  if (!Array.isArray(agendaItems.value)) {
    return groups
  }

  agendaItems.value.forEach((item) => {
    const date = item.date || 'unscheduled'
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
        // Fallback for direct array response
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
  showEditModal.value = true
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
      // Ensure agendaItems.value is an array before filtering
      if (Array.isArray(agendaItems.value)) {
        agendaItems.value = agendaItems.value.filter((item) => item.id !== itemToDelete.value!.id)
      } else {
        agendaItems.value = []
      }
      showDeleteModal.value = false
      itemToDelete.value = null
    } else {
      error.value = response.message || 'Failed to delete agenda item'
    }
  } catch (err) {
    error.value = 'Network error while deleting agenda item'
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
  showCreateModal.value = false
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
  showEditModal.value = false
  selectedItem.value = null
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
      await fetchAgendaItems()
      error.value = response.message || 'Failed to reorder agenda items'
    } else {
      // Force a refresh from server to ensure UI is in sync
      setTimeout(async () => {
        await fetchAgendaItems()
      }, 100)
    }
  } catch {
    // Rollback on failure
    await fetchAgendaItems()
    error.value = 'Network error while reordering agenda items'
  } finally {
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

// Transition handlers for smooth collapse/expand
const onEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = '0'
  element.style.overflow = 'hidden'
}

const onAfterEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = 'auto'
  element.style.overflow = 'visible'
}

const onLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = element.scrollHeight + 'px'
  element.style.overflow = 'hidden'
  // Force reflow
  element.offsetHeight
  element.style.height = '0'
}

const onAfterLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = 'auto'
  element.style.overflow = 'visible'
}

// Lifecycle
onMounted(async () => {
  await fetchAgendaItems()
  // Auto-expand first date group if items exist
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
