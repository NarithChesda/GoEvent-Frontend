<template>
  <!-- Slim stats band — the panel's header, sharing a row with the toolbar
       from `2xl` up. Loading skeleton on first load only; a refetch dims the
       previous render instead of flashing back to skeleton. -->
  <div
    v-if="loading && !hasStats"
    class="flex h-full items-center justify-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 2xl:justify-start"
    aria-hidden="true"
  >
    <div class="h-10 w-10 shrink-0 animate-pulse rounded-full border-[6px] border-slate-100"></div>
    <div class="flex min-w-0 gap-4">
      <div v-for="n in 3" :key="n" class="h-2.5 w-20 animate-pulse rounded bg-slate-100"></div>
    </div>
  </div>

  <!-- A ring, not a bar.
       The two share this row with the search field now, and a meter's natural
       size is the width it is given — it only looks right when it can span.
       A ring is the opposite: fixed, small, and it reads the same at any row
       width. Putting the total *inside* it also folds two things into one, so
       the whole summary costs about 200px instead of the full half-panel. -->
  <div
    v-else
    class="flex h-full items-center justify-center gap-3 px-3 py-3 transition-opacity sm:gap-4 sm:px-4 2xl:justify-start"
    :class="{ 'opacity-60': loading }"
  >
    <!-- Ring + total -->
    <div class="relative shrink-0">
      <svg
        viewBox="0 0 100 100"
        class="h-10 w-10 -rotate-90"
        role="img"
        :aria-label="ringLabel"
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
        />
      </svg>

      <!-- The total lives in the hole the ring already leaves — the clear space
           inside a 40px ring at this stroke is ~30px, so the size steps down
           as the digits grow rather than overflowing. -->
      <p
        class="pointer-events-none absolute inset-0 flex items-center justify-center font-semibold leading-none tabular-nums text-slate-900"
        :class="totalGuests > 999 ? 'text-[9px]' : totalGuests > 99 ? 'text-[10px]' : 'text-xs'"
        aria-hidden="true"
      >
        {{ totalGuests }}
      </p>
    </div>

    <!-- Legend. It carries every number, so nothing depends on colour alone.
         One horizontal strip at every width — the header is a single row, and
         a ring beside a three-row stack was a two-axis object dropped into it:
         taller than the search field next to it, and reading as a block rather
         than as part of the strip. -->
    <dl class="flex min-w-0 items-center gap-x-3 sm:gap-x-4">
      <div v-for="segment in segments" :key="segment.key" class="flex min-w-0 items-center gap-1.5">
        <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="segment.dotClass" aria-hidden="true"></span>
        <dt class="truncate text-[11px] font-medium leading-none text-slate-500">
          {{ segment.label }}
        </dt>
        <dd class="text-[11px] font-semibold leading-none tabular-nums text-slate-900">
          {{ segment.count }}
        </dd>
        <!-- The share is what the ring already draws, and on a phone it is the
             difference between a strip that fits and one that wraps, so there
             the count carries it alone. -->
        <dd class="hidden text-[10px] font-medium leading-none tabular-nums text-slate-400 sm:block">
          {{ segment.percent }}%
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
// pending could exceed the total and overflow the ring.
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

/** The ring is `role="img"` and its centre number is `aria-hidden`, so this is
 *  the only thing a screen reader gets from the chart — it has to state the
 *  total and the split in words. */
const ringLabel = computed(
  () =>
    `${t('management.guestGroupsView.statsCard.invited')}: ${totalGuests.value}. ` +
    segments.value.map((s) => `${s.label}: ${s.count} (${s.percent}%)`).join(', '),
)
</script>

<style scoped>
.donut-arc {
  transition:
    stroke-dasharray 0.5s cubic-bezier(0.23, 1, 0.32, 1),
    stroke-dashoffset 0.5s cubic-bezier(0.23, 1, 0.32, 1);
}

@media (prefers-reduced-motion: reduce) {
  .donut-arc {
    transition: none;
  }
}
</style>
