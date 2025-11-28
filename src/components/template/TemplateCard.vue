<template>
  <div
    @click="handleSelect"
    :class="[
      'group relative cursor-pointer bg-white/80 backdrop-blur-sm border rounded-2xl overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300',
      isSelected
        ? 'border-[#1e90ff] ring-2 ring-[#87CEEB] shadow-lg'
        : 'border-white/40 hover:border-[#5eb3f6]',
    ]"
    role="button"
    tabindex="0"
    @keydown.enter.prevent="handleSelect"
    @keydown.space.prevent="handleSelect"
    aria-label="Select template"
  >
    <!-- Template Preview - Portrait Ratio (9:16 for 1080x1920) -->
    <div class="relative w-full aspect-[9/16] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
      <!-- Actual Image -->
      <img
        v-if="template.preview_image && !imageError"
        :src="template.preview_image"
        :alt="`${template.name} template preview`"
        class="w-full h-full object-cover transition-opacity duration-300"
        :class="{ 'opacity-0': imageLoading, 'opacity-100': !imageLoading }"
        loading="lazy"
        @load="handleImageLoad"
        @error="handleImageError"
      />
      <!-- Loading Indicator -->
      <div
        v-if="imageLoading && template.preview_image && !imageError"
        class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200"
      >
        <div class="w-8 h-8 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
      </div>
      <!-- Fallback Placeholder -->
      <div
        v-if="!template.preview_image || imageError"
        class="absolute inset-0 flex flex-col items-center justify-center text-slate-400"
      >
        <ImageOff class="w-10 h-10 mb-2 opacity-50" />
        <span class="text-xs font-medium opacity-70 text-center px-2">{{ template.name }}</span>
      </div>

      <!-- Price pill (top-right, minimal) -->
      <div class="absolute top-2 right-2 z-10">
        <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/50 text-white backdrop-blur-sm">
          ${{ template.package_plan.price }}
        </span>
      </div>

      <!-- Selection Indicator -->
      <div v-if="isSelected" class="absolute top-2 left-2 z-10">
        <div class="w-6 h-6 bg-[#1e90ff] rounded-full flex items-center justify-center shadow-lg">
          <Check class="w-4 h-4 text-white" />
        </div>
      </div>

      <!-- Minimal Info Overlay -->
      <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-1 sm:p-1.5">
        <!-- Title -->
        <h4 class="font-semibold text-white text-[11px] sm:text-xs mb-0.5 truncate">
          {{ template.name }}
        </h4>
        <!-- Plan + Category -->
        <div class="flex items-center justify-between">
          <span
            :class="[
              'text-[10px] sm:text-[11px] lg:text-xs font-medium px-2 py-0.5 rounded-md inline-block',
              packageColorClass,
            ]"
          >
            {{ template.package_plan.name }}
          </span>
          <TemplateCategoryBadge
            v-if="template.package_plan.category"
            :category="template.package_plan.category"
          />
        </div>
      </div>

      <!-- Centered Preview Button when selected -->
      <div v-if="isSelected && template.youtube_preview_url" class="absolute inset-0 flex items-center justify-center">
        <button
          type="button"
          class="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-xs sm:text-sm font-semibold shadow-lg opacity-90 hover:opacity-100 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e90ff]"
          @click.stop="openPreview"
        >
          Preview
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, ImageOff } from 'lucide-vue-next'
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

// Track image loading and error states
const imageLoading = ref(true)
const imageError = ref(false)

const handleImageLoad = (): void => {
  imageLoading.value = false
}

const handleImageError = (): void => {
  imageError.value = true
  imageLoading.value = false
}

const handleSelect = (): void => {
  emit('select', props.template)
}

const openPreview = (): void => {
  if (props.template.youtube_preview_url) {
    window.open(props.template.youtube_preview_url, '_blank', 'noopener,noreferrer')
  }
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
