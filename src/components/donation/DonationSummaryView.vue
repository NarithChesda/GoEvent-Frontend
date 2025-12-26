<template>
  <div class="space-y-6">
    <!-- Summary Card -->
    <div class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60">
      <div class="flex flex-col gap-6">
        <!-- Header with Fundraising Stats -->
        <div class="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{{ progress.currency }} Raised</p>
            <p class="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 transition-all duration-300" aria-live="polite">
              {{ formatCurrency(progress.total_raised, progress.currency) }}
            </p>
            <p v-if="progress.goal" class="mt-1 text-xs sm:text-sm text-slate-500">
              of {{ formatCurrency(progress.goal, progress.currency) }} goal
            </p>
            <p v-else class="mt-1 text-xs sm:text-sm text-slate-500">
              {{ progress.total_donors }} donor{{ progress.total_donors !== 1 ? 's' : '' }} contributed
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <div
              :class="[
                'inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold ring-1',
                progress.percentage >= 100
                  ? 'bg-emerald-50 text-emerald-600 ring-emerald-200'
                  : 'bg-sky-50 text-sky-600 ring-sky-200'
              ]"
            >
              <TrendingUp class="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
              <span>{{ progress.percentage }}% funded</span>
            </div>
          </div>
        </div>

        <!-- Progress Visualization -->
        <div class="space-y-5">
          <div class="flex h-2 sm:h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner" role="img" aria-hidden="true">
            <div
              class="h-full transition-all duration-700 ease-out bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600"
              :style="{ width: Math.min(progress.percentage, 100) + '%' }"
            ></div>
          </div>

          <div class="grid grid-cols-3 gap-2 sm:gap-3">
            <!-- Total Donors -->
            <div class="rounded-lg sm:rounded-2xl border border-transparent bg-emerald-50/80 p-2.5 sm:p-4 shadow-sm shadow-emerald-100/70">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <p class="text-[10px] sm:text-xs mb-1 sm:mb-0 font-semibold uppercase tracking-wide text-emerald-600">Donors</p>
              </div>
              <p class="hidden sm:block mt-1 sm:mt-3 text-lg sm:text-xl leading-tight font-bold text-slate-900 transition-all duration-300">
                {{ progress.total_donors }}
              </p>
              <p class="sm:hidden mt-1 text-lg leading-tight font-bold text-slate-900">
                {{ progress.total_donors }}
              </p>
              <p class="hidden sm:block text-[10px] sm:text-xs mt-1 text-emerald-700/70 leading-tight">
                Total contributors
              </p>
              <p class="sm:hidden text-[9px] mt-0.5 text-emerald-700/60 leading-tight">
                Contributors
              </p>
            </div>

            <!-- Cash Donations -->
            <div class="rounded-lg sm:rounded-2xl border border-transparent bg-sky-50/80 p-2.5 sm:p-4 shadow-sm shadow-sky-100/70">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <p class="text-[10px] sm:text-xs mb-1 sm:mb-0 font-semibold uppercase tracking-wide text-sky-600">Cash</p>
                <span class="text-[10px] sm:text-xs font-semibold text-sky-600">{{ cashDonationsCount }}</span>
              </div>
              <p class="hidden sm:block mt-1 sm:mt-3 text-lg sm:text-xl leading-tight font-bold text-slate-900 transition-all duration-300">
                {{ cashDonationsCount }}
              </p>
              <p class="sm:hidden mt-1 text-lg leading-tight font-bold text-slate-900">
                {{ cashDonationsCount }}
              </p>
              <p class="hidden sm:block text-[10px] sm:text-xs mt-1 text-sky-700/70 leading-tight">
                Monetary donations
              </p>
              <p class="sm:hidden text-[9px] mt-0.5 text-sky-700/60 leading-tight">
                Monetary
              </p>
            </div>

            <!-- Item Donations -->
            <div class="rounded-lg sm:rounded-2xl border border-transparent bg-purple-50/80 p-2.5 sm:p-4 shadow-sm shadow-purple-100/70">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <p class="text-[10px] sm:text-xs mb-1 sm:mb-0 font-semibold uppercase tracking-wide text-purple-600">Items</p>
                <span class="text-[10px] sm:text-xs font-semibold text-purple-600">{{ itemDonationsCount }}</span>
              </div>
              <p class="hidden sm:block mt-1 sm:mt-3 text-lg sm:text-xl leading-tight font-bold text-slate-900 transition-all duration-300">
                {{ itemDonationsCount }}
              </p>
              <p class="sm:hidden mt-1 text-lg leading-tight font-bold text-slate-900">
                {{ itemDonationsCount }}
              </p>
              <p class="hidden sm:block text-[10px] sm:text-xs mt-1 text-purple-700/70 leading-tight">
                In-kind donations
              </p>
              <p class="sm:hidden text-[9px] mt-0.5 text-purple-700/60 leading-tight">
                In-kind
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pending Review Alert (if any) -->
    <div
      v-if="pendingDonationsCount > 0"
      class="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 sm:p-5"
    >
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Clock class="w-5 h-5 text-amber-600" />
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-amber-900 mb-0.5">{{ pendingDonationsCount }} Pending Review</h4>
          <p class="text-sm text-amber-700">
            {{ pendingDonationsCount === 1 ? 'A donation needs' : 'Donations need' }} verification before being counted toward your goal.
          </p>
        </div>
      </div>
    </div>

    <!-- Recent Donations -->
    <div v-if="progress.recent_donations.length > 0" class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60">
      <div class="flex items-center justify-between mb-5">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Recent Donations</p>
          <p class="mt-1 text-sm text-slate-500">Latest verified contributions</p>
        </div>
      </div>

      <div class="space-y-3">
        <div
          v-for="donation in progress.recent_donations"
          :key="donation.id"
          class="flex items-center justify-between p-3 sm:p-4 bg-slate-50/80 rounded-xl hover:bg-slate-100/80 transition-colors"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              :class="[
                'w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                donation.donation_type === 'cash' ? 'bg-emerald-100' : 'bg-purple-100'
              ]"
            >
              <DollarSign v-if="donation.donation_type === 'cash'" class="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              <Package v-else class="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div class="min-w-0">
              <div class="font-medium text-slate-900 truncate">{{ donation.display_name }}</div>
              <div class="text-xs text-slate-500">{{ formatRelativeTime(donation.verified_at) }}</div>
            </div>
          </div>
          <div class="text-right flex-shrink-0 ml-3">
            <div class="font-semibold text-slate-900 text-sm sm:text-base">{{ donation.donation_display }}</div>
            <div v-if="donation.message" class="text-xs text-slate-500 max-w-[100px] sm:max-w-[150px] truncate">
              "{{ donation.message }}"
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TrendingUp, DollarSign, Package, Clock } from 'lucide-vue-next'
import type { FundraisingProgress, DonationCurrency } from '@/services/api/types/donation.types'

interface Props {
  progress: FundraisingProgress
  cashDonationsCount: number
  itemDonationsCount: number
  pendingDonationsCount: number
}

const props = defineProps<Props>()

const formatCurrency = (amount: string | null, currency: DonationCurrency): string => {
  if (!amount) return '$0.00'
  const num = parseFloat(amount)
  if (currency === 'KHR') {
    return new Intl.NumberFormat('km-KH', {
      style: 'currency',
      currency: 'KHR',
      minimumFractionDigits: 0,
    }).format(num)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}
</script>
