<template>
  <div class="v2-fab-root">
    <!-- Scrim behind the overflow popover -->
    <Transition name="v2-fab-fade">
      <div v-if="showMore" class="v2-fab-scrim" @click="closeMore"></div>
    </Transition>

    <!-- Overflow popover: the other chapters (agenda/gallery/video/guestbook)
         plus language / reminder. Keeps the always-visible bar down to the
         handful of actions worth a permanent thumb target on mobile (music,
         map, gift, RSVP) — everything else is one tap away here -->
    <Transition name="v2-fab-pop">
      <div v-if="showMore" class="v2-fab-pop" @click.stop>
        <button v-if="hasAgenda" type="button" class="v2-fab-pop-item" @click="navigateFromMore('agenda')">
          <Calendar :size="18" />
          <span>{{ t('chapter_agenda') }}</span>
        </button>
        <button v-if="hasGallery" type="button" class="v2-fab-pop-item" @click="navigateFromMore('gallery')">
          <Image :size="18" />
          <span>{{ t('chapter_gallery') }}</span>
        </button>
        <button v-if="hasVideo" type="button" class="v2-fab-pop-item" @click="navigateFromMore('video')">
          <Play :size="18" />
          <span>{{ t('chapter_video') }}</span>
        </button>
        <button v-if="hasComments" type="button" class="v2-fab-pop-item" @click="navigateFromMore('comment')">
          <MessageCircle :size="18" />
          <span>{{ t('chapter_guestbook') }}</span>
        </button>
        <div
          v-if="(hasAgenda || hasGallery || hasVideo || hasComments)"
          class="v2-fab-pop-divider"
        ></div>
        <button
          v-if="displayLanguages.length > 1"
          type="button"
          class="v2-fab-pop-item"
          @click="openLanguagePicker"
        >
          <Languages :size="18" />
          <span>{{ t('fab_language') }}</span>
        </button>
        <button type="button" class="v2-fab-pop-item" @click="handleReminder">
          <Bell :size="18" />
          <span>{{ t('fab_reminder') }}</span>
        </button>
      </div>
    </Transition>

    <!-- Language picker sheet -->
    <Transition name="v2-fab-fade">
      <div
        v-if="showLanguagePicker"
        class="v2-fab-scrim v2-fab-scrim--center"
        @click="closeLanguagePicker"
      >
        <div class="v2-fab-lang-sheet" @click.stop>
          <h3 class="v2-fab-lang-title">{{ t('fab_select_language') }}</h3>
          <button
            v-for="lang in displayLanguages"
            :key="lang.code"
            type="button"
            class="v2-fab-lang-option"
            :class="{ 'v2-fab-lang-option--active': currentLanguage === lang.code }"
            @click="selectLanguage(lang.code)"
          >
            <span class="v2-fab-lang-flag">{{ lang.flag }}</span>
            <span>{{ lang.name }}</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Floating bottom tab bar. On touch devices it fades out while the
         page is scrolling and only reappears on a deliberate tap (not a
         scroll gesture) — desktop/mouse users keep it always visible -->
    <nav class="v2-fab-bar" :class="{ 'v2-fab-bar--hidden': barHidden }" aria-label="Quick actions">
      <button
        type="button"
        class="v2-fab-item"
        :class="{ 'v2-fab-item--active': showMore }"
        :aria-expanded="showMore"
        :aria-label="t('fab_more')"
        @click="toggleMore"
      >
        <MoreHorizontal :size="18" />
        <span class="v2-fab-tooltip">{{ t('fab_more') }}</span>
      </button>
      <button
        type="button"
        class="v2-fab-item"
        :aria-label="isMusicPlaying ? t('fab_music_on') : t('fab_music_off')"
        @click="handleMusicToggle"
      >
        <component :is="isMusicPlaying ? VolumeX : Volume2" :size="18" />
        <span class="v2-fab-tooltip">{{ isMusicPlaying ? t('fab_music_on') : t('fab_music_off') }}</span>
      </button>
      <button
        v-if="hasLocation"
        type="button"
        class="v2-fab-item"
        :aria-label="t('fab_map')"
        @click="$emit('location')"
      >
        <MapPin :size="18" />
        <span class="v2-fab-tooltip">{{ t('fab_map') }}</span>
      </button>
      <button
        v-if="hasPayment"
        type="button"
        class="v2-fab-item"
        :aria-label="t('chapter_gift')"
        @click="$emit('gift')"
      >
        <Gift :size="18" />
        <span class="v2-fab-tooltip">{{ t('chapter_gift') }}</span>
      </button>
      <button
        v-if="hasRsvp"
        type="button"
        class="v2-fab-item v2-fab-item--accent"
        :aria-label="t('chapter_rsvp')"
        @click="$emit('rsvp')"
      >
        <UserCheck :size="18" />
        <span class="v2-fab-tooltip">{{ t('chapter_rsvp') }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  MoreHorizontal,
  MapPin,
  Calendar,
  Image,
  Play,
  Gift,
  MessageCircle,
  UserCheck,
  Languages,
  Volume2,
  VolumeX,
  Bell,
} from 'lucide-vue-next'
import { translateV2, type V2TranslationKey, type V2CategoryTranslations } from '../../../composables/showcase-v2/v2Translations'

