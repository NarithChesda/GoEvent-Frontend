/**
 * One review queue's list state and its two decisions.
 *
 * Written once because the API is written once: all six queues take the same
 * list params and the same `approve`/`reject` pair, so a per-queue copy of this
 * would only be six places for the `409` handling to drift.
 *
 * Three behaviours here are contractual rather than stylistic:
 *
 * - **The list is refetched after every decision**, even though the response
 *   carries the updated row. `item` is right for that row; the *list's
 *   composition* has changed, because the row usually just left the pending
 *   filter it was found under.
 * - **`409` is not an error.** Two admins on one queue is the expected case. It
 *   refreshes and says "someone got there first" in an informational tone, and
 *   it never retries — on `credit-orders` a retry would be an attempt to mint a
 *   second code.
 * - **Nothing is cached across navigation.** Every mount fetches, because a
 *   stale queue is how an admin clicks confidently on a decided row.
 */

import { computed, ref, watch, type Ref } from 'vue'
import { adminService, type AdminRejectExtra } from '@/services/api'
import type { AdminDecision, AdminQueue, QueryParams } from '@/services/api'
import { useAdminStore } from '@/stores/admin'
import { useToast } from '@/composables/useToast'

/** DRF page-number pagination, 20 per page, with no `page_size` override. */
export const ADMIN_PAGE_SIZE = 20

/** How long typing settles before a search request goes out. */
const SEARCH_DEBOUNCE_MS = 300

export interface AdminQueueOptions {
  /**
   * Queue-specific filters (`template_type`, `currency`, `category`, …), read
   * fresh on every request so the view can own them as its own refs.
   */
  extraParams?: () => QueryParams
  /** Initial `?ordering=`. Defaults to newest first. */
  defaultOrdering?: string
}

/** What a decision did, for the caller that has to react to it. */
export type AdminDecisionOutcome<T> =
  | { outcome: 'done'; item: T; message: string }
  /** Someone else decided it first. Already refreshed; do not retry. */
  | { outcome: 'conflict'; message: string }
  | { outcome: 'error'; message: string; fieldErrors: Record<string, string[]> | null }

export function useAdminQueue<T extends { id: string | number }>(
  queue: AdminQueue,
  options: AdminQueueOptions = {},
) {
  const adminStore = useAdminStore()
  const { showError, showInfo } = useToast()

  const rows = ref([]) as Ref<T[]>
  const count = ref(0)
  const page = ref(1)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const search = ref('')
  /**
   * `''` means "send no `status` param", which is what puts the queue on its own
   * pending status. That is not the same as `'all'`, which lifts the filter
   * entirely — a queue that opens on everything is not a queue.
   */
  const status = ref('')
  const ordering = ref(options.defaultOrdering ?? '-created_at')

  const totalPages = computed(() => Math.max(1, Math.ceil(count.value / ADMIN_PAGE_SIZE)))
  const isEmpty = computed(() => !loading.value && !error.value && rows.value.length === 0)

  /**
   * Only the newest request may write to `rows`. Typing in the search box fires
   * several, and they do not necessarily come back in order.
   */
  let requestToken = 0

  const load = async (): Promise<void> => {
    const token = ++requestToken
    loading.value = true
    error.value = null

    const params: QueryParams = {
      page: page.value > 1 ? page.value : undefined,
      search: search.value.trim() || undefined,
      status: status.value || undefined,
      ordering: ordering.value || undefined,
      ...(options.extraParams?.() ?? {}),
    }

    const response = await adminService.listQueue<T>(queue, params)
    if (token !== requestToken) return

    if (response.success && response.data) {
      rows.value = response.data.results
      count.value = response.data.count
    } else {
      rows.value = []
      count.value = 0
      error.value = response.message ?? null
    }

    loading.value = false
  }

  const goToPage = (next: number): void => {
    const target = Math.min(Math.max(1, next), totalPages.value)
    if (target === page.value) return
    page.value = target
    void load()
  }

  /** Re-read the current page — after a decision, or from the retry button. */
  const refresh = (): Promise<void> => load()

  /**
   * A filter changed, so the current page number is meaningless: page 3 of the
   * old result set is not page 3 of the new one.
   */
  const resetAndLoad = (): void => {
    page.value = 1
    void load()
  }

  let searchTimer: ReturnType<typeof setTimeout> | undefined
  watch(search, () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(resetAndLoad, SEARCH_DEBOUNCE_MS)
  })
  watch([status, ordering], resetAndLoad)

  // ---------------------------------------------------------------------------
  // Decisions
  // ---------------------------------------------------------------------------

  const deciding = ref(false)

  const afterDecision = async (): Promise<void> => {
    // The list first — it is what the admin is looking at — then the badges, so
    // the sidebar can never claim work that is no longer there.
    await load()
    void adminStore.loadSummary()
  }

  const settle = async (
    response: Awaited<ReturnType<typeof adminService.approve<T>>>,
  ): Promise<AdminDecisionOutcome<T>> => {
    if (response.success && response.data) {
      const decision = response.data as AdminDecision<T>
      await afterDecision()
      return { outcome: 'done', item: decision.item, message: decision.message }
    }

    if (response.status === 409) {
      // Nothing was changed and no audit row was written, so what we fetch now
      // is the truth. Informational, never a red error, never a retry.
      const message = response.message ?? ''
      await afterDecision()
      showInfo(message || 'Someone got there first.')
      return { outcome: 'conflict', message }
    }

    const message = response.message ?? 'The decision could not be saved.'
    const fieldErrors =
      response.errors && !Array.isArray(response.errors) ? response.errors : null

    // A 400 is usually the missing/blank note, which belongs under the field
    // that caused it — the drawer renders it and the toast would be the same
    // news twice. Everything else has nowhere else to go.
    if (response.status !== 400) showError(message)

    return { outcome: 'error', message, fieldErrors }
  }

  const approve = async (
    id: string | number,
    note?: string,
  ): Promise<AdminDecisionOutcome<T>> => {
    if (deciding.value) return { outcome: 'error', message: '', fieldErrors: null }
    deciding.value = true
    try {
      return await settle(await adminService.approve<T>(queue, id, note))
    } finally {
      deciding.value = false
    }
  }

  const reject = async (
    id: string | number,
    note: string,
    extra: AdminRejectExtra = {},
  ): Promise<AdminDecisionOutcome<T>> => {
    if (deciding.value) return { outcome: 'error', message: '', fieldErrors: null }
    deciding.value = true
    try {
      return await settle(await adminService.reject<T>(queue, id, note, extra))
    } finally {
      deciding.value = false
    }
  }

  return {
    rows,
    count,
    page,
    totalPages,
    loading,
    error,
    isEmpty,
    search,
    status,
    ordering,
    deciding,
    load,
    refresh,
    goToPage,
    approve,
    reject,
  }
}
