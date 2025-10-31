/**
 * Secure logging utility that sanitizes sensitive data in development mode
 */

// Development mode flag
const IS_DEV_MODE = import.meta.env.DEV

export class SecureLogger {
  /**
   * Log debug information (only in development mode)
   */
  static debug(context: string, data: Record<string, unknown>): void {
    if (!IS_DEV_MODE) return

    // Sanitize sensitive fields
    const sanitized = this.sanitizeLogData(data)
    console.debug(`[API Debug] ${context}:`, sanitized)
  }

  /**
   * Log errors with context
   */
  static error(context: string, error: unknown, data?: Record<string, unknown>): void {
    const sanitized = data ? this.sanitizeLogData(data) : {}
    console.error(`[API Error] ${context}:`, error, sanitized)
  }

  /**
   * Log warnings
   */
  static warn(context: string, message: string, data?: Record<string, unknown>): void {
    const sanitized = data ? this.sanitizeLogData(data) : {}
    console.warn(`[API Warning] ${context}:`, message, sanitized)
  }

  /**
   * Sanitize sensitive data from logs
   * Remove tokens, passwords, and other sensitive fields
   */
  private static sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['token', 'access', 'refresh', 'password', 'Authorization', 'authorization']
    const sanitized: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'string' && value.length > 200) {
        // Truncate long strings (like response bodies)
        sanitized[key] = value.substring(0, 200) + '... (truncated)'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeLogData(value as Record<string, unknown>)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }
}
