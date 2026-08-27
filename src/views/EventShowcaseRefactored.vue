<template>
  <!-- V2 "Storybook Romance" template — wedding events, gated by
       VITE_SHOWCASE_TEMPLATE_VERSION=v2 (temporary env toggle; will move to
       template_assets backend data, mirroring showcaseAnimationType) -->
  <div v-if="useV2Showcase" class="v2-showcase-root" :class="protectionClasses" :style="protectionStyles">
    <ShowcaseV2Experience
      :event="event"
      :event-texts="eventTexts"
      :hosts="hosts"
      :agenda-items="agendaItems"
      :event-photos="eventPhotos"
      :payment-methods="paymentMethods"
      :dress-codes="dressCodes"
      :template-colors="templateColors"
      :template-fonts="templateFonts"
      :fonts-loaded="fontsLoaded"
      :current-language="currentLanguage"
      :available-languages="availableLanguages"
      :guest-name="guestName"
      :guest-shortcode="guestShortcode"
      :is-event-past="isEventPast"
      :is-music-playing="isMusicPlaying"
      :is-authenticated="authStore.isAuthenticated"
      :skip-cover="shouldSkipToMainContent"
      :get-media-url="getMediaUrl"
      @opened="handleV2Opened"
      @open-photo="openPhotoModal"
      @open-map="openGoogleMap"
      @change-language="changeLanguage"
      @music-toggle="toggleMusic"
      @show-auth-modal="openAuthModal"
      @comment-submitted="handleCommentSubmitted"
      @register="registerForEvent"
      @video-state-change="handleVideoStateChange"
      @main-content-viewed="handleMainContentViewed"
    />

    <!-- Shared modals (V2 branch) -->
    <AuthModal
      :is-visible="showAuthModal"
      @close="onAuthModalClose"
      @authenticated="onUserAuthenticated"
    />
    <PhotoModal
      :is-open="isPhotoModalOpen"
      :photos="eventPhotos"
      :current-photo="currentModalPhoto"
      :get-media-url="getMediaUrl"
      @close="closePhotoModal"
      @navigate="navigateToPhoto"
    />
  </div>

  <div
    v-else
    class="showcase-wrapper"
    :class="protectionClasses"
    :style="[{ backgroundColor: backgroundColor || primaryColor || '#000' }, protectionStyles]"
  >
    <!-- Loading State -->
    <LoadingSpinner
      v-if="loading"
      :primary-color="primaryColor"
      message="Loading event invitation..."
    />

    <!-- Error State -->
    <ErrorDisplay v-else-if="error" :message="error" :show-retry="true" @retry="loadShowcase" />

    <!-- Showcase Content -->
    <div
      v-else-if="event.id"
      class="showcase-container relative"
      :class="protectionClasses"
      :style="protectionStyles"
    >
      <!-- Single Stage: Cover with Sequential Videos and MainContent Overlay -->
      <CoverStage
        ref="coverStageRef"
        :template-assets="templateAssets"
        :template-colors="templateColors"
        :guest-name="guestName"
        :event-title="event.title"
        :event-logo="event.logo_one"
        :first-host-image="hosts[0]?.profile_image || null"
        :first-host-name="hosts[0]?.name || ''"
        :first-host-id="hosts[0]?.id ?? null"
        :event-video-url="eventVideoUrl"
        :background-video-url="backgroundVideoUrl"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :accent-color="accentColor"
        :background-color="backgroundColor"
        :guestname-color="guestnameColor"
        :template-color="templateColor"
        :current-font="currentFont"
        :primary-font="primaryFont"
        :secondary-font="secondaryFont"
        :accent-font="accentFont"
        :decorative-font="decorativeFont"
        :event-texts="eventTexts"
        :current-language="currentLanguage"
        :current-showcase-stage="currentShowcaseStage"
        :should-skip-to-main-content="shouldSkipToMainContent"
        :video-state-preserved="videoStatePreserved"
        :content-top-position="event.template_assets?.cover_content_top_position"
        :cover-stage-layout="event.template_assets?.cover_stage_layout"
        :cover-top-decoration="event.template_assets?.assets?.cover_top_decoration"
        :cover-bottom-decoration="event.template_assets?.assets?.cover_bottom_decoration"
        :cover-left-decoration="event.template_assets?.assets?.cover_left_decoration"
        :cover-right-decoration="event.template_assets?.assets?.cover_right_decoration"
        :animation-type="event.template_assets?.cover_stage_layout?.showcaseAnimationType"
        :ambient-creatures="event.template_assets?.ambient_creatures"
        :falling-effect="event.template_assets?.falling_effect"
        :sparks="event.template_assets?.sparks"
        :transition-owns-falling-field="showTransitionStage && isDoorTransition"
        :use-transition-stage="isBasicWedding"
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
            :template-color="templateColor"
            :current-font="currentFont"
            :primary-font="primaryFont"
            :secondary-font="secondaryFont"
            :is-event-past="isEventPast"
            :get-media-url="getMediaUrl"
            :available-languages="availableLanguages"
            :current-language="currentLanguage"
            :guest-name="guestName"
            :guest-shortcode="guestShortcode"
            :is-music-playing="isMusicPlaying"
            :content-loading="contentLoading"
            :top-decoration="event.template_assets?.assets?.top_decoration || event.top_decoration"
            :bottom-decoration="event.template_assets?.assets?.bottom_decoration || event.bottom_decoration"
            :left-decoration="event.template_assets?.assets?.left_decoration || event.left_decoration"
            :right-decoration="event.template_assets?.assets?.right_decoration || event.right_decoration"
            :animation-type="event.template_assets?.cover_stage_layout?.showcaseAnimationType"
            :main-stage-layout="event.template_assets?.cover_stage_layout"
            :event-details-design="event.template_assets?.event_details_design"
            :host-info-design="event.template_assets?.host_info_design"
            :info-card-design="event.template_assets?.info_card_design"
            @open-map="openGoogleMap"
            @open-photo="openPhotoModal"
            @register="registerForEvent"
            @change-language="changeLanguage"
            @comment-submitted="handleCommentSubmitted"
            @music-toggle="toggleMusic"
            @main-content-viewed="handleMainContentViewed"
            @show-auth-modal="openAuthModal"
            @video-state-change="handleVideoStateChange"
          />
        </template>

        <!-- Door templates' transition stage. Rendered through CoverStage's
             own slot so it sits under the door panels — the doors part to
             reveal it. Its gold bloom is still on screen when it emits
             `transitionComplete`; the leave transition dissolves it over the
             main content that mounts behind it at that moment. -->
        <template #transition>
          <Transition name="door-transition-out">
            <TransitionStageDoor
              v-if="showTransitionStage && isDoorTransition"
              :event-title="event.title"
              :event-photos="eventPhotos"
              :event-start-date="event.start_date"
              :primary-color="primaryColor"
              :accent-color="accentColor"
              :background-color="backgroundColor"
              :blur-effect-color="blurEffectColor"
              :falling-effect="event.template_assets?.falling_effect"
              :save-the-date-design="event.template_assets?.save_the_date_design"
              :get-media-url="getMediaUrl"
              @transition-complete="handleTransitionComplete"
            />
          </Transition>
        </template>
      </CoverStage>

      <!-- Decoration templates' transition stage (basic wedding events only,
           requires a featured photo) -->
      <TransitionStage
        v-if="showTransitionStage && !isDoorTransition"
        :event-title="event.title"
        :event-logo="event.logo_one"
        :event-photos="eventPhotos"
        :event-start-date="event.start_date"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :accent-color="accentColor"
        :background-color="backgroundColor"
        :blur-effect-color="blurEffectColor"
        :current-font="currentFont"
        :primary-font="primaryFont"
        :secondary-font="secondaryFont"
        :falling-effect="event.template_assets?.falling_effect"
        :save-the-date-design="event.template_assets?.save_the_date_design"
        :get-media-url="getMediaUrl"
        @dissolve-start="handleTransitionDissolveStart"
        @transition-complete="handleTransitionComplete"
      />

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
import { onMounted, onUnmounted, watch, provide, nextTick, ref, computed, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'

// Composables & Stores
import { useEventShowcase } from '../composables/useEventShowcase'
import { useAuthStore } from '../stores/auth'
import { useAssetProtection } from '../composables/showcase/useAssetProtection'
import { DOOR_CLEARED_MS } from '../composables/showcase/useDoorAnimation'
import { getPendingLogin } from '../composables/useTelegramBotLogin'

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
import TransitionStage from '../components/showcase/TransitionStage.vue'
import TransitionStageDoor from '../components/showcase/TransitionStageDoor.vue'
import PhotoModal from '../components/showcase/PhotoModal.vue'
import AuthModal from '../components/AuthModal.vue'
import { useAuthModal } from '../composables/useAuthModal'

// V2 storybook template — lazy so GSAP + V2 code only load when the gate is on
const ShowcaseV2Experience = defineAsyncComponent(
  () => import('../components/showcase-v2/ShowcaseV2Experience.vue'),
)

// Router and stores
const router = useRouter()
const authStore = useAuthStore()

// Asset protection (production-only)
const { protectionClasses, protectionStyles, setupProtection, cleanupProtection } =
  useAssetProtection()

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
  guestShortcode,
  templateAssets,
  templateColors,
  templateFonts,
  fontsLoaded,
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
  templateColor,
  blurEffectColor,
  currentFont,
  primaryFont,
  secondaryFont,
  accentFont,
  decorativeFont,
  isEventPast,
  eventVideoUrl,
  backgroundVideoUrl,
  eventMusicUrl,
  musicStartTime,
  musicEndTime,
  musicStartStage,
  availableLanguages,
  armMusic,
  cueMusic,
  // Methods
  loadShowcase,
  openEnvelope,
  onEventVideoEnded,
  onTransitionComplete,
  isTransitionStage,
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
  // Redirect to public event page for registration
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

// Check if this is a wedding event with basic template (needs transition stage).
// "Basic mode" mirrors CoverStage's own definition: template exists but has no
// standard_cover_video. This covers both the decoration-photo variant and the
// background-photo/video variant (basic_background_photo + standard_background_video)
// which intentionally omits basic_decoration_photo.
const isBasicWedding = computed(() => {
  if (!templateAssets.value) return false
  const isBasicMode = !templateAssets.value.standard_cover_video
  const categoryName = (event.value.category_details?.name || event.value.category_name || '').toLowerCase()
  return isBasicMode && categoryName === 'wedding'
})

const hasFeaturedPhoto = computed(() => {
  return eventPhotos.value?.some((p) => p.is_featured) ?? false
})

const showTransitionStage = computed(
  () => isTransitionStage.value && isBasicWedding.value && hasFeaturedPhoto.value,
)

// Which of the two transition stages this template gets. Mirrors how CoverStage
// resolves the animation type (template field only, defaulting to decoration) —
// the door cover animation is paired with the curtain-and-cartouche transition,
// everything else with the veil reveal.
const isDoorTransition = computed(
  () => event.value.template_assets?.cover_stage_layout?.showcaseAnimationType === 'door',
)

/**
 * Fetch and decode the transition stage's featured photo while the guest is
 * still looking at the cover.
 *
 * That stage mounts on the tap, in the very frame the cover starts animating
 * away, and its full-bleed photo has never been requested before that moment.
 * Doing the fetch, the decode and the resulting geometry measurement there
 * competes with the frame the cover's exit has to land on — on a desktop that
 * is absorbed invisibly, on a phone it is the difference between the doors
 * gliding and the opening of the swing stuttering. Warmed here, the tap gets a
 * cache hit on an already-decoded bitmap.
 *
 * Fire-and-forget by design: if it fails, the stage simply loads the photo the
 * way it always did.
 */
watch(
  () => (isBasicWedding.value ? (eventPhotos.value?.find((p) => p.is_featured)?.image ?? null) : null),
  (image) => {
    if (!image) return
    const warm = new Image()
    warm.decoding = 'async'
    warm.src = getMediaUrl(image)
    void warm.decode?.().catch(() => {})
  },
  { immediate: true },
)

// V2 "Storybook Romance" template gate. Per-template selection
// (event.template_assets.showcase_template_version) takes priority once the
// backend sends it — see docs/backend-api-requirements/showcase-template-version.md.
// Until then, every event falls back to the env-var + category heuristic
// below (VITE_SHOWCASE_TEMPLATE_VERSION=v2 renders V2 for all wedding events).
const V2_TEMPLATE_ENABLED =
  (import.meta.env.VITE_SHOWCASE_TEMPLATE_VERSION || 'v1') === 'v2'

const useV2Showcase = computed(() => {
  if (!event.value?.id) return false

  const templateVersion = event.value.template_assets?.showcase_template_version
  if (templateVersion === 'v1' || templateVersion === 'v2') {
    return templateVersion === 'v2'
  }

  if (!V2_TEMPLATE_ENABLED) return false
  const categoryName = (
    event.value.category_details?.name || event.value.category_name || ''
  ).toLowerCase()
  return categoryName === 'wedding'
})

/**
 * Pins the viewport for the V1 stage, so its `dvh` heights resolve once and stay.
 *
 * The V1 stage is a fixed-height frame whose content scrolls inside the glass
 * card, so the document itself has nothing to scroll — except the sliver that
 * `#app`'s `min-height: 100vh` contributes on mobile, where `100vh` is the
 * *large* (chrome-hidden) viewport and so overshoots the visible area by the
 * height of the browser's own header. That sliver is the only handle the browser
 * has for collapsing its chrome, and every collapse (and re-expansion on the way
 * back up) re-resolves `dvh` and relays out the whole invitation mid-read.
 *
 * Taking the sliver away means the chrome can never move, so `dvh` settles on
 * the chrome-visible height and holds it: nothing clips, nothing reflows, and no
 * band of background opens up below the stage. The cost is that the header stays
 * visible — which it did anyway, since collapsing it was always a manual drag on
 * a dead spot rather than something the invitation offered.
 *
 * V2 is exempt and must stay that way: the window *is* its scroller (GSAP
 * ScrollTrigger), so locking it would freeze the entire scroll story.
 */
const VIEWPORT_LOCK_CLASS = 'showcase-viewport-locked'

watch(
  useV2Showcase,
  (isV2) => {
    document.documentElement.classList.toggle(VIEWPORT_LOCK_CLASS, !isV2)
  },
  { immediate: true },
)

// V2 cover opened: align stage/redirect state with V1 and start the music
const handleV2Opened = () => {
  setStage('main_content')
  markMainContentSeen()
  // V2 is one scrolling page behind an envelope gate — opening it *is* reaching
  // the main content, so whichever stage was chosen resolves to this single
  // moment. Routed through the gate anyway so `music_start_stage` can't make a
  // V2 event silent, and so the play bookkeeping matches V1's.
  armMusic(
    eventMusicUrl.value || undefined,
    musicStartTime.value,
    musicEndTime.value,
    musicStartStage.value ?? 'main_content',
  )
  cueMusic('main_content')
}

/**
 * How long the cover takes to get off the screen after the tap — the doors to
 * swing clear, or the decorations to slide out. Both the hand-off to main
 * content and the `transition` music cue hang off this, so they can't drift
 * apart: it is the single answer to "when has the guest stopped looking at the
 * cover?"
 */
const coverExitDurationMs = (): number => {
  const animationType = event.value.template_assets?.cover_stage_layout?.showcaseAnimationType
  return animationType === 'door' ? DOOR_CLEARED_MS : 1400
}

// Override the openEnvelope function to include video synchronization
const openEnvelopeWithVideoSync = async () => {
  // For basic wedding events with a featured photo, use the transition stage
  if (isBasicWedding.value && hasFeaturedPhoto.value) {
    await openEnvelope(eventVideoUrl.value || undefined, eventMusicUrl.value || undefined, {
      useTransitionStage: true,
      musicLoopStart: musicStartTime.value,
      musicLoopEnd: musicEndTime.value,
      musicStartStage: musicStartStage.value,
    })
    // The stage flipped on the tap, but the transition scene is behind the cover
    // until its exit finishes — so the music cue waits for the same moment the
    // guest first sees that scene. A no-op unless this event asked for
    // `transition`; `main_content` still waits for the stage to complete.
    setTimeout(() => cueMusic('transition'), coverExitDurationMs())
    return
  }

  // For basic wedding events without a featured photo, still use transition stage
  // so the door/decoration animation plays, then auto-complete after animation finishes
  if (isBasicWedding.value) {
    await openEnvelope(eventVideoUrl.value || undefined, eventMusicUrl.value || undefined, {
      useTransitionStage: true,
      musicLoopStart: musicStartTime.value,
      musicLoopEnd: musicEndTime.value,
      musicStartStage: musicStartStage.value,
    })
    // No TransitionStage component renders (no featured photo), so the cover
    // animation is the whole reveal and main content follows it directly.
    // Completing early doesn't buy anything: revealing main content clears
    // isDoorAnimationInProgress, which unmounts the leaves — so a delay shorter
    // than the swing cuts it off mid-flight. Handing off once they've cleared
    // the frame rather than at the very end of the swing skips its tail, which
    // is off screen anyway.
    // Decoration animation: wait for decorations to finish sliding out (~1.2s).
    setTimeout(() => {
      handleTransitionComplete()
    }, coverExitDurationMs())
    return
  }

  // First call the original openEnvelope function which handles music
  // Pass the required parameters for music to work
  await openEnvelope(eventVideoUrl.value || undefined, eventMusicUrl.value || undefined, {
    musicLoopStart: musicStartTime.value,
    musicLoopEnd: musicEndTime.value,
    musicStartStage: musicStartStage.value,
  })

  // Determine display mode: basic mode has basic_decoration_photo, standard mode doesn't
  const isBasicMode = Boolean(templateAssets.value?.basic_decoration_photo)

  // Then trigger the video playback ONLY in standard mode
  // In basic mode, skip directly to main content without playing any videos
  if (!isBasicMode && coverStageRef.value && eventVideoUrl.value) {
    coverStageRef.value.startEventVideo()
  }
}

/**
 * The transition stage is about to dissolve. Mount the invitation *behind* it
 * now, so the dissolve is a cross-fade into it.
 *
 * Without this the stage spent 1.2s fading back to the cover it had already
 * replaced, and the invitation then hard-cut in on the frame the stage
 * unmounted — two cuts where the door flow has none. (The door flow got this
 * right by construction: its main content is mounted throughout the swing, and
 * its `door-transition-out` leave fade dissolves the stage over it.)
 *
 * Deliberately not `revealMainContent()`: that routes through
 * `skipToMainContent`, which emits `sequentialVideoEnded` → `onEventVideoEnded`
 * → `currentShowcaseStage = 'main_content'`, which would unmount this very
 * stage mid-dissolve. `preRevealMainContent` only mounts the slot.
 */
const handleTransitionDissolveStart = () => {
  coverStageRef.value?.preRevealMainContent()
}

const handleTransitionComplete = () => {
  // Tell CoverStage to reveal the main content slot (triggers video phase change)
  if (coverStageRef.value) {
    coverStageRef.value.revealMainContent()
  }
  // Set stage to main_content and start music
  onTransitionComplete(eventMusicUrl.value || undefined, musicStartTime.value, musicEndTime.value)
}

const handleMainContentViewed = () => {
  // Mark that user has seen the main content stage
  markMainContentSeen()
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
      title: `${eventData.title} - សូមគោរពអញ្ជើញ ភ្ញៀវកិត្តិយស`,
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

  // Check for pending Telegram login (e.g., user navigated back from Telegram in Messenger)
  // If there's a pending login and user is not authenticated, open the auth modal
  // The AuthModal will automatically resume polling for the pending login
  if (!authStore.isAuthenticated && getPendingLogin()) {
    // Defer opening auth modal to after showcase loads for better UX
    nextTick(() => {
      openAuthModal()
    })
  }

  // Initialize showcase - video resource manager is provided via Vue's provide/inject pattern
  await loadShowcase()

  // Preload logo once event data is loaded
  if (event.value?.logo_one) {
    preloadLogo(event.value.logo_one)
  }

  // Setup asset protection (production-only)
  setupProtection()
})

