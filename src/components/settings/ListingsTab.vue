<template>
  <div>
    <!--
      A vendor's own listings.

      The grid is the catalogue's grid — same component, same three-up columns,
      same phone row — because the thing a vendor is managing *is* what a client
      sees, and showing it to them in a second, private layout meant they were
      editing one object and looking at another. What is added here is only what
      an owner can see: state, the reviewer's note, and the two things to do
      about them. See ManagedListingCard for how that rides along without
      turning into a second card.
    -->

    <!-- Loading. The vendor profile decides which of the states below applies,
         so the tab holds this shape until it lands: heading, then the grid the
         listings will fill. -->
    <div v-if="isBootstrapping" aria-hidden="true">
      <div class="animate-pulse">
        <div class="h-6 w-40 rounded bg-slate-200"></div>
        <div class="mt-2.5 h-4 w-56 max-w-full rounded bg-slate-100"></div>
      </div>
      <div class="mt-5 grid animate-pulse grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <div
          v-for="n in 3"
          :key="n"
          class="overflow-hidden rounded-2xl border border-slate-200/60 bg-white"
        >
          <div class="flex gap-3 p-3 sm:hidden">
            <div class="h-24 w-24 flex-shrink-0 rounded-xl bg-slate-200"></div>
            <div class="flex min-w-0 flex-1 flex-col justify-center">
              <div class="h-3 w-1/2 rounded bg-slate-200"></div>
              <div class="mt-1.5 h-4 w-11/12 rounded bg-slate-200"></div>
              <div class="mt-2 h-3.5 w-24 rounded bg-slate-200"></div>
            </div>
          </div>
          <div class="hidden sm:block">
            <div class="aspect-[1.9/1] bg-slate-200"></div>
            <div class="p-4 sm:p-5">
              <div class="mb-2 h-3 w-2/5 rounded bg-slate-200"></div>
              <div class="mb-2 h-5 w-3/4 rounded bg-slate-200"></div>
              <div class="h-3 w-2/3 rounded bg-slate-200"></div>
            </div>
          </div>
          <div
            class="flex items-center justify-between border-t border-slate-100 px-3 py-2.5 sm:px-4 sm:py-3"
          >
            <div class="h-3 w-16 rounded bg-slate-200"></div>
            <div class="h-8 w-24 rounded-lg bg-slate-100"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load failure, of either fetch. The profile decides which state this tab
         is in, so a profile that never arrived has to fail *here* rather than
         fall through to the block below — an unreachable server is not the same
         answer as "you are not verified", and telling a verified vendor to go
         get verified sends them to a tab that will say they already are. -->
    <div v-else-if="loadFailure" class="px-4 py-12 text-center lg:py-16">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle class="h-8 w-8 text-red-600" aria-hidden="true" />
      </div>
      <h3 class="mb-2 text-lg font-semibold text-slate-900">
        {{ t('settings.listings.errorTitle') }}
      </h3>
      <p class="mx-auto mb-6 max-w-md text-sm text-slate-500">{{ loadFailure }}</p>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        @click="retry"
      >
        <RefreshCw class="h-4 w-4" aria-hidden="true" />
        {{ t('settings.listings.tryAgain') }}
      </button>
    </div>

    <!--
      Not cleared to list yet.

      This used to be an amber-to-orange panel that named the problem and then
      stopped — a third palette in a slate-and-brand app, and a dead end: the
      thing standing between the vendor and this tab lives one tab over, and
      nothing here said so or went there. Now it is the same centred blocked
      state the rest of the app uses, and it ends on the way forward.
    -->
    <div v-else-if="!isVerifiedVendor" class="px-4 py-12 text-center lg:py-16">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
        <ShieldAlert class="h-8 w-8 text-amber-500" aria-hidden="true" />
      </div>
      <h3 class="mb-2 text-lg font-semibold text-slate-900">
        {{ t('settings.listings.verification.title') }}
      </h3>
      <p class="mx-auto max-w-md text-sm leading-relaxed text-slate-500">
        {{ t('settings.listings.verification.subtitle') }}
      </p>

      <!-- Where they stand, in the same dot-and-word the cards use, so the two
           kinds of "state" on this tab read as one vocabulary. -->
      <p class="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
        <span
          class="h-1.5 w-1.5 flex-shrink-0 rounded-full"
          :class="vendorState === 'pending' ? 'bg-amber-400' : 'bg-slate-300'"
          aria-hidden="true"
        />
        {{ vendorStatusLabel }}
      </p>

      <div class="mt-6">
        <button
          type="button"
          class="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          @click="goToVendorTab"
        >
          {{ t('settings.listings.verification.goToProfile') }}
          <ArrowRight
            class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>

    <!-- Cleared, with or without listings -------------------------------- -->
    <template v-else>
      <!--
        Heading, and everything the old header used to spend a second row on.

        The three counts were their own line of coloured numbers under the
        title — an emerald 4, an amber 1, a slate 2 — which made the loudest
        marks on the page a tally nobody acts on. They are the subtitle now,
        the way the tickets tab states what its list contains: one quiet line
        that answers "what is in here" before you look.

        The breakdown only appears once every page is loaded. Counted over a
        partial list it would be a confident sentence about the wrong number.
      -->
      <header class="mb-5 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="text-xl font-semibold text-slate-900">
            {{ t('settings.listings.title') }}
          </h2>
          <p class="mt-1 text-sm text-slate-500">{{ headerLine }}</p>
        </div>

        <!-- The tab's one primary action, and so the one gradient object on
             screen — which is why the empty state below drops it rather than
             offering the same thing twice at two weights. Icon-only on a phone;
             the label is the first thing to go when the heading beside it is
             what the row is for. -->
        <button
          v-if="listings.length > 0"
          type="button"
          class="inline-flex h-10 flex-shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-3 text-sm font-semibold text-white shadow-md shadow-[#2ecc71]/20 transition-all duration-200 hover:opacity-90 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:px-4"
          :aria-label="t('settings.listings.newListing')"
          @click="openCreateDrawer"
        >
          <Plus class="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <span class="hidden sm:inline">{{ t('settings.listings.newListing') }}</span>
        </button>
      </header>

      <!-- Nothing listed yet. Centred, one object on screen, and the CTA is the
           only thing on it that can be pressed. -->
      <div v-if="listings.length === 0 && !isLoading" class="px-4 py-12 text-center lg:py-16">
        <div
          class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 lg:mb-6 lg:h-32 lg:w-32"
        >
          <LayoutList class="h-12 w-12 text-[#2ecc71] lg:h-16 lg:w-16" aria-hidden="true" />
        </div>
        <h3 class="mb-2 text-xl font-bold text-slate-900 lg:mb-3 lg:text-2xl">
          {{ t('settings.listings.empty.title') }}
        </h3>
        <p class="mx-auto mb-5 max-w-md text-sm text-slate-600 lg:mb-6 lg:text-base">
          {{ t('settings.listings.empty.subtitle') }}
        </p>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 lg:px-6 lg:py-3 lg:text-base"
          @click="openCreateDrawer"
        >
          <Plus class="h-5 w-5" aria-hidden="true" />
          {{ t('settings.listings.newListing') }}
        </button>
      </div>

      <!-- The grid. Columns and gaps kept in step with ServiceListingsGrid: the
           settings column and the services page share the same max widths, so
           three-up lands on the same card width in both places. -->
      <div v-else>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <ManagedListingCard
            v-for="listing in listings"
            :key="listing.id"
            :listing="listing"
            :category-name="getCategoryName(listing)"
            :submitting="isSubmitting === listing.id"
            @edit="editListing"
            @submit="submitForReview"
            @analytics="openAnalytics"
          />
        </div>

        <div v-if="hasMore" class="mt-6 flex justify-center">
          <button
            type="button"
            :disabled="isLoading"
            class="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-6 py-3 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            @click="loadMore"
          >
            <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin" aria-hidden="true" />
            <ChevronDown v-else class="h-4 w-4" aria-hidden="true" />
            {{ isLoading ? t('settings.listings.loading') : t('settings.listings.loadMore') }}
          </button>
        </div>
      </div>
    </template>

    <ListingFormDrawer
      v-model="showFormDrawer"
      :listing-id="editingListingId"
      @created="handleListingCreated"
      @updated="handleListingUpdated"
      @deleted="handleListingDeleted"
    />

    <ListingAnalyticsModal
      :show="showAnalyticsModal"
      :listing="selectedListingForAnalytics"
      @close="showAnalyticsModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  LayoutList,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
} from 'lucide-vue-next'
import { ListingFormDrawer } from '@/components/services'
import ManagedListingCard from './listings/ManagedListingCard.vue'
import ListingAnalyticsModal from './listings/ListingAnalyticsModal.vue'
import { serviceCategoriesService, serviceListingsService } from '@/services/api'
import { useVendorProfile } from '@/composables/settings/useVendorProfile'
import { useToast } from '@/composables/useToast'
import type { ServiceCategory, ServiceListing } from '@/services/api/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { showSuccess, showError } = useToast()

