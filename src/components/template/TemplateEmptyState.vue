<template>
  <div class="flex flex-col items-center text-center py-12 sm:py-16">
    <div class="relative mb-4 sm:mb-5">
      <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-100 to-slate-200/70 rounded-2xl rotate-3 flex items-center justify-center ring-1 ring-slate-200/80 shadow-sm">
        <Palette class="w-7 h-7 sm:w-9 sm:h-9 text-slate-400 -rotate-3" />
      </div>
    </div>
    <h3 class="text-base sm:text-lg font-semibold text-slate-900 mb-1">
      {{ t('management.browseTemplateModal.empty.title') }}
    </h3>
    <p class="text-xs sm:text-sm text-slate-500 px-4 max-w-sm">
      {{
        hasFilters
          ? t('management.browseTemplateModal.empty.filtered')
          : t('management.browseTemplateModal.empty.noTemplates')
      }}
    </p>
    <button
      v-if="hasFilters"
      @click="$emit('clearFilters')"
      class="mt-5 sm:mt-6 inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-white text-slate-700 font-semibold rounded-xl ring-1 ring-slate-200 shadow-sm transition-all duration-200 hover:ring-slate-300 hover:shadow hover:-translate-y-px text-sm"
      type="button"
    >
      <RotateCcw class="w-4 h-4 text-slate-400" />
      {{ t('management.browseTemplateModal.empty.clearFilters') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Palette, RotateCcw } from 'lucide-vue-next'

interface Props {
  hasFilters: boolean
}

defineProps<Props>()

defineEmits<{
  clearFilters: []
}>()

const { t } = useI18n()
</script>
