import { computed, reactive, ref, type ComputedRef, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  FONT_TYPE_LABELS,
  LANGUAGE_CODE_LABELS,
  customFontsService,
  partnerTemplateService,
} from '@/services/api'
import type {
  CustomFont,
  EventTemplateColor,
  EventTemplateLanguageFont,
  PartnerTemplate,
  TemplateFontType,
  TemplateLanguageCode,
} from '@/services/api'
import {
  DEFAULT_SIZE_SCALE,
  METRIC_REFERENCE_FAMILY,
  deriveSizeScale,
} from '@/utils/fontMetrics'

import { enumModel } from './formModels'
import type { PartnerTemplateDraft } from './partnerTemplateAssets'

/**
 * The template's palette and typefaces: two small CRUD surfaces that behave
 * unlike the rest of the editor.
 *
 * Everything else in this form is a field on the template record, saved in one
 * request when the partner presses Save. Colours and fonts are child records
 * with endpoints of their own, so while editing an existing template each
 * Add/Update/Delete is its own round trip, and while creating one they are held
 * locally and replayed after the template exists (see handleSave). That split —
 * `colors` vs `localColors`, `fonts` vs `localFonts`, reconciled by
 * `pendingColors`/`pendingFonts` — is the whole reason this is ~450 lines, and
 * it is why it lives outside the component rather than inside the Brand panel:
 * the save path and the live preview both need it, and neither is that panel.
 */
