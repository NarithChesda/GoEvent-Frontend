<template>
  <div>
    <div
      ref="bodyRef"
      class="relative overflow-hidden"
      :style="isCollapsed ? { maxHeight: `${COLLAPSED_PX}px` } : undefined"
    >
      <!-- Already sanitized by the caller. -->
      <div v-if="html" class="prose prose-sm max-w-none text-slate-700" v-html="html" />
      <p v-else-if="text" class="text-sm text-slate-700 leading-relaxed">{{ text }}</p>
      <p v-else class="text-sm text-slate-500">{{ emptyLabel }}</p>

      <!-- The fade is what tells a reader the text continues; a hard cut at a
           full line reads as the end of the description. -->
      <div
        v-if="isCollapsed"
        class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none"
        aria-hidden="true"
      ></div>
    </div>

    <button
      v-if="isOverflowing"
      @click="expanded = !expanded"
      class="mt-1 inline-flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 rounded"
      :style="{ color: 'var(--evt-accent)' }"
      :aria-expanded="expanded"
    >
      {{ expanded ? t('events.drawer.readLess') : t('events.drawer.readMore') }}
      <ChevronDown class="w-4 h-4 transition-transform" :class="{ 'rotate-180': expanded }" />
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * The About passage, clamped.
 *
 * Scraped listings routinely carry twenty lines of boilerplate, which pushed
 * the agenda, map and hosts below a scroll nobody finishes. The clamp is a
 * pixel height rather than `line-clamp`, because the description is arbitrary
 * sanitized HTML — `-webkit-line-clamp` only counts the inline content of the
 * box it is set on, so a description made of `<p>` blocks (the common case)
 * simply isn't clamped by it.
 */

import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface Props {
  /** Sanitized description HTML, when the event has one. */
  html?: string
  /** Plain-text fallback (`short_description`). */
  text?: string | null
  emptyLabel: string
}

const props = withDefaults(defineProps<Props>(), {
  html: '',
  text: null,
})

const { t } = useAppLanguage()

/** ~7 lines of body copy — enough to judge the event, short enough to scroll past. */
const COLLAPSED_PX = 168

const expanded = ref(false)
const isOverflowing = ref(false)
const bodyRef = ref<HTMLElement | null>(null)

const isCollapsed = computed(() => isOverflowing.value && !expanded.value)

/**
 * Measured against the *unclamped* height, so the check has to run with the
 * clamp lifted — hence the two-frame dance rather than a plain `scrollHeight`
 * read, which would report the clamped box on every pass after the first.
 */
const measure = async () => {
  expanded.value = false
  isOverflowing.value = false
  await nextTick()

  const el = bodyRef.value
  if (!el) return
  isOverflowing.value = el.scrollHeight > COLLAPSED_PX + 24
}

onMounted(measure)

// Prev/next swaps the event under this component without remounting it, so a
// long description on one event must not leave the next one clamped.
watch(() => [props.html, props.text], measure)
</script>

<style scoped>
/* Prose styling for the description. Lives here rather than in the drawer
   because scoped rules only reach the markup their own component owns. */
.prose :deep(p) {
  @apply mb-3 leading-relaxed;
}

.prose :deep(strong) {
  @apply font-semibold text-slate-900;
}

.prose :deep(a) {
  @apply text-blue-600 hover:text-blue-700 underline;
}

.prose :deep(ul),
.prose :deep(ol) {
  @apply ml-4 mb-3 space-y-1;
}

.prose :deep(li) {
  @apply leading-relaxed;
}
</style>
