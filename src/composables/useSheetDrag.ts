import { ref, type Ref } from 'vue'

/**
 * Drag-to-dismiss for the mobile bottom sheets.
 *
 * The sheets already drew a grab handle, which promised a gesture that did not
 * exist. An affordance that does nothing is worse than no affordance: it is the
 * one detail a user *does* consciously notice, because they tried it.
 *
 * Bind the handlers to the sheet's top chrome (handle + heading) rather than to
 * the whole sheet, so dragging never competes with scrolling the list inside.
 */

/** Past this many px, release dismisses regardless of speed. */
const DISMISS_DISTANCE = 56
/** px/ms. A quick flick should be enough even if it barely moved. */
const DISMISS_VELOCITY = 0.11
/** Below this, treat the gesture as a tap and always spring back. */
const MIN_INTENT = 6

const SETTLE = 'transform 0.2s cubic-bezier(0.23, 1, 0.32, 1)'
const FLING = 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)'

export function useSheetDrag(
  sheetRef: Ref<HTMLElement | undefined>,
  onDismiss: () => void,
  backdropRef?: Ref<HTMLElement | undefined>,
) {
  const isDragging = ref(false)

  let pointerId: number | null = null
  let startY = 0
  let startTime = 0
  let lastOffset = 0

  const paint = (offset: number) => {
    const sheet = sheetRef.value
    if (!sheet) return
    // Written straight onto the element. Driving this through a CSS custom
    // property on the sheet would recalculate styles for every row inside it,
    // every frame.
    sheet.style.transform = offset ? `translateY(${offset}px)` : ''

    const backdrop = backdropRef?.value
    if (backdrop) {
      const travel = sheet.offsetHeight || 1
      backdrop.style.opacity = String(Math.max(0, 1 - offset / travel))
    }
  }

  const onPointerDown = (e: PointerEvent) => {
    // Multi-touch protection: a second finger mid-drag would otherwise snap the
    // sheet to wherever that finger landed.
    if (pointerId !== null) return
    if (e.pointerType === 'mouse' && e.button !== 0) return

    pointerId = e.pointerId
    startY = e.clientY
    startTime = performance.now()
    lastOffset = 0
    isDragging.value = true

    const sheet = sheetRef.value
    if (sheet) sheet.style.transition = 'none'
    if (backdropRef?.value) backdropRef.value.style.transition = 'none'

    // Keep receiving moves even once the finger leaves the handle.
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (pointerId !== e.pointerId) return

    const delta = e.clientY - startY
    // Upward drag gets friction rather than a wall. Real objects slow down
    // before they stop; they do not hit an invisible edge.
    lastOffset = delta < 0 ? -Math.pow(-delta, 0.7) : delta
    paint(lastOffset)
  }

  const release = (e: PointerEvent) => {
    if (pointerId !== e.pointerId) return
    pointerId = null
    isDragging.value = false
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)

    const sheet = sheetRef.value
    const elapsed = Math.max(performance.now() - startTime, 1)
    const velocity = Math.abs(lastOffset) / elapsed
    const flung = lastOffset > MIN_INTENT && velocity > DISMISS_VELOCITY

    if (lastOffset > DISMISS_DISTANCE || flung) {
      // Continue to the same place the leave transition targets, so the inline
      // transform and Vue's own class agree on the destination and nothing jumps.
      if (sheet) {
        sheet.style.transition = FLING
        sheet.style.transform = 'translateY(100%)'
      }
      if (backdropRef?.value) backdropRef.value.style.transition = ''
      onDismiss()
      return
    }

    if (sheet) sheet.style.transition = SETTLE
    if (backdropRef?.value) backdropRef.value.style.transition = 'opacity 0.2s ease-out'
    paint(0)
  }

  return {
    isDragging,
    dragHandlers: {
      onPointerdown: onPointerDown,
      onPointermove: onPointerMove,
      onPointerup: release,
      onPointercancel: release,
    },
  }
}
