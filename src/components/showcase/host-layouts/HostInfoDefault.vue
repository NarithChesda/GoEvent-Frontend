<template>
  <div class="host-info-default" :class="{ 'khmer-text': currentLanguage === 'kh' }">
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
        {{ welcomeMessage || 'Welcome to Our Event' }}
      </h2>
    </div>

    <!-- Logo (Centered) -->
    <div class="flex justify-center mb-8 sm:mb-10">
      <img
        v-if="logoUrl"
        :src="logoUrl"
        alt="Event Logo"
        class="default-logo"
      />
      <div
        v-else
        class="logo-fallback"
        :style="{
          backgroundColor: primaryColor,
        }"
      >
        <span class="logo-initial" :style="{ fontFamily: primaryFont || currentFont }">
          {{ eventInitial }}
        </span>
      </div>
    </div>

    <!-- Hosts Grid - Dynamic based on host count -->
    <div v-if="hosts.length > 0" :class="gridClasses">
      <div
        v-for="host in hosts"
        :key="host.id"
        class="host-card text-center"
      >
        <!-- Profile Picture -->
        <div v-if="host.profile_image" class="flex justify-center mb-3">
          <div
            class="profile-wrapper"
            :style="{
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`
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
          :class="[
            'text-xs sm:text-sm opacity-75 mb-1',
            currentLanguage === 'kh' && 'khmer-text-fix',
          ]"
          :style="{
            color: primaryColor,
            fontFamily: secondaryFont || currentFont,
          }"
        >
          {{ host.title }}
        </p>

        <!-- Host Name -->
        <h4
          :class="[
            'text-lg sm:text-xl md:text-2xl font-semibold leading-tight',
            currentLanguage === 'kh' && 'khmer-text-fix',
          ]"
          :style="{
            color: primaryColor,
            fontFamily: primaryFont || currentFont,
          }"
        >
          {{ host.name }}
        </h4>

        <!-- Host Bio -->
        <p
          v-if="host.bio"
          :class="[
            'text-xs sm:text-sm mt-2 opacity-80',
            currentLanguage === 'kh' && 'khmer-text-fix',
          ]"
          :style="{
            color: primaryColor,
            fontFamily: currentFont,
          }"
        >
          {{ host.bio }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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

const props = defineProps<Props>()

const getMediaUrl = (mediaUrl: string | null | undefined): string | undefined => {
  return apiService.getProfilePictureUrl(mediaUrl) || undefined
}

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

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .default-logo,
  .logo-fallback,
  .profile-wrapper {
    transition: none;
  }

  .default-logo:hover,
  .logo-fallback:hover,
  .profile-wrapper:hover {
    transform: none;
  }
}
</style>
