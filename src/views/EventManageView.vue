<template>
  <MainLayout :hide-top-nav="true" :hide-mobile-tab-bar="false">
    <div class="min-h-screen">

    <!-- Top Navigation Bar -->
    <EventManageTopBar
      v-if="event"
      :event-id="event.id"
      :event-title="event.title"
      :event-status="computedEventStatus"
      :event-privacy="event.privacy"
      :can-edit="event.can_edit"
      :organizer-name="event.organizer_details?.first_name && event.organizer_details?.last_name ? `${event.organizer_details.first_name} ${event.organizer_details.last_name}`.trim() : event.organizer_details?.username"
      :organizer-avatar="getOrganizerAvatarUrl(event.organizer_details?.profile_picture)"
      @edit="handleEditEvent(event.id)"
      @publish="handlePublishEvent"
    />

    <!-- Desktop Sidebar Navigation -->
    <EventNavigationTabs
      :active-tab="activeTab"
      :tabs="navigationTabs"
      :can-view-registration="canViewRegistration"
      :can-view-media="canViewMedia"
      :can-view-collaborators="canViewCollaborators"
      :can-view-template="canViewTemplate"
      :can-view-payment="canViewPayment"
      :can-view-guest-management="canViewGuestManagement"
      :can-view-analytics="canViewAnalytics"
      :can-view-expenses="canViewExpenses"
      :can-view-review="canViewReview"
      :can-edit="event?.can_edit"
      @tab-change="activeTab = $event"
    />

    <!-- Loading Top Bar Skeleton (only show when loading and no event data) -->
    <div v-if="loading && !event" class="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
      <div class="flex items-center justify-between h-full px-4 sm:px-6">
        <div class="flex items-center gap-3 animate-pulse">
          <div class="w-10 h-10 lg:w-12 lg:h-12 bg-slate-200 rounded-xl"></div>
          <div class="w-10 h-10 bg-slate-200 rounded-full hidden md:block"></div>
          <div>
            <div class="h-5 w-40 bg-slate-200 rounded mb-1"></div>
            <div class="h-3 w-24 bg-slate-200 rounded hidden md:block"></div>
          </div>
        </div>
        <div class="flex gap-2 animate-pulse">
          <div class="h-9 w-20 bg-slate-200 rounded-xl hidden md:block"></div>
          <div class="h-9 w-16 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-xl"></div>
        </div>
      </div>
    </div>
    <div v-if="loading && !event" class="h-16"></div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="pb-16 transition-all duration-300 ease-in-out"
      :style="{ marginLeft: contentMarginLeft }"
    >
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="animate-pulse">
          <div class="h-64 bg-slate-200 rounded-3xl mb-8"></div>
          <div class="h-8 bg-slate-200 rounded mb-4"></div>
          <div class="h-4 bg-slate-200 rounded mb-2"></div>
          <div class="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
      </div>
    </div>

    <!-- Mobile Tab Bar (fixed position for stable scrolling) -->
    <EventManageMobileTabBar
      v-if="event"
      :active-tab="activeTab"
      :tabs="navigationTabs"
      :can-view-registration="canViewRegistration"
      :can-view-media="canViewMedia"
      :can-view-collaborators="canViewCollaborators"
      :can-view-template="canViewTemplate"
      :can-view-payment="canViewPayment"
      :can-view-guest-management="canViewGuestManagement"
      :can-view-analytics="canViewAnalytics"
      :can-view-expenses="canViewExpenses"
      :can-view-review="canViewReview"
      @tab-change="activeTab = $event"
    />
    <!-- Spacer for fixed mobile tab bar (h-[52px] = py-2 + button height) -->
    <div v-if="event" class="md:hidden h-[52px]"></div>

    <!-- Event Detail -->
    <div
      v-if="event"
      class="transition-all duration-300 ease-in-out"
      :style="{ marginLeft: contentMarginLeft }"
    >
      <!-- Main Content Section -->
      <div class="max-w-3xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div class="flex flex-col">
          <!-- Main Content Area -->
          <div class="flex-1 min-w-0 pb-20 lg:pb-0">
            <!-- Overview Tab -->
            <EventAboutSection
              v-if="activeTab === 'overview'"
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

            <!-- Registration Tab -->
            <div v-if="activeTab === 'registration'">
              <div v-if="!canViewRegistration" class="text-center py-12">
                <div
                  class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Lock class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Access Restricted</h3>
                <p class="text-slate-600 max-w-md mx-auto">
                  Only the event organizer and collaborators can view registrations.
                </p>
              </div>
              <EventRegistrationTab
                v-else
                ref="registrationTabRef"
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
                @tab-change="handleGuestTabChange"
              />
            </div>

            <!-- Analytics Tab -->
            <div v-if="activeTab === 'analytics'">
              <div v-if="!canViewAnalytics" class="text-center py-12">
                <div
                  class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Lock class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Access Restricted</h3>
                <p class="text-slate-600 max-w-md mx-auto">
                  Only the event organizer and collaborators can view analytics.
                </p>
              </div>
              <EventAnalyticsTab
                v-else-if="event?.id"
                ref="analyticsTabRef"
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

            <!-- Template & Payment Tab (Combined) -->
            <div v-if="activeTab === 'template-payment'">
              <div v-if="!canViewTemplate" class="text-center py-12">
                <div
                  class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Lock class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Access Restricted</h3>
                <p class="text-slate-600 max-w-md mx-auto">
                  Only the event organizer and collaborators can view and manage templates and payments.
                </p>
              </div>
              <EventTemplatePaymentTab
                v-else
                ref="templatePaymentTabRef"
                :event="event"
                :can-edit="event.can_edit || false"
                @template-updated="handleTemplateUpdated"
                @event-updated="handleEventUpdated"
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

      <!-- Contact Us FAB (Telegram) -->
      <ContactUsFAB v-if="event" :can-edit="event.can_edit" />

      <!-- Edit Event Drawer -->
      <EventEditDrawer
        v-model="showEditDrawer"
        :event-id="event?.id || null"
        @updated="handleEventUpdatedFromDrawer"
        @deleted="handleEventDeletedFromDrawer"
      />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="pt-24 pb-16 transition-all duration-300 ease-in-out"
      :style="{ marginLeft: contentMarginLeft }"
    >
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick, inject, defineAsyncComponent, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSidebar } from '../composables/useSidebar'
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
  Wallet,
  BarChart,
} from 'lucide-vue-next'
import MainLayout from '../components/MainLayout.vue'
import EventAboutSection from '../components/EventAboutSection.vue'
import EventManageTopBar from '../components/EventManageTopBar.vue'
import EventNavigationTabs from '../components/EventNavigationTabs.vue'
import EventManageMobileTabBar from '../components/EventManageMobileTabBar.vue'
import { useAuthStore } from '../stores/auth'
import { eventsService, type Event, type EventPhoto } from '../services/api'
import ContactUsFAB from '../components/ContactUsFAB.vue'
import EventEditDrawer from '../components/EventEditDrawer.vue'
import type { TabConfig } from '../components/EventNavigationTabs.vue'

