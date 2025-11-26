<template>
  <div class="space-y-8">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-2">
        <div class="space-y-1">
          <h3 class="text-lg font-bold text-slate-900">Guest Overview</h3>
          <p class="text-sm text-slate-500 mt-1">
            A refined snapshot focused on the metrics that matter most for your invitation flow.
          </p>
        </div>
      </div>
    </header>

    <div class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60">
      <GuestStatsCard :stats="guestStats" :loading="loadingStats" />
    </div>

    <!-- Cash Gift Analytics Section -->
    <CashGiftAnalytics ref="cashGiftAnalyticsRef" :event-id="eventId" :groups="groups" />
  </div>
</template>

<script setup lang="ts">
import GuestStatsCard from './GuestStatsCard.vue'
import CashGiftAnalytics from './CashGiftAnalytics.vue'
import type { GuestGroup, GuestStats } from '../../services/api'

interface Props {
  guestStats: GuestStats | null
  loadingStats: boolean
  eventId: string
  groups: GuestGroup[]
}

defineProps<Props>()
</script>
