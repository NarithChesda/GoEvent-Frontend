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
          <div class="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 w-full max-w-xl sm:max-w-2xl md:max-w-3xl px-4 sm:px-6">
            <button
              @click="handleViewChange('my')"
              :class="[
                'flex items-center justify-center px-2 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-medium transition-all duration-300 backdrop-blur-sm border shadow-sm hover:shadow-lg',
                currentView === 'my'
                  ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-lg border-transparent'
                  : 'bg-white/80 hover:bg-white shadow-emerald-500/20 tab-inactive'
              ]"
            >
              <User class="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0" />
              <span>My Events</span>
            </button>

            <button
              @click="handleViewChange('all')"
              :class="[
                'flex items-center justify-center px-2 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-medium transition-all duration-300 backdrop-blur-sm border shadow-sm hover:shadow-lg',
                currentView === 'all'
                  ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-lg border-transparent'
                  : 'bg-white/80 hover:bg-white shadow-emerald-500/20 tab-inactive'
              ]"
            >
              <Globe class="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0" />
              <span>Public Events</span>
            </button>

            <button
              @click="handleViewChange('registered')"
              :class="[
                'flex items-center justify-center px-2 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs md:text-sm font-medium transition-all duration-300 backdrop-blur-sm border shadow-sm hover:shadow-lg',
                currentView === 'registered'
                  ? 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-lg border-transparent'
                  : 'bg-white/80 hover:bg-white shadow-emerald-500/20 tab-inactive'
              ]"
            >
              <CheckCircle class="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0" />
              <span>Registered</span>
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
          <!-- For Public Events: Show by Category -->
          <template v-if="currentView === 'all'">
            <div v-for="categoryGroup in eventsByCategory" :key="categoryGroup.category?.id || 'uncategorized'" class="space-y-4 sm:space-y-6">
              <!-- Category Header -->
              <div class="flex items-center justify-between px-4 sm:px-0">
                <h2 class="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
                  {{ categoryGroup.category?.name || 'Uncategorized' }}
                </h2>
                <div class="flex items-center gap-3 sm:gap-4">
                  <span class="text-xs sm:text-sm text-slate-500">
                    {{ categoryGroup.events.length }} {{ categoryGroup.events.length === 1 ? 'event' : 'events' }}
                  </span>
                  <!-- Navigation Arrows - Only show if content overflows (hidden on mobile) -->
                  <div v-if="categoryHasOverflow(categoryGroup.category?.id || 'uncategorized')" class="hidden md:flex items-center gap-2">
                    <button
                      @click="scrollCategory(categoryGroup.category?.id || 'uncategorized', 'left')"
                      class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft class="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      @click="scrollCategory(categoryGroup.category?.id || 'uncategorized', 'right')"
                      class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
                      aria-label="Scroll right"
                    >
                      <ChevronRight class="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Horizontal scrolling container for all screen sizes -->
              <div
                :ref="el => setCategoryScrollRef(categoryGroup.category?.id || 'uncategorized', el)"
                class="flex overflow-x-auto gap-4 sm:gap-6 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
              >
                <EventCard
                  v-for="event in categoryGroup.events"
                  :key="event.id"
                  :event="event"
                  @click="viewEvent(event)"
                  @edit="editEvent"
                  @delete="deleteEvent"
                  class="cursor-pointer flex-none w-[calc(75vw-2.25rem)] sm:w-[calc(45vw-2rem)] md:w-[calc((100vw-8rem)/3-1.5rem)] lg:w-[calc((1280px-8rem)/3-1.5rem)] xl:w-[calc((1536px-8rem)/3-1.5rem)] max-w-[450px] min-w-[225px] snap-center mobile-card"
                />
              </div>
            </div>
          </template>

          <!-- For My Events: Show by Category (like Public Events) -->
          <template v-else-if="currentView === 'my'">
            <div v-for="categoryGroup in myEventsByCategory" :key="categoryGroup.category?.id || 'uncategorized'" class="space-y-4 sm:space-y-6">
              <!-- Category Header -->
              <div class="flex items-center justify-between px-4 sm:px-0">
                <h2 class="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
                  {{ categoryGroup.category?.name || 'Uncategorized' }}
                </h2>
                <div class="flex items-center gap-3 sm:gap-4">
                  <span class="text-xs sm:text-sm text-slate-500">
                    {{ categoryGroup.events.length }} {{ categoryGroup.events.length === 1 ? 'event' : 'events' }}
                  </span>
                  <!-- Navigation Arrows - Only show if content overflows (hidden on mobile) -->
                  <div v-if="categoryHasOverflow('my-' + (categoryGroup.category?.id || 'uncategorized'))" class="hidden md:flex items-center gap-2">
                    <button
                      @click="scrollCategory('my-' + (categoryGroup.category?.id || 'uncategorized'), 'left')"
                      class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft class="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      @click="scrollCategory('my-' + (categoryGroup.category?.id || 'uncategorized'), 'right')"
                      class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
                      aria-label="Scroll right"
                    >
                      <ChevronRight class="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Horizontal scrolling container for all screen sizes -->
              <div
                :ref="el => setCategoryScrollRef('my-' + (categoryGroup.category?.id || 'uncategorized'), el)"
                class="flex overflow-x-auto gap-4 sm:gap-6 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
              >
                <EventCard
                  v-for="event in categoryGroup.events"
                  :key="event.id"
                  :event="event"
                  @click="viewEvent(event)"
                  @edit="editEvent"
                  @delete="deleteEvent"
                  class="cursor-pointer flex-none w-[calc(75vw-2.25rem)] sm:w-[calc(45vw-2rem)] md:w-[calc((100vw-8rem)/3-1.5rem)] lg:w-[calc((1280px-8rem)/3-1.5rem)] xl:w-[calc((1536px-8rem)/3-1.5rem)] max-w-[450px] min-w-[225px] snap-center mobile-card"
                />
              </div>
            </div>
          </template>

          <!-- For Registered: Show by Category (like Public Events) -->
          <template v-else>
            <div v-for="categoryGroup in registeredEventsByCategory" :key="categoryGroup.category?.id || 'uncategorized'" class="space-y-4 sm:space-y-6">
              <!-- Category Header -->
              <div class="flex items-center justify-between px-4 sm:px-0">
                <h2 class="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">
                  {{ categoryGroup.category?.name || 'Uncategorized' }}
                </h2>
                <div class="flex items-center gap-3 sm:gap-4">
                  <span class="text-xs sm:text-sm text-slate-500">
                    {{ categoryGroup.events.length }} {{ categoryGroup.events.length === 1 ? 'event' : 'events' }}
                  </span>
                  <!-- Navigation Arrows - Only show if content overflows (hidden on mobile) -->
                  <div v-if="categoryHasOverflow('registered-' + (categoryGroup.category?.id || 'uncategorized'))" class="hidden md:flex items-center gap-2">
                    <button
                      @click="scrollCategory('registered-' + (categoryGroup.category?.id || 'uncategorized'), 'left')"
                      class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft class="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      @click="scrollCategory('registered-' + (categoryGroup.category?.id || 'uncategorized'), 'right')"
                      class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
                      aria-label="Scroll right"
                    >
                      <ChevronRight class="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Horizontal scrolling container for all screen sizes -->
              <div
                :ref="el => setCategoryScrollRef('registered-' + (categoryGroup.category?.id || 'uncategorized'), el)"
                class="flex overflow-x-auto gap-4 sm:gap-6 pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
              >
                <EventCard
                  v-for="event in categoryGroup.events"
                  :key="event.id"
                  :event="event"
                  @click="viewEvent(event)"
                  @edit="editEvent"
                  @delete="deleteEvent"
                  class="cursor-pointer flex-none w-[calc(75vw-2.25rem)] sm:w-[calc(45vw-2rem)] md:w-[calc((100vw-8rem)/3-1.5rem)] lg:w-[calc((1280px-8rem)/3-1.5rem)] xl:w-[calc((1536px-8rem)/3-1.5rem)] max-w-[450px] min-w-[225px] snap-center mobile-card"
                />
              </div>
            </div>
          </template>
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
            {{ getLoginPromptMessage() }}
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
            {{ getEmptyStateTitle() }}
          </h3>
          <p class="text-sm sm:text-base lg:text-lg text-slate-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
            {{ getEmptyStateMessage() }}
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

    <!-- Floating Action Button -->
    <Transition name="fab-fade">
      <button
        v-if="authStore.isAuthenticated"
        @click="createEvent"
        class="fixed bottom-20 lg:bottom-4 right-6 w-14 h-14 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 transition-all duration-300 hover:scale-110 flex items-center justify-center z-50 group"
        aria-label="Create Event"
      >
        <Plus class="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
        <div
          class="absolute right-full mr-4 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none"
        >
          Create Event
        </div>
      </button>
    </Transition>

    <!-- Contact Us FAB (Telegram) -->
    <ContactUsFAB :smart-fab-visible="authStore.isAuthenticated" />

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
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  User,
  Globe,
} from 'lucide-vue-next'
import MainLayout from '../components/MainLayout.vue'
import EventCard from '../components/EventCard.vue'
import EventFilters from '../components/EventFilters.vue'
import EventCreateModal from '../components/EventCreateModal.vue'
import DeleteConfirmModal from '../components/DeleteConfirmModal.vue'
import ContactUsFAB from '../components/ContactUsFAB.vue'
import { useAuthStore } from '../stores/auth'
import {
  eventsService,
  eventCategoriesService,
  type Event,
  type EventCategory,
  type EventFilters as EventFiltersType,
} from '../services/api'

