/**
 * Error message utility for providing user-friendly, actionable error messages
 *
 * This utility transforms technical API errors into clear, helpful messages that
 * guide users toward resolving issues.
 */

export interface ApiError {
  response?: {
    status: number
    data?: {
      message?: string
      errors?: Record<string, string[]>
    }
  }
  code?: string
  message?: string
}

/**
 * Get a user-friendly error message based on the error and context
 *
 * @param err - The error object (typically from catch block)
 * @param context - Description of the action that failed (e.g., "delete expense", "create budget")
 * @returns A user-friendly error message
 *
 * @example
 * ```ts
 * try {
 *   await expensesService.deleteExpense(id)
 * } catch (err) {
 *   error.value = getErrorMessage(err, 'delete expense')
 *   // Returns: "Network error. Please check your connection and try again."
 *   // or: "Expense not found. It may have been deleted."
 * }
 * ```
 */
export const getErrorMessage = (err: unknown, context: string): string => {
  const apiError = err as ApiError

  // Network errors (no connection, timeout, etc.)
  if (apiError.code === 'NETWORK_ERROR' || apiError.code === 'ECONNABORTED') {
    return 'Network error. Please check your connection and try again.'
  }

  // Timeout errors
  if (apiError.code === 'ETIMEDOUT' || apiError.message?.includes('timeout')) {
    return 'Request timed out. Please try again.'
  }

  // HTTP status-based errors
  const status = apiError.response?.status

  if (status === 404) {
    // Capitalize first letter of context for proper grammar
    const capitalizedContext = context.charAt(0).toUpperCase() + context.slice(1)
    return `${capitalizedContext} not found. It may have been deleted.`
  }

  if (status === 403) {
    return `You don't have permission to ${context.toLowerCase()}.`
  }

  if (status === 401) {
    return 'Your session has expired. Please log in again.'
  }

  if (status === 400) {
    // Try to get specific backend message
    const backendMessage = apiError.response?.data?.message
    if (backendMessage) {
      return backendMessage
    }

    // Check for field-specific errors
    const fieldErrors = apiError.response?.data?.errors
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      const firstError = Object.values(fieldErrors)[0]
      return Array.isArray(firstError) ? firstError[0] : String(firstError)
    }

    return 'Invalid data. Please check your input and try again.'
  }

  if (status === 409) {
    return 'This action conflicts with existing data. Please refresh and try again.'
  }

  if (status === 422) {
    const backendMessage = apiError.response?.data?.message
    return backendMessage || 'Validation failed. Please check your input.'
  }

  if (status === 500) {
    return 'Server error. Please try again in a moment.'
  }

  if (status === 503) {
    return 'Service temporarily unavailable. Please try again later.'
  }

  // Generic fallback with context
  const action = context.toLowerCase().startsWith('load')
    ? context.toLowerCase()
    : `${context.toLowerCase()}`

  return `Failed to ${action}. Please try again.`
}

/**
 * Get field-specific validation errors from API response
 *
 * @param err - The error object from API
 * @returns Object with field names as keys and error messages as values
 *
 * @example
 * ```ts
 * const fieldErrors = getFieldErrors(err)
 * // Returns: { "description": "This field is required", "amount": "Must be greater than 0" }
 * ```
 */
export const getFieldErrors = (err: unknown): Record<string, string> => {
  const apiError = err as ApiError
  const fieldErrors = apiError.response?.data?.errors

  if (!fieldErrors) {
    return {}
  }

  // Convert array of messages to single string per field
  const result: Record<string, string> = {}
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (Array.isArray(messages)) {
      result[field] = messages.join(', ')
    } else {
      result[field] = String(messages)
    }
  }

  return result
}

/**
 * Check if an error is a network error (no connection)
 */
export const isNetworkError = (err: unknown): boolean => {
  const apiError = err as ApiError
  return apiError.code === 'NETWORK_ERROR' ||
         apiError.code === 'ERR_NETWORK' ||
         apiError.message?.toLowerCase().includes('network error') === true
}

/**
 * Check if an error is an authentication error
 */
export const isAuthError = (err: unknown): boolean => {
  const apiError = err as ApiError
  return apiError.response?.status === 401 || apiError.response?.status === 403
}

/**
 * Check if an error is a validation error
 */
export const isValidationError = (err: unknown): boolean => {
  const apiError = err as ApiError
  const status = apiError.response?.status
  return status === 400 || status === 422
}
