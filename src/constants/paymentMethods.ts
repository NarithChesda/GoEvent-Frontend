/**
 * Payment method constants for expense management
 */

export const PAYMENT_METHODS = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  credit_card: 'Credit Card',
  mobile_payment: 'Mobile Payment',
  check: 'Check',
  other: 'Other'
} as const

export type PaymentMethodKey = keyof typeof PAYMENT_METHODS

/**
 * Format payment method enum to display string
 * @param method - Payment method enum value
 * @returns Human-readable payment method name
 */
export const formatPaymentMethod = (method: string): string => {
  return PAYMENT_METHODS[method as PaymentMethodKey] || method
}

/**
 * Get payment method options for select dropdowns
 * @returns Array of {value, label} objects
 */
export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHODS).map(
  ([value, label]) => ({ value, label })
)
