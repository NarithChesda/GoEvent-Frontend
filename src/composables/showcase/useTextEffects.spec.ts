// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import type { TextEffectsConfig } from '@/services/api/types/template.types'
import {
  SHEEN_AFTER_REVEAL_MS,
  SHEEN_PASS_MS,
  SHEEN_STAGGER_MS,
  SHIMMER_MIN_REST_MS,
  SHIMMER_PERIOD_MS,
  applySheenDelays,
  applyShimmerDelays,
  parseCssTimeMs,
  provideTextEffects,
  resolveTextEffect,
  resolveTextEffects,
  textEffectAnimationOf,
  textEffectClasses,
  useTextEffect,
} from './useTextEffects'

/**
 * The field is backend-served and absent on every template saved before it
 * existed, so the fallbacks are the contract: absent must mean "no finish",
 * and a value from a newer option set must degrade to plain type rather than
 * to broken markup.
 */
describe('resolveTextEffect', () => {
  it('reads absent, null and a missing finish as no finish', () => {
    expect(resolveTextEffect(undefined)).toBeNull()
    expect(resolveTextEffect(null)).toBeNull()
    expect(resolveTextEffect({} as never)).toBeNull()
  })

  it('treats an unknown finish as absent', () => {
    expect(resolveTextEffect({ finish: 'chrome' as never })).toBeNull()
  })

  it('defaults the metal to gold and the light to a single pass', () => {
    expect(resolveTextEffect({ finish: 'foil' })).toEqual({
      finish: 'foil',
      metal: 'gold',
      animation: 'sheen',
    })
  })

  it('keeps the finish and falls back to gold for an unknown metal', () => {
    expect(resolveTextEffect({ finish: 'relief', metal: 'bronze' as never })).toEqual({
      finish: 'relief',
      metal: 'gold',
      animation: 'sheen',
    })
  })

  // A light this build doesn't know is no reason to still the metal.
  it('keeps the finish and falls back to a single pass for an unknown animation', () => {
    expect(resolveTextEffect({ finish: 'foil', animation: 'sparkle' as never })).toEqual({
      finish: 'foil',
      metal: 'gold',
      animation: 'sheen',
    })
  })

  it('passes a known metal and animation through', () => {
    expect(resolveTextEffect({ finish: 'foil', metal: 'rose_gold', animation: 'none' })).toEqual({
      finish: 'foil',
      metal: 'rose_gold',
      animation: 'none',
    })
  })
})

describe('resolveTextEffects', () => {
  it('returns nothing for a template without the field', () => {
    expect(resolveTextEffects(undefined)).toEqual({})
    expect(resolveTextEffects(null)).toEqual({})
  })

  it('keeps only the slots that carry a finish', () => {
    const config: TextEffectsConfig = {
      primary: { finish: 'relief', metal: 'silver' },
      secondary: null,
      accent: { finish: 'nope' as never },
    }
    expect(resolveTextEffects(config)).toEqual({
      primary: { finish: 'relief', metal: 'silver', animation: 'sheen' },
    })
  })

  it('ignores keys that are not V1 slots', () => {
    const config = { 'v2-display': { finish: 'foil' } } as unknown as TextEffectsConfig
    expect(resolveTextEffects(config)).toEqual({})
  })
})

describe('textEffectClasses', () => {
  it('is empty without a finish, so a heading renders exactly as before', () => {
    expect(textEffectClasses(null)).toEqual([])
  })

  it('names the finish, the metal and the light by their stored values', () => {
    expect(textEffectClasses({ finish: 'foil', metal: 'rose_gold', animation: 'shimmer' })).toEqual([
      'tfx',
      'tfx--foil',
      'tfx--rose_gold',
      'tfx--anim-shimmer',
    ])
  })
})

describe('textEffectAnimationOf', () => {
  it('reads the light back off the classes', () => {
    const el = document.createElement('h2')
    el.className = 'tfx tfx--relief tfx--gold tfx--anim-none'
    expect(textEffectAnimationOf(el)).toBe('none')
  })

  it('reads a finish with no animation class as a single pass', () => {
    const el = document.createElement('h2')
    el.className = 'tfx tfx--foil tfx--gold'
    expect(textEffectAnimationOf(el)).toBe('sheen')
  })
})