onUnmounted(() => {
  // Hand page scrolling back to the rest of the app
  document.documentElement.classList.remove(VIEWPORT_LOCK_CLASS)
  // Cleanup asset protection event listeners
  cleanupProtection()
  // All other cleanup is handled by the composable's onUnmounted hook
  // No additional manual cleanup needed as we're using proper Vue provide/inject pattern
})
</script>

<style scoped>
/* V2 storybook template root: normal document flow so the page scrolls and
   ScrollTrigger can use the window as its scroller */
.v2-showcase-root {
  width: 100%;
  min-height: 100svh;
  background: #faf6f0;
}

/* Door transition hand-off: the stage emits `transitionComplete` while its gold
   bloom is still at full strength, so the bloom dissolves over the main content
   that mounts underneath at that same moment rather than cutting to it. */
.door-transition-out-leave-active {
  transition: opacity 0.8s ease-out;
}

.door-transition-out-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .door-transition-out-leave-active {
    transition-duration: 0.3s;
  }
}

/* Container Styles */
/* Heights are `dvh`, not `vh`: on mobile `100vh` resolves to the *large*
   viewport (the height the page would have if the browser chrome were hidden),
   so with the URL bar showing the stage was ~50-110px taller than the visible
   area and its bottom edge was cut off. `dvh` tracks whatever is actually
   visible, so the frame fits both before and after the chrome collapses.
   The plain `vh` line above each is the fallback for pre-2022 browsers. */