export function useTemplateBrand(
  existingTemplate: Ref<PartnerTemplate | null>,
  isEditing: ComputedRef<boolean>,
  /** The form-wide error line, which these handlers write to on failure. */
  error: Ref<string | null>,
) {
  const { t } = useI18n()

// --- Colors CRUD state ---
const colors = ref<EventTemplateColor[]>([])
const localColors = ref<Array<{ hex_color_code: string; name: string }>>([])
const colorForm = reactive({ hex_color_code: '#000000', name: '' })
const editingColorId = ref<number | null>(null)
const colorSaving = ref(false)

// Computed property that shows both saved colors (when editing) and pending colors (when creating)
const pendingColors = computed(() => {
  if (isEditing.value) {
    return colors.value
  }
  return localColors.value
})

// --- Fonts CRUD state ---
const fonts = ref<EventTemplateLanguageFont[]>([])
const localFonts = ref<
  Array<{
    language: TemplateLanguageCode
    font: number
    font_type: TemplateFontType
    size_scale: number
  }>
>([])
const availableCustomFonts = ref<CustomFont[]>([])
const fontForm = reactive<{
  language: TemplateLanguageCode
  font: number | null
  font_type: TemplateFontType
  size_scale: number
}>({
  language: 'en',
  font: null,
  font_type: 'primary',
  size_scale: DEFAULT_SIZE_SCALE,
})

/** Set after an auto-calibration run so the studio can say what it did (or could not do). */
const fontCalibrationNote = ref<'matched' | 'unavailable' | null>(null)
const fontCalibrating = ref(false)

// ---------------------------------------------------------------------------
// Font library uploads.
//
// A partner can put their own typeface into the library and use it on their
// templates. The upload is stamped `source=partner` with `created_by` set to
// them, so it is visible to nobody else and reaches guests only through their own
// approved template's assets.
//
// The controls live inside the Fonts section rather than in a library screen of
// their own: uploading is something a partner does *because* the font they want
// is not in the picker, so the moment they need it is the moment they are looking
// at that picker.
// ---------------------------------------------------------------------------

/** Mirrors the backend's accepted extensions. */
const FONT_FILE_ACCEPT = '.ttf,.otf,.woff,.woff2'
const FONT_FILE_EXTENSIONS = ['.ttf', '.otf', '.woff', '.woff2']
const FONT_FILE_MAX_BYTES = 5 * 1024 * 1024

const fontUploadOpen = ref(false)
const fontUploading = ref(false)
const fontUploadError = ref<string | null>(null)
const fontUploadForm = reactive<{ name: string; file: File | null; license_note: string }>({
  name: '',
  file: null,
  license_note: '',
})

/**
 * Which library font is one click away from being deleted.
 *
 * Two-step rather than a modal: removing a font is destructive beyond this
 * template — every other template of theirs pointing at it silently drops to the
 * system default — but it is also a one-line control inside a dense panel, and a
 * modal for it would be heavier than the rest of the section's affordances.
 */
const fontDeleteConfirmId = ref<number | null>(null)
const fontDeleting = ref(false)
const editingFontId = ref<number | null>(null)
const fontSaving = ref(false)

// Computed property that shows both saved fonts (when editing) and pending fonts (when creating)
const pendingFonts = computed(() => {
  if (isEditing.value) {
    return fonts.value
  }
  return localFonts.value
})

// ---------------------------------------------------------------------------
// Slot occupancy, for the name/type suggestion lists. Both the colors and the
// fonts the showcase reads are looked up by name, and only the FIRST match
// counts — so knowing which slots are already spoken for is the difference
// between filling a gap and quietly shadowing an existing row.
// ---------------------------------------------------------------------------
const definedColorNames = computed(() => pendingColors.value.map((color) => color.name))

// Scoped to the language being edited: font types are per-language, so
// `primary` already existing for English says nothing about Khmer.
const definedFontTypes = computed(() =>
  pendingFonts.value
    .filter((entry) => entry.language === fontForm.language)
    .map((entry) => entry.font_type),
)

// TemplateSlotField speaks plain strings; font_type is a narrowed union. The
// cast is safe because the field only ever emits one of the values it was
// handed, and those come from TEMPLATE_FONT_TYPE_SLOTS (which mirrors
// TemplateFontType) with free text disabled.
const fontTypeModel = enumModel(() => fontForm, 'font_type')

const fontLanguageModel = computed<string | number>({
  get: () => fontForm.language,
  set: (value) => { fontForm.language = value as TemplateLanguageCode },
})

const fontIdModel = computed<string | number | null>({
  get: () => fontForm.font,
  set: (value) => { fontForm.font = Number(value) },
})

// --- Colors handlers ---
async function fetchColors(): Promise<void> {
  if (!existingTemplate.value) return
  try {
    const res = await partnerTemplateService.listColors(existingTemplate.value.id)
    if (res.success && res.data) {
      const data = res.data as unknown
      // Handle both paginated { results: [...] } and plain array responses
      if (Array.isArray(data)) {
        colors.value = data
      } else if (data && typeof data === 'object' && 'results' in data) {
        colors.value = (data as { results: EventTemplateColor[] }).results
      }
    } else {
      console.warn('[useTemplateBrand] Failed to fetch colors:', res.message)
    }
  } catch (err) {
    console.error('[useTemplateBrand] Error fetching colors:', err)
  }
}

function startEditColor(color: EventTemplateColor): void {
  editingColorId.value = color.id
  colorForm.hex_color_code = color.hex_color_code
  colorForm.name = color.name
}

function cancelEditColor(): void {
  editingColorId.value = null
  colorForm.hex_color_code = '#000000'
  colorForm.name = ''
}

// Add or update color (handles both editing mode with API and creation mode with local state)
async function handleAddOrUpdateColor(): Promise<void> {
  if (!colorForm.hex_color_code || !colorForm.name) return

  // If editing an existing template, save to API
  if (isEditing.value && existingTemplate.value) {
    colorSaving.value = true
    try {
      let res
      if (editingColorId.value) {
        res = await partnerTemplateService.updateColor(existingTemplate.value.id, editingColorId.value, {
          hex_color_code: colorForm.hex_color_code,
          name: colorForm.name,
        })
      } else {
        res = await partnerTemplateService.createColor(existingTemplate.value.id, {
          hex_color_code: colorForm.hex_color_code,
          name: colorForm.name,
        })
      }
      if (res.success) {
        cancelEditColor()
        await fetchColors()
      } else {
        error.value = res.message || t('management.partnerTemplateForm.errors.colorSaveFailed')
      }
    } catch {
      error.value = t('management.partnerTemplateForm.errors.colorSaveConnection')
    } finally {
      colorSaving.value = false
    }
  } else {
    // If creating a new template, add to local state
    localColors.value.push({
      hex_color_code: colorForm.hex_color_code,
      name: colorForm.name,
    })
    cancelEditColor()
  }
}

function removePendingColor(index: number): void {
  localColors.value.splice(index, 1)
}

async function handleDeleteColor(colorId: number): Promise<void> {
  if (!existingTemplate.value) return
  try {
    const res = await partnerTemplateService.deleteColor(existingTemplate.value.id, colorId)
    if (res.success) {
      await fetchColors()
    } else {
      error.value = res.message || t('management.partnerTemplateForm.errors.colorDeleteFailed')
    }
  } catch {
    error.value = t('management.partnerTemplateForm.errors.colorDeleteConnection')
  }
}

// --- Fonts handlers ---
async function fetchFonts(): Promise<void> {
  if (!existingTemplate.value) return
  try {
    // Re-fetch full template to get expanded font objects
    const res = await partnerTemplateService.getTemplate(existingTemplate.value.id)
    if (res.success && res.data) {
      fonts.value = res.data.template_fonts ?? []
    } else {
      console.warn('[useTemplateBrand] Failed to fetch template for fonts:', res.message)
    }
  } catch (err) {
    console.error('[useTemplateBrand] Error fetching fonts:', err)
  }
}

/**
 * Loads the font library.
 *
 * One list, already scoped by the API to what this account may see — the active
 * system fonts plus, for a partner, their own uploads — so there is no second
 * request for "my fonts" to merge in. `force` is for after an upload or a delete,
 * where the cached list is exactly what has just gone stale.
 */
async function fetchCustomFonts(force = false): Promise<void> {
  if (!force && availableCustomFonts.value.length > 0) return
  try {
    const res = await customFontsService.listFonts()
    if (res.success && res.data) {
      const data = res.data as unknown
      if (Array.isArray(data)) {
        availableCustomFonts.value = data
      } else if (data && typeof data === 'object' && 'results' in data) {
        availableCustomFonts.value = (data as { results: CustomFont[] }).results
      }
    }
  } catch { /* ignore */ }
}

function openFontUpload(): void {
  fontUploadOpen.value = true
  fontUploadError.value = null
}

function cancelFontUpload(): void {
  fontUploadOpen.value = false
  fontUploadError.value = null
  fontUploadForm.name = ''
  fontUploadForm.file = null
  fontUploadForm.license_note = ''
}

/**
 * Validates the picked file the same way the backend will, and proposes a name.
 *
 * Checking here is not a substitute for the server's check — it also reads the
 * file's header bytes, which the browser cannot do cheaply — but a 5MB upload
 * that fails on extension is a round trip nobody needs, and on a phone
 * connection it is a slow one. The filename becomes the default font name
 * because it is almost always what the partner would type anyway.
 */
function handleFontFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  // Reset so re-picking the same file after an error still fires `change`.
  input.value = ''
  fontUploadError.value = null
  if (!file) return

  const name = file.name.toLowerCase()
  if (!FONT_FILE_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    fontUploadError.value = t('management.partnerTemplateForm.fonts.upload.errorExtension')
    return
  }
  if (file.size > FONT_FILE_MAX_BYTES) {
    fontUploadError.value = t('management.partnerTemplateForm.fonts.upload.errorSize')
    return
  }

  fontUploadForm.file = file
  if (!fontUploadForm.name.trim()) {
    fontUploadForm.name = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
  }
}

