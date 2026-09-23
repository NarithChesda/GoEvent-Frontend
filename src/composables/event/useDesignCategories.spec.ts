import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * "Which categories have designs" decides where a brand-new event lands: on the
 * template browser, or straight on its Showcase tab. A studio category is not
 * the same thing — Housewarming has a studio and, in production today, no
 * approved design — so the answer is a join over the public catalogue.
 */
vi.mock('@/services/api', () => ({
  eventTemplateService: { listPublicTemplates: vi.fn() },
  packagePlanService: { listPlans: vi.fn() },
}))

import { eventTemplateService, packagePlanService } from '@/services/api'
import {
  categoryHasDesigns,
  loadDesignCounts,
  resetDesignCountsCache,
} from './useDesignCategories'

const WEDDING = { id: 1, name: 'Wedding' }
const BIRTHDAY = { id: 8, name: 'Birthday' }
const HOUSEWARMING = { id: 20, name: 'Housewarming Party' }
const MUSIC = { id: 9, name: 'Music' }

const plans = {
  success: true,
  data: {
    count: 3,
    next: null,
    previous: null,
    results: [
      { id: 1, name: 'Basic Plus', category: { id: 1, name: 'Wedding' } },
      { id: 4, name: 'Basic Plus Birthday', category: { id: 8, name: 'Birthday' } },
      { id: 9, name: 'Housewarming', category: { id: 20, name: 'Housewarming Party' } },
    ],
  },
}

const template = (id: number, plan: number | null, status = 'approved') => ({
  id,
  name: `T${id}`,
  template_type: 'system',
  status,
  package_plan: plan,
  preview_image: null,
})

const page = (results: unknown[], count: number, next: string | null) => ({
  success: true,
  data: { count, next, previous: null, results },
})

beforeEach(() => {
  resetDesignCountsCache()
  vi.mocked(packagePlanService.listPlans).mockReset().mockResolvedValue(plans as never)
  vi.mocked(eventTemplateService.listPublicTemplates).mockReset()
})

describe('loadDesignCounts', () => {
  it('counts approved designs per category across every page', async () => {
    vi.mocked(eventTemplateService.listPublicTemplates).mockImplementation(async (params) => {
      const n = params?.page ?? 1
      if (n === 1) return page([template(1, 1), template(2, 1)], 5, '?page=2') as never
      if (n === 2) return page([template(3, 4), template(4, 1)], 5, '?page=3') as never
      return page([template(5, 1)], 5, null) as never
    })

    const counts = await loadDesignCounts()
    expect(counts?.get(WEDDING.id)).toBe(4)
    expect(counts?.get(BIRTHDAY.id)).toBe(1)
    expect(eventTemplateService.listPublicTemplates).toHaveBeenCalledTimes(3)
  })

  it('ignores designs that are not approved, or have no plan', async () => {
    vi.mocked(eventTemplateService.listPublicTemplates).mockResolvedValue(
      page(
        [template(1, 9, 'pending_review'), template(2, 9, 'rejected'), template(3, null)],
        3,
        null,
      ) as never,
    )

    const counts = await loadDesignCounts()
    expect(counts?.has(HOUSEWARMING.id)).toBe(false)
  })

  it('fetches once and shares the answer', async () => {
    vi.mocked(eventTemplateService.listPublicTemplates).mockResolvedValue(
      page([template(1, 1)], 1, null) as never,
    )
    await Promise.all([loadDesignCounts(), loadDesignCounts()])
    await loadDesignCounts()
    expect(eventTemplateService.listPublicTemplates).toHaveBeenCalledTimes(1)
  })

  it('does not cache a failure, so the next open retries', async () => {
    vi.mocked(eventTemplateService.listPublicTemplates)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(page([template(1, 1)], 1, null) as never)

    expect(await loadDesignCounts()).toBeNull()
    expect((await loadDesignCounts())?.get(WEDDING.id)).toBe(1)
  })
})

describe('categoryHasDesigns', () => {
  it('trusts the catalogue over the studio list', () => {
    const counts = new Map([[WEDDING.id, 41]])
    expect(categoryHasDesigns(WEDDING, counts)).toBe(true)
    // Has a studio, has no design: no browser opened over an empty shelf.
    expect(categoryHasDesigns(HOUSEWARMING, counts)).toBe(false)
  })

  it('works from the id alone, which is all a resumed draft may have', () => {
    expect(categoryHasDesigns({ id: WEDDING.id }, new Map([[WEDDING.id, 3]]))).toBe(true)
  })

  it('falls back to "has a studio" when the catalogue could not be read', () => {
    expect(categoryHasDesigns(BIRTHDAY, null)).toBe(true)
    expect(categoryHasDesigns(MUSIC, null)).toBe(false)
    expect(categoryHasDesigns({ id: WEDDING.id }, null)).toBe(false)
  })

  it('is false with no category at all', () => {
    expect(categoryHasDesigns(null, new Map([[WEDDING.id, 3]]))).toBe(false)
  })
})
