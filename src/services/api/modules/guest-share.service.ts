/**
 * Shareable guest-list links.
 *
 * Two halves, deliberately in one file because they are two ends of the same
 * link:
 *
 *  - `guestListShareService` — the **organizer** side. JWT, event-scoped, lives
 *    behind the manage screen's Share control.
 *  - `sharedGuestListService` — the **recipient** side. No account, no JWT; the
 *    code in the URL is the credential, exactly as `?g=<shortcode>` is on the
 *    showcase's RSVP and guestbook writes.
 *
 * Auth model, mirroring the shortcode partition already used by
 * `comments.service` and `rsvp.service`: on every `/api/guest-share/{code}/`
 * endpoint the **code decides**, and any `Authorization` header is ignored. GETs
 * go through `getPublic` so a visitor who happens to be signed in as somebody
 * else does not send a bearer token that could be preferred over the code;
 * writes have no public variant, so the header may ride along and the backend
 * must ignore it.
 */

import { apiClient } from '../core/ApiClient'
import { guestService, guestGroupService } from './guests.service'
import type {
  ApiResponse,
  PaginatedResponse,
  EventGuest,
  GuestGroup,
  GuestStats,
} from '../types'
import type {
  CreateGuestListShareRequest,
  GuestListShare,
  GuestShareContext,
  SharedGuestListFilters,
  UpdateGuestListShareRequest,
} from '../types/guest-share.types'

// ---------------------------------------------------------------------------
// Organizer side — manage the links
// ---------------------------------------------------------------------------

