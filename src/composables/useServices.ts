/**
 * useServices.ts
 *
 * Composable for managing service listings, vendors, and categories.
 * Handles data fetching from the services API and mapping to component types.
 * Provides pagination, filtering, sorting, and analytics tracking.
 *
 * @module composables/useServices
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import {
  serviceCategoriesService,
  serviceListingsService,
  vendorService,
  apiClient,
  type ApiResponse,
  type PaginatedResponse,
  type ServiceCategory as ApiServiceCategory,
  type ServiceListing,
  type ServiceListingBrief,
  type VendorProfile,
  type VendorProfileBrief,
  type ListingFilters,
} from '@/services/api'
import type { Listing, Vendor, ServiceCategory } from '@/components/services/types'
import {
  getCategoryFallbackImage,
  getVendorLogoFallback,
} from '@/utils/serviceFallbackImages'

/**
 * Get full URL for image from API
 * @param imageUrl - The image URL from API
 * @param fallback - Optional fallback URL if image is missing
 */
const getFullImageUrl = (imageUrl: string | null | undefined, fallback?: string): string => {
  if (!imageUrl) {
    return fallback || getCategoryFallbackImage(null)
  }

  // Use ApiClient's helper method
  return apiClient.getProfilePictureUrl(imageUrl) || imageUrl
}

/**
 * Get cover image URL with category-based fallback
 */
const getCoverImageUrl = (imageUrl: string | null | undefined, categoryName: string): string => {
  if (!imageUrl) {
    return getCategoryFallbackImage(categoryName)
  }
  return apiClient.getProfilePictureUrl(imageUrl) || imageUrl
}

/**
 * Get vendor logo URL with fallback
 */
const getVendorLogoUrl = (logoUrl: string | null | undefined): string => {
  if (!logoUrl) {
    return getVendorLogoFallback()
  }
  return apiClient.getProfilePictureUrl(logoUrl) || logoUrl
}

/**
 * Map API ServiceListingBrief to component Listing type
 */
const mapBriefToListing = (brief: ServiceListingBrief): Listing => {
  return {
    id: brief.id,
    title: brief.title,
    tagline: brief.short_tagline,
    description: '', // Not available in brief, will be filled when fetching full listing
    coverImage: getCoverImageUrl(brief.cover_image_url, brief.category_name),
    category: brief.category_name,
    priceDisplay: brief.price_display_text || `$${brief.price_min} - $${brief.price_max}`,
    vendorName: brief.vendor_name,
    vendorLogo: getVendorLogoFallback(), // Not available in brief, use fallback
    vendorVerified: true, // Assume verified since only approved listings are shown
    tags: [], // Not in brief
    serviceArea: '', // Not in brief
    views: brief.views_count,
    contactClicks: 0, // Not in brief
    isFeatured: brief.is_featured,
    gallery: [],
  }
}

/**
 * Map API ServiceListing (full) to component Listing type
 */
const mapFullToListing = (listing: ServiceListing): Listing => {
  return {
    id: listing.id,
    title: listing.title,
    tagline: listing.short_tagline,
    description: listing.description,
    coverImage: getCoverImageUrl(listing.cover_image_url, listing.category_details.name),
    category: listing.category_details.name,
    priceDisplay: listing.price_display_text || `$${listing.price_min} - $${listing.price_max}`,
    vendorName: listing.vendor_details.business_name,
    vendorLogo: getVendorLogoUrl(listing.vendor_details.logo),
    vendorVerified: listing.vendor_details.verification_status === 'verified',
    tags: listing.tags_list || [],
    serviceArea: listing.service_area,
    views: listing.views_count,
    contactClicks: listing.contact_clicks_count,
    isFeatured: listing.is_featured,
    gallery: listing.media.map((m) => getFullImageUrl(m.image)),
    // Contact info from vendor
    telegramUsername: listing.vendor_details.telegram_username || '',
    phone: listing.vendor_details.phone || '',
    website: listing.vendor_details.website || '',
  }
}

