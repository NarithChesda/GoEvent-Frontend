<template>
  <section>
    <h3
      class="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3"
    >
      <span class="w-3 h-0.5 rounded-full bg-[var(--evt-accent)] flex-shrink-0"></span>
      <span class="min-w-0 truncate">{{ title }}</span>
      <span v-if="count != null" class="text-slate-400 font-medium flex-shrink-0">· {{ count }}</span>
      <slot name="trailing" />
    </h3>
    <slot />
  </section>
</template>

<script setup lang="ts">
/**
 * One section heading for the whole public event drawer.
 *
 * The drawer had this exact markup copied five times for About/Agenda/
 * Location/Hosts/More-like-this, while Registration and Tickets each brought a
 * boxed header of their own — so the panel read as a pile of separate widgets
 * rather than one document. Every section now goes through here, which is also
 * what lets the accent tick pick up `--evt-accent` from the panel root instead
 * of taking an `accent` prop down five levels.
 */

interface Props {
  title: string
  /** Optional muted count after the title, e.g. the number of agenda days. */
  count?: number | null
}

withDefaults(defineProps<Props>(), {
  count: null,
})
</script>
