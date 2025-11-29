/**
 * Constants for agenda-related functionality
 */

/**
 * Sentinel value used to represent agenda items without a scheduled date.
 * Use this constant instead of hardcoding 'unscheduled' or 'no-date' strings.
 */
export const NO_DATE_SENTINEL = 'unscheduled'

/**
 * Check if a date value represents an unscheduled item
 */
export function isUnscheduled(date: string | null | undefined): boolean {
  return !date || date === NO_DATE_SENTINEL
}

/**
 * Convert a date value to the API format (null for unscheduled)
 */
export function toApiDate(date: string | null | undefined): string | null {
  return isUnscheduled(date) ? null : date!
}

/**
 * Convert an API date to display format (sentinel for null)
 */
export function fromApiDate(date: string | null | undefined): string {
  return date || NO_DATE_SENTINEL
}
