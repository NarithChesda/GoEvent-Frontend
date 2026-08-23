/**
 * The one definition of an acceptable proof of payment.
 *
 * The backend accepts `pdf, jpg, jpeg, png, gif, webp` for both the template
 * activation receipt and the partner credit-pack proof, so both checkouts reject
 * the same files for the same reason rather than each carrying its own copy of
 * the rule (which is how the size limit and the type list drifted apart before).
 */

export const MAX_PROOF_BYTES = 10 * 1024 * 1024

export const ALLOWED_PROOF_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
] as const

/** A translator — `t` from `useI18n()`, passed in so this stays a plain module. */
type Translate = (key: string) => string

/** Returns a user-facing reason, or `null` when the file is acceptable. */
export function validatePaymentProofFile(file: File, t: Translate): string | null {
  if (file.size > MAX_PROOF_BYTES) {
    return t('management.templatePaymentTab.paymentDrawer.fileTooLarge')
  }
  if (!(ALLOWED_PROOF_TYPES as readonly string[]).includes(file.type)) {
    return t('management.templatePaymentTab.paymentDrawer.fileTypeNotAllowed')
  }
  return null
}
