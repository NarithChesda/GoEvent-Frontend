<template>
        <section :class="[PANEL, 'p-4 space-y-3']">
          <div class="flex items-center justify-between gap-2">
            <h5 :class="SECTION_HEADING">
              {{ t('management.partnerTemplateForm.colors.sectionTitle') }}
            </h5>
            <span class="text-[0.6875rem] text-slate-400">{{ pendingColors.length }}</span>
          </div>

          <p v-if="pendingColors.length === 0" class="text-xs text-slate-400">
            {{ t('management.partnerTemplateForm.colors.empty') }}
          </p>
          <ul v-else class="list-group">
            <li
              v-for="(color, index) in pendingColors"
              :key="isEditing ? (color as EventTemplateColor).id : index"
              class="list-row"
            >
              <span
                class="w-7 h-7 rounded-lg ring-1 ring-slate-200 flex-shrink-0"
                :style="{ backgroundColor: color.hex_color_code }"
                aria-hidden="true"
              />
              <span class="min-w-0 flex-1">
                <span class="block text-[0.8125rem] font-medium text-slate-700 truncate">{{ color.name }}</span>
                <span class="block text-[0.6875rem] text-slate-400 uppercase tabular-nums">{{ color.hex_color_code }}</span>
              </span>
              <button
                v-if="isEditing"
                type="button"
                @click="startEditColor(color as EventTemplateColor)"
                :class="[BTN_ICON_MICRO, 'hover:text-[#1e90ff] hover:bg-sky-50']"
                :aria-label="t('management.partnerTemplateForm.colors.editBtn')"
              >
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="isEditing ? handleDeleteColor((color as EventTemplateColor).id) : removePendingColor(index)"
                :class="[BTN_ICON_MICRO, 'hover:text-red-600 hover:bg-red-50']"
                :aria-label="t('management.partnerTemplateForm.colors.deleteBtn')"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </li>
          </ul>

          <!-- Add / edit color. The name field gets its own row: it's the
               wiring (the showcase looks colors up BY NAME, see
               templateSlots.ts) and its suggestion list expands in flow. -->
          <div class="pt-3 border-t border-slate-100 space-y-2">
            <TemplateSlotField
              v-model="colorForm.name"
              :label="t('management.partnerTemplateForm.colors.nameLabel')"
              :options="TEMPLATE_COLOR_SLOTS"
              :used-values="definedColorNames"
              allow-custom
              :maxlength="50"
              :placeholder="t('management.partnerTemplateForm.colors.namePlaceholder')"
            />
            <TemplateFormColor
              v-model="colorForm.hex_color_code"
              :name="t('management.partnerTemplateForm.colorField.names.templateColor')"
              :placeholder="t('management.partnerTemplateForm.colors.hexPlaceholder')"
            >
              <template #actions>
                <button
                  type="button"
                  @click="handleAddOrUpdateColor"
                  :disabled="colorSaving || !colorForm.hex_color_code || !colorForm.name"
                  :class="BTN_PRIMARY_SM"
                >
                  <Loader2 v-if="colorSaving" class="w-3.5 h-3.5 animate-spin" />
                  <template v-else>{{ editingColorId ? t('management.partnerTemplateForm.colors.updateBtn') : t('management.partnerTemplateForm.colors.addBtn') }}</template>
                </button>
                <button
                  v-if="editingColorId"
                  type="button"
                  @click="cancelEditColor"
                  :class="BTN_GHOST_SM"
                >
                  {{ t('management.partnerTemplateForm.colors.cancelBtn') }}
                </button>
              </template>
            </TemplateFormColor>
          </div>
        </section>

        <section :class="[PANEL, 'p-4 space-y-3']">
          <div class="flex items-center justify-between gap-2">
            <h5 :class="SECTION_HEADING">
              {{ t('management.partnerTemplateForm.fonts.sectionTitle') }}
            </h5>
            <span class="text-[0.6875rem] text-slate-400">{{ pendingFonts.length }}</span>
          </div>

          <p v-if="pendingFonts.length === 0" class="text-xs text-slate-400">
            {{ t('management.partnerTemplateForm.fonts.empty') }}
          </p>
          <ul v-else class="list-group">
            <li
              v-for="(f, index) in pendingFonts"
              :key="isEditing ? (f as EventTemplateLanguageFont).id : index"
              class="list-row"
            >
              <span class="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Type class="w-3.5 h-3.5 text-slate-400" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-[0.8125rem] font-medium text-slate-700 truncate">
                  {{ getFontNameDisplay(isEditing ? (f as EventTemplateLanguageFont).font : f.font) }}
                </span>
                <span class="block text-[0.6875rem] text-slate-400 truncate">
                  {{ getFontLanguageDisplay(f.language) }} · {{ getFontTypeDisplay(f.font_type) }}
                  <!-- Shown only when trimmed. A row at 1x is the norm, and
                       labelling every one of those "100%" would bury the few
                       that were actually adjusted. -->
                  <template v-if="readSizeScale(f.size_scale) !== DEFAULT_SIZE_SCALE">
                    · {{ Math.round(readSizeScale(f.size_scale) * 100) }}%
                  </template>
                </span>
              </span>
              <button
                v-if="isEditing"
                type="button"
                @click="startEditFont(f as EventTemplateLanguageFont)"
                :class="[BTN_ICON_MICRO, 'hover:text-[#1e90ff] hover:bg-sky-50']"
                :aria-label="t('management.partnerTemplateForm.fonts.editBtn')"
              >
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="isEditing ? handleDeleteFont((f as EventTemplateLanguageFont).id) : removePendingFont(index)"
                :class="[BTN_ICON_MICRO, 'hover:text-red-600 hover:bg-red-50']"
                :aria-label="t('management.partnerTemplateForm.fonts.deleteBtn')"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </li>
          </ul>

          <div class="pt-3 border-t border-slate-100 space-y-2">
            <div class="grid grid-cols-2 gap-2">
              <TemplateFormSelect
                v-model="fontLanguageModel"
                :label="t('management.partnerTemplateForm.fonts.languageLabel')"
                :options="languageOptions"
              />
              <TemplateFormSelect
                v-model="fontIdModel"
                :label="t('management.partnerTemplateForm.fonts.fontLabel')"
                :options="customFontOptions"
                :placeholder="availableCustomFonts.length ? t('management.partnerTemplateForm.fonts.fontSelect') : t('management.partnerTemplateForm.fonts.fontSelectLoading')"
              />
            </div>

            <!-- Font library.
                 Uploading belongs here rather than on a library screen of its
                 own: a partner reaches for it precisely when the typeface
                 they want is missing from the picker above, so the moment
                 they need it is the moment they are looking at that picker. -->
            <div v-if="!fontUploadOpen" class="flex items-center justify-between gap-2">
              <button type="button" @click="openFontUpload" :class="BTN_GHOST_SM">
                <Upload class="w-3.5 h-3.5" />
                {{ t('management.partnerTemplateForm.fonts.upload.openBtn') }}
              </button>

              <!-- Only ever offered for the partner's own uploads: a system
                   font answers 403 and another partner's answers 404, so a
                   delete control on either is a button that cannot work. -->
              <button
                v-if="selectedCustomFont?.is_owner"
                type="button"
                :disabled="fontDeleting"
                @click="handleDeleteLibraryFont(selectedCustomFont.id)"
                class="text-[0.6875rem] font-medium transition-colors disabled:opacity-50"
                :class="fontDeleteConfirmId === selectedCustomFont.id ? 'text-red-600' : 'text-slate-400 hover:text-red-600'"
              >
                {{ fontDeleteConfirmId === selectedCustomFont.id
                  ? t('management.partnerTemplateForm.fonts.upload.deleteConfirm')
                  : t('management.partnerTemplateForm.fonts.upload.deleteBtn') }}
              </button>
            </div>

            <div v-else class="rounded-lg bg-slate-50 ring-1 ring-slate-200 p-3 space-y-2">
              <p class="text-[0.6875rem] font-medium text-slate-600">
                {{ t('management.partnerTemplateForm.fonts.upload.title') }}
              </p>

              <PartnerTemplateFileField
                :label="t('management.partnerTemplateForm.fonts.upload.fileLabel')"
                :accept="FONT_FILE_ACCEPT"
                :file-name="fontUploadForm.file?.name ?? null"
                @change="handleFontFileChange"
                @clear="fontUploadForm.file = null"
              />

              <div class="space-y-1">
                <label :for="fontUploadNameId" :class="FIELD_LABEL">
                  {{ t('management.partnerTemplateForm.fonts.upload.nameLabel') }}
                </label>
                <input
                  :id="fontUploadNameId"
                  v-model="fontUploadForm.name"
                  type="text"
                  maxlength="100"
                  :placeholder="t('management.partnerTemplateForm.fonts.upload.namePlaceholder')"
                  :class="FIELD"
                />
              </div>

              <div class="space-y-1">
                <label :for="fontUploadLicenseId" :class="FIELD_LABEL">
                  {{ t('management.partnerTemplateForm.fonts.upload.licenseLabel') }}
                </label>
                <input
                  :id="fontUploadLicenseId"
                  v-model="fontUploadForm.license_note"
                  type="text"
                  :placeholder="t('management.partnerTemplateForm.fonts.upload.licensePlaceholder')"
                  :class="FIELD"
                />
                <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.fonts.upload.licenseHint') }}</p>
              </div>

              <p v-if="fontUploadError" class="text-[0.6875rem] text-red-600 leading-snug">
                {{ fontUploadError }}
              </p>
              <p v-else class="text-[0.6875rem] text-slate-400 leading-snug">
                {{ t('management.partnerTemplateForm.fonts.upload.hint') }}
              </p>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="handleUploadFont"
                  :disabled="fontUploading || !fontUploadForm.file || !fontUploadForm.name.trim()"
                  :class="BTN_PRIMARY_SM"
                >
                  <Loader2 v-if="fontUploading" class="w-3.5 h-3.5 animate-spin" />
                  <template v-else>{{ t('management.partnerTemplateForm.fonts.upload.submitBtn') }}</template>
                </button>
                <button type="button" @click="cancelFontUpload" :class="BTN_GHOST_SM">
                  {{ t('management.partnerTemplateForm.fonts.cancelBtn') }}
                </button>
              </div>
            </div>
            <!-- Only two of the six slots reach a guest today: `accent` and
                 `decorative` are resolved but rendered by nothing, and the two
                 scroll-story slots render only in V2, which is still behind an
                 env flag. The picker flags all four rather than letting a
                 partner attach a font that silently does nothing. -->
            <TemplateSlotField
              v-model="fontTypeModel"
              :label="t('management.partnerTemplateForm.fonts.typeLabel')"
              :options="TEMPLATE_FONT_TYPE_SLOTS"
              :used-values="definedFontTypes"
            />

            <!-- Size trim.
                 Every font renders at a different visual size for the same
                 font-size — cap height per em is the designer's choice, and
                 Khmer faces vary more than Latin ones — so the showcase's
                 sizes, tuned against one reference face per script, land
                 wrong on a face that sits larger or smaller in its em box.
                 This scales the glyphs inside that box, which corrects the
                 whole showcase at once without any section needing its own
                 number. Hidden until a font is picked: there is nothing to
                 calibrate against yet, and an enabled slider would invite a
                 value that the next pick silently reinterprets. -->
            <div v-if="fontForm.font" class="space-y-1.5">
              <TemplateFormNumber
                v-model="fontForm.size_scale"
                :label="t('management.partnerTemplateForm.fonts.sizeScale')"
                :min="FONT_SIZE_SCALE_RANGE.min"
                :max="FONT_SIZE_SCALE_RANGE.max"
                :step="0.01"
                unit="x"
              />
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="handleCalibrateFontSize"
                  :disabled="fontCalibrating"
                  :class="BTN_GHOST_SM"
                >
                  <Loader2 v-if="fontCalibrating" class="w-3.5 h-3.5 animate-spin" />
                  <template v-else>{{ t('management.partnerTemplateForm.fonts.calibrateBtn') }}</template>
                </button>
                <span
                  v-if="fontCalibrationNote"
                  class="text-[0.6875rem] leading-tight"
                  :class="fontCalibrationNote === 'matched' ? 'text-slate-500' : 'text-amber-600'"
                >
                  {{ t(`management.partnerTemplateForm.fonts.calibrate.${fontCalibrationNote}`) }}
                </span>
              </div>
              <p class="text-[0.6875rem] text-slate-400 leading-snug">
                {{ t('management.partnerTemplateForm.fonts.sizeScaleHint') }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="handleAddOrUpdateFont"
                :disabled="fontSaving || !fontForm.font || !fontForm.language || !fontForm.font_type"
                :class="BTN_PRIMARY_SM"
              >
                <Loader2 v-if="fontSaving" class="w-3.5 h-3.5 animate-spin" />
                <template v-else>{{ editingFontId ? t('management.partnerTemplateForm.fonts.updateBtn') : t('management.partnerTemplateForm.fonts.addBtn') }}</template>
              </button>
              <button
                v-if="editingFontId"
                type="button"
                @click="cancelEditFont"
                :class="BTN_GHOST_SM"
              >
                {{ t('management.partnerTemplateForm.fonts.cancelBtn') }}
              </button>
            </div>
          </div>
        </section>

        <!-- Text finish: metallic lettering, per font SLOT rather than per
             font row. Rows are per language, and a design that gilds its
             English headings but prints the same headings flat in Khmer is
             not a choice anyone makes — so one control per slot, and it
             follows that slot onto every stage (see useTextEffects.ts). -->
        <section :class="[PANEL, 'p-4 space-y-3']">
          <h5 :class="SECTION_HEADING">
            {{ t('management.partnerTemplateForm.textEffects.sectionTitle') }}
          </h5>
          <p :class="FIELD_HINT">
            {{ t('management.partnerTemplateForm.textEffects.hint') }}
          </p>

          <div
            v-for="slot in textEffectSlots"
            :key="slot"
            class="pt-3 border-t border-slate-100 space-y-2"
          >
            <TemplateFormChoice
              :model-value="form.text_effects[slot].finish"
              :label="t(`management.templateSlots.fonts.${slot}.label`)"
              :options="textEffectFinishOptions"
              variant="segmented"
              @update:model-value="setTextEffectFinish(slot, $event)"
            />
            <!-- Kept in state while the finish is off, so switching a slot
                 back on returns the metal the partner last chose. -->
            <template v-if="form.text_effects[slot].finish !== 'none'">
              <TemplateFormChoice
                :model-value="form.text_effects[slot].metal"
                :label="t('management.partnerTemplateForm.textEffects.metalLabel')"
                :options="textEffectMetalOptions"
                variant="segmented"
                @update:model-value="setTextEffectMetal(slot, $event)"
              />
              <TemplateFormChoice
                :model-value="form.text_effects[slot].animation"
                :label="t('management.partnerTemplateForm.textEffects.animationLabel')"
                :options="textEffectAnimationOptions"
                variant="segmented"
                @update:model-value="setTextEffectAnimation(slot, $event)"
              />
            </template>
          </div>
        </section>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader2, Pencil, Trash2, Type, Upload } from 'lucide-vue-next'

