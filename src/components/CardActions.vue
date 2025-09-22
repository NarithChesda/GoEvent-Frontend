<template>
  <div class="card-actions" :class="[alignmentClass, visibilityClass, sizeClass]">
    <slot :buttonClass="buttonClass" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** Alignment of actions */
  align?: 'left' | 'center' | 'right'
  /** Visibility behavior */
  visibility?: 'always' | 'hover' | 'focus'
  /** Size of action buttons */
  size?: 'sm' | 'md' | 'lg'
  /** Custom CSS classes */
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  align: 'right',
  visibility: 'hover',
  size: 'md',
  customClass: '',
})

// Computed classes
const alignmentClass = computed(() => {
  const alignments = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }
  return alignments[props.align]
})

const visibilityClass = computed(() => {
  const visibilities = {
    always: 'opacity-100',
    hover: 'opacity-0 group-hover:opacity-100',
    focus: 'opacity-0 group-focus-within:opacity-100',
  }
  return visibilities[props.visibility]
})

const sizeClass = computed(() => {
  const sizes = {
    sm: 'space-x-1',
    md: 'space-x-2',
    lg: 'space-x-3',
  }
  return sizes[props.size]
})

// Button class to pass to slot
const buttonClass = computed(() => {
  const sizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  }

  return [
    'card-action-btn',
    sizes[props.size],
    'text-slate-400',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'hover:scale-105',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-blue-500',
    'focus:ring-offset-1',
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
})
</script>

<style scoped>
.card-actions {
  @apply flex items-center transition-opacity duration-200;
}
</style>
