<template>
  <div class="absolute inset-0 z-10" :style="{ backgroundColor: primaryColor }">
    <!-- Standard Cover Video Loop -->
    <video
      v-if="templateAssets?.standard_cover_video"
      :src="getMediaUrl(templateAssets.standard_cover_video)"
      autoplay
      loop
      muted
      playsinline
      class="absolute inset-0 w-full h-full desktop-video-sizing"
    />
    
    <!-- Fallback Background Image -->
    <div v-else-if="templateAssets?.basic_background_photo" class="absolute inset-0">
      <img 
        :src="getMediaUrl(templateAssets.basic_background_photo)" 
        alt="Background"
        class="w-full h-full object-cover"
      />
    </div>

    <!-- Dark Overlay -->
    <div class="absolute inset-0 bg-black/30"></div>

    <!-- Content Overlay -->
    <div class="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
      <!-- Guest Name -->
      <div v-if="guestName" class="mb-8 animate-fadeIn">
        <p class="text-2xl mb-3" :style="{ color: 'rgba(255, 255, 255, 0.8)' }">Dear</p>
        <h2 
          class="text-5xl font-bold" 
          :style="{ 
            fontFamily: currentFont,
            background: gradientStyle,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }"
        >
          {{ guestName }}
        </h2>
      </div>

      <!-- Welcome Text -->
      <div class="mb-12 animate-fadeIn animation-delay-200">
        <p class="text-2xl mb-2" :style="{ color: 'rgba(255, 255, 255, 0.9)' }">You're Invited to</p>
        <h1 
          class="text-6xl font-bold" 
          :style="{ 
            fontFamily: currentFont,
            background: gradientStyle,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }"
        >
          {{ eventTitle }}
        </h1>
      </div>

      <!-- Open Envelope Button -->
      <button
        @click="$emit('openEnvelope')"
        class="animate-pulse hover:animate-none transform hover:scale-110 transition-all duration-300"
      >
        <img 
          v-if="templateAssets?.open_envelope_button"
          :src="getMediaUrl(templateAssets.open_envelope_button)" 
          alt="Open Invitation"
          class="w-72 h-auto cursor-pointer drop-shadow-2xl"
        />
        <div 
          v-else 
          class="px-12 py-6 rounded-full shadow-2xl transition-all hover:scale-105" 
          :style="{ 
            background: gradientStyle,
            backdropFilter: 'blur(10px)'
          }"
        >
          <span class="text-2xl font-bold text-white">Open Invitation</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface TemplateAssets {
  standard_cover_video?: string
  basic_background_photo?: string
  open_envelope_button?: string
}

interface Props {
  templateAssets?: TemplateAssets | null
  guestName: string
  eventTitle: string
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  currentFont: string
  getMediaUrl: (url: string) => string
}

const props = defineProps<Props>()

defineEmits<{
  openEnvelope: []
}>()

const gradientStyle = computed(() => 
  `linear-gradient(135deg, ${props.primaryColor}, ${props.secondaryColor || props.accentColor})`
)
</script>

<style scoped>
/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 1s ease-out forwards;
}

.animation-delay-200 {
  animation-delay: 200ms;
}

/* Responsive video sizing */
.desktop-video-sizing {
  position: absolute;
  top: 0;
  left: 0;
  height: 100vh;
  object-position: center;
}

/* Mobile devices - stretch height, crop width, center video */
@media (max-width: 768px) {
  .desktop-video-sizing {
    width: 100% !important;
    height: 100vh !important;
    object-fit: cover !important;
    object-position: center center !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    transform: none !important;
  }
}

/* Desktop and tablet landscape - consistent desktop treatment with 100% height */
@media (min-width: 769px) {
  .desktop-video-sizing {
    width: 100%;
    object-fit: contain;
  }
}
</style>