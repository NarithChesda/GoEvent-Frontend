<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">Guest Management</h2>
      <p class="text-xs sm:text-sm text-slate-600 mt-1">Manage event invitations and guest responses</p>
    </div>

    <!-- Guest Statistics Card -->
    <div class="rounded-3xl border border-white/70 bg-white p-6 sm:p-8 shadow-lg shadow-slate-200/60">
      <GuestStatsCard :stats="guestStats" :loading="loadingStats" />
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
      <!-- Filter and Actions Bar - Clean Minimalist Design -->
      <div class="sticky top-0 z-20 mb-4">
        <div class="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-sm">
          <!-- Search Row (Mobile Only - appears first on mobile) -->
          <div class="p-3 pb-0 sm:hidden">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                ref="searchInputRef"
                id="guest-search"
                type="text"
                v-model="groupSearchQuery"
                @input="handleGroupSearch"
                placeholder="Search guests..."
                aria-label="Search guests by name, email, or phone"
                class="w-full pl-9 pr-8 py-2 bg-slate-50/50 border-0 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
              />
              <button
                v-if="groupSearchQuery"
                @click="clearGroupSearch"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Filter and Actions Row -->
          <div class="flex items-center gap-3 p-3">
            <!-- Select All Checkbox -->
            <label class="flex items-center cursor-pointer group flex-shrink-0">
              <input
                type="checkbox"
                :checked="isAllCurrentPageSelected"
                :indeterminate.prop="totalSelectedCount > 0 && !isAllCurrentPageSelected"
                @change="handleToggleSelectAll"
                class="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer transition-colors"
              />
            </label>

            <!-- Filter Dropdown -->
            <div class="relative" ref="tabsContainer">
              <button
                @click="isDropdownOpen = !isDropdownOpen"
                class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border"
                :class="activeFilter === 'all'
                  ? 'text-slate-700 bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  : 'text-white border-transparent'"
                :style="activeFilter !== 'all' ? {
                  backgroundColor: groups.find(g => g.id.toString() === activeFilter)?.color || '#3498db'
                } : {}"
              >
                <Filter class="w-4 h-4 flex-shrink-0" :class="activeFilter === 'all' ? 'text-slate-500' : 'text-white/80'" />
                <span class="truncate max-w-[100px] sm:max-w-[160px]">
                  {{ activeFilter === 'all' ? 'All Groups' : groups.find(g => g.id.toString() === activeFilter)?.name || 'Select' }}
                </span>
                <ChevronDown class="w-4 h-4 transition-transform flex-shrink-0" :class="[{ 'rotate-180': isDropdownOpen }, activeFilter === 'all' ? 'text-slate-400' : 'text-white/80']" />
              </button>

              <!-- Dropdown Menu -->
              <Transition name="dropdown">
                <div
                  v-if="isDropdownOpen"
                  class="absolute top-full left-0 mt-2 min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 z-[100] max-h-[320px] overflow-y-auto"
                  @click.stop
                >
                  <div class="p-1.5">
                    <!-- All Groups Option -->
                    <button
                      @click="selectFilter('all')"
                      :class="[
                        'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                        activeFilter === 'all'
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-700 hover:bg-slate-50'
                      ]"
                    >
                      <span class="flex-1 text-left">All Groups</span>
                      <span class="text-xs text-slate-400 tabular-nums">{{ totalGuestCount }}</span>
                    </button>

                    <!-- Divider -->
                    <div v-if="groups.length > 0" class="my-1.5 border-t border-slate-100"></div>

                    <!-- Individual Groups -->
                    <button
                      v-for="group in groups"
                      :key="group.id"
                      @click="selectFilter(group.id.toString())"
                      class="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150"
                      :class="activeFilter === group.id.toString() ? 'text-white' : 'text-slate-700 hover:bg-slate-50'"
                      :style="activeFilter === group.id.toString() ? {
                        backgroundColor: group.color || '#3498db'
                      } : {}"
                    >
                      <div
                        v-if="activeFilter !== group.id.toString()"
                        class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        :style="{ backgroundColor: group.color || '#3498db' }"
                      />
                      <span class="flex-1 text-left truncate">{{ group.name }}</span>
                      <span class="text-xs tabular-nums" :class="activeFilter === group.id.toString() ? 'text-white/70' : 'text-slate-400'">{{ group.guest_count }}</span>
                    </button>
                  </div>
                </div>
              </Transition>

              <!-- Click outside to close dropdown -->
              <div
                v-if="isDropdownOpen"
                @click="isDropdownOpen = false"
                class="fixed inset-0 z-[90]"
              ></div>
            </div>

            <!-- Divider -->
            <div class="w-px h-5 bg-slate-200 hidden sm:block"></div>

            <!-- Search Input (Desktop Only) -->
            <div class="hidden sm:block flex-1 min-w-0">
              <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="guest-search-desktop"
                  type="text"
                  v-model="groupSearchQuery"
                  @input="handleGroupSearch"
                  placeholder="Search guests..."
                  aria-label="Search guests by name, email, or phone"
                  class="w-full pl-9 pr-8 py-2 bg-slate-50/50 border-0 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                />
                <button
                  v-if="groupSearchQuery"
                  @click="clearGroupSearch"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- Guest Count -->
            <div class="flex items-center gap-1 text-sm text-slate-500 tabular-nums flex-shrink-0">
              <span class="font-medium text-slate-700">{{ loadedGuestCount }}</span>
              <span>/</span>
              <span>{{ paginationTotal }}</span>
            </div>

            <!-- Spacer to push Add button to the right on mobile -->
            <div class="flex-1 sm:hidden"></div>

            <!-- Add Guest Button -->
            <button
              @click="$emit('add-guest')"
              class="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all duration-200 flex-shrink-0"
            >
              <UserPlus class="w-4 h-4" />
              <span>Add Guest</span>
            </button>
          </div>

          <!-- Selection Actions Bar - Appears when items selected -->
          <Transition name="selection-bar">
            <div
              v-if="totalSelectedCount > 0"
              class="flex items-center justify-between gap-3 px-3 pb-3"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm text-slate-600">
                  <span class="font-semibold text-slate-900">{{ totalSelectedCount }}</span> selected
                </span>
              </div>
              <div class="flex items-center gap-1">
                <button
                  @click="handleBulkMarkSent"
                  class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Send class="w-3.5 h-3.5" />
                  <span class="hidden xs:inline">Mark Sent</span>
                </button>
                <button
                  @click="handleBulkDelete"
                  class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  <span class="hidden xs:inline">Delete</span>
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Content Area -->
      <!-- Loading State -->
      <div v-if="isAnyGroupLoading && !hasAnyGuests" class="flex justify-center items-center py-12">
        <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <!-- Guest List Items (Scrollable) -->
      <div v-else-if="hasAnyGuests">
        <!-- Scrollable container with max height -->
        <div
          ref="scrollContainerRef"
          class="max-h-[600px] overflow-y-auto space-y-2 pr-2 custom-scrollbar relative z-0"
        >
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

          <!-- Infinite Scroll Trigger -->
          <div
            ref="scrollTriggerRef"
            class="py-4 flex justify-center"
          >
            <!-- Loading more indicator -->
            <div v-if="isLoadingMore" class="flex items-center gap-2">
              <div class="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span class="text-sm text-slate-500">Loading more guests...</span>
            </div>
            <!-- End of list indicator -->
            <div v-else-if="!hasMoreToLoad && allFilteredGuests.length > 0" class="text-sm text-slate-400">
              All {{ paginationTotal }} guests loaded
            </div>
          </div>
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { UserPlus, Search, Filter, Users, X, Send, Trash2, ChevronDown } from 'lucide-vue-next'
import GuestListItem from './GuestListItem.vue'
import GuestStatsCard from './GuestStatsCard.vue'
import type { GuestGroup, EventGuest, GuestStats } from '../../services/api'