type ViewType = 'all' | 'my' | 'registered'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Reactive state
const currentView = ref<ViewType>('all')
const events = ref<Event[]>([])
const categories = ref<EventCategory[]>([])
const loading = ref(false)
const filters = ref<EventFiltersType>({})
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const eventToDelete = ref<Event | null>(null)

// Infinite scroll state
const currentPage = ref(1)
const hasMore = ref(true)
const isLoadingMore = ref(false)
const loadMoreTrigger = ref<HTMLElement | null>(null)

// Computed
const safeEvents = computed(() => events.value || [])
const hasEvents = computed(() => safeEvents.value.length > 0)
const showLoginPrompt = computed(() => {
  return !loading.value && !authStore.isAuthenticated && (currentView.value === 'my' || currentView.value === 'registered')
})
const isEmpty = computed(() => !loading.value && !showLoginPrompt.value && safeEvents.value.length === 0)

// Helper function to group events by category (DRY principle)
const groupEventsByCategory = (
  events: Event[],
  sortByField: 'start_date' | 'created_at' = 'start_date'
): Array<{ category: EventCategory | null; events: Event[] }> => {
  // Create a map to group events by category
  const categoryMap = new Map<number | string, { category: EventCategory | null; events: Event[] }>()

  events.forEach(event => {
    const categoryId = event.category || 'uncategorized'

    if (!categoryMap.has(categoryId)) {
      // Find the full category details from the categories list
      const categoryDetails = event.category
        ? categories.value.find(cat => cat.id === event.category)
        : null

      categoryMap.set(categoryId, {
        category: categoryDetails || null,
        events: []
      })
    }

    categoryMap.get(categoryId)!.events.push(event)
  })

  // Convert map to array, sort categories alphabetically, and sort events within each category
  return Array.from(categoryMap.values())
    .map(categoryGroup => {
      // Sort events within each category by the specified field (newest first)
      const sortedEvents = [...categoryGroup.events].sort((a, b) => {
        const dateA = new Date((sortByField === 'start_date' ? a.start_date : a.created_at) || 0).getTime()
        const dateB = new Date((sortByField === 'start_date' ? b.start_date : b.created_at) || 0).getTime()
        return dateB - dateA // Descending order (newest first)
      })

      return {
        category: categoryGroup.category,
        events: sortedEvents
      }
    })
    .sort((a, b) => {
      const nameA = a.category?.name || 'Uncategorized'
      const nameB = b.category?.name || 'Uncategorized'
      // Put uncategorized at the end
      if (nameA === 'Uncategorized') return 1
      if (nameB === 'Uncategorized') return -1
      return nameA.localeCompare(nameB)
    })
}

