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

/**
 * Thrown by a refresh callback when the server has *definitively* rejected the
 * refresh token — a 400/401 from `/api/auth/token/refresh/`.
 *
 * Everything else a refresh can fail with (a 5xx, a timeout, a dropped
 * connection, a backgrounded tab losing its request) is **transient**, and that
 * distinction is the whole point of this class: the session used to be thrown
 * away on any thrown error at all, so a phone that lost signal for a second
 * mid-refresh came back signed out. Only a rejection ends a session; anything
 * else leaves the tokens in place for the next request to retry.
 */
export class TokenRejectedError extends Error {
  constructor(message = 'Refresh token rejected by server') {
    super(message)
    this.name = 'TokenRejectedError'
  }
}

/**
 * Broadcast once when a session is definitively over, so the app can drop its
 * signed-in shell and send the user to sign-in with a redirect back. Without it
 * storage was emptied underneath a Pinia store that went on rendering a
 * signed-in user until the next full reload.
 */
export const SESSION_EXPIRED_EVENT = 'goevent:session-expired'

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
    } catch {
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
    } catch {
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
   * End the session for good: drop the tokens and the cached user, then say so
   * once, so the app can clear its signed-in shell and route to sign-in with a
   * redirect back instead of leaving a Pinia store rendering a user whose
   * storage has already been emptied.
   *
   * Called only where the server has definitively rejected the session — never
   * on a transient failure. Deliberately idempotent: the refresh queue can hit
   * this from several callers at once.
   */
  endSession(): void {
    const hadSomething = !!(secureStorage.getItem('access_token') || secureStorage.getItem('user'))

    this.clearTokens()
    secureStorage.removeItem('user')

    if (hadSomething && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
    }
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
   * Is the refresh token still usable? Present, well formed, and not past its
   * own `exp`. A token with no `exp` claim cannot be judged here, so it counts
   * as usable and the server decides.
   */
  private isRefreshTokenUsable(): boolean {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) return false
    return jwtUtils.isTokenExpired(refreshToken) !== true
  }

  /**
   * **Is there a session at all?** — which is a different question from
   * `isAuthenticated()`, and the one every gate in the app actually wants.
   *
   * The access token lives 60 minutes and the refresh token 24 hours, so for
   * 23 of every 24 hours a perfectly good session has a dead access token in
   * storage. Asking `isAuthenticated()` there answers "no" and the caller signs
   * the user out — which is exactly how someone who spent an hour setting up an
   * event, paid, and then reloaded the page to see the confirmation got thrown
   * back to the sign-in screen with 23 hours of session left.
   *
   * An expired access token is a **recoverable** state: ApiClient refreshes and
   * retries on a 401 by itself. So a session stands while *either* token can
   * still get a request through.
   */
  hasSession(): boolean {
    return this.isAuthenticated() || this.isRefreshTokenUsable()
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
    } catch {
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
          this.endSession()
          this.rejectPendingRequests(new Error('No refresh token available'))
          return false
        }

        let response: TokenRefreshResponse
        try {
          response = await refreshCallback(refreshToken)
        } catch (error) {
          /*
           * The backend runs ROTATE_REFRESH_TOKENS with BLACKLIST_AFTER_ROTATION,
           * so the instant any other tab refreshes, the token this call is
           * holding is blacklisted — and a rejection here proves nothing about
           * the session. Two tabs is not an edge case in this app: signing in
           * with Telegram opens the deep link with `window.open(_, '_blank')`,
           * so a phone routinely ends up with the original tab and a second one
           * both polling notifications and both refreshing on the same hour.
           *
           * Re-read storage: if a sibling tab has since written a different
           * pair, use it rather than declaring the session over.
           */
          const rotated = this.getRefreshToken()
          if (error instanceof TokenRejectedError && rotated && rotated !== refreshToken) {
            response = await refreshCallback(rotated)
          } else {
            throw error
          }
        }

        if (response && response.access && response.refresh) {
          this.setTokens(response.access, response.refresh)

          // Resolve all pending requests
          this.resolvePendingRequests(true)
          return true
        }

        // A 200 carrying junk is a server contract violation, not a verdict on
        // this session — leave the tokens alone and let the next call retry.
        this.rejectPendingRequests(new Error('Invalid refresh response'))
        return false
      } catch (error) {
        // Only a definitive rejection ends the session. A 5xx, a timeout, a
        // dropped mobile connection: the tokens stay put and the next request
        // tries again.
        if (error instanceof TokenRejectedError) {
          this.endSession()
        }
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
        // No access token but a live refresh token is a recoverable state, not
        // a signed-out one — storage holds the pair independently, and every
        // rotation rewrites both.
        if (this.isRefreshTokenUsable()) {
          return await this.attemptTokenRefresh(refreshCallback)
        }
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
        } catch {
          lastValidationTime = now
          lastValidationResult = false
          return false
        }
      }

      // Token should be valid, update cache
      lastValidationTime = now
      lastValidationResult = true
      return true
    } catch {
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
