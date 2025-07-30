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

// Route guard for authentication
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    // Dynamically import to avoid circular dependency
    const { useAuthStore } = await import('../stores/auth')
    const authStore = useAuthStore()
    
    if (!authStore.isAuthenticated) {
      next('/signin')
      return
    }
  }
  next()
})

export default router
