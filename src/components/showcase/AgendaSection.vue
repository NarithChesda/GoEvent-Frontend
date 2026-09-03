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
          // Size and leading come from `.agenda-header` below, on the one
          // `--agd-s` scale — not from a Tailwind step ladder that the laptop
          // tiers then had to override.
          'font-regular mb-3 sm:mb-4 md:mb-6 laptop-sm:mb-2 laptop-md:mb-2 desktop:mb-2 capitalize agenda-header',
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
        :class="[
          'text-sm sm:text-base md:text-lg opacity-80',
          currentLanguage === 'kh' && 'khmer-text-fix',
        ]"
        :style="{ color: primaryColor, fontFamily: secondaryFont || currentFont }"
      >
        <span
          v-for="(word, index) in subHeaderWords"
          :key="`subdesc-${currentLanguage}-${index}`"
          class="bounce-word"
          :style="{
            animationDelay: `${animationDelays.subDescription + wordCascadeDelay(index)}s`,
          }"
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
        ref="tabScrollRef"
        class="tab-bar-scroll-wrapper bounce-in-element"
        :style="{ animationDelay: `${animationDelays.tabs}s` }"
      >
        <div
          ref="tabBarRef"
          class="tab-bar"
          :class="{ 'has-glide': glide.armed, 'is-gliding': glideMoves }"
          data-preview-safe
          role="tablist"
          :aria-label="headerText"
        >
          <!-- One pill that travels, not a background that cross-fades on each
               button. A day is a position in a row, and moving the selection
               *along* the row is what says which way you went — two pills
               swapping opacity says only that something changed. Absolutely
               positioned and measured off the active button, so it is a single
               `transform` regardless of how many days there are. -->
          <span class="tab-glide" :style="glideStyle" aria-hidden="true"></span>
          <button
            v-for="(date, index) in agendaTabs"
            :id="tabId(date)"
            :key="date"
            :ref="(el) => setTabRef(el, index)"
            class="tab-button"
            :class="{ active: activeTab === date }"
            :style="{ fontFamily: primaryFont || currentFont }"
            role="tab"
            :aria-selected="activeTab === date"
            :aria-controls="panelId"
            :tabindex="activeTab === date ? 0 : -1"
            @click="activeTab = date"
            @keydown="onTabKeydown($event, index)"
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
        <div
          v-if="activeTab"
          :id="panelId"
          :key="activeTab"
          class="tab-panel"
          role="tabpanel"
          :aria-labelledby="tabId(activeTab)"
        >
          <!-- The first activity's description, used as the day's own line -->
          <div v-if="firstDescriptionWords.length" class="text-center mb-4 px-2">
            <h4
              :class="[
                'font-semibold text-sm sm:text-base',
                currentLanguage === 'kh' && 'khmer-text-fix',
              ]"
              :style="{ color: primaryColor, fontFamily: primaryFont || currentFont }"
            >
              <span
                v-for="(word, index) in firstDescriptionWords"
                :key="`desc-${currentLanguage}-${index}`"
                class="bounce-word"
                :style="{
                  animationDelay: `${animationDelays.description + wordCascadeDelay(index)}s`,
                }"
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
import { computed, inject, nextTick, onMounted, onUnmounted, ref, useId, watch } from 'vue'
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

const headerText = computed(() => getTextContent(categoryCopy.value.header, 'Event Schedule'))

const headerWords = computed(() => splitToWords(headerText.value))

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

// ---------------------------------------------------------------------------
// The travelling pill
//
// The selection used to be a background on whichever button was active, so
// changing day cross-faded one filled pill out and another in — the two ends of
// the move, with nothing between them. One pill that slides says which
// direction the selection went, which is the whole point of laying the days out
// in a row.
//
// It is measured, never computed from an index: the buttons are content-sized
// (a weekday eyebrow over a localized date, in the template's own face), so
// their widths differ per day, per language and per font — and the face is
// loaded asynchronously, which is why `document.fonts.ready` re-measures.
//
// `armed` gates two things: the transition (so the pill does not slide in from
// the origin on first paint) and the CSS fallback (`.tab-bar:not(.has-glide)`
// keeps the old per-button fill, so a measurement that never lands still leaves
// the active day legible rather than white-on-transparent).
// ---------------------------------------------------------------------------

// Unique per instance: the manage-page preview can mount this component beside
// the live one, and two tablists sharing an id would cross-wire aria-controls.
const uid = useId()
const panelId = `agenda-panel-${uid}`
const tabId = (date: string) => `agenda-tab-${uid}-${date.replace(/[^a-zA-Z0-9]/g, '')}`

