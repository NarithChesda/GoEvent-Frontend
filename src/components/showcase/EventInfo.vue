<template>
  <div
    ref="containerRef"
    :key="`event-info-${currentLanguage}`"
    class="text-center space-y-6 sm:space-y-8"
    :class="{
      'animate-active': isVisible,
      'is-engraved': isEngraved,
      'is-frosted': isFrosted,
      'is-khmer': currentLanguage === 'kh',
      'joins-date-mark': engravedJoinsDateMark,
    }"
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
      <!-- Three treatments of the same content. `glass` is the original: a
           2px-white-bordered, tinted, blurred panel with white type throughout.
           `engraved` throws the panel away and sets the block as ink on the
           page ground, bounded by the same hairline rules the calendar uses.
           `frosted` keeps a card but rebuilds it in the guestbook's and the
           gift page's material — one blurred sheet, ink type, fading seams —
           so all three sections on the scroll are the same glass. See the
           .engraved-sheet and .frosted-sheet blocks in <style>.

           The class and style for both layers are computed rather than written
           as nested ternaries here: three treatments × two layers is six
           branches, and the glass branch's Tailwind utility string has to stay
           *off* the other two (the breakpoint blocks below redefine .px-4 and
           friends with !important). -->
      <div
        class="block relative bounce-in-element"
        :class="infoShellClass"
        :style="infoShellStyle"
      >
        <div class="relative" :class="infoInnerClass" :style="infoInnerStyle">
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
            :class="{ 'engraved-map': isEngraved, 'frosted-map': isFrosted }"
            :style="{ animationDelay: `${animationDelays.map}s` }"
          >
            <EditableRegion :intent="{ kind: 'gmapEmbed' }">
              <!-- Engraved mounts the map as a plate: a hairline frame with a
                   thin margin inside it and a second, fainter hairline against
                   the image, which is how a photograph is set on printed
                   stationery. Glass keeps the soft rounded window. -->
              <div
                class="aspect-video overflow-hidden"
                :class="{ 'engraved-plate': isEngraved, 'frosted-plate': isFrosted }"
                :style="
                  isGlassCard
                    ? { border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '1rem' }
                    : {}
                "
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
            :class="{ 'has-display-toggle': editIntentCtx, 'engraved-band': isEngraved }"
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
                  ...(isGlassCard ? { color: 'white' } : {}),
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

                <!-- Separator. Glass and frosted set the two figures as one
                     clock, so both need a colon between them. Engraved sets
                     them as two captioned figures, each measured by its own
                     rule — there is nothing between them to separate, so
                     nothing is drawn there. This also retires the Khmer colon
                     baseline hack for that design, since no glyph sits between
                     the columns. (Frosted retires it differently: see
                     .is-frosted .countdown-separator.) -->
                <div
                  v-if="!isEngraved"
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

          <!-- Divider between Countdown and RSVP. Glass only: engraved's bands
               are separated by their own rhythm, and frosted draws the seam on
               the RSVP band itself (one rule for every boundary in the sheet,
               rather than a drawn line here and a hairline everywhere else). -->
          <div
            v-if="isGlassCard && countdown && isCountdownActive && (showCountdown || editIntentCtx) && (showRsvp || editIntentCtx)"
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
            :class="{ 'has-display-toggle': editIntentCtx, 'engraved-band': isEngraved }"
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
   * Treatment of the card below the date — venue, map, countdown and RSVP.
   * Defaults to 'glass' (the liquid-glass panel), so every existing template
   * renders unchanged. 'engraved' redraws the same content in the calendar's
   * hairline language: no panel, no white, ink on the page ground. 'frosted'
   * keeps the card but rebuilds it as one blurred sheet in the guestbook's and
   * the gift page's material, with ink type and fading hairline seams.
   */
  infoCardDesign?: 'glass' | 'engraved' | 'frosted'
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

// The info card's own treatment, independent of which date design sits above
// it. 'engraved' drops the glass panel and re-inks the whole block in
// primaryColor, which is what lets it read as the same sheet as the calendar /
// flanked / arch date marks rather than a second material stacked under them.
const isEngraved = computed(() => props.infoCardDesign === 'engraved')

// 'frosted' keeps the card — it is still a bounded object with a map and a form
// inside it — but rebuilds it out of the material the guestbook and the gift
// page settled on: one blurred layer, tinted with the template's own
// background, ink type, and seams that fade out at both ends. The original
// 'glass' is a heavier material than either of those sections, so a showcase
// that uses it shows the reader two different kinds of glass on one scroll.
const isFrosted = computed(() => props.infoCardDesign === 'frosted')

// The original panel. Named rather than derived at each use site so the three
// treatments read as one closed set wherever the template branches on them.
const isGlassCard = computed(() => !isEngraved.value && !isFrosted.value)

// The engraved card is one continuous sheet with the date mark above it, so the
// mark gives up its own closing rule and lets the card's opening rule serve as
// the single boundary between them. Only the designs that already draw
// top/bottom rules have one to give up.
const engravedJoinsDateMark = computed(
  () => isEngraved.value && (isCalendarDesign.value || activeDesign.value === 'panel'),
)

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
const countdownNumberFont = computed(() => {
  // Engraved and frosted both set the count in the template's own display face
  // — the same one the calendar heading uses. Rajdhani is a condensed UI face
  // chosen to fill the glass panel at 8rem; at the calmer size the other two
  // set the count in, it reads as a different document.
  if (isEngraved.value || isFrosted.value) return props.primaryFont || props.currentFont
  return props.currentLanguage === 'kh'
    ? props.primaryFont || props.currentFont
    : `'Rajdhani', sans-serif`
})

/* Off-white and near-black rather than pure — pure white on a saturated fill
   vibrates, and pure black reads as a hole punched in it. Same pair, and the
   same reasoning, as the host frames' label ink (frames/frameInk.ts). */
const PAPER_LIGHT = '#fdfaf4'
const PAPER_DARK = '#2a2118'
/* The label on the filled control is 0.72rem/600 — small text, so AA is 4.5:1. */
const PAPER_MIN_CONTRAST = 4.5

/** Force a template colour to `#rrggbb`, or null when it isn't a hex at all. */
const toHex6 = (color: string | null | undefined): string | null => {
  const value = (color ?? '').trim()
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase()
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value)
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase()
  return null
}

