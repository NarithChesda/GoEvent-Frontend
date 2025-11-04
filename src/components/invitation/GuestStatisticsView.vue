<template>
  <div class="space-y-8">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-2">

        <div class="space-y-1">
          <h3 class="text-lg font-bold text-slate-900">Guest Overview</h3>
          <p class="text-sm text-slate-500 mt-1">A refined snapshot focused on the metrics that matter most for your invitation flow.</p>
        </div>
      </div>

    </header>

    <div class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60">
      <div class="flex flex-col gap-6">
        <div class="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Invited Guests</p>
            <p class="text-4xl font-semibold tracking-tight text-slate-900" aria-live="polite">
              {{ loadingStats ? '...' : totalGuests }}
            </p>
            <p class="mt-1 text-sm text-slate-500">Total audience you're keeping in the loop.</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <div class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-600 ring-1 ring-emerald-200">
              <Send class="h-4 w-4" aria-hidden="true" />
              <span>{{ loadingStats ? '...' : `${sentInvitations} sent` }}</span>
            </div>

          </div>
        </div>

        <div class="space-y-5">
          <div class="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner" role="img" aria-hidden="true">
            <div
              class="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transition-[width] duration-500"
              :style="{ width: segmentWidth(acceptedInvitations) }"
            ></div>
            <div
              class="h-full bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 transition-[width] duration-500"
              :style="{ width: segmentWidth(awaitingViewInvitations) }"
            ></div>
            <div
              class="h-full bg-gradient-to-r from-slate-300 via-slate-300 to-slate-400 transition-[width] duration-500"
              :style="{ width: segmentWidth(pendingInvitations) }"
            ></div>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-2xl border border-transparent bg-emerald-50/80 p-4 shadow-sm shadow-emerald-100/70">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wide text-emerald-600">Viewed</p>
                <span class="text-xs font-semibold text-emerald-600">
                  {{ loadingStats ? '...' : `${viewedPercentage}%` }}
                </span>
              </div>
              <p class="mt-3 text-lg font-semibold text-slate-900">
                {{ loadingStats ? '...' : `${acceptedInvitations} guests` }}
              </p>
              <p class="text-xs text-emerald-700/70">Already engaged with their invite.</p>
            </div>

            <div class="rounded-2xl border border-transparent bg-sky-50/80 p-4 shadow-sm shadow-sky-100/70">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wide text-sky-600">Awaiting View</p>
                <span class="text-xs font-semibold text-sky-600">
                  {{ loadingStats ? '...' : `${awaitingViewPercentage}%` }}
                </span>
              </div>
              <p class="mt-3 text-lg font-semibold text-slate-900">
                {{ loadingStats ? '...' : `${awaitingViewInvitations} guests` }}
              </p>
              <p class="text-xs text-sky-700/70">Haven't opened their invitation yet.</p>
            </div>

            <div class="rounded-2xl border border-transparent bg-slate-50 p-4 shadow-sm shadow-slate-100/70">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-600">Pending</p>
                <span class="text-xs font-semibold text-slate-600">
                  {{ loadingStats ? '...' : `${pendingPercentage}%` }}
                </span>
              </div>
              <p class="mt-3 text-lg font-semibold text-slate-900">
                {{ loadingStats ? '...' : `${pendingInvitations} guests` }}
              </p>
              <p class="text-xs text-slate-500">Still waiting to receive an invite.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cash Gift Analytics Section -->
    <CashGiftAnalytics
      ref="cashGiftAnalyticsRef"
      :event-id="eventId"
      :groups="groups"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Eye, Send } from 'lucide-vue-next'
import CashGiftAnalytics from './CashGiftAnalytics.vue'
import type { GuestGroup } from '../../services/api'

interface GuestStats {
  total_guests: number
  sent: number
  viewed: number
}

interface Props {
  guestStats: GuestStats | null
  loadingStats: boolean
  eventId: string
  groups: GuestGroup[]
}

const props = defineProps<Props>()

const acceptedInvitations = computed(() => props.guestStats?.viewed || 0)
const totalGuests = computed(() => props.guestStats?.total_guests || 0)
const sentInvitations = computed(() => props.guestStats?.sent || 0)
const pendingInvitations = computed(() => {
  const total = totalGuests.value
  const sent = sentInvitations.value
  return Math.max(0, total - sent)
})

const awaitingViewInvitations = computed(() => {
  const sent = sentInvitations.value
  const viewed = acceptedInvitations.value
  return Math.max(0, sent - viewed)
})

const sentPercentage = computed(() => {
  const total = totalGuests.value
  if (total === 0) return 0
  return Math.round((sentInvitations.value / total) * 100)
})

const viewedPercentage = computed(() => {
  const total = totalGuests.value
  if (total === 0) return 0
  return Math.round((acceptedInvitations.value / total) * 100)
})

const pendingPercentage = computed(() => {
  const total = totalGuests.value
  if (total === 0) return 0
  return Math.round((pendingInvitations.value / total) * 100)
})

const awaitingViewPercentage = computed(() => {
  const total = totalGuests.value
  if (total === 0) return 0
  return Math.round((awaitingViewInvitations.value / total) * 100)
})

const viewRate = computed(() => {
  const sent = sentInvitations.value
  if (sent === 0) return 0
  return Math.round((acceptedInvitations.value / sent) * 100)
})

const segmentWidth = (count: number) => {
  const total = totalGuests.value
  if (total === 0) return '0%'
  const normalizedCount = Math.min(Math.max(count, 0), total)
  const percentage = (normalizedCount / total) * 100
  return `${percentage.toFixed(1)}%`
}
</script>
