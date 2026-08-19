/**
 * useServices.ts
 *
 * Composable for managing service listings, vendors, and categories.
 * Handles data fetching from the services API and mapping to component types.
 * Provides pagination, filtering, sorting, and analytics tracking.
 *
 * @module composables/useServices
 */

import { ref, computed, type ComputedRef } from 'vue'
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
import type { Listing, Vendor, ServiceCategory, PriceType, Currency } from '@/components/services/types'
import {
  getCategoryFallbackImage,
  getVendorLogoFallback,
  getPortfolioPlaceholderImages,
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
 * Get cover image URL, or '' when the listing has none.
 *
 * Deliberately does NOT substitute the category stock photo here. Doing that
 * upstream left every consumer unable to tell a vendor's own photo from a
 * borrowed Unsplash frame, which is a distinction the card has to draw — it
 * shows branded category art for a photo-less listing rather than passing off
 * stock imagery as the vendor's work. Consumers that still want the stock
 * fallback (the detail hero) apply `getCategoryFallbackImage` themselves.
 */
const getCoverImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) {
    return ''
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
 * Get a vendor's banner URL, or undefined when they have not uploaded one.
 *
 * Deliberately not routed through getFullImageUrl: that substitutes a category
 * fallback for a missing image, which would hand every vendor a banner they
 * never chose. "No banner" has to stay distinguishable so callers can fall
 * back to the vendor's own photos instead.
 */
const getVendorCoverUrl = (coverUrl: string | null | undefined): string | undefined => {
  if (!coverUrl) return undefined
  return apiClient.getProfilePictureUrl(coverUrl) || coverUrl
}

/**
 * Derive raw price fields from API decimal strings.
 * priceType is inferred: 0/0 = quote, equal = fixed, otherwise range.
 */
const mapPriceFields = (
  priceMin: string,
  priceMax: string,
  currency: string,
): Pick<Listing, 'priceType' | 'priceMin' | 'priceMax' | 'currency' | 'priceUnit'> => {
  const min = parseFloat(priceMin) || 0
  const max = parseFloat(priceMax) || 0
  let priceType: PriceType = 'range'
  if (min === 0 && max === 0) {
    priceType = 'quote'
  } else if (min === max) {
    priceType = 'fixed'
  }
  return {
    priceType,
    priceMin: min || null,
    priceMax: max || null,
    currency: (currency || 'USD') as Currency,
    priceUnit: '',
  }
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
    coverImage: getCoverImageUrl(brief.cover_image_url),
    category: brief.category_name,
    ...mapPriceFields(brief.price_min, brief.price_max, brief.currency),
    priceDisplay: brief.price_display_text || `$${brief.price_min} - $${brief.price_max}`,
    vendorId: '', // Not available in brief
    vendorName: brief.vendor_name,
    vendorLogo: getVendorLogoFallback(), // Not available in brief, use fallback
    vendorVerified: true, // Assume verified since only approved listings are shown
    tags: [], // Not in brief
    serviceArea: '', // Not in brief
    views: brief.views_count,
    contactClicks: 0, // Not in brief
    isFeatured: brief.is_featured,
    gallery: [],
    telegramUsername: '', // Not in brief
    phone: '', // Not in brief
    website: '', // Not in brief
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
    coverImage: getCoverImageUrl(listing.cover_image_url),
    category: listing.category_details.name,
    ...mapPriceFields(listing.price_min, listing.price_max, listing.currency),
    priceDisplay: listing.price_display_text || `$${listing.price_min} - $${listing.price_max}`,
    vendorId: listing.vendor,
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
    coverImage: getVendorCoverUrl(vendor.cover_image),
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
    coverImage: getVendorCoverUrl(vendor.cover_image),
  }
}

/** How many featured vendors get a photo-backed spotlight slide */
const SPOTLIGHT_VENDOR_LIMIT = 6

