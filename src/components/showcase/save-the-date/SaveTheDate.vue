<template>
  <component :is="designComponent" v-bind="designProps" :style="contractStyle" />
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import type {
  SaveTheDateDesignConfig,
  SaveTheDateDesignType,
} from '@/services/api/types/template.types'
import type { SaveTheDateParts } from './types'

import StdScript from './designs/StdScript.vue'
import StdEngraved from './designs/StdEngraved.vue'
import StdMinimal from './designs/StdMinimal.vue'
import StdColumns from './designs/StdColumns.vue'
import StdMedallion from './designs/StdMedallion.vue'
import StdPoster from './designs/StdPoster.vue'

/**
 * The transition stage's Save the Date title card.
 *
 * Both transition stages mount this and get the same six compositions; which one
 * renders is the template's call (`template_assets.save_the_date_design`),
 * exactly as `host_info_design` picks a host layout. What stays the *stage's*
 * call is everything around the composition — the ground it sits on, the ink it
 * is drawn in, and when it is allowed to start — because those belong to the
 * stage, not to the design. They come in as the props below and leave as the CSS
 * contract documented at the top of save-the-date-base.css.
 *
 * The one place this differs from `host_info_design`: the fallback is
 * **per-stage**, not global. A template that has never set the field has to keep
 * the look its stage shipped with — `script` on the decoration transition,
 * `engraved` on the door — so `fallback` is a required prop rather than a
 * default baked in here.
 */
interface Props {
  /** The template's choice. Absent / null / unknown falls back to `fallback`. */
  design?: SaveTheDateDesignConfig | null
  /** The design this stage shipped with, used whenever the template has none. */
  fallback: SaveTheDateDesignType
  /** The host stage's reveal flag — arms every beat in the design. */
  revealed: boolean
  /** ISO start date. Formatted here so both stages agree by construction. */
  eventStartDate?: string | null
  /** The label copy. */
  label?: string
  /** Which fill the stage's ground calls for. See save-the-date-base.css. */
  ink: 'solid' | 'metal'
  /** Base copy colour. */
  inkColor: string
  /** One step lighter than the ink — a sheen's mid tone. */
  inkLightColor: string
  /** The specular hotspot a sheen or gleam passes through. */
  hotColor: string
  /**
   * Text-shadow stack separating the copy from its ground. Pass nothing from a
   * stage that casts one shadow over the whole block instead (the door does).
   */
  halo?: string | null
  /**
   * When this block may begin, measured from `revealed` flipping. The stage's
   * clock, not the design's: the decoration transition's footer scrim has
   * already risen by then (0ms), while the door's leaves are still gathering
   * and its frame has only just drawn (1000ms).
   */
  startDelayMs?: number
  /** Optional face for the date lines. Unset keeps the design's display serif. */
  dateFont?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  design: null,
  eventStartDate: null,
  label: 'Save the Date',
  halo: null,
  startDelayMs: 0,
  dateFont: null,
})

const DESIGNS = {
  script: StdScript,
  engraved: StdEngraved,
  minimal: StdMinimal,
  columns: StdColumns,
  medallion: StdMedallion,
  poster: StdPoster,
} as const

const designComponent = computed(() => {
  const type = props.design?.type
  // An unknown `type` is treated as absent rather than as an error: the value is
  // backend-served, and an event saved against a newer option set must still
  // render this stage rather than blank the middle of the showcase.
  return (type && DESIGNS[type]) || DESIGNS[props.fallback]
})

// --- Reduced motion --------------------------------------------------------
// The stage offset is the one part of the contract set inline, and inline wins
// over any stylesheet — so it can't be zeroed from the media query in
// save-the-date-base.css. Zero it here instead. Read live rather than once at
// setup: the manage-page preview frame replays this block, and a guest can
// change the setting between visits.

const reducedMotion = ref(false)
let motionQuery: MediaQueryList | null = null
const onMotionChange = (event: MediaQueryListEvent) => {
  reducedMotion.value = event.matches
}

if (typeof window !== 'undefined' && window.matchMedia) {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = motionQuery.matches
  motionQuery.addEventListener('change', onMotionChange)
}

onUnmounted(() => motionQuery?.removeEventListener('change', onMotionChange))

// --- The date --------------------------------------------------------------
// One formatter for both stages. They each rolled their own before this — the
// door padding its numerals, the decoration only ever producing a long form —
// which is exactly the drift that shows the moment the same design can run on
// either stage.

const eventDate = computed(() => {
  if (!props.eventStartDate) return null
  const date = new Date(props.eventStartDate)
  return Number.isNaN(date.getTime()) ? null : date
})

const pad = (n: number) => String(n).padStart(2, '0')

/** The long form, e.g. `Saturday, December 6, 2026`. */
const longDate = computed(() => {
  const date = eventDate.value
  if (!date) return null
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

/** The cartouche form, e.g. `06 · 12 · 2026`. */
const numericDate = computed(() => {
  const date = eventDate.value
  if (!date) return null
  return `${pad(date.getDate())} · ${pad(date.getMonth() + 1)} · ${date.getFullYear()}`
})

const parts = computed<SaveTheDateParts | null>(() => {
  const date = eventDate.value
  if (!date) return null
  return {
    day: pad(date.getDate()),
    month: pad(date.getMonth() + 1),
    monthShort: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    monthLong: date.toLocaleDateString('en-US', { month: 'long' }),
    year: String(date.getFullYear()),
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
  }
})

// --- The contract ----------------------------------------------------------

const contractStyle = computed<Record<string, string>>(() => {
  const style: Record<string, string> = {
    '--std-ink': props.inkColor,
    '--std-ink-lit': props.inkLightColor,
    '--std-hot': props.hotColor,
    '--std-halo': props.halo ?? 'none',
    '--std-t0': reducedMotion.value ? '0ms' : `${props.startDelayMs}ms`,
  }
  if (props.dateFont) style['--std-date-font'] = props.dateFont
  return style
})

const designProps = computed(() => ({
  revealed: props.revealed,
  label: props.label,
  longDate: longDate.value,
  numericDate: numericDate.value,
  parts: parts.value,
  ink: props.ink,
  inkColor: props.inkColor,
  hotColor: props.hotColor,
}))
</script>

<!--
  Deliberately NOT scoped, and loaded here rather than from each design.

  Vue rewrites `@keyframes` names inside a scoped block, per component. The six
  designs reference the shared gestures (stdWipe, stdRuleDraw, stdSheen…) from
  their own scoped blocks, so a scoped copy per design would give each one a
  differently-mangled name and none of them would resolve. Loading it once,
  globally, keeps the names stable — and keeps one copy of the stylesheet in the
  bundle instead of six. Every selector in the file sits under `.std`, and every
  class carries the `std-` prefix, so nothing here reaches outside this block.
-->
<style src="./save-the-date-base.css"></style>
