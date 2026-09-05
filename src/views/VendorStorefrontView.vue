<template>
  <!--
    No tab bar here: a storefront's bottom edge belongs to the vendor's contact
    actions, and ContactPillBar takes the exact band the tab pill would have.
    `has-custom-bottom-bar` keeps the inset vars at full height, so the page
    still clears it. Same arrangement as the listing page a visitor arrives
    from.

    The support FAB goes too: it is a Telegram button in Telegram blue, which
    on this page would sit a thumb's width above the vendor's own Telegram
    button in the same blue.
  -->
  <MainLayout hide-mobile-tab-bar has-custom-bottom-bar hide-contact-fab>
    <div
      class="min-h-[calc(100vh-5rem)] lg:min-h-[calc(100vh-4rem)]"
    >
      <div class="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto sm:px-6 lg:px-8 lg:py-8 pb-6 lg:pb-8">
        <!-- Loading skeleton. Same frame as the listing page's, because the
             page now opens with the same hero. -->
        <div v-if="isLoading" class="animate-pulse">
          <div class="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[2.2/1] bg-slate-200 lg:rounded-3xl"></div>
          <div class="px-4 sm:px-0 mt-6 sm:mt-8">
            <div class="h-4 bg-slate-200 rounded w-full"></div>
            <div class="h-4 bg-slate-200 rounded w-5/6 mt-2.5"></div>
            <div class="h-10 bg-slate-200 rounded-xl w-40 mt-5"></div>
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
          <!-- The hero carries the identity — mark, name, tagline, location —
               over the artwork, exactly as the listing hero carries a
               service's. The profile strip that used to sit under the banner
               is gone with it. -->
          <VendorStorefrontHero
            :vendor="vendor"
            :portfolio="portfolio"
            :portfolio-pending="isPortfolioResolving"
            @back="goBack"
            @share="shareVendor"
          />

          <div class="px-4 sm:px-0 mt-6 sm:mt-8">
            <!-- Who they are, how to reach them, and the evidence. One block:
                 the whole reason a visitor opened the vendor's page rather
                 than staying on a listing. -->
            <div class="space-y-5">
              <!-- The vendor's own account of themselves, set as prose with no
                   visible heading — the hero named them a moment ago, so an
                   "About" label over the only paragraph on the page separates
                   nothing. Same treatment the listing page gives its
                   description.

                   It leads now rather than closing the page. It used to sit
                   last because a band of the vendor's photographs sat above it
                   and nobody hires a photographer for their bio. That band is
                   gone — every photo in it was a listing's own cover, shown
                   again as a card below — so this is the page's vendor
                   content, and it belongs with the identity. -->
              <section v-if="vendor.description">
                <h2 class="sr-only">{{ t('services.vendorDetail.about') }}</h2>
                <p class="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
                  {{ vendor.description }}
                </p>
              </section>

              <!-- Contact, on desktop. One labelled primary channel, the rest
                   icon-only, and the reason it works: four buttons of equal
                   weight is four buttons of no weight, and the page never says
                   what it wants you to do. Channel order is shared with the
                   listing pages.

                   Phones get the same channels as the floating pill at the
                   bottom of the screen instead, so this row hides below `lg`
                   rather than repeating it a scroll higher. -->
              <div v-if="primaryChannel" class="hidden lg:flex flex-wrap items-center gap-2">
                <a
                  :href="primaryChannel.href"
                  :target="primaryChannel.external ? '_blank' : undefined"
                  :rel="primaryChannel.external ? 'noopener noreferrer' : undefined"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 active:scale-95"
                  :class="primaryChannel.classes"
                >
                  <component :is="primaryChannel.icon" class="w-4 h-4" aria-hidden="true" />
                  <span class="whitespace-nowrap">{{ primaryChannel.label }}</span>
                </a>

                <a
                  v-for="channel in secondaryChannels"
                  :key="channel.key"
                  :href="channel.href"
                  :target="channel.external ? '_blank' : undefined"
                  :rel="channel.external ? 'noopener noreferrer' : undefined"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  :aria-label="channel.label"
                  :title="channel.label"
                >
                  <component :is="channel.icon" class="w-4 h-4" aria-hidden="true" />
                </a>
              </div>

              <!-- Proof. Numbers that already exist — views and enquiries
                   summed across this vendor's listings — promoted out of
                   `text-slate-400` at the foot of a sidebar card into the one
                   place a visitor is deciding whether to trust this vendor.
                   Ratings would belong here too once the API carries them. -->
              <div
                v-if="proofStats.length > 0"
                class="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-4 border-t border-slate-200"
              >
                <span
                  v-for="stat in proofStats"
                  :key="stat.key"
                  class="inline-flex items-baseline gap-1.5 text-sm text-slate-600"
                >
                  <span class="font-semibold text-slate-900 tabular-nums">{{ stat.value }}</span>
                  <span>{{ stat.label }}</span>
                </span>
              </div>
            </div>

            <!-- The work. The cards are the portfolio: the strip that used to
                 run above them showed listing covers, and each card carries
                 its own cover plus the tap that opens the full gallery. The
                 one labelled section on the page, because the label carries
                 information the grid does not. -->
            <section class="mt-8">
              <h2 class="text-sm font-semibold text-slate-900 mb-4">
                {{ t('services.vendorDetail.servicesTitle') }}
                <span class="font-normal text-slate-400">· {{ listings.length }}</span>
              </h2>

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

          <!-- Mobile bottom chrome: the same pill the listing pages wear.
               A vendor who offers no channel at all gets no pill rather than an
               empty one — the page simply keeps the tab bar's band clear. -->
          <ContactPillBar
            v-if="primaryChannel"
            :primary-channel="primaryChannel"
            :secondary-channels="secondaryChannels"
            :region-label="t('services.detail.contactTitle')"
          />
        </template>
      </div>

    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Send, Phone, Globe, Mail } from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import {
  ServiceCard,
  ServicesEmptyState,
  type ContactChannel,
  type Listing,
} from '@/components/services'
import ContactPillBar from '@/components/services/detail/ContactPillBar.vue'
import VendorStorefrontHero from '@/components/services/detail/VendorStorefrontHero.vue'
import { useServices } from '@/composables/useServices'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useToast } from '@/composables/useToast'
import { updateMetaTags, resetMetaTags } from '@/utils/metaUtils'

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

