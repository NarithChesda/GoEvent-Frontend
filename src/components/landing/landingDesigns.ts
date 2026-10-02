/**
 * Real invitation designs for the homepage, from the public catalogue.
 *
 * The page below the hero used to describe the product without showing any of
 * it. Every approved template carries a preview — a 9:16 capture of its cover —
 * on the public endpoint (`listPublicTemplates`, no account needed), so the
 * page shows the actual designs rather than an illustration of one.
 *
 * Page one only: it is the catalogue's own menu order, already more covers
 * than the page draws, and one request. The full walk is
 * useDesignCategories' job, for a different question.
 */
import { ref, shallowRef } from 'vue'
import { eventTemplateService, type PublicEventTemplate } from '@/services/api'
import { imagekitUrl } from '@/utils/mediaUrl'

export interface LandingDesign {
  id: number
  src: string
}

/** Two for the features' card stack, the rest for the design step's reel. */
export const LANDING_DESIGN_LIMIT = 12

/**
 * The previews are stored at ~337×600, which is already about 2x the reel's
 * cover. `c-at_max` lets ImageKit pick the format without ever upscaling.
 */
const COVER_TRANSFORM = 'w-400,c-at_max'

/**
 * Past this the sections stop holding skeletons and draw without covers. A late
 * answer still lands — the reel is two screens down, so it rarely moves
 * anything the reader is looking at.
 */
const WAIT_CAP_MS = 6000

/**
 * The covers worth drawing, in catalogue order. Approved only, and never a V2
 * scroll-story template: those are not drawn by the V1 showcase the catalogue
 * previews, which is the same rule the public catalogue page applies.
 */
export function pickLandingDesigns(
  templates: readonly PublicEventTemplate[],
  limit = LANDING_DESIGN_LIMIT,
): LandingDesign[] {
  const seen = new Set<string>()
  const picked: LandingDesign[] = []
  for (const template of templates) {
    const src = template.preview_image
    if (template.status !== 'approved' || template.showcase_template_version === 'v2') continue
    if (!src || seen.has(src)) continue
    seen.add(src)
    picked.push({ id: template.id, src })
    if (picked.length >= limit) break
  }
  return picked
}

/** `loading` until there is an answer, then `ready` with covers or `empty` without. */
export type LandingDesignStatus = 'loading' | 'ready' | 'empty'

export function useLandingDesigns() {
  const designs = shallowRef<LandingDesign[]>([])
  const status = ref<LandingDesignStatus>('loading')

  const load = async () => {
    const cap = setTimeout(() => {
      if (status.value === 'loading') status.value = 'empty'
    }, WAIT_CAP_MS)

    try {
      const response = await eventTemplateService.listPublicTemplates({ page: 1 })
      const picked =
        response.success && response.data ? pickLandingDesigns(response.data.results ?? []) : []
      designs.value = picked.map((design) => ({
        ...design,
        src: imagekitUrl(design.src, COVER_TRANSFORM) ?? design.src,
      }))
    } catch {
      designs.value = []
    } finally {
      clearTimeout(cap)
      status.value = designs.value.length > 0 ? 'ready' : 'empty'
    }
  }

  return { designs, status, load }
}
