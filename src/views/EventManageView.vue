<template>
  <MainLayout
    :hide-top-nav="true"
    :hide-mobile-tab-bar="false"
    :contact-fab-can-edit="event?.can_edit ?? false"
  >
    <div class="min-h-screen">

    <!-- Top Navigation Bar -->
    <EventManageTopBar
      v-if="event"
      :event-id="event.id"
      :event-title="event.title"
      :event-status="computedEventStatus"
      :event-privacy="event.privacy"
      :actual-event-status="event.status"
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
      :can-view-template="canViewTemplate"
      :can-view-payment="canViewPayment"
      :can-view-guest-management="canViewGuestManagement"
      :can-view-analytics="canViewAnalytics"
      :can-view-expenses="canViewExpenses"
      :can-view-donation="canViewDonation"
      :can-view-tickets="canViewTickets"
      :can-edit="event?.can_edit"
      @tab-change="activeTab = $event"
    />

    <!-- Loading Top Bar Skeleton (only show when loading and no event data) -->
    <!-- Matches EventManageTopBar's own resting surface: the page's own
         background below `lg` (see `.premium-chrome`), fully transparent from
         `lg` so the page background runs through it. Otherwise the first thing
         drawn on entry is a white slab that swaps for a seamless bar the moment
         the event arrives. -->
    <div v-if="loading && !event" class="manage-header-skeleton premium-chrome fixed top-0 left-0 right-0 z-50 h-16 border-b border-slate-200/50 shadow-sm lg:border-transparent lg:shadow-none">
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
      :can-view-template="canViewTemplate"
      :can-view-payment="canViewPayment"
      :can-view-guest-management="canViewGuestManagement"
      :can-view-analytics="canViewAnalytics"
      :can-view-expenses="canViewExpenses"
      :can-view-donation="canViewDonation"
      :can-view-tickets="canViewTickets"
      @tab-change="activeTab = $event"
    />
    <!-- Spacer for the fixed mobile/tablet tab bar. Height comes from that bar's
         own measurement (`--manage-tabbar-h`, published by
         EventManageMobileTabBar on mount/resize) — the 52px here is only the
         pre-measurement fallback, not a second source of truth. Breakpoint must
         match EventManageMobileTabBar.vue (`lg:hidden`) so tablet portrait keeps
         the right offset. -->
    <div v-if="event" class="lg:hidden" style="height: var(--manage-tabbar-h, 52px)"></div>

    <!-- Event Detail -->
    <div
      v-if="event"
      class="transition-all duration-300 ease-in-out"
      :style="{ marginLeft: contentMarginLeft }"
    >
      <!-- Main Content Section -->
      <div
        :class="[
          'mx-auto py-6 md:py-8',
          activeTab === 'design-studio' && canViewShowcasePreview
            ? 'max-w-[100rem]'
            : 'px-4 sm:px-6 lg:px-8 max-w-3xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl',
        ]"
      >
        <div class="flex flex-col">
          <!-- Main Content Area -->
          <!-- No bottom pad of its own: MainLayout already holds --nav-inset
               open below the slot, and a second copy here doubled it. -->
          <div class="flex-1 min-w-0">
            <!-- Overview Tab -->
            <EventAboutSection
              v-if="activeTab === 'overview'"
              :event="event"
              @join-virtual="joinVirtualEvent"
              @navigate="activeTab = $event"
              @edit-event="showEditDrawer = true"
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
                :event-category="event.category_details?.name || event.category_name || ''"
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

            <!-- Design Studio Tab: the full live-preview studio (merged
                 content forms + preview + template try-on) for showcase
                 categories (wedding/birthday/housewarming/funeral/ceremony);
                 for everything else (business, music, other) this is the
                 plain content tab it was before the studio existed — same
                 EventMediaTab, just not wrapped in the studio's split-pane
                 preview chrome, since there's no live preview to show. -->
            <!-- Rendered once visited and then kept in the DOM, hidden with
                 `v-show` rather than torn down (see studioEverOpened).
                 The studio's 2-3 preview iframes are each a full app boot
                 costing hundreds of kB of parse plus their own showcase fetch,
                 and `v-if` meant paying all of that again on every single
                 return to this tab. `v-show` is what makes them survive:
                 `<KeepAlive>` would not, because it deactivates by moving the
                 subtree into a detached container, and detaching an <iframe>
                 destroys its browsing context — every frame would reload on
                 reactivation, which is the very thing being avoided. -->
            <div v-if="studioEverOpened" v-show="activeTab === 'design-studio'">
              <div v-if="!canViewMedia" class="text-center py-12">
                <div
                  class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Lock class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">{{ t('management.media.accessRestricted.title') }}</h3>
                <p class="text-slate-600 max-w-md mx-auto">
                  {{ t('management.media.accessRestricted.description') }}
                </p>
              </div>
              <ShowcasePreviewTab
                v-else-if="event?.id && canViewShowcasePreview"
                ref="showcasePreviewTabRef"
                :event-id="event.id"
                :can-edit="event.can_edit || false"
                :event-data="event"
                :can-view-live-preview="!!canViewShowcasePreview"
                :show-category-specific-sections="showCategorySpecificSections"
                @event-updated="handleEventUpdated"
                @media-updated="handleMediaUpdated"
                @template-applied="handleTemplateUpdated"
                @open-activation="activeTab = 'template-payment'"
              />
              <EventMediaTab
                v-else-if="event?.id"
                :event-id="event.id"
                :can-edit="event.can_edit || false"
                :initial-media="event.photos || []"
                :event-data="event"
                :show-category-specific-sections="showCategorySpecificSections"
                @event-updated="handleEventUpdated"
                @media-updated="handleMediaUpdated"
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

            <!-- Donation Tab -->
            <div v-if="activeTab === 'donation'">
              <div v-if="!canViewDonation" class="text-center py-12">
                <div
                  class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Lock class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">Access Restricted</h3>
                <p class="text-slate-600 max-w-md mx-auto">
                  Only the event organizer and collaborators can view and manage donations.
                </p>
              </div>
              <EventDonationTab
                v-else-if="event?.id"
                :event-id="event.id"
                :event="event"
                :can-edit="event.can_edit || false"
                @enable-fundraising="handleEditEvent(event.id)"
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
                @event-updated="handleEventUpdated"
                @change-template="goToStudioTemplates"
              />
            </div>

            <!-- Tickets Tab -->
            <div v-if="activeTab === 'tickets'">
              <div v-if="!canViewTickets" class="text-center py-12">
                <div
                  class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Lock class="w-8 h-8 text-slate-400" />
                </div>
                <h3 class="text-lg font-semibold text-slate-900 mb-2">{{ t('management.tickets.accessRestricted.title') }}</h3>
                <p class="text-slate-600 max-w-md mx-auto">
                  {{ t('management.tickets.accessRestricted.description') }}
                </p>
              </div>
              <EventTicketsTab
                v-else-if="event?.id"
                :event-id="event.id"
                :can-edit="event.can_edit || false"
              />
            </div>
          </div>
        </div>
      </div>

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

    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick, inject, type Ref } from 'vue'
