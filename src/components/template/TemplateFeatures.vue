<template>
  <div class="flex flex-wrap gap-1">
    <span
      v-for="feature in visibleFeatures"
      :key="feature"
      class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded truncate"
    >
      {{ feature }}
    </span>
    <span v-if="remainingCount > 0" class="text-xs text-slate-500">
      +{{ remainingCount }} more
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { planFeatureTitle } from '@/utils/planFeatures'

interface Props {
  features: string[]
  maxVisible?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxVisible: 3,
})

// Pills, so the title half only — see planFeatures.ts for the convention.
const visibleFeatures = computed(() =>
  props.features.slice(0, props.maxVisible).map(planFeatureTitle),
)

const remainingCount = computed(() => Math.max(0, props.features.length - props.maxVisible))
</script>
