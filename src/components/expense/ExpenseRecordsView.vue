<template>
  <div class="space-y-6">
    <!-- Header with Search -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-slate-900">Expense Records</h3>
        <p class="text-sm text-slate-500 mt-1">Track all expenses with receipt uploads</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Search & Filter -->
        <div class="relative flex-1 sm:flex-initial">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="w-4 h-4 text-slate-400" />
          </div>
          <input
            id="expense-search"
            type="text"
            v-model="searchQuery"
            placeholder="Search expenses..."
            aria-label="Search expenses by description, vendor, or notes"
            class="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
          />
        </div>
        <!-- Add Expense Button -->
        <button
          v-if="canEdit"
          @click="$emit('create-expense')"
          class="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus class="w-4 h-4" />
          <span class="hidden sm:inline">Add Expense</span>
        </button>
      </div>
    </div>

    <!-- Filter Pills -->
    <div role="tablist" aria-label="Expense categories filter" class="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
      <button
        v-for="filter in categoryFilters"
        :key="filter.id"
        role="tab"
        :aria-selected="activeFilter === filter.id"
        :aria-controls="'expenses-panel'"
        @click="activeFilter = filter.id"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap',
          activeFilter === filter.id
            ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
            : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
        ]"
      >
        <component :is="filter.icon" class="w-4 h-4" />
        <span>{{ filter.label }}</span>
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
          <h4 class="font-semibold text-red-900 mb-1">Error Loading Expenses</h4>
          <p class="text-sm text-red-700">{{ error }}</p>
          <button @click="loadExpenses" class="mt-3 text-sm font-medium text-red-600 hover:text-red-700">
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State - No Expenses -->
    <div
      v-else-if="filteredExpenses.length === 0 && canEdit"
      class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-12"
    >
      <div class="flex flex-col items-center justify-center">
        <div class="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle class="w-8 h-8 text-slate-400" />
        </div>
        <h4 class="font-semibold text-slate-600">No Expenses Found</h4>
        <p class="text-sm text-slate-400 mt-1">{{ searchQuery || activeFilter !== 'all' ? 'Try adjusting your filters or use Quick Add to create a new expense' : 'Use Quick Add button to start tracking expenses' }}</p>
      </div>
    </div>

    <!-- Empty State - No Edit Permission -->
    <div v-else-if="filteredExpenses.length === 0" class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-12 text-center">
      <div class="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <AlertCircle class="w-8 h-8 text-slate-400" />
      </div>
      <h4 class="font-semibold text-slate-600 mb-2">No Expenses Found</h4>
      <p class="text-sm text-slate-400">{{ searchQuery || activeFilter !== 'all' ? 'Try adjusting your filters' : 'No expenses have been added yet' }}</p>
    </div>

    <!-- Expense List -->
    <div
      v-else
      id="expenses-panel"
      role="tabpanel"
      :aria-label="`${activeFilter === 'all' ? 'All' : categoryFilters.find(f => f.id === activeFilter)?.label || ''} expenses`"
      class="space-y-3"
    >
      <!-- Dynamic Expense Items -->
      <div
        v-for="expense in filteredExpenses"
        :key="expense.id"
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg shadow-emerald-500/10 p-6 hover:shadow-xl transition-all duration-300 group"
      >
        <div class="flex flex-col lg:flex-row lg:items-center gap-4">
          <div class="flex items-start gap-4 flex-1 min-w-0">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              :style="{ backgroundColor: `${expense.category_info.color}20` }"
            >
              <component
                :is="getIconComponent(expense.category_info.icon)"
                class="w-6 h-6"
                :style="{ color: expense.category_info.color }"
              />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-4 mb-2">
                <div class="flex-1 min-w-0">
                  <h4 class="font-bold text-slate-900 mb-1">{{ expense.description }}</h4>
                  <div class="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <div class="flex items-center gap-1">
                      <Calendar class="w-3.5 h-3.5" />
                      <span>{{ new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}</span>
                    </div>
                    <span v-if="expense.paid_to" class="text-slate-300">•</span>
                    <div v-if="expense.paid_to" class="flex items-center gap-1">
                      <Building2 class="w-3.5 h-3.5" />
                      <span>{{ expense.paid_to }}</span>
                    </div>
                    <span class="text-slate-300">•</span>
                    <div class="flex items-center gap-1">
                      <CreditCard class="w-3.5 h-3.5" />
                      <span>{{ formatPaymentMethod(expense.payment_method) }}</span>
                    </div>
                  </div>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-2xl font-bold text-slate-900">{{ SUPPORTED_CURRENCIES.find(c => c.code === expense.currency)?.symbol || '$' }}{{ parseFloat(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</p>
                  <p class="text-xs text-slate-500">{{ expense.currency }}</p>
                </div>
              </div>

              <!-- Notes -->
              <div v-if="expense.notes" class="mb-3 p-3 bg-slate-50 rounded-lg">
                <p class="text-sm text-slate-600">{{ expense.notes }}</p>
              </div>

              <!-- Receipt & Actions -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <a
                    v-if="expense.receipt"
                    :href="expense.receipt"
                    target="_blank"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer transition-all"
                    title="Click to view receipt"
                  >
                    <Paperclip class="w-3.5 h-3.5" />
                    <span class="text-xs font-medium">Receipt Attached</span>
                    <Eye class="w-3.5 h-3.5 ml-1 opacity-60" />
                  </a>
                  <div v-else class="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg">
                    <AlertCircle class="w-3.5 h-3.5" />
                    <span class="text-xs font-medium">No Receipt</span>
                  </div>
                </div>

                <div v-if="canEdit" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    @click="editExpense(expense)"
                    :aria-label="`Edit expense: ${expense.description}`"
                    title="Edit expense"
                    class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button
                    @click="confirmDeleteExpense(expense)"
                    :aria-label="`Delete expense: ${expense.description}`"
                    title="Delete expense"
                    class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Expense Modal -->
    <ExpenseModal
      :show="showEditModal"
      title="Edit Expense"
      :icon="Receipt"
      icon-bg-class="bg-emerald-50 text-emerald-600"
      :error="modalError"
      :submitting="submitting"
      submit-text="Update Expense"
      @close="closeEditModal"
      @submit="handleUpdateExpense"
    >
      <!-- Category -->
      <div>
        <label for="edit-expense-category" class="block text-sm font-medium text-slate-700 mb-2">
          Category <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <select
            id="edit-expense-category"
            v-model="editForm.category_id"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white/90 appearance-none pr-10"
            required
          >
            <option value="">Select a category</option>
            <option v-for="category in categories" :key="category.id" :value="category.id.toString()">
              {{ category.name }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown class="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </div>

      <!-- Description -->
      <div>
        <label for="edit-expense-description" class="block text-sm font-medium text-slate-700 mb-2">
          Description <span class="text-red-500">*</span>
        </label>
        <input
          id="edit-expense-description"
          type="text"
          v-model="editForm.description"
          placeholder="E.g., Venue deposit, Catering services..."
          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white/90"
          required
        />
      </div>

      <!-- Amount & Currency -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="edit-expense-amount" class="block text-sm font-medium text-slate-700 mb-2">
            Amount <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign class="w-4 h-4 text-slate-400" />
            </div>
            <input
              id="edit-expense-amount"
              type="number"
              v-model="editForm.amount"
              placeholder="0.00"
              step="0.01"
              min="0"
              class="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white/90"
              required
            />
          </div>
        </div>
        <div>
          <label for="edit-expense-currency" class="block text-sm font-medium text-slate-700 mb-2">Currency</label>
          <select
            id="edit-expense-currency"
            v-model="editForm.currency"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white/90"
          >
            <option v-for="curr in SUPPORTED_CURRENCIES" :key="curr.code" :value="curr.code">
              {{ curr.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Date & Payment Method -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="edit-expense-date" class="block text-sm font-medium text-slate-700 mb-2">
            Date <span class="text-red-500">*</span>
          </label>
          <input
            id="edit-expense-date"
            type="date"
            v-model="editForm.date"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white/90"
            required
          />
        </div>
        <div>
          <label for="edit-expense-payment" class="block text-sm font-medium text-slate-700 mb-2">
            Payment Method <span class="text-red-500">*</span>
          </label>
          <select
            id="edit-expense-payment"
            v-model="editForm.payment_method"
            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white/90"
            required
          >
            <option value="">Select payment method</option>
            <option v-for="method in PAYMENT_METHOD_OPTIONS" :key="method.value" :value="method.value">
              {{ method.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Paid To -->
      <div>
        <label for="edit-expense-paid-to" class="block text-sm font-medium text-slate-700 mb-2">Paid To</label>
        <input
          id="edit-expense-paid-to"
          type="text"
          v-model="editForm.paid_to"
          placeholder="Vendor or recipient name..."
          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white/90"
        />
      </div>

      <!-- Notes -->
      <div>
        <label for="edit-expense-notes" class="block text-sm font-medium text-slate-700 mb-2">Notes</label>
        <textarea
          id="edit-expense-notes"
          v-model="editForm.notes"
          rows="3"
          placeholder="Additional notes about this expense..."
          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 bg-white/90 resize-none"
        ></textarea>
      </div>

      <!-- Receipt Upload -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Receipt</label>
        <div class="flex items-center gap-3">
          <label
            for="edit-expense-receipt"
            class="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <Upload class="w-4 h-4 text-slate-500" />
            <span class="text-sm text-slate-600">{{ selectedFile ? selectedFile.name : 'Choose file' }}</span>
          </label>
          <input
            id="edit-expense-receipt"
            ref="receiptInput"
            type="file"
            accept="image/*,application/pdf"
            @change="handleFileChange"
            class="hidden"
          />
          <button
            v-if="selectedFile"
            type="button"
            @click="clearFile"
            class="text-sm text-red-600 hover:text-red-700"
          >
            Remove
          </button>
        </div>
        <p v-if="editingExpense?.receipt" class="text-xs text-slate-500 mt-1">
          Current: <a :href="editingExpense.receipt" target="_blank" class="text-blue-600 hover:underline">View receipt</a>
        </p>
      </div>
    </ExpenseModal>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="!!deletingExpense"
      :loading="submitting"
      title="Delete Expense"
      :item-name="deletingExpense?.description"
      @confirm="handleDelete"
      @cancel="deletingExpense = null"
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {
  Search,
  Calendar,
  CreditCard,
  Building2,
  Paperclip,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  Filter,
  Check,
  DollarSign,
  Upload,
  ChevronDown,
  Receipt,
  Plus
} from 'lucide-vue-next'
import {
  expensesService,
  expenseCategoriesService,
  type ExpenseRecord,
  type ExpenseCategory
} from '@/services/api'
import { useExpenseIcons } from '@/composables/useExpenseIcons'
import { useSuccessToast } from '@/composables/useSuccessToast'
import { formatPaymentMethod, PAYMENT_METHOD_OPTIONS } from '@/constants/paymentMethods'
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
  'create-expense': []
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const expenses = ref<ExpenseRecord[]>([])
const categories = ref<ExpenseCategory[]>([])
const searchQuery = ref('')
const activeFilter = ref('all')
const deletingExpense = ref<ExpenseRecord | null>(null)
const editingExpense = ref<ExpenseRecord | null>(null)
const showEditModal = ref(false)
const modalError = ref<string | null>(null)
const submitting = ref(false)
const selectedFile = ref<File | null>(null)
const receiptInput = ref<HTMLInputElement | null>(null)

// Edit form data
const editForm = ref({
  category_id: '',
  description: '',
  amount: null as number | null,
  currency: 'USD' as CurrencyCode,
  date: '',
  payment_method: '' as 'cash' | 'bank_transfer' | 'credit_card' | 'mobile_payment' | 'check' | 'other' | '',
  paid_to: '',
  notes: ''
})

// Use composables
const { showToast: showSuccessToast, message: successMessage, showSuccess } = useSuccessToast()

// Use shared icon utilities
const { getIconComponent } = useExpenseIcons()

// Computed category filters based on loaded categories
const categoryFilters = computed(() => {
  const filters = [
    { id: 'all', label: 'All Categories', icon: Filter }
  ]

  // Add all loaded categories
  categories.value.forEach(category => {
    filters.push({
      id: category.id.toString(),
      label: category.name,
      icon: getIconComponent(category.icon) as typeof Filter
    })
  })

  return filters
})

// Computed filtered expenses
const filteredExpenses = computed(() => {
  let result = expenses.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(expense =>
      expense.description.toLowerCase().includes(query) ||
      expense.paid_to?.toLowerCase().includes(query) ||
      expense.notes?.toLowerCase().includes(query)
    )
  }

  // Filter by category
  if (activeFilter.value !== 'all') {
    result = result.filter(expense =>
      expense.category.toString() === activeFilter.value
    )
  }

  return result
})


const loadExpenses = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await expensesService.getExpenses(props.eventId)

    if (response.success && response.data) {
      expenses.value = response.data.results
    } else {
      error.value = response.message || 'Failed to load expenses'
    }
  } catch (err) {
    error.value = getErrorMessage(err, 'load expenses')
    console.error('Error loading expenses:', err)
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

const confirmDeleteExpense = (expense: ExpenseRecord) => {
  deletingExpense.value = expense
}

const handleDelete = async () => {
  if (!deletingExpense.value) return

  submitting.value = true
  const deletedId = deletingExpense.value.id

  try {
    const response = await expensesService.deleteExpense(props.eventId, deletedId)

    if (response.success) {
      // Remove from local list
      expenses.value = expenses.value.filter(expense => expense.id !== deletedId)
      showSuccess('Expense deleted successfully!')
      deletingExpense.value = null
    } else {
      error.value = response.message || 'Failed to delete expense'
    }
  } catch (err) {
    error.value = getErrorMessage(err, 'delete expense')
    console.error('Error deleting expense:', err)
  } finally {
    submitting.value = false
  }
}

// Edit expense functions
const editExpense = (expense: ExpenseRecord) => {
  editingExpense.value = expense
  editForm.value = {
    category_id: expense.category.toString(),
    description: expense.description,
    amount: parseFloat(expense.amount),
    currency: expense.currency as CurrencyCode,
    date: expense.date,
    payment_method: expense.payment_method,
    paid_to: expense.paid_to || '',
    notes: expense.notes || ''
  }
  selectedFile.value = null
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  modalError.value = null
  editingExpense.value = null
  selectedFile.value = null
  editForm.value = {
    category_id: '',
    description: '',
    amount: null,
    currency: 'USD',
    date: '',
    payment_method: '',
    paid_to: '',
    notes: ''
  }
}

const handleUpdateExpense = async () => {
  if (!editingExpense.value) return

  // Validation
  if (!editForm.value.category_id || !editForm.value.description || !editForm.value.amount || !editForm.value.date) {
    modalError.value = 'Please fill in all required fields'
    return
  }

  submitting.value = true
  modalError.value = null

  try {
    const requestData = {
      category: parseInt(editForm.value.category_id),
      category_id: parseInt(editForm.value.category_id),
      description: editForm.value.description,
      amount: editForm.value.amount,
      currency: editForm.value.currency,
      date: editForm.value.date,
      payment_method: editForm.value.payment_method || undefined,
      paid_to: editForm.value.paid_to || undefined,
      notes: editForm.value.notes || undefined,
    }

    const response = await expensesService.updateExpense(
      props.eventId,
      editingExpense.value.id,
      requestData,
      selectedFile.value || undefined
    )

    if (response.success) {
      // Reload expenses from server
      await loadExpenses()
      showSuccess('Expense updated successfully!')
      closeEditModal()
    } else {
      modalError.value = response.message || 'Failed to update expense'
    }
  } catch (err) {
    modalError.value = getErrorMessage(err, 'update expense')
    console.error('Error updating expense:', err)
  } finally {
    submitting.value = false
  }
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      modalError.value = 'File size must be less than 5MB'
      target.value = ''
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      modalError.value = 'File must be an image (JPEG, PNG, GIF) or PDF'
      target.value = ''
      return
    }

    selectedFile.value = file
    modalError.value = null
  }
}

const clearFile = () => {
  selectedFile.value = null
  if (receiptInput.value) {
    receiptInput.value.value = ''
  }
}

onMounted(async () => {
  await Promise.all([loadExpenses(), loadCategories()])
})

onUnmounted(() => {
  // Clean up state to prevent memory leaks
  deletingExpense.value = null
})

// Expose methods for parent component
defineExpose({
  reloadCategories: () => {
    loadCategories()
  }
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

.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.2s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 1000px;
  opacity: 1;
}
</style>
