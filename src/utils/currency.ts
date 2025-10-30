/**
 * Currency formatting utilities for expense management
 */

export type CurrencyCode = 'USD' | 'KHR'

/**
 * Format a number as currency with proper locale formatting
 * @param amount - The amount to format (number or string)
 * @param currency - Currency code (USD or KHR)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number | string,
  currency: CurrencyCode
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount)
  } else if (currency === 'KHR') {
    return new Intl.NumberFormat('km-KH', {
      style: 'currency',
      currency: 'KHR',
      minimumFractionDigits: 0,
    }).format(numAmount)
  }

  return `${currency} ${numAmount.toFixed(2)}`
}

/**
 * Get currency symbol for a given currency code
 * @param currency - Currency code (USD or KHR)
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currency: CurrencyCode): string => {
  return currency === 'USD' ? '$' : '៛'
}

/**
 * Format amount without currency symbol, just with proper decimal places
 * @param amount - The amount to format
 * @param currency - Currency code (determines decimal places)
 * @returns Formatted number string
 */
export const formatAmount = (
  amount: number | string,
  currency: CurrencyCode
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  const decimals = currency === 'KHR' ? 0 : 2

  return numAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
