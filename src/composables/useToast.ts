import { computed, ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  /** Main line. Keep it short — this is the part people actually read. */
  title: string
  /** Optional supporting line (details, field errors, undo hints). */
  description?: string
  /** Auto-dismiss delay in ms. `0` keeps the toast until dismissed. */
  duration: number
  dismissible: boolean
  /** Bumped instead of pushing a duplicate toast, rendered as a "×N" chip. */
  count: number
}

export interface ToastOptions {
  description?: string
  duration?: number
  dismissible?: boolean
}

/** How long each type stays up. Failures get longer — they need to be read. */
const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 6000,
}

/**
 * Older toasts are evicted past this, so the stack never grows without bound.
 *
 * A phone shows **one**. Two 44px bars over a list that is already only ~380px
 * wide read as a takeover, not a confirmation — and the pair that actually
 * happens (add a guest, then copy their link) arrives seconds apart, so the
 * second one is the only one still worth reading. Desktop has the room for a
 * short stack, and its toasts sit in the corner rather than over the content.
 */
const MAX_VISIBLE_DESKTOP = 3
const DESKTOP_QUERY = '(min-width: 1024px)'

const maxVisibleToasts = (): number => {
  if (typeof window === 'undefined') return MAX_VISIBLE_DESKTOP
  const isDesktop =
    typeof window.matchMedia === 'function'
      ? window.matchMedia(DESKTOP_QUERY).matches
      : window.innerWidth >= 1024
  return isDesktop ? MAX_VISIBLE_DESKTOP : 1
}

// ---------------------------------------------------------------------------
// Module-level state: one queue for the whole app, rendered once by ToastHost.
// ---------------------------------------------------------------------------

const toasts = ref<Toast[]>([])
const isPaused = ref(false)

type TimerHandle = ReturnType<typeof setTimeout>

interface TimerEntry {
  /** `null` while paused — the timer isn't running, only `remaining` is meaningful. */
  handle: TimerHandle | null
  startedAt: number
  remaining: number
}

const timers = new Map<string, TimerEntry>()

let idCounter = 0
const nextId = (): string => `toast-${Date.now().toString(36)}-${(idCounter += 1)}`

const clearTimer = (id: string): TimerEntry | undefined => {
  const timer = timers.get(id)
  if (timer) {
    if (timer.handle !== null) clearTimeout(timer.handle)
    timers.delete(id)
  }
  return timer
}

const dismissToast = (id: string): void => {
  clearTimer(id)
  const index = toasts.value.findIndex((toast) => toast.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

const startTimer = (id: string, duration: number): void => {
  clearTimer(id)
  if (duration <= 0) return

  // While paused (pointer over the stack, or the tab is in the background) we
  // record the remaining time but don't run a timer — resumeToasts starts it.
  if (isPaused.value) {
    timers.set(id, { handle: null, startedAt: 0, remaining: duration })
    return
  }

  timers.set(id, {
    handle: setTimeout(() => dismissToast(id), duration),
    startedAt: Date.now(),
    remaining: duration,
  })
}

const pauseToasts = (): void => {
  if (isPaused.value) return
  isPaused.value = true

  timers.forEach((timer, id) => {
    if (timer.handle === null) return
    clearTimeout(timer.handle)
    const elapsed = Date.now() - timer.startedAt
    // Never resume with less than a beat left, so unhovering doesn't blink the
    // toast out of existence before the pointer has left it.
    timers.set(id, {
      handle: null,
      startedAt: 0,
      remaining: Math.max(timer.remaining - elapsed, 400),
    })
  })
}

const resumeToasts = (): void => {
  if (!isPaused.value) return
  isPaused.value = false

  timers.forEach((timer, id) => {
    timers.set(id, {
      handle: setTimeout(() => dismissToast(id), timer.remaining),
      startedAt: Date.now(),
      remaining: timer.remaining,
    })
  })
}

const clearToasts = (): void => {
  timers.forEach((_, id) => clearTimer(id))
  toasts.value = []
}

/**
 * Queue a toast. Re-raising a toast that's already on screen (same type + text)
 * refreshes its timer and bumps its counter rather than stacking a duplicate —
 * a save button hammered three times shows one toast, not three.
 */
const pushToast = (
  type: ToastType,
  title: string,
  options: ToastOptions = {},
): string => {
  const description = options.description
  const duration = options.duration ?? DEFAULT_DURATION[type]

  const existing = toasts.value.find(
    (toast) => toast.type === type && toast.title === title && toast.description === description,
  )
  if (existing) {
    existing.count += 1
    startTimer(existing.id, duration)
    return existing.id
  }

  const toast: Toast = {
    id: nextId(),
    type,
    title,
    description,
    duration,
    dismissible: options.dismissible ?? true,
    count: 1,
  }

  toasts.value.push(toast)
  while (toasts.value.length > maxVisibleToasts()) {
    dismissToast(toasts.value[0].id)
  }

  startTimer(toast.id, duration)
  return toast.id
}

// A backgrounded tab freezes rAF/CSS animations but not setTimeout, so without
// this a toast fired right before switching away would be gone on return.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseToasts()
    } else {
      resumeToasts()
    }
  })
}

/**
 * App-wide toast notifications.
 *
 * State lives at module level and is rendered by the single `ToastHost` mounted
 * in `App.vue` — never render toast markup inside a feature component, or the
 * toasts from different components will overlap each other (and the FABs).
 */
export function useToast() {
  const showToast = (type: ToastType, title: string, options?: ToastOptions | number): string =>
    pushToast(type, title, typeof options === 'number' ? { duration: options } : options)

  const showSuccess = (title: string, options?: ToastOptions | number): string =>
    showToast('success', title, options)

  const showError = (title: string, options?: ToastOptions | number): string =>
    showToast('error', title, options)

  const showWarning = (title: string, options?: ToastOptions | number): string =>
    showToast('warning', title, options)

  const showInfo = (title: string, options?: ToastOptions | number): string =>
    showToast('info', title, options)

  /** Dismiss the most recent toast (kept for the older `hideToast()` call sites). */
  const hideToast = (): void => {
    const last = toasts.value[toasts.value.length - 1]
    if (last) dismissToast(last.id)
  }

  return {
    toasts: computed(() => toasts.value),
    isPaused: computed(() => isPaused.value),
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
    hideToast,
    clearToasts,
    pauseToasts,
    resumeToasts,
  }
}
