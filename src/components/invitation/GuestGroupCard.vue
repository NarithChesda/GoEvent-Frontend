<template>
  <div
    class="bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
  >
    <!-- Group Header -->
    <div
      @click="handleToggle"
      class="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <!-- Color Badge -->
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-md"
            :style="{ backgroundColor: group.color || '#3498db' }"
          >
            {{ group.guest_count }}
          </div>

          <!-- Group Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h4 class="text-base font-semibold text-slate-900">{{ group.name }}</h4>
            </div>
            <p v-if="group.description" class="text-sm text-slate-600 mb-2">{{ group.description }}</p>

            <!-- Stats Row -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span class="inline-flex items-center text-slate-600">
                <Users class="w-3.5 h-3.5 mr-1" />
                <span class="font-medium">{{ group.guest_count }} </span> guests
              </span>
              <span v-if="groupStats.sent > 0" class="inline-flex items-center text-blue-600">
                <Send class="w-3.5 h-3.5 mr-1" />
                <span class="font-medium">{{ groupStats.sent }}</span> sent
              </span>
              <span v-if="groupStats.viewed > 0" class="inline-flex items-center text-green-600">
                <Eye class="w-3.5 h-3.5 mr-1" />
                <span class="font-medium">{{ groupStats.viewed }}</span> viewed
              </span>
              <span v-if="groupStats.pending > 0" class="inline-flex items-center text-slate-500">
                <Clock class="w-3.5 h-3.5 mr-1" />
                <span class="font-medium">{{ groupStats.pending }}</span> pending
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            @click.stop="$emit('edit', group)"
            class="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Edit Group"
          >
            <Edit class="w-4 h-4" />
          </button>
          <button
            @click.stop="$emit('delete', group)"
            class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Group"
          >
            <Trash2 class="w-4 h-4" />
          </button>
          <svg
            class="w-5 h-5 text-slate-400 transition-transform"
            :class="{ 'rotate-180': isExpanded }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Group Guests (Expanded) -->
    <div v-if="isExpanded" class="border-t border-slate-200">
      <!-- Search and Pagination Controls (at top) -->
      <div class="p-3 bg-slate-50/50 border-b border-slate-200">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 text-xs">
          <!-- Search Input -->
          <div class="flex-1 min-w-0">
            <div class="relative">
              <input
                v-model="searchInput"
                @input="handleSearchInput"
                type="text"
                placeholder="Search guests..."
                class="w-full pl-8 pr-8 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                @click.stop
              />
              <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <button
                v-if="searchInput"
                @click.stop="clearSearch"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear search"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Guest Count -->
          <div class="text-slate-600 whitespace-nowrap hidden sm:block">
            Showing {{ ((currentPage - 1) * pageSize) + 1 }} - {{ Math.min(currentPage * pageSize, totalCount) }} of {{ totalCount }}
          </div>

          <!-- Pagination Buttons -->
          <div v-if="totalPages > 1" class="flex items-center gap-1 justify-center sm:justify-end">
            <button
              @click.stop="$emit('previous-page')"
              :disabled="currentPage === 1 || loading"
              class="px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span class="px-2 text-slate-700">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <button
              @click.stop="$emit('next-page')"
              :disabled="currentPage === totalPages || loading"
              class="px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Initial loading state (only when no guests yet) -->
      <div v-if="loading && guests.length === 0" class="p-4 text-center">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1e90ff] mx-auto"></div>
        <p class="text-xs text-slate-600 mt-2">Loading guests...</p>
      </div>

      <!-- Guest list (with loading overlay for pagination) -->
      <div v-else-if="guests.length > 0" class="relative">
        <!-- Subtle loading overlay for pagination -->
        <Transition name="fade">
          <div v-if="loading" class="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div class="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-md border border-slate-200">
              <div class="w-3 h-3 border-2 border-[#1e90ff] border-t-transparent rounded-full animate-spin"></div>
              <span class="text-xs text-slate-600">Loading...</span>
            </div>
          </div>
        </Transition>

        <!-- Select All Row -->
        <div v-if="guests.length > 0" class="px-4 py-3 bg-slate-50/50 border-b border-slate-200 flex items-center gap-3">
          <input
            type="checkbox"
            :checked="allSelected"
            @change="toggleSelectAll"
            class="w-4 h-4 rounded border-slate-300 text-[#1e90ff] focus:ring-[#1e90ff] focus:ring-offset-0 cursor-pointer"
          />
          <span class="text-sm text-slate-700 font-medium">
            {{ selectedCount > 0 ? `${selectedCount} selected` : 'Select all' }}
          </span>

          <!-- Bulk Actions -->
          <div v-if="selectedCount > 0" class="ml-auto flex items-center gap-2">
            <button
              @click="$emit('bulk-mark-sent')"
              class="px-3 py-1.5 text-xs rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1.5 font-medium"
            >
              <Send class="w-3.5 h-3.5" />
              Mark Sent
            </button>
            <button
              @click="$emit('bulk-delete')"
              class="px-3 py-1.5 text-xs rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-1.5 font-medium"
            >
              <Trash2 class="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>

        <!-- Scrollable Guest list -->
        <div class="max-h-96 overflow-y-auto divide-y divide-slate-100 transition-opacity duration-150" :class="{ 'opacity-40': loading }">
          <GuestListItem
            v-for="guest in guests"
            :key="guest.id"
            :guest="guest"
            :selected="isGuestSelected(guest.id)"
            @copy-link="(guest, lang) => $emit('copy-link', guest, lang)"
            @mark-sent="$emit('mark-sent', $event)"
            @edit="$emit('edit-guest', $event)"
            @delete="$emit('delete-guest', $event)"
            @toggle-select="handleToggleSelect"
          />
        </div>
      </div>

      <!-- No guests in group -->
      <div v-else-if="!loading" class="p-4 text-center">
        <p class="text-sm text-slate-500">No guests in this group yet</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Trash2, Search, X, Send, Users, Eye, Clock, Edit } from 'lucide-vue-next'
