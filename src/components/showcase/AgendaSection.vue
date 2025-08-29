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
      <div v-for="date in agendaTabs" :key="date" class="agenda-date-section mb-3 last:mb-0">

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
import { computed, ref } from 'vue'
import AgendaItem from './AgendaItem.vue'
import {
  translateRSVP,
  formatDateLocalized,
  type SupportedLanguage
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

// State for expanded cards
const expandedCards = ref<Set<string>>(new Set())

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

// Methods for collapse functionality
const isCardExpanded = (date: string): boolean => {
  return expandedCards.value.has(date)
}

const toggleCard = (date: string) => {
  if (expandedCards.value.has(date)) {
    expandedCards.value.delete(date)
  } else {
    expandedCards.value.add(date)
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
</script>

<style scoped>
/* Agenda date sections - No horizontal padding to match payment section */
.agenda-date-section {
  position: relative;
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
  transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.3s ease-in-out;
  will-change: max-height, opacity;
  transform-origin: top;
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
