<template>
  <div>
    <!-- Trigger: styled like a standard form input -->
    <button
      ref="triggerRef"
      type="button"
      @click="openPicker"
      :aria-label="title || t('common.dateTimePicker.placeholder')"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      class="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm border rounded-lg bg-white text-left focus:outline-none focus:ring-2 transition-colors"
      :class="error
        ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
        : 'border-slate-300 focus:ring-sky-200 focus:border-sky-400'"
    >
      <Calendar class="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
      <span class="flex-1 min-w-0 truncate" :class="displayValue ? 'text-slate-900' : 'text-slate-400'">
        {{ displayValue || placeholder || t('common.dateTimePicker.placeholder') }}
      </span>
      <ChevronDown class="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
    </button>

    <Teleport to="body">
      <!-- Backdrop: dimmed sheet backdrop on mobile, transparent click-away on desktop -->
      <Transition name="dtp-fade">
        <div
          v-if="isOpen"
          class="fixed inset-0 z-[1000]"
          :class="isMobile ? 'bg-black/40 backdrop-blur-sm' : ''"
          @click="closePicker"
        />
      </Transition>

      <!-- Picker panel: bottom sheet (mobile) / anchored popover (desktop) -->
      <Transition :name="isMobile ? 'dtp-sheet' : 'dtp-pop'">
        <div
          v-if="isOpen"
          ref="panelRef"
          role="dialog"
          aria-modal="true"
          :aria-label="title || t('common.dateTimePicker.placeholder')"
          class="fixed z-[1001] bg-white"
          :class="isMobile
            ? 'inset-x-0 bottom-0 rounded-t-3xl shadow-2xl pb-[max(env(safe-area-inset-bottom),0.75rem)]'
            : 'w-[20rem] rounded-xl border border-slate-200 shadow-xl'"
          :style="isMobile ? undefined : panelStyle"
          @click.stop
        >
          <!-- Sheet chrome (mobile only) -->
          <div v-if="isMobile" class="pt-2.5 pb-1">
            <div class="w-10 h-1 rounded-full bg-slate-300 mx-auto" aria-hidden="true" />
          </div>
          <div v-if="isMobile && title" class="px-5 pt-1 pb-0.5">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ title }}</span>
          </div>

          <div class="px-4 pt-2 pb-3 sm:p-3" :class="{ 'max-h-[75vh] overflow-y-auto overscroll-contain': isMobile }">
            <!-- Month navigation -->
            <div class="flex items-center justify-between mb-1">
              <button
                type="button"
                @click="shiftMonth(-1)"
                :aria-label="t('common.dateTimePicker.previousMonth')"
                class="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft class="w-5 h-5" aria-hidden="true" />
              </button>
              <span class="text-base font-semibold text-slate-900">{{ monthLabel }}</span>
              <button
                type="button"
                @click="shiftMonth(1)"
                :aria-label="t('common.dateTimePicker.nextMonth')"
                class="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight class="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <!-- Weekday headers -->
            <div class="grid grid-cols-7 mb-1">
              <span
                v-for="day in weekdayLabels"
                :key="day"
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
                @click="selectDay(day.day)"
                :aria-label="day.ariaLabel"
                :aria-pressed="day.selected"
                class="h-10 w-10 sm:h-9 sm:w-9 mx-auto flex items-center justify-center text-sm rounded-full transition-colors active:scale-95 disabled:active:scale-100"
                :class="dayClasses(day)"
              >
                {{ day.day }}
              </button>
            </div>

            <!-- Time selection -->
            <div class="mt-3 pt-3 border-t border-slate-100 space-y-3">
              <span class="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Clock class="w-4 h-4 text-slate-400" aria-hidden="true" />
                {{ t('common.dateTimePicker.time') }}
              </span>

              <!-- Digital time display: custom hour/minute pickers (native <select> renders as an unstyled OS listbox) -->
              <div class="flex items-center justify-center gap-1.5 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <div class="relative" ref="hourWrapRef">
                  <button
                    type="button"
                    @click="toggleHour"
                    :aria-label="t('common.dateTimePicker.hour')"
                    aria-haspopup="listbox"
                    :aria-expanded="hourOpen"
                    class="w-14 py-1.5 text-center text-lg font-semibold text-slate-900 tabular-nums rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-200"
                    :class="hourOpen ? 'bg-white shadow-sm' : 'hover:bg-white'"
                  >
                    {{ pad(draftHour) }}
                  </button>
                  <Transition name="dropdown">
                    <div
                      v-if="hourOpen"
                      ref="hourListRef"
                      role="listbox"
                      :aria-label="t('common.dateTimePicker.hour')"
                      class="absolute z-10 top-full left-1/2 -translate-x-1/2 mt-1.5 w-16 max-h-44 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl py-1"
                    >
                      <button
                        v-for="h in 24"
                        :key="h - 1"
                        type="button"
                        role="option"
                        :aria-selected="draftHour === h - 1"
                        @click="selectHour(h - 1)"
                        class="w-full py-1.5 text-sm text-center tabular-nums transition-colors"
                        :class="draftHour === h - 1
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'"
                      >
                        {{ pad(h - 1) }}
                      </button>
                    </div>
                  </Transition>
                </div>
                <span class="text-lg font-semibold text-slate-300" aria-hidden="true">:</span>
                <div class="relative" ref="minuteWrapRef">
                  <button
                    type="button"
                    @click="toggleMinute"
                    :aria-label="t('common.dateTimePicker.minute')"
                    aria-haspopup="listbox"
                    :aria-expanded="minuteOpen"
                    class="w-14 py-1.5 text-center text-lg font-semibold text-slate-900 tabular-nums rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-200"
                    :class="minuteOpen ? 'bg-white shadow-sm' : 'hover:bg-white'"
                  >
                    {{ pad(draftMinute) }}
                  </button>
                  <Transition name="dropdown">
                    <div
                      v-if="minuteOpen"
                      ref="minuteListRef"
                      role="listbox"
                      :aria-label="t('common.dateTimePicker.minute')"
                      class="absolute z-10 top-full left-1/2 -translate-x-1/2 mt-1.5 w-16 max-h-44 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl py-1"
                    >
                      <button
                        v-for="m in minuteOptions"
                        :key="m"
                        type="button"
                        role="option"
                        :aria-selected="draftMinute === m"
                        @click="selectMinute(m)"
                        class="w-full py-1.5 text-sm text-center tabular-nums transition-colors"
                        :class="draftMinute === m
                          ? 'bg-slate-100 text-slate-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'"
                      >
                        {{ pad(m) }}
                      </button>
                    </div>
                  </Transition>
                </div>
              </div>

              <!-- Quick time presets -->
              <div v-if="quickTimes.length" class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="qt in quickTimes"
                  :key="qt"
                  type="button"
                  @click="selectQuickTime(qt)"
                  class="px-2 py-1.5 text-sm font-medium rounded-lg border text-center transition-colors active:scale-95"
                  :class="draftHour === qt && draftMinute === 0
                    ? 'bg-sky-50 border-sky-300 text-sky-700 font-semibold'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50'"
                >
                  {{ formatHourLabel(qt) }}
                </button>
              </div>
            </div>

            <!-- Footer actions -->
            <div class="flex items-center justify-between gap-2 mt-3">
              <button
                v-if="clearable && modelValue"
                type="button"
                @click="clearValue"
                class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
              >
                {{ t('common.dateTimePicker.clear') }}
              </button>
              <span v-else />
              <button
                type="button"
                @click="confirmValue"
                class="px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md"
              >
                {{ t('common.dateTimePicker.done') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Clock } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface Props {
  /** datetime-local formatted value: YYYY-MM-DDTHH:mm (or empty) */
  modelValue: string
  /** Field name used for the dialog/sheet heading */
  title?: string
  placeholder?: string
  /** Minimum selectable date (datetime-local format, date part enforced) */
  min?: string
  /** Maximum selectable date (datetime-local format, date part enforced) */
  max?: string
  /** Show a Clear action for optional fields */
  clearable?: boolean
  /** Render error styling on the trigger */
  error?: boolean
  /** Hour-of-day (0-23) quick-pick chips shown above the manual hour/minute selects */
  quickTimes?: number[]
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  quickTimes: () => [],
})
const emit = defineEmits<Emits>()

