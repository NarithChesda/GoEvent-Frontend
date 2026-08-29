import { describe, it, expect, vi } from 'vitest'
import { useTemplateProcessor, RESPONSIVE_WIDTH_LADDER } from './useTemplateProcessor'

// The ImageKit toggle reads localStorage/env at module load, which would make
// these assertions depend on whichever .env the machine happens to carry.
vi.mock('../useImageKitConfig', () => ({ isImageKitEnabled: () => true }))

const PHOTO = 'https://api.goevent.online/media/event_photos/bride.jpg'

describe('getOptimizedMediaUrl — photo delivery', () => {
  const { getOptimizedMediaUrl } = useTemplateProcessor()

  it('emits width, format, quality and the no-upscale crop mode', () => {
    const url = getOptimizedMediaUrl(PHOTO, {
      width: 1280,
      retina: 1,
      format: 'auto',
      quality: 82,
      noUpscale: true,
    })

    expect(url).toBe(
      'https://ik.imagekit.io/goevent/tr:w-1280,c-at_max,q-82,f-auto/media/event_photos/bride.jpg',
    )
  })

  it('leaves the crop mode off unless asked, so existing callers are untouched', () => {
    expect(getOptimizedMediaUrl(PHOTO, { width: 500, retina: 2 })).toBe(
      'https://ik.imagekit.io/goevent/tr:w-1000/media/event_photos/bride.jpg',
    )
  })
})

describe('getOptimizedMediaSrcset', () => {
  const { getOptimizedMediaSrcset } = useTemplateProcessor()

  it('tags every rung with its real pixel width, ignoring any retina factor', () => {
    const srcset = getOptimizedMediaSrcset(PHOTO, { format: 'auto', quality: 82 })
    const candidates = srcset.split(', ')

    expect(candidates).toHaveLength(RESPONSIVE_WIDTH_LADDER.length)
    expect(candidates[0]).toBe(
      'https://ik.imagekit.io/goevent/tr:w-480,q-82,f-auto/media/event_photos/bride.jpg 480w',
    )
    // The descriptor must equal the transform's width or the browser picks wrong.
    for (const candidate of candidates) {
      const [src, descriptor] = candidate.split(' ')
      expect(src).toContain(`w-${descriptor.replace('w', '')},`)
    }
  })

  it('returns nothing when every rung would resolve to the same URL', () => {
    // A blob: URL has no CDN derivative; a srcset of identical URLs under
    // different `w` descriptors would make the browser act on a lie.
    expect(getOptimizedMediaSrcset('blob:http://localhost/abc')).toBe('')
    expect(getOptimizedMediaSrcset('')).toBe('')
  })
})