// Lazy load heavy tab components for better code splitting
const EventAgendaTab = defineAsyncComponent(() => import('../components/EventAgendaTab.vue'))
const EventHostsTab = defineAsyncComponent(() => import('../components/EventHostsTab.vue'))
const EventMediaTab = defineAsyncComponent(() => import('../components/EventMediaTab.vue'))
const EventCollaboratorsTab = defineAsyncComponent(() => import('../components/EventCollaboratorsTab.vue'))
const EventRegistrationTab = defineAsyncComponent(() => import('../components/EventRegistrationTab.vue'))
const EventTemplatePaymentTab = defineAsyncComponent(() => import('../components/EventTemplatePaymentTab.vue'))
const EventGuestManagementTab = defineAsyncComponent(() => import('../components/EventGuestManagementTab.vue'))
const EventAnalyticsTab = defineAsyncComponent(() => import('../components/EventAnalyticsTab.vue'))
const EventExpenseTab = defineAsyncComponent(() => import('../components/EventExpenseTab.vue'))
const EventReviewTab = defineAsyncComponent(() => import('../components/EventReviewTab.vue'))

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { isCollapsed } = useSidebar()

// Inject home sidebar state from MainLayout (with default value to prevent warnings)
const showHomeSidebarOverlay = inject<Ref<boolean>>('showHomeSidebarOverlay', ref(false))

// Reactive window width for responsive margin calculation
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
const isDesktop = computed(() => windowWidth.value >= 1024)

// Update window width on resize
const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

// Calculate content margin based on sidebar states (only on desktop lg+)
const contentMarginLeft = computed(() => {
  // Only apply margin on lg screens and above
  if (!isDesktop.value) {
    return '0px'
  }

  // Event detail sidebar width = 88px (w-[88px])
  const eventSidebarWidth = 88

  // If home sidebar is visible, add its width too
  if (showHomeSidebarOverlay?.value) {
    // Home sidebar width: collapsed = 96px (w-24), expanded = 256px (w-64)
    const homeSidebarWidth = isCollapsed.value ? 96 : 256
    return `${eventSidebarWidth + homeSidebarWidth}px`
  }

  return `${eventSidebarWidth}px`
})

