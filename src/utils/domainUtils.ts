/**
 * Domain utility functions for checking registered domains
 * Centralized domain configuration to avoid duplication across components
 */

/**
 * List of registered production domains where Telegram login is allowed
 */
const REGISTERED_DOMAINS = [
  'goevent.online',
  'www.goevent.online',
  'api.goevent.online',
] as const

export type RegisteredDomain = (typeof REGISTERED_DOMAINS)[number]

/**
 * Check if the current hostname is a registered production domain
 * Used for Telegram widget login which requires domain registration
 *
 * @param hostname - Optional hostname to check. Defaults to current window hostname
 * @returns True if the hostname is a registered domain
 */
export function isRegisteredDomain(hostname: string = window.location.hostname): boolean {
  return (REGISTERED_DOMAINS as readonly string[]).includes(hostname)
}

/**
 * Get all registered domains
 * Useful for debugging or configuration purposes
 *
 * @returns Array of registered domain strings
 */
export function getRegisteredDomains(): readonly string[] {
  return REGISTERED_DOMAINS
}
