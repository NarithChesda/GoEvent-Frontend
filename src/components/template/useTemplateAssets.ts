import { computed, reactive, ref, type Ref } from 'vue'
import type { PartnerTemplate } from '@/services/api'

import { TEMPLATE_FORM_ASSET_FIELDS, type FormState, type TemplateFormAssetField } from './config'

/**
 * Saved assets the partner has asked to remove.
 *
 * Held apart from `form` because these aren't values being edited — they're
 * deletions staged against the server's copy, and they only reach it on Save
 * (see handleSave, which sends `''` for each). Everything else the form holds is
 * either a pending File or an untouched saved URL, neither of which can express
 * "delete this".
 */
export type ClearableAssetField = TemplateFormAssetField

/**
 * The asset fields that show a thumbnail of the pending pick, and therefore need
 * an object URL held for them until it is replaced or revoked.
 *
 * A list rather than six named refs, because it was six named refs: the mapping
 * from field to preview was then written out by hand in `handleFileChange` (six
 * `if (field === ...)` branches) and again in `clearAssetField` (four — the two
 * that were missing simply leaked their object URL), and a third time, partially,
 * in the reopen reset. One table, read three times, is the only way those agree.
 */
const PREVIEWED_ASSET_FIELDS = [
  'preview_image',
  'basic_background_photo',
  'falling_effect_custom_image',
  'spark_custom_image',
  'host_divider_image',
  'cover_host_separator_image',
  'cover_photo_frame_image',
  'cover_photo_shape_image',
] as const

export type PreviewedAssetField = (typeof PREVIEWED_ASSET_FIELDS)[number]

/**
 * Every field a file can be picked for. Wider than `TemplateFormAssetField`
 * because the two config-owned images are not template assets — they live inside
 * a config block on the server — but they are chosen through the same control.
 */
export type UploadableAssetField =
  | TemplateFormAssetField
  | 'falling_effect_custom_image'
  | 'spark_custom_image'

/**
 * The two config-owned images carry an explicit "the partner removed this" flag
 * on the payload rather than being staged through `clearedAssets`, because they
 * live inside a config block on the server. Choosing a new file has to take that
 * flag back off, or the save would upload the file and delete it in one request.
 */
const CLEAR_FLAG_BY_FIELD = {
  falling_effect_custom_image: 'clear_falling_effect_custom_image',
  spark_custom_image: 'clear_spark_custom_image',
} as const satisfies Partial<Record<PreviewedAssetField, keyof FormState>>

function isPreviewed(field: string): field is PreviewedAssetField {
  return (PREVIEWED_ASSET_FIELDS as readonly string[]).includes(field)
}

/**
 * Everything the editor does with a file field: hold the pending pick's preview,
 * stage a removal of a saved one, and take either back.
 *
 * Lives outside the component because all six section panels need it and none of
 * them owns it.
 */
export function useTemplateAssets(form: FormState, existingTemplate: Ref<PartnerTemplate | null>) {
  /** Object URLs for pending picks, keyed by field. Null means nothing pending. */
  const previews = reactive(
    Object.fromEntries(PREVIEWED_ASSET_FIELDS.map((field) => [field, null])) as Record<
      PreviewedAssetField,
      string | null
    >,
  )

  const clearedAssets = ref(new Set<ClearableAssetField>())

  /** Whether the server still has a file for this field, staged removals accounted for. */
  const hasSavedAsset = (field: ClearableAssetField): boolean =>
    !!existingTemplate.value?.[field] && !clearedAssets.value.has(field)

  const hasPreviewImage = computed(
    () => !!previews.preview_image || hasSavedAsset('preview_image'),
  )

  function revokePreview(field: PreviewedAssetField): void {
    const url = previews[field]
    if (url) URL.revokeObjectURL(url)
    previews[field] = null
  }

  /** Drops every pending preview. Used when the editor opens on a different template. */
  function resetPreviews(): void {
    for (const field of PREVIEWED_ASSET_FIELDS) revokePreview(field)
  }

  function unmarkAssetCleared(field: ClearableAssetField): void {
    if (!clearedAssets.value.has(field)) return
    const next = new Set(clearedAssets.value)
    next.delete(field)
    clearedAssets.value = next
  }

  function handleFileChange(field: UploadableAssetField, event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    ;(form[field] as File | null) = file
    // Picking again takes back a pending removal of the same field. A config
    // image is never in that set, so this is a no-op for those two.
    unmarkAssetCleared(field as ClearableAssetField)
    if (isPreviewed(field)) {
      revokePreview(field)
      previews[field] = URL.createObjectURL(file)
      const clearFlag = CLEAR_FLAG_BY_FIELD[field as keyof typeof CLEAR_FLAG_BY_FIELD]
      if (clearFlag) (form[clearFlag] as boolean) = false
    }
  }

  /**
   * Undoing an upload, in the two senses a partner means by it.
   *
   * A pending pick is dropped first, which reveals whatever was saved underneath —
   * that is what "I chose the wrong file" wants, and it costs nothing because the
   * file never left the browser. Only when there is no pick left to undo does a
   * click mark the SAVED asset for removal, which is a real change and therefore
   * doesn't take effect until Save. Both states are reversible right up to that
   * point: choosing a new file for the field takes the mark back off.
   */
  function clearAssetField(field: ClearableAssetField): void {
    if (form[field] instanceof File) {
      ;(form[field] as File | null) = null
      if (isPreviewed(field)) revokePreview(field)
      return
    }
    if (existingTemplate.value?.[field]) {
      clearedAssets.value = new Set(clearedAssets.value).add(field)
    }
  }

  /**
   * The two config-owned images clear differently: there is no saved-asset stage
   * to fall through to, because their removal travels as a flag on their config
   * rather than as an empty file field.
   */
  function clearConfigImage(field: keyof typeof CLEAR_FLAG_BY_FIELD): void {
    ;(form[field] as File | null) = null
    revokePreview(field)
    ;(form[CLEAR_FLAG_BY_FIELD[field]] as boolean) = true
  }

  /**
   * What a config-owned image field has to show, in precedence order: a
   * just-picked file's object URL, else the saved asset — unless the partner has
   * marked that one for removal, which is the case a bare `?? saved` would render
   * as still attached.
   */
  function configImageSrc(
    field: keyof typeof CLEAR_FLAG_BY_FIELD,
    saved: () => string | null | undefined,
  ) {
    return computed<string | null>(() =>
      previews[field] ?? (form[CLEAR_FLAG_BY_FIELD[field]] ? null : (saved() ?? null)),
    )
  }

  /**
   * The same three states for a field that is a normal template asset, where the
   * removal is staged through `clearedAssets` rather than a flag of its own.
   */
  function stagedImageSrc(field: PreviewedAssetField & ClearableAssetField) {
    return computed<string | null>(
      () =>
        previews[field] ??
        (hasSavedAsset(field) ? ((existingTemplate.value?.[field] as string | null) ?? null) : null),
    )
  }

  /** Staged removals restricted to the fields the live preview carries. */
  const clearedPreviewFiles = computed(() =>
    TEMPLATE_FORM_ASSET_FIELDS.filter(
      (field): field is Exclude<TemplateFormAssetField, 'preview_image'> =>
        field !== 'preview_image' && clearedAssets.value.has(field),
    ),
  )

  return {
    previews,
    clearedAssets,
    clearedPreviewFiles,
    hasSavedAsset,
    hasPreviewImage,
    handleFileChange,
    clearAssetField,
    clearConfigImage,
    configImageSrc,
    stagedImageSrc,
    resetPreviews,
  }
}

export type TemplateAssets = ReturnType<typeof useTemplateAssets>