import { LANGUAGE_CODE_LABELS } from '@/services/api'
import type {
  CustomFont,
  EventTemplateColor,
  EventTemplateLanguageFont,
  TemplateLanguageCode,
  TextEffectAnimation,
  TextEffectMetal,
  TextEffectSlot,
} from '@/services/api'
import {
  TEXT_EFFECT_ANIMATIONS,
  TEXT_EFFECT_FINISHES,
  TEXT_EFFECT_METALS,
  TEXT_EFFECT_SLOTS,
} from '@/composables/showcase/useTextEffects'
import type { ResolvedCoverTextStyles } from '@/composables/showcase/useCoverStageLayout'
import { DEFAULT_SIZE_SCALE, FONT_SIZE_SCALE_RANGE } from '@/utils/fontMetrics'

import PartnerTemplateFileField from '../PartnerTemplateFileField.vue'
import TemplateFormChoice from '../TemplateFormChoice.vue'
import TemplateFormColor from '../TemplateFormColor.vue'
import TemplateFormNumber from '../TemplateFormNumber.vue'
import TemplateFormSelect from '../TemplateFormSelect.vue'
import TemplateSlotField from '../TemplateSlotField.vue'
import { TEMPLATE_COLOR_SLOTS, TEMPLATE_FONT_TYPE_SLOTS } from '../templateSlots'
import {
  BTN_GHOST_SM,
  BTN_ICON_MICRO,
  BTN_PRIMARY_SM,
  FIELD,
  FIELD_HINT,
  FIELD_LABEL,
  PANEL,
  SECTION_HEADING,
} from '../templateUi'
import type { TextEffectFinishChoice } from '../config'
import type { TemplateBrand } from '../useTemplateBrand'
import { useTemplateEditor } from '../templateEditorContext'

