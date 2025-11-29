<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50/50 border border-red-200/50 rounded-2xl p-6">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertCircle class="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h4 class="font-semibold text-red-900 mb-1">Error Loading Summary</h4>
          <p class="text-sm text-red-700">{{ error }}</p>
          <button @click="() => loadSummary()" class="mt-3 text-sm font-medium text-red-600 hover:text-red-700">
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Content -->
    <template v-else-if="summary && Object.keys(summary.overall_totals).length > 0">
      <!-- Budget Summary Cards (per currency) -->
      <div
        v-for="currency in Object.keys(summary.overall_totals)"
        :key="`summary-${currency}`"
        class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60"
      >
        <div class="flex flex-col gap-6">
          <!-- Currency Header with Budget Stats -->
          <div class="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{{ currency }} Budget</p>
              <p class="text-4xl font-semibold tracking-tight text-slate-900 transition-all duration-300" aria-live="polite">
                {{ formatCurrency(summary.overall_totals[currency].total_budget, currency) }}
              </p>
              <p class="mt-1 text-sm text-slate-500">{{ getBudgetedCategoriesCount(currency) }} categories budgeted</p>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <div
                :class="[
                  'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ring-1',
                  isOverBudget(currency)
                    ? 'bg-red-50 text-red-600 ring-red-200'
                    : 'bg-emerald-50 text-emerald-600 ring-emerald-200'
                ]"
              >
                <TrendingUp class="h-4 w-4" aria-hidden="true" />
                <span>{{ formatCurrency(summary.overall_totals[currency].total_expenses, currency) }} spent</span>
              </div>
            </div>
          </div>

          <!-- Progress Visualization -->
          <div class="space-y-5">
            <div class="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner" role="img" aria-hidden="true">
              <div
                :class="[
                  'h-full transition-all duration-700 ease-out',
                  isOverBudget(currency)
                    ? 'bg-gradient-to-r from-red-400 via-red-500 to-red-600'
                    : 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600'
                ]"
                :style="{ width: Math.min(getBudgetPercentage(currency), 100) + '%' }"
              ></div>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <!-- Budget Spent -->
              <div
                :class="[
                  'rounded-2xl border border-transparent p-4 shadow-sm',
                  isOverBudget(currency)
                    ? 'bg-red-50/80 shadow-red-100/70'
                    : 'bg-emerald-50/80 shadow-emerald-100/70'
                ]"
              >
                <div class="flex items-center justify-between">
                  <p
                    :class="[
                      'text-xs font-semibold uppercase tracking-wide',
                      isOverBudget(currency) ? 'text-red-600' : 'text-emerald-600'
                    ]"
                  >
                    Spent
                  </p>
                  <span
                    :class="[
                      'text-xs font-semibold',
                      isOverBudget(currency) ? 'text-red-600' : 'text-emerald-600'
                    ]"
                  >
                    {{ getBudgetPercentage(currency) }}%
                  </span>
                </div>
                <p class="mt-3 text-lg font-semibold text-slate-900 transition-all duration-300">
                  {{ formatCurrency(summary.overall_totals[currency].total_expenses, currency) }}
                </p>
                <p :class="['text-xs', isOverBudget(currency) ? 'text-red-700/70' : 'text-emerald-700/70']">
                  {{ summary.overall_totals[currency].expense_count }} expense{{ summary.overall_totals[currency].expense_count !== 1 ? 's' : '' }} recorded
                </p>
              </div>

              <!-- Remaining/Over Budget -->
              <div
                :class="[
                  'rounded-2xl border border-transparent p-4 shadow-sm',
                  isOverBudget(currency)
                    ? 'bg-red-50/80 shadow-red-100/70'
                    : 'bg-sky-50/80 shadow-sky-100/70'
                ]"
              >
                <div class="flex items-center justify-between">
                  <p
                    :class="[
                      'text-xs font-semibold uppercase tracking-wide',
                      isOverBudget(currency) ? 'text-red-600' : 'text-sky-600'
                    ]"
                  >
                    {{ isOverBudget(currency) ? 'Over Budget' : 'Remaining' }}
                  </p>
                  <span
                    :class="[
                      'text-xs font-semibold',
                      isOverBudget(currency) ? 'text-red-600' : 'text-sky-600'
                    ]"
                  >
                    {{ Math.abs(getRemainingBudget(currency)) > 0 ? (isOverBudget(currency) ? '+' : '') : '' }}{{ Math.abs(100 - getBudgetPercentage(currency)) }}%
                  </span>
                </div>
                <p class="mt-3 text-lg font-semibold text-slate-900 transition-all duration-300">
                  {{ formatCurrency(Math.abs(getRemainingBudget(currency)), currency) }}
                </p>
                <p :class="['text-xs', isOverBudget(currency) ? 'text-red-700/70' : 'text-sky-700/70']">
                  {{ isOverBudget(currency) ? 'Exceeded your budget limit' : 'Still available to spend' }}
                </p>
              </div>

              <!-- Budget Status -->
              <div class="rounded-2xl border border-transparent bg-slate-50 p-4 shadow-sm shadow-slate-100/70">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-600">Status</p>
                </div>
                <p class="mt-3 text-lg font-semibold text-slate-900 transition-all duration-300">
                  {{ isOverBudget(currency) ? 'Over Budget' : 'On Track' }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ isOverBudget(currency) ? 'Review spending to get back on track' : 'Budget is under control' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- Empty State - Show zero stats like guest tab -->
    <div v-else class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60">
      <div class="flex flex-col gap-6">
        <!-- Header with zero values -->
        <div class="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total Budget</p>
            <p class="text-4xl font-semibold tracking-tight text-slate-900 transition-all duration-300">
              $0.00
            </p>
            <p class="mt-1 text-sm text-slate-500">0 categories budgeted</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <div class="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ring-1 bg-slate-50 text-slate-500 ring-slate-200">
              <TrendingUp class="h-4 w-4" aria-hidden="true" />
              <span>$0.00 spent</span>
            </div>
          </div>
        </div>

        <!-- Zero Progress Visualization -->
        <div class="space-y-5">
          <div class="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner" role="img" aria-hidden="true">
            <div class="h-full transition-all duration-700 ease-out bg-slate-200" style="width: 0%"></div>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <!-- Budget Spent -->
            <div class="rounded-2xl border border-transparent bg-slate-50/80 p-4 shadow-sm shadow-slate-100/70">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Spent</p>
                <span class="text-xs font-semibold text-slate-500">0%</span>
              </div>
              <p class="mt-3 text-lg font-semibold text-slate-900 transition-all duration-300">$0.00</p>
              <p class="text-xs text-slate-400">0 expenses recorded</p>
            </div>

            <!-- Remaining -->
            <div class="rounded-2xl border border-transparent bg-slate-50/80 p-4 shadow-sm shadow-slate-100/70">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">Remaining</p>
                <span class="text-xs font-semibold text-slate-500">0%</span>
              </div>
              <p class="mt-3 text-lg font-semibold text-slate-900 transition-all duration-300">$0.00</p>
              <p class="text-xs text-slate-400">No budget set yet</p>
            </div>

            <!-- Budget Status -->
            <div class="rounded-2xl border border-transparent bg-slate-50 p-4 shadow-sm shadow-slate-100/70">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold uppercase tracking-wide text-slate-600">Status</p>
              </div>
              <p class="mt-3 text-lg font-semibold text-slate-900 transition-all duration-300">No Budget</p>
              <p class="text-xs text-slate-500">Create a budget to start tracking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  TrendingUp,
  AlertCircle
} from 'lucide-vue-next'
import {
  expensesService,
  expenseBudgetsService
} from '@/services/api'
import { useExpenseIcons } from '@/composables/useExpenseIcons'

