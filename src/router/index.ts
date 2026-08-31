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
      /**
       * The partner offer, as a link a salesperson can send. Deliberately
       * public: its whole audience is people who are not partners yet, and
       * every CTA on it points at `/credits`, which is where the auth guard
       * and the application form already live.
       */
      path: '/partners',
      name: 'partners',
      component: () => import('../views/PartnerProgramView.vue'),
      meta: { title: 'Partner Programme - GoEvent' },
    },
    {
      /**
       * The design catalogue, previewed live against a bundled sample
       * invitation. Public for the same reason `/partners` is: its audience is
       * people who are not partners yet, and everything it reads (the template
       * list, each template's public assets, the pricing plans) is public too.
       */
      path: '/partners/templates',
      name: 'partner-templates',
      component: () => import('../views/PartnerTemplateGalleryView.vue'),
      meta: { title: 'Invitation Designs - GoEvent' },
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
      meta: { title: 'My Events - GoEvent' },
    },
    {
      path: '/explore',
      name: 'explore',
      component: () => import('../views/ExploreView.vue'),
      meta: { title: 'Discover Events - GoEvent' },
    },
    {
      path: '/services',
      name: 'services',
      component: () => import('../views/ServicesView.vue'),
      meta: { title: 'Event Services - GoEvent' },
    },
    {
      path: '/services/vendors/:id',
      name: 'vendor-detail',
      component: () => import('../views/VendorStorefrontView.vue'),
      meta: { title: 'Vendor - GoEvent' },
    },
    {
      path: '/services/:id',
      name: 'service-detail',
      component: () => import('../views/ServiceDetailView.vue'),
      meta: { title: 'Service Details - GoEvent' },
    },
    {
      path: '/calendars',
      name: 'calendars',
      component: () => import('../views/CalendarsView.vue'),
      meta: { title: 'Calendars - GoEvent' },
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
      // Renders a single showcase stage at a fixed native resolution, meant to be
      // embedded via <iframe> in the manage-page "Live Preview" tab
      // (ShowcasePreviewTab.vue) and visually scaled from the outside. Not linked
      // from anywhere in the UI directly.
      path: '/events/:id/showcase-preview-frame',
      name: 'event-showcase-preview-frame',
      component: () => import('../views/ShowcasePreviewFrameView.vue'),
      meta: { title: 'Event Showcase Preview - GoEvent' },
    },
    {
      // The same idea for a template with no event behind it: one showcase
      // stage of the bundled sample invitation, rendered against
      // ?templateId=<public template>. Embedded by the public partner page's
      // template preview; public, because everything it reads is.
      //
      // The path keeps the `showcase-preview-frame` segment because that is
      // what isPreviewFrameDocument() matches — see previewFrameContext.ts.
      path: '/template-showcase-preview-frame',
      name: 'template-showcase-preview-frame',
      component: () => import('../views/TemplateShowcasePreviewFrameView.vue'),
      meta: { title: 'Template Preview - GoEvent' },
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
      // Partner credits: the wholesale packs a shop buys up front and spends one
      // per event at activation. Its own route rather than a Settings tab because
      // Settings is for every account and this is for partners only — the same
      // reasoning that gave the retired commission page a route here.
      path: '/credits',
      name: 'credits',
      component: () => import('../views/CreditsView.vue'),
      meta: { requiresAuth: true, title: 'Partner Credits - GoEvent' },
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('../views/AboutView.vue'), // Redirect to about page for now
      meta: { title: 'Contact - GoEvent' },
    },
    {
      path: '/invitation/:token',
      name: 'invitation',
      component: () => import('../views/InvitationView.vue'),
      meta: { title: 'Collaborator Invitation - GoEvent' },
    },
    {
      path: '/events/:id/checkout',
      name: 'event-checkout',
      component: () => import('../views/TicketCheckoutView.vue'),
      meta: { requiresAuth: true, title: 'Checkout - GoEvent' },
    },
    {
      path: '/my-tickets',
      name: 'my-tickets',
      component: () => import('../views/MyTicketsView.vue'),
      meta: { requiresAuth: true, title: 'My Tickets - GoEvent' },
    },
    {
      path: '/my-tickets/:code',
      name: 'my-ticket-order',
      component: () => import('../views/MyTicketOrderView.vue'),
      meta: { requiresAuth: true, title: 'Ticket Order - GoEvent' },
    },
  ],
})

/**
 * Showcase routes, which drive both root-font-scale classes in
 * src/assets/main.css:
 *
 * - `native-scale` opts them *out* of the 13"-15" laptop scale-down. The
 *   showcase is guest-facing and tuned around vh units and GSAP pixel
 *   measurements, and the preview frame deliberately renders at a fixed native
 *   resolution to be scaled from the outside by its host iframe — shrinking the
 *   root font under either would corrupt the layout it is measuring against.
 * - `showcase-scale` opts them *in* to the narrow-phone scale-down, which keeps
 *   the showcase's fixed-rem typography in proportion with its vw-sized
 *   containers below 640px.
 */
const SHOWCASE_SCALE_ROUTES = new Set([
  'event-showcase',
  'event-showcase-preview-frame',
  'template-showcase-preview-frame',
])

const applyRootScaleClasses = (routeName: unknown) => {
  const isShowcase = SHOWCASE_SCALE_ROUTES.has(routeName as string)
  const root = document.documentElement
  root.classList.toggle('native-scale', isShowcase)
  root.classList.toggle('showcase-scale', isShowcase)
}

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
    const sensitiveRoutes = ['settings', 'security', 'credits', 'event-edit']
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

// afterEach, not beforeEach: the class must reflect the route that actually
// resolved, so a cancelled or redirected navigation can't leave it stale.
// This also fires for the initial navigation, covering a direct load/refresh.
router.afterEach((to) => {
  applyRootScaleClasses(to.name)
})

export default router
