/**
 * Career API Service
 * Handles career page, departments, positions, applications, benefits, and testimonials
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  CareerDepartment,
  CreateDepartmentRequest,
  DepartmentFilters,
  CareerPosition,
  CreatePositionRequest,
  PositionFilters,
  CareerApplication,
  ApplicationResponse,
  UpdateApplicationStatusRequest,
  ApplicationFilters,
  CareerBenefit,
  BenefitFilters,
  CareerTestimonial,
  TestimonialFilters,
  CareerPageSettings,
} from '../types'

// ============================================================================
// CAREER DEPARTMENTS SERVICE
// ============================================================================

export const careerDepartmentsService = {
  /**
   * Get all career departments
   * Public endpoint - no auth required
   */
  async getDepartments(
    filters?: DepartmentFilters,
  ): Promise<ApiResponse<PaginatedResponse<CareerDepartment>>> {
    return apiClient.getPublic<PaginatedResponse<CareerDepartment>>(
      '/api/core-data/career/departments/',
      filters,
    )
  },

  /**
   * Get single department by ID
   * Public endpoint - no auth required
   */
  async getDepartment(id: number): Promise<ApiResponse<CareerDepartment>> {
    return apiClient.getPublic<CareerDepartment>(`/api/core-data/career/departments/${id}/`)
  },

  /**
   * Create new department
   * Staff only - auth required
   */
  async createDepartment(data: CreateDepartmentRequest): Promise<ApiResponse<CareerDepartment>> {
    return apiClient.post<CareerDepartment>('/api/core-data/career/departments/', data)
  },

  /**
   * Update department (full update)
   * Staff only - auth required
   */
  async updateDepartment(
    id: number,
    data: CreateDepartmentRequest,
  ): Promise<ApiResponse<CareerDepartment>> {
    return apiClient.put<CareerDepartment>(`/api/core-data/career/departments/${id}/`, data)
  },

  /**
   * Partially update department
   * Staff only - auth required
   */
  async patchDepartment(
    id: number,
    data: Partial<CreateDepartmentRequest>,
  ): Promise<ApiResponse<CareerDepartment>> {
    return apiClient.patch<CareerDepartment>(`/api/core-data/career/departments/${id}/`, data)
  },

  /**
   * Delete department
   * Staff only - auth required
   */
  async deleteDepartment(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/core-data/career/departments/${id}/`)
  },
}

// ============================================================================
// CAREER POSITIONS SERVICE
// ============================================================================

export const careerPositionsService = {
  /**
   * Get all career positions with pagination and filters
   * Public endpoint - no auth required
   */
  async getPositions(
    filters?: PositionFilters,
  ): Promise<ApiResponse<PaginatedResponse<CareerPosition>>> {
    return apiClient.getPublic<PaginatedResponse<CareerPosition>>(
      '/api/core-data/career/positions/',
      filters,
    )
  },

  /**
   * Get single position by slug
   * Automatically increments view count
   * Public endpoint - no auth required
   */
  async getPosition(slug: string): Promise<ApiResponse<CareerPosition>> {
    return apiClient.getPublic<CareerPosition>(`/api/core-data/career/positions/${slug}/`)
  },

  /**
   * Get featured positions (up to 6, no pagination)
   * Public endpoint - no auth required
   */
  async getFeaturedPositions(): Promise<ApiResponse<CareerPosition[]>> {
    return apiClient.getPublic<CareerPosition[]>('/api/core-data/career/positions/featured/')
  },

  /**
   * Search positions by query
   * Public endpoint - no auth required
   */
  async searchPositions(query: string): Promise<ApiResponse<PaginatedResponse<CareerPosition>>> {
    return apiClient.getPublic<PaginatedResponse<CareerPosition>>(
      '/api/core-data/career/positions/',
      { search: query },
    )
  },

  /**
   * Create new position
   * Staff only - auth required
   */
  async createPosition(data: CreatePositionRequest): Promise<ApiResponse<CareerPosition>> {
    return apiClient.post<CareerPosition>('/api/core-data/career/positions/', data)
  },

  /**
   * Update position (full update)
   * Staff only - auth required
   */
  async updatePosition(
    slug: string,
    data: CreatePositionRequest,
  ): Promise<ApiResponse<CareerPosition>> {
    return apiClient.put<CareerPosition>(`/api/core-data/career/positions/${slug}/`, data)
  },

  /**
   * Partially update position
   * Staff only - auth required
   */
  async patchPosition(
    slug: string,
    data: Partial<CreatePositionRequest>,
  ): Promise<ApiResponse<CareerPosition>> {
    return apiClient.patch<CareerPosition>(`/api/core-data/career/positions/${slug}/`, data)
  },

  /**
   * Delete position
   * Staff only - auth required
   */
  async deletePosition(slug: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/core-data/career/positions/${slug}/`)
  },
}

