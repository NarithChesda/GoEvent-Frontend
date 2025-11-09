<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 overflow-y-auto"
        :class="zIndexClass"
        @click.self="handleBackdropClick"
      >
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm pointer-events-none"></div>

        <div class="flex min-h-full items-center justify-center p-4" @click.self="handleBackdropClick">
          <div
            :ref="setModalRef"
            role="dialog"
            :aria-labelledby="ariaLabelId"
            aria-modal="true"
            class="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-full flex items-center justify-center"
                    :class="iconBgClass"
                  >
                    <component :is="icon" :class="iconSizeClass" />
                  </div>
                  <h2 :id="ariaLabelId" class="text-lg sm:text-xl font-semibold text-slate-900">
                    {{ title }}
                  </h2>
                </div>
                <button
                  @click="$emit('close')"
                  aria-label="Close dialog"
                  class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Form Content -->
            <form
              v-if="!noForm"
              @submit.prevent="$emit('submit')"
              class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto"
            >
              <!-- Error Message -->
              <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p class="text-sm text-red-600">{{ error }}</p>
              </div>

              <!-- Main Content Slot -->
              <slot />

              <!-- Action Buttons -->
              <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                  :disabled="submitting"
                >
                  {{ cancelText }}
                </button>
                <button
                  type="submit"
                  class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  :disabled="submitting"
                >
                  <span
                    v-if="submitting"
                    class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  {{ submitting ? submitTextLoading : submitText }}
                </button>
              </div>
            </form>

            <!-- Content without form (for custom layouts) -->
            <div v-else class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <!-- Error Message -->
              <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p class="text-sm text-red-600">{{ error }}</p>
              </div>

              <!-- Main Content Slot -->
              <slot />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import type { Component } from 'vue'

interface Props {
  /** Whether the modal is visible */
  show: boolean
  /** Modal title */
  title: string
  /** Icon component to display in header */
  icon: Component
  /** Background and text color classes for icon container */
  iconBgClass?: string
  /** Icon size classes */
  iconSizeClass?: string
  /** ARIA label ID for accessibility */
  ariaLabelId?: string
  /** Error message to display */
  error?: string | null
  /** Whether form is submitting */
  submitting?: boolean
  /** Cancel button text */
  cancelText?: string
  /** Submit button text */
  submitText?: string
  /** Submit button text when loading */
  submitTextLoading?: string
  /** Z-index class (for nested modals) */
  zIndexClass?: string
  /** Don't render form wrapper (for custom layouts) */
  noForm?: boolean
}

withDefaults(defineProps<Props>(), {
  iconBgClass: 'bg-emerald-50 text-emerald-600',
  iconSizeClass: 'w-4.5 h-4.5',
  ariaLabelId: 'modal-title',
  error: null,
  submitting: false,
  cancelText: 'Cancel',
  submitText: 'Save',
  submitTextLoading: 'Saving...',
  zIndexClass: 'z-modal',
  noForm: false,
})

const emit = defineEmits<{
  close: []
  submit: []
}>()

/**
 * Handle backdrop click to close modal
 */
const handleBackdropClick = () => {
  emit('close')
}

/**
 * Set modal ref for focus trap
 */
const setModalRef = (el: any) => {
  // This allows parent to access the modal element via template ref
  return el
}

// Expose the modal ref setter for parent components
defineExpose({
  setModalRef,
})
</script>

<style scoped>
/* Modal transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
  opacity: 0;
}
</style>