/**
 * Uploads the font and selects it, so the partner lands back on a picker that has
 * already moved to what they just added rather than one they have to search.
 *
 * Field errors are surfaced verbatim. The two the backend actually returns here
 * are worth the partner reading — a duplicate name among *their own* fonts, and
 * a file whose header bytes are not a font container — and paraphrasing either
 * into a generic failure would hide what to do about it.
 */
async function handleUploadFont(): Promise<void> {
  if (!fontUploadForm.file || !fontUploadForm.name.trim()) return

  fontUploading.value = true
  fontUploadError.value = null
  try {
    const res = await customFontsService.uploadFont({
      name: fontUploadForm.name.trim(),
      font_file: fontUploadForm.file,
      license_note: fontUploadForm.license_note.trim() || undefined,
    })

    if (res.success && res.data) {
      await fetchCustomFonts(true)
      fontForm.font = res.data.id
      fontCalibrationNote.value = null
      cancelFontUpload()
      return
    }

    fontUploadError.value =
      firstFieldError(res.errors) ||
      res.message ||
      t('management.partnerTemplateForm.fonts.upload.errorGeneric')
  } catch {
    fontUploadError.value = t('management.partnerTemplateForm.fonts.upload.errorGeneric')
  } finally {
    fontUploading.value = false
  }
}

