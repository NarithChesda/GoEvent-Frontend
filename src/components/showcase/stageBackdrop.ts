/**
 * What sits behind the main content's text: `cover_stage_layout.contentBackdrop`,
 * drawn by MainContentStage.
 *
 * `card` is the legacy treatment: the liquid glass pane on the content card,
 * switched by `display_liquid_glass_background`. The card is 85% of the stage,
 * so the pane stops a margin short of every edge and the backdrop stays sharp
 * all round it. Text that fights its backdrop is only helped inside that box,
 * and the box itself is a visible object laid over the design.
 *
 * The other three treat the whole stage, so there is no box: the backdrop
 * behind the invitation is softened edge to edge, and the text column floats
 * on it. Each keeps the backdrop's colours, so the design still reads as itself.
 *
 *   - `blur` defocuses the backdrop and nothing else. That removes what makes a
 *     busy backdrop hard to read over (petals, filigree, a photograph's detail
 *     running through the glyphs), but not a clash of tone: gold on a gold
 *     backdrop is still gold on gold.
 *   - `frost` defocuses it and lifts it toward white.
 *   - `smoke` defocuses it and dims it toward black.
 *
 * Which way helps depends on which side of the ink the backdrop already sits,
 * and pushing the wrong way is worse than doing nothing: dimming a white
 * backdrop behind gold drags it *through* the gold's own lightness and the text
 * vanishes into grey. The first version chose the direction from the ink alone
 * and did exactly that to a gold-on-white template. The frame can't measure a
 * photographic or filmed backdrop, but the partner is looking at it, so the
 * direction is theirs: two named glasses rather than a guess.
 *
 * One `strength` (0–100) sets how far any of them goes. How much of the
 * backdrop a design can give up for legibility is a judgement about that design,
 * made against the live preview.
 *
 * No backend field: both keys ride in `cover_stage_layout`, which already
 * travels. Absent, null and unknown all mean `card`, which is what every
 * template drew before this, so nothing is backfilled.
 */
import type { ContentBackdropMode, CoverStageLayout } from '@/services/api/types/template.types'
import { resolveGlassTone } from './glassTone'

export const CONTENT_BACKDROP_MODES: readonly ContentBackdropMode[] = [
  'card',
  'blur',
  'frost',
  'smoke',
]

export const DEFAULT_CONTENT_BACKDROP_STRENGTH = 50

export interface ResolvedContentBackdrop {
  mode: ContentBackdropMode
  /** 0–100. */
  strength: number
}

const isMode = (value: unknown): value is ContentBackdropMode =>
  CONTENT_BACKDROP_MODES.includes(value as ContentBackdropMode)

/** A stored strength outside 0–100, or not a number at all, is pulled back in. */
export const clampBackdropStrength = (value: unknown): number => {
  const n =
    typeof value === 'number' && Number.isFinite(value) ? value : DEFAULT_CONTENT_BACKDROP_STRENGTH
  return Math.min(100, Math.max(0, Math.round(n)))
}

/** The only reading of the two keys: the showcase and the form both use it. */
export const resolveContentBackdrop = (
  layout: Pick<CoverStageLayout, 'contentBackdrop' | 'contentBackdropStrength'> | null | undefined,
): ResolvedContentBackdrop => ({
  mode: isMode(layout?.contentBackdrop) ? layout.contentBackdrop : 'card',
  strength: clampBackdropStrength(layout?.contentBackdropStrength),
})

export type ScreenBackdropMode = Exclude<ContentBackdropMode, 'card'>

/**
 * The numbers behind one strength.
 *
 * - Blur is capped at 24px. Past that the backdrop is a flat wash and the design
 *   no longer reads through, and every extra pixel of a full-stage blur is paid
 *   on every frame of a background video, which Safari feels first.
 * - The film runs from a fifth to seven tenths. Below a fifth it barely moves
 *   the ground; above seven tenths it is a sheet of white or black with the
 *   design as a stain on it.
 * - Saturation is raised a little under a film: white washes colour out and
 *   black muddies it, and the lift is what keeps the backdrop's hues
 *   recognisable through either.
 * - The ink edge (MainContentStage's `.stage-scroll--ink-edge`) goes on where
 *   the legacy clear glass puts it, for an ink white can't carry to 3:1, except
 *   under smoke, which is chosen precisely because it darkens the ground under
 *   such an ink.
 */
export interface StageBackdropLook {
  blurPx: number
  /** `null` for `blur`, which has no film. */
  film: { color: 'white' | 'black'; alpha: number } | null
  saturate: number
  inkEdge: boolean
}

export const stageBackdropLook = (
  mode: ScreenBackdropMode,
  strength: number,
  ink: string | null | undefined,
): StageBackdropLook => {
  const s = clampBackdropStrength(strength) / 100
  const lightInk = resolveGlassTone(ink) === 'clear'
  if (mode === 'blur') {
    return { blurPx: round1(4 + 20 * s), film: null, saturate: 1.05, inkEdge: lightInk }
  }
  const alpha = round2(0.2 + 0.5 * s)
  return mode === 'frost'
    ? {
        blurPx: round1(8 + 16 * s),
        film: { color: 'white', alpha },
        saturate: 1.15,
        inkEdge: lightInk,
      }
    : {
        blurPx: round1(8 + 16 * s),
        film: { color: 'black', alpha },
        saturate: 1.25,
        inkEdge: false,
      }
}

const rgba = (color: 'white' | 'black', alpha: number) =>
  color === 'white' ? `rgba(255, 255, 255, ${alpha})` : `rgba(10, 10, 14, ${alpha})`

/**
 * The look as the CSS custom properties `.stage-backdrop` reads.
 * `--sb-film-fallback` is for engines with no backdrop filter, where a film is
 * the only thing left to separate text from design: 0.3 stronger, and `blur`
 * gets a light one of its own.
 */
export const stageBackdropVars = (look: StageBackdropLook): Record<string, string> => {
  const film = look.film ?? { color: 'white' as const, alpha: 0 }
  return {
    '--sb-blur': `${look.blurPx}px`,
    '--sb-saturate': String(look.saturate),
    '--sb-film': rgba(film.color, film.alpha),
    '--sb-film-fallback': rgba(film.color, round2(Math.min(0.85, film.alpha + 0.3))),
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10
const round2 = (n: number) => Math.round(n * 100) / 100
