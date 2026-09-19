<template>
  <!-- The homepage below the hero: what GoEvent does, how, the designs, the
       price and the questions people ask before they start. It is also most
       of the homepage's text — build/prerenderBodies.ts writes the same
       strings into the static HTML for crawlers that never run this app, so
       a section added here belongs there too.

       One gradient per viewport: the hero spends it on its CTA and headline,
       so nothing below it is gradient until the pricing cards, which are a
       screen further down. Hierarchy here is type, slate value and space. -->
  <div class="landing-sections">
    <section aria-labelledby="landing-features-title" class="landing-band">
      <div class="landing-column">
        <h2 id="landing-features-title" class="landing-title">
          {{ t('events.landing.features.title') }}
        </h2>
        <p class="landing-lead">{{ t('events.landing.features.subtitle') }}</p>

        <ul class="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8 sm:gap-y-10">
          <li v-for="feature in FEATURES" :key="feature.key" class="flex gap-3.5">
            <component
              :is="feature.icon"
              class="w-5 h-5 mt-0.5 text-slate-500 flex-shrink-0"
              aria-hidden="true"
            />
            <div class="min-w-0">
              <h3 class="text-base font-semibold text-slate-900 leading-snug">
                {{ t(`events.landing.features.${feature.key}.title`) }}
              </h3>
              <p class="mt-1.5 text-sm text-slate-600 leading-relaxed">
                {{ t(`events.landing.features.${feature.key}.body`) }}
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- A change of surface, so the page doesn't scroll as one texture. -->
    <section aria-labelledby="landing-steps-title" class="landing-band bg-white/70 border-y border-slate-200/70">
      <div class="landing-column">
        <h2 id="landing-steps-title" class="landing-title">
          {{ t('events.landing.steps.title') }}
        </h2>

        <ol class="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          <li v-for="(step, index) in STEPS" :key="step" class="border-t border-slate-200 pt-5">
            <span class="block text-sm font-semibold text-slate-400 tabular-nums" aria-hidden="true">
              {{ String(index + 1).padStart(2, '0') }}
            </span>
            <h3 class="mt-2 text-base font-semibold text-slate-900 leading-snug">
              {{ t(`events.landing.steps.${step}.title`) }}
            </h3>
            <p class="mt-1.5 text-sm text-slate-600 leading-relaxed">
              {{ t(`events.landing.steps.${step}.body`) }}
            </p>
          </li>
        </ol>
      </div>
    </section>

    <section aria-labelledby="landing-designs-title" class="landing-band">
      <div class="landing-column lg:flex lg:items-end lg:justify-between lg:gap-16">
        <div class="max-w-xl">
          <h2 id="landing-designs-title" class="landing-title">
            {{ t('events.landing.designs.title') }}
          </h2>
          <p class="landing-lead">{{ t('events.landing.designs.body') }}</p>
        </div>

        <div class="mt-6 lg:mt-0 flex flex-col items-start gap-4 lg:items-end flex-shrink-0">
          <RouterLink
            to="/partners/templates"
            class="group inline-flex items-center gap-2 px-5 py-2.5 lg:px-6 lg:py-3 min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2"
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
              class="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900 transition-colors duration-200"
            >
              {{ t('events.landing.designs.partnerCta') }}
            </RouterLink>
          </p>
        </div>
      </div>
    </section>

    <PricingSection class="border-t border-slate-200/70" />

    <section aria-labelledby="landing-faq-title" class="landing-band border-t border-slate-200/70">
      <div class="landing-column lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
        <h2 id="landing-faq-title" class="landing-title">
          {{ t('events.landing.faq.title') }}
        </h2>

        <!-- <details>, not a scripted accordion: the answers are in the
             document whether or not they are open, which is what a crawler
             and a browser's find-in-page both need. -->
        <div class="mt-6 lg:mt-0 divide-y divide-slate-200 border-y border-slate-200">
          <details v-for="item in FAQ" :key="item" class="faq-item">
            <summary
              class="faq-summary flex items-center justify-between gap-4 py-4 min-h-[48px] cursor-pointer list-none text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            >
              <span class="text-base font-medium text-slate-900 leading-snug">
                {{ t(`events.landing.faq.${item}.q`) }}
              </span>
              <ChevronDown
                class="faq-chevron w-4 h-4 text-slate-400 flex-shrink-0"
                aria-hidden="true"
              />
            </summary>
            <p class="pb-5 pr-8 text-sm sm:text-base text-slate-600 leading-relaxed">
              {{ t(`events.landing.faq.${item}.a`) }}
            </p>
          </details>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import {
  ArrowRight,
  ChevronDown,
  Images,
  Languages,
  Link2,
  MessageCircleReply,
  Ticket,
  Users,
} from 'lucide-vue-next'
import PricingSection from '@/components/PricingSection.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()

/** Key order is page order. Keys name `events.landing.features.<key>`. */
const FEATURES = [
  { key: 'personal', icon: Link2 },
  { key: 'bilingual', icon: Languages },
  { key: 'media', icon: Images },
  { key: 'rsvp', icon: MessageCircleReply },
  { key: 'guests', icon: Users },
  { key: 'tickets', icon: Ticket },
] as const

const STEPS = ['create', 'design', 'share'] as const

const FAQ = ['guests', 'languages', 'cost', 'edit', 'help'] as const
</script>

<style scoped>
.landing-band {
  padding-block: clamp(3.5rem, 9vh, 6rem);
}

.landing-column {
  max-width: 64rem;
  margin-inline: auto;
  padding-inline: 1rem;
}

@media (min-width: 640px) {
  .landing-column {
    padding-inline: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .landing-column {
    padding-inline: 2rem;
  }
}

/* `leading-snug`, not tight: a Khmer heading's coeng subscripts hang below
   the line box a Latin one fits in. */
.landing-title {
  font-size: clamp(1.5rem, 1.2rem + 1.2vw, 1.875rem);
  font-weight: 700;
  line-height: 1.375;
  letter-spacing: -0.015em;
  color: rgb(15 23 42);
  max-width: 24ch;
}

.landing-lead {
  margin-top: 0.75rem;
  max-width: 36rem;
  font-size: 1rem;
  line-height: 1.625;
  color: rgb(71 85 105);
}

.faq-summary::-webkit-details-marker {
  display: none;
}

.faq-chevron {
  transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
}

.faq-item[open] .faq-chevron {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .faq-chevron {
    transition: none;
  }
}
</style>
