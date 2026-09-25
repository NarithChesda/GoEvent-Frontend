<template>
  <!-- The countdown and the reply, as a section of their own after the info
       card: how long until, then will you come. One root carrying the colour
       contract every design reads (see contractStyle); each block has its own
       arrival, because on a phone the reply is usually a screen below the
       count and would otherwise have played its entrance off-screen. -->
  <section class="crs" :style="contractStyle">
    <!-- Also drawn when switched off inside the studio preview, so its
         on/off chip stays reachable (editIntentCtx is never provided on the
         public showcase). Never once the start has passed: nothing is left
         to count. -->
    <div
      v-if="countdownVisible"
      ref="countdownRef"
      class="crs-block crs-countdown"
      :class="{ 'has-display-toggle': !!editIntentCtx }"
    >
      <SectionDisplayToggle
        field="countdown_enabled"
        :active="showCountdown"
        :label="tApp('management.showcasePreview.editors.countdownLabel')"
      />
      <component
        :is="countdownComponent"
        :units="units"
        :header="header"
        :revealed="countdownRevealed"
        :display-font="displayFont"
        :text-font="textFont"
        :khmer="khmer"
        :photo="photo"
        :paper-tone="paperTone"
        :bleed-class="bleedClass"
      />
    </div>

    <div
      v-if="rsvpVisible"
      ref="rsvpRef"
      class="crs-block crs-rsvp"
      :class="{ 'has-display-toggle': !!editIntentCtx }"
    >
      <SectionDisplayToggle
        field="rsvp_enabled"
        :active="showRsvp"
        :label="tApp('management.showcasePreview.editors.rsvpLabel')"
      />
      <component
        :is="rsvpComponent"
        :revealed="rsvpRevealed"
        :mark="mark"
        :text-font="textFont"
        :khmer="khmer"
      >
        <div class="crs-form" :class="{ 'crs-form--ink': formInk }" :style="formStyle">
          <slot name="rsvp" />
        </div>
      </component>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, inject, onUnmounted, ref, watch, type Ref } from 'vue'
import SectionDisplayToggle from '@/components/showcase-preview/edit/SectionDisplayToggle.vue'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { showcaseRevealObserverInit } from '@/composables/showcase/useScrollProgress'
import type { EventPhoto } from '@/composables/useEventShowcase'
import type {
  CountdownDesignType,
  CountdownRsvpDesignConfig,
  RsvpDesignType,
} from '@/services/api/types/template.types'
import { translateRSVP, type SupportedLanguage } from '@/utils/translations'
import { countdownPhoto, formatCount } from './countdownRsvp'
import { paperToneOf } from '../calendar-designs/calendarModel'
import {
  inkOnPaper,
  paperOnInk,
  stationeryPaper,
  type StationeryPaper,
} from '../stationery'
import { useCountdownClock } from './useCountdownClock'
import type { CountdownUnit } from './types'

import CountdownStrips from './countdown-designs/CountdownStrips.vue'
import CountdownFlip from './countdown-designs/CountdownFlip.vue'
import CountdownOrbit from './countdown-designs/CountdownOrbit.vue'
import CountdownTypeset from './countdown-designs/CountdownTypeset.vue'
import RsvpCard from './rsvp-designs/RsvpCard.vue'
import RsvpEnvelope from './rsvp-designs/RsvpEnvelope.vue'
import RsvpGlass from './rsvp-designs/RsvpGlass.vue'
import RsvpInline from './rsvp-designs/RsvpInline.vue'

/**
 * The countdown + RSVP section (`template_assets.countdown_rsvp_design`).
 *
 * Before this the two lived at the foot of the info card, under the map, in
 * whichever material the card was drawn — so a template could choose how its
 * date looked and how its venue card looked, but never how its count or its
 * reply did. The stage only mounts this when the template chose the section;
 * absent, EventInfo keeps drawing both inside the card exactly as before.
 *
 * The section owns the clock, the copy, the colours and when each block
 * arrives. A design owns only its composition and its own arrival, and is
 * never told what kind of event it is counting down to.
 */
