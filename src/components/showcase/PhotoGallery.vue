<template>
  <div class="mb-8">
    <h2 
      class="text-xl font-semibold mb-4 text-center" 
      :style="{ 
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }"
    >
      Gallery
    </h2>
    
    <!-- No Photos Placeholder -->
    <div v-if="photos.length === 0" class="glass-section p-8 rounded-xl text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" :style="{ backgroundColor: primaryColor + '20' }">
        <svg class="w-8 h-8" :style="{ color: primaryColor }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      </div>
      <p class="text-sm" :style="{ color: primaryColor, opacity: '0.8' }">
        No photos available at the moment
      </p>
      <p class="text-xs mt-1" :style="{ color: primaryColor, opacity: '0.6' }">
        Photos will appear here once they're added to the event
      </p>
    </div>

    <!-- Photos Content -->
    <div v-else>
      <!-- Featured Photo -->
      <div v-if="featuredPhoto" class="mb-4">
        <div class="glass-section p-2 rounded-xl">
          <img 
            :src="getMediaUrl(featuredPhoto.image)"
            :alt="featuredPhoto.caption || 'Featured Event Photo'"
            class="w-full h-48 object-cover rounded-lg"
            loading="lazy"
          />
          <p 
            v-if="featuredPhoto.caption" 
            class="text-xs mt-2 text-center" 
            :style="{ color: primaryColor, opacity: '0.8' }"
          >
            {{ featuredPhoto.caption }}
          </p>
        </div>
      </div>
      
      <!-- Photo Grid -->
      <div class="grid grid-cols-2 gap-3">
        <div 
          v-for="photo in displayedPhotos" 
          :key="photo.id"
          class="glass-section p-2 rounded-xl"
        >
          <img 
            :src="getMediaUrl(photo.image)"
            :alt="photo.caption || 'Event Photo'"
            class="w-full h-24 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
            loading="lazy"
            @click="$emit('openPhoto', photo)"
          />
          <p 
            v-if="photo.caption" 
            class="text-xs mt-1 text-center truncate" 
            :style="{ color: primaryColor, opacity: '0.7' }"
          >
            {{ photo.caption }}
          </p>
        </div>
      </div>
      
      <!-- View More Button -->
      <div v-if="hasMorePhotos" class="mt-4 text-center">
        <button
          @click="$emit('toggleShowAll')"
          class="px-4 py-2 rounded-full text-xs font-medium glass-section flex items-center gap-2 mx-auto transition-all hover:scale-[1.02]"
          :style="{ 
            borderColor: primaryColor,
            color: primaryColor,
            borderWidth: '1px',
            borderStyle: 'solid'
          }"
        >
          {{ showAll ? 'Show Less' : `View All ${photos.length} Photos` }}
        </button>
      </div>
    </div>
    
    <!-- Photo Gallery Section Endline -->
    <div class="flex justify-center mt-6">
      <div class="w-16 h-px opacity-30" :style="{ backgroundColor: primaryColor }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EventPhoto } from '../../composables/useEventShowcase'

interface Props {
  photos: EventPhoto[]
  showAll: boolean
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  getMediaUrl: (url: string) => string
}

const props = defineProps<Props>()

defineEmits<{
  openPhoto: [EventPhoto]
  toggleShowAll: []
}>()

const featuredPhoto = computed(() => 
  props.photos.find(photo => photo.is_featured)
)

const nonFeaturedPhotos = computed(() => 
  props.photos.filter(photo => !photo.is_featured)
)

const displayedPhotos = computed(() => 
  props.showAll ? nonFeaturedPhotos.value : nonFeaturedPhotos.value.slice(0, 4)
)

const hasMorePhotos = computed(() => 
  nonFeaturedPhotos.value.length > 4
)
</script>

<style scoped>
.glass-section {
  background: rgba(255, 255, 255, 0.20);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
</style>