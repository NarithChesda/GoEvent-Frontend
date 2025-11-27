<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">Expense Tracking</h2>
      <p class="text-xs sm:text-sm text-slate-600 mt-1">Manage budgets and track spending</p>
    </div>

    <!-- Unified Content Area -->
    <div class="space-y-6">
      <!-- Summary View -->
      <ExpenseSummaryView
        :event-id="eventId"
        :key="summaryRefreshKey"
      />

      <!-- Budgets View -->
      <ExpenseBudgetsView
        ref="budgetsViewRef"
        :event-id="eventId"
        :can-edit="canEdit"
        @create-category="handleCreateCategory"
        @create-budget="openQuickAddBudget"
        @edit-budget="handleEditBudget"
        @edit-expense="handleEditExpense"
      />
    </div>

    <!-- Quick Add Modal -->
    <QuickAddModal
      :show="showQuickAddModal"
      :event-id="eventId"
      :categories="categories"
      :budgets="budgets"
      :initial-type="quickAddInitialType"
      :edit-mode="isEditMode"
      :edit-data="editData"
      @close="handleCloseQuickAdd"
      @success="handleQuickAddSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ExpenseSummaryView from './expense/ExpenseSummaryView.vue'
import ExpenseBudgetsView from './expense/ExpenseBudgetsView.vue'
import QuickAddModal from './expense/QuickAddModal.vue'
import {
  expenseCategoriesService,
  expenseBudgetsService,
  type ExpenseCategory,
  type ExpenseBudget,
  type ExpenseRecord
} from '@/services/api'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()

const showQuickAddModal = ref(false)
const quickAddInitialType = ref<'expense' | 'budget' | 'category'>('expense')
const summaryRefreshKey = ref(0)
const isEditMode = ref(false)
const editData = ref<ExpenseBudget | ExpenseRecord | null>(null)

// Data for Quick Add Modal
const categories = ref<ExpenseCategory[]>([])
const budgets = ref<ExpenseBudget[]>([])

// Refs for expense sub-views
const budgetsViewRef = ref<InstanceType<typeof ExpenseBudgetsView> | null>(null)

// Load categories and budgets for Quick Add Modal
const loadCategoriesAndBudgets = async () => {
  try {
    const [categoriesResponse, budgetsResponse] = await Promise.all([
      expenseCategoriesService.getCategories(),
      expenseBudgetsService.getBudgets(props.eventId)
    ])

    if (categoriesResponse.success && categoriesResponse.data) {
      categories.value = categoriesResponse.data.results
    }

    if (budgetsResponse.success && budgetsResponse.data) {
      budgets.value = budgetsResponse.data.results
    }
  } catch (err) {
    console.error('Error loading categories and budgets:', err)
  }
}

// Open Quick Add with default type
const openQuickAdd = () => {
  // Default to expense
  quickAddInitialType.value = 'expense'
  showQuickAddModal.value = true
}

// Quick add handlers for specific types
const openQuickAddBudget = () => {
  quickAddInitialType.value = 'budget'
  showQuickAddModal.value = true
}

const openQuickAddExpense = () => {
  quickAddInitialType.value = 'expense'
  showQuickAddModal.value = true
}

const openQuickAddCategory = () => {
  quickAddInitialType.value = 'category'
  showQuickAddModal.value = true
}

// Edit handlers
const handleEditBudget = (budget: ExpenseBudget) => {
  quickAddInitialType.value = 'budget'
  isEditMode.value = true
  editData.value = budget
  showQuickAddModal.value = true
}

const handleEditExpense = (expense: ExpenseRecord) => {
  quickAddInitialType.value = 'expense'
  isEditMode.value = true
  editData.value = expense
  showQuickAddModal.value = true
}

// Close handler that resets edit mode
const handleCloseQuickAdd = () => {
  showQuickAddModal.value = false
  isEditMode.value = false
  editData.value = null
}

// Handle Quick Add success - refresh data
const handleQuickAddSuccess = async (type: 'expense' | 'budget' | 'category') => {
  // Reload categories and budgets for the modal
  await loadCategoriesAndBudgets()

  // Refresh the budgets view based on what was changed
  if (type === 'expense') {
    // Reload expenses and budgets (expenses affect budget spent amounts)
    budgetsViewRef.value?.reloadExpenses()
    budgetsViewRef.value?.reloadBudgets()
  } else if (type === 'budget') {
    // Reload budgets
    budgetsViewRef.value?.reloadBudgets()
  } else if (type === 'category') {
    // Reload categories
    budgetsViewRef.value?.reloadCategories()
  }

  // Trigger summary refresh
  summaryRefreshKey.value++

  // Reset edit mode after success
  isEditMode.value = false
  editData.value = null
}

// Handle create category from expense modal
const handleCreateCategory = () => {
  // This is now handled within each view component (budgets/expenses)
  // to support nested modals
}

// Load data on mount
onMounted(() => {
  loadCategoriesAndBudgets()
})

// Expose methods for parent component (Smart FAB)
defineExpose({
  openAddBudgetModal: () => {
    quickAddInitialType.value = 'budget'
    showQuickAddModal.value = true
  },
  openAddCategoryModal: () => {
    quickAddInitialType.value = 'category'
    showQuickAddModal.value = true
  },
  openQuickAdd,
})
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
