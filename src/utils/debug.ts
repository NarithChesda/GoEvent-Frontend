/**
 * Debug utility for conditional logging in development mode
 *
 * Usage:
 * import { debug } from '@/utils/debug'
 *
 * debug.log('User action:', action)
 * debug.warn('Potential issue detected')
 * debug.error('Error occurred:', error)
 * debug.table(arrayOfObjects)
 */

const isDev = import.meta.env.DEV

/**
 * Debug logging utilities that only work in development mode
 */
export const debug = {
  /**
   * Log a message in development mode
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log('[GoEvent]', ...args)
    }
  },

  /**
   * Log a warning message in development mode
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn('[GoEvent]', ...args)
    }
  },

  /**
   * Log an error message in development mode
   */
  error: (...args: any[]) => {
    if (isDev) {
      console.error('[GoEvent]', ...args)
    }
  },

  /**
   * Log a table in development mode
   */
  table: (data: any) => {
    if (isDev) {
      console.table(data)
    }
  },

  /**
   * Log a group of messages in development mode
   */
  group: (label: string, callback: () => void) => {
    if (isDev) {
      console.group(`[GoEvent] ${label}`)
      callback()
      console.groupEnd()
    }
  },

  /**
   * Time a function execution in development mode
   */
  time: (label: string) => {
    if (isDev) {
      console.time(`[GoEvent] ${label}`)
    }
  },

  /**
   * End timing a function execution in development mode
   */
  timeEnd: (label: string) => {
    if (isDev) {
      console.timeEnd(`[GoEvent] ${label}`)
    }
  },
} as const
