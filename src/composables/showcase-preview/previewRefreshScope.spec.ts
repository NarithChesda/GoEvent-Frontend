import { describe, it, expect } from 'vitest'
import type { Event } from '@/services/api'
import { resolvePreviewSaveScope } from './previewRefreshScope'

/** A manage-view copy, as `/api/events/{id}/` serializes it. */
const before = {
  id: 'evt-1',
  title: 'Sokha & Dara',
  short_description: '',
  description: 'A garden wedding.',
  banner_image: 'https://cdn/banner-1.jpg',
  logo_one: 'https://cdn/logo-1.png',
  logo_two: null,
  event_video: null,
  music: null,
  selected_music: null,
  music_start_time: 0,
  music_end_time: null,
  photos: [
    { id: 1, order: 0 },
    { id: 2, order: 1 },
  ],
  hosts: [{ id: 7, name: 'Sokha' }],
  updated_at: '2026-07-29T10:00:00Z',
} as unknown as Event

/** What a PATCH gives back: the same payload with the saved fields changed. */
const patched = (changes: Record<string, unknown>) =>
  ({ ...(before as object), updated_at: '2026-07-29T10:05:00Z', ...changes }) as unknown as Event

describe('resolvePreviewSaveScope', () => {
  describe('inert — the frames are left alone', () => {
    it('a link-preview title change', () => {
      expect(resolvePreviewSaveScope(before, patched({ title: 'Sokha & Dara Wedding' }))).toEqual({
        kind: 'inert',
      })
    })

    it('a link-preview description change', () => {
      expect(
        resolvePreviewSaveScope(before, patched({ short_description: 'Garden wedding.' })),
      ).toEqual({ kind: 'inert' })
    })

    it('a full-description change — stages read event_texts, not this', () => {
      expect(resolvePreviewSaveScope(before, patched({ description: 'Dinner at seven.' }))).toEqual({
        kind: 'inert',
      })
    })

    it('a replaced banner image — og:image only, no stage draws it', () => {
      expect(
        resolvePreviewSaveScope(before, patched({ banner_image: 'https://cdn/banner-2.jpg' })),
      ).toEqual({ kind: 'inert' })
    })

    it('a removed banner image', () => {
      expect(resolvePreviewSaveScope(before, patched({ banner_image: null }))).toEqual({
        kind: 'inert',
      })
    })

    it('any music field, including a library selection', () => {
      expect(
        resolvePreviewSaveScope(
          before,
          patched({
            selected_music: 12,
            selected_music_details: { id: 12, title: 'Khmer Wedding Song' },
            music_start_time: 4,
            music_end_time: 96,
          }),
        ),
      ).toEqual({ kind: 'inert' })
    })

    it('a bare updated_at bump — every PATCH does that', () => {
      expect(resolvePreviewSaveScope(before, patched({}))).toEqual({ kind: 'inert' })
    })

    it('keys the response does not carry — locally merged extras', () => {
      const merged = { ...(before as object), event_texts: [{ id: 3 }] } as unknown as Event
      expect(resolvePreviewSaveScope(merged, patched({ title: 'Renamed' }))).toEqual({
        kind: 'inert',
      })
    })
  })

  describe('patch — pushed into the frames in place', () => {
    it('a replaced primary logo, carrying only that field', () => {
      expect(resolvePreviewSaveScope(before, patched({ logo_one: 'https://cdn/logo-2.png' }))).toEqual(
        { kind: 'patch', fields: { logo_one: 'https://cdn/logo-2.png' } },
      )
    })

    it('a removed logo (null is a real value, not "unchanged")', () => {
      expect(resolvePreviewSaveScope(before, patched({ logo_one: null }))).toEqual({
        kind: 'patch',
        fields: { logo_one: null },
      })
    })

    it('both logos at once', () => {
      const scope = resolvePreviewSaveScope(
        before,
        patched({ logo_one: 'https://cdn/a.png', logo_two: 'https://cdn/b.png' }),
      )
      expect(scope).toEqual({
        kind: 'patch',
        fields: { logo_one: 'https://cdn/a.png', logo_two: 'https://cdn/b.png' },
      })
    })

    it('a logo alongside an inert field — the inert one is not pushed', () => {
      expect(
        resolvePreviewSaveScope(before, patched({ logo_one: 'https://cdn/a.png', title: 'Renamed' })),
      ).toEqual({ kind: 'patch', fields: { logo_one: 'https://cdn/a.png' } })
    })
  })

  describe('refresh — the frames refetch', () => {
    it('a field that needs load-time work (the cover video)', () => {
      expect(resolvePreviewSaveScope(before, patched({ event_video: 'https://cdn/v.mp4' }))).toEqual({
        kind: 'refresh',
      })
    })

    it('a nested collection change', () => {
      expect(resolvePreviewSaveScope(before, patched({ photos: [{ id: 2, order: 0 }] }))).toEqual({
        kind: 'refresh',
      })
    })

    it('a field it has never heard of', () => {
      expect(resolvePreviewSaveScope(before, patched({ some_new_flag: true }))).toEqual({
        kind: 'refresh',
      })
    })

    it('a patchable field mixed with a render-affecting one', () => {
      expect(
        resolvePreviewSaveScope(
          before,
          patched({ logo_one: 'https://cdn/a.png', location: 'Siem Reap' }),
        ),
      ).toEqual({ kind: 'refresh' })
    })

    it('no pre-save copy to compare against', () => {
      expect(resolvePreviewSaveScope(undefined, patched({ title: 'Renamed' }))).toEqual({
        kind: 'refresh',
      })
    })
  })
})
