<template>
  <div
    class="p-3 hover:bg-slate-50/50 transition-colors cursor-pointer"
    @click="$emit('view', guest)"
  >
    <div class="flex items-center gap-2">
      <!-- Avatar -->
      <div
        class="w-8 h-8 rounded-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
      >
        {{ getInitials(guest.name) }}
      </div>

      <!-- Guest Info -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-900 truncate">{{ guest.name }}</p>
      </div>

      <!-- Status Badge -->
      <span
        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
        :class="getStatusClass(guest.invitation_status)"
      >
        <span
          class="w-1.5 h-1.5 rounded-full mr-1.5"
          :class="getStatusDotClass(guest.invitation_status)"
        ></span>
        <span class="hidden sm:inline">{{ getStatusDisplay(guest) }}</span>
      </span>

      <!-- Action Buttons -->
      <div class="flex items-center gap-1 flex-shrink-0">
        <button
          @click.stop="$emit('copy-link', guest, 'en')"
          class="px-2 py-1 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          title="Copy EN link"
        >
          EN
        </button>
        <button
          @click.stop="$emit('copy-link', guest, 'kh')"
          class="px-2 py-1 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          title="Copy KH link"
        >
          KH
        </button>
        <button
          @click.stop="$emit('delete', guest)"
          class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove Guest"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import type { EventGuest } from '../../services/api'

// Props
defineProps<{
  guest: EventGuest
}>()

// Emits
defineEmits<{
  view: [guest: EventGuest]
  'copy-link': [guest: EventGuest, language: 'en' | 'kh']
  delete: [guest: EventGuest]
}>()

// Helper functions
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'viewed':
      return 'bg-green-100 text-green-800'
    case 'sent':
      return 'bg-orange-100 text-orange-800'
    case 'not_sent':
      return 'bg-slate-100 text-slate-800'
    default:
      return 'bg-slate-100 text-slate-800'
  }
}

const getStatusDotClass = (status: string) => {
  switch (status) {
    case 'viewed':
      return 'bg-green-500'
    case 'sent':
      return 'bg-orange-500'
    case 'not_sent':
      return 'bg-slate-400'
    default:
      return 'bg-slate-400'
  }
}

const getStatusDisplay = (guest: EventGuest) => {
  return guest.invitation_status_display || guest.invitation_status
}
</script>