/**
 * The palette, the typefaces and the metallic finish each font slot renders in.
 *
 * `brand` arrives whole rather than as forty separate props: it is one
 * composable's return, the parent holds it only because the save path and the
 * live preview also read from it, and spreading it across a prop list here would
 * be a second copy of its interface to keep in step.
 */
const props = defineProps<{
  brand: TemplateBrand
  /** Every cover text's resolved style, for deciding which font slots get a finish control. */
  resolvedCoverText: ResolvedCoverTextStyles
}>()

// The template being edited, shared with every other panel — see
// templateEditorContext.ts for why this is provided rather than a prop.
const { form, isEditing } = useTemplateEditor()

/**
 * Destructured rather than reached through `props.brand` in the markup, because
 * `<script setup>` unwraps a top-level ref in the template and a ref nested in a
 * prop object is not top level. This also keeps every binding below spelled
 * exactly as it was while it lived in the parent.
 *
 * Safe to destructure once: the prop is the same composable instance for the
 * life of the editor — the parent creates it in setup and never replaces it.
 */
const {
  colorForm,
  editingColorId,
  colorSaving,
  pendingColors,
  definedColorNames,
  startEditColor,
  cancelEditColor,
  handleAddOrUpdateColor,
  removePendingColor,
  handleDeleteColor,
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
  startEditFont,
  cancelEditFont,
  handleAddOrUpdateFont,
  removePendingFont,
  handleDeleteFont,
  handleCalibrateFontSize,
  getFontLanguageDisplay,
  getFontNameDisplay,
  getFontTypeDisplay,
  readSizeScale,
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
} = props.brand

