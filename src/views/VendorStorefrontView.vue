<template>
  <MainLayout>
    <div
      class="min-h-[calc(100vh-5rem)] lg:min-h-[calc(100vh-4rem)] bg-gradient-to-r from-[#2ecc71]/[0.02] via-white/0 to-[#1e90ff]/[0.02]"
    >
      <div class="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto sm:px-6 lg:px-8 lg:py-8 pb-12">
        <!-- Loading skeleton -->
        <div v-if="isLoading" class="animate-pulse">
          <!-- Matches the tall banner: with cover images in play that is now the common case -->
          <div class="h-48 sm:h-64 lg:h-72 bg-slate-200 lg:rounded-3xl"></div>
          <div class="px-4 sm:px-0">
            <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-slate-300 border-4 border-white -mt-12 sm:-mt-14"></div>
            <div class="h-6 bg-slate-200 rounded w-1/3 mt-4"></div>
            <div class="h-4 bg-slate-200 rounded w-1/2 mt-2"></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              <div class="h-64 bg-slate-200 rounded-2xl"></div>
              <div class="h-64 bg-slate-200 rounded-2xl hidden sm:block"></div>
              <div class="h-64 bg-slate-200 rounded-2xl hidden lg:block"></div>
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
            :title="t('services.vendorDetail.notFound.title')"
            :description="t('services.vendorDetail.notFound.description')"
            :action-label="t('services.vendorDetail.notFound.action')"
            :show-action="true"
            @action="router.push({ name: 'services' })"
          />
        </div>

        <!-- Content -->
        <template v-else-if="vendor">
          <!-- Banner: the vendor's own cover image, else a slideshow of photos
               from their services, else the designed brand cover. Same ladder
               and same height at every rung — a vendor with nothing uploaded
               still gets a storefront header, not a stub. -->
          <div class="relative h-48 sm:h-64 lg:h-72 lg:rounded-3xl overflow-hidden bg-slate-100">
            <VendorHeroSlideshow v-if="bannerImages.length > 0" :images="bannerImages" />
            <Transition name="fade">
              <VendorCoverArt v-if="showCoverArt" :name="vendor.name" :logo="realLogo" />
            </Transition>

            <ServiceHeroActions @back="goBack" @share="shareVendor" />
          </div>

          <!-- Profile header -->
          <div class="px-4 sm:px-0">
            <div class="flex flex-col sm:flex-row sm:items-end sm:gap-5">
              <img
                :src="vendorLogoSrc"
                :alt="vendor.name"
                class="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-lg object-cover bg-white -mt-12 sm:-mt-14 flex-shrink-0"
                @error="handleLogoError"
              />
              <div class="mt-3 sm:mt-0 sm:pb-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 truncate">
                    {{ vendor.name }}
                  </h1>
                  <BadgeCheck
                    class="w-6 h-6 text-[#2ecc71] flex-shrink-0"
                    :aria-label="t('services.vendors.verified')"
                  />
                </div>
                <p v-if="vendor.tagline" class="text-sm sm:text-base text-slate-600 mt-0.5">
                  {{ vendor.tagline }}
                </p>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
                  <span v-if="vendor.city" class="flex items-center gap-1">
                    <MapPin class="w-4 h-4 text-slate-400" />
                    {{ vendor.city }}<template v-if="vendor.country">, {{ vendor.country }}</template>
                  </span>
                  <span class="flex items-center gap-1">
                    <Store class="w-4 h-4 text-slate-400" />
                    {{ t('services.vendors.listingsCount', { count: vendor.listingsCount }, vendor.listingsCount) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Contact CTAs -->
            <div class="flex flex-wrap gap-2.5 mt-5">
              <a
                v-if="vendor.telegramUsername"
                :href="`https://t.me/${vendor.telegramUsername}`"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Send class="w-4 h-4" />
                {{ t('services.detail.telegram') }}
              </a>
              <a
                v-if="vendor.phone"
                :href="`tel:${sanitizedPhone}`"
                class="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Phone class="w-4 h-4" />
                {{ t('services.detail.call') }}
              </a>
              <a
                v-if="vendor.website"
                :href="formattedWebsiteUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
              >
                <Globe class="w-4 h-4" />
                {{ t('services.detail.website') }}
              </a>
              <a
                v-if="vendor.email"
                :href="`mailto:${vendor.email}`"
                class="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
              >
                <Mail class="w-4 h-4" />
                {{ t('services.vendorDetail.email') }}
              </a>
            </div>

            <!-- About -->
            <section v-if="vendor.description" class="mt-8">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {{ t('services.vendorDetail.about') }}
              </h3>
              <p class="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                {{ vendor.description }}
              </p>
            </section>

            <!-- Portfolio: 3D coverflow of the vendor's work photos -->
            <section v-if="portfolio.length > 0" class="mt-8">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {{ t('services.vendorDetail.portfolio') }}
                <span class="text-slate-400 normal-case tracking-normal">· {{ portfolio.length }}</span>
              </h3>
              <div class="-mx-4 sm:mx-0">
                <ServiceShowcaseCarousel :images="portfolio" />
              </div>
            </section>

            <!-- Services -->
            <section class="mt-8">
              <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                {{ t('services.vendorDetail.servicesTitle') }}
                <span class="text-slate-400 normal-case tracking-normal">· {{ listings.length }}</span>
              </h3>

              <div
                v-if="listings.length > 0"
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <ServiceCard
                  v-for="item in listings"
                  :key="item.id"
                  :listing="item"
                  @click="openListing"
                />
              </div>

              <ServicesEmptyState
                v-else
                :title="t('services.emptyState.title')"
                :description="t('services.emptyState.description')"
              />
            </section>
          </div>
        </template>
      </div>

    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  BadgeCheck,
  MapPin,
  Store,
  Send,
  Phone,
  Globe,
  Mail,
} from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import { ServiceCard, ServicesEmptyState, type Listing } from '@/components/services'
import VendorCoverArt from '@/components/services/VendorCoverArt.vue'
import VendorHeroSlideshow from '@/components/services/detail/VendorHeroSlideshow.vue'
import ServiceHeroActions from '@/components/services/detail/ServiceHeroActions.vue'
import ServiceShowcaseCarousel from '@/components/services/detail/ServiceShowcaseCarousel.vue'
import { useServices } from '@/composables/useServices'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useToast } from '@/composables/useToast'
import { updateMetaTags, resetMetaTags } from '@/utils/metaUtils'
import { getVendorLogoFallback } from '@/utils/serviceFallbackImages'

