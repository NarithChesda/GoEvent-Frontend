/**
 * The pricing tiers shown on the public partner page (`/partners`).
 *
 * Two fixed cards, then whatever the backend says belongs here.
 *
 * ---------------------------------------------------------------------------
 * The rule
 * ---------------------------------------------------------------------------
 * The rail always opens with the two ways in that cost nothing up front — the
 * free trial and pay-as-you-go — and those two are always authored copy. Every
 * card after them is a credit pack the backend has flagged `is_featured`; the
 * page publishes no wholesale ladder of its own any more. So a catalogue with
 * nothing featured — or one this visitor cannot read — renders exactly the two
 * lead cards, which is a complete offer rather than a degraded one.
 *
 * Which packs those are is the catalogue's call, not this file's. It used to be
 * a `/basic/i` test against the plan name, which silently emptied the section
 * whenever a plan was renamed in the admin; staff now decide with `is_public`,
 * order with `display_order`, and pick the highlight with `is_featured`. All
 * three are read here and none is second-guessed.
 *
 * ---------------------------------------------------------------------------
 * Why the lead cards are not read from the catalogue
 * ---------------------------------------------------------------------------
 * - **Pay-as-you-go is not a pack.** It is the `partner_rate` funding option
 *   (see `ActivationOptions`), priced as a percentage of the plan rather than
 *   as a catalogue row, so it has nothing to read here.
 * - **The trial is a pack**, and its real numbers are used when the catalogue
 *   carries a featured free one — but its copy ("Nothing", "Free") is authored
 *   either way, and it falls back to authored figures when there is none.
 * - **The badges.** The catalogue has no notion of a recommendation, so which
 *   pack is "most shops start here" is applied by position after sorting on
 *   `credit_count`, and survives packs being added, renamed or repriced.
 *
 * ---------------------------------------------------------------------------
 * The catalogue is public
 * ---------------------------------------------------------------------------
 * `GET /api/payment/credit-packs/` needs no token as of 2026-08-30, which is
 * what this page was always waiting for: its audience is prospects, and it can
 * finally quote them real numbers. So the fetch is a plain `onMounted` — there
 * is nothing to wait for and no `403` to branch on. It used to wait on
 * `isAuthenticated`, which meant live numbers for signed-in partners and
 * authored copy for everyone else, exactly backwards.
 *
 * A signed-in partner may see one or two packs a prospect never does
 * (`is_public: false` — a bespoke rate). Those are filtered out here on
 * purpose: this page is the public offer, and it should read the same to
 * whoever opens it. A partner's own rate belongs on `/credits`.
 */

import { ref, computed, onMounted, type ComputedRef, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { partnerCreditsService } from '@/services/api/modules/credits.service'
import type { CreditPack } from '@/services/api/types'

/** One card in the pricing rail, whatever it was built from. */
export interface PartnerPricingTier {
  key: string
  /** Tier name — "Pay as you go", "25 credits". */
  name: string
  /** The line under the name — "Pay per event", "25 invitations". */
  credits: string
  /**
   * What the credits may be spent on — "For Basic Plus". Empty renders nothing,
   * which is the authored tiers: pay-as-you-go is a rate rather than a pack,
   * and the trial is only scoped once it comes from a real one.
   *
   * This is what tells two same-sized packs apart. "25 Basic" and "25 Basic
   * Plus" are 25 credits at $700 each, so without their plan sets the two cards
   * are identical but for one word in the title, and a prospect reads that as a
   * bug rather than a choice.
   */
  plans: string
  /**
   * The uppercase line above the name. Editorial; never from the API, and
   * empty on any tier that has nothing to distinguish it — the card reserves
   * the line either way so the row stays on one baseline.
   */
  badge: string
  /**
   * The card's display figure: what the whole pack leaves the partner once it
   * is sold through. This is the number the page exists to show — a per-event
   * margin is the honest unit but "$33" does not read as a business, and
   * "$825–1,450" does. Per-event stays on the card, one type step down.
   *
   * Tiers with no fixed quantity (pay-as-you-go) carry their per-event margin
   * here instead; `profitCaption` is what says which is which.
   */
  profit: string
  /** What the figure above assumes — "selling all 25 at $60–85". */
  profitCaption: string
  /** What leaves the partner's pocket today. */
  upfront: string
  /** Wholesale cost of one invitation. */
  costEach: string
  /** retail − cost, per invitation, as a range because retail is one. */
  keepEach: string
  /** One sentence under the card. Empty renders nothing. */
  note: string
  featured: boolean
}

/**
 * The cards that always render, in the order they render.
 *
 * `partners.json` still carries a `tiers.shop` and `tiers.volume` block, but
 * only for their `badge` strings, which label live packs by position. Their
 * prices are gone: hand-copied wholesale figures that nothing kept in sync are
 * the problem `is_featured` exists to solve.
 */
const LEAD_KEYS = ['trial', 'payg'] as const

/** "675.00" → "$675", "27.50" → "$27.50", with thousands separators. */
function money(value: string | number): string {
  const n = typeof value === 'number' ? value : Number.parseFloat(value)
  if (!Number.isFinite(n)) return String(value)
  const fixed = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, '')
  const [whole, frac] = fixed.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `$${grouped}${frac ? '.' + frac : ''}`
}

