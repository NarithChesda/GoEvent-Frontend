<template>
  <div
    v-if="agendaItems.length > 0"
    class="agenda-birthday mb-4 sm:mb-5 laptop-sm:mb-5 laptop-md:mb-6 laptop-lg:mb-7 desktop:mb-6"
  >
    <!-- Fun Header -->
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

    <!-- Colorful Tab Navigation -->
    <div class="birthday-tab-container" :style="{ '--primary-color': primaryColor, '--accent-color': accentColor }">
      <div class="tab-bar-scroll-wrapper">
        <div class="tab-bar">
          <button
            v-for="date in agendaTabs"
            :key="date"
            class="birthday-tab-button"
            :class="{ active: activeTab === date }"
            :style="{
              background: activeTab === date ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})` : 'transparent',
              color: activeTab === date ? '#ffffff' : primaryColor,
              borderColor: activeTab === date ? 'transparent' : primaryColor,
            }"
            @click="selectTab(date)"
          >
            <span
              :class="['tab-date font-regular', currentLanguage === 'kh' && 'khmer-text-fix']"
              :style="{ fontFamily: primaryFont || currentFont }"
            >
              {{ formatAgendaDate(date) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Tab Content with Fun Cards -->
      <div class="tab-content-area">
        <div
          v-for="date in agendaTabs"
          :key="date"
          v-show="activeTab === date"
          class="tab-panel"
        >
          <!-- First agenda description -->
          <div v-if="getFirstAgendaDescription(date)" class="text-center mb-6 px-2">
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

          <!-- Vertical List Layout -->
          <div class="list-container">
            <div
              v-for="(item, index) in agendaByDate[date] || []"
              :key="item.id"
              class="agenda-item-wrapper"
              :style="{ '--item-index': index }"
            >
              <div class="agenda-item-content">
                <!-- Title -->
                <h3
                  :class="[
                    'font-regular leading-tight text-center capitalize mb-2',
                    currentLanguage === 'kh' && 'khmer-text-fix',
                    currentLanguage === 'kh'
                      ? 'text-base sm:text-lg md:text-xl laptop-sm:text-base laptop-md:text-lg laptop-lg:text-xl'
                      : 'text-lg sm:text-xl md:text-2xl laptop-sm:text-lg laptop-md:text-xl laptop-lg:text-2xl'
                  ]"
                  :style="{
                    color: primaryColor,
                    fontFamily: primaryFont || currentFont,
                  }"
                >
                  {{ item.title || 'Event Activity' }}
                </h3>

                <!-- Time -->
                <div
                  :class="[
                    'text-center',
                    currentLanguage === 'kh' && 'khmer-text-fix',
                    'text-sm sm:text-base md:text-lg laptop-sm:text-sm laptop-md:text-base laptop-lg:text-lg'
                  ]"
                  :style="{
                    color: primaryColor,
                    opacity: '0.7',
                    fontFamily: secondaryFont || currentFont
                  }"
                >
                  <span v-if="getTimeText(item)">{{ getTimeText(item) }}</span>
                  <span v-else>Time TBD</span>
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

const getTextContent = (textType: string, fallback = ''): string => {
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(
      (text) => text.text_type === textType && text.language === props.currentLanguage,
    )
    if (text?.content) {
      return text.content
    }
  }

  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  const keyMap: Record<
    string,
    keyof typeof import('../../../utils/translations').rsvpTranslations.en
  > = {
    agenda_header: 'agenda_header',
    agenda_header_birthday: 'agenda_header_birthday',
    agenda_activity: 'agenda_activity',
    agenda_activities: 'agenda_activities',
  }

  const translationKey = keyMap[textType]
  if (translationKey) {
    return translateRSVP(translationKey, currentLang)
  }

  return fallback
}

const activeTab = ref<string | null>(null)

const agendaByDate = computed(() => {
  const grouped: Record<string, AgendaItemData[]> = {}

  props.agendaItems.forEach((item) => {
    const date = item.date || 'No Date'
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(item)
  })

  Object.keys(grouped).forEach((date) => {
    grouped[date].sort((a, b) => (a.order || 0) - (b.order || 0))
  })

  return grouped
})

const agendaTabs = computed(() => {
  const dates = Object.keys(agendaByDate.value)
  return dates.sort((a, b) => {
    if (a === 'No Date') return 1
    if (b === 'No Date') return -1
    return new Date(a).getTime() - new Date(b).getTime()
  })
})

const agendaHeaderText = computed(() => getTextContent('agenda_header_birthday', 'Party Schedule'))

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
  return description ? description.charAt(0).toUpperCase() + description.slice(1) : ''
}

const getTimeText = (item: AgendaItemData): string | null => {
  const start = item.start_time_text
  const end = item.end_time_text

  if (start && end) {
    return `${start} - ${end}`
  } else if (start) {
    return start
  } else if (end) {
    return `Until ${end}`
  }

  return null
}

onMounted(() => {
  if (agendaTabs.value.length > 0) {
    activeTab.value = agendaTabs.value[0]
  }
})
</script>

<style scoped>
.agenda-birthday {
  width: 100%;
}

/* Birthday Tab Container */
.birthday-tab-container {
  width: 100%;
}

.tab-bar-scroll-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
}

.tab-bar-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

.tab-bar {
  display: flex;
  gap: 0.75rem;
  min-width: min-content;
  justify-content: center;
  flex-wrap: nowrap;
}

/* Fun Birthday Tab Buttons */
.birthday-tab-button {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 1.5rem;
  border: 2px solid;
  transition: all 0.3s ease;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.birthday-tab-button:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.birthday-tab-button.active {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.tab-date {
  font-size: 0.9375rem;
  line-height: 1.2;
  white-space: nowrap;
}

.tab-date.khmer-text-fix {
  line-height: 1.4 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

/* Tab Content */
.tab-content-area {
  position: relative;
}

.tab-panel {
  animation: fadeIn 0.3s ease-in-out;
}

/* Vertical List Layout */
.list-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.agenda-item-wrapper {
  opacity: 0;
  animation: smoothScrollIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--item-index) * 0.15s);
  margin-bottom: 2.5rem;
}

.agenda-item-wrapper:last-child {
  margin-bottom: 0;
}

.agenda-item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.agenda-item-content h3 {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.agenda-item-content:hover h3 {
  transform: scale(1.05);
  letter-spacing: 0.02em;
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

@keyframes smoothScrollIn {
  0% {
    opacity: 0;
    transform: translateY(60px) scale(0.95);
    filter: blur(8px);
  }
  50% {
    opacity: 0.7;
    filter: blur(2px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

/* Khmer text fix */
.khmer-text-fix {
  line-height: 1.8 !important;
  padding-top: 0.3em !important;
  padding-bottom: 0.3em !important;
  margin-top: 0.2em;
  margin-bottom: 0.2em;
  word-break: keep-all !important;
  overflow-wrap: anywhere !important;
  hyphens: none !important;
  -webkit-hyphens: none !important;
}

/* Responsive adjustments */
@media (min-width: 640px) {
  .list-container {
    padding: 0 2rem;
  }
}

/* Small laptops 13-inch (1024px-1365px) - Scaled to 67.5% matching mobile exactly */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Header text - scaled to 67.5% from mobile md:text-3xl (1.875rem) */
  .agenda-header {
    font-size: 1.265625rem !important; /* 1.875rem * 0.675 - exact mobile ratio matching CommentSection */
    line-height: 1.25 !important; /* Match mobile leading-tight */
    padding-top: 0rem !important; /* Removed top padding to reduce space */
    padding-bottom: 0.3375rem !important; /* 0.5rem * 0.675 (py-2) */
  }

  .tab-bar-scroll-wrapper {
    margin-bottom: 1.5rem !important;
  }

  .birthday-tab-button {
    padding: 0.58rem 1.16rem !important;
    border-radius: 1.16rem;
  }

  .tab-date {
    font-size: 0.728rem !important;
  }

  .agenda-item-wrapper {
    margin-bottom: 1.9406rem !important; /* 2.5rem * 0.77625 */
  }
}

/* Medium laptops 14-15 inch (1366px-1535px) - Scaled to 75% matching mobile exactly */
@media (min-width: 1366px) and (max-width: 1535px) {
  /* Header text - scaled to 75% from mobile md:text-3xl (1.875rem) */
  .agenda-header {
    font-size: 1.40625rem !important; /* 1.875rem * 0.75 - exact mobile ratio matching CommentSection */
    line-height: 1.25 !important; /* Match mobile leading-tight */
    padding-top: 0rem !important; /* Removed top padding to reduce space */
    padding-bottom: 0.375rem !important; /* 0.5rem * 0.75 (py-2) */
  }

  .tab-bar-scroll-wrapper {
    margin-bottom: 1.725rem !important;
  }

  .birthday-tab-button {
    padding: 0.647rem 1.294rem !important;
    border-radius: 1.294rem;
  }

  .tab-date {
    font-size: 0.809rem !important;
  }

  .agenda-item-wrapper {
    margin-bottom: 2.1563rem !important; /* 2.5rem * 0.8625 */
  }
}

/* Desktop (1536px+) - Clean desktop styles */
@media (min-width: 1536px) {
  .agenda-header {
    font-size: 1.875rem !important; /* 30px - text-3xl matching CommentSection */
  }
}

/* Scroll-based reveal animation support */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .agenda-item-wrapper {
      animation: smoothScrollReveal linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 30%;
    }
  }
}

@keyframes smoothScrollReveal {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.96);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .birthday-tab-button,
  .agenda-item-wrapper {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
  }

  .birthday-tab-button:hover {
    transform: none;
  }

  .agenda-item-content:hover h3 {
    transform: none;
    letter-spacing: normal;
  }
}
</style>
