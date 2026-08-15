/**
 * useCopyToClipboard.ts
 *
 * Copy a string and hold a `copied` flag for a moment afterwards, so a control
 * can confirm in place — swapping its icon or label — instead of firing a toast
 * for something the user is already looking at.
 *
 * @module composables/useCopyToClipboard
 */

import { ref, onUnmounted } from 'vue'

export function useCopyToClipboard(resetDelay = 2000) {
  const copied = ref(false)
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  /** Returns whether the text actually reached the clipboard. */
  const copy = async (text: string): Promise<boolean> => {
    if (!text) return false

    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // No clipboard (insecure context, or permission denied). Stay in the idle
      // state rather than claiming a success that didn't happen.
      return false
    }

    copied.value = true
    if (resetTimer) clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      copied.value = false
    }, resetDelay)
    return true
  }

  onUnmounted(() => {
    if (resetTimer) clearTimeout(resetTimer)
  })

  return { copied, copy }
}
