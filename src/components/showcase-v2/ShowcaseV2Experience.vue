<template>
  <div ref="rootEl" class="v2-experience relative" :style="cssVars">
    <!-- Background motion layer (behind everything): WebGL tunnel flythrough
         on capable devices, falling-petal CSS layer otherwise/as a fallback -->
    <V2Tunnel
      v-if="richMotion"
      ref="tunnelRef"
      :colors="petalColors"
      :shapes="particleShapes"
      :ring-color="palette.gold"
      :background-color="palette.ivory"
      @unavailable="richMotion = false"
    />
    <V2PetalField v-else :colors="petalColors" :shapes="particleShapes" />

    <!-- Envelope cover gate (category-specific — see useV2CategoryVariant) -->
    <component
      :is="variant.CoverGate"
      v-if="showCover"
      :event-title="event.title"
      v-bind="heroExtraProps"
      :monogram="monogram"
      :guest-name="guestName"
      :current-language="currentLanguage"
      @opened="handleCoverOpened"
    />

    <main class="relative">
      <!-- 1 · Hero (category-specific) -->
      <component
        :is="variant.HeroSection"
        :event-title="event.title"
        v-bind="heroExtraProps"
        :start-date="event.start_date"
        :date-line="dateLine"
        :location-line="locationLine"
        :show-countdown="event.countdown_enabled !== false"
        :active="heroActive"
        :current-language="currentLanguage"
      />

      <!-- 2 · Our Story (pinned 3D scroll storytelling — category-specific) -->
      <component
        :is="variant.StorySection"
        v-if="hasChapter('story-section')"
        :chapter-number="chapterNumber('story-section')"
        :title="t('chapter_story')"
        :hosts="hosts"
        :welcome-text="welcomeText"
        :description-title="descriptionTitle"
        :description-text="descriptionText"
        :get-media-url="getMediaUrl"
        :current-language="currentLanguage"
      />

      <!-- 3 · Agenda (V2 timeline accordion) -->
      <V2AgendaSection
        v-if="hasChapter('agenda-section')"
        :chapter-number="chapterNumber('agenda-section')"
        :title="t('chapter_agenda')"
        :agenda-items="agendaItems"
        :current-language="currentLanguage"
      />

      <!-- 4 · Dress code -->
      <V2ChapterShell
        v-if="hasChapter('dress-code-section')"
        section-id="dress-code-section"
        :chapter-number="chapterNumber('dress-code-section')"
        :title="t('chapter_dress_code')"
        :current-language="currentLanguage"
      >
        <div class="v2-card">
          <DressCodeSection
            :dress-codes="dressCodes"
            :primary-color="palette.charcoal"
            :secondary-color="palette.sageDeep"
            :accent-color="palette.gold"
            :background-color="palette.charcoal"
            :event-texts="eventTexts"
            :current-language="currentLanguage"
            :current-font="fonts.body"
            :primary-font="fonts.body"
            :secondary-font="fonts.display"
            :get-media-url="getMediaUrl"
          />
        </div>
      </V2ChapterShell>

      <!-- 5 · Venue & map -->
      <V2VenueSection
        v-if="hasChapter('venue-section')"
        :chapter-number="chapterNumber('venue-section')"
        :title="t('chapter_venue')"
        :location-text="locationLine"
        :google-map-embed-link="event.google_map_embed_link"
        :current-language="currentLanguage"
        @open-map="$emit('openMap')"
      />

      <!-- 6 · Film -->
      <V2ChapterShell
        v-if="hasChapter('video-section')"
        section-id="video-section"
        :chapter-number="chapterNumber('video-section')"
        :title="t('chapter_video')"
        :current-language="currentLanguage"
      >
        <div class="v2-card">
          <YouTubeVideoSection
            :youtube-embed-link="event.youtube_embed_link!"
            :primary-color="palette.charcoal"
            :secondary-color="palette.sageDeep"
            :accent-color="palette.gold"
            :current-font="fonts.body"
            :primary-font="fonts.body"
            :secondary-font="fonts.display"
            :event-texts="eventTexts"
            :current-language="currentLanguage"
            :is-music-playing="isMusicPlaying"
            @video-state-change="$emit('videoStateChange', $event)"
          />
        </div>
      </V2ChapterShell>

      <!-- 7 · Gallery (V2 snap strip / grid) -->
      <V2GallerySection
        v-if="hasChapter('gallery-section')"
        :chapter-number="chapterNumber('gallery-section')"
        :title="t('chapter_gallery')"
        :photos="eventPhotos"
        :get-media-url="getMediaUrl"
        :current-language="currentLanguage"
        @open-photo="$emit('openPhoto', $event)"
      />

      <!-- 8 · RSVP -->
      <!-- Private events: V2 guest questionnaire (shortcode flow);
           public events: V2 account-based RSVP form -->
      <V2GuestRSVPSection
        v-if="hasChapter('rsvp-section') && event.privacy === 'private'"
        :chapter-number="chapterNumber('rsvp-section')"
        :title="t('chapter_rsvp')"
        :event-id="event.id"
        :guest-shortcode="guestShortcode"
        :current-language="currentLanguage"
      />
      <V2RSVPSection
        v-else-if="hasChapter('rsvp-section')"
        :chapter-number="chapterNumber('rsvp-section')"
        :title="t('chapter_rsvp')"
        :event-id="event.id"
        :is-authenticated="isAuthenticated"
        :is-event-past="isEventPast"
        :event-texts="eventTexts"
        :current-language="currentLanguage"
        @show-auth-modal="$emit('showAuthModal')"
      />

      <!-- 9 · Gift -->
      <V2PaymentSection
        v-if="hasChapter('payment-section')"
        :chapter-number="chapterNumber('payment-section')"
        :title="t('chapter_gift')"
        :payment-methods="paymentMethods"
        :get-media-url="getMediaUrl"
        :current-language="currentLanguage"
      />

      <!-- 10 · Guestbook (V2-native "well wishes" list + optimistic post) -->
      <V2GuestbookSection
        v-if="hasChapter('comment-section')"
        :chapter-number="chapterNumber('comment-section')"
        :title="t('chapter_guestbook')"
        :event-id="event.id"
        :event-privacy="event.privacy"
        :guest-name="guestName"
        :guest-shortcode="guestShortcode"
        :current-language="currentLanguage"
        :category-translations="variant.translations"
        @comment-submitted="$emit('commentSubmitted', $event)"
        @show-auth-modal="$emit('showAuthModal')"
      />

      <!-- Registration CTA -->
      <div v-if="event.registration_required && !isEventPast" class="relative z-10 px-6 pb-4">
        <div class="mx-auto max-w-xl">
          <button type="button" class="v2-register-btn" @click="$emit('register')">
            Register Now
          </button>
        </div>
      </div>

      <!-- Footer -->
      <V2FooterSection
        :thank-you-text="footerThankYouText"
        :monogram="monogram"
        :current-language="currentLanguage"
      />
    </main>

    <!-- Desktop chapter progress dots -->
    <V2ProgressDots :sections="chapters" :active-id="activeSectionId" @navigate="scrollToSection" />

    <!-- Floating bottom tab bar: quick-jump / language / music menu (fixed
         viewport host). The host stays transparent to pointer events; only
         the bar subtree re-enables them (see .v2-fab-host below) so page
         content stays clickable -->
    <div class="pointer-events-none fixed inset-0 z-[70]">
      <div class="v2-fab-host relative h-full w-full">
        <V2FloatingActionBar
          :current-language="currentLanguage"
          :available-languages="availableLanguages"
          :is-music-playing="isMusicPlaying"
          :has-location="!!event.google_map_embed_link"
          :has-agenda="hasChapter('agenda-section')"
          :has-video="!!event.youtube_embed_link"
          :has-gallery="eventPhotos.length > 0"
          :has-payment="paymentMethods.length > 0"
          :has-rsvp="event.rsvp_enabled !== false"
          :has-comments="event.comments_enabled !== false"
          :category-translations="variant.translations"
          @language-change="$emit('changeLanguage', $event)"
          @music-toggle="$emit('musicToggle')"
          @rsvp="scrollToSection('rsvp-section')"
          @reminder="handleReminder"
          @gift="handleGift"
          @agenda="scrollToSection('agenda-section')"
          @location="scrollToSection('venue-section')"
          @video="scrollToSection('video-section')"
          @gallery="scrollToSection('gallery-section')"
          @comment="scrollToSection('comment-section')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

