import { ref, nextTick, onUnmounted } from 'vue'

/**
 * Shared open/close/anchor behaviour for the app's field pickers
 * (SelectField, DateTimePickerField).
 *
 * Both render the same two shapes — a bottom sheet under 640px, an anchored
 * popover above it — and both had their own near-identical copy of the flip
 * maths, the Escape listener and the mobile breakpoint check. One copy means
 * every picker in the app opens, anchors and closes identically.
 */

const MOBILE_QUERY = '(max-width: 639px)'
const VIEWPORT_GUTTER = 8
const TRIGGER_GAP = 8

interface PickerPanelOptions {
  /** Stretch the panel to the trigger's width (selects), with this floor in px. */
  matchTriggerWidth?: number
  /** Run just before the panel is shown — seed draft state here. */
  onOpen?: () => void
  /** Run after the panel is hidden. */
  onClose?: () => void
}

export function usePickerPanel(options: PickerPanelOptions = {}) {
  const triggerRef = ref<HTMLButtonElement>()
  const panelRef = ref<HTMLElement>()
  const isOpen = ref(false)
  const isMobile = ref(false)
  const panelStyle = ref<Record<string, string>>({})

  // Saved so a picker opened inside an already-locked surface (a drawer)
  // restores that surface's lock instead of clearing it.
  let previousBodyOverflow: string | null = null

  const positionPanel = async () => {
    await nextTick()
    const trigger = triggerRef.value
    const panel = panelRef.value
    if (!trigger || !panel) return

    const rect = trigger.getBoundingClientRect()

    let width = panel.offsetWidth
    if (options.matchTriggerWidth !== undefined) {
      width = Math.max(rect.width, options.matchTriggerWidth)
      panel.style.width = `${width}px`
    }

    const height = panel.offsetHeight
    const left = Math.max(
      VIEWPORT_GUTTER,
      Math.min(rect.left, window.innerWidth - width - VIEWPORT_GUTTER),
    )

    let top = rect.bottom + TRIGGER_GAP
    let flipped = false
    if (top + height > window.innerHeight - VIEWPORT_GUTTER) {
      top = Math.max(VIEWPORT_GUTTER, rect.top - height - TRIGGER_GAP)
      flipped = true
    }

    // Scale from the point on the panel's edge that sits under the trigger's
    // centre — not from a corner. When the panel is clamped against a viewport
    // edge, a corner origin no longer lines up with the control that opened it.
    const originX = Math.max(
      12,
      Math.min(rect.left + rect.width / 2 - left, Math.max(width - 12, 12)),
    )

    panelStyle.value = {
      ...(options.matchTriggerWidth !== undefined ? { width: `${width}px` } : {}),
      top: `${top}px`,
      left: `${left}px`,
      transformOrigin: `${originX}px ${flipped ? 'bottom' : 'top'}`,
    }
  }

  // Capture phase so a parent drawer's own Escape handler doesn't also fire and
  // close the drawer out from under the picker.
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      close()
    }
  }

  const lockBodyScroll = () => {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }

  const unlockBodyScroll = () => {
    if (previousBodyOverflow === null) return
    document.body.style.overflow = previousBodyOverflow
    previousBodyOverflow = null
  }

  const open = async () => {
    isMobile.value = window.matchMedia(MOBILE_QUERY).matches
    options.onOpen?.()
    isOpen.value = true
    document.addEventListener('keydown', handleKeydown, true)
    if (isMobile.value) lockBodyScroll()
    else await positionPanel()
  }

  const close = () => {
    if (!isOpen.value) return

    // Hand focus back to the trigger, but only if it is still inside the panel —
    // clicking a different control should not yank focus back here.
    const active = document.activeElement as HTMLElement | null
    const shouldRestore = !!active && !!panelRef.value?.contains(active)

    isOpen.value = false
    document.removeEventListener('keydown', handleKeydown, true)
    unlockBodyScroll()
    options.onClose?.()

    if (shouldRestore) triggerRef.value?.focus({ preventScroll: true })
  }

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown, true)
    unlockBodyScroll()
  })

  return {
    triggerRef,
    panelRef,
    isOpen,
    isMobile,
    panelStyle,
    open,
    close,
    reposition: positionPanel,
  }
}
