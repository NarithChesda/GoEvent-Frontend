<template>
  <div
    ref="containerRef"
    :key="`event-info-${currentLanguage}`"
    class="text-center space-y-6 sm:space-y-8"
    :class="{ 'animate-active': isVisible }"
  >
    <!-- Primary Content Block -->
    <div v-if="descriptionTitle || descriptionText" class="space-y-4">
      <!-- Description Title -->
      <div v-if="descriptionTitle">
        <InlineEditableText
          :value="descriptionTitle"
          :target="{ kind: 'eventText', textType: 'description', field: 'title' }"
          :input-style="{ fontFamily: primaryFont || currentFont, color: primaryColor }"
        >
          <h2
            :class="[
              'text-base sm:text-lg md:text-xl lg:text-2xl font-regular leading-tight capitalize',
              currentLanguage === 'kh' && 'khmer-text-fix',
            ]"
            :style="{
              fontFamily: primaryFont || currentFont,
              color: primaryColor,
            }"
          >
            <span
              v-for="(word, index) in splitToWords(descriptionTitle)"
              :key="`title-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.title + wordCascadeDelay(index)}s` }"
            >{{ word }}{{ index < splitToWords(descriptionTitle).length - 1 ? '\u00A0' : '' }}</span>
          </h2>
        </InlineEditableText>
      </div>

      <!-- Description Text -->
      <div v-if="descriptionText">
        <InlineEditableText
          :value="descriptionText"
          :target="{ kind: 'eventText', textType: 'description', field: 'content' }"
          :multiline="true"
          :input-style="{ fontFamily: secondaryFont || currentFont, color: primaryColor }"
        >
          <p
            :class="[
              'text-sm sm:text-base leading-normal text-center max-w-full break-words whitespace-pre-wrap opacity-90 px-4',
              currentLanguage === 'kh' && 'khmer-text-fix',
            ]"
            :style="{
              fontFamily: secondaryFont || currentFont,
              color: primaryColor,
              wordWrap: 'break-word',
              hyphens: 'auto',
            }"
          >
            <template
              v-for="(line, lineIndex) in descriptionLines"
              :key="`desc-line-${currentLanguage}-${lineIndex}`"
            >
              <br v-if="lineIndex > 0" />
              <span
                v-for="(word, wordIndex) in line"
                :key="`desc-${currentLanguage}-${lineIndex}-${wordIndex}`"
                class="bounce-word"
                :style="{
                  animationDelay: `${animationDelays.description + wordCascadeDelay(getGlobalWordIndex(descriptionLines, lineIndex, wordIndex))}s`,
                }"
              >{{ word }}{{ wordIndex < line.length - 1 ? '\u00A0' : '' }}</span>
            </template>
          </p>
        </InlineEditableText>
      </div>
    </div>

    <!-- Stylish Event Details Card: sits ABOVE the glass card so it shows against
         the page background, styled with primaryColor (theme accent). Two-column
         panel framed with top+bottom borders. Left column: stacked weekday /
         day-number / month (from eventStartDate). Right column: locationText.
         When eventStartDate is missing, the left column and vertical divider
         collapse so locationText spans the card. -->
    <div
      v-if="!isCalendarDesign && (hasDateParts || locationText)"
      class="event-details-card bounce-in-element"
      :class="[hasDateParts ? 'has-date-column' : 'no-date-column']"
      :style="{
        color: primaryColor,
        animationDelay: `${animationDelays.date}s`,
      }"
    >
      <div
        v-if="hasDateParts"
        :class="['date-column', currentLanguage === 'kh' && 'khmer-text-fix']"
      >
        <EditableRegion :intent="{ kind: 'eventDate' }" class="date-column-region">
          <div
            v-if="dateParts.weekday"
            class="date-weekday"
            :style="{ fontFamily: secondaryFont || currentFont }"
          >{{ dateParts.weekday }}</div>
          <div
            v-if="dateParts.day"
            class="date-day"
            :style="{ fontFamily: primaryFont || currentFont }"
          >{{ dateParts.day }}</div>
          <div
            v-if="dateParts.month"
            class="date-month"
            :style="{ fontFamily: secondaryFont || currentFont }"
          >{{ dateParts.month }}</div>
        </EditableRegion>
      </div>

      <div
        v-if="hasDateParts && locationText"
        class="details-divider"
        aria-hidden="true"
      ></div>

      <div v-if="locationText" class="details-column">
        <InlineEditableText
          :value="locationText"
          :target="{ kind: 'eventText', textType: 'location_text', field: 'content' }"
          :multiline="true"
          :input-style="{ fontFamily: secondaryFont || currentFont, color: primaryColor }"
        >
          <div
            :class="['details-location', currentLanguage === 'kh' && 'khmer-text-fix']"
            :style="{ fontFamily: secondaryFont || currentFont }"
          >{{ locationText }}</div>
        </InlineEditableText>
      </div>
    </div>

    <!-- Calendar design: a full month grid with the event day circled. Driven
         by template_assets.event_details_design.type === 'calendar'. Falls back
         to the panel design above when no parseable start date is available.
         Location renders beneath the grid. -->
    <div
      v-if="isCalendarDesign"
      class="calendar-card bounce-in-element"
      :style="{
        color: primaryColor,
        animationDelay: `${animationDelays.date}s`,
        '--calendar-marker-color': calendarMarkerColor,
      }"
    >
      <EditableRegion :intent="{ kind: 'eventDate' }" class="calendar-region">
      <div
        :class="['calendar-heading', currentLanguage === 'kh' && 'khmer-text-fix']"
        :style="{ fontFamily: primaryFont || currentFont }"
      >
        {{ calendarModel.heading }}
      </div>

      <div
        :class="['calendar-grid', currentLanguage === 'kh' && 'khmer-text-fix']"
        role="table"
      >
        <div
          v-for="(label, i) in calendarWeekdayLabels"
          :key="`cal-wd-${i}`"
          class="calendar-weekday"
          :style="{
            fontFamily: secondaryFont || currentFont,
            animationDelay: `${calendarTiming.weekdayBase + i * 0.04}s`,
          }"
        >{{ label }}</div>

        <div
          v-for="(cell, i) in calendarModel.cells"
          :key="`cal-day-${i}`"
          class="calendar-day"
          :class="{ 'is-event': cell.isEvent, 'is-blank': cell.day === null }"
          :style="calendarCellStyle(cell, i)"
        >
          <span class="calendar-day-num">{{ cell.label }}</span>
          <svg
            v-if="cell.isEvent"
            class="calendar-day-ring"
            viewBox="0 0 64 56"
            aria-hidden="true"
          >
            <path
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              pathLength="100"
              d="M32 50C18 44 6 36 6 24 6 14 14 8 22 10c5 1.3 8 5 10 9 2-4 5-7.7 10-9 8-2 16 4 16 14 0 12-12 20-26 26z"
            />
          </svg>
        </div>
      </div>
      </EditableRegion>
    </div>

    <!-- Event Details Block -->
    <div class="space-y-3">
      <div
        class="block relative gradient-stroke-container bounce-in-element"
        :style="{
          background: `${backgroundColor || primaryColor}60`,
          padding: '2px',
          borderRadius: '2rem',
          animationDelay: `${animationDelays.card}s`,
        }"
      >
        <div
          class="px-4 pt-3 pb-4 backdrop-blur-sm space-y-1 relative"
          style="border-radius: calc(2rem - 2px); border: 2px solid white"
          :style="{
           background: `${backgroundColor || primaryColor}60`,
          }"
        >
          <!-- Location header (calendar design): centered above the map frame,
               replacing the panel design's location card. -->
          <InlineEditableText
            v-if="isCalendarDesign && locationText"
            :value="locationText"
            :target="{ kind: 'eventText', textType: 'location_text', field: 'content' }"
            :multiline="true"
            :input-style="{ fontFamily: secondaryFont || currentFont, color: primaryColor }"
          >
            <div
              class="map-location-header px-2 pt-2 pb-1 bounce-in-element"
              :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
              :style="{
                fontFamily: secondaryFont || currentFont,
                animationDelay: `${animationDelays.map}s`,
              }"
            >{{ locationText }}</div>
          </InlineEditableText>

          <!-- Google Map Embed -->
          <div
            v-if="hasGoogleMap && googleMapEmbedLink"
            class="pt-2 bounce-in-element"
            :style="{ animationDelay: `${animationDelays.map}s` }"
          >
            <EditableRegion :intent="{ kind: 'gmapEmbed' }">
              <div
                class="aspect-video overflow-hidden"
                :style="{
                  border: `1px solid rgba(255, 255, 255, 0.3)`,
                  borderRadius: '1rem',
                }"
              >
                <iframe
                  :src="googleMapEmbedLink"
                  width="100%"
                  height="100%"
                  style="border: 0"
                  :allowfullscreen="false"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                />
              </div>
            </EditableRegion>
          </div>
          <!-- No map yet: offer an add affordance, but only inside the
               editable manage-page preview (editIntentCtx is never provided
               on the public showcase). -->
          <div v-else-if="editIntentCtx" class="pt-2">
            <button
              type="button"
              class="edit-region-control add-map-placeholder aspect-video"
              @click.stop.prevent="editIntentCtx.requestEdit({ kind: 'gmapEmbed' })"
            >
              {{ tApp('management.showcasePreview.editors.addMap') }}
            </button>
          </div>

          <!-- Countdown Display - Below Map, Above RSVP (also rendered when
               turned off inside the editable manage-page preview, so the
               toggle stays reachable and the organizer can still preview the
               content — editIntentCtx is never provided on the public
               showcase) -->
          <div
            v-if="countdown && isCountdownActive && (showCountdown || editIntentCtx)"
            class="countdown-container px-4 pt-2 pb-2 bounce-in-element"
            :class="{ 'has-display-toggle': editIntentCtx }"
            :style="{ animationDelay: `${animationDelays.countdown}s` }"
          >
            <SectionDisplayToggle
              field="countdown_enabled"
              :active="!!showCountdown"
              :label="tApp('management.showcasePreview.editors.countdownLabel')"
            />
            <div class="countdown-wrapper">
              <!-- Countdown Header -->
              <div
                class="countdown-header text-sm sm:text-base font-medium leading-snug mb-2"
                :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
                :style="{
                  fontFamily: secondaryFont || currentFont,
                  color: 'white',
                }"
              >
                {{ countdownHeader }}
              </div>

              <!-- Time display with individual labels -->
              <div class="countdown-time-row">
                <!-- Days -->
                <div class="countdown-unit">
                  <div
                    class="countdown-number"
                    :style="{ fontFamily: countdownNumberFont }"
                  >
                    {{ countdownDaysDisplay }}
                  </div>
                  <div
                    class="countdown-unit-label"
                    :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
                    :style="{
                      fontFamily: secondaryFont || currentFont,
                    }"
                  >
                    {{ dayLabel }}
                  </div>
                </div>

                <!-- Separator -->
                <div
                  class="countdown-separator"
                  :class="[currentLanguage === 'kh' && 'is-khmer']"
                  :style="{ fontFamily: countdownNumberFont }"
                >
                  :
                </div>

                <!-- Hours -->
                <div class="countdown-unit">
                  <div
                    class="countdown-number"
                    :style="{ fontFamily: countdownNumberFont }"
                  >
                    {{ countdownHoursDisplay }}
                  </div>
                  <div
                    class="countdown-unit-label"
                    :class="[currentLanguage === 'kh' && 'khmer-text-fix']"
                    :style="{
                      fontFamily: secondaryFont || currentFont,
                    }"
                  >
                    {{ hourLabel }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Divider between Countdown and RSVP -->
          <div
            v-if="countdown && isCountdownActive && (showCountdown || editIntentCtx) && (showRsvp || editIntentCtx)"
            class="countdown-divider bounce-in-element"
            :style="{ animationDelay: `${animationDelays.divider}s` }"
          >
            <div class="divider-line"></div>
          </div>

          <!-- RSVP Section Integrated Below Map (also rendered when turned
               off inside the editable manage-page preview, so the toggle
               stays reachable and the organizer can still preview the
               content — editIntentCtx is never provided on the public
               showcase) -->
          <div
            v-if="showRsvp || editIntentCtx"
            class="bounce-in-element rsvp-toggle-container"
            :class="{ 'has-display-toggle': editIntentCtx }"
            :style="{ animationDelay: `${animationDelays.rsvp}s` }"
          >
            <SectionDisplayToggle
              field="rsvp_enabled"
              :active="!!showRsvp"
              :label="tApp('management.showcasePreview.editors.rsvpLabel')"
            />
            <slot name="rsvp"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick, inject } from 'vue'