// Category-agnostic V2 engine components (structure/mechanics shared by
// every category variant — wedding, birthday, housewarming, …)
import V2PetalField from './core/V2PetalField.vue'
import V2Tunnel from './core/V2Tunnel.vue'
import V2ChapterShell from './core/V2ChapterShell.vue'
import V2AgendaSection from './core/V2AgendaSection.vue'
import V2GallerySection from './core/V2GallerySection.vue'
import V2VenueSection from './core/V2VenueSection.vue'
import V2RSVPSection from './core/V2RSVPSection.vue'
import V2GuestRSVPSection from './core/V2GuestRSVPSection.vue'
import V2GuestbookSection from './core/V2GuestbookSection.vue'
import V2FooterSection from './core/V2FooterSection.vue'
import V2PaymentSection from './core/V2PaymentSection.vue'
import V2ProgressDots, { type ProgressSection } from './core/V2ProgressDots.vue'

// Category-specific components (CoverGate/HeroSection/StorySection) are NOT
// imported directly here — they come from the resolved `variant` (see
// useV2CategoryVariant.ts) and render via <component :is="variant.X">.

// Reused data-bound showcase components (forms/logic only — styled via the
// resolved V2 palette/font props below, same template-driven colors as the
// rest of the V2 experience)
import DressCodeSection from '../showcase/DressCodeSection.vue'
import YouTubeVideoSection from '../showcase/YouTubeVideoSection.vue'
import V2FloatingActionBar from './core/V2FloatingActionBar.vue'

