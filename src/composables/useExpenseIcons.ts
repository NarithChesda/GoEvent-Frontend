import {
  Building2,
  UtensilsCrossed,
  Palette,
  Camera,
  Music,
  Gift,
  Car,
  Hotel,
  Shirt,
  Lightbulb,
  Clipboard,
  Megaphone,
} from 'lucide-vue-next'
import type { Component } from 'vue'

/**
 * Supported icon names for expense categories
 */
export type IconName =
  | 'fa-building'
  | 'fa-utensils'
  | 'fa-palette'
  | 'fa-camera'
  | 'fa-music'
  | 'fa-gift'
  | 'fa-car'
  | 'fa-hotel'
  | 'fa-shirt'
  | 'fa-lightbulb'
  | 'fa-clipboard'
  | 'fa-megaphone'

/**
 * Shared composable for expense category icon mapping
 * Maps Font Awesome icon names to Lucide Vue components
 */
export const useExpenseIcons = () => {
  const iconMap: Record<IconName, Component> = {
    'fa-building': Building2,
    'fa-utensils': UtensilsCrossed,
    'fa-palette': Palette,
    'fa-camera': Camera,
    'fa-music': Music,
    'fa-gift': Gift,
    'fa-car': Car,
    'fa-hotel': Hotel,
    'fa-shirt': Shirt,
    'fa-lightbulb': Lightbulb,
    'fa-clipboard': Clipboard,
    'fa-megaphone': Megaphone,
  }

  /**
   * Get the Lucide component for a given icon name
   * @param icon - Font Awesome icon name (e.g., 'fa-building')
   * @returns Lucide component or Building2 as default
   */
  const getIconComponent = (icon?: string): Component => {
    if (!icon) return Building2
    return iconMap[icon as IconName] || Building2
  }

  /**
   * Get all available icon names
   */
  const getAvailableIcons = (): IconName[] => {
    return Object.keys(iconMap) as IconName[]
  }

  return {
    iconMap,
    getIconComponent,
    getAvailableIcons,
  }
}
