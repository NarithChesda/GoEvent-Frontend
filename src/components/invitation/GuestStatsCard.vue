<template>
  <div :class="compact ? 'space-y-4' : 'space-y-5'">
    <!-- Stats Summary -->
    <div class="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
      <div>
        <p
          :class="[
            'uppercase',
            compact ? 'text-xs font-medium tracking-wide text-slate-400' : 'text-[11px] font-semibold tracking-wider text-slate-400'
          ]"
        >
          {{ t('management.guestGroupsView.statsCard.invitedGuests') }}
        </p>
        <div
          v-if="loading"
          :class="['mt-1 animate-pulse rounded-lg bg-slate-100', compact ? 'h-8 w-16' : 'h-10 w-20']"
          aria-hidden="true"
        ></div>
        <p
          v-else
          :class="[
            'font-semibold text-slate-900 tabular-nums transition-all duration-300',
            compact ? 'text-3xl' : 'text-4xl tracking-tight'
          ]"
          aria-live="polite"
        >
          {{ totalGuests }}
        </p>
        <p v-if="!compact" class="mt-1 text-sm text-slate-500">
          {{ t('management.guestGroupsView.statsCard.totalAudienceDesc') }}
        </p>
      </div>
      <div
        :class="[
          'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 font-semibold text-emerald-600',
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm ring-1 ring-emerald-200'
        ]"
      >
        <Send :class="compact ? 'h-3.5 w-3.5' : 'h-4 w-4'" aria-hidden="true" />
        <span v-if="loading" class="inline-block h-3 w-12 animate-pulse rounded bg-emerald-100" aria-hidden="true"></span>
        <span v-else>{{ `${sentInvitations} ${t('management.guestGroupsView.statsCard.sent')}` }}</span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div
      :class="[
        'flex w-full overflow-hidden rounded-full',
        loading ? 'animate-pulse bg-slate-100' : 'bg-slate-100',
        compact ? 'h-2' : 'h-3 shadow-inner'
      ]"
      role="img"
      aria-hidden="true"
    >
      <template v-if="!loading">
        <div
          :class="[
            'h-full transition-all duration-700 ease-out',
            compact ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600'
          ]"
          :style="{ width: segmentWidth(viewedInvitations) }"
        ></div>
        <div
          :class="[
            'h-full transition-all duration-700 ease-out',
            compact ? 'bg-sky-500' : 'bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600'
          ]"
          :style="{ width: segmentWidth(awaitingViewInvitations) }"
        ></div>
        <div
          :class="[
            'h-full transition-all duration-700 ease-out',
            compact ? 'bg-slate-300' : 'bg-gradient-to-r from-slate-300 via-slate-300 to-slate-400'
          ]"
          :style="{ width: segmentWidth(pendingInvitations) }"
        ></div>
      </template>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-3 gap-2 sm:gap-3">
      <div
        v-for="tile in tiles"
        :key="tile.key"
        :class="[
          'ring-1 transition-colors',
          tile.surfaceClass,
          compact ? 'rounded-xl p-3' : 'rounded-xl sm:rounded-2xl p-2.5 sm:p-4'
        ]"
      >
        <div class="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span
            :class="[
              'flex flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1',
              tile.chipClass,
              compact ? 'h-6 w-6' : 'h-6 w-6 sm:h-7 sm:w-7'
            ]"
          >
            <component :is="tile.icon" :class="compact ? 'h-3 w-3' : 'h-3 w-3 sm:h-3.5 sm:w-3.5'" aria-hidden="true" />
          </span>
          <span
            :class="[
              'truncate text-[10px] sm:text-xs',
              compact ? 'font-medium' : 'font-semibold uppercase tracking-wide',
              tile.labelClass
            ]"
          >
            {{ tile.label }}
          </span>
        </div>
        <div :class="['flex items-baseline gap-1.5', compact ? 'mt-2' : 'mt-2 sm:mt-3']">
          <span
            v-if="loading"
            class="inline-block h-6 w-10 animate-pulse rounded bg-white/80"
            aria-hidden="true"
          ></span>
          <template v-else>
            <span
              :class="[
                'font-bold leading-none text-slate-900 tabular-nums transition-all duration-300',
                compact ? 'text-lg' : 'text-lg sm:text-2xl'
              ]"
            >
              {{ tile.count }}
            </span>
            <span :class="['text-[10px] sm:text-xs font-semibold tabular-nums', tile.labelClass]">
              {{ tile.percent }}%
            </span>
          </template>
        </div>
        <template v-if="!compact">
          <p class="mt-1.5 hidden sm:block text-[11px] leading-snug" :class="tile.descClass">
            {{ tile.desc }}
          </p>
          <p class="mt-1 sm:hidden text-[9px] leading-tight" :class="tile.descClass">
            {{ tile.shortDesc }}
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Send, Eye, Mail, Clock } from 'lucide-vue-next'
import type { GuestStats } from '../../services/api'