import { gsap, ScrollTrigger } from '../../plugins/gsap'
import { useScrollStory, refreshScrollTriggers } from '../../composables/showcase-v2/useScrollStory'
import { useV2MotionTier } from '../../composables/showcase-v2/useV2MotionTier'
import { translateV2, type V2TranslationKey } from '../../composables/showcase-v2/v2Translations'
import {
  resolveV2Colors,
  buildV2CssVars,
  deriveV2Monogram,
  findV2TemplateFont,
} from '../../composables/showcase-v2/v2Theme'
import { resolveV2Variant } from '../../composables/showcase-v2/useV2CategoryVariant'
import type { V2ParticleShape } from '../../composables/showcase-v2/v2ParticleShapes'
import { useTemplateProcessor } from '../../composables/showcase/useTemplateProcessor'
import { formatDateLocalized, type SupportedLanguage } from '../../utils/translations'
import type {
  EventData,
  EventText,
  Host,
  AgendaItem,
  EventPhoto,
  DressCode,
  TemplateColor,
  TemplateFont,
} from '../../composables/useEventShowcase'
import type { EventPaymentMethod } from '../../services/api'

interface Props {
  event: EventData
  eventTexts: EventText[]
  hosts: Host[]
  agendaItems: AgendaItem[]
  eventPhotos: EventPhoto[]
  paymentMethods: EventPaymentMethod[]
  dressCodes: DressCode[]
  /** Template-driven V2 palette (name-keyed, see v2Theme.ts). Falls back to the default Storybook Romance look when absent. */
  templateColors?: TemplateColor[]
  /** Template-driven V2 fonts (font_type primary=body, secondary=display). Falls back to Cormorant Garamond/Karla when absent. */
  templateFonts?: TemplateFont[]
  /** Whether custom template fonts have finished loading (gates using the custom font-family name vs. the fallback stack). */
  fontsLoaded?: boolean
  currentLanguage?: string
  availableLanguages?: Array<{ id: number; language: string; language_display: string }>
  guestName?: string
  guestShortcode?: string | null
  isEventPast: boolean
  isMusicPlaying?: boolean
  isAuthenticated?: boolean
  /** Return visitor: skip the cover gate and land on the hero directly. */
  skipCover?: boolean
  getMediaUrl: (url: string) => string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Cover gate finished opening — parent starts music + marks stage. */
  opened: []
  openPhoto: [photo: EventPhoto]
  openMap: []
  changeLanguage: [language: string]
  musicToggle: []
  showAuthModal: []
  commentSubmitted: [comment: unknown]
  register: []
  videoStateChange: [isPlaying: boolean]
  mainContentViewed: []
}>()