// ============================================================================
// CAREER APPLICATIONS SERVICE
// ============================================================================

export const careerApplicationsService = {
  /**
   * Submit job application
   * Public endpoint - no auth required
   * Uses FormData for resume file upload
   */
  async submitApplication(formData: FormData): Promise<ApiResponse<ApplicationResponse>> {
    return apiClient.postFormData<ApplicationResponse>(
      '/api/core-data/career/applications/',
      formData,
    )
  },

  /**
   * Get all applications with filters
   * Staff only - auth required
   */
  async getApplications(
    filters?: ApplicationFilters,
  ): Promise<ApiResponse<PaginatedResponse<CareerApplication>>> {
    return apiClient.get<PaginatedResponse<CareerApplication>>(
      '/api/core-data/career/applications/',
      filters,
    )
  },

  /**
   * Get single application by ID
   * Staff only - auth required
   */
  async getApplication(id: number): Promise<ApiResponse<CareerApplication>> {
    return apiClient.get<CareerApplication>(`/api/core-data/career/applications/${id}/`)
  },

  /**
   * Update application (full update)
   * Staff only - auth required
   */
  async updateApplication(
    id: number,
    data: Partial<CareerApplication>,
  ): Promise<ApiResponse<CareerApplication>> {
    return apiClient.put<CareerApplication>(`/api/core-data/career/applications/${id}/`, data)
  },

  /**
   * Partially update application
   * Staff only - auth required
   */
  async patchApplication(
    id: number,
    data: Partial<CareerApplication>,
  ): Promise<ApiResponse<CareerApplication>> {
    return apiClient.patch<CareerApplication>(`/api/core-data/career/applications/${id}/`, data)
  },

  /**
   * Quick status update for application
   * Staff only - auth required
   */
  async updateApplicationStatus(
    id: number,
    data: UpdateApplicationStatusRequest,
  ): Promise<ApiResponse<ApplicationResponse>> {
    return apiClient.post<ApplicationResponse>(
      `/api/core-data/career/applications/${id}/update_status/`,
      data,
    )
  },

  /**
   * Delete application
   * Staff only - auth required
   */
  async deleteApplication(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/core-data/career/applications/${id}/`)
  },
}

// ============================================================================
// CAREER BENEFITS SERVICE
// ============================================================================

export const careerBenefitsService = {
  /**
   * Get all benefits
   * Public endpoint - no auth required
   */
  async getBenefits(
    filters?: BenefitFilters,
  ): Promise<ApiResponse<PaginatedResponse<CareerBenefit>>> {
    return apiClient.getPublic<PaginatedResponse<CareerBenefit>>(
      '/api/core-data/career/benefits/',
      filters,
    )
  },

  /**
   * Get single benefit by ID
   * Public endpoint - no auth required
   */
  async getBenefit(id: number): Promise<ApiResponse<CareerBenefit>> {
    return apiClient.getPublic<CareerBenefit>(`/api/core-data/career/benefits/${id}/`)
  },

  /**
   * Create new benefit
   * Staff only - auth required
   * Uses FormData for image upload
   */
  async createBenefit(formData: FormData): Promise<ApiResponse<CareerBenefit>> {
    return apiClient.postFormData<CareerBenefit>('/api/core-data/career/benefits/', formData)
  },

  /**
   * Update benefit (full update)
   * Staff only - auth required
   * Uses FormData for image upload
   */
  async updateBenefit(id: number, formData: FormData): Promise<ApiResponse<CareerBenefit>> {
    return apiClient.putFormData<CareerBenefit>(`/api/core-data/career/benefits/${id}/`, formData)
  },

  /**
   * Partially update benefit
   * Staff only - auth required
   * Uses FormData for image upload
   */
  async patchBenefit(id: number, formData: FormData): Promise<ApiResponse<CareerBenefit>> {
    return apiClient.patchFormData<CareerBenefit>(
      `/api/core-data/career/benefits/${id}/`,
      formData,
    )
  },

  /**
   * Delete benefit
   * Staff only - auth required
   */
  async deleteBenefit(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/core-data/career/benefits/${id}/`)
  },
}

