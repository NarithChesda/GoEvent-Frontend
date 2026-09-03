/**
 * The contract between DressCodeSection.vue (the shell) and a dress code
 * design.
 *
 * ## The organizing principle
 *
 * A dress code block carries three axes, and they are not the same kind of
 * thing:
 *
 *   time period   morning AND evening. Both apply to the guest reading it.
 *   gender        his AND hers. Both apply — to different people at one table.
 *   the codes     black tie OR midnight blue. Pick one, wear it.
 *
 * The first two are **conjunctive** and the third is **disjunctive**, and that
 * decides the whole layout: conjunctive axes are laid out, the disjunctive one
 * keeps a selector.
 *
 * The block this replaced navigated all three — a segmented tray for the time
 * period, a second row of pills for the gender, and a row of colour dots — so
 * three levels of chrome sat on top of what is usually two to four facts, and
 * two of those levels hid information the guest needed rather than offering a
 * choice they had to make. The section now renders one band per time period,
 * every gender inside it, and keeps a selector only where there is an actual
 * decision.
 *
 * ## What the split leaves each side
 *
 * The section owns the header, the period bands and their labels, the grouping,
 * every translated string and the selection state. A design receives **one
 * period's** gender groups and decides only how that is drawn.
 *
 * There is no event category here and no `eventTexts`: a design that could read
 * either would be the coupling this config exists to remove.
 */
export interface DressCodeDesignItem {
  id: number
  /** The organizer's own title, already fallen back to the translated type name. */
  title: string
  description: string
  /** The dress code's colour. Always a usable CSS colour — the shell defaults it. */
  color: string
  image: string | null
  /** The translated dress code type ("Black Tie"), for designs that show it. */
  typeLabel: string
  /** Raw type, for garment resolution only. Never rendered. */
  dressCodeType: string
}

export interface DressCodeGenderGroup {
  /** `all` | `male` | `female`, and whatever the backend adds later. */
  gender: string
  /** The translated gender name, resolved by the shell. */
  genderLabel: string
  codes: DressCodeDesignItem[]
  /** Which of `codes` is showing. Owned by the shell, resolved per group. */
  activeIndex: number
}

export interface DressCodeDesignProps {
  /** One time period's gender groups, in order. Every one of them is drawn. */
  groups: DressCodeGenderGroup[]
  primaryColor: string
  accentColor: string
  currentFont: string
  primaryFont?: string
  secondaryFont?: string
  currentLanguage?: string
  getMediaUrl: (url: string) => string
  /**
   * Choose a different code within one gender group — the only selection in the
   * section, because it is the only axis where the guest has a decision rather
   * than a fact to read.
   */
  selectCode: (gender: string, index: number) => void
}