const tabScrollRef = ref<HTMLElement | null>(null)
const tabBarRef = ref<HTMLElement | null>(null)
// Indexed by position through a function ref rather than collected with
// `ref="…"` on the v-for: Vue does not guarantee that a template-ref array
// matches the source order, and the pill is looked up by index.
const tabButtonRefs = ref<(HTMLElement | null)[]>([])
const setTabRef = (el: unknown, index: number) => {
  tabButtonRefs.value[index] = (el as HTMLElement | null) ?? null
}

const glide = ref({ x: 0, w: 0, h: 0, armed: false })
const glideMoves = ref(false)

const glideStyle = computed(() => ({
  width: `${glide.value.w}px`,
  height: `${glide.value.h}px`,
  transform: `translate3d(${glide.value.x}px, 0, 0)`,
  backgroundColor: props.primaryColor,
  boxShadow: `0 10px 22px -10px ${props.primaryColor}b3, inset 0 1px 0 rgba(255, 255, 255, 0.25)`,
  opacity: glide.value.armed ? 1 : 0,
}))

const activeTabIndex = computed(() =>
  activeTab.value ? agendaTabs.value.indexOf(activeTab.value) : -1,
)

const measureGlide = () => {
  tabButtonRefs.value.length = agendaTabs.value.length
  const btn = tabButtonRefs.value[activeTabIndex.value]
  if (!btn || !tabBarRef.value) return
  const first = !glide.value.armed
  // offsetLeft is relative to the tray (position: relative), so it is already
  // in the pill's own coordinate space and survives the wrapper being scrolled.
  glide.value = { x: btn.offsetLeft, w: btn.offsetWidth, h: btn.offsetHeight, armed: true }
  // The first measurement is where the pill *is*, not somewhere it travelled
  // from — so the transition is only turned on a frame later, otherwise the
  // pill grows out of the tray's leading edge on arrival.
  if (first) requestAnimationFrame(() => (glideMoves.value = true))
}

/**
 * Keep the chosen day on screen when the tray overflows its wrapper.
 *
 * Measured with rects rather than `offsetLeft`: the button's offset parent is
 * the tray, not the scroller, and the tray carries `margin-inline: auto` — so
 * the two only agree in the case where the tray happens to be flush left.
 */
const scrollActiveIntoView = () => {
  const btn = tabButtonRefs.value[activeTabIndex.value]
  const wrapper = tabScrollRef.value
  if (!btn || !wrapper || wrapper.scrollWidth <= wrapper.clientWidth) return
  const b = btn.getBoundingClientRect()
  const w = wrapper.getBoundingClientRect()
  const delta = b.left - w.left - (w.width - b.width) / 2
  if (Math.abs(delta) < 1) return
  wrapper.scrollTo({
    left: wrapper.scrollLeft + delta,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  })
}

/**
 * Roving tabindex: a tablist is one stop in the tab order and the arrow keys
 * move within it. Without this the `role="tab"` markup would promise a keyboard
 * contract the tabs don't honour.
 */
