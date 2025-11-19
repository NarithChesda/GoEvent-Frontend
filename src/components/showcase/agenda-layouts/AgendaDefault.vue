<template>
  <div
    v-if="agendaItems.length > 0"
    class="mb-4 sm:mb-5 laptop-sm:mb-5 laptop-md:mb-6 laptop-lg:mb-7 desktop:mb-6"
  >
    <!-- Welcome Header -->
    <div class="text-center laptop-sm:mb-3 laptop-md:mb-4 laptop-lg:mb-5 desktop:mb-8 laptop-sm:-mt-2 laptop-md:-mt-2 laptop-lg:-mt-3">
      <h2
        :class="[
          'leading-tight text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-regular sm:mb-4 md:mb-6 capitalize agenda-header',
          currentLanguage === 'kh' && 'khmer-text-fix',
        ]"
        :style="{
          fontFamily: primaryFont || currentFont,
          color: primaryColor,
        }"
      >
        {{ agendaHeaderText }}
      </h2>
    </div>

    <!-- Unified Tab Container -->
    <div class="unified-tab-container" :style="{ '--primary-color': primaryColor }">
      <!-- Tab Bar Navigation -->
      <div class="tab-bar-scroll-wrapper">
        <div class="tab-bar">
          <button
            v-for="date in agendaTabs"
            :key="date"
            class="tab-button"
            :class="{ active: activeTab === date }"
            :style="getTabStyle(date)"
            @click="selectTab(date)"
          >
            <span
              :class="['tab-date font-semibold', currentLanguage === 'kh' && 'khmer-text-fix']"
              :style="{ fontFamily: primaryFont || currentFont }"
            >
              {{ formatAgendaDate(date) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="tab-content-area">
        <div
          v-for="date in agendaTabs"
          :key="date"
          v-show="activeTab === date"
          class="tab-panel"
        >
          <!-- First agenda description at top center -->
          <div v-if="getFirstAgendaDescription(date)" class="text-center mb-4 px-2">
            <h4
              :class="[
                'font-regular text-sm sm:text-base',
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
          <div class="space-y-0">
            <div
              v-for="(item, index) in agendaByDate[date] || []"
              :key="item.id"
              class="agenda-item-animate"
              :style="{ '--item-index': index }"
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
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import AgendaItem from '../AgendaItem.vue'
import {
  translateRSVP,
  formatDateLocalized,
  type SupportedLanguage,
} from '../../../utils/translations'

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
    keyof typeof import('../../../utils/translations').rsvpTranslations.en
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

// State for active tab
const activeTab = ref<string | null>(null)

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

// Methods for tab functionality
const selectTab = (date: string) => {
  activeTab.value = date
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

// Style helper for tabs matching AgendaWedding
const getTabStyle = (date: string) => {
  const isActive = activeTab.value === date
  return {
    backgroundColor: isActive ? props.primaryColor : `${props.primaryColor}10`,
    color: isActive ? '#ffffff' : props.primaryColor,
    fontFamily: props.primaryFont || props.currentFont,
    transform: isActive ? 'scale(1.05)' : 'scale(1)',
    boxShadow: isActive ? `0 4px 12px ${props.primaryColor}30` : 'none',
  }
}

// Select the first tab by default on mount
onMounted(() => {
  if (agendaTabs.value.length > 0) {
    activeTab.value = agendaTabs.value[0]
  }
})
</script>

<style scoped>
/* Unified Tab Container */
.unified-tab-container {
  width: 100%;
}

.tab-bar-scroll-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

.tab-bar-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

.tab-bar {
  display: flex;
  gap: 0.5rem;
  min-width: min-content;
  justify-content: center;
  flex-wrap: wrap;
}

@media (min-width: 640px) {
  .tab-bar {
    gap: 0.75rem;
  }
}

/* Tab Buttons - Matching AgendaWedding */
.tab-button {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  border-radius: 9999px;
  border: none;
  outline: none;
  transition: all 0.3s ease;
  cursor: pointer;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .tab-button {
    padding: 0.75rem 1.75rem;
  }
}

.tab-button:hover {
  transform: scale(1.05) !important;
}

.tab-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.tab-date {
  font-size: 0.875rem;
  line-height: 1.2;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .tab-date {
    font-size: 1rem;
  }
}

/* Khmer language tab date - reduce padding */
.tab-date.khmer-text-fix {
  line-height: 1.4 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

/* Tab Content Area */
.tab-content-area {
  position: relative;
}

.tab-panel {
  animation: fadeIn 0.3s ease-in-out;
}

/* Agenda Item Scroll Animation */
.agenda-item-animate {
  opacity: 0;
  animation: slideInUp 0.5s ease-out forwards;
  animation-delay: calc(var(--item-index) * 0.1s);
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


/* Enhanced Khmer font rendering */
.khmer-text-fix {
  line-height: 1.8 !important;
  padding-top: 0.3em !important;
  padding-bottom: 0.3em !important;
  margin-top: 0.2em;
  margin-bottom: 0.2em;
  /* Safari-specific: Prevent breaking Khmer characters */
  word-break: keep-all !important;
  overflow-wrap: anywhere !important;
  hyphens: none !important;
  -webkit-hyphens: none !important;
}

/* Small laptops 13-inch (1024px-1365px) - Match AgendaWedding */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Header text - match AgendaWedding header */
  .agenda-header {
    font-size: 1.25rem !important; /* 20px - match AgendaWedding header */
    line-height: 1.25 !important; /* Match mobile leading-tight */
    padding-top: 0rem !important; /* Removed top padding to reduce space */
    padding-bottom: 0.3375rem !important; /* 0.5rem * 0.675 (py-2) */
  }

  /* Tab bar compact sizing */
  .tab-button {
    padding: 0.625rem 1.25rem !important;
  }

  .tab-date {
    font-size: 0.625rem !important; /* 10px - match AgendaWedding tab text */
  }
}

/* Medium laptops 14-15 inch (1366px-1535px) - Match AgendaWedding */
@media (min-width: 1366px) and (max-width: 1535px) {
  /* Header text - match AgendaWedding header */
  .agenda-header {
    font-size: 1.25rem !important; /* 20px - match AgendaWedding header */
    line-height: 1.25 !important; /* Match mobile leading-tight */
    padding-top: 0rem !important; /* Removed top padding to reduce space */
    padding-bottom: 0.375rem !important; /* 0.5rem * 0.75 (py-2) */
  }

  /* Tab bar larger gap like AgendaWedding */
  .tab-button {
    padding: 0.75rem 1.75rem !important; /* 640px+ sizing */
  }

  .tab-date {
    font-size: 0.625rem !important; /* 10px - match AgendaWedding tab text */
  }
}

/* Desktop (1536px+) - Simple, clean desktop styles */
@media (min-width: 1536px) {
  h2 {
    font-size: 1.875rem !important; /* 30px - text-3xl */
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .tab-button,
  .agenda-item-animate {
    animation: none;
    opacity: 1;
  }

  .tab-button:hover {
    transform: none;
  }
}
</style>
