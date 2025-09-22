<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
    <div v-for="n in 6" :key="n" class="animate-pulse">
      <div class="bg-slate-200 rounded-lg h-48" />
      <div class="mt-2 space-y-1">
        <div class="h-4 bg-slate-200 rounded w-3/4" />
        <div class="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No props or logic needed - just a static loading skeleton
</script>
