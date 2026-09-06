/**
 * Staff dashboard state — the queue counts, and nothing else.
 *
 * **Queue rows are deliberately not cached here.** Two admins working the same
 * queue is the expected case, and a stale list is how one of them clicks
 * confidently on something the other already decided. Every queue view fetches
 * its own page on mount and refetches after each decision; only the badge
 * counts live long enough to be worth sharing, because the sidebar needs them
 * on every admin page.
 *
 * `403` is not a failure state. Every `/api/admin/` route is gated on
 * `is_staff`, so a 403 means this account is not staff — the router has already
 * sent them elsewhere by the time it could matter, and it must never trigger a
 * logout.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { adminService } from '@/services/api'
import type { AdminSummary } from '@/services/api'
import type { AdminNavBadge } from '@/components/admin/adminNav'

/**
 * Badge key → the key it has in the summary payload (which uses underscores).
 *
 * `applications` is not an `AdminQueue` — the hiring pipeline has no
 * approve/reject and does not go through `listQueue` — but it *is* counted in
 * the summary, so it badges its nav entry like the rest.
 */
const SUMMARY_KEY: Record<AdminNavBadge, keyof AdminSummary['queues']> = {
  events: 'events',
  templates: 'templates',
  listings: 'listings',
  'partner-requests': 'partner_requests',
  payments: 'payments',
  commissions: 'commissions',
  'credit-orders': 'credit_orders',
  applications: 'applications',
}

export const useAdminStore = defineStore('admin', () => {
  const summary = ref<AdminSummary | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalPending = computed(() => summary.value?.total_pending ?? 0)

  /** Pending count for one badge, or `null` while the summary has not landed. */
  const pendingFor = (badge: AdminNavBadge): number | null =>
    summary.value ? summary.value.queues[SUMMARY_KEY[badge]] : null

  /**
   * Fetch the counts. Called on entering the admin area and after any decision,
   * so the badges stay honest — never on a timer, which the shared 2000/hour
   * budget would not thank us for.
   */
  const loadSummary = async (): Promise<void> => {
    loading.value = true
    error.value = null

    const response = await adminService.getSummary()

    if (response.success && response.data) {
      summary.value = response.data
    } else {
      error.value = response.message ?? null
    }

    loading.value = false
  }

  /** Leaving the admin area — the counts should not outlive the session in it. */
  const reset = (): void => {
    summary.value = null
    error.value = null
  }

  return { summary, loading, error, totalPending, pendingFor, loadSummary, reset }
})
