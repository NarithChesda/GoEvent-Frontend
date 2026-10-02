<template>
  <div v-if="items.length" ref="rootEl" class="ptst" :class="{ 'is-revealed': revealed }">
    <!--
      ONE VOICE AT A TIME, EVERY SHOP IN VIEW.

      This used to be a lead quote over a grid of six, all in the same small
      grey text — a wall a reader skims and forgets, where the one thing a
      testimonial has going for it (a person, saying something in their own
      words) was spread across seven equal blocks until none of them was
      anybody. So the section now does two different jobs with two different
      objects:

      - The STAGE says one review properly, at display size in the Khmer
        display face, the way a magazine sets a pull quote.
      - The ROSTER says how many shops there are and who they are — name,
        trade, town — which is the part a shop owner actually scans for
        ("is anyone like me, near me, using this?"). It is also the control.

      Every review stays in the DOM (crawlers and screen readers get all of
      them); only the active one is visible.
    -->
    <div class="ptst-layout">
      <div class="ptst-reveal min-w-0" :style="{ '--ptst-i': 0 }">
        <!--
          All slides share one grid cell, so the stage is always as tall as its
          longest review and switching never moves the roster or the page under
          the reader's finger. The live region announces the review that
          arrives; the hidden ones are out of the accessibility tree.

          `touch-action: pan-y` (in CSS) leaves vertical scrolling to the page
          and hands horizontal swipes to us.
        -->
        <div
          class="ptst-stage"
          aria-live="polite"
          @pointerdown="onPointerDown"
          @pointerup="onPointerUp"
          @pointercancel="swipeStart = null"
        >
          <svg class="ptst-mark" viewBox="0 0 48 36" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="ptst-mark-fill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#2ecc71" />
                <stop offset="1" stop-color="#1e90ff" />
              </linearGradient>
            </defs>
            <path
              fill="url(#ptst-mark-fill)"
              d="M0 36V22.5C0 9.9 6.6 2.4 19.2 0l2.1 5.1C14.4 7.2 11.1 11.4 10.8 17.4H20V36H0Zm27.6 0V22.5C27.6 9.9 34.2 2.4 46.8 0l2.1 5.1c-6.9 2.1-10.2 6.3-10.5 12.3h9.2V36H27.6Z"
            />
          </svg>

          <figure
            v-for="(item, index) in items"
            :key="item.id"
            lang="km"
            class="ptst-slide"
            :class="{ 'is-active': index === activeIndex }"
            :aria-hidden="index === activeIndex ? undefined : 'true'"
          >
            <blockquote class="type-display-sm font-medium text-slate-900" :class="quoteSize(item)">
              {{ item.quote }}
            </blockquote>

            <figcaption
              class="mt-auto flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-t border-slate-200 pt-6"
            >
              <div class="flex min-w-0 items-center gap-3.5">
                <span class="ptst-disc ptst-disc--stage" aria-hidden="true">
                  {{ initialOf(item.name) }}
                </span>
                <div class="min-w-0">
                  <div class="text-base font-semibold text-slate-900">{{ item.name }}</div>
                  <div class="mt-0.5 text-sm leading-relaxed text-slate-500">
                    {{ item.role }} · {{ item.location }}
                  </div>
                </div>
              </div>

              <!-- `metric.value`, not `metric`: a record saved with an empty
                   metric object used to draw a stray rule under its quote. -->
              <div v-if="item.metric?.value" class="min-w-0 sm:text-right">
                <div class="text-2xl font-semibold tracking-tight text-slate-900">
                  {{ item.metric.value }}
                </div>
                <div class="mt-0.5 text-xs leading-relaxed text-slate-500">
                  {{ item.metric.label }}
                </div>
              </div>
            </figcaption>
          </figure>
        </div>
      </div>

      <!--
        The roster, in two shapes from one markup — the screen picker's
        technique on the same page, and for the same reason.

        From `lg` up it is a list beside the stage: initial, name, trade · town.
        Below `lg` it is a rail of initials directly under the stage, because
        stacked, a list would put the shop being pressed a screen below the
        review it changes; the rail keeps the change inside the reader's view.
        The name is not lost there — the stage's own attribution carries it.

        Toggle buttons with `aria-pressed`, not a tablist: a tablist owes the
        reader roving arrow-key focus and labelled panels, and this is seven
        toggles over one stage.
      -->
      <ul
        v-if="items.length > 1"
        class="ptst-roster ptst-reveal scrollbar-hide"
        :style="{ '--ptst-i': 1 }"
        :aria-label="t('partners.testimonials.rosterLabel')"
      >
        <li v-for="(item, index) in items" :key="item.id" class="flex-none lg:flex-auto">
          <button
            type="button"
            class="ptst-who"
            :data-active="index === activeIndex"
            :aria-pressed="index === activeIndex"
            :aria-label="`${item.name} · ${item.role} · ${item.location}`"
            @click="activeIndex = index"
          >
            <span class="ptst-disc ptst-disc--roster" aria-hidden="true">
              {{ initialOf(item.name) }}
            </span>
            <span class="ptst-who__text" aria-hidden="true">
              <span class="block truncate text-sm font-semibold text-slate-900">
                {{ item.name }}
              </span>
              <span class="block truncate text-xs leading-relaxed text-slate-500">
                {{ item.role }} · {{ item.location }}
              </span>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface Testimonial {
  id: string
  name: string
  role: string
  location: string
  quote: string
  featured?: boolean
  metric?: { value: string; label: string }
}

