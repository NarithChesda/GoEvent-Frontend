<template>
  <MainLayout>
    <div class="min-h-screen">
      <!-- Mobile Top Bar -->
      <MobileTopBar @search="openSearch" />

      <!-- Main Content -->
      <section class="py-4 sm:py-6 lg:py-8">
        <div class="max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Header with Toggle -->
          <div class="flex items-center justify-between mb-6 sm:mb-8 lg:mb-10">
            <h1
              class="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900"
            >
              Events
            </h1>

            <!-- Upcoming/Past/Recent Toggle (authenticated only) -->
            <TimeFilterToggle
              v-if="authStore.isAuthenticated"
              v-model="timeFilter"
              :options="timeFilterOptions"
            />

            <!-- Category Filter Dropdown - Desktop only (authenticated only) -->
            <CategoryFilter
              v-if="authStore.isAuthenticated"
              v-model="categoryFilter"
              :categories="categories"
              variant="dropdown"
            />
          </div>

          <!-- Mobile Category Filter Pills (authenticated only) -->
          <CategoryFilter
            v-if="authStore.isAuthenticated && categories.length > 0"
            v-model="categoryFilter"
            :categories="categories"
            variant="pills"
          />

          <!-- Loading State -->
          <EventsLoadingSkeleton v-if="loading" />

          <!-- Events Timeline -->
          <EventTimeline
            v-else-if="hasEvents"
            :date-groups="groupedByDate"
            :show-manage-button="true"
            :show-missing-location="true"
            @event-click="viewEvent"
            @event-manage="manageEvent"
          />

          <!-- Login Required State -->
          <EventsEmptyState
            v-else-if="!authStore.isAuthenticated"
            title="Ready to Create Your Event?"
            description="Start organizing amazing events and bring people together. Sign in to get started."
            action-label="Create Event"
            :show-action="true"
            @action="handleCreateEventClick"
          />

          <!-- Empty State -->
          <EventsEmptyState
            v-else-if="isEmpty"
            :title="emptyStateTitle"
            :description="emptyStateDescription"
            action-label="Create Your First Event"
            :show-action="timeFilter === 'upcoming' || timeFilter === 'recent'"
            @action="handleCreateEventClick"
          />
        </div>
      </section>

      <!-- Footer -->
      <AppFooter />

      <!-- Success/Error Messages -->
      <Transition name="slide-up">
        <div v-if="message" class="fixed bottom-20 lg:bottom-4 right-6 z-50">
          <div
            :class="
              message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            "
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
        class="fixed bottom-20 lg:bottom-4 right-4 lg:right-6 w-14 h-14 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 transition-all duration-300 hover:scale-110 flex items-center justify-center z-[60] group"
        aria-label="Create Event"
      >
        <Plus
          class="w-6 h-6 transition-transform duration-300 group-hover:rotate-90"
        />
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, CheckCircle, AlertCircle } from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import EventCreateModal from '@/components/EventCreateModal.vue'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
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
import { useAuthStore } from '@/stores/auth'
import { useGlobalSearch } from '@/composables/useGlobalSearch'
import { useCategoryFilter } from '@/composables/useCategoryFilter'
import { useStickyDateHeaders } from '@/composables/useStickyDateHeaders'
import { groupEventsByDate } from '@/composables/useEventFormatters'
import { eventsService, type Event } from '@/services/api'
import { useEventsData } from '@/composables/useEventsData'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Global search
const { open: openSearch } = useGlobalSearch()

// Category filter
const { categories, categoryFilter, loadCategories } = useCategoryFilter()

