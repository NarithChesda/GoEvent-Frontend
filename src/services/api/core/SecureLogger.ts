/**
 * Secure logging utility that sanitizes sensitive data in development mode
 */


export class SecureLogger {
  /**
   * Log debug information (only in development mode)
   */
  static debug(_context: string, _data: Record<string, unknown>): void {
    // Debug logging disabled
    return
  }

  /**
   * Log errors with context
   */
  static error(_context: string, _error: unknown, _data?: Record<string, unknown>): void {
    // Error logging disabled
    return
  }

  /**
   * Log warnings
   */
  static warn(_context: string, _message: string, _data?: Record<string, unknown>): void {
    // Warning logging disabled
    return
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