import { showcaseRevealObserverInit } from '@/composables/showcase/useScrollProgress'
import InlineEditableText from '@/components/showcase-preview/edit/InlineEditableText.vue'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import SectionDisplayToggle from '@/components/showcase-preview/edit/SectionDisplayToggle.vue'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import type { EventDetailsMarkerColorSource } from '@/services/api/types/template.types'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useCountdown } from '../../composables/useCountdown'
import {
  translateRSVP,
  getLocalizedDateParts,
  toKhmerNumerals,
  KHMER_MONTHS,
  KHMER_DAYS,
  type SupportedLanguage,
} from '../../utils/translations'
import {
  splitToWords,
  splitToLines,
  getGlobalWordIndex,
  ANIMATION_CONSTANTS,
  wordCascadeDelay,
  getTextAnimationDuration,
} from '@/composables/showcase/useHostInfoUtils'

interface Props {
  descriptionTitle?: string
  descriptionText?: string
  dateText?: string
  timeText?: string
  locationText?: string
  hasGoogleMap?: boolean
  googleMapEmbedLink?: string
  primaryColor: string
  secondaryColor?: string
  accentColor: string
  backgroundColor?: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  currentLanguage?: string
  showRsvp?: boolean
  showCountdown?: boolean
  eventStartDate?: string
  baseDelay?: number
  /** Date/location block design from the template package. Defaults to 'panel'. */
  detailsDesign?: 'panel' | 'calendar'
  /**
   * Colour slot the calendar design's event-day marker (heart ring + day-number
   * tint) draws from. Defaults to 'accent' so it tracks the template palette.
   */
  detailsMarkerColorSource?: EventDetailsMarkerColorSource
  /** Hex colour, read only when detailsMarkerColorSource is 'custom'. */
  detailsMarkerCustomColor?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  showRsvp: false,
  showCountdown: true,
  baseDelay: 0.25,
  detailsDesign: 'panel',
  detailsMarkerColorSource: 'accent',
})

