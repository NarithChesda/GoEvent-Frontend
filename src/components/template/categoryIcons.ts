import {
  Baby,
  Briefcase,
  Building2,
  Cake,
  Calendar,
  Clapperboard,
  Flower2,
  Gift,
  GraduationCap,
  Heart,
  HeartPulse,
  House,
  Music,
  Palette,
  PartyPopper,
  Sparkles,
  Trophy,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-vue-next'

/**
 * The glyph for an event category, by name — shared by every template menu (the
 * studio's browse modal and the public design catalogue) and the create
 * wizard's first question, so one category never wears two icons. Matched by
 * substring, so "Wedding Ceremony" still finds Wedding; anything unrecognised
 * is a calendar.
 *
 * **Order matters**: the first key contained in the name wins. Housewarming
 * sits before Party so "Housewarming Party" is a house, and the arts key is
 * `Arts`, not `Art` — "party" contains "art".
 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Wedding: Heart,
  Corporate: Briefcase,
  Education: GraduationCap,
  Concert: Music,
  Food: Utensils,
  Social: Users,
  Conference: Calendar,
  Housewarming: House,
  Party: PartyPopper,
  Business: Building2,
  Birthday: Cake,
  Funeral: Flower2,
  Music: Music,
  Sports: Trophy,
  Film: Clapperboard,
  Health: HeartPulse,
  Family: Baby,
  Seasonal: Gift,
  Lifestyle: Sparkles,
  Arts: Palette,
}

const cache = new Map<string, LucideIcon>()

export const getCategoryIcon = (categoryName: string): LucideIcon => {
  const key = categoryName.toLowerCase()
  const cached = cache.get(key)
  if (cached) return cached

  const match = Object.entries(CATEGORY_ICONS).find(([name]) => key.includes(name.toLowerCase()))
  const icon = match ? match[1] : Calendar
  cache.set(key, icon)
  return icon
}
