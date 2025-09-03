<template>
  <span :class="badgeClasses">
    <component :is="badgeIcon" class="w-4 h-4 mr-1" />
    {{ badgeText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, Eye } from 'lucide-vue-next'

interface Props {
  status: 'active' | 'preview'
}

const props = defineProps<Props>()

const badgeClasses = computed(() => {
  const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium'
  
  switch (props.status) {
    case 'active':
      return `${baseClasses} bg-green-100 text-green-800`
    case 'preview':
      return `${baseClasses} bg-yellow-100 text-yellow-800`
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`
  }
})

const badgeIcon = computed(() => {
  switch (props.status) {
    case 'active':
      return CheckCircle
    case 'preview':
      return Eye
    default:
      return CheckCircle
  }
})

const badgeText = computed(() => {
  switch (props.status) {
    case 'active':
      return 'Active'
    case 'preview':
      return 'Preview'
    default:
      return 'Unknown'
  }
})
</script>