<template>
  <!-- Ad-style hero band: one featured vendor at a time, auto-advancing.
       Deliberately short — it is a header the visitor takes in at a glance and
       scrolls past on the way to the listings below. -->
  <div
    class="group/spotlight spotlight-band relative h-52 sm:h-60 lg:h-64 rounded-3xl overflow-hidden bg-slate-900 shadow-lg shadow-slate-900/10"
    :style="{ '--spotlight-dwell': `${slideInterval}ms` }"
    role="group"
    aria-roledescription="carousel"
    :aria-label="t('services.vendors.featuredTitle')"
    @pointerenter="isHovered = true"
    @pointerleave="isHovered = false"
    @focusin="isFocused = true"
    @focusout="isFocused = false"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
  >
    <!-- Slides -->
    <div
      v-for="(vendor, index) in slides"
      :key="vendor.id"
      class="absolute inset-0 transition-opacity duration-700 ease-out"
      :class="index === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'"
      :aria-hidden="index === activeIndex ? undefined : 'true'"
    >
      <!-- Backdrop: the vendor's own banner, or a photo borrowed from one of
           their listings, or — sharing the ladder and the artwork with the
           storefront banner — the designed brand cover.

           The two are cross-faded rather than swapped. Borrowed photos arrive
           from a lookup that lands after first paint, and a hard cut from a
           saturated cover to a photograph reads as a glitch; letting the photo
           resolve over the cover reads as it loading. The cover stays light on
           purpose: the scrims below already carry the text, and a dark wash
           here as well turns the gradient into flat navy. -->
      <Transition name="backdrop">
        <VendorCoverArt
          v-if="!isBackdropShown(vendor)"
          :name="vendor.name"
          :logo="vendorLogoOrNone(vendor)"
        />
      </Transition>
      <img
        v-if="backdropFor(vendor)"
        :src="backdropFor(vendor)!"
        alt=""
        aria-hidden="true"
        class="spotlight-backdrop absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out"
        :class="[
          isBackdropShown(vendor) ? 'opacity-100' : 'opacity-0',
          { 'spotlight-kenburns': index === activeIndex },
        ]"
        @load="onBackdropLoad(vendor)"
        @error="onBackdropError(vendor)"
      />

      <!-- Legibility scrims, both anchored to the edge they serve rather than
           laid over the whole frame: two full-bleed washes stack in the corner
           where the vendor block sits and take the artwork down to near-black,
           which is the opposite of what an ad for that artwork wants. The top
           right stays clear so the photo (or the brand gradient) still reads. -->
      <div
        class="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-slate-900/95 via-slate-900/50 to-transparent"
        aria-hidden="true"
      ></div>
      <div
        class="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-slate-900/45 to-transparent"
        aria-hidden="true"
      ></div>

      <!-- The whole slide is the target; the carousel controls stack above it -->
      <button
        type="button"
        :tabindex="index === activeIndex ? 0 : -1"
        class="absolute inset-0 w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80"
        :aria-label="t('services.vendors.spotlight.viewVendor', { name: vendor.name })"
        @click="onSlideClick(vendor)"
      >
        <!-- Featured badge. Says "Featured Vendor", not just "Featured": with no
             section label above the hero any more, this pill is the only thing
             telling the visitor these are vendors GoEvent recommends, and it
             also has to distinguish itself from the "Featured" pills on the
             listing cards further down the page.

             It is a label, not a control, so on a phone it steps down a size:
             at full size it carried the same visual weight as the vendor's own
             name three lines below, in a band barely 13rem tall. Same colour
             and wording — only the scale changes. -->
        <span
          class="absolute top-3 left-3 sm:top-4 sm:left-4 inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-[10px] sm:text-xs font-medium rounded-md sm:rounded-lg shadow-md"
        >
          <Sparkles class="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          {{ t('services.vendors.spotlight.badge') }}
        </span>

        <!-- Vendor block -->
        <div class="absolute inset-x-0 bottom-0 flex items-end gap-3 sm:gap-4 p-4 sm:p-5 lg:p-6">
          <VendorAvatar
            :name="vendor.name"
            :logo="vendor.logo"
            size-class="w-12 h-12 sm:w-14 sm:h-14"
            class="ring-2 ring-white/70 shadow-lg flex-shrink-0 transition-transform duration-500 group-hover/spotlight:scale-105"
          />

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <h3 class="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                {{ vendor.name }}
              </h3>
              <BadgeCheck
                class="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0"
                :aria-label="t('services.vendors.verified')"
              />
            </div>
            <p v-if="vendor.tagline" class="text-xs sm:text-sm text-white/75 line-clamp-1 mt-0.5">
              {{ vendor.tagline }}
            </p>
            <div
              class="flex items-center gap-1.5 mt-1.5 text-[11px] sm:text-xs text-white/60 min-w-0"
            >
              <template v-if="vendor.city">
                <MapPin class="w-3 h-3 flex-shrink-0" />
                <span class="truncate">{{ vendor.city }}</span>
                <span aria-hidden="true">·</span>
              </template>
              <span class="flex-shrink-0">
                {{
                  t(
                    'services.vendors.listingsCount',
                    { count: vendor.listingsCount },
                    vendor.listingsCount,
                  )
                }}
              </span>
            </div>
          </div>

          <span
            class="inline-flex items-center gap-1.5 flex-shrink-0 px-3 sm:px-4 py-2 rounded-full bg-white/95 text-slate-900 text-xs font-semibold shadow-lg transition-transform duration-300 group-hover/spotlight:scale-105"
          >
            <span class="hidden sm:inline">{{ t('services.vendors.spotlight.cta') }}</span>
            <ArrowRight class="w-4 h-4" />
          </span>
        </div>
      </button>
    </div>

    <!-- Progress indicators, doubling as jump targets. On its own glass pill so
         the bars keep their contrast wherever the backdrop happens to be light. -->
    <div
      v-if="slides.length > 1"
      class="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center rounded-full bg-slate-900/25 backdrop-blur-sm px-0.5"
    >
      <button
        v-for="(vendor, index) in slides"
        :key="`step-${vendor.id}`"
        type="button"
        class="group/step py-[18px] -my-3 px-2 sm:py-2 sm:my-0 sm:px-1 focus:outline-none"
        :aria-label="t('services.vendors.spotlight.goTo', { name: vendor.name })"
        :aria-current="index === activeIndex ? 'true' : undefined"
        @click="goTo(index)"
      >
        <span
          class="block h-1 rounded-full overflow-hidden transition-all duration-300 group-focus-visible/step:ring-2 group-focus-visible/step:ring-white/80"
          :class="
            index === activeIndex
              ? 'w-7 bg-white/35'
              : 'w-1.5 bg-white/55 group-hover/step:bg-white'
          "
        >
          <span
            v-if="index === activeIndex"
            :key="progressKey"
            class="block h-full w-full bg-white rounded-full origin-left"
            :class="isAdvancing ? 'spotlight-progress' : 'scale-x-100'"
          ></span>
        </span>
      </button>
    </div>

    <!--
      Arrows, hover-revealed, and from `sm` up only.

      They used to sit permanently visible on phones, on the reasoning that a
      touch screen has no hover and so would otherwise get no visible control at
      all. What that produced was three circles in a 13rem band, two of them
      pointing right: a prev and a next floating over the artwork, and the white
      "View vendor" pill in the corner below them — so the control that leaves
      the page looked like a third way to page the carousel. And it was never
      even consistent, since any touch device from 640px up (every tablet) has
      always fallen into the hover-only branch.

      A phone is not left without an affordance: the progress bars top right are
      tappable jump targets with a 40px hit area, they are the one control that
      also says where you are in the rotation, and the band takes a horizontal
      swipe. So touch gets the dots and the swipe, and the pointer that can
      actually reveal them gets the arrows.
    -->
    <template v-if="slides.length > 1">
      <button
        type="button"
        class="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm text-white ring-1 ring-white/25 opacity-0 group-hover/spotlight:opacity-100 focus:opacity-100 hover:bg-white/25 active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        :aria-label="t('services.vendors.spotlight.previous')"
        @click="step(-1)"
      >
        <ChevronLeft class="w-5 h-5" />
      </button>
      <button
        type="button"
        class="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm text-white ring-1 ring-white/25 opacity-0 group-hover/spotlight:opacity-100 focus:opacity-100 hover:bg-white/25 active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        :aria-label="t('services.vendors.spotlight.next')"
        @click="step(1)"
      >
        <ChevronRight class="w-5 h-5" />
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
} from 'lucide-vue-next'
import type { Vendor } from './types'
import VendorCoverArt from './VendorCoverArt.vue'
import VendorAvatar from './VendorAvatar.vue'
import { getVendorLogoFallback } from '@/utils/serviceFallbackImages'
import { imagekitUrl } from '@/utils/mediaUrl'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()