/** The first field-level message from a DRF error map, which is the useful one. */
function firstFieldError(errors: Record<string, string[]> | undefined): string | null {
  if (!errors) return null
  for (const messages of Object.values(errors)) {
    if (Array.isArray(messages) && messages.length) return messages[0]
  }
  return null
}

/**
 * Removes one of the partner's own fonts from the library.
 *
 * The blast radius is wider than this form: the backend nulls the `font` on every
 * template row that referenced it, across all of their templates, and those rows
 * fall back to the system default rather than disappearing. Hence the two-step
 * confirm, and hence refetching this template's rows afterwards — one of them may
 * have just become `font: null` under us.
 */
async function handleDeleteLibraryFont(fontId: number): Promise<void> {
  if (fontDeleteConfirmId.value !== fontId) {
    fontDeleteConfirmId.value = fontId
    return
  }

  fontDeleting.value = true
  try {
    const res = await customFontsService.deleteFont(fontId)
    if (res.success) {
      if (fontForm.font === fontId) fontForm.font = null
      localFonts.value = localFonts.value.filter((entry) => entry.font !== fontId)
      await fetchCustomFonts(true)
      if (isEditing.value) await fetchFonts()
    } else {
      error.value = res.message || t('management.partnerTemplateForm.errors.fontDeleteFailed')
    }
  } catch {
    error.value = t('management.partnerTemplateForm.errors.fontDeleteFailed')
  } finally {
    fontDeleting.value = false
    fontDeleteConfirmId.value = null
  }
}

// Helper functions to display font information
function getFontLanguageDisplay(language: string | TemplateLanguageCode): string {
  return LANGUAGE_CODE_LABELS[language as TemplateLanguageCode] || language
}

/**
 * Names the font on a row.
 *
 * `null` is a legitimate steady state, not a broken row: the backend nulls this
 * field on every template that referenced a library font when its owner deletes
 * it, and the showcase then falls back to its own default for that language. So
 * it reads as "system default", not as "unknown" — the row is fine, it just no
 * longer names a face.
 *
 * "Unknown font" is reserved for the one case that really is a gap: an id whose
 * font is not in the library this account can see.
 */
function getFontNameDisplay(fontId: number | { id: number; name: string } | null): string {
  if (fontId === null || fontId === undefined) {
    return t('management.partnerTemplateForm.fonts.systemDefault')
  }
  if (typeof fontId === 'object' && 'name' in fontId) return fontId.name
  const font = availableCustomFonts.value.find(f => f.id === fontId)
  return font?.name || t('management.partnerTemplateForm.fonts.unknownFont')
}