/**
 * A span of money as one label. An en dash and no spaces around it, because
 * this string lands in a `text-5xl` figure inside a three-up card — "$30 – 42"
 * is wide enough there to wrap after the dash.
 */
function range(low: number, high: number): string {
  return low === high ? money(low) : `${money(low)}–${money(high).replace('$', '')}`
}

/**
 * How far below the plan price a partner is expected to discount when reselling.
 *
 * The plan price is the *ceiling* — what a customer pays GoEvent directly, and
 * therefore the most a partner can charge before the customer is better off
 * coming to us. The floor is a business convention rather than anything the API
 * knows: a partner who wants the work prices under the list. So an $85 plan is
 * shown as "$60–85", and the margin column becomes a range for the same reason.
 */
const RETAIL_DISCOUNT_FLOOR = 25

/** The highest plan price a pack's credits can be spent on. */
function planCeiling(pack: CreditPack): number | null {
  const fromDetails = (pack.applicable_plan_details ?? [])
    .map((p) => Number.parseFloat(p.price))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (fromDetails.length) return Math.max(...fromDetails)

  // Older serializers send only the shared figure.
  const fallback = Number.parseFloat(pack.pricing_plan_price ?? '')
  return Number.isFinite(fallback) && fallback > 0 ? fallback : null
}

/**
 * The plans a pack's credits cover, as one line.
 *
 * `pricing_plan_name` is the server's own deduped label, built for exactly this
 * — the four plans behind a pack that spans categories read as "Basic Plus,
 * Basic Birthday", not as "Basic Plus" three times. `applicable_plan_names` is
 * the fallback for a serializer that sends only the flat list, deduped here for
 * the same reason.
 *
 * The category is deliberately left off. The doc's warning that plan names are
 * ambiguous across categories is about the *buy* card, where a partner is
 * choosing what to spend; here the line only has to separate one card from its
 * neighbour, and a second facet doubles its length inside a 17.5rem card.
 */
function planLabel(pack: CreditPack): string {
  const flat = pack.pricing_plan_name?.trim()
  if (flat) return flat
  return [...new Set(pack.applicable_plan_names ?? [])].filter(Boolean).join(', ')
}

/**
 * What a partner can realistically charge for one event on this pack's plan,
 * as [floor, ceiling]. Anchored on the highest plan price rather than spanning
 * every plan the pack covers: a pack that also works on a cheaper category
 * would otherwise widen the range into something that reads as uncertainty
 * about our own pricing rather than as the partner's room to discount.
 */
function retailBand(pack: CreditPack): [number, number] | null {
  const ceiling = planCeiling(pack)
  if (ceiling === null) return null
  return [Math.max(0, ceiling - RETAIL_DISCOUNT_FLOOR), ceiling]
}

