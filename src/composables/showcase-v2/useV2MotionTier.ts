import { onMounted, onUnmounted, ref } from 'vue'
import { isLowEndDevice } from './useScrollStory'

/**
 * Whether this device/session can sustain the heaviest V2 motion (the WebGL
 * tunnel background). Reactive to `prefers-reduced-motion` changes; the
 * low-end heuristic (CPU/memory/network) is a one-time snapshot since those
 * signals don't change mid-session.
 */
export function useV2MotionTier() {
  const rich = ref(false)
  let mql: MediaQueryList | null = null
  const update = () => {
    rich.value = !(mql?.matches ?? false) && !isLowEndDevice()
  }

  onMounted(() => {
    mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    update()
    mql.addEventListener('change', update)
  })

  onUnmounted(() => mql?.removeEventListener('change', update))

  return rich
}
