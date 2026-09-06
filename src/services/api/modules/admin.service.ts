/**
 * Staff dashboard API — `/api/admin/`.
 *
 * **Written generically on purpose.** All six review queues share one contract:
 * the same list params, the same `approve`/`reject` pair, the same envelope. Six
 * hand-written copies would be six places for them to drift apart, so the queue
 * is a parameter and the row type is a type argument.
 *
 * Three things every caller has to know, all of them from the API docs:
 *
 * - **`403` means "not staff", not "token problem".** Every route here — reads
 *   included — is gated on `is_staff`, because reading a review queue means
 *   seeing unapproved designs, payment proofs and other people's account flags.
 *   Never trigger a logout or a refresh off one.
 * - **`409` is normal.** Two admins working the same queue is the expected case,
 *   not an error: refresh the list, say "someone got there first" in an
 *   informational tone, and **never retry**. `credit-orders` makes that a hard
 *   rule rather than a preference — approving mints a code, and the `409` on a
 *   second confirm is the only thing standing between a retry and a second code.
 * - **Queues are read-only apart from the two actions.** `PATCH`/`PUT`/`DELETE`
 *   on a row is a `405`, which is what guarantees every state change wrote an
 *   audit row.
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  QueryParams,
  AdminActionRow,
  AdminDecision,
  AdminFlagsResult,
  AdminMetrics,
  AdminQueue,
  AdminSummary,
  AdminUserDetail,
  AdminUserFlagsPayload,
  AdminUserRow,
} from '../types'

/** Extra body fields on a reject. Only `partner-requests` uses one today. */
export interface AdminRejectExtra {
  /**
   * `partner-requests` only. `true` = may apply again immediately, `false` =
   * final, **omitted** = the 30-day cooling-off period. Three answers, not two:
   * do not collapse the absent case into `false`.
   */
  can_reapply?: boolean | null
}

export const adminService = {
  /**
   * Queue counts for the sidebar badges. Cheap, so it is fetched on navigation
   * and after every decision — but on navigation, not on a timer: the whole
   * dashboard shares a 2000/hour budget.
   */
  async getSummary(): Promise<ApiResponse<AdminSummary>> {
    return apiClient.get<AdminSummary>('/api/admin/summary/')
  },

  /**
   * Landing-page charts. Slower than the summary — once per page load.
   * `days` is clamped server-side to 1–365 and defaults to 30.
   */
  async getMetrics(days?: number): Promise<ApiResponse<AdminMetrics>> {
    return apiClient.get<AdminMetrics>('/api/admin/metrics/', { days })
  },

  /**
   * One page of a queue.
   *
   * Omitting `status` is **not** the same as `status=all`: every queue defaults
   * to its own pending status, which is what makes it a queue. `all` is the way
   * to see everything.
   */
  async listQueue<T>(
    queue: AdminQueue,
    params?: QueryParams,
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    return apiClient.get<PaginatedResponse<T>>(`/api/admin/${queue}/`, params)
  },

  /** One row, whatever state it is in — an admin has to see what a colleague did. */
  async getQueueItem<T>(queue: AdminQueue, id: string | number): Promise<ApiResponse<T>> {
    return apiClient.get<T>(`/api/admin/${queue}/${id}/`)
  },

  /**
   * The uniform verb. What it does is the queue's business: publishing a
   * template or listing, granting `is_partner`, confirming a payment (which
   * cascades into commission creation and template enablement on its own),
   * approving a payout, or minting a credit code.
   */
  async approve<T>(
    queue: AdminQueue,
    id: string | number,
    note?: string,
  ): Promise<ApiResponse<AdminDecision<T>>> {
    return apiClient.post<AdminDecision<T>>(`/api/admin/${queue}/${id}/approve/`, {
      note: note?.trim() || undefined,
    })
  },

  /**
   * `note` is required on every queue and whitespace-only is refused — the
   * applicant sees this text and nothing else, so the form asks for it before
   * the server has to.
   */
  async reject<T>(
    queue: AdminQueue,
    id: string | number,
    note: string,
    extra: AdminRejectExtra = {},
  ): Promise<ApiResponse<AdminDecision<T>>> {
    return apiClient.post<AdminDecision<T>>(`/api/admin/${queue}/${id}/reject/`, {
      note: note.trim(),
      ...extra,
    })
  },

  async listUsers(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<AdminUserRow>>> {
    return apiClient.get<PaginatedResponse<AdminUserRow>>('/api/admin/users/', params)
  },

  async getUser(id: number): Promise<ApiResponse<AdminUserDetail>> {
    return apiClient.get<AdminUserDetail>(`/api/admin/users/${id}/`)
  },

  /**
   * The three flags staff may change. Any other key — `is_staff` and
   * `is_superuser` included — is a `400`.
   *
   * A no-op answers `200` with an empty `changed` and writes no audit row.
   * Render that as "no change", not as success.
   */
  async setUserFlags(
    id: number,
    payload: AdminUserFlagsPayload,
  ): Promise<ApiResponse<AdminFlagsResult>> {
    return apiClient.post<AdminFlagsResult>(`/api/admin/users/${id}/flags/`, payload)
  },

  /** Audit rows for one account. */
  async listUserActions(
    id: number,
    params?: QueryParams,
  ): Promise<ApiResponse<PaginatedResponse<AdminActionRow>>> {
    return apiClient.get<PaginatedResponse<AdminActionRow>>(
      `/api/admin/users/${id}/actions/`,
      params,
    )
  },

  /** The whole audit log. Read-only — writes are `405` here and in Django admin. */
  async listActions(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<AdminActionRow>>> {
    return apiClient.get<PaginatedResponse<AdminActionRow>>('/api/admin/actions/', params)
  },
}
