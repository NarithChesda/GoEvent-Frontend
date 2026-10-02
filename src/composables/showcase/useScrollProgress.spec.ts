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

describe('createShowcaseRevealObserver', () => {
  /** Captures what each observer was built with, and lets a case report to it. */
  class FakeObserver {
    static made: FakeObserver[] = []
    constructor(
      public callback: IntersectionObserverCallback,
      public init: IntersectionObserverInit,
    ) {
      FakeObserver.made.push(this)
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
    report(entries: Array<{ target: Element; top: number; isIntersecting: boolean }>) {
      this.callback(
        entries.map(
          ({ target, top, isIntersecting }) =>
            ({
              target,
              isIntersecting,
              boundingClientRect: { top, bottom: top + 120 } as DOMRect,
              intersectionRatio: isIntersecting ? 0.5 : 0,
              intersectionRect: {} as DOMRect,
              rootBounds: null,
              time: 0,
            }) as IntersectionObserverEntry,
        ),
        this as unknown as IntersectionObserver,
      )
    }
  }

  /** The browser's answers to "scroll timelines?" and "reduced motion?". */
  const browser = ({ timelines, reducedMotion }: { timelines: boolean; reducedMotion: boolean }) => {
    vi.stubGlobal('CSS', { supports: (query: string) => timelines && query.includes('animation-timeline') })
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: reducedMotion && query.includes('reduce') }))
  }

  beforeEach(() => {
    FakeObserver.made = []
    vi.stubGlobal('IntersectionObserver', FakeObserver)
  })

  const revealed = (callback: ReturnType<typeof vi.fn>) =>
    (callback.mock.calls.at(-1)?.[0] as IntersectionObserverEntry[]).map((e) => e.isIntersecting)

  it('is a plain observer on the 60px line without scroll timelines', () => {
    browser({ timelines: false, reducedMotion: false })
    const { item } = mountStage(500)
    const callback = vi.fn()
    registry.createShowcaseRevealObserver(callback)
    const observer = FakeObserver.made[0]

    expect(observer.init.rootMargin).toBe('0px 0px -60px 0px')
    expect(observer.init.threshold).toBe(0)
    observer.report([{ target: item, top: 500, isIntersecting: false }])
    expect(revealed(callback)).toEqual([false])
  })

  it('keeps the 60px line under reduced motion', () => {
    browser({ timelines: true, reducedMotion: true })
    mountStage(500)
    registry.createShowcaseRevealObserver(vi.fn())

    expect(registry.storyScrollActive()).toBe(false)
    expect(FakeObserver.made[0].init.rootMargin).toBe('0px 0px -60px 0px')
  })

  it('reports at the reading line under the scroll story', () => {
    browser({ timelines: true, reducedMotion: false })
    const { scroller } = mountStage(500)
    registry.createShowcaseRevealObserver(vi.fn())

    expect(registry.storyScrollActive()).toBe(true)
    expect(FakeObserver.made[0].init.rootMargin).toBe(
      `0px 0px -${registry.STORY_READING_LINE} 0px`,
    )
    expect(FakeObserver.made[0].init.root).toBe(scroller)
  })

  /**
   * The reading line is for content the guest scrolls to. What is already on
   * screen when it is first observed (the scroller is 700px tall here, so on
   * screen is anything starting above 640px) must not sit blank until the
   * first scroll.
   */
  it('reveals what is already on screen at its first report, and only then', () => {
    browser({ timelines: true, reducedMotion: false })
    const { scroller } = mountStage(500)
    const onScreen = document.createElement('div')
    const belowFold = document.createElement('div')
    scroller.append(onScreen, belowFold)
    const callback = vi.fn()
    registry.createShowcaseRevealObserver(callback)
    const observer = FakeObserver.made[0]

    observer.report([
      { target: onScreen, top: 500, isIntersecting: false },
      { target: belowFold, top: 660, isIntersecting: false },
    ])
    expect(revealed(callback)).toEqual([true, false])

    // A later report is the reading line's alone.
    observer.report([{ target: onScreen, top: 500, isIntersecting: false }])
    expect(revealed(callback)).toEqual([false])
  })
})
