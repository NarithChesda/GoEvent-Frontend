<template>
  <div
    v-if="agendaItems.length > 0"
    class="mb-4 sm:mb-5 laptop-sm:mb-5 laptop-md:mb-6 laptop-lg:mb-7 desktop:mb-6"
  >
    <!-- Welcome Header -->
    <div class="text-center laptop-sm:mb-6 laptop-md:mb-8 laptop-lg:mb-10 desktop:mb-8">
      <h2
        :class="[
          'leading-relaxed py-2 text-lg sm:text-xl md:text-2xl font-semibold sm:mb-4 md:mb-6 capitalize gradient-text',
          currentLanguage === 'kh' && 'khmer-text-fix',
        ]"
        :style="{
          fontFamily: primaryFont || currentFont,
          '--gradient-start': primaryColor,
          '--gradient-end': secondaryColor || accentColor,
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
        class="agenda-date-section"
        :style="{ '--animation-delay': `${dateIndex * 100}ms` }"
      >
        <!-- Agenda Date Card - Unified Design -->
        <div
          class="agenda-card-container"
          :style="{
            '--primary-color': primaryColor,
            backgroundColor: `${primaryColor}15`,
            border: `1px solid ${primaryColor}40`,
          }"
        >
          <!-- Collapsible Card Header - Always Visible -->
          <div class="agenda-card-header" @click="toggleCard(date)">
            <div class="flex items-center justify-between p-4">
              <!-- Date Info -->
              <div class="flex items-center space-x-3">
                <div class="icon-container" :style="{ backgroundColor: `${primaryColor}08` }">
                  <svg
                    class="w-5 h-5"
                    :style="{ color: primaryColor }"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    :class="[
                      'font-semibold text-sm sm:text-base',
                      currentLanguage === 'kh' && 'khmer-text-fix',
                    ]"
                    :style="{
                      color: primaryColor,
                      fontFamily: primaryFont || currentFont,
                    }"
                  >
                    {{ formatAgendaDate(date) }}
                  </h3>
                  <div
                    :class="['activity-count', currentLanguage === 'kh' && 'khmer-text-fix']"
                    :style="{ color: primaryColor, fontFamily: secondaryFont || currentFont }"
                  >
                    <span
                      >{{ agendaByDate[date]?.length || 0 }}
                      {{ getActivityCountText(agendaByDate[date]?.length || 0) }}</span
                    >
                  </div>
                </div>
              </div>

              <!-- Expand/Collapse Arrow -->
              <div class="expand-arrow" :class="{ expanded: isCardExpanded(date) }">
                <svg
                  class="w-5 h-5"
                  :style="{ color: primaryColor }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <!-- Expandable Content -->
          <div class="agenda-card-content" :class="{ expanded: isCardExpanded(date) }">
            <div class="agenda-scrollable-wrapper">
              <div
                class="agenda-scrollable-content"
                @scroll="throttledScrollHandler($event, date)"
                :ref="(el) => setScrollRef(el as HTMLElement | null, date)"
              >
                <!-- First agenda description at top center -->
                <div v-if="getFirstAgendaDescription(date)" class="text-center mb-3 px-2">
                  <h4
                    :class="[
                      'font-semibold text-sm sm:text-base',
                      currentLanguage === 'kh' && 'khmer-text-fix',
                    ]"
                    :style="{
                      color: primaryColor,
                      fontFamily: primaryFont || currentFont,
                    }"
                  >
                    {{ getFirstAgendaDescription(date) }}
                  </h4>
                </div>

                <!-- Agenda Items for this date -->
                <div class="space-y-4">
                  <div v-for="item in agendaByDate[date] || []" :key="item.id">
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

              <!-- Scroll indicator -->
              <div
                v-show="scrollStates[date]?.canScrollDown"
                class="scroll-indicator"
                :style="{ '--indicator-color': primaryColor }"
              >
                <div class="scroll-indicator-content">
                  <div class="scroll-text">Scroll for more</div>
                  <svg class="scroll-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
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
import { computed, ref, onMounted } from 'vue'
import AgendaItem from './AgendaItem.vue'
import {
  translateRSVP,
  formatDateLocalized,
  type SupportedLanguage,
} from '../../utils/translations'

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

