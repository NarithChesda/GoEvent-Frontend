<template>
  <!-- Desktop-only chapter progress rail -->
  <nav
    class="v2-progress-dots fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
    aria-label="Chapters"
  >
    <button
      v-for="section in sections"
      :key="section.id"
      type="button"
      class="group relative flex h-5 w-5 items-center justify-center"
      :aria-label="section.label"
      :aria-current="section.id === activeId ? 'true' : undefined"
      @click="$emit('navigate', section.id)"
    >
      <span
        class="v2-dot block rounded-full transition-all duration-300"
        :class="section.id === activeId ? 'h-2.5 w-2.5' : 'h-1.5 w-1.5 opacity-40 group-hover:opacity-80'"
      ></span>
      <!-- Label pill on hover -->
      <span class="v2-dot-label pointer-events-none absolute left-7 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {{ section.label }}
      </span>
    </button>
  </nav>
</template>

<script setup lang="ts">
export interface ProgressSection {
  id: string
  label: string
}

defineProps<{
  sections: ProgressSection[]
  activeId: string | null
}>()

defineEmits<{ navigate: [id: string] }>()
</script>

<style scoped>
.v2-dot {
  background: var(--v2-gold);
}

.v2-dot-label {
  background: var(--v2-charcoal);
  color: var(--v2-ivory);
  font-family: var(--v2-body);
}
</style>