const relativeLuminance = (hex6: string): number => {
  const channel = (at: number) => {
    const s = parseInt(hex6.slice(at, at + 2), 16) / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

const contrastRatio = (a: string, b: string): number => {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * A colour that is readable *against* the template's ink — used for the text of
 * the one filled control each inked design allows (the RSVP submit / selected
 * option), which inverts to ink-on-paper. Engraved reads it as the paper its
 * type is printed on; frosted as the label on its one solid capsule.
 *
 * It cannot simply *be* the template's background. `useTemplateProcessor`
 * already substitutes the primary colour for any template that declares no
 * colour named `background`, so `backgroundColor` arrives here as the ink
 * itself far more often than not — and the submit button then paints primary
 * type on a primary fill and disappears. Keep the declared background only
 * while it stays readable against the ink; otherwise pick whichever of the two
 * papers contrasts better, the way InlineEditableText picks its backing plate.
 */
const paperOnInk = computed(() => {
  const ink = toHex6(props.primaryColor)
  if (!ink) {
    /* Unmeasurable ink (a named colour, an rgb()/hsl() string, an 8-digit
       hex). The declared background is only safe here if it is demonstrably
       a *different* colour from the ink — which is exactly what the
       substitution described above makes it not, most of the time. */
    const bg = (props.backgroundColor ?? '').trim()
    return bg && bg.toLowerCase() !== (props.primaryColor ?? '').trim().toLowerCase()
      ? bg
      : PAPER_LIGHT
  }

  const declared = toHex6(props.backgroundColor)
  if (declared && contrastRatio(declared, ink) >= PAPER_MIN_CONTRAST) return declared

  return contrastRatio(PAPER_LIGHT, ink) >= contrastRatio(PAPER_DARK, ink)
    ? PAPER_LIGHT
    : PAPER_DARK
})

/* ---------------------------------------------------------------------------
 * The info card's two layers, resolved once per design.
 *
 * The outer element carries the material (frame, fill, blur, shadow) and the
 * inner one carries the padding — an arrangement `glass` needs, because its
 * frame is a 2px gradient stroke drawn as padding on the outer box. The other
 * two designs have nothing between the layers, so they hand the outer element
 * everything and flatten the inner one to a plain flow container.
 *
 * Written as computeds rather than as ternaries in the template for one
 * concrete reason: the glass branch's inner class is a *Tailwind utility
 * string* (`px-4 pt-3 pb-4 …`), and the six breakpoint blocks at the bottom of
 * this file redefine those very utility names with `!important`. Any design
 * that borrows the string inherits ~500 lines of overrides written for a
 * different card, so the string has to stay on exactly one branch — which is
 * much easier to see here than inside a nested ternary.
 * ------------------------------------------------------------------------ */

const infoShellClass = computed(() => {
  if (isEngraved.value) return 'engraved-sheet'
  if (isFrosted.value) return 'frosted-sheet'
  return 'gradient-stroke-container'
})

const infoShellStyle = computed(() => {
  /* Filled rather than returned per branch: three object literals of different
     shapes widen to a union whose keys are all optional, and an optional key
     does not satisfy a style object's `string` index signature. */
  const style: Record<string, string> = {
    animationDelay: `${animationDelays.value.card}s`,
  }

  if (isEngraved.value) {
    style.color = props.primaryColor
    style['--engraved-ink'] = props.primaryColor
    style['--engraved-paper'] = paperOnInk.value
    style['--details-marker-color'] = detailsMarkerColor.value
    return style
  }

  if (isFrosted.value) {
    /* Three colours feed the whole sheet, the same three the guestbook and the
       gift page take: the ink every piece of copy is mixed from, the tone every
       surface and hairline is mixed from, and the paper for the one solid
       control. Binding them here is what keeps the stylesheet below free of
       inline colour. */
    style.color = props.primaryColor
    style['--fr-ink'] = props.primaryColor
    style['--fr-tone'] = props.backgroundColor || props.primaryColor
    style['--fr-paper'] = paperOnInk.value
    style['--details-marker-color'] = detailsMarkerColor.value
    return style
  }

  style.background = `${props.backgroundColor || props.primaryColor}60`
  style.padding = '2px'
  style.borderRadius = '2rem'
  return style
})

const infoInnerClass = computed(() => {
  if (isEngraved.value) return 'engraved-inner'
  if (isFrosted.value) return 'frosted-inner'
  return 'px-4 pt-3 pb-4 backdrop-blur-sm space-y-1'
})

const infoInnerStyle = computed(() => {
  const style: Record<string, string> = {}
  if (!isGlassCard.value) return style

  style.borderRadius = 'calc(2rem - 2px)'
  style.border = '2px solid white'
  style.background = `${props.backgroundColor || props.primaryColor}60`
  return style
})
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
  font-size: 0.84em;
  /* Weekday and month names are single unbreakable words — shrink them rather
     than let a narrow block break them a letter per line. The cqi coefficient is
     not the 20% bump the rest of this design got: at phone widths the longest
     English pair (WEDNESDAY / SEPTEMBER) already fills its 1fr track, so the
     labels are width-bound there and only the em max — which wins from the
     laptop rung up — carries the increase. */
  font-size: clamp(0.6em, 3.5cqi, 0.84em);
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  line-height: 1.25;
  min-width: 0;
}

.flanked-day {
  font-size: 3.12em;
  font-size: clamp(1.8em, 15.12cqi, 3.12em);
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
  height: 2.88em;
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
  font-size: 0.82em;
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

/* ============================================================
   ENGRAVED INFO CARD  (info_card_design.type === 'engraved')

   Why this exists: the glass card is a *material* — a rounded panel
   with a 2px white border, a tinted fill and white type. The
   calendar / flanked / arch date marks above it are *type* —
   hairline rules and inked letterforms set straight on the page.
   Stacking the two is what makes them refuse to blend, and no
   amount of spacing fixes it, because the disagreement is the
   border and the ink colour, not the gap.

   So this set rebuilds the same content — venue, map, countdown,
   RSVP — in the date marks' own language:

     · rules, never frames — 1px hairlines at the same
       color-mix(currentColor …%) the calendar's borders use
     · ink, never white — everything inherits primaryColor
     · one accent — --details-marker-color, spent on the countdown
       numerals exactly as the calendar spends it on the heart
     · squared corners — 2px, so the map reads as a mounted plate
       rather than a soft glass window

   Engraved is selectable under any date design; only the designs
   that draw their own top/bottom rules hand one off, see
   .joins-date-mark below.
   ============================================================ */

/* One rule weight, three strengths — the calendar's 60% is the
   structural line, 40% frames the map plate, 28% is for hairlines
   that sit against content and must not compete with it. */
.engraved-sheet {
  --engraved-rule: color-mix(in srgb, currentColor 60%, transparent);
  --engraved-rule-mid: color-mix(in srgb, currentColor 40%, transparent);
  --engraved-rule-soft: color-mix(in srgb, currentColor 28%, transparent);
  /* Same measure as .calendar-card, so the two blocks share an edge
     rather than merely sitting near each other. */
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  box-sizing: border-box;
  border-top: 1px solid var(--engraved-rule);
  border-bottom: 1px solid var(--engraved-rule);
}

/* The sheet's own two rules arrive with the sheet's bounce-in — one
   element, one motion. The sheet's one interior mark draws itself
   (see .rsvp-toggle-container::before): it lands after the sheet has
   already settled, which is the moment the calendar's heart, the
   flanked rules and the arch outline all use to draw. */

.engraved-inner {
  padding: 0;
}

/* --- Joining the date mark ------------------------------------
   The calendar's bottom rule and the sheet's top rule are the same
   boundary drawn twice, 14px apart — the doubled line in the middle
   of the composition. The mark gives its rule up and the sheet's
   becomes the single seam, so the two blocks read as one sheet of
   stationery instead of two stacked cards. */
.is-engraved.joins-date-mark .calendar-card,
.is-engraved.joins-date-mark .event-details-card {
  border-bottom: none;
  /* Matches the venue block below the seam, so the one remaining line sits
     centred in its own air instead of hugging the grid above it. */
  padding-bottom: 0.8rem;
}

.is-engraved.joins-date-mark > .space-y-3 {
  margin-top: 0 !important;
}

/* --- Venue ----------------------------------------------------- */
.is-engraved .map-location-header {
  color: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  line-height: 1.4;
  padding: 0.85rem 0.75rem 0.7rem;
}

/* --- Map plate --------------------------------------------------
   A mounted photograph — hairline frame, paper margin, second
   hairline on the image — is a print convention that does not
   survive the trip to a 396px-wide phone: 4px of mat between two
   1px rules reads as a doubled border, not as a mat. So the plate
   is full-bleed to the sheet with a single hairline tight to the
   image. Its two edges then continue the sheet's own rules instead
   of adding two more at a near-miss width (396 against 420), which
   is what made the block read as a table rather than as stationery.

   Text keeps .calendar-card's 0.75rem side padding; only the plate
   goes edge to edge, which is how a plate is set in print. */
.is-engraved .engraved-map {
  padding: 0 0 0.95rem;
}

/* Designs that keep their venue in their own date mark (panel) leave the
   map as the sheet's opening element, where full bleed would butt the
   plate straight into the sheet's top rule. Vue renders a comment node
   for a false v-if, which :first-child ignores, so this stays correct
   however the venue header is toggled. */
.is-engraved .engraved-inner > .engraved-map:first-child {
  padding-top: 0.95rem;
}

/* The hairline is a border on the plate, not an outset box-shadow on
   the iframe: a shadow spreads *outside* the box, so at full bleed it
   would run 1px past the sheet's own rules on each side — the exact
   near-miss this change exists to remove. Preflight's border-box keeps
   the bordered plate at the sheet's width. */
.is-engraved .engraved-plate {
  border: 1px solid var(--engraved-rule-soft);
  /* A 1-2px radius under a 1px stroke is not a corner, it is an
     antialiasing smudge. */
  border-radius: 0;
  padding: 0;
  background: transparent;
}

.is-engraved .engraved-plate iframe {
  display: block;
  border-radius: 0;
}

/* --- Section bands ---------------------------------------------
   Interior boundaries are space, not lines. A rule at --engraved-rule
   is the same weight the sheet uses for its own two borders, so
   spending one on every section put three identical full-width rules
   inside one block — a ledger, not an invitation. Engraving spends
   rules the way it spends ink: a rule is punctuation, and punctuation
   stops meaning anything once it is the default separator.

   The sheet's top and bottom borders bound the block; inside it the
   bands are separated by their own rhythm, which is why the padding
   here is larger than the 0.95/0.85 a drawn rule allowed.

   position: relative stays — SectionDisplayToggle (manage-preview
   only) is absolutely positioned against these bands. */
.is-engraved .engraved-band {
  position: relative;
  padding: 1.4rem 0.75rem 1.25rem;
  border-top: none;
}

/* --- The one interior mark --------------------------------------
   RSVP is where the sheet stops being read and starts being answered,
   and that shift earns punctuation — but a *mark*, not a divider. A
   short centred hairline is the vocabulary .calendar-heading::before
   already established for this set; a full-width rule here would put
   a third 60% line into a block that already has two.

   Drawn from the centre out, like .flanked-rule and the calendar's
   heart — but at --engraved-rule-soft, because a mark that competes
   with the sheet's structural borders is just another divider. */
.is-engraved .rsvp-toggle-container {
  padding-top: 1.6rem;
}

.is-engraved .rsvp-toggle-container::before {
  content: '';
  display: block;
  width: 2.5rem;
  height: 1px;
  margin: 0 auto 1.35rem;
  background: var(--engraved-rule-soft);
  transform: scaleX(0);
  transform-origin: center;
}

/* animation-delay: inherit takes the band's own inline delay (set for
   its bounce-in), then the keyframes hold flat through that 0.5s
   entrance before drawing — so the band lands first and the mark is
   drawn across it after, never both at once. The hold percentage and
   the duration are one number: 70% of 0.72s is the 0.5s bounce-in, and
   the remaining 0.216s is the draw. Change one, change the other. */
.animate-active.is-engraved .rsvp-toggle-container::before {
  animation: engravedRuleDraw 0.72s cubic-bezier(0.23, 1, 0.32, 1) forwards;
  animation-delay: inherit;
}

@keyframes engravedRuleDraw {
  0%,
  70% {
    transform: scaleX(0);
  }
  100% {
    transform: scaleX(1);
  }
}

/* --- Countdown --------------------------------------------------
   The glass card sets the count as a clock: two numerals at up to
   8rem in a condensed UI face, a colon between them, floating labels
   beneath. That is a scoreboard, and the first engraved pass only
   shrank it — same arrangement, smaller. Worse, it spent a rule on
   the colon's job. A rule is this set's structural mark, and putting
   one between the two halves of a single measurement gave the block a
   stray tick that reached neither baseline, held there by a bottom
   margin hand-fitted to the label's height (and therefore wrong the
   moment the label changed language or size).

   So the block is re-set the way print sets a figure: each numeral is
   captioned, with its own hairline under it at the sheet's 28% caption
   weight and the unit beneath that. The rules now run *under* the
   figures instead of *between* them — they measure rather than divide,
   which is the one job the engraved set still has for a rule. Two
   columns of one measure, so the pair is centred on the sheet's own
   axis rather than hung off a separator, and the count stops
   out-shouting the venue above it and the reply below. */

/* `!important` throughout this block only outranks the desktop
   breakpoint blocks above, which size the glass card's countdown the
   same way. */
.is-engraved .countdown-wrapper {
  /* Every gap in the band is a margin below its owner, so the block
     reads in one rhythm instead of a flex gap plus a margin. */
  gap: 0 !important;
}

.is-engraved .countdown-header {
  color: inherit;
  /* Demoted a step from the unit labels below. The two used to be the
     same size and weight, which left the band with three tiers of
     identical small caps and hierarchy only in the numerals. */
  opacity: 0.55;
  font-size: 0.625rem !important;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  line-height: 1.4;
  margin-bottom: 1.05rem;
}

.is-engraved .countdown-time-row {
  align-items: stretch;
  gap: clamp(1.25rem, 7vw, 2.25rem);
}

/* One measure for both columns, so the two caption rules come out the
   same length — a figure whose rule is shorter than its neighbour's
   reads as a mistake rather than as a smaller number. Wide enough for
   the longest label the set carries (HOURS, ម៉ោង) plus its tracking. */
.is-engraved .countdown-unit {
  min-width: 4.75rem;
}

.is-engraved .countdown-number {
  color: var(--details-marker-color, currentColor);
  font-weight: 600;
  font-size: clamp(2.1rem, 9.5vw, 2.85rem);
  letter-spacing: 0.02em;
  /* Tracking is trailing width; the indent hands it back so the
     numeral sits on its rule's centre. Same trade as the reply plate. */
  text-indent: 0.02em;
  padding-bottom: 0.5rem;
  text-shadow: none;
}

.is-engraved .countdown-unit-label {
  color: inherit;
  opacity: 0.72;
  font-size: 0.625rem !important;
  font-weight: 600;
  letter-spacing: 0.14em;
  /* Full column width so the rule is the measure, not the word: the
     labels differ in length and a rule fitted to each would give the
     two figures different mats. */
  width: 100%;
  /* The base's margin would open a gap above the rule; the space this
     caption needs is under it, which is what the padding gives. */
  margin-top: 0;
  padding-top: 0.5rem;
  border-top: 1px solid var(--engraved-rule-soft);
}

/* --- RSVP -------------------------------------------------------
   The RSVP form is slotted in from MainContentStage, so its own
   white-on-glass styling is re-inked from here rather than forked
   into two copies of an 1,800-line component. `!important` appears
   only where the source sets colour as an *inline* style (the
   status options, the chips, the submit button) and nothing else
   can outrank it. */
.is-engraved .rsvp-toggle-container {
  color: inherit;
}

.is-engraved .rsvp-toggle-container :deep(.rsvp-title),
.is-engraved .rsvp-toggle-container :deep(.step-prompt),
.is-engraved .rsvp-toggle-container :deep(.stepper-value),
.is-engraved .rsvp-toggle-container :deep(.stepper-label),
.is-engraved .rsvp-toggle-container :deep(.toggle-label),
.is-engraved .rsvp-toggle-container :deep(.confirmation-text),
.is-engraved .rsvp-toggle-container :deep(.confirmation-code-text),
.is-engraved .rsvp-toggle-container :deep(.seat-stat-value),
.is-engraved .rsvp-toggle-container :deep(.link-btn),
.is-engraved .rsvp-toggle-container :deep(.message-text),
.is-engraved .rsvp-toggle-container :deep(.label-error),
.is-engraved .rsvp-toggle-container :deep(.required-star),
.is-engraved .rsvp-toggle-container :deep(.text-white) {
  color: inherit;
}

/* The glass card colour-codes its two outcomes — mint for success, rose for
   error — and both land on paper as a wash. The sheet has one ink, so the
   distinction is weight: the error is stated, the success is an aside under a
   header that already reads as a thank-you. */
.is-engraved .rsvp-toggle-container :deep(.message-text.error) {
  font-weight: 600;
}

.is-engraved .rsvp-toggle-container :deep(.step-hint),
.is-engraved .rsvp-toggle-container :deep(.rsvp-placeholder),
.is-engraved .rsvp-toggle-container :deep(.responded-at),
.is-engraved .rsvp-toggle-container :deep(.message-text.success),
.is-engraved .rsvp-toggle-container :deep(.seat-stat-label) {
  color: color-mix(in srgb, currentColor 65%, transparent);
}

/* The inactive half of the public form's attend/decline pair is dimmed by an
   *inline* opacity: 0.6 — tuned for white on a tinted panel, where it still
   reads. The same 0.6 on ink over paper is a 2.8:1 whisper, so the dimming is
   done in the colour here and the inline opacity is cancelled. */
.is-engraved .rsvp-toggle-container :deep(.toggle-label) {
  opacity: 1 !important;
  color: color-mix(in srgb, currentColor 62%, transparent);
}

.is-engraved .rsvp-toggle-container :deep(.toggle-container:has(.toggle-switch:not(.active)) .toggle-label:first-child),
.is-engraved .rsvp-toggle-container :deep(.toggle-container:has(.toggle-switch.active) .toggle-label:last-child) {
  color: inherit;
  font-weight: 600;
}

/* Outlined controls: hairline box, squared corners, ink on paper. A
   1-2px radius under a 1px stroke is not a corner, it is an
   antialiasing smudge — the same call .engraved-plate makes. The nav
   buttons and the status list have left this group entirely; see The
   answer and The reply below. */
.is-engraved .rsvp-toggle-container :deep(.chip),
.is-engraved .rsvp-toggle-container :deep(.edit-btn) {
  border-radius: 0;
  border: 1px solid var(--engraved-rule-mid);
  background: transparent !important;
  color: inherit !important;
  box-shadow: none;
  letter-spacing: 0.03em;
}

/* The guest's own marks, and the only fill on the sheet.
   A filled chip is ink the *guest* laid down; the sheet's own
   furniture stays line-drawn (see The reply). Keeping the split that
   way is what lets the answers be solid without the card's chrome
   turning back into buttons — and it keeps selection unmistakable,
   which a rule-weight change alone would not.

   currentColor cannot be the fill here: this rule also sets the
   element's own color to paper, and currentColor resolves against
   that same declaration — the chip would fill with paper and vanish.
   --engraved-ink carries the sheet's colour in explicitly. */
.is-engraved .rsvp-toggle-container :deep(.chip.active) {
  border: 1px solid var(--engraved-ink, currentColor);
  border-radius: 0;
  background: var(--engraved-ink, currentColor) !important;
  color: var(--engraved-paper, #fff) !important;
  box-shadow: none;
  letter-spacing: 0.03em;
}

/* --- The answer -------------------------------------------------
   The status step is the one question the whole sheet is asking, and
   on the glass card it is a centred wrap of pills. That row is what
   a card can afford: three labels of very different lengths
   ("Joyfully accepts", "Regretfully declines", "Maybe") set as
   nowrap capsules, ragged on both edges, wrapping to a second line
   on a phone with the orphan centred under the gap. On a panel the
   ragged edge is absorbed by the panel's own border. The sheet has
   no border to absorb it — its edges *are* the page — so the row
   reads as three loose objects rather than as one question.

   Printed reply cards have solved this for a century: the options
   are a ruled list, one to a line, each on the same measure, each
   with a box to mark. So that is what the answer becomes here —
   which also settles the alignment, because the list now shares
   --reply-measure with the progress rule, the inputs and the plate,
   and the band finally has one column instead of four widths.

   The mark is the selection, not a fill: a small square that takes
   the ink. That keeps a filled box (unmistakable) without ever
   putting *type* on ink, so the answer can never depend on
   --engraved-paper resolving to something readable. */
.is-engraved .rsvp-toggle-container :deep(.status-options) {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 0;
  width: 100%;
  max-width: var(--reply-measure);
  margin: 0.25rem auto 0;
}

.is-engraved .rsvp-toggle-container :deep(.status-option) {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  /* 44px minimum target, from the row height rather than from padding
     on a capsule — same floor the plate takes below. */
  min-height: 2.75rem;
  padding: 0.6rem 0.1rem;
  border: none;
  border-bottom: 1px solid
    color-mix(in srgb, var(--engraved-ink, currentColor) 26%, transparent);
  border-radius: 0;
  background: transparent !important;
  /* Full ink on the row, and the setting-back done on the label span
     instead — the row's own `color` is what every color-mix() below
     resolves against, so dimming it here would quietly dim the rule
     and the box by the same factor and compound to a whisper. */
  color: inherit !important;
  box-shadow: none;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-align: left;
  white-space: normal;
  transition: border-color 0.18s ease;
}

/* Unchosen options are set back so the chosen one carries the line;
   they are still options, not hints, so 72% and not the 65% the true
   secondary text takes. */
.is-engraved .rsvp-toggle-container :deep(.status-option) > span {
  color: color-mix(in srgb, currentColor 72%, transparent);
  transition: color 0.18s ease;
}

/* The box to mark. A pseudo-element, not markup, so the shared
   GuestRSVPSection template stays one component. */
.is-engraved .rsvp-toggle-container :deep(.status-option)::before {
  content: '';
  flex: 0 0 auto;
  width: 0.62rem;
  height: 0.62rem;
  border: 1px solid
    color-mix(in srgb, var(--engraved-ink, currentColor) 55%, transparent);
  background: transparent;
  transition: background 0.18s cubic-bezier(0.23, 1, 0.32, 1),
    border-color 0.18s ease;
}

.is-engraved .rsvp-toggle-container :deep(.status-option.active) {
  border-bottom-color: var(--engraved-ink, currentColor);
}

.is-engraved .rsvp-toggle-container :deep(.status-option.active) > span {
  color: inherit;
  font-weight: 600;
}

.is-engraved .rsvp-toggle-container :deep(.status-option.active)::before {
  background: var(--engraved-ink, currentColor);
  border-color: var(--engraved-ink, currentColor);
}

/* A row is not a button, so it does not press like one — a 0.97 scale
   on a full-measure line reads as the whole list twitching. The ink
   going into the box *is* the feedback, and it arrives on pointerdown
   rather than on the state change. */
.is-engraved .rsvp-toggle-container :deep(.status-option:active) {
  transform: none;
}

/* :not(.active) matters here: `:active` and `.active` carry the same
   specificity and this rule is the later one, so without it pressing the
   row that is already chosen would lift its box back out of full ink. */
.is-engraved .rsvp-toggle-container :deep(.status-option:active:not(.active))::before {
  background: color-mix(in srgb, var(--engraved-ink, currentColor) 35%, transparent);
  border-color: var(--engraved-ink, currentColor);
}

/* --- The reply ---------------------------------------------------
   Everything else in this band sits on one centre line: the drawn
   mark, the prompt, the options, the progress track, every input.
   The nav bar did not. It came over from the glass card as a form
   *footer* — `justify-content: flex-end` with the back button shoved
   out on `margin-right: auto` — and a footer needs a panel to be
   pinned to. The card had one. The sheet does not: its left and right
   edges are the page's own, so a control pinned to them is not
   anchored, it is just off-axis.

   So the two actions stack on the sheet's centre line, and they stop
   being siblings. Engraving has no rounded 7rem pill and no solid
   slab — a plate lays lines, not fields — so the primary action is a
   squared hairline plate and the retreat is a signed line.

   Visual order is reversed against the DOM: the plate reads first on
   paper but stays second in the tab order, which is what keeps it
   from moving under a finger when the back link appears on step two.
   Two controls, both plainly labelled, so the sequence carries the
   same meaning read either way. */
.is-engraved .rsvp-toggle-container {
  /* One measure for everything the guest reads down: the progress
     rule, the list of answers, every input, and the plate. Four
     different widths stacked on a centre line is what made the band
     read as parts of a form rather than as one; a single measure is
     the cheapest way to give a column an edge. min() rather than a
     flat rem so the narrowest phones give the list its full width
     back instead of indenting it. */
  --reply-measure: min(17.5rem, 100%);
}

.is-engraved .rsvp-toggle-container :deep(.wizard-nav) {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  justify-content: flex-start;
  gap: 0.35rem;
  min-height: 0;
  margin-top: 1rem;
}

/* Chevrons are the last piece of app chrome in the band — the
   countdown already traded its colon for a hairline and the map its
   rounded frame. A plate does not print arrows. */
.is-engraved .rsvp-toggle-container :deep(.nav-btn svg),
.is-engraved .rsvp-toggle-container :deep(.signin-icon) {
  display: none;
}

/* Shared reset for both actions, in either flow. The 44px floor is
   new: the pill was ~24px tall, which is a control for a card read on
   a laptop, not one answered with a thumb. */
.is-engraved .rsvp-toggle-container :deep(.nav-btn),
.is-engraved .rsvp-toggle-container :deep(.rsvp-btn-signin) {
  gap: 0;
  min-height: 2.75rem;
  border-radius: 0;
  box-shadow: none;
  background: transparent !important;
  transition: border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease,
    text-decoration-color 0.2s ease,
    transform 0.14s cubic-bezier(0.23, 1, 0.32, 1);
}

/* The one primary action, whichever flow drew it: the wizard's
   next/submit and the public form's sign-in.

   Emphasis is area, tracking, and a full-ink rule — the only full-ink
   rule on the sheet, where every other box sits at 28-40%. No fill,
   and no second rule inside it: .engraved-map already established
   that a 1px mat between two hairlines reads as one doubled border at
   phone width rather than as a mat. */
.is-engraved .rsvp-toggle-container :deep(.nav-btn.next),
.is-engraved .rsvp-toggle-container :deep(.nav-btn.submit),
.is-engraved .rsvp-toggle-container :deep(.rsvp-btn-signin) {
  width: 100%;
  max-width: var(--reply-measure);
  min-width: 0;
  justify-content: center;
  padding: 0.5rem 1rem;
  border: 1px solid var(--engraved-ink, currentColor);
  color: inherit !important;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  /* Tracking is trailing width. The indent hands the label back its
     right half so the type sits on the plate's centre, not 3px left. */
  text-indent: 0.18em;
  text-transform: uppercase;
}

/* Sits outside .wizard-nav, in its own flow, so it centres itself. */
.is-engraved .rsvp-toggle-container :deep(.rsvp-btn-signin) {
  margin: 0.4rem auto 0;
}

/* Disabled is a lighter impression, not a faded one: the base rule's
   opacity: 0.5 over already-soft ink reads as a printing error. The
   plate is also the band's whole call to action while the guest is
   still on step one, so it has to stay *legible* while inert —
   28%/45% dropped it to a ghost, which read as a rendering fault
   rather than as "answer the question first". */
.is-engraved .rsvp-toggle-container :deep(.nav-btn.next:disabled),
.is-engraved .rsvp-toggle-container :deep(.nav-btn.submit:disabled) {
  opacity: 1;
  /* Mixed from --engraved-ink, not from currentColor: this rule sets the
     element's own color to 58% ink, and a currentColor mix in the same
     declaration block would resolve against *that* — 40% of 58% is a
     0.23 border, which is the ghost this rule exists to avoid. */
  border-color: color-mix(in srgb, var(--engraved-ink, currentColor) 40%, transparent);
  color: color-mix(in srgb, currentColor 58%, transparent) !important;
}

/* The retreat is a signed line, not a control — a word set small in
   reduced ink over a hairline. The rule is drawn on the text rather
   than on the box, so the box can carry a 44px target while the line
   stays tight under the word. */
.is-engraved .rsvp-toggle-container :deep(.nav-btn.back) {
  margin-right: 0;
  padding: 0 1rem;
  border: none;
  color: color-mix(in srgb, currentColor 60%, transparent) !important;
  font-size: 0.66rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-indent: 0.12em;
  text-transform: uppercase;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-decoration-color: var(--engraved-rule-soft);
  text-underline-offset: 0.5em;
}

/* Ink is opaque, so a hover tint would flip a control to solid.
   Deepen the rule instead — the outline is the only thing the
   engraved set can move without changing material. */
@media (hover: hover) and (pointer: fine) {
  .is-engraved .rsvp-toggle-container :deep(.chip:hover:not(.active)),
  .is-engraved .rsvp-toggle-container :deep(.edit-btn:hover) {
    background: transparent !important;
    border-color: var(--engraved-ink, currentColor);
  }

  /* A ruled row has no box to deepen, so the hover is the label coming
     up to full ink and its own rule with it — the line the pointer is
     on darkens, which is how a printed list is read with a finger. */
  .is-engraved .rsvp-toggle-container :deep(.status-option:hover:not(.active)) {
    background: transparent !important;
    border-bottom-color: var(--engraved-rule-mid);
  }

  .is-engraved .rsvp-toggle-container :deep(.status-option:hover:not(.active)) > span {
    color: inherit;
  }

  .is-engraved .rsvp-toggle-container :deep(.status-option:hover:not(.active))::before {
    border-color: var(--engraved-ink, currentColor);
  }

  /* The public form's counter: its base rule sets `border-color: white`,
     which on paper deletes the button outright at exactly the moment the
     pointer is on it. */
  .is-engraved .rsvp-toggle-container :deep(.stepper-btn:hover:not(:disabled)) {
    background: transparent;
    border-color: var(--engraved-ink, currentColor);
    transform: none;
  }

  /* The plate's rule is already full ink, so it cannot deepen — it
     thickens, as an inset shadow so nothing reflows. The pill's -1px
     lift and drop shadow are cancelled here: paper does not hover.

     `:not(:active)` keeps this selector out of the press state, so the
     lower-specificity press rule below still wins the transform while
     a mouse is held down. */
  .is-engraved
    .rsvp-toggle-container
    :deep(.nav-btn.next:hover:not(:disabled):not(:active)),
  .is-engraved
    .rsvp-toggle-container
    :deep(.nav-btn.submit:hover:not(:disabled):not(:active)),
  .is-engraved .rsvp-toggle-container :deep(.rsvp-btn-signin:hover:not(:active)) {
    transform: none;
    box-shadow: inset 0 0 0 1px var(--engraved-ink, currentColor);
  }

  .is-engraved .rsvp-toggle-container :deep(.nav-btn.back:hover) {
    background: transparent !important;
    color: inherit !important;
    text-decoration-color: var(--engraved-rule);
  }
}

/* A wide element reads a given scale as more movement than a small one
   does, so the plate presses less far than the 0.97 the pill used. */
.is-engraved .rsvp-toggle-container :deep(.nav-btn:active:not(:disabled)),
.is-engraved .rsvp-toggle-container :deep(.rsvp-btn-signin:active) {
  transform: scale(0.985);
}

/* The glass card's focus ring is white, which on paper is no ring. */
.is-engraved .rsvp-toggle-container :deep(.status-option:focus-visible),
.is-engraved .rsvp-toggle-container :deep(.chip:focus-visible),
.is-engraved .rsvp-toggle-container :deep(.stepper-btn:focus-visible),
.is-engraved .rsvp-toggle-container :deep(.nav-btn:focus-visible),
.is-engraved .rsvp-toggle-container :deep(.edit-btn:focus-visible),
.is-engraved .rsvp-toggle-container :deep(.link-btn:focus-visible),
.is-engraved .rsvp-toggle-container :deep(.rsvp-btn-signin:focus-visible) {
  outline: 1px solid var(--engraved-ink, currentColor);
  outline-offset: 3px;
}

/* Khmer has no case, and its clusters break under tracking, so both
   actions give theirs back — the same trade the countdown eyebrows
   make above. */
.is-engraved.is-khmer .rsvp-toggle-container :deep(.nav-btn.next),
.is-engraved.is-khmer .rsvp-toggle-container :deep(.nav-btn.submit),
.is-engraved.is-khmer .rsvp-toggle-container :deep(.nav-btn.back),
.is-engraved.is-khmer .rsvp-toggle-container :deep(.rsvp-btn-signin) {
  letter-spacing: 0;
  text-indent: 0;
  text-transform: none;
}
/* The counter's two buttons are the last circles in the band, on a
   sheet where the map plate, the chips and the plate are all squared.
   Their 1.55-1.75rem box is also well under a thumb, so an invisible
   expander takes the target to ~44px without moving anything: the
   layout is still driven by the drawn square. */
.is-engraved .rsvp-toggle-container :deep(.stepper-btn) {
  position: relative;
  border: 1px solid var(--engraved-rule-mid);
  border-radius: 0;
  background: transparent;
  color: inherit;
}

.is-engraved .rsvp-toggle-container :deep(.stepper-btn)::after {
  content: '';
  position: absolute;
  inset: -0.6rem;
}

/* The public form's attend/decline control is an iOS switch — a
   1.5rem capsule with a round thumb sliding inside it — which is the
   single most app-shaped object in the band. Squaring the track and
   the thumb turns it into a marker sliding in a ruled slot, the same
   figure the status list's box makes. */
.is-engraved .rsvp-toggle-container :deep(.toggle-switch) {
  border-radius: 0;
  height: 1.35rem;
}

.is-engraved .rsvp-toggle-container :deep(.toggle-thumb) {
  top: 0.2rem;
  left: 0.2rem;
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 0;
}

.is-engraved .rsvp-toggle-container :deep(.line-input),
.is-engraved .rsvp-toggle-container :deep(.line-textarea) {
  width: 100%;
  max-width: var(--reply-measure);
  margin-left: auto;
  margin-right: auto;
  color: inherit;
  border-bottom-color: var(--engraved-rule-mid);
}

.is-engraved .rsvp-toggle-container :deep(.line-input::placeholder),
.is-engraved .rsvp-toggle-container :deep(.line-textarea::placeholder) {
  color: color-mix(in srgb, currentColor 45%, transparent);
}

.is-engraved .rsvp-toggle-container :deep(.line-input:focus),
.is-engraved .rsvp-toggle-container :deep(.line-textarea:focus) {
  border-bottom-color: var(--engraved-ink, currentColor);
}

/* The progress bar is the one place the glass card uses a glow. On
   the sheet it becomes what a printed form would use: a hairline
   track with a solid rule filling it. */
.is-engraved .rsvp-toggle-container :deep(.wizard-progress) {
  height: 1px;
  max-width: var(--reply-measure);
  border-radius: 0;
  background: var(--engraved-rule-soft);
}

.is-engraved .rsvp-toggle-container :deep(.wizard-progress-fill) {
  border-radius: 0;
  background: var(--engraved-ink, currentColor);
  box-shadow: none;
}

.is-engraved .rsvp-toggle-container :deep(.rsvp-title-check),
.is-engraved .rsvp-toggle-container :deep(.confirmation-chip),
.is-engraved .rsvp-toggle-container :deep(.seat-ticket) {
  background: transparent;
  border-color: var(--engraved-rule-mid);
  color: inherit;
}

.is-engraved .rsvp-toggle-container :deep(.toggle-switch) {
  border: 1px solid var(--engraved-rule-mid);
  background: transparent !important;
}

.is-engraved .rsvp-toggle-container :deep(.toggle-thumb) {
  background: var(--engraved-ink, currentColor) !important;
}

.is-engraved .rsvp-toggle-container :deep(.spinner-white),
.is-engraved .rsvp-toggle-container :deep(.spinner-inline) {
  border-color: color-mix(in srgb, currentColor 25%, transparent);
  border-top-color: currentColor;
}

.is-engraved .rsvp-toggle-container :deep(.seat-ticket-divider) {
  background: var(--engraved-rule-soft);
}

/* Manage-preview only: the dashed add-map affordance, re-inked so the
   partner sees the engraved sheet rather than a white dashed box. */
.is-engraved .add-map-placeholder {
  border-color: var(--engraved-rule-mid);
  border-radius: 0;
  background: transparent;
  color: inherit;
  /* Stands in for the plate, so it occupies the plate's box — full
     bleed to the sheet, same closing gap. */
  margin: 0 0 0.95rem;
}

/* Khmer runs wider than Latin at the same size and its clusters break
   under tracking, so the eyebrows give theirs back and relax their
   line-height rather than tightening the type. */
.is-engraved .countdown-header.khmer-text-fix,
.is-engraved .countdown-unit-label.khmer-text-fix {
  letter-spacing: 0;
  line-height: 1.35;
  /* Latin small caps carry at 0.625rem because the caps are the whole
     glyph; a Khmer cluster at that size loses its subscripts and
     diacritics, so it takes back the step the Latin type gave up. The
     two scripts are matched by legibility, not by number. */
  font-size: 0.6875rem !important;
}

/* ============================================================
   FROSTED INFO CARD  (info_card_design.type === 'frosted')

   Why this exists: `glass` is the oldest material in the
   showcase. It was drawn before the guestbook and the gift page
   were rebuilt, and it is heavier than either — a 2px solid
   white border around a 60%-alpha fill, with white type on it.
   Those two sections now share one recipe (`.wb-panel`,
   `.pay-sheet`): a single blurred layer tinted with the
   template's own background, ink instead of white, and hairlines
   that fade out at both ends instead of drawn dividers. Scrolled
   past in one pass, the invitation therefore shows two different
   kinds of glass, and the older one reads as the mistake.

   So this is the same card — venue, map, countdown, RSVP —
   rebuilt to that recipe, deliberately identical to it rather
   than merely similar. Three colours come in from the component
   (`--fr-ink`, `--fr-tone`, `--fr-paper`) and everything below is
   a mix of them.

   What changes, and why:

     · one material, one blur — the sheet is the only element
       here that filters what is behind it. A translucent surface
       stacked on a translucent surface is the one thing the
       material rules forbid outright, so the map, the countdown
       and the reply sit *on* the sheet rather than in cards of
       their own
     · ink, never white — over a light translucent surface white
       type has nothing holding it. Vibrancy instead: full-ink
       copy, a weight step up on small text, and tracking rather
       than a grey
     · seams, not dividers — every boundary inside the sheet is
       one hairline that fades out at both ends, the gift page's
       seam
     · one accent — --details-marker-color, spent on the
       countdown numerals exactly as engraved spends it
     · size-specific tracking — the count tightens as it grows,
       the captions open up as they shrink

   Sizing is mobile-first and scaled by ONE number, `--fr-s`,
   matching the guestbook's `--wb-s` and the gift page's
   `--pay-s`. The six breakpoint blocks above size the *glass*
   card and reach these class names too, so the rules here carry
   `!important` wherever one of those does.
   ============================================================ */

.frosted-sheet {
  --fr-s: 1;
  --fr-ease: cubic-bezier(0.23, 1, 0.32, 1);
  --fr-hair-soft: color-mix(in srgb, var(--fr-tone) 13%, transparent);
  /* The sheet's own padding, and therefore the inset every band
     shares. Named because the map's corner radius is derived
     from it — see .frosted-plate. */
  --fr-pad: calc(0.875rem * var(--fr-s));

  /* Full width of the content column, deliberately unlike
     .engraved-sheet and .calendar-card, which are capped at 420px
     so the mark and the sheet under it read as one piece of
     stationery. This is a card, and the objects it has to agree
     with are the agenda, the gift page and the guestbook below
     it — all of which run the column's full width. Capping it
     would leave the one sheet built to match them narrower than
     every one of them, on a card that is 85vw wide. */
  width: 100%;
  box-sizing: border-box;
  padding: var(--fr-pad);
  /* 1.25rem is the guestbook's and the gift page's radius, not a
     number chosen here: three sheets in one scroller with three
     different corner radii is the drift this design exists to
     remove. */
  border-radius: 1.25rem;
  color: var(--fr-ink);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--fr-tone) 9%, transparent),
    color-mix(in srgb, var(--fr-tone) 4%, transparent)
  );
  /* Hairline ring, a bright top edge where light catches the
     material, and a shadow deeper than a chip's because the
     surface is bigger. */
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--fr-tone) 14%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    0 10px 30px -20px color-mix(in srgb, var(--fr-tone) 70%, transparent);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  backdrop-filter: blur(14px) saturate(150%);
}