/**
 * Map API VendorProfileBrief to component Vendor type
 */
const mapBriefToVendor = (vendor: VendorProfileBrief): Vendor => {
  return {
    id: vendor.id,
    name: vendor.business_name,
    logo: getVendorLogoUrl(vendor.logo),
    tagline: vendor.short_tagline,
    description: '', // Not in brief
    city: vendor.city,
    country: vendor.country,
    email: '', // Not in brief
    phone: '', // Not in brief
    website: '', // Not in brief
    telegramUsername: vendor.telegram_username,
    listingsCount: vendor.listings_count,
  }
}

/**
 * Map API VendorProfile (full) to component Vendor type
 */
const mapFullToVendor = (vendor: VendorProfile): Vendor => {
  return {
    id: vendor.id,
    name: vendor.business_name,
    logo: getVendorLogoUrl(vendor.logo),
    tagline: vendor.short_tagline,
    description: vendor.description,
    city: vendor.city,
    country: vendor.country,
    email: vendor.email,
    phone: vendor.phone,
    website: vendor.website,
    telegramUsername: vendor.telegram_username,
    listingsCount: vendor.listings_count,
  }
}

/**
 * Composable for managing services data
 */
export function useServices() {
  // State - Categories
  const categories = ref<ApiServiceCategory[]>([])
  const isLoadingCategories = ref(false)

  // State - Listings
  const listings = ref<Listing[]>([])
  const isLoadingListings = ref(false)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const hasMore = ref(false)

  // State - Featured Vendors
  const featuredVendors = ref<Vendor[]>([])
  const isLoadingVendors = ref(false)

  // State - All Vendors
  const allVendors = ref<Vendor[]>([])
  const isLoadingAllVendors = ref(false)
  const allVendorsPage = ref(1)
  const hasMoreVendors = ref(false)

  // State - Selected items
  const selectedListing = ref<Listing | null>(null)
  const selectedVendor = ref<Vendor | null>(null)
  const vendorListings = ref<Listing[]>([])

  // State - Filters
  const selectedCategory = ref<string>('all')
  const sortBy = ref<string>('featured')
  const searchQuery = ref<string>('')

  /**
   * Fetch all service categories
   */
  const fetchCategories = async (): Promise<void> => {
    isLoadingCategories.value = true

    try {
      const response = await serviceCategoriesService.listCategories()

      if (response.success && response.data) {
        categories.value = response.data.results
      } else {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch categories:', response.message)
        }
        categories.value = []
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching categories:', error)
      }
      categories.value = []
    } finally {
      isLoadingCategories.value = false
    }
  }

  /**
   * Fetch service listings with filters
   */
  const fetchListings = async (filters?: ListingFilters): Promise<void> => {
    isLoadingListings.value = true

    try {
      // Build filter params
      const params: ListingFilters = {
        page: currentPage.value,
        page_size: 12,
        ...filters,
      }

      // Apply category filter if not 'all'
      if (selectedCategory.value !== 'all') {
        const category = categories.value.find((c) => c.name.toLowerCase() === selectedCategory.value.toLowerCase())
        if (category) {
          params.category = category.id
        }
      }

      // Apply search query
      if (searchQuery.value) {
        params.search = searchQuery.value
      }

      // Apply sorting
      if (sortBy.value && sortBy.value !== 'featured') {
        params.ordering = sortBy.value
      } else {
        // For featured, we'll sort client-side after fetching
        params.ordering = '-created_at' // Default to newest first
      }

      const response: ApiResponse<PaginatedResponse<ServiceListingBrief>> =
        await serviceListingsService.browseListings(params)

      if (response.success && response.data) {
        const mappedListings = response.data.results.map(mapBriefToListing)

        // If featured sort, prioritize featured listings
        if (sortBy.value === 'featured') {
          mappedListings.sort((a, b) => {
            if (a.isFeatured && !b.isFeatured) return -1
            if (!a.isFeatured && b.isFeatured) return 1
            return 0
          })
        }

        // Append or replace based on page
        if (currentPage.value === 1) {
          listings.value = mappedListings
        } else {
          listings.value = [...listings.value, ...mappedListings]
        }

        // Update pagination state
        const totalCount = response.data.count
        const pageSize = params.page_size || 12
        totalPages.value = Math.ceil(totalCount / pageSize)
        hasMore.value = !!response.data.next
      } else {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch listings:', response.message)
        }
        if (currentPage.value === 1) {
          listings.value = []
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching listings:', error)
      }
      if (currentPage.value === 1) {
        listings.value = []
      }
    } finally {
      isLoadingListings.value = false
    }
  }

  /**
   * Fetch featured vendors (only vendors with is_featured = true)
   */
  const fetchFeaturedVendors = async (): Promise<void> => {
    isLoadingVendors.value = true

    try {
      const response: ApiResponse<PaginatedResponse<VendorProfileBrief>> =
        await vendorService.listVendors({
          is_featured: true,
          page: 1,
          page_size: 8, // Fetch top 8 featured vendors
        })

      if (response.success && response.data) {
        featuredVendors.value = response.data.results.map(mapBriefToVendor)
      } else {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch vendors:', response.message)
        }
        featuredVendors.value = []
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching vendors:', error)
      }
      featuredVendors.value = []
    } finally {
      isLoadingVendors.value = false
    }
  }

  /**
   * Fetch all vendors (paginated, includes both featured and non-featured)
   */
  const fetchAllVendors = async (reset = true): Promise<void> => {
    isLoadingAllVendors.value = true

    if (reset) {
      allVendorsPage.value = 1
      allVendors.value = []
    }

    try {
      const response: ApiResponse<PaginatedResponse<VendorProfileBrief>> =
        await vendorService.listVendors({
          page: allVendorsPage.value,
          page_size: 12,
        })

      if (response.success && response.data) {
        const mappedVendors = response.data.results.map(mapBriefToVendor)

        if (reset) {
          allVendors.value = mappedVendors
        } else {
          allVendors.value = [...allVendors.value, ...mappedVendors]
        }

        hasMoreVendors.value = !!response.data.next
      } else {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch all vendors:', response.message)
        }
        if (reset) {
          allVendors.value = []
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching all vendors:', error)
      }
      if (reset) {
        allVendors.value = []
      }
    } finally {
      isLoadingAllVendors.value = false
    }
  }

  /**
   * Load more vendors (pagination)
   */
  const loadMoreVendors = async (): Promise<void> => {
    if (!hasMoreVendors.value || isLoadingAllVendors.value) {
      return
    }

    allVendorsPage.value++
    await fetchAllVendors(false)
  }

  /**
   * Fetch full listing detail
   * Also fetches vendor details to get complete contact information
   */
  const fetchListingDetail = async (id: string): Promise<void> => {
    try {
      const response: ApiResponse<ServiceListing> = await serviceListingsService.getListing(id)

      if (response.success && response.data) {
        const listing = mapFullToListing(response.data)

        // Fetch vendor details to get complete contact info (phone, website, telegram)
        // since vendor_details in listing may not include all contact fields
        try {
          const vendorResponse = await vendorService.getVendor(response.data.vendor)
          if (vendorResponse.success && vendorResponse.data) {
            // Merge vendor contact info into listing
            listing.telegramUsername = vendorResponse.data.telegram_username || ''
            listing.phone = vendorResponse.data.phone || ''
            listing.website = vendorResponse.data.website || ''
          }
        } catch (vendorError) {
          // If vendor fetch fails, use what we have from listing's vendor_details
          if (import.meta.env.DEV) {
            console.error('Error fetching vendor details:', vendorError)
          }
        }

        selectedListing.value = listing
      } else {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch listing detail:', response.message)
        }
        selectedListing.value = null
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching listing detail:', error)
      }
      selectedListing.value = null
    }
  }

  /**
   * Fetch full vendor detail
   */
  const fetchVendorDetail = async (id: string): Promise<void> => {
    try {
      const response: ApiResponse<VendorProfile> = await vendorService.getVendor(id)

      if (response.success && response.data) {
        selectedVendor.value = mapFullToVendor(response.data)
      } else {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch vendor detail:', response.message)
        }
        selectedVendor.value = null
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching vendor detail:', error)
      }
      selectedVendor.value = null
    }
  }

  /**
   * Fetch listings for a specific vendor
   */
  const fetchVendorListings = async (vendorId: string): Promise<void> => {
    try {
      const response: ApiResponse<PaginatedResponse<ServiceListingBrief>> =
        await serviceListingsService.browseListings({
          vendor: vendorId,
          page_size: 50, // Fetch all vendor listings
        })

      if (response.success && response.data) {
        vendorListings.value = response.data.results.map(mapBriefToListing)
      } else {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch vendor listings:', response.message)
        }
        vendorListings.value = []
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching vendor listings:', error)
      }
      vendorListings.value = []
    }
  }

  /**
   * Load more listings (pagination)
   */
  const loadMore = async (): Promise<void> => {
    if (!hasMore.value || isLoadingListings.value) {
      return
    }

    currentPage.value++
    await fetchListings()
  }

  /**
   * Track view on a listing
   */
  const trackView = async (listingId: string, source: string): Promise<void> => {
    try {
      await serviceListingsService.trackView(listingId, { source })
    } catch (error) {
      // Silently fail - analytics tracking shouldn't break user flow
      if (import.meta.env.DEV) {
        console.error('Error tracking view:', error)
      }
    }
  }

  /**
   * Track contact click on a listing
   */
  const trackContact = async (listingId: string, contactType: string): Promise<void> => {
    try {
      await serviceListingsService.trackContact(listingId, { contact_type: contactType })
    } catch (error) {
      // Silently fail - analytics tracking shouldn't break user flow
      if (import.meta.env.DEV) {
        console.error('Error tracking contact:', error)
      }
    }
  }

  /**
   * Computed - Filtered listings (client-side filtering for additional refinement)
   */
  const filteredListings: ComputedRef<Listing[]> = computed(() => {
    return listings.value
  })

  /**
   * Computed - Service categories formatted for UI
   * Converts numeric IDs to strings and adds 'all' option
   */
  const serviceCategoriesForUI: ComputedRef<ServiceCategory[]> = computed(() => {
    const uiCategories: ServiceCategory[] = [
      { id: 'all', name: 'All Categories' },
    ]

    // Map API categories to UI categories
    categories.value.forEach((cat) => {
      uiCategories.push({
        id: cat.name.toLowerCase(),
        name: cat.name,
      })
    })

    return uiCategories
  })

  return {
    // State - Categories
    categories,
    isLoadingCategories,

    // State - Listings
    listings,
    isLoadingListings,
    currentPage,
    totalPages,
    hasMore,

    // State - Vendors
    featuredVendors,
    isLoadingVendors,
    allVendors,
    isLoadingAllVendors,
    hasMoreVendors,

    // State - Selected items
    selectedListing,
    selectedVendor,
    vendorListings,

    // State - Filters
    selectedCategory,
    sortBy,
    searchQuery,

    // Methods
    fetchCategories,
    fetchListings,
    fetchFeaturedVendors,
    fetchAllVendors,
    loadMoreVendors,
    fetchListingDetail,
    fetchVendorDetail,
    fetchVendorListings,
    loadMore,
    trackView,
    trackContact,

    // Computed
    filteredListings,
    serviceCategoriesForUI,
  }
}