const { vendorState, loadError, loadProfile } = useVendorProfile({ autoLoad: false })
const isVerifiedVendor = computed(() => vendorState.value === 'verified')

const categories = ref<ServiceCategory[]>([])

const listings = ref<ServiceListing[]>([])
const totalCount = ref(0)
const isLoading = ref(false)
const hasLoadedOnce = ref(false)
const error = ref<string | null>(null)
const hasMore = ref(false)
const currentPage = ref(1)

const showFormDrawer = ref(false)
const editingListingId = ref<string | null>(null)
const isSubmitting = ref<string | null>(null)

const showAnalyticsModal = ref(false)
const selectedListingForAnalytics = ref<ServiceListing | null>(null)

/**
 * 24 rather than 20: the grid is three-up from `lg`, so a page that divides by
 * three ends on a full row instead of leaving two cards and a hole above the
 * load-more button.
 */
const PAGE_SIZE = 24

/**
 * The profile decides which state this tab is in, so nothing else can render
 * until it lands — and a verified vendor's first page of listings is part of
 * the same arrival, or the grid would pop in under a finished heading.
 */
const isBootstrapping = computed(
  () => vendorState.value === 'loading' || (isVerifiedVendor.value && !hasLoadedOnce.value),
)

/**
 * Whichever fetch failed, in the order the tab depends on them: without the
 * profile there is no way to know which state to render at all, so its failure
 * outranks a listings failure and is the one the retry re-attempts.
 */
