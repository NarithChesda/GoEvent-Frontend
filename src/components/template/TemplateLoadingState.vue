<template>
  <!-- Mirrors TemplateGrid's layout so loading -> loaded doesn't shift -->
  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
    <div
      v-for="n in 10"
      :key="n"
      class="relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-200/80 skeleton-shimmer"
      :style="{ animationDelay: `${(n - 1) * 80}ms` }"
    >
      <!-- Bottom info placeholder to echo the card overlay -->
      <div class="absolute inset-x-0 bottom-0 p-2.5 space-y-1.5">
        <div class="h-2.5 w-3/4 rounded-full bg-slate-300/70" />
        <div class="h-2 w-1/2 rounded-full bg-slate-300/50" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No props or logic needed - just a static loading skeleton
</script>

<style scoped>
.skeleton-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  animation: shimmer 1.6s infinite;
  animation-delay: inherit;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