const props = defineProps<{
  vendors: Vendor[]
  /** Milliseconds a slide holds before advancing (default 6000) */
  interval?: number
}>()

const emit = defineEmits<{
  'vendor-click': [vendor: Vendor]
}>()

/** Cap the rotation — past this an ad band stops reading as a band and starts reading as a list */
const MAX_SLIDES = 6

/** A drag this far cancels the tap and turns the gesture into a swipe */
const SWIPE_THRESHOLD = 40

const slideInterval = computed(() => props.interval ?? 6000)
const slides = computed(() => props.vendors.slice(0, MAX_SLIDES))

const activeIndex = ref(0)
const isHovered = ref(false)
const isFocused = ref(false)
const isPageVisible = ref(true)
/** Bumped on every slide change so the progress fill remounts and restarts */
const progressKey = ref(0)

const prefersReducedMotion = ref(false)
let motionQuery: MediaQueryList | null = null

/**
 * The vendor's logo, but only when it is genuinely theirs. Vendors without one
 * carry a shared grey stand-in, and blooming that across the cover art turns
 * every logo-less vendor's banner to the same mud.
 */
const vendorLogoOrNone = (vendor: Vendor): string | undefined =>
  vendor.logo && vendor.logo !== getVendorLogoFallback() ? vendor.logo : undefined

