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

    <!-- Floating Action Menu -->
    <FloatingActionMenu
      :primary-color="primaryColor"
      :accent-color="accentColor"
      :current-language="currentLanguage"
      :available-languages="availableLanguages"
      :is-music-playing="isMusicPlaying"
      @language-change="handleLanguageChange"
      @music-toggle="handleMusicToggle"
      @rsvp="handleRSVP"
      @reminder="handleReminder"
      @gift="handleGift"
      @agenda="handleAgenda"
      @location="handleLocation"
      @video="handleVideo"
      @gallery="handleGallery"
      @comment="handleComment"
    />

    <!-- Liquid Glass Floating Box Container -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute inset-0 overflow-y-auto custom-scrollbar">
        <div class="min-h-full py-10 sm:py-6 sm:px-4 md:py-8 md:px-6 laptop-sm:py-6 laptop-sm:px-8 laptop-md:py-8 laptop-md:px-10 laptop-lg:py-10 laptop-lg:px-12 desktop:py-12 desktop:px-12 flex items-center justify-center">
          <!-- Liquid Glass Card -->
          <div class="liquid-glass-card animate-slideUp">
            <!-- Glass Background Effects -->
            <div class="glass-background"></div>

            <!-- Content Container with Scroll -->
            <div class="relative z-10 h-full overflow-y-auto custom-scrollbar">
              <div class="p-6 sm:p-6 md:p-6 laptop-sm:p-8 laptop-md:p-10 laptop-lg:p-12 desktop:p-8">
                <!-- Welcome Header -->
                <div class="text-center mb-4 sm:mb-6 laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8">
                  <h1
                    class="text-lg sm:text-xl md:text-2xl font-medium mb-3 sm:mb-4 md:mb-6 uppercase"
                    :style="{
                      fontFamily: primaryFont || currentFont,
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
                  :primary-font="primaryFont"
                  :secondary-font="secondaryFont"
                />

                <!-- Event Information -->
                <div class="mb-4 sm:mb-6 laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8">
                  <EventInfo
                    :date-text="dateText"
                    :time-text="timeText"
                    :location-text="locationText"
                    :has-google-map="!!event.google_map_embed_link"
                    :primary-color="primaryColor"
                    :accent-color="accentColor"
                    @open-map="$emit('openMap')"
                  />

                  <!-- Event Info Endline -->
                  <div class="flex justify-center mt-4">
                    <div class="w-16 h-px opacity-30" :style="{ backgroundColor: primaryColor }"></div>
                  </div>
                </div>

                <!-- RSVP Section -->
                <div id="rsvp-section">
                  <RSVPSection
                  :event-id="event.id"
                  :event-start-date="event.start_date"
                  :event-end-date="event.end_date"
                  :primary-color="primaryColor"
                  :secondary-color="secondaryColor"
                  :accent-color="accentColor"
                  :is-event-past="isEventPast"
                  />
                </div>

                <!-- Agenda Section -->
                <div id="agenda-section">
                  <AgendaSection
                  :agenda-items="agendaItems"
                  :primary-color="primaryColor"
                  :secondary-color="secondaryColor"
                  :accent-color="accentColor"
                  />
                </div>

                <!-- Map Section -->
                <div id="location-section">
                <div v-if="event.google_map_embed_link" class="mb-8">
                  <h2
                    class="text-xl font-semibold mb-4 text-center"
                    :style="{
                      fontFamily: primaryFont || currentFont,
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }"
                  >
                    Location
                  </h2>
                  <div class="aspect-video rounded-xl overflow-hidden">
                    <iframe
                      :src="event.google_map_embed_link"
                      width="100%"
                      height="100%"
                      style="border:0;"
                      :allowfullscreen="false"
                      loading="lazy"
                      referrerpolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <!-- Location Section Endline -->
                  <div class="flex justify-center mt-6">
                    <div class="w-16 h-px opacity-30" :style="{ backgroundColor: primaryColor }"></div>
                  </div>
                </div>
                </div>

                <!-- YouTube Video Section -->
                <div id="video-section">
                  <YouTubeVideoSection
                  :youtube-embed-link="event.youtube_embed_link"
                  :primary-color="primaryColor"
                  :secondary-color="secondaryColor"
                  :accent-color="accentColor"
                  />
                </div>

                <!-- Photo Gallery Section -->
                <div id="gallery-section">
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
                </div>

                <!-- Comment Section -->
                <div id="comment-section">
                  <CommentSection
                  :event-id="event.id"
                  :guest-name="guestName as string"
                  :primary-color="primaryColor"
                  :secondary-color="secondaryColor"
                  :accent-color="accentColor"
                  @comment-submitted="handleCommentSubmitted"
                  />
                </div>

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
import RSVPSection from './RSVPSection.vue'
import AgendaSection from './AgendaSection.vue'
import YouTubeVideoSection from './YouTubeVideoSection.vue'
import PhotoGallery from './PhotoGallery.vue'
import CommentSection from './CommentSection.vue'
import FloatingActionMenu from './FloatingActionMenu.vue'
import type { EventData, EventText, Host, AgendaItem, EventPhoto, EventComment } from '../../composables/useEventShowcase'

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
  primaryFont?: string
  secondaryFont?: string
  isEventPast: boolean
  showAllPhotos: boolean
  getMediaUrl: (url: string) => string
  availableLanguages?: Array<{ id: number; language: string; language_display: string }>
  currentLanguage?: string
  guestName?: string
  isMusicPlaying?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  openMap: []
  openPhoto: [EventPhoto]
  register: []
  togglePhotos: []
  changeLanguage: [string]
  commentSubmitted: [EventComment]
  musicToggle: []
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

