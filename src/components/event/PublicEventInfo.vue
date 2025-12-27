<template>
  <div class="space-y-4">
    <!-- Date & Time -->
    <div class="flex items-start gap-3">
      <div
        class="w-12 h-12 bg-slate-100 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
      >
        <span
          class="text-[9px] font-semibold text-slate-500 uppercase leading-none"
          >{{ monthAbbr }}</span
        >
        <span class="text-lg font-bold text-slate-900 leading-tight mt-0.5">{{ day }}</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-900">{{ formattedDate }}</p>
        <p class="text-sm text-slate-600">{{ timeRange }}</p>
      </div>
    </div>

    <!-- Location -->
    <div v-if="location || isVirtual" class="flex items-start gap-3">
      <div
        class="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0"
      >
        <Video v-if="isVirtual" class="w-5 h-5 text-slate-600" />
        <MapPin v-else class="w-5 h-5 text-slate-600" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-900">
          {{ isVirtual ? 'Virtual Event' : location }}
        </p>
        <button
          v-if="!isVirtual && location"
          @click="emit('open-map')"
          class="mt-1.5 text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
        >
          <ExternalLink class="w-4 h-4" />
          View on Map
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MapPin, Video, ExternalLink } from 'lucide-vue-next'
import { useEventDateFormatters } from '@/composables/event'

interface Props {
  startDate: string
  endDate: string
  location: string | undefined
  isVirtual: boolean
}

interface Emits {
  (e: 'open-map'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { getMonthAbbr, getDayOfMonth, getFormattedDate, getTimeRange } =
  useEventDateFormatters()

const monthAbbr = computed(() => getMonthAbbr(props.startDate))
const day = computed(() => getDayOfMonth(props.startDate))
const formattedDate = computed(() => getFormattedDate(props.startDate))
const timeRange = computed(() => getTimeRange(props.startDate, props.endDate))
</script>