.frosted-inner {
  padding: 0;
}

/* --- Entrance ---------------------------------------------------
   The shared .bounce-in-element lands every block on this stage
   with a 15px rise and an overshoot. Overshoot is momentum, and
   nothing threw this card — it appeared because the reader
   scrolled to it — so the sheet settles instead: critically
   damped, no bounce, and a scale alongside the rise so the
   material reads as arriving rather than as fading up.

   The delay stays inline (animationDelays.card); an inline
   longhand outranks this shorthand's implicit reset of it. */
.animate-active .frosted-sheet {
  animation: frostedSettle 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

@keyframes frostedSettle {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* --- Seams ------------------------------------------------------
   One boundary mark for the whole sheet: a hairline that fades
   out at both ends, drawn on the band it opens rather than as an
   element between two bands. The gift page separates one payment
   method from the next with exactly this rule.

   :first-child suppresses it when a band opens the sheet — the
   countdown does when the event has no venue line and no map.
   Vue renders a comment node for a false v-if and :first-child
   ignores comment nodes, so this stays correct however the
   sections are toggled. */
.is-frosted .countdown-container::before,
.is-frosted .rsvp-toggle-container::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--fr-hair-soft) 18%,
    var(--fr-hair-soft) 82%,
    transparent
  );
}

.is-frosted .frosted-inner > :first-child::before {
  content: none;
}

