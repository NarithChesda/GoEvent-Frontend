<template>
  <div
    v-if="agendaItems.length > 0"
    ref="containerRef"
    :key="`agenda-birthday-${currentLanguage}`"
    class="agenda-birthday mb-4 sm:mb-5 laptop-sm:mb-5 laptop-md:mb-6 laptop-lg:mb-7 desktop:mb-6"
    :class="{ 'animate-active': isVisible }"
  >
    <!-- Fun Header -->
    <div
      :class="[
        'text-center laptop-sm:mb-1 laptop-md:mb-2 laptop-lg:mb-3 desktop:mb-4 laptop-sm:-mt-2 laptop-md:-mt-2 laptop-lg:-mt-3',
        currentLanguage === 'kh' ? 'mb-2 sm:mb-3 md:mb-4' : 'mb-3 sm:mb-4 md:mb-5'
      ]"
    >
      <h2
        :class="[
          'leading-tight text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-regular capitalize agenda-header',
          currentLanguage === 'kh' && 'khmer-text-fix',
        ]"
        :style="{
          fontFamily: primaryFont || currentFont,
          color: primaryColor,
        }"
      >
        <span
          v-for="(word, index) in splitToWords(agendaHeaderText)"
          :key="`header-${currentLanguage}-${index}`"
          class="bounce-word"
          :style="{ animationDelay: `${animationDelays.header + index * WORD_DELAY}s` }"
        >{{ word }}{{ index < splitToWords(agendaHeaderText).length - 1 ? '\u00A0' : '' }}</span>
      </h2>
    </div>

    <!-- Colorful Tab Navigation -->
    <div class="birthday-tab-container" :style="{ '--primary-color': primaryColor, '--accent-color': accentColor }">
      <div
        class="tab-bar-scroll-wrapper bounce-in-element"
        :style="{ animationDelay: `${animationDelays.tabs}s` }"
      >
        <div class="tab-bar">
          <button
            v-for="date in agendaTabs"
            :key="date"
            class="birthday-tab-button"
            :class="{ active: activeTab === date }"
            :style="{
              backgroundColor: 'transparent',
              color: primaryColor,
              borderColor: activeTab === date ? primaryColor : 'transparent',
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
              <span
                v-for="(word, index) in splitToWords(getFirstAgendaDescription(date))"
                :key="`desc-${currentLanguage}-${index}`"
                class="bounce-word"
                :style="{ animationDelay: `${animationDelays.description + index * WORD_DELAY}s` }"
              >{{ word }}{{ index < splitToWords(getFirstAgendaDescription(date)).length - 1 ? '\u00A0' : '' }}</span>
            </h4>
          </div>

          <!-- Vertical List Layout -->
          <div class="list-container">
            <div
              v-for="(item, index) in agendaByDate[date] || []"
              :key="item.id"
              class="agenda-item-wrapper bounce-in-element"
              :style="{ animationDelay: `${getItemDelay(index)}s` }"
            >
              <div class="agenda-item-content">
                <!-- Title -->
                <h3
                  :class="[
                    'font-regular leading-tight text-center capitalize mb-2 agenda-item-title',
                    currentLanguage === 'kh' && 'khmer-text-fix',
                    currentLanguage === 'kh'
                      ? 'text-sm sm:text-sm md:text-base'
                      : 'text-sm sm:text-base md:text-lg'
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
                    'text-center text-sm agenda-item-time',
                    currentLanguage === 'kh' && 'khmer-text-fix',
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
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  translateRSVP,
  formatDateLocalized,
  type SupportedLanguage,
} from '../../../utils/translations'
import {
  splitToWords,
  ANIMATION_CONSTANTS,
  getTextAnimationDuration,
} from '@/composables/showcase/useHostInfoUtils'

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
  backgroundColor?: string
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

const WORD_DELAY = ANIMATION_CONSTANTS.WORD_DELAY
const ELEMENT_GAP = ANIMATION_CONSTANTS.ELEMENT_GAP

// Intersection Observer for scroll-triggered animations
const containerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

const setupObserver = () => {
  if (observer) {
    observer.disconnect()
  }

  // Use lower threshold for laptop views where the section may be taller
  // and harder to meet the 30% visibility requirement
  const isLaptopView = window.innerWidth >= 1024 && window.innerWidth < 1536
  const threshold = isLaptopView ? 0.1 : 0.3
  const rootMargin = isLaptopView ? '0px 0px -50px 0px' : '0px 0px -100px 0px'

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true
        }
      })
    },
    {
      threshold,
      rootMargin,
    }
  )

  if (containerRef.value) {
    observer.observe(containerRef.value)
  }
}

// Animation delays calculation
const animationDelays = computed(() => {
  let currentDelay = 0.1
  const BOUNCE_DURATION = 0.2

  const getNextDelay = (text: string | null | undefined, skipIfEmpty = true): number => {
    if (skipIfEmpty && !text) return currentDelay
    const startDelay = currentDelay
    const duration = getTextAnimationDuration(text)
    currentDelay = startDelay + duration + ELEMENT_GAP
    return startDelay
  }

  const addBounceDelay = (): number => {
    const startDelay = currentDelay
    currentDelay += BOUNCE_DURATION
    return startDelay
  }

  const header = getNextDelay(agendaHeaderText.value)
  const tabs = addBounceDelay()
  const description = currentDelay
  currentDelay += 0.15
  const items = currentDelay

  return {
    header,
    tabs,
    description,
    items,
  }
})

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
// Track if user has switched tabs (to use immediate animation on tab switch)
const hasTabSwitched = ref(false)

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
  hasTabSwitched.value = true
  activeTab.value = date
}

