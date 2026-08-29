<template>
  <div v-if="youtubeEmbedLink" class="mb-8">
    <!-- Video Header -->
    <div class="text-center laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8 laptop-sm:-mt-2 laptop-md:-mt-2 laptop-lg:-mt-3">
      <h2
        :class="[
          'leading-tight text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-regular sm:mb-4 md:mb-6 capitalize video-header',
          currentLanguage === 'kh' && 'khmer-text-fix',
        ]"
        :style="{
          fontFamily: primaryFont || currentFont,
          color: primaryColor,
        }"
      >
        {{ videoHeaderText }}
      </h2>
    </div>

    <!--
      Poster facade. The iframe is deliberately NOT mounted here. An embed
      paints YouTube's own title bar, channel avatar, share/link buttons and a
      "Watch on YouTube" bar directly onto the invitation - the one surface in
      this product that has to look like nobody else's. The facade is our
      frame, our poster and our play control; the player only ever exists
      inside the lightbox below, on black, where that chrome belongs.

      It is also the cheaper path: the previous version loaded the YouTube
      iframe API plus a full embed on mount for every guest, whether or not
      anyone pressed play. Now that cost is paid on the press.
    -->
    <button
      ref="frameRef"
      type="button"
      class="video-frame"
      :class="{ 'is-revealed': hasRevealed }"
      :style="{ '--vf-ink': primaryColor }"
      :aria-label="playLabel"
      @click="openPlayer"
    >
      <img
        v-if="posterSrc"
        class="video-poster"
        :src="posterSrc"
        alt=""
        decoding="async"
        loading="lazy"
        @load="handlePosterLoad"
        @error="handlePosterError"
      />
      <span class="video-scrim" aria-hidden="true"></span>
      <span class="video-mat" aria-hidden="true"></span>
      <span class="video-sheen" aria-hidden="true"></span>
      <span class="video-play" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M9.4 6.2 18.2 12l-8.8 5.8z" fill="currentColor" />
        </svg>
      </span>
    </button>
  </div>

  <!--
    Teleported: the invitation card is `overflow: hidden` with a
    backdrop-filter, and a backdrop-filtered ancestor becomes the containing
    block for `position: fixed`, so an overlay rendered in place would be
    clipped into the card instead of covering the viewport.
  -->
  <Teleport to="body">
    <Transition name="vlb">
      <div
        v-if="isOpen"
        class="video-lightbox"
        role="dialog"
        aria-modal="true"
        :aria-label="videoHeaderText"
        @click="closePlayer"
      >
        <button type="button" class="vlb-close" :aria-label="closeLabel" @click.stop="closePlayer">
          <X class="w-5 h-5" />
        </button>

        <div class="vlb-stage" @click.stop>
          <iframe
            :id="iframeId"
            :src="playerSrc"
            width="100%"
            height="100%"
            style="border: 0; display: block"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            :allowfullscreen="true"
            referrerpolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'

interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  youtubeEmbedLink?: string | null | undefined
  primaryColor: string
  secondaryColor?: string
  accentColor: string
  currentFont?: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  isMusicPlaying?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'video-state-change': [isPlaying: boolean]
}>()

// Video state
const isOpen = ref(false)
const isVideoPlaying = ref(false)
const musicStateBeforeVideo = ref(false)
const iframeId = ref(`youtube-player-${Math.random().toString(36).slice(2, 11)}`)
let player: any = null
let isYouTubeAPIReady = false

