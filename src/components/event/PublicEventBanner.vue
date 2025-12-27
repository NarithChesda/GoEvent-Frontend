<template>
  <div class="relative">
    <!-- Banner Image -->
    <div
      class="relative w-full"
      :style="isFundraising ? 'aspect-ratio: 16/9;' : 'aspect-ratio: 1200 / 630;'"
    >
      <img
        v-if="!fallbackError"
        :src="bannerSrc"
        :alt="title"
        class="w-full h-full object-cover"
        @error="emit('banner-error')"
      />
      <!-- Fallback when images fail -->
      <div
        v-else
        class="w-full h-full bg-gradient-to-br from-[#2ecc71]/10 to-[#1e90ff]/10 flex flex-col items-center justify-center"
      >
        <CalendarDays class="w-12 h-12 text-[#2ecc71]/40 mb-2" />
        <span class="text-sm text-slate-400">{{ categoryName || 'Event' }}</span>
      </div>

      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

      <!-- Category/Fundraiser Badge (Top Left) -->
      <div class="absolute top-4 left-4">
        <span
          v-if="isFundraising"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-emerald-700 shadow-lg"
        >
          <Heart class="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
          Fundraiser
        </span>
        <span
          v-else-if="categoryName"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-slate-700 shadow-lg"
        >
          <span class="text-slate-400">#</span>
          {{ categoryName }}
        </span>
      </div>

      <!-- Title & Organizer Overlay -->
      <div
        class="absolute bottom-0 left-0 right-0 p-5"
        :class="isFundraising ? 'pb-8' : 'pb-5'"
      >
        <h1 class="text-2xl md:text-3xl font-bold text-white leading-tight mb-2 drop-shadow-lg">
          {{ title }}
        </h1>
        <div class="flex items-center gap-2 text-white/90 text-sm">
          <div
            class="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <span class="text-xs font-medium">{{ organizerInitials }}</span>
          </div>
          <span>by {{ organizerName }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, Heart } from 'lucide-vue-next'
import { useEventDateFormatters } from '@/composables/event'

interface Props {
  bannerSrc: string
  fallbackError: boolean
  title: string
  categoryName: string | null
  isFundraising: boolean
  organizerName: string
}

interface Emits {
  (e: 'banner-error'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { getInitials } = useEventDateFormatters()

const organizerInitials = computed(() => getInitials(props.organizerName))
</script>
