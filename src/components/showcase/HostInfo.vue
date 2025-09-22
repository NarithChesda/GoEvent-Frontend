<template>
  <div class="host-info-wrapper" :class="{ 'khmer-text': currentLanguage === 'kh' }">
    <!-- Grid container with 7 rows (added profile picture row) -->
    <div class="host-info-grid">

      <!-- Row 1: Welcome Header (moved from MainContentStage) -->
      <div class="welcome-row">
        <div class="welcome-content mt-6">
          <h2
            :class="[
              'text-base sm:text-lg md:text-xl lg:text-2xl font-semibold leading-tight uppercase gleam-animation',
              currentLanguage === 'kh' && 'khmer-text-fix'
            ]"
            :style="{
              fontFamily: primaryFont || currentFont,
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              backgroundSize: '200% 200%'
            }"
          >
            {{ welcomeMessage || 'Welcome to Our Event' }}
          </h2>
        </div>
      </div>

      <!-- Row 2: Host Parent A Names -->
      <div v-if="hosts.length > 0" class="parent-row">
        <!-- Host 1 Parent A (45% width) -->
        <div class="host-parent-left">
          <p
            :class="[
              'parent-name-text leading-normal text-center opacity-90',
              currentLanguage === 'kh' && 'khmer-text-fix'
            ]"
            :style="{
              color: primaryColor,
              fontFamily: secondaryFont || currentFont,
              wordWrap: 'break-word',
              hyphens: 'auto'
            }"
          >
            {{ hosts[0].parent_a_name || 'Father Name' }}
          </p>
        </div>

        <!-- Center spacer (10% width) -->
        <div class="center-spacer"></div>

        <!-- Host 2 Parent A (45% width) -->
        <div class="host-parent-right">
          <p
            v-if="hosts.length > 1"
            :class="[
              'parent-name-text leading-normal text-center opacity-90',
              currentLanguage === 'kh' && 'khmer-text-fix'
            ]"
            :style="{
              color: primaryColor,
              fontFamily: secondaryFont || currentFont,
              wordWrap: 'break-word',
              hyphens: 'auto'
            }"
          >
            {{ hosts[1]?.parent_a_name || 'Father Name' }}
          </p>
        </div>
      </div>

      <!-- Row 3: Host Parent B Names -->
      <div v-if="hosts.length > 0" class="parent-row">
        <!-- Host 1 Parent B (45% width) -->
        <div class="host-parent-left">
          <p
            :class="[
              'parent-name-text leading-normal text-center opacity-90',
              currentLanguage === 'kh' && 'khmer-text-fix'
            ]"
            :style="{
              color: primaryColor,
              fontFamily: secondaryFont || currentFont,
              wordWrap: 'break-word',
              hyphens: 'auto'
            }"
          >
            {{ hosts[0].parent_b_name || 'Mother Name' }}
          </p>
        </div>

        <!-- Center spacer (10% width) -->
        <div class="center-spacer"></div>

        <!-- Host 2 Parent B (45% width) -->
        <div class="host-parent-right">
          <p
            v-if="hosts.length > 1"
            :class="[
              'parent-name-text leading-normal text-center opacity-90',
              currentLanguage === 'kh' && 'khmer-text-fix'
            ]"
            :style="{
              color: primaryColor,
              fontFamily: secondaryFont || currentFont,
              wordWrap: 'break-word',
              hyphens: 'auto'
            }"
          >
            {{ hosts[1]?.parent_b_name || 'Mother Name' }}
          </p>
        </div>
      </div>

      <!-- Row 4: Logo -->
      <div class="logo-row my-6">
        <div class="logo-content">
          <img
            v-if="logoUrl"
            :src="logoUrl"
            alt="Event Logo"
            class="host-logo-showcase"
          />
          <div
            v-else
            class="logo-fallback"
            :style="{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`
            }"
          >
            <span class="logo-initial" :style="{ fontFamily: primaryFont || currentFont }">
              {{ eventInitial }}
            </span>
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
              currentLanguage === 'kh' && 'khmer-text-fix'
            ]"
            :style="{
              color: primaryColor,
              fontFamily: secondaryFont || currentFont,
              wordWrap: 'break-word',
              hyphens: 'auto'
            }"
          >
            {{ hosts[0].title || (hosts.length === 2 ? 'Bridegroom' : hosts.length === 1 ? 'Host' : 'Host 1') }}
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
              currentLanguage === 'kh' && 'khmer-text-fix'
            ]"
            :style="{
              color: primaryColor,
              fontFamily: secondaryFont || currentFont,
              wordWrap: 'break-word',
              hyphens: 'auto'
            }"
          >
            {{ hosts[1]?.title || 'Bride' }}
          </p>
        </div>
      </div>

      <!-- Row 6: Host Names -->
      <div v-if="hosts.length > 0" class="name-row">
        <!-- Host 1 Name (45% width) -->
        <div class="host-name-left">
          <h3
            :class="[
              'host-name-text font-semibold leading-tight uppercase gleam-animation',
              currentLanguage === 'kh' && 'khmer-text-fix'
            ]"
            :style="{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: primaryFont || secondaryFont || currentFont
            }"
          >
            {{ hosts[0].name }}
          </h3>
        </div>

        <!-- Center spacer (10% width) -->
        <div class="center-spacer"></div>

        <!-- Host 2 Name (45% width) -->
        <div class="host-name-right">
          <h3
            v-if="hosts.length > 1"
            :class="[
              'host-name-text font-semibold leading-tight uppercase gleam-animation',
              currentLanguage === 'kh' && 'khmer-text-fix'
            ]"
            :style="{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`,
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: primaryFont || secondaryFont || currentFont
            }"
          >
            {{ hosts[1]?.name }}
          </h3>
        </div>
      </div>

      <!-- Row 7: Host Profile Pictures (only show if both hosts have profile images) -->
      <div v-if="hosts.length === 2 && hosts[0].profile_image && hosts[1].profile_image" class="profile-picture-row">
        <!-- Host 1 Profile Picture (45% width) -->
        <div class="host-profile-left">
          <div class="profile-picture-container">
            <img
              v-if="hosts[0].profile_image"
              :src="getMediaUrl(hosts[0].profile_image)"
              :alt="`${hosts[0].name} profile`"
              class="profile-picture"
              :style="{
                borderColor: primaryColor
              }"
            />
            <div
              v-else
              class="profile-picture-fallback"
              :style="{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`
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
          <div v-if="hosts.length > 1" class="profile-picture-container">
            <img
              v-if="hosts[1]?.profile_image"
              :src="getMediaUrl(hosts[1].profile_image)"
              :alt="`${hosts[1].name} profile`"
              class="profile-picture"
              :style="{
                borderColor: primaryColor
              }"
            />
            <div
              v-else
              class="profile-picture-fallback"
              :style="{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`
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
import { User } from 'lucide-vue-next'
import type { Host } from '../../composables/useEventShowcase'
import { apiService } from '../../services/api'

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

