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
                <div class="text-center py-6 laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8">
                  <h1
                    class="welcome-header gleam-animation leading-relaxed py-2 text-lg sm:text-xl md:text-2xl font-semibold sm:mb-4 md:mb-6 uppercase"
                    :style="{
                      fontFamily: primaryFont || currentFont,
                      background: `linear-gradient(45deg, ${primaryColor} 0%, ${secondaryColor || accentColor} 50%, ${primaryColor} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      backgroundSize: '200% 200%',
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

                <!-- Host Info Divider -->
                <WeddingSectionDivider
                  :primary-color="primaryColor"
                />

                <!-- Event Information -->
                <div class="mb-6 sm:mb-8 laptop-sm:mb-8 laptop-md:mb-10 laptop-lg:mb-12 desktop:mb-10">
                  <EventInfo
                    :description-title="descriptionTitle"
                    :description-text="descriptionText"
                    :date-text="dateText"
                    :time-text="timeText"
                    :location-text="locationText"
                    :has-google-map="!!event.google_map_embed_link"
                    :primary-color="primaryColor"
                    :secondary-color="secondaryColor"
                    :accent-color="accentColor"
                    :current-font="currentFont"
                    :primary-font="primaryFont"
                    :secondary-font="secondaryFont"
                    @open-map="$emit('openMap')"
                  />

                  <!-- Event Info Divider -->
                  <WeddingSectionDivider
                    :primary-color="primaryColor"
                  />
                </div>

                <!-- RSVP Section -->
                <div id="rsvp-section" class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12">
                  <RSVPSection
                  :event-id="event.id"
                  :event-start-date="event.start_date"
                  :event-end-date="event.end_date"
                  :primary-color="primaryColor"
                  :secondary-color="secondaryColor"
                  :accent-color="accentColor"
                  :is-event-past="isEventPast"
                  :event-texts="eventTexts"
                  :current-language="currentLanguage"
                  :current-font="currentFont"
                  :primary-font="primaryFont"
                  :secondary-font="secondaryFont"
                  />

                  <!-- RSVP Section Divider -->
                  <WeddingSectionDivider
                    :primary-color="primaryColor"
                  />
                </div>

                <!-- Agenda Section -->
                <div id="agenda-section" class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12">
                  <AgendaSection
                  :agenda-items="agendaItems"
                  :primary-color="primaryColor"
                  :secondary-color="secondaryColor"
                  :accent-color="accentColor"
                  :event-texts="eventTexts"
                  :current-language="currentLanguage"
                  :current-font="currentFont"
                  :primary-font="primaryFont"
                  :secondary-font="secondaryFont"
                  />

                  <!-- Agenda Section Divider -->
                  <WeddingSectionDivider
                    :primary-color="primaryColor"
                  />
                </div>

                <!-- Map Section -->
                <div id="location-section" class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12">
                <div v-if="event.google_map_embed_link" class="mb-6">
                  <!-- Location Header -->
                  <div class="text-center laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8">
                    <h2
                      class="leading-relaxed py-2 text-lg sm:text-xl md:text-2xl font-semibold sm:mb-4 md:mb-6 uppercase"
                      :style="{
                        fontFamily: primaryFont || currentFont,
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }"
                    >
                      {{ locationHeaderText }}
                    </h2>
                  </div>
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

                  <!-- Location Section Divider -->
                  <WeddingSectionDivider
                    :primary-color="primaryColor"
                  />
                </div>
                </div>

                <!-- YouTube Video Section -->
                <div id="video-section" class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12">
                  <YouTubeVideoSection
                  :youtube-embed-link="event.youtube_embed_link"
                  :primary-color="primaryColor"
                  :secondary-color="secondaryColor"
                  :accent-color="accentColor"
                  :current-font="currentFont"
                  :primary-font="primaryFont"
                  :secondary-font="secondaryFont"
                  :event-texts="eventTexts"
                  :current-language="currentLanguage"
                  />

                  <!-- Video Section Divider -->
                  <WeddingSectionDivider
                    :primary-color="primaryColor"
                  />
                </div>

                <!-- Photo Gallery Section -->
                <div id="gallery-section" class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12">
                  <PhotoGallery
                  :photos="eventPhotos"
                  :primary-color="primaryColor"
                  :secondary-color="secondaryColor"
                  :accent-color="accentColor"
                  :get-media-url="getMediaUrl"
                  :current-font="currentFont"
                  :primary-font="primaryFont"
                  :secondary-font="secondaryFont"
                  :event-texts="eventTexts"
                  :current-language="currentLanguage"
                  @open-photo="$emit('openPhoto', $event)"
                  />

                  <!-- Gallery Section Divider -->
                  <WeddingSectionDivider
                    :primary-color="primaryColor"
                  />
                </div>

                <!-- Payment Section -->
                <div v-if="paymentMethods.length > 0" id="payment-section" class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12">
                  <PaymentSection
                    :payment-methods="paymentMethods"
                    :primary-color="primaryColor"
                    :secondary-color="secondaryColor"
                    :accent-color="accentColor"
                    :current-font="currentFont"
                    :primary-font="primaryFont || currentFont"
                    :secondary-font="secondaryFont || currentFont"
                    :get-media-url="getMediaUrl"
                    :event-category="(event as any).category"
                    :event-texts="eventTexts"
                    :current-language="currentLanguage"
                  />

                  <!-- Payment Section Divider -->
                  <WeddingSectionDivider
                    :primary-color="primaryColor"
                  />
                </div>

                <!-- Comment Section -->
                <div id="comment-section" class="mb-10 sm:mb-12 laptop-sm:mb-12 laptop-md:mb-14 laptop-lg:mb-16 desktop:mb-14">
                  <CommentSection
                  :event-id="event.id"
                  :guest-name="guestName as string"
                  :primary-color="primaryColor"
                  :secondary-color="secondaryColor"
                  :accent-color="accentColor"
                  :current-font="currentFont"
                  :primary-font="primaryFont"
                  :secondary-font="secondaryFont"
                  :event-texts="eventTexts"
                  :current-language="currentLanguage"
                  @comment-submitted="handleCommentSubmitted"
                  />

                  <!-- Comment Section Divider -->
                  <WeddingSectionDivider
                    :primary-color="primaryColor"
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
                <div class="mt-8 -mx-6 sm:-mx-6 md:-mx-6 laptop-sm:-mx-8 laptop-md:-mx-10 laptop-lg:-mx-12 desktop:-mx-8 -mb-6 sm:-mb-6 md:-mb-6 laptop-sm:-mb-8 laptop-md:-mb-10 laptop-lg:-mb-12 desktop:-mb-8">
                  <!-- Footer Card with Reverse Colors -->
                  <div
                    class="footer-card-container rounded-none sm:rounded-t-2xl px-6 pt-6 pb-4 text-center backdrop-blur-16 transition-all duration-300 relative overflow-hidden"
                    :style="{
                      background: `linear-gradient(135deg, ${primaryColor}90, ${primaryColor}70)`,
                      boxShadow: `
                        0 12px 36px -6px ${primaryColor}25,
                        0 6px 24px -3px ${primaryColor}20,
                        0 3px 12px -1px ${primaryColor}15,
                        inset 0 1px 2px rgba(255, 255, 255, 0.2)
                      `
                    }"
                  >
                    <!-- Top Highlight Line -->
                    <div
                      class="absolute top-0 left-0 right-0 h-px"
                      :style="{
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent)'
                      }"
                    ></div>

                    <div class="space-y-4">
                      <!-- Thank You Message -->
                      <p
                        class="text-small text-white"
                        :style="{ fontFamily: primaryFont || currentFont }"
                      >
                        {{ footerThankYouText }}
                      </p>

                      <!-- GoEvent Logo/Branding -->
                      <div class="space-y-2">
                        <div class="inline-flex items-center justify-center">
                          <span
                            class="text-6xl font-bold text-white"
                            :style="{ fontFamily: primaryFont || currentFont }"
                          >
                            GoEvent
                          </span>
                        </div>
                        <p class="text-xs text-white opacity-90" :style="{ fontFamily: secondaryFont || currentFont }">
                          {{ footerCreateInvitationsText }}
                        </p>
                      </div>

                      <!-- Contact Info -->
                      <div class="space-y-2">
                        <div
                          class="inline-flex items-center justify-center text-sm text-white px-2"
                          :style="{
                            fontFamily: secondaryFont || currentFont
                          }"
                        >
                          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                          </svg>
                          info@goevent.com
                        </div>
                        <div
                          class="inline-flex items-center justify-center text-sm text-white px-2"
                          :style="{
                            fontFamily: secondaryFont || currentFont
                          }"
                        >
                          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"/>
                          </svg>
                          www.goevent.com
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
import PaymentSection from './PaymentSection.vue'
import FloatingActionMenu from './FloatingActionMenu.vue'
import WeddingSectionDivider from './WeddingSectionDivider.vue'
import type { EventData, EventText, Host, AgendaItem, EventPhoto, EventComment } from '../../composables/useEventShowcase'
import type { EventPaymentMethod } from '../../services/api'
import {
  translateRSVP,
  type SupportedLanguage
} from '../../utils/translations'

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
  paymentMethods: EventPaymentMethod[]
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  isEventPast: boolean
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
  changeLanguage: [string]
  commentSubmitted: [EventComment]
  musicToggle: []
}>()

// Enhanced translation function that combines database content with frontend translations
const getTextContent = (textType: string, fallback = ''): string => {
  // First, try to get content from database (eventTexts)
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(text =>
      text.text_type === textType && text.language === props.currentLanguage
    )
    if (text?.content) {
      return text.content
    }
  }

  // Fallback to frontend translation system
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'

  // Map text types to translation keys
  const keyMap: Record<string, keyof typeof import('../../utils/translations').rsvpTranslations.en> = {
    'location_header': 'location_header',
    'video_header': 'video_header',
    'gallery_header': 'gallery_header',
    'comment_header': 'comment_header',
    'comment_placeholder': 'comment_placeholder',
    'comment_signin_prompt': 'comment_signin_prompt',
    'comment_signin_button': 'comment_signin_button',
    'comment_post_button': 'comment_post_button',
    'comment_posting_button': 'comment_posting_button',
    'comment_no_comments': 'comment_no_comments',
    'comment_loading': 'comment_loading',
    'comment_already_commented': 'comment_already_commented',
    'comment_one_per_user': 'comment_one_per_user',
    'comment_you_badge': 'comment_you_badge',
    'payment_wedding_gift': 'payment_wedding_gift',
    'payment_birthday_gift': 'payment_birthday_gift',
    'footer_thank_you': 'footer_thank_you',
    'footer_create_invitations': 'footer_create_invitations'
  }

  const translationKey = keyMap[textType]
  if (translationKey) {
    return translateRSVP(translationKey, currentLang)
  }

  return fallback
}

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

const descriptionText = computed(() =>
  props.eventTexts.find(text => text.text_type === 'description')?.content
)

const descriptionTitle = computed(() =>
  props.eventTexts.find(text => text.text_type === 'description')?.title
)

const locationHeaderText = computed(() =>
  getTextContent('location_header', 'Location')
)

const footerThankYouText = computed(() =>
  getTextContent('footer_thank_you', 'Thank you for celebrating with us')
)

const footerCreateInvitationsText = computed(() =>
  getTextContent('footer_create_invitations', 'Create beautiful event invitations')
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
  console.log('Gift functionality not implemented')
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

/* Gleam Animation Styles - Reusable */
.gleam-animation {
  animation: gradientShift 5s ease-in-out infinite;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

</style>