const { t, locale } = useAppLanguage()

const triggerRef = ref<HTMLButtonElement>()
const panelRef = ref<HTMLElement>()
const isOpen = ref(false)
const isMobile = ref(false)
const panelStyle = ref<Record<string, string>>({})

// Draft selection — committed only on Done
const draftYear = ref(0)
const draftMonth = ref(0) // 0-based
const draftDay = ref(1)
const draftHour = ref(9)
const draftMinute = ref(0)
const viewYear = ref(0)
const viewMonth = ref(0)

// Custom hour/minute popovers (native <select> renders as an unstyled OS listbox)
const hourOpen = ref(false)
const minuteOpen = ref(false)
const hourWrapRef = ref<HTMLElement>()
const minuteWrapRef = ref<HTMLElement>()
const hourListRef = ref<HTMLElement>()
const minuteListRef = ref<HTMLElement>()

onClickOutside(hourWrapRef, () => {
  hourOpen.value = false
})
onClickOutside(minuteWrapRef, () => {
  minuteOpen.value = false
})

const intlLocale = computed(() => (locale.value === 'kh' ? 'km-KH' : 'en-US'))

const hourLabelFormatter = computed(
  () => new Intl.DateTimeFormat(intlLocale.value, { hour: 'numeric' }),
)

const formatHourLabel = (hour: number): string =>
  hourLabelFormatter.value.format(new Date(2000, 0, 1, hour, 0))

