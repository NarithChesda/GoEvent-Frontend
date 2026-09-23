// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import PhotoArrangeGrid from './PhotoArrangeGrid.vue'
import type { EventPhoto } from '@/services/api'

// Reduced motion on: the FLIP measurements are meaningless without layout, and
// this also proves the reduced path still reorders.
vi.stubGlobal(
  'matchMedia',
  vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
)

vi.mock('@/composables/useAppLanguage', () => ({
  useAppLanguage: () => ({ t: (key: string) => key }),
}))

const photo = (id: number, order: number) =>
  ({ id, order, image: `https://example.com/p${id}.jpg`, is_featured: false }) as unknown as EventPhoto

const PHOTOS = [photo(1, 0), photo(2, 1), photo(3, 2)]

let wrapper: VueWrapper<InstanceType<typeof PhotoArrangeGrid>> | undefined

/** Mounted the way a parent uses it: `v-model:selected-id` fed back in. */
const mountGrid = () => {
  const w = mount(PhotoArrangeGrid, {
    props: {
      photos: PHOTOS,
      selectedId: null,
      'onUpdate:selectedId': (id: number | null) => w.setProps({ selectedId: id }),
    },
    attachTo: document.body,
  })
  wrapper = w
  return w
}

/** The tile showing a given photo, wherever it currently sits. */
const tileFor = (w: VueWrapper, id: number) =>
  w.findAll('li').find((li) => li.find('img').attributes('src')?.endsWith(`/p${id}.jpg`))!

const onScreen = (w: VueWrapper) =>
  w.findAll('li').map((li) => Number(li.find('img').attributes('src')!.match(/p(\d+)\.jpg$/)![1]))

const orders = (w: VueWrapper) =>
  (w.emitted('reorder') ?? []).map(([list]) => (list as EventPhoto[]).map((p) => p.id))

const key = async (w: VueWrapper, id: number, name: string) => {
  await tileFor(w, id).trigger('keydown', { key: name })
  await flushPromises()
}

/** A mouse press and release in place — jsdom has no PointerEvent. */
const tap = async (w: VueWrapper, id: number) => {
  const pointer = { pointerId: 1, pointerType: 'mouse', button: 0, clientX: 5, clientY: 5 }
  tileFor(w, id).element.dispatchEvent(
    Object.assign(new Event('pointerdown', { bubbles: true }), pointer),
  )
  window.dispatchEvent(Object.assign(new Event('pointerup'), pointer))
  await flushPromises()
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('PhotoArrangeGrid', () => {
  it('selects a photo on a tap, and clears it on a second', async () => {
    const w = mountGrid()

    await tap(w, 2)
    expect(w.props('selectedId')).toBe(2)
    expect(tileFor(w, 2).classes()).toContain('is-selected')

    await tap(w, 2)
    expect(w.props('selectedId')).toBeNull()
  })

  it('moves a photo when the parent asks, and reports the new order', async () => {
    const w = mountGrid()

    await w.vm.move(1, 2)
    await flushPromises()

    expect(onScreen(w)).toEqual([2, 3, 1])
    expect(orders(w)).toEqual([[2, 3, 1]])
  })

  it('does not report a move that goes nowhere', async () => {
    const w = mountGrid()

    await w.vm.move(3, 1) // already last
    await w.vm.move(1, -1) // already first
    await flushPromises()

    expect(orders(w)).toEqual([])
  })

  it('selects with Space and moves the selected photo with the arrows', async () => {
    const w = mountGrid()

    await key(w, 1, ' ')
    expect(w.props('selectedId')).toBe(1)

    await key(w, 1, 'ArrowRight')
    await key(w, 1, 'ArrowRight')

    expect(onScreen(w)).toEqual([2, 3, 1])
    expect(orders(w)).toEqual([
      [2, 1, 3],
      [2, 3, 1],
    ])
  })

  it('leaves an unselected photo where it is on the arrows', async () => {
    const w = mountGrid()

    await key(w, 2, 'ArrowLeft')
    expect(onScreen(w)).toEqual([1, 2, 3])
    expect(orders(w)).toEqual([])
  })

  it('clears the selection on Escape without moving anything', async () => {
    const w = mountGrid()

    await key(w, 2, 'Enter')
    await key(w, 2, 'Escape')

    expect(w.props('selectedId')).toBeNull()
    expect(onScreen(w)).toEqual([1, 2, 3])
  })

  it('removes with Delete or the remove button, without selecting', async () => {
    const w = mountGrid()

    await key(w, 2, 'Delete')
    await tileFor(w, 3).find('button').trigger('click')

    expect((w.emitted('remove') ?? []).map(([p]) => (p as EventPhoto).id)).toEqual([2, 3])
    expect(w.props('selectedId')).toBeNull()
  })

  it('follows new photos from its parent', async () => {
    const w = mountGrid()
    await w.setProps({ photos: [PHOTOS[2], PHOTOS[0]] })
    expect(onScreen(w)).toEqual([3, 1])
  })
})
