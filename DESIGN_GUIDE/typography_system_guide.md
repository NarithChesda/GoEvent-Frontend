# GoEvent Typography System

## Typography Philosophy

Our typography system creates clear information hierarchy, excellent readability, and consistent brand expression across all touchpoints. Built on mathematical scales and accessibility principles, it ensures both beauty and function.

## Font Family

### Primary Typeface
**Plus Jakarta Sans** - A modern, friendly sans-serif that balances professionalism with approachability.

```css
font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
```

### Font Weights Available
- **400** (Regular) - Body text, labels
- **500** (Medium) - Emphasized text, navigation
- **600** (Semibold) - Subheadings, button text
- **700** (Bold) - Headings, section titles
- **800** (Extrabold) - Hero titles, major headings

### Font Smoothing
Always apply font smoothing for optimal rendering:
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

## Type Scale

### Modular Scale (1.25 Ratio)
Our typography uses a modular scale with a 1.25 ratio for consistent visual rhythm:

| Token | Size | Pixels | Usage |
|-------|------|--------|-------|
| `text-xs` | 0.75rem | 12px | Captions, metadata |
| `text-sm` | 0.875rem | 14px | Small body text, labels |
| `text-base` | 1rem | 16px | Base size reference |
| `text-lg` | 1.125rem | 18px | **Recommended body text** |
| `text-xl` | 1.25rem | 20px | Large body text |
| `text-2xl` | 1.5625rem | 25px | Card titles |
| `text-3xl` | 1.953rem | 31px | Section headings |
| `text-4xl` | 2.441rem | 39px | Page titles |
| `text-5xl` | 3.052rem | 49px | Hero titles (mobile) |
| `text-6xl` | 3.815rem | 61px | Hero titles (tablet) |
| `text-7xl` | 4.768rem | 76px | Hero titles (desktop) |

## Line Height System

Optimized for readability across different text sizes:

```css
--leading-none: 1;        /* Large display text */
--leading-tight: 1.25;    /* Large headings */
--leading-snug: 1.375;    /* Medium headings */
--leading-normal: 1.5;    /* UI elements */
--leading-relaxed: 1.625; /* Body text */
--leading-loose: 1.75;    /* Small body text */
```

## Text Hierarchy

### Hero/Landing Pages
Perfect for making strong first impressions with clear information hierarchy.

```css
/* Hero Title */
.hero-title {
  font-size: clamp(2.441rem, 5vw, 4.768rem);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.025em;
}

/* Hero Title with Gradient */
.hero-title-gradient {
  background: linear-gradient(to right, #2563eb, #9333ea);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-font-smoothing: antialiased;
}

/* Hero Subtitle */
.hero-subtitle {
  font-size: clamp(1.125rem, 2.5vw, 1.5625rem);
  color: #334155; /* slate-700 */
  line-height: 1.625;
  max-width: 65ch;
}
```

### Section Headers
For organizing content into clear sections.

```css
/* Section Title */
.section-title {
  font-size: clamp(1.953rem, 4vw, 3.815rem);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.025em;
  color: #1e293b; /* slate-800 */
}

/* Section Subtitle */
.section-subtitle {
  font-size: clamp(1.125rem, 2vw, 1.25rem);
  color: #334155; /* slate-700 */
  line-height: 1.625;
  max-width: 48rem;
  margin: 0 auto;
}

/* Section Badge */
.section-badge {
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}
```

### Component Text
Consistent typography for UI components.

```css
/* Card Title */
.card-title {
  font-size: clamp(1.25rem, 2vw, 1.5625rem);
  font-weight: 700;
  line-height: 1.375;
  color: #1e293b; /* slate-800 */
}

/* Card Description */
.card-description {
  font-size: clamp(1rem, 1.5vw, 1.125rem);
  color: #334155; /* slate-700 */
  line-height: 1.625;
}

/* Button Text */
.button-text {
  font-size: clamp(1rem, 1.5vw, 1.125rem);
  font-weight: 600;
  letter-spacing: 0.025em;
}

/* Label Text */
.label-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b; /* slate-800 */
}

/* Helper Text */
.helper-text {
  font-size: 0.875rem;
  color: #64748b; /* slate-500 */
  line-height: 1.5;
}
```

### Body Text
Optimized for readability in long-form content.

```css
/* Primary Body */
.body-primary {
  font-size: 1.125rem; /* 18px - recommended */
  color: #334155; /* slate-700 */
  line-height: 1.625;
  max-width: 65ch; /* Optimal reading width */
}

/* Secondary Body */
.body-secondary {
  font-size: 1rem;
  color: #475569; /* slate-600 */
  line-height: 1.625;
}

/* Small Body */
.body-small {
  font-size: 0.875rem;
  color: #64748b; /* slate-500 */
  line-height: 1.75;
}
```

### Data Display
For presenting metrics, statistics, and structured data.

