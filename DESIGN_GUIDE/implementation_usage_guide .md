# GoEvent Design System - Implementation & Usage Guide

## Getting Started

### Design System Structure
The GoEvent Design System is organized into four core documents:

1. **Foundation** - Design tokens, spacing, breakpoints, and base principles
2. **Color System** - Comprehensive color palette and usage guidelines  
3. **Typography** - Font system, scales, and text hierarchy
4. **Component Library** - Reusable UI components and their variants
5. **Patterns & Interactions** - Layout patterns and animation guidelines

### Prerequisites
- Basic understanding of CSS and design principles
- Familiarity with responsive design concepts
- Access to Plus Jakarta Sans font family
- Modern browser support (CSS Grid, Custom Properties, etc.)

## Installation & Setup

### CSS Custom Properties Setup
Add these foundational custom properties to your CSS:

```css
:root {
  /* Spacing Scale (8px base) */
  --space-1: 0.125rem;   /* 2px */
  --space-2: 0.25rem;    /* 4px */
  --space-3: 0.375rem;   /* 6px */
  --space-4: 0.5rem;     /* 8px */
  --space-6: 0.75rem;    /* 12px */
  --space-8: 1rem;       /* 16px */
  --space-12: 1.5rem;    /* 24px */
  --space-16: 2rem;      /* 32px */
  --space-20: 2.5rem;    /* 40px */
  --space-24: 3rem;      /* 48px */
  --space-32: 4rem;      /* 64px */
  
  /* Color System */
  --color-primary: #2563eb;
  --color-primary-accent: #9333ea;
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-600: #475569;
  --color-neutral-900: #0f172a;
  
  /* Typography */
  --font-primary: 'Plus Jakarta Sans', system-ui, sans-serif;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5625rem;
  --text-3xl: 1.953rem;
  --text-4xl: 2.441rem;
  
  /* Animation */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  
  /* Gradients */
  --gradient-primary: linear-gradient(to right, var(--color-primary), var(--color-primary-accent));
}
```

### Font Loading
Include Plus Jakarta Sans in your project:

```html
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

Or use a local font file setup:
```css
@font-face {
  font-family: 'Plus Jakarta Sans';
  src: url('./fonts/PlusJakartaSans-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
/* Repeat for other weights... */
```

## Component Usage Guidelines

### Button Implementation

#### Basic Button Structure
```html
<button class="btn btn-primary">
  <span class="btn-text">Create Event</span>
</button>
```

#### Button with Icon
```html
<button class="btn btn-primary">
  <svg class="btn-icon" width="20" height="20">...</svg>
  <span class="btn-text">Add Item</span>
</button>
```

#### Loading State
```html
<button class="btn btn-primary btn-loading" disabled>
  <span class="btn-text">Creating...</span>
</button>
```

### Form Implementation

#### Complete Form Field
```html
<div class="form-field">
  <label for="email" class="form-label">Email Address</label>
  <input 
    type="email" 
    id="email" 
    class="form-input" 
    placeholder="Enter your email"
    required
  >
  <p class="form-helper">We'll never share your email with anyone else.</p>
</div>
```

#### Error State
```html
<div class="form-field">
  <label for="password" class="form-label">Password</label>
  <input 
    type="password" 
    id="password" 
    class="form-input form-input-error" 
    aria-describedby="password-error"
  >
  <p id="password-error" class="form-error-message">
    <svg class="form-error-icon" width="16" height="16">...</svg>
    Password must be at least 8 characters long
  </p>
</div>
```

### Card Implementation

#### Basic Card
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Event Title</h3>
    <div class="card-actions">
      <button class="card-action-button edit" title="Edit event">
        <svg width="16" height="16">...</svg>
      </button>
      <button class="card-action-button delete" title="Delete event">
        <svg width="16" height="16">...</svg>
      </button>
    </div>
  </div>
  <div class="card-body">
    <p class="card-description">Event description goes here...</p>
  </div>
  <div class="card-footer">
    <span class="card-meta">March 15, 2024</span>
    <span class="badge badge-success">Active</span>
  </div>
</div>
```

#### Interactive Card
```html
<article class="card card-interactive" role="button" tabindex="0">
  <!-- Card content -->
</article>
```

## Layout Patterns

### Section Layout
```html
<section class="bg-features">
  <div class="section-container">
    <div class="section-header">
      <div class="section-badge">
        <svg class="section-badge-icon" width="16" height="16">...</svg>
        Features
      </div>
      <h2 class="section-title">Powerful Event Management</h2>
      <p class="section-subtitle">
        Everything you need to create, manage, and track successful events.
      </p>
    </div>
    
    <div class="content-grid">
      <!-- Grid content -->
    </div>
  </div>
</section>
```

### Hero Section
```html
<section class="hero">
  <div class="section-container">
    <div class="hero-content">
      <h1 class="hero-title">
        Create Unforgettable 
        <span class="hero-title-gradient">Events</span>
      </h1>
      <p class="hero-subtitle">
        The complete platform for event planning, management, and execution.
      </p>
      <div class="hero-actions">
        <button class="btn btn-primary btn-lg">Get Started Free</button>
        <button class="btn btn-secondary btn-lg">Watch Demo</button>
      </div>
    </div>
  </div>
</section>
```

## Responsive Implementation

### Mobile-First Approach
Always start with mobile styles and enhance for larger screens:

```css
/* Mobile first (default) */
.hero-title {
  font-size: var(--text-3xl);
  line-height: 1.25;
}

/* Tablet */
@media (min-width: 768px) {
  .hero-title {
    font-size: var(--text-4xl);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .hero-title {
    font-size: var(--text-5xl);
  }
}
```

### Fluid Typography
Use clamp() for smooth scaling:

```css
.hero-title {
  font-size: clamp(var(--text-3xl), 5vw, var(--text-5xl));
}
```

### Container Queries (Modern Browsers)
```css
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: flex;
    flex-direction: row;
  }
}
```

## Accessibility Implementation

### Focus Management
```css
/* Global focus styles */
*:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Custom focus for specific components */
.btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.5);
}
```

### ARIA Labels and Roles
```html
<!-- Interactive card -->
<div 
  class="card card-interactive" 
  role="button" 
  tabindex="0"
  aria-label="View event details for Summer Festival"
>
  <!-- Card content -->
</div>

<!-- Form with validation -->
<div class="form-field">
  <label for="email">Email</label>
  <input 
    type="email" 
    id="email"
    aria-describedby="email-error"
    aria-invalid="true"
  >
  <div id="email-error" role="alert">
    Please enter a valid email address
  </div>
</div>
```

### Skip Navigation
```html
<a href="#main-content" class="skip-link">
  Skip to main content
</a>
```

## Animation Implementation

### CSS Transitions
```css
.interactive-element {
  transition: all var(--duration-normal) var(--ease-out);
}

.interactive-element:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### Respecting User Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Loading Animations
```css
.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

## Performance Optimization

### CSS Organization
```css
/* 1. Custom properties */
:root { /* ... */ }

/* 2. Base styles */
html, body, * { /* ... */ }

/* 3. Layout */
.container, .grid { /* ... */ }

/* 4. Components */
.btn, .card, .form-input { /* ... */ }

/* 5. Utilities */
.text-center, .hidden { /* ... */ }

/* 6. Media queries */
@media (min-width: 768px) { /* ... */ }
```

### Critical CSS
Inline critical styles for above-the-fold content:

```html
<style>
  /* Critical CSS for header, hero, and first-fold content */
  :root { /* essential custom properties */ }
  .hero { /* hero styles */ }
  .btn-primary { /* primary button styles */ }
</style>
```

### Font Loading Strategy
```css
/* Ensure text remains visible during font load */
@font-face {
  font-family: 'Plus Jakarta Sans';
  font-display: swap; /* or 'fallback' */
  src: url('font.woff2') format('woff2');
}
```

## Browser Support

### Modern Browsers (Recommended)
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

### Progressive Enhancement
```css
/* Base styles for all browsers */
.card {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 1rem;
}

/* Enhanced styles for modern browsers */
@supports (backdrop-filter: blur(10px)) {
  .card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
  }
}

/* CSS Grid with fallback */
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

@supports (display: grid) {
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}
```

## Testing Guidelines

### Visual Testing Checklist
- [ ] Components render correctly across browsers
- [ ] Typography scales properly on all screen sizes  
- [ ] Colors meet WCAG AA contrast requirements
- [ ] Focus states are clearly visible
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Layout doesn't break at edge cases (very long text, etc.)

### Accessibility Testing
- [ ] All interactive elements are keyboard accessible
- [ ] Screen readers can navigate the content logically
- [ ] Form validation messages are announced
- [ ] Images have appropriate alt text
- [ ] Color is not the only way information is conveyed

### Performance Testing
- [ ] Critical CSS is inlined
- [ ] Fonts load efficiently with appropriate fallbacks
- [ ] Animations use CSS transforms (not layout properties)
- [ ] Images are optimized and properly sized
- [ ] CSS is minified and gzipped in production

## Common Patterns & Examples

### Event Card Component
```html
<article class="card card-interactive">
  <div class="card-header">
    <div class="card-badge">
      <span class="badge badge-primary">Live</span>
    </div>
    <div class="card-actions">
      <button class="card-action-button edit">
        <svg width="16" height="16"><!-- edit icon --></svg>
      </button>
    </div>
  </div>
  
  <div class="card-body">
    <h3 class="card-title">Summer Music Festival</h3>
    <p class="card-description">
      Join us for an unforgettable evening of live music and entertainment.
    </p>
    <div class="card-meta">
      <span>July 15, 2024</span>
      <span>•</span>
      <span>150 attendees</span>
    </div>
  </div>
</article>
```

### Modal Dialog
```html
<div class="modal-backdrop" role="dialog" aria-modal="true">
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Create New Event</h2>
      <button class="modal-close" aria-label="Close dialog">
        <svg width="24" height="24"><!-- close icon --></svg>
      </button>
    </div>
    
    <div class="modal-body">
      <form class="form">
        <!-- Form fields -->
      </form>
    </div>
    
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Create Event</button>
    </div>
  </div>
</div>
```

### Navigation with Active States
```html
<nav class="navbar">
  <div class="navbar-container">
    <a href="/" class="navbar-logo">
      <svg class="navbar-logo-icon" width="32" height="32"><!-- logo --></svg>
      GoEvent
    </a>
    
    <div class="navbar-nav">
      <a href="/events" class="navbar-link active">Events</a>
      <a href="/calendar" class="navbar-link">Calendar</a>
      <a href="/analytics" class="navbar-link">Analytics</a>
    </div>
    
    <div class="navbar-actions">
      <button class="btn btn-primary">Create Event</button>
    </div>
  </div>
</nav>
```

## Troubleshooting

### Common Issues

#### Colors Not Displaying Correctly
- Ensure custom properties are defined in `:root`
- Check that fallback colors are provided
- Verify browser support for CSS custom properties

#### Typography Not Loading
- Check font file paths and formats
- Ensure `font-display: swap` is set
- Provide system font fallbacks

#### Animations Not Working
- Verify CSS custom properties for durations
- Check for `prefers-reduced-motion` overrides
- Ensure transform properties are used instead of layout properties

#### Layout Breaking on Mobile
- Test with actual devices, not just browser dev tools
- Check for horizontal scrolling
- Ensure touch targets meet minimum size requirements (44px)

### Browser-Specific Issues

#### Safari
- Use `-webkit-` prefixes for newer CSS features
- Test backdrop-filter support
- Check transform performance on iOS

#### Firefox
- Test custom property inheritance
- Verify grid layout behavior
- Check font rendering differences

## Migration Guide

### From Existing Styles
1. **Audit current styles** - Identify colors, fonts, spacing in use
2. **Map to design tokens** - Replace hardcoded values with custom properties  
3. **Update components gradually** - Start with new features, migrate existing ones
4. **Test thoroughly** - Ensure no visual regressions

### Version Updates
- Follow semantic versioning for breaking changes
- Provide migration guides for major updates
- Maintain backward compatibility when possible
- Document deprecated patterns with alternatives

---

*Last updated: [Current Date]*  
*Version: 1.0*