/* --- Venue ------------------------------------------------------
   Vibrancy, not grey: over a translucent surface the way to set
   a line back is weight and size, because a grey borrows
   whatever is drifting behind the sheet. This one is not set
   back at all — it is the fact the map is a picture of. */
.is-frosted .map-location-header {
  color: inherit;
  font-size: calc(0.9375rem * var(--fr-s));
  font-weight: 600;
  letter-spacing: 0.005em;
  line-height: 1.4;
  padding: calc(0.125rem * var(--fr-s)) calc(0.25rem * var(--fr-s))
    calc(0.7rem * var(--fr-s));
}

/* --- Map window -------------------------------------------------
   A window in the sheet, not a plate on it: the sheet's own
   corner radius less its padding, which is how a rounded frame
   and the rounded hole inside it stay concentric. Rounded up an
   eighth from the exact figure, because a 16:9 window at 0.375rem
   reads as a square hole punched in a soft card.

   The hairline is a border rather than an inset shadow: the
   iframe is content and paints over an inset shadow, which would
   delete three of the four edges. Preflight's border-box keeps
   the bordered window at the band's width. */
.is-frosted .frosted-map {
  padding: 0 0 calc(0.85rem * var(--fr-s)) !important;
}

.is-frosted .frosted-plate {
  border: 1px solid color-mix(in srgb, var(--fr-tone) 22%, transparent);
  border-radius: calc(1.25rem - var(--fr-pad) + 0.125rem);
  background: transparent;
}