defineProps<Props>()

// Utility method to get full URL for media
const getMediaUrl = (mediaUrl: string | null | undefined): string | null => {
  return apiService.getProfilePictureUrl(mediaUrl)
}
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

/* Reduce spacing between title and name rows */
.name-row {
  margin-top: -0.125rem;
}

/* Welcome row (full width) */
.welcome-row {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 0;
  margin-bottom: 1.5rem;
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
  padding: 1.5rem 0;
  box-sizing: border-box;
}

.logo-content {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
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

/* Parent name text styles with reduced sizes */
.parent-name-text {
  font-size: 0.5625rem; /* 9px - 25% reduction from 12px (mobile) */
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
  max-width: 330px; /* Match CoverStage mobile size */
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
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.logo-initial {
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
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

.profile-picture {
  width: 60%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.profile-picture-fallback {
  width: 60%;
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

/* Gleam Animation */
.gleam-animation {
  animation: gradientShift 3s ease-in-out infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
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
    margin-bottom: 2rem;
  }

  .parent-name-text {
    font-size: 0.6875rem; /* 11px - 22% reduction from 14px */
  }

  .parent-row:nth-child(3) {
    margin-top: -0.125rem;
  }

  .host-name-text {
    font-size: 0.95625rem; /* 15.3px - 15% reduction from 18px */
  }


  .host-logo-showcase {
    max-height: 140px; /* Match CoverStage 640px+ */
    max-width: 350px; /* Match CoverStage 640px+ */
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
    font-size: 0.8rem; /* 12.8px ≈ 13px - 20% reduction from 16px */
  }

  .parent-row:nth-child(3) {
    margin-top: -0.375rem;
  }

  .host-name-text {
    font-size: 1.0625rem; /* 17px - 15% reduction from 20px */
  }


  .host-logo-showcase {
    max-height: 150px; /* Match CoverStage 768px+ */
    max-width: 375px; /* Match CoverStage 768px+ */
  }

  .logo-fallback {
    width: 128px;
    height: 128px;
  }

  .logo-initial {
    font-size: 2.25rem;
  }
}

/* Small laptops (laptop-sm: 1024px) */
@media (min-width: 1024px) {

  .host-info-grid {
    gap: 0.75rem;
  }

  .name-row {
    margin-top: -0.5rem;
  }

  .parent-name-text {
    font-size: 0.8rem; /* 12.8px ≈ 13px - 20% reduction from 16px */
  }

  .parent-row:nth-child(3) {
    margin-top: -0.5rem;
  }

  .host-name-text {
    font-size: 1.0625rem; /* 17px - smaller than welcome header's 24px */
  }


  .host-logo-showcase {
    max-height: 140px; /* Match CoverStage 1024px+ */
    max-width: 350px; /* Match CoverStage 1024px+ */
  }

  .logo-fallback {
    width: 144px;
    height: 144px;
  }

  .logo-initial {
    font-size: 3rem;
  }
}

/* Medium laptops (laptop-md: 1280px) */
@media (min-width: 1280px) {

  .host-info-grid {
    gap: 0.875rem;
  }

  .name-row {
    margin-top: -0.625rem;
  }

  .parent-name-text {
    font-size: 0.8rem; /* 12.8px ≈ 13px - 20% reduction from 16px */
  }

  .parent-row:nth-child(3) {
    margin-top: -0.625rem;
  }

  .host-name-text {
    font-size: 1.125rem; /* 18px - smaller than welcome header's 24px */
  }


  .host-logo-showcase {
    max-height: 160px; /* Match CoverStage 1280px+ */
    max-width: 400px; /* Match CoverStage 1280px+ */
  }

  .logo-fallback {
    width: 160px;
    height: 160px;
  }

  .logo-initial {
    font-size: 3.5rem;
  }
}

/* Large laptops (laptop-lg: 1536px) */
@media (min-width: 1536px) {

  .host-info-grid {
    gap: 1rem;
  }

  .name-row {
    margin-top: -0.75rem;
  }

  .parent-name-text {
    font-size: 0.8rem; /* 12.8px ≈ 13px - 20% reduction from 16px */
  }

  .parent-row:nth-child(3) {
    margin-top: -0.75rem;
  }

  .host-name-text {
    font-size: 1.125rem; /* 18px - smaller than welcome header's 24px */
  }


  .host-logo-showcase {
    max-height: 180px; /* Match CoverStage 1536px+ */
    max-width: 450px; /* Match CoverStage 1536px+ */
  }

  .logo-fallback {
    width: 176px;
    height: 176px;
  }

  .logo-initial {
    font-size: 4rem;
  }
}

/* Desktop (desktop: 1920px) */
@media (min-width: 1920px) {

  .host-info-grid {
    gap: 1.125rem;
  }

  .name-row {
    margin-top: -0.875rem;
  }

  .parent-name-text {
    font-size: 0.8rem; /* 12.8px ≈ 13px - 20% reduction from 16px */
  }

  .parent-row:nth-child(3) {
    margin-top: -0.875rem;
  }

  .host-name-text {
    font-size: 1.125rem; /* 18px - smaller than welcome header's 24px */
  }


  .host-logo-showcase {
    max-height: 180px; /* CoverStage doesn't have 1920px+ override, keep 1536px+ */
    max-width: 450px; /* CoverStage doesn't have 1920px+ override, keep 1536px+ */
  }

  .logo-fallback {
    width: 208px;
    height: 208px;
  }

  .logo-initial {
    font-size: 4.5rem;
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
    max-width: 240px;
  }

  .logo-fallback {
    width: 80px;
    height: 80px;
  }

  .logo-initial {
    font-size: 1.25rem;
  }
}

/* Enhanced Khmer font rendering - matching EventInfo */
.khmer-text-fix {
  line-height: 1.8 !important;
  padding-top: 0.3em !important;
  padding-bottom: 0.3em !important;
  margin-top: 0.2em;
  margin-bottom: 0.2em;
}

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
