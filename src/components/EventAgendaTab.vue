<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Event Agenda</h2>
        <p class="text-sm text-slate-600 mt-1">Manage your event schedule and agenda items</p>
      </div>
      <button
        v-if="canEdit"
        @click="showCreateModal = true"
        class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 flex items-center"
      >
        <Plus class="w-4 h-4 mr-2" />
        Add Agenda Item
      </button>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8"
    >
      <div class="flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-slate-600">Loading agenda...</span>
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
          class="bg-gradient-to-r from-blue-600/5 to-purple-600/5 p-6 border-b border-white/20 cursor-pointer hover:from-blue-600/10 hover:to-purple-600/10 transition-all duration-200"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div
                class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold"
              >
                {{ new Date(day.date).getDate() }}
              </div>
              <div>
                <h3 class="text-xl font-bold text-slate-900">{{ formatDayHeader(day.date) }}</h3>
                <p class="text-sm text-slate-600">{{ day.items.length }} agenda items</p>
              </div>
            </div>
            <div class="p-2">
              <ChevronDown
                class="w-5 h-5 text-slate-600 transition-transform duration-200"
                :class="{ 'rotate-180': expandedDays.includes(day.date) }"
              />
            </div>
          </div>
        </div>

        <!-- Agenda Items -->
        <Transition name="slide-down">
          <div v-if="expandedDays.includes(day.date)" class="border-t border-white/20">
            <div class="p-6 pt-4 space-y-3">
              <div ref="sortableContainer" class="space-y-3" :data-date="day.date">
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
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-12 text-center"
    >
      <Calendar class="w-16 h-16 text-slate-300 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-slate-900 mb-2">No Agenda Items Yet</h3>
      <p class="text-slate-600 mb-6">Start building your event schedule by adding agenda items.</p>
      <button
        v-if="canEdit"
        @click="showCreateModal = true"
        class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 flex items-center mx-auto"
      >
        <Plus class="w-4 h-4 mr-2" />
        Add Your First Agenda Item
      </button>
    </div>

    <!-- Session Types Info -->
    <div
      class="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200/50 rounded-3xl p-6"
    >
      <h3 class="text-lg font-bold text-slate-900 mb-4 flex items-center">
        <Info class="w-5 h-5 text-blue-600 mr-2" />
        Session Types
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-white/70 rounded-xl p-3">
          <div class="flex items-center mb-1">
            <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span class="text-sm font-semibold text-slate-700">Keynote</span>
          </div>
          <p class="text-xs text-slate-600">Main presentations</p>
        </div>
        <div class="bg-white/70 rounded-xl p-3">
          <div class="flex items-center mb-1">
            <div class="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span class="text-sm font-semibold text-slate-700">Workshop</span>
          </div>
          <p class="text-xs text-slate-600">Interactive sessions</p>
        </div>
        <div class="bg-white/70 rounded-xl p-3">
          <div class="flex items-center mb-1">
            <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span class="text-sm font-semibold text-slate-700">Break</span>
          </div>
          <p class="text-xs text-slate-600">Rest & networking</p>
        </div>
        <div class="bg-white/70 rounded-xl p-3">
          <div class="flex items-center mb-1">
            <div class="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span class="text-sm font-semibold text-slate-700">Panel</span>
          </div>
          <p class="text-xs text-slate-600">Group discussions</p>
        </div>
      </div>
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

const getSessionTypeColor = (type: string): string => {
  switch (type?.toLowerCase()) {
    case 'keynote':
      return 'bg-blue-100 text-blue-700'
    case 'workshop':
      return 'bg-purple-100 text-purple-700'
    case 'break':
    case 'networking':
      return 'bg-green-100 text-green-700'
    case 'panel':
      return 'bg-orange-100 text-orange-700'
    case 'session':
      return 'bg-indigo-100 text-indigo-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
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
