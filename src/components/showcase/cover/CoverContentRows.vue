<template>
  <!-- Two placement models share this markup. `rows` stacks the four blocks as
       flex rows inside one absolutely-positioned container; `free` drops the
       container's own box (inset-0) and gives each block its own centre-anchored
       rectangle from cover_stage_layout.coverElements. Only the wrapper geometry
       differs — every block's contents render identically either way, which is
       what lets the template editor switch modes without a second component. -->
  <div
    class="inner-container-rows absolute"
    :class="isFree ? 'is-free' : 'flex flex-col w-full mx-auto'"
    :style="isFree ? undefined : containerStyle"
  >
    <!-- Event Title Row (hidden when showCoverHeaderText is false) -->
    <div
      v-if="showCoverHeaderText"
      class="content-row-header flex items-center justify-center"
      :class="[{ 'animate-fadeIn': showAnimations }, blockClass]"
      :style="blockStyle('header')"
    >
      <div
        class="header-content-container flex items-center justify-center px-4 w-full"
      >
        <InlineEditableText
          :value="displayTitle"
          :target="{ kind: 'eventText', textType: 'cover_header', field: 'content' }"
          :input-style="{ fontFamily: headerTextStyle.fontFamily, color: headerTextStyle.color }"
        >
          <h1
            class="scaled-header font-regular capitalize khmer-text-fix text-center"
            :class="fx(fontSlot('header'))"
            :style="headerTextStyle"
          >
            <span class="tfx-ink">{{ displayTitle }}</span>
          </h1>
        </InlineEditableText>
      </div>
    </div>

    <!-- Event Logo Row (absorbs the event title row's height when the header is hidden).
         Switched off (showCoverLogo), the row stays and only its contents go:
         rows are placed by stacking, so dropping the row itself would lift the
         invite text and guest name off the spots the cover artwork drew for them. -->
    <div
      class="content-row-logo flex items-center justify-center"
      :class="[{ 'animate-fadeIn animation-delay-200': showAnimations }, blockClass]"
      :style="blockStyle('logo')"
    >
      <div v-if="showCoverLogo" class="flex items-center justify-center h-full w-full px-4 cover-logo-wrapper">
        <!-- The logo: the event's own, else the template's sample logo, else a
             recoloured placeholder. With the header hidden the row is the
             header's height as well as its own, and the logo may grow to fill it.
             (The photo frame that used to be stacked here is a block of its
             own now — CoverPhotoFrame.) -->
        <EditableRegion
          :intent="{ kind: 'eventLogo' }"
          class="h-full w-full flex items-center justify-center"
        >
        <div
          v-if="fillsRow"
          class="logo-fill"
          :style="logoFillStyle"
        >
          <img
            v-if="resolvedBaseLogoSrc"
            :src="resolvedBaseLogoSrc"
            :alt="eventTitle + ' logo'"
            class="logo-fill__image"
            fetchpriority="high"
            v-bind="protectionAttrs"
          />
          <div
            v-else
            class="fallback-logo-container"
            :style="fallbackLogoStyle"
          >
            <div class="fallback-logo" v-html="processedFallbackLogo" />
          </div>
        </div>
        <img
          v-else-if="resolvedBaseLogoSrc"
          :src="resolvedBaseLogoSrc"
          :alt="eventTitle + ' logo'"
          class="scaled-logo mx-auto"
          fetchpriority="high"
          v-bind="protectionAttrs"
        />
        <div
          v-else
          class="fallback-logo-container"
          :style="fallbackLogoStyle"
        >
          <div class="fallback-logo" v-html="processedFallbackLogo" />
        </div>
        </EditableRegion>
      </div>
    </div>

    <!-- Invite Text Row. Kept when showCoverInviteText is off, for the logo row's
         reason: removing it would lift the guest name into its place. -->
    <div
      v-if="guestName"
      class="content-row-invite flex items-center justify-center"
      :class="[{ 'animate-fadeIn animation-delay-400': showAnimations }, blockClass]"
      :style="{ ...blockStyle('invite'), overflow: 'visible' }"
    >
      <div
        v-if="showCoverInviteText"
        class="invite-content-container flex items-center justify-center px-4 w-full"
        style="height: 60%"
      >
        <InlineEditableText
          :value="displayInviteText"
          :target="{ kind: 'eventText', textType: 'invite_text', field: 'content' }"
          :input-style="{ fontFamily: inviteTextStyle.fontFamily, color: inviteTextStyle.color }"
        >
          <p
            class="scaled-invite-text khmer-text-fix text-center"
            :class="fx(fontSlot('invite'))"
            :style="inviteTextStyle"
          >
            <span class="tfx-ink">{{ displayInviteText }}</span>
          </p>
        </InlineEditableText>
      </div>
    </div>

    <!-- Guest Name Row. Switched off (showCoverGuestName), the row stays and
         only the name goes, for the logo row's reason. -->
    <div
      v-if="guestName"
      ref="guestContainerRef"
      class="content-row-guest flex items-center justify-center"
      :class="blockClass"
      :style="{ ...blockStyle('guest'), overflow: 'visible', zIndex: 100 }"
    >
      <div v-if="showCoverGuestName" class="guest-content-container flex items-center justify-center px-4 w-full">
        <GuestNameFrame
          ref="guestNameFrameRef"
          :guest-name="guestName || ''"
          :primary-color="primaryColor"
          :guestname-color="guestnameColor"
          :primary-font="primaryFont"
          :current-font="currentFont"
          :get-media-url="getMediaUrl"
          :display-liquid-glass="displayLiquidGlass"
          :guest-title-frame-left="guestTitleFrameLeft"
          :guest-title-frame-mid="guestTitleFrameMid"
          :guest-title-frame-right="guestTitleFrameRight"
          :guest-frame="guestFrame"
          :max-width-px="guestNameMaxWidthPx"
          :font-slot="fontSlot('guest')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { translateRSVP, type SupportedLanguage } from '@/utils/translations'
import { useAssetProtection } from '@/composables/showcase/useAssetProtection'
import GuestNameFrame from './GuestNameFrame.vue'
import InlineEditableText from '@/components/showcase-preview/edit/InlineEditableText.vue'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import type {
  CoverElementId,
  CoverFontSlot,
  CoverLayoutMode,
  CoverRowElementId,
  GuestFrameConfig,
} from '@/services/api/types/template.types'
import { COVER_ELEMENT_DEFAULT_FONT_SLOTS } from '@/composables/showcase/useCoverStageLayout'
import { useTextEffect } from '@/composables/showcase/useTextEffects'
import fallbackLogoSvg from '@/assets/temp-showcase-logo.svg?raw'

interface RowStyles {
  eventTitle: { height: string }
  logo: { height: string }
  inviteText: { height: string }
  guestName: { height: string }
}

interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  eventTitle: string
  eventLogo?: string | null
  /**
   * The template's sample logo, drawn while the event has no logo of its own.
   * The caller passes null while the photo frame is using it as artwork.
   */
  sampleLogoOne?: string | null
  /** Render the cover text header row. When false, the event title row collapses and the logo fills the merged row. */
  showCoverHeaderText?: boolean
  /** Draw the logo. When false the row keeps its space and renders empty, so no other block moves. */
  showCoverLogo?: boolean
  /** Draw the invite text above the guest name. When false its row keeps its space, like the logo's. */
  showCoverInviteText?: boolean
  /** Draw the guest's name. When false its row keeps its space, like the logo's. */
  showCoverGuestName?: boolean
  guestName?: string | null
  primaryColor: string
  secondaryColor?: string | null
  guestnameColor?: string | null
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  containerStyle: { top: string; height: string }
  rowStyles: RowStyles
  /** `free` places each block from `elementStyles` instead of stacking rows. */
  layoutMode?: CoverLayoutMode
  /** Centre-anchored box per block, resolved by useCoverStageLayout. */
  elementStyles?: Record<CoverElementId, Record<string, string>>
  /**
   * The font slot each block renders in (useCoverStageLayout's
   * `elementFontSlots`), for its metallic finish. Absent = every block's default.
   */
  elementFontSlots?: Record<CoverElementId, CoverFontSlot>
  getMediaUrl: (url: string) => string
  displayLiquidGlass?: boolean
  guestTitleFrameLeft?: string | null
  guestTitleFrameMid?: string | null
  guestTitleFrameRight?: string | null
  /** Which frame style wraps the guest name, and how. Unset = the 3-piece split frame. */
  guestFrame?: GuestFrameConfig | null
  /** Max width of the guest name as % of the row container (default: 60) */
  guestNameMaxWidthPercent?: number
  /** Show fade-in animations (for decoration mode) */
  showAnimations?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAnimations: false,
  displayLiquidGlass: true,
  guestNameMaxWidthPercent: 60,
  showCoverHeaderText: true,
  // Explicit, because an absent optional boolean prop casts to false.
  showCoverLogo: true,
  showCoverInviteText: true,
  showCoverGuestName: true,
  layoutMode: 'rows',
})