// State
const event = ref<Event | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)
// Initialize activeTab from URL query parameter or default to 'overview'
const activeTab = ref((route.query.tab as string) || 'overview')
const activeSubTab = ref<string>('')
const guestManagementSubTab = ref<string>('guests')
const expenseTrackingSubTab = ref<string>('summary')
const showEditDrawer = ref(false)

// Interval IDs for polling
const guestManagementPollInterval = ref<number | null>(null)
const expenseTrackingPollInterval = ref<number | null>(null)

// Template refs for tab components
const agendaTabRef = ref<InstanceType<typeof EventAgendaTab> | null>(null)
const hostsTabRef = ref<InstanceType<typeof EventHostsTab> | null>(null)
const mediaTabRef = ref<InstanceType<typeof EventMediaTab> | null>(null)
const registrationTabRef = ref<InstanceType<typeof EventRegistrationTab> | null>(null)
const collaboratorTabRef = ref<InstanceType<typeof EventCollaboratorsTab> | null>(null)
const templatePaymentTabRef = ref<InstanceType<typeof EventTemplatePaymentTab> | null>(null)
const guestManagementTabRef = ref<InstanceType<typeof EventGuestManagementTab> | null>(null)
const expenseTabRef = ref<InstanceType<typeof EventExpenseTab> | null>(null)

// Navigation tabs configuration - optimized for user flow
const navigationTabs = ref<TabConfig[]>([
  { id: 'overview', label: 'Overview', icon: 'file-text' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar' },
  { id: 'hosts', label: 'Hosts & Speakers', icon: 'users', mobileLabel: 'Hosts' },
  { id: 'media', label: 'Showcase', icon: 'image' },
  { id: 'template-payment', label: 'Template & Payment', icon: 'credit-card', mobileLabel: 'Template' },
  { id: 'guest-management', label: 'Guest Management', icon: 'users', mobileLabel: 'Guests' },
  { id: 'expenses', label: 'Expense Tracking', icon: 'wallet', mobileLabel: 'Expenses' },
  { id: 'registration', label: 'Registration', icon: 'user-plus' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart', mobileLabel: 'Analytics' },
  { id: 'collaborator', label: 'Collaborators', icon: 'users', mobileLabel: 'Team' },
  { id: 'review', label: 'Event Review', icon: 'star', mobileLabel: 'Review' },
])

// Computed properties
const canViewRegistration = computed(() => {
  if (!event.value || !authStore.isAuthenticated) return false
  // Only organizer or collaborators can view registration (no public access)
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

const canViewTemplate = computed(() => {
  return canViewRestrictedTabs.value
})

const canViewPayment = computed(() => {
  return canViewRestrictedTabs.value
})

const canViewGuestManagement = computed(() => {
  return canViewRestrictedTabs.value
})

const canViewAnalytics = computed(() => {
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

// Top bar computed properties
const computedEventStatus = computed((): 'upcoming' | 'ongoing' | 'past' | 'draft' | null => {
  if (!event.value) return null

  // Check if event is draft (no start date or not published)
  if (!event.value.start_date) return 'draft'

  const now = new Date()
  const startDate = new Date(event.value.start_date)
  const endDate = event.value.end_date ? new Date(event.value.end_date) : null

  if (now < startDate) return 'upcoming'
  if (endDate && now > endDate) return 'past'
  if (now >= startDate && (!endDate || now <= endDate)) return 'ongoing'

  return null
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
    'bar-chart': BarChart,
    wallet: Wallet,
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

      // If user cannot edit this event, redirect to public view
      if (!event.value.can_edit) {
        router.replace(`/events/${eventId}`)
        return
      }
    } else {
      error.value = response.message || 'Event not found'
    }
  } catch (err) {
    error.value = 'Failed to load event details'
  } finally {
    loading.value = false
  }
}

const handleEditEvent = (_eventId: string) => {
  showEditDrawer.value = true
}

const handlePublishEvent = async () => {
  if (!event.value) return

  try {
    const eventTitle = event.value.title
    const eventId = event.value.id
    const userEmail = authStore.user?.email || 'Unknown'
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
    const adminUrl = `${backendUrl}/admin/events/event/${eventId}/change/`

    // Invite admin as collaborator with publish review request message
    const publishMessage = `${eventTitle} requests review for publish`
    const response = await eventsService.inviteCollaborator(eventId, {
      email: 'admin@goevent.com',
      role: 'admin',
      message: publishMessage,
    })

    if (response.success) {
      // Send Telegram notification to admin
      const telegramBotToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
      const telegramChatId = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID

      if (telegramBotToken && telegramChatId) {
        try {
          const telegramMessage = `📢 Event Publish Request\n\n📌 Event: ${eventTitle}\n🆔 Event ID: ${eventId}\n👤 Requested by: ${userEmail}\n🔗 Admin: ${adminUrl}\n\n📝 Message: ${publishMessage}`

          const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`
          await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: telegramMessage,
              parse_mode: 'HTML',
            }),
          })
        } catch (telegramError) {
          console.error('Failed to send Telegram notification:', telegramError)
          // Don't show error to user - the invite was successful
        }
      }

      showMessage('success', 'Event submitted for review! Admin will be notified.')
    } else {
      // Check if admin is already a collaborator
      if (response.message?.toLowerCase().includes('already') || response.message?.toLowerCase().includes('exists')) {
        showMessage('success', 'Event review request sent to admin!')

        // Still send Telegram notification even if already a collaborator
        const telegramBotToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
        const telegramChatId = import.meta.env.VITE_TELEGRAM_ADMIN_CHAT_ID

        if (telegramBotToken && telegramChatId) {
          try {
            const telegramMessage = `📢 Event Publish Request (Follow-up)\n\n📌 Event: ${eventTitle}\n🆔 Event ID: ${eventId}\n👤 Requested by: ${userEmail}\n🔗 Admin: ${adminUrl}\n\n📝 Please review this event for publishing.`

            const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`
            await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: telegramChatId,
                text: telegramMessage,
                parse_mode: 'HTML',
              }),
            })
          } catch (telegramError) {
            console.error('Failed to send Telegram notification:', telegramError)
          }
        }
      } else {
        showMessage('error', response.message || 'Failed to submit event for review')
      }
    }
  } catch (err) {
    console.error('Error submitting event for review:', err)
    showMessage('error', 'An error occurred while submitting event for review')
  }
}

