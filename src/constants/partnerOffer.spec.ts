import { describe, expect, it } from 'vitest'
import { FALLBACK_PRICING_PLANS } from './pricingFallback'
import { PARTNER_OFFER, partnerOfferFigures, usd } from './partnerOffer'

describe('partnerOffer', () => {
  it('prices a free event at Basic Plus Wedding retail', () => {
    // The public partner page promises a free event is worth "up to" this.
    // If staff reprice plan 1, this fails until partnerOffer.ts follows.
    const basicPlusWedding = FALLBACK_PRICING_PLANS.find((plan) => plan.id === 1)
    expect(Number(basicPlusWedding?.price)).toBe(PARTNER_OFFER.eventRetail)
  })

  it('prints the figures the page quotes', () => {
    expect(partnerOfferFigures()).toEqual({
      worth: '$170',
      retail: '$85',
      partnerPrice: '$42.50',
    })
  })

  it('drops cents only on whole dollars', () => {
    expect(usd(0)).toBe('$0')
    expect(usd(25)).toBe('$25')
    expect(usd(37.5)).toBe('$37.50')
  })
})
