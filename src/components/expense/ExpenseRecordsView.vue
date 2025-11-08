<template>
  <div class="space-y-6">
    <!-- Header with Add Expense Button -->
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
        <button
          v-if="canEdit"
          @click="showAddExpenseModal = true"
          class="hidden sm:flex flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105 whitespace-nowrap"
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
    <div v-else-if="error && !showAddExpenseModal" class="bg-red-50/50 border border-red-200/50 rounded-2xl p-6">
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

    <!-- Empty State - Add Expense Card -->
    <div
      v-else-if="filteredExpenses.length === 0 && canEdit"
      @click="showAddExpenseModal = true"
      class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-12 hover:bg-slate-100/50 hover:border-emerald-400 transition-all duration-300 cursor-pointer group"
    >
      <div class="flex flex-col items-center justify-center">
        <div class="w-16 h-16 bg-slate-200 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
          <Plus class="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </div>
        <h4 class="font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Add New Expense</h4>
        <p class="text-sm text-slate-400 mt-1">{{ searchQuery || activeFilter !== 'all' ? 'No expenses match your filters. Click to add one.' : 'Start tracking expenses for your event' }}</p>
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
                  <div v-if="expense.receipt" class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                    <Paperclip class="w-3.5 h-3.5" />
                    <span class="text-xs font-medium">Receipt Attached</span>
                  </div>
                  <a
                    v-if="expense.receipt"
                    :href="expense.receipt"
                    target="_blank"
                    class="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Eye class="w-3.5 h-3.5" />
                    <span class="text-xs font-medium">View</span>
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


    <!-- Add Expense Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showAddExpenseModal"
          class="fixed inset-0 z-50 overflow-y-auto"
          @click.self="closeModal"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

          <div class="flex min-h-full items-center justify-center p-4">
            <div
              ref="addModalRef"
              role="dialog"
              aria-labelledby="add-expense-modal-title"
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
                    <h2 id="add-expense-modal-title" class="text-lg sm:text-xl font-semibold text-slate-900">{{ editingExpense ? 'Edit Expense' : 'Add Expense' }}</h2>
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
            <form @submit.prevent="handleAddExpense" class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <!-- Error Message -->
              <div v-if="modalError" class="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p class="text-sm text-red-600">{{ modalError }}</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <!-- Category -->
                <div class="md:col-span-2">
                  <div class="flex items-center justify-between mb-2">
                    <label for="expense-category" class="block text-sm font-medium text-slate-700">
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
                      id="expense-category"
                      v-model="newExpense.category_id"
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

                <!-- Description -->
                <div class="md:col-span-2">
                  <label for="expense-description" class="block text-sm font-medium text-slate-700 mb-2">
                    Description <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="expense-description"
                    type="text"
                    v-model="newExpense.description"
                    placeholder="E.g., Venue rental, Catering service..."
                    aria-required="true"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
                    required
                  />
                </div>

                <!-- Amount -->
                <div>
                  <label for="expense-amount" class="block text-sm font-medium text-slate-700 mb-2">
                    Amount <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign class="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      id="expense-amount"
                      type="number"
                      v-model="newExpense.amount"
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      aria-required="true"
                      class="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
                      required
                    />
                  </div>
                </div>

                <!-- Currency -->
                <div>
                  <label for="expense-currency" class="block text-sm font-medium text-slate-700 mb-2">
                    Currency <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <select
                      id="expense-currency"
                      v-model="newExpense.currency"
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

                <!-- Date -->
                <div>
                  <label for="expense-date" class="block text-sm font-medium text-slate-700 mb-2">
                    Date <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="expense-date"
                    type="date"
                    v-model="newExpense.date"
                    aria-required="true"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
                    required
                  />
                </div>

                <!-- Payment Method -->
                <div>
                  <label for="expense-payment-method" class="block text-sm font-medium text-slate-700 mb-2">
                    Payment Method <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <select
                      id="expense-payment-method"
                      v-model="newExpense.payment_method"
                      aria-required="true"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 appearance-none pr-10"
                      required
                    >
                      <option value="">Select payment method</option>
                      <option
                        v-for="method in PAYMENT_METHOD_OPTIONS"
                        :key="method.value"
                        :value="method.value"
                      >
                        {{ method.label }}
                      </option>
                    </select>
                    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown class="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Additional Details (collapsible) -->
              <div class="rounded-xl border border-slate-200 bg-white/70">
                <button
                  type="button"
                  class="w-full flex items-center justify-between px-4 py-3"
                  @click="additionalDetailsOpen = !additionalDetailsOpen"
                  :aria-expanded="additionalDetailsOpen ? 'true' : 'false'"
                  aria-controls="additional-details-section"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-slate-700">Additional Details</span>
                    <span class="hidden sm:inline text-xs text-slate-500">Vendor, receipt, and notes</span>
                  </div>
                  <ChevronDown
                    class="w-4 h-4 text-slate-500 transition-transform"
                    :class="additionalDetailsOpen ? 'rotate-180' : ''"
                  />
                </button>
                <Transition name="collapse">
                  <div v-show="additionalDetailsOpen" id="additional-details-section" class="px-4 pb-4 space-y-3">
                    <!-- Paid To -->
                    <div>
                      <label for="expense-paid-to" class="block text-sm font-medium text-slate-700 mb-2">Paid To (Vendor/Recipient)</label>
                      <input
                        id="expense-paid-to"
                        type="text"
                        v-model="newExpense.paid_to"
                        placeholder="E.g., Luxury Hotel Group, Premium Catering Co."
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
                      />
                    </div>

                    <!-- Receipt Upload -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">Receipt/Invoice</label>
                      <div class="relative">
                        <input
                          type="file"
                          ref="receiptInput"
                          @change="handleFileChange"
                          accept="image/*,.pdf"
                          class="hidden"
                        />
                        <button
                          type="button"
                          @click="receiptInput?.click()"
                          class="w-full px-4 py-6 border-2 border-slate-200 border-dashed rounded-lg hover:bg-slate-50 hover:border-sky-300 transition-all group"
                        >
                          <div class="flex flex-col items-center">
                            <div class="w-10 h-10 bg-slate-100 group-hover:bg-sky-100 rounded-lg flex items-center justify-center mb-2 transition-all">
                              <Upload class="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors" />
                            </div>
                            <p class="text-sm font-medium text-slate-600 group-hover:text-slate-900">
                              {{ selectedFile ? selectedFile.name : 'Click to upload receipt' }}
                            </p>
                            <p class="text-xs text-slate-400 mt-1">PDF, PNG, JPG (max 5MB)</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    <!-- Notes -->
                    <div>
                      <label for="expense-notes" class="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                      <textarea
                        id="expense-notes"
                        v-model="newExpense.notes"
                        rows="3"
                        placeholder="Add any additional notes about this expense..."
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 resize-none"
                      ></textarea>
                    </div>
                  </div>
                </Transition>
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
                  {{ submitting ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Add Expense') }}
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
  Plus,
  Search,
  Calendar,
  CreditCard,
  Building2,
  UtensilsCrossed,
  Palette,
  Paperclip,
  Eye,
  Edit2,
  Trash2,
  X,
  DollarSign,
  Upload,
  AlertCircle,
  Filter,
  Check,
  ChevronDown
} from 'lucide-vue-next'
import {
  expensesService,
  expenseCategoriesService,
  type ExpenseRecord,
  type ExpenseCategory,
  type CreateExpenseRecordRequest
} from '@/services/api'
import { useExpenseIcons } from '@/composables/useExpenseIcons'
import { useExpenseModal } from '@/composables/useExpenseModal'
import { useSuccessToast } from '@/composables/useSuccessToast'
import { useFileUpload } from '@/composables/useFileUpload'
import { useOptimisticUpdate } from '@/composables/useOptimisticUpdate'
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
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const expenses = ref<ExpenseRecord[]>([])
const categories = ref<ExpenseCategory[]>([])
const searchQuery = ref('')
const activeFilter = ref('all')
const editingExpense = ref<ExpenseRecord | null>(null)
const deletingExpense = ref<ExpenseRecord | null>(null)
const additionalDetailsOpen = ref(false)

// Use composables
const { isModalOpen: showAddExpenseModal, modalRef: addModalRef, submitting, error: modalError, openModal, closeModal: closeExpenseModal } = useExpenseModal()
const { showToast: showSuccessToast, message: successMessage, showSuccess } = useSuccessToast()
const { selectedFile, fileInput: receiptInput, handleFileChange, clearFile } = useFileUpload()
const { performUpdate } = useOptimisticUpdate(expenses)

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
      icon: getIconComponent(category.icon)
    })
  })

  return filters
})

