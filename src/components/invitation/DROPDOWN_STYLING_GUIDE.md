# Guest Groups Dropdown Styling Guide

This document provides comprehensive documentation for the dropdown component styling used in the `GuestGroupsView.vue` component.

## Table of Contents

- [Overview](#overview)
- [Component Structure](#component-structure)
- [Dropdown Button](#dropdown-button)
- [Dropdown Menu](#dropdown-menu)
- [Menu Items](#menu-items)
- [Group Color Indicator](#group-color-indicator)
- [Animations & Transitions](#animations--transitions)
- [Z-Index Hierarchy](#z-index-hierarchy)
- [Click-Outside Handler](#click-outside-handler)
- [Accessibility Features](#accessibility-features)
- [Customization Guide](#customization-guide)

---

## Overview

The dropdown component is a custom-built filter selector for guest groups. It replaces the previous horizontal scrolling pill design with a more compact dropdown interface that:

- Shows the currently selected group filter
- Opens a menu overlay with all available groups
- Supports keyboard navigation and screen readers
- Provides smooth animations for open/close states
- Handles proper z-index layering to appear above content

**Location:** Lines 121-186 in `GuestGroupsView.vue`

---

## Component Structure

```
<div class="relative z-[100]">                    <!-- Dropdown Container -->
  <button>                                         <!-- Dropdown Button -->
    <Filter />
    <span>{{ activeFilterLabel }}</span>
    <ChevronDown />
  </button>

  <Transition name="dropdown">
    <div class="absolute top-full...">           <!-- Dropdown Menu -->
      <button>All Groups</button>                <!-- Menu Item -->
      <button v-for="group in groups">           <!-- Group Items -->
        <div class="w-3 h-3 rounded-full" />     <!-- Color Indicator -->
        <span>{{ group.name }}</span>
      </button>
    </div>
  </Transition>

  <div class="fixed inset-0" />                  <!-- Click-Outside Overlay -->
</div>
```

---

## Dropdown Button

**Location:** Lines 122-131

### Tailwind Classes Breakdown

| Class | Purpose | Value |
|-------|---------|-------|
| `flex items-center gap-2` | Layout | Horizontal flexbox, vertically centered, 0.5rem gap |
| `px-3 py-2` | Spacing | Horizontal: 0.75rem, Vertical: 0.5rem |
| `bg-white` | Background | White background color |
| `border border-slate-200` | Border | 1px solid light gray border |
| `rounded-lg` | Border Radius | 0.5rem (8px) smooth corners |
| `text-sm font-medium` | Typography | 14px font size, 500 weight |
| `hover:border-emerald-300` | Hover State | Border → emerald-300 on hover |
| `hover:bg-emerald-50` | Hover State | Background → emerald-50 on hover |
| `min-w-[180px]` | Sizing | Minimum 180px width |
| `transition-all duration-300` | Animation | 300ms smooth transition |

### Button Internal Structure

```vue
<button class="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg...">
  <!-- Icon -->
  <Filter class="w-4 h-4 text-slate-600" />

  <!-- Label (grows to fill space) -->
  <span class="flex-1 text-left text-slate-900 truncate">
    {{ activeFilterLabel }}
  </span>

  <!-- Chevron (rotates when open) -->
  <ChevronDown
    class="w-4 h-4 text-slate-400 transition-transform flex-shrink-0"
    :class="{ 'rotate-180': isDropdownOpen }"
  />
</button>
```

### Key Features

- **Truncation:** The label uses `truncate` to prevent overflow with ellipsis
- **Icon Rotation:** ChevronDown rotates 180° when dropdown is open
- **Flex Growth:** Middle span has `flex-1` to fill available space
- **Shrink Prevention:** Icons use `flex-shrink-0` to maintain size

---

## Dropdown Menu

**Location:** Lines 135-177

### Container Classes

| Class | Purpose | Value |
|-------|---------|-------|
| `absolute top-full left-0 mt-2` | Position | Below button, 0.5rem margin-top |
| `w-full min-w-[250px]` | Width | Full width of parent, minimum 250px |
| `bg-white` | Background | White background |
| `border border-slate-200` | Border | 1px solid light gray |
| `rounded-xl` | Border Radius | 0.75rem (12px) prominent corners |
| `shadow-xl` | Shadow | Extra large shadow for depth |
| `z-[100]` | Z-Index | High z-index for proper layering |
| `max-h-[400px] overflow-y-auto` | Scrolling | Maximum 400px height with scroll |

### Menu Structure

```vue
<div class="absolute top-full left-0 mt-2 w-full min-w-[250px] bg-white border...">
  <!-- "All Groups" Option -->
  <button>
    <Filter class="w-4 h-4" />
    <span class="flex-1 text-left">All Groups</span>
    <span class="text-xs opacity-75">({{ totalGuestCount }})</span>
  </button>

  <!-- Divider -->
  <div class="border-t border-slate-100"></div>

  <!-- Individual Group Options -->
  <button v-for="group in groups" :key="group.id">
    <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: group.color }" />
    <span class="flex-1 text-left truncate">{{ group.name }}</span>
    <span class="text-xs opacity-75">({{ group.guest_count }})</span>
  </button>
</div>
```

---

## Menu Items

**Location:** Lines 141-153 (All Groups), 159-176 (Individual Groups)

### Button Classes

| Class | Purpose | Value |
|-------|---------|-------|
| `w-full` | Width | Full width of container |
| `flex items-center gap-3` | Layout | Horizontal flex, centered, 0.75rem gap |
| `px-4 py-3` | Padding | 1rem horizontal, 0.75rem vertical |
| `text-sm font-medium` | Typography | 14px font, 500 weight |
| `transition-all duration-200` | Animation | 200ms smooth transition |

### State-Based Styling

#### Default State
```css
text-slate-700 hover:bg-slate-50
```
- Dark gray text (#334155)
- Light gray background on hover (#f8fafc)

#### Active/Selected State
```css
bg-gradient-to-r from-emerald-500 to-blue-500 text-white
```
- Gradient background (emerald → blue)
- White text for contrast

### Dynamic Class Binding

```vue
:class="[
  'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200',
  activeFilter === 'all'
    ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white'
    : 'text-slate-700 hover:bg-slate-50'
]"
```

---

## Group Color Indicator

**Location:** Lines 170-173

### Visual Characteristics

| Property | Value | Purpose |
|----------|-------|---------|
| Size | `w-3 h-3` | 12px × 12px square |
| Shape | `rounded-full` | Perfect circle |
| Behavior | `flex-shrink-0` | Prevents compression in flex layout |
| Color (Default) | `#3498db` | Blue if no color specified |
| Color (Active) | `white` | White when group is selected |

### Implementation

```vue
<div
  class="w-3 h-3 rounded-full flex-shrink-0"
  :style="{
    backgroundColor: activeFilter === group.id.toString()
      ? 'white'
      : (group.color || '#3498db')
  }"
/>
```

### Color Logic

1. **If group is selected:** Display white circle (contrasts with gradient)
2. **If group has custom color:** Use `group.color` from database
3. **Fallback:** Default to `#3498db` (blue)

---

## Animations & Transitions

### Dropdown Transition

**Location:** Lines 625-634 in styles section

```css
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
```

### Animation Behavior

| State | Opacity | Transform | Duration |
|-------|---------|-----------|----------|
| Closed (Initial) | 0 | translateY(-10px) | - |
| Opening | 0 → 1 | -10px → 0px | 200ms |
| Open (Final) | 1 | translateY(0) | - |
| Closing | 1 → 0 | 0px → -10px | 200ms |

### Easing Function

- **Type:** `ease` (cubic-bezier)
- **Effect:** Smooth acceleration and deceleration
- **Feel:** Natural, polished animation

### Usage in Template

```vue
<Transition name="dropdown">
  <div v-if="isDropdownOpen" class="absolute...">
    <!-- Menu content -->
  </div>
</Transition>
```

---

## Z-Index Hierarchy

### Layer Stack (Bottom to Top)

| Element | Z-Index | Purpose |
|---------|---------|---------|
| Base content | `z-0` | Guest list scrollable container |
| Pagination bar | `z-10` | Filter/pagination controls bar |
| Click-outside overlay | `z-[90]` | Invisible click detector |
| Dropdown container | `z-[100]` | Parent dropdown wrapper |
| Dropdown menu | `z-[100]` | Absolute positioned menu |

### Visual Representation

```
┌─────────────────────────────────────┐
│  Dropdown Menu (z-100)              │ ← Highest
├─────────────────────────────────────┤
│  Dropdown Container (z-100)         │
├─────────────────────────────────────┤
│  Click Overlay (z-90)               │
├─────────────────────────────────────┤
│  Pagination Bar (z-10)              │
├─────────────────────────────────────┤
│  Guest List (z-0)                   │ ← Lowest
└─────────────────────────────────────┘
```

### Why This Hierarchy?

1. **Guest list at z-0:** Base layer, should not interfere
2. **Pagination at z-10:** Always visible above list
3. **Overlay at z-90:** Catches clicks outside dropdown
4. **Dropdown at z-100:** Must appear above everything

---

## Click-Outside Handler

**Location:** Lines 181-185

### Implementation

```vue
<div
  v-if="isDropdownOpen"
  @click="isDropdownOpen = false"
  class="fixed inset-0 z-[90]"
></div>
```

### Classes Breakdown

| Class | Purpose |
|-------|---------|
| `fixed` | Fixed positioning relative to viewport |
| `inset-0` | Covers entire viewport (top/right/bottom/left: 0) |
| `z-[90]` | Below dropdown menu (z-100) but above content |

### Behavior

1. **Invisible Overlay:** No background color, completely transparent
2. **Full Coverage:** Covers entire screen except dropdown menu
3. **Click Detection:** Any click closes the dropdown
4. **Z-Index Position:** Sits between content and dropdown menu

### Event Handler Logic

```javascript
const selectFilter = (filterId: string) => {
  activeFilter.value = filterId
  isDropdownOpen.value = false  // Closes dropdown after selection
}
```

- Clicking menu item: Closes dropdown via `selectFilter()`
- Clicking outside: Closes dropdown via overlay click handler
- Clicking button: Toggles dropdown open/closed

---

## Accessibility Features

### Keyboard Navigation

- **Tab:** Navigate between focusable elements
- **Enter/Space:** Activate button or menu item
- **Escape:** Close dropdown (handled by global listeners)

### Screen Reader Support

```vue
<button
  title="Mark all selected as sent"
  class="p-1.5..."
>
  <Send class="w-4 h-4" />
</button>
```

- **Title Attributes:** Provide hover tooltips and screen reader labels
- **Semantic HTML:** Uses proper `<button>` elements
- **ARIA Labels:** Container has `role="tabpanel"` and `aria-label`

### Visual Indicators

1. **Active State:** Gradient background clearly shows selection
2. **Hover States:** Background color changes on hover
3. **Icon Rotation:** ChevronDown rotates to indicate open/closed
4. **Truncation:** Text truncates with ellipsis instead of breaking layout

### Event Handling

```vue
@click.stop="selectFilter('all')"
```

- **Event Bubbling Prevention:** `.stop` modifier prevents clicks from propagating
- **Focus Management:** Button maintains focus state
- **Touch Support:** Works with touch/click events on mobile

---

## Customization Guide

### Changing Colors

#### Button Hover Color
```css
/* Current: hover:border-emerald-300 hover:bg-emerald-50 */
hover:border-blue-300 hover:bg-blue-50  /* Blue theme */
hover:border-purple-300 hover:bg-purple-50  /* Purple theme */
```

#### Active/Selected State
```css
/* Current: bg-gradient-to-r from-emerald-500 to-blue-500 */
bg-gradient-to-r from-purple-500 to-pink-500  /* Purple/Pink */
bg-blue-500  /* Solid blue */
```

### Adjusting Sizes

#### Button Size
```css
/* Current: px-3 py-2 */
px-4 py-3  /* Larger */
px-2 py-1.5  /* Smaller */
```

#### Menu Width
```css
/* Current: min-w-[250px] */
min-w-[300px]  /* Wider */
min-w-[200px]  /* Narrower */
```

#### Menu Max Height
```css
/* Current: max-h-[400px] */
max-h-[500px]  /* More visible items */
max-h-[300px]  /* Fewer visible items */
```

### Changing Animation

#### Transition Duration
```css
/* Current: transition-all duration-300 (button) */
transition-all duration-200  /* Faster */
transition-all duration-500  /* Slower */

/* Current: transition: all 0.2s ease (menu) */
transition: all 0.3s ease  /* Slower menu */
```

#### Animation Direction
```css
/* Current: translateY(-10px) (slides from top) */
transform: translateY(10px);  /* Slides from bottom */
transform: scale(0.95);  /* Scales up */
```

### Typography Changes

#### Font Size
```css
/* Current: text-sm (14px) */
text-base  /* 16px */
text-xs  /* 12px */
```

#### Font Weight
```css
/* Current: font-medium (500) */
font-semibold  /* 600 */
font-normal  /* 400 */
```

---

## Implementation Notes

### State Management

```javascript
// Reactive state
const isDropdownOpen = ref(false)
const activeFilter = ref('all')

// Computed label
const activeFilterLabel = computed(() => {
  if (activeFilter.value === 'all') {
    return `All Groups (${totalGuestCount.value})`
  }
  const group = props.groups.find(g => g.id.toString() === activeFilter.value)
  return group ? `${group.name} (${group.guest_count})` : 'Select Group'
})

// Methods
const selectFilter = (filterId: string) => {
  activeFilter.value = filterId
  isDropdownOpen.value = false
}
```

### Performance Considerations

1. **Conditional Rendering:** Menu only rendered when open (`v-if="isDropdownOpen"`)
2. **Event Delegation:** Click-outside handler attached only when needed
3. **Transition Optimization:** Uses transform (GPU accelerated) instead of position
4. **Scroll Performance:** Max height prevents excessive DOM in scrollable area

### Browser Compatibility

- **Modern Browsers:** Full support (Chrome, Firefox, Safari, Edge)
- **Mobile:** Touch events fully supported
- **Fallbacks:** Graceful degradation for older browsers
- **Vendor Prefixes:** Not needed (using standard CSS properties)

---

## Related Files

- **Component:** `src/components/invitation/GuestGroupsView.vue`
- **Parent:** `src/views/GuestManagement.vue` (or similar)
- **Icons:** `lucide-vue-next` (Filter, ChevronDown)
- **Types:** `src/services/api.ts` (GuestGroup interface)

---

## Version History

- **v1.0.0** - Initial dropdown implementation (replaced horizontal pills)
- **Current** - Refined styling with full documentation

---

## Support

For questions or issues with the dropdown styling:

1. Check this documentation first
2. Review the component code at lines 121-186
3. Test in browser DevTools to inspect computed styles
4. Refer to Tailwind CSS documentation for class utilities

---

**Last Updated:** 2025-01-07
**Maintained By:** GoEvent Frontend Team
