/**
 * useStickyDateHeaders.ts
 *
 * Composable for managing sticky date header behavior on mobile.
 * Uses IntersectionObserver to detect when headers become sticky
 * and applies appropriate styling.
 *
 * @module composables/useStickyDateHeaders
 */

import { ref, onUnmounted, nextTick, watch, type Ref } from 'vue'

/**
 * Composable for sticky date header functionality
 *
 * @param trigger - Reactive value that triggers observer re-setup when changed
 * @param headerSelector - CSS selector for sticky headers (default: '.date-header-sticky')
 * @param mobileBreakpoint - Max width for mobile detection (default: 640)
 */
export function useStickyDateHeaders(
  trigger?: Ref<unknown>,
  headerSelector = '.date-header-sticky',
  mobileBreakpoint = 640
) {
  const stickyObserver = ref<IntersectionObserver | null>(null)

  const cleanupSentinels = () => {
    document.querySelectorAll('.sticky-sentinel').forEach((el) => el.remove())
  }

  const setupStickyObserver = () => {
    // Clean up existing observer
    if (stickyObserver.value) {
      stickyObserver.value.disconnect()
    }

    // Only run on mobile
    if (window.innerWidth >= mobileBreakpoint) return

    nextTick(() => {
      const stickyHeaders = document.querySelectorAll(headerSelector)
      if (stickyHeaders.length === 0) return

      // Create sentinel elements and observer
      stickyObserver.value = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const header = entry.target.nextElementSibling as HTMLElement
            if (header?.classList.contains(headerSelector.replace('.', ''))) {
              if (!entry.isIntersecting) {
                header.classList.add('is-stuck')
              } else {
                header.classList.remove('is-stuck')
              }
            }
          })
        },
        { threshold: 0, rootMargin: '-57px 0px 0px 0px' }
      )

      stickyHeaders.forEach((header) => {
        // Create a sentinel element before each sticky header
        const sentinel = document.createElement('div')
        sentinel.className = 'sticky-sentinel'
        sentinel.style.height = '1px'
        sentinel.style.width = '1px'
        sentinel.style.position = 'absolute'
        sentinel.style.top = '0'
        sentinel.style.left = '0'
        header.parentElement?.insertBefore(sentinel, header)
        stickyObserver.value?.observe(sentinel)
      })
    })
  }

  // Watch for trigger changes to re-setup observer
  if (trigger) {
    watch(
      trigger,
      () => {
        cleanupSentinels()
        setupStickyObserver()
      },
      { deep: true }
    )
  }

  onUnmounted(() => {
    if (stickyObserver.value) {
      stickyObserver.value.disconnect()
    }
    cleanupSentinels()
  })

  return {
    setupStickyObserver,
    cleanupSentinels,
  }
}
