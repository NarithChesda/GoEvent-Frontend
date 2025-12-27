<template>
  <div class="px-4 -mt-6 mb-6 relative z-10">
    <div class="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
      <!-- Progress Stats -->
      <div class="p-4">
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

      <!-- Recent Donors -->
      <div
        v-if="recentDonations && recentDonations.length > 0"
        class="border-t border-slate-100 px-4 py-4 bg-slate-50"
      >
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Recent Supporters
        </h3>
        <div class="space-y-3">
          <div
            v-for="donation in recentDonations.slice(0, 3)"
            :key="donation.id"
            class="flex items-center gap-3"
          >
            <div
              class="w-9 h-9 bg-slate-200 rounded-lg flex items-center justify-center text-sm font-semibold text-slate-700 flex-shrink-0"
            >
              {{ getInitials(donation.display_name || 'Anonymous') }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-900 truncate">
                {{ donation.display_name || 'Anonymous' }}
              </p>
              <p class="text-xs text-slate-500">{{ formatRelativeTime(donation.created_at) }}</p>
            </div>
            <span v-if="donation.amount" class="text-sm font-semibold text-slate-700">
              {{ formatCurrency(parseFloat(donation.amount), donation.currency) }}
            </span>
            <span v-else-if="donation.item_quantity" class="text-sm font-semibold text-slate-700">
              {{ donation.item_quantity }} {{ donation.item_unit }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Heart, Clock } from 'lucide-vue-next'
import { useEventDateFormatters } from '@/composables/event'

interface Donation {
  id: string
  display_name: string | null
  created_at: string
  amount?: string
  currency: string
  item_quantity?: number
  item_unit?: string
}

interface Props {
  totalRaised: string
  goal: string
  currency: string
  progressPercentage: number
  totalDonors: number
  daysLeft: number | null
  recentDonations: Donation[] | null
}

interface Emits {
  (e: 'donate'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { getInitials } = useEventDateFormatters()

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount)
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

const formattedTotalRaised = computed(() => formatCurrency(parseFloat(props.totalRaised || '0'), props.currency))
const formattedGoal = computed(() => formatCurrency(parseFloat(props.goal || '0'), props.currency))
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
