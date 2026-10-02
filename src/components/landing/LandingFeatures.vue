<template>
  <!-- What GoEvent does, as a diptych: two real invitation covers on one side,
       the features on the other. It replaced a 3×2 grid of icon + title + body,
       which described a visual product without showing any of it and gave six
       very different promises the same weight.

       The features are grouped by who they are for, since that is the question
       the reader brings: four live on the invitation a guest opens, two in the
       organizer's own tools. The guests' group leads and is set larger; the
       organizer's sits in a quieter panel. -->
  <section
    aria-labelledby="landing-features-title"
    class="features"
    :class="{ 'features--plain': !showVisual }"
  >
    <div class="features__grid max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <header class="features__head">
        <h2
          id="landing-features-title"
          class="type-display-sm text-[clamp(1.75rem,1.3rem+1.6vw,2.5rem)] font-bold tracking-tight text-slate-900 max-w-[16em]"
        >
          {{ t('events.landing.features.title') }}
        </h2>
        <p class="mt-4 max-w-[34rem] text-base sm:text-lg text-slate-600 leading-relaxed">
          {{ t('events.landing.features.subtitle') }}
        </p>
      </header>

      <!-- Two designs as printed cards, one laid over the other. Decorative:
           the reel in "How it works" is where the designs are offered. -->
      <div v-if="showVisual" class="features__visual" aria-hidden="true">
        <div class="cover-stack">
          <DesignCover class="cover-stack__back" :src="designs[1]?.src" />
          <DesignCover class="cover-stack__front" :src="designs[0]?.src" />
        </div>
      </div>

      <div class="features__groups">
        <div
          v-for="group in FEATURE_GROUPS"
          :key="group.key"
          class="feature-group"
          :class="`feature-group--${group.key}`"
        >
          <h3 class="text-lg font-bold text-slate-900 leading-snug">
            {{ t(`events.landing.features.groups.${group.key}`) }}
          </h3>

          <ul class="feature-list">
            <li v-for="key in group.features" :key="key" class="feature">
              <component :is="FEATURE_ICONS[key]" class="feature__icon" aria-hidden="true" />
              <div class="min-w-0">
                <h4 class="feature__title text-slate-900 font-semibold leading-snug">
                  {{ t(`events.landing.features.${key}.title`) }}
                </h4>
                <p class="mt-1 text-sm sm:text-[0.9375rem] text-slate-600 leading-relaxed">
                  {{ t(`events.landing.features.${key}.body`) }}
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Images, Languages, Link2, MessageCircleReply, Ticket, Users } from 'lucide-vue-next'
import DesignCover from './DesignCover.vue'
import { FEATURE_GROUPS, type FeatureKey } from './landingContent'
import type { LandingDesign, LandingDesignStatus } from './landingDesigns'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = defineProps<{
  designs: LandingDesign[]
  status: LandingDesignStatus
}>()

const { t } = useAppLanguage()

const FEATURE_ICONS: Record<FeatureKey, Component> = {
  personal: Link2,
  bilingual: Languages,
  media: Images,
  rsvp: MessageCircleReply,
  guests: Users,
  tickets: Ticket,
}

/** Skeleton cards while the catalogue answers; nothing at all if it can't. */
const showVisual = computed(() => props.status !== 'empty')
</script>

<style scoped>
/* Hallmark · macrostructure: Narrative Workflow (below a Marquee Hero) · part: features diptych
 * design-system: DESIGN.md (slate · brand gradient · Figtree / Noto Serif Khmer) */

.features {
  padding-block: clamp(4.5rem, 12vh, 8rem) clamp(4rem, 10vh, 6.5rem);
  /* The cards are rotated; their corners must never scroll the page sideways.
     `clip`, not `hidden`, so the sticky visual still sticks. */
  overflow-x: clip;
}

.features__grid {
  display: grid;
  row-gap: 2.5rem;
}

.cover-stack {
  position: relative;
  width: min(62vw, 16rem);
  margin-inline: auto;
  /* Room for the back card to fan out to the left and for both cards' tilt,
     inside the stack's own box. */
  padding: 0.75rem 0.5rem 1.25rem 22%;
}

.cover-stack__front {
  position: relative;
  z-index: 1;
  rotate: 2.5deg;
}

