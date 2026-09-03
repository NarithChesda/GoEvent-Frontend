import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * What the public catalogue's frame is allowed to take from the real invitation
 * it is drawn through.
 *
 * The page previews a design through somebody else's published event, which is
 * the point — a design has to be judged on real content. But three of that
 * event's fields describe the ORGANIZER rather than the design, and every one
 * of them displaces something the partner uploaded precisely to be seen here.
 * The event video is the sharpest case: `eventVideoUrl` resolves
 * `event.event_video` first and the template's `standard_transition_video` only
 * as a fallback, so a preview event that happened to carry a film played that
 * couple's wedding video in the one frame whose entire job is showing the
 * template's own transition.
 */
vi.mock('@/services/api', () => ({
  eventsService: { getEventShowcase: vi.fn() },
}))

// Inlined rather than referencing a const: vi.mock factories are hoisted above
// every top-level binding in the file.
vi.mock('./useDemoShowcase', () => ({
  loadDemoShowcase: vi.fn().mockResolvedValue({
    event: {
      id: 'demo',
      title: 'Sample',
      event_video: null,
      logo_one: null,
      logo_two: null,
      payment_methods: [{ id: 1 }],
      dress_codes: [{ id: 1 }],
    },
  }),
  demoPreviewPartner: () => ({ referrer: 999, referrer_details: { name: 'Your Shop' } }),
}))

import { eventsService } from '@/services/api'
import { loadTemplatePreviewShowcase } from './useTemplatePreviewShowcase'

/** A real published event flagged as a preview, carrying all of its own media. */
const realEvent = {
  id: 'evt-real',
  title: 'Sokha & Dara',
  event_video: 'https://cdn/their-own-wedding-film.mp4',
  logo_one: 'https://cdn/their-monogram.png',
  logo_two: 'https://cdn/their-monogram-2.png',
  referrer: 42,
  referrer_details: { name: 'A Competing Shop' },
  payment_methods: [{ id: 7 }],
  dress_codes: [{ id: 9 }],
}

const mockShowcase = (event: Record<string, unknown>) => {
  vi.mocked(eventsService.getEventShowcase).mockResolvedValue({
    success: true,
    data: { event },
  } as never)
}

describe('template preview substitutions', () => {
  beforeEach(() => vi.clearAllMocks())

  it("drops the event's own film so the template's transition shows instead", async () => {
    mockShowcase(realEvent)

    const data = await loadTemplatePreviewShowcase('evt-real', 'en')

    // Falsy, so eventVideoUrl falls through to standard_transition_video.
    expect(data.event.event_video).toBeFalsy()
  })

  it("drops the event's own logos so the design's sample logo shows instead", async () => {
    mockShowcase(realEvent)

    const data = await loadTemplatePreviewShowcase('evt-real', 'en')

    expect(data.event.logo_one).toBeFalsy()
    expect(data.event.logo_two).toBeFalsy()
  })

  it('stamps the placeholder shop over the real one', async () => {
    mockShowcase(realEvent)

    const data = await loadTemplatePreviewShowcase('evt-real', 'en')

    expect(data.event.referrer).toBe(999)
  })

  it('keeps everything that is actually the invitation', async () => {
    mockShowcase(realEvent)

    const data = await loadTemplatePreviewShowcase('evt-real', 'en')

    expect(data.event.title).toBe('Sokha & Dara')
    // The event has its own, so the sample's must not displace them.
    expect((data.event as unknown as { payment_methods: unknown[] }).payment_methods).toEqual([
      { id: 7 },
    ])
    expect((data.event as unknown as { dress_codes: unknown[] }).dress_codes).toEqual([{ id: 9 }])
  })

  it('applies the same substitutions to the bundled sample', async () => {
    const data = await loadTemplatePreviewShowcase(null, 'en')

    expect(data.event.event_video).toBeFalsy()
    expect(data.event.referrer).toBe(999)
  })
})
