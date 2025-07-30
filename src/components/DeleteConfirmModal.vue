<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto" @click="handleCancel">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
        
        <div class="flex min-h-full items-center justify-center p-4">
          <div 
            class="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md transform transition-all"
            @click.stop
          >
            <div class="text-center">
              <!-- Icon -->
              <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 class="w-8 h-8 text-red-600" />
              </div>

              <!-- Title -->
              <h3 class="text-xl font-bold text-slate-900 mb-2">
                {{ title }}
              </h3>
              
              <!-- Message -->
              <p class="text-slate-600 mb-6">
                <span v-if="itemName">
                  Are you sure you want to delete "<strong>{{ itemName }}</strong>"?
                </span>
                <span v-else>
                  {{ message }}
                </span>
                <br>
                <span class="text-sm">This action cannot be undone.</span>
              </p>

              <!-- Actions -->
              <div class="flex space-x-3">
                <button
                  @click="handleCancel"
                  :disabled="loading"
                  class="flex-1 px-6 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  @click="handleConfirm"
                  :disabled="loading"
                  class="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <div v-if="loading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{{ loading ? 'Deleting...' : 'Delete' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'

interface Props {
  show: boolean
  title?: string
  message?: string
  itemName?: string
  loading?: boolean
}

interface Emits {
  confirm: []
  cancel: []
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Delete Item',
  message: 'Are you sure you want to delete this item?',
  loading: false
})

const emit = defineEmits<Emits>()

// Methods
const handleConfirm = () => {
  if (!props.loading) {
    emit('confirm')
  }
}

const handleCancel = () => {
  if (!props.loading) {
    emit('cancel')
  }
}
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

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.3s ease;
}

.modal-enter-from .relative {
  transform: scale(0.95);
}

.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>