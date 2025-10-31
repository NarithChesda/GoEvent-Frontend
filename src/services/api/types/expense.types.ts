/**
 * Expense tracking type definitions
 */

import type { QueryParams } from './api.types'

export interface ExpenseCategory {
  id: number
  name: string
  description?: string
  icon?: string
  color: string
  is_active: boolean
  created_by: number
  created_by_info?: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
  }
  created_at: string
  updated_at: string
}

export interface CreateExpenseCategoryRequest {
  name: string
  description?: string
  icon?: string
  color?: string
  is_active?: boolean
}

export interface ExpenseBudget {
  id: number
  event: string
  category: number
  category_info: {
    id: number
    name: string
    description?: string
    icon?: string
    color: string
    is_active: boolean
  }
  budgeted_amount: string
  currency: 'USD' | 'KHR'
  notes?: string
  spent_amount: string
  remaining_amount: string
  percentage_used: number
  is_over_budget: boolean
  created_at: string
  updated_at: string
}

export interface CreateExpenseBudgetRequest {
  category_id: number
  budgeted_amount: number
  currency: 'USD' | 'KHR'
  notes?: string
}

export interface ExpenseRecord {
  id: number
  event: string
  category: number
  category_info: {
    id: number
    name: string
    description?: string
    icon?: string
    color: string
  }
  description: string
  amount: string
  currency: 'USD' | 'KHR'
  date: string
  paid_to?: string
  payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'mobile_payment' | 'check' | 'other'
  receipt?: string
  notes?: string
  added_by: number
  added_by_info?: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
  }
  created_at: string
  updated_at: string
}

export interface CreateExpenseRecordRequest {
  category: number
  category_id: number
  description: string
  amount: number
  currency: 'USD' | 'KHR'
  date: string
  paid_to?: string
  payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'mobile_payment' | 'check' | 'other'
  notes?: string
}

export interface ExpenseFilters extends QueryParams {
  search?: string
  ordering?: string
  page?: number
}

export interface ExpenseSummary {
  event_id: string
  event_title: string
  categories: Array<{
    category_id: number
    category_name: string
    currency: string
    total_amount: number
    expense_count: number
    budget?: {
      category_name: string
      budgeted_amount: number
      currency: string
      spent_amount: number
      remaining_amount: number
      percentage_used: number
      is_over_budget: boolean
    }
  }>
  overall_totals: {
    [currency: string]: {
      total_expenses: number
      total_budget: number
      expense_count: number
    }
  }
}
