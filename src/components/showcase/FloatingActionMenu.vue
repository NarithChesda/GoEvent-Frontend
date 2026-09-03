<template>
  <div class="floating-action-menu" :style="menuVars">
    <!-- Blur Overlay -->
    <div v-if="isMenuOpen || showLanguageModal" class="blur-overlay" @click="closeAllMenus"></div>

    <!-- Floating Action Button -->
    <Transition name="fab">
      <button
        v-if="!isMenuOpen"
        @click="toggleMenu"
        class="fab-button"
        :class="{ 'fab-hidden': fabHidden }"
        :style="fabButtonStyle"
        :aria-label="translations.open"
        aria-haspopup="true"
      >
        <ChevronLeft :size="22" color="white" class="arrow-icon" />
      </button>
    </Transition>

    <!-- Menu Items -->
    <Transition name="menu">
      <div v-if="isMenuOpen" class="menu-container">
        <!-- Language Toggle -->
        <div v-if="displayLanguages.length > 1" class="menu-item">
          <button
            @click="handleLanguageToggle"
            class="menu-button"
          >
            <Languages :size="20" />
            <span class="menu-text">{{ translations.language }}</span>
          </button>
        </div>

        <!-- Music Toggle -->
        <div class="menu-item">
          <button
            @click="handleMusicToggle"
            class="menu-button"
            :class="{ active: props.isMusicPlaying }"
          >
            <component
              :is="props.isMusicPlaying ? VolumeX : Volume2"
              :size="20"
            />
            <span class="menu-text">{{
              props.isMusicPlaying ? translations.musicOff : translations.musicOn
            }}</span>
          </button>
        </div>

        <!-- RSVP with Location -->
        <div v-if="props.hasRsvp" class="menu-item">
          <button
            @click="handleRSVPWithLocation"
            class="menu-button"
          >
            <UserCheck :size="20" />
            <span class="menu-text">{{ translations.rsvp }}</span>
          </button>
        </div>

        <!-- Reminder -->
        <div class="menu-item">
          <button
            @click="handleReminder"
            class="menu-button"
          >
            <Bell :size="20" />
            <span class="menu-text">{{ translations.reminder }}</span>
          </button>
        </div>

        <!-- Agenda -->
        <div class="menu-item">
          <button
            @click="handleAgenda"
            class="menu-button"
          >
            <Calendar :size="20" />
            <span class="menu-text">{{ translations.agenda }}</span>
          </button>
        </div>

        <!-- Video -->
        <div v-if="props.hasVideo" class="menu-item">
          <button
            @click="handleVideo"
            class="menu-button"
          >
            <Play :size="20" />
            <span class="menu-text">{{ translations.video }}</span>
          </button>
        </div>

        <!-- Gallery -->
        <div v-if="props.hasGallery" class="menu-item">
          <button
            @click="handleGallery"
            class="menu-button"
          >
            <Image :size="20" />
            <span class="menu-text">{{ translations.gallery }}</span>
          </button>
        </div>

        <!-- Gift -->
        <div v-if="props.hasPayment" class="menu-item">
          <button
            @click="handleGift"
            class="menu-button"
          >
            <Gift :size="20" />
            <span class="menu-text">{{ translations.gift }}</span>
          </button>
        </div>

        <!-- Comment -->
        <div v-if="props.hasComments" class="menu-item">
          <button
            @click="handleComment"
            class="menu-button"
          >
            <MessageCircle :size="20" />
            <span class="menu-text">{{ translations.comment }}</span>
          </button>
        </div>

      </div>
    </Transition>

    <!-- Language Selection Modal -->
    <Transition name="modal">
      <div v-if="showLanguageModal" class="modal-overlay" @click="closeLanguageModal">
        <div class="language-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">
              {{ translations.selectLanguage }}
            </h3>
            <button @click="closeLanguageModal" class="close-button">
              <X :size="20" />
            </button>
          </div>
          <div class="language-options">
            <button
              v-for="lang in displayLanguages"
              :key="lang.code"
              @click="selectLanguage(lang.code)"
              class="language-option"
              :class="{ active: currentLanguage === lang.code }"
            >
              <span class="language-flag">{{ lang.flag }}</span>
              <span class="language-name">{{ lang.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  ChevronLeft,
  X,
  Languages,
  Volume2,
  VolumeX,
  UserCheck,
  Bell,
  Gift,
  Calendar,
  Play,
  Image,
  MessageCircle,
} from 'lucide-vue-next'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'

interface Props {
  primaryColor?: string
  accentColor?: string
  backgroundColor?: string
  currentLanguage?: string
  availableLanguages?: Array<{ id: number; language: string; language_display: string }>
  isMusicPlaying?: boolean
  hasLocation?: boolean
  hasVideo?: boolean
  hasGallery?: boolean
  hasPayment?: boolean
  hasRsvp?: boolean
  hasComments?: boolean
  eventType?: string
}


const props = withDefaults(defineProps<Props>(), {
  primaryColor: '#3B82F6',
  accentColor: '#8B5CF6',
  currentLanguage: 'en',
  availableLanguages: () => [],
  isMusicPlaying: false,
  hasLocation: true,
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

const isMenuOpen = ref(false)
const showLanguageModal = ref(false)

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
  if (!props.availableLanguages || props.availableLanguages.length === 0) {
    return []
  }

  return props.availableLanguages.map((lang) => ({
    code: lang.language,
    name: lang.language_display,
    flag: languageFlags[lang.language] || '🌐',
  }))
})

// Translation helpers - optimized with single computed property
const currentLang = computed(() => (props.currentLanguage as SupportedLanguage) || 'en')

// Single computed object for all translations (better performance - computed once)
const translations = computed(() => ({
  open: translateRSVP('floating_menu_open', currentLang.value),
  language: translateRSVP('floating_menu_language', currentLang.value),
  musicOn: translateRSVP('floating_menu_music_on', currentLang.value),
  musicOff: translateRSVP('floating_menu_music_off', currentLang.value),
  rsvp: translateRSVP('floating_menu_rsvp', currentLang.value),
  reminder: translateRSVP('floating_menu_reminder', currentLang.value),
  agenda: translateRSVP('floating_menu_agenda', currentLang.value),
  video: translateRSVP('floating_menu_video', currentLang.value),
  gallery: translateRSVP('floating_menu_gallery', currentLang.value),
  gift: translateRSVP('floating_menu_gift', currentLang.value),
  comment: translateRSVP(
    props.eventType?.toLowerCase() === 'funeral' ? 'floating_menu_comment_funeral' : 'floating_menu_comment',
    currentLang.value,
  ),
  selectLanguage: translateRSVP('floating_menu_select_language', currentLang.value),
}))

// Computed color for icons and borders
const themeColor = computed(() => props.backgroundColor || props.primaryColor)

// Computed styles for better performance (avoid recreating style objects on every render)
const fabButtonStyle = computed(() => ({
  background: themeColor.value,
  borderLeft: `2px solid ${themeColor.value}`,
  borderTop: `2px solid ${themeColor.value}`,
  borderBottom: `2px solid ${themeColor.value}`,
  borderRight: 'none',
}))

/**
 * The one colour the menu's material is tinted with.
 *
 * It is published as a custom property rather than bound per button because
 * the template's colour now reaches the menu as *light in the glass* — a wash
 * over a dark base — instead of as ink on the foreground. Icons and labels
 * used to be drawn in it directly, on a 10%-white pane over whatever the
 * background video happened to be showing: a deep template colour on that is
 * a dark mark on an unknown ground, which is the one combination that can
 * disappear completely. Colour belongs on a solid layer, contrast on the
 * foreground.
 */
const menuVars = computed<Record<string, string>>(() => ({
  '--fam-tint': themeColor.value,
}))

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const handleLanguageToggle = () => {
  if (displayLanguages.value.length > 1) {
    showLanguageModal.value = true
    isMenuOpen.value = false
  }
}

const closeLanguageModal = () => {
  showLanguageModal.value = false
}

const closeAllMenus = () => {
  isMenuOpen.value = false
  showLanguageModal.value = false
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeAllMenus()
  }
}

