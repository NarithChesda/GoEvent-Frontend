<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-r from-[#2ecc71]/[0.02] via-white to-[#1e90ff]/[0.02]">

    <!-- Main Content -->
    <section class="py-8 sm:py-12 lg:py-16">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header with Toggle -->
        <div class="flex items-center justify-between mb-8 sm:mb-10">
          <h1 class="text-3xl sm:text-4xl font-bold text-slate-900">
            Events
          </h1>

          <!-- Filters -->
          <div class="flex items-center gap-3">
            <!-- Category Filter Dropdown -->
            <div class="relative">
              <select
                v-model="categoryFilter"
                class="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium pl-4 pr-8 py-2 rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2ecc71]/30"
                :class="categoryFilter ? 'bg-gradient-to-r from-[#2ecc71]/10 to-[#1e90ff]/10 text-slate-900' : ''"
              >
                <option value="">All Categories</option>
                <option v-for="category in categories" :key="category.id" :value="category.name">
                  {{ category.name }}
                </option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            <!-- Upcoming/Past Toggle -->
            <div class="flex items-center bg-slate-100 rounded-full p-1">
              <button
                @click="timeFilter = 'upcoming'"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-full transition-all duration-200',
                  timeFilter === 'upcoming'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                ]"
              >
                Upcoming
              </button>
              <button
                @click="timeFilter = 'past'"
                :class="[
                  'px-4 py-2 text-sm font-medium rounded-full transition-all duration-200',
                  timeFilter === 'past'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                ]"
              >
                Past
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="space-y-8">
          <div v-for="i in 3" :key="`skeleton-${i}`" class="flex gap-6">
            <div class="w-24 flex-shrink-0">
              <div class="h-4 bg-slate-200 rounded w-16 mb-2 animate-pulse"></div>
              <div class="h-3 bg-slate-200 rounded w-12 animate-pulse"></div>
            </div>
            <div class="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-pulse">
              <div class="flex gap-4">
                <div class="flex-1 space-y-3">
                  <div class="h-3 bg-slate-200 rounded w-16"></div>
                  <div class="h-5 bg-slate-200 rounded w-3/4"></div>
                  <div class="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div class="h-4 bg-slate-200 rounded w-1/3"></div>
                </div>
                <div class="w-32 h-24 bg-slate-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Events Timeline -->
        <div v-else-if="hasEvents" class="space-y-8">
          <div
            v-for="(dateGroup, index) in groupedByDate"
            :key="dateGroup.date"
            class="relative flex gap-4"
          >
            <!-- Left: Date Column (Sticky) -->
            <div class="w-24 flex-shrink-0">
              <div class="sticky top-20 lg:top-24 pt-1">
                <div class="text-slate-900 font-semibold text-lg">{{ dateGroup.monthDay }}</div>
                <div class="text-slate-400 text-base">{{ dateGroup.weekday }}</div>
              </div>
            </div>

            <!-- Middle: Timeline -->
            <div class="flex flex-col items-center flex-shrink-0 relative">
              <!-- Timeline dot (Sticky) -->
              <div class="sticky top-20 lg:top-24 z-10">
                <div class="w-2.5 h-2.5 rounded-full bg-slate-300 mt-2"></div>
              </div>
              <!-- Timeline line -->
              <div
                v-if="index < groupedByDate.length - 1 || dateGroup.events.length > 1"
                class="absolute top-4 bottom-0 w-px bg-slate-200"
              ></div>
            </div>

            <!-- Right: Event Cards -->
            <div class="flex-1 space-y-4 pb-2">
              <div
                v-for="event in dateGroup.events"
                :key="event.id"
                class="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200 overflow-hidden cursor-pointer group"
                @click="viewEvent(event)"
              >
                <div class="p-5 flex gap-4">
                  <!-- Event Details -->
                  <div class="flex-1 min-w-0">
                    <!-- Time and Category -->
                    <div class="flex items-center gap-2 text-sm mb-1">
                      <span class="text-slate-400">{{ formatEventTime(event.start_date) }}</span>
                      <span v-if="getEventCategory(event)" class="px-2 py-0.5 bg-gradient-to-r from-[#2ecc71]/10 to-[#1e90ff]/10 text-[#2ecc71] rounded-full text-xs font-medium">
                        {{ getEventCategory(event) }}
                      </span>
                    </div>

                    <!-- Title -->
                    <h3 class="text-lg font-semibold text-slate-900 mb-2 group-hover:text-[#2ecc71] transition-colors">
                      {{ event.title }}
                    </h3>

                    <!-- Hosts -->
                    <div v-if="getEventHosts(event).length > 0" class="flex items-center gap-2 text-sm mb-2">
                      <div class="flex -space-x-1">
                        <div
                          v-for="(host, idx) in getEventHosts(event).slice(0, 3)"
                          :key="idx"
                          class="w-5 h-5 rounded-full border border-white overflow-hidden bg-slate-200"
                        >
                          <img
                            v-if="host.image"
                            :src="host.image"
                            :alt="host.name"
                            class="w-full h-full object-cover"
                          />
                          <div v-else class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white text-xs font-medium">
                            {{ host.name.charAt(0).toUpperCase() }}
                          </div>
                        </div>
                      </div>
                      <span class="text-slate-600">By {{ formatHostNames(event) }}</span>
                    </div>

                    <!-- Location -->
                    <div class="flex items-center gap-2 text-sm mb-2">
                      <template v-if="event.location">
                        <MapPin class="w-4 h-4 text-slate-400" />
                        <span class="text-slate-600">{{ event.location }}</span>
                      </template>
                      <template v-else>
                        <AlertTriangle class="w-4 h-4 text-amber-500" />
                        <span class="text-amber-600">Location Missing</span>
                      </template>
                    </div>

                    <!-- Guest Count -->
                    <div class="flex items-center gap-2 text-sm text-slate-500">
                      <Users class="w-4 h-4" />
                      <span>{{ getGuestCount(event) }}</span>
                    </div>

                    <!-- Manage Button (only for events user can edit) -->
                    <button
                      v-if="canManageEvent(event)"
                      @click.stop="manageEvent(event)"
                      class="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      Manage Event
                      <ArrowRight class="w-4 h-4" />
                    </button>
                  </div>

                  <!-- Event Image (landscape) -->
                  <div class="w-44 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
                    <img
                      v-if="getEventImage(event)"
                      :src="getEventImage(event) ?? undefined"
                      :alt="event.title"
                      class="w-full h-full object-cover"
                    />
                    <div
                      v-else
                      class="w-full h-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 flex items-center justify-center"
                    >
                      <CalendarDays class="w-8 h-8 text-[#2ecc71]/60" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Login Required State -->
        <div v-else-if="!authStore.isAuthenticated" class="text-center py-16 px-4">
          <div class="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 rounded-full flex items-center justify-center">
            <User class="w-16 h-16 text-[#2ecc71]" />
          </div>
          <h3 class="text-2xl font-bold text-slate-900 mb-3">
            Sign In Required
          </h3>
          <p class="text-slate-600 mb-6 max-w-md mx-auto">
            Please sign in to view and manage your events.
          </p>
          <button
            @click="goToLogin"
            class="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
          >
            Sign In to Continue
          </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="isEmpty" class="text-center py-16 px-4">
          <div class="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 rounded-full flex items-center justify-center">
            <CalendarDays class="w-16 h-16 text-[#2ecc71]" />
          </div>
          <h3 class="text-2xl font-bold text-slate-900 mb-3">
            {{ timeFilter === 'upcoming' ? 'No upcoming events' : 'No past events' }}
          </h3>
          <p class="text-slate-600 mb-6 max-w-md mx-auto">
            {{ timeFilter === 'upcoming'
              ? 'Start organizing amazing events and bring people together.'
              : 'Your past events will appear here.'
            }}
          </p>
          <button
            v-if="timeFilter === 'upcoming'"
            @click="handleCreateEventClick"
            class="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors"
          >
            Create Your First Event
          </button>
        </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  CalendarDays,
  Plus,
  CheckCircle,
  AlertCircle,
  User,
  MapPin,
  Users,
  ArrowRight,
  AlertTriangle,
} from 'lucide-vue-next'
import MainLayout from '../components/MainLayout.vue'
import EventCreateModal from '../components/EventCreateModal.vue'
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue'
import ContactUsFAB from '../components/ContactUsFAB.vue'
import PublicEventDrawer from '../components/PublicEventDrawer.vue'
import AppFooter from '../components/AppFooter.vue'
import { useAuthStore } from '../stores/auth'
import {
  eventsService,
  apiService,
  eventCategoriesService,
  type Event,
  type EventCategory,
} from '../services/api'
import { useEventsData } from '../composables/useEventsData'
import { ChevronDown } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Time filter state
const timeFilter = ref<'upcoming' | 'past'>('upcoming')
const categoryFilter = ref<string>('')
const categories = ref<EventCategory[]>([])
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
const {
  events,
  loading,
  loadEvents,
} = useEventsData(computed(() => authStore.isAuthenticated))

