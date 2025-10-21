<template>
  <div
    @click="handleSelect"
    :class="[
      'group cursor-pointer bg-white/80 backdrop-blur-sm border rounded-2xl overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300',
      isSelected
        ? 'border-[#1e90ff] ring-2 ring-[#87CEEB] shadow-lg'
        : 'border-white/40 hover:border-[#5eb3f6]',
    ]"
  >
    <!-- Template Preview - Portrait Ratio (9:16 for 1080x1920) -->
    <div class="relative w-full aspect-[9/16] overflow-hidden">
      <img
        :src="template.preview_image || '/api/placeholder/400/300'"
        :alt="template.name"
        class="w-full h-full object-cover"
        loading="lazy"
      />

      <!-- Selection Indicator -->
      <div v-if="isSelected" class="absolute top-2 left-2 z-10">
        <div class="w-6 h-6 bg-[#1e90ff] rounded-full flex items-center justify-center shadow-lg">
          <Check class="w-4 h-4 text-white" />
        </div>
      </div>

      <!-- Template Info Overlay - Gray Transparent Background -->
      <div class="absolute inset-x-0 bottom-0 bg-gray-900/25 backdrop-blur-sm p-2 sm:p-3 lg:p-4">
        <!-- Template Title and Plan -->
        <h4 class="font-semibold text-white text-xs sm:text-sm lg:text-base mb-0.5 sm:mb-1 truncate">
          {{ template.name }}
        </h4>
        <div class="mb-1 sm:mb-2">
          <span
            :class="[
              'text-[10px] sm:text-xs lg:text-sm font-medium px-2 py-0.5 rounded-md inline-block',
              packageColorClass,
            ]"
          >
            {{ template.package_plan.name }}
          </span>
        </div>

        <!-- Category and Price -->
        <div class="flex items-center justify-between gap-2">
          <TemplateCategoryBadge
            v-if="template.package_plan.category"
            :category="template.package_plan.category"
          />
          <span class="text-xs sm:text-sm lg:text-base font-bold text-white bg-white/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
            ${{ template.package_plan.price }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import type { EventTemplate } from '../../services/api'
import TemplateCategoryBadge from './TemplateCategoryBadge.vue'

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

const packageColorClass = computed(() => {
  const planName = props.template.package_plan.name.toLowerCase()

  if (planName.includes('basic')) {
    return 'bg-blue-500/90 text-white shadow-md'
  } else if (planName.includes('standard')) {
    return 'bg-purple-500/90 text-white shadow-md'
  }

  return 'text-white/90'
})
</script>
