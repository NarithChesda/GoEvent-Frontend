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

      <!-- Mobile Bottom Tab Bar (below hero) -->
      <EventDetailMobileTabBar
        v-if="event"
        :active-tab="activeTab"
        :tabs="navigationTabs"
        :can-view-attendees="canViewAttendees"
        :can-view-media="canViewMedia"
        :can-view-collaborators="canViewCollaborators"
        :can-view-event-texts="canViewEventTexts"
        :can-view-template="canViewTemplate"
        :can-view-payment="canViewPayment"
        :can-view-guest-management="canViewGuestManagement"
        :can-view-expenses="canViewExpenses"
        :can-view-review="canViewReview"
        @tab-change="activeTab = $event"
      />

      <!-- Main Content Section -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div class="flex flex-col md:flex-row gap-6 lg:gap-8">
          <!-- Navigation Tabs (Desktop Only) -->
          <EventNavigationTabs
            class="hidden md:block"
            :active-tab="activeTab"
            :tabs="navigationTabs"
            :can-view-attendees="canViewAttendees"
            :can-view-media="canViewMedia"
            :can-view-collaborators="canViewCollaborators"
            :can-view-event-texts="canViewEventTexts"
            :can-view-template="canViewTemplate"
            :can-view-payment="canViewPayment"
            :can-view-guest-management="canViewGuestManagement"
            :can-view-expenses="canViewExpenses"
            :can-view-review="canViewReview"
            :can-edit="event.can_edit"
            @tab-change="activeTab = $event"
          />

          <!-- Main Content Area -->
          <div class="flex-1 min-w-0 pb-20 md:pb-0">
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
                ref="agendaTabRef"
                :event-id="event.id"
                :can-edit="event.can_edit || false"
              />
            </div>

            <!-- Hosts Tab -->
            <div v-if="activeTab === 'hosts'">
              <EventHostsTab
                v-if="event?.id"
                ref="hostsTabRef"
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
              <EventTextTab v-else ref="textTabRef" :event-id="event.id" />
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
                ref="attendeesTabRef"
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
                ref="mediaTabRef"
                :event-id="event.id"
                :can-edit="event.can_edit || false"
                :initial-media="event.photos || []"
                :event-data="event"
                @media-updated="handleMediaUpdated"
                @event-updated="handleEventUpdated"
                @sub-tab-change="activeSubTab = $event"
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
                ref="collaboratorTabRef"
                :event-id="event.id"
                :event-title="event.title"
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
                ref="paymentTabRef"
                :event-id="event.id"
                :event="event as any"
                :can-edit="event.can_edit || false"
                @tab-change="activeTab = $event"
                @event-updated="handleEventUpdated"
              />
            </div>

            <!-- Guest Management Tab -->
            <div v-if="activeTab === 'guest-management'">
              <div v-if="!canViewGuestManagement" class="text-center py-12">
                <div
                  class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Lock class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Access Restricted</h3>
                <p class="text-slate-600 max-w-md mx-auto">
                  Only the event organizer and collaborators can view and manage guests.
                </p>
              </div>
              <EventGuestManagementTab
                v-else-if="event?.id"
                ref="guestManagementTabRef"
                :event-id="event.id"
                :event="event"
                :can-edit="event.can_edit || false"
                @tab-change="activeTab = $event"
              />
            </div>

            <!-- Expenses Tab -->
            <div v-if="activeTab === 'expenses'">
              <div v-if="!canViewExpenses" class="text-center py-12">
                <div
                  class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Lock class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Access Restricted</h3>
                <p class="text-slate-600 max-w-md mx-auto">
                  Only the event organizer and collaborators can view and manage expenses.
                </p>
              </div>
              <EventExpenseTab
                v-else-if="event?.id"
                ref="expenseTabRef"
                :event-id="event.id"
                :can-edit="event.can_edit || false"
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
                ref="templateTabRef"
                :event="event"
                :can-edit="event.can_edit || false"
                @template-updated="handleTemplateUpdated"
                @tab-change="handleTabChange"
              />
            </div>

            <!-- Review Tab -->
            <div v-if="activeTab === 'review'">
              <div v-if="!canViewReview" class="text-center py-12">
                <div
                  class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Lock class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Access Restricted</h3>
                <p class="text-slate-600 max-w-md mx-auto">
                  Only the event organizer can review their hosting experience on GoEvent.
                </p>
              </div>
              <EventReviewTab
                v-else-if="event?.id"
                :event-id="event.id"
                :can-edit="event.can_edit || false"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Footer - Hidden on mobile -->
      <div class="hidden md:block">
        <Footer />
      </div>

      <!-- Smart Floating Action Button -->
      <SmartFloatingActionButton
        v-if="event"
        ref="smartFabRef"
        :active-tab="activeTab"
        :active-sub-tab="activeSubTab"
        :guest-management-sub-tab="guestManagementSubTab"
        :expense-tracking-sub-tab="expenseTrackingSubTab"
        :can-edit="event.can_edit || false"
        :can-delete="canDeleteEvent"
        :event-title="event.title || ''"
        :event-id="event.id || ''"
        @add-agenda="handleAddAgenda"
        @add-host="handleAddHost"
        @add-photo="handleAddPhoto"
        @add-event-text="handleAddEventText"
        @open-checkin="handleOpenCheckin"
        @open-payment="handleOpenPayment"
        @invite-collaborator="handleInviteCollaborator"
        @browse-template="handleBrowseTemplate"
        @add-guest="handleAddGuest"
        @add-group="handleAddGroup"
        @quick-add="handleQuickAdd"
        @add-dress-code="handleAddDressCode"
        @edit="handleEditEvent"
        @delete="handleDeleteEvent"
      />

      <!-- Contact Us FAB (Telegram) -->
      <ContactUsFAB v-if="event" :smart-fab-visible="smartFabVisible" :can-edit="event.can_edit" />
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
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Lock,
  Pencil,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Calendar,
  FileText,
  Users,
  UserPlus,
  ImageIcon,
  Monitor,
  CreditCard,
  Mail,
  Share2,
  DollarSign,
} from 'lucide-vue-next'
import MainLayout from '../components/MainLayout.vue'
import Footer from '../components/Footer.vue'
import EventHeroSection from '../components/EventHeroSection.vue'
import EventAboutSection from '../components/EventAboutSection.vue'
import EventNavigationTabs from '../components/EventNavigationTabs.vue'
import EventDetailMobileTabBar from '../components/EventDetailMobileTabBar.vue'
import EventAgendaTab from '../components/EventAgendaTab.vue'
import EventHostsTab from '../components/EventHostsTab.vue'
import EventTextTab from '../components/EventTextTab.vue'
import EventMediaTab from '../components/EventMediaTab.vue'
import EventCollaboratorsTab from '../components/EventCollaboratorsTab.vue'
import EventAttendeesTab from '../components/EventAttendeesTab.vue'
import EventTemplateTab from '../components/EventTemplateTab.vue'
import EventPaymentTab from '../components/EventPaymentTab.vue'
import EventGuestManagementTab from '../components/EventGuestManagementTab.vue'
import EventExpenseTab from '../components/EventExpenseTab.vue'
import EventReviewTab from '../components/EventReviewTab.vue'
import { useAuthStore } from '../stores/auth'
import { eventsService, type Event, type EventPhoto } from '../services/api'
import SmartFloatingActionButton from '../components/SmartFloatingActionButton.vue'
import ContactUsFAB from '../components/ContactUsFAB.vue'
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
const activeSubTab = ref<string>('')
const guestManagementSubTab = ref<string>('guests')
const expenseTrackingSubTab = ref<string>('summary')