// Touch-only scroll-to-hide (mirrors the V2 floating action bar): fades the
// FAB out while the page is scrolling and only brings it back on a
// deliberate tap (a `click` only fires for a real tap, not a scroll/drag
// gesture, so this never fights the hide). Mouse users (no coarse pointer)
// never see this - the button stays put for them.
const fabHidden = ref(false)
let touchMql: MediaQueryList | null = null

const handleScroll = () => {
  if (!touchMql?.matches) return
  fabHidden.value = true
  closeAllMenus()
}

const revealFab = () => {
  if (!touchMql?.matches) return
  fabHidden.value = false
}

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
  touchMql = window.matchMedia('(hover: none) and (pointer: coarse)')
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('click', revealFab)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('click', revealFab)
})

const selectLanguage = (language: string) => {
  emit('languageChange', language)
  closeLanguageModal()
}

const handleMusicToggle = () => {
  emit('musicToggle', !props.isMusicPlaying)
  isMenuOpen.value = false
}

const handleRSVPWithLocation = () => {
  emit('rsvp')
  if (props.hasLocation) {
    emit('location')
  }
  isMenuOpen.value = false
}

const handleReminder = () => {
  emit('reminder')
  isMenuOpen.value = false
}

const handleGift = () => {
  emit('gift')
  isMenuOpen.value = false
}

