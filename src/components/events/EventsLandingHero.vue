<template>
  <!-- Signed-out landing for /events: a centred invitation framed by a wall of
       real public events. The tile field is decorative — it is what the product
       makes, shown rather than described — so it is inert and aria-hidden. -->
  <section class="relative flex-1 flex flex-col min-h-[100dvh] overflow-hidden">
    <!-- The page's own chrome is hidden for this state (see EventsView), so the
         landing carries the only thing it needs — a way in — floating over the
         hero rather than on a bar of its own. No mark up here: the wordmark is
         already the first thing in the hero, a few hundred pixels below. -->
    <header
      class="absolute inset-x-0 top-0 z-20 flex items-center justify-end px-4 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:pt-4 sm:pb-4"
    >
      <!-- A real touch target on a phone (40px), back to the compact desktop
           pill from `lg` — the same button, not a second style. -->
      <RouterLink
        to="/signin?redirect=%2Fevents"
        class="flex items-center gap-1.5 px-4 py-2 min-h-[40px] lg:px-3.5 lg:py-1.5 lg:min-h-0 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-medium shadow-md shadow-[#2ecc71]/20 lg:shadow-none hover:shadow-md hover:shadow-[#2ecc71]/20 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        :aria-label="t('common.nav.signIn')"
      >
        <User class="w-4 h-4 lg:w-3.5 lg:h-3.5" />
        <span>{{ t('common.nav.signIn') }}</span>
      </RouterLink>
    </header>

    <!-- Desktop tile field: absolute, behind the copy, cropped by the section. -->
    <div
      v-if="artReady"
      class="tile-field hidden lg:block absolute inset-0 pointer-events-none select-none"
      aria-hidden="true"
    >
      <div
        v-for="(tile, i) in DESKTOP_TILES"
        :key="`d-${i}`"
        class="tile-slot"
        :style="slotStyle(tile, i)"
      >
        <div class="tile" :style="{ animationDuration: floatDuration(i) }">
          <div class="tile-art">
            <img
              :src="artAt(i)"
              alt=""
              class="w-full h-full object-cover"
              decoding="async"
              @error="handleArtError(i)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Depth of field at the foot of the wall: the tiles crossing it go soft
         and dissolve into the page instead of being sliced by the viewport. -->
    <div v-if="artReady" class="field-haze hidden lg:block" aria-hidden="true"></div>

    <!-- Hero copy -->
    <div
      class="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-[clamp(1.5rem,5vh,3.5rem)] pb-[clamp(4rem,16vh,8rem)] lg:pb-[clamp(1.5rem,5vh,3.5rem)] pointer-events-none lg:pointer-events-auto"
    >
      <!-- 40px tall: the mark carries a wordmark inside it, which turns to mush
           below that on a phone screen. -->
      <img
        :src="LogoPng"
        alt="GoEvent"
        class="hero-item h-10 w-auto mb-[clamp(0.875rem,3vh,1.75rem)]"
        style="animation-delay: 0ms"
      />

      <!-- Measured in `ch`, so the column scales with the type and the headline
           always stacks three lines — "Unforgettable / events / start here" —
           which is what makes it read as a centred column rather than a
           paragraph. It also leaves the tile field a margin to live in on
           desktop (see DESKTOP_TILES).
           On a phone the type is driven by `vw` instead of pinned to the clamp
           floor, so the headline fills the screen it was given: the measure and
           the size are tuned together, such that the longest word sets the
           column width and the second word has to fall to its own line. -->
      <h1
        class="hero-item hero-headline type-display text-[clamp(2.125rem,11.5vw,3rem)] font-bold tracking-tight text-slate-900 max-w-[13ch] lg:text-[clamp(1.75rem,4.4vw,3.5rem)]"
        style="animation-delay: 80ms"
      >
        {{ t('events.landing.headline') }}
        <span
          class="clip-text-safe block bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] bg-clip-text text-transparent"
        >
          {{ t('events.landing.headlineAccent') }}
        </span>
      </h1>

      <!-- A measure narrower than the headline block, so the copy reads as a
           column rather than running edge to edge on a phone. -->
      <p
        class="hero-item mt-[clamp(0.75rem,2.5vh,1.5rem)] max-w-[36ch] lg:max-w-md text-sm sm:text-base text-slate-600 leading-relaxed"
        style="animation-delay: 160ms"
      >
        {{ t('events.landing.subtitle') }}
      </p>

      <button
        type="button"
        class="hero-item pointer-events-auto mt-[clamp(1.125rem,3vh,2rem)] inline-flex items-center justify-center px-6 py-3 min-h-[48px] lg:min-h-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white text-sm font-semibold rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-600/30 transition-all duration-300 hover:scale-[1.03] active:scale-95"
        style="animation-delay: 240ms"
        @click="$emit('create')"
      >
        {{ t('events.landing.primaryCta') }}
      </button>

      <RouterLink
        to="/explore"
        class="hero-item group pointer-events-auto mt-[clamp(0.75rem,2vh,1.25rem)] inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        style="animation-delay: 300ms"
      >
        {{ t('events.landing.secondaryCta') }}
        <ArrowRight class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
      </RouterLink>
    </div>

    <!-- Mobile/tablet: the wall closes into a carousel. The tiles are mounted on
         a tilted ring turning under the copy — it drifts on its own and takes a
         swipe, so the wall is something you can push around rather than a
         picture of one. Nothing is painted behind it: the tiles float on the
         page's own background, which is what keeps it from reading as a band
         stuck to the bottom of the screen. -->
    <div
      v-if="artReady"
      class="arc-stage lg:hidden"
      aria-hidden="true"
      @pointerdown="onArcPointerDown"
      @pointermove="onArcPointerMove"
      @pointerup="onArcPointerUp"
      @pointercancel="onArcPointerUp"
    >
      <div class="arc-scene">
        <div class="arc-tilt">
          <div ref="arcRing" class="arc-ring">
            <div v-for="(seat, i) in ARC_SEATS" :key="`m-${i}`" class="arc-slot" :style="seat">
              <div class="arc-enter" :style="{ animationDelay: `${i * 55}ms` }">
                <div class="tile">
                  <div class="tile-art">
                    <img
                      :src="artAt(i)"
                      alt=""
                      class="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                      @error="handleArtError(i)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight, User } from 'lucide-vue-next'
