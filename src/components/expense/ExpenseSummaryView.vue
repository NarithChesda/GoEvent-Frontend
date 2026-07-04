<template>
  <div class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60">
    <!-- Header -->
    <div class="mb-6 flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
          {{ t('management.expenseSummary.title') }}
        </p>
        <p class="mt-1 text-sm text-slate-500">
          {{ t('management.expenseSummary.subtitle') }}
        </p>
      </div>
      <button
        type="button"
        class="flex-shrink-0 rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="loading"
        :aria-label="t('management.expenseSummary.refresh')"
        :title="t('management.expenseSummary.refresh')"
        @click="() => loadSummary()"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
      </button>
    </div>

    <!-- Loading skeleton (first load only — refreshes keep content visible) -->
    <div v-if="loading && !summary" class="animate-pulse space-y-4" aria-hidden="true">
      <div class="h-3 w-24 rounded bg-slate-100" />
      <div class="h-9 w-52 max-w-full rounded bg-slate-100" />
      <div class="h-3 w-64 max-w-full rounded bg-slate-100" />
      <div class="h-3 w-full rounded-full bg-slate-100" />
      <div class="h-3 w-72 max-w-full rounded bg-slate-100" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-2xl border border-red-200/60 bg-red-50/50 p-5">
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
          <AlertCircle class="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h4 class="text-sm font-semibold text-red-900">
            {{ t('management.expenseSummary.error.title') }}
          </h4>
          <p class="mt-0.5 text-sm text-red-700">{{ error }}</p>
          <button
            type="button"
            class="mt-2 text-sm font-medium text-red-600 transition-colors duration-200 hover:text-red-700"
            @click="() => loadSummary()"
          >
            {{ t('management.expenseSummary.error.tryAgain') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Per-currency budget sections -->
    <div v-else-if="currencyTotals.length > 0" class="flex flex-col gap-6">
      <section
        v-for="row in currencyTotals"
        :key="row.currency"
        class="border-t border-slate-100 pt-6 first-of-type:border-t-0 first-of-type:pt-0"
      >
        <!-- Section header: total budget hero + status pill -->
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {{ t('management.expenseSummary.currencyBudget', { currency: row.currency }) }}
            </p>
            <p
              class="mt-1 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900"
              aria-live="polite"
            >
              {{ formatCurrency(row.totalBudget, row.currency) }}
            </p>
            <p class="mt-1 text-sm text-slate-500">
              {{ t('management.expenseSummary.categoriesBudgeted', { count: getBudgetedCategoriesCount(row.currency) }) }}
              · {{ t('management.expenseSummary.expensesRecorded', { count: row.expenseCount }, row.expenseCount) }}
            </p>
          </div>
          <span
            class="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="row.isOver ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'"
          >
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="row.isOver ? 'bg-red-500' : 'bg-emerald-500'"
            />
            {{
              row.isOver
                ? t('management.expenseSummary.status.overBudget')
                : t('management.expenseSummary.status.onTrack')
            }}
          </span>
        </div>

        <!-- Labeled meter: spent vs remaining -->
        <div class="mt-4 flex items-baseline justify-between gap-4 text-xs">
          <p class="tabular-nums">
            <span class="font-medium text-slate-500">{{ t('management.expenseSummary.spentLabel') }}</span>
            <span class="ml-1.5 font-semibold text-slate-900">{{ formatCurrency(row.totalExpenses, row.currency) }}</span>
            <span class="ml-1 text-slate-400">· {{ row.percent }}%</span>
          </p>
          <p class="tabular-nums">
            <span class="font-medium" :class="row.isOver ? 'text-red-600' : 'text-slate-500'">
              {{
                row.isOver
                  ? t('management.expenseSummary.overByLabel')
                  : t('management.expenseSummary.remainingLabel')
              }}
            </span>
            <span
              class="ml-1.5 font-semibold"
              :class="row.isOver ? 'text-red-600' : 'text-slate-900'"
            >
              {{ formatCurrency(Math.abs(row.remaining), row.currency) }}
            </span>
          </p>
        </div>
        <div class="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full transition-all duration-700 ease-out"
            :class="row.isOver ? 'bg-red-500' : row.percent >= 90 ? 'bg-amber-500' : 'bg-emerald-500'"
            :style="{ width: `${Math.min(row.percent, 100)}%` }"
          />
        </div>
      </section>
    </div>

    <!-- Empty state -->
    <div v-else class="py-12 text-center">
      <div
        class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20"
      >
        <Wallet class="h-7 w-7 text-[#2ecc71]" />
      </div>
      <p class="text-base font-semibold text-slate-900">
        {{ t('management.expenseSummary.empty.title') }}
      </p>
      <p class="mx-auto mt-1 max-w-md text-sm text-slate-500">
        {{ t('management.expenseSummary.empty.description') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { AlertCircle, RefreshCw, Wallet } from 'lucide-vue-next'
import { expensesService, expenseBudgetsService } from '@/services/api'

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
const { t } = useAppLanguage()

const loading = ref(false)
const error = ref<string | null>(null)
const summary = ref<ExpenseSummary | null>(null)
const abortController = ref<AbortController | null>(null)

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
      expensesService.getExpenses(props.eventId),
    ])

    // Check if request was cancelled
    if (abortController.value?.signal.aborted) {
      return
    }

    if (!budgetsResponse.success || !expensesResponse.success) {
      error.value = t('management.expenseSummary.error.loadFailed')
      return
    }

    const budgets = budgetsResponse.data?.results || []
    const expenses = expensesResponse.data?.results || []

    // Build summary from budgets and expenses
    const categoriesMap = new Map<string, CategorySummary>()
    const overallTotals: ExpenseSummary['overall_totals'] = {}

    // Process budgets first
    budgets.forEach((budget) => {
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
          is_over_budget: budget.is_over_budget,
        },
      })

      // Initialize overall totals
      if (!overallTotals[budget.currency]) {
        overallTotals[budget.currency] = {
          total_budget: 0,
          total_expenses: 0,
          expense_count: 0,
        }
      }
      overallTotals[budget.currency].total_budget += parseFloat(budget.budgeted_amount)
    })

    // Process expenses
    expenses.forEach((expense) => {
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
          expense_count: 0,
        })
      }

      const category = categoriesMap.get(key)!
      category.expense_count++

      // Initialize overall totals if needed
      if (!overallTotals[expense.currency]) {
        overallTotals[expense.currency] = {
          total_budget: 0,
          total_expenses: 0,
          expense_count: 0,
        }
      }
      overallTotals[expense.currency].total_expenses += parseFloat(expense.amount)
      overallTotals[expense.currency].expense_count++
    })

    summary.value = {
      categories: Array.from(categoriesMap.values()),
      overall_totals: overallTotals,
    }
  } catch (err: unknown) {
    // Don't show error if request was aborted
    if ((err as Error)?.name === 'AbortError' || abortController.value?.signal.aborted) {
      return
    }
    error.value = t('management.expenseSummary.error.unexpected')
    console.error('Error loading expense summary:', err)
  } finally {
    loading.value = false
  }
}

