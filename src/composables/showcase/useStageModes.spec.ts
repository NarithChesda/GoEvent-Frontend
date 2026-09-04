import { describe, it, expect } from 'vitest'
import { resolveStageModes, resolveStageModesForEvent } from './useStageModes'

/**
 * The fallback half of this table is the contract that matters most: every
 * template published before `stage_modes` existed carries none, so the
 * inference below is what keeps them rendering as they always have. The
 * failures are quiet in both directions — a wrong `transition` silently drops a
 * stage the guest was meant to see, a wrong `background` paints white over a
 * design that expected its own colour to show through.
 */
describe('resolveStageModes — templates that declare nothing', () => {
  it('reads a cover film as a template built around film, throughout', () => {
    expect(resolveStageModes({ assets: { standard_cover_video: '/media/cover.mp4' } })).toEqual({
      cover: 'video',
      transition: 'video',
      background: 'video',
    })
  })

  it('reads no videos at all as a template built from artwork, throughout', () => {
    expect(resolveStageModes({ assets: {} })).toEqual({
      cover: 'animation',
      transition: 'animation',
      background: 'animation',
    })
  })

  it('takes a background film as the backdrop even under an animated cover', () => {
    expect(
      resolveStageModes({ assets: { standard_background_video: '/media/bg.mp4' } }),
    ).toEqual({ cover: 'animation', transition: 'animation', background: 'video' })
  })
})

describe('resolveStageModes — templates that declare their stages', () => {
  it('lets an animated cover hand over to a film', () => {
    expect(resolveStageModes({ stageModes: { transition: 'video' }, assets: {} })).toEqual({
      cover: 'animation',
      transition: 'video',
      background: 'animation',
    })
  })

  it('lets a filmed cover keep an artwork backdrop', () => {
    expect(
      resolveStageModes({
        stageModes: { background: 'animation' },
        assets: { standard_cover_video: '/media/cover.mp4' },
      }),
    ).toEqual({ cover: 'video', transition: 'video', background: 'animation' })
  })

  it('lets a filmed cover run the Save the Date beat', () => {
    expect(
      resolveStageModes({
        stageModes: { transition: 'animation' },
        assets: { standard_cover_video: '/media/cover.mp4' },
      }).transition,
    ).toBe('animation')
  })

  it('infers the undeclared stages from the declared cover, not the leftover files', () => {
    // No cover film uploaded yet, but the template says it is a filmed cover:
    // the middle beat and the backdrop follow the declaration.
    expect(resolveStageModes({ stageModes: { cover: 'video' }, assets: {} })).toEqual({
      cover: 'video',
      transition: 'video',
      background: 'video',
    })
  })
})

describe('resolveStageModes — a template with no middle beat', () => {
  it('keeps none as declared, and leaves the other two stages alone', () => {
    expect(resolveStageModes({ stageModes: { transition: 'none' }, assets: {} })).toEqual({
      cover: 'animation',
      transition: 'none',
      background: 'animation',
    })
  })

  it('drops the beat even on a template built around film', () => {
    expect(
      resolveStageModes({
        stageModes: { transition: 'none' },
        assets: { standard_cover_video: '/media/cover.mp4' },
      }),
    ).toEqual({ cover: 'video', transition: 'none', background: 'video' })
  })

  it('never infers none — an undeclared beat still follows the cover', () => {
    // The whole backward-compatibility story: 'none' is a declaration and
    // nothing else, so no template published before it existed can acquire it.
    expect(resolveStageModes({ stageModes: { cover: 'animation' }, assets: {} }).transition).toBe(
      'animation',
    )
    expect(resolveStageModes({ assets: {} }).transition).toBe('animation')
  })
})

describe('resolveStageModesForEvent', () => {
  it('reads the template declaration off the event', () => {
    expect(
      resolveStageModesForEvent({
        template_assets: { stage_modes: { transition: 'video' }, assets: {} },
      }).transition,
    ).toBe('video')
  })

  it('reads a removed middle beat off the event', () => {
    expect(
      resolveStageModesForEvent({
        template_assets: { stage_modes: { transition: 'none' }, assets: {} },
      }).transition,
    ).toBe('none')
  })

  it('falls back to the animated stages for an event with no template at all', () => {
    expect(resolveStageModesForEvent(null)).toEqual({
      cover: 'animation',
      transition: 'animation',
      background: 'animation',
    })
  })
})
