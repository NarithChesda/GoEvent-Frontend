<template>
  <div
    class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-8 sm:p-12 text-center"
  >
    <div
      class="w-24 h-24 rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 flex items-center justify-center mx-auto mb-4 sm:mb-6"
    >
      <Users class="w-10 h-10 text-[#2ecc71]" aria-hidden="true" />
    </div>
    <h3 class="text-xl lg:text-2xl font-bold text-slate-900 mb-2">
      {{ title }}
    </h3>
    <p class="text-sm sm:text-base text-slate-600 leading-relaxed mb-6 max-w-md mx-auto">
      {{ description }}
    </p>
    <button
      v-if="hasActiveFilters"
      @click="$emit('clear-filters')"
      class="inline-flex items-center px-5 py-2.5 lg:px-6 lg:py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors duration-200"
    >
      {{ t('management.registrationEmpty.clearFilters') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Users } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()

// Props
const props = defineProps<{
  hasActiveFilters: boolean
}>()

// Emits
defineEmits<{
  'clear-filters': []
}>()

// Computed
const title = computed(() => {
  return props.hasActiveFilters ? t('management.registrationEmpty.noResults') : t('management.registrationEmpty.noRegistrations')
})

const description = computed(() => {
  return props.hasActiveFilters
    ? t('management.registrationEmpty.noResultsDesc')
    : t('management.registrationEmpty.noRegistrationsDesc')
})
</script>
