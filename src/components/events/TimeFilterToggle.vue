<template>
  <!-- Desktop Segmented Control. `tone` only repaints it: the desktop nav
       absorbs this control at full size once the page header scrolls away, and
       it has to land on the same pixels it left, so nothing about the geometry
       may depend on where it is rendered. -->
  <div
    v-if="!compact"
    class="hidden sm:flex items-center rounded-full border p-1"
    :class="tone === 'nav' ? 'border-transparent bg-slate-900/[0.04]' : 'glass-toggle border-white/50'"
  >
    <button
      v-for="option in options"
      :key="option.value"
      @click="$emit('update:modelValue', option.value)"
      :class="[
        'px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-full transition-all duration-300',
        modelValue === option.value
          ? tone === 'nav'
            ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-sm shadow-[#2ecc71]/20'
            : 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md shadow-[#2ecc71]/20'
          : tone === 'nav'
            ? 'text-slate-500 hover:text-slate-700'
            : 'text-slate-600 hover:text-slate-800',
      ]"
    >
      {{ option.label }}
    </button>
  </div>

  <!-- Compact icon + dropdown. Only the mobile top bar uses this — at 56px tall
       and already carrying search/bell/language it has no room for the
       segmented control. -->
  <div v-else class="relative hidden sm:block time-filter-container">
    <button
      type="button"
      @click.stop="showMenu = !showMenu"
      aria-haspopup="menu"
      :aria-expanded="showMenu"
      :aria-label="t('events.filters.filterLabel')"
      :title="activeLabel"
      class="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2ecc71]/30"
      :class="
        isNonDefault
          ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-sm shadow-[#2ecc71]/20'
          : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
      "
    >
      <CalendarClock class="w-[18px] h-[18px]" />
    </button>

    <Transition name="dropdown">
      <div
        v-if="showMenu"
        role="menu"
        class="glass-dropdown absolute right-0 top-full mt-2 rounded-xl overflow-hidden min-w-[10rem] z-[100]"
      >
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          role="menuitemradio"
          :aria-checked="modelValue === option.value"
          @click="selectOption(option.value)"
          class="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors"
          :class="
            modelValue === option.value
              ? 'text-[#2ecc71] font-medium bg-[#2ecc71]/5'
              : 'text-slate-700'
          "
        >
          {{ option.label }}
        </button>
      </div>
    </Transition>
  </div>

  <!-- Mobile Filter Chip (opens bottom sheet). Same size and shape in the page
       header and in the mobile bar that absorbs it — only the fill changes. -->
  <button
    type="button"
    @click="showSheet = true"
    aria-haspopup="dialog"
    :aria-expanded="showSheet"
    :aria-label="t('events.filters.filterLabel')"
    class="sm:hidden flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#2ecc71]/30"
    :class="
      isNonDefault
        ? 'border-transparent bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md shadow-[#2ecc71]/20'
        : tone === 'nav'
          ? 'border-transparent text-slate-600 hover:bg-slate-100'
          : 'glass-button border-white/50 text-slate-600'
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
    /** Render as a single icon button with a dropdown, for tight chrome. */
    compact?: boolean
    /**
     * Palette only — never geometry. `nav` drops the glass card for surfaces
     * that belong to the top bar, so the absorbed control reads as part of the
     * chrome instead of a card floating on it.
     */
    tone?: 'page' | 'nav'
  }>(),
  { compact: false, tone: 'page' }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showSheet = ref(false)
const showMenu = ref(false)

// The first option is the default view; the chip fills with the brand
// gradient only when a non-default filter is applied (matches CategoryFilter).
const isNonDefault = computed(
  () => props.options.length > 0 && props.modelValue !== props.options[0].value,
)

/** Tooltip for the compact button, which has no room for the current label. */
const activeLabel = computed(
  () => props.options.find((option) => option.value === props.modelValue)?.label ?? '',
)

const selectOption = (value: string) => {
  emit('update:modelValue', value)
  showSheet.value = false
  showMenu.value = false
}

const closeMenu = () => {
  showMenu.value = false
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  if (showSheet.value) showSheet.value = false
  if (showMenu.value) showMenu.value = false
}

// Lock body scroll while the bottom sheet is open
watch(showSheet, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', closeMenu)
  if (showSheet.value) {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
/* Borders live in the class list, not here, so both tones carry the same 1px
   and the control keeps its exact width when the nav absorbs it. */
.glass-toggle {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow:
    0 2px 8px rgba(46, 204, 113, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.glass-button {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.75);
}

/* Compact dropdown — matches CategoryFilter's, so the two controls sitting
   side by side in the nav open the same kind of surface. */
.glass-dropdown {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 8px 32px rgba(46, 204, 113, 0.1),
    0 4px 12px rgba(30, 144, 255, 0.08);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
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
