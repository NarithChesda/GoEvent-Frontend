<template>
  <div v-if="html" class="rounded-xl border p-3" :class="toneClass">
    <p class="text-xs font-semibold uppercase tracking-wider" :class="labelClass">{{ label }}</p>
    <!-- eslint-disable-next-line vue/no-v-html -- sanitised on the line above -->
    <div class="admin-note mt-1.5 text-sm" v-html="html"></div>
  </div>
</template>

<script setup lang="ts">
/**
 * A note already on the record — an internal `admin_notes`, or the
 * `review_note` an applicant was shown.
 *
 * The server sanitises these to `<p> <br> <strong> <em> <ul> <ol> <li>`, so they
 * arrive as markup and rendering them as text would show the tags. They are
 * sanitised **again** here with the profile that matches that allowlist: this
 * text was typed by another staff member and stored, and a note is not a place
 * to start trusting stored HTML.
 *
 * `internal` is not decoration. `admin_notes` must never be shown anywhere the
 * applicant can see, and the visual difference between it and the note they
 * *were* sent is the only thing preventing an admin from quoting the wrong one.
 */
import { computed } from 'vue'
import { sanitizeRichContent } from '@/utils/sanitize'

const props = withDefaults(
  defineProps<{
    label: string
    note?: string | null
    /** Staff-only text. Drawn in amber, and labelled as internal. */
    internal?: boolean
  }>(),
  { note: null, internal: false },
)

const html = computed(() => {
  const value = props.note?.trim()
  return value ? sanitizeRichContent(value, 2000) : ''
})

const toneClass = computed(() =>
  props.internal ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-slate-50',
)

const labelClass = computed(() => (props.internal ? 'text-amber-700' : 'text-slate-500'))
</script>

<style scoped>
/* The server's allowlist, given the spacing it needs. Scoped styles do not
   reach `v-html` content on their own, so these go through `:deep()`. */
.admin-note :deep(p) {
  margin: 0 0 0.5rem;
  color: #334155;
  line-height: 1.6;
}

.admin-note :deep(p:last-child) {
  margin-bottom: 0;
}

.admin-note :deep(ul),
.admin-note :deep(ol) {
  margin: 0 0 0.5rem;
  padding-left: 1.25rem;
  color: #334155;
}

.admin-note :deep(ul) {
  list-style: disc;
}

.admin-note :deep(ol) {
  list-style: decimal;
}

.admin-note :deep(strong) {
  font-weight: 600;
  color: #0f172a;
}
</style>
