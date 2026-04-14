<template>
  <div class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60">
    <!-- Header -->
    <div class="mb-6">
      <p class="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
        {{ t('management.rsvpAnalytics.title') }}
      </p>
      <p class="mt-1 text-sm text-slate-500">
        {{ t('management.rsvpAnalytics.subtitle') }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      <span class="ml-3 text-sm text-slate-600">
        {{ t('management.rsvpAnalytics.loading') }}
      </span>
    </div>

    <!-- Empty: no summary or zero invited -->
    <div
      v-else-if="!summary || summary.total_invited === 0"
      class="text-center py-12"
    >
      <ClipboardList class="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p class="text-base text-slate-500">
        {{ t('management.rsvpAnalytics.empty.title') }}
      </p>
      <p class="text-sm text-slate-400 mt-1">
        {{ t('management.rsvpAnalytics.empty.description') }}
      </p>
    </div>

    <!-- Content -->
    <div v-else class="flex flex-col gap-8">
      <!-- Key Metrics Overview -->
      <div class="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <!-- Invited -->
        <div class="rounded-2xl border border-transparent bg-slate-50 p-4 shadow-sm shadow-slate-100/70">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {{ t('management.rsvpAnalytics.metrics.invited') }}
            </p>
            <Users class="h-4 w-4 text-slate-600" />
          </div>
          <p class="mt-3 text-2xl font-bold text-slate-900 leading-tight">
            {{ summary.total_invited }}
          </p>
          <p class="text-xs text-slate-500 mt-1">
            {{ t('management.rsvpAnalytics.metrics.invitedDesc') }}
          </p>
        </div>

        <!-- Responded -->
        <div class="rounded-2xl border border-transparent bg-emerald-50/80 p-4 shadow-sm shadow-emerald-100/70">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              {{ t('management.rsvpAnalytics.metrics.responded') }}
            </p>
            <CheckCircle2 class="h-4 w-4 text-emerald-600" />
          </div>
          <p class="mt-3 text-2xl font-bold text-slate-900 leading-tight">
            {{ respondedCount }}
          </p>
          <p class="text-xs text-emerald-700/70 mt-1">
            {{ t('management.rsvpAnalytics.metrics.respondedDesc', { percent: respondedPercent }) }}
          </p>
        </div>

        <!-- Expected attendees -->
        <div class="rounded-2xl border border-transparent bg-sky-50/80 p-4 shadow-sm shadow-sky-100/70">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wide text-sky-600">
              {{ t('management.rsvpAnalytics.metrics.expected') }}
            </p>
            <UserCheck class="h-4 w-4 text-sky-600" />
          </div>
          <p class="mt-3 text-2xl font-bold text-slate-900 leading-tight">
            {{ summary.total_expected_attendees }}
          </p>
          <p class="text-xs text-sky-700/70 mt-1">
            {{
              t('management.rsvpAnalytics.metrics.expectedDesc', {
                attending: summary.status_counts.attending,
                plusOnes: plusOnesCount,
              })
            }}
          </p>
        </div>

        <!-- Plus-ones -->
        <div class="rounded-2xl border border-transparent bg-violet-50/80 p-4 shadow-sm shadow-violet-100/70">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wide text-violet-600">
              {{ t('management.rsvpAnalytics.metrics.plusOnes') }}
            </p>
            <UsersRound class="h-4 w-4 text-violet-600" />
          </div>
          <p class="mt-3 text-2xl font-bold text-slate-900 leading-tight">
            {{ plusOnesCount }}
          </p>
          <p class="text-xs text-violet-700/70 mt-1">
            {{ t('management.rsvpAnalytics.metrics.plusOnesDesc') }}
          </p>
        </div>
      </div>

      <!-- Response Distribution + Chase list -->
      <div class="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <!-- Doughnut + rows -->
        <div class="xl:col-span-3">
          <div class="mb-4">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {{ t('management.rsvpAnalytics.distribution.title') }}
            </p>
            <p class="mt-1 text-sm text-slate-500">
              {{ t('management.rsvpAnalytics.distribution.description') }}
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <!-- Doughnut chart -->
            <div class="flex items-center justify-center">
              <div class="w-full max-w-[220px]">
                <Doughnut :data="distributionChartData" :options="chartOptions" />
              </div>
            </div>

            <!-- Legend rows -->
            <div class="space-y-2">
              <div
                v-for="row in distributionRows"
                :key="row.key"
                class="rounded-2xl border border-transparent p-3 shadow-sm"
                :style="{ backgroundColor: row.bg }"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 min-w-0">
                    <div
                      class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      :style="{ backgroundColor: row.color }"
                    />
                    <p class="text-xs font-semibold uppercase tracking-wide truncate" :style="{ color: row.color }">
                      {{ row.label }}
                    </p>
                  </div>
                  <span class="text-xs font-semibold tabular-nums" :style="{ color: row.color }">
                    {{ t('management.rsvpAnalytics.distribution.legendPercent', { percent: row.percent }) }}
                  </span>
                </div>
                <div class="mt-2 flex items-center gap-2">
                  <p class="text-lg font-semibold text-slate-900 tabular-nums flex-shrink-0">
                    {{ row.count }}
                  </p>
                  <div class="flex-1 h-1.5 rounded-full bg-white/70 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :style="{ width: `${row.percent}%`, backgroundColor: row.color }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Follow-up / chase list -->
        <div class="xl:col-span-2">
          <div class="mb-4">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {{ t('management.rsvpAnalytics.chase.title') }}
            </p>
            <p class="mt-1 text-sm text-slate-500">
              {{ t('management.rsvpAnalytics.chase.description') }}
            </p>
          </div>

          <div
            class="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-4 h-full"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <Clock class="h-4 w-4 text-amber-600" />
                <p class="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  {{ t('management.rsvpAnalytics.metrics.pending') }}
                </p>
              </div>
              <span class="text-lg font-bold text-slate-900 tabular-nums">
                {{ summary.status_counts.pending }}
              </span>
            </div>

            <!-- No pending -->
            <div
              v-if="summary.status_counts.pending === 0"
              class="rounded-xl bg-white/60 border border-dashed border-amber-200 p-4 text-center"
            >
              <PartyPopper class="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
              <p class="text-xs font-medium text-slate-700">
                {{ t('management.rsvpAnalytics.chase.allResponded') }}
              </p>
            </div>

            <!-- Pending guest list -->
            <div v-else class="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              <div
                v-for="guest in summary.pending_guests"
                :key="guest.id"
                class="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2"
              >
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-slate-900 truncate">
                    {{ guest.name || t('management.rsvpAnalytics.chase.unnamedGuest') }}
                  </p>
                  <p
                    v-if="guest.email"
                    class="text-xs text-slate-500 truncate"
                  >
                    {{ guest.email }}
                  </p>
                </div>
                <span
                  class="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium"
                  :class="invitationStatusClass(guest.invitation_status)"
                >
                  {{ t(`management.rsvpAnalytics.chase.status.${guest.invitation_status}`) }}
                </span>
              </div>

              <p
                v-if="hiddenPendingCount > 0"
                class="text-xs text-center text-amber-700/70 pt-2"
              >
                {{
                  t('management.rsvpAnalytics.chase.moreHidden', {
                    count: hiddenPendingCount,
                  }, hiddenPendingCount)
                }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Per-question breakdowns -->
      <div>
        <div class="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {{ t('management.rsvpAnalytics.questions.title') }}
            </p>
            <p class="mt-1 text-sm text-slate-500">
              {{ t('management.rsvpAnalytics.questions.description') }}
            </p>
          </div>
        </div>

        <!-- No questions yet -->
        <div
          v-if="summary.question_breakdowns.length === 0"
          class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/40 p-6 text-center"
        >
          <MessageSquareText class="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p class="text-sm font-medium text-slate-600">
            {{ t('management.rsvpAnalytics.questions.emptyState.title') }}
          </p>
          <p class="mt-1 text-xs text-slate-400 max-w-md mx-auto">
            {{ t('management.rsvpAnalytics.questions.emptyState.description') }}
          </p>
        </div>

        <!-- Question list -->
        <div v-else class="space-y-4">
          <div
            v-for="(q, qIdx) in summary.question_breakdowns"
            :key="q.question_id"
            class="rounded-2xl border border-slate-200 bg-slate-50/40 overflow-hidden"
          >
            <!-- Question header (clickable to drill through) -->
            <button
              type="button"
              class="w-full flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5 text-left hover:bg-slate-100/60 transition-colors"
              @click="toggleQuestion(q.question_id)"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-slate-900 break-words">
                  <span class="text-slate-400 tabular-nums mr-1.5">Q{{ qIdx + 1 }}.</span>
                  {{ q.question_text }}
                </p>
                <div class="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span class="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-slate-600 bg-white border border-slate-200">
                    {{ getTypeLabel(q.question_type) }}
                  </span>
                  <span
                    v-if="q.is_required"
                    class="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-rose-700 bg-rose-50"
                  >
                    {{ t('management.guestGroupsView.rsvpQuestions.requiredBadge') }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-3 flex-shrink-0">
                <div class="text-right">
                  <p class="text-lg font-bold text-slate-900 tabular-nums leading-tight">
                    {{ q.total_answers }}
                  </p>
                  <p class="text-[11px] text-slate-500">
                    {{ t('management.rsvpAnalytics.questions.answersCount', { count: q.total_answers }, q.total_answers) }}
                  </p>
                </div>
                <ChevronDown
                  class="h-4 w-4 text-slate-400 transition-transform duration-200"
                  :class="{ 'rotate-180': expandedQuestionId === q.question_id }"
                />
              </div>
            </button>

            <!-- Body -->
            <div class="px-4 pb-4 sm:px-5 sm:pb-5 -mt-1">
              <!-- No answers yet -->
              <div
                v-if="q.total_answers === 0"
                class="rounded-lg bg-white border border-dashed border-slate-200 p-3 text-center"
              >
                <p class="text-xs text-slate-400">
                  {{ t('management.rsvpAnalytics.questions.noAnswers') }}
                </p>
              </div>

              <!-- Choice breakdown bars -->
              <div
                v-else-if="q.breakdown && Object.keys(q.breakdown).length > 0"
                class="space-y-2"
              >
                <div
                  v-for="(row, rowIdx) in getSortedBreakdown(q)"
                  :key="row.label"
                  class="flex items-center gap-3"
                >
                  <div class="w-32 sm:w-40 flex-shrink-0 text-xs font-medium text-slate-700 truncate" :title="row.label">
                    {{ row.label }}
                  </div>
                  <div class="flex-1 min-w-0 relative">
                    <div class="h-6 rounded-md bg-white border border-slate-200 overflow-hidden">
                      <div
                        class="h-full rounded-md transition-all duration-500"
                        :style="{
                          width: `${Math.max(row.percentOfMax, 3)}%`,
                          backgroundColor: palette[rowIdx % palette.length],
                          opacity: 0.85,
                        }"
                      />
                    </div>
                  </div>
                  <div class="flex items-baseline gap-1.5 flex-shrink-0 min-w-[4.5rem] text-right">
                    <span class="text-sm font-semibold text-slate-900 tabular-nums">
                      {{ row.count }}
                    </span>
                    <span class="text-[11px] text-slate-500 tabular-nums">
                      ({{ row.percentOfTotal }}%)
                    </span>
                  </div>
                </div>
              </div>

              <!-- Free-text (no per-value breakdown) -->
              <div v-else class="rounded-lg bg-white border border-slate-200 p-3">
                <p class="text-xs text-slate-600">
                  {{ t('management.rsvpAnalytics.questions.freeTextCollected', { count: q.total_answers }, q.total_answers) }}
                </p>
              </div>
            </div>

            <!-- Drill-through panel -->
            <div
              v-if="expandedQuestionId === q.question_id"
              class="border-t border-slate-200 bg-white px-4 py-4 sm:px-5 sm:py-5"
            >
              <!-- Loading -->
              <div
                v-if="drillLoading"
                class="flex items-center justify-center py-6"
              >
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                <span class="ml-3 text-xs text-slate-500">
                  {{ t('management.rsvpAnalytics.drill.loading') }}
                </span>
              </div>

              <!-- Error -->
              <div
                v-else-if="drillError"
                class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
              >
                {{ drillError }}
              </div>

              <!-- Content -->
              <div v-else-if="drillData" class="space-y-5">
                <!-- Grouped by answer (choice types) -->
                <div v-if="drillData.grouped_by_answer" class="space-y-3">
                  <div
                    v-for="(bucket, bIdx) in drillData.grouped_by_answer"
                    :key="`${bucket.answer}-${bIdx}`"
                    class="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden"
                  >
                    <div class="flex items-center justify-between px-3 py-2 bg-white border-b border-slate-200">
                      <div class="flex items-center gap-2 min-w-0">
                        <span
                          class="inline-block h-2 w-2 rounded-full flex-shrink-0"
                          :style="{ backgroundColor: palette[bIdx % palette.length] }"
                        />
                        <p class="text-xs font-semibold text-slate-900 truncate">
                          {{ bucket.answer }}
                        </p>
                      </div>
                      <span class="text-xs font-semibold text-slate-600 tabular-nums flex-shrink-0">
                        {{ t('management.rsvpAnalytics.drill.guestsCount', { count: bucket.count }, bucket.count) }}
                      </span>
                    </div>
                    <div class="p-2 flex flex-wrap gap-1.5">
                      <span
                        v-for="guest in bucket.guests"
                        :key="guest.id"
                        class="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[11px] text-slate-700"
                      >
                        <span
                          v-if="guest.group_color"
                          class="h-1.5 w-1.5 rounded-full flex-shrink-0"
                          :style="{ backgroundColor: guest.group_color }"
                        />
                        {{ guest.name }}
                        <span
                          v-if="(guest.plus_ones_count ?? 0) > 0"
                          class="text-slate-400"
                        >+{{ guest.plus_ones_count }}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Free-text answers -->
                <div v-else-if="drillData.free_text_answers" class="space-y-2">
                  <div
                    v-if="drillData.free_text_answers.length === 0"
                    class="rounded-lg bg-slate-50 border border-dashed border-slate-200 p-3 text-center"
                  >
                    <p class="text-xs text-slate-400">
                      {{ t('management.rsvpAnalytics.drill.noFreeText') }}
                    </p>
                  </div>
                  <div
                    v-for="entry in drillData.free_text_answers"
                    :key="entry.id"
                    class="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                  >
                    <div class="flex items-center justify-between gap-3 mb-1.5">
                      <div class="flex items-center gap-2 min-w-0">
                        <span
                          v-if="entry.group_color"
                          class="h-2 w-2 rounded-full flex-shrink-0"
                          :style="{ backgroundColor: entry.group_color }"
                        />
                        <p class="text-xs font-semibold text-slate-900 truncate">
                          {{ entry.name }}
                        </p>
                        <span
                          v-if="entry.group_name"
                          class="text-[10px] text-slate-400 truncate"
                        >
                          · {{ entry.group_name }}
                        </span>
                      </div>
                      <span class="text-[10px] text-slate-400 flex-shrink-0">
                        {{ formatRelativeDate(entry.updated_at) }}
                      </span>
                    </div>
                    <p class="text-sm text-slate-700 break-words whitespace-pre-line">
                      {{ entry.answer_text }}
                    </p>
                  </div>
                </div>

                <!-- Guests without answer (attending / maybe) -->
                <div v-if="drillData.guests_without_answer.length > 0">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                      {{ t('management.rsvpAnalytics.drill.missingTitle') }}
                    </p>
                    <span class="text-[11px] text-amber-700/70">
                      {{
                        t('management.rsvpAnalytics.drill.missingCount', {
                          count: drillData.guests_without_answer.length,
                        }, drillData.guests_without_answer.length)
                      }}
                    </span>
                  </div>
                  <div class="rounded-xl bg-amber-50/60 border border-amber-200 p-2 flex flex-wrap gap-1.5">
                    <span
                      v-for="guest in drillData.guests_without_answer"
                      :key="guest.id"
                      class="inline-flex items-center gap-1 rounded-full bg-white border border-amber-200 px-2 py-0.5 text-[11px] text-amber-800"
                    >
                      <span
                        v-if="guest.group_color"
                        class="h-1.5 w-1.5 rounded-full flex-shrink-0"
                        :style="{ backgroundColor: guest.group_color }"
                      />
                      {{ guest.name }}
                    </span>
                  </div>
                  <p
                    v-if="drillData.guests_without_answer_truncated"
                    class="mt-2 text-[11px] text-amber-700/70"
                  >
                    {{ t('management.rsvpAnalytics.drill.missingTruncated') }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'
import {
  ChevronDown,
  ClipboardList,
  Users,
  UsersRound,
  UserCheck,
  CheckCircle2,
  Clock,
  MessageSquareText,
  PartyPopper,
} from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { guestService, rsvpQuestionsService } from '../../services/api'
import type {
  EventRsvpQuestionType,
  GuestRsvpQuestionBreakdown,
  GuestRsvpSummary,
  RsvpQuestionResponses,
} from '../../services/api'

ChartJS.register(ArcElement, Tooltip, Legend)

const { t } = useAppLanguage()

const props = defineProps<{
  eventId: string
}>()

const loading = ref(false)
const summary = ref<GuestRsvpSummary | null>(null)

const loadSummary = async () => {
  loading.value = true
  try {
    const response = await guestService.getGuestsRsvpSummary(props.eventId)
    if (response.success && response.data) {
      summary.value = response.data
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
// already counts guest + their plus-ones for attendees only, so subtracting
// the attending head count yields just the plus-ones subtotal.
const plusOnesCount = computed(() => {
  if (!summary.value) return 0
  const diff = summary.value.total_expected_attendees - summary.value.status_counts.attending
  return Math.max(0, diff)
})

// The summary only returns the first N pending guests inline (the backend
// caps the list so /rsvp-summary/ stays cheap). If there are more pending
// guests than the array length, surface the remainder as a "…and N more".
const hiddenPendingCount = computed(() => {
  if (!summary.value) return 0
  const listed = summary.value.pending_guests.length
  return Math.max(0, summary.value.status_counts.pending - listed)
})

const invitationStatusClass = (status: 'not_sent' | 'sent' | 'viewed'): string => {
  switch (status) {
    case 'viewed':
      return 'bg-emerald-100 text-emerald-700'
    case 'sent':
      return 'bg-sky-100 text-sky-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

// ---- Distribution --------------------------------------------------------
const statusColors = {
  attending: '#10b981', // emerald-500
  maybe: '#f59e0b', // amber-500
  not_attending: '#f43f5e', // rose-500
  pending: '#94a3b8', // slate-400
}

const statusBgs = {
  attending: '#ecfdf5',
  maybe: '#fffbeb',
  not_attending: '#fff1f2',
  pending: '#f8fafc',
}

interface DistributionRow {
  key: 'attending' | 'maybe' | 'not_attending' | 'pending'
  label: string
  count: number
  percent: number
  color: string
  bg: string
}

const distributionRows = computed<DistributionRow[]>(() => {
  if (!summary.value) return []
  const total = summary.value.total_invited || 1
  const c = summary.value.status_counts
  const pct = (n: number) => Math.round((n / total) * 100)

  return [
    {
      key: 'attending',
      label: t('management.guestGroupsView.rsvpStatsCard.cards.going'),
      count: c.attending,
      percent: pct(c.attending),
      color: statusColors.attending,
      bg: statusBgs.attending,
    },
    {
      key: 'maybe',
      label: t('management.guestGroupsView.rsvpStatsCard.cards.maybe'),
      count: c.maybe,
      percent: pct(c.maybe),
      color: statusColors.maybe,
      bg: statusBgs.maybe,
    },
    {
      key: 'not_attending',
      label: t('management.guestGroupsView.rsvpStatsCard.cards.declined'),
      count: c.not_attending,
      percent: pct(c.not_attending),
      color: statusColors.not_attending,
      bg: statusBgs.not_attending,
    },
    {
      key: 'pending',
      label: t('management.guestGroupsView.rsvpStatsCard.cards.pending'),
      count: c.pending,
      percent: pct(c.pending),
      color: statusColors.pending,
      bg: statusBgs.pending,
    },
  ]
})

const distributionChartData = computed(() => ({
  labels: distributionRows.value.map((r) => r.label),
  datasets: [
    {
      data: distributionRows.value.map((r) => r.count),
      backgroundColor: distributionRows.value.map((r) => r.color),
      borderColor: '#ffffff',
      borderWidth: 2,
    },
  ],
}))

const chartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: true,
  cutout: '62%',
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const label = context.label || ''
          const value = (context.parsed as number) || 0
          const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0)
          const percentage = total === 0 ? 0 : Math.round((value / total) * 100)
          return `${label}: ${value} (${percentage}%)`
        },
      },
    },
  },
}

// ---- Question breakdowns -------------------------------------------------
// Rotating palette for choice bars. Kept inside the analytics card so each
// question stays visually distinct without needing a per-question color.
const palette = [
  '#10b981', // emerald
  '#0ea5e9', // sky
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#14b8a6', // teal
  '#ec4899', // pink
  '#64748b', // slate
]

const typeLabels: Record<EventRsvpQuestionType, string> = {
  text: 'text',
  long_text: 'long_text',
  yes_no: 'yes_no',
  single_choice: 'single_choice',
  multi_choice: 'multi_choice',
}

const getTypeLabel = (type: string) => {
  const key = typeLabels[type as EventRsvpQuestionType] ?? 'text'
  return t(`management.guestGroupsView.rsvpQuestions.types.${key}`)
}

interface BreakdownRow {
  label: string
  count: number
  /** Percentage of respondents who picked this option (of total_answers). */
  percentOfTotal: number
  /** Percentage relative to the most-picked option (for bar width). */
  percentOfMax: number
}

const getSortedBreakdown = (q: GuestRsvpQuestionBreakdown): BreakdownRow[] => {
  if (!q.breakdown) return []
  const entries = Object.entries(q.breakdown)
  if (entries.length === 0) return []
  const maxCount = Math.max(...entries.map(([, count]) => count))
  const total = q.total_answers || 1
  return entries
    .map(([label, count]) => ({
      label,
      count,
      percentOfTotal: Math.round((count / total) * 100),
      percentOfMax: maxCount === 0 ? 0 : Math.round((count / maxCount) * 100),
    }))
    .sort((a, b) => b.count - a.count)
}

// ---- Drill-through -------------------------------------------------------
// Clicking a question expands it and lazy-loads the per-question drill-through
// from `rsvpQuestionsService.getQuestionResponses`. Results are cached by
// question id so re-expanding the same question after a collapse is free.
const expandedQuestionId = ref<number | null>(null)
const drillLoading = ref(false)
const drillError = ref<string | null>(null)
const drillData = ref<RsvpQuestionResponses | null>(null)
const drillCache = new Map<number, RsvpQuestionResponses>()

const toggleQuestion = async (questionId: number) => {
  if (expandedQuestionId.value === questionId) {
    expandedQuestionId.value = null
    drillData.value = null
    drillError.value = null
    return
  }

  expandedQuestionId.value = questionId
  drillError.value = null

  const cached = drillCache.get(questionId)
  if (cached) {
    drillData.value = cached
    return
  }

  drillData.value = null
  drillLoading.value = true
  try {
    const response = await rsvpQuestionsService.getQuestionResponses(
      props.eventId,
      questionId,
    )
    if (response.success && response.data) {
      drillCache.set(questionId, response.data)
      // Guard against stale responses if the user clicked another question
      // before this one resolved.
      if (expandedQuestionId.value === questionId) {
        drillData.value = response.data
      }
    } else {
      drillError.value =
        response.message || t('management.rsvpAnalytics.drill.loadError')
    }
  } catch {
    drillError.value = t('management.rsvpAnalytics.drill.loadError')
  } finally {
    drillLoading.value = false
  }
}

const formatRelativeDate = (iso: string): string => {
  try {
    const date = new Date(iso)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

// ---- Lifecycle -----------------------------------------------------------
onMounted(() => {
  loadSummary()
})

watch(
  () => props.eventId,
  () => {
    drillCache.clear()
    expandedQuestionId.value = null
    drillData.value = null
    loadSummary()
  },
)

defineExpose({ reload: loadSummary })
</script>
