<template>
        <PlanRequiredNotice v-if="!form.package_plan_id" @pick="selectSection('basics')" />
        <!-- The artwork, and the light on it. The gilding lights this
             artwork's own border, so it closes the panel that uploads the
             artwork rather than sitting in a panel of its own between the
             artwork and the text. -->
        <section v-else :class="[PANEL, 'overflow-hidden divide-y divide-slate-200/70']">
          <div class="p-4 space-y-3">
            <h5 :class="SECTION_HEADING">
              {{ t('management.partnerTemplateForm.coverDecorations.backdropGroup') }}
            </h5>
            <!-- What the cover is: artwork that animates away, or a film.
                 It picks the backdrop slot below, because the stage draws
                 one or the other and never both. -->
            <TemplateFormChoice v-model="coverModeModel" :options="stageModeOptions" />
            <p :class="FIELD_HINT">
              {{ t(`management.partnerTemplateForm.stageModes.coverHint.${form.stage_mode_cover}`) }}
            </p>
            <FileUploadField
              v-if="form.stage_mode_cover === 'animation'"
              :label="t('management.partnerTemplateForm.coverDecorations.coverBackground')"
              accept="image/*"
              :file-name="form.basic_decoration_photo?.name"
              :has-existing-file="hasSavedAsset('basic_decoration_photo')"
              @change="handleFileChange('basic_decoration_photo', $event)"
              @clear="clearAssetField('basic_decoration_photo')"
            />
            <FileUploadField
              v-else
              :label="t('management.partnerTemplateForm.coverDecorations.coverBackground')"
              accept="video/*"
              :file-name="form.standard_cover_video?.name"
              :has-existing-file="hasSavedAsset('standard_cover_video')"
              @change="handleFileChange('standard_cover_video', $event)"
              @clear="clearAssetField('standard_cover_video')"
            />
            <!-- Cover artwork, so it follows the cover's mode rather
                 than the plan: a filmed cover has nothing to frame. -->
            <div v-if="form.stage_mode_cover === 'animation'" class="grid grid-cols-2 gap-2.5">
              <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.coverTop')" accept="image/*" :file-name="form.cover_top_decoration?.name" :has-existing-file="hasSavedAsset('cover_top_decoration')" @change="handleFileChange('cover_top_decoration', $event)" @clear="clearAssetField('cover_top_decoration')" />
              <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.coverBottom')" accept="image/*" :file-name="form.cover_bottom_decoration?.name" :has-existing-file="hasSavedAsset('cover_bottom_decoration')" @change="handleFileChange('cover_bottom_decoration', $event)" @clear="clearAssetField('cover_bottom_decoration')" />
              <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.coverLeft')" accept="image/*" :file-name="form.cover_left_decoration?.name" :has-existing-file="hasSavedAsset('cover_left_decoration')" @change="handleFileChange('cover_left_decoration', $event)" @clear="clearAssetField('cover_left_decoration')" />
              <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.coverRight')" accept="image/*" :file-name="form.cover_right_decoration?.name" :has-existing-file="hasSavedAsset('cover_right_decoration')" @change="handleFileChange('cover_right_decoration', $event)" @clear="clearAssetField('cover_right_decoration')" />
            </div>
          </div>

          <!-- Lighting for the artwork's border: still stored in
               cover_stage_layout, but about this stage only. The cover's
               exit animation used to head this group; it chooses the
               transition as much as the exit, so it lives in the
               Transition tab beside the film it plays into.

               No eyebrow: one once read "Cover gilding" directly above a
               switch reading *Enable gilding*. The switch names the
               feature. -->
          <div>
            <TemplateFormSwitch
              v-model="form.cover_stage_layout.coverGilding.enabled"
              :label="t('management.partnerTemplateForm.coverGilding.enableLabel')"
              :description="t('management.partnerTemplateForm.coverGilding.enableHint')"
            />

            <TemplateFormDisclosure
              :open="form.cover_stage_layout.coverGilding.enabled"
              content-class="px-3 pb-3 pt-3 space-y-4 border-t border-slate-100"
            >
              <TemplateFormChoice
                v-model="gildingIntensityModel"
                :label="t('management.partnerTemplateForm.coverGilding.intensity')"
                :options="gildingIntensityOptions"
                variant="segmented"
              />

              <!-- Acts on the four decoration PNGs rather than on the
                   band, so it is the one control here that does
                   something for a cover made of edge pieces. -->
              <TemplateFormChoice
                v-model="gildingReliefModel"
                :label="t('management.partnerTemplateForm.coverGilding.relief')"
                :options="gildingReliefOptions"
                variant="segmented"
              />
              <p class="text-[0.6875rem] leading-snug text-slate-500">
                {{ t('management.partnerTemplateForm.coverGilding.reliefHint') }}
              </p>

              <!-- Band edges, both as % of the stage width so the border
                   keeps a uniform thickness all the way round. -->
              <div class="grid grid-cols-2 gap-2.5">
                <TemplateFormNumber
                  v-model="form.cover_stage_layout.coverGilding.bandOuter"
                  :label="t('management.partnerTemplateForm.coverGilding.bandOuter')"
                  :min="0"
                  :max="20"
                  :step="0.1"
                  unit="%"
                />
                <TemplateFormNumber
                  v-model="form.cover_stage_layout.coverGilding.bandInner"
                  :label="t('management.partnerTemplateForm.coverGilding.bandInner')"
                  :min="0.5"
                  :max="30"
                  :step="0.1"
                  unit="%"
                />
              </div>
              <p
                v-if="form.cover_stage_layout.coverGilding.bandInner <= form.cover_stage_layout.coverGilding.bandOuter"
                class="text-[0.6875rem] leading-snug text-amber-700 bg-amber-50 ring-1 ring-amber-100 rounded-xl p-2.5"
              >
                {{ t('management.partnerTemplateForm.coverGilding.bandWarning') }}
              </p>

              <div class="list-group">
                <TemplateFormSwitch
                  v-model="form.cover_stage_layout.coverGilding.cornerFlares"
                  :label="t('management.partnerTemplateForm.coverGilding.cornerFlares')"
                  :description="t('management.partnerTemplateForm.coverGilding.cornerFlaresHint')"
                />
              </div>
              <!-- The drifting motes used to be configured here. They
                   span every stage rather than sitting on the band, so
                   they now have their own section in Effects. -->
              <p class="text-[0.6875rem] leading-snug text-slate-500">
                {{ t('management.partnerTemplateForm.coverGilding.sparkMovedHint') }}
              </p>

              <TemplateFormChoice
                v-model="gildingColorSourceModel"
                :label="t('management.partnerTemplateForm.coverGilding.colorSource')"
                :options="gildingColorSourceOptions"
                variant="segmented"
              />

              <TemplateFormColor
                v-if="form.cover_stage_layout.coverGilding.colorSource === 'custom'"
                v-model="form.cover_stage_layout.coverGilding.customColor"
                :name="t('management.partnerTemplateForm.colorField.names.gilding')"
                placeholder="#E0B269"
              />
            </TemplateFormDisclosure>
          </div>
        </section>

        <!-- What the cover says: one switch per block, in the order the
             cover draws them (`coverBlocks`), and each switch opens
             everything about its block — the block's own settings first,
             then its type (font, size, colour) last, the same place in
             every block. Type comes last because the host names' second
             line only exists once "Under each name" above it says so.

             A block switched off takes its settings with it, so a
             template that draws three blocks shows three blocks' settings
             rather than seven.

             No eyebrow: every row begins with "Show", and a heading over
             them would name the group after what each member already says
             about itself. `divide-y` rather than `.list-group`, because the
             panel already draws the border and the radius. -->
        <section :class="[PANEL, 'overflow-hidden divide-y divide-slate-100']">
          <template v-for="block in coverBlocks" :key="block.id">
            <TemplateFormSwitch
              :model-value="block.shown"
              :label="block.label"
              :description="block.hint"
              :data-cover-block="block.id"
              @update:model-value="setCoverBlockShown(block.id, $event)"
            />
            <TemplateFormDisclosure :open="block.shown" content-class="px-3 pb-4 pt-3 space-y-4">
              <FileUploadField
                v-if="block.id === 'header'"
                :label="t('management.partnerTemplateForm.coverDecorations.headerTextImage')"
                accept="image/png,image/svg+xml,image/*"
                :file-name="form.header_text_image?.name"
                :has-existing-file="hasSavedAsset('header_text_image')"
                @change="handleFileChange('header_text_image', $event)"
                @clear="clearAssetField('header_text_image')"
              />

              <!-- The logo row's stack: sample logo 1 is the base when the
                   event has no logo of its own, sample logo 2 the shape
                   laid over it (and the clip for the first host's photo). -->
              <div v-else-if="block.id === 'logo'" class="grid grid-cols-2 gap-2.5">
                <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.sampleLogo1')" accept="image/png,image/svg+xml,image/*" :file-name="form.sample_logo_1?.name" :has-existing-file="hasSavedAsset('sample_logo_1')" @change="handleFileChange('sample_logo_1', $event)" @clear="clearAssetField('sample_logo_1')" />
                <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.sampleLogo2')" accept="image/png,image/svg+xml,image/*" :file-name="form.sample_logo_2?.name" :has-existing-file="hasSavedAsset('sample_logo_2')" @change="handleFileChange('sample_logo_2', $event)" @clear="clearAssetField('sample_logo_2')" />
              </div>

              <div v-else-if="block.id === 'guest'" class="space-y-3">
                <TemplateFormChoice
                  v-model="guestFrameStyleModel"
                  :label="t('management.partnerTemplateForm.coverDecorations.guestFrameGroup')"
                  :options="guestFrameStyleOptions"
                  :columns="3"
                />
                <p :class="FIELD_HINT">
                  {{ t(`management.partnerTemplateForm.guestFrame.hint.${form.cover_stage_layout.guestFrame.style}`) }}
                </p>

                <!-- The same three upload slots serve every style, relabelled
                     to what the chosen style actually draws with them.
                     Binding the fields to fixed asset fields (rather than
                     swapping fields per style) is what lets a partner switch
                     styles without losing artwork they already uploaded. -->
                <div v-if="form.cover_stage_layout.guestFrame.style === 'split'" class="grid grid-cols-3 gap-2.5">
                  <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.frameLeft')" accept="image/*" :file-name="form.guest_title_frame_left?.name" :has-existing-file="hasSavedAsset('guest_title_frame_left')" @change="handleFileChange('guest_title_frame_left', $event)" @clear="clearAssetField('guest_title_frame_left')" />
                  <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.frameMid')" accept="image/*" :file-name="form.guest_title_frame_mid?.name" :has-existing-file="hasSavedAsset('guest_title_frame_mid')" @change="handleFileChange('guest_title_frame_mid', $event)" @clear="clearAssetField('guest_title_frame_mid')" />
                  <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.frameRight')" accept="image/*" :file-name="form.guest_title_frame_right?.name" :has-existing-file="hasSavedAsset('guest_title_frame_right')" @change="handleFileChange('guest_title_frame_right', $event)" @clear="clearAssetField('guest_title_frame_right')" />
                </div>

                <FileUploadField
                  v-else-if="form.cover_stage_layout.guestFrame.style === 'single'"
                  :label="t('management.partnerTemplateForm.guestFrame.singleImage')"
                  accept="image/*"
                  :file-name="form.guest_title_frame_mid?.name"
                  :has-existing-file="hasSavedAsset('guest_title_frame_mid')"
                  @change="handleFileChange('guest_title_frame_mid', $event)"
                  @clear="clearAssetField('guest_title_frame_mid')"
                />

                <template v-else>
                  <div class="grid grid-cols-2 gap-2.5">
                    <FileUploadField :label="t('management.partnerTemplateForm.guestFrame.cornerAImage')" accept="image/*" :file-name="form.guest_title_frame_left?.name" :has-existing-file="hasSavedAsset('guest_title_frame_left')" @change="handleFileChange('guest_title_frame_left', $event)" @clear="clearAssetField('guest_title_frame_left')" />
                    <FileUploadField :label="t('management.partnerTemplateForm.guestFrame.cornerBImage')" accept="image/*" :file-name="form.guest_title_frame_right?.name" :has-existing-file="hasSavedAsset('guest_title_frame_right')" @change="handleFileChange('guest_title_frame_right', $event)" @clear="clearAssetField('guest_title_frame_right')" />
                  </div>

                  <GuestFrameCornerGrid
                    v-model="guestFrameCornersModel"
                    :has-left="hasGuestFrameSlot('guest_title_frame_left')"
                    :has-right="hasGuestFrameSlot('guest_title_frame_right')"
                  />

                  <div class="grid grid-cols-2 gap-2.5">
                    <TemplateFormNumber v-model="form.cover_stage_layout.guestFrame.cornerSize" :label="t('management.partnerTemplateForm.guestFrame.cornerSize')" :min="5" :max="60" :step="1" unit="%" />
                    <TemplateFormNumber v-model="form.cover_stage_layout.guestFrame.cornerInset" :label="t('management.partnerTemplateForm.guestFrame.cornerInset')" :min="-20" :max="30" :step="1" unit="%" />
                  </div>
                </template>

                <TemplateFormNumber
                  v-model="form.cover_stage_layout.guestFrame.scale"
                  :label="t('management.partnerTemplateForm.guestFrame.scale')"
                  :min="0.3"
                  :max="2.5"
                  :step="0.05"
                  unit="x"
                />
              </div>

              <div v-else-if="block.id === 'hosts'" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                  <TemplateFormSelect
                    v-model="coverHostCountModel"
                    :label="t('management.partnerTemplateForm.coverDetails.hostCount')"
                    :options="coverHostCountOptions"
                  />
                  <TemplateFormChoice
                    v-model="coverHostArrangementModel"
                    :label="t('management.partnerTemplateForm.coverDetails.arrangement')"
                    :options="coverHostArrangementOptions"
                    variant="segmented"
                  />
                </div>

                <div class="space-y-1.5">
                  <TemplateFormChoice
                    v-model="coverHostSublineModel"
                    :label="t('management.partnerTemplateForm.coverDetails.subline')"
                    :options="coverHostSublineOptions"
                    :columns="3"
                  />
                  <p :class="FIELD_HINT">
                    {{ t(`management.partnerTemplateForm.coverDetails.sublineHint.${form.cover_stage_layout.coverDetails.hostSubline}`) }}
                  </p>
                </div>

                <!-- The mark. An upload replaces the choice rather than
                     being one of its options — the precedence the crest's
                     breakline art has over its style — so there is no
                     option that draws nothing until a file exists, and
                     removing the file brings the chosen mark back. -->
                <TemplateFormChoice
                  v-model="coverSeparatorModel"
                  :label="t('management.partnerTemplateForm.coverDetails.separator')"
                  :options="coverSeparatorOptions"
                />
                <TemplateFormImageField
                  :label="t('management.partnerTemplateForm.coverDetails.separatorImage')"
                  :hint="t('management.partnerTemplateForm.coverDetails.separatorImageHint')"
                  :upload-label="t('management.partnerTemplateForm.coverDetails.separatorImageUpload')"
                  accept="image/png,image/svg+xml,image/*"
                  :preview="coverHostSeparatorImageSrc"
                  :file-name="form.cover_host_separator_image?.name"
                  @change="handleFileChange('cover_host_separator_image', $event)"
                  @clear="clearAssetField('cover_host_separator_image')"
                />
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                  <TemplateFormSelect
                    v-model="coverSeparatorColorModel"
                    :label="t('management.partnerTemplateForm.coverDetails.separatorColor')"
                    :options="coverSeparatorColorOptions"
                  />
                  <TemplateFormNumber
                    v-model="coverSeparatorScaleModel"
                    :label="t('management.partnerTemplateForm.coverDetails.separatorScale')"
                    :min="COVER_SEPARATOR_SCALE_RANGE.min * 100"
                    :max="COVER_SEPARATOR_SCALE_RANGE.max * 100"
                    :step="5"
                    unit="%"
                  />
                </div>
                <TemplateFormColor
                  v-if="form.cover_stage_layout.coverDetails.separatorColorSource === 'custom'"
                  v-model="form.cover_stage_layout.coverDetails.separatorCustomColor"
                  :name="t('management.partnerTemplateForm.colorField.names.hostSeparator')"
                  placeholder="#C9A45C"
                />
              </div>

              <div v-else-if="block.id === 'date'" class="space-y-1.5">
                <TemplateFormChoice
                  v-model="coverDateFormatModel"
                  :label="t('management.partnerTemplateForm.coverDetails.dateFormat')"
                  :options="coverDateFormatOptions"
                  :columns="3"
                />
                <p :class="FIELD_HINT">
                  {{ t(`management.partnerTemplateForm.coverDetails.dateFormatHint.${form.cover_stage_layout.coverDetails.dateFormat}`) }}
                </p>
              </div>

              <div v-else-if="block.id === 'location'" class="list-group">
                <TemplateFormSwitch
                  v-model="form.cover_stage_layout.coverDetails.showTime"
                  :label="t('management.partnerTemplateForm.coverDetails.showTime')"
                  :description="t('management.partnerTemplateForm.coverDetails.showTimeHint')"
                />
              </div>

              <!-- The block's type. Font and size are per TEXT (in
                   `coverText`, both layout modes), which is why the names
                   block lists two rows; colour is per BLOCK and lives on
                   its box, so it is offered only where the block is placed
                   by box — every block in free mode, only the names, date
                   and venue in rows. The preview's A−/A+ and its colour bar
                   write the same values, so the two can never disagree. -->
              <div
                v-if="block.texts.length"
                class="space-y-3"
                :class="{ 'pt-4 border-t border-slate-100': block.id !== 'invite' }"
              >
                <div
                  v-for="text in block.texts"
                  :key="text.id"
                  class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3"
                  :data-cover-text="text.id"
                >
                  <TemplateFormSelect
                    :model-value="coverTextFont(text.id)"
                    :label="text.label"
                    :options="coverTextFontOptions"
                    @update:model-value="setCoverTextFont(text.id, $event)"
                  />
                  <TemplateFormNumber
                    :model-value="coverTextSize(text.id)"
                    :label="t('management.partnerTemplateForm.coverText.size')"
                    :min="COVER_TEXT_SCALE_RANGE.min * 100"
                    :max="COVER_TEXT_SCALE_RANGE.max * 100"
                    :step="5"
                    unit="%"
                    @update:model-value="setCoverTextSize(text.id, $event)"
                  />
                </div>
                <div
                  v-if="block.colorEditable"
                  class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3"
                  :data-cover-color="block.id"
                >
                  <TemplateFormSelect
                    :model-value="coverBlockColorSource(block.id)"
                    :label="t('management.coverLayoutEditor.fields.colorSource')"
                    :options="coverColorSourceOptions"
                    @update:model-value="setCoverBlockColorSource(block.id, $event)"
                  />
                  <!-- Colour names a palette slot rather than a hex, so a
                       recoloured template still reaches the block; only
                       Custom takes a hex. -->
                  <TemplateFormColor
                    v-if="coverBlockColorSource(block.id) === 'custom'"
                    :model-value="coverBlockCustomColor(block.id)"
                    :label="t('management.coverLayoutEditor.colorSources.custom')"
                    :name="t('management.partnerTemplateForm.colorField.names.coverText')"
                    placeholder="#FFFFFF"
                    @update:model-value="setCoverBlockCustomColor(block.id, $event)"
                  />
                </div>
              </div>
            </TemplateFormDisclosure>
          </template>

          <!-- What the names, date and venue share. Capitals is one
               decision for the whole composition — spaced names over a
               lowercase venue read as two designs — so it is asked once,
               after the blocks it governs. -->
          <TemplateFormDisclosure :open="coverDetailsShown" content-class="p-3 space-y-3">
            <div class="list-group">
              <TemplateFormSwitch
                v-model="form.cover_stage_layout.coverDetails.capitals"
                :label="t('management.partnerTemplateForm.coverDetails.capitals')"
                :description="t('management.partnerTemplateForm.coverDetails.capitalsHint')"
              />
            </div>
            <!-- The composition lands where the logo, the invite line and
                 the guest name sit, because it is meant to replace them.
                 Said, with the one-tap way out, rather than done:
                 switching a partner's other blocks off behind their back
                 is not a default, it is a surprise. -->
            <div
              v-if="coverRowsCompeting"
              class="flex items-center gap-3 rounded-xl bg-amber-50 ring-1 ring-amber-100 p-2.5"
            >
              <p class="flex-1 min-w-0 text-[0.6875rem] leading-snug text-amber-800">
                {{ t('management.partnerTemplateForm.coverDetails.competingHint') }}
              </p>
              <button type="button" :class="BTN_SECONDARY_SM" @click="hideCompetingCoverBlocks">
                {{ t('management.partnerTemplateForm.coverDetails.hideCompeting') }}
              </button>
            </div>
          </TemplateFormDisclosure>
        </section>

        <!-- Where each block sits, and nothing else: how a block looks is
             set beside its switch above. Rows is the original stacked
             layout; free hands each block its own rectangle, which is what
             the preview's drag handles write to. Switching to free seeds
             every block from the row geometry, so nothing on the cover
             moves until something is actually dragged. -->
        <section :class="PANEL">
          <div class="p-4 space-y-4">
            <h5 :class="SECTION_HEADING">
              {{ t('management.coverLayoutEditor.sectionTitle') }}
            </h5>
            <TemplateFormChoice v-model="layoutModeModel" :options="layoutModeOptions" />

            <p v-if="!isFreeCoverLayout" :class="FIELD_HINT">
              {{ t('management.coverLayoutEditor.rowsHint') }}
            </p>

            <!-- In free mode every block; in rows mode only the names, date
                 and venue, which are placed by box in both. -->
            <template v-if="coverBlockChips.length">
              <p class="flex items-start gap-1.5 text-[0.6875rem] leading-snug text-sky-700 bg-sky-50 ring-1 ring-sky-100 rounded-xl p-2.5">
                <Move class="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                {{ t(isFreeCoverLayout ? 'management.coverLayoutEditor.dragHint' : 'management.coverLayoutEditor.detailsDragHint') }}
              </p>

              <!-- Same selection the overlay uses: clicking a chip highlights
                   the block in the preview, and clicking it there lights the
                   chip. -->
              <div class="flex flex-wrap gap-1.5" role="group" :aria-label="t('management.coverLayoutEditor.blockPicker')">
                <button
                  v-for="block in coverBlockChips"
                  :key="block.id"
                  type="button"
                  :disabled="!block.available"
                  :aria-pressed="selectedCoverElement === block.id"
                  :class="[
                    CHIP_BASE,
                    selectedCoverElement === block.id ? OPTION_SELECTED : OPTION_IDLE,
                  ]"
                  @click="selectCoverElement(block.id)"
                >
                  {{ block.label }}
                </button>
              </div>

              <div v-if="selectedCoverBox" class="space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                  <TemplateFormNumber v-model="coverBoxX" :label="t('management.coverLayoutEditor.fields.x')" :min="0" :max="100" :step="0.5" unit="%" />
                  <TemplateFormNumber v-model="coverBoxY" :label="t('management.coverLayoutEditor.fields.y')" :min="0" :max="100" :step="0.5" unit="%" />
                  <TemplateFormNumber v-model="coverBoxWidth" :label="t('management.coverLayoutEditor.fields.width')" :min="3" :max="100" :step="0.5" unit="%" />
                  <TemplateFormNumber v-model="coverBoxHeight" :label="t('management.coverLayoutEditor.fields.height')" :min="2" :max="100" :step="0.5" unit="%" />
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    @click="resetSelectedCoverBlock"
                    :class="BTN_SECONDARY_SM"
                  >
                    {{ t('management.coverLayoutEditor.resetBlock') }}
                  </button>
                  <button
                    type="button"
                    @click="resetAllCoverBlocks"
                    :class="[BTN_GHOST_SM, 'hover:text-red-600 hover:bg-red-50']"
                  >
                    {{ t('management.coverLayoutEditor.resetAll') }}
                  </button>
                </div>
              </div>
              <p v-else :class="FIELD_HINT">
                {{ t('management.coverLayoutEditor.pickBlock') }}
              </p>
            </template>
          </div>
        </section>

        <!-- Advanced layout.
             Fifteen sliders — the container box, the five row heights, the
             host clip and the four decoration z-indexes — that were laid out
             flat, at the same weight as the artwork slots and the mode
             pickers above them. They are the rarest controls in the editor
             and the hardest to recover from: a template is designed once,
             its rows are tuned once, and its z-indexes are touched when two
             decorations overlap wrongly and never again. Behind one row they
             stop competing for attention with the work a partner actually
             does every time, and they are still exactly one tap away
             (apple-design §16.6 — the common path first, the advanced one a
             level deeper, which is not the same as hiding it). -->
        <section :class="[PANEL, 'overflow-hidden']">
          <button
            type="button"
            class="list-row"
            :aria-expanded="coverAdvancedOpen"
            @click="coverAdvancedOpen = !coverAdvancedOpen"
          >
            <span class="list-row__text">
              <span class="list-row__label">
                {{ t('management.partnerTemplateForm.coverLayout.advancedGroup') }}
              </span>
              <span class="list-row__hint">
                {{ t('management.partnerTemplateForm.coverLayout.advancedHint') }}
              </span>
            </span>
            <ChevronDown
              class="w-4 h-4 flex-shrink-0 text-slate-400 transition-transform duration-200"
              :class="coverAdvancedOpen ? 'rotate-180' : ''"
              aria-hidden="true"
            />
          </button>

          <TemplateFormDisclosure
            :open="coverAdvancedOpen"
            content-class="p-4 space-y-5 border-t border-slate-100"
          >
            <div class="space-y-3">
              <h5 :class="SECTION_HEADING">
                {{ t('management.partnerTemplateForm.coverLayout.containerPositioning') }}
              </h5>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                <!-- Free placement ignores the container box entirely; the swipe
                     arrow is positioned the same way in both models. -->
                <template v-if="!isFreeCoverLayout">
                  <TemplateFormNumber v-model="form.cover_stage_layout.contentTopPosition" :label="t('management.partnerTemplateForm.coverLayout.contentTop')" :min="0" :max="60" :step="0.5" unit="vh" />
                  <TemplateFormNumber v-model="form.cover_stage_layout.innerContainerHeight" :label="t('management.partnerTemplateForm.coverLayout.innerHeight')" :min="10" :max="90" :step="0.5" unit="vh" />
                </template>
                <TemplateFormNumber v-model="form.cover_stage_layout.swipeArrowBottom" :label="t('management.partnerTemplateForm.coverLayout.swipeArrowBottom')" :min="0" :max="20" :step="0.5" unit="vh" />
              </div>
            </div>

            <div v-if="!isFreeCoverLayout" class="space-y-3">
              <h5 :class="SECTION_HEADING">
                {{ t('management.partnerTemplateForm.coverLayout.rowHeights') }}
              </h5>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                <TemplateFormNumber v-model="form.cover_stage_layout.eventTitleHeight" :label="t('management.partnerTemplateForm.coverLayout.eventTitle')" :min="0" :max="50" :step="0.25" unit="%" />
                <TemplateFormNumber v-model="form.cover_stage_layout.logoHeight" :label="t('management.partnerTemplateForm.coverLayout.logo')" :min="0" :max="80" :step="0.25" unit="%" />
                <TemplateFormNumber v-model="form.cover_stage_layout.inviteTextHeight" :label="t('management.partnerTemplateForm.coverLayout.inviteText')" :min="0" :max="40" :step="0.25" unit="%" />
                <TemplateFormNumber v-model="form.cover_stage_layout.guestNameHeight" :label="t('management.partnerTemplateForm.coverLayout.guestName')" :min="0" :max="50" :step="0.25" unit="%" />
                <TemplateFormNumber v-model="form.cover_stage_layout.guestNameMaxWidthPercent" :label="t('management.partnerTemplateForm.coverLayout.guestNameMaxWidthPercent')" :min="10" :max="100" :step="1" unit="%" />
              </div>
            </div>

            <div class="space-y-3">
              <div>
                <h5 :class="SECTION_HEADING">
                  {{ t('management.partnerTemplateForm.coverLayout.hostClip') }}
                </h5>
                <p class="text-[0.6875rem] text-slate-400 leading-snug mt-1">{{ t('management.partnerTemplateForm.coverLayout.hostClipHint') }}</p>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                <TemplateFormNumber v-model="form.cover_stage_layout.hostClipScale" :label="t('management.partnerTemplateForm.coverLayout.hostClipScale')" :min="0" :max="100" :step="1" unit="%" />
                <TemplateFormNumber v-model="form.cover_stage_layout.hostClipOffsetX" :label="t('management.partnerTemplateForm.coverLayout.hostClipOffsetX')" :min="0" :max="100" :step="1" unit="%" />
                <TemplateFormNumber v-model="form.cover_stage_layout.hostClipOffsetY" :label="t('management.partnerTemplateForm.coverLayout.hostClipOffsetY')" :min="0" :max="100" :step="1" unit="%" />
              </div>
            </div>

            <div class="space-y-3">
              <h5 :class="SECTION_HEADING">
                {{ t('management.partnerTemplateForm.coverLayout.zIndexes') }}
              </h5>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                <TemplateFormNumber v-model="form.cover_stage_layout.leftDecorationZIndex" :label="t('management.partnerTemplateForm.coverLayout.left')" :min="0" :max="60" :step="1" />
                <TemplateFormNumber v-model="form.cover_stage_layout.rightDecorationZIndex" :label="t('management.partnerTemplateForm.coverLayout.right')" :min="0" :max="60" :step="1" />
                <TemplateFormNumber v-model="form.cover_stage_layout.topDecorationZIndex" :label="t('management.partnerTemplateForm.coverLayout.top')" :min="0" :max="60" :step="1" />
                <TemplateFormNumber v-model="form.cover_stage_layout.bottomDecorationZIndex" :label="t('management.partnerTemplateForm.coverLayout.bottom')" :min="0" :max="60" :step="1" />
              </div>
            </div>
          </TemplateFormDisclosure>
        </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, Clapperboard, Move, Sparkles } from 'lucide-vue-next'

