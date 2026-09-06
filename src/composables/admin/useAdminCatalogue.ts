/**
 * One managed catalogue's list state and its three writes.
 *
 * The sibling of `useAdminQueue`, for the half of the dashboard that is not a
 * queue. The difference is the whole point:
 *
 * - **A queue decides; a catalogue edits.** There is no pending state, no
 *   approve/reject and no `409` — nothing here is contested, so two staff
 *   members writing the same row is last-write-wins, exactly as it is in
 *   Django admin.
 * - **Nothing is cached across navigation**, for the same reason as the queues:
 *   a stale row is how someone edits a price that already moved.
 * - **Deleting is the dangerous verb, not rejecting.** Every one of these
 *   endpoints reports a usage count because the delete does *not* fail when
 *   content points at the row — the FK is `SET_NULL`, so events lose their
 *   music, templates lose their typeface, and nothing says so. Deactivating is
 *   almost always the right call; see `AdminUsageWarning`.
 */

import { computed, ref, watch, type Ref } from 'vue'
import { adminService } from '@/services/api'
import type { AdminCatalogue, QueryParams } from '@/services/api'
import { useAdminStore } from '@/stores/admin'
import { useToast } from '@/composables/useToast'

/** DRF page-number pagination, 20 per page, with no `page_size` override. */
export const ADMIN_PAGE_SIZE = 20

const SEARCH_DEBOUNCE_MS = 300

export interface AdminCatalogueOptions {
  /** Catalogue-specific filters, read fresh on every request. */
  extraParams?: () => QueryParams
  defaultOrdering?: string
  /**
   * Which query parameter the toolbar's status select actually sets.
   *
   * These lists have no `status` field — the select is reused for the one
   * filter they nearly all share, which is `is_active`. Set to `null` on a
   * catalogue that has no such flag (icons), so the select is simply absent
   * rather than sending a parameter the server will ignore.
   */
  statusParam?: string | null
  /**
   * Whether the summary badges can change as a result of writing here.
   * False for every catalogue — none of them is counted — so the default
   * spares the shared 2000/hour budget a request per save.
   */
  refreshSummary?: boolean
}

export type AdminWriteOutcome<T> =
  | { outcome: 'done'; item: T }
  | { outcome: 'error'; message: string; fieldErrors: Record<string, string[]> | null }

export function useAdminCatalogue<T extends { id: string | number }>(
  catalogue: AdminCatalogue,
  options: AdminCatalogueOptions = {},
) {
  const adminStore = useAdminStore()
  const { showError, showSuccess } = useToast()

  const rows = ref([]) as Ref<T[]>
  const count = ref(0)
  const page = ref(1)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const saving = ref(false)

  const search = ref('')
  /** These lists have no pending state, so this is a plain field filter. */
  const status = ref('')
  const ordering = ref(options.defaultOrdering ?? '')

  const totalPages = computed(() => Math.max(1, Math.ceil(count.value / ADMIN_PAGE_SIZE)))
  const isEmpty = computed(() => !loading.value && !error.value && rows.value.length === 0)

  /** Only the newest request may write to `rows`; typing fires several. */
  let requestToken = 0

  const load = async (): Promise<void> => {
    const token = ++requestToken
    loading.value = true
    error.value = null

    const statusParam = options.statusParam === undefined ? 'is_active' : options.statusParam

    const params: QueryParams = {
      page: page.value > 1 ? page.value : undefined,
      search: search.value.trim() || undefined,
      ordering: ordering.value || undefined,
      ...(statusParam && status.value ? { [statusParam]: status.value } : {}),
      ...(options.extraParams?.() ?? {}),
    }

    const response = await adminService.listCatalogue<T>(catalogue, params)
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

  const refresh = (): Promise<void> => load()

  const goToPage = (next: number): void => {
    const target = Math.min(Math.max(1, next), totalPages.value)
    if (target === page.value) return
    page.value = target
    void load()
  }

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

  const afterWrite = async (): Promise<void> => {
    await load()
    if (options.refreshSummary) void adminStore.loadSummary()
  }

  /**
   * A field-level `400` belongs under the field that caused it, so it is
   * returned rather than toasted. Anything else has nowhere to go but a toast.
   */
  const settle = async <R extends T>(
    response: Awaited<ReturnType<typeof adminService.createCatalogueItem<R>>>,
    successMessage: string,
  ): Promise<AdminWriteOutcome<R>> => {
    if (response.success && response.data) {
      await afterWrite()
      showSuccess(successMessage)
      return { outcome: 'done', item: response.data }
    }

    const message = response.message ?? 'That could not be saved.'
    const fieldErrors = response.errors && !Array.isArray(response.errors) ? response.errors : null

    if (response.status !== 400) showError(message)

    return { outcome: 'error', message, fieldErrors }
  }

  const create = async (
    body: FormData | Record<string, unknown>,
    successMessage: string,
  ): Promise<AdminWriteOutcome<T>> => {
    if (saving.value) return { outcome: 'error', message: '', fieldErrors: null }
    saving.value = true
    try {
      return await settle(await adminService.createCatalogueItem<T>(catalogue, body), successMessage)
    } finally {
      saving.value = false
    }
  }

  const update = async (
    id: string | number,
    body: FormData | Record<string, unknown>,
    successMessage: string,
  ): Promise<AdminWriteOutcome<T>> => {
    if (saving.value) return { outcome: 'error', message: '', fieldErrors: null }
    saving.value = true
    try {
      return await settle(
        await adminService.updateCatalogueItem<T>(catalogue, id, body),
        successMessage,
      )
    } finally {
      saving.value = false
    }
  }

  /**
   * The one-field write that is not a form: flipping `is_active` from the row.
   *
   * Sent as JSON rather than multipart even on the catalogues that carry a
   * file — the API takes both, and a multipart body would have to re-send the
   * file or risk the server reading an absent field as a clear.
   */
  const setActive = async (
    id: string | number,
    isActive: boolean,
    successMessage: string,
  ): Promise<AdminWriteOutcome<T>> => update(id, { is_active: isActive }, successMessage)

  const remove = async (id: string | number, successMessage: string): Promise<boolean> => {
    if (saving.value) return false
    saving.value = true
    try {
      const response = await adminService.deleteCatalogueItem(catalogue, id)
      if (response.success) {
        // The current page may now be past the end of a shortened list.
        if (rows.value.length === 1 && page.value > 1) page.value -= 1
        await afterWrite()
        showSuccess(successMessage)
        return true
      }
      showError(response.message ?? 'That could not be deleted.')
      return false
    } finally {
      saving.value = false
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
    saving,
    search,
    status,
    ordering,
    load,
    refresh,
    goToPage,
    create,
    update,
    setActive,
    remove,
  }
}
