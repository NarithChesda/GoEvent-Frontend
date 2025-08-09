<template>
  <div class="host-info-container mb-12 px-4 md:px-8">
    <!-- Top Section: Parents Names -->
    <div v-if="hosts.length > 0" class="mt-4 mb-2">
      <div class="flex justify-center gap-6 md:gap-10">
        <!-- Host 1 Parents -->
        <div class="text-center flex-1" style="max-width: 220px;">
          <p
            class="parent-name"
            :style="{
              color: primaryColor,
              fontFamily: currentFont
            }"
          >
            {{ hosts[0].parent_a_name || 'Father Name' }}
          </p>
          <p
            class="parent-name"
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
            class="parent-name"
            :style="{
              color: primaryColor,
              fontFamily: currentFont
            }"
          >
            {{ hosts[1].parent_a_name || 'Father Name' }}
          </p>
          <p
            class="parent-name"
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
    <div class="logo-section my-4 px-4 md:px-12">
      <div class="flex justify-center">
        <div class="logo-container p-4 md:p-6">
          <img
            v-if="logoUrl"
            :src="logoUrl"
            alt="Event Logo"
            class="h-32 md:h-40 w-auto max-w-full object-contain drop-shadow-2xl mx-auto"
          />
          <div
            v-else
            class="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center mx-auto shadow-2xl"
            :style="{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || accentColor})`
            }"
          >
            <span class="text-white font-bold text-4xl md:text-5xl" :style="{ fontFamily: currentFont }">
              {{ eventInitial }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Bride & Groom Labels and Names -->
    <div v-if="hosts.length > 0" class="hosts-section">
      <div class="flex justify-center gap-6 md:gap-10">
        <!-- Host 1 (Bride/Groom) -->
        <div class="text-center flex-1" style="max-width: 220px;">
          <p
            class="text-sm md:text-base font-medium mb-2 opacity-80"
            :style="{ color: primaryColor }"
          >
            {{ hosts.length === 2 ? 'Bridegroom' : hosts.length === 1 ? 'Host' : 'Host 1' }}
          </p>
          <h3
            class="host-name font-bold"
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
            class="host-name font-bold"
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
/* Parent name handling */
.parent-name {
  white-space: nowrap;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Host name handling - single line with auto font scaling */
.host-name {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  max-width: 100%;
}

/* Parent name styling - match bride/groom label sizes */
.parent-name {
  font-size: 0.875rem; /* Same as text-sm */
  line-height: 1.2;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

@media (min-width: 768px) {
  .parent-name {
    font-size: 1rem; /* Same as md:text-base */
    line-height: 1.3;
  }
}

/* Host name styling - 15% smaller and centered layout */
.host-name {
  font-size: clamp(0.85rem, 3.4vw, 1.06rem); /* 15% reduction */
  line-height: 1.1;
}

@media (min-width: 768px) {
  .host-name {
    font-size: clamp(0.94rem, 2.55vw, 1.19rem); /* 15% reduction */
    line-height: 1.2;
  }
}

@media (min-width: 1024px) {
  .host-name {
    font-size: clamp(1.02rem, 2.12vw, 1.28rem); /* 15% reduction */
    line-height: 1.2;
  }
}

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
