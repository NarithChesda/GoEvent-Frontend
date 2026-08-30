/**
 * The pricing tiers shown on the public partner page (`/partners`).
 *
 * Two sources, one shape. The credit packs are the real catalogue and should
 * win whenever we can read them; the authored copy in `partners.json` is what
 * renders when we cannot, which is most of the time — see the gate below.
 *
 * ---------------------------------------------------------------------------
 * Why this is not simply "fetch the catalogue"
 * ---------------------------------------------------------------------------
 * `GET /api/payment/credit-packs/` answers **401 to an anonymous request** and
 * 403 to a signed-in non-partner (verified against the running backend on
 * 2026-08-30). The audience for `/partners` is precisely people who are neither
 * — so for the visitor this page exists for, there is no live data to fetch and
 * there cannot be until the backend exposes a public read. That ask is written
 * up in docs/backend-api-requirements/public-credit-pack-catalogue.md.
 *
 * So the fetch waits on `isAuthenticated` (see the watcher at the bottom, and
 * why it is a watcher rather than a check): an anonymous visitor makes no
 * request at all, sees no skeleton, and gets the authored copy immediately,
 * which is the correct and only possible result for them. A signed-in partner
 * gets the live catalogue. When the endpoint goes public, replace that watcher
 * with a bare `onMounted(load)` and every visitor gets live numbers.
 *
 * ---------------------------------------------------------------------------
 * What is NOT derived from the API
 * ---------------------------------------------------------------------------
 * - **The pay-as-you-go tier.** It is not a pack. It is the `partner_rate`
 *   funding option (see `ActivationOptions`), priced as a percentage of the
 *   plan rather than as a catalogue row, so it has nothing to read here and
 *   stays authored in both modes.
 * - **The badges.** The catalogue has no notion of a recommendation, so which
 *   pack is "most shops start here" is an editorial call. It is applied by
 *   position after sorting on `credit_count`, so it survives packs being added,
 *   renamed or repriced.
 */

