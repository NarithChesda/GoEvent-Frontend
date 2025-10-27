/**
 * JWT Token Utilities
 *
 * Provides utilities for parsing and validating JWT tokens client-side
 * without relying on external libraries.
 */

interface JWTPayload {
  exp?: number
  iat?: number
  jti?: string
  user_id?: number
  token_type?: string
  [key: string]: any
}

class JWTUtils {
  /**
   * Parse a JWT token and extract the payload
   */
  parseToken(token: string): JWTPayload | null {
    if (!token || typeof token !== 'string') {
      return null
    }

    try {
      // JWT format: header.payload.signature
      const parts = token.split('.')
      if (parts.length !== 3) {
        console.warn('Invalid JWT format: expected 3 parts')
        return null
      }

      // Decode the payload (second part)
      const payload = parts[1]

      // Add padding if needed for base64 decoding
      const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4)

      // Convert base64url to base64
      const base64 = paddedPayload.replace(/-/g, '+').replace(/_/g, '/')

      // Decode and parse JSON
      const decoded = atob(base64)
      const parsed = JSON.parse(decoded)

      return parsed as JWTPayload
    } catch (error) {
      console.error('Failed to parse JWT token:', error)
      return null
    }
  }

  /**
   * Check if a token is expired
   * Returns true if expired, false if still valid, null if cannot determine
   */
  isTokenExpired(token: string): boolean | null {
    const payload = this.parseToken(token)

    if (!payload || !payload.exp) {
      // Cannot determine expiration without exp claim
      return null
    }

    // JWT exp is in seconds, Date.now() is in milliseconds
    const expirationTime = payload.exp * 1000
    const now = Date.now()

    return now >= expirationTime
  }

  /**
   * Check if a token will expire within the specified minutes
   */
  willExpireSoon(token: string, minutesThreshold: number = 5): boolean {
    const payload = this.parseToken(token)

    if (!payload || !payload.exp) {
      // If we can't determine expiration, assume it might expire soon
      return true
    }

    const expirationTime = payload.exp * 1000
    const now = Date.now()
    const thresholdTime = now + (minutesThreshold * 60 * 1000)

    return thresholdTime >= expirationTime
  }

  /**
   * Get time remaining until token expires (in milliseconds)
   * Returns null if cannot determine
   */
  getTimeUntilExpiry(token: string): number | null {
    const payload = this.parseToken(token)

    if (!payload || !payload.exp) {
      return null
    }

    const expirationTime = payload.exp * 1000
    const now = Date.now()
    const remaining = expirationTime - now

    return remaining > 0 ? remaining : 0
  }

  /**
   * Get token expiration date
   */
  getExpirationDate(token: string): Date | null {
    const payload = this.parseToken(token)

    if (!payload || !payload.exp) {
      return null
    }

    return new Date(payload.exp * 1000)
  }

  /**
   * Get token issued date
   */
  getIssuedDate(token: string): Date | null {
    const payload = this.parseToken(token)

    if (!payload || !payload.iat) {
      return null
    }

    return new Date(payload.iat * 1000)
  }

  /**
   * Validate token format without parsing
   */
  isValidFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false
    }

    // Basic JWT format validation (3 parts separated by dots)
    const parts = token.split('.')
    if (parts.length !== 3) {
      return false
    }

    // Check if each part is valid base64
    try {
      parts.forEach((part) => {
        if (!part) throw new Error('Empty part')
        const padded = part + '='.repeat((4 - (part.length % 4)) % 4)
        atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
      })
      return true
    } catch {
      return false
    }
  }

  /**
   * Extract user ID from token
   */
  getUserId(token: string): number | null {
    const payload = this.parseToken(token)
    return payload?.user_id ?? null
  }
}

export const jwtUtils = new JWTUtils()
