// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useActionConfirmation } from './useActionConfirmation'

/**
 * `onUnmounted` needs an owning component, so each case runs inside a throwaway
 * one and reads the composable back off its instance.
 */
const withComponent = (holdMs?: number) => {
  const wrapper = mount(
    defineComponent({
      setup: () => useActionConfirmation(holdMs),
      render: () => null,
    }),
  )
  return { wrapper, api: wrapper.vm as unknown as ReturnType<typeof useActionConfirmation> }
}

describe('useActionConfirmation', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('holds the confirmed state for the configured window', () => {
    const { api } = withComponent(1500)

    api.confirm()
    expect(api.confirmed).toBe(true)

    vi.advanceTimersByTime(1499)
    expect(api.confirmed).toBe(true)

    vi.advanceTimersByTime(1)
    expect(api.confirmed).toBe(false)
  })

  it('runs the follow-up only once the hold is over', () => {
    const closeDrawer = vi.fn()
    const { api } = withComponent(1500)

    api.confirm(closeDrawer)
    vi.advanceTimersByTime(1400)
    // The drawer must stay up long enough to be read.
    expect(closeDrawer).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(closeDrawer).toHaveBeenCalledTimes(1)
  })

  it('restarts rather than queueing when re-confirmed mid-hold', () => {
    const followUp = vi.fn()
    const { api } = withComponent(1500)

    api.confirm(followUp)
    vi.advanceTimersByTime(1000)
    api.confirm(followUp)

    vi.advanceTimersByTime(1000)
    expect(followUp).not.toHaveBeenCalled()

    // A hammered control fires the follow-up once, not once per press.
    vi.advanceTimersByTime(500)
    expect(followUp).toHaveBeenCalledTimes(1)
  })

  it('accepts a per-call hold, for a caller with two timings', () => {
    const { api } = withComponent(1500)

    api.confirm(undefined, 400)
    vi.advanceTimersByTime(400)
    expect(api.confirmed).toBe(false)
  })

  it('drops the state without running the follow-up when reset', () => {
    const followUp = vi.fn()
    const { api } = withComponent(1500)

    api.confirm(followUp)
    api.reset()

    expect(api.confirmed).toBe(false)
    vi.advanceTimersByTime(5000)
    expect(followUp).not.toHaveBeenCalled()
  })

  it('does not run the follow-up after the owner unmounts', () => {
    const followUp = vi.fn()
    const { wrapper, api } = withComponent(1500)

    api.confirm(followUp)
    wrapper.unmount()

    vi.advanceTimersByTime(5000)
    expect(followUp).not.toHaveBeenCalled()
  })
})