import TemplateFormChoice from '../TemplateFormChoice.vue'
import TemplateFormColor from '../TemplateFormColor.vue'
import TemplateFormDisclosure from '../TemplateFormDisclosure.vue'
import TemplateFormImageField from '../TemplateFormImageField.vue'
import TemplateFormNumber from '../TemplateFormNumber.vue'
import TemplateFormSelect from '../TemplateFormSelect.vue'
import TemplateFormSwitch from '../TemplateFormSwitch.vue'
import FileUploadField from '../PartnerTemplateFileField.vue'
import PlanRequiredNotice from '../TemplateFormPlanNotice.vue'
import GuestFrameCornerGrid from '../GuestFrameCornerGrid.vue'
import {
  BTN_GHOST_SM,
  BTN_SECONDARY_SM,
  CHIP_BASE,
  FIELD_HINT,
  OPTION_IDLE,
  OPTION_SELECTED,
  PANEL,
  SECTION_HEADING,
} from '../templateUi'
import {
  COVER_SEPARATOR_SCALE_RANGE,
  COVER_TEXT_SCALE_RANGE,
} from '@/composables/showcase/useCoverStageLayout'
import { enumModel } from '../formModels'
import { useTemplateEditor } from '../templateEditorContext'
import type { CoverEditor } from '../useCoverEditor'