const newExpense = ref({
  category_id: '',
  description: '',
  amount: null as number | null,
  currency: 'USD' as CurrencyCode,
  date: new Date().toISOString().split('T')[0],
  payment_method: '' as 'cash' | 'bank_transfer' | 'credit_card' | 'mobile_payment' | 'check' | 'other' | '',
  paid_to: '',
  notes: ''
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

const closeModal = () => {
  closeExpenseModal()
  editingExpense.value = null
  error.value = null
  clearFile()
  newExpense.value = {
    category_id: '',
    description: '',
    amount: null,
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    payment_method: '',
    paid_to: '',
    notes: ''
  }
}

const editExpense = (expense: ExpenseRecord) => {
  editingExpense.value = expense
  error.value = null
  newExpense.value = {
    category_id: expense.category.toString(),
    description: expense.description,
    amount: parseFloat(expense.amount),
    currency: expense.currency,
    date: expense.date,
    payment_method: expense.payment_method,
    paid_to: expense.paid_to || '',
    notes: expense.notes || ''
  }
  openModal()
}

const confirmDeleteExpense = (expense: ExpenseRecord) => {
  deletingExpense.value = expense
}

const handleAddExpense = async () => {
  if (!newExpense.value.category_id || !newExpense.value.description || !newExpense.value.amount || !newExpense.value.date || !newExpense.value.payment_method) {
    modalError.value = 'Please fill in all required fields'
    return
  }

  const categoryId = parseInt(newExpense.value.category_id)
  const isEditing = !!editingExpense.value
  const categoryInfo = categories.value.find(c => c.id === categoryId)

  if (!categoryInfo) {
    modalError.value = 'Invalid category selected'
    return
  }

  // API expects both 'category' and 'category_id' fields (backend requirement)
  const requestData: CreateExpenseRecordRequest = {
    category: categoryId,
    category_id: categoryId,
    description: newExpense.value.description,
    amount: newExpense.value.amount!,
    currency: newExpense.value.currency,
    date: newExpense.value.date,
    payment_method: newExpense.value.payment_method,
    paid_to: newExpense.value.paid_to || undefined,
    notes: newExpense.value.notes || undefined
  }

  // Prepare optimistic data
  let optimisticData: ExpenseRecord[]
  if (isEditing && editingExpense.value) {
    // Update existing expense in the list
    const index = expenses.value.findIndex(e => e.id === editingExpense.value!.id)
    if (index !== -1) {
      optimisticData = [...expenses.value]
      optimisticData[index] = {
        ...editingExpense.value,
        ...requestData,
        category: categoryId,
        category_info: categoryInfo,
        // Don't create Object URL - will be handled by server response
        receipt: editingExpense.value.receipt
      } as ExpenseRecord
    } else {
      optimisticData = expenses.value
    }
  } else {
    // Add temporary expense
    const tempExpense: ExpenseRecord = {
      id: Date.now(), // Temporary numeric ID
      ...requestData,
      category: categoryId,
      category_info: categoryInfo,
      receipt: null, // Will be set by server
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    optimisticData = [tempExpense, ...expenses.value]
  }

  submitting.value = true

  const success = await performUpdate(
    async () => {
      if (import.meta.env.DEV) {
        console.log('Submitting expense data:', requestData, 'Receipt:', selectedFile.value)
      }

      const response = isEditing && editingExpense.value
        ? await expensesService.updateExpense(props.eventId, editingExpense.value.id, requestData, selectedFile.value || undefined)
        : await expensesService.createExpense(props.eventId, requestData, selectedFile.value || undefined)

      if (import.meta.env.DEV) {
        console.log('Expense API response:', response)
      }

      return response
    },
    optimisticData,
    {
      onSuccess: async () => {
        await loadExpenses()
        showSuccess(isEditing ? 'Expense updated successfully!' : 'Expense added successfully!')
        closeModal()
      },
      onError: (errorMsg) => {
        modalError.value = errorMsg
      },
      errorContext: isEditing ? 'update expense' : 'create expense'
    }
  )

  submitting.value = false
}

const handleDelete = async () => {
  if (!deletingExpense.value) return

  const deletedId = deletingExpense.value.id
  const optimisticData = expenses.value.filter(expense => expense.id !== deletedId)

  deletingExpense.value = null
  submitting.value = true

  await performUpdate(
    async () => await expensesService.deleteExpense(props.eventId, deletedId),
    optimisticData,
    {
      onSuccess: () => {
        showSuccess('Expense deleted successfully!')
      },
      onError: (errorMsg) => {
        error.value = errorMsg
      },
      errorContext: 'delete expense'
    }
  )

  submitting.value = false
}

onMounted(async () => {
  await Promise.all([loadExpenses(), loadCategories()])
})

onUnmounted(() => {
  // Clean up state to prevent memory leaks
  deletingExpense.value = null
  editingExpense.value = null
})

// Open create category modal (emit to parent)
const openCreateCategoryModal = () => {
  emit('create-category')
}

// Expose methods for parent component (Smart FAB)
defineExpose({
  openAddExpenseModal: () => {
    openModal()
  },
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
