<template>
  <div
    v-if="agendaItems.length > 0 || editIntentCtx"
    ref="containerRef"
    :key="`agenda-${currentLanguage}`"
    class="agenda-section mb-4 sm:mb-5 laptop-sm:mb-5 laptop-md:mb-6 laptop-lg:mb-7 desktop:mb-6"
    :class="{ 'animate-active': isVisible }"
  >
    <!-- Header -->
    <div class="text-center mb-4 sm:mb-5 laptop-sm:mb-3 laptop-md:mb-4 laptop-lg:mb-6 desktop:mb-5">
      <h2
        :class="[
          'leading-tight text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-regular mb-3 sm:mb-4 md:mb-6 laptop-sm:mb-2 laptop-md:mb-2 desktop:mb-2 capitalize agenda-header',
          currentLanguage === 'kh' && 'khmer-text-fix',
        ]"
        :style="{ fontFamily: primaryFont || currentFont, color: primaryColor }"
      >
        <span
          v-for="(word, index) in headerWords"
          :key="`header-${currentLanguage}-${index}`"
          class="bounce-word"
          :style="{ animationDelay: `${animationDelays.header + wordCascadeDelay(index)}s` }"
          >{{ word }}{{ index < headerWords.length - 1 ? ' ' : '' }}</span
        >
      </h2>

      <!-- Sub-headline, where the event's category has one. Copy, not design:
           it is the wedding schedule's own line and has always been part of
           what a wedding shows. -->
      <p
        v-if="subHeaderWords.length"
        :class="['text-sm sm:text-base md:text-lg opacity-80', currentLanguage === 'kh' && 'khmer-text-fix']"
        :style="{ color: primaryColor, fontFamily: secondaryFont || currentFont }"
      >
        <span
          v-for="(word, index) in subHeaderWords"
          :key="`subdesc-${currentLanguage}-${index}`"
          class="bounce-word"
          :style="{ animationDelay: `${animationDelays.subDescription + wordCascadeDelay(index)}s` }"
          >{{ word }}{{ index < subHeaderWords.length - 1 ? ' ' : '' }}</span
        >
      </p>
    </div>

    <div class="agenda-body" :style="{ '--primary-color': primaryColor }">
      <!-- Day tabs. data-preview-safe keeps them clickable inside the
           manage-page preview's edit mode (the same escape hatch
           DressCodeSection's tabs use), so items on every day stay reachable
           for editing. -->
      <div
        v-if="agendaTabs.length > 0"
        class="tab-bar-scroll-wrapper bounce-in-element"
        :style="{ animationDelay: `${animationDelays.tabs}s` }"
      >
        <div class="tab-bar" data-preview-safe>
          <button
            v-for="date in agendaTabs"
            :key="date"
            class="tab-button"
            :class="{ active: activeTab === date }"
            :style="getTabStyle(date)"
            @click="activeTab = date"
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

      <!-- Change the active day's date for all its items — only inside the
           editable manage-page preview (editIntentCtx is never provided on the
           public showcase). Opens EditDateGroupModal parent-side. -->
      <div v-if="editIntentCtx && activeTab" class="edit-date-chip-row">
        <button
          type="button"
          class="edit-region-control edit-date-chip"
          @click.stop.prevent="requestDateChange"
        >
          ✎ {{ tApp('management.showcasePreview.editors.changeAgendaDate') }}
        </button>
      </div>

      <div class="tab-content-area" :class="{ 'content-hidden': !hasRevealed }">
        <div v-if="activeTab" :key="activeTab" class="tab-panel">
          <!-- The first activity's description, used as the day's own line -->
          <div v-if="firstDescriptionWords.length" class="text-center mb-4 px-2">
            <h4
              :class="['font-semibold text-sm sm:text-base', currentLanguage === 'kh' && 'khmer-text-fix']"
              :style="{ color: primaryColor, fontFamily: primaryFont || currentFont }"
            >
              <span
                v-for="(word, index) in firstDescriptionWords"
                :key="`desc-${currentLanguage}-${index}`"
                class="bounce-word"
                :style="{ animationDelay: `${animationDelays.description + wordCascadeDelay(index)}s` }"
                >{{ word }}{{ index < firstDescriptionWords.length - 1 ? ' ' : '' }}</span
              >
            </h4>
          </div>

          <!-- The template's chosen composition. `agd--editing` is published
               on its root because the reorder arrows take a gutter off every
               item's trailing edge, and a design whose connector spans the
               full list (thread, milestone) has to be told to leave the same
               gutter or the line stops meeting its roundels.
               Keyed on hasRevealed so the
               design remounts when the gate opens and its own entrance
               animations run from the top rather than having played behind an
               opacity: 0 panel. -->
          <component
            :is="designComponent"
            :key="`${designType}-${hasRevealed}`"
            class="agd"
            :class="{ 'agd--editing': !!editIntentCtx }"
            :style="contractStyle"
            :items="activeItems"
            :primary-color="primaryColor"
            :accent-color="accentColor"
            :current-font="currentFont"
            :primary-font="primaryFont"
            :secondary-font="secondaryFont"
            :current-language="currentLanguage"
            :is-initial-reveal="isInitialReveal"
          />
        </div>
      </div>
    </div>

    <!-- Add-activity affordance — only inside the editable manage-page preview.
         Outside the design so every composition gets it, including when the
         event has no agenda items at all and the design renders nothing. -->
    <div v-if="editIntentCtx" class="add-agenda-row">
      <button
        type="button"
        class="edit-region-control add-agenda-btn"
        @click.stop.prevent="editIntentCtx.requestEdit({ kind: 'agendaAdd' })"
      >
        ＋ {{ tApp('management.showcasePreview.editors.addAgendaItem') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { showcaseRevealObserverInit } from '@/composables/showcase/useScrollProgress'
import {
  splitToWords,
  ANIMATION_CONSTANTS,
  wordCascadeDelay,
} from '@/composables/showcase/useHostInfoUtils'
import {
  translateRSVP,
  formatDateLocalized,
  type SupportedLanguage,
} from '../../utils/translations'
import type { AgendaDesignConfig, AgendaDesignType } from '@/services/api/types/template.types'
import type { AgendaDesignItem } from './agenda-designs/types'

import AgendaRail from './agenda-designs/AgendaRail.vue'
import AgendaThread from './agenda-designs/AgendaThread.vue'
import AgendaMilestone from './agenda-designs/AgendaMilestone.vue'
import AgendaLedger from './agenda-designs/AgendaLedger.vue'
import AgendaStack from './agenda-designs/AgendaStack.vue'

/**
 * The agenda section: the header, the day tabs, the reveal clock and the edit
 * affordances — everything *around* the list of activities. Which composition
 * the list itself is drawn in is the template's call
 * (`template_assets.agenda_design`), exactly as `host_info_design` picks a host
 * layout.
 *
 * **This replaces a category dispatch.** The section used to pick one of four
 * layout components from the event's category — wedding / birthday / funeral /
 * default — which were four copies of the same file differing in a container
 * class name, a header translation key and comment drift. A template could not
 * choose how its own schedule looked, and a partner selling a wedding design
 * and a birthday design shipped an identical agenda in both.
 *
 * The line the split is drawn on: **the category decides the words, the
 * template decides the look.** `agenda_header_wedding` and
 * `agenda_description_wedding` stay resolved here from `eventType`, because
 * they are the event's copy and every live wedding is already reading them; a
 * design receives one day's items and nothing that could tell it what kind of
 * event it is drawing.
 *
 * Three things that used to exist only on the wedding layout now apply to every
 * event, which is a fix rather than a change of intent: the `data-preview-safe`
 * day tabs, the change-this-day's-date chip, and the sub-headline slot (which
 * still renders nothing where the category has no copy for it).
 */
interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  agendaItems: AgendaDesignItem[]
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  /** Event category name. Resolves the header copy only — never the design. */
  eventType?: string
  /** The template's chosen composition. Absent / unknown falls back to `rail`. */
  agendaDesign?: AgendaDesignConfig | null
}

const props = defineProps<Props>()

// Only provided by the editable manage-page preview frame — undefined on the
// public showcase, so the edit affordances can never leak into production.
const editIntentCtx = inject(EditIntentKey, undefined)
const { t: tApp } = useAppLanguage()

// ---------------------------------------------------------------------------
// Design selection
// ---------------------------------------------------------------------------

const DESIGNS = {
  rail: AgendaRail,
  thread: AgendaThread,
  milestone: AgendaMilestone,
  ledger: AgendaLedger,
  stack: AgendaStack,
} as const

/**
 * `rail` for anything absent or unrecognised — it is the composition every
 * agenda rendered before this field existed, so a template that has never set
 * it, and one that names a design this build doesn't ship, both render what
 * their guests already see rather than nothing.
 */
const designType = computed<AgendaDesignType>(() => {
  const type = props.agendaDesign?.type
  return type && type in DESIGNS ? type : 'rail'
})

const designComponent = computed(() => DESIGNS[designType.value])

/** The CSS contract documented at the top of agenda-base.css. */
const contractStyle = computed(() => ({
  '--agd-ink': props.primaryColor,
  '--agd-accent': props.accentColor,
}))

// ---------------------------------------------------------------------------
// Copy — resolved from the event's own texts, then the category, then English
// ---------------------------------------------------------------------------

type RsvpKey = keyof typeof import('../../utils/translations').rsvpTranslations.en

const getTextContent = (textType: string, fallback = ''): string => {
  // The event's own translated text always wins over any built-in copy.
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(
      (entry) => entry.text_type === textType && entry.language === props.currentLanguage,
    )
    if (text?.content) return text.content
  }

  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  const keyMap: Record<string, RsvpKey> = {
    agenda_header: 'agenda_header',
    agenda_header_wedding: 'agenda_header_wedding',
    agenda_header_birthday: 'agenda_header_birthday',
    agenda_header_funeral: 'agenda_header_funeral',
    agenda_description_wedding: 'agenda_description_wedding',
  }

  const translationKey = keyMap[textType]
  return translationKey ? translateRSVP(translationKey, currentLang) : fallback
}

