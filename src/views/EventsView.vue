<template>
  <!-- The signed-out landing owns the whole viewport: app nav, tab bar, contact
       FAB and footer all step aside so the hero is the only thing on screen,
       with its own minimal bar (mark + Sign In) floating over it. -->
  <MainLayout
    :contact-fab-has-fab-below="showCreateFab"
    :hide-top-nav="showLanding"
    :hide-mobile-tab-bar="showLanding"
    :hide-contact-fab="showLanding"
  >
    <!-- min-height offsets MainLayout's bottom pad (--nav-inset, the floating
         tab bar) / lg:pt-16 (desktop nav) so the sticky footer lands at the
         viewport bottom without a phantom scrollbar -->
    <div
      class="flex flex-col bg-gradient-to-r from-[#2ecc71]/[0.02] via-white/0 to-[#1e90ff]/[0.02]"
      :class="
        showLanding
          ? ''
          : 'min-h-[calc(100vh_-_var(--nav-inset))] lg:min-h-[calc(100vh-4rem)]'
      "
    >
      <!-- Mobile Top Bar -->
      <MobileTopBar v-if="!showLanding" />

      <!-- Signed-out landing: full-bleed, so the tile field can run to the
           edges. It replaces the page header and the sign-in empty state. -->
      <EventsLandingHero v-if="showLanding" @create="handleCreateEventClick" />

      <!-- Main Content -->
      <section v-else class="flex-1 flex flex-col py-4 sm:py-6 lg:py-[clamp(1.25rem,3vh,2rem)]">
        <div class="flex-1 flex flex-col w-full max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Page header. On mobile this is also the top bar's expanded state,
               which is why the title lives here rather than in the bar. -->
          <PageHeaderRow :title="t('events.title')" :icon="Ticket">
            <!-- Upcoming/Past/Recent toggle + category filter. As the header
                 scrolls under the top bar, PinnedListControls hands them to it
                 at the same size and column position, so they stay reachable. -->
            <PinnedListControls
              v-model:time-filter="timeFilter"
              :time-options="timeFilterOptions"
              v-model:category="categoryFilter"
              :categories="categories"
            />
          </PageHeaderRow>

          <!-- Loading State -->
          <EventsLoadingSkeleton v-if="loading" />

          <!-- Events Timeline -->
          <EventTimeline
            v-else-if="hasEvents"
            :date-groups="groupedByDate"
            :show-manage-button="true"
            :show-missing-location="true"
            :show-like-button="false"
            @event-click="viewEvent"
            @event-manage="manageEvent"
          />

          <!-- Empty State (my-auto centers it in the leftover column height;
               the slight lift optically balances the bottom tab bar) -->
          <EventsEmptyState
            v-else-if="isEmpty"
            class="my-auto -translate-y-6"
            :title="emptyStateTitle"
            :description="emptyStateDescription"
            :action-label="t('events.createFirstEvent')"
            :show-action="timeFilter === 'upcoming' || timeFilter === 'recent'"
            @action="handleCreateEventClick"
          />
        </div>
      </section>

      <!-- Footer -->
      <AppFooter v-if="!showLanding" />

      <!-- Create Event FAB. A satellite of the floating tab bar rather than a
           corner fixture: it sits one gap above the pill (`--fab-bottom`), and
           is a size down from the desktop FAB so the pair reads as bar-plus-
           action instead of two objects of equal weight. The tooltip is
           desktop-only — on touch there is no hover to reveal it, only a
           press that would leave it stuck on screen. -->
      <button
        v-if="showCreateFab"
        @click="handleCreateEventClick"
        class="fixed bottom-[var(--fab-bottom)] right-4 lg:right-6 w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center z-[60] group"
        :aria-label="t('events.createEvent')"
      >
        <Plus
          class="w-6 h-6 transition-transform duration-300 group-hover:rotate-90"
        />
        <div
          class="hidden lg:block absolute right-full mr-4 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none"
        >
          {{ t('events.createEvent') }}
        </div>
      </button>

      <!-- Event Create Drawer -->
      <EventCreateDrawer
        :is-visible="showCreateModal"
        @close="showCreateModal = false"
        @submit="handleEventCreate"
      />

      <!-- Delete Confirm Modal -->
      <DeleteConfirmModal
        :show="showDeleteModal"
        :loading="isDeleting"
        :title="t('events.deleteConfirm.title')"
        :item-name="eventToDelete?.title"
        :message="t('events.deleteConfirm.message')"
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
        @registration-changed="handleRegistrationChanged"
        @login-required="handleLoginRequired"
        @like-changed="handleDrawerLikeChanged"
        @open-event="handleOpenRelatedEvent"
      />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
// Ticket is this page's tab icon in MobileTabBar; the mobile header reuses it.
import { Plus, Ticket } from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import EventCreateDrawer from '@/components/EventCreateDrawer.vue'
import DeleteConfirmModal from '@/components/DeleteConfirmModal.vue'
import PublicEventDrawer from '@/components/PublicEventDrawer.vue'
import AppFooter from '@/components/AppFooter.vue'
import {
  MobileTopBar,
  PageHeaderRow,
  EventTimeline,
  PinnedListControls,
  EventsEmptyState,
  EventsLandingHero,
  EventsLoadingSkeleton,
} from '@/components/events'
import { useAuthStore } from '@/stores/auth'
import { useCategoryFilter } from '@/composables/useCategoryFilter'
import { useStickyDateHeaders } from '@/composables/useStickyDateHeaders'
import { groupEventsByDate } from '@/composables/useEventFormatters'
import { eventsService, type Event } from '@/services/api'
import { useEventsData } from '@/composables/useEventsData'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useAppLanguage()
const { showToast } = useToast()

