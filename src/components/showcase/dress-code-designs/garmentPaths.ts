/**
 * Which drawing a dress code gets.
 *
 * The drawings themselves live in garmentArt.ts; this file is the policy that
 * points a `dress_code_type` at one of them.
 *
 * ## Why a drawing at all
 *
 * The dress code block's *empty state* was its most common state. A dress code
 * carries a colour and an optional photograph; when the organizer has no
 * photograph — which is most of the time, because a photograph of an outfit is
 * something you have to go and find — the section painted a 288px square of
 * flat colour with a generic person glyph at 30% white on top. That reads as a
 * missing image, not as an instruction, and the glyph vanished outright on any
 * pale colour because its opacity never adapted to what it sat on.
 *
 * A drawn garment fixes both halves at once: the colour becomes the *fabric*
 * rather than the background, so it says "wear this" instead of "an image
 * failed to load", and the shape says which kind of thing to wear before a
 * single word is read — which is the only part of a dress code that survives
 * not sharing a language with the guest.
 *
 * ## One drawing language, two families
 *
 * There used to be two languages here: traced fashion plates for the four
 * formal garments, and a dozen hand-authored geometric silhouettes (a polo, a
 * blouse, a sundress, a domino mask, a coat hanger) for everything else. Both
 * appeared in one figure whenever a code applied to all genders, and a fine ink
 * drawing next to a blocky icon reads as a rendering fault rather than as two
 * outfits — so the mapping table carried an invariant forbidding a mixed pair,
 * and two of its entries were chosen to satisfy that invariant rather than to
 * be right about the clothes.
 *
 * Now everything is traced art, in two families:
 *
 *   FORMAL       gown + dinner suit — the default for every dress code type.
 *   TRADITIONAL  draped sari-and-sbai + mandarin-collar tunic suit.
 *
 * The silhouettes are gone, the invariant is gone with them, and there is
 * nothing left for a "which language is this" check to guard.
 *
 * ## Why `traditional` is the only type in the traditional family
 *
 * `traditional` and every other type are separate entries in the same backend
 * enum, so an organizer who wanted traditional dress picked it. Reading a
 * second type — `festive` is the tempting one — as traditional would override a
 * choice the organizer made explicitly, and would illustrate "wear something
 * bright" at a birthday with ceremonial dress.
 *
 * The cost is the opposite error: `beach_casual` is now drawn as a dinner suit.
 * That is a formality mismatch and it is the smaller of the two, because the
 * copy beside the figure names the code and the figure only has to say
 * *clothing, of this colour* — where drawing ceremonial dress for a code that
 * isn't ceremonial makes a claim about the event itself.
 */

import {
  ART_FORMAL_COUPLE,
  ART_GOWN,
  ART_TRADITIONAL_COUPLE,
  ART_TRADITIONAL_DRAPE,
  ART_TRADITIONAL_TUNIC,
  ART_TUXEDO,
  GARMENT_ART_VIEWBOX,
} from './garmentArt'

export const GARMENT_VIEWBOX = GARMENT_ART_VIEWBOX

/**
 * One drawing per gender, plus the pair.
 *
 * `masc` and `fem` are names for the two figures, not a claim about who wears
 * them: the backend's `gender` field selects between them, and `all` renders
 * the pair. A dress code that applies to everyone genuinely has two answers,
 * and picking one of them would be the frontend deciding something the
 * organizer deliberately didn't.
 *
 * `couple` is a drawing OF the pair, not the two solo paths placed side by
 * side — see garmentArt.ts for why that distinction has to exist.
 */
interface GarmentFamily {
  masc: string
  fem: string
  couple: string
}

const FORMAL: GarmentFamily = {
  masc: ART_TUXEDO,
  fem: ART_GOWN,
  couple: ART_FORMAL_COUPLE,
}

const TRADITIONAL: GarmentFamily = {
  masc: ART_TRADITIONAL_TUNIC,
  fem: ART_TRADITIONAL_DRAPE,
  couple: ART_TRADITIONAL_COUPLE,
}

/**
 * Only the types that are NOT formal need an entry. Everything else — including
 * a type this build has never heard of — falls through to FORMAL, which is the
 * one family that can stand in for any of them without asserting anything about
 * the occasion.
 */
const FAMILY_BY_TYPE: Record<string, GarmentFamily> = {
  traditional: TRADITIONAL,
}

/** The path a dress code draws, on the `GARMENT_VIEWBOX` box. */
export function resolveGarmentArt(dressCodeType: string, gender: string): string {
  const family = FAMILY_BY_TYPE[dressCodeType] ?? FORMAL
  if (gender === 'male') return family.masc
  if (gender === 'female') return family.fem

  // `all`, and anything the backend adds later, shows the pair.
  return family.couple
}
