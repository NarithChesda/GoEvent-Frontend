<template>
  <!-- Registration Card - Clean minimalist design matching GuestListItem -->
  <div
    class="bg-white/80 border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:bg-white transition-all duration-200 group"
  >
    <div class="flex items-center gap-3 px-4 py-3">
      <!-- Avatar (compact) -->
      <div
        class="w-9 h-9 bg-gradient-to-br from-emerald-500 to-sky-500 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
      >
        {{ initials }}
      </div>

      <!-- User Info (grows to fill space) -->
      <div class="flex-1 min-w-0">
        <!-- Name -->
        <div class="font-semibold text-slate-900 truncate">
          {{ fullName }}
        </div>

        <!-- Badges row -->
        <div class="flex items-center gap-1.5 mt-1 flex-wrap">
          <!-- Status badge -->
          <div
            class="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs font-medium"
            :class="statusBadgeClass"
          >
            <CheckCircle v-if="registration.status === 'checked_in'" class="w-3 h-3" />
            <Clock v-else-if="registration.status === 'registered'" class="w-3 h-3" />
            <X v-else class="w-3 h-3" />
            <span>{{ statusLabel }}</span>
          </div>

          <!-- Attendee count badge -->
          <div
            v-if="registration.total_attendees > 1"
            class="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium"
          >
            <Users class="w-3 h-3" />
            <span>{{ registration.total_attendees }}</span>
          </div>

          <!-- Confirmation code badge (desktop only) -->
          <div
            class="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded-lg text-xs font-mono cursor-pointer hover:bg-slate-100 transition-colors"
            @click="handleCopyCode"
            title="Click to copy"
          >
            <span>{{ registration.confirmation_code }}</span>
            <Copy class="w-3 h-3" />
          </div>
        </div>
      </div>

      <!-- Mobile: Check-in button (shown first on mobile for registered attendees) -->
      <button
        v-if="registration.status === 'registered' && canEdit"
        @click="handleCheckin"
        class="sm:hidden px-2.5 py-1.5 text-xs font-medium flex-shrink-0 rounded-lg transition-all duration-200 text-white bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="isChecking"
      >
        <span v-if="isChecking" class="flex items-center gap-1">
          <span class="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
        </span>
        <span v-else>Check In</span>
      </button>

      <!-- Mobile: Copy code button (for already checked-in or cancelled) -->
      <button
        v-else
        @click="handleCopyCode"
        class="sm:hidden px-2 py-1.5 text-xs font-mono text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
        title="Copy code"
      >
        {{ registration.confirmation_code }}
      </button>

      <!-- Actions (desktop) -->
      <div class="hidden sm:flex items-center gap-0.5 flex-shrink-0">
        <!-- Check-in button (only for registered status) -->
        <button
          v-if="registration.status === 'registered' && canEdit"
          @click="handleCheckin"
          title="Check in attendee"
          class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isChecking"
        >
          <div v-if="isChecking" class="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
          <UserCheck v-else class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Notes (if present) - separate row -->
    <div
      v-if="registration.notes"
      class="px-4 pb-3 -mt-1"
    >
      <p class="text-xs text-slate-500 italic truncate pl-12">
        "{{ registration.notes }}"
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CheckCircle,
  Clock,
  X,
  Users,
  Copy,
  UserCheck,
} from 'lucide-vue-next'
import type { EventRegistrationDetail } from '../../services/api'

// Props
const props = defineProps<{
  registration: EventRegistrationDetail
  canEdit: boolean
  isChecking?: boolean
}>()

// Emits
const emit = defineEmits<{
  'check-in': [registration: EventRegistrationDetail]
  'copy-code': [code: string]
}>()

// Computed
const fullName = computed(() => {
  const firstName = props.registration.user_details?.first_name || ''
  const lastName = props.registration.user_details?.last_name || ''
  return `${firstName} ${lastName}`.trim() || 'Unknown'
})

const initials = computed(() => {
  const firstName = props.registration.user_details?.first_name || ''
  const lastName = props.registration.user_details?.last_name || ''
  const first = firstName.charAt(0).toUpperCase()
  const last = lastName.charAt(0).toUpperCase()
  return `${first}${last}` || '?'
})

const statusLabel = computed(() => {
  switch (props.registration.status) {
    case 'checked_in':
      return 'Checked In'
    case 'registered':
      return 'Registered'
    case 'cancelled':
      return 'Cancelled'
    default:
      return props.registration.status || 'Unknown'
  }
})

const statusBadgeClass = computed(() => {
  switch (props.registration.status) {
    case 'checked_in':
      return 'bg-emerald-50 text-emerald-700'
    case 'registered':
      return 'bg-sky-50 text-sky-700'
    case 'cancelled':
      return 'bg-red-50 text-red-700'
    default:
      return 'bg-slate-50 text-slate-700'
  }
})

// Methods
const handleCheckin = () => {
  emit('check-in', props.registration)
}

const handleCopyCode = () => {
  emit('copy-code', props.registration.confirmation_code)
}
</script>
