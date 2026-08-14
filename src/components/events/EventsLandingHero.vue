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
      class="absolute inset-x-0 top-0 z-20 flex items-center justify-end px-4 sm:px-6 py-3 sm:py-4"
    >
      <RouterLink
        to="/signin?redirect=%2Fevents"
        class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-medium hover:shadow-md hover:shadow-[#2ecc71]/20 transition-all duration-200"
        :aria-label="t('common.nav.signIn')"
      >
        <User class="w-3.5 h-3.5" />
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
      class="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-[clamp(1.5rem,5vh,3.5rem)]"
    >
      <img
        :src="LogoPng"
        alt="GoEvent"
        class="hero-item h-8 sm:h-9 lg:h-10 w-auto mb-[clamp(0.875rem,3vh,1.75rem)]"
        style="animation-delay: 0ms"
      />

      <!-- Measured in `ch`, so the column scales with the type and the headline
           breaks into two lines (three with the accent) at every size — and the
           tile field always has a margin to live in (see DESKTOP_TILES). -->
      <h1
        class="hero-item text-[clamp(1.75rem,4.4vw,3.5rem)] font-bold leading-[1.18] tracking-tight text-slate-900 max-w-[13ch]"
        style="animation-delay: 80ms"
      >
        {{ t('events.landing.headline') }}
        <span
          class="block bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] bg-clip-text text-transparent"
        >
          {{ t('events.landing.headlineAccent') }}
        </span>
      </h1>

      <p
        class="hero-item mt-[clamp(0.75rem,2.5vh,1.5rem)] max-w-md text-sm sm:text-base text-slate-600 leading-relaxed"
        style="animation-delay: 160ms"
      >
        {{ t('events.landing.subtitle') }}
      </p>

      <button
        type="button"
        class="hero-item mt-[clamp(1.125rem,3vh,2rem)] inline-flex items-center px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white text-sm font-semibold rounded-full shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-600/30 transition-all duration-300 hover:scale-[1.03] active:scale-95"
        style="animation-delay: 240ms"
        @click="$emit('create')"
      >
        {{ t('events.landing.primaryCta') }}
      </button>

      <RouterLink
        to="/explore"
        class="hero-item group mt-[clamp(0.75rem,2vh,1.25rem)] inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        style="animation-delay: 300ms"
      >
        {{ t('events.landing.secondaryCta') }}
        <ArrowRight class="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
      </RouterLink>
    </div>

    <!-- Mobile/tablet tile cluster: the same wall, stacked under the copy and
         cropped on three sides so it reads as a fragment of something larger. -->
    <div
      v-if="artReady"
      class="tile-field tile-field-mobile lg:hidden relative w-full h-[clamp(11rem,32vh,19rem)] flex-shrink-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      <div
        v-for="(tile, i) in MOBILE_TILES"
        :key="`m-${i}`"
        class="tile-slot"
        :style="slotStyle(tile, i)"
      >
        <div class="tile" :style="{ animationDuration: floatDuration(i) }">
          <div class="tile-art">
            <img
              :src="artAt(i)"
              alt=""
              class="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              @error="handleArtError(i)"
            />
          </div>
        </div>
      </div>

      <div class="field-haze field-haze-mobile" aria-hidden="true"></div>
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
 * Two staggered rows bleeding past both edges and the bottom — a fragment of
 * the same wall, under the same no-overlap rule. Ordered by prominence for the
 * same reason as DESKTOP_TILES.
 */
const MOBILE_TILES: TilePlacement[] = [
  { top: '55%', left: '4%', m: 1.15 },
  { top: '53%', left: '70%', m: 1.1 },
  { top: '2%', left: '52%', m: 0.95 },
  { top: '-6%', left: '20%', m: 1.1 },
  { top: '62%', left: '38%', m: 1 },
  { top: '-8%', left: '82%', m: 1.05 },
  { top: '4%', left: '-8%', m: 1 },
]

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
  { length: Math.max(DESKTOP_TILES.length, MOBILE_TILES.length) },
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

onUnmounted(() => clearTimeout(revealTimer))
</script>

<style scoped>
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

/* Three tiles to a row here rather than the desktop field's five or six, so the
   base is a much larger share of the width. Sized so the gaps between them stay
   about a quarter of a tile — the same ratio the desktop field keeps — instead
   of closing to a hairline on a 320px phone. */
.tile-field-mobile {
  --tile: clamp(72px, 22vw, 132px);
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

/* The mobile cluster is not its own stacking context — the haze shares one with
   the tile slots, whose z-indexes climb with their order — so it has to clear
   the highest of them rather than sit at the desktop field's z-1. */
.field-haze-mobile {
  height: 32%;
  z-index: 20;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
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
  .tile,
  .hero-item {
    animation: none;
  }
}
</style>
