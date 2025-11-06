<template>
  <div class="space-y-6">
    <!-- Header with Add Guest Button -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-slate-900">Guest List</h3>
        <p class="text-sm text-slate-500 mt-1">Manage event invitations and guest responses</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Search & Filter -->
        <div class="relative flex-1 sm:flex-initial">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="w-4 h-4 text-slate-400" />
          </div>
          <input
            id="guest-search"
            type="text"
            v-model="groupSearchQuery"
            @input="handleGroupSearch"
            placeholder="Search guests..."
            aria-label="Search guests by name, email, or phone"
            class="w-full sm:w-64 pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
          />
          <button
            v-if="groupSearchQuery"
            @click="clearGroupSearch"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            title="Clear search"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
        <button
          @click="$emit('add-guest')"
          class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105 whitespace-nowrap"
        >
          <UserPlus class="w-4 h-4" />
          <span class="hidden sm:inline">Add Guest</span>
        </button>
      </div>
    </div>

    <!-- Filter Pills (Guest Groups) -->
    <div
      ref="tabsContainer"
      role="tablist"
      aria-label="Guest groups filter"
      class="flex items-center gap-2 overflow-x-auto scrollbar-visible pb-2 scroll-smooth"
    >
      <button
        role="tab"
        :aria-selected="activeFilter === 'all'"
        :aria-controls="'guests-panel'"
        @click="activeFilter = 'all'"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0',
          activeFilter === 'all'
            ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
            : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
        ]"
      >
        <Filter class="w-4 h-4" />
        <span>All Groups ({{ totalGuestCount }})</span>
      </button>

      <button
        v-for="group in groups"
        :key="group.id"
        role="tab"
        :aria-selected="activeFilter === group.id.toString()"
        :aria-controls="'guests-panel'"
        @click="activeFilter = group.id.toString()"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0',
          activeFilter === group.id.toString()
            ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-md'
            : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
        ]"
      >
        <div
          class="w-2 h-2 rounded-full"
          :style="{ backgroundColor: activeFilter === group.id.toString() ? 'white' : (group.color || '#3498db') }"
        />
        <span>{{ group.name }} ({{ group.guest_count }})</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loadingGroups" class="flex justify-center items-center py-12">
      <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Empty State - Add Guest Card -->
    <div
      v-else-if="groups.length === 0"
      @click="$emit('add-guest')"
      class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-12 hover:bg-slate-100/50 hover:border-emerald-400 transition-all duration-300 cursor-pointer group"
    >
      <div class="flex flex-col items-center justify-center">
        <div class="w-16 h-16 bg-slate-200 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300">
          <UserPlus class="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </div>
        <h4 class="font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Add First Guest</h4>
        <p class="text-sm text-slate-400 mt-1">Start building your guest list for the event</p>
      </div>
    </div>

    <!-- Guest List -->
    <div
      v-else
      id="guests-panel"
      role="tabpanel"
      :aria-label="`${activeFilter === 'all' ? 'All groups' : groups.find(g => g.id.toString() === activeFilter)?.name || ''} guests`"
      class="space-y-4"
    >
      <!-- Loading State -->
      <div v-if="isAnyGroupLoading && !hasAnyGuests" class="flex justify-center items-center py-12">
        <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Guest List Items (Scrollable) -->
      <div v-else-if="hasAnyGuests" class="space-y-4">
        <!-- Combined Selection, Actions, and Pagination Bar -->
        <div class="flex flex-col lg:flex-row items-center justify-between gap-3 py-3 px-5 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm">
          <!-- Left: Select All & Selection Count -->
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                :checked="isAllCurrentPageSelected"
                :indeterminate.prop="totalSelectedCount > 0 && !isAllCurrentPageSelected"
                @change="handleToggleSelectAll"
                class="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              />
              <span class="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Select All</span>
            </label>

            <!-- Selection actions (shown when guests are selected) -->
            <div v-if="totalSelectedCount > 0" class="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200">
              <span class="text-sm text-slate-600 font-medium">{{ totalSelectedCount }} selected</span>
              <button
                @click="handleBulkMarkSent"
                class="px-2.5 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1.5 font-medium"
              >
                <Send class="w-3.5 h-3.5" />
                Mark Sent
              </button>
              <button
                @click="handleBulkDelete"
                class="px-2.5 py-1.5 text-xs rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center gap-1.5 font-medium"
              >
                <Trash2 class="w-3.5 h-3.5" />
                Delete
              </button>
            </div>

            <!-- Guest count info (shown when no selections) -->
            <div v-else class="text-sm text-slate-600 ml-2 pl-3 border-l border-slate-200">
              Showing <span class="font-semibold text-slate-900">{{ paginationStart }}-{{ paginationEnd }}</span> of <span class="font-semibold text-slate-900">{{ paginationTotal }}</span> guests
            </div>
          </div>

          <!-- Right: Pagination controls -->
          <div v-if="showPagination" class="flex items-center gap-2">
            <button
              @click="handlePreviousPage"
              :disabled="currentPageNumber === 1 || isAnyGroupLoading"
              class="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              :title="currentPageNumber === 1 ? 'First page' : 'Previous page'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div class="flex items-center gap-1 px-3">
              <span class="text-sm font-medium text-slate-900">{{ currentPageNumber }}</span>
              <span class="text-sm text-slate-400">/</span>
              <span class="text-sm text-slate-600">{{ totalPagesCount }}</span>
            </div>

            <button
              @click="handleNextPage"
              :disabled="currentPageNumber >= totalPagesCount || isAnyGroupLoading"
              class="p-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              :title="currentPageNumber >= totalPagesCount ? 'Last page' : 'Next page'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Scrollable container with max height -->
        <div class="max-h-[600px] overflow-y-auto space-y-2 pr-2 custom-scrollbar relative">
          <!-- Loading overlay for pagination -->
          <Transition name="fade">
            <div v-if="isAnyGroupLoading" class="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
              <div class="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200">
                <div class="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span class="text-sm text-slate-600">Loading...</span>
              </div>
            </div>
          </Transition>

          <GuestListItem
            v-for="guest in allFilteredGuests"
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

      <!-- Empty State -->
      <div v-else class="bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-2xl p-12 text-center">
        <Users class="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h4 class="font-semibold text-slate-600 mb-1">No Guests Found</h4>
        <p class="text-sm text-slate-400">{{ groupSearchQuery ? 'Try adjusting your search' : 'No guests in this group yet' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { UserPlus, Search, Filter, Users, X, Send, Trash2 } from 'lucide-vue-next'
import GuestListItem from './GuestListItem.vue'
import type { GuestGroup, EventGuest } from '../../services/api'

interface Props {
  groups: GuestGroup[]
  loadingGroups: boolean
  pageSize: number
  getGroupGuests: (groupId: number) => EventGuest[]
  isGroupLoading: (groupId: number) => boolean
  isGroupExpanded: (groupId: number) => boolean
  getGroupPagination: (groupId: number) => {
    currentPage: number
    totalCount: number
    searchTerm: string
  }
  // All Groups pagination
  getAllGuestsPagination: () => {
    currentPage: number
    totalCount: number
    guests: EventGuest[]
    loading: boolean
    searchTerm: string
  }
  isAllGuestsLoading: () => boolean
  loadAllGuests: (page: number, silent: boolean) => Promise<any>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'add-guest': []
  'toggle-group': [groupId: number]
  'edit-group': [group: GuestGroup]
  'delete-group': [group: GuestGroup]
  'copy-link': [guest: EventGuest, language: 'en' | 'kh']
  'mark-sent': [guest: EventGuest]
  'edit-guest': [guest: EventGuest]
  'delete-guest': [guest: EventGuest]
  'next-page': [groupId: number]
  'previous-page': [groupId: number]
  'search': [groupId: number, searchTerm: string]
  'next-all-page': []
  'previous-all-page': []
  'search-all': [searchTerm: string]
  'bulk-mark-sent': [groupId: number, selectedIds: number[]]
  'bulk-delete': [groupId: number, selectedIds: number[]]
  'register-group-card': [groupId: number, el: any]
}>()

// Local state
const activeFilter = ref('all')
const groupSearchQuery = ref('')
const selectedGuestIds = ref<Set<number>>(new Set())
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Tab container ref
const tabsContainer = ref<HTMLElement | null>(null)

// Function to trigger group expansion based on active filter
const triggerGroupExpansion = () => {
  if (activeFilter.value === 'all') {
    // Load all guests without group filter
    props.loadAllGuests(1, false)
  } else {
    const groupId = parseInt(activeFilter.value)
    if (!props.isGroupExpanded(groupId)) {
      emit('toggle-group', groupId)
    }
  }
}

// Watch for active filter changes - clear selections and trigger group expansion
watch(activeFilter, (newFilter) => {
  selectedGuestIds.value.clear()
  // Sync the search input with the actual search term from the composable
  if (newFilter === 'all') {
    groupSearchQuery.value = props.getAllGuestsPagination().searchTerm
  } else {
    const groupId = parseInt(newFilter)
    const pagination = props.getGroupPagination(groupId)
    groupSearchQuery.value = pagination.searchTerm
  }
  triggerGroupExpansion()
})

// Watch for groups prop changes - trigger expansion when groups are loaded
watch(() => props.groups, (newGroups, oldGroups) => {
  // Only trigger if groups were just loaded (went from empty to having groups)
  if (oldGroups && oldGroups.length === 0 && newGroups.length > 0) {
    triggerGroupExpansion()
  }
}, { immediate: false })

// On mount, trigger expansion if groups are already loaded and sync search input
onMounted(() => {
  if (props.groups.length > 0) {
    // Sync search input with current search state
    if (activeFilter.value === 'all') {
      groupSearchQuery.value = props.getAllGuestsPagination().searchTerm
    } else {
      const groupId = parseInt(activeFilter.value)
      const pagination = props.getGroupPagination(groupId)
      groupSearchQuery.value = pagination.searchTerm
    }
    triggerGroupExpansion()
  }
})

// Computed properties
const totalGuestCount = computed(() => {
  return props.groups.reduce((sum, group) => sum + group.guest_count, 0)
})

const filteredGroups = computed(() => {
  if (activeFilter.value === 'all') {
    return props.groups
  }
  return props.groups.filter(group => group.id.toString() === activeFilter.value)
})

const allFilteredGuests = computed(() => {
  if (activeFilter.value === 'all') {
    // Return guests from allGroupsPagination
    return props.getAllGuestsPagination().guests
  }

  // For specific group filter, return guests from that group
  const guests: EventGuest[] = []
  filteredGroups.value.forEach(group => {
    const groupGuests = props.getGroupGuests(group.id)
    guests.push(...groupGuests)
  })
  return guests
})

const hasAnyGuests = computed(() => {
  return allFilteredGuests.value.length > 0
})

const hasGuestsInFilteredGroups = computed(() => {
  return filteredGroups.value.some(group => group.guest_count > 0)
})

const isAnyGroupLoading = computed(() => {
  if (activeFilter.value === 'all') {
    return props.isAllGuestsLoading()
  }
  return filteredGroups.value.some(group => props.isGroupLoading(group.id))
})

const totalSelectedCount = computed(() => selectedGuestIds.value.size)

// Pagination computed properties
const activePagination = computed(() => {
  if (activeFilter.value === 'all') {
    return props.getAllGuestsPagination()
  }
  // For specific group filter
  if (filteredGroups.value.length === 0) return null
  return props.getGroupPagination(filteredGroups.value[0].id)
})

const showPagination = computed(() => {
  if (!activePagination.value) return false
  return Math.ceil(activePagination.value.totalCount / props.pageSize) > 1
})

const currentPageNumber = computed(() => activePagination.value?.currentPage || 1)
const paginationTotal = computed(() => activePagination.value?.totalCount || 0)
const totalPagesCount = computed(() => Math.ceil(paginationTotal.value / props.pageSize))
const paginationStart = computed(() => ((currentPageNumber.value - 1) * props.pageSize) + 1)
const paginationEnd = computed(() => Math.min(currentPageNumber.value * props.pageSize, paginationTotal.value))

// Methods
const handleGroupSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    if (activeFilter.value === 'all') {
      emit('search-all', groupSearchQuery.value)
    } else {
      filteredGroups.value.forEach(group => {
        emit('search', group.id, groupSearchQuery.value)
      })
    }
  }, 300)
}

