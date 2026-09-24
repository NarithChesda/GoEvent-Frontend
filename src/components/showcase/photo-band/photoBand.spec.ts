import { describe, it, expect } from 'vitest'
import {
  PHOTO_BAND_FADE,
  PHOTO_BAND_MASKS,
  galleryPhotosOf,
  normalizeBlendColor,
  photoBandPayload,
  photoBandPlacement,
  photoBandTint,
  resolvePhotoBands,
  responseSupportsPhotoBand,
  templateBlendSwatches,
} from './photoBand'
import { FULL_CROP } from '@/utils/photoCrop'

/** The `<colour> <offset>%` stops of a gradient, in order. */
const stops = (gradient: string) =>
  [...gradient.matchAll(/(rgba\([^)]*\)|#[0-9a-f]{8}) ([\d.]+)%/g)].map(([, colour, offset]) => ({
    colour,
    offset: Number(offset),
  }))

const alphaOf = (colour: string) =>
  colour.startsWith('#') ? parseInt(colour.slice(7), 16) / 255 : parseFloat(colour.split(',')[3])

describe('normalizeBlendColor', () => {
  it('accepts the forms a colour input and a hand-typed value produce', () => {
    expect(normalizeBlendColor('#8B4C50')).toBe('#8b4c50')
    expect(normalizeBlendColor('8b4c50')).toBe('#8b4c50')
    expect(normalizeBlendColor(' #fff ')).toBe('#ffffff')
  })

  it('reads anything else as no colour, rather than guessing', () => {
    for (const value of ['', 'red', '#12345', '#1234567', 'rgb(0,0,0)', null, undefined, 12]) {
      expect(normalizeBlendColor(value)).toBeNull()
    }
  })
})

describe('photoBandPlacement', () => {
  it('reads a section', () => {
    expect(photoBandPlacement({ band_placement: 'after_agenda' })).toBe('after_agenda')
  })

  it('is an ordinary gallery photo when unset', () => {
    for (const value of [null, undefined, '', '  ']) {
      expect(photoBandPlacement({ band_placement: value as never })).toBeNull()
    }
    expect(photoBandPlacement({})).toBeNull()
    expect(photoBandPlacement(null)).toBeNull()
  })

  it('draws a section this build does not know at the default, rather than dropping the photo', () => {
    expect(photoBandPlacement({ band_placement: 'after_the_cake' as never })).toBe('after_event_info')
  })
})

describe('galleryPhotosOf', () => {
  it('leaves out every photo that is a band, keeping the order', () => {
    const photos = [
      { id: 1 },
      { id: 2, band_placement: 'top' as const },
      { id: 3, band_placement: null },
      { id: 4, band_placement: 'after_gallery' as const },
    ]
    expect(galleryPhotosOf(photos).map((p) => p.id)).toEqual([1, 3])
    expect(galleryPhotosOf(undefined)).toEqual([])
  })

  it('leaves out the photo in the cover’s frame too, when there is one', () => {
    const photos = [{ id: 1 }, { id: 2 }, { id: 3, band_placement: 'top' as const }]
    expect(galleryPhotosOf(photos, 2).map((p) => p.id)).toEqual([1])
    expect(galleryPhotosOf(photos, null).map((p) => p.id)).toEqual([1, 2])
  })
})

describe('resolvePhotoBands', () => {
  const photos = [
    { id: 1, image: 'a.webp' },
    {
      id: 2,
      image: 'b.webp',
      band_placement: 'top' as const,
      band_blend_color: '#000',
      crop_x: 10,
      crop_y: 10,
      crop_width: 40,
      crop_height: 60,
    },
    { id: 3, image: 'c.webp', band_placement: 'after_gallery' as const, band_blend_color: 'gold' },
  ]

  it('draws every band photo in the order given, with its own framing', () => {
    const bands = resolvePhotoBands(photos)
    expect(bands.map((b) => [b.id, b.placement, b.blendColor])).toEqual([
      [2, 'top', '#000000'],
      [3, 'after_gallery', null],
    ])
    expect(bands[0].crop).toEqual({ x: 10, y: 10, width: 40, height: 60 })
    expect(bands[1].crop).toEqual(FULL_CROP)
  })

  it('is no bands without photos', () => {
    expect(resolvePhotoBands(undefined)).toEqual([])
  })
})

