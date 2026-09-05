<template>
  <!--
    The refinement inside the current view, as a chip that states its own value.

    It used to be an icon-only circle whose only account of itself was a
    `title` tooltip — so on a phone there was no way to learn what it filtered
    by, and when it *was* set it turned into a gradient disc that said something
    was filtered without saying what. A filter that cannot name its own state is
    the one thing a filter must not be.

    It is also deliberately not a peer of the time control beside it. That one
    picks which set of events you are looking at and always has an answer; this
    one narrows that set and is off by default. The old pair was sized to match
    — a circle rebuilt from the segmented control's padding and border in
    `calc()` — which said they were equals, and cost the label to do it. Here
    the height is one shared token and the chip earns its width from its
    content, so the label costs nothing.

    Desktop only, and `tone` repaints it without ever resizing it; see the notes
    in TimeFilterToggle, whose surface this matches.
  -->
  <div class="category-filter-container relative">
    <button
      type="button"
      class="lfc-chip lfc-press flex items-center gap-2 pl-3 pr-2.5 rounded-full text-sm font-medium tracking-[-0.01em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ecc71]/40"
      :class="[
        modelValue
          ? 'lfc-chip--set text-slate-900'
          : [isAbsorbed ? 'lfc-surface--nav' : 'lfc-surface--page', 'text-slate-600 hover:text-slate-900'],
      ]"
      aria-haspopup="menu"
      :aria-expanded="showMenu"
      :aria-label="`${t('categories.filterByCategory')}: ${activeLabel}`"
      @click.stop="showMenu = !showMenu"
    >
      <!-- Set: the category's own colour, the same mark the menu lists it by.
           Unset: the generic filter glyph, since there is no colour to show. -->
      <span
        v-if="modelValue"
        class="w-2 h-2 rounded-full flex-shrink-0"
        :style="{ backgroundColor: activeColor }"
        aria-hidden="true"
      />
      <Shapes v-else class="w-4 h-4 flex-shrink-0" aria-hidden="true" />

      <!-- Capped rather than left to grow: "Housewarming Party" and its Khmer
           equivalent would otherwise push the row into the title beside it. -->
      <span class="truncate max-w-[8rem]">{{ activeLabel }}</span>
      <ChevronDown
        class="w-3.5 h-3.5 flex-shrink-0 opacity-50 transition-transform duration-200"
        :class="showMenu ? 'rotate-180' : ''"
        aria-hidden="true"
      />
    </button>

    <Transition name="dropdown">
      <div
        v-if="showMenu"
        class="glass-dropdown absolute right-0 top-full mt-2 rounded-xl overflow-hidden overflow-y-auto min-w-[11.25rem] max-h-[60vh] z-[100]"
        role="menu"
      >
        <button
          v-for="option in menuOptions"
          :key="option.value || 'all'"
          type="button"
          role="menuitemradio"
          :aria-checked="modelValue === option.value"
          class="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50"
          :class="modelValue === option.value ? 'text-slate-900 font-medium' : 'text-slate-700'"
          @click="selectCategory(option.value)"
        >
          <span
            class="w-2 h-2 rounded-full flex-shrink-0"
            :class="option.value ? '' : 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]'"
            :style="option.value ? { backgroundColor: option.color } : undefined"
            aria-hidden="true"
          />
          <span class="flex-1 truncate">{{ option.label }}</span>
          <Check
            v-if="modelValue === option.value"
            class="w-4 h-4 flex-shrink-0 text-[#2ecc71]"
            aria-hidden="true"
          />
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Check, ChevronDown, Shapes } from 'lucide-vue-next'
import type { EventCategory } from '@/services/api'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'
import { useHeaderTone, useNavPageControls } from '@/composables/useNavPageControls'

const { t } = useAppLanguage()
const { translateEventCategory } = useCategoryTranslation()

const props = defineProps<{
  modelValue: string
  categories: EventCategory[]
  /** Palette only — never geometry. See TimeFilterToggle. */
  tone?: 'page' | 'nav'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const resolvedTone = useHeaderTone(() => props.tone)
const { isDesktopNav } = useNavPageControls()
const isAbsorbed = computed(() => resolvedTone.value === 'nav' && isDesktopNav.value)

const DEFAULT_CATEGORY_COLOR = '#3B82F6'

/** The chip's label, and the menu's first row, are the same one list. */
const menuOptions = computed(() => [
  { value: '', label: t('categories.allCategories'), color: '' },
  ...props.categories.map((category) => ({
    value: category.name,
    label: translateEventCategory(category.name),
    color: category.color || DEFAULT_CATEGORY_COLOR,
  })),
])

const activeOption = computed(() => menuOptions.value.find((o) => o.value === props.modelValue))
const activeLabel = computed(() => activeOption.value?.label ?? t('categories.allCategories'))
const activeColor = computed(() => activeOption.value?.color || DEFAULT_CATEGORY_COLOR)

const showMenu = ref(false)

const selectCategory = (name: string) => {
  emit('update:modelValue', name)
  showMenu.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (showMenu.value && !target.closest('.category-filter-container')) {
    showMenu.value = false
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') showMenu.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.dropdown-enter-active {
  transition:
    opacity 0.16s ease-out,
    transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

.dropdown-leave-active {
  transition:
    opacity 0.14s ease-in,
    transform 0.18s cubic-bezier(0.4, 0, 0.6, 1);
}

/* Grows out of the chip that opened it, not from its own middle. */
.dropdown-enter-active,
.dropdown-leave-active {
  transform-origin: top right;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .dropdown-enter-from,
  .dropdown-leave-to {
    transform: none;
  }
}

.glass-dropdown {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 8px 32px rgba(46, 204, 113, 0.1),
    0 4px 12px rgba(30, 144, 255, 0.08);
  /* The category list outgrows `max-h-[60vh]`, so this menu actually scrolls —
     and the platform scrollbar it drew was a wide opaque channel with stepper
     arrows, heavier than anything else on a translucent panel of thin slate
     text. The thin 6px style (design standard §10) below. */
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

@media (prefers-reduced-transparency: reduce) {
  .glass-dropdown {
    background: #ffffff;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
</style>