// Interval IDs for polling
const guestManagementPollInterval = ref<number | null>(null)
const expenseTrackingPollInterval = ref<number | null>(null)

// Template refs for tab components (for Smart FAB)
const agendaTabRef = ref<InstanceType<typeof EventAgendaTab> | null>(null)
const hostsTabRef = ref<InstanceType<typeof EventHostsTab> | null>(null)
const mediaTabRef = ref<InstanceType<typeof EventMediaTab> | null>(null)
const textTabRef = ref<InstanceType<typeof EventTextTab> | null>(null)
const attendeesTabRef = ref<InstanceType<typeof EventAttendeesTab> | null>(null)
const paymentTabRef = ref<InstanceType<typeof EventPaymentTab> | null>(null)
const collaboratorTabRef = ref<InstanceType<typeof EventCollaboratorsTab> | null>(null)
const templateTabRef = ref<InstanceType<typeof EventTemplateTab> | null>(null)
const guestManagementTabRef = ref<InstanceType<typeof EventGuestManagementTab> | null>(null)
const expenseTabRef = ref<InstanceType<typeof EventExpenseTab> | null>(null)
const smartFabRef = ref<InstanceType<typeof SmartFloatingActionButton> | null>(null)

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
  { id: 'guest-management', label: 'Guest Management', icon: 'users', mobileLabel: 'Guests' },
  { id: 'expenses', label: 'Expense Tracking', icon: 'dollar-sign', mobileLabel: 'Expenses' },
  { id: 'review', label: 'Event Review', icon: 'star', mobileLabel: 'Review' },
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

const canViewGuestManagement = computed(() => {
  return canViewRestrictedTabs.value
})

const canViewExpenses = computed(() => {
  return canViewRestrictedTabs.value
})

const canViewReview = computed(() => {
  return canViewRestrictedTabs.value
})

