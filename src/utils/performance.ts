/**
 * Performance utilities for optimizing Vue.js applications
 */

/**
 * Throttle utility using requestAnimationFrame for better performance
 * This ensures that the function executes at most once per frame (60fps)
 *
 * @param fn - The function to throttle
 * @returns The throttled function
 */
export function useThrottleFn<T extends (...args: any[]) => any>(fn: T): T {
  let ticking = false

  return ((...args: Parameters<T>) => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(() => {
        fn(...args)
        ticking = false
      })
    }
  }) as T
}

/**
 * Debounce utility for delaying function execution
 *
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns The debounced function
 */
export function useDebounceFn<T extends (...args: any[]) => any>(fn: T, delay: number = 300): T {
  let timeoutId: number | null = null

  return ((...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }) as T
}

/**
 * Cleanup utility for managing multiple timeout IDs
 */
export class TimeoutManager {
  private timeoutIds: number[] = []

  setTimeout(callback: () => void, delay: number): void {
    const id = setTimeout(callback, delay)
    this.timeoutIds.push(id)
  }

  clearAll(): void {
    this.timeoutIds.forEach((id) => clearTimeout(id))
    this.timeoutIds = []
  }

  destroy(): void {
    this.clearAll()
  }
}

/**
 * Enhanced debounce function with immediate execution option
 *
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @param immediate - Execute immediately on first call
 * @returns The debounced function
 */
export function useAdvancedDebounceFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300,
  immediate: boolean = false,
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: number | null = null
  let result: ReturnType<T>

  const debounced = ((...args: Parameters<T>) => {
    const callNow = immediate && !timeoutId

    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      timeoutId = null
      if (!immediate) {
        result = fn(...args)
      }
    }, delay)

    if (callNow) {
      result = fn(...args)
    }

    return result
  }) as T & { cancel: () => void; flush: () => void }

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  debounced.flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      result = fn.apply(null, [])
      timeoutId = null
    }
    return result
  }

  return debounced
}

/**
 * Intersection Observer hook for pause/resume animations
 * Provides better performance than constant animation when elements are not visible
 */
export interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  freezeOnceVisible?: boolean
}

export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void,
  options: UseIntersectionObserverOptions = {},
) {
  const { threshold = 0.1, root = null, rootMargin = '0px', freezeOnceVisible = false } = options

  let observer: IntersectionObserver | null = null
  const observedElements = new WeakSet<Element>()

  const observe = (element: Element) => {
    if (!element || observedElements.has(element)) return

    if (!observer) {
      observer = new IntersectionObserver(
        (entries, obs) => {
          if (freezeOnceVisible) {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                obs.unobserve(entry.target)
              }
            })
          }
          callback(entries, obs)
        },
        {
          threshold,
          root,
          rootMargin,
        },
      )
    }

    observer.observe(element)
    observedElements.add(element)
  }

  const unobserve = (element: Element) => {
    if (observer && element) {
      observer.unobserve(element)
      observedElements.delete(element)
    }
  }

  const disconnect = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  return {
    observe,
    unobserve,
    disconnect,
  }
}

/**
 * Enhanced throttle function for scroll and resize handlers
 * Uses requestAnimationFrame for smooth performance
 *
 * @param fn - The function to throttle
 * @param options - Throttling options
 * @returns The throttled function
 */
export interface ThrottleOptions {
  leading?: boolean
  trailing?: boolean
  useRAF?: boolean
}

export function useAdvancedThrottleFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 16, // Default to ~60fps
  options: ThrottleOptions = {},
): T & { cancel: () => void } {
  const { leading = true, trailing = true, useRAF = true } = options

  let lastCallTime = 0
  let timeoutId: number | null = null
  let rafId: number | null = null
  let lastArgs: Parameters<T> | null = null

  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now()

    if (lastCallTime === 0 && !leading) {
      lastCallTime = now
    }

    const remaining = delay - (now - lastCallTime)
    lastArgs = args

    if (remaining <= 0 || remaining > delay) {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = null
      }

      lastCallTime = now
      return fn(...args)
    } else if (!timeoutId && trailing) {
      const executeTrailing = () => {
        lastCallTime = Date.now()
        timeoutId = null
        if (lastArgs) {
          if (useRAF) {
            rafId = requestAnimationFrame(() => {
              fn(...lastArgs!)
              rafId = null
            })
          } else {
            fn(...lastArgs)
          }
        }
      }

      timeoutId = setTimeout(executeTrailing, remaining)
    }
  }) as T & { cancel: () => void }

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    lastCallTime = 0
  }

  return throttled
}