const props = defineProps<{ items: Testimonial[] }>()

const { t } = useAppLanguage()

/** Opens on the featured review — the one chosen to be read first. */
const activeIndex = ref(
  Math.max(
    0,
    props.items.findIndex((item) => item.featured),
  ),
)

/*
  The stage is as tall as its longest review, so a short one set at the same
  size as a long one is a line of type over a block of air. Shorter reviews are
  set larger instead — a magazine's answer to the same problem, and the one that
  favours the short reviews, which are often the most human.

  Counted in code points, not `.length`: a Khmer cluster is several UTF-16
  units, and `.length` would call every Khmer review long. The steps are tuned
  on the current set (29 to 102 code points).
*/
const quoteSize = (item: Testimonial) => {
  const length = Array.from(item.quote).length
  if (length <= 40) return 'ptst-q ptst-q--xl'
  if (length <= 90) return 'ptst-q ptst-q--lg'
  return 'ptst-q ptst-q--md'
}

const initialOf = (name: string) => Array.from(name)[0] ?? ''

/* ------------------------------------------------------------------ swipe */

/*
  A horizontal swipe on the stage moves to the next or previous review. Touch
  and pen only: a mouse drag across text is a selection, not a gesture. The
  thresholds keep a vertical scroll that wanders sideways from turning a page.
*/
let swipeStart: { x: number; y: number } | null = null

const onPointerDown = (event: PointerEvent) => {
  swipeStart = event.pointerType === 'mouse' ? null : { x: event.clientX, y: event.clientY }
}

const onPointerUp = (event: PointerEvent) => {
  if (!swipeStart) return
  const dx = event.clientX - swipeStart.x
  const dy = event.clientY - swipeStart.y
  swipeStart = null
  if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return
  const count = props.items.length
  activeIndex.value = (activeIndex.value + (dx < 0 ? 1 : -1) + count) % count
}

/* ----------------------------------------------------------------- reveal */