// Extract video ID from YouTube URL
const extractVideoId = (url: string): string | null => {
  if (!url) return null

  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/embed\/)([\w-]+)/,
    /(?:youtube\.com\/watch\?v=)([\w-]+)/,
    /(?:youtu\.be\/)([\w-]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

const videoId = computed(() =>
  props.youtubeEmbedLink ? extractVideoId(props.youtubeEmbedLink) : null,
)

/**
 * Poster ladder. `maxresdefault` is the only 16:9 still large enough for a
 * full-width frame on a retina phone, but it does not exist for every upload -
 * YouTube then answers with a 120x90 grey placeholder, sometimes as a 200, so
 * a bare `@error` handler cannot detect it (see `handlePosterLoad`).
 * `hqdefault` always exists; it is 4:3 with letterbox bars, which
 * `object-fit: cover` crops back off.
 */
const POSTER_QUALITIES = ['maxresdefault', 'hqdefault'] as const
const posterQualityIndex = ref(0)

const posterSrc = computed(() => {
  if (!videoId.value) return ''
  const quality = POSTER_QUALITIES[posterQualityIndex.value]
  if (!quality) return ''
  return `https://i.ytimg.com/vi/${videoId.value}/${quality}.jpg`
})

const nextPosterQuality = () => {
  if (posterQualityIndex.value < POSTER_QUALITIES.length - 1) {
    posterQualityIndex.value += 1
  }
}

const handlePosterError = () => nextPosterQuality()

const handlePosterLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  // The "missing thumbnail" placeholder is 120x90 and loads successfully.
  if (img.naturalWidth > 0 && img.naturalWidth <= 121) {
    nextPosterQuality()
  }
}

/**
 * Player URL. Every flag that can be turned off is turned off: `rel=0` keeps
 * end-screen suggestions inside the same channel, `iv_load_policy=3` drops
 * annotations, `playsinline=1` keeps iOS inside our overlay rather than handing
 * playback to the system player, and `color=white` replaces YouTube red in the
 * progress bar.
 */
const playerSrc = computed(() => {
  if (!videoId.value) return ''
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const params = new URLSearchParams({
    enablejsapi: '1',
    autoplay: '1',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    color: 'white',
  })
  if (origin) params.set('origin', origin)
  return `https://www.youtube.com/embed/${videoId.value}?${params.toString()}`
})

// Load YouTube iFrame API - only ever called once the guest has pressed play.
const loadYouTubeAPI = () => {
  if (window.YT && window.YT.Player) {
    isYouTubeAPIReady = true
    initializePlayer()
    return
  }

  // Check if script is already loading
  if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
    // Wait for API to be ready
    const checkAPI = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkAPI)
        isYouTubeAPIReady = true
        initializePlayer()
      }
    }, 100)
    return
  }

  // Load the API
  const tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'
  const firstScriptTag = document.getElementsByTagName('script')[0]
  firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

  // Set up ready callback
  window.onYouTubeIframeAPIReady = () => {
    isYouTubeAPIReady = true
    initializePlayer()
  }
}

/**
 * Attaches to the iframe that is already playing rather than constructing a
 * player from scratch. The `autoplay=1` in the src means the film starts the
 * moment the overlay opens, whether or not the API script ever arrives - if it
 * is blocked, the only thing lost is the background-music pause.
 */
const initializePlayer = () => {
  if (!isYouTubeAPIReady || !window.YT || !window.YT.Player) return
  if (player) return

  const iframe = document.getElementById(iframeId.value)
  if (!iframe) return

  try {
    player = new window.YT.Player(iframeId.value, {
      events: {
        onStateChange: onPlayerStateChange,
      },
    })
  } catch (error) {
    console.warn('Failed to initialize YouTube player:', error)
  }
}

const destroyPlayer = () => {
  if (player && player.destroy) {
    try {
      player.destroy()
    } catch (error) {
      console.warn('Error destroying YouTube player:', error)
    }
  }
  player = null
}

// Handle player state changes
const onPlayerStateChange = (event: any) => {
  const playerState = event.data

  // YT.PlayerState.PLAYING = 1
  // YT.PlayerState.PAUSED = 2
  // YT.PlayerState.ENDED = 0

  if (playerState === 1) {
    // Video started playing
    if (!isVideoPlaying.value) {
      musicStateBeforeVideo.value = props.isMusicPlaying || false
      isVideoPlaying.value = true
      emit('video-state-change', true)
    }
  } else if (playerState === 2 || playerState === 0) {
    // Video paused or ended
    if (isVideoPlaying.value) {
      isVideoPlaying.value = false
      emit('video-state-change', false)
    }
  }
}

