<template>
  <div
    class="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl shadow-blue-500/25 border border-white/20"
  >
    <!-- Attendance Info -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-semibold text-slate-700 uppercase tracking-wider"
          >Attendance</span
        >
        <span class="text-xl font-bold text-slate-900 leading-none">
          {{ event.registrations_count }}
          <span v-if="event.max_attendees" class="text-base text-slate-500"
            >/ {{ event.max_attendees }}</span
          >
        </span>
      </div>
      <div v-if="event.max_attendees" class="w-full bg-slate-200 rounded-full h-2">
        <div
          class="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
          :style="{
            width: `${Math.min(100, (event.registrations_count / event.max_attendees) * 100)}%`,
          }"
        ></div>
      </div>
    </div>

    <!-- Primary Action -->
    <div class="space-y-4">
      <!-- Main Action Button -->
      <button
        v-if="canRegister"
        @click="$emit('register')"
        :disabled="isRegistering"
        class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-600/40 hover:scale-[1.03] hover:-translate-y-1 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-lg"
      >
        <UserPlus class="w-5 h-5 mr-3" />
        {{ isRegistering ? 'Registering...' : 'Register Now' }}
      </button>

      <div
        v-if="event.is_registered"
        class="w-full inline-flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl font-bold shadow-xl shadow-green-500/30 text-lg"
      >
        <CheckCircle class="w-5 h-5 mr-3" />
        You're Registered
      </div>

      <!-- Virtual Event Access -->
      <button
        v-if="event.virtual_link && (event.is_ongoing || event.is_registered)"
        @click="$emit('join-virtual')"
        class="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-600/30 hover:scale-[1.02] flex items-center justify-center"
      >
        <ExternalLink class="w-4 h-4 mr-2" />
        Join Virtual Event
      </button>

      <!-- Secondary Actions - Calendar Integration -->
      <div class="pt-2 border-t border-slate-200">
        <p class="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3 text-center">
          Add to Calendar
        </p>
        <div class="grid grid-cols-3 gap-2">
          <CalendarButton provider="Google" @click="$emit('add-to-google-calendar')" />
          <CalendarButton provider="Outlook" @click="$emit('add-to-outlook-calendar')" />
          <CalendarButton provider=".ics" icon="download" @click="$emit('download-ics')" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserPlus, CheckCircle, ExternalLink } from 'lucide-vue-next'
import { type Event } from '../services/api'
import CalendarButton from './CalendarButton.vue'

interface Props {
  event: Event
  canRegister: boolean
  isRegistering: boolean
}

interface Emits {
  register: []
  'join-virtual': []
  'add-to-google-calendar': []
  'add-to-outlook-calendar': []
  'download-ics': []
}

defineProps<Props>()
defineEmits<Emits>()
</script>