interface GroupPaginationData {
  currentPage: number
  totalCount: number
  guests: EventGuest[]
  loading: boolean
  loadingMore: boolean
  searchTerm: string
  hasLoaded: boolean
  hasMore: boolean
}

interface Props {
  groups: GuestGroup[]
  loadingGroups: boolean
  pageSize: number
  getGroupGuests: (groupId: number) => EventGuest[]
  isGroupLoading: (groupId: number) => boolean
  isGroupExpanded: (groupId: number) => boolean
  getGroupPagination: (groupId: number) => GroupPaginationData
  // All Groups pagination - now accepts the data directly instead of a getter function
  allGuestsPagination: GroupPaginationData
  isAllGuestsLoading: () => boolean
  loadAllGuests: (page: number, silent: boolean) => Promise<any>
  // Guest statistics
  guestStats: GuestStats | null
  loadingStats: boolean
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
  'search': [groupId: number, searchTerm: string]
  'search-all': [searchTerm: string]
  'load-more-all': []
  'load-more-group': [groupId: number]
  'bulk-mark-sent': [groupId: number, selectedIds: number[]]
  'bulk-delete': [groupId: number, selectedIds: number[]]
  'register-group-card': [groupId: number, el: any]
}>()

// Local state
const activeFilter = ref('all')
const groupSearchQuery = ref('')
const selectedGuestIds = ref<Set<number>>(new Set())
const isDropdownOpen = ref(false)
const isSearchExpanded = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Tab container ref
const tabsContainer = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

