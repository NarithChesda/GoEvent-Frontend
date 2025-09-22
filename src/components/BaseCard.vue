<template>
  <component
    :is="as"
    :class="cardClasses"
    :role="role"
    :tabindex="interactive ? 0 : undefined"
    :aria-label="ariaLabel"
    v-bind="$attrs"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- Top accent bar (optional) -->
    <div
      v-if="accentColor"
      class="absolute top-0 left-0 right-0 h-1 rounded-t-2xl transition-all duration-300"
      :class="accentColor"
      :style="accentStyle"
    />

    <!-- Card content -->
    <slot />

    <!-- Hover background effect -->
    <div
      v-if="interactive"
      class="absolute inset-0 bg-gradient-to-br from-emerald-50/0 via-sky-50/0 to-emerald-50/0 group-hover:from-emerald-50/30 group-hover:via-sky-50/20 group-hover:to-emerald-50/30 rounded-2xl transition-all duration-300 -z-10 pointer-events-none"
    />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** HTML element or Vue component to render as */
  as?: string
  /** Card variant */
  variant?: 'base' | 'interactive' | 'compact' | 'featured' | 'media'
  /** Card size */
  size?: 'sm' | 'md' | 'lg'
  /** Whether the card is interactive (clickable) */
  interactive?: boolean
  /** Role for accessibility */
  role?: string
  /** ARIA label for accessibility */
  ariaLabel?: string
  /** Top accent color (CSS class or style) */
  accentColor?: string
  /** Custom accent style */
  accentStyle?: Record<string, any>
  /** Whether the card is featured/highlighted */
  featured?: boolean
  /** Whether the card is draggable */
  draggable?: boolean
  /** Custom CSS classes */
  customClass?: string
}

interface Emits {
  click: [event: Event]
  keydown: [event: KeyboardEvent]
}

const props = withDefaults(defineProps<Props>(), {
  as: 'div',
  variant: 'base',
  size: 'md',
  interactive: false,
  role: undefined,
  ariaLabel: undefined,
  accentColor: undefined,
  accentStyle: undefined,
  featured: false,
  draggable: false,
  customClass: '',
})

const emit = defineEmits<Emits>()

// Computed classes based on props
const cardClasses = computed(() => {
  const baseClasses = [
    'relative',
    'bg-white/95',
    'backdrop-blur-sm',
    'border',
    'border-gray-200',
    'shadow-lg',
    'transition-all',
    'duration-300',
    'overflow-hidden',
  ]

  // Variant-specific classes
  const variantClasses = {
    base: ['rounded-2xl'],
    interactive: [
      'rounded-2xl',
      'cursor-pointer',
      'group',
      'hover:border-[#87CEEB]/50',
      'hover:shadow-xl',
      'hover:-translate-y-1',
      'hover:scale-[1.02]',
      'focus-within:ring-2',
      'focus-within:ring-[#1e90ff]',
      'focus-within:ring-offset-2',
    ],
    compact: ['rounded-xl'],
    featured: ['rounded-2xl', 'ring-2', 'ring-purple-200/50', 'shadow-xl'],
    media: ['rounded-2xl', 'overflow-hidden'],
  }

  // Size-specific classes
  const sizeClasses = {
    sm: ['p-4'],
    md: ['p-6'],
    lg: ['p-8'],
  }

  // Interactive states
  const interactiveClasses = props.interactive
    ? [
        'cursor-pointer',
        'group',
        'hover:border-[#87CEEB]/50',
        'hover:shadow-xl',
        'hover:-translate-y-1',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-[#1e90ff]',
        'focus:ring-offset-2',
      ]
    : []

  // Featured state
  const featuredClasses = props.featured ? ['ring-2', 'ring-purple-200', 'shadow-xl'] : []

  // Draggable state
  const draggableClasses = props.draggable ? ['hover:cursor-grab', 'active:cursor-grabbing'] : []

  return [
    ...baseClasses,
    ...variantClasses[props.variant],
    ...sizeClasses[props.size],
    ...interactiveClasses,
    ...featuredClasses,
    ...draggableClasses,
    props.customClass,
  ]
    .filter(Boolean)
    .join(' ')
})

// Event handlers
const handleClick = (event: Event) => {
  if (props.interactive) {
    emit('click', event)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (props.interactive && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault()
    emit('click', event as any)
  }
  emit('keydown', event)
}
</script>

<style scoped>
/* Enable GPU acceleration for smooth animations */
.card-base {
  will-change: transform;
  transform: translateZ(0);
}

/* Optimize animations for 60fps */
@media (prefers-reduced-motion: no-preference) {
  .card-base {
    transition:
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .card-base {
    transition: box-shadow 0.1s ease;
    transform: none !important;
  }

  .card-base:hover {
    transform: none !important;
  }
}
</style>
