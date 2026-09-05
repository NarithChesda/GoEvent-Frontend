import { nextTick, onBeforeUnmount, ref, watch, type Ref } from 'vue'

export interface AnchoredMenuOptions {
  /** The panel's natural width, in px. Narrowed to fit a small viewport. */
  width: number
  /** Which of the trigger's edges the panel lines up with. */
  align?: 'left' | 'right'
  /** Distance between the trigger and the panel. */
  gap?: number
  /** Keep-out margin from the viewport's edges. */
  margin?: number
  /** Below this much room underneath, the panel opens upwards instead. */
  minHeight?: number
  /** Never shrink the panel below this, even when the room is tighter. */
  floorHeight?: number
}

/**
 * Places a menu that has been teleported to `body` against the trigger it
 * belongs to.
 *
 * A menu rendered `absolute` inside the thing it acts on is clipped by the
 * first ancestor with `overflow: hidden` and painted inside the first
 * ancestor that made a stacking context — both of which the guest list has
 * (the panel clips its own rounded corners, and the toolbar is a `sticky`
 * layer). A short list therefore cut the group menu off mid-way and let the
 * add row's own picker paint over it. Teleporting fixes both, and the panel
 * then needs to be positioned in viewport coordinates, which is this.
 *
 * The panel is anchored by the edge it grows away from — `top` when it opens
 * downwards, `bottom` when it opens up — so content that appears inside it
 * (an inline "new group" form, say) extends it away from the trigger rather
 * than sliding it off its anchor. `maxHeight` is whatever room is actually
 * left on that side, so the panel scrolls instead of running off screen.
 */
export function useAnchoredMenu(
  open: Ref<boolean>,
  anchor: Ref<HTMLElement | null>,
  options: AnchoredMenuOptions,
) {
  const {
    width,
    align = 'right',
    gap = 8,
    margin = 12,
    minHeight = 260,
    floorHeight = 180,
  } = options

  const menuStyle = ref<Record<string, string>>({})
  let frame: number | null = null

  const update = () => {
    frame = null
    const el = anchor.value
    if (!el) return

    const rect = el.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom - gap - margin
    const above = rect.top - gap - margin
    // Only flip when the other side is genuinely roomier — a panel that jumps
    // above the trigger to gain a few pixels is worse than one that scrolls.
    const dropUp = below < minHeight && above > below

    const panelWidth = Math.min(width, window.innerWidth - margin * 2)
    const rawLeft = align === 'right' ? rect.right - panelWidth : rect.left
    const maxLeft = Math.max(margin, window.innerWidth - panelWidth - margin)
    const left = Math.round(Math.min(Math.max(rawLeft, margin), maxLeft))

    menuStyle.value = {
      left: `${left}px`,
      width: `${panelWidth}px`,
      maxHeight: `${Math.round(Math.max(dropUp ? above : below, floorHeight))}px`,
      ...(dropUp
        ? { bottom: `${Math.round(window.innerHeight - rect.top + gap)}px` }
        : { top: `${Math.round(rect.bottom + gap)}px` }),
    }
  }

  const schedule = () => {
    if (frame !== null) return
    frame = requestAnimationFrame(update)
  }

  // Capture phase, so a scroll inside the list's own scroll region moves the
  // panel too — not just a scroll of the page.
  const listen = () => {
    window.addEventListener('scroll', schedule, { passive: true, capture: true })
    window.addEventListener('resize', schedule, { passive: true })
  }

  const unlisten = () => {
    window.removeEventListener('scroll', schedule, true)
    window.removeEventListener('resize', schedule)
    if (frame !== null) {
      cancelAnimationFrame(frame)
      frame = null
    }
  }

  watch(open, async (isOpen) => {
    if (!isOpen) {
      unlisten()
      return
    }
    // The trigger may only have just rendered (or changed size) — measure once
    // the DOM has settled, or the panel lands against a stale rect.
    await nextTick()
    update()
    listen()
  })

  onBeforeUnmount(unlisten)

  return { menuStyle, updateMenuPosition: update }
}
