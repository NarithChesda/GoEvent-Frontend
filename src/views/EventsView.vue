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
              Happening Around You!!!
            </span>
          </h1>
        </div>

        <!-- View Toggle -->
        <div class="flex justify-center mb-6 sm:mb-8 md:mb-10">
          <div class="inline-flex bg-white rounded-full p-1 border-2 border-slate-200 shadow-sm">
            <button
              v-for="option in VIEW_OPTIONS"
              :key="option.type"
              @click="handleViewChange(option.type)"
              class="flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 relative overflow-hidden"
              :class="currentView === option.type ? 'text-white shadow-md' : 'text-slate-700 hover:bg-slate-50'"
            >
              <span
                v-if="currentView === option.type"
                class="absolute inset-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-full"
              ></span>
              <component :is="option.icon" class="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0 relative z-10" />
              <span class="relative z-10">{{ option.label }}</span>
            </button>
          </div>
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
            :key="getViewPrefix + (categoryGroup.category?.id || 'uncategorized')"
            :category-group="categoryGroup"
            :view-prefix="getViewPrefix"
            :has-overflow="categoryHasOverflow(getViewPrefix + (categoryGroup.category?.id || 'uncategorized'))"
            @view-event="viewEvent"
            @edit-event="editEvent"
            @delete-event="deleteEvent"
            @scroll-left="scrollCategory($event, 'left')"
            @scroll-right="scrollCategory($event, 'right')"
            @set-scroll-ref="setCategoryScrollRef"
          />
        </div>

        <!-- Infinite Scroll Loading Indicator -->
        <div
          v-if="currentView === 'all' && hasEvents"
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

        <!-- Login Required State for Unauthenticated Users -->
        <div v-else-if="showLoginPrompt" class="text-center py-12 sm:py-16 px-4">
          <div
            class="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 mx-auto mb-6 sm:mb-8 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-full flex items-center justify-center"
          >
            <User class="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 text-[#5eb3f6]" />
          </div>
          <h3 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
            Sign In Required
          </h3>
          <p class="text-sm sm:text-base lg:text-lg text-slate-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
            {{ loginPromptMessage }}
          </p>
          <button
            @click="goToLogin"
            class="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg sm:rounded-xl font-medium transition-all duration-300 hover:shadow-lg text-sm sm:text-base"
          >
            Sign In to Continue
          </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="isEmpty" class="text-center py-12 sm:py-16 px-4">
          <div
            class="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 mx-auto mb-6 sm:mb-8 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-full flex items-center justify-center"
          >
            <Calendar class="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 text-[#5eb3f6]" />
          </div>
          <h3 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-3 sm:mb-4 px-4">
            {{ emptyStateTitle }}
          </h3>
          <p class="text-sm sm:text-base lg:text-lg text-slate-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
            {{ emptyStateMessage }}
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

    <!-- Contact Us FAB (Telegram) - moved up when Create FAB is visible -->
    <ContactUsFAB :has-fab-below="true" />

    <!-- Create Event FAB -->
    <button
      @click="handleCreateEventClick"
      class="fixed bottom-20 lg:bottom-4 right-6 w-14 h-14 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 transition-all duration-300 hover:scale-110 flex items-center justify-center z-[60] group"
      aria-label="Create Event"
    >
      <Plus class="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
      <div
        class="absolute right-full mr-4 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none"
      >
        Create Event
      </div>
    </button>

    <!-- Event Create Modal -->
    <EventCreateModal
      :is-visible="showCreateModal"
      @close="showCreateModal = false"
      @submit="handleEventCreate"
    />

    <!-- Delete Confirm Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="isDeleting"
      title="Delete Event"
      :item-name="eventToDelete?.title"
      message="This will permanently delete this event and all associated data including guests, media, and agenda items."
      @confirm="handleDeleteConfirm"
      @cancel="closeDeleteModal"
    />

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
import { useRouter, useRoute } from 'vue-router'
import {
  Calendar,
  Plus,
  CheckCircle,
  AlertCircle,
  User,
} from 'lucide-vue-next'
import MainLayout from '../components/MainLayout.vue'
import EventCategorySection from '../components/EventCategorySection.vue'
import EventFilters from '../components/EventFilters.vue'
import EventCreateModal from '../components/EventCreateModal.vue'
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue'
import ContactUsFAB from '../components/ContactUsFAB.vue'
import PublicEventDrawer from '../components/PublicEventDrawer.vue'
import { useAuthStore } from '../stores/auth'
import {
  eventsService,
  eventCategoriesService,
  type Event,
  type EventCategory,
  type EventFilters as EventFiltersType,
} from '../services/api'
import { useEventsData, type ViewType } from '../composables/useEventsData'
import { useCategoryScroll } from '../composables/useCategoryScroll'
import { useCategoryGrouping } from '../composables/useCategoryGrouping'
import {
  VIEW_OPTIONS,
  EMPTY_STATE_CONFIG,
  LOGIN_PROMPT_CONFIG,
} from '../constants/eventsViewConfig'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Initialize current view from URL query parameter or default to 'all'
const initialView = (): ViewType => {
  const viewParam = route.query.view as string | undefined
  if (viewParam && ['all', 'my'].includes(viewParam)) {
    return viewParam as ViewType
  }
  return 'all'
}

