<template>
  <!-- Already Registered (You're In) -->
  <div
    v-if="registrationRequired && isRegistered"
    class="bg-white rounded-xl border border-slate-200 overflow-hidden"
  >
    <!-- Header Row -->
    <div class="px-4 pt-4 pb-3 flex items-center justify-between">
      <!-- Status Badges -->
      <div class="flex items-center gap-2 flex-wrap">
        <span :class="statusBadgeClass" class="px-2.5 py-1 text-xs font-medium rounded-full">
          {{ statusLabel }}
        </span>
        <span
          v-if="isOngoing"
          class="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700"
        >
          Happening Now
        </span>
        <span
          v-else-if="timeUntilEvent"
          class="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600"
        >
          Starts in {{ timeUntilEvent }}
        </span>
      </div>
      <!-- Quick Actions -->
      <div class="flex items-center gap-1 shrink-0">
        <button
          @click="emit('toggle-calendar')"
          class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Add to Calendar"
        >
          <CalendarPlus class="w-4 h-4" />
        </button>
        <button
          @click="emit('share')"
          class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          title="Share Event"
        >
          <Share2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Calendar Options Dropdown -->
    <div v-if="showCalendarOptions" class="px-4 pb-3 flex gap-2">
      <button
        @click="emit('add-to-google')"
        class="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
      >
        Google
      </button>
      <button
        @click="emit('add-to-outlook')"
        class="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
      >
        Outlook
      </button>
      <button
        @click="emit('download-ics')"
        class="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
      >
        .ics
      </button>
    </div>

    <div class="px-4 pb-4">
      <!-- Main Info -->
      <div class="flex items-center gap-2 mb-3">
        <div class="w-2 h-2 bg-emerald-500 rounded-full"></div>
        <span class="text-sm font-medium text-slate-900">You're Registered</span>
        <span v-if="isVirtual && virtualLink && !isOngoing" class="text-xs text-slate-400">
          · Join link available when event starts
        </span>
      </div>

      <!-- Confirmation Code -->
      <div v-if="confirmationCode" class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
        <div>
          <p class="text-xs text-slate-500">Confirmation</p>
          <p class="text-sm font-mono font-semibold text-slate-900 tracking-wide">{{ confirmationCode }}</p>
        </div>
        <button
          @click="emit('show-qr')"
          class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          title="Show QR Code"
        >
          <QrCode class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Cancel -->
    <div class="px-4 py-3 border-t border-slate-100">
      <button
        @click="emit('cancel-registration')"
        :disabled="isCancelling"
        class="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
      >
        {{ isCancelling ? 'Cancelling...' : "Can't attend? Cancel registration" }}
      </button>
    </div>
  </div>

  <!-- Not Registered -->
  <div v-else-if="registrationRequired" class="bg-white rounded-xl border border-slate-200 p-4">
    <h3 class="text-sm font-semibold text-slate-900 mb-2">Registration Required</h3>
    <p class="text-sm text-slate-600 mb-4">
      {{ registrationMessage }}
    </p>

    <!-- User Info (if logged in) -->
    <div
      v-if="currentUser"
      class="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200"
    >
      <div
        class="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-700 text-sm font-semibold"
      >
        {{ userInitials }}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-900 truncate">
          {{ currentUser.first_name || currentUser.username }}
        </p>
        <p class="text-sm text-slate-500 truncate">{{ currentUser.email }}</p>
      </div>
    </div>

    <!-- Register Button -->
    <button
      v-if="canRegister"
      @click="emit('register')"
      :disabled="isRegistering"
      class="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {{ isRegistering ? 'Registering...' : 'Register for Event' }}
    </button>

    <!-- Login to Register -->
    <button
      v-else-if="!currentUser"
      @click="emit('login-to-register')"
      class="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
    >
      Sign in to Register
    </button>

    <!-- Registration Closed/Full/Past -->
    <div
      v-else
      class="w-full bg-slate-100 text-slate-600 font-medium py-3 px-4 rounded-xl text-center text-sm"
    >
      <template v-if="isEventFull">Event is Full</template>
      <template v-else-if="isRegistrationClosed">Registration Closed</template>
      <template v-else-if="isPast">Event Has Ended</template>
      <template v-else>Registration Unavailable</template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CalendarPlus, Share2, QrCode } from 'lucide-vue-next'
import { useEventDateFormatters } from '@/composables/event'

interface User {
  first_name?: string
  username: string
  email: string
}

interface Props {
  registrationRequired: boolean
  isRegistered: boolean
  statusLabel: string
  statusBadgeClass: string
  timeUntilEvent: string | null
  isOngoing: boolean
  isVirtual: boolean
  virtualLink: string | undefined
  showCalendarOptions: boolean
  confirmationCode: string | null | undefined
  isCancelling: boolean
  registrationMessage: string
  currentUser: User | null
  canRegister: boolean
  isRegistering: boolean
  isEventFull: boolean
  isRegistrationClosed: boolean
  isPast: boolean
}

interface Emits {
  (e: 'toggle-calendar'): void
  (e: 'share'): void
  (e: 'add-to-google'): void
  (e: 'add-to-outlook'): void
  (e: 'download-ics'): void
  (e: 'show-qr'): void
  (e: 'cancel-registration'): void
  (e: 'register'): void
  (e: 'login-to-register'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { getInitials } = useEventDateFormatters()

const userInitials = computed(() => {
  if (!props.currentUser) return 'U'
  return getInitials(props.currentUser.first_name || props.currentUser.username || 'U')
})
</script>