/**
 * Photos borrowed from this vendor's listings. They no longer get a band of
 * their own on the page — the listing cards below already show them — but they
 * still stand in as hero artwork for a vendor who never uploaded a cover.
 */
const portfolio = computed(() => vendorPortfolio.value)

/** True while that borrowed-photo lookup is still out */
const isPortfolioResolving = ref(false)

const sanitizedPhone = computed(() => (vendor.value?.phone || '').replace(/[\s\-()]/g, ''))

const formattedWebsiteUrl = computed(() => {
  const url = vendor.value?.website?.trim()
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url.replace(/^\/+/, '')}`
})

/**
 * The channels this vendor offers, most important first. Same ordering as the
 * listing pages' contact card and mobile bar, so a visitor moving between a
 * listing and its vendor meets the same primary action in both places. The
 * first is the labelled button; the rest become icons.
 *
 * Unlike the listing channels, website and email are always offered rather
 * than only standing in when nothing else exists — a storefront is the page
 * where a visitor goes looking for a vendor's own site.
 */
const contactChannels = computed<ContactChannel[]>(() => {
  const v = vendor.value
  if (!v) return []

  const list: ContactChannel[] = []

  if (v.telegramUsername) {
    list.push({
      key: 'telegram',
      href: `https://t.me/${v.telegramUsername}`,
      external: true,
      label: t('services.detail.telegram'),
      icon: Send,
      classes: 'bg-[#0088cc] hover:bg-[#0077b5] text-white',
    })
  }

  if (v.phone) {
    list.push({
      key: 'phone',
      href: `tel:${sanitizedPhone.value}`,
      external: false,
      label: t('services.detail.call'),
      icon: Phone,
      classes: 'bg-slate-900 hover:bg-slate-800 text-white',
    })
  }

  if (formattedWebsiteUrl.value) {
    list.push({
      key: 'website',
      href: formattedWebsiteUrl.value,
      external: true,
      label: t('services.detail.website'),
      icon: Globe,
      classes: 'bg-slate-900 hover:bg-slate-800 text-white',
    })
  }

  if (v.email) {
    list.push({
      key: 'email',
      href: `mailto:${v.email}`,
      external: false,
      label: t('services.vendorDetail.email'),
      icon: Mail,
      classes: 'bg-slate-900 hover:bg-slate-800 text-white',
    })
  }

  return list
})

const primaryChannel = computed(() => contactChannels.value[0] ?? null)
const secondaryChannels = computed(() => contactChannels.value.slice(1))

/**
 * Popularity counts only persuade above a floor. "3 views" is not weak
 * evidence, it is evidence against — it tells a visitor nobody comes here, and
 * a storefront reads more confident saying nothing than saying that. Below the
 * floor the whole strip is dropped, so a brand-new vendor gets a clean header
 * rather than a bar advertising that they are new.
 *
 * The service count deliberately is not here: it already sits on the Services
 * heading below, and repeating the same fact forty pixels higher was the
 * duplication this strip originally introduced.
 */
const VIEWS_PROOF_FLOOR = 100
const INQUIRIES_PROOF_FLOOR = 10

const proofStats = computed(() => {
  const v = vendor.value
  if (!v) return []

  const stats: { key: string; value: string; label: string }[] = []
  const items = listings.value

  const views = items.reduce((sum, item) => sum + (item.views || 0), 0)
  if (views >= VIEWS_PROOF_FLOOR) {
    stats.push({
      key: 'views',
      value: views.toLocaleString(),
      label: t('services.vendorDetail.viewsLabel', views),
    })
  }

  const inquiries = items.reduce((sum, item) => sum + (item.contactClicks || 0), 0)
  if (inquiries >= INQUIRIES_PROOF_FLOOR) {
    stats.push({
      key: 'inquiries',
      value: inquiries.toLocaleString(),
      label: t('services.vendorDetail.inquiriesLabel', inquiries),
    })
  }

  return stats
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

  // Non-blocking: hero artwork fades in via the slideshow once loaded
  isPortfolioResolving.value = true
  fetchVendorPortfolio(id).finally(() => {
    isPortfolioResolving.value = false
  })

  isLoading.value = false

  updateMetaTags({
    title: `${selectedVendor.value.name} - GoEvent Services`,
    description: selectedVendor.value.tagline || selectedVendor.value.description.slice(0, 157),
    // The hero is built to be seen wide; a round logo crops badly in a share card
    image: selectedVendor.value.coverImage || selectedVendor.value.logo,
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
