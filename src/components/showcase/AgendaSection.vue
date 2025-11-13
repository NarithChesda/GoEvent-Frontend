<template>
  <component
    :is="layoutComponent"
    v-bind="$props"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Import all layout variants
import AgendaWedding from './agenda-layouts/AgendaWedding.vue'
import AgendaBirthday from './agenda-layouts/AgendaBirthday.vue'
import AgendaDefault from './agenda-layouts/AgendaDefault.vue'

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

interface EventText {
  text_type: string
  language: string
  content: string
}

interface Props {
  agendaItems: AgendaItemData[]
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  backgroundColor?: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  eventTexts?: EventText[]
  currentLanguage?: string
  eventType?: string  // NEW: Event category name for auto-detection
}

const props = defineProps<Props>()

/**
 * Layout selection strategy based on event type
 * Auto-detects from eventType prop, defaulting to AgendaDefault for unknown types
 */
const layoutComponent = computed(() => {
  const eventType = props.eventType?.toLowerCase() || 'default'

  // Map event types to layout components
  const layoutMap: Record<string, typeof AgendaDefault | typeof AgendaWedding | typeof AgendaBirthday> = {
    // Wedding events - Elegant timeline layout
    'wedding': AgendaWedding,

    // Birthday events - Fun card-based layout
    'birthday': AgendaBirthday,
    'birthday party': AgendaBirthday,

    // Corporate events (use default for now, can create custom later)
    'corporate': AgendaDefault,
    'corporate event': AgendaDefault,
    'conference': AgendaDefault,
    'seminar': AgendaDefault,
    'workshop': AgendaDefault,

    // Other event types use default
    'default': AgendaDefault,
  }

  const selectedLayout = layoutMap[eventType] || AgendaDefault

  // Return specific layout or default fallback
  return selectedLayout
})
</script>

<style scoped>
/* No styles needed - all styling handled by individual layout components */
</style>
