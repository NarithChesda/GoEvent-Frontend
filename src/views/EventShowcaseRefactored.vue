<template>
  <div class="showcase-wrapper">
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
    <div v-else-if="event.id" class="showcase-container relative bg-black">
      <!-- Stage 1: Cover Video with Overlay -->
      <CoverStage
        v-if="!isEnvelopeOpened"
        :template-assets="templateAssets"
        :guest-name="guestName"
        :event-title="event.title"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :accent-color="accentColor"
        :current-font="currentFont"
        :get-media-url="getMediaUrl"
        @open-envelope="openEnvelope"
      />

      <!-- Stage 2: Event Video -->
      <EventVideoStage
        v-else-if="isPlayingEventVideo"
        :event-video-url="eventVideoUrl"
        :video-loading="videoLoading"
        :primary-color="primaryColor"
        :event-video-ref="eventVideoRef"
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
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :accent-color="accentColor"
        :current-font="currentFont"
        :is-event-past="isEventPast"
        :show-all-photos="showAllPhotos"
        :get-media-url="getMediaUrl"
        @open-map="openGoogleMap"
        @open-photo="openPhotoModal"
        @register="registerForEvent"
        @toggle-photos="showAllPhotos = !showAllPhotos"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEventShowcase } from '../composables/useEventShowcase'

// Components
import LoadingSpinner from '../components/showcase/LoadingSpinner.vue'
import ErrorDisplay from '../components/showcase/ErrorDisplay.vue'
import CoverStage from '../components/showcase/CoverStage.vue'
import EventVideoStage from '../components/showcase/EventVideoStage.vue'
import MainContentStage from '../components/showcase/MainContentStage.vue'

const router = useRouter()

// Use the composable for all showcase logic
const {
  // State
  loading,
  error,
  isEnvelopeOpened,
  isPlayingEventVideo,
  videoLoading,
  eventVideoRef,
  showAllPhotos,
  
  // Computed
  event,
  guestName,
  templateAssets,
  eventTexts,
  hosts,
  agendaItems,
  eventPhotos,
  primaryColor,
  secondaryColor,
  accentColor,
  currentFont,
  isEventPast,
  eventVideoUrl,
  
  // Methods
  loadShowcase,
  openEnvelope,
  onVideoCanPlay,
  onEventVideoEnded,
  onEventVideoError,
  getMediaUrl,
  openGoogleMap,
  openPhotoModal
} = useEventShowcase()

// Additional methods specific to this view
const registerForEvent = () => {
  router.push(`/events/${event.value.id}`)
}

// Lifecycle
onMounted(() => {
  loadShowcase()
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
  background: #000;
  overflow: hidden;
}

.showcase-container {
  width: 100%;
  max-width: 1080px;
  height: 100vh;
  max-height: 1920px;
  position: relative;
  overflow: hidden;
  background: #000;
  margin: 0 auto;
}

/* For desktop screens, maintain aspect ratio */
@media (min-aspect-ratio: 1080/1920) {
  .showcase-container {
    width: calc(100vh * 1080 / 1920);
    height: 100vh;
  }
}
</style>