const { t } = useAppLanguage()
const route = useRoute()
const router = useRouter()

const {
  selectedVendor,
  vendorListings,
  vendorPortfolio,
  fetchVendorDetail,
  fetchVendorListings,
  fetchVendorPortfolio,
} = useServices()

const isLoading = ref(true)
const notFound = ref(false)
const { showSuccess } = useToast()

const vendor = computed(() => selectedVendor.value)
const listings = computed(() => vendorListings.value)
const portfolio = computed(() => vendorPortfolio.value)

/**
 * What fills the banner. A vendor who uploaded a cover gets exactly that and
 * nothing else — it is their chosen introduction, and rotating other photos
 * through it would undercut the one frame they picked. Vendors without one
 * keep borrowing their portfolio, which still rotates because no single
 * service photo was ever meant to stand for the whole business.
 */
const bannerImages = computed(() =>
  vendor.value?.coverImage ? [vendor.value.coverImage] : portfolio.value,
)

/** True while the borrowed-photo lookup is still out */
const isPortfolioResolving = ref(false)

/**
 * The brand cover waits until we actually know there is nothing to show. It is
 * a saturated, full-bleed surface, so painting it during the lookup and then
 * swapping to photos a moment later reads as a glitch on the largest element
 * on the page. Vendors with an uploaded cover never wait — that arrives with
 * the vendor itself.
 */
const showCoverArt = computed(() => bannerImages.value.length === 0 && !isPortfolioResolving.value)

const vendorLogoSrc = ref(getVendorLogoFallback())

/**
 * The logo only when it is genuinely the vendor's. The cover art uses it as a
 * colour cast, and the shared stand-in is grey — blooming that over the
 * gradient washes the whole banner out.
 */
const realLogo = computed(() => {
  const logo = vendor.value?.logo
  return logo && logo !== getVendorLogoFallback() ? logo : undefined
})

const sanitizedPhone = computed(() => (vendor.value?.phone || '').replace(/[\s\-()]/g, ''))

const formattedWebsiteUrl = computed(() => {
  const url = vendor.value?.website?.trim()
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url.replace(/^\/+/, '')}`
})

const load = async (id: string) => {
  isLoading.value = true
  notFound.value = false

  await Promise.all([fetchVendorDetail(id), fetchVendorListings(id)])

  if (!selectedVendor.value) {
    notFound.value = true
    isLoading.value = false
    return
  }

  // Non-blocking: portfolio images fade in via the slideshow once loaded
  isPortfolioResolving.value = true
  fetchVendorPortfolio(id).finally(() => {
    isPortfolioResolving.value = false
  })

  vendorLogoSrc.value = selectedVendor.value.logo || getVendorLogoFallback()
  isLoading.value = false

  updateMetaTags({
    title: `${selectedVendor.value.name} - GoEvent Services`,
    description: selectedVendor.value.tagline || selectedVendor.value.description.slice(0, 157),
    // The banner is built to be seen wide; a round logo crops badly in a share card
    image: selectedVendor.value.coverImage || selectedVendor.value.logo,
    url: window.location.href,
    type: 'website',
  })
}

const handleLogoError = (event: Event) => {
  const target = event.target as HTMLImageElement
  const fallback = getVendorLogoFallback()
  if (target.src !== fallback) {
    target.src = fallback
  }
}

const goBack = () => {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push({ name: 'services' })
  }
}

const shareVendor = async () => {
  const shareData = {
    title: vendor.value?.name || 'GoEvent Vendor',
    text: vendor.value?.tagline || '',
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

const openListing = (item: Listing) => {
  router.push({ name: 'service-detail', params: { id: item.id } })
}

onMounted(() => {
  load(String(route.params.id))
})

watch(
  () => route.params.id,
  (id) => {
    if (route.name === 'vendor-detail' && id) {
      load(String(id))
      window.scrollTo({ top: 0 })
    }
  },
)

onUnmounted(() => {
  resetMetaTags()
})
</script>


<style scoped>
/* The brand cover resolves in rather than snapping on once the lookup lands */
.fade-enter-active {
  transition: opacity 0.4s ease-out;
}

.fade-enter-from {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active {
    transition: none;
  }
}
</style>
