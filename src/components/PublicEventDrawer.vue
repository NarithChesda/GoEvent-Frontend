<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="drawer-backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="closeDrawer"
      />
    </Transition>

    <!-- Drawer Panel. The category theme is bound once here as CSS custom
         properties; every descendant reads `--evt-*` by inheritance rather than
         taking an `accent` prop down four levels. -->
    <Transition name="drawer-panel">
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

          <!-- Controls are a full 40px on touch and shrink on desktop, per the
               design system's target rule; the row is also the reason the hero's
               copy carries `pt-16`. Circles rather than squares: they read as
               floating objects over the artwork instead of as a chrome bar that
               happens to have lost its background. -->
          <div
            class="relative flex items-center gap-1.5 sm:gap-2 px-3 py-2.5"
            style="padding-top: max(env(safe-area-inset-top), 0.625rem)"
          >
            <button
              @click="closeDrawer"
              class="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors flex-shrink-0"
              :class="controlClass(false)"
              :title="t('events.drawer.close')"
              :aria-label="t('events.drawer.close')"
            >
              <!-- On a phone the drawer is a full-screen sheet that owns a
                   history entry, so the system Back gesture and this button do
                   the same thing and a back chevron is the honest icon. On
                   desktop it is a panel beside the list, which you dismiss. -->
              <ChevronLeft class="w-5 h-5 md:hidden" />
              <X class="w-4 h-4 hidden md:block" />
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

            <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <!-- Prev/next share one pill. As two separate circles they cost
                   the width of a third control on a 360px phone, and they are
                   one affordance — moving through the list — not two. -->
              <div
                class="flex items-center rounded-full overflow-hidden transition-colors"
                :class="controlGroupClass"
              >
                <button
                  @click="navigatePrev"
                  :disabled="!hasPrev"
                  class="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center drawer-close disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  :class="isHeaderSolid ? 'hover:bg-slate-200' : 'hover:bg-white/15'"
                  :title="t('events.drawer.previous')"
                  :aria-label="t('events.drawer.previous')"
                >
                  <ChevronUp class="w-5 h-5" />
                </button>
                <div
                  class="w-px h-5 flex-shrink-0"
                  :class="isHeaderSolid ? 'bg-slate-300' : 'bg-white/30'"
                  aria-hidden="true"
                ></div>
                <button
                  @click="navigateNext"
                  :disabled="!hasNext"
                  class="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center drawer-close disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  :class="isHeaderSolid ? 'hover:bg-slate-200' : 'hover:bg-white/15'"
                  :title="t('events.drawer.next')"
                  :aria-label="t('events.drawer.next')"
                >
                  <ChevronDown class="w-5 h-5" />
                </button>
              </div>

              <button
                v-if="event?.privacy === 'public'"
                @click="toggleLike"
                :disabled="isLikeLoading"
                class="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors"
                :class="controlClass(isLiked)"
                :aria-label="isLiked ? t('events.drawer.unlike') : t('events.drawer.like')"
                :title="isLiked ? t('events.drawer.unlike') : t('events.drawer.like')"
              >
                <Heart class="w-4 h-4" :class="{ 'fill-current': isLiked }" />
              </button>

              <button
                @click="sharing.shareEvent()"
                class="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors"
                :class="controlClass(false)"
                :aria-label="t('events.drawer.share')"
                :title="t('events.drawer.share')"
              >
                <Share2 class="w-4 h-4" />
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
          :class="{ 'pt-16 sm:pt-14': !hasHero }"
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
              @click="loadEventData({ force: true })"
              class="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold"
            >
              {{ t('events.drawer.error.retry') }}
            </button>
          </div>

          <!-- Event Content. The bottom pad clears the floating action pill,
               which no longer reserves space in the panel's flex column. -->
          <div
            v-else-if="!showDonationForm && event"
            class="pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]"
          >
            <!-- Hero -->
            <PublicEventBanner
              :banner-src="currentBannerSrc"
              :fallback-error="fallbackBannerError"
              :title="event.title"
              :category-name="translatedCategoryName"
              :is-fundraising="isFundraisingEnabled"
              :organizer-name="organizerName"
              :organizer-image="organizerImage"
              :motif="motif"
              :has-generated-cover="usingGeneratedCover"
              :is-quiet="isQuiet"
              :relative-label="relativeWhen?.label ?? null"
              :is-live="relativeWhen?.isLive ?? false"
              :attendance-label="attendanceLabel"
              @banner-error="handleBannerImageError"
            />

            <!-- Date and venue, lifted onto the hero's edge -->
            <PublicEventQuickFacts
              :start-date="event.start_date"
              :end-date="event.end_date"
              :location="event.location"
              :is-virtual="event.is_virtual"
              @open-map="sharing.openMap(event.location)"
              @add-to-google="calendar.addToGoogleCalendar()"
              @add-to-outlook="calendar.addToOutlookCalendar()"
              @download-ics="calendar.downloadICSFile()"
            />

            <!-- Scale of the event, where there is enough of it to be worth a row -->
            <PublicEventStats
              :start-date="event.start_date"
              :end-date="event.end_date"
              :agenda-count="event.agenda_items?.length ?? 0"
              :host-count="event.hosts?.length ?? 0"
              :max-attendees="event.max_attendees"
              :registrations-count="event.registrations_count ?? 0"
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
                  @cancel-registration="handleCancelRegistration"
                />
              </PublicEventSection>

              <!-- About -->
              <PublicEventSection :title="t('events.drawer.about')">
                <PublicEventAbout
                  :html="sanitizedDescription"
                  :text="event.short_description"
                  :empty-label="t('events.drawer.noDescription')"
                />
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
import { useRouter, useRoute } from 'vue-router'
import DOMPurify from 'dompurify'
import {
  ChevronRight,
  ChevronLeft,
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
import PublicEventStats from './event/PublicEventStats.vue'
import PublicEventAbout from './event/PublicEventAbout.vue'
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
import { useToast } from '@/composables/useToast'
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
  /**
   * The reader registered or cancelled. Carries the resolved state so the list
   * behind the drawer can patch its own card rather than re-fetching a page.
   */
  (
    e: 'registration-changed',
    eventId: string,
    isRegistered: boolean,
    registrationsCount: number
  ): void
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
const route = useRoute()

const { t } = useAppLanguage()
const { translateEventCategory } = useCategoryTranslation()
const { showSuccess, showError } = useToast()

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
  usingGeneratedCover,
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
    // ExploreView answers this by routing to /signin, so the entry has to be
    // handed over rather than popped — see `releaseHistoryEntry`.
    releaseHistoryEntry()
    closeDrawer()
  },
  onSuccess: (liked, count) => {
    if (event.value) emit('like-changed', event.value.id, liked, count)
  },
  // The composable rolls the optimistic toggle back on failure, which on its
  // own just looks like the tap didn't land.
  onError: (message) => showError(message || t('events.drawer.likeError')),
})