const { t } = useI18n()

const fontUploadNameId = useId()
const fontUploadLicenseId = useId()

const languageOptions = computed(() =>
  (Object.entries(LANGUAGE_CODE_LABELS) as Array<[TemplateLanguageCode, string]>).map(
    ([value, label]) => ({ value, label }),
  ),
)

/**
 * The font picker's options, partner uploads first.
 *
 * One library holds both kinds and the API already scopes it to what this
 * account may see, so there is nothing to filter here — only to label. A
 * partner's own uploads are the ones they are looking for and the only ones they
 * can manage, so they sort to the top; the source tag is what makes a partner
 * font named after a system font ("Moul") distinguishable from it, which the
 * backend explicitly permits.
 */
const customFontOptions = computed(() => {
  const rank = (font: CustomFont): number => (font.source === 'partner' ? 0 : 1)
  return [...availableCustomFonts.value]
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
    .map((font) => ({
      value: font.id,
      label:
        font.source === 'partner'
          ? `${font.name} · ${t('management.partnerTemplateForm.fonts.sourceMine')}`
          : font.name,
    }))
})

/** The library record behind the current pick, or null while nothing is chosen. */
const selectedCustomFont = computed<CustomFont | null>(
  () => availableCustomFonts.value.find((cf) => cf.id === fontForm.font) ?? null,
)

