<template>
  <div
    @click="handleSelect"
    :class="[
      'group relative cursor-pointer bg-white rounded-2xl overflow-hidden transition-[box-shadow,transform] duration-200 ease-out active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50',
      isSelected
        ? 'ring-2 ring-[#1e90ff] ring-offset-2 ring-offset-slate-50 shadow-xl shadow-sky-500/10'
        : 'ring-1 ring-slate-200/80 hover:ring-slate-300 hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-0.5',
    ]"
    role="button"
    tabindex="0"
    @keydown.enter.prevent="handleSelect"
    @keydown.space.prevent="handleSelect"
    :aria-label="t('management.browseTemplateModal.card.select')"
  >
    <!-- Template Preview - Portrait Ratio (9:16 for 1080x1920) -->
    <div class="relative w-full aspect-[9/16] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
      <!-- Actual Image -->
      <img
        v-if="template.preview_image && !imageError"
        :src="template.preview_image"
        :alt="`${template.name} template preview`"
        class="w-full h-full object-cover transition-[transform,opacity] duration-500 ease-out group-hover:scale-[1.04]"
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
        v-if="!hasImage"
        class="absolute inset-0 flex items-center justify-center text-slate-300"
      >
        <ImageOff class="w-10 h-10" />
      </div>

      <!-- Price pill (top-right) — only when there is a price to state. A free
           template used to carry a "Free" pill up here AND a "Free Basic" chip
           in the footer, which is the same fact twice on a 180px-wide card. -->
      <div v-if="!isFree" class="absolute top-2 right-2 z-10">
        <span
          class="inline-flex items-center px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold backdrop-blur-md bg-black/55 text-white ring-1 ring-white/20"
        >
          {{ priceLabel }}
        </span>
      </div>

      <!-- Selection Indicator with Owned Badge -->
      <div v-if="isSelected" class="absolute top-2 left-2 z-10 flex items-center gap-1.5">
        <div class="w-6 h-6 bg-[#1e90ff] rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/90">
          <Check class="w-4 h-4 text-white" />
        </div>
        <span v-if="isOwned" class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.5625rem] font-bold bg-emerald-500 text-white shadow-lg">
          {{ t('management.browseTemplateModal.card.owned') }}
        </span>
      </div>

      <!-- Owned Badge (when not selected) -->
      <div v-else-if="isOwned" class="absolute top-2 left-2 z-10">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-bold bg-emerald-500 text-white shadow-lg">
          <Check class="w-3 h-3" />
          {{ t('management.browseTemplateModal.card.owned') }}
        </span>
      </div>

      <!-- Info Footer: dark scrim over imagery, light strip on placeholders -->
      <div
        :class="[
          'absolute inset-x-0 bottom-0 px-2 pb-2 sm:px-2.5 sm:pb-2.5',
          hasImage
            ? 'bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10'
            : 'bg-white/85 backdrop-blur-sm border-t border-slate-200/70 pt-2 sm:pt-2.5',
        ]"
      >
        <!-- Title -->
        <h4
          :class="[
            'font-semibold text-[0.6875rem] sm:text-xs mb-1 truncate',
            hasImage ? 'text-white drop-shadow-sm' : 'text-slate-900',
          ]"
        >
          {{ template.name }}
        </h4>
        <!-- Plan. The tier reads from its icon — the same Crown/Sparkles pair
             the sidebar filter and the editor's plan cards use — not from a
             tier colour. Sky-for-basic and violet-for-standard put two more
             saturated hues on a card that already carries a status pill, a
             price pill and whatever the artwork is doing. -->
        <span
          :class="[
            'inline-flex items-center gap-1 text-[0.625rem] sm:text-[0.6875rem] font-medium px-2 py-0.5 rounded-full',
            hasImage
              ? 'bg-white/20 text-white/95 backdrop-blur-sm'
              : 'bg-slate-100 text-slate-600',
          ]"
        >
          <component :is="isStandardPlan ? Crown : Sparkles" class="w-3 h-3 flex-shrink-0" />
          {{ template.package_plan.name }}
        </span>
      </div>

      <!-- Centered Preview Button when selected -->
      <div v-if="isSelected && template.youtube_preview_url" class="absolute inset-0 flex items-center justify-center">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 rounded-full bg-white/95 text-slate-900 text-xs sm:text-sm font-semibold shadow-xl backdrop-blur-md transition-[background-color,transform] duration-200 ease-out hover:bg-white active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e90ff]"
          @click.stop="openPreview"
        >
          <Play class="w-3.5 h-3.5 fill-current" />
          {{ t('management.browseTemplateModal.card.preview') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, Crown, ImageOff, Play, Sparkles } from 'lucide-vue-next'
import type { EventTemplate } from '../../services/api'

interface Props {
  template: EventTemplate
  isSelected: boolean
  isOwned?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOwned: false,
})

const emit = defineEmits<{
  select: [template: EventTemplate]
}>()

const { t } = useI18n()

// Track image loading and error states
const imageLoading = ref(true)
const imageError = ref(false)

const hasImage = computed(() => !!props.template.preview_image && !imageError.value)

const isFree = computed(() => {
  const price = Number(props.template.package_plan.price)
  return !Number.isFinite(price) || price <= 0
})

const priceLabel = computed(() =>
  isFree.value
    ? t('management.browseTemplateModal.card.free')
    : `$${props.template.package_plan.price}`,
)

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

const isStandardPlan = computed(() =>
  props.template.package_plan.name.toLowerCase().includes('standard'),
)
</script>