const ELEMENT_GAP = ANIMATION_CONSTANTS.ELEMENT_GAP

// Visibility tracking for scroll-triggered animations
const containerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let classObserver: MutationObserver | null = null

const cleanupObserver = () => {
  if (classObserver) {
    classObserver.disconnect()
    classObserver = null
  }
}

const setupVisibilityTracking = () => {
  cleanupObserver()

  const parent = containerRef.value?.parentElement
  if (!parent) return

  // When the parent wrapper uses the showcase animate-reveal pattern, watch for
  // is-visible being added to it instead of running our own IntersectionObserver.
  // This guarantees our internal bounce animations start at the exact moment the
  // outer CSS transition begins — including any stagger delay applied by the parent
  // showcase — so HostInfo and EventInfo animate in sequence rather than racing.
  if (parent.classList.contains('animate-reveal')) {
    if (parent.classList.contains('is-visible')) {
      isVisible.value = true
      return
    }
    classObserver = new MutationObserver(() => {
      if (parent.classList.contains('is-visible')) {
        isVisible.value = true
        cleanupObserver()
      }
    })
    classObserver.observe(parent, { attributes: true, attributeFilter: ['class'] })
  } else {
    // Fallback for use outside the showcase (e.g. preview / admin)
    const fallback = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible.value = true
            fallback.disconnect()
          }
        })
      },
      showcaseRevealObserverInit(),
    )
    if (containerRef.value) fallback.observe(containerRef.value)
  }
}

onMounted(() => {
  setupVisibilityTracking()
})

onUnmounted(() => {
  cleanupObserver()
})

// Re-run on language change — the component is re-keyed so the parent DOM node
// is the same but the component root is replaced; re-observe after tick.
watch(
  () => props.currentLanguage,
  async () => {
    isVisible.value = false
    cleanupObserver()
    await nextTick()
    setTimeout(() => setupVisibilityTracking(), 50)
  },
)

// Break the ISO start date into weekday / day-number / month parts so the
// card can render a stylish stacked date block instead of plain dateText.
// Delegates to getLocalizedDateParts so Khmer uses explicit translated names
// (Intl km-KH output varies across browsers).
const dateParts = computed<{ weekday: string; day: string; month: string }>(() => {
  if (!props.eventStartDate) return { weekday: '', day: '', month: '' }
  return getLocalizedDateParts(props.eventStartDate, props.currentLanguage ?? 'en')
})

// Convenience flag: drives the card's 2-column vs 1-column grid layout
// in the template (left date-column collapses when no eventStartDate).
const hasDateParts = computed(
  () => !!(dateParts.value.weekday || dateParts.value.day || dateParts.value.month),
)

// Active design: 'calendar' only renders when we also have a parseable start
// date to build the month grid from; otherwise fall back to the panel design.
const isCalendarDesign = computed(
  () => props.detailsDesign === 'calendar' && hasDateParts.value,
)

/** Used only when the chosen colour slot resolves to nothing (custom source
 *  with no hex yet). Matches the original hand-drawn-heart red. */
const CALENDAR_MARKER_FALLBACK = '#b3261e'

// Colour of the calendar's event-day marker — the heart ring drawn around the
// date and the matching tint applied to the day number once it finishes drawing.
// Template-driven so it can sit on any background instead of always being red.
const calendarMarkerColor = computed(() => {
  switch (props.detailsMarkerColorSource) {
    case 'custom':
      return props.detailsMarkerCustomColor || CALENDAR_MARKER_FALLBACK
    case 'primary':
      return props.primaryColor || CALENDAR_MARKER_FALLBACK
    case 'secondary':
      return props.secondaryColor || props.primaryColor || CALENDAR_MARKER_FALLBACK
    case 'accent':
    default:
      return props.accentColor || props.primaryColor || CALENDAR_MARKER_FALLBACK
  }
})

// Localized SUN–SAT weekday header labels for the calendar grid. Uses the
// explicit Khmer short names for 'kh' and Intl 'short' weekday names otherwise,
// built off a known week (2024-01-07 is a Sunday) so order is guaranteed.
const calendarWeekdayLabels = computed<string[]>(() => {
  const lang = props.currentLanguage ?? 'en'
  if (lang === 'kh') {
    return KHMER_DAYS.map((d) => d.slice(0, 3))
  }
  const localeMap: Record<string, string> = {
    en: 'en-US',
    'zh-cn': 'zh-CN',
    fr: 'fr-FR',
    ja: 'ja-JP',
    ko: 'ko-KR',
    th: 'th-TH',
    vn: 'vi-VN',
  }
  const locale = localeMap[lang] ?? lang ?? 'en-US'
  try {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    // 2024-01-07 is a Sunday — step through 7 days in UTC for a stable order.
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(Date.UTC(2024, 0, 7 + i))),
    )
  } catch {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  }
})

