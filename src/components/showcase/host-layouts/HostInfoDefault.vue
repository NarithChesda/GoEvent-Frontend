<template>
  <div class="host-info-default" :class="{ 'khmer-text': currentLanguage === 'kh' }">
    <!-- Welcome Message -->
    <WelcomeHeader
      :message="welcomeMessage"
      default-message="Welcome to Our Event"
      :color="primaryColor"
      :font-family="primaryFont || currentFont"
      :current-language="currentLanguage"
      :animated="true"
      :base-delay="animationDelays.welcome"
    />

    <!-- Logo (Centered) -->
    <div
      :key="`logo-${currentLanguage}`"
      class="flex justify-center mb-8 sm:mb-10"
    >
      <img
        v-if="logoUrl"
        :src="logoUrl"
        alt="Event Logo"
        class="default-logo bounce-in-element"
        :style="{ animationDelay: `${animationDelays.logo}s` }"
      />
      <div
        v-else
        class="logo-fallback bounce-in-element"
        :style="{ backgroundColor: primaryColor, animationDelay: `${animationDelays.logo}s` }"
      >
        <span class="logo-initial" :style="{ fontFamily: primaryFont || currentFont }">
          {{ eventInitial }}
        </span>
      </div>
    </div>

    <!-- Hosts Grid - Dynamic based on host count -->
    <div v-if="hosts.length > 0" :class="gridClasses">
      <div
        v-for="(host, hostIndex) in hosts"
        :key="`${host.id}-${currentLanguage}`"
        class="host-card text-center"
      >
        <!-- Profile Picture -->
        <div v-if="host.profile_image" class="flex justify-center mb-3">
          <div
            class="profile-wrapper bounce-in-element"
            :style="{
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              animationDelay: `${getHostAnimationDelay(hostIndex, 'profile')}s`
            }"
          >
            <img
              :src="getMediaUrl(host.profile_image)"
              :alt="`${host.name} profile`"
              class="profile-img"
            />
          </div>
        </div>

        <!-- Host Title -->
        <p
          v-if="host.title"
          :class="['text-xs sm:text-sm opacity-75 mb-1', getKhmerClass(currentLanguage)]"
          :style="{ color: primaryColor, fontFamily: secondaryFont || currentFont }"
        >
          <span
            v-for="(word, index) in splitToWords(host.title)"
            :key="`title-${hostIndex}-${currentLanguage}-${index}`"
            class="bounce-word"
            :style="{ animationDelay: `${getHostAnimationDelay(hostIndex, 'title') + index * WORD_DELAY}s` }"
          >{{ word }}{{ index < splitToWords(host.title).length - 1 ? '\u00A0' : '' }}</span>
        </p>

        <!-- Host Name -->
        <h4
          :class="['text-lg sm:text-xl md:text-2xl font-semibold leading-tight', getKhmerClass(currentLanguage)]"
          :style="{ color: primaryColor, fontFamily: primaryFont || currentFont }"
        >
          <span
            v-for="(word, index) in splitToWords(host.name)"
            :key="`name-${hostIndex}-${currentLanguage}-${index}`"
            class="bounce-word"
            :style="{ animationDelay: `${getHostAnimationDelay(hostIndex, 'name') + index * WORD_DELAY}s` }"
          >{{ word }}{{ index < splitToWords(host.name).length - 1 ? '\u00A0' : '' }}</span>
        </h4>

        <!-- Host Bio -->
        <p
          v-if="host.bio"
          :class="['text-xs sm:text-sm mt-2 opacity-80', getKhmerClass(currentLanguage)]"
          :style="{ color: primaryColor, fontFamily: currentFont }"
        >
          <span
            v-for="(word, index) in splitToWords(host.bio)"
            :key="`bio-${hostIndex}-${currentLanguage}-${index}`"
            class="bounce-word"
            :style="{ animationDelay: `${getHostAnimationDelay(hostIndex, 'bio') + index * WORD_DELAY}s` }"
          >{{ word }}{{ index < splitToWords(host.bio).length - 1 ? '\u00A0' : '' }}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HostInfoProps } from '@/types/showcase'
