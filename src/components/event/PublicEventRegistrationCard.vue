<template>
  <!-- Already Registered (You're In) -->
  <div
    v-if="registrationRequired && isRegistered"
    class="bg-white rounded-xl border border-slate-200 overflow-hidden"
  >
    <!-- Header with avatar and status -->
    <div class="p-4">
      <div class="flex items-center gap-3 mb-3">
        <div
          class="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 text-lg font-semibold"
        >
          {{ userInitials }}
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-slate-900">You're Registered</h3>
          <!-- Status Badge -->
          <span :class="statusBadgeClass" class="inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1">
            {{ statusLabel }}
          </span>
        </div>
      </div>

      <!-- Event countdown -->
      <div v-if="timeUntilEvent || isOngoing" class="bg-slate-50 rounded-lg p-3 mb-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-slate-600">
            <Clock class="w-4 h-4" />
            <span class="text-sm">{{ isOngoing ? 'Event is happening now' : 'Event starts in' }}</span>
          </div>
          <span v-if="timeUntilEvent" class="text-sm font-semibold text-emerald-600">{{
            timeUntilEvent
          }}</span>
        </div>
        <p v-if="isVirtual && virtualLink" class="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
          The join button will appear when the event is about to start
        </p>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-2">
        <button
          @click="emit('toggle-calendar')"
          class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors"
        >
          <CalendarPlus class="w-4 h-4" />
          Calendar
        </button>
        <button
          @click="emit('share')"
          class="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-colors"
        >
          <Share2 class="w-4 h-4" />
          Share
        </button>
      </div>

      <!-- Calendar Options Dropdown -->
      <div v-if="showCalendarOptions" class="mt-3 flex flex-wrap gap-2">
        <button
          @click="emit('add-to-google')"
          class="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Google
        </button>
        <button
          @click="emit('add-to-outlook')"
          class="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Outlook
        </button>
        <button
          @click="emit('download-ics')"
          class="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Download .ics
        </button>
      </div>
    </div>

    <!-- Confirmation code (if available) -->
    <div v-if="confirmationCode" class="border-t border-slate-100 px-4 py-3 bg-slate-50">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-slate-500 mb-0.5">Confirmation Code</p>
          <p class="text-sm font-mono font-semibold text-slate-900">{{ confirmationCode }}</p>
        </div>
        <button
          @click="emit('show-qr')"
          class="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          title="Show QR Code"
        >
          <QrCode class="w-5 h-5 text-slate-600" />
        </button>
      </div>
    </div>

    <!-- Cancel registration link -->
    <div class="border-t border-slate-100 px-4 py-3 text-sm text-slate-600 text-center">
      Can't attend?
      <button
        @click="emit('cancel-registration')"
        :disabled="isCancelling"
        class="text-slate-700 hover:text-slate-900 font-medium underline underline-offset-2 disabled:opacity-50"
      >
        {{ isCancelling ? 'Cancelling...' : 'Cancel registration' }}
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
import { Clock, CalendarPlus, Share2, QrCode } from 'lucide-vue-next'
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
