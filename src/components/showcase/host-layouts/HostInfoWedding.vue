<template>
  <div class="host-info-wrapper" :class="{ 'khmer-text': currentLanguage === 'kh' }">
    <!-- Grid container with 7 rows (added profile picture row) -->
    <div class="host-info-grid">
      <!-- Row 1: Welcome Header (moved from MainContentStage) -->
      <div class="welcome-row">
        <div class="welcome-content mt-2">
          <h2
            :class="[
              'text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-regular leading-tight',
              currentLanguage === 'kh' && 'khmer-text-fix',
            ]"
            :style="{
              fontFamily: primaryFont || currentFont,
              color: primaryColor,
            }"
          >
            <span
              v-for="(word, index) in splitToWords(welcomeMessage || 'Welcome to Our Event')"
              :key="`welcome-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.welcome + index * WORD_DELAY}s` }"
            >{{ word }}{{ index < splitToWords(welcomeMessage || 'Welcome to Our Event').length - 1 ? '\u00A0' : '' }}</span>
          </h2>
        </div>
      </div>

      <!-- Row 2: Host Parent A Names (fallback to Parent B if Parent A doesn't exist) -->
      <div v-if="hosts.length > 0 && (hosts[0].parent_a_name || hosts[0].parent_b_name || (hosts.length > 1 && (hosts[1]?.parent_a_name || hosts[1]?.parent_b_name)))" class="parent-row">
        <!-- Host 1 Parent A (45% width) -->
        <div class="host-parent-left">
          <p
            v-if="hosts[0].parent_a_name || hosts[0].parent_b_name"
            :class="[
              'parent-name-text leading-normal text-center opacity-90',
              currentLanguage === 'kh' && 'khmer-text-fix',
            ]"
            :style="{
              color: primaryColor,
              fontFamily: primaryFont || currentFont,
              wordWrap: 'break-word',
              hyphens: 'auto',
            }"
          >
            <span
              v-for="(word, index) in splitToWords(hosts[0].parent_a_name || hosts[0].parent_b_name)"
              :key="`parent-a-left-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.parentALeft + index * WORD_DELAY}s` }"
            >{{ word }}{{ index < splitToWords(hosts[0].parent_a_name || hosts[0].parent_b_name).length - 1 ? '\u00A0' : '' }}</span>
          </p>
        </div>

        <!-- Center spacer (10% width) -->
        <div class="center-spacer"></div>

        <!-- Host 2 Parent A (45% width) -->
        <div class="host-parent-right">
          <p
            v-if="hosts.length > 1 && (hosts[1]?.parent_a_name || hosts[1]?.parent_b_name)"
            :class="[
              'parent-name-text leading-normal text-center opacity-90',
              currentLanguage === 'kh' && 'khmer-text-fix',
            ]"
            :style="{
              color: primaryColor,
              fontFamily: primaryFont || currentFont,
              wordWrap: 'break-word',
              hyphens: 'auto',
            }"
          >
            <span
              v-for="(word, index) in splitToWords(hosts[1]?.parent_a_name || hosts[1]?.parent_b_name)"
              :key="`parent-a-right-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.parentARight + index * WORD_DELAY}s` }"
            >{{ word }}{{ index < splitToWords(hosts[1]?.parent_a_name || hosts[1]?.parent_b_name).length - 1 ? '\u00A0' : '' }}</span>
          </p>
        </div>
      </div>

      <!-- Row 3: Host Parent B Names (only show if Parent B exists AND Parent A also exists to avoid redundancy) -->
      <div v-if="hosts.length > 0 && ((hosts[0].parent_b_name && hosts[0].parent_a_name) || (hosts.length > 1 && hosts[1]?.parent_b_name && hosts[1]?.parent_a_name))" class="parent-row">
        <!-- Host 1 Parent B (45% width) - only show if both parent_a_name AND parent_b_name exist -->
        <div class="host-parent-left">
          <p
            v-if="hosts[0].parent_b_name && hosts[0].parent_a_name"
            :class="[
              'parent-name-text leading-normal text-center opacity-90',
              currentLanguage === 'kh' && 'khmer-text-fix',
            ]"
            :style="{
              color: primaryColor,
              fontFamily: primaryFont || currentFont,
              wordWrap: 'break-word',
              hyphens: 'auto',
            }"
          >
            <span
              v-for="(word, index) in splitToWords(hosts[0].parent_b_name)"
              :key="`parent-b-left-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.parentBLeft + index * WORD_DELAY}s` }"
            >{{ word }}{{ index < splitToWords(hosts[0].parent_b_name).length - 1 ? '\u00A0' : '' }}</span>
          </p>
        </div>

        <!-- Center spacer (10% width) -->
        <div class="center-spacer"></div>

        <!-- Host 2 Parent B (45% width) - only show if both parent_a_name AND parent_b_name exist -->
        <div class="host-parent-right">
          <p
            v-if="hosts.length > 1 && hosts[1]?.parent_b_name && hosts[1]?.parent_a_name"
            :class="[
              'parent-name-text leading-normal text-center opacity-90',
              currentLanguage === 'kh' && 'khmer-text-fix',
            ]"
            :style="{
              color: primaryColor,
              fontFamily: primaryFont || currentFont,
              wordWrap: 'break-word',
              hyphens: 'auto',
            }"
          >
            <span
              v-for="(word, index) in splitToWords(hosts[1]?.parent_b_name)"
              :key="`parent-b-right-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.parentBRight + index * WORD_DELAY}s` }"
            >{{ word }}{{ index < splitToWords(hosts[1]?.parent_b_name).length - 1 ? '\u00A0' : '' }}</span>
          </p>
        </div>
      </div>

      <!-- Row 4: Logo -->
      <div class="logo-row my-6">
        <div class="logo-content bounce-in-element" :style="{ animationDelay: `${animationDelays.logo}s` }">
          <img
            v-if="logoUrl"
            :src="logoUrl"
            alt="Event Logo"
            class="host-logo-showcase"
            loading="eager"
            fetchpriority="high"
          />
          <div
            v-else
            class="fallback-logo-wrapper"
            :style="fallbackLogoStyle"
          >
            <div
              class="host-logo-showcase fallback-logo-svg"
              v-html="fallbackLogoSvgContent"
            />
          </div>
        </div>
      </div>

      <!-- Row 5: Host Titles -->
      <div v-if="hosts.length > 0" class="title-row">
        <!-- Host 1 Title (45% width) -->
        <div class="host-title-left">
          <p
            :class="[
              'parent-name-text leading-normal text-center opacity-90',
              currentLanguage === 'kh' && 'khmer-text-fix',
            ]"
            :style="{
              color: primaryColor,
              fontFamily: secondaryFont || currentFont,
              wordWrap: 'break-word',
              hyphens: 'auto',
            }"
          >
            <span
              v-for="(word, index) in splitToWords(hosts[0].title || (hosts.length === 2 ? 'Bridegroom' : hosts.length === 1 ? 'Host' : 'Host 1'))"
              :key="`title-left-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.titleLeft + index * WORD_DELAY}s` }"
            >{{ word }}{{ index < splitToWords(hosts[0].title || (hosts.length === 2 ? 'Bridegroom' : hosts.length === 1 ? 'Host' : 'Host 1')).length - 1 ? '\u00A0' : '' }}</span>
          </p>
        </div>

        <!-- Center spacer (10% width) -->
        <div class="center-spacer"></div>

        <!-- Host 2 Title (45% width) -->
        <div class="host-title-right">
          <p
            v-if="hosts.length > 1"
            :class="[
              'parent-name-text leading-normal text-center opacity-90',
              currentLanguage === 'kh' && 'khmer-text-fix',
            ]"
            :style="{
              color: primaryColor,
              fontFamily: secondaryFont || currentFont,
              wordWrap: 'break-word',
              hyphens: 'auto',
            }"
          >
            <span
              v-for="(word, index) in splitToWords(hosts[1]?.title || 'Bride')"
              :key="`title-right-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.titleRight + index * WORD_DELAY}s` }"
            >{{ word }}{{ index < splitToWords(hosts[1]?.title || 'Bride').length - 1 ? '\u00A0' : '' }}</span>
          </p>
        </div>
      </div>

      <!-- Row 6: Host Names -->
      <div v-if="hosts.length > 0" class="name-row">
        <!-- Host 1 Name (45% width) -->
        <div class="host-name-left">
          <h3
            :class="[
              'host-name-text font-regular leading-tight',
              currentLanguage === 'kh' && 'khmer-text-fix',
            ]"
            :style="{
              color: primaryColor,
              fontFamily: primaryFont || secondaryFont || currentFont,
            }"
          >
            <span
              v-for="(word, index) in splitToWords(hosts[0].name)"
              :key="`name-left-${currentLanguage}-${index}`"
              class="bounce-word"
              :style="{ animationDelay: `${animationDelays.nameLeft + index * WORD_DELAY}s` }"
            >{{ word }}{{ index < splitToWords(hosts[0].name).length - 1 ? '\u00A0' : '' }}</span>
          </h3>
        </div>

        <!-- Center spacer (10% width) -->
        <div class="center-spacer"></div>

        <!-- Host 2 Name (45% width) -->
        <div class="host-name-right">
          <h3
            v-if="hosts.length > 1"
            :class="[
              'host-name-text font-regular leading-tight',
              currentLanguage === 'kh' && 'khmer-text-fix',
            ]"
            :style="{
              color: primaryColor,
              fontFamily: primaryFont || secondaryFont || currentFont,
            }"
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

      <!-- Row 7: Host Profile Pictures (only show if both hosts have profile images) -->
      <div
        v-if="hosts.length === 2 && hosts[0].profile_image && hosts[1].profile_image"
        class="profile-picture-row"
      >
        <!-- Host 1 Profile Picture (45% width) -->
        <div class="host-profile-left">
          <div class="profile-picture-container bounce-in-element" :style="{ animationDelay: `${animationDelays.profileLeft}s` }">
            <div
              v-if="hosts[0].profile_image"
              class="profile-picture-wrapper"
              :style="{
                background: primaryColor
              }"
            >
              <img
                :src="getMediaUrl(hosts[0].profile_image)"
                :alt="`${hosts[0].name} profile`"
                class="profile-picture"
              />
            </div>
            <div
              v-else
              class="profile-picture-fallback"
              :style="{
                background: primaryColor,
              }"
            >
              <User class="profile-icon" />
            </div>
          </div>
        </div>

        <!-- Center spacer (10% width) -->
        <div class="center-spacer"></div>

        <!-- Host 2 Profile Picture (45% width) -->
        <div class="host-profile-right">
          <div v-if="hosts.length > 1" class="profile-picture-container bounce-in-element" :style="{ animationDelay: `${animationDelays.profileRight}s` }">
            <div
              v-if="hosts[1]?.profile_image"
              class="profile-picture-wrapper"
              :style="{
                background: primaryColor
              }"
            >
              <img
                :src="getMediaUrl(hosts[1].profile_image)"
                :alt="`${hosts[1].name} profile`"
                class="profile-picture"
              />
            </div>
            <div
              v-else
              class="profile-picture-fallback"
              :style="{
                background: primaryColor,
              }"
            >
              <User class="profile-icon" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { User } from 'lucide-vue-next'
