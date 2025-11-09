<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-bold text-slate-900">Budget Management</h3>
        <p class="text-sm text-slate-500 mt-1">Set and track spending limits for each category</p>
      </div>
      <button
        v-if="canEdit"
        @click="$emit('create-budget')"
        class="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:-translate-y-0.5"
      >
        <Plus class="w-4 h-4" />
        <span class="hidden sm:inline">Add Budget</span>
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
    </div>

    <!-- Edit Budget Modal -->
    <ExpenseModal
      :show="showEditModal"
      title="Edit Budget"
      :icon="Wallet"
      icon-bg-class="bg-blue-50 text-blue-600"
      icon-size-class="w-5 h-5"
      aria-label-id="edit-budget-modal-title"
      :error="modalError"
      :submitting="submitting"
      submit-text="Update Budget"
      z-index-class="z-[60]"
      @close="closeEditModal"
      @submit="handleUpdateBudget"
    >
      <!-- Category Selection -->
      <div>
        <label for="budget-category" class="block text-sm font-medium text-slate-700 mb-2">
          Category <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <select
            id="budget-category"
            v-model="editForm.category_id"
            required
            aria-required="true"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white/90 appearance-none pr-10"
            disabled
          >
            <option value="">Select a category</option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id.toString()"
            >
              {{ category.name }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown class="w-4 h-4 text-slate-500" />
          </div>
        </div>
        <p class="text-xs text-slate-500 mt-1">Category cannot be changed after creation</p>
      </div>

      <!-- Budgeted Amount & Currency -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="budget-amount" class="block text-sm font-medium text-slate-700 mb-2">
            Budgeted Amount <span class="text-red-500">*</span>
          </label>
          <input
            id="budget-amount"
            type="number"
            v-model.number="editForm.budgeted_amount"
            placeholder="0.00"
            step="0.01"
            min="0"
            required
            aria-required="true"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white/90"
          />
        </div>

        <div>
          <label for="budget-currency" class="block text-sm font-medium text-slate-700 mb-2">
            Currency <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <select
              id="budget-currency"
              v-model="editForm.currency"
              required
              aria-required="true"
              class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white/90 appearance-none pr-10"
            >
              <option
                v-for="currency in SUPPORTED_CURRENCIES"
                :key="currency.code"
                :value="currency.code"
              >
                {{ currency.symbol }} {{ currency.code }} - {{ currency.name }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown class="w-4 h-4 text-slate-500" />
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div>
        <label for="budget-notes" class="block text-sm font-medium text-slate-700 mb-2">Notes</label>
        <textarea
          id="budget-notes"
          v-model="editForm.notes"
          rows="3"
          placeholder="Optional notes about this budget..."
          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white/90 resize-none"
        ></textarea>
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
  Edit2,
  Trash2,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  Check,
  Wallet,
  ChevronDown,
  Plus
} from 'lucide-vue-next'
import {
  expenseBudgetsService,
  expenseCategoriesService,
  type ExpenseBudget,
  type ExpenseCategory
} from '@/services/api'
import { useExpenseIcons } from '@/composables/useExpenseIcons'
import { useSuccessToast } from '@/composables/useSuccessToast'
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
  'create-budget': []
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const budgets = ref<ExpenseBudget[]>([])
const categories = ref<ExpenseCategory[]>([])
const deletingBudget = ref<ExpenseBudget | null>(null)
const editingBudget = ref<ExpenseBudget | null>(null)
const showEditModal = ref(false)
const modalError = ref<string | null>(null)
const submitting = ref(false)

// Edit form data
const editForm = ref({
  category_id: '',
  budgeted_amount: null as number | null,
  currency: 'USD' as CurrencyCode,
  notes: ''
})

// Use composables
const { showToast: showSuccessToast, message: successMessage, showSuccess } = useSuccessToast()

// Use shared icon utilities
const { getIconComponent } = useExpenseIcons()

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

const confirmDeleteBudget = (budget: ExpenseBudget) => {
  deletingBudget.value = budget
}

const handleDelete = async () => {
  if (!deletingBudget.value) return

  submitting.value = true
  const deletedId = deletingBudget.value.id

  try {
    const response = await expenseBudgetsService.deleteBudget(
      props.eventId,
      deletedId
    )

    if (response.success) {
      // Remove from local list
      budgets.value = budgets.value.filter(budget => budget.id !== deletedId)
      showSuccess('Budget deleted successfully!')
      deletingBudget.value = null
    } else {
      error.value = response.message || 'Failed to delete budget'
    }
  } catch (err) {
    error.value = getErrorMessage(err, 'delete budget')
    console.error('Error deleting budget:', err)
  } finally {
    submitting.value = false
  }
}

// Edit budget functions
const editBudget = (budget: ExpenseBudget) => {
  editingBudget.value = budget
  editForm.value = {
    category_id: budget.category.toString(),
    budgeted_amount: parseFloat(budget.budgeted_amount),
    currency: budget.currency as CurrencyCode,
    notes: budget.notes || ''
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  modalError.value = null
  editingBudget.value = null
  editForm.value = {
    category_id: '',
    budgeted_amount: null,
    currency: 'USD',
    notes: ''
  }
}

const handleUpdateBudget = async () => {
  if (!editingBudget.value) return

  // Validation
  if (!editForm.value.budgeted_amount || editForm.value.budgeted_amount <= 0) {
    modalError.value = 'Please enter a valid budgeted amount'
    return
  }

  submitting.value = true
  modalError.value = null

  try {
    const requestData = {
      budgeted_amount: editForm.value.budgeted_amount,
      currency: editForm.value.currency,
      notes: editForm.value.notes || undefined
    }

    const response = await expenseBudgetsService.patchBudget(
      props.eventId,
      editingBudget.value.id,
      requestData
    )

    if (response.success) {
      // Reload budgets from server
      await loadBudgets()
      showSuccess('Budget updated successfully!')
      closeEditModal()
    } else {
      modalError.value = response.message || 'Failed to update budget'
    }
  } catch (err) {
    modalError.value = getErrorMessage(err, 'update budget')
    console.error('Error updating budget:', err)
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
})

// Expose methods for parent component
defineExpose({
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
