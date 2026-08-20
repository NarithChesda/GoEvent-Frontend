<template>
  <!--
    One listing in the services catalogue, in two shapes.

    Below `sm` the grid is a single column, and the poster card below was a
    desktop card at phone width: its 1.9:1 cover, ~110px tall in the 3-up
    desktop grid, stretched to 200px full-bleed — 60% of a 326px card, so barely
    one listing fit on screen and twenty of them made a 7,000px scroll. Worse,
    most listings have no cover of their own, so that 200px was a category stock
    photo repeating verbatim down the page. So on a phone this renders as a
    compact row instead: a 96px thumbnail, and title/vendor/price stacked beside
    it in one scannable column. ~120px tall, five to a screen.

    From `sm` up the grid goes 2- then 3-up, each card is ~300px wide, and the
    poster is right again — so it is kept as-is. Same data, same order of
    importance, different geometry; see §13 of the design skill on layouts that
    legitimately differ between mobile and desktop.
  -->
  <div
    @click="$emit('click', listing)"
    @keydown.enter="$emit('click', listing)"
    tabindex="0"
    role="article"
    :aria-label="listing.title"
    class="group relative bg-white rounded-2xl border border-slate-200/60 hover:border-slate-300/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/40 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
  >
    <!-- ============================ MOBILE ROW ============================ -->
    <div
      class="relative flex sm:hidden gap-3 p-3 active:bg-slate-50 transition-colors duration-150"
    >
      <!-- Thumbnail. Square rather than the poster's 1.9:1: at this size a wide
           crop leaves a letterbox beside a two-line title, and a square is what
           lets the row stay as short as its content. -->
      <div class="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
        <img
          v-if="hasCover"
          :src="listing.coverImage"
          :alt="listing.title"
          loading="lazy"
          class="w-full h-full object-cover"
          @error="hasCoverError = true"
        />
        <ServiceThumbArt v-else :category="listing.category" />

        <!-- Featured, tied across the image's top-left corner. It rides the
             artwork instead of taking a slot in the text column, which is the
             row's scarcest resource — and a ribbon carries the "singled out"
             read that a chip in a list of chips cannot. Clipped by the
             thumbnail's own rounded overflow, so the band's overhanging tails
             disappear into the corner rather than escaping the card. -->
        <div v-if="listing.isFeatured" class="featured-ribbon" aria-hidden="true">
          <span class="featured-ribbon-band">{{ t('services.card.featured') }}</span>
        </div>
      </div>

      <!-- Body. Centred against the thumbnail rather than stretched to it: the
           thumbnail is the taller element whenever a title fits on one line, and
           pinning the meta line to the bottom edge then opened a ~40px void
           through the middle of the row. -->
      <div class="flex-1 min-w-0 flex flex-col justify-center">
        <!-- pr-5 reserves the corner the verified mark sits in, so a two-line
             title never runs underneath it -->
        <h3 class="text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2 pr-5">
          {{ listing.title }}
        </h3>

        <!-- Vendor line. Nothing flanks the name any more: the featured ribbon
             moved onto the thumbnail and the verified mark to the row's corner,
             which hands this line its full width back — it is the one field here
             that is a proper noun and cannot be abbreviated gracefully. -->
        <div class="mt-1 min-w-0">
          <span class="block text-xs text-slate-500 truncate">{{ listing.vendorName }}</span>
        </div>

        <!-- Meta line. Price leads it — it is what the visitor is comparing, and
             on the poster it was the smallest thing on the card, floating on the
             photo away from the title. A quote-only listing is muted: at the same
             weight as a real figure, "Contact for pricing" reads as a price until
             you've actually read it. The category trails as the row's least
             important field, and yields width to the price rather than the other
             way round — it is also the one thing the thumbnail's category mark
             already says, so an ellipsis on the two longest names costs little. -->
        <div class="flex items-end justify-between gap-2 mt-2">
          <span
            class="text-[13px] truncate flex-shrink-0 max-w-[60%]"
            :class="
              listing.priceType === 'quote'
                ? 'text-slate-500 font-medium'
                : 'text-slate-900 font-semibold'
            "
          >
            {{ listing.priceDisplay }}
          </span>
          <span class="text-[11px] text-slate-500 truncate min-w-0">
            {{ translateServiceCategory(listing.category) }}
          </span>
        </div>
      </div>

      <!-- Verified, parked in the row's top-right corner rather than trailing
           the vendor name. Inline it cost the name ~20px of an already tight
           line and pushed a long business name into an ellipsis sooner; here it
           costs only padding on the title, which has two lines to give. -->
      <BadgeCheck
        v-if="listing.vendorVerified"
        class="absolute top-3 right-3 w-4 h-4 text-[#2ecc71]"
        role="img"
        :aria-label="t('services.vendors.verified')"
      />
    </div>

    <!-- =========================== DESKTOP POSTER ========================= -->
    <div class="hidden sm:flex flex-col h-full">
      <!-- Cover Image. Keeps the category stock photo as its fallback, where the
           mobile row shows branded category art instead. Not an inconsistency
           for its own sake: at 96px a borrowed photo is an unreadable crop and
           two listings in a category get byte-identical ones, so the tile wins;
           at ~300px across a 3-up grid the same tile repeated nine times reads
           as one flat gradient wall, and the photo wins. Swap this for
           `<ServiceThumbArt>` if the poster should match the row. -->
      <div class="aspect-[1.9/1] relative overflow-hidden bg-slate-100">
        <img
          :src="posterImageSrc"
          :alt="listing.title"
          loading="lazy"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          @error="handlePosterError"
        />
        <!-- Bottom scrim for price legibility -->
        <div
          class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/40 to-transparent"
          aria-hidden="true"
        ></div>

        <!-- Featured Badge -->
        <div v-if="listing.isFeatured" class="absolute top-2.5 left-2.5">
          <div class="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-xs font-medium rounded-lg shadow-md">
            <Sparkles class="w-3 h-3" />
            {{ t('services.card.featured') }}
          </div>
        </div>
        <!-- Category Badge -->
        <div class="absolute top-2.5 right-2.5">
          <div class="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium rounded-lg shadow-md">
            {{ translateServiceCategory(listing.category) }}
          </div>
        </div>
        <!-- Price Tag -->
        <div class="absolute bottom-2.5 left-2.5">
          <div class="px-2.5 py-1 bg-white/95 backdrop-blur-sm text-slate-900 text-xs sm:text-sm font-semibold rounded-lg shadow-md">
            {{ listing.priceDisplay }}
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4 sm:p-5 flex flex-col flex-1">
        <!-- Title & Tagline -->
        <h3 class="font-semibold text-slate-900 text-base sm:text-lg mb-1 line-clamp-1 group-hover:text-[#2ecc71] transition-colors">
          {{ listing.title }}
        </h3>
        <p class="text-xs sm:text-sm text-slate-500 line-clamp-2 mb-3">
          {{ listing.tagline }}
        </p>

        <!-- Tags -->
        <div v-if="listing.tags.length > 0" class="flex flex-wrap gap-1.5 mb-3">
          <span
            v-for="tag in listing.tags.slice(0, 3)"
            :key="tag"
            class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] sm:text-xs rounded-full"
          >
            {{ tag }}
          </span>
          <span
            v-if="listing.tags.length > 3"
            class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] sm:text-xs rounded-full"
          >
            +{{ listing.tags.length - 3 }}
          </span>
        </div>

        <!-- Footer: vendor identity + views -->
        <div class="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-slate-100">
          <div class="flex items-center gap-2 min-w-0">
            <img
              :src="vendorLogoSrc"
              :alt="listing.vendorName"
              class="w-6 h-6 rounded-full object-cover border border-slate-200 flex-shrink-0"
              @error="handleVendorLogoError"
            />
            <span class="text-xs text-slate-500 truncate">{{ listing.vendorName }}</span>
            <BadgeCheck
              v-if="listing.vendorVerified"
              class="w-4 h-4 text-[#2ecc71] flex-shrink-0"
              :aria-label="t('services.vendors.verified')"
            />
          </div>
          <span class="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
            <Eye class="w-3.5 h-3.5" />
            {{ listing.views }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Sparkles, BadgeCheck, Eye } from 'lucide-vue-next'
