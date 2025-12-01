<template>
  <div
    v-if="agendaItems.length > 0"
    ref="containerRef"
    :key="`agenda-wedding-${currentLanguage}`"
    class="agenda-wedding mb-4 sm:mb-5 laptop-sm:mb-5 laptop-md:mb-6 laptop-lg:mb-7 desktop:mb-6"
    :class="{ 'animate-active': isVisible }"
  >
    <!-- Header -->
    <div class="text-center mb-4 sm:mb-5 laptop-sm:mb-3 laptop-md:mb-4 laptop-lg:mb-6 desktop:mb-5">
      <h2
        :class="[
          'leading-tight text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-regular mb-3 sm:mb-4 md:mb-6 laptop-sm:mb-2 laptop-md:mb-2 desktop:mb-2 capitalize',
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
      <p
        :class="[
          'text-sm sm:text-base md:text-lg opacity-80',
          currentLanguage === 'kh' && 'khmer-text-fix',
        ]"
        :style="{
          color: accentColor,
          fontFamily: secondaryFont || currentFont,
        }"
      >
        <span
          v-for="(word, index) in splitToWords(agendaDescriptionText)"
          :key="`subdesc-${currentLanguage}-${index}`"
          class="bounce-word"
          :style="{ animationDelay: `${animationDelays.subDescription + index * WORD_DELAY}s` }"
        >{{ word }}{{ index < splitToWords(agendaDescriptionText).length - 1 ? '\u00A0' : '' }}</span>
      </p>
    </div>

    <!-- Unified Tab Container -->
    <div class="unified-tab-container" :style="{ '--primary-color': primaryColor }">
      <!-- Tab Bar Navigation -->
      <div
        class="tab-bar-scroll-wrapper bounce-in-element"
        :style="{ animationDelay: `${animationDelays.tabs}s` }"
      >
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
                'font-semibold text-sm sm:text-base',
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

          <!-- Agenda Items for this date -->
          <div class="space-y-0">
            <div
              v-for="(item, index) in agendaByDate[date] || []"
              :key="item.id"
              class="agenda-item-animate bounce-in-element"
              :style="{ animationDelay: `${getItemDelay(index)}s` }"
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
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import AgendaItem from '../AgendaItem.vue'
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
  const subDescription = getNextDelay(agendaDescriptionText.value)
  const tabs = addBounceDelay()
  const description = currentDelay
  currentDelay += 0.15
  const items = currentDelay

  return {
    header,
    subDescription,
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
    agenda_header_wedding: 'agenda_header_wedding',
    agenda_description_wedding: 'agenda_description_wedding',
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

const agendaHeaderText = computed(() => getTextContent('agenda_header_wedding', 'Wedding Schedule'))

const agendaDescriptionText = computed(() =>
  getTextContent('agenda_description_wedding', 'A timeline of our celebration'),
)

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

// Style helper for tabs matching DressCodeSection time period tabs
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

/* Tab Buttons - Matching DressCodeSection time period tabs */
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

/* Agenda Item Scroll Animation - kept for tab switching */
.agenda-item-animate {
  /* Animation handled by bounce-in-element */
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

/* Enhanced Khmer font rendering */
.khmer-text-fix {
  line-height: 1.8 !important;
  padding-top: 0.3em !important;
  padding-bottom: 0.3em !important;
  margin-top: 0.2em;
  margin-bottom: 0.2em;
}

/* Small laptops 13-inch (1024px-1365px) - Match DressCodeSection exactly */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Header text - match DressCodeSection header */
  h2 {
    font-size: 1.25rem !important; /* 20px - match DressCodeSection header */
    line-height: 1.25 !important; /* Match mobile leading-tight */
    padding-top: 0rem !important; /* Removed top padding to reduce space */
    padding-bottom: 0.3375rem !important; /* 0.5rem * 0.675 (py-2) */
  }

  /* Description text - match DressCodeSection description */
  p {
    font-size: 0.75rem !important; /* 12px - match DressCodeSection description */
  }

  /* Tab bar compact sizing */
  .tab-button {
    padding: 0.625rem 1.25rem !important;
  }

  .tab-date {
    font-size: 0.625rem !important; /* 10px - match DressCodeSection tab text */
  }
}

/* Medium laptops 14-15 inch (1366px-1535px) - Match DressCodeSection exactly */
@media (min-width: 1366px) and (max-width: 1535px) {
  /* Header text - match DressCodeSection header */
  h2 {
    font-size: 1.25rem !important; /* 20px - match DressCodeSection header */
    line-height: 1.25 !important; /* Match mobile leading-tight */
    padding-top: 0rem !important; /* Removed top padding to reduce space */
    padding-bottom: 0.375rem !important; /* 0.5rem * 0.75 (py-2) */
  }

  /* Description text - match DressCodeSection description */
  p {
    font-size: 0.75rem !important; /* 12px - match DressCodeSection description */
  }

  /* Tab bar larger gap like DressCodeSection */
  .tab-button {
    padding: 0.75rem 1.75rem !important; /* 640px+ sizing */
  }

  .tab-date {
    font-size: 0.625rem !important; /* 10px - match DressCodeSection tab text */
  }
}

/* Desktop (1536px+) - Clean desktop styles */
@media (min-width: 1536px) {
  h2 {
    font-size: 1.875rem !important; /* 30px - text-3xl matching CommentSection */
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .tab-button,
  .agenda-item-animate,
  .bounce-word,
  .bounce-in-element {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .tab-button:hover {
    transform: none;
  }
}
</style>