// ============================================================================
// CAREER TESTIMONIALS SERVICE
// ============================================================================

export const careerTestimonialsService = {
  /**
   * Get all testimonials with filters
   * Public endpoint - no auth required
   */
  async getTestimonials(
    filters?: TestimonialFilters,
  ): Promise<ApiResponse<PaginatedResponse<CareerTestimonial>>> {
    return apiClient.getPublic<PaginatedResponse<CareerTestimonial>>(
      '/api/core-data/career/testimonials/',
      filters,
    )
  },

  /**
   * Get single testimonial by ID
   * Public endpoint - no auth required
   */
  async getTestimonial(id: number): Promise<ApiResponse<CareerTestimonial>> {
    return apiClient.getPublic<CareerTestimonial>(`/api/core-data/career/testimonials/${id}/`)
  },

  /**
   * Create new testimonial
   * Staff only - auth required
   * Uses FormData for photo upload
   */
  async createTestimonial(formData: FormData): Promise<ApiResponse<CareerTestimonial>> {
    return apiClient.postFormData<CareerTestimonial>(
      '/api/core-data/career/testimonials/',
      formData,
    )
  },

  /**
   * Update testimonial (full update)
   * Staff only - auth required
   * Uses FormData for photo upload
   */
  async updateTestimonial(
    id: number,
    formData: FormData,
  ): Promise<ApiResponse<CareerTestimonial>> {
    return apiClient.putFormData<CareerTestimonial>(
      `/api/core-data/career/testimonials/${id}/`,
      formData,
    )
  },

  /**
   * Partially update testimonial
   * Staff only - auth required
   * Uses FormData for photo upload
   */
  async patchTestimonial(
    id: number,
    formData: FormData,
  ): Promise<ApiResponse<CareerTestimonial>> {
    return apiClient.patchFormData<CareerTestimonial>(
      `/api/core-data/career/testimonials/${id}/`,
      formData,
    )
  },

  /**
   * Delete testimonial
   * Staff only - auth required
   */
  async deleteTestimonial(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/core-data/career/testimonials/${id}/`)
  },
}

// ============================================================================
// CAREER SETTINGS SERVICE
// ============================================================================

export const careerSettingsService = {
  /**
   * Get career page settings (public endpoint)
   * No auth required
   */
  async getSettings(): Promise<ApiResponse<CareerPageSettings>> {
    return apiClient.getPublic<CareerPageSettings>('/api/core-data/career/settings/')
  },

  /**
   * Get public career page settings (alternative endpoint)
   * No auth required
   */
  async getPublicSettings(): Promise<ApiResponse<CareerPageSettings>> {
    return apiClient.getPublic<CareerPageSettings>('/api/core-data/career/settings/public/')
  },

  /**
   * Update settings (singleton with ID=1)
   * Staff only - auth required
   * Uses FormData for image upload
   */
  async updateSettings(formData: FormData): Promise<ApiResponse<CareerPageSettings>> {
    return apiClient.patchFormData<CareerPageSettings>(
      '/api/core-data/career/settings/1/',
      formData,
    )
  },
}