// Category filter
const { categories, categoryFilter, loadCategories } = useCategoryFilter()

// Time filter
type TimeFilterValue = 'upcoming' | 'past' | 'recent'
const timeFilter = ref<TimeFilterValue>('recent')
const timeFilterOptions = computed(() => [
  { value: 'recent', label: t('events.filters.recent') },
  { value: 'upcoming', label: t('events.filters.upcoming') },
  { value: 'past', label: t('events.filters.past') },
])

// UI state
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
  // Get start of today (midnight) for date-only comparison
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return events.value.filter((event) => {
    // Time filter
    let passesTimeFilter = true
    if (timeFilter.value === 'recent') {
      passesTimeFilter = true
    } else {
      const eventDate = new Date(event.start_date)
      // Get start of event day for date-only comparison
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
      // "Upcoming" includes today and future, "Past" is before today
      passesTimeFilter =
        timeFilter.value === 'upcoming' ? eventDay >= startOfToday : eventDay < startOfToday
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

/**
 * Signed out, /events is a landing page rather than a list: the marketing hero
 * replaces the page header, the empty state, and all of the app chrome.
 */
const showLanding = computed(() => !authStore.isAuthenticated)

// The FAB is redundant while an empty state with its own Create Event button
// is shown; keep it for the 'past' filter, whose empty state has no action.
const showCreateFab = computed(
  () => hasEvents.value || (isEmpty.value && timeFilter.value === 'past')
)

// Empty state messages
const emptyStateTitle = computed(() => {
  if (timeFilter.value === 'upcoming') return t('events.emptyState.noUpcomingTitle')
  if (timeFilter.value === 'past') return t('events.emptyState.noPastTitle')
  return t('events.emptyState.noEventsTitle')
})

const emptyStateDescription = computed(() => {
  if (timeFilter.value === 'upcoming') return t('events.emptyState.noUpcomingDescription')
  if (timeFilter.value === 'past') return t('events.emptyState.noPastDescription')
  return t('events.emptyState.noEventsDescription')
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

/** Keep the list card's heart in step with a like made inside the drawer. */
const handleDrawerLikeChanged = (
  eventId: string,
  isLiked: boolean,
  likesCount: number
) => {
  const index = events.value.findIndex((e) => e.id === eventId)
  if (index !== -1) {
    events.value[index] = { ...events.value[index], is_liked: isLiked, likes_count: likesCount }
  }
}

/**
 * Follow a "More in {category}" link from inside the drawer. The target is
 * usually outside this list, so the index only syncs when it is present —
 * prev/next then falls idle instead of paging from a stale position.
 */
const handleOpenRelatedEvent = (eventId: string) => {
  selectedEventId.value = eventId
  selectedEventIndex.value = filteredEvents.value.findIndex((e) => e.id === eventId)
}

/**
 * Reflect a registration made inside the drawer on the card behind it, rather
 * than re-fetching the whole list to move one counter.
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
      showMessage('success', t('events.messages.deleteSuccess'))
      closeDeleteModal()
      await loadEvents('my', {})
    } else {
      showMessage('error', response.message || t('events.messages.deleteError'))
      isDeleting.value = false
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error deleting event:', error)
    }
    showMessage('error', t('events.messages.deleteError'))
    isDeleting.value = false
  }
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  eventToDelete.value = null
  isDeleting.value = false
}

const showMessage = (type: 'success' | 'error', text: string) => {
  showToast(type, text)
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
  auto_populate?: boolean
}

const handleEventCreate = async (formData: EventFormData) => {
  try {
    const eventData = {
      title: formData.title,
      description: formData.description,
      short_description: formData.short_description || '',
      start_date: formData.start_date,
      end_date: formData.end_date,
      location: formData.location || '',
      is_virtual: formData.is_virtual || false,
      virtual_link: formData.virtual_link || '',
      privacy: formData.privacy,
      ...(formData.status && {
        status: formData.status as 'draft' | 'published' | 'cancelled' | 'completed',
      }),
      category: formData.category
        ? typeof formData.category === 'string'
          ? parseInt(formData.category)
          : formData.category
        : null,
      max_attendees: formData.max_attendees || null,
      registration_required: formData.registration_required || false,
      registration_deadline: formData.registration_deadline || null,
      timezone: formData.timezone || 'UTC',
      ...(formData.auto_populate && { auto_populate: true }),
    }

    const response = await eventsService.createEvent(eventData)

    if (response.success && response.data) {
      showMessage('success', t('events.messages.createSuccess'))
      timeFilter.value = 'recent'
      await loadEvents('my', {})
    } else {
      let errorMessage = response.message || t('events.messages.createError')

      if (response.errors) {
        const errorDetails = Object.entries(response.errors)
          .map(
            ([field, messages]) =>
              `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
          )
          .join('; ')
        errorMessage = `${t('events.messages.validationErrors')}: ${errorDetails}`
      }

      showMessage('error', errorMessage)
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error creating event:', error)
    }
    showMessage('error', t('events.messages.networkError'))
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