const isFree = computed(() => props.layoutMode === 'free' && !!props.elementStyles)

// Metallic lettering follows the block's font slot, so a free block pointed at
// a different slot takes that slot's finish along with its typeface.
const fx = useTextEffect()
const fontSlot = (id: CoverElementId): CoverFontSlot =>
  props.elementFontSlots?.[id] ?? COVER_ELEMENT_DEFAULT_FONT_SLOTS[id]

// One extra class, applied to all four blocks, carrying the absolute
// centre-anchored positioning that free mode needs. Empty in rows mode so the
// flex-column stacking is untouched.
const blockClass = computed(() => (isFree.value ? 'cover-free-block' : ''))

const ROW_STYLE_KEYS: Record<CoverRowElementId, keyof RowStyles> = {
  header: 'eventTitle',
  logo: 'logo',
  invite: 'inviteText',
  guest: 'guestName',
}

/** Wrapper geometry for one block, in whichever model is active. */
const blockStyle = (id: CoverRowElementId): Record<string, string> =>
  isFree.value ? props.elementStyles![id] : props.rowStyles[ROW_STYLE_KEYS[id]]

// With the header hidden, the logo row carries the header's height too, and the
// logo is laid out in a box of its own shape that fills the row — the merged
// row exists to give it that room.
const fillsRow = computed(() => !props.showCoverHeaderText)

