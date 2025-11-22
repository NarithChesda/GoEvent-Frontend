<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-[70] overflow-y-auto"
        @click.self="handleClose"
      >
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm pointer-events-none"></div>

        <div class="flex min-h-full items-center justify-center p-4" @click.self="handleClose">
          <div
            ref="modalRef"
            role="dialog"
            aria-labelledby="quick-add-modal-title"
            aria-modal="true"
            class="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 text-white flex items-center justify-center">
                    <Zap class="w-5 h-5" />
                  </div>
                  <h2 id="quick-add-modal-title" class="text-lg sm:text-xl font-semibold text-slate-900">
                    Quick Add
                  </h2>
                </div>
                <button
                  @click="handleClose"
                  aria-label="Close dialog"
                  class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <!-- Error Message -->
              <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p class="text-sm text-red-600">{{ error }}</p>
              </div>

              <!-- Type Selection -->
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-3">What are you adding?</label>
                <div class="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    @click="selectedType = 'expense'"
                    :class="[
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                      selectedType === 'expense'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    ]"
                  >
                    <Receipt class="w-5 h-5" />
                    <span class="text-sm font-medium">Expense</span>
                  </button>
                  <button
                    type="button"
                    @click="selectedType = 'budget'"
                    :class="[
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                      selectedType === 'budget'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    ]"
                  >
                    <Wallet class="w-5 h-5" />
                    <span class="text-sm font-medium">Budget</span>
                  </button>
                  <button
                    type="button"
                    @click="selectedType = 'category'"
                    :class="[
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
                      selectedType === 'category'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    ]"
                  >
                    <FolderOpen class="w-5 h-5" />
                    <span class="text-sm font-medium">Category</span>
                  </button>
                </div>
              </div>

              <!-- Category Selection (for Expense & Budget) -->
              <div v-if="selectedType === 'expense' || selectedType === 'budget'">
                <div class="flex items-center justify-between mb-2">
                  <label for="quick-add-category" class="block text-sm font-medium text-slate-700">
                    Category <span class="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    @click="switchToCategory"
                    class="text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    + Create New
                  </button>
                </div>
                <div class="relative">
                  <select
                    id="quick-add-category"
                    v-model="formData.category_id"
                    aria-required="true"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 appearance-none pr-10"
                    required
                    @change="onCategoryChange"
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

                <!-- Budget Warning/Info for Expense -->
                <div v-if="selectedType === 'expense' && formData.category_id" class="mt-3">
                  <div v-if="!categoryBudget" class="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-amber-700 font-medium">No budget set for this category</p>
                      <button
                        type="button"
                        @click="showInlineBudget = true"
                        class="text-xs text-amber-600 hover:text-amber-700 underline mt-1"
                      >
                        Set budget now
                      </button>
                    </div>
                  </div>
                  <div v-else class="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div class="flex items-center gap-2">
                      <TrendingUp class="w-4 h-4 text-emerald-600" />
                      <span class="text-sm font-medium text-emerald-700">
                        {{ formatCurrency(categoryBudget.spent_amount, categoryBudget.currency) }} /
                        {{ formatCurrency(categoryBudget.budgeted_amount, categoryBudget.currency) }}
                      </span>
                    </div>
                    <span
                      :class="[
                        'text-xs font-semibold px-2 py-1 rounded-full',
                        categoryBudget.is_over_budget
                          ? 'bg-red-100 text-red-600'
                          : categoryBudget.percentage_used >= 90
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-emerald-100 text-emerald-600'
                      ]"
                    >
                      {{ categoryBudget.percentage_used.toFixed(0) }}% used
                    </span>
                  </div>
                </div>

                <!-- Inline Budget Creation -->
                <Transition name="slide-down">
                  <div v-if="showInlineBudget && selectedType === 'expense'" class="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-blue-900">Set Budget for This Category</span>
                      <button
                        type="button"
                        @click="showInlineBudget = false"
                        class="text-blue-600 hover:text-blue-700"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label for="inline-budget-amount" class="block text-xs font-medium text-slate-700 mb-1">
                          Budget Amount <span class="text-red-500">*</span>
                        </label>
                        <input
                          id="inline-budget-amount"
                          type="number"
                          v-model="inlineBudgetAmount"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white"
                        />
                      </div>
                      <div>
                        <label for="inline-budget-currency" class="block text-xs font-medium text-slate-700 mb-1">
                          Currency <span class="text-red-500">*</span>
                        </label>
                        <select
                          id="inline-budget-currency"
                          v-model="inlineBudgetCurrency"
                          class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white appearance-none"
                        >
                          <option
                            v-for="currency in SUPPORTED_CURRENCIES"
                            :key="currency.code"
                            :value="currency.code"
                          >
                            {{ currency.code }}
                          </option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      @click="createInlineBudget"
                      :disabled="!inlineBudgetAmount || creatingInlineBudget"
                      class="w-full px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {{ creatingInlineBudget ? 'Creating...' : 'Create Budget' }}
                    </button>
                  </div>
                </Transition>
              </div>

              <!-- EXPENSE FIELDS -->
              <template v-if="selectedType === 'expense'">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        v-model="formData.amount"
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
                    <select
                      id="expense-currency"
                      v-model="formData.currency"
                      aria-required="true"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 appearance-none"
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
                  </div>
                </div>

                <!-- Description -->
                <div>
                  <label for="expense-description" class="block text-sm font-medium text-slate-700 mb-2">
                    Description <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="expense-description"
                    type="text"
                    v-model="formData.description"
                    placeholder="E.g., Venue rental, Catering service..."
                    aria-required="true"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
                    required
                  />
                </div>

                <!-- Smart Defaults Info -->
                <div class="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                  <Sparkles class="w-4 h-4 text-slate-400" />
                  <span class="text-sm text-slate-600">
                    Auto-filled: <strong>{{ new Date(formData.date).toLocaleDateString() }}</strong>,
                    <strong>{{ formatPaymentMethod(formData.payment_method) }}</strong>
                  </span>
                </div>

                <!-- More Details (Collapsible) -->
                <div class="rounded-xl border border-slate-200 bg-white/70">
                  <button
                    type="button"
                    class="w-full flex items-center justify-between px-4 py-3"
                    @click="showMoreDetails = !showMoreDetails"
                    :aria-expanded="showMoreDetails"
                    aria-controls="more-details-section"
                  >
                    <span class="text-sm font-medium text-slate-700">More Details</span>
                    <ChevronDown
                      class="w-4 h-4 text-slate-500 transition-transform"
                      :class="showMoreDetails ? 'rotate-180' : ''"
                    />
                  </button>
                  <Transition name="collapse">
                    <div v-show="showMoreDetails" id="more-details-section" class="px-4 pb-4 space-y-3">
                      <div class="grid grid-cols-2 gap-3">
                        <!-- Date -->
                        <div>
                          <label for="expense-date" class="block text-sm font-medium text-slate-700 mb-2">Date</label>
                          <input
                            id="expense-date"
                            type="date"
                            v-model="formData.date"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
                          />
                        </div>

                        <!-- Payment Method -->
                        <div>
                          <label for="expense-payment-method" class="block text-sm font-medium text-slate-700 mb-2">Payment</label>
                          <select
                            id="expense-payment-method"
                            v-model="formData.payment_method"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 appearance-none"
                          >
                            <option
                              v-for="method in PAYMENT_METHOD_OPTIONS"
                              :key="method.value"
                              :value="method.value"
                            >
                              {{ method.label }}
                            </option>
                          </select>
                        </div>
                      </div>

                      <!-- Vendor -->
                      <div>
                        <label for="expense-paid-to" class="block text-sm font-medium text-slate-700 mb-2">Vendor</label>
                        <input
                          id="expense-paid-to"
                          type="text"
                          v-model="formData.paid_to"
                          placeholder="E.g., Luxury Hotel Group"
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
                        />
                      </div>

                      <!-- Receipt -->
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Receipt</label>
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
                          class="w-full px-4 py-4 border-2 border-slate-200 border-dashed rounded-lg hover:bg-slate-50 hover:border-emerald-300 transition-all group"
                        >
                          <div class="flex items-center justify-center gap-2">
                            <Upload class="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                            <p class="text-sm font-medium text-slate-600 group-hover:text-slate-900">
                              {{ selectedFile ? selectedFile.name : 'Click to upload' }}
                            </p>
                          </div>
                        </button>
                      </div>

                      <!-- Notes -->
                      <div>
                        <label for="expense-notes" class="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                        <textarea
                          id="expense-notes"
                          v-model="formData.notes"
                          rows="2"
                          placeholder="Additional notes..."
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </Transition>
                </div>
              </template>

              <!-- BUDGET FIELDS -->
              <template v-if="selectedType === 'budget'">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        v-model="formData.budgeted_amount"
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
                    <select
                      id="budget-currency"
                      v-model="formData.currency"
                      aria-required="true"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 appearance-none"
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
                  </div>
                </div>

                <!-- Budget Info if exists -->
                <div v-if="categoryBudget" class="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div class="flex items-start gap-2">
                    <AlertCircle class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p class="text-sm text-amber-700">
                      This category already has a budget of
                      <strong>{{ formatCurrency(categoryBudget.budgeted_amount, categoryBudget.currency) }}</strong>.
                      Creating a new budget will replace it.
                    </p>
                  </div>
                </div>

                <!-- Notes -->
                <div>
                  <label for="budget-notes" class="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                  <textarea
                    id="budget-notes"
                    v-model="formData.notes"
                    rows="3"
                    placeholder="Add notes about this budget..."
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 resize-none"
                  ></textarea>
                </div>
              </template>

              <!-- CATEGORY FIELDS -->
              <template v-if="selectedType === 'category'">
                <!-- Category Name -->
                <div>
                  <label for="category-name" class="block text-sm font-medium text-slate-700 mb-2">
                    Category Name <span class="text-red-500">*</span>
                  </label>
                  <input
                    id="category-name"
                    type="text"
                    v-model="formData.name"
                    placeholder="E.g., Venue, Catering, Photography..."
                    maxlength="100"
                    aria-required="true"
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
                    required
                  />
                </div>

                <!-- Description -->
                <div>
                  <label for="category-description" class="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    id="category-description"
                    v-model="formData.category_description"
                    rows="3"
                    placeholder="Describe what expenses this category covers..."
                    class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 resize-none"
                  ></textarea>
                </div>

                <!-- Color and Icon -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <!-- Color -->
                  <div>
                    <label for="category-color" class="block text-sm font-medium text-slate-700 mb-2">Color</label>
                    <div class="flex items-center gap-3">
                      <input
                        id="category-color"
                        v-model="formData.color"
                        type="color"
                        class="w-16 h-10 rounded-lg border border-slate-300 cursor-pointer"
                      />
                      <input
                        v-model="formData.color"
                        type="text"
                        placeholder="#3498db"
                        class="flex-1 px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90"
                      />
                    </div>
                  </div>

                  <!-- Icon -->
                  <div>
                    <label for="category-icon" class="block text-sm font-medium text-slate-700 mb-2">Icon</label>
                    <select
                      id="category-icon"
                      v-model="formData.icon"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 bg-white/90 appearance-none"
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
                  </div>
                </div>
              </template>

              <!-- Action Buttons -->
              <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  @click="handleClose"
                  class="flex-1 sm:flex-none px-5 py-2.5 text-sm border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-semibold transition-colors"
                  :disabled="submitting"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :class="[
                    'flex-1 sm:flex-none px-6 py-3 text-sm text-white rounded-lg font-bold transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center',
                    selectedType === 'expense'
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/40'
                      : selectedType === 'budget'
                      ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-600/40'
                      : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 shadow-purple-600/40'
                  ]"
                  :disabled="submitting"
                >
                  <span
                    v-if="submitting"
                    class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  {{ submitting ? 'Saving...' : getSubmitButtonText() }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  X,
  Zap,
  Receipt,
  Wallet,
  FolderOpen,
  DollarSign,
  ChevronDown,
  AlertCircle,
  TrendingUp,
  Upload,
  Sparkles
} from 'lucide-vue-next'
import {
  expensesService,
  expenseBudgetsService,
  expenseCategoriesService,
  type ExpenseCategory,
  type ExpenseBudget,
  type CreateExpenseRecordRequest,
  type CreateExpenseBudgetRequest
} from '@/services/api'
import { SUPPORTED_CURRENCIES, type CurrencyCode } from '@/constants/currencies'
import { formatPaymentMethod, PAYMENT_METHOD_OPTIONS } from '@/constants/paymentMethods'
import { getErrorMessage } from '@/utils/errorMessages'

