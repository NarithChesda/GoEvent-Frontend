<template>
  <MainLayout>
    <div
      class="min-h-screen bg-gradient-to-r from-[#2ecc71]/[0.02] via-white to-[#1e90ff]/[0.02]"
    >
      <!-- Mobile Top Bar -->
      <MobileTopBar @search="openSearch" />

      <!-- Main Content -->
      <section class="py-4 sm:py-6 lg:py-8">
        <div class="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Header with Toggle -->
          <div class="flex items-center justify-between mb-6 sm:mb-8 lg:mb-10">
            <h1
              class="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900"
            >
              Discover
            </h1>

            <!-- Date Range Toggle -->
            <TimeFilterToggle
              v-model="dateFilter"
              :options="dateFilterOptions"
            />

            <!-- Category Filter Dropdown - Desktop only -->
            <CategoryFilter
              v-model="categoryFilter"
              :categories="categories"
              variant="dropdown"
              @update:model-value="handleCategoryChange"
            />
          </div>

          <!-- Mobile Category Filter Pills -->
          <CategoryFilter
            v-if="categories.length > 0"
            v-model="categoryFilter"
            :categories="categories"
            variant="pills"
            @update:model-value="handleCategoryChange"
          />

          <!-- Loading State -->
          <EventsLoadingSkeleton v-if="isLoading" />

          <!-- Events Timeline -->
          <EventTimeline
            v-else-if="hasEvents"
            :date-groups="groupedByDate"
            :show-manage-button="false"
            :show-missing-location="false"
            @event-click="viewEvent"
            @login-required="handleLoginRequired"
            @like-changed="handleLikeChanged"
          />

          <!-- Infinite Scroll Loading Indicator -->
          <div
            v-if="hasEvents"
            ref="loadMoreTrigger"
            class="py-8 flex justify-center"
          >
            <div
              v-if="isLoadingMore"
              class="flex items-center gap-3 text-slate-600"
            >
              <div
                class="w-6 h-6 border-3 border-[#2ecc71] border-t-transparent rounded-full animate-spin"
              ></div>
              <span class="text-sm font-medium">Loading more events...</span>
            </div>
            <div
              v-else-if="!hasMore"
              class="text-sm text-slate-500 font-medium"
            >
              No more events to load
            </div>
          </div>

          <!-- Empty State -->
          <EventsEmptyState
            v-else-if="isEmpty"
            title="No events found"
            description="Try adjusting your filters or check back later for new events."
            :show-action="false"
          />
        </div>
      </section>

      <!-- Footer -->
      <AppFooter />

      <!-- Success/Error Messages -->
      <Transition name="slide-up">
        <div v-if="message" class="fixed bottom-20 lg:bottom-4 right-6 z-50">
          <div
            :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
            class="text-white px-6 py-4 rounded-xl shadow-lg flex items-center"
          >
            <CheckCircle
              v-if="message.type === 'success'"
              class="w-5 h-5 mr-2"
            />
            <AlertCircle v-else class="w-5 h-5 mr-2" />
            {{ message.text }}
          </div>
        </div>
      </Transition>

      <!-- Contact Us FAB (Telegram) -->
      <ContactUsFAB :has-fab-below="false" />

      <!-- Public Event Drawer -->
      <PublicEventDrawer
        v-model="showEventDrawer"
        :event-id="selectedEventId"
        :has-prev="hasDrawerPrev"
        :has-next="hasDrawerNext"
        @navigate-prev="handleDrawerPrev"
        @navigate-next="handleDrawerNext"
        @registered="handleEventRegistered"
        @login-required="handleLoginRequired"
      />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CheckCircle, AlertCircle } from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import ContactUsFAB from '@/components/ContactUsFAB.vue'
