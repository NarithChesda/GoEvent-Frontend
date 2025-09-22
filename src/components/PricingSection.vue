<template>
  <section id="pricing" class="py-24 relative overflow-hidden scroll-animate">
    <!-- Background elements -->
    <div class="absolute inset-0">
      <div
        class="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-[#E6F4FF]0/10 rounded-full blur-3xl"
      ></div>
      <div class="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div class="text-center mb-20">
        <div
          class="inline-flex items-center bg-[#B0E0E6] text-[#1873cc] text-sm font-medium px-4 py-2 rounded-full mb-6"
        >
          <Star class="h-4 w-4 mr-2" />
          Simple & Transparent
        </div>
        <h2 class="text-5xl font-bold text-slate-900 mb-6 leading-tight">
          Choose Your
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]"
            >Perfect Plan</span
          >
        </h2>
        <p class="text-xl text-slate-600 max-w-3xl mx-auto">
          Start free, upgrade when you need more. No hidden fees, cancel anytime.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e90ff]"
        ></div>
        <p class="text-slate-700 mt-4">Loading pricing plans...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center">
        <p class="text-red-500 mb-4">{{ error }}</p>
        <button
          @click="fetchPricingPlans"
          class="bg-[#1e90ff] hover:bg-[#1873cc] text-white px-6 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>

      <!-- Pricing Plans with Tabs -->
      <div v-else class="max-w-7xl mx-auto">
        <!-- Category Tabs (only show if more than one category) -->
        <div class="mb-12" v-if="Object.keys(categorizedPlans).length > 1">
          <div class="flex justify-center">
            <div class="max-w-full overflow-x-auto scrollbar-hide">
              <div
                class="inline-flex bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl p-1 shadow-lg min-w-min"
              >
                <button
                  v-for="categoryName in Object.keys(categorizedPlans)"
                  :key="categoryName"
                  @click="activeCategory = categoryName"
                  class="px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-300"
                  :class="
                    activeCategory === categoryName
                      ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md'
                      : 'text-slate-700 hover:text-[#1e90ff] hover:bg-white/50'
                  "
                >
                  {{ categoryName }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Plans Grid -->
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto justify-items-center"
        >
          <div
            v-for="plan in Object.keys(categorizedPlans).length === 1
              ? Object.values(categorizedPlans)[0]
              : categorizedPlans[activeCategory] || []"
            :key="plan.id"
            class="relative group w-full max-w-sm"
            :class="plan.is_best_seller ? 'lg:transform lg:scale-105 lg:z-10' : ''"
          >
            <!-- Best Seller Badge -->
            <div
              v-if="plan.is_best_seller"
              class="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20"
            >
              <div
                class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white px-6 py-2 rounded-full flex items-center gap-2 shadow-lg"
              >
                <Star class="w-4 h-4 fill-current" />
                <span class="text-sm font-bold uppercase tracking-wide">Best Seller</span>
              </div>
            </div>

            <!-- Card -->
            <div
              class="relative bg-white/90 backdrop-blur-sm border border-slate-200 rounded-3xl shadow-xl h-[620px] flex flex-col group-hover:bg-white/95 transition-all duration-300"
              :class="
                plan.is_best_seller
                  ? 'border-purple-300 shadow-2xl bg-white/95 shadow-purple-500/20'
                  : ''
              "
            >
              <!-- Plan header - Fixed height -->
              <div class="text-center p-8 pb-6">
                <h4 class="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
                  {{ plan.name }}
                </h4>
                <div class="mb-4">
                  <div class="flex items-baseline justify-center gap-1">
                    <span class="text-xl font-bold text-slate-600">$</span>
                    <span
                      class="text-5xl font-bold leading-none"
                      :class="
                        plan.is_best_seller
                          ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]'
                          : 'text-slate-900'
                      "
                      >{{ parseFloat(plan.price).toFixed(0) }}</span
                    >
                  </div>
                </div>
                <p class="text-slate-600 text-base leading-relaxed">{{ plan.description }}</p>
              </div>

              <!-- Divider -->
              <div
                class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-8 mb-6"
              ></div>

              <!-- Features section - Fixed height with scroll -->
              <div class="px-8 flex-1">
                <h5
                  class="text-slate-700 font-medium text-sm uppercase tracking-wider mb-4 flex items-center"
                >
                  <div
                    class="w-2 h-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-full mr-2"
                  ></div>
                  What's Included
                </h5>
                <div
                  class="h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent pr-2"
                >
                  <ul class="space-y-3">
                    <li
                      v-for="feature in plan.features"
                      :key="feature"
                      class="flex items-start text-slate-700"
                    >
                      <div
                        class="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-full flex items-center justify-center mr-3 mt-0.5 shadow-lg shadow-emerald-500/25"
                      >
                        <Check class="w-3 h-3 text-white stroke-2" />
                      </div>
                      <span class="text-sm leading-relaxed font-medium">{{ feature }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- CTA Button - Fixed at bottom -->
              <div class="p-8 pt-6">
                <RouterLink
                  to="/signup"
                  class="w-full text-center block py-4 px-8 rounded-xl font-bold text-base transition-all duration-300 transform hover:scale-105 shadow-lg"
                  :class="
                    plan.is_best_seller
                      ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white shadow-emerald-500/25'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                  "
                >
                  {{ plan.is_best_seller ? 'Choose This Plan' : 'Select Plan' }}
                </RouterLink>
              </div>

              <!-- Enhanced hover effect -->
              <div
                class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-sky-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              ></div>

              <!-- Best seller glow effect -->
              <div
                v-if="plan.is_best_seller"
                class="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-sky-500/10 rounded-3xl pointer-events-none"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom guarantee -->
      <div class="text-center mt-16">
        <div
          class="inline-flex items-center bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl px-8 py-4 shadow-lg"
        >
          <Shield class="h-6 w-6 text-green-500 mr-3" />
          <span class="text-slate-700 font-medium text-lg">30-day money-back guarantee</span>
          <div class="w-px h-6 bg-slate-200 mx-6"></div>
          <span class="text-slate-500">No setup fees • Cancel anytime</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Star, Check, Shield } from 'lucide-vue-next'
