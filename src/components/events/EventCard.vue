<template>
  <!-- Mobile Card -->
  <div
    v-if="variant === 'mobile'"
    class="glass-card rounded-2xl overflow-hidden cursor-pointer"
    @click="$emit('click')"
  >
    <div class="p-4 flex gap-3">
      <!-- Event Details -->
      <div class="flex-1 min-w-0">
        <!-- Time -->
        <div class="text-sm text-slate-400 mb-1">
          {{ formatEventTime(event.start_date) }}
        </div>

        <!-- Title -->
        <h3 class="text-base font-semibold text-slate-900 mb-2 line-clamp-2">
          {{ event.title }}
        </h3>

        <!-- Hosts (if available) -->
        <div
          v-if="hosts.length > 0"
          class="flex items-center gap-1.5 text-sm text-slate-500 mb-1.5"
        >
          <div class="flex -space-x-1">
            <div
              v-for="(host, idx) in hosts.slice(0, 2)"
              :key="idx"
              class="w-4 h-4 rounded-full border border-white overflow-hidden bg-slate-200"
            >
              <img
                v-if="host.image"
                :src="host.image"
                :alt="host.name"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white text-[8px] font-medium"
              >
                {{ host.name.charAt(0).toUpperCase() }}
              </div>
            </div>
          </div>
          <span class="truncate">By {{ hostNames }}</span>
        </div>

        <!-- Location -->
        <div class="flex items-center gap-1.5 text-sm mb-1.5">
          <template v-if="event.location">
            <MapPin class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span class="text-slate-500 truncate">{{ event.location }}</span>
          </template>
          <template v-else-if="showMissingLocation">
            <AlertTriangle class="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span class="text-amber-600">Location Missing</span>
          </template>
        </div>

        <!-- Guest Count -->
        <div class="flex items-center gap-1.5 text-sm text-slate-400">
          <Users class="w-3.5 h-3.5" />
          <span>{{ guestCount }}</span>
        </div>

        <!-- Manage Button (only for events user can edit) -->
        <button
          v-if="showManageButton"
          @click.stop="$emit('manage')"
          class="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          Manage Event
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Event Image (square on mobile) -->
      <div
        class="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100"
      >
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="event.title"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="w-full h-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 flex items-center justify-center"
        >
          <CalendarDays class="w-6 h-6 text-[#2ecc71]/60" />
        </div>
      </div>
    </div>
  </div>

  <!-- Desktop Card -->
  <div
    v-else
    class="glass-card rounded-2xl hover:shadow-lg hover:shadow-[#2ecc71]/10 transition-all duration-300 overflow-hidden cursor-pointer group"
    @click="$emit('click')"
  >
    <div class="p-5 flex gap-4">
      <!-- Event Details -->
      <div class="flex-1 min-w-0">
        <!-- Time and Category -->
        <div class="flex items-center gap-2 text-sm mb-1">
          <span class="text-slate-400">{{
            formatEventTime(event.start_date)
          }}</span>
          <span
            v-if="category"
            class="px-2 py-0.5 bg-gradient-to-r from-[#2ecc71]/10 to-[#1e90ff]/10 text-[#2ecc71] rounded-full text-xs font-medium"
          >
            {{ category }}
          </span>
        </div>

        <!-- Title -->
        <h3
          class="text-lg font-semibold text-slate-900 mb-2 group-hover:text-[#2ecc71] transition-colors"
        >
          {{ event.title }}
        </h3>

        <!-- Hosts -->
        <div
          v-if="hosts.length > 0"
          class="flex items-center gap-2 text-sm mb-2"
        >
          <div class="flex -space-x-1">
            <div
              v-for="(host, idx) in hosts.slice(0, 3)"
              :key="idx"
              class="w-5 h-5 rounded-full border border-white overflow-hidden bg-slate-200"
            >
              <img
                v-if="host.image"
                :src="host.image"
                :alt="host.name"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white text-xs font-medium"
              >
                {{ host.name.charAt(0).toUpperCase() }}
              </div>
            </div>
          </div>
          <span class="text-slate-600">By {{ hostNames }}</span>
        </div>

        <!-- Location -->
        <div class="flex items-center gap-2 text-sm mb-2">
          <template v-if="event.location">
            <MapPin class="w-4 h-4 text-slate-400" />
            <span class="text-slate-600">{{ event.location }}</span>
          </template>
          <template v-else-if="showMissingLocation">
            <AlertTriangle class="w-4 h-4 text-amber-500" />
            <span class="text-amber-600">Location Missing</span>
          </template>
        </div>

        <!-- Guest Count -->
        <div class="flex items-center gap-2 text-sm text-slate-500">
          <Users class="w-4 h-4" />
          <span>{{ guestCount }}</span>
        </div>

        <!-- Manage Button (only for events user can edit) -->
        <button
          v-if="showManageButton"
          @click.stop="$emit('manage')"
          class="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
        >
          Manage Event
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>

      <!-- Event Image (landscape) -->
      <div
        class="w-44 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100"
      >
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="event.title"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="w-full h-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 flex items-center justify-center"
        >
          <CalendarDays class="w-8 h-8 text-[#2ecc71]/60" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  MapPin,
  Users,
  ArrowRight,
  AlertTriangle,
  CalendarDays,
} from 'lucide-vue-next'
import type { Event } from '@/services/api'
import {
  formatEventTime,
  getGuestCount,
  getEventImage,
  getEventHosts,
  formatHostNames,
  getEventCategory,
} from '@/composables/useEventFormatters'

const props = withDefaults(
  defineProps<{
    event: Event
    variant?: 'mobile' | 'desktop'
    showManageButton?: boolean
    showMissingLocation?: boolean
  }>(),
  {
    variant: 'desktop',
    showManageButton: false,
    showMissingLocation: false,
  }
)

defineEmits<{
  click: []
  manage: []
}>()

const imageUrl = computed(() => getEventImage(props.event))
const hosts = computed(() => getEventHosts(props.event))
const hostNames = computed(() => formatHostNames(props.event))
const guestCount = computed(() => getGuestCount(props.event))
const category = computed(() => getEventCategory(props.event))
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 4px 6px -1px rgba(46, 204, 113, 0.05),
    0 2px 4px -1px rgba(30, 144, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.glass-card:hover {
  background: rgba(255, 255, 255, 0.85);
  border-color: rgba(46, 204, 113, 0.3);
}
</style>
