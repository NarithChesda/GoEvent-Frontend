<template>
  <Transition name="gf-swap" mode="out-in">
    <img
      v-if="photoUrl"
      :key="`photo-${photoUrl}`"
      :src="photoUrl"
      :alt="item.title || item.typeLabel"
      class="gf gf--photo"
      loading="lazy"
    />

    <!-- Keyed `art` and nothing else, deliberately: switching between two colour
         options keeps this exact element, so Vue patches the fill and the
         garment RECOLOURS in place rather than being torn down and rebuilt. A
         key carrying the code id would remount it on every swatch tap, which is
         both uglier and how the figure got stuck blank before. -->
    <svg
      v-else
      key="art"
      class="gf gf--art"
      :class="`gf--${mode}`"
      :viewBox="GARMENT_VIEWBOX"
      :style="inkVars"
      role="img"
      :aria-label="item.typeLabel"
    >
      <!-- Traced line art is one closed outline of every pen stroke, so it is
           FILLED (evenodd knocks the enclosed areas back out) and carries no
           separate detail layers — the lapels, the belt and the buttons are
           already in it. -->
      <path class="gf-art-path" :d="art" />
    </svg>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { GARMENT_VIEWBOX, resolveGarmentArt } from './garmentPaths'
import { garmentLineInk } from './useDressCodeDesign'
import type { DressCodeDesignItem } from './types'

/**
 * The dress code's figure: the organizer's photograph when there is one, and
 * the drawn garment when there is not.
 *
 * **The photograph always wins.** A partner picking a design is choosing a
 * composition, not choosing to discard an upload — so every design renders the
 * photo identically (`object-fit: cover`, filling its frame) and the drawn
 * garment is what the same frame holds when the upload is absent. That is what
 * lets the garment be a genuine fix to the empty state rather than a sixth
 * thing to configure.
 *
 * **The frame belongs to the design, not to this.** A square with a soft
 * corner, a tall arch, a colour disc and a small badge are four different
 * grounds, and a figure carrying its own would fight all four. This component
 * paints nothing behind itself; it fills whatever box it is given.
 *
 * **One path, never a composition.** Both garment families carry a drawing of
 * the pair (see garmentArt.ts), so an all-genders code resolves to a single
 * path rather than to two figures this component has to place and scale
 * against each other. There is nothing here to lay out.
 *
 * ## Two things this must never do
 *
 * **Never carry a key that changes with the selected code.** The swatch row
 * picks between colour options of the same outfit, so the right behaviour is
 * for the garment to *recolour* — the `fill` transition below carries it, and
 * holding the element identity is what lets it run at all.
 *
 * **Never sit directly inside a `<Transition>` at the call site either.** The
 * only transition here is this one, between the photo and the drawing, and both
 * of its branches are plain elements. `EditableRegion` is a two-branch template
 * and therefore a fragment-rooted component; `<Transition mode="out-in">` around
 * one of those never completes its leave hook, so the figure disappears on the
 * first switch and never comes back. Designs wrap the figure in EditableRegion,
 * not the other way round, and never put a Transition between them.
 *
 * ## The two modes
 *
 * `fill` — the garment is the subject, drawn in the dress code's own colour on
 * the design's own ground. What three of the five designs use.
 *
 * `line` — the garment sits ON the dress code's colour (`palette`'s disc,
 * `ledger`'s badge), where drawing it in that same colour would make it
 * disappear. It takes the contrast ink the caller supplies via `--gf-on`
 * instead.
 */
interface Props {
  item: DressCodeDesignItem
  /**
   * The gender of the group this code was drawn from — `all` renders the pair.
   * Read off the group rather than the record because the group is where the
   * shell keeps it; a code inside a `male` group is the masculine figure
   * whatever the record says, and the two can only disagree if the grouping is
   * wrong, in which case the grouping is what to fix.
   */
  gender: string
  getMediaUrl: (url: string) => string
  /** The template's primary. The fallback line colour for a code with no colour. */
  ink: string
  mode?: 'fill' | 'line'
  /**
   * Draw the garment even when the code has a photograph. `palette` and
   * `ledger` set it: a disc is a colour chip and a badge is an icon, and
   * cropping a full-length outfit photo into either produces a smear of fabric
   * that is neither a recognisable outfit nor a legible colour.
   */
  forceArt?: boolean
}

const props = withDefaults(defineProps<Props>(), { mode: 'fill', forceArt: false })

const photoUrl = computed(() => {
  if (props.forceArt || !props.item.image) return null
  return props.getMediaUrl(props.item.image)
})

const art = computed(() => resolveGarmentArt(props.item.dressCodeType, props.gender))

const inkVars = computed(() => ({
  // The traced art draws in the dress code's own colour, floored so a white or
  // ivory outfit still leaves a line. Only `fill` mode uses it: in `line` mode
  // the figure sits ON a disc of that colour, where drawing it in the same
  // colour would be drawing nothing.
  '--gf-line': garmentLineInk(props.item.color, props.ink),
}))
</script>

<style scoped>
.gf {
  display: block;
  width: 100%;
  height: 100%;
}

.gf--photo {
  object-fit: cover;
  /* Tailwind's preflight sets `img { max-width: 100% }`, which squashes a
     `h-full w-full` image whose frame is narrower than its natural ratio.
     The frames here are square or taller, so the cover crop needs this off. */
  max-width: none;
}

/* The drawn garment never touches the edge of its frame: a figure flush to an
   arch or a square's corner reads as cropped rather than as drawn. */
.gf--art {
  padding: 9%;
  box-sizing: border-box;
  overflow: visible;
}

/* Photo ↔ drawing, the only swap this component makes. Both branches are plain
   elements, which is the whole reason it is safe to put a Transition here. */
.gf-swap-enter-active {
  transition: opacity 0.22s var(--dcd-ease-out, ease-out);
}

.gf-swap-leave-active {
  transition: opacity 0.12s var(--dcd-ease-out, ease-out);
}

.gf-swap-enter-from,
.gf-swap-leave-to {
  opacity: 0;
}

/* One filled outline of every pen stroke. `evenodd` is what turns that outline
   back into a line: without it the enclosed areas fill solid and the drawing
   becomes a black blob. Line weight is part of the geometry, so it scales with
   the figure — no stroke-width to tune, and no hairline that goes spidery at
   200px or clogs at 40px. */
.gf-art-path {
  fill-rule: evenodd;
  stroke: none;
}

/* On the neutral wash ground the drawing is the dress code's own colour.
   It transitions, because switching colour option keeps this element and only
   changes the variable — so the garment recolours in place. That is the single
   nicest moment in the section and it costs three lines. */
.gf--fill .gf-art-path {
  fill: var(--gf-line);
  transition: fill 0.32s var(--dcd-ease-out, ease-out);
}

/* On a disc or badge of that same colour it has to be the contrast ink
   instead — a burgundy line on a burgundy disc is an empty disc. */
.gf--line .gf-art-path {
  fill: var(--gf-on, currentColor);
}

@media (prefers-reduced-motion: reduce) {
  .gf--fill .gf-art-path {
    transition-duration: 0.01ms;
  }
}
</style>
