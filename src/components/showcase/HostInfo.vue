<template>
  <div class="host-info-container mb-6 sm:mb-8 laptop-sm:mb-8 laptop-md:mb-10 laptop-lg:mb-12 desktop:mb-12 px-2 sm:px-4 md:px-6 laptop-sm:px-8 laptop-md:px-10 laptop-lg:px-12 desktop:px-8">
    <!-- Top Section: Parents Names -->
    <div v-if="hosts.length > 0" class="mt-2 sm:mt-3 laptop-sm:mt-4 mb-1 sm:mb-2">
      <div class="flex justify-center gap-4 sm:gap-6 md:gap-8 laptop-sm:gap-10 laptop-md:gap-12 laptop-lg:gap-14 desktop:gap-10">
        <!-- Host 1 Parents -->
        <div class="text-center flex-1" style="max-width: 220px;">
          <p
            class="text-xs sm:text-sm md:text-base font-medium text-ellipsis overflow-hidden whitespace-nowrap"
            :style="{
              color: primaryColor,
              fontFamily: currentFont
            }"
          >
            {{ hosts[0].parent_a_name || 'Father Name' }}
          </p>
          <p
            class="text-xs sm:text-sm md:text-base font-medium text-ellipsis overflow-hidden whitespace-nowrap"
            :style="{
              color: primaryColor,
              fontFamily: currentFont
            }"
          >
            {{ hosts[0].parent_b_name || 'Mother Name' }}
          </p>
        </div>

        <!-- Spacer for heart alignment -->
        <div v-if="hosts.length > 1" class="flex items-center px-2">
          <span class="text-2xl md:text-3xl font-light opacity-0"></span>
        </div>

        <!-- Host 2 Parents -->
        <div v-if="hosts.length > 1" class="text-center flex-1" style="max-width: 220px;">
          <p
            class="text-xs sm:text-sm md:text-base font-medium text-ellipsis overflow-hidden whitespace-nowrap"
            :style="{
              color: primaryColor,
              fontFamily: currentFont
            }"
          >
            {{ hosts[1].parent_a_name || 'Father Name' }}
          </p>
          <p
            class="text-xs sm:text-sm md:text-base font-medium text-ellipsis overflow-hidden whitespace-nowrap"
            :style="{
              color: primaryColor,
              fontFamily: currentFont
            }"
          >
            {{ hosts[1].parent_b_name || 'Mother Name' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Middle Section: Logo (Highlight) -->
    <div class="logo-section my-2 sm:my-3 laptop-sm:my-4 laptop-md:my-5 laptop-lg:my-6 desktop:my-4 px-2 sm:px-4 md:px-8 laptop-sm:px-10 laptop-md:px-12 laptop-lg:px-16 desktop:px-12">
      <div class="flex justify-center">
        <div class="logo-container p-2 sm:p-3 md:p-4 laptop-sm:p-5 laptop-md:p-6 laptop-lg:p-7 desktop:p-6">
          <img
            v-if="logoUrl"
            :src="logoUrl"
            alt="Event Logo"
            class="h-24 sm:h-28 md:h-32 laptop-sm:h-36 laptop-md:h-40 laptop-lg:h-44 desktop:h-40 w-auto max-w-full object-contain drop-shadow-2xl mx-auto"
          />
          <div
            v-else
            class="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 laptop-sm:w-36 laptop-sm:h-36 laptop-md:w-40 laptop-md:h-40 laptop-lg:w-44 laptop-lg:h-44 desktop:w-40 desktop:h-40 rounded-full flex items-center justify-center mx-auto shadow-2xl"
            :style="{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`
            }"
          >
            <span class="text-white font-bold text-2xl sm:text-3xl md:text-4xl laptop-sm:text-5xl laptop-md:text-6xl laptop-lg:text-7xl desktop:text-5xl" :style="{ fontFamily: currentFont }">
              {{ eventInitial }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Bride & Groom Labels and Names -->
    <div v-if="hosts.length > 0" class="hosts-section">
      <div class="flex justify-center gap-4 sm:gap-6 md:gap-8 laptop-sm:gap-10 laptop-md:gap-12 laptop-lg:gap-14 desktop:gap-10">
        <!-- Host 1 (Bride/Groom) -->
        <div class="text-center flex-1" style="max-width: 220px;">
          <p
            class="text-sm md:text-base font-medium mb-2 opacity-80"
            :style="{ color: primaryColor }"
          >
            {{ hosts.length === 2 ? 'Bridegroom' : hosts.length === 1 ? 'Host' : 'Host 1' }}
          </p>
          <h3
            class="text-base sm:text-lg md:text-xl font-bold text-ellipsis overflow-hidden whitespace-nowrap text-center"
            :style="{
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: currentFont
            }"
          >
            {{ hosts[0].name }}
          </h3>
        </div>

        <!-- Divider (Heart or &) - Only show if two hosts -->
        <div v-if="hosts.length > 1" class="flex items-center px-2">
          <span
            class="text-2xl md:text-3xl font-light opacity-70"
            :style="{ color: primaryColor }"
          >
            ♥
          </span>
        </div>

        <!-- Host 2 (Bride/Groom) -->
        <div v-if="hosts.length > 1" class="text-center flex-1" style="max-width: 220px;">
          <p
            class="text-sm md:text-base font-medium mb-2 opacity-80"
            :style="{ color: primaryColor }"
          >
            {{ 'Bride' }}
          </p>
          <h3
            class="text-base sm:text-lg md:text-xl font-bold text-ellipsis overflow-hidden whitespace-nowrap text-center"
            :style="{
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: currentFont
            }"
          >
            {{ hosts[1].name }}
          </h3>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Host } from '../../composables/useEventShowcase'

interface Props {
  hosts: Host[]
  logoUrl?: string
  eventInitial: string
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  currentFont: string
}

defineProps<Props>()
</script>

<style scoped>
/* Typography styles are now handled by Tailwind responsive classes */

/* Mobile optimizations */
@media (max-width: 768px) {
  .host-info-container {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .logo-section {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>
