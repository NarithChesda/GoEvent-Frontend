<template>
  <section id="pricing" class="py-24 lg:py-18 2xl:py-24 relative overflow-hidden scroll-animate">
    <!-- Background elements -->
    <div class="absolute inset-0">
      <div
        class="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 lg:w-72 lg:h-72 2xl:w-96 2xl:h-96 bg-emerald-100/20 rounded-full blur-3xl"
      ></div>
      <div class="absolute bottom-0 right-0 w-72 h-72 lg:w-54 lg:h-54 2xl:w-72 2xl:h-72 bg-sky-100/20 rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div class="text-center mb-12 sm:mb-16 lg:mb-9 2xl:mb-16">
        <h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-4xl 2xl:text-5xl font-bold text-slate-900 mb-8 sm:mb-10 lg:mb-6 2xl:mb-10 leading-tight px-4">
          Choose Your
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]">
            Perfect Plan
          </span>
        </h2>

        <!-- Category Toggle (Personal/Business) -->
        <div class="mb-12 lg:mb-9 2xl:mb-12" v-if="Object.keys(categorizedPlans).length > 1">
          <div class="flex justify-center">
            <div class="inline-flex bg-white rounded-full p-1 lg:p-0.5 2xl:p-1 border-2 lg:border 2xl:border-2 border-slate-200">
              <button
                v-for="categoryName in Object.keys(categorizedPlans)"
                :key="categoryName"
                @click="activeCategory = categoryName"
                class="px-6 py-2.5 lg:px-4.5 lg:py-2 2xl:px-6 2xl:py-2.5 rounded-full font-medium text-sm lg:text-xs 2xl:text-sm transition-all duration-300 relative overflow-hidden"
                :class="
                  activeCategory === categoryName
                    ? 'text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-50'
                "
              >
                <span
                  v-if="activeCategory === categoryName"
                  class="absolute inset-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-full"
                ></span>
                <span class="relative z-10">{{ categoryName }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 lg:h-6 lg:w-6 2xl:h-8 2xl:w-8 border-b-2 border-[#1e90ff]"
        ></div>
        <p class="text-slate-700 mt-4 lg:mt-3 lg:text-sm 2xl:mt-4 2xl:text-base">Loading pricing plans...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center">
        <p class="text-red-500 mb-4 lg:mb-3 lg:text-sm 2xl:mb-4 2xl:text-base">{{ error }}</p>
        <button
          @click="fetchPricingPlans"
          class="bg-[#1e90ff] hover:bg-[#1873cc] text-white px-6 py-2 lg:px-4.5 lg:py-1.5 lg:text-sm 2xl:px-6 2xl:py-2 2xl:text-base rounded-lg"
        >
          Retry
        </button>
      </div>

      <!-- Pricing Plans Grid -->
      <div v-else class="max-w-7xl mx-auto">
        <div
          ref="plansContainer"
          class="flex md:grid overflow-x-auto md:overflow-x-visible md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-6 2xl:gap-8 max-w-7xl mx-auto md:justify-items-center items-start pb-4 md:pb-0 pt-4 snap-x snap-mandatory md:snap-none scrollbar-hide"
        >
          <div
            v-for="plan in Object.keys(categorizedPlans).length === 1
              ? Object.values(categorizedPlans)[0]
              : categorizedPlans[activeCategory] || []"
            :key="plan.id"
            class="relative group w-[85vw] md:w-full flex-shrink-0 md:flex-shrink max-w-sm lg:max-w-xs 2xl:max-w-sm snap-center md:snap-align-none"
          >
            <!-- Best Seller Badge -->
            <div
              v-if="plan.is_best_seller"
              class="absolute -top-3 sm:-top-4 lg:-top-2.5 2xl:-top-4 left-1/2 transform -translate-x-1/2 z-20"
            >
              <div
                class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white px-4 py-2 lg:px-3 lg:py-1.5 2xl:px-4 2xl:py-2 rounded-full flex items-center gap-2 lg:gap-1.5 2xl:gap-2"
              >
                <svg class="w-4 h-4 lg:w-3 lg:h-3 2xl:w-4 2xl:h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span class="text-sm lg:text-xs 2xl:text-sm font-bold uppercase tracking-wide">Best Seller</span>
              </div>
            </div>

            <!-- Card -->
            <div
              class="plan-card relative backdrop-blur-sm rounded-2xl md:rounded-3xl lg:rounded-2xl 2xl:rounded-3xl h-full flex flex-col p-6 md:p-8 lg:p-6 2xl:p-8"
              :class="
                plan.is_best_seller
                  ? 'bg-white/95 border-2 lg:border-[1.5px] 2xl:border-2 border-emerald-300 group-hover:bg-white'
                  : 'bg-white/90 border lg:border-[0.5px] 2xl:border border-slate-200 group-hover:bg-white/95'
              "
            >
              <!-- Plan name and price -->
              <div class="mb-4 lg:mb-3 2xl:mb-4">
                <h4 class="text-2xl md:text-3xl lg:text-2xl 2xl:text-3xl font-bold text-slate-900 mb-4 lg:mb-3 2xl:mb-4">
                  {{ plan.name }}
                </h4>
                <div class="mb-2 lg:mb-1.5 2xl:mb-2">
                  <div class="flex items-baseline gap-1 lg:gap-0.5 2xl:gap-1">
                    <span class="text-lg lg:text-base 2xl:text-lg font-normal text-slate-600">$</span>
                    <span
                      class="text-5xl md:text-6xl lg:text-[45px] 2xl:text-6xl font-normal leading-none"
                      :class="
                        plan.is_best_seller
                          ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]'
                          : 'text-slate-900'
                      "
                    >
                      {{ parseFloat(plan.price).toFixed(0) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- CTA Button -->
              <div class="mb-5 lg:mb-3.5 2xl:mb-5">
                <a
                  href="https://t.me/goeventkh"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="plan-cta w-full py-3 px-6 lg:py-2.5 lg:px-4.5 2xl:py-3 2xl:px-6 rounded-full font-semibold text-base lg:text-sm 2xl:text-base flex items-center justify-center gap-2 lg:gap-1.5 2xl:gap-2"
                  :class="
                    plan.is_best_seller
                      ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:opacity-90 text-white'
                      : plan.price === '0.00'
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border lg:border-[0.5px] 2xl:border border-slate-300'
                      : 'bg-white hover:bg-slate-50 text-slate-900 border-2 lg:border-[1.5px] 2xl:border-2 border-slate-900'
                  "
                >
                  {{
                    plan.price === '0.00'
                      ? 'Get Started Free'
                      : plan.is_best_seller
                      ? 'Get Started'
                      : 'Contact Us'
                  }}
                  <svg class="w-5 h-5 lg:w-4 lg:h-4 2xl:w-5 2xl:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.122.098.155.231.171.325.016.094.036.308.02.475z"/>
                  </svg>
                </a>
              </div>

              <!-- Features section.

                   The card draws feature **titles** only and keeps the
                   explaining half one tap away. The two halves come from one
                   backend string (`title — description`, see planFeatures.ts);
                   drawing both inline ran a ten-feature plan past three
                   screens and left the short plans beside it as a column of
                   white. The title is written to stand alone — it is the only
                   half every compact in-app surface draws — and the sentence
                   is what a buyer reads *after* a title has caught them, not
                   while scanning three plans against each other.

                   Tap, not hover: most of this page's traffic is the phone
                   carousel above, which has no hover, and a row that opens
                   under a moving cursor reflows the list the reader is
                   scanning. One row open per card, so the card can never grow
                   back into the wall this replaced.

                   Hierarchy is weight + slate value, never a second colour —
                   the card already spends the page's gradient on its price and
                   its CTA. -->
              <div class="flex-1 min-h-0">
                <ul class="feat-list">
                  <li v-for="(feature, index) in featuresByPlan[plan.id] || []" :key="index">
                    <component
                      :is="feature.description ? 'button' : 'div'"
                      :type="feature.description ? 'button' : undefined"
                      :aria-expanded="feature.description ? isFeatureOpen(plan.id, index) : undefined"
                      :aria-controls="feature.description ? `plan-${plan.id}-feat-${index}` : undefined"
                      class="feat-row"
                      :class="{ 'feat-row--pressable': feature.description }"
                      @click="feature.description && toggleFeature(plan.id, index)"
                    >
                      <Check class="feat-row__check" aria-hidden="true" />
                      <span class="feat-row__title">{{ feature.title }}</span>
                      <ChevronDown
                        v-if="feature.description"
                        class="feat-row__caret"
                        :data-open="isFeatureOpen(plan.id, index)"
                        aria-hidden="true"
                      />
                    </component>

                    <!-- Always mounted, clipped to a 0fr track when closed:
                         the sentence stays in the document for crawlers, and
                         the open/close eases evenly in both directions the way
                         a max-height never does. -->
                    <div
                      v-if="feature.description"
                      :id="`plan-${plan.id}-feat-${index}`"
                      class="feat-detail"
                      :data-open="isFeatureOpen(plan.id, index)"
                      :aria-hidden="!isFeatureOpen(plan.id, index)"
                    >
                      <div class="feat-detail__inner">
                        <!-- leading-relaxed, not the scale's default: Khmer
                             stacks diacritics above and coeng subscripts below,
                             and clips at a tighter leading. -->
                        <p class="feat-detail__text">{{ feature.description }}</p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              <!-- Footer notes for all plans -->
              <div class="mt-6 pt-6 lg:mt-4 lg:pt-4 2xl:mt-6 2xl:pt-6 border-t lg:border-t-[0.5px] 2xl:border-t border-slate-200 flex-shrink-0">
                <p class="text-xs lg:text-[10px] 2xl:text-xs text-slate-500 text-center lg:leading-tight 2xl:leading-normal">
                  <template v-if="plan.price === '0.00'">
                    Perfect to get started. <a :href="plan.description || 'https://api.goevent.online/api/events/ff726c4d-9356-4350-bc48-930b93a2a812/meta/?guest_name=%E1%9E%97%E1%9F%92%E1%9E%89%E1%9F%80%E1%9E%9C%E1%9E%80%E1%9E%B7%E1%9E%8F%E1%9F%92%E1%9E%8F%E1%9E%B7%E1%9E%99%E1%9E%9F&lang=kh'" class="underline hover:text-slate-700 font-medium">See what's possible</a>
                  </template>
                  <template v-else>
                    Want to see it in action? <a :href="plan.description || 'https://api.goevent.online/api/events/ff726c4d-9356-4350-bc48-930b93a2a812/meta/?guest_name=%E1%9E%97%E1%9F%92%E1%9E%89%E1%9F%80%E1%9E%9C%E1%9E%80%E1%9E%B7%E1%9E%8F%E1%9F%92%E1%9E%8F%E1%9E%B7%E1%9E%99%E1%9E%9F&lang=kh'" class="underline hover:text-slate-700 font-medium">Try our demo</a>
                  </template>
                </p>
              </div>

              <!-- Enhanced hover effect overlay -->
              <div
                class="plan-card__sheen absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-sky-500/5 rounded-2xl md:rounded-3xl lg:rounded-2xl 2xl:rounded-3xl pointer-events-none"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Check, ChevronDown } from 'lucide-vue-next'
import { FALLBACK_PRICING_PLANS, type PricingPlan } from '@/constants/pricingFallback'
import { parsePlanFeature, type PlanFeature } from '@/utils/planFeatures'

const loading = ref(false)
const error = ref<string | null>(null)
const pricingPlans = ref<PricingPlan[]>([])
const activeCategory = ref<string>('Wedding')
const plansContainer = ref<HTMLElement | null>(null)

/**
 * Each plan's feature lines, split into their two halves once — not per
 * render, since expanding a row re-renders the whole grid.
 *
 * Blank lines are dropped here rather than in the template: the backend field
 * is a newline-separated textarea, so a trailing newline arrives as an empty
 * feature and used to draw a tick with nothing beside it.
 */
const featuresByPlan = computed(() => {
  const byPlan: Record<number, PlanFeature[]> = {}

  pricingPlans.value.forEach((plan) => {
    byPlan[plan.id] = (plan.features ?? [])
      .map(parsePlanFeature)
      .filter((feature) => feature.title.length > 0)
  })

  return byPlan
})

/**
 * The one open feature row per card, by plan id. Per card rather than per
 * section so two plans can be read side by side, and one at a time so the
 * card's height stays bounded — the whole point of collapsing them.
 */
const openFeature = ref<Record<number, number | null>>({})

const isFeatureOpen = (planId: number, index: number) => openFeature.value[planId] === index

const toggleFeature = (planId: number, index: number) => {
  openFeature.value = {
    ...openFeature.value,
    [planId]: openFeature.value[planId] === index ? null : index,
  }
}

const categorizedPlans = computed(() => {
  const categories: Record<string, PricingPlan[]> = {}

  pricingPlans.value
    .filter((plan) => plan.is_active)
    .forEach((plan) => {
      let categoryName: string
      if (typeof plan.category === 'object' && plan.category !== null && plan.category.name) {
        categoryName = plan.category.name
      } else {
        categoryName = `Category ${plan.category}`
      }

      if (!categories[categoryName]) {
        categories[categoryName] = []
      }
      categories[categoryName].push(plan)
    })

  // Sort plans within each category by price
  Object.keys(categories).forEach((category) => {
    categories[category].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
  })

  // Sort categories to ensure Wedding comes before Birthday
  const sortedCategories: Record<string, PricingPlan[]> = {}
  const categoryOrder = ['Wedding', 'Birthday']

  // Add categories in preferred order first
  categoryOrder.forEach(cat => {
    if (categories[cat]) {
      sortedCategories[cat] = categories[cat]
    }
  })

  // Add any remaining categories
  Object.keys(categories).forEach(cat => {
    if (!categoryOrder.includes(cat)) {
      sortedCategories[cat] = categories[cat]
    }
  })

  return sortedCategories
})

watch(
  categorizedPlans,
  (newCategories) => {
    const categories = Object.keys(newCategories)
    if (categories.length > 0) {
      // Only set if current category doesn't exist in the new categories
      if (!categories.includes(activeCategory.value)) {
        activeCategory.value = categories[0]
      }
    }
  },
  { immediate: true },
)

// A card left with a row open in a category the reader has switched away from
// would silently change height on the way back.
watch(activeCategory, () => {
  openFeature.value = {}
})

const fetchPricingPlans = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}/api/core-data/pricing-plans/`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (response.ok) {
      const data = await response.json()
      pricingPlans.value = 'results' in data ? data.results : (data as unknown as PricingPlan[])
    } else if (response.status === 401) {
      console.log('Pricing endpoint requires authentication, using fallback data')
      throw new Error('Authentication required')
    } else {
      throw new Error('Failed to fetch pricing plans')
    }
  } catch (err) {
    console.error('Error fetching pricing plans:', err)
    error.value = null

    // Last-known-good copy of the live plans, so a failed fetch still shows
    // the real offer. Kept in src/constants/pricingFallback.ts next to the
    // note about keeping it in step with Admin → Pricing Plans.
    pricingPlans.value = FALLBACK_PRICING_PLANS
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchPricingPlans()
  const categories = Object.keys(categorizedPlans.value)
  if (categories.length > 0) {
    // Set to Wedding if it exists, otherwise use first category
    if (categories.includes('Wedding')) {
      activeCategory.value = 'Wedding'
    } else {
      activeCategory.value = categories[0]
    }
  }
})
</script>

<style scoped>
/* Hide scrollbar but keep scroll functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* ---------------------------------------------------------------------------
 * Card and CTA
 * -------------------------------------------------------------------------*/

.plan-card {
  transition:
    background-color 200ms ease,
    border-color 200ms ease;
}

.plan-card__sheen {
  opacity: 0;
  transition: opacity 200ms ease;
}

/* Gated on a real pointer for the same reason the feature rows are: a tap on
 * the phone carousel would otherwise leave one card lit. */
@media (hover: hover) and (pointer: fine) {
  .group:hover .plan-card__sheen {
    opacity: 1;
  }
}

.plan-cta {
  transition:
    opacity 200ms ease,
    background-color 200ms ease,
    transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}

/* The card is the only thing on this page a visitor is asked to press; it has
 * to answer. */
.plan-cta:active {
  transform: scale(0.97);
}

/* ---------------------------------------------------------------------------
 * Feature rows
 *
 * The `<ul>` pulls its own row padding back out so the tick still sits on the
 * card's content edge; the padding exists to give the tap target height a row
 * of 13px text does not have on its own.
 * -------------------------------------------------------------------------*/

.feat-list {
  margin-inline: -0.5rem;
}

.feat-row {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.4375rem 0.5rem;
  border: 0;
  border-radius: 0.625rem;
  background: transparent;
  text-align: start;
  color: inherit;
  font: inherit;
  transition: background-color 150ms ease;
}

.feat-row--pressable {
  cursor: pointer;
}

.feat-row:focus-visible {
  outline: 2px solid #1e90ff;
  outline-offset: 1px;
}

/* The open row stays marked on every device. Hover is gated on a real pointer
 * on top of it: on the phone carousel a `:hover` rule would latch on after a
 * tap and leave a *closed* row looking picked. */
.feat-row[aria-expanded='true'] {
  background-color: rgb(248 250 252); /* slate-50 */
}

@media (hover: hover) and (pointer: fine) {
  .feat-row--pressable:hover {
    background-color: rgb(248 250 252); /* slate-50 */
  }
  .feat-row--pressable:hover .feat-row__caret {
    color: rgb(100 116 139); /* slate-500 */
  }
}

.feat-row__check {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
  color: rgb(5 150 105); /* emerald-600 */
}

.feat-row__title {
  min-width: 0;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.375;
  color: rgb(15 23 42); /* slate-900 */
}

/* Quiet on purpose: ten of these run down the longest card, and a caret that
 * competes with the tick turns the list into two columns of chrome. */
.feat-row__caret {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  margin-top: 0.1875rem;
  margin-inline-start: auto;
  color: rgb(203 213 225); /* slate-300 */
  transition:
    transform 200ms cubic-bezier(0.23, 1, 0.32, 1),
    color 150ms ease;
}

.feat-row__caret[data-open='true'] {
  transform: rotate(180deg);
  color: rgb(100 116 139); /* slate-500 */
}

/* ---------------------------------------------------------------------------
 * The description, as a grid-row collapse — same mechanism as SignInCard's,
 * which eases evenly in both directions where a max-height cannot. The inner
 * wrapper carries the fade so the sentence arrives with the box instead of
 * being squeezed out of a shrinking one. Closing is faster than opening: the
 * reader has already decided.
 * -------------------------------------------------------------------------*/

.feat-detail {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms cubic-bezier(0.4, 0, 0.6, 1);
}

.feat-detail[data-open='true'] {
  grid-template-rows: 1fr;
  transition: grid-template-rows 280ms cubic-bezier(0.32, 0.72, 0, 1);
}

.feat-detail__inner {
  overflow: hidden;
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity 140ms ease,
    transform 200ms cubic-bezier(0.4, 0, 0.6, 1);
}

.feat-detail[data-open='true'] .feat-detail__inner {
  opacity: 1;
  transform: none;
  transition:
    opacity 220ms ease 60ms,
    transform 280ms cubic-bezier(0.32, 0.72, 0, 1);
}

.feat-detail__text {
  /* line-height 1.7, not the scale's default: Khmer stacks diacritics above
     and coeng subscripts below, and clips at a tighter leading. */
  /* Right stop is the caret column's leading edge (caret + row padding), so a
     long sentence keeps the margin the titles above it keep. */
  padding: 0.125rem 1.375rem 0.5rem calc(1rem + 0.625rem);
  font-size: 0.75rem;
  line-height: 1.7;
  color: rgb(71 85 105); /* slate-600 */
}

@media (min-width: 1024px) {
  .feat-row {
    gap: 0.5rem;
    padding-block: 0.375rem;
  }
  .feat-row__check {
    width: 0.875rem;
    height: 0.875rem;
  }
  .feat-row__title {
    font-size: 0.8125rem;
  }
  .feat-detail__text {
    padding-left: calc(0.875rem + 0.5rem);
    font-size: 0.6875rem;
  }
}

@media (min-width: 1536px) {
  .feat-row {
    gap: 0.625rem;
    padding-block: 0.4375rem;
  }
  .feat-row__check {
    width: 1rem;
    height: 1rem;
  }
  .feat-row__title {
    font-size: 0.875rem;
  }
  .feat-detail__text {
    padding-left: calc(1rem + 0.625rem);
    font-size: 0.75rem;
  }
}

/* Reduced motion keeps the disclosure — it carries meaning — and drops the
 * travel. */
@media (prefers-reduced-motion: reduce) {
  .feat-detail,
  .feat-detail[data-open='true'],
  .feat-detail__inner,
  .feat-detail[data-open='true'] .feat-detail__inner {
    transition-duration: 1ms;
  }
  .feat-detail__inner {
    transform: none;
  }
  .feat-row__caret {
    transition-property: color;
  }
  .plan-cta:active {
    transform: none;
  }
}
</style>
