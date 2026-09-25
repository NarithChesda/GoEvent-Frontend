<template>
  <!-- Wrapper for decorations and content.
       `slotVarStyle` publishes the template's four font families and four
       palette entries as CSS variables here — the highest element that has all
       of them and contains every cover block, including the two rendered inside
       DoorPanel. Free-placed blocks reference these by name (see
       coverElementStyle), which is what lets a partner point a block at a font
       or colour slot without a prop being threaded down for it. -->
  <div class="absolute inset-0" :style="slotVarStyle">
    <!-- DECORATION ANIMATION: Individual decoration images that slide out -->
    <CoverDecorations
      :left-url="coverLeftDecorationUrl"
      :right-url="coverRightDecorationUrl"
      :top-url="coverTopDecorationUrl"
      :bottom-url="coverBottomDecorationUrl"
      :z-indexes="decorationZIndexes"
      :decoration-classes="animationClasses.decorationClasses.value"
      :is-decoration-animation="isDecorationAnimation"
    />

    <!-- Printed-gold lighting on the cover artwork's border. Rendered here only
         for the decoration animation: in door mode each leaf carries its own
         copy (see DoorPanel) so the light travels with the leaf that's holding
         it, exactly as the reference artwork's cover plate does. One instance
         here would keep lighting a border that has already swung away.
         z-27 puts it above the decorations (24/25) but under the cover copy
         (30), so the band is lit and the lettering over it is not. The ambient
         creatures pass over it at 29 — they fly in front of the plate. -->
    <CoverGilding
      v-if="isDecorationAnimation"
      :config="coverGilding"
      :primary-color="primaryColor"
      :secondary-color="secondaryColor"
      :accent-color="accentColor"
      :hidden="isContentHidden"
      :z-index="27"
    />

    <!-- Ambient creature effect (butterflies hovering near decorations) — only
         when template has config.

         z-29 for the same reason the sparks and the falling petals sit above
         the cover: a creature is life in the air IN FRONT of the plate, not
         something printed on it, so it clears the door panels (28) the way they
         do. At 26 — under the doors — a door-animation template painted an
         opaque leaf (its background photo, or the flat background colour) over
         the whole field for the entire time the cover was up, and by the time
         the leaves parted this overlay had unmounted and taken the creatures
         with it: the effect was configurable, billed for, and never once
         visible. It still stays under the cover copy (30) so a butterfly can't
         wander across the guest's name and sit there — unlike a petal, which
         passes through in a second. The tie with the transparent gesture layer
         below (also 29) is harmless: that one is a hit target with no paint,
         and this one is pointer-events-none. -->
    <AmbientEffect
      v-if="ambientCreatures"
      :key="ambientCreaturesKey"
      :config="ambientCreatures"
      :primary-color="primaryColor"
      :accent-color="accentColor"
      :hidden="isContentHidden"
      :z-index="29"
    />

    <!-- DOOR ANIMATION: 3D perspective container for door panels -->
    <div v-if="isDoorAnimation" class="door-perspective-container">
      <!-- Left Door Panel -->
      <DoorPanel
        side="left"
        :is-open="isContentHidden"
        :left-decoration-url="coverLeftDecorationUrl"
        :right-decoration-url="coverRightDecorationUrl"
        :top-decoration-url="coverTopDecorationUrl"
        :bottom-decoration-url="coverBottomDecorationUrl"
        :decoration-z-indexes="decorationZIndexes"
        :event-title="eventTitle"
        :event-logo="eventLogo"
        :sample-logo-one="sampleLogoOne"
        :photo-frame="photoFrame"
        :show-cover-header-text="showCoverHeaderText"
        :show-cover-logo="showCoverLogo"
        :show-cover-invite-text="showCoverInviteText"
        :show-cover-guest-name="showCoverGuestName"
        :guest-name="guestName"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :guestname-color="guestnameColor"
        :current-font="currentFont"
        :primary-font="primaryFont"
        :secondary-font="secondaryFont"
        :event-texts="eventTexts"
        :current-language="currentLanguage"
        :container-style="containerStyle"
        :row-styles="rowStyles"
        :layout-mode="layoutMode"
        :element-styles="elementStyles"
        :element-font-slots="elementFontSlots"
        :get-media-url="getMediaUrl"
        :display-liquid-glass="displayLiquidGlass"
        :guest-title-frame-left="templateAssets?.guest_title_frame_left"
        :guest-title-frame-mid="templateAssets?.guest_title_frame_mid"
        :guest-title-frame-right="templateAssets?.guest_title_frame_right"
        :guest-frame="guestFrame"
        :guest-name-max-width-percent="guestNameMaxWidthPercent"
        :background-color="backgroundColor"
        :background-image-url="doorBackgroundImageUrl"
        :cover-gilding="coverGilding"
        :accent-color="accentColor"
        :detail-blocks="detailBlocks"
      />

      <!-- Right Door Panel -->
      <DoorPanel
        side="right"
        :is-open="isContentHidden"
        :left-decoration-url="coverLeftDecorationUrl"
        :right-decoration-url="coverRightDecorationUrl"
        :top-decoration-url="coverTopDecorationUrl"
        :bottom-decoration-url="coverBottomDecorationUrl"
        :decoration-z-indexes="decorationZIndexes"
        :event-title="eventTitle"
        :event-logo="eventLogo"
        :sample-logo-one="sampleLogoOne"
        :photo-frame="photoFrame"
        :show-cover-header-text="showCoverHeaderText"
        :show-cover-logo="showCoverLogo"
        :show-cover-invite-text="showCoverInviteText"
        :show-cover-guest-name="showCoverGuestName"
        :guest-name="guestName"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :guestname-color="guestnameColor"
        :current-font="currentFont"
        :primary-font="primaryFont"
        :secondary-font="secondaryFont"
        :event-texts="eventTexts"
        :current-language="currentLanguage"
        :container-style="containerStyle"
        :row-styles="rowStyles"
        :layout-mode="layoutMode"
        :element-styles="elementStyles"
        :element-font-slots="elementFontSlots"
        :get-media-url="getMediaUrl"
        :display-liquid-glass="displayLiquidGlass"
        :guest-title-frame-left="templateAssets?.guest_title_frame_left"
        :guest-title-frame-mid="templateAssets?.guest_title_frame_mid"
        :guest-title-frame-right="templateAssets?.guest_title_frame_right"
        :guest-frame="guestFrame"
        :guest-name-max-width-percent="guestNameMaxWidthPercent"
        :background-color="backgroundColor"
        :background-image-url="doorBackgroundImageUrl"
        :cover-gilding="coverGilding"
        :accent-color="accentColor"
        :detail-blocks="detailBlocks"
      />
    </div>

    <!-- Clickable overlay for door animation -->
    <div
      v-if="isDoorAnimation && !isContentHidden"
      @click="handleClick"
      @touchstart.passive="handleTouchStart"
      @touchmove.passive="handleTouchMove"
      @touchend="handleTouchEnd"
      class="absolute inset-0"
      :class="cursorClasses"
      style="z-index: 29; touch-action: none; background: transparent;"
    ></div>

    <!-- Main Content Container (for decoration animation only) -->
    <div
      v-if="isDecorationAnimation"
      @click="handleClick"
      @touchstart.passive="handleTouchStart"
      @touchmove.passive="handleTouchMove"
      @touchend="handleTouchEnd"
      class="absolute inset-0 flex justify-center text-center cover-copy-exit"
      :class="[animationClasses.mainContentClasses.value, cursorClasses]"
      style="z-index: 30; touch-action: none;"
    >
      <!-- The photo frame, beneath the copy: text laid across a photograph
           stays legible, and the rows catch pointers only where they draw. -->
      <CoverPhotoFrame v-if="photoFrame" v-bind="photoFrame" :show-animations="true" />

      <CoverContentRows
        :event-title="eventTitle"
        :event-logo="eventLogo"
        :sample-logo-one="sampleLogoOne"
        :show-cover-header-text="showCoverHeaderText"
        :show-cover-logo="showCoverLogo"
        :show-cover-invite-text="showCoverInviteText"
        :show-cover-guest-name="showCoverGuestName"
        :guest-name="guestName"
        :primary-color="primaryColor"
        :secondary-color="secondaryColor"
        :guestname-color="guestnameColor"
        :current-font="currentFont"
        :primary-font="primaryFont"
        :secondary-font="secondaryFont"
        :event-texts="eventTexts"
        :current-language="currentLanguage"
        :container-style="containerStyle"
        :row-styles="rowStyles"
        :layout-mode="layoutMode"
        :element-styles="elementStyles"
        :element-font-slots="elementFontSlots"
        :get-media-url="getMediaUrl"
        :display-liquid-glass="displayLiquidGlass"
        :guest-title-frame-left="templateAssets?.guest_title_frame_left"
        :guest-title-frame-mid="templateAssets?.guest_title_frame_mid"
        :guest-title-frame-right="templateAssets?.guest_title_frame_right"
        :guest-frame="guestFrame"
        :guest-name-max-width-percent="guestNameMaxWidthPercent"
        :show-animations="true"
      />

      <!-- The hosts' names, the date and the venue, when the template draws
           them. Inside this layer rather than beside it, so they leave with the
           rest of the cover copy on the tap — as the photo frame above does. -->
      <CoverDetailBlocks v-if="detailBlocks" v-bind="detailBlocks" :show-animations="true" />

      <!-- Swipe Up Arrow Indicator. Hidden by default when the envelope can't
           actually be opened, but `showSwipeArrow` overrides that so a preview
           can still show where `swipeArrowBottom` puts it. -->
      <SwipeUpArrow v-if="shouldShowSwipeArrow" :color="primaryColor" :bottom="swipeArrowBottom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOptimizedDecorations, useOptimizedBackgrounds } from '@/composables/showcase/useOptimizedDecorations'
