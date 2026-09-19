<template>
  <!-- Rows only. The sheet, its rounding and its hairlines belong to the parent,
       so the total above and the categories below are one object. -->
  <div class="divide-y divide-slate-100">
    <div v-for="row in rows" :key="row.categoryId">
      <div
        role="button"
        tabindex="0"
        :aria-expanded="isExpanded(row.categoryId)"
        class="row-press flex cursor-pointer items-center gap-3 px-4 py-3.5 sm:px-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-200"
        @click="toggle(row.categoryId)"
        @keydown.enter.prevent="toggle(row.categoryId)"
        @keydown.space.prevent="toggle(row.categoryId)"
      >
        <!-- Identity only. The bar below carries the progress, so a ring here
             would be the same fact drawn twice. -->
        <span
          class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
          :style="{ backgroundColor: tint(row.color) }"
          aria-hidden="true"
        >
          <component :is="getIconComponent(row.icon)" class="h-4 w-4" :style="{ color: row.color }" />
        </span>

        <div class="min-w-0 flex-1">
          <div class="flex items-baseline justify-between gap-3">
            <h4 class="truncate text-sm font-semibold text-slate-900">{{ row.name }}</h4>
            <p
              class="flex-shrink-0 text-sm font-semibold tabular-nums"
              :class="row.isOver ? 'text-red-600' : row.planned === 0 ? 'text-slate-400' : 'text-slate-900'"
            >
              <template v-if="row.planned === 0">
                {{ money(row.spent, currency, { trimWholeCents: true }) }}
              </template>
              <template v-else>
                {{
                  row.isOver
                    ? t('management.expenseBudgets.overShort', {
                        amount: money(Math.abs(row.remaining), currency, { trimWholeCents: true }),
                      })
                    : t('management.expenseBudgets.remainingShort', {
                        amount: money(row.remaining, currency, { trimWholeCents: true }),
                      })
                }}
              </template>
            </p>
          </div>

          <!-- One bar per row: an amount along a line, which is what money is.
               A category with no allocation has no line to draw along, and an
               empty track there reads as a divider rather than as a measure. -->
          <div v-if="row.planned > 0" class="mt-2 h-1.5 w-full overflow-hidden rounded-full">
            <div
              class="h-full w-full rounded-full"
              :style="{ backgroundColor: tint(row.color) }"
            >
              <div
                class="bar-fill h-full origin-left rounded-full"
                :style="{
                  backgroundColor: row.isOver ? '#ef4444' : row.color,
                  transform: `scaleX(${Math.min(row.percent, 100) / 100})`,
                }"
              />
            </div>
          </div>

          <div class="mt-1.5 flex items-center justify-between gap-3">
            <p class="min-w-0 truncate text-xs tabular-nums text-slate-400">
              <template v-if="row.planned === 0">
                <span class="text-amber-600">{{ t('management.budgetPlan.notPlanned') }}</span>
              </template>
              <template v-else>
                <span :class="row.isOver ? 'text-red-500' : row.percent >= 85 ? 'text-amber-600' : ''">{{
                  money(row.spent, currency, { trimWholeCents: true })
                }}</span>
                <!-- Non-breaking spaces, not plain ones: Vue's whitespace
                     condensing drops a whitespace-only text node between two
                     elements, which ran these together as "$4,200of$5,000". -->
                <span>&nbsp;{{ t('management.expenseBudgets.budgetPrefix') }}&nbsp;</span>
                <!-- The allocation is edited exactly where it is read -->
                <input
                  v-if="editingBudgetId === row.budget?.id"
                  :ref="focusOnMount"
                  v-model="budgetDraft"
                  type="number"
                  inputmode="decimal"
                  step="0.01"
                  min="0.01"
                  class="w-24 rounded border border-sky-300 bg-white px-1.5 py-0.5 text-right text-base sm:text-xs tabular-nums text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  @click.stop
                  @keydown.enter.prevent="commitBudget(row)"
                  @keydown.esc.prevent="editingBudgetId = null"
                  @blur="commitBudget(row)"
                />
                <button
                  v-else-if="canEdit"
                  type="button"
                  class="rounded px-1 -mx-1 tabular-nums transition-colors duration-200 hover:bg-sky-50 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  :title="t('management.expenseBudgets.inlineEdit.budgetHint')"
                  @click.stop="startBudgetEdit(row)"
                >{{ money(row.planned, currency, { trimWholeCents: true }) }}</button>
                <span v-else>{{ money(row.planned, currency, { trimWholeCents: true }) }}</span>
              </template>
            </p>

            <button
              v-if="row.planned === 0 && canEdit"
              type="button"
              class="flex-shrink-0 rounded px-1.5 py-0.5 -mr-1.5 text-xs font-medium text-[#1e90ff] transition-colors duration-200 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              @click.stop="startPlanning(row.categoryId)"
            >
              {{ t('management.budgetPlan.setBudget') }}
            </button>
          </div>
        </div>

        <!-- Centred against the whole row, not parked under its last line -->
        <ChevronDown
          class="h-4 w-4 flex-shrink-0 text-slate-300 transition-transform duration-200"
          :class="{ 'rotate-180': isExpanded(row.categoryId) }"
          aria-hidden="true"
        />
      </div>

      <!-- Its expenses, as indented rows of the same sheet -->
      <Transition name="collapse">
        <div v-if="isExpanded(row.categoryId)" class="grid grid-rows-[1fr]">
          <div class="min-h-0 overflow-hidden">
            <div class="bg-slate-50/70 pl-4 pr-4 sm:pl-16 sm:pr-5">
              <div
                v-for="expense in row.expenses"
                :key="expense.id"
                class="row-press flex items-center gap-3 border-t border-slate-100 py-2.5"
                :class="canEdit ? 'cursor-pointer' : ''"
                :role="canEdit ? 'button' : undefined"
                @click="canEdit && $emit('edit-expense', expense)"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <input
                      v-if="isEditing(expense.id, 'description')"
                      :ref="focusOnMount"
                      v-model="expenseDraft"
                      type="text"
                      class="-mx-1 min-w-0 flex-1 rounded border border-sky-300 bg-white px-1 py-0 text-base sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      @click.stop
                      @keydown.enter.prevent="commitExpense(expense)"
                      @keydown.esc.prevent="inlineEdit = null"
                      @blur="commitExpense(expense)"
                    />
                    <button
                      v-else-if="canEdit"
                      type="button"
                      class="min-w-0 truncate rounded text-left text-sm font-medium text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                      :title="t('management.expenseBudgets.inlineEdit.descriptionHint')"
                      @click.stop="startEdit(expense, 'description')"
                    >{{ expense.description }}</button>
                    <h5 v-else class="truncate text-sm font-medium text-slate-700">{{ expense.description }}</h5>

                    <input
                      v-if="isEditing(expense.id, 'amount')"
                      :ref="focusOnMount"
                      v-model="expenseDraft"
                      type="number"
                      inputmode="decimal"
                      step="0.01"
                      min="0.01"
                      class="w-24 flex-shrink-0 rounded border border-sky-300 bg-white px-1.5 py-0.5 text-right text-base sm:text-sm font-medium tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      @click.stop
                      @keydown.enter.prevent="commitExpense(expense)"
                      @keydown.esc.prevent="inlineEdit = null"
                      @blur="commitExpense(expense)"
                    />
                    <button
                      v-else-if="canEdit"
                      type="button"
                      class="flex-shrink-0 rounded px-1 -mx-1 text-sm font-medium tabular-nums text-slate-900 transition-colors duration-200 hover:bg-sky-50 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                      :title="t('management.expenseBudgets.inlineEdit.amountHint')"
                      @click.stop="startEdit(expense, 'amount')"
                    >{{ money(expense.amount, expense.currency, { trimWholeCents: true }) }}</button>
                    <span v-else class="flex-shrink-0 text-sm font-medium tabular-nums text-slate-900">
                      {{ money(expense.amount, expense.currency, { trimWholeCents: true }) }}
                    </span>
                  </div>
                  <div class="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                    <span>{{ formatDate(expense.date) }}</span>
                    <template v-if="expense.paid_to">
                      <span aria-hidden="true">·</span>
                      <span class="max-w-[7.5rem] truncate">{{ expense.paid_to }}</span>
                    </template>
                    <template v-if="expense.receipt">
                      <span aria-hidden="true">·</span>
                      <a
                        :href="expense.receipt"
                        target="_blank"
                        rel="noopener"
                        class="inline-flex items-center gap-1 font-medium text-emerald-600 transition-colors hover:text-emerald-700"
                        :title="t('management.expenseBudgets.viewReceipt')"
                        @click.stop
                      >
                        <Paperclip class="h-3 w-3" />
                        <span>{{ t('management.expenseBudgets.receipt') }}</span>
                      </a>
                    </template>
                  </div>
                </div>
                <ChevronRight v-if="canEdit" class="h-4 w-4 flex-shrink-0 text-slate-300" aria-hidden="true" />
              </div>

              <div v-if="canEdit" class="border-t border-slate-100 py-2.5">
                <QuickAddExpenseRow
                  compact
                  :fixed-category-id="row.categoryId"
                  :categories="store.categories.value"
                  :budgets="store.budgets.value"
                  :default-currency="currency"
                  :submitting="addingExpense"
                  @submit="handleAddExpense"
                />
              </div>

              <div v-if="row.budget && canEdit" class="flex justify-end border-t border-slate-100 py-2">
                <button
                  type="button"
                  class="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors duration-200 hover:bg-sky-50 hover:text-[#1e90ff]"
                  @click.stop="$emit('edit-budget', row.budget)"
                >
                  <Edit2 class="h-3 w-3" />
                  <span>{{ t('management.expenseBudgets.editBudget') }}</span>
                </button>
              </div>

              <p v-if="!canEdit && row.expenses.length === 0" class="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
                {{ t('management.expenseBudgets.noExpensesYet') }}
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- The two ways the plan grows, as the sheet's last rows -->
    <template v-if="canEdit">
      <QuickAddExpenseRow
        appearance="row"
        :categories="store.categories.value"
        :budgets="store.budgets.value"
        :default-currency="currency"
        :submitting="addingExpense"
        @submit="handleAddExpense"
        @require-category="$emit('need-category')"
        @category-created="store.addCategoryLocal"
      />
      <PlanCategoryRow
        ref="planRowRef"
        :options="store.unbudgetedCategories.value"
        :default-currency="currency"
        :show-currency="showCurrencyPicker"
        :submitting="planning"
        @submit="handlePlanCategory"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { ChevronDown, ChevronRight, Edit2, Paperclip } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useExpenseIcons } from '@/composables/useExpenseIcons'
