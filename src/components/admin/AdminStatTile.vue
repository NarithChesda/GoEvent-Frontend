<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-4">
    <p class="truncate text-xs font-medium uppercase tracking-wider text-slate-500">{{ label }}</p>
    <p class="mt-1.5 text-2xl font-bold tabular-nums text-slate-900">{{ value }}</p>
    <!-- The hint wraps rather than truncating. Four tiles in a row leave it
         ~150px on a laptop, and "$6,120.00 from 34 payments in the win…" is a
         number cut off mid-sentence — the grid equalises the row's height
         anyway, so the second line costs nothing. -->
    <p v-if="hint" class="mt-1 line-clamp-2 text-xs text-slate-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * A single number that needs no plot.
 *
 * Totals like "3,120 users" or "$48,250 all time" have no shape to show — one
 * value has no trend, and drawing one as a chart with a single bar is a chart
 * that says less than the number does. The window figure goes in `hint`, where
 * it reads as context for the headline rather than competing with it.
 */
defineProps<{
  label: string
  value: string
  hint?: string | null
}>()
</script>
