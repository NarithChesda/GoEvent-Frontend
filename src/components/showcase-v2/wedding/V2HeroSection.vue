<template>
  <section
    id="hero"
    ref="rootEl"
    class="v2-hero relative z-10 flex min-h-[92svh] flex-col items-center justify-center px-6 pt-16 pb-10 text-center"
  >
    <!-- Cursor-parallax decorative layer (desktop only) -->
    <div ref="parallaxLayer" class="pointer-events-none absolute inset-0" aria-hidden="true">
      <span class="v2-hero-orb v2-hero-orb--blush"></span>
      <span class="v2-hero-orb v2-hero-orb--sage"></span>
    </div>

    <!-- Soft halo behind the title/date block: guarantees the couple's
         names stay legible over the WebGL tunnel's ring ornament and
         falling particles no matter how the background theme resolves. -->
    <div class="v2-hero-scrim" aria-hidden="true"></div>

    <div ref="innerEl" class="relative mx-auto w-full max-w-xl">
      <p class="v2-hero-item v2-hero-eyebrow mb-4">{{ t('tying_knot') }}</p>

      <h1 class="v2-hero-item v2-hero-names">
        <template v-if="nameParts.length === 2">
          {{ nameParts[0] }} <span class="v2-hero-amp">&amp;</span> {{ nameParts[1] }}
        </template>
        <template v-else>{{ coupleNames || eventTitle }}</template>
      </h1>

      <p v-if="dateLine" class="v2-hero-item v2-hero-date">
        {{ dateLine }}<template v-if="locationLine"> · {{ locationLine }}</template>
      </p>

      <!-- Countdown (shows zeros once the day has passed) -->
      <div
        v-if="showCountdown"
        class="v2-hero-item mb-12 flex items-stretch justify-center gap-3 sm:gap-4"
        :aria-label="t('countdown_title')"
      >
        <div v-for="unit in countdownUnits" :key="unit.label" class="v2-cd-cell">
          <span class="v2-cd-num tabular-nums">{{ unit.value }}</span>
          <span class="v2-cd-label">{{ unit.label }}</span>
        </div>
      </div>

      <!-- Scroll cue -->
      <p class="v2-hero-item v2-scroll-cue" aria-hidden="true">{{ t('scroll_to_begin') }} ↓</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useScrollStory } from '../../../composables/showcase-v2/useScrollStory'
import { useCountdown } from '../../../composables/showcase-v2/useCountdown'
import { translateV2, type V2TranslationKey } from '../../../composables/showcase-v2/v2Translations'
import {
  WEDDING_TRANSLATIONS,
  type WeddingTranslationKey,
} from '../../../composables/showcase-v2/categories/wedding.data'
import { translateRSVP, toKhmerNumerals, type SupportedLanguage } from '../../../utils/translations'

interface Props {
  eventTitle: string
  coupleNames?: string
  startDate?: string
  dateLine?: string
  locationLine?: string
  showCountdown?: boolean
  /** Play the entrance timeline (true once the cover gate has opened / is skipped). */
  active?: boolean
  currentLanguage?: string
}

const props = withDefaults(defineProps<Props>(), { showCountdown: true, active: false })

const rootEl = ref<HTMLElement | null>(null)
const innerEl = ref<HTMLElement | null>(null)
const parallaxLayer = ref<HTMLElement | null>(null)
const { createStory } = useScrollStory(rootEl)

const t = (key: V2TranslationKey | WeddingTranslationKey) =>
  translateV2(key, props.currentLanguage, WEDDING_TRANSLATIONS)

// Split "A & B" so the ampersand can get its italic gold treatment
const nameParts = computed(() => {
  if (!props.coupleNames) return []
  const parts = props.coupleNames.split('&').map((p) => p.trim())
  return parts.length === 2 ? parts : []
})

const { days, hours, minutes, seconds } = useCountdown(() => props.startDate)

const lang = computed(() => (props.currentLanguage as SupportedLanguage) || 'en')

const formatNumber = (n: number) => {
  const padded = n < 10 ? `0${n}` : `${n}`
  return lang.value === 'kh' ? toKhmerNumerals(padded) : padded
}

const countdownUnits = computed(() => [
  { label: translateRSVP('rsvp_days', lang.value), value: formatNumber(days.value) },
  { label: translateRSVP('rsvp_hours', lang.value), value: formatNumber(hours.value) },
  { label: translateRSVP('rsvp_minutes', lang.value), value: formatNumber(minutes.value) },
  { label: translateRSVP('rsvp_seconds', lang.value), value: formatNumber(seconds.value) },
])

// Entrance timeline synced with the cover hand-off: items start hidden and
// animate in when `active` flips true.
const played = ref(false)