// Function to trigger group data loading based on active filter
const triggerGroupExpansion = () => {
  if (activeFilter.value === 'all') {
    // Load all guests without group filter
    props.loadAllGuests(1, false)
  } else {
    const groupId = parseInt(activeFilter.value)
    // Always emit toggle-group to ensure guests are loaded for this group
    // The parent handler will check if guests need to be loaded
    emit('toggle-group', groupId)
  }
}

// Watch for active filter changes - clear selections and trigger group expansion
watch(activeFilter, (newFilter) => {
  selectedGuestIds.value.clear()
  // Sync the search input with the actual search term from the composable
  if (newFilter === 'all') {
    groupSearchQuery.value = props.allGuestsPagination.searchTerm
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

// On mount, trigger expansion and sync search input
onMounted(() => {
  // Sync search input with current search state
  if (activeFilter.value === 'all') {
    groupSearchQuery.value = props.allGuestsPagination.searchTerm
  } else if (props.groups.length > 0) {
    const groupId = parseInt(activeFilter.value)
    const pagination = props.getGroupPagination(groupId)
    groupSearchQuery.value = pagination.searchTerm
  }

  // Always trigger expansion on mount to ensure initial data load
  // This handles both cases: when there are groups and when starting fresh
  triggerGroupExpansion()
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
    // Now properly reactive since it's a prop, not a function call
    return props.allGuestsPagination.guests
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
    return props.allGuestsPagination
  }
  // For specific group filter
  if (filteredGroups.value.length === 0) return null
  return props.getGroupPagination(filteredGroups.value[0].id)
})

const paginationTotal = computed(() => activePagination.value?.totalCount || 0)
const loadedGuestCount = computed(() => allFilteredGuests.value.length)

// Methods
const selectFilter = (filterId: string) => {
  activeFilter.value = filterId
  isDropdownOpen.value = false
}

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

// Watch for search expansion to auto-focus
watch(isSearchExpanded, (newValue) => {
  if (newValue && searchInputRef.value) {
    setTimeout(() => {
      searchInputRef.value?.focus()
    }, 100)
  }
})

// Watch for guest list changes to remove deleted guest IDs from selection (Issue 2)
watch(
  () => allFilteredGuests.value,
  (newGuests) => {
    const validGuestIds = new Set(newGuests.map(g => g.id))
    selectedGuestIds.value.forEach(id => {
      if (!validGuestIds.has(id)) {
        selectedGuestIds.value.delete(id)
      }
    })
  },
  { deep: true }
)

// Watch for search query changes to clear selections (Issue 3)
watch(groupSearchQuery, () => {
  selectedGuestIds.value.clear()
})

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
    allFilteredGuests.value.forEach((guest: EventGuest) => {
      selectedGuestIds.value.delete(guest.id)
    })
  } else {
    // Select all on current page
    allFilteredGuests.value.forEach((guest: EventGuest) => {
      selectedGuestIds.value.add(guest.id)
    })
  }
}

const handleBulkMarkSent = () => {
  // Get selected IDs as array
  const selectedIds = Array.from(selectedGuestIds.value)

  if (activeFilter.value === 'all') {
    // For "All Groups" view, emit once with a special groupId (0 or -1) and all selected IDs
    // The parent will handle the bulk operation directly without needing group context
    emit('bulk-mark-sent', 0, selectedIds)
  } else {
    // For specific group filter, emit event for each group that has selected guests
    filteredGroups.value.forEach(group => {
      const groupGuests = props.getGroupGuests(group.id)
      const groupSelectedIds = selectedIds.filter(id =>
        groupGuests.some(g => g.id === id)
      )

      if (groupSelectedIds.length > 0) {
        emit('bulk-mark-sent', group.id, groupSelectedIds)
      }
    })
  }

  // DON'T clear selection here - let parent control it after operation completes
}

