<template>
  <div class="relative h-[400px] sm:h-[450px] lg:h-[500px] flex items-end bg-gradient-to-br from-blue-100 via-blue-50 to-purple-100 overflow-hidden">
    <!-- Enhanced Background Elements -->
    <div class="absolute inset-0">
      <!-- Primary gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-500/5 to-blue-700/5"></div>

      <!-- Animated background shapes -->
      <div class="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-blue-400/30 to-blue-600/30 rounded-full mix-blend-multiply filter blur-2xl animate-pulse"></div>
      <div class="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-purple-400/25 to-purple-600/25 rounded-full mix-blend-multiply filter blur-2xl animate-pulse delay-1000"></div>
      <div class="absolute -bottom-8 left-20 w-80 h-80 bg-gradient-to-br from-blue-500/30 to-blue-600/30 rounded-full mix-blend-multiply filter blur-2xl animate-pulse delay-500"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-300/10 to-purple-300/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-700"></div>

      <!-- Geometric patterns -->
      <div class="absolute top-32 right-32 w-4 h-4 bg-blue-500/30 rounded-full animate-pulse delay-300"></div>
      <div class="absolute bottom-32 left-32 w-6 h-6 bg-purple-500/30 rounded-full animate-pulse delay-900"></div>
      <div class="absolute top-64 left-64 w-3 h-3 bg-blue-600/40 rounded-full animate-pulse delay-1200"></div>
    </div>

    <!-- Hero Content -->
    <div class="hero-content relative z-10 w-full pt-8 pb-8">
      <div class="w-full max-w-7xl mx-auto px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
          <!-- Left Column: Main Event Info -->
          <div class="lg:col-span-2">
            <!-- Category and Status -->
            <div class="flex flex-wrap items-center gap-4 mb-6">
              <EventStatusBadge
                v-if="event.category_name"
                type="category"
                :label="event.category_name"
                :color="event.category_color || undefined"
              />

              <EventStatusBadge
                v-if="event.is_ongoing"
                type="live"
                label="Live Now"
              />
              <EventStatusBadge
                v-else-if="event.is_upcoming"
                type="upcoming"
                label="Upcoming"
              />
              <EventStatusBadge
                v-else-if="event.is_past"
                type="past"
                label="Past Event"
              />
            </div>

            <!-- Title with Typing Animation -->
            <h1 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
              <span class="typing-text">
                {{ displayText }}<span v-if="!isComplete" class="typing-cursor">|</span>
              </span>
            </h1>

            <!-- Key Event Details -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <!-- Date & Time -->
              <EventInfoCard
                icon="calendar"
                :title="formatEventDate(event.start_date)"
                :subtitle="formatEventTime(event.start_date)"
              />

              <!-- Location -->
              <EventInfoCard
                :icon="event.is_virtual ? 'monitor' : 'map-pin'"
                :title="event.is_virtual ? 'Virtual Event' : (event.location || 'Location TBA')"
                :subtitle="event.is_virtual ? 'Join online' : 'In-person event'"
              />
            </div>

            <!-- Short Description -->
            <p class="text-lg text-slate-600 leading-relaxed max-w-prose mb-8">
              {{ event.short_description || 'Join us for an exciting event experience!' }}
            </p>
          </div>

          <!-- Right Column: Action Area -->
          <div class="lg:col-span-1">
            <EventActionPanel
              :event="event"
              :can-register="canRegister"
              :is-registering="isRegistering"
              @register="$emit('register')"
              @join-virtual="$emit('join-virtual')"
              @add-to-google-calendar="$emit('add-to-google-calendar')"
              @add-to-outlook-calendar="$emit('add-to-outlook-calendar')"
              @download-ics="$emit('download-ics')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { type Event } from '../services/api'
import EventStatusBadge from './EventStatusBadge.vue'
import EventInfoCard from './EventInfoCard.vue'
import EventActionPanel from './EventActionPanel.vue'

interface Props {
  event: Event
  canRegister: boolean
  isRegistering: boolean
}

interface Emits {
  register: []
  'join-virtual': []
  'add-to-google-calendar': []
  'add-to-outlook-calendar': []
  'download-ics': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Typing animation state
const displayText = ref('')
const isComplete = ref(false)

// Date formatting utilities
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

// Typing animation logic
const startTypingAnimation = (text: string) => {
  displayText.value = ''
  isComplete.value = false
  let currentIndex = 0

  const typeNextCharacter = () => {
    if (currentIndex < text.length) {
      displayText.value += text[currentIndex]
      currentIndex++
      setTimeout(typeNextCharacter, 30)
    } else {
      isComplete.value = true
    }
  }

  // Start typing after a short delay
  setTimeout(typeNextCharacter, 500)
}

// Initialize typing animation when component mounts
onMounted(() => {
  if (props.event?.title) {
    startTypingAnimation(props.event.title)
  }
})
</script>

<style scoped>
/* Typing animation */
.typing-text {
  position: relative;
  background: linear-gradient(to right, #2563eb, #9333ea);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.typing-cursor {
  animation: blink 1s infinite;
  color: #3b82f6;
  font-weight: normal;
  -webkit-text-fill-color: #3b82f6;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .hero-content {
    padding-top: 2rem;
    padding-bottom: 2rem;
  }
}
</style>