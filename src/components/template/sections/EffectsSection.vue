<template>
        <!-- Cover stage only: CoverStage hands these to CoverContentOverlay
             and nothing else renders them. -->
        <section :class="[PANEL, 'overflow-hidden']">
          <TemplateFormSwitch
            v-model="form.ambient_creatures_enabled"
            :label="t('management.partnerTemplateForm.ambientCreatures.enableLabel')"
            :description="t('management.partnerTemplateForm.ambientCreatures.enableHint')"
          />

          <TemplateFormDisclosure
            :open="form.ambient_creatures_enabled"
            content-class="px-3 pb-3 pt-3 space-y-4 border-t border-slate-100"
          >
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                    <TemplateFormNumber
                      v-model="form.ambient_creatures.count"
                      :label="t('management.partnerTemplateForm.ambientCreatures.count')"
                      :min="1"
                      :max="15"
                      :step="1"
                    />
                    <TemplateFormChoice
                      v-model="creatureSpeedModel"
                      :label="t('management.partnerTemplateForm.ambientCreatures.speed')"
                      :options="speedOptions"
                      variant="segmented"
                    />
                  </div>

                  <TemplateFormChoice
                    v-model="creatureColorSourceModel"
                    :label="t('management.partnerTemplateForm.ambientCreatures.colorSource')"
                    :options="creatureColorSourceOptions"
                    variant="segmented"
                  />

                  <TemplateFormColor
                    v-if="form.ambient_creatures.color_source === 'custom'"
                    v-model="form.ambient_creatures.custom_color"
                    :name="t('management.partnerTemplateForm.colorField.names.creatures')"
                    placeholder="#FFD700"
                  />

                  <div class="space-y-2">
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-xs font-medium text-slate-600">
                        {{ t('management.partnerTemplateForm.ambientCreatures.creaturesLabel') }}
                        <span class="text-slate-400">· {{ form.ambient_creatures.creatures.length }}/4</span>
                      </span>
                      <button
                        type="button"
                        @click="addCreatureEntry"
                        :disabled="form.ambient_creatures.creatures.length >= 4 || availableCreatureTypes.length === 0"
                        :class="BTN_ADD_DASHED"
                      >
                        <Plus class="w-3.5 h-3.5" />
                        {{ t('management.partnerTemplateForm.ambientCreatures.addCreature') }}
                      </button>
                    </div>

                    <div
                      v-for="(entry, index) in form.ambient_creatures.creatures"
                      :key="index"
                      class="p-3 ring-1 ring-slate-200 rounded-xl space-y-3 bg-slate-50/70"
                    >
                      <div class="flex items-center gap-2">
                        <TemplateFormSelect
                          class="flex-1 min-w-0"
                          :model-value="entry.type"
                          :options="creatureTypeOptionsFor(index)"
                          :label="t('management.partnerTemplateForm.ambientCreatures.typeLabel')"
                          @update:model-value="(value) => (entry.type = value as AmbientCreatureEffectType)"
                        />
                        <button
                          v-if="form.ambient_creatures.creatures.length > 1"
                          type="button"
                          @click="removeCreatureEntry(index)"
                          :class="[BTN_ICON_MICRO, 'mt-5 hover:text-red-600 hover:bg-red-50']"
                          :aria-label="t('management.partnerTemplateForm.ambientCreatures.removeBtn')"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                      <div class="grid grid-cols-3 gap-2">
                        <div class="space-y-1">
                          <label :for="`${creatureFieldId}-${index}-weight`" class="block text-[0.6875rem] text-slate-500">{{ t('management.partnerTemplateForm.ambientCreatures.weightLabel') }}</label>
                          <input :id="`${creatureFieldId}-${index}-weight`" v-model.number="entry.weight" type="number" min="1" max="10" step="1" :class="FIELD_SM" />
                        </div>
                        <div class="space-y-1">
                          <label :for="`${creatureFieldId}-${index}-min_size`" class="block text-[0.6875rem] text-slate-500">{{ t('management.partnerTemplateForm.ambientCreatures.minSize') }}</label>
                          <input :id="`${creatureFieldId}-${index}-min_size`" v-model.number="entry.min_size" type="number" min="4" max="200" step="1" :placeholder="t('management.partnerTemplateForm.ambientCreatures.sizeAuto')" :class="FIELD_SM" />
                        </div>
                        <div class="space-y-1">
                          <label :for="`${creatureFieldId}-${index}-max_size`" class="block text-[0.6875rem] text-slate-500">{{ t('management.partnerTemplateForm.ambientCreatures.maxSize') }}</label>
                          <input :id="`${creatureFieldId}-${index}-max_size`" v-model.number="entry.max_size" type="number" min="4" max="200" step="1" :placeholder="t('management.partnerTemplateForm.ambientCreatures.sizeAuto')" :class="FIELD_SM" />
                        </div>
                      </div>
                    </div>
                  </div>
          </TemplateFormDisclosure>
        </section>

        <!-- Main content stage only, see MainContentStage's FallingEffect —
             never drawn over the cover. -->
        <section :class="[PANEL, 'overflow-hidden']">
          <TemplateFormSwitch
            v-model="form.falling_effect_enabled"
            :label="t('management.partnerTemplateForm.fallingEffect.enableLabel')"
            :description="t('management.partnerTemplateForm.fallingEffect.enableHint')"
          />

          <TemplateFormDisclosure
            :open="form.falling_effect_enabled"
            content-class="px-3 pb-3 pt-3 space-y-4 border-t border-slate-100"
          >
                  <TemplateFormSelect
                    v-model="fallingTypeModel"
                    :label="t('management.partnerTemplateForm.fallingEffect.particleType')"
                    :options="fallingTypeOptions"
                  />
                  <TemplateFormChoice
                    v-model="fallingIntensityModel"
                    :label="t('management.partnerTemplateForm.fallingEffect.intensity')"
                    :options="intensityOptions"
                    variant="segmented"
                  />
                  <!-- Speed is separate from intensity on purpose: intensity
                       is how many particles are on screen, this is how fast
                       each one crosses it. The renderer rescales the spawn
                       rate to match, so moving this slider doesn't quietly
                       thin out or crowd the field the partner just set. -->
                  <TemplateFormNumber
                    v-model="form.falling_effect.speed"
                    :label="t('management.partnerTemplateForm.fallingEffect.speed')"
                    :min="FALLING_SPEED_RANGE.min"
                    :max="FALLING_SPEED_RANGE.max"
                    :step="FALLING_SPEED_RANGE.step"
                    unit="×"
                  />
                  <TemplateFormChoice
                    v-model="fallingColorSourceModel"
                    :label="t('management.partnerTemplateForm.fallingEffect.colorSource')"
                    :options="fallingColorSourceOptions"
                    variant="segmented"
                  />
                  <TemplateFormColor
                    v-if="form.falling_effect.color_source === 'custom'"
                    v-model="form.falling_effect.custom_color"
                    :name="t('management.partnerTemplateForm.colorField.names.fallingEffect')"
                    placeholder="#FFD700"
                  />

                  <TemplateFormImageField
                    :label="t('management.partnerTemplateForm.fallingEffect.customImage')"
                    :hint="t('management.partnerTemplateForm.fallingEffect.customImageHint')"
                    :upload-label="t('management.partnerTemplateForm.fallingEffect.uploadCustom')"
                    accept="image/png,image/svg+xml"
                    :preview="fallingEffectCustomImageSrc"
                    :file-name="form.falling_effect_custom_image?.name"
                    @change="handleFileChange('falling_effect_custom_image', $event)"
                    @clear="clearFallingEffectCustomImage"
                  />
          </TemplateFormDisclosure>
        </section>

        <!-- Every stage: mounted by CoverStage for the life of the showcase,
             so one field drifts unbroken from the cover into the main content. -->
        <section :class="[PANEL, 'overflow-hidden']">
          <TemplateFormSwitch
            v-model="form.sparks_enabled"
            :label="t('management.partnerTemplateForm.sparks.enableLabel')"
            :description="t('management.partnerTemplateForm.sparks.enableHint')"
          />

          <TemplateFormDisclosure
            :open="form.sparks_enabled"
            content-class="px-3 pb-3 pt-3 space-y-4 border-t border-slate-100"
          >
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                    <TemplateFormNumber
                      v-model="form.sparks.count"
                      :label="t('management.partnerTemplateForm.sparks.count')"
                      :min="0"
                      :max="SPARK_MAX_COUNT"
                      :step="1"
                    />
                    <!-- How fast each mote pulses, independent of how many
                         there are — the same split the falling effect draws
                         between intensity and speed. -->
                    <TemplateFormNumber
                      v-model="form.sparks.blink_speed"
                      :label="t('management.partnerTemplateForm.sparks.blinkSpeed')"
                      :min="SPARK_BLINK_SPEED_RANGE.min"
                      :max="SPARK_BLINK_SPEED_RANGE.max"
                      :step="SPARK_BLINK_SPEED_RANGE.step"
                      unit="×"
                    />
                  </div>

                  <!-- Sizes are a % of the stage width, not px: the stage is
                       min(100vw, 56.25vh), so a pixel size tuned on a desktop
                       lands twice as heavy on a phone. Each mote picks a
                       random size in this range. -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                    <TemplateFormNumber
                      v-model="form.sparks.min_size"
                      :label="t('management.partnerTemplateForm.sparks.minSize')"
                      :min="SPARK_SIZE_RANGE.min"
                      :max="SPARK_SIZE_RANGE.max"
                      :step="SPARK_SIZE_RANGE.step"
                      unit="%"
                    />
                    <TemplateFormNumber
                      v-model="form.sparks.max_size"
                      :label="t('management.partnerTemplateForm.sparks.maxSize')"
                      :min="SPARK_SIZE_RANGE.min"
                      :max="SPARK_SIZE_RANGE.max"
                      :step="SPARK_SIZE_RANGE.step"
                      unit="%"
                    />
                  </div>
                  <p :class="FIELD_HINT">
                    {{ t('management.partnerTemplateForm.sparks.sizeHint') }}
                  </p>

                  <TemplateFormSelect
                    v-if="!sparkUsesCustomImage"
                    v-model="sparkShapeModel"
                    :label="t('management.partnerTemplateForm.sparks.shape')"
                    :options="sparkShapeOptions"
                  />

                  <TemplateFormChoice
                    v-model="sparkIntensityModel"
                    :label="t('management.partnerTemplateForm.sparks.intensity')"
                    :options="sparkIntensityOptions"
                    variant="segmented"
                  />

                  <TemplateFormChoice
                    v-model="sparkColorSourceModel"
                    :label="t('management.partnerTemplateForm.sparks.colorSource')"
                    :options="sparkColorSourceOptions"
                    variant="segmented"
                  />

                  <TemplateFormColor
                    v-if="form.sparks.color_source === 'custom'"
                    v-model="form.sparks.custom_color"
                    :name="t('management.partnerTemplateForm.colorField.names.sparks')"
                    placeholder="#E0B269"
                  />

                  <TemplateFormImageField
                    :label="t('management.partnerTemplateForm.sparks.customImage')"
                    :hint="t('management.partnerTemplateForm.sparks.customImageHint')"
                    :upload-label="t('management.partnerTemplateForm.sparks.uploadCustom')"
                    accept="image/png,image/svg+xml"
                    :preview="sparkCustomImageSrc"
                    :file-name="form.spark_custom_image?.name"
                    @change="handleFileChange('spark_custom_image', $event)"
                    @clear="clearSparkCustomImage"
                  />
          </TemplateFormDisclosure>
        </section>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Trash2 } from 'lucide-vue-next'

