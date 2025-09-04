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
    >
      <!-- Single Stage: Cover with Sequential Videos and MainContent Overlay -->
      <CoverStage
        :template-assets="templateAssets"
        :guest-name="guestName"
        :event-title="event.title"
        :event-logo="event.logo_one"
        :event-video-url="eventVideoUrl"
        :background-video-url="backgroundVideoUrl"
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
        @event-video-preloaded="handleEventVideoPreloaded"
        @event-video-ready="handleEventVideoReady"
        @sequential-video-ended="onEventVideoEnded"
        @play-event-video="onVideoCanPlay"
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
            :guest-name="guestName"
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
        </template>
      </CoverStage>

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
import { onMounted, onUnmounted, watch, ref, provide } from 'vue'
import { useRouter } from 'vue-router'

// Composables & Stores
import { useEventShowcase } from '../composables/useEventShowcase'
import { useAuthStore } from '../stores/auth'

// Components
import CoverStage from '../components/showcase/CoverStage.vue'
import ErrorDisplay from '../components/showcase/ErrorDisplay.vue'
import EventVideoStage from '../components/showcase/EventVideoStage.vue'
import LoadingSpinner from '../components/showcase/LoadingSpinner.vue'
import MainContentStage from '../components/showcase/MainContentStage.vue'
import PhotoModal from '../components/showcase/PhotoModal.vue'

// Router and stores
const router = useRouter()
const authStore = useAuthStore()

// Event showcase composable
const {
  // Reactive state
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
  // Computed properties
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
  backgroundVideoUrl,
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
  // Video Resource Manager
  videoResourceManager
} = useEventShowcase()

// Provide video resource manager to child components using Vue's provide/inject
provide('videoResourceManager', videoResourceManager)

// View-specific reactive state
const backgroundVideoReady = ref(false)
const eventVideoPreloaded = ref(false)
const eventVideoReadyFromCover = ref(false)

// View-specific methods
const registerForEvent = () => {
  router.push(`/events/${event.value.id}`)
}

const onBackgroundVideoReady = () => {
  backgroundVideoReady.value = true
}

const handleEventVideoPreloaded = () => {
  eventVideoPreloaded.value = true
}

const handleEventVideoReady = () => {
  eventVideoReadyFromCover.value = true
}

const handleLoginRedirect = () => {
  const hash = window.location.hash
  
  if (hash && event.value?.id) {
    // Skip stages for hash redirects
    isEnvelopeOpened.value = true
    isPlayingEventVideo.value = false
    
    // Scroll to target section after content renders
    setTimeout(() => {
      const targetId = hash === '#rsvp' ? 'rsvp' : 
                      hash === '#comment-section' ? 'comment-section' : null
      
      if (targetId) {
        const targetElement = document.getElementById(targetId)
        targetElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 300)
  }
}

const handleCommentSubmitted = () => {
  // Comment submission handled by the composable or component
}

const handleLogout = async () => {
  // Remove hash to prevent auto-redirect on re-login
  if (window.location.hash) {
    const urlWithoutHash = window.location.href.split('#')[0]
    window.history.replaceState(null, '', urlWithoutHash)
  }
  
  await authStore.logout()
}

// Watch for event data to handle redirects
watch(event, (newEvent) => {
  if (newEvent?.id) {
    handleLoginRedirect()
  }
})

// Lifecycle hooks
onMounted(async () => {
  await authStore.initializeAuth()
  
  // Make video resource manager globally accessible for child components
  ;(window as any).__showcaseComposable = {
    videoResourceManager
  }
  
  loadShowcase()
})

onUnmounted(() => {
  // Clean up global reference
  if ((window as any).__showcaseComposable) {
    delete (window as any).__showcaseComposable
  }
  
  // Cleanup handled by composable
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