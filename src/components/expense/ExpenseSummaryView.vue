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
      <!-- Overall Totals Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Total Budget Card -->
        <div
          v-for="currency in Object.keys(summary.overall_totals)"
          :key="`budget-${currency}`"
          class="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 rounded-2xl p-6 shadow-lg shadow-blue-500/10"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
              <Wallet class="w-6 h-6 text-white" />
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-blue-600">Total Budget</p>
              <p class="text-2xl font-bold text-blue-900">
                {{ formatCurrency(summary.overall_totals[currency].total_budget, currency) }}
              </p>
            </div>
          </div>
          <div class="pt-3 border-t border-blue-200/50">
            <p class="text-xs text-blue-600">{{ currency }} - {{ getBudgetedCategoriesCount(currency) }} categories</p>
          </div>
        </div>

        <!-- Total Spent Card -->
        <div
          v-for="currency in Object.keys(summary.overall_totals)"
          :key="`spent-${currency}`"
          :class="[
            'border rounded-2xl p-6 shadow-lg',
            isOverBudget(currency)
              ? 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/50 shadow-red-500/10'
              : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50 shadow-emerald-500/10'
          ]"
        >
          <div class="flex items-start justify-between mb-3">
            <div
              :class="[
                'w-12 h-12 rounded-xl flex items-center justify-center shadow-md',
                isOverBudget(currency) ? 'bg-red-500' : 'bg-emerald-500'
              ]"
            >
              <TrendingUp class="w-6 h-6 text-white" />
            </div>
            <div class="text-right">
              <p :class="['text-sm font-medium', isOverBudget(currency) ? 'text-red-600' : 'text-emerald-600']">
                Total Spent
              </p>
              <p :class="['text-2xl font-bold', isOverBudget(currency) ? 'text-red-900' : 'text-emerald-900']">
                {{ formatCurrency(summary.overall_totals[currency].total_expenses, currency) }}
              </p>
            </div>
          </div>
          <div :class="['pt-3 border-t', isOverBudget(currency) ? 'border-red-200/50' : 'border-emerald-200/50']">
            <p :class="['text-xs', isOverBudget(currency) ? 'text-red-600' : 'text-emerald-600']">
              {{ summary.overall_totals[currency].expense_count }} expenses recorded
            </p>
          </div>
        </div>

        <!-- Remaining/Over Budget Card -->
        <div
          v-for="currency in Object.keys(summary.overall_totals)"
          :key="`remaining-${currency}`"
          :class="[
            'border rounded-2xl p-6 shadow-lg',
            isOverBudget(currency)
              ? 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/50 shadow-red-500/10'
              : 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50 shadow-emerald-500/10'
          ]"
        >
          <div class="flex items-start justify-between mb-3">
            <div
              :class="[
                'w-12 h-12 rounded-xl flex items-center justify-center shadow-md',
                isOverBudget(currency) ? 'bg-red-500' : 'bg-emerald-500'
              ]"
            >
              <AlertCircle v-if="isOverBudget(currency)" class="w-6 h-6 text-white" />
              <DollarSign v-else class="w-6 h-6 text-white" />
            </div>
            <div class="text-right">
              <p :class="['text-sm font-medium', isOverBudget(currency) ? 'text-red-600' : 'text-emerald-600']">
                {{ isOverBudget(currency) ? 'Over Budget' : 'Remaining' }}
              </p>
              <p :class="['text-2xl font-bold', isOverBudget(currency) ? 'text-red-900' : 'text-emerald-900']">
                {{ formatCurrency(getRemainingBudget(currency), currency) }}
              </p>
            </div>
          </div>
          <div :class="['pt-3 border-t', isOverBudget(currency) ? 'border-red-200/50' : 'border-emerald-200/50']">
            <p :class="['text-xs', isOverBudget(currency) ? 'text-red-600' : 'text-emerald-600']">
              {{ getBudgetPercentage(currency) }}% of budget used
            </p>
          </div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg shadow-emerald-500/10 p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-slate-900">Category Breakdown</h3>
          <div class="flex items-center gap-2">
            <button
              v-for="currency in Object.keys(summary.overall_totals)"
              :key="`filter-${currency}`"
              @click="selectedCurrency = currency"
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                selectedCurrency === currency
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              {{ currency }}
            </button>
          </div>
        </div>

        <!-- Category Items -->
        <div class="space-y-4">
          <div
            v-for="category in filteredCategories"
            :key="category.category_id"
            :class="[
              'group p-4 rounded-xl transition-all duration-300',
              category.budget?.is_over_budget
                ? 'bg-red-50/50 hover:bg-red-100/50 border border-red-200/50'
                : 'bg-slate-50/50 hover:bg-slate-100/50'
            ]"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
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
                  <p class="text-xs text-slate-500">{{ category.expense_count }} expense{{ category.expense_count !== 1 ? 's' : '' }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-bold text-slate-900">{{ formatCurrency(category.total_amount, category.currency) }}</p>
                <p v-if="category.budget" class="text-xs text-slate-500">
                  of {{ formatCurrency(category.budget.budgeted_amount, category.budget.currency) }}
                </p>
                <p v-else class="text-xs text-amber-600">No budget set</p>
              </div>
            </div>

            <!-- Progress Bar (only if budget exists) -->
            <template v-if="category.budget">
              <div class="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  :class="[
                    'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                    category.budget.is_over_budget
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : 'bg-gradient-to-r from-emerald-500 to-green-500'
                  ]"
                  :style="{ width: Math.min(category.budget.percentage_used, 100) + '%' }"
                ></div>
              </div>

              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center gap-1">
                  <AlertTriangle v-if="category.budget.is_over_budget" class="w-3 h-3 text-red-600" />
                  <span
                    :class="[
                      'text-xs font-medium',
                      category.budget.is_over_budget ? 'text-red-600' : 'text-emerald-600'
                    ]"
                  >
                    {{ category.budget.percentage_used.toFixed(1) }}% used
                  </span>
                </div>
                <span
                  :class="[
                    'text-xs font-medium',
                    category.budget.is_over_budget ? 'text-red-600' : 'text-emerald-600'
                  ]"
                >
                  {{ category.budget.is_over_budget ? 'Over by ' : '' }}
                  {{ formatCurrency(Math.abs(category.budget.remaining_amount), category.budget.currency) }}
                  {{ category.budget.is_over_budget ? '' : ' remaining' }}
                </span>
              </div>
            </template>
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

      <!-- Recent Expenses -->
      <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg shadow-emerald-500/10 p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-slate-900">Top Expenses</h3>
        </div>

        <!-- Expense List (Show top 5 expenses) -->
        <div class="space-y-3">
          <div
            v-for="category in topExpenseCategories"
            :key="`top-${category.category_id}`"
            class="flex items-center gap-4 p-4 bg-slate-50/50 hover:bg-slate-100/50 rounded-xl transition-all duration-300"
          >
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
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
              <h4 class="font-semibold text-slate-900 truncate">{{ category.category_name }}</h4>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-slate-500">{{ category.expense_count }} expense{{ category.expense_count !== 1 ? 's' : '' }}</span>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="font-bold text-slate-900">{{ formatCurrency(category.total_amount, category.currency) }}</p>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="summary.categories.length === 0" class="text-center py-8">
          <p class="text-sm text-slate-500">No expenses recorded yet</p>
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <BarChart3 class="w-8 h-8 text-slate-400" />
      </div>
      <h4 class="font-semibold text-slate-600 mb-2">No Data Available</h4>
      <p class="text-sm text-slate-400">Start by creating budgets and recording expenses</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Wallet,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Building2,
  UtensilsCrossed,
  Palette,
  Camera,
  AlertTriangle,
  Folder,
  BarChart3,
  Music,
  Gift
} from 'lucide-vue-next'
import { expensesService, type ExpenseSummary } from '@/services/api'