const rootEl = ref<HTMLElement | null>(null)
const { createStory } = useScrollStory(rootEl)
const richMotion = useV2MotionTier()
const tunnelRef = ref<InstanceType<typeof V2Tunnel> | null>(null)

const lang = computed(() => (props.currentLanguage as SupportedLanguage) || 'en')

// ---------------------------------------------------------------------------
// Category variant (components + theme + copy) — see useV2CategoryVariant.ts.
// This is the ONLY place the orchestrator branches on event category; every
// other computed below is generic and works the same for any variant.
// ---------------------------------------------------------------------------
const eventType = computed(
  () => props.event.category_details?.name || props.event.category_name || 'default',
)
const variant = computed(() => resolveV2Variant(eventType.value))

const t = (key: V2TranslationKey) => translateV2(key, props.currentLanguage, variant.value.translations)

// Theme, resolved from the event's template data with the active variant's
// defaults as fallback for any color/font a template doesn't define — see
// docs/backend-api-requirements/showcase-v2-theming.md
const templateProcessor = useTemplateProcessor()

const palette = computed(() => resolveV2Colors(variant.value.colors, props.templateColors))

// Looked up by a V2-only font_type (see findV2TemplateFont) — never falls
// back to V1's primary/secondary/accent/decorative fonts, so a template
// keeps rendering the variant's own default typeface until it explicitly
// assigns a font to one of these two roles.
const fonts = computed(() => {
  const language = props.currentLanguage || 'en'
  const bodyFont = findV2TemplateFont(props.templateFonts || [], language, 'body')
  const displayFont = findV2TemplateFont(props.templateFonts || [], language, 'display')
  return {
    body: templateProcessor.createFontDeclaration(
      bodyFont,
      variant.value.fonts.body,
      props.fontsLoaded ?? false,
    ),
    display: templateProcessor.createFontDeclaration(
      displayFont,
      variant.value.fonts.display,
      props.fontsLoaded ?? false,
    ),
  }
})

const cssVars = computed(() => buildV2CssVars(palette.value, fonts.value))

const petalColors = computed(() => [
  palette.value.blush,
  palette.value.blushDeep,
  palette.value.sage,
  palette.value.gold,
])

const particleShapes = computed<V2ParticleShape[]>(() => variant.value.particleShapes ?? ['petals'])

// ---------------------------------------------------------------------------
// Cover gate / hero hand-off
// ---------------------------------------------------------------------------
const showCover = ref(!props.skipCover)
const heroActive = ref(props.skipCover === true)

const handleCoverOpened = () => {
  showCover.value = false
  heroActive.value = true
  tunnelRef.value?.triggerOpenBurst()
  emit('opened')
  emit('mainContentViewed')
  // Layout was measured while the gate locked scrolling — re-measure now
  nextTick(() => refreshScrollTriggers())
}

onMounted(() => {
  if (!showCover.value) emit('mainContentViewed')
})

// ---------------------------------------------------------------------------
// Data-derived content
// ---------------------------------------------------------------------------
// Extra props the active variant's CoverGate/HeroSection need beyond the
// shared base props (e.g. wedding's `coupleNames`) — spread via v-bind so
// this orchestrator never has to know a category-specific prop name.
const heroExtraProps = computed(() => variant.value.deriveHeroProps(props.hosts))

// Generic initials/monogram (cover seal, footer credit) — works for any
// category; only the fallback glyph when no names resolve varies by variant.
const monogram = computed(() =>
  deriveV2Monogram(
    props.hosts.slice(0, 2).map((h) => h.name),
    props.event.title,
    variant.value.monogramFallback,
  ),
)

const findText = (textType: string): EventText | undefined => {
  const texts = props.eventTexts || []
  return (
    texts.find((x) => x.text_type === textType && x.language === props.currentLanguage) ||
    texts.find((x) => x.text_type === textType && x.language === 'en') ||
    texts.find((x) => x.text_type === textType)
  )
}

