# GoEvent Card Design System

## Overview
This document defines the standardized card design system for the GoEvent platform, ensuring consistency, accessibility, and optimal user experience across all card components.

## Core Design Principles

### 1. Visual Hierarchy
- **Primary Content First**: Titles and key information should immediately catch the eye
- **Progressive Disclosure**: Show essential info first, details on interaction
- **Clear Sections**: Use spacing and dividers to separate content areas

### 2. Consistency
- **Unified Styling**: All cards share common base styles
- **Predictable Interactions**: Users learn once, apply everywhere
- **Cohesive Animations**: Smooth, consistent transitions

### 3. Accessibility
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: WCAG AA compliant ratios

### 4. Performance
- **Optimized Animations**: 60fps smooth transitions
- **Efficient Rendering**: Minimize repaints and reflows
- **Smart Loading**: Progressive enhancement for images

## Card Anatomy

### Base Structure
```vue
<div class="card-base">
  <!-- Optional: Status/Badge Area -->
  <div class="card-status">...</div>
  
  <!-- Optional: Media Area -->
  <div class="card-media">...</div>
  
  <!-- Content Area -->
  <div class="card-content">
    <div class="card-header">...</div>
    <div class="card-body">...</div>
    <div class="card-footer">...</div>
  </div>
  
  <!-- Optional: Actions Area -->
  <div class="card-actions">...</div>
</div>
```

## Design Tokens

### Spacing
```css
--card-padding-sm: 1rem;     /* 16px - Compact cards */
--card-padding-md: 1.5rem;   /* 24px - Default cards */
--card-padding-lg: 2rem;     /* 32px - Spacious cards */
--card-gap: 1rem;            /* 16px - Internal spacing */
```

### Border Radius
```css
--card-radius-sm: 0.75rem;   /* 12px - Subtle rounding */
--card-radius-md: 1rem;      /* 16px - Default rounding */
--card-radius-lg: 1.5rem;    /* 24px - Prominent rounding */
```

### Shadows
```css
--card-shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1);
--card-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--card-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--card-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

### Colors
```css
--card-bg-primary: rgba(255, 255, 255, 0.95);
--card-bg-secondary: rgba(255, 255, 255, 0.80);
--card-border-default: rgb(229, 231, 235);      /* gray-200 */
--card-border-hover: rgba(59, 130, 246, 0.3);   /* blue-500/30 */
```

## Card Variants

### 1. Base Card
Standard card for general content display.

```css
.card-base {
  @apply relative bg-white/95 backdrop-blur-sm border border-gray-200 
         rounded-2xl shadow-lg transition-all duration-300;
}

.card-base:hover {
  @apply border-blue-200/50 shadow-xl -translate-y-1;
}
```

### 2. Interactive Card
Cards that are clickable or have hover states.

```css
.card-interactive {
  @apply card-base cursor-pointer group;
}

.card-interactive:hover {
  @apply scale-[1.02];
}

/* Focus state for accessibility */
.card-interactive:focus-within {
  @apply ring-2 ring-blue-500 ring-offset-2;
}
```

### 3. Media Card
Cards with prominent image or video content.

```css
.card-media-container {
  @apply relative aspect-video overflow-hidden rounded-t-2xl;
}

.card-media-img {
  @apply w-full h-full object-cover transition-transform duration-300;
}

.card-interactive:hover .card-media-img {
  @apply scale-105;
}
```

### 4. Compact Card
Space-efficient cards for lists or grids.

```css
.card-compact {
  @apply card-base p-4;
}
```

### 5. Featured Card
Highlighted cards that need extra attention.

```css
.card-featured {
  @apply card-base ring-2 ring-purple-200 shadow-xl;
}

.card-featured::before {
  @apply absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 
         rounded-2xl -z-10;
}
```

## Component Patterns

### Card Header
```vue
<div class="card-header">
  <div class="flex items-start justify-between">
    <div class="flex-1 min-w-0">
      <h3 class="card-title">{{ title }}</h3>
      <p class="card-subtitle">{{ subtitle }}</p>
    </div>
    <div class="card-actions-inline">
      <!-- Action buttons -->
    </div>
  </div>
</div>
```

**Styles:**
```css
.card-title {
  @apply text-xl font-bold text-slate-900 leading-tight truncate
         group-hover:text-transparent group-hover:bg-clip-text 
         group-hover:bg-gradient-to-r group-hover:from-blue-600 
         group-hover:to-purple-600 transition-all duration-300;
}

.card-subtitle {
  @apply text-sm text-slate-600 mt-1;
}
```

### Card Actions
```vue
<div class="card-actions">
  <button class="card-action-btn card-action-edit">
    <Edit2 class="w-4 h-4" />
  </button>
  <button class="card-action-btn card-action-delete">
    <Trash2 class="w-4 h-4" />
  </button>
</div>
```

**Styles:**
```css
.card-actions {
  @apply flex items-center space-x-1 opacity-0 group-hover:opacity-100 
         transition-opacity duration-200;
}

.card-action-btn {
  @apply p-2 text-slate-400 rounded-lg transition-all duration-200;
}

.card-action-edit:hover {
  @apply text-blue-600 bg-blue-50;
}

.card-action-delete:hover {
  @apply text-red-600 bg-red-50;
}
```

### Card Badges
```vue
<span class="card-badge card-badge-primary">Primary</span>
<span class="card-badge card-badge-success">Success</span>
<span class="card-badge card-badge-warning">Warning</span>
```

**Styles:**
```css
.card-badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full 
         text-xs font-medium;
}

