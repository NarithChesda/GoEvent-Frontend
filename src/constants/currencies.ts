/**
 * Currency-related constants and utilities for expense management
 */

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'USD - US Dollar', symbol: '$' },
  { code: 'KHR', name: 'KHR - Cambodian Riel', symbol: '៛' },
]

export type CurrencyCode = 'USD' | 'KHR'

/**
 * Get currency symbol for a currency code
 * @param code Currency code
 * @returns Currency symbol or default '$'
 */
export const getCurrencySymbol = (code: CurrencyCode): string => {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === code)
  return currency?.symbol || '$'
}

/**
 * Format a number as currency with symbol
 * @param amount Amount to format (number or string)
 * @param currencyCode Currency code
 * @param locale Locale for number formatting (default: 'en-US')
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export const formatCurrency = (
  amount: string | number,
  currencyCode: CurrencyCode,
  locale: string = 'en-US'
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(numAmount)) {
    return `${getCurrencySymbol(currencyCode)}0.00`
  }

  const symbol = getCurrencySymbol(currencyCode)
  const formatted = numAmount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return `${symbol}${formatted}`
}

/**
 * Format number with thousands separators
 * @param value Number to format
 * @param options Formatting options
 * @returns Formatted number string
 */
export const formatNumber = (
  value: string | number,
  options?: Intl.NumberFormatOptions
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
    return '0.00'
  }

  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  })
}

/**
 * Format a percentage value
 * @param value Percentage value (0-100)
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "75.5%")
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (isNaN(value)) {
    return '0.0%'
  }
  return `${value.toFixed(decimals)}%`
}
