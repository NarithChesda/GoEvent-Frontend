// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useCoverStageVideo } from './useCoverStageVideo'

/**
 * The background video is the one showcase video this composable points at
 * itself — the cover video is bound straight in VideoContainer's markup, and
 * the difference is exactly why this regressed unnoticed: the template studio
 * previews a not-yet-uploaded file as a `blob:` object URL, the markup renders
 * it fine, and the hand-rolled `startsWith('http')` resolution here turned it
 * into `http://api-host/media/blob:http://host/uuid`. That 404s, so the element
 * never reached readyState, never played, and never had its opacity raised —
 * a standard template's main content sat on the bare primary colour.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const mountWithBackgroundVideo = (backgroundVideoUrl: string) => {
  const bgVideo = document.createElement('video')
  // jsdom implements neither, and both are called synchronously below.
  bgVideo.load = vi.fn()
  bgVideo.play = vi.fn().mockResolvedValue(undefined)
  document.body.appendChild(bgVideo)

  const wrapper = mount(
    defineComponent({
      setup() {
        useCoverStageVideo(
          {
            eventVideoPreloader: () => null,
            sequentialVideoContainer: () => null,
            coverVideoElement: () => null,
            backgroundVideoElement: () => bgVideo,
          },
          // The Main Content preview frame's exact props: forced straight to
          // the last stage, so the stage watcher plays the background video on
          // setup rather than waiting for an envelope to be opened.
          { backgroundVideoUrl, currentShowcaseStage: 'main_content' },
          vi.fn(),
        )
        return () => null
      },
    }),
  )

  return { bgVideo, wrapper }
}

describe('background video URL resolution', () => {
  beforeEach(() => {
    // jsdom ships no matchMedia, and the resource manager probes it on setup.
    window.matchMedia = vi
      .fn()
      .mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia
    // The loader schedules a re-load probe and a stuck-playback interval.
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('points the element at an object URL verbatim', () => {
    const objectUrl = `blob:${window.location.origin}/6f1c0f6e-0000-4000-8000-000000000000`
    const { bgVideo, wrapper } = mountWithBackgroundVideo(objectUrl)

    expect(bgVideo.src).toBe(objectUrl)
    wrapper.unmount()
  })

  it('still resolves a relative media path against the API base', () => {
    const { bgVideo, wrapper } = mountWithBackgroundVideo('/media/templates/bg.mp4')

    expect(bgVideo.src).toBe(`${API_BASE}/media/templates/bg.mp4`)
    wrapper.unmount()
  })

  it('leaves an already-absolute URL alone', () => {
    const { bgVideo, wrapper } = mountWithBackgroundVideo('https://api.goevent.online/media/bg.mp4')

    expect(bgVideo.src).toBe('https://api.goevent.online/media/bg.mp4')
    wrapper.unmount()
  })
})

/**
 * How the background video behaves while its bytes are slow to arrive.
 *
 * `HTMLMediaElement.load()` runs the media load algorithm, which ABORTS the
 * in-flight fetch and resets readyState to 0 — so every reload throws away
 * everything downloaded so far. This file used to reload from three separate
 * places, one of which (`suspend`, fired routinely while buffering a large file
 * on a constrained link, and again by `load()` itself) re-armed itself. On a
 * fast connection playback began before the first timer and none of it showed;
 * on a slow one the download restarted every few seconds and could never
 * finish, leaving the invitation over a bare background forever — a
 * `background: 'video'` template draws none of VideoContainer's artwork ladder,
 * so there is nothing else back there.
 *
 * These pin the rule that came out of that: exactly ONE reload, only after a
 * long wait, and only when nothing has arrived at all.
 */
describe('background video slow-network behaviour', () => {
  beforeEach(() => {
    window.matchMedia = vi
      .fn()
      .mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  /** Reloads only — the initial `load()` that sets the source is not one. */
  const reloadCount = (bgVideo: HTMLVideoElement) =>
    (bgVideo.load as unknown as { mock: { calls: unknown[] } }).mock.calls.length - 1

  it('does not re-fetch when the browser suspends a buffering download', () => {
    const { bgVideo, wrapper } = mountWithBackgroundVideo('/media/templates/bg.mp4')

    // The loop: each suspend armed a reload 3s later, and each reload
    // eventually produced another suspend. Kept inside the stall watchdog's own
    // window, so this measures the suspend handler and nothing else.
    for (let i = 0; i < 5; i++) {
      bgVideo.dispatchEvent(new Event('suspend'))
      vi.advanceTimersByTime(3500)
    }

    expect(reloadCount(bgVideo)).toBe(0)
    wrapper.unmount()
  })

  it('leaves a slowly-buffering download alone rather than restarting it', () => {
    const { bgVideo, wrapper } = mountWithBackgroundVideo('/media/templates/bg.mp4')

    // Bytes ARE arriving, just slowly — the case a reload hurts most.
    Object.defineProperty(bgVideo, 'buffered', {
      configurable: true,
      get: () => ({ length: 1 }) as unknown as TimeRanges,
    })
    bgVideo.dispatchEvent(new Event('progress'))

    vi.advanceTimersByTime(60000)

    expect(reloadCount(bgVideo)).toBe(0)
    wrapper.unmount()
  })

  it('reloads once, and only once, when nothing arrives at all', () => {
    const { bgVideo, wrapper } = mountWithBackgroundVideo('/media/templates/bg.mp4')

    // readyState 0 and no buffered range for the whole watchdog window.
    vi.advanceTimersByTime(21000)
    expect(reloadCount(bgVideo)).toBe(1)

    // Still nothing: the recovery is spent, so the download is left to finish
    // rather than being restarted forever.
    vi.advanceTimersByTime(120000)
    expect(reloadCount(bgVideo)).toBe(1)

    wrapper.unmount()
  })
})
