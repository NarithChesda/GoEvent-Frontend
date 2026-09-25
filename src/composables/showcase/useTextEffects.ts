import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  watch,
  type InjectionKey,
  type Ref,
} from 'vue'
import type {
  TextEffectAnimation,
  TextEffectConfig,
  TextEffectFinish,
  TextEffectMetal,
  TextEffectSlot,
  TextEffectsConfig,
} from '@/services/api/types/template.types'
import '@/components/showcase/text-effects.css'

/**
 * Metallic lettering (`template_assets.text_effects`), resolved per font slot.
 *
 * ## The model
 *
 * A finish belongs to a font SLOT, the way a typeface does: `primary: foil`
 * means every piece of display text the showcase draws in the primary slot is
 * struck in foil, in whichever typeface that slot resolves to for the guest's
 * language. So the effect follows the font across the cover, the transition and
 * the invitation without any stage knowing about any other.
 *
 * "Display text" is deliberate. The same slot also carries body copy, RSVP
 * labels, payment details and buttons, and a gradient at 14px is not foil, it
 * is mud — real foil-stamped cards gild the names and the headings and print
 * everything else in ink. So an element opts IN by carrying the classes this
 * returns; nothing is gilded by matching a font.
 *
 * ## The markup contract (both halves are required)
 *
 * 1. `:class="fx('primary')"` on **the element that sets that slot's
 *    font-family** — never on a container holding text in more than one slot,
 *    or a secondary line inside it would be gilded by its primary parent.
 * 2. Every run of text inside it wrapped in `<span class="tfx-ink">`. That is
 *    where the metal is painted. Inert without a `.tfx` ancestor, so it is safe
 *    to render unconditionally (AutoFitText and WelcomeHeader always do).
 *
 * Why the ink span, rather than painting the element itself:
 *
 * - The showcase's headings are per-word `inline-block` spans whose reveal
 *   animation leaves a `transform` behind. Each is its own stacking context, and
 *   `background-clip: text` on a parent does not reach text painted in a child
 *   stacking context — the words inherit a transparent fill with nothing behind
 *   it and render as nothing. (StdScript.vue documents the same trap.)
 * - `background-clip: text` never paints outside its own box. Script swashes,
 *   long descenders and Khmer subscripts routinely overhang a tight line box, and
 *   clipped there they just disappear — "and" in a script face lost the top of
 *   its d. The ink span pads its box to cover the overhang and pays the padding
 *   back with an equal negative margin, which an inline box can do without
 *   moving a single glyph. The heading's own box can't: its margins belong to
 *   its component.
 */

export const TEXT_EFFECT_FINISHES: readonly TextEffectFinish[] = ['foil', 'relief']
export const TEXT_EFFECT_METALS: readonly TextEffectMetal[] = ['gold', 'rose_gold', 'silver']
export const TEXT_EFFECT_ANIMATIONS: readonly TextEffectAnimation[] = ['none', 'sheen', 'shimmer']
export const TEXT_EFFECT_SLOTS: readonly TextEffectSlot[] = [
  'primary',
  'secondary',
  'accent',
  'decorative',
]

export const DEFAULT_TEXT_EFFECT_METAL: TextEffectMetal = 'gold'
export const DEFAULT_TEXT_EFFECT_ANIMATION: TextEffectAnimation = 'sheen'

/**
 * One solid tone per metal, for marks drawn *beside* gilded text that cannot
 * carry the fill themselves — an activity icon, a drawn rule.
 *
 * The lettering's metal is a gradient clipped to the glyphs, which needs a text
 * box to paint into: an inline SVG has none, and `background-clip` cannot reach
 * it. So a mark takes one tone of the same palette instead, and the question is
 * only which.
 *
 * It is `--tfx-low`, the shadow-side tone, for all three — **not** the bright
 * body tone the letters read as. The lettering is legible on a cream card
 * because of its rim (`-webkit-text-stroke` in text-effects.css); a mark has no
 * rim, and an icon filled in `--tfx-face` on a pale invitation is the washed-out
 * shape that finish exists to avoid. `--tfx-low` is the darkest tone still
 * unmistakably the metal, and it is a tone of the palette rather than a colour
 * invented here — a retune of the palette moves it too.
 *
 * Kept in step with the `.tfx--<metal>` blocks in text-effects.css by hand,
 * which is why each value names the token it copies.
 */
