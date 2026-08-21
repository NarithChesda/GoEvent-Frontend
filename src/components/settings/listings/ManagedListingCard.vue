<template>
  <!--
    One of the vendor's own listings, on the settings page.

    The body is the catalogue card itself — `ServiceCard`, the same component
    `/services` renders — so the grid a vendor manages is literally the grid a
    client browses. That is the point of reusing it rather than describing the
    listing a second way: the vendor edits what they can see, and a photo that
    crops badly or a price string that reads oddly shows up here before a client
    finds it.

    What the catalogue card cannot carry is the half of a listing only its owner
    can see: whether it is live, whether a reviewer sent it back, and what to do
    about either. That rides in a footer below the card body rather than as more
    marks on the artwork — the cover already carries its two (featured, price),
    and `ServiceCard`'s own note explains why two is the budget rather than a
    starting point.

    The footer is *inside* the same object, not a second card under it: this
    element owns the ground, border and hover lift, and `ServiceCard` renders
    `embedded` with none of its own. A bordered card inside a bordered card
    would claim the inner one is separable from its own parent (taste §3).

    `hide-vendor` drops the "who sells it" line the catalogue closes on. Here it
    would be the vendor's own name and logo, repeated on every card they own.

    ─── Why the phone shape is drawn here and not by `ServiceCard` ───

    The catalogue's phone row is a 96px square beside three lines of text, and
    this card hangs an action row under that. Which left the status word alone
    on the footer's left half — a whole line of chrome spent on two words — and
    a thumbnail that stopped a third of the way down a card it shares with
    nothing else. So state moved up to the row's top right, which is the first
    place an owner's eye lands and costs no line of its own, and the cover took
    the corner it vacated: still a square, because a listing's cover is composed
    to be cropped square and stretching it to the card's height would letterbox
    every one of them, but 112px rather than 96 and centred against the whole
    card, so it crosses the divider into the space the status word held.

    The view count went down for the same reason. Three fields on the caption
    line — category, count, state — is the row's narrowest line carrying the
    most; `hide-row-views` drops it there and it reappears on the action row,
    whose left half the status word vacated. That row is where a vendor is
    already looking to read or fix a listing, and a number sitting opposite the
    controls is not competing with anything.

    That is why this draws the phone cover itself (`hide-row-cover`) rather than
    letting `ServiceCard` place one: the tile is positioned against chrome that
    lives outside `ServiceCard` entirely, which nothing inside it can reach. The
    text beside it is still the catalogue's, unchanged, and the desktop poster —
    the shape most of this grid is — is still `ServiceCard` end to end.
  -->
  <article
    :aria-label="listing.title"
    class="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white transition-[border-color,box-shadow] duration-300 hover:border-slate-300/80 hover:shadow-lg hover:shadow-slate-200/40"
  >
    <!-- The phone's cover: a square, centred against the card's full height
         rather than against the text row, so it reaches past the divider.
         Hidden from assistive tech and given no focus stop of its own — it is a
         second way for a thumb to reach the editor the card body already
         announces, not a second control. -->
    <div
      class="absolute left-3 top-1/2 h-28 w-28 -translate-y-1/2 cursor-pointer overflow-hidden rounded-xl bg-slate-100 sm:hidden"
      aria-hidden="true"
      @click="emit('edit', listing)"
    >
      <img
        v-if="hasCover"
        :src="coverSrc"
        alt=""
        loading="lazy"
        class="h-full w-full object-cover"
        @error="coverFailed = true"
      />
      <ServiceThumbArt v-else :category="categoryName" />

      <!-- The one mark this tile carries, matching the catalogue row's: glass
           rather than gradient, glyph rather than label. -->
      <span
        v-if="listing.is_featured"
        class="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-sm"
      >
        <Sparkles class="h-3 w-3 text-slate-900" aria-hidden="true" />
      </span>
    </div>

    <!-- The row's own minimum is what keeps the square inside the card when the
         text beside it runs short: 4.75rem plus the action row below clears the
         cover's 7rem and its two 0.75rem margins, and the slack lands above the
         divider, where the cover is, instead of under the buttons. -->
    <ServiceCard
      embedded
      hide-vendor
      hide-row-cover
      hide-row-views
      class="min-h-[4.75rem] pl-[8.5rem] sm:min-h-0 sm:pl-0"
      :listing="cardListing"
      @click="emit('edit', listing)"
    >
      <!-- State, at the top right of the phone row. The category beside it is
           what yields: an owner scrolling their own listings is looking for what
           needs doing, and they already know what each one sells.

           The one-word label rather than the footer's. "Pending Review" is two
           thirds of this line on a narrow phone, and longer again in Khmer —
           and the dot beside it already carries which of the five states this
           is, so the word only has to name it, not explain it. The footer says
           it in full where the room is there. -->
      <template #rowBadge>
        <span class="ml-auto inline-flex flex-shrink-0 items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass" aria-hidden="true" />
          <span class="text-[11px] font-medium" :class="statusTextClass">
            {{ statusShortLabel }}
          </span>
        </span>
      </template>
    </ServiceCard>

    <!-- The footer clears the cover on a phone, so its divider starts where the
         text does rather than cutting the tile in half. -->
    <footer class="pl-[8.5rem] sm:pl-0">
      <div class="border-t border-slate-100 px-3 py-2.5 sm:px-4 sm:py-3">
        <div class="flex items-center justify-between gap-2">
          <!-- How many people have seen it, on the phone only — the caption line
               above gave the count up to the status mark, and this is the row it
               belongs on: an owner reading this line is deciding whether to open
               the analytics beside it. Desktop states it on the card body, where
               the caption has room for both. -->
          <span
            class="inline-flex flex-shrink-0 items-center gap-1 text-[11px] text-slate-500 sm:hidden"
            role="img"
            :aria-label="t('services.detail.views', { count: listing.views_count })"
          >
            <Eye class="h-3 w-3" aria-hidden="true" />
            {{ listing.views_count }}
          </span>

          <!-- State, as a dot and a word. A filled status pill per card would put
               five saturated chips in a 3-up grid, competing with the covers they
               sit under; the dot carries the colour and the label stays on the
               slate ladder. It truncates because "Pending review" runs half again
               as long in Khmer, and it is the half of this row that can yield.
               The phone states it above instead, where the cover has taken this
               corner. -->
          <span class="hidden min-w-0 items-center gap-1.5 sm:inline-flex">
            <span
              class="h-1.5 w-1.5 flex-shrink-0 rounded-full"
              :class="statusDotClass"
              aria-hidden="true"
            />
            <span class="truncate text-xs font-medium" :class="statusTextClass">
              {{ statusLabel }}
            </span>
          </span>

          <!-- Two controls, always the same two shapes — one icon disc and one
               labelled button — so the footer keeps its geometry however the
               listing's state changes. What they *do* is contextual: a draft has
               nothing to measure and one thing to do with it; everything else has
               numbers to read and copy to fix. `ml-auto` is what holds them to
               the right edge on a phone, where the status beside them is gone. -->
          <div class="ml-auto flex flex-shrink-0 items-center gap-1">
            <button
              v-if="isDraft"
              type="button"
              :class="iconButtonClass"
              :aria-label="t('settings.listings.edit')"
              :title="t('settings.listings.edit')"
              @click="emit('edit', listing)"
            >
              <Pencil class="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              v-else
              type="button"
              :class="iconButtonClass"
              :aria-label="t('settings.listings.analyticsBtn')"
              :title="t('settings.listings.analyticsBtn')"
              @click="emit('analytics', listing)"
            >
              <BarChart3 class="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              v-if="isDraft"
              type="button"
              :disabled="submitting"
              :class="labelledButtonClass"
              @click="emit('submit', listing)"
            >
              <Loader2 v-if="submitting" class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              <Send v-else class="h-3.5 w-3.5" aria-hidden="true" />
              {{ submitting ? t('settings.listings.submitting') : t('settings.listings.submit') }}
            </button>
            <button
              v-else
              type="button"
              :class="labelledButtonClass"
              @click="emit('edit', listing)"
            >
              <Pencil class="h-3.5 w-3.5" aria-hidden="true" />
              {{ t('settings.listings.edit') }}
            </button>
          </div>
        </div>

        <!-- Why it came back. `admin_notes` is the one field on a listing that the
             vendor needs and had nowhere to read — a rejected listing used to show
             the word "Rejected" and nothing else, which leaves editing it a guess.
             Clamped to two lines here; the full note opens with the form. -->
        <p v-if="reviewNote" class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-red-600">
          {{ reviewNote }}
        </p>
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BarChart3, Eye, Loader2, Pencil, Send, Sparkles } from 'lucide-vue-next'
import ServiceCard from '@/components/services/ServiceCard.vue'
import ServiceThumbArt from '@/components/services/ServiceThumbArt.vue'
import type { Listing, PriceType } from '@/components/services/types'
import { imagekitUrl } from '@/utils/mediaUrl'
import { apiClient, type ServiceListing, type ServiceListingStatus } from '@/services/api'