/**
 * Header controls invert over the hero artwork and revert once the bar solidifies.
 * @param active - Whether the control is in its "on" state (a filled like).
 */
const controlClass = (active: boolean): string => {
  if (!isHeaderSolid.value) {
    return active
      ? 'bg-rose-500/90 backdrop-blur-sm text-white'
      : 'bg-black/25 hover:bg-black/40 backdrop-blur-sm text-white'
  }
  return active
    ? 'bg-rose-50 text-rose-600'
    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
}

/**
 * The prev/next pill's ground. The hover state lives on the two buttons inside
 * it, so this carries only the fill — otherwise hovering either half would
 * light up the whole pill.
 */
const controlGroupClass = computed(() =>
  isHeaderSolid.value
    ? 'bg-slate-100 text-slate-600'
    : 'bg-black/25 backdrop-blur-sm text-white'
)

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

/**
 * Browser/system Back closes the drawer instead of leaving the page.
 *
 * On a phone the drawer is a full-screen sheet, so the back gesture is the
 * natural way out of it — before this, it walked off the events list entirely
 * and the reader lost their place in a list they had scrolled a long way into.
 *
 * Opening pushes one entry carrying the router's own state (`back`/`forward`/
 * `position`/`scroll`), so vue-router's bookkeeping and scroll restoration stay
 * intact across the pop; the URL is unchanged, so the pop resolves to the same
 * route and costs nothing beyond re-running guards. Closing any other way — X,
 * Escape, the backdrop — pops that entry back off, so we never leave a dead
 * forward step behind.
 */
const ownsHistoryEntry = ref(false)

const pushHistoryEntry = () => {
  if (ownsHistoryEntry.value) return
  ownsHistoryEntry.value = true
  window.history.pushState({ ...window.history.state, publicEventDrawer: true }, '')
}

