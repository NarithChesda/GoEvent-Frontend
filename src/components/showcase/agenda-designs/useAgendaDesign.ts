import { computed } from 'vue'
import type { AgendaDesignItem, AgendaDesignProps } from './types'

/**
 * Uploaded activity SVGs carry their own fills, so they are recoloured here.
 *
 * The colour is a parameter rather than the ink, because a design that fills its
 * roundel needs the glyph in the roundel's contrast colour instead — `stack` is
 * the one that does. Belt and braces with `.agd-icon svg` in agenda-base.css:
 * inline, because a colour declared in the markup beats a rule that cannot
 * reach `v-html` content; in CSS, because an SVG can encode a fill in a form
 * this pass doesn't cover (a `<style>` block, a `class`, a gradient stop).
 */
export function recolorAgendaIcon(item: AgendaDesignItem, color: string): string {
  const svg = item.icon?.svg_code
  if (!svg || !color) return svg || ''

  let processed = svg
    .replace(/fill="[^"]*"/g, `fill="${color}"`)
    .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
    .replace(/fill:'[^']*'/g, `fill:'${color}'`)
    .replace(/stroke:'[^']*'/g, `stroke:'${color}'`)
    .replace(/fill:#[0-9a-fA-F]{6}/g, `fill:${color}`)
    .replace(/stroke:#[0-9a-fA-F]{6}/g, `stroke:${color}`)
    .replace(/fill:#[0-9a-fA-F]{3}/g, `fill:${color}`)
    .replace(/stroke:#[0-9a-fA-F]{3}/g, `stroke:${color}`)

  if (!processed.includes('fill=') && processed.includes('<svg')) {
    processed = processed.replace('<svg', `<svg fill="${color}"`)
  }

  return processed
}

export function agendaTimeText(item: AgendaDesignItem): string | null {
  const { start_time_text: start, end_time_text: end } = item
  if (start && end) return `${start} - ${end}`
  if (start) return start
  if (end) return `Until ${end}`
  return null
}

/** Khmer Unicode range U+1780–U+17FF. Drives the title's own leading. */
export function isKhmerTitle(item: AgendaDesignItem): boolean {
  return /[ក-៿]/.test(item.title || '')
}

/**
 * The four derivations every agenda design repeats, resolved once so five
 * designs can't drift into five answers: which face the title sets in, which
 * the time does, how far apart the items enter, and the per-item helpers above.
 *
 * The stagger is the only judgement call here. 70ms between items on a tab
 * switch is enough to read as a cascade without making the last item of a
 * twelve-activity day wait a second; the first reveal doubles it, because the
 * section's header and day tabs have just animated and the list arriving in
 * lockstep behind them reads as one block dropping in rather than a schedule
 * unrolling. Both are capped — see `stagger`.
 */
export function useAgendaDesign(props: AgendaDesignProps) {
  const displayFont = computed(() => props.primaryFont || props.currentFont)
  const bodyFont = computed(() => props.secondaryFont || props.currentFont)

  /**
   * Seconds between consecutive items. Capped so a long schedule doesn't turn
   * its tail into a wait: past ~9 items the cascade is already legible and the
   * only thing more delay buys is a guest watching an empty column.
   */
  const stagger = computed(() => {
    const base = props.isInitialReveal ? 0.15 : 0.07
    const count = Math.max(1, props.items.length)
    return Math.min(base, 1.2 / count)
  })

  return {
    displayFont,
    bodyFont,
    stagger,
    iconSvg: (item: AgendaDesignItem) => recolorAgendaIcon(item, props.primaryColor),
    timeText: agendaTimeText,
    isKhmer: isKhmerTitle,
  }
}
