<template>
        <section :class="[PANEL, 'p-4']">
          <div class="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_11rem] gap-5">
          <div class="space-y-4">
            <div class="space-y-1.5">
              <label :for="nameFieldId" :class="FIELD_LABEL">
                {{ t('management.partnerTemplateForm.fields.nameLabel') }} <span class="text-red-500">*</span>
              </label>
              <input
                :id="nameFieldId"
                v-model="form.name"
                type="text"
                :placeholder="t('management.partnerTemplateForm.fields.namePlaceholder')"
                maxlength="100"
                :class="FIELD"
              />
            </div>

            <div class="space-y-1.5">
              <label :for="previewUrlFieldId" :class="FIELD_LABEL">
                {{ t('management.partnerTemplateForm.fields.previewUrlLabel') }}
              </label>
              <input
                :id="previewUrlFieldId"
                v-model="form.youtube_preview_url"
                type="url"
                placeholder="https://goevent.online/g/dPmdHn?lang=kh"
                :class="FIELD"
              />
              <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.fields.previewUrlHint') }}</p>
            </div>

            <!-- Where this design sits in the browse menu. A bare number
                 rather than a slider: nothing on the phone beside it moves
                 when the value changes, so there is nothing to drag
                 against. The hint carries the whole meaning of the number,
                 so it sits beside the box rather than under it — at this
                 width, underneath it would wrap to five lines. -->
            <div class="space-y-1.5">
              <label :for="orderFieldId" :class="FIELD_LABEL">
                {{ t('management.partnerTemplateForm.fields.orderLabel') }}
              </label>
              <div class="flex items-center gap-2.5">
                <!-- The width lives on the wrapper, not the input: FIELD
                     leads with `w-full`, and a `w-20` written beside it in
                     the class list loses to stylesheet order — the same
                     trap FIELD_NUM's note describes. On the input it did
                     nothing, so the box filled the column and squeezed the
                     hint into a one-word-wide stripe. -->
                <div class="w-20 flex-shrink-0">
                  <input
                    :id="orderFieldId"
                    ref="orderInputEl"
                    :value="form.order"
                    type="number"
                    inputmode="numeric"
                    min="0"
                    step="1"
                    :class="[FIELD, 'text-center tabular-nums']"
                    @input="onOrderInput"
                    @blur="onOrderBlur"
                  />
                </div>
                <p :class="[FIELD_HINT, 'min-w-0']">
                  {{ t('management.partnerTemplateForm.fields.orderHint', { default: TEMPLATE_MENU_ORDER_DEFAULT }) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Gallery thumbnail. Sits here, in Basics, rather than beside the
               live preview where two different "previews" competed for the
               same corner of the screen. -->
          <div class="space-y-1.5">
            <span :class="FIELD_LABEL">
              {{ t('management.partnerTemplateForm.fields.previewImageLabel') }}
            </span>
            <div
              class="relative border-2 border-dashed rounded-xl overflow-hidden transition-colors"
              :class="hasPreviewImage ? 'border-slate-200' : 'border-slate-200 bg-white hover:border-sky-400 hover:bg-sky-50/40'"
            >
              <div v-if="hasPreviewImage" class="relative aspect-[9/16] overflow-hidden">
                <img
                  :src="previews.preview_image || existingTemplate?.preview_image || ''"
                  :alt="t('management.partnerTemplateForm.fields.previewImageLabel')"
                  class="w-full h-full object-cover"
                />
                <!-- A bar along the bottom edge, always drawn — not a
                     full-cover overlay revealed by `hover:opacity-100`.
                     That overlay put Change and Remove behind a gesture
                     that does not exist on a phone, and this editor has a
                     phone layout, so an uploaded thumbnail could not be
                     replaced or cleared there at all. It was invisible to
                     the keyboard for the same reason: both controls stayed
                     focusable at `opacity-0`, so tabbing moved focus onto
                     something no one could see. A bar also leaves the
                     artwork itself unobscured, which a scrim over the whole
                     9:16 frame did not. -->
                <div
                  class="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 p-2 bg-gradient-to-t from-slate-950/70 to-transparent"
                >
                  <label
                    class="cursor-pointer px-2.5 py-1.5 bg-white/95 rounded-lg text-[0.6875rem] font-medium text-slate-700 shadow-sm transition-colors duration-200 hover:bg-white focus-within:ring-2 focus-within:ring-sky-400"
                  >
                    {{ t('management.partnerTemplateForm.fields.previewImageChange') }}
                    <input type="file" accept="image/*" class="sr-only" @change="handleFileChange('preview_image', $event)" />
                  </label>
                  <button
                    type="button"
                    class="p-1.5 bg-white/95 rounded-lg text-slate-500 shadow-sm transition-colors duration-200 hover:text-red-600 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    :aria-label="t('management.partnerTemplateForm.fileField.remove')"
                    :title="t('management.partnerTemplateForm.fileField.remove')"
                    @click="clearAssetField('preview_image')"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <label v-else class="flex flex-col items-center justify-center aspect-[9/16] cursor-pointer">
                <Upload class="w-6 h-6 text-slate-400 mb-1.5" />
                <span class="text-xs font-medium text-slate-500 text-center px-2">{{ t('management.partnerTemplateForm.fields.previewImageUpload') }}</span>
                <span class="text-[0.625rem] text-slate-400 mt-0.5 text-center">{{ t('management.partnerTemplateForm.fields.previewImageAspect') }}</span>
                <input type="file" accept="image/*" class="sr-only" @change="handleFileChange('preview_image', $event)" />
              </label>
            </div>
          </div>
          </div>
        </section>

        <!-- Package plan. The single most consequential field in the form —
             it decides which asset slots even exist — so it gets cards with
             their prices rather than one collapsed <select> row. -->
        <section :class="[PANEL, 'p-4 space-y-3']">
          <h5 :class="SECTION_HEADING">
            {{ t('management.partnerTemplateForm.fields.planLabel') }} <span class="text-red-500">*</span>
          </h5>
          <div v-if="plansLoading" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div v-for="n in 2" :key="n" class="h-16 rounded-xl bg-slate-100 animate-pulse" />
          </div>
          <p v-else-if="planOptions.length === 0" class="text-xs text-slate-500 p-3 bg-slate-50 ring-1 ring-slate-200 rounded-xl">
            {{ t('management.partnerTemplateForm.fields.planEmpty') }}
          </p>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" :aria-label="t('management.partnerTemplateForm.fields.planLabel')">
            <button
              v-for="plan in planOptions"
              :key="plan.id"
              type="button"
              role="radio"
              :aria-checked="form.package_plan_id === plan.id"
              class="flex items-start gap-2.5 p-3 rounded-xl text-left"
              :class="optionClass(form.package_plan_id === plan.id)"
              @click="form.package_plan_id = plan.id"
            >
              <component
                :is="isPlanStandard(plan) ? Crown : Sparkles"
                class="w-4 h-4 mt-0.5 flex-shrink-0 transition-colors duration-200"
                :class="optionIconClass(form.package_plan_id === plan.id)"
              />
              <span class="min-w-0 flex-1">
                <span v-if="plan.category" class="block text-[0.625rem] font-semibold uppercase tracking-wider text-slate-400 truncate">
                  {{ plan.category.name }}
                </span>
                <span class="block text-[0.8125rem] font-medium text-slate-800 truncate">{{ plan.name }}</span>
                <span class="block text-[0.6875rem] text-slate-500">${{ plan.price }}</span>
              </span>
              <Check v-if="form.package_plan_id === plan.id" class="w-4 h-4 flex-shrink-0 text-[#1e90ff]" />
            </button>
          </div>
        </section>
</template>

<script setup lang="ts">
import { ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, Crown, Sparkles, Upload, X } from 'lucide-vue-next'

import { TEMPLATE_MENU_ORDER_DEFAULT } from '@/services/api'
import {
  FIELD,
  FIELD_HINT,
  FIELD_LABEL,
  PANEL,
  SECTION_HEADING,
  optionClass,
  optionIconClass,
} from '../templateUi'
import { isPlanStandard, type TemplatePlans } from '../useTemplatePlans'
import { useTemplateEditor } from '../templateEditorContext'

/**
 * What the template is called, where it sits in the menu, which plan prices it,
 * and the artwork the browse grid shows for it.
 *
 * `plans` arrives whole for the same reason `brand` does in BrandSection: the
 * editor holds it because it decides when to load it, and splitting one
 * composable's return across a prop list is a second copy of its interface.
 */
const props = defineProps<{ plans: TemplatePlans }>()

// Destructured so the template sees unwrapped refs — see BrandSection for why.
const { plansLoading, planOptions } = props.plans

const { form, existingTemplate, assets } = useTemplateEditor()
const { previews, hasPreviewImage, handleFileChange, clearAssetField } = assets

const { t } = useI18n()

const nameFieldId = useId()
const previewUrlFieldId = useId()
const orderFieldId = useId()
const orderInputEl = ref<HTMLInputElement | null>(null)

/**
 * Menu position, kept a valid number at all times.
 *
 * An empty box mid-edit must not blank `form.order` — the save path would then
 * send `order=` and the server would reject the whole template — so an
 * unparseable value leaves the last good one in place, and blur puts that
 * number back on screen so the field never rests looking empty. Same contract
 * as TemplateFormNumber's number box.
 */
function onOrderInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  if (raw === '') return
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) return
  form.order = Math.round(value)
}

function onOrderBlur(): void {
  if (orderInputEl.value) orderInputEl.value.value = String(form.order)
}
</script>
