<template>
  <div class="showcase-wrapper" :style="{ backgroundColor: backgroundColor || primaryColor || '#000' }">
    <!-- Loading State -->
    <LoadingSpinner
      v-if="loading"
      :primary-color="primaryColor"
      message="Loading event invitation..."
    />

    <!-- Error State -->
    <ErrorDisplay v-else-if="error" :message="error" :show-retry="true" @retry="loadShowcase" />

    <!-- Showcase Content -->
    <div v-else-if="event.id" class="showcase-container relative">
      <!-- Single Stage: Cover with Sequential Videos and MainContent Overlay -->
      <CoverStage
        ref="coverStageRef"
        :template-assets="templateAssets"
        :template-colors="templateColors"
        :guest-name="guestName"
        :event-title="event.title"
        :event-logo="event.logo_one"
        :event-video-url="eventVideoUrl"
        :background-video-url="backgroundVideoUrl"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :accent-color="accentColor"
        :background-color="backgroundColor"
        :guestname-color="guestnameColor"
        :current-font="currentFont"
        :primary-font="primaryFont"
        :secondary-font="secondaryFont"
        :event-texts="eventTexts"
        :current-language="currentLanguage"
        :current-showcase-stage="currentShowcaseStage"
        :should-skip-to-main-content="shouldSkipToMainContent"
        :video-state-preserved="videoStatePreserved"
        :content-top-position="event.template_assets?.cover_content_top_position"
        :get-media-url="getMediaUrl"
        @open-envelope="openEnvelopeWithVideoSync"
        @cover-stage-ready="handleCoverStageReady"
        @event-video-preloaded="() => {}"
        @event-video-ready="() => {}"
        @sequential-video-ended="onEventVideoEnded"
      >
        <!-- MainContent slot content for background video stage -->
        <template #main-content>
          <MainContentStage
            :template-assets="templateAssets"
            :event="event"
            :event-texts="eventTexts"
            :hosts="hosts"
            :agenda-items="agendaItems"
            :event-photos="eventPhotos"
            :payment-methods="paymentMethods"
            :dress-codes="dressCodes"
            :primary-color="primaryColor"
            :secondary-color="secondaryColor"
            :accent-color="accentColor"
            :background-color="backgroundColor"
            :current-font="currentFont"
            :primary-font="primaryFont"
            :secondary-font="secondaryFont"
            :is-event-past="isEventPast"
            :get-media-url="getMediaUrl"
            :available-languages="availableLanguages"
            :current-language="currentLanguage"
            :guest-name="guestName"
            :is-music-playing="isMusicPlaying"
            :is-authenticated="authStore.isAuthenticated"
            :content-loading="contentLoading"
            @open-map="openGoogleMap"
            @open-photo="openPhotoModal"
            @register="registerForEvent"
            @change-language="changeLanguage"
            @comment-submitted="handleCommentSubmitted"
            @music-toggle="toggleMusic"
            @logout="handleLogout"
            @main-content-viewed="handleMainContentViewed"
            @show-auth-modal="openAuthModal"
            @video-state-change="handleVideoStateChange"
          />
        </template>
      </CoverStage>

      <!-- Auth Modal -->
      <AuthModal
        :is-visible="showAuthModal"
        @close="onAuthModalClose"
        @authenticated="onUserAuthenticated"
      />

      <!-- Photo Modal -->
      <PhotoModal
        :is-open="isPhotoModalOpen"
        :photos="eventPhotos"
        :current-photo="currentModalPhoto"
        :get-media-url="getMediaUrl"
        @close="closePhotoModal"
        @navigate="navigateToPhoto"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Vue core
