<template>
  <div v-if="agendaItems.length > 0" class="mb-4 sm:mb-5 laptop-sm:mb-5 laptop-md:mb-6 laptop-lg:mb-7 desktop:mb-6">
    <!-- Welcome Header -->
    <div class="text-center laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8">
      <h2
        class="leading-relaxed py-2 text-lg sm:text-xl md:text-2xl font-semibold sm:mb-4 md:mb-6 uppercase"
        :style="{
          fontFamily: primaryFont || currentFont,
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }"
      >
        {{ agendaHeaderText }}
      </h2>
    </div>

    <!-- Agenda Collapse Cards -->
    <div class="space-y-3">
      <div 
        v-for="(date, dateIndex) in agendaTabs" 
        :key="date" 
        class="agenda-date-section mb-3 last:mb-0 agenda-card-animated"
        :ref="el => setupCardAnimation(el, `agenda-card-${date}`, dateIndex)"
      >

        <!-- Agenda Date Card - Unified Design -->
        <div
          class="agenda-card-container transition-all duration-300"
          :style="{
            backgroundColor: `${primaryColor}15`,
            boxShadow: `
              0 12px 36px -6px ${primaryColor}25,
              0 6px 24px -3px ${primaryColor}20,
              0 3px 12px -1px ${primaryColor}15,
              inset 0 1px 2px rgba(255, 255, 255, 0.12)
            `,
            border: `1px solid ${primaryColor}40`,
            backdropFilter: 'blur(16px)'
          }"
        >
          <!-- Collapsible Card Header - Always Visible -->
          <div
            class="agenda-card-header cursor-pointer transition-all duration-300 hover:translateY(-1px)"
            @click="toggleCard(date)"
          >
            <div class="flex items-center justify-between p-4">
              <!-- Date Info -->
              <div class="flex items-center space-x-3">
                <div class="p-2 rounded-xl" :style="{ backgroundColor: `${primaryColor}08` }">
                  <svg class="w-5 h-5" :style="{ color: primaryColor }" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h3 class="font-semibold text-sm sm:text-base"
                      :style="{
                        color: primaryColor,
                        fontFamily: primaryFont || currentFont
                      }">
                    {{ formatAgendaDate(date) }}
                  </h3>
                  <div class="flex items-center space-x-2 text-xs mt-1"
                       :style="{ color: primaryColor, opacity: '0.7', fontFamily: secondaryFont || currentFont }">
                    <span>{{ agendaByDate[date]?.length || 0 }} {{ getActivityCountText(agendaByDate[date]?.length || 0) }}</span>
                  </div>
                </div>
              </div>

              <!-- Expand/Collapse Arrow -->
              <div class="transition-transform duration-300" :class="{ 'rotate-180': isCardExpanded(date) }">
                <svg class="w-5 h-5" :style="{ color: primaryColor, opacity: '0.6' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Expandable Content -->
          <div
            class="agenda-card-content overflow-hidden transition-all duration-500 ease-in-out"
            :class="isCardExpanded(date) ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'"
          >
            <div class="p-4 sm:p-6">
              <!-- First agenda description at top center -->
              <div v-if="getFirstAgendaDescription(date)" 
                   class="text-center mb-3 px-2">
                <h4 class="font-semibold text-sm sm:text-base"
                   :style="{
                     color: primaryColor,
                     fontFamily: primaryFont || currentFont
                   }">
                  {{ getFirstAgendaDescription(date) }}
                </h4>
              </div>

              <!-- Agenda Items for this date -->
              <div class="space-y-4">
                <div
                  v-for="item in agendaByDate[date] || []"
                  :key="item.id"
                >
                  <AgendaItem
                    :item="item"
                    :primary-color="primaryColor"
                    :accent-color="accentColor"
                    :current-font="currentFont"
                    :primary-font="primaryFont"
                    :secondary-font="secondaryFont"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import AgendaItem from './AgendaItem.vue'
