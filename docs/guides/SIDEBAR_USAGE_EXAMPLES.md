# Sidebar Navigation - Usage Examples

This document provides practical code examples for working with the sidebar navigation system.

## Basic Integration

### Example 1: Wrapping a View with MainLayout

```vue
<template>
  <MainLayout>
    <Navigation />

    <!-- Your page content -->
    <section class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold">My Page</h1>
      <p>Content goes here...</p>
    </section>

    <Footer />
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '../components/MainLayout.vue'
import Navigation from '../components/Navigation.vue'
import Footer from '../components/Footer.vue'
</script>
```

## Accessing Sidebar State

### Example 2: Conditionally Render Based on Sidebar State

```vue
<template>
  <MainLayout>
    <!-- Adjust layout based on sidebar state -->
    <div :class="['content-wrapper', { 'sidebar-expanded': sidebar.isExpanded }]">
      <h1>Responsive Content</h1>

      <!-- Show different content based on sidebar -->
      <div v-if="sidebar.actuallyExpanded">
        Full width content when sidebar is expanded
      </div>
      <div v-else>
        Optimized content for collapsed sidebar
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { useSidebar } from '../composables/useSidebar'
import MainLayout from '../components/MainLayout.vue'

const sidebar = useSidebar()
</script>

<style scoped>
.content-wrapper {
  transition: all 0.3s ease;
}

.sidebar-expanded .content-wrapper {
  /* Adjust styles when sidebar is expanded */
  padding-left: 2rem;
}
</style>
```

### Example 3: Programmatically Control Sidebar

```vue
<template>
  <MainLayout>
    <div class="p-8">
      <h1>Sidebar Controls</h1>

      <!-- Custom buttons to control sidebar -->
      <div class="flex gap-4 mt-4">
        <button @click="sidebar.toggle()" class="btn-primary">
          Toggle Sidebar
        </button>

        <button @click="sidebar.expand()" class="btn-secondary">
          Expand Sidebar
        </button>

        <button @click="sidebar.collapse()" class="btn-secondary">
          Collapse Sidebar
        </button>
      </div>

      <!-- Show current state -->
      <div class="mt-6">
        <p>Expanded: {{ sidebar.isExpanded }}</p>
        <p>Mobile: {{ sidebar.isMobile }}</p>
        <p>Width: {{ sidebar.sidebarWidth }}</p>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { useSidebar } from '../composables/useSidebar'
import MainLayout from '../components/MainLayout.vue'

const sidebar = useSidebar()
</script>
```

## Advanced Use Cases

### Example 4: Synchronized Animations with Sidebar

```vue
<template>
  <MainLayout>
    <Transition name="fade-slide" mode="out-in">
      <div v-if="sidebar.actuallyExpanded" class="sidebar-dependent-content">
        <h2>Detailed View</h2>
        <p>This content appears when sidebar is expanded</p>
      </div>
      <div v-else class="sidebar-dependent-content">
        <h2>Compact View</h2>
        <p>This content appears when sidebar is collapsed</p>
      </div>
    </Transition>
  </MainLayout>
</template>

<script setup lang="ts">
import { useSidebar } from '../composables/useSidebar'
import MainLayout from '../components/MainLayout.vue'

const sidebar = useSidebar()
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
```

### Example 5: Responsive Grid Layout with Sidebar

```vue
<template>
  <MainLayout>
    <div class="p-4 lg:p-8">
      <!-- Grid adapts to sidebar state -->
      <div :class="gridClasses">
        <div v-for="item in items" :key="item.id" class="card">
          <h3>{{ item.title }}</h3>
          <p>{{ item.description }}</p>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSidebar } from '../composables/useSidebar'
import MainLayout from '../components/MainLayout.vue'

const sidebar = useSidebar()

// Adjust grid columns based on available space
const gridClasses = computed(() => {
  if (sidebar.isMobile) {
    return 'grid grid-cols-1 gap-4'
  }

  if (sidebar.actuallyExpanded) {
    return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
  }

  return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
})

const items = [
  { id: 1, title: 'Item 1', description: 'Description' },
  { id: 2, title: 'Item 2', description: 'Description' },
  // ... more items
]
</script>
```

### Example 6: Custom Sidebar Overlay Component

