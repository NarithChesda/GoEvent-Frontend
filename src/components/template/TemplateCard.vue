<template>
  <div
    @click="handleSelect"
    :class="[
      'group cursor-pointer bg-white/80 backdrop-blur-sm border rounded-2xl overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300',
      isSelected
        ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
        : 'border-white/40 hover:border-blue-300'
    ]"
  >
    <!-- Template Preview -->
    <div class="relative h-32 sm:h-40 overflow-hidden">
      <img 
        :src="template.preview_image || '/api/placeholder/400/300'" 
        :alt="template.name"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      
      <!-- Price Badge -->
      <div class="absolute top-2 right-2">
        <span class="bg-white/90 text-slate-900 text-sm font-bold px-2 py-1 rounded">
          ${{ template.package_plan.price }}
        </span>
      </div>

      <!-- Selection Indicator -->
      <div v-if="isSelected" class="absolute top-2 left-2">
        <div class="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
          <Check class="w-4 h-4 text-white" />
        </div>
      </div>
      
      <!-- Overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      
      <!-- Template Title Overlay -->
      <div class="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 right-1 sm:right-2">
        <h4 class="font-semibold text-white text-xs sm:text-sm truncate">
          {{ template.name }}
        </h4>
        <p class="text-xs text-white/80 truncate hidden sm:block">
          {{ template.package_plan.name }}
        </p>
      </div>
    </div>
    
    <!-- Template Details -->
    <div class="p-2 sm:p-3">
      <div class="flex items-center justify-between mb-2">
        <TemplateCategoryBadge
          v-if="template.package_plan.category"
          :category="template.package_plan.category"
        />
        <span class="text-sm sm:text-lg font-bold text-slate-900 ml-2">
          ${{ template.package_plan.price }}
        </span>
      </div>
      
      <!-- Features Preview -->
      <TemplateFeatures
        v-if="template.package_plan.features?.length"
        :features="template.package_plan.features"
        :max-visible="2"
        class="hidden sm:block"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import type { EventTemplate } from '../../services/api'
import TemplateCategoryBadge from './TemplateCategoryBadge.vue'
import TemplateFeatures from './TemplateFeatures.vue'

interface Props {
  template: EventTemplate
  isSelected: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [template: EventTemplate]
}>()

const handleSelect = (): void => {
  emit('select', props.template)
}
</script>