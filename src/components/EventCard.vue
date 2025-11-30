<template>
  <div
    class="group relative bg-white rounded-2xl border border-gray-200/60 hover:border-gray-300/80 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/40 cursor-pointer overflow-hidden flex flex-col"
    role="article"
    :aria-label="`Event: ${event.title}`"
    @click="$emit('view', event)"
  >
    <!-- Registration Status Badge -->
    <div v-if="event.is_registered" class="absolute top-3 left-3 z-10">
      <div
        class="inline-flex items-center bg-green-600 text-white text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-md"
      >
        <div class="w-1.5 h-1.5 bg-white rounded-full mr-1 sm:mr-1.5"></div>
        Registered
      </div>
    </div>

    <!-- Delete Button -->
    <div
      v-if="event.can_delete"
      class="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
    >
      <button
        @click="handleDelete($event)"
        class="w-10 h-10 sm:w-9 sm:h-9 md:w-8 md:h-8 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200/50 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors duration-200"
        title="Delete Event"
      >
        <Trash2 class="w-4 h-4 sm:w-4 md:w-4 text-gray-600 hover:text-red-500" />
      </button>
    </div>

    <!-- Banner Image - 1.9:1 aspect ratio (1200x630) -->
    <div class="relative w-full aspect-[1.9/1] overflow-hidden">
      <img
        v-if="event.banner_image"
        :src="getBannerImageUrl(event.banner_image)"
        :alt="event.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div v-else class="w-full h-full relative overflow-hidden" :class="getFallbackBgClass()">
        <!-- Geometric Pattern Background -->
        <div class="absolute inset-0 opacity-10">
          <div
            class="absolute top-4 left-4 w-8 h-8 rounded-full"
            :style="{ backgroundColor: event.category_color || '#3B82F6' }"
          ></div>
          <div
            class="absolute top-12 right-8 w-4 h-4 rounded-full"
            :style="{ backgroundColor: event.category_color || '#3B82F6' }"
          ></div>
          <div
            class="absolute bottom-8 left-12 w-6 h-6 rounded-full"
            :style="{ backgroundColor: event.category_color || '#3B82F6' }"
          ></div>
          <div
            class="absolute bottom-4 right-4 w-3 h-3 rounded-full"
            :style="{ backgroundColor: event.category_color || '#3B82F6' }"
          ></div>
        </div>

        <!-- Central Content -->
        <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <div
            class="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
            :style="{ backgroundColor: `${event.category_color || '#3B82F6'}20` }"
          >
            <component
              :is="getFallbackIcon()"
              class="w-6 h-6"
              :style="{ color: event.category_color || '#3B82F6' }"
            />
          </div>
          <h4
            class="text-sm sm:text-base font-semibold mb-1 line-clamp-2"
            :style="{ color: event.category_color || '#3B82F6' }"
          >
            {{ event.title }}
          </h4>
          <p class="text-xs sm:text-sm text-gray-500 line-clamp-1">
            {{ event.category_name || 'Event' }}
          </p>
        </div>

        <!-- Decorative Elements -->
        <div
          class="absolute top-0 right-0 w-16 h-16 opacity-5"
          :style="{ backgroundColor: event.category_color || '#3B82F6' }"
        ></div>
        <div
          class="absolute bottom-0 left-0 w-12 h-12 opacity-5"
          :style="{ backgroundColor: event.category_color || '#3B82F6' }"
        ></div>
      </div>

      <!-- Category Badge (Top Right) -->
      <div v-if="event.category_name" class="absolute top-3 right-3">
        <span
          class="inline-flex items-center text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg backdrop-blur-sm shadow-md"
          :style="{
            backgroundColor: `${event.category_color || '#3B82F6'}E6`,
            color: '#FFFFFF',
          }"
        >
          <div
            class="w-1.5 h-1.5 rounded-full mr-1 sm:mr-1.5 bg-white"
          ></div>
          {{ event.category_name }}
        </span>
      </div>

      <!-- Badges (Bottom Right) -->
      <div class="absolute bottom-3 right-3 flex space-x-1 sm:space-x-1.5">
        <!-- Status Badge -->
        <span
          v-if="event.is_ongoing"
          class="inline-flex items-center bg-green-600 text-white text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-md"
        >
          <div class="w-1.5 h-1.5 bg-white rounded-full mr-1 sm:mr-1.5 animate-pulse"></div>
          Live
        </span>
        <span
          v-else-if="event.is_upcoming"
          class="inline-flex items-center bg-[#1e90ff] text-white text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-md"
        >
          Upcoming
        </span>
        <span
          v-else-if="event.is_past"
          class="inline-flex items-center bg-gray-600 text-white text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-md"
        >
          Past
        </span>

        <!-- Type Badges -->
        <span
          v-if="event.privacy === 'private'"
          class="inline-flex items-center bg-white/90 backdrop-blur-sm text-purple-700 text-xs sm:text-sm font-medium px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-purple-200/50 shadow-sm"
        >
          <Lock class="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1 sm:mr-1.5" />
          Private
        </span>
        <span
          v-if="event.is_virtual"
          class="inline-flex items-center bg-white/90 backdrop-blur-sm text-[#1873cc] text-xs sm:text-sm font-medium px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-[#87CEEB]/50 shadow-sm"
        >
          <Monitor class="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1 sm:mr-1.5" />
          Virtual
        </span>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4 sm:p-5 md:p-6 flex flex-col flex-1">
      <!-- Title -->
      <h3 class="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-2.5 line-clamp-2 leading-tight">
        {{ event.title }}
      </h3>

      <!-- Description -->
      <p class="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
        {{ event.short_description || 'No description available' }}
      </p>

      <!-- Date and Location -->
      <div class="space-y-2 sm:space-y-2.5 mb-3 sm:mb-4">
        <div class="flex items-center text-sm sm:text-base text-gray-600">
          <Calendar class="w-4 sm:w-4.5 h-4 sm:h-4.5 mr-2 sm:mr-2.5 text-gray-500 flex-shrink-0" />
          <span class="truncate">{{ formatDate(event.start_date) }}</span>
        </div>
        <div
          v-if="!event.is_virtual && event.location"
          class="flex items-center text-sm sm:text-base text-gray-600"
        >
          <MapPin class="w-4 sm:w-4.5 h-4 sm:h-4.5 mr-2 sm:mr-2.5 text-gray-500 flex-shrink-0" />
          <span class="truncate">{{ event.location }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 mt-auto">
        <!-- Attendees -->
        <div class="flex items-center text-sm sm:text-base text-gray-600">
          <Users class="w-4 sm:w-4.5 h-4 sm:h-4.5 mr-1.5 sm:mr-2 text-gray-500 flex-shrink-0" />
          <span class="truncate">
            {{ event.registrations_count }}
            <span v-if="event.max_attendees" class="text-gray-400"
              >/ {{ event.max_attendees }}</span
            >
          </span>
        </div>

        <!-- Hosts or Organizer fallback -->
        <div class="flex items-center text-sm sm:text-base text-gray-600 min-w-0">
          <!-- Single host -->
          <template v-if="event.hosts && event.hosts.length === 1">
            <div class="w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-gray-100 flex items-center justify-center mr-2 sm:mr-2.5 flex-shrink-0 overflow-hidden">
              <img
                v-if="event.hosts[0].profile_image"
                :src="getHostImageUrl(event.hosts[0].profile_image)"
                :alt="event.hosts[0].name"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-xs sm:text-sm font-medium text-gray-700">
                {{ event.hosts[0].name.charAt(0).toUpperCase() }}
              </span>
            </div>
            <span class="truncate max-w-32 sm:max-w-40 md:max-w-48">{{ event.hosts[0].name }}</span>
          </template>

          <!-- Multiple hosts -->
          <template v-else-if="event.hosts && event.hosts.length > 1">
            <div class="flex -space-x-2 mr-2 sm:mr-2.5 flex-shrink-0">
              <div
                v-for="(host, index) in event.hosts.slice(0, 3)"
                :key="host.id"
                class="w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white overflow-hidden"
                :style="{ zIndex: event.hosts.length - index }"
                :title="host.name"
              >
                <img
                  v-if="host.profile_image"
                  :src="getHostImageUrl(host.profile_image)"
                  :alt="host.name"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-xs sm:text-sm font-medium text-gray-700">
                  {{ host.name.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div
                v-if="event.hosts.length > 3"
                class="w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white"
                :title="`+${event.hosts.length - 3} more hosts`"
              >
                <span class="text-xs font-medium text-gray-600">+{{ event.hosts.length - 3 }}</span>
              </div>
            </div>
            <span class="truncate max-w-24 sm:max-w-32 md:max-w-36">{{ event.hosts.length }} hosts</span>
          </template>

          <!-- Fallback to organizer -->
          <template v-else>
            <div class="w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-gray-100 flex items-center justify-center mr-2 sm:mr-2.5 flex-shrink-0">
              <span class="text-xs sm:text-sm font-medium text-gray-700">
                {{ (event.organizer_name || 'U').charAt(0).toUpperCase() }}
              </span>
            </div>
            <span class="truncate max-w-32 sm:max-w-40 md:max-w-48">{{ event.organizer_name || 'Unknown' }}</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Calendar,
  MapPin,
  Users,
  Monitor,
  Lock,
  Trash2,
  Music,
  Briefcase,
  GraduationCap,
  Heart,
  Gamepad2,
  Camera,
  Utensils,
  Dumbbell,
  Palette,
  Code,
  Mic,
  BookOpen,
  Plane,
  Gift,
} from 'lucide-vue-next'
import type { Event } from '../services/api'

interface Props {
  event: Event
}

interface Emits {
  view: [event: Event]
  delete: [event: Event]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Fallback banner image helpers
const getFallbackBgClass = () => {
  const categoryName = props.event.category_name?.toLowerCase() || ''
  const gradients = [
    'bg-gradient-to-br from-[#E6F4FF] to-[#B0E0E6]',
    'bg-gradient-to-br from-emerald-50 to-emerald-100',
    'bg-gradient-to-br from-green-50 to-green-100',
    'bg-gradient-to-br from-orange-50 to-orange-100',
    'bg-gradient-to-br from-pink-50 to-pink-100',
    'bg-gradient-to-br from-indigo-50 to-indigo-100',
    'bg-gradient-to-br from-red-50 to-red-100',
    'bg-gradient-to-br from-yellow-50 to-yellow-100',
    'bg-gradient-to-br from-teal-50 to-teal-100',
    'bg-gradient-to-br from-cyan-50 to-cyan-100',
  ]

  // Use category name hash or event title hash to consistently pick a gradient
  const text = categoryName || props.event.title
  const hash = text.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)

  return gradients[Math.abs(hash) % gradients.length]
}

const getFallbackIcon = () => {
  const categoryName = props.event.category_name?.toLowerCase() || ''

  // Map category names to appropriate icons
  const iconMap: Record<string, any> = {
    music: Music,
    concert: Music,
    business: Briefcase,
    conference: Briefcase,
    corporate: Briefcase,
    education: GraduationCap,
    workshop: GraduationCap,
    training: GraduationCap,
    wedding: Heart,
    party: Heart,
    celebration: Heart,
    gaming: Gamepad2,
    esports: Gamepad2,
    photography: Camera,
    photo: Camera,
    food: Utensils,
    dining: Utensils,
    restaurant: Utensils,
    fitness: Dumbbell,
    gym: Dumbbell,
    sports: Dumbbell,
    art: Palette,
    design: Palette,
    creative: Palette,
    tech: Code,
    technology: Code,
    coding: Code,
    speaking: Mic,
    presentation: Mic,
    book: BookOpen,
    reading: BookOpen,
    literature: BookOpen,
    travel: Plane,
    trip: Plane,
    vacation: Plane,
    social: Gift,
    networking: Gift,
    meetup: Gift,
  }

  // Check for exact matches first
  if (iconMap[categoryName]) {
    return iconMap[categoryName]
  }

  // Check for partial matches
  for (const [key, icon] of Object.entries(iconMap)) {
    if (categoryName.includes(key) || key.includes(categoryName)) {
      return icon
    }
  }

  // Check if it's virtual to show monitor icon
  if (props.event.is_virtual) {
    return Monitor
  }

  // Default fallback
  return Calendar
}

// Handle delete button click
const handleDelete = (event: MouseEvent) => {
  event.stopPropagation()
  emit('delete', props.event)
}

const getBannerImageUrl = (bannerImage: string | null): string | undefined => {
  if (!bannerImage) return undefined

  let url: string

  // If it's already a full URL, use as is
  if (bannerImage.startsWith('http://') || bannerImage.startsWith('https://')) {
    url = bannerImage
  } else {
    // If it's a relative URL, prepend the API base URL
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
    if (bannerImage.startsWith('/')) {
      url = `${API_BASE_URL}${bannerImage}`
    } else {
      // If it doesn't start with /, assume it needs /media/ prefix
      url = `${API_BASE_URL}/media/${bannerImage}`
    }
  }

  // Convert API server URLs to ImageKit proxy URLs
  if (url.includes('api.goevent.online/media/')) {
    url = url.replace(
      'https://api.goevent.online/media/',
      'https://ik.imagekit.io/goevent/media/'
    )
  }

  // Apply ImageKit.io transformation for optimized thumbnails
  // Using same size as events/EventCard: 528x336 (3x of 176x112)
  if (url.includes('ik.imagekit.io')) {
    const imagekitRegex = /(https:\/\/ik\.imagekit\.io\/[^/]+)(\/.*)/
    const match = url.match(imagekitRegex)
    if (match) {
      return `${match[1]}/tr:w-528,h-336${match[2]}`
    }
  }

  return url
}

const getHostImageUrl = (profileImage: string | null): string | undefined => {
  if (!profileImage) return undefined

  let url: string

  // If it's already a full URL, use as is
  if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
    url = profileImage
  } else {
    // If it's a relative URL, prepend the API base URL
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
    if (profileImage.startsWith('/')) {
      url = `${API_BASE_URL}${profileImage}`
    } else {
      // If it doesn't start with /, assume it needs /media/ prefix
      url = `${API_BASE_URL}/media/${profileImage}`
    }
  }

  // Convert API server URLs to ImageKit proxy URLs
  if (url.includes('api.goevent.online/media/')) {
    url = url.replace(
      'https://api.goevent.online/media/',
      'https://ik.imagekit.io/goevent/media/'
    )
  }

  // Apply ImageKit.io transformation for host avatars
  // Display size is 24-28px, using 2x for retina = 56x56
  if (url.includes('ik.imagekit.io')) {
    const imagekitRegex = /(https:\/\/ik\.imagekit\.io\/[^/]+)(\/.*)/
    const match = url.match(imagekitRegex)
    if (match) {
      return `${match[1]}/tr:w-56,h-56,fo-auto${match[2]}`
    }
  }

  return url
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffInDays === 1) {
    return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffInDays === -1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } else if (Math.abs(diffInDays) < 7) {
    return date.toLocaleDateString([], {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  } else {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    })
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
</style>
