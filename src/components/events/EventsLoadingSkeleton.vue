<template>
  <div class="space-y-6 sm:space-y-8">
    <div v-for="i in count" :key="`skeleton-${i}`">
      <!-- Mobile Skeleton -->
      <div class="sm:hidden">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-2 h-2 rounded-full bg-slate-200 animate-pulse"></div>
          <div class="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
        </div>
        <div class="pl-5">
          <div
            class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 animate-pulse"
          >
            <div class="flex gap-3">
              <div class="flex-1 space-y-2">
                <div class="h-3 bg-slate-200 rounded w-12"></div>
                <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                <div class="h-3 bg-slate-200 rounded w-1/2"></div>
                <div class="h-3 bg-slate-200 rounded w-1/3"></div>
              </div>
              <div
                class="w-20 h-20 bg-slate-200 rounded-xl flex-shrink-0"
              ></div>
            </div>
          </div>
        </div>
      </div>
      <!-- Desktop Skeleton -->
      <div class="hidden sm:flex gap-6">
        <div class="w-24 flex-shrink-0">
          <div class="h-4 bg-slate-200 rounded w-16 mb-2 animate-pulse"></div>
          <div class="h-3 bg-slate-200 rounded w-12 animate-pulse"></div>
        </div>
        <div
          class="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-pulse"
        >
          <div class="flex gap-4">
            <div class="flex-1 space-y-3">
              <div class="h-3 bg-slate-200 rounded w-16"></div>
              <div class="h-5 bg-slate-200 rounded w-3/4"></div>
              <div class="h-4 bg-slate-200 rounded w-1/2"></div>
              <div class="h-4 bg-slate-200 rounded w-1/3"></div>
            </div>
            <div class="w-32 h-24 bg-slate-200 rounded-xl"></div>
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
    count: 3,
  }
)
</script>
