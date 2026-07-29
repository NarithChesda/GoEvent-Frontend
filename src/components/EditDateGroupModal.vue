<template>
  <Teleport to="body">
    <Transition name="modal">
      <!-- Same shell as every other modal in the agenda/preview family
           (EditEventDateModal, GmapEmbedModal, YoutubeEmbedModal,
           DeleteConfirmModal): z-[1000] per DESIGN.md §5.4 — the mobile preview
           sheet is a fixed z-900 overlay teleported to this same body, so a
           lower rung would open underneath it — plus `overflow-y-auto` over a
           `min-h-full` centering flex, which centers the card on tall screens
           but lets it scroll instead of clipping on short ones (landscape
           phones, split-screen). -->
      <div
        v-if="show"
        class="fixed inset-0 z-[1000] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="labelId"
        :aria-describedby="descriptionId"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="handleCancel"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <!-- Modal Content -->
          <div
            ref="modalContent"
            class="relative bg-white rounded-3xl shadow-2xl p-4 sm:p-6 w-full max-w-md"
            @click.stop
            @keydown.esc="handleCancel"
          >
            <!-- Header: title + description share the left column so the close
                 button stays top-right at every width. -->
            <div class="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 :id="labelId" class="text-base font-semibold text-slate-900">
                  Change Date for All Items
                </h3>
                <p :id="descriptionId" class="text-xs sm:text-sm text-slate-500 mt-1">
                  This will move {{ itemCount }} agenda item{{ itemCount === 1 ? '' : 's' }}
                  from
                  <strong class="font-semibold text-slate-700">{{ currentDateDisplay }}</strong>
                  to the new date.
                </p>
              </div>
              <button
                type="button"
                class="flex-shrink-0 p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
                aria-label="Close modal"
                :disabled="loading"
                @click="handleCancel"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Date Input. No visible label — the description above already
                 names it, matching EditEventDateModal's single-field layout. -->
            <input
              ref="dateInput"
              :value="modelValue"
              type="date"
              aria-label="New date"
              class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white disabled:opacity-50"
              :disabled="loading"
              @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
            />

            <!-- Actions: primary first and flex-1, secondary auto-width -->
            <div class="flex items-center gap-2 sm:gap-3 mt-5">
              <button
                type="button"
                class="flex-1 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                :disabled="!modelValue || loading"
                @click="handleConfirm"
              >
                <div
                  v-if="loading"
                  class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                ></div>
                <span>{{ loading ? 'Updating...' : 'Update Date' }}</span>
              </button>
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200 disabled:opacity-50"
                :disabled="loading"
                @click="handleCancel"
              >
                Cancel
              </button>
            </div>
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

/* Card path is root > centering flex > card — same selectors the sibling
   preview modals use, so the two animate identically. */
.modal-enter-active > div:last-child > div,
.modal-leave-active > div:last-child > div {
  transition: transform 0.3s ease;
}

.modal-enter-from > div:last-child > div,
.modal-leave-to > div:last-child > div {
  transform: scale(0.95);
}
</style>
