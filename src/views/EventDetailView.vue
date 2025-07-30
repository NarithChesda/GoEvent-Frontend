<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <Navigation />

    <!-- Loading State -->
    <div v-if="loading" class="pt-24 pb-16">
      <div class="max-w-4xl mx-auto px-6 lg:px-8">
        <div class="animate-pulse">
          <div class="h-64 bg-slate-200 rounded-3xl mb-8"></div>
          <div class="h-8 bg-slate-200 rounded mb-4"></div>
          <div class="h-4 bg-slate-200 rounded mb-2"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
      </div>
    </div>

    <!-- Event Detail -->
    <div v-else-if="event">
      <!-- Hero Section -->
      <EventHeroSection
        :event="event"
        :can-register="canRegister"
        :is-registering="isRegistering"
        @register="registerForEvent"
        @join-virtual="joinVirtualEvent"
        @add-to-google-calendar="addToGoogleCalendar"
        @add-to-outlook-calendar="addToOutlookCalendar"
        @download-ics="downloadICSFile"
      />

      <!-- Main Content Section -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col lg:flex-row gap-8">
          <!-- Navigation Tabs -->
          <EventNavigationTabs
            :active-tab="activeTab"
            :tabs="navigationTabs"
            :can-view-attendees="canViewAttendees"
            :can-edit="event.can_edit"
            @tab-change="activeTab = $event"
          />

          <!-- Main Content Area -->
          <div class="flex-1 min-w-0">
            <!-- About Tab -->
            <EventAboutSection 
              v-if="activeTab === 'about'" 
              :event="event"
              @join-virtual="joinVirtualEvent"
            />

            <!-- Agenda Tab -->
            <div v-if="activeTab === 'agenda'">
              <EventAgendaTab
                v-if="event?.id"
                :event-id="event.id"
                :can-edit="event.can_edit || false"
              />
            </div>

            <!-- Hosts Tab -->
            <div v-if="activeTab === 'hosts'">
              <EventHostsTab
                v-if="event?.id"
                :event-id="event.id"
                :can-edit="event.can_edit || false"
              />
            </div>

            <!-- Event Texts Tab -->
            <div v-if="activeTab === 'event-texts'">
              <div v-if="!event?.can_edit || !event?.id" class="text-center py-8">
                <div v-if="!event?.id" class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <span class="text-lg text-slate-600 leading-relaxed">
                  {{ !event?.id ? 'Loading event data...' : 'You do not have permission to edit event texts.' }}
                </span>
              </div>
              <EventTextTab
                v-else
                :event-id="event.id"
              />
            </div>

            <!-- Attendees Tab -->
            <div v-if="activeTab === 'attendees' && canViewAttendees" class="space-y-8">
              <div class="space-y-6">
                <div
                  v-for="registration in event.registrations_details"
                  :key="registration.id"
                  class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-blue-500/25 p-6 hover:shadow-2xl hover:shadow-blue-600/30 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                      <div class="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {{ getInitials(registration.user_details.first_name || '', registration.user_details.last_name || '') }}
                      </div>
                      <div>
                        <h4 class="font-semibold text-slate-800 text-lg mb-1 leading-snug">
                          {{ registration.user_details.first_name }} {{ registration.user_details.last_name }}
                        </h4>
                        <p class="text-base text-slate-600 leading-relaxed">@{{ registration.user_details.username }}</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-base font-semibold text-slate-800 mb-1 leading-tight">
                        {{ registration.total_attendees }} {{ registration.total_attendees === 1 ? 'person' : 'people' }}
                      </div>
                      <div class="text-sm font-medium text-slate-500 tracking-wide">{{ registration.confirmation_code }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Media Tab -->
            <div v-if="activeTab === 'media'">
              <EventMediaTab
                v-if="event?.id"
                :event-id="event.id"
                :can-edit="event.can_edit || false"
                :initial-media="event.photos || []"
                :event-data="event"
                @media-updated="handleMediaUpdated"
                @event-updated="handleEventUpdated"
              />
            </div>

            <!-- Collaborator Tab -->
            <div v-if="activeTab === 'collaborator'">
              <EventCollaboratorsTab
                v-if="event?.id"
                :event-id="event.id"
                :can-edit="event.can_edit || false"
                :organizer-details="event.organizer_details"
              />
            </div>

            <!-- Template Tab -->
            <div v-if="activeTab === 'template'" class="space-y-8">
              <div class="space-y-6">
                <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-blue-500/25 p-6">
                  <h3 class="text-xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">Template Information</h3>
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <span class="text-lg text-slate-600 leading-relaxed">Template Enabled:</span>
                      <span class="font-semibold text-lg leading-tight" :class="event.event_template_enabled ? 'text-emerald-600' : 'text-slate-500'">
                        {{ event.event_template_enabled ? 'Yes' : 'No' }}
                      </span>
                    </div>
                    <div v-if="event.event_template" class="flex items-center justify-between">
                      <span class="text-lg text-slate-600 leading-relaxed">Template ID:</span>
                      <span class="font-semibold text-lg text-slate-800 leading-tight">{{ event.event_template }}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-lg text-slate-600 leading-relaxed">Event Category:</span>
                      <div class="flex items-center space-x-2">
                        <div
                          v-if="event.category_color"
                          class="w-3 h-3 rounded-full"
                          :style="{ backgroundColor: event.category_color }"
                        ></div>
                        <span class="font-semibold text-lg text-slate-800 leading-tight">{{ event.category_name || 'No Category' }}</span>
                      </div>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-lg text-slate-600 leading-relaxed">Event Status:</span>
                      <span class="font-semibold text-lg capitalize leading-tight"
                            :class="event.status === 'published' ? 'text-emerald-600' :
                                   event.status === 'draft' ? 'text-orange-600' :
                                   'text-red-600'">
                        {{ event.status }}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-lg text-slate-600 leading-relaxed">Privacy:</span>
                      <span class="font-semibold text-lg capitalize leading-tight"
                            :class="event.privacy === 'public' ? 'text-emerald-600' : 'text-purple-600'">
                        {{ event.privacy }}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <Footer />

      <!-- Floating Edit Button -->
      <div
        v-if="event?.can_edit"
        class="fixed bottom-8 right-8 z-40"
        @click.stop
      >
        <button
          @click="toggleActionMenu"
          class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center h-14 w-14 hover:scale-110"
          :class="{ 'ring-4 ring-blue-200': showActionMenu }"
        >
          <Pencil class="w-6 h-6" />
        </button>

        <!-- Event Action Menu -->
        <EventActionMenu
          :is-open="showActionMenu"
          :can-delete="canDeleteEvent"
          :event-title="event?.title || ''"
          :event-id="event?.id || ''"
          @close="closeActionMenu"
          @edit="handleEditEvent"
          @delete="handleDeleteEvent"
          ref="actionMenuRef"
        />
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="pt-24 pb-16">
      <div class="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <div class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-blue-500/25 p-12">
          <AlertTriangle class="w-16 h-16 text-red-600 mx-auto mb-6" />
          <h1 class="text-2xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">Event Not Found</h1>
          <p class="text-lg text-slate-600 mb-8 leading-relaxed max-w-prose mx-auto">{{ error }}</p>
          <button
            @click="$router.push('/events')"
            class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30"
          >
            Back to Events
          </button>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-8 right-8 z-50">
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

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Lock,
  Pencil,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  UserPlus,
  Users
} from 'lucide-vue-next'
import Navigation from '../components/Navigation.vue'
import Footer from '../components/Footer.vue'
import EventHeroSection from '../components/EventHeroSection.vue'
import EventAboutSection from '../components/EventAboutSection.vue'
import EventNavigationTabs from '../components/EventNavigationTabs.vue'
import EventAgendaTab from '../components/EventAgendaTab.vue'
import EventHostsTab from '../components/EventHostsTab.vue'
import EventTextTab from '../components/EventTextTab.vue'
import EventMediaTab from '../components/EventMediaTab.vue'
import EventCollaboratorsTab from '../components/EventCollaboratorsTab.vue'
import { useAuthStore } from '../stores/auth'
import { eventsService, type Event, type EventPhoto } from '../services/api'
import EventActionMenu from '../components/EventActionMenu.vue'
import type { TabConfig } from '../components/EventNavigationTabs.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State
const event = ref<Event | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const isRegistering = ref(false)
const activeTab = ref('about')
const showActionMenu = ref(false)
const actionMenuRef = ref<InstanceType<typeof EventActionMenu> | null>(null)

