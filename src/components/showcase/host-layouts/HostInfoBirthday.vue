<template>
  <div class="host-info-birthday" :class="{ 'khmer-text': currentLanguage === 'kh' }">
    <!-- Welcome Message -->
    <div class="text-center mb-6 sm:mb-8">
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
        {{ welcomeMessage || 'Happy Birthday!' }}
      </h2>
    </div>

    <!-- Single Host Profile Picture (Large & Centered) -->
    <div v-if="hosts[0]?.profile_image" class="flex justify-center mb-6 sm:mb-8">
      <div
        class="profile-picture-large"
        :style="{
          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
        }"
      >
        <img
          :src="getMediaUrl(hosts[0].profile_image)"
          :alt="`${hosts[0].name} profile`"
          class="profile-image"
        />
      </div>
    </div>

    <!-- Logo (Centered) -->
    <div class="flex justify-center mb-6 sm:mb-8">
      <img
        v-if="logoUrl"
        :src="logoUrl"
        alt="Event Logo"
        class="birthday-logo"
      />
      <div
        v-else-if="!hosts[0]?.profile_image"
        class="logo-fallback"
        :style="{
          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
        }"
      >
        <span class="logo-initial" :style="{ fontFamily: primaryFont || currentFont }">
          {{ eventInitial }}
        </span>
      </div>
    </div>

    <!-- Host Title & Name (Centered) -->
    <div v-if="hosts.length > 0" class="text-center space-y-2 sm:space-y-3 px-4">
      <!-- Title -->
      <p
        :class="[
          'text-sm sm:text-base opacity-75',
          currentLanguage === 'kh' && 'khmer-text-fix',
        ]"
        :style="{
          color: primaryColor,
          fontFamily: secondaryFont || currentFont,
        }"
      >
        {{ hosts[0]?.title || 'Birthday Star' }}
      </p>

      <!-- Name -->
      <h3
        :class="[
          'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight',
          currentLanguage === 'kh' && 'khmer-text-fix',
        ]"
        :style="{
          color: primaryColor,
          fontFamily: primaryFont || currentFont,
        }"
      >
        {{ hosts[0].name }}
      </h3>

      <!-- Bio (if available) -->
      <p
        v-if="hosts[0]?.bio"
        :class="[
          'text-base sm:text-lg opacity-90 mt-4 max-w-md mx-auto',
          currentLanguage === 'kh' && 'khmer-text-fix',
        ]"
        :style="{
          color: primaryColor,
          fontFamily: currentFont,
        }"
      >
        {{ hosts[0].bio }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Host } from '../../../composables/useEventShowcase'
import { apiService } from '../../../services/api'

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

const getMediaUrl = (mediaUrl: string | null | undefined): string | undefined => {
  return apiService.getProfilePictureUrl(mediaUrl) || undefined
}
</script>

<style scoped>
.host-info-birthday {
  padding: 1.5rem 0;
  width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
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

/* Birthday Logo */
.birthday-logo {
  max-height: 150px;
  max-width: 300px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.birthday-logo:hover {
  transform: scale(1.05);
}

/* Logo Fallback */
.logo-fallback {
  width: 120px;
  height: 120px;
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
  font-size: 3rem;
  font-weight: bold;
  color: white;
}

/* Khmer text adjustments */
.khmer-text-fix {
  line-height: 1.8 !important;
  padding-top: 0.3em !important;
  padding-bottom: 0.3em !important;
  margin-top: 0.2em;
  margin-bottom: 0.2em;
  word-break: keep-all !important;
  overflow-wrap: anywhere !important;
  hyphens: none !important;
  -webkit-hyphens: none !important;
}

/* Responsive adjustments */
@media (min-width: 640px) {
  .profile-picture-large {
    width: 250px;
    height: 250px;
    padding: 5px;
  }

  .birthday-logo {
    max-height: 180px;
    max-width: 350px;
  }

  .logo-fallback {
    width: 140px;
    height: 140px;
  }

  .logo-initial {
    font-size: 3.5rem;
  }
}

@media (min-width: 768px) {
  .host-info-birthday {
    padding: 2rem 0;
  }

  .profile-picture-large {
    width: 280px;
    height: 280px;
  }

  .birthday-logo {
    max-height: 200px;
    max-width: 400px;
  }

  .logo-fallback {
    width: 160px;
    height: 160px;
  }

  .logo-initial {
    font-size: 4rem;
  }
}

/* Desktop adjustments */
@media (min-width: 1920px) {
  .profile-picture-large {
    width: 300px;
    height: 300px;
  }

  .birthday-logo {
    max-height: 220px;
    max-width: 450px;
  }

  .logo-fallback {
    width: 180px;
    height: 180px;
  }

  .logo-initial {
    font-size: 4.5rem;
  }
}

/* Animation for profile picture */
@keyframes gentleFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.profile-picture-large {
  animation: gentleFloat 6s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .profile-picture-large {
    animation: none;
  }
}
</style>