// Throttled scroll handler for better performance
const throttledScrollHandler = throttle((event: Event, date: string) => {
  checkScrollState(date)
}, 16) // ~60fps

// Simple throttle function
function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: number | null = null
  let lastExecTime = 0

  return ((...args: Parameters<T>) => {
    const currentTime = Date.now()

    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(
        () => {
          func(...args)
          lastExecTime = Date.now()
        },
        delay - (currentTime - lastExecTime),
      )
    }
  }) as T
}

// Enhanced translation function that combines database content with frontend translations
const getTextContent = (textType: string, fallback = ''): string => {
  // First, try to get content from database (eventTexts)
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(
      (text) => text.text_type === textType && text.language === props.currentLanguage,
    )
    if (text?.content) {
      return text.content
    }
  }

  // Fallback to frontend translation system
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'

  // Map text types to translation keys
  const keyMap: Record<
    string,
    keyof typeof import('../../utils/translations').rsvpTranslations.en
  > = {
    agenda_header: 'agenda_header',
    agenda_activity: 'agenda_activity',
    agenda_activities: 'agenda_activities',
  }

  const translationKey = keyMap[textType]
  if (translationKey) {
    return translateRSVP(translationKey, currentLang)
  }

  return fallback
}

// State for expanded card (only one at a time)
const expandedCard = ref<string | null>(null)

// State for scroll indicators
const scrollStates = ref<Record<string, { canScrollDown: boolean; canScrollUp: boolean }>>({})

// Store refs to scroll elements
const scrollRefs = ref<Record<string, HTMLElement>>({})