// Navigation tabs configuration
const navigationTabs = ref<TabConfig[]>([
  { id: 'about', label: 'About', icon: 'file-text' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar' },
  { id: 'hosts', label: 'Hosts & Speakers', icon: 'users', mobileLabel: 'Hosts' },
  { id: 'attendees', label: 'Attendees', icon: 'user-plus' },
  { id: 'media', label: 'Media', icon: 'image' },
  { id: 'collaborator', label: 'Collaborators', icon: 'users', mobileLabel: 'Team' },
  { id: 'event-texts', label: 'Event Texts', icon: 'file-text', mobileLabel: 'Texts' },
  { id: 'template', label: 'Template', icon: 'monitor' }
])

// Computed properties
const canRegister = computed(() => {
  if (!event.value || !authStore.isAuthenticated) return false
  if (event.value.is_registered || event.value.is_past) return false
  if (!event.value.registration_required) return false
  if (isEventFull.value || isRegistrationClosed.value) return false
  return true
})

const isEventFull = computed(() => {
  if (!event.value || !event.value.max_attendees) return false
  return event.value.registrations_count >= event.value.max_attendees
})

const isRegistrationClosed = computed(() => {
  if (!event.value || !event.value.registration_deadline) return false
  return new Date(event.value.registration_deadline) < new Date()
})


const canViewAttendees = computed(() => {
  if (!event.value || !authStore.isAuthenticated) return false
  return event.value.can_edit || event.value.privacy === 'public'
})

const canDeleteEvent = computed(() => {
  if (!event.value || !authStore.isAuthenticated) return false
  // Only the organizer (event creator) can delete the event
  return event.value.organizer === authStore.user?.id
})


// Removed unused daysUntilEvent computed property

// Methods
const loadEvent = async () => {
  const eventId = route.params.id as string
  if (!eventId) {
    error.value = 'Invalid event ID'
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await eventsService.getEvent(eventId)

    if (response.success && response.data) {
      event.value = response.data
    } else {
      error.value = response.message || 'Event not found'
    }
  } catch (err) {
    console.error('Error loading event:', err)
    error.value = 'Failed to load event details'
  } finally {
    loading.value = false
  }
}

const registerForEvent = async () => {
  if (!event.value || !authStore.isAuthenticated) return

  isRegistering.value = true

  try {
    const response = await eventsService.registerForEvent(event.value.id, {
      guest_count: 0,
      notes: ''
    })

    if (response.success) {
      showMessage('success', 'Successfully registered for the event!')
      // Reload event to update registration status
      await loadEvent()
    } else {
      showMessage('error', response.message || 'Failed to register for event')
    }
  } catch (error) {
    console.error('Error registering for event:', error)
    showMessage('error', 'An error occurred while registering')
  } finally {
    isRegistering.value = false
  }
}

const toggleActionMenu = () => {
  showActionMenu.value = !showActionMenu.value
}

const closeActionMenu = () => {
  showActionMenu.value = false
}

const handleEditEvent = (eventId: string) => {
  router.push(`/events/${eventId}/edit`)
}

const handleDeleteEvent = async (eventId: string) => {
  try {
    const response = await eventsService.deleteEvent(eventId)

    if (response.success) {
      showMessage('success', 'Event deleted successfully')
      // Close the action menu and reset its state
      actionMenuRef.value?.resetDeleting()
      closeActionMenu()
      // Navigate back to events list after a short delay
      setTimeout(() => {
        router.push('/events')
      }, 1500)
    } else {
      showMessage('error', response.message || 'Failed to delete event')
      actionMenuRef.value?.resetDeleting()
    }
  } catch (error) {
    console.error('Error deleting event:', error)
    showMessage('error', 'An error occurred while deleting the event')
    actionMenuRef.value?.resetDeleting()
  }
}

const joinVirtualEvent = () => {
  if (event.value?.virtual_link) {
    window.open(event.value.virtual_link, '_blank')
  }
}

const getBannerImageUrl = (bannerImage: string | null): string | undefined => {
  if (!bannerImage) return undefined

  // If it's already a full URL, return as is
  if (bannerImage.startsWith('http://') || bannerImage.startsWith('https://')) {
    return bannerImage
  }

  // If it's a relative URL, prepend the API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  if (bannerImage.startsWith('/')) {
    return `${API_BASE_URL}${bannerImage}`
  }

  // If it doesn't start with /, assume it needs /media/ prefix
  return `${API_BASE_URL}/media/${bannerImage}`
}

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
}


