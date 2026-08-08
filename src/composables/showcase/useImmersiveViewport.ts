/**
 * Hides the browser's own chrome (URL bar / in-app-browser header) so the
 * showcase fills the screen the moment the guest opens the invitation.
 *
 * Why this needs a gesture: no API dismisses browser chrome on demand. Browsers
 * only collapse it in response to a *document-level* scroll, and the V1 showcase
 * deliberately keeps scrolling inside its own container (the stage is a fixed
 * 100dvh frame), so that signal never fires. The Fullscreen API is the one
 * escape hatch, and it is only granted while a user activation is live — hence
 * this is called from the cover's tap/swipe-to-open handler, synchronously.
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

export function useImmersiveViewport() {
  const isImmersive = (): boolean => {
    const doc = document as FullscreenDocument
    return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement)
  }

  /**
   * Must run synchronously inside a user-gesture handler — an `await` before it
   * spends the activation and the browser rejects the request.
   */
  const requestImmersiveViewport = (): void => {
    if (typeof document === 'undefined' || isImmersive() || !isTouchPrimaryDevice()) return

    const root = document.documentElement as FullscreenElement
    const request: ((options?: FullscreenOptions) => Promise<void> | void) | undefined =
      root.requestFullscreen?.bind(root) ?? root.webkitRequestFullscreen?.bind(root)
    if (!request) return

    try {
      // `navigationUI: 'hide'` asks Chrome to drop the nav bar too; browsers
      // that don't honour it ignore the option rather than rejecting.
      const result = request({ navigationUI: 'hide' })
      // Rejects (not throws) when activation was already spent or the embedding
      // app disallows fullscreen.
      if (result instanceof Promise) result.catch(() => {})
    } catch {
      // Unsupported or blocked — carry on with the browser header visible.
    }
  }

  return { isImmersive, requestImmersiveViewport }
}
