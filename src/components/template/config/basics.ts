import { TEMPLATE_MENU_ORDER_DEFAULT } from '@/services/api'
import type { PartnerTemplate } from '@/services/api'

/**
 * The template's own identity: what it is called, where it sits in the menu,
 * which plan prices it, and the two presentation flags that are plain columns
 * on the record rather than keys inside a config blob.
 *
 * Keys are the flat form-state names verbatim, which is what lets the form
 * compose every module with a spread and hydrate with one `Object.assign` —
 * see config/index.ts.
 */
export interface BasicsFormState {
  name: string
  /** Menu position, lower first. See TEMPLATE_MENU_ORDER_DEFAULT. */
  order: number
  package_plan_id: number | null
  youtube_preview_url: string
  display_liquid_glass_background: boolean
}

export const defaultBasics = (): BasicsFormState => ({
  name: '',
  order: TEMPLATE_MENU_ORDER_DEFAULT,
  package_plan_id: null,
  youtube_preview_url: '',
  display_liquid_glass_background: true,
})

export function hydrateBasics(template: PartnerTemplate | null): BasicsFormState {
  if (!template) return defaultBasics()
  return {
    name: template.name,
    // `?? default` rather than `|| default`: 0 is the top of the menu, and
    // a server that has not shipped the field yet sends nothing at all.
    order: template.order ?? TEMPLATE_MENU_ORDER_DEFAULT,
    package_plan_id: template.package_plan?.id ?? null,
    youtube_preview_url: template.youtube_preview_url || '',
    display_liquid_glass_background: template.display_liquid_glass_background,
  }
}
