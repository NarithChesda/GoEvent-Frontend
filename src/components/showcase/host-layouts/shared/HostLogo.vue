<template>
  <div class="logo-row" :class="logoRowClass">
    <div
      class="logo-content"
      :class="{ 'bounce-in-element': animated }"
      :style="animated ? { animationDelay: `${animationDelay}s` } : undefined"
    >
      <!-- Custom logo image (event logo → sample_logo_1 → SVG fallback) -->
      <img
        v-if="resolvedLogoSrc"
        :src="resolvedLogoSrc"
        alt="Event Logo"
        class="host-logo-showcase"
        loading="eager"
        fetchpriority="high"
      />
      <!-- Fallback SVG logo -->
      <div
        v-else
        class="fallback-logo-container"
        :style="fallbackLogoStyle"
      >
        <div
          class="fallback-logo"
          v-html="fallbackLogoSvgContent"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useFallbackLogo, getMediaUrl } from '@/composables/showcase/useHostInfoUtils'

interface Props {
  logoUrl?: string
  /** Template-provided base sample logo — used when no event logo exists. Mirrors cover stage fallback chain. */
  sampleLogoOne?: string | null
  primaryColor: string
  animated?: boolean
  animationDelay?: number
  logoRowClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  animated: false,
  animationDelay: 0,
  logoRowClass: 'my-6',
})

// Three-tier fallback chain matching CoverContentRows and HostInfoBirthday:
// 1. Event's own logo (already media-resolved upstream as logoUrl)
// 2. Template-provided sample_logo_1 (raw URL — needs getMediaUrl)
// 3. null → inline recoloured SVG rendered in template
const resolvedLogoSrc = computed<string | null>(() => {
  if (props.logoUrl) return props.logoUrl
  if (props.sampleLogoOne) return getMediaUrl(props.sampleLogoOne) ?? null
  return null
})

const { fallbackLogoSvgContent, fallbackLogoStyle } = useFallbackLogo(
  toRef(props, 'primaryColor')
)
</script>

<style scoped>
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

.host-logo-showcase {
  height: auto;
  max-height: 180px;
  width: auto;
  max-width: min(330px, 95%);
  object-fit: contain;
  transition: transform 0.3s ease;
}

.host-logo-showcase:hover {
  transform: scale(1.05);
}

.fallback-logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  height: auto;
  overflow: hidden;
  padding: 0.5rem;
}

.fallback-logo {
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: auto;
  max-width: min(330px, 95%);
  max-height: 180px;
}

.fallback-logo:hover {
  transform: scale(1.05);
}

.fallback-logo :deep(svg) {
  display: block;
  width: auto !important;
  height: auto !important;
  max-width: min(330px, 95vw);
  max-height: 180px;
  object-fit: contain;
  margin: 0 auto;
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

/* Responsive breakpoints */
@media (min-width: 640px) {
  .host-logo-showcase {
    max-height: 140px;
    max-width: min(350px, 95%);
  }

  .fallback-logo {
    max-width: min(350px, 95%);
    max-height: 140px;
  }

  .fallback-logo :deep(svg) {
    max-width: min(350px, 95vw);
    max-height: 140px;
  }
}

@media (min-width: 768px) {
  .host-logo-showcase {
    max-height: 150px;
    max-width: min(375px, 95%);
  }

  .fallback-logo {
    max-width: min(375px, 95%);
    max-height: 150px;
  }

  .fallback-logo :deep(svg) {
    max-width: min(375px, 95vw);
    max-height: 150px;
  }
}

@media (min-width: 1024px) and (max-width: 1919px) {
  .logo-row {
    padding: 0.75rem 1rem;
    margin-top: -0.25rem;
    margin-bottom: 0.5rem;
  }

  .host-logo-showcase {
    max-height: 180px;
    max-width: min(330px, 95%);
  }
}

@media (min-width: 1920px) {
  .host-logo-showcase {
    max-height: 180px;
    max-width: min(450px, 95%);
  }

  .logo-row {
    padding: 1.5rem 1rem;
  }

  .fallback-logo {
    max-width: min(450px, 95%);
    max-height: 180px;
  }

  .fallback-logo :deep(svg) {
    max-width: min(450px, 95vw);
    max-height: 180px;
  }
}

@media (max-width: 374px) {
  .host-logo-showcase {
    max-height: 100px;
    max-width: min(240px, 90%);
  }

  .logo-row {
    padding: 1.5rem 0.5rem;
  }

  .fallback-logo {
    max-height: 100px;
    max-width: min(240px, 90%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .host-logo-showcase,
  .fallback-logo,
  .bounce-in-element {
    transition: none;
    animation: none;
  }

  .host-logo-showcase:hover,
  .fallback-logo:hover {
    transform: none;
  }

  .bounce-in-element {
    opacity: 1;
  }
}
</style>
