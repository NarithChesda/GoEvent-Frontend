/**
 * Token Manager Service
 *
 * Centralized token management to avoid circular dependencies.
 * Handles token storage, validation, refresh logic, and request queuing.
 *
 * IMPROVEMENTS:
 * - Single source of truth for token validation
 * - Request queue for pending requests during token refresh
 * - Simplified validation caching (single cache, consistent duration)
 * - Better error handling and logging
 */

import { secureStorage } from '../utils/secureStorage'
import { jwtUtils } from '../utils/jwtUtils'

// Token refresh state management with request queuing
interface TokenRefreshState {
  isRefreshing: boolean
  refreshPromise: Promise<boolean> | null
  pendingRequests: Array<{
    resolve: (value: boolean) => void
    reject: (error: Error) => void
  }>
}

const refreshState: TokenRefreshState = {
  isRefreshing: false,
  refreshPromise: null,
  pendingRequests: [],
}

// Single validation cache for consistency
const VALIDATION_CACHE_DURATION = 3 * 60 * 1000 // 3 minutes
let lastValidationTime = 0
let lastValidationResult = false

export interface TokenPair {
  access: string
  refresh: string
}

export interface TokenRefreshResponse {
  access: string
  refresh: string
}

class TokenManager {
  /**
   * Get access token from secure storage
   */
  getAccessToken(): string | null {
    try {
      const token = secureStorage.getItem('access_token')

      if (token && !secureStorage.isValidTokenFormat(token)) {
        this.clearTokens()
        return null
      }

      return token
    } catch (error) {
      return null
    }
  }

  /**
   * Get refresh token from secure storage
   */
  getRefreshToken(): string | null {
    try {
      const token = secureStorage.getItem('refresh_token')

      if (token && !secureStorage.isValidTokenFormat(token)) {
        this.clearTokens()
        return null
      }

      return token
    } catch (error) {
      return null
    }
  }

  /**
   * Store both access and refresh tokens
   */
  setTokens(accessToken: string, refreshToken: string): void {
    if (
      !secureStorage.isValidTokenFormat(accessToken) ||
      !secureStorage.isValidTokenFormat(refreshToken)
    ) {
      return
    }

    secureStorage.setItem('access_token', accessToken)
    secureStorage.setItem('refresh_token', refreshToken)

    // Clear validation cache when new tokens are set
    this.clearValidationCache()
  }

  /**
   * Clear all tokens from storage
   */
  clearTokens(): void {
    secureStorage.removeItem('access_token')
    secureStorage.removeItem('refresh_token')
    this.clearValidationCache()
  }

  /**
   * Clear validation cache
   */
  clearValidationCache(): void {
    lastValidationTime = 0
    lastValidationResult = false
  }

  /**
   * Check if user is authenticated (has valid access token)
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken()
    if (!token) return false

    // Quick client-side expiration check
    const isExpired = jwtUtils.isTokenExpired(token)
    return isExpired !== true // null or false means potentially valid
  }

  /**
   * Check if token is expired or will expire soon
   * Used for proactive refresh decisions
   */
  shouldRefreshToken(minutesBeforeExpiry: number = 5): boolean {
    try {
      const accessToken = this.getAccessToken()

      if (!accessToken) {
        return false // No token to refresh
      }

      const isExpired = jwtUtils.isTokenExpired(accessToken)
      if (isExpired === true) {
        return true
      }

      const willExpireSoon = jwtUtils.willExpireSoon(accessToken, minutesBeforeExpiry)
      return willExpireSoon
    } catch (error) {
      return true // Assume refresh needed on error
    }
  }

