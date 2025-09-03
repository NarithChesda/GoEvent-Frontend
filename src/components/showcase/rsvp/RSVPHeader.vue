<template>
  <div class="rsvp-header cursor-pointer transition-all duration-300 hover:translateY(-1px)" 
       @click="onToggle" 
       :style="{ padding: '1rem 1.25rem' }"
  >
    <div class="rsvp-header-content" :class="{ 'rsvp-header-content--expanded': isExpanded }">
      <!-- Mobile/Collapsed Layout -->
      <div v-if="!isExpanded" class="flex items-center justify-between w-full">
        <!-- Left: RSVP Title & Status -->
        <div class="flex items-center space-x-3">
          <h2 class="text-lg font-semibold" :style="{
            color: primaryColor,
            fontFamily: primaryFont || currentFont
          }">
            RSVP
          </h2>

          <!-- Compact Status Indicator -->
          <div v-if="rsvpStatus" class="flex items-center space-x-2">
            <div v-if="rsvpStatus === 'coming'" class="status-indicator" :style="{
              background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
              color: primaryColor
            }">
              ✓ Going
            </div>
            <div v-else-if="rsvpStatus === 'not_coming'" class="status-indicator" :style="{
              background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}08)`,
              color: primaryColor,
              opacity: '0.8'
            }">
              ✗ Not Going
            </div>
          </div>

          <!-- Event Date (collapsed only) -->
          <div class="hidden sm:block text-sm" :style="{
            color: primaryColor,
            opacity: '0.8',
            fontFamily: secondaryFont || currentFont
          }">
            {{ formatEventDateCompact }}
          </div>

          <!-- Event Status Badge (desktop only, collapsed only) -->
          <div v-if="isEventPast" class="hidden lg:flex items-center px-3 py-1 rounded-full text-xs font-medium" :style="{
            backgroundColor: `${primaryColor}15`,
            color: primaryColor,
            fontFamily: secondaryFont || currentFont
          }">
            <div class="w-2 h-2 rounded-full mr-2" :style="{ backgroundColor: primaryColor, opacity: '0.6' }"></div>
            {{ eventPastText }}
          </div>
        </div>

        <!-- Right: Expand/Collapse Icon -->
        <div class="expand-icon" :class="{ 'expanded': isExpanded }" :style="{ color: primaryColor }">
          <ChevronDown class="w-5 h-5 transition-transform duration-200" />
        </div>
      </div>

      <!-- Expanded/Centered Layout -->
      <div v-else class="expanded-header-layout">
        <h2 class="text-xl font-semibold text-center mb-2" :style="{
          color: primaryColor,
          fontFamily: primaryFont || currentFont
        }">
          RSVP
        </h2>

        <!-- Collapse Icon (positioned absolutely) -->
        <div class="absolute top-4 right-4 cursor-pointer" @click.stop="onToggle" :style="{ color: primaryColor }">
          <ChevronUp class="w-5 h-5 transition-transform duration-200" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import type { RSVPHeaderProps } from '../../../types/showcase'
import {
  translateRSVP,
  type SupportedLanguage
} from '../../../utils/translations'

const props = defineProps<RSVPHeaderProps>()

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
    'rsvp_status_ended': 'rsvp_status_ended',
    'rsvp_attending': 'rsvp_attending',
    'rsvp_cant_attend': 'rsvp_cant_attend',
    'rsvp_days': 'rsvp_days',
    'rsvp_hours': 'rsvp_hours',
    'rsvp_status_live': 'rsvp_status_live'
  }

  const translationKey = keyMap[textType]
  if (translationKey) {
    return translateRSVP(translationKey, currentLang)
  }

  return fallback
}

const eventPastText = computed(() => getTextContent('event_past', 'Event Completed'))

const formatEventDateCompact = computed(() => {
  if (!props.eventDate) return ''
  try {
    const date = new Date(props.eventDate)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  } catch {
    return props.eventDate
  }
})
</script>

<style scoped>
.rsvp-header-content {
  position: relative;
}

.rsvp-header-content--expanded {
  text-align: center;
}

.expanded-header-layout {
  position: relative;
  padding: 0.5rem 0;
}

.status-indicator {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid currentColor;
  border-opacity: 0.2;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.expand-icon {
  transition: transform 0.2s ease;
}
</style>