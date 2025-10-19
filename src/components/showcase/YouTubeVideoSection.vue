<template>
  <div v-if="youtubeEmbedLink" class="mb-8">
    <!-- Video Header -->
    <div class="text-center laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8">
      <h2
        :class="[
          'leading-tight py-2 text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-semibold sm:mb-4 md:mb-6 capitalize',
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
    <div
      class="aspect-video rounded-xl overflow-hidden"
      :style="{
        border: `1.5px solid ${primaryColor}`,
      }"
    >
      <iframe
        :id="iframeId"
        :src="embedUrl"
        width="100%"
        height="100%"
        style="border: 0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        :allowfullscreen="true"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
const isVideoPlaying = ref(false)
const musicStateBeforeVideo = ref(false)
const iframeId = ref(`youtube-player-${Math.random().toString(36).substr(2, 9)}`)
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

// Build embed URL with enablejsapi parameter
const embedUrl = computed(() => {
  if (!props.youtubeEmbedLink) return ''

  const videoId = extractVideoId(props.youtubeEmbedLink)
  if (!videoId) return props.youtubeEmbedLink

  // Add enablejsapi=1 to allow API control
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`
})

// Load YouTube iFrame API
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

// Initialize YouTube player
const initializePlayer = () => {
  if (!isYouTubeAPIReady || !window.YT || !window.YT.Player) return

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

onMounted(() => {
  if (props.youtubeEmbedLink) {
    loadYouTubeAPI()
  }
})

onUnmounted(() => {
  // Cleanup player
  if (player && player.destroy) {
    try {
      player.destroy()
    } catch (error) {
      console.warn('Error destroying YouTube player:', error)
    }
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
.glass-section {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Enhanced Khmer font rendering */
.khmer-text-fix {
  line-height: 1.8 !important;
  padding-top: 0.3em !important;
  padding-bottom: 0.3em !important;
  margin-top: 0.2em;
  margin-bottom: 0.2em;
}

/* Small laptops 13-inch (1024px-1365px) - Compact sizes */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Header text - match AgendaSection */
  h2 {
    font-size: 1.5rem !important; /* 24px - text-2xl */
  }
}

/* Medium laptops 14-15 inch (1366px+) */
@media (min-width: 1366px) {
  h2 {
    font-size: 1.875rem !important; /* 30px - text-3xl */
  }
}
</style>