/**
 * Category → header copy. This is the ONE thing the event's category still
 * decides here, and it decides only words: a funeral's schedule is a Ceremony
 * Schedule whatever composition the template draws it in.
 */
const CATEGORY_COPY: Record<string, { header: string; sub?: string }> = {
  wedding: { header: 'agenda_header_wedding', sub: 'agenda_description_wedding' },
  birthday: { header: 'agenda_header_birthday' },
  'birthday party': { header: 'agenda_header_birthday' },
  funeral: { header: 'agenda_header_funeral' },
  'funeral service': { header: 'agenda_header_funeral' },
}

const categoryCopy = computed(
  () => CATEGORY_COPY[props.eventType?.toLowerCase() || ''] ?? { header: 'agenda_header' },
)

const headerWords = computed(() =>
  splitToWords(getTextContent(categoryCopy.value.header, 'Event Schedule')),
)

const subHeaderWords = computed(() =>
  categoryCopy.value.sub ? splitToWords(getTextContent(categoryCopy.value.sub)) : [],
)

// ---------------------------------------------------------------------------
// Days
// ---------------------------------------------------------------------------

const agendaByDate = computed(() => {
  const grouped: Record<string, AgendaDesignItem[]> = {}
  props.agendaItems.forEach((item) => {
    const date = item.date || 'No Date'
    ;(grouped[date] ||= []).push(item)
  })
  Object.keys(grouped).forEach((date) => {
    grouped[date].sort((a, b) => (a.order || 0) - (b.order || 0))
  })
  return grouped
})

