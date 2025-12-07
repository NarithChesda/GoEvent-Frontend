<template>
  <div
    class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden"
  >
    <div class="flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
      <!-- Left: Portrait Preview Image Card -->
      <div class="flex-shrink-0 w-full lg:w-64 xl:w-72 2xl:w-80">
        <div
          v-if="template.preview_image"
          class="relative bg-slate-100 rounded-2xl overflow-hidden shadow-lg"
          style="aspect-ratio: 9/16"
        >
          <img
            :src="template.preview_image"
            :alt="template.name"
            class="w-full h-full object-cover"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
          ></div>
          <div class="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2">
            <span
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white"
            >
              <Package class="w-3.5 h-3.5 mr-1.5" />
              {{ template.package_plan?.name || 'Template Plan' }}
            </span>
          </div>
          <!-- Play button overlay for video preview -->
          <button
            v-if="template.youtube_preview_url"
            @click="$emit('preview-video', template.youtube_preview_url)"
            class="absolute inset-0 flex items-center justify-center group"
          >
            <div class="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200">
              <PlayCircle class="w-8 h-8 text-slate-800" />
            </div>
          </button>
        </div>
        <div
          v-else
          class="bg-slate-100 rounded-2xl flex items-center justify-center"
          style="aspect-ratio: 9/16"
        >
          <Palette class="w-12 h-12 text-slate-400" />
        </div>
      </div>

      <!-- Right: Template Details -->
      <div class="flex-1 flex flex-col">
        <!-- Header -->
        <div class="mb-4">
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex-1 min-w-0">
              <h3 class="text-xl sm:text-2xl font-bold text-slate-900">
                {{ template.name }}
              </h3>
              <p class="text-sm sm:text-base text-slate-600 mt-1">
                {{ template.package_plan?.name || 'Plan' }}
              </p>
            </div>
            <span
              v-if="status === 'active'"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 flex-shrink-0"
            >
              <CheckCircle class="w-4 h-4 mr-1.5" />
              Active
            </span>
            <span
              v-else-if="status === 'preview'"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 flex-shrink-0"
            >
              <Eye class="w-4 h-4 mr-1.5" />
              Preview
            </span>
          </div>
          <!-- Price display for preview mode -->
          <div v-if="status === 'preview' && template.package_plan?.price" class="mt-2">
            <span class="text-2xl sm:text-3xl font-bold text-slate-900">${{ template.package_plan.price }}</span>
            <span class="text-sm text-slate-500 ml-2">one-time</span>
          </div>
        </div>

        <!-- Features -->
        <div v-if="template.package_plan?.features" class="flex-1">
          <h4 class="text-base font-semibold text-slate-900 mb-3">Included Features:</h4>
          <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <li
              v-for="feature in template.package_plan.features"
              :key="feature"
              class="flex items-start text-sm text-slate-600"
            >
              <CheckCircle class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>{{ feature }}</span>
            </li>
          </ul>
        </div>

        <!-- Action Buttons - Always at bottom -->
        <div class="mt-6 pt-4 border-t border-slate-200">
          <!-- Preview Mode: Make Payment CTA -->
          <div v-if="status === 'preview' && showPaymentButton">
            <button
              @click="$emit('make-payment')"
              class="w-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center justify-center text-sm sm:text-base"
            >
              <CreditCard class="w-5 h-5 mr-2" />
              Make Payment
            </button>
            <p class="text-xs sm:text-sm text-slate-500 text-center mt-2">
              Complete payment to activate this template
            </p>
          </div>

          <!-- Active Mode: Just show video preview button if available -->
          <div v-else-if="status === 'active' && template.youtube_preview_url">
            <button
              @click="$emit('preview-video', template.youtube_preview_url)"
              class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center text-sm"
            >
              <PlayCircle class="w-5 h-5 mr-2" />
              Watch Template Preview
            </button>
          </div>

          <!-- Active Mode: No video available -->
          <div v-else-if="status === 'active'" class="text-center">
            <p class="text-sm text-slate-500">Template is active and ready to use</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Package, Eye, Palette, CheckCircle, PlayCircle, CreditCard } from 'lucide-vue-next'
import type { EventTemplate } from '../../services/api'

interface Props {
  template: EventTemplate
  status: 'active' | 'preview'
  showPaymentButton?: boolean
}

defineProps<Props>()

defineEmits<{
  'preview-video': [url: string]
  'make-payment': []
}>()
</script>
