<template>
  <div class="mb-6">
    <h2 
      class="text-xl font-semibold mb-4" 
      :style="{ 
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }"
    >
      Gallery
    </h2>
    
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