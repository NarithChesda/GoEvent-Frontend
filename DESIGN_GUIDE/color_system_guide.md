# GoEvent Color System

## Color Philosophy

Our color system is built on four core principles:
- **Brand Consistency**: Blue-to-purple gradient as our signature identity
- **Limited Palette**: Maximum 4 color families to maintain visual cohesion
- **Accessibility First**: All combinations meet WCAG AA standards (4.5:1 contrast)
- **Semantic Clarity**: Consistent color meanings across the application

## Primary Brand Colors

### Blue-Purple Gradient System
The heart of our brand identity, used for primary actions and brand elements.

```css
/* Core Brand Gradients */
--brand-primary: linear-gradient(to right, #2563eb, #9333ea);
--brand-primary-hover: linear-gradient(to right, #1d4ed8, #7c3aed);
--brand-light: linear-gradient(to right, #dbeafe, #f3e8ff);
--brand-subtle: linear-gradient(to bottom right, #eff6ff, #ffffff, #faf5ff);
```

### Blue Family (Primary)
Our primary brand color, representing trust, professionalism, and reliability.

| Token | Hex | Usage |
|-------|-----|-------|
| `blue-50` | `#eff6ff` | Background washes |
| `blue-100` | `#dbeafe` | Light backgrounds, badges |
| `blue-200` | `#bfdbfe` | Borders, dividers |
| `blue-500` | `#3b82f6` | Interactive elements |
| `blue-600` | `#2563eb` | Primary buttons, links |
| `blue-700` | `#1d4ed8` | Hover states, emphasis |

### Purple Family (Accent)
Our accent color, representing creativity, innovation, and premium experiences.

| Token | Hex | Usage |
|-------|-----|-------|
| `purple-50` | `#faf5ff` | Background washes |
| `purple-100` | `#f3e8ff` | Light backgrounds, badges |
| `purple-200` | `#e9d5ff` | Borders, dividers |
| `purple-500` | `#a855f7` | Interactive elements |
| `purple-600` | `#9333ea` | Primary buttons, accents |
| `purple-700` | `#7c3aed` | Hover states, emphasis |

## Neutral Colors

Professional gray scale using the slate family exclusively for consistency.

| Token | Hex | Usage |
|-------|-----|-------|
| `slate-50` | `#f8fafc` | Lightest backgrounds |
| `slate-100` | `#f1f5f9` | Card backgrounds |
| `slate-200` | `#e2e8f0` | Borders, dividers |
| `slate-300` | `#cbd5e1` | Disabled borders |
| `slate-400` | `#94a3b8` | Placeholders, disabled text |
| `slate-500` | `#64748b` | Supporting text |
| `slate-600` | `#475569` | Body text |
| `slate-700` | `#334155` | Headings |
| `slate-800` | `#1e293b` | Primary headings |
| `slate-900` | `#0f172a` | High contrast text |

## Semantic Colors

Consistent color assignments for functional meanings throughout the application.

### Success (Emerald Family)
For positive actions, completed states, and success messages.

| Token | Hex | Usage |
|-------|-----|-------|
| `emerald-50` | `#ecfdf5` | Success backgrounds |
| `emerald-100` | `#d1fae5` | Success badges |
| `emerald-500` | `#10b981` | Success icons, text |
| `emerald-600` | `#059669` | Success buttons, emphasis |

### Warning (Orange Family)
For caution states, important notices, and warnings.

| Token | Hex | Usage |
|-------|-----|-------|
| `orange-50` | `#fff7ed` | Warning backgrounds |
| `orange-100` | `#ffedd5` | Warning badges |
| `orange-500` | `#f97316` | Warning icons, text |
| `orange-600` | `#ea580c` | Warning buttons, emphasis |

### Error (Red Family)
For error states, destructive actions, and critical alerts.

| Token | Hex | Usage |
|-------|-----|-------|
| `red-50` | `#fef2f2` | Error backgrounds |
| `red-100` | `#fee2e2` | Error badges |
| `red-500` | `#ef4444` | Error icons, text |
| `red-600` | `#dc2626` | Error buttons, emphasis |

### Info (Blue Family)
Uses the same blue scale as primary brand colors for consistency.

## Color Usage Guidelines

### 1. Hierarchy Priority
1. **Brand colors** (blue/purple) for primary actions and brand elements
2. **Neutral colors** for text and backgrounds
3. **Semantic colors** only for their specific meanings
4. **Never mix** semantic colors for decoration

### 2. Gradient Usage Rules
- **Primary CTAs only**: `from-blue-600 to-purple-600` for main actions (limit 1-2 per page)
- **Subtle accents**: Light brand colors for backgrounds when needed
- **Text gradients**: Use sparingly for hero titles only
- **Accessibility**: Ensure sufficient contrast, provide solid color fallbacks