import {
  COVER_DECORATION_RELIEF_FILTERS,
  COVER_DECORATION_RELIEF_VAR,
  coverSlotVars,
  useCoverStageLayout,
} from '@/composables/showcase/useCoverStageLayout'
import { useShowcaseAnimation, type ShowcaseAnimationType } from '@/composables/showcase/useShowcaseAnimation'
import { useTouchGesture } from '@/composables/showcase/useTouchGesture'
import type { CoverStageLayout, AmbientCreaturesConfig } from '@/services/api/types/template.types'
import {
  CoverDecorations,
  CoverContentRows,
  CoverDetailBlocks,
  CoverGilding,
  CoverPhotoFrame,
  DoorPanel,
  SwipeUpArrow,
} from './cover'
import type { CoverDetailBlocksBinding, CoverEventDetails } from './cover/coverDetails'
import {
  coverPhotoArt,
  type CoverPhotoFrameBinding,
  type CoverPhotoSource,
} from './cover/coverPhoto'
import AmbientEffect from './AmbientEffect.vue'

// Local interface for template assets (component-specific subset)
interface CoverTemplateAssets {
  open_envelope_button?: string
  display_liquid_glass_background?: boolean
  guest_title_frame_left?: string | null
  guest_title_frame_mid?: string | null
  guest_title_frame_right?: string | null
  basic_decoration_photo?: string | null
  sample_logo_1?: string | null
  sample_logo_2?: string | null
  cover_photo_frame_image?: string | null
  cover_photo_shape_image?: string | null
  header_text_image?: string | null
  cover_host_separator_image?: string | null
}

interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  isContentHidden: boolean
  eventTitle: string
  eventLogo?: string | null
  /** The photograph the photo frame shows (resolveCoverPhotoSource). */
  coverPhoto?: CoverPhotoSource | null
  guestName?: string | null
  templateAssets?: CoverTemplateAssets | null
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string
  guestnameColor?: string | null
  templateColor?: string | null
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  /** Only used to publish the font slot variables (see slotVarStyle). */
  accentFont?: string
  decorativeFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  shouldShowButtonLoading: boolean
  isInteractionDisabled?: boolean
  /** Force the swipe arrow on/off. Unset means "show it whenever the envelope
   *  is interactive" — the live showcase's behaviour. */
  showSwipeArrow?: boolean
  getMediaUrl: (url: string) => string
  /** @deprecated Use coverStageLayout.contentTopPosition instead */
  contentTopPosition?: number
  coverStageLayout?: CoverStageLayout
  coverTopDecoration?: string | null
  coverBottomDecoration?: string | null
  coverLeftDecoration?: string | null
  coverRightDecoration?: string | null
  animationType?: ShowcaseAnimationType
  /** Ambient creature effect config from template. Only renders when provided. */
  ambientCreatures?: AmbientCreaturesConfig | null
  /** The hosts, date and venue the names-and-details blocks draw. */
  eventDetails?: CoverEventDetails | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  openEnvelope: []
}>()