// Floating Action Menu Handlers
const handleLanguageChange = (language: string) => {
  emit('changeLanguage', language)
}

const handleMusicToggle = (isPlaying: boolean) => {
  console.log('Music toggle:', isPlaying)
  emit('musicToggle')
}

const handleRSVP = () => {
  console.log('RSVP clicked')
  const rsvpElement = document.getElementById('rsvp-section')
  if (rsvpElement) {
    rsvpElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const handleReminder = () => {
  console.log('Reminder clicked')
  // TODO: Implement reminder functionality
}

const handleGift = () => {
  console.log('Gift clicked')
  // TODO: Implement gift functionality
}

const handleAgenda = () => {
  console.log('Agenda clicked')
  const agendaElement = document.getElementById('agenda-section')
  if (agendaElement) {
    agendaElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const handleLocation = () => {
  console.log('Location clicked')
  const locationElement = document.getElementById('location-section')
  if (locationElement) {
    locationElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const handleGallery = () => {
  console.log('Gallery clicked')
  const galleryElement = document.getElementById('gallery-section')
  if (galleryElement) {
    galleryElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const handleComment = () => {
  console.log('Comment clicked')
  const commentElement = document.getElementById('comment-section')
  if (commentElement) {
    commentElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const handleVideo = () => {
  console.log('Video clicked')
  const videoElement = document.getElementById('video-section')
  if (videoElement) {
    videoElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const handleCommentSubmitted = (comment: EventComment) => {
  console.log('Comment submitted:', comment)
  emit('commentSubmitted', comment)
}
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
  width: 85vw;
  height: 85vh;
  max-width: 85vw;
  max-height: 85vh;
}

/* Small mobile phones only - minimal padding */
@media (max-width: 480px) and (max-height: 800px) {
  .liquid-glass-card {
    width: 85vw;
    height: 85vh;
    max-width: 85vw;
    max-height: 85vh;
  }
}

/* All other devices - consistent desktop padding */
@media (min-width: 481px), (min-height: 801px) {
  .liquid-glass-card {
    width: 85vw;
    height: 85vh;
    max-width: 85vw;
    max-height: 85vh;
  }
}

.glass-background {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.50) 0%,
    rgba(255, 255, 255, 0.39) 50%,
    rgba(255, 255, 255, 0.50) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.61);
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
    rgba(255, 255, 255, 0.11) 0%,
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
  background: rgba(255, 255, 255, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.45);
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

/* Welcome Header styles are now handled by Tailwind responsive classes */
</style>