import LogoPng from '@/assets/logo.png'
import { eventsService } from '@/services/api'
import { getEventImage } from '@/composables/useEventFormatters'
import { buildEventCoverDataUri } from '@/utils/eventCoverPlaceholder'
import { imagekitUrl } from '@/utils/mediaUrl'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()

defineEmits<{ create: [] }>()

interface TilePlacement {
  top: string
  left?: string
  right?: string
  /** Multiplier on the field's `--tile` base size, for irregular scale. */
  m: number
  /**
   * Guard rail against the copy column, applied to the tiles whose authored
   * position sits closest to it. The `top`/`left`/`right` below becomes the
   * *ambition*; the guard is the hard limit that only binds on a viewport the
   * composition wasn't authored at — see `clearBesideCopy`/`clearAboveCopy`.
   * - `side`: middle-band tile, held outside the copy's horizontal corridor.
   * - `above`/`below`: centre-column tile, held clear of the copy block.
   */
  clear?: 'side' | 'above' | 'below'
}

/**
 * Half the copy column plus air. The widest thing in the column is the
 * `max-w-md` (28rem) subtitle, so 14rem + 4rem of clearance.
 *
 * In `rem` deliberately: [main.css](src/assets/main.css) drops the root font to
 * 75% on laptop-class viewports, which shrinks the copy — expressed this way
 * the corridor shrinks with it, instead of reserving room for a column that is
 * no longer that wide.
 */
const COPY_HALF_REM = 18

/** Half the copy block's height plus air, measured the same way. */
const COPY_HALF_BLOCK_REM = 16

