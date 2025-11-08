<template>
  <section id="pricing" class="py-24 relative overflow-hidden scroll-animate">
    <!-- Background elements -->
    <div class="absolute inset-0">
      <div
        class="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-emerald-100/20 rounded-full blur-3xl"
      ></div>
      <div class="absolute bottom-0 right-0 w-72 h-72 bg-sky-100/20 rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <div class="text-center mb-12 sm:mb-16">
        <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-8 sm:mb-10 leading-tight px-4">
          Choose Your
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]">
            Perfect Plan
          </span>
        </h2>

        <!-- Category Toggle (Personal/Business) -->
        <div class="mb-12" v-if="Object.keys(categorizedPlans).length > 1">
          <div class="flex justify-center">
            <div class="inline-flex bg-white rounded-full p-1 border-2 border-slate-200">
              <button
                v-for="categoryName in Object.keys(categorizedPlans)"
                :key="categoryName"
                @click="activeCategory = categoryName"
                class="px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 relative overflow-hidden"
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

      <!-- Pricing Plans Grid -->
      <div v-else class="max-w-7xl mx-auto">
        <div
          ref="plansContainer"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto justify-items-center"
        >
          <div
            v-for="plan in Object.keys(categorizedPlans).length === 1
              ? Object.values(categorizedPlans)[0]
              : categorizedPlans[activeCategory] || []"
            :key="plan.id"
            class="relative group w-full max-w-sm"
          >
            <!-- Best Seller Badge -->
            <div
              v-if="plan.is_best_seller"
              class="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 z-20"
            >
              <div
                class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg"
              >
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span class="text-sm font-bold uppercase tracking-wide">Best Seller</span>
              </div>
            </div>

            <!-- Card -->
            <div
              class="relative backdrop-blur-sm rounded-2xl md:rounded-3xl h-full flex flex-col transition-all duration-300 p-6 md:p-8"
              :class="
                plan.is_best_seller
                  ? 'bg-white/95 border-2 border-emerald-300 shadow-2xl shadow-emerald-500/20 group-hover:bg-white'
                  : 'bg-white/90 border border-slate-200 shadow-xl group-hover:bg-white/95'
              "
            >
              <!-- Plan name and price -->
              <div class="mb-4">
                <h4 class="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                  {{ plan.name }}
                </h4>
                <div class="mb-2">
                  <div class="flex items-baseline gap-1">
                    <span class="text-lg font-normal text-slate-600">$</span>
                    <span
                      class="text-5xl md:text-6xl font-normal leading-none"
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
              <div class="mb-5">
                <a
                  href="https://t.me/goeventkh"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="w-full py-3 px-6 rounded-full font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2"
                  :class="
                    plan.is_best_seller
                      ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:opacity-90 text-white shadow-lg'
                      : plan.price === '0.00'
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      : 'bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900'
                  "
                >
                  {{
                    plan.price === '0.00'
                      ? 'Get Started Free'
                      : plan.is_best_seller
                      ? 'Get Started'
                      : 'Contact Us'
                  }}
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.122.098.155.231.171.325.016.094.036.308.02.475z"/>
                  </svg>
                </a>
              </div>

              <!-- Features section -->
              <div class="flex-1 flex flex-col min-h-0">
                <div class="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                  <ul class="space-y-4">
                    <li
                      v-for="feature in plan.features"
                      :key="feature"
                      class="flex items-start text-slate-700"
                    >
                      <div class="flex-shrink-0 mr-3 mt-0.5">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span class="text-sm leading-relaxed">{{ feature }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Footer notes for all plans -->
              <div class="mt-6 pt-6 border-t border-slate-200 flex-shrink-0">
                <p class="text-xs text-slate-500 text-center">
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
                class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-sky-500/5 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
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
  category: Category | number
  created_at: string
  updated_at: string
}

