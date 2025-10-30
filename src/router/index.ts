import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { resetMetaTags } from '../utils/metaUtils'

// Route guard validation cache to prevent excessive token validation
// The authService already has internal caching, but this adds an extra layer
// to prevent even calling ensureValidToken on every single navigation
let lastRouteValidationTime: number = 0
const ROUTE_VALIDATION_CACHE_DURATION = 2 * 60 * 1000 // 2 minutes

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    // Only handle hash navigation when coming from a different route
    // This prevents auto-scroll on page refresh while keeping intentional navigation
    if (to.hash && from.name) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }

    return {
      left: 0,
      top: 0,
    }
  },
  routes: [
    {
      path: '/',
      redirect: '/events',
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      meta: { title: 'Home - GoEvent' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: { title: 'About - GoEvent' },
    },
    {
      path: '/signin',
      name: 'signin',
      component: () => import('../views/SignInView.vue'),
      meta: { title: 'Sign In - GoEvent' },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignUpView.vue'),
      meta: { title: 'Sign Up - GoEvent' },
    },
    {
      path: '/events',
      name: 'events',
      component: () => import('../views/EventsView.vue'),
      meta: { title: 'Events - GoEvent' },
    },
    {
      path: '/events/:id',
      name: 'event-detail',
      component: () => import('../views/EventDetailView.vue'),
      meta: { title: 'Event Details - GoEvent' },
    },
    {
      path: '/events/:id/edit',
      name: 'event-edit',
      component: () => import('../views/EventEditView.vue'),
      meta: { requiresAuth: true, title: 'Edit Event - GoEvent' },
    },
    {
      path: '/events/:id/showcase',
      name: 'event-showcase',
      component: () => import('../views/EventShowcaseRefactored.vue'),
      meta: { title: 'Event Showcase - GoEvent' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true, title: 'Profile - GoEvent' },
    },
    {
      path: '/security',
      name: 'security',
      component: () => import('../views/SecurityView.vue'),
      meta: { requiresAuth: true, title: 'Security - GoEvent' },
    },
    {
      path: '/commission',
      name: 'commission',
      component: () => import('../views/CommissionView.vue'),
      meta: { requiresAuth: true, title: 'Commission - GoEvent' },
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('../views/AboutView.vue'), // Redirect to about page for now
      meta: { title: 'Contact - GoEvent' },
    },
  ],
})

// Enhanced route guard with security checks
router.beforeEach(async (to, from, next) => {
  try {
    if (to.meta.requiresAuth) {
      // Dynamically import to avoid circular dependency
      const { useAuthStore } = await import('../stores/auth')
      const { authService } = await import('../services/auth')
      const authStore = useAuthStore()

      // Basic authentication check
      if (!authStore.isAuthenticated) {
        console.info('User not authenticated, redirecting to sign in')
        next(`/signin?redirect=${encodeURIComponent(to.fullPath)}`)
        return
      }

      // Enhanced security: Validate token for sensitive routes
      // But use caching to avoid validating on every single navigation
      const sensitiveRoutes = ['settings', 'security', 'commission', 'event-edit']
      const now = Date.now()
      const timeSinceLastValidation = now - lastRouteValidationTime
      const needsValidation =
        sensitiveRoutes.includes(to.name as string) &&
        timeSinceLastValidation > ROUTE_VALIDATION_CACHE_DURATION

      if (needsValidation) {
        console.debug('Validating token for sensitive route:', to.name)
        try {
          const isTokenValid = await authService.ensureValidToken()

          if (isTokenValid) {
            // Update validation cache
            lastRouteValidationTime = now
            console.debug('Token validation successful for route guard')
          } else {
            // Token is definitively invalid
            console.warn('Token validation failed definitively, logging out')
            await authStore.logout()
            next(`/signin?redirect=${encodeURIComponent(to.fullPath)}`)
            return
          }
        } catch (error) {
          console.warn('Token validation error in route guard:', error)
          // On network errors, allow navigation - don't force logout
          // The API service will handle token refresh if needed
          console.info('Allowing navigation despite validation error')
        }
      } else if (sensitiveRoutes.includes(to.name as string)) {
        console.debug(
          'Skipping token validation (cached, last validated',
          Math.round(timeSinceLastValidation / 1000),
          'seconds ago)',
        )
      }

      // Specific checks for event editing
      if (to.name === 'event-edit' && to.params.id) {
        console.debug('Navigating to event edit:', to.params.id)
      }
    }

    // Update document title based on route meta
    if (to.meta.title) {
      document.title = to.meta.title as string
    }

    // Reset meta tags when leaving showcase pages (but not when entering)
    if (from.name === 'event-showcase' && to.name !== 'event-showcase') {
      console.debug('Leaving showcase page, resetting meta tags')
      resetMetaTags()
    }

    next()
  } catch (error) {
    console.error('Route guard error:', error)
    // Allow navigation to continue in case of errors - don't block the user
    console.warn('Allowing navigation despite route guard error')
    next()
  }
})

export default router
