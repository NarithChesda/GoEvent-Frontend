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
export function useDebounceFn<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): T {
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
    this.timeoutIds.forEach(id => clearTimeout(id))
    this.timeoutIds = []
  }
  
  destroy(): void {
    this.clearAll()
  }
}