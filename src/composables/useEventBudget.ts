/**
 * Single source of truth for one event's budget plan.
 *
 * Budgets, expenses and categories used to be fetched independently by
 * `EventExpenseTab`, `ExpenseSummaryView` and `ExpenseBudgetsView` — three
 * budget requests on mount, three copies of the same numbers, and a web of
 * `defineExpose`d `updateLocal*` methods the parent called into the children to
 * keep them from drifting apart. This owns the data once; the views are
 * presentational and read the same derived totals, so the hero can never
 * disagree with the list under it.
 *
 * Every mutation is optimistic with rollback, because a budget screen that
 * waits for a round trip before moving a number feels broken while you are
 * typing into it.
 */
import { ref, computed, readonly } from 'vue'
import {
  expenseBudgetsService,
  expenseCategoriesService,
  expensesService,
  type ExpenseBudget,
  type ExpenseCategory,
  type ExpenseRecord,
  type CreateExpenseBudgetRequest,
} from '@/services/api'
import {
  cloneBudget,
  parseExpenseAmount,
  updateBudgetAfterExpenseDelete,
} from '@/utils/budgetCalculations'
import { getErrorMessage } from '@/utils/errorMessages'

export type BudgetCurrency = 'USD' | 'KHR'

/** One category's slice of the allocation bar. */
export interface PlanSegment {
  budgetId: number
  categoryId: number
  name: string
  color: string
  planned: number
  spent: number
  /** This category's share of everything planned in its currency (0–1). */
  share: number
  /** How much of its own allocation is spent (0–1, clamped for drawing). */
  fill: number
  isOver: boolean
}

/** Everything the hero needs for one currency. */
export interface CurrencyPlan {
  currency: string
  planned: number
  spent: number
  /** Signed: negative once spending passes the plan. */
  remaining: number
  percent: number
  isOver: boolean
  categoryCount: number
  expenseCount: number
  segments: PlanSegment[]
}

const FALLBACK_COLOR = '#64748b'

