<template>
  <!--
    The storefront's opening frame, built as ServiceDetailHero is built: one
    piece of artwork with the identity laid over it, rather than a bare banner
    followed by a profile strip underneath.

    The old split cost a whole band of vertical space to say what the artwork's
    own bottom edge could carry, and it meant a visitor moving between a
    listing and the vendor behind it met two different page openings. Now both
    pages open the same way — same aspect ladder, same scrim, same controls,
    same overlaid block — and the storefront simply names a vendor where the
    listing names a service.
  -->
  <div class="relative overflow-hidden lg:rounded-3xl bg-slate-100">
    <div class="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-[2.2/1]">
      <!-- Artwork ladder: the vendor's own cover, else a slideshow of photos
           borrowed from their services, else the designed brand cover. Same
           frame at every rung — a vendor with nothing uploaded still gets a
           storefront header, not a stub. -->
      <VendorHeroSlideshow v-if="bannerImages.length > 0" :images="bannerImages" />
      <Transition name="fade">
        <VendorCoverArt v-if="showCoverArt" :name="vendor.name" :logo="realLogo" />
      </Transition>

      <!-- Bottom scrim for legibility -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/25 to-transparent"
        aria-hidden="true"
      ></div>

      <ServiceHeroActions @back="$emit('back')" @share="$emit('share')" />

      <!-- Overlaid identity -->
      <div class="absolute bottom-0 inset-x-0 p-4 sm:p-6 lg:p-8">
        <div class="flex items-end gap-3 sm:gap-4">
          <!-- The avatar comes inside the frame rather than straddling its
               edge. Over artwork it needs a rim to separate it, but a thinner
               one than the -mt-12 overlap needed: it is sitting on the scrim
               now, not punching through a boundary. -->
          <VendorAvatar
            :name="vendor.name"
            :logo="vendor.logo"
            size-class="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24"
            class="flex-shrink-0 border-[3px] border-white/85 shadow-lg"
          />

          <div class="min-w-0 flex-1">
            <!-- Where they work, in the slot the listing hero gives the
                 category: the one classifying fact above the name. The service
                 count is deliberately not up here — the Services heading below
                 already carries it, and this is the header that used to say it
                 twice. -->
            <div v-if="location" class="flex flex-wrap items-center gap-2 mb-2">
              <span
                class="inline-flex max-w-full items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium rounded-lg shadow-md"
              >
                <MapPin class="w-3 h-3 flex-shrink-0 text-slate-500" aria-hidden="true" />
                <span class="truncate">{{ location }}</span>
              </span>
            </div>

            <div class="flex items-center gap-2 min-w-0">
              <h1
                class="min-w-0 text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight line-clamp-2 drop-shadow-sm"
              >
                {{ vendor.name }}
              </h1>
              <!-- The verified mark stays attached to the name it verifies,
                   rather than becoming a second labelled pill in the row
                   above. -->
              <BadgeCheck
                class="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 text-[#2ecc71] drop-shadow"
                :aria-label="t('services.vendors.verified')"
              />
            </div>

            <!-- The vendor's own selling line, which used to sit below the
                 fold of the banner. It belongs with the name. -->
            <p
              v-if="vendor.tagline"
              class="mt-1.5 text-sm sm:text-base text-white/85 leading-snug line-clamp-2 drop-shadow-sm"
            >
              {{ vendor.tagline }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BadgeCheck, MapPin } from 'lucide-vue-next'
import type { Vendor } from '../types'
import VendorAvatar from '../VendorAvatar.vue'
import VendorCoverArt from '../VendorCoverArt.vue'
import VendorHeroSlideshow from './VendorHeroSlideshow.vue'
import ServiceHeroActions from './ServiceHeroActions.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { getVendorLogoFallback } from '@/utils/serviceFallbackImages'

const { t } = useAppLanguage()

const props = defineProps<{
  vendor: Vendor
  /** Photos borrowed from this vendor's listings, for vendors with no cover */
  portfolio: string[]
  /** True while that borrowed-photo lookup is still out */
  portfolioPending: boolean
}>()

defineEmits<{
  back: []
  share: []
}>()

/**
 * What fills the frame. A vendor who uploaded a cover gets exactly that and
 * nothing else — it is their chosen introduction, and rotating other photos
 * through it would undercut the one frame they picked. Vendors without one
 * keep borrowing their portfolio, which still rotates because no single
 * service photo was ever meant to stand for the whole business.
 */
const bannerImages = computed(() =>
  props.vendor.coverImage ? [props.vendor.coverImage] : props.portfolio,
)

/**
 * The brand cover waits until we actually know there is nothing to show. It is
 * a saturated, full-bleed surface, so painting it during the lookup and then
 * swapping to photos a moment later reads as a glitch on the largest element
 * on the page. Vendors with an uploaded cover never wait — that arrives with
 * the vendor itself.
 */
const showCoverArt = computed(
  () => bannerImages.value.length === 0 && !props.portfolioPending,
)

/**
 * The logo only when it is genuinely the vendor's. The cover art uses it as a
 * colour cast, and the shared stand-in is grey — blooming that over the
 * gradient washes the whole frame out.
 */
const realLogo = computed(() => {
  const logo = props.vendor.logo
  return logo && logo !== getVendorLogoFallback() ? logo : undefined
})

const location = computed(() => {
  const { city, country } = props.vendor
  return [city, country].filter(Boolean).join(', ')
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
