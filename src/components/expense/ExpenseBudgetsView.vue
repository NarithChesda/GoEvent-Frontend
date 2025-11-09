<template>
  <div class="space-y-6">
    <!-- Header with Add Budget Button -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-bold text-slate-900">Budget Management</h3>
        <p class="text-sm text-slate-500 mt-1">Set and track spending limits for each category</p>
      </div>
      <button
        v-if="canEdit"
        @click="showAddBudgetModal = true"
        class="hidden sm:flex flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
      >
        <Plus class="w-4 h-4" />
        <span>Add Budget</span>
      </button>
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

    <!-- Budget List -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Dynamic Budget Cards -->
      <div
        v-for="budget in budgets"
        :key="budget.id"
        :class="[
          'rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300',
          budget.is_over_budget
            ? 'bg-red-50/50 border border-red-200/50 shadow-red-500/10'
            : 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-emerald-500/10'
        ]"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center"
              :style="{ backgroundColor: `${budget.category_info.color}20` }"
            >
              <component
                :is="getIconComponent(budget.category_info.icon)"
                class="w-6 h-6"
                :style="{ color: budget.category_info.color }"
              />
            </div>
            <div>
              <h4 class="font-bold text-slate-900 flex items-center gap-2">
                {{ budget.category_info.name }}
                <span
                  v-if="budget.is_over_budget"
                  class="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full"
                >
                  Over Budget
                </span>
              </h4>
              <p class="text-xs text-slate-500">{{ budget.category_info.description || 'No description' }}</p>
            </div>
          </div>
          <div v-if="canEdit" class="flex items-center gap-1">
            <button
              @click="editBudget(budget)"
              :aria-label="`Edit budget for ${budget.category_info.name}`"
              title="Edit budget"
              class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              <Edit2 class="w-4 h-4" />
            </button>
            <button
              @click="confirmDeleteBudget(budget)"
              :aria-label="`Delete budget for ${budget.category_info.name}`"
              title="Delete budget"
              class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <!-- Budget Amount -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500">Budgeted</span>
            <span class="text-lg font-bold text-slate-900">{{ SUPPORTED_CURRENCIES.find(c => c.code === budget.currency)?.symbol || '$' }}{{ parseFloat(budget.budgeted_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>

          <!-- Spent Amount -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500">Spent</span>
            <span
              class="text-lg font-bold"
              :class="budget.is_over_budget ? 'text-red-600' : 'text-emerald-600'"
            >
              {{ SUPPORTED_CURRENCIES.find(c => c.code === budget.currency)?.symbol || '$' }}{{ parseFloat(budget.spent_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </span>
          </div>

          <!-- Remaining Amount -->
          <div
            class="flex items-center justify-between pb-3 border-b"
            :class="budget.is_over_budget ? 'border-red-200' : 'border-slate-200'"
          >
            <span class="text-sm text-slate-500">{{ budget.is_over_budget ? 'Over Budget' : 'Remaining' }}</span>
            <span
              class="text-lg font-bold"
              :class="budget.is_over_budget ? 'text-red-600' : 'text-blue-600'"
            >
              {{ SUPPORTED_CURRENCIES.find(c => c.code === budget.currency)?.symbol || '$' }}{{ Math.abs(parseFloat(budget.remaining_amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="pt-2">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-slate-600">Budget Usage</span>
              <div class="flex items-center gap-1">
                <AlertTriangle v-if="budget.is_over_budget" class="w-3 h-3 text-red-600" />
                <span
                  class="text-xs font-bold"
                  :class="budget.is_over_budget ? 'text-red-600' : budget.percentage_used >= 90 ? 'text-amber-600' : 'text-emerald-600'"
                >
                  {{ budget.percentage_used.toFixed(1) }}%
                </span>
              </div>
            </div>
            <div class="relative h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                class="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                :class="budget.is_over_budget ? 'bg-gradient-to-r from-red-500 to-red-600' : budget.percentage_used >= 90 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-emerald-500 to-green-500'"
                :style="{ width: `${Math.min(budget.percentage_used, 100)}%` }"
              ></div>
            </div>
          </div>

          <!-- Currency & Notes -->
          <div
            class="pt-3 border-t"
            :class="budget.is_over_budget ? 'border-red-200' : 'border-slate-200'"
          >
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-1 text-slate-500">
                <DollarSign class="w-3 h-3" />
                <span>{{ budget.currency }}</span>
              </div>
              <span class="text-slate-400 truncate max-w-[200px]">{{ budget.notes || 'No notes' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Budget Placeholder Card -->
      <div
        v-if="canEdit"
        @click="showAddBudgetModal = true"
        class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-6 hover:bg-slate-100/50 hover:border-emerald-400 transition-all duration-300 cursor-pointer group"
      >
        <div class="flex flex-col items-center justify-center h-full min-h-[280px]">
          <div class="w-16 h-16 bg-slate-200 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
            <Plus class="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          <h4 class="font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Add New Budget</h4>
          <p class="text-sm text-slate-400 mt-1">Set budget for another category</p>
        </div>
      </div>
    </div>

    <!-- Add Budget Modal -->
    <ExpenseModal
      :show="showAddBudgetModal"
      :title="editingBudget ? 'Edit Budget' : 'Add Budget'"
      :icon="DollarSign"
      icon-bg-class="bg-emerald-50 text-emerald-600"
      aria-label-id="add-budget-modal-title"
      :error="modalError"
      :submitting="submitting"
      :submit-text="editingBudget ? 'Update Budget' : 'Add Budget'"
      @close="closeModal"
      @submit="handleAddBudget"
    >
      <!-- Category Selection -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label for="budget-category" class="block text-sm font-medium text-slate-700">
            Category <span class="text-red-500">*</span>
          </label>
          <button
            type="button"
            @click="openCreateCategoryModal"
            class="text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
          >
            + Create Category
          </button>
        </div>
        <div class="relative">
          <select
            id="budget-category"
            v-model="newBudget.category_id"
            aria-required="true"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 appearance-none pr-10"
            required
          >
            <option value="">Select a category</option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown class="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </div>

      <!-- Budget Amount -->
      <div>
        <label for="budget-amount" class="block text-sm font-medium text-slate-700 mb-2">
          Budget Amount <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <DollarSign class="w-4 h-4 text-slate-400" />
          </div>
          <input
            id="budget-amount"
            type="number"
            v-model="newBudget.budgeted_amount"
            placeholder="0.00"
            step="0.01"
            min="0"
            aria-required="true"
            class="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
            required
          />
        </div>
      </div>

      <!-- Currency -->
      <div>
        <label for="budget-currency" class="block text-sm font-medium text-slate-700 mb-2">
          Currency <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <select
            id="budget-currency"
            v-model="newBudget.currency"
            aria-required="true"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 appearance-none pr-10"
            required
          >
            <option
              v-for="currency in SUPPORTED_CURRENCIES"
              :key="currency.code"
              :value="currency.code"
            >
              {{ currency.name }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown class="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div>
        <label for="budget-notes" class="block text-sm font-medium text-slate-700 mb-2">Notes</label>
        <textarea
          id="budget-notes"
          v-model="newBudget.notes"
          rows="3"
          placeholder="Add any notes about this budget..."
          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 resize-none"
        ></textarea>
      </div>
    </ExpenseModal>

    <!-- Create Category Modal (Nested) -->
    <ExpenseModal
      :show="showCategoryModal"
      title="Create Category"
      :icon="Palette"
      icon-bg-class="bg-purple-50 text-purple-600"
      icon-size-class="w-5 h-5"
      aria-label-id="create-category-modal-title"
      :error="categoryError"
      :submitting="categorySubmitting"
      submit-text="Create Category"
      z-index-class="z-[70]"
      @close="closeCategoryModal"
      @submit="handleCreateCategory"
    >
      <!-- Category Name -->
      <div>
        <label for="new-category-name" class="block text-sm font-medium text-slate-700 mb-2">
          Category Name <span class="text-red-500">*</span>
        </label>
        <input
          id="new-category-name"
          type="text"
          v-model="categoryFormData.name"
          placeholder="E.g., Venue, Catering, Photography..."
          maxlength="100"
          aria-required="true"
          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
          required
        />
      </div>

      <!-- Description -->
      <div>
        <label for="new-category-description" class="block text-sm font-medium text-slate-700 mb-2">Description</label>
        <textarea
          id="new-category-description"
          v-model="categoryFormData.description"
          rows="3"
          placeholder="Describe what expenses this category covers..."
          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 resize-none"
        ></textarea>
      </div>

      <!-- Color and Icon Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Category Color -->
        <div>
          <label for="new-category-color" class="block text-sm font-medium text-slate-700 mb-2">
            Category Color
          </label>
          <div class="flex items-center gap-3">
            <input
              id="new-category-color"
              v-model="categoryFormData.color"
              type="color"
              class="w-16 h-10 rounded-lg border border-slate-300 cursor-pointer"
            />
            <input
              id="new-category-color-hex"
              v-model="categoryFormData.color"
              type="text"
              placeholder="#3498db"
              aria-label="Color hex value"
              class="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
            />
          </div>
        </div>

        <!-- Icon Selection -->
        <div>
          <label for="new-category-icon" class="block text-sm font-medium text-slate-700 mb-2">Icon</label>
          <div class="relative">
            <select
              id="new-category-icon"
              v-model="categoryFormData.icon"
              class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 appearance-none pr-10"
            >
              <option value="">Select an icon</option>
              <option value="fa-building">Building</option>
              <option value="fa-utensils">Food & Catering</option>
              <option value="fa-palette">Decoration</option>
              <option value="fa-camera">Photography</option>
              <option value="fa-music">Entertainment</option>
              <option value="fa-gift">Gifts & Favors</option>
              <option value="fa-car">Transportation</option>
              <option value="fa-hotel">Venue & Lodging</option>
              <option value="fa-shirt">Attire & Costumes</option>
              <option value="fa-lightbulb">Lighting & AV</option>
              <option value="fa-clipboard">Planning & Coordination</option>
              <option value="fa-megaphone">Marketing & Promotion</option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown class="w-4 h-4 text-slate-500" />
            </div>
          </div>
        </div>
      </div>
    </ExpenseModal>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="!!deletingBudget"
      :loading="submitting"
      title="Delete Budget"
      :item-name="deletingBudget ? `Budget for ${deletingBudget.category_info.name}` : undefined"
      warning-message="Expenses will remain but won't have budget tracking."
      @confirm="handleDelete"
      @cancel="deletingBudget = null"
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
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Building2,
  UtensilsCrossed,
  Palette,
  AlertTriangle,
  X,
  AlertCircle,
  Check,
  ChevronDown
} from 'lucide-vue-next'
import {
  expenseBudgetsService,
  expenseCategoriesService,
  type ExpenseBudget,
  type ExpenseCategory,
  type CreateExpenseBudgetRequest
} from '@/services/api'
import { useExpenseIcons } from '@/composables/useExpenseIcons'
import { useExpenseModal } from '@/composables/useExpenseModal'
import { useSuccessToast } from '@/composables/useSuccessToast'
import { useOptimisticUpdate } from '@/composables/useOptimisticUpdate'
import { SUPPORTED_CURRENCIES, type CurrencyCode } from '@/constants/currencies'
import { getErrorMessage } from '@/utils/errorMessages'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import ExpenseModal from './ExpenseModal.vue'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'create-category': []
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const budgets = ref<ExpenseBudget[]>([])
const categories = ref<ExpenseCategory[]>([])
const editingBudget = ref<ExpenseBudget | null>(null)
const deletingBudget = ref<ExpenseBudget | null>(null)

// Category modal state
const showCategoryModal = ref(false)
const categoryFormData = ref({
  name: '',
  description: '',
  icon: '',
  color: '#3498db'
})
const categorySubmitting = ref(false)
const categoryError = ref<string | null>(null)
const isCreatingCategoryFromBudget = ref(false)
const pendingCategorySelection = ref<number | null>(null)

// Use composables
const { isModalOpen: showAddBudgetModal, modalRef: addModalRef, submitting, error: modalError, openModal, closeModal: closeBudgetModal } = useExpenseModal()
const { showToast: showSuccessToast, message: successMessage, showSuccess } = useSuccessToast()
const { performUpdate } = useOptimisticUpdate(budgets)

// Use shared icon utilities
const { getIconComponent } = useExpenseIcons()

const newBudget = ref({
  category_id: '',
  budgeted_amount: null as number | null,
  currency: 'USD' as CurrencyCode,
  notes: ''
})

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

const closeModal = () => {
  closeBudgetModal() // This already clears modalError via composable
  editingBudget.value = null
  newBudget.value = {
    category_id: '',
    budgeted_amount: null,
    currency: 'USD',
    notes: ''
  }
}

const editBudget = (budget: ExpenseBudget) => {
  editingBudget.value = budget
  newBudget.value = {
    category_id: budget.category.toString(),
    budgeted_amount: parseFloat(budget.budgeted_amount),
    currency: budget.currency,
    notes: budget.notes || ''
  }
  openModal()
}

const confirmDeleteBudget = (budget: ExpenseBudget) => {
  deletingBudget.value = budget
}

const handleAddBudget = async () => {
  if (!newBudget.value.category_id || !newBudget.value.budgeted_amount) {
    error.value = 'Please fill in all required fields'
    return
  }

  const categoryId = parseInt(newBudget.value.category_id)
  const isEditing = !!editingBudget.value

  // API expects both 'category' and 'category_id' fields (backend requirement)
  const requestData: CreateExpenseBudgetRequest & { category: number } = {
    category: categoryId,
    category_id: categoryId,
    budgeted_amount: newBudget.value.budgeted_amount!,
    currency: newBudget.value.currency,
    notes: newBudget.value.notes || undefined
  }

  // OPTIMISTIC UPDATE: Update UI immediately
  const backup = [...budgets.value]
  const categoryInfo = categories.value.find(c => c.id === categoryId)

  if (isEditing && editingBudget.value) {
    // Update existing budget in the list
    const index = budgets.value.findIndex(b => b.id === editingBudget.value!.id)
    if (index !== -1 && categoryInfo) {
      budgets.value[index] = {
        ...editingBudget.value,
        ...requestData,
        category: categoryId,
        category_info: categoryInfo
      } as ExpenseBudget
    }
    showSuccess('Budget updated successfully!')
  } else if (categoryInfo) {
    // Add temporary budget
    const tempBudget: ExpenseBudget = {
      id: Date.now(), // Use numeric timestamp as temporary ID
      ...requestData,
      category: categoryId,
      category_info: categoryInfo,
      spent_amount: '0.00',
      remaining_amount: requestData.budgeted_amount.toString(),
      percentage_used: 0,
      is_over_budget: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    budgets.value = [tempBudget, ...budgets.value]
    showSuccess('Budget added successfully!')
  }

  submitting.value = true
  error.value = null

  try {
    if (import.meta.env.DEV) {
      console.log('Submitting budget data:', requestData)
    }

    let response
    if (isEditing && editingBudget.value) {
      response = await expenseBudgetsService.patchBudget(
        props.eventId,
        editingBudget.value.id,
        requestData
      )
    } else {
      response = await expenseBudgetsService.createBudget(props.eventId, requestData)
    }

    if (import.meta.env.DEV) {
      console.log('Budget API response:', response)
    }

    if (response.success) {
      // Replace with real data from server
      await loadBudgets()
      closeModal() // Close modal only on success
    } else {
      // ROLLBACK: Restore original data on error
      budgets.value = backup

      // Display specific field errors if available
      if (response.errors) {
        const errorMessages = Object.entries(response.errors)
          .map(([field, messages]: [string, string[] | string]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ')
        error.value = errorMessages || response.message || 'Failed to save budget'
      } else {
        error.value = response.message || 'Failed to save budget'
      }
    }
  } catch (err) {
    // ROLLBACK: Restore original data on error
    budgets.value = backup
    error.value = getErrorMessage(err, isEditing ? 'update budget' : 'create budget')
    console.error('Error saving budget:', err)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async () => {
  if (!deletingBudget.value) return

  // OPTIMISTIC UPDATE: Remove from UI immediately
  const backup = [...budgets.value]
  const deletedId = deletingBudget.value.id
  const deletedCategory = deletingBudget.value.category_info.name

  budgets.value = budgets.value.filter(budget => budget.id !== deletedId)
  deletingBudget.value = null
  showSuccess('Budget deleted successfully!')

  submitting.value = true

  try {
    const response = await expenseBudgetsService.deleteBudget(
      props.eventId,
      deletedId
    )

    if (!response.success) {
      // ROLLBACK: Restore on error
      budgets.value = backup
      error.value = response.message || `Failed to delete budget for "${deletedCategory}"`
    }
  } catch (err) {
    // ROLLBACK: Restore on error
    budgets.value = backup
    error.value = getErrorMessage(err, 'delete budget')
    console.error('Error deleting budget:', err)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadBudgets(), loadCategories()])
})

onUnmounted(() => {
  // Clean up state to prevent memory leaks
  deletingBudget.value = null
  editingBudget.value = null
})

// Open create category modal (nested modal)
const openCreateCategoryModal = () => {
  // Close budget modal first to avoid focus trap conflicts
  closeBudgetModal()
  isCreatingCategoryFromBudget.value = true
  showCategoryModal.value = true
}

// Close category modal
const closeCategoryModal = () => {
  showCategoryModal.value = false
  categoryError.value = null
  categoryFormData.value = {
    name: '',
    description: '',
    icon: '',
    color: '#3498db'
  }

  // If user was creating a category from budget modal and cancelled,
  // reopen the budget modal
  if (isCreatingCategoryFromBudget.value) {
    openModal()
    isCreatingCategoryFromBudget.value = false
  }
}

// Handle category creation
const handleCreateCategory = async () => {
  if (!categoryFormData.value.name) {
    categoryError.value = 'Category name is required'
    return
  }

  const requestData = {
    name: categoryFormData.value.name,
    description: categoryFormData.value.description || undefined,
    icon: categoryFormData.value.icon || undefined,
    color: categoryFormData.value.color,
    is_active: true
  }

  categorySubmitting.value = true
  categoryError.value = null

  try {
    const response = await expenseCategoriesService.createCategory(requestData)

    if (response.success && response.data) {
      // Add the new category to the list
      await loadCategories()

      // Auto-select the newly created category
      newBudget.value.category_id = response.data.id.toString()

      // Show success message
      showSuccess('Category created successfully!')

      // Close the category modal (this will NOT reopen budget modal yet)
      showCategoryModal.value = false
      categoryError.value = null
      categoryFormData.value = {
        name: '',
        description: '',
        icon: '',
        color: '#3498db'
      }

      // If category was created from budget modal, reopen it with the new category selected
      if (isCreatingCategoryFromBudget.value) {
        pendingCategorySelection.value = response.data.id
        openModal()
        isCreatingCategoryFromBudget.value = false

        // Reset pending selection after a short delay (to allow the modal to open)
        setTimeout(() => {
          pendingCategorySelection.value = null
        }, 100)
      }
    } else {
      categoryError.value = response.message || 'Failed to create category'
    }
  } catch (err) {
    categoryError.value = getErrorMessage(err, 'create category')
    console.error('Error creating category:', err)
  } finally {
    categorySubmitting.value = false
  }
}

// Expose methods for parent component (Smart FAB)
defineExpose({
  openAddBudgetModal: () => {
    openModal()
  },
  reloadCategories: () => {
    loadCategories()
  }
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
</style>
