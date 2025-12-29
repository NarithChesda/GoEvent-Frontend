<template>
  <div class="px-4 -mt-6 mb-6 relative z-10">
    <div class="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
      <!-- Tabs (only show if item donations are available) -->
      <div v-if="hasItemDonations" class="border-b border-slate-200">
        <div class="flex">
          <button
            @click="activeTab = 'cash'"
            class="flex-1 px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2"
            :class="activeTab === 'cash' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'"
          >
            <Banknote class="w-4 h-4" />
            Money
          </button>
          <button
            @click="activeTab = 'item'"
            class="flex-1 px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2"
            :class="activeTab === 'item' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'"
          >
            <Gift class="w-4 h-4" />
            Items
          </button>
        </div>
      </div>

      <!-- Cash Donations Tab Content -->
      <div v-if="activeTab === 'cash'" class="p-4">
        <!-- Amount Raised -->
        <div class="mb-4">
          <div class="flex items-baseline gap-2 mb-1">
            <span class="text-2xl md:text-3xl font-bold text-slate-900">
              {{ formattedTotalRaised }}
            </span>
            <span class="text-sm text-slate-500">raised</span>
          </div>
          <p class="text-sm text-slate-600">of {{ formattedGoal }} goal</p>
        </div>

        <!-- Progress Bar -->
        <div class="relative h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
          <div
            class="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out progress-bar-fill"
            :style="{ width: `${Math.min(progressPercentage, 100)}%` }"
          />
        </div>

        <!-- Stats Row -->
        <div class="flex items-center justify-between text-sm mb-4">
          <div class="flex items-center gap-4 text-slate-600">
            <div class="flex items-center gap-1.5">
              <svg
                class="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <span class="font-medium">{{ totalDonors }}</span>
              <span class="text-slate-500">donors</span>
            </div>
            <div v-if="daysLeft !== null" class="flex items-center gap-1.5">
              <Clock class="w-4 h-4 text-slate-400" />
              <span class="font-medium">{{ daysLeft }}</span>
              <span class="text-slate-500">days left</span>
            </div>
          </div>
          <span class="text-sm font-semibold" style="color: #059669">{{ progressPercentage }}%</span>
        </div>

        <!-- Donate CTA -->
        <button
          @click="emit('donate')"
          class="w-full text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 donate-button"
        >
          <Heart class="w-5 h-5" />
          Donate Now
        </button>
      </div>

      <!-- Item Donations Tab Content -->
      <div v-else-if="activeTab === 'item' && itemCategorySummary" class="p-4">
        <!-- Header with overall progress -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-slate-700">Items Needed</span>
            <span class="text-sm font-semibold text-emerald-600">
              {{ itemCategorySummary.categories.filter(c => c.progress_percentage && c.progress_percentage >= 100).length }}/{{ itemCategorySummary.categories.length }} fulfilled
            </span>
          </div>
          <!-- Overall progress indicator -->
          <div class="flex gap-1">
            <div
              v-for="category in itemCategorySummary.categories"
              :key="category.id"
              class="h-1.5 flex-1 rounded-full transition-all duration-500"
              :class="[
                category.progress_percentage && category.progress_percentage >= 100
                  ? 'bg-emerald-500'
                  : category.progress_percentage && category.progress_percentage > 0
                    ? 'bg-emerald-200'
                    : 'bg-slate-200'
              ]"
            />
          </div>
        </div>

        <!-- Item Categories -->
        <div class="space-y-3 mb-4">
          <div
            v-for="category in itemCategorySummary.categories"
            :key="category.id"
            class="group relative overflow-hidden rounded-xl border transition-all duration-200"
            :class="[
              category.progress_percentage && category.progress_percentage >= 100
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-white border-slate-200 hover:border-slate-300'
            ]"
          >
            <div class="p-3">
              <div class="flex items-start gap-3">
                <!-- Icon -->
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  :class="[
                    category.progress_percentage && category.progress_percentage >= 100
                      ? 'bg-emerald-100'
                      : 'bg-slate-100'
                  ]"
                >
                  <component
                    :is="getCategoryIcon(category.name)"
                    class="w-5 h-5"
                    :class="[
                      category.progress_percentage && category.progress_percentage >= 100
                        ? 'text-emerald-600'
                        : 'text-slate-500'
                    ]"
                  />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <h4 class="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        {{ category.name }}
                        <CheckCircle2
                          v-if="category.progress_percentage && category.progress_percentage >= 100"
                          class="w-4 h-4 text-emerald-500"
                        />
                      </h4>
                      <p class="text-xs text-slate-500 mt-0.5">
                        <span class="font-medium text-slate-700">{{ category.total_quantity }}</span>
                        <span v-if="category.target_quantity">
                          / {{ category.target_quantity }}
                        </span>
                        {{ category.unit }} donated
                      </p>
                    </div>

                    <!-- Progress Badge -->
                    <div
                      v-if="category.progress_percentage !== null"
                      class="flex-shrink-0"
                    >
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        :class="[
                          category.progress_percentage >= 100
                            ? 'bg-emerald-100 text-emerald-700'
                            : category.progress_percentage >= 50
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        ]"
                      >
                        {{ Math.round(category.progress_percentage) }}%
                      </span>
                    </div>
                  </div>

                  <!-- Progress Bar -->
                  <div v-if="category.target_quantity" class="mt-2">
                    <div class="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        class="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
                        :class="[
                          category.progress_percentage && category.progress_percentage >= 100
                            ? 'bg-emerald-500'
                            : 'progress-bar-fill'
                        ]"
                        :style="{ width: `${Math.min(category.progress_percentage || 0, 100)}%` }"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Row -->
        <div class="flex items-center justify-between text-sm mb-4 pb-4 border-b border-slate-100">
          <div class="flex items-center gap-4 text-slate-600">
            <div class="flex items-center gap-1.5">
              <Users class="w-4 h-4 text-slate-400" />
              <span class="font-medium">{{ itemCategorySummary.totals.total_item_donors }}</span>
              <span class="text-slate-500">donors</span>
            </div>
            <div v-if="daysLeft !== null" class="flex items-center gap-1.5">
              <Clock class="w-4 h-4 text-slate-400" />
              <span class="font-medium">{{ daysLeft }}</span>
              <span class="text-slate-500">days left</span>
            </div>
          </div>
        </div>

        <!-- Donate CTA -->
        <button
          @click="emit('donate')"
          class="w-full text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 donate-button"
        >
          <Gift class="w-5 h-5" />
          Donate Items
        </button>
      </div>

      <!-- Recent Donors -->
      <div
        v-if="displayedRecentDonations.length > 0"
        class="border-t border-slate-100 px-4 py-4 bg-slate-50/80"
      >
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Recent Supporters
          </h3>
          <button
            v-if="hasMoreDonations"
            @click="emit('see-all-donors', activeTab)"
            class="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            See All
            <ChevronRight class="w-3 h-3" />
          </button>
        </div>
        <div class="space-y-2">
          <div
            v-for="donation in displayedRecentDonations"
            :key="donation.id"
            class="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-white/60 transition-colors"
          >
            <!-- Avatar -->
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0"
              :class="donation.item_quantity ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'"
            >
              {{ getInitials(donation.display_name || 'Anonymous') }}
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-900 truncate">
                {{ donation.display_name || 'Anonymous' }}
              </p>
              <p class="text-xs text-slate-500">{{ formatRelativeTime(donation.created_at) }}</p>
            </div>

            <!-- Amount/Item -->
            <div v-if="donation.amount" class="text-right flex-shrink-0">
              <span class="text-sm font-semibold text-emerald-600">
                {{ formatCurrency(parseFloat(donation.amount), donation.currency) }}
              </span>
            </div>
            <div v-else-if="donation.item_quantity" class="text-right flex-shrink-0">
              <div class="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-50 rounded-lg">
                <Gift class="w-3 h-3 text-purple-500" />
                <span class="text-xs font-semibold text-purple-700">
                  {{ donation.item_quantity }} {{ donation.item_unit }}
                </span>
              </div>
              <p class="text-[10px] text-slate-400 mt-0.5 truncate max-w-[100px]">
                {{ getItemDisplayName(donation) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Heart,
  Clock,
  ChevronRight,
  Banknote,
  Gift,
  Users,
  CheckCircle2,
  Package,
  Utensils,
  Shirt,
  BookOpen,
  Pill,
  Home,
  Droplets,
  Zap,
  Baby,
  Scissors,
  Box,
} from 'lucide-vue-next'
import { useEventDateFormatters } from '@/composables/event'
import type { DonationCategorySummary } from '@/services/api/types/donation.types'

interface DonationItemCategoryInfo {
  id: number
  name: string
  unit: string
  target_quantity?: number
}

interface Donation {
  id: string | number
  display_name: string | null
  created_at: string
  amount?: string | null
  currency: string
  item_quantity?: number | null
  item_unit?: string
  item_name?: string
  item_category_info?: DonationItemCategoryInfo | null
  donation_type?: 'cash' | 'item'
  donation_display?: string
}

interface Props {
  totalRaised: string
  goal: string
  currency: string
  progressPercentage: number
  totalDonors: number
  daysLeft: number | null
  recentCashDonations: Donation[]
  recentItemDonations: Donation[]
  itemCategorySummary: DonationCategorySummary | null
}

interface Emits {
  (e: 'donate'): void
  (e: 'see-all-donors', tab: 'cash' | 'item'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Active tab state
const activeTab = ref<'cash' | 'item'>('cash')

const { getInitials } = useEventDateFormatters()

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getItemDisplayName = (donation: Donation): string => {
  // Priority: item_name > category_name > 'Item'
  if (donation.item_name) {
    return donation.item_name
  }
  if (donation.item_category_info?.name) {
    return donation.item_category_info.name
  }
  return 'Item'
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`

  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`
}

// Icon mapping for item categories based on category name keywords
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase()

  if (name.includes('food') || name.includes('meal') || name.includes('rice') || name.includes('grocery')) {
    return Utensils
  }
  if (name.includes('cloth') || name.includes('shirt') || name.includes('wear') || name.includes('dress')) {
    return Shirt
  }
  if (name.includes('book') || name.includes('school') || name.includes('education') || name.includes('stationery')) {
    return BookOpen
  }
  if (name.includes('medicine') || name.includes('medical') || name.includes('health') || name.includes('drug')) {
    return Pill
  }
  if (name.includes('house') || name.includes('shelter') || name.includes('home') || name.includes('building')) {
    return Home
  }
  if (name.includes('water') || name.includes('drink') || name.includes('beverage') || name.includes('liquid')) {
    return Droplets
  }
  if (name.includes('electric') || name.includes('power') || name.includes('energy') || name.includes('battery')) {
    return Zap
  }
  if (name.includes('baby') || name.includes('child') || name.includes('kid') || name.includes('infant') || name.includes('toy')) {
    return Baby
  }
  if (name.includes('hygiene') || name.includes('toiletry') || name.includes('sanitary') || name.includes('clean')) {
    return Scissors
  }
  if (name.includes('supply') || name.includes('equipment') || name.includes('tool')) {
    return Box
  }

  // Default icon
  return Package
}

const formattedTotalRaised = computed(() => formatCurrency(parseFloat(props.totalRaised || '0'), props.currency))
const formattedGoal = computed(() => formatCurrency(parseFloat(props.goal || '0'), props.currency))

// Check if event has item donations enabled
const hasItemDonations = computed(() => {
  return props.itemCategorySummary && props.itemCategorySummary.categories.length > 0
})

// Display donations based on active tab
const displayedRecentDonations = computed(() => {
  // If tabs are shown, return donations based on active tab
  if (hasItemDonations.value) {
    if (activeTab.value === 'cash') {
      return props.recentCashDonations.slice(0, 5)
    } else {
      return props.recentItemDonations.slice(0, 5)
    }
  }

  // Otherwise show cash donations (when no tabs/item categories)
  return props.recentCashDonations.slice(0, 5)
})

// Check if there are more donations than displayed (to show "See All" button)
const hasMoreDonations = computed(() => {
  if (hasItemDonations.value) {
    if (activeTab.value === 'cash') {
      return props.totalDonors > 5 || props.recentCashDonations.length >= 5
    } else {
      const itemDonorCount = props.itemCategorySummary?.totals?.total_item_donors || 0
      return itemDonorCount > 5 || props.recentItemDonations.length >= 5
    }
  }
  return props.totalDonors > 5 || props.recentCashDonations.length >= 5
})
</script>

<style scoped>
.progress-bar-fill {
  background: linear-gradient(to right, #10b981, #059669) !important;
}

.donate-button {
  background: linear-gradient(to right, #10b981, #059669);
  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.25), 0 4px 6px -4px rgba(16, 185, 129, 0.25);
}

.donate-button:hover {
  background: linear-gradient(to right, #059669, #047857);
}
</style>
