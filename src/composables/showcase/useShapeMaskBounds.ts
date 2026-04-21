import { ref, watch, type Ref } from 'vue'

export interface ShapeMaskBounds {
  /** Left edge of the opaque region, as a ratio of the image's natural width (0–1). */
  x: number
  /** Top edge of the opaque region, as a ratio of the image's natural height (0–1). */
  y: number
  /** Width of the opaque region, as a ratio of the image's natural width (0–1). */
  width: number
  /** Height of the opaque region, as a ratio of the image's natural height (0–1). */
  height: number
  /** naturalWidth / naturalHeight of the full image. */
  aspectRatio: number
}

const cache = new Map<string, Promise<ShapeMaskBounds | null>>()

const ALPHA_THRESHOLD = 16

function analyze(url: string): Promise<ShapeMaskBounds | null> {
  const existing = cache.get(url)
  if (existing) return existing

  const promise = new Promise<ShapeMaskBounds | null>((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(null)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'

    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      if (!w || !h) {
        resolve(null)
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        resolve(null)
        return
      }

      let data: Uint8ClampedArray
      try {
        ctx.drawImage(img, 0, 0)
        data = ctx.getImageData(0, 0, w, h).data
      } catch {
        resolve(null)
        return
      }

      let minX = w
      let minY = h
      let maxX = -1
      let maxY = -1

      for (let y = 0; y < h; y++) {
        const rowStart = y * w * 4
        for (let x = 0; x < w; x++) {
          if (data[rowStart + x * 4 + 3] >= ALPHA_THRESHOLD) {
            if (x < minX) minX = x
            if (y < minY) minY = y
            if (x > maxX) maxX = x
            if (y > maxY) maxY = y
          }
        }
      }

      if (maxX < 0 || maxY < 0) {
        resolve(null)
        return
      }

      resolve({
        x: minX / w,
        y: minY / h,
        width: (maxX - minX + 1) / w,
        height: (maxY - minY + 1) / h,
        aspectRatio: w / h,
      })
    }

    img.onerror = () => resolve(null)
    img.src = url
  }).catch(() => null)

  cache.set(url, promise)
  return promise
}

/**
 * Loads the image at `url` and returns the bounding box of its opaque pixels.
 * Requires the image to be served with CORS headers (or same-origin) so the
 * canvas can be read. Falls back to `null` when unavailable — callers should
 * gracefully render the image without clipping in that case.
 */
export function useShapeMaskBounds(url: Ref<string | null | undefined>) {
  const bounds = ref<ShapeMaskBounds | null>(null)

  watch(
    url,
    async (next, _prev, onCleanup) => {
      if (!next) {
        bounds.value = null
        return
      }
      let cancelled = false
      onCleanup(() => {
        cancelled = true
      })
      const result = await analyze(next)
      if (!cancelled) bounds.value = result
    },
    { immediate: true },
  )

  return { bounds }
}
