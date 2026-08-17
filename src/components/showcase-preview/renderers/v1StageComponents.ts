/**
 * V1 preview-frame stage components, code-split per stage.
 *
 * A preview frame renders exactly ONE stage — whichever `?stage=` its URL asks
 * for. Importing all of them statically (as V1PreviewFrame.vue used to) merged
 * CoverStage, TransitionStage, TransitionStageDoor, MainContentStage and
 * everything MainContentStage reaches — the agenda, RSVP form, comment section
 * (which pulls the whole sign-in card), payment section, photo modal — into one
 * ~555kB JS + ~221kB CSS chunk that every frame downloaded and parsed. The
 * Cover frame was paying for the comment form; the Transition frame was paying
 * for both.
 *
 * Split this way each frame pulls only its own stage, and the studio's frames
 * fetch different chunks in parallel instead of queueing on one big shared one.
 *
 * `warmV1StageChunks` exists because the frame component itself only mounts
 * once the showcase data has loaded: without it the chunk fetch would start
 * only after the network round trip finished, serialising two waits that have
 * no reason to be sequential. The frame shell calls it on mount, off the URL's
 * stage, so the chunk downloads alongside the data fetch.
 */

import { defineAsyncComponent } from 'vue'

const loadCoverStage = () => import('@/components/showcase/CoverStage.vue')
const loadMainContentStage = () => import('@/components/showcase/MainContentStage.vue')
const loadTransitionStage = () => import('@/components/showcase/TransitionStage.vue')
const loadTransitionStageDoor = () => import('@/components/showcase/TransitionStageDoor.vue')
const loadEventVideoStage = () => import('./V1EventVideoStage.vue')
const loadPhotoModal = () => import('@/components/showcase/PhotoModal.vue')
const loadCoverLayoutEditor = () =>
  import('@/components/showcase-preview/edit/CoverLayoutEditor.vue')

export const CoverStage = defineAsyncComponent(loadCoverStage)
export const MainContentStage = defineAsyncComponent(loadMainContentStage)
export const TransitionStage = defineAsyncComponent(loadTransitionStage)
export const TransitionStageDoor = defineAsyncComponent(loadTransitionStageDoor)
export const V1EventVideoStage = defineAsyncComponent(loadEventVideoStage)
export const PhotoModal = defineAsyncComponent(loadPhotoModal)
export const CoverLayoutEditor = defineAsyncComponent(loadCoverLayoutEditor)

/**
 * Start fetching the chunks a given stage will need, without waiting for them.
 *
 * Which transition variant applies (swinging door vs. veil) depends on template
 * data that isn't loaded yet at call time, so the transition stage warms both —
 * they're the two smallest stages, and warming the wrong one costs a cached
 * request nobody blocks on. Everything else maps to exactly one chunk.
 *
 * Repeat calls are free: these resolve through the ES module registry, which
 * hands back the same promise, so this never double-fetches.
 */
export function warmV1StageChunks(stage: string): void {
  const loaders: Array<() => Promise<unknown>> =
    stage === 'main'
      ? [loadCoverStage, loadMainContentStage]
      : stage === 'cover'
        ? [loadCoverStage]
        : stage === 'transition'
          ? [loadTransitionStage, loadTransitionStageDoor]
          : stage === 'event_video'
            ? [loadEventVideoStage]
            : []

  for (const load of loaders) {
    // Failures are ignored on purpose: this is a warm-up, and the real render
    // path re-runs the same loader and surfaces the error there.
    load().catch(() => {})
  }
}
