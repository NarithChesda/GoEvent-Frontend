<template>
  <dl class="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
    <div
      v-for="fact in visibleFacts"
      :key="fact.label"
      class="flex items-baseline gap-3 px-3 py-2.5"
    >
      <dt class="w-2/5 flex-shrink-0 text-xs font-medium text-slate-500">{{ fact.label }}</dt>
      <dd
        class="min-w-0 flex-1 break-words text-sm"
        :class="fact.strong ? 'font-semibold text-slate-900' : 'text-slate-700'"
      >
        {{ fact.value }}
      </dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
/**
 * The record behind a decision, as a label/value list.
 *
 * A `<dl>` rather than a table: these are one row's fields, not a grid, and a
 * two-column table of one record is a table with nothing to compare. Rows with
 * no value are dropped rather than rendered as em-dashes — a drawer full of
 * blanks buries the three fields that do matter.
 */
import { computed } from 'vue'
import type { AdminFact } from './adminDisplay'

const props = defineProps<{ facts: AdminFact[] }>()

const visibleFacts = computed(() =>
  props.facts
    .filter((fact) => fact.value !== null && fact.value !== undefined && fact.value !== '')
    .map((fact) => ({ ...fact, value: String(fact.value) })),
)
</script>