interface Props {
  currentLanguage?: string
  availableLanguages?: Array<{ id: number; language: string; language_display: string }>
  isMusicPlaying?: boolean
  hasLocation?: boolean
  hasAgenda?: boolean
  hasVideo?: boolean
  hasGallery?: boolean
  hasPayment?: boolean
  hasRsvp?: boolean
  hasComments?: boolean
  /** The active category variant's translation overrides (e.g. wedding's "Wedding Gift"). */
  categoryTranslations?: V2CategoryTranslations
}

const props = withDefaults(defineProps<Props>(), {
  currentLanguage: 'en',
  availableLanguages: () => [],
  isMusicPlaying: false,
  hasLocation: true,
  hasAgenda: true,
  hasVideo: true,
  hasGallery: true,
  hasPayment: true,
  hasRsvp: true,
  hasComments: true,
})

const emit = defineEmits<{
  languageChange: [language: string]
  musicToggle: [isPlaying: boolean]
  rsvp: []
  reminder: []
  gift: []
  agenda: []
  location: []
  video: []
  gallery: []
  comment: []
}>()

const t = (key: V2TranslationKey) => translateV2(key, props.currentLanguage, props.categoryTranslations)

const languageFlags: Record<string, string> = {
  en: '🇺🇸',
  kh: '🇰🇭',
  fr: '🇫🇷',
  ja: '🇯🇵',
  ko: '🇰🇷',
  'zh-cn': '🇨🇳',
  th: '🇹🇭',
  vn: '🇻🇳',
}

const displayLanguages = computed(() => {
  if (!props.availableLanguages || props.availableLanguages.length === 0) return []
  return props.availableLanguages.map((lang) => ({
    code: lang.language,
    name: lang.language_display,
    flag: languageFlags[lang.language] || '🌐',
  }))
})

const showMore = ref(false)
const showLanguagePicker = ref(false)

const toggleMore = () => {
  showMore.value = !showMore.value
}

const closeMore = () => {
  showMore.value = false
}

const openLanguagePicker = () => {
  showMore.value = false
  showLanguagePicker.value = true
}

const closeLanguagePicker = () => {
  showLanguagePicker.value = false
}

// ---------------------------------------------------------------------------
// Touch-only scroll-to-hide: fades the bar out while the page is scrolling
// and only brings it back on a deliberate tap (a `click` only fires for a
// real tap, not a scroll/drag gesture, so this never fights the hide). Mouse
// users (no coarse pointer) never see this — the bar stays put for them.
// ---------------------------------------------------------------------------
const barHidden = ref(false)
let touchMql: MediaQueryList | null = null

const handleScroll = () => {
  if (!touchMql?.matches) return
  barHidden.value = true
  closeMore()
  closeLanguagePicker()
}

const revealBar = () => {
  if (!touchMql?.matches) return
  barHidden.value = false
}

onMounted(() => {
  touchMql = window.matchMedia('(hover: none) and (pointer: coarse)')
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('click', revealBar)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('click', revealBar)
})

const selectLanguage = (language: string) => {
  emit('languageChange', language)
  closeLanguagePicker()
}

const handleMusicToggle = () => {
  emit('musicToggle', !props.isMusicPlaying)
}

const handleReminder = () => {
  emit('reminder')
  closeMore()
}

/** Chapters tucked into the overflow popover — emit the same nav event the
 * always-visible bar buttons used to, then close the popover. */
const navigateFromMore = (action: 'agenda' | 'gallery' | 'video' | 'comment') => {
  switch (action) {
    case 'agenda':
      emit('agenda')
      break
    case 'gallery':
      emit('gallery')
      break
    case 'video':
      emit('video')
      break
    case 'comment':
      emit('comment')
      break
  }
  closeMore()
}
</script>

<style scoped>
.v2-fab-root {
  font-family: var(--v2-body);
}

