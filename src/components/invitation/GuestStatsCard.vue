<template>
  <div :class="compact ? 'space-y-4' : 'space-y-5'">
    <!-- Stats Summary -->
    <div class="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
      <div>
        <p
          :class="[
            'uppercase',
            compact ? 'text-xs font-medium tracking-wide text-slate-400' : 'text-xs font-semibold tracking-[0.2em] text-slate-400'
          ]"
        >
          Invited Guests
        </p>
        <p
          :class="[
            'font-semibold text-slate-900 transition-all duration-300',
            compact ? 'text-3xl' : 'text-4xl tracking-tight'
          ]"
          aria-live="polite"
        >
          {{ loading ? '...' : totalGuests }}
        </p>
        <p v-if="!compact" class="mt-1 text-sm text-slate-500">
          Total audience you're keeping in the loop.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div
          :class="[
            'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 font-semibold text-emerald-600',
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm ring-1 ring-emerald-200'
          ]"
        >
          <Send :class="compact ? 'h-3.5 w-3.5' : 'h-4 w-4'" aria-hidden="true" />
          <span>{{ loading ? '...' : `${sentInvitations} sent` }}</span>
        </div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div
      :class="[
        'flex w-full overflow-hidden rounded-full bg-slate-100',
        compact ? 'h-2' : 'h-3 shadow-inner'
      ]"
      role="img"
      aria-hidden="true"
    >
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
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-3 gap-2 sm:gap-3">
      <!-- Viewed Card -->
      <div
        :class="[
          'bg-emerald-50',
          compact ? 'rounded-xl p-3' : 'rounded-lg sm:rounded-2xl border border-transparent bg-emerald-50/80 p-2.5 sm:p-4 shadow-sm shadow-emerald-100/70'
        ]"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <p
            :class="[
              'text-[10px] sm:text-xs mb-1 sm:mb-0',
              compact ? 'font-medium text-emerald-700' : 'font-semibold uppercase tracking-wide text-emerald-600'
            ]"
          >
            Viewed
          </p>
          <span :class="['text-[10px] sm:text-xs font-semibold', compact ? 'text-emerald-600' : 'text-emerald-600']">
            {{ loading ? '...' : `${viewedPercentage}%` }}
          </span>
        </div>
        <p :class="['font-bold text-slate-900 transition-all duration-300', compact ? 'text-lg' : 'mt-1 sm:mt-3 text-lg sm:text-xl leading-tight']">
          {{ loading ? '...' : viewedInvitations }}
        </p>
        <p v-if="!compact" class="hidden sm:block text-[10px] sm:text-xs text-emerald-700/70 leading-tight mt-1">
          Already engaged with their invite.
        </p>
        <p v-if="!compact" class="sm:hidden text-[9px] text-emerald-700/60 leading-tight mt-0.5">
          Engaged
        </p>
      </div>

      <!-- Awaiting View Card -->
      <div
        :class="[
          'bg-sky-50',
          compact ? 'rounded-xl p-3' : 'rounded-lg sm:rounded-2xl border border-transparent bg-sky-50/80 p-2.5 sm:p-4 shadow-sm shadow-sky-100/70'
        ]"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <p
            :class="[
              'text-[10px] sm:text-xs mb-1 sm:mb-0',
              compact ? 'font-medium text-sky-700' : 'font-semibold uppercase tracking-wide text-sky-600'
            ]"
          >
            Awaiting
          </p>
          <span :class="['text-[10px] sm:text-xs font-semibold', compact ? 'text-sky-600' : 'text-sky-600']">
            {{ loading ? '...' : `${awaitingViewPercentage}%` }}
          </span>
        </div>
        <p :class="['font-bold text-slate-900 transition-all duration-300', compact ? 'text-lg' : 'mt-1 sm:mt-3 text-lg sm:text-xl leading-tight']">
          {{ loading ? '...' : awaitingViewInvitations }}
        </p>
        <p v-if="!compact" class="hidden sm:block text-[10px] sm:text-xs text-sky-700/70 leading-tight mt-1">
          Haven't opened their invitation yet.
        </p>
        <p v-if="!compact" class="sm:hidden text-[9px] text-sky-700/60 leading-tight mt-0.5">
          Not opened
        </p>
      </div>

      <!-- Pending Card -->
      <div
        :class="[
          compact ? 'rounded-xl bg-slate-100 p-3' : 'rounded-lg sm:rounded-2xl border border-transparent bg-slate-50 p-2.5 sm:p-4 shadow-sm shadow-slate-100/70'
        ]"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <p
            :class="[
              'text-[10px] sm:text-xs mb-1 sm:mb-0',
              compact ? 'font-medium text-slate-600' : 'font-semibold uppercase tracking-wide text-slate-600'
            ]"
          >
            Pending
          </p>
          <span :class="['text-[10px] sm:text-xs font-semibold', compact ? 'text-slate-500' : 'text-slate-600']">
            {{ loading ? '...' : `${pendingPercentage}%` }}
          </span>
        </div>
        <p :class="['font-bold text-slate-900 transition-all duration-300', compact ? 'text-lg' : 'mt-1 sm:mt-3 text-lg sm:text-xl leading-tight']">
          {{ loading ? '...' : pendingInvitations }}
        </p>
        <p v-if="!compact" class="hidden sm:block text-[10px] sm:text-xs text-slate-500 leading-tight mt-1">
          Still waiting to receive an invite.
        </p>
        <p v-if="!compact" class="sm:hidden text-[9px] text-slate-500 leading-tight mt-0.5">
          Not sent
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Send } from 'lucide-vue-next'
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

// Computed properties for guest statistics
const totalGuests = computed(() => props.stats?.total_guests || 0)
const sentInvitations = computed(() => props.stats?.sent || 0)
const viewedInvitations = computed(() => props.stats?.viewed || 0)
const pendingInvitations = computed(() => Math.max(0, totalGuests.value - sentInvitations.value))
const awaitingViewInvitations = computed(() => Math.max(0, sentInvitations.value - viewedInvitations.value))

const viewedPercentage = computed(() => {
  if (totalGuests.value === 0) return 0
  return Math.round((viewedInvitations.value / totalGuests.value) * 100)
})

const awaitingViewPercentage = computed(() => {
  if (totalGuests.value === 0) return 0
  return Math.round((awaitingViewInvitations.value / totalGuests.value) * 100)
})

const pendingPercentage = computed(() => {
  if (totalGuests.value === 0) return 0
  return Math.round((pendingInvitations.value / totalGuests.value) * 100)
})

const segmentWidth = (count: number) => {
  if (totalGuests.value === 0) return '0%'
  const percentage = (Math.min(Math.max(count, 0), totalGuests.value) / totalGuests.value) * 100
  return `${percentage.toFixed(1)}%`
}
</script>
