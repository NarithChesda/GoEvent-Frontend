<template>
  <div class="space-y-4">
    <!-- Loading skeleton -->
    <div v-if="loading" class="animate-pulse space-y-4" aria-hidden="true">
      <div class="flex items-center gap-2">
        <div class="h-12 w-32 flex-shrink-0 rounded-2xl bg-slate-100" />
        <div class="h-12 flex-1 rounded-2xl border-2 border-dashed border-slate-200" />
        <div class="h-12 w-12 flex-shrink-0 rounded-2xl border-2 border-dashed border-slate-200" />
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
        <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-4 py-3.5">
          <div class="h-10 w-10 flex-shrink-0 rounded-xl bg-slate-100" />
          <div class="min-w-0 flex-1 space-y-2">
            <div class="h-3 w-32 max-w-full rounded bg-slate-100" />
            <div class="h-1.5 w-full rounded-full bg-slate-100" />
          </div>
          <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div class="h-3 w-16 rounded bg-slate-100" />
            <div class="h-2.5 w-12 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50/50 border border-red-200/50 rounded-2xl p-6">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <AlertCircle class="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h4 class="font-semibold text-red-900 mb-1">{{ t('management.expenseBudgets.error.title') }}</h4>
          <p class="text-sm text-red-700">{{ error }}</p>
          <button @click="loadBudgets" class="mt-3 text-sm font-medium text-red-600 hover:text-red-700">
            {{ t('management.expenseBudgets.error.tryAgain') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Budget List -->
    <div v-else class="space-y-4">
      <!-- Filter + add row: category filter shares the row with the add-expense controls -->
      <div v-if="budgets.length > 1 || (canEdit && budgets.length > 0)" class="flex items-start gap-2">
        <!-- Category filter (same pattern as the guest group filter).
          Yields the row to the quick-add form on small screens while composing. -->
        <div
          v-if="budgets.length > 1"
          class="relative flex-shrink-0"
          :class="{ 'hidden sm:block': quickAddExpanded }"
        >
          <!-- Mobile: icon-only trigger (gradient when a filter is active) -->
          <button
            type="button"
            @click="isFilterDropdownOpen = !isFilterDropdownOpen"
            class="sm:hidden flex items-center justify-center w-12 h-12 rounded-full transition-all"
            :class="activeFilter === 'all'
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              : 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md shadow-[#2ecc71]/20'"
            :title="t('management.expenseBudgets.filter.filterByCategory')"
            :aria-label="t('management.expenseBudgets.filter.filterByCategory')"
          >
            <Filter class="w-5 h-5" />
          </button>

          <!-- Desktop: labeled trigger -->
          <button
            type="button"
            @click="isFilterDropdownOpen = !isFilterDropdownOpen"
            class="hidden sm:flex items-center gap-2 h-12 px-3.5 rounded-2xl text-sm font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Filter v-if="activeFilter === 'all'" class="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span
              v-else
              class="w-2.5 h-2.5 rounded-full flex-shrink-0"
              :style="{ backgroundColor: selectedCategory?.color || '#3498db' }"
            ></span>
            <span class="truncate max-w-[160px]">
              {{ activeFilter === 'all' ? t('management.expenseBudgets.filter.allCategories') : selectedCategory?.name || t('management.expenseBudgets.filter.select') }}
            </span>
            <ChevronDown
              class="w-4 h-4 text-slate-400 transition-transform flex-shrink-0"
              :class="{ 'rotate-180': isFilterDropdownOpen }"
            />
          </button>

          <!-- Desktop Dropdown Menu -->
          <Transition name="dropdown">
            <div
              v-if="isFilterDropdownOpen && isDesktop"
              class="hidden sm:block absolute top-full left-0 mt-2 w-[280px] bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 z-[100] max-h-[420px] overflow-y-auto"
              @click.stop
            >
              <div class="p-1.5">
                <!-- All Categories -->
                <button
                  @click="selectFilter('all')"
                  :class="[
                    'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                    activeFilter === 'all'
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  ]"
                >
                  <span class="flex-1 text-left">{{ t('management.expenseBudgets.filter.allCategories') }}</span>
                  <span class="text-xs text-slate-400 tabular-nums">{{ budgets.length }}</span>
                </button>

                <!-- Divider -->
                <div class="my-1.5 border-t border-slate-100"></div>

                <!-- Budgeted categories -->
                <button
                  v-for="budget in budgets"
                  :key="`filter-${budget.id}`"
                  @click="selectFilter(budget.category.toString())"
                  class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150"
                  :class="activeFilter === budget.category.toString()
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50'"
                >
                  <span
                    class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    :style="{ backgroundColor: budget.category_info.color || '#3498db' }"
                  ></span>
                  <span class="flex-1 text-left truncate">{{ budget.category_info.name }}</span>
                  <span
                    class="text-xs tabular-nums"
                    :class="budget.is_over_budget ? 'text-red-500 font-semibold' : 'text-slate-400'"
                  >
                    {{ budget.percentage_used.toFixed(0) }}%
                  </span>
                </button>
              </div>
            </div>
          </Transition>

          <!-- Desktop click outside to close dropdown -->
          <div
            v-if="isFilterDropdownOpen && isDesktop"
            @click="isFilterDropdownOpen = false"
            class="hidden sm:block fixed inset-0 z-[90]"
          ></div>
        </div>

        <!-- Inline quick add + drawer entry for detailed adds -->
        <template v-if="canEdit && budgets.length > 0">
          <div class="flex-1 min-w-0">
            <QuickAddExpenseRow
              :categories="categories"
              :budgets="budgets"
              :default-category-id="activeFilterCategoryId"
              :submitting="quickAddSubmitting"
              @submit="handleInlineAdd"
              @require-category="$emit('quick-add')"
              @category-created="handleCategoryCreated"
              @expand-change="quickAddExpanded = $event"
            />
          </div>
          <button
            type="button"
            @click="$emit('quick-add')"
            class="items-center justify-center w-12 h-12 flex-shrink-0 text-slate-500 border-2 border-dashed border-slate-300 rounded-2xl hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-50 transition-all"
            :class="quickAddExpanded ? 'hidden sm:flex' : 'flex'"
            :title="t('management.expenseBudgets.inlineAdd.detailed')"
            :aria-label="t('management.expenseBudgets.inlineAdd.detailed')"
          >
            <ReceiptText class="w-4 h-4" />
          </button>
        </template>
      </div>

      <!-- Mobile Filter Bottom Sheet (swipe down to close) -->
      <MobileBottomSheet
        :show="isFilterDropdownOpen && !isDesktop"
        :title="t('management.expenseBudgets.filter.filterByCategory')"
        @close="isFilterDropdownOpen = false"
      >
        <div class="py-1">
              <!-- All Categories -->
              <button
                type="button"
                :aria-pressed="activeFilter === 'all'"
                @click="selectFilter('all')"
                class="w-full flex items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
              >
                <span
                  class="w-3 h-3 rounded-full flex-shrink-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]"
                  aria-hidden="true"
                ></span>
                <span
                  :class="[
                    'flex-1 text-left text-sm',
                    activeFilter === 'all' ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                  ]"
                >{{ t('management.expenseBudgets.filter.allCategories') }}</span>
                <span class="text-xs text-slate-400 tabular-nums flex-shrink-0">{{ budgets.length }}</span>
                <Check v-if="activeFilter === 'all'" class="w-5 h-5 text-[#2ecc71] flex-shrink-0" />
              </button>

              <!-- Budgeted categories -->
              <button
                v-for="budget in budgets"
                :key="`sheet-filter-${budget.id}`"
                type="button"
                :aria-pressed="activeFilter === budget.category.toString()"
                @click="selectFilter(budget.category.toString())"
                class="w-full flex items-center gap-3 px-5 py-3 transition-colors active:bg-slate-50"
              >
                <span
                  class="w-3 h-3 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: budget.category_info.color || '#3498db' }"
                  aria-hidden="true"
                ></span>
                <span
                  :class="[
                    'flex-1 text-left text-sm truncate',
                    activeFilter === budget.category.toString() ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                  ]"
                >{{ budget.category_info.name }}</span>
                <span
                  class="text-xs tabular-nums flex-shrink-0"
                  :class="budget.is_over_budget ? 'text-red-500 font-semibold' : 'text-slate-400'"
                >{{ budget.percentage_used.toFixed(0) }}%</span>
                <Check v-if="activeFilter === budget.category.toString()" class="w-5 h-5 text-[#2ecc71] flex-shrink-0" />
              </button>
        </div>
      </MobileBottomSheet>

      <!-- Unified budget list card -->
      <div
        v-if="filteredBudgets.length > 0"
        class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden"
      >
        <div v-for="budget in filteredBudgets" :key="budget.id">
          <!-- Budget row (clickable) -->
          <div
            @click="toggleBudget(budget.id)"
            role="button"
            :aria-expanded="isBudgetExpanded(budget.id)"
            class="flex items-center gap-3 px-4 py-3.5 min-h-[64px] cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <!-- Icon -->
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              :style="{ backgroundColor: `${budget.category_info.color}14` }"
            >
              <component
                :is="getIconComponent(budget.category_info.icon)"
                class="w-4.5 h-4.5"
                :style="{ color: budget.category_info.color }"
              />
            </div>

            <!-- Name + progress -->
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold text-slate-900 truncate mb-1.5">
                {{ budget.category_info.name }}
              </h4>
              <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="budget.is_over_budget ? 'bg-red-500' : budget.percentage_used >= 85 ? 'bg-amber-500' : 'bg-emerald-500'"
                  :style="{ width: `${Math.min(budget.percentage_used, 100)}%` }"
                ></div>
              </div>
            </div>

            <!-- Remaining hero + budget total -->
            <div class="flex flex-col items-end flex-shrink-0">
              <p
                class="text-sm font-semibold tabular-nums"
                :class="budget.is_over_budget ? 'text-red-600' : 'text-slate-900'"
              >
                {{
                  budget.is_over_budget
                    ? t('management.expenseBudgets.overShort', { amount: remainingDisplay(budget) })
                    : t('management.expenseBudgets.remainingShort', { amount: remainingDisplay(budget) })
                }}
              </p>
              <p class="text-xs text-slate-400 tabular-nums flex items-center gap-1">
                <span>{{ t('management.expenseBudgets.budgetPrefix') }}</span>
                <!-- Budgeted amount: tap to adjust in place -->
                <input
                  v-if="budgetEditId === budget.id"
                  :ref="setInlineEditInputRef"
                  v-model="budgetEditValue"
                  type="number"
                  inputmode="decimal"
                  step="0.01"
                  min="0.01"
                  @click.stop
                  @keydown.enter.prevent="commitBudgetEdit(budget)"
                  @keydown.esc.prevent="cancelBudgetEdit"
                  @blur="commitBudgetEdit(budget)"
                  class="w-20 px-1 py-0 text-xs text-right tabular-nums text-slate-700 bg-white border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
                <button
                  v-else-if="canEdit"
                  type="button"
                  @click.stop="startBudgetEdit(budget)"
                  class="tabular-nums rounded px-0.5 -mx-0.5 hover:text-sky-600 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 transition-colors"
                  :title="t('management.expenseBudgets.inlineEdit.budgetHint')"
                >
                  {{ formatAmount(budget.budgeted_amount, budget.currency) }}
                </button>
                <span v-else class="tabular-nums">
                  {{ formatAmount(budget.budgeted_amount, budget.currency) }}
                </span>
              </p>
            </div>

            <!-- Expand indicator -->
            <ChevronDown
              class="w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0"
              :class="{ 'rotate-180': isBudgetExpanded(budget.id) }"
            />
          </div>

          <!-- Expense Items (Collapsible) -->
          <Transition name="slide-down">
            <div v-if="isBudgetExpanded(budget.id)" class="bg-slate-50/60 border-t border-slate-100">
              <div class="px-3 sm:px-4 py-3">
                <!-- Loading expenses -->
                <div v-if="loadingExpenses" class="flex justify-center py-3">
                  <div class="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>

                <div v-else class="space-y-2">
                  <!-- Spent summary + budget actions -->
                  <div class="flex items-center justify-between gap-2 px-1">
                    <p class="text-xs font-medium text-slate-500 tabular-nums">
                      {{ t('management.expenseBudgets.spentSummary', {
                        amount: formatAmount(budget.spent_amount, budget.currency),
                        count: getExpenseCount(budget.category)
                      }, getExpenseCount(budget.category)) }}
                    </p>
                    <button
                      v-if="canEdit"
                      type="button"
                      @click.stop="editBudget(budget)"
                      class="flex items-center gap-1 px-2 py-1 -my-1 text-xs font-medium text-slate-400 hover:text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors"
                      :title="t('management.expenseBudgets.editBudget')"
                    >
                      <Edit2 class="w-3 h-3" />
                      <span>{{ t('management.expenseBudgets.editBudget') }}</span>
                    </button>
                  </div>

                  <!-- Expense rows -->
                  <div
                    v-if="getBudgetExpenses(budget.category).length > 0"
                    class="bg-white rounded-xl border border-slate-200/60 divide-y divide-slate-100 overflow-hidden"
                  >
                    <div
                      v-for="expense in getBudgetExpenses(budget.category)"
                      :key="expense.id"
                      class="flex items-center gap-3 px-3 sm:px-4 py-2.5"
                      :class="canEdit ? 'cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors' : ''"
                      :role="canEdit ? 'button' : undefined"
                      :title="canEdit ? t('management.expenseBudgets.editExpense') : undefined"
                      @click="canEdit && editExpense(expense)"
                    >
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between gap-2 mb-0.5">
                        <!-- Description: tap to edit in place -->
                        <input
                          v-if="isInlineEditing(expense.id, 'description')"
                          :ref="setInlineEditInputRef"
                          v-model="inlineEditValue"
                          type="text"
                          @click.stop
                          @keydown.enter.prevent="commitInlineEdit(expense)"
                          @keydown.esc.prevent="cancelInlineEdit"
                          @blur="commitInlineEdit(expense)"
                          class="flex-1 min-w-0 -mx-1 px-1 py-0 text-sm font-medium text-slate-900 bg-white border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                        <button
                          v-else-if="canEdit"
                          type="button"
                          @click.stop="startInlineEdit(expense, 'description')"
                          class="min-w-0 text-left text-sm font-medium text-slate-900 truncate rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                          :title="t('management.expenseBudgets.inlineEdit.descriptionHint')"
                        >
                          {{ expense.description }}
                        </button>
                        <h5 v-else class="text-sm font-medium text-slate-900 truncate">{{ expense.description }}</h5>

                        <!-- Amount: tap to edit in place -->
                        <input
                          v-if="isInlineEditing(expense.id, 'amount')"
                          :ref="setInlineEditInputRef"
                          v-model="inlineEditValue"
                          type="number"
                          inputmode="decimal"
                          step="0.01"
                          min="0.01"
                          @click.stop
                          @keydown.enter.prevent="commitInlineEdit(expense)"
                          @keydown.esc.prevent="cancelInlineEdit"
                          @blur="commitInlineEdit(expense)"
                          class="w-24 flex-shrink-0 px-1.5 py-0.5 font-medium text-right tabular-nums text-slate-900 bg-white border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                        <button
                          v-else-if="canEdit"
                          type="button"
                          @click.stop="startInlineEdit(expense, 'amount')"
                          class="text-sm font-medium text-slate-900 tabular-nums flex-shrink-0 rounded px-0.5 -mx-0.5 hover:text-sky-600 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 transition-colors"
                          :title="t('management.expenseBudgets.inlineEdit.amountHint')"
                        >
                          {{ formatAmount(expense.amount, expense.currency) }}
                        </button>
                        <span v-else class="text-sm font-medium text-slate-900 tabular-nums flex-shrink-0">
                          {{ formatAmount(expense.amount, expense.currency) }}
                        </span>
                      </div>
                      <div class="flex items-center gap-1.5 flex-wrap text-xs text-slate-400">
                        <span>{{ formatDate(expense.date) }}</span>
                        <template v-if="expense.paid_to">
                          <span aria-hidden="true">·</span>
                          <span class="truncate max-w-[120px]">{{ expense.paid_to }}</span>
                        </template>
                        <template v-if="expense.receipt">
                          <span aria-hidden="true">·</span>
                          <a
                            :href="expense.receipt"
                            target="_blank"
                            @click.stop
                            class="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                            :title="t('management.expenseBudgets.viewReceipt')"
                          >
                            <Paperclip class="w-3 h-3" />
                            <span>{{ t('management.expenseBudgets.receipt') }}</span>
                          </a>
                        </template>
                      </div>
                    </div>

                    <!-- Tap affordance: the row opens the details drawer (delete lives in its header) -->
                    <ChevronRight v-if="canEdit" class="w-4 h-4 text-slate-300 flex-shrink-0" aria-hidden="true" />
                  </div>
                </div>

                <!-- Per-budget quick add: category and currency are implied -->
                <QuickAddExpenseRow
                  v-if="canEdit"
                  compact
                  :fixed-category-id="budget.category"
                  :categories="categories"
                  :budgets="budgets"
                  :submitting="quickAddSubmitting"
                  @submit="handleInlineAdd"
                />

                <!-- No expenses (read-only) -->
                <div
                  v-if="!canEdit && getBudgetExpenses(budget.category).length === 0"
                  class="text-center py-4"
                >
                  <p class="text-xs text-slate-400">{{ t('management.expenseBudgets.noExpensesYet') }}</p>
                </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Empty State - No budgets at all -->
      <div
        v-if="budgets.length === 0 && canEdit"
        @click="$emit('quick-add')"
        class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-12 hover:bg-slate-100/50 hover:border-emerald-400 transition-all duration-300 cursor-pointer group"
      >
        <div class="flex flex-col items-center justify-center">
          <div class="w-16 h-16 bg-slate-200 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
            <Wallet class="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          <h4 class="font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{{ t('management.expenseBudgets.empty.addFirstBudget') }}</h4>
          <p class="text-sm text-slate-400 mt-1">{{ t('management.expenseBudgets.empty.startTracking') }}</p>
        </div>
      </div>

      <!-- Empty State - No budgets (Read-only) -->
      <div
        v-else-if="budgets.length === 0"
        class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-12 text-center"
      >
        <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wallet class="w-8 h-8 text-slate-400" />
        </div>
        <h4 class="font-semibold text-slate-900 mb-2">{{ t('management.expenseBudgets.empty.noBudgetsYet') }}</h4>
        <p class="text-sm text-slate-500">{{ t('management.expenseBudgets.empty.noBudgetsCreated') }}</p>
      </div>

      <!-- Empty State - Filter has no results -->
      <div
        v-else-if="filteredBudgets.length === 0 && activeFilter !== 'all'"
        class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center"
      >
        <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Filter class="w-6 h-6 text-slate-400" />
        </div>
        <h4 class="font-semibold text-slate-900 mb-1">{{ t('management.expenseBudgets.empty.noBudgetFound') }}</h4>
        <p class="text-sm text-slate-500 mb-3">{{ t('management.expenseBudgets.empty.noBudgetForCategory') }}</p>
        <button
          @click="selectFilter('all')"
          class="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          {{ t('management.expenseBudgets.empty.viewAllBudgets') }}
        </button>
      </div>
    </div>

    <!-- Delete Budget Confirmation Modal -->
    <DeleteConfirmModal
      :show="!!deletingBudget"
      :loading="submitting"
      :title="t('management.expenseBudgets.deleteModal.budgetTitle')"
      :item-name="deletingBudget ? t('management.expenseBudgets.deleteModal.budgetFor', { name: deletingBudget.category_info.name }) : undefined"
      :warning-message="deletingBudgetWarning"
      @confirm="handleDelete"
      @cancel="deletingBudget = null"
    />

    <!-- Delete Expense Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteExpenseModal"
      :loading="submitting"
      :title="t('management.expenseBudgets.deleteModal.expenseTitle')"
      :item-name="deletingExpense ? deletingExpense.description : undefined"
      @confirm="handleDeleteExpense"
      @cancel="() => { showDeleteExpenseModal = false; deletingExpense = null }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { useAppLanguage } from '@/composables/useAppLanguage'