export const TEXT_EFFECT_MARK_INK: Record<TextEffectMetal, string> = {
  gold: '#c1812a', // --tfx-low
  rose_gold: '#bd7563', // --tfx-low
  silver: '#939aa5', // --tfx-low
}

/**
 * The same, for a mark on a DARK ground — a photograph under a scrim, where the
 * countdown's strips set their unit labels beside gilded figures.
 *
 * The reasoning above inverts there. `--tfx-low` is the tone that holds up on
 * cream, and on a dark ground it is the one that sinks (about 3:1 over a
 * scrimmed mid-tone photo, where the pale side is past 8:1). What the lettering
 * reads as on dark is its body, so a mark takes `--tfx-face`.
 */
export const TEXT_EFFECT_MARK_INK_ON_DARK: Record<TextEffectMetal, string> = {
  gold: '#efc762', // --tfx-face
  rose_gold: '#eebca6', // --tfx-face
  silver: '#d9dde3', // --tfx-face
}

/** A slot's finish with every default applied. */
export interface ResolvedTextEffect {
  finish: TextEffectFinish
  metal: TextEffectMetal
  animation: TextEffectAnimation
}

export type ResolvedTextEffects = Partial<Record<TextEffectSlot, ResolvedTextEffect>>

/**
 * One slot's stored value, or `null` for no finish.
 *
 * An unknown `finish` is treated as absent rather than as an error, the same
 * rule the design dispatchers follow: the value is backend-served, and a
 * template saved against a newer option set must still render its text — just
 * not gilded. An unknown `metal` keeps the finish and falls back to gold, since
 * the partner clearly asked for metal; an unknown `animation` falls back to the
 * single pass, which is what every finish did before the option existed.
 */
export function resolveTextEffect(
  config: TextEffectConfig | null | undefined,
): ResolvedTextEffect | null {
  if (!config || !TEXT_EFFECT_FINISHES.includes(config.finish)) return null
  const metal =
    config.metal && TEXT_EFFECT_METALS.includes(config.metal)
      ? config.metal
      : DEFAULT_TEXT_EFFECT_METAL
  const animation =
    config.animation && TEXT_EFFECT_ANIMATIONS.includes(config.animation)
      ? config.animation
      : DEFAULT_TEXT_EFFECT_ANIMATION
  return { finish: config.finish, metal, animation }
}

/** Every slot that has a finish; slots without one are simply missing. */
export function resolveTextEffects(config: TextEffectsConfig | null | undefined): ResolvedTextEffects {
  const resolved: ResolvedTextEffects = {}
  if (!config || typeof config !== 'object') return resolved
  for (const slot of TEXT_EFFECT_SLOTS) {
    const effect = resolveTextEffect(config[slot])
    if (effect) resolved[slot] = effect
  }
  return resolved
}

/**
 * The classes that strike an element in a slot's finish, or none.
 *
 * `metal` is emitted with its underscore (`tfx--rose_gold`) so the class is the
 * stored value verbatim — one spelling to search for.
 *
 * The animation class styles nothing. It is how the choice reaches the element
 * through the one channel every call site already binds (`:class="fx(slot)"`);
 * the lighting observer reads it and writes the light it plays into
 * `data-tfx-lit`, which is what the stylesheet keys on.
 */
export function textEffectClasses(effect: ResolvedTextEffect | null | undefined): string[] {
  if (!effect) return []
  return ['tfx', `tfx--${effect.finish}`, `tfx--${effect.metal}`, `tfx--anim-${effect.animation}`]
}

