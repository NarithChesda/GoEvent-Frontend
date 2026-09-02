// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * The registry is a module-level singleton, so every case re-imports it fresh.
 */
type Registry = typeof import('./useScrollProgress')

let rafQueue: FrameRequestCallback[] = []

const flushFrames = () => {
  for (let i = 0; i < 5; i++) {
    const queued = rafQueue
    rafQueue = []
    queued.forEach((cb) => cb(0))
  }
}

/**
 * jsdom has no layout: every rect is zero. Stub the ones the registry reads,
 * and mirror the one browser behaviour this bug turns on — a node removed from
 * the document measures as a zero rect.
 */
const stubRect = (el: HTMLElement, top: number, height: number) => {
  Object.defineProperty(el, 'getBoundingClientRect', {
    configurable: true,
    value: () =>
      el.isConnected
        ? ({
            top,
            bottom: top + height,
            height,
            left: 0,
            right: 320,
            width: 320,
            x: 0,
            y: top,
            toJSON: () => ({}),
          } as DOMRect)
        : ({
            top: 0,
            bottom: 0,
            height: 0,
            left: 0,
            right: 0,
            width: 0,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          } as DOMRect),
  })
}

/** One MainContentStage: the glass card, its `.stage-scroll` scroller, one card inside. */
const mountStage = (itemTop: number) => {
  const card = document.createElement('div')
  card.className = 'liquid-glass-card'
  const scroller = document.createElement('div')
  scroller.className = 'stage-scroll custom-scrollbar'
  const item = document.createElement('div')
  scroller.appendChild(item)
  card.appendChild(scroller)
  document.body.appendChild(card)

  stubRect(scroller, 0, 700)
  stubRect(item, itemTop, 200)
  return { card, scroller, item }
}

const progressOf = (el: HTMLElement) =>
  Number(el.style.getPropertyValue('--scroll-progress') || '0')

let registry: Registry

beforeEach(async () => {
  document.body.innerHTML = ''
  rafQueue = []
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafQueue.push(cb)
    return rafQueue.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.resetModules()
  registry = await import('./useScrollProgress')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('registerScrollProgress', () => {
  it('drives --scroll-progress from the glass card scroller', () => {
    const stage = mountStage(100)
    registry.registerScrollProgress(stage.item)
    flushFrames()

    stage.scroller.dispatchEvent(new Event('scroll'))
    flushFrames()

    expect(progressOf(stage.item)).toBeGreaterThan(0)
  })

  /**
   * The preview remounts the whole showcase subtree whenever a template is
   * staged into an already-mounted frame (CoverStage is keyed on its video
   * URLs), so a second stage registers its elements BEFORE the first stage's
   * disposers run — Vue sets template refs at post-flush id -1, ahead of the
   * outgoing tree's onUnmounted hooks. The registry must not stay latched to
   * the scroller that just left the document.
   */
  it('re-resolves the scroller when the showcase subtree is replaced', () => {
    const first = mountStage(100)
    const disposeFirst = registry.registerScrollProgress(first.item)
    flushFrames()

    // --- the remount: old subtree removed, new one mounted and registered
    //     while the old element is still in the registry ---
    first.card.remove()
    const second = mountStage(100)
    registry.registerScrollProgress(second.item)
    disposeFirst()
    flushFrames()

    second.scroller.dispatchEvent(new Event('scroll'))
    flushFrames()

    expect(progressOf(second.item)).toBeGreaterThan(0)
  })
})
