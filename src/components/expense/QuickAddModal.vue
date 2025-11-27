<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="handleClose"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="show"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[520px] laptop-sm:w-[560px] laptop-md:w-[620px] desktop:w-[680px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2">
              <button
                @click="handleClose"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <h2 class="text-base font-semibold text-white">Quick Add</h2>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <form @submit.prevent="handleSubmit" class="p-4 space-y-5 pb-24">
              <!-- Error Message -->
              <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p class="text-sm text-red-600">{{ error }}</p>
              </div>

              <!-- Mode Toggle (Expense/Budget Tabs) -->
              <div class="space-y-3 sm:space-y-4">
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="selectedType = 'expense'"
                    :class="[
                      'flex-1 py-2.5 px-3 rounded-lg font-medium text-sm transition-all duration-200',
                      selectedType === 'expense'
                        ? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    ]"
                  >
                    <Receipt class="w-4 h-4 inline-block mr-1.5" />
                    Expense
                  </button>
                  <button
                    type="button"
                    @click="selectedType = 'budget'"
                    :class="[
                      'flex-1 py-2.5 px-3 rounded-lg font-medium text-sm transition-all duration-200',
                      selectedType === 'budget'
                        ? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    ]"
                  >
                    <Wallet class="w-4 h-4 inline-block mr-1.5" />
                    Budget
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
                    @click="showCreateCategoryForm = !showCreateCategoryForm"
                    class="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
                  >
                    {{ showCreateCategoryForm ? 'Cancel' : '+ Create Category' }}
                  </button>
                </div>

                <!-- Inline Create Category Form -->
                <Transition name="slide-down">
                  <div v-if="showCreateCategoryForm" class="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
                    <div class="flex items-center gap-2 text-purple-700 mb-2">
                      <FolderOpen class="w-4 h-4" />
                      <span class="text-sm font-medium">New Category</span>
                    </div>
                    <input
                      v-model="newCategoryName"
                      type="text"
                      placeholder="Category name *"
                      maxlength="100"
                      class="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white"
                    />
                    <textarea
                      v-model="newCategoryDescription"
                      rows="2"
                      placeholder="Description (optional)"
                      class="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white resize-none"
                    ></textarea>
                    <div class="flex items-center gap-2">
                      <input
                        v-model="newCategoryColor"
                        type="color"
                        class="w-10 h-8 rounded border border-purple-200 cursor-pointer"
                      />
                      <div class="flex-1 flex flex-wrap gap-1.5">
                        <button
                          v-for="color in colorPresets"
                          :key="color"
                          type="button"
                          @click="newCategoryColor = color"
                          :class="[
                            'w-6 h-6 rounded-md border transition-all',
                            newCategoryColor === color ? 'border-slate-900 ring-1 ring-offset-1 ring-slate-400' : 'border-transparent'
                          ]"
                          :style="{ backgroundColor: color }"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      @click="handleCreateCategory"
                      :disabled="!newCategoryName.trim() || isCreatingCategory"
                      class="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span v-if="isCreatingCategory" class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></span>
                      <span>{{ isCreatingCategory ? 'Creating...' : 'Create Category' }}</span>
                    </button>
                  </div>
                </Transition>

                <!-- Custom Dropdown for Category with inline Edit/Delete -->
                <div class="relative" ref="categoryDropdownRef">
                  <button
                    type="button"
                    @click="isCategoryDropdownOpen = !isCategoryDropdownOpen"
                    class="w-full flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium transition-all duration-200 hover:border-purple-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <FolderOpen class="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span class="flex-1 text-left text-slate-900 truncate">
                      {{ selectedCategory?.name || 'Select a category' }}
                    </span>
                    <ChevronDown
                      class="w-4 h-4 text-slate-400 transition-transform flex-shrink-0"
                      :class="{ 'rotate-180': isCategoryDropdownOpen }"
                    />
                  </button>

                  <!-- Dropdown Menu -->
                  <Transition name="dropdown">
                    <div
                      v-if="isCategoryDropdownOpen"
                      class="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] max-h-[300px] overflow-y-auto"
                    >
                      <div
                        v-for="category in categories"
                        :key="category.id"
                        class="group/item relative border-b border-slate-100 last:border-b-0"
                      >
                        <div
                          :class="[
                            'flex items-center gap-2 px-3 py-2.5 transition-all duration-200',
                            formData.category_id === category.id.toString()
                              ? 'bg-gradient-to-r from-emerald-500 to-sky-500'
                              : 'hover:bg-slate-50'
                          ]"
                        >
                          <!-- Clickable area for selection -->
                          <button
                            type="button"
                            @click="selectCategory(category.id)"
                            :class="[
                              'flex-1 flex items-center gap-3 text-sm font-medium min-w-0',
                              formData.category_id === category.id.toString() ? 'text-white' : 'text-slate-700'
                            ]"
                          >
                            <div
                              class="w-3 h-3 rounded-full flex-shrink-0"
                              :style="{ backgroundColor: formData.category_id === category.id.toString() ? 'white' : (category.color || '#3498db') }"
                            />
                            <span class="flex-1 text-left truncate">{{ category.name }}</span>
                          </button>
                          <!-- Edit/Delete Actions -->
                          <div class="flex items-center gap-0.5 flex-shrink-0 ml-1">
                            <button
                              type="button"
                              @click.stop="handleEditCategory(category)"
                              :title="`Edit ${category.name}`"
                              :class="[
                                'p-1.5 rounded-md transition-all',
                                formData.category_id === category.id.toString()
                                  ? 'text-white/90 hover:text-white hover:bg-white/20'
                                  : 'text-slate-400 hover:text-blue-600 hover:bg-blue-100'
                              ]"
                            >
                              <Edit2 class="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              @click.stop="handleDeleteCategory(category)"
                              :title="`Delete ${category.name}`"
                              :class="[
                                'p-1.5 rounded-md transition-all',
                                formData.category_id === category.id.toString()
                                  ? 'text-white/90 hover:text-white hover:bg-white/20'
                                  : 'text-slate-400 hover:text-red-600 hover:bg-red-100'
                              ]"
                            >
                              <Trash2 class="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </div>

                <!-- Inline Edit Category Form -->
                <Transition name="slide-down">
                  <div v-if="showEditCategoryForm && editingCategory" class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2 text-blue-700">
                        <Edit2 class="w-4 h-4" />
                        <span class="text-sm font-medium">Edit Category</span>
                      </div>
                      <button
                        type="button"
                        @click="closeEditCategoryForm"
                        class="p-1 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      v-model="editCategoryName"
                      type="text"
                      placeholder="Category name *"
                      maxlength="100"
                      class="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                    />
                    <textarea
                      v-model="editCategoryDescription"
                      rows="2"
                      placeholder="Description (optional)"
                      class="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white resize-none"
                    ></textarea>
                    <div class="flex items-center gap-2">
                      <input
                        v-model="editCategoryColor"
                        type="color"
                        class="w-10 h-8 rounded border border-blue-200 cursor-pointer"
                      />
                      <div class="flex-1 flex flex-wrap gap-1.5">
                        <button
                          v-for="color in colorPresets"
                          :key="color"
                          type="button"
                          @click="editCategoryColor = color"
                          :class="[
                            'w-6 h-6 rounded-md border transition-all',
                            editCategoryColor === color ? 'border-slate-900 ring-1 ring-offset-1 ring-slate-400' : 'border-transparent'
                          ]"
                          :style="{ backgroundColor: color }"
                        />
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        @click="closeEditCategoryForm"
                        class="flex-1 px-3 py-2 text-sm border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        @click="submitEditCategory"
                        :disabled="!editCategoryName.trim() || isUpdatingCategory"
                        class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span v-if="isUpdatingCategory" class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></span>
                        <span>{{ isUpdatingCategory ? 'Saving...' : 'Save Changes' }}</span>
                      </button>
                    </div>
                  </div>
                </Transition>

                <!-- Inline Delete Category Confirmation -->
                <Transition name="slide-down">
                  <div v-if="showDeleteCategoryConfirm && deletingCategory" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl space-y-3">
                    <div class="flex items-center gap-2 text-red-700">
                      <Trash2 class="w-4 h-4" />
                      <span class="text-sm font-medium">Delete Category</span>
                    </div>
                    <p class="text-sm text-red-800">
                      Are you sure you want to delete "<span class="font-semibold">{{ deletingCategory.name }}</span>"?
                    </p>
                    <p class="text-xs text-red-600 bg-red-100 px-2 py-1.5 rounded-md">
                      ⚠️ This action cannot be undone!
                    </p>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        @click="closeDeleteCategoryConfirm"
                        class="flex-1 px-3 py-2 text-sm border border-red-200 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        @click="submitDeleteCategory"
                        :disabled="isDeletingCategory"
                        class="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span v-if="isDeletingCategory" class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></span>
                        <span>{{ isDeletingCategory ? 'Deleting...' : 'Delete Category' }}</span>
                      </button>
                    </div>
                  </div>
                </Transition>
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

            </form>
          </div>

        <!-- Footer with Action Buttons -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <button
              type="button"
              @click="handleSubmit"
              :disabled="submitting"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                v-if="submitting"
                class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"
              ></span>
              <span>{{ submitting ? 'Saving...' : getSubmitButtonText() }}</span>
            </button>

            <button
              type="button"
              @click="handleClose"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import {
  X,
  Receipt,
  Wallet,
  FolderOpen,
  DollarSign,
  ChevronDown,
  AlertCircle,
  TrendingUp,
  Upload,
  Sparkles,
  ArrowRight,
  Edit2,
  Trash2
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

// Color presets for category quick selection
const colorPresets = [
  '#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f39c12',
  '#1abc9c', '#e91e63', '#00bcd4', '#ff5722', '#607d8b'
]

// State
const selectedType = ref<'expense' | 'budget'>(props.initialType === 'category' ? 'expense' : props.initialType)
const submitting = ref(false)
const error = ref<string | null>(null)
const showMoreDetails = ref(false)
const showInlineBudget = ref(false)
const creatingInlineBudget = ref(false)
const inlineBudgetAmount = ref<number | null>(null)
const inlineBudgetCurrency = ref<CurrencyCode>('USD')

// Category management state
const showCreateCategoryForm = ref(false)
const newCategoryName = ref('')
const newCategoryDescription = ref('')
const newCategoryColor = ref('#3498db')
const isCreatingCategory = ref(false)

const showEditCategoryForm = ref(false)
const editingCategory = ref<ExpenseCategory | null>(null)
const editCategoryName = ref('')
const editCategoryDescription = ref('')
const editCategoryColor = ref('#3498db')
const isUpdatingCategory = ref(false)

const showDeleteCategoryConfirm = ref(false)
const deletingCategory = ref<ExpenseCategory | null>(null)
const isDeletingCategory = ref(false)

// File upload
const receiptInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)

