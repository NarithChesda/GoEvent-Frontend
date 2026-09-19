import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import { clearEdgeMeta, hasEdgeTitle, resetMetaTags } from '../utils/metaUtils'
import { useAuthStore } from '../stores/auth'
import { useLanguageStore } from '../stores/language'
import { authService } from '../services/auth'
import type { AppLocale } from '../i18n'

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
      /**
       * The front door, served at the root URL itself. It used to be a
       * client-side `redirect: '/events'`, which left the domain's homepage
       * with no page of its own — Google followed the redirect and indexed
       * "My Events". Signed out (and every crawler is), it renders the landing
       * and its sections; signed in, the account goes straight to its events —
       * unless it asked for a section of the page by name. `/#pricing` is the
       * footer's Pricing link on every page, and an account should be able to
       * read the prices too.
       *
       * Its own name rather than an alias of `events`: the pixel's route
       * allowlist (metaPixel.ts) and the nav's active state key off names.
       *
       * The title matches the one build/prerenderMeta.ts writes into the
       * homepage's static HTML (staticRoutes.spec.ts holds them together).
       *
       * There is no `/home` any more: it was an older English landing that
       * competed with this one for "homepage", and public/_redirects sends it
       * here with a 301.
       */
      path: '/',
      name: 'landing',
      component: () => import('../views/LandingView.vue'),
      beforeEnter: (to) =>
        useAuthStore().isAuthenticated && !to.hash
          ? { path: '/events', query: to.query, replace: true }
          : true,
      meta: { title: 'GoEvent — Digital Wedding Invitations & RSVP | ធៀបការឌីជីថល' },
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
       * every CTA on it points at `/partners/apply`, which is public too.
       */
      path: '/partners',
      name: 'partners',
      component: () => import('../views/PartnerProgramView.vue'),
      meta: { title: 'Partner Programme - GoEvent', preferredLocale: 'kh' },
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
      meta: { title: 'Invitation Designs - GoEvent', preferredLocale: 'kh' },
    },
    {
      /**
       * The partner application, as a link that can be sent to someone with no
       * account. Public on purpose, and the one route here whose publicness is
       * load-bearing rather than incidental: the form it renders used to exist
       * only behind `requiresAuth` on /credits, so the only thing a prospect
       * could be sent was a sign-in wall. This page takes the answers first and
       * asks for the account at submit — see PartnerApplyView.
       */
      path: '/partners/apply',
      name: 'partner-apply',
      component: () => import('../views/PartnerApplyView.vue'),
      meta: { title: 'Become a Partner - GoEvent', preferredLocale: 'kh' },
    },
    {
      /**
       * Public and permanent: the sign-up form, the footers, Google's OAuth
       * consent screen and Meta's ad account all point at this exact URL.
       * Its sections are linkable (`/privacy#cookies`) — never rename an id.
       */
      path: '/privacy',
      name: 'privacy',
      component: () => import('../views/PrivacyPolicyView.vue'),
      meta: { title: 'Privacy Policy - GoEvent' },
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
      /**
       * The guest list, delegated. Public by construction: the code in the path
       * is the credential, exactly as `?g=<shortcode>` is on a private event's
       * RSVP and guestbook. Its audience — the family member collecting names,
       * the planner, the shop's staff — has no GoEvent account and should not
       * need one to copy an invitation link or add a guest, so an auth guard
       * here would defeat the whole feature.
       *
       * What the holder may actually do is decided server-side per code and
       * echoed back in the share context; the page renders read-only or
       * editable from that, never from anything the URL claims.
       */
      path: '/guest-list/:code',
      name: 'shared-guest-list',
      component: () => import('../views/SharedGuestListView.vue'),
      meta: { title: 'Guest List - GoEvent' },
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
    {
      /**
       * Staff dashboard. Dynamic imports throughout, including the layout, so
       * the whole subtree is its own chunk and never ships to a normal user.
       *
       * `requiresStaff` implies the token check as well — see the guard below.
       * It is deliberately not added to the name-based `sensitiveRoutes` list,
       * which is easy to forget when adding the tenth admin route.
       */
      path: '/admin',
      component: () => import('../components/admin/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresStaff: true, title: 'Admin - GoEvent' },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('../views/admin/AdminDashboardView.vue'),
        },
        {
          path: 'events',
          name: 'admin-events',
          component: () => import('../views/admin/AdminEventQueueView.vue'),
        },
        {
          path: 'templates',
          name: 'admin-templates',
          component: () => import('../views/admin/AdminTemplateQueueView.vue'),
        },
        {
          path: 'listings',
          name: 'admin-listings',
          component: () => import('../views/admin/AdminListingQueueView.vue'),
        },
        {
          path: 'partner-requests',
          name: 'admin-partner-requests',
          component: () => import('../views/admin/AdminPartnerRequestQueueView.vue'),
        },
        {
          path: 'payments',
          name: 'admin-payments',
          component: () => import('../views/admin/AdminPaymentQueueView.vue'),
        },
        {
          path: 'commissions',
          name: 'admin-commissions',
          component: () => import('../views/admin/AdminCommissionQueueView.vue'),
        },
        {
          path: 'credit-orders',
          name: 'admin-credit-orders',
          component: () => import('../views/admin/AdminCreditOrderQueueView.vue'),
        },
        {
          path: 'applications',
          name: 'admin-applications',
          component: () => import('../views/admin/AdminApplicationsView.vue'),
        },
        // The managed catalogues: staff-authored content with full CRUD and no
        // review workflow, as opposed to the queues above.
        {
          path: 'music',
          name: 'admin-music',
          component: () => import('../views/admin/AdminMusicView.vue'),
        },
        {
          path: 'fonts',
          name: 'admin-fonts',
          component: () => import('../views/admin/AdminFontsView.vue'),
        },
        {
          path: 'icons',
          name: 'admin-icons',
          component: () => import('../views/admin/AdminIconsView.vue'),
        },
        {
          path: 'pricing-plans',
          name: 'admin-pricing-plans',
          component: () => import('../views/admin/AdminPricingPlansView.vue'),
        },
        // The commerce catalogues. Same CRUD shape as the ones above, except
        // that both refuse their dangerous delete rather than orphaning quietly
        // — what a delete would destroy here is a customer's record.
        {
          path: 'credit-packs',
          name: 'admin-credit-packs',
          component: () => import('../views/admin/AdminCreditPacksView.vue'),
        },
        {
          path: 'promo-codes',
          name: 'admin-promo-codes',
          component: () => import('../views/admin/AdminPromoCodesView.vue'),
        },
        {
          path: 'categories',
          name: 'admin-categories',
          component: () => import('../views/admin/AdminCategoriesView.vue'),
        },
        {
          path: 'team',
          name: 'admin-team',
          component: () => import('../views/admin/AdminTeamView.vue'),
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('../views/admin/AdminUsersView.vue'),
        },
        {
          path: 'actions',
          name: 'admin-actions',
          component: () => import('../views/admin/AdminActionsView.vue'),
        },
      ],
    },
    {
      /**
       * Everything else. Without it an unknown URL rendered an empty page.
       * Keep it last. A path the server doesn't know arrives here from
       * dist/404.html with a real 404 status; one it does know but the router
       * doesn't (`/events/x/y/z`, under a `_redirects` splat) arrives with a
       * 200, which is why the view also marks itself noindex.
       */
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { title: 'Page Not Found - GoEvent' },
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
    /*
     * The first render of a page the edge already titled with its own record
     * (an event — functions/events/[id].ts) keeps that title: the route's
     * generic one would replace it before the page could, and Google reads
     * the rendered title. After that, whatever the edge wrote describes the
     * URL it served, not the one being navigated to.
     */
    const isFirstNavigation = from === START_LOCATION
    if (!isFirstNavigation && from.path !== to.path) clearEdgeMeta()

    // Update document title based on route meta
    if (to.meta.title && !(isFirstNavigation && hasEdgeTitle())) {
      document.title = to.meta.title as string
    }

    // Reset meta tags when leaving showcase pages
    if (from.name === 'event-showcase' && to.name !== 'event-showcase') {
      resetMetaTags()
    }

    /*
     * A route may prefer a language of its own — the partner pages do, because
     * they are links sent to Cambodian shop owners who have never opened the
     * app. Awaited rather than fired off: the locale is a lazily loaded chunk,
     * and navigating first would paint one frame of English before the swap.
     * The store decides whether it applies at all (see applyPreferredLocale);
     * a visitor who has chosen a language keeps it.
     */
    const preferredLocale = to.meta.preferredLocale as AppLocale | undefined
    if (preferredLocale) {
      await useLanguageStore().applyPreferredLocale(preferredLocale)
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

    /**
     * Staff-only subtree. `requiresStaff` implies the token check rather than
     * relying on the name-based `sensitiveRoutes` list below, which is easy to
     * forget when adding a route to a nine-page dashboard.
     *
     * A non-staff account is sent to `/events`, not to a "forbidden" page —
     * there is nothing to gain by confirming that `/admin` exists.
     *
     * **This guard is UX, not security.** Every `/api/admin/` endpoint enforces
     * `is_staff` server-side, and nothing may ever conclude "the router blocks
     * it". Note also that a `403` from that API means "not staff" and must not
     * trigger a logout — which is why this branch checks the flag itself rather
     * than reading one out of a failed request.
     */
    if (to.meta.requiresStaff) {
      try {
        const isTokenValid = await authService.ensureValidToken()

        // false covers a rejected session *and* a request that never landed.
        // Only the first should sign anyone out, and the session itself is the
        // verdict — tokenManager clears it on a rejection and keeps it on a
        // timeout. See tokenManager.hasSession().
        if (!isTokenValid && !authService.hasSession()) {
          console.warn('[Router] Session rejected on staff route, logging out')
          await authStore.logout()
          next(`/signin?redirect=${encodeURIComponent(to.fullPath)}`)
          return
        }
      } catch (error) {
        console.warn('[Router] Staff token validation error:', error)
      }

      if (!authStore.user?.is_staff) {
        next('/events')
        return
      }

      next()
      return
    }

    // Validate token for sensitive routes
    // TokenManager has internal caching, so this won't cause excessive server calls
    const sensitiveRoutes = ['settings', 'security', 'credits', 'event-edit']
    if (sensitiveRoutes.includes(to.name as string)) {
      console.debug(`[Router] Validating token for sensitive route: ${String(to.name)}`)

      try {
        const isTokenValid = await authService.ensureValidToken()

        // Same reasoning as the staff branch above: a validation that merely
        // failed to complete must not cost the user their session.
        if (!isTokenValid && !authService.hasSession()) {
          console.warn('[Router] Session rejected, logging out')
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
