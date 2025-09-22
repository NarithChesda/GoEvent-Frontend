<template>
  <div class="relative">
    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute right-0 w-56 bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl shadow-[#B0E0E6]/50 py-2 z-50"
        style="bottom: calc(100% + 4.5rem)"
      >
        <!-- Menu Items -->
        <div class="py-1">
          <!-- Edit Event Button -->
          <button
            @click="handleEdit"
            class="flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-[#E6F4FF] hover:text-[#1e90ff] transition-all duration-200 w-full text-left"
          >
            <Pencil class="w-5 h-5" />
            <span class="font-medium">Edit Event</span>
          </button>

          <!-- Delete Event Button - Only for organizers -->
          <div v-if="canDelete" class="border-t border-[#B0E0E6]/50 my-1"></div>
          <button
            v-if="canDelete"
            @click="handleDelete"
            :disabled="isDeleting"
            class="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 v-if="!isDeleting" class="w-5 h-5" />
            <Loader2 v-else class="w-5 h-5 animate-spin" />
            <span class="font-medium">{{ isDeleting ? 'Deleting...' : 'Delete Event' }}</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Delete Confirmation Modal -->
    <Transition name="modal">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-4"
        @click.self="cancelDelete"
      >
        <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
          <!-- Warning Icon -->
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle class="w-8 h-8 text-red-600" />
            </div>
          </div>

          <!-- Content -->
          <div class="text-center mb-6">
            <h3 class="text-xl font-bold text-slate-900 mb-3">Delete Event?</h3>
            <p class="text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong>"{{ eventTitle }}"</strong>? This action
              cannot be undone and all event data will be permanently removed.
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button
              @click="cancelDelete"
              class="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              @click="confirmDelete"
              :disabled="isDeleting"
              class="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Loader2 v-if="isDeleting" class="w-4 h-4 animate-spin mr-2" />
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Pencil, Trash2, AlertTriangle, Loader2 } from 'lucide-vue-next'

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

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
