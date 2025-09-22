import { apiService, type ApiResponse, type PaginatedResponse } from './api'

// Commission Types and Interfaces
export interface Commission {
  id: string
  commission_reference: string
  referrer: string
  event: string
  payment: string
  commission_rate: number
  commission_amount: number
  payment_amount: number
  currency: string
  status: 'pending' | 'requested' | 'claimed' | 'rejected' | 'cancelled'
  status_display: string
  requested_at: string | null
  requested_notes: string
  claimed_at: string | null
  claim_notes: string
  rejected_at: string | null
  rejection_reason: string
  processed_by: string | null
  admin_notes: string
  created_at: string
  updated_at: string

  // Related object info for list view
  referrer_info?: {
    id: number
    email: string
    username: string
    full_name: string
  }
  event_info?: {
    id: string
    title: string
    slug: string
    start_date: string
  }
  payment_info?: {
    id: string
    payment_reference: string
    user_email: string
    status: string
  }

  // Status flags
  is_pending: boolean
  is_requested: boolean
  is_claimed: boolean
  is_rejected: boolean
  can_request_claim: boolean
  can_be_claimed: boolean
  can_be_rejected: boolean
}

export interface CommissionDetail extends Omit<Commission, 'referrer'> {
  // Detailed related objects for detail view
  referrer: {
    id: number
    email: string
    username: string
    full_name: string
    profile_picture: string | null
  }
  event_detail: {
    id: string
    title: string
    slug: string
    start_date: string
    end_date: string
    organizer_email: string
  }
  payment_detail: {
    id: string
    payment_reference: string
    user_email: string
    amount: string
    status: string
    confirmed_at: string
    pricing_plan_name: string
  }
  processed_by_detail: {
    id: number
    email: string
    username: string
    full_name: string
  } | null
}

export interface CommissionStats {
  total_commissions: number
  pending_commissions: number
  requested_commissions: number
  claimed_commissions: number
  rejected_commissions: number
  cancelled_commissions: number
  total_commission_amount: number
  claimed_commission_amount: number
  pending_commission_amount: number
  requested_commission_amount: number
}

export interface CommissionFilters {
  status?: 'pending' | 'requested' | 'claimed' | 'rejected' | 'cancelled'
  start_date?: string
  end_date?: string
  search?: string
  page?: number
  page_size?: number
}

export interface RequestClaimData {
  requested_notes?: string
}

export interface ApproveClaimData {
  claim_notes?: string
}

export interface RejectClaimData {
  rejection_reason: string
}

export interface CancelCommissionData {
  admin_notes?: string
}

// Commission API Service
export const commissionService = {
  // List commissions with optional filters
  async getCommissions(filters?: CommissionFilters): Promise<ApiResponse<PaginatedResponse<Commission>>> {
    const params: Record<string, any> = {}

    if (filters) {
      if (filters.status) params.status = filters.status
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date
      if (filters.search) params.search = filters.search
      if (filters.page) params.page = filters.page
      if (filters.page_size) params.page_size = filters.page_size
    }

    return apiService.get<PaginatedResponse<Commission>>('/api/payment/commissions/', params)
  },

  // Get commission details
  async getCommission(commissionId: string): Promise<ApiResponse<CommissionDetail>> {
    return apiService.get<CommissionDetail>(`/api/payment/commissions/${commissionId}/`)
  },

  // Request commission claim (user)
  async requestClaim(commissionId: string, data?: RequestClaimData): Promise<ApiResponse<CommissionDetail>> {
    return apiService.post<CommissionDetail>(`/api/payment/commissions/${commissionId}/request_claim/`, data || {})
  },

  // Approve commission claim (admin)
  async approveClaim(commissionId: string, data?: ApproveClaimData): Promise<ApiResponse<CommissionDetail>> {
    return apiService.post<CommissionDetail>(`/api/payment/commissions/${commissionId}/claim/`, data || {})
  },

  // Reject commission claim (admin)
  async rejectClaim(commissionId: string, data: RejectClaimData): Promise<ApiResponse<CommissionDetail>> {
    return apiService.post<CommissionDetail>(`/api/payment/commissions/${commissionId}/reject/`, data)
  },

  // Cancel commission (admin)
  async cancelCommission(commissionId: string, data?: CancelCommissionData): Promise<ApiResponse<CommissionDetail>> {
    return apiService.post<CommissionDetail>(`/api/payment/commissions/${commissionId}/cancel/`, data || {})
  },

  // Get current user's commissions
  async getMyCommissions(filters?: Omit<CommissionFilters, 'page' | 'page_size'>): Promise<ApiResponse<Commission[]>> {
    const params: Record<string, any> = {}

    if (filters) {
      if (filters.status) params.status = filters.status
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date
      if (filters.search) params.search = filters.search
    }

    return apiService.get<Commission[]>('/api/payment/commissions/my_commissions/', params)
  },

  // Get commissions for a specific event
  async getEventCommissions(eventId: string): Promise<ApiResponse<Commission[]>> {
    return apiService.get<Commission[]>('/api/payment/commissions/event_commissions/', { event_id: eventId })
  },

  // Get commission statistics for current user
  async getCommissionStats(): Promise<ApiResponse<CommissionStats>> {
    return apiService.get<CommissionStats>('/api/payment/commissions/commission_stats/')
  },

  // Get pending commissions (admin)
  async getPendingCommissions(): Promise<ApiResponse<Commission[]>> {
    return apiService.get<Commission[]>('/api/payment/commissions/pending_commissions/')
  }
}