<template>
  <section class="rounded-2xl bg-slate-50 p-4">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-slate-900">{{ title }}</p>
        <p v-if="subtitle" class="mt-0.5 truncate text-xs text-slate-500">{{ subtitle }}</p>
        <div v-if="$slots.badges" class="mt-2 flex flex-wrap gap-1.5">
          <slot name="badges" />
        </div>
      </div>

      <!--
        The price stacks rather than sitting inline beside the struck-through
        one: side by side, a long Khmer plan name and two figures on one
        baseline leave the actual amount a few characters wide on a 375px
        phone. Stacked, the amount always gets the full right column.
      -->
      <div class="flex-shrink-0 text-right">
        <p v-if="strikethrough" class="text-xs text-slate-400 line-through tabular-nums">
          ${{ strikethrough }}
        </p>
        <p class="text-xl font-bold leading-tight text-slate-900 tabular-nums sm:text-2xl">
          {{ amount }}
        </p>
      </div>
    </div>

    <!-- Named rather than the default slot so a caller can withhold it with
         `v-if` — an always-present slot would draw the divider above nothing. -->
    <div v-if="$slots.details" class="mt-3 border-t border-slate-200/80 pt-3">
      <slot name="details" />
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * "Here is what you are buying and what it costs" — the opening block of both
 * checkouts.
 *
 * A quiet slate region rather than a bordered card, deliberately: nothing in it
 * is separable from the drawer it sits in, and a card here would put a card
 * inside a panel inside a drawer for no gain (goevent-taste §3).
 *
 * It never computes or formats a figure. `amount` arrives ready to print — the
 * activation drawer can pass `"1 credit"` where the credit-pack order passes
 * `"$40.00"`, and both read as the price of the thing named beside them.
 */
defineProps<{
  /** What is being bought — the pricing plan or the pack. */
  title: string
  /** Formatted and complete, including any currency symbol or unit. */
  amount: string
  subtitle?: string | null
  /** List price, shown struck through only when something actually reduced it. */
  strikethrough?: string | null
}>()
</script>