onMounted(() => {
  createStory(
    ({ gsap, rich }) => {
      gsap.set('.v2-hero-item', { opacity: 0, y: 24 })

      const playEntrance = () => {
        if (played.value) return
        played.value = true
        gsap.to('.v2-hero-item', {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.12,
          ease: 'power3.out',
          delay: 0.15,
        })
      }

      const stopWatch = watch(
        () => props.active,
        (active) => {
          if (active) playEntrance()
        },
        { immediate: true },
      )

      // 3D depth exit: as the hero scrolls away it recedes into the page
      // (scrubbed, transform-only — separate element from the entrance items)
      if (rich && innerEl.value) {
        gsap.to(innerEl.value, {
          yPercent: -14,
          z: -160,
          rotateX: 9,
          opacity: 0.15,
          transformPerspective: 900,
          ease: 'none',
          scrollTrigger: {
            trigger: rootEl.value,
            start: 'top top',
            end: 'bottom 25%',
            scrub: 0.8,
          },
        })
      }

      // Desktop cursor parallax via gsap.quickTo (built for per-event updates)
      let removeMouse: (() => void) | null = null
      if (rich && window.matchMedia('(pointer: fine)').matches && parallaxLayer.value) {
        const xTo = gsap.quickTo(parallaxLayer.value, 'x', { duration: 0.6, ease: 'power3.out' })
        const yTo = gsap.quickTo(parallaxLayer.value, 'y', { duration: 0.6, ease: 'power3.out' })
        const onMove = (e: MouseEvent) => {
          xTo((e.clientX / window.innerWidth - 0.5) * 30)
          yTo((e.clientY / window.innerHeight - 0.5) * 20)
        }
        window.addEventListener('mousemove', onMove, { passive: true })
        removeMouse = () => window.removeEventListener('mousemove', onMove)
      }

      return () => {
        stopWatch()
        removeMouse?.()
      }
    },
    ({ gsap }) => {
      // Reduced motion: content simply appears (short fade when activated)
      gsap.set('.v2-hero-item', { opacity: 0 })
      const stopWatch = watch(
        () => props.active,
        (active) => {
          if (active && !played.value) {
            played.value = true
            gsap.to('.v2-hero-item', { opacity: 1, duration: 0.4 })
          }
        },
        { immediate: true },
      )
      return () => stopWatch()
    },
  )
})
</script>

<style scoped>
.v2-hero {
  font-family: var(--v2-body);
  color: var(--v2-charcoal);
}

.v2-hero-eyebrow {
  font-size: 12px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--v2-blush-deep);
}

.v2-hero-names {
  font-family: var(--v2-display);
  font-weight: 500;
  font-size: clamp(44px, 11vw, 76px);
  line-height: 1.08;
}

.v2-hero-amp {
  font-style: italic;
  color: var(--v2-gold);
  font-size: 0.75em;
}

.v2-hero-date {
  font-family: var(--v2-display);
  font-style: italic;
  font-size: clamp(18px, 5vw, 24px);
  margin: 16px 0 34px;
  color: var(--v2-sage-deep);
}

.v2-cd-cell {
  min-width: 64px;
  padding: 12px 8px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(201, 166, 107, 0.35);
  border-radius: 10px;
}

.v2-cd-num {
  display: block;
  font-family: var(--v2-display);
  font-size: 30px;
  font-weight: 600;
  line-height: 1;
}

.v2-cd-label {
  display: block;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--v2-sage-deep);
  margin-top: 6px;
}

.v2-scroll-cue {
  font-size: 11px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  opacity: 0.55;
  animation: v2-cue 2s ease-in-out infinite;
}

@keyframes v2-cue {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(7px);
  }
}

.v2-hero-orb {
  position: absolute;
  border-radius: 9999px;
}

.v2-hero-orb--blush {
  left: -10%;
  top: 8%;
  width: 42vw;
  max-width: 420px;
  aspect-ratio: 1;
  background: radial-gradient(circle, rgba(232, 180, 184, 0.25) 0%, transparent 70%);
}

.v2-hero-orb--sage {
  right: -12%;
  bottom: 6%;
  width: 48vw;
  max-width: 480px;
  aspect-ratio: 1;
  background: radial-gradient(circle, rgba(168, 181, 160, 0.22) 0%, transparent 70%);
}

.v2-hero-scrim {
  position: absolute;
  inset: 4% 6%;
  border-radius: 50%;
  background: radial-gradient(
    ellipse at center,
    color-mix(in srgb, var(--v2-ivory) 88%, transparent) 0%,
    color-mix(in srgb, var(--v2-ivory) 60%, transparent) 42%,
    transparent 72%
  );
  filter: blur(12px);
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .v2-scroll-cue {
    animation: none;
  }
}
</style>
