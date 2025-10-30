<template>
  <div>
    <CashGiftAnalytics
      v-if="groups.length > 0"
      ref="cashGiftAnalyticsRef"
      :event-id="eventId"
      :groups="groups"
    />
    <div v-else class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center">
      <DollarSign class="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
      <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1.5 sm:mb-2">No Cash Gift Data</h3>
      <p class="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
        Cash gift analytics will appear here once you have guests with cash gift information.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DollarSign } from 'lucide-vue-next'
import CashGiftAnalytics from './CashGiftAnalytics.vue'
import type { GuestGroup } from '../../services/api'

interface Props {
  eventId: string
  groups: GuestGroup[]
}

defineProps<Props>()

const cashGiftAnalyticsRef = ref<InstanceType<typeof CashGiftAnalytics> | null>(null)

// Expose the refresh method so parent can refresh analytics
defineExpose({
  refresh: () => {
    if (cashGiftAnalyticsRef.value) {
      return cashGiftAnalyticsRef.value.refresh()
    }
  }
})
</script>