// Category dropdown state
const isCategoryDropdownOpen = ref(false)
const categoryDropdownRef = ref<HTMLElement | null>(null)

// Close category dropdown when clicking outside
onClickOutside(categoryDropdownRef, () => {
  isCategoryDropdownOpen.value = false
})

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

const selectedCategory = computed(() => {
  if (!formData.value.category_id) return null
  const categoryId = parseInt(formData.value.category_id)
  return props.categories.find(c => c.id === categoryId)
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
    default:
      return 'Add'
  }
}

// Methods
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
  }
}

const selectCategory = (categoryId: number) => {
  formData.value.category_id = categoryId.toString()
  isCategoryDropdownOpen.value = false
  showInlineBudget.value = false
  // Match currency to category budget if exists
  if (categoryBudget.value) {
    formData.value.currency = categoryBudget.value.currency
  }
}

// Category management methods
const handleCreateCategory = async () => {
  if (!newCategoryName.value.trim()) return

  isCreatingCategory.value = true
  error.value = null

  try {
    const requestData = {
      name: newCategoryName.value.trim(),
      description: newCategoryDescription.value.trim() || undefined,
      color: newCategoryColor.value,
      is_active: true
    }

    const response = await expenseCategoriesService.createCategory(requestData)

    if (response.success && response.data) {
      // Auto-select the newly created category
      formData.value.category_id = response.data.id.toString()

      // Close the form and reset fields
      showCreateCategoryForm.value = false
      newCategoryName.value = ''
      newCategoryDescription.value = ''
      newCategoryColor.value = '#3498db'

      // Emit success to refresh categories
      emit('success', 'category')
    } else {
      error.value = response.message || 'Failed to create category'
    }
  } catch (err) {
    error.value = getErrorMessage(err, 'create category')
  } finally {
    isCreatingCategory.value = false
  }
}

