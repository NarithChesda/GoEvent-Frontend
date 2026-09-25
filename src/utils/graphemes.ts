/**
 * How many marks a reader sees in `text` — one per grapheme cluster, so a
 * Khmer consonant with its subscript and vowel counts once, not three or four
 * times. For sizing type by length.
 *
 * `Intl.Segmenter` is reached through a cast because this project's TypeScript
 * lib predates it. Where the browser lacks it (Firefox before 125) this falls
 * back to code units, which only over-counts Khmer — so anything sized by it
 * errs smaller, never clipped.
 */
type GraphemeSegmenter = new (
  locale: undefined,
  options: { granularity: 'grapheme' },
) => { segment(input: string): Iterable<unknown> }

const Segmenter =
  typeof Intl !== 'undefined'
    ? (Intl as unknown as { Segmenter?: GraphemeSegmenter }).Segmenter
    : undefined

export function countGraphemes(text: string): number {
  return Segmenter
    ? [...new Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].length
    : text.length
}
