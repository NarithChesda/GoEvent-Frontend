<template>
  <div ref="wallEl" class="tst-wall">
    <!-- The host page supplies its own header, so a section keeps its page's
         voice while joining this wall's single reveal sequence. -->
    <div v-if="$slots.header" class="tst-reveal" :class="{ 'is-in': revealed }">
      <slot name="header" />
    </div>

    <!-- Optional aggregate line. Type and space, no chrome. -->
    <div
      v-if="stats?.length"
      class="tst-reveal mb-12 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500 sm:gap-x-5"
      :class="[{ 'is-in': revealed }, align === 'center' ? 'justify-center' : '']"
      style="--tst-i: 1"
    >
      <template v-for="(stat, i) in stats" :key="stat.label">
        <span v-if="i > 0" class="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true"></span>
        <span class="inline-flex items-center gap-1.5">
          <Star v-if="stat.star" class="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
          <span class="font-semibold text-slate-900">{{ stat.value }}</span>
          {{ stat.label }}
        </span>
      </template>
    </div>

    <div class="columns-1 gap-4 sm:gap-5 md:columns-2 xl:columns-3">
      <div
        v-for="(item, index) in items"
        :key="item.id"
        class="mb-4 break-inside-avoid sm:mb-5"
      >
        <figure
          lang="km"
          class="tst-card tst-reveal relative"
          :class="[{ 'is-in': revealed }, surfaceClass(item)]"
          :style="{ '--tst-i': index + 2 }"
        >
          <Quote
            v-if="item.featured"
            class="absolute right-5 top-5 h-8 w-8 text-slate-200"
            aria-hidden="true"
          />

          <div class="flex items-center gap-0.5" role="img" :aria-label="`${item.rating} / 5`">
            <Star
              v-for="n in 5"
              :key="n"
              class="h-3.5 w-3.5"
              :class="
                n <= item.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
              "
              aria-hidden="true"
            />
          </div>

          <blockquote
            class="mt-4 leading-relaxed text-slate-700"
            :class="item.featured ? 'pr-6 text-lg sm:text-xl' : 'text-base'"
          >
            {{ item.quote }}
          </blockquote>

          <div
            v-if="item.metric"
            class="mt-5 flex items-baseline gap-2 rounded-xl bg-slate-50 px-4 py-3"
          >
            <span class="text-xl font-bold text-slate-900">{{ item.metric.value }}</span>
            <span class="text-xs leading-relaxed text-slate-500">{{ item.metric.label }}</span>
          </div>

          <figcaption
            class="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5"
          >
            <span
              class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-base font-semibold"
              :class="
                item.featured
                  ? 'bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 text-[#1873cc]'
                  : 'bg-slate-100 text-slate-700'
              "
              aria-hidden="true"
              >{{ initialOf(item.name) }}</span
            >
            <div class="min-w-0">
              <div class="text-sm font-semibold text-slate-900">{{ item.name }}</div>
              <div class="line-clamp-2 text-xs leading-relaxed text-slate-500">
                {{ item.role }} · {{ item.location }}
              </div>
            </div>
          </figcaption>
        </figure>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Quote, Star } from 'lucide-vue-next'

interface Testimonial {
  id: string
  name: string
  role: string
  location: string
  rating: number
  featured: boolean
  quote: string
  metric?: { value: string; label: string }
}

interface TestimonialStat {
  value: string
  label: string
  star?: boolean
}

withDefaults(
  defineProps<{
    items: Testimonial[]
    stats?: TestimonialStat[]
    align?: 'start' | 'center'
  }>(),
  { align: 'start', stats: undefined },
)

const surfaceClass = (item: Testimonial) =>
  item.featured
    ? 'rounded-2xl border border-slate-200 bg-white p-6 shadow-md ring-1 ring-slate-900/5 sm:p-7'
    : 'rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm sm:p-7'

const initialOf = (name: string) => Array.from(name)[0] ?? ''

const wallEl = ref<HTMLElement>()
const revealed = ref(false)
let observer: IntersectionObserver | null = null

const stopObserving = () => {
  observer?.disconnect()
  observer = null
}

onMounted(() => {
  if (!wallEl.value) return

  if (!('IntersectionObserver' in window)) {
    revealed.value = true
    return
  }

  // One-shot: a testimonial that re-animates every time you scroll past it is
  // ambient motion, not feedback.
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        revealed.value = true
        stopObserving()
      }
    },
    { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
  )

  observer.observe(wallEl.value)
})

onBeforeUnmount(stopObserving)
</script>

<style scoped>
/* Every motion value defers to the host page's own reveal tokens when it has
 * them (PartnerProgramView publishes all four on `.partner-page`), so the wall
 * stays in tune with the sections above and below it instead of running a
 * second, slightly-different motion language inside them. */
.tst-wall {
  --tst-ease: var(--ease-reveal, cubic-bezier(0.23, 1, 0.32, 1));
  --tst-duration: var(--reveal-duration, 500ms);
  --tst-lift: var(--reveal-lift, 14px);
  /* Stagger is decorative — capped in CSS so a long wall never reads as loading. */
  --tst-stagger: var(--stagger, 55ms);
}

/* Entrance uses the `translate` longhand so the hover below can own `transform`
 * on the same element without the two sharing one timing track. */
.tst-reveal {
  /* Declared here, not on the wall, because `--tst-i` is set per item and a
   * custom property is substituted on the element that declares it. */
  --tst-delay: calc(var(--tst-stagger) * min(var(--tst-i, 0), 9));

  opacity: 0;
  translate: 0 var(--tst-lift);
  transition:
    opacity var(--tst-duration) var(--tst-ease),
    translate var(--tst-duration) var(--tst-ease);
  transition-delay: var(--tst-delay);
  will-change: opacity, translate;
}

.tst-reveal.is-in {
  opacity: 1;
  translate: none;
}

/* Specificity 0,2,0 — this replaces the transition list above rather than
 * competing with it, since `transition` does not merge across rules. */
.tst-card.tst-reveal {
  transition:
    opacity var(--tst-duration) var(--tst-ease),
    translate var(--tst-duration) var(--tst-ease),
    transform 200ms var(--tst-ease),
    box-shadow 200ms var(--tst-ease),
    border-color 200ms var(--tst-ease);
  /* The shorthand above resets `transition-delay`, so the stagger has to be
   * restated — and per property, or a hover would wait out the entrance delay
   * before it moved. */
  transition-delay: var(--tst-delay), var(--tst-delay), 0ms, 0ms, 0ms;
}

@media (hover: hover) and (pointer: fine) {
  .tst-card:hover {
    transform: translateY(-2px);
    border-color: rgb(203 213 225);
    box-shadow:
      0 10px 20px -6px rgb(15 23 42 / 0.1),
      0 2px 6px -2px rgb(15 23 42 / 0.06);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tst-reveal,
  .tst-card.tst-reveal {
    translate: none;
    transition:
      opacity 200ms ease,
      box-shadow 200ms ease,
      border-color 200ms ease;
    transition-delay: 0ms;
  }

  .tst-card:hover {
    transform: none;
  }
}
</style>