interface CalendarCell {
  /** Display label for the day number (Khmer numerals for 'kh'). Empty for leading blanks. */
  label: string
  /** The day-of-month this cell represents, or null for leading blanks. */
  day: number | null
  /** True for the event day — gets the circled highlight. */
  isEvent: boolean
}

// Month-grid model for the calendar design: a flat array of cells (leading
// blanks + each day of the event's month), with the event day flagged so the
// template can circle it. Heading shows the localized month + year.
const calendarModel = computed(() => {
  const d = props.eventStartDate ? new Date(props.eventStartDate) : null
  if (!d || Number.isNaN(d.getTime())) {
    return { heading: '', cells: [] as CalendarCell[] }
  }

  const lang = props.currentLanguage ?? 'en'
  const year = d.getFullYear()
  const month = d.getMonth()
  const eventDay = d.getDate()

  const firstWeekday = new Date(year, month, 1).getDay() // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: CalendarCell[] = []
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ label: '', day: null, isEvent: false })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      label: lang === 'kh' ? toKhmerNumerals(day) : String(day),
      day,
      isEvent: day === eventDay,
    })
  }

  let heading: string
  if (lang === 'kh') {
    heading = `${KHMER_MONTHS[month]} ${toKhmerNumerals(year)}`
  } else {
    const localeMap: Record<string, string> = {
      en: 'en-US',
      'zh-cn': 'zh-CN',
      fr: 'fr-FR',
      ja: 'ja-JP',
      ko: 'ko-KR',
      th: 'th-TH',
      vn: 'vi-VN',
    }
    const locale = localeMap[lang] ?? lang ?? 'en-US'
    try {
      const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(d)
      heading = `${monthName} ${year}`
    } catch {
      heading = `${dateParts.value.month} ${year}`
    }
  }

  return { heading, cells }
})

// Animation delays calculation
const animationDelays = computed(() => {
  const base = props.baseDelay // 0.1s

  // Track A: text word animations — these form their own chain and can be slow.
  let textCursor = base
  const title = textCursor
  if (props.descriptionTitle) {
    textCursor += getTextAnimationDuration(props.descriptionTitle) + ELEMENT_GAP
  }
  const description = textCursor

  // Track B: structural / bounce-in elements — fixed small offsets from base so
  // they never wait for text word counts. All visible within ~0.75s regardless of
  // how long the title/description text is.
  const date = base + 0.15      // date+location card (topmost, appears first)
  const card = base + 0.25      // gradient-stroke-container (map card shell)
  const map = base + 0.35       // map embed inside the card
  const countdown = base + 0.45 // countdown block
  const divider = base + 0.45   // countdown↔RSVP divider
  const rsvp = base + 0.55      // RSVP section

  return { title, description, date, card, map, countdown, divider, rsvp }
})

// Calendar design animation timeline, all offset from the card's own bounce-in:
// weekday labels fade in first, then day cells cascade in with a small per-cell
// stagger, then the heart draws itself around the event day, then starts a slow
// heartbeat pulse once fully drawn (draw animation runs 1.1s).
const calendarTiming = computed(() => {
  const cardIn = animationDelays.value.date
  const weekdayBase = cardIn + 0.2
  const cellBase = cardIn + 0.4
  const cellStep = 0.012
  const drawDelay = cellBase + calendarModel.value.cells.length * cellStep + 0.15
  const pulseDelay = drawDelay + 1.2
  return { weekdayBase, cellBase, cellStep, drawDelay, pulseDelay }
})

// Per-cell inline style: staggered reveal delay for every day, plus the heart
// draw/pulse delays as CSS vars on the event cell (inherited by the ring SVG
// and the day number so their delayed animations stay in sync).
const calendarCellStyle = (cell: CalendarCell, index: number): Record<string, string> => {
  const t = calendarTiming.value
  const style: Record<string, string> = {
    fontFamily: props.secondaryFont || props.currentFont,
    animationDelay: `${t.cellBase + index * t.cellStep}s`,
  }
  if (cell.isEvent) {
    style['--heart-draw-delay'] = `${t.drawDelay}s`
    style['--heart-pulse-delay'] = `${t.pulseDelay}s`
  }
  return style
}

// Countdown logic
const countdown = props.eventStartDate ? useCountdown(props.eventStartDate) : null

// Hide countdown once it reaches zero (event has started/passed)
const isCountdownActive = computed(() => {
  if (!countdown) return false
  if (countdown.hasPassed.value) return false
  return !(countdown.daysRemaining.value === 0 && countdown.hoursRemaining.value === 0)
})

defineEmits<{
  openMap: []
}>()

// Only provided by the editable manage-page preview frame — undefined on the
// public showcase, so the add-map placeholder can never leak into production.
const editIntentCtx = inject(EditIntentKey, undefined)
const { t: tApp } = useAppLanguage()

// Computed property to ensure description starts with capital letter
const capitalizedDescription = computed(() => {
  if (!props.descriptionText) return ''
  const text = props.descriptionText.trim()
  if (text.length === 0) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
})

// Split per line, not per word: the description is authored in a textarea, so
// the line breaks typed there are part of the layout the author chose and the
// invitation has to honour them (the word-reveal stagger keeps running across
// the breaks via getGlobalWordIndex).
const descriptionLines = computed(() => splitToLines(capitalizedDescription.value))

// Countdown header and labels
const countdownHeader = computed(() => {
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  return translateRSVP('countdown_header', currentLang)
})

const dayLabel = computed(() => {
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  return translateRSVP('countdown_day', currentLang)
})

const hourLabel = computed(() => {
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  return translateRSVP('countdown_hour', currentLang)
})

// Display numerals in Khmer script for the 'kh' locale; other locales keep
// Arabic digits so the Rajdhani display font renders correctly.
const countdownDaysDisplay = computed(() => {
  const raw = countdown?.formattedDays.value ?? ''
  return props.currentLanguage === 'kh' ? toKhmerNumerals(raw) : raw
})

