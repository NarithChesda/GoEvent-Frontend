// @vitest-environment jsdom
// The stack cap is viewport-dependent (one bar on a phone, three on a desktop),
// so these need a window to measure.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useToast().clearToasts()
  })

  afterEach(() => {
    useToast().clearToasts()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('shares one queue across every call site', () => {
    useToast().showSuccess('Saved')
    // A different component reaching for the composable sees the same stack —
    // this is what stops each feature rendering its own overlapping toast.
    expect(useToast().toasts.value).toHaveLength(1)
  })

  it('auto-dismisses after the type default', () => {
    const { showSuccess, toasts } = useToast()
    showSuccess('Saved')
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(3999)
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('gives errors longer on screen than successes', () => {
    const { showError, toasts } = useToast()
    showError('Upload failed')

    vi.advanceTimersByTime(4000)
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(2000)
    expect(toasts.value).toHaveLength(0)
  })

  it('counts a repeated message instead of stacking duplicates', () => {
    const { showSuccess, toasts } = useToast()
    showSuccess('Saved')
    showSuccess('Saved')
    showSuccess('Saved')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].count).toBe(3)
  })

  it('restarts the timer when a message repeats', () => {
    const { showSuccess, toasts } = useToast()
    showSuccess('Saved')

    vi.advanceTimersByTime(3000)
    showSuccess('Saved')

    // Would have expired at 4000ms without the restart.
    vi.advanceTimersByTime(2000)
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(2000)
    expect(toasts.value).toHaveLength(0)
  })

  it('caps the stack at three on a desktop, evicting the oldest', () => {
    // jsdom has no matchMedia; the composable falls back to innerWidth, which
    // defaults to 1024 — desktop.
    const { showInfo, toasts } = useToast()
    showInfo('One')
    showInfo('Two')
    showInfo('Three')
    showInfo('Four')

    expect(toasts.value.map((toast) => toast.title)).toEqual(['Two', 'Three', 'Four'])
  })

  it('shows one at a time on a phone', () => {
    // Two bars over a ~380px list read as a takeover, so the newest wins.
    vi.stubGlobal('matchMedia', (media: string) => ({ matches: false, media }))

    const { showInfo, toasts } = useToast()
    showInfo('Guest added')
    showInfo('Link copied')

    expect(toasts.value.map((toast) => toast.title)).toEqual(['Link copied'])
  })

  it('holds a toast open while paused and resumes with the time it had left', () => {
    const { showSuccess, pauseToasts, resumeToasts, toasts } = useToast()
    showSuccess('Saved')

    vi.advanceTimersByTime(1000)
    pauseToasts()

    vi.advanceTimersByTime(60_000)
    expect(toasts.value).toHaveLength(1)

    resumeToasts()
    vi.advanceTimersByTime(2999)
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('keeps a zero-duration toast until it is dismissed', () => {
    const { showError, dismissToast, toasts } = useToast()
    const id = showError('Needs attention', { duration: 0 })

    vi.advanceTimersByTime(60_000)
    expect(toasts.value).toHaveLength(1)

    dismissToast(id)
    expect(toasts.value).toHaveLength(0)
  })

  it('accepts a bare duration as the second argument', () => {
    const { showSuccess, toasts } = useToast()
    showSuccess('Saved', 1000)

    vi.advanceTimersByTime(1000)
    expect(toasts.value).toHaveLength(0)
  })
})
