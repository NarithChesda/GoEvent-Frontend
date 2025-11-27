import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { resetMetaTags } from '../utils/metaUtils'
import { useAuthStore } from '../stores/auth'
import { authService } from '../services/auth'

/**
 * Router Configuration
 *
 * IMPROVEMENTS:
 * - Removed redundant route-level validation caching
 * - Uses authService.ensureValidToken() which has proper caching (via tokenManager)
 * - Simplified route guard logic
 * - Better error handling
 */

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
      component: () => import('../views/PublicEventView.vue'),
      meta: { title: 'Event Details - GoEvent' },
    },
    {
      path: '/events/:id/manage',
      name: 'event-manage',
      component: () => import('../views/EventManageView.vue'),
      meta: { requiresAuth: true, title: 'Manage Event - GoEvent' },
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

/**
 * Route guard for authentication
 *
 * IMPROVEMENTS:
 * - Simplified logic - no redundant caching (tokenManager handles it)
 * - Validates tokens for sensitive routes only
 * - Better error handling - network errors don't block navigation
 * - Clear logging
 */
router.beforeEach(async (to, from, next) => {
  try {
    // Update document title based on route meta
    if (to.meta.title) {
      document.title = to.meta.title as string
    }

    // Reset meta tags when leaving showcase pages
    if (from.name === 'event-showcase' && to.name !== 'event-showcase') {
      resetMetaTags()
    }

    // Check if route requires authentication
    if (!to.meta.requiresAuth) {
      next()
      return
    }

    // Use statically imported auth store and service
    const authStore = useAuthStore()

    // Basic authentication check
    if (!authStore.isAuthenticated) {
      console.info('[Router] User not authenticated, redirecting to sign in')
      next(`/signin?redirect=${encodeURIComponent(to.fullPath)}`)
      return
    }

    // Validate token for sensitive routes
    // TokenManager has internal caching, so this won't cause excessive server calls
    const sensitiveRoutes = ['settings', 'security', 'commission', 'event-edit']
    if (sensitiveRoutes.includes(to.name as string)) {
      console.debug(`[Router] Validating token for sensitive route: ${String(to.name)}`)

      try {
        const isTokenValid = await authService.ensureValidToken()

        if (!isTokenValid) {
          console.warn('[Router] Token validation failed, logging out')
          await authStore.logout()
          next(`/signin?redirect=${encodeURIComponent(to.fullPath)}`)
          return
        }

        console.debug('[Router] Token validation successful')
      } catch (error) {
        console.warn('[Router] Token validation error (non-critical):', error)
        // On network errors, allow navigation
        // The API will handle token refresh when needed
        console.info('[Router] Allowing navigation despite validation error')
      }
    }

    next()
  } catch (error) {
    console.error('[Router] Route guard error:', error)
    // Allow navigation on unexpected errors - don't block the user
    console.warn('[Router] Allowing navigation despite route guard error')
    next()
  }
})

export default router