import {
  Edit2,
  AlertCircle,
  Wallet,
  ChevronDown,
  ChevronRight,
  Paperclip,
  Filter,
  ReceiptText,
  Check
} from 'lucide-vue-next'
import {
  expenseBudgetsService,
  expenseCategoriesService,
  expensesService,
  type ExpenseBudget,
  type ExpenseCategory,
  type ExpenseRecord,
  type CreateExpenseBudgetRequest
} from '@/services/api'
import { useExpenseIcons } from '@/composables/useExpenseIcons'
import { useNotifications } from '@/composables/useNotifications'
import { getErrorMessage } from '@/utils/errorMessages'
import {
  updateBudgetAfterExpenseDelete,
  cloneBudget,
  parseExpenseAmount
} from '@/utils/budgetCalculations'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import MobileBottomSheet from '@/components/common/MobileBottomSheet.vue'
import QuickAddExpenseRow, { type QuickAddExpensePayload } from './QuickAddExpenseRow.vue'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()
const { t } = useAppLanguage()

// Emits
const emit = defineEmits<{
  'create-category': []
  'quick-add': []
  'edit-budget': [budget: ExpenseBudget]
  'edit-expense': [expense: ExpenseRecord]
  'budget-deleted': []
  /** Budgets/expenses changed inline — parent should refresh summary + modal data. */
  'data-changed': []
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

// One open state drives the desktop dropdown and the mobile bottom sheet —
// gate on viewport so only one is ever mounted (matches Tailwind's `sm`)
const isDesktop = useMediaQuery('(min-width: 640px)')

// Whether the global quick-add row is composing (filter + detail button yield space on mobile)
const quickAddExpanded = ref(false)

const selectedCategory = computed(() => {
  if (activeFilter.value === 'all') return null
  const budget = budgets.value.find(b => b.category.toString() === activeFilter.value)
  return budget?.category_info || null
})

// Computed properties for filtering
const filteredBudgets = computed(() => {
  if (activeFilter.value === 'all') {
    return budgets.value
  }
  return budgets.value.filter(b => b.category.toString() === activeFilter.value)
})

// Computed warning message for delete budget modal
const deletingBudgetWarning = computed(() => {
  if (!deletingBudget.value) return ''
  const expenseCount = expenses.value.filter(e => e.category === deletingBudget.value!.category).length
  if (expenseCount > 0) {
    return t('management.expenseBudgets.deleteModal.warningWithExpenses', { count: expenseCount }, expenseCount)
  }
  return t('management.expenseBudgets.deleteModal.warningNoExpenses')
})

// Filter methods
const selectFilter = (filter: string) => {
  activeFilter.value = filter
  isFilterDropdownOpen.value = false
}

// Mobile bottom sheet: lock body scroll and close on Escape while open
const handleFilterKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isFilterDropdownOpen.value) {
    isFilterDropdownOpen.value = false
  }
}

