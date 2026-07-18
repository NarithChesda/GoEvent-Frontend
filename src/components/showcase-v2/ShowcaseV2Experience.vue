<template>
  <div ref="rootEl" class="v2-experience relative" :style="cssVars">
    <!-- Drifting petal parallax layer (behind everything) -->
    <V2PetalField />

    <!-- Envelope cover gate -->
    <V2CoverGate
      v-if="showCover"
      :event-title="event.title"
      :couple-names="coupleNames"
      :monogram="monogram"
      :guest-name="guestName"
      :current-language="currentLanguage"
      @opened="handleCoverOpened"
    />

    <main class="relative">
      <!-- 1 · Hero -->
      <V2HeroSection
        :event-title="event.title"
        :couple-names="coupleNames"
        :start-date="event.start_date"
        :date-line="dateLine"
        :location-line="locationLine"
        :show-countdown="event.countdown_enabled !== false"
        :active="heroActive"
        :current-language="currentLanguage"
      />

      <!-- 2 · Our Story (pinned 3D scroll storytelling) -->
      <V2StorySection
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
      <V2ChapterShell
        v-if="hasChapter('payment-section')"
        section-id="payment-section"
        :chapter-number="chapterNumber('payment-section')"
        :title="t('chapter_gift')"
        :current-language="currentLanguage"
      >
        <div class="v2-card">
          <PaymentSection
            ref="paymentRef"
            :payment-methods="paymentMethods"
            :primary-color="palette.charcoal"
            :secondary-color="palette.sageDeep"
            :accent-color="palette.gold"
            :current-font="fonts.body"
            :primary-font="fonts.body"
            :secondary-font="fonts.display"
            :get-media-url="getMediaUrl"
            :event-category="event.category"
            :event-category-name="event.category_name || undefined"
            :event-category-details="event.category_details"
            :event-texts="eventTexts"
            :current-language="currentLanguage"
          />
        </div>
      </V2ChapterShell>

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

    <!-- Mobile quick-jump / language / music menu (fixed viewport host).
         The host stays transparent to pointer events; only the menu subtree
         re-enables them (see .v2-fam-host below) so page content stays clickable -->
    <div class="pointer-events-none fixed inset-0 z-[70]">
      <div class="v2-fam-host relative h-full w-full">
        <FloatingActionMenu
          :primary-color="palette.charcoal"
          :accent-color="palette.gold"
          :background-color="palette.ivory"
          :current-language="currentLanguage"
          :available-languages="availableLanguages"
          :is-music-playing="isMusicPlaying"
          :is-authenticated="isAuthenticated"
          :has-location="!!event.google_map_embed_link"
          :has-video="!!event.youtube_embed_link"
          :has-gallery="eventPhotos.length > 0"
          :has-payment="paymentMethods.length > 0"
          :has-rsvp="event.rsvp_enabled !== false"
          :has-comments="event.comments_enabled !== false"
          :event-type="eventType"
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
          @logout="$emit('logout')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

// V2 presentation components (self-contained Storybook Romance theme)
import V2PetalField from './V2PetalField.vue'
import V2CoverGate from './V2CoverGate.vue'
import V2HeroSection from './V2HeroSection.vue'
import V2StorySection from './V2StorySection.vue'
import V2ChapterShell from './V2ChapterShell.vue'
import V2AgendaSection from './V2AgendaSection.vue'
import V2GallerySection from './V2GallerySection.vue'
import V2VenueSection from './V2VenueSection.vue'
import V2RSVPSection from './V2RSVPSection.vue'
import V2GuestRSVPSection from './V2GuestRSVPSection.vue'
import V2GuestbookSection from './V2GuestbookSection.vue'
import V2FooterSection from './V2FooterSection.vue'
import V2ProgressDots, { type ProgressSection } from './V2ProgressDots.vue'

// Reused data-bound showcase components (forms/logic only — styled via the
// V2 palette props, never event template data)
import DressCodeSection from '../showcase/DressCodeSection.vue'
import YouTubeVideoSection from '../showcase/YouTubeVideoSection.vue'
import PaymentSection from '../showcase/PaymentSection.vue'
import FloatingActionMenu from '../showcase/FloatingActionMenu.vue'

import { useScrollStory, refreshScrollTriggers } from '../../composables/showcase-v2/useScrollStory'
import { translateV2, type V2TranslationKey } from '../../composables/showcase-v2/v2Translations'
import { V2_COLORS, V2_FONTS, V2_CSS_VARS } from '../../composables/showcase-v2/v2Theme'
import { formatDateLocalized, type SupportedLanguage } from '../../utils/translations'
import type {
  EventData,
  EventText,
  Host,
  AgendaItem,
  EventPhoto,
  DressCode,
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
  logout: []
  showAuthModal: []
  commentSubmitted: [comment: unknown]
  register: []
  videoStateChange: [isPlaying: boolean]
  mainContentViewed: []
}>()

const rootEl = ref<HTMLElement | null>(null)
const { createStory } = useScrollStory(rootEl)

const t = (key: V2TranslationKey) => translateV2(key, props.currentLanguage)
const lang = computed(() => (props.currentLanguage as SupportedLanguage) || 'en')

// Fixed Storybook Romance theme — no event template data
const palette = V2_COLORS
const fonts = V2_FONTS
const cssVars = V2_CSS_VARS

// ---------------------------------------------------------------------------
// Cover gate / hero hand-off
// ---------------------------------------------------------------------------
const showCover = ref(!props.skipCover)
const heroActive = ref(props.skipCover === true)

const handleCoverOpened = () => {
  showCover.value = false
  heroActive.value = true
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
const eventType = computed(
  () => props.event.category_details?.name || props.event.category_name || 'default',
)

// Wedding hosts are typically the couple — join the first two names
const coupleNames = computed(() => {
  const names = props.hosts
    .slice(0, 2)
    .map((h) => h.name)
    .filter(Boolean)
  return names.length ? names.join(' & ') : undefined
})

const monogram = computed(() => {
  const names = props.hosts
    .slice(0, 2)
    .map((h) => h.name?.trim().charAt(0))
    .filter(Boolean)
  if (names.length === 2) return `${names[0]} · ${names[1]}`
  return props.event.title?.trim().charAt(0) || '♥'
})

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

const scrollToSection = (sectionId: string) => {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  })
}

const paymentRef = ref<InstanceType<typeof PaymentSection> | null>(null)
const handleGift = () => {
  scrollToSection('payment-section')
  nextTick(() => paymentRef.value?.expandFirstCard?.())
}

onMounted(async () => {
  await nextTick()
  // One lightweight trigger per chapter drives the progress rail — the same
  // instances the dots read from (no second observer set)
  createStory(({ ScrollTrigger }) => {
    chapters.value.forEach((chapter) => {
      const el = document.getElementById(chapter.id)
      if (!el) return
      ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (self.isActive) activeSectionId.value = chapter.id
        },
      })
    })
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
onUnmounted(() => refreshTimers.forEach(clearTimeout))

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

.v2-fam-host {
  pointer-events: none;
}

.v2-fam-host :deep(.floating-action-menu) {
  pointer-events: auto;
}
</style>