interface Props {
  eventId: string
}

const props = defineProps<Props>()

const loading = ref(false)
const error = ref<string | null>(null)
const summary = ref<ExpenseSummary | null>(null)
const selectedCurrency = ref<string>('USD')

// Icon mapping for categories
const iconMap: Record<string, any> = {
  'fa-building': Building2,
  'fa-utensils': UtensilsCrossed,
  'fa-palette': Palette,
  'fa-camera': Camera,
  'fa-music': Music,
  'fa-gift': Gift,
}

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
  loading.value = true
  error.value = null

  try {
    const response = await expensesService.getExpenseSummary(props.eventId)

    if (response.success && response.data) {
      summary.value = response.data
      // Set default currency to the first available
      const currencies = Object.keys(response.data.overall_totals)
      if (currencies.length > 0) {
        selectedCurrency.value = currencies[0]
      }
    } else {
      error.value = response.message || 'Failed to load expense summary'
    }
  } catch (err) {
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
  // This would ideally come from the category info in the API response
  // For now, return a default color based on category ID
  const colors = ['#e74c3c', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#1abc9c', '#2ecc71']
  return colors[categoryId % colors.length]
}

const getCategoryIcon = (categoryId: number): any => {
  // This would ideally come from the category info in the API response
  // For now, return a default icon
  return null
}

onMounted(() => {
  loadSummary()
})
</script>