const clearGroupSearch = () => {
  groupSearchQuery.value = ''
  if (activeFilter.value === 'all') {
    emit('search-all', '')
  } else {
    filteredGroups.value.forEach(group => {
      emit('search', group.id, '')
    })
  }
}

const handleToggleSelect = (guest: EventGuest) => {
  if (selectedGuestIds.value.has(guest.id)) {
    selectedGuestIds.value.delete(guest.id)
  } else {
    selectedGuestIds.value.add(guest.id)
  }
}

const isGuestSelected = (guestId: number) => {
  return selectedGuestIds.value.has(guestId)
}

const isAllCurrentPageSelected = computed(() => {
  if (allFilteredGuests.value.length === 0) return false
  return allFilteredGuests.value.every(guest => selectedGuestIds.value.has(guest.id))
})

const handleToggleSelectAll = () => {
  if (isAllCurrentPageSelected.value) {
    // Deselect all on current page
    allFilteredGuests.value.forEach(guest => {
      selectedGuestIds.value.delete(guest.id)
    })
  } else {
    // Select all on current page
    allFilteredGuests.value.forEach(guest => {
      selectedGuestIds.value.add(guest.id)
    })
  }
}

const handleBulkMarkSent = () => {
  // Get selected IDs as array
  const selectedIds = Array.from(selectedGuestIds.value)

  // Emit event for each group that has selected guests
  filteredGroups.value.forEach(group => {
    const groupGuests = props.getGroupGuests(group.id)
    const groupSelectedIds = selectedIds.filter(id =>
      groupGuests.some(g => g.id === id)
    )

    if (groupSelectedIds.length > 0) {
      emit('bulk-mark-sent', group.id, groupSelectedIds)
    }
  })

  // Clear selection after emitting
  selectedGuestIds.value.clear()
}

