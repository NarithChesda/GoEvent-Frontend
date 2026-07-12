# Sidebar Navigation System Implementation

## Overview

This document describes the implementation of a comprehensive left sidebar navigation system for the GoEvent Frontend application. The sidebar provides an improved navigation experience with persistent state management, responsive behavior, and keyboard shortcuts.

## Architecture

### Component Structure

```
src/
├── components/
│   ├── Sidebar.vue          # Main sidebar component
│   ├── MainLayout.vue       # Layout wrapper with sidebar integration
│   └── Navigation.vue       # Existing top navigation bar (preserved)
└── composables/
    └── useSidebar.ts        # Sidebar state management composable
```

### Key Components

#### 1. **useSidebar Composable** (`src/composables/useSidebar.ts`)

A Vue 3 composable that manages sidebar state across the application.

**Features:**
- Persistent state management via localStorage
- Responsive behavior (auto-collapse on mobile)
- Keyboard shortcuts (Ctrl/Cmd + B to toggle, Escape to close on mobile)
- Hover-to-expand functionality when unpinned
- Route-based auto-collapse on mobile navigation

**API:**
```typescript
interface SidebarAPI {
  // State
  isExpanded: Ref<boolean>
  isHovered: Ref<boolean>
  isPinned: Ref<boolean>
  isMobile: Ref<boolean>
  isVisible: ComputedRef<boolean>
  actuallyExpanded: ComputedRef<boolean>
  sidebarWidth: ComputedRef<string>

  // Actions
  toggle: () => void
  expand: () => void
  collapse: () => void
  togglePin: () => void
  handleMouseEnter: () => void
  handleMouseLeave: () => void
  closeMobile: () => void
}
```

**State Management:**
- `isExpanded`: Whether sidebar is explicitly expanded
- `isHovered`: Whether user is hovering over sidebar (desktop only)
- `isPinned`: Whether sidebar stays expanded (desktop only)
- `isMobile`: Whether screen size is below lg breakpoint (1024px)
- `isVisible`: Computed visibility state
- `actuallyExpanded`: Computed expanded state (considers hover)
- `sidebarWidth`: Computed width ('280px' expanded, '80px' collapsed, '0px' hidden)

#### 2. **Sidebar Component** (`src/components/Sidebar.vue`)

The main sidebar navigation component.

**Features:**
- Logo/brand with collapse/expand toggle
- Main navigation links (Home, About, Events)
- Secondary navigation (Settings) - only when authenticated
- User profile section with dropdown menu
- Pin/Unpin toggle (desktop only)
- Tooltips for collapsed state
- Smooth transitions and animations
- Mobile overlay with backdrop blur

**Navigation Items:**
```typescript
const navigationItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/about', label: 'About', icon: Info },
  { path: '/events', label: 'Events', icon: Calendar },
]

const secondaryNavItems = [
  { path: '/settings', label: 'Settings', icon: Settings },
]
```

**User Authentication Integration:**
- Sign In button when not authenticated
- User profile with avatar when authenticated
- Settings and Logout options in dropdown menu

#### 3. **MainLayout Component** (`src/components/MainLayout.vue`)

Layout wrapper that integrates the sidebar with page content.

**Features:**
- Responsive main content area that adjusts to sidebar width
- Mobile bottom navigation bar
- Seamless integration with existing routing
- Slot-based content rendering

**Layout Behavior:**
- **Desktop (≥1024px)**: Sidebar pushes main content, respects expanded/collapsed state
- **Mobile (<1024px)**: Sidebar overlays content, bottom navigation visible

## Integration Guide

### Step 1: Wrap Views with MainLayout

Replace the root `<div>` wrapper in your views with `<MainLayout>`:

```vue
<!-- Before -->
<template>
  <div class="min-h-screen pb-20 lg:pb-0">
    <Navigation />
    <!-- Your content -->
  </div>
</template>

<!-- After -->
<template>
  <MainLayout>
    <Navigation />
    <!-- Your content -->
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '../components/MainLayout.vue'
// ... other imports
</script>
```

### Step 2: Update Existing Views

The following views should be updated to use MainLayout:
- `HomeView.vue` ✅ (Updated)
- `AboutView.vue`
- `EventsView.vue`
- `EventDetailView.vue`
- `SettingsView.vue`

**Note:** Views like SignInView and SignUpView can remain without the sidebar for a focused auth experience.

### Step 3: Optional - Use Sidebar State in Components

Access sidebar state in any component:

```vue
<script setup lang="ts">
import { useSidebar } from '../composables/useSidebar'

const sidebar = useSidebar()

// Check if sidebar is expanded
if (sidebar.isExpanded.value) {
  // Adjust layout accordingly
}

// Programmatically control sidebar
sidebar.toggle()
sidebar.expand()
sidebar.collapse()
</script>
```

## Responsive Behavior

