<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
    <div
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-4 sm:p-5 min-w-0"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex-1 min-w-0">
          <p class="text-xl sm:text-2xl font-bold text-slate-900 truncate">
            {{ confirmedCount }}
          </p>
          <p class="text-xs sm:text-sm text-slate-600 mt-1">Confirmed</p>
        </div>
        <div
          class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"
        >
          <CreditCard class="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
        </div>
      </div>
    </div>

    <div
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-4 sm:p-5 min-w-0"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex-1 min-w-0">
          <p class="text-xl sm:text-2xl font-bold text-slate-900 truncate">
            {{ pendingCount }}
          </p>
          <p class="text-xs sm:text-sm text-slate-600 mt-1">Pending</p>
        </div>
        <div
          class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0"
        >
          <Clock class="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
        </div>
      </div>
    </div>

    <div
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-4 sm:p-5 min-w-0"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex-1 min-w-0">
          <p class="text-lg sm:text-2xl font-semibold text-slate-900 truncate">
            ${{ totalAmount }}
          </p>
          <p class="text-xs sm:text-sm text-slate-600 mt-1">Total Value</p>
        </div>
        <div
          class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#B0E0E6] flex items-center justify-center flex-shrink-0"
        >
          <DollarSign class="w-5 h-5 sm:w-6 sm:h-6 text-[#1e90ff]" />
        </div>
      </div>
    </div>

    <div
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-4 sm:p-5 min-w-0"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex-1 min-w-0">
          <p class="text-xl sm:text-2xl font-bold text-slate-900 truncate">
            {{ isActive ? '1' : '0' }}
          </p>
          <p class="text-xs sm:text-sm text-slate-600 mt-1">Active</p>
        </div>
        <div
          class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0"
        >
          <Package class="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CreditCard, Clock, DollarSign, Package } from 'lucide-vue-next'

interface Props {
  confirmedCount: number
  pendingCount: number
  totalAmount: string
  isActive: boolean
}

defineProps<Props>()
</script>