import {
  translateRSVP,
  formatDateLocalized,
  type SupportedLanguage
} from '../../utils/translations'
import { useStaggerAnimation } from '../../composables/useAdvancedAnimations'
import { ANIMATION_CONSTANTS } from '../../composables/useScrollAnimations'

interface AgendaItemIcon {
  id: number
  name: string
  svg_code: string
}

interface AgendaItemData {
  id: number
  title: string
  description?: string
  color?: string
  date?: string
  start_time_text?: string
  end_time_text?: string
  order?: number
  icon?: AgendaItemIcon
}

interface Props {
  agendaItems: AgendaItemData[]
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
}

interface EventText {
  text_type: string
  language: string
  content: string
}

const props = defineProps<Props>()

// Animation setup for staggered card reveals
const { observeStaggerElement, cleanup: cleanupStagger } = useStaggerAnimation({
  animationType: 'slideUp',
  duration: ANIMATION_CONSTANTS.DURATION.NORMAL,
  staggerDelay: ANIMATION_CONSTANTS.DELAY.SHORT,
  easing: ANIMATION_CONSTANTS.EASING.EXPO,
  threshold: 0.2
})

// Enhanced translation function that combines database content with frontend translations
const getTextContent = (textType: string, fallback = ''): string => {
  // First, try to get content from database (eventTexts)
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(text =>
      text.text_type === textType && text.language === props.currentLanguage
    )
    if (text?.content) {
      return text.content
    }
  }

  // Fallback to frontend translation system
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'

  // Map text types to translation keys
  const keyMap: Record<string, keyof typeof import('../../utils/translations').rsvpTranslations.en> = {
    'agenda_header': 'agenda_header',
    'agenda_activity': 'agenda_activity',
    'agenda_activities': 'agenda_activities'
  }

  const translationKey = keyMap[textType]
  if (translationKey) {
    return translateRSVP(translationKey, currentLang)
  }

  return fallback
}

// State for expanded card (only one at a time)
const expandedCard = ref<string | null>(null)

// Group agenda items by date
const agendaByDate = computed(() => {
  const grouped: Record<string, AgendaItemData[]> = {}

  props.agendaItems.forEach(item => {
    const date = item.date || 'No Date'
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(item)
  })

  // Sort items within each date by order
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => (a.order || 0) - (b.order || 0))
  })

  return grouped
})

// Get sorted date tabs
const agendaTabs = computed(() => {
  const dates = Object.keys(agendaByDate.value)
  return dates.sort((a, b) => {
    if (a === 'No Date') return 1
    if (b === 'No Date') return -1
    return new Date(a).getTime() - new Date(b).getTime()
  })
})

// Translatable text computed properties
const agendaHeaderText = computed(() =>
  getTextContent('agenda_header', 'Event Schedule')
)

const getActivityCountText = (count: number): string => {
  if (count === 1) {
    return getTextContent('agenda_activity', 'activity')
  } else {
    return getTextContent('agenda_activities', 'activities')
  }
}

// Methods for accordion functionality
const isCardExpanded = (date: string): boolean => {
  return expandedCard.value === date
}

const toggleCard = (date: string) => {
  // If clicking the same card that's already expanded, close it
  if (expandedCard.value === date) {
    expandedCard.value = null
  } else {
    // Otherwise, open this card (automatically closes any other open card)
    expandedCard.value = date
  }
}

const formatAgendaDate = (dateString: string): string => {
  if (dateString === 'No Date') return 'TBD'

  try {
    const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
    return formatDateLocalized(dateString, 'compact', currentLang)
  } catch {
    return dateString
  }
}

// Computed property to get first agenda description for each date
const firstAgendaDescriptions = computed(() => {
  const descriptions: Record<string, string> = {}
  Object.keys(agendaByDate.value).forEach(date => {
    const agendaItems = agendaByDate.value[date] || []
    const firstItem = agendaItems[0]
    descriptions[date] = firstItem?.description || ''
  })
  return descriptions
})