/**
 * Memory-efficient animation frame manager
 * Prevents memory leaks from orphaned animation frames
 */
export class AnimationFrameManager {
  private activeFrames = new Set<number>()

  requestAnimationFrame(callback: FrameRequestCallback): number {
    const frameId = requestAnimationFrame((time) => {
      this.activeFrames.delete(frameId)
      callback(time)
    })

    this.activeFrames.add(frameId)
    return frameId
  }

  cancelAnimationFrame(frameId: number): void {
    if (this.activeFrames.has(frameId)) {
      cancelAnimationFrame(frameId)
      this.activeFrames.delete(frameId)
    }
  }

  cancelAll(): void {
    this.activeFrames.forEach((frameId) => {
      cancelAnimationFrame(frameId)
    })
    this.activeFrames.clear()
  }

  destroy(): void {
    this.cancelAll()
  }
}

/**
 * Resource cleanup utility for Vue components
 * Helps prevent memory leaks by managing multiple cleanup tasks
 */
export class ResourceManager {
  private cleanupTasks: (() => void)[] = []

  add(cleanupTask: () => void): void {
    this.cleanupTasks.push(cleanupTask)
  }

  addEventListener(
    element: Element | Window | Document,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): void {
    element.addEventListener(event, handler, options)
    this.add(() => element.removeEventListener(event, handler, options))
  }

  addResizeObserver(callback: ResizeObserverCallback, elements: Element[]): void {
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(callback)
    elements.forEach((element) => observer.observe(element))

    this.add(() => {
      observer.disconnect()
    })
  }

  addInterval(callback: () => void, delay: number): void {
    const intervalId = setInterval(callback, delay)
    this.add(() => clearInterval(intervalId))
  }

  addTimeout(callback: () => void, delay: number): number {
    const timeoutId = setTimeout(callback, delay)
    this.add(() => clearTimeout(timeoutId))
    return timeoutId
  }

  cleanup(): void {
    this.cleanupTasks.forEach((task) => {
      try {
        task()
      } catch (error) {
        console.warn('Error during cleanup:', error)
      }
    })
    this.cleanupTasks = []
  }

  destroy(): void {
    this.cleanup()
  }
}

/**
 * Request deduplication utility
 * Prevents multiple identical API calls from being made concurrently
 */
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>()

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If there's already a pending request with this key, return it
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    // Create new request
    const request = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key)
    })

    this.pendingRequests.set(key, request)
    return request
  }

  cancel(key: string): void {
    this.pendingRequests.delete(key)
  }

  cancelAll(): void {
    this.pendingRequests.clear()
  }
}

/**
 * Performance monitoring utilities
 */
export const performanceUtils = {
  /**
   * Measure execution time of a function
   */
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    console.log(`${name} took ${end - start} milliseconds`)
    return result
  },

  /**
   * Measure async function execution time
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    console.log(`${name} took ${end - start} milliseconds`)
    return result
  },

  /**
   * Memory usage information (if available)
   */
  getMemoryUsage(): any {
    if ('memory' in performance) {
      return (performance as any).memory
    }
    return null
  },
}

/**
 * Vue composable for managing performance utilities in components
 */
export function usePerformance() {
  const animationFrameManager = new AnimationFrameManager()
  const resourceManager = new ResourceManager()
  const requestDeduplicator = new RequestDeduplicator()

  const cleanup = () => {
    animationFrameManager.destroy()
    resourceManager.destroy()
    requestDeduplicator.cancelAll()
  }

  return {
    // Animation utilities
    requestAnimationFrame: animationFrameManager.requestAnimationFrame.bind(animationFrameManager),
    cancelAnimationFrame: animationFrameManager.cancelAnimationFrame.bind(animationFrameManager),

    // Resource management
    addCleanup: resourceManager.add.bind(resourceManager),
    addEventListener: resourceManager.addEventListener.bind(resourceManager),
    addResizeObserver: resourceManager.addResizeObserver.bind(resourceManager),
    addInterval: resourceManager.addInterval.bind(resourceManager),
    addTimeout: resourceManager.addTimeout.bind(resourceManager),

    // Request deduplication
    deduplicateRequest: requestDeduplicator.deduplicate.bind(requestDeduplicator),

    // Throttle and debounce
    throttle: useAdvancedThrottleFn,
    debounce: useAdvancedDebounceFn,

    // Intersection observer
    intersectionObserver: useIntersectionObserver,

    // Performance monitoring
    measure: performanceUtils.measure,
    measureAsync: performanceUtils.measureAsync,
    getMemoryUsage: performanceUtils.getMemoryUsage,

    // Cleanup
    cleanup,
  }
}
