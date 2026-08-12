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
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[32.5rem] lg:w-[36.25rem] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden will-change-transform"
        @click.stop
      >
        <!-- Header. Was three bare chevrons and no event name — the drawer gave
             no sign of what it had opened, and the leading `>` read as "next"
             rather than "close". -->
        <div class="flex-shrink-0 sticky top-0 bg-white border-b border-slate-100 z-10">
          <div class="flex items-center gap-2 px-3 py-2.5">
            <button
              @click="closeDrawer"
              class="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
              :title="t('events.drawer.close')"
              :aria-label="t('events.drawer.close')"
            >
              <X class="w-4 h-4 text-slate-600" />
            </button>

            <p class="flex-1 min-w-0 truncate text-sm font-semibold text-slate-900">
              {{ event?.title || '' }}
            </p>

            <div class="flex items-center gap-1 flex-shrink-0">
              <button
                @click="navigatePrev"
                :disabled="!hasPrev"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                :title="t('events.drawer.previous')"
                :aria-label="t('events.drawer.previous')"
              >
                <ChevronUp class="w-5 h-5 text-slate-600" />
              </button>
              <button
                @click="navigateNext"
                :disabled="!hasNext"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                :title="t('events.drawer.next')"
                :aria-label="t('events.drawer.next')"
              >
                <ChevronDown class="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div ref="contentRef" class="flex-1 overflow-y-auto overscroll-contain">
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
              @see-all-donors="handleSeeAllDonors"
            />

            <!-- Event Info -->
            <div class="px-4 space-y-5" :class="isFundraisingEnabled ? 'pt-0' : 'pt-5'">
              <!-- Action row. The drawer's heaviest element used to be a dark
                   "Share" block at the very bottom, and on a display-only event
                   it was the only thing to do — the hierarchy was inverted.
                   Calendar leads here, and becomes the gradient primary only
                   when nothing else on the page owns that role. -->
              <div class="space-y-2">
                <div class="flex items-stretch gap-2">
                  <button
                    @click="showQuickCalendar = !showQuickCalendar"
                    class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                    :class="
                      hasOwnPrimaryAction
                        ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        : 'bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-md hover:opacity-90'
                    "
                    :aria-expanded="showQuickCalendar"
                  >
                    <CalendarPlus class="w-4 h-4" />
                    {{ t('events.drawer.addToCalendar') }}
                  </button>

                  <button
                    v-if="event.privacy === 'public'"
                    @click="toggleLike"
                    :disabled="isLikeLoading"
                    class="w-11 flex items-center justify-center rounded-xl border transition-colors"
                    :class="
                      isLiked
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-rose-500 hover:border-rose-200'
                    "
                    :aria-label="isLiked ? t('events.drawer.unlike') : t('events.drawer.like')"
                  >
                    <Heart class="w-4 h-4" :class="{ 'fill-current': isLiked }" />
                  </button>

                  <button
                    @click="sharing.shareEvent()"
                    class="w-11 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                    :aria-label="t('events.drawer.share')"
                  >
                    <Share2 class="w-4 h-4" />
                  </button>
                </div>

                <Transition name="collapse">
                  <div v-if="showQuickCalendar" class="grid grid-rows-[1fr]">
                    <div class="min-h-0 overflow-hidden">
                      <div class="flex gap-2 pt-1">
                        <button
                          @click="calendar.addToGoogleCalendar()"
                          class="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                        >
                          Google
                        </button>
                        <button
                          @click="calendar.addToOutlookCalendar()"
                          class="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                        >
                          Outlook
                        </button>
                        <button
                          @click="calendar.downloadICSFile()"
                          class="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                        >
                          .ics
                        </button>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Date & Location -->
              <PublicEventInfo
                :start-date="event.start_date"
                :end-date="event.end_date"
                :location="event.location"
                :is-virtual="event.is_virtual"
                :accent="accent"
                :relative-label="relativeWhen?.label ?? null"
                :is-live="relativeWhen?.isLive ?? false"
                @open-map="sharing.openMap(event.location)"
              />

              <!-- Ticket sales (paid events) — takes precedence over RSVP/registration.
                   We fetch tiers in the drawer so we can use "tier exists" as the
                   discriminator (the event-detail endpoint doesn't reliably return
                   `has_ticketed_sales`); the fetched list is handed down to
                   `TicketTierList` to avoid a duplicate request. -->
              <TicketTierList
                v-if="hasTicketedSales"
                :event-id="event.id"
                :tiers="ticketTiers"
                @login-required="handleLoginToRegister"
              />

              <!-- Registration Section (free RSVP / display-only events) -->
              <PublicEventRegistrationCard
                v-else
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

              <!-- About Event. Section rules were 1px near-white hairlines that
                   read as nothing; spacing plus a short accent tick separates
                   them and carries the category colour down the panel. -->
              <div>
                <h3 class="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  <span class="w-3 h-0.5 rounded-full" :style="{ backgroundColor: accent }"></span>
                  {{ t('events.drawer.about') }}
                </h3>
                <div
                  v-if="event.description"
                  class="prose prose-sm max-w-none text-slate-700"
                  v-html="sanitizedDescription"
                />
                <p v-else-if="event.short_description" class="text-sm text-slate-700 leading-relaxed">
                  {{ event.short_description }}
                </p>
                <p v-else class="text-sm text-slate-500">{{ t('events.drawer.noDescription') }}</p>
              </div>

              <!-- Agenda -->
              <div v-if="event.agenda_items && event.agenda_items.length > 0">
                <h3 class="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  <span class="w-3 h-0.5 rounded-full" :style="{ backgroundColor: accent }"></span>
                  {{ t('events.drawer.agenda') }}
                </h3>
                <PublicEventAgenda :items="event.agenda_items" :event-start-date="event.start_date" />
              </div>

              <!-- Location Map -->
              <div v-if="googleMapEmbedUrl">
                <h3 class="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  <span class="w-3 h-0.5 rounded-full" :style="{ backgroundColor: accent }"></span>
                  {{ t('events.drawer.location') }}
                </h3>
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
              <div v-if="event.hosts && event.hosts.length > 0">
                <h3 class="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  <span class="w-3 h-0.5 rounded-full" :style="{ backgroundColor: accent }"></span>
                  {{ isFundraisingEnabled ? t('events.drawer.campaignOrganizer') : t('events.drawer.hostedBy') }}
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

              <!-- Top Donors (Fundraising only) -->
              <TopDonorsSection
                v-if="isFundraisingEnabled && topDonors.length > 0"
                :top-donors="topDonors"
                :currency="fundraisingProgress?.currency || event.fundraising_currency || 'USD'"
                :show-see-all="(fundraisingProgress?.total_donors || 0) > 10"
                @see-all="handleSeeAllDonors('cash')"
              />

              <!-- Public Expenses / Spending Transparency (Fundraising only) -->
              <PublicEventExpenseSection
                v-if="isFundraisingEnabled && publicExpenses.length > 0"
                :expenses="publicExpenses"
              />

              <!-- More like this. A display-only listing with no agenda, map,
                   hosts or registration is a dead end — banner, two info rows
                   and three sentences. On scraped listings that is most of
                   them, so the tail is where the drawer stops being a stub.
                   Loaded only for that case, so it costs nothing elsewhere. -->
              <div v-if="relatedEvents.length > 0">
                <h3 class="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  <span class="w-3 h-0.5 rounded-full" :style="{ backgroundColor: accent }"></span>
                  {{
                    event.category_details?.name
                      ? t('events.drawer.moreIn', { category: translateEventCategory(event.category_details.name) })
                      : t('events.drawer.moreEvents')
                  }}
                </h3>
                <div class="space-y-2">
                  <button
                    v-for="related in relatedEvents"
                    :key="related.id"
                    @click="openRelatedEvent(related)"
                    class="w-full flex items-center gap-3 p-2 border border-slate-200 rounded-xl text-left hover:bg-slate-50 active:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  >
                    <div class="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                      <img
                        :src="getEventThumbnail(related)"
                        :alt="related.title"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900 truncate">{{ related.title }}</p>
                      <p class="text-xs text-slate-500 truncate">
                        {{ formatRelatedDate(related.start_date) }}
                        <template v-if="related.location"> · {{ related.location }}</template>
                      </p>
                    </div>
                    <ChevronRight class="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </button>
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

    <!-- All Donors Modal -->
    <AllDonorsModal
      v-if="isFundraisingEnabled && event"
      :show="showAllDonorsModal"
      :event-id="event.id"
      :currency="fundraisingProgress?.currency || event.fundraising_currency || 'USD'"
      :total-cash-donors="fundraisingProgress?.total_donors || 0"
      :total-item-donors="itemCategorySummary?.totals?.total_item_donors || 0"
      :has-item-donations="(itemCategorySummary?.categories?.length || 0) > 0"
      :initial-tab="allDonorsInitialTab"
      @close="showAllDonorsModal = false"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import DOMPurify from 'dompurify'
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Share2,
  Heart,
  CalendarPlus,
  X,
} from 'lucide-vue-next'
import { extractGoogleMapsEmbedUrl } from '@/utils/embedExtractor'
import PublicDonationForm from './PublicDonationForm.vue'
import PublicEventBanner from './event/PublicEventBanner.vue'
import PublicEventFundraisingCard from './event/PublicEventFundraisingCard.vue'
import PublicEventInfo from './event/PublicEventInfo.vue'
import PublicEventRegistrationCard from './event/PublicEventRegistrationCard.vue'
import PublicEventAgenda from './event/PublicEventAgenda.vue'
import PublicEventQRModal from './event/PublicEventQRModal.vue'
import AllDonorsModal from './event/AllDonorsModal.vue'
import TopDonorsSection from './event/TopDonorsSection.vue'
import PublicEventExpenseSection from './event/PublicEventExpenseSection.vue'
import TicketTierList from './tickets/public/TicketTierList.vue'
import { eventsService, ticketTypesService, type Event, type TicketType } from '@/services/api'

