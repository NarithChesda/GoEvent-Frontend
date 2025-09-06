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
        ref="coverStageRef"
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
        :current-showcase-stage="currentShowcaseStage"
        :should-skip-to-main-content="shouldSkipToMainContent"
        :video-state-preserved="videoStatePreserved"
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
            @main-content-viewed="handleMainContentViewed"
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
import { onMounted, onUnmounted, watch, provide, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'

// Composables & Stores
import { useEventShowcase } from '../composables/useEventShowcase'
import { useAuthStore } from '../stores/auth'

// Components
import CoverStage from '../components/showcase/CoverStage.vue'
import ErrorDisplay from '../components/showcase/ErrorDisplay.vue'
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
  currentLanguage,
  isPhotoModalOpen,
  currentModalPhoto,
  isMusicPlaying,
  currentShowcaseStage,
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
  videoResourceManager
} = useEventShowcase()

// Provide video resource manager to child components using Vue's provide/inject
provide('videoResourceManager', videoResourceManager)

// CoverStage component ref
const coverStageRef = ref<InstanceType<typeof CoverStage> | null>(null)

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
  
  // Then trigger the video playbook to synchronize with the music
  if (coverStageRef.value) {
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

// Watch for event data to handle redirects after login with proper timing
watch(
  () => event.value?.id, 
  async (eventId) => {
    if (eventId) {
      // Wait a tick to ensure all reactive updates have been processed
      await nextTick()
      handleLoginRedirect()
    }
  }
)

// Lifecycle hooks
onMounted(async () => {
  await authStore.initializeAuth()
  
  // Initialize showcase - video resource manager is provided via Vue's provide/inject pattern
  loadShowcase()
})

onUnmounted(() => {
  // All cleanup is handled by the composable's onUnmounted hook
  // No manual cleanup needed as we're using proper Vue provide/inject pattern
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