<template>
  <section
    :id="sectionId"
    ref="rootEl"
    class="v2-chapter relative z-10 px-5 sm:px-8 py-14 sm:py-20"
    :class="{ 'v2-chapter--depth': depth }"
  >
    <div
      ref="innerEl"
      class="v2-chapter-inner mx-auto w-full max-w-xl lg:max-w-2xl"
      :class="{ 'v2-chapter-inner--depth': depth }"
    >
      <!-- Chapter heading: tilts up in 3D like a turning storybook page -->
      <header class="v2-chapter-head mb-10 text-center sm:mb-12">
        <span class="v2-chapter-num">{{ chapterLabel }}</span>
        <h2 class="v2-chapter-title">{{ title }}</h2>
        <div class="v2-chapter-rule" aria-hidden="true"></div>
        <p v-if="subtitle" class="v2-chapter-subtitle">{{ subtitle }}</p>
      </header>

      <!-- Chapter body -->
      <div class="v2-chapter-body">
        <slot />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useScrollStory } from '../../../composables/showcase-v2/useScrollStory'
import { translateV2 } from '../../../composables/showcase-v2/v2Translations'
import { toKhmerNumerals } from '../../../utils/translations'

interface Props {
  /** DOM id used by the quick-jump menu and progress dots. */
  sectionId: string
  /** 1-based chapter number. */
  chapterNumber: number
  title: string
  subtitle?: string
  currentLanguage?: string
  /** Skip the shell's own body reveal (sections that choreograph their own). */
  selfRevealingBody?: boolean
  /**
   * Scrubbed 3D depth transition as the chapter crosses the viewport.
   * Must be disabled for chapters that pin content inside (a transformed
   * ancestor breaks ScrollTrigger pinning).
   */
  depth?: boolean
}

const props = withDefaults(defineProps<Props>(), { depth: true })

const rootEl = ref<HTMLElement | null>(null)
const innerEl = ref<HTMLElement | null>(null)
const { createStory } = useScrollStory(rootEl)

const chapterLabel = computed(() => {
  const n = props.chapterNumber < 10 ? `0${props.chapterNumber}` : `${props.chapterNumber}`
  const num = props.currentLanguage === 'kh' ? toKhmerNumerals(n) : n
  return `${translateV2('chapter', props.currentLanguage)} · ${num}`
})

onMounted(() => {
  createStory(
    ({ gsap, rich }) => {
      // Pervasive 3D storybook depth: the whole chapter rises out of the page
      // plane as it enters and recedes as it leaves — scrubbed to scroll,
      // transform-only so it stays on the compositor
      if (rich && props.depth && innerEl.value) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: rootEl.value,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.8,
            },
          })
          .fromTo(
            innerEl.value,
            { rotateX: 12, z: -140, yPercent: 5, transformPerspective: 1000 },
            { rotateX: 0, z: 0, yPercent: 0, ease: 'power1.out', duration: 0.4 },
          )
          .to(innerEl.value, { duration: 0.25 }) // flat through the middle
          .to(innerEl.value, {
            rotateX: -9,
            z: -110,
            yPercent: -4,
            ease: 'power1.in',
            duration: 0.35,
          })
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootEl.value,
          start: 'top 78%',
          toggleActions: 'play none none none',
        },
      })

      // 3D page-turn: the heading rotates up out of the page plane
      tl.from('.v2-chapter-head', {
        opacity: 0,
        y: 30,
        rotateX: rich ? -55 : 0,
        transformOrigin: 'center bottom',
        transformPerspective: 800,
        duration: 1,
        ease: 'power3.out',
      })
        .from(
          '.v2-chapter-rule',
          { scaleX: 0, duration: 0.6, ease: 'power2.inOut' },
          '-=0.5',
        )

      if (!props.selfRevealingBody) {
        tl.from(
          '.v2-chapter-body',
          { opacity: 0, y: rich ? 34 : 18, duration: 1, ease: 'power2.out' },
          '-=0.4',
        )
      }
    },
    ({ gsap }) => {
      // Reduced motion: single soft fade, no movement
      gsap.from(rootEl.value, {
        opacity: 0,
        duration: 0.4,
        scrollTrigger: { trigger: rootEl.value, start: 'top 85%', toggleActions: 'play none none none' },
      })
    },
  )
})
</script>

<style scoped>
.v2-chapter {
  font-family: var(--v2-body);
  color: var(--v2-charcoal);
}

/* Depth stage for the scrubbed 3D chapter transition. Like will-change below,
   perspective creates a containing block for fixed descendants, so it must
   never be applied to chapters that pin content (the story stage) */
.v2-chapter--depth {
  perspective: 1000px;
}

/* Only depth-animated chapters get a transform hint — will-change creates a
   containing block for fixed-position descendants, which would break the
   pinned story stage if applied there */
.v2-chapter-inner--depth {
  will-change: transform;
  transform-style: preserve-3d;
}

.v2-chapter-num {
  display: block;
  font-size: 11px;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--v2-sage-deep);
  margin-bottom: 10px;
}

.v2-chapter-title {
  font-family: var(--v2-display);
  font-weight: 500;
  font-size: clamp(30px, 7vw, 42px);
  line-height: 1.15;
}

.v2-chapter-rule {
  width: 52px;
  height: 1px;
  background: var(--v2-gold);
  margin: 18px auto 0;
  transform-origin: center;
}

.v2-chapter-subtitle {
  margin-top: 12px;
  font-size: 14px;
  color: var(--v2-ink-soft);
}
</style>
