/**
 * Services API Module
 * Handles vendor profiles, service categories, and service listings
 */

import { apiClient } from '../core/ApiClient'
import type {
  ApiResponse,
  PaginatedResponse,
  VendorProfile,
  VendorProfileBrief,
  CreateVendorProfileData,
  UpdateVendorProfileData,
  VendorFilters,
  ServiceCategory,
  ServiceListing,
  ServiceListingBrief,
  CreateServiceListingData,
  UpdateServiceListingData,
  ListingFilters,
  ServiceMedia,
  UploadServiceMediaData,
  BulkReorderServiceMediaData,
  ServiceListingAnalytics,
  ListingAnalyticsParams,
  TrackViewData,
  TrackContactData,
} from '../types'

/**
 * Vendor Profile Service
 * Manages vendor profile operations
 */
export const vendorService = {
  /**
   * Create a new vendor profile for the current user
   */
  async createProfile(data: CreateVendorProfileData): Promise<ApiResponse<VendorProfile>> {
    return apiClient.post<VendorProfile>('/api/services/vendor-profile/', data)
  },

  /**
   * Get the current user's vendor profile
   */
  async getMyProfile(): Promise<ApiResponse<VendorProfile>> {
    return apiClient.get<VendorProfile>('/api/services/vendor-profile/me/')
  },

  /**
   * Update the current user's vendor profile
   * Supports both JSON and FormData (for logo/cover_image uploads)
   */
  async updateMyProfile(
    data: UpdateVendorProfileData | FormData,
  ): Promise<ApiResponse<VendorProfile>> {
    return apiClient.patch<VendorProfile>('/api/services/vendor-profile/me/', data)
  },

  /**
   * Update vendor profile with file uploads (logo/cover_image)
   * Helper method for uploading images
   */
  async updateMyProfileWithFiles(
    data: UpdateVendorProfileData & {
      logo?: File
      cover_image?: File
    },
  ): Promise<ApiResponse<VendorProfile>> {
    const formData = new FormData()

    // Append text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'logo' && key !== 'cover_image' && value !== undefined && value !== null) {
        formData.append(key, String(value))
      }
    })

    // Append file fields
    if (data.logo instanceof File) {
      formData.append('logo', data.logo)
    }
    if (data.cover_image instanceof File) {
      formData.append('cover_image', data.cover_image)
    }

    return apiClient.patch<VendorProfile>('/api/services/vendor-profile/me/', formData)
  },

  /**
   * List all verified vendor profiles (public endpoint)
   */
  async listVendors(filters?: VendorFilters): Promise<ApiResponse<PaginatedResponse<VendorProfileBrief>>> {
    return apiClient.getPublic<PaginatedResponse<VendorProfileBrief>>(
      '/api/services/vendor-profiles/',
      filters,
    )
  },

  /**
   * Get a specific vendor profile by ID (public endpoint)
   */
  async getVendor(vendorId: string): Promise<ApiResponse<VendorProfile>> {
    return apiClient.getPublic<VendorProfile>(`/api/services/vendor-profiles/${vendorId}/`)
  },
}

/**
 * Service Categories Service
 * Manages service category browsing
 */
export const serviceCategoriesService = {
  /**
   * List all service categories (public endpoint)
   * Returns hierarchical category structure with subcategories
   */
  async listCategories(): Promise<ApiResponse<ServiceCategory[]>> {
    return apiClient.getPublic<ServiceCategory[]>('/api/services/categories/')
  },
}

/**
 * Service Listings Service
 * Manages service listing CRUD operations, media, and analytics
 */
