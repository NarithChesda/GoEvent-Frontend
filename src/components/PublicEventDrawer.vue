<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 z-[998]"
        @click="closeDrawer"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[520px] lg:w-[580px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden will-change-transform"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-white border-b border-slate-100 z-10">
          <div class="flex items-center justify-between px-4 py-3">
            <!-- Left Actions -->
            <div class="flex items-center gap-2">
              <button
                @click="closeDrawer"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Close"
              >
                <ChevronDown class="w-5 h-5 text-slate-600 md:hidden" />
                <ChevronRight class="w-5 h-5 text-slate-600 hidden md:block" />
              </button>
            </div>

            <!-- Right Actions -->
            <div class="flex items-center gap-1">
              <button
                @click="navigatePrev"
                :disabled="!hasPrev"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp class="w-5 h-5 text-slate-600" />
              </button>
              <button
                @click="navigateNext"
                :disabled="!hasNext"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronDown class="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <!-- Donation Form (Inline) -->
          <div v-if="showDonationForm && event" class="p-4">
            <PublicDonationForm
              :event-id="event.id"
              :currency="event.fundraising_currency || 'USD'"
              @back="showDonationForm = false"
              @donated="handleDonationComplete"
            />
          </div>

          <!-- Loading State -->
          <div v-else-if="loading" class="p-6">
            <div class="animate-pulse space-y-4">
              <div class="h-48 bg-slate-200 rounded-xl"></div>
              <div class="h-6 bg-slate-200 rounded w-3/4"></div>
              <div class="h-4 bg-slate-200 rounded w-1/2"></div>
              <div class="space-y-2">
                <div class="h-4 bg-slate-200 rounded"></div>
                <div class="h-4 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="!showDonationForm && error" class="p-6 text-center">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle class="w-8 h-8 text-red-500" />
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">Unable to Load Event</h3>
            <p class="text-slate-600 mb-4">{{ error }}</p>
            <button
              @click="loadEventData"
              class="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Try Again
            </button>
          </div>

          <!-- Event Content -->
          <div v-else-if="!showDonationForm && event" class="pb-24">
            <!-- Banner -->
            <PublicEventBanner
              :banner-src="currentBannerSrc"
              :fallback-error="fallbackBannerError"
              :title="event.title"
              :category-name="event.category_details?.name || null"
              :is-fundraising="isFundraisingEnabled"
              :organizer-name="organizerName"
              @banner-error="handleBannerImageError"
            />

            <!-- Fundraising Card (Floating Above Content) -->
            <PublicEventFundraisingCard
              v-if="isFundraisingEnabled && fundraisingProgress"
              :total-raised="String(fundraisingProgress.total_raised || '0')"
              :goal="String(fundraisingProgress.goal || event.fundraising_goal || '0')"
              :currency="fundraisingProgress.currency || event.fundraising_currency || 'USD'"
              :progress-percentage="fundraisingProgressPercentage"
              :total-donors="fundraisingProgress.total_donors || 0"
              :days-left="fundraisingDaysLeft"
              :recent-cash-donations="recentCashDonations"
              :recent-item-donations="recentItemDonations"
              :item-category-summary="itemCategorySummary"
              @donate="showDonationForm = true"
            />

            <!-- Event Info -->
            <div class="px-4 space-y-4" :class="isFundraisingEnabled ? 'pt-0' : 'pt-5'">
              <!-- Date & Location -->
              <PublicEventInfo
                :start-date="event.start_date"
                :end-date="event.end_date"
                :location="event.location"
                :is-virtual="event.is_virtual"
                @open-map="sharing.openMap(event.location)"
              />

              <!-- Registration Section -->
              <PublicEventRegistrationCard
                :registration-required="event.registration_required"
                :is-registered="isUserRegistered"
                :status-label="registrationStatusLabel"
                :status-badge-class="registrationStatusBadgeClass"
                :time-until-event="timeUntilEvent"
                :is-ongoing="event.is_ongoing"
                :is-virtual="event.is_virtual"
                :virtual-link="event.virtual_link"
                :show-calendar-options="calendar.showCalendarOptions.value"
                :confirmation-code="userRegistration?.confirmation_code"
                :is-cancelling="registration.isCancelling.value"
                :registration-message="registration.registrationMessage.value"
                :current-user="currentUser"
                :can-register="registration.canRegister.value"
                :is-registering="registration.isRegistering.value"
                :is-event-full="isEventFull"
                :is-registration-closed="isRegistrationClosed"
                :is-past="event.is_past"
                @toggle-calendar="calendar.showCalendarOptions.value = !calendar.showCalendarOptions.value"
                @share="sharing.shareEvent()"
                @add-to-google="calendar.addToGoogleCalendar()"
                @add-to-outlook="calendar.addToOutlookCalendar()"
                @download-ics="calendar.downloadICSFile()"
                @show-qr="showQRModal = true"
                @cancel-registration="registration.handleCancelRegistration()"
                @register="handleRegister"
                @login-to-register="handleLoginToRegister"
              />

              <!-- About Event -->
              <div class="border-t border-slate-100 pt-4">
                <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  About Event
                </h3>
                <div
                  v-if="event.description"
                  class="prose prose-sm max-w-none text-slate-700"
                  v-html="sanitizedDescription"
                />
                <p v-else-if="event.short_description" class="text-sm text-slate-700 leading-relaxed">
                  {{ event.short_description }}
                </p>
                <p v-else class="text-sm text-slate-500">No description provided</p>
              </div>

              <!-- Agenda -->
              <div v-if="event.agenda_items && event.agenda_items.length > 0" class="border-t border-slate-100 pt-4">
                <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Agenda</h3>
                <PublicEventAgenda :items="event.agenda_items" :event-start-date="event.start_date" />
              </div>

              <!-- Location Map -->
              <div v-if="googleMapEmbedUrl" class="border-t border-slate-100 pt-4">
                <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Location</h3>
                <div class="rounded-xl overflow-hidden border border-slate-200">
                  <iframe
                    :src="googleMapEmbedUrl"
                    width="100%"
                    height="200"
                    style="border:0;"
                    allowfullscreen
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Hosts -->
              <div v-if="event.hosts && event.hosts.length > 0" class="border-t border-slate-100 pt-4">
                <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {{ isFundraisingEnabled ? 'Campaign Organizer' : 'Hosted By' }}
                </h3>
                <div class="bg-white border border-slate-200 rounded-xl p-4">
                  <div class="flex items-center gap-3">
                    <div
                      v-if="event.hosts[0].profile_image"
                      class="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden"
                    >
                      <img
                        :src="getProfileUrl(event.hosts[0].profile_image)"
                        :alt="event.hosts[0].name"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div v-else class="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 text-lg font-semibold">
                      {{ formatters.getInitials(event.hosts[0].name) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900 truncate">{{ event.hosts[0].name }}</p>
                      <p class="text-sm text-slate-500">{{ isFundraisingEnabled ? 'Campaign Organizer' : 'Event Organizer' }}</p>
                    </div>
                    <button
                      v-if="event.hosts[0].title"
                      class="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                    >
                      Contact
                    </button>
                  </div>
                </div>
              </div>

              <!-- Share Banner -->
              <div class="border-t border-slate-100 pt-4">
                <div class="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-5 text-white">
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex-1 min-w-0">
                      <h4 class="text-sm font-semibold mb-1">Help spread the word</h4>
                      <p class="text-sm text-slate-400">{{ isFundraisingEnabled ? 'Share this campaign' : 'Share this event' }}</p>
                    </div>
                    <button
                      @click="sharing.shareEvent()"
                      class="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
                    >
                      <Share2 class="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- QR Code Modal -->
    <PublicEventQRModal
      :show="showQRModal"
      :confirmation-code="userRegistration?.confirmation_code"
      @close="showQRModal = false"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DOMPurify from 'dompurify'
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Share2,
} from 'lucide-vue-next'
import { extractGoogleMapsEmbedUrl } from '@/utils/embedExtractor'
import PublicDonationForm from './PublicDonationForm.vue'
import PublicEventBanner from './event/PublicEventBanner.vue'
import PublicEventFundraisingCard from './event/PublicEventFundraisingCard.vue'
import PublicEventInfo from './event/PublicEventInfo.vue'
import PublicEventRegistrationCard from './event/PublicEventRegistrationCard.vue'
import PublicEventAgenda from './event/PublicEventAgenda.vue'
import PublicEventQRModal from './event/PublicEventQRModal.vue'

// Composables
import {
  usePublicEventData,
  useEventRegistration,
  useEventCalendar,
  useFundraising,
  useEventSharing,
  useEventDateFormatters,
} from '@/composables/event'

interface Props {
  modelValue: boolean
  eventId: string | null
  hasPrev?: boolean
  hasNext?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'navigate-prev'): void
  (e: 'navigate-next'): void
  (e: 'registered'): void
  (e: 'login-required'): void
}

const props = withDefaults(defineProps<Props>(), {
  hasPrev: false,
  hasNext: false,
})

const emit = defineEmits<Emits>()
const router = useRouter()

// Local state
const showDonationForm = ref(false)
const showQRModal = ref(false)

// Composables
const eventData = usePublicEventData()
const {
  event,
  loading,
  error,
  userRegistration,
  fundraisingProgress,
  itemCategorySummary,
  recentCashDonations,
  recentItemDonations,
  currentUser,
  organizerName,
  isEventFull,
  isRegistrationClosed,
  isUserRegistered,
  isFundraisingEnabled,
  registrationStatusLabel,
  registrationStatusBadgeClass,
  currentBannerSrc,
  timeUntilEvent,
  fallbackBannerError,
  loadEvent,
  refreshFundraisingProgress,
  handleBannerImageError,
  getProfileUrl,
} = eventData

const registration = useEventRegistration({
  event,
  isUserRegistered,
  isEventFull,
  isRegistrationClosed,
  userRegistration,
  registrationChecked: eventData.registrationChecked,
})

const calendar = useEventCalendar(event)
const { fundraisingProgressPercentage, fundraisingDaysLeft } = useFundraising(event, fundraisingProgress)
const sharing = useEventSharing(event)
const formatters = useEventDateFormatters()

// Computed
const sanitizedDescription = computed(() => {
  if (!event.value?.description) return ''
  return DOMPurify.sanitize(event.value.description, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
  })
})

