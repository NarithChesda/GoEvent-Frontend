<template>
  <div ref="cardRef" class="agenda-card-wrapper flex items-center">
    <!-- Icon Section (Left) - Outside the card border -->
    <div class="flex-shrink-0 agenda-icon-wrapper">
      <div
        v-if="item.icon?.svg_code"
        class="agenda-icon-large flex items-center justify-center"
        :style="{
          '--icon-color': primaryColor,
          color: primaryColor,
        }"
        v-html="processedSvgCode"
      />
      <Calendar
        v-else
        class="agenda-icon-large agenda-fallback-icon"
        :stroke-width="1"
        :style="{
          '--icon-color': primaryColor,
          color: primaryColor,
        }"
      />
    </div>

    <!-- Vertical Divider Line with Horizontal Connector -->
    <div class="divider-container">
      <div class="vertical-divider" :style="{ backgroundColor: primaryColor }"></div>
      <div class="horizontal-connector" :style="{ backgroundColor: primaryColor }"></div>
    </div>

    <!-- Card with border and content -->
    <div class="agenda-card flex-1 p-4" :style="{ '--primary-color': primaryColor }">
      <!-- Content Section -->
      <div class="flex flex-col justify-between min-h-[3rem]">
      <!-- Title (Top Right) -->
      <h3
        :class="[
          'font-regular leading-loose py-2 capitalize',
          isKhmerText ? 'text-sm sm:text-sm md:text-base laptop-md:text-lg laptop-lg:text-lg' : 'text-sm sm:text-base md:text-lg laptop-md:text-xl laptop-lg:text-lg'
        ]"
        :style="{
          color: primaryColor,
          fontFamily: primaryFont || currentFont,
          lineHeight: '1.8',
        }"
      >
        {{ item.title || 'Event Activity' }}
      </h3>

      <!-- Time (Bottom Right) -->
      <div
        class="text-sm mt-0"
        :style="{ color: primaryColor, opacity: '0.7', fontFamily: secondaryFont || currentFont }"
      >
        <span v-if="timeText">{{ timeText }}</span>
        <span v-else>Time TBD</span>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Calendar } from 'lucide-vue-next'

interface AgendaItemIcon {
  id: number
  name: string
  svg_code: string
}

interface AgendaItemData {
  id: number
  title: string
  description?: string
  color?: string
  date?: string
  start_time_text?: string
  end_time_text?: string
  order?: number
  icon?: AgendaItemIcon
}

interface Props {
  item: AgendaItemData
  primaryColor: string
  accentColor: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
}

const props = defineProps<Props>()