/**
 * The horizontal limit: the point at which this tile's inner edge would enter
 * the copy corridor. On the widths the field was composed at the ambition wins
 * and the tile stays where it was placed; as the window narrows, the copy takes
 * up proportionally more of it and the calc takes over, sliding the tile back
 * out. A fixed percentage can only be tuned for one of those.
 *
 * Works for `left` and `right` alike — by symmetry both measure from their own
 * side of the viewport in to the tile's outer edge.
 */
const clearBesideCopy = (ambition: string, m: number): string =>
  `min(${ambition}, calc(50% - ${COPY_HALF_REM}rem - var(--tile) * ${m}))`

/** The same idea vertically, for the tiles that cross the centre column. */
const clearAboveCopy = (ambition: string, m: number): string =>
  `min(${ambition}, calc(50% - ${COPY_HALF_BLOCK_REM}rem - var(--tile) * ${m}))`

const clearBelowCopy = (ambition: string): string =>
  `max(${ambition}, calc(50% + ${COPY_HALF_BLOCK_REM}rem))`

/**
 * Tile geometry, authored by hand rather than randomised so the field is the
 * same composition on every load and can be reasoned about.
 *
 * The shape is a **ring around an oval void**: the copy sits in a clearing that
 * no tile enters, and the wall is dense at the corners and edges. The middle
 * band (y 28–75%) stops well short of the copy on both sides; the top and
 * bottom bands cross the centre column freely, because there the column is
 * empty — that is what keeps the composition from reading as two side rails.
 *
 * Two rules do the aesthetic work, and both are worth preserving when tuning:
 *
 *  1. **Nothing overlaps.** Every pair of tiles keeps a visible gap of roughly
 *     a quarter to a full tile width. Tiles stacked on each other read as a
 *     pile-up, not a wall.
 *  2. **No two tiles share a column or a row.** Positions are staggered on both
 *     axes and multipliers spread 0.84–1.45, so the eye finds no grid. The
 *     earlier field placed tiles at repeated `left` values, which lined them up
 *     into visible columns.
 *
 * Tiles bleed off an edge only where the crop is the point — the wall
 * continuing past the viewport — never as a way to fit one more in.
 *
 * Order is deliberate, not positional: the pool's real event photos land on the
 * first entries, so the biggest, least-cropped tiles carry real art and the
 * cropped and hazed outliers fall back to generated covers. A real photo
 * defocused to nothing is a photo wasted.
 */
const DESKTOP_TILES: TilePlacement[] = [
  // Fully visible, in the ring proper — these get the real event art.
  { top: '47.8%', left: '11.85%', m: 1.29, clear: 'side' },
  { top: '47.3%', right: '23%', m: 0.97, clear: 'side' },
  { top: '4%', right: '18%', m: 1.2 },
  { top: '28.3%', right: '4%', m: 1.07 },
  { top: '67%', right: '12%', m: 1.07 },
  // No `side` guard: this one clears the copy vertically already, and pulling
  // it out of a corridor it never enters only shoves it into its neighbour.
  { top: '12%', left: '21%', m: 1.07 },
  { top: '5.7%', left: '7.25%', m: 1 },
  { top: '49.7%', right: '1.5%', m: 0.94 },
  { top: '28.3%', left: '5.6%', m: 0.84 },
  // Cropped by an edge, or sitting in the haze at the foot of the wall.
  { top: '82.6%', left: '26.4%', m: 1.22 },
  { top: '83.7%', left: '57.75%', m: 1.29, clear: 'below' },
  { top: '-4.7%', left: '39%', m: 1.45, clear: 'above' },
  { top: '-3.6%', left: '57%', m: 1.23, clear: 'above' },
  { top: '86.5%', left: '15.25%', m: 1.02 },
  { top: '88.9%', left: '43.25%', m: 1.07, clear: 'below' },
  { top: '74.3%', left: '-1.9%', m: 1.09 },
]

