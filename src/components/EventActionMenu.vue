<template>
  <div class="relative">
    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute right-0 w-56 bg-white border border-slate-300 rounded-xl shadow-xl overflow-hidden z-50"
        style="bottom: calc(100% + 4.5rem)"
      >
        <!-- Menu Items -->
        <div class="py-1">
          <!-- Edit Event Button -->
          <button
            @click="handleEdit"
            class="flex items-center space-x-3 px-4 py-3 mx-1 rounded-lg text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff] transition-all duration-200 w-[calc(100%-0.5rem)] text-left"
          >
            <Pencil class="w-5 h-5" />
            <span class="font-medium">Edit Event</span>
          </button>

          <!-- Delete Event Button - Only for organizers -->
          <div v-if="canDelete" class="border-t border-slate-200 my-1"></div>
          <button
            v-if="canDelete"
            @click="handleDelete"
            :disabled="isDeleting"
            class="flex items-center space-x-3 px-4 py-3 mx-1 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 w-[calc(100%-0.5rem)] text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 v-if="!isDeleting" class="w-5 h-5" />
            <Loader2 v-else class="w-5 h-5 animate-spin" />
            <span class="font-medium">{{ isDeleting ? 'Deleting...' : 'Delete Event' }}</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteConfirm"
      :loading="isDeleting"
      title="Delete Event"
      :item-name="eventTitle"
      message="This will permanently delete this event and all associated data including guests, media, and agenda items."
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Pencil, Trash2, Loader2 } from 'lucide-vue-next'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

interface Props {
  isOpen: boolean
  canDelete: boolean
  eventTitle: string
  eventId: string
}

interface Emits {
  (e: 'close'): void
  (e: 'edit', eventId: string): void
  (e: 'delete', eventId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showDeleteConfirm = ref(false)
const isDeleting = ref(false)

const handleEdit = () => {
  emit('edit', props.eventId)
  emit('close')
}

const handleDelete = () => {
  showDeleteConfirm.value = true
  emit('close') // Close the dropdown when showing confirmation
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
}

const confirmDelete = async () => {
  isDeleting.value = true
  emit('delete', props.eventId)
  // Note: The parent component should handle the actual deletion
  // and close the menu when done
}

// Expose method to reset deleting state
defineExpose({
  resetDeleting: () => {
    isDeleting.value = false
    showDeleteConfirm.value = false
  },
})
</script>

<style scoped>
/* Dropdown transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}
</style>
