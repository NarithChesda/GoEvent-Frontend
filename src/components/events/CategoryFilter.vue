<template>
  <!-- Desktop Dropdown -->
  <div class="relative category-filter-container hidden sm:block">
    <!-- Compact drops the label for a single icon button, for tight chrome
         such as the top nav; the dropdown it opens is unchanged. -->
    <button
      @click.stop="toggleMenu"
      :aria-label="t('categories.filterByCategory')"
      :title="compact ? activeLabel : undefined"
      class="flex items-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2ecc71]/30"
      :class="[
        compact
          ? 'justify-center w-9 h-9 rounded-lg'
          : 'glass-button gap-2 px-4 py-2 rounded-full text-sm font-medium',
        compact
          ? modelValue
            ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-sm shadow-[#2ecc71]/20'
            : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
          : modelValue
            ? 'bg-gradient-to-r from-[#2ecc71]/15 to-[#1e90ff]/15 text-slate-800 border-[#2ecc71]/30'
            : 'text-slate-700',
      ]"
    >
      <ListFilter v-if="compact" class="w-[18px] h-[18px]" />
      <template v-else>
        <span>{{ activeLabel }}</span>
        <ChevronDown
          class="w-4 h-4 transition-transform duration-200"
          :class="showMenu ? 'rotate-180' : ''"
        />
      </template>
    </button>

    <!-- Dropdown Menu -->
    <Transition name="dropdown">
      <div
        v-if="showMenu"
        class="glass-dropdown absolute right-0 top-full mt-2 rounded-xl overflow-hidden overflow-y-auto min-w-[11.25rem] max-h-[60vh] z-[100]"
      >
        <button
          @click="selectCategory('')"
          class="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors"
          :class="
            !modelValue
              ? 'text-[#2ecc71] font-medium bg-[#2ecc71]/5'
              : 'text-slate-700'
          "
        >
          {{ t('categories.allCategories') }}
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          @click="selectCategory(category.name)"
          class="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors"
          :class="
            modelValue === category.name
              ? 'text-[#2ecc71] font-medium bg-[#2ecc71]/5'
              : 'text-slate-700'
          "
        >
          {{ translateEventCategory(category.name) }}
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
    class="sm:hidden flex items-center justify-center transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#2ecc71]/30"
    :class="[
      compact ? 'w-9 h-9 rounded-lg' : 'w-10 h-10 rounded-full',
      modelValue
        ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md shadow-[#2ecc71]/20'
        : compact
          ? 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
          : 'glass-button text-slate-600',
    ]"
  >
    <ListFilter :class="compact ? 'w-[18px] h-[18px]' : 'w-5 h-5'" />
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
            type="button"
            :aria-pressed="!modelValue"
            @click="selectCategory('')"
            class="w-full flex items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
          >
            <span
              class="w-3 h-3 rounded-full flex-shrink-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]"
              aria-hidden="true"
            />
            <span
              :class="[
                'flex-1 text-left text-sm',
                !modelValue ? 'font-semibold text-slate-900' : 'font-medium text-slate-700',
              ]"
            >{{ t('categories.allCategories') }}</span>
            <Check v-if="!modelValue" class="w-5 h-5 text-[#2ecc71] flex-shrink-0" />
          </button>
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            :aria-pressed="modelValue === category.name"
            @click="selectCategory(category.name)"
            class="w-full flex items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
          >
            <span
              class="w-3 h-3 rounded-full flex-shrink-0"
              :style="{ backgroundColor: category.color || '#3B82F6' }"
              aria-hidden="true"
            />
            <span
              :class="[
                'flex-1 text-left text-sm truncate',
                modelValue === category.name
                  ? 'font-semibold text-slate-900'
                  : 'font-medium text-slate-700',
              ]"
            >{{ translateEventCategory(category.name) }}</span>
            <Check
              v-if="modelValue === category.name"
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
import type { EventCategory } from '@/services/api'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'

const { t } = useAppLanguage()
const { translateEventCategory } = useCategoryTranslation()

const props = withDefaults(
  defineProps<{
    modelValue: string
    categories: EventCategory[]
    /** Render as a single icon button, for tight chrome. */
    compact?: boolean
  }>(),
  { compact: false }
)

/** Label for the trigger, and the compact button's tooltip. */
const activeLabel = computed(() =>
  props.modelValue ? translateEventCategory(props.modelValue) : t('categories.allCategories')
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showMenu = ref(false)
const showSheet = ref(false)

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const selectCategory = (name: string) => {
  emit('update:modelValue', name)
  showMenu.value = false
  showSheet.value = false
}

// Handle click outside to close menu
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (showMenu.value && !target.closest('.category-filter-container')) {
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
}
</style>
