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
    <div v-else-if="showcaseData" class="showcase-container relative bg-black">
      <!-- Stage 1: Cover Video with Overlay -->
      <div v-if="!isEnvelopeOpened" class="absolute inset-0 z-10">
        <!-- Standard Cover Video Loop -->
        <video
          v-if="templateAssets?.standard_cover_video"
          :src="getMediaUrl(templateAssets.standard_cover_video)"
          autoplay
          loop
          muted
          playsinline
          class="absolute inset-0 w-full h-full object-cover"
        />
        
        <!-- Fallback Background Image -->
        <div v-else-if="templateAssets?.basic_background_photo" class="absolute inset-0">
          <img 
            :src="getMediaUrl(templateAssets.basic_background_photo)" 
            alt="Background"
            class="w-full h-full object-cover"
          />
        </div>

        <!-- Dark Overlay -->
        <div class="absolute inset-0 bg-black/30"></div>

        <!-- Content Overlay -->
        <div class="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <!-- Guest Name -->
          <div v-if="guestName" class="mb-8 animate-fadeIn">
            <p class="text-2xl mb-3" :style="{ color: 'rgba(255, 255, 255, 0.8)' }">Dear</p>
            <h2 class="text-5xl font-bold" :style="{ 
              fontFamily: currentFont,
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }">
              {{ guestName }}
            </h2>
          </div>

          <!-- Welcome Text -->
          <div class="mb-12 animate-fadeIn animation-delay-200">
            <p class="text-2xl mb-2" :style="{ color: 'rgba(255, 255, 255, 0.9)' }">You're Invited to</p>
            <h1 class="text-6xl font-bold" :style="{ 
              fontFamily: currentFont,
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }">
              {{ event.title }}
            </h1>
          </div>

          <!-- Open Envelope Button -->
          <button
            @click="openEnvelope"
            class="animate-pulse hover:animate-none transform hover:scale-110 transition-all duration-300"
          >
            <img 
              v-if="templateAssets?.open_envelope_button"
              :src="getMediaUrl(templateAssets.open_envelope_button)" 
              alt="Open Invitation"
              class="w-72 h-auto cursor-pointer drop-shadow-2xl"
            />
            <div v-else class="px-12 py-6 rounded-full shadow-2xl transition-all hover:scale-105" 
              :style="{ 
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
                backdropFilter: 'blur(10px)'
              }">
              <span class="text-2xl font-bold text-white">Open Invitation</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Stage 2: Event Video -->
      <div v-else-if="isPlayingEventVideo" class="absolute inset-0 z-20 bg-black">
        <template v-if="eventVideoUrl">
          <!-- Loading indicator while video loads -->
          <div v-if="videoLoading" class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
                :style="{ borderBottomColor: primaryColor || '#3B82F6' }"></div>
              <p class="text-xl font-medium" 
                :style="{ color: primaryColor || '#FFFFFF' }">Loading video...</p>
            </div>
          </div>
          
          <!-- Video without controls (non-interactive) -->
          <video
            ref="eventVideoRef"
            :src="eventVideoUrl"
            autoplay
            playsinline
            @loadstart="videoLoading = true"
            @canplay="onVideoCanPlay"
            @ended="onEventVideoEnded"
            @error="onEventVideoError"
            class="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
        </template>
        
        <!-- No video available - auto proceed -->
        <div v-else class="absolute inset-0 flex items-center justify-center">
          <div class="text-center">
            <p class="text-xl font-medium" 
              :style="{ color: primaryColor || '#FFFFFF' }">Preparing your invitation...</p>
          </div>
        </div>
      </div>

      <!-- Stage 3: Background Video with Info Box -->
      <div v-else class="absolute inset-0">
        <!-- Standard Background Video Loop -->
        <video
          v-if="templateAssets?.standard_background_video"
          :src="getMediaUrl(templateAssets.standard_background_video)"
          autoplay
          loop
          muted
          playsinline
          class="absolute inset-0 w-full h-full object-cover"
        />
        
        <!-- Fallback Background - Plain Black -->
        <div v-else class="absolute inset-0 bg-black"></div>

        <!-- Liquid Glass Floating Box Container -->
        <div class="absolute inset-0 overflow-hidden">
          <div class="absolute inset-0 overflow-y-auto custom-scrollbar">
            <div class="min-h-full py-12 px-6 flex items-start justify-center">
              <!-- Liquid Glass Card -->
              <div class="liquid-glass-card animate-slideUp">
                <!-- Glass Background Effects -->
                <div class="glass-background"></div>
                
                <!-- Content Container with Scroll -->
                <div class="relative z-10 h-full overflow-y-auto custom-scrollbar">
                  <div class="p-8">
                  <!-- Welcome Header -->
                  <div class="text-center mb-8">
                    <h1 class="text-xl font-medium mb-2" 
                      :style="{ 
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }">
                      {{ eventTexts.find(text => text.text_type === 'welcome_message')?.content || 'Welcome to Our Event' }}
                    </h1>
                    <!-- Debug info -->
                    <div class="text-xs text-white/70 mt-2">
                      Hosts: {{ hosts.length }}, AgendaItems: {{ agendaItems.length }}, EventTexts: {{ eventTexts.length }}
                    </div>
                  </div>

                  <!-- Host Information -->
                  <div class="mb-4">
                    <div class="text-xs text-white/50 mb-2">Host Info Component ({{ hosts.length }} hosts)</div>
                    <HostInfo
                      :hosts="hosts"
                      :logo-url="event.logo_one ? getMediaUrl(event.logo_one) : undefined"
                      :event-initial="event.title?.charAt(0) || 'E'"
                      :primary-color="primaryColor"
                      :secondary-color="secondaryColor"
                      :accent-color="accentColor"
                      :current-font="currentFont"
                    />
                  </div>

                  <!-- Event Information -->
                  <div class="mb-4">
                    <div class="text-xs text-white/50 mb-2">Event Info Component</div>
                    <EventInfo
                      :date-text="eventTexts.find(text => text.text_type === 'date_text')?.content"
                      :time-text="eventTexts.find(text => text.text_type === 'time_text')?.content"
                      :location-text="eventTexts.find(text => text.text_type === 'location_text')?.content"
                      :has-google-map="!!event.google_map_embed_link"
                      :primary-color="primaryColor"
                      :accent-color="accentColor"
                      @open-map="openGoogleMap"
                    />
                  </div>

                

                 

                  

                 

                 

                  <!-- Agenda Section -->
                  <div class="mb-4">
                    <div class="text-xs text-white/50 mb-2">Agenda Section Component ({{ agendaItems.length }} items)</div>
                    <AgendaSection
                      :agenda-items="agendaItems"
                      :primary-color="primaryColor"
                      :secondary-color="secondaryColor"
                      :accent-color="accentColor"
                    />
                  </div>

                  <!-- Map Section -->
                  <div v-if="event.google_map_embed_link" class="mb-6">
                    <h2 class="text-xl font-semibold mb-4" 
                      :style="{ 
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }">Location</h2>
                    <div class="glass-section p-2 rounded-xl">
                      <iframe
                        :src="event.google_map_embed_link"
                        width="100%"
                        height="200"
                        style="border:0; border-radius: 0.75rem;"
                        :allowfullscreen="false"
                        loading="lazy"
                        referrerpolicy="no-referrer-when-downgrade"
                      ></iframe>
                    </div>
                  </div>

                  <!-- Photo Gallery Section -->
                  <div v-if="eventPhotos.length > 0" class="mb-6">
                    <h2 class="text-xl font-semibold mb-4" 
                      :style="{ 
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }">Gallery</h2>
                    
                    <!-- Featured Photo -->
                    <div v-if="eventPhotos.find(photo => photo.is_featured)" class="mb-4">
                      <div class="glass-section p-2 rounded-xl">
                        <img 
                          :src="getMediaUrl(eventPhotos.find(photo => photo.is_featured)?.image || '')"
                          :alt="eventPhotos.find(photo => photo.is_featured)?.caption || 'Featured Event Photo'"
                          class="w-full h-48 object-cover rounded-lg"
                          loading="lazy"
                        />
                        <p v-if="eventPhotos.find(photo => photo.is_featured)?.caption" 
                          class="text-xs mt-2 text-center" 
                          :style="{ color: primaryColor, opacity: '0.8' }">
                          {{ eventPhotos.find(photo => photo.is_featured)?.caption }}
                        </p>
                      </div>
                    </div>
                    
                    <!-- Photo Grid -->
                    <div class="grid grid-cols-2 gap-3">
                      <div 
                        v-for="photo in eventPhotos.filter(photo => !photo.is_featured).slice(0, 4)" 
                        :key="photo.id"
                        class="glass-section p-2 rounded-xl"
                      >
                        <img 
                          :src="getMediaUrl(photo.image)"
                          :alt="photo.caption || 'Event Photo'"
                          class="w-full h-24 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                          loading="lazy"
                          @click="openPhotoModal(photo)"
                        />
                        <p v-if="photo.caption" 
                          class="text-xs mt-1 text-center truncate" 
                          :style="{ color: primaryColor, opacity: '0.7' }">
                          {{ photo.caption }}
                        </p>
                      </div>
                    </div>
                    
                    <!-- View More Button -->
                    <div v-if="eventPhotos.filter(photo => !photo.is_featured).length > 4" class="mt-4 text-center">
                      <button
                        @click="showAllPhotos = !showAllPhotos"
                        class="px-4 py-2 rounded-full text-xs font-medium glass-section flex items-center gap-2 mx-auto transition-all hover:scale-[1.02]"
                        :style="{ 
                          borderColor: primaryColor,
                          color: primaryColor,
                          borderWidth: '1px',
                          borderStyle: 'solid'
                        }"
                      >
                        {{ showAllPhotos ? 'Show Less' : `View All ${eventPhotos.length} Photos` }}
                      </button>
                    </div>
                  </div>

                  <!-- Registration Button -->
                  <div v-if="event.registration_required && !isEventPast" class="mb-6">
                    <button
                      @click="registerForEvent"
                      class="w-full py-3 rounded-xl font-semibold text-white transform hover:scale-[1.02] transition-all shadow-lg"
                      :style="{ 
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})` 
                      }"
                    >
                      Register Now
                    </button>
                  </div>

                  <!-- Footer Section -->
                  <div class="mt-8 pt-6 border-t border-white/10">
                    <div class="text-center space-y-4">
                      <!-- Thank You Message -->
                      <p class="text-sm font-medium" 
                        :style="{ 
                          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }">
                        Thank you
                      </p>
                      
                      <!-- GoEvent Logo/Branding -->
                      <div class="flex items-center justify-center gap-2">
                        <span class="text-lg font-bold" 
                          :style="{ 
                            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }">
                          GoEvent
                        </span>
                      </div>
                      
                      <!-- Contact Info -->
                      <div class="space-y-1">
                        <p class="text-xs" :style="{ color: primaryColor, opacity: '0.7' }">
                          Contact us: info@goevent.com
                        </p>
                        <p class="text-xs" :style="{ color: primaryColor, opacity: '0.7' }">
                          www.goevent.com
                        </p>
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  MapPin,
  Share2
} from 'lucide-vue-next'
import { eventsService, mediaService } from '../services/api'
import LoadingSpinner from '../components/showcase/LoadingSpinner.vue'
import ErrorDisplay from '../components/showcase/ErrorDisplay.vue'
import HostInfo from '../components/showcase/HostInfo.vue'
import EventInfo from '../components/showcase/EventInfo.vue'
import AgendaSection from '../components/showcase/AgendaSection.vue'

const route = useRoute()
const router = useRouter()

// Interfaces
interface Host {
  id: number
  name: string
  title?: string
  bio?: string
  profile_image?: string
  order?: number
  parent_a_name?: string
  parent_b_name?: string
}

interface AgendaItem {
  id: number
  title: string
  description?: string
  color?: string
  date?: string
  start_time_text?: string
  end_time_text?: string
  order?: number
  icon?: {
    id: number
    name: string
    svg_code: string
  }
}

interface EventText {
  id: number
  text_type: string
  language: string
  title?: string
  content: string
  order?: number
}

interface TemplateColor {
  id?: number
  hex_color_code?: string
  hex_code?: string
  name?: string
}

interface TemplateFont {
  id?: number
  language: string
  font_name: string
  font_file?: string
}

interface TemplateAssets {
  template?: {
    id: number
    name: string
    preview_image?: string
  }
  assets?: {
    open_envelope_button?: string
    basic_decoration_photo?: string
    basic_background_photo?: string
    standard_cover_video?: string
    standard_background_video?: string
  }
  colors?: TemplateColor[]
  fonts?: TemplateFont[]
}

interface EventPhoto {
  id: number
  event: string
  image: string
  caption: string
  order: number
  is_featured: boolean
  created_at: string
}

interface EventData {
  id: string
  title: string
  description?: string
  short_description?: string
  start_date: string
  end_date: string
  location?: string
  virtual_link?: string
  is_virtual?: boolean
  banner_image?: string
  logo_one?: string
  logo_two?: string
  event_video?: string
  google_map_embed_link?: string
  registration_required?: boolean
  template_assets?: TemplateAssets
  template_colors?: TemplateColor[]
  template_fonts?: TemplateFont[]
  event_texts?: EventText[]
  hosts?: Host[]
  agenda_items?: AgendaItem[]
  event_photos?: EventPhoto[]
}

interface ShowcaseData {
  event: EventData
  meta: {
    language?: string
    guest_name?: string
    available_languages?: string[]
  }
}

// State
const loading = ref(false)
const error = ref<string | null>(null)
const showcaseData = ref<ShowcaseData | null>(null)
const currentLanguage = ref('en')
const isEnvelopeOpened = ref(false)
const isPlayingEventVideo = ref(false)
const videoLoading = ref(false)
const eventVideoRef = ref<HTMLVideoElement | null>(null)
const activeAgendaTab = ref<string>('')
const showAllPhotos = ref(false)

// Computed properties
const event = computed(() => showcaseData.value?.event || {} as EventData)
const meta = computed(() => showcaseData.value?.meta || {})
const guestName = computed(() => meta.value.guest_name || route.query.guest_name || '')
// const availableLanguages = computed(() => meta.value.available_languages || ['en'])
const templateAssets = computed(() => event.value?.template_assets?.assets || null)
const templateColors = computed(() => {
  // Support both API response formats for colors
  const colors = event.value?.template_colors || event.value?.template_assets?.colors || []
  return colors
})
const templateFonts = computed(() => event.value?.template_fonts || event.value?.template_assets?.fonts || [] as TemplateFont[])
const eventTexts = computed(() => event.value?.event_texts || [] as EventText[])
const hosts = computed(() => event.value?.hosts || [] as Host[])
const agendaItems = computed(() => event.value?.agenda_items || [] as AgendaItem[])
const eventPhotos = computed(() => event.value?.event_photos?.sort((a, b) => a.order - b.order) || [] as EventPhoto[])
const primaryColor = computed(() => {
  const color = templateColors.value[0]
  return color?.hex_color_code || color?.hex_code || '#3B82F6'
})
const secondaryColor = computed(() => {
  const color = templateColors.value[1]
  return color?.hex_color_code || color?.hex_code || null
})
const accentColor = computed(() => {
  const color = templateColors.value[2]
  return color?.hex_color_code || color?.hex_code || primaryColor.value
})
const currentFont = computed(() => {
  const font = templateFonts.value.find(f => f.language === currentLanguage.value)
  return font?.font_name || 'inherit'
})
const isEventPast = computed(() => {
  if (!event.value?.end_date) return false
  return new Date(event.value.end_date) < new Date()
})

// Group agenda items by date
const agendaByDate = computed(() => {
  const grouped: Record<string, AgendaItem[]> = {}
  
  agendaItems.value.forEach(item => {
    const date = item.date || 'No Date'
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(item)
  })
  
  // Sort items within each date by order
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => (a.order || 0) - (b.order || 0))
  })
  
  return grouped
})

// Get sorted date tabs
const agendaTabs = computed(() => {
  const dates = Object.keys(agendaByDate.value)
  return dates.sort((a, b) => {
    if (a === 'No Date') return 1
    if (b === 'No Date') return -1
    return new Date(a).getTime() - new Date(b).getTime()
  })
})

// Set active tab to first date when agenda loads
const activeAgendaDate = computed({
  get: () => activeAgendaTab.value || agendaTabs.value[0] || '',
  set: (value: string) => {
    activeAgendaTab.value = value
  }
})

// Event video URL - comes from the event data, not the template
const eventVideoUrl = computed(() => {
  // Use the event's own video
  if (event.value?.event_video) {
    return getMediaUrl(event.value.event_video)
  }
  return null
})

// Methods
const loadShowcase = async () => {
  const eventId = route.params.id as string
  if (!eventId) {
    error.value = 'Invalid event ID'
    return
  }

  loading.value = true
  error.value = null

  try {
    const params: { lang?: string; guest_name?: string } = {
      lang: currentLanguage.value
    }
    
    if (guestName.value) {
      params.guest_name = guestName.value as string
    }

    // Fetch showcase data and photos in parallel
    const [showcaseResponse, photosResponse] = await Promise.all([
      eventsService.getEventShowcase(eventId, params),
      mediaService.getEventMedia(eventId)
    ])

    if (showcaseResponse.success && showcaseResponse.data) {
      showcaseData.value = showcaseResponse.data
      
      // Add event photos to the showcase data if photos were successfully fetched
      if (photosResponse.success && photosResponse.data && showcaseData.value) {
        // Handle both paginated response format and direct array format
        const photos = Array.isArray(photosResponse.data) 
          ? photosResponse.data 
          : photosResponse.data.results || []
        showcaseData.value.event.event_photos = photos.sort((a, b) => a.order - b.order)
      }
      
      // Set current language from meta
      if (showcaseResponse.data.meta?.language) {
        currentLanguage.value = showcaseResponse.data.meta.language
      }

      // Load custom fonts
      loadCustomFonts()
    } else {
      error.value = showcaseResponse.message || 'Failed to load event invitation'
    }
  } catch (err: unknown) {
    console.error('Error loading showcase:', err)
    error.value = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to load event invitation'
  } finally {
    loading.value = false
  }
}

const loadCustomFonts = () => {
  templateFonts.value.forEach((font: TemplateFont) => {
    if (font.font_file) {
      const fontFace = new FontFace(font.font_name, `url(${getMediaUrl(font.font_file)})`)
      fontFace.load().then(loadedFont => {
        document.fonts.add(loadedFont)
      }).catch(err => {
        console.error('Failed to load font:', font.font_name, err)
      })
    }
  })
}

const openEnvelope = async () => {
  console.log('=== EVENT SHOWCASE DEBUG ===')
  console.log('Full showcase data:', showcaseData.value)
  console.log('Event data:', event.value)
  console.log('Template assets:', templateAssets.value)
  console.log('Template colors array:', templateColors.value)
  console.log('Primary color computed:', primaryColor.value)
  console.log('Secondary color computed:', secondaryColor.value)
  console.log('===========================')
  
  isEnvelopeOpened.value = true
  
  // If we have an event video, play it
  if (eventVideoUrl.value) {
    isPlayingEventVideo.value = true
    
    await nextTick()
    if (eventVideoRef.value) {
      // Ensure video plays with sound
      eventVideoRef.value.muted = false
      eventVideoRef.value.play().catch(err => {
        console.error('Failed to play event video:', err)
        // Try playing muted if unmuted fails
        if (eventVideoRef.value) {
          eventVideoRef.value.muted = true
          eventVideoRef.value.play()
        }
      })
    }
  } else {
    // No event video, wait a moment then go to info screen
    setTimeout(() => {
      isPlayingEventVideo.value = false
    }, 1000)
  }
}

const onVideoCanPlay = () => {
  videoLoading.value = false
}

const onEventVideoEnded = () => {
  // Video finished, show the info screen with background video
  isPlayingEventVideo.value = false
}

const onEventVideoError = (error: Event) => {
  console.error('Event video error:', error)
  // If video fails to load, skip to info screen
  isPlayingEventVideo.value = false
}

const formatContent = (content: string): string => {
  // Convert newlines to <br> tags for proper display
  return content.replace(/\n/g, '<br>')
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatAgendaDate = (dateString: string): string => {
  if (dateString === 'No Date') return 'TBD'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

const registerForEvent = () => {
  // Redirect to event detail page for registration
  router.push(`/events/${route.params.id}`)
}

// const viewFullDetails = () => {
//   // Scroll to show full event details or navigate to detail page
//   router.push(`/events/${route.params.id}`)
// }

const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatEventTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getMediaUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  return url.startsWith('/') ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/media/${url}`
}