import type { Host } from '../../../composables/useEventShowcase'
import { apiService } from '../../../services/api'
import fallbackLogoSvg from '../../../assets/temp-showcase-logo.svg?raw'

interface Props {
  hosts: Host[]
  logoUrl?: string
  eventInitial: string
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  welcomeMessage?: string
  currentLanguage?: string
}

const props = defineProps<Props>()

// Split text into words for animation
const splitToWords = (text: string | null | undefined): string[] => {
  if (!text) return []
  return text.split(/\s+/).filter(Boolean)
}

// Animation timing constants
const WORD_DELAY = 0.08 // delay between each word
const ELEMENT_GAP = 0.08 // gap between elements

// Calculate animation delay for a text based on its length
const getTextAnimationDuration = (text: string | null | undefined): number => {
  if (!text) return 0
  const wordCount = splitToWords(text).length
  return wordCount * WORD_DELAY
}

// Computed animation delays - calculates cumulative delays based on text lengths
const animationDelays = computed(() => {
  let currentDelay = 0.1 // starting delay

  const getNextDelay = (text: string | null | undefined, skipIfEmpty = true): number => {
    if (skipIfEmpty && !text) return currentDelay
    const startDelay = currentDelay
    const duration = getTextAnimationDuration(text)
    currentDelay = startDelay + duration + ELEMENT_GAP
    return startDelay
  }

  // Row 1: Welcome Message
  const welcome = getNextDelay(props.welcomeMessage || 'Welcome to Our Event')

  // Row 2: Parent A Names (left then right)
  const parentALeft = getNextDelay(props.hosts[0]?.parent_a_name || props.hosts[0]?.parent_b_name)
  const parentARight = getNextDelay(
    props.hosts.length > 1 ? (props.hosts[1]?.parent_a_name || props.hosts[1]?.parent_b_name) : null
  )

  // Row 3: Parent B Names (left then right) - only if both parent_a and parent_b exist
  const parentBLeft = getNextDelay(
    (props.hosts[0]?.parent_b_name && props.hosts[0]?.parent_a_name) ? props.hosts[0].parent_b_name : null
  )
  const parentBRight = getNextDelay(
    (props.hosts.length > 1 && props.hosts[1]?.parent_b_name && props.hosts[1]?.parent_a_name)
      ? props.hosts[1].parent_b_name : null
  )

  // Row 4: Logo
  const logo = currentDelay
  currentDelay += 0.25 // logo animation time + gap

  // Row 5: Titles (left then right)
  const titleLeft = getNextDelay(
    props.hosts[0]?.title || (props.hosts.length === 2 ? 'Bridegroom' : props.hosts.length === 1 ? 'Host' : 'Host 1')
  )
  const titleRight = getNextDelay(
    props.hosts.length > 1 ? (props.hosts[1]?.title || 'Bride') : null
  )

  // Row 6: Names (left then right)
  const nameLeft = getNextDelay(props.hosts[0]?.name)
  const nameRight = getNextDelay(props.hosts.length > 1 ? props.hosts[1]?.name : null)

  // Row 7: Profile Pictures (left then right)
  const profileLeft = currentDelay
  currentDelay += 0.15
  const profileRight = currentDelay

  return {
    welcome,
    parentALeft,
    parentARight,
    parentBLeft,
    parentBRight,
    logo,
    titleLeft,
    titleRight,
    nameLeft,
    nameRight,
    profileLeft,
    profileRight,
  }
})

