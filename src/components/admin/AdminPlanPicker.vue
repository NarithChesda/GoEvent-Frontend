<template>
  <div>
    <div class="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <label :id="labelId" class="text-sm font-medium text-slate-700">
        {{ label }}<span v-if="required"> *</span>
      </label>
      <button
        v-if="plans.length"
        type="button"
        class="text-xs font-medium text-[#1e90ff] transition-colors duration-200 hover:text-sky-700 focus:outline-none focus-visible:underline"
        @click="toggleAll"
      >
        {{ allChosen ? t('admin.planPicker.clear') : t('admin.planPicker.selectAll') }}
      </button>
    </div>

    <div v-if="loading" class="space-y-2">
      <div v-for="n in 3" :key="n" class="h-11 animate-pulse rounded-xl bg-slate-100" />
    </div>

    <p
      v-else-if="error"
      class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      role="alert"
    >
      {{ error }}
    </p>

    <p
      v-else-if="!plans.length"
      class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
    >
      {{ t('admin.planPicker.none') }}
    </p>

    <!--
      Scrolls rather than growing: the real catalogue is a tier repeated per
      event category, so this list is routinely long enough to push every
      control below it off the drawer.
    -->
    <div
      v-else
      class="list-group max-h-72 overflow-y-auto"
      :class="invalid ? 'border-red-300' : ''"
      role="group"
      :aria-labelledby="labelId"
    >
      <button
        v-for="plan in plans"
        :key="plan.id"
        type="button"
        role="checkbox"
        :aria-checked="chosen.has(plan.id)"
        class="list-row"
        @click="toggle(plan.id)"
      >
        <span
          class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors duration-200"
          :class="
            chosen.has(plan.id)
              ? 'border-sky-500 bg-sky-500 text-white'
              : 'border-slate-300 bg-white text-transparent'
          "
          aria-hidden="true"
        >
          <Check class="h-3.5 w-3.5" />
        </span>

        <span class="list-row__text min-w-0 flex-1">
          <span class="list-row__label truncate">
            {{ plan.name }}
            <span
              v-if="!plan.is_active"
              class="ml-1 text-[10px] font-semibold uppercase text-slate-400"
            >
              {{ t('admin.catalogue.retired') }}
            </span>
          </span>
          <span v-if="plan.category_name" class="list-row__hint truncate">
            {{ plan.category_name }}
          </span>
        </span>

        <!--
          The price is why this is a list and not a multi-select. A credit
          zeroes whichever plan it lands on, so bundling plans of unequal price
          hands away the difference — and that is only visible if the number is
          on screen while the boxes are being ticked.
        -->
        <span class="flex-shrink-0 text-sm font-semibold tabular-nums text-slate-900">
          {{ formatMoney(plan.price) }}
        </span>
      </button>
    </div>

    <!--
      The spread, not a total. Ticked plans are alternatives to each other, so
      adding their prices up would be meaningless; the gap between the cheapest
      and the dearest is the thing that costs money.
    -->
    <p v-if="spread" class="mt-1.5 text-xs" :class="spread.wide ? 'text-amber-700' : 'text-slate-500'">
      {{
        spread.wide
          ? t('admin.planPicker.spreadWarning', { low: spread.low, high: spread.high })
          : t('admin.planPicker.spread', { low: spread.low, high: spread.high })
      }}
    </p>
    <p v-else-if="hint" class="mt-1.5 text-xs text-slate-500">{{ hint }}</p>

    <p v-if="errorText" class="mt-1 text-xs text-red-600">{{ errorText }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * Which pricing plans a credit pack's or a promo code's redemptions cover.
 *
 * **This is the highest-consequence control in either form.** An empty
 * `applicable_plans` on an issued code means *every* plan, so a $50 credit pack
 * saved with nothing ticked mints credits that unlock a $600 template. The pack
 * endpoint refuses that outright; the promo endpoint refuses it for
 * `partner_credit` and permits it for marketing, where a code covering
 * everything is a real thing to write. Both cases are the caller's to declare
 * through `required`.
 *
 * Three deliberate choices:
 *
 * - **Prices are on screen while the boxes are ticked.** A credit zeroes
 *   whichever plan it is spent on, so a pack bundling an $85 plan with a $600
 *   one is giving away the difference every time a partner picks the expensive
 *   option. That is invisible in a list of names, which is what a plain
 *   multi-select would be.
 * - **The footer states the spread, never a total.** The ticked plans are
 *   alternatives, not a basket — summing them would answer a question nobody
 *   asked and imply the pack costs that much.
 * - **Retired plans are listed and marked, not hidden.** A pack may reference a
 *   plan that has since been deactivated; dropping it from the list would
 *   render that pack as though the plan had been unticked, and saving would
 *   then actually untick it.
 */
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check } from 'lucide-vue-next'
import { formatMoney, parseMoney } from './adminDisplay'
import type { AdminPricingPlanRow } from '@/services/api'

/**
 * When the dearest ticked plan costs this much more than the cheapest, the
 * footer turns amber. Not an error — bundling a tier across event categories is
 * the normal case and those prices differ a little — but at double, one of the
 * two is being sold at the other's price.
 */
const WIDE_SPREAD_RATIO = 2

const props = withDefaults(
  defineProps<{
    /** Chosen plan ids. */
    modelValue: number[]
    plans: AdminPricingPlanRow[]
    label: string
    loading?: boolean
    error?: string | null
    /** Whether an empty selection is refused by the endpoint being written. */
    required?: boolean
    hint?: string
    /** A field-level `400` from the server. */
    errorText?: string | null
  }>(),
  { loading: false, error: null, required: false, hint: '', errorText: null },
)

const emit = defineEmits<{ 'update:modelValue': [value: number[]] }>()

const { t } = useI18n()
const labelId = useId()

const chosen = computed(() => new Set(props.modelValue))
const allChosen = computed(
  () => props.plans.length > 0 && props.plans.every((plan) => chosen.value.has(plan.id)),
)
const invalid = computed(() => Boolean(props.errorText))

/**
 * The cheapest and dearest ticked plan, and whether they are far enough apart
 * to be worth flagging. Absent below two selections, where there is no spread.
 */
const spread = computed(() => {
  const prices = props.plans
    .filter((plan) => chosen.value.has(plan.id))
    .map((plan) => parseMoney(plan.price))
  if (prices.length < 2) return null

  const low = Math.min(...prices)
  const high = Math.max(...prices)
  if (high === low) return null

  return {
    low: formatMoney(low),
    high: formatMoney(high),
    wide: low > 0 && high / low >= WIDE_SPREAD_RATIO,
  }
})

const toggle = (id: number): void => {
  const next = new Set(props.modelValue)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  emit('update:modelValue', [...next])
}

const toggleAll = (): void => {
  emit('update:modelValue', allChosen.value ? [] : props.plans.map((plan) => plan.id))
}
</script>

<style scoped src="@/components/common/groupedList.css"></style>