export function usePartnerPricingTiers(): {
  tiers: ComputedRef<PartnerPricingTier[]>
  isLive: ComputedRef<boolean>
  isLoading: Ref<boolean>
} {
  const { t } = useI18n()

  const packs = ref<CreditPack[]>([])
  const isLoading = ref(false)

  const authoredTiers = computed<PartnerPricingTier[]>(() =>
    LEAD_KEYS.map((key) => ({
      key,
      name: t(`partners.pricing.tiers.${key}.name`),
      credits: t(`partners.pricing.tiers.${key}.credits`),
      plans: '',
      badge: t(`partners.pricing.tiers.${key}.badge`),
      profit: t(`partners.pricing.tiers.${key}.profit`),
      profitCaption: t(`partners.pricing.tiers.${key}.profitCaption`),
      upfront: t(`partners.pricing.tiers.${key}.upfront`),
      costEach: t(`partners.pricing.tiers.${key}.costEach`),
      keepEach: t(`partners.pricing.tiers.${key}.keepEach`),
      note: t(`partners.pricing.tiers.${key}.note`),
      // The dark card is reserved for a recommendation, and neither way in is
      // one — they are the two things a shop owner can do before deciding.
      featured: false,
    })),
  )

  /**
   * The packs this page may quote.
   *
   * Two gates, both of them the backend's. `is_public` is staff's — a bespoke
   * rate is not the standard offer, and a signed-in partner is the only caller
   * who ever receives one. `retailBand` is arithmetic: a pack with no plan
   * attached has no retail price to measure a margin from, so every figure on
   * its card would be blank (that pack is also unorderable, so it is a mistake
   * in the admin rather than a case to render).
   */
  const listedPacks = computed<CreditPack[]>(() =>
    packs.value.filter((p) => p.is_public !== false && retailBand(p) !== null),
  )

  /**
   * The wholesale ladder, in the order staff put it in.
   *
   * `display_order` leads because that is what it is for, and the rest of the
   * comparator only breaks ties: today every pack in the real catalogue carries
   * `display_order: 0`, so without a tiebreak `Array.sort` would leave them in
   * whatever order the server happened to send and the badges would reshuffle
   * between loads. Size, then rate, then name makes the order *total* — and
   * when a pack is genuinely ordered, that leading term wins and nothing below
   * it is consulted.
   */
  const paidPacks = computed<CreditPack[]>(() => {
    const sorted = listedPacks.value
      .filter((p) => Number.parseFloat(p.price) > 0)
      .slice()
      .sort(
        (a, b) =>
          a.display_order - b.display_order ||
          a.credit_count - b.credit_count ||
          Number.parseFloat(a.price_per_credit) - Number.parseFloat(b.price_per_credit) ||
          a.name.localeCompare(b.name),
      )

    /**
     * Every pack, exactly as the catalogue lists it.
     *
     * Nothing is collapsed or capped here. Two packs of the same size are two
     * different packages — "25 Basic" covers Free Basic, Basic Plus and Basic
     * Birthday, "25 Basic Plus" covers Basic Plus alone — and which of those a
     * shop can sell is the whole decision. An earlier version kept one card per
     * size, which was a workaround for cards that did not name their plans;
     * they do now (`planLabel`), so the duplicate it was hiding was never a
     * duplicate.
     *
     * Staff already own what appears here, through `is_public` and
     * `display_order`. A second opinion in this file is exactly what this page
     * spent two rewrites removing.
     */
    return sorted
  })

  /** The giveaway, if the public catalogue carries one. */
  const freePack = computed<CreditPack | null>(
    () => listedPacks.value.find((p) => Number.parseFloat(p.price) === 0) ?? null,
  )

  const livePackTiers = computed<PartnerPricingTier[]>(() => {
    const list = paidPacks.value

    /**
     * The dark card, and the one that reads "most shops start here".
     *
     * Staff's call, via `is_featured`. Nothing stops them flagging several, so
     * the first flagged pack takes it and the rest render as ordinary cards —
     * four highlights is the same as none. No pack flagged means no dark card,
     * which is the honest result: the page is not recommending one.
     */
    const highlight = list.find((p) => p.is_featured) ?? null

    /**
     * "Lowest rate" is a fact rather than an editorial call, so it is measured
     * rather than assumed from position — `display_order` is staff's and need
     * not run cheapest-last. Meaningless with a single pack.
     */
    const cheapest =
      list.length > 1
        ? list.reduce((best, p) =>
            Number.parseFloat(p.price_per_credit) < Number.parseFloat(best.price_per_credit)
              ? p
              : best,
          )
        : null

    return list.map((pack) => {
      const [low, high] = retailBand(pack)!
      const perCredit = Number.parseFloat(pack.price_per_credit)
      const isHighlight = pack === highlight
      const isCheapest = !isHighlight && pack === cheapest

      const cost = Number.parseFloat(pack.price)

      return {
        key: pack.id,
        name: pack.name,
        credits: t('partners.pricing.invitationCount', { n: pack.credit_count }, pack.credit_count),
        plans: planLabel(pack),
        /**
         * At most one card claims each label, and most of a long ladder claims
         * none. One card can only carry one line, so the highlight wins where a
         * pack is both featured and the cheapest.
         */
        badge: isHighlight
          ? t('partners.pricing.tiers.shop.badge')
          : isCheapest
            ? t('partners.pricing.tiers.volume.badge')
            : '',
        // What the whole pack is worth once it is sold through, which is the
        // figure that makes the case. Floored at zero so a pack priced above
        // its own plan's retail shows "$0" rather than a negative headline.
        profit: range(
          Math.max(0, low * pack.credit_count - cost),
          Math.max(0, high * pack.credit_count - cost),
        ),
        profitCaption: t('partners.pricing.packProfitCaption', {
          n: pack.credit_count,
          retail: range(low, high),
        }),
        upfront: money(cost),
        costEach: money(perCredit),
        keepEach: range(Math.max(0, low - perCredit), Math.max(0, high - perCredit)),
        note: pack.description || '',
        featured: isHighlight,
      }
    })
  })

  /**
   * The trial, from the catalogue's own free pack. Its whole point is that the
   * partner keeps the entire retail price, so both the total and the per-event
   * margin are the retail band itself, undiscounted.
   */
  const liveTrialTier = computed<PartnerPricingTier | null>(() => {
    const pack = freePack.value
    if (!pack) return null
    const [low, high] = retailBand(pack)!

    return {
      key: pack.id,
      name: t('partners.pricing.tiers.trial.name'),
      credits: t('partners.pricing.eventCount', { n: pack.credit_count }, pack.credit_count),
      plans: planLabel(pack),
      badge: t('partners.pricing.tiers.trial.badge'),
      profit: range(low * pack.credit_count, high * pack.credit_count),
      profitCaption: t('partners.pricing.packProfitCaption', {
        n: pack.credit_count,
        retail: range(low, high),
      }),
      upfront: t('partners.pricing.tiers.trial.upfront'),
      costEach: t('partners.pricing.tiers.trial.costEach'),
      keepEach: range(low, high),
      note: pack.description || t('partners.pricing.tiers.trial.note'),
      featured: false,
    }
  })

  /** Whether any card after the two lead ones came from the catalogue. */
  const isLive = computed(() => livePackTiers.value.length > 0)

  /**
   * The ladder, in the order a shop owner climbs it: try it for nothing, then
   * pay per event with nothing committed, then buy in bulk.
   *
   * The two lead cards are unconditional — they are the offer, not a fallback,
   * so nothing here branches on whether the catalogue could be read. The trial
   * takes the catalogue's own free pack when there is a featured one, because
   * that gives it a real credit count and a computed margin instead of authored
   * ones; the card reads the same either way.
   */
  const tiers = computed<PartnerPricingTier[]>(() => {
    const authored = (key: string) => authoredTiers.value.find((tier) => tier.key === key)
    const lead = [liveTrialTier.value ?? authored('trial'), authored('payg')].filter(
      (tier): tier is PartnerPricingTier => Boolean(tier),
    )
    return [...lead, ...livePackTiers.value]
  })

  async function load() {
    isLoading.value = true
    try {
      const res = await partnerCreditsService.getPacks()
      if (res.success && res.data) {
        packs.value = Array.isArray(res.data) ? res.data : (res.data.results ?? [])
      }
    } catch {
      // Nothing to report: the two lead cards are a complete offer on their own,
      // so a failed catalogue read costs the page a ladder, not its meaning.
    } finally {
      isLoading.value = false
    }
  }

  /**
   * One request, on mount, for every visitor. The catalogue is public, so there
   * is no auth state to wait for — and a token, when the browser has one, is
   * attached by `apiClient` without this page asking, which is what widens the
   * response to a partner's own packs.
   */
  onMounted(load)

  return { tiers, isLive, isLoading }
}
