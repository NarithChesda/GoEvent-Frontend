<template>
  <div class="p-3 flex flex-col items-center text-center gap-3">
    <!-- Icon -->
    <div class="flex-shrink-0">
      <div 
        v-if="item.icon?.svg_code" 
        class="w-10 h-10 flex items-center justify-center agenda-icon"
        :style="{ 
          '--icon-color': primaryColor,
          color: primaryColor
        }"
        v-html="processedSvgCode"
      />
      <Calendar v-else class="w-10 h-10" :style="{ color: primaryColor }" />
    </div>
    
    <!-- Content -->
    <div class="w-full">
      <h3 
        class="text-sm font-semibold mb-1" 
        :style="{ 
          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }"
      >
        {{ item.title }}
      </h3>
      <div 
        class="flex items-center justify-center gap-3 text-xs" 
        :style="{ color: primaryColor, opacity: '0.6' }"
      >
        <span v-if="item.start_time_text">{{ item.start_time_text }}</span>
        <span v-if="item.end_time_text">- {{ item.end_time_text }}</span>
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
</script>

<style scoped>
/* Agenda Icon Styling */
.agenda-icon {
  color: var(--icon-color) !important;
}

.agenda-icon svg {
  width: 100% !important;
  height: 100% !important;
  fill: var(--icon-color) !important;
  stroke: var(--icon-color) !important;
  color: var(--icon-color) !important;
}

.agenda-icon svg * {
  fill: var(--icon-color) !important;
  stroke: var(--icon-color) !important;
  color: var(--icon-color) !important;
}

.agenda-icon svg path,
.agenda-icon svg circle,
.agenda-icon svg rect,
.agenda-icon svg polygon,
.agenda-icon svg polyline,
.agenda-icon svg line,
.agenda-icon svg ellipse {
  fill: var(--icon-color) !important;
  stroke: var(--icon-color) !important;
}
</style>