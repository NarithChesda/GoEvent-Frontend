<template>
  <div class="dtc">
    <!-- Month navigation -->
    <div class="flex items-center justify-between mb-1">
      <button
        type="button"
        :aria-label="t('common.dateTimePicker.previousMonth')"
        class="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition-[background-color,transform] duration-150 ease-out active:scale-90"
        @click="shiftMonth(-1)"
      >
        <ChevronLeft class="w-5 h-5" aria-hidden="true" />
      </button>
      <span class="text-base font-semibold text-slate-900">{{ monthLabel }}</span>
      <button
        type="button"
        :aria-label="t('common.dateTimePicker.nextMonth')"
        class="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition-[background-color,transform] duration-150 ease-out active:scale-90"
        @click="shiftMonth(1)"
      >
        <ChevronRight class="w-5 h-5" aria-hidden="true" />
      </button>
    </div>

    <!-- Weekday headers -->
    <div class="grid grid-cols-7 mb-1">
      <span
        v-for="(day, index) in weekdayLabels"
        :key="index"
        class="text-center text-xs font-semibold text-slate-400 uppercase"
      >
        {{ day }}
      </span>
    </div>

    <!-- Day grid -->
    <div class="grid grid-cols-7 gap-y-1">
      <span v-for="i in leadingBlanks" :key="`blank-${i}`" aria-hidden="true" />
      <button
        v-for="day in monthDays"
        :key="day.day"
        type="button"
        :disabled="day.disabled"
        :aria-label="day.ariaLabel"
        :aria-pressed="day.selected"
        class="h-10 w-10 sm:h-9 sm:w-9 mx-auto flex items-center justify-center text-sm rounded-full transition-[background-color,color,transform] duration-150 ease-out active:scale-90 disabled:active:scale-100"
        :class="dayClasses(day)"
        @click="selectDay(day.day)"
      >
        {{ day.day }}
      </button>
    </div>

    <!-- Time -->
    <div class="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
      <span class="flex items-center gap-1.5 text-sm font-medium text-slate-700">
        <Clock class="w-4 h-4 text-slate-400" aria-hidden="true" />
        {{ t('common.dateTimePicker.time') }}
      </span>

      <!-- Typical hours for a hosted event: one tap sets the whole time, so
           they sit above the wheel as the shortcut, not beside it as a rival. -->
      <div v-if="quickTimes.length" class="grid grid-cols-3 gap-1.5">
        <button
          v-for="quick in quickTimes"
          :key="quick"
          type="button"
          :aria-pressed="parts.h === quick && parts.mi === 0"
          class="px-2 py-1.5 text-sm font-medium rounded-lg text-center transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-95"
          :class="
            parts.h === quick && parts.mi === 0
              ? 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          "
          @click="selectQuickTime(quick)"
        >
          {{ formatHourLabel(quick) }}
        </button>
      </div>

      <TimeWheel
        :hour="parts.h"
        :minute="parts.mi"
        @update:hour="patch({ h: $event })"
        @update:minute="patch({ mi: $event })"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import TimeWheel from './TimeWheel.vue'
import {
  dayStart,
  formatDateTime,
  parseDateTime,
  seedDateTime,
  type DateTimeParts,
} from './dateTimeValue'

/**
 * Month grid + time wheel, with no opinion about the surface it is drawn on.
 *
 * Extracted so the popover field and the inline disclosure row cannot drift
 * apart: one is a draft edited behind a Done button, the other commits live,
 * and that difference belongs to the *container*. This component is purely
 * controlled — it is handed a value and reports a new one.
 */

interface Props {
  /** `YYYY-MM-DDTHH:mm`. Anything unparseable is seeded from now. */
  modelValue: string
  min?: string
  max?: string
  /** Hour-of-day (0-23) one-tap presets. */
  quickTimes?: number[]
}

const props = withDefaults(defineProps<Props>(), { quickTimes: () => [] })

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const { t, locale } = useAppLanguage()

const parts = computed<DateTimeParts>(() => seedDateTime(props.modelValue, props.min, props.max))

const patch = (changes: Partial<DateTimeParts>) => {
  emit('update:modelValue', formatDateTime({ ...parts.value, ...changes }))
}

/**
 * The browsed month is local state — it has to survive paging away from the
 * selected date. It follows the value only when the value itself changes, so
 * pressing "next" does not snap back and picking a day does not jump.
 */
const viewYear = ref(parts.value.y)
const viewMonth = ref(parts.value.mo)

watch(
  () => props.modelValue,
  () => {
    viewYear.value = parts.value.y
    viewMonth.value = parts.value.mo
  },
)

const intlLocale = computed(() => (locale.value === 'kh' ? 'km-KH' : 'en-US'))

const monthLabel = computed(() =>
  new Intl.DateTimeFormat(intlLocale.value, { month: 'long', year: 'numeric' }).format(
    new Date(viewYear.value, viewMonth.value, 1),
  ),
)

// Sunday-first weekday initials (Aug 1 2021 was a Sunday)
const weekdayLabels = computed(() => {
  const formatter = new Intl.DateTimeFormat(intlLocale.value, { weekday: 'narrow' })
  return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(2021, 7, i + 1)))
})

const leadingBlanks = computed(() => new Date(viewYear.value, viewMonth.value, 1).getDay())

const minTime = computed(() => dayStart(parseDateTime(props.min)))
const maxTime = computed(() => dayStart(parseDateTime(props.max)))

interface DayCell {
  day: number
  disabled: boolean
  selected: boolean
  isToday: boolean
  ariaLabel: string
}

const monthDays = computed<DayCell[]>(() => {
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const today = new Date()
  const dayFormatter = new Intl.DateTimeFormat(intlLocale.value, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const time = new Date(viewYear.value, viewMonth.value, day).getTime()
    return {
      day,
      disabled:
        (minTime.value !== null && time < minTime.value) ||
        (maxTime.value !== null && time > maxTime.value),
      selected:
        parts.value.y === viewYear.value &&
        parts.value.mo === viewMonth.value &&
        parts.value.d === day,
      isToday:
        today.getFullYear() === viewYear.value &&
        today.getMonth() === viewMonth.value &&
        today.getDate() === day,
      ariaLabel: dayFormatter.format(new Date(viewYear.value, viewMonth.value, day)),
    }
  })
})

const dayClasses = (day: DayCell): string => {
  if (day.selected) return 'bg-sky-500 text-white font-semibold shadow-sm'
  if (day.disabled) return 'text-slate-300 cursor-not-allowed'
  if (day.isToday)
    return 'text-sky-600 font-semibold ring-1 ring-inset ring-sky-200 hover:bg-sky-50'
  return 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
}

const hourLabelFormatter = computed(
  () => new Intl.DateTimeFormat(intlLocale.value, { hour: 'numeric' }),
)

const formatHourLabel = (hour: number): string =>
  hourLabelFormatter.value.format(new Date(2000, 0, 1, hour, 0))

const selectQuickTime = (hour: number) => patch({ h: hour, mi: 0 })

const shiftMonth = (delta: number) => {
  const next = new Date(viewYear.value, viewMonth.value + delta, 1)
  viewYear.value = next.getFullYear()
  viewMonth.value = next.getMonth()
}

const selectDay = (day: number) =>
  patch({ y: viewYear.value, mo: viewMonth.value, d: day })
</script>
