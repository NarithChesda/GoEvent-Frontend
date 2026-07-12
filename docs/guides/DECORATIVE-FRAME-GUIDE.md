# Guest Name Decorative Frame Implementation Guide

## Overview

The guest name display in the event showcase now supports **Art Deco style decorative frames** that automatically adapt to varying text lengths. This implementation uses CSS pseudo-elements with SVG decorations for optimal performance and flexibility.

## What Was Implemented

### ✅ Features
- **Adaptive Frame**: Decorations stay fixed at corners while the container expands/contracts with text length
- **Dynamic Theming**: Decorations automatically use the event's guest name color or primary color
- **Responsive Design**: Decorations scale appropriately on mobile (35px) and desktop (50px)
- **Performance Optimized**: Pure CSS solution with no JavaScript overhead
- **Touch-Friendly**: Decorations don't interfere with tap/swipe interactions (`pointer-events: none`)
- **Placeholder Asset**: Sample Art Deco corner SVG included for testing

### 📁 Files Modified/Created

1. **Created:**
   - `src/assets/decorations/art-deco-corner.svg` - Placeholder Art Deco corner decoration
   - `src/assets/decorations/README.md` - Instructions for replacing with your design files
   - `DECORATIVE-FRAME-GUIDE.md` - This documentation

2. **Modified:**
   - `src/components/showcase/CoverContentOverlay.vue`
     - Added CSS custom properties for theming (`--decoration-color`, `--decoration-size`, `--decoration-offset`)
     - Added `::before` and `::after` pseudo-elements for corner decorations
     - Added `guestNameWrapperStyle` computed property for dynamic theming
     - Added responsive adjustments for mobile and desktop
     - Added subtle border enhancement

## How It Works

### CSS Architecture

```css
.guest-name-blur-wrapper {
  position: relative;
  /* Existing blur background preserved */
  backdrop-filter: blur(10px);

  /* NEW: CSS custom properties for dynamic theming */
  --decoration-color: currentColor;      /* Set via computed style */
  --decoration-size: 45px;               /* Default size */
  --decoration-offset: -12px;            /* Position offset */
}

/* Top-left corner decoration */
.guest-name-blur-wrapper::before {
  background-image: url('@/assets/decorations/art-deco-corner.svg');
  color: var(--decoration-color);        /* SVG uses currentColor */
  /* Positioned at top-left corner */
}

/* Bottom-right corner decoration (rotated 180°) */
.guest-name-blur-wrapper::after {
  background-image: url('@/assets/decorations/art-deco-corner.svg');
  transform: rotate(180deg);
  /* Positioned at bottom-right corner */
}
```

### Dynamic Theming

The decorations automatically use the appropriate color:

```typescript
const guestNameWrapperStyle = computed(() => ({
  backgroundColor: props.backgroundColor || props.primaryColor,
  '--decoration-color': props.guestnameColor || props.primaryColor || '#FFFFFF',
}))
```

### Responsive Behavior

- **Mobile (≤640px)**: 35px decorations, -10px offset
- **Default (641-1023px)**: 45px decorations, -12px offset
- **Desktop (≥1024px)**: 50px decorations, -14px offset

## How to Replace with Your Own Design

### Option 1: Simple Replacement (Recommended)

1. **Replace the SVG file:**
   ```bash
   # Replace this file with your Art Deco corner design
   src/assets/decorations/art-deco-corner.svg
   ```

2. **IMPORTANT: Use `currentColor` in your SVG**
   ```xml
   <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45">
     <!-- Use currentColor for dynamic theming -->
     <path d="..." stroke="currentColor" fill="none"/>
     <circle cx="15" cy="2" r="1.5" fill="currentColor"/>
   </svg>
   ```

3. **Test different event color schemes** to ensure it looks good with all colors

### Option 2: Using PNG Files

1. **Add your PNG file:**
   ```
   src/assets/decorations/art-deco-corner.png
   ```

2. **Update the CSS:**
   ```css
   .guest-name-blur-wrapper::before,
   .guest-name-blur-wrapper::after {
     background-image: url('@/assets/decorations/art-deco-corner.png');
   }
   ```

3. **Note:** PNG files won't support dynamic color theming. Consider using CSS `filter` for color adjustments:
   ```css
   filter: brightness(1.2) hue-rotate(10deg);
   ```

### Option 3: Different Designs for Each Corner

1. **Create 4 separate files:**
   ```
   src/assets/decorations/corner-top-left.svg
   src/assets/decorations/corner-top-right.svg
   src/assets/decorations/corner-bottom-right.svg
   src/assets/decorations/corner-bottom-left.svg
   ```

2. **Update the CSS (remove rotation):**
   ```css
   .guest-name-blur-wrapper::before {
     background-image: url('@/assets/decorations/corner-top-left.svg');
     transform: none; /* No rotation needed */
   }

   .guest-name-blur-wrapper::after {
     background-image: url('@/assets/decorations/corner-bottom-right.svg');
     transform: none;
   }
   ```

3. **For all 4 corners**, you'll need to add wrapper elements in the template (see Advanced Customization below)

## Advanced Customization

### Adjusting Decoration Size

Edit `CoverContentOverlay.vue` line ~370:

```css
.guest-name-blur-wrapper {
  --decoration-size: 60px;      /* Increase for larger decorations */
  --decoration-offset: -18px;   /* Adjust position offset */
}
```

### Adding All 4 Corners

Currently uses 2 corners (top-left, bottom-right). To add all 4:

**Template Change:**
```vue
<div class="guest-name-container">
  <div class="guest-name-decoration-wrapper">
    <div class="guest-name-blur-wrapper" :style="guestNameWrapperStyle">
      <h2 class="scaled-guest-name" :style="guestNameTextStyle">
        {{ guestName }}
      </h2>
    </div>
  </div>
</div>
```

