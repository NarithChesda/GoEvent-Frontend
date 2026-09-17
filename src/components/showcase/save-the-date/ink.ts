/**
 * The classes a design's copy is drawn with.
 *
 * Normally the host stage's ink: flat colour plus halo on the decoration
 * stage's pale band, a metal gradient on the door's dark scrim. When the
 * template struck its primary slot in a metallic finish, that finish REPLACES
 * the ink rather than layering over it — `std-solid`'s halo is a text-shadow,
 * which paints over a clipped fill instead of under it, and `std-metal` is a
 * second gradient that would only sit hidden beneath the first. The finish
 * brings its own edge (a drop-shadow filter), so the copy keeps its separation
 * from the ground.
 *
 * Why the primary slot, on a block whose typography is the design's own rather
 * than the template's: this is the stage's headline, and primary is the
 * headline slot everywhere else. A template gilding its headings expects the
 * one heading between the cover and the invitation to match them.
 */
export function stdInkClass(ink: 'solid' | 'metal', finish: readonly string[]): string[] {
  if (finish.length) return [...finish]
  return [ink === 'metal' ? 'std-metal' : 'std-solid']
}
