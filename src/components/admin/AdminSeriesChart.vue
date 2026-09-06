<template>
  <figure class="min-w-0">
    <figcaption class="flex items-baseline justify-between gap-3">
      <h3 class="text-sm font-semibold text-slate-900">{{ label }}</h3>
      <p class="flex-shrink-0 text-xs text-slate-500">{{ rangeLabel }}</p>
    </figcaption>

    <div
      class="relative mt-3"
      @pointerleave="hovered = null"
    >
      <!-- The peak is the one point worth naming. A number over every bar is
           noise at 30 columns, and the tooltip covers the rest on demand. -->
      <p class="mb-1 h-4 text-[11px] font-medium tabular-nums text-slate-500">
        <template v-if="max > 0">{{ t('admin.metrics.peak', { value: formatValue(max) }) }}</template>
      </p>

      <div class="flex h-24 items-end gap-[2px]" role="img" :aria-label="summaryLabel">
        <div
          v-for="(point, index) in points"
          :key="point.day"
          class="group relative flex h-full flex-1 cursor-default items-end"
          @pointerenter="hovered = index"
        >
          <!-- The hit target is the whole column, not the bar: on a 30-day
               window a bar can be 1px tall and there would be nothing to hit. -->
          <div
            class="w-full rounded-t-[3px] transition-colors duration-150"
            :class="hovered === index ? 'opacity-100' : 'opacity-85'"
            :style="{
              height: barHeight(point.value),
              backgroundColor: point.value > 0 ? color : 'transparent',
            }"
          />
          <div
            v-if="point.value === 0"
            class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-slate-200"
            aria-hidden="true"
          />
        </div>
      </div>

      <div class="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
        <span>{{ firstLabel }}</span>
        <span>{{ lastLabel }}</span>
      </div>

      <!-- One tooltip, moved, rather than one per column. -->
      <div
        v-if="hoveredPoint"
        class="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg"
        :style="{ left: tooltipLeft }"
        role="status"
      >
        {{ formatDate(hoveredPoint.day) }} · {{ formatValue(hoveredPoint.value) }}
      </div>
    </div>
  </figure>
</template>

<script setup lang="ts">
/**
 * One measure over the metric window, as bars.
 *
 * **One series, one chart.** Revenue and event count are different scales, and
 * putting them on one plot would need two y-axes — which is the single worst
 * thing you can do to a chart, since the crossing point of the two lines is an
 * artefact of where you happened to put the axes. Two charts side by side say
 * the same thing without inventing a relationship.
 *
 * Hand-drawn rather than pulled from `chart.js` (which is in the dependency
 * list but unused anywhere): this is a zero-fill bar strip with one tooltip,
 * and a plotting library would cost the admin chunk far more than it returns
 * while painting in colours that are not the brand's.
 *
 * Days with no activity are drawn as a **hairline on the baseline**, not as
 * nothing: the gap between "no revenue that day" and "the chart ends here" is
 * the whole reason the series is zero-filled in the first place.
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatDate, type AdminSeriesPoint } from './adminDisplay'

const props = defineProps<{
  points: AdminSeriesPoint[]
  label: string
  /** The single series colour. Brand hex — see DESIGN.md. */
  color: string
  formatValue: (value: number) => string
  /** What the window is, e.g. "Last 30 days". */
  rangeLabel: string
}>()

const { t } = useI18n()

const hovered = ref<number | null>(null)

const max = computed(() => props.points.reduce((peak, point) => Math.max(peak, point.value), 0))
const total = computed(() => props.points.reduce((sum, point) => sum + point.value, 0))

/**
 * Bars are proportional to the peak and the axis starts at zero — a truncated
 * baseline makes a 2% difference look like a doubling. The 2px floor is for
 * non-zero days only, so a real but tiny value stays visible without a zero day
 * growing a bar it has not earned.
 */
const barHeight = (value: number): string => {
  if (value <= 0) return '0px'
  if (max.value <= 0) return '2px'
  return `max(2px, ${(value / max.value) * 100}%)`
}

const hoveredPoint = computed(() =>
  hovered.value === null ? null : (props.points[hovered.value] ?? null),
)

/** Centre of the hovered column, as a percentage of the plot's width. */
const tooltipLeft = computed(() => {
  if (hovered.value === null || props.points.length === 0) return '50%'
  return `${((hovered.value + 0.5) / props.points.length) * 100}%`
})

const firstLabel = computed(() =>
  props.points.length ? formatDate(props.points[0].day) : '',
)
const lastLabel = computed(() =>
  props.points.length ? formatDate(props.points[props.points.length - 1].day) : '',
)

/** Screen readers get the shape as a sentence; the table is the plot itself. */
const summaryLabel = computed(() =>
  t('admin.metrics.chartSummary', {
    label: props.label,
    total: props.formatValue(total.value),
    days: props.points.length,
  }),
)
</script>