const agendaTabs = computed(() =>
  Object.keys(agendaByDate.value).sort((a, b) => {
    if (a === 'No Date') return 1
    if (b === 'No Date') return -1
    return new Date(a).getTime() - new Date(b).getTime()
  }),
)

const activeTab = ref<string | null>(null)

// Keeps the active tab valid whenever the underlying dates change — e.g. the
// inline "change this day's date" edit moves every item in the currently-viewed
// group to a new date string. Without this, activeTab kept pointing at the OLD
// date, which no longer exists in agendaTabs/agendaByDate after the refetch, so
// the moved items simply vanished from view until the page was hard-refreshed.
// `immediate: true` also covers the initial pick, so onMounted needn't.
watch(
  agendaTabs,
  (tabs) => {
    if (activeTab.value !== null && tabs.includes(activeTab.value)) return
    activeTab.value = tabs[0] ?? null
  },
  { immediate: true },
)

const activeItems = computed(() =>
  activeTab.value ? agendaByDate.value[activeTab.value] || [] : [],
)

/**
 * The first activity's description doubles as the day's own line. Capitalised
 * because it is being promoted from a field to a headline.
 */
const firstDescriptionWords = computed(() => {
  const description = activeItems.value[0]?.description
  if (!description) return []
  return splitToWords(description.charAt(0).toUpperCase() + description.slice(1))
})

