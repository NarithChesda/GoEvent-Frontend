<template>
  <BaseCard
    variant="interactive"
    size="md"
    :interactive="true"
    role="article"
    :aria-label="`Event: ${event.title}`"
    class="cursor-pointer"
    @click="$emit('view', event)"
  >
    <!-- Top accent bar -->
    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
    
    <!-- Registration Status Banner -->
    <div v-if="event.is_registered" class="absolute top-1 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center text-xs font-bold py-2 z-10">
      <div class="flex items-center justify-center space-x-1">
        <div class="w-2 h-2 bg-white rounded-full"></div>
        <span>✓ You're Registered</span>
      </div>
    </div>

    <!-- Banner Image -->
    <div class="relative h-48 overflow-hidden rounded-t-2xl">
      <img 
        v-if="event.banner_image"
        :src="getBannerImageUrl(event.banner_image)"
        :alt="event.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div 
        v-else
        class="w-full h-full bg-gradient-to-br from-blue-100 via-white to-purple-100 flex items-center justify-center"
      >
        <div class="text-center">
          <Calendar class="w-12 h-12 text-blue-400 mx-auto mb-2" />
          <p class="text-sm text-blue-500 font-medium">Event Image</p>
        </div>
      </div>
      
      <!-- Enhanced Status Badge -->
      <div class="absolute top-4 left-4">
        <span 
          v-if="event.is_ongoing"
          class="inline-flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-green-500/25"
        >
          <div class="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
          Live Now
        </span>
        <span 
          v-else-if="event.is_upcoming"
          class="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-blue-500/25"
        >
          Upcoming
        </span>
        <span 
          v-else-if="event.is_past"
          class="inline-flex items-center bg-gradient-to-r from-slate-500 to-slate-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
        >
          Past Event
        </span>
      </div>

      <!-- Badges Row -->
      <div class="absolute top-4 right-4 flex space-x-2">
        <!-- Privacy Badge -->
        <span 
          v-if="event.privacy === 'private'"
          class="inline-flex items-center bg-purple-500/90 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-lg"
        >
          <Lock class="w-3 h-3 mr-1" />
          Private
        </span>
        
        <!-- Virtual Badge -->
        <span 
          v-if="event.is_virtual"
          class="inline-flex items-center bg-white/90 backdrop-blur-sm text-blue-600 text-xs font-medium px-2.5 py-1 rounded-full shadow-lg border border-blue-200"
        >
          <Monitor class="w-3 h-3 mr-1" />
          Virtual
        </span>
      </div>

      <!-- Gradient overlay for better text readability -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
    </div>

    <!-- Content -->
    <div class="p-6 space-y-4">
      <!-- Category and Action Buttons Row -->
      <div class="flex items-center justify-between">
        <div v-if="event.category_name" class="flex items-center space-x-2">
          <div 
            class="w-3 h-3 rounded-full shadow-sm"
            :style="{ backgroundColor: event.category_color || '#3B82F6' }"
          ></div>
          <span 
            class="text-sm font-semibold"
            :style="{ color: event.category_color || '#3B82F6' }"
          >
            {{ event.category_name }}
          </span>
        </div>
        
        <!-- Action Buttons -->
        <CardActions visibility="hover" align="right">
          <CardActionButton
            v-if="event.can_edit"
            :icon="Edit2"
            variant="edit"
            title="Edit Event"
            @click="handleAction('edit', $event)"
          />
          <CardActionButton
            v-if="event.can_delete"
            :icon="Trash2"
            variant="delete"
            title="Delete Event"
            @click="handleAction('delete', $event)"
          />
        </CardActions>
      </div>

      <!-- Title -->
      <h3 class="text-xl font-bold text-slate-900 leading-tight group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 line-clamp-2">
        {{ event.title }}
      </h3>

      <!-- Description -->
      <p class="text-slate-600 text-sm leading-relaxed line-clamp-3">
        {{ event.short_description || 'No description available' }}
      </p>

      <!-- Date and Location -->
      <div class="space-y-2.5">
        <div class="flex items-center text-slate-500 text-sm">
          <div class="w-5 h-5 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
            <Calendar class="w-3 h-3 text-blue-600" />
          </div>
          <span class="font-medium">{{ formatDate(event.start_date) }}</span>
        </div>
        <div v-if="!event.is_virtual && event.location" class="flex items-center text-slate-500 text-sm">
          <div class="w-5 h-5 rounded-lg bg-green-50 flex items-center justify-center mr-3">
            <MapPin class="w-3 h-3 text-green-600" />
          </div>
          <span class="truncate font-medium">{{ event.location }}</span>
        </div>
      </div>

      <!-- Stats and Info -->
      <div class="pt-4 border-t border-slate-100">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <!-- Attendees -->
            <div class="flex items-center text-slate-500">
              <div class="w-5 h-5 rounded-lg bg-purple-50 flex items-center justify-center mr-2">
                <Users class="w-3 h-3 text-purple-600" />
              </div>
              <span class="text-sm font-medium">
                {{ event.registrations_count }}
                <span v-if="event.max_attendees" class="text-slate-400">/ {{ event.max_attendees }}</span>
              </span>
            </div>
            
            <!-- Collaborators -->
            <div v-if="event.collaborators_count > 0" class="flex items-center text-slate-500">
              <div class="w-5 h-5 rounded-lg bg-orange-50 flex items-center justify-center mr-2">
                <UserPlus class="w-3 h-3 text-orange-600" />
              </div>
              <span class="text-sm font-medium">{{ event.collaborators_count }}</span>
            </div>
          </div>

          <!-- Registration Status -->
          <div class="text-right">
            <span 
              v-if="event.registration_required" 
              class="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full"
            >
              Registration Required
            </span>
            <span 
              v-else 
              class="inline-flex items-center bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full"
            >
              Open Event
            </span>
          </div>
        </div>

        <!-- Organizer -->
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
          <div class="flex items-center text-slate-500">
            <div class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mr-2">
              <span class="text-xs font-bold text-blue-600">
                {{ (event.organizer_name || 'U').charAt(0).toUpperCase() }}
              </span>
            </div>
            <span class="text-sm">{{ event.organizer_name || 'Unknown Organizer' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom shine effect -->
    <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
  </BaseCard>
</template>

<script setup lang="ts">
import { 
  Calendar, 
  MapPin, 
  Users, 
  UserPlus, 
  Monitor, 
  Lock, 
  Edit2, 
  Trash2 
} from 'lucide-vue-next'
import BaseCard from './BaseCard.vue'
import CardActions from './CardActions.vue'
import CardActionButton from './CardActionButton.vue'
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