<template>
  <div class="agenda-card-wrapper flex items-center">
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
/* Wrapper for card and icon */
.agenda-card-wrapper {
  transition: all 0.2s ease;
  position: relative;
  gap: 2rem;
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
  /* Wrapper gap - 77.625% of mobile 2rem = 1.5525rem */
  .agenda-card-wrapper {
    gap: 1.5525rem; /* 2rem * 0.77625 - increased by 15% */
  }

  /* Card styling - 77.625% of mobile values */
  .agenda-card {
    padding: 0.77625rem !important; /* 1rem * 0.77625 (p-4 scaled) */
    padding-left: 0 !important; /* Keep padding-left: 0 from mobile */
    margin-left: 0.77625rem !important; /* 1rem * 0.77625 - increased by 15% */
  }

  /* Icon sizing - 77.625% of mobile 3rem = 2.32875rem */
  .agenda-icon-large {
    width: 2.32875rem !important; /* 3rem * 0.77625 - increased by 15% */
    height: 2.32875rem !important; /* 3rem * 0.77625 - increased by 15% */
  }

  /* Min height for content - scaled to 77.625% from 3rem */
  .min-h-\[3rem\] {
    min-height: 2.32875rem !important; /* 3rem * 0.77625 */
  }

  /* Title - scaled to 77.625% from mobile md:text-lg (1.125rem) */
  h3 {
    font-size: 0.87328125rem !important; /* 1.125rem * 0.77625 - increased by 15% */
    line-height: 1.8 !important; /* Match mobile line-height */
    padding-top: 0.388125rem !important; /* 0.5rem * 0.77625 (py-2) */
    padding-bottom: 0.388125rem !important; /* 0.5rem * 0.77625 (py-2) */
  }

  /* Time text - scaled to 77.625% from mobile text-xs (0.75rem) */
  .text-xs {
    font-size: 0.75684375rem !important; /* 0.75rem * 0.77625 * 1.3 - increased by 30% */
    margin-top: 0 !important; /* Match mobile mt-0 */
  }

  /* Divider elements - 77.625% of mobile to maintain ratio */
  .vertical-divider {
    width: 0.77625px; /* 1px * 0.77625 */
    min-height: 46.575px; /* 60px * 0.77625 */
    opacity: 0.4; /* Match mobile opacity */
  }

  .horizontal-connector {
    width: 19.40625px; /* 25px * 0.77625 - increased by 15% */
    height: 0.77625px; /* 1px * 0.77625 */
    opacity: 0.4; /* Match mobile opacity */
  }
}

/* Medium laptops 14-15 inch (laptop-md: 1366px+) - Scaled to 86.25% (75% * 1.15) */
@media (min-width: 1366px) and (max-width: 1535px) {
  /* Wrapper gap - 86.25% of mobile 2rem = 1.725rem */
  .agenda-card-wrapper {
    gap: 1.725rem; /* 2rem * 0.8625 - increased by 15% */
  }

  /* Card styling - 86.25% of mobile values */
  .agenda-card {
    padding: 0.8625rem !important; /* 1rem * 0.8625 (p-4 scaled) */
    padding-left: 0 !important; /* Keep padding-left: 0 from mobile */
    margin-left: 0.8625rem !important; /* 1rem * 0.8625 - increased by 15% */
  }

  /* Icon sizing - 86.25% of mobile 3rem = 2.5875rem */
  .agenda-icon-large {
    width: 2.5875rem !important; /* 3rem * 0.8625 - increased by 15% */
    height: 2.5875rem !important; /* 3rem * 0.8625 - increased by 15% */
  }

  /* Min height for content - scaled to 86.25% from 3rem */
  .min-h-\[3rem\] {
    min-height: 2.5875rem !important; /* 3rem * 0.8625 */
  }

  /* Title - scaled to 86.25% from mobile md:text-lg (1.125rem) */
  h3 {
    font-size: 0.97031250rem !important; /* 1.125rem * 0.8625 - increased by 15% */
    line-height: 1.8 !important; /* Match mobile line-height */
    padding-top: 0.43125rem !important; /* 0.5rem * 0.8625 (py-2) */
    padding-bottom: 0.43125rem !important; /* 0.5rem * 0.8625 (py-2) */
  }

  /* Time text - scaled to 86.25% from mobile text-xs (0.75rem) */
  .text-xs {
    font-size: 0.84093750rem !important; /* 0.75rem * 0.8625 * 1.3 - increased by 30% */
    margin-top: 0 !important; /* Match mobile mt-0 */
  }

  /* Divider elements - 86.25% of mobile to maintain ratio */
  .vertical-divider {
    width: 0.8625px; /* 1px * 0.8625 */
    min-height: 51.75px; /* 60px * 0.8625 */
    opacity: 0.4; /* Match mobile opacity */
  }

  .horizontal-connector {
    width: 21.5625px; /* 25px * 0.8625 - increased by 15% */
    height: 0.8625px; /* 1px * 0.8625 */
    opacity: 0.4; /* Match mobile opacity */
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
