import type {
  CoverDateFormat,
  CoverDetailElementId,
  CoverElementId,
  CoverFontSlot,
  CoverHostArrangement,
  CoverHostSubline,
} from '@/services/api/types/template.types'
import type {
  ResolvedCoverDetails,
  ResolvedCoverTextStyle,
} from '@/composables/showcase/useCoverStageLayout'
import {
  formatDateLocalized,
  toKhmerNumerals,
  translateRSVP,
  type SupportedLanguage,
} from '@/utils/translations'

/**
 * The text half of the cover's names-and-details blocks: which hosts, how each
 * name splits, and how the date and time read. Kept out of the component so
 * every rule here is a plain function with a test, rather than logic that can
 * only be checked by mounting a cover.
 */

/** The fields of a host the cover reads — a subset of the showcase's Host. */
export interface CoverHost {
  id: number
  name: string
  title?: string
}

/**
 * The event facts the detail blocks draw. One object rather than four props,
 * because it is threaded through three component layers (CoverStage → overlay →
 * each door leaf) and every one of them only passes it on.
 */
export interface CoverEventDetails {
  hosts: readonly CoverHost[]
  startDate?: string | null
  /** IANA zone the event is held in. Absent = the device's own clock. */
  timezone?: string | null
  location?: string | null
}

/**
 * The cover's event facts, picked off the showcase's event record. One function
 * for both callers (the live showcase and the preview frame), so the frame can
 * never draw a cover from different facts than the guest gets.
 */
export function coverEventDetailsOf(
  event: { start_date?: string | null; timezone?: string | null; location?: string | null } | null | undefined,
  hosts: readonly CoverHost[] | null | undefined,
): CoverEventDetails {
  return {
    hosts: hosts ?? [],
    startDate: event?.start_date ?? null,
    timezone: event?.timezone ?? null,
    location: event?.location ?? null,
  }
}

/** The organizer-authored text the blocks prefer over derived values. */
export interface CoverEventText {
  text_type: string
  language: string
  content: string
}

/**
 * Everything CoverDetailBlocks draws from, as one bindable object. The cover
 * overlay builds it once and hands the same object to its own copy and to both
 * door leaves, which only pass it on — so a field added here reaches all three
 * without a prop being threaded through DoorPanel for it.
 */
export interface CoverDetailBlocksBinding {
  eventDetails?: CoverEventDetails | null
  eventTexts?: CoverEventText[]
  currentLanguage?: string
  /** Which of the three the template switched on. */
  visible: Record<CoverDetailElementId, boolean>
  details: ResolvedCoverDetails
  /** Every block's box, resolved by useCoverStageLayout. */
  elementStyles: Record<CoverElementId, Record<string, string>>
  /** The font slot each block renders in, for its metallic finish. */
  elementFontSlots?: Record<CoverElementId, CoverFontSlot>
  primaryColor: string
  accentColor?: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  /** The template's own mark, already a full URL. Replaces `details.separator`. */
  separatorImageUrl?: string | null
  /**
   * The small line under each host name, styled on its own: it is not the
   * names block's main text, so it isn't carried by the block's variables.
   */
  sublineStyle?: ResolvedCoverTextStyle
}

/**
 * The cover's host-names block, for the `simple` host design to draw when the
 * template sets it to match (`host_info_design.sync_cover_names`).
 *
 * `vars` carries the look the same way the cover does: the template's slot
 * variables (coverSlotVars) plus the names' own `--cover-block-font` /
 * `--cover-block-color` (coverBlockTypeVars). With those published on the
 * invitation's names, the font and colour expressions CoverDetailBlocks writes
 * for the names resolve there exactly as they do on the cover.
 */
export interface CoverHostNamesBinding {
  details: ResolvedCoverDetails
  /** The names' font slot, for their metallic finish. */
  namesSlot: CoverFontSlot
  /** The small line under each name, styled on its own. */
  sublineStyle: ResolvedCoverTextStyle
  vars: Record<string, string>
  /** The template's own mark, already a full URL. Replaces `details.separator`. */
  separatorImageUrl: string | null
}

// Khmer and Khmer Symbols. Enough to tell a Khmer name from a romanised one,
// which is the only question asked of it.
const KHMER_SCRIPT = /[\u1780-\u17FF\u19E0-\u19FF]/

export const hasKhmerScript = (text: string): boolean => KHMER_SCRIPT.test(text)

/**
 * Whether a run of text takes spaced capitals. Khmer never does: the script has
 * no case, and letter-spacing pulls its stacked subscripts off their bases.
 */
export const takesCapitals = (enabled: boolean, text: string): boolean =>
  enabled && !hasKhmerScript(text)

/**
 * The hosts the block draws: every host with a name, in the event's own order,
 * capped at `count` when the template sets one.
 *
 * Deliberately not re-sorted by `order`. The host block on the invitation reads
 * the array as given, and the cover must name the same person first.
 */
export function selectCoverHosts<T extends CoverHost>(
  hosts: readonly T[] | null | undefined,
  count: number | null,
): T[] {
  const named = (hosts ?? []).filter((host) => !!host.name?.trim())
  return count ? named.slice(0, count) : named
}

