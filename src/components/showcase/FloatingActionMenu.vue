<template>
  <div class="floating-action-menu">
    <!-- Blur Overlay -->
    <div v-if="isMenuOpen || showLanguageModal" class="blur-overlay" @click="closeAllMenus"></div>

    <!-- Floating Action Button -->
    <button
      @click="toggleMenu"
      class="fab-button"
      :class="{ active: isMenuOpen }"
      :style="fabButtonStyle"
    >
      <component
        :is="isMenuOpen ? ChevronRight : ChevronLeft"
        :size="22"
        color="white"
        class="arrow-icon"
      />
    </button>

    <!-- Menu Items -->
    <Transition name="menu">
      <div v-if="isMenuOpen" class="menu-container">
        <!-- Language Toggle -->
        <div v-if="displayLanguages.length > 1" class="menu-item">
          <button
            @click="handleLanguageToggle"
            class="menu-button glass-section"
            :style="menuButtonStyle"
          >
            <Languages :size="20" :color="themeColor" />
            <span class="menu-text">{{ translations.language }}</span>
          </button>
        </div>

        <!-- Music Toggle -->
        <div class="menu-item">
          <button
            @click="handleMusicToggle"
            class="menu-button glass-section"
            :class="{ active: props.isMusicPlaying }"
            :style="menuButtonStyle"
          >
            <component
              :is="props.isMusicPlaying ? VolumeX : Volume2"
              :size="20"
              :color="themeColor"
            />
            <span class="menu-text">{{
              props.isMusicPlaying ? translations.musicOff : translations.musicOn
            }}</span>
          </button>
        </div>

        <!-- RSVP with Location -->
        <div class="menu-item">
          <button
            @click="handleRSVPWithLocation"
            class="menu-button glass-section"
            :style="menuButtonStyle"
          >
            <UserCheck :size="20" :color="themeColor" />
            <span class="menu-text">{{ translations.rsvp }}</span>
          </button>
        </div>

        <!-- Reminder -->
        <div class="menu-item">
          <button
            @click="handleReminder"
            class="menu-button glass-section"
            :style="menuButtonStyle"
          >
            <Bell :size="20" :color="themeColor" />
            <span class="menu-text">{{ translations.reminder }}</span>
          </button>
        </div>

        <!-- Agenda -->
        <div class="menu-item">
          <button
            @click="handleAgenda"
            class="menu-button glass-section"
            :style="menuButtonStyle"
          >
            <Calendar :size="20" :color="themeColor" />
            <span class="menu-text">{{ translations.agenda }}</span>
          </button>
        </div>

        <!-- Video -->
        <div v-if="props.hasVideo" class="menu-item">
          <button
            @click="handleVideo"
            class="menu-button glass-section"
            :style="menuButtonStyle"
          >
            <Play :size="20" :color="themeColor" />
            <span class="menu-text">{{ translations.video }}</span>
          </button>
        </div>

        <!-- Gallery -->
        <div v-if="props.hasGallery" class="menu-item">
          <button
            @click="handleGallery"
            class="menu-button glass-section"
            :style="menuButtonStyle"
          >
            <Image :size="20" :color="themeColor" />
            <span class="menu-text">{{ translations.gallery }}</span>
          </button>
        </div>

        <!-- Gift -->
        <div v-if="props.hasPayment" class="menu-item">
          <button
            @click="handleGift"
            class="menu-button glass-section"
            :style="menuButtonStyle"
          >
            <Gift :size="20" :color="themeColor" />
            <span class="menu-text">{{ translations.gift }}</span>
          </button>
        </div>

        <!-- Comment -->
        <div class="menu-item">
          <button
            @click="handleComment"
            class="menu-button glass-section"
            :style="menuButtonStyle"
          >
            <MessageCircle :size="20" :color="themeColor" />
            <span class="menu-text">{{ translations.comment }}</span>
          </button>
        </div>

        <!-- Logout (only show if authenticated) -->
        <div v-if="props.isAuthenticated" class="menu-item">
          <button
            @click="handleLogout"
            class="menu-button glass-section logout-button"
            :style="logoutButtonStyle"
          >
            <LogOut :size="20" color="white" />
            <span class="menu-text">{{ translations.logout }}</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Language Selection Modal -->
    <Transition name="modal">
      <div v-if="showLanguageModal" class="modal-overlay" @click="closeLanguageModal">
        <div class="language-modal glass-section" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title" :style="modalTitleStyle">
              {{ translations.selectLanguage }}
            </h3>
            <button @click="closeLanguageModal" class="close-button">
              <X :size="20" :color="themeColor" />
            </button>
          </div>
          <div class="language-options">
            <button
              v-for="lang in displayLanguages"
              :key="lang.code"
              @click="selectLanguage(lang.code)"
              class="language-option glass-inner"
              :class="{ active: currentLanguage === lang.code }"
              :style="{
                borderColor: currentLanguage === lang.code ? themeColor : 'transparent',
                color: currentLanguage === lang.code ? themeColor : 'white',
              }"
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
import { ref, computed } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
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
  LogOut,
} from 'lucide-vue-next'
import { translateRSVP, type SupportedLanguage } from '../../utils/translations'