const welcomeText = computed(() => findText('welcome_message')?.content)
const descriptionTitle = computed(() => findText('description')?.title)
const descriptionText = computed(() => findText('description')?.content)

const dateLine = computed(() => {
  const override = findText('date_text')?.content
  if (override) return override
  if (!props.event.start_date) return undefined
  return formatDateLocalized(props.event.start_date, 'long', lang.value)
})

const locationLine = computed(
  () => findText('location_text')?.content || props.event.location || undefined,
)

const footerThankYouText = computed(
  () => findText('thank_you_message')?.content || t('footer_thank_you'),
)

// ---------------------------------------------------------------------------
// Chapter map (order + numbering + progress dots)
// ---------------------------------------------------------------------------
const chapters = computed<ProgressSection[]>(() => {
  const list: ProgressSection[] = []
  if (props.hosts.length > 0 || welcomeText.value || descriptionText.value) {
    list.push({ id: 'story-section', label: t('chapter_story') })
  }
  if (props.agendaItems.length > 0) list.push({ id: 'agenda-section', label: t('chapter_agenda') })
  if (props.dressCodes.length > 0)
    list.push({ id: 'dress-code-section', label: t('chapter_dress_code') })
  if (props.event.google_map_embed_link || locationLine.value)
    list.push({ id: 'venue-section', label: t('chapter_venue') })
  if (props.event.youtube_embed_link) list.push({ id: 'video-section', label: t('chapter_video') })
  if (props.eventPhotos.length > 0) list.push({ id: 'gallery-section', label: t('chapter_gallery') })
  if (props.event.rsvp_enabled !== false) list.push({ id: 'rsvp-section', label: t('chapter_rsvp') })
  if (props.paymentMethods.length > 0)
    list.push({ id: 'payment-section', label: t('chapter_gift') })
  if (props.event.comments_enabled !== false)
    list.push({ id: 'comment-section', label: t('chapter_guestbook') })
  return list
})

const hasChapter = (id: string) => chapters.value.some((c) => c.id === id)
const chapterNumber = (id: string) => chapters.value.findIndex((c) => c.id === id) + 1

// ---------------------------------------------------------------------------
// Progress tracking + navigation
// ---------------------------------------------------------------------------
const activeSectionId = ref<string | null>(null)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Cinematic scroll glide into the pinned story choreography, in two phases:
// approach the pin's start at travel pace, then play the scrubbed timeline
// over the SAME duration + ease as the stage's own 0→1 snap — so the motion
// in mirrors the motion out exactly.
//
// The glide runs through ScrollTrigger's shared per-scroller scroll tween
// (`trigger.tweenTo`) rather than a plain gsap tween: while that shared tween
// exists every ScrollTrigger snap stands down, a wheel/touch gesture kills it
// natively (control returns to the user), and no second scroll-writer can
// ever race it — a plain tween here previously fought the snap systems and
// caused a visible yank/stall entering the story section.
const PIN_PLAY_DURATION = 2.6 // keep in sync with V2StorySection's snap duration max
type PinRange = { start: number; end: number }
// Assigned inside createStory once the snap trigger exists (rich/lite motion
// only) — stays null under reduced motion, where callers jump instantly.
let glideThroughPin: ((pin: PinRange) => void) | null = null
let glideActive = false
let killGlide: () => void = () => {}

const scrollToSection = (sectionId: string) => {
  const el = document.getElementById(sectionId)
  if (!el) return

  // Chapters that pin a scrubbed timeline (the story stage) sit at progress 0
  // at their start — landing there shows an empty stage. Glide to the pin's
  // end instead, so the choreography scrubs through at a matched pace and
  // settles on the completed composition.
  const pin = ScrollTrigger.getAll().find(
    (st) => st.pin && st.trigger instanceof Element && el.contains(st.trigger),
  )
  if (pin) {
    if (glideThroughPin && !prefersReducedMotion()) glideThroughPin(pin)
    else window.scrollTo({ top: pin.end })
    return
  }

  // Center chapters that fit the viewport; taller ones align to the top so
  // the heading is visible and the content reads downward
  const fitsViewport = el.offsetHeight <= window.innerHeight * 0.92
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: fitsViewport ? 'center' : 'start',
  })
}

