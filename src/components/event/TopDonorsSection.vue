<template>
  <div v-if="topDonors.length > 0" class="border-t border-slate-100 pt-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Top Supporters
      </h3>
      <button
        v-if="showSeeAll"
        @click="emit('see-all')"
        class="text-xs font-medium text-emerald-600 hover:text-emerald-700"
      >
        See All
      </button>
    </div>

    <!-- Top 3 Podium Style -->
    <div v-if="topDonors.length >= 3" class="flex items-end justify-center gap-2 mb-4">
      <!-- 2nd Place -->
      <div class="flex flex-col items-center w-24">
        <div
          class="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-700 border-2 border-slate-300 mb-1"
        >
          {{ getInitials(topDonors[1].display_name || 'A') }}
        </div>
        <div class="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-xs font-bold text-slate-700 -mt-3 relative z-10 border-2 border-white">
          2
        </div>
        <p class="text-xs font-medium text-slate-900 truncate max-w-full text-center mt-1">
          {{ topDonors[1].display_name || 'Anonymous' }}
        </p>
        <p class="text-xs font-semibold text-emerald-600">
          {{ formatCurrency(parseFloat(topDonors[1].amount || '0'), currency) }}
        </p>
      </div>

      <!-- 1st Place -->
      <div class="flex flex-col items-center w-28 -mb-2">
        <div class="relative">
          <Trophy class="w-5 h-5 text-amber-500 absolute -top-5 left-1/2 -translate-x-1/2" />
          <div
            class="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-base font-bold text-amber-700 border-2 border-amber-400 mb-1"
          >
            {{ getInitials(topDonors[0].display_name || 'A') }}
          </div>
        </div>
        <div class="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-xs font-bold text-amber-900 -mt-3 relative z-10 border-2 border-white">
          1
        </div>
        <p class="text-sm font-medium text-slate-900 truncate max-w-full text-center mt-1">
          {{ topDonors[0].display_name || 'Anonymous' }}
        </p>
        <p class="text-sm font-bold text-emerald-600">
          {{ formatCurrency(parseFloat(topDonors[0].amount || '0'), currency) }}
        </p>
      </div>

      <!-- 3rd Place -->
      <div class="flex flex-col items-center w-24">
        <div
          class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-800 border-2 border-amber-600 mb-1"
        >
          {{ getInitials(topDonors[2].display_name || 'A') }}
        </div>
        <div class="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-xs font-bold text-amber-100 -mt-3 relative z-10 border-2 border-white">
          3
        </div>
        <p class="text-xs font-medium text-slate-900 truncate max-w-full text-center mt-1">
          {{ topDonors[2].display_name || 'Anonymous' }}
        </p>
        <p class="text-xs font-semibold text-emerald-600">
          {{ formatCurrency(parseFloat(topDonors[2].amount || '0'), currency) }}
        </p>
      </div>
    </div>

    <!-- Remaining Top Donors (4-10) -->
    <div v-if="topDonors.length > 3" class="space-y-2 mt-3">
      <div
        v-for="(donor, index) in topDonors.slice(3)"
        :key="donor.id"
        class="flex items-center gap-3 py-2 px-3 bg-slate-50 rounded-lg"
      >
        <span class="w-5 text-xs font-semibold text-slate-500 text-center">{{ index + 4 }}</span>
        <div
          class="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700"
        >
          {{ getInitials(donor.display_name || 'A') }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-900 truncate">
            {{ donor.display_name || 'Anonymous' }}
          </p>
        </div>
        <span class="text-sm font-semibold text-slate-700">
          {{ formatCurrency(parseFloat(donor.amount || '0'), currency) }}
        </span>
      </div>
    </div>

    <!-- Compact List for <3 donors -->
    <div v-else-if="topDonors.length < 3" class="space-y-2">
      <div
        v-for="(donor, index) in topDonors"
        :key="donor.id"
        class="flex items-center gap-3 py-2 px-3 rounded-lg"
        :class="index === 0 ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'"
      >
        <div
          class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          :class="getRankBadgeClass(index)"
        >
          {{ index + 1 }}
        </div>
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold"
          :class="index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'"
        >
          {{ getInitials(donor.display_name || 'A') }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-900 truncate">
            {{ donor.display_name || 'Anonymous' }}
          </p>
        </div>
        <span class="text-sm font-semibold" :class="index === 0 ? 'text-amber-700' : 'text-slate-700'">
          {{ formatCurrency(parseFloat(donor.amount || '0'), currency) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Trophy } from 'lucide-vue-next'
import { useEventDateFormatters } from '@/composables/event'

interface TopDonor {
  id: number | string
  display_name: string | null
  amount: string | null
  currency: string
}

interface Props {
  topDonors: TopDonor[]
  currency: string
  showSeeAll?: boolean
}

interface Emits {
  (e: 'see-all'): void
}

withDefaults(defineProps<Props>(), {
  showSeeAll: true,
})
const emit = defineEmits<Emits>()

const { getInitials } = useEventDateFormatters()

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getRankBadgeClass = (index: number): string => {
  switch (index) {
    case 0:
      return 'bg-amber-400 text-amber-900'
    case 1:
      return 'bg-slate-300 text-slate-700'
    case 2:
      return 'bg-amber-600 text-amber-100'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}
</script>
