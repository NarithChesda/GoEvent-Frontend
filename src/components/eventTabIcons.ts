import type { Component } from 'vue'
import {
  Calendar,
  FileText,
  Users,
  UserPlus,
  ImageIcon,
  Monitor,
  ShoppingCart,
  Wallet,
  BarChart,
  Star,
  Mic,
  Heart,
  Ticket,
} from 'lucide-vue-next'

/**
 * The manage page's tab glyphs, keyed by `TabConfig.icon`. Shared by the
 * desktop icon rail (EventNavigationTabs) and the mobile pill
 * (EventManageMobileTabBar) so the same tab can never wear two icons.
 */
const EVENT_TAB_ICONS: Record<string, Component> = {
  calendar: Calendar,
  'file-text': FileText,
  users: Users,
  'user-plus': UserPlus,
  image: ImageIcon,
  monitor: Monitor,
  'shopping-cart': ShoppingCart,
  'bar-chart': BarChart,
  wallet: Wallet,
  star: Star,
  mic: Mic,
  heart: Heart,
  ticket: Ticket,
}

export const eventTabIcon = (name: string): Component => EVENT_TAB_ICONS[name] ?? FileText