// Utility method to get full URL for media
const getMediaUrl = (mediaUrl: string | null | undefined): string | undefined => {
  return apiService.getProfilePictureUrl(mediaUrl) || undefined
}

// Computed property to process SVG content and add fill="currentColor"
const fallbackLogoSvgContent = computed(() => {
  // Add fill="currentColor" to all <path> elements
  return fallbackLogoSvg.replace(/<path /g, '<path fill="currentColor" ')
})

// Computed style for fallback logo with primary color
const fallbackLogoStyle = computed(() => {
  return {
    color: props.primaryColor,
    filter: `drop-shadow(0 4px 20px ${props.primaryColor}40)`,
  }
})
</script>

<style scoped>
/* Main wrapper with responsive padding */
.host-info-wrapper {
  width: 100%;
  padding: 0;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* Grid container with 7 rows (added profile picture row) */
.host-info-grid {
  display: grid;
  grid-template-rows: auto auto auto auto auto auto auto;
  width: 100%;
  gap: 0.25rem;
  overflow: hidden;
  box-sizing: border-box;
}

/* Row layouts with flexible 3-column structure */
.parent-row,
.title-row,
.name-row,
.profile-picture-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  width: 100%;
  align-items: center;
  overflow: hidden;
  box-sizing: border-box;
}

