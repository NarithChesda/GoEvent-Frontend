<template>
  <div
    ref="rootEl"
    class="v2-cover fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden px-6 text-center"
    role="dialog"
    aria-label="Wedding invitation cover"
  >
    <p class="v2-cover-item v2-eyebrow mb-4">{{ t('eyebrow_families') }}</p>

    <h1 class="v2-cover-item v2-cover-names">{{ coupleNames || eventTitle }}</h1>
    <p class="v2-cover-item v2-cover-sub mb-2">{{ t('getting_married') }}</p>

    <p v-if="guestName" class="v2-cover-item mb-9 text-sm tracking-wide">
      {{ t('you_are_invited') }},
      <strong class="v2-cover-guest-name">{{ guestName }}</strong>
    </p>
    <div v-else class="mb-9"></div>

    <!-- Envelope -->
    <button
      ref="envelopeEl"
      type="button"
      class="v2-envelope"
      :class="{ 'v2-envelope--opening': opening }"
      :aria-label="t('open_invitation')"
      :disabled="opening"
      @click="open"
    >
      <span class="v2-env-flap" aria-hidden="true"></span>
      <span class="v2-env-seal" aria-hidden="true">{{ monogram }}</span>
      <span class="v2-env-card" aria-hidden="true">{{ t('with_love') }}</span>
      <span class="v2-env-body" aria-hidden="true"></span>
    </button>

    <button type="button" class="v2-cover-item v2-cover-cta" :disabled="opening" @click="open">
      {{ t('open_invitation') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { gsap } from '../../../plugins/gsap'
import { translateV2, type V2TranslationKey } from '../../../composables/showcase-v2/v2Translations'
import {
  WEDDING_TRANSLATIONS,
  type WeddingTranslationKey,
} from '../../../composables/showcase-v2/categories/wedding.data'

interface Props {
  eventTitle: string
  coupleNames?: string
  monogram?: string
  guestName?: string
  currentLanguage?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Fired once the open animation has fully played — parent unmounts the gate. */
  opened: []
}>()

const rootEl = ref<HTMLElement | null>(null)
const envelopeEl = ref<HTMLElement | null>(null)
const opening = ref(false)

const t = (key: V2TranslationKey | WeddingTranslationKey) =>
  translateV2(key, props.currentLanguage, WEDDING_TRANSLATIONS)

const monogram = computed(() => props.monogram || '♥')
const coupleNames = computed(() => props.coupleNames)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let entranceTl: gsap.core.Timeline | null = null
let exitTl: gsap.core.Timeline | null = null
let previousOverflow = ''

onMounted(() => {
  // The gate owns the viewport: block scroll until the invitation opens
  previousOverflow = document.documentElement.style.overflow
  document.documentElement.style.overflow = 'hidden'

  if (prefersReducedMotion()) return

  entranceTl = gsap.timeline()
  entranceTl
    .from('.v2-cover-item', { opacity: 0, y: 20, duration: 0.8, stagger: 0.1, ease: 'power2.out' })
    .from(
      envelopeEl.value,
      { opacity: 0, y: 30, scale: 0.9, duration: 0.9, ease: 'back.out(1.4)' },
      '-=0.6',
    )
})

const open = () => {
  if (opening.value) return
  opening.value = true

  if (prefersReducedMotion() || !rootEl.value) {
    emit('opened')
    return
  }

  // Envelope opening choreography: flap swings up in 3D, wax seal pops off,
  // the letter slides out — then the whole cover dissolves into the hero
  exitTl = gsap.timeline({ onComplete: () => emit('opened') })
  exitTl
    .to('.v2-env-flap', {
      rotateX: 178,
      duration: 0.9,
      ease: 'power3.inOut',
      transformOrigin: 'top center',
      transformPerspective: 600,
    })
    .to(
      '.v2-env-seal',
      { scale: 0.2, rotate: 40, opacity: 0, duration: 0.7, ease: 'power2.in' },
      '<0.1',
    )
    .to('.v2-env-card', { y: -48, duration: 0.8, ease: 'power2.out' }, '-=0.45')
    .to(
      rootEl.value,
      { opacity: 0, y: -40, duration: 0.9, ease: 'power2.inOut' },
      '-=0.2',
    )
}

onUnmounted(() => {
  document.documentElement.style.overflow = previousOverflow
  entranceTl?.kill()
  exitTl?.kill()
})
</script>

<style scoped>
.v2-cover {
  background: linear-gradient(160deg, #f6ede8 0%, var(--v2-ivory, #faf6f0) 45%, #eef0ea 100%);
  color: var(--v2-charcoal, #3e3a36);
  font-family: var(--v2-body);
}

.v2-eyebrow {
  font-size: 12px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--v2-sage-deep);
}

.v2-cover-names {
  font-family: var(--v2-display);
  font-weight: 500;
  font-size: clamp(38px, 9vw, 64px);
  line-height: 1.1;
  margin-bottom: 6px;
}

.v2-cover-sub {
  font-family: var(--v2-display);
  font-style: italic;
  font-size: clamp(17px, 4.5vw, 22px);
  color: var(--v2-blush-deep);
}

.v2-cover-guest-name {
  font-weight: 600;
  border-bottom: 1px solid var(--v2-gold);
  padding-bottom: 2px;
}

/* ---------- envelope ---------- */
.v2-envelope {
  position: relative;
  width: 190px;
  height: 132px;
  cursor: pointer;
  margin-bottom: 34px;
  border: none;
  background: none;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
  animation: v2-sway 4.5s ease-in-out infinite;
  filter: drop-shadow(0 14px 22px rgba(62, 58, 54, 0.14));
}

.v2-envelope--opening {
  animation: none;
}

@keyframes v2-sway {
  0%,
  100% {
    transform: translateY(0) rotate(-0.6deg);
  }
  50% {
    transform: translateY(-7px) rotate(0.6deg);
  }
}

.v2-env-body {
  position: absolute;
  inset: 0;
  background: #f3e7dc;
  border-radius: 6px;
  overflow: hidden;
  z-index: 2;
}

.v2-env-body::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 48%, rgba(201, 166, 107, 0.16) 50%, transparent 52%);
}

.v2-env-flap {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 66px;
  background: linear-gradient(180deg, #ead9c9, #e2cdb9);
  clip-path: polygon(0 0, 100% 0, 50% 100%);
  z-index: 3;
  backface-visibility: hidden;
}

.v2-env-card {
  position: absolute;
  left: 12px;
  right: 12px;
  top: 14px;
  bottom: 10px;
  background: #fff;
  border-radius: 4px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--v2-display);
  font-style: italic;
  color: var(--v2-blush-deep);
  font-size: 15px;
}

.v2-env-seal {
  position: absolute;
  /* centered via left offset (not transform) so GSAP's scale/rotate tween
     doesn't clobber the centering transform */
  left: calc(50% - 26px);
  top: 52px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  z-index: 4;
  background: radial-gradient(circle at 34% 30%, #d89aa0, var(--v2-blush-deep) 68%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--v2-display);
  font-size: 17px;
  color: #fff;
  font-weight: 600;
  box-shadow:
    0 3px 8px rgba(201, 138, 144, 0.5),
    inset 0 0 0 3px rgba(255, 255, 255, 0.25);
  animation: v2-seal-glow 2.6s ease-in-out infinite;
}

@keyframes v2-seal-glow {
  0%,
  100% {
    box-shadow:
      0 3px 8px rgba(201, 138, 144, 0.5),
      inset 0 0 0 3px rgba(255, 255, 255, 0.25);
  }
  50% {
    box-shadow:
      0 3px 16px rgba(201, 138, 144, 0.85),
      inset 0 0 0 3px rgba(255, 255, 255, 0.4);
  }
}

.v2-cover-cta {
  font-size: 13px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--v2-charcoal);
  border: 1px solid var(--v2-gold);
  background: transparent;
  padding: 14px 34px;
  border-radius: 999px;
  font-family: var(--v2-body);
  cursor: pointer;
  min-height: 44px;
  transition:
    background 0.3s,
    color 0.3s;
}

.v2-cover-cta:hover,
.v2-cover-cta:focus-visible {
  background: var(--v2-gold);
  color: #fff;
}

@media (prefers-reduced-motion: reduce) {
  .v2-envelope,
  .v2-env-seal {
    animation: none;
  }
}
</style>
