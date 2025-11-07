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
          <button @click="loadSummary" class="mt-3 text-sm font-medium text-red-600 hover:text-red-700">
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Content -->
    <template v-else-if="summary">
      <!-- Header -->
      <header class="flex flex-col gap-2">
        <div class="space-y-1">
          <h3 class="text-lg font-bold text-slate-900">Expense Overview</h3>
          <p class="text-sm text-slate-500">Track your budget utilization and spending patterns across categories.</p>
        </div>
      </header>
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
              <p class="text-4xl font-semibold tracking-tight text-slate-900" aria-live="polite">
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
                  'h-full transition-[width] duration-500',
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
                <p class="mt-3 text-lg font-semibold text-slate-900">
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
                <p class="mt-3 text-lg font-semibold text-slate-900">
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
                <p class="mt-3 text-lg font-semibold text-slate-900">
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

      <!-- Category Breakdown -->
      <div class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Category Breakdown</h3>
            <p class="text-sm text-slate-500 mt-1">Detailed spending across all categories</p>
          </div>
          <div v-if="Object.keys(summary.overall_totals).length > 1" class="flex items-center gap-2">
            <button
              v-for="currency in Object.keys(summary.overall_totals)"
              :key="`filter-${currency}`"
              @click="selectedCurrency = currency"
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                selectedCurrency === currency
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              {{ currency }}
            </button>
          </div>
        </div>

        <!-- Category Items -->
        <div class="space-y-3">
          <div
            v-for="category in filteredCategories"
            :key="category.category_id"
            class="group p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-100/50 transition-all duration-200"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  :style="{ backgroundColor: getCategoryColor(category.category_id) + '20' }"
                >
                  <component
                    v-if="getCategoryIcon(category.category_id)"
                    :is="getCategoryIcon(category.category_id)"
                    class="w-5 h-5"
                    :style="{ color: getCategoryColor(category.category_id) }"
                  />
                  <Folder v-else class="w-5 h-5" :style="{ color: getCategoryColor(category.category_id) }" />
                </div>
                <div>
                  <h4 class="font-semibold text-slate-900">{{ category.category_name }}</h4>
                  <p class="text-xs text-slate-500">{{ category.expense_count }} item{{ category.expense_count !== 1 ? 's' : '' }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-bold text-slate-900">{{ formatCurrency(category.total_amount, category.currency) }}</p>
                <p v-if="category.budget" class="text-xs text-slate-500">
                  / {{ formatCurrency(category.budget.budgeted_amount, category.budget.currency) }}
                </p>
              </div>
            </div>

            <!-- Progress Bar (only if budget exists) -->
            <div v-if="category.budget" class="space-y-2">
              <div class="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  :class="[
                    'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                    category.budget.is_over_budget
                      ? 'bg-gradient-to-r from-red-400 to-red-600'
                      : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                  ]"
                  :style="{ width: Math.min(category.budget.percentage_used, 100) + '%' }"
                ></div>
              </div>

              <div class="flex items-center justify-between">
                <span
                  :class="[
                    'text-xs font-medium inline-flex items-center gap-1',
                    category.budget.is_over_budget ? 'text-red-600' : 'text-emerald-600'
                  ]"
                >
                  <AlertTriangle v-if="category.budget.is_over_budget" class="w-3 h-3" />
                  {{ category.budget.percentage_used.toFixed(0) }}% used
                </span>
                <span
                  :class="[
                    'text-xs font-medium',
                    category.budget.is_over_budget ? 'text-red-600' : 'text-slate-500'
                  ]"
                >
                  {{ formatCurrency(Math.abs(category.budget.remaining_amount), category.budget.currency) }}
                  {{ category.budget.is_over_budget ? ' over' : ' left' }}
                </span>
              </div>
            </div>
            <!-- No Budget Indicator -->
            <div v-else class="pt-2">
              <p class="text-xs text-amber-600 font-medium">No budget set</p>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredCategories.length === 0" class="text-center py-12">
          <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Folder class="w-8 h-8 text-slate-400" />
          </div>
          <h4 class="font-semibold text-slate-600 mb-2">No expenses in {{ selectedCurrency }}</h4>
          <p class="text-sm text-slate-400">Record expenses to see them here</p>
        </div>
      </div>

      <!-- Top Expenses -->
      <div class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60">
        <div class="mb-6">
          <h3 class="text-lg font-bold text-slate-900">Top Spending Categories</h3>
          <p class="text-sm text-slate-500 mt-1">Your highest expense categories across all currencies</p>
        </div>

        <!-- Expense List (Show top 5 expenses) -->
        <div class="space-y-2">
          <div
            v-for="(category, index) in topExpenseCategories"
            :key="`top-${category.category_id}`"
            class="flex items-center gap-4 p-4 bg-slate-50/50 hover:bg-slate-100/50 rounded-2xl transition-all duration-200"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                :style="{ backgroundColor: getCategoryColor(category.category_id) + '20' }"
              >
                <component
                  v-if="getCategoryIcon(category.category_id)"
                  :is="getCategoryIcon(category.category_id)"
                  class="w-5 h-5"
                  :style="{ color: getCategoryColor(category.category_id) }"
                />
                <Folder v-else class="w-5 h-5" :style="{ color: getCategoryColor(category.category_id) }" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-slate-400">#{{ index + 1 }}</span>
                  <h4 class="font-semibold text-slate-900 truncate">{{ category.category_name }}</h4>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">{{ category.expense_count }} item{{ category.expense_count !== 1 ? 's' : '' }}</p>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="font-bold text-slate-900">{{ formatCurrency(category.total_amount, category.currency) }}</p>
              <p class="text-xs text-slate-500">{{ category.currency }}</p>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="summary.categories.length === 0" class="text-center py-12">
          <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 class="w-8 h-8 text-slate-400" />
          </div>
          <h4 class="font-semibold text-slate-600 mb-2">No expenses yet</h4>
          <p class="text-sm text-slate-400">Start recording expenses to see insights</p>
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <div v-else class="rounded-3xl border border-white/70 bg-white p-12 shadow-lg shadow-slate-200/60 text-center">
      <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <BarChart3 class="w-8 h-8 text-slate-400" />
      </div>
      <h4 class="font-semibold text-slate-900 mb-2">No Budget Data Available</h4>
      <p class="text-sm text-slate-500">Create budgets and record expenses to see your financial overview</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Folder,
  BarChart3
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

const loadSummary = async () => {
  // Cancel previous request if exists
  if (abortController.value) {
    abortController.value.abort()
  }

  abortController.value = new AbortController()
  loading.value = true
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
</script>
