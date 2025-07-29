<template>
  <button
    :class="buttonClasses"
    :title="title"
    :aria-label="ariaLabel || title"
    @click="$emit('click', $event)"
    @keydown="handleKeydown"
  >
    <component 
      :is="icon" 
      :class="iconClasses"
      aria-hidden="true"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

interface Props {
  /** Icon component to display */
  icon: Component
  /** Button variant/type */
  variant?: 'edit' | 'delete' | 'view' | 'share' | 'favorite' | 'neutral'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Tooltip text */
  title?: string
  /** Accessibility label */
  ariaLabel?: string
  /** Whether button is disabled */
  disabled?: boolean
  /** Custom CSS classes */
  customClass?: string
}

interface Emits {
  click: [event: MouseEvent]
  keydown: [event: KeyboardEvent]
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'md',
  title: '',
  ariaLabel: '',
  disabled: false,
  customClass: ''
})

const emit = defineEmits<Emits>()

// Variant color mappings
const variantClasses = {
  edit: 'hover:text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  delete: 'hover:text-red-600 hover:bg-red-50 focus:ring-red-500',
  view: 'hover:text-green-600 hover:bg-green-50 focus:ring-green-500',
  share: 'hover:text-purple-600 hover:bg-purple-50 focus:ring-purple-500',
  favorite: 'hover:text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-500',
  neutral: 'hover:text-slate-600 hover:bg-slate-50 focus:ring-slate-500'
}

// Size mappings
const sizeClasses = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5'
}

const iconSizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5'
}

// Computed classes
const buttonClasses = computed(() => [
  'card-action-btn',
  'text-slate-400',
  'rounded-lg',
  'transition-all',
  'duration-200',
  'hover:scale-105',
  'focus:outline-none',
  'focus:ring-2',
  'focus:ring-offset-1',
  sizeClasses[props.size],
  variantClasses[props.variant],
  props.disabled ? 'opacity-50 cursor-not-allowed' : '',
  props.customClass
].filter(Boolean).join(' '))

const iconClasses = computed(() => [
  iconSizes[props.size],
  'transition-transform duration-200'
].join(' '))

// Event handlers
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('click', event as any)
  }
  emit('keydown', event)
}
</script>

<style scoped>
.card-action-btn:active {
  transform: scale(0.95);
}

.card-action-btn:disabled {
  transform: none !important;
}
</style>