interface Props {
  primaryColor?: string
  accentColor?: string
  backgroundColor?: string
  currentLanguage?: string
  availableLanguages?: Array<{ id: number; language: string; language_display: string }>
  isMusicPlaying?: boolean
  isAuthenticated?: boolean
  hasLocation?: boolean
  hasVideo?: boolean
  hasGallery?: boolean
  hasPayment?: boolean
}

interface Language {
  code: string
  name: string
  flag: string
}

const props = withDefaults(defineProps<Props>(), {
  primaryColor: '#3B82F6',
  accentColor: '#8B5CF6',
  currentLanguage: 'en',
  availableLanguages: () => [],
  isMusicPlaying: false,
  isAuthenticated: false,
  hasLocation: true,
  hasVideo: true,
  hasGallery: true,
  hasPayment: true,
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
  logout: []
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
  language: translateRSVP('floating_menu_language', currentLang.value),
  musicOn: translateRSVP('floating_menu_music_on', currentLang.value),
  musicOff: translateRSVP('floating_menu_music_off', currentLang.value),
  rsvp: translateRSVP('floating_menu_rsvp', currentLang.value),
  reminder: translateRSVP('floating_menu_reminder', currentLang.value),
  agenda: translateRSVP('floating_menu_agenda', currentLang.value),
  video: translateRSVP('floating_menu_video', currentLang.value),
  gallery: translateRSVP('floating_menu_gallery', currentLang.value),
  gift: translateRSVP('floating_menu_gift', currentLang.value),
  comment: translateRSVP('floating_menu_comment', currentLang.value),
  logout: translateRSVP('floating_menu_logout', currentLang.value),
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

const menuButtonStyle = computed(() => ({
  borderColor: themeColor.value,
}))

const logoutButtonStyle = computed(() => ({
  borderColor: themeColor.value,
  background: themeColor.value,
}))

const modalTitleStyle = computed(() => ({
  color: themeColor.value,
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

const handleLogout = () => {
  emit('logout')
  isMenuOpen.value = false
}
</script>

<style scoped>
.floating-action-menu {
  position: absolute;
  top: 50%;
  margin-top: -20px; /* Half of FAB button height (40px) */
  right: 0;
  z-index: 9999;
}

/* Responsive positioning for different screen sizes */
@media (min-width: 640px) {
  .floating-action-menu {
    margin-top: -24px; /* Half of 48px */
  }
}

@media (min-width: 768px) {
  .floating-action-menu {
    margin-top: -28px; /* Half of 56px */
  }
}

/* 13" Laptops - Optimized positioning */
@media (min-width: 1280px) and (max-width: 1439px) {
  .floating-action-menu {
    margin-top: -30px; /* Half of 60px */
  }
}

/* 15" Laptops - Balanced positioning */
@media (min-width: 1440px) and (max-width: 1679px) {
  .floating-action-menu {
    margin-top: -32px; /* Half of 64px */
  }
}

/* 17" Laptops - Enhanced positioning */
@media (min-width: 1680px) and (max-width: 1919px) {
  .floating-action-menu {
    margin-top: -36px; /* Half of 72px */
  }
}

/* Desktop - Original positioning */
@media (min-width: 1920px) {
  .floating-action-menu {
    margin-top: -26px; /* Half of 52px */
  }
}

/* Small laptops 13-inch (1024px-1365px) - Apply mobile sizing 20% smaller */
@media (min-width: 1024px) and (max-width: 1365px) {
  .floating-action-menu {
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
    right: calc(36px + 0.5rem) !important;
    gap: 0.4rem !important;
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
  transition: box-shadow 0.2s ease;
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

.fab-button.active .arrow-icon {
  animation: none;
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

.fab-button:hover {
  opacity: 0.9;
}

.menu-container {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: calc(40px + 0.5rem);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 180px;
  max-height: 70vh;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 10001;
}

/* Responsive menu container positioning */
@media (min-width: 640px) {
  .menu-container {
    right: calc(48px + 0.5rem);
    gap: 0.625rem;
    min-width: 190px;
    max-height: 75vh;
  }
}

@media (min-width: 768px) {
  .menu-container {
    right: calc(56px + 0.5rem);
    gap: 0.75rem;
    min-width: 200px;
    max-height: 80vh;
  }
}

/* 13" Laptops - Compact menu */
@media (min-width: 1280px) and (max-width: 1439px) {
  .menu-container {
    right: calc(60px + 0.5rem);
    gap: 0.625rem;
    min-width: 200px;
    max-height: 80vh;
  }
}

/* 15" Laptops - Balanced menu */
@media (min-width: 1440px) and (max-width: 1679px) {
  .menu-container {
    right: calc(64px + 0.5rem);
    gap: 0.75rem;
    min-width: 220px;
    max-height: 85vh;
  }
}

/* 17" Laptops - Enhanced menu */
@media (min-width: 1680px) and (max-width: 1919px) {
  .menu-container {
    right: calc(72px + 0.5rem);
    gap: 0.875rem;
    min-width: 240px;
    max-height: 85vh;
  }
}

/* Desktop - Original positioning */
@media (min-width: 1920px) {
  .menu-container {
    right: calc(52px + 0.5rem);
    gap: 0.75rem;
    min-width: 200px;
    max-height: 85vh;
  }
}

.menu-item {
  transform: translateX(10px);
  opacity: 0;
  animation: slideFromRight 0.15s ease-out forwards;
  will-change: transform, opacity;
}

.menu-item:nth-child(1) {
  animation-delay: 0s;
}
.menu-item:nth-child(2) {
  animation-delay: 0.01s;
}
.menu-item:nth-child(3) {
  animation-delay: 0.02s;
}
.menu-item:nth-child(4) {
  animation-delay: 0.03s;
}
.menu-item:nth-child(5) {
  animation-delay: 0.04s;
}
.menu-item:nth-child(6) {
  animation-delay: 0.05s;
}
.menu-item:nth-child(7) {
  animation-delay: 0.06s;
}
.menu-item:nth-child(8) {
  animation-delay: 0.07s;
}
.menu-item:nth-child(9) {
  animation-delay: 0.08s;
}
.menu-item:nth-child(10) {
  animation-delay: 0.09s;
}
.menu-item:nth-child(11) {
  animation-delay: 0.1s;
}

.menu-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
  background: rgba(255, 255, 255, 0.1);
  /* Safari/iOS compatibility: -webkit prefix MUST come BEFORE standard property */
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  min-height: 44px;
  will-change: transform;
  touch-action: manipulation;
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

.menu-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(4px);
}

.menu-button.active {
  background: rgba(255, 255, 255, 0.3);
}

.menu-text {
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
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

.language-modal {
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  overflow: hidden;
  z-index: 10003;
  position: relative;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
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
  border: 1px solid transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
}

.language-option:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.language-option.active {
  background: rgba(255, 255, 255, 0.2);
  border-color: currentColor;
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

.menu-enter-active,
.menu-leave-active {
  transition: all 0.2s ease;
}

.menu-enter-from {
  opacity: 0;
  transform: translateY(-50%) translateX(20px) scale(0.95);
}

.menu-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(20px) scale(0.95);
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

/* Glass section styles */
.glass-section {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  /* Safari/iOS compatibility: -webkit prefix MUST come BEFORE standard property */
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

/* Logout button specific styles */
.logout-button {
  /* Reverse style - filled background instead of transparent */
}

.logout-button:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: currentColor !important;
  transform: translateX(-4px);
}

.logout-button .menu-text {
  color: white;
  font-weight: 600;
}

.glass-inner {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  /* Safari/iOS compatibility: -webkit prefix MUST come BEFORE standard property */
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.glass-button-primary {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
</style>