// Group events by category for public events view
const eventsByCategory = computed(() => {
  if (currentView.value !== 'all') return []
  return groupEventsByCategory(safeEvents.value, 'start_date')
})

// Group events by category for my events view
const myEventsByCategory = computed(() => {
  if (currentView.value !== 'my') return []
  return groupEventsByCategory(safeEvents.value, 'created_at')
})

// Group events by category for registered events view
const registeredEventsByCategory = computed(() => {
  if (currentView.value !== 'registered') return []
  return groupEventsByCategory(safeEvents.value, 'created_at')
})

const getEmptyStateTitle = () => {
  switch (currentView.value) {
    case 'my':
      return "You haven't created any events yet"
    case 'registered':
      return "You haven't registered for any events yet"
    default:
      return 'No events found'
  }
}

const getEmptyStateMessage = () => {
  switch (currentView.value) {
    case 'my':
      return 'Start organizing amazing events and bring people together for memorable experiences.'
    case 'registered':
      return 'Explore public events and register for ones that interest you.'
    default:
      return 'Try adjusting your filters or check back later for new events.'
  }
}

const getSectionLabel = () => {
  switch (currentView.value) {
    case 'my':
      return 'My Events'
    case 'registered':
      return 'Events I\'m Attending'
    default:
      return 'Public Events'
  }
}

