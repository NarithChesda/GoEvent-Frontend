<template>
  <div>
    <div class="relative">
      <!-- 3D coverflow scroller (looped: slides are tripled, scroll is
           silently re-centered so both neighbors are always present) -->
      <div
        ref="scroller"
        class="showcase-scroller flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-4 cursor-grab"
        :class="{ 'snap-none cursor-grabbing': isDragging }"
        @scroll.passive="onScroll"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <button
          v-for="(image, index) in loopImages"
          :key="`${index}-${image}`"
          class="showcase-slide relative flex-shrink-0 w-[68vw] sm:w-[340px] lg:w-[380px] aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 snap-center shadow-xl shadow-slate-900/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          @click="onSlideClick(index)"
          :aria-label="`${(index % images.length) + 1} / ${images.length}`"
        >
          <img
            :src="image"
            alt=""
            loading="lazy"
            draggable="false"
            class="w-full h-full object-cover select-none"
          />
          <!-- Subtle sheen + grounding scrim for a premium finish -->
          <div
            class="absolute inset-0 bg-gradient-to-tr from-slate-900/20 via-transparent to-white/10 pointer-events-none"
            aria-hidden="true"
          ></div>
        </button>
      </div>

      <!-- Desktop arrows (loop: never disabled) -->
      <button
        v-if="images.length > 1"
        @click="scrollToRawIndex(nearestRawIndex - 1)"
        class="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md items-center justify-center text-slate-700 hover:bg-white transition-all"
        :aria-label="t('services.lightbox.previous')"
      >
        <ChevronLeft class="w-5 h-5" />
      </button>
      <button
        v-if="images.length > 1"
        @click="scrollToRawIndex(nearestRawIndex + 1)"
        class="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md items-center justify-center text-slate-700 hover:bg-white transition-all"
        :aria-label="t('services.lightbox.next')"
      >
        <ChevronRight class="w-5 h-5" />
      </button>
    </div>

    <!-- Dots -->
    <div v-if="images.length > 1" class="flex items-center justify-center gap-1.5 mt-1">
      <button
        v-for="(image, index) in images"
        :key="`dot-${index}`"
        @click="scrollToLogicalIndex(index)"
        class="rounded-full transition-all duration-300"
        :class="
          index === activeIndex
            ? 'w-5 h-1.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]'
            : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
        "
        :aria-label="`${index + 1} / ${images.length}`"
      ></button>
    </div>

    <ServiceGalleryLightbox
      :is-open="lightboxOpen"
      :images="images"
      :start-index="lightboxIndex"
      @close="lightboxOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import ServiceGalleryLightbox from './ServiceGalleryLightbox.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()

const props = defineProps<{
  images: string[]
}>()

const scroller = ref<HTMLElement | null>(null)
const activeIndex = ref(0)
const nearestRawIndex = ref(0)
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const isDragging = ref(false)

let rafId = 0
let settleTimer: ReturnType<typeof setTimeout> | null = null
let dragStartX = 0
let dragStartScroll = 0
let dragMoved = false

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const isLooped = computed(() => props.images.length > 1)

// Triple the slides so the scroll position can be silently re-centered —
// the visitor always sees a neighbor on both sides.
const loopImages = computed(() =>
  isLooped.value ? [...props.images, ...props.images, ...props.images] : props.images,
)

const getSlides = (): HTMLElement[] =>
  scroller.value ? Array.from(scroller.value.querySelectorAll<HTMLElement>('.showcase-slide')) : []

/** Distance between consecutive slide starts (uniform width + gap) */
const getStride = (): number => {
  const slides = getSlides()
  return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : 0
}

const centeredScrollLeft = (slide: HTMLElement): number => {
  const el = scroller.value
  if (!el) return 0
  return slide.offsetLeft - (el.clientWidth - slide.clientWidth) / 2
}

/**
 * Depth transforms driven by scroll position: each slide recedes and dims in
 * proportion to its distance from the viewport centre.
 *
 * This used to rotate the off-centre slides by up to 24°, which is the
 * literal iTunes-coverflow move and now reads as a decade-old jQuery plugin —
 * on a page whose whole job is to make a vendor's work look expensive. Worse,
 * a hard Y-rotation foreshortens the photograph itself: the further a piece of
 * work sits from centre, the more distorted the thing we are trying to sell.
 *
 * A gallery signals depth without deforming its contents. The rotation is
 * dropped to a residual 4° — enough to keep the strip from reading as a flat
 * filmstrip — and the work is carried by scale and opacity instead, both of
 * which leave the image rectangular.
 */
