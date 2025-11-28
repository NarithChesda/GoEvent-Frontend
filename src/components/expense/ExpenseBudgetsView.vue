<template>
  <div class="space-y-6">
    <!-- Filter and Actions Bar -->
    <div class="sticky top-0 z-20">
      <div class="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm">
        <div class="flex items-center gap-3 p-3">
          <!-- Filter Dropdown -->
          <div class="relative" ref="filterContainer">
            <button
              @click="isFilterDropdownOpen = !isFilterDropdownOpen"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border"
              :class="activeFilter === 'all'
                ? 'text-slate-700 bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                : 'text-white border-transparent'"
              :style="activeFilter !== 'all' && selectedCategory ? {
                backgroundColor: selectedCategory.color || '#10b981'
              } : {}"
            >
              <component
                :is="activeFilter === 'all' ? Filter : getIconComponent(selectedCategory?.icon || 'Wallet')"
                class="w-4 h-4 flex-shrink-0"
                :class="activeFilter === 'all' ? 'text-slate-500' : 'text-white/80'"
              />
              <span class="truncate max-w-[100px] sm:max-w-[160px]">
                {{ activeFilter === 'all' ? 'All Categories' : selectedCategory?.name || 'Select' }}
              </span>
              <ChevronDown
                class="w-4 h-4 transition-transform flex-shrink-0"
                :class="[{ 'rotate-180': isFilterDropdownOpen }, activeFilter === 'all' ? 'text-slate-400' : 'text-white/80']"
              />
            </button>

            <!-- Dropdown Menu -->
            <Transition name="dropdown">
              <div
                v-if="isFilterDropdownOpen"
                class="absolute top-full left-0 mt-2 min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 z-[100] max-h-[320px] overflow-y-auto"
                @click.stop
              >
                <div class="p-1.5">
                  <!-- All Categories Option -->
                  <button
                    @click="selectFilter('all')"
                    :class="[
                      'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                      activeFilter === 'all'
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    ]"
                  >
                    <Filter class="w-4 h-4 text-slate-400" />
                    <span class="flex-1 text-left">All Categories</span>
                    <span class="text-xs text-slate-400 tabular-nums">{{ budgets.length }}</span>
                  </button>

                  <!-- Divider -->
                  <div v-if="budgets.length > 0" class="my-1.5 border-t border-slate-100"></div>

                  <!-- Individual Categories from Budgets -->
                  <button
                    v-for="budget in budgets"
                    :key="budget.id"
                    @click="selectFilter(budget.category.toString())"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150"
                    :class="activeFilter === budget.category.toString() ? 'text-white' : 'text-slate-700 hover:bg-slate-50'"
                    :style="activeFilter === budget.category.toString() ? {
                      backgroundColor: budget.category_info.color || '#10b981'
                    } : {}"
                  >
                    <component
                      v-if="activeFilter !== budget.category.toString()"
                      :is="getIconComponent(budget.category_info.icon)"
                      class="w-4 h-4 flex-shrink-0"
                      :style="{ color: budget.category_info.color || '#10b981' }"
                    />
                    <component
                      v-else
                      :is="getIconComponent(budget.category_info.icon)"
                      class="w-4 h-4 flex-shrink-0 text-white/80"
                    />
                    <span class="flex-1 text-left truncate">{{ budget.category_info.name }}</span>
                    <span
                      class="text-xs tabular-nums"
                      :class="activeFilter === budget.category.toString() ? 'text-white/70' : 'text-slate-400'"
                    >
                      {{ budget.percentage_used.toFixed(0) }}%
                    </span>
                  </button>
                </div>
              </div>
            </Transition>

            <!-- Click outside to close dropdown -->
            <div
              v-if="isFilterDropdownOpen"
              @click="isFilterDropdownOpen = false"
              class="fixed inset-0 z-[90]"
            ></div>
          </div>

          <!-- Divider -->
          <div class="w-px h-5 bg-slate-200 hidden sm:block"></div>

          <!-- Budget Count -->
          <div class="hidden sm:flex items-center gap-1 text-sm text-slate-500 tabular-nums flex-shrink-0">
            <span class="font-medium text-slate-700">{{ filteredBudgets.length }}</span>
            <span>budget{{ filteredBudgets.length !== 1 ? 's' : '' }}</span>
          </div>

          <!-- Spacer -->
          <div class="flex-1"></div>

          <!-- Quick Add Button -->
          <button
            v-if="canEdit"
            @click="$emit('create-budget')"
            class="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all duration-200 flex-shrink-0"
          >
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline">Quick Add</span>
          </button>
        </div>
      </div>
    </div>

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
          <h4 class="font-semibold text-red-900 mb-1">Error Loading Budgets</h4>
          <p class="text-sm text-red-700">{{ error }}</p>
          <button @click="loadBudgets" class="mt-3 text-sm font-medium text-red-600 hover:text-red-700">
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Budget List - Collapsible with Expense Items -->
    <div v-else class="space-y-3">
      <!-- Dynamic Budget Cards -->
      <div
        v-for="budget in filteredBudgets"
        :key="budget.id"
        class="bg-white/80 border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:bg-white overflow-hidden transition-all duration-200"
      >
        <!-- Budget Header (Clickable) - Compact -->
        <div
          @click="toggleBudget(budget.id)"
          class="group relative px-4 py-3 cursor-pointer transition-colors"
        >
          <div class="flex items-center gap-3">
            <!-- Icon -->
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              :style="{ backgroundColor: `${budget.category_info.color}12` }"
            >
              <component
                :is="getIconComponent(budget.category_info.icon)"
                class="w-4.5 h-4.5"
                :style="{ color: budget.category_info.color }"
              />
            </div>

            <!-- Info Section -->
            <div class="flex-1 min-w-0">
              <!-- Top Row: Name + Badge + Amount -->
              <div class="flex items-center justify-between gap-2 mb-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <h4 class="font-semibold text-slate-900 truncate">{{ budget.category_info.name }}</h4>
                  <span
                    v-if="budget.is_over_budget"
                    class="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase tracking-wide flex-shrink-0"
                  >
                    Over
                  </span>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span class="font-bold text-slate-900 tabular-nums">
                    {{ formatAmount(budget.spent_amount, budget.currency) }}
                  </span>
                  <span class="text-xs text-slate-400">/</span>
                  <span class="text-sm font-medium text-slate-500 tabular-nums">
                    {{ formatAmount(budget.budgeted_amount, budget.currency) }}
                  </span>
                </div>
              </div>

              <!-- Bottom Row: Progress + Stats -->
              <div class="flex items-center gap-3">
                <!-- Progress Bar -->
                <div class="flex-1 min-w-0">
                  <div class="relative h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      class="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      :class="budget.is_over_budget ? 'bg-red-500' : budget.percentage_used >= 90 ? 'bg-amber-500' : 'bg-emerald-500'"
                      :style="{ width: `${Math.min(budget.percentage_used, 100)}%` }"
                    ></div>
                  </div>
                </div>

                <!-- Stats -->
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span
                    class="text-xs font-semibold tabular-nums"
                    :class="budget.is_over_budget ? 'text-red-600' : budget.percentage_used >= 90 ? 'text-amber-600' : 'text-emerald-600'"
                  >
                    {{ budget.percentage_used.toFixed(0) }}%
                  </span>
                  <span class="text-xs text-slate-400">•</span>
                  <span class="text-xs text-slate-500">
                    {{ getExpenseCount(budget.category) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions + Expand -->
            <div class="flex items-center gap-0.5 flex-shrink-0">
              <!-- Edit -->
              <button
                v-if="canEdit"
                @click.stop="editBudget(budget)"
                :aria-label="`Edit budget for ${budget.category_info.name}`"
                title="Edit budget"
                class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <Edit2 class="w-4 h-4" />
              </button>

              <!-- Delete -->
              <button
                v-if="canEdit"
                @click.stop="confirmDeleteBudget(budget)"
                :aria-label="`Delete budget for ${budget.category_info.name}`"
                title="Delete budget"
                class="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 class="w-4 h-4" />
              </button>

              <!-- Expand indicator -->
              <div class="w-6 flex justify-center">
                <ChevronDown
                  class="w-4 h-4 text-slate-400 transition-transform duration-200"
                  :class="{ 'rotate-180': isBudgetExpanded(budget.id) }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Expense Items (Collapsible) -->
        <Transition name="slide-down">
          <div v-if="isBudgetExpanded(budget.id)" class="border-t border-slate-100">
            <div class="px-3 sm:px-4 py-2.5 bg-slate-50/40">
              <!-- Loading expenses -->
              <div v-if="loadingExpenses" class="flex justify-center py-3">
                <div class="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>

              <!-- Expense items -->
              <div
                v-else-if="getBudgetExpenses(budget.category).length > 0"
                class="space-y-2"
              >
                <div
                  v-for="expense in getBudgetExpenses(budget.category)"
                  :key="expense.id"
                  class="bg-white/80 border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:bg-white transition-all duration-200 group"
                >
                  <div class="flex items-center gap-3 px-4 py-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-2 mb-1">
                        <h5 class="font-semibold text-slate-900 truncate">{{ expense.description }}</h5>
                        <span class="font-medium text-slate-900 tabular-nums flex-shrink-0">
                          {{ formatAmount(expense.amount, expense.currency) }}
                        </span>
                      </div>
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <div class="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-medium">
                          <span>{{ formatDate(expense.date) }}</span>
                        </div>
                        <div v-if="expense.paid_to" class="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                          <span class="truncate max-w-[100px]">{{ expense.paid_to }}</span>
                        </div>
                        <div v-if="expense.receipt" class="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">
                          <Paperclip class="w-3 h-3" />
                          <span>Receipt</span>
                        </div>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div v-if="canEdit" class="flex items-center gap-0.5 flex-shrink-0">
                      <!-- Edit -->
                      <button
                        @click.stop="editExpense(expense)"
                        :aria-label="`Edit expense ${expense.description}`"
                        title="Edit expense"
                        class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit2 class="w-4 h-4" />
                      </button>

                      <!-- Delete -->
                      <button
                        @click.stop="confirmDeleteExpense(expense)"
                        :aria-label="`Delete expense ${expense.description}`"
                        title="Delete expense"
                        class="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- No expenses -->
              <div v-else class="text-center py-4">
                <p class="text-xs text-slate-400">No expenses recorded yet</p>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Empty State - No budgets at all -->
      <div
        v-if="budgets.length === 0"
        class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center"
      >
        <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wallet class="w-8 h-8 text-slate-400" />
        </div>
        <h4 class="font-semibold text-slate-900 mb-2">No Budgets Yet</h4>
        <p class="text-sm text-slate-500 mb-4">Create budgets to track spending for different categories</p>
        <button
          v-if="canEdit"
          @click="$emit('create-budget')"
          class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all"
        >
          <Plus class="w-4 h-4" />
          Add Your First Budget
        </button>
      </div>

      <!-- Empty State - Filter has no results -->
      <div
        v-else-if="filteredBudgets.length === 0 && activeFilter !== 'all'"
        class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center"
      >
        <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Filter class="w-6 h-6 text-slate-400" />
        </div>
        <h4 class="font-semibold text-slate-900 mb-1">No Budget Found</h4>
        <p class="text-sm text-slate-500 mb-3">The selected category doesn't have a budget yet</p>
        <button
          @click="selectFilter('all')"
          class="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          View all budgets
        </button>
      </div>
    </div>

    <!-- Delete Budget Confirmation Modal -->
    <DeleteConfirmModal
      :show="!!deletingBudget"
      :loading="submitting"
      title="Delete Budget"
      :item-name="deletingBudget ? `Budget for ${deletingBudget.category_info.name}` : undefined"
      warning-message="Expenses will remain but won't have budget tracking."
      @confirm="handleDelete"
      @cancel="deletingBudget = null"
    />

    <!-- Delete Expense Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteExpenseModal"
      :loading="submitting"
      title="Delete Expense"
      :item-name="deletingExpense ? deletingExpense.description : undefined"
      @confirm="handleDeleteExpense"
      @cancel="() => { showDeleteExpenseModal = false; deletingExpense = null }"
    />

    <!-- Success Toast -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="showSuccessToast"
          role="status"
          aria-live="polite"
          class="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[200]"
        >
          <div class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <Check class="w-4 h-4" />
          </div>
          <span class="font-medium">{{ successMessage }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Edit2,
  Trash2,
  AlertCircle,
  Check,
  Wallet,
  ChevronDown,
  Plus,
  Paperclip,
  Filter
} from 'lucide-vue-next'
import {
  expenseBudgetsService,
  expenseCategoriesService,
  expensesService,
  type ExpenseBudget,
  type ExpenseCategory,
  type ExpenseRecord
} from '@/services/api'
import { useExpenseIcons } from '@/composables/useExpenseIcons'
import { useSuccessToast } from '@/composables/useSuccessToast'
import { getErrorMessage } from '@/utils/errorMessages'
import {
  updateBudgetAfterExpenseDelete,
  cloneBudget,
  parseExpenseAmount
} from '@/utils/budgetCalculations'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'create-category': []
  'create-budget': []
  'edit-budget': [budget: ExpenseBudget]
  'edit-expense': [expense: ExpenseRecord]
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const budgets = ref<ExpenseBudget[]>([])
const categories = ref<ExpenseCategory[]>([])
const deletingBudget = ref<ExpenseBudget | null>(null)
const submitting = ref(false)

// Expense management
const expenses = ref<ExpenseRecord[]>([])
const loadingExpenses = ref(false)
const expandedBudgets = ref<number[]>([])
const deletingExpense = ref<ExpenseRecord | null>(null)
const showDeleteExpenseModal = ref(false)

// Filter state
const activeFilter = ref<string>('all')
const isFilterDropdownOpen = ref(false)
const filterContainer = ref<HTMLElement | null>(null)

// Computed properties for filtering
const filteredBudgets = computed(() => {
  if (activeFilter.value === 'all') {
    return budgets.value
  }
  return budgets.value.filter(b => b.category.toString() === activeFilter.value)
})

const selectedCategory = computed(() => {
  if (activeFilter.value === 'all') return null
  const budget = budgets.value.find(b => b.category.toString() === activeFilter.value)
  return budget?.category_info || null
})

// Filter methods
const selectFilter = (filter: string) => {
  activeFilter.value = filter
  isFilterDropdownOpen.value = false
}

// Use composables
const { showToast: showSuccessToast, message: successMessage, showSuccess } = useSuccessToast()

// Use shared icon utilities
const { getIconComponent } = useExpenseIcons()

// Format amount with currency
const formatAmount = (amount: string | number, currency: string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  const symbol = currency === 'USD' ? '$' : currency === 'KHR' ? '៛' : currency

  if (currency === 'KHR') {
    return `${symbol}${numAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  return `${symbol}${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Toggle budget expansion
const toggleBudget = async (budgetId: number) => {
  const index = expandedBudgets.value.indexOf(budgetId)
  if (index > -1) {
    expandedBudgets.value.splice(index, 1)
  } else {
    expandedBudgets.value.push(budgetId)
    // Load expenses when expanding for the first time
    if (expenses.value.length === 0) {
      await loadExpenses()
    }
  }
}

// Check if budget is expanded
const isBudgetExpanded = (budgetId: number): boolean => {
  return expandedBudgets.value.includes(budgetId)
}

// Get expense count for a category
const getExpenseCount = (categoryId: number): number => {
  return expenses.value.filter(e => e.category === categoryId).length
}

// Get expenses for a budget
const getBudgetExpenses = (categoryId: number): ExpenseRecord[] => {
  return expenses.value.filter(e => e.category === categoryId)
}

const loadBudgets = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await expenseBudgetsService.getBudgets(props.eventId)

    if (response.success && response.data) {
      budgets.value = response.data.results
    } else {
      error.value = response.message || 'Failed to load budgets'
    }
  } catch (err) {
    error.value = getErrorMessage(err, 'load budgets')
    console.error('Error loading budgets:', err)
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const response = await expenseCategoriesService.getCategories()

    if (response.success && response.data) {
      categories.value = response.data.results
    }
  } catch (err) {
    console.error('Error loading categories:', err)
  }
}

const loadExpenses = async () => {
  loadingExpenses.value = true

  try {
    const response = await expensesService.getExpenses(props.eventId)

    if (response.success && response.data) {
      expenses.value = response.data.results
    }
  } catch (err) {
    console.error('Error loading expenses:', err)
  } finally {
    loadingExpenses.value = false
  }
}

// Expense edit and delete handlers
const editExpense = (expense: ExpenseRecord) => {
  emit('edit-expense', expense)
}

const confirmDeleteExpense = (expense: ExpenseRecord) => {
  deletingExpense.value = expense
  showDeleteExpenseModal.value = true
}

const handleDeleteExpense = async () => {
  if (!deletingExpense.value) return

  submitting.value = true
  const deletedId = deletingExpense.value.id
  const deletedExpense = { ...deletingExpense.value } // Keep a copy for rollback

  try {
    // Optimistic update: Remove from local list immediately
    expenses.value = expenses.value.filter(expense => expense.id !== deletedId)

    // Optimistic update: Update affected budget locally using helper
    const affectedBudget = budgets.value.find(b => b.category === deletedExpense.category)
    let previousBudgetState: ExpenseBudget | null = null

    if (affectedBudget) {
      // Keep copy for rollback using helper
      previousBudgetState = cloneBudget(affectedBudget)

      // Update budget metrics using helper function
      const expenseAmount = parseExpenseAmount(deletedExpense.amount)
      updateBudgetAfterExpenseDelete(affectedBudget, expenseAmount)
    }

    // Close modal immediately for better UX
    deletingExpense.value = null
    showDeleteExpenseModal.value = false
    showSuccess('Expense deleted successfully!')

    // Make API call
    const response = await expensesService.deleteExpense(
      props.eventId,
      deletedId
    )

    if (!response.success) {
      // Rollback on failure
      expenses.value.push(deletedExpense)

      if (affectedBudget && previousBudgetState) {
        Object.assign(affectedBudget, previousBudgetState)
      }

      error.value = response.message || 'Failed to delete expense'
    }
  } catch (err) {
    // Rollback on error
    expenses.value.push(deletedExpense)

    const affectedBudget = budgets.value.find(b => b.category === deletedExpense.category)
    if (affectedBudget) {
      // Reload just this budget to get accurate data
      await loadBudgets()
    }

    error.value = getErrorMessage(err, 'delete expense')
    console.error('Error deleting expense:', err)
  } finally {
    submitting.value = false
  }
}

const confirmDeleteBudget = (budget: ExpenseBudget) => {
  deletingBudget.value = budget
}

const handleDelete = async () => {
  if (!deletingBudget.value) return

  submitting.value = true
  const deletedId = deletingBudget.value.id
  const deletedBudget = cloneBudget(deletingBudget.value) // Keep a copy for rollback using helper

  try {
    // Optimistic update: Remove from local list immediately
    budgets.value = budgets.value.filter(budget => budget.id !== deletedId)

    // Close modal immediately for better UX
    deletingBudget.value = null
    showSuccess('Budget deleted successfully!')

    // Make API call
    const response = await expenseBudgetsService.deleteBudget(
      props.eventId,
      deletedId
    )

    if (!response.success) {
      // Rollback on failure
      budgets.value.push(deletedBudget)
      error.value = response.message || 'Failed to delete budget'
    }
  } catch (err) {
    // Rollback on error
    budgets.value.push(deletedBudget)
    error.value = getErrorMessage(err, 'delete budget')
    console.error('Error deleting budget:', err)
  } finally {
    submitting.value = false
  }
}

// Edit budget functions
const editBudget = (budget: ExpenseBudget) => {
  emit('edit-budget', budget)
}


onMounted(async () => {
  await Promise.all([loadBudgets(), loadCategories()])
})

onUnmounted(() => {
  // Clean up state to prevent memory leaks
  deletingBudget.value = null
})

// Methods to update local state without reloading
const updateLocalBudget = (updatedBudget: ExpenseBudget) => {
  const index = budgets.value.findIndex(b => b.id === updatedBudget.id)
  if (index >= 0) {
    budgets.value[index] = updatedBudget
  } else {
    budgets.value.push(updatedBudget)
  }
}

const updateLocalExpense = (updatedExpense: ExpenseRecord) => {
  const index = expenses.value.findIndex(e => e.id === updatedExpense.id)
  if (index >= 0) {
    // Update existing expense
    const oldExpense = expenses.value[index]
    expenses.value[index] = updatedExpense

    // Update affected budgets if category or amount changed
    if (oldExpense.category === updatedExpense.category) {
      // Same category - update budget with amount difference
      const affectedBudget = budgets.value.find(b => b.category === updatedExpense.category)
      if (affectedBudget) {
        const oldAmount = parseExpenseAmount(oldExpense.amount)
        const newAmount = parseExpenseAmount(updatedExpense.amount)
        const difference = newAmount - oldAmount

        const newSpent = parseFloat(affectedBudget.spent_amount) + difference
        affectedBudget.spent_amount = newSpent.toString()
        affectedBudget.percentage_used = (newSpent / parseFloat(affectedBudget.budgeted_amount)) * 100
        affectedBudget.is_over_budget = newSpent > parseFloat(affectedBudget.budgeted_amount)
      }
    } else {
      // Category changed - update both old and new budgets
      const oldBudget = budgets.value.find(b => b.category === oldExpense.category)
      const newBudget = budgets.value.find(b => b.category === updatedExpense.category)

      if (oldBudget) {
        const oldAmount = parseExpenseAmount(oldExpense.amount)
        updateBudgetAfterExpenseDelete(oldBudget, oldAmount)
      }

      if (newBudget) {
        const newAmount = parseExpenseAmount(updatedExpense.amount)
        const newSpent = parseFloat(newBudget.spent_amount) + newAmount
        newBudget.spent_amount = newSpent.toString()
        newBudget.percentage_used = (newSpent / parseFloat(newBudget.budgeted_amount)) * 100
        newBudget.is_over_budget = newSpent > parseFloat(newBudget.budgeted_amount)
      }
    }
  } else {
    // Add new expense
    expenses.value.push(updatedExpense)

    // Update budget
    const affectedBudget = budgets.value.find(b => b.category === updatedExpense.category)
    if (affectedBudget) {
      const amount = parseExpenseAmount(updatedExpense.amount)
      const newSpent = parseFloat(affectedBudget.spent_amount) + amount
      affectedBudget.spent_amount = newSpent.toString()
      affectedBudget.percentage_used = (newSpent / parseFloat(affectedBudget.budgeted_amount)) * 100
      affectedBudget.is_over_budget = newSpent > parseFloat(affectedBudget.budgeted_amount)
    }
  }
}

const addLocalExpense = (newExpense: ExpenseRecord) => {
  // Only add if expenses are loaded (to avoid duplicates when lazy loading)
  if (expenses.value.length > 0 || expandedBudgets.value.length > 0) {
    expenses.value.push(newExpense)
  }

  // Update affected budget
  const affectedBudget = budgets.value.find(b => b.category === newExpense.category)
  if (affectedBudget) {
    const amount = parseExpenseAmount(newExpense.amount)
    const newSpent = parseFloat(affectedBudget.spent_amount) + amount
    affectedBudget.spent_amount = newSpent.toString()
    affectedBudget.percentage_used = (newSpent / parseFloat(affectedBudget.budgeted_amount)) * 100
    affectedBudget.is_over_budget = newSpent > parseFloat(affectedBudget.budgeted_amount)
  }
}

// Expose methods for parent component
defineExpose({
  reloadCategories: () => {
    loadCategories()
  },
  reloadBudgets: () => {
    loadBudgets()
  },
  reloadExpenses: () => {
    loadExpenses()
  },
  reloadAll: async () => {
    await Promise.all([loadBudgets(), loadCategories(), loadExpenses()])
  },
  // New methods for optimistic updates
  updateLocalBudget,
  updateLocalExpense,
  addLocalExpense
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Custom scrollbar for modal content */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 1000px;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
