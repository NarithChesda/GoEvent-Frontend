<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">About This Event</h2>
        <p class="text-sm text-slate-600 mt-1">Learn more about what makes this event special</p>
      </div>
    </div>

    <!-- Event Description - Main Content -->
    <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
      <div class="p-6">
        
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <FileText class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900">Event Description</h3>
            <p class="text-sm text-slate-600">What this event is all about</p>
          </div>
        </div>

        <div v-if="event.description" class="prose prose-slate max-w-none">
          <div :class="{ 'line-clamp-6': !isDescriptionExpanded && event.description.length > 300 }">
            <p class="text-slate-700 leading-relaxed whitespace-pre-line">{{ event.description }}</p>
          </div>
          <button
            v-if="event.description.length > 300"
            @click="isDescriptionExpanded = !isDescriptionExpanded"
            class="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center transition-colors"
          >
            <span>{{ isDescriptionExpanded ? 'Show Less' : 'Read More' }}</span>
            <ChevronDown
              class="w-4 h-4 ml-1 transition-transform duration-200"
              :class="{ 'rotate-180': isDescriptionExpanded }"
            />
          </button>
        </div>
        
        <div v-else class="text-center py-8">
          <FileText class="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p class="text-slate-500">No description available for this event</p>
        </div>
      </div>
    </div>

    <!-- Virtual Meeting Info -->
    <div v-if="event.is_virtual && event.virtual_link" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
      <div class="p-6">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
            <Monitor class="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900">Virtual Meeting</h3>
            <p class="text-sm text-slate-600">
              {{ event.is_ongoing ? 'Join now' : 'Link available at event time' }}
            </p>
          </div>
        </div>
        
        <div class="space-y-3">
          <div class="bg-slate-50 rounded-lg p-3 border">
            <p class="text-sm text-slate-600 font-mono break-all">{{ event.virtual_link }}</p>
          </div>
          <button
            v-if="event.is_ongoing"
            @click="$emit('join-virtual')"
            class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 flex items-center justify-center"
          >
            <ExternalLink class="w-4 h-4 mr-2" />
            Join Meeting
          </button>
        </div>
      </div>
    </div>

    <!-- Event Meta Information -->
    <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg">
      <div class="p-6">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-3">
            <Clock class="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900">Event Information</h3>
            <p class="text-sm text-slate-600">Additional details about this event</p>
          </div>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Category -->
          <div v-if="event.category_details" class="text-center">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center"
                 :style="{ backgroundColor: event.category_details.color + '20' }">
              <div class="w-3 h-3 rounded-full"
                   :style="{ backgroundColor: event.category_details.color }"></div>
            </div>
            <p class="text-sm font-medium text-slate-900">{{ event.category_details.name }}</p>
            <p class="text-xs text-slate-500">Category</p>
          </div>

          <!-- Duration -->
          <div v-if="event.start_date && event.end_date" class="text-center">
            <div class="w-12 h-12 bg-slate-100 mx-auto mb-2 rounded-full flex items-center justify-center">
              <Clock class="w-5 h-5 text-slate-600" />
            </div>
            <p class="text-sm font-medium text-slate-900">{{ getEventDuration() }}</p>
            <p class="text-xs text-slate-500">Duration</p>
          </div>

          <!-- Privacy -->
          <div class="text-center">
            <div class="w-12 h-12 bg-slate-100 mx-auto mb-2 rounded-full flex items-center justify-center">
              <Lock v-if="event.privacy === 'private'" class="w-5 h-5 text-slate-600" />
              <Users v-else class="w-5 h-5 text-slate-600" />
            </div>
            <p class="text-sm font-medium text-slate-900 capitalize">{{ event.privacy || 'Public' }}</p>
            <p class="text-xs text-slate-500">Visibility</p>
          </div>

          <!-- Format -->
          <div class="text-center">
            <div class="w-12 h-12 bg-slate-100 mx-auto mb-2 rounded-full flex items-center justify-center">
              <Monitor v-if="event.is_virtual" class="w-5 h-5 text-slate-600" />
              <MapPin v-else class="w-5 h-5 text-slate-600" />
            </div>
            <p class="text-sm font-medium text-slate-900">{{ event.is_virtual ? 'Virtual' : 'In-Person' }}</p>
            <p class="text-xs text-slate-500">Format</p>
          </div>
        </div>

        <!-- Additional Details -->
        <div v-if="event.timezone" class="mt-6 pt-4 border-t border-slate-200">
          <div class="flex items-center justify-center space-x-2 text-slate-600">
            <Globe class="w-4 h-4" />
            <span class="text-sm">Event timezone: <strong class="text-slate-900">{{ event.timezone }}</strong></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Monitor,
  ExternalLink,
  Lock,
  Users,
  ChevronDown,
  Clock,
  MapPin,
  FileText,
  Globe
} from 'lucide-vue-next'
import { type Event } from '../services/api'

interface Props {
  event: Event
}

interface Emits {
  'join-virtual': []
}

const props = defineProps<Props>()
defineEmits<Emits>()

// Local state
const isDescriptionExpanded = ref(false)

// Event duration calculation
const getEventDuration = (): string => {
  if (!props.event.start_date || !props.event.end_date) return 'TBA'
  
  const start = new Date(props.event.start_date)
  const end = new Date(props.event.end_date)
  const diffMs = end.getTime() - start.getTime()
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}
</script>