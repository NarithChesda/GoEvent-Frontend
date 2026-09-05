<template>
  <!--
    The list's primary axis — which set of events you are looking at — as a real
    segmented control: a recessed track with one raised white thumb that travels
    between the options.

    Two things changed from the version this replaces. The thumb was a brand
    gradient, which made a *view selector* the loudest object on a page whose
    subject is its own content, and put a second gradient on screen beside the
    Create Event action that should own it. And it was painted per segment,
    which meant it could not move at all: `background-image` is not
    interpolable, so the fill popped from one option to the next. One travelling
    element is never redrawn, only relocated — the same mechanism the mobile tab
    bar and the desktop nav's selection use, through the same composable, so
    every selection marker in the app moves alike.

    Desktop only. Below the nav breakpoint this row *is* the mobile top bar's
    contents, where there is no room for three labels beside a title, a search
    button and a language button — ListFilterSheet stands in for both filters
    there, with one pill and one sheet.

    `tone` repaints it and never resizes it: the desktop nav absorbs this
    control at full size once the page header scrolls away, and it has to land
    on the same pixels it left.
  -->
  <div
    ref="trackRef"
    class="lfc-track relative flex items-center gap-0.5 p-1 rounded-full"
    :class="isAbsorbed ? 'lfc-surface--nav' : 'lfc-surface--page'"
    role="group"
    :aria-label="t('events.filters.filterLabel')"
  >
    <span
      v-show="indicator.visible"
      class="lfc-thumb absolute top-1 bottom-1 left-0 rounded-full pointer-events-none will-change-transform"
      :style="{ width: `${indicator.w}px`, transform: `translateX(${indicator.x}px)` }"
      aria-hidden="true"
    />
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="lfc-press relative flex items-center justify-center h-8 px-3.5 rounded-full text-sm font-medium tracking-[-0.01em] whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ecc71]/40"
      :class="isActive(option.value) ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'"
      :aria-current="isActive(option.value) ? 'true' : undefined"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useHeaderTone, useNavPageControls } from '@/composables/useNavPageControls'
import { useTravellingIndicator } from '@/composables/useTravellingIndicator'

export interface FilterOption {
  value: string
  label: string
}

const { t, locale } = useAppLanguage()

const props = defineProps<{
  modelValue: string
  options: FilterOption[]
  /**
   * Palette only — never geometry. `nav` drops the page card for surfaces that
   * belong to a bar, so the control reads as part of the chrome instead of a
   * card floating on it. Left unset it follows where the page header currently
   * lives — see useHeaderTone.
   */
  tone?: 'page' | 'nav'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const resolvedTone = useHeaderTone(() => props.tone)

// Wearing the bar's palette *and* sitting on the desktop nav — the one place
// this control is a guest on someone else's glass, with page content scrolling
// underneath it.
const { isDesktopNav } = useNavPageControls()
const isAbsorbed = computed(() => resolvedTone.value === 'nav' && isDesktopNav.value)

// No memory key: unlike the nav bars this control is not rebuilt on navigation,
// and Events and Discover would otherwise seed each other with a value that is
// not among the other's options.
const trackRef = ref<HTMLElement | null>(null)
const { indicator, isActive, settle } = useTravellingIndicator({
  row: trackRef,
  path: computed(() => props.modelValue),
  activeSelector: '[aria-current="true"]',
})

// Relabelling the options resizes them, and Discover gains a third option when
// the user signs in. Neither is a selection change, so the thumb repositions
// rather than travelling. (The viewport and the laptop scale-down are already
// covered by the composable's own ResizeObserver on the track.)
watch(locale, () => nextTick(settle))
watch(() => props.options.length, () => nextTick(settle))
</script>
