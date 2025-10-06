<template>
  <div class="floating-action-menu">
    <!-- Blur Overlay -->
    <div v-if="isMenuOpen || showLanguageModal" class="blur-overlay" @click="closeAllMenus"></div>

    <!-- Floating Action Button -->
    <button
      @click="toggleMenu"
      class="fab-button"
      :class="{ active: isMenuOpen }"
      :style="{
        background: primaryColor,
        border: `2px solid ${primaryColor}`,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      }"
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
            :style="{ borderColor: primaryColor }"
          >
            <Languages :size="20" :color="primaryColor" />
            <span class="menu-text">{{ menuTranslations.language }}</span>
          </button>
        </div>

        <!-- Music Toggle -->
        <div class="menu-item">
          <button
            @click="handleMusicToggle"
            class="menu-button glass-section"
            :class="{ active: props.isMusicPlaying }"
            :style="{ borderColor: primaryColor }"
          >
            <component
              :is="props.isMusicPlaying ? VolumeX : Volume2"
              :size="20"
              :color="primaryColor"
            />
            <span class="menu-text">{{
              props.isMusicPlaying ? menuTranslations.musicOff : menuTranslations.musicOn
            }}</span>
          </button>
        </div>

        <!-- RSVP -->
        <div class="menu-item">
          <button
            @click="handleRSVP"
            class="menu-button glass-section"
            :style="{ borderColor: primaryColor }"
          >
            <UserCheck :size="20" :color="primaryColor" />
            <span class="menu-text">{{ menuTranslations.rsvp }}</span>
          </button>
        </div>

        <!-- Reminder -->
        <div class="menu-item">
          <button
            @click="handleReminder"
            class="menu-button glass-section"
            :style="{ borderColor: primaryColor }"
          >
            <Bell :size="20" :color="primaryColor" />
            <span class="menu-text">{{ menuTranslations.reminder }}</span>
          </button>
        </div>

        <!-- Agenda -->
        <div class="menu-item">
          <button
            @click="handleAgenda"
            class="menu-button glass-section"
            :style="{ borderColor: primaryColor }"
          >
            <Calendar :size="20" :color="primaryColor" />
            <span class="menu-text">{{ menuTranslations.agenda }}</span>
          </button>
        </div>

        <!-- Location -->
        <div class="menu-item">
          <button
            @click="handleLocation"
            class="menu-button glass-section"
            :style="{ borderColor: primaryColor }"
          >
            <MapPin :size="20" :color="primaryColor" />
            <span class="menu-text">{{ menuTranslations.location }}</span>
          </button>
        </div>

        <!-- Video -->
        <div class="menu-item">
          <button
            @click="handleVideo"
            class="menu-button glass-section"
            :style="{ borderColor: primaryColor }"
          >
            <Play :size="20" :color="primaryColor" />
            <span class="menu-text">{{ menuTranslations.video }}</span>
          </button>
        </div>

        <!-- Gallery -->
        <div class="menu-item">
          <button
            @click="handleGallery"
            class="menu-button glass-section"
            :style="{ borderColor: primaryColor }"
          >
            <Image :size="20" :color="primaryColor" />
            <span class="menu-text">{{ menuTranslations.gallery }}</span>
          </button>
        </div>

        <!-- Gift -->
        <div class="menu-item">
          <button
            @click="handleGift"
            class="menu-button glass-section"
            :style="{ borderColor: primaryColor }"
          >
            <Gift :size="20" :color="primaryColor" />
            <span class="menu-text">{{ menuTranslations.gift }}</span>
          </button>
        </div>

        <!-- Comment -->
        <div class="menu-item">
          <button
            @click="handleComment"
            class="menu-button glass-section"
            :style="{ borderColor: primaryColor }"
          >
            <MessageCircle :size="20" :color="primaryColor" />
            <span class="menu-text">{{ menuTranslations.comment }}</span>
          </button>
        </div>

        <!-- Logout (only show if authenticated) -->
        <div v-if="props.isAuthenticated" class="menu-item">
          <button
            @click="handleLogout"
            class="menu-button glass-section logout-button"
            :style="{
              borderColor: primaryColor,
              background: primaryColor,
            }"
          >
            <LogOut :size="20" color="white" />
            <span class="menu-text">{{ menuTranslations.logout }}</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Language Selection Modal -->
    <Transition name="modal">
      <div v-if="showLanguageModal" class="modal-overlay" @click="closeLanguageModal">
        <div class="language-modal glass-section" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title" :style="{ color: primaryColor }">
              {{ menuTranslations.selectLanguage }}
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
  MapPin,
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

