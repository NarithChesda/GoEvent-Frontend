<template>
  <div class="host-info-funeral" :class="{ 'khmer-text': currentLanguage === 'kh' }">
    <!-- Welcome Message -->
    <WelcomeHeader
      :message="welcomeMessage"
      default-message="In Loving Memory"
      :color="primaryColor"
      :font-family="primaryFont || currentFont"
      :current-language="currentLanguage"
      :animated="true"
      :base-delay="animationDelays.welcome"
    />

    <!-- Parent Names Row (Two-column layout) -->
    <div
      v-if="hosts.length > 0 && (hosts[0].parent_a_name || hosts[0].parent_b_name)"
      class="parent-row"
    >
      <div class="host-parent-left">
        <p
          v-if="hosts[0].parent_a_name"
          :class="['parent-name-text leading-normal text-center opacity-90', getKhmerClass(currentLanguage)]"
          :style="parentTextStyle"
        >
          <span
            v-for="(word, index) in splitToWords(hosts[0].parent_a_name)"
            :key="`parent-a-${currentLanguage}-${index}`"
            class="bounce-word"
            :style="{ animationDelay: `${animationDelays.parentA + index * WORD_DELAY}s` }"
          >{{ word }}{{ index < splitToWords(hosts[0].parent_a_name).length - 1 ? '\u00A0' : '' }}</span>
        </p>
      </div>
      <div class="center-spacer"></div>
      <div class="host-parent-right">
        <p
          v-if="hosts[0].parent_b_name"
          :class="['parent-name-text leading-normal text-center opacity-90', getKhmerClass(currentLanguage)]"
          :style="parentTextStyle"
        >
          <span
            v-for="(word, index) in splitToWords(hosts[0].parent_b_name)"
            :key="`parent-b-${currentLanguage}-${index}`"
            class="bounce-word"
            :style="{ animationDelay: `${animationDelays.parentB + index * WORD_DELAY}s` }"
          >{{ word }}{{ index < splitToWords(hosts[0].parent_b_name).length - 1 ? '\u00A0' : '' }}</span>
        </p>
      </div>
    </div>

    <!-- Single Host Profile Picture (Large & Centered) with logo fallback -->
    <div
      :key="`profile-${currentLanguage}`"
      class="flex justify-center mb-0"
    >
      <!-- Logo fallback: no background circle -->
      <img
        v-if="!hosts[0]?.profile_image && logoUrl"
        :src="logoUrl"
        alt="Event Logo"
        class="logo-fallback bounce-in-element"
        :style="{ animationDelay: `${animationDelays.profile}s` }"
      />

      <!-- Profile image or event initial: with gradient circle -->
      <div
        v-else
        class="profile-picture-large bounce-in-element"
        :style="{
          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          animationDelay: `${animationDelays.profile}s`
        }"
      >
        <img
          v-if="hosts[0]?.profile_image"
          :src="getMediaUrl(hosts[0].profile_image)"
          :alt="`${hosts[0]?.name} profile`"
          class="profile-image"
        />
        <span
          v-else
          class="profile-initial"
          :style="{ fontFamily: primaryFont || currentFont }"
        >{{ eventInitial }}</span>
      </div>
    </div>

    <!-- Host Title & Name (Centered) -->
    <div v-if="hosts.length > 0" class="text-center space-y-1 sm:space-y-1.5 px-4 -mt-4">
      <!-- Title -->
      <p
        :class="['funeral-title-text opacity-75', getKhmerClass(currentLanguage)]"
        :style="{ color: primaryColor, fontFamily: secondaryFont || currentFont }"
      >
        <span
          v-for="(word, index) in splitToWords(hosts[0]?.title || 'Beloved')"
          :key="`title-${currentLanguage}-${index}`"
          class="bounce-word"
          :style="{ animationDelay: `${animationDelays.title + index * WORD_DELAY}s` }"
        >{{ word }}{{ index < splitToWords(hosts[0]?.title || 'Beloved').length - 1 ? '\u00A0' : '' }}</span>
      </p>

      <!-- Name -->
      <h3
        :class="['text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold leading-tight', getKhmerClass(currentLanguage)]"
        :style="{ color: primaryColor, fontFamily: primaryFont || currentFont }"
      >
        <span
          v-for="(word, index) in splitToWords(hosts[0].name)"
          :key="`name-${currentLanguage}-${index}`"
          class="bounce-word"
          :style="{ animationDelay: `${animationDelays.name + index * WORD_DELAY}s` }"
        >{{ word }}{{ index < splitToWords(hosts[0].name).length - 1 ? '\u00A0' : '' }}</span>
      </h3>

      <!-- Bio (if available) -->
      <p
        v-if="hosts[0]?.bio"
        :class="['text-base sm:text-lg opacity-90 mt-4 max-w-md mx-auto', getKhmerClass(currentLanguage)]"
        :style="{ color: primaryColor, fontFamily: currentFont }"
      >
        <span
          v-for="(word, index) in splitToWords(hosts[0].bio)"
          :key="`bio-${currentLanguage}-${index}`"
          class="bounce-word"
          :style="{ animationDelay: `${animationDelays.bio + index * WORD_DELAY}s` }"
        >{{ word }}{{ index < splitToWords(hosts[0].bio).length - 1 ? '\u00A0' : '' }}</span>
      </p>
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

