import { ref, reactive } from 'vue'

/**
 * Error handling composable
 * Provides consistent error handling, reporting, and recovery across the application
 */

export interface ErrorInfo {
  id: string
  type: 'network' | 'security' | 'validation' | 'resource' | 'unknown'
  message: string
  details?: any
  timestamp: number
  context?: string
  recoverable: boolean
  retryCount?: number
  stack?: string
}

export interface ErrorStats {
  totalErrors: number
  errorsByType: Record<string, number>
  recentErrors: ErrorInfo[]
}

export function useErrorHandler() {
  const errors = ref<Map<string, ErrorInfo>>(new Map())
  const errorStats = reactive<ErrorStats>({
    totalErrors: 0,
    errorsByType: {},
    recentErrors: [],
  })

  const maxRecentErrors = 50
  const maxRetries = 3

  /**
   * Creates a standardized error info object
   */
  const createErrorInfo = (
    error: Error | string,
    type: ErrorInfo['type'] = 'unknown',
    context?: string,
    recoverable: boolean = true,
  ): ErrorInfo => {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()

    let message: string
    let stack: string | undefined

    if (error instanceof Error) {
      message = error.message
      stack = error.stack
    } else {
      message = String(error)
    }

    return {
      id,
      type,
      message,
      timestamp,
      context,
      recoverable,
      retryCount: 0,
      stack,
    }
  }

  /**
   * Records an error with automatic categorization
   */
  const handleError = (
    error: Error | string,
    type?: ErrorInfo['type'],
    context?: string,
    recoverable?: boolean,
  ): ErrorInfo => {
    // Auto-detect error type if not provided
    if (!type) {
      const errorString = error instanceof Error ? error.message : String(error)

      if (
        errorString.includes('network') ||
        errorString.includes('fetch') ||
        errorString.includes('timeout')
      ) {
        type = 'network'
      } else if (
        errorString.includes('security') ||
        errorString.includes('unsafe') ||
        errorString.includes('invalid')
      ) {
        type = 'security'
      } else if (errorString.includes('validation') || errorString.includes('required')) {
        type = 'validation'
      } else if (errorString.includes('load') || errorString.includes('resource')) {
        type = 'resource'
      } else {
        type = 'unknown'
      }
    }

    const errorInfo = createErrorInfo(error, type, context, recoverable)

    // Store error
    errors.value.set(errorInfo.id, errorInfo)

    // Update statistics
    errorStats.totalErrors++
    errorStats.errorsByType[type] = (errorStats.errorsByType[type] || 0) + 1

    // Add to recent errors (with size limit)
    errorStats.recentErrors.unshift(errorInfo)
    if (errorStats.recentErrors.length > maxRecentErrors) {
      errorStats.recentErrors = errorStats.recentErrors.slice(0, maxRecentErrors)
    }

    // Log error for debugging
    console.error(
      `[${type.toUpperCase()}] ${errorInfo.context || 'Unknown context'}: ${errorInfo.message}`,
    )
    if (errorInfo.stack) {
      console.error(errorInfo.stack)
    }

    return errorInfo
  }

  /**
   * Wraps an async operation with error handling and retry logic
   */
  const withRetry = async <T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = 3,
    retryDelay: number = 1000,
  ): Promise<T> => {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt === maxRetries) {
          // Final attempt failed - record error
          handleError(lastError, 'resource', context, false)
          throw lastError
        }

        // Record retry attempt
        console.warn(`Retry ${attempt}/${maxRetries} for ${context}: ${lastError.message}`)

        // Wait before retry with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt))
      }
    }

    throw lastError!
  }

  /**
   * Race condition safe state manager
   */
  const createRaceConditionSafeState = <T>(initialValue: T) => {
    const state = ref<T>(initialValue)
    const operationId = ref(0)

    const safeUpdate = async <R>(
      operation: () => Promise<R>,
      onSuccess: (result: R, currentOpId: number) => void,
      onError?: (error: Error, currentOpId: number) => void,
    ) => {
      const currentOpId = ++operationId.value

      try {
        const result = await operation()

        // Only update if this is still the latest operation
        if (currentOpId === operationId.value) {
          onSuccess(result, currentOpId)
        } else {
          console.log(`Operation ${currentOpId} superseded by ${operationId.value}`)
        }
      } catch (error) {
        // Only handle error if this is still the latest operation
        if (currentOpId === operationId.value) {
          const err = error instanceof Error ? error : new Error(String(error))
          if (onError) {
            onError(err, currentOpId)
          } else {
            handleError(err, 'resource', 'Race condition safe operation')
          }
        }
      }
    }

    return {
      state,
      safeUpdate,
      operationId: () => operationId.value,
    }
  }

  /**
   * Debounced error handler to prevent spam
   */
  const errorTimeouts = new Map<string, number>()

  const debouncedError = (
    error: Error | string,
    type: ErrorInfo['type'],
    context: string,
    delay: number = 1000,
  ) => {
    const key = `${type}_${context}`

    // Clear existing timeout
    if (errorTimeouts.has(key)) {
      clearTimeout(errorTimeouts.get(key)!)
    }

    // Set new timeout
    errorTimeouts.set(
      key,
      setTimeout(() => {
        handleError(error, type, context)
        errorTimeouts.delete(key)
      }, delay),
    )
  }

  /**
   * Get errors by type or context
   */
  const getErrors = (filter?: {
    type?: ErrorInfo['type']
    context?: string
    recoverable?: boolean
    since?: number
  }): ErrorInfo[] => {
    let result = Array.from(errors.value.values())

    if (filter) {
      if (filter.type) {
        result = result.filter((e) => e.type === filter.type)
      }
      if (filter.context) {
        result = result.filter((e) => e.context === filter.context)
      }
      if (filter.recoverable !== undefined) {
        result = result.filter((e) => e.recoverable === filter.recoverable)
      }
      if (filter.since) {
        result = result.filter((e) => e.timestamp >= filter.since!)
      }
    }

    return result.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Clear errors
   */
  const clearErrors = (filter?: {
    type?: ErrorInfo['type']
    context?: string
    olderThan?: number
  }) => {
    if (!filter) {
      errors.value.clear()
      errorStats.recentErrors = []
      return
    }

    for (const [id, error] of errors.value) {
      let shouldRemove = true

      if (filter.type && error.type !== filter.type) {
        shouldRemove = false
      }
      if (filter.context && error.context !== filter.context) {
        shouldRemove = false
      }
      if (filter.olderThan && error.timestamp >= filter.olderThan) {
        shouldRemove = false
      }

      if (shouldRemove) {
        errors.value.delete(id)
      }
    }

    // Rebuild recent errors
    errorStats.recentErrors = errorStats.recentErrors.filter((error) => errors.value.has(error.id))
  }

  /**
   * Get error recovery suggestions
   */
  const getRecoverySuggestions = (error: ErrorInfo): string[] => {
    const suggestions: string[] = []

    switch (error.type) {
      case 'network':
        suggestions.push('Check your internet connection')
        suggestions.push('Try refreshing the page')
        suggestions.push('Contact support if the problem persists')
        break

      case 'security':
        suggestions.push('This content has been blocked for security reasons')
        suggestions.push('Contact the site administrator')
        break

      case 'validation':
        suggestions.push('Please check your input and try again')
        suggestions.push('Ensure all required fields are filled')
        break

      case 'resource':
        suggestions.push('The requested resource could not be loaded')
        suggestions.push('Try refreshing the page')
        break

      default:
        suggestions.push('An unexpected error occurred')
        suggestions.push('Please try again or contact support')
    }

    return suggestions
  }

  /**
   * Export error report for debugging
   */
  const exportErrorReport = () => {
    const report = {
      timestamp: Date.now(),
      stats: { ...errorStats },
      errors: Array.from(errors.value.values()),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    return JSON.stringify(report, null, 2)
  }

  return {
    // Error handling
    handleError,
    debouncedError,

    // Retry logic
    withRetry,

    // Race condition protection
    createRaceConditionSafeState,

    // Error querying
    getErrors,
    clearErrors,
    getRecoverySuggestions,

    // Statistics
    errorStats,

    // Utilities
    exportErrorReport,

    // Reactive state
    errors: errors.value,
    hasErrors: () => errors.value.size > 0,
  }
}