import { ref, computed, watch, type ComputedRef, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
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
 * Which packs belong on this page. The page is Basic-only for now and the
 * catalogue carries every tier, so the packs have to be narrowed to the plan
 * the copy is talking about.
 *
 * Matching on the plan's *name* is the fragile part of this file — a plan
 * renamed in the admin silently empties the section (which falls back to the
 * authored copy, so it degrades quietly rather than breaking). It is the only
 * signal the serializer offers; a `tier` field on the plan would fix it
 * properly. Keep it as one constant so changing it is one line.
 */
const PLAN_PATTERN = /basic/i

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
  const { t, tm } = useI18n()
  const authStore = useAuthStore()

  const packs = ref<CreditPack[]>([])
  const isLoading = ref(false)

  /** The keys authored in `partners.json`, in the order they should render. */
  const authoredKeys = computed<string[]>(() => {
    const tiers = tm('partners.pricing.tiers') as Record<string, unknown>
    return tiers && typeof tiers === 'object' ? Object.keys(tiers) : []
  })

  const authoredTiers = computed<PartnerPricingTier[]>(() =>
    authoredKeys.value.map((key) => ({
      key,
      name: t(`partners.pricing.tiers.${key}.name`),
      credits: t(`partners.pricing.tiers.${key}.credits`),
      badge: t(`partners.pricing.tiers.${key}.badge`),
      profit: t(`partners.pricing.tiers.${key}.profit`),
      profitCaption: t(`partners.pricing.tiers.${key}.profitCaption`),
      upfront: t(`partners.pricing.tiers.${key}.upfront`),
      costEach: t(`partners.pricing.tiers.${key}.costEach`),
      keepEach: t(`partners.pricing.tiers.${key}.keepEach`),
      note: t(`partners.pricing.tiers.${key}.note`),
      featured: key === 'shop',
    })),
  )

  /** Packs on the plan this page is about, that we can price a margin against. */
  const onPlan = computed<CreditPack[]>(() =>
    packs.value.filter((p) => {
      const planNames = [p.pricing_plan_name, ...(p.applicable_plan_names ?? [])]
        .filter(Boolean)
        .join(' ')
      return PLAN_PATTERN.test(planNames) && retailBand(p) !== null
    }),
  )

  /**
   * The wholesale ladder, cheapest pack first.
   *
   * Sorted on credit count, then on rate and name so the order is *total*: the
   * real catalogue carries several packs at the same size (a "25 Basic" and a
   * "25 Basic Plus"), and `Array.sort` on a partial comparator leaves those in
   * whatever order the server happened to send, which reshuffles the badges and
   * the featured card between loads.
   */
  const paidPacks = computed<CreditPack[]>(() => {
    const sorted = onPlan.value
      .filter((p) => Number.parseFloat(p.price) > 0)
      .slice()
      .sort(
        (a, b) =>
          a.credit_count - b.credit_count ||
          Number.parseFloat(a.price_per_credit) - Number.parseFloat(b.price_per_credit) ||
          a.name.localeCompare(b.name),
      )

    /**
     * One card per pack *size*. The live catalogue carries several packs of the
     * same size on neighbouring plans — a "25 Basic" and a "25 Basic Plus", both
     * $28 an invitation — and rendering each as its own card puts two cards on
     * the page that differ only by a word in the title. A prospect reads that as
     * a mistake, not a choice. The sort above already puts the cheapest rate
     * first within a size, so first-wins keeps the better offer.
     */
    const bySize = new Map<number, CreditPack>()
    for (const pack of sorted) {
      if (!bySize.has(pack.credit_count)) bySize.set(pack.credit_count, pack)
    }

    /**
     * Every rung, however many there are. This used to keep only the entry pack
     * and the best rate, because the cards lived in a fixed grid that could not
     * hold more than four without orphaning one onto a second row. The rail has
     * no such ceiling, so capping the ladder now just hides packs the partner
     * could buy — and the whole reason the row scrolls is that the catalogue
     * decides its own length.
     */
    return [...bySize.values()]
  })

  /** The giveaway, if the catalogue carries one. */
  const freePack = computed<CreditPack | null>(
    () => onPlan.value.find((p) => Number.parseFloat(p.price) === 0) ?? null,
  )

  const livePackTiers = computed<PartnerPricingTier[]>(() => {
    const list = paidPacks.value
    return list.map((pack, i) => {
      const [low, high] = retailBand(pack)!
      const perCredit = Number.parseFloat(pack.price_per_credit)
      const isCheapest = list.length > 1 && i === list.length - 1

      const cost = Number.parseFloat(pack.price)

      return {
        key: pack.id,
        name: pack.name,
        credits: t('partners.pricing.invitationCount', { n: pack.credit_count }, pack.credit_count),
        /**
         * At most one card claims each label, and the middle of a long ladder
         * claims none. The old rule gave "most shops start here" to everything
         * that was not last, so a catalogue with three paid packs printed the
         * recommendation twice — on two cards that were not even styled alike.
         */
        badge: isCheapest
          ? t('partners.pricing.tiers.volume.badge')
          : i === 0
            ? t('partners.pricing.tiers.shop.badge')
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
        featured: i === 0,
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

  const isLive = computed(() => livePackTiers.value.length > 0)

  /**
   * The ladder, in the order a shop owner climbs it: try it for nothing, then
   * pay per event with nothing committed, then buy in bulk. The first two are
   * authored in both modes — pay-as-you-go is the `partner_rate` option rather
   * than a catalogue row, and the trial falls back to authored copy when the
   * catalogue has no free pack.
   */
  const tiers = computed<PartnerPricingTier[]>(() => {
    if (!isLive.value) return authoredTiers.value

    const authored = (key: string) => authoredTiers.value.find((tier) => tier.key === key)
    const lead = [liveTrialTier.value ?? authored('trial'), authored('payg')].filter(
      (tier): tier is PartnerPricingTier => Boolean(tier),
    )
    return [...lead, ...livePackTiers.value]
  })

  let hasLoaded = false

  async function load() {
    if (hasLoaded) return
    hasLoaded = true

    isLoading.value = true
    try {
      const res = await partnerCreditsService.getPacks()
      // A 403 here is "not a partner", not a failure — same as everywhere else
      // that touches this endpoint. Either way the authored copy is correct.
      if (res.success && res.data) {
        packs.value = Array.isArray(res.data) ? res.data : (res.data.results ?? [])
      }
    } catch {
      // Nothing to report: this page has a complete answer without the network.
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Wait for authentication rather than sampling it once on mount.
   *
   * `isAuthenticated` is `!!user && authService.isAuthenticated()`, and `user`
   * arrives from the profile request `App.vue` fires on mount — so at the
   * moment this composable's `onMounted` runs it is still false for a signed-in
   * partner who loaded or refreshed `/partners` directly. Reading it once there
   * meant the live catalogue was never fetched for the only people who can read
   * it; the page silently served authored copy to everyone.
   *
   * `immediate` covers the client-side navigation case, where auth has long
   * since settled, and `hasLoaded` is what makes it fire exactly once either
   * way. The watcher deliberately does NOT stop itself: with `immediate`, Vue
   * runs the callback synchronously *inside* the `watch()` call, so a
   * `const stop = watch(...)` that calls `stop()` from its own callback throws
   * `Cannot access 'stop' before initialization` for anyone already signed in
   * when the page mounts — which took the whole pricing section down. Vue
   * disposes the watcher with the component scope anyway, and re-entry is
   * already impossible.
   *
   * This gate is also the only thing to remove when the catalogue goes public:
   * replace the whole watcher with `onMounted(load)` and every visitor gets
   * live numbers.
   */
  watch(
    () => authStore.isAuthenticated,
    (authed) => authed && void load(),
    {
      immediate: true,
    },
  )

  return { tiers, isLive, isLoading }
}