import { onMounted, onUnmounted, watch, provide, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'

// Composables & Stores
import { useEventShowcase } from '../composables/useEventShowcase'
import { useAuthStore } from '../stores/auth'

// Meta tags utility
import {
  updateMetaTags,
  getBestEventImage,
  createEventDescription,
  debugMetaTags,
} from '../utils/metaUtils'

// Components
import CoverStage from '../components/showcase/CoverStage.vue'
import ErrorDisplay from '../components/showcase/ErrorDisplay.vue'
import LoadingSpinner from '../components/showcase/LoadingSpinner.vue'
import MainContentStage from '../components/showcase/MainContentStage.vue'
import PhotoModal from '../components/showcase/PhotoModal.vue'
import AuthModal from '../components/AuthModal.vue'
import { useAuthModal } from '../composables/useAuthModal'

// Router and stores
const router = useRouter()
const authStore = useAuthStore()

// Event showcase composable
const {
  // Reactive state
  loading,
  contentLoading,
  error,
  currentLanguage,
  isPhotoModalOpen,
  currentModalPhoto,
  isMusicPlaying,
  currentShowcaseStage,
  // Computed properties
  event,
  guestName,
  templateAssets,
  templateColors,
  eventTexts,
  hosts,
  agendaItems,
  eventPhotos,
  paymentMethods,
  dressCodes,
  primaryColor,
  secondaryColor,
  accentColor,
  backgroundColor,
  guestnameColor,
  currentFont,
  primaryFont,
  secondaryFont,
  isEventPast,
  eventVideoUrl,
  backgroundVideoUrl,
  eventMusicUrl,
  availableLanguages,
  // Methods
  loadShowcase,
  openEnvelope,
  onVideoCanPlay,
  onEventVideoEnded,
  getMediaUrl,
  openGoogleMap,
  openPhotoModal,
  closePhotoModal,
  navigateToPhoto,
  changeLanguage,
  toggleMusic,
  handleCoverStageReady,
  setStage,
  // Redirect State Management
  shouldSkipToMainContent,
  markMainContentSeen,
  handleLoginRedirectWithStage,
  // Video State Preservation
  videoStatePreserved,
  preserveVideoState,
  clearVideoStatePreservation,
  // Video Resource Manager
  videoResourceManager,
} = useEventShowcase()

// Provide video resource manager to child components using Vue's provide/inject
provide('videoResourceManager', videoResourceManager)

// CoverStage component ref
const coverStageRef = ref<InstanceType<typeof CoverStage> | null>(null)

// Auth modal state and handlers
const { showAuthModal, openAuthModal, onAuthModalClose, onUserAuthenticated } = useAuthModal()

// View-specific reactive state - removed unused refs for performance

// View-specific methods
const registerForEvent = () => {
  router.push(`/events/${event.value.id}`)
}

// Dead code handlers removed - functionality moved to composable

const handleLoginRedirect = () => {
  // The redirect logic is now handled by the composable
  handleLoginRedirectWithStage(setStage)
}

const handleCommentSubmitted = () => {
  // Comment submission is handled by the child component
  // Mark that main content has been seen when user interacts with comments
  markMainContentSeen()
}

// Override the openEnvelope function to include video synchronization
const openEnvelopeWithVideoSync = async () => {
  // First call the original openEnvelope function which handles music
  // Pass the required parameters for music to work
  await openEnvelope(eventVideoUrl.value || undefined, eventMusicUrl.value || undefined)

  // Determine display mode: basic mode has basic_decoration_photo, standard mode doesn't
  const isBasicMode = Boolean(templateAssets.value?.basic_decoration_photo)

  // Then trigger the video playback ONLY in standard mode
  // In basic mode, skip directly to main content without playing any videos
  if (!isBasicMode && coverStageRef.value && eventVideoUrl.value) {
    coverStageRef.value.startEventVideo()
  }
}

const handleMainContentViewed = () => {
  // Mark that user has seen the main content stage
  markMainContentSeen()
}

const handleLogout = async () => {
  // Remove hash to prevent auto-redirect on re-login
  if (window.location.hash) {
    const urlWithoutHash = window.location.href.split('#')[0]
    window.history.replaceState(window.history.state, '', urlWithoutHash)
  }

  await authStore.logout()
}

// Store music state before video plays
const musicStateBeforeVideo = ref(false)

const handleVideoStateChange = (isPlaying: boolean) => {
  if (isPlaying) {
    // Video started playing - store current music state and pause music
    musicStateBeforeVideo.value = isMusicPlaying.value
    if (isMusicPlaying.value) {
      toggleMusic()
    }
  } else {
    // Video stopped/paused - restore previous music state
    if (musicStateBeforeVideo.value && !isMusicPlaying.value) {
      toggleMusic()
    }
  }
}

// Watch for event data to handle redirects after login with proper timing
watch(
  () => event.value?.id,
  async (eventId) => {
    if (eventId) {
      // Wait a tick to ensure all reactive updates have been processed
      await nextTick()
      handleLoginRedirect()
    }
  },
)

// Watch for event data changes to update meta tags for social media sharing
// Using targeted property watching instead of deep watch to reduce reactive overhead
watch(
  () => ({
    id: event.value?.id,
    title: event.value?.title,
    description: event.value?.description,
    banner_image: event.value?.banner_image,
    logo_one: event.value?.logo_one,
    start_date: event.value?.start_date,
    organizer_details: event.value?.organizer_details,
  }),
  (eventData) => {
    if (eventData?.id) {
      updateEventMetaTags(event.value)
    }
  },
  { immediate: true, deep: false },
)

// Helper function to update meta tags for the current event
const updateEventMetaTags = (eventData: any) => {
  try {
    const bestImage = getBestEventImage(eventData)
    const eventDescription = createEventDescription(eventData)

    // Convert relative URLs to absolute URLs for social media
    const getAbsoluteImageUrl = (imageUrl: string | undefined): string | undefined => {
      if (!imageUrl) return undefined

      // If it's already a full URL, return as is
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl
      }

      // If it's a relative URL, prepend the API base URL
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
      if (imageUrl.startsWith('/')) {
        return `${API_BASE_URL}${imageUrl}`
      }

      // If it doesn't start with /, assume it needs /media/ prefix
      return `${API_BASE_URL}/media/${imageUrl}`
    }

    const absoluteImageUrl = getAbsoluteImageUrl(bestImage)

    // Format event date
    const eventDate = eventData.start_date
      ? new Date(eventData.start_date).toISOString()
      : undefined

    // Build the current showcase URL
    const currentUrl = window.location.href

    // Update meta tags with event information
    updateMetaTags({
      title: `${eventData.title} - Event Invitation`,
      description: eventDescription,
      image: absoluteImageUrl,
      url: currentUrl,
      siteName: 'GoEvent',
      type: 'website',
      locale: 'en_US',
      author:
        eventData.organizer_details?.first_name ||
        eventData.organizer_details?.username ||
        'GoEvent',
      publishedTime: eventDate,
      location: eventData.location || eventData.virtual_link || undefined,
    })

    // Debug current meta tags in development
    debugMetaTags()
  } catch (error) {
    console.warn('Failed to update meta tags:', error)
  }
}

