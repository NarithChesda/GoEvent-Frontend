import DOMPurify from 'dompurify'

/**
 * Sanitization profiles for different content types
 * These profiles define what HTML elements and attributes are allowed for each context
 */
export const SANITIZATION_PROFILES = {
  /**
   * For user comments - very restrictive, only basic formatting
   */
  COMMENT: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false
  },

  /**
   * For plain text - no HTML allowed at all
   */
  PLAIN_TEXT: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false
  },

  /**
   * For rich content like event descriptions - more permissive
   */
  RICH_CONTENT: {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false
  },

  /**
   * For URLs - sanitize but allow basic URL structure
   */
  URL: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false
  }
} as const

/**
 * Interface for sanitization options
 */
export interface SanitizeOptions {
  profile?: keyof typeof SANITIZATION_PROFILES
  maxLength?: number
  trimWhitespace?: boolean
  customConfig?: any
}

/**
 * Sanitizes HTML content using DOMPurify with predefined profiles
 * 
 * @param input - The content to sanitize
 * @param options - Sanitization options
 * @returns Sanitized content
 */
export function sanitizeHtml(input: string, options: SanitizeOptions = {}): string {
  if (typeof input !== 'string') {
    console.warn('sanitizeHtml: Input is not a string, converting to string')
    input = String(input)
  }

  // Early return for empty input
  if (!input || input.trim().length === 0) {
    return ''
  }

  const {
    profile = 'PLAIN_TEXT',
    maxLength = 5000,
    trimWhitespace = true,
    customConfig
  } = options

  // Get the sanitization profile
  const profileConfig = SANITIZATION_PROFILES[profile]

  // Create DOMPurify config
  const config: any = customConfig || {
    ALLOWED_TAGS: profileConfig.ALLOWED_TAGS,
    ALLOWED_ATTR: profileConfig.ALLOWED_ATTR,
    KEEP_CONTENT: profileConfig.KEEP_CONTENT,
    RETURN_DOM: profileConfig.RETURN_DOM
  }

  try {
    // Sanitize the content
    let sanitized = DOMPurify.sanitize(input, config) as string

    // Ensure we have a string (DOMPurify can return different types based on config)
    if (typeof sanitized !== 'string') {
      sanitized = String(sanitized)
    }

    // Trim whitespace if requested
    if (trimWhitespace) {
      sanitized = sanitized.trim()
    }

    // Enforce maximum length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength)
      
      // Try to cut at word boundary if possible
      const lastSpaceIndex = sanitized.lastIndexOf(' ')
      if (lastSpaceIndex > maxLength * 0.8) {
        sanitized = sanitized.substring(0, lastSpaceIndex) + '...'
      } else {
        sanitized = sanitized + '...'
      }
    }

    return sanitized

  } catch (error) {
    console.error('sanitizeHtml: Error during sanitization:', error)
    // Return empty string on error to prevent potential XSS
    return ''
  }
}

/**
 * Sanitizes user comment content specifically
 * This is a convenience wrapper for comment sanitization
 * 
 * @param comment - The comment text to sanitize
 * @param maxLength - Maximum allowed length (default: 500)
 * @returns Sanitized comment
 */
export function sanitizeComment(comment: string, maxLength = 500): string {
  return sanitizeHtml(comment, {
    profile: 'COMMENT',
    maxLength,
    trimWhitespace: true
  })
}

/**
 * Sanitizes plain text content (strips all HTML)
 * 
 * @param text - The text to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized plain text
 */
export function sanitizePlainText(text: string, maxLength = 1000): string {
  return sanitizeHtml(text, {
    profile: 'PLAIN_TEXT',
    maxLength,
    trimWhitespace: true
  })
}

/**
 * Sanitizes rich content like event descriptions
 * 
 * @param content - The rich content to sanitize
 * @param maxLength - Maximum allowed length (default: 5000)
 * @returns Sanitized rich content
 */
export function sanitizeRichContent(content: string, maxLength = 5000): string {
  return sanitizeHtml(content, {
    profile: 'RICH_CONTENT',
    maxLength,
    trimWhitespace: true
  })
}

/**
 * Validates and sanitizes user input
 * 
 * @param input - The input to validate and sanitize
 * @param options - Validation and sanitization options
 * @returns Object with sanitized content and validation result
 */
export interface ValidationResult {
  isValid: boolean
  sanitized: string
  errors: string[]
}

export function validateAndSanitize(
  input: string,
  options: SanitizeOptions & {
    required?: boolean
    minLength?: number
    pattern?: RegExp
    patternMessage?: string
  } = {}
): ValidationResult {
  const errors: string[] = []
  
  // Type check
  if (typeof input !== 'string') {
    input = String(input)
  }

  const {
    required = false,
    minLength = 0,
    maxLength = 5000,
    pattern,
    patternMessage = 'Input does not match required format',
    ...sanitizeOptions
  } = options

  // Required validation
  if (required && (!input || input.trim().length === 0)) {
    errors.push('This field is required')
  }

  // Sanitize first
  const sanitized = sanitizeHtml(input, sanitizeOptions)

  // Length validations (on sanitized content)
  if (minLength > 0 && sanitized.length < minLength) {
    errors.push(`Minimum length is ${minLength} characters`)
  }

  if (maxLength && sanitized.length > maxLength) {
    errors.push(`Maximum length is ${maxLength} characters`)
  }

  // Pattern validation (on sanitized content)
  if (pattern && !pattern.test(sanitized)) {
    errors.push(patternMessage)
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  }
}

/**
 * Utility to check if a string contains potentially malicious content
 * This is a basic check and should be used alongside proper sanitization
 * 
 * @param input - The input to check
 * @returns True if input appears to contain potentially malicious content
 */
export function containsSuspiciousContent(input: string): boolean {
  if (typeof input !== 'string') {
    return false
  }

  // Common XSS patterns (basic check)
  const suspiciousPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[\s\S]*?>/gi,
    /<object[\s\S]*?>/gi,
    /<embed[\s\S]*?>/gi,
    /data:\s*text\/html/gi,
    /vbscript:/gi
  ]

  return suspiciousPatterns.some(pattern => pattern.test(input))
}

/**
 * Batch sanitization for multiple inputs
 * Useful for sanitizing form data or API responses
 * 
 * @param inputs - Object with string values to sanitize
 * @param defaultOptions - Default sanitization options
 * @returns Object with sanitized values
 */
export function batchSanitize<T extends Record<string, string>>(
  inputs: T,
  defaultOptions: SanitizeOptions = { profile: 'PLAIN_TEXT' }
): T {
  const sanitized = {} as T

  for (const [key, value] of Object.entries(inputs)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeHtml(value, defaultOptions) as T[keyof T]
    } else {
      sanitized[key as keyof T] = value
    }
  }

  return sanitized
}

/**
 * Creates a sanitization validator for use in forms
 * Returns a validator function that can be used with form libraries
 * 
 * @param options - Sanitization and validation options
 * @returns Validator function
 */
export function createSanitizationValidator(
  options: SanitizeOptions & {
    required?: boolean
    minLength?: number
    pattern?: RegExp
    patternMessage?: string
  } = {}
) {
  return (value: string): string | null => {
    const result = validateAndSanitize(value, options)
    if (!result.isValid) {
      return result.errors[0] || 'Invalid input'
    }
    return null
  }
}