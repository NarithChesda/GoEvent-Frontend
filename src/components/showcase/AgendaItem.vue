<template>
  <div
    ref="cardRef"
    class="agenda-item"
    :class="{ 'is-first': isFirst, 'is-last': isLast }"
    :style="{ '--primary-color': primaryColor }"
  >
    <!-- Timeline rail: icon medallion sitting on a continuous hairline spine -->
    <div class="timeline-rail">
      <span class="rail-line rail-top"></span>
      <div class="icon-medallion">
        <div
          v-if="item.icon?.svg_code"
          class="medallion-icon"
          v-html="processedSvgCode"
        />
        <Calendar
          v-else
          class="medallion-icon fallback-icon"
          :stroke-width="1.25"
        />
      </div>
      <span class="rail-line rail-bottom"></span>
    </div>

    <!-- Content -->
    <div class="agenda-content">
      <div
        class="agenda-time"
        :style="{ fontFamily: secondaryFont || currentFont }"
      >
        <span>{{ timeText || 'Time TBD' }}</span>
        <span class="time-rule"></span>
      </div>
      <InlineEditableText
        :value="item.title"
        :target="{ kind: 'agenda', agendaId: item.id, field: 'title' }"
        :input-style="{ fontFamily: primaryFont || currentFont, color: primaryColor }"
      >
        <h3
          :class="['agenda-title capitalize', isKhmerText && 'is-khmer']"
          :style="{ fontFamily: primaryFont || currentFont }"
        >
          {{ item.title || 'Event Activity' }}
        </h3>
      </InlineEditableText>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Calendar } from 'lucide-vue-next'
import InlineEditableText from '@/components/showcase-preview/InlineEditableText.vue'

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
  entranceDelay?: number
  isFirst?: boolean
  isLast?: boolean
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

// Check if the title contains Khmer characters
const isKhmerText = computed(() => {
  const title = props.item.title || 'Event Activity'
  // Khmer Unicode range: U+1780-U+17FF
  return /[ក-៿]/.test(title)
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
  const delayMs = (props.entranceDelay || 0) * 1000
  if (cardRef.value) {
    cardRef.value.style.setProperty('--scroll-progress', '0')
    cardRef.value.classList.add('is-revealing')
    // Remove the reveal class only after the entrance delay + transition duration
    revealTimer = window.setTimeout(() => {
      cardRef.value?.classList.remove('is-revealing')
      revealTimer = null
    }, delayMs + 600)
  }
  scrollContainerEl = document.querySelector(
    '.liquid-glass-card .custom-scrollbar',
  ) as HTMLElement | null
  const target: EventTarget = scrollContainerEl ?? window
  target.addEventListener('scroll', scheduleUpdate, { passive: true })
  window.addEventListener('resize', scheduleUpdate, { passive: true })
  // Delay the first progress update so cards animate in one at a time
  if (delayMs > 0) {
    setTimeout(scheduleUpdate, delayMs)
  } else {
    scheduleUpdate()
  }
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
.agenda-item {
  --scroll-progress: 0;
  position: relative;
  display: flex;
  gap: 0.875rem;
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
.agenda-item.is-revealing {
  transition:
    opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@media (prefers-reduced-motion: reduce) {
  .agenda-item {
    --scroll-progress: 1;
    opacity: 1;
    transform: none;
  }
}

/* Timeline rail: hairline spine with the medallion at the item's center */
.timeline-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 3.5rem;
}

.rail-line {
  width: 1px;
  flex: 1;
  min-height: 0.625rem;
  background-color: color-mix(in srgb, var(--primary-color) 28%, transparent);
}

/* Fade the spine in/out at the ends of the list */
.agenda-item.is-first .rail-top {
  background: linear-gradient(
    to bottom,
    transparent,
    color-mix(in srgb, var(--primary-color) 28%, transparent)
  );
}

.agenda-item.is-last .rail-bottom {
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--primary-color) 28%, transparent),
    transparent
  );
}

/* Icon medallion: soft fill, hairline inner ring, faint outer halo */
.icon-medallion {
  position: relative;
  width: 3.5rem;
  height: 3.5rem;
  margin: 0.5rem 0;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  background-color: color-mix(in srgb, var(--primary-color) 7%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color) 22%, transparent);
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease;
}

.icon-medallion::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--primary-color) 12%, transparent);
}

.medallion-icon {
  width: 1.75rem;
  height: 1.75rem;
}

/* Content block */
.agenda-content {
  flex: 1;
  min-width: 0;
  align-self: center;
  padding: 0.875rem 1rem 0.875rem 0.75rem;
  border-radius: 1.125rem;
  transition: background-color 0.3s ease;
}

