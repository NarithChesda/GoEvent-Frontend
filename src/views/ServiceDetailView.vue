<template>
  <!--
    No tab bar here: a listing's bottom edge belongs to the vendor's contact
    actions, and the flat CTA bar stacked on the floating pill read as two
    competing bars. `has-custom-bottom-bar` keeps the inset vars at full
    height, since ServiceMobileCtaBar occupies exactly the band the pill would
    have — so the page pad still clears it.

    The support FAB goes too: it is a Telegram button in Telegram blue, which
    on this page sits a thumb's width above the vendor's own Telegram button in
    the same blue. (It was never actually visible here — the old opaque CTA bar
    covered it — so this only makes that state deliberate.)
  -->
  <MainLayout hide-mobile-tab-bar has-custom-bottom-bar hide-contact-fab>
    <div
      class="min-h-[calc(100vh-5rem)] lg:min-h-[calc(100vh-4rem)] bg-gradient-to-r from-[#2ecc71]/[0.02] via-white/0 to-[#1e90ff]/[0.02]"
    >
      <div
        class="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto sm:px-6 lg:px-8 lg:py-8 pb-6 lg:pb-8"
      >
        <!-- Loading skeleton -->
        <div v-if="isLoading" class="animate-pulse">
          <div class="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[2.2/1] bg-slate-200 lg:rounded-3xl"></div>
          <div class="px-4 sm:px-0 mt-6 lg:grid lg:grid-cols-[1fr_360px] lg:gap-8">
            <div class="space-y-4">
              <div class="h-4 bg-slate-200 rounded w-1/3"></div>
              <div class="h-4 bg-slate-200 rounded w-full"></div>
              <div class="h-4 bg-slate-200 rounded w-5/6"></div>
              <div class="grid grid-cols-3 gap-2 mt-6">
                <div class="aspect-square bg-slate-200 rounded-xl"></div>
                <div class="aspect-square bg-slate-200 rounded-xl"></div>
                <div class="aspect-square bg-slate-200 rounded-xl"></div>
              </div>
            </div>
            <div class="hidden lg:block">
              <div class="h-64 bg-slate-200 rounded-2xl"></div>
            </div>
          </div>
        </div>

        <!-- Not found / error -->
        <div v-else-if="notFound" class="px-4 sm:px-0 pt-6">
          <button
            @click="goBack"
            class="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-2 py-1.5 -mx-2 rounded-lg hover:bg-slate-100/60 transition-colors mb-4"
          >
            <ArrowLeft class="w-4 h-4" />
            {{ t('services.detail.back') }}
          </button>
          <ServicesEmptyState
            variant="error"
            :title="t('services.detail.notFound.title')"
            :description="t('services.detail.notFound.description')"
            :action-label="t('services.detail.notFound.action')"
            :show-action="true"
            @action="router.push({ name: 'services' })"
          />
        </div>

        <!-- Content -->
        <template v-else-if="listing">
          <ServiceDetailHero :listing="listing" @back="goBack" @share="shareListing" />

          <div class="px-4 sm:px-0 mt-6 sm:mt-8 lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:items-start">
            <!-- Main column -->
            <div class="space-y-6 sm:space-y-8 min-w-0">
              <!-- Description. The hero's h1 already titled this page, so an
                   "About This Service" eyebrow above the only prose here
                   separated nothing — the heading is kept for screen readers
                   and dropped visually. Hierarchy comes from the type and
                   slate scales instead: the tagline reads as a lead, the
                   description as body.

                   Tags and service area fold in below as inline metadata.
                   Both are single facts, not chapters, and giving each its own
                   heading was what flattened this column into one texture. -->
              <section>
                <h2 class="sr-only">{{ t('services.detail.about') }}</h2>
                <p v-if="listing.tagline" class="text-base sm:text-lg font-medium text-slate-800 leading-snug mb-2.5">
                  {{ listing.tagline }}
                </p>
                <p class="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                  {{ listing.description }}
                </p>

                <div
                  v-if="listing.serviceArea || listing.tags.length > 0"
                  class="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-2"
                >
                  <span
                    v-if="listing.serviceArea"
                    class="inline-flex min-w-0 items-center gap-1.5 text-sm text-slate-600"
                  >
                    <MapPin class="w-4 h-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                    <span class="truncate">{{ listing.serviceArea }}</span>
                  </span>
                  <span
                    v-if="listing.serviceArea && listing.tags.length > 0"
                    class="text-slate-300"
                    aria-hidden="true"
                    >·</span
                  >
                  <span
                    v-for="tag in listing.tags"
                    :key="tag"
                    class="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full"
                  >
                    {{ tag }}
                  </span>
                </div>
              </section>

              <!-- The work. No label: a wall of the vendor's own photos
                   announces itself, and this is the most persuasive thing on
                   the page. It stays inside the grid column on desktop — the
                   sticky contact sidebar sits alongside it — and keeps its
                   edge-to-edge bleed on phones, where there is no sidebar. -->
              <section v-if="galleryImages.length > 0">
                <h2 class="sr-only">{{ t('services.detail.showcase') }}</h2>
                <div class="-mx-4 sm:mx-0">
                  <ServiceShowcaseCarousel :images="galleryImages" />
                </div>
              </section>

              <!-- More from this vendor -->
              <section v-if="moreFromVendor.length > 0" class="border-t border-slate-100 pt-6">
                <div class="flex items-center justify-between gap-2 mb-4">
                  <!-- The one heading left visible in this column, and a plain
                       one rather than a fourth uppercase eyebrow — it carries
                       real information (whose other work this is). -->
                  <h2 class="truncate text-sm font-semibold text-slate-900">
                    {{ t('services.detail.moreFromVendor', { vendor: listing.vendorName }) }}
                  </h2>
                  <router-link
                    v-if="listing.vendorId"
                    :to="{ name: 'vendor-detail', params: { id: listing.vendorId } }"
                    class="text-sm text-[#2ecc71] hover:text-[#27ae60] font-medium flex-shrink-0"
                  >
                    {{ t('services.detail.viewVendorProfile') }}
                  </router-link>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ServiceCard
                    v-for="item in moreFromVendor"
                    :key="item.id"
                    :listing="item"
                    @click="openListing"
                  />
                </div>
              </section>
            </div>

            <!-- Desktop sticky contact sidebar -->
            <aside class="hidden lg:block sticky top-20">
              <ServiceContactCard :listing="listing" @contact="handleContact" />
            </aside>
          </div>

          <!-- Mobile fixed CTA bar -->
          <ServiceMobileCtaBar :listing="listing" @contact="handleContact" />
        </template>
      </div>

    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, MapPin } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'