// Time filter
type TimeFilterValue = 'upcoming' | 'past' | 'recent'
const timeFilter = ref<TimeFilterValue>('recent')
const timeFilterOptions = [
  { value: 'recent', label: 'Recent' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
]

// UI state
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const eventToDelete = ref<Event | null>(null)

// Public Event Drawer state
const showEventDrawer = ref(false)
const selectedEventId = ref<string | null>(null)
const selectedEventIndex = ref<number>(-1)

// Use composables
const { events, loading, loadEvents } = useEventsData(
  computed(() => authStore.isAuthenticated)
)

// Filter events based on time filter and category
const filteredEvents = computed(() => {
  const now = new Date()
  return events.value.filter((event) => {
    // Time filter
    let passesTimeFilter = true
    if (timeFilter.value === 'recent') {
      passesTimeFilter = true
    } else {
      const eventDate = new Date(event.start_date)
      passesTimeFilter =
        timeFilter.value === 'upcoming' ? eventDate >= now : eventDate < now
    }

    // Category filter
    let passesCategoryFilter = true
    if (categoryFilter.value) {
      const eventWithCategory = event as Event & { category_name?: string }
      passesCategoryFilter = eventWithCategory.category_name === categoryFilter.value
    }

    return passesTimeFilter && passesCategoryFilter
  })
})

// Group events by date
const groupedByDate = computed(() => {
  // For "recent" filter, sort by created_at timestamp (most recent first)
  if (timeFilter.value === 'recent') {
    const sortedByCreated = [...filteredEvents.value].sort((a, b) => {
      const createdA = new Date(
        (a as Event & { created_at?: string }).created_at || a.start_date
      ).getTime()
      const createdB = new Date(
        (b as Event & { created_at?: string }).created_at || b.start_date
      ).getTime()
      return createdB - createdA
    })
    // Use 'preserve' to maintain the created_at sorting order
    return groupEventsByDate(sortedByCreated, 'preserve')
  }

  // For upcoming/past, sort by start_date
  return groupEventsByDate(
    filteredEvents.value,
    timeFilter.value === 'upcoming' ? 'asc' : 'desc'
  )
})

// Computed properties
const hasEvents = computed(() => filteredEvents.value.length > 0)
const isEmpty = computed(
  () =>
    !loading.value &&
    authStore.isAuthenticated &&
    filteredEvents.value.length === 0
)

// Empty state messages
const emptyStateTitle = computed(() => {
  if (timeFilter.value === 'upcoming') return 'No upcoming events'
  if (timeFilter.value === 'past') return 'No past events'
  return 'No events created yet'
})

const emptyStateDescription = computed(() => {
  if (timeFilter.value === 'upcoming')
    return 'Start organizing amazing events and bring people together.'
  if (timeFilter.value === 'past') return 'Your past events will appear here.'
  return 'Events you create will appear here, sorted by creation date.'
})

// Sticky date headers
const { setupStickyObserver } = useStickyDateHeaders(groupedByDate)

// Methods
const viewEvent = (event: Event) => {
  const canEditEvent =
    event.can_edit === true ||
    (authStore.user?.id && event.organizer === authStore.user.id)

  if (canEditEvent) {
    router.push(`/events/${event.id}/manage`)
    return
  }

  selectedEventId.value = event.id
  selectedEventIndex.value = filteredEvents.value.findIndex(
    (e) => e.id === event.id
  )
  showEventDrawer.value = true
}

const manageEvent = (event: Event) => {
  router.push(`/events/${event.id}/manage`)
}

// Drawer navigation
const hasDrawerPrev = computed(() => selectedEventIndex.value > 0)
const hasDrawerNext = computed(
  () => selectedEventIndex.value < filteredEvents.value.length - 1
)

const handleDrawerPrev = () => {
  if (hasDrawerPrev.value) {
    selectedEventIndex.value--
    selectedEventId.value = filteredEvents.value[selectedEventIndex.value].id
  }
}

const handleDrawerNext = () => {
  if (hasDrawerNext.value) {
    selectedEventIndex.value++
    selectedEventId.value = filteredEvents.value[selectedEventIndex.value].id
  }
}

const handleEventRegistered = () => {
  showMessage('success', 'Successfully registered for the event!')
  loadEvents('my', {})
}

const handleLoginRequired = () => {
  showEventDrawer.value = false
}

const handleCreateEventClick = () => {
  if (authStore.isAuthenticated) {
    showCreateModal.value = true
  } else {
    router.push({
      path: '/signin',
      query: { redirect: '/events?createEvent=true' },
    })
  }
}

const handleDeleteConfirm = async () => {
  if (!eventToDelete.value) return

  isDeleting.value = true
  try {
    const response = await eventsService.deleteEvent(eventToDelete.value.id)
    if (response.success) {
      showMessage('success', 'Event deleted successfully')
      closeDeleteModal()
      await loadEvents('my', {})
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
    if (value == null) return false
    const normalized = value.toLowerCase()
    return (
      normalized === '' ||
      normalized === '1' ||
      normalized === 'true' ||
      normalized === 'yes'
    )
  })
}

const clearCreateEventQuery = () => {
  const newQuery = { ...route.query }
  delete newQuery.createEvent
  router.replace({ path: route.path, query: newQuery })
}

const maybeOpenCreateModalFromRoute = () => {
  if (!authStore.isAuthenticated) return
  if (!shouldOpenCreateModalFromQuery()) return

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
    const eventData = {
      title: formData.title,
      description: formData.description,
      short_description:
        formData.short_description ||
        formData.description.substring(0, 150) +
          (formData.description.length > 150 ? '...' : ''),
      start_date: formData.start_date,
      end_date: formData.end_date,
      location: formData.location || '',
      is_virtual: formData.is_virtual || false,
      virtual_link: formData.virtual_link || '',
      privacy: formData.privacy,
      status:
        (formData.status as 'draft' | 'published' | 'cancelled' | 'completed') ||
        ('published' as const),
      category: formData.category
        ? typeof formData.category === 'string'
          ? parseInt(formData.category)
          : formData.category
        : null,
      max_attendees: formData.max_attendees || null,
      registration_required: formData.registration_required || false,
      registration_deadline: formData.registration_deadline || null,
      timezone: formData.timezone || 'UTC',
    }

    const response = await eventsService.createEvent(eventData)

    if (response.success && response.data) {
      showMessage('success', 'Event created successfully!')
      timeFilter.value = 'recent'
      await loadEvents('my', {})
    } else {
      let errorMessage = response.message || 'Failed to create event'

      if (response.errors) {
        const errorDetails = Object.entries(response.errors)
          .map(
            ([field, messages]) =>
              `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
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
      'Network error: Failed to create event. Please check your connection and try again.'
    )
  }
}

// Watchers
watch(
  () => route.query.createEvent,
  () => {
    maybeOpenCreateModalFromRoute()
  },
  { immediate: true }
)

watch(
  () => route.query.view,
  (newView) => {
    if (newView === 'all') {
      router.replace('/explore')
    }
  },
  { immediate: true }
)

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      maybeOpenCreateModalFromRoute()
      loadEvents('my', {})
    } else {
      events.value = []
    }
  }
)

// Lifecycle
onMounted(async () => {
  loadCategories()

  if (authStore.isAuthenticated) {
    const result = await loadEvents('my', {})
    if (!result.success && result.message) {
      showMessage('error', result.message)
    }
  }

  setupStickyObserver()
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
