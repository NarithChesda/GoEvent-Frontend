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
            <span
              v-if="status === 'preview'"
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white"
            >
              <Eye class="w-3.5 h-3.5 mr-1.5" />
              Preview
            </span>
          </div>
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
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1">
              <h3 class="text-xl sm:text-2xl font-bold text-slate-900">
                {{ template.name }}
              </h3>
              <p class="text-sm sm:text-base text-slate-600 mt-1">
                {{ template.package_plan?.name || 'Plan' }}
                <span v-if="status === 'preview' && template.package_plan?.price">
                  &bull; ${{ template.package_plan.price }}
                </span>
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
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 flex-shrink-0"
            >
              <Eye class="w-4 h-4 mr-1.5" />
              Preview
            </span>
          </div>
        </div>

        <!-- Features -->
        <div v-if="template.package_plan?.features" class="flex-1">
          <h4 class="text-base font-semibold text-slate-900 mb-3">Included Features:</h4>
          <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
            <li
              v-for="feature in template.package_plan.features"
              :key="feature"
              class="flex items-start text-sm text-slate-600"
            >
              <CheckCircle class="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>{{ feature }}</span>
            </li>
          </ul>

          <!-- Action Buttons (only show if there are actions) -->
          <div
            v-if="template.youtube_preview_url || (status === 'preview' && showPaymentButton)"
            class="pt-4 border-t border-slate-200 space-y-3"
          >
            <div class="flex gap-2">
              <button
                v-if="template.youtube_preview_url"
                @click="$emit('preview-video', template.youtube_preview_url)"
                class="flex-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-3 px-6 laptop-sm:py-2 laptop-sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center justify-center text-sm laptop-sm:text-xs"
              >
                <PlayCircle class="w-5 h-5 laptop-sm:w-4 laptop-sm:h-4 mr-2 laptop-sm:mr-1.5" />
                Preview
              </button>
              <button
                v-if="status === 'preview' && showPaymentButton"
                @click="$emit('make-payment')"
                class="flex-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-3 px-6 laptop-sm:py-2 laptop-sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center justify-center text-sm laptop-sm:text-xs"
              >
                <CreditCard class="w-5 h-5 laptop-sm:w-4 laptop-sm:h-4 mr-2 laptop-sm:mr-1.5" />
                Make Payment
              </button>
            </div>
            <p v-if="status === 'preview' && showPaymentButton" class="text-xs text-slate-500 text-center">
              Complete payment to activate this template
            </p>
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
