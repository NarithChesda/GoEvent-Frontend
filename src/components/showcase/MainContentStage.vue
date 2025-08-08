<template>
  <div class="absolute inset-0">
    <!-- Standard Background Video Loop -->
    <video
      v-if="templateAssets?.standard_background_video"
      :src="getMediaUrl(templateAssets.standard_background_video)"
      autoplay
      loop
      muted
      playsinline
      class="absolute inset-0 w-full h-full object-cover"
    />
    
    <!-- Fallback Background - Plain Black -->
    <div v-else class="absolute inset-0 bg-black"></div>

    <!-- Liquid Glass Floating Box Container -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute inset-0 overflow-y-auto custom-scrollbar">
        <div class="min-h-full py-12 px-6 flex items-start justify-center">
          <!-- Liquid Glass Card -->
          <div class="liquid-glass-card animate-slideUp">
            <!-- Glass Background Effects -->
            <div class="glass-background"></div>
            
            <!-- Content Container with Scroll -->
            <div class="relative z-10 h-full overflow-y-auto custom-scrollbar">
              <!-- Language Toggle (Fixed Position) -->
              <div v-if="availableLanguages && availableLanguages.length > 1" class="absolute top-4 right-4 z-20">
                <div class="glass-section p-2 rounded-lg">
                  <select 
                    :value="currentLanguage" 
                    @change="$emit('changeLanguage', ($event.target as HTMLSelectElement).value)"
                    class="bg-transparent text-white text-sm border-none outline-none cursor-pointer"
                    :style="{ color: primaryColor }"
                  >
                    <option 
                      v-for="lang in availableLanguages" 
                      :key="lang.language" 
                      :value="lang.language"
                      class="bg-black text-white"
                    >
                      {{ lang.language_display }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="p-8">
                <!-- Welcome Header -->
                <div class="text-center mb-8">
                  <h1 
                    class="text-xl font-medium mb-2" 
                    :style="{ 
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }"
                  >
                    {{ welcomeMessage || 'Welcome to Our Event' }}
                  </h1>
                </div>

                <!-- Host Information -->
                <HostInfo
                  :hosts="hosts"
                  :logo-url="event.logo_one ? getMediaUrl(event.logo_one) : undefined"
                  :event-initial="event.title?.charAt(0) || 'E'"
                  :primary-color="primaryColor"
                  :secondary-color="secondaryColor"
                  :accent-color="accentColor"
                  :current-font="currentFont"
                />

                <!-- Event Information -->
                <EventInfo
                  :date-text="dateText"
                  :time-text="timeText"
                  :location-text="locationText"
                  :has-google-map="!!event.google_map_embed_link"
                  :primary-color="primaryColor"
                  :accent-color="accentColor"
                  @open-map="$emit('openMap')"
                />

                <!-- Agenda Section -->
                <AgendaSection
                  :agenda-items="agendaItems"
                  :primary-color="primaryColor"
                  :secondary-color="secondaryColor"
                  :accent-color="accentColor"
                />

                <!-- Map Section -->
                <div v-if="event.google_map_embed_link" class="mb-6">
                  <h2 
                    class="text-xl font-semibold mb-4" 
                    :style="{ 
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }"
                  >
                    Location
                  </h2>
                  <div class="glass-section p-2 rounded-xl">
                    <iframe
                      :src="event.google_map_embed_link"
                      width="100%"
                      height="200"
                      style="border:0; border-radius: 0.75rem;"
                      :allowfullscreen="false"
                      loading="lazy"
                      referrerpolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>

                <!-- Photo Gallery Section -->
                <PhotoGallery
                  :photos="eventPhotos"
                  :show-all="showAllPhotos"
                  :primary-color="primaryColor"
                  :secondary-color="secondaryColor"
                  :accent-color="accentColor"
                  :get-media-url="getMediaUrl"
                  @open-photo="$emit('openPhoto', $event)"
                  @toggle-show-all="$emit('togglePhotos')"
                />

                <!-- Registration Button -->
                <div v-if="event.registration_required && !isEventPast" class="mb-6">
                  <button
                    @click="$emit('register')"
                    class="w-full py-3 rounded-xl font-semibold text-white transform hover:scale-[1.02] transition-all shadow-lg"
                    :style="{ 
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` 
                    }"
                  >
                    Register Now
                  </button>
                </div>

                <!-- Footer Section -->
                <div class="mt-8 pt-6 border-t border-white/10">
                  <div class="text-center space-y-4">
                    <!-- Thank You Message -->
                    <p 
                      class="text-sm font-medium" 
                      :style="{ 
                        background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }"
                    >
                      Thank you
                    </p>
                    
                    <!-- GoEvent Logo/Branding -->
                    <div class="flex items-center justify-center gap-2">
                      <span 
                        class="text-lg font-bold" 
                        :style="{ 
                          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }"
                      >
                        GoEvent
                      </span>
                    </div>
                    
                    <!-- Contact Info -->
                    <div class="space-y-1">
                      <p class="text-xs" :style="{ color: primaryColor, opacity: '0.7' }">
                        Contact us: info@goevent.com
                      </p>
                      <p class="text-xs" :style="{ color: primaryColor, opacity: '0.7' }">
                        www.goevent.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HostInfo from './HostInfo.vue'
import EventInfo from './EventInfo.vue'
import AgendaSection from './AgendaSection.vue'
import PhotoGallery from './PhotoGallery.vue'
import type { EventData, EventText, Host, AgendaItem, EventPhoto } from '../../composables/useEventShowcase'

interface TemplateAssets {
  standard_background_video?: string
}

interface Props {
  templateAssets?: TemplateAssets | null
  event: EventData
  eventTexts: EventText[]
  hosts: Host[]
  agendaItems: AgendaItem[]
  eventPhotos: EventPhoto[]
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  currentFont: string
  isEventPast: boolean
  showAllPhotos: boolean
  getMediaUrl: (url: string) => string
  availableLanguages?: Array<{ id: number; language: string; language_display: string }>
  currentLanguage?: string
}

const props = defineProps<Props>()

defineEmits<{
  openMap: []
  openPhoto: [EventPhoto]
  register: []
  togglePhotos: []
  changeLanguage: [string]
}>()

const welcomeMessage = computed(() => 
  props.eventTexts.find(text => text.text_type === 'welcome_message')?.content
)

const dateText = computed(() => 
  props.eventTexts.find(text => text.text_type === 'date_text')?.content
)

const timeText = computed(() => 
  props.eventTexts.find(text => text.text_type === 'time_text')?.content
)

const locationText = computed(() => 
  props.eventTexts.find(text => text.text_type === 'location_text')?.content
)
</script>

<style scoped>
/* Animations */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(100px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideUp {
  animation: slideUp 0.8s ease-out forwards;
}

/* Liquid Glass Card Styles */
.liquid-glass-card {
  position: relative;
  border-radius: 1.5rem;
  overflow: hidden;
  width: calc(100vw - 60px);
  height: calc(100vh - 60px);
  max-width: calc(100vw - 60px);
  max-height: calc(100vh - 60px);
}

.glass-background {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.18) 50%,
    rgba(255, 255, 255, 0.25) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.glass-background::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 70%
  );
  animation: liquid-rotate 30s linear infinite;
}

@keyframes liquid-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.glass-section {
  background: rgba(255, 255, 255, 0.20);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Custom Scrollbar - Hidden */
.custom-scrollbar::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: transparent;
}

/* For Firefox */
.custom-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
</style>