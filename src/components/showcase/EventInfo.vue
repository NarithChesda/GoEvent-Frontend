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
      v-if="activeDesign === 'panel' && (hasDateParts || locationText)"
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

    <!-- ==========================================================
         Flanked design — engraved-invitation typography. The date is one
         baseline: weekday | day numeral | month, split by two vertical
         hairlines that draw themselves open from their centre, with year + time
         under it. No card frame at all, which is what separates it from the
         panel design: this block is meant to read as set type on the
         background, not as a card on it. The venue is not set here — it goes to
         the map card's header (see locationInMapCard).
         ========================================================== -->
    <div
      v-if="activeDesign === 'flanked'"
      class="details-design flanked-card bounce-in-element"
      :class="{ 'details-kh': currentLanguage === 'kh' }"
      :style="{
        color: primaryColor,
        animationDelay: `${animationDelays.date}s`,
        '--details-marker-color': detailsMarkerColor,
      }"
    >
      <EditableRegion :intent="{ kind: 'eventDate' }" class="flanked-region">
        <div :class="['flanked-row', currentLanguage === 'kh' && 'khmer-text-fix']">
          <div
            class="flanked-side details-line"
            :style="{ fontFamily: secondaryFont || currentFont, animationDelay: detailsTextDelay(0) }"
          >{{ dateParts.weekday }}</div>
          <span
            class="flanked-rule"
            aria-hidden="true"
            :style="{ animationDelay: `${detailsTiming.draw}s` }"
          ></span>
          <div
            class="flanked-day details-line"
            :style="{ fontFamily: primaryFont || currentFont, animationDelay: detailsTextDelay(1) }"
          >{{ dateParts.day }}</div>
          <span
            class="flanked-rule"
            aria-hidden="true"
            :style="{ animationDelay: `${detailsTiming.draw}s` }"
          ></span>
          <div
            class="flanked-side details-line"
            :style="{ fontFamily: secondaryFont || currentFont, animationDelay: detailsTextDelay(2) }"
          >{{ dateParts.month }}</div>
        </div>
      </EditableRegion>

      <div
        v-if="dateYear || timeText"
        :class="['flanked-meta details-line', currentLanguage === 'kh' && 'khmer-text-fix']"
        :style="{ fontFamily: secondaryFont || currentFont, animationDelay: detailsTextDelay(3) }"
      >
        <span v-if="dateYear">{{ dateYear }}</span>
        <span v-if="dateYear && timeText" class="details-dot" aria-hidden="true"></span>
        <span v-if="timeText">{{ timeText }}</span>
      </div>

    </div>

    <!-- ==========================================================
         Arch design — the date set inside a hairline arch whose outline draws
         itself on reveal, same pathLength/dashoffset technique as the
         calendar's heart so the two designs share a motion language. The arch
         is a fixed-aspect box so the SVG scales uniformly and the stroke stays
         an even hairline (deliberately no vector-effect: non-scaling-stroke —
         it has a Chromium dash-normalization bug that breaks pathLength draws).
         The type is sized to fill the arch rather than sit in it — an outline
         this large reads as hollow the moment the date does not carry it. Venue
         goes to the map card's header (see locationInMapCard).
         ========================================================== -->
    <div
      v-else-if="activeDesign === 'arch'"
      class="details-design arch-card bounce-in-element"
      :class="{ 'details-kh': currentLanguage === 'kh' }"
      :style="{
        color: primaryColor,
        animationDelay: `${animationDelays.date}s`,
        '--details-marker-color': detailsMarkerColor,
      }"
    >
      <div class="arch-frame">
        <!-- The outline is three pieces, not one path, so the arch can grow with
             its own content. The dome keeps a fixed aspect (uniform stroke); the
             legs stretch to whatever height the date needs. They still draw as
             one continuous stroke — left leg up, over the dome, right leg down. -->
        <div class="arch-shell" aria-hidden="true">
          <svg class="arch-dome" viewBox="0 0 200 106">
            <path
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              pathLength="100"
              d="M3 103 A97 97 0 0 1 197 103"
              :style="{ animationDelay: `${detailsTiming.draw + 0.25}s` }"
            />
          </svg>
          <!-- preserveAspectRatio="none" is deliberate: a vertical stroke's
               width follows the horizontal scale only, so these stay exactly as
               thick as the dome's stroke however far they stretch. -->
          <svg class="arch-legs" viewBox="0 0 200 10" preserveAspectRatio="none">
            <path
              class="arch-leg-left"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              pathLength="100"
              d="M3 10 L3 0"
              :style="{ animationDelay: `${detailsTiming.draw}s` }"
            />
            <path
              class="arch-leg-right"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              pathLength="100"
              d="M197 0 L197 10"
              :style="{ animationDelay: `${detailsTiming.draw + 0.85}s` }"
            />
          </svg>
        </div>

        <EditableRegion :intent="{ kind: 'eventDate' }" class="arch-region">
          <div
            :class="['arch-weekday details-line', currentLanguage === 'kh' && 'khmer-text-fix']"
            :style="{ fontFamily: secondaryFont || currentFont, animationDelay: detailsTextDelay(0) }"
          >{{ dateParts.weekday }}</div>
          <div
            class="arch-day details-line"
            :style="{ fontFamily: primaryFont || currentFont, animationDelay: detailsTextDelay(1) }"
          >{{ dateParts.day }}</div>
          <div
            :class="['arch-month details-line', currentLanguage === 'kh' && 'khmer-text-fix']"
            :style="{ fontFamily: secondaryFont || currentFont, animationDelay: detailsTextDelay(2) }"
          >{{ dateParts.month }}</div>
          <span
            v-if="dateYear || timeText"
            class="arch-hairline"
            aria-hidden="true"
            :style="{ animationDelay: detailsTextDelay(3) }"
          ></span>
          <div
            v-if="dateYear || timeText"
            :class="['arch-meta details-line', currentLanguage === 'kh' && 'khmer-text-fix']"
            :style="{ fontFamily: secondaryFont || currentFont, animationDelay: detailsTextDelay(4) }"
          >
            <span v-if="dateYear">{{ dateYear }}</span>
            <span v-if="dateYear && timeText" class="details-dot" aria-hidden="true"></span>
            <span v-if="timeText">{{ timeText }}</span>
          </div>
        </EditableRegion>
      </div>

    </div>

    <!-- ==========================================================
         Ticket design — an admit-one stub for parties and birthdays. Fixed
         5.4em date stub, a dashed perforation that tears downward on reveal,
         and the venue on the wide half. The two notches are a real die-cut (a
         radial-gradient mask that cuts the border too), positioned on the
         perforation's own x because the stub width is fixed; browsers without
         mask-composite just get a plain rounded ticket.
         ========================================================== -->
    <div
      v-else-if="activeDesign === 'ticket'"
      class="details-design ticket-card bounce-in-element"
      :class="{ 'details-kh': currentLanguage === 'kh' }"
      :style="{
        color: primaryColor,
        animationDelay: `${animationDelays.date}s`,
        '--details-marker-color': detailsMarkerColor,
      }"
    >
      <div class="ticket-stub">
        <EditableRegion :intent="{ kind: 'eventDate' }" class="ticket-stub-region">
          <div
            :class="['ticket-month details-line', currentLanguage === 'kh' && 'khmer-text-fix']"
            :style="{ fontFamily: secondaryFont || currentFont, animationDelay: detailsTextDelay(0) }"
          >{{ monthShort }}</div>
          <div
            class="ticket-day details-line"
            :style="{ fontFamily: primaryFont || currentFont, animationDelay: detailsTextDelay(1) }"
          >{{ dateParts.day }}</div>
          <div
            v-if="dateYear"
            class="ticket-year details-line"
            :style="{ fontFamily: secondaryFont || currentFont, animationDelay: detailsTextDelay(2) }"
          >{{ dateYear }}</div>
        </EditableRegion>
      </div>

      <span
        class="ticket-perforation"
        aria-hidden="true"
        :style="{ animationDelay: `${detailsTiming.draw}s` }"
      ></span>

      <div class="ticket-body">
        <div
          v-if="dateParts.weekday || timeText"
          :class="['ticket-meta details-line', currentLanguage === 'kh' && 'khmer-text-fix']"
          :style="{ fontFamily: secondaryFont || currentFont, animationDelay: detailsTextDelay(2) }"
        >
          <span v-if="dateParts.weekday">{{ dateParts.weekday }}</span>
          <span v-if="dateParts.weekday && timeText" class="details-dot" aria-hidden="true"></span>
          <span v-if="timeText">{{ timeText }}</span>
        </div>
        <InlineEditableText
          v-if="locationText"
          :value="locationText"
          :target="{ kind: 'eventText', textType: 'location_text', field: 'content' }"
          :multiline="true"
          :input-style="{ fontFamily: secondaryFont || currentFont, color: primaryColor }"
        >
          <div
            :class="['ticket-location details-line', currentLanguage === 'kh' && 'khmer-text-fix']"
            :style="{ fontFamily: secondaryFont || currentFont, animationDelay: detailsTextDelay(3) }"
          >{{ locationText }}</div>
        </InlineEditableText>
      </div>
    </div>

    <!-- Calendar design: a full month grid with the event day circled. Driven
         by template_assets.event_details_design.type === 'calendar' (see
         activeDesign, which handles the no-start-date fallback to panel).
         Location renders inside the map card header below. -->
    <div
      v-if="isCalendarDesign"
      class="calendar-card bounce-in-element"
      :style="{
        color: primaryColor,
        animationDelay: `${animationDelays.date}s`,
        '--details-marker-color': detailsMarkerColor,
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
          <!-- Location header for every design that delegates its venue here
               (calendar, flanked, arch — see locationInMapCard): centered above
               the map frame, replacing the panel design's location card. -->
          <InlineEditableText
            v-if="locationInMapCard && locationText"
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
  detailsDesign?: 'panel' | 'calendar' | 'flanked' | 'arch' | 'ticket'
  /**
   * Colour slot the design's accent mark draws from — the calendar's heart ring
   * + day-number tint, the flanked rules, the arch outline, the ticket
   * perforation + stub numeral. Defaults to 'accent' so it tracks the palette.
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

// Active design. Every design except 'panel' is built around the event's own
// date, so any of them falls back to 'panel' when start_date is missing or
// unparseable — panel is the only one that degrades to location-only.
const activeDesign = computed(() =>
  props.detailsDesign !== 'panel' && !hasDateParts.value ? 'panel' : props.detailsDesign,
)

const isCalendarDesign = computed(() => activeDesign.value === 'calendar')

// Designs that hand the venue off to the map card's own header instead of
// setting it themselves. The calendar started this; flanked and arch follow,
// because all three are date *medallions* — a venue line hung underneath reads
// as an orphaned caption rather than part of the mark. Panel sets it in its own
// right-hand column, and the ticket keeps it because there the venue is half
// the object, not a footnote to it.
const locationInMapCard = computed(
  () =>
    activeDesign.value === 'calendar' ||
    activeDesign.value === 'flanked' ||
    activeDesign.value === 'arch',
)

// Localized 4-digit year (Khmer numerals for 'kh'), used by the designs that
// spell the date out in full rather than showing a month grid.
const dateYear = computed<string>(() => {
  if (!props.eventStartDate) return ''
  const d = new Date(props.eventStartDate)
  if (Number.isNaN(d.getTime())) return ''
  return (props.currentLanguage ?? 'en') === 'kh'
    ? toKhmerNumerals(d.getFullYear())
    : String(d.getFullYear())
})

// Abbreviated month for the ticket stub, where the column is only ~5em wide.
// Khmer has no conventional 3-letter month abbreviation, so 'kh' keeps the full
// name (KHMER_MONTHS entries are short enough to fit).
const monthShort = computed<string>(() => {
  if (!props.eventStartDate) return ''
  const d = new Date(props.eventStartDate)
  if (Number.isNaN(d.getTime())) return ''
  const lang = props.currentLanguage ?? 'en'
  if (lang === 'kh') return KHMER_MONTHS[d.getMonth()]
  const localeMap: Record<string, string> = {
    en: 'en-US',
    'zh-cn': 'zh-CN',
    fr: 'fr-FR',
    ja: 'ja-JP',
    ko: 'ko-KR',
    th: 'th-TH',
    vn: 'vi-VN',
  }
  try {
    return new Intl.DateTimeFormat(localeMap[lang] ?? lang ?? 'en-US', {
      month: 'short',
    }).format(d)
  } catch {
    return dateParts.value.month
  }
})

/** Used only when the chosen colour slot resolves to nothing (custom source
 *  with no hex yet). Matches the original hand-drawn-heart red. */
