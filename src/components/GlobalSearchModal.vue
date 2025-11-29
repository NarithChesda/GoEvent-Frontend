<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="close"></div>

        <!-- Modal -->
        <div
          class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          @keydown.escape="close"
          @keydown.up.prevent="navigateUp"
          @keydown.down.prevent="navigateDown"
          @keydown.enter.prevent="selectCurrent"
        >
          <!-- Search Input -->
          <div class="relative border-b border-slate-100">
            <Search class="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref="searchInput"
              v-model="query"
              type="text"
              :placeholder="searchPlaceholder"
              class="w-full pl-14 pr-20 py-5 text-lg text-slate-900 placeholder-slate-400 focus:outline-none"
              autocomplete="off"
            />
            <div class="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <kbd class="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-400 bg-slate-100 rounded">
                <Command class="w-3 h-3" />K
              </kbd>
              <button
                @click="close"
                class="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Results Container -->
          <div class="max-h-[60vh] overflow-y-auto">
            <!-- Loading State -->
            <div v-if="isLoading && hasQuery" class="p-4 space-y-4">
              <div v-for="i in 3" :key="i" class="animate-pulse">
                <div class="h-4 bg-slate-200 rounded w-24 mb-3"></div>
                <div class="space-y-2">
                  <div class="h-12 bg-slate-100 rounded-lg"></div>
                  <div class="h-12 bg-slate-100 rounded-lg"></div>
                </div>
              </div>
            </div>

            <!-- Results -->
            <div v-else-if="hasQuery" class="py-2">
              <!-- My Events Section (only show when in events context or other) -->
              <div v-if="showMyEventsSection && results.myEvents.length > 0" class="mb-4">
                <div class="px-5 py-2 flex items-center gap-2">
                  <Ticket class="w-4 h-4 text-slate-400" />
                  <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {{ currentContext === 'events' ? 'Your Events' : 'My Events' }}
                  </span>
                </div>
                <div>
                  <button
                    v-for="(result, index) in results.myEvents"
                    :key="result.id"
                    @click="navigateToResult(result)"
                    @mouseenter="setSelectedIndex(index)"
                    class="w-full px-5 py-3 flex items-center gap-4 text-left transition-colors"
                    :class="selectedIndex === index ? 'bg-gradient-to-r from-[#2ecc71]/10 to-[#1e90ff]/10' : 'hover:bg-slate-50'"
                  >
                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 flex items-center justify-center flex-shrink-0">
                      <CalendarDays class="w-5 h-5 text-[#2ecc71]" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-slate-900 truncate">{{ result.title }}</div>
                      <div class="flex items-center gap-2 text-sm text-slate-500">
                        <span>{{ formatDate(result.date) }}</span>
                        <span v-if="result.category" class="px-1.5 py-0.5 bg-slate-100 rounded text-xs">{{ result.category }}</span>
                      </div>
                    </div>
                    <ArrowRight class="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </button>
                </div>
              </div>

              <!-- Discover Section (only show when in explore context or other) -->
              <div v-if="showDiscoverSection && results.discover.length > 0" class="mb-4">
                <div class="px-5 py-2 flex items-center gap-2">
                  <Compass class="w-4 h-4 text-slate-400" />
                  <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {{ currentContext === 'explore' ? 'Public Events' : 'Discover' }}
                  </span>
                </div>
                <div>
                  <button
                    v-for="(result, index) in results.discover"
                    :key="result.id"
                    @click="navigateToResult(result)"
                    @mouseenter="setSelectedIndex(getDiscoverIndex(index))"
                    class="w-full px-5 py-3 flex items-center gap-4 text-left transition-colors"
                    :class="selectedIndex === getDiscoverIndex(index) ? 'bg-gradient-to-r from-[#2ecc71]/10 to-[#1e90ff]/10' : 'hover:bg-slate-50'"
                  >
                    <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Globe class="w-5 h-5 text-slate-500" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-slate-900 truncate">{{ result.title }}</div>
                      <div class="flex items-center gap-2 text-sm text-slate-500">
                        <span>{{ formatDate(result.date) }}</span>
                        <template v-if="result.location">
                          <MapPin class="w-3 h-3" />
                          <span class="truncate max-w-[150px]">{{ result.location }}</span>
                        </template>
                        <span v-else-if="result.isVirtual" class="text-blue-500">Virtual</span>
                      </div>
                    </div>
                    <ArrowRight class="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </button>
                </div>
              </div>

              <!-- Services Section (only show when in services context or other) -->
              <div v-if="showServicesSection" class="mb-4">
                <div class="px-5 py-2 flex items-center gap-2">
                  <Briefcase class="w-4 h-4 text-slate-400" />
                  <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Services</span>
                </div>
                <div class="px-5 py-4 text-center">
                  <div class="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg text-sm text-slate-500">
                    <Sparkles class="w-4 h-4" />
                    <span>Service search coming soon</span>
                  </div>
                </div>
              </div>

              <!-- No Results -->
              <div
                v-if="!hasResults && !isLoading"
                class="py-12 text-center"
              >
                <div class="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <SearchX class="w-8 h-8 text-slate-400" />
                </div>
                <p class="text-slate-600 font-medium">No results found</p>
                <p class="text-sm text-slate-400 mt-1">Try a different search term</p>
              </div>
            </div>

            <!-- Empty State (no query) -->
            <div v-else class="py-12 text-center">
              <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 rounded-full flex items-center justify-center">
                <component :is="contextIcon" class="w-8 h-8 text-[#2ecc71]" />
              </div>
              <p class="text-slate-600 font-medium">{{ emptyStateTitle }}</p>
              <p class="text-sm text-slate-400 mt-1">{{ emptyStateSubtitle }}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-slate-100 px-5 py-3 flex items-center justify-between text-xs text-slate-400">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-slate-100 rounded">↑</kbd>
                <kbd class="px-1.5 py-0.5 bg-slate-100 rounded">↓</kbd>
                <span class="ml-1">to navigate</span>
              </span>
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-slate-100 rounded">↵</kbd>
                <span class="ml-1">to select</span>
              </span>
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-slate-100 rounded">esc</kbd>
                <span class="ml-1">to close</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import {
  Search,
  X,
  Command,
  CalendarDays,
  Ticket,
  Compass,
  Briefcase,
  Globe,
  MapPin,
  ArrowRight,
  Sparkles,
  SearchX
} from 'lucide-vue-next'
import { useGlobalSearch } from '@/composables/useGlobalSearch'