const handleAgenda = () => {
  emit('agenda')
  isMenuOpen.value = false
}

const handleVideo = () => {
  emit('video')
  isMenuOpen.value = false
}

const handleGallery = () => {
  emit('gallery')
  isMenuOpen.value = false
}

const handleComment = () => {
  emit('comment')
  isMenuOpen.value = false
}
</script>

<style scoped>
.floating-action-menu {
  position: absolute;
  top: 50%;
  /* Fixed height (not shrink-to-fit) so the menu's percentage-based centering
     never shifts when the FAB button unmounts while the menu is open - the
     menu is positioned via top:50%/translateY(-50%) against THIS box, so its
     height must stay constant regardless of which child is present */
  height: 40px;
  margin-top: -20px; /* Half of FAB button height (40px) */
  right: 0;
  z-index: 9999;
}

/* Responsive positioning for different screen sizes */
@media (min-width: 640px) {
  .floating-action-menu {
    height: 48px;
    margin-top: -24px; /* Half of 48px */
  }
}

@media (min-width: 768px) {
  .floating-action-menu {
    height: 56px;
    margin-top: -28px; /* Half of 56px */
  }
}

/* 13" Laptops - Optimized positioning */
@media (min-width: 1280px) and (max-width: 1439px) {
  .floating-action-menu {
    height: 60px;
    margin-top: -30px; /* Half of 60px */
  }
}

/* 15" Laptops - Balanced positioning */
@media (min-width: 1440px) and (max-width: 1679px) {
  .floating-action-menu {
    height: 64px;
    margin-top: -32px; /* Half of 64px */
  }
}

/* 17" Laptops - Enhanced positioning */
@media (min-width: 1680px) and (max-width: 1919px) {
  .floating-action-menu {
    height: 72px;
    margin-top: -36px; /* Half of 72px */
  }
}

/* Desktop - Original positioning */
@media (min-width: 1920px) {
  .floating-action-menu {
    height: 52px;
    margin-top: -26px; /* Half of 52px */
  }
}

/* Small laptops 13-inch (1024px-1365px) - Apply mobile sizing 20% smaller */
@media (min-width: 1024px) and (max-width: 1365px) {
  .floating-action-menu {
    height: 36px !important;
    margin-top: -18px !important; /* Half of 36px */
  }

  .fab-button {
    width: 36px !important;
    height: 36px !important;
  }

  .fab-button svg {
    width: 20px !important;
    height: 20px !important;
  }

  .menu-container {
    gap: 0.125rem !important;
    min-width: 144px !important;
    max-height: 70vh !important;
  }

  .menu-button {
    gap: 0.4rem !important;
    padding: 0.6rem 0.8rem !important;
    border-radius: 0.6rem !important;
    min-height: 35px !important;
  }

  .menu-button svg {
    width: 16px !important;
    height: 16px !important;
  }

  .menu-text {
    font-size: 0.7rem !important;
  }

  /* Language modal - 20% smaller */
  .language-modal {
    width: 90% !important;
    max-width: 320px !important;
    border-radius: 0.8rem !important;
  }

  .modal-header {
    padding: 1.2rem !important;
  }

  .modal-title {
    font-size: 1rem !important;
  }

  .language-options {
    padding: 0.8rem !important;
    gap: 0.4rem !important;
  }

  .language-option {
    padding: 0.6rem !important;
    border-radius: 0.4rem !important;
  }

  .language-name {
    font-size: 0.7rem !important;
  }

  .language-flag {
    font-size: 1rem !important;
  }

  .close-button {
    width: 26px !important;
    height: 26px !important;
  }

  .close-button svg {
    width: 16px !important;
    height: 16px !important;
  }
}