/**
 * The mobile ring. A phone has no room for a wall, so the tiles are mounted on
 * a carousel instead — a full cylinder, not an arc of visible ones: the seats
 * are swept out mechanically, and the half facing away is hidden by
 * `backface-visibility` rather than left out of the markup. That is what lets
 * it turn indefinitely without a seam.
 *
 * The count is set by the geometry, not picked: the chord between neighbouring
 * seats (`2 * R * sin(180°/n)`) has to run a little wider than a tile, so the
 * cards ride the rim with daylight between them. Papered edge to edge — which
 * is what a higher count gives — the ring stops reading as cards on a circle
 * and starts reading as a folding screen; the gaps are what say these are
 * separate objects going round. Nine is what the current tile (29vw) and
 * radius (46vw) allow: the chord comes out at 31.5vw, so ~2.5vw of rim shows
 * between neighbours. Grow the tile again and a seat has to come out.
 *
 * The radius is then set so both of the ring's edge-on points land just inside
 * the viewport. That is the whole trick: across the front of a circle, a
 * circle is indistinguishable from a straight line, and a drum wider than the
 * screen shows nothing else. Fitting the full width in means the tiles visibly
 * climb away to either side and turn out of sight.
 */
const ARC_TILE_COUNT = 9

/**
 * Every seat is the same size and the same distance out — perspective alone
 * decides which of them reads as near and large. `translate(-50%, -50%)` leads
 * so a tile is centred on its seat, then it swings out to the rim and stays
 * tangent to it, which is what turns the near seats face-on and the ones at
 * the sides edge-on.
 */
const ARC_SEATS = Array.from({ length: ARC_TILE_COUNT }, (_, i) => ({
  width: 'var(--tile)',
  height: 'var(--tile)',
  transform: `translate(-50%, -50%) rotateY(${(i * 360) / ARC_TILE_COUNT}deg) translateZ(var(--arc-r))`,
}))

/**
 * Cover art for the tiles the API can't fill. These are the generated category
 * posters every event without a banner already uses, so a cold backend still
 * paints the same wall — never an empty frame or a broken image.
 */
const PLACEHOLDER_CATEGORIES = [
  'Wedding',
  'Music',
  'Business & Tech',
  'Birthday',
  'Food & Drink',
  'Arts & Culture',
  'Sports & Fitness',
  'Community & Social',
  'Family & Kids',
  'Education & Learning',
  'Seasonal & Holiday',
  'Health & Wellness',
  'Film & Media',
  'Housewarming Party',
  'Lifestyle & Wellness',
]

/** Square crop at 2x the largest tile (229px), focused on the subject. */
const TILE_TRANSFORM = 'w-460,h-460,fo-auto'

/** Banner art of real public events, already sized for a tile. */
const eventArt = ref<string[]>([])
/** Gates the entrance so tiles animate in once, already carrying their art. */
const artReady = ref(false)

/**
 * Enough placeholders to dress every tile on their own, so a backend that
 * returns nothing still fills the field without repeating a cover. The seed
 * also picks the composition variant, so cycling past the category list still
 * yields distinct art.
 */
const placeholderArt = Array.from(
  { length: Math.max(DESKTOP_TILES.length, ARC_TILE_COUNT) },
  (_, i) =>
    buildEventCoverDataUri(
      PLACEHOLDER_CATEGORIES[i % PLACEHOLDER_CATEGORIES.length],
      `landing-${i}`,
    ),
)

/**
 * Real public events first, generated covers behind them. Tiles index into this
 * pool modulo its length, so it is never empty and repeats only once the pool
 * is exhausted.
 */
const artPool = computed<string[]>(() => [...eventArt.value, ...placeholderArt])

/**
 * Tiles whose remote banner failed to load. They fall back to the generated
 * cover for their slot — which is a data URI and so cannot fail in turn, making
 * the fallback terminal by construction. Without this a dead banner leaves an
 * empty frame sitting in the wall for good.
 */
const failedArt = ref<ReadonlySet<number>>(new Set())

const artAt = (index: number): string => {
  if (failedArt.value.has(index)) {
    return placeholderArt[index % placeholderArt.length]
  }
  return artPool.value[index % artPool.value.length]
}