.is-frosted .frosted-plate iframe {
  display: block;
}

/* --- Countdown --------------------------------------------------
   The glass card sets the count as a scoreboard: two numerals at
   up to 8rem in a condensed UI face, white, with a drop shadow
   under them to survive whatever video is playing behind. None
   of that is needed on a sheet that carries its own ground, and
   at 8rem the count out-shouts the venue above it and the reply
   below — the two things the card is actually for.

   So it comes down to a size the sheet can hold and the type
   does the work instead: the numerals tighten (letters read too
   far apart as they grow), the captions open up and take a
   weight step (small text over translucency needs both), and the
   accent lands on the figures — the sheet's one point of colour.

   The colon stays. Two figures with a colon is a *time*, which
   is what a countdown is; engraved dropped it only because it
   sets the two halves as separately measured figures. */
.is-frosted .countdown-container {
  padding: calc(1.1rem * var(--fr-s)) 0 calc(1rem * var(--fr-s)) !important;
}

/* Manage-preview only. The band's own padding above outranks the
   shared clearance rule (same specificity, later in the file), so
   the clearance is restated here at a higher one. */
.is-frosted .countdown-container.has-display-toggle {
  padding-top: 2.25rem !important;
}

.is-frosted .countdown-wrapper {
  gap: 0 !important;
}

