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
        :is="isMenuOpen ? X : Menu"
        :size="24"
        color="white"
        class="transition-transform duration-150"
        :class="{ 'rotate-90': isMenuOpen }"
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
            <Languages :size="20" :color="primaryColor" />
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
              :color="primaryColor"
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
            <UserCheck :size="20" :color="primaryColor" />
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
            <Bell :size="20" :color="primaryColor" />
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
            <Calendar :size="20" :color="primaryColor" />
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
            <Play :size="20" :color="primaryColor" />
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
            <Image :size="20" :color="primaryColor" />
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
            <Gift :size="20" :color="primaryColor" />
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
            <MessageCircle :size="20" :color="primaryColor" />
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
              <X :size="20" :color="primaryColor" />
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
                borderColor: currentLanguage === lang.code ? primaryColor : 'transparent',
                color: currentLanguage === lang.code ? primaryColor : 'white',
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
  Menu,
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

// Computed styles for better performance (avoid recreating style objects on every render)
const fabButtonStyle = computed(() => ({
  background: props.primaryColor,
  border: `2px solid ${props.primaryColor}`,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
}))

const menuButtonStyle = computed(() => ({
  borderColor: props.primaryColor,
}))

const logoutButtonStyle = computed(() => ({
  borderColor: props.primaryColor,
  background: props.primaryColor,
}))

const modalTitleStyle = computed(() => ({
  color: props.primaryColor,
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
  bottom: max(1rem, calc(1rem + env(safe-area-inset-bottom, 2rem)));
  right: 1rem;
  z-index: 9999;
}

/* Responsive positioning for different screen sizes */
@media (min-width: 640px) {
  .floating-action-menu {
    bottom: max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom, 2rem)));
    right: 1.5rem;
  }
}

@media (min-width: 768px) {
  .floating-action-menu {
    bottom: max(2rem, calc(2rem + env(safe-area-inset-bottom, 2rem)));
    right: 2rem;
  }
}

/* 13" Laptops - Optimized positioning */
@media (min-width: 1280px) and (max-width: 1439px) {
  .floating-action-menu {
    bottom: 1.5rem;
    right: 1.5rem;
  }
}

/* 15" Laptops - Balanced positioning */
@media (min-width: 1440px) and (max-width: 1679px) {
  .floating-action-menu {
    bottom: 2rem;
    right: 2rem;
  }
}

/* 17" Laptops - Enhanced positioning */
@media (min-width: 1680px) and (max-width: 1919px) {
  .floating-action-menu {
    bottom: 2.5rem;
    right: 2.5rem;
  }
}

/* Desktop - Original positioning */
@media (min-width: 1920px) {
  .floating-action-menu {
    bottom: 2rem;
    right: 2rem;
  }
}

/* Small laptops 13-inch (1024px-1365px) - Apply mobile sizing 20% smaller */
@media (min-width: 1024px) and (max-width: 1365px) {
  .floating-action-menu {
    bottom: max(0.8rem, calc(0.8rem + env(safe-area-inset-bottom, 2rem))) !important;
    right: 0.8rem !important;
  }

  .fab-button {
    width: 35px !important;
    height: 35px !important;
  }

  .fab-button svg {
    width: 19px !important;
    height: 19px !important;
  }

  .menu-container {
    bottom: calc(35px + 0.6rem + max(0.8rem, calc(0.8rem + env(safe-area-inset-bottom, 2rem)))) !important;
    gap: 0.4rem !important;
    min-width: 144px !important;
    max-height: calc(100vh - 112px - max(0.8rem, calc(0.8rem + env(safe-area-inset-bottom, 2rem)))) !important;
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
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: -1;
  animation: fadeIn 0.2s ease-out;
  will-change: opacity;
}

.fab-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
  touch-action: manipulation;
}

/* Responsive FAB button sizing - mobile-first approach */
@media (min-width: 640px) {
  .fab-button {
    width: 52px;
    height: 52px;
  }
}

@media (min-width: 768px) {
  .fab-button {
    width: 56px;
    height: 56px;
  }
}

/* 13" Laptops - Compact FAB */
@media (min-width: 1280px) and (max-width: 1439px) {
  .fab-button {
    width: 60px;
    height: 60px;
  }
}

/* 15" Laptops - Balanced FAB */
@media (min-width: 1440px) and (max-width: 1679px) {
  .fab-button {
    width: 68px;
    height: 68px;
  }
}

/* 17" Laptops - Enhanced FAB */
@media (min-width: 1680px) and (max-width: 1919px) {
  .fab-button {
    width: 72px;
    height: 72px;
  }
}

/* Desktop - Original size */
@media (min-width: 1920px) {
  .fab-button {
    width: 64px;
    height: 64px;
  }
}

.fab-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
}

.fab-button.active {
  transform: rotate(45deg) scale(1.1);
}

.menu-container {
  position: absolute;
  bottom: calc(44px + 0.75rem + max(1rem, calc(1rem + env(safe-area-inset-bottom, 2rem))));
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 180px;
  max-height: calc(100vh - 140px - max(1rem, calc(1rem + env(safe-area-inset-bottom, 2rem))));
  overflow-y: auto;
  overflow-x: hidden;
}

/* Responsive menu container positioning */
@media (min-width: 640px) {
  .menu-container {
    bottom: calc(52px + 0.75rem + max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom, 2rem))));
    gap: 0.625rem;
    min-width: 190px;
    max-height: calc(100vh - 150px - max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom, 2rem))));
  }
}

@media (min-width: 768px) {
  .menu-container {
    bottom: calc(56px + 0.75rem + max(2rem, calc(2rem + env(safe-area-inset-bottom, 2rem))));
    gap: 0.75rem;
    min-width: 200px;
    max-height: calc(100vh - 160px - max(2rem, calc(2rem + env(safe-area-inset-bottom, 2rem))));
  }
}

/* 13" Laptops - Compact menu */
@media (min-width: 1280px) and (max-width: 1439px) {
  .menu-container {
    bottom: 68px;
    gap: 0.625rem;
    min-width: 200px;
  }
}

/* 15" Laptops - Balanced menu */
@media (min-width: 1440px) and (max-width: 1679px) {
  .menu-container {
    bottom: 76px;
    gap: 0.75rem;
    min-width: 220px;
  }
}

/* 17" Laptops - Enhanced menu */
@media (min-width: 1680px) and (max-width: 1919px) {
  .menu-container {
    bottom: 80px;
    gap: 0.875rem;
    min-width: 240px;
  }
}

/* Desktop - Original positioning */
@media (min-width: 1920px) {
  .menu-container {
    bottom: 72px;
    gap: 0.75rem;
    min-width: 200px;
  }
}

.menu-item {
  transform: translateY(10px);
  opacity: 0;
  animation: slideUp 0.15s ease-out forwards;
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
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
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
  transform: translateX(-4px);
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
  z-index: 2000;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.language-modal {
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow: hidden;
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
@keyframes slideUp {
  to {
    transform: translateY(0);
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
  transform: translateY(20px) scale(0.95);
}

.menu-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
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
  .floating-action-menu {
    bottom: max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom, 2rem)));
    right: 1.5rem;
  }

  .menu-container {
    min-width: 180px;
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
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
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
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.glass-button-primary {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
</style>