```vue
<template>
  <MainLayout>
    <!-- Custom overlay that appears when sidebar is collapsed -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="!sidebar.actuallyExpanded && showHelp"
          class="fixed inset-0 bg-black/50 z-60 flex items-center justify-center"
          @click="showHelp = false"
        >
          <div class="bg-white rounded-2xl p-8 max-w-md" @click.stop>
            <h2 class="text-2xl font-bold mb-4">Pro Tip!</h2>
            <p>Press <kbd class="kbd">Ctrl</kbd> + <kbd class="kbd">B</kbd> to toggle the sidebar</p>
            <button @click="showHelp = false" class="mt-4 btn-primary">
              Got it!
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Your content -->
    <div class="p-8">
      <h1>My Page</h1>
      <button @click="showHelp = true" class="btn-secondary">
        Show Help
      </button>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSidebar } from '../composables/useSidebar'
import MainLayout from '../components/MainLayout.vue'

const sidebar = useSidebar()
const showHelp = ref(false)
</script>

<style scoped>
.kbd {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #f5f5f5;
  font-family: monospace;
  font-size: 0.875rem;
}
</style>
```

## Custom Navigation Items

### Example 7: Adding Dynamic Badge to Navigation

```vue
<!-- CustomSidebar.vue - Extended sidebar with badges -->
<template>
  <Sidebar>
    <!-- Override default navigation items slot if Sidebar supports it -->
    <!-- Otherwise, this is a pattern for a custom sidebar component -->
  </Sidebar>
</template>

<script setup lang="ts">
// Example of how you might extend the sidebar component
// This is a conceptual example - actual implementation would require
// modifying Sidebar.vue to support slots or creating a new component

import { computed } from 'vue'
import Sidebar from '../components/Sidebar.vue'

interface ExtendedNavItem {
  path: string
  label: string
  icon: any
  badge?: number | string
}

const navigationItems = computed<ExtendedNavItem[]>(() => [
  { path: '/', label: 'Home', icon: 'Home' },
  { path: '/events', label: 'Events', icon: 'Calendar', badge: 5 },
  { path: '/messages', label: 'Messages', icon: 'MessageSquare', badge: 'new' },
])
</script>
```

### Example 8: Context-Aware Navigation

```vue
<template>
  <MainLayout>
    <!-- Different sidebar behavior based on current route -->
    <div class="p-8">
      <h1>{{ pageTitle }}</h1>

      <!-- Automatically expand sidebar for certain routes -->
      <div v-if="shouldAutoExpand">
        Sidebar auto-expanded for this view
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebar } from '../composables/useSidebar'
import MainLayout from '../components/MainLayout.vue'

const route = useRoute()
const sidebar = useSidebar()

const pageTitle = computed(() => {
  return route.meta.title || 'Page'
})

const shouldAutoExpand = computed(() => {
  // Auto-expand sidebar for specific routes
  return ['settings', 'profile', 'dashboard'].includes(route.name as string)
})

// Watch route changes and auto-expand if needed
watch(shouldAutoExpand, (newValue) => {
  if (newValue && !sidebar.isMobile) {
    sidebar.expand()
  }
})
</script>
```

## Performance Optimization

### Example 9: Lazy Loading with Sidebar State

```vue
<template>
  <MainLayout>
    <div class="p-8">
      <!-- Only load heavy components when sidebar provides enough space -->
      <Suspense>
        <template #default>
          <HeavyComponent v-if="hasEnoughSpace" />
          <LightweightComponent v-else />
        </template>
        <template #fallback>
          <LoadingSpinner />
        </template>
      </Suspense>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useSidebar } from '../composables/useSidebar'
import MainLayout from '../components/MainLayout.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const sidebar = useSidebar()

// Lazy load components based on available space
const HeavyComponent = defineAsyncComponent(() =>
  import('../components/HeavyComponent.vue')
)

const LightweightComponent = defineAsyncComponent(() =>
  import('../components/LightweightComponent.vue')
)

const hasEnoughSpace = computed(() => {
  return !sidebar.actuallyExpanded || window.innerWidth > 1440
})
</script>
```

## Testing Examples

### Example 10: Unit Test for Sidebar Composable

```typescript
// useSidebar.spec.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSidebar } from './useSidebar'

describe('useSidebar', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with expanded state', () => {
    const sidebar = useSidebar()
    expect(sidebar.isExpanded.value).toBe(true)
  })

  it('should toggle expanded state', () => {
    const sidebar = useSidebar()
    const initialState = sidebar.isExpanded.value

    sidebar.toggle()
    expect(sidebar.isExpanded.value).toBe(!initialState)
  })

  it('should persist state to localStorage', () => {
    const sidebar = useSidebar()

    sidebar.toggle()

    const savedState = localStorage.getItem('sidebar-state')
    expect(savedState).toBeTruthy()

    const state = JSON.parse(savedState!)
    expect(state.isExpanded).toBe(sidebar.isExpanded.value)
  })

  it('should handle mobile breakpoint', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })

    const sidebar = useSidebar()
    expect(sidebar.isMobile.value).toBe(true)
  })
})
```

### Example 11: Component Test for Sidebar