.is-frosted .countdown-header {
  color: inherit;
  /* A step below the unit labels: three tiers of identical small
     caps would leave the band with hierarchy only in the
     numerals. */
  opacity: 0.6;
  font-size: calc(0.6875rem * var(--fr-s)) !important;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  line-height: 1.4;
  margin-bottom: calc(0.85rem * var(--fr-s));
}

/* Top-aligned, which is what retires the colon's hand-fitted
   offset — see the separator below. */
.is-frosted .countdown-time-row {
  align-items: flex-start;
  gap: calc(0.7rem * var(--fr-s));
}

.is-frosted .countdown-number {
  color: var(--details-marker-color, currentColor);
  font-size: calc(clamp(2.75rem, 13vw, 4.25rem) * var(--fr-s)) !important;
  font-weight: 600;
  line-height: 1;
  /* Tracking is size-specific: at display size the letters read
     too far apart, so the count tightens where the captions
     below open up. */
  letter-spacing: -0.03em;
  /* Tracking is trailing width; the indent hands it back so the
     numeral sits on its column's centre. Same trade the engraved
     plate makes, in the other direction. */
  text-indent: -0.03em;
  text-shadow: none;
}

/* The glass card centres the colon by hanging a margin under it,
   hand-fitted to the label's height — which is wrong the moment
   the label changes size or language, and needed a second,
   separately hand-fitted correction for Khmer.

   A colon sits mid-em in every face. Give it the numerals' own
   font-size and line-height and align the three boxes at the
   top, and it lands on the digits' centre by construction, in
   any face and either script. Both corrections are cancelled
   here rather than re-tuned, so nothing is left fitted to a size
   this design does not use. The .is-khmer selector is repeated
   because the base one carries the same specificity and sits in
   a later media query. */