const getMediaUrl = (mediaUrl: string | null): string | undefined => {
  if (!mediaUrl) return undefined

  // If it's already a full URL, return as is
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    return mediaUrl
  }

  // If it's a relative URL, prepend the API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  if (mediaUrl.startsWith('/')) {
    return `${API_BASE_URL}${mediaUrl}`
  }

  // If it doesn't start with /, assume it needs /media/ prefix
  return `${API_BASE_URL}/media/${mediaUrl}`
}




const handleMediaUpdated = (updatedMedia: EventPhoto[]) => {
  if (event.value) {
    event.value.photos = updatedMedia
  }
}

const handleEventUpdated = (updatedEvent: Event) => {
  console.log('Event updated called with:', updatedEvent)
  console.log('Current event before update:', event.value)

  if (event.value && updatedEvent) {
    // Ensure critical properties are preserved
    const mergedEvent: Event = {
      ...event.value,
      ...updatedEvent,
      // Always preserve these critical properties if they exist
      id: updatedEvent.id || event.value.id,
      title: updatedEvent.title || event.value.title,
      can_edit: updatedEvent.can_edit !== undefined ? updatedEvent.can_edit : event.value.can_edit,
      // Preserve existing nested arrays if they're not in the update
      hosts: updatedEvent.hosts || event.value.hosts || [],
      agenda_items: updatedEvent.agenda_items || event.value.agenda_items || [],
      photos: updatedEvent.photos || event.value.photos || [],
      // Add any event texts if they exist in the update
      ...(updatedEvent as any).event_texts && { event_texts: (updatedEvent as any).event_texts },
      collaborators_details: updatedEvent.collaborators_details || event.value.collaborators_details || [],
      registrations_details: updatedEvent.registrations_details || event.value.registrations_details || [],
      organizer_details: updatedEvent.organizer_details || event.value.organizer_details,
      category_details: updatedEvent.category_details || event.value.category_details
    }

    console.log('Merged event data:', mergedEvent)
    event.value = mergedEvent
  } else if (updatedEvent) {
    console.log('No existing event, setting new event data')
    event.value = updatedEvent
  } else {
    console.warn('handleEventUpdated called with invalid data:', updatedEvent)
  }

  console.log('Event after update:', event.value)
}

