<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-medium"
    :class="STATUS_TONE_CLASS[tone]"
  >
    <span class="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-70" aria-hidden="true" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
/**
 * A queue row's state.
 *
 * The tone is derived from the raw `status`, never from `status_display` —
 * that one is server-side prose ("Pending Review") and a translated backend
 * would silently repaint every badge grey.
 *
 * `status_display` is still what gets *rendered*: the server already knows the
 * right words for statuses this frontend has never heard of, and inventing a
 * local label table would make a new backend status render as a raw key.
 */
import { computed } from 'vue'
import { STATUS_TONE_CLASS, statusTone } from './adminDisplay'

const props = defineProps<{
  status: string
  statusDisplay?: string | null
}>()

const tone = computed(() => statusTone(props.status))
const label = computed(() => props.statusDisplay?.trim() || props.status)
</script>