const selectQuickTime = (hour: number) => {
  draftHour.value = hour
  draftMinute.value = 0
  hourOpen.value = false
  minuteOpen.value = false
}

const toggleHour = async () => {
  minuteOpen.value = false
  hourOpen.value = !hourOpen.value
  if (hourOpen.value) {
    await nextTick()
    const el = hourListRef.value?.children[draftHour.value] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'center' })
  }
}

const toggleMinute = async () => {
  hourOpen.value = false
  minuteOpen.value = !minuteOpen.value
  if (minuteOpen.value) {
    await nextTick()
    const idx = minuteOptions.value.indexOf(draftMinute.value)
    const el = minuteListRef.value?.children[idx] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'center' })
  }
}

const selectHour = (hour: number) => {
  draftHour.value = hour
  hourOpen.value = false
}

const selectMinute = (minute: number) => {
  draftMinute.value = minute
  minuteOpen.value = false
}

const pad = (n: number) => String(n).padStart(2, '0')

interface ParsedValue {
  y: number
  mo: number // 0-based
  d: number
  h: number
  mi: number
}

const parseValue = (value: string | undefined): ParsedValue | null => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return null
  return {
    y: Number(match[1]),
    mo: Number(match[2]) - 1,
    d: Number(match[3]),
    h: Number(match[4]),
    mi: Number(match[5]),
  }
}

const displayValue = computed(() => {
  const parsed = parseValue(props.modelValue)
  if (!parsed) return ''
  const date = new Date(parsed.y, parsed.mo, parsed.d, parsed.h, parsed.mi)
  return new Intl.DateTimeFormat(intlLocale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
})

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

// Date-only bounds so min/max disable whole days
const dateOnly = (p: ParsedValue | null): number | null =>
  p ? new Date(p.y, p.mo, p.d).getTime() : null

const minTime = computed(() => dateOnly(parseValue(props.min)))
const maxTime = computed(() => dateOnly(parseValue(props.max)))

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
        draftYear.value === viewYear.value &&
        draftMonth.value === viewMonth.value &&
        draftDay.value === day,
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

// 5-minute steps, plus the current draft minute if it falls off-grid
const minuteOptions = computed(() => {
  const options = Array.from({ length: 12 }, (_, i) => i * 5)
  if (!options.includes(draftMinute.value)) {
    options.push(draftMinute.value)
    options.sort((a, b) => a - b)
  }
  return options
})

const initDraft = () => {
  let parsed = parseValue(props.modelValue)
  if (!parsed) {
    const now = new Date()
    parsed = {
      y: now.getFullYear(),
      mo: now.getMonth(),
      d: now.getDate(),
      h: now.getHours(),
      mi: Math.ceil(now.getMinutes() / 5) * 5 % 60,
    }
    // Keep the default inside the allowed range
    const time = dateOnly(parsed)!
    const minParsed = parseValue(props.min)
    const maxParsed = parseValue(props.max)
    if (maxParsed && maxTime.value !== null && time > maxTime.value) {
      parsed = { ...maxParsed, h: parsed.h, mi: parsed.mi }
    } else if (minParsed && minTime.value !== null && time < minTime.value) {
      parsed = { ...minParsed, h: parsed.h, mi: parsed.mi }
    }
  }
  draftYear.value = parsed.y
  draftMonth.value = parsed.mo
  draftDay.value = parsed.d
  draftHour.value = parsed.h
  draftMinute.value = parsed.mi
  viewYear.value = parsed.y
  viewMonth.value = parsed.mo
}

const shiftMonth = (delta: number) => {
  const next = new Date(viewYear.value, viewMonth.value + delta, 1)
  viewYear.value = next.getFullYear()
  viewMonth.value = next.getMonth()
}

const selectDay = (day: number) => {
  draftYear.value = viewYear.value
  draftMonth.value = viewMonth.value
  draftDay.value = day
}

const confirmValue = () => {
  emit(
    'update:modelValue',
    `${draftYear.value}-${pad(draftMonth.value + 1)}-${pad(draftDay.value)}T${pad(draftHour.value)}:${pad(draftMinute.value)}`,
  )
  closePicker()
}

const clearValue = () => {
  emit('update:modelValue', '')
  closePicker()
}

// Capture-phase Escape so a parent drawer's own Escape handler doesn't also fire
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    e.stopPropagation()
    closePicker()
  }
}