/* Time as a letter-spaced overline with a fading hairline rule */
.agenda-time {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.6875rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--primary-color) 70%, transparent);
  white-space: nowrap;
}

.time-rule {
  flex: 1;
  max-width: 4.5rem;
  height: 1px;
  background: linear-gradient(
    to right,
    color-mix(in srgb, var(--primary-color) 30%, transparent),
    transparent
  );
}

.agenda-title {
  margin-top: 0.375rem;
  color: var(--primary-color);
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.65;
  overflow-wrap: break-word;
}

.agenda-title.is-khmer {
  font-size: 0.9375rem;
  line-height: 1.9;
}

@media (min-width: 640px) {
  .agenda-title {
    font-size: 1.125rem;
  }

  .agenda-title.is-khmer {
    font-size: 1rem;
  }
}

/* Gentle hover treatment on fine pointers only */
@media (hover: hover) and (pointer: fine) {
  .agenda-item:hover .icon-medallion {
    background-color: color-mix(in srgb, var(--primary-color) 13%, transparent);
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--primary-color) 35%, transparent),
      0 8px 20px -8px color-mix(in srgb, var(--primary-color) 45%, transparent);
  }

  .agenda-item:hover .agenda-content {
    background-color: color-mix(in srgb, var(--primary-color) 5%, transparent);
  }
}

/* Mobile (<640px) */
@media (max-width: 639px) {
  .agenda-item {
    gap: 0.75rem;
  }

  .timeline-rail {
    width: 2.75rem;
  }

  .icon-medallion {
    width: 2.75rem;
    height: 2.75rem;
    margin: 0.375rem 0;
  }

  .icon-medallion::after {
    inset: -3px;
  }

  .medallion-icon {
    width: 1.375rem;
    height: 1.375rem;
  }

  .agenda-content {
    padding: 0.75rem 0.75rem 0.75rem 0.5rem;
  }

  .agenda-time {
    font-size: 0.625rem;
    letter-spacing: 0.14em;
    gap: 0.5rem;
  }
}

/* Small laptops 13-inch (1024px-1365px) - compact showcase card scale */
@media (min-width: 1024px) and (max-width: 1365px) {
  .agenda-item {
    gap: 0.625rem;
  }

  .timeline-rail {
    width: 2.25rem;
  }

  .icon-medallion {
    width: 2.25rem;
    height: 2.25rem;
    margin: 0.3125rem 0;
  }

  .icon-medallion::after {
    inset: -3px;
  }

  .medallion-icon {
    width: 1.125rem;
    height: 1.125rem;
  }

  .agenda-content {
    padding: 0.5rem 0.625rem;
    border-radius: 0.75rem;
  }

  .agenda-time {
    font-size: 0.5625rem;
    gap: 0.5rem;
  }

  .time-rule {
    max-width: 3rem;
  }

  .agenda-title {
    margin-top: 0.25rem;
    font-size: 0.6875rem;
    line-height: 1.6;
  }

  .agenda-title.is-khmer {
    font-size: 0.6875rem;
    line-height: 1.8;
  }
}

/* Medium laptops 14-15 inch (1366px-1535px) */
@media (min-width: 1366px) and (max-width: 1535px) {
  .agenda-item {
    gap: 0.75rem;
  }

  .timeline-rail {
    width: 2.5rem;
  }

  .icon-medallion {
    width: 2.5rem;
    height: 2.5rem;
    margin: 0.375rem 0;
  }

  .icon-medallion::after {
    inset: -3px;
  }

  .medallion-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .agenda-content {
    padding: 0.625rem 0.75rem;
    border-radius: 0.875rem;
  }

  .agenda-time {
    font-size: 0.625rem;
    gap: 0.5rem;
  }

  .time-rule {
    max-width: 3.5rem;
  }

  .agenda-title {
    margin-top: 0.25rem;
    font-size: 0.75rem;
    line-height: 1.6;
  }

  .agenda-title.is-khmer {
    font-size: 0.75rem;
    line-height: 1.8;
  }
}

/* Icon color enforcement (uploaded SVGs carry their own fills) */
.medallion-icon svg {
  width: 100% !important;
  height: 100% !important;
}

.medallion-icon svg,
.medallion-icon svg * {
  fill: var(--primary-color) !important;
  stroke: var(--primary-color) !important;
  color: var(--primary-color) !important;
}

/* Fallback Calendar icon renders as an outline */
.fallback-icon,
.fallback-icon svg,
.fallback-icon svg * {
  color: var(--primary-color) !important;
  fill: none !important;
  stroke: var(--primary-color) !important;
}
</style>