const handleEventUpdatedFromDrawer = (updatedEvent: Event) => {
  if (event.value && updatedEvent) {
    // Merge the updated event data
    event.value = {
      ...event.value,
      ...updatedEvent,
      // Preserve nested arrays that might not be in the update
      hosts: updatedEvent.hosts || event.value.hosts || [],
      agenda_items: updatedEvent.agenda_items || event.value.agenda_items || [],
      photos: updatedEvent.photos || event.value.photos || [],
      collaborators_details: updatedEvent.collaborators_details || event.value.collaborators_details || [],
      registrations_details: updatedEvent.registrations_details || event.value.registrations_details || [],
      organizer_details: updatedEvent.organizer_details || event.value.organizer_details,
      category_details: updatedEvent.category_details || event.value.category_details,
    }
    showMessage('success', 'Event updated successfully!')
  }
}

const handleEventDeletedFromDrawer = () => {
  // Navigate back to events list after successful deletion
  router.push('/events')
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

const getOrganizerAvatarUrl = (profilePicture: string | null | undefined): string => {
  if (!profilePicture) return ''

  // If it's already a full URL, return as is
  if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
    return profilePicture
  }

  // If it's a relative URL, prepend the API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  if (profilePicture.startsWith('/')) {
    return `${API_BASE_URL}${profilePicture}`
  }

  return `${API_BASE_URL}/media/${profilePicture}`
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

const handleGuestTabChange = async (tab: string, action?: string) => {
  activeTab.value = tab

  if (action === 'open-payment') {
    // Wait for the template-payment tab to be rendered
    await nextTick()
    // Open the payment modal
    if (templatePaymentTabRef.value && typeof templatePaymentTabRef.value.openPaymentModal === 'function') {
      templatePaymentTabRef.value.openPaymentModal()
    }
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
        // Note: getActiveSubTab was removed in expense tab refactor
        // const currentSubTab = expenseTabRef.value?.getActiveSubTab()
        // if (currentSubTab) {
        //   expenseTrackingSubTab.value = currentSubTab
        // }
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
        // Note: getActiveSubTab was removed in expense tab refactor
        // const currentSubTab = expenseTabRef.value.getActiveSubTab()
        // if (currentSubTab && currentSubTab !== expenseTrackingSubTab.value) {
        //   expenseTrackingSubTab.value = currentSubTab
        // }
      }, 1000) as unknown as number
    }
  },
  { immediate: true }
)

// Watch activeTab and update URL query parameter for tab persistence
watch(activeTab, (newTab) => {
  // Update URL query parameter without triggering navigation
  router.replace({
    query: { ...route.query, tab: newTab }
  })
})

// Watch route.query.tab to sync activeTab when user uses browser back/forward
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && typeof newTab === 'string' && newTab !== activeTab.value) {
      activeTab.value = newTab
    }
  }
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
