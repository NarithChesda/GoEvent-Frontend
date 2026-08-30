/**
 * useActionConfirmation.ts
 *
 * Hold a "done" state on the control the user just pressed, then run whatever
 * comes next (closing a drawer, refocusing an input, nothing at all).
 *
 * This is the in-place half of the app's feedback rule: a control that can
 * answer for itself should, and only what happens *away* from that control goes
 * to a toast. A copy button flipping to a tick, a checkout button flipping to
 * "Activated" before the drawer closes — same shape, one implementation, so the
 * hold reads the same length everywhere.
 *
 * Failures deliberately have no equivalent here. A control that returns to idle
 * cannot say *why*, and the reason usually outlives the control (a closing
 * drawer takes its own error text with it) — so errors still go to `useToast`
 * or an inline banner with room to explain.
 *
 * @module composables/useActionConfirmation
 */

import { onUnmounted, ref } from 'vue'

/** Long enough to read a word and register the colour, short enough not to gate the next action. */
const DEFAULT_HOLD_MS = 1500

export function useActionConfirmation(holdMs: number = DEFAULT_HOLD_MS) {
  const confirmed = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  const clear = (): void => {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  /**
   * Flash the confirmed state, then run `andThen`.
   *
   * Re-confirming while a hold is already running restarts it rather than
   * queueing a second one, so hammering the control can't fire `andThen` twice.
   */
  const confirm = (andThen?: () => void, hold: number = holdMs): void => {
    clear()
    confirmed.value = true
    timer = setTimeout(() => {
      confirmed.value = false
      timer = undefined
      andThen?.()
    }, hold)
  }

  /** Drop the confirmed state now, without running the follow-up. */
  const reset = (): void => {
    clear()
    confirmed.value = false
  }

  onUnmounted(clear)

  return { confirmed, confirm, reset }
}
