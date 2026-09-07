<template>
  <div class="logo-row" :class="logoRowClass" :style="scaleStyle">
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
  /**
   * Size of the logo, as a percent of the breakpoint's own cap. 100 is the
   * size every layout rendered before this existed.
   *
   * Expressed as a multiplier on the existing caps rather than as a size of its
   * own, because those caps are a responsive ladder (100px on a small phone up
   * to 180px on a desktop) that a single number would have to replace whole —
   * and a partner setting one absolute value would be choosing it on whichever
   * screen they happened to be previewing on.
   */
  scale?: number
}

const props = withDefaults(defineProps<Props>(), {
  animated: false,
  animationDelay: 0,
  logoRowClass: 'my-6',
  scale: 100,
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

// Percent on the wire, a multiplier in CSS. Left off entirely at 100 so the
// caps resolve through their own `var(..., 1)` fallback — the declarations then
// read exactly as they did before this prop existed.
const scaleStyle = computed(() =>
  props.scale === 100 ? undefined : { '--host-logo-scale': String(props.scale / 100) },
)

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
  max-height: calc(180px * var(--host-logo-scale, 1));
  width: auto;
  max-width: min(calc(330px * var(--host-logo-scale, 1)), 95%);
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
  max-width: min(calc(330px * var(--host-logo-scale, 1)), 95%);
  max-height: calc(180px * var(--host-logo-scale, 1));
}

.fallback-logo:hover {
  transform: scale(1.05);
}

.fallback-logo :deep(svg) {
  display: block;
  width: auto !important;
  height: auto !important;
  max-width: min(calc(330px * var(--host-logo-scale, 1)), 95vw);
  max-height: calc(180px * var(--host-logo-scale, 1));
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
    max-height: calc(140px * var(--host-logo-scale, 1));
    max-width: min(calc(350px * var(--host-logo-scale, 1)), 95%);
  }

  .fallback-logo {
    max-width: min(calc(350px * var(--host-logo-scale, 1)), 95%);
    max-height: calc(140px * var(--host-logo-scale, 1));
  }

  .fallback-logo :deep(svg) {
    max-width: min(calc(350px * var(--host-logo-scale, 1)), 95vw);
    max-height: calc(140px * var(--host-logo-scale, 1));
  }
}

@media (min-width: 768px) {
  .host-logo-showcase {
    max-height: calc(150px * var(--host-logo-scale, 1));
    max-width: min(calc(375px * var(--host-logo-scale, 1)), 95%);
  }

  .fallback-logo {
    max-width: min(calc(375px * var(--host-logo-scale, 1)), 95%);
    max-height: calc(150px * var(--host-logo-scale, 1));
  }

  .fallback-logo :deep(svg) {
    max-width: min(calc(375px * var(--host-logo-scale, 1)), 95vw);
    max-height: calc(150px * var(--host-logo-scale, 1));
  }
}

@media (min-width: 1024px) and (max-width: 1919px) {
  .logo-row {
    padding: 0.75rem 1rem;
    margin-top: -0.25rem;
    margin-bottom: 0.5rem;
  }

  .host-logo-showcase {
    max-height: calc(180px * var(--host-logo-scale, 1));
    max-width: min(calc(330px * var(--host-logo-scale, 1)), 95%);
  }
}

@media (min-width: 1920px) {
  .host-logo-showcase {
    max-height: calc(180px * var(--host-logo-scale, 1));
    max-width: min(calc(450px * var(--host-logo-scale, 1)), 95%);
  }

  .logo-row {
    padding: 1.5rem 1rem;
  }

  .fallback-logo {
    max-width: min(calc(450px * var(--host-logo-scale, 1)), 95%);
    max-height: calc(180px * var(--host-logo-scale, 1));
  }

  .fallback-logo :deep(svg) {
    max-width: min(calc(450px * var(--host-logo-scale, 1)), 95vw);
    max-height: calc(180px * var(--host-logo-scale, 1));
  }
}

@media (max-width: 374px) {
  .host-logo-showcase {
    max-height: calc(100px * var(--host-logo-scale, 1));
    max-width: min(calc(240px * var(--host-logo-scale, 1)), 90%);
  }

  .logo-row {
    padding: 1.5rem 0.5rem;
  }

  .fallback-logo {
    max-height: calc(100px * var(--host-logo-scale, 1));
    max-width: min(calc(240px * var(--host-logo-scale, 1)), 90%);
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
