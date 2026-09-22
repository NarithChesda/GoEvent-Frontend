import {
  Briefcase,
  Building2,
  Cake,
  Calendar,
  GraduationCap,
  Heart,
  Music,
  PartyPopper,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-vue-next'

/**
 * The glyph for an event category, by name — shared by every template menu (the
 * studio's browse modal and the public design catalogue) so one category never
 * wears two icons. Matched by substring, so "Wedding Ceremony" still finds
 * Wedding; anything unrecognised is a calendar.
 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Wedding: Heart,
  Corporate: Briefcase,
  Education: GraduationCap,
  Concert: Music,
  Food: Utensils,
  Social: Users,
  Conference: Calendar,
  Party: PartyPopper,
  Business: Building2,
  Birthday: Cake,
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