const props = defineProps<{
  listing: ServiceListing
  /** Resolved by the tab, which holds the category lookup the API may omit. */
  categoryName: string
  /** A submit-for-review request is in flight for this listing. */
  submitting?: boolean
}>()

const emit = defineEmits<{
  edit: [listing: ServiceListing]
  submit: [listing: ServiceListing]
  analytics: [listing: ServiceListing]
}>()

const { t } = useI18n()

const isDraft = computed(() => props.listing.status === 'draft')

/**
 * Only a listing the reviewer sent back gets its note shown. `admin_notes` is
 * also where an approver's internal remark can land, and surfacing that under a
 * live listing would read as a complaint about something that is working.
 */
const reviewNote = computed(() =>
  props.listing.status === 'rejected' || props.listing.status === 'suspended'
    ? props.listing.admin_notes?.trim() || ''
    : '',
)

const STATUS_DOTS: Record<ServiceListingStatus, string> = {
  approved: 'bg-[#2ecc71]',
  pending_review: 'bg-amber-400',
  draft: 'bg-slate-300',
  rejected: 'bg-red-500',
  suspended: 'bg-red-500',
}

const STATUS_LABEL_KEYS: Record<ServiceListingStatus, string> = {
  approved: 'settings.listings.status.active',
  pending_review: 'settings.listings.status.pendingReview',
  draft: 'settings.listings.status.draft',
  rejected: 'settings.listings.status.rejected',
  suspended: 'settings.listings.status.suspended',
}