// Get animation delay for agenda items - immediate on tab switch, delayed on initial scroll
const getItemDelay = (index: number): number => {
  if (hasTabSwitched.value) {
    // Immediate cascade when switching tabs (starts from 0)
    return index * 0.1
  }
  // Use scroll-triggered delay on initial load
  return animationDelays.value.items + index * 0.1
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
  setupObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

// Re-setup observer and reset visibility when language changes
watch(
  () => props.currentLanguage,
  async () => {
    isVisible.value = false
    await nextTick()
    setTimeout(() => {
      setupObserver()
      if (containerRef.value) {
        const rect = containerRef.value.getBoundingClientRect()
        const windowHeight = window.innerHeight
        if (rect.top < windowHeight - 100 && rect.bottom > 0) {
          isVisible.value = true
        }
      }
    }, 100)
  }
)
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
  overflow-y: visible;
  scrollbar-width: none;
  -ms-overflow-style: none;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
  padding: 0.5rem 0;
}

.tab-bar-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

.tab-bar {
  display: flex;
  gap: 0.5rem;
  min-width: min-content;
  justify-content: center;
  flex-wrap: nowrap;
  padding: 0.25rem 0;
}

@media (min-width: 640px) {
  .tab-bar {
    gap: 0.75rem;
  }
}

/* Fun Birthday Tab Buttons */
.birthday-tab-button {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid;
  transition: all 0.3s ease;
  cursor: pointer;
  font-weight: 600;
}

@media (min-width: 640px) {
  .birthday-tab-button {
    padding: 0.75rem 1.75rem;
  }
}

.birthday-tab-button:hover {
  transform: translateY(-3px) scale(1.05);
}

.birthday-tab-button.active {
  transform: scale(1.05);
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

/* Word-by-word reveal animation - only active when in view */
.bounce-word {
  display: inline-block;
  opacity: 0;
}

.animate-active .bounce-word {
  animation: revealWord 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes revealWord {
  0% {
    opacity: 0;
    transform: scale(0.85) translateY(10px);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Bounce In Animation - only active when in view */
.bounce-in-element {
  opacity: 0;
}

.animate-active .bounce-in-element {
  animation: bounceInElement 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes bounceInElement {
  0% {
    opacity: 0;
    transform: translateY(15px);
  }
  30% {
    opacity: 1;
  }
  50% {
    transform: translateY(-3px);
  }
  75% {
    transform: translateY(1px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.agenda-item-wrapper {
  margin-bottom: 1rem;
}

@media (min-width: 640px) {
  .agenda-item-wrapper {
    margin-bottom: 1.5rem;
  }
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
  /* Header text - match AgendaWedding */
  .agenda-header {
    font-size: 1.25rem !important; /* 20px - match AgendaWedding header */
    line-height: 1.25 !important;
    padding-top: 0rem !important;
    padding-bottom: 0.3375rem !important;
  }

  /* Description text - match AgendaWedding */
  .tab-content-area h4 {
    font-size: 0.75rem !important; /* 12px - match AgendaWedding description */
  }

  /* Tab bar compact sizing - match AgendaWedding */
  .tab-bar {
    gap: 0.375rem !important;
  }

  .birthday-tab-button {
    padding: 0.4rem 0.875rem !important;
  }

  .tab-date {
    font-size: 0.5625rem !important; /* 9px - match AgendaWedding */
  }

  /* Item title - match AgendaWedding AgendaItem h3 */
  .agenda-item-title {
    font-size: 0.625rem !important; /* 10px - match AgendaWedding */
  }

  /* Item time - match AgendaWedding AgendaItem time */
  .agenda-item-time {
    font-size: 0.625rem !important; /* 10px - match AgendaWedding */
  }

  .agenda-item-wrapper {
    margin-bottom: 1.16rem !important; /* 1.5rem * 0.77625 */
  }
}

/* Medium laptops 14-15 inch (1366px-1535px) - Scaled to 75% matching mobile exactly */
@media (min-width: 1366px) and (max-width: 1535px) {
  /* Header text - match AgendaWedding */
  .agenda-header {
    font-size: 1.25rem !important; /* 20px - match AgendaWedding header */
    line-height: 1.25 !important;
    padding-top: 0rem !important;
    padding-bottom: 0.375rem !important;
  }

  /* Description text - match AgendaWedding */
  .tab-content-area h4 {
    font-size: 0.75rem !important; /* 12px - match AgendaWedding description */
  }

  /* Tab bar compact sizing - match AgendaWedding */
  .tab-bar {
    gap: 0.5rem !important;
  }

  .birthday-tab-button {
    padding: 0.5rem 1rem !important;
  }

  .tab-date {
    font-size: 0.625rem !important; /* 10px - match AgendaWedding */
  }

  /* Item title - match AgendaWedding AgendaItem h3 */
  .agenda-item-title {
    font-size: 0.625rem !important; /* 10px - match AgendaWedding */
  }

  /* Item time - match AgendaWedding AgendaItem time */
  .agenda-item-time {
    font-size: 0.6875rem !important; /* 11px - match AgendaWedding */
  }

  .agenda-item-wrapper {
    margin-bottom: 1.29rem !important; /* 1.5rem * 0.8625 */
  }
}

/* Desktop (1536px+) - Clean desktop styles */
@media (min-width: 1536px) {
  .agenda-header {
    font-size: 1.875rem !important; /* 30px - text-3xl matching CommentSection */
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .birthday-tab-button,
  .agenda-item-wrapper,
  .bounce-word,
  .bounce-in-element {
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
