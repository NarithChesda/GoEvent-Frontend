/**
 * Service Fallback Images Utility
 *
 * Provides category-based fallback images for service listings
 * and a default vendor logo when none is provided.
 */

/**
 * Category-based cover image fallbacks
 * Maps category names (lowercase) to relevant Unsplash images
 */
const categoryCoverImages: Record<string, string> = {
  // Photography & Videography
  photography: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=450&fit=crop',
  videography: 'https://images.unsplash.com/photo-1579187707643-35646d22b596?w=800&h=450&fit=crop',
  'photo & video': 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=450&fit=crop',

  // Venue & Decoration
  venue: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=450&fit=crop',
  decoration: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&h=450&fit=crop',
  decor: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&h=450&fit=crop',
  florist: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&h=450&fit=crop',
  flowers: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&h=450&fit=crop',

  // Catering & Food
  catering: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=450&fit=crop',
  'food & beverage': 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=450&fit=crop',
  food: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=450&fit=crop',
  cake: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&h=450&fit=crop',
  bakery: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&h=450&fit=crop',

  // Entertainment & Music
  entertainment: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=450&fit=crop',
  music: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=450&fit=crop',
  dj: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=800&h=450&fit=crop',
  band: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop',
  mc: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=450&fit=crop',

  // Beauty & Fashion
  'makeup & beauty': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=450&fit=crop',
  makeup: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=450&fit=crop',
  beauty: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=450&fit=crop',
  hair: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=450&fit=crop',
  fashion: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop',
  attire: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop',
  dress: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&h=450&fit=crop',

  // Planning & Coordination
  'planning & coordination': 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=450&fit=crop',
  planner: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=450&fit=crop',
  coordinator: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=450&fit=crop',

  // Transportation
  transportation: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=450&fit=crop',
  transport: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=450&fit=crop',
  car: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=450&fit=crop',
  limousine: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=450&fit=crop',

  // Invitations & Stationery
  invitation: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&h=450&fit=crop',
  invitations: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&h=450&fit=crop',
  stationery: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&h=450&fit=crop',
  printing: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&h=450&fit=crop',

  // Equipment & Rentals
  equipment: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=450&fit=crop',
  rental: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=450&fit=crop',
  rentals: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=450&fit=crop',
  lighting: 'https://images.unsplash.com/photo-1504501650895-2441b7915699?w=800&h=450&fit=crop',
  sound: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=450&fit=crop',

  // Wedding Specific
  wedding: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=450&fit=crop',
  bridal: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&h=450&fit=crop',

  // Corporate Events
  corporate: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop',
  conference: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop',

  // Party & Celebration
  party: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=450&fit=crop',
  birthday: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=450&fit=crop',
  celebration: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=450&fit=crop',

  // Other Services
  security: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=450&fit=crop',
  gifts: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&h=450&fit=crop',
  favors: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&h=450&fit=crop',
}

/**
 * Default fallback cover image for when category doesn't match
 */
const defaultCoverImage =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=450&fit=crop'

/**
 * Default vendor logo fallback (neutral store/shop icon style)
 */
const defaultVendorLogo =
  'https://api.dicebear.com/7.x/shapes/svg?seed=vendor&backgroundColor=e2e8f0&shape1Color=94a3b8&shape2Color=64748b&shape3Color=475569'

/**
 * Get fallback cover image based on category
 * @param category - The service category name
 * @returns URL to an appropriate fallback image
 */
export function getCategoryFallbackImage(category: string | null | undefined): string {
  if (!category) {
    return defaultCoverImage
  }

  const normalizedCategory = category.toLowerCase().trim()

  // Direct match
  if (categoryCoverImages[normalizedCategory]) {
    return categoryCoverImages[normalizedCategory]
  }

  // Partial match - check if category contains any known keyword
  for (const [key, url] of Object.entries(categoryCoverImages)) {
    if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
      return url
    }
  }

  return defaultCoverImage
}

/**
 * Get vendor logo fallback
 * @returns URL to default vendor logo placeholder
 */
export function getVendorLogoFallback(): string {
  return defaultVendorLogo
}

/**
 * Get cover image with category-based fallback
 * @param imageUrl - The original image URL
 * @param category - The service category for fallback selection
 * @returns Valid image URL (original or category-based fallback)
 */
export function getCoverImageWithFallback(
  imageUrl: string | null | undefined,
  category: string | null | undefined
): string {
  if (imageUrl && imageUrl.trim()) {
    return imageUrl
  }
  return getCategoryFallbackImage(category)
}

/**
 * Get vendor logo with fallback
 * @param logoUrl - The original logo URL
 * @returns Valid logo URL (original or default fallback)
 */
export function getVendorLogoWithFallback(logoUrl: string | null | undefined): string {
  if (logoUrl && logoUrl.trim()) {
    return logoUrl
  }
  return getVendorLogoFallback()
}

/**
 * Export category images map for testing/reference
 */
export const serviceCategoryImages = categoryCoverImages
