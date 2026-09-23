<template>
        <!-- One panel, because these are all one question asked in parts:
             what happens between the cover and the invitation. They were
             four cards, each holding a single control under an uppercase
             eyebrow that named it — two levels of heading over one field,
             repeated four times, with the panel edges implying the four
             were unrelated. The eyebrow is now the control's own label,
             which is where a field's name goes everywhere else in this
             editor, and the hairlines say "still the same subject" where
             the gaps between cards said "new subject". -->
        <section :class="[PANEL, 'divide-y divide-slate-200/70']">
          <!-- One control, two stages: it chooses the cover's exit animation
               *and* the transition that plays under it — decorations sliding
               off into a veil reveal, or the cover splitting into two doors.
               It used to sit in Cover, which showed half of what it does. -->
          <div class="p-4 space-y-2">
            <TemplateFormChoice
              v-model="animationTypeModel"
              :label="t('management.partnerTemplateForm.transitionStage.animationGroup')"
              :options="animationOptions"
            />
            <p :class="FIELD_HINT">
              {{ t('management.partnerTemplateForm.transitionStage.animationHint') }}
            </p>
          </div>

          <!-- What the beat itself is. Below the animation control, because
               that control still governs the cover's own exit whichever
               shape is picked. -->
          <div class="p-4 space-y-2">
            <TemplateFormChoice
              v-model="transitionModeModel"
              :label="t('management.partnerTemplateForm.stageModes.transitionGroup')"
              :options="transitionModeOptions"
            />
            <p :class="FIELD_HINT">
              {{ t(`management.partnerTemplateForm.stageModes.transitionHint.${form.stage_mode_transition}`) }}
            </p>
          </div>

          <!-- The title card that plays over the featured photo on whichever
               stage the animation control picked — so it shows only when the
               beat is that card. Its own default option, match the transition,
               only means anything next to the control it matches. Not
               plan-gated: this is a composition, not an asset slot. -->
          <div v-if="form.stage_mode_transition === 'animation'" class="p-4 space-y-2">
            <TemplateFormChoice
              v-model="saveTheDateDesignModel"
              :label="t('management.partnerTemplateForm.saveTheDateDesign.sectionTitle')"
              :options="saveTheDateDesignOptions"
              :columns="1"
            />
            <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.saveTheDateDesign.designHint') }}</p>
          </div>

          <!-- The film. Stays inside the panel so the beat's asset sits with
               the choice that asked for it, rather than in a card of its own
               that appears and disappears as the mode changes. -->
          <div v-else-if="form.package_plan_id" class="p-4 space-y-2">
            <FileUploadField
              :label="t('management.partnerTemplateForm.transitionStage.video')"
              accept="video/*"
              :file-name="form.standard_transition_video?.name"
              :has-existing-file="hasSavedAsset('standard_transition_video')"
              @change="handleFileChange('standard_transition_video', $event)"
              @clear="clearAssetField('standard_transition_video')"
            />
            <p :class="FIELD_HINT">
              {{ t('management.partnerTemplateForm.transitionStage.videoHint') }}
            </p>
          </div>
        </section>

        <PlanRequiredNotice
          v-if="!form.package_plan_id && form.stage_mode_transition === 'video'"
          @pick="selectSection('basics')"
        />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Ban, Clapperboard, Columns3, DoorOpen, Frame, Minus, Signature, Sparkles, Stamp, Type, Wand2 } from 'lucide-vue-next'

import TemplateFormChoice from '../TemplateFormChoice.vue'
import FileUploadField from '../PartnerTemplateFileField.vue'
import PlanRequiredNotice from '../TemplateFormPlanNotice.vue'
import { FIELD_HINT, PANEL } from '../templateUi'
import { enumModel } from '../formModels'
import { useTemplateEditor } from '../templateEditorContext'

/**
 * What happens between the cover and the invitation.
 *
 * One panel, because these are all one question asked in parts — the cover's
 * exit animation, what the beat itself is, and whichever of the two things that
 * beat then needs (a title card's composition, or a film).
 */
const { form, assets, selectSection } = useTemplateEditor()
const { hasSavedAsset, handleFileChange, clearAssetField } = assets

const { t } = useI18n()

const animationOptions = computed(() => [
  { value: 'decoration', label: t('management.partnerTemplateForm.transitionStage.animationDecoration'), icon: Sparkles },
  { value: 'door', label: t('management.partnerTemplateForm.transitionStage.animationDoor'), icon: DoorOpen },
])

const stageModeOptions = computed(() => [
  { value: 'animation', label: t('management.partnerTemplateForm.stageModes.animation'), icon: Sparkles },
  { value: 'video', label: t('management.partnerTemplateForm.stageModes.video'), icon: Clapperboard },
])

/**
 * The middle stage gets a third option the other two don't: no stage at all.
 *
 * A cover and an invitation backdrop are always *something*, so "none" is not a
 * question they can be asked — which is why this is a separate list rather than
 * a fourth entry in the shared one. It is also the only picker whose value can
 * remove a stage, so a birthday or funeral design says outright that it goes
 * straight from the cover to the invitation, instead of that happening as a
 * side effect of the event having uploaded no featured photograph.
 */
const transitionModeOptions = computed(() => [
  ...stageModeOptions.value,
  { value: 'none', label: t('management.partnerTemplateForm.stageModes.none'), icon: Ban },
])

const saveTheDateDesignOptions = computed(() => [
  { value: 'auto', label: t('management.partnerTemplateForm.saveTheDateDesign.types.auto'), icon: Wand2 },
  { value: 'script', label: t('management.partnerTemplateForm.saveTheDateDesign.types.script'), icon: Signature },
  { value: 'engraved', label: t('management.partnerTemplateForm.saveTheDateDesign.types.engraved'), icon: Frame },
  { value: 'minimal', label: t('management.partnerTemplateForm.saveTheDateDesign.types.minimal'), icon: Minus },
  { value: 'columns', label: t('management.partnerTemplateForm.saveTheDateDesign.types.columns'), icon: Columns3 },
  { value: 'medallion', label: t('management.partnerTemplateForm.saveTheDateDesign.types.medallion'), icon: Stamp },
  { value: 'poster', label: t('management.partnerTemplateForm.saveTheDateDesign.types.poster'), icon: Type },
])

const animationTypeModel = enumModel(() => form.cover_stage_layout, 'showcaseAnimationType')
const transitionModeModel = enumModel(() => form, 'stage_mode_transition')
const saveTheDateDesignModel = enumModel(() => form, 'save_the_date_design_type')
</script>