// Filter events based on time filter and category
const filteredEvents = computed(() => {
  const now = new Date()
  return events.value.filter(event => {
    // Time filter
    const eventDate = new Date(event.start_date)
    const passesTimeFilter = timeFilter.value === 'upcoming'
      ? eventDate >= now
      : eventDate < now

    // Category filter
    let passesCategoryFilter = true
    if (categoryFilter.value) {
      const eventCategory = getEventCategory(event)
      passesCategoryFilter = eventCategory === categoryFilter.value
    }

    return passesTimeFilter && passesCategoryFilter
  })
})

// Group events by date
const groupedByDate = computed(() => {
  const groups: { date: string; monthDay: string; weekday: string; events: Event[] }[] = []

  // Sort events by date
  const sortedEvents = [...filteredEvents.value].sort((a, b) => {
    const dateA = new Date(a.start_date).getTime()
    const dateB = new Date(b.start_date).getTime()
    return timeFilter.value === 'upcoming' ? dateA - dateB : dateB - dateA
  })

  sortedEvents.forEach(event => {
    const eventDate = new Date(event.start_date)
    const dateKey = eventDate.toISOString().split('T')[0]

    // Format date parts
    const monthDay = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'long' })

    const existingGroup = groups.find(g => g.date === dateKey)
    if (existingGroup) {
      existingGroup.events.push(event)
    } else {
      groups.push({
        date: dateKey,
        monthDay,
        weekday,
        events: [event]
      })
    }
  })

  return groups
})

