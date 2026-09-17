<template>
  <!-- The first cell of the sheet, not a card above it. No border, no shadow,
       no surface of its own — the hairline below is the only thing separating
       the total from the categories that make it up. -->
  <div class="px-4 pb-5 pt-5 sm:px-5">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p
          class="text-[2.75rem] leading-none sm:text-5xl font-semibold tracking-tight tabular-nums"
          :class="active.isOver ? 'text-red-600' : 'text-slate-900'"
          aria-live="polite"
        >
          {{ money(Math.abs(active.remaining), active.currency, { trimWholeCents: true }) }}
        </p>
        <p class="mt-1.5 text-sm font-medium" :class="active.isOver ? 'text-red-600' : 'text-slate-700'">
          {{ active.isOver ? t('management.budgetPlan.overBudget') : t('management.budgetPlan.leftToSpend') }}
        </p>
        <p class="mt-1 text-xs tabular-nums text-slate-400">
          {{
            t('management.budgetPlan.spentOfPlanned', {
              spent: money(active.spent, active.currency, { trimWholeCents: true }),
              planned: money(active.planned, active.currency, { trimWholeCents: true }),
            })
          }}
        </p>
      </div>

      <!-- Riel and dollar are separate plans, so this only appears when both exist -->
      <div
        v-if="plans.length > 1"
        class="flex flex-shrink-0 items-center gap-0.5 rounded-full bg-slate-100 p-0.5"
        role="radiogroup"
        :aria-label="t('management.budgetPlan.currencyGroup')"
      >
        <button
          v-for="plan in plans"
          :key="plan.currency"
          type="button"
          role="radio"
          :aria-checked="plan.currency === activeCurrency"
          class="rounded-full px-2.5 py-1 text-xs font-medium tabular-nums transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          :class="plan.currency === activeCurrency ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
          @click="$emit('update:currency', plan.currency)"
        >
          {{ plan.currency }}
        </button>
      </div>
    </div>

    <!-- The plan's shape: one slice per category, sized by its share. This is
         the only thing on screen showing the whole; every row below shows one
         part of it, in the same colour. -->
    <div
      v-if="active.segments.length > 0"
      class="mt-4 flex h-1.5 w-full gap-[2px] overflow-hidden rounded-full"
      role="img"
      :aria-label="allocationSummary"
    >
      <div
        v-for="segment in active.segments"
        :key="segment.budgetId"
        class="relative h-full overflow-hidden rounded-full"
        :style="{ flexGrow: segment.share, flexBasis: 0, minWidth: '3px' }"
        :title="segmentTitle(segment)"
      >
        <span class="seg-track absolute inset-0" :style="{ backgroundColor: segment.color }" />
        <span
          class="seg-fill absolute inset-0 origin-left"
          :style="{
            backgroundColor: segment.isOver ? '#ef4444' : segment.color,
            transform: `scaleX(${segment.fill})`,
          }"
        />
      </div>
    </div>

    <!-- Spending with no allocation behind it is inside the total above but in
         none of the slices, so it is named rather than left to look like a
         rounding error. -->
    <p v-if="unplannedSpend > 0" class="mt-3 flex items-center gap-1.5 text-xs text-amber-600">
      <AlertCircle class="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      <span class="tabular-nums">
        {{ t('management.budgetPlan.unplannedSpend', { amount: money(unplannedSpend, active.currency, { trimWholeCents: true }) }) }}
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type { CurrencyPlan, PlanSegment } from '@/composables/useEventBudget'
import { money } from './money'

const props = defineProps<{
  plans: CurrencyPlan[]
  activeCurrency: string
}>()

defineEmits<{ 'update:currency': [currency: string] }>()

const { t } = useAppLanguage()

const active = computed<CurrencyPlan>(
  () =>
    props.plans.find((plan) => plan.currency === props.activeCurrency) ??
    props.plans[0] ?? {
      currency: props.activeCurrency,
      planned: 0,
      spent: 0,
      remaining: 0,
      percent: 0,
      isOver: false,
      categoryCount: 0,
      expenseCount: 0,
      segments: [],
    }
)

const unplannedSpend = computed(() => {
  const inSlices = active.value.segments.reduce((total, segment) => total + segment.spent, 0)
  return Math.max(active.value.spent - inSlices, 0)
})

const segmentTitle = (segment: PlanSegment): string => {
  const currency = active.value.currency
  const spent = money(segment.spent, currency, { trimWholeCents: true })
  const planned = money(segment.planned, currency, { trimWholeCents: true })
  return `${segment.name} — ${spent} / ${planned}`
}

const allocationSummary = computed(() =>
  t('management.budgetPlan.allocationSummary', {
    spent: money(active.value.spent, active.value.currency, { trimWholeCents: true }),
    planned: money(active.value.planned, active.value.currency, { trimWholeCents: true }),
  })
)
</script>

<style scoped>
/* The pale half of a slice is the same colour at low opacity as its own layer,
   not an alpha-composed hex — category colours arrive as arbitrary CSS strings
   and hex arithmetic on them is not safe. */
.seg-track {
  opacity: 0.2;
}

/* scaleX, not width: the fill stays on the compositor, so editing an amount
   while the sheet is scrolling does not force layout every frame. */
.seg-fill {
  transition: transform 0.55s cubic-bezier(0.32, 0.72, 0, 1);
}

@media (prefers-reduced-motion: reduce) {
  .seg-fill {
    transition: none;
  }
}
</style>
