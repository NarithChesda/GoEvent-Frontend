<template>
  <div class="relative overflow-hidden lg:rounded-3xl bg-slate-100">
    <!-- Cover image -->
    <div class="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[2.2/1]">
      <img
        :src="coverImageSrc"
        :alt="listing.title"
        class="w-full h-full object-cover"
        @error="handleCoverError"
      />
      <!-- Bottom scrim for legibility -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/25 to-transparent"
        aria-hidden="true"
      ></div>

      <ServiceHeroActions @back="$emit('back')" @share="$emit('share')" />

      <!-- Overlaid content -->
      <div class="absolute bottom-0 inset-x-0 p-4 sm:p-6 lg:p-8">
        <div class="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
          <!-- "Featured" is a GoEvent endorsement, so it carries the brand
               gradient rather than the amber/orange one it used to invent.
               DESIGN.md §1.3 defines exactly one UI gradient, and this badge is
               the only gradient object in the hero. -->
          <span
            v-if="listing.isFeatured"
            class="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-xs font-medium rounded-lg shadow-md"
          >
            <Sparkles class="w-3 h-3" />
            {{ t('services.card.featured') }}
          </span>
          <span
            class="inline-flex items-center px-2.5 py-1 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium rounded-lg shadow-md"
          >
            {{ translateServiceCategory(listing.category) }}
          </span>
        </div>

        <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-3 drop-shadow-sm">
          {{ listing.title }}
        </h1>

        <!-- Who is selling. The price used to sit opposite this chip and no
             longer does: on phones it leads the contact pill fixed to the
             bottom of the screen, and on desktop it heads the sticky contact
             card — both always in view, neither needing the hero to repeat
             them. Here it was a third copy of one figure, set against the
             title it was competing with. -->
        <component
          :is="vendorLink ? 'router-link' : 'div'"
          v-bind="vendorLink ? { to: vendorLink } : {}"
          class="inline-flex max-w-full min-w-0 items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full pl-1 pr-3 py-1 shadow-md"
          :class="vendorLink ? 'hover:bg-white transition-colors' : ''"
        >
          <img
            :src="vendorLogoSrc"
            :alt="listing.vendorName"
            class="w-6 h-6 flex-shrink-0 rounded-full object-cover border border-slate-200"
            @error="handleVendorLogoError"
          />
          <span class="truncate text-sm font-medium text-slate-900">{{ listing.vendorName }}</span>
          <BadgeCheck
            v-if="listing.vendorVerified"
            class="w-4 h-4 flex-shrink-0 text-[#2ecc71]"
            :aria-label="t('services.vendors.verified')"
          />
        </component>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Sparkles, BadgeCheck } from 'lucide-vue-next'
import type { Listing } from '../types'
import ServiceHeroActions from './ServiceHeroActions.vue'
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
  back: []
  share: []
}>()

const vendorLink = computed(() =>
  props.listing.vendorId
    ? { name: 'vendor-detail', params: { id: props.listing.vendorId } }
    : null,
)

const coverImageSrc = ref(props.listing.coverImage || getCategoryFallbackImage(props.listing.category))
const vendorLogoSrc = ref(props.listing.vendorLogo || getVendorLogoFallback())

watch(
  () => [props.listing.coverImage, props.listing.vendorLogo, props.listing.category] as const,
  ([newCoverImage, newVendorLogo, newCategory]) => {
    coverImageSrc.value = newCoverImage || getCategoryFallbackImage(newCategory)
    vendorLogoSrc.value = newVendorLogo || getVendorLogoFallback()
  },
)

const handleCoverError = (event: Event) => {
  const target = event.target as HTMLImageElement
  const fallback = getCategoryFallbackImage(props.listing.category)
  if (target.src !== fallback) {
    target.src = fallback
  }
}

const handleVendorLogoError = (event: Event) => {
  const target = event.target as HTMLImageElement
  const fallback = getVendorLogoFallback()
  if (target.src !== fallback) {
    target.src = fallback
  }
}
</script>
