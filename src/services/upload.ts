import { apiService, type ApiResponse } from './api'
import { secureStorage } from '../utils/secureStorage'
import type { User } from './auth'

export interface UploadResponse {
  url?: string
  profile_picture?: string
  message?: string
  user?: User
  id?: number
  email?: string
  [key: string]: any // Allow additional user fields
}

class UploadService {
  async uploadProfilePicture(file: File): Promise<ApiResponse<UploadResponse>> {
    try {
      // Comprehensive file validation
      const validation = await this.validateImageFile(file)
      if (!validation.valid) {
        return {
          success: false,
          message: validation.error || 'File validation failed',
        }
      }

      // Rate limiting for uploads
      const clientId = navigator.userAgent + window.location.hostname
      if (this.isUploadRateLimited(clientId)) {
        return {
          success: false,
          message: 'Too many upload attempts. Please wait before trying again.',
        }
      }

      // Sanitize file name
      const sanitizedFileName = this.sanitizeFileName(file.name)

      // Create new file with sanitized name
      const sanitizedFile = new File([file], sanitizedFileName, {
        type: file.type,
        lastModified: file.lastModified,
      })

      const formData = new FormData()
      formData.append('profile_picture', sanitizedFile)

      // Get secure token
      const accessToken = secureStorage.getItem('access_token')
      if (!accessToken) {
        return {
          success: false,
          message: 'Authentication required',
        }
      }

      // Make secure request with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}/api/auth/profile/`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Requested-With': 'XMLHttpRequest', // CSRF protection
          },
          body: formData,
          signal: controller.signal,
        },
      )

      clearTimeout(timeoutId)

      const contentType = response.headers.get('content-type')
      const isJson = contentType?.includes('application/json')

      try {
        const data = isJson ? await response.json() : await response.text()

        if (!response.ok) {
          // Log rate limiting attempt
          this.recordUploadAttempt(clientId)

          return {
            success: false,
            message: data.detail || data.message || 'Upload failed',
            errors: data.errors || data,
          }
        }

        // Clear rate limiting on successful upload
        this.clearUploadRateLimit(clientId)

        return {
          success: true,
          data,
        }
      } catch (error) {
        return {
          success: false,
          message: 'Invalid server response format',
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: 'Upload timeout. Please try again.',
        }
      }

      return {
        success: false,
        message: 'Network error during upload',
      }
    }
  }

  /**
   * Rate limiting for file uploads
   */
  private uploadAttempts: Map<string, { count: number; lastAttempt: number }> = new Map()

  private isUploadRateLimited(identifier: string): boolean {
    const now = Date.now()
    const attempts = this.uploadAttempts.get(identifier)
    const maxAttempts = 5
    const windowMs = 10 * 60 * 1000 // 10 minutes

    if (!attempts) return false

    // Reset if window has passed
    if (now - attempts.lastAttempt > windowMs) {
      this.uploadAttempts.delete(identifier)
      return false
    }

    return attempts.count >= maxAttempts
  }

  private recordUploadAttempt(identifier: string): void {
    const now = Date.now()
    const attempts = this.uploadAttempts.get(identifier)

    if (attempts) {
      attempts.count++
      attempts.lastAttempt = now
    } else {
      this.uploadAttempts.set(identifier, { count: 1, lastAttempt: now })
    }
  }

  private clearUploadRateLimit(identifier: string): void {
    this.uploadAttempts.delete(identifier)
  }

  /**
   * Enhanced file validation with security checks
   */
  async validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
    // Basic file object validation
    if (!file || !(file instanceof File)) {
      return {
        valid: false,
        error: 'Invalid file object',
      }
    }

    // Check file name for malicious patterns
    const fileName = file.name.toLowerCase()
    const dangerousExtensions = [
      '.exe',
      '.bat',
      '.cmd',
      '.com',
      '.pif',
      '.scr',
      '.vbs',
      '.js',
      '.jar',
      '.php',
      '.asp',
      '.jsp',
    ]
    const hasDangerousExtension = dangerousExtensions.some((ext) => fileName.includes(ext))

    if (hasDangerousExtension) {
      return {
        valid: false,
        error: 'File type not allowed for security reasons',
      }
    }

    // Strict MIME type validation
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif',
    ]

    if (!allowedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Please select a valid image file (JPEG, PNG, GIF, WebP, or AVIF)',
      }
    }

    // File extension validation (double-check)
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()

    if (!allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: 'File extension does not match allowed image types',
      }
    }

    // File size validation with stricter limits
    const maxSize = 3 * 1024 * 1024 // Reduced to 3MB for better security
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size must be less than 3MB',
      }
    }

    // Minimum file size check (prevent empty files)
    if (file.size < 100) {
      return {
        valid: false,
        error: 'File appears to be corrupted or empty',
      }
    }

    // Magic number validation (file signature check)
    try {
      const magicNumberValid = await this.validateMagicNumber(file)
      if (!magicNumberValid) {
        return {
          valid: false,
          error: 'File content does not match its declared type',
        }
      }
    } catch (error) {
      console.warn('Magic number validation failed:', error)
      // Continue with other validations if magic number check fails
    }

    // Check for suspicious file names
    const suspiciousPatterns = [
      /[\x00-\x1f\x7f-\x9f]/g, // Control characters
      /[<>:"|?*]/g, // Windows reserved characters
      /^\./g, // Hidden files
      /\s{2,}/g, // Multiple spaces
      /\.{2,}/g, // Multiple dots
    ]

    const hasSuspiciousPattern = suspiciousPatterns.some((pattern) => pattern.test(fileName))
    if (hasSuspiciousPattern) {
      return {
        valid: false,
        error: 'File name contains invalid characters',
      }
    }

    return { valid: true }
  }

  /**
   * Validate file magic numbers (file signatures)
   */
  private async validateMagicNumber(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const arr = new Uint8Array(e.target?.result as ArrayBuffer)
          const header = Array.from(arr.slice(0, 8))
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('')

          // Known magic numbers for image types
          const magicNumbers = {
            ffd8ff: 'jpeg', // JPEG
            '89504e47': 'png', // PNG
            '47494638': 'gif', // GIF
            '52494646': 'webp', // WebP (RIFF container)
            '0000001c667479706176696600': 'avif', // AVIF (partial)
          }

          // Check if header matches any known image magic number
          const isValidImage = Object.keys(magicNumbers).some((magic) =>
            header.startsWith(magic.toLowerCase()),
          )

          resolve(isValidImage)
        } catch (error) {
          console.warn('Failed to read file magic number:', error)
          resolve(false)
        }
      }

      reader.onerror = () => resolve(false)

      // Read first 12 bytes for magic number check
      const blob = file.slice(0, 12)
      reader.readAsArrayBuffer(blob)
    })
  }

  /**
   * Sanitize file name to prevent path traversal and other attacks
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^\w\s.-]/g, '') // Remove special chars except word chars, spaces, dots, hyphens
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
      .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
      .substring(0, 100) // Limit length
  }
}

export const uploadService = new UploadService()
