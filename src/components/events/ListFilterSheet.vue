<template>
  <!--
    Both filters on one pill, below the nav breakpoint.

    What it replaces: two 40px circles side by side — a clock and a funnel —
    indistinguishable at a glance, each filling with the same brand gradient
    when set, each opening a bottom sheet of its own. So the bar said nothing
    about what you were looking at, and narrowing a list by time *and* category
    was two taps into two separate sheets for what is one thought.

    The pill states the answer instead of hiding it: "Recent", or
    "Recent · Wedding" once a category is on. That is the whole point — on this
    surface the control has room for a sentence but not for three segments, so
    it should spend that room saying where you are.

    One sheet, two sections, and selections apply live behind it: closing on the
    first tap is what forced the old pair to be two sheets. Done dismisses it,
    as does the backdrop.
  -->
  <button
    type="button"
    class="lfc-chip lfc-press flex items-center gap-2 pl-3 pr-3.5 rounded-full text-sm font-medium tracking-[-0.01em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ecc71]/40"
    :class="
      category
        ? 'lfc-chip--set text-slate-900'
        : 'lfc-surface--nav text-slate-600 hover:text-slate-900'
    "
    aria-haspopup="dialog"
    :aria-expanded="open"
    :aria-label="`${t('events.filters.filterLabel')}: ${summary}`"
    @click="open = true"
  >
    <SlidersHorizontal class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
    <span class="truncate max-w-[9rem]">{{ summary }}</span>
  </button>

  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm"
        @click="open = false"
      />
    </Transition>
    <Transition name="sheet">
      <div
        v-if="open"
        role="dialog"
        aria-modal="true"
        :aria-label="t('events.filters.filterLabel')"
        class="fixed inset-x-0 bottom-0 z-[999] bg-white rounded-t-3xl shadow-2xl pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      >
        <div class="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-3" aria-hidden="true" />

        <!-- The way out, named. The sheet applies as you tap, so there is
             nothing to confirm — this only has to be findable. -->
        <div class="flex items-center justify-between px-5 pt-3 pb-1">
          <h2 class="text-base font-semibold text-slate-900">
            {{ t('events.filters.filterLabel') }}
          </h2>
          <button
            type="button"
            class="lfc-press -mr-2 px-2 py-1 rounded-lg text-sm font-semibold text-[#2ecc71] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ecc71]/40"
            @click="open = false"
          >
            {{ t('events.filters.done') }}
          </button>
        </div>

        <div class="max-h-[65vh] overflow-y-auto overscroll-contain pb-2">
          <h3 class="px-5 pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {{ t('events.filters.timeSection') }}
          </h3>
          <button
            v-for="option in timeOptions"
            :key="option.value"
            type="button"
            role="menuitemradio"
            :aria-checked="timeFilter === option.value"
            class="w-full flex items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
            @click="emit('update:timeFilter', option.value)"
          >
            <span
              class="flex-1 text-left text-sm"
              :class="
                timeFilter === option.value
                  ? 'font-semibold text-slate-900'
                  : 'font-medium text-slate-700'
              "
              >{{ option.label }}</span
            >
            <Check
              v-if="timeFilter === option.value"
              class="w-5 h-5 flex-shrink-0 text-[#2ecc71]"
              aria-hidden="true"
            />
          </button>

          <h3 class="px-5 pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {{ t('categories.category') }}
          </h3>
          <button
            v-for="option in categoryOptions"
            :key="option.value || 'all'"
            type="button"
            role="menuitemradio"
            :aria-checked="category === option.value"
            class="w-full flex items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
            @click="emit('update:category', option.value)"
          >
            <span
              class="w-3 h-3 rounded-full flex-shrink-0"
              :class="option.value ? '' : 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]'"
              :style="option.value ? { backgroundColor: option.color } : undefined"
              aria-hidden="true"
            />
            <span
              class="flex-1 text-left text-sm truncate"
              :class="
                category === option.value
                  ? 'font-semibold text-slate-900'
                  : 'font-medium text-slate-700'
              "
              >{{ option.label }}</span
            >
            <Check
              v-if="category === option.value"
              class="w-5 h-5 flex-shrink-0 text-[#2ecc71]"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { Check, SlidersHorizontal } from 'lucide-vue-next'
import type { EventCategory } from '@/services/api'
import type { FilterOption } from './TimeFilterToggle.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'

const { t } = useAppLanguage()
const { translateEventCategory } = useCategoryTranslation()

const props = defineProps<{
  timeFilter: string
  timeOptions: FilterOption[]
  category: string
  categories: EventCategory[]
}>()

const emit = defineEmits<{
  'update:timeFilter': [value: string]
  'update:category': [value: string]
}>()

const DEFAULT_CATEGORY_COLOR = '#3B82F6'

const categoryOptions = computed(() => [
  { value: '', label: t('categories.allCategories'), color: '' },
  ...props.categories.map((category) => ({
    value: category.name,
    label: translateEventCategory(category.name),
    color: category.color || DEFAULT_CATEGORY_COLOR,
  })),
])

/**
 * What the pill says. The time filter always has an answer, so it leads; the
 * category is appended only when it is narrowing something, which is also the
 * only time the pill carries a fill.
 */
const summary = computed(() => {
  const time =
    props.timeOptions.find((option) => option.value === props.timeFilter)?.label ??
    t('events.filters.filterLabel')
  const category = categoryOptions.value.find(
    (option) => option.value && option.value === props.category,
  )
  return category ? `${time} · ${category.label}` : time
})

const open = ref(false)

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') open.value = false
}

// Lock body scroll while the sheet is open.
watch(open, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
  if (isOpen) document.addEventListener('keydown', handleKeydown)
  else document.removeEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (open.value) document.body.style.overflow = ''
})
</script>

<style scoped>
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
