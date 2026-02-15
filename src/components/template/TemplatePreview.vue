<template>
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black/50 modal-backdrop flex items-center justify-center z-[110] p-2 sm:p-4"
  >
    <div
      class="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between p-4 sm:p-6 border-b">
        <div class="flex-1 min-w-0">
          <h3 class="text-xl sm:text-2xl font-bold text-slate-900 truncate">{{ template.name }}</h3>
          <p class="text-sm text-slate-600 mt-1">Template Preview</p>
        </div>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 transition-colors p-1 ml-2 flex-shrink-0"
        >
          <X class="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <!-- Modal Content -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        <div class="space-y-6">
          <!-- Template Image (Portrait 9:16) -->
          <div v-if="template.preview_image" class="relative rounded-2xl overflow-hidden aspect-[9/16] mx-auto max-w-md w-full">
            <img
              :src="template.preview_image"
              :alt="template.name"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            <div class="absolute bottom-4 left-4 right-4">
              <div class="flex items-center space-x-3">
                <span
                  class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white"
                >
                  <Package class="w-4 h-4 mr-1.5" />
                  {{ template.package_plan?.name || 'Standard Plan' }}
                </span>
                <span
                  class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white"
                >
                  <DollarSign class="w-4 h-4 mr-1.5" />
                  ${{ template.package_plan?.price || '0.00' }}
                </span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Package Features -->
            <div v-if="template.package_plan?.features">
              <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
                <Sparkles class="w-5 h-5 mr-2 text-purple-600" />
                Package Features
              </h4>
              <div class="space-y-2">
                <div
                  v-for="(feature, index) in template.package_plan.features"
                  :key="index"
                  class="flex items-center text-sm text-slate-700"
                >
                  <CheckCircle class="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                  {{ feature }}
                </div>
              </div>
            </div>

            <!-- Color Palette -->
            <div v-if="template.template_colors?.length > 0">
              <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
                <Palette class="w-5 h-5 mr-2 text-purple-600" />
                Color Palette
              </h4>
              <div class="grid grid-cols-2 gap-3">
                <div
                  v-for="color in template.template_colors"
                  :key="color.id"
                  class="flex items-center space-x-2 bg-slate-50 rounded-lg p-2"
                >
                  <div
                    class="w-8 h-8 rounded-lg shadow-inner border border-white"
                    :style="{ backgroundColor: color.hex_color_code }"
                  ></div>
                  <div class="text-xs min-w-0 flex-1">
                    <p class="font-medium text-slate-700 truncate">{{ color.name }}</p>
                    <p class="text-slate-500">{{ color.hex_color_code }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Template Assets -->
          <div v-if="hasAssets">
            <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
              <Image class="w-5 h-5 mr-2 text-purple-600" />
              Template Assets
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <!-- Background Photo -->
              <div v-if="template.basic_background_photo" class="group">
                <div
                  class="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                >
                  <div class="aspect-video relative overflow-hidden">
                    <img
                      :src="template.basic_background_photo"
                      alt="Background"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div class="p-2">
                    <p class="text-xs font-medium text-slate-700">Background</p>
                  </div>
                </div>
              </div>

              <!-- Decoration Photo -->
              <div v-if="template.basic_decoration_photo" class="group">
                <div
                  class="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                >
                  <div class="aspect-video relative overflow-hidden">
                    <img
                      :src="template.basic_decoration_photo"
                      alt="Decoration"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div class="p-2">
                    <p class="text-xs font-medium text-slate-700">Decoration</p>
                  </div>
                </div>
              </div>

              <!-- Videos -->
              <div v-if="template.standard_cover_video" class="group">
                <div
                  class="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                >
                  <div
                    class="aspect-video relative overflow-hidden flex items-center justify-center"
                  >
                    <Video class="w-8 h-8 text-slate-400" />
                  </div>
                  <div class="p-2">
                    <p class="text-xs font-medium text-slate-700">Cover Video</p>
                  </div>
                </div>
              </div>

              <div v-if="template.standard_background_video" class="group">
                <div
                  class="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                >
                  <div
                    class="aspect-video relative overflow-hidden flex items-center justify-center"
                  >
                    <Video class="w-8 h-8 text-slate-400" />
                  </div>
                  <div class="p-2">
                    <p class="text-xs font-medium text-slate-700">BG Video</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Fonts -->
          <div v-if="template.template_fonts?.length > 0">
            <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
              <Type class="w-5 h-5 mr-2 text-purple-600" />
              Typography
            </h4>
            <div class="space-y-2">
              <div
                v-for="fontItem in template.template_fonts"
                :key="fontItem.id"
                class="flex items-center justify-between bg-slate-50 rounded-lg p-3"
              >
                <div>
                  <p class="font-medium text-slate-900">{{ fontItem.font?.name ?? 'Unknown font' }}</p>
                  <p class="text-xs text-slate-600">{{ fontItem.language_display }}</p>
                </div>
                <span class="text-xs font-mono text-slate-500">{{
                  fontItem.language.toUpperCase()
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-between p-4 sm:p-6 border-t bg-slate-50">
        <div class="flex items-center space-x-2 text-sm text-slate-600">
          <span>Price:</span>
          <span class="font-bold text-lg text-green-600"
            >${{ template.package_plan?.price || '0.00' }}</span
          >
        </div>

        <div class="flex space-x-3">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors font-medium"
          >
            Cancel
          </button>

          <button
            @click="$emit('select-template', template)"
            class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-2 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 flex items-center"
          >
            Select This Template
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  X,
  Package,
  DollarSign,
  Sparkles,
  CheckCircle,
  Palette,
  Image,
  Video,
  Type,
} from 'lucide-vue-next'
import type { EventTemplate } from '@/services/api'

interface Props {
  template: EventTemplate
  showModal: boolean
}

const props = defineProps<Props>()

defineEmits<{
  close: []
  'select-template': [template: EventTemplate]
}>()

const hasAssets = computed(() => {
  return (
    props.template.basic_background_photo ||
    props.template.basic_decoration_photo ||
    props.template.standard_cover_video ||
    props.template.standard_background_video
  )
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
