<template>
  <!-- Standalone chapter (no V2ChapterShell): the pinned stage needs the
       chapter heading inside the pin, and must not sit under a transformed
       ancestor -->
  <section
    id="story-section"
    ref="rootEl"
    class="v2-story relative z-10 px-5 sm:px-8 py-14 sm:py-20"
  >
    <!-- One-screen pinned 3D stage: chapter title top-center, groom upper-left,
         bride lower-right, a gold thread drawing between them toward the
         WebGL ring ornament (V2Tunnel), which locks to screen-center behind
         this stage for the duration of the pin — see setRingLock in
         ShowcaseV2Experience.vue for the handoff, there's no local ring
         element here anymore. -->
    <div
      v-if="couple.length"
      ref="stageEl"
      class="v2-story-stage"
      :class="{ 'v2-story-stage--solo': couple.length === 1 }"
    >
      <header class="v2-story-head">
        <span class="v2-story-eyebrow">{{ chapterLabel }}</span>
        <h2 v-if="welcomeText" class="v2-story-heading">{{ welcomeText }}</h2>
        <div class="v2-story-rule" aria-hidden="true"></div>

      </header>

      <!-- gold dotted thread connecting the couple through the rings. The
           100x100 coords are rescaled to stage pixels at mount (same curve).
           The dotted path can't draw itself via dashoffset (that would march
           the dots), so a solid mask path sweeps along it to reveal it -->
      <svg
        v-if="couple.length === 2"
        class="v2-story-thread"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <mask
            id="v2-thread-reveal"
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="100%"
            height="100%"
          >
            <path
              ref="threadMaskEl"
              class="v2-story-thread-reveal"
              d="M 24 28 C 42 40 58 60 76 72"
              pathLength="1"
            />
          </mask>
        </defs>
        <path
          ref="threadEl"
          class="v2-story-thread-path"
          d="M 24 28 C 42 40 58 60 76 72"
          mask="url(#v2-thread-reveal)"
        />
      </svg>

      <article
        v-for="(person, i) in couple"
        :key="person.key"
        class="v2-story-card"
        :class="i === 0 ? 'v2-story-card--a' : 'v2-story-card--b'"
      >
        <div class="v2-story-frame">
          <div class="v2-story-photo" :class="`v2-tone-${person.tone}`">
            <img v-if="person.photo" :src="person.photo" :alt="person.name" loading="lazy" />
            <span v-else class="v2-story-monogram">{{ person.initial }}</span>
          </div>
        </div>
        <div class="v2-story-meta">
          <span v-if="person.role" class="v2-story-role">{{ person.role }}</span>
          <h3 class="v2-story-name">{{ person.name }}</h3>
          <p v-if="person.parents.length" class="v2-story-parents">
            <span v-for="(parent, pi) in person.parents" :key="pi" class="v2-story-parent">{{
              parent
            }}</span>
          </p>
          <p v-if="person.bio" class="v2-story-bio">{{ person.bio }}</p>
        </div>
      </article>
    </div>

    <!-- No hosts: plain centered chapter heading in normal flow -->
    <header v-else class="v2-story-head v2-story-head--flow v2-story-reveal">
      <span class="v2-story-eyebrow">{{ chapterLabel }}</span>
      <h2 class="v2-story-heading">{{ title }}</h2>
      <div class="v2-story-rule" aria-hidden="true"></div>
      <p v-if="welcomeText" class="v2-story-welcome">{{ welcomeText }}</p>
    </header>

    <!-- Additional hosts beyond the couple -->
    <div v-if="extras.length" class="v2-story-extras v2-story-reveal">
      <article v-for="person in extras" :key="person.key" class="v2-story-extra">
        <div class="v2-story-frame v2-story-frame--small">
          <div class="v2-story-photo" :class="`v2-tone-${person.tone}`">
            <img v-if="person.photo" :src="person.photo" :alt="person.name" loading="lazy" />
            <span v-else class="v2-story-monogram">{{ person.initial }}</span>
          </div>
        </div>
        <span v-if="person.role" class="v2-story-role">{{ person.role }}</span>
        <h3 class="v2-story-name v2-story-name--small">{{ person.name }}</h3>
        <p v-if="person.parents.length" class="v2-story-parents">
          <span v-for="(parent, pi) in person.parents" :key="pi" class="v2-story-parent">{{
            parent
          }}</span>
        </p>
      </article>
    </div>

    <!-- Centered description passage, separate from the couple stage
         (welcome text now lives under the chapter heading above) -->
    <div v-if="descriptionTitle || descriptionText" class="v2-story-passages">
      <div class="v2-story-closing v2-story-reveal">
        <h3 v-if="descriptionTitle">{{ descriptionTitle }}</h3>
        <p v-if="descriptionText">{{ descriptionText }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useScrollStory } from '../../../composables/showcase-v2/useScrollStory'