// Composables
import {
  usePublicEventData,
  useEventRegistration,
  useEventCalendar,
  useFundraising,
  useEventSharing,
  useEventDateFormatters,
} from '@/composables/event'
import {
  formatRelativeWhen,
  getEventAccent,
  getEventThumbnail,
} from '@/composables/useEventFormatters'
import { useEventLike } from '@/composables/useEventLike'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'
import { useAppLanguage } from '@/composables/useAppLanguage'

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
  (e: 'like-changed', eventId: string, isLiked: boolean, likesCount: number): void
  (e: 'open-event', eventId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  hasPrev: false,
  hasNext: false,
})

const emit = defineEmits<Emits>()
const router = useRouter()

const { t } = useAppLanguage()
const { translateEventCategory } = useCategoryTranslation()

// Local state
const showDonationForm = ref(false)
const showQRModal = ref(false)
const showAllDonorsModal = ref(false)
const allDonorsInitialTab = ref<'cash' | 'item'>('cash')
const showQuickCalendar = ref(false)
const relatedEvents = ref<Event[]>([])
const contentRef = ref<HTMLElement | null>(null)

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
  topDonors: topDonorsData,
  publicExpenses,
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

// Tier list fetched per drawer-open. We use "tier exists" rather than the
// event-detail's `has_ticketed_sales` because the detail endpoint may not
// expose that field — it lives on `EventListSerializer`. Fetching tiers
// directly is also free in our flow since `TicketTierList` would otherwise
// fetch them itself; we hand the result down to skip the duplicate call.
const ticketTiers = ref<TicketType[]>([])