const loadFailure = computed(() => {
  if (vendorState.value === 'error') return loadError.value
  if (error.value && listings.value.length === 0) return error.value
  return null
})

const retry = async () => {
  if (vendorState.value === 'error') {
    await loadProfile(true)
    if (isVerifiedVendor.value) {
      await Promise.all([loadCategories(), loadListings()])
    }
    return
  }
  await loadListings()
}

const activeCount = computed(() => listings.value.filter((l) => l.status === 'approved').length)
const pendingCount = computed(
  () => listings.value.filter((l) => l.status === 'pending_review').length,
)
const draftCount = computed(() => listings.value.filter((l) => l.status === 'draft').length)
const attentionCount = computed(
  () => listings.value.filter((l) => l.status === 'rejected' || l.status === 'suspended').length,
)

/**
 * What is in this tab, in one line. Empty until there is something to count —
 * with no listings the generic subtitle is the only thing that can be said, and
 * the empty state below repeats none of it.
 */
const headerLine = computed(() => {
  if (listings.value.length === 0) return t('settings.listings.subtitle')

  const parts = [t('settings.listings.summary.count', { count: totalCount.value })]

  // Only once the whole list is in hand — see the header's comment.
  if (!hasMore.value) {
    if (activeCount.value > 0)
      parts.push(t('settings.listings.summary.live', { count: activeCount.value }))
    if (pendingCount.value > 0)
      parts.push(t('settings.listings.summary.inReview', { count: pendingCount.value }))
    if (draftCount.value > 0)
      parts.push(t('settings.listings.summary.draft', { count: draftCount.value }))
    if (attentionCount.value > 0)
      parts.push(t('settings.listings.summary.needsAttention', { count: attentionCount.value }))
  }

  return parts.join(' · ')
})

const vendorStatusLabel = computed(() => {
  if (vendorState.value === 'pending') return t('settings.listings.verification.pendingReview')
  if (vendorState.value === 'not_vendor') return t('settings.listings.verification.notVendor')
  return t('settings.listings.verification.unverified')
})

const goToVendorTab = () => {
  router.replace({ query: { ...route.query, tab: 'vendor' } })
}

/**
 * The listing's category name, however the endpoint chose to send it. The full
 * serializer nests `category_details`, the brief one flattens `category_name`,
 * and a payload that carries only the numeric id is resolved from the category
 * list fetched alongside.
 */
const getCategoryName = (listing: ServiceListing): string => {
  if (listing.category_details?.name) return listing.category_details.name

  const flattened = listing as ServiceListing & { category_name?: string }
  if (flattened.category_name) return flattened.category_name

  if (listing.category != null && categories.value.length > 0) {
    const id = String(listing.category)
    const match = categories.value.find((c) => String(c.id) === id)
    if (match) return match.name
  }

  return t('settings.listings.uncategorized')
}

const loadCategories = async () => {
  try {
    const response = await serviceCategoriesService.listCategories()
    if (response.success && response.data) {
      const flatten = (cats: ServiceCategory[]): ServiceCategory[] => {
        const result: ServiceCategory[] = []
        for (const cat of cats) {
          result.push(cat)
          if (cat.subcategories?.length) result.push(...flatten(cat.subcategories))
        }
        return result
      }
      categories.value = flatten(response.data.results)
    }
  } catch (err) {
    console.error('Error loading service categories:', err)
  }
}