import type {
  AmbientCreatureEffectType,
  AmbientCreatureEntry,
  FallingEffectType,
  SparkShape,
} from '@/services/api'
import { FALLING_SPEED_RANGE } from '@/composables/showcase/useFallingParticles'
import {
  SPARK_BLINK_SPEED_RANGE,
  SPARK_MAX_COUNT,
  SPARK_SIZE_RANGE,
} from '@/composables/showcase/useSparkField'

import TemplateFormChoice from '../TemplateFormChoice.vue'
import TemplateFormColor from '../TemplateFormColor.vue'
import TemplateFormDisclosure from '../TemplateFormDisclosure.vue'
import TemplateFormImageField from '../TemplateFormImageField.vue'
import TemplateFormNumber from '../TemplateFormNumber.vue'
import TemplateFormSelect from '../TemplateFormSelect.vue'
import TemplateFormSwitch from '../TemplateFormSwitch.vue'
import { BTN_ADD_DASHED, BTN_ICON_MICRO, FIELD_HINT, FIELD_SM, PANEL } from '../templateUi'
import { CREATURE_TYPES } from '../config'
import { enumModel } from '../formModels'
import { useTemplateEditor } from '../templateEditorContext'

/**
 * The three ambient decorations — falling particles, drifting creatures and the
 * spark field.
 *
 * Gathered here rather than split across the two stage tabs that render them,
 * because each is an independent field with its own switch: which stage happens
 * to draw it is a property of the effect, not a reason to bury its controls in
 * that stage's panel. None is plan-gated.
 */
