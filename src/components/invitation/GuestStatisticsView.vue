<template>
  <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-4 sm:p-6">
    <!-- Header -->
    <div class="mb-4 sm:mb-6">
      <h3 class="text-base sm:text-lg font-bold text-slate-900">Statistics</h3>
      <p class="text-xs sm:text-sm text-slate-600 mt-1">Track and manage your invitations</p>
    </div>

    <!-- Primary Stats Grid (No Scroll) -->
    <div class="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
      <!-- Total Guests (Emphasis) -->
      <div
        class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-5 shadow-lg"
        role="region"
        aria-label="Total guests count"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <Users class="w-5 h-5 sm:w-6 sm:h-6 text-white/90" aria-hidden="true" />
              <p class="text-xs sm:text-sm font-semibold text-white/90 uppercase tracking-wide">Total Guests</p>
            </div>
            <div class="text-3xl sm:text-4xl font-bold text-white mb-1" aria-live="polite">
              {{ loadingStats ? '—' : totalGuests }}
            </div>
            <!-- Mini progress indicator -->
            <div class="flex items-center gap-2 text-white/80 text-xs sm:text-sm">
              <div class="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  class="h-full bg-white/40 rounded-full transition-all duration-500"
                  :style="{ width: sentPercentage + '%' }"
                  role="progressbar"
                  :aria-valuenow="sentPercentage"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  :aria-label="`${sentPercentage}% invitations sent`"
                ></div>
              </div>
              <span class="font-medium whitespace-nowrap">{{ sentPercentage }}% sent</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Secondary Stats Grid - 3 columns -->
      <div class="grid grid-cols-3 gap-2 sm:gap-3">
        <!-- Sent Invitations -->
        <div
          class="bg-white border-2 border-sky-200 rounded-xl p-3 sm:p-4"
          role="region"
          aria-label="Sent invitations count"
        >
          <Send class="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 mb-1 sm:mb-2" aria-hidden="true" />
          <div class="text-lg sm:text-2xl font-bold text-slate-900 mb-0.5" aria-live="polite">
            {{ loadingStats ? '—' : sentInvitations }}
          </div>
          <p class="text-[10px] sm:text-sm font-medium text-slate-700 leading-tight">Sent</p>
          <p class="text-[9px] sm:text-xs text-sky-600 mt-0.5 sm:mt-1">{{ loadingStats ? '—' : sentPercentage }}%</p>
        </div>

        <!-- Viewed Invitations -->
        <div
          class="bg-white border-2 border-green-200 rounded-xl p-3 sm:p-4"
          role="region"
          aria-label="Viewed invitations count"
        >
          <Eye class="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mb-1 sm:mb-2" aria-hidden="true" />
          <div class="text-lg sm:text-2xl font-bold text-slate-900 mb-0.5" aria-live="polite">
            {{ loadingStats ? '—' : acceptedInvitations }}
          </div>
          <p class="text-[10px] sm:text-sm font-medium text-slate-700 leading-tight">Viewed</p>
          <p class="text-[9px] sm:text-xs text-green-600 mt-0.5 sm:mt-1">{{ loadingStats ? '—' : viewRate }}%</p>
        </div>

        <!-- Pending Invitations -->
        <div
          class="bg-white border-2 border-slate-200 rounded-xl p-3 sm:p-4"
          role="region"
          aria-label="Pending invitations count"
        >
          <Clock class="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 mb-1 sm:mb-2" aria-hidden="true" />
          <div class="text-lg sm:text-2xl font-bold text-slate-900 mb-0.5" aria-live="polite">
            {{ loadingStats ? '—' : pendingInvitations }}
          </div>
          <p class="text-[10px] sm:text-sm font-medium text-slate-700 leading-tight">Pending</p>
          <p class="text-[9px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1 opacity-0">—</p>
        </div>
      </div>
    </div>

    <!-- Detailed Engagement Breakdown (Collapsible) -->
    <div v-if="!loadingStats && totalGuests > 0" class="border-t border-slate-200 pt-4 sm:pt-6 mt-4 sm:mt-6">
      <button
        @click="showDetailedBreakdown = !showDetailedBreakdown"
        class="w-full flex items-center justify-between mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2 -m-2"
        :aria-expanded="showDetailedBreakdown"
        aria-controls="detailed-breakdown-section"
        type="button"
      >
        <h4 class="text-sm sm:text-base font-semibold text-slate-700">Detailed Breakdown</h4>
        <ChevronDown
          class="w-5 h-5 text-slate-400 transition-transform"
          :class="{ 'rotate-180': showDetailedBreakdown }"
          aria-hidden="true"
        />
      </button>

      <Transition name="expand">
        <div v-if="showDetailedBreakdown" id="detailed-breakdown-section" class="space-y-3">
          <!-- Invitation Status -->
          <div class="bg-slate-50 rounded-lg p-3 sm:p-4">
            <div class="flex items-center justify-between text-sm mb-2">
              <span class="font-medium text-slate-700">Invitation Status</span>
              <span class="text-slate-600">{{ sentInvitations }}/{{ totalGuests }} sent</span>
            </div>
            <div class="relative w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-3">
              <div
                class="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-all duration-500"
                :style="{ width: sentPercentage + '%' }"
                role="progressbar"
                :aria-valuenow="sentPercentage"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="`${sentPercentage}% invitations sent`"
              ></div>
            </div>
            <div class="flex flex-wrap items-center gap-3 text-xs">
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-full bg-sky-500"></div>
                <span class="text-slate-600">Sent: {{ sentInvitations }} ({{ sentPercentage }}%)</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-full bg-slate-300"></div>
                <span class="text-slate-600">Pending: {{ pendingInvitations }} ({{ pendingPercentage }}%)</span>
              </div>
            </div>
          </div>

          <!-- View Rate -->
          <div class="bg-slate-50 rounded-lg p-3 sm:p-4">
            <div class="flex items-center justify-between text-sm mb-2">
              <span class="font-medium text-slate-700">View Engagement</span>
              <span class="text-slate-600">{{ acceptedInvitations }}/{{ sentInvitations }} viewed</span>
            </div>
            <div class="relative w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-3">
              <div
                class="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                :style="{ width: viewedPercentage + '%' }"
                role="progressbar"
                :aria-valuenow="viewedPercentage"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="`${viewedPercentage}% of sent invitations viewed`"
              ></div>
            </div>
            <div class="flex flex-wrap items-center gap-3 text-xs">
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                <span class="text-slate-600">Viewed: {{ acceptedInvitations }} ({{ viewRate }}% rate)</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Users, Send, Eye, Clock, ChevronDown } from 'lucide-vue-next'