function getFontTypeDisplay(fontType: string | TemplateFontType): string {
  return FONT_TYPE_LABELS[fontType as TemplateFontType] || fontType
}

function startEditFont(f: EventTemplateLanguageFont): void {
  editingFontId.value = f.id
  fontForm.language = f.language as TemplateLanguageCode
  fontForm.font = f.font?.id ?? null
  fontForm.font_type = f.font_type as TemplateFontType
  fontForm.size_scale = readSizeScale(f.size_scale)
  fontCalibrationNote.value = null
}

function cancelEditFont(): void {
  editingFontId.value = null
  fontForm.language = 'en'
  fontForm.font = null
  fontForm.font_type = 'primary'
  fontForm.size_scale = DEFAULT_SIZE_SCALE
  fontCalibrationNote.value = null
}

/**
 * A stored scale, as a number the slider can bind to.
 *
 * Falls back to 1 for anything missing or unparseable — a row saved before the
 * field existed, or a backend that dropped it — so an absent value means
 * "unchanged", never "shrink this to nothing".
 */
function readSizeScale(raw: number | string | null | undefined): number {
  if (raw === null || raw === undefined || raw === '') return DEFAULT_SIZE_SCALE
  const value = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(value) ? value : DEFAULT_SIZE_SCALE
}

/**
 * Sets the size scale that makes the picked font read at the same visual size as
 * the language's reference face.
 *
 * This is the control that matters: the whole problem is that a partner cannot
 * eyeball "is this font 12% too big", and the sizes throughout the showcase were
 * tuned against one reference family per script. Measuring is the answer, so the
 * slider beside it exists for taste afterwards rather than for finding the number
 * in the first place.
 *
 * Both faces must actually be loaded before measuring — canvas silently falls
 * back to a generic family for one that is not, which yields a confidently wrong
 * ratio rather than an error.
 */
async function handleCalibrateFontSize(): Promise<void> {
  const custom = availableCustomFonts.value.find((cf) => cf.id === fontForm.font)
  if (!custom) return

  fontCalibrating.value = true
  fontCalibrationNote.value = null
  try {
    const reference =
      METRIC_REFERENCE_FAMILY[fontForm.language] ?? METRIC_REFERENCE_FAMILY.en
    await Promise.all([
      document.fonts.load(`64px "${custom.name}"`).catch(() => []),
      document.fonts.load(`64px "${reference}"`).catch(() => []),
    ])

    const scale = deriveSizeScale(custom.name, fontForm.language)
    if (scale === null) {
      fontCalibrationNote.value = 'unavailable'
      return
    }
    fontForm.size_scale = scale
    fontCalibrationNote.value = 'matched'
  } finally {
    fontCalibrating.value = false
  }
}

// Add or update font (handles both editing mode with API and creation mode with local state)
async function handleAddOrUpdateFont(): Promise<void> {
  if (!fontForm.font || !fontForm.language || !fontForm.font_type) return

  // If editing an existing template, save to API
  if (isEditing.value && existingTemplate.value) {
    fontSaving.value = true
    try {
      let res
      if (editingFontId.value) {
        res = await partnerTemplateService.updateFont(existingTemplate.value.id, editingFontId.value, {
          language: fontForm.language,
          font: fontForm.font,
          font_type: fontForm.font_type,
          size_scale: fontForm.size_scale,
        })
      } else {
        res = await partnerTemplateService.createFont(existingTemplate.value.id, {
          language: fontForm.language,
          font: fontForm.font,
          font_type: fontForm.font_type,
          size_scale: fontForm.size_scale,
        })
      }
      if (res.success) {
        cancelEditFont()
        await fetchFonts()
      } else {
        error.value = res.message || t('management.partnerTemplateForm.errors.fontSaveFailed')
      }
    } catch {
      error.value = t('management.partnerTemplateForm.errors.fontSaveConnection')
    } finally {
      fontSaving.value = false
    }
  } else {
    // If creating a new template, add to local state
    localFonts.value.push({
      language: fontForm.language,
      font: fontForm.font,
      font_type: fontForm.font_type,
      size_scale: fontForm.size_scale,
    })
    cancelEditFont()
  }
}