const countdownHoursDisplay = computed(() => {
  const raw = countdown?.formattedHours.value ?? ''
  return props.currentLanguage === 'kh' ? toKhmerNumerals(raw) : raw
})

// Rajdhani has no Khmer glyphs — fall back to the showcase primary font so
// the Khmer numerals render consistently with the rest of the card.
const countdownNumberFont = computed(() =>
  props.currentLanguage === 'kh'
    ? props.primaryFont || props.currentFont
    : `'Rajdhani', sans-serif`,
)
</script>

<style scoped>
/* Stylish event details card — two-column panel framed with top+bottom borders.
   Left column stacks weekday / day-number / month; right column stacks dateText
   (time/description) + locationText, separated by a horizontal rule. When no
   eventStartDate is available, the left column and vertical divider collapse
   to a single-column layout with no-date-column. */
/* Card sits on the page background now (above the glass card), so borders and
   the vertical divider inherit from the element's color (set inline to
   primaryColor) instead of the white-on-glass palette. */
.event-details-card {
  display: grid;
  align-items: stretch;
  gap: 1rem;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: 0.75rem 0.5rem;
  /* Thin frame matched to the agenda's 1px divider weight so the card reads
     as part of the same line-based decorative system. color-mix mutes the
     alpha slightly without using opacity (which would cascade to children). */
  border-top: 1px solid color-mix(in srgb, currentColor 60%, transparent);
  border-bottom: 1px solid color-mix(in srgb, currentColor 60%, transparent);
  box-sizing: border-box;
}

/* Mobile: strict 1:2 ratio — date column gets 1/3, location 2/3. minmax(0, ...)
   lets the grid tracks ignore content-driven min-widths so the ratio is honored
   even when weekday names (e.g. Khmer) would otherwise force the left track wider. */
.event-details-card.has-date-column {
  grid-template-columns: minmax(0, 1fr) 1px minmax(0, 2fr);
}

.event-details-card.no-date-column {
  grid-template-columns: 1fr;
}

.date-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-width: 0;
  gap: 0.15rem;
}

/* Manage-preview only wrapper (bare slot in production, see EditableRegion) —
   keeps the weekday/day/month stack centered exactly as the plain date-column
   children were before this wrapper existed. */
.date-column-region {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

/* Mobile: scaled down for the 1/3-width date column so "WEDNESDAY"/"SEPTEMBER"
   don't overflow or wrap. Full sizes restored at ≥640px where the column widens. */
.date-weekday,
.date-month {
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-weight: 600;
  line-height: 1.1;
}

.date-day {
  font-size: 2.125rem;
  font-weight: 700;
  line-height: 1;
  padding: 0.1rem 0;
}

.details-divider {
  width: 1px;
  align-self: stretch;
  background-color: color-mix(in srgb, currentColor 60%, transparent);
}

.details-column {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  min-width: 0;
  text-align: center;
}

.details-location {
  font-size: 0.8125rem;
  line-height: 1.35;
  white-space: pre-line;
  word-break: break-word;
}

/* ============================================================
   Calendar design — full month grid with the event day circled.
   Sits on the page background like the panel design and inherits
   the theme accent via inline color (currentColor). Sizing is
   self-contained and responsive; the laptop media-query blocks
   below only adjust the panel design, not this one.
   ============================================================ */
.calendar-card {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: 1rem 0.75rem;
  box-sizing: border-box;
  border-top: 1px solid color-mix(in srgb, currentColor 60%, transparent);
  border-bottom: 1px solid color-mix(in srgb, currentColor 60%, transparent);
}

/* Manage-preview only wrapper around the heading + grid (bare slot in
   production, see EditableRegion) — no layout of its own beyond block flow,
   which matches the two children's original stacking inside .calendar-card. */
.calendar-region {
  display: block;
}

.calendar-heading {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  line-height: 1.1;
  text-align: center;
  margin-bottom: 0.85rem;
  /* Flanking hairlines beside the month name — invitation-header treatment
     matching the card's 1px line-based frame. */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.calendar-heading::before,
.calendar-heading::after {
  content: '';
  flex: 1;
  max-width: 3.5rem;
  height: 1px;
  background: color-mix(in srgb, currentColor 45%, transparent);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.15rem 0;
  row-gap: 0.2rem;
}

.calendar-weekday {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: center;
  padding-bottom: 0.35rem;
  opacity: 0;
}

.animate-active .calendar-weekday {
  animation: calendarFadeIn 0.4s ease-out forwards;
}

@keyframes calendarFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 0.85;
    transform: translateY(0);
  }
}

.calendar-day {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 7 / 6;
  font-size: 0.9rem;
  line-height: 1;
  opacity: 0;
}

