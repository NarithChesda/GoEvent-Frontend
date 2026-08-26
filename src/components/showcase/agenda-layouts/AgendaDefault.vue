<template>
  <div
    v-if="agendaItems.length > 0"
    ref="containerRef"
    :key="`agenda-default-${currentLanguage}`"
    class="mb-4 sm:mb-5 laptop-sm:mb-5 laptop-md:mb-6 laptop-lg:mb-7 desktop:mb-6"
    :class="{ 'animate-active': isVisible }"
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
        <span
          v-for="(word, index) in splitToWords(agendaHeaderText)"
          :key="`header-${currentLanguage}-${index}`"
          class="bounce-word"
          :style="{ animationDelay: `${animationDelays.header + wordCascadeDelay(index)}s` }"
        >{{ word }}{{ index < splitToWords(agendaHeaderText).length - 1 ? '\u00A0' : '' }}</span>
      </h2>
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
              v-if="getTabWeekday(date)"
              class="tab-weekday"
              :style="{ fontFamily: secondaryFont || currentFont }"
            >
              {{ getTabWeekday(date) }}
            </span>
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
      <div class="tab-content-area" :class="{ 'content-hidden': !hasRevealed }">
        <div
          v-if="activeTab"
          :key="activeTab"
          class="tab-panel"
        >
          <!-- First agenda description at top center -->
          <div v-if="getFirstAgendaDescription(activeTab)" class="text-center mb-4 px-2">
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
                v-for="(word, index) in splitToWords(getFirstAgendaDescription(activeTab))"
                :key="`desc-${currentLanguage}-${index}`"
                class="bounce-word"
                :style="{ animationDelay: `${animationDelays.description + wordCascadeDelay(index)}s` }"
              >{{ word }}{{ index < splitToWords(getFirstAgendaDescription(activeTab)).length - 1 ? '\u00A0' : '' }}</span>
            </h4>
          </div>

          <!-- Agenda Items for this date -->
          <div class="space-y-0">
            <div
              v-for="(item, index) in agendaByDate[activeTab] || []"
              :key="`${item.id}-${hasRevealed}`"
            >
              <AgendaItem
                :item="item"
                :primary-color="primaryColor"
                :accent-color="accentColor"
                :current-font="currentFont"
                :primary-font="primaryFont"
                :secondary-font="secondaryFont"
                :entrance-delay="index * (isInitialReveal ? 0.15 : 0.07)"
                :is-first="index === 0"
                :is-last="index === (agendaByDate[activeTab] || []).length - 1"
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
import { showcaseRevealObserverInit } from '@/composables/showcase/useScrollProgress'
import AgendaItem from '../AgendaItem.vue'
import {
  translateRSVP,
  formatDateLocalized,
  type SupportedLanguage,
} from '../../../utils/translations'
import { splitToWords, ANIMATION_CONSTANTS, wordCascadeDelay } from '@/composables/showcase/useHostInfoUtils'

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

const ELEMENT_GAP = ANIMATION_CONSTANTS.ELEMENT_GAP
const WORD_ANIMATION_DURATION = 0.2
const BOUNCE_ANIMATION_DURATION = 0.5

// Intersection Observer for scroll-triggered animations
const containerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

const setupObserver = () => {
  if (observer) {
    observer.disconnect()
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true
        }
      })
    },
    showcaseRevealObserverInit(),
  )

  if (containerRef.value) {
    observer.observe(containerRef.value)
  }
}

// Animation delays calculation
const animationDelays = computed(() => {
  let currentDelay = 0.1

  const getNextDelay = (text: string | null | undefined, skipIfEmpty = true): number => {
    if (skipIfEmpty && !text) return currentDelay
    const startDelay = currentDelay
    const wordCount = splitToWords(text).length
    // Stagger to last word + that word's own animation duration
    const duration = wordCascadeDelay(Math.max(0, wordCount - 1)) + WORD_ANIMATION_DURATION
    currentDelay = startDelay + duration + ELEMENT_GAP
    return startDelay
  }

  const addBounceDelay = (): number => {
    const startDelay = currentDelay
    currentDelay += BOUNCE_ANIMATION_DURATION + ELEMENT_GAP
    return startDelay
  }

  const header = getNextDelay(agendaHeaderText.value)
  const tabs = addBounceDelay()
  const cards = currentDelay
  const description = currentDelay

  return {
    header,
    tabs,
    cards,
    description,
  }
})

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

// Keeps the active tab valid whenever the underlying dates change — e.g. an
// inline "change this day's date" edit moves every item in the currently-
// viewed group to a new date string. Without this, activeTab kept pointing
// at the OLD date, which no longer exists in agendaTabs/agendaByDate after
// the refetch, so the moved items simply vanished from view until the page
// was hard-refreshed (remounting re-ran what used to be a one-time onMounted
// pick). `immediate: true` also covers that original initial-pick job, so
// onMounted no longer needs to.
watch(
  agendaTabs,
  (tabs) => {
    if (activeTab.value !== null && tabs.includes(activeTab.value)) return
    activeTab.value = tabs[0] ?? null
  },
  { immediate: true },
)

