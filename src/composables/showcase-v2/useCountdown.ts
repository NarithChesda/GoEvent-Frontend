import { computed, onUnmounted, ref, watch, type MaybeRefOrGetter, toValue } from 'vue'

export interface CountdownState {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/**
 * Reactive countdown to a target date (event start).
 *
 * Ticks once per second; the interval is cleared automatically on unmount and
 * whenever the countdown reaches zero. All values clamp to 0 once past.
 */
export function useCountdown(target: MaybeRefOrGetter<string | Date | null | undefined>) {
  const now = ref(Date.now())
  let interval: ReturnType<typeof setInterval> | null = null

  const targetMs = computed(() => {
    const value = toValue(target)
    if (!value) return null
    const ms = new Date(value).getTime()
    return Number.isNaN(ms) ? null : ms
  })

  const remainingMs = computed(() => {
    if (targetMs.value === null) return 0
    return Math.max(0, targetMs.value - now.value)
  })

  const countdown = computed<CountdownState>(() => {
    const total = Math.floor(remainingMs.value / 1000)
    return {
      days: Math.floor(total / 86400),
      hours: Math.floor((total % 86400) / 3600),
      minutes: Math.floor((total % 3600) / 60),
      seconds: total % 60,
    }
  })

  const isPast = computed(() => targetMs.value !== null && remainingMs.value === 0)
  const isActive = computed(() => targetMs.value !== null && remainingMs.value > 0)

  const stop = () => {
    if (interval) {
      clearInterval(interval)
      interval = null
    }
  }

  const start = () => {
    stop()
    if (targetMs.value === null) return
    now.value = Date.now()
    if (targetMs.value <= now.value) return
    interval = setInterval(() => {
      now.value = Date.now()
      if (targetMs.value !== null && targetMs.value <= now.value) stop()
    }, 1000)
  }

  watch(targetMs, start, { immediate: true })
  onUnmounted(stop)

  return {
    days: computed(() => countdown.value.days),
    hours: computed(() => countdown.value.hours),
    minutes: computed(() => countdown.value.minutes),
    seconds: computed(() => countdown.value.seconds),
    isPast,
    isActive,
  }
}
