<template>
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-slate-900 flex items-center gap-2">
        <Sparkles v-if="!showAll" class="w-5 h-5 text-amber-500" />
        <Store v-else class="w-5 h-5 text-[#2ecc71]" />
        {{ showAll ? t('services.vendors.allTitle') : t('services.vendors.featuredTitle') }}
      </h2>
      <button
        @click="$emit('toggle-view')"
        class="text-sm text-[#2ecc71] hover:text-[#27ae60] font-medium"
      >
        {{ showAll ? t('services.vendors.showFeatured') : t('services.vendors.viewAll') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="w-8 h-8 border-4 border-[#2ecc71] border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Vendors Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div
        v-for="vendor in vendors"
        :key="vendor.id"
        @click="$emit('vendor-click', vendor)"
        @keydown.enter="$emit('vendor-click', vendor)"
        tabindex="0"
        role="article"
        :aria-label="vendor.name"
        class="group cursor-pointer bg-white rounded-2xl border border-slate-200/60 hover:border-slate-300/80 overflow-hidden hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
      >
        <!-- Gradient banner -->
        <div class="h-14 sm:h-16 bg-gradient-to-r from-[#2ecc71]/20 to-[#1e90ff]/20" aria-hidden="true"></div>

        <!-- Round logo avatar -->
        <img
          :src="logoSrc(vendor)"
          :alt="vendor.name"
          class="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-white shadow-md object-cover bg-white mx-auto -mt-7 sm:-mt-8 group-hover:scale-105 transition-transform duration-300"
          @error="handleLogoError"
        />

        <div class="px-3 pb-3.5 pt-2 text-center">
          <div class="flex items-center justify-center gap-1 min-w-0">
            <h3 class="font-semibold text-slate-900 text-xs sm:text-sm truncate group-hover:text-[#2ecc71] transition-colors">
              {{ vendor.name }}
            </h3>
            <BadgeCheck
              class="w-3.5 h-3.5 text-[#2ecc71] flex-shrink-0"
              :aria-label="t('services.vendors.verified')"
            />
          </div>
          <p class="text-[10px] sm:text-xs text-slate-500 truncate mt-0.5">{{ vendor.tagline }}</p>
          <div class="flex items-center justify-center gap-1 mt-2 text-[10px] sm:text-xs text-slate-400 min-w-0">
            <template v-if="vendor.city">
              <MapPin class="w-3 h-3 flex-shrink-0" />
              <span class="truncate">{{ vendor.city }}</span>
              <span aria-hidden="true">·</span>
            </template>
            <span class="flex-shrink-0">
              {{ t('services.vendors.listingsCount', { count: vendor.listingsCount }, vendor.listingsCount) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More Button (only when showing all) -->
    <div v-if="showAll && hasMore && !loading" class="flex justify-center mt-4">
      <button
        @click="$emit('load-more')"
        class="px-4 py-2 text-sm font-medium text-[#2ecc71] hover:text-[#27ae60] border border-[#2ecc71] hover:border-[#27ae60] rounded-lg transition-colors"
      >
        {{ t('services.vendors.loadMore') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Sparkles, BadgeCheck, MapPin, Store } from 'lucide-vue-next'
import type { Vendor } from './types'
import { getVendorLogoFallback } from '@/utils/serviceFallbackImages'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()

defineProps<{
  vendors: Vendor[]
  showAll?: boolean
  loading?: boolean
  hasMore?: boolean
}>()

defineEmits<{
  'vendor-click': [vendor: Vendor]
  'toggle-view': []
  'load-more': []
}>()

const logoSrc = (vendor: Vendor) => vendor.logo || getVendorLogoFallback()

const handleLogoError = (event: Event) => {
  const target = event.target as HTMLImageElement
  const fallback = getVendorLogoFallback()
  if (target.src !== fallback) {
    target.src = fallback
  }
}
</script>