const handleArtError = (index: number) => {
  const next = new Set(failedArt.value)
  next.add(index)
  failedArt.value = next
}

const slotStyle = (tile: TilePlacement, index: number) => {
  const beside = tile.clear === 'side'
  return {
    top:
      tile.clear === 'above'
        ? clearAboveCopy(tile.top, tile.m)
        : tile.clear === 'below'
          ? clearBelowCopy(tile.top)
          : tile.top,
    left: tile.left && beside ? clearBesideCopy(tile.left, tile.m) : tile.left,
    right: tile.right && beside ? clearBesideCopy(tile.right, tile.m) : tile.right,
    width: `calc(var(--tile) * ${tile.m})`,
    height: `calc(var(--tile) * ${tile.m})`,
    zIndex: String(index),
    animationDelay: `${index * 45}ms`,
  }
}

/** Varied float periods keep the field from breathing in unison. */
const floatDuration = (index: number): string => `${7 + (index % 4) * 1.3}s`

/* ── The ring's motion ────────────────────────────────────────────────────────
 *
 * Driven frame by frame rather than by a CSS animation, because the ring has to
 * do two things a keyframe cannot: take a swipe mid-turn, and carry the throw
 * off that swipe back down into its resting drift. One angle, one velocity, one
 * `requestAnimationFrame` — the DOM write is a single `rotateY` on the ring, so
 * however many tiles are mounted, the browser composites one transform.
 */

/** Degrees per second the ring turns unattended. Negative: tiles drift left. */
const ARC_DRIFT_DEG_S = -6.5
/** How far a pixel of drag turns the ring. */
const ARC_DRAG_DEG_PX = 0.32
/** Ceiling on a throw, so a hard flick spins fast without smearing. */
const ARC_MAX_DEG_S = 640
/** Seconds for a thrown ring to settle back into the drift (exponential). */
const ARC_SETTLE_S = 1.1
/** A frame longer than this is a stall (backgrounded tab); don't integrate it. */
const ARC_MAX_FRAME_S = 0.05

const arcRing = ref<HTMLElement | null>(null)

let arcAngle = 0
let arcVelocity = ARC_DRIFT_DEG_S
let arcFrame: number | undefined
let arcPrevTs = 0
/** The pointer currently turning the ring, if any. */
let arcPointerId: number | null = null
let arcPrevX = 0
let arcPrevMoveTs = 0
/** Under reduced motion the ring holds still and only moves under a finger. */
let arcDrift = ARC_DRIFT_DEG_S

const paintArc = () => {
  if (arcRing.value) arcRing.value.style.transform = `rotateY(${arcAngle}deg)`
}

const stepArc = (ts: number) => {
  const dt = arcPrevTs ? Math.min((ts - arcPrevTs) / 1000, ARC_MAX_FRAME_S) : 0
  arcPrevTs = ts

  // While a finger is down the move handler owns the angle; this loop only
  // takes over once it lifts.
  if (arcPointerId === null && dt > 0) {
    arcVelocity += (arcDrift - arcVelocity) * (1 - Math.exp(-dt / ARC_SETTLE_S))
    arcAngle += arcVelocity * dt
    paintArc()
  }

  arcFrame = requestAnimationFrame(stepArc)
}