const rootEl = ref<HTMLElement>()
const revealed = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!rootEl.value) return
  if (!('IntersectionObserver' in window)) {
    revealed.value = true
    return
  }

  // One-shot. A testimonial that re-animates every time you scroll past it is
  // ambient motion, not feedback.
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        revealed.value = true
        observer?.disconnect()
        observer = null
      }
    },
    { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
  )
  observer.observe(rootEl.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<style scoped>
/* Hallmark · component: review stage + roster · design-system: DESIGN.md (slate · brand tint · Noto Serif Khmer display)
 * states: default · hover · focus-visible · active (press) · selected · reduced-motion */

/* Motion defers to the host page's own reveal tokens (PartnerProgramView
 * publishes them on `.partner-page`) so this section runs the page's motion
 * language rather than a second, slightly-different one inside it. */
.ptst {
  --ptst-ease: var(--ease-reveal, cubic-bezier(0.23, 1, 0.32, 1));
  --ptst-duration: var(--reveal-duration, 500ms);
  --ptst-lift: var(--reveal-lift, 14px);
  --ptst-stagger: var(--stagger, 55ms);
}

.ptst-reveal {
  /* Declared here, not on the root, because `--ptst-i` is set per element and
   * a custom property is substituted on the element that declares it. */
  --ptst-delay: calc(var(--ptst-stagger) * var(--ptst-i, 0));

  opacity: 0;
  translate: 0 var(--ptst-lift);
  transition:
    opacity var(--ptst-duration) var(--ptst-ease),
    translate var(--ptst-duration) var(--ptst-ease);
  transition-delay: var(--ptst-delay);
}

.ptst.is-revealed .ptst-reveal {
  opacity: 1;
  translate: none;
}

/* ------------------------------------------------------------------ layout */

.ptst-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
}

/* The stage takes seven twelfths and the roster the rest; `stretch` makes the
 * stage as tall as the roster, so its attribution rule lines up with the
 * roster's last row instead of floating above it. */
@media (min-width: 1024px) {
  .ptst-layout {
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    gap: 3rem;
    align-items: stretch;
  }
}

/* ------------------------------------------------------------------- stage */

/*
  A white card on the section's grey ground: the review is the one object here
  a reader is asked to stop and read, so it is the one that is lifted.
*/
.ptst-stage {
  position: relative;
  display: grid;
  height: 100%;
  overflow: hidden;
  border-radius: 1.5rem;
  border: 1px solid rgb(226 232 240);
  background: #fff;
  padding: 4.25rem 1.5rem 1.5rem;
  box-shadow:
    0 1.25rem 2.5rem -1.5rem rgb(15 23 42 / 0.18),
    0 0.0625rem 0.125rem rgb(15 23 42 / 0.04);
  touch-action: pan-y;
}

@media (min-width: 640px) {
  .ptst-stage {
    padding: 5.25rem 2.5rem 2.25rem;
  }
}

/* The quotation mark is the stage's, not each review's: it stays put while
 * the words under it change, which is what makes the change read as the next
 * voice rather than as a new card. A brand tint, so it is texture rather than
 * a second gradient object on the screen. */
.ptst-mark {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  width: 2.25rem;
  opacity: 0.35;
}

@media (min-width: 640px) {
  .ptst-mark {
    top: 2.25rem;
    left: 2.5rem;
    width: 2.75rem;
  }
}

/*
  Every slide sits in the same cell. The leaving one fades out first and fast;
  the arriving one follows a beat later, lifting a few pixels — so there is no
  frame where two reviews are legible on top of each other. `visibility` flips
  after the fade, which takes a hidden slide out of hit-testing and out of the
  accessibility tree in the same declaration that hides it.
*/
.ptst-slide {
  grid-area: 1 / 1;
  display: flex;
  min-width: 0;
  flex-direction: column;
  opacity: 0;
  visibility: hidden;
  transform: translateY(0.5rem);
  transition:
    opacity 140ms var(--ptst-ease),
    transform 140ms var(--ptst-ease),
    visibility 0s linear 140ms;
}

.ptst-slide.is-active {
  opacity: 1;
  visibility: visible;
  transform: none;
  transition:
    opacity 280ms var(--ptst-ease) 90ms,
    transform 280ms var(--ptst-ease) 90ms,
    visibility 0s;
}

/* Three steps of the display ladder, by length (see `quoteSize`). Leading is
 * left to `.type-display-sm`, which carries the Khmer value. */
.ptst-q--xl {
  font-size: 1.75rem;
}

.ptst-q--lg {
  font-size: 1.375rem;
}

.ptst-q--md {
  font-size: 1.1875rem;
}

@media (min-width: 640px) {
  .ptst-q--xl {
    font-size: 2.5rem;
  }

  .ptst-q--lg {
    font-size: 1.875rem;
  }

  .ptst-q--md {
    font-size: 1.5rem;
  }
}

