<template>
  <!--
    Mirrors ServiceCard's two shapes, because they differ enough that one
    skeleton cannot stand in for both: a poster-shaped placeholder on a phone
    promises a 326px card and then delivers a 120px row, which reads as the
    layout collapsing on load. Grid classes and gaps are kept in step with
    ServiceListingsGrid.

    No heading/sort placeholder here — ServiceListControls renders the real ones
    above every list state, including this one.
  -->
  <div class="mb-6" aria-hidden="true">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <div
        v-for="n in count"
        :key="n"
        class="bg-white rounded-2xl border border-slate-200/60 overflow-hidden animate-pulse"
      >
        <!-- Mobile row -->
        <div class="flex sm:hidden gap-3 p-3">
          <div class="w-24 h-24 flex-shrink-0 rounded-xl bg-slate-200"></div>
          <div class="flex-1 min-w-0 flex flex-col justify-center">
            <div class="h-4 w-11/12 bg-slate-200 rounded"></div>
            <div class="h-4 w-2/3 bg-slate-200 rounded mt-1.5"></div>
            <div class="h-3 w-1/2 bg-slate-200 rounded mt-2"></div>
            <div class="flex items-center justify-between gap-2 mt-2">
              <div class="h-3.5 w-20 bg-slate-200 rounded"></div>
              <div class="h-3 w-16 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>

        <!-- Desktop poster -->
        <div class="hidden sm:block">
          <div class="aspect-[1.9/1] bg-slate-200"></div>
          <div class="p-4 sm:p-5">
            <div class="h-5 w-3/4 bg-slate-200 rounded mb-2"></div>
            <div class="h-3 w-full bg-slate-200 rounded mb-1"></div>
            <div class="h-3 w-2/3 bg-slate-200 rounded mb-4"></div>
            <div class="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-slate-200 flex-shrink-0"></div>
                <div class="h-3 w-24 bg-slate-200 rounded"></div>
              </div>
              <div class="h-3 w-8 bg-slate-200 rounded"></div>
            </div>
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
