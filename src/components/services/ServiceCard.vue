<template>
  <!--
    One listing in the services catalogue, in two shapes.

    Both shapes carry the same fields and rank them the same way: what kind of
    service it is, what it is called, what it costs, who sells it. The phone
    gets that as a row and the desktop as a poster — see §13 of the design skill
    on layouts that legitimately differ between mobile and desktop — and what
    differs between them is only where each field is *placed*, never how much it
    matters.

    Below `sm` the grid is a single column, and the poster card was a desktop
    card at phone width: its 1.9:1 cover, ~110px tall in the 3-up desktop grid,
    stretched to 200px full-bleed — 60% of a 326px card, so barely one listing
    fit on screen and twenty of them made a 7,000px scroll. Worse, most listings
    have no cover of their own, so that 200px was a category stock photo
    repeating verbatim down the page. So on a phone this renders as a compact
    row: a 96px thumbnail, and the four fields stacked beside it in one
    scannable column. ~120px tall, five to a screen.

    ─── What this card deliberately does *not* do ───

    **Two marks ride the artwork, not four.** The cover used to carry a gradient
    Featured pill, a white category pill, a white price pill, and a scrim to
    make that price legible — on an image only ~300px wide. Three cards to a row
    meant nine pills over nine photos, and the page's actual featured object,
    the vendor spotlight above, was outshouted by its own listings. What is left
    is one mark per corner: featured top left, price bottom right. Category went
    down into the body, where type carries it for free, and the scrim went with
    it — each remaining mark is legible on its own background.

    Two is the budget, not a starting point. Anything else a listing might want
    to advertise goes in the body or nowhere.

    **The featured mark is glass, not gradient.** The gradient is the loudest
    asset in the system and its power is entirely relative (taste §2): the
    spotlight's "Featured Vendor" pill is the one gradient object this page can
    afford, and six copies of it in the grid below spend that for nothing —
    especially since, in a curated catalogue, very nearly every listing is
    featured. So the page reads on one rule: gradient marks the page's featured
    object, glass marks a card's own. Same Sparkles glyph in both shapes, a
    labelled pill where there is room and the glyph alone on the thumbnail.

    **Price sits where each shape has room for it.** It is the one field a
    visitor compares across the grid, so it may never truncate and it may never
    be the smallest thing on the card.

    The poster puts it back on the cover, bottom right, opposite the featured
    mark — but as one of *two* glass marks rather than one of four, which is a
    different thing from the pill soup this replaced. What made the old chip
    wrong was its company and its weight, not its corner: it needed a scrim to
    be legible, and it was the same 12px as the category pill beside it. In the
    body it cost a full line in a 3-up grid where vertical space is the scarce
    resource, which is why it moved back out.

    The row has no cover to put it on, so there it stays a type step — semibold
    slate-900 one line above the vendor. That line is free on a phone: the row's
    height is set by the 96px thumbnail beside it, and four lines of this type
    still come in under that.
  -->
  <div
    v-bind="rootAttrs"
    class="group relative overflow-hidden"
    :class="[
      embedded
        ? 'flex-1'
        : 'bg-white rounded-2xl border border-slate-200/60 hover:border-slate-300/80 transition-[border-color,box-shadow] duration-300 hover:shadow-lg hover:shadow-slate-200/40',
      preview
        ? 'select-none'
        : embedded
          ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-inset'
          : 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200',
    ]"
  >
    <!-- ============================ MOBILE ROW ============================ -->
    <div
      class="relative flex sm:hidden gap-3 p-3 active:bg-slate-50 transition-colors duration-150"
    >
      <!-- Thumbnail. Square rather than the poster's 1.9:1: at this size a wide
           crop leaves a letterbox beside a two-line title, and a square is what
           lets the row stay as short as its content. `hideRowCover` drops it
           entirely — see the prop. -->
      <div
        v-if="!hideRowCover"
        class="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100"
      >
        <img
          v-if="hasCover"
          :src="thumbSrc"
          :alt="listing.title"
          loading="lazy"
          class="w-full h-full object-cover"
          @error="hasCoverError = true"
        />
        <ServiceThumbArt v-else :category="listing.category" />

        <!-- Featured, riding the artwork rather than taking a slot in the text
             column — the row's scarcest resource. The glyph carries it alone
             here: at 96px a labelled pill is a third of the thumbnail's width,
             and the word is already on the poster shape for anyone reading the
             grid at a size where it fits. -->
        <span
          v-if="listing.isFeatured"
          class="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-white/95 backdrop-blur-sm shadow-sm ring-1 ring-slate-900/5 flex items-center justify-center"
          role="img"
          :aria-label="t('services.card.featured')"
        >
          <Sparkles class="w-3 h-3 text-slate-900" />
        </span>
      </div>

      <!-- Body. Centred against the thumbnail rather than stretched to it: the
           thumbnail is the taller element whenever a title fits on one line, and
           pinning the meta line to the bottom edge opened a ~40px void through
           the middle of the row. -->
      <div class="flex-1 min-w-0 flex flex-col justify-center">
        <!-- Caption line, matching the poster's. Category leads because it is
             the field that sorts the list as you scroll; the view count trails
             it as the row's least important number and keeps its own width, so
             a long category name yields by ellipsis instead of pushing it off
             the edge. -->
        <div class="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span class="truncate font-medium text-slate-600">
            {{ translateServiceCategory(listing.category) }}
          </span>
          <template v-if="!hideRowViews">
            <span aria-hidden="true">·</span>
            <span
              class="inline-flex items-center gap-0.5 flex-shrink-0"
              role="img"
              :aria-label="t('services.detail.views', { count: listing.views })"
            >
              <Eye class="w-3 h-3" aria-hidden="true" />
              {{ listing.views }}
            </span>
          </template>

          <!-- Anything the host has to state about this listing at the row's top
               edge — the vendor's own grid puts the listing's state here. Empty
               in the catalogue, and display-only wherever it is filled: the row
               is one control, so a real button may not live inside it. -->
          <slot name="rowBadge" />
        </div>

        <h3 class="mt-0.5 text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2">
          {{ listing.title }}
        </h3>

        <!-- Price, then who sells it. The 96px thumbnail is far too small to
             carry the pill the poster puts in its corner, so here the price
             stays in the text column — and on a line of its own. Sharing one
             with the vendor was tempting and wrong: a legitimate price string
             ("Starting from $1,000", longer in Khmer) ate two thirds of the
             column and left real business names as "Virak Films Prod…". The row
             can afford the line, because its height is set by the thumbnail
             beside it and four lines of this type still come in under 96px — so
             it costs nothing a one-line title wasn't already leaving empty.

             A quote-only listing is muted: at the same weight as a real figure,
             "Contact for pricing" reads as a price until you have actually read
             it. The verified mark sits with the name it verifies rather than in
             the row's corner, where it read as a mark on the whole card. -->
        <p
          class="mt-1.5 text-[13px] leading-none"
          :class="
            listing.priceType === 'quote'
              ? 'text-slate-500 font-medium'
              : 'text-slate-900 font-semibold'
          "
        >
          {{ listing.priceDisplay }}
        </p>

        <div v-if="!hideVendor" class="flex items-center gap-1 min-w-0 mt-1.5">
          <span class="text-xs text-slate-500 truncate">{{ listing.vendorName }}</span>
          <BadgeCheck
            v-if="listing.vendorVerified"
            class="w-3.5 h-3.5 text-[#2ecc71] flex-shrink-0"
            role="img"
            :aria-label="t('services.vendors.verified')"
          />
        </div>
      </div>
    </div>

    <!-- =========================== DESKTOP POSTER ========================= -->
    <div class="hidden sm:flex flex-col h-full">
      <!-- Cover. Keeps the category stock photo as its fallback, where the
           mobile row shows branded category art instead. Not an inconsistency
           for its own sake: at 96px a borrowed photo is an unreadable crop and
           two listings in a category get byte-identical ones, so the tile wins;
           at ~300px across a 3-up grid the same tile repeated nine times is a
           wall, and the photo wins. -->
      <div class="aspect-[1.9/1] relative overflow-hidden bg-slate-100">
        <img
          :src="posterSrc"
          :alt="listing.title"
          loading="lazy"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          @error="handlePosterError"
        />

        <!-- The cover's two marks, in opposite corners: what singled this
             listing out, and what it costs. Both glass rather than gradient —
             see the header note — and each carries its own background, which is
             what makes them legible on any photograph and what let the scrim
             under the price go. Deliberately one family, differing only in type
             size, so two marks read as a pair rather than as the start of a
             pile. -->
        <span
          v-if="listing.isFeatured"
          class="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/95 backdrop-blur-sm text-slate-900 text-[11px] font-semibold shadow-sm ring-1 ring-slate-900/5"
        >
          <Sparkles class="w-3 h-3" aria-hidden="true" />
          {{ t('services.card.featured') }}
        </span>

        <!-- Price, bottom right. `max-w-[calc(100%-1.25rem)]` is only a
             backstop: the pill sizes to its text and must never truncate, but a
             pathological string should wrap inside the cover rather than run
             off it. -->
        <span
          class="absolute bottom-2.5 right-2.5 max-w-[calc(100%-1.25rem)] inline-flex items-center px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm text-[13px] shadow-sm ring-1 ring-slate-900/5"
          :class="
            listing.priceType === 'quote'
              ? 'text-slate-500 font-medium'
              : 'text-slate-900 font-semibold'
          "
        >
          {{ listing.priceDisplay }}
        </span>
      </div>

      <!-- Content -->
      <div class="p-4 sm:p-5 flex flex-col flex-1">
        <!-- Caption above the title, not a chip on the photo. Muted and small
             enough to stay under the title in the reading order while still
             sorting the grid visually. -->
        <div class="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1.5">
          <span class="truncate font-medium text-slate-600">
            {{ translateServiceCategory(listing.category) }}
          </span>
          <span aria-hidden="true">·</span>
          <span
            class="inline-flex items-center gap-1 flex-shrink-0"
            role="img"
            :aria-label="t('services.detail.views', { count: listing.views })"
          >
            <Eye class="w-3 h-3" aria-hidden="true" />
            {{ listing.views }}
          </span>
        </div>

        <h3 class="text-base sm:text-lg font-semibold text-slate-900 leading-snug line-clamp-2">
          {{ listing.title }}
        </h3>
        <p class="mt-1 text-sm text-slate-500 line-clamp-2">
          {{ listing.tagline }}
        </p>

        <!-- Who sells it, closing the card. `mt-auto` so every card in a row
             closes on the same line however tall its title ran. -->
        <div
          v-if="!hideVendor"
          class="flex items-center gap-2 min-w-0 mt-auto pt-3 sm:pt-4 border-t border-slate-100"
        >
          <img
            :src="vendorLogoSrc"
            :alt="listing.vendorName"
            loading="lazy"
            class="w-6 h-6 rounded-full object-cover border border-slate-200 flex-shrink-0"
            @error="handleVendorLogoError"
          />
          <span class="text-xs text-slate-500 truncate">{{ listing.vendorName }}</span>
          <BadgeCheck
            v-if="listing.vendorVerified"
            class="w-4 h-4 text-[#2ecc71] flex-shrink-0"
            role="img"
            :aria-label="t('services.vendors.verified')"
          />
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
import { getCategoryFallbackImage, getVendorLogoFallback } from '@/utils/serviceFallbackImages'
import { imagekitUrl } from '@/utils/mediaUrl'
import { useCategoryTranslation } from '@/composables/useCategoryTranslation'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()
const { translateServiceCategory } = useCategoryTranslation()

