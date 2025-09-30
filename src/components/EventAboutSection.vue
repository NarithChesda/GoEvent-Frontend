<template>
  <BaseCard class="p-0 overflow-hidden">
    <!-- Header -->
    <h1 class="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 text-center py-6 sm:py-8 md:py-12 bg-gradient-to-br from-white via-emerald-50/30 to-sky-50/30">
      About This Event
    </h1>

    <!-- Content Container -->
    <div class="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 md:space-y-10">
      <!-- Event Description Section -->
      <div class="border-b border-slate-200 pb-6 sm:pb-8">
        <div class="flex items-start justify-between gap-3 sm:gap-4">
          <div class="flex-1 w-full">
            <label class="block text-sm sm:text-base font-bold text-slate-900 mb-2 sm:mb-3">Event Description</label>

            <div v-if="event.description">
              <div
                :class="{ 'line-clamp-6': !isDescriptionExpanded && event.description.length > 300 }"
                class="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed"
              >
                {{ event.description }}
              </div>
              <button
                v-if="event.description.length > 300"
                @click="isDescriptionExpanded = !isDescriptionExpanded"
                class="mt-2 sm:mt-3 text-[#1e90ff] hover:text-[#1873cc] text-xs sm:text-sm font-semibold hover:underline transition-colors duration-200 flex items-center"
              >
                <span>{{ isDescriptionExpanded ? 'Show Less' : 'Read More' }}</span>
                <ChevronDown
                  class="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 transition-transform duration-200"
                  :class="{ 'rotate-180': isDescriptionExpanded }"
                />
              </button>
            </div>

            <div v-else class="text-xs sm:text-sm text-slate-600 italic">
              No description available
            </div>
          </div>
        </div>
      </div>

      <!-- Virtual Meeting Section -->
      <div v-if="event.is_virtual && event.virtual_link" class="border-b border-slate-200 pb-6 sm:pb-8">
        <div class="flex flex-col gap-3 sm:gap-4">
          <div class="flex-1 w-full">
            <label class="block text-sm sm:text-base font-bold text-slate-900 mb-2 sm:mb-3">Virtual Meeting Link</label>
            <div class="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-300">
              <p class="text-xs sm:text-sm text-slate-700 font-mono break-all">{{ event.virtual_link }}</p>
            </div>
            <p class="text-xs sm:text-sm text-slate-600 mt-1.5 sm:mt-2">
              {{ event.is_ongoing ? 'Event is live - join now!' : 'Link will be available when the event starts' }}
            </p>
          </div>

          <button
            v-if="event.is_ongoing"
            @click="$emit('join-virtual')"
            class="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <ExternalLink class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Join Meeting
          </button>
        </div>
      </div>

      <!-- Event Information Grid -->
      <div class="border-b border-slate-200 pb-6 sm:pb-8">
        <h3 class="text-sm sm:text-base font-bold text-slate-900 mb-2 sm:mb-3">Event Details</h3>
        <p class="text-xs sm:text-sm text-slate-700 mb-4 sm:mb-6">Key information about this event</p>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <!-- Category -->
          <div v-if="event.category_details" class="flex flex-col items-center text-center">
            <div
              class="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-sm"
              :style="{ backgroundColor: event.category_details.color + '20' }"
            >
              <div
                class="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                :style="{ backgroundColor: event.category_details.color }"
              ></div>
            </div>
            <p class="text-xs sm:text-sm font-bold text-slate-900 mb-0.5 sm:mb-1">{{ event.category_details.name }}</p>
            <p class="text-[10px] sm:text-xs text-slate-700">Category</p>
          </div>

          <!-- Duration -->
          <div v-if="event.start_date && event.end_date" class="flex flex-col items-center text-center">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-sm">
              <Clock class="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
            </div>
            <p class="text-xs sm:text-sm font-bold text-slate-900 mb-0.5 sm:mb-1">{{ getEventDuration() }}</p>
            <p class="text-[10px] sm:text-xs text-slate-700">Duration</p>
          </div>

          <!-- Privacy -->
          <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-sm">
              <Lock v-if="event.privacy === 'private'" class="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
              <Users v-else class="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
            </div>
            <p class="text-xs sm:text-sm font-bold text-slate-900 mb-0.5 sm:mb-1 capitalize">
              {{ event.privacy || 'Public' }}
            </p>
            <p class="text-[10px] sm:text-xs text-slate-700">Visibility</p>
          </div>

          <!-- Format -->
          <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-sm">
              <Monitor v-if="event.is_virtual" class="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
              <MapPin v-else class="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
            </div>
            <p class="text-xs sm:text-sm font-bold text-slate-900 mb-0.5 sm:mb-1">
              {{ event.is_virtual ? 'Virtual' : 'In-Person' }}
            </p>
            <p class="text-[10px] sm:text-xs text-slate-700">Format</p>
          </div>
        </div>
      </div>

      <!-- Additional Information -->
      <div>
        <h3 class="text-sm sm:text-base font-bold text-slate-900 mb-2 sm:mb-3">Additional Information</h3>
        <p class="text-xs sm:text-sm text-slate-700 mb-4 sm:mb-6">Extra details you should know</p>

        <div class="space-y-3 sm:space-y-4">
          <!-- Timezone -->
          <div v-if="event.timezone" class="flex flex-col sm:flex-row items-start sm:justify-between gap-1.5 sm:gap-2">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <Globe class="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 flex-shrink-0" />
              <span class="text-xs sm:text-sm font-bold text-slate-900">Event Timezone</span>
            </div>
            <span class="text-xs sm:text-sm text-slate-700 sm:text-right">{{ event.timezone }}</span>
          </div>

          <!-- Registration Info -->
          <div v-if="event.registration_required" class="flex flex-col sm:flex-row items-start sm:justify-between gap-1.5 sm:gap-2">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <Users class="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 flex-shrink-0" />
              <span class="text-xs sm:text-sm font-bold text-slate-900">Registration</span>
            </div>
            <span class="text-xs sm:text-sm text-slate-700 sm:text-right">Required</span>
          </div>

          <!-- Max Attendees -->
          <div v-if="event.max_attendees" class="flex flex-col sm:flex-row items-start sm:justify-between gap-1.5 sm:gap-2">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <Users class="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 flex-shrink-0" />
              <span class="text-xs sm:text-sm font-bold text-slate-900">Maximum Attendees</span>
            </div>
            <span class="text-xs sm:text-sm text-slate-700 sm:text-right">{{ event.max_attendees }} people</span>
          </div>

          <!-- No additional info message -->
          <div v-if="!event.timezone && !event.registration_required && !event.max_attendees" class="text-center py-3 sm:py-4">
            <p class="text-xs sm:text-sm text-slate-500 italic">No additional information available</p>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
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
  Globe,
} from 'lucide-vue-next'
import { type Event } from '../services/api'
import BaseCard from './BaseCard.vue'

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
