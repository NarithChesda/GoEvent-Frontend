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

    <!-- Event Logo (Centered) -->
    <div
      :key="`logo-${currentLanguage}`"
      class="flex justify-center mb-0"
    >
      <img
        v-if="logoUrl"
        :src="logoUrl"
        alt="Event Logo"
        class="logo-fallback bounce-in-element"
        :style="{ animationDelay: `${animationDelays.logo}s` }"
      />

      <div
        v-else
        class="fallback-logo-wrapper bounce-in-element"
        :style="{ ...fallbackLogoStyle, animationDelay: `${animationDelays.logo}s` }"
      >
        <div
          class="fallback-logo-svg"
          v-html="fallbackLogoSvgContent"
        />
      </div>
    </div>

    <!-- Event Hosts Header -->
    <div v-if="hosts.length > 0" class="hosts-section px-4 mt-4">
      <h3
        :class="['hosts-header text-center', getKhmerClass(currentLanguage)]"
        :style="{ color: primaryColor, fontFamily: primaryFont || currentFont }"
      >
        <span
          v-for="(word, index) in splitToWords(hostsHeaderText)"
          :key="`header-${currentLanguage}-${index}`"
          class="bounce-word"
          :style="{ animationDelay: `${animationDelays.header + index * WORD_DELAY}s` }"
        >{{ word }}{{ index < splitToWords(hostsHeaderText).length - 1 ? '\u00A0' : '' }}</span>
      </h3>

      <!-- Host List -->
      <ul class="host-list mt-3">
        <li
          v-for="(host, hostIndex) in hosts"
          :key="host.id"
          class="host-list-item text-center"
          :style="{ animationDelay: `${animationDelays.hostItems[hostIndex]}s` }"
        >
          <p
            v-if="host.title"
            :class="['host-title', getKhmerClass(currentLanguage)]"
            :style="{ color: primaryColor, fontFamily: secondaryFont || currentFont }"
          >{{ host.title }}</p>
          <p
            :class="['host-name', getKhmerClass(currentLanguage)]"
            :style="{ color: primaryColor, fontFamily: primaryFont || currentFont }"
          >{{ host.name }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HostInfoProps } from '@/types/showcase'
import {
  WelcomeHeader,
  getKhmerClass,
  splitToWords,
  ANIMATION_CONSTANTS,
  getTextAnimationDuration,
} from './shared'
import { useFallbackLogo } from '@/composables/showcase/useHostInfoUtils'
import { translateRSVP, type SupportedLanguage } from '@/utils/translations'

const props = defineProps<HostInfoProps>()

const { fallbackLogoSvgContent, fallbackLogoStyle } = useFallbackLogo(
  computed(() => props.primaryColor)
)

const WORD_DELAY = ANIMATION_CONSTANTS.WORD_DELAY
const ELEMENT_GAP = ANIMATION_CONSTANTS.ELEMENT_GAP

const hostsHeaderText = computed(() => {
  const lang = (props.currentLanguage as SupportedLanguage) || 'en'
  return translateRSVP('hosts_header_funeral', lang)
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

  const welcome = getNextDelay(props.welcomeMessage || 'In Loving Memory')
  const logo = currentDelay
  currentDelay += 0.25
  const header = getNextDelay(hostsHeaderText.value)

  // Each host item gets a staggered delay
  const hostItems: number[] = []
  for (let i = 0; i < props.hosts.length; i++) {
    hostItems.push(currentDelay)
    currentDelay += 0.1
  }

  return {
    welcome,
    logo,
    header,
    hostItems,
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

/* Hosts Section */
.hosts-section {
  margin-top: 1rem;
}

.hosts-header {
  font-size: 1.125rem;
  font-weight: 600;
  opacity: 0.85;
  margin-bottom: 0.5rem;
}

.host-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.host-list-item {
  padding: 0.5rem 0;
  display: block;
  opacity: 0;
  animation: revealWord 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.host-title {
  font-size: 0.8rem;
  font-weight: 400;
  opacity: 0.7;
  margin: 0;
  line-height: 1.3;
  text-align: center;
}

.host-name {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
  text-align: center;
}

.logo-fallback {
  width: 320px;
  height: 320px;
  object-fit: contain;
}

.fallback-logo-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  height: auto;
  overflow: hidden;
  padding-bottom: 1.5rem;
}

.fallback-logo-svg {
  transition: transform 0.3s ease;
  display: block;
  width: auto;
  height: auto;
  max-width: min(330px, 95%);
  max-height: 180px;
}

.fallback-logo-svg:hover {
  transform: scale(1.05);
}

.fallback-logo-svg :deep(svg) {
  display: block;
  width: auto !important;
  height: auto !important;
  max-width: min(330px, 95vw);
  max-height: 180px;
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
  .hosts-header {
    font-size: 1.25rem;
  }

  .host-title {
    font-size: 0.875rem;
  }

  .host-name {
    font-size: 1.125rem;
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

  .hosts-header {
    font-size: 1.375rem;
  }

  .host-title {
    font-size: 0.95rem;
  }

  .host-name {
    font-size: 1.25rem;
  }

  .logo-fallback {
    width: 420px;
    height: 420px;
  }
}

/* Small laptops 13-inch (1024px - 1365px) */
@media (min-width: 1024px) and (max-width: 1365px) {
  .host-info-funeral {
    padding: 0.25rem 0 1rem;
  }

  .hosts-header {
    font-size: 0.75rem;
  }

  .host-list-item {
    padding: 0.25rem 0;
  }

  .host-title {
    font-size: 0.5rem;
  }

  .host-name {
    font-size: 0.65rem;
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

  .hosts-header {
    font-size: 0.75rem;
  }

  .host-list-item {
    padding: 0.25rem 0;
  }

  .host-title {
    font-size: 0.5rem;
  }

  .host-name {
    font-size: 0.65rem;
  }

  .logo-fallback {
    width: 220px;
    height: 220px;
  }
}

@media (min-width: 1920px) {
  .logo-fallback {
    width: 420px;
    height: 420px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bounce-in-element,
  .bounce-word,
  .host-list-item {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
