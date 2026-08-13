/**
 * useEventTheme.ts
 *
 * The public event drawer's per-category atmosphere, as CSS custom properties.
 *
 * The drawer used to carry three unrelated colour languages at once: a hero
 * scrim hardcoded to near-black purple, info tiles tinted with the category
 * accent, and a registration card painted in its own fixed emerald. A wedding
 * and a memorial arrived looking identical apart from one 12px tick.
 *
 * The fix is not a new palette — `resolveCoverTheme` in
 * utils/eventCoverPlaceholder.ts already holds one theme per canonical category
 * (accent, three gradient stops, a mark, and a `quiet` flag), and the generated
 * cover art is already drawn from it. This composable simply exposes that same
 * record as a token bag, so every surface in the drawer resolves its colour from
 * the one map the artwork uses and none of them can disagree.
 *
 * Tokens are bound once on the drawer's panel root and inherited, which is what
 * lets child components drop their `accent` props and their repeated inline
 * `withAlpha(...)` styles.
 *
 * @module composables/event/useEventTheme
 */

import { computed, type ComputedRef, type Ref } from 'vue'
import type { Event } from '@/services/api'
import {
  categoryMotifDataUri,
  categoryTheme,
  type CategoryTheme,
} from '@/utils/eventCoverPlaceholder'
import { getEventCategory, withAlpha } from '@/composables/useEventFormatters'

/**
 * Alpha suffixes for the tinted surfaces, as two-digit hex.
 *
 * Held together here rather than spelled at each call site so the whole panel's
 * tint weight can be tuned in one place — a category accent as dark as
 * `#1e1b4b` and one as light as `#94a3b8` both have to stay legible under the
 * same token.
 */
const ALPHA = {
  /** Tile and chip fills. */
  tint: '0F',
  /** Hover and active fills. */
  tintStrong: '1F',
  /** Card borders and hairlines. */
  ring: '33',
  /** The barely-there ground under the quick-facts card. */
  wash: '08',
  /** Hero scrim, bottom stop. */
  scrimDeep: 'E0',
  /** Hero scrim, mid stop. */
  scrimMid: '5C',
} as const

export interface EventTheme {
  /** The resolved category record — accent, gradient stops, mark, quiet flag. */
  theme: ComputedRef<CategoryTheme>
  /** The category's identity colour. Kept for props that still take a hex. */
  accent: ComputedRef<string>
  /**
   * True for categories where a festive treatment would be tasteless —
   * funerals and memorials. Callers drop pulses, motifs and the brand-gradient
   * CTA (falling back to the design system's dark-solid variant) when set.
   */
  isQuiet: ComputedRef<boolean>
  /** The category's mark as a data URI, for the hero watermark. */
  motif: ComputedRef<string>
  /** Bind on the panel root with `:style`; every token below inherits from it. */
  themeVars: ComputedRef<Record<string, string>>
}

/**
 * Resolve an event's drawer theme.
 *
 * @param event - The loaded event, or null while it is still in flight. Falls
 *   back to the neutral brand theme so the drawer's chrome never flashes
 *   uncoloured between the skeleton and the content.
 */
export function useEventTheme(event: Ref<Event | null>): EventTheme {
  const theme = computed(() =>
    categoryTheme(event.value ? getEventCategory(event.value) : null)
  )

  const accent = computed(() => theme.value.accent)

  const isQuiet = computed(() => Boolean(theme.value.quiet))

  const motif = computed(() =>
    categoryMotifDataUri(event.value ? getEventCategory(event.value) : null)
  )

  const themeVars = computed(() => {
    const t = theme.value

    return {
      '--evt-accent': t.accent,
      '--evt-deep': t.to,
      '--evt-mid': t.via,
      '--evt-tint': withAlpha(t.accent, ALPHA.tint),
      '--evt-tint-strong': withAlpha(t.accent, ALPHA.tintStrong),
      '--evt-ring': withAlpha(t.accent, ALPHA.ring),
      '--evt-wash': withAlpha(t.accent, ALPHA.wash),
      // Built here rather than in the hero's stylesheet so the two scrim stops
      // stay adjacent to the tokens they are derived from.
      '--evt-scrim': `linear-gradient(to top, ${withAlpha(t.to, ALPHA.scrimDeep)} 0%, ${withAlpha(
        t.via,
        ALPHA.scrimMid
      )} 46%, transparent 100%)`,
    }
  })

  return { theme, accent, isQuiet, motif, themeVars }
}
