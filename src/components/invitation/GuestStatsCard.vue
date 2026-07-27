<template>
  <!-- Slim stats band — sits as the header row of the guest list panel.
       Loading skeleton on first load only; a refetch dims the previous render
       instead of flashing back to skeleton. -->
  <div
    v-if="loading && !hasStats"
    class="flex items-center gap-3 px-3 py-3 sm:gap-5 sm:px-4"
    aria-hidden="true"
  >
    <div class="h-12 w-12 shrink-0 animate-pulse rounded-full border-[7px] border-slate-100 sm:h-14 sm:w-14 sm:border-8"></div>
    <div class="h-8 w-10 shrink-0 animate-pulse rounded bg-slate-100"></div>
    <div class="grid min-w-0 flex-1 grid-cols-3 gap-2 sm:gap-4">
      <div v-for="n in 3" :key="n" class="space-y-1.5">
        <div class="h-2.5 w-full max-w-[64px] animate-pulse rounded bg-slate-100"></div>
        <div class="h-3.5 w-8 animate-pulse rounded bg-slate-100"></div>
      </div>
    </div>
  </div>

  <div
    v-else
    class="flex items-center gap-3 px-3 py-3 transition-opacity sm:gap-5 sm:px-4"
    :class="{ 'opacity-60': loading }"
  >
    <!-- Donut: the three invitation stages as one part-to-whole ring.
         Purely visual — every value is also in the legend. -->
    <svg
      viewBox="0 0 100 100"
      class="h-12 w-12 shrink-0 -rotate-90 sm:h-14 sm:w-14"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="50" cy="50" :r="RADIUS" fill="none" :stroke-width="STROKE" class="stroke-slate-100" />
      <circle
        v-for="arc in arcs"
        :key="arc.key"
        cx="50"
        cy="50"
        :r="RADIUS"
        fill="none"
        :stroke-width="STROKE"
        stroke-linecap="butt"
        :stroke-dasharray="`${arc.dash} ${CIRCUMFERENCE - arc.dash}`"
        :stroke-dashoffset="arc.offset"
        :class="['donut-arc', arc.strokeClass]"
      >
        <title>{{ `${arc.label}: ${arc.count} (${arc.percent}%)` }}</title>
      </circle>
    </svg>

    <!-- Total -->
    <div class="shrink-0">
      <p class="text-xl font-semibold leading-none text-slate-900 sm:text-2xl" aria-live="polite">
        {{ totalGuests }}
      </p>
      <p class="mt-1.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-slate-400">
        {{ t('management.guestGroupsView.statsCard.invited') }}
      </p>
    </div>

    <div class="hidden h-8 w-px shrink-0 bg-slate-100 sm:block" aria-hidden="true"></div>

    <!-- Legend: carries the numbers so nothing depends on colour alone -->
    <dl class="grid min-w-0 flex-1 grid-cols-3 gap-2 sm:gap-4">
      <div v-for="segment in segments" :key="segment.key" class="min-w-0">
        <dt class="flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="segment.dotClass" aria-hidden="true"></span>
          <span class="truncate text-[11px] font-medium leading-none text-slate-500 sm:text-xs">
            {{ segment.label }}
          </span>
        </dt>
        <dd class="mt-1.5 flex items-baseline gap-1.5">
          <span class="text-sm font-semibold leading-none tabular-nums text-slate-900 sm:text-base">
            {{ segment.count }}
          </span>
          <span class="text-[10px] font-medium leading-none tabular-nums text-slate-400 sm:text-[11px]">
            {{ segment.percent }}%
          </span>
        </dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { GuestStats } from '../../services/api'

interface Props {
  stats: GuestStats | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const { t } = useI18n()

const RADIUS = 42
const STROKE = 13
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
// Arc-length equivalent of the ~2px surface gap between adjacent segments.
const SEGMENT_GAP = 4

const hasStats = computed(() => props.stats !== null)

const totalGuests = computed(() => props.stats?.total_guests || 0)
const rawSent = computed(() => props.stats?.sent || 0)
const rawViewed = computed(() => props.stats?.viewed || 0)

// A guest can open an invite that was never marked "sent" (the host shared the
// link out of band), so `viewed` is not reliably a subset of `sent`. Take
// whichever is larger as "reached" and clamp to the total, which keeps the three
// segments mutually exclusive and summing to exactly `total_guests`. The old
// tiles derived pending straight from `total - sent`, so viewed + awaiting +
// pending could exceed the total and overflow the bar.
const reached = computed(() =>
  Math.min(Math.max(rawSent.value, rawViewed.value), totalGuests.value),
)
const viewedInvitations = computed(() => Math.min(rawViewed.value, reached.value))
const awaitingViewInvitations = computed(() => reached.value - viewedInvitations.value)
const pendingInvitations = computed(() => totalGuests.value - reached.value)

const percentage = (count: number) => {
  if (totalGuests.value === 0) return 0
  return Math.round((count / totalGuests.value) * 100)
}

interface Segment {
  key: string
  label: string
  count: number
  percent: number
  dotClass: string
  strokeClass: string
}

// Ordered as the invitation funnel runs, and drawn in this order around the ring.
const segments = computed<Segment[]>(() => [
  {
    key: 'viewed',
    label: t('management.guestGroupsView.statsCard.viewed'),
    count: viewedInvitations.value,
    percent: percentage(viewedInvitations.value),
    dotClass: 'bg-emerald-600',
    strokeClass: 'stroke-emerald-600',
  },
  {
    key: 'awaiting',
    label: t('management.guestGroupsView.statsCard.awaiting'),
    count: awaitingViewInvitations.value,
    percent: percentage(awaitingViewInvitations.value),
    dotClass: 'bg-sky-600',
    strokeClass: 'stroke-sky-600',
  },
  {
    key: 'pending',
    label: t('management.guestGroupsView.statsCard.pending'),
    count: pendingInvitations.value,
    percent: percentage(pendingInvitations.value),
    dotClass: 'bg-slate-300',
    strokeClass: 'stroke-slate-300',
  },
])

const arcs = computed(() => {
  const total = totalGuests.value
  if (total <= 0) return []

  const visible = segments.value.filter((segment) => segment.count > 0)
  let cursor = 0

  return visible.map((segment) => {
    const length = (segment.count / total) * CIRCUMFERENCE
    // Only carve a gap when there's a neighbour to separate from, and never eat
    // more than half a segment (a 1-guest slice must still be visible).
    const gap = visible.length > 1 ? Math.min(SEGMENT_GAP, length * 0.5) : 0
    const arc = {
      key: segment.key,
      label: segment.label,
      count: segment.count,
      percent: segment.percent,
      strokeClass: segment.strokeClass,
      dash: Math.max(length - gap, 1.5),
      offset: -cursor,
    }
    cursor += length
    return arc
  })
})
</script>

<style scoped>
.donut-arc {
  transition:
    stroke-dasharray 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    stroke-dashoffset 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .donut-arc {
    transition: none;
  }
}
</style>