const { form, existingTemplate, assets } = useTemplateEditor()
const { handleFileChange, clearConfigImage, configImageSrc } = assets

const { t } = useI18n()

/** Base for the per-row ids of the ambient-creature number fields. */
const creatureFieldId = useId()

// Pending pick, else the saved file, else nothing if it is staged for removal —
// the precedence lives in useTemplateAssets so every field answers it the same way.
const fallingEffectCustomImageSrc = configImageSrc(
  'falling_effect_custom_image',
  () => existingTemplate.value?.falling_effect?.custom_image,
)
const sparkCustomImageSrc = configImageSrc(
  'spark_custom_image',
  () => existingTemplate.value?.spark_custom_image,
)

const clearFallingEffectCustomImage = () => clearConfigImage('falling_effect_custom_image')
const clearSparkCustomImage = () => clearConfigImage('spark_custom_image')

const creatureTypeLabels = computed<Record<AmbientCreatureEffectType, string>>(() => ({
  butterfly: t('management.partnerTemplateForm.ambientCreatures.types.butterfly'),
  dove: t('management.partnerTemplateForm.ambientCreatures.types.dove'),
  firefly: t('management.partnerTemplateForm.ambientCreatures.types.firefly'),
  dragonfly: t('management.partnerTemplateForm.ambientCreatures.types.dragonfly'),
  balloon: t('management.partnerTemplateForm.ambientCreatures.types.balloon'),
  hummingbird: t('management.partnerTemplateForm.ambientCreatures.types.hummingbird'),
}))

