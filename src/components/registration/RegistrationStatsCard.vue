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
          Registrations
        </p>
        <p
          :class="[
            'font-semibold text-slate-900 transition-all duration-300',
            compact ? 'text-3xl' : 'text-4xl tracking-tight'
          ]"
          aria-live="polite"
        >
          {{ loading ? '...' : totalRegistrations }}
        </p>
        <p v-if="!compact" class="mt-1 text-sm text-slate-500">
          Total attendees registered for your event.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div
          :class="[
            'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 font-semibold text-emerald-600',
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm ring-1 ring-emerald-200'
          ]"
        >
          <UserCheck :class="compact ? 'h-3.5 w-3.5' : 'h-4 w-4'" aria-hidden="true" />
          <span>{{ loading ? '...' : `${checkedInCount} checked in` }}</span>
        </div>
        <div
          v-if="totalAttendees > totalRegistrations"
          :class="[
            'inline-flex items-center gap-1.5 rounded-full bg-slate-100 font-semibold text-slate-600',
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm ring-1 ring-slate-200'
          ]"
        >
          <Users :class="compact ? 'h-3.5 w-3.5' : 'h-4 w-4'" aria-hidden="true" />
          <span>{{ loading ? '...' : `${totalAttendees} attendees` }}</span>
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
        :style="{ width: segmentWidth(checkedInCount) }"
      ></div>
      <div
        :class="[
          'h-full transition-all duration-700 ease-out',
          compact ? 'bg-sky-500' : 'bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600'
        ]"
        :style="{ width: segmentWidth(pendingCount) }"
      ></div>
      <div
        :class="[
          'h-full transition-all duration-700 ease-out',
          compact ? 'bg-red-400' : 'bg-gradient-to-r from-red-300 via-red-400 to-red-500'
        ]"
        :style="{ width: segmentWidth(cancelledCount) }"
      ></div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-3 gap-2 sm:gap-3">
      <!-- Checked In Card -->
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
            Checked In
          </p>
          <span :class="['text-[10px] sm:text-xs font-semibold', compact ? 'text-emerald-600' : 'text-emerald-600']">
            {{ loading ? '...' : `${checkedInPercentage}%` }}
          </span>
        </div>
        <p :class="['font-bold text-slate-900 transition-all duration-300', compact ? 'text-lg' : 'mt-1 sm:mt-3 text-lg sm:text-xl leading-tight']">
          {{ loading ? '...' : checkedInCount }}
        </p>
        <p v-if="!compact" class="hidden sm:block text-[10px] sm:text-xs text-emerald-700/70 leading-tight mt-1">
          Successfully checked in at the event.
        </p>
        <p v-if="!compact" class="sm:hidden text-[9px] text-emerald-700/60 leading-tight mt-0.5">
          Arrived
        </p>
      </div>

      <!-- Pending Card -->
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
            Pending
          </p>
          <span :class="['text-[10px] sm:text-xs font-semibold', compact ? 'text-sky-600' : 'text-sky-600']">
            {{ loading ? '...' : `${pendingPercentage}%` }}
          </span>
        </div>
        <p :class="['font-bold text-slate-900 transition-all duration-300', compact ? 'text-lg' : 'mt-1 sm:mt-3 text-lg sm:text-xl leading-tight']">
          {{ loading ? '...' : pendingCount }}
        </p>
        <p v-if="!compact" class="hidden sm:block text-[10px] sm:text-xs text-sky-700/70 leading-tight mt-1">
          Registered but not yet checked in.
        </p>
        <p v-if="!compact" class="sm:hidden text-[9px] text-sky-700/60 leading-tight mt-0.5">
          Waiting
        </p>
      </div>

      <!-- Cancelled Card -->
      <div
        :class="[
          compact ? 'rounded-xl bg-red-50 p-3' : 'rounded-lg sm:rounded-2xl border border-transparent bg-red-50/80 p-2.5 sm:p-4 shadow-sm shadow-red-100/70'
        ]"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <p
            :class="[
              'text-[10px] sm:text-xs mb-1 sm:mb-0',
              compact ? 'font-medium text-red-700' : 'font-semibold uppercase tracking-wide text-red-600'
            ]"
          >
            Cancelled
          </p>
          <span :class="['text-[10px] sm:text-xs font-semibold', compact ? 'text-red-600' : 'text-red-600']">
            {{ loading ? '...' : `${cancelledPercentage}%` }}
          </span>
        </div>
        <p :class="['font-bold text-slate-900 transition-all duration-300', compact ? 'text-lg' : 'mt-1 sm:mt-3 text-lg sm:text-xl leading-tight']">
          {{ loading ? '...' : cancelledCount }}
        </p>
        <p v-if="!compact" class="hidden sm:block text-[10px] sm:text-xs text-red-700/70 leading-tight mt-1">
          Registration was cancelled.
        </p>
        <p v-if="!compact" class="sm:hidden text-[9px] text-red-700/60 leading-tight mt-0.5">
          Cancelled
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { UserCheck, Users } from 'lucide-vue-next'

interface Props {
  totalRegistrations: number
  checkedInCount: number
  pendingCount: number
  cancelledCount: number
  totalAttendees?: number
  loading?: boolean
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  totalAttendees: 0,
  loading: false,
  compact: false,
})

// Computed percentages
const checkedInPercentage = computed(() => {
  if (props.totalRegistrations === 0) return 0
  return Math.round((props.checkedInCount / props.totalRegistrations) * 100)
})

const pendingPercentage = computed(() => {
  if (props.totalRegistrations === 0) return 0
  return Math.round((props.pendingCount / props.totalRegistrations) * 100)
})

const cancelledPercentage = computed(() => {
  if (props.totalRegistrations === 0) return 0
  return Math.round((props.cancelledCount / props.totalRegistrations) * 100)
})

const segmentWidth = (count: number) => {
  if (props.totalRegistrations === 0) return '0%'
  const percentage = (Math.min(Math.max(count, 0), props.totalRegistrations) / props.totalRegistrations) * 100
  return `${percentage.toFixed(1)}%`
}
</script>