.blur-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  /* Safari/iOS compatibility: -webkit prefix MUST come BEFORE standard property */
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  z-index: 9998;
  animation: fadeIn 0.2s ease-out;
  will-change: opacity;
}

.fab-button {
  width: 40px;
  height: 40px;
  border-radius: 50% 0 0 50%; /* Crescent/semi-circle shape */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: box-shadow 0.2s ease, opacity 0.25s ease, transform 0.18s cubic-bezier(0.23, 1, 0.32, 1);
  will-change: transform;
  touch-action: manipulation;
  position: relative;
  z-index: 10000;
  padding-left: 6px; /* Extra padding for arrow spacing */
  margin-right: 0; /* Ensure no margin on right */
  border-right: none; /* Remove right border */
}

/* Arrow icon animation */
.arrow-icon {
  animation: arrowPulse 2s ease-in-out infinite;
}

.fab-button:hover .arrow-icon {
  animation: arrowSlide 0.8s ease-in-out infinite;
}

@keyframes arrowPulse {
  0%, 100% {
    transform: translateX(0);
    opacity: 1;
  }
  50% {
    transform: translateX(-2px);
    opacity: 0.7;
  }
}

@keyframes arrowSlide {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-4px);
  }
}

/* Touch-only scroll-to-hide state (see handleScroll/revealFab) */
.fab-hidden {
  opacity: 0;
  transform: translateX(16px);
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .fab-button {
    transition: box-shadow 0.2s ease, opacity 0.15s ease;
  }

  .fab-hidden {
    transform: none;
  }

  .arrow-icon {
    animation: none;
  }
}

/* Responsive FAB button sizing - mobile-first approach */
@media (min-width: 640px) {
  .fab-button {
    width: 48px;
    height: 48px;
    padding-left: 8px;
  }
}

@media (min-width: 768px) {
  .fab-button {
    width: 56px;
    height: 56px;
    padding-left: 10px;
  }
}

/* 13" Laptops - Compact FAB */
@media (min-width: 1280px) and (max-width: 1439px) {
  .fab-button {
    width: 60px;
    height: 60px;
    padding-left: 10px;
  }
}

/* 15" Laptops - Balanced FAB */
@media (min-width: 1440px) and (max-width: 1679px) {
  .fab-button {
    width: 64px;
    height: 64px;
    padding-left: 12px;
  }
}

/* 17" Laptops - Enhanced FAB */
@media (min-width: 1680px) and (max-width: 1919px) {
  .fab-button {
    width: 72px;
    height: 72px;
    padding-left: 14px;
  }
}

/* Desktop - Original size */
@media (min-width: 1920px) {
  .fab-button {
    width: 52px;
    height: 52px;
    padding-left: 9px;
  }
}

/* Pointer-gated: on a touch screen :hover latches after a tap and does not
   release, which left the button sitting at 90% opacity for the rest of the
   session. */
@media (hover: hover) and (pointer: fine) {
  .fab-button:hover {
    opacity: 0.92;
  }
}

/* The press, on every device. */
.fab-button:active {
  transform: scale(0.94);
}

/* ---------------------------------------------------------------------------
 * The menu is ONE material, not nine.
 *
 * Every row used to be its own glass chip: `rgba(255,255,255,0.1)` with its own
 * `backdrop-filter` and a border in the template's colour. Three problems, all
 * of them the same problem — a light translucent surface with nothing solid
 * behind it:
 *
 *  - Legibility. White labels and template-coloured icons sat on 10% white over
 *    whatever frame of the background video happened to be underneath. On a
 *    pale frame the white text vanished; on a dark one the coloured icons did.
 *  - Cost. Nine backdrop-filters is nine compositor passes, on a phone, over a
 *    playing video.
 *  - Reading. Nine floating chips read as nine unrelated objects; a menu is one
 *    object with rows in it.
 *
 * So the panel is the material — dark base, template colour as a wash *in* the
 * glass, one blur — and the rows are plain elements drawn on it. The dark base
 * is what makes the foreground safe for any template palette and any video
 * frame, and it is heavier than the sheets inside the invitation on purpose:
 * this floats above everything, and weight is what says so.
 * ------------------------------------------------------------------------ */