const fallingTypeLabels = computed<Record<FallingEffectType, string>>(() => ({
  petals: t('management.partnerTemplateForm.fallingEffect.types.petals'),
  confetti: t('management.partnerTemplateForm.fallingEffect.types.confetti'),
  snowflakes: t('management.partnerTemplateForm.fallingEffect.types.snowflakes'),
  stars: t('management.partnerTemplateForm.fallingEffect.types.stars'),
  leaves: t('management.partnerTemplateForm.fallingEffect.types.leaves'),
  maple: t('management.partnerTemplateForm.fallingEffect.types.maple'),
  hearts: t('management.partnerTemplateForm.fallingEffect.types.hearts'),
  none: t('management.partnerTemplateForm.fallingEffect.types.none'),
}))

// Which creature types are still selectable (duplicates rejected server-side)
const availableCreatureTypes = computed<AmbientCreatureEffectType[]>(() => {
  const used = new Set(form.ambient_creatures.creatures.map((c: AmbientCreatureEntry) => c.type))
  return CREATURE_TYPES.filter((type) => !used.has(type))
})

function addCreatureEntry(): void {
  const next = availableCreatureTypes.value[0]
  if (!next || form.ambient_creatures.creatures.length >= 4) return
  form.ambient_creatures.creatures.push({ type: next, weight: 1 })
}

function removeCreatureEntry(index: number): void {
  if (form.ambient_creatures.creatures.length <= 1) return
  form.ambient_creatures.creatures.splice(index, 1)
}

// Types usable by a specific creature entry (its current type stays available)
function creatureTypeOptionsFor(index: number): Array<{ value: string; label: string }> {
  const current = form.ambient_creatures.creatures[index]?.type
  const used = new Set(form.ambient_creatures.creatures.map((c: AmbientCreatureEntry) => c.type))
  return CREATURE_TYPES.filter((type) => !used.has(type) || type === current).map((type) => ({
    value: type,
    label: creatureTypeLabels.value[type],
  }))
}