// Flattened per-currency rows for the template, largest budget first.
interface CurrencyRow {
  currency: string
  totalBudget: number
  totalExpenses: number
  expenseCount: number
  remaining: number
  percent: number
  isOver: boolean
}

const currencyTotals = computed<CurrencyRow[]>(() => {
  if (!summary.value) return []
  return Object.entries(summary.value.overall_totals)
    .map(([currency, totals]) => ({
      currency,
      totalBudget: totals.total_budget,
      totalExpenses: totals.total_expenses,
      expenseCount: totals.expense_count,
      remaining: totals.total_budget - totals.total_expenses,
      percent:
        totals.total_budget === 0
          ? 0
          : Math.round((totals.total_expenses / totals.total_budget) * 100),
      isOver: totals.total_expenses > totals.total_budget,
    }))
    .sort((a, b) => b.totalBudget - a.totalBudget)
})

const formatCurrency = (amount: number, currency: string): string => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

const getBudgetedCategoriesCount = (currency: string): number => {
  if (!summary.value) return 0
  return summary.value.categories.filter((cat) => cat.currency === currency && cat.budget)
    .length
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
  refresh: () => loadSummary(true), // Pass silent=true to avoid loading flicker
})
</script>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .transition-all,
  .transition-colors {
    transition: none !important;
  }
}
</style>
