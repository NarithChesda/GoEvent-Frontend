<template>
  <!-- Already Registered - Ticket Style -->
  <div v-if="registrationRequired && isRegistered" class="ticket-container">
    <div class="ticket">
      <!-- Left notch -->
      <div class="ticket-notch ticket-notch-left"></div>
      <!-- Right notch -->
      <div class="ticket-notch ticket-notch-right"></div>

      <!-- Main Ticket Content -->
      <div class="ticket-main">
        <!-- Header with gradient -->
        <div class="ticket-header">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Ticket class="w-4 h-4 text-emerald-100" />
              <span class="text-xs font-semibold text-emerald-100 uppercase tracking-wider"
                >Admission</span
              >
            </div>
            <div class="flex items-center gap-1">
              <button
                @click="emit('toggle-calendar')"
                class="p-1.5 text-emerald-100 hover:text-white hover:bg-emerald-600 rounded-md transition-colors"
                title="Add to Calendar"
              >
                <CalendarPlus class="w-4 h-4" />
              </button>
              <button
                @click="emit('share')"
                class="p-1.5 text-emerald-100 hover:text-white hover:bg-emerald-600 rounded-md transition-colors"
                title="Share Event"
              >
                <Share2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Calendar Options Dropdown -->
        <div v-if="showCalendarOptions" class="px-4 py-2 bg-emerald-600/50 flex gap-2">
          <button
            @click="emit('add-to-google')"
            class="px-3 py-1 text-xs font-medium text-white bg-emerald-700/50 hover:bg-emerald-700 rounded transition-colors"
          >
            Google
          </button>
          <button
            @click="emit('add-to-outlook')"
            class="px-3 py-1 text-xs font-medium text-white bg-emerald-700/50 hover:bg-emerald-700 rounded transition-colors"
          >
            Outlook
          </button>
          <button
            @click="emit('download-ics')"
            class="px-3 py-1 text-xs font-medium text-white bg-emerald-700/50 hover:bg-emerald-700 rounded transition-colors"
          >
            .ics
          </button>
        </div>

        <!-- Ticket Body -->
        <div class="ticket-body">
          <!-- Status Row -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span class="text-sm font-semibold text-slate-800">You're In!</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span :class="statusBadgeClass" class="px-2 py-0.5 text-xs font-medium rounded-full">
                {{ statusLabel }}
              </span>
              <span
                v-if="isOngoing"
                class="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700"
              >
                Live
              </span>
              <span
                v-else-if="timeUntilEvent"
                class="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600"
              >
                {{ timeUntilEvent }}
              </span>
            </div>
          </div>

          <p
            v-if="isVirtual && virtualLink && !isOngoing"
            class="text-xs text-slate-500 mb-3 flex items-center gap-1"
          >
            <Video class="w-3 h-3" />
            Join link available when event starts
          </p>
        </div>
      </div>

      <!-- Perforation Line -->
      <div class="ticket-perforation">
        <div class="perforation-notch perforation-notch-left"></div>
        <div class="perforation-line"></div>
        <div class="perforation-notch perforation-notch-right"></div>
      </div>

      <!-- Ticket Stub (Confirmation) -->
      <div class="ticket-stub">
        <div v-if="confirmationCode" class="flex items-center justify-between">
          <div>
            <p class="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Confirmation</p>
            <p class="text-base font-mono font-bold text-slate-800 tracking-widest">
              {{ confirmationCode }}
            </p>
          </div>
          <button
            @click="emit('show-qr')"
            class="p-2.5 text-slate-600 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Show QR Code"
          >
            <QrCode class="w-6 h-6" />
          </button>
        </div>
        <div v-else class="text-center py-2">
          <p class="text-xs text-slate-400">Registration confirmed</p>
        </div>

        <!-- Cancel Link -->
        <button
          @click="emit('cancel-registration')"
          :disabled="isCancelling"
          class="mt-3 w-full text-[10px] text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
        >
          {{ isCancelling ? 'Cancelling...' : "Can't attend? Cancel" }}
        </button>
      </div>
    </div>
  </div>

  <!-- Not Registered - Simple Card Style -->
  <div v-else-if="registrationRequired" class="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-slate-100">
      <div class="flex items-center gap-2">
        <Ticket class="w-4 h-4 text-slate-400" />
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider"
          >Registration</span
        >
      </div>
    </div>

    <!-- Body -->
    <div class="p-4">
      <p class="text-sm text-slate-600 mb-4">
        {{ registrationMessage }}
      </p>

      <!-- User Info (if logged in) -->
      <div v-if="currentUser" class="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
        <div
          class="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-700 text-sm font-semibold"
        >
          {{ userInitials }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-900 truncate">
            {{ currentUser.first_name || currentUser.username }}
          </p>
          <p class="text-xs text-slate-500 truncate">{{ currentUser.email }}</p>
        </div>
      </div>

      <!-- Register Button -->
      <button
        v-if="canRegister"
        @click="emit('register')"
        :disabled="isRegistering"
        class="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isRegistering ? 'Registering...' : 'Register' }}
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
        class="w-full bg-slate-100 text-slate-500 font-medium py-3 px-4 rounded-xl text-center text-sm"
      >
        <template v-if="isEventFull">Sold Out</template>
        <template v-else-if="isRegistrationClosed">Registration Closed</template>
        <template v-else-if="isPast">Event Has Ended</template>
        <template v-else>Unavailable</template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CalendarPlus, Share2, QrCode, Ticket, Video } from 'lucide-vue-next'
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

<style scoped>
.ticket-container {
  filter: drop-shadow(0 4px 6px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 4px rgb(0 0 0 / 0.05));
}

.ticket {
  position: relative;
  background: white;
  border-radius: 12px;
  overflow: visible;
}

/* Side notches - creates the ticket stub cutout effect */
.ticket-notch {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #f8fafc;
  border-radius: 50%;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}

.ticket-notch-left {
  left: -8px;
  box-shadow: inset -2px 0 4px rgb(0 0 0 / 0.05);
}

.ticket-notch-right {
  right: -8px;
  box-shadow: inset 2px 0 4px rgb(0 0 0 / 0.05);
}

.ticket-main {
  position: relative;
}

.ticket-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  padding: 12px 16px;
  border-radius: 12px 12px 0 0;
}

.ticket-body {
  padding: 16px;
}

/* Perforation line between main ticket and stub */
.ticket-perforation {
  position: relative;
  display: flex;
  align-items: center;
  height: 1px;
  margin: 0 16px;
}

.perforation-line {
  flex: 1;
  height: 0;
  border-top: 2px dashed #e2e8f0;
}

.perforation-notch {
  width: 8px;
  height: 16px;
  background: #f8fafc;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.perforation-notch-left {
  left: -24px;
  border-radius: 0 8px 8px 0;
  box-shadow: inset -1px 0 2px rgb(0 0 0 / 0.05);
}

.perforation-notch-right {
  right: -24px;
  border-radius: 8px 0 0 8px;
  box-shadow: inset 1px 0 2px rgb(0 0 0 / 0.05);
}

.ticket-stub {
  padding: 16px;
  background: linear-gradient(180deg, #fafafa 0%, white 100%);
  border-radius: 0 0 12px 12px;
}

/* Subtle texture for authenticity */
.ticket::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 1px,
    rgb(0 0 0 / 0.01) 1px,
    rgb(0 0 0 / 0.01) 2px
  );
  pointer-events: none;
  border-radius: 12px;
}
</style>