export const guestListShareService = {
  /** Every share ever minted for this event, revoked ones included. */
  async listShares(eventId: string): Promise<ApiResponse<PaginatedResponse<GuestListShare>>> {
    return apiClient.get<PaginatedResponse<GuestListShare>>(
      `/api/events/${eventId}/guest-list-shares/`,
    )
  },

  async createShare(
    eventId: string,
    data: CreateGuestListShareRequest,
  ): Promise<ApiResponse<GuestListShare>> {
    return apiClient.post<GuestListShare>(`/api/events/${eventId}/guest-list-shares/`, data)
  },

  /** Change access level, relabel, re-date — or revoke via `is_active: false`. */
  async updateShare(
    eventId: string,
    shareId: number,
    data: UpdateGuestListShareRequest,
  ): Promise<ApiResponse<GuestListShare>> {
    return apiClient.patch<GuestListShare>(
      `/api/events/${eventId}/guest-list-shares/${shareId}/`,
      data,
    )
  },

  /**
   * Destroy the record outright.
   *
   * Prefer `updateShare(..., { is_active: false })` in the UI: revoking keeps
   * the row, so "who did I send a link to, and when was it last opened?" still
   * has an answer after the link stops working.
   */
  async deleteShare(eventId: string, shareId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/events/${eventId}/guest-list-shares/${shareId}/`)
  },
}

// ---------------------------------------------------------------------------
// Recipient side — the code is the credential
// ---------------------------------------------------------------------------

export const sharedGuestListService = {
  /**
   * Resolve the link: which event, who shared it, and what the holder may do.
   * The page calls this first and renders nothing else until it answers, because
   * every other request below is meaningless if this one fails.
   *
   * Failure statuses are load-bearing — see `GuestShareErrorReason`:
   * `404` unknown code, `403` revoked, `410` expired.
   */
  async getContext(code: string): Promise<ApiResponse<GuestShareContext>> {
    return apiClient.getPublic<GuestShareContext>(`/api/guest-share/${code}/`)
  },

  // ---- guests ------------------------------------------------------------

  async getGuests(
    code: string,
    filters?: SharedGuestListFilters,
  ): Promise<ApiResponse<PaginatedResponse<EventGuest>>> {
    return apiClient.getPublic<PaginatedResponse<EventGuest>>(
      `/api/guest-share/${code}/guests/`,
      filters,
    )
  },

  async getGuestStats(code: string): Promise<ApiResponse<GuestStats>> {
    return apiClient.getPublic<GuestStats>(`/api/guest-share/${code}/guests/stats/`)
  },

  async createGuest(
    code: string,
    data: { name: string; group: number; seat_number?: string },
  ): Promise<ApiResponse<EventGuest>> {
    return apiClient.post<EventGuest>(`/api/guest-share/${code}/guests/`, data)
  },

  async updateGuest(
    code: string,
    guestId: number,
    data: Record<string, unknown>,
  ): Promise<ApiResponse<EventGuest>> {
    return apiClient.patch<EventGuest>(`/api/guest-share/${code}/guests/${guestId}/`, data)
  },

  async deleteGuest(code: string, guestId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/guest-share/${code}/guests/${guestId}/`)
  },

  async markInvitationSent(code: string, guestId: number): Promise<ApiResponse<EventGuest>> {
    return apiClient.patch<EventGuest>(
      `/api/guest-share/${code}/guests/${guestId}/mark-sent/`,
      {},
    )
  },

  async bulkMarkInvitationSent(
    code: string,
    guestIds: number[],
  ): Promise<ApiResponse<{ status: string; count: number }>> {
    return apiClient.post<{ status: string; count: number }>(
      `/api/guest-share/${code}/guests/bulk-mark-sent/`,
      { guest_ids: guestIds },
    )
  },

  async bulkDeleteGuests(
    code: string,
    guestIds: number[],
  ): Promise<ApiResponse<{ status: string; count: number }>> {
    return apiClient.post<{ status: string; count: number }>(
      `/api/guest-share/${code}/guests/bulk-delete/`,
      { guest_ids: guestIds },
    )
  },

  // ---- groups ------------------------------------------------------------

  async getGroups(code: string): Promise<ApiResponse<PaginatedResponse<GuestGroup>>> {
    return apiClient.getPublic<PaginatedResponse<GuestGroup>>(
      `/api/guest-share/${code}/guest-groups/`,
    )
  },

  async createGroup(
    code: string,
    data: { name: string; description?: string; color?: string; order?: number },
  ): Promise<ApiResponse<GuestGroup>> {
    return apiClient.post<GuestGroup>(`/api/guest-share/${code}/guest-groups/`, data)
  },

  async updateGroup(
    code: string,
    groupId: number,
    data: Partial<{ name: string; description?: string; color?: string; order?: number }>,
  ): Promise<ApiResponse<GuestGroup>> {
    return apiClient.patch<GuestGroup>(
      `/api/guest-share/${code}/guest-groups/${groupId}/`,
      data,
    )
  },

  async deleteGroup(code: string, groupId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/guest-share/${code}/guest-groups/${groupId}/`)
  },

  /**
   * Return type is borrowed from the organizer's own bulk import rather than
   * re-declared: the two endpoints must answer with the same envelope, and a
   * `Pick`ed transport will not compile if they drift.
   */
  async bulkImportToGroup(
    code: string,
    groupId: number,
    file: File,
  ): ReturnType<typeof guestGroupService.bulkImportToGroup> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('group', groupId.toString())
    return apiClient.postFormData(`/api/guest-share/${code}/guests/bulk-import/`, formData)
  },
}

// ---------------------------------------------------------------------------
// Transport — the one thing the guest-management store swaps
// ---------------------------------------------------------------------------

/**
 * The subset of the guest services the store actually calls.
 *
 * Typed as a `Pick` of the real services rather than re-declared, so a share
 * transport that drifts from the organizer's contract fails to compile instead
 * of failing in the browser. Every method keeps `eventId` as its first
 * parameter even though the share transport ignores it — that is what lets the
 * store's ~1000 lines of pagination and optimistic-update logic stay identical
 * for both audiences.
 */
export interface GuestDataTransport {
  guests: Pick<
    typeof guestService,
    | 'getGuests'
    | 'getGuestStats'
    | 'createGuest'
    | 'updateGuest'
    | 'deleteGuest'
    | 'markInvitationSent'
    | 'bulkMarkInvitationSent'
    | 'bulkDeleteGuests'
  >
  groups: Pick<
    typeof guestGroupService,
    'getGroups' | 'createGroup' | 'updateGroup' | 'deleteGroup' | 'bulkImportToGroup'
  >
}

/** The signed-in organizer's own transport: the services, unchanged. */
export const ownerGuestTransport: GuestDataTransport = {
  guests: guestService,
  groups: guestGroupService,
}

/**
 * A transport that reaches the same data through a share code.
 *
 * `_eventId` is discarded on every method: the code already names the event, and
 * a recipient must not be able to point a share at a different one by editing a
 * request. Keeping the parameter is what preserves the shared call signature.
 */
export function createSharedGuestTransport(code: string): GuestDataTransport {
  return {
    guests: {
      getGuests: (_eventId, filters) => sharedGuestListService.getGuests(code, filters),
      getGuestStats: () => sharedGuestListService.getGuestStats(code),
      createGuest: (_eventId, data) => sharedGuestListService.createGuest(code, data),
      updateGuest: (_eventId, guestId, data) =>
        sharedGuestListService.updateGuest(code, guestId, data as Record<string, unknown>),
      deleteGuest: (_eventId, guestId) => sharedGuestListService.deleteGuest(code, guestId),
      markInvitationSent: (_eventId, guestId) =>
        sharedGuestListService.markInvitationSent(code, guestId),
      bulkMarkInvitationSent: (_eventId, guestIds) =>
        sharedGuestListService.bulkMarkInvitationSent(code, guestIds),
      bulkDeleteGuests: (_eventId, guestIds) =>
        sharedGuestListService.bulkDeleteGuests(code, guestIds),
    },
    groups: {
      getGroups: () => sharedGuestListService.getGroups(code),
      createGroup: (_eventId, data) => sharedGuestListService.createGroup(code, data),
      updateGroup: (_eventId, groupId, data) =>
        sharedGuestListService.updateGroup(code, groupId, data),
      deleteGroup: (_eventId, groupId) => sharedGuestListService.deleteGroup(code, groupId),
      bulkImportToGroup: (_eventId, groupId, file) =>
        sharedGuestListService.bulkImportToGroup(code, groupId, file),
    },
  }
}