// AmbientEffect snapshots its config during setup exactly the way FallingEffect
// does (useAmbientCreatures destructures its options into plain locals), so a
// mounted instance can't see a changed creature list, count or speed. The `v-if`
// only covers turning the effect on and off wholesale; everything else needs a
// remount. Same rationale as MainContentStage's fallingEffectKey — no-op for
// guests, required for the partner template studio's live preview. Colors stay
// out of the key for the same reason: they resolve through a per-creature
// callback that already picks up palette edits.
const ambientCreaturesKey = computed(() => {
  const config = props.ambientCreatures
  if (!config) return 'none'
  return [
    config.creatures
      .map((creature) => `${creature.type}:${creature.weight ?? 1}:${creature.min_size ?? ''}:${creature.max_size ?? ''}`)
      .join(','),
    config.count ?? 6,
    config.speed ?? 'normal',
    config.color_source ?? 'accent',
    config.custom_color ?? '',
  ].join('|')
})

// Optimized cover decoration image URLs
const {
  leftDecorationUrl: coverLeftDecorationUrl,
  rightDecorationUrl: coverRightDecorationUrl,
  topDecorationUrl: coverTopDecorationUrl,
  bottomDecorationUrl: coverBottomDecorationUrl,
} = useOptimizedDecorations(props, 'cover')

// Optimized decoration photo URL for door panel background
const { optimizedDecorationPhotoUrl: doorBackgroundImageUrl } = useOptimizedBackgrounds(
  computed(() => props.templateAssets?.basic_decoration_photo ?? null),
  computed(() => null) // We don't need background photo here
)

// Cover stage layout configuration
const {
  containerStyle,
  rowStyles,
  layoutMode,
  elementStyles,
  elementFontSlots,
  guestFrame,
  coverGilding,
  coverDetails,
  textStyles,
  decorationZIndexes,
  layout,
} = useCoverStageLayout(
  computed(() => props.coverStageLayout),
  computed(() => props.contentTopPosition),
  // The photo frame's switch is inferred from the template's artwork when absent.
  computed(() => props.templateAssets),
)

/**
 * The decorations' cast shadow, gated on the gilding being on.
 *
 * It lives inside `coverGilding` because it is the same lighting model — the
 * band's bevel and this shadow have to agree about where the light is — but it
 * is the one part of that config that acts on the decoration artwork rather than
 * on the band, so it is also the part that does something for a template whose
 * cover is edge pieces instead of a printed border.
 */
const decorationReliefFilter = computed(() =>
  coverGilding.value.enabled
    ? COVER_DECORATION_RELIEF_FILTERS[coverGilding.value.decorationRelief]
    : COVER_DECORATION_RELIEF_FILTERS.none,
)

/**
 * The template's font and colour slots, published as CSS variables for
 * free-placed blocks to reference by name (see coverSlotVars).
 */
const slotVarStyle = computed<Record<string, string>>(() => ({
  // Published here rather than passed as a prop because it lands on images in
  // two components — CoverDecorations and DoorPanel — and this root is the
  // nearest ancestor of both. Same trick, and the same reason, as the font and
  // colour slots below. Inert at `none`, which is every template that hasn't
  // switched the gilding on.
  [COVER_DECORATION_RELIEF_VAR]: decorationReliefFilter.value,
  ...coverSlotVars(props),
}))

// Swipe arrow bottom position
const swipeArrowBottom = computed(() => layout.value.swipeArrowBottom)

// The arrow is an affordance for a gesture, so it goes away with the gesture —
// unless a caller asks for it explicitly. The template studio does: without the
// arrow on screen its `swipeArrowBottom` slider moves nothing.
const shouldShowSwipeArrow = computed(
  () => props.showSwipeArrow ?? !props.isInteractionDisabled
)

// Guest name max width (% of container width), configurable per template
const guestNameMaxWidthPercent = computed(() => layout.value.guestNameMaxWidthPercent)

// Whether to render the cover text header row (template-controlled)
const showCoverHeaderText = computed(() => layout.value.showCoverHeaderText)

// Whether the logo and the invite text draw. Unlike the header, a hidden one
// hands its space to nothing: the row stays, empty (see CoverContentRows).
const showCoverLogo = computed(() => layout.value.showCoverLogo)
const showCoverInviteText = computed(() => layout.value.showCoverInviteText)
const showCoverGuestName = computed(() => layout.value.showCoverGuestName)

/**
 * Everything the names-and-details blocks draw from, built once and bound to
 * three places — this layer's copy and each door leaf's. Null when the template
 * switched none of the three on, which is what keeps the component (and its
 * date and text lookups) off every cover that doesn't use it.
 */
