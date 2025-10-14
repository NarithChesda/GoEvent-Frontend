<template>
  <BaseCard class="p-4 sm:p-6 md:p-8">
    <!-- Rich Text Description Display -->
    <div v-if="hasDescription" class="prose prose-sm sm:prose-base max-w-none" v-html="sanitizedDescription"></div>

    <!-- Fallback Display for events without rich text description -->
    <div v-else class="space-y-6">
      <!-- Short Description -->
      <div v-if="event.short_description" class="text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] mb-4">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-base sm:text-lg text-slate-700 leading-relaxed max-w-3xl mx-auto">
          {{ event.short_description }}
        </p>
      </div>

      <!-- Event Details Grid - Always show date, conditionally show others -->
      <div v-if="hasEventDetails" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        <!-- Date & Time -->
        <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
          <div class="flex items-start space-x-3">
            <div class="w-10 h-10 rounded-lg bg-[#1e90ff] flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-900 mb-1">Date & Time</h3>
              <p class="text-sm text-slate-600">{{ formattedDate }}</p>
            </div>
          </div>
        </div>

        <!-- Location -->
        <div v-if="event.location || event.is_virtual" class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <div class="flex items-start space-x-3">
            <div class="w-10 h-10 rounded-lg bg-[#2ecc71] flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-900 mb-1">Location</h3>
              <p class="text-sm text-slate-600">{{ event.is_virtual ? 'Virtual Event' : event.location }}</p>
            </div>
          </div>
        </div>

        <!-- Organizer -->
        <div v-if="event.organizer_details" class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
          <div class="flex items-start space-x-3">
            <div class="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-900 mb-1">Organized by</h3>
              <p class="text-sm text-slate-600">{{ organizerName }}</p>
            </div>
          </div>
        </div>

        <!-- Category -->
        <div v-if="event.category_details" class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <div class="flex items-start space-x-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" :style="{ backgroundColor: event.category_details.color }">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-slate-900 mb-1">Category</h3>
              <p class="text-sm text-slate-600">{{ event.category_details.name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- No Information Message -->
      <div v-if="!hasAnyContent" class="text-center py-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
          <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-slate-500 text-sm">More details about this event will be available soon.</p>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'
import { type Event } from '../services/api'
import BaseCard from './BaseCard.vue'

interface Props {
  event: Event
}

const props = defineProps<Props>()

// Check if event has a valid description with actual content
const hasDescription = computed(() => {
  if (!props.event.description) return false
  const trimmed = props.event.description.trim()
  return trimmed.length > 0
})

// Check if event has any details to show in the grid
const hasEventDetails = computed(() => {
  return props.event.start_date || props.event.end_date
})

// Check if event has any content at all (description, short_description, or details)
const hasAnyContent = computed(() => {
  return props.event.short_description && props.event.short_description.trim().length > 0
})

// Sanitize HTML description to prevent XSS attacks
const sanitizedDescription = computed(() => {
  if (!props.event.description) return ''
  return DOMPurify.sanitize(props.event.description, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class']
  })
})

// Format date for display
const formattedDate = computed(() => {
  const start = new Date(props.event.start_date)
  const end = new Date(props.event.end_date)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const isSameDay = start.toDateString() === end.toDateString()

  if (isSameDay) {
    return `${formatDate(start)} at ${formatTime(start)}`
  } else {
    return `${formatDate(start)} - ${formatDate(end)}`
  }
})

// Get organizer name
const organizerName = computed(() => {
  if (props.event.organizer_details?.first_name && props.event.organizer_details?.last_name) {
    return `${props.event.organizer_details.first_name} ${props.event.organizer_details.last_name}`
  }
  return props.event.organizer_details?.first_name ||
         props.event.organizer_details?.username ||
         props.event.organizer_name ||
         'GoEvent'
})
</script>

<style scoped>
/* Prose styling for rich text content */
.prose {
  @apply text-slate-700;
}

.prose :deep(h1) {
  @apply text-2xl sm:text-3xl font-bold text-slate-900 mb-4 mt-6;
}

.prose :deep(h2) {
  @apply text-xl sm:text-2xl font-bold text-slate-900 mb-3 mt-5;
}

.prose :deep(h3) {
  @apply text-lg sm:text-xl font-semibold text-slate-900 mb-2 mt-4;
}

.prose :deep(p) {
  @apply mb-4 leading-relaxed;
}

.prose :deep(strong) {
  @apply font-bold text-slate-900;
}

.prose :deep(em) {
  @apply italic;
}

.prose :deep(u) {
  @apply underline;
}

.prose :deep(s) {
  @apply line-through;
}

.prose :deep(ul) {
  @apply list-disc list-inside mb-4 space-y-2;
}

.prose :deep(ol) {
  @apply list-decimal list-inside mb-4 space-y-2;
}

.prose :deep(li) {
  @apply leading-relaxed;
}

.prose :deep(a) {
  @apply text-[#1e90ff] hover:text-[#1873cc] underline transition-colors;
}

.prose :deep(br) {
  @apply block mb-2;
}
</style>
