<template>
  <div
    v-if="event.event_template && event.event_template_enabled && event.event_template_details"
    class="space-y-6"
  >
    <!-- Template Overview Card -->
    <div
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl overflow-hidden"
    >
      <div class="relative">
        <!-- Preview Image -->
        <div
          v-if="event.event_template_details?.preview_image"
          class="relative aspect-[9/16] overflow-hidden mx-auto max-w-md"
        >
          <img
            :src="event.event_template_details?.preview_image"
            :alt="event.event_template_details?.name"
            class="w-full h-full object-cover"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
          ></div>
          <div class="absolute bottom-4 left-6 right-6">
            <h3 class="text-2xl font-bold text-white mb-2">
              {{ event.event_template_details?.name || 'Selected Template' }}
            </h3>
            <div class="flex items-center space-x-4">
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white"
              >
                <Package class="w-4 h-4 mr-1" />
                {{ event.event_template_details?.package_plan.name || 'Template Plan' }}
              </span>
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white"
              >
                <DollarSign class="w-4 h-4 mr-1" />
                ${{ event.event_template_details?.package_plan.price || '0.00' }}
              </span>
              <span
                class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                :class="
                  event.event_template_enabled
                    ? 'bg-green-500 text-white'
                    : 'bg-yellow-500 text-black'
                "
              >
                {{ event.event_template_enabled ? 'Active' : 'Pending Payment' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Template Details -->
        <div class="p-6 space-y-6">
          <!-- Package Features -->
          <div>
            <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
              <Sparkles class="w-5 h-5 mr-2 text-purple-600" />
              Package Features
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div
                v-for="(feature, index) in event.event_template_details?.package_plan.features ||
                []"
                :key="index"
                class="flex items-center text-sm text-slate-700"
              >
                <CheckCircle class="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                {{ feature }}
              </div>
            </div>
          </div>

          <!-- Color Palette -->
          <div
            v-if="
              event.event_template_details?.template_colors &&
              event.event_template_details.template_colors.length > 0
            "
          >
            <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
              <Palette class="w-5 h-5 mr-2 text-purple-600" />
              Color Palette
            </h4>
            <div class="flex flex-wrap gap-3">
              <div
                v-for="color in event.event_template_details?.template_colors || []"
                :key="color.id"
                class="group cursor-pointer"
              >
                <div
                  class="flex items-center space-x-2 bg-white rounded-lg border border-slate-200 p-2 hover:shadow-md transition-all"
                >
                  <div
                    class="w-10 h-10 rounded-lg shadow-inner"
                    :style="{ backgroundColor: color.hex_color_code }"
                  ></div>
                  <div class="text-xs">
                    <p class="font-medium text-slate-700">{{ color.name }}</p>
                    <p class="text-slate-500">{{ color.hex_color_code }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Template Assets -->
          <div>
            <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
              <Image class="w-5 h-5 mr-2 text-purple-600" />
              Template Assets
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <!-- Background Photo -->
              <div
                v-if="event.event_template_details?.basic_background_photo"
                class="group cursor-pointer"
              >
                <div
                  class="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                >
                  <div class="aspect-video relative overflow-hidden bg-slate-100">
                    <img
                      :src="event.event_template_details?.basic_background_photo"
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
              <div
                v-if="event.event_template_details?.basic_decoration_photo"
                class="group cursor-pointer"
              >
                <div
                  class="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                >
                  <div class="aspect-video relative overflow-hidden bg-slate-100">
                    <img
                      :src="event.event_template_details?.basic_decoration_photo"
                      alt="Decoration"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div class="p-2">
                    <p class="text-xs font-medium text-slate-700">Decoration</p>
                  </div>
                </div>
              </div>

              <!-- Cover Video -->
              <div
                v-if="event.event_template_details?.standard_cover_video"
                class="group cursor-pointer"
              >
                <div
                  class="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                >
                  <div
                    class="aspect-video relative overflow-hidden bg-slate-100 flex items-center justify-center"
                  >
                    <Video class="w-8 h-8 text-slate-400" />
                  </div>
                  <div class="p-2">
                    <p class="text-xs font-medium text-slate-700">Cover Video</p>
                  </div>
                </div>
              </div>

              <!-- Background Video -->
              <div
                v-if="event.event_template_details?.standard_background_video"
                class="group cursor-pointer"
              >
                <div
                  class="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                >
                  <div
                    class="aspect-video relative overflow-hidden bg-slate-100 flex items-center justify-center"
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
          <div
            v-if="
              event.event_template_details?.template_fonts &&
              event.event_template_details.template_fonts.length > 0
            "
          >
            <h4 class="font-semibold text-slate-900 mb-3 flex items-center">
              <Type class="w-5 h-5 mr-2 text-purple-600" />
              Typography
            </h4>
            <div class="space-y-2">
              <div
                v-for="fontItem in event.event_template_details?.template_fonts || []"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Package,
  DollarSign,
  Sparkles,
  CheckCircle,
  Palette,
  Image,
  Video,
  Type,
} from 'lucide-vue-next'
import type { Event } from '@/services/api'

interface Props {
  event: Event
}

defineProps<Props>()
</script>