import { useToast } from '@/composables/useToast'
import type { EventBudgetStore } from '@/composables/useEventBudget'
import type { ExpenseBudget, ExpenseRecord } from '@/services/api'
import type { CurrencyCode } from '@/constants/currencies'
import QuickAddExpenseRow, { type QuickAddExpensePayload } from './QuickAddExpenseRow.vue'
import PlanCategoryRow from './PlanCategoryRow.vue'
import { money } from './money'

const props = defineProps<{
  store: EventBudgetStore
  currency: CurrencyCode
  showCurrencyPicker: boolean
  canEdit: boolean
}>()

defineEmits<{
  'edit-budget': [budget: ExpenseBudget]
  'edit-expense': [expense: ExpenseRecord]
  'need-category': []
}>()

const { t } = useAppLanguage()
const { getIconComponent } = useExpenseIcons()
const { showError } = useToast()

/** A category colour at list-row strength, for the icon disc and the bar track. */
const tint = (color: string): string =>
  /^#[0-9a-f]{6}$/i.test(color) ? `${color}1f` : color

interface PlanRow {
  categoryId: number
  name: string
  color: string
  icon?: string
  budget: ExpenseBudget | null
  planned: number
  spent: number
  remaining: number
  percent: number
  isOver: boolean
  expenses: ExpenseRecord[]
}

