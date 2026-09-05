<template>
  <!-- Desktop Dropdown -->
  <div class="relative services-category-filter-container hidden sm:block">
    <!-- Not `@click.stop`: the sort control beside this one closes its own menu
         from a document listener, and swallowing the click here left both menus
         open at once. Nothing needs the stop — this button sits inside the
         container our own click-outside check exempts. -->
    <button
      @click="toggleMenu"
      :class="triggerClass"
      :aria-label="t('categories.filterByCategory')"
    >
      <Shapes class="w-4 h-4 flex-shrink-0" />
      <span class="hidden sm:inline">{{ selectedLabel }}</span>
    </button>

    <!-- Dropdown Menu. Solid white to match the sort menu it sits beside —
         two adjacent list-control menus in different materials read as an
         accident rather than a pair. -->
    <Transition name="dropdown">
      <div
        v-if="showMenu"
        class="category-menu absolute right-0 top-full mt-2 min-w-[11.25rem] max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-lg z-[100]"
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

  <!-- Mobile trigger (opens the bottom sheet) — same button, sheet instead of
       menu. The label is hidden at this width, matching the sort control; which
       category is active still reads off the list heading beside it. -->
  <button
    type="button"
    @click="showSheet = true"
    aria-haspopup="dialog"
    :aria-expanded="showSheet"
    :aria-label="t('categories.filterByCategory')"
    :class="['sm:hidden', triggerClass]"
  >
    <Shapes class="w-4 h-4 flex-shrink-0" />
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
              >{{ categoryLabel(category) }}</span
            >
            <Check v-if="modelValue === category.id" class="w-5 h-5 text-[#2ecc71] flex-shrink-0" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Shapes, Check } from 'lucide-vue-next'
import type { ServiceCategory } from './types'
import { listControlTriggerClass, type ListControlTone } from './listControlTrigger'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'

const { t } = useAppLanguage()
const { translateServiceCategory } = useCategoryTranslation()

const props = withDefaults(
  defineProps<{
    modelValue: string
    categories: ServiceCategory[]
    /**
     * Palette only — never geometry. `nav` repaints the trigger for the desktop
     * top bar, which absorbs this control at full size once the listings heading
     * scrolls under it. See listControlTrigger.
     */
    tone?: ListControlTone
  }>(),
  { tone: 'page' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showMenu = ref(false)
const showSheet = ref(false)

const isFiltered = computed(() => props.modelValue !== 'all')

/**
 * Shared by this component's own two triggers — the desktop menu's and the
 * mobile sheet's — so the control looks the same whichever surface it opens,
 * and shared with the sort button beside it via listControlTriggerClass. The
 * recipe carries the height (`.lfc-chip`, 2.5rem — 40px at the mobile root
 * font, so design standard §17's touch target holds) and the press feedback in
 * every tone; nothing about size or motion is this component's to set.
 */
const triggerClass = computed(() => listControlTriggerClass(props.tone, isFiltered.value))

const categoryLabel = (category: ServiceCategory) =>
  category.id === 'all' ? t('categories.allCategories') : translateServiceCategory(category.name)

/**
 * At rest the trigger names what it does — "Category" — rather than announcing
 * "All Categories", which read as a filter someone had already applied. It only
 * carries a value once there is one to carry, and tints brand green with it.
 */
const selectedLabel = computed(() => {
  if (!isFiltered.value) return t('categories.category')
  const selected = props.categories.find((c) => c.id === props.modelValue)
  return selected ? categoryLabel(selected) : t('categories.category')
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

/* A long category list scrolls inside the menu; thin bar per design standard §10. */
.category-menu {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.category-menu::-webkit-scrollbar {
  width: 6px;
}

.category-menu::-webkit-scrollbar-track {
  background: transparent;
}

.category-menu::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.category-menu::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