import MainLayout from '@/components/MainLayout.vue'
import { ServiceCard, ServicesEmptyState, type Listing } from '@/components/services'
import ServiceDetailHero from '@/components/services/detail/ServiceDetailHero.vue'
import ServiceContactCard from '@/components/services/detail/ServiceContactCard.vue'
import ServiceMobileCtaBar from '@/components/services/detail/ServiceMobileCtaBar.vue'
import ServiceShowcaseCarousel from '@/components/services/detail/ServiceShowcaseCarousel.vue'
import { useServices } from '@/composables/useServices'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { updateMetaTags, resetMetaTags } from '@/utils/metaUtils'
import { getPortfolioPlaceholderImages } from '@/utils/serviceFallbackImages'

const { t } = useAppLanguage()
const route = useRoute()
const router = useRouter()

const {
  selectedListing,
  vendorListings,
  fetchListingDetail,
  fetchVendorListings,
  trackView,
  trackContact,
} = useServices()

const isLoading = ref(true)
const notFound = ref(false)
const { showSuccess } = useToast()

const listing = computed(() => selectedListing.value)

// Visual-testing toggle: listings with no uploaded gallery photos get an
// on-theme placeholder gallery so the display can be previewed.
const galleryImages = computed(() => {
  if (!listing.value) return []
  if (listing.value.gallery.length > 0) return listing.value.gallery
  if (import.meta.env.VITE_SERVICES_PORTFOLIO_PLACEHOLDER === 'true') {
    return getPortfolioPlaceholderImages([listing.value.category])
  }
  return []
})

const moreFromVendor = computed(() =>
  vendorListings.value.filter((l) => l.id !== listing.value?.id).slice(0, 4),
)

const load = async (id: string) => {
  isLoading.value = true
  notFound.value = false
  vendorListings.value = []

  await fetchListingDetail(id)

  if (!selectedListing.value) {
    notFound.value = true
    isLoading.value = false
    return
  }

  isLoading.value = false

  // Fire-and-forget: analytics + related listings
  trackView(id, 'direct')
  applyMeta(selectedListing.value)
  if (selectedListing.value.vendorId) {
    fetchVendorListings(selectedListing.value.vendorId)
  }
}

const applyMeta = (item: Listing) => {
  updateMetaTags({
    title: `${item.title} - GoEvent Services`,
    description: item.tagline || item.description.slice(0, 157),
    image: item.coverImage,
    url: window.location.href,
    type: 'website',
  })
}

const goBack = () => {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push({ name: 'services' })
  }
}

const shareListing = async () => {
  const shareData = {
    title: listing.value?.title || 'GoEvent Service',
    text: listing.value?.tagline || '',
    url: window.location.href,
  }

  if (navigator.share) {
    try {
      await navigator.share(shareData)
      return
    } catch {
      // User cancelled or share failed — fall through to clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(shareData.url)
    showSuccess(t('services.detail.linkCopied'))
  } catch {
    // Clipboard unavailable — nothing else to do
  }
}

const handleContact = (type: string) => {
  if (listing.value) {
    trackContact(listing.value.id, type)
  }
}

const openListing = (item: Listing) => {
  router.push({ name: 'service-detail', params: { id: item.id } })
}

onMounted(() => {
  load(String(route.params.id))
})

// Handle service→service navigation (component instance is reused)
watch(
  () => route.params.id,
  (id) => {
    if (route.name === 'service-detail' && id) {
      load(String(id))
      window.scrollTo({ top: 0 })
    }
  },
)

onUnmounted(() => {
  resetMetaTags()
})
</script>