.menu-container {
  position: absolute;
  top: 50%;
  right: 0.625rem;
  transform-origin: right center;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 180px;
  max-height: 70vh;
  padding: 0.375rem;
  border-radius: 1.125rem;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--fam-tint, #3b82f6) 26%, transparent),
      color-mix(in srgb, var(--fam-tint, #3b82f6) 11%, transparent)
    ),
    rgba(18, 18, 20, 0.58);
  /* Safari/iOS compatibility: -webkit prefix MUST come BEFORE standard property */
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  backdrop-filter: blur(30px) saturate(180%);
  box-shadow:
    /* light catching the top edge of the material */
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1),
    /* a big surface reads as thick: deeper shadow than any chip would carry */
    0 26px 60px -24px rgba(0, 0, 0, 0.7);
  z-index: 10001;
}

/* Responsive menu container sizing (position stays flush right - the FAB
   is hidden while the menu is open, so it no longer needs to reserve space) */
@media (min-width: 640px) {
  .menu-container {
    gap: 0.125rem;
    min-width: 190px;
    max-height: 75vh;
  }
}

@media (min-width: 768px) {
  .menu-container {
    gap: 0.125rem;
    min-width: 200px;
    max-height: 80vh;
  }
}

/* 13" Laptops - Compact menu */
@media (min-width: 1280px) and (max-width: 1439px) {
  .menu-container {
    gap: 0.125rem;
    min-width: 200px;
    max-height: 80vh;
  }
}

/* 15" Laptops - Balanced menu */
@media (min-width: 1440px) and (max-width: 1679px) {
  .menu-container {
    gap: 0.125rem;
    min-width: 220px;
    max-height: 85vh;
  }
}

/* 17" Laptops - Enhanced menu */
@media (min-width: 1680px) and (max-width: 1919px) {
  .menu-container {
    gap: 0.125rem;
    min-width: 240px;
    max-height: 85vh;
  }
}

/* Desktop - Original positioning */
@media (min-width: 1920px) {
  .menu-container {
    gap: 0.125rem;
    min-width: 200px;
    max-height: 85vh;
  }
}

/* The rows arrive after the panel, in sequence, from the edge the panel came
   from. The steps were 10ms apart — eleven rows inside 100ms, which is not a
   stagger, it is one frame of noise; 26ms is short enough to stay a single
   gesture and long enough to read as a sweep. */
.menu-item {
  transform: translateX(8px);
  opacity: 0;
  animation: slideFromRight 0.22s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}

.menu-item:nth-child(1) {
  animation-delay: 0.04s;
}
.menu-item:nth-child(2) {
  animation-delay: 0.066s;
}
.menu-item:nth-child(3) {
  animation-delay: 0.092s;
}
.menu-item:nth-child(4) {
  animation-delay: 0.118s;
}
.menu-item:nth-child(5) {
  animation-delay: 0.144s;
}
.menu-item:nth-child(6) {
  animation-delay: 0.17s;
}
.menu-item:nth-child(7) {
  animation-delay: 0.196s;
}
.menu-item:nth-child(8) {
  animation-delay: 0.222s;
}
.menu-item:nth-child(9) {
  animation-delay: 0.248s;
}
.menu-item:nth-child(10) {
  animation-delay: 0.274s;
}
.menu-item:nth-child(11) {
  animation-delay: 0.3s;
}

/* A row on the panel, not an object of its own: no border, no fill at rest and
   no blur — the panel behind it is already the material. Icons inherit
   `currentColor`, so the label and the glyph are guaranteed the same contrast
   as each other on every template. */
.menu-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 0;
  border-radius: 0.75rem;
  cursor: pointer;
  background: transparent;
  color: #ffffff;
  transition:
    background-color 0.18s ease,
    transform 0.12s cubic-bezier(0.23, 1, 0.32, 1);
  min-height: 44px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Feedback lands on the press, not on release — and it is the only state a
   touch guest ever sees, since :hover latches on a touch screen and would
   leave a row lit until something else is tapped. */
.menu-button:active {
  background-color: rgba(255, 255, 255, 0.22);
  transform: scale(0.985);
}

.menu-button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.8);
  outline-offset: -2px;
}