const props = defineProps<{
  listing: Listing
  /**
   * The host owns the card's chrome. Drops this component's own ground, border,
   * radius and hover lift so it can sit inside a surrounding card without
   * becoming a card-in-card — the vendor's own listings grid does exactly that,
   * hanging a management footer off the bottom of the same object.
   *
   * It also hands over the semantics: an embedded card is one control inside a
   * larger object rather than the object itself, so it announces as the button
   * it has always behaved like instead of nesting an `article` role inside the
   * host's real `<article>`.
   */
  embedded?: boolean
  /**
   * Drop the "who sells it" line. On the catalogue it is the point; in a
   * vendor's own management grid it is their own name on every card.
   */
  hideVendor?: boolean
  /**
   * Drop the phone row's thumbnail, leaving the text column to be inset by the
   * host. For a host that has its own reason to draw the cover — the vendor's
   * management card centres a larger one against the whole card, chrome this
   * component is only part of — and would otherwise be layering a second image
   * over this one. Desktop is unaffected: the poster's cover is this card's own.
   */
  hideRowCover?: boolean
  /**
   * Drop the view count from the phone caption line. For a host that needs that
   * line's right end for a mark of its own — the vendor's management card
   * states the listing's status there — and has somewhere better to put the
   * count: its own action row, in the corner this card has none of. Desktop is
   * unaffected; its caption is not the one under pressure.
   */
  hideRowViews?: boolean
  /**
   * Render the card as an image of itself: no click, no focus stop, nothing
   * announced. The listing form draws one of these above its fields so a vendor
   * is assembling a card they can see rather than answering a questionnaire —
   * and a preview that could be tabbed to or activated would be a control that
   * does nothing.
   *
   * It is hidden from assistive tech on purpose: every value in it is already
   * announced by the field that produced it, one line away.
   */
  preview?: boolean
}>()

