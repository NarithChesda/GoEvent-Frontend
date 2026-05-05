/**
 * Ticket Refunds API service.
 *
 *   GET  /api/events/{event_id}/refunds/                       list refund requests for the event (?status=)
 *   POST /api/refunds/{id}/approve/                            approve refund (records refund_transaction_reference)
 *   POST /api/refunds/{id}/reject/                             reject refund (admin_notes required)
 *
 * Approval marks tickets refunded, releases seats, and cancels the related
 * commission. Rejection returns the order to `paid` and leaves tickets valid.
 */

import { apiClient } from '../core/ApiClient'
import type { ApiResponse, PaginatedResponse } from '../types/api.types'
import type {
  TicketRefund,
  RefundFilters,
  ApproveRefundRequest,
  RejectRefundRequest,
} from '../types/ticket.types'

export const ticketRefundsService = {
  listForEvent(
    eventId: string,
    filters?: RefundFilters,
  ): Promise<ApiResponse<PaginatedResponse<TicketRefund>>> {
    return apiClient.get<PaginatedResponse<TicketRefund>>(
      `/api/events/${eventId}/refunds/`,
      filters,
    )
  },

  approve(
    refundId: string,
    payload: ApproveRefundRequest = {},
  ): Promise<ApiResponse<TicketRefund>> {
    return apiClient.post<TicketRefund>(`/api/refunds/${refundId}/approve/`, payload)
  },

  reject(
    refundId: string,
    payload: RejectRefundRequest,
  ): Promise<ApiResponse<TicketRefund>> {
    return apiClient.post<TicketRefund>(`/api/refunds/${refundId}/reject/`, payload)
  },
}
