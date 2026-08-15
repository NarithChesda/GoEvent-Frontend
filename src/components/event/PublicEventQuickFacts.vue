<template>
  <!-- Lifted out of the scroll and overlapped onto the hero. The facts a reader
       opens the drawer for shouldn't be the third thing in a flat stack; the
       overlap is also the panel's only depth cue, which is what separates this
       from a list of rows. -->
  <div
    class="relative -mt-7 mx-4 rounded-2xl border bg-white shadow-lg shadow-slate-900/[0.06] overflow-hidden"
    :style="{ borderColor: 'var(--evt-ring)' }"
  >
    <div class="absolute inset-0 pointer-events-none" :style="{ backgroundColor: 'var(--evt-wash)' }" aria-hidden="true"></div>

    <div class="relative divide-y divide-slate-100">
      <!-- Date & time -->
      <div class="flex items-start gap-3 p-4">
        <div
          class="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
          :style="{ backgroundColor: 'var(--evt-tint)', color: 'var(--evt-accent)' }"
        >
          <span class="text-[9px] font-bold uppercase leading-none tracking-wide">{{ monthAbbr }}</span>
          <span class="text-lg font-bold leading-tight mt-0.5">{{ day }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-900">{{ formattedDate }}</p>
          <p class="text-sm text-slate-600">{{ timeRange }}</p>
        </div>
      </div>

      <!-- Location -->
      <div v-if="location || isVirtual" class="flex items-start gap-3 p-4">
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          :style="{ backgroundColor: 'var(--evt-tint)', color: 'var(--evt-accent)' }"
        >
          <Video v-if="isVirtual" class="w-5 h-5" />
          <MapPin v-else class="w-5 h-5" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-900">
            {{ isVirtual ? t('events.drawer.virtualEvent') : location }}
          </p>
          <!-- A 24px-tall chip is a hard tap on a phone; the design system's
               40px floor applies here too, and relaxes back on pointer devices. -->
          <button
            v-if="!isVirtual && location"
            @click="emit('open-map')"
            class="mt-1.5 inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] sm:px-2 sm:py-1 sm:min-h-0 rounded-lg sm:rounded-md text-xs sm:text-[11px] font-semibold transition-colors hover:brightness-95 active:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            :style="{ backgroundColor: 'var(--evt-tint)', color: 'var(--evt-accent)' }"
          >
            <ExternalLink class="w-3.5 h-3.5 sm:w-3 sm:h-3" />
            {{ t('events.drawer.directions') }}
          </button>
        </div>
      </div>

      <!-- Social proof. `registrations_count` and `likes_count` were already on
           the payload and shown on the list card, but the drawer — the surface
           where "is anyone else going?" actually matters — never surfaced them. -->
      <div v-if="attendanceLabel" class="flex items-center gap-3 px-4 py-3">
        <div
          class="w-12 flex items-center justify-center flex-shrink-0"
          :style="{ color: 'var(--evt-accent)' }"
        >
          <Users class="w-5 h-5" />
        </div>
        <p class="text-sm font-medium text-slate-700 min-w-0 truncate">{{ attendanceLabel }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MapPin, Video, ExternalLink, Users } from 'lucide-vue-next'
import { useEventDateFormatters } from '@/composables/event'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface Props {
  startDate: string
  endDate: string
  location: string | null | undefined
  isVirtual: boolean
  /** "240 going" / "12 interested", or null when the event has neither. */
  attendanceLabel?: string | null
}

interface Emits {
  (e: 'open-map'): void
}

const props = withDefaults(defineProps<Props>(), {
  attendanceLabel: null,
})
const emit = defineEmits<Emits>()

const { t } = useAppLanguage()
const { getMonthAbbr, getDayOfMonth, getFormattedDate, getTimeRange } = useEventDateFormatters()

const monthAbbr = computed(() => getMonthAbbr(props.startDate))
const day = computed(() => getDayOfMonth(props.startDate))
const formattedDate = computed(() => getFormattedDate(props.startDate))
const timeRange = computed(() => getTimeRange(props.startDate, props.endDate))
</script>
