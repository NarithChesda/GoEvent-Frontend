import { PARTNER_TEMPLATE_ASSET_FIELDS, type PartnerTemplateAssetField } from '../partnerTemplateAssets'

/**
 * Every media field the form holds, which is every asset a stage renders plus
 * `preview_image` — the gallery thumbnail, which no stage draws and the live
 * preview therefore doesn't carry (see PARTNER_TEMPLATE_ASSET_FIELDS).
 *
 * Deriving the list rather than writing it out is the point: the 22 fields used
 * to appear as 22 `x: File | null` lines in the form state and 22 `x: null`
 * lines in its defaults, with nothing tying either list to the one the preview
 * and the save path iterate. A field added to the type but missed in the
 * defaults is a control bound to `undefined`.
 */
export const TEMPLATE_FORM_ASSET_FIELDS = [
  'preview_image',
  ...PARTNER_TEMPLATE_ASSET_FIELDS,
] as const

export type TemplateFormAssetField = PartnerTemplateAssetField | 'preview_image'

/** Files chosen in this editing session and not yet uploaded. */
export type AssetsFormState = Record<TemplateFormAssetField, File | null>

export const defaultAssets = (): AssetsFormState =>
  Object.fromEntries(TEMPLATE_FORM_ASSET_FIELDS.map((field) => [field, null])) as AssetsFormState

/**
 * Assets are never hydrated into the form: a saved file lives on the server as a
 * URL, and the form's slot means "a replacement chosen in this session". The
 * saved URL is read straight off `props.existingTemplate` where it is displayed,
 * and a removal is staged separately (see `clearedAssets`), because neither a
 * pending File nor an untouched URL can express "delete this".
 */
export const hydrateAssets = (): AssetsFormState => defaultAssets()