interface Props {
  show: boolean
  eventId: string
  categories: ExpenseCategory[]
  budgets: ExpenseBudget[]
  initialType?: 'expense' | 'budget' | 'category'
}

const props = withDefaults(defineProps<Props>(), {
  initialType: 'expense'
})

const emit = defineEmits<{
  close: []
  success: [type: 'expense' | 'budget' | 'category']
}>()

// State
const modalRef = ref<HTMLElement | null>(null)
const selectedType = ref<'expense' | 'budget' | 'category'>(props.initialType)
const submitting = ref(false)
const error = ref<string | null>(null)
const showMoreDetails = ref(false)
const showInlineBudget = ref(false)
const creatingInlineBudget = ref(false)
const inlineBudgetAmount = ref<number | null>(null)
const inlineBudgetCurrency = ref<CurrencyCode>('USD')

// File upload
const receiptInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)

// Form data
const formData = ref({
  // Common
  category_id: '',
  currency: 'USD' as CurrencyCode,
  notes: '',

  // Expense fields
  amount: null as number | null,
  description: '',
  date: new Date().toISOString().split('T')[0],
  payment_method: 'cash' as 'cash' | 'bank_transfer' | 'credit_card' | 'mobile_payment' | 'check' | 'other',
  paid_to: '',

  // Budget fields
  budgeted_amount: null as number | null,

  // Category fields
  name: '',
  category_description: '',
  icon: '',
  color: '#3498db'
})

