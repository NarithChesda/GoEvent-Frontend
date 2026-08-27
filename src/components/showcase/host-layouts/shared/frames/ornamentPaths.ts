/**
 * Every drawn ornament in the host frame set, as path data on a normalised
 * viewBox. Kept out of the components for two reasons: the laurel sprig is used
 * by both the title frame and the avatar frame at different scales and would
 * otherwise be duplicated, and path data is the part most likely to be tuned by
 * eye — having it in one file makes that a single edit rather than a hunt.
 *
 * All shapes are drawn as **strokes on a transparent fill**, sized for a 1-unit
 * stroke on their own viewBox and scaled by the caller. A filled ornament would
 * have to know the ground it sits on; a stroked one only needs a colour, which
 * is what lets the same drawing sit on a photo, on a pale card, or on the
 * template's own background without a second variant.
 */

/** Every motif shares this box, so the components can size them identically. */
export const ORNAMENT_VIEWBOX = '0 0 100 100'

/**
 * A woven heart rather than a solid one: two overlapping loops that cross at
 * the top and meet at the point, drawn as one open stroke. A filled heart reads
 * as an icon — a UI affordance the guest might try to tap — where a drawn one
 * reads as ornament, which is the job here.
 */
export const HEART_PATH =
  'M50 84 C50 84 16 61 16 39 C16 26 26 18 36 18 C43 18 48 22 50 27 ' +
  'C52 22 57 18 64 18 C74 18 84 26 84 39 C84 61 50 84 50 84 Z'

/** The inner echo that makes the heart read as woven rather than as an outline. */
export const HEART_INNER_PATH =
  'M50 72 C50 72 27 56 27 40 C27 32 33 27 39 27 C44 27 48 30 50 34 ' +
  'C52 30 56 27 61 27 C67 27 73 32 73 40 C73 56 50 72 50 72 Z'

/**
 * Two rings, overlapping at the centre. Drawn as two full circles rather than
 * as an interlock with cut segments: at the size this renders (~28px) the
 * over/under weave is a couple of pixels and reads as a drawing error, while
 * two clean rings read as exactly what they are.
 */
export const RINGS_CIRCLES = [
  { cx: 38, cy: 50, r: 21 },
  { cx: 62, cy: 50, r: 21 },
] as const

/**
 * An endless knot as one continuous stroke that crosses itself twice — the
 * figure-eight laid on its side, pinched at the centre. One path, so the line
 * never shows a join.
 */
export const KNOT_PATH =
  'M50 50 C40 34 20 34 20 50 C20 66 40 66 50 50 C60 34 80 34 80 50 ' +
  'C80 66 60 66 50 50 Z'

/**
 * A lotus in profile: a centre petal flanked by two pairs that fan outward, all
 * meeting at a single base point. Drawn open at the top so the petals read as
 * separate rather than as one blob.
 */
export const BLOOM_PATHS = [
  // Centre petal
  'M50 82 C44 66 44 44 50 30 C56 44 56 66 50 82 Z',
  // Inner pair
  'M50 82 C36 72 26 54 26 40 C38 44 48 62 50 82 Z',
  'M50 82 C64 72 74 54 74 40 C62 44 52 62 50 82 Z',
  // Outer pair, shallower so the fan opens
  'M50 82 C32 80 16 68 12 56 C26 55 42 66 50 82 Z',
  'M50 82 C68 80 84 68 88 56 C74 55 58 66 50 82 Z',
] as const

/**
 * One laurel sprig, drawn pointing up-right from its base at (2, 46) on a
 * 48x48 box: a stem with five leaf pairs shrinking toward the tip.
 *
 * Authored once and mirrored/rotated by the caller — a sprig that is drawn
 * twice, once per direction, drifts the moment either copy is tuned.
 */
export const LAUREL_VIEWBOX = '0 0 48 48'
export const LAUREL_STEM = 'M3 45 C14 40 26 30 36 14'
/**
 * [cx, cy, rx, ry, rotation] — an ellipse per leaf, alternating either side of
 * the stem and shrinking along it.
 *
 * Deliberately small and many rather than few and fat. At the size this renders
 * — a ~90px avatar, so each leaf is 6–8px — anything rounder merges with its
 * neighbours into a single mass that reads as a wing, not as laurel. The leaf
 * has to stay clearly longer than it is wide for the eye to resolve it at all.
 */
export const LAUREL_LEAVES = [
  [8, 41, 4.6, 1.9, -30],
  [12, 34, 4.4, 1.8, -48],
  [16, 37, 4.2, 1.7, -12],
  [19, 30, 4, 1.65, -52],
  [23, 32, 3.8, 1.6, -16],
  [25, 25, 3.6, 1.5, -56],
  [29, 27, 3.4, 1.45, -20],
  [31, 20, 3.1, 1.35, -60],
  [34, 22, 2.9, 1.3, -24],
] as const