interface Props {
  stats: GuestStats | null
  loading?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  compact: false,
})

const { t } = useI18n()

// Computed properties for guest statistics
const totalGuests = computed(() => props.stats?.total_guests || 0)
const sentInvitations = computed(() => props.stats?.sent || 0)
const viewedInvitations = computed(() => props.stats?.viewed || 0)
const pendingInvitations = computed(() => Math.max(0, totalGuests.value - sentInvitations.value))
const awaitingViewInvitations = computed(() => Math.max(0, sentInvitations.value - viewedInvitations.value))

const percentage = (count: number) => {
  if (totalGuests.value === 0) return 0
  return Math.round((count / totalGuests.value) * 100)
}

const segmentWidth = (count: number) => {
  if (totalGuests.value === 0) return '0%'
  const pct = (Math.min(Math.max(count, 0), totalGuests.value) / totalGuests.value) * 100
  return `${pct.toFixed(1)}%`
}

interface TileConfig {
  key: string
  label: string
  desc: string
  shortDesc: string
  count: number
  percent: number
  icon: typeof Eye
  surfaceClass: string
  chipClass: string
  labelClass: string
  descClass: string
}

// Tile colors mirror the progress bar segments (emerald → sky → slate)
// so the grid doubles as the bar's legend.
const tiles = computed<TileConfig[]>(() => [
  {
    key: 'viewed',
    label: t('management.guestGroupsView.statsCard.viewed'),
    desc: t('management.guestGroupsView.statsCard.viewedDesc'),
    shortDesc: t('management.guestGroupsView.statsCard.viewedShort'),
    count: viewedInvitations.value,
    percent: percentage(viewedInvitations.value),
    icon: Eye,
    surfaceClass: 'bg-emerald-50/70 ring-emerald-100',
    chipClass: 'text-emerald-600 ring-emerald-100',
    labelClass: 'text-emerald-600',
    descClass: 'text-emerald-700/70',
  },
  {
    key: 'awaiting',
    label: t('management.guestGroupsView.statsCard.awaiting'),
    desc: t('management.guestGroupsView.statsCard.awaitingDesc'),
    shortDesc: t('management.guestGroupsView.statsCard.awaitingShort'),
    count: awaitingViewInvitations.value,
    percent: percentage(awaitingViewInvitations.value),
    icon: Mail,
    surfaceClass: 'bg-sky-50/70 ring-sky-100',
    chipClass: 'text-sky-600 ring-sky-100',
    labelClass: 'text-sky-600',
    descClass: 'text-sky-700/70',
  },
  {
    key: 'pending',
    label: t('management.guestGroupsView.statsCard.pending'),
    desc: t('management.guestGroupsView.statsCard.pendingDesc'),
    shortDesc: t('management.guestGroupsView.statsCard.pendingShort'),
    count: pendingInvitations.value,
    percent: percentage(pendingInvitations.value),
    icon: Clock,
    surfaceClass: 'bg-slate-50 ring-slate-100',
    chipClass: 'text-slate-500 ring-slate-200',
    labelClass: 'text-slate-500',
    descClass: 'text-slate-500',
  },
])
</script>
