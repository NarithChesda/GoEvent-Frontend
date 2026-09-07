<template>
  <div ref="rootEl" class="ptst" :class="{ 'is-revealed': revealed }">
    <!--
      The lead. One shop's story told at full size, because six quotes at equal
      weight is a wall a reader skims and forgets — and the thing that makes a
      testimonial land is reading one of them properly.

      Set in the Khmer display face (`.type-display-sm` swaps it under
      `:lang(km)`), which is the one typographic move on this page that reads as
      a magazine rather than as an app: Kantumruy is a UI face, and at pull-quote
      size its counters close up. The supporting quotes stay in it — a display
      face for the lead and a text face for the body is how print has separated
      the two for a century.
    -->
    <!--
      The grid lives on the `<figure>` itself, not on a wrapper inside it:
      `<figcaption>` has to be a direct child of its `<figure>`, so an
      intervening layout div is invalid HTML (and Vue's compiler says so).
    -->
    <figure
      v-if="lead"
      lang="km"
      class="ptst-reveal lg:grid lg:grid-cols-12 lg:gap-x-12"
      :style="{ '--ptst-i': 0 }"
    >
      <div class="lg:col-span-7">
        <div class="h-0.5 w-10 bg-slate-900" aria-hidden="true"></div>
        <blockquote
          class="type-display-sm mt-6 max-w-[34rem] text-xl font-medium text-slate-900 sm:text-2xl lg:max-w-none lg:text-[1.75rem]"
        >
          {{ lead.quote }}
        </blockquote>
      </div>

      <figcaption
        class="mt-8 lg:col-span-5 lg:col-start-8 lg:mt-0 lg:flex lg:h-full lg:flex-col lg:justify-end lg:border-l lg:border-slate-200 lg:pl-8"
      >
        <div class="flex items-center gap-3.5">
          <span
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-base font-semibold text-slate-700 ring-1 ring-slate-200"
            aria-hidden="true"
            >{{ initialOf(lead.name) }}</span
          >
          <div class="min-w-0">
            <div class="text-base font-semibold text-slate-900">{{ lead.name }}</div>
            <div class="mt-0.5 text-sm leading-relaxed text-slate-500">
              {{ lead.role }} · {{ lead.location }}
            </div>
          </div>
        </div>

        <div v-if="lead.metric" class="mt-6 border-t border-slate-200 pt-5">
          <div class="text-2xl font-semibold tracking-tight text-slate-900">
            {{ lead.metric.value }}
          </div>
          <div class="mt-1 text-xs leading-relaxed text-slate-500">{{ lead.metric.label }}</div>
        </div>
      </figcaption>
    </figure>

    <!--
      The rest. One list, two layouts: an equal-height grid from `sm` up, and a
      snap rail on a phone.

      A grid rather than the masonry it replaced, because these blocks are
      separated by a hairline and hairlines that do not line up read as a
      rendering fault rather than as rhythm. Equal-height rows plus `mt-auto` on
      the attribution means every rule at the top of a row and every name at the
      bottom of it sits on one line.

      A rail rather than a stack on a phone, because six of these stacked is
      2,000px of dense Khmer between a reader and the closing ask. Swiping is
      also the gesture a phone reader already has in their thumb.
    -->
    <ul class="ptst-list mt-14 sm:mt-16 lg:mt-20" ref="railEl">
      <li
        v-for="(item, index) in supporting"
        :key="item.id"
        class="ptst-item ptst-reveal flex flex-col border-t border-slate-200 pt-6"
        :style="{ '--ptst-i': index + 1 }"
      >
        <figure lang="km" class="flex h-full flex-col">
          <blockquote class="leading-relaxed text-slate-700" :class="quoteSize(item)">
            {{ item.quote }}
          </blockquote>

          <div v-if="item.metric" class="mt-5 border-l border-slate-300 pl-3.5">
            <div class="text-base font-semibold text-slate-900">{{ item.metric.value }}</div>
            <div class="mt-0.5 text-xs leading-relaxed text-slate-500">{{ item.metric.label }}</div>
          </div>

          <figcaption class="mt-auto flex items-center gap-3 pt-7">
            <span
              class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-600 ring-1 ring-slate-200"
              aria-hidden="true"
              >{{ initialOf(item.name) }}</span
            >
            <div class="min-w-0">
              <div class="text-sm font-semibold text-slate-900">{{ item.name }}</div>
              <div class="text-xs leading-relaxed text-slate-500">
                {{ item.role }} · {{ item.location }}
              </div>
            </div>
          </figcaption>
        </figure>
      </li>
    </ul>

    <!--
      Rail position, phone only — and tappable, so the indicator is also the
      control and the rail has a keyboard path without making the scroller
      itself a tab stop.

      Segments rather than dots. A dot small enough to look right (5px) inside a
      target big enough to be legal (40px) leaves the marks a finger's width
      apart, which reads as five loose specks rather than as one control; a
      divided rail is contiguous by design, so the target and the mark can be
      the same 40px.
    -->
    <div class="ptst-nav mt-8 flex sm:hidden">
      <button
        v-for="(item, index) in supporting"
        :key="item.id"
        type="button"
        class="ptst-seg"
        :class="{ 'is-active': index === activeIndex }"
        :aria-label="item.name"
        :aria-current="index === activeIndex ? 'true' : undefined"
        @click="scrollToIndex(index)"
      >
        <span class="ptst-seg__bar" aria-hidden="true"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

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

const lead = computed(() => props.items.find((item) => item.featured) ?? props.items[0])
const supporting = computed(() => props.items.filter((item) => item !== lead.value))

/*
  Short quotes are set larger.

  The rows are equal height, so a four-word quote in a row measured by a
  four-line one is a block of air with a name at the bottom of it — and the
  shortest reviews are the most human ones, so shrinking the set to fix that
  would cost exactly the wrong quotes. Setting them up a step is what a magazine
  does with the same problem: the short one fills its column and reads as a
  deliberate pull-quote rather than as a gap.

  Measured in code points, not `.length`: a Khmer cluster is several UTF-16
  units, so `.length` would call every Khmer quote long.
*/
const SHORT_QUOTE_CHARS = 70

const quoteSize = (item: Testimonial) =>
  Array.from(item.quote).length <= SHORT_QUOTE_CHARS ? 'text-lg' : 'text-base'

const initialOf = (name: string) => Array.from(name)[0] ?? ''

/* ------------------------------------------------------------------ reveal */

const rootEl = ref<HTMLElement>()
const revealed = ref(false)
let observer: IntersectionObserver | null = null

/* -------------------------------------------------------------------- rail */

const railEl = ref<HTMLElement>()
const activeIndex = ref(0)
let scrollFrame = 0

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Distance from the rail's snap line to an item's leading edge. */
const offsetOf = (rail: HTMLElement, item: Element) =>
  item.getBoundingClientRect().left -
  rail.getBoundingClientRect().left -
  (parseFloat(getComputedStyle(rail).paddingLeft) || 0)

const syncActiveIndex = () => {
  scrollFrame = 0
  const rail = railEl.value
  if (!rail) return

  let best = 0
  let bestDistance = Infinity
  Array.from(rail.children).forEach((item, index) => {
    const distance = Math.abs(offsetOf(rail, item))
    if (distance < bestDistance) {
      bestDistance = distance
      best = index
    }
  })
  activeIndex.value = best
}

const onRailScroll = () => {
  if (scrollFrame) return
  scrollFrame = requestAnimationFrame(syncActiveIndex)
}

const scrollToIndex = (index: number) => {
  const rail = railEl.value
  const item = rail?.children[index]
  if (!rail || !item) return

  // Not `scrollIntoView`: it would also scroll the page vertically to satisfy
  // the same call, which on a section this tall is a visible jump.
  rail.scrollTo({
    left: rail.scrollLeft + offsetOf(rail, item),
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  })
}

onMounted(() => {
  railEl.value?.addEventListener('scroll', onRailScroll, { passive: true })

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
  railEl.value?.removeEventListener('scroll', onRailScroll)
  if (scrollFrame) cancelAnimationFrame(scrollFrame)
  observer?.disconnect()
  observer = null
})
</script>

<style scoped>
/* Motion defers to the host page's own reveal tokens (PartnerProgramView
 * publishes all four on `.partner-page`) so this section runs the page's
 * motion language rather than a second, slightly-different one inside it. */
.ptst {
  --ptst-ease: var(--ease-reveal, cubic-bezier(0.23, 1, 0.32, 1));
  --ptst-duration: var(--reveal-duration, 500ms);
  --ptst-lift: var(--reveal-lift, 14px);
  --ptst-stagger: var(--stagger, 55ms);
}

.ptst-reveal {
  /* Declared here, not on the root, because `--ptst-i` is set per item and a
   * custom property is substituted on the element that declares it. */
  --ptst-delay: calc(var(--ptst-stagger) * min(var(--ptst-i, 0), 8));

  opacity: 0;
  translate: 0 var(--ptst-lift);
  transition:
    opacity var(--ptst-duration) var(--ptst-ease),
    translate var(--ptst-duration) var(--ptst-ease);
  transition-delay: var(--ptst-delay);
  will-change: opacity, translate;
}

.ptst.is-revealed .ptst-reveal {
  opacity: 1;
  translate: none;
}

/* ---------------------------------------------------------------- the list */

.ptst-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2.5rem 2rem;
}