import PublicEventDrawer from '@/components/PublicEventDrawer.vue'
import AppFooter from '@/components/AppFooter.vue'
import {
  MobileTopBar,
  EventTimeline,
  TimeFilterToggle,
  CategoryFilter,
  EventsEmptyState,
  EventsLoadingSkeleton,
} from '@/components/events'
import { useGlobalSearch } from '@/composables/useGlobalSearch'
import { useCategoryFilter } from '@/composables/useCategoryFilter'
import { useStickyDateHeaders } from '@/composables/useStickyDateHeaders'
import { groupEventsByDate } from '@/composables/useEventFormatters'
import { type Event, type EventFilters as EventFiltersType, eventsService } from '@/services/api'
import { useEventsData } from '@/composables/useEventsData'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Global search
const { open: openSearch } = useGlobalSearch()

// Category filter
const { categories, categoryFilter, loadCategories } = useCategoryFilter()

// Date filter
type DateFilterValue = 'upcoming' | 'all' | 'liked'
const dateFilter = ref<DateFilterValue>('upcoming')
const dateFilterOptions = computed(() => {
  const options = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'all', label: 'All' },
  ]
  // Only show Liked tab when user is authenticated
  if (authStore.isAuthenticated) {
    options.push({ value: 'liked', label: 'Liked' })
  }
  return options
})

// Liked events state
const likedEvents = ref<Event[]>([])
const likedEventsLoading = ref(false)
const likedEventsLoaded = ref(false) // Track if liked events have been loaded at least once

// API filters
const filters = ref<EventFiltersType>({})

// UI state
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const loadMoreTrigger = ref<HTMLElement | null>(null)

// Public Event Drawer state
const showEventDrawer = ref(false)
const selectedEventId = ref<string | null>(null)
const selectedEventIndex = ref<number>(-1)

// Use composables - always treat as public view
const { events, loading, hasMore, isLoadingMore, loadEvents, loadMoreEvents } =
  useEventsData(computed(() => true)) // Always pass true since explore doesn't require auth

// Load liked events
const loadLikedEvents = async () => {
  if (!authStore.isAuthenticated) return

  // Only show loading skeleton on first load, not on refreshes
  if (!likedEventsLoaded.value) {
    likedEventsLoading.value = true
  }
  try {
    const response = await eventsService.getMyLikedEvents()
    if (response.success && response.data) {
      likedEvents.value = response.data
      likedEventsLoaded.value = true
    }
  } catch (error) {
    console.error('Failed to load liked events:', error)
  } finally {
    likedEventsLoading.value = false
  }
}

// Group events by date
const groupedByDate = computed(() => {
  // Filter events based on date filter
  const now = new Date()
  // Get start of today (midnight) for date-only comparison
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Use liked events when on liked tab
  if (dateFilter.value === 'liked') {
    return groupEventsByDate(likedEvents.value, 'asc')
  }

  let filteredEvents = events.value

  if (dateFilter.value === 'upcoming') {
    filteredEvents = events.value.filter((event) => {
      const eventDate = new Date(event.start_date)
      // Get start of event day for date-only comparison
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
      // Include today and future events
      return eventDay >= startOfToday
    })
  }

  return groupEventsByDate(filteredEvents, 'asc')
})

// Computed properties
const hasEvents = computed(() => {
  if (dateFilter.value === 'liked') {
    return likedEvents.value.length > 0
  }
  if (dateFilter.value === 'upcoming') {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return events.value.some((event) => {
      const eventDate = new Date(event.start_date)
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
      return eventDay >= startOfToday
    })
  }
  return events.value.length > 0
})
const isLoading = computed(() => {
  if (dateFilter.value === 'liked') {
    return likedEventsLoading.value
  }
  return loading.value
})
const isEmpty = computed(() => !isLoading.value && !hasEvents.value)

// Sticky date headers
const { setupStickyObserver } = useStickyDateHeaders(groupedByDate)

// Methods
const viewEvent = (event: Event) => {
  selectedEventId.value = event.id
  selectedEventIndex.value = events.value.findIndex((e) => e.id === event.id)
  showEventDrawer.value = true
}

// Drawer navigation computed properties
const hasDrawerPrev = computed(() => selectedEventIndex.value > 0)
const hasDrawerNext = computed(
  () => selectedEventIndex.value < events.value.length - 1
)

