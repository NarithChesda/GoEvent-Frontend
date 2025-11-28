<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">

    <!-- Main Content -->
    <section class="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-slate-50/50 to-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-6 sm:mb-8 md:mb-10">
          <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold leading-tight tracking-tight text-slate-900 mb-2 px-4">
            <span class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] bg-clip-text text-transparent">
              Discover What's
              Happening Around You
            </span>
          </h1>
          <p class="text-slate-600 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-4">
            Find and join amazing events in your area
          </p>
        </div>

        <!-- Filters -->
        <EventFilters v-model="filters" :categories="categories" class="mb-6 sm:mb-8" />

        <!-- Loading State -->
        <div v-if="loading">
          <!-- Mobile loading skeleton -->
          <div class="flex md:hidden overflow-x-auto gap-4 pb-4 scrollbar-hide -mx-4 px-4">
            <div
              v-for="i in 2"
              :key="`mobile-skeleton-${i}`"
              class="flex-none w-[calc(75vw-2.25rem)] max-w-[300px] min-w-[225px] bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl animate-pulse"
            >
              <div class="h-48 bg-slate-200 rounded-t-3xl"></div>
              <div class="p-6 space-y-4">
                <div class="h-4 bg-slate-200 rounded"></div>
                <div class="h-6 bg-slate-200 rounded"></div>
                <div class="h-16 bg-slate-200 rounded"></div>
                <div class="flex justify-between">
                  <div class="h-4 bg-slate-200 rounded w-20"></div>
                  <div class="h-4 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop loading skeleton -->
          <div class="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <div
              v-for="i in 6"
              :key="`desktop-skeleton-${i}`"
              class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl animate-pulse"
            >
              <div class="h-48 bg-slate-200 rounded-t-3xl"></div>
              <div class="p-6 space-y-4">
                <div class="h-4 bg-slate-200 rounded"></div>
                <div class="h-6 bg-slate-200 rounded"></div>
                <div class="h-16 bg-slate-200 rounded"></div>
                <div class="flex justify-between">
                  <div class="h-4 bg-slate-200 rounded w-20"></div>
                  <div class="h-4 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Events Grid -->
        <div v-else-if="hasEvents" class="space-y-6 sm:space-y-8">
          <EventCategorySection
            v-for="categoryGroup in categorizedEvents"
            :key="'explore-' + (categoryGroup.category?.id || 'uncategorized')"
            :category-group="categoryGroup"
            view-prefix="explore-"
            :has-overflow="categoryHasOverflow('explore-' + (categoryGroup.category?.id || 'uncategorized'))"
            @view-event="viewEvent"
            @scroll-left="scrollCategory($event, 'left')"
            @scroll-right="scrollCategory($event, 'right')"
            @set-scroll-ref="setCategoryScrollRef"
          />
        </div>

        <!-- Infinite Scroll Loading Indicator -->
        <div
          v-if="hasEvents"
          ref="loadMoreTrigger"
          class="py-8 flex justify-center"
        >
          <div v-if="isLoadingMore" class="flex items-center gap-3 text-slate-600">
            <div class="w-6 h-6 border-3 border-[#2ecc71] border-t-transparent rounded-full animate-spin"></div>
            <span class="text-sm font-medium">Loading more events...</span>
          </div>
          <div v-else-if="!hasMore" class="text-sm text-slate-500 font-medium">
            No more events to load
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="isEmpty" class="text-center py-12 sm:py-16 px-4">
          <div
            class="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 mx-auto mb-6 sm:mb-8 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-full flex items-center justify-center"
          >
            <Calendar class="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 text-[#5eb3f6]" />
          </div>
          <h3 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
            No events found
          </h3>
          <p class="text-sm sm:text-base lg:text-lg text-slate-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
            Try adjusting your filters or check back later for new events.
          </p>
        </div>
      </div>
    </section>

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-20 lg:bottom-4 right-6 z-50">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-6 py-4 rounded-xl shadow-lg flex items-center"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 mr-2" />
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-vue-next'
import MainLayout from '../components/MainLayout.vue'
import EventCategorySection from '../components/EventCategorySection.vue'
import EventFilters from '../components/EventFilters.vue'
import ContactUsFAB from '../components/ContactUsFAB.vue'
import PublicEventDrawer from '../components/PublicEventDrawer.vue'
import {
  eventCategoriesService,
  type Event,
  type EventCategory,
  type EventFilters as EventFiltersType,
} from '../services/api'
import { useEventsData } from '../composables/useEventsData'
import { useCategoryScroll } from '../composables/useCategoryScroll'
import { useCategoryGrouping } from '../composables/useCategoryGrouping'