interface Props {
  /** Already resolved (resolveCountdownRsvpDesign): both keys are known designs. */
  design: CountdownRsvpDesignConfig
  eventStartDate?: string
  /** The organizer's `countdown_enabled`. */
  showCountdown: boolean
  /** The organizer's `rsvp_enabled`. */
  showRsvp: boolean
  /** Past the event's end: both forms hide themselves then, so the shell must too. */
  isEventPast: boolean
  /** The event's photographs, for the strips. */
  photos?: EventPhoto[]
  /** The card's negative inline margins, for the one design that runs edge to edge. */
  bleedClass?: string
  primaryColor: string
  accentColor: string
  backgroundColor?: string
  /**
   * The invitation's shared paper (stationery.ts): the reply card and the
   * envelope's card are printed on the same stock, with the same corner and
   * lift, as the calendar card and the map's polaroid. Absent resolves the
   * default stock from the tone.
   */
  stationery?: StationeryPaper | null
  /**
   * The date design's marker colour — the one accent every block spends its
   * mark in. Absent falls back to the template's accent.
   */
  markerColor?: string | null
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  currentLanguage?: string
}

const props = defineProps<Props>()

const editIntentCtx = inject(EditIntentKey, undefined)
const { t: tApp } = useAppLanguage()

// ---------------------------------------------------------------------------
// Designs
// ---------------------------------------------------------------------------

const COUNTDOWN_DESIGNS = {
  strips: CountdownStrips,
  flip: CountdownFlip,
  orbit: CountdownOrbit,
  typeset: CountdownTypeset,
} as const satisfies Record<CountdownDesignType, unknown>

const RSVP_DESIGNS = {
  card: RsvpCard,
  envelope: RsvpEnvelope,
  glass: RsvpGlass,
  inline: RsvpInline,
} as const satisfies Record<RsvpDesignType, unknown>

const countdownComponent = computed(() => COUNTDOWN_DESIGNS[props.design.countdown])
const rsvpComponent = computed(() => RSVP_DESIGNS[props.design.rsvp])

// ---------------------------------------------------------------------------
// The count
// ---------------------------------------------------------------------------

const parts = useCountdownClock(() => props.eventStartDate)

const countdownVisible = computed(
  () => (props.showCountdown || !!editIntentCtx) && !!props.eventStartDate && !parts.value.passed,
)

const rsvpVisible = computed(() => (props.showRsvp || !!editIntentCtx) && !props.isEventPast)

const lang = computed(() => (props.currentLanguage as SupportedLanguage) || 'en')
const khmer = computed(() => props.currentLanguage === 'kh')

const header = computed(() => translateRSVP('countdown_header', lang.value))
const mark = computed(() => translateRSVP('rsvp_mark', lang.value))

const units = computed((): CountdownUnit[] => {
  const { days, hours, minutes } = parts.value
  return [
    {
      key: 'days',
      value: formatCount(days, props.currentLanguage),
      label: translateRSVP('countdown_days', lang.value),
      share: null,
    },
    {
      key: 'hours',
      value: formatCount(hours, props.currentLanguage),
      label: translateRSVP('countdown_hours', lang.value),
      share: hours / 24,
    },
    {
      key: 'minutes',
      value: formatCount(minutes, props.currentLanguage),
      label: translateRSVP('countdown_minutes', lang.value),
      share: minutes / 60,
    },
  ]
})

const photo = computed(() => countdownPhoto(props.photos))

const displayFont = computed(() => props.primaryFont || props.currentFont)
const textFont = computed(() => props.secondaryFont || props.currentFont)

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

const tone = computed(() => props.backgroundColor || props.primaryColor)
const paper = computed(() => paperOnInk(props.primaryColor, props.backgroundColor))
const paperTone = computed(() => paperToneOf(paper.value))

/** The reply card's stock, and everything printed on it. */
const stock = computed(() => props.stationery ?? stationeryPaper({ tone: tone.value }))
const card = computed(() => ({
  paper: stock.value.paper,
  ink: inkOnPaper(props.primaryColor, stock.value.paper),
}))

