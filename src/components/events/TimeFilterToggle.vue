<template>
  <!-- Desktop Segmented Control -->
  <div class="hidden sm:flex items-center glass-toggle rounded-full p-1">
    <button
      v-for="option in options"
      :key="option.value"
      @click="$emit('update:modelValue', option.value)"
      :class="[
        'px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-full transition-all duration-300',
        modelValue === option.value
          ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md shadow-[#2ecc71]/20'
          : 'text-slate-600 hover:text-slate-800',
      ]"
    >
      {{ option.label }}
    </button>
  </div>

  <!-- Mobile Filter Chip (opens bottom sheet) -->
  <button
    type="button"
    @click="showSheet = true"
    aria-haspopup="dialog"
    :aria-expanded="showSheet"
    :aria-label="t('events.filters.filterLabel')"
    class="sm:hidden flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#2ecc71]/30"
    :class="
      isNonDefault
        ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md shadow-[#2ecc71]/20'
        : 'glass-button text-slate-600'
    "
  >
    <CalendarClock class="w-5 h-5" />
  </button>

  <!-- Mobile Bottom Sheet -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="showSheet"
        class="sm:hidden fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm"
        @click="showSheet = false"
      />
    </Transition>
    <Transition name="sheet">
      <div
        v-if="showSheet"
        role="dialog"
        aria-modal="true"
        :aria-label="t('events.filters.filterLabel')"
        class="sm:hidden fixed inset-x-0 bottom-0 z-[999] bg-white rounded-t-3xl shadow-2xl pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      >
        <div class="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-3" aria-hidden="true" />
        <h3 class="px-5 pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {{ t('events.filters.filterLabel') }}
        </h3>
        <div class="py-1 max-h-[60vh] overflow-y-auto overscroll-contain">
          <button
            v-for="option in options"
            :key="option.value"
            type="button"
            :aria-pressed="modelValue === option.value"
            @click="selectOption(option.value)"
            class="w-full flex items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
          >
            <span
              :class="[
                'flex-1 text-left text-sm',
                modelValue === option.value
                  ? 'font-semibold text-slate-900'
                  : 'font-medium text-slate-700',
              ]"
            >{{ option.label }}</span>
            <Check
              v-if="modelValue === option.value"
              class="w-5 h-5 text-[#2ecc71] flex-shrink-0"
            />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { CalendarClock, Check } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'

export interface FilterOption {
  value: string
  label: string
}

const { t } = useAppLanguage()

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: FilterOption[]
  }>(),
  {}
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showSheet = ref(false)

// The first option is the default view; the chip fills with the brand
// gradient only when a non-default filter is applied (matches CategoryFilter).
const isNonDefault = computed(
  () => props.options.length > 0 && props.modelValue !== props.options[0].value,
)

const selectOption = (value: string) => {
  emit('update:modelValue', value)
  showSheet.value = false
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && showSheet.value) {
    showSheet.value = false
  }
}

// Lock body scroll while the bottom sheet is open
watch(showSheet, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (showSheet.value) {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.glass-toggle {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 2px 8px rgba(46, 204, 113, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.glass-button {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.75);
}

/* Bottom sheet: backdrop fade + panel slide-up */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.sheet-enter-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active,
  .sheet-leave-active,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