const onTabKeydown = (event: KeyboardEvent, index: number) => {
  const tabs = agendaTabs.value
  if (tabs.length < 2) return
  const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
  let next: number | null = null
  if (step !== undefined) next = (index + step + tabs.length) % tabs.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = tabs.length - 1
  if (next === null) return
  event.preventDefault()
  activeTab.value = tabs[next]
  nextTick(() => tabButtonRefs.value[next]?.focus())
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let trayObserver: ResizeObserver | null = null

/**
 * (Re)attach the tray observer.
 *
 * Must be callable more than once: the section root carries
 * `:key="agenda-${currentLanguage}"`, so switching language destroys and
 * rebuilds the whole subtree while this component instance lives on — an
 * observer bound in `onMounted` would be left watching a detached tray, and the
 * pill would never move again.
 */
const attachTrayObserver = () => {
  trayObserver?.disconnect()
  trayObserver = null
  if (typeof ResizeObserver === 'undefined' || !tabBarRef.value) return
  trayObserver = new ResizeObserver(() => measureGlide())
  trayObserver.observe(tabBarRef.value)
}

const syncTabs = () => {
  measureGlide()
  scrollActiveIntoView()
}

watch([activeTab, agendaTabs], () => nextTick(syncTabs))

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

onMounted(() => {
  setupObserver()

  // The tray relays out on rotation, on the laptop scale steps, and whenever a
  // day tab's own text changes width — one observer covers all three, so there
  // is no window resize listener to debounce.
  attachTrayObserver()
  nextTick(syncTabs)

  // The tab labels are set in the template's own face, which arrives after
  // first paint — the pill measured against the fallback face would sit a few
  // pixels off the button it is meant to be under.
  document.fonts?.ready?.then(() => measureGlide()).catch(() => {})
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
  trayObserver?.disconnect()
  trayObserver = null
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
    attachTrayObserver()
    syncTabs()
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
/* ===========================================================================
 * The agenda's chrome — the day tray, the reveal clock, the edit affordances.
 * The list itself is drawn by whichever composition the template picked; its
 * shared rules live in agenda-designs/agenda-base.css.
 *
 * Sizing is mobile-first and scaled by ONE number, `--agd-s`, the same way the
 * guestbook's `--wb-s` and the gift page's `--pay-s` work. The showcase card is
 * 85vh, so on a 13–15" laptop every section renders at roughly two-thirds size;
 * that used to be two blocks of `!important` overrides here, one per element,
 * drifting from the values they were meant to track. Now the two laptop media
 * queries set `--agd-s` and nothing else.
 * ======================================================================== */

.agenda-section {
  --agd-s: 1;
  --agd-ease: cubic-bezier(0.23, 1, 0.32, 1);
}

.agenda-body {
  width: 100%;
}

/* ---------------------------------------------------------------------------
 * Heading
 * ------------------------------------------------------------------------ */

.agenda-header {
  font-size: calc(1.5rem * var(--agd-s));
  line-height: 1.25;
  /* Tracking is size-specific: display type reads too loose as it grows, so the
     heading tightens where the day labels below take a positive bump. */
  letter-spacing: -0.01em;
}

@media (min-width: 640px) {
  .agenda-header {
    font-size: calc(1.875rem * var(--agd-s));
  }
}

/* ---------------------------------------------------------------------------
 * The day tray
 * ------------------------------------------------------------------------ */

.tab-bar-scroll-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
  margin-bottom: calc(1.5rem * var(--agd-s));
  display: flex;
  /* Breathing room so the travelling pill's shadow isn't clipped */
  padding: 0.25rem 0.125rem;
  /* The tray is its own scroller inside the invitation's scroller; without this
     reaching its end drags the whole card sideways-then-down. */
  overscroll-behavior-x: contain;
}

.tab-bar-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

/* The tray is glass, cut from the same recipe as the guestbook sheet and the
   gift page — lighter, because it is a control strip rather than a page: less
   tint, a shorter blur, but the same light top edge, which is what makes it
   read as a material rather than as a grey box. */
.tab-bar {
  position: relative;
  display: flex;
  gap: calc(0.25rem * var(--agd-s));
  margin-inline: auto;
  min-width: min-content;
  padding: calc(0.3125rem * var(--agd-s));
  border-radius: 9999px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--primary-color) 9%, transparent),
    color-mix(in srgb, var(--primary-color) 4%, transparent)
  );
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--primary-color) 14%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    0 10px 30px -20px color-mix(in srgb, var(--primary-color) 70%, transparent);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  backdrop-filter: blur(14px) saturate(150%);
}

/* Collapse the tray chrome when there is only a single date: one immovable pill
   in a tray is a control that cannot be operated, drawn as though it could. */
.tab-bar:has(.tab-button:only-child) {
  padding: 0;
  background: transparent;
  box-shadow: none;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}

/* ---------------------------------------------------------------------------
 * The travelling pill
 *
 * Geometry and colour come in from the component (measured off the active
 * button); this only says how it moves. `transform` + `width` rather than
 * `left`: the transform is the part that travels and it is the part that can be
 * composited, and width changes only because the days are different lengths.
 * ------------------------------------------------------------------------ */

.tab-glide {
  position: absolute;
  top: calc(0.3125rem * var(--agd-s));
  left: 0;
  border-radius: 9999px;
  pointer-events: none;
  opacity: 0;
}

.tab-bar.is-gliding .tab-glide {
  transition:
    transform 420ms var(--agd-ease),
    width 420ms var(--agd-ease),
    opacity 200ms ease;
}

.tab-bar:has(.tab-button:only-child) .tab-glide {
  top: 0;
}

/* ---------------------------------------------------------------------------
 * Day pills: weekday eyebrow over the date
 * ------------------------------------------------------------------------ */

