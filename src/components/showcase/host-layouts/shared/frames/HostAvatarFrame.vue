<template>
  <div v-if="frame === 'none'" class="avatar-frame--none"><slot /></div>

  <!-- Every style's chrome is drawn on the avatar itself — rings as box-shadow
       spreads, the gem / tails / wreath as masked pseudo-elements. This element
       exists only to give that chrome vertical room. See the script block. -->
  <div v-else class="avatar-frame" :class="frameClass" :style="allVars">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HostFrameStyle } from '@/services/api/types/template.types'
import { LAUREL_STEM, LAUREL_LEAVES } from './ornamentPaths'
import { frameInkVars } from './frameInk'

/**
 * The avatar half of the frame set — the matching partner to HostTitleFrame.
 *
 * Wraps HostProfilePicture through a slot rather than replacing it, so the
 * avatar keeps its own entrance animation, its editor affordance and its
 * empty-state fallback. This component only ever adds chrome around that.
 *
 * **Everything is anchored to the avatar, never to this wrapper.** The avatar's
 * width is a percentage set by HostProfilePicture and overridden again by the
 * portrait layout, so it lands at ~62% of this box in `portrait` and 100% in
 * `standard`. Anything sized or positioned against this box is therefore correct
 * in one design and wrong in the other — which is exactly the bug that made the
 * wreath vanish behind the circle on `standard`. Rings are box-shadow spreads
 * (drawn from the avatar's own border-radius) and the drawn extras are
 * pseudo-elements *of the avatar*, so every percentage is a percentage of the
 * circle in both designs and at every breakpoint.
 */
interface Props {
  frame?: HostFrameStyle | null
  accentColor: string
  primaryColor: string
}

const props = withDefaults(defineProps<Props>(), { frame: 'none' })

const frame = computed<HostFrameStyle>(() => props.frame ?? 'none')
const frameClass = computed(() => `avatar-frame--${frame.value}`)

const frameVars = computed(() => frameInkVars(frame.value, props.accentColor, props.primaryColor))

/**
 * The two drawn extras as CSS **masks** rather than SVG children.
 *
 * A child would have to be positioned against this wrapper, which is the thing
 * that cannot be trusted (see above). A mask on a pseudo-element of the avatar
 * can be. Masks also keep the colour in CSS — `background-color` shows through
 * the mask — which a `background-image` data URI could not, because a data URI
 * cannot read a custom property.
 *
 * Built here from the shared path data rather than hand-copied into CSS, so the
 * wreath around the avatar and the sprigs beside the title stay one drawing.
 */
const svgUrl = (body: string, viewBox: string): string =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`,
  )}")`

const laurelSprig = (transform: string): string =>
  `<g transform="${transform}">` +
  `<path d="${LAUREL_STEM}" stroke="#000" stroke-width="1.4" fill="none" stroke-linecap="round"/>` +
  LAUREL_LEAVES.map(
    ([cx, cy, rx, ry, rot]) =>
      `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="#000"/>`,
  ).join('') +
  '</g>'

/**
 * Both sprigs meet at the circle's foot and sweep up its sides. The sprig is
 * authored pointing up-right, so it needs translating there — not rotating.
 * The circle sits at 71% of this 120-unit box (see --laurel-inset below), which
 * puts its foot at y=103.
 */
const LAUREL_MASK = svgUrl(
  laurelSprig('translate(60 103) scale(1.25) translate(-3 -45)') +
    laurelSprig('translate(60 103) scale(-1.25 1.25) translate(-3 -45)'),
  '0 0 120 120',
)

/** Two tails, folded, meeting under the ring. */
const TAILS_MASK = svgUrl(
  '<path d="M22 0 L4 30 L15 27 L21 34 L33 12 Z" fill="#000"/>' +
    '<path d="M38 0 L56 30 L45 27 L39 34 L27 12 Z" fill="#000"/>',
  '0 0 60 34',
)

const allVars = computed(() => ({
  ...frameVars.value,
  '--laurel-mask': LAUREL_MASK,
  '--tails-mask': TAILS_MASK,
  /** The tails read as folded only if they are a step darker than the band. */
  '--tail-shade': `color-mix(in srgb, ${props.accentColor || props.primaryColor} 72%, black)`,
}))
</script>

<style scoped>
/* Unframed is a bare passthrough, so the avatar is exactly what it was. */
.avatar-frame--none {
  display: contents;
}

/* This wrapper's only job is vertical room. `.profile-picture-row` is
   `overflow: hidden` and exactly as tall as its content (host-info-base.css),
   so without padding every ring, tail and sprig is cut off at the circle's edge
   — padding grows the row because the row's height is content-driven.

   Vertical only: horizontally the row's `1fr` cell is already wider than the
   avatar, so the wreath has room without any help.

   Deliberately sets no width. An earlier version took the avatar's sizing over
   so percentages would be predictable; the portrait layout's own `:deep` rule
   outranks that in one design and not the other, which is worse than not
   competing at all. */
