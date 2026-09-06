/**
 * The dashboard's destinations, declared once.
 *
 * The sidebar and the mobile strip render the same list, so a destination can
 * never appear in one and not the other — and adding one is an entry here plus
 * a route, which is what `events` cost when it arrived.
 *
 * **Grouped, since the catalogues landed.** Nine entries were a list; seventeen
 * are a wall, and the split is not cosmetic — it is the difference the API
 * itself draws. A *queue* is contested work with a pending state, a decision
 * and an audit row; a *catalogue* is staff-authored content with full CRUD and
 * no state to guard. Someone arriving to clear their queue and someone arriving
 * to add a font are doing different jobs, and the sidebar should not make them
 * read past each other's work to find their own.
 */

import {
  Briefcase,
  CalendarCheck,
  Coins,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Music,
  Percent,
  ReceiptText,
  ScrollText,
  Shapes,
  Store,
  Tag,
  Type,
  UserRoundPlus,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-vue-next'
import type { AdminQueue } from '@/services/api'

/** Which count, if any, badges an entry. */
export type AdminNavBadge = AdminQueue | 'applications'

export interface AdminNavItem {
  /** Route name — the nav links by name, so paths stay the router's business. */
  name: string
  icon: LucideIcon
  /** i18n key under `admin.nav`. */
  labelKey: string
  /**
   * The pending count that badges this entry. Absent for everything that is not
   * a queue: the landing page, the six catalogues, users, the audit log.
   */
  badge?: AdminNavBadge
}

export interface AdminNavGroup {
  /** i18n key under `admin.nav.groups`, or null for the ungrouped lead item. */
  labelKey: string | null
  items: AdminNavItem[]
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    labelKey: null,
    items: [{ name: 'admin-dashboard', icon: LayoutDashboard, labelKey: 'dashboard' }],
  },
  {
    // Contested work: something is waiting, and a decision writes an audit row.
    labelKey: 'review',
    items: [
      // Events lead because they are the highest-volume moderation surface and
      // the only one where a delay is visible to the public — an unapproved
      // event is missing from Explore while it waits.
      { name: 'admin-events', icon: CalendarCheck, labelKey: 'events', badge: 'events' },
      { name: 'admin-templates', icon: LayoutTemplate, labelKey: 'templates', badge: 'templates' },
      { name: 'admin-listings', icon: Store, labelKey: 'listings', badge: 'listings' },
      {
        name: 'admin-partner-requests',
        icon: UserRoundPlus,
        labelKey: 'partnerRequests',
        badge: 'partner-requests',
      },
      { name: 'admin-payments', icon: ReceiptText, labelKey: 'payments', badge: 'payments' },
      { name: 'admin-commissions', icon: Percent, labelKey: 'commissions', badge: 'commissions' },
      {
        name: 'admin-credit-orders',
        icon: Coins,
        labelKey: 'creditOrders',
        badge: 'credit-orders',
      },
      {
        name: 'admin-applications',
        icon: Briefcase,
        labelKey: 'applications',
        badge: 'applications',
      },
    ],
  },
  {
    // Staff-authored content: full CRUD, no pending state, nothing waiting.
    labelKey: 'library',
    items: [
      { name: 'admin-music', icon: Music, labelKey: 'music' },
      { name: 'admin-fonts', icon: Type, labelKey: 'fonts' },
      { name: 'admin-icons', icon: Shapes, labelKey: 'icons' },
      { name: 'admin-pricing-plans', icon: Tag, labelKey: 'pricingPlans' },
      { name: 'admin-categories', icon: Layers, labelKey: 'categories' },
      { name: 'admin-team', icon: UsersRound, labelKey: 'team' },
    ],
  },
  {
    labelKey: 'records',
    items: [
      { name: 'admin-users', icon: Users, labelKey: 'users' },
      { name: 'admin-actions', icon: ScrollText, labelKey: 'actions' },
    ],
  },
]

/** Flat, for anything that wants the destinations without their grouping. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((group) => group.items)