/* Responsive menu button sizing - mobile-first approach */
@media (min-width: 640px) {
  .menu-button {
    gap: 0.625rem;
    padding: 0.8125rem 1.125rem;
    border-radius: 0.8125rem;
  }
}

@media (min-width: 768px) {
  .menu-button {
    gap: 0.75rem;
    padding: 0.875rem 1.25rem;
    border-radius: 0.875rem;
  }
}

/* 13" Laptops - Compact buttons */
@media (min-width: 1280px) and (max-width: 1439px) {
  .menu-button {
    gap: 0.625rem;
    padding: 0.6875rem 0.875rem;
    border-radius: 0.6875rem;
  }
}

/* 15" Laptops - Balanced buttons */
@media (min-width: 1440px) and (max-width: 1679px) {
  .menu-button {
    gap: 0.75rem;
    padding: 0.8125rem 1.125rem;
    border-radius: 0.8125rem;
  }
}

/* 17" Laptops - Enhanced buttons */
@media (min-width: 1680px) and (max-width: 1919px) {
  .menu-button {
    gap: 0.875rem;
    padding: 0.875rem 1.25rem;
    border-radius: 0.875rem;
  }
}

/* Desktop - Original sizing */
@media (min-width: 1920px) {
  .menu-button {
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
  }
}

@media (hover: hover) and (pointer: fine) {
  .menu-button:hover {
    background-color: rgba(255, 255, 255, 0.13);
  }
}

/* Music playing. A brighter white fill rather than the template colour: the
   tint can be any hue at any lightness, and a state that is unreadable on some
   templates is not a state. */
