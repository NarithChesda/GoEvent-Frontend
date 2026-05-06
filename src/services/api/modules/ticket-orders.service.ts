/**
 * Ticket Orders API service.
 *
 * Buyer endpoints:
 *   POST   /api/events/{event_id}/ticket-orders/                       checkout / create order
 *   GET    /api/ticket-orders/                                         list my orders
 *   GET    /api/ticket-orders/{confirmation_code}/                     order detail (line items, tickets, refund)
 *   POST   /api/ticket-orders/{confirmation_code}/submit-proof/        upload payment proof (multipart)
 *   POST   /api/ticket-orders/{confirmation_code}/cancel/              buyer cancels pending/awaiting
 *   POST   /api/ticket-orders/{confirmation_code}/refund/              request refund (24h window)
 *
 * Organizer endpoints:
 *   GET    /api/events/{event_id}/organizer/ticket-orders/             all orders for the event (?status=)
 *   GET    /api/events/{event_id}/organizer/ticket-orders/{code}/      organizer order detail (same payload as buyer detail)
 *   POST   /api/ticket-orders/{code}/confirm/                          approve proof, issue tickets
 *   POST   /api/ticket-orders/{code}/reject/                           reject proof, release seats
 *   POST   /api/events/{event_id}/comp-tickets/                        issue complimentary tickets (by recipient_email)
 *   POST   /api/ticket-orders/{code}/check-in/                         group check-in: scan one code, enter the whole party
 *   POST   /api/events/{event_id}/door-sales/                          walk-up sale (cash / card_offline / other), optional auto-check-in
 *
 * The organizer routes live under `/events/{id}/organizer/...` to keep
 * permissions clear — those endpoints require `IsEventOwnerOrCollaborator`,
 * while the bare `/api/ticket-orders/` (buyer) is scoped to the request user.
 *
 * Confirmation codes are user-facing strings shaped like "TIX-A3F9K2P7"; the
 * backend uses them as URL slugs on the order endpoints.
 */

import { apiClient } from '../core/ApiClient'
import type { ApiResponse, PaginatedResponse } from '../types/api.types'
import type {
  TicketOrderDetail,
  TicketOrderListItem,
  TicketOrderFilters,
  CreateTicketOrderRequest,
  RefundRequestPayload,
  ConfirmOrderRequest,
  RejectOrderRequest,
  CompTicketRequest,
  TicketRefund,
  OrderCheckInRequest,
  OrderCheckInResponse,
  DoorSaleRequest,
} from '../types/ticket.types'

const orderRoot = (code: string) => `/api/ticket-orders/${code}/`