/**
 * Only provided by the editable manage-page preview frame. There, the whole
 * section sits inside an `EditableRegion` whose click handler opens the video
 * editor — so a press on the poster must not also open the lightbox, or the
 * organizer gets the drawer and a playing film at once.
 */
const editIntentCtx = inject(EditIntentKey, undefined)

const openPlayer = () => {
  if (!videoId.value || editIntentCtx) return
  isOpen.value = true
  // The music duck is normally driven by the player's own state change, but
  // that only arrives if the API loads. Autoplay means sound is coming either
  // way, so duck on open and let the API refine it afterwards.
  if (!isVideoPlaying.value) {
    musicStateBeforeVideo.value = props.isMusicPlaying || false
    isVideoPlaying.value = true
    emit('video-state-change', true)
  }
  nextTick(() => loadYouTubeAPI())
}

const closePlayer = () => {
  if (!isOpen.value) return
  destroyPlayer()
  isOpen.value = false
  if (isVideoPlaying.value) {
    isVideoPlaying.value = false
    emit('video-state-change', false)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closePlayer()
}

watch(isOpen, (open) => {
  if (open) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})

/**
 * One-time entrance for the poster: a light sweep across the still and a bloom
 * on the play badge, fired when the frame first scrolls into view and never
 * again. Deliberately not a loop - an ambient shimmer would sit in the
 * reader's peripheral vision for the whole invitation, which is the same
 * reason the section dividers had their idle glow removed.
 */
const frameRef = ref<HTMLElement | null>(null)
const hasRevealed = ref(false)
let revealObserver: IntersectionObserver | null = null
let revealFallback: ReturnType<typeof setTimeout> | null = null

const markRevealed = () => {
  hasRevealed.value = true
  revealObserver?.disconnect()
  revealObserver = null
  if (revealFallback) {
    clearTimeout(revealFallback)
    revealFallback = null
  }
}

const observeReveal = () => {
  if (!frameRef.value || typeof IntersectionObserver === 'undefined') {
    markRevealed()
    return
  }

  const scrollContainer = document.querySelector('.liquid-glass-card .custom-scrollbar')

  revealObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) markRevealed()
    },
    { root: scrollContainer, threshold: 0.25 },
  )
  revealObserver.observe(frameRef.value)

  // The play badge starts hidden so it can bloom in, which makes the reveal a
  // correctness dependency, not just a flourish: if the observer never reports
  // (a root that resolved to the wrong element, a stage that rebuilds the
  // scroll container under it) the guest would be left looking at a poster with
  // no play control. Reveal unconditionally after a few seconds.
  revealFallback = setTimeout(markRevealed, 4000)
}

// Enhanced translation function that combines database content with frontend translations
const getTextContent = (textType: string, fallback = ''): string => {
  // First, try to get content from database (eventTexts)
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(
      (text) => text.text_type === textType && text.language === props.currentLanguage,
    )
    if (text?.content) {
      return text.content
    }
  }

  // Fallback to frontend translation system
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'

  // Map text types to translation keys
  const keyMap: Record<
    string,
    keyof typeof import('../../utils/translations').rsvpTranslations.en
  > = {
    video_header: 'video_header',
  }

  const translationKey = keyMap[textType]
  if (translationKey) {
    return translateRSVP(translationKey, currentLang)
  }

  return fallback
}

const videoHeaderText = computed(() => getTextContent('video_header', 'Video'))
const playLabel = computed(() =>
  translateRSVP('video_play', (props.currentLanguage as SupportedLanguage) || 'en'),
)
const closeLabel = computed(() =>
  translateRSVP('video_close', (props.currentLanguage as SupportedLanguage) || 'en'),
)

onMounted(() => {
  if (props.youtubeEmbedLink) {
    observeReveal()
  }
})

