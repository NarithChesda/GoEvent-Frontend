<template>
  <div class="space-y-8">
    <!-- Cash Gift Analytics Section -->
    <CashGiftAnalytics ref="cashGiftAnalyticsRef" :event-id="eventId" :groups="groups" />
  </div>
</template>

<script setup lang="ts">
import CashGiftAnalytics from './CashGiftAnalytics.vue'
import type { GuestGroup } from '../../services/api'

interface Props {
  eventId: string
  groups: GuestGroup[]
}

defineProps<Props>()
</script>
