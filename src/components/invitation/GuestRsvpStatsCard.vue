<template>
  <div class="space-y-4">
    <!-- Header row -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {{ t('management.guestGroupsView.rsvpStatsCard.header') }}
        </p>
        <div v-if="loading" class="mt-1 h-9 w-24 animate-pulse rounded-lg bg-slate-100" aria-hidden="true"></div>
        <p v-else class="text-3xl font-semibold text-slate-900 tracking-tight tabular-nums" aria-live="polite">
          {{ `${respondedCount}/${totalInvited}` }}
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
        <span v-if="loading" class="inline-block h-3 w-14 animate-pulse rounded bg-emerald-100" aria-hidden="true"></span>
        <span v-else>
          {{ `${expectedAttendees} ${t('management.guestGroupsView.rsvpStatsCard.expectedSuffix')}` }}
        </span>
      </div>
    </div>

    <!-- Segmented progress bar -->
    <div
      class="flex h-2 w-full overflow-hidden rounded-full"
      :class="loading ? 'animate-pulse bg-slate-100' : 'bg-slate-100'"
      role="img"
      aria-hidden="true"
    >
      <template v-if="!loading">
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
      </template>
    </div>

    <!-- Filter hint / clear filter -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
        <ListFilter class="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
        {{ t('management.guestGroupsView.rsvpStatsCard.filterHint') }}
      </p>
      <button
        v-if="activeStatus"
        type="button"
        class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-800"
        @click="emit('select-status', null)"
      >
        {{ t('management.guestGroupsView.rsvpStatsCard.clearFilter') }}
        <X class="h-3 w-3" aria-hidden="true" />
      </button>
    </div>

    <!-- Stats grid: attending / maybe / declined / pending -->
    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      <button
        v-for="card in cards"
        :key="card.key"
        type="button"
        class="group relative flex flex-col rounded-xl p-2.5 text-left ring-1 transition-all duration-200 sm:rounded-2xl sm:p-3.5 hover:-translate-y-0.5 hover:shadow-md"
        :class="[
          card.surfaceClass,
          isActive(card.key)
            ? card.activeClass
            : activeStatus
              ? 'opacity-50 saturate-50 hover:opacity-100 hover:saturate-100'
              : ''
        ]"
        :aria-pressed="isActive(card.key)"
        @click="handleSelect(card.key)"
      >
        <!-- Active check badge -->
        <span
          v-if="isActive(card.key)"
          class="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-md"
          :class="card.badgeClass"
          aria-hidden="true"
        >
          <Check class="h-3 w-3" />
        </span>

        <div class="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span
            class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 sm:h-7 sm:w-7"
            :class="card.chipClass"
          >
            <component :is="card.icon" class="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
          </span>
          <span
            class="truncate text-[10px] font-semibold uppercase tracking-wide sm:text-xs"
            :class="card.labelClass"
          >
            {{ card.label }}
          </span>
        </div>
        <div class="mt-2 flex items-baseline gap-1.5 sm:mt-3">
          <span
            v-if="loading"
            class="inline-block h-6 w-10 animate-pulse rounded bg-white/80"
            aria-hidden="true"
          ></span>
          <template v-else>
            <span class="text-lg font-bold leading-none text-slate-900 tabular-nums sm:text-2xl">
              {{ card.count }}
            </span>
            <span class="text-[10px] font-semibold tabular-nums sm:text-xs" :class="card.labelClass">
              {{ percentage(card.count) }}%
            </span>
          </template>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, HelpCircle, X, Clock, Users, ListFilter } from 'lucide-vue-next'
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
  surfaceClass: string
  chipClass: string
  labelClass: string
  activeClass: string
  badgeClass: string
}

const cards = computed<CardConfig[]>(() => [
  {
    key: 'attending',
    label: t('management.guestGroupsView.rsvpStatsCard.cards.going'),
    count: attendingCount.value,
    icon: Check,
    surfaceClass: 'bg-emerald-50/70 ring-emerald-100',
    chipClass: 'text-emerald-600 ring-emerald-100',
    labelClass: 'text-emerald-600',
    activeClass: 'ring-2 ring-emerald-400 shadow-md shadow-emerald-100',
    badgeClass: 'bg-emerald-500',
  },
  {
    key: 'maybe',
    label: t('management.guestGroupsView.rsvpStatsCard.cards.maybe'),
    count: maybeCount.value,
    icon: HelpCircle,
    surfaceClass: 'bg-amber-50/70 ring-amber-100',
    chipClass: 'text-amber-600 ring-amber-100',
    labelClass: 'text-amber-600',
    activeClass: 'ring-2 ring-amber-400 shadow-md shadow-amber-100',
    badgeClass: 'bg-amber-500',
  },
  {
    key: 'not_attending',
    label: t('management.guestGroupsView.rsvpStatsCard.cards.declined'),
    count: notAttendingCount.value,
    icon: X,
    surfaceClass: 'bg-rose-50/70 ring-rose-100',
    chipClass: 'text-rose-600 ring-rose-100',
    labelClass: 'text-rose-600',
    activeClass: 'ring-2 ring-rose-400 shadow-md shadow-rose-100',
    badgeClass: 'bg-rose-500',
  },
  {
    key: 'pending',
    label: t('management.guestGroupsView.rsvpStatsCard.cards.pending'),
    count: pendingCount.value,
    icon: Clock,
    surfaceClass: 'bg-slate-50 ring-slate-200',
    chipClass: 'text-slate-500 ring-slate-200',
    labelClass: 'text-slate-500',
    activeClass: 'ring-2 ring-slate-400 shadow-md shadow-slate-200',
    badgeClass: 'bg-slate-500',
  },
])

const isActive = (key: GuestRsvpStatusValue) => props.activeStatus === key

const handleSelect = (key: GuestRsvpStatusValue) => {
  // Toggle off when clicking the active one
  emit('select-status', isActive(key) ? null : key)
}
</script>
