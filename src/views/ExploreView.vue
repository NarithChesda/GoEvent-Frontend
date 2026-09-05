<template>
  <MainLayout>
    <!-- min-height offsets MainLayout's bottom pad (--nav-inset, the floating
         tab bar) / lg:pt-16 (desktop nav) so the sticky footer lands at the
         viewport bottom without a phantom scrollbar -->
    <div
      class="flex flex-col min-h-[calc(100vh_-_var(--nav-inset))] lg:min-h-[calc(100vh-4rem)]"
    >
      <!-- Mobile Top Bar -->
      <MobileTopBar />

      <!-- Main Content -->
      <section class="flex-1 flex flex-col py-4 sm:py-6 lg:py-[clamp(1.25rem,3vh,2rem)]">
        <div class="flex-1 flex flex-col w-full max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Page header. On mobile this is also the top bar's expanded state,
               which is why the title lives here rather than in the bar. -->
          <PageHeaderRow :title="t('discover.title')" :icon="Compass">
            <!-- Date range toggle + category filter. The filters used to leave
                 with the header — changing one meant scrolling the whole list
                 back to the top. PinnedListControls keeps them by handing them
                 to the top bar as the header scrolls under it. -->
            <PinnedListControls
              v-model:time-filter="dateFilter"
              :time-options="dateFilterOptions"
              v-model:category="categoryFilter"
              :categories="categories"
            />
          </PageHeaderRow>

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
                class="w-6 h-6 border-2 border-[#2ecc71] border-t-transparent rounded-full animate-spin"
              ></div>
              <span class="text-sm font-medium">{{ t('discover.loadingMore') }}</span>
            </div>
            <div
              v-else-if="!hasMore"
              class="text-sm text-slate-500 font-medium"
            >
              {{ t('discover.noMore') }}
            </div>
          </div>

          <!-- Empty State (my-auto centers it in the leftover column height;
               the slight lift optically balances the bottom tab bar) -->
          <EventsEmptyState
            v-else-if="isEmpty"
            class="my-auto -translate-y-6"
            :title="t('discover.emptyState.title')"
            :description="t('discover.emptyState.description')"
            :show-action="false"
          />
        </div>
      </section>

      <!-- Footer -->
      <AppFooter />

      <!-- Public Event Drawer -->
      <PublicEventDrawer
        v-model="showEventDrawer"
        :event-id="selectedEventId"
        :has-prev="hasDrawerPrev"
        :has-next="hasDrawerNext"
        @navigate-prev="handleDrawerPrev"
        @navigate-next="handleDrawerNext"
        @registration-changed="handleRegistrationChanged"
        @login-required="handleLoginRequired"
        @like-changed="handleLikeChanged"
        @open-event="handleOpenRelatedEvent"
      />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// Compass is this page's tab icon in MobileTabBar; the mobile header reuses it.
import { Compass } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import MainLayout from '@/components/MainLayout.vue'
import PublicEventDrawer from '@/components/PublicEventDrawer.vue'
import AppFooter from '@/components/AppFooter.vue'
import {
  MobileTopBar,
  PageHeaderRow,
  EventTimeline,
  PinnedListControls,
  EventsEmptyState,
  EventsLoadingSkeleton,
} from '@/components/events'
import { useCategoryFilter } from '@/composables/useCategoryFilter'
import { useStickyDateHeaders } from '@/composables/useStickyDateHeaders'
import { groupEventsByDate } from '@/composables/useEventFormatters'
import { type Event, type EventFilters as EventFiltersType, eventsService } from '@/services/api'
import { useEventsData } from '@/composables/useEventsData'
import { useAuthStore } from '@/stores/auth'
import { useAppLanguage } from '@/composables/useAppLanguage'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t } = useAppLanguage()

// Category filter
const { categories, categoryFilter, loadCategories } = useCategoryFilter()

// Date filter
type DateFilterValue = 'upcoming' | 'all' | 'liked'
const dateFilter = ref<DateFilterValue>('upcoming')
const dateFilterOptions = computed(() => {
  const options = [
    { value: 'upcoming', label: t('discover.tabs.upcoming') },
    { value: 'all', label: t('discover.tabs.all') },
  ]
  // Only show Liked tab when user is authenticated
  if (authStore.isAuthenticated) {
    options.push({ value: 'liked', label: t('discover.tabs.liked') })
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
const { showToast } = useToast()
const loadMoreTrigger = ref<HTMLElement | null>(null)

// Public Event Drawer state
const showEventDrawer = ref(false)
const selectedEventId = ref<string | null>(null)
const selectedEventIndex = ref<number>(-1)

// Use composables - always treat as public view. The cache key opts this tab
// into the cross-mount list cache — see useEventsData — so coming back from
// Events or Services shows the list it was showing rather than a skeleton.
const { events, loading, restored, hasMore, isLoadingMore, loadEvents, loadMoreEvents } =
  useEventsData(computed(() => true), 'events:discover') // Always pass true since explore doesn't require auth

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

/**
 * Follow a "More in {category}" link from inside the drawer.
 *
 * The target usually isn't in the loaded page of results, so the index is only
 * synced when we can find it — otherwise prev/next simply falls idle rather
 * than paging from a stale position.
 */
const handleOpenRelatedEvent = (eventId: string) => {
  selectedEventId.value = eventId
  selectedEventIndex.value = events.value.findIndex((e) => e.id === eventId)
}

/**
 * Reflect a registration made inside the drawer on the card behind it.
 *
 * This used to re-fetch the whole list, which threw away the reader's position
 * in it to update one card's counter — and did it while the drawer was still
 * open over the top, so the cost was invisible until they closed it.
 */
const handleRegistrationChanged = (
  eventId: string,
  isRegistered: boolean,
  registrationsCount: number
) => {
  if (isRegistered) showMessage('success', t('events.messages.registerSuccess'))

  const eventIndex = events.value.findIndex((e) => e.id === eventId)
  if (eventIndex !== -1) {
    events.value[eventIndex] = {
      ...events.value[eventIndex],
      is_registered: isRegistered,
      registrations_count: registrationsCount,
    }
  }
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
  showToast(type, text)
}

// Filter handlers. Driven by a watcher rather than each control's change
// event: the category filter is now rendered in two places (the page header
// and the copy the nav absorbs on scroll), and watching the shared ref keeps
// one code path instead of wiring every instance.
watch(categoryFilter, () => {
  filters.value = {
    ...filters.value,
    category: categoryFilter.value || undefined,
  }
})

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

  // Silent when the cache already put cards on screen — see EventsView.
  const result = await loadEvents('all', filters.value, false, restored)
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

