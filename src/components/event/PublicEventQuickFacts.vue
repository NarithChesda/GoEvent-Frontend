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

        <!-- Keeping the date is a date-row action, so it sits on the date row.
             It used to be a second icon button in the pinned footer, competing
             with the one CTA that bar exists to carry. -->
        <button
          @click="showCalendar = !showCalendar"
          class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-[filter,background-color] hover:brightness-95 active:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          :style="{ backgroundColor: 'var(--evt-tint)', color: 'var(--evt-accent)' }"
          :aria-expanded="showCalendar"
          :title="t('events.drawer.addToCalendar')"
          :aria-label="t('events.drawer.addToCalendar')"
        >
          <CalendarPlus class="w-[18px] h-[18px]" />
        </button>
      </div>

      <!-- Calendar targets. Collapse per design system §15 (grid-rows, not
           max-height) so both directions ease evenly. -->
      <Transition name="collapse">
        <div v-if="showCalendar" class="grid grid-rows-[1fr]">
          <div class="min-h-0 overflow-hidden">
            <div class="flex gap-2 px-4 py-3">
              <button
                v-for="target in calendarTargets"
                :key="target.key"
                @click="target.run"
                class="flex-1 min-w-0 px-2 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-full hover:bg-slate-50 active:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                :title="target.label"
              >
                <span class="block truncate">{{ target.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>

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
            class="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] sm:py-1.5 sm:min-h-0 bg-white border rounded-full text-xs font-semibold shadow-sm transition-colors hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            :style="{ borderColor: 'var(--evt-ring)', color: 'var(--evt-accent)' }"
          >
            {{ t('events.drawer.directions') }}
            <ArrowUpRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { MapPin, Video, ArrowUpRight, CalendarPlus } from 'lucide-vue-next'
import { useEventDateFormatters } from '@/composables/event'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface Props {
  startDate: string
  endDate: string
  location: string | null | undefined
  isVirtual: boolean
}

interface Emits {
  (e: 'open-map'): void
  (e: 'add-to-google'): void
  (e: 'add-to-outlook'): void
  (e: 'download-ics'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useAppLanguage()
const { getMonthAbbr, getDayOfMonth, getFormattedDate, getTimeRange } = useEventDateFormatters()

const monthAbbr = computed(() => getMonthAbbr(props.startDate))
const day = computed(() => getDayOfMonth(props.startDate))
const formattedDate = computed(() => getFormattedDate(props.startDate))
const timeRange = computed(() => getTimeRange(props.startDate, props.endDate))

const showCalendar = ref(false)

// Prev/next swaps the event under this component without remounting it.
watch(
  () => props.startDate,
  () => {
    showCalendar.value = false
  }
)

const calendarTargets = computed(() => [
  {
    key: 'google',
    label: t('events.drawer.calendarOptions.google'),
    run: () => {
      emit('add-to-google')
      showCalendar.value = false
    },
  },
  {
    key: 'outlook',
    label: t('events.drawer.calendarOptions.outlook'),
    run: () => {
      emit('add-to-outlook')
      showCalendar.value = false
    },
  },
  {
    key: 'ics',
    label: t('events.drawer.calendarOptions.ics'),
    run: () => {
      emit('download-ics')
      showCalendar.value = false
    },
  },
])
</script>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none;
  }
}
</style>