// Translation helpers
const getTranslation = (
  key: keyof typeof import('../../utils/translations').rsvpTranslations.en,
): string => {
  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  return translateRSVP(key, currentLang)
}

// Computed properties for menu item translations
const menuTranslations = computed(() => ({
  language: getTranslation('floating_menu_language'),
  musicOn: getTranslation('floating_menu_music_on'),
  musicOff: getTranslation('floating_menu_music_off'),
  rsvp: getTranslation('floating_menu_rsvp'),
  reminder: getTranslation('floating_menu_reminder'),
  agenda: getTranslation('floating_menu_agenda'),
  location: getTranslation('floating_menu_location'),
  video: getTranslation('floating_menu_video'),
  gallery: getTranslation('floating_menu_gallery'),
  gift: getTranslation('floating_menu_gift'),
  comment: getTranslation('floating_menu_comment'),
  logout: getTranslation('floating_menu_logout'),
  selectLanguage: getTranslation('floating_menu_select_language'),
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

const handleRSVP = () => {
  emit('rsvp')
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

const handleLocation = () => {
  emit('location')
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

/* Small laptops 13-inch (1024px-1365px) - Compact styling to match other components */
@media (min-width: 1024px) and (max-width: 1365px) {
  .floating-action-menu {
    bottom: 1.25rem;
    right: 1.25rem;
  }

  .fab-button {
    width: 48px !important;
    height: 48px !important;
  }

  .menu-container {
    bottom: 62px !important;
    gap: 0.5rem !important;
    min-width: 180px !important;
  }

  .menu-button {
    gap: 0.5rem !important;
    padding: 0.625rem 0.75rem !important;
    border-radius: 0.625rem !important;
    min-height: 40px !important;
  }

  .menu-text {
    font-size: 0.8125rem !important; /* 13px - match other components */
  }

  /* Language modal - more compact */
  .language-modal {
    max-width: 350px !important;
    border-radius: 0.875rem !important;
  }

  .modal-header {
    padding: 1.25rem !important;
  }

  .modal-title {
    font-size: 1.125rem !important;
  }

  .language-options {
    padding: 0.875rem !important;
    gap: 0.375rem !important;
  }

  .language-option {
    padding: 0.625rem !important;
    border-radius: 0.5rem !important;
  }

  .language-name {
    font-size: 0.8125rem !important;
  }

  .language-flag {
    font-size: 1.125rem !important;
  }
}

.blur-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: -1;
  animation: fadeIn 0.3s ease-out;
}

.fab-button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
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
  transform: translateY(20px);
  opacity: 0;
  animation: slideUp 0.2s ease-out forwards;
}

.menu-item:nth-child(1) {
  animation-delay: 0.02s;
}
.menu-item:nth-child(2) {
  animation-delay: 0.04s;
}
.menu-item:nth-child(3) {
  animation-delay: 0.06s;
}
.menu-item:nth-child(4) {
  animation-delay: 0.08s;
}
.menu-item:nth-child(5) {
  animation-delay: 0.1s;
}
.menu-item:nth-child(6) {
  animation-delay: 0.12s;
}
.menu-item:nth-child(7) {
  animation-delay: 0.14s;
}
.menu-item:nth-child(8) {
  animation-delay: 0.16s;
}
.menu-item:nth-child(9) {
  animation-delay: 0.18s;
}
.menu-item:nth-child(10) {
  animation-delay: 0.2s;
}
.menu-item:nth-child(11) {
  animation-delay: 0.22s;
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
  transition: all 0.15s ease;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  min-height: 44px;
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