@media (min-width: 1280px) {
  .ptst-q--xl {
    font-size: 2.875rem;
  }

  .ptst-q--lg {
    font-size: 2.125rem;
  }

  .ptst-q--md {
    font-size: 1.6875rem;
  }
}

.ptst-q {
  padding-bottom: 2rem;
  overflow-wrap: anywhere;
}

/* ------------------------------------------------------------------- discs */

.ptst-disc {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  font-weight: 600;
}

.ptst-disc--stage {
  height: 3rem;
  width: 3rem;
  font-size: 1rem;
  color: rgb(51 65 85);
  background: linear-gradient(135deg, rgb(46 204 113 / 0.16), rgb(30 144 255 / 0.16));
}

.ptst-disc--roster {
  /* 2.5rem: seven of these and their gaps fit the 343px a 375px phone leaves,
   * and still clear the 40px touch-target floor. */
  height: 2.5rem;
  width: 2.5rem;
  font-size: 0.875rem;
  color: rgb(71 85 105);
  background: #fff;
  box-shadow: inset 0 0 0 1px rgb(226 232 240);
  transition:
    background-color 200ms var(--ptst-ease),
    color 200ms var(--ptst-ease),
    box-shadow 200ms var(--ptst-ease);
}

/* ------------------------------------------------------------------ roster */

/* Phone and tablet: a rail of initials, bled to the screen edges so a set too
 * long for a 320px phone scrolls instead of wrapping into a ragged second row. */
.ptst-roster {
  display: flex;
  gap: 0.375rem;
  margin-inline: -1rem;
  padding-inline: 1rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
}

.ptst-who {
  display: flex;
  width: 100%;
  align-items: center;
  border-radius: 9999px;
  padding: 0;
  text-align: left;
  transition:
    background-color 200ms var(--ptst-ease),
    box-shadow 200ms var(--ptst-ease),
    transform 200ms var(--ptst-ease);
}

.ptst-who:active {
  transform: scale(0.96);
}

.ptst-who:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgb(125 211 252);
}

.ptst-who__text {
  display: none;
}

.ptst-who[data-active='true'] .ptst-disc--roster {
  color: #fff;
  background: rgb(15 23 42);
  box-shadow: inset 0 0 0 1px rgb(15 23 42);
}

@media (hover: hover) and (pointer: fine) {
  .ptst-who:not([data-active='true']):hover .ptst-disc--roster {
    box-shadow: inset 0 0 0 1px rgb(148 163 184);
  }
}

/*
  Desktop: the same buttons become rows — initial, name, trade · town. The
  chosen row is raised (white, a hairline, a soft shadow) and its initial
  inverts, which is the stage's own white card answering it from across the
  gutter.
*/
@media (min-width: 1024px) {
  .ptst-roster {
    display: block;
    margin-inline: 0;
    padding-inline: 0;
    overflow: visible;
  }

  .ptst-roster > li + li {
    margin-top: 0.25rem;
  }

  .ptst-who {
    gap: 0.875rem;
    border-radius: 1rem;
    padding: 0.625rem 0.75rem;
  }

  .ptst-who:active {
    transform: scale(0.99);
  }

  .ptst-who__text {
    display: block;
    min-width: 0;
    flex: 1;
  }

  .ptst-who[data-active='true'] {
    background: #fff;
    box-shadow:
      inset 0 0 0 1px rgb(226 232 240),
      0 0.375rem 1rem -0.5rem rgb(15 23 42 / 0.14);
  }

  @media (hover: hover) and (pointer: fine) {
    .ptst-who:not([data-active='true']):hover {
      background: rgb(255 255 255 / 0.6);
    }
  }

  .ptst-who:focus-visible {
    box-shadow:
      0 0 0 2px rgb(125 211 252),
      0 0.375rem 1rem -0.5rem rgb(15 23 42 / 0.14);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ptst-reveal {
    translate: none;
    transition: opacity 200ms linear;
    transition-delay: 0ms;
  }

  .ptst-slide,
  .ptst-slide.is-active {
    transform: none;
    transition:
      opacity 150ms linear,
      visibility 0s;
  }

  .ptst-who:active {
    transform: none;
  }
}
</style>