// const getLanguageDisplay = (lang: string): string => {
//   const languageMap: Record<string, string> = {
//     'en': 'English',
//     'kh': 'Khmer',
//     'fr': 'French',
//     'ja': 'Japanese',
//     'ko': 'Korean',
//     'zh-cn': 'Chinese',
//     'th': 'Thai',
//     'vn': 'Vietnamese'
//   }
//   return languageMap[lang] || lang.toUpperCase()
// }

const addToCalendar = () => {
  if (!event.value) return
  
  const startDate = new Date(event.value.start_date)
  const endDate = new Date(event.value.end_date)
  
  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
  }
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.value.title,
    dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
    details: event.value.description || event.value.short_description || '',
    location: event.value.is_virtual
      ? (event.value.virtual_link || 'Virtual Event')
      : (event.value.location || ''),
    trp: 'false'
  })
  
  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank')
}

const shareInvitation = () => {
  const url = window.location.href
  const text = `You're invited to ${event.value?.title}!`
  
  if (navigator.share) {
    navigator.share({
      title: event.value?.title,
      text: text,
      url: url
    }).catch(err => console.log('Error sharing:', err))
  } else {
    // Fallback to copying URL
    navigator.clipboard.writeText(url).then(() => {
      alert('Invitation link copied to clipboard!')
    })
  }
}

