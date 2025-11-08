<template>
  <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
    <div class="mb-4">
      <h5 class="font-semibold text-slate-900 mb-2">Social Media Preview</h5>
      <p class="text-sm text-slate-600 mb-4">
        Preview how your event showcase will appear when shared on social media
      </p>
    </div>

    <div class="space-y-6">
      <!-- Platform Selector -->
      <div class="overflow-x-auto scrollbar-hide">
        <div class="flex space-x-2 bg-slate-100 rounded-xl p-1 min-w-max sm:min-w-0">
          <button
            v-for="platform in platforms"
            :key="platform.id"
            @click="selectedPlatform = platform.id"
            :class="[
              'flex-shrink-0 sm:flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-1.5 sm:space-x-2',
              selectedPlatform === platform.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:bg-white/50',
            ]"
          >
            <component :is="platform.icon" class="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span class="whitespace-nowrap text-xs sm:text-sm">{{ platform.name }}</span>
          </button>
        </div>
      </div>

      <!-- Showcase URL Display -->
      <div class="space-y-2">
        <label class="block text-xs sm:text-sm font-medium text-slate-700">Social Media Sharing URL</label>
        <p class="text-[10px] sm:text-xs text-slate-500 mb-2">
          This URL is optimized for social media previews and will redirect to your showcase page
        </p>
        <div class="flex space-x-1.5 sm:space-x-2">
          <input
            :value="showcaseUrl"
            readonly
            class="flex-1 px-2 py-2 sm:px-4 sm:py-3 border border-slate-300 rounded-lg sm:rounded-xl bg-slate-50 text-slate-600 focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-colors duration-200 text-xs sm:text-base min-w-0"
          />
          <button
            @click="copyToClipboard"
            :class="[
              'px-2 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 flex items-center space-x-1 sm:space-x-2 flex-shrink-0',
              copied ? 'bg-green-500 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700',
            ]"
          >
            <Check v-if="copied" class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <Copy v-else class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span class="text-xs sm:text-base">{{ copied ? 'Copied!' : 'Copy' }}</span>
          </button>
        </div>
      </div>

      <!-- Social Media Preview Cards -->
      <div class="space-y-4">
        <!-- Facebook/Meta Preview -->
        <div
          v-if="selectedPlatform === 'facebook'"
          class="border border-gray-300 rounded-xl overflow-hidden bg-white"
        >
          <div class="aspect-[1.91/1] relative overflow-hidden bg-slate-200">
            <img
              v-if="previewImage"
              :src="previewImage"
              :alt="eventData?.title || 'Event Preview'"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <ImageIcon class="w-16 h-16 text-slate-400" />
            </div>
          </div>
          <div class="p-4">
            <div class="text-sm text-gray-600 uppercase tracking-wide mb-1">{{ hostname }}</div>
            <div class="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{{ metaTitle }}</div>
            <div class="text-sm text-gray-600 line-clamp-3">{{ metaDescription }}</div>
          </div>
        </div>

        <!-- Twitter/X Preview -->
        <div
          v-if="selectedPlatform === 'twitter'"
          class="border border-gray-300 rounded-2xl overflow-hidden bg-white"
        >
          <div class="aspect-[2/1] relative overflow-hidden bg-slate-200">
            <img
              v-if="previewImage"
              :src="previewImage"
              :alt="eventData?.title || 'Event Preview'"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <ImageIcon class="w-16 h-16 text-slate-400" />
            </div>
          </div>
          <div class="p-4">
            <div class="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{{ metaTitle }}</div>
            <div class="text-sm text-gray-600 mb-2 line-clamp-2">{{ metaDescription }}</div>
            <div class="text-sm text-gray-500">{{ hostname }}</div>
          </div>
        </div>

        <!-- LinkedIn Preview -->
        <div
          v-if="selectedPlatform === 'linkedin'"
          class="border border-gray-300 rounded-lg overflow-hidden bg-white"
        >
          <div class="aspect-[1.2/1] relative overflow-hidden bg-slate-200">
            <img
              v-if="previewImage"
              :src="previewImage"
              :alt="eventData?.title || 'Event Preview'"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <ImageIcon class="w-16 h-16 text-slate-400" />
            </div>
          </div>
          <div class="p-4">
            <div class="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{{ metaTitle }}</div>
            <div class="text-sm text-gray-600 mb-2 line-clamp-3">{{ metaDescription }}</div>
            <div class="text-sm text-gray-500">{{ hostname }}</div>
          </div>
        </div>

        <!-- WhatsApp Preview -->
        <div v-if="selectedPlatform === 'whatsapp'" class="bg-gray-100 rounded-2xl p-4">
          <div class="bg-white rounded-xl overflow-hidden shadow-sm">
            <div class="aspect-[1.91/1] relative overflow-hidden bg-slate-200">
              <img
                v-if="previewImage"
                :src="previewImage"
                :alt="eventData?.title || 'Event Preview'"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <ImageIcon class="w-16 h-16 text-slate-400" />
              </div>
            </div>
            <div class="p-4">
              <div class="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
                {{ metaTitle }}
              </div>
              <div class="text-sm text-gray-600 mb-2 line-clamp-2">{{ metaDescription }}</div>
              <div class="text-xs text-gray-500 uppercase tracking-wide">{{ hostname }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 sm:gap-3">
        <a
          :href="directShowcaseUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-1.5 sm:space-x-2 text-sm sm:text-base"
        >
          <ExternalLink class="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          <span class="hidden sm:inline">Open Showcase</span>
          <span class="sm:hidden">Open</span>
        </a>
        <button
          @click="shareOnPlatform"
          class="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-1.5 sm:space-x-2 text-sm sm:text-base"
        >
          <Share2 class="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          <span class="hidden sm:inline">Share on {{ platforms.find((p) => p.id === selectedPlatform)?.name }}</span>
          <span class="sm:hidden">Share</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Copy,
  Check,
  ImageIcon,
  ExternalLink,
  Share2,
} from 'lucide-vue-next'
import type { Event } from '../services/api'
import { createEventDescription, getSSRMetaUrl } from '../utils/metaUtils'

