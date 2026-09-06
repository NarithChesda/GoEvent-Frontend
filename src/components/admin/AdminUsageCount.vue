<template>
  <span
    class="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium"
    :class="count > 0 ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-500'"
    :title="count > 0 ? warning : undefined"
  >
    <Link2 class="h-3 w-3" aria-hidden="true" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
/**
 * How much live content points at this catalogue row.
 *
 * Every managed catalogue reports one of these — `events_using`,
 * `templates_using`, `events_count` — and they all exist for the same reason:
 * **deleting does not fail.** The foreign keys are `SET_NULL`, so removing a
 * track leaves those events silent, removing a category uncategorises those
 * events, removing a font leaves those templates without a typeface. Nothing
 * errors and nobody is told.
 *
 * So the count is drawn on the row rather than inside a detail panel, and it
 * goes amber the moment it is non-zero — not as an alarm, but because zero and
 * non-zero are the whole decision. It is the number that makes "deactivate
 * instead" the obvious choice.
 */
import { Link2 } from 'lucide-vue-next'

defineProps<{
  count: number
  /** Already-pluralised label, e.g. "17 events". */
  label: string
  /** Tooltip explaining what would be orphaned. */
  warning: string
}>()
</script>
