<template>
  <div class="absolute inset-0 z-10">
    <!-- Background Video or Fallback -->
    <component
      :is="backgroundVideoComponent"
      v-bind="backgroundVideoProps"
      class="absolute inset-0 w-full h-full object-cover"
    />

    <!-- Content Loading Overlay -->
    <Transition name="fade">
      <div v-if="contentLoading" class="absolute inset-0 z-40 flex items-center justify-center">
        <div
          class="backdrop-blur-sm bg-black bg-opacity-20 rounded-2xl px-6 py-4 flex items-center space-x-3"
          :style="contentLoadingStyle"
        >
          <div
            class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-80"
            :style="{ color: primaryColor }"
          ></div>
          <span
            class="text-white font-medium text-sm"
            :style="{ fontFamily: primaryFont || currentFont }"
          >
            Updating content...
          </span>
        </div>
      </div>
    </Transition>

    <!-- Floating Action Menu -->
    <FloatingActionMenu
      class="z-30"
      :primary-color="primaryColor"
      :accent-color="accentColor"
      :current-language="currentLanguage"
      :available-languages="availableLanguages"
      :is-music-playing="isMusicPlaying"
      :is-authenticated="isAuthenticated"
      :has-location="!!event.google_map_embed_link"
      :has-video="!!event.youtube_embed_link"
      :has-gallery="eventPhotos.length > 0"
      :has-payment="paymentMethods.length > 0"
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
              <div
                class="p-6 sm:p-6 md:p-6 laptop-sm:p-8 laptop-md:p-10 laptop-lg:p-12 desktop:p-8"
              >
                <!-- Host Information (now includes welcome header) -->
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
                    :welcome-message="welcomeMessage"
                    :current-language="currentLanguage"
                  />
                </div>

                <!-- Event Information with Integrated RSVP -->
                <div
                  ref="eventInfoRef"
                  class="mt-6 sm:mt-8 laptop-sm:mt-8 laptop-md:mt-10 laptop-lg:mt-12 desktop:mt-10 mb-6 sm:mb-8 laptop-sm:mb-8 laptop-md:mb-10 laptop-lg:mb-12 desktop:mb-10 animate-reveal"
                >
                  <EventInfo
                    :description-title="descriptionTitle"
                    :description-text="descriptionText"
                    :date-text="dateText"
                    :time-text="timeText"
                    :location-text="locationText"
                    :has-google-map="!!event.google_map_embed_link"
                    :google-map-embed-link="event.google_map_embed_link"
                    :primary-color="primaryColor"
                    :secondary-color="secondaryColor || undefined"
                    :accent-color="accentColor"
                    :current-font="currentFont"
                    :primary-font="primaryFont"
                    :secondary-font="secondaryFont"
                    :current-language="currentLanguage"
                    :show-rsvp="true"
                    @open-map="$emit('openMap')"
                  >
                    <template #rsvp>
                      <div id="rsvp-section" ref="rsvpSectionRef">
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
                      </div>
                    </template>
                  </EventInfo>

                  <!-- Event Info + RSVP Section Divider -->
                  <WeddingSectionDivider :primary-color="primaryColor" />
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
                  <WeddingSectionDivider :primary-color="primaryColor" />
                </div>

                <!-- YouTube Video Section -->
                <div
                  v-if="event.youtube_embed_link"
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
                    :is-music-playing="isMusicPlaying"
                    @video-state-change="handleVideoStateChange"
                  />

                  <!-- Video Section Divider -->
                  <WeddingSectionDivider :primary-color="primaryColor" />
                </div>

                <!-- Photo Gallery Section -->
                <div
                  v-if="eventPhotos.length > 0"
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
                  <WeddingSectionDivider :primary-color="primaryColor" />
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
                  <WeddingSectionDivider :primary-color="primaryColor" />
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
                </div>

                <!-- Registration Button -->
                <div v-if="event.registration_required && !isEventPast" class="mb-6">
                  <button
                    @click="$emit('register')"
                    class="w-full py-3 rounded-xl font-semibold text-white transform hover:scale-[1.02] transition-all shadow-lg"
                    :style="{
                      background: primaryColor,
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
                    class="footer-card-container rounded-none px-6 pt-6 pb-4 text-center backdrop-blur-16 transition-all duration-300 relative overflow-hidden"
                    :style="{
                      background: `${primaryColor}90`,
                      boxShadow: `
                        0 12px 36px -6px ${primaryColor}25,
                        0 6px 24px -3px ${primaryColor}20,
                        0 3px 12px -1px ${primaryColor}15,
                        inset 0 1px 2px rgba(255, 255, 255, 0.2)
                      `,
                    }"
                  >
                    <!-- Top Highlight Line -->
                    <div
                      class="absolute top-0 left-0 right-0 h-px"
                      :style="{
                        background:
                          'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent)',
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

                      <!-- Logo Section with Collaboration Display -->
                      <div class="space-y-3">
                        <!-- Show collaboration if referrer exists and is partner -->
                        <div v-if="event.referrer_details?.is_partner && event.referrer_details?.logo">
                          <!-- Logos Container with increased vertical spacing -->
                          <div class="flex items-center justify-center gap-3 sm:gap-6 py-2">
                            <!-- Referrer Logo -->
                            <div class="transition-transform hover:scale-105 flex-shrink-0 max-w-[40%]">
                              <img
                                :src="getMediaUrl(event.referrer_details.logo)"
                                :alt="event.referrer_details.first_name || 'Partner'"
                                class="w-full h-auto object-contain brightness-110"
                                :style="{
                                  height: 'min(5vh, 60px)',
                                  maxHeight: '60px',
                                  maxWidth: '100%',
                                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))'
                                }"
                              />
                            </div>

                            <!-- Divider with "×" symbol -->
                            <div class="flex items-center justify-center opacity-60 flex-shrink-0">
                              <span class="text-white text-xl sm:text-2xl font-light" :style="{ fontFamily: primaryFont || currentFont }">×</span>
                            </div>

                            <!-- GoEvent Logo -->
                            <a
                              href="/"
                              class="transition-transform hover:scale-105 flex-shrink-0 max-w-[40%]"
                            >
                              <img
                                :src="WhiteLogoSvg"
                                alt="GoEvent"
                                class="w-full h-auto brightness-110"
                                :style="{
                                  height: 'min(5vh, 60px)',
                                  maxHeight: '60px',
                                  maxWidth: '100%',
                                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))'
                                }"
                              />
                            </a>
                          </div>
                        </div>

                        <!-- Show only GoEvent logo if no referrer or referrer is not partner -->
                        <a
                          v-else
                          href="/"
                          class="inline-flex items-center justify-center transition-transform hover:scale-105"
                        >
                          <img
                            :src="WhiteLogoSvg"
                            alt="GoEvent"
                            class="w-auto"
                            :style="{
                              height: 'min(5vh, 60px)',
                              maxHeight: '60px'
                            }"
                          />
                        </a>

                        <p
                          class="text-xs text-white opacity-90"
                          :style="{ fontFamily: secondaryFont || currentFont }"
                        >

                        </p>
                      </div>

                      <!-- Social Media Buttons -->
                      <div class="flex flex-wrap items-center justify-center gap-2.5">
                        <a
                          href="https://t.me/goeventkh"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                          aria-label="Telegram"
                        >
                          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                          </svg>
                        </a>
                        <a
                          href="https://www.facebook.com/profile.php?id=61581851850221"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                          aria-label="Facebook"
                        >
                          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                        <a
                          href="https://www.instagram.com/goevent.online/"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                          aria-label="Instagram"
                        >
                          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </a>
                        <a
                          href="https://www.tiktok.com/@goevent.online"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                          aria-label="TikTok"
                        >
                          <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                          </svg>
                        </a>
                      </div>

                      <!-- Contact Info -->
                      <div class="space-y-2">
                        <div
                          class="inline-flex items-center justify-center text-sm text-white px-2"
                          :style="{
                            fontFamily: secondaryFont || currentFont,
                          }"
                        >
                          www.goevent.online
                        </div>
                        <div class="flex flex-col items-center justify-center text-sm text-white space-y-1">
                          <a
                            href="tel:+855967775887"
                            class="hover:underline transition-all"
                            :style="{
                              fontFamily: secondaryFont || currentFont,
                            }"
                          >
                            Smart: +855 96 777 5887
                          </a>
                          <a
                            href="tel:+855767775887"
                            class="hover:underline transition-all"
                            :style="{
                              fontFamily: secondaryFont || currentFont,
                            }"
                          >
                            Celcard: +855 76 777 5887
                          </a>
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
import WhiteLogoSvg from '@/assets/white-logo.svg'
import type {
  EventData,
  EventText,
  Host,
  AgendaItem,
  EventPhoto,
} from '../../composables/useEventShowcase'
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
  contentLoading?: boolean
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
  'flex items-center justify-center',
])

