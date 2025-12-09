/**
 * Core HTTP client for API requests
 * Handles authentication, error handling, retries, and request deduplication
 */

import { secureStorage } from '@/utils/secureStorage'
import { tokenManager, type TokenRefreshResponse } from '@/services/tokenManager'
import { networkManager } from './NetworkManager'
import { SecureLogger } from './SecureLogger'
import type { ApiResponse, QueryParams, RequestOptions, ErrorData } from '../types/api.types'
import { isErrorData, hasFieldErrors } from '../types/api.types'

// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// Request timeout in milliseconds
const DEFAULT_REQUEST_TIMEOUT = 30000

// Development mode flag
const IS_DEV_MODE = import.meta.env.DEV

export class ApiClient {
  private baseURL: string

  /**
   * Request deduplication map to prevent duplicate concurrent requests
   * Key: request signature (method + URL + params hash)
   * Value: Promise for the ongoing request
   */
  private pendingRequests: Map<string, Promise<ApiResponse<unknown>>>

  constructor() {
    this.baseURL = API_BASE_URL
    this.pendingRequests = new Map()
  }

  /**
   * Generate a unique key for request deduplication
   */
  private getRequestKey(method: string, url: string, body?: unknown): string {
    const bodyStr = body ? JSON.stringify(body) : ''
    return `${method}:${url}:${bodyStr}`
  }

  /**
   * Utility method to get full URL for profile pictures
   */
  public getProfilePictureUrl(profilePictureUrl: string | null | undefined): string | null {
    if (!profilePictureUrl) return null

    // If it's already a full URL (starts with http/https), return as is
    if (profilePictureUrl.startsWith('http://') || profilePictureUrl.startsWith('https://')) {
      return profilePictureUrl
    }

    // If it's a relative URL, prepend the API base URL
    if (profilePictureUrl.startsWith('/')) {
      return `${this.baseURL}${profilePictureUrl}`
    }

    // If it doesn't start with /, assume it needs /media/ prefix
    return `${this.baseURL}/media/${profilePictureUrl}`
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const token = tokenManager.getAccessToken()
    const headers: Record<string, string> = {}

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    // Add security headers
    headers['X-Requested-With'] = 'XMLHttpRequest'

    return headers
  }

