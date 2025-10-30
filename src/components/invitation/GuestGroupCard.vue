<template>
  <div class="space-y-3">
    <!-- Collapsible Group Header -->
    <div
      @click="handleToggle"
      class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg shadow-emerald-500/10 p-5 hover:shadow-xl transition-all duration-300 cursor-pointer group"
    >
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <!-- Color Badge -->
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md"
            :style="{ backgroundColor: group.color || '#3498db' }"
          >
            {{ group.guest_count }}
          </div>

          <!-- Group Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h4 class="text-base font-bold text-slate-900">{{ group.name }}</h4>
              <ChevronDown
                class="w-5 h-5 text-slate-400 transition-transform duration-300"
                :class="{ 'rotate-180': isExpanded }"
              />
            </div>

            <!-- Stats Row -->
            <div class="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <div v-if="groupStats.sent > 0" class="flex items-center gap-1">
                <Send class="w-3.5 h-3.5" />
                <span>{{ groupStats.sent }} sent</span>
              </div>
              <span v-if="groupStats.sent > 0 && groupStats.viewed > 0" class="text-slate-300">•</span>
              <div v-if="groupStats.viewed > 0" class="flex items-center gap-1 text-green-600">
                <Eye class="w-3.5 h-3.5" />
                <span>{{ groupStats.viewed }} viewed</span>
              </div>
              <span v-if="(groupStats.sent > 0 || groupStats.viewed > 0) && groupStats.pending > 0" class="text-slate-300">•</span>
              <div v-if="groupStats.pending > 0" class="flex items-center gap-1">
                <Clock class="w-3.5 h-3.5" />
                <span>{{ groupStats.pending }} pending</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            @click.stop="$emit('edit', group)"
            aria-label="Edit group"
            title="Edit group"
            class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          >
            <Edit2 class="w-4 h-4" />
          </button>
          <button
            @click.stop="$emit('delete', group)"
            aria-label="Delete group"
            title="Delete group"
            class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Expanded Guest List -->
    <Transition name="expand">
      <div v-if="isExpanded" class="space-y-3">
        <!-- Search and Bulk Actions Bar -->
        <div class="bg-slate-50/50 rounded-xl p-4 border border-slate-200">
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <!-- Search Input -->
            <div class="flex-1 relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search class="w-4 h-4 text-slate-400" />
              </div>
              <input
                v-model="searchInput"
                @input="handleSearchInput"
                type="text"
                placeholder="Search in this group..."
                class="w-full pl-10 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                @click.stop
              />
              <button
                v-if="searchInput"
                @click.stop="clearSearch"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear search"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Bulk Actions (shown when guests are selected) -->
            <div v-if="selectedCount > 0" class="flex items-center gap-2">
              <span class="text-sm text-slate-600 font-medium">{{ selectedCount }} selected</span>
              <button
                @click="$emit('bulk-mark-sent')"
                class="px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1.5 font-medium"
              >
                <Send class="w-4 h-4" />
                Mark Sent
              </button>
              <button
                @click="$emit('bulk-delete')"
                class="px-3 py-2 text-sm rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-1.5 font-medium"
              >
                <Trash2 class="w-4 h-4" />
                Delete
              </button>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="flex items-center gap-2 text-sm">
              <span class="text-slate-600 whitespace-nowrap hidden sm:inline">
                {{ ((currentPage - 1) * pageSize) + 1 }}-{{ Math.min(currentPage * pageSize, totalCount) }} of {{ totalCount }}
              </span>
              <button
                @click.stop="$emit('previous-page')"
                :disabled="currentPage === 1 || loading"
                class="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <span class="text-slate-700">{{ currentPage }}/{{ totalPages }}</span>
              <button
                @click.stop="$emit('next-page')"
                :disabled="currentPage === totalPages || loading"
                class="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading && guests.length === 0" class="flex justify-center items-center py-12">
          <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <!-- Guest List -->
        <div v-else-if="guests.length > 0" class="space-y-3 relative">
          <!-- Loading overlay for pagination -->
          <Transition name="fade">
            <div v-if="loading" class="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
              <div class="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200">
                <div class="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span class="text-sm text-slate-600">Loading...</span>
              </div>
            </div>
          </Transition>

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

        <!-- Empty State -->
        <div v-else-if="!loading" class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-8 text-center">
          <Users class="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 class="font-semibold text-slate-600 mb-1">No Guests Found</h4>
          <p class="text-sm text-slate-400">{{ searchInput ? 'Try adjusting your search' : 'No guests in this group yet' }}</p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Trash2, Search, X, Send, Users, Eye, Clock, Edit2, ChevronDown } from 'lucide-vue-next'
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

/* Expand transition for guest list */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 2000px;
}
</style>