const updateTransforms = () => {
  const el = scroller.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const slides = getSlides()

  let nearest = 0
  let nearestDist = Infinity

  slides.forEach((slide, index) => {
    const r = slide.getBoundingClientRect()
    const delta = (r.left + r.width / 2 - centerX) / r.width
    const ratio = Math.max(-1.2, Math.min(1.2, delta))
    const abs = Math.min(Math.abs(ratio), 1)

    if (reducedMotion) {
      slide.style.transform = ''
    } else {
      slide.style.transform = `perspective(1600px) rotateY(${(-ratio * 4).toFixed(2)}deg) scale(${(1 - abs * 0.08).toFixed(3)})`
    }
    slide.style.opacity = (1 - abs * 0.35).toFixed(3)
    slide.style.zIndex = String(20 - Math.round(abs * 10))

    if (Math.abs(ratio) < nearestDist) {
      nearestDist = Math.abs(ratio)
      nearest = index
    }
  })

  nearestRawIndex.value = nearest
  activeIndex.value = props.images.length > 0 ? nearest % props.images.length : 0
}

/**
 * Keep the scroll position inside the middle copy. Runs once scrolling has
 * settled — the tripled content repeats with period `copyWidth`, so the jump
 * is pixel-identical and invisible.
 */
const normalizeLoop = () => {
  const el = scroller.value
  if (!el || !isLooped.value) return
  const copyWidth = getStride() * props.images.length
  if (copyWidth <= 0) return

  if (el.scrollLeft < copyWidth * 0.75) {
    el.scrollLeft += copyWidth
  } else if (el.scrollLeft >= copyWidth * 1.75) {
    el.scrollLeft -= copyWidth
  }
}

const onScroll = () => {
  if (!rafId) {
    rafId = requestAnimationFrame(() => {
      rafId = 0
      updateTransforms()
    })
  }
  if (settleTimer) clearTimeout(settleTimer)
  settleTimer = setTimeout(() => {
    normalizeLoop()
    updateTransforms()
  }, 150)
}

const scrollToRawIndex = (rawIndex: number) => {
  const el = scroller.value
  if (!el) return
  const slides = getSlides()
  const target = slides[Math.max(0, Math.min(rawIndex, slides.length - 1))]
  if (!target) return
  el.scrollTo({
    left: centeredScrollLeft(target),
    behavior: reducedMotion ? 'auto' : 'smooth',
  })
}

/** Dots: go to a logical image via the shortest direction from here */
const scrollToLogicalIndex = (logicalIndex: number) => {
  const n = props.images.length
  if (n === 0) return
  const current = nearestRawIndex.value
  let delta = (logicalIndex - (current % n) + n) % n
  if (delta > n / 2) delta -= n
  scrollToRawIndex(current + delta)
}

const onSlideClick = (rawIndex: number) => {
  if (dragMoved) return // a drag, not a click
  if (rawIndex === nearestRawIndex.value) {
    lightboxIndex.value = rawIndex % props.images.length
    lightboxOpen.value = true
  } else {
    scrollToRawIndex(rawIndex)
  }
}

// Mouse drag-to-scroll (touch devices already scroll natively)
const onPointerDown = (event: PointerEvent) => {
  if (event.pointerType !== 'mouse' || !scroller.value) return
  isDragging.value = true
  dragMoved = false
  dragStartX = event.clientX
  dragStartScroll = scroller.value.scrollLeft
  scroller.value.setPointerCapture(event.pointerId)
}

const onPointerMove = (event: PointerEvent) => {
  if (!isDragging.value || !scroller.value) return
  const dx = event.clientX - dragStartX
  if (Math.abs(dx) > 5) dragMoved = true
  scroller.value.scrollLeft = dragStartScroll - dx
}

const onPointerUp = (event: PointerEvent) => {
  if (!isDragging.value || !scroller.value) return
  isDragging.value = false
  scroller.value.releasePointerCapture(event.pointerId)
  if (dragMoved) {
    normalizeLoop()
    updateTransforms() // recompute nearest in case the loop jump moved us
    scrollToRawIndex(nearestRawIndex.value) // settle onto the nearest snap point
  }
  // Reset after the click event (which fires right after pointerup) is handled
  setTimeout(() => {
    dragMoved = false
  }, 0)
}

/** Start centered on the first image of the middle copy */
const initPosition = () => {
  const el = scroller.value
  if (!el) return
  const slides = getSlides()
  const startIndex = isLooped.value ? props.images.length : 0
  const target = slides[startIndex]
  if (target) {
    el.scrollLeft = centeredScrollLeft(target)
  }
  updateTransforms()
}

watch(
  () => props.images,
  () => nextTick(initPosition),
)

onMounted(() => {
  nextTick(initPosition)
  window.addEventListener('resize', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', onScroll)
  if (rafId) cancelAnimationFrame(rafId)
  if (settleTimer) clearTimeout(settleTimer)
})
</script>

<style scoped>
/* Inline padding lets the slides rest at the center snap point */
.showcase-scroller {
  padding-inline: max(calc(50% - 34vw), 1rem);
}

@media (min-width: 640px) {
  .showcase-scroller {
    padding-inline: max(calc(50% - 170px), 1rem);
  }
}

@media (min-width: 1024px) {
  .showcase-scroller {
    padding-inline: max(calc(50% - 190px), 1rem);
  }
}

.showcase-slide {
  transform-style: preserve-3d;
  will-change: transform, opacity;
}
</style>