const router = useRouter()

const categories = ref<EventCategory[]>([])
const filters = ref<EventFiltersType>({})
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const loadMoreTrigger = ref<HTMLElement | null>(null)

// Public Event Drawer state
const showEventDrawer = ref(false)
const selectedEventId = ref<string | null>(null)
const selectedEventIndex = ref<number>(-1)

// Use composables - always treat as public view
const currentView = ref<'all'>('all')

const {
  events,
  loading,
  hasMore,
  isLoadingMore,
  loadEvents,
  loadMoreEvents,
} = useEventsData(computed(() => true)) // Always pass true since explore doesn't require auth

const {
  setCategoryScrollRef,
  categoryHasOverflow,
  scrollCategory,
  recheckAllOverflows,
} = useCategoryScroll()

const {
  categorizedEvents,
} = useCategoryGrouping(currentView, events, categories)

// Computed properties
const hasEvents = computed(() => events.value.length > 0)
const isEmpty = computed(() => !loading.value && events.value.length === 0)

// Methods
const loadCategories = async () => {
  try {
    const response = await eventCategoriesService.getCategories()
    if (response.success && response.data) {
      categories.value = response.data.results || []
    } else {
      if (import.meta.env.DEV) {
        console.error('Failed to load categories:', response.message)
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to load categories:', error)
    }
  }
}

const viewEvent = (event: Event) => {
  selectedEventId.value = event.id
  selectedEventIndex.value = events.value.findIndex(e => e.id === event.id)
  showEventDrawer.value = true
}

// Drawer navigation computed properties
const hasDrawerPrev = computed(() => selectedEventIndex.value > 0)
const hasDrawerNext = computed(() => selectedEventIndex.value < events.value.length - 1)

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
  // Reload events to update registration status
  loadEvents('all', filters.value)
}

const handleLoginRequired = () => {
  // The drawer will close and redirect to login
  showEventDrawer.value = false
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Intersection Observer for infinite scroll
let observer: IntersectionObserver | null = null

const setupInfiniteScroll = () => {
  // Clean up existing observer
  if (observer) {
    observer.disconnect()
  }

  // Wait for trigger element to be available
  const checkTrigger = () => {
    const trigger = loadMoreTrigger.value
    if (!trigger) {
      // Try again after a short delay
      setTimeout(checkTrigger, 100)
      return
    }

    // Create intersection observer
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
    // Re-setup infinite scroll after events are loaded and DOM is updated
    await nextTick()
    setupInfiniteScroll()
  },
  { deep: true },
)

// Watch for category overflow checking
watch(
  () => events.value.length,
  () => {
    // Wait for DOM to update, then check category overflows
    nextTick(() => {
      recheckAllOverflows()
    })
  }
)

// Lifecycle
onMounted(async () => {
  // Load initial data
  await loadCategories()

  // Load public events
  const result = await loadEvents('all', filters.value)
  if (!result.success && result.message) {
    showMessage('error', result.message)
  }

  // Set up infinite scroll
  setupInfiniteScroll()
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

/* Hide scrollbar for horizontal scroll on mobile */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}
</style>
