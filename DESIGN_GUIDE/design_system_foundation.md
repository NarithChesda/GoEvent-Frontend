# GoEvent Design System Foundation

## Overview
The GoEvent design system provides a unified foundation for building consistent, accessible, and delightful event management experiences. Our system prioritizes accessibility, systematic consistency, and performance while maintaining a cohesive brand identity centered around our blue-to-purple gradient signature.

## Core Principles

### 1. Accessibility First
- WCAG AA compliance across all components
- Keyboard navigation support
- Screen reader compatibility
- High contrast ratios (minimum 4.5:1 for text)

### 2. Systematic Consistency
- Unified visual language across all touchpoints
- Predictable interaction patterns
- Consistent spacing and typography scales
- Standardized component behaviors

### 3. Progressive Enhancement
- Mobile-first responsive design
- Graceful degradation for older browsers
- Performance-optimized interactions
- Reduced motion support

### 4. Brand Coherence
- Blue-to-purple gradient as primary brand identity
- Restrained use of gradients for maximum impact
- Consistent color semantics throughout

## Design Tokens

### Spacing Scale (8px Base Unit)
```css
--space-0: 0;
--space-1: 0.125rem;  /* 2px */
--space-2: 0.25rem;   /* 4px */
--space-3: 0.375rem;  /* 6px */
--space-4: 0.5rem;    /* 8px - Base unit */
--space-6: 0.75rem;   /* 12px */
--space-8: 1rem;      /* 16px */
--space-12: 1.5rem;   /* 24px */
--space-16: 2rem;     /* 32px */
--space-20: 2.5rem;   /* 40px */
--space-24: 3rem;     /* 48px */
--space-32: 4rem;     /* 64px */
--space-40: 5rem;     /* 80px */
--space-48: 6rem;     /* 96px */
--space-64: 8rem;     /* 128px */
```

### Border Radius Scale
```css
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-3xl: 2rem;     /* 32px */
--radius-full: 9999px;  /* Fully rounded */
```

### Shadow Scale
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
--shadow-inner: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);
```

### Component Sizing Tokens
```css
/* Icon sizes */
--icon-xs: 0.75rem;   /* 12px */
--icon-sm: 1rem;      /* 16px */
--icon-md: 1.25rem;   /* 20px */
--icon-lg: 1.5rem;    /* 24px */
--icon-xl: 2rem;      /* 32px */

/* Button sizes */
--btn-height-sm: 2rem;     /* 32px */
--btn-height-md: 2.5rem;   /* 40px */
--btn-height-lg: 3rem;     /* 48px */
--btn-height-xl: 3.5rem;   /* 56px */

/* Touch targets */
--touch-target-min: 2.75rem; /* 44px */
--touch-target-large: 3.5rem; /* 56px */
```

## Responsive Breakpoints

### Breakpoint System
```css
/* Mobile first approach */
--breakpoint-sm: 40rem;    /* 640px */
--breakpoint-md: 48rem;    /* 768px */
--breakpoint-lg: 64rem;    /* 1024px */
--breakpoint-xl: 80rem;    /* 1280px */
--breakpoint-2xl: 96rem;   /* 1536px */
```

### Container Widths
```css
.container-sm { max-width: 24rem; }    /* 384px */
.container-md { max-width: 42rem; }    /* 672px */
.container-lg { max-width: 56rem; }    /* 896px */
.container-xl { max-width: 72rem; }    /* 1152px */
.container-2xl { max-width: 80rem; }   /* 1280px */
```

## Animation System

### Duration Scale
```css
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

### Easing Functions
```css
--ease-linear: cubic-bezier(0, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Layout Patterns

### Grid System
```css
.grid-12 {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1.5rem;
}

.grid-responsive {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
```

### Flexbox Utilities
```css
.flex-center { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
}

.flex-between { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
}

.flex-col-center { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
}
```

## Accessibility Guidelines

### Focus Management
```css
.focus-ring {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primary-500), 0 0 0 4px var(--color-primary-100);
}

.focus-visible-only:focus:not(:focus-visible) {
  box-shadow: none;
}

.skip-link {
  position: absolute;
  top: 0;
  left: 0;
  background: var(--color-primary-600);
  color: white;
  padding: 0.5rem 1rem;
  transform: translateY(-100%);
  transition: transform 0.2s;
}

.skip-link:focus {
  transform: translateY(0);
}
```

### Screen Reader Support
- Use semantic HTML elements
- Provide descriptive alt text for images
- Include proper ARIA labels and roles
- Maintain logical heading hierarchy (h1 → h6)

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Provide clear focus indicators
- Support standard keyboard shortcuts
- Implement proper tab order

## Z-Index Scale
```css
--z-base: 0;
--z-docked: 10;
--z-dropdown: 1000;
--z-sticky: 1100;
--z-fixed: 1200;
--z-modal-backdrop: 1300;
--z-modal: 1400;
--z-popover: 1500;
--z-tooltip: 1600;
--z-toast: 1700;
```

## Usage Guidelines

### When to Use This Foundation
- Starting a new project or feature
- Establishing consistent spacing and sizing
- Setting up responsive layouts
- Implementing accessibility standards

### Implementation Notes
- Always use design tokens instead of hardcoded values
- Test with keyboard navigation and screen readers
- Validate color contrast ratios
- Consider reduced motion preferences
- Follow mobile-first responsive design

## Next Steps
This foundation document should be paired with:
1. **Color System** - Comprehensive color palette and usage guidelines
2. **Typography** - Font system, scales, and text hierarchy
3. **Component Library** - Reusable UI components
4. **Patterns** - Common layout and interaction patterns

---

*Last updated: [Current Date]*  
*Version: 1.0*