import { defineResilientAsyncComponent } from '@/utils/asyncComponent'
import { useRoute, useRouter } from 'vue-router'
import { useSidebar } from '../composables/useSidebar'
import { useAppLanguage } from '../composables/useAppLanguage'
import { useToast } from '../composables/useToast'
import {
  Lock,
  AlertTriangle,
} from 'lucide-vue-next'
import MainLayout from '../components/MainLayout.vue'
import EventAboutSection from '../components/EventAboutSection.vue'
import EventManageTopBar from '../components/EventManageTopBar.vue'
import EventNavigationTabs from '../components/EventNavigationTabs.vue'
import EventManageMobileTabBar from '../components/EventManageMobileTabBar.vue'
import { useAuthStore } from '../stores/auth'
import { eventsService, apiClient, type Event, type EventPhoto } from '../services/api'
import EventEditDrawer from '../components/EventEditDrawer.vue'
import type { TabConfig } from '../components/EventNavigationTabs.vue'

// Lazy load heavy tab components for better code splitting.
// Resilient rather than plain: a tab whose chunk request fails renders nothing
// at all under defineAsyncComponent — an empty page with no error and no way
// back — and these are the biggest chunks in the app, requested at the exact
// moment the Design Studio is also saturating the connection with its preview
// frames. See defineResilientAsyncComponent.
const EventAgendaTab = defineResilientAsyncComponent(() => import('../components/EventAgendaTab.vue'))
const EventHostsTab = defineResilientAsyncComponent(() => import('../components/EventHostsTab.vue'))
const ShowcasePreviewTab = defineResilientAsyncComponent(() => import('../components/showcase-preview/ShowcasePreviewTab.vue'))
// Non-showcase categories (business, music, other) get the plain content tab
// (no live-preview studio chrome) — same component ShowcasePreviewTab embeds
// in its own content panel for showcase categories, just rendered directly.
const EventMediaTab = defineResilientAsyncComponent(() => import('../components/EventMediaTab.vue'))
const EventRegistrationTab = defineResilientAsyncComponent(() => import('../components/EventRegistrationTab.vue'))
const EventTemplatePaymentTab = defineResilientAsyncComponent(() => import('../components/EventTemplatePaymentTab.vue'))
const EventGuestManagementTab = defineResilientAsyncComponent(() => import('../components/EventGuestManagementTab.vue'))
const EventAnalyticsTab = defineResilientAsyncComponent(() => import('../components/EventAnalyticsTab.vue'))
const EventExpenseTab = defineResilientAsyncComponent(() => import('../components/EventExpenseTab.vue'))
const EventDonationTab = defineResilientAsyncComponent(() => import('../components/EventDonationTab.vue'))
const EventTicketsTab = defineResilientAsyncComponent(() => import('../components/EventTicketsTab.vue'))

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { isCollapsed } = useSidebar()
const { t } = useAppLanguage()
const { showToast } = useToast()

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
// Initialize activeTab from URL query parameter or default to 'overview'
const activeTab = ref((route.query.tab as string) || 'overview')
// The tab this visit started on — the "start destination" the back button
// returns to before leaving the page (see the activeTab watcher below).
const landingTab = activeTab.value
let tabEntryPushed = false

