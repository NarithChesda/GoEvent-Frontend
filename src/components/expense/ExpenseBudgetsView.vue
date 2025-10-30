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
        class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
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
            <span class="text-lg font-bold text-slate-900">{{ budget.currency === 'USD' ? '$' : '៛' }}{{ parseFloat(budget.budgeted_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>

          <!-- Spent Amount -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500">Spent</span>
            <span
              class="text-lg font-bold"
              :class="budget.is_over_budget ? 'text-red-600' : 'text-emerald-600'"
            >
              {{ budget.currency === 'USD' ? '$' : '៛' }}{{ parseFloat(budget.spent_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
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
              {{ budget.currency === 'USD' ? '$' : '៛' }}{{ Math.abs(parseFloat(budget.remaining_amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
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
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAddBudgetModal"
          class="fixed inset-0 z-50 overflow-y-auto"
          @click.self="closeModal"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

          <div class="flex min-h-full items-center justify-center p-4">
            <div
              ref="addModalRef"
              role="dialog"
              aria-labelledby="add-budget-modal-title"
              aria-modal="true"
              class="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
              @click.stop
            >
              <!-- Header -->
              <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <DollarSign class="w-4.5 h-4.5" />
                    </div>
                    <h2 id="add-budget-modal-title" class="text-lg sm:text-xl font-semibold text-slate-900">
                      {{ editingBudget ? 'Edit Budget' : 'Add Budget' }}
                    </h2>
                  </div>
                  <button
                    @click="closeModal"
                    aria-label="Close dialog"
                    class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Form -->
              <form @submit.prevent="handleAddBudget" class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                <!-- Error Message -->
                <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p class="text-sm text-red-600">{{ error }}</p>
                </div>

                <!-- Category Selection -->
                <div>
                  <label for="budget-category" class="block text-sm font-medium text-slate-700 mb-2">
                    Category <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <select
                      id="budget-category"
                      v-model="newBudget.category_id"
                      aria-required="true"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
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
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    Budget Amount <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign class="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      v-model="newBudget.budgeted_amount"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      class="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                      required
                    />
                  </div>
                </div>

                <!-- Currency -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    Currency <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <select
                      v-model="newBudget.currency"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 appearance-none pr-10"
                      required
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="KHR">KHR - Cambodian Riel</option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown class="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>

                <!-- Notes -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                  <textarea
                    v-model="newBudget.notes"
                    rows="3"
                    placeholder="Add any notes about this budget..."
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-none"
                  ></textarea>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                  <button
                    type="button"
                    @click="closeModal"
                    class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    :disabled="submitting"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    :disabled="submitting"
                  >
                    <span
                      v-if="submitting"
                      class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                    ></span>
                    {{ submitting ? 'Saving...' : (editingBudget ? 'Update Budget' : 'Add Budget') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

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
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
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
import { getErrorMessage } from '@/utils/errorMessages'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()

const loading = ref(false)
const error = ref<string | null>(null)
const budgets = ref<ExpenseBudget[]>([])
const categories = ref<ExpenseCategory[]>([])
const showAddBudgetModal = ref(false)
const showSuccessToast = ref(false)
const successMessage = ref('')
const submitting = ref(false)
const editingBudget = ref<ExpenseBudget | null>(null)
const deletingBudget = ref<ExpenseBudget | null>(null)

// Focus trap for modals (accessibility)
const addModalRef = ref<HTMLElement>()
const { activate: activateAddModal, deactivate: deactivateAddModal } = useFocusTrap(addModalRef, {
  immediate: false,
  escapeDeactivates: true
})

// Use shared icon utilities
const { getIconComponent } = useExpenseIcons()

const newBudget = ref({
  category_id: '',
  budgeted_amount: null as number | null,
  currency: 'USD' as 'USD' | 'KHR',
  notes: ''
})

// Activate/deactivate focus trap when modals open/close
watch(showAddBudgetModal, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    activateAddModal()
  } else {
    deactivateAddModal()
  }
})

const showSuccess = (message: string) => {
  successMessage.value = message
  showSuccessToast.value = true
  setTimeout(() => {
    showSuccessToast.value = false
  }, 3000)
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

const closeModal = () => {
  showAddBudgetModal.value = false
  editingBudget.value = null
  error.value = null
  newBudget.value = {
    category_id: '',
    budgeted_amount: null,
    currency: 'USD',
    notes: ''
  }
}

const editBudget = (budget: ExpenseBudget) => {
  editingBudget.value = budget
  error.value = null
  newBudget.value = {
    category_id: budget.category.toString(),
    budgeted_amount: parseFloat(budget.budgeted_amount),
    currency: budget.currency,
    notes: budget.notes || ''
  }
  showAddBudgetModal.value = true
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
  // Clean up modals and toasts to prevent memory leaks
  showAddBudgetModal.value = false
  deletingBudget.value = null
  showSuccessToast.value = false
  editingBudget.value = null
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