const processedSvgCode = computed(() => {
  if (!props.item.icon?.svg_code || !props.primaryColor) {
    return props.item.icon?.svg_code || ''
  }

  // Replace common color attributes with the primary color
  let processedSvg = props.item.icon.svg_code
    .replace(/fill="[^"]*"/g, `fill="${props.primaryColor}"`)
    .replace(/stroke="[^"]*"/g, `stroke="${props.primaryColor}"`)
    .replace(/fill:'[^']*'/g, `fill:'${props.primaryColor}'`)
    .replace(/stroke:'[^']*'/g, `stroke:'${props.primaryColor}'`)
    .replace(/fill:#[0-9a-fA-F]{6}/g, `fill:${props.primaryColor}`)
    .replace(/stroke:#[0-9a-fA-F]{6}/g, `stroke:${props.primaryColor}`)
    .replace(/fill:#[0-9a-fA-F]{3}/g, `fill:${props.primaryColor}`)
    .replace(/stroke:#[0-9a-fA-F]{3}/g, `stroke:${props.primaryColor}`)

  // If no fill attribute exists, add one
  if (!processedSvg.includes('fill=') && processedSvg.includes('<svg')) {
    processedSvg = processedSvg.replace('<svg', `<svg fill="${props.primaryColor}"`)
  }

  return processedSvg
})

// Computed time text with fallback
// Check if the title contains Khmer characters
const isKhmerText = computed(() => {
  const title = props.item.title || 'Event Activity'
  // Khmer Unicode range: U+1780-U+17FF
  return /[\u1780-\u17FF]/.test(title)
})

const timeText = computed(() => {
  const start = props.item.start_time_text
  const end = props.item.end_time_text

  if (start && end) {
    return `${start} - ${end}`
  } else if (start) {
    return start
  } else if (end) {
    return `Until ${end}`
  }

  return null
})

// Scroll-driven zoom/fade — mirrors the PhotoGallery animation so agenda
// cards scale and fade in as they scroll through the showcase viewport.
// Progress is read from the same scroll container as PhotoGallery (the
// liquid-glass card's custom scrollbar) and exposed via --scroll-progress
// for the CSS below to drive opacity/scale. Updates coalesce through rAF
// to keep scroll handling paint-aligned.
const cardRef = ref<HTMLElement | null>(null)
let scrollContainerEl: HTMLElement | null = null
let rafId: number | null = null

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

const updateProgress = () => {
  rafId = null
  const el = cardRef.value
  if (!el) return

  let viewportTop = 0
  let viewportBottom = window.innerHeight
  if (scrollContainerEl) {
    const containerRect = scrollContainerEl.getBoundingClientRect()
    viewportTop = containerRect.top
    viewportBottom = containerRect.bottom
  }
  const viewportHeight = viewportBottom - viewportTop
  if (viewportHeight <= 0) return

  const rect = el.getBoundingClientRect()
  if (rect.height === 0) return

  const visibleTop = Math.max(rect.top, viewportTop)
  const visibleBottom = Math.min(rect.bottom, viewportBottom)
  const visibleHeight = Math.max(0, visibleBottom - visibleTop)
  const maxVisible = Math.min(rect.height, viewportHeight)
  const raw = maxVisible > 0 ? visibleHeight / maxVisible : 0
  const progress = easeOutCubic(Math.min(1, Math.max(0, raw)))
  el.style.setProperty('--scroll-progress', progress.toFixed(3))
}

const scheduleUpdate = () => {
  if (rafId !== null) return
  rafId = requestAnimationFrame(updateProgress)
}

let revealTimer: number | null = null

onMounted(() => {
  if (cardRef.value) {
    cardRef.value.style.setProperty('--scroll-progress', '0')
    // Enable the CSS reveal transition only for the first ~600ms after mount
    // (covers initial showcase entry and every tab switch, since those also
    // re-mount the AgendaItem). Stripping the class afterwards keeps normal
    // scroll updates instant instead of easing for every scroll tick.
    cardRef.value.classList.add('is-revealing')
    revealTimer = window.setTimeout(() => {
      cardRef.value?.classList.remove('is-revealing')
      revealTimer = null
    }, 600)
  }
  scrollContainerEl = document.querySelector(
    '.liquid-glass-card .custom-scrollbar',
  ) as HTMLElement | null
  const target: EventTarget = scrollContainerEl ?? window
  target.addEventListener('scroll', scheduleUpdate, { passive: true })
  window.addEventListener('resize', scheduleUpdate, { passive: true })
  scheduleUpdate()
})

onUnmounted(() => {
  const target: EventTarget = scrollContainerEl ?? window
  target.removeEventListener('scroll', scheduleUpdate)
  window.removeEventListener('resize', scheduleUpdate)
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (revealTimer !== null) {
    clearTimeout(revealTimer)
    revealTimer = null
  }
  scrollContainerEl = null
})
</script>

<style scoped>
/* Wrapper for card and icon */
.agenda-card-wrapper {
  --scroll-progress: 0;
  transition: all 0.2s ease;
  position: relative;
  gap: 2rem;
  /* Scroll-driven zoom/fade matched to PhotoGallery so stacked agenda items
     scale up and fade in as they scroll through the showcase viewport. */
  opacity: calc(0.2 + 0.8 * var(--scroll-progress));
  transform: scale(calc(0.68 + 0.32 * var(--scroll-progress)));
  transform-origin: center center;
  will-change: transform, opacity;
}

/* Reveal-only transition: kept for the first ~600ms after mount so the item
   eases from progress 0 to its real scroll progress (for items already in
   view on tab switch). Removed afterwards so live scrolling stays instant. */
.agenda-card-wrapper.is-revealing {
  transition:
    opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@media (prefers-reduced-motion: reduce) {
  .agenda-card-wrapper {
    --scroll-progress: 1;
    opacity: 1;
    transform: none;
  }
}

/* Divider Container */
.divider-container {
  position: relative;
  display: flex;
  align-items: center;
  align-self: stretch;
  flex-shrink: 0;
}

/* Vertical Divider Line */
.vertical-divider {
  width: 1px;
  height: 100%;
  min-height: 60px;
  opacity: 0.4;
  flex-shrink: 0;
}

/* Horizontal Connector - centered vertically */
.horizontal-connector {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 25px;
  height: 1px;
  opacity: 0.4;
}

/* Card styling */
.agenda-card {
  transition: all 0.2s ease;
  position: relative;
  border: none;
  background: transparent;
  padding-left: 0;
  margin-left: 1rem;
}

/* Large Icon Styling */
.agenda-icon-large {
  width: 4rem;
  height: 4rem;
  color: var(--icon-color) !important;
}

/* Mobile responsive icon sizing */
@media (max-width: 640px) {
  .agenda-icon-large {
    width: 3rem;
    height: 3rem;
  }
}

/* Small laptops 13-inch (laptop-sm: 1024px) - Scaled to 77.625% (67.5% * 1.15) */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Wrapper gap - reduced to give more space to text */
  .agenda-card-wrapper {
    gap: 0.75rem; /* Reduced from 1.5525rem */
  }

  /* Card styling - reduced margins for more text space */
  .agenda-card {
    padding: 0.5rem !important; /* Reduced padding */
    padding-left: 0 !important; /* Keep padding-left: 0 from mobile */
    margin-left: 0.5rem !important; /* Reduced from 0.77625rem */
  }

  /* Icon sizing - 77.625% of mobile 3rem = 2.32875rem */
  .agenda-icon-large {
    width: 2rem !important; /* Slightly smaller icon */
    height: 2rem !important;
  }

  /* Min height for content - scaled to 77.625% from 3rem */
  .min-h-\[3rem\] {
    min-height: 2rem !important;
  }

  /* Title - match tab date text */
  h3 {
    font-size: 0.625rem !important; /* 10px - match AgendaWedding tab date text */
    line-height: 1.6 !important; /* Reduced from 1.8 */
    padding-top: 0.25rem !important; /* Reduced padding */
    padding-bottom: 0.25rem !important;
  }

  /* Time text - match description text */
  .text-sm {
    font-size: 0.625rem !important; /* 10px - smaller for laptop */
    margin-top: 0 !important; /* Match mobile mt-0 */
  }

  /* Divider elements - reduced width for tighter layout */
  .vertical-divider {
    width: 1px;
    min-height: 40px; /* Reduced from 46.575px */
    opacity: 0.4;
  }

  .horizontal-connector {
    width: 12px; /* Reduced from 19.40625px */
    height: 1px;
    opacity: 0.4;
  }
}

/* Medium laptops 14-15 inch (laptop-md: 1366px+) - Scaled to 86.25% (75% * 1.15) */
@media (min-width: 1366px) and (max-width: 1535px) {
  /* Wrapper gap - reduced to give more space to text */
  .agenda-card-wrapper {
    gap: 1rem; /* Reduced from 1.725rem */
  }

  /* Card styling - reduced margins for more text space */
  .agenda-card {
    padding: 0.625rem !important; /* Reduced padding */
    padding-left: 0 !important; /* Keep padding-left: 0 from mobile */
    margin-left: 0.625rem !important; /* Reduced from 0.8625rem */
  }

  /* Icon sizing - slightly reduced */
  .agenda-icon-large {
    width: 2.25rem !important; /* Reduced from 2.5875rem */
    height: 2.25rem !important;
  }

  /* Min height for content */
  .min-h-\[3rem\] {
    min-height: 2.25rem !important;
  }

  /* Title - match tab date text */
  h3 {
    font-size: 0.625rem !important; /* 10px - match AgendaWedding tab date text */
    line-height: 1.6 !important; /* Reduced from 1.8 */
    padding-top: 0.3rem !important; /* Reduced padding */
    padding-bottom: 0.3rem !important;
  }

  /* Time text - match description text */
  .text-sm {
    font-size: 0.6875rem !important; /* 11px - slightly larger than small laptop */
    margin-top: 0 !important; /* Match mobile mt-0 */
  }

  /* Divider elements - reduced width for tighter layout */
  .vertical-divider {
    width: 1px;
    min-height: 45px; /* Reduced from 51.75px */
    opacity: 0.4;
  }

  .horizontal-connector {
    width: 15px; /* Reduced from 21.5625px */
    height: 1px;
    opacity: 0.4;
  }
}

.agenda-icon-large svg {
  width: 100% !important;
  height: 100% !important;
}

.agenda-icon-large svg,
.agenda-icon-large svg * {
  fill: var(--icon-color) !important;
  stroke: var(--icon-color) !important;
  color: var(--icon-color) !important;
}

/* Specific styling for fallback Calendar icon */
.agenda-fallback-icon,
.agenda-fallback-icon svg,
.agenda-fallback-icon svg * {
  color: var(--icon-color) !important;
  fill: none !important;
  stroke: var(--icon-color) !important;
  stroke-width: 1 !important;
}
</style>