import type { GuestGroup, EventGuest } from '../../services/api'
import GuestListItem from './GuestListItem.vue'

// Props
const props = defineProps<{
  group: GuestGroup
  guests: EventGuest[]
  loading: boolean
  isExpanded: boolean
  currentPage: number
  totalCount: number
  pageSize: number
  searchTerm?: string
}>()

// Emits
const emit = defineEmits<{
  toggle: []
  edit: [group: GuestGroup]
  delete: [group: GuestGroup]
  'copy-link': [guest: EventGuest, language: 'en' | 'kh']
  'mark-sent': [guest: EventGuest]
  'edit-guest': [guest: EventGuest]
  'delete-guest': [guest: EventGuest]
  'next-page': []
  'previous-page': []
  'search': [searchTerm: string]
  'bulk-mark-sent': []
  'bulk-delete': []
}>()

// Local state
const searchInput = ref(props.searchTerm || '')
const selectedGuestIds = ref<Set<number>>(new Set())
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Watch for external search term changes
watch(() => props.searchTerm, (newValue) => {
  searchInput.value = newValue || ''
})

// Watch for page changes - clear selections when page changes
watch(() => props.currentPage, () => {
  selectedGuestIds.value.clear()
})

// Computed
const totalPages = computed(() => Math.ceil(props.totalCount / props.pageSize))

const selectedCount = computed(() => selectedGuestIds.value.size)

const allSelected = computed(() => {
  if (props.guests.length === 0) return false
  return props.guests.every(guest => selectedGuestIds.value.has(guest.id))
})

const groupStats = computed(() => {
  const sent = props.guests.filter(g => g.invitation_status === 'sent' || g.invitation_status === 'viewed').length
  const viewed = props.guests.filter(g => g.invitation_status === 'viewed').length
  const pending = props.guests.filter(g => g.invitation_status === 'not_sent').length

  return { sent, viewed, pending }
})

const handleToggle = () => {
  emit('toggle')
}

const handleSearchInput = () => {
  // Debounce search to avoid too many API calls
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    emit('search', searchInput.value)
  }, 300)
}

const clearSearch = () => {
  searchInput.value = ''
  emit('search', '')
}

const isGuestSelected = (guestId: number) => {
  return selectedGuestIds.value.has(guestId)
}

const handleToggleSelect = (guest: EventGuest) => {
  if (selectedGuestIds.value.has(guest.id)) {
    selectedGuestIds.value.delete(guest.id)
  } else {
    selectedGuestIds.value.add(guest.id)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    // Deselect all
    selectedGuestIds.value.clear()
  } else {
    // Select all current page guests
    props.guests.forEach(guest => {
      selectedGuestIds.value.add(guest.id)
    })
  }
}

// Expose selected guest IDs for parent component
defineExpose({
  selectedGuestIds,
  clearSelection: () => selectedGuestIds.value.clear(),
})
</script>

<style scoped>
/* Fade transition for loading overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
