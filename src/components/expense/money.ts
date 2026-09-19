/**
 * One money formatter for the budget feature.
 *
 * There used to be two: `ExpenseBudgetsView` prefixed its own symbol
 * (`៛12,000`) while `ExpenseSummaryView` went through `Intl` with `km-KH`
 * (`12,000៛`), so the same riel amount was punctuated differently in the
 * summary and in the row it summarised.
 */

const SYMBOLS: Record<string, string> = {
  USD: '$',
  KHR: '៛',
}

interface MoneyOptions {
  /**
   * Drop `.00` when the amount is whole. For display sizes where the trailing
   * zeros are dead weight (the hero number), never for an editable field.
   */
  trimWholeCents?: boolean
}

/**
 * Format an amount with its currency symbol.
 *
 * Riel carries no minor unit, so it is always whole; USD keeps two decimals
 * unless `trimWholeCents` is set and there are none to show.
 */
export function money(
  amount: number | string,
  currency: string,
  options: MoneyOptions = {}
): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  const safe = Number.isFinite(value) ? value : 0

  if (currency === 'KHR') {
    return `៛${safe.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  }

  const symbol = SYMBOLS[currency] ?? `${currency} `
  const whole = Number.isInteger(safe)
  const decimals = options.trimWholeCents && whole ? 0 : 2

  return `${symbol}${safe.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}