const getLoginPromptMessage = () => {
  switch (currentView.value) {
    case 'my':
      return 'Please sign in to view and manage your events.'
    case 'registered':
      return 'Please sign in to see the events you have registered for.'
    default:
      return 'Please sign in to continue.'
  }
}

// Methods
const handleViewChange = (view: ViewType) => {
  currentView.value = view
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

// Category scroll management
const categoryScrollRefs = ref<Record<string | number, HTMLElement>>({})
const categoryOverflowState = ref<Record<string | number, boolean>>({})

const setCategoryScrollRef = (categoryId: string | number, el: unknown) => {
  if (el && el instanceof HTMLElement) {
    categoryScrollRefs.value[categoryId] = el
    // Check if content overflows after a short delay to allow rendering
    setTimeout(() => {
      checkCategoryOverflow(categoryId)
    }, 100)
  }
}

const checkCategoryOverflow = (categoryId: string | number) => {
  try {
    const container = categoryScrollRefs.value[categoryId]
    if (!container) return

    // Check if scrollWidth is greater than clientWidth (content overflows)
    categoryOverflowState.value[categoryId] = container.scrollWidth > container.clientWidth
  } catch (error) {
    // Silently handle errors to prevent UI disruption
    console.warn(`Failed to check overflow for category ${categoryId}:`, error)
  }
}

const categoryHasOverflow = (categoryId: string | number): boolean => {
  return categoryOverflowState.value[categoryId] || false
}

const scrollCategory = (categoryId: string | number, direction: 'left' | 'right') => {
  const container = categoryScrollRefs.value[categoryId]
  if (!container) return

  const scrollAmount = container.clientWidth * 0.8 // Scroll 80% of container width
  const currentScroll = container.scrollLeft
  const targetScroll = direction === 'left'
    ? currentScroll - scrollAmount
    : currentScroll + scrollAmount

  container.scrollTo({
    left: targetScroll,
    behavior: 'smooth'
  })
}

// Client-side filter helper function for My Events and Registered tabs
const applyClientSideFilters = (events: Event[], filterValues: EventFiltersType): Event[] => {
  let filteredEvents = [...events]

  // Apply search filter
  if (filterValues.search) {
    const searchTerm = filterValues.search.toLowerCase()
    filteredEvents = filteredEvents.filter(event =>
      event.title?.toLowerCase().includes(searchTerm) ||
      event.description?.toLowerCase().includes(searchTerm) ||
      event.location?.toLowerCase().includes(searchTerm) ||
      event.category_name?.toLowerCase().includes(searchTerm) ||
      event.organizer_name?.toLowerCase().includes(searchTerm) ||
      event.short_description?.toLowerCase().includes(searchTerm)
    )
  }

  // Apply category filter
  if (filterValues.category) {
    filteredEvents = filteredEvents.filter(event => {
      // Category can be filtered by ID (number) or name (string)
      if (typeof filterValues.category === 'number') {
        return event.category === filterValues.category
      } else {
        return event.category_name === filterValues.category
      }
    })
  }

  // Apply date range filters
  if (filterValues.start_date_after) {
    const afterDate = new Date(filterValues.start_date_after)
    filteredEvents = filteredEvents.filter(event => {
      if (!event.start_date) return false
      const eventDate = new Date(event.start_date)
      return eventDate >= afterDate
    })
  }

  if (filterValues.start_date_before) {
    const beforeDate = new Date(filterValues.start_date_before)
    filteredEvents = filteredEvents.filter(event => {
      if (!event.start_date) return false
      const eventDate = new Date(event.start_date)
      return eventDate < beforeDate
    })
  }

  // Apply virtual/in-person filter
  if (filterValues.is_virtual !== undefined) {
    filteredEvents = filteredEvents.filter(event => event.is_virtual === filterValues.is_virtual)
  }

  // Apply sorting
  if (filterValues.ordering) {
    const ordering = filterValues.ordering
    filteredEvents.sort((a, b) => {
      let comparison = 0

      if (ordering === 'start_date' || ordering === '-start_date') {
        const dateA = new Date(a.start_date || 0).getTime()
        const dateB = new Date(b.start_date || 0).getTime()
        comparison = dateA - dateB
      } else if (ordering === 'title' || ordering === '-title') {
        comparison = (a.title || '').localeCompare(b.title || '')
      } else if (ordering === 'created_at' || ordering === '-created_at') {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        comparison = dateA - dateB
      } else if (ordering === 'registrations_count' || ordering === '-registrations_count') {
        comparison = (a.registrations_count || 0) - (b.registrations_count || 0)
      }

      // Reverse if ordering starts with '-'
      return ordering.startsWith('-') ? -comparison : comparison
    })
  }

  return filteredEvents
}

const loadEvents = async (append = false) => {
  // Don't load events if user is not authenticated and trying to view 'my' or 'registered' tabs
  if (!authStore.isAuthenticated && (currentView.value === 'my' || currentView.value === 'registered')) {
    events.value = []
    loading.value = false
    return
  }

  // Set loading state based on whether we're appending or replacing
  if (append) {
    isLoadingMore.value = true
  } else {
    loading.value = true
    // Reset pagination when loading fresh
    currentPage.value = 1
    hasMore.value = true
  }

  try {
    let response: any = null

    const requestParams = {
      ...filters.value,
    }

    if (currentView.value === 'my') {
      // Use dedicated /api/events/my/ endpoint for user's events
      // Note: This endpoint returns { organized: [...], collaborated: [...] }
      const myEventsResponse = await eventsService.getMyEvents(requestParams)
      if (myEventsResponse.success && myEventsResponse.data) {
        const organized = myEventsResponse.data.organized || []
        const collaborated = myEventsResponse.data.collaborated || []

        // Deduplicate events (user might be both organizer and collaborator)
        const eventMap = new Map<string, Event>()
        organized.forEach(event => eventMap.set(event.id, event))
        collaborated.forEach(event => {
          if (!eventMap.has(event.id)) {
            eventMap.set(event.id, event)
          }
        })
        let allMyEvents = Array.from(eventMap.values())

        // Apply client-side filtering for all filters
        allMyEvents = applyClientSideFilters(allMyEvents, filters.value)

        // Create a mock response to match expected structure
        response = {
          success: true,
          data: {
            results: allMyEvents,
            next: null, // No pagination for my events
          },
        }
      } else {
        response = {
          success: false,
          message: myEventsResponse.message || 'Failed to load events',
        }
      }
    } else if (currentView.value === 'registered') {
      // Use dedicated /api/events/my-registered/ endpoint for events user has registered for
      const registeredResponse = await eventsService.getMyRegisteredEvents(requestParams)
      if (registeredResponse.success && registeredResponse.data) {
        // The API returns an array directly, not a paginated response
        let registeredEvents = registeredResponse.data || []

        // Apply client-side filtering for all filters
        registeredEvents = applyClientSideFilters(registeredEvents, filters.value)

        // Create a mock response to match expected structure
        response = {
          success: true,
          data: {
            results: registeredEvents,
            next: null, // No pagination for registered events
          },
        }
      } else {
        response = {
          success: false,
          message: registeredResponse.message || 'Failed to load registered events',
        }
      }
    } else {
      // For all public events - use pagination
      const publicEventParams = {
        ...requestParams,
        page: append ? currentPage.value : 1,
        // Only set defaults if user hasn't specified these filters
        privacy: requestParams.privacy || 'public',
        status: requestParams.status || 'published',
        // Order by category name first (alphabetically), then by start_date (newest first)
        ordering: requestParams.ordering || 'category__name,-start_date',
      }
      response = await eventsService.getEvents(publicEventParams)
    }

    if (response.success && response.data) {
      const newEvents = response.data.results || []

      if (append) {
        // Append new events to existing ones
        events.value = [...events.value, ...newEvents]
      } else {
        // Replace events
        events.value = newEvents
      }

      // Check if there are more pages
      hasMore.value = !!response.data.next

      // Re-check category overflow after DOM updates
      nextTick(() => {
        Object.keys(categoryScrollRefs.value).forEach(categoryId => {
          checkCategoryOverflow(categoryId)
        })
      })
    } else {
      if (!append) {
        events.value = []
      }
      showMessage('error', response.message || 'Failed to load events')
    }
  } catch (error) {
    console.error('Error loading events:', error)
    if (!append) {
      events.value = []
    }
    showMessage('error', 'An error occurred while loading events')
  } finally {
    loading.value = false
    isLoadingMore.value = false
  }
}

const loadMoreEvents = async () => {
  // Only load more if we're not already loading and there are more pages
  if (isLoadingMore.value || !hasMore.value || loading.value) {
    return
  }

  // Only apply infinite scroll to public events view
  if (currentView.value !== 'all') {
    return
  }

  // Increment page and load more events
  currentPage.value++
  await loadEvents(true)
}

const loadCategories = async () => {
  try {
    const response = await eventCategoriesService.getCategories()
    if (response.success && response.data) {
      categories.value = response.data.results || []
    } else {
      console.error('Failed to load categories:', response.message)
    }
  } catch (error) {
    console.error('Failed to load categories:', error)
  }
}

const viewEvent = (event: Event) => {
  router.push(`/events/${event.id}`)
}

const createEvent = () => {
  showCreateModal.value = true
}

const editEvent = (event: Event) => {
  // Navigate to event edit page (we'll create this later)
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
      loadEvents()
    } else {
      showMessage('error', response.message || 'Failed to delete event')
      isDeleting.value = false
    }
  } catch (error) {
    console.error('Error deleting event:', error)
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
  // Extended with defaults added by modal
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
    console.log('Creating event with data:', formData)

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
      virtual_link: formData.virtual_link || '', // API expects empty string, not null
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

    console.log('Sending event data to API:', eventData)
    const response = await eventsService.createEvent(eventData)
    console.log('API response:', response)

    if (response.success && response.data) {
      showMessage('success', 'Event created successfully!')

      // Store the target view to prevent race conditions
      const targetView = 'my'

      // Switch to "My Events" tab to show the newly created event
      currentView.value = targetView

      // Reload events to show the newly created event
      // (The watcher won't trigger if we're already on 'my' tab)
      await loadEvents()

      // Verify we're still on the correct view after loading completes
      // This handles the edge case where user switches tabs during loading
      if (currentView.value !== targetView) {
        console.log('View changed during event creation, skipping reload')
      }
    } else {
      console.error('Create event failed:', response)
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
    console.error('Error creating event:', error)
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
  [() => currentView.value, filters],
  async () => {
    await loadEvents()
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
      loadEvents()
    } else {
      // User logged out - if they're on 'my' or 'registered' tabs, clear events to show login prompt
      if (currentView.value === 'my' || currentView.value === 'registered') {
        events.value = []
      }
    }
  },
)

