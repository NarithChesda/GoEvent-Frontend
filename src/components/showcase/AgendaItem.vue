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
        class="text-xs mt-0"
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

/* Small laptops 13-inch (laptop-sm: 1024px) - Scaled to 67.5% matching mobile exactly */
@media (min-width: 1024px) and (max-width: 1365px) {
  /* Wrapper gap - 67.5% of mobile 2rem = 1.35rem */
  .agenda-card-wrapper {
    gap: 1.35rem; /* 2rem * 0.675 - exact mobile ratio */
  }

  /* Card styling - 67.5% of mobile values */
  .agenda-card {
    padding: 0.675rem !important; /* 1rem * 0.675 (p-4 scaled) */
    padding-left: 0 !important; /* Keep padding-left: 0 from mobile */
    margin-left: 0.675rem !important; /* 1rem * 0.675 - exact mobile ratio */
  }

  /* Icon sizing - 67.5% of mobile 3rem = 2.025rem */
  .agenda-icon-large {
    width: 2.025rem !important; /* 3rem * 0.675 - exact mobile ratio */
    height: 2.025rem !important; /* 3rem * 0.675 - exact mobile ratio */
  }

  /* Min height for content - scaled to 67.5% from 3rem */
  .min-h-\[3rem\] {
    min-height: 2.025rem !important; /* 3rem * 0.675 */
  }

  /* Title - scaled to 67.5% from mobile md:text-lg (1.125rem) */
  h3 {
    font-size: 0.759375rem !important; /* 1.125rem * 0.675 - exact mobile ratio */
    line-height: 1.8 !important; /* Match mobile line-height */
    padding-top: 0.3375rem !important; /* 0.5rem * 0.675 (py-2) */
    padding-bottom: 0.3375rem !important; /* 0.5rem * 0.675 (py-2) */
  }

  /* Time text - scaled to 67.5% from mobile text-xs (0.75rem) */
  .text-xs {
    font-size: 0.50625rem !important; /* 0.75rem * 0.675 - exact mobile ratio */
    margin-top: 0 !important; /* Match mobile mt-0 */
  }

  /* Divider elements - 67.5% of mobile to maintain ratio */
  .vertical-divider {
    width: 0.675px; /* 1px * 0.675 */
    min-height: 40.5px; /* 60px * 0.675 */
    opacity: 0.4; /* Match mobile opacity */
  }

  .horizontal-connector {
    width: 16.875px; /* 25px * 0.675 - exact mobile ratio */
    height: 0.675px; /* 1px * 0.675 */
    opacity: 0.4; /* Match mobile opacity */
  }
}

/* Medium laptops 14-15 inch (laptop-md: 1366px+) - Scaled to 75% matching mobile exactly */
@media (min-width: 1366px) and (max-width: 1535px) {
  /* Wrapper gap - 75% of mobile 2rem = 1.5rem */
  .agenda-card-wrapper {
    gap: 1.5rem; /* 2rem * 0.75 - exact mobile ratio */
  }

  /* Card styling - 75% of mobile values */
  .agenda-card {
    padding: 0.75rem !important; /* 1rem * 0.75 (p-4 scaled) */
    padding-left: 0 !important; /* Keep padding-left: 0 from mobile */
    margin-left: 0.75rem !important; /* 1rem * 0.75 - exact mobile ratio */
  }

  /* Icon sizing - 75% of mobile 3rem = 2.25rem */
  .agenda-icon-large {
    width: 2.25rem !important; /* 3rem * 0.75 - exact mobile ratio */
    height: 2.25rem !important; /* 3rem * 0.75 - exact mobile ratio */
  }

  /* Min height for content - scaled to 75% from 3rem */
  .min-h-\[3rem\] {
    min-height: 2.25rem !important; /* 3rem * 0.75 */
  }

  /* Title - scaled to 75% from mobile md:text-lg (1.125rem) */
  h3 {
    font-size: 0.84375rem !important; /* 1.125rem * 0.75 - exact mobile ratio */
    line-height: 1.8 !important; /* Match mobile line-height */
    padding-top: 0.375rem !important; /* 0.5rem * 0.75 (py-2) */
    padding-bottom: 0.375rem !important; /* 0.5rem * 0.75 (py-2) */
  }

  /* Time text - scaled to 75% from mobile text-xs (0.75rem) */
  .text-xs {
    font-size: 0.5625rem !important; /* 0.75rem * 0.75 - exact mobile ratio */
    margin-top: 0 !important; /* Match mobile mt-0 */
  }

  /* Divider elements - 75% of mobile to maintain ratio */
  .vertical-divider {
    width: 0.75px; /* 1px * 0.75 */
    min-height: 45px; /* 60px * 0.75 */
    opacity: 0.4; /* Match mobile opacity */
  }

  .horizontal-connector {
    width: 18.75px; /* 25px * 0.75 - exact mobile ratio */
    height: 0.75px; /* 1px * 0.75 */
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
