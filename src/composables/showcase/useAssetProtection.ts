import { computed } from 'vue'

/**
 * Composable for protecting showcase assets from casual downloading/saving.
 * Protection is active in production mode OR when VITE_ASSET_PROTECTION_ENABLED=true.
 *
 * Protections include:
 * - Right-click context menu disabled on images/videos
 * - Drag-and-drop prevention
 * - Keyboard shortcut blocking (Ctrl+S, F12, Ctrl+Shift+I)
 * - CSS selection prevention
 *
 * Note: These are deterrents for casual users only. Determined users with
 * developer tools knowledge can still access assets.
 */
export function useAssetProtection() {
  // Enable protection in production OR when explicitly enabled via env variable
  const isProduction =
    import.meta.env.PROD || import.meta.env.VITE_ASSET_PROTECTION_ENABLED === 'true'

  /**
   * Protection attributes to spread onto <img> and <video> elements.
   * Returns empty object in development for normal behavior.
   */
  const protectionAttrs = computed(() => {
    if (!isProduction) return {}
    return {
      draggable: false,
      onDragstart: (e: Event) => e.preventDefault(),
      onContextmenu: (e: Event) => e.preventDefault()
    }
  })

  /**
   * Video-specific protection attributes including controlsList.
   */
  const videoProtectionAttrs = computed(() => {
    if (!isProduction) return {}
    return {
      ...protectionAttrs.value,
      controlsList: 'nodownload noremoteplayback',
      disablePictureInPicture: true
    }
  })

  /**
   * CSS classes for protected containers.
   */
  const protectionClasses = computed(() => {
    if (!isProduction) return ''
    return 'select-none'
  })

  /**
   * Inline styles for protected containers (for properties not in Tailwind).
   */
  const protectionStyles = computed(() => {
    if (!isProduction) return {}
    return {
      '-webkit-user-select': 'none',
      '-webkit-touch-callout': 'none'
    }
  })

  // Event handlers stored for cleanup
  let contextMenuHandler: ((e: MouseEvent) => void) | null = null
  let keydownHandler: ((e: KeyboardEvent) => void) | null = null
  let dragstartHandler: ((e: DragEvent) => void) | null = null

  /**
   * Handle context menu (right-click) events.
   * Prevents default on images, videos, and elements within showcase wrapper.
   */
  function handleContextMenu(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (
      target.tagName === 'IMG' ||
      target.tagName === 'VIDEO' ||
      target.closest('.protected-asset') ||
      target.closest('.showcase-container') ||
      target.closest('.showcase-wrapper')
    ) {
      e.preventDefault()
    }
  }

  /**
   * Handle keyboard shortcuts that could be used to save/inspect.
   * Blocks: Ctrl+S, F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
   */
  function handleKeydown(e: KeyboardEvent) {
    // Ctrl+S (Save page)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault()
      return
    }

    // F12 (DevTools)
    if (e.key === 'F12') {
      e.preventDefault()
      return
    }

    // Ctrl+Shift+I (Inspect Element)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault()
      return
    }

    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault()
      return
    }

    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault()
      return
    }
  }

  /**
   * Handle dragstart events globally.
   * Prevents dragging images/videos from the showcase.
   */
  function handleDragstart(e: DragEvent) {
    const target = e.target as HTMLElement
    if (
      target.tagName === 'IMG' ||
      target.tagName === 'VIDEO' ||
      target.closest('.protected-asset') ||
      target.closest('.showcase-container') ||
      target.closest('.showcase-wrapper')
    ) {
      e.preventDefault()
    }
  }

  /**
   * Set up global event listeners for asset protection.
   * Should be called in onMounted of the main showcase component.
   */
  function setupProtection() {
    if (!isProduction) return

    contextMenuHandler = handleContextMenu
    keydownHandler = handleKeydown
    dragstartHandler = handleDragstart

    document.addEventListener('contextmenu', contextMenuHandler)
    document.addEventListener('keydown', keydownHandler)
    document.addEventListener('dragstart', dragstartHandler)
  }

  /**
   * Clean up global event listeners.
   * Should be called in onUnmounted of the main showcase component.
   */
  function cleanupProtection() {
    if (contextMenuHandler) {
      document.removeEventListener('contextmenu', contextMenuHandler)
      contextMenuHandler = null
    }
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler)
      keydownHandler = null
    }
    if (dragstartHandler) {
      document.removeEventListener('dragstart', dragstartHandler)
      dragstartHandler = null
    }
  }

  return {
    isProduction,
    protectionAttrs,
    videoProtectionAttrs,
    protectionClasses,
    protectionStyles,
    setupProtection,
    cleanupProtection
  }
}