.is-frosted .countdown-separator,
.is-frosted .countdown-separator.is-khmer {
  color: color-mix(in srgb, currentColor 38%, transparent);
  font-size: calc(clamp(2.75rem, 13vw, 4.25rem) * var(--fr-s)) !important;
  font-weight: 600;
  line-height: 1;
  align-self: flex-start;
  margin-bottom: 0 !important;
  transform: none;
  text-shadow: none;
}

.is-frosted .countdown-unit-label {
  color: inherit;
  opacity: 0.62;
  font-size: calc(0.6875rem * var(--fr-s)) !important;
  font-weight: 600;
  letter-spacing: 0.14em;
  margin-top: calc(0.5rem * var(--fr-s));
}

/* --- The reply --------------------------------------------------
   The RSVP form is slotted in from MainContentStage, so its
   white-on-glass styling is re-toned from here rather than
   forked into two copies of an 1,800-line component — the same
   arrangement the engraved set uses, and for the same reason.

   Unlike engraved, the composition is left alone. The status
   options stay a wrap of capsules and the actions stay a pill:
   engraved rebuilt both as a ruled list because a sheet with no
   border has nothing to absorb a ragged edge. This sheet has a
   border. Only the colours, the material and the touch targets
   change.

   `!important` appears only where the source sets colour as an
   *inline* style and nothing else can outrank it. */
.is-frosted .rsvp-toggle-container {
  padding: calc(1.2rem * var(--fr-s)) 0 calc(0.35rem * var(--fr-s));
  color: inherit;
}

.is-frosted .rsvp-toggle-container.has-display-toggle {
  padding-top: 2.25rem;
}

.is-frosted .rsvp-toggle-container :deep(.rsvp-title),
.is-frosted .rsvp-toggle-container :deep(.step-prompt),
.is-frosted .rsvp-toggle-container :deep(.stepper-value),
.is-frosted .rsvp-toggle-container :deep(.stepper-label),
.is-frosted .rsvp-toggle-container :deep(.toggle-label),
.is-frosted .rsvp-toggle-container :deep(.confirmation-text),
.is-frosted .rsvp-toggle-container :deep(.confirmation-code-text),
.is-frosted .rsvp-toggle-container :deep(.seat-stat-value),
.is-frosted .rsvp-toggle-container :deep(.link-btn),
.is-frosted .rsvp-toggle-container :deep(.message-text),
.is-frosted .rsvp-toggle-container :deep(.label-error),
.is-frosted .rsvp-toggle-container :deep(.required-star),
.is-frosted .rsvp-toggle-container :deep(.text-white) {
  color: inherit;
}

/* Secondary copy is set back in the ink, never in a grey. */
.is-frosted .rsvp-toggle-container :deep(.step-hint),
.is-frosted .rsvp-toggle-container :deep(.rsvp-placeholder),
.is-frosted .rsvp-toggle-container :deep(.responded-at),
.is-frosted .rsvp-toggle-container :deep(.message-text.success),
.is-frosted .rsvp-toggle-container :deep(.seat-stat-label) {
  color: color-mix(in srgb, currentColor 62%, transparent);
}

.is-frosted .rsvp-toggle-container :deep(.message-text.error) {
  font-weight: 600;
}

/* The inactive half of the attend/decline pair is dimmed by an
   *inline* opacity: 0.6, tuned for white on a saturated panel.
   The same factor on ink over a pale sheet is a whisper, so the
   dimming moves into the colour and the inline opacity is
   cancelled. */
.is-frosted .rsvp-toggle-container :deep(.toggle-label) {
  opacity: 1 !important;
  color: color-mix(in srgb, currentColor 60%, transparent);
}

.is-frosted
  .rsvp-toggle-container
  :deep(.toggle-container:has(.toggle-switch:not(.active)) .toggle-label:first-child),
.is-frosted
  .rsvp-toggle-container
  :deep(.toggle-container:has(.toggle-switch.active) .toggle-label:last-child) {
  color: inherit;
  font-weight: 600;
}

/* Unselected controls are the sheet's own material one shade up:
   a hairline ring over a faint tint, never a white box. */
.is-frosted .rsvp-toggle-container :deep(.chip),
.is-frosted .rsvp-toggle-container :deep(.status-option),
.is-frosted .rsvp-toggle-container :deep(.edit-btn) {
  border: 1px solid color-mix(in srgb, var(--fr-tone) 26%, transparent);
  background: color-mix(in srgb, var(--fr-tone) 8%, transparent) !important;
  color: inherit !important;
  box-shadow: none;
  transition:
    background 0.18s var(--fr-ease),
    border-color 0.18s var(--fr-ease),
    color 0.18s var(--fr-ease),
    transform 0.12s var(--fr-ease);
}

/* 44px is the floor for anything answered with a thumb, and the
   status options carry the whole question. */
.is-frosted .rsvp-toggle-container :deep(.status-option) {
  min-height: 2.75rem;
}

/* The guest's own marks — solid ink, with the label in the one
   colour measured to survive on it (paperOnInk). The template's
   background cannot be used here: it is substituted with the
   primary colour whenever a template declares none, which would
   print the label in its own fill. */