const formatAgendaDate = (dateString: string): string => {
  if (dateString === 'No Date') return 'TBD'
  try {
    return formatDateLocalized(
      dateString,
      'compact',
      (props.currentLanguage as SupportedLanguage) || 'en',
    )
  } catch {
    return dateString
  }
}

/** Localized weekday eyebrow shown above the date inside each tab */
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

// Inline styles only carry the active state + fonts; resting/hover looks live
// in CSS so the tray pills can color-mix against --primary-color.
const getTabStyle = (date: string) => {
  const base = { fontFamily: props.primaryFont || props.currentFont }
  if (activeTab.value !== date) return base
  return {
    ...base,
    backgroundColor: props.primaryColor,
    color: '#ffffff',
    boxShadow: `0 10px 22px -10px ${props.primaryColor}b3, inset 0 1px 0 rgba(255, 255, 255, 0.25)`,
  }
}

const requestDateChange = () => {
  if (!activeTab.value) return
  editIntentCtx?.requestEdit({
    kind: 'agendaDate',
    date: activeTab.value === 'No Date' ? null : activeTab.value,
    itemCount: activeItems.value.length,
  })
}

// ---------------------------------------------------------------------------
// Reveal clock
// ---------------------------------------------------------------------------

const ELEMENT_GAP = ANIMATION_CONSTANTS.ELEMENT_GAP
const WORD_ANIMATION_DURATION = 0.2
const BOUNCE_ANIMATION_DURATION = 0.5

const containerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

const setupObserver = () => {
  observer?.disconnect()
  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) isVisible.value = true
    })
  }, showcaseRevealObserverInit())
  if (containerRef.value) observer.observe(containerRef.value)
}

const animationDelays = computed(() => {
  let currentDelay = 0.1

  const afterWords = (words: string[]): number => {
    if (!words.length) return currentDelay
    const startDelay = currentDelay
    const duration = wordCascadeDelay(Math.max(0, words.length - 1)) + WORD_ANIMATION_DURATION
    currentDelay = startDelay + duration + ELEMENT_GAP
    return startDelay
  }

  const header = afterWords(headerWords.value)
  const subDescription = afterWords(subHeaderWords.value)
  const tabs = currentDelay
  currentDelay += BOUNCE_ANIMATION_DURATION + ELEMENT_GAP

  return { header, subDescription, tabs, cards: currentDelay, description: currentDelay }
})

// Gates the list so items only appear after the header and tabs have animated.
const hasRevealed = ref(false)
const isInitialReveal = ref(false)
let revealTimer: number | null = null

watch(isVisible, (visible) => {
  if (!visible || hasRevealed.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    hasRevealed.value = true
    return
  }
  revealTimer = window.setTimeout(() => {
    isInitialReveal.value = true
    hasRevealed.value = true
    revealTimer = null
    // The wider stagger belongs to the first reveal only; a later tab switch
    // happens with the chrome already on screen and should feel immediate.
    setTimeout(() => {
      isInitialReveal.value = false
    }, 3000)
  }, animationDelays.value.cards * 1000)
})

const clearRevealTimer = () => {
  if (revealTimer !== null) {
    clearTimeout(revealTimer)
    revealTimer = null
  }
}

onMounted(setupObserver)

onUnmounted(() => {
  observer?.disconnect()
  observer = null
  clearRevealTimer()
})

// Re-observe and replay when the language changes — the root's :key remounts
// the subtree, so the old observed element is gone.
watch(
  () => props.currentLanguage,
  async () => {
    isVisible.value = false
    hasRevealed.value = false
    isInitialReveal.value = false
    clearRevealTimer()
    await nextTick()
    setTimeout(() => {
      setupObserver()
      // Already on screen after the swap: nothing will scroll to trigger the
      // observer, so arm the reveal directly.
      const rect = containerRef.value?.getBoundingClientRect()
      if (rect && rect.top < window.innerHeight - 100 && rect.bottom > 0) {
        isVisible.value = true
      }
    }, 100)
  },
)
</script>

