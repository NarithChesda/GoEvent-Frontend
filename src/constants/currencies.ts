/**
 * Currency-related constants for expense management
 */

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'USD - US Dollar', symbol: '$' },
  { code: 'KHR', name: 'KHR - Cambodian Riel', symbol: '៛' },
] as const

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]['code']