const canDeleteEvent = computed(() => {
  if (!event.value || !authStore.isAuthenticated) return false
  // Only the organizer (event creator) can delete the event
  return event.value.organizer === authStore.user?.id
})

// Determine if smart FAB is visible (for positioning Contact Us FAB)
const smartFabVisible = computed(() => {
  if (!event.value || !(event.value.can_edit || false)) return false

  // Hide on media tab's video & map (embeds) and social media sub-tabs
  if (activeTab.value === 'media') {
    if (activeSubTab.value === 'embeds' || activeSubTab.value === 'social-media') {
      return false
    }
  }

  // Check if we're on a valid tab that shows the smart FAB (including expenses summary)
  const validTabs = ['about', 'agenda', 'hosts', 'media', 'event-texts', 'attendees', 'payment', 'collaborator', 'template', 'guest-management', 'expenses']
  return validTabs.includes(activeTab.value)
})

// Mobile context header computed properties
const currentTabLabel = computed(() => {
  const tab = navigationTabs.value.find((t) => t.id === activeTab.value)
  return tab ? tab.mobileLabel || tab.label : 'Event Details'
})

const currentTabIcon = computed(() => {
  const tab = navigationTabs.value.find((t) => t.id === activeTab.value)
  if (!tab) return FileText

  const iconMap = {
    calendar: Calendar,
    'file-text': FileText,
    users: Users,
    'user-plus': UserPlus,
    image: ImageIcon,
    monitor: Monitor,
    'credit-card': CreditCard,
    'dollar-sign': DollarSign,
    mail: Mail,
    'share-2': Share2,
  } as const
  return iconMap[tab.icon as keyof typeof iconMap] || FileText
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

const handleEditEvent = (eventId: string) => {
  router.push(`/events/${eventId}/edit`)
}

const handleDeleteEvent = async (eventId: string) => {
  try {
    const response = await eventsService.deleteEvent(eventId)

    if (response.success) {
      showMessage('success', 'Event deleted successfully')
      // Close the smart FAB action menu and reset its state
      smartFabRef.value?.resetDeleting()
      smartFabRef.value?.closeActionMenu()
      // Navigate back to events list after a short delay
      setTimeout(() => {
        router.push('/events')
      }, 1500)
    } else {
      showMessage('error', response.message || 'Failed to delete event')
      smartFabRef.value?.resetDeleting()
    }
  } catch (error) {
    showMessage('error', 'An error occurred while deleting the event')
    smartFabRef.value?.resetDeleting()
  }
}

// Smart FAB handlers
const handleAddAgenda = () => {
  agendaTabRef.value?.openAddModal()
}

const handleAddHost = () => {
  hostsTabRef.value?.openAddModal()
}

const handleAddPhoto = () => {
  mediaTabRef.value?.openAddModal()
}

const handleAddEventText = () => {
  textTabRef.value?.openAddModal()
}

const handleOpenCheckin = () => {
  // Open check-in modal in EventAttendeesTab
  attendeesTabRef.value?.openCheckinModal()
}

const handleOpenPayment = () => {
  // Determine which payment modal to open based on context
  if (activeTab.value === 'media' && activeSubTab.value === 'payment') {
    // In Media tab > Payment sub-tab: Open payment method modal (for adding bank transfer, QR, etc.)
    mediaTabRef.value?.openPaymentMethodModal()
  } else if (activeTab.value === 'payment') {
    // In Payment main tab: Open payment modal (for making payment)
    paymentTabRef.value?.openPaymentModal()
  }
}

const handleAddDressCode = () => {
  // Open dress code modal in EventMediaTab
  mediaTabRef.value?.openDressCodeModal()
}

const handleTabChange = (tab: string, options?: { openPaymentModal?: boolean }) => {
  activeTab.value = tab

  // If switching to payment tab and openPaymentModal flag is set, open the payment modal
  if (tab === 'payment' && options?.openPaymentModal) {
    // Use nextTick to ensure the payment tab component is mounted before calling the method
    nextTick(() => {
      paymentTabRef.value?.openPaymentModal()
    })
  }
}

const handleInviteCollaborator = () => {
  // Open invite collaborator modal in EventCollaboratorsTab
  collaboratorTabRef.value?.openInviteModal()
}

const handleBrowseTemplate = () => {
  // Open template selector in EventTemplateTab
  templateTabRef.value?.openBrowseTemplates()
}

const handleAddGuest = () => {
  // Open add guest modal in EventGuestManagementTab
  guestManagementTabRef.value?.openAddGuestModal()
}

const handleAddGroup = () => {
  // Open add group modal in EventGuestManagementTab
  guestManagementTabRef.value?.openAddGroupModal()
}

const handleQuickAdd = () => {
  // Open Quick Add modal in EventExpenseTab (context-aware based on active sub-tab)
  expenseTabRef.value?.openQuickAdd()
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

  // Sanitize text for Google Calendar (mobile-friendly)
  const sanitizeText = (text: string, maxLength = 1000): string => {
    if (!text) return ''

    // Remove HTML tags
    let cleaned = text.replace(/<[^>]*>/g, '')

    // Replace problematic characters
    cleaned = cleaned
      .replace(/[\r\n]+/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '') // Remove non-printable chars
      .trim()

    // Truncate if too long (prevents URL length issues on mobile)
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength) + '...'
    }

    return cleaned
  }

  const title = sanitizeText(event.value.title, 200)
  const description = sanitizeText(
    event.value.description || event.value.short_description || '',
    500 // Shorter limit for description to prevent mobile URL issues
  )

  // Sanitize location
  let location = ''
  if (event.value.is_virtual) {
    location = event.value.virtual_link || 'Virtual Event'
  } else {
    location = sanitizeText(event.value.location || '', 200)
  }

  // Build URL manually to ensure proper encoding for mobile
  const baseUrl = 'https://calendar.google.com/calendar/render'
  const params = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(title)}`,
    `dates=${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
    `details=${encodeURIComponent(description)}`,
    `location=${encodeURIComponent(location)}`,
    'trp=false'
  ].join('&')

  window.open(`${baseUrl}?${params}`, '_blank')
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

