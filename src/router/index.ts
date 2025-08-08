import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/signin',
      name: 'signin',
      component: () => import('../views/SignInView.vue'),
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignUpView.vue'),
    },
    {
      path: '/events',
      name: 'events',
      component: () => import('../views/EventsView.vue'),
    },
    {
      path: '/events/:id',
      name: 'event-detail',
      component: () => import('../views/EventDetailView.vue'),
    },
    {
      path: '/events/:id/edit',
      name: 'event-edit',
      component: () => import('../views/EventEditView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/events/:id/showcase',
      name: 'event-showcase',
      component: () => import('../views/EventShowcaseRefactored.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('../views/AboutView.vue'), // Redirect to about page for now
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
        next('/signin')
        return
      }

      // Enhanced security: Validate token with server for sensitive routes
      const sensitiveRoutes = ['settings', 'event-edit']
      if (sensitiveRoutes.includes(to.name as string)) {
        try {
          const isTokenValid = await authService.ensureValidToken()
          if (!isTokenValid) {
            console.warn('Token validation failed, redirecting to sign in')
            await authStore.logout()
            next('/signin')
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
        // Note: This is client-side only, server should set X-Frame-Options
        const metaTag = document.querySelector('meta[http-equiv="X-Frame-Options"]')
        if (!metaTag) {
          const newMetaTag = document.createElement('meta')
          newMetaTag.setAttribute('http-equiv', 'X-Frame-Options')
          newMetaTag.setAttribute('content', 'DENY')
          document.head.appendChild(newMetaTag)
        }
      }
    }
    
    next()
  } catch (error) {
    console.error('Route guard error:', error)
    // Allow navigation to continue in case of errors
    next()
  }
})

export default router
