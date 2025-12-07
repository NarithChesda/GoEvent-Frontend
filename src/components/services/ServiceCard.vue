<template>
  <div
    @click="$emit('click', listing)"
    class="group cursor-pointer bg-white rounded-xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:border-[#2ecc71]/30 transition-all duration-300"
  >
    <!-- Cover Image -->
    <div class="aspect-[16/9] relative overflow-hidden bg-slate-100">
      <img
        :src="listing.coverImage"
        :alt="listing.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <!-- Featured Badge -->
      <div v-if="listing.isFeatured" class="absolute top-2 left-2">
        <div class="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-medium rounded-full flex items-center gap-1">
          <Sparkles class="w-2.5 h-2.5" />
          Featured
        </div>
      </div>
      <!-- Category Badge -->
      <div class="absolute top-2 right-2">
        <div class="px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium rounded-full">
          {{ listing.category }}
        </div>
      </div>
      <!-- Price Tag -->
      <div class="absolute bottom-2 right-2">
        <div class="px-2 py-1 bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-semibold rounded-md shadow-sm">
          {{ listing.priceDisplay }}
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-3 lg:p-4">
      <!-- Vendor Info -->
      <div class="flex items-center gap-1.5 lg:gap-2 mb-1.5 lg:mb-2">
        <img
          :src="listing.vendorLogo"
          :alt="listing.vendorName"
          class="w-5 h-5 lg:w-6 lg:h-6 rounded-full object-cover border border-slate-200"
        />
        <span class="text-[10px] lg:text-xs text-slate-500 truncate">{{ listing.vendorName }}</span>
        <BadgeCheck v-if="listing.vendorVerified" class="w-3.5 h-3.5 lg:w-4 lg:h-4 text-[#2ecc71] flex-shrink-0" />
      </div>

      <!-- Title & Tagline -->
      <h3 class="font-semibold text-slate-900 text-sm lg:text-base mb-0.5 lg:mb-1 line-clamp-1 group-hover:text-[#2ecc71] transition-colors">
        {{ listing.title }}
      </h3>
      <p class="text-xs lg:text-sm text-slate-500 line-clamp-2 mb-2 lg:mb-3">
        {{ listing.tagline }}
      </p>

      <!-- Tags -->
      <div class="flex flex-wrap gap-1 lg:gap-1.5 mb-2 lg:mb-3">
        <span
          v-for="tag in listing.tags.slice(0, 3)"
          :key="tag"
          class="px-1.5 lg:px-2 py-0.5 lg:py-1 bg-slate-100 text-slate-600 text-[10px] lg:text-xs rounded-full"
        >
          {{ tag }}
        </span>
        <span
          v-if="listing.tags.length > 3"
          class="px-1.5 lg:px-2 py-0.5 lg:py-1 bg-slate-100 text-slate-500 text-[10px] lg:text-xs rounded-full"
        >
          +{{ listing.tags.length - 3 }}
        </span>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between pt-2 lg:pt-3 border-t border-slate-100">
        <div class="flex items-center gap-1 text-slate-400">
          <MapPin class="w-3 h-3 lg:w-4 lg:h-4" />
          <span class="text-[10px] lg:text-xs">{{ listing.serviceArea }}</span>
        </div>
        <div class="flex items-center gap-2 text-[10px] lg:text-xs text-slate-400">
          <span class="flex items-center gap-0.5">
            <Eye class="w-3 h-3 lg:w-4 lg:h-4" />
            {{ listing.views }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Sparkles, BadgeCheck, MapPin, Eye } from 'lucide-vue-next'
import type { Listing } from './types'

defineProps<{
  listing: Listing
}>()

defineEmits<{
  click: [listing: Listing]
}>()
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