// ---------------------------------------------------------------------------
// Text finish — a per-font-slot metallic treatment, which is why it sits under
// Fonts rather than in a section of its own.
// ---------------------------------------------------------------------------

const textEffectFinishOptions = computed(() => [
  { value: 'none', label: t('management.partnerTemplateForm.textEffects.finishes.none') },
  { value: 'foil', label: t('management.partnerTemplateForm.textEffects.finishes.foil') },
  { value: 'relief', label: t('management.partnerTemplateForm.textEffects.finishes.relief') },
])

const textEffectMetalOptions = computed(() =>
  TEXT_EFFECT_METALS.map((metal) => ({
    value: metal,
    label: t(`management.partnerTemplateForm.textEffects.metals.${metal}`),
  })),
)

const textEffectAnimationOptions = computed(() =>
  TEXT_EFFECT_ANIMATIONS.map((animation) => ({
    value: animation,
    label: t(`management.partnerTemplateForm.textEffects.animations.${animation}`),
  })),
)

// The choice controls emit a plain string; only a value this form offered is
// written back, so the state can never hold something the payload can't send.
const setTextEffectFinish = (slot: TextEffectSlot, value: string) => {
  if (value === 'none' || (TEXT_EFFECT_FINISHES as readonly string[]).includes(value)) {
    form.text_effects[slot].finish = value as TextEffectFinishChoice
  }
}

const setTextEffectMetal = (slot: TextEffectSlot, value: string) => {
  if ((TEXT_EFFECT_METALS as readonly string[]).includes(value)) {
    form.text_effects[slot].metal = value as TextEffectMetal
  }
}

const setTextEffectAnimation = (slot: TextEffectSlot, value: string) => {
  if ((TEXT_EFFECT_ANIMATIONS as readonly string[]).includes(value)) {
    form.text_effects[slot].animation = value as TextEffectAnimation
  }
}

/**
 * Which slots get a control. Primary and secondary draw type on every
 * template; accent and decorative draw only where a free-placed cover block
 * was pointed at them, so they are offered exactly then — plus whenever one
 * already carries a finish, so it can still be taken off.
 */
const textEffectSlots = computed<TextEffectSlot[]>(() => {
  // Every slot a cover text renders in — its own pick, or its box's where that
  // still applies (resolveCoverTextStyles).
  const pickedByCover = new Set(
    Object.values(props.resolvedCoverText).map((style) => style.fontType),
  )
  return TEXT_EFFECT_SLOTS.filter(
    (slot) =>
      slot === 'primary' ||
      slot === 'secondary' ||
      pickedByCover.has(slot) ||
      form.text_effects[slot].finish !== 'none',
  )
})
</script>