.tab-button {
  position: relative;
  /* Above the pill, so the label is never painted over by the thing that is
     meant to be behind it. */
  z-index: 1;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  padding: calc(0.5rem * var(--agd-s)) calc(1.5rem * var(--agd-s));
  border-radius: 9999px;
  border: none;
  outline: none;
  background-color: transparent;
  color: var(--primary-color);
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    box-shadow 0.3s ease,
    transform 0.16s var(--agd-ease);
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
    padding: calc(0.625rem * var(--agd-s)) calc(1.875rem * var(--agd-s));
  }
}

/* Fallback for the frame in which the pill has not measured yet, and for the
   case where it never can (no ResizeObserver, JS measurement failing): the
   active day keeps a fill of its own, so it can never end up white-on-nothing.
   `.has-glide` hands the job over the moment real geometry exists. */
.tab-bar:not(.has-glide) .tab-button.active {
  background-color: var(--primary-color);
  box-shadow:
    0 10px 22px -10px color-mix(in srgb, var(--primary-color) 70%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.tab-button.active {
  color: #ffffff;
}

@media (hover: hover) and (pointer: fine) {
  .tab-button:not(.active):hover {
    background-color: color-mix(in srgb, var(--primary-color) 9%, transparent);
  }
}

.tab-button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.tab-weekday {
  display: block;
  font-size: calc(0.5625rem * var(--agd-s));
  line-height: 1.1;
  /* Small type wants a positive bump — the inverse of what the heading wants. */
  letter-spacing: 0.22em;
  text-transform: uppercase;
  opacity: 0.75;
}

.tab-date {
  font-size: calc(0.875rem * var(--agd-s));
  line-height: 1.2;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .tab-weekday {
    font-size: calc(0.625rem * var(--agd-s));
  }

  .tab-date {
    font-size: calc(1rem * var(--agd-s));
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

/* ---------------------------------------------------------------------------
 * The day's list
 * ------------------------------------------------------------------------ */

.tab-content-area {
  position: relative;
  transition: opacity 0.4s ease;
}

.tab-content-area.content-hidden {
  opacity: 0;
  pointer-events: none;
}

.tab-content-area h4 {
  font-size: calc(0.875rem * var(--agd-s));
}

@media (min-width: 640px) {
  .tab-content-area h4 {
    font-size: calc(1rem * var(--agd-s));
  }
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

/* ---------------------------------------------------------------------------
 * Manage-page preview edit chrome only — production renders none of this
 * ------------------------------------------------------------------------ */

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

/* ---------------------------------------------------------------------------
 * Laptops — the whole section on one number
 *
 * These are the two values the rest of the showcase uses (the guestbook's
 * `--wb-s`, the gift page's `--pay-s`); at 1536px and above `--agd-s` stays 1.
 * ------------------------------------------------------------------------ */

@media (min-width: 1024px) and (max-width: 1365px) {
  .agenda-section {
    --agd-s: 0.68;
  }
}

@media (min-width: 1366px) and (max-width: 1535px) {
  .agenda-section {
    --agd-s: 0.76;
  }
}

/* ---------------------------------------------------------------------------
 * Accessibility
 * ------------------------------------------------------------------------ */

@media (prefers-reduced-motion: reduce) {
  /* Written against `.animate-active` on purpose. The entrance rules that put
     the animations on are `.animate-active .bounce-word` — two classes — so a
     bare `.bounce-word { animation: none }` here loses the cascade and the
     word-by-word reveal kept running with reduced motion set. Measured: the
     spans sat at 0.93/0.96 opacity mid-animation with the preference on. */
  .tab-button,
  .tab-panel,
  .bounce-word,
  .bounce-in-element,
  .animate-active .bounce-word,
  .animate-active .bounce-in-element {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .tab-button:active {
    transform: none;
  }

  /* The pill still marks the chosen day — it just arrives there instead of
     travelling, which is the vestibular half of the effect. */
  .tab-bar.is-gliding .tab-glide {
    transition: opacity 200ms ease;
  }

  .tab-content-area.content-hidden {
    opacity: 1;
    pointer-events: auto;
  }
}

/* Frostier, not blurrier: the tray keeps the template's colour but stops being
   a window. */
@media (prefers-reduced-transparency: reduce) {
  .tab-bar {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    background: color-mix(in srgb, var(--primary-color) 12%, #ffffff);
  }
}

@media (prefers-contrast: more) {
  .tab-bar {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color) 55%, transparent);
  }

  .tab-weekday {
    opacity: 1;
  }
}
</style>
