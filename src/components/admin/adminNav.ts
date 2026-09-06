/**
 * The dashboard's destinations, declared once.
 *
 * The sidebar and the mobile strip render the same list, so a queue can never
 * appear in one and not the other — and adding a queue is one entry here plus a
 * route, which is exactly what `events` cost when it arrived.
 */

import {
  CalendarCheck,
  Coins,
  LayoutDashboard,
  LayoutTemplate,
  Percent,
  ReceiptText,
  ScrollText,
  Store,
  UserRoundPlus,
  Users,
  type LucideIcon,
} from 'lucide-vue-next'
import type { AdminQueue } from '@/services/api'

export interface AdminNavItem {
  /** Route name — the nav links by name, so paths stay the router's business. */
  name: string
  icon: LucideIcon
  /** i18n key under `admin.nav`. */
  labelKey: string
  /**
   * The queue whose pending count badges this entry. Absent for the pages that
   * are not queues: the landing page, the user directory, the audit log.
   */
  queue?: AdminQueue
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { name: 'admin-dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  // Events lead the queues because they are the highest-volume moderation
  // surface and the only one where a delay is visible to the public — an
  // unapproved event is missing from Explore while it waits.
  { name: 'admin-events', icon: CalendarCheck, labelKey: 'events', queue: 'events' },
  { name: 'admin-templates', icon: LayoutTemplate, labelKey: 'templates', queue: 'templates' },
  { name: 'admin-listings', icon: Store, labelKey: 'listings', queue: 'listings' },
  {
    name: 'admin-partner-requests',
    icon: UserRoundPlus,
    labelKey: 'partnerRequests',
    queue: 'partner-requests',
  },
  { name: 'admin-payments', icon: ReceiptText, labelKey: 'payments', queue: 'payments' },
  { name: 'admin-commissions', icon: Percent, labelKey: 'commissions', queue: 'commissions' },
  {
    name: 'admin-credit-orders',
    icon: Coins,
    labelKey: 'creditOrders',
    queue: 'credit-orders',
  },
  { name: 'admin-users', icon: Users, labelKey: 'users' },
  { name: 'admin-actions', icon: ScrollText, labelKey: 'actions' },
]
