<template>
  <div 
    class="group relative bg-white rounded-2xl border border-gray-200/60 hover:border-gray-300/80 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/40 cursor-pointer overflow-hidden"
    role="article"
    :aria-label="`Event: ${event.title}`"
    @click="$emit('view', event)"
  >
    <!-- Registration Status Badge -->
    <div v-if="event.is_registered" class="absolute top-3 left-3 z-10">
      <div class="inline-flex items-center bg-green-600 text-white text-xs font-medium px-2.5 py-1 rounded-lg shadow-sm">
        <div class="w-1.5 h-1.5 bg-white rounded-full mr-1.5"></div>
        Registered
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div class="flex space-x-1">
        <button
          v-if="event.can_edit"
          @click="handleAction('edit', $event)"
          class="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200/50 flex items-center justify-center hover:bg-gray-50 transition-colors duration-200"
          title="Edit Event"
        >
          <Edit2 class="w-4 h-4 text-gray-600" />
        </button>
        <button
          v-if="event.can_delete"
          @click="handleAction('delete', $event)"
          class="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200/50 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors duration-200"
          title="Delete Event"
        >
          <Trash2 class="w-4 h-4 text-gray-600 hover:text-red-500" />
        </button>
      </div>
    </div>

    <!-- Banner Image -->
    <div class="relative h-44 overflow-hidden">
      <img 
        v-if="event.banner_image"
        :src="getBannerImageUrl(event.banner_image)"
        :alt="event.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div 
        v-else
        class="w-full h-full relative overflow-hidden"
        :class="getFallbackBgClass()"
      >
        <!-- Geometric Pattern Background -->
        <div class="absolute inset-0 opacity-10">
          <div class="absolute top-4 left-4 w-8 h-8 rounded-full" :style="{ backgroundColor: event.category_color || '#3B82F6' }"></div>
          <div class="absolute top-12 right-8 w-4 h-4 rounded-full" :style="{ backgroundColor: event.category_color || '#3B82F6' }"></div>
          <div class="absolute bottom-8 left-12 w-6 h-6 rounded-full" :style="{ backgroundColor: event.category_color || '#3B82F6' }"></div>
          <div class="absolute bottom-4 right-4 w-3 h-3 rounded-full" :style="{ backgroundColor: event.category_color || '#3B82F6' }"></div>
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
            class="text-sm font-semibold mb-1 line-clamp-2"
            :style="{ color: event.category_color || '#3B82F6' }"
          >
            {{ event.title }}
          </h4>
          <p class="text-xs text-gray-500 line-clamp-1">
            {{ event.category_name || 'Event' }}
          </p>
        </div>

        <!-- Decorative Elements -->
        <div class="absolute top-0 right-0 w-16 h-16 opacity-5" :style="{ backgroundColor: event.category_color || '#3B82F6' }"></div>
        <div class="absolute bottom-0 left-0 w-12 h-12 opacity-5" :style="{ backgroundColor: event.category_color || '#3B82F6' }"></div>
      </div>

      <!-- Status Badge -->
      <div class="absolute bottom-3 left-3">
        <span 
          v-if="event.is_ongoing"
          class="inline-flex items-center bg-green-600 text-white text-xs font-medium px-2.5 py-1 rounded-lg shadow-sm"
        >
          <div class="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse"></div>
          Live
        </span>
        <span 
          v-else-if="event.is_upcoming"
          class="inline-flex items-center bg-blue-600 text-white text-xs font-medium px-2.5 py-1 rounded-lg shadow-sm"
        >
          Upcoming
        </span>
        <span 
          v-else-if="event.is_past"
          class="inline-flex items-center bg-gray-600 text-white text-xs font-medium px-2.5 py-1 rounded-lg shadow-sm"
        >
          Past
        </span>
      </div>

      <!-- Type Badges -->
      <div class="absolute bottom-3 right-3 flex space-x-1.5">
        <span 
          v-if="event.privacy === 'private'"
          class="inline-flex items-center bg-white/90 backdrop-blur-sm text-purple-700 text-xs font-medium px-2 py-1 rounded-lg border border-purple-200/50"
        >
          <Lock class="w-3 h-3 mr-1" />
          Private
        </span>
        <span 
          v-if="event.is_virtual"
          class="inline-flex items-center bg-white/90 backdrop-blur-sm text-blue-700 text-xs font-medium px-2 py-1 rounded-lg border border-blue-200/50"
        >
          <Monitor class="w-3 h-3 mr-1" />
          Virtual
        </span>
      </div>
    </div>

    <!-- Content -->
    <div class="p-5">
      <!-- Category -->
      <div v-if="event.category_name" class="mb-3">
        <span 
          class="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg"
          :style="{ 
            backgroundColor: `${event.category_color || '#3B82F6'}15`,
            color: event.category_color || '#3B82F6' 
          }"
        >
          <div 
            class="w-1.5 h-1.5 rounded-full mr-1.5"
            :style="{ backgroundColor: event.category_color || '#3B82F6' }"
          ></div>
          {{ event.category_name }}
        </span>
      </div>

      <!-- Title -->
      <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
        {{ event.title }}
      </h3>

      <!-- Description -->
      <p class="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
        {{ event.short_description || 'No description available' }}
      </p>

      <!-- Date and Location -->
      <div class="space-y-2 mb-4">
        <div class="flex items-center text-sm text-gray-600">
          <Calendar class="w-4 h-4 mr-2.5 text-gray-500" />
          <span>{{ formatDate(event.start_date) }}</span>
        </div>
        <div v-if="!event.is_virtual && event.location" class="flex items-center text-sm text-gray-600">
          <MapPin class="w-4 h-4 mr-2.5 text-gray-500" />
          <span class="truncate">{{ event.location }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between pt-3 border-t border-gray-100">
        <!-- Attendees -->
        <div class="flex items-center text-sm text-gray-600">
          <Users class="w-4 h-4 mr-1.5 text-gray-500" />
          <span>
            {{ event.registrations_count }}
            <span v-if="event.max_attendees" class="text-gray-400">/ {{ event.max_attendees }}</span>
          </span>
        </div>

        <!-- Organizer -->
        <div class="flex items-center text-sm text-gray-600">
          <div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-2">
            <span class="text-xs font-medium text-gray-700">
              {{ (event.organizer_name || 'U').charAt(0).toUpperCase() }}
            </span>
          </div>
          <span class="truncate max-w-24">{{ event.organizer_name || 'Unknown' }}</span>
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
  Edit2, 
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
  Gift
} from 'lucide-vue-next'
import type { Event } from '../services/api'

