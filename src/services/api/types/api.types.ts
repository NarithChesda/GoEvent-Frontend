/**
 * Core API type definitions
 */

/**
 * Query parameters for GET requests
 * Uses more specific types instead of 'any'
 * Index signature allows for extension by specific filter interfaces
 */
export type QueryParams = Record<string, string | number | boolean | null | undefined> & {
  [key: string]: string | number | boolean | null | undefined
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

/**
 * Paginated response wrapper for list endpoints
 */
export interface PaginatedResponse<T = unknown> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/**
 * Request options for API calls
 */
export interface RequestOptions {
  signal?: AbortSignal
  timeout?: number
}

/**
 * Error data interface for API error responses
 * More strict typing with proper type guards
 */
export interface ErrorData {
  detail?: string
  message?: string
  code?: string
  errors?: Record<string, string[]>
  [key: string]: unknown
}

/**
 * Type guard to check if an object is ErrorData
 */
export function isErrorData(data: unknown): data is ErrorData {
  return (
    typeof data === 'object' &&
    data !== null &&
    (
      'detail' in data ||
      'message' in data ||
      'code' in data ||
      'errors' in data
    )
  )
}

/**
 * Type guard to check if data contains field-specific errors
 */
export function hasFieldErrors(data: unknown): data is Record<string, string[]> {
  if (typeof data !== 'object' || data === null) return false

  const errorData = data as Record<string, unknown>

  // Check if it has field-specific error format (no detail/message, but has array values)
  if ('detail' in errorData || 'message' in errorData) return false

  return Object.values(errorData).some(
    value => Array.isArray(value) && value.length > 0 && typeof value[0] === 'string'
  )
}