const loadTicketTiers = async (eventId: string) => {
  try {
    const response = await ticketTypesService.listPublic(eventId)
    ticketTiers.value = response.success && response.data ? response.data : []
  } catch {
    ticketTiers.value = []
  }
}

// Discriminator: when ticketed, the buyer flow takes over and the legacy
// RSVP / registration card is hidden so the user isn't shown two competing
// CTAs. Falls back to the event flag when present (cheaper signal once the
// backend ships it on detail), otherwise relies on the fetched tier count.
const hasTicketedSales = computed(() => {
  if (event.value?.has_ticketed_sales != null) {
    return Boolean(event.value.has_ticketed_sales)
  }
  return ticketTiers.value.length > 0
})

/** The category's identity colour — same map the cover art is drawn from. */
const accent = computed(() => (event.value ? getEventAccent(event.value) : '#475569'))

/** "In 9 days" / "Happening now", or null once the event is far enough out. */
const relativeWhen = computed(() => (event.value ? formatRelativeWhen(event.value) : null))

/**
 * Whether some section further down already owns the page's primary action.
 *
 * When one does, the action row's calendar button stays a quiet outline so the
 * drawer never shows two competing gradient CTAs; when nothing does — the
 * display-only case that had no action at all — calendar becomes the primary.
 */
