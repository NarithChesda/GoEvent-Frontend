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
    RETURN_DOM: false,
  },

  /**
   * For plain text - no HTML allowed at all
   */
  PLAIN_TEXT: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
  },

  /**
   * For rich content like event descriptions - more permissive
   */
  RICH_CONTENT: {
    ALLOWED_TAGS: [
      'p',
      'br',
      'b',
      'i',
      'em',
      'strong',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
    ],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
  },

  /**
   * For URLs - sanitize but allow basic URL structure
   */
  URL: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_DOM: false,
  },
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

  const { profile = 'PLAIN_TEXT', maxLength = 5000, trimWhitespace = true, customConfig } = options

  // Get the sanitization profile
  const profileConfig = SANITIZATION_PROFILES[profile]

  // Create DOMPurify config
  const config: any = customConfig || {
    ALLOWED_TAGS: profileConfig.ALLOWED_TAGS,
    ALLOWED_ATTR: profileConfig.ALLOWED_ATTR,
    KEEP_CONTENT: profileConfig.KEEP_CONTENT,
    RETURN_DOM: profileConfig.RETURN_DOM,
  }

  try {
    // Sanitize the content
    let sanitized = DOMPurify.sanitize(input, config) as unknown as string

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
    trimWhitespace: true,
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
    trimWhitespace: true,
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
    trimWhitespace: true,
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
  } = {},
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
    errors,
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
    /vbscript:/gi,
  ]

  return suspiciousPatterns.some((pattern) => pattern.test(input))
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
  defaultOptions: SanitizeOptions = { profile: 'PLAIN_TEXT' },
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
  } = {},
) {
  return (value: string): string | null => {
    const result = validateAndSanitize(value, options)
    if (!result.isValid) {
      return result.errors[0] || 'Invalid input'
    }
    return null
  }
}

/**
 * Sanitizes SVG code for safe rendering
 * This function uses a strict allow-list of SVG elements and attributes
 * to prevent XSS attacks while maintaining SVG functionality
 *
 * @param svgCode - The SVG code to sanitize
 * @returns Sanitized SVG code safe for rendering with v-html
 */
export function sanitizeSvg(svgCode: string): string {
  if (typeof svgCode !== 'string') {
    console.warn('sanitizeSvg: Input is not a string')
    return ''
  }

  // Early return for empty input
  if (!svgCode || svgCode.trim().length === 0) {
    return ''
  }

  // Quick check for obviously malicious content before sanitization
  if (containsSuspiciousContent(svgCode)) {
    console.warn('sanitizeSvg: SVG contains suspicious content patterns')
    // Still attempt to sanitize - DOMPurify will remove the dangerous parts
  }

  try {
    // Configure DOMPurify with strict SVG-specific rules
    const config = {
      USE_PROFILES: { svg: true, svgFilters: true },
      // Allow only safe SVG elements
      ALLOWED_TAGS: [
        'svg',
        'path',
        'rect',
        'circle',
        'ellipse',
        'line',
        'polyline',
        'polygon',
        'g',
        'defs',
        'linearGradient',
        'radialGradient',
        'stop',
        'clipPath',
        'mask',
        'pattern',
        'use',
        'symbol',
        'title',
        'desc',
      ],
      // Allow only safe SVG attributes
      ALLOWED_ATTR: [
        'xmlns',
        'viewBox',
        'width',
        'height',
        'x',
        'y',
        'x1',
        'y1',
        'x2',
        'y2',
        'cx',
        'cy',
        'r',
        'rx',
        'ry',
        'd',
        'fill',
        'stroke',
        'stroke-width',
        'stroke-linecap',
        'stroke-linejoin',
        'stroke-miterlimit',
        'stroke-dasharray',
        'stroke-dashoffset',
        'fill-opacity',
        'stroke-opacity',
        'opacity',
        'transform',
        'id',
        'class',
        'style',
        'points',
        'offset',
        'stop-color',
        'stop-opacity',
        'gradientUnits',
        'gradientTransform',
        'clip-path',
        'mask',
        'href',
        'xlink:href',
      ],
      // Additional security settings
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'foreignObject', 'animate', 'animateMotion', 'animateTransform', 'set'],
      FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur'],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      FORCE_BODY: false,
      SANITIZE_DOM: true,
      IN_PLACE: false,
    }

    // Sanitize the SVG
    let sanitized = DOMPurify.sanitize(svgCode, config) as unknown as string

    // Ensure we have a string
    if (typeof sanitized !== 'string') {
      sanitized = String(sanitized)
    }

    // Additional validation: ensure it's actually SVG-like
    if (sanitized && !sanitized.trim().startsWith('<svg')) {
      // If it doesn't start with <svg, wrap it or reject it
      if (sanitized.includes('<path') || sanitized.includes('<circle') || sanitized.includes('<rect')) {
        // It has SVG content but missing wrapper - this might be fragment
        console.warn('sanitizeSvg: SVG content missing <svg> wrapper')
        // Still return it as DOMPurify has already sanitized it
      }
    }

    return sanitized.trim()
  } catch (error) {
    console.error('sanitizeSvg: Error during SVG sanitization:', error)
    // Return empty string on error to prevent potential XSS
    return ''
  }
}

/**
 * Validates and sanitizes a URL to ensure it's safe
 * Only allows http:// and https:// protocols
 *
 * @param url - The URL to validate and sanitize
 * @returns Object with validation result and sanitized URL
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = []

  // Type check
  if (typeof url !== 'string') {
    url = String(url)
  }

  // Empty URL is valid (optional field)
  if (!url || url.trim().length === 0) {
    return {
      isValid: true,
      sanitized: '',
      errors: [],
    }
  }

  // Trim whitespace
  url = url.trim()

  // Check for suspicious content
  if (containsSuspiciousContent(url)) {
    errors.push('URL contains potentially malicious content')
  }

  // Validate protocol
  const protocolPattern = /^(https?):\/\//i
  if (!protocolPattern.test(url)) {
    errors.push('URL must start with http:// or https://')
  }

  // Additional checks for common XSS patterns in URLs
  const dangerousPatterns = [
    /javascript:/gi,
    /data:/gi,
    /vbscript:/gi,
    /file:/gi,
    /about:/gi,
  ]

  if (dangerousPatterns.some((pattern) => pattern.test(url))) {
    errors.push('URL protocol is not allowed')
  }

  // Sanitize the URL (remove any HTML tags that might have been injected)
  const sanitized = sanitizePlainText(url, 2000)

  // Basic URL format validation (optional, more lenient)
  try {
    // Try to parse as URL to ensure it's well-formed
    new URL(sanitized)
  } catch {
    errors.push('URL format is invalid')
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  }
}
