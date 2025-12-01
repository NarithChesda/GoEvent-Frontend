<template>
  <div class="logo-row" :class="logoRowClass">
    <div
      class="logo-content"
      :class="{ 'bounce-in-element': animated }"
      :style="animated ? { animationDelay: `${animationDelay}s` } : undefined"
    >
      <!-- Custom logo image -->
      <img
        v-if="logoUrl"
        :src="logoUrl"
        alt="Event Logo"
        class="host-logo-showcase"
        loading="eager"
        fetchpriority="high"
      />
      <!-- Fallback SVG logo -->
      <div
        v-else-if="useSvgFallback"
        class="fallback-logo-wrapper"
        :style="fallbackLogoStyle"
      >
        <div
          class="host-logo-showcase fallback-logo-svg"
          v-html="fallbackLogoSvgContent"
        />
      </div>
      <!-- Circle fallback with initial -->
      <div
        v-else
        class="logo-fallback"
        :style="{ backgroundColor: primaryColor }"
      >
        <span class="logo-initial" :style="{ fontFamily }">
          {{ eventInitial }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFallbackLogo } from '@/composables/showcase/useHostInfoUtils'
import { toRef } from 'vue'

interface Props {
  logoUrl?: string
  eventInitial: string
  primaryColor: string
  fontFamily?: string
  useSvgFallback?: boolean
  animated?: boolean
  animationDelay?: number
  logoRowClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  useSvgFallback: true,
  animated: false,
  animationDelay: 0,
  logoRowClass: 'my-6',
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
  transition: transform 0.3s ease;
}

.logo-fallback:hover {
  transform: scale(1.05);
}

.logo-initial {
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
}

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

/* Responsive breakpoints */
@media (min-width: 640px) {
  .host-logo-showcase {
    max-height: 140px;
    max-width: min(350px, 95%);
  }

  .logo-fallback {
    width: 112px;
    height: 112px;
  }

  .logo-initial {
    font-size: 1.875rem;
  }

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
  .host-logo-showcase {
    max-height: 150px;
    max-width: min(375px, 95%);
  }

  .logo-fallback {
    width: 128px;
    height: 128px;
  }

  .logo-initial {
    font-size: 2.25rem;
  }

  .fallback-logo-svg {
    max-width: min(375px, 95%);
    max-height: 150px;
  }

  .fallback-logo-svg :deep(svg) {
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

  .logo-fallback {
    width: 96px;
    height: 96px;
  }

  .logo-initial {
    font-size: 1.5rem;
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

  .logo-fallback {
    width: 180px;
    height: 180px;
  }

  .logo-initial {
    font-size: 4rem;
  }

  .fallback-logo-svg {
    max-width: min(450px, 95%);
    max-height: 180px;
  }

  .fallback-logo-svg :deep(svg) {
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

  .logo-fallback {
    width: 80px;
    height: 80px;
  }

  .logo-initial {
    font-size: 1.25rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .host-logo-showcase,
  .logo-fallback,
  .fallback-logo-svg,
  .bounce-in-element {
    transition: none;
    animation: none;
  }

  .host-logo-showcase:hover,
  .logo-fallback:hover,
  .fallback-logo-svg:hover {
    transform: none;
  }

  .bounce-in-element {
    opacity: 1;
  }
}
</style>