interface GuestStats {
  total_guests: number
  sent: number
  viewed: number
}

interface Props {
  guestStats: GuestStats | null
  loadingStats: boolean
}

const props = defineProps<Props>()

const showDetailedBreakdown = ref(false)

const acceptedInvitations = computed(() => props.guestStats?.viewed || 0)
const totalGuests = computed(() => props.guestStats?.total_guests || 0)
const sentInvitations = computed(() => props.guestStats?.sent || 0)
const pendingInvitations = computed(() => {
  const total = totalGuests.value
  const sent = sentInvitations.value
  return Math.max(0, total - sent)
})

const sentPercentage = computed(() => {
  const total = totalGuests.value
  if (total === 0) return 0
  return Math.round((sentInvitations.value / total) * 100)
})

const viewedPercentage = computed(() => {
  const total = totalGuests.value
  if (total === 0) return 0
  return Math.round((acceptedInvitations.value / total) * 100)
})

const pendingPercentage = computed(() => {
  const total = totalGuests.value
  if (total === 0) return 0
  return Math.round((pendingInvitations.value / total) * 100)
})

const viewRate = computed(() => {
  const sent = sentInvitations.value
  if (sent === 0) return 0
  return Math.round((acceptedInvitations.value / sent) * 100)
})
</script>

<style scoped>
/* Expand transition for collapsible sections */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 800px;
  transform: translateY(0);
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .expand-enter-active,
  .expand-leave-active {
    transition: none;
  }

  div[role='progressbar'] {
    transition: none !important;
  }
}
</style>