/**
 * Allocated categories first, largest first — the same order as the slices in
 * the summary above, so a slice and its row can be read against each other.
 * Categories spent against but never allocated follow: the total counts their
 * spending, so a number with no row to explain it would read as a bug.
 */
const rows = computed<PlanRow[]>(() => {
  const planned: PlanRow[] = props.store.budgets.value
    .filter((budget) => budget.currency === props.currency)
    .map((budget) => {
      const plannedAmount = parseFloat(budget.budgeted_amount) || 0
      const spent = parseFloat(budget.spent_amount) || 0
      return {
        categoryId: budget.category,
        name: budget.category_info.name,
        color: budget.category_info.color || '#64748b',
        icon: budget.category_info.icon,
        budget,
        planned: plannedAmount,
        spent,
        remaining: plannedAmount - spent,
        percent: Math.round(budget.percentage_used),
        isOver: spent > plannedAmount,
        expenses: props.store
          .expensesForCategory(budget.category)
          .filter((expense) => expense.currency === props.currency),
      }
    })
    .sort((a, b) => b.planned - a.planned)

  const budgeted = new Set(planned.map((row) => row.categoryId))
  const unplanned = new Map<number, PlanRow>()

  for (const expense of props.store.expenses.value) {
    if (expense.currency !== props.currency || budgeted.has(expense.category)) continue
    let row = unplanned.get(expense.category)
    if (!row) {
      row = {
        categoryId: expense.category,
        name: expense.category_info.name,
        color: expense.category_info.color || '#64748b',
        icon: expense.category_info.icon,
        budget: null,
        planned: 0,
        spent: 0,
        remaining: 0,
        percent: 0,
        isOver: false,
        expenses: [],
      }
      unplanned.set(expense.category, row)
    }
    row.spent += parseFloat(expense.amount) || 0
    row.expenses.push(expense)
  }

  return [...planned, ...Array.from(unplanned.values()).sort((a, b) => b.spent - a.spent)]
})

// --------------------------------------------------------------- expansion

