<template>
  <div class="floating-action-menu">
    <!-- Blur Overlay -->
    <div 
      v-if="isMenuOpen || showLanguageModal"
      class="blur-overlay"
      @click="closeAllMenus"
    ></div>

    <!-- Floating Action Button -->
    <button
      @click="toggleMenu"
      class="fab-button"
      :class="{ 'active': isMenuOpen }"
      style="background: white; border: 2px solid #333; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);"
    >
      <component 
        :is="isMenuOpen ? X : Menu" 
        :size="24" 
        color="#333"
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
            <span class="menu-text">Language</span>
          </button>
        </div>

        <!-- Music Toggle -->
        <div class="menu-item">
          <button
            @click="handleMusicToggle"
            class="menu-button glass-section"
            :class="{ 'active': props.isMusicPlaying }"
            :style="{ borderColor: primaryColor }"
          >
            <component 
              :is="props.isMusicPlaying ? VolumeX : Volume2" 
              :size="20" 
              :color="primaryColor" 
            />
            <span class="menu-text">{{ props.isMusicPlaying ? 'Music Off' : 'Music On' }}</span>
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
            <span class="menu-text">RSVP</span>
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
            <span class="menu-text">Reminder</span>
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
            <span class="menu-text">Gift</span>
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
            <span class="menu-text">Agenda</span>
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
            <span class="menu-text">Location</span>
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
            <span class="menu-text">Video</span>
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
            <span class="menu-text">Gallery</span>
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
            <span class="menu-text">Comment</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Language Selection Modal -->
    <Transition name="modal">
      <div v-if="showLanguageModal" class="modal-overlay" @click="closeLanguageModal">
        <div class="language-modal glass-section" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title" :style="{ color: primaryColor }">Select Language</h3>
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
              :class="{ 'active': currentLanguage === lang.code }"
              :style="{ 
                borderColor: currentLanguage === lang.code ? primaryColor : 'transparent',
                color: currentLanguage === lang.code ? primaryColor : 'white'
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
  MessageCircle 
} from 'lucide-vue-next'

interface Props {
  primaryColor?: string
  accentColor?: string
  currentLanguage?: string
  availableLanguages?: Array<{ id: number; language: string; language_display: string }>
  isMusicPlaying?: boolean
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
  isMusicPlaying: false
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
  'en': '🇺🇸',
  'kh': '🇰🇭', 
  'fr': '🇫🇷',
  'ja': '🇯🇵',
  'ko': '🇰🇷',
  'zh-cn': '🇨🇳',
  'th': '🇹🇭',
  'vn': '🇻🇳'
}

const displayLanguages = computed(() => {
  if (!props.availableLanguages || props.availableLanguages.length === 0) {
    return []
  }
  
  return props.availableLanguages.map(lang => ({
    code: lang.language,
    name: lang.language_display,
    flag: languageFlags[lang.language] || '🌐'
  }))
})

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
</script>

<style scoped>
.floating-action-menu {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  z-index: 9999;
}

.blur-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: -1;
  animation: fadeIn 0.3s ease-out;
}

.fab-button {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
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
  bottom: 72px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 200px;
}

.menu-item {
  transform: translateY(20px);
  opacity: 0;
  animation: slideUp 0.2s ease-out forwards;
}

.menu-item:nth-child(1) { animation-delay: 0.02s; }
.menu-item:nth-child(2) { animation-delay: 0.04s; }
.menu-item:nth-child(3) { animation-delay: 0.06s; }
.menu-item:nth-child(4) { animation-delay: 0.08s; }
.menu-item:nth-child(5) { animation-delay: 0.10s; }
.menu-item:nth-child(6) { animation-delay: 0.12s; }
.menu-item:nth-child(7) { animation-delay: 0.14s; }
.menu-item:nth-child(8) { animation-delay: 0.16s; }
.menu-item:nth-child(9) { animation-delay: 0.18s; }
.menu-item:nth-child(10) { animation-delay: 0.20s; }

.menu-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.15s ease;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
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
    bottom: 1.5rem;
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

/* Glass section styles */
.glass-section {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.glass-inner {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.glass-button-primary {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.1) 100%
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
</style>