@media (min-width: 1024px) {
  .ptst-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 3rem 4rem;
  }
}

/* Phone: the same list becomes a snap rail. `grid-auto-flow: column` keeps the
 * items on one row and keeps them the same height, which is what lets every
 * card's name sit on one line as you swipe. */
@media (max-width: 639px) {
  .ptst-list {
    grid-auto-flow: column;
    grid-template-columns: none;
    grid-auto-columns: 78%;
    gap: 1.25rem;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    /* Bleeds to the screen edges so the next card peeks, while the first stays
     * flush with the headline above it. */
    margin-inline: -1rem;
    padding-inline: 1rem;
    scroll-padding-left: 1rem;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .ptst-list::-webkit-scrollbar {
    display: none;
  }

  .ptst-item {
    scroll-snap-align: start;
  }
}

/* ------------------------------------------------------------ rail position */

/* Pulls the first bar's own padding back off, so the rail starts on the same
 * line as the quote above it. */
.ptst-nav {
  margin-left: -3px;
}

.ptst-seg {
  display: flex;
  align-items: center;
  height: 44px;
  width: 40px;
  padding-inline: 3px;
  background: none;
  border: 0;
  cursor: pointer;
}

.ptst-seg__bar {
  display: block;
  height: 3px;
  width: 100%;
  border-radius: 999px;
  background: rgb(203 213 225);
  transition: background-color 200ms var(--ptst-ease);
}

/* Press feedback: a 3px bar has nothing to scale, so the response is tonal. */
.ptst-seg:active .ptst-seg__bar {
  background: rgb(148 163 184);
}

.ptst-seg.is-active .ptst-seg__bar {
  background: rgb(15 23 42);
}

.ptst-seg:focus-visible {
  outline: none;
}

.ptst-seg:focus-visible .ptst-seg__bar {
  outline: 2px solid rgb(186 230 253);
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .ptst-reveal {
    translate: none;
    transition: opacity 200ms ease;
    transition-delay: 0ms;
  }

  .ptst-seg__bar {
    transition: none;
  }
}
</style>
