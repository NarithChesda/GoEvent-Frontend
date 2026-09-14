/**
 * The partner application's draft, its validation, and the payload it becomes.
 *
 * Shared by the two surfaces that ask for one — the signed-in drawer on
 * `/credits` and the public page at `/partners/apply` — so the rules cannot
 * differ between them. `usePartnerRequestForm` is deliberately separate from
 * `usePartnerRequest`: that one owns the *account's* standing application and
 * talks to the server, this one owns the text in the boxes and never does.
 *
 * THE FORM ASKS MORE QUESTIONS THAN THE API HAS FIELDS. `message` is one free
 * text column on the backend, and it used to be one empty textarea here, under
 * "Anything else we should know" with a placeholder listing the three things we
 * actually wanted (where you are based, the kind of events you do, anyone at
 * GoEvent you have spoken to). Almost nobody writes a paragraph to a blank box —
 * a prospect who has just met the page freezes at it — and the three facts a
 * reviewer needs to judge a shop went unanswered. So the box is now those
 * questions, most of them one tap, and `composeMessage` folds the answers back
 * into the single string the API takes. **Nothing new is sent**; the extra
 * questions never reach the wire as fields of their own.
 */
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CreatePartnerRequestData, PartnerRequestVolume } from '@/services/api'

/** What kind of shop this is. Frontend-only — folded into `message`. */
export type PartnerBusinessType =
  | 'wedding_shop'
  | 'print_shop'
  | 'photo_video'
  | 'event_planner'
  | 'decoration'
  | 'other'

/** How their customers get invitations today. Frontend-only, as above. */
export type PartnerInvitationsToday = 'printed' | 'digital' | 'outsourced' | 'none'

export const BUSINESS_TYPES: PartnerBusinessType[] = [
  'wedding_shop',
  'print_shop',
  'photo_video',
  'event_planner',
  'decoration',
  'other',
]

export const INVITATIONS_TODAY: PartnerInvitationsToday[] = [
  'printed',
  'digital',
  'outsourced',
  'none',
]

/**
 * Everything the form holds — the API's own fields plus the questions that get
 * folded into `message`. This, not `CreatePartnerRequestData`, is what a draft
 * is saved as: storing the composed payload instead would bring the applicant
 * back from sign-in to a blob of prose in one box with every question blanked.
 */
export interface PartnerRequestAnswers {
  business_name: string
  contact_phone: string
  contact_telegram?: string
  expected_monthly_events?: PartnerRequestVolume | ''
  business_type?: PartnerBusinessType | ''
  based_in?: string
  invitations_today?: PartnerInvitationsToday | ''
  heard_from?: string
  /** The catch-all, still free text — guided questions always miss something. */
  message?: string
}

/**
 * The labels written into the composed `message`, in English, always.
 *
 * NOT `t()`. These are read by whoever reviews the application, and a reviewer
 * working through a queue should not have the structure of each one change
 * script depending on which language the applicant happened to be reading. The
 * *answers* stay in the applicant's own words — free text is theirs, and a
 * chosen option resolves through the maps below rather than through the UI
 * locale, so "Printing shop" says the same thing on every row.
 */
const MESSAGE_LABELS = {
  business_type: 'Business',
  based_in: 'Based in',
  invitations_today: 'Invitations today',
  heard_from: 'Referred by',
  message: 'Notes',
} as const

const BUSINESS_TYPE_TEXT: Record<PartnerBusinessType, string> = {
  wedding_shop: 'Wedding shop',
  print_shop: 'Printing shop',
  photo_video: 'Photo or video studio',
  event_planner: 'Event planner',
  decoration: 'Decoration or venue',
  other: 'Something else',
}

const INVITATIONS_TODAY_TEXT: Record<PartnerInvitationsToday, string> = {
  printed: 'Prints cards',
  digital: 'Makes digital ones',
  outsourced: 'Orders them from someone else',
  none: 'Does not do invitations yet',
}

/**
 * The API's own limit on `message`, and therefore the budget every question
 * folded into it has to share.
 *
 * It used to be the textarea's `maxlength` and nothing more — one box, one
 * column, the same number at both ends. Composing four labelled lines in front
 * of that box broke the equivalence: worst case the structured half is ~390
 * characters, so a full note would arrive ~1390 long and be refused. A 400 on
 * `message` is a bad error anywhere, and for an anonymous applicant it lands
 * *after* the trip through sign-in, on a form they can no longer see. So the
 * note is budgeted against what the structured lines actually cost — see
 * `noteBudget`, which the textarea uses for its own `maxlength`.
 */
export const MESSAGE_MAX_LENGTH = 1000