const detailBlocks = computed<CoverDetailBlocksBinding | null>(() => {
  const visible = {
    hosts: layout.value.showCoverHosts,
    date: layout.value.showCoverDate,
    location: layout.value.showCoverLocation,
  }
  if (!visible.hosts && !visible.date && !visible.location) return null
  const separatorImage = props.templateAssets?.cover_host_separator_image
  return {
    eventDetails: props.eventDetails ?? null,
    eventTexts: props.eventTexts,
    currentLanguage: props.currentLanguage,
    visible,
    details: coverDetails.value,
    elementStyles: elementStyles.value,
    elementFontSlots: elementFontSlots.value,
    primaryColor: props.primaryColor,
    accentColor: props.accentColor,
    currentFont: props.currentFont,
    primaryFont: props.primaryFont,
    secondaryFont: props.secondaryFont,
    separatorImageUrl: separatorImage ? props.getMediaUrl(separatorImage) : null,
    sublineStyle: textStyles.value.hostSubline,
  }
})

/** Which images the photo frame is made of — its own pair, else the sample logos. */
const photoArt = computed(() => coverPhotoArt(props.templateAssets))

/**
 * The logo's placeholder while the event has none of its own — except while
 * the photo frame is drawing that same image as its artwork. One image does one
 * job on screen at a time.
 */
const sampleLogoOne = computed(() =>
  layout.value.showCoverPhoto && photoArt.value.fromSampleLogos
    ? null
    : (props.templateAssets?.sample_logo_1 ?? null),
)

/**
 * Everything the photo frame draws from, built once and bound to three places
 * — this layer's copy and each door leaf's, as the detail blocks are. Null when
 * the frame is off, which keeps the component (and its image measuring) off
 * every cover that doesn't use it.
 */
const photoFrame = computed<CoverPhotoFrameBinding | null>(() => {
  if (!layout.value.showCoverPhoto) return null
  const art = photoArt.value
  const photo = props.coverPhoto ?? null
  return {
    boxStyle: elementStyles.value.photo,
    frameUrl: art.frame ? props.getMediaUrl(art.frame) : null,
    shapeUrl: art.shape ? props.getMediaUrl(art.shape) : null,
    frameLayer: layout.value.coverPhoto.frameLayer ?? 'under',
    photo,
    photoUrl: photo ? props.getMediaUrl(photo.image) : null,
    hostOffset: { x: layout.value.hostClipOffsetX, y: layout.value.hostClipOffsetY },
    eventTitle: props.eventTitle,
  }
})

// Showcase animation configuration
const animationClasses = useShowcaseAnimation({
  animationType: computed(() => props.animationType),
  isContentHidden: computed(() => props.isContentHidden),
})

const { isDecorationAnimation, isDoorAnimation } = animationClasses

// Touch gesture handling
const { handleTouchStart, handleTouchMove, handleTouchEnd, handleClick } = useTouchGesture({
  onSwipeUpOrTap: () => emit('openEnvelope'),
  isDisabled: () => props.isInteractionDisabled ?? false,
})

// Cursor classes
const cursorClasses = computed(() => ({
  'cursor-pointer': !props.isInteractionDisabled,
  'cursor-not-allowed': props.isInteractionDisabled,
}))

// Liquid glass display setting
const displayLiquidGlass = computed(() =>
  props.templateAssets?.display_liquid_glass_background !== false
)
</script>

<style scoped>
/* Door perspective container. Both leaves share this one 3D scene — they carry
   no perspective() of their own, which would give each its own vanishing point.
   1.76x the stage's width and an origin slightly above centre are the
   reference artwork's (1900 against its 1080, at 50% 44%); a fixed 1500px was
   ~3.3x the width of a phone-shaped stage, which flattened the swing almost
   to a horizontal squash. */
.door-perspective-container {
  position: absolute;
  inset: 0;
  perspective: calc(min(100vw, 56.25vh) * 1.76);
  perspective-origin: 50% 44%;
  z-index: 28;
  overflow: hidden;
}

/* The cover copy's exit. Was `transition-all`, which puts every animatable
   property of a block containing the whole cover header, guest name and
   envelope button on a 0.7s tween — including ones that change for reasons that
   have nothing to do with leaving. Only these two ever move. */
.cover-copy-exit {
  transition: transform 0.7s var(--sc-ease-out, cubic-bezier(0.23, 1, 0.32, 1)), opacity 0.7s var(--sc-ease-out, cubic-bezier(0.23, 1, 0.32, 1));
}

@media (prefers-reduced-motion: reduce) {
  .cover-copy-exit.swipe-up-hidden {
    transform: none;
  }
}

/* Swipe Up Animation */
.swipe-up-hidden {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
}

/* Reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .door-perspective-container {
    perspective: none;
  }
}
</style>