const TextEffectsKey: InjectionKey<Ref<ResolvedTextEffects>> = Symbol('showcaseTextEffects')

/**
 * Make a template's finishes available to every stage below.
 *
 * Provided once by whatever mounts the V1 stages (the live showcase and the
 * preview frame), because the elements that need it sit anywhere from one to
 * five component layers down, behind host-layout and design dispatchers. A
 * prop for it would have to be threaded through ~30 components that have no
 * other interest in it — the same reason the edit context is injected.
 */
export function provideTextEffects(config: Ref<TextEffectsConfig | null | undefined>): void {
  const resolved = computed(() => resolveTextEffects(config.value))
  provide(TextEffectsKey, resolved)
  // Nothing to light on a template with no finish, so it pays for no observers.
  useSheenLighting(computed(() => Object.keys(resolved.value).length > 0))
}

// ---------------------------------------------------------------------------
// Light
//
// Gold on a screen is recognised by light moving across it — paint doesn't
// catch light, metal does — so a gilded element gets a pass of light
// (text-effects.css, `tfxSheen`) when a guest can actually see it, and, if the
// template chose `shimmer`, again on a slow shared beat. This is the part that
// decides "when": on screen, after the element's own words have arrived, and
// in reading order.

/** How long after a run of text starts arriving before light may cross it. */
export const SHEEN_AFTER_REVEAL_MS = 650
/** One pass of light — `tfxSheen`'s duration in text-effects.css. */
export const SHEEN_PASS_MS = 1200
/**
 * The shimmer's beat — `tfxShimmer`'s duration in text-effects.css, whose 20%
 * keyframe is one SHEEN_PASS_MS of it. Change the three together.
 */
export const SHIMMER_PERIOD_MS = 6000
/**
 * The least quiet between the arrival pass and the first repeat, so a heading
 * that arrives just before a beat isn't crossed twice in a row.
 */
export const SHIMMER_MIN_REST_MS = 2000
/** Between consecutive runs of text that carry no reveal timing of their own. */
export const SHEEN_STAGGER_MS = 110
/**
 * After the Save the Date block is revealed, on top of its stage's own
 * `--std-t0`. Its designs arrive over ~1.5s of their own choreography, which no
 * inline delay exposes, so the pass waits for that instead.
 */
export const SHEEN_AFTER_STD_REVEAL_MS = 1700

/** `1.05s` / `250ms` → milliseconds. Anything unparseable → 0. */
export function parseCssTimeMs(value: string | null | undefined): number {
  const text = (value ?? '').trim()
  const amount = Number.parseFloat(text)
  if (!Number.isFinite(amount)) return 0
  return text.endsWith('ms') ? amount : amount * 1000
}

/**
 * Give every ink span in `root` its own start time, and return them.
 *
 * Headings reveal word by word, each word's `.bounce-word` carrying its own
 * inline `animation-delay`. Reading that delay is what lets the light follow
 * the words in as they appear, instead of crossing words that are still
 * invisible — or, worse, crossing every word of a line at the same instant,
 * which reads as a pattern rather than as one light moving. Text with no reveal
 * timing of its own is staggered in document order instead.
 */
export function applySheenDelays(root: HTMLElement, baseMs = 0): number[] {
  const rootDelay = parseCssTimeMs(root.style.animationDelay)
  return Array.from(root.querySelectorAll<HTMLElement>('.tfx-ink')).map((ink, index) => {
    const carrier = ink.parentElement
    const ownDelay =
      carrier && carrier !== root && carrier.style.animationDelay
        ? parseCssTimeMs(carrier.style.animationDelay)
        : null
    const start = ownDelay ?? index * SHEEN_STAGGER_MS
    const ms = Math.round(baseMs + rootDelay + start + SHEEN_AFTER_REVEAL_MS)
    ink.style.setProperty('--tfx-sheen-delay', `${ms}ms`)
    return ms
  })
}