.menu-button.active {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Vibrancy: over a translucent material, weight and a touch of tracking carry
   legibility that a flat grey never could. */
.menu-text {
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

/* Responsive menu text sizing - mobile-first approach */
@media (min-width: 640px) {
  .menu-text {
    font-size: 0.9375rem;
  }
}

@media (min-width: 768px) {
  .menu-text {
    font-size: 1rem;
  }
}

/* 13" Laptops - Compact text */
@media (min-width: 1280px) and (max-width: 1439px) {
  .menu-text {
    font-size: 0.8125rem;
  }
}

/* 15" Laptops - Balanced text */
@media (min-width: 1440px) and (max-width: 1679px) {
  .menu-text {
    font-size: 0.9375rem;
  }
}

/* 17" Laptops - Enhanced text */
@media (min-width: 1680px) and (max-width: 1919px) {
  .menu-text {
    font-size: 1rem;
  }
}

/* Desktop - Original size */
@media (min-width: 1920px) {
  .menu-text {
    font-size: 0.875rem;
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10002;
  /* Safari/iOS compatibility: -webkit prefix MUST come BEFORE standard property */
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}

/* Same material as the menu — a modal that arrived in a different substance
   from the menu that opened it reads as a different app. */
.language-modal {
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  border-radius: 1.25rem;
  border: 0;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--fam-tint, #3b82f6) 24%, transparent),
      color-mix(in srgb, var(--fam-tint, #3b82f6) 10%, transparent)
    ),
    rgba(18, 18, 20, 0.62);
  -webkit-backdrop-filter: blur(34px) saturate(180%);
  backdrop-filter: blur(34px) saturate(180%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.26),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1),
    0 32px 70px -26px rgba(0, 0, 0, 0.75);
  overflow: hidden;
  z-index: 10003;
  position: relative;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #ffffff;
  margin: 0;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 0;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
  color: #ffffff;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    transform 0.12s cubic-bezier(0.23, 1, 0.32, 1);
}

.close-button:active {
  background: rgba(255, 255, 255, 0.28);
  transform: scale(0.94);
}

@media (hover: hover) and (pointer: fine) {
  .close-button:hover {
    background: rgba(255, 255, 255, 0.22);
  }
}

.language-options {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem;
  border: 0;
  border-radius: 0.625rem;
  cursor: pointer;
  color: #ffffff;
  background: transparent;
  transition:
    background-color 0.18s ease,
    transform 0.12s cubic-bezier(0.23, 1, 0.32, 1);
  -webkit-tap-highlight-color: transparent;
}

.language-option:active {
  transform: scale(0.985);
  background-color: rgba(255, 255, 255, 0.22);
}

@media (hover: hover) and (pointer: fine) {
  .language-option:hover {
    background-color: rgba(255, 255, 255, 0.12);
  }
}

/* The chosen language. A white fill plus a check-weight label, for the same
   reason the menu's active row is white: the template colour is unknown and
   may be invisible on this material. */
.language-option.active {
  background-color: rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
}

.language-option.active .language-name {
  font-weight: 600;
}

.language-flag {
  font-size: 1.25rem;
}

.language-name {
  font-size: 0.875rem;
  font-weight: 500;
}

/* Animations */
@keyframes slideFromRight {
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Menu swipes in from the edge where the FAB sits (Samsung edge-panel
   style) - a slide + gentle scale, not a bounce, so it reads as smooth
   rather than springy. */
/* The panel materializes rather than fading: the blur comes up with the scale,
   so it reads as a pane of glass arriving in front of the invitation instead of
   a rectangle whose opacity changed. */
.menu-enter-active {
  transition:
    transform 0.32s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.28s ease,
    -webkit-backdrop-filter 0.32s ease,
    backdrop-filter 0.32s ease;
}

.menu-leave-active {
  transition:
    transform 0.22s cubic-bezier(0.4, 0, 0.6, 1),
    opacity 0.18s ease,
    -webkit-backdrop-filter 0.18s ease,
    backdrop-filter 0.18s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(24px) scale(0.96);
  -webkit-backdrop-filter: blur(0px) saturate(100%);
  backdrop-filter: blur(0px) saturate(100%);
}

/* FAB tucks away toward the edge right as the menu swipes out */
.fab-enter-active,
.fab-leave-active {
  transition: transform 0.2s ease-out, opacity 0.18s ease;
}

.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: translateX(10px) scale(0.85);
}

@media (prefers-reduced-motion: reduce) {
  .menu-enter-active,
  .menu-leave-active,
  .fab-enter-active,
  .fab-leave-active {
    transition: opacity 0.15s ease;
  }

  .menu-enter-from,
  .menu-leave-to {
    transform: translateY(-50%);
    /* The material stays formed; only the cross-fade is left. */
    -webkit-backdrop-filter: blur(30px) saturate(180%);
    backdrop-filter: blur(30px) saturate(180%);
  }

  .fab-enter-from,
  .fab-leave-to {
    transform: none;
  }

  /* The rows still fade, together, and no longer travel. */
  .menu-item {
    transform: none;
    animation: fadeIn 0.15s ease-out forwards;
    animation-delay: 0s !important;
  }

  .menu-button:active,
  .language-option:active,
  .close-button:active,
  .fab-button:active {
    transform: none;
  }

  .modal-enter-from .language-modal,
  .modal-leave-to .language-modal {
    transform: none;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .language-modal,
.modal-leave-to .language-modal {
  transform: scale(0.95) translateY(20px);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .menu-container {
    min-width: 180px;
    max-height: 65vh;
  }

  .language-modal {
    width: 95%;
    margin: 0 1rem;
  }
}

/* Custom scrollbar for language options */
.language-options::-webkit-scrollbar {
  width: 4px;
}

.language-options::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.language-options::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.language-options::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Hide scrollbar for menu container */
.menu-container::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}

.menu-container::-webkit-scrollbar-track {
  background: transparent;
}

.menu-container::-webkit-scrollbar-thumb {
  background: transparent;
}

.menu-container::-webkit-scrollbar-thumb:hover {
  background: transparent;
}

/* Firefox scrollbar hiding */
.menu-container {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* The `.glass-section` / `.glass-inner` / `.glass-button-primary` utilities that
   used to live here are gone with the light-glass look they described. They
   were also a cascade trap: defined at the very end of the file at the same
   specificity as the component rules above, so whichever surface carried one
   silently won the argument about its own background. */

@media (prefers-reduced-transparency: reduce) {
  .menu-container,
  .language-modal {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    background: color-mix(in srgb, var(--fam-tint, #3b82f6) 22%, rgb(18, 18, 20));
  }

  .blur-overlay {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    background: rgba(0, 0, 0, 0.72);
  }
}

@media (prefers-contrast: more) {
  .menu-container,
  .language-modal {
    background: color-mix(in srgb, var(--fam-tint, #3b82f6) 18%, rgb(10, 10, 12));
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.45),
      0 26px 60px -24px rgba(0, 0, 0, 0.8);
  }
}
</style>
