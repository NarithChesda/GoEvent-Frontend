<template>
  <div
    @click="$emit('click', listing)"
    @keydown.enter="$emit('click', listing)"
    tabindex="0"
    role="article"
    :aria-label="listing.title"
    class="group relative bg-white rounded-2xl border border-slate-200/60 hover:border-slate-300/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/40 cursor-pointer overflow-hidden flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
  >
    <!-- Cover Image -->
    <div class="aspect-[1.9/1] relative overflow-hidden bg-slate-100">
      <img
        :src="coverImageSrc"
        :alt="listing.title"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        @error="handleCoverError"
      />
      <!-- Bottom scrim for price legibility -->
      <div
        class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/40 to-transparent"
        aria-hidden="true"
      ></div>

      <!-- Featured Badge -->
      <div v-if="listing.isFeatured" class="absolute top-2.5 left-2.5">
        <div class="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-lg shadow-md">
          <Sparkles class="w-3 h-3" />
          {{ t('services.card.featured') }}
        </div>
      </div>
      <!-- Category Badge -->
      <div class="absolute top-2.5 right-2.5">
        <div class="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium rounded-lg shadow-md">
          {{ translateServiceCategory(listing.category) }}
        </div>
      </div>
      <!-- Price Tag -->
      <div class="absolute bottom-2.5 left-2.5">
        <div class="px-2.5 py-1 bg-white/95 backdrop-blur-sm text-slate-900 text-xs sm:text-sm font-semibold rounded-lg shadow-md">
          {{ listing.priceDisplay }}
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4 sm:p-5 flex flex-col flex-1">
      <!-- Title & Tagline -->
      <h3 class="font-semibold text-slate-900 text-base sm:text-lg mb-1 line-clamp-1 group-hover:text-[#2ecc71] transition-colors">
        {{ listing.title }}
      </h3>
      <p class="text-xs sm:text-sm text-slate-500 line-clamp-2 mb-3">
        {{ listing.tagline }}
      </p>

      <!-- Tags -->
      <div v-if="listing.tags.length > 0" class="flex flex-wrap gap-1.5 mb-3">
        <span
          v-for="tag in listing.tags.slice(0, 3)"
          :key="tag"
          class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] sm:text-xs rounded-full"
        >
          {{ tag }}
        </span>
        <span
          v-if="listing.tags.length > 3"
          class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] sm:text-xs rounded-full"
        >
          +{{ listing.tags.length - 3 }}
        </span>
      </div>

      <!-- Footer: vendor identity + views -->
      <div class="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-slate-100">
        <div class="flex items-center gap-2 min-w-0">
          <img
            :src="vendorLogoSrc"
            :alt="listing.vendorName"
            class="w-6 h-6 rounded-full object-cover border border-slate-200 flex-shrink-0"
            @error="handleVendorLogoError"
          />
          <span class="text-xs text-slate-500 truncate">{{ listing.vendorName }}</span>
          <BadgeCheck
            v-if="listing.vendorVerified"
            class="w-4 h-4 text-[#2ecc71] flex-shrink-0"
            :aria-label="t('services.vendors.verified')"
          />
        </div>
        <span class="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
          <Eye class="w-3.5 h-3.5" />
          {{ listing.views }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Sparkles, BadgeCheck, Eye } from 'lucide-vue-next'
import type { Listing } from './types'
import {
  getCategoryFallbackImage,
  getVendorLogoFallback,
} from '@/utils/serviceFallbackImages'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()
const { translateServiceCategory } = useCategoryTranslation()

const props = defineProps<{
  listing: Listing
}>()

defineEmits<{
  click: [listing: Listing]
}>()

// Cover image with fallback support
const coverImageSrc = ref(props.listing.coverImage || getCategoryFallbackImage(props.listing.category))

// Vendor logo with fallback support
const vendorLogoSrc = ref(props.listing.vendorLogo || getVendorLogoFallback())

// Watch for specific image-related property changes (avoid deep watching entire object)
watch(
  () => [props.listing.coverImage, props.listing.vendorLogo, props.listing.category] as const,
  ([newCoverImage, newVendorLogo, newCategory]) => {
    coverImageSrc.value = newCoverImage || getCategoryFallbackImage(newCategory)
    vendorLogoSrc.value = newVendorLogo || getVendorLogoFallback()
  }
)

// Handle cover image load error - use category-based fallback
const handleCoverError = (event: Event) => {
  const target = event.target as HTMLImageElement
  const fallback = getCategoryFallbackImage(props.listing.category)
  if (target.src !== fallback) {
    target.src = fallback
  }
}

// Handle vendor logo load error - use default vendor logo
const handleVendorLogoError = (event: Event) => {
  const target = event.target as HTMLImageElement
  const fallback = getVendorLogoFallback()
  if (target.src !== fallback) {
    target.src = fallback
  }
}
</script>