/* Reduce spacing between parent rows */
.parent-row:nth-child(3) {
  margin-top: -0.25rem;
}

/* Khmer-specific spacing reduction for parent rows */
.khmer-text .parent-row:nth-child(3) {
  margin-top: -0.75rem;
}

/* Reduce spacing between title and name rows */
.name-row {
  margin-top: -0.125rem;
}

/* Khmer-specific spacing reduction between title and name */
.khmer-text .title-row {
  margin-top: -0.5rem;
}

.khmer-text .name-row {
  margin-top: -0.75rem;
}

/* Khmer-specific spacing reduction for profile pictures */
.khmer-text .profile-picture-row {
  margin-top: -0.5rem;
}

/* Welcome row (full width) */
.welcome-row {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 0;
  margin-bottom: 0.5rem;
  box-sizing: border-box;
}

.welcome-content {
  text-align: center;
  width: 100%;
  box-sizing: border-box;
}

/* Logo row (full width centered) */
.logo-row {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 1.5rem 1rem;
  box-sizing: border-box;
}

.logo-content {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

/* Column alignments */
.host-parent-left,
.host-title-left,
.host-name-left,
.host-profile-left {
  text-align: center;
  overflow: hidden;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.host-parent-right,
.host-title-right,
.host-name-right,
.host-profile-right {
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

/* Khmer-specific center spacer adjustments */
.khmer-text .center-spacer {
  width: 0.5rem;
}

/* Parent name text styles with increased sizes */
.parent-name-text {
  font-size: 0.7906rem; /* 12.65px - 15% increase from 11px (mobile) */
}

/* Host name text styles with 15% mobile reduction */
.host-name-text {
  font-size: 0.85rem; /* 13.6px - 15% reduction from 16px (mobile) */
}

/* Title and Name text styles now use Tailwind classes */

/* Logo styles */
.host-logo-showcase {
  height: auto;
  max-height: 180px; /* Match CoverStage mobile size */
  width: auto;
  max-width: min(330px, 95%); /* Responsive width with 95% viewport constraint */
  object-fit: contain;
  transition: transform 0.3s ease;
}

.host-logo-showcase:hover {
  transform: scale(1.05);
}

.logo-fallback {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.logo-initial {
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
}

/* Fallback SVG Logo Styles */
.fallback-logo-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  height: auto;
  overflow: hidden;
}

.fallback-logo-svg {
  transition: transform 0.3s ease;
  display: block;
  width: auto;
  height: auto;
  max-width: min(330px, 95%); /* Responsive width with 95% viewport constraint */
  max-height: 180px; /* Match mobile size */
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

/* Responsive sizing for fallback SVG - match .host-logo-showcase */
@media (min-width: 640px) {
  .fallback-logo-svg {
    max-width: min(350px, 95%);
    max-height: 140px;
  }

  .fallback-logo-svg :deep(svg) {
    max-width: min(350px, 95vw);
    max-height: 140px;
  }
}

@media (min-width: 768px) {
  .fallback-logo-svg {
    max-width: min(375px, 95%);
    max-height: 150px;
  }

  .fallback-logo-svg :deep(svg) {
    max-width: min(375px, 95vw);
    max-height: 150px;
  }
}

@media (min-width: 1920px) {
  .fallback-logo-svg {
    max-width: min(450px, 95%);
    max-height: 180px;
  }

  .fallback-logo-svg :deep(svg) {
    max-width: min(450px, 95vw);
    max-height: 180px;
  }
}

/* Profile Picture Styles */
.profile-picture-row {
  margin-top: 0.5rem;
}

.profile-picture-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.profile-picture-wrapper {
  width: 75%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  padding: 2px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.profile-picture {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: none;
}

.profile-picture-fallback {
  width: 75%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.profile-icon {
  width: 50%;
  height: 50%;
  color: white;
}

/* Bounce In Animation for non-text elements (logo, profile pictures) */
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

/* Word-by-word reveal animation for all languages */
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

/* Enhanced reveal animation for Khmer text on non-text elements */
.khmer-text .bounce-in-element {
  animation: revealKhmerElement 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes revealKhmerElement {
  0% {
    opacity: 0;
    transform: scale(0.85) translateY(12px);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Gleam Animation */
.gleam-animation {
  animation: gradientShift 3s ease-in-out infinite;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Responsive breakpoints */

/* Small phones (sm: 640px) */
@media (min-width: 640px) {
  .host-info-grid {
    gap: 0.25rem;
  }

  .name-row {
    margin-top: -0.125rem;
  }

  .welcome-row {
    margin-bottom: 0.625rem;
  }

  .parent-name-text {
    font-size: 0.9344rem; /* 14.95px - 15% increase from 13px */
  }

  .parent-row:nth-child(3) {
    margin-top: -0.125rem;
  }

  .host-name-text {
    font-size: 0.95625rem; /* 15.3px - 15% reduction from 18px */
  }

  .host-logo-showcase {
    max-height: 140px; /* Match CoverStage 640px+ */
    max-width: min(350px, 95%); /* Responsive width with 95% viewport constraint */
  }

  .logo-fallback {
    width: 112px;
    height: 112px;
  }

  .logo-initial {
    font-size: 1.875rem;
  }
}

/* Tablets (md: 768px) */
@media (min-width: 768px) {
  .host-info-grid {
    gap: 0.625rem;
  }

  .name-row {
    margin-top: -0.375rem;
  }

  .parent-name-text {
    font-size: 1.0781rem; /* 17.25px - 15% increase from 15px */
  }

  .parent-row:nth-child(3) {
    margin-top: -0.375rem;
  }

  .host-name-text {
    font-size: 1.0625rem; /* 17px - 15% reduction from 20px */
  }

  .host-logo-showcase {
    max-height: 150px; /* Match CoverStage 768px+ */
    max-width: min(375px, 95%); /* Responsive width with 95% viewport constraint */
  }

  .logo-fallback {
    width: 128px;
    height: 128px;
  }

  .logo-initial {
    font-size: 2.25rem;
  }
}

/* Small laptops 13-inch (laptop-sm: 1024px) - Using mobile view styles */
@media (min-width: 1024px) and (max-width: 1365px) {
  .host-info-grid {
    gap: 0.25rem; /* Match mobile */
  }

  .logo-row {
    padding: 0.75rem 1rem; /* Slightly reduced vertical padding from 1rem to 0.75rem */
    margin-top: -0.25rem; /* Slightly pull logo closer to parent names */
    margin-bottom: 0.5rem; /* Add more space to host titles */
  }

  .name-row {
    margin-top: -0.125rem; /* Match mobile */
  }

  /* Override Tailwind's lg:text-4xl to reduce size for laptop */
  .welcome-content h2 {
    font-size: 1.25rem !important; /* Reduced from 1.5rem (24px) to 1.25rem (20px) */
    line-height: 1.25 !important; /* Match mobile line height */
  }

  .parent-name-text {
    font-size: 0.55rem; /* Reduced from 0.6rem (9.6px) to 0.55rem (8.8px) */
  }

  .parent-row:nth-child(3) {
    margin-top: -0.25rem; /* Match mobile */
  }

  .host-name-text {
    font-size: 0.7rem; /* Reduced from 0.75rem (12px) to 0.7rem (11.2px) */
  }

  .host-logo-showcase {
    max-height: 180px; /* Match mobile */
    max-width: min(330px, 95%); /* Responsive width with 95% viewport constraint */
  }

  .logo-fallback {
    width: 96px; /* Match mobile */
    height: 96px;
  }

  .logo-initial {
    font-size: 1.5rem; /* Match mobile */
  }

  .profile-picture-wrapper {
    width: 75%; /* Match mobile */
  }

  .profile-picture-fallback {
    width: 75%; /* Match mobile */
  }

  .welcome-row {
    margin-bottom: 0.5rem; /* Match mobile */
  }
}

/* Medium laptops 14-15 inch (laptop-md: 1366px+) - Using mobile view styles */
@media (min-width: 1366px) {
  .host-info-grid {
    gap: 0.25rem; /* Match mobile */
  }

  .logo-row {
    padding: 0.75rem 1rem; /* Slightly reduced vertical padding from 1rem to 0.75rem */
    margin-top: -0.25rem; /* Slightly pull logo closer to parent names */
    margin-bottom: 0.5rem; /* Add more space to host titles */
  }

  .name-row {
    margin-top: -0.125rem; /* Match mobile */
  }

  .khmer-text .name-row {
    margin-top: -0.75rem; /* Match mobile Khmer */
  }

  /* Override Tailwind's lg:text-4xl to reduce size for laptop */
  .welcome-content h2 {
    font-size: 1.25rem !important; /* Reduced from 1.5rem (24px) to 1.25rem (20px) */
    line-height: 1.25 !important;
  }

  .parent-name-text {
    font-size: 0.55rem; /* Reduced from 0.6rem (9.6px) to 0.55rem (8.8px) */
  }

  .parent-row:nth-child(3) {
    margin-top: -0.25rem; /* Match mobile */
  }

  .khmer-text .parent-row:nth-child(3) {
    margin-top: -0.75rem; /* Match mobile Khmer */
  }

  .host-name-text {
    font-size: 0.7rem; /* Reduced from 0.75rem (12px) to 0.7rem (11.2px) */
  }

  .host-logo-showcase {
    max-height: 180px; /* Match mobile */
    max-width: min(330px, 95%); /* Responsive width with 95% viewport constraint */
  }

  .logo-fallback {
    width: 96px; /* Match mobile */
    height: 96px;
  }

  .logo-initial {
    font-size: 1.5rem; /* Match mobile */
  }

  .profile-picture-wrapper {
    width: 75%; /* Match mobile */
  }

  .profile-picture-fallback {
    width: 75%; /* Match mobile */
  }

  .welcome-row {
    margin-bottom: 0.5rem; /* Match mobile */
  }
}

/* Large laptops 16+ inch (laptop-lg: 1536px) - Using mobile view styles */
@media (min-width: 1536px) {
  .host-info-grid {
    gap: 0.25rem; /* Match mobile */
  }

  .logo-row {
    padding: 0.75rem 1rem; /* Slightly reduced vertical padding from 1rem to 0.75rem */
    margin-top: -0.25rem; /* Slightly pull logo closer to parent names */
    margin-bottom: 0.5rem; /* Add more space to host titles */
  }

  .name-row {
    margin-top: -0.125rem; /* Match mobile */
  }

  .khmer-text .name-row {
    margin-top: -0.75rem; /* Match mobile Khmer */
  }

  .parent-name-text {
    font-size: 0.55rem; /* Reduced from 0.6rem (9.6px) to 0.55rem (8.8px) */
  }

  .parent-row:nth-child(3) {
    margin-top: -0.25rem; /* Match mobile */
  }

  .khmer-text .parent-row:nth-child(3) {
    margin-top: -0.75rem; /* Match mobile Khmer */
  }

  .host-name-text {
    font-size: 0.7rem; /* Reduced from 0.75rem (12px) to 0.7rem (11.2px) */
  }

  .host-logo-showcase {
    max-height: 180px; /* Match mobile */
    max-width: min(330px, 95%); /* Responsive width with 95% viewport constraint */
  }

  .logo-fallback {
    width: 96px; /* Match mobile */
    height: 96px;
  }

  .logo-initial {
    font-size: 1.5rem; /* Match mobile */
  }

  .profile-picture-wrapper {
    width: 75%; /* Match mobile */
  }

  .profile-picture-fallback {
    width: 75%; /* Match mobile */
  }

  .welcome-row {
    margin-bottom: 0.5rem; /* Match mobile */
  }
}

/* Desktop Full HD+ (desktop: 1920px) */
@media (min-width: 1920px) {
  .host-info-grid {
    gap: 0.875rem;
  }

  .name-row {
    margin-top: -0.75rem;
  }

  .khmer-text .name-row {
    margin-top: -1.5rem;
  }

  /* Reduce welcome header text size for desktop */
  .welcome-content h2 {
    font-size: 1.875rem !important; /* 30px - text-3xl instead of text-4xl */
  }

  .parent-name-text {
    font-size: 1.0063rem; /* 16.1px - 15% increase from 14px */
  }

  .parent-row:nth-child(3) {
    margin-top: -0.75rem;
  }

  .khmer-text .parent-row:nth-child(3) {
    margin-top: -1.5rem;
  }

  .host-name-text {
    font-size: 1.25rem; /* 20px - optimized for Full HD+ desktop */
  }

  .host-logo-showcase {
    max-height: 180px; /* Desktop size */
    max-width: min(450px, 95%); /* Responsive width with 95% viewport constraint */
  }

  .logo-row {
    padding: 1.5rem 1rem; /* Maintain horizontal padding on desktop */
  }

  .logo-fallback {
    width: 180px;
    height: 180px;
  }

  .logo-initial {
    font-size: 4rem;
  }

  .profile-picture-wrapper {
    width: 62%;
  }

  .profile-picture-fallback {
    width: 62%;
  }
}

/* Khmer language mobile adjustments */
@media (max-width: 768px) {
  .khmer-text .parent-row,
  .khmer-text .title-row,
  .khmer-text .name-row {
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  }
}

/* Extra small phones */
@media (max-width: 374px) {
  .host-info-grid {
    gap: 0.25rem;
  }

  .host-logo-showcase {
    max-height: 100px;
    max-width: min(240px, 90%); /* Tighter constraint for very small screens */
  }

  .logo-row {
    padding: 1.5rem 0.5rem; /* Reduce horizontal padding on very small screens */
  }

  .logo-fallback {
    width: 80px;
    height: 80px;
  }

  .logo-initial {
    font-size: 1.25rem;
  }
}

/* Khmer text fix now defined globally in src/assets/main.css */

/* Additional Khmer text adjustments - removed as we're using Tailwind classes */

/* iPad and tablet portrait adjustments */
@media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
  .parent-row,
  .title-row,
  .name-row {
    grid-template-columns: 1fr auto 1fr;
  }
}
</style>
