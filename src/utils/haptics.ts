/**
 * Haptic punctuation for touch gestures.
 *
 * Rule of three from Apple's *Designing Audio-Haptic Experiences*: causality
 * (fire on the causal event, not near it), harmony (same frame as the visual),
 * utility (only where it earns its place). So this is deliberately tiny and
 * has exactly three intensities — anything more would train people to ignore
 * all of it.
 *
 * `navigator.vibrate` is absent on iOS Safari and is a no-op in a page that has
 * never been interacted with; both are silent, which is correct — a haptic is
 * an accompaniment to a visual change, never the only feedback for one.
 */
type HapticKind = 'tick' | 'select' | 'commit'

const PATTERNS: Record<HapticKind, number | number[]> = {
  /** A boundary crossed, an item snapping home. */
  tick: 8,
  /** Entering a mode — the one moment worth a fuller pulse. */
  select: 18,
  /** A destructive or irreversible commit. */
  commit: [12, 40, 12],
}

export function haptic(kind: HapticKind = 'tick') {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  try {
    navigator.vibrate(PATTERNS[kind])
  } catch {
    /* Some browsers throw when the page has no user activation yet. */
  }
}
