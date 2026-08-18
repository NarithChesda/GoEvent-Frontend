import { describe, it, expect } from 'vitest'
import { extractGoogleMapsEmbedUrl, isGoogleMapsEmbedUrl } from './embedExtractor'

describe('isGoogleMapsEmbedUrl', () => {
  it('accepts the ?pb= share-embed URL used by venue presets', () => {
    expect(
      isGoogleMapsEmbedUrl('https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3908.75'),
    ).toBe(true)
  })

  it('accepts Maps Embed API and regional/maps hosts', () => {
    expect(
      isGoogleMapsEmbedUrl('https://www.google.com/maps/embed/v1/place?key=abc&q=Phnom+Penh'),
    ).toBe(true)
    expect(isGoogleMapsEmbedUrl('https://www.google.com.kh/maps/embed?pb=!1m18')).toBe(true)
    expect(isGoogleMapsEmbedUrl('https://maps.google.com/maps/embed?pb=!1m18')).toBe(true)
  })

  it('rejects non-Maps and look-alike hosts, since the value goes into an iframe src', () => {
    expect(isGoogleMapsEmbedUrl('https://evil.com/maps/embed?pb=1')).toBe(false)
    expect(isGoogleMapsEmbedUrl('https://google.com.evil.com/maps/embed?pb=1')).toBe(false)
    expect(isGoogleMapsEmbedUrl('https://www.google.com.evil.com/maps/embed?pb=1')).toBe(false)
    expect(isGoogleMapsEmbedUrl('https://notgoogle.com/maps/embed?pb=1')).toBe(false)
  })

  it('rejects non-embed Google paths and unsafe schemes', () => {
    expect(isGoogleMapsEmbedUrl('https://www.google.com/maps/place/Phnom+Penh')).toBe(false)
    expect(isGoogleMapsEmbedUrl('http://www.google.com/maps/embed?pb=1')).toBe(false)
    expect(isGoogleMapsEmbedUrl('javascript:alert(1)')).toBe(false)
    expect(isGoogleMapsEmbedUrl('')).toBe(false)
  })
})

describe('extractGoogleMapsEmbedUrl', () => {
  it('pulls the src out of a pasted iframe', () => {
    const iframe =
      '<iframe src="https://www.google.com/maps/embed?pb=!1m18" width="600" height="450"></iframe>'
    expect(extractGoogleMapsEmbedUrl(iframe)).toBe('https://www.google.com/maps/embed?pb=!1m18')
  })

  it('returns empty for an iframe pointing somewhere other than Maps', () => {
    expect(extractGoogleMapsEmbedUrl('<iframe src="https://evil.com/x"></iframe>')).toBe('')
  })
})
