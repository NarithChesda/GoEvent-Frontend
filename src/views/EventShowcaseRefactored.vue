<template>
  <div 
    class="showcase-wrapper"
    :style="{ backgroundColor: primaryColor || '#000' }"
  >
    <!-- Loading State -->
    <LoadingSpinner 
      v-if="loading" 
      :primary-color="primaryColor" 
      message="Loading event invitation..." 
    />

    <!-- Error State -->
    <ErrorDisplay 
      v-else-if="error" 
      :message="error" 
      :show-retry="true"
      @retry="loadShowcase" 
    />

    <!-- Showcase Content -->
    <div 
      v-else-if="event.id" 
      class="showcase-container relative"
      :style="{ backgroundColor: primaryColor || '#000' }"
    >
      <!-- Stage 1: Cover Video with Overlay -->
      <CoverStage
        v-if="!isEnvelopeOpened"
        :template-assets="templateAssets"
        :guest-name="guestName as string"
        :event-title="event.title"
        :event-logo="event.logo_one"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :accent-color="accentColor"
        :current-font="currentFont"
        :primary-font="primaryFont"
        :secondary-font="secondaryFont"
        :event-texts="eventTexts"
        :current-language="currentLanguage"
        :get-media-url="getMediaUrl"
        @open-envelope="openEnvelope"
        @cover-stage-ready="handleCoverStageReady"
      />

      <!-- Stage 2: Event Video -->
      <EventVideoStage
        v-else-if="isPlayingEventVideo"
        :event-video-url="eventVideoUrl"
        :video-loading="videoLoading"
        :primary-color="primaryColor"
        :event-video-ref="eventVideoRef as any"
        @video-can-play="onVideoCanPlay"
        @video-ended="onEventVideoEnded"
        @video-error="onEventVideoError"
      />

      <!-- Stage 3: Main Content -->
      <MainContentStage
        v-else
        :template-assets="templateAssets"
        :event="event"
        :event-texts="eventTexts"
        :hosts="hosts"
        :agenda-items="agendaItems"
        :event-photos="eventPhotos"
        :payment-methods="paymentMethods"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :accent-color="accentColor"
        :current-font="currentFont"
        :primary-font="primaryFont"
        :secondary-font="secondaryFont"
        :is-event-past="isEventPast"
        :get-media-url="getMediaUrl"
        :available-languages="availableLanguages"
        :current-language="currentLanguage"
        :guest-name="guestName as string"
        :is-music-playing="isMusicPlaying"
        :is-authenticated="authStore.isAuthenticated"
        @open-map="openGoogleMap"
        @open-photo="openPhotoModal"
        @register="registerForEvent"
        @change-language="changeLanguage"
        @comment-submitted="handleCommentSubmitted"
        @music-toggle="toggleMusic"
        @logout="handleLogout"
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
import { onMounted, onUnmounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEventShowcase } from '../composables/useEventShowcase'
import { useAuthStore } from '../stores/auth'

// Components
import LoadingSpinner from '../components/showcase/LoadingSpinner.vue'
import ErrorDisplay from '../components/showcase/ErrorDisplay.vue'
import CoverStage from '../components/showcase/CoverStage.vue'
import EventVideoStage from '../components/showcase/EventVideoStage.vue'
import MainContentStage from '../components/showcase/MainContentStage.vue'
import PhotoModal from '../components/showcase/PhotoModal.vue'

const router = useRouter()
const authStore = useAuthStore()

// Use the composable for all showcase logic
const {
  // State
  loading,
  error,
  isEnvelopeOpened,
  isPlayingEventVideo,
  videoLoading,
  eventVideoRef,
  currentLanguage,
  isPhotoModalOpen,
  currentModalPhoto,
  isMusicPlaying,
  
  // Computed
  event,
  guestName,
  templateAssets,
  eventTexts,
  hosts,
  agendaItems,
  eventPhotos,
  paymentMethods,
  primaryColor,
  secondaryColor,
  accentColor,
  currentFont,
  primaryFont,
  secondaryFont,
  isEventPast,
  eventVideoUrl,
  availableLanguages,
  
  // Methods
  loadShowcase,
  openEnvelope,
  onVideoCanPlay,
  onEventVideoEnded,
  onEventVideoError,
  getMediaUrl,
  openGoogleMap,
  openPhotoModal,
  closePhotoModal,
  navigateToPhoto,
  changeLanguage,
  toggleMusic,
  handleCoverStageReady,
  
  // Preloading methods
  cancelPreloading
} = useEventShowcase()


// Additional methods specific to this view
const registerForEvent = () => {
  router.push(`/events/${event.value.id}`)
}

// Handle redirect from login - skip stages when returning with hash
const handleLoginRedirect = () => {
  const hash = window.location.hash
  
  if (hash && event.value?.id) {
    // Skip stages 1 and 2 by setting states directly for any hash redirect
    isEnvelopeOpened.value = true
    isPlayingEventVideo.value = false
    
    // Wait for the main content to render, then scroll to the appropriate section
    setTimeout(() => {
      let targetElement = null
      
      if (hash === '#rsvp') {
        targetElement = document.getElementById('rsvp')
      } else if (hash === '#comment-section') {
        targetElement = document.getElementById('comment-section')
      }
      
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 300)
  }
}

// Watch for event data to be loaded, then handle redirect
watch(event, (newEvent) => {
  if (newEvent?.id) {
    handleLoginRedirect()
  }
})

const handleCommentSubmitted = (comment: unknown) => {
  console.log('Comment submitted in showcase:', comment)
  // In real implementation, you might want to show a success message
  // or refresh comments from the server
}

const handleLogout = async () => {
  console.log('Logout from showcase')
  
  // Remove hash from URL to prevent auto-redirect to section on re-login
  if (window.location.hash) {
    const urlWithoutHash = window.location.href.split('#')[0]
    window.history.replaceState(null, '', urlWithoutHash)
  }
  
  await authStore.logout()
  // Stay on the showcase page after logout - no redirect
}


// Lifecycle
onMounted(async () => {
  // Initialize auth state for RSVP functionality
  await authStore.initializeAuth()
  // Load showcase content
  loadShowcase()
})

// Cleanup preloading when component unmounts or user navigates away
onUnmounted(() => {
  console.log('🎭 EventShowcase: Component unmounting, cancelling preloading')
  cancelPreloading()
})

// Also cancel preloading when user navigates away
onBeforeUnmount(() => {
  console.log('🎭 EventShowcase: Before unmount, cancelling preloading')
  cancelPreloading()
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
    width: calc(100vh * (1080/1920));
    max-width: calc(100vh * (1080/1920));
  }
}
</style>