export const serviceListingsService = {
  /**
   * List own service listings (authenticated)
   * Returns full listing details for the current vendor
   */
  async getMyListings(filters?: ListingFilters): Promise<ApiResponse<PaginatedResponse<ServiceListing>>> {
    return apiClient.get<PaginatedResponse<ServiceListing>>('/api/services/listings/', filters)
  },

  /**
   * Create a new service listing
   */
  async createListing(data: CreateServiceListingData): Promise<ApiResponse<ServiceListing>> {
    return apiClient.post<ServiceListing>('/api/services/listings/', data)
  },

  /**
   * Browse approved service listings (public endpoint)
   * Returns brief listing details for public browsing
   */
  async browseListings(filters?: ListingFilters): Promise<ApiResponse<PaginatedResponse<ServiceListingBrief>>> {
    return apiClient.getPublic<PaginatedResponse<ServiceListingBrief>>(
      '/api/services/listings/browse/',
      filters,
    )
  },

  /**
   * Get a specific service listing by ID (public endpoint)
   * Returns full listing details
   */
  async getListing(listingId: string): Promise<ApiResponse<ServiceListing>> {
    return apiClient.getPublic<ServiceListing>(`/api/services/listings/${listingId}/`)
  },

  /**
   * Update a service listing (owner only)
   * Partial update - only provided fields will be updated
   */
  async updateListing(
    listingId: string,
    data: UpdateServiceListingData,
  ): Promise<ApiResponse<ServiceListing>> {
    return apiClient.patch<ServiceListing>(`/api/services/listings/${listingId}/`, data)
  },

  /**
   * Delete a service listing (owner only)
   */
  async deleteListing(listingId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/services/listings/${listingId}/`)
  },

  /**
   * Submit a listing for review
   * Changes status from draft to pending_review
   */
  async submitForReview(listingId: string): Promise<ApiResponse<ServiceListing>> {
    return apiClient.post<ServiceListing>(
      `/api/services/listings/${listingId}/submit-for-review/`,
      {},
    )
  },

  // Media Management Methods

  /**
   * List all media for a service listing
   */
  async getListingMedia(listingId: string): Promise<ApiResponse<ServiceMedia[]>> {
    return apiClient.get<ServiceMedia[]>(`/api/services/listings/${listingId}/media/`)
  },

  /**
   * Upload a single media item to a listing
   */
  async uploadMedia(
    listingId: string,
    file: File,
    mediaData?: UploadServiceMediaData,
    options?: { onProgress?: (progress: number) => void },
  ): Promise<ApiResponse<ServiceMedia>> {
    const formData = new FormData()
    formData.append('image', file)

    if (mediaData?.caption) {
      formData.append('caption', mediaData.caption)
    }
    if (mediaData?.is_cover !== undefined) {
      formData.append('is_cover', mediaData.is_cover.toString())
    }

    return apiClient.uploadFile<ServiceMedia>(
      `/api/services/listings/${listingId}/media/`,
      formData,
      options,
    )
  },

  /**
   * Bulk upload multiple media items
   * Supports optional captions for each image
   */
  async bulkUploadMedia(
    listingId: string,
    files: File[],
    options?: {
      captions?: string[]
      onProgress?: (progress: number) => void
    },
  ): Promise<
    ApiResponse<{
      status: string
      count: number
      media: ServiceMedia[]
    }>
  > {
    const additionalFields: Record<string, string[]> = {}

    if (options?.captions && options.captions.length > 0) {
      additionalFields.captions = options.captions
    }

    const result = await apiClient.bulkUploadFiles<{
      status: string
      count: number
      media: ServiceMedia[]
    }>(
      `/api/services/listings/${listingId}/media/bulk-upload/`,
      files,
      {
        fieldName: 'images', // Backend expects 'images' field
        additionalFields,
        onProgress: options?.onProgress,
      },
    )

    // Convert relative image URLs to full URLs
    if (result.success && result.data?.media) {
      result.data.media = result.data.media.map((media) => ({
        ...media,
        image: apiClient.getProfilePictureUrl(media.image) || media.image,
      }))
    }

    return result
  },

  /**
   * Bulk reorder media items
   * Updates the order of multiple media items at once
   */
  async bulkReorderMedia(
    listingId: string,
    data: BulkReorderServiceMediaData,
  ): Promise<ApiResponse<{ status: string; count: number }>> {
    return apiClient.patch<{ status: string; count: number }>(
      `/api/services/listings/${listingId}/media/bulk-reorder/`,
      data,
    )
  },

  /**
   * Set a media item as the cover image
   */
  async setCoverImage(
    listingId: string,
    mediaId: number,
  ): Promise<ApiResponse<ServiceMedia>> {
    return apiClient.post<ServiceMedia>(
      `/api/services/listings/${listingId}/media/${mediaId}/set-cover/`,
      {},
    )
  },

  /**
   * Delete a media item
   */
  async deleteMedia(listingId: string, mediaId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/services/listings/${listingId}/media/${mediaId}/`)
  },

  // Analytics Methods

  /**
   * Track a view on a listing (public endpoint)
   * Records analytics data for listing views
   */
  async trackView(listingId: string, data: TrackViewData): Promise<ApiResponse<{ status: string }>> {
    return apiClient.post<{ status: string }>(
      `/api/services/listings/${listingId}/track-view/`,
      data,
    )
  },

  /**
   * Track a contact click on a listing (public endpoint)
   * Records analytics data when users click contact methods
   */
  async trackContact(
    listingId: string,
    data: TrackContactData,
  ): Promise<ApiResponse<{ status: string }>> {
    return apiClient.post<{ status: string }>(
      `/api/services/listings/${listingId}/track-contact/`,
      data,
    )
  },

  /**
   * Get analytics for a listing (owner only)
   * Returns detailed analytics with views, contacts, conversion rates, and trends
   */
  async getAnalytics(
    listingId: string,
    params?: ListingAnalyticsParams,
  ): Promise<ApiResponse<ServiceListingAnalytics>> {
    return apiClient.get<ServiceListingAnalytics>(
      `/api/services/listings/${listingId}/analytics/`,
      params,
    )
  },
}