const positionPanel = async () => {
  await nextTick()
  const trigger = triggerRef.value
  const panel = panelRef.value
  if (!trigger || !panel) return
  const rect = trigger.getBoundingClientRect()
  const panelWidth = panel.offsetWidth
  const panelHeight = panel.offsetHeight
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - panelWidth - 8))
  let top = rect.bottom + 8
  let flipped = false
  if (top + panelHeight > window.innerHeight - 8) {
    top = Math.max(8, rect.top - panelHeight - 8)
    flipped = true
  }
  // Scale from the edge nearest the trigger, so the panel reads as growing
  // out of the control that opened it rather than out of its own middle.
  panelStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    transformOrigin: flipped ? 'bottom left' : 'top left',
  }
}

const openPicker = () => {
  isMobile.value = window.matchMedia('(max-width: 639px)').matches
  initDraft()
  isOpen.value = true
  document.addEventListener('keydown', handleKeydown, true)
  if (!isMobile.value) positionPanel()
}

const closePicker = () => {
  isOpen.value = false
  hourOpen.value = false
  minuteOpen.value = false
  document.removeEventListener('keydown', handleKeydown, true)
}

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown, true)
})
</script>

<style scoped>
.dtp-fade-enter-active,
.dtp-fade-leave-active {
  transition: opacity 0.25s ease-out;
}

.dtp-fade-enter-from,
.dtp-fade-leave-to {
  opacity: 0;
}

/* Mobile bottom sheet */
.dtp-sheet-enter-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

.dtp-sheet-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}

.dtp-sheet-enter-from,
.dtp-sheet-leave-to {
  transform: translateY(100%);
}

/* Hour/minute lists */
.dropdown-enter-active {
  transition: opacity 0.15s ease-out, transform 0.15s cubic-bezier(0.23, 1, 0.32, 1);
}

.dropdown-leave-active {
  transition: opacity 0.12s ease-out, transform 0.12s ease-out;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translate(-50%, -4px) scale(0.96);
}

/* Desktop popover */
.dtp-pop-enter-active {
  transition:
    opacity 0.18s ease-out,
    transform 0.18s cubic-bezier(0.23, 1, 0.32, 1);
}

.dtp-pop-leave-active {
  transition:
    opacity 0.13s ease-out,
    transform 0.13s ease-out;
}

.dtp-pop-enter-from,
.dtp-pop-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .dtp-sheet-enter-active,
  .dtp-sheet-leave-active,
  .dtp-pop-enter-active,
  .dtp-pop-leave-active,
  .dropdown-enter-active,
  .dropdown-leave-active,
  .dtp-fade-enter-active,
  .dtp-fade-leave-active {
    transition-duration: 0.01s;
  }
}
</style>
