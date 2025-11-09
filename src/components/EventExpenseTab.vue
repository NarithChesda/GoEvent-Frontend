<template>
  <div class="space-y-6">
    <!-- Header with Sub-navigation -->
    <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg shadow-emerald-500/10 overflow-hidden">
      <!-- Title Section -->
      <div class="px-6 py-4 border-b border-slate-200/80">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
            <DollarSign class="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-slate-900">Expense Tracking</h2>
            <p class="text-sm text-slate-500">Manage budgets and track spending</p>
          </div>
        </div>
      </div>

      <!-- Sub-navigation Tabs -->
      <div class="px-4 bg-slate-50/50">
        <div class="flex gap-2 overflow-x-auto scrollbar-hide py-3">
          <button
            v-for="tab in subTabs"
            :key="tab.id"
            @click="activeSubTab = tab.id"
            :class="[
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap',
              activeSubTab === tab.id
                ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
            ]"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="min-h-[400px]">
      <!-- Summary View -->
      <ExpenseSummaryView
        v-if="activeSubTab === 'summary'"
        :event-id="eventId"
        :key="summaryRefreshKey"
      />

      <!-- Budgets View -->
      <ExpenseBudgetsView
        v-if="activeSubTab === 'budgets'"
        ref="budgetsViewRef"
        :event-id="eventId"
        :can-edit="canEdit"
        @create-category="handleCreateCategory"
        @create-budget="openQuickAddBudget"
      />

      <!-- Expenses View -->
      <ExpenseRecordsView
        v-if="activeSubTab === 'expenses'"
        ref="expensesViewRef"
        :event-id="eventId"
        :can-edit="canEdit"
        @create-category="handleCreateCategory"
        @create-expense="openQuickAddExpense"
      />

      <!-- Categories View -->
      <ExpenseCategoriesView
        v-if="activeSubTab === 'categories'"
        ref="categoriesViewRef"
        @category-updated="handleCategoryUpdated"
        @create-category="openQuickAddCategory"
      />
    </div>

    <!-- Quick Add Modal -->
    <QuickAddModal
      :show="showQuickAddModal"
      :event-id="eventId"
      :categories="categories"
      :budgets="budgets"
      :initial-type="quickAddInitialType"
      @close="showQuickAddModal = false"
      @success="handleQuickAddSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { DollarSign, BarChart3, Wallet, Receipt, FolderOpen, Zap } from 'lucide-vue-next'
import ExpenseSummaryView from './expense/ExpenseSummaryView.vue'
import ExpenseBudgetsView from './expense/ExpenseBudgetsView.vue'
import ExpenseRecordsView from './expense/ExpenseRecordsView.vue'
import ExpenseCategoriesView from './expense/ExpenseCategoriesView.vue'
import QuickAddModal from './expense/QuickAddModal.vue'
import {
  expenseCategoriesService,
  expenseBudgetsService,
  type ExpenseCategory,
  type ExpenseBudget
} from '@/services/api'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()

const activeSubTab = ref('summary')
const showQuickAddModal = ref(false)
const quickAddInitialType = ref<'expense' | 'budget' | 'category'>('expense')
const summaryRefreshKey = ref(0)

// Data for Quick Add Modal
const categories = ref<ExpenseCategory[]>([])
const budgets = ref<ExpenseBudget[]>([])

const subTabs = [
  { id: 'summary', label: 'Summary', icon: BarChart3 },
  { id: 'budgets', label: 'Budgets', icon: Wallet },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'categories', label: 'Categories', icon: FolderOpen },
]

// Refs for expense sub-views
const budgetsViewRef = ref<InstanceType<typeof ExpenseBudgetsView> | null>(null)
const expensesViewRef = ref<InstanceType<typeof ExpenseRecordsView> | null>(null)
const categoriesViewRef = ref<InstanceType<typeof ExpenseCategoriesView> | null>(null)

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

// Open Quick Add with context-aware defaults
const openQuickAdd = () => {
  // Set initial type based on active tab
  switch (activeSubTab.value) {
    case 'budgets':
      quickAddInitialType.value = 'budget'
      break
    case 'expenses':
      quickAddInitialType.value = 'expense'
      break
    case 'categories':
      quickAddInitialType.value = 'category'
      break
    default:
      quickAddInitialType.value = 'expense'
  }
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

// Handle Quick Add success - refresh data
const handleQuickAddSuccess = async (type: 'expense' | 'budget' | 'category') => {
  // Reload categories and budgets
  await loadCategoriesAndBudgets()

  // Refresh the appropriate view
  if (type === 'expense') {
    expensesViewRef.value?.reloadCategories()
    // Trigger summary refresh
    summaryRefreshKey.value++
  } else if (type === 'budget') {
    budgetsViewRef.value?.reloadCategories()
    // Trigger summary refresh
    summaryRefreshKey.value++
  } else if (type === 'category') {
    // Reload categories in all views
    expensesViewRef.value?.reloadCategories()
    budgetsViewRef.value?.reloadCategories()
    categoriesViewRef.value?.loadCategories()
  }
}

// Handle create category from expense modal
const handleCreateCategory = () => {
  // This is now handled within each view component (budgets/expenses)
  // to support nested modals
}

// Handle category updated event - reload categories in expenses and budgets views
const handleCategoryUpdated = () => {
  expensesViewRef.value?.reloadCategories()
  budgetsViewRef.value?.reloadCategories()
  loadCategoriesAndBudgets()
}

// Load data on mount
onMounted(() => {
  loadCategoriesAndBudgets()
})

// Expose methods for parent component (Smart FAB) and sub-tab tracking
defineExpose({
  openAddBudgetModal: () => {
    quickAddInitialType.value = 'budget'
    showQuickAddModal.value = true
  },
  openAddExpenseModal: () => {
    quickAddInitialType.value = 'expense'
    showQuickAddModal.value = true
  },
  openAddCategoryModal: () => {
    quickAddInitialType.value = 'category'
    showQuickAddModal.value = true
  },
  openQuickAdd,
  getActiveSubTab: () => activeSubTab.value,
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
