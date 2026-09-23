<template>
  <!-- The create wizard's first question. Two tiers, told apart by size rather
       than colour: the categories GoEvent has invitation designs for lead as
       full-width rows that say so, because they are what the product is best
       at; everything else follows as a compact two-up grid. Category colours
       are not used — in production all but one are the same default blue, so
       they would be decoration pretending to be information.

       A tap is the answer. The wizard advances on `pick` itself, so these are
       plain buttons (with `aria-pressed` for the current choice) rather than a
       radio group, whose arrow keys would move the selection — and here,
       moving the selection moves the page. -->
  <div>
    <!-- Loading: the shape of what is coming, so the page does not jump when
         it arrives. -->
    <div v-if="state === 'loading'" aria-hidden="true">
      <div class="space-y-2.5">
        <div v-for="n in 3" :key="n" class="h-[4.25rem] rounded-xl bg-slate-100 animate-pulse" />
      </div>
      <div class="mt-6 h-4 w-24 rounded bg-slate-100 animate-pulse" />
      <div class="mt-2 grid grid-cols-2 gap-2">
        <div v-for="n in 6" :key="`o-${n}`" class="h-11 rounded-xl bg-slate-100 animate-pulse" />
      </div>
    </div>

    <div
      v-else-if="state === 'error'"
      role="alert"
      class="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
    >
      <p>{{ t('events.createDrawer.steps.type.loadError') }}</p>
      <button
        type="button"
        class="mt-2 -ml-1 px-1 py-1 min-h-[2.5rem] font-semibold rounded-md hover:underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
        @click="emit('retry')"
      >
        {{ t('events.createDrawer.steps.type.retry') }}
      </button>
    </div>

    <template v-else>
      <div v-if="featured.length" class="space-y-2.5">
        <button
          v-for="category in featured"
          :key="category.id"
          type="button"
          :aria-pressed="modelValue === category.id"
          class="choice w-full flex items-center gap-3.5 px-3.5 py-3 min-h-[4.25rem] rounded-xl text-left"
          :class="optionClass(modelValue === category.id)"
          @click="emit('pick', category.id)"
        >
          <span
            class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
            :class="modelValue === category.id ? 'bg-white shadow-sm' : 'bg-slate-100'"
            aria-hidden="true"
          >
            <component
              :is="getCategoryIcon(category.name)"
              class="w-5 h-5 transition-colors duration-200"
              :class="modelValue === category.id ? 'text-[#1e90ff]' : 'text-slate-600'"
            />
          </span>
          <span class="flex-1 min-w-0">
            <span class="block text-[0.9375rem] font-semibold text-slate-900 truncate">
              {{ buttonLabel(category) }}
            </span>
            <span class="mt-0.5 block text-xs text-slate-500">
              {{ t('events.createDrawer.steps.type.designs') }}
            </span>
          </span>
          <Check
            v-if="modelValue === category.id"
            class="w-4 h-4 flex-shrink-0 text-[#1e90ff]"
            aria-hidden="true"
          />
        </button>
      </div>

      <template v-if="others.length">
        <!-- Only a heading when there is a first tier to set it apart from;
             alone, the grid is simply the answer to the question above it. -->
        <p v-if="featured.length" class="mt-6 mb-2 text-sm font-medium text-slate-700">
          {{ t('events.createDrawer.steps.type.other') }}
        </p>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="category in others"
            :key="category.id"
            type="button"
            :aria-pressed="modelValue === category.id"
            class="choice flex items-center gap-2.5 px-3 py-2.5 min-h-[2.75rem] rounded-xl text-left"
            :class="optionClass(modelValue === category.id)"
            @click="emit('pick', category.id)"
          >
            <component
              :is="getCategoryIcon(category.name)"
              class="w-4 h-4 flex-shrink-0 transition-colors duration-200"
              :class="optionIconClass(modelValue === category.id)"
              aria-hidden="true"
            />
            <span
              class="min-w-0 text-sm font-medium leading-snug line-clamp-2"
              :class="modelValue === category.id ? 'text-slate-900' : 'text-slate-700'"
            >
              {{ buttonLabel(category) }}
            </span>
          </button>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import type { EventCategory } from '@/services/api'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'
import { normalizeCategoryKey } from '@/utils/categoryKey'
import { getCategoryIcon } from '@/components/template/categoryIcons'
import { optionClass, optionIconClass } from '@/components/template/templateUi'

defineProps<{
  state: 'loading' | 'ready' | 'error'
  /** Categories with invitation designs, most designs first. */
  featured: EventCategory[]
  others: EventCategory[]
  modelValue: number | null
}>()

const emit = defineEmits<{
  pick: [categoryId: number]
  retry: []
}>()

const { t } = useAppLanguage()
const { te } = useI18n()
const { translateEventCategory } = useCategoryTranslation()

/**
 * The name on the choice itself, which may be gentler than the category's
 * name. Someone planning a funeral taps a button that reads "ពិធីបុណ្យផ្សេងៗ"
 * rather than the blunt "ពិធីបុណ្យសព" — at the moment of choosing, the word is
 * addressed to them. Everywhere the category is *named* rather than chosen
 * (the review list on the last step, filters, cards, the template browser) it
 * keeps its real name, from categories.json.
 *
 * Opt-in per category under `events.createDrawer.steps.type.buttonLabels`;
 * any category without an entry shows its ordinary name.
 */
const buttonLabel = (category: EventCategory): string => {
  const key = `events.createDrawer.steps.type.buttonLabels.${normalizeCategoryKey(category.name)}`
  return te(key) ? t(key) : translateEventCategory(category.name)
}
</script>

<style scoped>
/* Press feedback lands on the frame the finger does (apple-design §1): the
   shared option recipe eases its background over 200ms, which on a press reads
   as lag. No scale — these are rows, and a full-width row scaled by 0.98 moves
   by nothing at its centre. */
.choice:active {
  transition: none;
  background-color: rgb(241 245 249); /* slate-100 */
}

@media (prefers-reduced-motion: reduce) {
  .choice,
  .choice * {
    transition-duration: 0.01ms !important;
  }
}
</style>