.avatar-frame {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12% 0;
}

.avatar-frame :deep(.profile-picture-wrapper),
.avatar-frame :deep(.profile-picture-fallback) {
  position: relative;
}

/* The drawn extras. `::before` is the avatar's first child, so it paints under
   the photo — the part of a wreath or tail that overlaps the circle is hidden
   by it, which is what makes them read as passing *behind* the portrait. The
   gem uses `::after`, the last child, so it sits on top of the ring. */
.avatar-frame :deep(.profile-picture-wrapper)::before,
.avatar-frame :deep(.profile-picture-fallback)::before {
  content: '';
  position: absolute;
  pointer-events: none;
  background-color: var(--frame-rule);
  mask-repeat: no-repeat;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
}

/* ---------- banner ----------
   A thick ring with a hairline either side of it, which is what keeps a heavy
   band from reading as a blurred edge. */
.avatar-frame--banner :deep(.profile-picture-wrapper),
.avatar-frame--banner :deep(.profile-picture-fallback) {
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--frame-fill) 55%, black),
    0 0 0 6px var(--frame-fill),
    0 0 0 7px color-mix(in srgb, var(--frame-fill) 55%, black);
}

/* The gem gives the circle a top, which is the whole difference between a frame
   and an outline. Offsets are percentages of the avatar, so it rides the ring's
   crown whatever size the avatar renders at. */
.avatar-frame--banner :deep(.profile-picture-wrapper)::after,
.avatar-frame--banner :deep(.profile-picture-fallback)::after {
  content: '';
  position: absolute;
  top: -6%;
  left: 50%;
  width: 15%;
  aspect-ratio: 1 / 1;
  transform: translate(-50%, -50%) rotate(45deg);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--frame-fill) 70%, white),
    var(--frame-fill)
  );
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--frame-fill) 55%, black);
  pointer-events: none;
}

/* ---------- plaque ----------
   Two hairlines with air between them — the ring equivalent of the title's
   double rule. One shadow list, so the pair can never fall out of register. */
.avatar-frame--plaque :deep(.profile-picture-wrapper),
.avatar-frame--plaque :deep(.profile-picture-fallback) {
  box-shadow:
    0 0 0 1px var(--frame-rule),
    0 0 0 5px transparent,
    0 0 0 6px color-mix(in srgb, var(--frame-rule) 50%, transparent);
}

/* ---------- ribbon ---------- */
.avatar-frame--ribbon :deep(.profile-picture-wrapper),
.avatar-frame--ribbon :deep(.profile-picture-fallback) {
  box-shadow: 0 0 0 3px var(--frame-fill);
}

.avatar-frame--ribbon :deep(.profile-picture-wrapper)::before,
.avatar-frame--ribbon :deep(.profile-picture-fallback)::before {
  top: 72%;
  left: 50%;
  width: 58%;
  aspect-ratio: 60 / 34;
  transform: translateX(-50%);
  background-color: var(--tail-shade);
  mask-image: var(--tails-mask);
  -webkit-mask-image: var(--tails-mask);
}

/* ---------- laurel ----------
   The wreath is wider than the circle on purpose — it wraps around it, which is
   what the padding above buys room for. `-20%` on every side puts the circle at
   ~71% of the mask box, which is the proportion the mask's own geometry assumes. */
.avatar-frame--laurel :deep(.profile-picture-wrapper),
.avatar-frame--laurel :deep(.profile-picture-fallback) {
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--frame-rule) 70%, transparent);
}

/* The wreath needs more room than the other three, so it asks for it rather
   than every style paying for it. */
.avatar-frame--laurel {
  padding: 26% 0;
}

/* `-34%` rather than a snug inset, because of how the mask's own geometry
   works: the sprigs reach ~41 units from the centre of a 120-unit box, so the
   circle has to occupy well under that for them to clear it. At -20% the circle
   filled 71% of the box, the tips landed exactly on its edge, and the entire
   wreath disappeared behind the photo. At -34% the circle is ~60% of the box and
   the tips clear it by about 15%. `.avatar-frame--laurel`'s padding above is
   sized to match — the row is `overflow: hidden`, so room the wreath needs and
   room the frame reserves have to move together. */
.avatar-frame--laurel :deep(.profile-picture-wrapper)::before,
.avatar-frame--laurel :deep(.profile-picture-fallback)::before {
  inset: -34%;
  mask-image: var(--laurel-mask);
  -webkit-mask-image: var(--laurel-mask);
}
</style>