describe('useTextEffect', () => {
  const Heading = defineComponent({
    props: { slot: { type: String, default: 'primary' } },
    setup(props) {
      const fx = useTextEffect()
      return () => h('h2', { class: fx(props.slot as 'primary') }, 'Sofia')
    },
  })

  it('gives every slot no finish when nothing provides one', () => {
    const wrapper = mount(Heading)
    expect(wrapper.find('h2').classes()).toEqual([])
  })

  it('follows the provided config live', async () => {
    const config = ref<TextEffectsConfig | null>(null)
    const Host = defineComponent({
      setup() {
        provideTextEffects(config)
        return () => [h(Heading, { slot: 'primary' }), h(Heading, { slot: 'secondary' })]
      },
    })
    const wrapper = mount(Host)
    const [primary, secondary] = wrapper.findAll('h2')
    expect(primary.classes()).toEqual([])

    // A partner picking a finish in the studio re-renders the preview in place.
    config.value = { primary: { finish: 'relief' } }
    await nextTick()
    expect(primary.classes()).toEqual(['tfx', 'tfx--relief', 'tfx--gold', 'tfx--anim-sheen'])
    expect(secondary.classes()).toEqual([])

    config.value = null
    await nextTick()
    expect(primary.classes()).toEqual([])
  })
})

describe('parseCssTimeMs', () => {
  it('reads seconds and milliseconds', () => {
    expect(parseCssTimeMs('1.05s')).toBe(1050)
    expect(parseCssTimeMs('250ms')).toBe(250)
    expect(parseCssTimeMs(' 1000ms ')).toBe(1000)
  })

  it('reads nothing as zero', () => {
    expect(parseCssTimeMs('')).toBe(0)
    expect(parseCssTimeMs(undefined)).toBe(0)
    expect(parseCssTimeMs('auto')).toBe(0)
  })
})

/**
 * The pass of light has to follow the words in, or it crosses letters that are
 * still invisible — and crossing every word of a line at the same instant reads
 * as a pattern rather than as one light moving.
 */
describe('applySheenDelays', () => {
  const build = (html: string) => {
    const root = document.createElement('h2')
    root.innerHTML = html
    return root
  }

  it("follows each word's own reveal delay", () => {
    const root = build(
      '<span class="bounce-word" style="animation-delay: 0.3s"><span class="tfx-ink">Sophea</span></span>' +
        '<span class="bounce-word" style="animation-delay: 0.45s"><span class="tfx-ink">Chan</span></span>',
    )
    expect(applySheenDelays(root)).toEqual([300 + SHEEN_AFTER_REVEAL_MS, 450 + SHEEN_AFTER_REVEAL_MS])
    expect(root.querySelector<HTMLElement>('.tfx-ink')!.style.getPropertyValue('--tfx-sheen-delay')).toBe(
      `${300 + SHEEN_AFTER_REVEAL_MS}ms`,
    )
  })

  it('staggers text with no reveal timing of its own, in document order', () => {
    const root = build('<span class="tfx-ink">Line one</span><br><span class="tfx-ink">Line two</span>')
    expect(applySheenDelays(root)).toEqual([
      SHEEN_AFTER_REVEAL_MS,
      SHEEN_STAGGER_MS + SHEEN_AFTER_REVEAL_MS,
    ])
  })

  it("adds the element's own delay and the caller's base", () => {
    const root = build('<span class="tfx-ink">12</span>')
    root.style.animationDelay = '200ms'
    expect(applySheenDelays(root, 1000)).toEqual([1000 + 200 + SHEEN_AFTER_REVEAL_MS])
  })
})

/**
 * A shimmer repeats on one beat shared by the whole page, so light crosses every
 * heading on screen together instead of each on its own schedule.
 */
