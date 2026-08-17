/**
 * defineResilientAsyncComponent
 *
 * `defineAsyncComponent` with the two behaviours a route-level lazy component
 * needs and does not get by default:
 *
 *   retries    A chunk request that fails is almost always transient — a lost
 *             connection, or a burst of parallel requests (the Design Studio
 *             fires dozens at once across its preview frames). Plain
 *             defineAsyncComponent gives up on the first failure, permanently,
 *             for the life of the page.
 *   a failure  On failure it renders NOTHING — no error, no retry, no clue.
 *   state      On a whole tab that is a blank page, which is exactly the
 *             symptom that is impossible to diagnose from a bug report.
 *
 * Everything else is left alone on purpose: no `loadingComponent`, because
 * these components mount into surfaces that already own their loading state,
 * and a second spinner underneath the first reads as a stutter.
 */

import { defineAsyncComponent, type Component } from 'vue'
import AsyncChunkError from '@/components/common/AsyncChunkError.vue'

/** Attempts AFTER the first, i.e. 3 tries in total. */
const MAX_RETRIES = 2

/** Backoff between attempts. Short — the user is looking at an empty tab. */
const RETRY_DELAY_MS = 350

/**
 * Generic in the loaded component so callers keep full typing — `InstanceType<
 * typeof SomeTab>` for a template ref, and prop checking in the template — which
 * a plain `Component` return would throw away.
 */
export function defineResilientAsyncComponent<T extends Component>(
  loader: () => Promise<T | { default: T }>,
): T {
  return defineAsyncComponent({
    loader,
    errorComponent: AsyncChunkError,
    onError(error, retry, fail, attempts) {
      if (attempts <= MAX_RETRIES) {
        setTimeout(retry, RETRY_DELAY_MS * attempts)
        return
      }
      fail()
    },
  }) as T
}