// Computed
const categoryBudget = computed(() => {
  if (!formData.value.category_id) return null
  const categoryId = parseInt(formData.value.category_id)
  return props.budgets.find(b => b.category === categoryId)
})

const formatCurrency = (amount: string | number, currency: string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount)
  } else if (currency === 'KHR') {
    return new Intl.NumberFormat('km-KH', {
      style: 'currency',
      currency: 'KHR',
      minimumFractionDigits: 0,
    }).format(numAmount)
  }
  return `${currency} ${numAmount.toFixed(2)}`
}

const getSubmitButtonText = () => {
  switch (selectedType.value) {
    case 'expense':
      return 'Add Expense'
    case 'budget':
      return 'Add Budget'
    case 'category':
      return 'Create Category'
  }
}

// Methods
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
  }
}

const onCategoryChange = () => {
  showInlineBudget.value = false
  // Match currency to category budget if exists
  if (categoryBudget.value) {
    formData.value.currency = categoryBudget.value.currency
  }
}

const switchToCategory = () => {
  selectedType.value = 'category'
  resetForm()
}

const createInlineBudget = async () => {
  if (!inlineBudgetAmount.value || !formData.value.category_id) return

  creatingInlineBudget.value = true
  error.value = null

  try {
    const categoryId = parseInt(formData.value.category_id)
    const requestData: CreateExpenseBudgetRequest & { category: number } = {
      category: categoryId,
      category_id: categoryId,
      budgeted_amount: inlineBudgetAmount.value,
      currency: inlineBudgetCurrency.value,
      notes: undefined
    }

    const response = await expenseBudgetsService.createBudget(props.eventId, requestData)

    if (response.success) {
      showInlineBudget.value = false
      inlineBudgetAmount.value = null
      // Emit success to refresh budgets
      emit('success', 'budget')
    } else {
      error.value = response.message || 'Failed to create budget'
    }
  } catch (err) {
    error.value = getErrorMessage(err, 'create inline budget')
  } finally {
    creatingInlineBudget.value = false
  }
}