.showcase-wrapper {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000; /* Fallback */
  overflow: hidden;
}

.showcase-container {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  position: relative;
  overflow: hidden;
  margin: 0 auto;
  /* One curve for the whole cover → transition → main-content chain. The cover's
     ornaments sliding out and the invitation's sliding back in are the same
     gesture reversed, so they must not be shaped differently — and the built-in
     `ease-out` they both used is too weak to shape an 0.8s travel. Declared here
     because every stage renders inside this element and custom properties cross
     scoped-style boundaries; each consumer still carries the literal as a
     fallback, for the manage-page preview frame, which mounts these components
     without this container. Matches TransitionStage's own --ts-ease-out. */
  --sc-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
}

/* Small mobile phones only - full width */
@media (max-width: 480px) and (max-height: 800px) {
  .showcase-container {
    max-width: 480px;
    max-height: 1920px;
  }
}

/* All other devices - consistent desktop sizing with 100% height priority */
/* Width is derived from the same visible height so the frame keeps its 1080/1920
   ratio; TransitionStageDoor's `--dt-w` mirrors this formula and must match. */
@media (min-width: 481px), (min-height: 801px) {
  .showcase-container {
    width: calc(100vh * (1080 / 1920));
    width: calc(100dvh * (1080 / 1920));
    max-width: calc(100vh * (1080 / 1920));
    max-width: calc(100dvh * (1080 / 1920));
  }
}
</style>