import { translateV2 } from '../../../composables/showcase-v2/v2Translations'
import { toKhmerNumerals } from '../../../utils/translations'
import type { Host } from '../../../composables/useEventShowcase'

interface Props {
  chapterNumber: number
  title: string
  hosts: Host[]
  welcomeText?: string
  descriptionTitle?: string
  descriptionText?: string
  getMediaUrl: (url: string) => string
  currentLanguage?: string
}

const props = defineProps<Props>()

const rootEl = ref<HTMLElement | null>(null)
const stageEl = ref<HTMLElement | null>(null)
const threadEl = ref<SVGPathElement | null>(null)
const threadMaskEl = ref<SVGPathElement | null>(null)
const { createStory } = useScrollStory(rootEl)

const chapterLabel = computed(() => {
  const n = props.chapterNumber < 10 ? `0${props.chapterNumber}` : `${props.chapterNumber}`
  const num = props.currentLanguage === 'kh' ? toKhmerNumerals(n) : n
  return `${translateV2('chapter', props.currentLanguage)} · ${num}`
})

interface StoryPerson {
  key: string | number
  photo?: string
  role?: string
  name: string
  initial: string
  parents: string[]
  bio?: string
  tone: number
}

const people = computed<StoryPerson[]>(() =>
  props.hosts.slice(0, 5).map((host, i) => ({
    key: host.id,
    photo: host.profile_image ? props.getMediaUrl(host.profile_image) : undefined,
    role: host.title,
    name: host.name,
    initial: (host.name || '·').trim().charAt(0).toUpperCase(),
    parents: [host.parent_a_name, host.parent_b_name].filter((p): p is string => Boolean(p)),
    bio: host.bio || undefined,
    tone: (i % 3) + 1,
  })),
)

/** First two hosts form the diagonal couple composition. */
const couple = computed(() => people.value.slice(0, 2))
const extras = computed(() => people.value.slice(2))

/**
 * Re-express the thread's 100x100 design coords in stage pixels (identical
 * curve — scaling a Bézier's control points equals stretching the drawn
 * curve). Keeps the viewBox unstretched so the stroke stays a uniform
 * hairline without vector-effect: non-scaling-stroke, whose Chromium
 * dash-normalization bug would leave the pathLength draw effect inert.
 */
const scaleThreadToStage = () => {
  const path = threadEl.value
  const stage = stageEl.value
  const svg = path?.ownerSVGElement
  if (!path || !svg || !stage) return
  const sx = (stage.offsetWidth || 100) / 100
  const sy = (stage.offsetHeight || 100) / 100
  svg.setAttribute('viewBox', `0 0 ${sx * 100} ${sy * 100}`)
  const d = `M ${24 * sx} ${28 * sy} C ${42 * sx} ${40 * sy} ${58 * sx} ${60 * sy} ${76 * sx} ${72 * sy}`
  path.setAttribute('d', d)
  threadMaskEl.value?.setAttribute('d', d)
}

onUnmounted(() => window.removeEventListener('resize', scaleThreadToStage))