const handleSubmit = async () => {
  error.value = null
  submitting.value = true

  try {
    if (selectedType.value === 'expense') {
      await submitExpense()
    } else if (selectedType.value === 'budget') {
      await submitBudget()
    } else if (selectedType.value === 'category') {
      await submitCategory()
    }
  } finally {
    submitting.value = false
  }
}

const submitExpense = async () => {
  if (!formData.value.category_id || !formData.value.description || !formData.value.amount) {
    error.value = 'Please fill in all required fields'
    return
  }

  const categoryId = parseInt(formData.value.category_id)
  const requestData: CreateExpenseRecordRequest = {
    category: categoryId,
    category_id: categoryId,
    description: formData.value.description,
    amount: formData.value.amount!,
    currency: formData.value.currency,
    date: formData.value.date,
    payment_method: formData.value.payment_method,
    paid_to: formData.value.paid_to || undefined,
    notes: formData.value.notes || undefined
  }

  const response = await expensesService.createExpense(
    props.eventId,
    requestData,
    selectedFile.value || undefined
  )

  if (response.success) {
    emit('success', 'expense')
    handleClose()
  } else {
    error.value = response.message || 'Failed to create expense'
  }
}

const submitBudget = async () => {
  if (!formData.value.category_id || !formData.value.budgeted_amount) {
    error.value = 'Please fill in all required fields'
    return
  }

  const categoryId = parseInt(formData.value.category_id)
  const requestData: CreateExpenseBudgetRequest & { category: number } = {
    category: categoryId,
    category_id: categoryId,
    budgeted_amount: formData.value.budgeted_amount!,
    currency: formData.value.currency,
    notes: formData.value.notes || undefined
  }

  const response = await expenseBudgetsService.createBudget(props.eventId, requestData)

  if (response.success) {
    emit('success', 'budget')
    handleClose()
  } else {
    error.value = response.message || 'Failed to create budget'
  }
}