const getFirstAgendaDescription = (date: string): string => {
  const description = firstAgendaDescriptions.value[date] || ''
  // Capitalize first letter if description exists
  return description ? description.charAt(0).toUpperCase() + description.slice(1) : ''
}

// Setup card animations
const setupCardAnimation = (el: any, id: string, index: number) => {
  if (el && typeof el === 'object' && 'tagName' in el) {
    // This is a DOM element, set up the stagger animation
    nextTick(() => {
      observeStaggerElement(el, id, 'agenda-cards')
    })
  }
}

// Setup animations on mount
onMounted(() => {
  nextTick(() => {
    // Cards will be observed individually through setupCardAnimation
    
    // Fallback: Ensure cards are visible after a short delay if animation system fails
    setTimeout(() => {
      const animatedCards = document.querySelectorAll('.agenda-card-animated')
      animatedCards.forEach((card) => {
        const htmlCard = card as HTMLElement
        // Only apply fallback if the element is still hidden (animation didn't trigger)
        if (htmlCard.style.opacity === '0' || (!htmlCard.style.opacity && window.getComputedStyle(htmlCard).opacity === '0')) {
          htmlCard.style.opacity = '1'
          htmlCard.style.transform = 'translateY(0)'
          htmlCard.style.transition = 'all 0.6s cubic-bezier(0.19, 1, 0.22, 1)'
        }
      })
    }, 1000) // Give animation system time to work first
  })
})
</script>

<style scoped>
/* Agenda date sections - No horizontal padding to match payment section */
.agenda-date-section {
  position: relative;
}

/* Stagger animation base styles - Start visible, let animations enhance */
.agenda-card-animated {
  opacity: 1;
  transform: translateY(0);
  will-change: opacity, transform;
  transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
}

.agenda-date-section:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

/* Unified agenda card container */
.agenda-card-container {
  border-radius: 1.5rem;
  position: relative;
  overflow: hidden;
}

.agenda-card-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
  pointer-events: none;
}

/* Agenda card header - no separate styling */
.agenda-card-header {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.agenda-card-header:hover {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.agenda-card-content {
  transition: max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.4s ease-in-out,
              transform 0.6s cubic-bezier(0.19, 1, 0.22, 1);
  will-change: max-height, opacity, transform;
  transform-origin: top;
}

/* Reduce motion for accessibility - Let useAdvancedAnimations handle this */
@media (prefers-reduced-motion: reduce) {
  .agenda-card-animated {
    /* useAdvancedAnimations will handle reduced motion preferences */
  }
}

/* Enhanced card hover effects */
.agenda-card-container {
  transform: translateZ(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.agenda-card-container:hover {
  transform: translateY(-2px) translateZ(0);
  box-shadow: 
    0 20px 40px -8px var(--primary-color, #4f46e5)25,
    0 8px 32px -4px var(--primary-color, #4f46e5)20,
    0 4px 16px -2px var(--primary-color, #4f46e5)15,
    inset 0 1px 2px rgba(255, 255, 255, 0.15);
}

/* Enhanced smooth expansion animation */
.agenda-card-content {
  transition: max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.4s ease-in-out,
              transform 0.6s cubic-bezier(0.19, 1, 0.22, 1),
              padding 0.3s ease;
  will-change: max-height, opacity, transform;
  transform-origin: top;
  contain: layout style;
}

/* Add subtle scale effect when expanding */
.agenda-card-content:not([style*="max-height: 0px"]) {
  transform: scaleY(1);
}

/* Collapsed state has slightly compressed appearance */
.agenda-card-content[style*="max-height: 0px"] {
  transform: scaleY(0.95);
}

/* Mobile-first responsive design */
@media (max-width: 639px) {
  .agenda-date-section {
    /* No padding - matches payment section */
  }
}

/* Tablet adjustments */
@media (min-width: 640px) and (max-width: 1023px) {
  .agenda-date-section {
    /* No padding - matches payment section */
  }
}

/* Desktop refinements */
@media (min-width: 1024px) {
  .agenda-date-section {
    /* No padding - matches payment section */
  }
}
</style>
