<template>
  <!-- EditableRegion is a bare slot on the public showcase; in the manage-page
       preview a click anywhere on the card (except the reorder arrows) opens
       the full EditAgendaDrawer parent-side. -->
  <EditableRegion
    class="agenda-item-region"
    :intent="{ kind: 'agendaItem', agendaId: item.id }"
  >
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
      <h3
        :class="['agenda-title capitalize', isKhmerText && 'is-khmer']"
        :style="{ fontFamily: primaryFont || currentFont }"
      >
        {{ item.title || 'Event Activity' }}
      </h3>
    </div>

    <!-- Reorder arrows — only inside the editable manage-page preview
         (editIntentCtx is never provided on the public showcase). Clicks
         stop propagation so they don't trigger the card's edit intent. -->
    <div v-if="editIntentCtx" class="reorder-controls">
      <button
        type="button"
        class="edit-region-control reorder-btn"
        :disabled="isFirst"
        :title="tApp('management.showcasePreview.editors.moveUp')"
        :aria-label="tApp('management.showcasePreview.editors.moveUp')"
        @click.stop.prevent="requestReorder('up')"
      >
        <ChevronUp class="reorder-icon" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="edit-region-control reorder-btn"
        :disabled="isLast"
        :title="tApp('management.showcasePreview.editors.moveDown')"
        :aria-label="tApp('management.showcasePreview.editors.moveDown')"
        @click.stop.prevent="requestReorder('down')"
      >
        <ChevronDown class="reorder-icon" aria-hidden="true" />
      </button>
    </div>
  </div>
  </EditableRegion>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue'
import { Calendar, ChevronUp, ChevronDown } from 'lucide-vue-next'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useScrollProgress } from '@/composables/showcase/useScrollProgress'

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

// Only provided by the editable manage-page preview frame — undefined on the
// public showcase, so the reorder arrows can never leak into production.
const editIntentCtx = inject(EditIntentKey, undefined)
const { t: tApp } = useAppLanguage()

const requestReorder = (direction: 'up' | 'down') => {
  editIntentCtx?.requestEdit({ kind: 'agendaReorder', agendaId: props.item.id, direction })
}

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
// Measurement is delegated to the shared useScrollProgress registry: one
// listener and one rAF for every card and photo on the page, with reads batched
// ahead of writes. Registering here per card meant N rAF callbacks per frame
// each forcing its own layout.
const cardRef = ref<HTMLElement | null>(null)
const entranceDelayMs = (props.entranceDelay || 0) * 1000

useScrollProgress(cardRef, { startDelayMs: entranceDelayMs })

let revealTimer: number | null = null

onMounted(() => {
  if (cardRef.value) {
    cardRef.value.classList.add('is-revealing')
    // Remove the reveal class only after the entrance delay + transition duration
    revealTimer = window.setTimeout(() => {
      cardRef.value?.classList.remove('is-revealing')
      revealTimer = null
    }, entranceDelayMs + 600)
  }
})

onUnmounted(() => {
  if (revealTimer !== null) {
    clearTimeout(revealTimer)
    revealTimer = null
  }
})
</script>

<style scoped>
.agenda-item {
  --scroll-progress: 0;
  position: relative;
  display: flex;
  gap: 0.875rem;
  /* Scroll-driven zoom/fade matched to PhotoGallery so stacked agenda items
     scale up and fade in as they scroll through the showcase viewport.
     The range is deliberately narrow. A 0.68→1 scale re-rasterizes the card's
     text at a fractional scale for most of its time on screen (visibly soft),
     and because the mapping is symmetric, an item at the top edge shrank away
     while it was still being read. 0.94→1 keeps the parallax read without
     turning the list into a lens.
     No `will-change`: these cards live in a long list, and promoting every one
     of them costs more than the transform saves. */
  opacity: calc(0.55 + 0.45 * var(--scroll-progress));
  transform: scale(calc(0.94 + 0.06 * var(--scroll-progress)));
  transform-origin: center center;
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

/* Manage-page preview edit chrome: reorder arrows at the card's right edge.
   Rendered only when the edit-intent context exists, never in production. */
.agenda-item-region {
  /* Keep the hover "Edit activity" badge clear of the reorder arrows
     (arrow button width + inset + breathing room). */
  --edit-badge-right: 2.4rem;
}

.reorder-controls {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-self: center;
  flex-shrink: 0;
}

.reorder-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.625rem;
  height: 1.625rem;
  padding: 0;
  color: #1e90ff;
  background: rgba(255, 255, 255, 0.92);
  border: 1.5px dashed rgba(30, 144, 255, 0.5);
  border-radius: 9999px;
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.18);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, opacity 0.15s ease;
}

.reorder-btn:hover:not(:disabled) {
  border-color: rgba(30, 144, 255, 0.9);
  background: rgba(30, 144, 255, 0.08);
}

.reorder-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.reorder-icon {
  width: 1rem;
  height: 1rem;
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