describe('applyShimmerDelays', () => {
  const build = (words: number) => {
    const root = document.createElement('h2')
    root.innerHTML = '<span class="tfx-ink">w</span>'.repeat(words)
    return root
  }

  it('lands on a multiple of the period on the document clock', () => {
    const now = 12_345
    const [delay] = applyShimmerDelays(build(1), [650], now)
    expect((now + delay) % SHIMMER_PERIOD_MS).toBe(0)
  })

  it('waits for the arrival pass to finish and rest first', () => {
    const now = 0
    const [delay] = applyShimmerDelays(build(1), [650], now)
    expect(delay).toBeGreaterThanOrEqual(650 + SHEEN_PASS_MS + SHIMMER_MIN_REST_MS)
  })

  // Their first repeats may fall on different beats — one heading may still be
  // resting — but every repeat after that crosses both at the same instant.
  it('keeps two headings lit at different moments in phase', () => {
    const a = applyShimmerDelays(build(1), [650], 1_000)[0] + 1_000
    const b = applyShimmerDelays(build(1), [650], 4_700)[0] + 4_700
    expect(a % SHIMMER_PERIOD_MS).toBe(0)
    expect(b % SHIMMER_PERIOD_MS).toBe(0)
    expect(a).not.toBe(b)
  })

  it("keeps a heading's reading-order stagger within the beat", () => {
    const root = build(3)
    const delays = applyShimmerDelays(root, [650, 760, 870], 0)
    expect([delays[1] - delays[0], delays[2] - delays[0]]).toEqual([110, 220])
    expect(root.querySelectorAll<HTMLElement>('.tfx-ink')[2].style.getPropertyValue('--tfx-shimmer-delay')).toBe(
      `${delays[2]}ms`,
    )
  })
})

/**
 * The studio preview changes a slot's light on an element that is already on
 * screen and already lit, so the observer has to tell that apart from Vue
 * re-patching the same classes, and light the element afresh.
 */
describe('lighting', () => {
  class FakeIntersectionObserver {
    static last: FakeIntersectionObserver | null = null
    observed = new Set<Element>()
    constructor(private readonly callback: IntersectionObserverCallback) {
      FakeIntersectionObserver.last = this
    }
    observe(el: Element) {
      this.observed.add(el)
    }
    unobserve(el: Element) {
      this.observed.delete(el)
    }
    disconnect() {
      this.observed.clear()
    }
    /** Everything being watched scrolls into view. */
    reveal() {
      const entries = [...this.observed].map((target) => ({ target, isIntersecting: true }))
      this.callback(entries as unknown as IntersectionObserverEntry[], this as never)
    }
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  const mountLit = () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
    const config = ref<TextEffectsConfig | null>({ primary: { finish: 'foil' } })
    // A child: `inject` never sees a `provide` made by the same component.
    const Name = defineComponent({
      setup() {
        const fx = useTextEffect()
        return () => h('h2', { class: fx('primary') }, [h('span', { class: 'tfx-ink' }, 'Sofia')])
      },
    })
    const Host = defineComponent({
      setup() {
        provideTextEffects(config)
        return () => h(Name)
      },
    })
    const wrapper = mount(Host, { attachTo: document.body })
    const heading = () => wrapper.find('h2').element as HTMLElement
    // MutationObserver records are delivered as a microtask after the patch.
    const settle = async () => {
      await nextTick()
      await new Promise((done) => setTimeout(done))
    }
    return { config, heading, settle, io: () => FakeIntersectionObserver.last! }
  }

  it('records the light it plays, and relights when the partner changes it', async () => {
    const { config, heading, settle, io } = mountLit()
    io().reveal()
    expect(heading().getAttribute('data-tfx-lit')).toBe('sheen')

    config.value = { primary: { finish: 'foil', animation: 'shimmer' } }
    await settle()
    expect(heading().hasAttribute('data-tfx-lit')).toBe(false)

    io().reveal()
    expect(heading().getAttribute('data-tfx-lit')).toBe('shimmer')
    expect(heading().querySelector<HTMLElement>('.tfx-ink')!.style.getPropertyValue('--tfx-shimmer-delay')).toMatch(
      /^\d+ms$/,
    )

    config.value = { primary: { finish: 'foil', animation: 'none' } }
    await settle()
    io().reveal()
    expect(heading().getAttribute('data-tfx-lit')).toBe('none')
  })

  it('leaves a lit element alone when its classes are re-patched unchanged', async () => {
    const { config, heading, settle, io } = mountLit()
    io().reveal()
    config.value = { primary: { finish: 'foil', metal: 'gold' } }
    await settle()
    expect(heading().getAttribute('data-tfx-lit')).toBe('sheen')
  })
})