interface Props {
  eventId: string
}

interface CategorySummary {
  category_id: number
  category_name: string
  category_icon?: string
  category_color?: string
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
}

interface ExpenseSummary {
  categories: CategorySummary[]
  overall_totals: {
    [currency: string]: {
      total_expenses: number
      total_budget: number
      expense_count: number
    }
  }
}

const props = defineProps<Props>()

const loading = ref(false)
const error = ref<string | null>(null)
const summary = ref<ExpenseSummary | null>(null)
const selectedCurrency = ref<string>('USD')
const abortController = ref<AbortController | null>(null)

// Use shared icon utilities
const { getIconComponent: getIconComp } = useExpenseIcons()

const filteredCategories = computed(() => {
  if (!summary.value) return []
  return summary.value.categories.filter(cat => cat.currency === selectedCurrency.value)
})

const topExpenseCategories = computed(() => {
  if (!summary.value) return []
  return [...summary.value.categories]
    .sort((a, b) => b.total_amount - a.total_amount)
    .slice(0, 5)
})

const loadSummary = async (silent = false) => {
  // Cancel previous request if exists
  if (abortController.value) {
    abortController.value.abort()
  }

  abortController.value = new AbortController()
  // Only show loading state on initial load, not on refreshes
  if (!silent && !summary.value) {
    loading.value = true
  }
  error.value = null

  try {
    // Fetch both budgets and expenses
    const [budgetsResponse, expensesResponse] = await Promise.all([
      expenseBudgetsService.getBudgets(props.eventId),
      expensesService.getExpenses(props.eventId)
    ])

    // Check if request was cancelled
    if (abortController.value?.signal.aborted) {
      return
    }

    if (!budgetsResponse.success || !expensesResponse.success) {
      error.value = 'Failed to load expense data'
      return
    }

    const budgets = budgetsResponse.data?.results || []
    const expenses = expensesResponse.data?.results || []

    // Build summary from budgets and expenses
    const categoriesMap = new Map<string, CategorySummary>()
    const overallTotals: ExpenseSummary['overall_totals'] = {}

    // Process budgets first
    budgets.forEach(budget => {
      const key = `${budget.category}-${budget.currency}`
      categoriesMap.set(key, {
        category_id: budget.category,
        category_name: budget.category_info.name,
        category_icon: budget.category_info.icon,
        category_color: budget.category_info.color,
        currency: budget.currency,
        total_amount: parseFloat(budget.spent_amount),
        expense_count: 0,
        budget: {
          category_name: budget.category_info.name,
          budgeted_amount: parseFloat(budget.budgeted_amount),
          currency: budget.currency,
          spent_amount: parseFloat(budget.spent_amount),
          remaining_amount: parseFloat(budget.remaining_amount),
          percentage_used: budget.percentage_used,
          is_over_budget: budget.is_over_budget
        }
      })

      // Initialize overall totals
      if (!overallTotals[budget.currency]) {
        overallTotals[budget.currency] = {
          total_budget: 0,
          total_expenses: 0,
          expense_count: 0
        }
      }
      overallTotals[budget.currency].total_budget += parseFloat(budget.budgeted_amount)
    })

    // Process expenses
    expenses.forEach(expense => {
      const key = `${expense.category}-${expense.currency}`

      if (!categoriesMap.has(key)) {
        // Category without budget
        categoriesMap.set(key, {
          category_id: expense.category,
          category_name: expense.category_info.name,
          category_icon: expense.category_info.icon,
          category_color: expense.category_info.color,
          currency: expense.currency,
          total_amount: 0,
          expense_count: 0
        })
      }

      const category = categoriesMap.get(key)!
      category.expense_count++

      // Initialize overall totals if needed
      if (!overallTotals[expense.currency]) {
        overallTotals[expense.currency] = {
          total_budget: 0,
          total_expenses: 0,
          expense_count: 0
        }
      }
      overallTotals[expense.currency].total_expenses += parseFloat(expense.amount)
      overallTotals[expense.currency].expense_count++
    })

    summary.value = {
      categories: Array.from(categoriesMap.values()),
      overall_totals: overallTotals
    }

    // Set default currency to the first available
    const currencies = Object.keys(overallTotals)
    if (currencies.length > 0) {
      selectedCurrency.value = currencies[0]
    }
  } catch (err: any) {
    // Don't show error if request was aborted
    if (err.name === 'AbortError' || abortController.value?.signal.aborted) {
      return
    }
    error.value = 'An unexpected error occurred while loading the summary'
    console.error('Error loading expense summary:', err)
  } finally {
    loading.value = false
  }
}