/**
 * Latches the first time the Design Studio is opened, and never resets.
 *
 * The studio is the one tab that is expensive to *build* rather than expensive
 * to fetch — its 2-3 preview iframes are each a complete app boot — so once
 * it exists it is kept in the DOM and merely hidden (see its `v-show` in the
 * template). The latch is what keeps that from costing anything for the
 * majority of visits that never open it at all.
 */
const studioEverOpened = ref(activeTab.value === 'design-studio')
const activeSubTab = ref<string>('')
const guestManagementSubTab = ref<string>('guests')
const showEditDrawer = ref(false)

// Interval IDs for polling
const guestManagementPollInterval = ref<number | null>(null)
const expenseTrackingPollInterval = ref<number | null>(null)

// Template refs for tab components
const agendaTabRef = ref<InstanceType<typeof EventAgendaTab> | null>(null)
const hostsTabRef = ref<InstanceType<typeof EventHostsTab> | null>(null)
const registrationTabRef = ref<InstanceType<typeof EventRegistrationTab> | null>(null)
const templatePaymentTabRef = ref<InstanceType<typeof EventTemplatePaymentTab> | null>(null)
const showcasePreviewTabRef = ref<InstanceType<typeof ShowcasePreviewTab> | null>(null)
const guestManagementTabRef = ref<InstanceType<typeof EventGuestManagementTab> | null>(null)
const expenseTabRef = ref<InstanceType<typeof EventExpenseTab> | null>(null)

