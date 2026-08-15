<template>
  <!-- Desktop Dropdown -->
  <div class="relative services-category-filter-container hidden sm:block">
    <button
      @click.stop="toggleMenu"
      class="glass-button flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2ecc71]/30"
      :class="
        isFiltered
          ? 'bg-gradient-to-r from-[#2ecc71]/15 to-[#1e90ff]/15 text-slate-800 border-[#2ecc71]/30'
          : 'text-slate-700'
      "
    >
      <span>{{ selectedLabel }}</span>
      <ChevronDown
        class="w-4 h-4 transition-transform duration-200"
        :class="showMenu ? 'rotate-180' : ''"
      />
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div
        v-if="showMenu"
        class="glass-dropdown absolute right-0 top-full mt-2 rounded-xl overflow-hidden overflow-y-auto min-w-[11.25rem] max-h-[60vh] z-[100]"
      >
        <button
          v-for="category in categories"
          :key="category.id"
          @click="selectCategory(category.id)"
          class="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors"
          :class="
            modelValue === category.id
              ? 'text-[#2ecc71] font-medium bg-[#2ecc71]/5'
              : 'text-slate-700'
          "
        >
          {{ categoryLabel(category) }}
        </button>
      </div>
    </Transition>
  </div>

  <!-- Mobile Filter Chip (opens bottom sheet) -->
  <button
    type="button"
    @click="showSheet = true"
    aria-haspopup="dialog"
    :aria-expanded="showSheet"
    :aria-label="t('categories.filterByCategory')"
    class="sm:hidden flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#2ecc71]/30"
    :class="
      isFiltered
        ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md shadow-[#2ecc71]/20'
        : resolvedTone === 'nav'
          ? 'text-slate-600 hover:bg-slate-100'
          : 'glass-button text-slate-600'
    "
  >
    <ListFilter class="w-5 h-5" />
  </button>

  <!-- Mobile Category Bottom Sheet -->
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
        :aria-label="t('categories.filterByCategory')"
        class="sm:hidden fixed inset-x-0 bottom-0 z-[999] bg-white rounded-t-3xl shadow-2xl pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      >
        <div class="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-3" aria-hidden="true" />
        <h3 class="px-5 pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {{ t('categories.filterByCategory') }}
        </h3>
        <div class="py-1 max-h-[60vh] overflow-y-auto overscroll-contain">
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            :aria-pressed="modelValue === category.id"
            @click="selectCategory(category.id)"
            class="w-full flex items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
          >
            <span
              class="w-3 h-3 rounded-full flex-shrink-0"
              :class="
                category.id === 'all'
                  ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]'
                  : 'bg-slate-300'
              "
              aria-hidden="true"
            />
            <span
              :class="[
                'flex-1 text-left text-sm truncate',
                modelValue === category.id
                  ? 'font-semibold text-slate-900'
                  : 'font-medium text-slate-700',
              ]"
            >{{ categoryLabel(category) }}</span>
            <Check
              v-if="modelValue === category.id"
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
import { ChevronDown, ListFilter, Check } from 'lucide-vue-next'
import type { ServiceCategory } from './types'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'
import { useHeaderTone } from '@/composables/useNavPageControls'

const { t } = useAppLanguage()
const { translateServiceCategory } = useCategoryTranslation()

const props = defineProps<{
  modelValue: string
  categories: ServiceCategory[]
  /**
   * Palette only — never geometry, same contract as the event list's filters.
   * Left unset it follows where the page header currently lives, which below
   * the nav breakpoint is inside the mobile top bar — see useHeaderTone.
   */
  tone?: 'page' | 'nav'
}>()

const resolvedTone = useHeaderTone(() => props.tone)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showMenu = ref(false)
const showSheet = ref(false)

const isFiltered = computed(() => props.modelValue !== 'all')

const categoryLabel = (category: ServiceCategory) =>
  category.id === 'all'
    ? t('categories.allCategories')
    : translateServiceCategory(category.name)

const selectedLabel = computed(() => {
  const selected = props.categories.find((c) => c.id === props.modelValue)
  return selected ? categoryLabel(selected) : t('categories.allCategories')
})

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const selectCategory = (id: string) => {
  emit('update:modelValue', id)
  showMenu.value = false
  showSheet.value = false
}

// Handle click outside to close menu
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (showMenu.value && !target.closest('.services-category-filter-container')) {
    showMenu.value = false
  }
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
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
  if (showSheet.value) {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
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

/* Glass effect styles */
.glass-button {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.75);
}

.glass-dropdown {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 8px 32px rgba(46, 204, 113, 0.1),
    0 4px 12px rgba(30, 144, 255, 0.08);
  /* Scrolls past `max-h-[60vh]`; keep the bar off the glass. Design standard §10. */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.glass-dropdown::-webkit-scrollbar {
  width: 6px;
}

.glass-dropdown::-webkit-scrollbar-track {
  background: transparent;
}

.glass-dropdown::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.glass-dropdown::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