// Watch for tab changes and reset sub-tab
watch(
  () => activeTab.value,
  () => {
    // Reset sub-tab when main tab changes
    activeSubTab.value = ''
    // Update guest management subtab when switching to guest-management tab
    if (activeTab.value === 'guest-management') {
      // Use nextTick to ensure component is mounted
      nextTick(() => {
        const currentSubTab = guestManagementTabRef.value?.getActiveSubTab()
        if (currentSubTab) {
          guestManagementSubTab.value = currentSubTab
        }
      })
    }
    // Update expense tracking subtab when switching to expenses tab
    if (activeTab.value === 'expenses') {
      // Use nextTick to ensure component is mounted
      nextTick(() => {
        const currentSubTab = expenseTabRef.value?.getActiveSubTab()
        if (currentSubTab) {
          expenseTrackingSubTab.value = currentSubTab
        }
      })
    }
  }
)

// Watch for updates to guest management subtab
watch(
  () => guestManagementTabRef.value,
  () => {
    // Clear existing interval if any
    if (guestManagementPollInterval.value !== null) {
      clearInterval(guestManagementPollInterval.value)
      guestManagementPollInterval.value = null
    }

    if (activeTab.value === 'guest-management' && guestManagementTabRef.value) {
      // Poll for subtab changes at a reasonable interval (1 second instead of 100ms)
      guestManagementPollInterval.value = setInterval(() => {
        if (!guestManagementTabRef.value || activeTab.value !== 'guest-management') {
          if (guestManagementPollInterval.value !== null) {
            clearInterval(guestManagementPollInterval.value)
            guestManagementPollInterval.value = null
          }
          return
        }
        const currentSubTab = guestManagementTabRef.value.getActiveSubTab()
        if (currentSubTab && currentSubTab !== guestManagementSubTab.value) {
          guestManagementSubTab.value = currentSubTab
        }
      }, 1000) as unknown as number
    }
  },
  { immediate: true }
)

// Watch for updates to expense tracking subtab
watch(
  () => expenseTabRef.value,
  () => {
    // Clear existing interval if any
    if (expenseTrackingPollInterval.value !== null) {
      clearInterval(expenseTrackingPollInterval.value)
      expenseTrackingPollInterval.value = null
    }

    if (activeTab.value === 'expenses' && expenseTabRef.value) {
      // Poll for subtab changes at a reasonable interval (1 second instead of 100ms)
      expenseTrackingPollInterval.value = setInterval(() => {
        if (!expenseTabRef.value || activeTab.value !== 'expenses') {
          if (expenseTrackingPollInterval.value !== null) {
            clearInterval(expenseTrackingPollInterval.value)
            expenseTrackingPollInterval.value = null
          }
          return
        }
        const currentSubTab = expenseTabRef.value.getActiveSubTab()
        if (currentSubTab && currentSubTab !== expenseTrackingSubTab.value) {
          expenseTrackingSubTab.value = currentSubTab
        }
      }, 1000) as unknown as number
    }
  },
  { immediate: true }
)

// Lifecycle
onMounted(() => {
  loadEvent()
})

// Clean up intervals on unmount
onUnmounted(() => {
  if (guestManagementPollInterval.value !== null) {
    clearInterval(guestManagementPollInterval.value)
  }
  if (expenseTrackingPollInterval.value !== null) {
    clearInterval(expenseTrackingPollInterval.value)
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
