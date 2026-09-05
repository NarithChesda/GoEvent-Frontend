<template>
  <div class="space-y-1.5">
    <span :class="FIELD_LABEL">{{ label }}</span>
    <p v-if="hint" :class="FIELD_HINT">{{ hint }}</p>

    <!-- Filled: the artwork answers "what is attached?" better than its
         filename does, so the thumbnail is the control's own state. -->
    <div v-if="preview" class="flex items-center gap-3 p-2 ring-1 ring-slate-200 rounded-xl">
      <img
        :src="preview"
        :alt="label"
        class="w-12 h-12 object-contain bg-slate-100 rounded-lg flex-shrink-0"
      />
      <span class="flex-1 min-w-0 text-xs text-slate-600 truncate">
        {{ fileName || t('management.partnerTemplateForm.fallingEffect.currentImage') }}
      </span>
      <!-- The picker is the <label>; the remove button is its sibling. Anything
           nested inside a label forwards its clicks to the label's control, so
           a nested Remove would open the file dialog on its way to clearing. -->
      <label
        class="cursor-pointer px-2 py-1 rounded-lg text-xs font-medium text-[#1e90ff] transition-colors duration-200 hover:bg-sky-50"
      >
        {{ t('management.partnerTemplateForm.fallingEffect.replace') }}
        <input :type="'file'" :accept="accept" class="sr-only" @change="onChange" />
      </label>
      <button
        type="button"
        :class="[BTN_ICON_MICRO, 'hover:text-red-600 hover:bg-red-50']"
        :aria-label="t('management.partnerTemplateForm.fallingEffect.remove')"
        @click="emit('clear')"
      >
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Empty. Dashed and one line high: this is an optional flourish on top of
         an effect that already works without it, and a tall drop target would
         claim more of the panel than the option is worth. -->
    <label
      v-else
      class="flex items-center justify-center gap-2 py-3 cursor-pointer border border-dashed border-slate-300 bg-slate-50/60 rounded-xl transition-colors duration-200 hover:border-sky-400 hover:bg-sky-50/40"
    >
      <Upload class="w-4 h-4 text-slate-400" />
      <span class="text-xs font-medium text-slate-500">{{ uploadLabel }}</span>
      <input :type="'file'" :accept="accept" class="sr-only" @change="onChange" />
    </label>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Trash2, Upload } from 'lucide-vue-next'
import { BTN_ICON_MICRO, FIELD_HINT, FIELD_LABEL } from './templateUi'

/**
 * An optional image with a thumbnail — the custom particle art for the falling
 * effect and for the spark field.
 *
 * These two blocks were written out twice, byte-identical apart from the asset
 * field name and two translation keys, and neither used
 * `PartnerTemplateFileField` because that one shows a filename where this one
 * needs to show the picture. So the editor shipped two answers to "attach a
 * file", and the hand-rolled one — the one with the preview — was the better of
 * the two while being the one that existed only in copies.
 *
 * `preview` is resolved by the caller rather than derived here: a pending pick,
 * a saved asset, and a saved asset the partner has just marked for removal are
 * three different states of the caller's own form, and only the caller can tell
 * them apart.
 */
defineProps<{
  label: string
  /** Resolved image URL, or null when the field is empty. */
  preview: string | null
  /** Name of a just-picked file. Falls back to "current image" for saved ones. */
  fileName?: string | null
  uploadLabel: string
  hint?: string
  accept?: string
}>()

const emit = defineEmits<{ change: [event: Event]; clear: [] }>()

const { t } = useI18n()

const onChange = (event: Event): void => {
  emit('change', event)
  // Resetting the input means picking the SAME file twice in a row still fires
  // `change` — otherwise choosing a file, removing it, and choosing it again
  // silently did nothing.
  ;(event.target as HTMLInputElement).value = ''
}
</script>