const handleBulkDelete = () => {
  // Get selected IDs as array
  const selectedIds = Array.from(selectedGuestIds.value)

  if (activeFilter.value === 'all') {
    // For "All Groups" view, emit once with a special groupId (0 or -1) and all selected IDs
    // The parent will handle the bulk operation directly without needing group context
    emit('bulk-delete', 0, selectedIds)
  } else {
    // For specific group filter, emit event for each group that has selected guests
    filteredGroups.value.forEach(group => {
      const groupGuests = props.getGroupGuests(group.id)
      const groupSelectedIds = selectedIds.filter(id =>
        groupGuests.some(g => g.id === id)
      )

      if (groupSelectedIds.length > 0) {
        emit('bulk-delete', group.id, groupSelectedIds)
      }
    })
  }

  // DON'T clear selection here - let parent control it after operation completes
}

// Infinite scroll trigger element ref
const scrollTriggerRef = ref<HTMLElement | null>(null)
const scrollContainerRef = ref<HTMLElement | null>(null)

// Computed properties for infinite scroll state
const isLoadingMore = computed(() => {
  if (activeFilter.value === 'all') {
    return props.allGuestsPagination.loadingMore
  }
  return filteredGroups.value.some(group => props.getGroupPagination(group.id).loadingMore)
})

const hasMoreToLoad = computed(() => {
  if (activeFilter.value === 'all') {
    return props.allGuestsPagination.hasMore
  }
  return filteredGroups.value.some(group => props.getGroupPagination(group.id).hasMore)
})

// Handle load more for infinite scroll
const handleLoadMore = () => {
  if (isLoadingMore.value || !hasMoreToLoad.value) return

  if (activeFilter.value === 'all') {
    emit('load-more-all')
  } else {
    filteredGroups.value.forEach(group => {
      emit('load-more-group', group.id)
    })
  }
}

// IntersectionObserver for infinite scroll
let intersectionObserver: IntersectionObserver | null = null

const setupIntersectionObserver = () => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMoreToLoad.value && !isLoadingMore.value) {
        handleLoadMore()
      }
    },
    {
      root: scrollContainerRef.value,
      rootMargin: '100px', // Trigger 100px before reaching the bottom
      threshold: 0.1,
    }
  )

  if (scrollTriggerRef.value) {
    intersectionObserver.observe(scrollTriggerRef.value)
  }
}

// Watch for scroll trigger element to be available
watch(scrollTriggerRef, (newRef) => {
  if (newRef) {
    setupIntersectionObserver()
  }
})

// Re-setup observer when filter changes (content changes)
watch(activeFilter, async () => {
  // Wait for next tick to ensure DOM has updated with new content
  await nextTick()
  setupIntersectionObserver()
})

// Cleanup observer on unmount
onUnmounted(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }
})

// ============================================================================
// EXPOSE METHODS FOR PARENT CONTROL
// ============================================================================

/**
 * Expose methods to allow parent component to control selection state
 * This enables proper parent-child communication for bulk operations
 */
defineExpose({
  /**
   * Clear all selected guest IDs
   * Used by parent after successful bulk operations
   */
  clearSelection: () => {
    selectedGuestIds.value.clear()
  },

  /**
   * Restore selection to a specific set of IDs
   * Used by parent to restore selection after failed bulk operations
   */
  restoreSelection: (ids: number[]) => {
    selectedGuestIds.value.clear()
    ids.forEach(id => selectedGuestIds.value.add(id))
  },

  /**
   * Get current selection as an array
   * Used by parent to capture selection before bulk operations
   */
  getSelection: (): number[] => {
    return Array.from(selectedGuestIds.value)
  }
})
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

/* Dropdown transition - See DROPDOWN_STYLING_GUIDE.md for full documentation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Selection bar transition */
.selection-bar-enter-active,
.selection-bar-leave-active {
  transition: all 0.2s ease;
}

.selection-bar-enter-from,
.selection-bar-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
