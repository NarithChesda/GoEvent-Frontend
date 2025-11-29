<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-r from-[#2ecc71]/[0.02] via-white to-[#1e90ff]/[0.02]">

    <!-- Main Content -->
    <section class="py-4 sm:py-6 lg:py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header with Toggle -->
        <div class="flex items-center justify-between mb-6 sm:mb-8 lg:mb-10">
          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
            Discover
          </h1>

          <!-- Date Range Toggle -->
          <div class="flex items-center bg-slate-100 rounded-full p-1">
            <button
              @click="setDateFilter('upcoming')"
              :class="[
                'px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-full transition-all duration-200',
                dateFilter === 'upcoming'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              ]"
            >
              Upcoming
            </button>
            <button
              @click="setDateFilter('all')"
              :class="[
                'px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium rounded-full transition-all duration-200',
                dateFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              ]"
            >
              All
            </button>
          </div>

          <!-- Category Filter Dropdown - Desktop only -->
          <div class="relative hidden sm:block">
            <select
              v-model="categoryFilter"
              @change="handleCategoryChange"
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
        </div>

        <!-- Mobile Category Filter - Horizontal scrollable pills -->
        <div v-if="categories.length > 0" class="sm:hidden -mx-4 px-4 mb-4 overflow-x-auto scrollbar-hide">
          <div class="flex items-center gap-2 pb-1">
            <button
              @click="categoryFilter = ''; handleCategoryChange()"
              :class="[
                'flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap',
                !categoryFilter
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              All
            </button>
            <button
              v-for="category in categories"
              :key="category.id"
              @click="categoryFilter = category.name; handleCategoryChange()"
              :class="[
                'flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap',
                categoryFilter === category.name
                  ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
            >
              {{ category.name }}
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="space-y-6 sm:space-y-8">
          <div v-for="i in 3" :key="`skeleton-${i}`">
            <!-- Mobile Skeleton -->
            <div class="sm:hidden">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-2 h-2 rounded-full bg-slate-200 animate-pulse"></div>
                <div class="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
              </div>
              <div class="pl-5">
                <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 animate-pulse">
                  <div class="flex gap-3">
                    <div class="flex-1 space-y-2">
                      <div class="h-3 bg-slate-200 rounded w-12"></div>
                      <div class="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div class="h-3 bg-slate-200 rounded w-1/2"></div>
                      <div class="h-3 bg-slate-200 rounded w-1/3"></div>
                    </div>
                    <div class="w-20 h-20 bg-slate-200 rounded-xl flex-shrink-0"></div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Desktop Skeleton -->
            <div class="hidden sm:flex gap-6">
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
        </div>

        <!-- Events Timeline -->
        <div v-else-if="hasEvents" class="space-y-6 sm:space-y-8">
          <div
            v-for="(dateGroup, index) in groupedByDate"
            :key="dateGroup.date"
            class="relative"
          >
            <!-- Mobile: Timeline with Date Header and Cards -->
            <div class="sm:hidden relative">
              <!-- Timeline line -->
              <div
                v-if="index < groupedByDate.length - 1"
                class="absolute left-[3.5px] top-7 bottom-0 w-px bg-slate-200"
              ></div>

              <!-- Date Header with Dot (becomes pill when sticky) -->
              <div class="sticky top-14 z-10 mb-3 date-header-sticky inline-flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0"></div>
                <div class="inline-flex items-baseline gap-2">
                  <span class="text-slate-900 font-semibold text-base">{{ dateGroup.monthDay }}</span>
                  <span class="text-slate-400 text-sm">{{ dateGroup.weekday }}</span>
                </div>
              </div>

              <!-- Mobile Event Cards -->
              <div class="space-y-3 ml-5">
                <div
                  v-for="event in dateGroup.events"
                  :key="`mobile-${event.id}`"
                  class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer"
                  @click="viewEvent(event)"
                >
                  <div class="p-4 flex gap-3">
                    <!-- Event Details -->
                    <div class="flex-1 min-w-0">
                      <!-- Time -->
                      <div class="text-sm text-slate-400 mb-1">
                        {{ formatEventTime(event.start_date) }}
                      </div>

                      <!-- Title -->
                      <h3 class="text-base font-semibold text-slate-900 mb-2 line-clamp-2">
                        {{ event.title }}
                      </h3>

                      <!-- Hosts (if available) -->
                      <div v-if="getEventHosts(event).length > 0" class="flex items-center gap-1.5 text-sm text-slate-500 mb-1.5">
                        <div class="flex -space-x-1">
                          <div
                            v-for="(host, idx) in getEventHosts(event).slice(0, 2)"
                            :key="idx"
                            class="w-4 h-4 rounded-full border border-white overflow-hidden bg-slate-200"
                          >
                            <img
                              v-if="host.image"
                              :src="host.image"
                              :alt="host.name"
                              class="w-full h-full object-cover"
                            />
                            <div v-else class="w-full h-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] flex items-center justify-center text-white text-[8px] font-medium">
                              {{ host.name.charAt(0).toUpperCase() }}
                            </div>
                          </div>
                        </div>
                        <span class="truncate">By {{ formatHostNames(event) }}</span>
                      </div>

                      <!-- Location -->
                      <div v-if="event.location" class="flex items-center gap-1.5 text-sm mb-1.5">
                        <MapPin class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span class="text-slate-500 truncate">{{ event.location }}</span>
                      </div>

                      <!-- Guest Count -->
                      <div class="flex items-center gap-1.5 text-sm text-slate-400">
                        <Users class="w-3.5 h-3.5" />
                        <span>{{ getGuestCount(event) }}</span>
                      </div>
                    </div>

                    <!-- Event Image (square on mobile) -->
                    <div class="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
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
                        <CalendarDays class="w-6 h-6 text-[#2ecc71]/60" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Desktop: Original Timeline Layout -->
            <div class="hidden sm:flex gap-4">
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

              <!-- Right: Event Cards (Desktop) -->
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
                      <div v-if="event.location" class="flex items-center gap-2 text-sm mb-2">
                        <MapPin class="w-4 h-4 text-slate-400" />
                        <span class="text-slate-600">{{ event.location }}</span>
                      </div>

                      <!-- Guest Count -->
                      <div class="flex items-center gap-2 text-sm text-slate-500">
                        <Users class="w-4 h-4" />
                        <span>{{ getGuestCount(event) }}</span>
                      </div>
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
        <div v-else-if="isEmpty" class="text-center py-16 px-4">
          <div class="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 rounded-full flex items-center justify-center">
            <CalendarDays class="w-16 h-16 text-[#2ecc71]" />
          </div>
          <h3 class="text-2xl font-bold text-slate-900 mb-3">
            No events found
          </h3>
          <p class="text-slate-600 mb-6 max-w-md mx-auto">
            Try adjusting your filters or check back later for new events.
          </p>
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
import {
  CalendarDays,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  MapPin,
  Users,
} from 'lucide-vue-next'
import MainLayout from '../components/MainLayout.vue'
import ContactUsFAB from '../components/ContactUsFAB.vue'
import PublicEventDrawer from '../components/PublicEventDrawer.vue'
import AppFooter from '../components/AppFooter.vue'
import {
  eventCategoriesService,
  apiService,
  type Event,
  type EventCategory,
  type EventFilters as EventFiltersType,
} from '../services/api'
import { useEventsData } from '../composables/useEventsData'