const parentTextStyle = computed(() => ({
  color: props.primaryColor,
  fontFamily: props.primaryFont || props.currentFont,
  wordWrap: 'break-word' as const,
  hyphens: 'auto' as const,
}))

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

  const welcome = getNextDelay(props.welcomeMessage || 'In Loving Memory')
  const parentA = getNextDelay(props.hosts[0]?.parent_a_name)
  const parentB = getNextDelay(props.hosts[0]?.parent_b_name)
  const profile = currentDelay
  currentDelay += 0.25
  const title = getNextDelay(props.hosts[0]?.title || 'Beloved')
  const name = getNextDelay(props.hosts[0]?.name)
  const bio = getNextDelay(props.hosts[0]?.bio)

  return {
    welcome,
    parentA,
    parentB,
    profile,
    title,
    name,
    bio,
  }
})
</script>

<style scoped>
.host-info-funeral {
  padding: 0.25rem 0 1.5rem;
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.host-info-funeral :deep(.welcome-row) {
  margin-bottom: 0;
}

.host-info-funeral :deep(.welcome-content) {
  margin-top: 0;
}

/* Parent Names Row Layout */
.parent-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  width: 100%;
  align-items: center;
  overflow: hidden;
  box-sizing: border-box;
  margin-bottom: 1rem;
}

.host-parent-left,
.host-parent-right {
  text-align: center;
  overflow: hidden;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.center-spacer {
  width: 1rem;
  flex-shrink: 0;
}

.khmer-text .center-spacer {
  width: 0.5rem;
}

.parent-name-text {
  font-size: 1rem;
}

/* Title text - matches birthday title sizes */
.funeral-title-text {
  font-size: 0.7906rem;
}

/* Large Profile Picture */
.profile-picture-large {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  padding: 4px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.profile-picture-large:hover {
  transform: scale(1.05);
}

.profile-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.logo-fallback {
  width: 320px;
  height: 320px;
  object-fit: contain;
}

.profile-initial {
  font-size: 4rem;
  font-weight: bold;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
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
  .parent-name-text {
    font-size: 1.125rem;
  }

  .funeral-title-text {
    font-size: 0.9344rem;
  }

  .profile-picture-large {
    width: 250px;
    height: 250px;
    padding: 5px;
  }

  .logo-fallback {
    width: 380px;
    height: 380px;
  }
}

@media (min-width: 768px) {
  .host-info-funeral {
    padding: 0.25rem 0 2rem;
  }

  .parent-name-text {
    font-size: 1.25rem;
  }

  .funeral-title-text {
    font-size: 1.0781rem;
  }

  .profile-picture-large {
    width: 280px;
    height: 280px;
  }

  .logo-fallback {
    width: 420px;
    height: 420px;
  }
}

@media (min-width: 1024px) {
  .parent-name-text {
    font-size: 1.5rem;
  }
}

/* Small laptops 13-inch (1024px - 1365px) */
@media (min-width: 1024px) and (max-width: 1365px) {
  .host-info-funeral {
    padding: 0.25rem 0 1rem;
  }

  .text-center.mb-6 {
    margin-bottom: 0.75rem !important;
  }

  .parent-row {
    margin-bottom: 0.5rem !important;
  }

  .parent-name-text {
    font-size: 0.55rem !important;
  }

  .funeral-title-text {
    font-size: 0.55rem !important;
  }

  .host-info-funeral h3 {
    font-size: 0.85rem !important;
  }

  .profile-picture-large {
    width: 160px;
    height: 160px;
    padding: 3px;
  }

  .logo-fallback {
    width: 220px;
    height: 220px;
  }
}

/* Medium laptops 14-15 inch (1366px - 1919px) */
@media (min-width: 1366px) and (max-width: 1919px) {
  .host-info-funeral {
    padding: 0.25rem 0 1rem;
  }

  .text-center.mb-6 {
    margin-bottom: 0.75rem !important;
  }

  .parent-row {
    margin-bottom: 0.5rem !important;
  }

  .parent-name-text {
    font-size: 0.55rem !important;
  }

  .funeral-title-text {
    font-size: 0.55rem !important;
  }

  .host-info-funeral h3 {
    font-size: 0.85rem !important;
  }

  .profile-picture-large {
    width: 160px;
    height: 160px;
    padding: 3px;
  }

  .logo-fallback {
    width: 220px;
    height: 220px;
  }
}

@media (min-width: 1920px) {
  .funeral-title-text {
    font-size: 1.0063rem;
  }

  .profile-picture-large {
    width: 300px;
    height: 300px;
  }

  .logo-fallback {
    width: 420px;
    height: 420px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile-picture-large,
  .bounce-in-element,
  .bounce-word {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
