<template>
  <!-- 3-Tier Minimalist Information Hierarchy -->
  <div class="space-y-6">
    <!-- Primary Metric - Total Earnings -->
    <BaseCard variant="featured" size="lg" accent-color="bg-gradient-to-r from-blue-600 to-purple-600">
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl mb-3">
          <DollarSign class="w-6 h-6 text-blue-600" />
        </div>
        <div class="space-y-1">
          <p class="text-sm font-medium text-slate-600">Total Earnings</p>
          <p class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {{ isStatsLoading ? '...' : formatCurrency(stats?.total_commission_amount || 0) }}
          </p>
          <p class="text-xs text-slate-500">All time commission</p>
        </div>
      </div>
    </BaseCard>

    <!-- Secondary Metrics - Active Status -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Claimed Amount -->
      <BaseCard variant="base" size="md" class="hover:shadow-lg transition-all duration-300">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            <p class="text-sm font-medium text-slate-700">Claimed</p>
          </div>
          <span class="text-xs font-medium text-slate-500 bg-green-50 px-2 py-1 rounded-full">{{
            stats?.claimed_commissions || 0
          }}</span>
        </div>
        <p class="text-xl font-bold text-slate-900">
          {{ isStatsLoading ? '...' : formatCurrency(stats?.claimed_commission_amount || 0) }}
        </p>
      </BaseCard>

      <!-- Pending Amount -->
      <BaseCard variant="base" size="md" class="hover:shadow-lg transition-all duration-300">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-amber-500 rounded-full"></div>
            <p class="text-sm font-medium text-slate-700">Pending</p>
          </div>
          <span class="text-xs font-medium text-slate-500 bg-amber-50 px-2 py-1 rounded-full">{{
            stats?.pending_commissions || 0
          }}</span>
        </div>
        <p class="text-xl font-bold text-slate-900">
          {{ isStatsLoading ? '...' : formatCurrency(stats?.pending_commission_amount || 0) }}
        </p>
      </BaseCard>
    </div>

    <!-- Tertiary Metrics - Supporting Info -->
    <BaseCard variant="compact" size="md" class="bg-gradient-to-br from-slate-50 to-slate-100/50 border-slate-200">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
        <div>
          <p class="text-xs font-medium text-slate-600 mb-1">Under Review</p>
          <div class="flex items-center justify-center space-x-2">
            <div class="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            <p class="text-sm font-bold text-slate-900">
              {{ isStatsLoading ? '...' : formatCurrency(stats?.requested_commission_amount || 0) }}
            </p>
            <span class="text-xs text-slate-500 bg-purple-50 px-2 py-0.5 rounded-full">({{ stats?.requested_commissions || 0 }})</span>
          </div>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-600 mb-1">Total Commissions</p>
          <div class="flex items-center justify-center space-x-2">
            <div class="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
            <p class="text-sm font-bold text-slate-900">{{ stats?.total_commissions || 0 }}</p>
            <span class="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">items</span>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { DollarSign } from 'lucide-vue-next'
import { formatCurrency } from '../../../utils/commissionHelpers'
import type { CommissionStats } from '../../../services/commission'
import BaseCard from '../../BaseCard.vue'

interface Props {
  stats: CommissionStats | null
  isStatsLoading: boolean
}

defineProps<Props>()
</script>