import { apiService, type PaginatedResponse } from '@/services/api'

interface Category {
  id: number
  name: string
  description: string
  color: string
  icon: string
  is_active: boolean
  created_by: number
  created_by_name: string
  created_at: string
}

interface PricingPlan {
  id: number
  name: string
  description: string
  price: string
  commission: string
  features: string[]
  is_active: boolean
  is_best_seller: boolean
  category: Category | number // Can be either object or number for backward compatibility
  created_at: string
  updated_at: string
}

const loading = ref(false)
const error = ref<string | null>(null)
const pricingPlans = ref<PricingPlan[]>([])
const activeCategory = ref<string>('')

const categorizedPlans = computed(() => {
  const categories: Record<string, PricingPlan[]> = {}

  pricingPlans.value
    .filter((plan) => plan.is_active)
    .forEach((plan) => {
      // Use category name from API if available, otherwise fallback to category ID
      let categoryName: string
      if (typeof plan.category === 'object' && plan.category !== null && plan.category.name) {
        categoryName = plan.category.name
      } else {
        // Fallback for backward compatibility
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

  return categories
})

// Watch for changes in categorized plans and set active category
watch(
  categorizedPlans,
  (newCategories) => {
    const categories = Object.keys(newCategories)
    if (categories.length > 0 && !activeCategory.value) {
      activeCategory.value = categories[0]
    }
  },
  { immediate: true },
)

const fetchPricingPlans = async () => {
  loading.value = true
  error.value = null

  try {
    // Try to fetch from API, but handle authentication errors gracefully
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}/api/core-data/pricing-plans/`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Don't include auth headers for public pricing data
        },
      },
    )

    if (response.ok) {
      const data = await response.json()
      // Handle both paginated and direct array responses
      pricingPlans.value = 'results' in data ? data.results : (data as unknown as PricingPlan[])
    } else if (response.status === 401) {
      // Authentication required - use fallback data
      console.log('Pricing endpoint requires authentication, using fallback data')
      throw new Error('Authentication required')
    } else {
      throw new Error('Failed to fetch pricing plans')
    }
  } catch (err) {
    console.error('Error fetching pricing plans:', err)
    // Don't show error to user, just use fallback data
    error.value = null

    // Fallback to static data
    pricingPlans.value = [
      {
        id: 1,
        name: 'Basic',
        description: 'Perfect for small events and beginners',
        price: '100.00',
        commission: '10.00',
        features: [
          'Up to 100 guests',
          'Basic event planning tools',
          'Email invitations',
          'RSVP tracking',
          'Basic analytics',
        ],
        category: {
          id: 5,
          name: 'Wedding',
          description: 'Wedding events',
          color: '#9b59b6',
          icon: 'fas fa-palette',
          is_active: true,
          created_by: 1,
          created_by_name: 'admin',
          created_at: new Date().toISOString(),
        },
        is_best_seller: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Standard',
        description: 'Most popular choice for regular organizers',
        price: '300.00',
        commission: '30.00',
        features: [
          'Up to 500 guests',
          'Advanced planning tools',
          'Custom branding',
          'Multiple event types',
          'Advanced analytics',
          'Priority support',
        ],
        category: {
          id: 5,
          name: 'Wedding',
          description: 'Wedding events',
          color: '#9b59b6',
          icon: 'fas fa-palette',
          is_active: true,
          created_by: 1,
          created_by_name: 'admin',
          created_at: new Date().toISOString(),
        },
        is_best_seller: true,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 3,
        name: 'Premium',
        description: 'For large organizations and agencies',
        price: '600.00',
        commission: '60.00',
        features: [
          'Unlimited guests',
          'White-label solution',
          'API access',
          'Custom integrations',
          'Dedicated account manager',
          '24/7 phone support',
        ],
        category: {
          id: 5,
          name: 'Wedding',
          description: 'Wedding events',
          color: '#9b59b6',
          icon: 'fas fa-palette',
          is_active: true,
          created_by: 1,
          created_by_name: 'admin',
          created_at: new Date().toISOString(),
        },
        is_best_seller: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchPricingPlans()
  // Set the first category as active by default
  const categories = Object.keys(categorizedPlans.value)
  if (categories.length > 0) {
    activeCategory.value = categories[0]
  }
})
</script>

<style scoped>
/* Hide scrollbar but keep scroll functionality */
.scrollbar-hide {
  -ms-overflow-style: none; /* Internet Explorer 10+ */
  scrollbar-width: none; /* Firefox */
}
.scrollbar-hide::-webkit-scrollbar {
  display: none; /* Safari and Chrome */
}

/* Custom scrollbar for features section */
.scrollbar-thin {
  scrollbar-width: thin;
}
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Enhanced scrollbar styles */
.scrollbar-thin::-webkit-scrollbar {
  width: 8px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.15));
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.25));
}

/* Responsive grid improvements */
@media (max-width: 768px) {
  .grid-cols-1 {
    gap: 1.5rem;
  }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .md\:grid-cols-2 > div {
    max-width: none;
  }
}

/* Animation for best seller badge */
@keyframes gentle-pulse {
  0%,
  100% {
    transform: translateX(-50%) scale(1);
  }
  50% {
    transform: translateX(-50%) scale(1.05);
  }
}
</style>