// The event's own logo (event.logo_one at the call site), else the template's
// sample logo. Null means neither, which draws the recoloured placeholder SVG.
const resolvedBaseLogoSrc = computed(() => {
  if (props.eventLogo) return props.getMediaUrl(props.eventLogo)
  if (props.sampleLogoOne) return props.getMediaUrl(props.sampleLogoOne)
  return null
})

// The logo's natural aspect ratio, so the filling box takes the logo's shape
// and grows until one side meets the row. The inline SVG placeholder can't be
// measured via Image(); it falls back to 1, which matches its square viewBox.
const baseLogoAspect = ref<number | null>(null)
watch(
  // A logo drawn at its natural size needs no measuring, and a hidden one is
  // never laid out — measuring either would only mean downloading it early.
  () => (props.showCoverLogo && fillsRow.value ? resolvedBaseLogoSrc.value : null),
  (url, _prev, onCleanup) => {
    baseLogoAspect.value = null
    if (!url || typeof window === 'undefined') return
    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (cancelled) return
      if (img.naturalWidth && img.naturalHeight) {
        baseLogoAspect.value = img.naturalWidth / img.naturalHeight
      }
    }
    img.src = url
  },
  { immediate: true },
)

// --logo-aspect drives both aspect-ratio and the width formula on the box.
const logoFillStyle = computed<Record<string, string>>(() => ({
  '--logo-aspect': `${baseLogoAspect.value ?? 1}`,
}))

