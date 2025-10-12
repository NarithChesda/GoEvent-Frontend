/**
 * Secure Storage Utility
 *
 * Provides a secure storage mechanism for sensitive data like JWT tokens.
 * Falls back to localStorage for backward compatibility but adds security layers.
 */

interface StorageData {
  value: string
  timestamp: number
  checksum?: string
}

class SecureStorage {
  private readonly storagePrefix = 'goevent_secure_v2_' // Version bump to force migration from unstable fingerprint
  private readonly checksumKey = 'storage_integrity'
  private readonly isDevelopment =
    import.meta.env.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  private isLogoutInProgress = false // Flag to prevent migration during logout

  /**
   * Log development messages only in development mode
   */
  private devLog(level: 'info' | 'warn' | 'error', message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console[level](`[SecureStorage] ${message}`, ...args)
    }
  }

  /**
   * Generate a simple checksum for data integrity verification
   */
  private generateChecksum(data: string): string {
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Encrypt data using a simple XOR cipher with browser fingerprint
   */
  private encrypt(data: string): string {
    // Create a simple browser fingerprint for XOR key
    const fingerprint = this.getBrowserFingerprint()
    let encrypted = ''

    for (let i = 0; i < data.length; i++) {
      const dataChar = data.charCodeAt(i)
      const keyChar = fingerprint.charCodeAt(i % fingerprint.length)
      encrypted += String.fromCharCode(dataChar ^ keyChar)
    }

    return btoa(encrypted) // Base64 encode
  }

  /**
   * Decrypt data using the XOR cipher with current fingerprint
   */
  private decrypt(encryptedData: string): string {
    try {
      const fingerprint = this.getBrowserFingerprint()
      const data = atob(encryptedData) // Base64 decode
      let decrypted = ''

      for (let i = 0; i < data.length; i++) {
        const dataChar = data.charCodeAt(i)
        const keyChar = fingerprint.charCodeAt(i % fingerprint.length)
        decrypted += String.fromCharCode(dataChar ^ keyChar)
      }

      return decrypted
    } catch (error) {
      if (this.isDevelopment) {
        console.warn('Decryption failed with current fingerprint:', error)
      }
      return ''
    }
  }

  /**
   * Attempt to decrypt with legacy fingerprint for backward compatibility
   */
  private decryptWithLegacyFingerprint(encryptedData: string): string {
    try {
      const fingerprint = this.getLegacyBrowserFingerprint()
      const data = atob(encryptedData) // Base64 decode
      let decrypted = ''

      for (let i = 0; i < data.length; i++) {
        const dataChar = data.charCodeAt(i)
        const keyChar = fingerprint.charCodeAt(i % fingerprint.length)
        decrypted += String.fromCharCode(dataChar ^ keyChar)
      }

      return decrypted
    } catch (error) {
      if (this.isDevelopment) {
        console.warn('Legacy decryption also failed:', error)
      }
      return ''
    }
  }

  /**
   * Generate a browser fingerprint for encryption
   * Uses stable characteristics only to prevent integrity check failures during development
   */
  private getBrowserFingerprint(): string {
    if (this.isDevelopment) {
      // Use static fingerprint in development to prevent window resize/zoom issues
      const devFingerprint = [
        'development-mode',
        navigator.language || 'en-US',
        'stable-dev-key-v2',
      ].join('|')
      return this.generateChecksum(devFingerprint)
    }

    // Production fingerprint with truly stable characteristics only
    const fingerprint = [
      navigator.userAgent || 'unknown',
      navigator.language || 'en-US',
      navigator.platform || 'unknown',
      'stable-goevent-key-v2', // Version bump to force migration
    ].join('|')

    return this.generateChecksum(fingerprint)
  }

  /**
   * Generate legacy browser fingerprint for fallback decryption
   */
  private getLegacyBrowserFingerprint(): string {
    // Legacy fingerprint that includes screen dimensions (for backward compatibility)
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      'stable-goevent-key',
    ].join('|')

    return this.generateChecksum(fingerprint)
  }

  /**
   * Store data securely with encryption and integrity checking
   */
  setItem(key: string, value: string): void {
    // Prevent storage operations during logout (except for clearing operations)
    if (this.isLogoutInProgress) {
      this.devLog(
        'warn',
        `Attempted to store data during logout for key: ${key} - operation blocked`,
      )
      return
    }

    if (!value || typeof value !== 'string') {
      this.devLog('warn', `Attempting to store invalid value for key ${key}:`, typeof value)
      return
    }

    try {
      const encrypted = this.encrypt(value)
      if (!encrypted) {
        this.devLog('error', `Failed to encrypt value for key ${key}`)
        throw new Error('Encryption failed')
      }

      const storageData: StorageData = {
        value: encrypted,
        timestamp: Date.now(),
        checksum: this.generateChecksum(value),
      }

      const serialized = JSON.stringify(storageData)
      localStorage.setItem(this.storagePrefix + key, serialized)

      // this.devLog('info', `Successfully stored encrypted data for key: ${key}`)
    } catch (error) {
      console.error('Failed to store data securely:', error)

      // Fallback to regular localStorage for backward compatibility
      try {
        localStorage.setItem(key, value)
        this.devLog('warn', `Fell back to regular localStorage for key: ${key}`)
      } catch (fallbackError) {
        console.error('Even fallback storage failed:', fallbackError)
        throw new Error(`Failed to store data for key ${key}: ${fallbackError}`)
      }
    }
  }

  /**
   * Set logout mode to prevent interfering operations
   */
  setLogoutMode(isLogout: boolean): void {
    this.isLogoutInProgress = isLogout
  }

  /**
   * Get item directly from storage without any migrations or processing
   * Used during logout to prevent token corruption
   */
  getItemDirect(key: string): string | null {
    try {
      // Try secure storage first (v2)
      const secureData = localStorage.getItem(this.storagePrefix + key)
      if (secureData) {
        try {
          const parsed: StorageData = JSON.parse(secureData)
          const decrypted = this.decrypt(parsed.value)

          // Verify integrity with current fingerprint
          if (parsed.checksum && this.generateChecksum(decrypted) === parsed.checksum) {
            return decrypted
          }

          // Try legacy decryption as fallback without migration
          const legacyDecrypted = this.decryptWithLegacyFingerprint(parsed.value)
          if (
            legacyDecrypted &&
            parsed.checksum &&
            this.generateChecksum(legacyDecrypted) === parsed.checksum
          ) {
            return legacyDecrypted
          }
        } catch {
          // Silent error handling for direct access
        }
      }

      // Try legacy secure storage (v1) without migration
      const legacySecureData = localStorage.getItem('goevent_secure_' + key)
      if (legacySecureData) {
        try {
          const parsed: StorageData = JSON.parse(legacySecureData)
          const legacyDecrypted = this.decryptWithLegacyFingerprint(parsed.value)

          if (
            legacyDecrypted &&
            (!parsed.checksum || this.generateChecksum(legacyDecrypted) === parsed.checksum)
          ) {
            return legacyDecrypted
          }
        } catch {
          // Silent error handling for direct access
        }
      }

      // Fallback to regular localStorage without migration
      return localStorage.getItem(key)
    } catch {
      // Silent error handling for direct access
      return localStorage.getItem(key)
    }
  }

  /**
   * Retrieve and decrypt stored data with non-destructive integrity verification
   */
  getItem(key: string): string | null {
    // If logout is in progress, use direct retrieval to avoid any migrations
    if (this.isLogoutInProgress) {
      return this.getItemDirect(key)
    }

    try {
      // Try secure storage first (v2)
      const secureData = localStorage.getItem(this.storagePrefix + key)
      if (secureData) {
        try {
          const parsed: StorageData = JSON.parse(secureData)
          const decrypted = this.decrypt(parsed.value)

          // Verify integrity with current fingerprint
          if (parsed.checksum && this.generateChecksum(decrypted) === parsed.checksum) {
            return decrypted
          }

          if (this.isDevelopment) {
            console.warn(
              'Data integrity check failed with current fingerprint, attempting legacy decryption',
            )
          }

          // Try legacy decryption as fallback
          const legacyDecrypted = this.decryptWithLegacyFingerprint(parsed.value)
          if (
            legacyDecrypted &&
            parsed.checksum &&
            this.generateChecksum(legacyDecrypted) === parsed.checksum
          ) {
            if (this.isDevelopment) {
              console.info(
                'Successfully decrypted with legacy fingerprint, migrating to new format',
              )
            }
            // Re-encrypt with current fingerprint and save (unless logout is in progress)
            if (!this.isLogoutInProgress) {
              this.setItem(key, legacyDecrypted)
            }
            return legacyDecrypted
          }

          if (this.isDevelopment) {
            console.warn('Both current and legacy decryption failed, data may be corrupted')
          }
        } catch {
          if (this.isDevelopment) {
            console.warn('Failed to parse secure storage data')
          }
        }
      }

      // Try legacy secure storage (v1)
      const legacySecureData = localStorage.getItem('goevent_secure_' + key)
      if (legacySecureData) {
        try {
          const parsed: StorageData = JSON.parse(legacySecureData)
          const legacyDecrypted = this.decryptWithLegacyFingerprint(parsed.value)

          if (
            legacyDecrypted &&
            (!parsed.checksum || this.generateChecksum(legacyDecrypted) === parsed.checksum)
          ) {
            if (this.isDevelopment) {
              console.info('Migrating from legacy secure storage to v2')
            }
            // Migrate to new format (unless logout is in progress)
            if (!this.isLogoutInProgress) {
              this.setItem(key, legacyDecrypted)
              localStorage.removeItem('goevent_secure_' + key)
            }
            return legacyDecrypted
          }
        } catch {
          if (this.isDevelopment) {
            console.warn('Failed to parse legacy secure storage data')
          }
        }
      }

      // Fallback to regular localStorage for backward compatibility
      const regularData = localStorage.getItem(key)
      if (regularData) {
        if (this.isDevelopment) {
          console.info('Found data in regular localStorage, migrating to secure storage')
        }
        // Migrate to secure storage (unless logout is in progress)
        if (!this.isLogoutInProgress) {
          this.setItem(key, regularData)
          localStorage.removeItem(key)
        }
        return regularData
      }

      return null
    } catch (error) {
      console.error('Critical error in secure storage retrieval:', error)
      // Final fallback to regular localStorage
      return localStorage.getItem(key)
    }
  }

  /**
   * Remove item from secure storage (including all versions)
   */
  removeItem(key: string): void {
    // Remove current version (v2)
    localStorage.removeItem(this.storagePrefix + key)
    // Remove legacy version (v1)
    localStorage.removeItem('goevent_secure_' + key)
    // Remove plain localStorage as well
    localStorage.removeItem(key)
  }

  /**
   * Check if an item exists in secure storage (any version)
   */
  hasItem(key: string): boolean {
    return (
      localStorage.getItem(this.storagePrefix + key) !== null ||
      localStorage.getItem('goevent_secure_' + key) !== null ||
      localStorage.getItem(key) !== null
    )
  }

  /**
   * Migrate existing localStorage data to secure storage
   */
  migrateToSecureStorage(keys: string[]): void {
    keys.forEach((key) => {
      const existingValue = localStorage.getItem(key)
      if (existingValue && !localStorage.getItem(this.storagePrefix + key)) {
        this.setItem(key, existingValue)
        localStorage.removeItem(key) // Remove legacy storage
      }
    })
  }

  /**
   * Clear all secure storage data (all versions)
   */
  clear(): void {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(this.storagePrefix) || key.startsWith('goevent_secure_')) {
        localStorage.removeItem(key)
      }
    })
  }

  /**
   * Safely clear corrupted data for specific keys
   */
  clearCorruptedData(keys: string[]): void {
    keys.forEach((key) => {
      try {
        this.removeItem(key)
        if (this.isDevelopment) {
          console.info(`Cleared potentially corrupted data for key: ${key}`)
        }
      } catch (error) {
        console.error(`Failed to clear corrupted data for key ${key}:`, error)
      }
    })
  }

  /**
   * Validate token without parsing JWT client-side
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
}

export const secureStorage = new SecureStorage()
