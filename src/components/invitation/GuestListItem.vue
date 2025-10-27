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
      <div class="flex-1 min-w-0 flex items-center gap-2">
        <p class="text-sm font-medium text-slate-900 truncate">{{ guest.name }}</p>
        <!-- Sent Status Checkmark -->
        <CheckCircle
          v-if="guest.invitation_status === 'sent' || guest.invitation_status === 'viewed'"
          class="w-4 h-4 text-blue-500 flex-shrink-0"
          title="Invitation sent"
        />
      </div>

      <!-- View Status Badge (only shown when viewed) -->
      <span
        v-if="guest.invitation_status === 'viewed'"
        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 bg-green-100 text-green-800"
      >
        <span class="w-1.5 h-1.5 rounded-full mr-1.5 bg-green-500"></span>
        <span class="hidden sm:inline">Viewed</span>
      </span>

      <!-- Action Buttons -->
      <div class="flex items-center gap-1 flex-shrink-0">
        <!-- Mark as Sent Button -->
        <button
          v-if="guest.invitation_status === 'not_sent'"
          @click.stop="$emit('mark-sent', guest)"
          class="px-2 py-1 text-xs rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1"
          title="Mark as sent"
        >
          <Send class="w-3 h-3" />
          <span class="hidden sm:inline">Sent</span>
        </button>
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
import { Trash2, CheckCircle, Send } from 'lucide-vue-next'
import type { EventGuest } from '../../services/api'

// Props
defineProps<{
  guest: EventGuest
}>()

// Emits
defineEmits<{
  view: [guest: EventGuest]
  'copy-link': [guest: EventGuest, language: 'en' | 'kh']
  'mark-sent': [guest: EventGuest]
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
</script>