const currentView = ref<ViewType>(initialView())
const categories = ref<EventCategory[]>([])
const filters = ref<EventFiltersType>({})
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const eventToDelete = ref<Event | null>(null)
const loadMoreTrigger = ref<HTMLElement | null>(null)

// Public Event Drawer state
const showEventDrawer = ref(false)
const selectedEventId = ref<string | null>(null)
const selectedEventIndex = ref<number>(-1)

// Use composables
const {
  events,
  loading,
  hasMore,
  isLoadingMore,
  loadEvents,
  loadMoreEvents,
} = useEventsData(computed(() => authStore.isAuthenticated))

const {
  setCategoryScrollRef,
  categoryHasOverflow,
  scrollCategory,
  recheckAllOverflows,
} = useCategoryScroll()

const {
  categorizedEvents,
  getViewPrefix,
} = useCategoryGrouping(currentView, events, categories)

// Computed properties
const hasEvents = computed(() => events.value.length > 0)
const showLoginPrompt = computed(() => {
  return !loading.value && !authStore.isAuthenticated && currentView.value === 'my'
})
const isEmpty = computed(() => !loading.value && !showLoginPrompt.value && events.value.length === 0)

const emptyStateTitle = computed(() => EMPTY_STATE_CONFIG[currentView.value].title)
const emptyStateMessage = computed(() => EMPTY_STATE_CONFIG[currentView.value].message)
const loginPromptMessage = computed(() => LOGIN_PROMPT_CONFIG[currentView.value])

// Methods
const handleViewChange = (view: ViewType) => {
  currentView.value = view

  // Update URL query parameter to persist tab state
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      view: view
    }
  })
}

const goToLogin = () => {
  // Store the current view in the redirect URL so user returns to the same tab after login
  const currentPath = route.path
  const viewParam = currentView.value !== 'all' ? `?view=${currentView.value}` : ''
  const redirectUrl = `${currentPath}${viewParam}`

  router.push({
    path: '/signin',
    query: { redirect: redirectUrl }
  })
}

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
  // Check if user can edit this event (organizer or collaborator with edit permission)
  const canEditEvent =
    event.can_edit === true ||
    (authStore.user?.id && event.organizer === authStore.user.id)

  if (canEditEvent) {
    // User is organizer or collaborator - go to manage page
    router.push(`/events/${event.id}/manage`)
    return
  }

  // For registered events (or any event user can't edit), open the drawer
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
  loadEvents(currentView.value, filters.value)
}

const handleLoginRequired = () => {
  // The drawer will close and redirect to login
  showEventDrawer.value = false
}

const createEvent = () => {
  showCreateModal.value = true
}

const handleCreateEventClick = () => {
  if (authStore.isAuthenticated) {
    showCreateModal.value = true
  } else {
    // Redirect to login with redirect back to events with createEvent param
    router.push({
      path: '/signin',
      query: { redirect: '/events?createEvent=true' }
    })
  }
}

const editEvent = (event: Event) => {
  router.push(`/events/${event.id}/edit`)
}

const deleteEvent = (event: Event) => {
  eventToDelete.value = event
  showDeleteModal.value = true
}

