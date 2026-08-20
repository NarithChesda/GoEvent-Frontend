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
  -->
  <article
    :aria-label="listing.title"
    class="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white transition-[border-color,box-shadow] duration-300 hover:border-slate-300/80 hover:shadow-lg hover:shadow-slate-200/40"
  >
    <ServiceCard embedded hide-vendor :listing="cardListing" @click="emit('edit', listing)" />

    <footer class="border-t border-slate-100 px-3 py-2.5 sm:px-4 sm:py-3">
      <div class="flex items-center justify-between gap-2">
        <!-- State, as a dot and a word. A filled status pill per card would put
             five saturated chips in a 3-up grid, competing with the covers they
             sit under; the dot carries the colour and the label stays on the
             slate ladder. It truncates because "Pending review" runs half again
             as long in Khmer, and it is the half of this row that can yield. -->
        <span class="inline-flex min-w-0 items-center gap-1.5">
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
             numbers to read and copy to fix. -->
        <div class="flex flex-shrink-0 items-center gap-1">
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
          <button v-else type="button" :class="labelledButtonClass" @click="emit('edit', listing)">
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
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BarChart3, Loader2, Pencil, Send } from 'lucide-vue-next'
import ServiceCard from '@/components/services/ServiceCard.vue'
import type { Listing, PriceType } from '@/components/services/types'
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
</script>