const MARKER_FALLBACK = '#b3261e'

// Colour of the calendar's event-day marker — the heart ring drawn around the
// date and the matching tint applied to the day number once it finishes drawing.
// Template-driven so it can sit on any background instead of always being red.
const detailsMarkerColor = computed(() => {
  switch (props.detailsMarkerColorSource) {
    case 'custom':
      return props.detailsMarkerCustomColor || MARKER_FALLBACK
    case 'primary':
      return props.primaryColor || MARKER_FALLBACK
    case 'secondary':
      return props.secondaryColor || props.primaryColor || MARKER_FALLBACK
    case 'accent':
    default:
      return props.accentColor || props.primaryColor || MARKER_FALLBACK
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

// Reveal timeline shared by the flanked / arch / ticket designs. All three land
// with the card's own bounce-in, then draw their one structural line (the pair
// of rules, the arch outline, the perforation) while the text settles in behind
// it — so the line reads as the thing being drawn, not as decoration arriving late.
const detailsTiming = computed(() => {
  const cardIn = animationDelays.value.date
  return {
    /** Structural stroke starts just after the card finishes its 0.5s bounce-in. */
    draw: cardIn + 0.28,
    /** First text line; each subsequent one adds `step`. */
    textBase: cardIn + 0.34,
    step: 0.055,
  }
})

/** Per-line reveal delay for the flanked / arch / ticket text stacks. */
const detailsTextDelay = (index: number): string =>
  `${detailsTiming.value.textBase + index * detailsTiming.value.step}s`

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

   Colour comes from --details-marker-color, resolved from the template's
   marker colour slot on .calendar-card; the red is only a last-resort default. */
.calendar-day-ring {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 150%;
  height: 150%;
  transform: translate(-50%, -50%) rotate(-5deg);
  pointer-events: none;
  color: var(--details-marker-color, #b3261e);
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
    color: var(--details-marker-color, #b3261e);
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

/* ============================================================
   Flanked / arch / ticket designs.

   Unlike the panel and calendar designs above — which re-declare a font-size
   for every element in each of six breakpoint blocks — these three size
   everything in `em` off one root font-size, so a breakpoint only has to move
   two numbers: --dd-scale (type) and --dd-max (measure). The ladder at the
   bottom of this section is the whole responsive story for all three.

   --details-marker-color is the template's accent-mark slot (shared with the
   calendar's heart). Each design spends it on exactly one thing: the flanked
   rules, the arch outline, the ticket perforation + stub numeral. The day
   numeral itself stays primaryColor in every design — it is already four times
   the size of everything around it and does not need colour to lead as well.
   ============================================================ */
.details-design {
  --dd-scale: 1;
  --dd-max: 420px;
  container-type: inline-size;
  width: 100%;
  max-width: var(--dd-max);
  margin: 0 auto;
  box-sizing: border-box;
  font-size: calc(1rem * var(--dd-scale));
  text-align: center;
}

/* Per-line settle, staggered from detailsTextDelay(). The parent card is still
   running its own bounce-in underneath; these ride on top of it so the block
   lands as one object and then resolves into type. */
.details-line {
  opacity: 0;
}

.animate-active .details-line {
  animation: detailsLineIn 0.45s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

@keyframes detailsLineIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Muted text is mixed toward transparent rather than dimmed with opacity —
   opacity would cascade into children and fight .details-line's own fade. */
.details-dot::before {
  content: '·';
  padding: 0 0.5em;
  color: color-mix(in srgb, currentColor 55%, transparent);
}

/* ---------- Flanked ---------- */
.flanked-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Editable-preview-only wrapper (bare slot in production, see EditableRegion) —
   must not change how .flanked-row measures itself. */
.flanked-region {
  display: block;
  width: 100%;
}

/* Equal 1fr side tracks and equal gaps put the day numeral dead centre no
   matter how much longer one label is than the other — a centred flex row
   centres the whole group instead, which throws the numeral off-axis the moment
   the weekday outruns the month (very visible in Khmer: ព្រហស្បតិ៍ vs សីហា).
   The labels then align inward, toward the rules, so the composition reads from
   the centre out and only the outer edges go ragged. */
.flanked-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 1px minmax(0, auto) 1px minmax(0, 1fr);
  align-items: center;
  gap: 0 0.95em;
  width: 100%;
}

.flanked-side:first-child {
  text-align: end;
}

.flanked-side:last-child {
  text-align: start;
}

.flanked-side {
  font-size: 0.7em;
  /* Weekday and month names are single unbreakable words — shrink them rather
     than let a narrow block break them a letter per line. */
  font-size: clamp(0.5em, 3.4cqi, 0.7em);
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  line-height: 1.25;
  min-width: 0;
}

.flanked-day {
  font-size: 2.6em;
  font-size: clamp(1.5em, 12.6cqi, 2.6em);
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

/* The two rules open from their centre — a draw, not an appearance. clip-path
   keeps the element's box (and therefore the grid track) fixed the whole time,
   which scaleY would not. */
.flanked-rule {
  width: 1px;
  height: 2.4em;
  align-self: center;
  background: color-mix(in srgb, var(--details-marker-color, currentColor) 75%, transparent);
  clip-path: inset(50% 0 50% 0);
}

.animate-active .flanked-rule {
  animation: ruleOpen 0.55s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

@keyframes ruleOpen {
  to {
    clip-path: inset(0 0 0 0);
  }
}

.flanked-meta {
  margin-top: 0.35em;
  font-size: 0.68em;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  line-height: 1.4;
  color: color-mix(in srgb, currentColor 78%, transparent);
}

@keyframes dividerOpen {
  to {
    clip-path: inset(0 0 0 0);
  }
}

/* ---------- Arch ---------- */
.arch-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Height follows the content, which is the whole point of the split outline: a
   fixed aspect-ratio box has to serve both a 7.2em English stack and a 9.9em
   Khmer one, so one of them always ends up crowded into the dome while the other
   floats above the base. Here the padding sets where the type meets the curve
   and how much base it sits on, and both languages get the same two numbers.

   padding-top is in em against a frame that is 15em wide, so it lands at the
   same point on the dome's curve (viewBox y ≈ 49) at every rung. */
.arch-frame {
  position: relative;
  container-type: inline-size;
  width: 15em;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3.7em 1.25em 1.15em;
  box-sizing: border-box;
  /* Floor so a short date still sits on visible legs rather than a bare dome. */
  min-height: 10.5em;
}

/* Dome + legs stacked; inset:0 makes them track the frame's content height. */
.arch-shell {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  color: var(--details-marker-color, currentColor);
}

.arch-dome {
  flex: none;
  width: 100%;
  aspect-ratio: 200 / 106;
  overflow: visible;
}

.arch-legs {
  flex: 1;
  width: 100%;
  min-height: 0;
  /* The arc bottoms out at y=103 of a 106-tall viewBox — 1.5% of the frame's
     width above the dome's lower edge. Percentage margins resolve against width,
     which is exactly the axis this offset belongs to. */
  margin-top: -1.5%;
  overflow: visible;
}

.arch-region {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* Same pathLength="100" dashoffset trick as the calendar's heart, now across
   three paths whose delays chain them into one stroke: left leg (0.25s) → dome
   (0.6s) → right leg (0.25s). pathLength normalises each path to 100 units, so
   the legs draw at the right fraction however tall they have stretched.

   linear, not the usual ease-out: three eased segments butted together read as
   three separate marks. A steady pen is what sells it as one. */
.arch-dome path,
.arch-legs path {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
}

.animate-active .arch-legs path {
  animation: archDraw 0.25s linear forwards;
}

.animate-active .arch-dome path {
  animation: archDraw 0.6s linear forwards;
}

@keyframes archDraw {
  to {
    stroke-dashoffset: 0;
  }
}

.arch-weekday,
.arch-month {
  font-size: 0.74em;
  font-size: clamp(0.52em, 5cqi, 0.74em);
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  line-height: 1.3;
  max-width: 100%;
}

.arch-day {
  font-size: 3.5em;
  font-size: clamp(2.1em, 26cqi, 3.5em);
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.01em;
}

.arch-hairline {
  width: 2.6em;
  height: 1px;
  margin: 0.5em 0 0.36em;
  background: color-mix(in srgb, var(--details-marker-color, currentColor) 70%, transparent);
  clip-path: inset(0 50% 0 50%);
}

.animate-active .arch-hairline {
  animation: dividerOpen 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

.arch-meta {
  font-size: 0.66em;
  font-size: clamp(0.47em, 4.5cqi, 0.66em);
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  line-height: 1.4;
  color: color-mix(in srgb, currentColor 78%, transparent);
}

/* ---------- Ticket ---------- */
.ticket-card {
  --stub-w: 5.4em;
  --notch: 0.5em;
  display: grid;
  grid-template-columns: var(--stub-w) 1px minmax(0, 1fr);
  align-items: stretch;
  max-width: min(var(--dd-max), 24em);
  border: 1px solid color-mix(in srgb, currentColor 55%, transparent);
  border-radius: 0.85em;
  padding: 0.9em 0;
}

/* Real die-cut notches: the mask removes the border along the curve too, which
   is what sells it against a photographic background. Wrapped in @supports
   because without mask-composite the two gradients would union back to a
   full-coverage mask — harmless, but then there is no reason to pay for it. */
@supports (mask-composite: intersect) or (-webkit-mask-composite: source-in) {
  .ticket-card {
    -webkit-mask-image: radial-gradient(circle var(--notch) at var(--stub-w) 0, transparent 97%, #000 100%),
      radial-gradient(circle var(--notch) at var(--stub-w) 100%, transparent 97%, #000 100%);
    mask-image: radial-gradient(circle var(--notch) at var(--stub-w) 0, transparent 97%, #000 100%),
      radial-gradient(circle var(--notch) at var(--stub-w) 100%, transparent 97%, #000 100%);
    -webkit-mask-composite: source-in;
    mask-composite: intersect;
  }
}

.ticket-stub {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 0.5em;
  min-width: 0;
}

.ticket-stub-region {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ticket-month {
  font-size: 0.66em;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  line-height: 1.2;
}

.ticket-day {
  font-size: 2.35em;
  font-weight: 500;
  line-height: 1.05;
  color: var(--details-marker-color, currentColor);
}

.ticket-year {
  font-size: 0.62em;
  font-weight: 500;
  letter-spacing: 0.14em;
  line-height: 1.2;
  color: color-mix(in srgb, currentColor 70%, transparent);
}

/* Tears downward on reveal rather than fading in — a perforation is made, not
   placed. Dashes come from a repeating gradient so the dash rhythm scales with
   the type instead of being frozen at the browser's border-dash size. */
.ticket-perforation {
  align-self: stretch;
  width: 1px;
  background-image: repeating-linear-gradient(
    to bottom,
    var(--details-marker-color, currentColor) 0 0.28em,
    transparent 0.28em 0.6em
  );
  opacity: 0.75;
  clip-path: inset(0 0 100% 0);
}

.animate-active .ticket-perforation {
  animation: perforationTear 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

@keyframes perforationTear {
  to {
    clip-path: inset(0 0 0 0);
  }
}

.ticket-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3em;
  padding: 0 1em;
  min-width: 0;
  text-align: center;
}

.ticket-meta {
  font-size: 0.64em;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  line-height: 1.35;
  color: color-mix(in srgb, currentColor 80%, transparent);
}

.ticket-location {
  font-size: 0.8em;
  line-height: 1.45;
  white-space: pre-line;
  word-break: break-word;
}

/* Khmer sets on a taller em-box and khmer-text-fix forces line-height 1.8,
   which is fine for prose and far too loose for a stacked date. */
.details-design .khmer-text-fix.flanked-side,
.details-design .khmer-text-fix.arch-weekday,
.details-design .khmer-text-fix.arch-month,
.details-design .khmer-text-fix.ticket-month {
  line-height: 1.35 !important;
  letter-spacing: 0.04em;
  text-transform: none;
}

.details-design .khmer-text-fix.flanked-meta,
.details-design .khmer-text-fix.arch-meta,
.details-design .khmer-text-fix.ticket-meta {
  line-height: 1.5 !important;
  letter-spacing: 0.04em;
  text-transform: none;
}

/* Khmer needs clearance between the weekday and the day numeral: the weekday's
   COENG subscripts hang below its line box, and the numeral sits at
   line-height: 1 with no room above it. The clearance is one-sided on purpose —
   the month below already sat correctly, and adding leading instead would split
   the space evenly and open a hole under the numeral.

   Sized in the numeral's own em, so it tracks the type at every rung rather
   than the weekday's em, which is a quarter the size and gives far too little.

   Keyed off .details-kh, not .khmer-text-fix: the numerals never carry that class
   (it forces line-height 1.8 !important plus its own padding, which is right for
   prose and wrong for a stacked date), so the selector this replaced —
   `.arch-card .khmer-text-fix.arch-day` and its ticket twin — required both
   classes on one element and silently never matched. */
.details-design.details-kh .arch-day,
.details-design.details-kh .ticket-day {
  margin-top: 0.12em;
}

/* Khmer only, arch only: close the gap under the day numeral. khmer-text-fix
   gives every element it touches padding-top: 0.3em + margin-top: 0.2em to keep
   diacritics off the line above — right for prose, but here it stacks on top of
   the month's own leading and pushes it away from the numeral it belongs to.

   Tuned against measured *ink* extents, not box edges — Khmer ink routinely sits
   outside its line box, so the boxes lie about what you actually see. The target
   is the gap under the numeral sitting a little tighter than the one above it
   (0.26 vs 0.27 of the numeral's own size), so the month reads as belonging to
   the number rather than floating under it.

   Must stay after `.details-design .khmer-text-fix.arch-month` above: same
   (0,3,0) specificity, so source order is what decides it. Nothing else moves —
   the weekday keeps its full khmer-text-fix spacing (that gap was the one that
   needed opening), and flanked, ticket, panel and calendar are untouched. */
.details-design.details-kh .arch-month {
  margin-top: -0.2em;
  padding-top: 0;
}

.details-design.details-kh .flanked-day {
  line-height: 1.2;
}

/* The whole responsive ladder for all three designs. --dd-scale tracks the
   panel design's own day-number sizes at each breakpoint (2.125 → 3.25 → 3.5 →
   1.6 → 2.0 → 2.375 rem) so a template that switches design does not jump size,
   and --dd-max tracks its max-width. */
@media (min-width: 640px) {
  .details-design {
    --dd-scale: 1.25;
    --dd-max: 460px;
  }
}

@media (min-width: 768px) {
  .details-design {
    --dd-scale: 1.3;
    --dd-max: 500px;
  }
}

@media (min-width: 1024px) and (max-width: 1365px) {
  .details-design {
    --dd-scale: 0.72;
    --dd-max: 320px;
  }
}

@media (min-width: 1366px) {
  .details-design {
    --dd-scale: 0.85;
    --dd-max: 380px;
  }
}

@media (min-width: 1536px) {
  .details-design {
    --dd-scale: 0.95;
    --dd-max: 420px;
  }
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
    color: var(--details-marker-color, #b3261e);
  }

  /* Flanked / arch / ticket: show every line settled and every rule already
     drawn. Reduced motion means fewer and gentler animations, not a broken
     layout — an undrawn clip-path or dashoffset would hide the element. */
  .details-line,
  .animate-active .details-line {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .flanked-rule,
  .animate-active .flanked-rule,
  .arch-hairline,
  .animate-active .arch-hairline,
  .ticket-perforation,
  .animate-active .ticket-perforation {
    animation: none;
    clip-path: none;
  }

  .arch-dome path,
  .animate-active .arch-dome path,
  .arch-legs path,
  .animate-active .arch-legs path {
    animation: none;
    stroke-dashoffset: 0;
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
