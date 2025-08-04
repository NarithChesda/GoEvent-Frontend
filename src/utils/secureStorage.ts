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
  private readonly storagePrefix = 'goevent_secure_'
  private readonly checksumKey = 'storage_integrity'

  /**
   * Generate a simple checksum for data integrity verification
   */
  private generateChecksum(data: string): string {
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
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
   * Decrypt data using the same XOR cipher
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
      console.warn('Failed to decrypt data, possible tampering detected')
      return ''
    }
  }

  /**
   * Generate a simple browser fingerprint for encryption
   */
  private getBrowserFingerprint(): string {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('GoEvent Security', 2, 2)
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      canvas.toDataURL()
    ].join('|')
    
    return this.generateChecksum(fingerprint)
  }

  /**
   * Store data securely with encryption and integrity checking
   */
  setItem(key: string, value: string): void {
    try {
      const storageData: StorageData = {
        value: this.encrypt(value),
        timestamp: Date.now(),
        checksum: this.generateChecksum(value)
      }
      
      localStorage.setItem(
        this.storagePrefix + key, 
        JSON.stringify(storageData)
      )
    } catch (error) {
      console.error('Failed to store data securely:', error)
      // Fallback to regular localStorage for backward compatibility
      localStorage.setItem(key, value)
    }
  }

  /**
   * Retrieve and decrypt stored data with integrity verification
   */
  getItem(key: string): string | null {
    try {
      // Try secure storage first
      const secureData = localStorage.getItem(this.storagePrefix + key)
      if (secureData) {
        const parsed: StorageData = JSON.parse(secureData)
        const decrypted = this.decrypt(parsed.value)
        
        // Verify integrity
        if (parsed.checksum && this.generateChecksum(decrypted) !== parsed.checksum) {
          console.warn('Data integrity check failed, possible tampering detected')
          this.removeItem(key)
          return null
        }
        
        return decrypted
      }
      
      // Fallback to regular localStorage for backward compatibility
      return localStorage.getItem(key)
    } catch (error) {
      console.warn('Failed to retrieve secure data:', error)
      // Fallback to regular localStorage
      return localStorage.getItem(key)
    }
  }

  /**
   * Remove item from secure storage
   */
  removeItem(key: string): void {
    localStorage.removeItem(this.storagePrefix + key)
    localStorage.removeItem(key) // Also remove legacy storage
  }

  /**
   * Check if an item exists in secure storage
   */
  hasItem(key: string): boolean {
    return localStorage.getItem(this.storagePrefix + key) !== null || 
           localStorage.getItem(key) !== null
  }

  /**
   * Migrate existing localStorage data to secure storage
   */
  migrateToSecureStorage(keys: string[]): void {
    keys.forEach(key => {
      const existingValue = localStorage.getItem(key)
      if (existingValue && !localStorage.getItem(this.storagePrefix + key)) {
        this.setItem(key, existingValue)
        localStorage.removeItem(key) // Remove legacy storage
      }
    })
  }

  /**
   * Clear all secure storage data
   */
  clear(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.storagePrefix)) {
        localStorage.removeItem(key)
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
      parts.forEach(part => {
        if (!part) throw new Error('Empty part')
        // Add padding if needed
        const padded = part + '='.repeat((4 - part.length % 4) % 4)
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