describe('photoBandPayload / responseSupportsPhotoBand', () => {
  it('makes a photo a band, with its colour normalised', () => {
    expect(photoBandPayload('after_video', '#ABC')).toEqual({
      band_placement: 'after_video',
      band_blend_color: '#aabbcc',
    })
  })

  it('makes a photo a gallery photo again, taking its colour with it', () => {
    expect(photoBandPayload(null, '#abcabc')).toEqual({ band_placement: null, band_blend_color: null })
  })

  it('knows a server that dropped the fields from one that stored them', () => {
    expect(responseSupportsPhotoBand({ band_placement: null })).toBe(true)
    expect(responseSupportsPhotoBand({})).toBe(false)
    expect(responseSupportsPhotoBand(null)).toBe(false)
  })
})

describe('templateBlendSwatches', () => {
  it("offers the V1 palette under either of the API's hex field names", () => {
    expect(
      templateBlendSwatches([
        { name: 'primary', hex_color_code: '#8B4C50' },
        { name: 'background', hex_code: '#f3e6d3' },
        { name: 'v2-ivory', hex_color_code: '#fffaf2' },
        { name: 'broken', hex_color_code: 'not a colour' },
      ]),
    ).toEqual([
      { hex: '#8b4c50', name: 'primary' },
      { hex: '#f3e6d3', name: 'background' },
    ])
  })

  it('copes with no template', () => {
    expect(templateBlendSwatches(undefined)).toEqual([])
  })
})

describe('masks', () => {
  const fade = PHOTO_BAND_FADE * 100

  for (const [name, mask] of Object.entries(PHOTO_BAND_MASKS)) {
    it(`${name}: transparent at both edges, opaque through the middle, symmetric`, () => {
      const s = stops(mask)
      expect(alphaOf(s[0].colour)).toBe(0)
      expect(alphaOf(s[s.length - 1].colour)).toBe(0)
      // Every ramp is done within the fade, so the middle is the plain photo.
      const top = s.slice(0, s.length / 2)
      expect(top[top.length - 1].offset).toBeLessThanOrEqual(fade + 0.01)
      expect(alphaOf(top[top.length - 1].colour)).toBe(1)
      s.forEach((stop, k) => {
        const mirror = s[s.length - 1 - k]
        expect(stop.colour).toBe(mirror.colour)
        expect(stop.offset + mirror.offset).toBeCloseTo(100, 1)
      })
    })
  }

  it('brings the layers in edge inward: heavy blur, then light, then the photo', () => {
    const firstOpaque = (mask: string) => stops(mask).find((s) => alphaOf(s.colour) === 1)!.offset
    expect(firstOpaque(PHOTO_BAND_MASKS.far)).toBeLessThan(firstOpaque(PHOTO_BAND_MASKS.mid))
    expect(firstOpaque(PHOTO_BAND_MASKS.mid)).toBeLessThan(firstOpaque(PHOTO_BAND_MASKS.sharp))
  })
})

describe('photoBandTint', () => {
  it('is strongest at the edges and gone before the middle', () => {
    const s = stops(photoBandTint('#8B4C50'))
    expect(s[0].colour.startsWith('#8b4c50')).toBe(true)
    expect(alphaOf(s[0].colour)).toBeGreaterThan(0.8)
    const top = s.slice(0, s.length / 2)
    expect(alphaOf(top[top.length - 1].colour)).toBe(0)
    expect(top[top.length - 1].offset).toBeLessThan(PHOTO_BAND_FADE * 100)
  })
})
