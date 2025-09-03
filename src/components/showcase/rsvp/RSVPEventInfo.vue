<template>
  <div class="rsvp-section-tight">
    <!-- Event Header - Two Row Layout -->
    <div class="event-info-header text-center mb-6">
      <!-- Row 1: Event Date -->
      <div class="mb-2">
        <div class="text-lg font-medium" :style="{
          color: primaryColor,
          fontFamily: primaryFont || currentFont
        }">
          {{ formatEventDate }}
        </div>
      </div>

      <!-- Row 2: Time & Status Badge Group (Centered) -->
      <div class="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
        <!-- Time -->
        <div class="text-sm" :style="{
          color: primaryColor,
          opacity: '0.85',
          fontFamily: secondaryFont || currentFont
        }">
          {{ formatEventTime }}
        </div>

        <!-- Status Badge -->
        <div v-if="isEventPast" class="flex items-center px-3 py-1.5 rounded-full text-sm font-medium" :style="{
          backgroundColor: `${primaryColor}15`,
          color: primaryColor,
          fontFamily: secondaryFont || currentFont
        }">
          <div class="w-2 h-2 rounded-full mr-2" :style="{ backgroundColor: primaryColor, opacity: '0.6' }"></div>
          {{ eventPastText }}
        </div>
        <div v-else-if="isEventToday" class="flex items-center px-3 py-1.5 rounded-full text-sm font-medium" :style="{
          backgroundColor: `${primaryColor}20`,
          color: primaryColor,
          fontFamily: secondaryFont || currentFont
        }">
          <div class="w-2 h-2 rounded-full mr-2 animate-pulse" :style="{ backgroundColor: primaryColor }"></div>
          {{ eventTodayText }}
        </div>
        <div v-else-if="isEventUpcoming" class="flex items-center px-3 py-1.5 rounded-full text-sm font-medium" :style="{
          backgroundColor: `${primaryColor}10`,
          color: primaryColor,
          fontFamily: secondaryFont || currentFont
        }">
          <div class="w-2 h-2 rounded-full mr-2" :style="{ backgroundColor: primaryColor, opacity: '0.8' }"></div>
          {{ eventUpcomingText }}
        </div>
      </div>

      <!-- Location (if provided) -->
      <div v-if="eventLocation" class="mt-3 text-sm" :style="{
        color: primaryColor,
        opacity: '0.75',
        fontFamily: secondaryFont || currentFont
      }">
        <MapPin class="w-4 h-4 inline mr-1" />
        {{ eventLocation }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MapPin } from 'lucide-vue-next'
import type { RSVPEventInfoProps } from '../../../types/showcase'
import {
  translateRSVP,
  type SupportedLanguage
} from '../../../utils/translations'

const props = defineProps<RSVPEventInfoProps>()

// Enhanced translation function
const getTextContent = (textType: string, fallback = ''): string => {
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(text =>
      text.text_type === textType && text.language === props.currentLanguage
    )
    if (text?.content) {
      return text.content
    }
  }

  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  const keyMap: Record<string, any> = {
    'event_past': 'rsvp_status_ended',
    'event_today': 'rsvp_status_live', 
    'event_upcoming': 'rsvp_header',
    'rsvp_status_ended': 'rsvp_status_ended',
    'rsvp_confirmation': 'rsvp_confirmation'
  }

  const translationKey = keyMap[textType]
  if (translationKey) {
    return translateRSVP(translationKey, currentLang)
  }

  return fallback
}

const eventPastText = computed(() => getTextContent('event_past', 'Event Completed'))
const eventTodayText = computed(() => getTextContent('event_today', 'Today'))
const eventUpcomingText = computed(() => getTextContent('event_upcoming', 'Upcoming'))

const formatEventDate = computed(() => {
  if (!props.eventDate) return ''
  try {
    const date = new Date(props.eventDate)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return props.eventDate
  }
})

const formatEventTime = computed(() => {
  if (!props.eventTime) return ''
  return props.eventTime
})

const isEventToday = computed(() => {
  if (!props.eventDate) return false
  try {
    const eventDate = new Date(props.eventDate).toDateString()
    const today = new Date().toDateString()
    return eventDate === today
  } catch {
    return false
  }
})

const isEventUpcoming = computed(() => {
  if (!props.eventDate || props.isEventPast) return false
  return !isEventToday.value
})
</script>

<style scoped>
.rsvp-section-tight {
  padding: 0 1.25rem 1rem;
}

.event-info-header {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>