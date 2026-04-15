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
    <div v-else class="flex flex-col gap-10">
      <!-- ================================================================
        Section 1 · Hero
        Responded ratio as the primary stat, with Expected attendees as a
        secondary readout. Distribution is shown as a single stacked bar
        (replaces the old doughnut + 4-card grid).
      ================================================================= -->
      <section>
        <div class="flex flex-wrap items-end justify-between gap-6">
          <!-- Primary: responded / invited -->
          <div class="min-w-0">
            <div class="flex items-baseline gap-2">
              <p class="text-5xl font-bold tracking-tight text-slate-900 tabular-nums leading-none">
                {{ respondedCount }}
              </p>
              <p class="text-2xl font-semibold text-slate-300 tabular-nums leading-none">
                / {{ summary.total_invited }}
              </p>
              <span class="ml-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {{ respondedPercent }}%
              </span>
            </div>
            <p class="mt-2 text-sm text-slate-500">
              {{ t('management.rsvpAnalytics.hero.respondedLabel') }}
            </p>
          </div>

          <!-- Secondary: expected attendees -->
          <div class="text-right">
            <p class="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              {{ t('management.rsvpAnalytics.hero.expectedLabel') }}
            </p>
            <p class="mt-1 text-3xl font-semibold text-slate-900 tabular-nums leading-none">
              {{ summary.total_expected_attendees }}
            </p>
            <p class="mt-1.5 text-xs text-slate-500">
              {{
                t('management.rsvpAnalytics.hero.expectedBreakdown', {
                  attending: summary.status_counts.attending,
                  plusOnes: plusOnesCount,
                })
              }}
            </p>
          </div>
        </div>

        <!-- Stacked distribution bar -->
        <div class="mt-5">
          <div class="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              v-for="row in distributionRows"
              :key="row.key"
              class="transition-all duration-500"
              :style="{
                width: `${row.percent}%`,
                backgroundColor: row.color,
              }"
              :title="`${row.label}: ${row.count}`"
            />
          </div>

          <!-- Inline legend -->
          <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:flex sm:flex-wrap sm:gap-x-6">
            <div
              v-for="row in distributionRows"
              :key="row.key"
              class="flex items-baseline gap-2"
            >
              <span
                class="h-2 w-2 rounded-full flex-shrink-0 self-center"
                :style="{ backgroundColor: row.color }"
              />
              <p class="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                {{ row.label }}
              </p>
              <p class="text-sm font-semibold text-slate-900 tabular-nums">
                {{ row.count }}
              </p>
              <p class="text-[11px] text-slate-400 tabular-nums">
                {{ row.percent }}%
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- ================================================================
        Section 2 · Follow-up
        Compact chip row of pending guests. Dot color encodes invitation
        status. Hides entirely when nothing is pending.
      ================================================================= -->
      <section v-if="summary.status_counts.pending > 0">
        <div class="mb-3 flex items-baseline justify-between gap-4">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {{ t('management.rsvpAnalytics.chase.title') }}
            </p>
            <p class="mt-1 text-sm text-slate-500">
              {{ t('management.rsvpAnalytics.chase.description') }}
            </p>
          </div>
          <p class="text-sm font-semibold text-amber-600 tabular-nums flex-shrink-0">
            {{ summary.status_counts.pending }}
          </p>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="guest in summary.pending_guests"
            :key="guest.id"
            class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700"
            :title="guest.email || ''"
          >
            <span
              class="h-1.5 w-1.5 rounded-full flex-shrink-0"
              :class="pendingDotClass(guest.invitation_status)"
            />
            <span class="font-medium truncate max-w-[180px]">
              {{ guest.name || t('management.rsvpAnalytics.chase.unnamedGuest') }}
            </span>
          </span>
          <span
            v-if="hiddenPendingCount > 0"
            class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700"
          >
            +{{ hiddenPendingCount }} {{ t('management.rsvpAnalytics.chase.moreShort') }}
          </span>
        </div>
      </section>

      <!-- No pending (only when data exists) -->
      <section
        v-else-if="summary.total_invited > 0"
        class="-mt-4 flex items-center gap-2 text-sm text-emerald-700"
      >
        <PartyPopper class="h-4 w-4" />
        <p>{{ t('management.rsvpAnalytics.chase.allResponded') }}</p>
      </section>

      <!-- ================================================================
        Section 3 · Per-question breakdowns
        Each question is a clickable card. Expanding loads drill-through
        and renders guest chips inline under each bar (no duplicate list).
      ================================================================= -->
      <section>
        <div class="mb-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {{ t('management.rsvpAnalytics.questions.title') }}
          </p>
          <p class="mt-1 text-sm text-slate-500">
            {{ t('management.rsvpAnalytics.questions.description') }}
          </p>
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
        <div v-else class="space-y-3">
          <article
            v-for="(q, qIdx) in summary.question_breakdowns"
            :key="q.question_id"
            class="rounded-2xl border border-slate-200/80 bg-white transition-colors hover:border-slate-300"
          >
            <!-- Header (clickable) -->
            <button
              type="button"
              class="flex w-full items-start justify-between gap-4 rounded-2xl p-4 sm:p-5 text-left"
              @click="toggleQuestion(q.question_id)"
            >
              <div class="min-w-0 flex-1">
                <p class="text-sm font-semibold text-slate-900 break-words">
                  <span class="font-normal text-slate-300 tabular-nums mr-1.5">Q{{ qIdx + 1 }}.</span>
                  {{ localizeQuestionText(q.question_id, q.question_text) }}
                </p>
                <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                  <span>{{ getTypeLabel(q.question_type) }}</span>
                  <span v-if="q.is_required" class="text-rose-600">
                    · {{ t('management.guestGroupsView.rsvpQuestions.requiredBadge') }}
                  </span>
                  <span>
                    · {{ t('management.rsvpAnalytics.questions.answersCount', { count: q.total_answers }, q.total_answers) }}
                  </span>
                </div>
              </div>
              <ChevronDown
                class="mt-1 h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200"
                :class="{ 'rotate-180': isExpanded(q.question_id) }"
              />
            </button>

            <!-- Body -->
            <div class="px-4 pb-4 sm:px-5 sm:pb-5 -mt-1">
              <!-- No answers yet -->
              <div
                v-if="q.total_answers === 0"
                class="rounded-lg bg-slate-50 p-3 text-center"
              >
                <p class="text-xs text-slate-400">
                  {{ t('management.rsvpAnalytics.questions.noAnswers') }}
                </p>
              </div>

              <!-- Choice breakdown: bars + inline guests when expanded -->
              <div
                v-else-if="q.breakdown && Object.keys(q.breakdown).length > 0"
                class="space-y-3"
              >
                <div
                  v-for="(row, rowIdx) in getSortedBreakdown(q)"
                  :key="row.label"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="w-28 sm:w-36 flex-shrink-0 truncate text-xs font-medium text-slate-700"
                      :title="localizeChoice(q.question_id, row.label)"
                    >
                      {{ localizeChoice(q.question_id, row.label) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="h-5 rounded-md bg-slate-100 overflow-hidden">
                        <div
                          class="h-full rounded-md transition-all duration-500"
                          :style="{
                            width: `${Math.max(row.percentOfMax, 3)}%`,
                            backgroundColor: palette[rowIdx % palette.length],
                          }"
                        />
                      </div>
                    </div>
                    <div class="flex flex-shrink-0 items-baseline gap-1.5 min-w-[4rem] text-right">
                      <span class="text-sm font-semibold text-slate-900 tabular-nums">
                        {{ row.count }}
                      </span>
                      <span class="text-[10px] text-slate-400 tabular-nums">
                        {{ row.percentOfTotal }}%
                      </span>
                    </div>
                  </div>

                  <!-- Inline guest chips for this bar (only when expanded + loaded) -->
                  <div
                    v-if="isExpanded(q.question_id) && getBucketGuests(row.label).length > 0"
                    class="mt-2 ml-[7.75rem] sm:ml-[9.75rem] flex flex-wrap gap-1"
                  >
                    <span
                      v-for="guest in getBucketGuests(row.label)"
                      :key="guest.id"
                      class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700"
                    >
                      <span
                        v-if="guest.group_color"
                        class="h-1 w-1 rounded-full flex-shrink-0"
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

              <!-- Free-text: compact summary, full list when expanded -->
              <div v-else>
                <!-- Collapsed hint -->
                <p
                  v-if="!isExpanded(q.question_id)"
                  class="text-xs text-slate-500"
                >
                  {{ t('management.rsvpAnalytics.questions.freeTextCollected', { count: q.total_answers }, q.total_answers) }}
                </p>

                <!-- Expanded list -->
                <div
                  v-else-if="drillData?.free_text_answers?.length"
                  class="space-y-2"
                >
                  <div
                    v-for="entry in drillData.free_text_answers"
                    :key="entry.id"
                    class="rounded-lg bg-slate-50 p-3"
                  >
                    <div class="mb-1 flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <span
                          v-if="entry.group_color"
                          class="h-1.5 w-1.5 rounded-full flex-shrink-0"
                          :style="{ backgroundColor: entry.group_color }"
                        />
                        <p class="truncate text-xs font-semibold text-slate-900">
                          {{ entry.name }}
                        </p>
                        <span
                          v-if="entry.group_name"
                          class="truncate text-[10px] text-slate-400"
                        >· {{ entry.group_name }}</span>
                      </div>
                      <p class="text-[10px] text-slate-400 flex-shrink-0">
                        {{ formatRelativeDate(entry.updated_at) }}
                      </p>
                    </div>
                    <p class="text-sm text-slate-700 whitespace-pre-line break-words">
                      {{ entry.answer_text }}
                    </p>
                  </div>
                </div>

                <!-- Expanded but no answers -->
                <div
                  v-else-if="isExpanded(q.question_id) && !drillLoading && !drillError"
                  class="rounded-lg bg-slate-50 p-3 text-center"
                >
                  <p class="text-xs text-slate-400">
                    {{ t('management.rsvpAnalytics.drill.noFreeText') }}
                  </p>
                </div>
              </div>

              <!-- Drill-through loading / error (shared across types) -->
              <div
                v-if="isExpanded(q.question_id) && drillLoading"
                class="mt-3 flex items-center justify-center py-3"
              >
                <div class="h-4 w-4 animate-spin rounded-full border-b-2 border-emerald-600" />
                <span class="ml-2 text-xs text-slate-500">
                  {{ t('management.rsvpAnalytics.drill.loading') }}
                </span>
              </div>
              <div
                v-else-if="isExpanded(q.question_id) && drillError"
                class="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
              >
                {{ drillError }}
              </div>

              <!-- Still-expected list -->
              <div
                v-if="
                  isExpanded(q.question_id) &&
                  drillData &&
                  drillData.guests_without_answer.length > 0
                "
                class="mt-4 border-t border-dashed border-amber-200 pt-3"
              >
                <div class="mb-2 flex items-center justify-between">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                    {{ t('management.rsvpAnalytics.drill.missingTitle') }}
                  </p>
                  <span class="text-[10px] text-amber-700/70 tabular-nums">
                    {{ drillData.guests_without_answer.length }}
                  </span>
                </div>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="guest in drillData.guests_without_answer"
                    :key="guest.id"
                    class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800"
                  >
                    <span
                      v-if="guest.group_color"
                      class="h-1 w-1 rounded-full flex-shrink-0"
                      :style="{ backgroundColor: guest.group_color }"
                    />
                    {{ guest.name }}
                  </span>
                </div>
                <p
                  v-if="drillData.guests_without_answer_truncated"
                  class="mt-2 text-[10px] text-amber-700/70"
                >
                  {{ t('management.rsvpAnalytics.drill.missingTruncated') }}
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  ChevronDown,
  ClipboardList,
  MessageSquareText,
  PartyPopper,
} from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { guestService, rsvpQuestionsService } from '../../services/api'
import type {
  EventRsvpQuestion,
  EventRsvpQuestionType,
  GuestRsvpQuestionBreakdown,
  GuestRsvpSummary,
  RsvpQuestionResponses,
} from '../../services/api'

