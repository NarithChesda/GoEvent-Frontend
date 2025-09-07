<template>
  <div class="absolute inset-0 z-10">
    <!-- Background Video or Fallback -->
    <component
      :is="backgroundVideoComponent"
      v-bind="backgroundVideoProps"
      class="absolute inset-0 w-full h-full object-cover"
    />

    <!-- Floating Action Menu -->
    <FloatingActionMenu
      class="z-30"
      :primary-color="primaryColor"
      :accent-color="accentColor"
      :current-language="currentLanguage"
      :available-languages="availableLanguages"
      :is-music-playing="isMusicPlaying"
      :is-authenticated="isAuthenticated"
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
      @logout="handleLogout"
    />

    <!-- Liquid Glass Floating Box Container -->
    <div class="absolute inset-0 overflow-hidden z-20">
      <div class="absolute inset-0 overflow-y-auto custom-scrollbar z-20">
        <div :class="containerClasses">
          <!-- Liquid Glass Card -->
          <div class="liquid-glass-card animate-slideUp">
            <!-- Glass Background Effects -->
            <div class="glass-background"></div>

            <!-- Content Container with Scroll -->
            <div class="relative z-10 h-full overflow-y-auto custom-scrollbar">
              <div class="p-6 sm:p-6 md:p-6 laptop-sm:p-8 laptop-md:p-10 laptop-lg:p-12 desktop:p-8">
                <!-- Welcome Header -->
                <div 
                  ref="welcomeHeaderRef"
                  class="text-center py-6 laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8 animate-reveal"
                >
                  <h1
                    class="welcome-header gleam-animation leading-relaxed py-2 text-lg sm:text-xl md:text-2xl font-semibold sm:mb-4 md:mb-6 uppercase"
                    :style="{
                      fontFamily: primaryFont || currentFont,
                      background: `linear-gradient(45deg, ${primaryColor} 0%, ${secondaryColor || accentColor} 50%, ${primaryColor} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      backgroundSize: '200% 200%'
                    }"
                  >
                    {{ welcomeMessage || 'Welcome to Our Event' }}
                  </h1>
                </div>

                <!-- Host Information -->
                <div ref="hostInfoRef" class="animate-reveal">
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
                </div>

                <!-- Host Info Divider -->
                <WeddingSectionDivider
                  :primary-color="primaryColor"
                />

                <!-- Event Information -->
                <div 
                  ref="eventInfoRef"
                  class="mb-6 sm:mb-8 laptop-sm:mb-8 laptop-md:mb-10 laptop-lg:mb-12 desktop:mb-10 animate-reveal"
                >
                  <EventInfo
                    :description-title="descriptionTitle"
                    :description-text="descriptionText"
                    :date-text="dateText"
                    :time-text="timeText"
                    :location-text="locationText"
                    :has-google-map="!!event.google_map_embed_link"
                    :primary-color="primaryColor"
                    :secondary-color="secondaryColor || undefined"
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
                <div 
                  id="rsvp-section" 
                  ref="rsvpSectionRef"
                  class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12 animate-reveal"
                >
                  <RSVPSection
                  :event-id="event.id"
                  :event-start-date="event.start_date"
                  :event-end-date="event.end_date"
                  :primary-color="primaryColor"
                  :secondary-color="secondaryColor"
                  @show-auth-modal="$emit('showAuthModal')"
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
                <div 
                  id="agenda-section" 
                  ref="agendaSectionRef"
                  class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12 animate-reveal"
                >
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
                <div 
                  id="location-section" 
                  ref="locationSectionRef"
                  class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12 animate-reveal"
                >
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
                <div 
                  id="video-section" 
                  ref="videoSectionRef"
                  class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12 animate-reveal"
                >
                  <YouTubeVideoSection
                  :youtube-embed-link="event.youtube_embed_link"
                  :primary-color="primaryColor"
                  :secondary-color="secondaryColor || undefined"
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
                <div 
                  id="gallery-section" 
                  ref="gallerySectionRef"
                  class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12 animate-reveal"
                >
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
                <div 
                  v-if="paymentMethods.length > 0" 
                  id="payment-section" 
                  ref="paymentSectionRef"
                  class="mb-8 sm:mb-10 laptop-sm:mb-10 laptop-md:mb-12 laptop-lg:mb-14 desktop:mb-12 animate-reveal"
                >
                  <PaymentSection
                    :payment-methods="paymentMethods"
                    :primary-color="primaryColor"
                    :secondary-color="secondaryColor || undefined"
                    :accent-color="accentColor"
                    :current-font="currentFont"
                    :primary-font="primaryFont || currentFont"
                    :secondary-font="secondaryFont || currentFont"
                    :get-media-url="getMediaUrl"
                    :event-category="event.category"
                    :event-category-name="event.category_name || undefined"
                    :event-category-details="event.category_details"
                    :event-texts="eventTexts"
                    :current-language="currentLanguage"
                  />

                  <!-- Payment Section Divider -->
                  <WeddingSectionDivider
                    :primary-color="primaryColor"
                  />
                </div>

                <!-- Comment Section -->
                <div 
                  id="comment-section" 
                  ref="commentSectionRef"
                  class="mb-10 sm:mb-12 laptop-sm:mb-12 laptop-md:mb-14 laptop-lg:mb-16 desktop:mb-14 animate-reveal"
                >
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
                  @comment-submitted="(comment: any) => handleCommentSubmitted(comment)"
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
                <div 
                  ref="footerSectionRef"
                  class="mt-8 -mx-6 sm:-mx-6 md:-mx-6 laptop-sm:-mx-8 laptop-md:-mx-10 laptop-lg:-mx-12 desktop:-mx-8 -mb-6 sm:-mb-6 md:-mb-6 laptop-sm:-mb-8 laptop-md:-mb-10 laptop-lg:-mb-12 desktop:-mb-8 animate-reveal"
                >
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
import { computed, onMounted, onUnmounted, ref, nextTick, inject, type Component } from 'vue'
import type { EventData, EventText, Host, AgendaItem, EventPhoto } from '../../composables/useEventShowcase'
import type { EventComment } from '../../types/showcase'
import type { EventPaymentMethod } from '../../services/api'
import type { SupportedLanguage } from '../../utils/translations'
import { useRevealAnimations, ANIMATION_CONSTANTS } from '../../composables/useScrollAnimations'
import { useScrollDrivenAnimations } from '../../composables/useAdvancedAnimations'
import { translateRSVP } from '../../utils/translations'

// Component imports
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

// Types
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
  isAuthenticated?: boolean
}

const props = defineProps<Props>()

// Computed properties for dynamic styling and components
const containerClasses = computed(() => [
  'min-h-full',
  'py-10 sm:py-6 sm:px-4',
  'md:py-8 md:px-6',
  'laptop-sm:py-6 laptop-sm:px-8',
  'laptop-md:py-8 laptop-md:px-10',
  'laptop-lg:py-10 laptop-lg:px-12',
  'desktop:py-12 desktop:px-12',
  'flex items-center justify-center'
])

const existingBackgroundVideo = ref<HTMLVideoElement | null>(null)

// Inject video resource manager from parent showcase using Vue's provide/inject
// Must be called at top level of setup, not inside lifecycle hooks
const injectedVideoResourceManager = inject<any>('videoResourceManager')

// Security validation function for video elements
const validateVideoElement = (element: HTMLVideoElement): boolean => {
  if (!element || !(element instanceof HTMLVideoElement)) return false
  
  // Check if element is attached to document
  if (!document.contains(element)) return false
  
  // Validate src attribute is from trusted domain
  const src = element.src || element.getAttribute('src') || ''
  if (!src) return true // Allow empty src for cleanup
  
  try {
    const url = new URL(src)
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
    const allowedOrigins = [
      new URL(API_BASE_URL).origin,
      window.location.origin
    ]
    
    // Allow data URLs for embedded content
    if (url.protocol === 'data:') {
      return url.href.startsWith('data:video/')
    }
    
    return allowedOrigins.includes(url.origin)
  } catch {
    return false
  }
}
const videoResourceManager = ref<{
  cleanup: () => void
  stats: () => { managedVideos: number; totalListeners: number }
} | null>(null)

const backgroundVideoComponent = computed((): Component | string => {
  // Use div as the background video is handled by CoverStage
  return 'div'
})

const backgroundVideoProps = computed(() => ({
  class: 'bg-transparent'
}))

// Simplified mounting - no video management needed
onMounted(async () => {
  await nextTick()
  
  // Use the injected video resource manager for other operations if needed
  if (injectedVideoResourceManager) {
    videoResourceManager.value = injectedVideoResourceManager
  }
})

const emit = defineEmits<{
  openMap: []
  openPhoto: [EventPhoto]
  register: []
  changeLanguage: [string]
  commentSubmitted: [EventComment]
  musicToggle: []
  logout: []
  mainContentViewed: []
  showAuthModal: []
}>()

// Animation setup
const REVEAL_ANIMATION_CONFIG = {
  animationType: 'slideUp' as const,
  duration: ANIMATION_CONSTANTS.DURATION.NORMAL,
  easing: ANIMATION_CONSTANTS.EASING.EXPO,
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
}

const { observeRevealElement } = useRevealAnimations(REVEAL_ANIMATION_CONFIG)
const { createScrollAnimation } = useScrollDrivenAnimations()

// Template refs for animated sections
const sectionRefs = {
  welcomeHeader: ref<HTMLElement>(),
  hostInfo: ref<HTMLElement>(),
  eventInfo: ref<HTMLElement>(),
  rsvpSection: ref<HTMLElement>(),
  agendaSection: ref<HTMLElement>(),
  locationSection: ref<HTMLElement>(),
  videoSection: ref<HTMLElement>(),
  gallerySection: ref<HTMLElement>(),
  paymentSection: ref<HTMLElement>(),
  commentSection: ref<HTMLElement>(),
  footerSection: ref<HTMLElement>()
}

// Extract individual refs for template usage
const {
  welcomeHeader: welcomeHeaderRef,
  hostInfo: hostInfoRef,
  eventInfo: eventInfoRef,
  rsvpSection: rsvpSectionRef,
  agendaSection: agendaSectionRef,
  locationSection: locationSectionRef,
  videoSection: videoSectionRef,
  gallerySection: gallerySectionRef,
  paymentSection: paymentSectionRef,
  commentSection: commentSectionRef,
  footerSection: footerSectionRef
} = sectionRefs

/**
 * Initialize reveal animations
 */
const initializeRevealAnimations = () => {
  const animationConfig: Array<[any, string]> = [
    [welcomeHeaderRef, 'welcome-header'],
    [hostInfoRef, 'host-info'],
    [eventInfoRef, 'event-info'],
    [rsvpSectionRef, 'rsvp-section'],
    [agendaSectionRef, 'agenda-section'],
    [locationSectionRef, 'location-section'],
    [videoSectionRef, 'video-section'],
    [gallerySectionRef, 'gallery-section'],
    [paymentSectionRef, 'payment-section'],
    [commentSectionRef, 'comment-section'],
    [footerSectionRef, 'footer-section']
  ]

  animationConfig.forEach(([elementRef, elementId]) => {
    if (elementRef.value) {
      observeRevealElement(elementRef.value, elementId)
    }
  })
}

/**
 * Initialize scroll animations
 */
const initializeScrollAnimations = () => {
  const liquidGlassCard = document.querySelector('.liquid-glass-card')
  if (liquidGlassCard) {
    createScrollAnimation(
      liquidGlassCard,
      [
        { transform: 'translateY(0px)' },
        { transform: 'translateY(-20px)' }
      ],
      {
        duration: 1000,
        easing: 'ease-out'
      }
    )
  }
}

// Setup animations on mount
onMounted(() => {
  nextTick(() => {
    initializeRevealAnimations()
    initializeScrollAnimations()
    
    // Emit that main content has been viewed
    emit('mainContentViewed')
  })
})

// Translation key mapping for consistent lookups
const TRANSLATION_KEY_MAP: Record<string, keyof typeof import('../../utils/translations').rsvpTranslations.en> = {
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
} as const

/**
 * Get text content from database or frontend translations
 * @param textType - The type of text to retrieve
 * @param fallback - Fallback text if no translation found
 * @returns Translated text content
 */
const getTextContent = (textType: string, fallback = ''): string => {
  // First, try to get content from database (eventTexts)
  if (props.eventTexts?.length && props.currentLanguage) {
    const text = props.eventTexts.find(text =>
      text.text_type === textType && text.language === props.currentLanguage
    )
    if (text?.content) {
      return text.content
    }
  }

  // Fallback to frontend translation system
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  const translationKey = TRANSLATION_KEY_MAP[textType]
  
  return translationKey ? translateRSVP(translationKey, currentLang) : fallback
}

/**
 * Find event text by type
 */
const findEventText = (textType: string) => 
  props.eventTexts?.find(text => text.text_type === textType)

// Computed properties for event text content
const welcomeMessage = computed(() => findEventText('welcome_message')?.content)
const dateText = computed(() => findEventText('date_text')?.content)
const timeText = computed(() => findEventText('time_text')?.content)
const locationText = computed(() => findEventText('location_text')?.content)
const descriptionText = computed(() => findEventText('description')?.content)
const descriptionTitle = computed(() => findEventText('description')?.title)

// Computed properties for translated text
const locationHeaderText = computed(() => 
  getTextContent('location_header', 'Location')
)
const footerThankYouText = computed(() => 
  getTextContent('footer_thank_you', 'Thank you for celebrating with us')
)
const footerCreateInvitationsText = computed(() => 
  getTextContent('footer_create_invitations', 'Create beautiful event invitations')
)

/**
 * Smooth scroll to section by ID
 */
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// Floating Action Menu Handlers
const handleLanguageChange = (language: string) => emit('changeLanguage', language)
const handleMusicToggle = () => emit('musicToggle')
const handleLogout = () => emit('logout')
const handleCommentSubmitted = (comment: EventComment) => emit('commentSubmitted', comment)

// Section navigation handlers
const handleRSVP = () => scrollToSection('rsvp-section')
const handleGift = () => scrollToSection('payment-section')
const handleAgenda = () => scrollToSection('agenda-section')
const handleLocation = () => scrollToSection('location-section')
const handleGallery = () => scrollToSection('gallery-section')
const handleComment = () => scrollToSection('comment-section')
const handleVideo = () => scrollToSection('video-section')

const handleReminder = () => {
  // TODO: Implement reminder functionality when needed
}
// Cleanup on component unmount
onUnmounted(() => {
  // Clear local references
  existingBackgroundVideo.value = null
  videoResourceManager.value = null
})
</script>

<style scoped>
/* ===================
   ANIMATIONS
   =================== */

/* Slide up animation for main card */
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

/* Liquid glass rotation animation */
@keyframes liquid-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Gleam animation for text effects */
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

/* ===================
   LAYOUT COMPONENTS
   =================== */

/* Main slide animation */
.animate-slideUp {
  animation: slideUp 0.8s ease-out forwards;
}

/* Liquid Glass Card - Consolidated styles */
.liquid-glass-card {
  position: relative;
  border-radius: 1.5rem;
  overflow: hidden;
  width: 85vw;
  height: 85vh;
  max-width: 85vw;
  max-height: 85vh;
  will-change: transform;
  transition: transform 0.3s ease-out;
}

.liquid-glass-card:hover {
  transform: translateY(-2px);
}

/* Glass background with optimized containment */
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
  contain: layout style paint;
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
  contain: layout style paint;
}

/* ===================
   UTILITY CLASSES
   =================== */

/* Gleam animation for headers */
.gleam-animation {
  animation: gradientShift 3s ease-in-out infinite;
}

/* Hidden scrollbar styles */
.custom-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

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

/* ===================
   REVEAL ANIMATIONS
   =================== */

/* Base reveal animation styles */
.animate-reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: 
    opacity 0.6s cubic-bezier(0.19, 1, 0.22, 1),
    transform 0.6s cubic-bezier(0.19, 1, 0.22, 1);
  will-change: opacity, transform;
}

.animate-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* ===================
   RESPONSIVE DESIGN
   =================== */

/* Mobile-specific reveal animation adjustments */
@media (max-width: 640px) {
  .animate-reveal {
    transform: translateY(20px);
  }
}

/* ===================
   ACCESSIBILITY
   =================== */

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animate-reveal {
    transition: opacity 0.3s ease;
    transform: none !important;
  }
  
  .animate-slideUp {
    animation: none;
  }
  
  .gleam-animation {
    animation: none;
  }
  
  .glass-background::before {
    animation: none;
  }
}

</style>
