<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">

    <!-- Loading State -->
    <div v-if="loading" class="pt-24 pb-16">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div class="flex flex-col md:flex-row gap-6 lg:gap-8">
          <!-- Navigation Tabs -->
          <EventNavigationTabs
            :active-tab="activeTab"
            :tabs="navigationTabs"
            :can-view-attendees="canViewAttendees"
            :can-view-media="canViewMedia"
            :can-view-collaborators="canViewCollaborators"
            :can-view-event-texts="canViewEventTexts"
            :can-view-template="canViewTemplate"
            :can-view-payment="canViewPayment"
            :can-view-invitation="canViewInvitation"
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
              <div v-if="!canViewEventTexts || !event?.id" class="text-center py-12">
                <div v-if="!event?.id">
                  <div
                    class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e90ff] mx-auto mb-2"
                  ></div>
                  <span class="text-lg text-slate-600 leading-relaxed">Loading event data...</span>
                </div>
                <div v-else>
                  <div
                    class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Lock class="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 class="text-lg font-semibold text-slate-900 mb-2">Access Restricted</h3>
                  <p class="text-slate-600 max-w-md mx-auto">
                    Only the event organizer and collaborators can view and manage event texts.
                  </p>
                </div>
              </div>
              <EventTextTab v-else :event-id="event.id" />
            </div>

            <!-- Attendees Tab -->
            <div v-if="activeTab === 'attendees'">
              <div v-if="!canViewAttendees" class="text-center py-12">
                <div
                  class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Lock class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Access Restricted</h3>
                <p class="text-slate-600 max-w-md mx-auto">
                  Only the event organizer and collaborators can view attendees.
                </p>
              </div>
              <EventAttendeesTab
                v-else
                :event-id="event.id"
                :can-edit="event.can_edit || false"
                :registrations="event.registrations_details"
              />
            </div>

            <!-- Media Tab -->
            <div v-if="activeTab === 'media'">
              <div v-if="!canViewMedia" class="text-center py-12">
                <div
                  class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Lock class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Access Restricted</h3>
                <p class="text-slate-600 max-w-md mx-auto">
                  Only the event organizer and collaborators can view and manage event media.
                </p>
              </div>
              <EventMediaTab
                v-else-if="event?.id"
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
              <div v-if="!canViewCollaborators" class="text-center py-12">
                <div
                  class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Lock class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Access Restricted</h3>
                <p class="text-slate-600 max-w-md mx-auto">
                  Only the event organizer and collaborators can view and manage team members.
                </p>
              </div>
              <EventCollaboratorsTab
                v-else-if="event?.id"
                :event-id="event.id"
                :can-edit="event.can_edit || false"
                :organizer-details="event.organizer_details"
              />
            </div>

            <!-- Payment Tab -->
            <div v-if="activeTab === 'payment'">
              <div v-if="!canViewPayment" class="text-center py-12">
                <div
                  class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Lock class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Access Restricted</h3>
                <p class="text-slate-600 max-w-md mx-auto">
                  Only the event organizer and collaborators can view and manage payments.
                </p>
              </div>
              <EventPaymentTab
                v-else-if="event?.id"
                :event-id="event.id"
                :event="event as any"
                :can-edit="event.can_edit || false"
                @tab-change="activeTab = $event"
                @event-updated="handleEventUpdated"
              />
            </div>

            <!-- Invitation Tab -->
            <div v-if="activeTab === 'invitation'">
              <div v-if="!canViewInvitation" class="text-center py-12">
                <div
                  class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Lock class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Access Restricted</h3>
                <p class="text-slate-600 max-w-md mx-auto">
                  Only the event organizer and collaborators can view and manage invitations.
                </p>
              </div>
              <EventInvitationTab
                v-else-if="event?.id"
                :event-id="event.id"
                :event="event"
                :can-edit="event.can_edit || false"
                @tab-change="activeTab = $event"
              />
            </div>

            <!-- Template Tab -->
            <div v-if="activeTab === 'template'">
              <div v-if="!canViewTemplate" class="text-center py-12">
                <div
                  class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Lock class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Access Restricted</h3>
                <p class="text-slate-600 max-w-md mx-auto">
                  Only the event organizer and collaborators can view and manage event templates.
                </p>
              </div>
              <EventTemplateTab
                v-else
                :event="event"
                :can-edit="event.can_edit || false"
                @template-updated="handleTemplateUpdated"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Footer - Hidden on mobile -->
      <div class="hidden md:block">
        <Footer />
      </div>

      <!-- Floating Edit Button -->
      <div v-if="event?.can_edit" class="fixed bottom-28 lg:bottom-8 right-6 z-[60]" @click.stop>
        <button
          @click="toggleActionMenu"
          class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-full shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center h-14 w-14 hover:scale-110"
          :class="{ 'ring-4 ring-[#87CEEB]': showActionMenu }"
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
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div
          class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl shadow-emerald-500/25 p-12"
        >
          <AlertTriangle class="w-16 h-16 text-red-600 mx-auto mb-6" />
          <h1 class="text-2xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">
            Event Not Found
          </h1>
          <p class="text-lg text-slate-600 mb-8 leading-relaxed max-w-prose mx-auto">{{ error }}</p>
          <button
            @click="$router.push('/events')"
            class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-600/30"
          >
            Back to Events
          </button>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-28 lg:bottom-8 right-6 z-50">
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
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, Pencil, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-vue-next'
import MainLayout from '../components/MainLayout.vue'
import Footer from '../components/Footer.vue'
import EventHeroSection from '../components/EventHeroSection.vue'
import EventAboutSection from '../components/EventAboutSection.vue'
import EventNavigationTabs from '../components/EventNavigationTabs.vue'
import EventAgendaTab from '../components/EventAgendaTab.vue'
import EventHostsTab from '../components/EventHostsTab.vue'
import EventTextTab from '../components/EventTextTab.vue'
import EventMediaTab from '../components/EventMediaTab.vue'
import EventCollaboratorsTab from '../components/EventCollaboratorsTab.vue'
import EventAttendeesTab from '../components/EventAttendeesTab.vue'
import EventTemplateTab from '../components/EventTemplateTab.vue'
import EventPaymentTab from '../components/EventPaymentTab.vue'
import EventInvitationTab from '../components/EventInvitationTab.vue'
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

