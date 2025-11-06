/**
 * Secure Storage Utility
 *
 * Provides a simplified, reliable storage mechanism for JWT tokens.
 *
 * SECURITY NOTE:
 * - Tokens are stored in localStorage without client-side encryption
 * - Client-side encryption provides minimal security benefit against XSS
 * - If XSS exists, attacker can access tokens regardless of encryption
 * - Focus is on preventing XSS through CSP, sanitization, and secure coding
 * - For production, consider httpOnly cookies as a more secure alternative
 *
 * DESIGN DECISIONS:
 * - Removed XOR encryption (unstable fingerprinting caused token corruption)
 * - Removed automatic migration during retrieval (caused race conditions)
 * - Simple, reliable storage with explicit migration on app startup only
 * - No operations blocked during logout - simplified lifecycle
 */

interface StorageData {
  value: string
  timestamp: number
  version: string
}

class SecureStorage {
  private readonly storagePrefix = 'goevent_v3_'
  private readonly storageVersion = '3.0'
  private readonly isDevelopment =
    import.meta.env.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'

  /**
   * Log development messages only in development mode
   */
  private devLog(level: 'info' | 'warn' | 'error', message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console[level](`[SecureStorage] ${message}`, ...args)
    }
  }

  /**
   * Store data in localStorage with versioning
   */
  setItem(key: string, value: string): void {
    if (!value || typeof value !== 'string') {
      this.devLog('warn', `Attempting to store invalid value for key ${key}:`, typeof value)
      return
    }

    try {
      const storageData: StorageData = {
        value: value,
        timestamp: Date.now(),
        version: this.storageVersion,
      }

      const serialized = JSON.stringify(storageData)
      localStorage.setItem(this.storagePrefix + key, serialized)
    } catch (error) {
      console.error('Failed to store data:', error)
      // Fallback to direct storage
      try {
        localStorage.setItem(this.storagePrefix + key, value)
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError)
        throw new Error(`Failed to store data for key ${key}`)
      }
    }
  }

  /**
   * Retrieve data from localStorage
   * NO automatic migration - keeps retrieval simple and predictable
   */
  getItem(key: string): string | null {
    try {
      // Try v3 storage first (current version)
      const v3Data = localStorage.getItem(this.storagePrefix + key)
      if (v3Data) {
        try {
          const parsed: StorageData = JSON.parse(v3Data)
          if (parsed.value) {
            return parsed.value
          }
        } catch {
          // If parsing fails, treat as plain string
          return v3Data
        }
      }

      // Try legacy storage formats (v2, v1, plain) WITHOUT automatic migration
      // Migration should only happen explicitly via migrateFromLegacyStorage()
      const legacyData = this.getLegacyData(key)
      if (legacyData) {
        this.devLog(
          'warn',
          `Found legacy data for key ${key}. Run migrateFromLegacyStorage() to migrate.`
        )
        return legacyData
      }

      return null
    } catch (error) {
      console.error('Critical error in storage retrieval:', error)
      return null
    }
  }

  /**
   * Try to retrieve data from legacy storage formats (v2, v1, plain)
   * Does NOT migrate automatically - only retrieves
   */
  private getLegacyData(key: string): string | null {
    // Try v2 format (with encryption that we're removing)
    const v2Keys = [`goevent_secure_v2_${key}`, `goevent_secure_${key}`]
    for (const legacyKey of v2Keys) {
      const data = localStorage.getItem(legacyKey)
      if (data) {
        try {
          const parsed = JSON.parse(data)
          // V2 had encrypted data - we'll try to use it as-is
          // In practice, this means users will need to re-login after migration
          if (parsed.value) {
            this.devLog('info', `Found v2 data for ${key}, but cannot decrypt. User needs to re-login.`)
            return null // Force re-login for encrypted data
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    // Try plain localStorage
    const plainData = localStorage.getItem(key)
    if (plainData) {
      return plainData
    }

    return null
  }

  /**
   * Remove item from storage (all versions)
   */
  removeItem(key: string): void {
    // Remove current version
    localStorage.removeItem(this.storagePrefix + key)

    // Remove legacy versions
    localStorage.removeItem(`goevent_secure_v2_${key}`)
    localStorage.removeItem(`goevent_secure_${key}`)
    localStorage.removeItem(key)
  }

  /**
   * Check if an item exists in storage
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null
  }

  /**
   * Migrate data from legacy storage formats
   * Should be called explicitly on app startup, NOT during every retrieval
   */
  migrateFromLegacyStorage(keys: string[]): void {
    keys.forEach((key) => {
      // Check if already in v3 format
      if (localStorage.getItem(this.storagePrefix + key)) {
        return // Already migrated
      }

      // Try plain localStorage (most reliable for migration)
      const plainData = localStorage.getItem(key)
      if (plainData) {
        this.devLog('info', `Migrating plain localStorage for key: ${key}`)
        this.setItem(key, plainData)
        localStorage.removeItem(key)
        return
      }

      // For v2 encrypted data, we cannot reliably decrypt
      // User will need to re-login
      const v2Data =
        localStorage.getItem(`goevent_secure_v2_${key}`) ||
        localStorage.getItem(`goevent_secure_${key}`)

      if (v2Data) {
        this.devLog(
          'warn',
          `Found encrypted v2 data for ${key}, cannot migrate. User needs to re-login.`
        )
        // Clean up legacy storage
        localStorage.removeItem(`goevent_secure_v2_${key}`)
        localStorage.removeItem(`goevent_secure_${key}`)
      }
    })
  }

  /**
   * Clear all storage data (current and legacy versions)
   */
  clear(): void {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (
        key.startsWith(this.storagePrefix) ||
        key.startsWith('goevent_secure_v2_') ||
        key.startsWith('goevent_secure_')
      ) {
        localStorage.removeItem(key)
      }
    })
  }

  /**
   * Clear potentially corrupted data for specific keys
   */
  clearCorruptedData(keys: string[]): void {
    keys.forEach((key) => {
      try {
        this.removeItem(key)
        this.devLog('info', `Cleared potentially corrupted data for key: ${key}`)
      } catch (error) {
        console.error(`Failed to clear corrupted data for key ${key}:`, error)
      }
    })
  }

  /**
   * Validate token format (basic JWT structure check)
   */
  isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') return false

    // Basic JWT format validation (3 parts separated by dots)
    const parts = token.split('.')
    if (parts.length !== 3) return false

    // Check if each part is valid base64
    try {
      parts.forEach((part) => {
        if (!part) throw new Error('Empty part')
        // Add padding if needed
        const padded = part + '='.repeat((4 - (part.length % 4)) % 4)
        atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
      })
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if storage is available and working
   */
  isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__'
      const testValue = 'test'
      localStorage.setItem(testKey, testValue)
      const retrieved = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)
      return retrieved === testValue
    } catch {
      return false
    }
  }

  /**
   * DEPRECATED: Kept for backward compatibility
   * Migration no longer happens automatically - call migrateFromLegacyStorage() instead
   */
  migrateToSecureStorage(keys: string[]): void {
    this.migrateFromLegacyStorage(keys)
  }
}

export const secureStorage = new SecureStorage()
