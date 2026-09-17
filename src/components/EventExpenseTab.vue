<template>
  <div class="space-y-5">
    <!-- Header -->
    <div>
      <h2 class="text-xl sm:text-2xl font-bold leading-tight tracking-tight text-slate-900">
        {{ t('management.expenseTab.title') }}
      </h2>
      <p class="mt-1 text-xs sm:text-sm text-slate-600">{{ t('management.expenseTab.subtitle') }}</p>
    </div>

    <!-- Loading: the same single sheet, so nothing jumps when it resolves -->
    <div
      v-if="budget.loading.value"
      class="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100"
      aria-hidden="true"
    >
      <div class="px-4 pb-5 pt-5 sm:px-5">
        <div class="h-11 w-48 max-w-full rounded bg-slate-100" />
        <div class="mt-3 h-3 w-56 max-w-full rounded bg-slate-100" />
        <div class="mt-4 h-1.5 w-full rounded-full bg-slate-100" />
      </div>
      <div v-for="i in 4" :key="i" class="flex items-start gap-3 px-4 py-3.5 sm:px-5">
        <div class="mt-0.5 h-9 w-9 flex-shrink-0 rounded-full bg-slate-100" />
        <div class="min-w-0 flex-1">
          <div class="flex justify-between gap-3">
            <div class="h-3.5 w-28 rounded bg-slate-100" />
            <div class="h-3.5 w-16 rounded bg-slate-100" />
          </div>
          <div class="mt-2 h-1.5 w-full rounded-full bg-slate-100" />
          <div class="mt-1.5 h-2.5 w-32 rounded bg-slate-100" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="budget.error.value" class="rounded-2xl border border-red-200/50 bg-red-50/50 p-6">
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
          <AlertCircle class="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h4 class="font-semibold text-red-900">{{ t('management.expenseBudgets.error.title') }}</h4>
          <p class="mt-0.5 text-sm text-red-700">{{ budget.error.value }}</p>
          <button
            type="button"
            class="mt-2 text-sm font-medium text-red-600 transition-colors hover:text-red-700"
            @click="budget.load()"
          >
            {{ t('management.expenseBudgets.error.tryAgain') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Nothing planned and nothing spent -->
    <div
      v-else-if="!budget.hasAnyData.value"
      class="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-12 text-center"
    >
      <div
        class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20"
      >
        <Wallet class="h-7 w-7 text-[#2ecc71]" aria-hidden="true" />
      </div>
      <h3 class="text-base font-semibold text-slate-900">
        {{ canEdit ? t('management.budgetPlan.empty.title') : t('management.expenseBudgets.empty.noBudgetsYet') }}
      </h3>
      <p class="mx-auto mt-1 max-w-sm text-sm text-slate-500">
        {{ canEdit ? t('management.budgetPlan.empty.description') : t('management.expenseBudgets.empty.noBudgetsCreated') }}
      </p>
      <button
        v-if="canEdit"
        type="button"
        class="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-slate-800"
        @click="openDrawer('budget')"
      >
        {{ t('management.budgetPlan.empty.action') }}
      </button>
    </div>

    <!-- One sheet: the total is the first cell of the same list its categories
         are rows of, so there is no summary widget hovering over a table. -->
    <template v-else>
      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
        <BudgetPlanSummary
          :plans="budget.plans.value"
          :active-currency="activeCurrency"
          @update:currency="activeCurrency = $event as CurrencyCode"
        />
        <BudgetCategoryList
          :store="budget"
          :currency="activeCurrency"
          :show-currency-picker="budget.plans.value.length > 1"
          :can-edit="canEdit"
          @edit-budget="editBudget"
          @edit-expense="editExpense"
          @need-category="openDrawer('category')"
        />
      </div>

      <!-- Receipts, vendors, dates and payment method live one level deeper, so
           the sheet above stays about amounts. -->
      <div v-if="canEdit" class="flex justify-end">
        <button
          type="button"
          class="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700"
          @click="openDrawer('expense')"
        >
          <ReceiptText class="h-3.5 w-3.5" />
          <span>{{ t('management.expenseBudgets.inlineAdd.detailed') }}</span>
        </button>
      </div>
    </template>

    <!-- Full-detail editor: receipts, vendors, dates, payment method -->
    <QuickAddModal
      :show="drawerOpen"
      :event-id="eventId"
      :categories="budget.categories.value"
      :budgets="budget.budgets.value"
      :initial-type="drawerType"
      :edit-mode="isEditMode"
      :edit-data="editData"
      @close="closeDrawer"
      @success="handleDrawerSuccess"
      @delete="handleDrawerDelete"
    />

    <DeleteConfirmModal
      :show="!!deletingBudget"
      :loading="deleting"
      :title="t('management.expenseBudgets.deleteModal.budgetTitle')"
      :item-name="deletingBudget ? t('management.expenseBudgets.deleteModal.budgetFor', { name: deletingBudget.category_info.name }) : undefined"
      :warning-message="deletingBudgetWarning"
      @confirm="confirmDeleteBudget"
      @cancel="deletingBudget = null"
    />

    <DeleteConfirmModal
      :show="!!deletingExpense"
      :loading="deleting"
      :title="t('management.expenseBudgets.deleteModal.expenseTitle')"
      :item-name="deletingExpense?.description"
      @confirm="confirmDeleteExpense"
      @cancel="deletingExpense = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { AlertCircle, ReceiptText, Wallet } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useToast } from '@/composables/useToast'
import { useEventBudget } from '@/composables/useEventBudget'
import type { ExpenseBudget, ExpenseCategory, ExpenseRecord } from '@/services/api'
import type { CurrencyCode } from '@/constants/currencies'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import BudgetPlanSummary from './expense/BudgetPlanSummary.vue'
import BudgetCategoryList from './expense/BudgetCategoryList.vue'
import QuickAddModal from './expense/QuickAddModal.vue'

const props = defineProps<{
  eventId: string
  canEdit: boolean
}>()

const { t } = useAppLanguage()
const { showError } = useToast()

const budget = useEventBudget(() => props.eventId)

// ---------------------------------------------------------------- currency

/**
 * Riel and dollar budgets are separate plans, not one plan in two units —
 * there is no exchange rate anywhere in this feature, and inventing one would
 * put a number on screen nobody agreed to. The hero reads one at a time.
 */
const activeCurrency = ref<CurrencyCode>('USD')

watch(
  budget.plans,
  (plans) => {
    if (plans.length === 0) return
    if (!plans.some((plan) => plan.currency === activeCurrency.value)) {
      activeCurrency.value = plans[0].currency as CurrencyCode
    }
  },
  { immediate: true }
)

// ---------------------------------------------------------------- drawer

const drawerOpen = ref(false)
const drawerType = ref<'expense' | 'budget' | 'category'>('expense')
const isEditMode = ref(false)
const editData = ref<ExpenseBudget | ExpenseRecord | undefined>(undefined)

const openDrawer = (type: 'expense' | 'budget' | 'category') => {
  drawerType.value = type
  isEditMode.value = false
  editData.value = undefined
  drawerOpen.value = true
}

const closeDrawer = () => {
  drawerOpen.value = false
  isEditMode.value = false
  editData.value = undefined
}

const editBudget = (value: ExpenseBudget) => {
  drawerType.value = 'budget'
  isEditMode.value = true
  editData.value = value
  drawerOpen.value = true
}

const editExpense = (value: ExpenseRecord) => {
  drawerType.value = 'expense'
  isEditMode.value = true
  editData.value = value
  drawerOpen.value = true
}

/**
 * The drawer performs its own writes and can touch a budget and an expense in
 * one save, so its result is reconciled with a silent refetch rather than by
 * replaying each emitted record — applying both by hand double-counted the
 * spend against the budget that had just been created for it.
 */
const handleDrawerSuccess = async (
  _type: 'expense' | 'budget' | 'category',
  _data?: ExpenseBudget | ExpenseRecord | ExpenseCategory
) => {
  isEditMode.value = false
  editData.value = undefined
  await budget.load({ silent: true })
}

// ---------------------------------------------------------------- deleting

const deletingBudget = ref<ExpenseBudget | null>(null)
const deletingExpense = ref<ExpenseRecord | null>(null)
const deleting = ref(false)

const handleDrawerDelete = (type: 'expense' | 'budget', data: ExpenseBudget | ExpenseRecord) => {
  closeDrawer()
  if (type === 'budget') deletingBudget.value = data as ExpenseBudget
  else deletingExpense.value = data as ExpenseRecord
}

const deletingBudgetWarning = computed(() => {
  if (!deletingBudget.value) return ''
  const count = budget.expensesForCategory(deletingBudget.value.category).length
  return count > 0
    ? t('management.expenseBudgets.deleteModal.warningWithExpenses', { count }, count)
    : t('management.expenseBudgets.deleteModal.warningNoExpenses')
})

const confirmDeleteBudget = async () => {
  const target = deletingBudget.value
  if (!target) return

  deleting.value = true
  const result = await budget.deleteBudget(target)
  deleting.value = false
  deletingBudget.value = null

  if (!result.ok) {
    showError(t('management.expenseBudgets.toast.updateFailed'), { description: result.message })
  }
}

const confirmDeleteExpense = async () => {
  const target = deletingExpense.value
  if (!target) return

  deleting.value = true
  const result = await budget.deleteExpense(target)
  deleting.value = false
  deletingExpense.value = null

  if (!result.ok) {
    showError(t('management.expenseBudgets.toast.updateFailed'), { description: result.message })
  }
}

onMounted(() => budget.load())

// The manage view opens this tab's create flows from its own affordances.
defineExpose({
  openQuickAdd: () => openDrawer('expense'),
  openAddBudgetModal: () => openDrawer('budget'),
  openAddCategoryModal: () => openDrawer('category'),
})
</script>
