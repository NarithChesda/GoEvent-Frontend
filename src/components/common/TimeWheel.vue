<template>
  <div class="tw" :style="{ '--tw-rows': String(VISIBLE_ROWS) }">
    <!-- The selection band sits under both columns, so the value that reads as
         chosen is simply the one the snap put in the middle. -->
    <div class="tw-band" aria-hidden="true">
      <span class="tw-colon">:</span>
    </div>

    <div
      v-for="col in columns"
      :key="col.name"
      :ref="(el) => setColumnRef(col.name, el as HTMLElement | null)"
      role="listbox"
      tabindex="0"
      :aria-label="col.label"
      :aria-activedescendant="`${uid}-${col.name}-${col.value}`"
      class="tw-col"
      @scroll.passive="onScroll(col.name)"
      @keydown="onKeydown($event, col)"
    >
      <button
        v-for="(option, index) in col.options"
        :id="`${uid}-${col.name}-${option}`"
        :key="option"
        type="button"
        role="option"
        tabindex="-1"
        :aria-selected="option === col.value"
        :aria-label="col.optionLabel(option)"
        class="tw-cell tabular-nums"
        :class="option === col.value ? 'tw-cell--on' : ''"
        @click="commit(col.name, index)"
      >
        {{ pad(option) }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { pad } from './dateTimeValue'

/**
 * The hour and minute halves of a time, as two snap-scrolling columns.
 *
 * Replaces a pair of nested popover listboxes. Those were a dropdown opened
 * from inside a popover which was itself opened from inside a drawer — three
 * stacked layers to answer one question, and on a phone the innermost one had
 * to fit inside a bottom sheet that was already scrolling. A wheel answers it
 * in the surface the user is already looking at: the scroll *is* the choice,
 * so there is nothing to open and nothing to dismiss.
 *
 * Deliberately built on native overflow scrolling rather than a pointer-driven
 * transform. The browser already gives momentum, rubber-banding at the ends,
 * interruption mid-fling and the platform's own scroll feel for free, and a
 * hand-rolled version of those is a worse copy of all four.
 */

interface Props {
  hour: number
  minute: number
  /**
   * Minutes are offered on this grid; an off-grid value is inserted so a time
   * already saved as 6:07 stays both reachable and visible.
   */
  minuteStep?: number
}

const props = withDefaults(defineProps<Props>(), { minuteStep: 5 })

const emit = defineEmits<{
  (e: 'update:hour', value: number): void
  (e: 'update:minute', value: number): void
}>()

const { t } = useAppLanguage()
const uid = useId()

/** Odd, so exactly one row is centred and the neighbours are symmetric. */
const VISIBLE_ROWS = 3
/**
 * A snap settles well inside this; long enough that a slow drag is not read as
 * a decision made halfway through it.
 */
const SETTLE_MS = 120

type ColumnName = 'hour' | 'minute'

const hourOptions = Array.from({ length: 24 }, (_, i) => i)

const minuteOptions = computed(() => {
  const step = Math.max(1, props.minuteStep)
  const options = Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step)
  if (!options.includes(props.minute)) {
    options.push(props.minute)
    options.sort((a, b) => a - b)
  }
  return options
})

interface Column {
  name: ColumnName
  label: string
  options: number[]
  value: number
  optionLabel: (option: number) => string
}

const columns = computed<Column[]>(() => [
  {
    name: 'hour',
    label: t('common.dateTimePicker.hour'),
    options: hourOptions,
    value: props.hour,
    optionLabel: (option) => `${t('common.dateTimePicker.hour')} ${pad(option)}`,
  },
  {
    name: 'minute',
    label: t('common.dateTimePicker.minute'),
    options: minuteOptions.value,
    value: props.minute,
    optionLabel: (option) => `${t('common.dateTimePicker.minute')} ${pad(option)}`,
  },
])

const columnEls = ref<Record<ColumnName, HTMLElement | null>>({ hour: null, minute: null })
const setColumnRef = (name: ColumnName, el: HTMLElement | null) => {
  columnEls.value[name] = el
}

const optionsFor = (name: ColumnName): number[] =>
  name === 'hour' ? hourOptions : minuteOptions.value
const valueFor = (name: ColumnName): number => (name === 'hour' ? props.hour : props.minute)

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Measured, never assumed. Every length here is `rem`, and the app scales the
 * root font to 75% on short laptop viewports — a hard-coded 40 would land the
 * wheel one row off there and nowhere else.
 */
const cellHeight = (el: HTMLElement): number =>
  (el.firstElementChild as HTMLElement | null)?.getBoundingClientRect().height || 1

