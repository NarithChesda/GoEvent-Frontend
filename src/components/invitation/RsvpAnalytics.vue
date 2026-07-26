<template>
  <div class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60">
    <!-- Header -->
    <div class="mb-6 flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
          {{ t('management.rsvpAnalytics.title') }}
        </p>
        <p class="mt-1 text-sm text-slate-500">
          {{ t('management.rsvpAnalytics.subtitle') }}
        </p>
      </div>
      <button
        type="button"
        class="inline-flex min-h-[40px] min-w-[40px] flex-shrink-0 items-center justify-center rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="loading"
        :aria-label="t('management.rsvpAnalytics.refresh')"
        :title="t('management.rsvpAnalytics.refresh')"
        @click="loadSummary"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
      </button>
    </div>

    <!-- Loading skeleton (first load only — refreshes keep content visible) -->
    <div v-if="loading && !summary" class="animate-pulse space-y-8" aria-hidden="true">
      <!-- Mirrors the donut + legend / stat-tile split below -->
      <div class="grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div class="flex items-center gap-4 rounded-2xl bg-slate-100 p-4 sm:gap-6 sm:p-5">
          <div class="h-32 w-32 flex-shrink-0 rounded-full bg-slate-200 sm:h-36 sm:w-36" />
          <div class="flex-1 space-y-2.5">
            <div v-for="i in 4" :key="i" class="h-3 rounded bg-slate-200" />
          </div>
        </div>
        <div class="h-32 rounded-2xl bg-slate-100 lg:h-auto" />
      </div>
      <div class="space-y-3">
        <div v-for="i in 2" :key="i" class="h-16 rounded-2xl bg-slate-100" />
      </div>
    </div>

    <!-- Empty: no summary or zero invited -->
    <div
      v-else-if="!summary || summary.total_invited === 0"
      class="py-12 text-center"
    >
      <div
        class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20"
      >
        <ClipboardList class="h-7 w-7 text-[#2ecc71]" />
      </div>
      <p class="text-base font-semibold text-slate-900">
        {{ t('management.rsvpAnalytics.empty.title') }}
      </p>
      <p class="mx-auto mt-1 max-w-md text-sm text-slate-500">
        {{ t('management.rsvpAnalytics.empty.description') }}
      </p>
    </div>

    <!-- Content -->
    <div v-else class="flex flex-col gap-8">
      <!-- ================================================================
        Section 1 · Response
        One question — "have you replied, and how?" — split into four
        mutually exclusive answers, so this is part-to-whole at a glance:
        a donut, with the response rate as the centre KPI and the legend
        carrying the exact counts. Palette validated with the dataviz
        validator (worst adjacent CVD ΔE 10.8 protan / 22.9 normal);
        pending is a deliberate neutral remainder, and every segment is
        named + counted in the legend, so nothing reads on colour alone.
      ================================================================= -->
      <section class="grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div class="rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5">
          <div class="flex items-center gap-4 sm:gap-6">
            <!-- Donut -->
            <div class="relative h-32 w-32 flex-shrink-0 sm:h-36 sm:w-36">
              <svg
                class="h-full w-full -rotate-90"
                viewBox="0 0 42 42"
                role="img"
                :aria-label="
                  t('management.rsvpAnalytics.metrics.responseRateDesc', {
                    responded: respondedCount,
                    invited: summary.total_invited,
                  })
                "
              >
                <circle
                  cx="21"
                  cy="21"
                  r="15.9155"
                  fill="none"
                  stroke="#f1f5f9"
                  stroke-width="4.5"
                />
                <circle
                  v-for="seg in donutSegments"
                  :key="seg.key"
                  cx="21"
                  cy="21"
                  r="15.9155"
                  fill="none"
                  stroke-linecap="butt"
                  stroke-width="4.5"
                  class="donut-arc"
                  :stroke="seg.color"
                  :stroke-dasharray="seg.dash"
                  :stroke-dashoffset="seg.offset"
                >
                  <title>{{ seg.label }} · {{ seg.count }} ({{ seg.percent }}%)</title>
                </circle>
              </svg>

              <!-- Centre KPI -->
              <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-3xl font-bold leading-none text-slate-900 sm:text-4xl">
                  {{ respondedPercent }}%
                </span>
                <span class="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  {{ t('management.rsvpAnalytics.metrics.repliedShort') }}
                </span>
              </div>
            </div>

            <!-- Legend doubles as the value table: identity from the dot,
                 numbers from the columns, so the donut is never the only
                 way to read a figure. -->
            <div class="min-w-0 flex-1">
              <p class="mb-2 text-[11px] leading-snug text-slate-500">
                {{
                  t('management.rsvpAnalytics.metrics.responseRateDesc', {
                    responded: respondedCount,
                    invited: summary.total_invited,
                  })
                }}
              </p>
              <div
                v-for="row in distributionRows"
                :key="row.key"
                class="grid grid-cols-[1fr_auto_2.25rem] items-baseline gap-x-2 py-1"
              >
                <p class="flex min-w-0 items-center gap-1.5">
                  <span
                    class="h-2 w-2 flex-shrink-0 self-center rounded-full"
                    :style="{ backgroundColor: row.color }"
                    aria-hidden="true"
                  />
                  <span class="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    {{ row.label }}
                  </span>
                </p>
                <span class="text-sm font-semibold tabular-nums text-slate-900">
                  {{ row.count }}
                </span>
                <span class="text-right text-[11px] tabular-nums text-slate-400">
                  {{ row.percent }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- The one headcount the donut can't carry: attendees incl. plus-ones -->
        <div class="flex flex-col justify-center rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 sm:p-5">
          <p class="text-xs font-medium text-slate-500">
            {{ t('management.rsvpAnalytics.hero.expectedLabel') }}
          </p>
          <p class="mt-1.5 text-3xl font-semibold leading-none text-slate-900">
            {{ summary.total_expected_attendees }}
          </p>
          <p class="mt-2 text-[11px] leading-snug text-slate-500">
            {{
              t('management.rsvpAnalytics.metrics.expectedDesc', {
                attending: summary.status_counts.attending,
                plusOnes: plusOnesCount,
              })
            }}
          </p>
        </div>
      </section>

      <!-- ================================================================
        Section 3 · Follow-up
        Soft amber task panel listing guests who haven't replied. Dot color
        encodes invitation progress, explained by the mini legend below.
      ================================================================= -->
      <section
        v-if="summary.status_counts.pending > 0"
        class="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4 sm:p-5"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex min-w-0 items-start gap-3">
            <div
              class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100"
            >
              <BellRing class="h-4 w-4 text-amber-600" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-slate-900">
                {{ t('management.rsvpAnalytics.chase.title') }}
              </p>
              <p class="mt-0.5 text-xs text-slate-500">
                {{ t('management.rsvpAnalytics.chase.description') }}
              </p>
            </div>
          </div>
          <span
            class="flex-shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-amber-700"
          >
            {{ summary.status_counts.pending }}
          </span>
        </div>

        <div class="mt-3 flex flex-wrap gap-1.5">
          <span
            v-for="guest in visiblePendingGuests"
            :key="guest.id"
            class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700"
            :title="guest.email || ''"
          >
            <span
              class="h-1.5 w-1.5 flex-shrink-0 rounded-full"
              :class="pendingDotClass(guest.invitation_status)"
            />
            <span class="max-w-[180px] truncate font-medium">
              {{ guest.name || t('management.rsvpAnalytics.chase.unnamedGuest') }}
            </span>
          </span>

          <!-- Collapsed: one button stands in for everything beyond the preview -->
          <button
            v-if="!showAllPending && collapsedPendingRemainder > 0"
            type="button"
            class="inline-flex items-center rounded-full border border-amber-200 bg-amber-100/60 px-2.5 py-1 text-[11px] font-medium text-amber-700 transition-colors duration-200 hover:bg-amber-100"
            @click="showAllPending = true"
          >
            +{{ collapsedPendingRemainder }} {{ t('management.rsvpAnalytics.chase.moreShort') }}
          </button>
          <button
            v-else-if="showAllPending && summary.pending_guests.length > PENDING_PREVIEW_COUNT"
            type="button"
            class="inline-flex items-center rounded-full border border-amber-200 bg-amber-100/60 px-2.5 py-1 text-[11px] font-medium text-amber-700 transition-colors duration-200 hover:bg-amber-100"
            @click="showAllPending = false"
          >
            {{ t('management.rsvpAnalytics.showLess') }}
          </button>
        </div>

        <!-- Backend only returns the first N pending guests inline -->
        <p
          v-if="showAllPending && hiddenPendingCount > 0"
          class="mt-2 text-[10px] text-amber-700/70"
        >
          {{ t('management.rsvpAnalytics.chase.moreHidden', { count: hiddenPendingCount }, hiddenPendingCount) }}
        </p>

        <!-- Invitation-status dot legend -->
        <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <span
            v-for="item in invitationLegend"
            :key="item.key"
            class="inline-flex items-center gap-1.5 text-[10px] text-slate-500"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="item.dotClass" />
            {{ item.label }}
          </span>
        </div>
      </section>

      <!-- No pending (only when data exists) -->
      <section
        v-else-if="summary.total_invited > 0"
        class="-mt-2 flex items-center gap-2 text-sm text-emerald-700"
      >
        <PartyPopper class="h-4 w-4" />
        <p>{{ t('management.rsvpAnalytics.chase.allResponded') }}</p>
      </section>

      <!-- ================================================================
        Section 3 · Questions
        One list for authoring and results — rows open the editor in place,
        the chevron expands the answer breakdown.
      ================================================================= -->
      <RsvpQuestionsSection
        :event-id="props.eventId"
        :questions="questions"
        :breakdowns="summary.question_breakdowns"
        @refresh="loadSummary"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { BellRing, ClipboardList, PartyPopper, RefreshCw } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import RsvpQuestionsSection from './RsvpQuestionsSection.vue'
import { guestService, rsvpQuestionsService } from '../../services/api'
import type { EventRsvpQuestion, GuestRsvpSummary } from '../../services/api'

const { t } = useAppLanguage()

const props = defineProps<{
  eventId: string
}>()

const loading = ref(false)
const summary = ref<GuestRsvpSummary | null>(null)
// Full question list (with translations) — the `rsvp-summary/` endpoint
// only echoes the base-language `question_text`, so we fetch the question
// list in parallel to get the `translations[]` array for localised labels.
const questions = ref<EventRsvpQuestion[]>([])

const loadSummary = async () => {
  loading.value = true
  try {
    const [summaryRes, questionsRes] = await Promise.all([
      guestService.getGuestsRsvpSummary(props.eventId),
      rsvpQuestionsService.listQuestions(props.eventId),
    ])
    if (summaryRes.success && summaryRes.data) {
      summary.value = summaryRes.data
    }
    if (questionsRes.success && questionsRes.data) {
      questions.value = questionsRes.data
    }
  } finally {
    loading.value = false
  }
}

// ---- Metrics -------------------------------------------------------------
const respondedCount = computed(() => {
  if (!summary.value) return 0
  const { attending, maybe, not_attending } = summary.value.status_counts
  return attending + maybe + not_attending
})

const respondedPercent = computed(() => {
  if (!summary.value || summary.value.total_invited === 0) return 0
  return Math.round((respondedCount.value / summary.value.total_invited) * 100)
})

// Plus-ones = expected - attending guests themselves. `total_expected_attendees`
// counts guest + their plus-ones for attendees only, so subtracting the
// attending head count yields just the plus-ones subtotal.
const plusOnesCount = computed(() => {
  if (!summary.value) return 0
  const diff = summary.value.total_expected_attendees - summary.value.status_counts.attending
  return Math.max(0, diff)
})

// The summary only returns the first N pending guests inline. If there
// are more than what's shown, surface the remainder as a "+N more" chip.
const hiddenPendingCount = computed(() => {
  if (!summary.value) return 0
  const listed = summary.value.pending_guests.length
  return Math.max(0, summary.value.status_counts.pending - listed)
})

// Chip walls don't scale — collapse long guest lists to a short preview
// with a "+N more" expander (progressive disclosure).
const PENDING_PREVIEW_COUNT = 8
const showAllPending = ref(false)

const visiblePendingGuests = computed(() => {
  if (!summary.value) return []
  return showAllPending.value
    ? summary.value.pending_guests
    : summary.value.pending_guests.slice(0, PENDING_PREVIEW_COUNT)
})

// Everyone not in the collapsed preview, including guests the backend
// didn't return inline — one number so the button matches the header count.
const collapsedPendingRemainder = computed(() => {
  if (!summary.value) return 0
  return Math.max(0, summary.value.status_counts.pending - PENDING_PREVIEW_COUNT)
})

// Dot color for pending guest chips encodes invitation progression:
// viewed (green) > sent (blue) > not_sent (grey).
const pendingDotClass = (status: 'not_sent' | 'sent' | 'viewed'): string => {
  switch (status) {
    case 'viewed':
      return 'bg-emerald-500'
    case 'sent':
      return 'bg-sky-500'
    default:
      return 'bg-slate-300'
  }
}

// Mini legend explaining the pending-chip dot colors.
const invitationLegend = computed(() => [
  {
    key: 'viewed',
    label: t('management.rsvpAnalytics.chase.status.viewed'),
    dotClass: 'bg-emerald-500',
  },
  {
    key: 'sent',
    label: t('management.rsvpAnalytics.chase.status.sent'),
    dotClass: 'bg-sky-500',
  },
  {
    key: 'not_sent',
    label: t('management.rsvpAnalytics.chase.status.not_sent'),
    dotClass: 'bg-slate-300',
  },
])

// ---- Distribution --------------------------------------------------------
// Responded hues are one step deeper than the usual 500s so every mark
// clears 3:1 contrast on white (validated); pending stays a quiet neutral
// remainder — the legend always carries its label + count.
const statusColors = {
  attending: '#059669', // emerald-600
  maybe: '#f0930d', // amber, re-stepped off amber-600
  not_attending: '#e11d48', // rose-600
  pending: '#94a3b8', // slate-400 — the deliberate "nothing yet" neutral
}

interface DistributionRow {
  key: 'attending' | 'maybe' | 'not_attending' | 'pending'
  label: string
  count: number
  percent: number
  color: string
}

const distributionRows = computed<DistributionRow[]>(() => {
  if (!summary.value) return []
  const total = summary.value.total_invited || 1
  const c = summary.value.status_counts
  const pct = (n: number) => Math.round((n / total) * 100)

  return [
    {
      key: 'attending',
      label: t('management.rsvpStatuses.going'),
      count: c.attending,
      percent: pct(c.attending),
      color: statusColors.attending,
    },
    {
      key: 'maybe',
      label: t('management.rsvpStatuses.maybe'),
      count: c.maybe,
      percent: pct(c.maybe),
      color: statusColors.maybe,
    },
    {
      key: 'not_attending',
      label: t('management.rsvpStatuses.declined'),
      count: c.not_attending,
      percent: pct(c.not_attending),
      color: statusColors.not_attending,
    },
    {
      key: 'pending',
      label: t('management.rsvpStatuses.pending'),
      count: c.pending,
      percent: pct(c.pending),
      color: statusColors.pending,
    },
  ]
})

/**
 * Donut arcs, drawn as dashed strokes on a circle whose circumference is
 * exactly 100 (r = 15.9155), so a percentage maps 1:1 onto dash length.
 *
 * Each arc is shortened by `DONUT_GAP` to leave the 2px surface gap the mark
 * spec asks for — but only when more than one status has a count, since a
 * lone full-circle segment would otherwise show a notch for no reason.
 * Zero-count statuses are skipped entirely (they'd contribute nothing but a
 * stray gap) and are still named, counted and shown as 0 in the legend.
 */
const DONUT_GAP = 0.6

const donutSegments = computed(() => {
  const present = distributionRows.value.filter((row) => row.count > 0)
  if (present.length === 0 || !summary.value) return []

  const total = summary.value.total_invited || 1
  const gap = present.length > 1 ? DONUT_GAP : 0
  let cumulative = 0

  return present.map((row) => {
    // Use the exact fraction, not the rounded legend percent, so the arcs
    // always close the circle.
    const length = (row.count / total) * 100
    const drawn = Math.max(length - gap, 0.5)
    const segment = {
      key: row.key,
      label: row.label,
      count: row.count,
      percent: row.percent,
      color: row.color,
      dash: `${drawn} ${100 - drawn}`,
      offset: -cumulative,
    }
    cumulative += length
    return segment
  })
})

// ---- Lifecycle -----------------------------------------------------------
onMounted(() => {
  loadSummary()
})

watch(
  () => props.eventId,
  () => {
    // The question section resets its own drill state off the same prop.
    showAllPending.value = false
    loadSummary()
  },
)

defineExpose({ reload: loadSummary })
</script>

<style scoped>
/* Hover feedback on a donut arc. Written here rather than as a Tailwind
   utility because `stroke-[n]` sets stroke *colour*, not width. */
.donut-arc {
  transition: stroke-width 0.2s ease;
}

.donut-arc:hover {
  stroke-width: 5.5;
}

@media (prefers-reduced-motion: reduce) {
  .donut-arc {
    transition: none;
  }
}
</style>
