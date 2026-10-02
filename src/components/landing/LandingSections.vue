<template>
  <!-- The homepage below the hero: what an invitation holds, how one gets made
       (with the designs inside the step that chooses one), the price, the
       questions people ask, and a way to start. It is also most of the
       homepage's text — build/prerenderBodies.ts writes the same strings into
       the static HTML for crawlers that never run this app, so a section added
       here belongs there too. Structure that both read lives in
       landingContent.ts.

       No two neighbours share a layout: a diptych, a numbered thread with a
       bled reel, a row of cards, one reading column, a centred close. And one
       gradient object per screen — the hero's CTA, the best-seller's, and the
       closing CTA are each a screen or more apart; the thread is a tint. -->
  <div class="landing-sections">
    <LandingFeatures :designs="designs" :status="status" />
    <LandingSteps :designs="designs" :status="status" />

    <PricingSection />

    <section aria-labelledby="landing-faq-title" class="faq border-t border-slate-200/70">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          id="landing-faq-title"
          class="type-display-sm text-[clamp(1.75rem,1.3rem+1.6vw,2.5rem)] font-bold tracking-tight text-slate-900"
        >
          {{ t('events.landing.faq.title') }}
        </h2>

        <!-- <details>, not a scripted accordion: the answers are in the
             document whether or not they are open, which is what a crawler
             and a browser's find-in-page both need. -->
        <div class="mt-8 sm:mt-10 divide-y divide-slate-200 border-y border-slate-200">
          <details v-for="item in FAQ" :key="item" class="faq-item">
            <summary
              class="faq-summary flex items-center justify-between gap-4 py-5 min-h-[56px] cursor-pointer list-none text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            >
              <span class="text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                {{ t(`events.landing.faq.${item}.q`) }}
              </span>
              <Plus class="faq-icon w-5 h-5 text-slate-400 flex-shrink-0" aria-hidden="true" />
            </summary>
            <p class="pb-6 pr-10 max-w-[36rem] text-sm sm:text-base text-slate-600 leading-relaxed">
              {{ t(`events.landing.faq.${item}.a`) }}
            </p>
          </details>
        </div>
      </div>
    </section>

    <!-- The close: the page's reassurance, said once more where the decision
         is made, and the hero's own call to action — same words, same button,
         same wizard. The sentence is pricing's subtitle, reused rather than
         reworded, so the price is stated in one string only. -->
    <section aria-labelledby="landing-closing-line" class="closing">
      <div class="max-w-2xl mx-auto px-6 text-center flex flex-col items-center">
        <p
          id="landing-closing-line"
          class="type-display-sm text-[clamp(1.375rem,1.1rem+1.1vw,1.875rem)] font-bold tracking-tight text-slate-900 max-w-[22em]"
        >
          {{ t('events.landing.pricing.subtitle') }}
        </p>
        <button
          type="button"
          class="closing-cta mt-7 inline-flex items-center justify-center px-6 py-3 min-h-[48px] bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white text-sm font-semibold rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-600/30 hover:scale-[1.03] active:scale-95 whitespace-nowrap"
          @click="emit('create')"
        >
          {{ t('events.landing.primaryCta') }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import PricingSection from '@/components/PricingSection.vue'
import LandingFeatures from './LandingFeatures.vue'
import LandingSteps from './LandingSteps.vue'
import { FAQ } from './landingContent'
import { useLandingDesigns } from './landingDesigns'
import { useAppLanguage } from '@/composables/useAppLanguage'

const emit = defineEmits<{ create: [] }>()

const { t } = useAppLanguage()

/** One catalogue request, shared by the features' card stack and the design step's reel. */
const { designs, status, load } = useLandingDesigns()

onMounted(() => {
  void load()
})
</script>

<style scoped>
/* Hallmark · macrostructure: Narrative Workflow (below a Marquee Hero) · tone: warm, plain-spoken
 * design-system: DESIGN.md (slate · brand gradient · Figtree / Noto Serif Khmer) · studied: no */

.faq {
  padding-block: clamp(4rem, 10vh, 6rem) clamp(3rem, 8vh, 5rem);
}

.faq-summary::-webkit-details-marker {
  display: none;
}

/* A plus that turns into a cross: open reads as "add this to what you see",
   and the same mark closes it. */
.faq-icon {
  transition:
    rotate 220ms cubic-bezier(0.23, 1, 0.32, 1),
    color 200ms ease;
}

.faq-item[open] .faq-icon {
  rotate: 45deg;
  color: rgb(15 23 42); /* slate-900 */
}

@media (hover: hover) and (pointer: fine) {
  .faq-summary:hover .faq-icon {
    color: rgb(15 23 42);
  }
}

/* The last screen of the page on a phone, where there is no footer: enough
   room under the button that it does not sit on the screen's edge. */
.closing {
  padding-block: clamp(3.5rem, 9vh, 6rem) clamp(4.5rem, 12vh, 7rem);
}

/* The hero's call to action, with its properties named: a `transition-all`
   would also ease the focus indicator in, which has to be there the instant
   focus lands. An outline, not a ring, for the same reason — Tailwind's ring
   is a box-shadow, and the shadow is what this button animates. */
/* `transform`, because Tailwind 3's `scale-*` utilities write it there. */
.closing-cta {
  transition:
    transform 300ms cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 300ms ease;
}

.closing-cta:focus {
  outline: none;
}

.closing-cta:focus-visible {
  outline: 2px solid #7dd3fc; /* sky-300 */
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .faq-icon,
  .closing-cta {
    transition: none;
  }
  .closing-cta:hover,
  .closing-cta:active {
    transform: none;
  }
}
</style>