```css
/* Stat Number */
.stat-number {
  font-size: clamp(1.5625rem, 4vw, 2.441rem);
  font-weight: 700;
  line-height: 1;
  color: #1e293b; /* slate-800 */
}

/* Stat Label */
.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b; /* slate-500 */
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Table Header */
.table-header {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b; /* slate-800 */
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Table Cell */
.table-cell {
  font-size: 1rem;
  color: #334155; /* slate-700 */
}
```

## Text Colors (WCAG AA Compliant)

All color combinations meet WCAG AA standards for accessibility:

```css
/* Primary Text Colors */
--text-primary: #1e293b;    /* slate-800 - Main headings */
--text-secondary: #475569;  /* slate-600 - Body text */
--text-tertiary: #64748b;   /* slate-500 - Supporting text */
--text-muted: #94a3b8;      /* slate-400 - Disabled states only */
--text-inverse: #ffffff;    /* white - On dark backgrounds */

/* Interactive Colors */
--text-link: #2563eb;       /* blue-600 */
--text-link-hover: #1d4ed8; /* blue-700 */

/* Semantic Colors */
--text-success: #059669;    /* emerald-600 */
--text-error: #dc2626;      /* red-600 */
--text-warning: #ea580c;    /* orange-600 */
```

## Letter Spacing Scale

```css
.tracking-tighter { letter-spacing: -0.05em; }
.tracking-tight { letter-spacing: -0.025em; }
.tracking-normal { letter-spacing: 0; }
.tracking-wide { letter-spacing: 0.025em; }
.tracking-wider { letter-spacing: 0.05em; }
```

## Text Utilities

### Line Clamping
For truncating text with ellipsis:
```css
.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.line-clamp-2 { -webkit-line-clamp: 2; }
.line-clamp-3 { -webkit-line-clamp: 3; }
```

### Reading Width
```css
.max-w-prose { 
  max-width: 65ch; /* Optimal reading width */
}
```

### Text Rendering
```css
.antialiased {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.subpixel-antialiased {
  -webkit-font-smoothing: auto;
  -moz-osx-font-smoothing: auto;
}
```

## Responsive Typography

### Fluid Typography
Use clamp() for smooth scaling across viewport sizes:

```css
/* Hero title that scales smoothly */
.hero-fluid {
  font-size: clamp(2rem, 5vw + 1rem, 5rem);
}

/* Body text with subtle scaling */
.body-fluid {
  font-size: clamp(1rem, 0.5vw + 0.875rem, 1.125rem);
}
```

### Breakpoint-Based Scaling
For more control over specific breakpoints:

```css
.responsive-title {
  font-size: 1.953rem; /* text-3xl - mobile */
}

@media (min-width: 768px) {
  .responsive-title {
    font-size: 2.441rem; /* text-4xl - tablet */
  }
}

@media (min-width: 1024px) {
  .responsive-title {
    font-size: 3.052rem; /* text-5xl - desktop */
  }
}
```

## Accessibility Guidelines

### Minimum Requirements
- **Body text**: 16px minimum (18px recommended)
- **Interactive element text**: 14px minimum
- **Line length**: 45-75 characters per line
- **Line height**: 1.5 minimum for body text
- **Contrast ratios**: 4.5:1 for normal text, 3:1 for large text (18px+)

### Best Practices
1. **Hierarchy**: Maintain clear visual hierarchy with at least 20% size difference between levels
2. **Consistency**: Use the same text styles for similar content types
3. **Readability**: 
   - Optimal line length: 45-75 characters
   - Line height: 1.5-1.75 for body text
   - Adequate spacing between elements
4. **Performance**: Limit font weights to reduce load time
5. **Responsive**: Scale typography smoothly across breakpoints

## Implementation Examples

### Article Layout
```css
.article {
  max-width: 65ch;
  margin: 0 auto;
}

.article h1 {
  font-size: 2.441rem;
  font-weight: 700;
  line-height: 1.25;
  color: #1e293b;
  margin-bottom: 1rem;
}

.article h2 {
  font-size: 1.953rem;
  font-weight: 700;
  line-height: 1.375;
  color: #1e293b;
  margin-bottom: 0.75rem;
  margin-top: 2rem;
}

.article p {
  font-size: 1.125rem;
  color: #334155;
  line-height: 1.625;
  margin-bottom: 1rem;
}
```

### Card Component
```css
.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.375;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.card-description {
  font-size: 1rem;
  color: #334155;
  line-height: 1.625;
  margin-bottom: 1rem;
}

.card-meta {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}
```

## Testing Checklist

- [ ] All text meets minimum contrast requirements
- [ ] Font sizes are readable on all devices
- [ ] Line lengths are within optimal range (45-75 characters)
- [ ] Hierarchy is clear and consistent
- [ ] Text is legible at 200% zoom
- [ ] Font weights load efficiently
- [ ] Typography works with screen readers

---

*Last updated: [Current Date]*  
*Version: 1.0*