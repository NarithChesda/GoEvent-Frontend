import { describe, expect, it } from 'vitest'
import type { PublicEventTemplate } from '@/services/api'
import { pickLandingDesigns } from './landingDesigns'

const template = (overrides: Partial<PublicEventTemplate>): PublicEventTemplate => ({
  id: 1,
  name: 'AM002',
  template_type: 'system',
  status: 'approved',
  package_plan: 1,
  preview_image: 'https://api.goevent.online/media/event_templates/previews/a.webp',
  showcase_template_version: 'v1',
  ...overrides,
})

describe('pickLandingDesigns', () => {
  it('keeps approved V1 templates with a preview, in catalogue order', () => {
    const picked = pickLandingDesigns([
      template({ id: 3, preview_image: 'c.webp' }),
      template({ id: 1, preview_image: 'a.webp' }),
    ])
    expect(picked).toEqual([
      { id: 3, src: 'c.webp' },
      { id: 1, src: 'a.webp' },
    ])
  })

  it('leaves out what the V1 catalogue would not show', () => {
    const picked = pickLandingDesigns([
      template({ id: 1, status: 'pending', preview_image: 'pending.webp' }),
      template({ id: 2, showcase_template_version: 'v2', preview_image: 'v2.webp' }),
      template({ id: 3, preview_image: null }),
      template({ id: 4, preview_image: '' }),
      template({ id: 5, preview_image: 'kept.webp' }),
    ])
    expect(picked.map((design) => design.id)).toEqual([5])
  })

  it('treats a missing version as V1', () => {
    const picked = pickLandingDesigns([template({ showcase_template_version: null })])
    expect(picked).toHaveLength(1)
  })

  it('never draws the same artwork twice', () => {
    const picked = pickLandingDesigns([
      template({ id: 1, preview_image: 'same.webp' }),
      template({ id: 2, preview_image: 'same.webp' }),
    ])
    expect(picked.map((design) => design.id)).toEqual([1])
  })

  it('stops at the limit', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      template({ id: i, preview_image: `${i}.webp` }),
    )
    expect(pickLandingDesigns(many, 5)).toHaveLength(5)
  })
})