// Group agenda items by date
const agendaByDate = computed(() => {
  const grouped: Record<string, AgendaItemData[]> = {}

  props.agendaItems.forEach((item) => {
    const date = item.date || 'No Date'
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(item)
  })

  // Sort items within each date by order
  Object.keys(grouped).forEach((date) => {
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
const agendaHeaderText = computed(() => getTextContent('agenda_header', 'Event Schedule'))

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

    // Check scroll state after expansion animation with RAF for better performance
    requestAnimationFrame(() => {
      setTimeout(() => {
        checkScrollState(date)
      }, 300) // Wait for expansion animation
    })
  }
}

const setScrollRef = (el: HTMLElement | null, date: string) => {
  if (el) {
    scrollRefs.value[date] = el
    // Initialize scroll state when element is mounted
    requestAnimationFrame(() => {
      checkScrollState(date)
    })
  }
}

const checkScrollState = (date: string) => {
  const scrollElement = scrollRefs.value[date]
  if (!scrollElement) return

  const { scrollTop, scrollHeight, clientHeight } = scrollElement
  const canScrollDown = scrollTop < scrollHeight - clientHeight - 5
  const canScrollUp = scrollTop > 5

  // Only update if state actually changed
  const currentState = scrollStates.value[date]
  if (
    !currentState ||
    currentState.canScrollDown !== canScrollDown ||
    currentState.canScrollUp !== canScrollUp
  ) {
    scrollStates.value[date] = { canScrollDown, canScrollUp }
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
  Object.keys(agendaByDate.value).forEach((date) => {
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

// Setup simple intersection observer for animation
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement
          element.classList.add('animate-in')
          observer.unobserve(element)
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
  )

  // Observe all agenda cards
  const cards = document.querySelectorAll('.agenda-date-section')
  cards.forEach((card) => observer.observe(card))
})
</script>

<style scoped>
/* CSS Custom Properties for better performance */
.gradient-text {
  background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Optimized animation system */
.agenda-date-section {
  position: relative;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: var(--animation-delay, 0ms);
}

.agenda-date-section.animate-in {
  opacity: 1;
  transform: translateY(0);
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

/* Optimized card container */
.agenda-card-container {
  border-radius: 1.5rem;
  position: relative;
  overflow: hidden;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  transform: translateZ(0);
  backdrop-filter: blur(16px);
  box-shadow:
    0 12px 36px -6px var(--primary-color) 25,
    0 6px 24px -3px var(--primary-color) 20,
    0 3px 12px -1px var(--primary-color) 15,
    inset 0 1px 2px rgba(255, 255, 255, 0.12);
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

.agenda-card-container:hover {
  transform: translateY(-2px) translateZ(0);
  box-shadow:
    0 20px 40px -8px var(--primary-color) 25,
    0 8px 32px -4px var(--primary-color) 20,
    0 4px 16px -2px var(--primary-color) 15,
    inset 0 1px 2px rgba(255, 255, 255, 0.15);
}

/* Card header optimization */
.agenda-card-header {
  cursor: pointer;
  transition: backdrop-filter 0.3s ease;
}

.agenda-card-header:hover {
  backdrop-filter: blur(20px);
}

.icon-container {
  padding: 0.5rem;
  border-radius: 0.75rem;
}

.activity-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  opacity: 0.7;
}

/* Optimized expand/collapse animation */
.expand-arrow {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.6;
}

.expand-arrow.expanded {
  transform: rotate(180deg);
}

/* Improved content expansion */
.agenda-card-content {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition:
    max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.4s ease-in-out;
  will-change: max-height, opacity;
  contain: layout style;
}

.agenda-card-content.expanded {
  max-height: 60vh;
  opacity: 1;
}

/* Scrollable optimization */
.agenda-scrollable-wrapper {
  position: relative;
  max-height: 50vh;
}

.agenda-scrollable-content {
  max-height: 50vh;
  overflow-y: auto;
  padding: 1rem 1.5rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.agenda-scrollable-content::-webkit-scrollbar {
  display: none;
}

/* Optimized scroll indicator */
.scroll-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3rem;
  pointer-events: none;
  background: linear-gradient(transparent, var(--indicator-color, #4f46e5) 30);
  border-radius: 0 0 1.5rem 1.5rem;
  transition: opacity 0.3s ease;
}

.scroll-indicator-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: end;
  height: 100%;
  padding-bottom: 0.75rem;
  color: var(--indicator-color, #4f46e5);
  opacity: 0.8;
}

.scroll-text {
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.scroll-arrow {
  width: 1.25rem;
  height: 1.25rem;
  animation: bounce 2s infinite;
}

/* Responsive breakpoints - consolidated */
@media (min-width: 640px) {
  .agenda-scrollable-content {
    padding: 1.5rem;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .agenda-date-section,
  .agenda-card-container,
  .expand-arrow,
  .agenda-card-content {
    transition: none;
  }

  .scroll-arrow {
    animation: none;
  }
}

/* Bounce animation */
@keyframes bounce {
  0%,
  20%,
  53%,
  80%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  40%,
  43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}

/* Enhanced Khmer font rendering */
.khmer-text-fix {
  line-height: 1.8 !important;
  padding-top: 0.3em !important;
  padding-bottom: 0.3em !important;
  margin-top: 0.2em;
  margin-bottom: 0.2em;
}

/* Compact Khmer text for agenda card header (collapsed state only) */
.agenda-card-header .khmer-text-fix {
  line-height: 1.4 !important;
  padding-top: 0.1em !important;
  padding-bottom: 0.1em !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

/* Small laptops 13-inch (1024px-1365px) - Keep mobile sizes */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Header text - match RSVP header size */
  h2 {
    font-size: 1rem !important; /* 16px - same as RSVP text-lg in collapsed */
  }

  /* Overall section spacing - match mobile compact */
  .mb-4.sm\:mb-5.laptop-sm\:mb-5.laptop-md\:mb-6.laptop-lg\:mb-7.desktop\:mb-6 {
    margin-bottom: 1rem !important; /* Mobile spacing */
  }

  /* Header container spacing - more compact */
  .text-center.laptop-sm\:mb-6.laptop-md\:mb-8.laptop-lg\:mb-10.desktop\:mb-8 {
    margin-bottom: 1rem !important; /* Mobile spacing */
  }

  /* Card container spacing - reduce space between cards */
  .space-y-3 {
    gap: 0.5rem !important; /* Tighter spacing between cards */
  }

  .space-y-3 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 0.5rem !important;
  }

  /* Container mobile sizing */
  .agenda-card-container {
    border-radius: 1rem !important; /* Even smaller radius like mobile */
  }

  /* Card header mobile padding - MORE COMPACT for collapsed state */
  .agenda-card-header .flex {
    padding: 0.5rem 0.75rem !important; /* Vertical padding much smaller */
  }

  /* Icon container mobile size - smaller */
  .icon-container {
    padding: 0.25rem !important; /* Smaller padding */
  }

  /* Icons mobile size - smaller */
  .icon-container svg,
  .expand-arrow svg {
    width: 0.875rem !important; /* Smaller icons */
    height: 0.875rem !important;
  }

  /* Date text - match RSVP collapsed text size */
  .agenda-card-header h3 {
    font-size: 0.8125rem !important; /* 13px - same as RSVP text-sm */
    line-height: 1.2 !important; /* Tighter line height */
  }

  /* Activity count - match RSVP collapsed small text */
  .activity-count {
    font-size: 0.6875rem !important; /* 11px - same as RSVP text-xs */
    margin-top: 0 !important; /* Remove top margin */
    line-height: 1.2 !important; /* Tighter line height */
  }

  /* Space between date and activity count - tighter */
  .agenda-card-header .flex .space-x-3 > :not([hidden]) ~ :not([hidden]) {
    margin-left: 0.5rem !important; /* Reduce space */
  }

  /* KEEP expanded content at original desktop sizes - DON'T reduce */
  .agenda-card-content.expanded {
    max-height: 60vh !important; /* Keep original expanded height */
  }

  .agenda-scrollable-wrapper {
    max-height: 50vh !important; /* Keep original expanded height */
  }

  .agenda-scrollable-content {
    max-height: 50vh !important; /* Keep original expanded height */
    padding: 1rem 1.5rem !important; /* Keep original expanded padding */
  }

  /* First agenda description mobile size */
  .agenda-scrollable-content h4 {
    font-size: 0.8125rem !important; /* 13px - match other text */
  }

  /* Agenda items spacing */
  .space-y-4 {
    gap: 0.75rem !important; /* Tighter spacing between agenda items */
  }

  .space-y-4 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 0.75rem !important;
  }

  /* Scroll indicator mobile size */
  .scroll-indicator {
    height: 2rem !important; /* Smaller indicator */
  }

  .scroll-text {
    font-size: 0.6875rem !important; /* 11px */
  }

  .scroll-arrow {
    width: 0.875rem !important; /* Smaller arrow */
    height: 0.875rem !important;
  }

  /* Box shadow - more subtle like mobile */
  .agenda-card-container {
    box-shadow:
      0 4px 16px -4px var(--primary-color, #000) 15,
      0 2px 8px -2px var(--primary-color, #000) 10,
      inset 0 1px 2px rgba(255, 255, 255, 0.08) !important;
  }

  .agenda-card-container:hover {
    box-shadow:
      0 8px 24px -4px var(--primary-color, #000) 20,
      0 4px 12px -2px var(--primary-color, #000) 15,
      inset 0 1px 2px rgba(255, 255, 255, 0.1) !important;
  }
}

/* Medium laptops 14-15 inch (1366px+) */
@media (min-width: 1366px) {
  h2 {
    font-size: 1.5rem !important; /* 24px - md:text-2xl */
  }
}
</style>
