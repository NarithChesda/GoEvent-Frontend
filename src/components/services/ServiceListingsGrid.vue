<template>
  <!-- Just the grid. The heading and the category/sort controls live in
       ServiceListControls, which the page renders above every list state. -->
  <div class="mb-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <ServiceCard
        v-for="listing in listings"
        :key="listing.id"
        :listing="listing"
        @click="$emit('listing-click', listing)"
      />
    </div>

    <!-- Load More Button -->
    <div v-if="hasMore" class="flex justify-center mt-8">
      <button
        @click="$emit('load-more')"
        class="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center gap-2"
      >
        <span>{{ t('services.loadMore') }}</span>
        <ChevronDown class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import ServiceCard from './ServiceCard.vue'
import type { Listing } from './types'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()

withDefaults(
  defineProps<{
    listings: Listing[]
    hasMore?: boolean
  }>(),
  {
    hasMore: true,
  },
)

defineEmits<{
  'listing-click': [listing: Listing]
  'load-more': []
}>()
</script>