const onArcPointerDown = (event: PointerEvent) => {
  arcPointerId = event.pointerId
  arcPrevX = event.clientX
  arcPrevMoveTs = event.timeStamp
  arcVelocity = 0
  // Capture, so a drag that wanders off the stage (or over the copy above it)
  // keeps turning the ring instead of dropping halfway through.
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

const onArcPointerMove = (event: PointerEvent) => {
  if (arcPointerId !== event.pointerId) return

  const step = (event.clientX - arcPrevX) * ARC_DRAG_DEG_PX
  // Floored, because two moves can share a timestamp — and dividing by zero
  // here would hand the release an infinite throw.
  const dt = Math.max((event.timeStamp - arcPrevMoveTs) / 1000, 1 / 240)

  arcPrevX = event.clientX
  arcPrevMoveTs = event.timeStamp
  arcAngle += step
  arcVelocity = Math.max(-ARC_MAX_DEG_S, Math.min(ARC_MAX_DEG_S, step / dt))
  paintArc()
}

const onArcPointerUp = (event: PointerEvent) => {
  if (arcPointerId !== event.pointerId) return
  // Whatever the last move measured is the throw; stepArc decays it from here.
  arcPointerId = null
}

/**
 * Waiting for the request keeps the common case pop-free — tiles animate in
 * already carrying real art. But the API client allows 30s before it times
 * out, and an empty frame for that long is worse than a swap, so the reveal is
 * capped: past this the placeholder wall paints and late art slots in behind
 * the entrance animation.
 */
const ART_WAIT_CAP_MS = 1500
let revealTimer: ReturnType<typeof setTimeout> | undefined

onMounted(async () => {
  revealTimer = setTimeout(() => {
    artReady.value = true
  }, ART_WAIT_CAP_MS)

  // A ring that turns on its own is exactly the kind of ambient motion this
  // setting asks us to drop. It still takes a swipe — that motion is the
  // reader's own — so the loop is simply never started and the move handler
  // paints directly.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    arcDrift = 0
    arcVelocity = 0
  } else {
    arcFrame = requestAnimationFrame(stepArc)
  }

  try {
    const response = await eventsService.getEvents({
      privacy: 'public',
      status: 'published',
      ordering: '-start_date',
    })
    if (response.success && response.data?.results) {
      // Only events with real artwork — an event with no banner would render
      // the same generated cover the placeholder pool already supplies.
      eventArt.value = response.data.results
        .map((event) => getEventImage(event))
        .filter((url): url is string => Boolean(url))
        .map((url) => imagekitUrl(url, TILE_TRANSFORM) ?? url)
    }
  } catch {
    // The placeholder pool already covers this — the wall paints either way.
  } finally {
    artReady.value = true
  }
})

onUnmounted(() => {
  clearTimeout(revealTimer)
  if (arcFrame !== undefined) cancelAnimationFrame(arcFrame)
})
</script>

<style scoped>
/* The Khmer headline, sized and measured on its own terms.
 *
 * The Latin pair — `13ch` and `11.5vw` — is tuned together so the longest word
 * sets the column and the headline always stacks (see the template). Neither
 * number survives the script change. `ch` is the advance of the *current
 * font's* zero, so under the Khmer display face the same 13 resolves ~15%
 * short of one line of this headline, which broke the first phrase in two and
 * stranded the particle ដ៏ at the end of line one. And a Khmer cluster carries
 * its vowel sign and coeng in the same advance a Latin letter uses for one
 * glyph, so at 11.5vw the lead line is intrinsically 8.16em — wider than any
 * phone's text column, at every phone width, regardless of the measure.
 *
 * So: `em` for the measure, because it tracks the type size rather than a
 * Latin digit's width, and its own vw coefficient, set so the lead line holds
 * on one line down to a 320px phone. The 11% it gives up against the Latin
 * size is not a loss — Khmer fills more of its em box, so the two set at the
 * same px do not read at the same size anyway.
 *
 * The `lg:` rule only restores the Latin desktop clamp: this selector outranks
 * the utility class at every width, so without it the phone size would follow
 * the headline onto a 27" monitor. */
.hero-headline:lang(km) {
  font-size: clamp(1.875rem, 10.25vw, 2.75rem);
  max-width: 9em;
}

@media (min-width: 1024px) {
  .hero-headline:lang(km) {
    font-size: clamp(1.75rem, 4.4vw, 3.5rem);
  }
}

/* Own stacking context: without it the per-tile z-indexes would compete with
   the copy's `z-10` and the higher tiles would paint over the headline. */
/* The base size the multipliers scale from. Tuned so the largest tile is about
   an eighth of the viewport's width — big enough to read as a real invitation
   card, small enough that the ring of them still leaves the copy its clearing.
   The upper clamp stops the wall growing into billboards on an ultrawide. */
