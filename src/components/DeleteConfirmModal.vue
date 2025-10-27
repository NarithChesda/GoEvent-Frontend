<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-white rounded-3xl shadow-2xl p-4 sm:p-6 w-full max-w-md transform transition-all"
            @click.stop
          >
            <div class="text-center">
              <!-- Icon -->
              <div
                class="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4"
              >
                <Trash2 class="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              </div>

              <!-- Title -->
              <h3 class="text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2">
                {{ title }}
              </h3>

              <!-- Message -->
              <p class="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">
                <span v-if="itemName">
                  Are you sure you want to delete "<strong>{{ itemName }}</strong
                  >"?
                </span>
                <span v-else>
                  {{ message }}
                </span>
                <br />
                <span v-if="warningMessage" class="text-xs sm:text-sm text-red-600 font-semibold block mt-2">
                  ⚠️ {{ warningMessage }}
                </span>
                <span class="text-xs sm:text-sm">This action cannot be undone.</span>
              </p>

              <!-- Actions -->
              <div class="flex gap-2 sm:gap-3">
                <button
                  @click="handleCancel"
                  :disabled="loading"
                  class="flex-1 px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg sm:rounded-xl font-medium transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  @click="handleConfirm"
                  :disabled="loading"
                  class="flex-1 px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg sm:rounded-xl font-medium transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-1.5 sm:space-x-2"
                >
                  <div
                    v-if="loading"
                    class="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  ></div>
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
  warningMessage?: string
  loading?: boolean
}

interface Emits {
  confirm: []
  cancel: []
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Delete Item',
  message: 'Are you sure you want to delete this item?',
  loading: false,
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