const route = useRoute()
const router = useRouter()

const categories = ref<EventCategory[]>([])
const filters = ref<EventFiltersType>({})
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const loadMoreTrigger = ref<HTMLElement | null>(null)

// Filter states
const categoryFilter = ref('')
const dateFilter = ref<'upcoming' | 'all'>('upcoming')

// Public Event Drawer state
const showEventDrawer = ref(false)
const selectedEventId = ref<string | null>(null)
const selectedEventIndex = ref<number>(-1)

// Use composables - always treat as public view
const {
  events,
  loading,
  hasMore,
  isLoadingMore,
  loadEvents,
  loadMoreEvents,
} = useEventsData(computed(() => true)) // Always pass true since explore doesn't require auth

// Group events by date
const groupedByDate = computed(() => {
  const groups: { date: string; monthDay: string; weekday: string; events: Event[] }[] = []

  // Filter events based on date filter
  const now = new Date()
  let filteredEvents = events.value

  if (dateFilter.value === 'upcoming') {
    filteredEvents = events.value.filter(event => {
      const eventDate = new Date(event.start_date)
      return eventDate >= now
    })
  }

  // Sort events by date (earliest first for discover)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = new Date(a.start_date).getTime()
    const dateB = new Date(b.start_date).getTime()
    return dateA - dateB
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
const hasEvents = computed(() => {
  if (dateFilter.value === 'upcoming') {
    const now = new Date()
    return events.value.some(event => new Date(event.start_date) >= now)
  }
  return events.value.length > 0
})
const isEmpty = computed(() => !loading.value && !hasEvents.value)

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

// Filter handlers
const handleCategoryChange = () => {
  filters.value = { ...filters.value, category: categoryFilter.value || undefined }
}

const setDateFilter = (filter: 'upcoming' | 'all') => {
  dateFilter.value = filter
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

// Handle event query parameter from search
const openEventFromQuery = () => {
  const eventId = route.query.event as string | undefined
  if (eventId) {
    selectedEventId.value = eventId
    showEventDrawer.value = true
    // Clear the query parameter
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

// Sticky header detection for mobile
let stickyObserver: IntersectionObserver | null = null

const setupStickyObserver = () => {
  // Clean up existing observer
  if (stickyObserver) {
    stickyObserver.disconnect()
  }

  // Only run on mobile
  if (window.innerWidth >= 640) return

  nextTick(() => {
    const stickyHeaders = document.querySelectorAll('.date-header-sticky')
    if (stickyHeaders.length === 0) return

    // Create sentinel elements and observer
    stickyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const header = entry.target.nextElementSibling as HTMLElement
          if (header?.classList.contains('date-header-sticky')) {
            if (!entry.isIntersecting) {
              header.classList.add('is-stuck')
            } else {
              header.classList.remove('is-stuck')
            }
          }
        })
      },
      { threshold: 0, rootMargin: '-57px 0px 0px 0px' }
    )

    stickyHeaders.forEach((header) => {
      // Create a sentinel element before each sticky header
      const sentinel = document.createElement('div')
      sentinel.className = 'sticky-sentinel'
      sentinel.style.height = '1px'
      sentinel.style.width = '1px'
      sentinel.style.position = 'absolute'
      sentinel.style.top = '0'
      sentinel.style.left = '0'
      header.parentElement?.insertBefore(sentinel, header)
      stickyObserver?.observe(sentinel)
    })
  })
}

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

  // Setup sticky observer after events load
  setupStickyObserver()

  // Check if there's an event to open from query params
  openEventFromQuery()
})

onUnmounted(() => {
  if (stickyObserver) {
    stickyObserver.disconnect()
  }
  // Clean up sentinel elements
  document.querySelectorAll('.sticky-sentinel').forEach((el) => el.remove())
})

// Re-setup sticky observer when events change
watch(
  () => groupedByDate.value,
  () => {
    // Clean up old sentinels
    document.querySelectorAll('.sticky-sentinel').forEach((el) => el.remove())
    setupStickyObserver()
  }
)
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

/* Date header sticky pill effect - covers bullet and text */
@media (max-width: 639px) {
  .date-header-sticky {
    width: fit-content;
    padding: 4px 12px 4px 8px;
    margin: -4px -12px -4px -8px;
    border-radius: 9999px;
    border: 1px solid transparent;
    background-color: transparent;
  }

  .date-header-sticky.is-stuck {
    background-color: rgb(255, 255, 255);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border-color: rgb(226, 232, 240);
  }
}
</style>