// Optimized: Single watcher for category overflow checking based on current view
// This prevents unnecessary watchers from firing on irrelevant view changes
watch(
  [() => currentView.value, () => events.value.length],
  () => {
    // Wait for DOM to update, then check category overflows for the current view only
    nextTick(() => {
      let categoriesToCheck: Array<{ category: EventCategory | null; events: Event[] }> = []
      let prefix = ''

      if (currentView.value === 'all') {
        categoriesToCheck = eventsByCategory.value
        prefix = ''
      } else if (currentView.value === 'my') {
        categoriesToCheck = myEventsByCategory.value
        prefix = 'my-'
      } else if (currentView.value === 'registered') {
        categoriesToCheck = registeredEventsByCategory.value
        prefix = 'registered-'
      }

      categoriesToCheck.forEach(categoryGroup => {
        const categoryId = prefix + (categoryGroup.category?.id || 'uncategorized')
        checkCategoryOverflow(categoryId)
      })
    })
  }
)

// Handle window resize to recalculate overflow
const handleResize = () => {
  // Recalculate overflow for all categories
  Object.keys(categoryScrollRefs.value).forEach(categoryId => {
    checkCategoryOverflow(categoryId)
  })
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
            loadMoreEvents()
          }
        })
      },
      {
        root: null,
        rootMargin: '200px', // Trigger 200px before reaching the element
        threshold: 0,
      }
    )

    observer.observe(trigger)
  }

  checkTrigger()
}