const expanded = ref<number[]>([])
const isExpanded = (categoryId: number) => expanded.value.includes(categoryId)
const toggle = (categoryId: number) => {
  const index = expanded.value.indexOf(categoryId)
  if (index > -1) expanded.value.splice(index, 1)
  else expanded.value.push(categoryId)
}

// -------------------------------------------------------------- inline edit

/** Focus and select a just-rendered input, without stealing it back on every
 *  keystroke's re-render. */
const focusOnMount = (el: unknown) => {
  if (el instanceof HTMLInputElement && document.activeElement !== el) {
    nextTick(() => {
      el.focus()
      el.select()
    })
  }
}

const editingBudgetId = ref<number | null>(null)
const budgetDraft = ref('')

const startBudgetEdit = (row: PlanRow) => {
  if (!row.budget) return
  editingBudgetId.value = row.budget.id
  budgetDraft.value = String(row.planned)
}

const commitBudget = async (row: PlanRow) => {
  if (!row.budget || editingBudgetId.value !== row.budget.id) return
  editingBudgetId.value = null

  const next = parseFloat(budgetDraft.value)
  if (!Number.isFinite(next) || next <= 0 || next === row.planned) return

  // Success is silent: the bar and the total move, which is the confirmation.
  const result = await props.store.setBudgetAmount(row.budget, next)
  if (!result.ok) showError(t('management.expenseBudgets.toast.updateFailed'), { description: result.message })
}

const inlineEdit = ref<{ id: number; field: 'description' | 'amount' } | null>(null)
const expenseDraft = ref('')

const isEditing = (id: number, field: 'description' | 'amount') =>
  inlineEdit.value?.id === id && inlineEdit.value.field === field

const startEdit = (expense: ExpenseRecord, field: 'description' | 'amount') => {
  inlineEdit.value = { id: expense.id, field }
  expenseDraft.value = field === 'description' ? expense.description : String(parseFloat(expense.amount))
}

const commitExpense = async (expense: ExpenseRecord) => {
  const edit = inlineEdit.value
  if (!edit || edit.id !== expense.id) return
  inlineEdit.value = null

  if (edit.field === 'description') {
    const description = expenseDraft.value.trim()
    if (!description || description === expense.description) return
    const result = await props.store.patchExpense(expense, { description })
    if (!result.ok) showError(t('management.expenseBudgets.toast.updateFailed'), { description: result.message })
    return
  }

  const amount = parseFloat(expenseDraft.value)
  if (!Number.isFinite(amount) || amount <= 0 || amount === parseFloat(expense.amount)) return
  const result = await props.store.patchExpense(expense, { amount })
  if (!result.ok) showError(t('management.expenseBudgets.toast.updateFailed'), { description: result.message })
}

// -------------------------------------------------------------- allocating

const planRowRef = ref<InstanceType<typeof PlanCategoryRow> | null>(null)
const planning = ref(false)

const startPlanning = (categoryId: number) => planRowRef.value?.openFor(categoryId)

const handlePlanCategory = async (payload: {
  categoryId: number
  amount: number
  currency: CurrencyCode
}) => {
  if (planning.value) return
  planning.value = true
  const result = await props.store.createBudget(payload.categoryId, payload.amount, payload.currency)
  planning.value = false
  if (!result.ok) showError(t('management.budgetPlan.planFailed'), { description: result.message })
}

const addingExpense = ref(false)

const handleAddExpense = async (payload: QuickAddExpensePayload) => {
  if (addingExpense.value) return
  addingExpense.value = true

  // A spend in a category with no allocation would drop out of every per-category
  // total, so it gets a baseline budget of its own amount.
  if (!props.store.budgetForCategory(payload.categoryId)) {
    await props.store.createBudget(payload.categoryId, payload.amount, payload.currency)
  }

  const result = await props.store.createExpense(payload)
  addingExpense.value = false
  if (!result.ok) showError(t('management.expenseBudgets.toast.addFailed'), { description: result.message })
}

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
</script>

<style scoped>
/* Press feedback lands on pointer-down and eases back out — a row that waits
   for the click to acknowledge the touch reads as lag. Never a scale: a 0.99
   on a full-width row moves its edges ~3px and its centre not at all. */
.row-press {
  transition: background-color 0.22s ease-out;
}

.row-press:hover {
  background-color: rgb(248 250 252);
}

.row-press:active {
  background-color: rgb(241 245 249);
  transition: none;
}

.bar-fill {
  transition: transform 0.55s cubic-bezier(0.32, 0.72, 0, 1);
}

/* Grid-rows collapse: animates the content's true height, so both directions
   ease evenly instead of the dead time a large max-height cap leaves. */
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .bar-fill,
  .row-press,
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none;
  }
}
</style>
