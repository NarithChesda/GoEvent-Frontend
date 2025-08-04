/**
 * Input Validation and Sanitization Utility
 * 
 * Provides comprehensive input validation and XSS protection for forms
 */

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => boolean
  sanitize?: boolean
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedValue?: string
}

class InputValidator {
  /**
   * HTML entities for XSS protection
   */
  private readonly htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }

  /**
   * Dangerous patterns that should be blocked
   */
  private readonly dangerousPatterns: RegExp[] = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /data:text\/html/gi,
    /vbscript:/gi
  ]

  /**
   * Sanitize input by escaping HTML entities
   */
  sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') return ''
    
    return input.replace(/[&<>"'`=\/]/g, (match) => {
      return this.htmlEntities[match] || match
    })
  }

  /**
   * Check for dangerous patterns in input
   */
  containsDangerousContent(input: string): boolean {
    if (!input || typeof input !== 'string') return false
    
    return this.dangerousPatterns.some(pattern => pattern.test(input))
  }

  /**
   * Validate email format with additional security checks
   */
  validateEmail(email: string): ValidationResult {
    const errors: string[] = []
    
    if (!email || email.trim().length === 0) {
      errors.push('Email is required')
      return { isValid: false, errors }
    }

    // Check for dangerous content
    if (this.containsDangerousContent(email)) {
      errors.push('Email contains invalid characters')
      return { isValid: false, errors }
    }

    // RFC 5322 compliant email regex (simplified)
    const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    
    if (!emailPattern.test(email)) {
      errors.push('Please enter a valid email address')
    }

    if (email.length > 254) {
      errors.push('Email address is too long')
    }

    const sanitizedValue = this.sanitizeHtml(email.trim().toLowerCase())

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue
    }
  }

  /**
   * Validate password with security requirements
   */
  validatePassword(password: string, options: { isNewPassword?: boolean } = {}): ValidationResult {
    const errors: string[] = []
    
    if (!password) {
      errors.push('Password is required')
      return { isValid: false, errors }
    }

    // Check for dangerous content
    if (this.containsDangerousContent(password)) {
      errors.push('Password contains invalid characters')
      return { isValid: false, errors }
    }

    if (options.isNewPassword) {
      // Stronger requirements for new passwords
      if (password.length < 12) {
        errors.push('Password must be at least 12 characters long')
      }

      if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter')
      }

      if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter')
      }

      if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number')
      }

      if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
        errors.push('Password must contain at least one special character')
      }

      // Check for common patterns
      if (/(.)\1{2,}/.test(password)) {
        errors.push('Password cannot contain more than 2 consecutive identical characters')
      }

      if (/^(?:123|abc|qwe)/i.test(password)) {
        errors.push('Password cannot start with common sequences')
      }
    } else {
      // Basic requirements for login
      if (password.length < 6) {
        errors.push('Password must be at least 6 characters long')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: password // Don't sanitize passwords
    }
  }

  /**
   * Validate text input with configurable rules
   */
  validateText(input: string, rules: ValidationRule = {}): ValidationResult {
    const errors: string[] = []
    let sanitizedValue = input

    if (rules.required && (!input || input.trim().length === 0)) {
      errors.push('This field is required')
      return { isValid: false, errors }
    }

    if (input) {
      // Check for dangerous content
      if (this.containsDangerousContent(input)) {
        errors.push('Input contains invalid content')
        return { isValid: false, errors }
      }

      if (rules.minLength && input.length < rules.minLength) {
        errors.push(`Must be at least ${rules.minLength} characters long`)
      }

      if (rules.maxLength && input.length > rules.maxLength) {
        errors.push(`Must be no more than ${rules.maxLength} characters long`)
      }

      if (rules.pattern && !rules.pattern.test(input)) {
        errors.push('Invalid format')
      }

      if (rules.custom && !rules.custom(input)) {
        errors.push('Invalid input')
      }

      if (rules.sanitize !== false) {
        sanitizedValue = this.sanitizeHtml(input.trim())
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue
    }
  }

  /**
   * Calculate password strength score (0-4)
   */
  calculatePasswordStrength(password: string): { score: number; feedback: string[] } {
    if (!password) return { score: 0, feedback: ['Enter a password'] }

    let score = 0
    const feedback: string[] = []

    // Length check
    if (password.length >= 8) score++
    else feedback.push('Use at least 8 characters')

    if (password.length >= 12) score++

    // Character variety
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score++
    } else {
      feedback.push('Mix upper and lowercase letters')
    }

    if (/\d/.test(password)) {
      score++
    } else {
      feedback.push('Add numbers')
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score++
    } else {
      feedback.push('Add special characters')
    }

    // Deduct points for common patterns
    if (/(.)\1{2,}/.test(password)) {
      score = Math.max(0, score - 1)
      feedback.push('Avoid repeated characters')
    }

    if (/(?:123|abc|qwe|password)/i.test(password)) {
      score = Math.max(0, score - 1)
      feedback.push('Avoid common patterns')
    }

    return { score: Math.min(4, score), feedback }
  }

  /**
   * Validate form data with multiple fields
   */
  validateForm(formData: Record<string, any>, rules: Record<string, ValidationRule>): {
    isValid: boolean
    errors: Record<string, string[]>
    sanitizedData: Record<string, any>
  } {
    const errors: Record<string, string[]> = {}
    const sanitizedData: Record<string, any> = {}
    
    Object.keys(rules).forEach(field => {
      const value = formData[field]
      const rule = rules[field]
      
      let result: ValidationResult
      
      if (field === 'email') {
        result = this.validateEmail(value)
      } else if (field === 'password' || field.includes('password')) {
        result = this.validatePassword(value, { isNewPassword: field.includes('new') })
      } else {
        result = this.validateText(value, rule)
      }
      
      if (!result.isValid) {
        errors[field] = result.errors
      }
      
      sanitizedData[field] = result.sanitizedValue !== undefined ? result.sanitizedValue : value
    })
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData
    }
  }

  /**
   * Rate limiting helper for form submissions
   */
  private attemptCounts: Map<string, { count: number; lastAttempt: number }> = new Map()

  isRateLimited(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now()
    const attempts = this.attemptCounts.get(identifier)
    
    if (!attempts) {
      this.attemptCounts.set(identifier, { count: 1, lastAttempt: now })
      return false
    }
    
    // Reset if window has passed
    if (now - attempts.lastAttempt > windowMs) {
      this.attemptCounts.set(identifier, { count: 1, lastAttempt: now })
      return false
    }
    
    // Increment attempts
    attempts.count++
    attempts.lastAttempt = now
    
    return attempts.count > maxAttempts
  }

  /**
   * Clear rate limiting for an identifier
   */
  clearRateLimit(identifier: string): void {
    this.attemptCounts.delete(identifier)
  }
}

export const inputValidator = new InputValidator()

// Common validation rules
export const validationRules = {
  email: { required: true, sanitize: true },
  password: { required: true, sanitize: false },
  newPassword: { required: true, sanitize: false },
  confirmPassword: { required: true, sanitize: false },
  firstName: { maxLength: 50, sanitize: true },
  lastName: { maxLength: 50, sanitize: true },
  username: { required: true, minLength: 3, maxLength: 30, pattern: /^[a-zA-Z0-9_-]+$/, sanitize: true },
  bio: { maxLength: 500, sanitize: true }
}