const formatCurrency = (amount: number, currency: string): string => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  } else if (currency === 'KHR') {
    return new Intl.NumberFormat('km-KH', {
      style: 'currency',
      currency: 'KHR',
      minimumFractionDigits: 0,
    }).format(amount)
  }
  return `${currency} ${amount.toFixed(2)}`
}

const isOverBudget = (currency: string): boolean => {
  if (!summary.value) return false
  const totals = summary.value.overall_totals[currency]
  return totals.total_expenses > totals.total_budget
}

const getRemainingBudget = (currency: string): number => {
  if (!summary.value) return 0
  const totals = summary.value.overall_totals[currency]
  return totals.total_budget - totals.total_expenses
}

const getBudgetPercentage = (currency: string): number => {
  if (!summary.value) return 0
  const totals = summary.value.overall_totals[currency]
  if (totals.total_budget === 0) return 0
  return Math.round((totals.total_expenses / totals.total_budget) * 100)
}

const getBudgetedCategoriesCount = (currency: string): number => {
  if (!summary.value) return 0
  return summary.value.categories.filter(cat => cat.currency === currency && cat.budget).length
}

const getCategoryColor = (categoryId: number): string => {
  if (!summary.value) return '#3498db'
  const category = summary.value.categories.find(cat => cat.category_id === categoryId)
  return category?.category_color || '#3498db'
}

const getCategoryIcon = (categoryId: number): any => {
  if (!summary.value) return null
  const category = summary.value.categories.find(cat => cat.category_id === categoryId)
  if (!category?.category_icon) return null
  return getIconComp(category.category_icon)
}

onMounted(() => {
  loadSummary()
})

onUnmounted(() => {
  // Abort any pending requests to prevent race conditions
  if (abortController.value) {
    abortController.value.abort()
  }
})

// Expose methods for parent component
defineExpose({
  refresh: () => loadSummary(true) // Pass silent=true to avoid loading flicker
})
</script>
