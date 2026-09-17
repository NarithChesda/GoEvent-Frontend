<template>
  <div>
    <!-- Collapsed: the list's last row, so planning starts where the plan ends -->
    <button
      v-if="!isExpanded"
      type="button"
      class="pc-row flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-200"
      @click="expand()"
    >
      <span
        class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400"
        aria-hidden="true"
      >
        <Plus class="h-4 w-4" />
      </span>
      <span class="text-sm font-medium text-slate-600">
        {{ t('management.budgetPlan.planCategory') }}
      </span>
    </button>

    <!-- Expanded: category + amount, the two facts an allocation is made of -->
    <div v-else class="bg-sky-50/40 px-4 py-3 sm:px-5">
      <div class="flex flex-wrap items-center gap-2">
        <!-- Category -->
        <div class="relative min-w-0 flex-[2_1_10rem]">
          <select
            ref="categorySelectRef"
            v-model="categoryId"
            :aria-label="t('management.budgetPlan.categoryLabel')"
            class="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-9 text-base sm:text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option :value="null" disabled>{{ t('management.budgetPlan.pickCategory') }}</option>
            <option v-for="category in options" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
          <ChevronDown
            class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </div>

        <!-- Amount -->
        <div class="flex flex-[1_1_8rem] items-center gap-2">
          <div class="relative min-w-0 flex-1">
            <span
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400"
              aria-hidden="true"
            >{{ symbol }}</span>
            <input
              v-model="amount"
              type="number"
              inputmode="decimal"
              step="0.01"
              min="0.01"
              placeholder="0"
              :aria-label="t('management.budgetPlan.amountLabel')"
              class="w-full rounded-lg border border-slate-300 py-2 pl-7 pr-3 text-base sm:text-sm tabular-nums text-right text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              @keydown.enter.prevent="submit"
              @keydown.esc.prevent="collapse"
            />
          </div>
          <select
            v-if="showCurrency"
            v-model="currency"
            :aria-label="t('management.budgetPlan.currencyLabel')"
            class="flex-shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-2 text-base sm:text-sm font-medium text-slate-600 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            <option v-for="option in SUPPORTED_CURRENCIES" :key="option.code" :value="option.code">
              {{ option.code }}
            </option>
          </select>
        </div>

        <!-- Commit / dismiss -->
        <div class="ml-auto flex flex-shrink-0 items-center gap-1">
          <button
            type="button"
            class="rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-600"
            :aria-label="t('common.actions.cancel')"
            @click="collapse"
          >
            <X class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="rounded-lg bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-3 py-2 text-sm font-semibold text-white shadow-md transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!canSubmit || submitting"
            @click="submit"
          >
            {{ t('management.budgetPlan.setBudget') }}
          </button>
        </div>
      </div>

      <p v-if="options.length === 0" class="mt-2 text-xs text-slate-500">
        {{ t('management.budgetPlan.allCategoriesPlanned') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { ChevronDown, Plus, X } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type { ExpenseCategory } from '@/services/api'
import { SUPPORTED_CURRENCIES, type CurrencyCode } from '@/constants/currencies'

const props = withDefaults(
  defineProps<{
    /** Categories with no allocation yet. */
    options: ExpenseCategory[]
    /** The currency the plan is being read in — the new allocation follows it. */
    defaultCurrency: CurrencyCode
    /** Offer the currency picker only where more than one is meaningful. */
    showCurrency?: boolean
    submitting?: boolean
  }>(),
  { showCurrency: false, submitting: false }
)

const emit = defineEmits<{
  submit: [payload: { categoryId: number; amount: number; currency: CurrencyCode }]
}>()

const { t } = useAppLanguage()

const isExpanded = ref(false)
const categoryId = ref<number | null>(null)
const amount = ref('')
const currency = ref<CurrencyCode>(props.defaultCurrency)
const categorySelectRef = ref<HTMLSelectElement | null>(null)

const symbol = computed(() => (currency.value === 'KHR' ? '៛' : '$'))

const canSubmit = computed(() => {
  const value = parseFloat(amount.value)
  return categoryId.value !== null && Number.isFinite(value) && value > 0
})

const expand = async (preselect?: number) => {
  isExpanded.value = true
  currency.value = props.defaultCurrency
  categoryId.value = preselect ?? props.options[0]?.id ?? null
  await nextTick()
  categorySelectRef.value?.focus()
}

const collapse = () => {
  isExpanded.value = false
  categoryId.value = null
  amount.value = ''
}

const submit = () => {
  if (!canSubmit.value || props.submitting) return
  emit('submit', {
    categoryId: categoryId.value as number,
    amount: parseFloat(amount.value),
    currency: currency.value,
  })
  // Stays open for back-to-back allocation — planning a budget is a run of
  // several categories, not one. Only the amount clears; the picker advances
  // to whatever is still unplanned.
  amount.value = ''
  categoryId.value = props.options.find((option) => option.id !== categoryId.value)?.id ?? null
}

/**
 * A category that has been spent against but never allocated opens this same
 * form rather than a second one of its own — there is one way to allocate.
 */
defineExpose({ openFor: (id: number) => expand(id) })
</script>

<style scoped>
/* Press feedback lands on pointer-down and eases back out, matching the budget
   rows this sits at the end of. */
.pc-row {
  transition: background-color 0.22s ease-out;
}

.pc-row:hover {
  background-color: rgb(248 250 252);
}

.pc-row:active {
  background-color: rgb(241 245 249);
  transition: none;
}

@media (prefers-reduced-motion: reduce) {
  .pc-row {
    transition: none;
  }
}
</style>