// Computed properties
const hasEvents = computed(() => filteredEvents.value.length > 0)
const isEmpty = computed(() => !loading.value && authStore.isAuthenticated && filteredEvents.value.length === 0)

// Format event time
const formatEventTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

// Get guest count display
const getGuestCount = (event: Event) => {
  const count = (event as Event & { guest_count?: number; registrations?: unknown[] }).guest_count
    || (event as Event & { registrations?: unknown[] }).registrations?.length
    || 0
  if (count === 0) return 'No guests'
  if (count === 1) return '1 guest'
  return `${count} guests`
}

// Get event image
const getEventImage = (event: Event) => {
  if (event.banner_image) {
    return apiService.getProfilePictureUrl(event.banner_image)
  }
  if (event.photos && event.photos.length > 0) {
    return apiService.getProfilePictureUrl(event.photos[0].image)
  }
  return null
}

// Get event hosts
const getEventHosts = (event: Event) => {
  const hosts: { name: string; image: string | null }[] = []
  const eventWithHosts = event as Event & { hosts?: Array<{ name: string; profile_image?: string }> }

  if (eventWithHosts.hosts && eventWithHosts.hosts.length > 0) {
    eventWithHosts.hosts.forEach(host => {
      hosts.push({
        name: host.name,
        image: host.profile_image ? apiService.getProfilePictureUrl(host.profile_image) : null
      })
    })
  }

  return hosts
}

// Format host names for display
const formatHostNames = (event: Event) => {
  const hosts = getEventHosts(event)
  if (hosts.length === 0) return ''
  if (hosts.length === 1) return hosts[0].name
  if (hosts.length === 2) return `${hosts[0].name}, ${hosts[1].name}`
  return `${hosts[0].name}, ${hosts[1].name} & ${hosts.length - 2} other${hosts.length - 2 > 1 ? 's' : ''}`
}

// Get event category name
const getEventCategory = (event: Event) => {
  const eventWithCategory = event as Event & { category?: { name?: string } | number | string | null; category_name?: string }

  // Check for category_name field first
  if (eventWithCategory.category_name) {
    return eventWithCategory.category_name
  }

  // Check for category object with name
  if (eventWithCategory.category && typeof eventWithCategory.category === 'object') {
    const categoryObj = eventWithCategory.category as { name?: string }
    if (categoryObj.name) {
      return categoryObj.name
    }
  }

  return null
}

// Check if user can manage this event
const canManageEvent = (event: Event) => {
  return event.can_edit === true ||
    (authStore.user?.id && event.organizer === authStore.user.id)
}

// Methods
const goToLogin = () => {
  router.push({
    path: '/signin',
    query: { redirect: '/events' }
  })
}

const viewEvent = (event: Event) => {
  const canEditEvent =
    event.can_edit === true ||
    (authStore.user?.id && event.organizer === authStore.user.id)

  if (canEditEvent) {
    router.push(`/events/${event.id}/manage`)
    return
  }

  selectedEventId.value = event.id
  selectedEventIndex.value = filteredEvents.value.findIndex(e => e.id === event.id)
  showEventDrawer.value = true
}

const manageEvent = (event: Event) => {
  router.push(`/events/${event.id}/manage`)
}

// Drawer navigation
const hasDrawerPrev = computed(() => selectedEventIndex.value > 0)
const hasDrawerNext = computed(() => selectedEventIndex.value < filteredEvents.value.length - 1)

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
    return normalized === '' || normalized === '1' || normalized === 'true' || normalized === 'yes'
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

    const response = await eventsService.createEvent(eventData)

    if (response.success && response.data) {
      showMessage('success', 'Event created successfully!')
      await loadEvents('my', {})
    } else {
      let errorMessage = response.message || 'Failed to create event'

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

// Watchers
watch(
  () => route.query.createEvent,
  () => {
    maybeOpenCreateModalFromRoute()
  },
  { immediate: true },
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
  },
)

// Load categories
const loadCategories = async () => {
  try {
    const response = await eventCategoriesService.getCategories()
    if (response.success && response.data) {
      categories.value = response.data.results || []
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to load categories:', error)
    }
  }
}

// Lifecycle
onMounted(async () => {
  // Load categories
  loadCategories()

  if (authStore.isAuthenticated) {
    const result = await loadEvents('my', {})
    if (!result.success && result.message) {
      showMessage('error', result.message)
    }
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