**CSS Addition:**
```css
.guest-name-decoration-wrapper {
  position: relative;
  display: inline-block;
}

/* Use wrapper's pseudo-elements for top-right and bottom-left */
.guest-name-decoration-wrapper::before {
  content: '';
  position: absolute;
  top: var(--decoration-offset);
  right: var(--decoration-offset);
  width: var(--decoration-size);
  height: var(--decoration-size);
  background-image: url('@/assets/decorations/art-deco-corner.svg');
  transform: rotate(90deg);
  color: var(--decoration-color);
  pointer-events: none;
  z-index: 2;
}

.guest-name-decoration-wrapper::after {
  content: '';
  position: absolute;
  bottom: var(--decoration-offset);
  left: var(--decoration-offset);
  width: var(--decoration-size);
  height: var(--decoration-size);
  background-image: url('@/assets/decorations/art-deco-corner.svg');
  transform: rotate(270deg);
  color: var(--decoration-color);
  pointer-events: none;
  z-index: 2;
}
```

### Changing Border Style

Edit `CoverContentOverlay.vue` line ~366:

```css
.guest-name-blur-wrapper {
  border: 1px solid rgba(255, 255, 255, 0.2);  /* Current subtle border */

  /* Or try: */
  border: 2px solid rgba(255, 255, 255, 0.4);  /* More prominent */
  /* Or: */
  border: none;                                 /* No border */
}
```

### Adjusting Opacity

Edit `CoverContentOverlay.vue` line ~390:

```css
.guest-name-blur-wrapper::before,
.guest-name-blur-wrapper::after {
  opacity: 0.8;  /* Current setting */

  /* Or try: */
  opacity: 0.6;  /* More subtle */
  opacity: 1.0;  /* Full opacity */
}
```

### Adding Glow Effects

```css
.guest-name-blur-wrapper::before,
.guest-name-blur-wrapper::after {
  filter: drop-shadow(0 0 10px var(--decoration-color));
}
```

## Design Recommendations

### Art Deco Style Guidelines

1. **Geometric Patterns**: Use angular, symmetrical designs
2. **Clean Lines**: 2-3px stroke width works best
3. **Subtle Details**: Small accent dots or short lines
4. **Balanced Composition**: Design should work when rotated 180°

### Size Recommendations

- **SVG viewBox**: 45x45 or 50x50
- **Actual decoration area**: 30x30px (leave 15px margin for offset positioning)
- **File size**: Keep under 3KB for optimal loading

### Color Considerations

- Use `currentColor` or `white` for SVG elements
- Avoid hardcoded colors unless you want them fixed
- Test with dark and light event backgrounds
- Opacity 0.6-0.8 works well for subtlety

## Testing Checklist

After replacing with your design, test:

- [ ] Short guest names (5-10 characters) - decorations don't overlap
- [ ] Long guest names (30+ characters) - decorations stay at corners
- [ ] Mobile viewport (320px width) - decorations scale properly
- [ ] Desktop viewport (1920px width) - decorations look good
- [ ] Different event color schemes (light/dark backgrounds)
- [ ] English text with Great Vibes font
- [ ] Khmer/non-Latin text
- [ ] Touch interaction (tap/swipe) still works

## Troubleshooting

### Decorations Not Showing

1. **Check file path:** Ensure SVG exists at `src/assets/decorations/art-deco-corner.svg`
2. **Check browser console:** Look for 404 errors
3. **Clear cache:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. **Rebuild:** Run `npm run build` to ensure assets are bundled

### Colors Not Updating

1. **Check SVG syntax:** Must use `currentColor` attribute
   ```xml
   <!-- Correct -->
   <path stroke="currentColor" />

   <!-- Wrong - hardcoded color -->
   <path stroke="#FFFFFF" />
   ```

2. **Verify computed style:** Check Vue DevTools for `guestNameWrapperStyle` values

### Decorations Overlapping

Adjust the offset:
```css
.guest-name-blur-wrapper {
  --decoration-offset: -15px;  /* Move further out */
}
```

### Decorations Too Small/Large

Adjust the size:
```css
.guest-name-blur-wrapper {
  --decoration-size: 55px;  /* Increase size */
}
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge | Mobile |
|---------|--------|---------|--------|------|--------|
| Pseudo-elements | ✅ | ✅ | ✅ | ✅ | ✅ |
| CSS Variables | ✅ | ✅ | ✅ | ✅ | ✅ |
| SVG backgrounds | ✅ | ✅ | ✅ | ✅ | ✅ |
| `currentColor` | ✅ | ✅ | ✅ | ✅ | ✅ |

**Result:** Works on all modern browsers (2020+)

## Performance Notes

- **Zero JavaScript overhead**: Pure CSS solution
- **GPU accelerated**: Uses transform and opacity
- **Minimal repaints**: Only color changes on theme switch
- **Small asset size**: Sample SVG is only 0.5KB
- **No HTTP overhead**: SVG bundled with Vite build

## Next Steps

1. **Replace the placeholder SVG** with your Art Deco design
2. **Test with various guest names** and color schemes
3. **Adjust sizes/offsets** to match your aesthetic
4. **Consider adding all 4 corners** for more elaborate designs
5. **Customize border and opacity** to your preference

## Support

- See example in: `src/assets/decorations/art-deco-corner.svg`
- Read instructions: `src/assets/decorations/README.md`
- Component file: `src/components/showcase/CoverContentOverlay.vue:355-495`

---

**Created:** 2025-11-17
**Component:** CoverContentOverlay.vue
**Feature:** Adaptive Art Deco Guest Name Frame