const submitCategory = async () => {
  if (!formData.value.name) {
    error.value = 'Category name is required'
    return
  }

  const requestData = {
    name: formData.value.name,
    description: formData.value.category_description || undefined,
    icon: formData.value.icon || undefined,
    color: formData.value.color,
    is_active: true
  }

  const response = await expenseCategoriesService.createCategory(requestData)

  if (response.success) {
    emit('success', 'category')
    handleClose()
  } else {
    error.value = response.message || 'Failed to create category'
  }
}

const resetForm = () => {
  formData.value = {
    category_id: '',
    currency: 'USD',
    notes: '',
    amount: null,
    description: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    paid_to: '',
    budgeted_amount: null,
    name: '',
    category_description: '',
    icon: '',
    color: '#3498db'
  }
  selectedFile.value = null
  error.value = null
  showMoreDetails.value = false
  showInlineBudget.value = false
}

const handleClose = () => {
  resetForm()
  emit('close')
}

// Watch for type changes to reset form
watch(selectedType, () => {
  error.value = null
})

// Watch for show prop changes
watch(() => props.show, (newVal) => {
  if (newVal) {
    selectedType.value = props.initialType
    resetForm()
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
  transform: scale(0.95);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 500px;
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

/* Custom scrollbar */
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
</style>