const googleMapEmbedUrl = computed(() => {
  if (!event.value?.google_map_embed_link) return ''
  return extractGoogleMapsEmbedUrl(event.value.google_map_embed_link)
})

// Methods
const closeDrawer = () => {
  emit('update:modelValue', false)
}

const navigatePrev = () => {
  emit('navigate-prev')
}

const navigateNext = () => {
  emit('navigate-next')
}

const loadEventData = () => {
  loadEvent(props.eventId)
}

const handleRegister = async () => {
  await registration.handleRegister(async () => {
    emit('registered')
    await loadEvent(props.eventId)
  })
}

const handleLoginToRegister = () => {
  emit('login-required')
  closeDrawer()
  router.push(`/signin?redirect=${encodeURIComponent(`/events/${props.eventId}`)}`)
}

const handleDonationComplete = async () => {
  showDonationForm.value = false
  if (props.eventId) {
    await refreshFundraisingProgress(props.eventId)
  }
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watchers
watch(
  () => props.eventId,
  (newId) => {
    if (newId && props.modelValue) {
      loadEvent(newId)
    }
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.eventId) {
      loadEvent(props.eventId)
    }
    // Prevent body scroll when drawer is open
    if (isOpen) {
      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      setTimeout(() => {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }, 350)
    }
  }
)

onMounted(() => {
  if (props.modelValue && props.eventId) {
    loadEvent(props.eventId)
  }
})
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide from right on desktop, from bottom on mobile */
.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%) translateZ(0);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%) translateZ(0);
  }
}

/* Prose styling for description */
.prose :deep(p) {
  @apply mb-3 leading-relaxed;
}

.prose :deep(strong) {
  @apply font-semibold text-slate-900;
}

.prose :deep(a) {
  @apply text-blue-600 hover:text-blue-700 underline;
}

.prose :deep(ul),
.prose :deep(ol) {
  @apply ml-4 mb-3 space-y-1;
}

.prose :deep(li) {
  @apply leading-relaxed;
}
</style>
