// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useFontManager } from './useFontManager'
import type { TemplateFont } from '../useEventShowcase'

/**
 * jsdom implements neither `FontFace` nor `document.fonts`, so both are stubbed.
 *
 * The stub keeps the descriptor dictionary it was constructed with: half of what
 * these tests check is that the CSS rule and the `FontFace` object are handed the
 * SAME metrics, since they register under one family name and a disagreement
 * between them leaves the browser with two sizes for one font.
 */
class StubFontFace {
  family: string
  source: string
  descriptors: Record<string, unknown>

  constructor(family: string, source: string, descriptors: Record<string, unknown> = {}) {
    this.family = family
    this.source = source
    this.descriptors = descriptors
  }

  load(): Promise<StubFontFace> {
    return Promise.resolve(this)
  }
}

let added: StubFontFace[]
let deleted: StubFontFace[]

beforeEach(() => {
  added = []
  deleted = []

  vi.stubGlobal('FontFace', StubFontFace)
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: {
      ready: Promise.resolve(),
      add: (face: StubFontFace) => added.push(face),
      delete: (face: StubFontFace) => deleted.push(face),
    },
  })

  // The rule/face registries are module scope (they mirror a document-level
  // singleton), so they survive between tests unless the tag is torn down.
  useFontManager().cleanup()
  document.getElementById('custom-fonts-css')?.remove()
})

const sheet = (): string => document.getElementById('custom-fonts-css')?.textContent ?? ''

const fontRow = (overrides: Partial<TemplateFont> = {}): TemplateFont => ({
  language: 'kh',
  font_name: 'Moul',
  font: { name: 'Moul', font_file: 'https://cdn.example.com/moul.woff2' },
  ...overrides,
})

describe('useFontManager metric descriptors', () => {
  // The load-bearing guarantee: a font with no calibration must produce the exact
  // rule it always did, so every already-published template is untouched.
  it('emits no size-adjust for an uncalibrated font', async () => {
    const manager = useFontManager()
    await manager.loadCustomFonts([fontRow()])

    expect(sheet()).toContain('font-family: "Moul"')
    expect(sheet()).not.toContain('size-adjust')
    expect(added[0].descriptors.sizeAdjust).toBeUndefined()
  })

  it('multiplies the library normalization by the row scale', async () => {
    const manager = useFontManager()
    await manager.loadCustomFonts([
      fontRow({
        font: { name: 'Moul', font_file: 'https://cdn.example.com/moul.woff2', size_adjust: 0.9 },
        size_scale: 0.5,
      }),
    ])

    // 0.9 x 0.5 = 0.45, clamped up to the combined floor of 0.5 x 0.6.
    expect(sheet()).toContain('size-adjust: 45%;')
  })

  it('hands the CSS rule and the FontFace the same descriptors', async () => {
    const manager = useFontManager()
    await manager.loadCustomFonts([
      fontRow({
        font: {
          name: 'Moul',
          font_file: 'https://cdn.example.com/moul.woff2',
          size_adjust: 0.88,
          ascent_override: 1.05,
        },
      }),
    ])

    expect(sheet()).toContain('size-adjust: 88%;')
    expect(sheet()).toContain('ascent-override: 105%;')
    expect(added[0].descriptors).toMatchObject({
      sizeAdjust: '88%',
      ascentOverride: '105%',
    })
  })
})

describe('useFontManager re-injection', () => {
  const atScale = (size_scale: number) =>
    fontRow({
      font: { name: 'Moul', font_file: 'https://cdn.example.com/moul.woff2' },
      size_scale,
    })

  // The old code appended to textContent unconditionally. Once sizes became
  // adjustable that would have left every superseded size in the sheet, with the
  // partner's current pick competing against all of them.
  it('replaces a face rule rather than stacking a second one', async () => {
    const manager = useFontManager()
    await manager.loadCustomFonts([atScale(1.2)])
    await manager.loadCustomFonts([atScale(0.8)])

    expect(sheet().match(/@font-face/g)).toHaveLength(1)
    expect(sheet()).toContain('size-adjust: 80%;')
    expect(sheet()).not.toContain('size-adjust: 120%;')
  })

  it('evicts the superseded FontFace so one family means one size', async () => {
    const manager = useFontManager()
    await manager.loadCustomFonts([atScale(1.2)])
    await manager.loadCustomFonts([atScale(0.8)])

    expect(added).toHaveLength(2)
    expect(deleted).toEqual([added[0]])
  })

  // Dragging a slider 1.0 -> 0.9 -> 1.0 lands back on a cached entry while the
  // document still holds the 0.9 rule. Without re-asserting on a cache hit, the
  // type would strand at a size the partner has already moved away from.
  it('re-asserts the rule when returning to a previously cached scale', async () => {
    const manager = useFontManager()
    await manager.loadCustomFonts([atScale(1.2)])
    await manager.loadCustomFonts([atScale(0.8)])
    await manager.loadCustomFonts([atScale(1.2)])

    expect(sheet().match(/@font-face/g)).toHaveLength(1)
    expect(sheet()).toContain('size-adjust: 120%;')
  })

  // cleanup() removes the style tag; if the rule registry outlived it, the next
  // mount would decide every rule was already present and leave the fresh tag
  // empty.
  it('repopulates the sheet after a cleanup', async () => {
    const manager = useFontManager()
    await manager.loadCustomFonts([atScale(0.8)])
    manager.cleanup()
    expect(document.getElementById('custom-fonts-css')).toBeNull()

    await manager.loadCustomFonts([atScale(0.8)])
    expect(sheet()).toContain('size-adjust: 80%;')
  })
})