const {
  isOpen,
  query,
  isLoading,
  results,
  selectedIndex,
  isAuthenticated,
  hasResults,
  hasQuery,
  currentContext,
  close,
  navigateUp,
  navigateDown,
  selectCurrent,
  navigateToResult
} = useGlobalSearch()

const searchInput = ref<HTMLInputElement | null>(null)

// Context-aware UI
const showMyEventsSection = computed(() => {
  return isAuthenticated.value && (currentContext.value === 'events' || currentContext.value === 'other')
})

const showDiscoverSection = computed(() => {
  return currentContext.value === 'explore' || currentContext.value === 'other'
})

const showServicesSection = computed(() => {
  return currentContext.value === 'services' || currentContext.value === 'other'
})

const searchPlaceholder = computed(() => {
  switch (currentContext.value) {
    case 'events':
      return 'Search your events...'
    case 'explore':
      return 'Search public events...'
    case 'services':
      return 'Search services...'
    default:
      return 'Search events...'
  }
})

const contextIcon = computed(() => {
  switch (currentContext.value) {
    case 'events':
      return Ticket
    case 'explore':
      return Compass
    case 'services':
      return Briefcase
    default:
      return Search
  }
})

const emptyStateTitle = computed(() => {
  switch (currentContext.value) {
    case 'events':
      return 'Search your events'
    case 'explore':
      return 'Search public events'
    case 'services':
      return 'Search services'
    default:
      return 'Search for events'
  }
})

const emptyStateSubtitle = computed(() => {
  switch (currentContext.value) {
    case 'events':
      return 'Find your organized and collaborated events'
    case 'explore':
      return 'Discover events by name, location, or category'
    case 'services':
      return 'Find vendors and services for your events'
    default:
      return 'Find events by name, location, or category'
  }
})

// Focus input when modal opens
watch(isOpen, async (open) => {
  if (open) {
    await nextTick()
    searchInput.value?.focus()
  }
})

// Calculate index for discover section (offset by myEvents length when both are shown)
const getDiscoverIndex = (localIndex: number): number => {
  if (currentContext.value === 'explore') {
    // In explore context, discover is the only section
    return localIndex
  }
  // In other contexts, offset by myEvents length
  return results.value.myEvents.length + localIndex
}

const setSelectedIndex = (index: number) => {
  selectedIndex.value = index
}

// Format date for display
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>

<style scoped>
/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Smooth scrollbar */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: #cbd5e1;
}
</style>
