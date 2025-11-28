/**
 * Budget Calculation Utilities
 * Helper functions for calculating budget metrics and updating budget state
 */

import type { ExpenseBudget } from '@/services/api'

/**
 * Calculate budget metrics after an expense change
 */
export function calculateBudgetMetrics(
  currentSpentAmount: string | number,
  budgetedAmount: string | number,
  expenseChange: number
): {
  spentAmount: string
  percentageUsed: number
  isOverBudget: boolean
} {
  const spent = typeof currentSpentAmount === 'string'
    ? parseFloat(currentSpentAmount)
    : currentSpentAmount
  const budgeted = typeof budgetedAmount === 'string'
    ? parseFloat(budgetedAmount)
    : budgetedAmount

  const newSpentAmount = Math.max(0, spent + expenseChange)
  const percentageUsed = budgeted > 0 ? (newSpentAmount / budgeted) * 100 : 0
  const isOverBudget = newSpentAmount > budgeted

  return {
    spentAmount: newSpentAmount.toString(),
    percentageUsed,
    isOverBudget,
  }
}

/**
 * Update a budget after adding an expense
 */
export function updateBudgetAfterExpenseAdd(
  budget: ExpenseBudget,
  expenseAmount: number
): void {
  const metrics = calculateBudgetMetrics(
    budget.spent_amount,
    budget.budgeted_amount,
    expenseAmount
  )

  budget.spent_amount = metrics.spentAmount
  budget.percentage_used = metrics.percentageUsed
  budget.is_over_budget = metrics.isOverBudget
}

/**
 * Update a budget after deleting an expense
 */
export function updateBudgetAfterExpenseDelete(
  budget: ExpenseBudget,
  expenseAmount: number
): void {
  const metrics = calculateBudgetMetrics(
    budget.spent_amount,
    budget.budgeted_amount,
    -expenseAmount // Negative to subtract
  )

  budget.spent_amount = metrics.spentAmount
  budget.percentage_used = metrics.percentageUsed
  budget.is_over_budget = metrics.isOverBudget
}

/**
 * Update a budget after updating an expense amount
 */
export function updateBudgetAfterExpenseUpdate(
  budget: ExpenseBudget,
  oldExpenseAmount: number,
  newExpenseAmount: number
): void {
  // First remove old amount, then add new amount
  const amountDifference = newExpenseAmount - oldExpenseAmount
  const metrics = calculateBudgetMetrics(
    budget.spent_amount,
    budget.budgeted_amount,
    amountDifference
  )

  budget.spent_amount = metrics.spentAmount
  budget.percentage_used = metrics.percentageUsed
  budget.is_over_budget = metrics.isOverBudget
}

/**
 * Create a deep copy of a budget for rollback purposes
 */
export function cloneBudget(budget: ExpenseBudget): ExpenseBudget {
  return {
    ...budget,
    category_info: { ...budget.category_info },
  }
}

/**
 * Parse expense amount from string or number
 */
export function parseExpenseAmount(amount: string | number): number {
  return typeof amount === 'string' ? parseFloat(amount) : amount
}