watch(isFilterDropdownOpen, (open) => {
  if (open && window.matchMedia('(max-width: 639px)').matches) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

// "$105 left" / "$50 over" hero value for a budget row.
// Computed from spent/budgeted because the backend clamps remaining_amount to 0 when over.
const remainingDisplay = (budget: ExpenseBudget): string =>
  formatAmount(
    Math.abs(parseFloat(budget.budgeted_amount) - parseFloat(budget.spent_amount)),
    budget.currency
  )

// Use composables
const { success: showSuccess, error: showError } = useNotifications()

// --- Inline quick add (global row + per-budget rows) ---
const quickAddSubmitting = ref(false)

const activeFilterCategoryId = computed(() =>
  activeFilter.value === 'all' ? null : parseInt(activeFilter.value)
)

const handleInlineAdd = async (payload: QuickAddExpensePayload) => {
  if (quickAddSubmitting.value) return
  quickAddSubmitting.value = true

  try {
    // Auto-create a baseline budget when the category has none (same behavior as the drawer)
    if (!budgets.value.some((b) => b.category === payload.categoryId)) {
      try {
        const budgetResponse = await expenseBudgetsService.createBudget(props.eventId, {
          category: payload.categoryId,
          category_id: payload.categoryId,
          budgeted_amount: payload.amount,
          currency: payload.currency
        } as CreateExpenseBudgetRequest & { category: number })

        if (budgetResponse.success && budgetResponse.data) {
          budgets.value.push(budgetResponse.data)
        }
      } catch (err) {
        // Don't block expense creation if the baseline budget fails
        console.warn('Auto-budget creation failed:', err)
      }
    }

    const response = await expensesService.createExpense(props.eventId, {
      category: payload.categoryId,
      category_id: payload.categoryId,
      description: payload.description,
      amount: payload.amount,
      currency: payload.currency,
      date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      is_public: false
    })

    if (response.success && response.data) {
      addLocalExpense(response.data)
      showSuccess(t('management.expenseBudgets.toast.expenseAdded'))
      emit('data-changed')
    } else {
      showError(response.message || t('management.expenseBudgets.toast.addFailed'))
    }
  } catch (err) {
    showError(getErrorMessage(err, 'create expense'))
  } finally {
    quickAddSubmitting.value = false
  }
}

// A category was created from the quick-add picker
const handleCategoryCreated = (category: ExpenseCategory) => {
  categories.value.push(category)
  emit('data-changed')
}

// --- Inline click-to-edit (expense description/amount, budget amount) ---
const inlineEdit = ref<{ id: number; field: 'description' | 'amount' } | null>(null)
const inlineEditValue = ref('')
const budgetEditId = ref<number | null>(null)
const budgetEditValue = ref('')

// Function ref: focus + select the just-rendered edit input (guarded so
// re-renders while typing don't re-select the text).
const setInlineEditInputRef = (el: unknown) => {
  if (el instanceof HTMLInputElement && document.activeElement !== el) {
    nextTick(() => {
      el.focus()
      el.select()
    })
  }
}

const isInlineEditing = (expenseId: number, field: 'description' | 'amount'): boolean =>
  inlineEdit.value?.id === expenseId && inlineEdit.value?.field === field

const startInlineEdit = (expense: ExpenseRecord, field: 'description' | 'amount') => {
  inlineEdit.value = { id: expense.id, field }
  inlineEditValue.value =
    field === 'description' ? expense.description : parseExpenseAmount(expense.amount).toString()
}

const cancelInlineEdit = () => {
  inlineEdit.value = null
}

const commitInlineEdit = async (expense: ExpenseRecord) => {
  const edit = inlineEdit.value
  if (!edit || edit.id !== expense.id) return
  inlineEdit.value = null

  let patch: { description: string } | { amount: number }
  let updated: ExpenseRecord

  if (edit.field === 'description') {
    const newDescription = inlineEditValue.value.trim()
    if (!newDescription || newDescription === expense.description) return
    patch = { description: newDescription }
    updated = { ...expense, description: newDescription }
  } else {
    const newAmount = parseFloat(inlineEditValue.value)
    if (isNaN(newAmount) || newAmount <= 0 || newAmount === parseExpenseAmount(expense.amount)) return
    patch = { amount: newAmount }
    updated = { ...expense, amount: newAmount.toString() }
  }

  const previous = { ...expense }
  updateLocalExpense(updated) // optimistic — also adjusts the budget totals

  try {
    const response = await expensesService.updateExpense(props.eventId, expense.id, patch)

    if (response.success && response.data) {
      updateLocalExpense(response.data)
      showSuccess(t('management.expenseBudgets.toast.expenseUpdated'))
      emit('data-changed')
    } else {
      updateLocalExpense(previous)
      showError(response.message || t('management.expenseBudgets.toast.updateFailed'))
    }
  } catch (err) {
    updateLocalExpense(previous)
    showError(getErrorMessage(err, 'update expense'))
  }
}

const startBudgetEdit = (budget: ExpenseBudget) => {
  budgetEditId.value = budget.id
  budgetEditValue.value = parseFloat(budget.budgeted_amount).toString()
}

const cancelBudgetEdit = () => {
  budgetEditId.value = null
}

const commitBudgetEdit = async (budget: ExpenseBudget) => {
  if (budgetEditId.value !== budget.id) return
  budgetEditId.value = null

  const newAmount = parseFloat(budgetEditValue.value)
  if (isNaN(newAmount) || newAmount <= 0 || newAmount === parseFloat(budget.budgeted_amount)) return

  const previous = cloneBudget(budget)

  // Optimistic update
  const spent = parseFloat(budget.spent_amount)
  budget.budgeted_amount = newAmount.toString()
  budget.remaining_amount = (newAmount - spent).toString()
  budget.percentage_used = (spent / newAmount) * 100
  budget.is_over_budget = spent > newAmount

  try {
    const response = await expenseBudgetsService.patchBudget(props.eventId, budget.id, {
      budgeted_amount: newAmount
    })

    if (response.success && response.data) {
      updateLocalBudget(response.data)
      showSuccess(t('management.expenseBudgets.toast.budgetUpdated'))
      emit('data-changed')
    } else {
      Object.assign(budget, previous)
      showError(response.message || t('management.expenseBudgets.toast.updateFailed'))
    }
  } catch (err) {
    Object.assign(budget, previous)
    showError(getErrorMessage(err, 'update budget'))
  }
}

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
    showSuccess(t('management.expenseBudgets.toast.expenseDeleted'))

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
  const categoryId = deletingBudget.value.category
  const deletedBudget = cloneBudget(deletingBudget.value) // Keep a copy for rollback using helper

  // Get all expenses for this category (for optimistic UI update and rollback)
  const categoryExpenses = expenses.value.filter(e => e.category === categoryId)
  const deletedExpenses = [...categoryExpenses] // Keep a copy for rollback

  try {
    // Optimistic update: Remove budget from local list immediately
    budgets.value = budgets.value.filter(budget => budget.id !== deletedId)

    // Optimistic update: Remove all expenses in this category
    // (Backend now automatically deletes related expenses when budget is deleted)
    expenses.value = expenses.value.filter(e => e.category !== categoryId)

    // Close modal immediately for better UX
    deletingBudget.value = null

    // Delete the budget - backend will cascade delete all related expenses
    const response = await expenseBudgetsService.deleteBudget(
      props.eventId,
      deletedId
    )

    if (!response.success) {
      // Budget deletion failed, rollback both budget and expenses
      budgets.value.push(deletedBudget)
      expenses.value.push(...deletedExpenses)
      error.value = response.message || 'Failed to delete budget'
    } else {
      const expenseCount = categoryExpenses.length
      const message = expenseCount > 0
        ? t('management.expenseBudgets.toast.budgetAndExpensesDeleted', { count: expenseCount }, expenseCount)
        : t('management.expenseBudgets.toast.budgetDeleted')
      showSuccess(message)

      // Emit event to notify parent to refresh summary
      emit('budget-deleted')
    }
  } catch (err) {
    // Rollback on error
    budgets.value.push(deletedBudget)
    expenses.value.push(...deletedExpenses)
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
  document.addEventListener('keydown', handleFilterKeydown)
  await Promise.all([loadBudgets(), loadCategories()])
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleFilterKeydown)
  document.body.style.overflow = ''
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
  addLocalExpense,
  // Delete confirmations, triggered from the edit drawer's header
  confirmDeleteExpense,
  confirmDeleteBudget
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
  transform: translateY(-10px);
}
</style>