  /**
   * Attempt to refresh the access token
   * Uses tokenManager which handles request queuing automatically
   *
   * IMPROVEMENTS:
   * - TokenManager handles concurrent refresh attempts
   * - All pending requests are queued and resolved after refresh
   * - Better error handling
   */
  private async attemptTokenRefresh(): Promise<boolean> {
    try {
      return await tokenManager.attemptTokenRefresh(async (refreshToken: string) => {
        console.debug('[ApiClient] Calling token refresh endpoint')

        // Make direct API call to refresh endpoint
        const response = await fetch(`${this.baseURL}/api/auth/token/refresh/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({ refresh: refreshToken }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('[ApiClient] Token refresh failed:', response.status, errorText)
          throw new Error(`Token refresh failed: ${response.status}`)
        }

        const data = await response.json()

        // Validate response format
        if (!data.access || !data.refresh) {
          console.error('[ApiClient] Invalid refresh response format:', data)
          throw new Error('Invalid refresh response format')
        }

        console.info('[ApiClient] Token refresh endpoint returned new tokens')

        // Return in the format tokenManager expects
        return {
          access: data.access,
          refresh: data.refresh,
        } as TokenRefreshResponse
      })
    } catch (error) {
      console.error('[ApiClient] Token refresh attempt failed:', error)
      return false
    }
  }

  /**
   * Check network connectivity and queue requests if offline
   * Supports AbortController for request cancellation
   */
  private async handleNetworkRequest<T>(
    requestFn: (signal: AbortSignal) => Promise<Response>,
    options: RequestOptions = {},
    isRetry: boolean = false,
  ): Promise<ApiResponse<T>> {
    // Update network state
    networkManager.updateOnlineStatus()

    if (!networkManager.isOnline()) {
      return {
        success: false,
        message: 'You are currently offline. Please check your internet connection.',
      }
    }

    // Create AbortController for this request
    const controller = new AbortController()
    const { signal: externalSignal, timeout = DEFAULT_REQUEST_TIMEOUT } = options

    // If external signal is provided, abort our controller when it aborts
    if (externalSignal) {
      externalSignal.addEventListener('abort', () => {
        controller.abort()
      })
    }

    // Set up timeout
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, timeout)

    try {
      // Pass our controller's signal to the request
      const response = await requestFn(controller.signal)

      clearTimeout(timeoutId)
      return this.handleResponse<T>(response, (signal) => requestFn(signal), isRetry)
    } catch (error: unknown) {
      clearTimeout(timeoutId)

      // Handle abort
      if (error instanceof Error && error.name === 'AbortError') {
        if (externalSignal?.aborted) {
          return {
            success: false,
            message: 'Request was cancelled',
          }
        }
        return {
          success: false,
          message: 'Request timeout. Please try again.',
        }
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        networkManager.updateOnlineStatus()
        return {
          success: false,
          message: 'Network error. Please check your internet connection and try again.',
        }
      }

      return {
        success: false,
        message: 'An unexpected error occurred',
      }
    }
  }

  /**
   * Enhanced error handling with better user messages
   * Handles documented API error formats including field-specific errors and authentication errors
   * Now with proper type guards for safer error handling
   */
  private getUserFriendlyErrorMessage(status: number, data: unknown): string {
    // Use type guard to safely check if data is ErrorData
    if (!isErrorData(data)) {
      // If data doesn't match ErrorData format, return generic message
      return this.getDefaultErrorMessage(status)
    }

    switch (status) {
      case 400:
        // Handle documented field-specific error format: { "field_name": ["Error message"] }
        if (hasFieldErrors(data)) {
          const fieldErrors = Object.entries(data)
            .filter(([_key, value]) => Array.isArray(value) && value.length > 0 && typeof value[0] === 'string')
            .map(([field, errors]) => {
              const errorArray = errors as string[]
              return `${field}: ${errorArray[0]}`
            })

          if (fieldErrors.length > 0) {
            return fieldErrors.join(', ')
          }
        }

        if (data.detail) return String(data.detail)
        if (data.message) return String(data.message)
        // Handle promo code validation error format: { valid: false, error: "..." }
        if ('error' in data && typeof data.error === 'string') return data.error
        return 'Invalid request. Please check your input and try again.'

      case 401:
        // Handle documented auth error format
        if (data.detail) {
          if (data.code === 'token_not_valid') {
            return 'Your session has expired. Please sign in again.'
          }
          return data.detail
        }
        return 'Authentication required. Please sign in.'

      case 403:
        return data.detail || 'You do not have permission to perform this action.'

      case 404:
        return 'The requested resource was not found.'

      case 409:
        return data.detail || data.message || 'This action conflicts with existing data.'

      case 422:
        return 'Please check your input and try again.'

      case 429:
        return 'Too many requests. Please wait a moment and try again.'

      case 500:
        return 'A server error occurred. Please try again later.'

      case 502:
      case 503:
      case 504:
        return 'Service is temporarily unavailable. Please try again later.'

      default:
        return data.detail || data.message || 'An unexpected error occurred.'
    }
  }

  /**
   * Get default error message for status code
   */
  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.'
      case 401:
        return 'Authentication required. Please sign in.'
      case 403:
        return 'You do not have permission to perform this action.'
      case 404:
        return 'The requested resource was not found.'
      case 409:
        return 'This action conflicts with existing data.'
      case 422:
        return 'Please check your input and try again.'
      case 429:
        return 'Too many requests. Please wait a moment and try again.'
      case 500:
        return 'A server error occurred. Please try again later.'
      case 502:
      case 503:
      case 504:
        return 'Service is temporarily unavailable. Please try again later.'
      default:
        return 'An unexpected error occurred.'
    }
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(
    response: Response,
    requestFn?: (signal: AbortSignal) => Promise<Response>,
    isRetry: boolean = false,
  ): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type')
    const isJson = contentType?.includes('application/json')

    try {
      // Handle 204 No Content responses (common for DELETE requests)
      if (response.status === 204) {
        return {
          success: true,
          data: null as any,
        }
      }

      // Check if response has a body before trying to parse it
      const text = await response.text()

      // Secure debug logging for authentication requests (only in dev mode)
      if (IS_DEV_MODE && response.url.includes('/api/auth/')) {
        SecureLogger.debug('Auth API Response', {
          url: response.url,
          status: response.status,
          ok: response.ok,
          contentType: contentType || 'none',
          isJson: isJson,
          textLength: text?.length || 0,
        })
      }

      let data

      // Enhanced JSON parsing with strict content-type validation
      if (text) {
        if (isJson) {
          try {
            data = JSON.parse(text)
          } catch (parseError) {
            // Secure error logging for parsing failures
            SecureLogger.error(
              'JSON Parse Error',
              parseError,
              {
                url: response.url,
                status: response.status,
                contentType: contentType || 'none',
              }
            )
            throw parseError // Re-throw to be caught by outer catch block
          }
        } else {
          // SECURITY FIX: Only attempt JSON parsing if content-type suggests JSON
          // This prevents lenient parsing that could lead to security issues
          const mightBeJson = contentType?.includes('json') || text.trim().startsWith('{') || text.trim().startsWith('[')

          if (mightBeJson) {
            try {
              data = JSON.parse(text)
              // Log warning about incorrect content-type in dev mode only
              if (IS_DEV_MODE) {
                SecureLogger.warn(
                  'Content-Type Mismatch',
                  'Response had non-JSON content-type but contained valid JSON',
                  { url: response.url, contentType: contentType || 'none' }
                )
              }
            } catch {
              // If JSON parse fails, treat as plain text
              data = text
            }
          } else {
            // Definitely not JSON, use as plain text
            data = text
          }
        }
      } else {
        data = null
      }

      if (!response.ok) {
        // Secure error logging with proper type guards
        if (response.status === 400 && isErrorData(data)) {
          SecureLogger.error('400 Bad Request', new Error('Validation error'), {
            url: response.url,
            status: response.status,
            hasFieldErrors: hasFieldErrors(data),
          })
        } else if (response.status >= 500) {
          SecureLogger.error('Server Error', new Error(`${response.status} error`), {
            url: response.url,
            status: response.status,
          })
        }

        // Handle 401 specifically for auth token issues
        if (response.status === 401 && !isRetry && requestFn) {
          console.debug('[ApiClient] Received 401, attempting token refresh')

          // Attempt to refresh the token (tokenManager handles queuing automatically)
          const refreshSuccess = await this.attemptTokenRefresh()

          if (refreshSuccess) {
            console.info('[ApiClient] Token refresh successful, retrying original request')
            // Retry the original request with new token
            try {
              // Create new AbortController for retry
              const retryController = new AbortController()
              const retryResponse = await requestFn(retryController.signal)
              return this.handleResponse<T>(retryResponse, undefined, true)
            } catch (retryError) {
              console.error('[ApiClient] Retry after token refresh failed:', retryError)
              return {
                success: false,
                message: 'Request failed after token refresh',
              }
            }
          } else {
            console.warn('[ApiClient] Token refresh failed, clearing auth data')
            // Refresh failed, clear all auth data
            tokenManager.clearTokens()
            secureStorage.removeItem('user')
          }
        } else if (response.status === 401 && isRetry) {
          // If we already retried and still got 401, clear everything
          console.warn('[ApiClient] Retry also failed with 401, clearing auth data')
          tokenManager.clearTokens()
          secureStorage.removeItem('user')
        }

        const message = this.getUserFriendlyErrorMessage(response.status, data)

        return {
          success: false,
          message,
          errors: data?.errors || (isJson ? data : undefined),
        }
      }

      // Secure debug logging for successful auth responses (dev mode only)
      if (IS_DEV_MODE && response.url.includes('/api/auth/')) {
        SecureLogger.debug('Auth Success Response', {
          dataType: typeof data,
          hasTokens: data && typeof data === 'object' && 'tokens' in data,
          hasUser: data && typeof data === 'object' && 'user' in data,
        })
      }

      return {
        success: true,
        data: data || null,
      }
    } catch (error) {
      // Secure error logging for parsing errors
      SecureLogger.error(
        'Response Parsing Error',
        error,
        {
          url: response.url,
          status: response.status,
          contentType: contentType || 'none',
        }
      )

      return {
        success: false,
        message: 'Network error or invalid response format',
      }
    }
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    params?: QueryParams,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })
    }

    // Request deduplication: check if identical request is already in flight
    const requestKey = this.getRequestKey('GET', url.toString())
    const existingRequest = this.pendingRequests.get(requestKey)

    if (existingRequest) {
      if (IS_DEV_MODE) {
        SecureLogger.debug('Request Deduplication', {
          message: 'Reusing existing request',
          method: 'GET',
          endpoint,
        })
      }
      return existingRequest as Promise<ApiResponse<T>>
    }

    // Create new request and store in pending map
    const requestPromise = this.handleNetworkRequest<T>(
      async (signal) => {
        return fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
          },
          signal,
        })
      },
      options
    ).finally(() => {
      // Remove from pending requests when done
      this.pendingRequests.delete(requestKey)
    })

    this.pendingRequests.set(requestKey, requestPromise as Promise<ApiResponse<unknown>>)
    return requestPromise
  }

  /**
   * Public GET request without authentication headers
   * Used for endpoints that should work without authentication
   */
  async getPublic<T>(
    endpoint: string,
    params?: QueryParams,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return this.handleNetworkRequest<T>(
      async (signal) => {
        return fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest', // Only add security header, no auth
          },
          signal,
        })
      },
      options
    )
  }

  /**
   * POST request
   */
  async post<T, D = unknown>(
    endpoint: string,
    data?: D,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.handleNetworkRequest<T>(
      async (signal) => {
        return fetch(`${this.baseURL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
          },
          body: data ? JSON.stringify(data) : undefined,
          signal,
        })
      },
      options
    )
  }