<!-- Unscoped, once: Vue mangles @keyframes names per component, so a scoped
     copy inside each design would give five differently-named animations and
     none would resolve — and the icon rules have to reach v-html content, which
     carries no scope attribute. Every selector is under .agd. -->
<style src="./agenda-designs/agenda-base.css"></style>

<style scoped>
.agenda-body {
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

/* Glass tray holding the date pills; auto margins keep it centered while still
   allowing full scroll reach when it overflows on small screens */
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

/* Tab pills: weekday eyebrow over the date */
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
    box-shadow 0.3s ease,
    transform 0.16s cubic-bezier(0.23, 1, 0.32, 1);
  cursor: pointer;
  white-space: nowrap;
}

/* The day tabs are the one control a guest presses in this section — they have
   to answer the press before the panel below has time to change. */
.tab-button:active {
  transform: scale(0.97);
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

.tab-content-area {
  position: relative;
  transition: opacity 0.4s ease;
}

.tab-content-area.content-hidden {
  opacity: 0;
  pointer-events: none;
}

.tab-panel {
  animation: fadeIn 0.3s ease-out;
}

/* Word-by-word reveal - only active when in view */
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

/* Manage-page preview edit chrome only — production renders none of this */
.edit-date-chip-row {
  display: flex;
  justify-content: center;
  margin: -0.75rem 0 1rem;
}

.edit-date-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
  padding: 0.25rem 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  color: #1e90ff;
  background: rgba(255, 255, 255, 0.92);
  border: 1.5px dashed rgba(30, 144, 255, 0.5);
  border-radius: 9999px;
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.18);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.edit-date-chip:hover {
  border-color: rgba(30, 144, 255, 0.9);
  background: rgba(30, 144, 255, 0.08);
}

.add-agenda-row {
  display: flex;
  justify-content: center;
  margin: 0.75rem 0 1rem;
}

.add-agenda-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25em;
  width: 100%;
  max-width: 20rem;
  padding: 0.625rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  color: #1e90ff;
  background: rgba(255, 255, 255, 0.85);
  border: 1.5px dashed rgba(30, 144, 255, 0.5);
  border-radius: 9999px;
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.12);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.add-agenda-btn:hover {
  border-color: rgba(30, 144, 255, 0.9);
  background: rgba(30, 144, 255, 0.08);
}

/* Small laptops 13-inch (1024px-1365px) */
@media (min-width: 1024px) and (max-width: 1365px) {
  .agenda-header {
    font-size: 1.25rem !important;
    line-height: 1.25 !important;
    padding-top: 0 !important;
    padding-bottom: 0.3375rem !important;
  }

  .tab-content-area h4 {
    font-size: 0.75rem !important;
  }

  .tab-bar {
    gap: 0.1875rem !important;
    padding: 0.25rem !important;
  }

  .tab-button {
    padding: 0.3125rem 0.875rem !important;
  }

  .tab-weekday {
    font-size: 0.4375rem !important;
  }

  .tab-date {
    font-size: 0.5625rem !important;
  }
}

/* Medium laptops 14-15 inch (1366px-1535px) */
@media (min-width: 1366px) and (max-width: 1535px) {
  .agenda-header {
    font-size: 1.25rem !important;
    line-height: 1.25 !important;
    padding-top: 0 !important;
    padding-bottom: 0.375rem !important;
  }

  .tab-content-area h4 {
    font-size: 0.8125rem !important;
  }

  .tab-bar {
    gap: 0.25rem !important;
    padding: 0.25rem !important;
  }

  .tab-button {
    padding: 0.375rem 1rem !important;
  }

  .tab-weekday {
    font-size: 0.5rem !important;
  }

  .tab-date {
    font-size: 0.625rem !important;
  }
}

/* Desktop (1536px+) */
@media (min-width: 1536px) {
  .agenda-header {
    font-size: 1.875rem !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab-button,
  .bounce-word,
  .bounce-in-element,
  .tab-panel {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .tab-button:active {
    transform: none;
  }

  .tab-content-area.content-hidden {
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