export interface CoverHostLines {
  /** The large line. */
  name: string
  /** The small line under it, or null for none. */
  subline: string | null
}

/**
 * One host, split into the two lines the block draws.
 *
 * `surname` splits at the LAST space, so a double given name stays together
 * ("Mary Anne" / "Smith"). It is skipped for a name in Khmer script, which is
 * written family name first — splitting "ចាន់ សុភា" would set the given name in
 * the small line, the opposite of what the design means.
 */
export function coverHostLines(host: CoverHost, subline: CoverHostSubline): CoverHostLines {
  const name = host.name.trim()
  if (subline === 'title') return { name, subline: host.title?.trim() || null }
  if (subline === 'surname' && !hasKhmerScript(name)) {
    const cut = name.lastIndexOf(' ')
    if (cut > 0) return { name: name.slice(0, cut).trim(), subline: name.slice(cut + 1).trim() }
  }
  return { name, subline: null }
}

/**
 * How much the names shrink as more of them share the block.
 *
 * The block's box is sized for the reference card's two names. A third or
 * fourth added at the same size would spill well past it, and a partner would
 * have to re-tune the template for every event with more hosts — so the type
 * gives way a step instead. Inline loses a step sooner, because every name it
 * adds widens the one line they share.
 */
export function hostCountScale(count: number, arrangement: CoverHostArrangement): number {
  if (arrangement === 'inline') {
    if (count <= 1) return 1
    return count === 2 ? 0.86 : 0.72
  }
  if (count <= 2) return 1
  return count === 3 ? 0.86 : 0.76
}

/** The localized word between two hosts, for the `word` separator. */
export const hostJoinerWord = (language: string | undefined): string =>
  translateRSVP('host_joiner', toSupportedLanguage(language))

/** An event instant as the wall clock in its own time zone shows it. */
export interface EventClock {
  year: number
  /** 0-11 */
  month: number
  day: number
  hour: number
  minute: number
}

/**
 * The start date as it reads where the event is held.
 *
 * A printed invitation gives the local date and time of the venue, and a guest
 * abroad reading the cover should see the same — so this converts through the
 * event's zone rather than the device's. With no zone, or one the engine
 * doesn't know, it falls back to the device clock, which is what every other
 * date on the showcase uses.
 */
export function eventClock(iso: string | null | undefined, timeZone?: string | null): EventClock | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23',
      }).formatToParts(date)
      const part = (type: Intl.DateTimeFormatPartTypes): number =>
        Number(parts.find((p) => p.type === type)?.value)
      const clock = {
        year: part('year'),
        month: part('month') - 1,
        day: part('day'),
        // `% 24` because some engines still write midnight as 24 under h23.
        hour: part('hour') % 24,
        minute: part('minute'),
      }
      if (Object.values(clock).every(Number.isFinite)) return clock
    } catch {
      // An unknown zone throws a RangeError; the device clock below is the answer.
    }
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  }
}

const pad = (value: number): string => String(value).padStart(2, '0')

function toSupportedLanguage(language: string | undefined): SupportedLanguage {
  return language === 'kh' || language === 'zh-cn' ? language : 'en'
}

/**
 * A date formatted from its wall-clock fields. The long form is handed to the
 * showcase's own formatter so it reads exactly as the other long dates do; that
 * formatter reads the device's local fields, so it is given a local Date built
 * from the event's.
 */
export function formatCoverDate(
  clock: EventClock,
  format: Exclude<CoverDateFormat, 'text'>,
  language: string | undefined,
): string {
  if (format === 'numeric') {
    const numeric = `${pad(clock.day)}.${pad(clock.month + 1)}.${clock.year}`
    return language === 'kh' ? toKhmerNumerals(numeric) : numeric
  }
  const wallClock = new Date(clock.year, clock.month, clock.day, 12)
  return formatDateLocalized(wallClock, 'long', toSupportedLanguage(language))
}

/**
 * The time line, when the organizer wrote no `time_text` of their own. Written
 * out by hand rather than through Intl so the result doesn't vary by browser:
 * "5 PM" (the minutes only when there are some), "ម៉ោង ១៧:០០", "17:00".
 */
export function formatCoverTime(clock: EventClock, language: string | undefined): string {
  const { hour, minute } = clock
  if (language === 'kh') return `ម៉ោង ${toKhmerNumerals(`${hour}:${pad(minute)}`)}`
  if (language === 'zh-cn') return `${hour}:${pad(minute)}`
  const hour12 = hour % 12 || 12
  const period = hour < 12 ? 'AM' : 'PM'
  return minute === 0 ? `${hour12} ${period}` : `${hour12}:${pad(minute)} ${period}`
}

/** The organizer's text of one type in one language, trimmed, or null. */
export function findCoverText(
  texts: readonly CoverEventText[] | null | undefined,
  textType: string,
  language: string | undefined,
): string | null {
  if (!texts || !language) return null
  const content = texts.find((t) => t.text_type === textType && t.language === language)?.content
  return content?.trim() ? content.trim() : null
}