const handleGift = () => {
  scrollToSection('payment-section')
}

onMounted(async () => {
  await nextTick()
  // One lightweight trigger per chapter drives the progress rail — the same
  // instances the dots read from (no second observer set). Their live
  // start/end positions also feed the section snap below, so snap targets
  // stay correct through every ScrollTrigger.refresh().
  createStory(({ ScrollTrigger }) => {
    const chapterTriggers: InstanceType<typeof ScrollTrigger>[] = []
    chapters.value.forEach((chapter) => {
      const el = document.getElementById(chapter.id)
      if (!el) return
      chapterTriggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: 'top center',
          end: 'bottom center',
          onToggle: (self) => {
            if (self.isActive) activeSectionId.value = chapter.id
          },
        }),
      )
    })

    // The WebGL ring ornament (V2Tunnel) *is* the story section's ring —
    // there's no separate 2D icon there anymore. It locks from its drifting
    // hero-background position to a fixed point in front of the camera as
    // the user scrolls into the pinned story stage, holds there (still
    // turning/sparkling) for the whole pin, then dissolves once the pin
    // releases. Both handoffs are timed off the pin's own *live* start/end
    // (found the same way scrollToSection() locates it) rather than a
    // page-scroll fraction or hero-relative offset — those drift with page
    // length/hero height, this doesn't.
    if (tunnelRef.value) {
      const storySectionEl = document.getElementById('story-section')
      const pin = storySectionEl
        ? ScrollTrigger.getAll().find(
            (st) => st.pin && st.trigger instanceof Element && storySectionEl.contains(st.trigger),
          )
        : undefined

      if (pin) {
        // Lock-in: glides from the hero's own drifting background presence
        // to fully locked at screen-center exactly as the pin begins. Kept
        // relative to the pin's own start (not a hero-element trigger) so
        // it composes with the absolute pin.start/pin.end used below.
        ScrollTrigger.create({
          start: () => pin.start - window.innerHeight * 0.9,
          end: () => pin.start,
          onUpdate: (self) => tunnelRef.value?.setRingLock(self.progress),
          onLeaveBack: () => tunnelRef.value?.setRingLock(0),
        })
        // Release: dissolves it in place once the pin (and the thread it
        // was catching) has finished, over a short stretch of the next
        // chapter's approach so it doesn't just vanish on release.
        ScrollTrigger.create({
          start: () => pin.end,
          end: () => pin.end + window.innerHeight * 0.5,
          onUpdate: (self) => tunnelRef.value?.setRingFade(self.progress),
          onLeaveBack: () => tunnelRef.value?.setRingFade(0),
        })
      } else {
        // No story-stage pin (e.g. no hosts to render it for) — fall back
        // to a simple dissolve as the hero itself scrolls out of view.
        const heroEl = document.getElementById('hero')
        if (heroEl) {
          ScrollTrigger.create({
            trigger: heroEl,
            start: 'bottom 65%',
            end: 'bottom 5%',
            onUpdate: (self) => tunnelRef.value?.setRingFade(self.progress),
            onLeaveBack: () => tunnelRef.value?.setRingFade(0),
          })
        }
      }
    }

    // Directional section snap: when free scrolling stops, glide the viewport
    // to the next chapter in the direction of travel — landing exactly where
    // the progress dots would (centered when the chapter fits the viewport) —
    // so only the destination chapter's entrance plays out, during the glide.
    let snapTrigger: InstanceType<typeof ScrollTrigger> | undefined

    const snapToChapter = (value: number): number => {
      const max = ScrollTrigger.maxScroll(window)
      if (!max) return value
      // A glide already owns the scroll — don't let the snap tween fight it
      // (inertia:false makes `value` the current position, so this is a no-op)
      if (glideActive) return value
      // inertia:false below makes `value` the exact current scroll progress,
      // so returning it unchanged is a true no-op (GSAP skips the snap tween
      // when the target equals the current position)
      const scroll = value * max
      const vh = window.innerHeight

      // The pinned story stage owns snapping inside its own scroll range
      // (its scrubbed timeline snaps to 0/1) — never fight it from here
      const pins = ScrollTrigger.getAll().filter((st) => st.pin)
      if (pins.some((st) => scroll > st.start + 1 && scroll < st.end - 1)) return value

      // Candidate stops: page top, each chapter (centered when it fits,
      // paged in viewport-sized steps when taller), pin edges, page end.
      // Chapter triggers run top-center → bottom-center, so start+vh/2 puts
      // the chapter top at the viewport top and end-vh/2 its bottom at the
      // viewport bottom.
      let points: number[] = [0, max]
      for (const st of chapterTriggers) {
        const height = st.end - st.start
        if (height <= vh * 0.92) {
          points.push((st.start + st.end) / 2)
        } else {
          const bottom = st.end - vh / 2
          for (let p = st.start + vh / 2; p < bottom; p += vh * 0.85) points.push(p)
          points.push(bottom)
        }
      }
      // A pinned choreography's only valid resting stop is the pin's END
      // (the completed composition). Any stop at or just above the pin's
      // start would park the user on an empty stage at timeline progress 0,
      // so the whole approach zone is cleared of stops and the glide carries
      // through the full scrubbed choreography instead.
      pins.forEach((pin) => points.push(pin.end))
      points = points
        .map((p) => Math.min(max, Math.max(0, p)))
        .filter((p) => !pins.some((pin) => p > pin.start - vh * 0.25 && p < pin.end - 1))
        .sort((a, b) => a - b)
        // Collapse only near-duplicate stops (float rounding, a pin's end
        // landing right on the next chapter's start, …) — a small fixed
        // pixel gap, not a share of viewport height. A vh-relative threshold
        // used to eat legitimate stops for back-to-back short chapters (e.g.
        // Gift sitting between RSVP and Guestbook): on a short phone
        // viewport their centered points can land well under vh*0.15 apart
        // even though each is a real, distinct chapter, so the shorter one
        // silently lost its landing spot and scrolling jumped straight over it.
        .filter((p, i, arr) => i === 0 || p - arr[i - 1] >= 24)

      // Already resting on a stop (e.g. right after dot navigation): stay put
      const near = points.find((p) => Math.abs(p - scroll) < 10)
      if (near !== undefined) return near / max

      const direction = snapTrigger?.direction ?? 0
      if (direction > 0) {
        const next = points.find((p) => p > scroll) ?? max
        // Entering a pinned choreography from above: hand the traversal to
        // the distance-paced glide so the scrub plays at a readable speed
        const crossing = pins.find((pin) => scroll < pin.start && next >= pin.end - 1)
        if (crossing) {
          // Start on the next tick: the snap code that invoked this callback
          // may still create its own shared scroll tween after we return
          // (fractional scroll positions make even a stay-put snap tween).
          // Deferring lets the glide be created last, so it replaces that
          // tween instead of being clobbered by it.
          glideActive = true
          gsap.delayedCall(0, () => glideThroughPin?.(crossing))
          return value
        }
        return next / max
      }
      if (direction < 0) {
        for (let i = points.length - 1; i >= 0; i--) {
          if (points[i] < scroll) return points[i] / max
        }
        return 0
      }
      return (
        points.reduce((best, p) => (Math.abs(p - scroll) < Math.abs(best - scroll) ? p : best)) /
        max
      )
    }

    snapTrigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      snap: {
        snapTo: snapToChapter,
        duration: { min: 0.45, max: 1.5 },
        delay: 0.08,
        ease: 'power2.inOut',
        inertia: false,
      },
    })

    // The scroller's shared scroll tween. The public type only declares
    // tweenTo(position), but the runtime accepts vars and exposes the live
    // tween on `.tween` — cast to reach both.
    const tweenScroll = snapTrigger.tweenTo as unknown as {
      (position: number, vars?: gsap.TweenVars): gsap.core.Tween
      tween?: gsap.core.Tween | 0
    }

    killGlide = () => {
      glideActive = false
      if (tweenScroll.tween) {
        tweenScroll.tween.kill()
        tweenScroll.tween = 0
      }
    }

    glideThroughPin = (pin: PinRange) => {
      glideActive = true
      const done = () => {
        glideActive = false
      }
      const playPin = () => {
        // Partial traversal (e.g. dot click from inside the pin) plays at the
        // same pace as a full one rather than stretching to fill the duration
        const remaining = Math.min(1, Math.abs(pin.end - window.scrollY) / (pin.end - pin.start))
        tweenScroll(pin.end, {
          duration: Math.max(0.6, PIN_PLAY_DURATION * remaining),
          ease: 'power1.inOut',
          onComplete: done,
          onInterrupt: done,
        })
      }
      const approach = pin.start - window.scrollY
      if (approach > 4) {
        tweenScroll(pin.start, {
          duration: gsap.utils.clamp(0.5, 1.4, (approach / window.innerHeight) * 0.8),
          ease: 'sine.out',
          // chained synchronously in onComplete — no gap for another snap
          // system to slip a competing tween into
          onComplete: playPin,
          onInterrupt: done,
        })
      } else {
        playPin()
      }
    }

    return () => {
      killGlide()
      glideThroughPin = null
      killGlide = () => {}
    }
  })

  // Recalculate trigger positions once late layout settles (fonts/images) —
  // otherwise triggers are measured against unloaded layout and misfire
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => refreshScrollTriggers()).catch(() => {})
  }
  window.addEventListener('load', refreshScrollTriggers, { once: true })
  // Comments/RSVP fetch after mount and grow their sections — a couple of
  // delayed re-measures keep every trigger honest without observers
  refreshTimers.push(
    setTimeout(refreshScrollTriggers, 1500),
    setTimeout(refreshScrollTriggers, 4000),
  )
})