// Navigation tabs configuration - optimized for user flow
const navigationTabs = computed<TabConfig[]>(() => [
  { id: 'overview', label: t('management.tabs.overview'), icon: 'file-text' },
  { id: 'agenda', label: t('management.tabs.agenda'), icon: 'calendar', visible: !agendaHostsMerged.value },
  { id: 'hosts', label: t('management.tabs.hostsLabel'), icon: 'users', mobileLabel: t('management.tabs.hosts'), visible: !agendaHostsMerged.value },
  // Showcase categories get the "Design Studio" live-preview experience;
  // everything else (business, music, other) keeps the plain "Showcase"
  // content tab it had before the studio existed (see the design-studio tab
  // body below, which renders EventMediaTab directly for these).
  canViewShowcasePreview.value
    ? { id: 'design-studio', label: t('management.tabs.designStudio'), icon: 'monitor', mobileLabel: t('management.tabs.designStudioMobile') }
    : { id: 'design-studio', label: t('management.tabs.showcase'), icon: 'image' },
  { id: 'template-payment', label: t('management.tabs.templatePayment'), icon: 'credit-card', mobileLabel: t('management.tabs.templateMobile') },
  { id: 'guest-management', label: t('management.tabs.guestManagement'), icon: 'users', mobileLabel: t('management.tabs.guests') },
  { id: 'expenses', label: t('management.tabs.expenseTracking'), icon: 'wallet', mobileLabel: t('management.tabs.expensesMobile') },
  { id: 'donation', label: t('management.tabs.donations'), icon: 'heart', mobileLabel: t('management.tabs.donations') },
  { id: 'tickets', label: t('management.tabs.tickets'), icon: 'ticket', mobileLabel: t('management.tabs.ticketsMobile') },
  { id: 'registration', label: t('management.tabs.registration'), icon: 'user-plus' },
  { id: 'analytics', label: t('management.tabs.analytics'), icon: 'bar-chart', mobileLabel: t('management.tabs.analytics') },
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

// Categories that support showcase/template features. Backend category names
// may include a suffix (e.g. "Housewarming Party", "Birthday Party",
// "Funeral Service"), so we match by prefix rather than exact equality.
const SHOWCASE_CATEGORIES = ['wedding', 'birthday', 'housewarming', 'funeral', 'ceremony']

const isShowcaseCategory = (
  category: string | null | undefined,
): boolean => {
  if (!category) return false
  const normalized = category.toLowerCase()
  return SHOWCASE_CATEGORIES.some((c) => normalized.startsWith(c))
}

const canViewMedia = computed(() => {
  // Show showcase/media tab for all events that the user can edit
  return canViewRestrictedTabs.value
})

const canViewShowcasePreview = computed(() => {
  // Only meaningful for events that actually render the V1 cover/transition/
  // main-content pipeline this preview reuses.
  return (
    canViewRestrictedTabs.value &&
    isShowcaseCategory(event.value?.category_details?.name || event.value?.category_name)
  )
})

// Check if event category supports category-specific showcase features
const showCategorySpecificSections = computed(() => {
  return isShowcaseCategory(
    event.value?.category_details?.name || event.value?.category_name,
  )
})

// Agenda & Hosts live as sections inside the Showcase tab instead of
// standalone tabs — but only when the user can actually see the Showcase
// tab (editors). Read-only visitors keep the standalone tabs since the
// Showcase tab is hidden from them.
const agendaHostsMerged = computed(() => canViewMedia.value)

// Redirect deep links / active selections for merged tabs to the Design
// Studio tab
watch(
  [agendaHostsMerged, activeTab],
  ([merged, tab]) => {
    if (merged && (tab === 'agenda' || tab === 'hosts')) {
      activeTab.value = 'design-studio'
    }
  },
  { immediate: true },
)

// Team & Review no longer exist as standalone tabs — they now live as
// sections at the bottom of the Overview tab. Redirect old deep links.
watch(
  activeTab,
  (tab) => {
    if (tab === 'collaborator' || tab === 'review') {
      activeTab.value = 'overview'
    }
  },
  { immediate: true },
)

// Showcase and Live Preview no longer exist as standalone tabs — they merged
// into the Design Studio tab. Redirect old deep links/bookmarks.
watch(
  activeTab,
  (tab) => {
    if (tab === 'media' || tab === 'showcase-preview') {
      activeTab.value = 'design-studio'
    }
  },
  { immediate: true },
)

const canViewTemplate = computed(() => {
  // Only show template tab for wedding, birthday, housewarming events
  return (
    canViewRestrictedTabs.value &&
    isShowcaseCategory(event.value?.category_details?.name || event.value?.category_name)
  )
})

const canViewPayment = computed(() => {
  return canViewRestrictedTabs.value
})

const canViewGuestManagement = computed(() => {
  // Only show guest management tab for wedding, birthday, housewarming events
  return (
    canViewRestrictedTabs.value &&
    isShowcaseCategory(event.value?.category_details?.name || event.value?.category_name)
  )
})

const canViewAnalytics = computed(() => {
  return canViewRestrictedTabs.value
})

const canViewExpenses = computed(() => {
  return canViewRestrictedTabs.value
})

const canViewDonation = computed(() => {
  // Only show donation tab if event has fundraising enabled
  return canViewRestrictedTabs.value && event.value?.is_fundraising === true
})

const canViewTickets = computed(() => {
  return canViewRestrictedTabs.value && event.value?.privacy === 'public'
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
  } catch {
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

    // Invite admin as collaborator with publish review request message
    const publishMessage = `${eventTitle} requests review for publish`
    const response = await eventsService.inviteCollaborator(eventId, {
      email: 'admin@goevent.com',
      role: 'admin',
      message: publishMessage,
    })

    if (response.success) {
      try {
        await apiClient.post('/api/notifications/telegram/', {
          type: 'publish_request',
          event_id: eventId,
        })
      } catch (telegramError) {
        console.error('Failed to send Telegram notification:', telegramError)
      }

      showMessage('success', 'Event submitted for review! Admin will be notified.')
    } else {
      // Check if admin is already a collaborator
      if (response.message?.toLowerCase().includes('already') || response.message?.toLowerCase().includes('exists')) {
        showMessage('success', 'Event review request sent to admin!')

        try {
          await apiClient.post('/api/notifications/telegram/', {
            type: 'publish_request',
            event_id: eventId,
          })
        } catch (telegramError) {
          console.error('Failed to send Telegram notification:', telegramError)
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
    // No toast: the modal's confirm button already flipped to "Template
    // applied" while it closed, and the studio underneath is repainting in the
    // new template. Announcing it a third time is the noise, not the news.
  }
}

/**
 * The activation tab's "Change template" action: template browsing belongs to
 * the Design Studio (only place a candidate can be previewed live on the
 * organizer's own content), so switch tabs and open its browser in one step —
 * same handoff pattern as handleGuestTabChange's 'open-payment' below.
 */
const goToStudioTemplates = async () => {
  activeTab.value = 'design-studio'
  await nextTick()
  showcasePreviewTabRef.value?.openTemplates?.()
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
  showToast(type, text)
}



// Watch for tab changes and reset sub-tab
watch(
  () => activeTab.value,
  (tab) => {
    // Reset sub-tab when main tab changes
    activeSubTab.value = ''

    if (tab === 'design-studio') {
      if (!studioEverOpened.value) {
        studioEverOpened.value = true
      } else {
        // Coming back to a studio that has been kept in the DOM (hidden). Its
        // preview frames measure themselves against their column width, and
        // everything reads zero while `display: none`, so they have to be told
        // they are on screen again — there is no resize or intersection for
        // them to observe.
        nextTick(() => showcasePreviewTabRef.value?.remeasureFrames?.())
      }
    }
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

// Watch activeTab and update URL query parameter for tab persistence.
//
// The first switch away from the tab the user landed on pushes a history entry;
// every switch after that replaces. That's the bottom-tab-bar convention: back
// returns to the start destination, then leaves the page — it does not walk
// back through every tab visited. Capping it at one entry is what keeps that
// true, otherwise escaping the page after browsing eight tabs would take eight
// back presses.
watch(activeTab, (newTab) => {
  // Already in sync — we got here from the URL (a back press), not a tab click.
  if (route.query.tab === newTab) return

  const query = { ...route.query, tab: newTab }
  if (!tabEntryPushed && newTab !== landingTab) {
    tabEntryPushed = true
    router.push({ query })
  } else {
    router.replace({ query })
  }
})

// Watch route.query.tab to sync activeTab when user uses browser back/forward
watch(
  () => route.query.tab,
  (newTab) => {
    // Falling back to the landing tab matters when that tab came from the
    // bare URL: back to it drops the param entirely rather than setting it,
    // and the tab would otherwise stay on whatever the user last opened.
    const tab = typeof newTab === 'string' && newTab ? newTab : landingTab
    // Back at the start destination, so the next tab switch pushes again.
    if (tab === landingTab) tabEntryPushed = false
    if (tab !== activeTab.value) activeTab.value = tab
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
/* Scoped so it outranks the global `.premium-chrome` it is undoing — a Tailwind
   `lg:bg-none` would be the same specificity as that class and decided by
   stylesheet order. */
@media (min-width: 1024px) {
  .manage-header-skeleton {
    background: none;
  }
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