function removePendingFont(index: number): void {
  localFonts.value.splice(index, 1)
}

async function handleDeleteFont(fontId: number): Promise<void> {
  if (!existingTemplate.value) return
  try {
    const res = await partnerTemplateService.deleteFont(existingTemplate.value.id, fontId)
    if (res.success) {
      await fetchFonts()
    } else {
      error.value = res.message || t('management.partnerTemplateForm.errors.fontDeleteFailed')
    }
  } catch {
    error.value = t('management.partnerTemplateForm.errors.fontDeleteConnection')
  }
}

/** A complete six-digit hex. The text field emits every keystroke on the way to one. */
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i

/**
 * The row currently sitting in the colour add/edit fields, as the showcase reads
 * colours.
 *
 * The same job draftFontRow does below: the committed list only moves on
 * Add/Update — a round trip to the API in edit mode — so dragging the swatch
 * used to tell the partner nothing at all until they saved. Null until the hex
 * is complete, because the hex text field emits every intermediate keystroke and
 * a half-typed `#12` would otherwise repaint the slot mid-word.
 */
const draftColorRow = computed<PartnerTemplateDraft['colors'][number] | null>(() => {
  if (!colorForm.name || !HEX_COLOR_RE.test(colorForm.hex_color_code)) return null
  return {
    // Present only when editing, so the lookup below matches the row being
    // edited by id and a brand-new one by the slot its name claims.
    id: editingColorId.value ?? undefined,
    name: colorForm.name,
    hex_color_code: colorForm.hex_color_code,
  }
})

/**
 * Colours as the showcase reads them: everything committed, with the row being
 * picked laid over it IN PLACE.
 *
 * In place — not evicted-and-appended the way the fonts overlay works — because
 * colour lookup falls back to LIST POSITION whenever a name doesn't match
 * (templateColors[0]/[1]/[2] in extractTemplateColors, where fonts have no
 * comparable fallback for rows that carry a type). Moving the edited row to the
 * end renumbers every row after it, so a name half-typed on the way back to
 * `primary` would briefly promote the next colour into the primary slot and
 * repaint the whole preview in it.
 *
 * Names are compared lowercased and untrimmed, which is exactly what
 * extractTemplateColors does — so a name typed with a stray space previews as
 * the dead slot it really is instead of appearing to work.
 *
 * A brand-new row whose name is already taken displaces that row here, where a
 * save would keep both and let the first win. Showing the colour being picked is
 * the whole point of the pane, and the name field already marks a slot that is
 * spoken for.
 */
const previewColors = computed<PartnerTemplateDraft['colors']>(() => {
  const committed: PartnerTemplateDraft['colors'] = pendingColors.value
  const draft = draftColorRow.value
  if (!draft) return committed

  const target = committed.findIndex((row) =>
    draft.id === undefined
      ? row.name.toLowerCase() === draft.name.toLowerCase()
      : row.id === draft.id,
  )
  if (target === -1) return [...committed, draft]
  return committed.map((row, index) => (index === target ? draft : row))
})

/**
 * The row currently sitting in the font add/edit fields, resolved into the shape
 * the showcase reads.
 *
 * This is what lets the picker steer the preview *while* it is being used. The
 * committed list only changes on Add/Update, which in edit mode is a round trip
 * to the API — so without this, finding out whether a font was the right one
 * meant saving it first. Null while the selection is incomplete (or names a font
 * whose file hasn't been fetched yet), which is also how the overlay disappears
 * again on Cancel.
 */