.tile-field {
  --tile: clamp(78px, 7.7vw, 158px);
  z-index: 0;
}

/*
 * The mobile carousel. Pinned to the foot of the section rather than stacked
 * under the copy as a flex row: in flow, the stage's empty upper half opened a
 * band of dead space between the last button and the first tile that no amount
 * of tuning inside the stage could close. Out of flow, the copy centres in the
 * whole screen and the ring turns underneath it.
 *
 * Deliberately has no background of its own — no wash, no glow, no haze. The
 * page's gradient runs straight through, and the tiles read as objects on it
 * rather than as a panel stuck to the bottom of the screen. Anything painted
 * here also has to be clipped by `overflow`, and a clipped gradient leaves a
 * hard seam across the page exactly where it is meant to disappear.
 *
 * One perspective for the whole stage — a per-tile `perspective()` would give
 * each its own vanishing point and the tiles would stop belonging to one
 * object. The origin sits level with the ring's centre, so the camera looks at
 * the drum head-on rather than down onto it: the near seats come at the viewer
 * square, and it is the lean below plus the depth falloff — not a raised eye —
 * that bows the row into an ellipse.
 */
.arc-stage {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  z-index: 0;
  /* Tall enough on a portrait tablet to hold the leaned ring, which grows on
     the tile/radius clamps faster than 36vh does. */
  height: clamp(15rem, 36vh, 24rem);
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  /* Vertical gestures still belong to the page; horizontal ones turn the ring. */
  touch-action: pan-y;
  cursor: grab;
  --tile: clamp(96px, 29vw, 148px);
  --arc-r: clamp(150px, 46vw, 235px);
}

/*
 * The camera, kept one level below the clip on purpose. `overflow: hidden` and
 * `perspective` on the same element do not reliably clip a `preserve-3d`
 * subtree in Chromium — on a portrait tablet the far side of the ring escaped
 * and painted across the top of the page. Split apart, this element flattens
 * the 3D scene into its own plane (its `transform-style` stays `flat`) and the
 * stage above clips that flattened result, which it can always do.
 *
 * Short enough to be a real lens: at ~3x the ring's radius the front tile is
 * half again the size of the ones at the sides. A long perspective flattens
 * the cylinder into a row of shrinking rectangles.
 */
.arc-scene {
  position: absolute;
  inset: 0;
  perspective: clamp(520px, 135vw, 780px);
  /* Level with `.arc-slot`'s `top`, so the two stay in step: an origin above
     the ring's centre is a camera looking down, which tips the front tiles
     away and shows their top edges. */
  perspective-origin: 50% 44%;
}

.arc-stage:active {
  cursor: grabbing;
}

/* The turntable's lean, kept on its own element so the spin underneath it is a
   clean `rotateY` — one animated property, no matrix to rebuild per frame. */
.arc-tilt {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  /* The lean is what makes it read as a ring rather than a row: it drops the
     near seats and lifts the ones at the sides, so the visible half of the
     drum bows into a U instead of running flat across the screen.
     Kept shallow on purpose. The lean is doing two jobs at once — it bows the
     row, but it also tips every tile's face back by the same angle, and past
     ~20° the front card is showing the viewer its top edge instead of its art.
     At 14° the bow is still worth ~0.24 of the radius (a clear arc across a
     drum this wide) while the near tiles read as square-on. */
  transform: rotateX(-14deg);
}

/* The shared 3D space. Nothing here may take `overflow`, `filter`, `opacity`
   or a mask — any one of them flattens `preserve-3d` and drops the twelve
   tiles back onto a plane. The clipping is the stage's job, two levels up. */
.arc-ring {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  will-change: transform;
}

/* `top` seats the ring in the stage — measured against the *projected* front
   tile, which the lean and the perspective make both wider and taller than the
   `--tile` it started from, so it clears the bottom of the screen with its
   shadow rather than being sliced by it. It tracks the lean: a shallow one
   drops the near seats less far below the ring's centre (`R · sin θ`), so the
   centre itself has to sit lower in the stage to put the front tile in the
   same place. Move `rotateX` and this moves with it — as does the scene's
   `perspective-origin`, which stays level with it.
   `backface-visibility` retires each tile as it turns past edge-on — at that
   instant it is exactly zero pixels wide, so it vanishes without a pop, and
   the half of the drum facing away never shows the reverse of a photo. */