interface Props {
  event: Event
}

interface Emits {
  view: [event: Event]
  edit: [event: Event]
  delete: [event: Event]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Fallback banner image helpers
const getFallbackBgClass = () => {
  const categoryName = props.event.category_name?.toLowerCase() || ''
  const gradients = [
    'bg-gradient-to-br from-blue-50 to-blue-100',
    'bg-gradient-to-br from-purple-50 to-purple-100',
    'bg-gradient-to-br from-green-50 to-green-100',
    'bg-gradient-to-br from-orange-50 to-orange-100',
    'bg-gradient-to-br from-pink-50 to-pink-100',
    'bg-gradient-to-br from-indigo-50 to-indigo-100',
    'bg-gradient-to-br from-red-50 to-red-100',
    'bg-gradient-to-br from-yellow-50 to-yellow-100',
    'bg-gradient-to-br from-teal-50 to-teal-100',
    'bg-gradient-to-br from-cyan-50 to-cyan-100'
  ]
  
  // Use category name hash or event title hash to consistently pick a gradient
  const text = categoryName || props.event.title
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
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
    meetup: Gift
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

// Handle action button clicks
const handleAction = (action: 'edit' | 'delete', event: MouseEvent) => {
  event.stopPropagation()
  if (action === 'edit') {
    emit('edit', props.event)
  } else {
    emit('delete', props.event)
  }
}

const getBannerImageUrl = (bannerImage: string | null): string | undefined => {
  if (!bannerImage) return undefined
  
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
      minute: '2-digit' 
    })
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit', 
      minute: '2-digit' 
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