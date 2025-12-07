<template>
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
        <Sparkles class="w-5 h-5 text-amber-500" />
        Featured Vendors
      </h2>
      <button class="text-sm text-[#2ecc71] hover:text-[#27ae60] font-medium">
        View All
      </button>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div
        v-for="vendor in vendors"
        :key="vendor.id"
        @click="$emit('vendor-click', vendor)"
        class="group cursor-pointer bg-white rounded-xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:border-[#2ecc71]/30 transition-all duration-300"
      >
        <div class="aspect-[4/3] relative overflow-hidden bg-slate-100">
          <img
            :src="vendor.logo"
            :alt="vendor.name"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute top-2 right-2">
            <div class="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
              <Star class="w-3 h-3 fill-current" />
              Verified
            </div>
          </div>
        </div>
        <div class="p-2.5 lg:p-3">
          <h3 class="font-medium text-slate-900 text-xs lg:text-sm truncate">{{ vendor.name }}</h3>
          <p class="text-[10px] lg:text-xs text-slate-500 truncate">{{ vendor.tagline }}</p>
          <div class="flex items-center gap-1 mt-1.5 lg:mt-2">
            <MapPin class="w-2.5 h-2.5 lg:w-3 lg:h-3 text-slate-400" />
            <span class="text-[10px] lg:text-xs text-slate-500">{{ vendor.city }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Sparkles, Star, MapPin } from 'lucide-vue-next'
import type { Vendor } from './types'

defineProps<{
  vendors: Vendor[]
}>()

defineEmits<{
  'vendor-click': [vendor: Vendor]
}>()
</script>