export function useEventBudget(eventId: () => string) {
  const budgets = ref<ExpenseBudget[]>([])
  const expenses = ref<ExpenseRecord[]>([])
  const categories = ref<ExpenseCategory[]>([])

  const loading = ref(true)
  const error = ref<string | null>(null)
  const mutating = ref(false)

  // ---------------------------------------------------------------- derived

  /**
   * Remaining is always computed from budgeted − spent, never read from
   * `remaining_amount`: the backend clamps that field to 0 once a category is
   * over budget, so trusting it hides exactly the overspend the user needs.
   */
  const budgetRemaining = (budget: ExpenseBudget): number =>
    parseFloat(budget.budgeted_amount) - parseFloat(budget.spent_amount)

  /** Currencies actually in play, biggest plan first. */
  const plans = computed<CurrencyPlan[]>(() => {
    const byCurrency = new Map<string, { planned: number; spent: number; segments: PlanSegment[]; expenseCount: number }>()

    const bucket = (currency: string) => {
      let entry = byCurrency.get(currency)
      if (!entry) {
        entry = { planned: 0, spent: 0, segments: [], expenseCount: 0 }
        byCurrency.set(currency, entry)
      }
      return entry
    }

    for (const budget of budgets.value) {
      const entry = bucket(budget.currency)
      const planned = parseFloat(budget.budgeted_amount) || 0
      const spent = parseFloat(budget.spent_amount) || 0
      entry.planned += planned
      entry.segments.push({
        budgetId: budget.id,
        categoryId: budget.category,
        name: budget.category_info.name,
        color: budget.category_info.color || FALLBACK_COLOR,
        planned,
        spent,
        share: 0, // filled in below, once the currency total is known
        fill: planned > 0 ? Math.min(spent / planned, 1) : 0,
        isOver: spent > planned,
      })
    }

    // Spending is summed from the expense records rather than from each
    // budget's `spent_amount`, so an expense in a category with no budget of
    // its own still counts against the plan instead of vanishing.
    for (const expense of expenses.value) {
      const entry = bucket(expense.currency)
      entry.spent += parseExpenseAmount(expense.amount)
      entry.expenseCount++
    }

    return Array.from(byCurrency.entries())
      .map(([currency, entry]) => {
        const segments = entry.segments
          .map((segment) => ({
            ...segment,
            share: entry.planned > 0 ? segment.planned / entry.planned : 0,
          }))
          .sort((a, b) => b.planned - a.planned)

        return {
          currency,
          planned: entry.planned,
          spent: entry.spent,
          remaining: entry.planned - entry.spent,
          percent: entry.planned > 0 ? Math.round((entry.spent / entry.planned) * 100) : 0,
          isOver: entry.spent > entry.planned,
          categoryCount: segments.length,
          expenseCount: entry.expenseCount,
          segments,
        }
      })
      .sort((a, b) => b.planned - a.planned)
  })

  const hasAnyData = computed(() => budgets.value.length > 0 || expenses.value.length > 0)

  const expensesForCategory = (categoryId: number): ExpenseRecord[] =>
    expenses.value
      .filter((expense) => expense.category === categoryId)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id))

  /** Categories with no budget yet — what the "plan a category" picker offers. */
  const unbudgetedCategories = computed(() =>
    categories.value.filter(
      (category) => !budgets.value.some((budget) => budget.category === category.id)
    )
  )

  // ------------------------------------------------------------ local sync

  /** Recompute a budget's spent/percent fields after its expenses change. */
  const recalcBudget = (budget: ExpenseBudget, spent: number) => {
    const planned = parseFloat(budget.budgeted_amount)
    budget.spent_amount = spent.toString()
    budget.remaining_amount = Math.max(planned - spent, 0).toString()
    budget.percentage_used = planned > 0 ? (spent / planned) * 100 : 0
    budget.is_over_budget = spent > planned
  }

  const budgetForCategory = (categoryId: number) =>
    budgets.value.find((budget) => budget.category === categoryId)

  const applyBudget = (budget: ExpenseBudget) => {
    const index = budgets.value.findIndex((b) => b.id === budget.id)
    if (index >= 0) budgets.value[index] = budget
    else budgets.value.push(budget)
  }

  const addExpenseLocal = (expense: ExpenseRecord) => {
    expenses.value.push(expense)
    const budget = budgetForCategory(expense.category)
    if (budget) {
      recalcBudget(budget, parseFloat(budget.spent_amount) + parseExpenseAmount(expense.amount))
    }
  }

  const applyExpense = (expense: ExpenseRecord) => {
    const index = expenses.value.findIndex((e) => e.id === expense.id)
    if (index < 0) {
      addExpenseLocal(expense)
      return
    }

    const previous = expenses.value[index]
    expenses.value[index] = expense

    if (previous.category === expense.category) {
      const budget = budgetForCategory(expense.category)
      if (budget) {
        const delta = parseExpenseAmount(expense.amount) - parseExpenseAmount(previous.amount)
        recalcBudget(budget, parseFloat(budget.spent_amount) + delta)
      }
      return
    }

    const from = budgetForCategory(previous.category)
    if (from) updateBudgetAfterExpenseDelete(from, parseExpenseAmount(previous.amount))
    const to = budgetForCategory(expense.category)
    if (to) recalcBudget(to, parseFloat(to.spent_amount) + parseExpenseAmount(expense.amount))
  }

  const removeExpenseLocal = (expense: ExpenseRecord) => {
    expenses.value = expenses.value.filter((e) => e.id !== expense.id)
    const budget = budgetForCategory(expense.category)
    if (budget) updateBudgetAfterExpenseDelete(budget, parseExpenseAmount(expense.amount))
  }

  // ------------------------------------------------------------------ load

  const loadCategories = async () => {
    try {
      const response = await expenseCategoriesService.getCategories()
      if (response.success && response.data) categories.value = response.data.results
    } catch (err) {
      console.error('Error loading expense categories:', err)
    }
  }

  /**
   * Budgets and expenses are fetched together and always both — the hero's
   * totals are meaningless with only one of them, and lazy-loading expenses
   * behind an expand was what made the old summary and list disagree.
   */
  const load = async ({ silent = false } = {}) => {
    if (!silent) loading.value = true
    error.value = null

    try {
      const [budgetsResponse, expensesResponse, categoriesResponse] = await Promise.all([
        expenseBudgetsService.getBudgets(eventId()),
        expensesService.getExpenses(eventId()),
        expenseCategoriesService.getCategories(),
      ])

      if (budgetsResponse.success && budgetsResponse.data) {
        budgets.value = budgetsResponse.data.results
      } else if (!budgetsResponse.success) {
        error.value = budgetsResponse.message || 'Failed to load budgets'
      }

      if (expensesResponse.success && expensesResponse.data) {
        expenses.value = expensesResponse.data.results
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        categories.value = categoriesResponse.data.results
      }
    } catch (err) {
      error.value = getErrorMessage(err, 'load budgets')
      console.error('Error loading event budget:', err)
    } finally {
      loading.value = false
    }
  }

  // -------------------------------------------------------------- mutations

  interface MutationResult {
    ok: boolean
    message?: string
  }

  /** Plan a category: create its allocation. */
  const createBudget = async (
    categoryId: number,
    amount: number,
    currency: BudgetCurrency
  ): Promise<MutationResult> => {
    mutating.value = true
    try {
      const response = await expenseBudgetsService.createBudget(eventId(), {
        category: categoryId,
        category_id: categoryId,
        budgeted_amount: amount,
        currency,
      } as CreateExpenseBudgetRequest & { category: number })

      if (response.success && response.data) {
        applyBudget(response.data)
        return { ok: true }
      }
      return { ok: false, message: response.message }
    } catch (err) {
      return { ok: false, message: getErrorMessage(err, 'create budget') }
    } finally {
      mutating.value = false
    }
  }

  /** Re-allocate a category, optimistically. */
  const setBudgetAmount = async (
    budget: ExpenseBudget,
    amount: number
  ): Promise<MutationResult> => {
    const previous = cloneBudget(budget)
    recalcBudget(
      Object.assign(budget, { budgeted_amount: amount.toString() }),
      parseFloat(budget.spent_amount)
    )

    try {
      const response = await expenseBudgetsService.patchBudget(eventId(), budget.id, {
        budgeted_amount: amount,
      })

      if (response.success && response.data) {
        applyBudget(response.data)
        return { ok: true }
      }
      Object.assign(budget, previous)
      return { ok: false, message: response.message }
    } catch (err) {
      Object.assign(budget, previous)
      return { ok: false, message: getErrorMessage(err, 'update budget') }
    }
  }

  /**
   * Deleting a budget cascades to its expenses on the backend, so the
   * optimistic update has to drop both — and restore both on failure.
   */
  const deleteBudget = async (budget: ExpenseBudget): Promise<MutationResult & { removedExpenses: number }> => {
    const removedExpenses = expenses.value.filter((e) => e.category === budget.category)
    const budgetCopy = cloneBudget(budget)

    budgets.value = budgets.value.filter((b) => b.id !== budget.id)
    expenses.value = expenses.value.filter((e) => e.category !== budget.category)

    try {
      const response = await expenseBudgetsService.deleteBudget(eventId(), budget.id)
      if (response.success) return { ok: true, removedExpenses: removedExpenses.length }

      budgets.value.push(budgetCopy)
      expenses.value.push(...removedExpenses)
      return { ok: false, message: response.message, removedExpenses: 0 }
    } catch (err) {
      budgets.value.push(budgetCopy)
      expenses.value.push(...removedExpenses)
      return { ok: false, message: getErrorMessage(err, 'delete budget'), removedExpenses: 0 }
    }
  }

  const createExpense = async (payload: {
    categoryId: number
    description: string
    amount: number
    currency: BudgetCurrency
  }): Promise<MutationResult> => {
    try {
      const response = await expensesService.createExpense(eventId(), {
        category: payload.categoryId,
        category_id: payload.categoryId,
        description: payload.description,
        amount: payload.amount,
        currency: payload.currency,
        date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        is_public: false,
      })

      if (response.success && response.data) {
        addExpenseLocal(response.data)
        return { ok: true }
      }
      return { ok: false, message: response.message }
    } catch (err) {
      return { ok: false, message: getErrorMessage(err, 'create expense') }
    }
  }

  const patchExpense = async (
    expense: ExpenseRecord,
    patch: { description: string } | { amount: number }
  ): Promise<MutationResult> => {
    const previous = { ...expense }
    applyExpense({
      ...expense,
      ...('amount' in patch ? { amount: patch.amount.toString() } : patch),
    })

    try {
      const response = await expensesService.updateExpense(eventId(), expense.id, patch)
      if (response.success && response.data) {
        applyExpense(response.data)
        return { ok: true }
      }
      applyExpense(previous)
      return { ok: false, message: response.message }
    } catch (err) {
      applyExpense(previous)
      return { ok: false, message: getErrorMessage(err, 'update expense') }
    }
  }

  const deleteExpense = async (expense: ExpenseRecord): Promise<MutationResult> => {
    const copy = { ...expense }
    removeExpenseLocal(expense)

    try {
      const response = await expensesService.deleteExpense(eventId(), expense.id)
      if (response.success) return { ok: true }
      addExpenseLocal(copy)
      return { ok: false, message: response.message }
    } catch (err) {
      addExpenseLocal(copy)
      return { ok: false, message: getErrorMessage(err, 'delete expense') }
    }
  }

  const addCategoryLocal = (category: ExpenseCategory) => {
    const index = categories.value.findIndex((c) => c.id === category.id)
    if (index >= 0) categories.value[index] = category
    else categories.value.push(category)
  }

  return {
    // State. The collections are handed back as live refs, not `readonly()`
    // wrappers: rows are edited in place (an allocation changes while the input
    // is focused) and a `DeepReadonly<ExpenseBudget>` cannot be passed back
    // into the mutations below without casting at every call site.
    budgets,
    expenses,
    categories,
    loading: readonly(loading),
    error: readonly(error),
    mutating: readonly(mutating),

    // derived
    plans,
    hasAnyData,
    unbudgetedCategories,
    expensesForCategory,
    budgetRemaining,
    budgetForCategory,

    // lifecycle
    load,
    loadCategories,

    // mutations
    createBudget,
    setBudgetAmount,
    deleteBudget,
    createExpense,
    patchExpense,
    deleteExpense,

    // local reconciliation (drawer-driven writes)
    applyBudget,
    applyExpense,
    addCategoryLocal,
  }
}

export type EventBudgetStore = ReturnType<typeof useEventBudget>
