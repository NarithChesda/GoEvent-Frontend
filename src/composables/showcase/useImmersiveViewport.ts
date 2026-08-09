/**
 * Hides the browser's own chrome (URL bar / in-app-browser header) so the
 * showcase fills the screen the moment the guest opens the invitation.
 *
 * Why this needs a gesture: no API dismisses browser chrome on demand. Browsers
 * only collapse it in response to a *document-level* scroll, and the V1 showcase
 * keeps scrolling inside its own container (the stage is a fixed 100vh frame),
 * so that signal never fires — which is why a guest otherwise has to find a
 * non-scrolling spot on the page and drag the header away by hand. The
 * Fullscreen API is the one escape hatch, and it is only granted while a user
 * activation is live — hence this is called from the cover's tap/swipe-to-open
 * handler, synchronously.
 *
 * Platform reality:
 *   - Android Chrome/Firefox, and Android in-app WebViews that implement
 *     `onShowCustomView` (Facebook, Messenger, Telegram): works — header and
 *     status bar both go away.
 *   - iOS Safari and every iOS in-app browser: the Fullscreen API is not
 *     available for non-video elements, so the request is simply refused and
 *     the guest keeps the normal viewport.
 *
 * Touch devices only. A desktop browser would honour the request and go
 * genuinely fullscreen (F11-style, complete with an "Esc to exit" prompt) on
 * what the guest experienced as an ordinary click — and desktop has no
 * collapsing chrome to reclaim in the first place.
 *
 * Failure is always silent: losing fullscreen must never block the reveal.
 */

import { isTouchPrimaryDevice } from '@/utils/browserDetection'

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null
}

/** Keep watching this long even if the height looks settled — the resize can
 *  lag the fullscreen transition, and resolving before it lands would hand the
 *  animation a viewport that is still about to change under it. */
const SETTLE_MIN_MS = 100
/** Hard cap, so a browser whose height never stops moving can't stall the
 *  invitation behind it. */
const SETTLE_MAX_MS = 400

/**
 * Resolves once `window.innerHeight` has held steady for two consecutive frames
 * (never before SETTLE_MIN_MS, never after SETTLE_MAX_MS).
 *
 * Measured directly rather than keyed off `resize` or the fullscreen promise,
 * because their ordering differs per browser: Chrome resolves the promise after
 * its ~250ms transition, by which point waiting for a `resize` would just burn
 * the timeout. Watching the height itself is true regardless of who fires what.
 */
const waitForViewportSettle = (): Promise<void> =>
  new Promise((resolve) => {
    const start = performance.now()
    let lastHeight = window.innerHeight
    let stableFrames = 0

    const tick = () => {
      const elapsed = performance.now() - start
      const height = window.innerHeight

      if (height === lastHeight) {
        stableFrames += 1
      } else {
        stableFrames = 0
        lastHeight = height
      }

      const settled = stableFrames >= 2 && elapsed >= SETTLE_MIN_MS
      if (settled || elapsed >= SETTLE_MAX_MS) resolve()
      else requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  })

export function useImmersiveViewport() {
  const isImmersive = (): boolean => {
    const doc = document as FullscreenDocument
    return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement)
  }

  /**
   * Call this synchronously inside a user-gesture handler — an `await` *before*
   * it spends the activation and the browser rejects the request. Awaiting the
   * promise it returns is fine and is the point: it resolves once the viewport
   * has stopped moving, so the caller can hold its animation until then.
   *
   * Resolves immediately whenever no fullscreen request was actually made or the
   * browser refused it, so non-supporting platforms pay no delay at all.
   */
  const requestImmersiveViewport = (): Promise<void> => {
    if (typeof document === 'undefined' || isImmersive() || !isTouchPrimaryDevice()) {
      return Promise.resolve()
    }

    const root = document.documentElement as FullscreenElement
    const request: ((options?: FullscreenOptions) => Promise<void> | void) | undefined =
      root.requestFullscreen?.bind(root) ?? root.webkitRequestFullscreen?.bind(root)
    if (!request) return Promise.resolve()

    try {
      // `navigationUI: 'hide'` asks Chrome to drop the nav bar too; browsers
      // that don't honour it ignore the option rather than rejecting.
      const result = request({ navigationUI: 'hide' })
      // Rejects (not throws) when activation was already spent or the embedding
      // app disallows fullscreen — nothing will move, so don't wait for it.
      if (result instanceof Promise) {
        return result.then(waitForViewportSettle, () => {})
      }
      // Older WebKit signature returns nothing; the resize is still coming.
      return waitForViewportSettle()
    } catch {
      // Unsupported or blocked — carry on with the browser header visible.
      return Promise.resolve()
    }
  }

  return { isImmersive, requestImmersiveViewport }
}