const draftFontRow = computed<EventTemplateLanguageFont | null>(() => {
  if (!fontForm.font || !fontForm.language || !fontForm.font_type) return null
  const custom = availableCustomFonts.value.find((cf) => cf.id === fontForm.font)
  if (!custom) return null
  return {
    // Carries the id of the row being edited, so it replaces that row below.
    // A brand-new row gets 0: saved rows have positive ids and pending ones
    // negative, so it is the one value neither side can collide with.
    id: editingFontId.value ?? 0,
    language: fontForm.language,
    language_display: fontForm.language,
    font: custom,
    font_type: fontForm.font_type,
    font_type_display: fontForm.font_type,
    // What makes the size slider live: the preview re-resolves this row's
    // `size-adjust` from it on every debounce tick, so dragging resizes the type
    // in the frame beside the control rather than only after a save.
    size_scale: fontForm.size_scale,
  }
})

/**
 * Fonts in the shape the showcase resolves them from: everything committed, with
 * the row being picked overlaid on top.
 *
 * In edit mode the API already returns the font file with each entry; while
 * creating, the selection is still just a custom-font id, so it's joined against
 * the loaded custom-font list here — otherwise picking a font would show nothing
 * until the first save.
 *
 * The overlay doesn't just append: it evicts the row it is editing AND anything
 * else already holding its language + type slot. A language resolves exactly one
 * font per slot (getLanguageFonts in useTemplateProcessor), so a pending pick
 * left alongside the row it is about to displace would be competing with it
 * instead of showing what the save is going to look like.
 */
const previewFonts = computed<EventTemplateLanguageFont[]>(() => {
  const committed: EventTemplateLanguageFont[] = isEditing.value
    ? fonts.value
    : localFonts.value.flatMap((entry, index) => {
        const custom = availableCustomFonts.value.find((cf) => cf.id === entry.font)
        if (!custom) return []
        return [
          {
            // Negative ids keep these distinguishable from saved rows; nothing
            // downstream persists them.
            id: -(index + 1),
            language: entry.language,
            language_display: entry.language,
            font: custom,
            font_type: entry.font_type,
            font_type_display: entry.font_type,
            size_scale: entry.size_scale,
          },
        ]
      })

  const draft = draftFontRow.value
  if (!draft) return committed

  return [
    ...committed.filter(
      (row) =>
        row.id !== draft.id &&
        !(row.language === draft.language && row.font_type === draft.font_type),
    ),
    draft,
  ]
})

  return {
    // Colours
    colors,
    localColors,
    colorForm,
    editingColorId,
    colorSaving,
    pendingColors,
    definedColorNames,
    fetchColors,
    startEditColor,
    cancelEditColor,
    handleAddOrUpdateColor,
    removePendingColor,
    handleDeleteColor,
    // Fonts
    fonts,
    localFonts,
    availableCustomFonts,
    fontForm,
    editingFontId,
    fontSaving,
    pendingFonts,
    definedFontTypes,
    fontTypeModel,
    fontLanguageModel,
    fontIdModel,
    fontCalibrationNote,
    fontCalibrating,
    fetchFonts,
    fetchCustomFonts,
    startEditFont,
    cancelEditFont,
    handleAddOrUpdateFont,
    removePendingFont,
    handleDeleteFont,
    handleCalibrateFontSize,
    readSizeScale,
    getFontLanguageDisplay,
    getFontNameDisplay,
    getFontTypeDisplay,
    // Font library uploads
    FONT_FILE_ACCEPT,
    fontUploadOpen,
    fontUploading,
    fontUploadError,
    fontUploadForm,
    fontDeleteConfirmId,
    fontDeleting,
    openFontUpload,
    cancelFontUpload,
    handleFontFileChange,
    handleUploadFont,
    handleDeleteLibraryFont,
    // What the live preview renders, including the row being edited right now
    previewColors,
    previewFonts,
  }
}

export type TemplateBrand = ReturnType<typeof useTemplateBrand>
