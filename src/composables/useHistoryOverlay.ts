/**
 * useHistoryOverlay.ts
 *
 * Binds a full-screen overlay (sheet, full-page modal) to a history entry so
 * the browser/hardware back button dismisses the overlay instead of leaving
 * the page underneath it. Without this, back on a full-screen surface is
 * destructive: it looks like a page, so back is read as "close it", but it
 * actually unmounts the whole route behind it.
 *
 * The open state lives in a query flag, which also makes the overlay
 * deep-linkable and survives a reload.
 *
 * @module composables/useHistoryOverlay
 */

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * Marks the history entries this composable pushed, so `close()` knows whether
 * popping is safe. It isn't when the user deep-linked straight into the open
 * overlay — there'd be no entry of ours behind us, and back would leave the
 * site instead of closing the sheet.
 */
const OVERLAY_STATE_KEY = '__overlay'

const readHistoryMarker = (): unknown =>
  (window.history.state as Record<string, unknown> | null)?.[OVERLAY_STATE_KEY]

/**
 * @param key Query flag that holds the open state (e.g. `preview` -> `?preview=1`).
 */
export function useHistoryOverlay(key: string) {
  const route = useRoute()
  const router = useRouter()

  const isOpen = computed(() => route.query[key] === '1')

  const open = () => {
    if (isOpen.value) return
    router.push({
      query: { ...route.query, [key]: '1' },
      state: { [OVERLAY_STATE_KEY]: key },
    })
  }

  const close = () => {
    if (!isOpen.value) return
    // Pop our own entry rather than replacing it, or the entry would linger and
    // the next back press would re-open the overlay the user just closed.
    if (readHistoryMarker() === key) {
      router.back()
      return
    }
    const query = { ...route.query }
    delete query[key]
    router.replace({ query })
  }

  return { isOpen, open, close }
}
