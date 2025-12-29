/**
 * Expense Tracking API Service
 * Handles expense categories, budgets, and records
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  ExpenseCategory,
  CreateExpenseCategoryRequest,
  ExpenseBudget,
  CreateExpenseBudgetRequest,
  ExpenseRecord,
  CreateExpenseRecordRequest,
  ExpenseFilters,
  ExpenseSummary,
  PublicExpenseRecord,
} from '../types'

// Expense Categories Service
export const expenseCategoriesService = {
  // List all expense categories for the current user
  async getCategories(params?: {
    search?: string
    ordering?: string
  }): Promise<ApiResponse<PaginatedResponse<ExpenseCategory>>> {
    return apiClient.get<PaginatedResponse<ExpenseCategory>>(
      '/api/events/expense-categories/',
      params,
    )
  },

  // Get a specific expense category
  async getCategory(categoryId: number): Promise<ApiResponse<ExpenseCategory>> {
    return apiClient.get<ExpenseCategory>(`/api/events/expense-categories/${categoryId}/`)
  },

  // Create a new expense category
  async createCategory(
    data: CreateExpenseCategoryRequest,
  ): Promise<ApiResponse<ExpenseCategory>> {
    return apiClient.post<ExpenseCategory>('/api/events/expense-categories/', data)
  },

  // Update an expense category (full update)
  async updateCategory(
    categoryId: number,
    data: CreateExpenseCategoryRequest,
  ): Promise<ApiResponse<ExpenseCategory>> {
    return apiClient.put<ExpenseCategory>(`/api/events/expense-categories/${categoryId}/`, data)
  },

  // Partially update an expense category
  async patchCategory(
    categoryId: number,
    data: Partial<CreateExpenseCategoryRequest>,
  ): Promise<ApiResponse<ExpenseCategory>> {
    return apiClient.patch<ExpenseCategory>(`/api/events/expense-categories/${categoryId}/`, data)
  },

  // Delete an expense category
  async deleteCategory(categoryId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/expense-categories/${categoryId}/`)
  },
}

// Expense Budgets Service
export const expenseBudgetsService = {
  // List all budgets for an event
  async getBudgets(
    eventId: string,
    params?: { ordering?: string },
  ): Promise<ApiResponse<PaginatedResponse<ExpenseBudget>>> {
    return apiClient.get<PaginatedResponse<ExpenseBudget>>(
      `/api/events/${eventId}/expense-budgets/`,
      params,
    )
  },

  // Get a specific budget
  async getBudget(eventId: string, budgetId: number): Promise<ApiResponse<ExpenseBudget>> {
    return apiClient.get<ExpenseBudget>(`/api/events/${eventId}/expense-budgets/${budgetId}/`)
  },

  // Create a new budget for an event
  async createBudget(
    eventId: string,
    data: CreateExpenseBudgetRequest,
  ): Promise<ApiResponse<ExpenseBudget>> {
    return apiClient.post<ExpenseBudget>(`/api/events/${eventId}/expense-budgets/`, data)
  },

  // Update a budget (full update)
  async updateBudget(
    eventId: string,
    budgetId: number,
    data: Partial<CreateExpenseBudgetRequest>,
  ): Promise<ApiResponse<ExpenseBudget>> {
    return apiClient.put<ExpenseBudget>(
      `/api/events/${eventId}/expense-budgets/${budgetId}/`,
      data,
    )
  },

  // Partially update a budget
  async patchBudget(
    eventId: string,
    budgetId: number,
    data: Partial<CreateExpenseBudgetRequest>,
  ): Promise<ApiResponse<ExpenseBudget>> {
    return apiClient.patch<ExpenseBudget>(
      `/api/events/${eventId}/expense-budgets/${budgetId}/`,
      data,
    )
  },

  // Delete a budget
  async deleteBudget(eventId: string, budgetId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/${eventId}/expense-budgets/${budgetId}/`)
  },
}

// Expenses Service
export const expensesService = {
  // List all expenses for an event
  async getExpenses(
    eventId: string,
    filters?: ExpenseFilters,
  ): Promise<ApiResponse<PaginatedResponse<ExpenseRecord>>> {
    return apiClient.get<PaginatedResponse<ExpenseRecord>>(
      `/api/events/${eventId}/expenses/`,
      filters,
    )
  },

  // Get a specific expense
  async getExpense(eventId: string, expenseId: number): Promise<ApiResponse<ExpenseRecord>> {
    return apiClient.get<ExpenseRecord>(`/api/events/${eventId}/expenses/${expenseId}/`)
  },

  // Create a new expense with optional receipt upload
  async createExpense(
    eventId: string,
    data: CreateExpenseRecordRequest,
    receiptFile?: File,
  ): Promise<ApiResponse<ExpenseRecord>> {
    if (receiptFile) {
      // Use FormData for file upload
      const formData = new FormData()
      formData.append('category', data.category.toString())
      formData.append('category_id', data.category_id.toString())
      formData.append('description', data.description)
      formData.append('amount', data.amount.toString())
      formData.append('currency', data.currency)
      formData.append('date', data.date)
      formData.append('payment_method', data.payment_method)

      if (data.paid_to) formData.append('paid_to', data.paid_to)
      if (data.notes) formData.append('notes', data.notes)
      formData.append('receipt', receiptFile)

      return apiClient.postFormData<ExpenseRecord>(`/api/events/${eventId}/expenses/`, formData)
    } else {
      // Use JSON for requests without file upload
      return apiClient.post<ExpenseRecord>(`/api/events/${eventId}/expenses/`, data)
    }
  },

  // Update an expense with optional receipt upload
  async updateExpense(
    eventId: string,
    expenseId: number,
    data: Partial<CreateExpenseRecordRequest>,
    receiptFile?: File,
  ): Promise<ApiResponse<ExpenseRecord>> {
    if (receiptFile) {
      // Use FormData for file upload
      const formData = new FormData()

      if (data.category !== undefined)
        formData.append('category', data.category.toString())
      if (data.category_id !== undefined)
        formData.append('category_id', data.category_id.toString())
      if (data.description) formData.append('description', data.description)
      if (data.amount !== undefined) formData.append('amount', data.amount.toString())
      if (data.currency) formData.append('currency', data.currency)
      if (data.date) formData.append('date', data.date)
      if (data.payment_method) formData.append('payment_method', data.payment_method)
      if (data.paid_to !== undefined) formData.append('paid_to', data.paid_to)
      if (data.notes !== undefined) formData.append('notes', data.notes)

      formData.append('receipt', receiptFile)

      return apiClient.patchFormData<ExpenseRecord>(
        `/api/events/${eventId}/expenses/${expenseId}/`,
        formData,
      )
    } else {
      // Use JSON for requests without file upload
      return apiClient.patch<ExpenseRecord>(
        `/api/events/${eventId}/expenses/${expenseId}/`,
        data,
      )
    }
  },

  // Delete an expense
  async deleteExpense(eventId: string, expenseId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/${eventId}/expenses/${expenseId}/`)
  },

  // Get expense summary for an event
  async getExpenseSummary(eventId: string): Promise<ApiResponse<ExpenseSummary>> {
    return apiClient.get<ExpenseSummary>(`/api/events/${eventId}/expenses/summary/`)
  },

  // Get public expenses for transparency display (no auth required)
  async getPublicExpenses(eventId: string): Promise<ApiResponse<PublicExpenseRecord[]>> {
    return apiClient.getPublic<PublicExpenseRecord[]>(`/api/events/${eventId}/expenses/public/`)
  },
}