/**
 * Put every ink span's repeat on the shared beat, and return the delays.
 *
 * `sheenDelays` are the arrival delays `applySheenDelays` just gave the same
 * spans, and `now` is the document clock (`performance.now()`) — the clock an
 * animation delay is counted from. The beat is a multiple of the period on that
 * clock, so two headings lit seconds apart still repeat at the same instant,
 * and light crosses the card together rather than heading by heading. Within a
 * heading each word keeps its arrival stagger, so the repeat still reads in
 * order.
 */
export function applyShimmerDelays(root: HTMLElement, sheenDelays: number[], now: number): number[] {
  if (!sheenDelays.length) return []
  const first = Math.min(...sheenDelays)
  const arrived = now + Math.max(...sheenDelays) + SHEEN_PASS_MS + SHIMMER_MIN_REST_MS
  const beat = Math.ceil(arrived / SHIMMER_PERIOD_MS) * SHIMMER_PERIOD_MS
  return Array.from(root.querySelectorAll<HTMLElement>('.tfx-ink')).map((ink, index) => {
    const ms = Math.round(beat - now + (sheenDelays[index] ?? first) - first)
    ink.style.setProperty('--tfx-shimmer-delay', `${ms}ms`)
    return ms
  })
}

/** The light an element's finish asked for, read off its animation class. */
export function textEffectAnimationOf(el: Element): TextEffectAnimation {
  return (
    TEXT_EFFECT_ANIMATIONS.find((animation) => el.classList.contains(`tfx--anim-${animation}`)) ??
    DEFAULT_TEXT_EFFECT_ANIMATION
  )
}

const LIT_ATTRIBUTE = 'data-tfx-lit'

/**
 * Watches the document for gilded elements and lights each once it is on
 * screen.
 *
 * The lit flag is a data attribute, not a class: Vue owns every element's
 * `class` through its `:class` binding and rewrites it on the next patch, which
 * would silently strip a class added here and cut the pass off mid-sweep. Its
 * value is the light being played (`none` included), so a partner changing the
 * option in the studio can be told apart from Vue re-patching the same classes.
 */