const openEditCategoryForm = (category?: ExpenseCategory) => {
  const categoryToEdit = category || selectedCategory.value
  if (!categoryToEdit) return

  // Close other forms
  showCreateCategoryForm.value = false
  showDeleteCategoryConfirm.value = false

  // Set up edit form
  editingCategory.value = categoryToEdit
  editCategoryName.value = categoryToEdit.name
  editCategoryDescription.value = categoryToEdit.description || ''
  editCategoryColor.value = categoryToEdit.color || '#3498db'
  showEditCategoryForm.value = true
}

const closeEditCategoryForm = () => {
  showEditCategoryForm.value = false
  editingCategory.value = null
  editCategoryName.value = ''
  editCategoryDescription.value = ''
  editCategoryColor.value = '#3498db'
}

const submitEditCategory = async () => {
  if (!editingCategory.value || !editCategoryName.value.trim()) return

  isUpdatingCategory.value = true
  error.value = null

  try {
    const requestData = {
      name: editCategoryName.value.trim(),
      description: editCategoryDescription.value.trim() || undefined,
      color: editCategoryColor.value,
      is_active: true
    }

    const response = await expenseCategoriesService.updateCategory(editingCategory.value.id, requestData)

    if (response.success) {
      closeEditCategoryForm()
      // Emit success to refresh categories
      emit('success', 'category')
    } else {
      error.value = response.message || 'Failed to update category'
    }
  } catch (err) {
    error.value = getErrorMessage(err, 'update category')
  } finally {
    isUpdatingCategory.value = false
  }
}

