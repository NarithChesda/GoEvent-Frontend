<template>
  <!-- How it works, told as the three stages it actually is, joined by one
       thread. The middle stage is choosing a design, so that is where the
       designs are: a reel of real covers from the catalogue, bled to the
       screen's edges, with the way into the full catalogue under it. They used
       to be a separate "Invitation designs" band of text and a button, two
       sections below a step that already said "Choose a design". -->
  <section aria-labelledby="landing-steps-title" class="steps">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2
        id="landing-steps-title"
        class="type-display-sm text-[clamp(1.75rem,1.3rem+1.6vw,2.5rem)] font-bold tracking-tight text-slate-900"
      >
        {{ t('events.landing.steps.title') }}
      </h2>

      <!-- The list carries the order; the numerals are the picture of it. -->
      <ol class="steps__list">
        <li v-for="(step, index) in STEPS" :key="step" class="step">
          <span class="step__num" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>

          <div class="step__body">
            <h3 class="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {{ t(`events.landing.steps.${step}.title`) }}
            </h3>
            <p class="mt-2 max-w-[32rem] text-base text-slate-600 leading-relaxed">
              {{ t(`events.landing.steps.${step}.body`) }}
            </p>

            <template v-if="step === DESIGN_STEP">
              <!-- A glimpse of the range, every cover a shortcut to the
                   catalogue. Hidden from assistive tech and out of the tab
                   order: they are a dozen links to one place, and the button
                   below is that place, labelled. -->
              <ul v-if="status !== 'empty'" class="reel" aria-hidden="true">
                <li v-for="(design, i) in reelDesigns" :key="design?.id ?? `wait-${i}`">
                  <RouterLink
                    v-if="design"
                    to="/partners/templates"
                    tabindex="-1"
                    class="reel__link"
                    draggable="false"
                  >
                    <DesignCover :src="design.src" />
                  </RouterLink>
                  <DesignCover v-else />
                </li>
              </ul>

              <p class="mt-2 max-w-[34rem] text-sm text-slate-500 leading-relaxed">
                {{ t('events.landing.designs.body') }}
              </p>

              <div class="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                <RouterLink
                  to="/partners/templates"
                  class="group inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 whitespace-nowrap"
                >
                  {{ t('events.landing.designs.cta') }}
                  <ArrowRight
                    class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </RouterLink>
                <p class="text-sm text-slate-600 leading-relaxed">
                  {{ t('events.landing.designs.partner') }}
                  <RouterLink
                    to="/partners"
                    class="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 transition-colors duration-200 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  >
                    {{ t('events.landing.designs.partnerCta') }}
                  </RouterLink>
                </p>
              </div>
            </template>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import DesignCover from './DesignCover.vue'
import { DESIGN_STEP, STEPS } from './landingContent'
import type { LandingDesign, LandingDesignStatus } from './landingDesigns'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = defineProps<{
  designs: LandingDesign[]
  status: LandingDesignStatus
}>()

const { t } = useAppLanguage()

/** Skeleton seats while the catalogue answers. */
const WAITING_SEATS = 7

/**
 * The features' card stack shows the first two covers, so the reel starts
 * after them — unless that would leave it too short to read as a range.
 */
const reelDesigns = computed<(LandingDesign | null)[]>(() => {
  if (props.status === 'loading') return Array.from({ length: WAITING_SEATS }, () => null)
  return props.designs.length > 6 ? props.designs.slice(2) : props.designs
})
</script>

<style scoped>
/* Hallmark · macrostructure: Narrative Workflow (below a Marquee Hero) · part: stages + design reel
 * design-system: DESIGN.md (slate · brand gradient as a /50 tint only · Figtree / Noto Serif Khmer) */

/*
 * Geometry, in one place, because the reel has to know it: it bleeds from the
 * screen's left edge to its right while its first cover lines up under the
 * step's text. The section is the size container, so `100cqw` is the page's
 * width without the scrollbar — which `100vw` is not, and would scroll the
 * page sideways on Windows.
 */
.steps {
  --col-max: 64rem;
  --col-pad: 1rem;
  --step-gutter: 2.75rem;
  --step-gap: 0.875rem;
  --num-size: 1.875rem;
  --step-space: clamp(3rem, 8vh, 4.5rem);
  /* Narrow enough on a phone that a third cover shows at the screen's edge —
     the only sign a reel with no scrollbar has more in it. */
  --cover-w: clamp(7.5rem, 32vw, 11rem);
  --reel-gap: 0.875rem;
  /* From the column's content edge out to the section's edge. */
  --edge: calc((100cqw - min(var(--col-max), 100cqw)) / 2 + var(--col-pad));
  /* From the section's left edge in to the step's text. */
  --reel-start: calc(var(--edge) + var(--step-gutter) + var(--step-gap));

  container-type: inline-size;
  padding-block: clamp(4rem, 10vh, 6.5rem);
  background: rgba(255, 255, 255, 0.7);
  border-block: 1px solid rgba(226, 232, 240, 0.7);
  overflow-x: clip;
}

@media (min-width: 640px) {
  .steps {
    --col-pad: 1.5rem;
    --step-gutter: 4rem;
    --step-gap: 1.25rem;
    --num-size: 2.5rem;
  }
}

@media (min-width: 1024px) {
  .steps {
    --col-pad: 2rem;
    --step-gutter: 5.5rem;
    --step-gap: 1.75rem;
    --num-size: 3rem;
    --cover-w: clamp(9.5rem, 12.5vw, 13rem);
    --reel-gap: 1.25rem;
  }
}