.animate-active .calendar-day {
  animation: calendarDayIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes calendarDayIn {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.calendar-day.is-blank {
  visibility: hidden;
}

.calendar-day-num {
  position: relative;
  z-index: 1;
}

/* Hand-drawn-style heart ring drawn around the event day. Slightly larger than
   the cell so it reads as circling the number, with a slight tilt for a
   sketched-by-hand feel. Once revealed it settles into a slow heartbeat pulse
   (delay set via --heart-pulse-delay on the event cell).

   Colour comes from --calendar-marker-color, resolved from the template's
   marker colour slot on .calendar-card; the red is only a last-resort default. */
.calendar-day-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 150%;
  height: 150%;
  transform: translate(-50%, -50%) rotate(-5deg);
  pointer-events: none;
  color: var(--calendar-marker-color, #b3261e);
  opacity: 0.9;
}

.animate-active .calendar-day-ring {
  animation: heartBeat 2.6s ease-in-out infinite;
  animation-delay: var(--heart-pulse-delay, 0s);
}

/* Double-thump then rest, like a heartbeat. Keyframes restate the base
   translate/rotate since transform can't be partially animated. */
@keyframes heartBeat {
  0%,
  40%,
  100% {
    transform: translate(-50%, -50%) rotate(-5deg) scale(1);
  }
  10% {
    transform: translate(-50%, -50%) rotate(-5deg) scale(1.12);
  }
  20% {
    transform: translate(-50%, -50%) rotate(-5deg) scale(1);
  }
  30% {
    transform: translate(-50%, -50%) rotate(-5deg) scale(1.07);
  }
}

/* Draw-on effect: the path declares pathLength="100" so dash values are
   unit-independent; animating dashoffset 100 → 0 traces the heart like a pen
   circling the date, starting after the day cells finish cascading in. */
.calendar-day-ring path {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
}

.animate-active .calendar-day-ring path {
  animation: heartDraw 1.1s ease-in-out forwards;
  animation-delay: var(--heart-draw-delay, 0s);
}

@keyframes heartDraw {
  to {
    stroke-dashoffset: 0;
  }
}

.calendar-day.is-event .calendar-day-num {
  font-weight: 700;
}

/* Once the heart is drawn, tint the event day number to match it so the
   date reads as a single marked unit. Fires as the draw completes (pulse
   delay = draw delay + draw duration). */
.animate-active .calendar-day.is-event .calendar-day-num {
  animation: eventDayTint 0.6s ease-out forwards;
  animation-delay: var(--heart-pulse-delay, 0s);
}

@keyframes eventDayTint {
  to {
    color: var(--calendar-marker-color, #b3261e);
  }
}

/* Location header for the calendar design — sits inside the glass map card,
   centered above the Google Map frame. White-on-glass to match the card's
   countdown text. */
.map-location-header {
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.35;
  text-align: center;
  color: white;
  white-space: pre-line;
  word-break: break-word;
}

/* Khmer day numbers sit lower in their em-box; relax line-height so they don't
   clip against the heart ring. */
.calendar-grid.khmer-text-fix .calendar-day {
  line-height: 1.2;
}

@media (min-width: 640px) {
  .calendar-card {
    max-width: 460px;
    padding: 1.25rem 1.5rem;
  }

  .calendar-heading {
    font-size: 1.75rem;
    margin-bottom: 1rem;
  }

  .calendar-weekday {
    font-size: 0.8125rem;
  }

  .calendar-day {
    font-size: 1.05rem;
  }
}

@media (min-width: 768px) {
  .calendar-card {
    max-width: 500px;
  }
}

@media (min-width: 640px) {
  .event-details-card {
    max-width: 460px;
    padding: 1rem 1.25rem;
  }

  /* Above mobile, let the date column hug its content and give location the rest. */
  .event-details-card.has-date-column {
    grid-template-columns: auto 1px 1fr;
  }

  .date-column {
    min-width: 5.5rem;
  }

  .date-weekday,
  .date-month {
    font-size: 1rem;
    letter-spacing: 0.1em;
  }

  .date-day {
    font-size: 3.25rem;
  }

  .details-location {
    font-size: 0.9rem;
  }
}

@media (min-width: 768px) {
  .event-details-card {
    max-width: 500px;
  }

  .date-day {
    font-size: 3.5rem;
  }
}

/* Khmer subscripts sit lower; relax line-height so the day-number isn't clipped. */
.date-column.khmer-text-fix .date-day {
  line-height: 1.15;
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

/* Bounce In Animation for card - only active when in view */
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

.glass-section {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.25);
  /* Safari/iOS compatibility: -webkit prefix MUST come BEFORE standard property */
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

/* Countdown styles */
.countdown-container {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.rsvp-toggle-container {
  position: relative;
}

/* Manage-page preview edit chrome: reserves clearance above the section's
   own content so the top-right corner toggle never overlaps it (e.g. the
   RSVP question, which otherwise starts flush with the top edge). Compound
   selector outranks the countdown container's own Tailwind `pt-2` utility
   regardless of stylesheet order. Never applied on the public showcase
   (editIntentCtx is undefined there, so the class is never added). */
.countdown-container.has-display-toggle,
.rsvp-toggle-container.has-display-toggle {
  padding-top: 2.25rem;
}

.countdown-wrapper {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.countdown-time-row {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 0.75rem;
}

.countdown-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  min-width: 0;
}

.countdown-number {
  font-weight: 700;
  color: white;
  text-align: center;
  line-height: 1;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  /* Fixed width for consistent alignment - minimum 2 characters */
  min-width: 2ch;
  /* Responsive font size based on container width */
  font-size: clamp(3.5rem, 15vw, 8rem);
}

.countdown-separator {
  font-weight: 700;
  color: white;
  text-align: center;
  line-height: 1;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  /* Match the number size */
  font-size: clamp(3.5rem, 15vw, 8rem);
  /* Align with numbers - needs to account for the unit label height */
  margin-bottom: 0.875rem;
  flex-shrink: 0;
}

.countdown-unit-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-align: center;
  white-space: nowrap;
}

/* Khmer fallback fonts position the colon glyph differently within its em-box
   than Rajdhani, so the baseline-alignment trick (margin-bottom) can't center
   it reliably. Switch to flex-center on the row and counter-shift upward by
   roughly half the label height so the colon sits on the number's vertical
   center instead of the whole column's center. */
.countdown-separator.is-khmer {
  align-self: center;
  margin-bottom: 0 !important;
  /* Uses em (relative to the colon's own font-size) so the upward shift
     scales with the responsive number size across breakpoints. */
  transform: translateY(-0.38em);
}

/* Desktop/laptop viewports use a shallower upward shift — at larger column
   widths and label sizes the mobile-tuned -0.38em lifts the colon above
   the Khmer digits' optical center. */
@media (min-width: 1024px) {
  .countdown-separator.is-khmer {
    transform: translateY(-0.28em);
  }
}

/* Divider between Countdown and RSVP */
.countdown-divider {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 0 0.75rem 0;
}

.divider-line {
  width: 70%;
  max-width: 220px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.55),
    transparent
  );
}

/* Khmer text fix now defined globally in src/assets/main.css */

/* Mobile and Tablet adjustments */
@media (max-width: 1023px) {
  .countdown-number {
    font-size: clamp(4rem, 18vw, 8rem);
  }

  .countdown-separator {
    font-size: clamp(4rem, 18vw, 8rem);
    margin-bottom: 0.875rem;
  }

  .countdown-unit-label {
    font-size: 0.875rem;
  }

  .countdown-time-row {
    gap: 0.5rem;
  }

  /* Spacing — ~62% of desktop base to match the proportionally smaller text/card */
  .space-y-6 > * + * {
    margin-top: 0.875rem !important;
  }

  .space-y-8 > * + * {
    margin-top: 0.875rem !important;
  }

  .space-y-4 > * + * {
    margin-top: 0.625rem !important;
  }

  .space-y-3 > * + * {
    margin-top: 0.5rem !important;
  }

  .space-y-2 > * + * {
    margin-top: 0.375rem !important;
  }

  /* Card inner padding */
  .px-4 {
    padding-left: 0.625rem !important;
    padding-right: 0.625rem !important;
  }

  .pt-3 {
    padding-top: 0.5rem !important;
  }

  .pb-4 {
    padding-bottom: 0.625rem !important;
  }

  /* Map top padding inside card */
  .pt-2 {
    padding-top: 0.3rem !important;
  }

  .pb-2 {
    padding-bottom: 0.3rem !important;
  }

  /* Card shell */
  .gradient-stroke-container {
    border-radius: 1.25rem !important;
    padding: 1.5px !important;
  }

  .gradient-stroke-container > div {
    border-radius: calc(1.25rem - 1.5px) !important;
  }

  /* Date/location card */
  .event-details-card {
    padding: 0.625rem 0.75rem !important;
  }

  /* Calendar design — mobile padding */
  .calendar-card {
    padding: 0.75rem 0.625rem !important;
  }
}

/* Small laptops 13-inch (1024px-1365px) - Match mobile base scale */
@media (min-width: 1024px) and (max-width: 1365px) {
  .countdown-number {
    font-size: clamp(1.89rem, 7.56vw, 3.465rem); /* Reduced by 30% from original */
  }

  .countdown-separator {
    font-size: clamp(1.89rem, 7.56vw, 3.465rem); /* Reduced by 30% from original */
    margin-bottom: 0.875rem;
  }

  .countdown-unit-label {
    font-size: 0.6rem !important; /* Match countdown header text size */
  }

  .countdown-time-row {
    gap: 0.65rem;
  }

  /* Date column — 1/4 width, text scaled to fit the narrower column */
  .event-details-card.has-date-column {
    grid-template-columns: minmax(0, 1fr) 1px minmax(0, 3fr) !important;
  }

  .date-column {
    min-width: 0 !important;
  }

  .date-weekday,
  .date-month {
    font-size: 0.515rem !important; /* 0.6875rem × 0.75 — fits 1/4-width column */
    letter-spacing: 0.04em;
  }

  .date-day {
    font-size: 1.6rem !important; /* 2.125rem × 0.75 */
  }

  .details-location {
    font-size: 0.6rem !important;
    line-height: 1.3 !important;
  }

  /* Title - match host name text size */
  h2 {
    font-size: 0.7rem !important; /* 11.2px - match HostInfoWedding host name text */
    line-height: 1.25rem !important; /* tight leading */
  }

  /* Description text - slightly larger than host title text */
  p,
  p.text-sm,
  p.sm\:text-base {
    font-size: 0.6rem !important; /* 9.6px - slightly larger than host title (0.55rem) */
    line-height: 1.125rem !important; /* normal leading */
  }

  /* Details text inside card (date, time, location) - match description text size */
  .text-sm {
    font-size: 0.6rem !important; /* 9.6px - match description text size */
    line-height: 1.125rem !important; /* match description line-height */
  }

  /* Override leading-snug for date and location text */
  .leading-snug {
    line-height: 1.125rem !important; /* match description line-height */
  }

  /* Countdown header text - match description text size */
  .countdown-header {
    font-size: 0.6rem !important; /* 9.6px - match description text size */
  }

  /* Spacing — ~65% of desktop base */
  .space-y-6 > * + * {
    margin-top: 1rem !important;
  }

  .space-y-8 > * + * {
    margin-top: 1rem !important;
  }

  .space-y-4 > * + * {
    margin-top: 0.65rem !important;
  }

  .space-y-3 > * + * {
    margin-top: 0.5rem !important;
  }

  .space-y-2 > * + * {
    margin-top: 0.325rem !important;
  }

  /* Card inner padding */
  .px-4 {
    padding-left: 0.65rem !important;
    padding-right: 0.65rem !important;
  }

  .pt-3 {
    padding-top: 0.5rem !important;
  }

  .pb-4 {
    padding-bottom: 0.65rem !important;
  }

  /* Map top padding inside card */
  .pt-2 {
    padding-top: 0.325rem !important;
  }

  .pt-4 {
    padding-top: 0.65rem !important;
  }

  .pb-2 {
    padding-bottom: 0.325rem !important;
  }

  /* Card shell */
  .gradient-stroke-container {
    border-radius: 1.3rem !important;
    padding: 1.5px !important;
  }

  .gradient-stroke-container > div {
    border-radius: calc(1.3rem - 1.5px) !important;
  }

  /* Map container */
  .aspect-video {
    aspect-ratio: 16 / 9;
    border-radius: 0.5rem !important;
  }

  .space-y-1 > * + * {
    margin-top: 0 !important;
  }

  /* Date/location card */
  .event-details-card {
    padding: 0.65rem 0.8rem !important;
  }

  /* Calendar design — scaled to match the compact laptop layout */
  .calendar-card {
    max-width: 320px !important;
    padding: 0.65rem 0.8rem !important;
  }

  .calendar-heading {
    font-size: 1rem !important;
    margin-bottom: 0.5rem !important;
  }

  .calendar-weekday {
    font-size: 0.5rem !important;
    padding-bottom: 0.2rem !important;
  }

  .calendar-day {
    font-size: 0.65rem !important;
  }

  .map-location-header {
    font-size: 0.6rem !important;
  }

  /* Countdown spacing */
  .countdown-container {
    padding-top: 0.325rem !important;
    padding-bottom: 0.325rem !important;
  }

  .countdown-wrapper {
    gap: 0.1rem !important;
  }

  .countdown-unit {
    gap: -0.35rem !important;
  }

  .countdown-separator {
    margin-bottom: 0.65rem !important;
  }

  .countdown-divider {
    padding-bottom: 0.5rem !important;
  }
}

/* Medium laptops 14-15 inch (1366px+) */
@media (min-width: 1366px) {
  .countdown-number {
    font-size: clamp(3.15rem, 13.5vw, 7.2rem);
  }

  .countdown-separator {
    font-size: clamp(3.15rem, 13.5vw, 7.2rem);
    margin-bottom: 0.7rem !important;
  }

  .countdown-unit-label {
    font-size: 0.75rem !important; /* Reduced from 0.875rem */
  }

  .countdown-header {
    font-size: 0.875rem !important; /* Reduced from 1rem */
  }

  .countdown-wrapper {
    gap: 0.15rem !important; /* Reduced spacing between header and numbers */
  }

  .countdown-unit {
    gap: -0.3rem !important; /* Bring label even closer to number */
  }

  /* Date column — 1/4 width, medium size */
  .event-details-card.has-date-column {
    grid-template-columns: minmax(0, 1fr) 1px minmax(0, 3fr) !important;
  }

  .date-column {
    min-width: 0 !important;
  }

  .date-weekday,
  .date-month {
    font-size: 0.65rem !important;
    letter-spacing: 0.06em;
  }

  .date-day {
    font-size: 2rem !important;
  }

  .details-location {
    font-size: 0.875rem !important;
    line-height: 1.35 !important;
  }

  /* Calendar design — medium laptop sizing */
  .calendar-card {
    max-width: 380px !important;
    padding: 0.8rem 1rem !important;
  }

  .calendar-heading {
    font-size: 1.25rem !important;
    margin-bottom: 0.65rem !important;
  }

  .calendar-weekday {
    font-size: 0.625rem !important;
  }

  .calendar-day {
    font-size: 0.8rem !important;
  }

  .map-location-header {
    font-size: 0.8rem !important;
  }

  /* Map border radius and spacing */
  .aspect-video {
    border-radius: 0.625rem !important;
  }

  .space-y-3 > * + * {
    margin-top: 0.6rem !important;
  }

  .space-y-1 > * + * {
    margin-top: 0 !important;
  }

  /* Card shell border radius */
  .gradient-stroke-container {
    border-radius: 1.1rem !important;
    padding: 1.5px !important;
  }

  .gradient-stroke-container > div {
    border-radius: calc(1.1rem - 1.5px) !important;
  }

  /* Card inner padding */
  .px-4 {
    padding-left: 0.75rem !important;
    padding-right: 0.75rem !important;
  }

  .pt-3 {
    padding-top: 0.5rem !important;
  }

  .pb-4 {
    padding-bottom: 0.75rem !important;
  }

  .pt-2 {
    padding-top: 0.35rem !important;
  }

  .pb-2 {
    padding-bottom: 0.35rem !important;
  }

  h2 {
    font-size: 1rem !important; /* Restore original size for medium laptops */
  }

  p,
  p.text-sm,
  p.sm\:text-base {
    font-size: 0.875rem !important; /* Restore original size for medium laptops */
  }

  .text-sm {
    font-size: 0.875rem !important; /* Reduced from 1rem */
  }
}

/* Large laptops 16+ inch (1536px+) */
@media (min-width: 1536px) {
  .countdown-number {
    font-size: clamp(3.15rem, 13.5vw, 7.2rem);
  }

  .countdown-separator {
    font-size: clamp(3.15rem, 13.5vw, 7.2rem);
    margin-bottom: 0.75rem !important;
  }

  .countdown-unit-label {
    font-size: 0.875rem !important; /* Reduced from 1rem */
  }

  .countdown-header {
    font-size: 1rem !important; /* Reduced from 1.125rem */
  }

  .countdown-wrapper {
    gap: 0.2rem !important; /* Reduced spacing between header and numbers */
  }

  .countdown-unit {
    gap: -0.25rem !important; /* Bring label even closer to number */
  }

  /* Date column — 1/4 width, large size */
  .event-details-card.has-date-column {
    grid-template-columns: minmax(0, 1fr) 1px minmax(0, 3fr) !important;
  }

  .date-column {
    min-width: 0 !important;
  }

  .date-weekday,
  .date-month {
    font-size: 0.75rem !important;
    letter-spacing: 0.08em;
  }

  .date-day {
    font-size: 2.375rem !important;
  }

  .details-location {
    font-size: 0.9rem !important;
    line-height: 1.35 !important;
  }

  /* Calendar design — large laptop sizing */
  .calendar-card {
    max-width: 420px !important;
    padding: 1rem 1.25rem !important;
  }

  .calendar-heading {
    font-size: 1.4rem !important;
    margin-bottom: 0.75rem !important;
  }

  .calendar-weekday {
    font-size: 0.7rem !important;
  }

  .calendar-day {
    font-size: 0.9rem !important;
  }

  .map-location-header {
    font-size: 0.9rem !important;
  }

  /* Map border radius and spacing */
  .aspect-video {
    border-radius: 0.75rem !important;
  }

  .space-y-3 > * + * {
    margin-top: 0.65rem !important;
  }

  .space-y-1 > * + * {
    margin-top: 0 !important;
  }

  /* Card shell border radius */
  .gradient-stroke-container {
    border-radius: 1.3rem !important;
    padding: 1.5px !important;
  }

  .gradient-stroke-container > div {
    border-radius: calc(1.3rem - 1.5px) !important;
  }

  /* Card inner padding */
  .px-4 {
    padding-left: 0.875rem !important;
    padding-right: 0.875rem !important;
  }

  .pt-3 {
    padding-top: 0.6rem !important;
  }

  .pb-4 {
    padding-bottom: 0.875rem !important;
  }

  .pt-2 {
    padding-top: 0.4rem !important;
  }

  .pb-2 {
    padding-bottom: 0.4rem !important;
  }

  h2 {
    font-size: 1.25rem !important; /* Restore original size for large laptops/desktop */
  }

  p,
  p.text-sm,
  p.sm\:text-base {
    font-size: 0.875rem !important; /* Restore original size for large laptops/desktop */
  }

  .text-sm {
    font-size: 0.875rem !important; /* Reduced from 1rem */
  }
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .bounce-word,
  .bounce-in-element {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .calendar-day,
  .animate-active .calendar-day,
  .animate-active .calendar-day-ring {
    animation: none;
    opacity: 1;
  }

  .calendar-weekday,
  .animate-active .calendar-weekday {
    animation: none;
    opacity: 0.85;
  }

  /* Show the heart fully drawn and the day number already tinted. */
  .calendar-day-ring path,
  .animate-active .calendar-day-ring path {
    animation: none;
    stroke-dashoffset: 0;
  }

  .animate-active .calendar-day.is-event .calendar-day-num {
    animation: none;
    color: var(--calendar-marker-color, #b3261e);
  }
}

/* Manage-preview only (never rendered on the public showcase — gated on the
   injected edit-intent context). */
.add-map-placeholder {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px dashed rgba(255, 255, 255, 0.55);
  border-radius: 1rem;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.875rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.add-map-placeholder:hover {
  border-color: rgba(30, 144, 255, 0.8);
  background: rgba(30, 144, 255, 0.12);
}
</style>