onUnmounted(() => {
  destroyPlayer()
  document.removeEventListener('keydown', handleKeydown)
  revealObserver?.disconnect()
  revealObserver = null
  if (revealFallback) {
    clearTimeout(revealFallback)
    revealFallback = null
  }
})

// Extend Window interface for TypeScript
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}
</script>

<style scoped>
/* Khmer text fix now defined globally in src/assets/main.css */

/* ============================================================
   POSTER FACADE
   ============================================================ */

.video-frame {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  padding: 0;
  overflow: hidden;
  border: 1.5px solid var(--vf-ink);
  border-radius: 0.75rem;
  background: rgba(0, 0, 0, 0.55);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  /* A large surface needs a smaller press scale than a button does for the
     movement to read as the same amount. */
  transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1);
}

.video-frame:active {
  transform: scale(0.985);
}

.video-frame:focus-visible {
  outline: 2px solid var(--vf-ink);
  outline-offset: 3px;
}

.video-poster {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* `cover` also crops the letterbox bars off the 4:3 `hqdefault` fallback. */
  object-fit: cover;
  display: block;
}

/* Darkens the still just enough for the badge to hold its edge on a bright
   frame, without flattening the photograph. Heaviest at the centre, where the
   badge sits. */
.video-scrim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(0, 0, 0, 0.42) 0%,
    rgba(0, 0, 0, 0.12) 55%,
    rgba(0, 0, 0, 0.3) 100%
  );
  pointer-events: none;
}

/* Inner mat rule, in light rather than in the template ink: a second red line
   3px inside the first reads as a mistake, a hairline of light reads as a
   mounted print. */
.video-mat {
  position: absolute;
  inset: 5px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.45rem;
  pointer-events: none;
}

.video-sheen {
  position: absolute;
  top: -25%;
  bottom: -25%;
  left: -60%;
  width: 45%;
  background: linear-gradient(
    100deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.26) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: translateX(0) skewX(-12deg);
  opacity: 0;
  pointer-events: none;
}

.video-frame.is-revealed .video-sheen {
  animation: vfSheen 900ms cubic-bezier(0.23, 1, 0.32, 1) 220ms 1 both;
}

@keyframes vfSheen {
  0% {
    transform: translateX(0) skewX(-12deg);
    opacity: 0;
  }
  25% {
    opacity: 1;
  }
  100% {
    transform: translateX(360%) skewX(-12deg);
    opacity: 0;
  }
}

.video-play {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 62px;
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  /* The template's own ink, never YouTube red - the badge has to belong to the
     invitation, not to the platform hosting the file. */
  background: var(--vf-ink);
  color: #fff;
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.45),
    0 0 0 9px rgba(255, 255, 255, 0.12);
  /* Separate longhands: the badge is centred with `translate`, which leaves
     `scale` free to carry the press and hover states without restating the
     offset every time. */
  translate: -50% -50%;
  scale: 0.88;
  opacity: 0;
  pointer-events: none;
  transition:
    scale 200ms cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 200ms ease;
}

.video-play svg {
  width: 26px;
  height: 26px;
  /* Optical centring: a triangle's visual centre sits left of its bounding box. */
  margin-left: 3px;
}

.video-frame.is-revealed .video-play {
  animation: vfBloom 420ms cubic-bezier(0.23, 1, 0.32, 1) 120ms 1 both;
}

@keyframes vfBloom {
  from {
    scale: 0.88;
    opacity: 0;
  }
  to {
    scale: 1;
    opacity: 1;
  }
}

.video-frame.is-revealed:active .video-play {
  scale: 0.94;
}

@media (hover: hover) and (pointer: fine) {
  .video-frame.is-revealed:hover .video-play {
    scale: 1.06;
    box-shadow:
      0 14px 34px rgba(0, 0, 0, 0.45),
      0 0 0 1px rgba(255, 255, 255, 0.55),
      0 0 0 14px rgba(255, 255, 255, 0.14);
  }
}