const emit = defineEmits<{
  click: [listing: Listing]
}>()

/**
 * Identity, focus and activation in one binding — the three of them move
 * together between the card's modes, and spelling each out as its own bound
 * attribute made four conditionals that could drift apart.
 */
const rootAttrs = computed(() => {
  if (props.preview) return { 'aria-hidden': 'true' as const }

  const activate = () => emit('click', props.listing)

  return {
    tabindex: 0,
    role: props.embedded ? 'button' : 'article',
    'aria-label': props.listing.title,
    onClick: activate,
    onKeydown: (event: KeyboardEvent) => {
      // Space as well as Enter: embedded, this announces as a button, and a
      // button that ignores Space is a button only for mouse users.
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      activate()
    },
  }
})

/**
 * Whether the mobile row shows a photo at all. A listing with no cover of its
 * own gets branded category art rather than a stock photograph — most listings
 * have no cover, and at thumbnail size a borrowed Unsplash frame is an
 * unreadable crop that also repeats verbatim between listings in a category. A
 * cover that fails to load falls the same way.
 */
const hasCoverError = ref(false)
const hasCover = computed(() => !!props.listing.coverImage && !hasCoverError.value)

/**
 * Rendered sources. Both go through ImageKit at roughly 2× their display width
 * (§7 of the design skill) — a grid of twenty listings was pulling twenty
 * full-size masters to fill a 96px square and a ~300px poster.
 */
const thumbSrc = computed(
  () => imagekitUrl(props.listing.coverImage, 'w-224') ?? props.listing.coverImage,
)

// The desktop poster keeps the category stock photo as its fallback — see the
// note on its cover block for why the two surfaces resolve this differently.
// The raw URL is what's held; the transform is applied on the way to the tag,
// so a fallback swap doesn't have to reason about the proxied form.
const posterImageSrc = ref(
  props.listing.coverImage || getCategoryFallbackImage(props.listing.category),
)
const posterSrc = computed(() => imagekitUrl(posterImageSrc.value, 'w-640') ?? posterImageSrc.value)

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

// Handle poster cover load error - use category-based fallback. Assigning the
// source rather than the DOM node's `src` keeps the ImageKit transform applied;
// the guard is also what stops a failing fallback from looping.
const handlePosterError = () => {
  const fallback = getCategoryFallbackImage(props.listing.category)
  if (posterImageSrc.value !== fallback) {
    posterImageSrc.value = fallback
  }
}

// Handle vendor logo load error - use default vendor logo
const handleVendorLogoError = () => {
  const fallback = getVendorLogoFallback()
  if (vendorLogoSrc.value !== fallback) {
    vendorLogoSrc.value = fallback
  }
}
</script>