onMounted(() => {
  scaleThreadToStage()
  window.addEventListener('resize', scaleThreadToStage)
  createStory(({ gsap, rich }) => {
    const root = rootEl.value
    if (!root) return

    // Passages / extra hosts reveal softly wherever they sit (all tiers)
    gsap.utils.toArray<HTMLElement>('.v2-story-reveal', root).forEach((el) => {
      gsap.from(el, {
        autoAlpha: 0,
        y: 26,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none none' },
      })
    })

    const stage = stageEl.value
    if (!stage) return
    const head = stage.querySelector<HTMLElement>('.v2-story-head')
    const cardA = stage.querySelector<HTMLElement>('.v2-story-card--a')
    const cardB = stage.querySelector<HTMLElement>('.v2-story-card--b')
    // The draw tweens animate the solid mask path that reveals the dotted
    // thread — never the dotted path itself (dashoffset would march its dots)
    const thread = threadMaskEl.value
    const threadSvg = threadEl.value?.ownerSVGElement ?? null

    // The thread's tweens sit late in the sequence, so hide it up front —
    // otherwise it renders fully drawn until the playhead first reaches it
    // (matchMedia reverts this, so reduced-motion still sees it complete)
    if (thread) gsap.set(thread, { strokeDashoffset: 1 })

    if (rich) {
      // ---- pinned 3D choreography, scrubbed to scroll ----
      gsap.set([cardA, cardB].filter(Boolean), { transformPerspective: 1100 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: '+=175%',
          pin: true,
          scrub: 1.2,
          anticipatePin: 1,
          // One scroll nudge pulls the user through the full choreography to
          // the completed composition (and back out on the next scroll) —
          // no manual scrubbing distance to grind through
          snap: {
            snapTo: [0, 1],
            duration: { min: 1.6, max: 2.6 },
            delay: 0.05,
            ease: 'power1.inOut',
            directional: true,
          },
        },
      })

      tl.from(
        head,
        {
          autoAlpha: 0,
          y: 44,
          rotateX: -35,
          transformOrigin: 'center bottom',
          transformPerspective: 800,
          duration: 0.7,
        },
        0,
      )
      if (cardA)
        tl.from(
          cardA,
          {
            autoAlpha: 0,
            xPercent: -16,
            yPercent: -10,
            rotateY: 38,
            z: -280,
            duration: 1,
            ease: 'power1.out',
          },
          0.3,
        )
      if (cardB)
        tl.from(
          cardB,
          {
            autoAlpha: 0,
            xPercent: 16,
            yPercent: 10,
            rotateY: -38,
            z: -280,
            duration: 1,
            ease: 'power1.out',
          },
          0.75,
        )
      // Only once both cards have landed does the string spool out of the
      // groom's frame and pause at center stage — where the WebGL ring
      // (locked to screen-center behind this stage, see setRingLock in
      // ShowcaseV2Experience.vue) is waiting to catch it…
      if (thread)
        tl.fromTo(
          thread,
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0.5, duration: 0.55, ease: 'power1.in' },
          1.8,
        )
      // …then it threads on through and ties off at the bride
      if (thread) tl.to(thread, { strokeDashoffset: 0, duration: 0.5, ease: 'power1.out' }, 2.8)
      // …and once tied off, the string draws the couple a breath closer
      if (thread && cardA && cardB) {
        tl.to(cardA, { x: 7, y: 5, duration: 0.45, ease: 'back.out(1.8)' }, 3.35)
        tl.to(cardB, { x: -7, y: -5, duration: 0.45, ease: 'back.out(1.8)' }, 3.35)
      }
      // brief hold on the completed composition before the pin releases
      tl.to({}, { duration: 0.4 })

      // gentle idle sway while pinned, so the thread breathes in place
      if (threadSvg)
        gsap.to(threadSvg, {
          y: 5,
          duration: 2.8,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        })
    } else {
      // ---- lite: one-shot reveals, no pin/scrub ----
      const liteIn = (target: gsap.TweenTarget | null, vars: gsap.TweenVars) => {
        if (!target) return
        gsap.from(target, {
          ...vars,
          ease: 'power2.out',
          scrollTrigger: { trigger: stage, start: 'top 70%', toggleActions: 'play none none none' },
        })
      }
      liteIn(head, { autoAlpha: 0, y: 28, duration: 0.9 })
      liteIn(cardA, { autoAlpha: 0, x: -36, y: -20, duration: 1, delay: 0.15 })
      liteIn(cardB, { autoAlpha: 0, x: 36, y: 20, duration: 1, delay: 0.3 })
      // string draws last, once the cards have settled
      if (thread)
        gsap.fromTo(
          thread,
          { strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            duration: 1.2,
            delay: 1.15,
            ease: 'power1.inOut',
            scrollTrigger: {
              trigger: stage,
              start: 'top 70%',
              toggleActions: 'play none none none',
            },
          },
        )
    }
  })
  // Reduced motion (no second callback): everything stays static and visible
})
</script>

