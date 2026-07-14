<template>
  <div
    class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden"
  >
    <div
      class="grid grid-cols-[auto_1fr] lg:grid-rows-[auto_1fr] gap-x-4 sm:gap-x-5 lg:gap-x-6 gap-y-4 p-4 sm:p-6"
    >
      <!-- Preview image: compact thumbnail on mobile, tall portrait column on desktop -->
      <div class="w-28 sm:w-32 lg:w-64 xl:w-72 2xl:w-80 lg:row-span-2 self-start">
        <div
          v-if="template.preview_image"
          class="relative bg-slate-100 rounded-xl lg:rounded-2xl overflow-hidden shadow-md lg:shadow-lg ring-1 ring-slate-900/5 aspect-[9/16]"
        >
          <img
            :src="template.preview_image"
            :alt="template.name"
            loading="lazy"
            class="w-full h-full object-cover"
          />
          <!-- Play button overlay for video preview -->
          <button
            v-if="template.youtube_preview_url"
            @click="$emit('preview-video', template.youtube_preview_url)"
            :aria-label="t('management.templateDisplayCard.watchPreviewBtn')"
            class="absolute inset-0 flex items-center justify-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e90ff] focus-visible:ring-offset-2 rounded-xl lg:rounded-2xl"
          >
            <div class="w-10 h-10 lg:w-14 lg:h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 group-focus-visible:opacity-100 group-hover:scale-110 transition-all duration-200">
              <PlayCircle class="w-6 h-6 lg:w-8 lg:h-8 text-slate-800" />
            </div>
          </button>
        </div>
        <div
          v-else
          class="bg-slate-100 rounded-xl lg:rounded-2xl flex items-center justify-center aspect-[9/16]"
        >
          <Palette class="w-8 h-8 lg:w-12 lg:h-12 text-slate-400" />
        </div>
      </div>

      <!-- Header: name, then plan + status pills on one meta row -->
      <div class="min-w-0 self-center lg:self-start">
        <h3 class="text-xl sm:text-2xl font-bold text-slate-900 break-words">
          {{ template.name }}
        </h3>

        <div class="mt-2 flex items-center flex-wrap gap-1.5">
          <span
            :class="[
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
              planPillClass,
            ]"
          >
            <component :is="planIcon" class="w-3 h-3" />
            {{ template.package_plan?.name || t('management.templateDisplayCard.plan') }}
          </span>
          <span
            v-if="status === 'active'"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            {{ t('management.templateDisplayCard.status.active') }}
          </span>
          <span
            v-else-if="status === 'preview'"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200"
          >
            <Eye class="w-3.5 h-3.5" />
            {{ t('management.templateDisplayCard.status.preview') }}
          </span>
        </div>

        <!-- Price display for preview mode -->
        <div
          v-if="status === 'preview' && template.package_plan?.price"
          class="mt-3 flex items-baseline gap-1.5 flex-wrap"
        >
          <span class="text-2xl sm:text-3xl font-bold text-slate-900">{{ formatCurrency(template.package_plan.price, 'USD') }}</span>
          <span class="text-sm text-slate-500">{{ t('management.templateDisplayCard.oneTime') }}</span>
        </div>
      </div>

      <!-- Features + actions: full width under the header row on mobile, beside the image on desktop -->
      <div
        class="col-span-2 lg:col-span-1 lg:col-start-2 min-w-0 flex flex-col border-t border-slate-100 pt-4 lg:border-t-0 lg:pt-0"
      >
        <div v-if="template.package_plan?.features?.length" class="flex-1">
          <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 sm:mb-3">
            {{ t('management.templateDisplayCard.features') }}
            <span class="text-slate-400">· {{ template.package_plan.features.length }}</span>
          </h4>
          <ul class="flex flex-wrap gap-1.5 sm:gap-2">
            <li
              v-for="feature in template.package_plan.features"
              :key="feature"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 ring-1 ring-slate-200/70 text-xs sm:text-[13px] font-medium text-slate-700"
            >
              <Check class="w-3 h-3 text-emerald-600 flex-shrink-0" />
              <span>{{ feature }}</span>
            </li>
          </ul>
        </div>

        <!-- Action Buttons - Always at bottom -->
        <div
          v-if="status === 'active' || (status === 'preview' && showPaymentButton)"
          class="mt-4 lg:mt-6 pt-4 border-t border-slate-200"
        >
          <!-- Preview Mode: Make Payment CTA -->
          <div v-if="status === 'preview' && showPaymentButton">
            <button
              @click="$emit('make-payment')"
              class="w-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center justify-center text-sm sm:text-base"
            >
              <CreditCard class="w-5 h-5 mr-2" />
              {{ t('management.templateDisplayCard.makePaymentBtn') }}
            </button>
            <p class="text-xs sm:text-sm text-slate-500 text-center mt-2">
              {{ t('management.templateDisplayCard.makePaymentHint') }}
            </p>
          </div>

          <!-- Active Mode: Just show video preview button if available -->
          <div v-else-if="status === 'active' && template.youtube_preview_url">
            <button
              @click="$emit('preview-video', template.youtube_preview_url)"
              class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center text-sm"
            >
              <PlayCircle class="w-5 h-5 mr-2" />
              {{ t('management.templateDisplayCard.watchPreviewBtn') }}
            </button>
          </div>

          <!-- Active Mode: No video available -->
          <div v-else-if="status === 'active'" class="text-center">
            <p class="text-sm text-slate-500">{{ t('management.templateDisplayCard.activeHint') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Eye, Palette, Check, PlayCircle, CreditCard, Crown, Sparkles } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { formatCurrency } from '../../utils/currency'
import type { EventTemplate } from '../../services/api'

const { t } = useI18n()

interface Props {
  template: EventTemplate
  status: 'active' | 'preview'
  showPaymentButton?: boolean
}

const props = defineProps<Props>()

// Same package → color mapping as TemplateCard in the browse grid, tinted for a white surface
const planPillClass = computed(() => {
  const planName = props.template.package_plan?.name?.toLowerCase() ?? ''
  if (planName.includes('basic')) return 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
  if (planName.includes('standard')) return 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'
  return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
})

const planIcon = computed(() => {
  const planName = props.template.package_plan?.name?.toLowerCase() ?? ''
  return planName.includes('standard') ? Crown : Sparkles
})

defineEmits<{
  'preview-video': [url: string]
  'make-payment': []
}>()
</script>
