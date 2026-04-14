<template>
  <div class="space-y-4">
    <!-- Header row -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-slate-400">
          {{ t('management.guestGroupsView.rsvpStatsCard.header') }}
        </p>
        <p class="text-3xl font-semibold text-slate-900 tracking-tight" aria-live="polite">
          {{ loading ? '...' : `${respondedCount}/${totalInvited}` }}
        </p>
        <p class="mt-1 text-xs text-slate-500">
          {{
            loading
              ? t('management.guestGroupsView.rsvpStatsCard.loading')
              : t('management.guestGroupsView.rsvpStatsCard.respondedDesc', { percent: respondedPercentage })
          }}
        </p>
      </div>
      <div
        class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-100"
        :title="t('management.guestGroupsView.rsvpStatsCard.expectedTooltip')"
      >
        <Users class="h-3.5 w-3.5" aria-hidden="true" />
        <span>
          {{
            loading
              ? '...'
              : `${expectedAttendees} ${t('management.guestGroupsView.rsvpStatsCard.expectedSuffix')}`
          }}
        </span>
      </div>
    </div>

    <!-- Segmented progress bar -->
    <div
      class="flex h-2 w-full overflow-hidden rounded-full bg-slate-100"
      role="img"
      aria-hidden="true"
    >
      <div
        class="h-full bg-emerald-500 transition-all duration-700 ease-out"
        :style="{ width: segmentWidth(attendingCount) }"
      />
      <div
        class="h-full bg-amber-400 transition-all duration-700 ease-out"
        :style="{ width: segmentWidth(maybeCount) }"
      />
      <div
        class="h-full bg-rose-400 transition-all duration-700 ease-out"
        :style="{ width: segmentWidth(notAttendingCount) }"
      />
    </div>

    <!-- Stats grid: attending / maybe / declined / pending -->
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      <button
        v-for="card in cards"
        :key="card.key"
        type="button"
        class="group flex flex-col rounded-xl border p-2.5 text-left transition-all duration-200"
        :class="[card.cardClass, isActive(card.key) ? card.activeRingClass : 'hover:border-slate-300']"
        :aria-pressed="isActive(card.key)"
        @click="handleSelect(card.key)"
      >
        <div class="flex items-center justify-between">
          <span
            class="text-[10px] font-semibold uppercase tracking-wide sm:text-xs"
            :class="card.labelClass"
          >
            {{ card.label }}
          </span>
          <component :is="card.icon" class="h-3.5 w-3.5" :class="card.labelClass" />
        </div>
        <span class="mt-1 text-lg font-bold leading-tight text-slate-900 sm:text-xl">
          {{ loading ? '...' : card.count }}
        </span>
        <span class="mt-0.5 text-[10px] text-slate-500 sm:text-[11px]">
          {{ loading ? '' : `${percentage(card.count)}%` }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, HelpCircle, X, Clock, Users } from 'lucide-vue-next'
import type { GuestRsvpStatusValue, GuestRsvpSummary } from '../../services/api'

const { t } = useI18n()

interface Props {
  summary: GuestRsvpSummary | null
  loading?: boolean
  /** When the parent is filtering by status, this card reflects that and lets users toggle. */
  activeStatus?: GuestRsvpStatusValue | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  activeStatus: null,
})

const emit = defineEmits<{
  'select-status': [status: GuestRsvpStatusValue | null]
}>()

const totalInvited = computed(() => props.summary?.total_invited ?? 0)
const attendingCount = computed(() => props.summary?.status_counts.attending ?? 0)
const maybeCount = computed(() => props.summary?.status_counts.maybe ?? 0)
const notAttendingCount = computed(
  () => props.summary?.status_counts.not_attending ?? 0,
)
const pendingCount = computed(() => props.summary?.status_counts.pending ?? 0)
const expectedAttendees = computed(() => props.summary?.total_expected_attendees ?? 0)

const respondedCount = computed(
  () => attendingCount.value + maybeCount.value + notAttendingCount.value,
)

const respondedPercentage = computed(() => {
  if (totalInvited.value === 0) return 0
  return Math.round((respondedCount.value / totalInvited.value) * 100)
})

const percentage = (count: number) => {
  if (totalInvited.value === 0) return 0
  return Math.round((count / totalInvited.value) * 100)
}

const segmentWidth = (count: number) => {
  if (totalInvited.value === 0) return '0%'
  const pct = (Math.min(Math.max(count, 0), totalInvited.value) / totalInvited.value) * 100
  return `${pct.toFixed(1)}%`
}

interface CardConfig {
  key: GuestRsvpStatusValue
  label: string
  count: number
  icon: typeof Check
  cardClass: string
  labelClass: string
  activeRingClass: string
}

const cards = computed<CardConfig[]>(() => [
  {
    key: 'attending',
    label: t('management.guestGroupsView.rsvpStatsCard.cards.going'),
    count: attendingCount.value,
    icon: Check,
    cardClass: 'border-emerald-100 bg-emerald-50/60',
    labelClass: 'text-emerald-600',
    activeRingClass: 'ring-2 ring-emerald-300 border-emerald-300',
  },
  {
    key: 'maybe',
    label: t('management.guestGroupsView.rsvpStatsCard.cards.maybe'),
    count: maybeCount.value,
    icon: HelpCircle,
    cardClass: 'border-amber-100 bg-amber-50/60',
    labelClass: 'text-amber-600',
    activeRingClass: 'ring-2 ring-amber-300 border-amber-300',
  },
  {
    key: 'not_attending',
    label: t('management.guestGroupsView.rsvpStatsCard.cards.declined'),
    count: notAttendingCount.value,
    icon: X,
    cardClass: 'border-rose-100 bg-rose-50/60',
    labelClass: 'text-rose-600',
    activeRingClass: 'ring-2 ring-rose-300 border-rose-300',
  },
  {
    key: 'pending',
    label: t('management.guestGroupsView.rsvpStatsCard.cards.pending'),
    count: pendingCount.value,
    icon: Clock,
    cardClass: 'border-slate-200 bg-slate-50',
    labelClass: 'text-slate-600',
    activeRingClass: 'ring-2 ring-slate-300 border-slate-300',
  },
])

const isActive = (key: GuestRsvpStatusValue) => props.activeStatus === key

const handleSelect = (key: GuestRsvpStatusValue) => {
  // Toggle off when clicking the active one
  emit('select-status', isActive(key) ? null : key)
}
</script>