// Preload logo to ensure it's cached before MainContentStage renders
const preloadLogo = (logoUrl: string | null | undefined) => {
  if (!logoUrl) return

  const fullUrl = getMediaUrl(logoUrl)
  if (!fullUrl) return

  // Create preload link
  const preloadLink = document.createElement('link')
  preloadLink.rel = 'preload'
  preloadLink.as = 'image'
  preloadLink.href = fullUrl
  preloadLink.setAttribute('fetchpriority', 'high')
  document.head.appendChild(preloadLink)
}

// Lifecycle hooks
onMounted(async () => {
  await authStore.initializeAuth()

  // Initialize showcase - video resource manager is provided via Vue's provide/inject pattern
  await loadShowcase()

  // Preload logo once event data is loaded
  if (event.value?.logo_one) {
    preloadLogo(event.value.logo_one)
  }
})

onUnmounted(() => {
  // All cleanup is handled by the composable's onUnmounted hook
  // No additional manual cleanup needed as we're using proper Vue provide/inject pattern
})
</script>

<style scoped>
/* Container Styles */
.showcase-wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000; /* Fallback */
  overflow: hidden;
}

.showcase-container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  margin: 0 auto;
}

/* Small mobile phones only - full width */
@media (max-width: 480px) and (max-height: 800px) {
  .showcase-container {
    max-width: 480px;
    max-height: 1920px;
  }
}

/* All other devices - consistent desktop sizing with 100% height priority */
@media (min-width: 481px), (min-height: 801px) {
  .showcase-container {
    width: calc(100vh * (1080 / 1920));
    max-width: calc(100vh * (1080 / 1920));
  }
}
</style>