const popHistoryEntry = () => {
  if (!ownsHistoryEntry.value) return
  ownsHistoryEntry.value = false
  window.history.back()
}

/**
 * Give up the entry without popping it. Callers that close the drawer *and*
 * navigate in the same breath must use this: `router.push` and a queued
 * `history.back()` race, and the traversal lands after the push — which walks
 * the reader straight back off the page they were being sent to.
 */
const releaseHistoryEntry = () => {
  ownsHistoryEntry.value = false
}

const handlePopState = () => {
  // The entry is already off the stack by the time this fires, so drop the claim
  // before closing — otherwise the close would try to pop it a second time.
  ownsHistoryEntry.value = false
  if (!props.modelValue) return

  // Back dismisses the topmost layer, the way Escape does, and re-claims an
  // entry so the next press still has the drawer itself to close rather than
  // dropping the reader out of the page.
  if (showQRModal.value || showAllDonorsModal.value) {
    showQRModal.value = false
    showAllDonorsModal.value = false
    pushHistoryEntry()
    return
  }

  if (showDonationForm.value) {
    showDonationForm.value = false
    pushHistoryEntry()
    return
  }

  closeDrawer()
}

/**
 * A real navigation (checkout, sign-in) has already moved past our entry, so
 * hand it over rather than racing the router with a `back()` it would fight.
 * Query-only changes are excluded: ExploreView clears its `?event=` param right
 * after opening the drawer, which is not a navigation away from it.
 */
watch(
  () => route.path,
  () => {
    ownsHistoryEntry.value = false
  }
)

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

/**
 * The id we have already asked for, so the two watchers that both fire on open
 * (`eventId` and `modelValue`) don't each kick off their own fetch. Cleared on
 * close, so re-opening the same event still gets fresh data.
 */
const requestedEventId = ref<string | null>(null)

interface LoadOptions {
  /** Re-fetch even if this id was already requested — the error state's retry. */
  force?: boolean
  /** Reconcile in place: no skeleton, no lost scroll position. */
  silent?: boolean
}

const loadEventData = (options: LoadOptions = {}) => {
  const id = props.eventId
  if (!id) return
  if (!options.force && !options.silent && requestedEventId.value === id) return

  requestedEventId.value = id
  // Fire the tier fetch in parallel with the event detail — independent calls.
  loadTicketTiers(id)
  return loadEvent(id, { silent: options.silent })
}

/**
 * Registering updates the panel in place.
 *
 * This used to hand `loadEvent` straight back as the success callback, which
 * flipped `loading` — so the hero, the whole document and the action bar were
 * replaced by the skeleton and rebuilt, dropping the reader's scroll position
 * on the way. Everything the reader needs is already in hand by then: the
 * registration (and its confirmation code) comes back on the register response,
 * and the attendee count is nudged locally. The refresh still runs, silently
 * and unawaited, purely to reconcile with the server.
 */
const handleRegister = async () => {
  const result = await registration.handleRegister()

  if (!result.ok) {
    showError(result.message || t('events.drawer.registration.registerError'))
    return
  }

  emitRegistrationChange()
  void loadEventData({ silent: true })
}

const handleCancelRegistration = async () => {
  const result = await registration.handleCancelRegistration()

  if (!result.ok) {
    showError(result.message || t('events.drawer.registration.cancelError'))
    return
  }

  showSuccess(t('events.drawer.registration.cancelled'))
  emitRegistrationChange()
  void loadEventData({ silent: true })
}

/**
 * Hand the list behind the drawer the new state, so it can patch the one card
 * it owns instead of re-fetching the page the reader is scrolled into.
 */
const emitRegistrationChange = () => {
  if (!event.value) return
  emit(
    'registration-changed',
    event.value.id,
    isUserRegistered.value,
    event.value.registrations_count ?? 0
  )
}

const handleLoginToRegister = () => {
  emit('login-required')
  releaseHistoryEntry()
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
      loadEventData()
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
      loadEventData()
      document.addEventListener('keydown', handleKeydown)
      window.addEventListener('popstate', handlePopState)
      pushHistoryEntry()

      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      // Dropped so re-opening the same event fetches fresh data rather than
      // showing whatever was true when it was last closed.
      requestedEventId.value = null
      document.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('popstate', handlePopState)
      popHistoryEntry()
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
    window.addEventListener('popstate', handlePopState)
    pushHistoryEntry()
    loadEventData()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('popstate', handlePopState)
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
})
</script>

<style scoped>

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
}</style>