const handleDeleteConfirm = async () => {
  if (!eventToDelete.value) return

  isDeleting.value = true
  try {
    const response = await eventsService.deleteEvent(eventToDelete.value.id)
    if (response.success) {
      showMessage('success', 'Event deleted successfully')
      closeDeleteModal()
      // Reload events
      await loadEvents(currentView.value, filters.value)
    } else {
      showMessage('error', response.message || 'Failed to delete event')
      isDeleting.value = false
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error deleting event:', error)
    }
    showMessage('error', 'An error occurred while deleting the event')
    isDeleting.value = false
  }
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  eventToDelete.value = null
  isDeleting.value = false
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

const shouldOpenCreateModalFromQuery = () => {
  const param = route.query.createEvent
  const values = Array.isArray(param) ? param : [param]

  return values.some((value) => {
    if (value == null) {
      return false
    }
    const normalized = value.toLowerCase()
    return normalized === '' || normalized === '1' || normalized === 'true' || normalized === 'yes'
  })
}

const clearCreateEventQuery = () => {
  const newQuery = { ...route.query } as Record<string, any>
  delete newQuery.createEvent
  router.replace({ path: route.path, query: newQuery })
}

const maybeOpenCreateModalFromRoute = () => {
  if (!authStore.isAuthenticated) {
    return
  }

  if (!shouldOpenCreateModalFromQuery()) {
    return
  }

  showCreateModal.value = true
  clearCreateEventQuery()
}

interface EventFormData {
  title: string
  description: string
  start_date: string
  end_date: string
  location: string
  privacy: 'public' | 'private'
  short_description?: string
  is_virtual?: boolean
  virtual_link?: string
  max_attendees?: number | null
  registration_fee?: number
  registration_required?: boolean
  registration_deadline?: string | null
  category?: number | string | null
  banner_image?: string | null
  is_free?: boolean
  timezone?: string
  status?: string
}

const handleEventCreate = async (formData: EventFormData) => {
  try {
    if (import.meta.env.DEV) {
      console.log('Creating event with data:', formData)
    }

    // Prepare event data for API
    const eventData = {
      title: formData.title,
      description: formData.description,
      short_description:
        formData.short_description ||
        formData.description.substring(0, 150) + (formData.description.length > 150 ? '...' : ''),
      start_date: formData.start_date,
      end_date: formData.end_date,
      location: formData.location || '',
      is_virtual: formData.is_virtual || false,
      virtual_link: formData.virtual_link || '',
      privacy: formData.privacy,
      status:
        (formData.status as 'draft' | 'published' | 'cancelled' | 'completed') ||
        ('published' as const),
      category: formData.category ? (typeof formData.category === 'string' ? parseInt(formData.category) : formData.category) : null,
      max_attendees: formData.max_attendees || null,
      registration_required: formData.registration_required || false,
      registration_deadline: formData.registration_deadline || null,
      timezone: formData.timezone || 'UTC',
    }

    if (import.meta.env.DEV) {
      console.log('Sending event data to API:', eventData)
    }
    const response = await eventsService.createEvent(eventData)
    if (import.meta.env.DEV) {
      console.log('API response:', response)
    }

    if (response.success && response.data) {
      showMessage('success', 'Event created successfully!')

      // Store the target view to prevent race conditions
      const targetView = 'my'

      // Switch to "My Events" tab to show the newly created event
      currentView.value = targetView

      // Reload events to show the newly created event
      await loadEvents(currentView.value, filters.value)

      // Verify we're still on the correct view after loading completes
      if (currentView.value !== targetView && import.meta.env.DEV) {
        console.log('View changed during event creation, skipping reload')
      }
    } else {
      if (import.meta.env.DEV) {
        console.error('Create event failed:', response)
      }
      let errorMessage = response.message || 'Failed to create event'

      // If there are validation errors, show them
      if (response.errors) {
        const errorDetails = Object.entries(response.errors)
          .map(
            ([field, messages]) =>
              `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`,
          )
          .join('; ')
        errorMessage = `Validation errors: ${errorDetails}`
      }

      showMessage('error', errorMessage)
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error creating event:', error)
    }
    showMessage(
      'error',
      'Network error: Failed to create event. Please check your connection and try again.',
    )
  }
}

// Intersection Observer for infinite scroll
let observer: IntersectionObserver | null = null

const setupInfiniteScroll = () => {
  // Clean up existing observer
  if (observer) {
    observer.disconnect()
  }

  // Only set up for public events view
  if (currentView.value !== 'all') {
    return
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
            loadMoreEvents(currentView.value, filters.value)
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
  () => route.query.view,
  (newView) => {
    const view = newView as ViewType | undefined
    if (view && ['all', 'my'].includes(view)) {
      if (currentView.value !== view) {
        currentView.value = view
      }
    } else if (!view && currentView.value !== 'all') {
      currentView.value = 'all'
    }
  }
)

watch(
  () => route.query.createEvent,
  () => {
    maybeOpenCreateModalFromRoute()
  },
  { immediate: true },
)

watch(
  [() => currentView.value, filters],
  async () => {
    const result = await loadEvents(currentView.value, filters.value)
    if (!result.success && result.message) {
      showMessage('error', result.message)
    }
    // Re-setup infinite scroll after events are loaded and DOM is updated
    await nextTick()
    setupInfiniteScroll()
  },
  { deep: true },
)

// Watch authentication state changes
watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      maybeOpenCreateModalFromRoute()
      // Reload events when user logs in
      loadEvents(currentView.value, filters.value)
    } else {
      // User logged out - if they're on 'my' tab, clear events to show login prompt
      if (currentView.value === 'my') {
        events.value = []
      }
    }
  },
)

// Watch for category overflow checking based on current view
watch(
  [() => currentView.value, () => events.value.length],
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

  // Load events after categories
  const result = await loadEvents(currentView.value, filters.value)
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

/* Tab Button Unified Gradient Styling */
.tab-inactive {
  position: relative;
  border: 2px solid transparent;
  background: linear-gradient(white, white) padding-box,
              linear-gradient(to right, #2ecc71, #1e90ff) border-box;
}

.tab-inactive span {
  background: linear-gradient(to right, #2ecc71, #1e90ff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

/* Icon styling for inactive tabs - primary green color */
.tab-inactive svg {
  color: #2ecc71 !important;
  fill: none;
  stroke: currentColor;
}

/* Hover state for unified gradient */
.tab-inactive:hover {
  background: linear-gradient(white, white) padding-box,
              linear-gradient(to right, #27ae60, #1873cc) border-box;
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
