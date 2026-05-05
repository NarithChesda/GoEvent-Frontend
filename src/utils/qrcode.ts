/**
 * QR code helpers built on top of the `qrcode` npm package.
 *
 * Tickets carry a 32-character `qr_code` token (resistant to enumeration) plus
 * a 10-character `check_in_code` for manual entry. The backend stores the
 * string only — we render the image client-side here.
 *
 * Use `renderTicketQrDataUrl` to produce a `data:image/png` you can drop into
 * an `<img :src>`. Errors are surfaced as a rejected promise so callers can
 * fall back to showing only the short code.
 */

import QRCode from 'qrcode'

export interface RenderQrOptions {
  /**
   * Output pixel size. Defaults to 256, which renders crisply at retina DPI
   * inside a typical phone-screen ticket card. Bump to 384/512 for printable
   * tickets if/when we add a print view.
   */
  width?: number
  /** ECC level. `M` (15%) is the default — balances size and recovery. */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  margin?: number
}

const DEFAULTS: Required<RenderQrOptions> = {
  width: 256,
  errorCorrectionLevel: 'M',
  margin: 1,
}

/**
 * Render any string into a base64 PNG `data:` URL.
 *
 * Throws if `value` is empty — callers should guard upstream so the UI can
 * show a "no QR available" placeholder before invoking this helper.
 */
export async function renderQrDataUrl(
  value: string,
  options: RenderQrOptions = {},
): Promise<string> {
  if (!value) {
    throw new Error('renderQrDataUrl: value is required')
  }
  const merged = { ...DEFAULTS, ...options }
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: merged.errorCorrectionLevel,
    margin: merged.margin,
    width: merged.width,
  })
}

/**
 * Convenience wrapper for the ticket's `qr_code` string. Same behaviour as
 * `renderQrDataUrl` — kept as a separate name so future ticket-specific
 * tweaks (logo overlay, branded colors) can land here without touching every
 * call site.
 */
export const renderTicketQrDataUrl = renderQrDataUrl