/**
 * The cover, in the order a cover is designed: what it is made of (the artwork,
 * and the light on it), what it says (every block, each carrying everything
 * about how it looks), and where each block sits. The rare geometry is one tap
 * deeper, last.
 *
 * `cover` arrives whole because the editor also hands three of its values to the
 * live preview frame — the selected block, and the two change handlers a drag
 * and a resize report back through. See useCoverEditor.
 */
const props = defineProps<{ cover: CoverEditor }>()

/** Destructured so the template sees unwrapped refs — see BrandSection. */
const {
  coverAdvancedOpen,
  gildingIntensityOptions,
  gildingIntensityModel,
  gildingReliefOptions,
  gildingReliefModel,
  gildingColorSourceOptions,
  gildingColorSourceModel,
  guestFrameStyleOptions,
  guestFrameStyleModel,
  guestFrameCornersModel,
  hasGuestFrameSlot,
  selectedCoverElement,
  isFreeCoverLayout,
  layoutModeOptions,
  layoutModeModel,
  selectedCoverBox,
  coverBlockChips,
  selectCoverElement,
  setCoverBlockShown,
  coverBoxX,
  coverBoxY,
  coverBoxWidth,
  coverBoxHeight,
  coverBlockColorSource,
  setCoverBlockColorSource,
  coverBlockCustomColor,
  setCoverBlockCustomColor,
  coverColorSourceOptions,
  resetSelectedCoverBlock,
  resetAllCoverBlocks,
  coverBlocks,
  coverTextFont,
  coverTextFontOptions,
  setCoverTextFont,
  coverTextSize,
  setCoverTextSize,
  coverDetailsShown,
  coverRowsCompeting,
  hideCompetingCoverBlocks,
  coverHostCountOptions,
  coverHostCountModel,
  coverHostArrangementOptions,
  coverHostArrangementModel,
  coverHostSublineOptions,
  coverHostSublineModel,
  coverSeparatorOptions,
  coverSeparatorModel,
  coverSeparatorColorOptions,
  coverSeparatorColorModel,
  coverSeparatorScaleModel,
  coverDateFormatOptions,
  coverDateFormatModel,
} = props.cover

const { form, assets, selectSection } = useTemplateEditor()
const { hasSavedAsset, handleFileChange, clearAssetField, stagedImageSrc } = assets

const { t } = useI18n()

/** The cover's own mark between the host names, on the usual three states. */
const coverHostSeparatorImageSrc = stagedImageSrc('cover_host_separator_image')

const stageModeOptions = computed(() => [
  { value: 'animation', label: t('management.partnerTemplateForm.stageModes.animation'), icon: Sparkles },
  { value: 'video', label: t('management.partnerTemplateForm.stageModes.video'), icon: Clapperboard },
])

const coverModeModel = enumModel(() => form, 'stage_mode_cover')
</script>