<style scoped>
.v2-story {
  font-family: var(--v2-body);
  color: var(--v2-charcoal);
  overflow-x: clip;
}

/* ---------- pinned stage ---------- */
.v2-story-stage {
  position: relative;
  width: 100%;
  max-width: 1080px;
  margin-inline: auto;
  height: 100svh;
  min-height: 540px;
  perspective: 1200px;
}

/* ---------- chapter heading (inside the pinned screen) ---------- */
.v2-story-head {
  position: absolute;
  top: clamp(18px, 4svh, 44px);
  left: 0;
  right: 0;
  z-index: 6;
  text-align: center;
  padding-inline: 16px;
}

.v2-story-head--flow {
  position: static;
  margin-bottom: 48px;
}

.v2-story-eyebrow {
  display: block;
  font-size: 11px;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--v2-sage-deep);
  margin-bottom: 10px;
}

.v2-story-heading {
  font-family: var(--v2-display);
  font-weight: 500;
  font-size: clamp(30px, 7vw, 42px);
  line-height: 1.15;
}

.v2-story-rule {
  width: 52px;
  height: 1px;
  background: var(--v2-gold);
  margin: 14px auto 0;
}

.v2-story-welcome {
  font-family: var(--v2-display);
  font-style: italic;
  font-size: clamp(16px, 2.4vw, 19px);
  line-height: 1.7;
  color: var(--v2-charcoal);
  max-width: 30rem;
  margin: 16px auto 0;
}