// Lifecycle
onMounted(async () => {
  // Check if there's a view parameter in the URL (from redirect after login)
  const viewParam = route.query.view as ViewType | undefined
  if (viewParam && ['all', 'my', 'registered'].includes(viewParam)) {
    currentView.value = viewParam
  }

  // Load initial data
  await loadCategories()

  // Load events after categories
  await loadEvents()

  // Set up infinite scroll
  setupInfiniteScroll()

  // Add resize listener
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // Clean up resize listener
  window.removeEventListener('resize', handleResize)

  // Clean up intersection observer
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

/* Floating Action Button Animation */
.fab-fade-enter-active,
.fab-fade-leave-active {
  transition: all 0.3s ease;
}

.fab-fade-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.fab-fade-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
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

/* Add subtle shadow indicators for scrollability */
@media (max-width: 767px) {
  .overflow-x-auto {
    position: relative;
  }

  /* Make edit/delete buttons visible on mobile cards */
  .mobile-card :deep(.group) .absolute.top-3.right-3 {
    opacity: 1 !important;
  }

  /* Adjust mobile card styling */
  .mobile-card {
    transform-origin: center;
    transition: transform 0.2s ease;
  }

  .mobile-card:active {
    transform: scale(0.98);
  }

  /* Improve touch targets on mobile */
  .mobile-card :deep(button) {
    min-width: 36px;
    min-height: 36px;
  }
}
</style>