import {
  WelcomeHeader,
  getKhmerClass,
  getMediaUrl,
  splitToWords,
  ANIMATION_CONSTANTS,
  getTextAnimationDuration,
} from './shared'

const props = defineProps<HostInfoProps>()

const WORD_DELAY = ANIMATION_CONSTANTS.WORD_DELAY
const ELEMENT_GAP = ANIMATION_CONSTANTS.ELEMENT_GAP

// Dynamic grid based on host count
const gridClasses = computed(() => {
  const count = props.hosts.length

  if (count === 1) {
    return 'flex justify-center'
  } else if (count === 2) {
    return 'grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-2xl mx-auto'
  } else if (count <= 4) {
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8'
  } else {
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'
  }
})

// Animation delays calculation
const animationDelays = computed(() => {
  let currentDelay = 0.1

  const getNextDelay = (text: string | null | undefined, skipIfEmpty = true): number => {
    if (skipIfEmpty && !text) return currentDelay
    const startDelay = currentDelay
    const duration = getTextAnimationDuration(text)
    currentDelay = startDelay + duration + ELEMENT_GAP
    return startDelay
  }

  const welcome = getNextDelay(props.welcomeMessage || 'Welcome to Our Event')
  const logo = currentDelay
  currentDelay += 0.25

  // Calculate delays for each host
  const hostDelays: Array<{ profile: number; title: number; name: number; bio: number }> = []

  for (const host of props.hosts) {
    const profile = currentDelay
    currentDelay += 0.15
    const title = getNextDelay(host.title)
    const name = getNextDelay(host.name)
    const bio = getNextDelay(host.bio)
    hostDelays.push({ profile, title, name, bio })
  }

  return {
    welcome,
    logo,
    hostDelays,
  }
})

// Get animation delay for a specific host element
const getHostAnimationDelay = (hostIndex: number, element: 'profile' | 'title' | 'name' | 'bio'): number => {
  const delays = animationDelays.value.hostDelays[hostIndex]
  return delays ? delays[element] : 0
}
</script>

<style scoped>
.host-info-default {
  padding: 1.5rem 0;
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* Default Logo */
.default-logo {
  max-height: 140px;
  max-width: 300px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.default-logo:hover {
  transform: scale(1.05);
}

/* Logo Fallback */
.logo-fallback {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.logo-fallback:hover {
  transform: scale(1.05);
}

.logo-initial {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
}

/* Host Card */
.host-card {
  padding: 1rem;
  max-width: 280px;
  margin: 0 auto;
}

/* Profile Picture */
.profile-wrapper {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  padding: 3px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.profile-wrapper:hover {
  transform: scale(1.05);
}

.profile-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

/* Bounce In Animation */
.bounce-in-element {
  opacity: 0;
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

/* Word-by-word reveal animation */
.bounce-word {
  display: inline-block;
  opacity: 0;
  animation: revealWord 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes revealWord {
  0% {
    opacity: 0;
    transform: scale(0.85) translateY(10px);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Responsive adjustments */
@media (min-width: 640px) {
  .default-logo {
    max-height: 160px;
    max-width: 350px;
  }

  .logo-fallback {
    width: 120px;
    height: 120px;
  }

  .logo-initial {
    font-size: 3rem;
  }

  .profile-wrapper {
    width: 120px;
    height: 120px;
  }
}

@media (min-width: 768px) {
  .host-info-default {
    padding: 2rem 0;
  }

  .default-logo {
    max-height: 180px;
    max-width: 400px;
  }

  .profile-wrapper {
    width: 130px;
    height: 130px;
  }
}

@media (min-width: 1920px) {
  .default-logo {
    max-height: 200px;
    max-width: 450px;
  }

  .logo-fallback {
    width: 140px;
    height: 140px;
  }

  .logo-initial {
    font-size: 3.5rem;
  }

  .profile-wrapper {
    width: 140px;
    height: 140px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .default-logo,
  .logo-fallback,
  .profile-wrapper,
  .bounce-in-element,
  .bounce-word {
    transition: none;
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
