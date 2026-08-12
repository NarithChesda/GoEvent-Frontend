<template>
  <div class="space-y-4">
    <!-- Date & Time -->
    <div class="flex items-start gap-3">
      <div
        class="w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
        :style="{ backgroundColor: withAlpha(accent, '14'), color: accent }"
      >
        <span class="text-[9px] font-bold uppercase leading-none tracking-wide">{{ monthAbbr }}</span>
        <span class="text-lg font-bold leading-tight mt-0.5">{{ day }}</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-900">{{ formattedDate }}</p>
        <p class="text-sm text-slate-600">{{ timeRange }}</p>
        <span
          v-if="relativeLabel"
          class="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold"
          :class="isLive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
        >
          <span v-if="isLive" class="w-1.5 h-1.5 rounded-full bg-emerald-500 live-pulse"></span>
          <Clock v-else class="w-3 h-3" />
          {{ relativeLabel }}
        </span>
      </div>
    </div>

    <!-- Location -->
    <div v-if="location || isVirtual" class="flex items-start gap-3">
      <div
        class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
        :style="{ backgroundColor: withAlpha(accent, '14'), color: accent }"
      >
        <Video v-if="isVirtual" class="w-5 h-5" />
        <MapPin v-else class="w-5 h-5" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-900">
          {{ isVirtual ? 'Virtual Event' : location }}
        </p>
        <button
          v-if="!isVirtual && location"
          @click="emit('open-map')"
          class="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors hover:brightness-95"
          :style="{ backgroundColor: withAlpha(accent, '14'), color: accent }"
        >
          <ExternalLink class="w-3 h-3" />
          {{ t('events.drawer.directions') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MapPin, Video, ExternalLink, Clock } from 'lucide-vue-next'
import { useEventDateFormatters } from '@/composables/event'
import { withAlpha } from '@/composables/useEventFormatters'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface Props {
  startDate: string
  endDate: string
  location: string | undefined
  isVirtual: boolean
  /** The event category's identity colour — same source as the cover art. */
  accent: string
  /** "In 9 days" / "Happening now", or null past the horizon. */
  relativeLabel?: string | null
  isLive?: boolean
}

interface Emits {
  (e: 'open-map'): void
}

const props = withDefaults(defineProps<Props>(), {
  relativeLabel: null,
  isLive: false,
})
const emit = defineEmits<Emits>()

const { t } = useAppLanguage()
const { getMonthAbbr, getDayOfMonth, getFormattedDate, getTimeRange } =
  useEventDateFormatters()

const monthAbbr = computed(() => getMonthAbbr(props.startDate))
const day = computed(() => getDayOfMonth(props.startDate))
const formattedDate = computed(() => getFormattedDate(props.startDate))
const timeRange = computed(() => getTimeRange(props.startDate, props.endDate))
</script>

<style scoped>
.live-pulse {
  animation: live-pulse 1.8s ease-in-out infinite;
}

@keyframes live-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.45;
    transform: scale(0.8);
  }
}

@media (prefers-reduced-motion: reduce) {
  .live-pulse {
    animation: none;
  }
}
</style>
