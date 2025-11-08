/**
 * Centralized z-index constants for consistent layering across the application
 *
 * Usage:
 * import { Z_INDEX } from '@/constants/zIndex'
 *
 * Then use with Tailwind's arbitrary values:
 * <div class="z-[var(--z-modal)]">
 *
 * Or configure in tailwind.config.js for cleaner class names
 */

export const Z_INDEX = {
  // Base layers
  base: 0,

  // Content layers
  dropdown: 10,
  sticky: 20,
  header: 30,

  // Overlay layers
  overlay: 40,

  // Modal layers
  modal: 50,
  modalBackdrop: 49,
  modalContent: 51,

  // Notification layers
  toast: 200,
  tooltip: 300,

  // Maximum layer (for debugging overlays)
  debug: 9999,
} as const

/**
 * Type for z-index layer names
 */
export type ZIndexLayer = keyof typeof Z_INDEX

/**
 * Get z-index value by layer name
 */
export const getZIndex = (layer: ZIndexLayer): number => {
  return Z_INDEX[layer]
}
