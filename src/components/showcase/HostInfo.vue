<template>
  <component
    :is="layoutComponent"
    v-bind="$props"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Host } from '../../composables/useEventShowcase'

// Import all layout variants
import HostInfoWedding from './host-layouts/HostInfoWedding.vue'
import HostInfoBirthday from './host-layouts/HostInfoBirthday.vue'
import HostInfoDefault from './host-layouts/HostInfoDefault.vue'

interface Props {
  hosts: Host[]
  logoUrl?: string
  eventInitial: string
  primaryColor: string
  secondaryColor?: string | null
  accentColor: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  welcomeMessage?: string
  currentLanguage?: string
  eventType?: string  // NEW: Event category name for auto-detection
}

const props = defineProps<Props>()

/**
 * Layout selection strategy based on event type
 * Auto-detects from eventType prop, defaulting to HostInfoDefault for unknown types
 */
const layoutComponent = computed(() => {
  const eventType = props.eventType?.toLowerCase() || 'default'

  // Map event types to layout components
  const layoutMap: Record<string, any> = {
    // Wedding events
    'wedding': HostInfoWedding,

    // Birthday events
    'birthday': HostInfoBirthday,
    'birthday party': HostInfoBirthday,

    // Corporate events (use default for now, can create custom later)
    'corporate': HostInfoDefault,
    'corporate event': HostInfoDefault,
    'conference': HostInfoDefault,
    'seminar': HostInfoDefault,
    'workshop': HostInfoDefault,

    // Other event types use default
    'default': HostInfoDefault,
  }

  const selectedLayout = layoutMap[eventType] || HostInfoDefault

  // Return specific layout or default fallback
  return selectedLayout
})
</script>

<style scoped>
/* No styles needed - all styling handled by individual layout components */
</style>