export const ticketOrdersService = {
  // ---------------------------------------------------------------- buyer
  /** Create a pending order (reserves seats). */
  create(
    eventId: string,
    payload: CreateTicketOrderRequest,
  ): Promise<ApiResponse<TicketOrderDetail>> {
    return apiClient.post<TicketOrderDetail>(
      `/api/events/${eventId}/ticket-orders/`,
      payload,
    )
  },

  /** List the current user's orders. */
  listMine(
    filters?: TicketOrderFilters,
  ): Promise<ApiResponse<PaginatedResponse<TicketOrderListItem>>> {
    return apiClient.get<PaginatedResponse<TicketOrderListItem>>(
      '/api/ticket-orders/',
      filters,
    )
  },

  /** Order detail (line items + tickets after payment + answers + refund). */
  get(confirmationCode: string): Promise<ApiResponse<TicketOrderDetail>> {
    return apiClient.get<TicketOrderDetail>(orderRoot(confirmationCode))
  },

  /**
   * Multipart proof upload. Caller is responsible for building the FormData;
   * required fields are `payment_method` (PaymentMethod ID) and `payment_proof`
   * (file). Optional: `transaction_reference`, `buyer_notes`.
   */
  submitProof(
    confirmationCode: string,
    formData: FormData,
  ): Promise<ApiResponse<TicketOrderDetail>> {
    return apiClient.postFormData<TicketOrderDetail>(
      `${orderRoot(confirmationCode)}submit-proof/`,
      formData,
    )
  },

  cancel(confirmationCode: string): Promise<ApiResponse<TicketOrderDetail>> {
    return apiClient.post<TicketOrderDetail>(`${orderRoot(confirmationCode)}cancel/`)
  },

  requestRefund(
    confirmationCode: string,
    payload: RefundRequestPayload,
  ): Promise<ApiResponse<TicketRefund>> {
    return apiClient.post<TicketRefund>(`${orderRoot(confirmationCode)}refund/`, payload)
  },

  // ----------------------------------------------------------- organizer
  /** All orders for an event (organizer / collaborator view). */
  listForEvent(
    eventId: string,
    filters?: TicketOrderFilters,
  ): Promise<ApiResponse<PaginatedResponse<TicketOrderListItem>>> {
    return apiClient.get<PaginatedResponse<TicketOrderListItem>>(
      `/api/events/${eventId}/organizer/ticket-orders/`,
      filters,
    )
  },

  /**
   * Organizer-side order detail. Same payload shape as the buyer's `get`,
   * but enforces organizer/collaborator permissions on the event.
   */
  getForEvent(
    eventId: string,
    confirmationCode: string,
  ): Promise<ApiResponse<TicketOrderDetail>> {
    return apiClient.get<TicketOrderDetail>(
      `/api/events/${eventId}/organizer/ticket-orders/${confirmationCode}/`,
    )
  },

  /** Approve uploaded proof; backend issues tickets and starts the refund window. */
  confirm(
    confirmationCode: string,
    payload: ConfirmOrderRequest = {},
  ): Promise<ApiResponse<TicketOrderDetail>> {
    return apiClient.post<TicketOrderDetail>(
      `${orderRoot(confirmationCode)}confirm/`,
      payload,
    )
  },

  /** Reject uploaded proof; backend cancels the order and releases seats. */
  reject(
    confirmationCode: string,
    payload: RejectOrderRequest,
  ): Promise<ApiResponse<TicketOrderDetail>> {
    return apiClient.post<TicketOrderDetail>(
      `${orderRoot(confirmationCode)}reject/`,
      payload,
    )
  },

  /**
   * Issue complimentary (free) tickets to a registered user by email.
   * Returns 404 with `{ recipient_email: [...] }` if the email isn't a known user
   * — frontend should show that message inline rather than starting a sign-up flow.
   */
  issueComp(
    eventId: string,
    payload: CompTicketRequest,
  ): Promise<ApiResponse<TicketOrderDetail>> {
    return apiClient.post<TicketOrderDetail>(
      `/api/events/${eventId}/comp-tickets/`,
      payload,
    )
  },

  // ----------------------------------------------------------- door check-in
  /**
   * Group check-in for everyone on a single order. Scan one code (the order's
   * `confirmation_code`, e.g. `TIX-A4Z9PXKR`) and enter the whole party in
   * one round-trip. If `ticket_ids` is omitted, every valid ticket on the
   * order is processed; if provided, only those UUIDs are touched.
   *
   * The single `idempotency_key` is expanded server-side to per-ticket
   * sub-keys via UUID5, so retries are safe end-to-end. Per-ticket outcomes
   * come back in `results[]`; `summary` gives entered/reentered/rejected
   * counts for the UI.
   */
  groupCheckIn(
    confirmationCode: string,
    payload: OrderCheckInRequest = {},
  ): Promise<ApiResponse<OrderCheckInResponse>> {
    return apiClient.post<OrderCheckInResponse>(
      `${orderRoot(confirmationCode)}check-in/`,
      payload,
    )
  },

  /**
   * Walk-up sale at the door. Creates a paid order and issues tickets in one
   * atomic call. Set `auto_check_in: true` to mark the issued tickets `used`
   * immediately so the customer walks straight in. The customer does not
   * need an account — buyer fields are captured as snapshots.
   *
   * Currency is inferred from the tier(s); mixed-currency carts are
   * rejected. Sale-window enforcement is bypassed (staff can sell after the
   * online window closes), but tier `is_active=false` is still respected.
   * `auto_check_in` failures do NOT roll back the sale.
   */
  createDoorSale(
    eventId: string,
    payload: DoorSaleRequest,
  ): Promise<ApiResponse<TicketOrderDetail>> {
    return apiClient.post<TicketOrderDetail>(
      `/api/events/${eventId}/door-sales/`,
      payload,
    )
  },
}
