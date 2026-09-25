import { computed, onMounted, onUnmounted, ref, type ComputedRef } from 'vue'
import { countdownParts, msToNextMinute, type CountdownParts } from './countdownRsvp'

/**
 * The count until `target`, re-read on every whole minute.
 *
 * The card's old count ticked every 60s from whenever the page mounted, so its
 * figure could be up to a minute behind the clock on the guest's own phone —
 * invisible while it only showed days and hours, wrong the moment it shows
 * minutes. This lands each tick on the minute itself.
 *
 * A background tab's timers are throttled, so coming back to the page re-reads
 * the time at once rather than showing a stale count until the next tick.
 */
export function useCountdownClock(
  target: () => string | null | undefined,
): ComputedRef<CountdownParts> {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setTimeout> | null = null

  const tick = () => {
    now.value = Date.now()
    schedule()
  }

  const schedule = () => {
    if (timer) clearTimeout(timer)
    // A few ms past the boundary, so the re-read is never a hair early and
    // floors back to the minute that is just ending.
    timer = setTimeout(tick, msToNextMinute(Date.now()) + 25)
  }

  const onVisibility = () => {
    if (document.visibilityState === 'visible') tick()
  }

  onMounted(() => {
    tick()
    document.addEventListener('visibilitychange', onVisibility)
  })

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
    timer = null
    document.removeEventListener('visibilitychange', onVisibility)
  })

  return computed(() => countdownParts(Date.parse(target() ?? ''), now.value))
}