/** Backdrops pulled per spotlight vendor — enough to cross-fade, few enough to stay cheap */
const SPOTLIGHT_IMAGES_PER_VENDOR = 4

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
  const listingsError = ref(false)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const hasMore = ref(false)

  // State - Featured Vendors
  const featuredVendors = ref<Vendor[]>([])
  const isLoadingVendors = ref(false)


  // State - Selected items
  const selectedListing = ref<Listing | null>(null)
  const selectedVendor = ref<Vendor | null>(null)
  const vendorListings = ref<Listing[]>([])
  const vendorPortfolio = ref<string[]>([])

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
    listingsError.value = false

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
        listingsError.value = true
        if (currentPage.value === 1) {
          listings.value = []
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching listings:', error)
      }
      listingsError.value = true
      if (currentPage.value === 1) {
        listings.value = []
      }
    } finally {
      isLoadingListings.value = false
    }
  }

  /**
   * Fill in spotlight backdrops for the featured vendors.
   *
   * A vendor who uploaded a banner has already said how they want to be shown,
   * so that image is the slide and no lookup happens at all — which is also
   * what keeps this cheap, since the alternative costs one request per vendor.
   * Only vendors without one fall back to borrowing their own listing covers.
   *
   * Deliberately fire-and-forget: the spotlight renders immediately on its
   * brand-gradient fallback and any borrowed photos fade in behind it, so a
   * slow (or failed) image lookup never holds up the page.
   */
  const hydrateSpotlightImages = (vendors: Vendor[]): void => {
    vendors.slice(0, SPOTLIGHT_VENDOR_LIMIT).forEach(async (vendor) => {
      if (vendor.coverImage) {
        vendor.heroImages = [vendor.coverImage]
        return
      }

      try {
        const response: ApiResponse<PaginatedResponse<ServiceListingBrief>> =
          await serviceListingsService.browseListings({
            vendor: vendor.id,
            page_size: SPOTLIGHT_IMAGES_PER_VENDOR,
          })

        if (!response.success || !response.data) return

        const images = response.data.results
          .map((brief) => brief.cover_image_url)
          .filter((url): url is string => !!url)
          .map((url) => getFullImageUrl(url))

        if (images.length > 0) {
          vendor.heroImages = images
        }
      } catch {
        // Leave heroImages empty — the spotlight keeps its brand-art backdrop
      }
    })
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
        hydrateSpotlightImages(featuredVendors.value)
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
   * Fetch a vendor's portfolio images.
   *
   * There is no dedicated portfolio field on the vendor profile yet, so the
   * portfolio is aggregated from the photos the vendor already uploaded to
   * their listings: real cover images (briefs expose the raw URL, so local
   * fallbacks are never included) plus gallery media from the first few
   * listings. Deduplicated and capped at 10 images.
   */
  const fetchVendorPortfolio = async (vendorId: string): Promise<void> => {
    vendorPortfolio.value = []

    try {
      const response: ApiResponse<PaginatedResponse<ServiceListingBrief>> =
        await serviceListingsService.browseListings({
          vendor: vendorId,
          page_size: 12,
        })

      if (!response.success || !response.data) return

      const briefs = response.data.results
      const images: string[] = []

      briefs.forEach((brief) => {
        if (brief.cover_image_url) {
          images.push(getFullImageUrl(brief.cover_image_url))
        }
      })

      // Pull gallery media from the first few listings (one request each)
      const detailResponses = await Promise.all(
        briefs.slice(0, 4).map((brief) =>
          serviceListingsService.getListing(brief.id).catch(() => null),
        ),
      )

      detailResponses.forEach((detail) => {
        if (detail?.success && detail.data) {
          detail.data.media.forEach((m) => {
            if (m.image) {
              images.push(getFullImageUrl(m.image))
            }
          })
        }
      })

      // Visual-testing toggle: vendors with no uploaded photos get an
      // on-theme placeholder portfolio so the display can be previewed.
      if (images.length === 0 && import.meta.env.VITE_SERVICES_PORTFOLIO_PLACEHOLDER === 'true') {
        vendorPortfolio.value = getPortfolioPlaceholderImages(
          briefs.map((brief) => brief.category_name),
        )
        return
      }

      vendorPortfolio.value = [...new Set(images)].slice(0, 10)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching vendor portfolio:', error)
      }
      vendorPortfolio.value = []
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
    listingsError,
    currentPage,
    totalPages,
    hasMore,

    // State - Vendors
    featuredVendors,
    isLoadingVendors,

    // State - Selected items
    selectedListing,
    selectedVendor,
    vendorListings,
    vendorPortfolio,

    // State - Filters
    selectedCategory,
    sortBy,
    searchQuery,

    // Methods
    fetchCategories,
    fetchListings,
    fetchFeaturedVendors,
    fetchListingDetail,
    fetchVendorDetail,
    fetchVendorListings,
    fetchVendorPortfolio,
    loadMore,
    trackView,
    trackContact,

    // Computed
    filteredListings,
    serviceCategoriesForUI,
  }
}