/**
 * The contract. A design never reads a template colour directly:
 *
 *   --crs-ink          copy, rules, the flip board's tiles — the template's primary
 *   --crs-accent       the one mark a design spends it on (a lozenge, an arc) —
 *                      the date design's marker colour, so the day and every
 *                      mark below it are one colour
 *   --crs-tone         surfaces and hairlines — the template's background
 *   --crs-paper        type set ON the ink (flip digits, strips with no photo)
 *   --crs-card-paper   the reply card's stock — the invitation's one paper
 *   --crs-card-ink     everything printed on that stock
 *   --crs-radius       that paper's corner
 *   --crs-paper-shadow that paper's lift
 *   --crs-ease-out     the showcase's strong ease-out, declared here so a design
 *                      renders the same inside a preview frame
 */
const contractStyle = computed(() => ({
  '--crs-ink': props.primaryColor,
  '--crs-accent': props.markerColor || props.accentColor || props.primaryColor,
  '--crs-tone': tone.value,
  '--crs-paper': paper.value,
  '--crs-card-paper': card.value.paper,
  '--crs-card-ink': card.value.ink,
  '--crs-radius': `${stock.value.radius}px`,
  '--crs-paper-shadow': stock.value.shadow,
}))

/**
 * The glass shell keeps the forms' native white; every other shell sets them
 * on paper or on the page and inks them (rsvp-ink.css). The reply card inks
 * them in its own printable ink, which is not always the template's.
 */
const formInk = computed(() => props.design.rsvp !== 'glass')

const formStyle = computed((): Record<string, string> => {
  if (!formInk.value) return {}
  if (props.design.rsvp === 'inline') {
    return {
      '--crs-form-ink': props.primaryColor,
      '--crs-form-tone': tone.value,
      '--crs-form-paper': paper.value,
    }
  }
  return {
    '--crs-form-ink': card.value.ink,
    '--crs-form-tone': card.value.ink,
    '--crs-form-paper': card.value.paper,
  }
})

// ---------------------------------------------------------------------------
// Arrival
// ---------------------------------------------------------------------------

/**
 * Each block flips `revealed` once, when it first scrolls into the card's
 * scroller, and never back: the arrivals are one-time gestures (a photograph
 * assembling, a card coming out of its envelope), not something to replay on
 * every pass. Watched rather than wired in onMounted because either block can
 * mount late — a studio toggle, a template's design arriving after the stage.
 */
function useRevealOnce(target: Ref<HTMLElement | null>) {
  const revealed = ref(false)
  let observer: IntersectionObserver | null = null

  const stop = () => {
    observer?.disconnect()
    observer = null
  }

  watch(
    target,
    (el) => {
      stop()
      if (!el || revealed.value) return
      if (typeof IntersectionObserver === 'undefined') {
        revealed.value = true
        return
      }
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          revealed.value = true
          stop()
        }
      }, showcaseRevealObserverInit())
      observer.observe(el)
    },
    { flush: 'post' },
  )

  onUnmounted(stop)
  return revealed
}

const countdownRef = ref<HTMLElement | null>(null)
const rsvpRef = ref<HTMLElement | null>(null)
const countdownRevealed = useRevealOnce(countdownRef)
const rsvpRevealed = useRevealOnce(rsvpRef)
</script>

<!-- The forms' re-inking, unscoped: it has to reach into two child components'
     markup, and every selector is namespaced under `.crs`. -->
<style src="./rsvp-designs/rsvp-ink.css"></style>

<style scoped>
.crs {
  --crs-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(2.25rem, 9vw, 3rem);
  width: 100%;
}

/* position: relative for the studio's on/off chip, which pins to a block's
   top-right corner. */
.crs-block {
  position: relative;
  width: 100%;
}

.crs-block.has-display-toggle {
  padding-top: 2.25rem;
}

.crs-form {
  width: 100%;
  text-align: center;
}
</style>