/* ---------- bottom bar ---------- */
.v2-fab-bar {
  position: fixed;
  left: 50%;
  bottom: calc(14px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 2px;
  max-width: calc(100vw - 24px);
  padding: 6px;
  border-radius: 999px;
  background: var(--v2-charcoal);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: opacity 0.25s ease, transform 0.25s ease;
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.28),
    0 2px 8px rgba(0, 0, 0, 0.18);
  overflow-x: auto;
  scrollbar-width: none;
}

.v2-fab-bar::-webkit-scrollbar {
  display: none;
}

.v2-fab-bar--hidden {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
  pointer-events: none;
}

.v2-fab-item {
  position: relative;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--v2-ivory);
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.2s ease, color 0.2s ease;
}

.v2-fab-item:hover,
.v2-fab-item:focus-visible {
  background: rgba(255, 255, 255, 0.12);
}

.v2-fab-item--active {
  background: rgba(255, 255, 255, 0.16);
}

.v2-fab-item--accent {
  background: var(--v2-blush);
  color: var(--v2-charcoal);
}

.v2-fab-item--accent:hover,
.v2-fab-item--accent:focus-visible {
  background: var(--v2-blush-deep);
  color: var(--v2-ivory);
}

/* Tooltip: hidden until hover (mouse) or held (touch — see the delayed
   :active rule below). Kept off pointer-events so it never intercepts the
   tap meant for the button underneath. */
.v2-fab-tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--v2-charcoal);
  color: var(--v2-ivory);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.v2-fab-item:hover .v2-fab-tooltip,
.v2-fab-item:focus-visible .v2-fab-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* Touch long-press: opacity only starts transitioning after ~450ms of
   :active. A quick tap releases :active well before that, so the pending
   transition never runs and no tooltip flashes on a normal tap — holding
   the button down is what reveals it. */
.v2-fab-item:active .v2-fab-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  transition-delay: 0.45s;
}

/* ---------- overflow popover ---------- */
.v2-fab-pop {
  position: fixed;
  left: 50%;
  /* Bar top sits at ~72px (14px offset + ~58px bar height) — add a clear
     16px gap above it so the popover reads as its own floating surface
     rather than a flush extension of the bar */
  bottom: calc(88px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 25;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 190px;
  max-width: calc(100vw - 32px);
  max-height: min(60vh, 420px);
  overflow-y: auto;
  padding: 8px;
  border-radius: 16px;
  background: var(--v2-ivory);
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.28);
}

.v2-fab-pop-divider {
  height: 1px;
  margin: 6px 4px;
  background: rgba(62, 58, 54, 0.12);
}

.v2-fab-pop-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--v2-charcoal);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;
}

.v2-fab-pop-item:hover,
.v2-fab-pop-item:focus-visible {
  background: rgba(62, 58, 54, 0.08);
}

/* ---------- scrims ---------- */
.v2-fab-scrim {
  position: fixed;
  inset: 0;
  z-index: 24;
  background: transparent;
}

.v2-fab-scrim--center {
  z-index: 26;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(62, 58, 54, 0.45);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}

/* ---------- language sheet ---------- */
.v2-fab-lang-sheet {
  width: min(92%, 340px);
  max-height: 70vh;
  overflow-y: auto;
  padding: 20px;
  border-radius: 18px;
  background: var(--v2-ivory);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
}

.v2-fab-lang-title {
  font-family: var(--v2-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--v2-charcoal);
  margin-bottom: 12px;
}

.v2-fab-lang-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 6px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: rgba(62, 58, 54, 0.04);
  color: var(--v2-charcoal);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.v2-fab-lang-option:last-child {
  margin-bottom: 0;
}

.v2-fab-lang-option:hover,
.v2-fab-lang-option:focus-visible {
  background: rgba(62, 58, 54, 0.08);
}

.v2-fab-lang-option--active {
  border-color: var(--v2-gold);
  background: rgba(201, 166, 107, 0.14);
}

.v2-fab-lang-flag {
  font-size: 18px;
}

/* ---------- transitions ---------- */
.v2-fab-fade-enter-active,
.v2-fab-fade-leave-active {
  transition: opacity 0.2s ease;
}

.v2-fab-fade-enter-from,
.v2-fab-fade-leave-to {
  opacity: 0;
}

.v2-fab-pop-enter-active,
.v2-fab-pop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.v2-fab-pop-enter-from,
.v2-fab-pop-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px) scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .v2-fab-fade-enter-active,
  .v2-fab-fade-leave-active,
  .v2-fab-pop-enter-active,
  .v2-fab-pop-leave-active,
  .v2-fab-bar {
    transition: none;
  }
}
</style>
