import { describe, expect, it } from 'vitest'
import {
  composeMessage,
  MESSAGE_MAX_LENGTH,
  noteBudget,
  type PartnerRequestAnswers,
} from './usePartnerRequestForm'

/**
 * The form asks five questions the API has no fields for, and `composeMessage`
 * is the one-way fold that turns them into its single `message` string. It is
 * the only place the extra questions exist, so it is the only thing that can be
 * wrong about them.
 */

const answers = (over: Partial<PartnerRequestAnswers> = {}): PartnerRequestAnswers => ({
  business_name: 'Dara Wedding House',
  contact_phone: '012345678',
  ...over,
})

describe('composeMessage', () => {
  it('returns undefined when nothing optional was answered', () => {
    // Not an empty string: `message` is optional on the API, and an absent key
    // plainly means "not answered" where "" is a value the server has to judge.
    expect(composeMessage(answers())).toBeUndefined()
    expect(
      composeMessage(
        answers({ business_type: '', based_in: '  ', invitations_today: '', message: '' }),
      ),
    ).toBeUndefined()
  })

  it('writes one labelled line per answer, in reading order', () => {
    const composed = composeMessage(
      answers({
        business_type: 'print_shop',
        based_in: 'Siem Reap',
        invitations_today: 'printed',
        heard_from: 'Sophea',
        message: 'We also do decoration.',
      }),
    )

    expect(composed).toBe(
      [
        'Business: Printing shop',
        'Based in: Siem Reap',
        'Invitations today: Prints cards',
        'Referred by: Sophea',
        'Notes: We also do decoration.',
      ].join('\n'),
    )
  })

  it('omits unanswered questions rather than padding them out', () => {
    const composed = composeMessage(answers({ based_in: 'Phnom Penh' }))

    expect(composed).toBe('Based in: Phnom Penh')
    expect(composed).not.toContain('Business:')
    expect(composed).not.toContain('Referred by:')
  })

  it('trims what the applicant typed', () => {
    expect(composeMessage(answers({ based_in: '  Battambang  ' }))).toBe('Based in: Battambang')
  })

  it('keeps the free note in the applicant own words, paragraphs and all', () => {
    const note = 'We have two shops.\n\nOne is new.'
    expect(composeMessage(answers({ message: note }))).toBe(`Notes: ${note}`)
  })

  /**
   * The labels and the chosen options resolve to fixed English, never through
   * `t()`. A reviewer works a queue, and the structure of each row should not
   * change script depending on which language the applicant happened to read the
   * form in — only their own free text should be in their own words.
   */
  it('labels a Khmer applicant answers in the same English as everyone else', () => {
    const composed = composeMessage(
      answers({
        business_type: 'wedding_shop',
        based_in: 'ភ្នំពេញ',
        invitations_today: 'none',
      }),
    )

    expect(composed).toBe(
      [
        'Business: Wedding shop',
        'Based in: ភ្នំពេញ',
        'Invitations today: Does not do invitations yet',
      ].join('\n'),
    )
  })
})

/**
 * The API caps `message` at 1000 characters (partner-access-request.md). That
 * used to be the textarea's own `maxlength` — one box, one column, same number.
 * Composing four labelled lines in front of it broke that equivalence, and a
 * full note would have arrived ~1390 long and been refused. For an anonymous
 * applicant that 400 lands *after* the sign-in trip, on a form they can no
 * longer see, so it is worth a test rather than an assumption.
 */
describe('the 1000-character budget', () => {
  const long = (n: number) => 'x'.repeat(n)

  it('never composes past the API limit, however full the form', () => {
    const composed = composeMessage(
      answers({
        business_type: 'photo_video',
        based_in: long(120),
        invitations_today: 'outsourced',
        heard_from: long(160),
        message: long(1000),
      }),
    )

    expect(composed!.length).toBeLessThanOrEqual(MESSAGE_MAX_LENGTH)
  })

  it('trims the note, never the facts a reviewer is reading for', () => {
    const composed = composeMessage(
      answers({
        business_type: 'photo_video',
        based_in: 'Kep',
        invitations_today: 'outsourced',
        heard_from: 'Sophea',
        message: long(1000),
      }),
    )!

    expect(composed).toContain('Business: Photo or video studio')
    expect(composed).toContain('Based in: Kep')
    expect(composed).toContain('Invitations today: Orders them from someone else')
    expect(composed).toContain('Referred by: Sophea')
    expect(composed.length).toBeLessThanOrEqual(MESSAGE_MAX_LENGTH)
  })

  it('gives the note nearly the whole budget when nothing else was answered', () => {
    // The previous behaviour, preserved for the common case: someone who only
    // writes a note should not be rationed for questions they skipped.
    expect(noteBudget(answers())).toBe(MESSAGE_MAX_LENGTH - 'Notes: '.length)
    expect(composeMessage(answers({ message: long(993) }))!.length).toBe(MESSAGE_MAX_LENGTH)
  })

  it('shrinks the budget as the questions above are filled in', () => {
    const empty = noteBudget(answers())
    const filled = noteBudget(answers({ based_in: 'Siem Reap', business_type: 'print_shop' }))

    expect(filled).toBeLessThan(empty)
    expect(filled).toBeGreaterThan(900)
  })
})
