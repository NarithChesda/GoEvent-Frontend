import { onUnmounted, ref, type Ref } from 'vue'
import { gsap, ScrollTrigger } from '../../plugins/gsap'

/**
 * Motion tier for the V2 storybook showcase.
 *
 * - `rich`: full motion — scrubbed timelines, pinning, parallax.
 * - `lite`: low-end device — simple triggered fades only (no scrub/pin),
 *   because scrub + pin are the most expensive ScrollTrigger operations
 *   on weak mobile GPUs.
 * - `reduced`: user prefers reduced motion — instant/short opacity fades only.
 */
export type MotionTier = 'rich' | 'lite' | 'reduced'

export interface StoryMotionContext {
  gsap: typeof gsap
  ScrollTrigger: typeof ScrollTrigger
  /** Current motion tier the build callback is running under. */
  tier: MotionTier
  /** Convenience flag: scrub/pin/parallax allowed. */
  rich: boolean
}

/** Heuristic low-end device detection (no dedicated tier signal exists yet). */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean; effectiveType?: string }
  }
  if (nav.connection?.saveData) return true
  const slowNet =
    nav.connection?.effectiveType === '2g' || nav.connection?.effectiveType === 'slow-2g'
  const lowCpu = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 3
  const lowMem = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2
  return slowNet || lowCpu || lowMem
}

/**
 * Shared GSAP + ScrollTrigger boilerplate for showcase-v2 section components.
 *
 * Wraps `gsap.matchMedia()` (keyed to `prefers-reduced-motion`) and
 * `gsap.context()` scoping so section components stay declarative:
 *
 * ```ts
 * const root = ref<HTMLElement | null>(null)
 * const { createStory } = useScrollStory(root)
 * onMounted(() => {
 *   createStory(({ gsap, rich }) => {
 *     gsap.from('.chapter-card', { y: 40, opacity: 0, scrollTrigger: { ... } })
 *   })
 * })
 * ```
 *
 * Cleanup is automatic and mandatory: `mm.revert()` runs in `onUnmounted`,
 * killing every tween/ScrollTrigger created inside the callback. An uncleaned
 * ScrollTrigger leaks across SPA route navigations and breaks the next
 * showcase a user visits — never create GSAP animations outside `createStory`.
 */
export function useScrollStory(root: Ref<HTMLElement | null>) {
  const matchMedias: gsap.MatchMedia[] = []
  const tier = ref<MotionTier>(isLowEndDevice() ? 'lite' : 'rich')

  /**
   * Run a motion build callback inside a reduced-motion-aware, component-scoped
   * GSAP context. Call from `onMounted` (or later, e.g. after data arrives).
   *
   * @param build   Full-motion build. Receives the motion context; check
   *                `rich` before creating scrub/pin/parallax effects. May
   *                return a cleanup function (e.g. to remove DOM listeners) —
   *                it runs when the context reverts (unmount or media change).
   * @param buildReduced Optional dedicated reduced-motion build. When omitted,
   *                targets are simply left visible (no animation) under
   *                `prefers-reduced-motion: reduce`.
   */
  const createStory = (
    build: (ctx: StoryMotionContext) => void | (() => void),
    buildReduced?: (ctx: StoryMotionContext) => void | (() => void),
  ) => {
    const scope = root.value ?? undefined
    const mm = gsap.matchMedia(scope)
    matchMedias.push(mm)

    mm.add(
      {
        reduce: '(prefers-reduced-motion: reduce)',
        noReduce: '(prefers-reduced-motion: no-preference)',
      },
      (mmCtx) => {
        const conditions = mmCtx.conditions as { reduce: boolean; noReduce: boolean }
        if (conditions.reduce) {
          return buildReduced?.({ gsap, ScrollTrigger, tier: 'reduced', rich: false })
        }
        const currentTier = isLowEndDevice() ? 'lite' : 'rich'
        tier.value = currentTier
        // matchMedia auto-reverts tweens/ScrollTriggers created here on change;
        // the returned function handles anything GSAP can't track (listeners)
        return build({ gsap, ScrollTrigger, tier: currentTier, rich: currentTier === 'rich' })
      },
    )

    return mm
  }

  onUnmounted(() => {
    // Hard requirement: revert every tween + ScrollTrigger this component made
    matchMedias.forEach((mm) => mm.revert())
    matchMedias.length = 0
  })

  return { createStory, tier }
}

let refreshQueued = false

/**
 * Ask ScrollTrigger to recalculate trigger positions after late-arriving layout
 * (custom fonts, template assets, images). Batched to one refresh per frame.
 */
export function refreshScrollTriggers() {
  if (refreshQueued) return
  refreshQueued = true
  requestAnimationFrame(() => {
    refreshQueued = false
    ScrollTrigger.refresh()
  })
}