const { protectionAttrs } = useAssetProtection()

// Refs for guest name sizing (pixel max-width derived from container width)
const guestContainerRef = ref<HTMLElement | null>(null)
const guestNameFrameRef = ref<InstanceType<typeof GuestNameFrame> | null>(null)
const guestNameMaxWidthPx = ref<number | null>(null)

// Text content helpers
const getTextContent = (textType: string, fallback = ''): string => {
  if (props.eventTexts && props.currentLanguage) {
    const text = props.eventTexts.find(
      (t) => t.text_type === textType && t.language === props.currentLanguage,
    )
    if (text?.content) {
      return text.content
    }
  }

  const currentLang = (props.currentLanguage as SupportedLanguage) || 'en'
  if (textType === 'invite_text') {
    return translateRSVP('invite_text', currentLang)
  }

  return fallback
}

// Cover header from event texts.
//
// The language filter is load-bearing. On a first load the showcase response
// only carries the requested language's texts, so an unfiltered `find` happened
// to be right — but a language switch MERGES the new language's texts over the
// old ones (see updateLanguageContent), leaving every language in this array at
// once, previous languages first. Without the filter the header then locks onto
// whichever language was loaded first and lags a switch behind the invite text
// below, which has always filtered.
const coverHeader = computed(() => getTextContent('cover_header'))

// Display title (cover header or event title)
const displayTitle = computed(() => coverHeader.value || props.eventTitle)

// Invite text
const displayInviteText = computed(() => getTextContent('invite_text', "You're Invited"))

// Header / invite text styles.
//
// `--cover-block-font` and `--cover-block-color` are set on the block's own
// wrapper by coverElementStyle, but ONLY when that block picked a font or
// colour slot in free placement. Writing each rule as `var(<slot>, <the value
// this block has always used>)` is what makes the feature additive: rows mode
// and every free block that didn't opt in never define the variable, so the
// fallback — the original expression, unchanged — is what renders.
const headerTextStyle = computed(() => ({
  fontFamily: `var(--cover-block-font, ${props.primaryFont || props.currentFont})`,
  color: `var(--cover-block-color, ${props.primaryColor})`,
  whiteSpace: 'pre-line' as const,
}))

const inviteTextStyle = computed(() => ({
  color: `var(--cover-block-color, ${props.primaryColor || props.secondaryColor || 'rgba(255, 255, 255, 0.9)'})`,
  fontFamily: `var(--cover-block-font, ${props.secondaryFont || props.currentFont})`,
  textShadow: 'none',
}))

// Process fallback logo SVG
const processedFallbackLogo = computed(() => {
  return fallbackLogoSvg.replace(/<path /g, '<path fill="currentColor" ')
})

// Fallback logo style
const fallbackLogoStyle = computed(() => ({
  color: props.primaryColor,
  filter: `drop-shadow(0 4px 20px ${props.primaryColor}40)`,
}))