const existingBackgroundVideo = ref<HTMLVideoElement | null>(null)

// Inject video resource manager from parent showcase using Vue's provide/inject
// Must be called at top level of setup, not inside lifecycle hooks
const injectedVideoResourceManager = inject<any>('videoResourceManager')

const videoResourceManager = ref<{
  cleanup: () => void
  stats: () => { managedVideos: number; totalListeners: number }
} | null>(null)

const backgroundVideoComponent = computed((): Component | string => {
  // Use div as the background video is handled by CoverStage
  return 'div'
})

const backgroundVideoProps = computed(() => ({
  class: 'bg-transparent',
}))

// Simplified mounting - no video management needed
onMounted(async () => {
  await nextTick()

  // Use the injected video resource manager for other operations if needed
  if (injectedVideoResourceManager) {
    videoResourceManager.value = injectedVideoResourceManager
  }

  // Initialize animations
  initializeRevealAnimations()
  initializeScrollAnimations()

  // Emit that main content has been viewed
  emit('mainContentViewed')
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
  videoStateChange: [isPlaying: boolean]
}>()

// Animation setup
const REVEAL_ANIMATION_CONFIG = {
  animationType: 'slideUp' as const,
  duration: ANIMATION_CONSTANTS.DURATION.NORMAL,
  easing: ANIMATION_CONSTANTS.EASING.EXPO,
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px',
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
  videoSection: ref<HTMLElement>(),
  gallerySection: ref<HTMLElement>(),
  paymentSection: ref<HTMLElement>(),
  commentSection: ref<HTMLElement>(),
  footerSection: ref<HTMLElement>(),
}

// Extract individual refs for template usage
const {
  welcomeHeader: welcomeHeaderRef,
  hostInfo: hostInfoRef,
  eventInfo: eventInfoRef,
  rsvpSection: rsvpSectionRef,
  agendaSection: agendaSectionRef,
  videoSection: videoSectionRef,
  gallerySection: gallerySectionRef,
  paymentSection: paymentSectionRef,
  commentSection: commentSectionRef,
  footerSection: footerSectionRef,
} = sectionRefs

/**
 * Initialize reveal animations
 * All sections must be observed to add .is-visible class, otherwise they remain hidden
 */
const initializeRevealAnimations = () => {
  const animationConfig: Array<[any, string]> = [
    [welcomeHeaderRef, 'welcome-header'],
    [hostInfoRef, 'host-info'],
    [eventInfoRef, 'event-info'],
    [rsvpSectionRef, 'rsvp-section'],
    [agendaSectionRef, 'agenda-section'],
    [videoSectionRef, 'video-section'],
    [gallerySectionRef, 'gallery-section'],
    [paymentSectionRef, 'payment-section'],
    [commentSectionRef, 'comment-section'],
    [footerSectionRef, 'footer-section'],
  ]

  animationConfig.forEach(([elementRef, elementId]) => {
    if (elementRef.value) {
      observeRevealElement(elementRef.value, elementId)
    }
  })
}

/**
 * Initialize scroll animations
 * Disabled in basic mode for better performance
 */
const initializeScrollAnimations = () => {
  // Skip scroll animations in basic mode to reduce GPU overhead
  const isBasicMode = !props.templateAssets?.standard_background_video
  if (isBasicMode) return

  const liquidGlassCard = document.querySelector('.liquid-glass-card')
  if (liquidGlassCard) {
    createScrollAnimation(
      liquidGlassCard,
      [{ transform: 'translateY(0px)' }, { transform: 'translateY(-20px)' }],
      {
        duration: 1000,
        easing: 'ease-out',
      },
    )
  }
}


// Translation key mapping for consistent lookups
const TRANSLATION_KEY_MAP: Record<
  string,
  keyof typeof import('../../utils/translations').rsvpTranslations.en
> = {
  location_header: 'location_header',
  video_header: 'video_header',
  gallery_header: 'gallery_header',
  comment_header: 'comment_header',
  comment_placeholder: 'comment_placeholder',
  comment_signin_prompt: 'comment_signin_prompt',
  comment_signin_button: 'comment_signin_button',
  comment_post_button: 'comment_post_button',
  comment_posting_button: 'comment_posting_button',
  comment_no_comments: 'comment_no_comments',
  comment_loading: 'comment_loading',
  comment_already_commented: 'comment_already_commented',
  comment_one_per_user: 'comment_one_per_user',
  comment_you_badge: 'comment_you_badge',
  payment_wedding_gift: 'payment_wedding_gift',
  payment_birthday_gift: 'payment_birthday_gift',
  footer_thank_you: 'footer_thank_you',
  footer_create_invitations: 'footer_create_invitations',
} as const

// Memoized text lookup map for better performance
const textLookupMap = computed(() => {
  const map = new Map<string, string>()
  if (props.eventTexts?.length && props.currentLanguage) {
    props.eventTexts.forEach(text => {
      if (text.language === props.currentLanguage) {
        map.set(text.text_type, text.content)
      }
    })
  }
  return map
})

/**
 * Get text content from database or frontend translations
 * @param textType - The type of text to retrieve
 * @param fallback - Fallback text if no translation found
 * @returns Translated text content
 */
const getTextContent = (textType: string, fallback = ''): string => {
  // First, try to get content from memoized lookup map
  const content = textLookupMap.value.get(textType)
  if (content) {
    return content
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
  props.eventTexts?.find((text) => text.text_type === textType)

// Computed properties for event text content
const welcomeMessage = computed(() => findEventText('welcome_message')?.content)
const dateText = computed(() => findEventText('date_text')?.content)
const timeText = computed(() => findEventText('time_text')?.content)
const locationText = computed(() => findEventText('location_text')?.content)
const descriptionText = computed(() => findEventText('description')?.content)
const descriptionTitle = computed(() => findEventText('description')?.title)

// Computed properties for translated text
const footerThankYouText = computed(() =>
  getTextContent('footer_thank_you', 'Thank you for celebrating with us'),
)

// Computed styles to avoid recalculation on every render
const contentLoadingStyle = computed(() => ({
  boxShadow: `0 8px 32px ${props.primaryColor}20`,
}))

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
const handleVideoStateChange = (isPlaying: boolean) => emit('videoStateChange', isPlaying)

// Section navigation handlers
const handleRSVP = () => scrollToSection('rsvp-section')
const handleGift = () => scrollToSection('payment-section')
const handleAgenda = () => scrollToSection('agenda-section')
const handleLocation = () => {
  // Scroll to event info section since map is now embedded there
  const element = eventInfoRef.value
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
const handleGallery = () => scrollToSection('gallery-section')
const handleComment = () => scrollToSection('comment-section')
const handleVideo = () => scrollToSection('video-section')

const handleReminder = () => {
  // Add event to Google Calendar
  if (!props.event) return

  const startDate = new Date(props.event.start_date)
  const endDate = new Date(props.event.end_date)

  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: props.event.title,
    dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
    details: props.event.description || props.event.short_description || '',
    location: props.event.is_virtual
      ? props.event.virtual_link || 'Virtual Event'
      : props.event.location || '',
    trp: 'false',
  })

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank')
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
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.39) 50%,
    rgba(255, 255, 255, 0.5) 100%
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
  background: radial-gradient(circle, rgba(255, 255, 255, 0.11) 0%, transparent 70%);
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
   TRANSITION EFFECTS
   =================== */

/* Fade transition for loading overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }
}

</style>
