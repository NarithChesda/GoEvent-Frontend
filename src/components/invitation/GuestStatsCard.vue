<template>
  <!-- Invitation progress, as a fixed-size object that shares the toolbar's
       row.

       A ring rather than a bar, because a bar's natural size is the width it
       is given — it only looks right when it can span, and here it cannot: it
       sits beside a search field. A ring is the opposite, fixed and small, and
       reading the same at any row width. The total lives in the hole it
       already leaves, so the whole summary costs about 170px.

       The legend is glyphs, not words. `Viewed 34  Awaiting 0  Pending 4`
       spends most of its width on three labels that never change, and the
       glyphs it spends it on instead are the ones the rows below already
       use — a double tick for opened, a single for sent, an empty ring for
       not yet — so the legend doubles as the key for the list. The words are
       on the hover tooltip and in the accessible name. -->
  <div
    v-if="loading && !hasStats"
    class="flex items-center gap-3"
    aria-hidden="true"
  >
    <div class="h-10 w-10 shrink-0 animate-pulse rounded-full border-[6px] border-slate-100"></div>
    <div class="flex gap-3">
      <div v-for="n in 3" :key="n" class="h-3 w-8 animate-pulse rounded bg-slate-100"></div>
    </div>
  </div>

  <div v-else class="flex items-center gap-3 transition-opacity" :class="{ 'opacity-60': loading }">
    <!-- Ring + total -->
    <div class="relative shrink-0" :title="ringLabel">
      <svg viewBox="0 0 100 100" class="h-10 w-10 -rotate-90" role="img" :aria-label="ringLabel">
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

      <!-- The total sits in the clear space inside the ring — ~30px at this
           stroke — so the size steps down as the digits grow rather than
           overflowing it. -->
      <p
        class="pointer-events-none absolute inset-0 flex items-center justify-center font-semibold leading-none tabular-nums text-slate-900"
        :class="totalGuests > 999 ? 'text-[9px]' : totalGuests > 99 ? 'text-[10px]' : 'text-xs'"
        aria-hidden="true"
      >
        {{ totalGuests }}
      </p>
    </div>

    <!-- Legend. Every count is a number on screen, so nothing here depends on
         reading the colour of the glyph beside it. -->
    <dl class="flex items-center gap-x-3">
      <div
        v-for="segment in segments"
        :key="segment.key"
        class="flex cursor-default items-center gap-1"
        :title="`${segment.label}: ${segment.count} (${segment.percent}%)`"
      >
        <dt class="flex items-center">
          <component :is="segment.icon" class="h-3.5 w-3.5" :class="segment.iconClass" aria-hidden="true" />
          <span class="sr-only">{{ segment.label }}</span>
        </dt>
        <dd class="text-xs font-semibold leading-none tabular-nums text-slate-900">{{ segment.count }}</dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, CheckCheck, Circle } from 'lucide-vue-next'
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
// whichever is larger as "reached" and clamp to the total, which keeps the
// three segments mutually exclusive and summing to exactly `total_guests`.
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

// Ordered as the invitation funnel runs, and drawn in this order around the
// ring. Each glyph is the one a guest row in that state carries.
const segments = computed(() => [
  {
    key: 'viewed',
    label: t('management.guestGroupsView.statsCard.viewed'),
    count: viewedInvitations.value,
    percent: percentage(viewedInvitations.value),
    icon: CheckCheck,
    iconClass: 'text-emerald-600',
    strokeClass: 'stroke-emerald-500',
  },
  {
    key: 'awaiting',
    label: t('management.guestGroupsView.statsCard.awaiting'),
    count: awaitingViewInvitations.value,
    percent: percentage(awaitingViewInvitations.value),
    icon: Check,
    iconClass: 'text-sky-600',
    strokeClass: 'stroke-sky-500',
  },
  {
    key: 'pending',
    label: t('management.guestGroupsView.statsCard.pending'),
    count: pendingInvitations.value,
    percent: percentage(pendingInvitations.value),
    icon: Circle,
    iconClass: 'text-slate-400',
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
 *  total and the split in words. It is the hover tooltip too. */
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
