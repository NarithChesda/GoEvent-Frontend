// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import PhotoGallery from './PhotoGallery.vue'
import GalleryColumn from './gallery-designs/GalleryColumn.vue'
import GalleryReel from './gallery-designs/GalleryReel.vue'
import GalleryPrints from './gallery-designs/GalleryPrints.vue'
import GalleryMosaic from './gallery-designs/GalleryMosaic.vue'
import GalleryBooth from './gallery-designs/GalleryBooth.vue'
import GalleryFilm from './gallery-designs/GalleryFilm.vue'
import type { EventPhoto } from '@/types/showcase'
import type { GalleryDesignType } from '@/services/api/types/template.types'

const photo = (id: number, caption = ''): EventPhoto => ({
  id,
  event: 'e',
  image: `https://example.test/p${id}.jpg`,
  caption,
  order: id,
  is_featured: false,
  created_at: '2026-01-01T00:00:00Z',
})

const PHOTOS = [photo(1, 'The proposal'), photo(2), photo(3, 'IMG_2231.jpg'), photo(4)]

type Props = InstanceType<typeof PhotoGallery>['$props']

const DESIGN_STUBS = {
  GalleryColumn: true,
  GalleryReel: true,
  GalleryPrints: true,
  GalleryMosaic: true,
  GalleryBooth: true,
  GalleryFilm: true,
}

const mountGallery = (props: Partial<Props> = {}, stubbed = true) =>
  mount(PhotoGallery, {
    props: {
      photos: PHOTOS,
      primaryColor: '#6b3f2e',
      accentColor: '#c28f2c',
      getMediaUrl: (url: string) => url,
      currentLanguage: 'en',
      ...props,
    } as Props,
    global: { stubs: stubbed ? DESIGN_STUBS : {} },
  })

describe('PhotoGallery', () => {
  it.each([
    ['column', GalleryColumn],
    ['reel', GalleryReel],
    ['prints', GalleryPrints],
    ['mosaic', GalleryMosaic],
    ['booth', GalleryBooth],
    ['film', GalleryFilm],
  ] as const)('draws the %s design', (type, component) => {
    const wrapper = mountGallery({ galleryDesign: { type } })
    expect(wrapper.findComponent(component).exists()).toBe(true)
    expect(wrapper.classes()).toContain(`gd--${type}`)
  })

  it('draws the column when no design is set, as every gallery did', () => {
    expect(mountGallery({ galleryDesign: null }).findComponent(GalleryColumn).exists()).toBe(true)
  })

  it('draws the column for a design this build does not know', () => {
    const wrapper = mountGallery({ galleryDesign: { type: 'carousel' as GalleryDesignType } })
    expect(wrapper.findComponent(GalleryColumn).exists()).toBe(true)
  })

  it('hands every design the template ink as a CSS variable, not a prop to re-read', () => {
    const style = mountGallery({ galleryDesign: { type: 'mosaic' } }).attributes('style')
    expect(style).toContain('--gd-ink: #6b3f2e')
    expect(style).toContain('--gd-accent: #c28f2c')
  })

  it('passes a tapped photograph up as openPhoto', async () => {
    const wrapper = mountGallery({ galleryDesign: { type: 'mosaic' } }, false)
    // The second photograph heads the right-hand column (see mosaicColumns).
    await wrapper.findAll('.ms-col')[1].find('.ms-tile').trigger('click')
    expect(wrapper.emitted('openPhoto')?.[0]).toEqual([PHOTOS[1]])
  })

  it('writes a caption on a print, but never a file name', () => {
    const wrapper = mountGallery({ galleryDesign: { type: 'prints' } }, false)
    const captions = wrapper.findAll('.pr-caption').map((node) => node.text())
    expect(captions).toEqual(['The proposal'])
  })
})