// Navigation tabs configuration - optimized for user flow
const navigationTabs = ref<TabConfig[]>([
  { id: 'about', label: 'About', icon: 'file-text' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar' },
  { id: 'hosts', label: 'Hosts & Speakers', icon: 'users', mobileLabel: 'Hosts' },
  { id: 'attendees', label: 'Attendees', icon: 'user-plus' },
  { id: 'media', label: 'Media', icon: 'image' },
  { id: 'event-texts', label: 'Event Texts', icon: 'file-text', mobileLabel: 'Texts' },
  { id: 'collaborator', label: 'Collaborators', icon: 'users', mobileLabel: 'Team' },
  { id: 'template', label: 'Template', icon: 'monitor' },
  { id: 'payment', label: 'Payment', icon: 'credit-card' },
  { id: 'invitation', label: 'Invitations', icon: 'mail' },
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
  // Only organizer or collaborators can view attendees (no public access)
  return event.value.can_edit
})

// Comprehensive permission system for event tabs
const canViewRestrictedTabs = computed(() => {
  if (!event.value || !authStore.isAuthenticated) return false
  // Only organizer or collaborators can view restricted tabs
  return event.value.can_edit
})

const canViewMedia = computed(() => {
  return canViewRestrictedTabs.value
})

const canViewCollaborators = computed(() => {
  return canViewRestrictedTabs.value
})

const canViewEventTexts = computed(() => {
  return canViewRestrictedTabs.value
})

const canViewTemplate = computed(() => {
  return canViewRestrictedTabs.value
})

const canViewPayment = computed(() => {
  return canViewRestrictedTabs.value
})

const canViewInvitation = computed(() => {
  return canViewRestrictedTabs.value
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
      notes: '',
    })

    if (response.success) {
      showMessage('success', 'Successfully registered for the event!')
      // Reload event to update registration status
      await loadEvent()
    } else {
      showMessage('error', response.message || 'Failed to register for event')
    }
  } catch (error) {
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

const handleEventUpdated = (updatedEvent: any) => {
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
      ...((updatedEvent as any).event_texts && { event_texts: (updatedEvent as any).event_texts }),
      collaborators_details:
        updatedEvent.collaborators_details || event.value.collaborators_details || [],
      registrations_details:
        updatedEvent.registrations_details || event.value.registrations_details || [],
      organizer_details: updatedEvent.organizer_details || event.value.organizer_details,
      category_details: updatedEvent.category_details || event.value.category_details,
    }

    event.value = mergedEvent
  } else if (updatedEvent && 'id' in updatedEvent && updatedEvent.id) {
    // Only assign directly if it's a complete Event (has required id property)
    event.value = updatedEvent as Event
  }
}

const handleTemplateUpdated = (template: any) => {
  if (event.value) {
    // Update the event with the new template information
    event.value.event_template = template.id
    event.value.event_template_details = template // Set template details for immediate use
    event.value.event_template_enabled = false // Keep for backward compatibility
    showMessage('success', 'Template selected successfully!')
  }
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
  const menuContainer = document.querySelector('[class*="fixed"][class*="bottom-"][class*="right-"]')

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
    day: 'numeric',
  })
}

const formatEventTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
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
      ? event.value.virtual_link || 'Virtual Event'
      : event.value.location || '',
    trp: 'false',
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
      ? event.value.virtual_link || 'Virtual Event'
      : event.value.location || '',
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
LOCATION:${
    event.value.is_virtual
      ? event.value.virtual_link || 'Virtual Event'
      : event.value.location || ''
  }
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