### Desktop (≥1024px)
- Sidebar visible by default
- Can be collapsed to icon-only mode (80px width)
- Hover to temporarily expand when unpinned
- Pin toggle to lock sidebar in expanded state
- Keyboard shortcut (Ctrl/Cmd + B) to toggle

### Tablet (768px - 1023px)
- Sidebar behavior same as desktop
- Slightly more compact UI

### Mobile (<768px)
- Sidebar hidden by default
- Hamburger menu to open sidebar
- Sidebar overlays content with backdrop blur
- Click outside or press Escape to close
- Bottom navigation bar for quick access
- Auto-closes when navigating to new route

## Keyboard Shortcuts

- **Ctrl/Cmd + B**: Toggle sidebar expanded/collapsed state
- **Escape**: Close sidebar on mobile

## State Persistence

Sidebar state is persisted in `localStorage` under the key `sidebar-state`:

```typescript
interface SidebarState {
  isExpanded: boolean
  isHovered: boolean  // Not persisted
  isPinned: boolean
}
```

**Persistence Behavior:**
- Desktop: Restores previous expanded and pinned state
- Mobile: Always starts collapsed (mobile preference)
- Handles localStorage errors gracefully

## Styling and Theming

The sidebar uses the existing GoEvent design system:

**Colors:**
- Primary: `#2ecc71` (Green) and `#1e90ff` (Blue) gradients
- Accent: `#87CEEB` (Sky Blue), `#B0E0E6` (Powder Blue)
- Background: White with backdrop blur
- Text: Slate color palette

**Transitions:**
- Width changes: `300ms ease-in-out`
- Fade animations: `200ms ease`
- Hover effects: `200ms duration`

**Z-Index Layers:**
- Sidebar: `z-50`
- Mobile overlay: `z-40`
- Bottom navigation: `z-40`
- Top navigation: `z-30`

## Performance Considerations

1. **Composable Pattern**: Shared state via composable prevents prop drilling
2. **Computed Properties**: Efficient reactivity with minimal re-renders
3. **Lazy Evaluation**: Route checks only when needed
4. **Debounced Resize**: Window resize handled efficiently
5. **Transition Optimization**: CSS transitions for smooth 60fps animations

## Accessibility

- **Keyboard Navigation**: Full keyboard support with shortcuts
- **Focus Management**: Proper focus handling in dropdown menus
- **ARIA Labels**: Meaningful labels for screen readers (can be enhanced)
- **Color Contrast**: WCAG AA compliant color combinations
- **Touch Targets**: Minimum 44x44px touch targets on mobile

## Future Enhancements

Potential improvements for future iterations:

1. **Nested Navigation**: Support for sub-menus and nested routes
2. **Search Bar**: Quick search functionality in sidebar
3. **Notifications**: Badge indicators for new items
4. **Customization**: User preferences for sidebar position/theme
5. **Breadcrumbs**: Current page context in collapsed state
6. **Drag to Resize**: Manual width adjustment
7. **ARIA Improvements**: Enhanced screen reader support
8. **Animation Preferences**: Respect `prefers-reduced-motion`

## Testing Recommendations

### Unit Tests
- `useSidebar.ts`: State management logic
- Event handlers (toggle, pin, keyboard shortcuts)
- localStorage persistence

### Integration Tests
- Sidebar component rendering
- Navigation item clicks
- User menu interactions
- Responsive behavior

### E2E Tests
- Navigation flow with sidebar
- Mobile overlay behavior
- Keyboard shortcuts
- Cross-browser compatibility

## Troubleshooting

### Sidebar not appearing
- Check if `MainLayout` wrapper is used in the view
- Verify `lg` breakpoint in Tailwind config (1024px)
- Check z-index conflicts with other components

### State not persisting
- Verify localStorage is available
- Check browser privacy settings
- Clear localStorage and retry: `localStorage.removeItem('sidebar-state')`

### Performance issues
- Check for excessive re-renders with Vue DevTools
- Verify transition durations aren't too long
- Ensure no layout thrashing from multiple width changes

### Mobile overlay not working
- Verify click outside handler is not intercepted
- Check z-index layering
- Test Escape key functionality

## Browser Compatibility

Tested and compatible with:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Migration Notes

### From Existing Navigation
The sidebar **coexists** with the existing top Navigation component:
- Top Navigation: Used for page-specific context and actions
- Sidebar Navigation: Used for global app navigation

Both can be used together without conflicts.

### Existing Bottom Tab Bar
The existing mobile bottom tab bar in `Navigation.vue` is **replaced** by the MainLayout bottom navigation. To avoid duplication, ensure views using MainLayout don't render the old bottom tabs.

## File Locations

**New Files:**
- `src/composables/useSidebar.ts` - Sidebar state management
- `src/components/Sidebar.vue` - Sidebar component
- `src/components/MainLayout.vue` - Layout wrapper

**Modified Files:**
- `src/views/HomeView.vue` - Updated to use MainLayout

## Credits

Implementation follows Vue 3 Composition API best practices and integrates with the existing GoEvent design system. Built with performance, accessibility, and user experience in mind.