/**
 * The partner offer's figures — the only prices `/partners` prints.
 *
 * The page names three things a prospect can weigh before applying: the two
 * events they get free, what those are worth, and the pay-as-you-go discount
 * after them. Pack rates are NOT here and never go on that page: they live on
 * `/credits`, behind `is_partner`, because they are bespoke per pack and the
 * margin they imply is the partner's business.
 *
 * `eventRetail` is the retail price of Basic Plus Wedding — plan 1 in
 * [pricingFallback.ts](src/constants/pricingFallback.ts), the most one free event
 * is worth. It is restated rather than imported so the partner page's chunk
 * does not carry every plan's feature list; `partnerOffer.spec.ts` fails the
 * moment the two disagree. When staff reprice that plan, update both.
 *
 * Read the strings through `partnerOfferFigures()` and interpolate them into
 * the copy (`{worth}`, `{retail}`, `{partnerPrice}`) — both the view and the
 * prerendered body do, so neither can print a stale number the other has not.
 */
export const PARTNER_OFFER = {
  freeEvents: 2,
  eventRetail: 85,
  payAsYouGoDiscount: 0.5,
} as const

/** `$85`, `$42.50` — whole dollars without cents, anything else to the cent. */
export const usd = (amount: number) =>
  Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`

export const partnerOfferFigures = () => {
  const { freeEvents, eventRetail, payAsYouGoDiscount } = PARTNER_OFFER
  return {
    worth: usd(freeEvents * eventRetail),
    retail: usd(eventRetail),
    partnerPrice: usd(eventRetail * (1 - payAsYouGoDiscount)),
  }
}
