<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="labelId"
        :aria-describedby="descriptionId"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="handleCancel"
        ></div>

        <!-- Modal Content -->
        <div
          ref="modalContent"
          class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5"
          @keydown.esc="handleCancel"
        >
          <!-- Header -->
          <div class="flex items-center justify-between">
            <h3 :id="labelId" class="text-lg font-bold text-slate-900">
              Change Date for All Items
            </h3>
            <button
              @click="handleCancel"
              class="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
              :disabled="loading"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Description -->
          <p :id="descriptionId" class="text-sm text-slate-600">
            This will move {{ itemCount }} agenda item{{ itemCount === 1 ? '' : 's' }}
            from <strong>{{ currentDateDisplay }}</strong> to the new date.
          </p>

          <!-- Date Input -->
          <div class="space-y-2">
            <label :for="inputId" class="block text-sm font-medium text-slate-700">
              New Date
            </label>
            <input
              :id="inputId"
              ref="dateInput"
              :value="modelValue"
              @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
              type="date"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e90ff]/20 focus:border-[#1e90ff] transition-colors"
              :disabled="loading"
            />
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button
              @click="handleCancel"
              :disabled="loading"
              class="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              @click="handleConfirm"
              :disabled="!modelValue || loading"
              class="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white rounded-xl font-medium hover:from-[#27ae60] hover:to-[#1873cc] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <div
                v-if="loading"
                class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              ></div>
              {{ loading ? 'Updating...' : 'Update Date' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, useId } from 'vue'
import { X } from 'lucide-vue-next'

interface Props {
  show: boolean
  modelValue: string
  currentDateDisplay: string
  itemCount: number
  loading?: boolean
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'update:modelValue', value: string): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<Emits>()

// Generate unique IDs for accessibility
const baseId = useId()
const labelId = computed(() => `${baseId}-label`)
const descriptionId = computed(() => `${baseId}-description`)
const inputId = computed(() => `${baseId}-date-input`)

// Refs
const modalContent = ref<HTMLElement | null>(null)
const dateInput = ref<HTMLInputElement | null>(null)

// Focus management
watch(
  () => props.show,
  async (isShow) => {
    if (isShow) {
      await nextTick()
      dateInput.value?.focus()
    }
  }
)

// Methods
const handleConfirm = () => {
  if (!props.loading && props.modelValue) {
    emit('confirm')
  }
}

const handleCancel = () => {
  if (!props.loading) {
    emit('cancel')
    emit('update:show', false)
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