import type { Listing } from './types'
import ServiceThumbArt from './ServiceThumbArt.vue'
import {
  getCategoryFallbackImage,
  getVendorLogoFallback,
} from '@/utils/serviceFallbackImages'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()
const { translateServiceCategory } = useCategoryTranslation()

const props = defineProps<{
  listing: Listing
}>()

defineEmits<{
  click: [listing: Listing]
}>()

/**
 * Whether the mobile row shows a photo at all. A listing with no cover of its
 * own gets branded category art rather than a stock photograph — most listings
 * have no cover, and at thumbnail size a borrowed Unsplash frame is an
 * unreadable crop that also repeats verbatim between listings in a category. A
 * cover that fails to load falls the same way.
 */
const hasCoverError = ref(false)
const hasCover = computed(() => !!props.listing.coverImage && !hasCoverError.value)

// The desktop poster keeps the category stock photo as its fallback — see the
// note on its cover block for why the two surfaces resolve this differently.
const posterImageSrc = ref(
  props.listing.coverImage || getCategoryFallbackImage(props.listing.category),
)

// Vendor logo with fallback support (desktop poster's footer only)
const vendorLogoSrc = ref(props.listing.vendorLogo || getVendorLogoFallback())

// Watch for specific image-related property changes (avoid deep watching entire object)
watch(
  () => [props.listing.coverImage, props.listing.vendorLogo, props.listing.category] as const,
  ([newCoverImage, newVendorLogo, newCategory]) => {
    hasCoverError.value = false
    posterImageSrc.value = newCoverImage || getCategoryFallbackImage(newCategory)
    vendorLogoSrc.value = newVendorLogo || getVendorLogoFallback()
  },
)