const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Click outside handler for dropdown
const handleClickOutside = (clickEvent: MouseEvent) => {
  const target = clickEvent.target as Element
  const menuContainer = document.querySelector('.fixed.bottom-8.right-8')

  if (showActionMenu.value && menuContainer && !menuContainer.contains(target)) {
    closeActionMenu()
  }
}

// Date formatting utilities (still used in About section)
const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatEventTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}




// Calendar integration functions
const addToGoogleCalendar = () => {
  if (!event.value) return

  const startDate = new Date(event.value.start_date)
  const endDate = new Date(event.value.end_date)

  const formatDateForGoogle = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.value.title,
    dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
    details: event.value.description || event.value.short_description || '',
    location: event.value.is_virtual
      ? (event.value.virtual_link || 'Virtual Event')
      : (event.value.location || ''),
    trp: 'false'
  })

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank')
}

const addToOutlookCalendar = () => {
  if (!event.value) return

  const startDate = new Date(event.value.start_date)
  const endDate = new Date(event.value.end_date)

  const params = new URLSearchParams({
    subject: event.value.title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: event.value.description || event.value.short_description || '',
    location: event.value.is_virtual
      ? (event.value.virtual_link || 'Virtual Event')
      : (event.value.location || '')
  })

  window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank')
}

const downloadICSFile = () => {
  if (!event.value) return

  const startDate = new Date(event.value.start_date)
  const endDate = new Date(event.value.end_date)

  const formatDateForICS = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '')
  }

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GoEvent//Event Calendar//EN
BEGIN:VEVENT
UID:${event.value.id}@goevent.com
DTSTAMP:${formatDateForICS(new Date())}
DTSTART:${formatDateForICS(startDate)}
DTEND:${formatDateForICS(endDate)}
SUMMARY:${event.value.title}
DESCRIPTION:${event.value.description || event.value.short_description || ''}
LOCATION:${event.value.is_virtual
  ? (event.value.virtual_link || 'Virtual Event')
  : (event.value.location || '')}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${event.value.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}


// Lifecycle
onMounted(() => {
  loadEvent()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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

.prose p {
  margin-bottom: 1rem;
}

.prose br {
  margin-bottom: 0.5rem;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}



/* Line clamp utility for progressive disclosure */
.line-clamp-6 {
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

</style>