const scrollToValue = (name: ColumnName, smooth: boolean) => {
  const el = columnEls.value[name]
  if (!el) return
  const index = optionsFor(name).indexOf(valueFor(name))
  if (index < 0) return

  const target = index * cellHeight(el)
  // Already there, within a rounding hair. Scrolling anyway would restart
  // momentum under a finger that is still on the glass.
  if (Math.abs(el.scrollTop - target) < 1) return

  // `scrollTo` is absent in jsdom, and an assignment to `scrollTop` is the
  // same instantaneous move every browser makes when smooth is off anyway.
  if (typeof el.scrollTo === 'function') {
    el.scrollTo({ top: target, behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' })
  } else {
    el.scrollTop = target
  }
}

const commit = (name: ColumnName, index: number) => {
  const option = optionsFor(name)[index]
  if (option === undefined || option === valueFor(name)) return
  // Branched rather than computing the event name: the emit overloads are
  // per-event, so a union of names matches neither of them.
  if (name === 'hour') emit('update:hour', option)
  else emit('update:minute', option)
}

const timers: Partial<Record<ColumnName, number>> = {}

/**
 * There is no "this scroll was mine" flag, and that is the point: a settle
 * only emits when the row it lands on differs from the current value, so a
 * programmatic scroll to the current value resolves to itself and stays quiet.
 * A flag would have to be cleared on a timer racing the smooth scroll it
 * exists to guard.
 */
const onScroll = (name: ColumnName) => {
  window.clearTimeout(timers[name])
  timers[name] = window.setTimeout(() => {
    const el = columnEls.value[name]
    if (!el) return
    const index = Math.round(el.scrollTop / cellHeight(el))
    commit(name, Math.max(0, Math.min(index, optionsFor(name).length - 1)))
  }, SETTLE_MS)
}

const onKeydown = (event: KeyboardEvent, col: Column) => {
  const index = col.options.indexOf(col.value)
  const last = col.options.length - 1
  let next = index

  switch (event.key) {
    case 'ArrowDown':
      next = Math.min(index + 1, last)
      break
    case 'ArrowUp':
      next = Math.max(index - 1, 0)
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = last
      break
    default:
      return
  }

  event.preventDefault()
  commit(col.name, next)
}

watch(
  () => props.hour,
  () => scrollToValue('hour', true),
)
watch(
  () => props.minute,
  () => scrollToValue('minute', true),
)

onMounted(async () => {
  await nextTick()
  scrollToValue('hour', false)
  scrollToValue('minute', false)
})

onBeforeUnmount(() => {
  window.clearTimeout(timers.hour)
  window.clearTimeout(timers.minute)
})
</script>

<style scoped>
/*
  Shrink-wrapped and centred, not stretched to the panel.

  Two `1fr` columns put the hour at the far left of the field and the minute at
  the far right, with the colon marooned between them — 11 and 14 read as two
  unrelated numbers rather than as one time. Fixed columns keep the pair the
  width of the value it spells.
*/
.tw {
  --tw-cell: 2.5rem;
  --tw-col-w: 4.5rem;
  position: relative;
  display: grid;
  grid-template-columns: var(--tw-col-w) var(--tw-col-w);
  gap: 0.5rem;
  width: max-content;
  margin-inline: auto;
  height: calc(var(--tw-cell) * var(--tw-rows));
}

/* The band is the answer, so it is drawn once behind both columns rather than
   as a selected state on a row that is itself free to scroll away. */
.tw-band {
  position: absolute;
  /* A hair wider than the columns, so the band frames the pair. */
  inset-inline: -0.375rem;
  top: 50%;
  height: var(--tw-cell);
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background-color: rgb(241 245 249); /* slate-100 */
  pointer-events: none;
}

.tw-colon {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1;
  color: rgb(148 163 184); /* slate-400 */
}

.tw-col {
  position: relative;
  z-index: 1;
  width: var(--tw-col-w);
  height: 100%;
  overflow-y: auto;
  /* Without this the last flick of a wheel scrolls the drawer behind it. */
  overscroll-behavior: contain;
  scroll-snap-type: y mandatory;
  /* Half a wheel of blank above and below, so the first and last values can
     still reach the middle. */
  padding-block: calc((var(--tw-cell) * (var(--tw-rows) - 1)) / 2);
  scrollbar-width: none;
  border-radius: 0.5rem;
  /* Values fade towards the edges instead of being clipped mid-glyph. */
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 25%,
    #000 75%,
    transparent 100%
  );
  mask-image: linear-gradient(to bottom, transparent 0, #000 25%, #000 75%, transparent 100%);
}

.tw-col::-webkit-scrollbar {
  display: none;
}

.tw-col:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgb(186 230 253); /* sky-200 */
}

.tw-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--tw-cell);
  scroll-snap-align: center;
  font-size: 1.125rem;
  font-weight: 500;
  color: rgb(148 163 184); /* slate-400 */
  opacity: 0.7;
  transition:
    color 0.18s ease-out,
    opacity 0.18s ease-out;
}

.tw-cell--on {
  color: rgb(15 23 42); /* slate-900 */
  font-weight: 600;
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .tw-col {
    scroll-behavior: auto;
  }

  .tw-cell {
    transition: none;
  }
}
</style>
