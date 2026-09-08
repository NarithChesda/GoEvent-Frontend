<template>
  <div class="border-t border-slate-100">
    <!-- Header. Two buttons, not one: the action slot holds real buttons and
         they cannot nest inside the toggle. The title area is the large target;
         the chevron is the small conventional one. -->
    <div class="flex items-center gap-1 pl-2.5 pr-1.5 py-1.5">
      <button
        type="button"
        class="flex-1 min-w-0 flex items-center gap-2.5 py-1.5 pl-1 pr-1 text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        :aria-expanded="expanded"
        @click="$emit('toggle')"
      >
        <span
          class="w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors duration-200"
          :class="filled ? 'bg-sky-50 border-sky-100' : 'bg-slate-50 border-slate-100'"
        >
          <component
            :is="icon"
            class="w-3.5 h-3.5"
            :class="filled ? 'text-[#1e90ff]' : 'text-slate-400'"
            aria-hidden="true"
          />
        </span>
        <span class="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-900 leading-snug">{{ title }}</span>
        <!-- The summary is what a collapsed row says instead of a description:
             a description repeats the title in more words, this says whether
             there is anything inside. Hidden while open — the content itself
             is then the better answer. -->
        <span
          v-if="summary && !expanded"
          class="flex-shrink-0 max-w-[45%] truncate text-[11px] text-slate-400 leading-snug"
        >{{ summary }}</span>
      </button>

      <div class="flex items-center gap-0.5 flex-shrink-0">
        <slot name="actions" />
        <button
          type="button"
          class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          :aria-expanded="expanded"
          :aria-label="t('management.media.sectionToggle')"
          :title="t('management.media.sectionToggle')"
          @click="$emit('toggle')"
        >
          <ChevronDown
            class="w-3.5 h-3.5 transition-transform duration-200"
            :class="{ 'rotate-180': expanded }"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>

    <Transition name="collapse">
      <div v-if="expanded" class="grid grid-rows-[1fr]">
        <div class="min-h-0 overflow-hidden">
          <!-- The body sits on a tint so it reads as belonging to the row above
               rather than as the next row. Without it, an open section in a
               hairline-divided stack has no visible extent. -->
          <div class="border-t border-slate-100 bg-slate-50/70 px-3 py-3">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * One row of the Showcase tab's stacked section groups.
 *
 * The sections used to be eleven separate `rounded-3xl shadow-xl` cards, each
 * drawing its own header, description and chevron. Stacked into one card per
 * group, the chrome is drawn once here and the sections supply only what
 * differs: an icon, a title, a one-glance summary, and their body.
 *
 * `filled` drives the icon tile the same way EventTextTab's slot rows drive
 * theirs — brand blue when the section holds something, slate when it does
 * not — so the stack can be scanned for gaps without reading a word.
 *
 * The row draws its OWN top hairline rather than the group container drawing
 * `divide-y`. `divide-y` only reaches direct children, and these sections are
 * not uniformly one element deep: MediaUploadsSection and EmbedsSection each
 * emit two rows, and several pair their row with a sibling modal. The group
 * hides the leading hairline by clipping it (`overflow-hidden` + `-mt-px`),
 * which works at any nesting depth — see EventMediaTab's stack container.
 */
import type { Component } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'

defineProps<{
  icon: Component
  title: string
  /** Right-aligned one-glance state, e.g. "16 texts" / "Not set". */
  summary?: string
  /** Whether the section holds any content — tints the icon tile. */
  filled?: boolean
  expanded: boolean
}>()

defineEmits<{ (e: 'toggle'): void }>()

const { t } = useAppLanguage()
</script>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.3s cubic-bezier(0.23, 1, 0.32, 1),
    opacity 0.2s ease-out;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none !important;
  }
}
</style>