interface Props {
  eventData?: Event
  guestName?: string
  language?: string
}

const props = withDefaults(defineProps<Props>(), {
  language: 'en',
})

// State
const selectedPlatform = ref<string>('facebook')
const copied = ref(false)

// Platform configurations
const platforms = [
  { id: 'facebook', name: 'Facebook', icon: Facebook },
  { id: 'twitter', name: 'X (Twitter)', icon: Twitter },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle },
]

// Computed properties
const showcaseUrl = computed(() => {
  if (!props.eventData?.id) return ''
  // Use SSR meta URL for social media sharing with optional guest name and language
  return getSSRMetaUrl(props.eventData.id, {
    guestName: props.guestName,
    language: props.language,
  })
})

const directShowcaseUrl = computed(() => {
  if (!props.eventData?.id) return ''
  const baseUrl = window.location.origin
  const url = new URL(`${baseUrl}/events/${props.eventData.id}/showcase`)

  // Add guest name and language parameters if provided
  if (props.guestName) {
    url.searchParams.append('guest_name', props.guestName)
  }
  if (props.language) {
    url.searchParams.append('lang', props.language)
  }

  return url.toString()
})

const hostname = computed(() => {
  return window.location.hostname
})

// Match the exact title we set in meta tags
const metaTitle = computed(() => {
  if (!props.eventData?.title) return 'Event Invitation'
  return `${props.eventData.title} - Event Invitation`
})

// Use the same description logic as meta tags
const metaDescription = computed(() => {
  if (!props.eventData) return 'Event description will appear here.'
  return createEventDescription(props.eventData as unknown as Record<string, unknown>)
})

const previewImage = computed(() => {
  if (!props.eventData?.banner_image) return null

  const bannerImage = props.eventData.banner_image

  // If it's already a full URL, return as is
  if (bannerImage.startsWith('http://') || bannerImage.startsWith('https://')) {
    return bannerImage
  }

  // If it's a relative URL, prepend the API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  if (bannerImage.startsWith('/')) {
    return `${API_BASE_URL}${bannerImage}`
  }

  // If it doesn't start with /, assume it needs /media/ prefix
  return `${API_BASE_URL}/media/${bannerImage}`
})

// Methods
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(showcaseUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = showcaseUrl.value
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)

    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

const shareOnPlatform = () => {
  const url = encodeURIComponent(showcaseUrl.value)
  const title = encodeURIComponent(metaTitle.value)

  let shareUrl = ''

  switch (selectedPlatform.value) {
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
      break
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`
      break
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
      break
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${title}%20${url}`
      break
  }

  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
