# GoEvent Showcase Animation System

A comprehensive, modern animation system built for the GoEvent showcase components. This system provides smooth, performant, and accessible animations while maintaining the liquid glass design aesthetic.

## Architecture Overview

### Core Composables

#### 1. `useScrollAnimations.ts`
- **Base scroll detection and visibility tracking**
- **Optimized Intersection Observer implementation**
- **Constants for consistent timing and easing**
- **Parallax scrolling utilities**
- **Smooth scrolling functions**

#### 2. `useAdvancedAnimations.ts`
- **Staggered animation system**
- **Enhanced entrance animations**
- **Momentum-based scrolling**
- **CSS-based scroll-driven animations**
- **Web Animations API integration**

#### 3. `usePerformanceOptimizations.ts`
- **Real-time performance monitoring**
- **Automatic quality adjustment**
- **Device capability detection**
- **Memory usage tracking**
- **Accessibility preference detection**

## Animation Types

### Reveal Animations
- **fadeIn**: Gentle opacity and vertical movement
- **slideUp**: Vertical slide with fade
- **slideLeft/Right**: Horizontal slide with fade
- **scaleIn**: Scale and fade entrance
- **rotateIn**: Rotation with scale entrance

### Stagger Animations
- **Sequential reveals**: Elements animate in order
- **Customizable timing**: Adjustable delays and durations
- **Container-based grouping**: Elements grouped by container
- **Index-based delays**: Natural timing progression

### Entrance Animations
- **Elastic**: Bouncy, energetic entrances
- **Bounce**: Playful bounce effects
- **Smooth**: Clean, professional transitions
- **Expo**: Fast start, smooth finish

## Usage Examples

### Basic Scroll Reveal
```typescript
import { useRevealAnimations } from '@/composables/useScrollAnimations'

const { observeRevealElement } = useRevealAnimations({
  animationType: 'slideUp',
  duration: 500,
  easing: 'cubic-bezier(0.19, 1, 0.22, 1)'
})

// In template
<div ref="elementRef">Content</div>

// In setup
onMounted(() => {
  if (elementRef.value) {
    observeRevealElement(elementRef.value, 'unique-id')
  }
})
```

### Staggered Card Animations
```typescript
import { useStaggerAnimation } from '@/composables/useAdvancedAnimations'

const { observeStaggerElement } = useStaggerAnimation({
  animationType: 'slideUp',
  staggerDelay: 150,
  duration: 600
})

// In template
<div 
  v-for="(item, index) in items" 
  :key="item.id"
  :ref="el => setupAnimation(el, item.id, index)"
>
  {{ item.content }}
</div>

// Setup function
const setupAnimation = (el, id, index) => {
  if (el) {
    observeStaggerElement(el, id, 'card-container')
  }
}
```

### Performance-Optimized Implementation
```typescript
import { usePerformanceOptimizations } from '@/composables/usePerformanceOptimizations'

const { 
  isHighPerformanceDevice, 
  prefersReducedMotion,
  createOptimizedObserver 
} = usePerformanceOptimizations()

// Conditional animation based on device capability
const animationOptions = computed(() => ({
  duration: isHighPerformanceDevice.value ? 800 : 400,
  easing: prefersReducedMotion.value ? 'ease' : 'cubic-bezier(0.19, 1, 0.22, 1)'
}))
```

## CSS Classes

### Base Animation Classes
```css
.animate-enhanced-fadeIn {
  opacity: 0;
  transform: translateY(40px) scale(0.95);
  transition: all 0.8s cubic-bezier(0.19, 1, 0.22, 1);
}

.animate-enhanced-fadeIn.is-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}
```

### Utility Classes
```css
.performance-optimized {
  contain: layout style paint;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.interactive-element {
  transition: transform 0.3s ease;
}

.interactive-element:hover {
  transform: translateY(-2px);
}
```

## Component Integration

### MainContentStage
- **Progressive section reveals**
- **Scroll-triggered animations**
- **Parallax background effects**

### AgendaSection
- **Staggered card reveals**
- **Smooth expansion animations**
- **Interactive hover effects**

### PhotoGallery
- **Momentum scrolling**
- **Enhanced photo interactions**
- **Smooth reveal animations**

### CommentSection
- **Form interaction animations**
- **Staggered comment reveals**
- **Smooth scrolling to comments**

### CoverStage
- **Entrance sequence animations**
- **Particle effect system**
- **Interactive button effects**

## Performance Features

### Automatic Optimization
- **Device capability detection**
- **FPS monitoring and adjustment**
- **Memory usage tracking**
- **Reduced motion support**

### CSS Optimizations
- **CSS containment for layout performance**
- **Hardware acceleration where beneficial**
- **Efficient will-change management**
- **Optimized transform usage**

### JavaScript Optimizations
- **Intersection Observer with adjusted thresholds**
- **Throttled scroll handlers**
- **Automatic cleanup of animation properties**
- **Memory leak prevention**

## Accessibility Support

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .animate-enhanced-fadeIn {
    transition: opacity 0.3s ease;
    transform: none !important;
  }
}
```

### High Contrast
```css
@media (prefers-contrast: high) {
  .particle {
    background: currentColor;
  }
  
  .enhanced-glass {
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid currentColor;
  }
}
```

### Focus Management
- **Preserved focus during animations**
- **Keyboard navigation support**
- **Screen reader compatibility**

## Configuration

### Animation Constants
```typescript
export const ANIMATION_CONSTANTS = {
  DURATION: {
    FAST: 300,
    NORMAL: 500,
    SLOW: 800,
    EXTRA_SLOW: 1200
  },
  EASING: {
    SMOOTH: 'cubic-bezier(0.4, 0, 0.2, 1)',
    BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    ELASTIC: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    EXPO: 'cubic-bezier(0.19, 1, 0.22, 1)'
  },
  THRESHOLD: {
    MINIMAL: 0.05,
    NORMAL: 0.1,
    HALF: 0.5,
    FULL: 1.0
  }
}
```

### Global CSS Variables
```css
:root {
  --animation-duration-fast: 300ms;
  --animation-duration-normal: 500ms;
  --animation-duration-slow: 800ms;
  --animation-easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --animation-easing-expo: cubic-bezier(0.19, 1, 0.22, 1);
}
```

## Best Practices

### Performance
1. **Use CSS transforms over layout-affecting properties**
2. **Apply will-change judiciously and clean up after animations**
3. **Leverage CSS containment for animation containers**
4. **Monitor performance metrics and adjust accordingly**

### Accessibility
1. **Always respect prefers-reduced-motion**
2. **Provide fallbacks for complex animations**
3. **Maintain focus management during transitions**
4. **Test with screen readers and keyboard navigation**

### User Experience
1. **Use consistent timing and easing curves**
2. **Provide visual feedback for interactions**
3. **Ensure animations feel purposeful, not decorative**
4. **Test on various devices and connection speeds**

## Debugging

### Performance Monitoring
```typescript
const { performanceMetrics } = usePerformanceOptimizations()

// Monitor FPS and adjust accordingly
watch(performanceMetrics, (metrics) => {
  if (metrics.fps < 30) {
    console.warn('Low FPS detected, reducing animation quality')
  }
})
```

### Animation State Debugging
```typescript
// Debug animation visibility
const debugAnimations = () => {
  const elements = document.querySelectorAll('.animate-enhanced-fadeIn')
  elements.forEach(el => {
    if (el.classList.contains('is-visible')) {
      console.log('Animated:', el)
    }
  })
}
```

This animation system provides a solid foundation for smooth, performant, and accessible animations throughout the GoEvent showcase application while maintaining the sophisticated liquid glass design aesthetic.