const intensityOptions = computed(() => [
  { value: 'light', label: t('management.partnerTemplateForm.fallingEffect.intensityLight') },
  { value: 'normal', label: t('management.partnerTemplateForm.fallingEffect.intensityNormal') },
  { value: 'heavy', label: t('management.partnerTemplateForm.fallingEffect.intensityHeavy') },
])

const speedOptions = computed(() => [
  { value: 'slow', label: t('management.partnerTemplateForm.ambientCreatures.speedSlow') },
  { value: 'normal', label: t('management.partnerTemplateForm.ambientCreatures.speedNormal') },
  { value: 'fast', label: t('management.partnerTemplateForm.ambientCreatures.speedFast') },
])

const fallingColorSourceOptions = computed(() => [
  { value: 'primary', label: t('management.partnerTemplateForm.fallingEffect.sourcePrimaryShort') },
  { value: 'accent', label: t('management.partnerTemplateForm.fallingEffect.sourceAccentShort') },
  { value: 'custom', label: t('management.partnerTemplateForm.fallingEffect.sourceCustomShort') },
])

const creatureColorSourceOptions = computed(() => [
  { value: 'primary', label: t('management.partnerTemplateForm.ambientCreatures.sourcePrimary') },
  { value: 'accent', label: t('management.partnerTemplateForm.ambientCreatures.sourceAccent') },
  { value: 'custom', label: t('management.partnerTemplateForm.fallingEffect.sourceCustomShort') },
])

const fallingTypeOptions = computed(() =>
  (Object.entries(fallingTypeLabels.value) as Array<[FallingEffectType, string]>).map(
    ([value, label]) => ({ value, label }),
  ),
)

const sparkShapeLabels = computed<Record<SparkShape, string>>(() => ({
  glow: t('management.partnerTemplateForm.sparks.shapes.glow'),
  sparkle: t('management.partnerTemplateForm.sparks.shapes.sparkle'),
  star: t('management.partnerTemplateForm.sparks.shapes.star'),
  diamond: t('management.partnerTemplateForm.sparks.shapes.diamond'),
  cross: t('management.partnerTemplateForm.sparks.shapes.cross'),
  dot: t('management.partnerTemplateForm.sparks.shapes.dot'),
}))

const sparkShapeOptions = computed(() =>
  (Object.entries(sparkShapeLabels.value) as Array<[SparkShape, string]>).map(([value, label]) => ({
    value,
    label,
  })),
)

// Same four slots the gilding offers, so a template that switches from the
// legacy fallback to a standalone config keeps the tint it already had.
const sparkColorSourceOptions = computed(() => [
  { value: 'primary', label: t('management.partnerTemplateForm.ambientCreatures.sourcePrimary') },
  { value: 'secondary', label: t('management.partnerTemplateForm.coverGilding.sourceSecondary') },
  { value: 'accent', label: t('management.partnerTemplateForm.ambientCreatures.sourceAccent') },
  { value: 'custom', label: t('management.partnerTemplateForm.fallingEffect.sourceCustomShort') },
])

const sparkIntensityOptions = computed(() => [
  { value: 'subtle', label: t('management.partnerTemplateForm.coverGilding.intensitySubtle') },
  { value: 'normal', label: t('management.partnerTemplateForm.coverGilding.intensityNormal') },
  { value: 'bright', label: t('management.partnerTemplateForm.coverGilding.intensityBright') },
])

/** A custom upload replaces the built-in shape, so the shape picker goes quiet. */
const sparkUsesCustomImage = computed(
  () =>
    !!form.spark_custom_image ||
    (!!existingTemplate.value?.spark_custom_image && !form.clear_spark_custom_image),
)

const fallingTypeModel = enumModel(() => form.falling_effect, 'type')
const fallingIntensityModel = enumModel(() => form.falling_effect, 'intensity')
const fallingColorSourceModel = enumModel(() => form.falling_effect, 'color_source')
const creatureSpeedModel = enumModel(() => form.ambient_creatures, 'speed')
const creatureColorSourceModel = enumModel(() => form.ambient_creatures, 'color_source')
const sparkShapeModel = enumModel(() => form.sparks, 'shape')
const sparkColorSourceModel = enumModel(() => form.sparks, 'color_source')
const sparkIntensityModel = enumModel(() => form.sparks, 'intensity')
</script>