const hasOwnPrimaryAction = computed(
  () =>
    hasTicketedSales.value ||
    Boolean(event.value?.registration_required) ||
    isFundraisingEnabled.value
)

/**
 * An event with nothing below the fold: no tickets, no registration, no agenda,
 * no map, no hosts. The drawer bottoms out after three sentences, which is when
 * the related-events tail earns its extra request.
 */
const isThinEvent = computed(() => {
  const current = event.value
  if (!current) return false
  if (hasOwnPrimaryAction.value) return false
  if (current.agenda_items && current.agenda_items.length > 0) return false
  if (current.hosts && current.hosts.length > 0) return false
  if (googleMapEmbedUrl.value) return false
  return true
})

// Like state. The id is passed as a getter because prev/next swaps the event
// under this component without remounting it.
const {
  isLiked,
  isLoading: isLikeLoading,
  toggleLike,
  updateState: updateLikeState,
} = useEventLike(() => event.value?.id ?? '', false, 0, {
  onLoginRequired: () => {
    emit('login-required')
    closeDrawer()
  },
  onSuccess: (liked, count) => {
    if (event.value) emit('like-changed', event.value.id, liked, count)
  },
})

const loadRelatedEvents = async () => {
  const current = event.value
  if (!current?.category) {
    relatedEvents.value = []
    return
  }

  try {
    const response = await eventsService.getEvents({
      category: current.category,
      privacy: 'public',
      status: 'published',
      ordering: '-start_date',
    })
    relatedEvents.value =
      response.success && response.data
        ? response.data.results.filter((item) => item.id !== current.id).slice(0, 3)
        : []
  } catch {
    relatedEvents.value = []
  }
}

const formatRelatedDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

const openRelatedEvent = (related: Event) => {
  emit('open-event', related.id)
}

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
  if (props.eventId) {
    // Fire the tier fetch in parallel with the event detail — independent calls.
    loadTicketTiers(props.eventId)
  }
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

const handleSeeAllDonors = (tab: 'cash' | 'item') => {
  allDonorsInitialTab.value = tab
  showAllDonorsModal.value = true
}

// Top donors computed - map from API data
const topDonors = computed(() => {
  if (!topDonorsData.value || topDonorsData.value.length === 0) return []

  return topDonorsData.value
    .filter(d => d.amount && parseFloat(d.amount) > 0)
    .map(d => ({
      id: d.id,
      display_name: d.display_name,
      amount: d.amount,
      currency: d.currency,
    }))
})

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watchers
watch(
  () => props.eventId,
  (newId) => {
    // Reset per-event UI so a drawer opened on one event doesn't hand its
    // scroll position or expanded calendar to the next one.
    showQuickCalendar.value = false
    relatedEvents.value = []
    if (contentRef.value) contentRef.value.scrollTop = 0

    if (newId && props.modelValue) {
      loadTicketTiers(newId)
      loadEvent(newId)
    } else {
      ticketTiers.value = []
    }
  },
  { immediate: true }
)

// Keep the like button in step with whichever event is loaded.
watch(event, (current) => {
  updateLikeState(current?.is_liked ?? false, current?.likes_count ?? 0)
})

// `isThinEvent` depends on the ticket tiers, which land on their own request,
// so this keys off both the event and the resolved thinness rather than the
// event alone — otherwise the tail could be decided before the tiers arrive.
watch(
  [() => event.value?.id, isThinEvent],
  () => {
    if (isThinEvent.value) {
      loadRelatedEvents()
    } else {
      relatedEvents.value = []
    }
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.eventId) {
      loadTicketTiers(props.eventId)
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
    loadTicketTiers(props.eventId)
    loadEvent(props.eventId)
  }
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
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

/* Expand/collapse for the calendar targets. Grid-rows rather than max-height,
   so both directions ease evenly (design system §15). */
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none;
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