const statusDotClass = computed(() => STATUS_DOTS[props.listing.status] ?? 'bg-slate-300')

const statusLabel = computed(() => {
  const key = STATUS_LABEL_KEYS[props.listing.status]
  return key ? t(key) : props.listing.status
})

/**
 * The same five states in one word each, for the phone row's caption line —
 * only `pending_review` actually differs, and only because it is the one label
 * that does not fit beside a category name. Kept as its own key set rather than
 * truncated: an ellipsis in a status is a state nobody can read.
 */
const STATUS_SHORT_LABEL_KEYS: Record<ServiceListingStatus, string> = {
  approved: 'settings.listings.statusShort.active',
  pending_review: 'settings.listings.statusShort.pendingReview',
  draft: 'settings.listings.statusShort.draft',
  rejected: 'settings.listings.statusShort.rejected',
  suspended: 'settings.listings.statusShort.suspended',
}

const statusShortLabel = computed(() => {
  const key = STATUS_SHORT_LABEL_KEYS[props.listing.status]
  return key ? t(key) : props.listing.status
})

// Red is semantic here, not emphasis: a listing that needs the vendor to act is
// the one state they must not scroll past. Everything else stays on the ladder.
const statusTextClass = computed(() =>
  props.listing.status === 'rejected' || props.listing.status === 'suspended'
    ? 'text-red-600'
    : 'text-slate-600',
)

// 40px on touch, shrinking on desktop where a pointer is exact (design §17).
const iconButtonClass =
  'inline-flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200'

const labelledButtonClass =
  'inline-flex h-10 sm:h-8 items-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-100 px-3 sm:px-2.5 text-xs font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200'

/**
 * The management record, in the shape the catalogue card reads.
 *
 * Only the fields that card actually renders are resolved — with `hide-vendor`
 * set, the vendor identity it would otherwise close on goes unread, so those
 * fields stay empty rather than being filled with the owner's own details.
 *
 * `price_display_text` is what the backend composed; the fallback is the same
 * line the catalogue shows for a quote-only listing, and `priceType` is what
 * decides whether the card renders it as a figure or as muted copy.
 */
const cardListing = computed<Listing>(() => {
  const min = parseFloat(props.listing.price_min) || 0
  const max = parseFloat(props.listing.price_max) || 0
  let priceType: PriceType = 'range'
  if (min === 0 && max === 0) priceType = 'quote'
  else if (min === max) priceType = 'fixed'

  const cover = props.listing.cover_image_url

  return {
    id: props.listing.id,
    title: props.listing.title,
    tagline: props.listing.short_tagline,
    description: props.listing.description,
    coverImage: cover ? apiClient.getProfilePictureUrl(cover) || cover : '',
    category: props.categoryName,
    priceType,
    priceMin: min || null,
    priceMax: max || null,
    currency: (props.listing.currency || 'USD') as Listing['currency'],
    priceUnit: '',
    priceDisplay: props.listing.price_display_text || t('settings.listings.contactForPrice'),
    vendorId: props.listing.vendor,
    vendorName: '',
    vendorLogo: '',
    vendorVerified: false,
    tags: props.listing.tags_list || [],
    serviceArea: props.listing.service_area,
    gallery: [],
    telegramUsername: '',
    phone: '',
    website: '',
    views: props.listing.views_count,
    contactClicks: props.listing.contact_clicks_count,
    isFeatured: props.listing.is_featured,
  }
})

/**
 * The phone cover's source, resolved the way the catalogue row resolves its
 * own: branded category art when there is no photo of the listing's own — most
 * listings have none, and a borrowed stock frame is an unreadable crop that
 * repeats verbatim between listings in a category — and roughly 2× the rendered
 * width through ImageKit (design §7).
 */
const coverFailed = ref(false)
const hasCover = computed(() => !!cardListing.value.coverImage && !coverFailed.value)
const coverSrc = computed(
  () => imagekitUrl(cardListing.value.coverImage, 'w-256') ?? cardListing.value.coverImage,
)

watch(
  () => props.listing.cover_image_url,
  () => {
    coverFailed.value = false
  },
)
</script>