.arc-slot {
  position: absolute;
  left: 50%;
  top: 44%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.arc-enter {
  width: 100%;
  height: 100%;
  animation: tile-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* The ring's own rotation is the motion here. A second, independent bob per
   tile reads as jitter against it — and costs twelve more animated layers. */
.arc-slot .tile {
  animation: none;
}

.arc-slot img {
  -webkit-user-drag: none;
}

.tile-slot {
  position: absolute;
  animation: tile-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/*
 * The wall recedes at the bottom rather than ending. A masked `backdrop-filter`
 * defocuses whatever crosses the strip — progressively, since the mask applies
 * to the blur's own result — and the wash on top drops it toward the page
 * colour. Blur and wash together: blur alone reads as a rendering fault, wash
 * alone as a flat scrim over sharp tiles.
 */
.field-haze {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: clamp(72px, 11%, 150px);
  z-index: 1;
  pointer-events: none;
  backdrop-filter: blur(7px);
  -webkit-backdrop-filter: blur(7px);
  -webkit-mask-image: linear-gradient(to top, #000 0%, rgba(0, 0, 0, 0.85) 45%, transparent 100%);
  mask-image: linear-gradient(to top, #000 0%, rgba(0, 0, 0, 0.85) 45%, transparent 100%);
}

/* Masked with its parent, so this fades out on the same curve as the blur. */
.field-haze::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(249, 252, 254, 0.92), rgba(249, 252, 254, 0));
}

/*
 * Each tile is a physical object: a bezel with the art recessed into it, lit
 * from above, floating over the page. Three things carry that read, and all
 * three have to survive the 2x size range between the smallest and largest
 * tile — so every dimension here is a **percentage of the tile's own width**,
 * never a fixed pixel. A 5px bezel that looks right on a 152px tile is half the
 * frame on a 58px one, which is what makes a scaled-down copy look wrong.
 *
 *   1. Bezel: a top-lit gradient face with a white top edge and a shaded
 *      bottom edge (the two `inset` shadows) — that pair is the bevel.
 *   2. Recess: `.tile-art::after` lays a rim and an inner top shadow over the
 *      art so it reads as sunk below the bezel rather than pasted on it.
 *   3. Float: a three-stop cast shadow — a tight contact shadow, a mid
 *      penumbra, and a wide soft one — so the disk sits above the page.
 */
.tile {
  width: 100%;
  height: 100%;
  padding: 6%;
  border-radius: 14%;
  background: linear-gradient(168deg, #ffffff 0%, #ffffff 42%, #eef2f7 100%);
  box-shadow:
    inset 0 1.5px 0 rgba(255, 255, 255, 0.95),
    inset 0 -1.5px 0 rgba(15, 23, 42, 0.07),
    0 0 0 1px rgba(15, 23, 42, 0.07),
    0 1px 2px rgba(15, 23, 42, 0.06),
    0 6px 12px -6px rgba(15, 23, 42, 0.22),
    0 18px 30px -12px rgba(15, 23, 42, 0.3);
  animation: tile-float 8s ease-in-out infinite;
  will-change: transform;
}

.tile-art {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 10%;
  overflow: hidden;
  background: #e2e8f0;
}

/* The recess. Drawn as an overlay because an inset shadow on the image itself
   paints behind it — a replaced element covers its own box. */
.tile-art::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow:
    inset 0 0 0 1px rgba(15, 23, 42, 0.12),
    inset 0 2px 5px -1px rgba(15, 23, 42, 0.35);
}

@keyframes tile-in {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes tile-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-7px);
  }
}

.hero-item {
  animation: hero-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes hero-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tile-slot,
  .arc-enter,
  .tile,
  .hero-item {
    animation: none;
  }
}
</style>