.card-badge-primary {
  @apply bg-gradient-to-r from-blue-500 to-purple-600 text-white;
}

.card-badge-success {
  @apply bg-green-100 text-green-800;
}

.card-badge-warning {
  @apply bg-orange-100 text-orange-800;
}
```

## Responsive Design

### Mobile Optimization
```css
/* Mobile-first approach */
.card-base {
  @apply p-4 rounded-xl;
}

/* Tablet and up */
@media (min-width: 768px) {
  .card-base {
    @apply p-6 rounded-2xl;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .card-base {
    @apply hover:scale-[1.02];
  }
}
```

### Grid Layouts
```css
.card-grid {
  @apply grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
}

.card-list {
  @apply space-y-4;
}
```

## Accessibility Guidelines

### Focus States
```css
.card-interactive:focus {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

.card-action-btn:focus {
  @apply outline-none ring-2 ring-blue-500;
}
```

### ARIA Labels
```vue
<div 
  role="article"
  :aria-label="`${cardType} card: ${title}`"
  class="card-base"
>
  <button
    :aria-label="`Edit ${title}`"
    class="card-action-btn"
  >
    <Edit2 class="w-4 h-4" aria-hidden="true" />
  </button>
</div>
```

### Keyboard Navigation
- All interactive elements must be reachable via Tab
- Actions should be triggered with Enter or Space
- Escape should close any opened modals

## Animation Guidelines

### Hover Transitions
```css
.card-hover-lift {
  @apply transition-all duration-300 ease-out;
}

.card-hover-lift:hover {
  @apply -translate-y-1 shadow-xl;
}
```

### Content Transitions
```css
.card-content-fade {
  @apply transition-opacity duration-200;
}

.card-expand {
  @apply transition-all duration-300 ease-in-out;
}
```

### Performance Optimization
```css
/* Use transform for animations instead of position */
.card-base {
  will-change: transform;
  transform: translateZ(0); /* Enable GPU acceleration */
}

/* Contain layout shifts */
.card-media-container {
  contain: layout;
}
```

## Implementation Examples

### Event Card
```vue
<template>
  <article 
    class="card-interactive"
    :aria-label="`Event card: ${event.title}`"
  >
    <!-- Status badges -->
    <div class="absolute top-4 left-4 z-10">
      <span v-if="event.is_ongoing" class="card-badge card-badge-success">
        <div class="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
        Live Now
      </span>
    </div>

    <!-- Media -->
    <div class="card-media-container">
      <img 
        :src="event.banner_image" 
        :alt="event.title"
        class="card-media-img"
      />
    </div>

    <!-- Content -->
    <div class="card-content p-6">
      <div class="card-header">
        <h3 class="card-title">{{ event.title }}</h3>
        <p class="card-subtitle">{{ formatDate(event.start_date) }}</p>
      </div>

      <div class="card-body mt-4">
        <p class="text-slate-600 line-clamp-3">
          {{ event.description }}
        </p>
      </div>

      <div class="card-footer mt-4 flex items-center justify-between">
        <div class="flex items-center space-x-4 text-sm text-slate-500">
          <span class="flex items-center">
            <Users class="w-4 h-4 mr-1" />
            {{ event.attendees_count }}
          </span>
          <span class="flex items-center">
            <MapPin class="w-4 h-4 mr-1" />
            {{ event.location }}
          </span>
        </div>

        <div class="card-actions">
          <button 
            @click.stop="editEvent"
            class="card-action-btn card-action-edit"
            :aria-label="`Edit ${event.title}`"
          >
            <Edit2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </article>
</template>
```

### Simple Info Card
```vue
<template>
  <div class="card-base p-4">
    <div class="flex items-center space-x-3">
      <div class="flex-shrink-0">
        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Calendar class="w-5 h-5 text-blue-600" />
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-medium text-slate-900 truncate">
          {{ title }}
        </h4>
        <p class="text-sm text-slate-500">
          {{ description }}
        </p>
      </div>
    </div>
  </div>
</template>
```

## Best Practices

### Do's
1. ✅ Use consistent spacing and sizing tokens
2. ✅ Implement proper focus states for accessibility
3. ✅ Optimize images with lazy loading and proper sizing
4. ✅ Use semantic HTML elements
5. ✅ Test on multiple screen sizes
6. ✅ Maintain visual hierarchy
7. ✅ Use GPU-accelerated animations

### Don'ts
1. ❌ Mix different card styles inconsistently
2. ❌ Forget hover and focus states
3. ❌ Use position-based animations (use transform)
4. ❌ Neglect mobile touch targets (min 44px)
5. ❌ Override base styles without reason
6. ❌ Add too many animations (causes distraction)
7. ❌ Ignore color contrast requirements

## Migration Guide

To update existing cards to the new system:

1. Replace custom styles with design tokens
2. Update border radius to use consistent values
3. Implement proper hover states with scale transforms
4. Add focus states for accessibility
5. Ensure action buttons follow the new pattern
6. Update shadows to use the standardized system
7. Test responsive behavior on all breakpoints

## Component Checklist

When creating a new card component:

- [ ] Uses base card styles
- [ ] Has proper hover states
- [ ] Includes focus indicators
- [ ] Follows spacing tokens
- [ ] Uses consistent border radius
- [ ] Implements proper shadows
- [ ] Has responsive design
- [ ] Includes ARIA labels
- [ ] Optimizes animations
- [ ] Follows color contrast guidelines
- [ ] Uses semantic HTML
- [ ] Lazy loads images (if applicable)