.cover-stack__back {
  position: absolute;
  z-index: 0;
  top: 7%;
  left: 4%;
  width: 66%;
  rotate: -7deg;
  transform-origin: 100% 100%;
}

/*
 * The fan, by scroll. Below the fold the back card is tucked square behind the
 * front one, a single invitation; as the pair rises into view it slides out
 * and tilts away, and the one becomes a deck to choose from. Driven by the
 * stack's own pass through the screen, so it plays once on the way in and
 * backwards on the way out, and never moves unless the reader does.
 *
 * Keyframes give only the tucked state: the fanned one is the cards' resting
 * style above, so without scroll timelines (Firefox) or under reduced motion
 * the cards simply sit fanned. Strong ease-out over the range, so most of the
 * travel happens early and the cards settle rather than stop.
 *
 * The timeline is on the stack, not the sticky column around it: the stack has
 * fully entered before the column starts to stick, and a stuck box does not
 * move, which would freeze the timeline mid-fan.
 */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .cover-stack {
      view-timeline: --cover-stack block;
    }

    .cover-stack__back,
    .cover-stack__front {
      animation-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
      animation-fill-mode: both;
      animation-timeline: --cover-stack;
      /* From half visible to just past fully in view. The ease-out spends most
         of the travel early in the range, so a range that started lower ran
         the whole fan while the cards were still below the fold. */
      animation-range: entry 50% contain 30%;
    }

    .cover-stack__back {
      animation-name: stack-fan-back;
    }

    .cover-stack__front {
      animation-name: stack-fan-front;
    }
  }
}

/* Tucked: centred under the front card (the two boxes' centres are ~23% of the
   stack apart, which is ~35% of the back card's own width) and tilted with it. */
@keyframes stack-fan-back {
  from {
    translate: 35% -2%;
    rotate: 2.5deg;
  }
}

@keyframes stack-fan-front {
  from {
    rotate: 0deg;
  }
}

.feature-group + .feature-group {
  margin-top: 2.25rem;
}

.feature-list {
  margin-top: 0.75rem;
}

.feature {
  display: grid;
  grid-template-columns: 1.25rem minmax(0, 1fr);
  column-gap: 0.875rem;
}

.feature__icon {
  width: 1.125rem;
  height: 1.125rem;
  margin-top: 0.1875rem;
  color: rgb(100 116 139); /* slate-500 */
}

.feature__title {
  font-size: 1rem;
}

/* The guests' group: the main story, so a ruled list with room to breathe. */
.feature-group--forGuests .feature-list {
  border-top: 1px solid rgb(226 232 240); /* slate-200 */
}

.feature-group--forGuests .feature {
  padding-block: 1.125rem;
  border-bottom: 1px solid rgb(226 232 240);
}

/* The organizer's group: subordinate, so a quieter panel, two abreast once
   there is room — two short items do not need a row each. */
.feature-group--forYou {
  padding: 1.25rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 0 1px rgba(226, 232, 240, 0.8);
}

.feature-group--forYou .feature-list {
  display: grid;
  gap: 1.25rem;
}

@media (min-width: 640px) {
  .feature-group--forGuests .feature-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 2rem;
  }

  .feature__title {
    font-size: 1.125rem;
  }

  .feature-group--forYou {
    padding: 1.5rem;
  }

  .feature-group--forYou .feature-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 2rem;
  }
}

/* The diptych: covers left, words right. The covers span both rows and stick
   while the features scroll past them, so the invitation stays in view beside
   the list that describes it. */
@media (min-width: 1024px) {
  .features__grid {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    grid-template-areas:
      'visual head'
      'visual groups';
    grid-template-rows: auto 1fr;
    column-gap: clamp(3rem, 6vw, 6rem);
    row-gap: 2.25rem;
  }

  .features__head {
    grid-area: head;
  }

  .features__groups {
    grid-area: groups;
  }

  .features__visual {
    grid-area: visual;
    align-self: start;
    position: sticky;
    top: clamp(2rem, 8vh, 5rem);
  }

  .cover-stack {
    width: min(100%, 26rem);
  }

  .features--plain .features__grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'head'
      'groups';
  }
}
</style>