/* ---------- connecting thread ---------- */
.v2-story-thread {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

/* dotted string-of-pearls look (px units — the path is in pixel space) */
.v2-story-thread-path {
  fill: none;
  stroke: var(--v2-gold);
  stroke-width: 2px;
  stroke-linecap: round;
  stroke-dasharray: 0.1 6;
  opacity: 0.65;
}

/* solid white sweep inside the mask that reveals the dots as it draws;
   wide enough to cover the dot diameter with room to spare */
.v2-story-thread-reveal {
  fill: none;
  stroke: #fff;
  stroke-width: 8px;
  stroke-linecap: round;
  stroke-dasharray: 1;
}

/* ---------- couple cards ----------
   Mobile: staggered two-column collage — narrow columns that never overlap
   each other's text, groom high-left, bride low-right, rings in the gap.
   Desktop (≥640px) keeps the wide diagonal composition. */
.v2-story-card {
  position: absolute;
  will-change: transform, opacity;
  backface-visibility: hidden;
  width: 47%;
}

.v2-story-card--a {
  z-index: 3;
  top: clamp(128px, 19svh, 185px);
  left: 1%;
}

.v2-story-card--b {
  z-index: 4;
  /* clears the showcase bottom controls on phones */
  bottom: max(64px, 9svh);
  right: 1%;
  text-align: right;
}

.v2-story-stage--solo .v2-story-card--a {
  left: 0;
  right: 0;
  margin-inline: auto;
  top: clamp(130px, 22svh, 210px);
  width: min(72%, 320px);
  text-align: center;
}

@media (min-width: 640px) {
  .v2-story-card {
    width: min(38%, 330px);
  }

  .v2-story-card--a {
    top: clamp(110px, 18svh, 190px);
    left: 3%;
  }

  .v2-story-card--b {
    bottom: 5svh;
    right: 3%;
  }
}

@media (max-width: 639px) {
  .v2-story-frame::after {
    inset: -6px;
    border-radius: 999px 999px 20px 20px;
  }
}

/* ---------- arch photo frame ---------- */
.v2-story-frame {
  position: relative;
}

.v2-story-frame::after {
  content: '';
  position: absolute;
  inset: -8px;
  border: 1px solid rgba(201, 166, 107, 0.5);
  border-radius: 999px 999px 24px 24px;
  pointer-events: none;
}

.v2-story-photo {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 999px 999px 18px 18px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 24px 48px rgba(62, 58, 54, 0.18);
}

/* landscape phones / short screens: keep the whole composition on one screen */
@media (max-height: 620px) {
  .v2-story-photo {
    aspect-ratio: 1 / 1;
  }
}

.v2-story-photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.v2-story-photo::after {
  content: '';
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: inherit;
  pointer-events: none;
}

.v2-story-monogram {
  font-family: var(--v2-display);
  font-style: italic;
  font-size: clamp(48px, 8vw, 72px);
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
}

.v2-tone-1 {
  background: linear-gradient(135deg, #e8b4b8, #c98a90 60%, #8e5b60);
}

.v2-tone-2 {
  background: linear-gradient(135deg, #a8b5a0, #7c8b74 60%, #55614f);
}

.v2-tone-3 {
  background: linear-gradient(135deg, #c9a66b, #a9854c 60%, #77602f);
}

/* ---------- card text ---------- */
.v2-story-meta {
  margin-top: 12px;
}

@media (min-width: 640px) {
  .v2-story-meta {
    margin-top: 18px;
  }
}

.v2-story-role {
  display: block;
  font-size: 11px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--v2-gold);
  margin-bottom: 6px;
}

.v2-story-name {
  font-family: var(--v2-display);
  font-weight: 600;
  font-size: clamp(19px, 5.2vw, 32px);
  line-height: 1.2;
  color: var(--v2-charcoal);
}

.v2-story-name--small {
  font-size: 22px;
}

.v2-story-parents {
  margin-top: 6px;
  font-size: 12px;
  letter-spacing: 0.02em;
  line-height: 1.55;
  color: var(--v2-ink-soft);
}

/* mobile: each parent name gets its own row so nothing looks cut off */
.v2-story-parent {
  display: block;
}

/* the bio only fits comfortably on the wide desktop composition */
.v2-story-bio {
  display: none;
}

@media (min-width: 640px) {
  .v2-story-parents {
    font-size: 13px;
  }

  /* desktop: parents back on one line, separated by a middot */
  .v2-story-parent {
    display: inline;
  }

  .v2-story-parent + .v2-story-parent::before {
    content: ' · ';
    color: var(--v2-gold);
  }

  .v2-story-bio {
    margin-top: 8px;
    font-size: 13px;
    font-style: italic;
    line-height: 1.6;
    color: var(--v2-ink-soft);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
  }
}

/* ---------- extra hosts ---------- */
.v2-story-extras {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 36px 32px;
  max-width: 720px;
  margin: 64px auto 0;
  text-align: center;
}

.v2-story-extra {
  width: 168px;
}

.v2-story-extra .v2-story-role {
  margin-top: 16px;
}

.v2-story-extra .v2-story-parents {
  font-size: 12px;
}

/* ---------- centered invitation passages ---------- */
.v2-story-passages {
  max-width: 40rem;
  margin: clamp(20px, 4vh, 40px) auto 0;
  text-align: center;
}

.v2-story-closing h3 {
  font-family: var(--v2-display);
  font-weight: 600;
  font-size: 24px;
  margin-bottom: 10px;
  color: var(--v2-charcoal);
}

.v2-story-closing p {
  font-size: 15px;
  line-height: 1.9;
  color: var(--v2-ink-soft);
  max-width: 36rem;
  margin-inline: auto;
}
</style>