// Compute pixel cap on guest name width from container width × configured percent.
// In free mode the row IS the guest box — its width was already set by dragging
// the block's own handles, so capping it a second time by
// guestNameMaxWidthPercent would apply the same constraint twice.
const updateGuestNameMaxWidth = () => {
  if (!guestContainerRef.value) return
  const percent = isFree.value
    ? 100
    : Math.max(1, Math.min(100, props.guestNameMaxWidthPercent ?? 60))
  guestNameMaxWidthPx.value = guestContainerRef.value.offsetWidth * (percent / 100)
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(updateGuestNameMaxWidth)

  if (guestContainerRef.value) {
    resizeObserver = new ResizeObserver(() => updateGuestNameMaxWidth())
    resizeObserver.observe(guestContainerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

// Re-compute max-width when the configured percent changes
watch(() => [props.guestNameMaxWidthPercent, isFree.value], () => {
  nextTick(updateGuestNameMaxWidth)
})
</script>

<style scoped>
/* Import shared cover stage styles */
@import '../cover-stage-styles.css';

/* ---------------------------------------------------------------------------
   Free placement. Each block becomes its own rectangle on the stage;
   left/top/width/height come from cover_stage_layout.coverElements via the
   inline style, so a template's numbers never have to encode "minus half my
   own size" (see coverElementStyle).

   `position: absolute; inset: 0` is spelled out here rather than left to the
   `absolute inset-0` utility classes on the element: the imported
   `.inner-container-rows` rule above sets `position: relative`, and inside a
   scoped stylesheet that carries the scope attribute — which outranks a
   single-class Tailwind utility. Left relative, the container stayed a
   shrink-to-fit flex item of the centring wrapper, every child's percentage
   width resolved against a column barely one glyph wide, and the whole cover
   collapsed into a vertical string of characters.

   Scoped to `.is-free` so the rows model can't be affected by an edit here. */
.inner-container-rows.is-free {
  position: absolute;
  inset: 0;
  display: block;
}

/* The rows lie over the photo frame (drawn beneath them so text laid across a
   photograph stays legible), so they catch pointers only where they draw
   something. Their empty stretches — a whole stage in free mode, a full-width
   row in rows mode — would otherwise sit over the frame and swallow the tap
   that opens its editor in the studio. A tap that reaches nothing here still
   lands on the cover's own open-envelope handler, which is an ancestor. */
.inner-container-rows {
  pointer-events: none;
}

.scaled-header,
.scaled-invite-text,
.cover-logo-wrapper > *,
.guest-content-container > *,
.inner-container-rows :deep(.inline-edit-control),
.inner-container-rows :deep(.edit-region-control) {
  pointer-events: auto;
}

/* left/top already carry the centre-to-corner offset (see coverElementStyle) —
   deliberately NOT a translate, which the fade-in keyframes would overwrite. */
.inner-container-rows.is-free .cover-free-block {
  position: absolute;
}

/* The row model set this inline alongside the row height; free mode replaces
   that inline `position` with `absolute`, so rows mode needs it declared. */
.inner-container-rows:not(.is-free) .content-row-guest {
  position: relative;
}

/* GuestNameFrame keeps itself to 70% of the row it's centred in — sensible for
   a full-bleed row, wrong for a block whose width was set by dragging its own
   handles. Handed over as a variable (which inherits into the child component)
   rather than a cross-component selector. */
.inner-container-rows.is-free .content-row-guest {
  --guest-frame-max-width: 100%;
}

/* Fallback Logo Styles */
.fallback-logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0.5rem;
}

.fallback-logo {
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
}

.fallback-logo:hover {
  transform: scale(1.05);
}

.fallback-logo :deep(svg) {
  display: block;
  width: auto !important;
  height: 100% !important;
  max-width: 90% !important;
  max-height: 100% !important;
  object-fit: contain;
  margin: 0 auto;
}

/* The flex wrapper around the logo becomes a size container so the filling box
   below can derive its width from the wrapper's actual dimensions (including
   px-4 padding already applied to the wrapper). */
.cover-logo-wrapper {
  container-type: size;
}

/* The merged row's logo box — the logo's own shape, as large as the row
   allows. Width is the larger size that fits inside both wrapper-width and
   wrapper-height × aspect; height: auto + aspect-ratio derives the matching
   height so the box stays logo-shaped on portrait phones too. The image in it
   is capped by the box, not stretched to it. */
.logo-fill {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: var(--logo-aspect, 1);
  width: min(100cqw, calc(100cqh * var(--logo-aspect, 1)));
  height: auto;
  max-width: 100%;
  max-height: 100%;
}

.logo-fill__image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

</style>