```typescript
// Sidebar.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Sidebar from './Sidebar.vue'

describe('Sidebar.vue', () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/about', component: { template: '<div>About</div>' } },
    ],
  })

  it('renders navigation items', () => {
    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Home')
    expect(wrapper.text()).toContain('About')
    expect(wrapper.text()).toContain('Events')
  })

  it('shows user menu when authenticated', async () => {
    // Mock auth store
    const mockAuthStore = {
      isAuthenticated: true,
      user: {
        first_name: 'John',
        email: 'john@example.com',
      },
    }

    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
        mocks: {
          authStore: mockAuthStore,
        },
      },
    })

    expect(wrapper.text()).toContain('John')
  })

  it('shows sign in button when not authenticated', async () => {
    const mockAuthStore = {
      isAuthenticated: false,
      user: null,
    }

    const wrapper = mount(Sidebar, {
      global: {
        plugins: [router],
        mocks: {
          authStore: mockAuthStore,
        },
      },
    })

    expect(wrapper.text()).toContain('Sign In')
  })
})
```

## Debugging Tips

### Example 12: Debug Component with Sidebar State

```vue
<template>
  <MainLayout>
    <div class="p-8">
      <h1>Debug View</h1>

      <!-- Debug panel (development only) -->
      <div v-if="isDev" class="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 class="font-bold mb-4">Sidebar Debug Info</h2>
        <pre class="text-sm">{{ debugInfo }}</pre>

        <button @click="resetSidebarState" class="mt-4 btn-danger">
          Reset Sidebar State
        </button>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSidebar } from '../composables/useSidebar'
import MainLayout from '../components/MainLayout.vue'

const sidebar = useSidebar()
const isDev = import.meta.env.DEV

const debugInfo = computed(() => ({
  isExpanded: sidebar.isExpanded.value,
  isHovered: sidebar.isHovered.value,
  isPinned: sidebar.isPinned.value,
  isMobile: sidebar.isMobile.value,
  isVisible: sidebar.isVisible.value,
  actuallyExpanded: sidebar.actuallyExpanded.value,
  sidebarWidth: sidebar.sidebarWidth.value,
  localStorage: localStorage.getItem('sidebar-state'),
}))

const resetSidebarState = () => {
  localStorage.removeItem('sidebar-state')
  window.location.reload()
}
</script>
```

## Best Practices

### Do's ✅

1. **Always wrap views with MainLayout**
   ```vue
   <template>
     <MainLayout>
       <!-- Your content -->
     </MainLayout>
   </template>
   ```

2. **Use computed properties for responsive layouts**
   ```typescript
   const layout = computed(() =>
     sidebar.actuallyExpanded ? 'compact' : 'full'
   )
   ```

3. **Respect mobile-first design**
   ```typescript
   if (sidebar.isMobile) {
     // Mobile-specific logic
   }
   ```

### Don'ts ❌

1. **Don't manually manipulate localStorage for sidebar state**
   ```typescript
   // ❌ Bad
   localStorage.setItem('sidebar-state', '...')

   // ✅ Good
   sidebar.toggle()
   ```

2. **Don't override z-index without checking hierarchy**
   ```css
   /* ❌ Bad - might conflict with sidebar */
   .my-component {
     z-index: 9999;
   }

   /* ✅ Good - use appropriate z-index */
   .my-component {
     z-index: 30; /* Between content and sidebar */
   }
   ```

3. **Don't hardcode sidebar widths**
   ```vue
   <!-- ❌ Bad -->
   <div style="margin-left: 280px">

   <!-- ✅ Good -->
   <div :style="{ marginLeft: sidebar.sidebarWidth }">
   ```

## Troubleshooting Common Issues

### Issue: Sidebar not showing
```typescript
// Check if MainLayout is being used
console.log('Using MainLayout:', !!document.querySelector('aside'))

// Check sidebar state
const sidebar = useSidebar()
console.log('Sidebar state:', {
  isVisible: sidebar.isVisible.value,
  sidebarWidth: sidebar.sidebarWidth.value,
})
```

### Issue: State not persisting
```typescript
// Check localStorage availability
try {
  localStorage.setItem('test', 'test')
  localStorage.removeItem('test')
  console.log('localStorage available')
} catch (e) {
  console.error('localStorage not available:', e)
}
```

### Issue: Layout jumping
```css
/* Ensure smooth transitions */
.content-wrapper {
  transition: margin-left 0.3s ease-in-out;
  will-change: margin-left;
}
```

## Conclusion

These examples cover the most common use cases for the sidebar navigation system. For more advanced scenarios or custom requirements, refer to the main implementation files and the comprehensive documentation in `SIDEBAR_IMPLEMENTATION.md`.