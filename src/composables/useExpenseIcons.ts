import {
  Building2,
  UtensilsCrossed,
  Palette,
  Camera,
  Music,
  Gift
} from 'lucide-vue-next'
import type { Component } from 'vue'

/**
 * Shared composable for expense category icon mapping
 * Maps Font Awesome icon names to Lucide Vue components
 */
export const useExpenseIcons = () => {
  const iconMap: Record<string, Component> = {
    'fa-building': Building2,
    'fa-utensils': UtensilsCrossed,
    'fa-palette': Palette,
    'fa-camera': Camera,
    'fa-music': Music,
    'fa-gift': Gift,
  }

  /**
   * Get the Lucide component for a given icon name
   * @param icon - Font Awesome icon name (e.g., 'fa-building')
   * @returns Lucide component or Building2 as default
   */
  const getIconComponent = (icon?: string): Component => {
    if (!icon) return Building2
    return iconMap[icon] || Building2
  }

  return {
    iconMap,
    getIconComponent
  }
}