@media (min-width: 640px) {
  .video-play {
    width: 74px;
    height: 74px;
  }

  .video-play svg {
    width: 30px;
    height: 30px;
  }
}

/* ============================================================
   LIGHTBOX
   ============================================================ */

.video-lightbox {
  position: fixed;
  inset: 0;
  /* Above the floating action menu (10003) so nothing overlaps the film. */
  z-index: 10050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.94);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  overscroll-behavior: contain;
}

.vlb-stage {
  position: relative;
  width: min(96vw, calc((100dvh - 7rem) * 16 / 9));
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 0.75rem;
  background: #000;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
}

.vlb-close {
  position: absolute;
  top: max(1rem, env(safe-area-inset-top));
  right: 1rem;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.92);
  cursor: pointer;
  transition:
    transform 160ms cubic-bezier(0.23, 1, 0.32, 1),
    background-color 160ms ease;
}

.vlb-close:active {
  transform: scale(0.94);
}

@media (hover: hover) and (pointer: fine) {
  .vlb-close:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

/* Enter is slower than exit: opening is the moment worth watching, closing
   should get out of the way. Origin stays centred - this is a modal, not a
   popover anchored to its trigger. */
.vlb-enter-active {
  transition: opacity 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

.vlb-leave-active {
  transition: opacity 160ms ease-out;
}

.vlb-enter-from,
.vlb-leave-to {
  opacity: 0;
}

.vlb-enter-active .vlb-stage {
  transition:
    transform 260ms cubic-bezier(0.23, 1, 0.32, 1),
    opacity 260ms cubic-bezier(0.23, 1, 0.32, 1);
}

.vlb-leave-active .vlb-stage {
  transition:
    transform 160ms ease-out,
    opacity 160ms ease-out;
}

.vlb-enter-from .vlb-stage {
  transform: scale(0.96);
  opacity: 0;
}

.vlb-leave-to .vlb-stage {
  transform: scale(0.98);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .video-frame,
  .video-frame:active {
    transform: none;
  }

  .video-frame.is-revealed .video-sheen {
    animation: none;
    opacity: 0;
  }

  .video-frame.is-revealed .video-play {
    animation: none;
    scale: 1;
    opacity: 1;
  }

  .vlb-enter-from .vlb-stage,
  .vlb-leave-to .vlb-stage {
    transform: none;
  }
}

/* Small laptops 13-inch (laptop-sm: 1024px) - Scaled to 67.5% matching mobile exactly */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Header text - scaled to 67.5% from mobile md:text-3xl (1.875rem) */
  .video-header {
    font-size: 1.265625rem !important; /* 1.875rem * 0.675 - exact mobile ratio */
    line-height: 1.25 !important; /* Match mobile leading-tight */
    padding-top: 0rem !important; /* Removed top padding to reduce space */
    padding-bottom: 0.3375rem !important; /* 0.5rem * 0.675 (py-2) */
    margin-bottom: 1.0125rem !important; /* 1.5rem * 0.675 from md:mb-6 */
  }
}

/* Medium laptops 14-15 inch (laptop-md: 1366px+) - Scaled to 75% matching mobile exactly */
@media (min-width: 1366px) and (max-width: 1535px) {
  /* Header text - scaled to 75% from mobile md:text-3xl (1.875rem) */
  .video-header {
    font-size: 1.40625rem !important; /* 1.875rem * 0.75 - exact mobile ratio */
    line-height: 1.25 !important; /* Match mobile leading-tight */
    padding-top: 0rem !important; /* Removed top padding to reduce space */
    padding-bottom: 0.375rem !important; /* 0.5rem * 0.75 (py-2) */
    margin-bottom: 1.125rem !important; /* 1.5rem * 0.75 from md:mb-6 */
  }
}

/* Desktop (1536px+) - Simple, clean desktop styles */
@media (min-width: 1536px) {
  h2 {
    font-size: 1.875rem !important; /* 30px - text-3xl */
  }
}
</style>