  /**
   * Attempt to refresh the access token using the refresh token
   *
   * IMPROVEMENTS:
   * - Single refresh at a time (promise lock)
   * - Queues concurrent requests and resolves them all after refresh
   * - Better error handling and cleanup
   */
  async attemptTokenRefresh(
    refreshCallback: (refreshToken: string) => Promise<TokenRefreshResponse>
  ): Promise<boolean> {
    // If already refreshing, queue this request
    if (refreshState.isRefreshing && refreshState.refreshPromise) {
      return new Promise<boolean>((resolve, reject) => {
        refreshState.pendingRequests.push({ resolve, reject })
      })
    }

    // Start a new refresh
    refreshState.isRefreshing = true
    refreshState.refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken()
        if (!refreshToken) {
          this.clearTokens()
          this.rejectPendingRequests(new Error('No refresh token available'))
          return false
        }

        const response = await refreshCallback(refreshToken)

        if (response && response.access && response.refresh) {
          this.setTokens(response.access, response.refresh)

          // Resolve all pending requests
          this.resolvePendingRequests(true)
          return true
        }

        this.clearTokens()
        this.rejectPendingRequests(new Error('Invalid refresh response'))
        return false
      } catch (error) {
        this.clearTokens()
        this.rejectPendingRequests(error as Error)
        return false
      } finally {
        refreshState.isRefreshing = false
        refreshState.refreshPromise = null
      }
    })()

    return refreshState.refreshPromise
  }

  /**
   * Resolve all pending requests after successful refresh
   */
  private resolvePendingRequests(value: boolean): void {
    const pending = [...refreshState.pendingRequests]
    refreshState.pendingRequests = []

    pending.forEach(({ resolve }) => {
      resolve(value)
    })
  }

  /**
   * Reject all pending requests after failed refresh
   */
  private rejectPendingRequests(error: Error): void {
    const pending = [...refreshState.pendingRequests]
    refreshState.pendingRequests = []

    pending.forEach(({ reject }) => {
      reject(error)
    })
  }

  /**
   * Ensure token is valid (single source of truth for validation)
   *
   * IMPROVEMENTS:
   * - Single validation cache (3 minutes)
   * - Proactive refresh before expiry
   * - Better error handling
   * - Clear logging
   */
  async ensureValidToken(
    verifyCallback: (token: string) => Promise<boolean>,
    refreshCallback: (refreshToken: string) => Promise<TokenRefreshResponse>
  ): Promise<boolean> {
    try {
      const accessToken = this.getAccessToken()

      if (!accessToken) {
        return false
      }

      // Check validation cache first (reduce server load)
      const now = Date.now()
      const cacheAge = now - lastValidationTime
      if (cacheAge < VALIDATION_CACHE_DURATION && lastValidationResult) {
        return true
      }

      // Check if token is expired client-side
      const isExpired = jwtUtils.isTokenExpired(accessToken)

      if (isExpired === true) {
        const refreshSuccess = await this.attemptTokenRefresh(refreshCallback)

        lastValidationTime = now
        lastValidationResult = refreshSuccess
        return refreshSuccess
      }

      // Check if token will expire soon (proactive refresh)
      if (this.shouldRefreshToken(5)) {
        const refreshSuccess = await this.attemptTokenRefresh(refreshCallback)
        if (refreshSuccess) {
          lastValidationTime = now
          lastValidationResult = true
          return true
        }

        // Proactive refresh failed, verify current token is still usable
        try {
          const isStillValid = await verifyCallback(accessToken)
          lastValidationTime = now
          lastValidationResult = isStillValid
          return isStillValid
        } catch (verifyError) {
          lastValidationTime = now
          lastValidationResult = false
          return false
        }
      }

      // Token should be valid, update cache
      lastValidationTime = now
      lastValidationResult = true
      return true
    } catch (error) {
      lastValidationTime = Date.now()
      lastValidationResult = false
      return false
    }
  }

  /**
   * Get validation cache info (for debugging)
   */
  getValidationCacheInfo(): {
    lastValidationTime: number
    lastValidationResult: boolean
    cacheAge: number
    isValid: boolean
  } {
    const now = Date.now()
    const cacheAge = now - lastValidationTime

    return {
      lastValidationTime,
      lastValidationResult,
      cacheAge,
      isValid: cacheAge < VALIDATION_CACHE_DURATION && lastValidationResult,
    }
  }
}

export const tokenManager = new TokenManager()