const loading = ref(false)
const error = ref<string | null>(null)
const pricingPlans = ref<PricingPlan[]>([])
const activeCategory = ref<string>('Wedding')
const plansContainer = ref<HTMLElement | null>(null)

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

    // Fallback to static data matching the screenshot
    pricingPlans.value = [
      {
        id: 1,
        name: 'Free',
        description: 'https://api.goevent.online/api/events/ff726c4d-9356-4350-bc48-930b93a2a812/meta/?guest_name=%E1%9E%97%E1%9F%92%E1%9E%89%E1%9F%80%E1%9E%9C%E1%9E%80%E1%9E%B7%E1%9E%8F%E1%9F%92%E1%9E%8F%E1%9E%B7%E1%9E%99%E1%9E%9F&lang=kh',
        price: '0.00',
        commission: '0.00',
        features: [
          'Get simple explanations',
          'Have short chats for common questions',
          'Try out image generation',
          'Save limited memory and context',
        ],
        category: {
          id: 1,
          name: 'Personal',
          description: 'Personal plans',
          color: '#6366f1',
          icon: 'user',
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
        name: 'Go',
        description: 'https://api.goevent.online/api/events/ff726c4d-9356-4350-bc48-930b93a2a812/meta/?guest_name=%E1%9E%97%E1%9F%92%E1%9E%89%E1%9F%80%E1%9E%9C%E1%9E%80%E1%9E%B7%E1%9E%8F%E1%9F%92%E1%9E%8F%E1%9E%B7%E1%9E%99%E1%9E%9F&lang=kh',
        price: '5.00',
        commission: '0.00',
        features: [
          'Go deep on harder questions',
          'Chat longer and upload more content',
          'Make realistic images for your projects',
          'Store more context for smarter replies',
          'Get help with planning and tasks',
          'Explore projects, tasks, and custom GPTs',
        ],
        category: {
          id: 1,
          name: 'Personal',
          description: 'Personal plans',
          color: '#6366f1',
          icon: 'user',
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
        name: 'Plus',
        description: 'https://api.goevent.online/api/events/ff726c4d-9356-4350-bc48-930b93a2a812/meta/?guest_name=%E1%9E%97%E1%9F%92%E1%9E%89%E1%9F%80%E1%9E%9C%E1%9E%80%E1%9E%B7%E1%9E%8F%E1%9F%92%E1%9E%8F%E1%9E%B7%E1%9E%99%E1%9E%9F&lang=kh',
        price: '20.00',
        commission: '0.00',
        features: [
          'Solve complex problems',
          'Have long chats over multiple sessions',
          'Create more images, faster',
          'Remember goals and past conversations',
          'Plan travel and tasks with agent mode',
          'Organize projects and customize GPTs',
          'Produce and share videos on Sora',
          'Write code and build apps with Codex',
        ],
        category: {
          id: 1,
          name: 'Personal',
          description: 'Personal plans',
          color: '#6366f1',
          icon: 'user',
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
        id: 4,
        name: 'Pro',
        description: 'https://api.goevent.online/api/events/ff726c4d-9356-4350-bc48-930b93a2a812/meta/?guest_name=%E1%9E%97%E1%9F%92%E1%9E%89%E1%9F%80%E1%9E%9C%E1%9E%80%E1%9E%B7%E1%9E%8F%E1%9F%92%E1%9E%8F%E1%9E%B7%E1%9E%99%E1%9E%9F&lang=kh',
        price: '200.00',
        commission: '0.00',
        features: [
          'Master advanced tasks and topics',
          'Tackle big projects with unlimited messages',
          'Create high-quality images at any scale',
          'Keep full context with maximum memory',
          'Run research and plan tasks with agents',
          'Scale your projects and automate workflows',
          'Expand your limits with Sora video creation',
          'Deploy code faster with Codex',
          'Get early access to experimental features',
        ],
        category: {
          id: 1,
          name: 'Personal',
          description: 'Personal plans',
          color: '#6366f1',
          icon: 'user',
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
</style>