const { t, locale } = useAppLanguage()

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

// Map question_id → full question record (with translations) for quick
// lookup during render. Rebuilt whenever the questions array changes.
const questionsById = computed(() => {
  const map = new Map<number, EventRsvpQuestion>()
  for (const q of questions.value) map.set(q.id, q)
  return map
})

const localizeQuestionText = (
  questionId: number,
  fallback: string,
): string => {
  if (locale.value === 'en') return fallback
  const q = questionsById.value.get(questionId)
  if (!q?.translations) return fallback
  const match = q.translations.find((tr) => tr.language === locale.value)
  return match?.question_text?.trim() || fallback
}

const localizeChoice = (
  questionId: number,
  baseChoice: string,
): string => {
  if (locale.value === 'en') return baseChoice
  const q = questionsById.value.get(questionId)
  if (!q?.choices || !q.translations) return baseChoice
  const idx = q.choices.indexOf(baseChoice)
  if (idx === -1) return baseChoice
  const match = q.translations.find((tr) => tr.language === locale.value)
  const translated = match?.choices?.[idx]?.trim()
  return translated || baseChoice
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

// ---- Distribution --------------------------------------------------------
const statusColors = {
  attending: '#10b981', // emerald-500
  maybe: '#f59e0b', // amber-500
  not_attending: '#f43f5e', // rose-500
  pending: '#cbd5e1', // slate-300 — quieter so the responded colours pop
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
      label: t('management.guestGroupsView.rsvpStatsCard.cards.going'),
      count: c.attending,
      percent: pct(c.attending),
      color: statusColors.attending,
    },
    {
      key: 'maybe',
      label: t('management.guestGroupsView.rsvpStatsCard.cards.maybe'),
      count: c.maybe,
      percent: pct(c.maybe),
      color: statusColors.maybe,
    },
    {
      key: 'not_attending',
      label: t('management.guestGroupsView.rsvpStatsCard.cards.declined'),
      count: c.not_attending,
      percent: pct(c.not_attending),
      color: statusColors.not_attending,
    },
    {
      key: 'pending',
      label: t('management.guestGroupsView.rsvpStatsCard.cards.pending'),
      count: c.pending,
      percent: pct(c.pending),
      color: statusColors.pending,
    },
  ]
})

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
  percentOfTotal: number
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

const isExpanded = (questionId: number) => expandedQuestionId.value === questionId

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

/**
 * Return the guest list for a given choice bucket in the currently-expanded
 * question's drill-through. Returns an empty array if drill data isn't
 * loaded yet or if this bucket isn't in `grouped_by_answer`. Used to
 * render guest chips inline under each breakdown bar.
 */
const getBucketGuests = (answerLabel: string) => {
  const buckets = drillData.value?.grouped_by_answer
  if (!buckets) return []
  const bucket = buckets.find((b) => b.answer === answerLabel)
  return bucket?.guests ?? []
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