  /**
   * PUT request
   */
  async put<T, D = unknown>(
    endpoint: string,
    data?: D,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.handleNetworkRequest<T>(
      async (signal) => {
        return fetch(`${this.baseURL}${endpoint}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
          },
          body: data ? JSON.stringify(data) : undefined,
          signal,
        })
      },
      options
    )
  }

  /**
   * PATCH request
   */
  async patch<T, D = unknown>(
    endpoint: string,
    data?: D,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.handleNetworkRequest<T>(
      async (signal) => {
        const isFormData = data instanceof FormData
        const body = data ? (isFormData ? data : JSON.stringify(data)) : undefined

        // Debug logging for PATCH requests
        if (IS_DEV_MODE) {
          const headers = {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...this.getAuthHeaders(),
          }
          console.log('[ApiClient] PATCH request:', {
            url: `${this.baseURL}${endpoint}`,
            isFormData,
            body: isFormData ? '[FormData]' : body,
            headers: Object.keys(headers),
            contentType: headers['Content-Type'],
          })
        }

        return fetch(`${this.baseURL}${endpoint}`, {
          method: 'PATCH',
          headers: {
            // Don't set Content-Type for FormData, let the browser handle it
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...this.getAuthHeaders(),
          },
          body,
          signal,
        })
      },
      options
    )
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.handleNetworkRequest<T>(
      async (signal) => {
        return fetch(`${this.baseURL}${endpoint}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
          },
          body: data ? JSON.stringify(data) : undefined,
          signal,
        })
      },
      options
    )
  }

  /**
   * POST request with FormData
   */
  async postFormData<T>(
    endpoint: string,
    data: FormData,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.handleNetworkRequest<T>(
      async (signal) => {
        return fetch(`${this.baseURL}${endpoint}`, {
          method: 'POST',
          headers: {
            // Don't set Content-Type for FormData, let the browser handle it
            ...this.getAuthHeaders(),
          },
          body: data,
          signal,
        })
      },
      options
    )
  }

  /**
   * PUT request with FormData
   */
  async putFormData<T>(
    endpoint: string,
    data: FormData,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.handleNetworkRequest<T>(
      async (signal) => {
        return fetch(`${this.baseURL}${endpoint}`, {
          method: 'PUT',
          headers: {
            // Don't set Content-Type for FormData, let the browser handle it
            ...this.getAuthHeaders(),
          },
          body: data,
          signal,
        })
      },
      options
    )
  }

  /**
   * PATCH request with FormData
   */
  async patchFormData<T>(
    endpoint: string,
    data: FormData,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.handleNetworkRequest<T>(
      async (signal) => {
        return fetch(`${this.baseURL}${endpoint}`, {
          method: 'PATCH',
          headers: {
            // Don't set Content-Type for FormData, let the browser handle it
            ...this.getAuthHeaders(),
          },
          body: data,
          signal,
        })
      },
      options
    )
  }

  /**
   * Upload a file with optional progress tracking
   * Unified method for single file uploads that properly integrates with ApiClient
   */
  async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    options?: RequestOptions & {
      onProgress?: (progress: number) => void
    }
  ): Promise<ApiResponse<T>> {
    return this.handleNetworkRequest<T>(
      async (signal) => {
        // If progress callback is provided, use XMLHttpRequest
        if (options?.onProgress) {
          return this.uploadWithProgress(endpoint, formData, options.onProgress, signal)
        }

        // Otherwise use standard fetch
        return fetch(`${this.baseURL}${endpoint}`, {
          method: 'POST',
          headers: {
            // Don't set Content-Type for FormData, let browser handle it
            ...this.getAuthHeaders(),
          },
          body: formData,
          signal,
        })
      },
      options
    )
  }

  /**
   * Upload with progress using XMLHttpRequest
   * Private helper for uploadFile when progress tracking is needed
   */
  private uploadWithProgress(
    endpoint: string,
    formData: FormData,
    onProgress: (progress: number) => void,
    signal: AbortSignal
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      // Handle abort signal
      signal.addEventListener('abort', () => {
        xhr.abort()
        reject(new DOMException('Request aborted', 'AbortError'))
      })

      // Progress event
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100
          onProgress(percentComplete)
        }
      })

      // Load event
      xhr.addEventListener('load', () => {
        // Convert XMLHttpRequest response to Response object
        const response = new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers(
            xhr.getAllResponseHeaders()
              .trim()
              .split('\n')
              .reduce((acc: Record<string, string>, line) => {
                const [key, value] = line.split(': ')
                if (key && value) acc[key] = value
                return acc
              }, {})
          ),
        })
        resolve(response)
      })

      // Error event
      xhr.addEventListener('error', () => {
        reject(new TypeError('Network request failed'))
      })

      // Abort event
      xhr.addEventListener('abort', () => {
        reject(new DOMException('Request aborted', 'AbortError'))
      })

      // Setup and send
      xhr.open('POST', `${this.baseURL}${endpoint}`)

      // Add auth headers
      const authHeaders = this.getAuthHeaders()
      Object.entries(authHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value)
      })

      xhr.send(formData)
    })
  }

  /**
   * Bulk upload multiple files with optional progress tracking
   * Unified method for multi-file uploads that properly integrates with ApiClient
   */
  async bulkUploadFiles<T>(
    endpoint: string,
    files: File[],
    options?: RequestOptions & {
      fieldName?: string // FormData field name for files (default: 'files')
      additionalFields?: Record<string, string | string[]>
      onProgress?: (progress: number) => void
    }
  ): Promise<ApiResponse<T>> {
    const formData = new FormData()

    // Append all files
    const fieldName = options?.fieldName || 'files'
    files.forEach((file) => {
      formData.append(fieldName, file)
    })

    // Append additional fields if provided
    if (options?.additionalFields) {
      Object.entries(options.additionalFields).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, v))
        } else {
          formData.append(key, value)
        }
      })
    }

    return this.uploadFile<T>(endpoint, formData, options)
  }
}

// Singleton instance
export const apiClient = new ApiClient()
