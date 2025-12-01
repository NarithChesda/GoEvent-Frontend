<template>
  <div class="host-info-wrapper" :class="{ 'khmer-text': currentLanguage === 'kh' }">
    <div class="host-info-grid">
      <!-- Row 1: Welcome Header -->
      <WelcomeHeader
        :message="welcomeMessage"
        default-message="Welcome to Our Event"
        :color="primaryColor"
        :font-family="primaryFont || currentFont"
        :current-language="currentLanguage"
        :animated="true"
        :base-delay="animationDelays.welcome"
        text-class="capitalize"
      />

      <!-- Row 2: Logo -->
      <HostLogo
        :key="`logo-${currentLanguage}`"
        :logo-url="logoUrl"
        :event-initial="eventInitial"
        :primary-color="primaryColor"
        :font-family="primaryFont || currentFont"
        :animated="true"
        :animation-delay="animationDelays.logo"
      />

      <!-- Row 3: Host Titles -->
      <div v-if="hosts.length > 0" class="title-row">
        <div class="host-title-left">
          <p
            :class="['parent-name-text leading-normal text-center opacity-90', getKhmerClass(currentLanguage)]"
            :style="titleTextStyle"
          >
            <span
              v-for="(word, index) in splitToWords(leftHostTitle)"
              :key="`title-left-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.titleLeft + index * WORD_DELAY}s` }"
            >{{ word }}{{ index < splitToWords(leftHostTitle).length - 1 ? '\u00A0' : '' }}</span>
          </p>
        </div>
        <div class="center-spacer"></div>
        <div class="host-title-right">
          <p
            v-if="hosts.length > 1"
            :class="['parent-name-text leading-normal text-center opacity-90', getKhmerClass(currentLanguage)]"
            :style="titleTextStyle"
          >
            <span
              v-for="(word, index) in splitToWords(rightHostTitle)"
              :key="`title-right-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.titleRight + index * WORD_DELAY}s` }"
            >{{ word }}{{ index < splitToWords(rightHostTitle).length - 1 ? '\u00A0' : '' }}</span>
          </p>
        </div>
      </div>

      <!-- Row 4: Host Names -->
      <div v-if="hosts.length > 0" class="name-row">
        <div class="host-name-left">
          <h3
            :class="['host-name-text font-regular leading-tight capitalize', getKhmerClass(currentLanguage)]"
            :style="nameTextStyle"
          >
            <span
              v-for="(word, index) in splitToWords(hosts[0].name)"
              :key="`name-left-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.nameLeft + index * WORD_DELAY}s` }"
            >{{ word }}{{ index < splitToWords(hosts[0].name).length - 1 ? '\u00A0' : '' }}</span>
          </h3>
        </div>
        <div class="center-spacer"></div>
        <div class="host-name-right">
          <h3
            v-if="hosts.length > 1"
            :class="['host-name-text font-regular leading-tight capitalize', getKhmerClass(currentLanguage)]"
            :style="nameTextStyle"
          >
            <span
              v-for="(word, index) in splitToWords(hosts[1]?.name)"
              :key="`name-right-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.nameRight + index * WORD_DELAY}s` }"
            >{{ word }}{{ index < splitToWords(hosts[1]?.name).length - 1 ? '\u00A0' : '' }}</span>
          </h3>
        </div>
      </div>

      <!-- Row 5: Host Profile Pictures -->
      <div v-if="showProfilePictures" class="profile-picture-row">
        <div class="host-profile-left">
          <HostProfilePicture
            :key="`profile-left-${currentLanguage}`"
            :image-url="hosts[0].profile_image"
            :alt="`${hosts[0].name} profile`"
            :background-color="primaryColor"
            :animated="true"
            :animation-delay="animationDelays.profileLeft"
          />
        </div>
        <div class="center-spacer"></div>
        <div class="host-profile-right">
          <HostProfilePicture
            v-if="hosts.length > 1"
            :key="`profile-right-${currentLanguage}`"
            :image-url="hosts[1]?.profile_image"
            :alt="`${hosts[1]?.name} profile`"
            :background-color="primaryColor"
            :animated="true"
            :animation-delay="animationDelays.profileRight"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HostInfoProps } from '@/types/showcase'
import {
  WelcomeHeader,
  HostLogo,
  HostProfilePicture,
  getKhmerClass,
  splitToWords,
  ANIMATION_CONSTANTS,
  getTextAnimationDuration,
} from './shared'

const props = defineProps<HostInfoProps>()

const WORD_DELAY = ANIMATION_CONSTANTS.WORD_DELAY
const ELEMENT_GAP = ANIMATION_CONSTANTS.ELEMENT_GAP

// Computed visibility flags
const showProfilePictures = computed(() =>
  props.hosts.length === 2 && props.hosts[0].profile_image && props.hosts[1].profile_image
)

// Host titles with defaults
const leftHostTitle = computed(() =>
  props.hosts[0]?.title || (props.hosts.length === 2 ? 'Bridegroom' : props.hosts.length === 1 ? 'Host' : 'Host 1')
)

const rightHostTitle = computed(() => props.hosts[1]?.title || 'Bride')

// Computed text styles
const titleTextStyle = computed(() => ({
  color: props.primaryColor,
  fontFamily: props.secondaryFont || props.currentFont,
  wordWrap: 'break-word' as const,
  hyphens: 'auto' as const,
}))

const nameTextStyle = computed(() => ({
  color: props.primaryColor,
  fontFamily: props.primaryFont || props.secondaryFont || props.currentFont,
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

  const welcome = getNextDelay(props.welcomeMessage || 'Welcome to Our Event')
  const logo = currentDelay
  currentDelay += 0.25
  const titleLeft = getNextDelay(leftHostTitle.value)
  const titleRight = getNextDelay(props.hosts.length > 1 ? rightHostTitle.value : null)
  const nameLeft = getNextDelay(props.hosts[0]?.name)
  const nameRight = getNextDelay(props.hosts.length > 1 ? props.hosts[1]?.name : null)
  const profileLeft = currentDelay
  currentDelay += 0.15
  const profileRight = currentDelay

  return {
    welcome,
    logo,
    titleLeft,
    titleRight,
    nameLeft,
    nameRight,
    profileLeft,
    profileRight,
  }
})
</script>

<style scoped>
@import './shared/host-info-base.css';

/* Housewarming-specific: 5 rows grid (no parent name rows) */
.host-info-grid {
  grid-template-rows: auto auto auto auto auto;
}

/* Reduce spacing between title and name rows */
.name-row {
  margin-top: -0.125rem;
}
</style>
