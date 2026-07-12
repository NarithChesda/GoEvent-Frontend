<template>
  <div class="mb-6" aria-hidden="true">
    <!-- Section heading + sort control placeholder -->
    <div class="flex items-center justify-between mb-4 animate-pulse">
      <div class="h-6 w-40 bg-slate-200 rounded"></div>
      <div class="h-8 w-24 bg-slate-200 rounded-lg"></div>
    </div>

    <!-- Listings grid placeholder (mirrors ServiceCard layout) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="n in count"
        :key="n"
        class="bg-white rounded-xl border border-slate-200/80 overflow-hidden animate-pulse"
      >
        <div class="aspect-[16/9] bg-slate-200"></div>
        <div class="p-3 lg:p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-5 h-5 lg:w-6 lg:h-6 rounded-full bg-slate-200 flex-shrink-0"></div>
            <div class="h-3 w-24 bg-slate-200 rounded"></div>
          </div>
          <div class="h-4 w-3/4 bg-slate-200 rounded mb-2"></div>
          <div class="h-3 w-full bg-slate-200 rounded mb-1"></div>
          <div class="h-3 w-2/3 bg-slate-200 rounded mb-3"></div>
          <div class="flex gap-1.5">
            <div class="h-5 w-14 bg-slate-200 rounded-full"></div>
            <div class="h-5 w-16 bg-slate-200 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
  }>(),
  {
    count: 6,
  }
)
</script>
