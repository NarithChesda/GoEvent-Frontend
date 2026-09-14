/**
 * A partner application, held on the visitor's own device across sign-in.
 *
 * `/partners/apply` is a link a salesperson sends cold to a shop owner who has
 * no account. Asking them to register before they have typed anything is the
 * step that loses them, so the page takes the form first and the account
 * second — which means the answers have to survive a full navigation away to
 * `/signin` (and, for Google or Telegram, away from the origin entirely) and
 * back.
 *
 * localStorage rather than sessionStorage for exactly that reason: sessionStorage
 * is per tab, and a provider that finishes in a new window would drop the draft
 * on the floor. `secureStorage` is the repo's wrapper over the same store — it
 * adds the try/catch that private mode and a full quota need, nothing more.
 *
 * `pendingSubmit` is the difference between "they were filling this in" and
 * "they pressed Send and we interrupted them to ask who they are". Only the
 * second may complete itself on the way back; auto-submitting a half-typed form
 * because the visitor happened to sign in elsewhere would file an application
 * they never sent.
 */
import { secureStorage } from '@/utils/secureStorage'
import type { PartnerRequestAnswers } from '@/composables/settings/usePartnerRequestForm'

const STORAGE_KEY = 'goevent_partner_request_draft'

/**
 * How long an abandoned draft stays offerable.
 *
 * Long enough to cover the round trip through a provider, a lost password and a
 * cup of coffee; short enough that a stale business name never reappears
 * pre-filled weeks later in front of someone who has forgotten typing it.
 */
const MAX_AGE_MS = 24 * 60 * 60 * 1000

export interface PartnerRequestDraft {
  /**
   * The form's OWN shape, not the API payload.
   *
   * Five of the questions are folded into the API's single `message` string at
   * submit (see `composeMessage`), and that fold is one-way. Storing the payload
   * would bring the applicant back from sign-in to a block of composed prose
   * sitting in the notes box with every question above it blank — their answers
   * technically preserved and visibly destroyed.
   */
  data: PartnerRequestAnswers
  /** They pressed Send; finish it once there is an account to file it against. */
  pendingSubmit: boolean
  /** Epoch ms, for the age check above. */
  savedAt: number
}

export function savePartnerRequestDraft(data: PartnerRequestAnswers, pendingSubmit: boolean): void {
  const draft: PartnerRequestDraft = { data, pendingSubmit, savedAt: Date.now() }
  secureStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

/**
 * The stored draft, or `null` when there is none, it has expired, or it cannot
 * be parsed.
 *
 * Anything unreadable is cleared rather than returned: a draft is a convenience,
 * and a convenience that throws on every page load is worse than no draft. The
 * shape is re-checked field by field because this is the one input to the form
 * that did not come from the server or from this session's own code.
 */
export function readPartnerRequestDraft(): PartnerRequestDraft | null {
  const raw = secureStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as PartnerRequestDraft

    const looksRight =
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.savedAt === 'number' &&
      parsed.data &&
      typeof parsed.data === 'object' &&
      typeof parsed.data.business_name === 'string' &&
      typeof parsed.data.contact_phone === 'string'

    if (!looksRight || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      clearPartnerRequestDraft()
      return null
    }

    return { ...parsed, pendingSubmit: Boolean(parsed.pendingSubmit) }
  } catch {
    clearPartnerRequestDraft()
    return null
  }
}

export function clearPartnerRequestDraft(): void {
  secureStorage.removeItem(STORAGE_KEY)
}