### 3. Contrast Requirements

| Use Case | Minimum Ratio | Recommended Colors |
|----------|---------------|-------------------|
| Body text | 4.5:1 | `slate-600` or darker |
| Headings | 4.5:1 | `slate-800` or `slate-900` |
| Interactive elements | 3:1 | `blue-600`, `purple-600` |
| Focus states | 4.5:1 | Blue ring with white offset |

## Background Patterns

### Section Backgrounds
```css
/* Light sections */
.bg-features { 
  background: linear-gradient(to bottom, #ffffff, #f8fafc, #ffffff); 
}

.bg-values { 
  background: linear-gradient(to bottom, #f8fafc, #ffffff, #faf5ff); 
}

.bg-testimonials { 
  background: linear-gradient(to bottom right, #f8fafc, #ffffff, #faf5ff); 
}

/* Dark sections */
.bg-stats { 
  background: linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a); 
}

/* CTA sections */
.bg-cta {
  background: white;
  /* Add floating gradient elements for depth */
}
```

### Page Backgrounds
```css
/* Main background pattern */
.bg-main {
  background: linear-gradient(to bottom right, #eff6ff, #ffffff, #faf5ff);
}

/* Authentication pages */
.bg-auth {
  background: white;
  /* Use glass morphism with animated gradient orbs */
}
```

## Prohibited Colors

To maintain visual cohesion and brand consistency, **avoid these colors**:

❌ **Indigo** - Too similar to brand blue, creates confusion  
❌ **Cyan/Teal** - Conflicts with brand identity  
❌ **Pink/Rose** - Not essential for functionality  
❌ **Gray variations** - Use slate family exclusively  
❌ **Lime/Yellow-green** - Poor accessibility contrast  
❌ **Multiple green families** - Use emerald exclusively for success states  

## Implementation Examples

### ✅ Correct Usage
```css
/* Primary button */
.btn-primary {
  background: linear-gradient(to right, #2563eb, #9333ea);
  color: white;
}

/* Success state */
.alert-success {
  background-color: #d1fae5; /* emerald-100 */
  color: #059669; /* emerald-600 */
}

/* Body text */
.text-body {
  color: #475569; /* slate-600 */
}
```

### ❌ Incorrect Usage
```css
/* Too many colors */
.avoid-this {
  background: linear-gradient(to right, #06b6d4, #10b981, #f59e0b);
}

/* Mixing brand with semantic */
.also-avoid {
  background: linear-gradient(to right, #2563eb, #10b981);
}

/* Using prohibited colors */
.dont-use {
  color: #6366f1; /* indigo - use blue instead */
}
```

## Accessibility Testing

### Tools for Validation
- **WebAIM Contrast Checker**: Verify color contrast ratios
- **Colour Contrast Analyser**: Desktop tool for testing
- **axe DevTools**: Browser extension for accessibility testing

### Testing Checklist
- [ ] All text meets minimum 4.5:1 contrast ratio
- [ ] Interactive elements meet 3:1 contrast ratio
- [ ] Focus indicators are clearly visible
- [ ] Color is not the only way to convey information
- [ ] Colors work for colorblind users (test with simulators)

## Design Tokens Implementation

### CSS Custom Properties
```css
:root {
  /* Brand colors */
  --color-brand-primary: #2563eb;
  --color-brand-accent: #9333ea;
  
  /* Neutral scale */
  --color-neutral-50: #f8fafc;
  --color-neutral-600: #475569;
  --color-neutral-900: #0f172a;
  
  /* Semantic colors */
  --color-success: #059669;
  --color-warning: #ea580c;
  --color-error: #dc2626;
  
  /* Gradients */
  --gradient-primary: linear-gradient(to right, var(--color-brand-primary), var(--color-brand-accent));
}
```

### JavaScript Tokens
```javascript
export const colors = {
  brand: {
    primary: '#2563eb',
    accent: '#9333ea',
  },
  neutral: {
    50: '#f8fafc',
    600: '#475569',
    900: '#0f172a',
  },
  semantic: {
    success: '#059669',
    warning: '#ea580c',
    error: '#dc2626',
  }
};
```

## Migration Guide

### From Existing Colors
1. **Audit current colors** - Identify all colors in use
2. **Map to new system** - Find appropriate tokens
3. **Update gradually** - Start with new components
4. **Test thoroughly** - Verify accessibility compliance

### Common Mappings
| Old Color | New Token | Notes |
|-----------|-----------|-------|
| `#3b82f6` | `blue-500` | Direct match |
| `#6b7280` | `slate-500` | Switch from gray to slate |
| `#10b981` | `emerald-500` | Success states only |
| Custom grays | Slate scale | Use closest slate value |

---

*Last updated: [Current Date]*  
*Version: 1.0*