// Drawer navigation methods
const handleDrawerPrev = () => {
  if (hasDrawerPrev.value) {
    selectedEventIndex.value--
    selectedEventId.value = events.value[selectedEventIndex.value].id
  }
}

const handleDrawerNext = () => {
  if (hasDrawerNext.value) {
    selectedEventIndex.value++
    selectedEventId.value = events.value[selectedEventIndex.value].id
  }
}

const handleEventRegistered = () => {
  showMessage('success', 'Successfully registered for the event!')
  loadEvents('all', filters.value)
}

const handleLoginRequired = () => {
  showEventDrawer.value = false
  router.push(`/signin?redirect=${encodeURIComponent(route.fullPath)}`)
}

// Handle like changes - update both events and likedEvents arrays
const handleLikeChanged = (eventId: string, isLiked: boolean, likesCount: number) => {
  // Update the events array (used by All and Upcoming tabs)
  const eventIndex = events.value.findIndex((e) => e.id === eventId)
  if (eventIndex !== -1) {
    events.value[eventIndex] = {
      ...events.value[eventIndex],
      is_liked: isLiked,
      likes_count: likesCount,
    }
  }

  // Update likedEvents array if it has been loaded
  if (likedEventsLoaded.value) {
    if (isLiked) {
      // Add to liked events if not already present
      const alreadyInLiked = likedEvents.value.some((e) => e.id === eventId)
      if (!alreadyInLiked) {
        // Find the event from the main events array to add to liked
        const eventToAdd = events.value.find((e) => e.id === eventId)
        if (eventToAdd) {
          likedEvents.value = [
            ...likedEvents.value,
            { ...eventToAdd, is_liked: true, likes_count: likesCount },
          ]
        }
      } else {
        // Update likes_count for existing entry
        const likedIndex = likedEvents.value.findIndex((e) => e.id === eventId)
        if (likedIndex !== -1) {
          likedEvents.value[likedIndex] = {
            ...likedEvents.value[likedIndex],
            is_liked: true,
            likes_count: likesCount,
          }
        }
      }
    } else {
      // Remove from liked events
      likedEvents.value = likedEvents.value.filter((e) => e.id !== eventId)
    }
  }
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Filter handlers
const handleCategoryChange = () => {
  filters.value = {
    ...filters.value,
    category: categoryFilter.value || undefined,
  }
}

// Intersection Observer for infinite scroll
let observer: IntersectionObserver | null = null

const setupInfiniteScroll = () => {
  if (observer) {
    observer.disconnect()
  }

  const checkTrigger = () => {
    const trigger = loadMoreTrigger.value
    if (!trigger) {
      setTimeout(checkTrigger, 100)
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore.value && !isLoadingMore.value) {
            loadMoreEvents('all', filters.value)
          }
        })
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0,
      }
    )

    observer.observe(trigger)
  }

  checkTrigger()
}

// Watchers
watch(
  filters,
  async () => {
    const result = await loadEvents('all', filters.value)
    if (!result.success && result.message) {
      showMessage('error', result.message)
    }
    await nextTick()
    setupInfiniteScroll()
  },
  { deep: true }
)

// Watch for date filter changes to load liked events
watch(dateFilter, async (newValue) => {
  if (newValue === 'liked') {
    await loadLikedEvents()
  }
})

// Handle event query parameter from search
const openEventFromQuery = () => {
  const eventId = route.query.event as string | undefined
  if (eventId) {
    selectedEventId.value = eventId
    showEventDrawer.value = true
    router.replace({ path: route.path, query: {} })
  }
}

// Watch for event query parameter changes
watch(
  () => route.query.event,
  (eventId) => {
    if (eventId) {
      openEventFromQuery()
    }
  }
)

// Lifecycle
onMounted(async () => {
  await loadCategories()

  const result = await loadEvents('all', filters.value)
  if (!result.success && result.message) {
    showMessage('error', result.message)
  }

  setupInfiniteScroll()
  setupStickyObserver()
  openEventFromQuery()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