/**
 * Fill in listings the list endpoint answered with the *brief* serializer.
 *
 * `GET /api/services/listings/` is typed here as returning full listings, but
 * it can answer with the browse shape — which carries no `status`, no
 * `admin_notes` and no `contact_clicks_count`. A management grid cannot work
 * without those: with `status` undefined every card reads as "not a draft", so
 * a freshly created listing showed its Submit button until the first reload and
 * never again, and a rejected listing could never show why.
 *
 * So anything that came back without a status is re-read in full. This is a
 * shim, not a design — it costs one request per listing on the page, and it
 * stops running by itself the moment the endpoint includes the field. See
 * docs/backend-api-requirements/listing-owner-list-status.md.
 */
const hydrateBriefListings = async (page: ServiceListing[]): Promise<ServiceListing[]> => {
  const brief = page.filter((listing) => listing.status === undefined)
  if (brief.length === 0) return page

  const details = await Promise.all(
    brief.map(async (listing) => {
      try {
        const response = await serviceListingsService.getListing(listing.id)
        return response.success && response.data ? response.data : null
      } catch {
        return null
      }
    }),
  )

  const byId = new Map(details.filter((d): d is ServiceListing => !!d).map((d) => [d.id, d]))
  // Merged rather than swapped: the list row is the one that carried
  // `category_name`, which the detail payload spells differently.
  return page.map((listing) => {
    const full = byId.get(listing.id)
    return full ? { ...listing, ...full } : listing
  })
}

const loadListings = async (page = 1) => {
  isLoading.value = true
  error.value = null

  try {
    const response = await serviceListingsService.getMyListings({ page, page_size: PAGE_SIZE })

    if (response.success && response.data) {
      const results = await hydrateBriefListings(response.data.results)
      listings.value = page === 1 ? results : [...listings.value, ...results]
      totalCount.value = response.data.count ?? listings.value.length
      hasMore.value = !!response.data.next
      currentPage.value = page
    } else {
      error.value = response.message || t('settings.listings.messages.loadFailed')
    }
  } catch (err) {
    error.value = (err as Error)?.message || t('settings.listings.messages.unexpectedError')
    console.error('Error loading listings:', err)
  } finally {
    isLoading.value = false
    hasLoadedOnce.value = true
  }
}

const loadMore = () => {
  if (hasMore.value && !isLoading.value) loadListings(currentPage.value + 1)
}

const openCreateDrawer = () => {
  editingListingId.value = null
  showFormDrawer.value = true
}

const editListing = (listing: ServiceListing) => {
  editingListingId.value = listing.id
  showFormDrawer.value = true
}

const openAnalytics = (listing: ServiceListing) => {
  selectedListingForAnalytics.value = listing
  showAnalyticsModal.value = true
}

const submitForReview = async (listing: ServiceListing) => {
  isSubmitting.value = listing.id
  try {
    const response = await serviceListingsService.submitForReview(listing.id)

    if (response.success && response.data) {
      const index = listings.value.findIndex((l) => l.id === listing.id)
      // Merged over the row we already have rather than swapped for it: the
      // endpoint's payload is the one the card is rebuilt from, and anything it
      // leaves out — a field only the list carries, a field only the detail
      // serializer carries — would otherwise blank out on screen.
      if (index !== -1) listings.value[index] = { ...listings.value[index], ...response.data }
      showSuccess(t('settings.listings.messages.submitSuccess'))
    } else {
      showError(response.message || t('settings.listings.messages.submitFailed'))
    }
  } catch (err) {
    showError((err as Error)?.message || t('settings.listings.messages.submitFailed'))
  } finally {
    isSubmitting.value = null
  }
}

// The drawer raises its own save confirmation — see its note on why the message
// belongs next to the button that produced it.
const handleListingCreated = (listing: ServiceListing) => {
  listings.value.unshift(listing)
  totalCount.value += 1
}

const handleListingUpdated = (listing: ServiceListing) => {
  const index = listings.value.findIndex((l) => l.id === listing.id)
  // Merged for the same reason `submitForReview` is — see the note there.
  if (index !== -1) listings.value[index] = { ...listings.value[index], ...listing }
}

const handleListingDeleted = (listingId: string) => {
  listings.value = listings.value.filter((l) => l.id !== listingId)
  totalCount.value = Math.max(0, totalCount.value - 1)
}

onMounted(async () => {
  await loadProfile()
  if (isVerifiedVendor.value) {
    await Promise.all([loadCategories(), loadListings()])
  }
})
</script>