/** Backdrops that failed to load — those slides fall back to their brand art */
const failedBackdrops = reactive(new Set<string>())

/** Backdrops the browser has actually decoded, so the fade never reveals a blank */
const loadedBackdrops = reactive(new Set<string>())

/** The first candidate that has not already failed, in its raw form — the key both sets use */
const usableBackdrop = (vendor: Vendor): string | null =>
  vendor.heroImages?.find((url) => !failedBackdrops.has(url)) ?? null

const backdropFor = (vendor: Vendor): string | null => {
  const usable = usableBackdrop(vendor)
  if (!usable) return null
  // Width-only transform. Both sources are already framed by the vendor — a
  // banner they cropped for this shape, or the cover they chose for a listing —
  // so constraining the height as well would only re-crop their decision.
  return imagekitUrl(usable, 'w-1200') ?? usable
}

/**
 * Whether the photo is on screen for real. Gates on decode, not on the URL
 * existing: borrowed photos are looked up after first paint, so flipping the
 * layers when the src is merely assigned would uncover the container for as
 * long as the download takes.
 */
const isBackdropShown = (vendor: Vendor): boolean => {
  const usable = usableBackdrop(vendor)
  return !!usable && loadedBackdrops.has(usable)
}

const onBackdropLoad = (vendor: Vendor) => {
  const current = usableBackdrop(vendor)
  if (current) loadedBackdrops.add(current)
}

const onBackdropError = (vendor: Vendor) => {
  const current = usableBackdrop(vendor)
  if (current) failedBackdrops.add(current)
}

/** Autoplay runs only when there is somewhere to go and nobody is engaged */
const isAdvancing = computed(
  () =>
    slides.value.length > 1 &&
    !isHovered.value &&
    !isFocused.value &&
    isPageVisible.value &&
    !prefersReducedMotion.value,
)

let timer: ReturnType<typeof setInterval> | null = null

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const startTimer = () => {
  stopTimer()
  if (!isAdvancing.value) return
  timer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % slides.value.length
    progressKey.value++
  }, slideInterval.value)
}

const goTo = (index: number) => {
  activeIndex.value = index
  progressKey.value++
  startTimer() // a manual jump gets a full dwell, not the remainder of this one
}