// Handle poster cover load error - use category-based fallback
const handlePosterError = (event: Event) => {
  const target = event.target as HTMLImageElement
  const fallback = getCategoryFallbackImage(props.listing.category)
  if (target.src !== fallback) {
    target.src = fallback
  }
}

// Handle vendor logo load error - use default vendor logo
const handleVendorLogoError = (event: Event) => {
  const target = event.target as HTMLImageElement
  const fallback = getVendorLogoFallback()
  if (target.src !== fallback) {
    target.src = fallback
  }
}
</script>

<style scoped>
/*
  Featured ribbon, tied across the mobile thumbnail's top-left corner.

  Geometry is fixed px rather than percentages because the thumbnail is a fixed
  96px square: the band has to sit far enough from the corner that its chord is
  long enough for the word, and near enough that it still reads as a corner tie
  rather than a stripe across the picture. At `top: 15px` the band crosses the
  corner ~28px out, giving a ~56px visible chord — enough for "Featured" at
  8.5px and for the Khmer "លេចធ្លោ", which is shorter still.

  The band is deliberately wider than that chord so both ends overhang; the
  thumbnail's own `overflow-hidden` + `rounded-xl` clips them, which is what
  produces the folded-under look of a real ribbon rather than a floating bar.
*/
.featured-ribbon {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.featured-ribbon-band {
  position: absolute;
  top: 15px;
  left: -30px;
  width: 100px;
  padding: 2.5px 0;
  transform: rotate(-45deg);
  background-image: linear-gradient(to right, #f59e0b, #f97316);
  color: #fff;
  font-size: 8.5px;
  font-weight: 700;
  /* Loose enough for Kantumruy Pro: Khmer stacks diacritics above and below the
     baseline, and at Latin's line-height they graze both edges of the band. */
  line-height: 1.45;
  letter-spacing: 0.02em;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  /* Lifts the band off the artwork under it — without this it reads as painted
     onto the photo rather than laid over it. */
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.35);
}
</style>