// Translatable text computed properties
const agendaHeaderText = computed(() => getTextContent('agenda_header', 'Event Schedule'))

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

// Localized weekday eyebrow shown above the date inside each tab
const getTabWeekday = (dateString: string): string => {
  if (dateString === 'No Date') return ''
  try {
    const localeMap: Record<string, string> = { kh: 'km-KH', zh: 'zh-CN', fr: 'fr-FR' }
    const locale = localeMap[props.currentLanguage || ''] || 'en-US'
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date)
  } catch {
    return ''
  }
}

// Inline styles only carry the active state + fonts; resting/hover looks
// live in CSS so the tray pills can color-mix against --primary-color.
const getTabStyle = (date: string) => {
  const isActive = activeTab.value === date
  const base = { fontFamily: props.primaryFont || props.currentFont }
  if (!isActive) return base
  return {
    ...base,
    backgroundColor: props.primaryColor,
    color: '#ffffff',
    boxShadow: `0 10px 22px -10px ${props.primaryColor}b3, inset 0 1px 0 rgba(255, 255, 255, 0.25)`,
  }
}

// Gates tab content visibility so cards only appear after header + tabs have animated
const hasRevealed = ref(false)
const isInitialReveal = ref(false)
let revealTimer: number | null = null

watch(isVisible, (newVal) => {
  if (newVal && !hasRevealed.value) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      hasRevealed.value = true
      return
    }
    revealTimer = window.setTimeout(() => {
      isInitialReveal.value = true
      hasRevealed.value = true
      revealTimer = null
      setTimeout(() => { isInitialReveal.value = false }, 3000)
    }, animationDelays.value.cards * 1000)
  }
})

onMounted(() => {
  // Initial tab selection is handled by the immediate agendaTabs watcher above.
  setupObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (revealTimer !== null) {
    clearTimeout(revealTimer)
    revealTimer = null
  }
})

// Re-setup observer and reset visibility when language changes
watch(
  () => props.currentLanguage,
  async () => {
    isVisible.value = false
    hasRevealed.value = false
    isInitialReveal.value = false
    if (revealTimer !== null) {
      clearTimeout(revealTimer)
      revealTimer = null
    }
    // Wait for DOM to update with new key, then re-observe
    await nextTick()
    // Additional delay to ensure the new element is fully rendered
    setTimeout(() => {
      setupObserver()
      // If element is already in view, trigger animation immediately
      if (containerRef.value) {
        const rect = containerRef.value.getBoundingClientRect()
        const windowHeight = window.innerHeight
        // Check if element is already visible in viewport
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
  /* Breathing room so the active pill's shadow isn't clipped */
  padding: 0.25rem 0.125rem;
}

.tab-bar-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

/* Glass tray holding the date pills; auto margins keep it centered while
   still allowing full scroll reach when it overflows on small screens */
.tab-bar {
  display: flex;
  gap: 0.25rem;
  margin-inline: auto;
  min-width: min-content;
  padding: 0.3125rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--primary-color) 6%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color) 14%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* Collapse the tray chrome when there is only a single date */
.tab-bar:has(.tab-button:only-child) {
  padding: 0;
  background: transparent;
  box-shadow: none;
}

/* Tab pills: weekday eyebrow over the date - Matching AgendaWedding */
.tab-button {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  padding: 0.5rem 1.5rem;
  border-radius: 9999px;
  border: none;
  outline: none;
  background-color: transparent;
  color: var(--primary-color);
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    box-shadow 0.3s ease;
  cursor: pointer;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .tab-button {
    padding: 0.625rem 1.875rem;
  }
}

.tab-button:not(.active):hover {
  background-color: color-mix(in srgb, var(--primary-color) 9%, transparent);
}

.tab-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.tab-weekday {
  display: block;
  font-size: 0.5625rem;
  line-height: 1.1;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  opacity: 0.75;
}

.tab-date {
  font-size: 0.875rem;
  line-height: 1.2;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .tab-weekday {
    font-size: 0.625rem;
  }

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
  transition: opacity 0.4s ease;
}

.tab-content-area.content-hidden {
  opacity: 0;
  pointer-events: none;
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
  animation: revealWord 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes revealWord {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
  .tab-bar {
    gap: 0.1875rem !important;
    padding: 0.25rem !important;
  }

  .tab-button {
    padding: 0.3125rem 0.875rem !important;
  }

  .tab-weekday {
    font-size: 0.4375rem !important; /* 7px eyebrow */
  }

  .tab-date {
    font-size: 0.5625rem !important; /* 9px - match AgendaWedding tab text */
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

  /* Tab bar compact sizing - match AgendaWedding */
  .tab-bar {
    gap: 0.25rem !important;
    padding: 0.25rem !important;
  }

  .tab-button {
    padding: 0.375rem 1rem !important;
  }

  .tab-weekday {
    font-size: 0.5rem !important; /* 8px eyebrow */
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

  .tab-content-area.content-hidden {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
