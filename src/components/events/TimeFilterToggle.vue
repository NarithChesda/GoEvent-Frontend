<template>
  <!-- Desktop Segmented Control. `tone` only repaints it: the desktop nav
       absorbs this control at full size once the page header scrolls away, and
       it has to land on the same pixels it left, so nothing about the geometry
       may depend on where it is rendered. -->
  <div
    class="hidden sm:flex items-center rounded-full border p-1"
    :class="
      isAbsorbed
        ? 'nav-surface border-transparent'
        : resolvedTone === 'nav'
          ? 'border-transparent bg-slate-900/[0.04]'
          : 'glass-toggle border-white/50'
    "
  >
    <button
      v-for="option in options"
      :key="option.value"
      @click="$emit('update:modelValue', option.value)"
      :class="[
        'px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-full transition-all duration-300',
        modelValue === option.value
          ? resolvedTone === 'nav'
            ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-sm shadow-[#2ecc71]/20'
            : 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md shadow-[#2ecc71]/20'
          : resolvedTone === 'nav' && !isAbsorbed
            ? 'text-slate-500 hover:text-slate-700'
            : 'text-slate-600 hover:text-slate-800',
      ]"
    >
      {{ option.label }}
    </button>
  </div>

  <!-- Mobile Filter Chip (opens bottom sheet). Same size and shape wherever the
       page header lands — only the fill changes. -->
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
        : resolvedTone === 'nav'
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
import { useHeaderTone, useNavPageControls } from '@/composables/useNavPageControls'

export interface FilterOption {
  value: string
  label: string
}

const { t } = useAppLanguage()

const props = defineProps<{
  modelValue: string
  options: FilterOption[]
  /**
   * Palette only — never geometry. `nav` drops the glass card for surfaces that
   * belong to a bar, so the control reads as part of the chrome instead of a
   * card floating on it. Left unset it follows where the page header currently
   * lives — see useHeaderTone.
   */
  tone?: 'page' | 'nav'
}>()

const resolvedTone = useHeaderTone(() => props.tone)

// Wearing the bar's palette *and* sitting on the desktop nav — which is the one
// place the control is a guest on someone else's glass, with page content
// scrolling underneath it. Below the nav breakpoint the tone is the same but the
// header row *is* the bar's contents, so it keeps the flat chrome look.
const { isDesktopNav } = useNavPageControls()
const isAbsorbed = computed(() => resolvedTone.value === 'nav' && isDesktopNav.value)

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
  if (event.key === 'Escape') showSheet.value = false
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
/*
  The surface for the desktop nav's copy, and only that one. That bar is liquid
  glass with the page running under it, so anything translucent laid on it takes
  its contrast from whatever happens to be scrolling past — an event card with a
  dark banner passing below swallowed the unselected labels outright. The 4%
  slate tint the mobile bar still uses was exactly that: a wash with no ground of
  its own. It stays there because the mobile header row is the bar's own
  contents rather than a guest on it.

  So the absorbed fill is opaque instead. The hairline ring is what keeps its
  edge over the pale page wash, where a white pill on a white-ish bar would
  otherwise dissolve — and it is a ring rather than a border because the
  geometry may not move: the control has to land on the pixels it left in the
  page header.
*/
.nav-surface {
  background-color: rgba(255, 255, 255, 0.94);
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
}

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