/** The structured lines, without the free note. Exported for `noteBudget`. */
function structuredLines(answers: PartnerRequestAnswers): string[] {
  const lines: string[] = []

  const push = (key: keyof typeof MESSAGE_LABELS, value: string | undefined) => {
    const text = value?.trim()
    if (text) lines.push(`${MESSAGE_LABELS[key]}: ${text}`)
  }

  push(
    'business_type',
    answers.business_type ? BUSINESS_TYPE_TEXT[answers.business_type] : undefined,
  )
  push('based_in', answers.based_in)
  push(
    'invitations_today',
    answers.invitations_today ? INVITATIONS_TODAY_TEXT[answers.invitations_today] : undefined,
  )
  push('heard_from', answers.heard_from)

  return lines
}

/**
 * How many characters of free note still fit, given the questions answered so far.
 *
 * The textarea takes this as its `maxlength`, so the limit is enforced where the
 * typing happens rather than discovered at submit. It shrinks as the questions
 * above are filled in; a note already longer than the new budget is truncated by
 * `composeMessage` rather than sent over the limit, which is why the field also
 * shows a counter once it is close — silent truncation of someone's own words is
 * the one outcome worse than a refused submit.
 */
export function noteBudget(answers: PartnerRequestAnswers): number {
  const structured = structuredLines(answers)
  const prefix = structured.length ? structured.join('\n').length + 1 : 0
  return Math.max(0, MESSAGE_MAX_LENGTH - prefix - `${MESSAGE_LABELS.message}: `.length)
}

/**
 * The answers as one readable block, or `undefined` when none were given.
 *
 * One `Label: answer` per line, unanswered questions omitted entirely — a run of
 * "Based in: —" lines is noise in a review queue. The free-text note goes last
 * and keeps its own paragraphs, so someone who does write prose is not
 * reformatted into a field.
 *
 * The note is the only part that can be trimmed to fit `MESSAGE_MAX_LENGTH`: the
 * structured lines are the facts a reviewer is reading for, and dropping one of
 * those to make room for prose would lose the answer to a question we asked.
 */
export function composeMessage(answers: PartnerRequestAnswers): string | undefined {
  const lines = structuredLines(answers)

  const note = answers.message?.trim()
  if (note) lines.push(`${MESSAGE_LABELS.message}: ${note.slice(0, noteBudget(answers))}`)

  return lines.length ? lines.join('\n') : undefined
}

const emptyAnswers = (): PartnerRequestAnswers => ({
  business_name: '',
  contact_phone: '',
  contact_telegram: '',
  expected_monthly_events: '',
  business_type: '',
  based_in: '',
  invitations_today: '',
  heard_from: '',
  message: '',
})

export function usePartnerRequestForm() {
  const { t } = useI18n()

  const draft = ref<PartnerRequestAnswers>(emptyAnswers())
  /** Client-side validation only — server errors live in `usePartnerRequest`. */
  const localErrors = ref<Record<string, string>>({})
  const formError = ref<string | null>(null)

  const reset = (seed?: Partial<PartnerRequestAnswers>): void => {
    draft.value = { ...emptyAnswers(), ...seed }
    localErrors.value = {}
    formError.value = null
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!draft.value.business_name.trim()) {
      errors.business_name = t('settings.credits.request.validation.businessNameRequired')
    }
    if (!draft.value.contact_phone.trim()) {
      errors.contact_phone = t('settings.credits.request.validation.phoneRequired')
    }

    localErrors.value = errors
    formError.value = Object.keys(errors).length
      ? t('settings.credits.request.validation.fixFields')
      : null

    return !formError.value
  }

  /**
   * The draft as the API wants it: trimmed, unanswered keys dropped, and the
   * five "about your business" questions folded down into `message`.
   */
  const payload = (): CreatePartnerRequestData => ({
    business_name: draft.value.business_name.trim(),
    contact_phone: draft.value.contact_phone.trim(),
    contact_telegram: draft.value.contact_telegram?.trim() || undefined,
    expected_monthly_events: draft.value.expected_monthly_events || undefined,
    message: composeMessage(draft.value),
  })

  // Editing a field clears only its own complaint, so correcting one problem
  // doesn't wipe the list of the others still waiting.
  watch(
    draft,
    () => {
      if (draft.value.business_name.trim()) delete localErrors.value.business_name
      if (draft.value.contact_phone.trim()) delete localErrors.value.contact_phone
      if (!Object.keys(localErrors.value).length) formError.value = null
    },
    { deep: true },
  )

  return { draft, localErrors, formError, reset, validate, payload }
}