const openGoogleMap = () => {
  if (event.value?.google_map_embed_link) {
    // Convert embed link to regular Google Maps link
    let mapUrl = event.value.google_map_embed_link
    
    // If it's an embed link, convert it to a regular maps link
    if (mapUrl.includes('/embed?')) {
      mapUrl = mapUrl.replace('/embed?', '/search?')
      mapUrl = mapUrl.replace('https://www.google.com/maps', 'https://maps.google.com')
    }
    
    // Open in new tab/window
    window.open(mapUrl, '_blank')
  }
}

const openPhotoModal = (photo: EventPhoto) => {
  // Simple image viewer - opens image in new tab
  // In a real implementation, you might want to use a modal/lightbox
  window.open(getMediaUrl(photo.image), '_blank')
}

const processIconSvg = (svgCode: string): string => {
  if (!svgCode || !primaryColor.value) return svgCode
  
  // Replace common color attributes with the primary color
  let processedSvg = svgCode
    .replace(/fill="[^"]*"/g, `fill="${primaryColor.value}"`)
    .replace(/stroke="[^"]*"/g, `stroke="${primaryColor.value}"`)
    .replace(/fill:'[^']*'/g, `fill:'${primaryColor.value}'`)
    .replace(/stroke:'[^']*'/g, `stroke:'${primaryColor.value}'`)
    .replace(/fill:#[0-9a-fA-F]{6}/g, `fill:${primaryColor.value}`)
    .replace(/stroke:#[0-9a-fA-F]{6}/g, `stroke:${primaryColor.value}`)
    .replace(/fill:#[0-9a-fA-F]{3}/g, `fill:${primaryColor.value}`)
    .replace(/stroke:#[0-9a-fA-F]{3}/g, `stroke:${primaryColor.value}`)
  
  // If no fill attribute exists, add one
  if (!processedSvg.includes('fill=') && processedSvg.includes('<svg')) {
    processedSvg = processedSvg.replace('<svg', `<svg fill="${primaryColor.value}"`)
  }
  
  return processedSvg
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

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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

.animate-fadeIn {
  animation: fadeIn 1s ease-out forwards;
}

.animation-delay-200 {
  animation-delay: 200ms;
}

.animate-slideUp {
  animation: slideUp 0.8s ease-out forwards;
}

/* Liquid Glass Card Styles */
.liquid-glass-card {
  position: relative;
  border-radius: 1.5rem;
  overflow: hidden;
  width: calc(100vw - 60px);
  height: calc(100vh - 60px);
  max-width: calc(100vw - 60px);
  max-height: calc(100vh - 60px);
}

.glass-background {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.18) 50%,
    rgba(255, 255, 255, 0.25) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.glass-background::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 70%
  );
  animation: liquid-rotate 30s linear infinite;
}

@keyframes liquid-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.glass-section {
  background: rgba(255, 255, 255, 0.20);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.glass-section-light {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.glass-section-dark {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-inner {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Enhanced color theming with CSS variables for better performance */
.showcase-wrapper {
  --primary-color: v-bind(primaryColor);
  --secondary-color: v-bind(secondaryColor || accentColor);
  --accent-color: v-bind(accentColor);
}

.gradient-text {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.template-primary {
  color: var(--primary-color);
}

.template-secondary {
  color: var(--secondary-color);
}

.template-accent {
  color: var(--accent-color);
}

.template-border {
  border-color: var(--primary-color);
}

.template-bg-gradient {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
}

.glass-button-primary {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.glass-button-primary:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.25) 0%,
    rgba(255, 255, 255, 0.15) 100%
  );
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
}

.glass-button-secondary {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
}

.glass-button-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.glass-button-colored {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 2px solid;
  transition: all 0.3s ease;
}

.glass-button-colored:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Custom Scrollbar - Hidden */
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

/* For Firefox */
.custom-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* Pulse Animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Video Styles */
video {
  object-fit: cover;
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* Prevent right-click on video */
video::-webkit-media-controls {
  display: none !important;
}

/* Hide all video controls */
video::-webkit-media-controls-panel,
video::-webkit-media-controls-play-button,
video::-webkit-media-controls-current-time-display,
video::-webkit-media-controls-time-remaining-display,
video::-webkit-media-controls-timeline,
video::-webkit-media-controls-volume-slider-container,
video::-webkit-media-controls-fullscreen-button,
video::-webkit-media-controls-enclosure {
  display: none !important;
}

/* Agenda Icon Styling */
.agenda-icon {
  color: var(--icon-color) !important;
}

.agenda-icon svg {
  width: 100% !important;
  height: 100% !important;
  fill: var(--icon-color) !important;
  stroke: var(--icon-color) !important;
  color: var(--icon-color) !important;
}

.agenda-icon svg * {
  fill: var(--icon-color) !important;
  stroke: var(--icon-color) !important;
  color: var(--icon-color) !important;
}

.agenda-icon svg path,
.agenda-icon svg circle,
.agenda-icon svg rect,
.agenda-icon svg polygon,
.agenda-icon svg polyline,
.agenda-icon svg line,
.agenda-icon svg ellipse {
  fill: var(--icon-color) !important;
  stroke: var(--icon-color) !important;
}

</style>