const refreshTimers: ReturnType<typeof setTimeout>[] = []
onUnmounted(() => {
  refreshTimers.forEach(clearTimeout)
  killGlide()
})

// ---------------------------------------------------------------------------
// Google Calendar reminder (same behavior as the V1 showcase)
// ---------------------------------------------------------------------------
const handleReminder = () => {
  if (!props.event?.start_date) return

  const formatDateForGoogle = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '')

  const sanitizeText = (text: string, maxLength = 1000): string => {
    if (!text) return ''
    const cleaned = text
      .replace(/<[^>]*>/g, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return cleaned.length > maxLength ? `${cleaned.substring(0, maxLength)}...` : cleaned
  }

  const title = sanitizeText(props.event.title, 200)
  const description = sanitizeText(
    props.event.description || props.event.short_description || '',
    500,
  )
  const location = props.event.is_virtual
    ? props.event.virtual_link || 'Virtual Event'
    : sanitizeText(props.event.location || '', 200)

  const params = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(title)}`,
    `dates=${formatDateForGoogle(new Date(props.event.start_date))}/${formatDateForGoogle(new Date(props.event.end_date))}`,
    `details=${encodeURIComponent(description)}`,
    `location=${encodeURIComponent(location)}`,
    'trp=false',
  ].join('&')

  window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank')
}
</script>

<style scoped>
.v2-experience {
  min-height: 100svh;
  background:
    radial-gradient(140% 80% at 50% 0%, #fdfaf5 0%, var(--v2-ivory) 60%),
    var(--v2-ivory);
  color: var(--v2-charcoal);
  font-family: var(--v2-body);
  overflow-x: clip;
}

/* Prototype "card" chrome for the reused form sections */
.v2-card {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(168, 181, 160, 0.35);
  border-radius: 16px;
  padding: 24px;
}

.v2-register-btn {
  width: 100%;
  min-height: 44px;
  padding: 13px 26px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-family: var(--v2-body);
  font-size: 13px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: var(--v2-charcoal);
  color: var(--v2-ivory);
  transition: opacity 0.25s;
}

.v2-register-btn:hover,
.v2-register-btn:focus-visible {
  opacity: 0.85;
}

.v2-fab-host {
  pointer-events: none;
}

.v2-fab-host :deep(.v2-fab-root) {
  pointer-events: auto;
}
</style>
