<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998]"
        @click="closeDrawer"
      />
    </Transition>

    <!-- Drawer Panel. The category theme is bound once here as CSS custom
         properties; every descendant reads `--evt-*` by inheritance rather than
         taking an `accent` prop down four levels. -->
    <Transition name="slide-right">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[32.5rem] lg:w-[36.25rem] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden will-change-transform"
        :style="themeVars"
        role="dialog"
        aria-modal="true"
        :aria-label="event?.title || t('events.title')"
        @click.stop
      >
        <!-- Header. Starts transparent over the hero so the artwork runs to the
             top edge, then solidifies once the hero scrolls out — otherwise the
             event's name disappears entirely on a long scroll. -->
        <div
          class="absolute inset-x-0 top-0 z-20 transition-colors duration-300"
          :class="isHeaderSolid ? 'bg-white/95 backdrop-blur-sm' : 'bg-transparent'"
        >
          <div
            v-if="!isHeaderSolid"
            class="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent pointer-events-none"
            aria-hidden="true"
          ></div>

          <div class="relative flex items-center gap-2 px-3 py-2.5">
            <button
              @click="closeDrawer"
              class="w-9 h-9 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
              :class="
                isHeaderSolid
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  : 'bg-black/25 hover:bg-black/40 backdrop-blur-sm text-white'
              "
              :title="t('events.drawer.close')"
              :aria-label="t('events.drawer.close')"
            >
              <X class="w-4 h-4" />
            </button>

            <!-- The title only belongs here once the hero's copy is gone. Faded
                 rather than v-if'd so the row's widths never re-flow mid-scroll. -->
            <p
              class="flex-1 min-w-0 truncate text-sm font-semibold text-slate-900 transition-opacity duration-300"
              :class="isHeaderSolid ? 'opacity-100' : 'opacity-0'"
              :aria-hidden="!isHeaderSolid"
            >
              {{ event?.title || '' }}
            </p>

            <div class="flex items-center gap-1 flex-shrink-0">
              <button
                v-if="event?.privacy === 'public'"
                @click="toggleLike"
                :disabled="isLikeLoading"
                class="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
                :class="headerIconClass(isLiked)"
                :aria-label="isLiked ? t('events.drawer.unlike') : t('events.drawer.like')"
                :title="isLiked ? t('events.drawer.unlike') : t('events.drawer.like')"
              >
                <Heart class="w-4 h-4" :class="{ 'fill-current': isLiked }" />
              </button>

              <button
                @click="sharing.shareEvent()"
                class="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
                :class="headerIconClass(false)"
                :aria-label="t('events.drawer.share')"
                :title="t('events.drawer.share')"
              >
                <Share2 class="w-4 h-4" />
              </button>

              <div class="w-px h-5 mx-0.5" :class="isHeaderSolid ? 'bg-slate-200' : 'bg-white/30'"></div>

              <button
                @click="navigatePrev"
                :disabled="!hasPrev"
                class="w-9 h-9 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                :class="headerIconClass(false)"
                :title="t('events.drawer.previous')"
                :aria-label="t('events.drawer.previous')"
              >
                <ChevronUp class="w-5 h-5" />
              </button>
              <button
                @click="navigateNext"
                :disabled="!hasNext"
                class="w-9 h-9 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                :class="headerIconClass(false)"
                :title="t('events.drawer.next')"
                :aria-label="t('events.drawer.next')"
              >
                <ChevronDown class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            v-if="isHeaderSolid"
            class="h-0.5 w-full"
            :style="{ backgroundColor: 'var(--evt-accent)' }"
            aria-hidden="true"
          ></div>
        </div>

        <!-- Content. Runs under the absolutely-positioned header so the hero
             reaches the panel's top edge; states with no hero get the header's
             height back as padding. -->
        <div
          ref="contentRef"
          class="flex-1 overflow-y-auto overscroll-contain drawer-scroll"
          :class="{ 'pt-14': !hasHero }"
          @scroll.passive="handleScroll"
        >
          <!-- Donation Form (Inline) -->
          <div v-if="showDonationForm && event" class="p-4">
            <PublicDonationForm
              :event-id="event.id"
              :currency="event.fundraising_currency || 'USD'"
              @back="showDonationForm = false"
              @donated="handleDonationComplete"
            />
          </div>

          <!-- Loading skeleton. Mirrors the real layout — hero, the overlapping
               quick-facts card, then sections — rather than four generic bars,
               so the panel doesn't visibly re-flow when content lands. -->
          <div v-else-if="loading" class="animate-pulse">
            <div class="w-full aspect-banner bg-slate-200"></div>
            <div class="relative -mt-7 mx-4 rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3.5 bg-slate-200 rounded w-2/3"></div>
                  <div class="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3.5 bg-slate-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
            <div class="px-4 pt-6 space-y-6">
              <div v-for="n in 2" :key="n" class="space-y-3">
                <div class="h-3 bg-slate-200 rounded w-24"></div>
                <div class="h-3 bg-slate-100 rounded"></div>
                <div class="h-3 bg-slate-100 rounded w-5/6"></div>
              </div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="!showDonationForm && error" class="p-6 text-center">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle class="w-8 h-8 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-slate-900 mb-2">
              {{ t('events.drawer.error.title') }}
            </h3>
            <p class="text-slate-600 mb-4">{{ error }}</p>
            <button
              @click="loadEventData"
              class="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold"
            >
              {{ t('events.drawer.error.retry') }}
            </button>
          </div>

          <!-- Event Content -->
          <div v-else-if="!showDonationForm && event" class="pb-8">
            <!-- Hero -->
            <div>
              <PublicEventBanner
                :banner-src="currentBannerSrc"
                :fallback-error="fallbackBannerError"
                :title="event.title"
                :category-name="translatedCategoryName"
                :is-fundraising="isFundraisingEnabled"
                :organizer-name="organizerName"
                :organizer-image="organizerImage"
                :motif="motif"
                :is-quiet="isQuiet"
                :relative-label="relativeWhen?.label ?? null"
                :is-live="relativeWhen?.isLive ?? false"
                @banner-error="handleBannerImageError"
              />
            </div>

            <!-- Date, venue and social proof, lifted onto the hero's edge -->
            <PublicEventQuickFacts
              :start-date="event.start_date"
              :end-date="event.end_date"
              :location="event.location"
              :is-virtual="event.is_virtual"
              :attendance-label="attendanceLabel"
              @open-map="sharing.openMap(event.location)"
            />

            <div class="px-4 pt-6 space-y-6">
              <!-- Fundraising progress -->
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

              <!-- Tickets (paid events) — takes precedence over RSVP.
                   We fetch tiers in the drawer so we can use "tier exists" as
                   the discriminator (the event-detail endpoint doesn't reliably
                   return `has_ticketed_sales`); the fetched list is handed down
                   to `TicketTierList` to avoid a duplicate request. -->
              <PublicEventSection
                v-if="hasTicketedSales"
                ref="ticketsSectionRef"
                :title="t('events.tickets.public.title')"
              >
                <TicketTierList :event-id="event.id" :tiers="ticketTiers" />
              </PublicEventSection>

              <!-- Registration status (free RSVP events). The button itself is
                   in the pinned action bar; this carries only the context. -->
              <PublicEventSection
                v-else-if="event.registration_required"
                :title="t('events.drawer.registration.heading')"
              >
                <PublicEventRegistrationCard
                  :registration-required="event.registration_required"
                  :is-registered="isUserRegistered"
                  :status-label="registrationStatusLabel"
                  :status-badge-class="registrationStatusBadgeClass"
                  :time-until-event="timeUntilEvent"
                  :is-ongoing="event.is_ongoing"
                  :is-virtual="event.is_virtual"
                  :virtual-link="event.virtual_link"
                  :confirmation-code="userRegistration?.confirmation_code"
                  :is-cancelling="registration.isCancelling.value"
                  :registration-message="registration.registrationMessage.value"
                  :current-user="currentUser"
                  @show-qr="showQRModal = true"
                  @cancel-registration="registration.handleCancelRegistration()"
                />
              </PublicEventSection>

              <!-- About -->
              <PublicEventSection :title="t('events.drawer.about')">
                <div
                  v-if="event.description"
                  class="prose prose-sm max-w-none text-slate-700"
                  v-html="sanitizedDescription"
                />
                <p v-else-if="event.short_description" class="text-sm text-slate-700 leading-relaxed">
                  {{ event.short_description }}
                </p>
                <p v-else class="text-sm text-slate-500">{{ t('events.drawer.noDescription') }}</p>
              </PublicEventSection>

              <!-- Agenda -->
              <PublicEventSection
                v-if="event.agenda_items && event.agenda_items.length > 0"
                :title="t('events.drawer.agenda')"
              >
                <PublicEventAgenda
                  :items="event.agenda_items"
                  :event-start-date="event.start_date"
                />
              </PublicEventSection>

              <!-- Location Map -->
              <PublicEventSection v-if="googleMapEmbedUrl" :title="t('events.drawer.location')">
                <div class="rounded-xl overflow-hidden border" :style="{ borderColor: 'var(--evt-ring)' }">
                  <iframe
                    :src="googleMapEmbedUrl"
                    :title="t('events.drawer.location')"
                    width="100%"
                    height="200"
                    style="border: 0"
                    allowfullscreen
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    class="w-full block"
                  />
                </div>
              </PublicEventSection>

              <!-- Hosts. Renders every host, not just the first — a wedding with
                   two families showed one name and silently dropped the rest. -->
              <PublicEventSection
                v-if="event.hosts && event.hosts.length > 0"
                :title="
                  isFundraisingEnabled
                    ? t('events.drawer.campaignOrganizer')
                    : t('events.drawer.hostedBy')
                "
              >
                <div
                  class="bg-white border rounded-2xl divide-y divide-slate-100 overflow-hidden"
                  :style="{ borderColor: 'var(--evt-ring)' }"
                >
                  <div
                    v-for="host in event.hosts"
                    :key="host.id ?? host.name"
                    class="flex items-center gap-3 p-4"
                  >
                    <div
                      v-if="host.profile_image"
                      class="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0"
                    >
                      <img
                        :src="getProfileUrl(host.profile_image)"
                        :alt="host.name"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div
                      v-else
                      class="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold flex-shrink-0"
                      :style="{ backgroundColor: 'var(--evt-tint)', color: 'var(--evt-accent)' }"
                    >
                      {{ formatters.getInitials(host.name) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900 truncate">{{ host.name }}</p>
                      <p class="text-sm text-slate-500 truncate">
                        {{
                          host.title ||
                          (isFundraisingEnabled
                            ? t('events.drawer.campaignOrganizer')
                            : t('events.drawer.eventOrganizer'))
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              </PublicEventSection>

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
              <PublicEventSection
                v-if="relatedEvents.length > 0"
                :title="
                  event.category_details?.name
                    ? t('events.drawer.moreIn', {
                        category: translateEventCategory(event.category_details.name),
                      })
                    : t('events.drawer.moreEvents')
                "
              >
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
              </PublicEventSection>
            </div>
          </div>
        </div>

        <!-- Pinned action bar. One CTA, always reachable. -->
        <PublicEventActionBar
          v-if="event && !loading && !error && !showDonationForm"
          :event-id="event.id"
          :is-authenticated="Boolean(currentUser)"
          :is-quiet="isQuiet"
          :has-ticketed-sales="hasTicketedSales"
          :is-fundraising="isFundraisingEnabled"
          :registration-required="Boolean(event.registration_required)"
          :is-registered="isUserRegistered"
          :confirmation-code="userRegistration?.confirmation_code"
          :can-register="registration.canRegister.value"
          :is-registering="registration.isRegistering.value"
          :is-event-full="isEventFull"
          :is-registration-closed="isRegistrationClosed"
          :is-past="Boolean(event.is_past)"
          :price-label="priceLabel"
          :attendance-label="attendanceLabel"
          @register="handleRegister"
          @login-required="handleLoginToRegister"
          @donate="showDonationForm = true"
          @show-qr="showQRModal = true"
          @focus-tickets="scrollToTickets"
          @add-to-google="calendar.addToGoogleCalendar()"
          @add-to-outlook="calendar.addToOutlookCalendar()"
          @download-ics="calendar.downloadICSFile()"
        />
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
  X,
} from 'lucide-vue-next'
import { extractGoogleMapsEmbedUrl } from '@/utils/embedExtractor'
import PublicDonationForm from './PublicDonationForm.vue'
import PublicEventBanner from './event/PublicEventBanner.vue'
import PublicEventQuickFacts from './event/PublicEventQuickFacts.vue'
import PublicEventSection from './event/PublicEventSection.vue'
import PublicEventActionBar from './event/PublicEventActionBar.vue'
import PublicEventFundraisingCard from './event/PublicEventFundraisingCard.vue'
import PublicEventRegistrationCard from './event/PublicEventRegistrationCard.vue'
import PublicEventAgenda from './event/PublicEventAgenda.vue'
import PublicEventQRModal from './event/PublicEventQRModal.vue'
import AllDonorsModal from './event/AllDonorsModal.vue'
import TopDonorsSection from './event/TopDonorsSection.vue'
import PublicEventExpenseSection from './event/PublicEventExpenseSection.vue'
import TicketTierList from './tickets/public/TicketTierList.vue'
import { eventsService, ticketTypesService, type Event, type TicketType } from '@/services/api'
import { formatCurrency, type CurrencyCode } from '@/utils/currency'

// Composables
import {
  usePublicEventData,
  useEventRegistration,
  useEventCalendar,
  useFundraising,
  useEventSharing,
  useEventDateFormatters,
  useEventTheme,
} from '@/composables/event'
import {
  formatRelativeWhen,
  getAttendanceLabel,
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
const relatedEvents = ref<Event[]>([])
const contentRef = ref<HTMLElement | null>(null)
const ticketsSectionRef = ref<{ $el: HTMLElement } | null>(null)

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

// The category's atmosphere — scrim, tints, ring, motif — bound on the panel root.
const { motif, isQuiet, themeVars } = useEventTheme(event)

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

/** The category chip should read in the reader's language, like the list's does. */
const translatedCategoryName = computed(() => {
  const name = event.value?.category_details?.name
  return name ? translateEventCategory(name) : null
})

/** The organizer's picture, when the payload carries one. */
const organizerImage = computed(() => {
  const host = event.value?.hosts?.[0]
  return host?.profile_image ? getProfileUrl(host.profile_image) : null
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

/** "In 9 days" / "Happening now", or null once the event is far enough out. */
const relativeWhen = computed(() => (event.value ? formatRelativeWhen(event.value) : null))

/** "240 going" / "12 interested", or null when the event has neither. */
const attendanceLabel = computed(() => (event.value ? getAttendanceLabel(event.value) : null))

/**
 * What entry costs, for the action bar's status line.
 *
 * Deliberately silent when there are no tiers and no registration: "no tiers"
 * is not the same as "free" — an organiser may collect payment off-platform —
 * and a wrong "Free" label next to the CTA is worse than no label.
 */
const priceLabel = computed(() => {
  const current = event.value
  if (!current) return null

  if (hasTicketedSales.value) {
    const cheapest = ticketTiers.value.reduce<TicketType | null>((min, tier) => {
      if (!min) return tier
      return Number(tier.price) < Number(min.price) ? tier : min
    }, null)
    if (cheapest) {
      return t('events.card.fromPrice', {
        price: formatCurrency(cheapest.price, cheapest.currency as CurrencyCode),
      })
    }
    return null
  }

  if (current.registration_required) return t('events.drawer.action.freeEntry')

  return null
})

/**
 * An event with nothing below the fold: no tickets, no registration, no agenda,
 * no map, no hosts. The drawer bottoms out after three sentences, which is when
 * the related-events tail earns its extra request.
 */
const isThinEvent = computed(() => {
  const current = event.value
  if (!current) return false
  if (hasTicketedSales.value || current.registration_required || isFundraisingEnabled.value) {
    return false
  }
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

/**
 * Header controls invert over the hero artwork and revert once the bar solidifies.
 * @param active - Whether the control is in its "on" state (a filled like).
 */
const headerIconClass = (active: boolean): string => {
  if (!isHeaderSolid.value) {
    return active
      ? 'bg-rose-500/90 backdrop-blur-sm text-white'
      : 'bg-black/25 hover:bg-black/40 backdrop-blur-sm text-white'
  }
  return active
    ? 'bg-rose-50 text-rose-600'
    : 'text-slate-600 hover:bg-slate-100'
}

/** Whether there is hero artwork behind the header on this state. */
const hasHero = computed(
  () => Boolean(event.value) && !loading.value && !error.value && !showDonationForm.value
)

/**
 * Whether the header has taken over from the hero.
 *
 * Driven by the content's own scroll offset rather than an IntersectionObserver,
 * because the observer's root would have to be re-bound every time prev/next
 * swaps the hero element — the scroll position is the same signal, one line.
 *
 * Forced solid whenever there is no hero at all (loading, error, the donation
 * form), where white-on-artwork controls would sit on a plain white ground.
 */
const scrolledPastHero = ref(false)
const HEADER_SWAP_PX = 120

const isHeaderSolid = computed(() => !hasHero.value || scrolledPastHero.value)

const handleScroll = () => {
  const el = contentRef.value
  if (!el) return
  scrolledPastHero.value = el.scrollTop > HEADER_SWAP_PX
}

const scrollToTickets = () => {
  const section = ticketsSectionRef.value?.$el
  if (!section || !contentRef.value) return
  section.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

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
      // The filter above already guarantees a value, but that doesn't narrow
      // the optional field for the compiler.
      amount: d.amount ?? null,
      currency: d.currency,
    }))
})

/**
 * Keyboard: Escape closes, arrows move through the list.
 *
 * The drawer previously had no key handling at all, so it was the one overlay
 * in the app you couldn't dismiss without a pointer. Arrows are ignored while a
 * stacked modal is open, and while the user is typing in the donation form.
 */
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.modelValue) return
  if (showQRModal.value || showAllDonorsModal.value) return

  if (e.key === 'Escape') {
    if (showDonationForm.value) {
      showDonationForm.value = false
    } else {
      closeDrawer()
    }
    return
  }

  const target = e.target as HTMLElement | null
  const isTyping =
    target?.tagName === 'INPUT' ||
    target?.tagName === 'TEXTAREA' ||
    target?.isContentEditable === true
  if (isTyping || showDonationForm.value) return

  if (e.key === 'ArrowLeft' && props.hasPrev) {
    e.preventDefault()
    navigatePrev()
  } else if (e.key === 'ArrowRight' && props.hasNext) {
    e.preventDefault()
    navigateNext()
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
    // Reset per-event UI so a drawer opened on one event doesn't hand its
    // scroll position or solid header to the next one.
    relatedEvents.value = []
    scrolledPastHero.value = false
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
    if (isOpen) {
      scrolledPastHero.value = false
      if (props.eventId) {
        loadTicketTiers(props.eventId)
        loadEvent(props.eventId)
      }
      document.addEventListener('keydown', handleKeydown)

      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      document.removeEventListener('keydown', handleKeydown)
      setTimeout(() => {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }, 350)
    }
  }
)

onMounted(() => {
  if (props.modelValue) {
    document.addEventListener('keydown', handleKeydown)
    if (props.eventId) {
      loadTicketTiers(props.eventId)
      loadEvent(props.eventId)
    }
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
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

/* Thin scrollbar, per design system §10. */
.drawer-scroll::-webkit-scrollbar {
  width: 6px;
}

.drawer-scroll::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}

.drawer-scroll::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
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
