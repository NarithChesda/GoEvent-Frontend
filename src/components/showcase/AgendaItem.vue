<template>
  <div class="agenda-card p-4 flex items-center gap-4" :style="{ '--primary-color': primaryColor }">
    <!-- Icon Section (Left) - Small dot on mobile, full icon on desktop -->
    <div class="flex-shrink-0">
      <!-- Mobile: Small colored dot indicator -->
      <div
        class="sm:hidden w-3 h-3 rounded-full flex-shrink-0"
        :style="{ backgroundColor: primaryColor }"
      ></div>

      <!-- Desktop: Full icon -->
      <div class="hidden sm:block">
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
          :stroke-width="0.75"
          :style="{
            '--icon-color': primaryColor,
            color: primaryColor,
          }"
        />
      </div>
    </div>

    <!-- Content Section (Right) -->
    <div class="flex-1 flex flex-col justify-between min-h-[3rem]">
      <!-- Title (Top Right) -->
      <h3
        :class="[
          'font-medium leading-loose py-2 capitalize',
          isKhmerText ? 'text-sm sm:text-sm md:text-base laptop-md:text-lg laptop-lg:text-xl' : 'text-sm sm:text-base md:text-lg laptop-md:text-xl laptop-lg:text-2xl'
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
        class="text-xs mt-1"
        :style="{ color: primaryColor, opacity: '0.7', fontFamily: secondaryFont || currentFont }"
      >
        <span v-if="timeText">{{ timeText }}</span>
        <span v-else>Time TBD</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
</script>

<style scoped>
/* Horizontal Card Styling with mobile enhancements */
.agenda-card {
  transition: all 0.2s ease;
  position: relative;
}

/* Mobile: Add subtle card styling */
@media (max-width: 639px) {
  .agenda-card {
    border-left: 3px solid var(--primary-color);
    background: rgba(255, 255, 255, 0.03);
    border-radius: 0 0.75rem 0.75rem 0;
    backdrop-filter: blur(8px);
    margin-bottom: 0.75rem;
    padding-left: 1rem;
  }

  .agenda-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  }
}

/* Large Icon Styling - 75% bigger than original (w-10 h-10 = 2.5rem, 75% bigger = 4.375rem) */
.agenda-icon-large {
  width: 4.375rem;
  height: 4.375rem;
  color: var(--icon-color) !important;
}

/* Mobile responsive icon sizing */
@media (max-width: 640px) {
  .agenda-icon-large {
    width: 3rem;
    height: 3rem;
  }
}

/* Small laptops 13-inch (1024px-1365px) - Keep mobile sizes */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Show mobile dot instead of full icon */
  .hidden.sm\:block {
    display: none !important;
  }

  .sm\:hidden {
    display: block !important;
  }

  /* Mobile card padding and styling */
  .agenda-card {
    padding: 0.875rem !important;
    border-left: 3px solid var(--primary-color);
    background: rgba(255, 255, 255, 0.03);
    border-radius: 0 0.75rem 0.75rem 0;
    backdrop-filter: blur(8px);
    margin-bottom: 0.75rem;
    padding-left: 1rem !important;
  }

  .agenda-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  }

  /* Mobile dot size */
  .sm\:hidden.w-3 {
    width: 0.75rem !important;
    height: 0.75rem !important;
  }

  /* Title mobile size */
  h3 {
    font-size: 0.75rem !important; /* 12px - mobile size */
  }

  /* Time text mobile size */
  .text-xs {
    font-size: 0.6875rem !important; /* 11px */
  }
}

.agenda-icon-large svg {
  width: 100% !important;
  height: 100% !important;
  fill: var(--icon-color) !important;
  stroke: var(--icon-color) !important;
  color: var(--icon-color) !important;
}

.agenda-icon-large svg * {
  fill: var(--icon-color) !important;
  stroke: var(--icon-color) !important;
  color: var(--icon-color) !important;
}

.agenda-icon-large svg path,
.agenda-icon-large svg circle,
.agenda-icon-large svg rect,
.agenda-icon-large svg polygon,
.agenda-icon-large svg polyline,
.agenda-icon-large svg line,
.agenda-icon-large svg ellipse {
  fill: var(--icon-color) !important;
  stroke: var(--icon-color) !important;
}

/* Specific styling for fallback Calendar icon */
.agenda-fallback-icon {
  color: var(--icon-color) !important;
}

.agenda-fallback-icon svg {
  color: var(--icon-color) !important;
  fill: none !important;
  stroke: var(--icon-color) !important;
  stroke-width: 0.5 !important;
}

.agenda-fallback-icon svg * {
  color: var(--icon-color) !important;
  fill: none !important;
  stroke: var(--icon-color) !important;
  stroke-width: 0.5 !important;
}

.agenda-fallback-icon svg path {
  stroke-width: 0.5 !important;
}

.agenda-fallback-icon svg line {
  stroke-width: 0.5 !important;
}

.agenda-fallback-icon svg rect {
  stroke-width: 0.5 !important;
}
</style>
