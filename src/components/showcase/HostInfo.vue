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
import HostInfoHousewarming from './host-layouts/HostInfoHousewarming.vue'
import HostInfoFuneral from './host-layouts/HostInfoFuneral.vue'
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
  instructionText?: string
  currentLanguage?: string
  eventType?: string  // NEW: Event category name for auto-detection
  /** Render the welcome header row above the host content. Driven by cover_stage_layout.showWelcomeHeaderText. */
  showWelcomeHeaderText?: boolean
  /** Render the first host's name directly beneath the sample-logo avatar. Driven by cover_stage_layout.showHostNameUnderLogo. */
  showHostNameUnderLogo?: boolean
  /** Template-provided base sample logo (transparency) — used by layouts that render the cover-stage sample-logo overlay. */
  sampleLogoOne?: string | null
  /** Template-provided overlay sample logo (transparency) — its opaque shape clips the first host image. */
  sampleLogoTwo?: string | null
  /** First host profile image — clipped by sample_logo_2's shape when both are available. */
  firstHostImage?: string | null
  /** First host display name — used as alt text for the clipped host image. */
  firstHostName?: string
  /** CSS variables (--host-clip-offset-*) from cover_stage_layout for panning the host photo inside the clip shape. */
  hostClipStyle?: Record<string, string>
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

    // Housewarming events
    'housewarming': HostInfoHousewarming,
    'housewarming party': HostInfoHousewarming,

    // Funeral events
    'funeral': HostInfoFuneral,
    'funeral service': HostInfoFuneral,

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