.is-frosted .rsvp-toggle-container :deep(.chip.active),
.is-frosted .rsvp-toggle-container :deep(.status-option.active) {
  border-color: var(--fr-ink, currentColor);
  background: var(--fr-ink, currentColor) !important;
  color: var(--fr-paper, #fff) !important;
}

/* Press feedback lands on pointer-down, not on the state change,
   and a wide control reads a given scale as more movement than a
   small one — so the capsules press further than the pill. */
.is-frosted .rsvp-toggle-container :deep(.chip:active),
.is-frosted .rsvp-toggle-container :deep(.status-option:active) {
  transform: scale(0.97);
}

/* The one primary action, whichever flow drew it: the wizard's
   next/submit and the public form's sign-in. Emphasis is a solid
   fill on a sheet where everything else is a hairline — and a
   44px target, which the ~24px pill was not. */
.is-frosted .rsvp-toggle-container :deep(.nav-btn.next),
.is-frosted .rsvp-toggle-container :deep(.nav-btn.submit),
.is-frosted .rsvp-toggle-container :deep(.rsvp-btn-signin) {
  min-height: 2.75rem;
  padding: 0.5rem 1.35rem;
  border: none;
  background: var(--fr-ink, currentColor) !important;
  color: var(--fr-paper, #fff) !important;
  font-weight: 600;
  box-shadow: 0 6px 18px -12px color-mix(in srgb, var(--fr-ink) 90%, transparent);
  transition:
    box-shadow 0.2s var(--fr-ease),
    background 0.2s var(--fr-ease),
    transform 0.12s var(--fr-ease);
}

/* Disabled is a lighter impression, not a faded one: the base
   rule's opacity: 0.5 over a translucent sheet reads as a
   rendering fault. The fill stays, set back in the ink, so the
   band's call to action is still legible while it is inert. */
.is-frosted .rsvp-toggle-container :deep(.nav-btn.next:disabled),
.is-frosted .rsvp-toggle-container :deep(.nav-btn.submit:disabled) {
  opacity: 1;
  background: color-mix(in srgb, var(--fr-ink) 32%, transparent) !important;
  box-shadow: none;
}

/* The retreat is not a second primary action. */
.is-frosted .rsvp-toggle-container :deep(.nav-btn.back) {
  min-height: 2.75rem;
  border: 1px solid color-mix(in srgb, var(--fr-tone) 26%, transparent);
  background: transparent !important;
  color: color-mix(in srgb, currentColor 68%, transparent) !important;
  box-shadow: none;
}

.is-frosted .rsvp-toggle-container :deep(.nav-btn:active:not(:disabled)),
.is-frosted .rsvp-toggle-container :deep(.rsvp-btn-signin:active) {
  transform: scale(0.985);
}

/* A translucent surface has no fixed colour behind it, so a hover
   cannot be a lighter tint of one — it is the same material one
   step denser. */
@media (hover: hover) and (pointer: fine) {
  .is-frosted .rsvp-toggle-container :deep(.chip:hover:not(.active)),
  .is-frosted .rsvp-toggle-container :deep(.status-option:hover:not(.active)),
  .is-frosted .rsvp-toggle-container :deep(.edit-btn:hover),
  .is-frosted .rsvp-toggle-container :deep(.nav-btn.back:hover) {
    background: color-mix(in srgb, var(--fr-tone) 16%, transparent) !important;
    border-color: color-mix(in srgb, var(--fr-tone) 42%, transparent);
    color: inherit !important;
  }

  .is-frosted
    .rsvp-toggle-container
    :deep(.nav-btn.next:hover:not(:disabled):not(:active)),
  .is-frosted
    .rsvp-toggle-container
    :deep(.nav-btn.submit:hover:not(:disabled):not(:active)),
  .is-frosted .rsvp-toggle-container :deep(.rsvp-btn-signin:hover:not(:active)) {
    transform: none;
    box-shadow: 0 10px 24px -12px color-mix(in srgb, var(--fr-ink) 90%, transparent);
  }

  /* The public form's counter sets `border-color: white`, which on
     this sheet deletes the button at exactly the moment the
     pointer is on it. */
  .is-frosted .rsvp-toggle-container :deep(.stepper-btn:hover:not(:disabled)) {
    border-color: var(--fr-ink, currentColor);
    background: color-mix(in srgb, var(--fr-tone) 16%, transparent);
    transform: none;
  }
}

/* The glass card's focus ring is white, which on this sheet is no
   ring. */
.is-frosted .rsvp-toggle-container :deep(.status-option:focus-visible),
.is-frosted .rsvp-toggle-container :deep(.chip:focus-visible),
.is-frosted .rsvp-toggle-container :deep(.stepper-btn:focus-visible),
.is-frosted .rsvp-toggle-container :deep(.nav-btn:focus-visible),
.is-frosted .rsvp-toggle-container :deep(.edit-btn:focus-visible),
.is-frosted .rsvp-toggle-container :deep(.link-btn:focus-visible),
.is-frosted .rsvp-toggle-container :deep(.rsvp-btn-signin:focus-visible) {
  outline: 2px solid var(--fr-ink, currentColor);
  outline-offset: 2px;
}

/* The counter's two buttons are ~1.55-1.75rem, well under a
   thumb. An invisible expander takes the target to ~44px without
   moving anything — the layout is still driven by the drawn
   circle. */
.is-frosted .rsvp-toggle-container :deep(.stepper-btn) {
  position: relative;
  border: 1px solid color-mix(in srgb, var(--fr-tone) 26%, transparent);
  background: color-mix(in srgb, var(--fr-tone) 8%, transparent);
  color: inherit;
}

.is-frosted .rsvp-toggle-container :deep(.stepper-btn)::after {
  content: '';
  position: absolute;
  inset: -0.6rem;
}

.is-frosted .rsvp-toggle-container :deep(.line-input),
.is-frosted .rsvp-toggle-container :deep(.line-textarea) {
  color: inherit;
  border-bottom-color: color-mix(in srgb, var(--fr-tone) 30%, transparent);
}

.is-frosted .rsvp-toggle-container :deep(.line-input::placeholder),
.is-frosted .rsvp-toggle-container :deep(.line-textarea::placeholder) {
  color: color-mix(in srgb, currentColor 45%, transparent);
}

.is-frosted .rsvp-toggle-container :deep(.line-input:focus),
.is-frosted .rsvp-toggle-container :deep(.line-textarea:focus) {
  border-bottom-color: var(--fr-ink, currentColor);
}

/* The progress bar is the one place the glass card uses a glow.
   Here it is a hairline track with a solid fill — a glow needs a
   dark ground to bloom against, and this sheet has none. */
.is-frosted .rsvp-toggle-container :deep(.wizard-progress) {
  background: var(--fr-hair-soft);
}

.is-frosted .rsvp-toggle-container :deep(.wizard-progress-fill) {
  background: var(--fr-ink, currentColor);
  box-shadow: none;
}

.is-frosted .rsvp-toggle-container :deep(.rsvp-title-check),
.is-frosted .rsvp-toggle-container :deep(.confirmation-chip),
.is-frosted .rsvp-toggle-container :deep(.seat-ticket) {
  border-color: color-mix(in srgb, var(--fr-tone) 26%, transparent);
  background: color-mix(in srgb, var(--fr-tone) 8%, transparent);
  color: inherit;
}

.is-frosted .rsvp-toggle-container :deep(.toggle-switch) {
  border: 1px solid color-mix(in srgb, var(--fr-tone) 30%, transparent);
  background: color-mix(in srgb, var(--fr-tone) 10%, transparent) !important;
}

.is-frosted .rsvp-toggle-container :deep(.toggle-thumb) {
  background: var(--fr-ink, currentColor) !important;
}

.is-frosted .rsvp-toggle-container :deep(.spinner-white),
.is-frosted .rsvp-toggle-container :deep(.spinner-inline) {
  border-color: color-mix(in srgb, currentColor 25%, transparent);
  border-top-color: currentColor;
}

.is-frosted .rsvp-toggle-container :deep(.seat-ticket-divider) {
  background: var(--fr-hair-soft);
}

/* Manage-preview only: the dashed add-map affordance, re-toned so
   the partner sees the frosted sheet rather than a white dashed
   box. It stands in for the map, so it takes the map's box — same
   radius, same closing gap. */
.is-frosted .add-map-placeholder {
  border-color: color-mix(in srgb, var(--fr-tone) 34%, transparent);
  border-radius: calc(1.25rem - var(--fr-pad) + 0.125rem);
  background: color-mix(in srgb, var(--fr-tone) 8%, transparent);
  color: color-mix(in srgb, var(--fr-ink) 75%, transparent);
  margin: 0 0 calc(0.85rem * var(--fr-s));
}

/* --- Khmer ------------------------------------------------------
   Khmer runs wider than Latin at the same size and its clusters
   break under tracking, so the small caps give theirs back and
   relax their leading rather than tightening the type. Latin caps
   carry at 0.6875rem because the caps are the whole glyph; a
   Khmer cluster at that size loses its subscripts, so it takes
   back the step the Latin type gave up. The two scripts are
   matched by legibility, not by number. */
.is-frosted .countdown-header.khmer-text-fix,
.is-frosted .countdown-unit-label.khmer-text-fix {
  letter-spacing: 0;
  line-height: 1.35;
  font-size: calc(0.75rem * var(--fr-s)) !important;
}

/* Khmer numerals carry no tracking of their own to tighten, and
   the count is set in the template's display face for them. */
.is-frosted.is-khmer .countdown-number,
.is-frosted.is-khmer .countdown-separator {
  letter-spacing: 0;
  text-indent: 0;
}

/* --- Laptop scale -----------------------------------------------
   The showcase card is 85vh, so on a 13-15" laptop every section
   renders at roughly two-thirds size. These two blocks set
   `--fr-s` and nothing else — the same two steps the guestbook
   and the gift page take. */
@media (min-width: 1024px) and (max-width: 1365px) {
  .frosted-sheet {
    --fr-s: 0.68;
  }
}

@media (min-width: 1366px) and (max-width: 1535px) {
  .frosted-sheet {
    --fr-s: 0.76;
  }
}

/* --- Accessibility ----------------------------------------------
   Translucency and contrast are preferences separate from motion,
   and a blurred surface has to answer both. Neither fallback can
   be built on the *tone*, which is the obvious choice for "this
   material, made solid": `useTemplateProcessor` substitutes the
   primary colour for any template that declares no background, so
   for most templates a solid tone is the ink itself, and the sheet
   would print its own copy in its own fill. Even mixing a little
   tone into the paper is not safe — in that same case it is ink
   being mixed in, and it eats the contrast paperOnInk was measured
   to guarantee, on a sheet carrying 0.6875rem captions.

   So both fallbacks are the measured paper, and they differ only
   in what bounds the sheet. */
@media (prefers-reduced-transparency: reduce) {
  .frosted-sheet {
    background: var(--fr-paper);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

@media (prefers-contrast: more) {
  .frosted-sheet {
    background: var(--fr-paper);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    box-shadow: inset 0 0 0 1px var(--fr-ink);
  }

  /* Everything set back by opacity comes back to full ink — a
     near-solid ground is only half of what this preference asks
     for. */
  .is-frosted .countdown-header,
  .is-frosted .countdown-unit-label,
  .is-frosted .rsvp-toggle-container :deep(.step-hint),
  .is-frosted .rsvp-toggle-container :deep(.rsvp-placeholder),
  .is-frosted .rsvp-toggle-container :deep(.responded-at),
  .is-frosted .rsvp-toggle-container :deep(.message-text.success),
  .is-frosted .rsvp-toggle-container :deep(.seat-stat-label),
  .is-frosted .rsvp-toggle-container :deep(.toggle-label) {
    opacity: 1;
    color: inherit;
  }
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  /* The .animate-active variants are load-bearing: the rules that start
     these two (.animate-active .bounce-word / .bounce-in-element) are
     0,2,0 and a media query adds no specificity, so the unprefixed
     selectors alone lose the cascade and every bounce — a 15px
     translateY with an overshoot on the sheet, the map, both bands and
     the date mark, plus a 6px one per word — keeps running for exactly
     the readers who asked it not to. Matches the .details-line and
     .calendar-day entries below, which already carry the prefix. */
  .bounce-word,
  .animate-active .bounce-word,
  .bounce-in-element,
  .animate-active .bounce-in-element,
  /* Frosted replaces the shared bounce on its own sheet, so it needs
     naming here too — the replacement carries the same specificity and
     would otherwise be decided by source order alone. */
  .animate-active .frosted-sheet {
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

  /* Engraved: the RSVP mark is the sheet's one interior boundary — an
     undrawn scaleX(0) would delete it outright. */
  .is-engraved .rsvp-toggle-container::before,
  .animate-active.is-engraved .rsvp-toggle-container::before {
    animation: none;
    transform: scaleX(1);
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