function useSheenLighting(active: Ref<boolean>): void {
  let intersections: IntersectionObserver | null = null
  let mutations: MutationObserver | null = null
  let tracked = new WeakSet<Element>()

  const stdBaseMs = (std: HTMLElement) =>
    parseCssTimeMs(getComputedStyle(std).getPropertyValue('--std-t0')) + SHEEN_AFTER_STD_REVEAL_MS

  const light = (root: HTMLElement, baseMs: number) => {
    if (root.hasAttribute(LIT_ATTRIBUTE)) return
    // `script` draws its own gleam across its label; a second pass would double it.
    if (root.classList.contains('script-stack')) return
    const animation = textEffectAnimationOf(root)
    if (animation !== 'none') {
      const delays = applySheenDelays(root, baseMs)
      if (animation === 'shimmer') applyShimmerDelays(root, delays, performance.now())
    }
    root.setAttribute(LIT_ATTRIBUTE, animation)
  }

  // A finish switched on in the studio lands on an element that already exists,
  // and a light switched there lands on one that may already be playing another.
  // Forgetting it lets the observer light it afresh with the new one.
  const onFinishClassChange = (el: HTMLElement) => {
    const lit = el.getAttribute(LIT_ATTRIBUTE)
    if (lit !== null && lit !== textEffectAnimationOf(el)) {
      el.removeAttribute(LIT_ATTRIBUTE)
      tracked.delete(el)
    }
    track(el)
  }

  const track = (el: Element) => {
    if (tracked.has(el) || !intersections) return
    tracked.add(el)
    intersections.observe(el)
  }

  const scan = (node: Element) => {
    if (node.classList.contains('tfx')) track(node)
    node.querySelectorAll('.tfx').forEach(track)
  }

  // The Save the Date reveals on a class its stage flips, long after it is
  // mounted and on screen — so it is lit by that flip, not by visibility. The
  // preview's replay flips it back off; clearing the flag there lets the pass
  // play again with the block.
  const onStdClassChange = (std: HTMLElement) => {
    const roots = std.querySelectorAll<HTMLElement>('.tfx')
    if (std.classList.contains('is-revealed')) {
      roots.forEach((root) => light(root, stdBaseMs(std)))
    } else {
      roots.forEach((root) => root.removeAttribute(LIT_ATTRIBUTE))
    }
  }

  const start = () => {
    if (intersections || typeof window === 'undefined') return
    if (!('IntersectionObserver' in window) || !('MutationObserver' in window)) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    intersections = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const root = entry.target as HTMLElement
          const std = root.closest<HTMLElement>('.std')
          // Not yet revealed: keep observing; the class flip lights it.
          if (std && !std.classList.contains('is-revealed')) continue
          light(root, std ? stdBaseMs(std) : 0)
          intersections?.unobserve(root)
        }
      },
      { threshold: 0.5 },
    )

    mutations = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'childList') {
          record.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) scan(node)
          })
          continue
        }
        const el = record.target
        if (!(el instanceof HTMLElement)) continue
        if (el.classList.contains('tfx')) onFinishClassChange(el)
        if (el.classList.contains('std')) onStdClassChange(el)
      }
    })
    // `class` only: the lit flag is an attribute this code writes, and
    // observing it would feed every write straight back in.
    mutations.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class'],
    })

    scan(document.body)
    document.querySelectorAll<HTMLElement>('.std.is-revealed').forEach(onStdClassChange)
  }

  const stop = () => {
    intersections?.disconnect()
    mutations?.disconnect()
    intersections = null
    mutations = null
    tracked = new WeakSet()
  }

  // `post`, so a finish switched on in the studio has reached the DOM before the
  // first scan looks for it.
  watch(active, (on) => (on ? start() : stop()), { flush: 'post' })
  onMounted(() => {
    if (active.value) start()
  })
  onBeforeUnmount(stop)
}

/**
 * `fx(slot)` → the classes for that slot's finish, `[]` when it has none.
 *
 * Call it from the template (`:class="fx('primary')"`) so the render tracks the
 * injected ref and a partner's change re-renders live. With no provider — a
 * stage mounted on its own, a unit test — every slot simply has no finish.
 */
export function useTextEffect(): (slot: TextEffectSlot | null | undefined) => string[] {
  const effects = inject(TextEffectsKey, null)
  return (slot) => (effects && slot ? textEffectClasses(effects.value[slot]) : [])
}

/**
 * `markInk(slot)` → the solid metal tone for marks drawn beside that slot's
 * gilded text, or `null` when the slot has no finish.
 *
 * Separate from `fx` because these two answer different questions. `fx` gilds
 * *text*, by handing an element classes that paint a gradient through it; this
 * hands back a colour, for the things next to that text which can only be one
 * — an inline SVG, a rule, anything whose paint is a single value. A slot with
 * no finish returns `null`, which every caller reads as "use the ink you
 * already used", so nothing needs a second branch for the ungilded case.
 *
 * See TEXT_EFFECT_MARK_INK for why it is not the tone the letters read as —
 * on a pale ground. `ground: 'dark'` is for a mark on a photograph or a dark
 * surface, where it is (TEXT_EFFECT_MARK_INK_ON_DARK).
 */
export function useTextEffectMarkInk(): (
  slot: TextEffectSlot | null | undefined,
  ground?: 'light' | 'dark',
) => string | null {
  const effects = inject(TextEffectsKey, null)
  return (slot, ground = 'light') => {
    const effect = effects && slot ? effects.value[slot] : null
    if (!effect) return null
    return (ground === 'dark' ? TEXT_EFFECT_MARK_INK_ON_DARK : TEXT_EFFECT_MARK_INK)[effect.metal]
  }
}
