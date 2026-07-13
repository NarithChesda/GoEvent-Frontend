<template>
  <div>
    <!-- Collapsed dashed pill -->
    <button
      v-if="!isExpanded"
      type="button"
      @click="handlePillClick"
      :class="[
        'w-full flex items-center justify-center gap-2 font-medium text-slate-600 border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-50 transition-all',
        compact ? 'px-3 py-2 text-xs rounded-xl bg-white/60' : 'h-12 px-4 text-sm rounded-2xl',
      ]"
    >
      <Plus :class="compact ? 'w-3.5 h-3.5' : 'w-4 h-4'" class="flex-shrink-0" />
      <span class="truncate whitespace-nowrap">{{ t('management.expenseBudgets.inlineAdd.addExpense') }}</span>
    </button>

    <!-- Expanded inline form -->
    <div
      v-else
      :class="[
        'bg-white ring-1 ring-sky-200 flex flex-wrap items-center gap-2',
        compact ? 'rounded-xl p-2' : 'rounded-2xl p-2.5',
      ]"
    >
      <!-- Description -->
      <input
        ref="descriptionInputRef"
        v-model="description"
        type="text"
        :placeholder="t('management.expenseBudgets.inlineAdd.descriptionPlaceholder')"
        @keydown.enter.prevent="submit"
        @keydown.esc.prevent="collapse"
        class="flex-[2_1_140px] min-w-0 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
      />

      <!-- Amount + currency -->
      <div class="flex items-center flex-[1_0_auto] sm:flex-none gap-2">
        <input
          v-model="amount"
          type="number"
          inputmode="decimal"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          :aria-label="t('management.expenseBudgets.inlineAdd.amountLabel')"
          @keydown.enter.prevent="submit"
          @keydown.esc.prevent="collapse"
          class="w-24 flex-1 sm:flex-none min-w-0 px-3 py-2 text-sm text-right tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
        />
        <select
          v-model="currency"
          :aria-label="t('management.expenseBudgets.inlineAdd.currencyLabel')"
          class="flex-shrink-0 px-2 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
        >
          <option v-for="c in SUPPORTED_CURRENCIES" :key="c.code" :value="c.code">
            {{ c.code }}
          </option>
        </select>
      </div>

      <!-- Compact category picker (global mode only) -->
      <div v-if="fixedCategoryId === undefined" class="relative flex-shrink-0" ref="categoryPickerRef">
        <button
          type="button"
          @click="showCategoryDropdown = !showCategoryDropdown"
          class="flex items-center gap-1.5 px-2.5 py-2 text-sm border border-slate-200 rounded-lg hover:border-slate-300 bg-white transition-colors"
        >
          <span
            v-if="selectedCategory"
            class="w-2 h-2 rounded-full flex-shrink-0"
            :style="{ backgroundColor: selectedCategory.color || '#64748b' }"
          ></span>
          <span class="truncate max-w-[90px]">
            {{ selectedCategory ? selectedCategory.name : t('management.expenseBudgets.inlineAdd.pickCategory') }}
          </span>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        </button>

        <Transition name="dropdown">
          <div
            v-if="showCategoryDropdown"
            class="absolute top-full right-0 mt-1 min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-lg z-[100] max-h-64 overflow-y-auto"
          >
            <div class="p-1.5">
              <button
                v-for="category in categories"
                :key="category.id"
                type="button"
                @click="selectCategory(category.id)"
                :class="[
                  'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-left transition-colors',
                  category.id === selectedCategoryId
                    ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white'
                    : 'text-slate-700 hover:bg-slate-50',
                ]"
              >
                <span
                  class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: category.id === selectedCategoryId ? 'white' : (category.color || '#64748b') }"
                ></span>
                <span class="flex-1 truncate">{{ category.name }}</span>
                <span
                  v-if="budgetFor(category.id)"
                  class="text-xs tabular-nums"
                  :class="category.id === selectedCategoryId ? 'text-white/70' : 'text-slate-400'"
                >
                  {{ budgetFor(category.id)!.percentage_used.toFixed(0) }}%
                </span>
              </button>

              <!-- Inline category creation -->
              <div v-if="categories.length > 0" class="my-1 border-t border-slate-100"></div>
              <div v-if="isCreatingCategory" class="flex items-center gap-1.5 p-1" @click.stop>
                <input
                  ref="newCategoryInputRef"
                  v-model="newCategoryName"
                  type="text"
                  maxlength="100"
                  :placeholder="t('management.expenseBudgets.inlineAdd.categoryNamePlaceholder')"
                  @keydown.enter.prevent="submitNewCategory"
                  @keydown.esc.stop.prevent="isCreatingCategory = false"
                  class="flex-1 min-w-0 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400"
                />
                <button
                  type="button"
                  @click="submitNewCategory"
                  :disabled="!newCategoryName.trim() || savingCategory"
                  class="flex items-center justify-center w-8 h-8 flex-shrink-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:opacity-90 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  :title="t('management.expenseBudgets.inlineAdd.save')"
                >
                  <span
                    v-if="savingCategory"
                    class="w-3.5 h-3.5 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  <Check v-else class="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                v-else
                type="button"
                @click.stop="startCreateCategory"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-left text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>{{ t('management.expenseBudgets.inlineAdd.newCategory') }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Save / cancel -->
      <div class="flex items-center gap-2 flex-shrink-0 ml-auto">
        <button
          type="button"
          @click="submit"
          :disabled="!canSubmit || submitting"
          class="flex items-center justify-center w-9 h-9 flex-shrink-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:opacity-90 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          :title="t('management.expenseBudgets.inlineAdd.save')"
        >
          <span
            v-if="submitting"
            class="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"
          ></span>
          <Check v-else class="w-4 h-4" />
        </button>
        <button
          type="button"
          @click="collapse"
          class="flex items-center justify-center w-9 h-9 flex-shrink-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          :title="t('management.expenseBudgets.inlineAdd.cancel')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { Plus, ChevronDown, Check, X } from 'lucide-vue-next'
import { expenseCategoriesService, type ExpenseCategory, type ExpenseBudget } from '@/services/api'
import { SUPPORTED_CURRENCIES, type CurrencyCode } from '@/constants/currencies'
import { useNotifications } from '@/composables/useNotifications'
import { getErrorMessage } from '@/utils/errorMessages'

export interface QuickAddExpensePayload {
  categoryId: number
  description: string
  amount: number
  currency: CurrencyCode
}

const { t } = useAppLanguage()

const props = withDefaults(
  defineProps<{
    categories: ExpenseCategory[]
    budgets: ExpenseBudget[]
    /** When set, the row adds to this category and hides the picker (per-budget mode). */
    fixedCategoryId?: number
    /** Preselect this category in the picker (e.g. the active filter). */
    defaultCategoryId?: number | null
    /** Tighter styling for use inside an expanded budget card. */
    compact?: boolean
    submitting?: boolean
  }>(),
  { defaultCategoryId: null, compact: false, submitting: false },
)

const emit = defineEmits<{
  submit: [payload: QuickAddExpensePayload]
  /** No categories exist yet — parent should open the full drawer instead. */
  'require-category': []
  /** A category was created inline — parent should add it to its list. */
  'category-created': [category: ExpenseCategory]
  /** Collapsed/expanded — lets the parent yield row space on small screens. */
  'expand-change': [expanded: boolean]
}>()

const isExpanded = ref(false)
const description = ref('')
const amount = ref<number | null>(null)
const currency = ref<CurrencyCode>('USD')
const selectedCategoryId = ref<number | null>(props.fixedCategoryId ?? props.defaultCategoryId)
const showCategoryDropdown = ref(false)
const descriptionInputRef = ref<HTMLInputElement | null>(null)
const categoryPickerRef = ref<HTMLElement | null>(null)

const budgetFor = (categoryId: number): ExpenseBudget | undefined =>
  props.budgets.find((b) => b.category === categoryId)

const selectedCategory = computed(
  () => props.categories.find((c) => c.id === selectedCategoryId.value) ?? null,
)

const canSubmit = computed(
  () =>
    description.value.trim().length > 0 &&
    amount.value !== null &&
    Number(amount.value) > 0 &&
    selectedCategoryId.value !== null,
)

// Keep the picker in sync with the active filter, but only while collapsed
// so we don't yank the category out from under someone mid-compose.
watch(
  () => props.defaultCategoryId,
  (id) => {
    if (!isExpanded.value && props.fixedCategoryId === undefined) selectedCategoryId.value = id
  },
)

// Currency follows the selected category's budget so totals stay comparable.
const syncCurrencyToCategory = (categoryId: number | null) => {
  if (categoryId === null) return
  const budget = budgetFor(categoryId)
  if (budget) currency.value = budget.currency as CurrencyCode
}

const handlePillClick = () => {
  if (props.fixedCategoryId === undefined && props.categories.length === 0) {
    emit('require-category')
    return
  }
  isExpanded.value = true
  emit('expand-change', true)
  syncCurrencyToCategory(selectedCategoryId.value)
  nextTick(() => descriptionInputRef.value?.focus())
}

const collapse = () => {
  isExpanded.value = false
  emit('expand-change', false)
  description.value = ''
  amount.value = null
  showCategoryDropdown.value = false
  isCreatingCategory.value = false
}

const selectCategory = (categoryId: number) => {
  selectedCategoryId.value = categoryId
  showCategoryDropdown.value = false
  syncCurrencyToCategory(categoryId)
}

// --- Inline category creation ---
const isCreatingCategory = ref(false)
const newCategoryName = ref('')
const savingCategory = ref(false)
const newCategoryInputRef = ref<HTMLInputElement | null>(null)
const { error: showError } = useNotifications()

const categoryColorPresets = [
  '#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#f39c12',
  '#1abc9c', '#e91e63', '#00bcd4', '#ff5722', '#607d8b',
]

const startCreateCategory = () => {
  isCreatingCategory.value = true
  newCategoryName.value = ''
  nextTick(() => newCategoryInputRef.value?.focus())
}

const submitNewCategory = async () => {
  const name = newCategoryName.value.trim()
  if (!name || savingCategory.value) return
  savingCategory.value = true

  try {
    const response = await expenseCategoriesService.createCategory({
      name,
      color: categoryColorPresets[props.categories.length % categoryColorPresets.length],
      is_active: true,
    })

    if (response.success && response.data) {
      emit('category-created', response.data)
      selectedCategoryId.value = response.data.id
      isCreatingCategory.value = false
      showCategoryDropdown.value = false
    } else {
      showError(response.message || t('management.expenseBudgets.toast.addFailed'))
    }
  } catch (err) {
    showError(getErrorMessage(err, 'create category'))
  } finally {
    savingCategory.value = false
  }
}

const submit = () => {
  if (!canSubmit.value || props.submitting || selectedCategoryId.value === null) return
  emit('submit', {
    categoryId: selectedCategoryId.value,
    description: description.value.trim(),
    amount: Number(amount.value),
    currency: currency.value,
  })
  // Stay expanded and refocus so several expenses can be logged back-to-back.
  description.value = ''
  amount.value = null
  nextTick(() => descriptionInputRef.value?.focus())
}

const handleClickOutside = (event: MouseEvent) => {
  if (
    showCategoryDropdown.value &&
    categoryPickerRef.value &&
    !categoryPickerRef.value.contains(event.target as Node)
  ) {
    showCategoryDropdown.value = false
    isCreatingCategory.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Hide number-input spinners so the amount field stays compact */
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
