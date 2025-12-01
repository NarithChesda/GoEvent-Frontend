import { computed, type Ref, type ComputedRef } from 'vue'
import { useTemplateProcessor } from './useTemplateProcessor'
import { useWindowDimensions } from './useWindowDimensions'

/**
 * Props interface for decoration images
 * Supports both cover stage and main content stage decoration names
 */
export interface DecorationProps {
  // Cover stage decorations
  coverLeftDecoration?: string | null
  coverRightDecoration?: string | null
  coverTopDecoration?: string | null
  coverBottomDecoration?: string | null
  // Main content stage decorations
  leftDecoration?: string | null
  rightDecoration?: string | null
  topDecoration?: string | null
  bottomDecoration?: string | null
}

/**
 * Return type for useOptimizedDecorations composable
 */
export interface OptimizedDecorationUrls {
  leftDecorationUrl: ComputedRef<string | null>
  rightDecorationUrl: ComputedRef<string | null>
  topDecorationUrl: ComputedRef<string | null>
  bottomDecorationUrl: ComputedRef<string | null>
}

/**
 * Optimized Decorations Composable
 *
 * Centralizes the logic for generating optimized decoration image URLs
 * using ImageKit transformations with reactive window dimensions.
 *
 * This eliminates code duplication across CoverContentOverlay, MainContentStage,
 * and VideoContainer components.
 *
 * @param props - Reactive props object or ref containing decoration URLs
 * @param prefix - Optional prefix for prop names ('cover' for cover stage, empty for main stage)
 * @returns Object with computed optimized decoration URLs
 *
 * @example
 * // For cover stage decorations
 * const { leftDecorationUrl, rightDecorationUrl, topDecorationUrl, bottomDecorationUrl } =
 *   useOptimizedDecorations(props, 'cover')
 *
 * @example
 * // For main content stage decorations
 * const { leftDecorationUrl, rightDecorationUrl, topDecorationUrl, bottomDecorationUrl } =
 *   useOptimizedDecorations(props)
 */
export function useOptimizedDecorations(
  props: DecorationProps | Ref<DecorationProps>,
  prefix: 'cover' | '' = ''
): OptimizedDecorationUrls {
  const { getOptimizedMediaUrl } = useTemplateProcessor()
  const { width, height } = useWindowDimensions()

  // Helper to get prop value whether props is a ref or plain object
  const getPropValue = (key: keyof DecorationProps): string | null | undefined => {
    const propsValue = 'value' in props ? props.value : props
    return propsValue[key]
  }

  // Determine which prop names to use based on prefix
  const leftKey = prefix === 'cover' ? 'coverLeftDecoration' : 'leftDecoration'
  const rightKey = prefix === 'cover' ? 'coverRightDecoration' : 'rightDecoration'
  const topKey = prefix === 'cover' ? 'coverTopDecoration' : 'topDecoration'
  const bottomKey = prefix === 'cover' ? 'coverBottomDecoration' : 'bottomDecoration'

  // Left/Right decorations: height = viewport height, width auto-calculated
  const leftDecorationUrl = computed(() => {
    const url = getPropValue(leftKey)
    return url ? getOptimizedMediaUrl(url, { height: height.value }) : null
  })

  const rightDecorationUrl = computed(() => {
    const url = getPropValue(rightKey)
    return url ? getOptimizedMediaUrl(url, { height: height.value }) : null
  })

  // Top/Bottom decorations: width = viewport width, height auto-calculated
  const topDecorationUrl = computed(() => {
    const url = getPropValue(topKey)
    return url ? getOptimizedMediaUrl(url, { width: width.value }) : null
  })

  const bottomDecorationUrl = computed(() => {
    const url = getPropValue(bottomKey)
    return url ? getOptimizedMediaUrl(url, { width: width.value }) : null
  })

  return {
    leftDecorationUrl,
    rightDecorationUrl,
    topDecorationUrl,
    bottomDecorationUrl,
  }
}

/**
 * Optimized Background Images Composable
 *
 * Generates optimized URLs for full-viewport background images
 * (decoration photo and background photo).
 *
 * @param decorationPhoto - URL of the decoration photo
 * @param backgroundPhoto - URL of the background photo
 * @returns Object with computed optimized URLs for both images
 *
 * @example
 * const { optimizedDecorationPhotoUrl, optimizedBackgroundPhotoUrl } =
 *   useOptimizedBackgrounds(
 *     computed(() => props.templateAssets?.basic_decoration_photo),
 *     computed(() => props.templateAssets?.basic_background_photo)
 *   )
 */
export function useOptimizedBackgrounds(
  decorationPhoto: ComputedRef<string | null | undefined> | Ref<string | null | undefined>,
  backgroundPhoto: ComputedRef<string | null | undefined> | Ref<string | null | undefined>
) {
  const { getOptimizedMediaUrl } = useTemplateProcessor()
  const { width, height } = useWindowDimensions()

  const optimizedDecorationPhotoUrl = computed(() => {
    const url = decorationPhoto.value
    return url
      ? getOptimizedMediaUrl(url, {
          width: width.value,
          height: height.value,
        })
      : null
  })

  const optimizedBackgroundPhotoUrl = computed(() => {
    const url = backgroundPhoto.value
    return url
      ? getOptimizedMediaUrl(url, {
          width: width.value,
          height: height.value,
        })
      : null
  })

  return {
    optimizedDecorationPhotoUrl,
    optimizedBackgroundPhotoUrl,
  }
}
