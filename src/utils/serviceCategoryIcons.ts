/**
 * Service Category Icons
 *
 * Maps a service category to a lucide icon, for the brand-tile thumbnail a
 * listing gets when it has no cover photo of its own.
 *
 * Why an icon rather than the stock photo in [serviceFallbackImages.ts]: at
 * poster size a borrowed Unsplash frame passes for the vendor's work, but the
 * mobile row shows it at 96px, where it is an unreadable crop — and two
 * listings in the same category get byte-identical crops. A branded tile is
 * honest about being a placeholder, and it makes a listing that *does* have a
 * real photo read as the richer one, which is what we want vendors to see.
 *
 * Keys and the two-pass (exact, then substring) lookup deliberately mirror
 * `getCategoryFallbackImage` so the two fallbacks always agree about which
 * bucket a category falls into.
 */

import {
  Brush,
  Building2,
  Briefcase,
  CakeSlice,
  Camera,
  Car,
  ClipboardList,
  Disc3,
  Flower2,
  Gift,
  Guitar,
  Heart,
  Lightbulb,
  Mail,
  Mic,
  Music,
  Package,
  PartyPopper,
  Scissors,
  ShieldCheck,
  Shirt,
  Speaker,
  Sparkles,
  Store,
  UtensilsCrossed,
  Video,
} from 'lucide-vue-next'
import type { Component } from 'vue'

const categoryIcons: Record<string, Component> = {
  // Photography & Videography
  photography: Camera,
  videography: Video,
  'photo & video': Camera,

  // Venue & Decoration
  venue: Building2,
  decoration: Sparkles,
  decor: Sparkles,
  florist: Flower2,
  flowers: Flower2,

  // Catering & Food
  catering: UtensilsCrossed,
  'food & beverage': UtensilsCrossed,
  food: UtensilsCrossed,
  cake: CakeSlice,
  bakery: CakeSlice,

  // Entertainment & Music
  entertainment: PartyPopper,
  music: Music,
  dj: Disc3,
  band: Guitar,
  mc: Mic,

  // Beauty & Fashion
  'makeup & beauty': Brush,
  makeup: Brush,
  beauty: Brush,
  hair: Scissors,
  fashion: Shirt,
  attire: Shirt,
  dress: Shirt,

  // Planning & Coordination
  'planning & coordination': ClipboardList,
  planner: ClipboardList,
  coordinator: ClipboardList,

  // Transportation
  transportation: Car,
  transport: Car,
  car: Car,
  limousine: Car,

  // Invitations & Stationery
  invitation: Mail,
  invitations: Mail,
  stationery: Mail,
  printing: Mail,

  // Equipment & Rentals
  equipment: Package,
  rental: Package,
  rentals: Package,
  lighting: Lightbulb,
  sound: Speaker,

  // Wedding Specific
  wedding: Heart,
  bridal: Shirt,

  // Corporate Events
  corporate: Briefcase,
  conference: Briefcase,

  // Party & Celebration
  party: PartyPopper,
  birthday: PartyPopper,
  celebration: PartyPopper,

  // Other Services
  security: ShieldCheck,
  gifts: Gift,
  favors: Gift,
}

/** Shown when the category is unknown or missing */
const defaultCategoryIcon = Store

/**
 * Get the icon that stands in for a category on a photo-less listing.
 *
 * @param category - The service category name, in whatever case it arrives
 * @returns A lucide component; never null, so callers need no guard
 */
export function getCategoryIcon(category: string | null | undefined): Component {
  if (!category) {
    return defaultCategoryIcon
  }

  const normalizedCategory = category.toLowerCase().trim()

  // Direct match
  if (categoryIcons[normalizedCategory]) {
    return categoryIcons[normalizedCategory]
  }

  // Partial match - check if category contains any known keyword
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (normalizedCategory.includes(key) || key.includes(normalizedCategory)) {
      return icon
    }
  }

  return defaultCategoryIcon
}
