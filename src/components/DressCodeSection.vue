<template>
  <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h5 class="font-semibold text-slate-900">Dress Code Guidelines</h5>
          <p class="text-sm text-slate-600">Manage dress code requirements for your event</p>
        </div>
        <button
          v-if="canEdit"
          @click="openAddModal"
          class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          <Plus class="w-4 h-4" />
          Add Dress Code
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
    >
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="bg-slate-200 h-2 rounded-t-2xl"></div>
        <div class="bg-slate-100 rounded-b-2xl p-4">
          <div class="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
          <div class="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
          <div class="h-3 bg-slate-200 rounded w-2/3"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <div class="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md mx-auto">
        <AlertCircle class="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mx-auto mb-1.5 sm:mb-2" />
        <p class="text-base sm:text-lg text-red-600 font-semibold leading-relaxed">{{ error }}</p>
        <button
          @click="fetchDressCodes"
          class="mt-3 sm:mt-4 bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl hover:bg-red-700 transition-colors duration-200 text-sm sm:text-base"
        >
          Try Again
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="dressCodes.length === 0"
      @click="canEdit ? openAddModal() : null"
      :class="[
        'border-2 border-dashed rounded-2xl p-8 transition-all duration-300 text-center',
        canEdit
          ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group'
          : 'border-slate-300 bg-slate-50'
      ]"
    >
      <div class="flex flex-col items-center justify-center min-h-[120px]">
        <div :class="[
          'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300',
          canEdit ? 'bg-slate-200 group-hover:bg-emerald-100' : 'bg-slate-200'
        ]">
          <Shirt :class="[
            'w-8 h-8 transition-colors',
            canEdit ? 'text-slate-400 group-hover:text-emerald-600' : 'text-slate-400'
          ]" />
        </div>
        <p :class="[
          'font-semibold transition-colors',
          canEdit ? 'text-slate-600 group-hover:text-slate-900' : 'text-slate-600'
        ]">No dress codes added</p>
        <p class="text-sm text-slate-500 mt-1">Add dress code guidelines to help guests prepare for your event</p>
        <p v-if="canEdit" class="text-xs text-slate-400 mt-1">Click to add a dress code</p>
      </div>
    </div>

    <!-- Dress Codes Grid -->
    <div v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <DressCodeCard
          v-for="dressCode in sortedDressCodes"
          :key="dressCode.id"
          :dress-code="dressCode"
          :can-edit="canEdit"
          :draggable="canEdit"
          @edit="openEditModal"
          @delete="openDeleteModal"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
          class="dress-code-item"
        />
      </div>
    </div>

    <!-- Modals -->
    <DressCodeModal
      :show="showModal"
      :event-id="eventId"
      :dress-code="selectedDressCode"
      @close="closeModal"
      @success="handleDressCodeSaved"
    />

    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="deleting"
      title="Delete Dress Code"
      :item-name="dressCodeToDelete?.title || dressCodeToDelete?.dress_code_type_display || 'this dress code'"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
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
import { ref, onMounted, computed } from 'vue'
import { Plus, Shirt, AlertCircle, CheckCircle } from 'lucide-vue-next'
import { dressCodeService, type EventDressCode } from '../services/api'
import DressCodeCard from './DressCodeCard.vue'
import DressCodeModal from './DressCodeModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()

// State
const dressCodes = ref<EventDressCode[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showModal = ref(false)
const showDeleteModal = ref(false)
const selectedDressCode = ref<EventDressCode | null>(null)
const dressCodeToDelete = ref<EventDressCode | null>(null)
const deleting = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

// Drag and drop state
const draggedDressCode = ref<EventDressCode | null>(null)

// Computed
const sortedDressCodes = computed(() => {
  return [...dressCodes.value].sort((a, b) => a.order - b.order)
})

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
      error.value = response.message || 'Failed to load dress codes'
      dressCodes.value = []
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Network error while loading dress codes'
    error.value = errorMessage
    dressCodes.value = []
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  selectedDressCode.value = null
  showModal.value = true
}

const openEditModal = (dressCode: EventDressCode) => {
  selectedDressCode.value = dressCode
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedDressCode.value = null
}

const handleDressCodeSaved = async () => {
  // Refresh the list
  await fetchDressCodes()

  showMessage('success', selectedDressCode.value ? 'Dress code updated successfully' : 'Dress code added successfully')
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
      showMessage('success', 'Dress code deleted successfully')
    } else {
      showMessage('error', response.message || 'Failed to delete dress code')
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Network error while deleting dress code'
    showMessage('error', errorMessage)
  } finally {
    deleting.value = false
  }
}

// Drag and drop handlers
const handleDragStart = (dressCode: EventDressCode) => {
  draggedDressCode.value = dressCode
}

const handleDragEnd = async (targetDressCode: EventDressCode | null) => {
  if (
    !draggedDressCode.value ||
    !targetDressCode ||
    draggedDressCode.value.id === targetDressCode.id
  ) {
    draggedDressCode.value = null
    return
  }

  // Find both items in the current array
  const draggedIndex = dressCodes.value.findIndex((dc) => dc.id === draggedDressCode.value!.id)
  const targetIndex = dressCodes.value.findIndex((dc) => dc.id === targetDressCode.id)

  if (draggedIndex === -1 || targetIndex === -1) {
    draggedDressCode.value = null
    return
  }

  // Create new array with reordered items
  const newDressCodes = [...dressCodes.value]
  const [draggedItem] = newDressCodes.splice(draggedIndex, 1)
  newDressCodes.splice(targetIndex, 0, draggedItem)

  // Update the order values
  newDressCodes.forEach((item, index) => {
    item.order = index
  })

  const updates = newDressCodes.map((item, index) => ({
    id: item.id,
    order: index,
  }))

  // Optimistic update
  dressCodes.value = [...newDressCodes]

  try {
    const response = await dressCodeService.bulkReorderDressCodes(props.eventId, { updates })

    if (!response.success) {
      // Rollback on failure
      await fetchDressCodes()
      showMessage('error', response.message || 'Failed to reorder dress codes')
    }
  } catch (err) {
    // Rollback on failure
    await fetchDressCodes()
    const errorMessage = err instanceof Error ? err.message : 'Network error while reordering dress codes'
    showMessage('error', errorMessage)
  } finally {
    draggedDressCode.value = null
  }
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Lifecycle
onMounted(() => {
  fetchDressCodes()
})

// Expose method for parent component
defineExpose({
  openAddModal,
})
</script>

<style scoped>
.dress-code-item {
  transition: transform 0.2s ease;
}

.dress-code-item:hover {
  transform: translateY(-2px);
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
</style>