.steps__list {
  margin-top: clamp(2.25rem, 6vh, 3.5rem);
}

.step {
  position: relative;
  display: grid;
  grid-template-columns: var(--step-gutter) minmax(0, 1fr);
  column-gap: var(--step-gap);
}

.step + .step {
  margin-top: var(--step-space);
}

/* Thin on purpose: a light numeral at display size reads as a numeral, a bold
   one as a second headline beside the step's own. Slate-500 rather than
   paler, so the figure still clears 3:1 at that hairline weight. */
.step__num {
  justify-self: center;
  font-size: var(--num-size);
  font-weight: 300;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: rgb(100 116 139); /* slate-500 */
}

/* The thread from one numeral down to the next — the brand as a tint, which
   does not count against the page's one gradient object. Centred on the
   gutter, as the numerals are, so it meets them whatever their glyph width.
   Two layers: a pale track (::before) and the tinted fill over it (::after),
   which is drawn by scroll below. Without scroll timelines, or under reduced
   motion, the fill is simply whole — the finished drawing. */
.step:not(:last-child)::before,
.step:not(:last-child)::after {
  content: '';
  position: absolute;
  z-index: 0;
  left: calc(var(--step-gutter) / 2);
  top: calc(var(--num-size) + 0.875rem);
  bottom: calc(0.875rem - var(--step-space));
  width: 1px;
  translate: -0.5px 0;
}

.step:not(:last-child)::before {
  background: rgb(226 232 240); /* slate-200 */
}

.step:not(:last-child)::after {
  background: linear-gradient(to bottom, rgba(46, 204, 113, 0.6), rgba(30, 144, 255, 0.6));
}

/*
 * Scroll-linked motion. Scroll is the clock for all of it, so nothing here
 * moves unless the reader does, and it runs backwards when they scroll up.
 * Gated twice: on support (Firefox shows the finished state) and on motion
 * preference (reduced motion gets the same finished state, no movement).
 */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    /* The thread fills as each step crosses the reading line, a third of the
       way up the screen: from the step's top reaching it to its bottom
       reaching it. The long middle step, with its reel, fills slowly, which is
       its share of the journey. `clip-path`, not a scale, so the green-to-blue
       tint stays put while it is revealed instead of being squeezed. Linear:
       it is progress, and the scroll is already the easing. */
    .step {
      view-timeline: --step block;
    }

    .step:not(:last-child)::after {
      animation: thread-draw linear both;
      animation-timeline: --step;
      animation-range: entry-crossing 35% exit-crossing 35%;
    }
  }

  /* The reel slides along as it passes, revealing the covers past the screen's
     edge to a reader with a mouse, who has no easy way to scroll it sideways.
     At rest when it is mid-screen, where it is read: one and a quarter covers
     ahead of that on the way in, one and a quarter behind on the way out.
     Pointer-only, because on a touch screen the reel is the reader's own to
     swipe, and a row that also moves under vertical scroll fights the thumb.
     The timeline is named on the reel and read by its items, because the
     items' own nearest scroller is the reel, which only scrolls sideways. */
  @media (prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine) {
    .reel {
      view-timeline: --reel-pass block;
    }

    .reel > li {
      animation: reel-drift linear both;
      animation-timeline: --reel-pass;
      animation-range: cover 0% cover 100%;
    }
  }
}

@keyframes thread-draw {
  from {
    clip-path: inset(0 0 100% 0);
  }
  to {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes reel-drift {
  from {
    translate: calc(1.25 * (var(--cover-w) + var(--reel-gap))) 0;
  }
  to {
    translate: calc(-1.25 * (var(--cover-w) + var(--reel-gap))) 0;
  }
}

.step__body {
  min-width: 0;
}

/*
 * The reel. Bled to both edges of the section, padded back so the first cover
 * sits under the text and the last can scroll in to the column's edge. Above
 * the thread, which runs down the gutter behind it, so covers scrolled into
 * the gutter pass over the line rather than under it.
 *
 * Native scrolling only: a swipe on a phone, a trackpad on a laptop. No
 * auto-drift — the hero above already moves on its own, and a second thing
 * moving unasked is noise.
 */
.reel {
  position: relative;
  z-index: 1;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--cover-w);
  gap: var(--reel-gap);
  margin-inline: calc(-1 * var(--reel-start)) calc(-1 * var(--edge));
  margin-block: 0.75rem -0.75rem;
  /* Vertical padding is room for the covers' cast shadows (the deepest reaches
     ~2.25rem below a cover), which an `overflow-x: auto` box would otherwise
     clip into a hard line. The negative margin hands the room back. */
  padding: 1.25rem var(--edge) 3.25rem var(--reel-start);
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  scroll-padding-inline: var(--reel-start) var(--edge);
  scrollbar-width: none;
}

.reel::-webkit-scrollbar {
  display: none;
}

.reel > li {
  scroll-snap-align: start;
}

.reel__link {
  display: block;
  border-radius: 1rem;
  -webkit-user-drag: none;
  transition: translate 220ms cubic-bezier(0.23, 1, 0.32, 1);
}

/* Lifts toward the pointer. Pointer-only: a tap would leave it lifted. */
@media (hover: hover) and (pointer: fine) {
  .reel__link:hover {
    translate: 0 -4px;
  }
}

.reel__link:active {
  scale: 0.98;
}

@media (prefers-reduced-motion: reduce) {
  .reel__link {
    transition: none;
  }
  .reel__link:hover,
  .reel__link:active {
    translate: none;
    scale: none;
  }
}
</style>
