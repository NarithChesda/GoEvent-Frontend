import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { resetMetaTags } from '../utils/metaUtils'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
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
        // Redirect to signin with the current path as a query parameter
        next(`/signin?redirect=${encodeURIComponent(to.fullPath)}`)
        return
      }

      // Enhanced security: Validate token with server for sensitive routes
      const sensitiveRoutes = ['settings', 'security', 'commission', 'event-edit']
      if (sensitiveRoutes.includes(to.name as string)) {
        try {
          const isTokenValid = await authService.ensureValidToken()
          if (!isTokenValid) {
            console.warn('Token validation failed, redirecting to sign in')
            await authStore.logout()
            next(`/signin?redirect=${encodeURIComponent(to.fullPath)}`)
            return
          }
        } catch (error) {
          console.warn('Token validation error:', error)
          // Continue to route but user might face API errors
        }
      }

      // Specific checks for event editing
      if (to.name === 'event-edit' && to.params.id) {
        // Note: In a real application, you'd validate if user can edit this specific event
        // This would require an API call to check permissions
        console.info('Event edit access granted for event:', to.params.id)
      }
    }

    // Security headers simulation (would be better handled by server)
    if (typeof document !== 'undefined') {
      // Prevent iframe embedding on sensitive pages
      if (to.meta.requiresAuth) {
        // X-Frame-Options should be set via HTTP headers, not meta tags
        // This is a security feature that prevents clickjacking
        // Remove the meta tag approach as it's not effective and causes console warnings
      }
    }

    // Update document title based on route meta
    if (to.meta.title) {
      document.title = to.meta.title as string
    }

    // Reset meta tags when leaving showcase pages (but not when entering)
    if (from.name === 'event-showcase' && to.name !== 'event-showcase') {
      console.log('🏷️ Leaving showcase page, resetting meta tags')
      resetMetaTags()
    }

    next()
  } catch (error) {
    console.error('Route guard error:', error)
    // Allow navigation to continue in case of errors
    next()
  }
})

export default router
