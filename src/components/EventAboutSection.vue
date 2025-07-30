<template>
  <div class="space-y-8">
    <!-- Event Description -->
    <div v-if="event.description" class="bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm border border-white/40 rounded-3xl shadow-xl p-8">
      <div class="flex items-center mb-6">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4">
          <FileText class="w-6 h-6 text-white" />
        </div>
        <h3 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">About This Event</h3>
      </div>
      <div class="prose prose-lg max-w-none text-slate-700 leading-relaxed">
        <div :class="{ 'line-clamp-6': !isDescriptionExpanded && event.description.length > 300 }">
          <p>{{ event.description }}</p>
        </div>
        <button
          v-if="event.description.length > 300"
          @click="isDescriptionExpanded = !isDescriptionExpanded"
          class="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
        >
          <span>{{ isDescriptionExpanded ? 'Show Less' : 'Show More' }}</span>
          <ChevronDown
            class="w-4 h-4 ml-1 transition-transform duration-200"
            :class="{ 'rotate-180': isDescriptionExpanded }"
          />
        </button>
      </div>
    </div>

    <!-- Event Schedule - Enhanced Design -->
    <div class="bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm border border-white/40 rounded-3xl shadow-xl p-8">
      <div class="flex items-center mb-8">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center mr-4">
          <Calendar class="w-6 h-6 text-white" />
        </div>
        <h3 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Event Schedule</h3>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Start Time -->
        <div class="group relative bg-white/70 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-t-2xl"></div>
          <div class="flex items-center mb-4">
            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mr-4">
              <div class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <p class="text-sm font-bold text-emerald-700 mb-1 uppercase tracking-wider">Event Starts</p>
              <p class="text-xs text-slate-600">{{ event.timezone || 'UTC' }}</p>
            </div>
          </div>
          <p class="text-2xl font-bold text-slate-900 mb-2 leading-tight">{{ formatEventDate(event.start_date) }}</p>
          <p class="text-lg font-semibold text-emerald-600">{{ formatEventTime(event.start_date) }}</p>
        </div>

        <!-- End Time -->
        <div class="group relative bg-white/70 backdrop-blur-sm border border-red-200/50 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t-2xl"></div>
          <div class="flex items-center mb-4">
            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mr-4">
              <div class="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
            <div>
              <p class="text-sm font-bold text-red-700 mb-1 uppercase tracking-wider">Event Ends</p>
              <p class="text-xs text-slate-600">{{ event.timezone || 'UTC' }}</p>
            </div>
          </div>
          <p class="text-2xl font-bold text-slate-900 mb-2 leading-tight">{{ formatEventDate(event.end_date) }}</p>
          <p class="text-lg font-semibold text-red-600">{{ formatEventTime(event.end_date) }}</p>
        </div>
      </div>
    </div>

    <!-- Location & Access -->
    <div class="bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-sm border border-white/40 rounded-3xl shadow-xl p-8">
      <div class="flex items-center mb-8">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mr-4">
          <MapPin v-if="!event.is_virtual" class="w-6 h-6 text-white" />
          <Monitor v-else class="w-6 h-6 text-white" />
        </div>
        <h3 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          {{ event.is_virtual ? 'Virtual Access' : 'Event Location' }}
        </h3>
      </div>

      <div v-if="event.is_virtual" class="space-y-6">
        <div class="bg-white/70 backdrop-blur-sm border border-purple-200/50 rounded-2xl p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <Monitor class="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p class="font-semibold text-slate-900">Virtual Event</p>
                <p class="text-sm text-slate-600">Join from anywhere</p>
              </div>
            </div>
            <div v-if="event.is_ongoing" class="flex items-center">
              <div class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span class="text-sm font-semibold text-green-600">Live Now</span>
            </div>
          </div>

          <div v-if="event.virtual_link" class="space-y-4">
            <div class="bg-slate-50 rounded-lg p-4">
              <p class="text-sm text-slate-600 mb-2">Meeting Link:</p>
              <p class="text-sm font-mono text-slate-800 break-all">{{ event.virtual_link }}</p>
            </div>
            <button
              @click="$emit('join-virtual')"
              class="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-purple-500/25 hover:shadow-purple-600/30 flex items-center justify-center"
            >
              <ExternalLink class="w-5 h-5 mr-2" />
              Join Virtual Event
            </button>
          </div>
          <div v-else class="text-center py-4">
            <p class="text-slate-600">Virtual access link will be provided closer to the event date.</p>
          </div>
        </div>
      </div>

      <div v-else class="space-y-6">
        <div class="bg-white/70 backdrop-blur-sm border border-blue-200/50 rounded-2xl p-6">
          <div class="flex items-center mb-4">
            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <MapPin class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p class="font-semibold text-slate-900">Physical Venue</p>
              <p class="text-sm text-slate-600">In-person attendance</p>
            </div>
          </div>

          <div class="bg-slate-50 rounded-lg p-4">
            <p class="text-lg font-semibold text-slate-900 mb-2">{{ event.location || 'Venue To Be Announced' }}</p>
            <p class="text-sm text-slate-600">Please arrive 15 minutes before the event starts.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Information Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Status Card -->
      <div class="group bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3"
               :class="event.status === 'published' ? 'bg-green-100' :
                       event.status === 'draft' ? 'bg-yellow-100' : 'bg-red-100'">
            <div class="w-4 h-4 rounded-full"
                 :class="event.status === 'published' ? 'bg-green-500' :
                         event.status === 'draft' ? 'bg-yellow-500' : 'bg-red-500'"></div>
          </div>
          <div>
            <p class="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</p>
            <p class="font-semibold text-slate-900 capitalize">{{ event.status || 'Draft' }}</p>
          </div>
        </div>
      </div>

      <!-- Privacy Card -->
      <div class="group bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3"
               :class="event.privacy === 'public' ? 'bg-green-100' : 'bg-purple-100'">
            <Lock v-if="event.privacy === 'private'" class="w-5 h-5 text-purple-600" />
            <Users v-else class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p class="text-xs font-bold text-slate-600 uppercase tracking-wider">Privacy</p>
            <p class="font-semibold text-slate-900 capitalize">{{ event.privacy || 'Public' }}</p>
          </div>
        </div>
      </div>

      <!-- Category Card -->
      <div v-if="event.category_name" class="group bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3"
               :style="{ backgroundColor: event.category_color + '20' || '#8B5CF620' }">
            <div class="w-4 h-4 rounded-full"
                 :style="{ backgroundColor: event.category_color || '#8B5CF6' }"></div>
          </div>
          <div>
            <p class="text-xs font-bold text-slate-600 uppercase tracking-wider">Category</p>
            <p class="font-semibold text-slate-900">{{ event.category_name }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Registration Information -->
    <div v-if="event.registration_required" class="bg-gradient-to-br from-white to-orange-50/30 backdrop-blur-sm border border-white/40 rounded-3xl shadow-xl p-8">
      <div class="flex items-center mb-6">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mr-4">
          <UserPlus class="w-6 h-6 text-white" />
        </div>
        <h3 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Registration Required</h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white/70 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-6">
          <div class="flex items-center mb-3">
            <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
              <Users class="w-4 h-4 text-orange-600" />
            </div>
            <p class="font-semibold text-slate-900">Current Registrations</p>
          </div>
          <p class="text-2xl font-bold text-orange-600">{{ event.registrations_count || 0 }}</p>
          <p class="text-sm text-slate-600 mt-1">
            {{ event.max_attendees ? `of ${event.max_attendees} spots` : 'registered attendees' }}
          </p>
        </div>

        <div v-if="event.max_attendees" class="bg-white/70 backdrop-blur-sm border border-orange-200/50 rounded-2xl p-6">
          <div class="flex items-center mb-3">
            <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
              <CheckCircle class="w-4 h-4 text-orange-600" />
            </div>
            <p class="font-semibold text-slate-900">Availability</p>
          </div>
          <p class="text-2xl font-bold text-slate-900">{{ event.max_attendees - (event.registrations_count || 0) }}</p>
          <p class="text-sm text-slate-600 mt-1">spots remaining</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  FileText,
  Calendar,
  MapPin,
  Monitor,
  ExternalLink,
  Lock,
  Users,
  UserPlus,
  CheckCircle,
  ChevronDown
} from 'lucide-vue-next'
import { type Event } from '../services/api'

interface Props {
  event: Event
}

interface Emits {
  'join-virtual': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state
const isDescriptionExpanded = ref(false)

// Date formatting utilities (these will be moved to composables later)
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
</script>