const handleBulkDelete = () => {
  // Get selected IDs as array
  const selectedIds = Array.from(selectedGuestIds.value)

  // Emit event for each group that has selected guests
  filteredGroups.value.forEach(group => {
    const groupGuests = props.getGroupGuests(group.id)
    const groupSelectedIds = selectedIds.filter(id =>
      groupGuests.some(g => g.id === id)
    )

    if (groupSelectedIds.length > 0) {
      emit('bulk-delete', group.id, groupSelectedIds)
    }
  })

  // Clear selection after emitting
  selectedGuestIds.value.clear()
}

const handlePreviousPage = () => {
  if (activeFilter.value === 'all') {
    emit('previous-all-page')
  } else {
    filteredGroups.value.forEach(group => {
      emit('previous-page', group.id)
    })
  }
  selectedGuestIds.value.clear()
}

const handleNextPage = () => {
  if (activeFilter.value === 'all') {
    emit('next-all-page')
  } else {
    filteredGroups.value.forEach(group => {
      emit('next-page', group.id)
    })
  }
  selectedGuestIds.value.clear()
}
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Visible scrollbar for tabs container */
.scrollbar-visible {
  scrollbar-width: auto;
  scrollbar-color: rgb(203 213 225) rgb(241 245 249);
}

.scrollbar-visible::-webkit-scrollbar {
  height: 8px;
}

.scrollbar-visible::-webkit-scrollbar-track {
  background: rgb(241 245 249);
  border-radius: 4px;
}

.scrollbar-visible::-webkit-scrollbar-thumb {
  background: rgb(203 213 225);
  border-radius: 4px;
  transition: background 0.2s;
}

.scrollbar-visible::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184);
}

/* Custom scrollbar for guest list */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(203 213 225);
  border-radius: 4px;
  transition: background 0.2s;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184);
}

/* Fade transition for loading overlay and scroll buttons */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
