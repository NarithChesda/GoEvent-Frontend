<template>
  <div class="agenda-card p-4 flex items-center gap-4">
    <!-- Icon Section (Left) -->
    <div class="flex-shrink-0">
      <div
        v-if="item.icon?.svg_code"
        class="agenda-icon-large flex items-center justify-center"
        :style="{
          '--icon-color': primaryColor,
          color: primaryColor
        }"
        v-html="processedSvgCode"
      />
      <Calendar v-else class="agenda-icon-large" :style="{ color: primaryColor }" />
    </div>

    <!-- Content Section (Right) -->
    <div class="flex-1 flex flex-col justify-between min-h-[3rem]">
      <!-- Title (Top Right) -->
      <h3
        :class="[
          'font-medium leading-loose py-2 capitalize',
          isKhmerText ? 'text-xs' : 'text-sm'
        ]"
        :style="{
          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontFamily: primaryFont || currentFont,
          lineHeight: '1.8'
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
/* Horizontal Card Styling - No background */
.agenda-card {
  transition: all 0.2s ease;
}

/* Large Icon Styling - 75% bigger than original (w-10 h-10 = 2.5rem, 75% bigger = 4.375rem) */
.agenda-icon-large {
  width: 4.375rem;
  height: 4.375rem;
  color: var(--icon-color) !important;
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
</style>