const openDeleteCategoryConfirm = (category?: ExpenseCategory) => {
  const categoryToDelete = category || selectedCategory.value
  if (!categoryToDelete) return

  // Close other forms
  showCreateCategoryForm.value = false
  showEditCategoryForm.value = false

  deletingCategory.value = categoryToDelete
  showDeleteCategoryConfirm.value = true
}

const closeDeleteCategoryConfirm = () => {
  showDeleteCategoryConfirm.value = false
  deletingCategory.value = null
}

const handleEditCategory = (category: ExpenseCategory) => {
  openEditCategoryForm(category)
  isCategoryDropdownOpen.value = false
}

const handleDeleteCategory = (category: ExpenseCategory) => {
  openDeleteCategoryConfirm(category)
  isCategoryDropdownOpen.value = false
}

const submitDeleteCategory = async () => {
  if (!deletingCategory.value) return

  isDeletingCategory.value = true
  error.value = null

  try {
    const response = await expenseCategoriesService.deleteCategory(deletingCategory.value.id)

    if (response.success) {
      // Clear the category selection if it was deleted
      if (formData.value.category_id === deletingCategory.value.id.toString()) {
        formData.value.category_id = ''
      }

      closeDeleteCategoryConfirm()
      // Emit success to refresh categories
      emit('success', 'category')
    } else {
      error.value = response.message || 'Failed to delete category'
    }
  } catch (err) {
    error.value = getErrorMessage(err, 'delete category')
  } finally {
    isDeletingCategory.value = false
  }
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

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watch for type changes to reset form
watch(selectedType, () => {
  error.value = null
})

// Watch for show prop changes
watch(() => props.show, (newVal) => {
  if (newVal) {
    selectedType.value = props.initialType === 'category' ? 'expense' : props.initialType
    resetForm()
    // Lock body scroll when drawer opens
    const scrollbarWidth = getScrollbarWidth()
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
  } else {
    // Restore body scroll when drawer closes
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  }
})
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide from right on desktop, from bottom on mobile */
.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
  }
}

/* Slide down transition for inline forms */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
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