const step = (delta: number) => {
  const count = slides.value.length
  goTo((activeIndex.value + delta + count) % count)
}

let pointerStartX: number | null = null
/** Furthest horizontal travel seen so far, kept so a cancelled gesture can still commit */
let pointerDeltaX = 0
let didSwipe = false

const commitSwipe = (delta: number) => {
  if (Math.abs(delta) < SWIPE_THRESHOLD || slides.value.length < 2) return
  didSwipe = true
  step(delta < 0 ? 1 : -1)
}

const onPointerDown = (event: PointerEvent) => {
  pointerStartX = event.clientX
  pointerDeltaX = 0
  didSwipe = false
}

const onPointerMove = (event: PointerEvent) => {
  if (pointerStartX === null) return
  const delta = event.clientX - pointerStartX
  if (Math.abs(delta) > Math.abs(pointerDeltaX)) pointerDeltaX = delta
}

const onPointerUp = (event: PointerEvent) => {
  if (pointerStartX === null) return
  const delta = event.clientX - pointerStartX
  pointerStartX = null
  commitSwipe(delta)
}

/**
 * The gesture was taken away mid-swipe — a system edge-swipe, a second finger,
 * or the browser deciding it owns the pan. `touch-action: pan-y` stops that
 * happening for ordinary horizontal drags, but when it does happen the travel
 * already recorded is a real swipe and is honoured rather than dropped; the
 * alternative is an interaction that silently does nothing.
 */
const onPointerCancel = () => {
  if (pointerStartX === null) return
  pointerStartX = null
  commitSwipe(pointerDeltaX)
}

const onSlideClick = (vendor: Vendor) => {
  // The slide is both a swipe surface and a link; a completed swipe eats the tap
  if (didSwipe) {
    didSwipe = false
    return
  }
  emit('vendor-click', vendor)
}

const onVisibilityChange = () => {
  isPageVisible.value = !document.hidden
}

const onMotionChange = (event: MediaQueryListEvent) => {
  prefersReducedMotion.value = event.matches
}

// Vendors arrive after mount, and the list can shrink — keep the index in range
watch(
  () => slides.value.length,
  (count) => {
    if (activeIndex.value >= count) activeIndex.value = 0
  },
)

watch(isAdvancing, startTimer)

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = motionQuery.matches
  motionQuery.addEventListener('change', onMotionChange)
  document.addEventListener('visibilitychange', onVisibilityChange)
  startTimer()
})

onUnmounted(() => {
  stopTimer()
  motionQuery?.removeEventListener('change', onMotionChange)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<style scoped>
/* Horizontal drags belong to the carousel, vertical ones to the page. Without
   this the browser claims the gesture after the first move and cancels the
   pointer stream, so a swipe never reaches pointerup and the band is stranded
   on its first slide for the whole of a touch session. */
.spotlight-band {
  touch-action: pan-y;
}

/* Photo over cover, not photo instead of cover. The cover holds at full
   opacity for the length of the photo's fade-in and only then drops, by which
   point it is completely covered — so the two never blend to something lighter
   than either, and no gap opens between them. */
.backdrop-leave-active {
  transition: opacity 0.25s ease-out 0.7s;
}

.backdrop-leave-to {
  opacity: 0;
}

/* Slow drift on the active backdrop, running longer than the dwell so the
   motion carries through the cross-fade instead of stopping under it. */
.spotlight-kenburns {
  animation: spotlight-drift 12s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
}

@keyframes spotlight-drift {
  from {
    transform: scale(1.02);
  }
  to {
    transform: scale(1.12) translate(-1%, -0.5%);
  }
}

/* The fill mirrors the dwell, so the bar lands as the slide turns over. */
.spotlight-progress {
  animation: spotlight-fill var(--spotlight-dwell, 6000ms) linear forwards;
}

@keyframes spotlight-fill {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spotlight-kenburns,
  .spotlight-progress {
    animation: none;
  }

  /* Both halves go instant together: killing only the cover's exit would drop
     it while the photo was still fading up, opening the gap this avoids. */
  .backdrop-leave-active,
  .spotlight-backdrop {
    transition: none;
  }
}
</style>
