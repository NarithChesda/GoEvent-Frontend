<template>
  <!-- Desktop: the editor's identity and its commit actions take over the
       modal's own header row rather than opening a second one under it.
       Nothing else belongs there while you're editing, so there's no
       competition for the space.

       A root-level sibling of the slide transition below, not a child of it, so
       that closing the editor pulls these out of the header at once. Nested
       inside, they would outlive the close by the length of the leave
       transition and briefly share the row with the Browse/Mine controls
       reappearing behind them. -->
  <Teleport v-if="isOpen && isDesktop && headerSlot" :to="headerSlot">
      <button
        type="button"
        @click="emit('close')"
        :class="[BTN_ICON, 'w-10 h-10']"
        :aria-label="t('management.partnerTemplateForm.header.goBack')"
      >
        <ArrowLeft class="w-[1.125rem] h-[1.125rem]" />
      </button>

      <div class="min-w-0 flex-1">
        <h3 class="text-base font-semibold tracking-tight text-slate-900 truncate leading-tight">
          {{ isEditing ? t('management.partnerTemplateForm.header.edit') : t('management.partnerTemplateForm.header.create') }}
        </h3>
        <p class="text-xs text-slate-500 truncate leading-tight">
          {{ form.name.trim() || t('management.partnerTemplateForm.header.untitled') }}
        </p>
      </div>

      <!-- The blocking requirement reads next to the button it blocks, which
           is where someone looks when that button won't work. -->
      <p v-if="!canSave" class="flex items-center gap-1.5 text-xs text-amber-600 flex-shrink-0">
        <AlertCircle class="w-3.5 h-3.5 flex-shrink-0" />
        {{ t('management.partnerTemplateForm.footer.missingRequired') }}
      </p>

      <!-- Bar variants: this row is the modal's header, and everything else in
           it is a 40px pill. See BTN_PRIMARY_BAR. -->
      <button type="button" @click="emit('close')" :class="BTN_GHOST_BAR">
        {{ t('management.partnerTemplateForm.footer.cancel') }}
      </button>
      <button type="button" @click="handleSave" :disabled="saving || !canSave" :class="BTN_PRIMARY_BAR">
        <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
        {{ saving ? t('management.partnerTemplateForm.footer.saving') : (isEditing ? t('management.partnerTemplateForm.footer.saveChanges') : t('management.partnerTemplateForm.footer.createTemplate')) }}
      </button>
  </Teleport>

  <!-- Slide-over form panel -->
  <Transition name="slide">
    <!-- A three-column workspace: what to edit (rail), the editor, and the live
         result. From `lg` that is the whole thing — one row, three columns,
         with the header teleported into the modal's own bar above. Below `lg`
         the same element stacks into header / rail / pane / footer rows, which
         is why it is a grid rather than nested flex columns: one of the two
         panes is `hidden` there and the rows still line up without a second
         wrapper element. -->
    <div
      v-if="isOpen"
      class="absolute inset-0 z-10 grid bg-slate-50 overflow-hidden grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)_auto] lg:grid-cols-[13rem_minmax(0,1fr)_minmax(20rem,24rem)] lg:grid-rows-[minmax(0,1fr)]"
    >
      <!-- Below `lg` the modal is a full-screen sheet with no room for a phone
           frame beside the form, so the two swap places instead of sitting side
           by side — and the header stays local, since the modal's own row has
           no width to spare. -->
      <div v-if="!isDesktop" class="col-span-full flex items-center gap-3 px-3 sm:px-4 py-3 bg-white border-b border-slate-200/70">
        <button
          type="button"
          @click="emit('close')"
          :class="BTN_ICON"
          :aria-label="t('management.partnerTemplateForm.header.goBack')"
        >
          <ArrowLeft class="w-[1.125rem] h-[1.125rem]" />
        </button>

        <h3 class="min-w-0 flex-1 text-base font-semibold tracking-tight text-slate-900 truncate">
          {{ isEditing ? t('management.partnerTemplateForm.header.edit') : t('management.partnerTemplateForm.header.create') }}
        </h3>

        <!-- Which of the two panes am I looking at — the same question
             Browse/Mine asks, so the same control answers it. It used to be a
             `bg-slate-900` pill that snapped between states. -->
        <TemplateSegmented
          v-model="mobilePane"
          :options="paneOptions"
          :aria-label="t('management.partnerTemplateForm.header.paneSwitch')"
          size="sm"
        />
      </div>

      <!-- Section rail. One vertical list from `lg`; a horizontally scrolling
           chip strip below that, where it stays visible in BOTH mobile panes —
           in preview mode the chips are the stage switcher, since picking a
           section is what drives which stage the frame shows. -->
      <nav
        class="lg:row-start-1 lg:col-start-1 bg-white lg:border-r border-b lg:border-b-0 border-slate-200/70 lg:overflow-y-auto custom-scrollbar"
        :aria-label="t('management.partnerTemplateForm.sections.navLabel')"
      >
        <div class="flex lg:flex-col gap-1 p-2 lg:p-3 overflow-x-auto lg:overflow-x-visible scrollbar-hide">
          <button
            v-for="section in sections"
            :key="section.id"
            type="button"
            :aria-current="activeSection === section.id ? 'true' : undefined"
            class="group flex-shrink-0 lg:w-full flex items-center gap-2 lg:gap-2.5 px-3 py-2 rounded-lg text-left"
            :class="[
              OPTION_BASE,
              activeSection === section.id ? OPTION_SELECTED : `${OPTION_IDLE} ring-transparent`,
            ]"
            @click="selectSection(section.id)"
          >
            <component
              :is="section.icon"
              class="w-4 h-4 flex-shrink-0 transition-colors duration-200"
              :class="optionIconClass(activeSection === section.id)"
            />
            <span class="text-[0.8125rem] font-medium whitespace-nowrap lg:truncate">{{ section.label }}</span>
            <span
              v-if="section.badge"
              class="ml-auto flex-shrink-0 min-w-[1.25rem] px-1.5 py-0.5 rounded-full text-[0.625rem] font-semibold text-center"
              :class="section.badgeWarn ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500 group-hover:bg-white'"
            >{{ section.badge }}</span>
          </button>
        </div>
      </nav>

      <!-- Editor pane: one section at a time, so nine stacked accordions no
           longer bury the option someone is actually looking for. -->
      <div
        class="lg:row-start-1 lg:col-start-2 overflow-y-auto custom-scrollbar"
        :class="{ 'hidden lg:block': mobilePane === 'preview' }"
      >
        <div class="p-4 sm:p-5 space-y-5 max-w-3xl">
          <!-- Error Banner -->
          <div v-if="error" class="flex items-start gap-2 p-3 bg-red-50 ring-1 ring-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ error }}</span>
          </div>

          <!-- Section heading -->
          <div>
            <h4 class="text-sm font-semibold text-slate-900">{{ activeSectionMeta.label }}</h4>
            <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">{{ activeSectionMeta.description }}</p>
          </div>

          <!-- ============================ BASICS ============================ -->
          <!-- Carded like every other section. It used to sit bare on the
               slate-50 pane while Brand, Cover, Transition, Effects and Main
               Content were all white panels — so the first screen a partner
               lands on was the one that looked least like the rest of the
               editor. -->
          <template v-if="activeSection === 'basics'">
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
                      :src="previewImagePreview || existingTemplate?.preview_image || ''"
                      :alt="t('management.partnerTemplateForm.fields.previewImageLabel')"
                      class="w-full h-full object-cover"
                    />
                    <div class="absolute inset-0 bg-slate-950/25 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label class="cursor-pointer px-2.5 py-1.5 bg-white/95 rounded-lg text-[0.6875rem] font-medium text-slate-700 shadow-sm">
                        {{ t('management.partnerTemplateForm.fields.previewImageChange') }}
                        <input type="file" accept="image/*" class="sr-only" @change="handleFileChange('preview_image', $event)" />
                      </label>
                      <button
                        type="button"
                        class="p-1.5 bg-white/95 rounded-lg text-slate-500 hover:text-red-600 shadow-sm transition-colors"
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
              <p v-else-if="availablePlans.length === 0" class="text-xs text-slate-500 p-3 bg-slate-50 ring-1 ring-slate-200 rounded-xl">
                {{ t('management.partnerTemplateForm.fields.planEmpty') }}
              </p>
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" :aria-label="t('management.partnerTemplateForm.fields.planLabel')">
                <button
                  v-for="plan in availablePlans"
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

          <!-- ======================= COLORS & FONTS ======================== -->
          <template v-else-if="activeSection === 'brand'">
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
              <ul v-else class="divide-y divide-slate-100 -mx-1">
                <li
                  v-for="(color, index) in pendingColors"
                  :key="isEditing ? (color as EventTemplateColor).id : index"
                  class="flex items-center gap-2.5 px-1 py-2"
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
              <ul v-else class="divide-y divide-slate-100 -mx-1">
                <li
                  v-for="(f, index) in pendingFonts"
                  :key="isEditing ? (f as EventTemplateLanguageFont).id : index"
                  class="flex items-center gap-2.5 px-1 py-2"
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
                <!-- Two of the four types are resolved but never rendered — the
                     picker says so rather than letting a partner attach a font
                     that silently does nothing. -->
                <TemplateSlotField
                  v-model="fontTypeModel"
                  :label="t('management.partnerTemplateForm.fonts.typeLabel')"
                  :options="TEMPLATE_FONT_TYPE_SLOTS"
                  :used-values="definedFontTypes"
                />
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
          </template>

          <!-- ==================== COVER STAGE & LAYOUT ===================== -->
          <!-- Artwork first — what the cover is made of — then the geometry that
               arranges it. They were two rail entries pointing at the same stage
               and the same preview, so placing a block meant bouncing between
               tabs to see which artwork it was moving. -->
          <template v-else-if="activeSection === 'cover'">
            <PlanRequiredNotice v-if="!form.package_plan_id" @pick="selectSection('basics')" />
            <template v-else>
              <section :class="[PANEL, 'divide-y divide-slate-200/70']">
                <div class="p-4 space-y-3">
                  <h5 :class="SECTION_HEADING">
                    {{ t('management.partnerTemplateForm.coverDecorations.backdropGroup') }}
                  </h5>
                  <FileUploadField
                    v-if="isBasicPlan"
                    :label="t('management.partnerTemplateForm.coverDecorations.coverBackground')"
                    accept="image/*"
                    :file-name="form.basic_decoration_photo?.name"
                    :has-existing-file="hasSavedAsset('basic_decoration_photo')"
                    @change="handleFileChange('basic_decoration_photo', $event)"
                    @clear="clearAssetField('basic_decoration_photo')"
                  />
                  <FileUploadField
                    v-if="isStandardPlan"
                    :label="t('management.partnerTemplateForm.coverDecorations.coverBackground')"
                    accept="video/*"
                    :file-name="form.standard_cover_video?.name"
                    :has-existing-file="hasSavedAsset('standard_cover_video')"
                    @change="handleFileChange('standard_cover_video', $event)"
                    @clear="clearAssetField('standard_cover_video')"
                  />
                  <div v-if="isBasicPlan" class="grid grid-cols-2 gap-2.5">
                    <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.coverTop')" accept="image/*" :file-name="form.cover_top_decoration?.name" :has-existing-file="hasSavedAsset('cover_top_decoration')" @change="handleFileChange('cover_top_decoration', $event)" @clear="clearAssetField('cover_top_decoration')" />
                    <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.coverBottom')" accept="image/*" :file-name="form.cover_bottom_decoration?.name" :has-existing-file="hasSavedAsset('cover_bottom_decoration')" @change="handleFileChange('cover_bottom_decoration', $event)" @clear="clearAssetField('cover_bottom_decoration')" />
                    <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.coverLeft')" accept="image/*" :file-name="form.cover_left_decoration?.name" :has-existing-file="hasSavedAsset('cover_left_decoration')" @change="handleFileChange('cover_left_decoration', $event)" @clear="clearAssetField('cover_left_decoration')" />
                    <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.coverRight')" accept="image/*" :file-name="form.cover_right_decoration?.name" :has-existing-file="hasSavedAsset('cover_right_decoration')" @change="handleFileChange('cover_right_decoration', $event)" @clear="clearAssetField('cover_right_decoration')" />
                  </div>
                </div>

                <div class="p-4 space-y-3">
                  <h5 :class="SECTION_HEADING">
                    {{ t('management.partnerTemplateForm.coverDecorations.guestFrameGroup') }}
                  </h5>

                  <TemplateFormChoice
                    v-model="guestFrameStyleModel"
                    :options="guestFrameStyleOptions"
                    :columns="3"
                  />
                  <p :class="FIELD_HINT">
                    {{ t(`management.partnerTemplateForm.guestFrame.hint.${form.cover_stage_layout.guestFrame.style}`) }}
                  </p>

                  <!-- The same three upload slots serve every style, relabelled to
                       what the chosen style actually draws with them. Binding the
                       fields to fixed asset fields (rather than swapping fields per
                       style) is what lets a partner switch styles without losing
                       artwork they already uploaded. -->
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

                <div class="p-4 space-y-3">
                  <h5 :class="SECTION_HEADING">
                    {{ t('management.partnerTemplateForm.coverDecorations.brandingGroup') }}
                  </h5>
                  <div class="grid grid-cols-3 gap-2.5">
                    <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.sampleLogo1')" accept="image/png,image/svg+xml,image/*" :file-name="form.sample_logo_1?.name" :has-existing-file="hasSavedAsset('sample_logo_1')" @change="handleFileChange('sample_logo_1', $event)" @clear="clearAssetField('sample_logo_1')" />
                    <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.sampleLogo2')" accept="image/png,image/svg+xml,image/*" :file-name="form.sample_logo_2?.name" :has-existing-file="hasSavedAsset('sample_logo_2')" @change="handleFileChange('sample_logo_2', $event)" @clear="clearAssetField('sample_logo_2')" />
                    <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.headerTextImage')" accept="image/png,image/svg+xml,image/*" :file-name="form.header_text_image?.name" :has-existing-file="hasSavedAsset('header_text_image')" @change="handleFileChange('header_text_image', $event)" @clear="clearAssetField('header_text_image')" />
                  </div>
                </div>
              </section>
            </template>

            <!-- ----------------------- Cover lighting ----------------------- -->
            <!-- The cover's exit animation used to head this group. It chooses
                 the transition stage as much as it chooses the cover's exit, so
                 it now sits in the Transition tab beside the film it plays into.
                 What is left is lighting for the cover artwork's border: still
                 stored in cover_stage_layout, but about this stage only. -->
            <section :class="[PANEL, 'p-4 space-y-4']">
              <h5 :class="SECTION_HEADING">
                {{ t('management.partnerTemplateForm.coverGilding.sectionTitle') }}
              </h5>
              <TemplateFormSwitch
                v-model="form.cover_stage_layout.coverGilding.enabled"
                :icon="Sparkles"
                :label="t('management.partnerTemplateForm.coverGilding.enableLabel')"
                :description="t('management.partnerTemplateForm.coverGilding.enableHint')"
              />

              <Transition name="collapse">
                <div v-if="form.cover_stage_layout.coverGilding.enabled" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <div class="space-y-4 pt-1">
                      <TemplateFormChoice
                        v-model="gildingIntensityModel"
                        :label="t('management.partnerTemplateForm.coverGilding.intensity')"
                        :options="gildingIntensityOptions"
                        :columns="3"
                      />

                      <!-- Acts on the four decoration PNGs rather than on the
                           band, so it is the one control here that does
                           something for a cover made of edge pieces. -->
                      <TemplateFormChoice
                        v-model="gildingReliefModel"
                        :label="t('management.partnerTemplateForm.coverGilding.relief')"
                        :options="gildingReliefOptions"
                        :columns="3"
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

                      <TemplateFormSwitch
                        v-model="form.cover_stage_layout.coverGilding.cornerFlares"
                        :icon="Sparkles"
                        :label="t('management.partnerTemplateForm.coverGilding.cornerFlares')"
                        :description="t('management.partnerTemplateForm.coverGilding.cornerFlaresHint')"
                      />
                      <!-- The drifting motes used to be configured here. They
                           span every stage rather than sitting on the band, so
                           they now have their own section below. -->
                      <p class="text-[0.6875rem] leading-snug text-slate-500">
                        {{ t('management.partnerTemplateForm.coverGilding.sparkMovedHint') }}
                      </p>

                      <TemplateFormChoice
                        v-model="gildingColorSourceModel"
                        :label="t('management.partnerTemplateForm.coverGilding.colorSource')"
                        :options="gildingColorSourceOptions"
                        :columns="2"
                      />

                      <TemplateFormColor
                        v-if="form.cover_stage_layout.coverGilding.colorSource === 'custom'"
                        v-model="form.cover_stage_layout.coverGilding.customColor"
                        :name="t('management.partnerTemplateForm.colorField.names.gilding')"
                        placeholder="#E0B269"
                      />
                    </div>
                  </div>
                </div>
              </Transition>
            </section>

            <!-- Placement model. Rows is the original stacked layout; free hands
                 each block its own rectangle, which is what the preview's drag
                 handles write to. Switching to free seeds every block from the
                 row geometry, so nothing on the cover moves until something is
                 actually dragged. -->
            <section :class="[PANEL, 'divide-y divide-slate-200/70']">
              <div class="p-4 space-y-4">
                <h5 :class="SECTION_HEADING">
                  {{ t('management.coverLayoutEditor.sectionTitle') }}
                </h5>
                <TemplateFormChoice v-model="layoutModeModel" :options="layoutModeOptions" />

                <template v-if="isFreeCoverLayout">
                  <p class="flex items-start gap-1.5 text-[0.6875rem] leading-snug text-sky-700 bg-sky-50 ring-1 ring-sky-100 rounded-xl p-2.5">
                    <Move class="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                    {{ t('management.coverLayoutEditor.dragHint') }}
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
                      <!-- The logo scales with its box; only the text blocks have
                           a size that the box alone can't express. -->
                      <TemplateFormNumber
                        v-if="selectedCoverBlockHasText"
                        v-model="coverBoxFontScale"
                        :label="t('management.coverLayoutEditor.fields.fontScale')"
                        :min="40"
                        :max="250"
                        :step="5"
                        unit="%"
                      />
                    </div>

                    <!-- Type slots. Both name a slot from this template's own
                         palette/fonts rather than a literal value: fonts are
                         declared per language, so a baked-in family would freeze
                         the cover to one script, and a baked-in hex would stop
                         following the template's colours. -->
                    <div v-if="selectedCoverBlockHasText" class="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
                      <TemplateFormSelect
                        v-model="coverBoxFontType"
                        :label="t('management.coverLayoutEditor.fields.fontType')"
                        :options="coverFontTypeOptions"
                      />
                      <TemplateFormSelect
                        v-model="coverBoxColorSource"
                        :label="t('management.coverLayoutEditor.fields.colorSource')"
                        :options="coverColorSourceOptions"
                      />
                    </div>

                    <TemplateFormColor
                      v-if="selectedCoverBlockHasText && selectedCoverBox.colorSource === 'custom'"
                      v-model="coverBoxCustomColor"
                      :name="t('management.partnerTemplateForm.colorField.names.coverText')"
                      placeholder="#FFFFFF"
                    />
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
                <p v-else :class="FIELD_HINT">
                  {{ t('management.coverLayoutEditor.rowsHint') }}
                </p>
              </div>

              <div class="p-4 space-y-4">
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

              <div v-if="!isFreeCoverLayout" class="p-4 space-y-4">
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
            </section>

            <section :class="[PANEL, 'divide-y divide-slate-200/70']">
              <div class="p-4 space-y-3">
                <h5 :class="SECTION_HEADING">
                  {{ t('management.partnerTemplateForm.coverLayout.visibilityToggles') }}
                </h5>
                <div class="space-y-2">
                  <TemplateFormSwitch
                    v-model="form.cover_stage_layout.showWelcomeHeaderText"
                    :label="t('management.partnerTemplateForm.coverLayout.showWelcomeHeaderText')"
                    :description="t('management.partnerTemplateForm.coverLayout.showWelcomeHeaderTextHint')"
                  />
                  <TemplateFormSwitch
                    v-model="form.cover_stage_layout.showCoverHeaderText"
                    :label="t('management.partnerTemplateForm.coverLayout.showCoverHeaderText')"
                    :description="t('management.partnerTemplateForm.coverLayout.showCoverHeaderTextHint')"
                  />
                  <TemplateFormSwitch
                    v-model="form.cover_stage_layout.showHostNameUnderLogo"
                    :label="t('management.partnerTemplateForm.coverLayout.showHostNameUnderLogo')"
                    :description="t('management.partnerTemplateForm.coverLayout.showHostNameUnderLogoHint')"
                  />
                </div>
              </div>

              <div class="p-4 space-y-4">
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

              <div class="p-4 space-y-4">
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
            </section>
          </template>

          <!-- =========================== TRANSITION ========================= -->
          <!-- The beat between the cover and the invitation: tapping the cover
               plays a film, and the invitation appears over the background video
               when it ends. Its own rail entry rather than a group inside Cover,
               for the reason the rail exists at all — it is a stage of its own,
               so opening it points the preview at that stage instead of leaving
               the partner editing one screen while looking at another.

               Shown on both plans, because the animation below is what picks
               this stage's shape on either one. Only the film is standard-only:
               the basic flow's middle stage is built from the event's own
               featured photo, with no template artwork to configure. -->
          <template v-else-if="activeSection === 'transition'">
            <!-- One control, two stages: it chooses the cover's exit animation
                 *and* the transition that plays under it — decorations sliding
                 off into a veil reveal, or the cover splitting into two doors.
                 It used to sit in Cover, which showed half of what it does. -->
            <section :class="[PANEL, 'p-4 space-y-3']">
              <h5 :class="SECTION_HEADING">
                {{ t('management.partnerTemplateForm.transitionStage.animationGroup') }}
              </h5>
              <TemplateFormChoice v-model="animationTypeModel" :options="animationOptions" />
              <p :class="FIELD_HINT">
                {{ t('management.partnerTemplateForm.transitionStage.animationHint') }}
              </p>
            </section>

            <!-- The title card that plays over the featured photo on whichever
                 stage the control above picked. Directly under it because the
                 two are the transition beat between them, and because the
                 default option here — match the transition — only means
                 anything next to the control it matches. Not plan-gated: this
                 is a composition, not an asset slot. -->
            <section :class="[PANEL, 'p-4 space-y-3']">
              <h5 :class="SECTION_HEADING">
                {{ t('management.partnerTemplateForm.saveTheDateDesign.sectionTitle') }}
              </h5>
              <TemplateFormChoice v-model="saveTheDateDesignModel" :options="saveTheDateDesignOptions" :columns="1" />
              <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.saveTheDateDesign.designHint') }}</p>
            </section>

            <PlanRequiredNotice v-if="!form.package_plan_id" @pick="selectSection('basics')" />
            <section
              v-else-if="isStandardPlan"
              :class="[PANEL, 'p-4 space-y-3']"
            >
              <h5 :class="SECTION_HEADING">
                {{ t('management.partnerTemplateForm.transitionStage.sectionTitle') }}
              </h5>
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
            </section>
          </template>

          <!-- ============================= EFFECTS ========================== -->
          <!-- The three ambient decorations, gathered off the two stage tabs they
               used to be split across. Each is an independent field with its own
               switch, so which stage happens to render it is a property of the
               effect rather than a reason to bury its controls in that stage's tab.
               None is plan-gated: unlike the decoration slots, they do not depend
               on which package plan is chosen. Each block says where it shows,
               since the tab it sat in is no longer carrying that information. -->
          <template v-else-if="activeSection === 'effects'">
            <!-- Cover stage only: CoverStage hands these to CoverContentOverlay
                 and nothing else renders them. -->
            <section :class="[PANEL, 'p-4 space-y-4']">
              <TemplateFormSwitch
                v-model="form.ambient_creatures_enabled"
                :icon="Bird"
                :label="t('management.partnerTemplateForm.ambientCreatures.enableLabel')"
                :description="t('management.partnerTemplateForm.ambientCreatures.enableHint')"
              />

              <Transition name="collapse">
                <div v-if="form.ambient_creatures_enabled" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <div class="space-y-4 pt-1">
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
                          :columns="3"
                        />
                      </div>

                      <TemplateFormChoice
                        v-model="creatureColorSourceModel"
                        :label="t('management.partnerTemplateForm.ambientCreatures.colorSource')"
                        :options="creatureColorSourceOptions"
                        :columns="3"
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
                    </div>
                  </div>
                </div>
              </Transition>
            </section>

            <!-- Main content stage only, see MainContentStage's FallingEffect —
                 never drawn over the cover. -->
            <section :class="[PANEL, 'p-4 space-y-4']">
              <TemplateFormSwitch
                v-model="form.falling_effect_enabled"
                :icon="Snowflake"
                :label="t('management.partnerTemplateForm.fallingEffect.enableLabel')"
                :description="t('management.partnerTemplateForm.fallingEffect.enableHint')"
              />

              <Transition name="collapse">
                <div v-if="form.falling_effect_enabled" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <div class="space-y-4 pt-1">
                      <TemplateFormSelect
                        v-model="fallingTypeModel"
                        :label="t('management.partnerTemplateForm.fallingEffect.particleType')"
                        :options="fallingTypeOptions"
                      />
                      <TemplateFormChoice
                        v-model="fallingIntensityModel"
                        :label="t('management.partnerTemplateForm.fallingEffect.intensity')"
                        :options="intensityOptions"
                        :columns="3"
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
                        :columns="3"
                      />
                      <TemplateFormColor
                        v-if="form.falling_effect.color_source === 'custom'"
                        v-model="form.falling_effect.custom_color"
                        :name="t('management.partnerTemplateForm.colorField.names.fallingEffect')"
                        placeholder="#FFD700"
                      />

                      <div class="space-y-1.5">
                        <span :class="FIELD_LABEL">{{ t('management.partnerTemplateForm.fallingEffect.customImage') }}</span>
                        <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.fallingEffect.customImageHint') }}</p>
                        <div
                          v-if="fallingEffectCustomImagePreview || (existingTemplate?.falling_effect?.custom_image && !form.clear_falling_effect_custom_image)"
                          class="flex items-center gap-3 p-2 ring-1 ring-slate-200 rounded-xl"
                        >
                          <img
                            :src="fallingEffectCustomImagePreview || existingTemplate?.falling_effect?.custom_image || ''"
                            :alt="t('management.partnerTemplateForm.fallingEffect.customImage')"
                            class="w-12 h-12 object-contain bg-slate-100 rounded-lg"
                          />
                          <div class="flex-1 min-w-0 text-xs text-slate-600 truncate">
                            {{ form.falling_effect_custom_image?.name || t('management.partnerTemplateForm.fallingEffect.currentImage') }}
                          </div>
                          <label class="cursor-pointer px-2 py-1 rounded-lg text-xs font-medium text-[#1e90ff] hover:bg-sky-50 transition-colors">
                            {{ t('management.partnerTemplateForm.fallingEffect.replace') }}
                            <input type="file" accept="image/png,image/svg+xml" class="sr-only" @change="handleFileChange('falling_effect_custom_image', $event)" />
                          </label>
                          <button
                            type="button"
                            @click="clearFallingEffectCustomImage"
                            :class="[BTN_ICON_MICRO, 'hover:text-red-600 hover:bg-red-50']"
                            :aria-label="t('management.partnerTemplateForm.fallingEffect.remove')"
                          >
                            <Trash2 class="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <label
                          v-else
                          class="flex items-center justify-center gap-2 py-3 cursor-pointer border-2 border-dashed border-slate-200 bg-slate-50/60 hover:border-sky-400 hover:bg-sky-50/40 rounded-xl transition-colors"
                        >
                          <Upload class="w-4 h-4 text-slate-400" />
                          <span class="text-xs font-medium text-slate-500">{{ t('management.partnerTemplateForm.fallingEffect.uploadCustom') }}</span>
                          <input type="file" accept="image/png,image/svg+xml" class="sr-only" @change="handleFileChange('falling_effect_custom_image', $event)" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </section>

            <!-- Every stage: mounted by CoverStage for the life of the showcase,
                 so one field drifts unbroken from the cover into the main content. -->
            <section :class="[PANEL, 'p-4 space-y-4']">
              <TemplateFormSwitch
                v-model="form.sparks_enabled"
                :icon="Sparkles"
                :label="t('management.partnerTemplateForm.sparks.enableLabel')"
                :description="t('management.partnerTemplateForm.sparks.enableHint')"
              />

              <Transition name="collapse">
                <div v-if="form.sparks_enabled" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <div class="space-y-4 pt-1">
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
                        :columns="3"
                      />

                      <TemplateFormChoice
                        v-model="sparkColorSourceModel"
                        :label="t('management.partnerTemplateForm.sparks.colorSource')"
                        :options="sparkColorSourceOptions"
                        :columns="2"
                      />

                      <TemplateFormColor
                        v-if="form.sparks.color_source === 'custom'"
                        v-model="form.sparks.custom_color"
                        :name="t('management.partnerTemplateForm.colorField.names.sparks')"
                        placeholder="#E0B269"
                      />

                      <div class="space-y-1.5">
                        <span :class="FIELD_LABEL">{{ t('management.partnerTemplateForm.sparks.customImage') }}</span>
                        <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.sparks.customImageHint') }}</p>
                        <div
                          v-if="sparkCustomImagePreview || (existingTemplate?.spark_custom_image && !form.clear_spark_custom_image)"
                          class="flex items-center gap-3 p-2 ring-1 ring-slate-200 rounded-xl"
                        >
                          <img
                            :src="sparkCustomImagePreview || existingTemplate?.spark_custom_image || ''"
                            :alt="t('management.partnerTemplateForm.sparks.customImage')"
                            class="w-12 h-12 object-contain bg-slate-100 rounded-lg"
                          />
                          <div class="flex-1 min-w-0 text-xs text-slate-600 truncate">
                            {{ form.spark_custom_image?.name || t('management.partnerTemplateForm.fallingEffect.currentImage') }}
                          </div>
                          <label class="cursor-pointer px-2 py-1 rounded-lg text-xs font-medium text-[#1e90ff] hover:bg-sky-50 transition-colors">
                            {{ t('management.partnerTemplateForm.fallingEffect.replace') }}
                            <input type="file" accept="image/png,image/svg+xml" class="sr-only" @change="handleFileChange('spark_custom_image', $event)" />
                          </label>
                          <button
                            type="button"
                            @click="clearSparkCustomImage"
                            :class="[BTN_ICON_MICRO, 'hover:text-red-600 hover:bg-red-50']"
                            :aria-label="t('management.partnerTemplateForm.fallingEffect.remove')"
                          >
                            <Trash2 class="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <label
                          v-else
                          class="flex items-center justify-center gap-2 py-3 cursor-pointer border-2 border-dashed border-slate-200 bg-slate-50/60 hover:border-sky-400 hover:bg-sky-50/40 rounded-xl transition-colors"
                        >
                          <Upload class="w-4 h-4 text-slate-400" />
                          <span class="text-xs font-medium text-slate-500">{{ t('management.partnerTemplateForm.sparks.uploadCustom') }}</span>
                          <input type="file" accept="image/png,image/svg+xml" class="sr-only" @change="handleFileChange('spark_custom_image', $event)" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>
            </section>
          </template>

          <!-- ======================== MAIN CONTENT ========================= -->
          <!-- Everything the main content stage is made of, in the order it
               stacks on screen: the backdrop behind the card, then the card
               itself, then the blocks inside it. The backdrop used to be its own
               "Background" rail entry, which put the image and the thing it sits
               behind two clicks apart even though both only ever show on this
               one stage. -->
          <template v-else-if="activeSection === 'content'">
            <!-- Plan-gated on its own, unlike the rest of this section: which
                 backdrop field even applies (photo vs video) is decided by the
                 plan, while card width, glass and the block designs are not. -->
            <PlanRequiredNotice v-if="!form.package_plan_id" @pick="selectSection('basics')" />
            <section v-else :class="[PANEL, 'p-4 space-y-3']">
              <h5 :class="SECTION_HEADING">
                {{ t('management.partnerTemplateForm.backgroundStage.sectionTitle') }}
              </h5>
              <FileUploadField
                v-if="isBasicPlan"
                :label="t('management.partnerTemplateForm.backgroundStage.backgroundPhoto')"
                accept="image/*"
                :file-name="form.basic_background_photo?.name"
                :has-existing-file="hasSavedAsset('basic_background_photo')"
                @change="handleFileChange('basic_background_photo', $event)"
                @clear="clearAssetField('basic_background_photo')"
              />
              <FileUploadField
                v-if="isStandardPlan"
                :label="t('management.partnerTemplateForm.backgroundStage.backgroundVideo')"
                accept="video/*"
                :file-name="form.standard_background_video?.name"
                :has-existing-file="hasSavedAsset('standard_background_video')"
                @change="handleFileChange('standard_background_video', $event)"
                @clear="clearAssetField('standard_background_video')"
              />
              <div v-if="isBasicPlan" class="grid grid-cols-2 gap-2.5">
                <FileUploadField :label="t('management.partnerTemplateForm.backgroundStage.topDecoration')" accept="image/*" :file-name="form.top_decoration?.name" :has-existing-file="hasSavedAsset('top_decoration')" @change="handleFileChange('top_decoration', $event)" @clear="clearAssetField('top_decoration')" />
                <FileUploadField :label="t('management.partnerTemplateForm.backgroundStage.bottomDecoration')" accept="image/*" :file-name="form.bottom_decoration?.name" :has-existing-file="hasSavedAsset('bottom_decoration')" @change="handleFileChange('bottom_decoration', $event)" @clear="clearAssetField('bottom_decoration')" />
                <FileUploadField :label="t('management.partnerTemplateForm.backgroundStage.leftDecoration')" accept="image/*" :file-name="form.left_decoration?.name" :has-existing-file="hasSavedAsset('left_decoration')" @change="handleFileChange('left_decoration', $event)" @clear="clearAssetField('left_decoration')" />
                <FileUploadField :label="t('management.partnerTemplateForm.backgroundStage.rightDecoration')" accept="image/*" :file-name="form.right_decoration?.name" :has-existing-file="hasSavedAsset('right_decoration')" @change="handleFileChange('right_decoration', $event)" @clear="clearAssetField('right_decoration')" />
              </div>
            </section>

            <!-- How the content card itself is presented: how wide it sits and
                 whether it wears the glass treatment. Both were under Cover
                 Layout because both are stored inside `cover_stage_layout`, but
                 what they change is this stage. The glass switch does also govern
                 the cover's own glass panels (see CoverContentOverlay's
                 displayLiquidGlass); it is one switch for both stages. -->
            <section :class="[PANEL, 'p-4 space-y-4']">
              <TemplateFormChoice
                v-model="contentWidthModel"
                :label="t('management.partnerTemplateForm.coverLayout.contentWidth')"
                :options="contentWidthOptions"
              />
              <TemplateFormSwitch
                v-model="form.display_liquid_glass_background"
                :icon="Droplets"
                :label="t('management.partnerTemplateForm.fields.liquidGlass')"
                :description="t('management.partnerTemplateForm.fields.liquidGlassHint')"
              />
            </section>

            <section :class="[PANEL, 'p-4 space-y-3']">
              <h5 :class="SECTION_HEADING">
                {{ t('management.partnerTemplateForm.eventDetailsDesign.sectionTitle') }}
              </h5>
              <TemplateFormChoice v-model="eventDetailsDesignModel" :options="eventDetailsDesignOptions" :columns="1" />
              <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.eventDetailsDesign.designHint') }}</p>

              <!-- Every design but panel spends this on exactly one accent mark:
                   the calendar's circled day, the flanked rules, the arch
                   outline, the ticket perforation + stub numeral. -->
              <Transition name="collapse">
                <div v-if="form.event_details_design_type !== 'panel'" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <div class="space-y-3 pt-1">
                      <TemplateFormChoice
                        v-model="eventDetailsMarkerColorSourceModel"
                        :label="t('management.partnerTemplateForm.eventDetailsDesign.markerColorSource')"
                        :options="eventDetailsMarkerColorOptions"
                        :columns="2"
                      />
                      <TemplateFormColor
                        v-if="form.event_details_marker_color_source === 'custom'"
                        v-model="form.event_details_marker_custom_color"
                        :name="t('management.partnerTemplateForm.colorField.names.calendarMarker')"
                        placeholder="#B3261E"
                      />
                      <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.eventDetailsDesign.markerColorHint') }}</p>
                    </div>
                  </div>
                </div>
              </Transition>
            </section>

            <!-- The other half of the date design above: whatever the date
                 becomes, this is the block that sits under it (venue, map,
                 countdown, RSVP). `engraved` is the set drawn in the same
                 hairline language as the calendar / flanked / arch dates, so
                 the two read as one sheet instead of type stacked on glass. -->
            <section :class="[PANEL, 'p-4 space-y-3']">
              <h5 :class="SECTION_HEADING">
                {{ t('management.partnerTemplateForm.infoCardDesign.sectionTitle') }}
              </h5>
              <TemplateFormChoice v-model="infoCardDesignModel" :options="infoCardDesignOptions" :columns="1" />
              <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.infoCardDesign.designHint') }}</p>
            </section>

            <section :class="[PANEL, 'p-4 space-y-3']">
              <h5 :class="SECTION_HEADING">
                {{ t('management.partnerTemplateForm.hostInfoDesign.sectionTitle') }}
              </h5>
              <TemplateFormChoice v-model="hostInfoDesignModel" :options="hostInfoDesignOptions" :columns="1" />
              <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.hostInfoDesign.designHint') }}</p>

              <!-- The frame is one choice drawn twice — around the title and
                   around the avatar — so the pair can never be mismatched. Only
                   the grid designs draw it, so it collapses away on the two that
                   don't: arch brings its own frames and simple has neither a
                   title nor an avatar to frame. -->
              <Transition name="collapse">
                <div
                  v-if="form.host_info_design_type === 'standard' || form.host_info_design_type === 'portrait'"
                  class="grid grid-rows-[1fr]"
                >
                  <div class="min-h-0 overflow-hidden">
                    <div class="space-y-3 pt-1">
                      <TemplateFormChoice
                        v-model="hostFrameStyleModel"
                        :label="t('management.partnerTemplateForm.hostInfoDesign.frameLabel')"
                        :options="hostFrameStyleOptions"
                        :columns="1"
                      />
                      <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.hostInfoDesign.frameHint') }}</p>

                      <TemplateFormChoice
                        v-model="hostCoupleOrnamentModel"
                        :label="t('management.partnerTemplateForm.hostInfoDesign.ornamentLabel')"
                        :options="hostCoupleOrnamentOptions"
                        :columns="1"
                      />
                      <p :class="FIELD_HINT">{{ t('management.partnerTemplateForm.hostInfoDesign.ornamentHint') }}</p>
                    </div>
                  </div>
                </div>
              </Transition>
            </section>
          </template>

        </div>
      </div>

      <!-- Live preview of the draft, fed over the same bridge the manage-page
           studio uses to try templates on — so unsaved edits (files included)
           show up without a save or a reload. Its stage follows the section
           being edited, so the pane always shows the thing under the cursor. -->
      <aside
        class="lg:row-start-1 lg:col-start-3 flex-col border-l border-slate-200/70 bg-white p-3 overflow-hidden"
        :class="mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'"
      >
        <PartnerTemplatePreview
          v-model:stage="previewStage"
          v-model:selected-element="selectedCoverElement"
          :draft="previewDraft"
          :event-id="eventId"
          :event-data="eventData"
          :saved-template="existingTemplate"
          :layout-editing="coverLayoutEditing"
          @layout-change="onCoverLayoutChange"
        />
      </aside>

      <!-- Footer, mobile only: the desktop actions live in the modal's header
           row now, so keeping a bar down here just to restate the hint would be
           the exact wasted row this redesign removed. -->
      <div class="lg:hidden col-span-full px-3 sm:px-4 py-2.5 border-t border-slate-200/70 bg-white flex items-center gap-3">
        <p class="flex-1 min-w-0 text-[0.6875rem] sm:text-xs truncate" :class="canSave ? 'text-slate-400' : 'text-amber-600'">
          <span v-if="!canSave" class="inline-flex items-center gap-1">
            <AlertCircle class="w-3.5 h-3.5 flex-shrink-0" />
            {{ t('management.partnerTemplateForm.footer.missingRequired') }}
          </span>
          <span v-else>{{ t('management.partnerTemplateForm.footer.autosaveHint') }}</span>
        </p>
        <button
          type="button"
          @click="handleSave"
          :disabled="saving || !canSave"
          :class="BTN_PRIMARY_BAR"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          {{ saving ? t('management.partnerTemplateForm.footer.saving') : (isEditing ? t('management.partnerTemplateForm.footer.saveChangesShort') : t('management.partnerTemplateForm.footer.createShort')) }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, inject, onMounted, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeft,
  Upload,
  AlertCircle,
  Loader2,
  Info,
  Palette,
  Image as ImageIcon,
  AlignLeft,
  Check,
  Crown,
  Sparkles,
  Pencil,
  Trash2,
  Type,
  Plus,
  X,
  Droplets,
  PenLine,
  IdCard,
  Snowflake,
  Bird,
  Wand2,
  DoorOpen,
  Maximize2,
  Minimize2,
  CalendarDays,
  LayoutPanelTop,
  AlignVerticalJustifyCenter,
  Church,
  Ticket,
  Users,
  UserRound,
  Move,
  Rows3,
  Columns3,
  Signature,
  Stamp,
  Minus,
  Square,
  Ban,
  Bookmark,
  Award,
  Heart,
  CircleDashed,
  Infinity as InfinityIcon,
  Flower2,
  RectangleHorizontal,
  Frame,
  Clapperboard,
  type LucideIcon,
} from 'lucide-vue-next'
import { partnerTemplateService, packagePlanService, customFontsService, FONT_TYPE_LABELS, LANGUAGE_CODE_LABELS } from '../../services/api'
import type {
  // Aliased: this file's file-input handlers take the DOM `Event`, which an
  // unaliased import would shadow.
  Event as EventRecord,
  PartnerTemplate,
  PartnerTemplateCreatePayload,
  PackagePlan,
  CoverStageLayout,
  CoverElementBox,
  CoverElementBoxes,
  CoverElementColorSource,
  CoverElementId,
  CoverLayoutMode,
  GuestFrameCorners,
  GuestFrameStyle,
  EventTemplateColor,
  EventTemplateLanguageFont,
  CustomFont,
  TemplateFontType,
  TemplateLanguageCode,
  FallingEffectConfig,
  FallingEffectType,
  EventDetailsDesignType,
  EventDetailsDesignConfig,
  EventDetailsMarkerColorSource,
  HostInfoDesignType,
  HostInfoDesignConfig,
  InfoCardDesignType,
  SaveTheDateDesignType,
  HostFrameStyle,
  CoupleOrnament,
  SaveTheDateDesignConfig,
  AmbientCreaturesConfig,
  AmbientCreatureEntry,
  AmbientCreatureEffectType,
  SparkFieldConfig,
  SparkShape,
  SparkColorSource,
} from '../../services/api'
import PartnerTemplateFileField from './PartnerTemplateFileField.vue'
import PartnerTemplatePreview from './PartnerTemplatePreview.vue'
import TemplateSlotField from './TemplateSlotField.vue'
import TemplateFormSwitch from './TemplateFormSwitch.vue'
import TemplateFormNumber from './TemplateFormNumber.vue'
import TemplateFormChoice from './TemplateFormChoice.vue'
import TemplateFormColor from './TemplateFormColor.vue'
import TemplateFormSelect, { type TemplateFormSelectOption } from './TemplateFormSelect.vue'
import PlanRequiredNotice from './TemplateFormPlanNotice.vue'
import TemplateSegmented, { type TemplateSegmentedOption } from './TemplateSegmented.vue'
import {
  BTN_ADD_DASHED,
  BTN_GHOST_BAR,
  BTN_GHOST_SM,
  BTN_ICON,
  BTN_ICON_MICRO,
  BTN_PRIMARY_BAR,
  BTN_PRIMARY_SM,
  BTN_SECONDARY_SM,
  CHIP_BASE,
  FIELD,
  FIELD_HINT,
  FIELD_LABEL,
  FIELD_SM,
  OPTION_BASE,
  OPTION_IDLE,
  OPTION_SELECTED,
  PANEL,
  SECTION_HEADING,
  optionClass,
  optionIconClass,
} from './templateUi'
import { TEMPLATES_HEADER_SLOT } from './templatesHeaderSlot'
import { useMediaQuery } from '../../composables/useMediaQuery'
import GuestFrameCornerGrid from './GuestFrameCornerGrid.vue'
import {
  COVER_ELEMENT_IDS,
  resolveCoverElements,
  resolveCoverGilding,
  resolveGuestFrame,
  rowsToCoverElements,
  type ResolvedCoverElementBox,
  type ResolvedCoverGilding,
  type ResolvedGuestFrame,
} from '../../composables/showcase/useCoverStageLayout'
import {
  FALLING_SPEED_RANGE,
  resolveFallingSpeed,
} from '../../composables/showcase/useFallingParticles'
import {
  SPARK_BLINK_SPEED_RANGE,
  SPARK_FIELD_DEFAULTS,
  SPARK_MAX_COUNT,
  SPARK_SIZE_DEFAULTS,
  SPARK_SIZE_RANGE,
  resolveSparkBlinkSpeed,
} from '../../composables/showcase/useSparkField'
import { TEMPLATE_COLOR_SLOTS, TEMPLATE_FONT_TYPE_SLOTS } from './templateSlots'
import {
  PARTNER_TEMPLATE_ASSET_FIELDS,
  type PartnerTemplateAssetField,
  type PartnerTemplateDraft,
} from './partnerTemplateAssets'

const { t } = useI18n()

// Alias for cleaner template usage
const FileUploadField = PartnerTemplateFileField

const nameFieldId = useId()
const previewUrlFieldId = useId()
/** Base for the per-row ids of the ambient-creature number fields. */
const creatureFieldId = useId()

// From `lg` up the editor's title and save actions take over the modal's own
// header row instead of opening a second one beneath it. Below that they stay
// local — the modal's row has no width to spare on a phone.
const headerSlot = inject(TEMPLATES_HEADER_SLOT, ref(null))
const isDesktop = useMediaQuery('(min-width: 1024px)')

interface Props {
  isOpen: boolean
  existingTemplate?: PartnerTemplate | null
  /** The event this form was opened from — the live preview's sample content. */
  eventId: string
  /** That event's record, for the preview's frame-list decisions. */
  eventData?: EventRecord | null
}

const props = withDefaults(defineProps<Props>(), { existingTemplate: null, eventData: null })

const emit = defineEmits<{
  close: []
  saved: [template: PartnerTemplate]
}>()

const isEditing = computed(() => !!props.existingTemplate)

// Package plans
const plansLoading = ref(false)
const availablePlans = ref<PackagePlan[]>([])

function isPlanBasic(plan: PackagePlan): boolean {
  const name = plan.name.toLowerCase()
  return name.includes('basic')
}

function isPlanStandard(plan: PackagePlan): boolean {
  const name = plan.name.toLowerCase()
  return name.includes('standard')
}

const selectedPlan = computed(() =>
  availablePlans.value.find((p) => p.id === form.package_plan_id) ?? null,
)

const isBasicPlan = computed(() => selectedPlan.value ? isPlanBasic(selectedPlan.value) : false)
const isStandardPlan = computed(() => selectedPlan.value ? isPlanStandard(selectedPlan.value) : false)

async function fetchPlans(): Promise<void> {
  if (availablePlans.value.length > 0) return
  plansLoading.value = true
  try {
    const response = await packagePlanService.listPlans()
    if (response.success && response.data) {
      const data = response.data
      const plans = Array.isArray(data)
        ? data
        : (data as unknown as { results: PackagePlan[] }).results ?? []
      // Only show active basic/standard plans, exclude free plans
      availablePlans.value = plans.filter(
        (p) => p.is_active && (isPlanBasic(p) || isPlanStandard(p)) && !p.name.toLowerCase().includes('free'),
      )
    }
  } catch {
    // Plans will remain empty, user sees "No plans available"
  } finally {
    plansLoading.value = false
  }
}

// Cover stage layout defaults
/**
 * The form always holds a FULLY populated guest frame config.
 *
 * `Required<CoverStageLayout>` only guarantees the `guestFrame` key exists, not
 * the fields inside it, but every control below binds straight to one of those
 * fields with `v-model` — so the form's copy resolves them up front (the same
 * way the showcase's `resolveGuestFrame` does) rather than making each control
 * cope with `undefined`.
 */
type CoverStageLayoutFormState = Required<CoverStageLayout> & {
  guestFrame: ResolvedGuestFrame
  coverGilding: ResolvedCoverGilding
}

const defaultCoverStageLayout = (): CoverStageLayoutFormState => ({
  layoutMode: 'rows',
  coverElements: {},
  guestFrame: resolveGuestFrame({} as Required<CoverStageLayout>),
  coverGilding: resolveCoverGilding({} as Required<CoverStageLayout>),
  contentTopPosition: 23.5,
  innerContainerHeight: 53,
  eventTitleHeight: 18.75,
  logoHeight: 48,
  inviteTextHeight: 8.75,
  guestNameHeight: 16,
  guestNameMaxWidthPercent: 60,
  swipeArrowBottom: 5,
  showWelcomeHeaderText: true,
  showCoverHeaderText: true,
  showHostNameUnderLogo: true,
  hostClipScale: 60,
  hostClipOffsetX: 50,
  hostClipOffsetY: 50,
  leftDecorationZIndex: 24,
  rightDecorationZIndex: 24,
  topDecorationZIndex: 25,
  bottomDecorationZIndex: 25,
  showcaseAnimationType: 'decoration',
  contentWidth: 'standard',
})

interface FallingEffectFormState {
  type: FallingEffectType
  color_source: 'primary' | 'accent' | 'custom'
  custom_color: string
  intensity: 'light' | 'normal' | 'heavy'
  /** Fall-speed multiplier; FALLING_SPEED_RANGE.default is the original speed. */
  speed: number
}

interface AmbientCreaturesFormState {
  creatures: AmbientCreatureEntry[]
  count: number
  speed: 'slow' | 'normal' | 'fast'
  color_source: 'primary' | 'accent' | 'custom'
  custom_color: string
}

interface SparkFieldFormState {
  count: number
  /** Blink-rate multiplier; SPARK_BLINK_SPEED_RANGE.default is the original rate. */
  blink_speed: number
  /** Mote size range as a % of the stage width. */
  min_size: number
  max_size: number
  shape: SparkShape
  color_source: SparkColorSource
  custom_color: string
  intensity: 'subtle' | 'normal' | 'bright'
}

interface FormState {
  name: string
  package_plan_id: number | null
  youtube_preview_url: string
  display_liquid_glass_background: boolean
  preview_image: File | null
  basic_background_photo: File | null
  basic_decoration_photo: File | null
  standard_background_video: File | null
  standard_cover_video: File | null
  standard_transition_video: File | null
  top_decoration: File | null
  bottom_decoration: File | null
  left_decoration: File | null
  right_decoration: File | null
  cover_top_decoration: File | null
  cover_bottom_decoration: File | null
  cover_left_decoration: File | null
  cover_right_decoration: File | null
  guest_title_frame_left: File | null
  guest_title_frame_mid: File | null
  guest_title_frame_right: File | null
  sample_logo_1: File | null
  sample_logo_2: File | null
  header_text_image: File | null
  cover_stage_layout: CoverStageLayoutFormState
  falling_effect_enabled: boolean
  falling_effect: FallingEffectFormState
  falling_effect_custom_image: File | null
  clear_falling_effect_custom_image: boolean
  ambient_creatures_enabled: boolean
  ambient_creatures: AmbientCreaturesFormState
  sparks_enabled: boolean
  sparks: SparkFieldFormState
  spark_custom_image: File | null
  clear_spark_custom_image: boolean
  /** Date/location block design rendered in the showcase (panel | calendar). */
  event_details_design_type: EventDetailsDesignType
  /** Colour slot for the calendar design's event-day marker (calendar only). */
  event_details_marker_color_source: EventDetailsMarkerColorSource
  /** Hex colour used when the marker colour source is 'custom'. */
  event_details_marker_custom_color: string
  /** Host info block design rendered in the showcase (standard | simple). */
  host_info_design_type: HostInfoDesignType
  /** Frame chrome shared by the host title and avatar. `none` is the pre-frames look. */
  host_frame_style: HostFrameStyle
  /** Motif between the two hosts in the grid's centre column. */
  host_couple_ornament: CoupleOrnament
  /** Info card (venue/map/countdown/RSVP) treatment in the showcase (glass | engraved). */
  info_card_design_type: InfoCardDesignType
  /**
   * Save the Date composition on the transition stage. `auto` is not a design —
   * it stores nothing, which leaves each transition stage on the one it shipped
   * with (`script` for decoration, `engraved` for door). Every template saved
   * before this field existed loads as `auto`, so opening and re-saving one
   * can't silently pin it to a design its partner never chose.
   */
  save_the_date_design_type: SaveTheDateDesignType | 'auto'
}

const defaultFallingEffect = (): FallingEffectFormState => ({
  type: 'petals',
  color_source: 'primary',
  custom_color: '#FFD700',
  intensity: 'normal',
  speed: FALLING_SPEED_RANGE.default,
})

const defaultAmbientCreatures = (): AmbientCreaturesFormState => ({
  creatures: [{ type: 'butterfly', weight: 1 }],
  count: 6,
  speed: 'normal',
  color_source: 'accent',
  custom_color: '#FFD700',
})

const defaultSparkField = (): SparkFieldFormState => ({
  count: SPARK_FIELD_DEFAULTS.count,
  blink_speed: SPARK_BLINK_SPEED_RANGE.default,
  min_size: SPARK_SIZE_DEFAULTS.min,
  max_size: SPARK_SIZE_DEFAULTS.max,
  shape: 'glow',
  color_source: 'accent',
  custom_color: '#E0B269',
  intensity: 'normal',
})

const defaultForm = (): FormState => ({
  name: '',
  package_plan_id: null,
  youtube_preview_url: '',
  display_liquid_glass_background: true,
  preview_image: null,
  basic_background_photo: null,
  basic_decoration_photo: null,
  standard_background_video: null,
  standard_cover_video: null,
  standard_transition_video: null,
  top_decoration: null,
  bottom_decoration: null,
  left_decoration: null,
  right_decoration: null,
  cover_top_decoration: null,
  cover_bottom_decoration: null,
  cover_left_decoration: null,
  cover_right_decoration: null,
  guest_title_frame_left: null,
  guest_title_frame_mid: null,
  guest_title_frame_right: null,
  sample_logo_1: null,
  sample_logo_2: null,
  header_text_image: null,
  cover_stage_layout: defaultCoverStageLayout(),
  falling_effect_enabled: false,
  falling_effect: defaultFallingEffect(),
  falling_effect_custom_image: null,
  clear_falling_effect_custom_image: false,
  ambient_creatures_enabled: false,
  ambient_creatures: defaultAmbientCreatures(),
  sparks_enabled: false,
  sparks: defaultSparkField(),
  spark_custom_image: null,
  clear_spark_custom_image: false,
  event_details_design_type: 'panel',
  event_details_marker_color_source: 'accent',
  event_details_marker_custom_color: '#B3261E',
  host_info_design_type: 'standard',
  host_frame_style: 'none',
  host_couple_ornament: 'none',
  info_card_design_type: 'glass',
  save_the_date_design_type: 'auto',
})

const CREATURE_TYPES: AmbientCreatureEffectType[] = ['butterfly', 'dove', 'firefly', 'dragonfly', 'balloon', 'hummingbird']
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

const form = reactive<FormState>(defaultForm())
const previewImagePreview = ref<string | null>(null)
const bgPhotoPreview = ref<string | null>(null)
const fallingEffectCustomImagePreview = ref<string | null>(null)
const sparkCustomImagePreview = ref<string | null>(null)
const saving = ref(false)
const error = ref<string | null>(null)

/**
 * Saved assets the partner has asked to remove. Held apart from `form` because
 * these aren't values being edited — they're deletions staged against the
 * server's copy, and they only reach it on Save (see handleSave, which sends
 * `''` for each). Everything else the form holds is either a pending File or an
 * untouched saved URL, neither of which can express "delete this".
 */
type ClearableAssetField = PartnerTemplateAssetField | 'preview_image'

const clearedAssets = ref(new Set<ClearableAssetField>())

/** Whether the server still has a file for this field, removals accounted for. */
const hasSavedAsset = (field: ClearableAssetField): boolean =>
  !!props.existingTemplate?.[field] && !clearedAssets.value.has(field)

const hasPreviewImage = computed(
  () => !!previewImagePreview.value || hasSavedAsset('preview_image'),
)

const canSave = computed(() => !!form.name.trim() && !!form.package_plan_id)

// Which creature types are still selectable (duplicates rejected server-side)
const availableCreatureTypes = computed<AmbientCreatureEffectType[]>(() => {
  const used = new Set(form.ambient_creatures.creatures.map((c: AmbientCreatureEntry) => c.type))
  return CREATURE_TYPES.filter((t) => !used.has(t))
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

// ---------------------------------------------------------------------------
// Option lists for the choice/select primitives. Building them here keeps the
// template free of the repeated <option> blocks (and the inline base64 chevron
// class) the form used to carry on every single select.
// ---------------------------------------------------------------------------
const animationOptions = computed(() => [
  { value: 'decoration', label: t('management.partnerTemplateForm.transitionStage.animationDecoration'), icon: Sparkles },
  { value: 'door', label: t('management.partnerTemplateForm.transitionStage.animationDoor'), icon: DoorOpen },
])

const contentWidthOptions = computed(() => [
  { value: 'standard', label: t('management.partnerTemplateForm.coverLayout.contentWidthStandard'), icon: Minimize2 },
  { value: 'wide', label: t('management.partnerTemplateForm.coverLayout.contentWidthWide'), icon: Maximize2 },
])

const eventDetailsDesignOptions = computed(() => [
  { value: 'panel', label: t('management.partnerTemplateForm.eventDetailsDesign.types.panel'), icon: LayoutPanelTop },
  { value: 'calendar', label: t('management.partnerTemplateForm.eventDetailsDesign.types.calendar'), icon: CalendarDays },
  { value: 'flanked', label: t('management.partnerTemplateForm.eventDetailsDesign.types.flanked'), icon: AlignVerticalJustifyCenter },
  { value: 'arch', label: t('management.partnerTemplateForm.eventDetailsDesign.types.arch'), icon: Church },
  { value: 'ticket', label: t('management.partnerTemplateForm.eventDetailsDesign.types.ticket'), icon: Ticket },
])

const eventDetailsMarkerColorOptions = computed(() => [
  { value: 'accent', label: t('management.partnerTemplateForm.eventDetailsDesign.sourceAccent') },
  { value: 'primary', label: t('management.partnerTemplateForm.eventDetailsDesign.sourcePrimary') },
  { value: 'secondary', label: t('management.partnerTemplateForm.eventDetailsDesign.sourceSecondary') },
  { value: 'custom', label: t('management.partnerTemplateForm.fallingEffect.sourceCustomShort') },
])

// portrait and arch are wedding-only rearrangements of the host block; on any
// other event type they fall through to the standard layout.
const hostInfoDesignOptions = computed(() => [
  { value: 'standard', label: t('management.partnerTemplateForm.hostInfoDesign.types.standard'), icon: Users },
  { value: 'simple', label: t('management.partnerTemplateForm.hostInfoDesign.types.simple'), icon: UserRound },
  { value: 'portrait', label: t('management.partnerTemplateForm.hostInfoDesign.types.portrait'), icon: IdCard },
  { value: 'arch', label: t('management.partnerTemplateForm.hostInfoDesign.types.arch'), icon: Church },
])

// One choice, two renderings — the title's frame and the avatar's ring are a
// matched pair, so they are never selected independently. Drawn by the grid
// designs (standard, portrait); arch draws its own and simple has neither.
const hostFrameStyleOptions = computed(() => [
  { value: 'none', label: t('management.partnerTemplateForm.hostInfoDesign.frames.none'), icon: Ban },
  { value: 'banner', label: t('management.partnerTemplateForm.hostInfoDesign.frames.banner'), icon: RectangleHorizontal },
  { value: 'plaque', label: t('management.partnerTemplateForm.hostInfoDesign.frames.plaque'), icon: Square },
  { value: 'ribbon', label: t('management.partnerTemplateForm.hostInfoDesign.frames.ribbon'), icon: Bookmark },
  { value: 'laurel', label: t('management.partnerTemplateForm.hostInfoDesign.frames.laurel'), icon: Award },
])

// The motif in the centre column between the two hosts.
const hostCoupleOrnamentOptions = computed(() => [
  { value: 'none', label: t('management.partnerTemplateForm.hostInfoDesign.ornaments.none'), icon: Ban },
  { value: 'heart', label: t('management.partnerTemplateForm.hostInfoDesign.ornaments.heart'), icon: Heart },
  { value: 'rings', label: t('management.partnerTemplateForm.hostInfoDesign.ornaments.rings'), icon: CircleDashed },
  { value: 'knot', label: t('management.partnerTemplateForm.hostInfoDesign.ornaments.knot'), icon: InfinityIcon },
  { value: 'bloom', label: t('management.partnerTemplateForm.hostInfoDesign.ornaments.bloom'), icon: Flower2 },
])

// The engraved option is built to sit under the calendar / flanked / arch date
// designs, which are drawn in the same hairline language. Under the panel or
// ticket designs it still renders, it just has nothing above it to rhyme with.
const infoCardDesignOptions = computed(() => [
  { value: 'glass', label: t('management.partnerTemplateForm.infoCardDesign.types.glass'), icon: Droplets },
  { value: 'engraved', label: t('management.partnerTemplateForm.infoCardDesign.types.engraved'), icon: PenLine },
])

// Both transition stages render all six. `auto` leads because it is what every
// existing template is, and because it is the right answer for most: `script`
// and `engraved` were each drawn *for* their own stage's ground, so matching the
// transition is a real choice rather than a placeholder. The five below it are
// listed by how much chrome they add — none, then structure, then ornament.
const saveTheDateDesignOptions = computed(() => [
  { value: 'auto', label: t('management.partnerTemplateForm.saveTheDateDesign.types.auto'), icon: Wand2 },
  { value: 'script', label: t('management.partnerTemplateForm.saveTheDateDesign.types.script'), icon: Signature },
  { value: 'engraved', label: t('management.partnerTemplateForm.saveTheDateDesign.types.engraved'), icon: Frame },
  { value: 'minimal', label: t('management.partnerTemplateForm.saveTheDateDesign.types.minimal'), icon: Minus },
  { value: 'columns', label: t('management.partnerTemplateForm.saveTheDateDesign.types.columns'), icon: Columns3 },
  { value: 'medallion', label: t('management.partnerTemplateForm.saveTheDateDesign.types.medallion'), icon: Stamp },
  { value: 'poster', label: t('management.partnerTemplateForm.saveTheDateDesign.types.poster'), icon: Type },
])

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
  (Object.entries(fallingTypeLabels.value) as Array<[FallingEffectType, string]>).map(([value, label]) => ({
    value,
    label,
  })),
)

const languageOptions = computed(() =>
  (Object.entries(LANGUAGE_CODE_LABELS) as Array<[TemplateLanguageCode, string]>).map(([value, label]) => ({
    value,
    label,
  })),
)

const customFontOptions = computed(() =>
  availableCustomFonts.value.map((font) => ({ value: font.id, label: font.name })),
)

/**
 * The primitives speak plain strings (and one `string | number`); several of the
 * form's fields are narrowed unions or nullable ids. Each proxy casts on the way
 * in only — the values themselves always originate from the option list that
 * field was handed, so the narrowing holds.
 */
const animationTypeModel = computed<string>({
  get: () => form.cover_stage_layout.showcaseAnimationType,
  set: (value) => { form.cover_stage_layout.showcaseAnimationType = value as 'decoration' | 'door' },
})

const contentWidthModel = computed<string>({
  get: () => form.cover_stage_layout.contentWidth,
  set: (value) => { form.cover_stage_layout.contentWidth = value as 'standard' | 'wide' },
})

// ---------------------------------------------------------------------------
// Cover gilding. Stored inside cover_stage_layout alongside the animation type
// it belongs with, so it needs no field of its own on the template model.
// ---------------------------------------------------------------------------
const gildingIntensityOptions = computed(() => [
  { value: 'subtle', label: t('management.partnerTemplateForm.coverGilding.intensitySubtle') },
  { value: 'normal', label: t('management.partnerTemplateForm.coverGilding.intensityNormal') },
  { value: 'bright', label: t('management.partnerTemplateForm.coverGilding.intensityBright') },
])

const gildingReliefOptions = computed(() => [
  { value: 'none', label: t('management.partnerTemplateForm.coverGilding.reliefNone') },
  { value: 'soft', label: t('management.partnerTemplateForm.coverGilding.reliefSoft') },
  { value: 'raised', label: t('management.partnerTemplateForm.coverGilding.reliefRaised') },
])

const gildingReliefModel = computed<string>({
  get: () => form.cover_stage_layout.coverGilding.decorationRelief,
  set: (value) => {
    form.cover_stage_layout.coverGilding.decorationRelief =
      value as ResolvedCoverGilding['decorationRelief']
  },
})

const gildingColorSourceOptions = computed(() => [
  { value: 'primary', label: t('management.partnerTemplateForm.ambientCreatures.sourcePrimary') },
  { value: 'secondary', label: t('management.partnerTemplateForm.coverGilding.sourceSecondary') },
  { value: 'accent', label: t('management.partnerTemplateForm.ambientCreatures.sourceAccent') },
  { value: 'custom', label: t('management.partnerTemplateForm.fallingEffect.sourceCustomShort') },
])

const gildingIntensityModel = computed<string>({
  get: () => form.cover_stage_layout.coverGilding.intensity,
  set: (value) => {
    form.cover_stage_layout.coverGilding.intensity =
      value as ResolvedCoverGilding['intensity']
  },
})

const gildingColorSourceModel = computed<string>({
  get: () => form.cover_stage_layout.coverGilding.colorSource,
  set: (value) => {
    form.cover_stage_layout.coverGilding.colorSource =
      value as ResolvedCoverGilding['colorSource']
  },
})

// ---------------------------------------------------------------------------
// Spark field. Its own section rather than part of the gilding above: the motes
// span every stage and are an independent decoration, so they get the same
// standalone treatment the falling particles and ambient creatures have.
// ---------------------------------------------------------------------------
const sparkShapeLabels = computed<Record<SparkShape, string>>(() => ({
  glow: t('management.partnerTemplateForm.sparks.shapes.glow'),
  sparkle: t('management.partnerTemplateForm.sparks.shapes.sparkle'),
  star: t('management.partnerTemplateForm.sparks.shapes.star'),
  diamond: t('management.partnerTemplateForm.sparks.shapes.diamond'),
  cross: t('management.partnerTemplateForm.sparks.shapes.cross'),
  dot: t('management.partnerTemplateForm.sparks.shapes.dot'),
}))

const sparkShapeOptions = computed(() =>
  (Object.entries(sparkShapeLabels.value) as Array<[SparkShape, string]>).map(
    ([value, label]) => ({ value, label }),
  ),
)

const sparkShapeModel = computed<string>({
  get: () => form.sparks.shape,
  set: (value) => { form.sparks.shape = value as SparkShape },
})

// Same four slots the gilding offers, so a template that switches from the
// legacy fallback to a standalone config keeps the tint it already had.
const sparkColorSourceOptions = computed(() => [
  { value: 'primary', label: t('management.partnerTemplateForm.ambientCreatures.sourcePrimary') },
  { value: 'secondary', label: t('management.partnerTemplateForm.coverGilding.sourceSecondary') },
  { value: 'accent', label: t('management.partnerTemplateForm.ambientCreatures.sourceAccent') },
  { value: 'custom', label: t('management.partnerTemplateForm.fallingEffect.sourceCustomShort') },
])

const sparkColorSourceModel = computed<string>({
  get: () => form.sparks.color_source,
  set: (value) => { form.sparks.color_source = value as SparkColorSource },
})

const sparkIntensityOptions = computed(() => [
  { value: 'subtle', label: t('management.partnerTemplateForm.coverGilding.intensitySubtle') },
  { value: 'normal', label: t('management.partnerTemplateForm.coverGilding.intensityNormal') },
  { value: 'bright', label: t('management.partnerTemplateForm.coverGilding.intensityBright') },
])

const sparkIntensityModel = computed<string>({
  get: () => form.sparks.intensity,
  set: (value) => { form.sparks.intensity = value as SparkFieldFormState['intensity'] },
})

/** A custom upload replaces the built-in shape, so the shape picker goes quiet. */
const sparkUsesCustomImage = computed(
  () =>
    !!form.spark_custom_image ||
    (!!props.existingTemplate?.spark_custom_image && !form.clear_spark_custom_image),
)

// ---------------------------------------------------------------------------
// Guest name frame.
//
// Switching style never touches the uploads: all three styles read the same
// three asset slots (relabelled per style in the markup above), so a partner can
// try the one-piece look and go back to the 3-piece one with their artwork
// intact. The corner board keeps its config for the same reason.
// ---------------------------------------------------------------------------
const guestFrameStyleModel = computed<string>({
  get: () => form.cover_stage_layout.guestFrame.style,
  set: (value) => { form.cover_stage_layout.guestFrame.style = value as GuestFrameStyle },
})

const guestFrameCornersModel = computed<GuestFrameCorners>({
  get: () => form.cover_stage_layout.guestFrame.corners,
  set: (value) => {
    // The grid emits a partial map; re-resolving fills any corner it left out so
    // the form's copy stays fully populated for the controls bound to it.
    form.cover_stage_layout.guestFrame = resolveGuestFrame({
      guestFrame: { ...form.cover_stage_layout.guestFrame, corners: value },
    } as Required<CoverStageLayout>)
  },
})

const guestFrameStyleOptions = computed(() => [
  { value: 'split', label: t('management.partnerTemplateForm.guestFrame.styles.split'), icon: Columns3 },
  { value: 'single', label: t('management.partnerTemplateForm.guestFrame.styles.single'), icon: RectangleHorizontal },
  { value: 'corners', label: t('management.partnerTemplateForm.guestFrame.styles.corners'), icon: Frame },
])

/**
 * Whether a guest-frame slot will actually have art at render time — a file
 * picked in this session, or a saved one not staged for removal. The corner
 * board greys out sources that would draw nothing.
 */
const hasGuestFrameSlot = (
  field: 'guest_title_frame_left' | 'guest_title_frame_right',
): boolean => !!form[field] || hasSavedAsset(field)

// ---------------------------------------------------------------------------
// Free placement of the cover blocks.
//
// The preview frame is the primary editor — drag a block there and it reports
// the whole map back through `onCoverLayoutChange`. Everything below is the
// numeric half of that: the same values, typed or nudged when a pointer can't
// be precise enough at preview scale.
// ---------------------------------------------------------------------------
const selectedCoverElement = ref<CoverElementId | null>(null)

const isFreeCoverLayout = computed(() => form.cover_stage_layout.layoutMode === 'free')

/**
 * Handles only appear while the section that owns them is open. Leaving the
 * overlay armed after navigating to, say, Main Content would mean an invisible
 * sheet sitting over a preview nobody is trying to drag.
 */
const coverLayoutEditing = computed(() => activeSection.value === 'cover' && isFreeCoverLayout.value)

/**
 * The boxes as they'd render right now: whatever the template specifies, over
 * the geometry the row model would have produced. Same function the showcase
 * resolves with, so the numbers here and the ones on screen can't diverge.
 */
const resolvedCoverElements = computed(() => resolveCoverElements(form.cover_stage_layout))

const selectedCoverBox = computed<ResolvedCoverElementBox | null>(() =>
  selectedCoverElement.value ? resolvedCoverElements.value[selectedCoverElement.value] : null,
)

const layoutModeOptions = computed(() => [
  { value: 'rows', label: t('management.coverLayoutEditor.modes.rows'), icon: Rows3 },
  { value: 'free', label: t('management.coverLayoutEditor.modes.free'), icon: Move },
])

const layoutModeModel = computed<string>({
  get: () => form.cover_stage_layout.layoutMode,
  set: (value) => {
    const mode = value as CoverLayoutMode
    // Seeding on the way in is what makes the switch non-destructive: free mode
    // starts as a pixel-identical copy of the rows the partner already tuned,
    // rather than a blank canvas they have to rebuild.
    if (mode === 'free' && Object.keys(form.cover_stage_layout.coverElements ?? {}).length === 0) {
      form.cover_stage_layout.coverElements = rowsToCoverElements(form.cover_stage_layout)
    }
    form.cover_stage_layout.layoutMode = mode
    if (mode !== 'free') selectedCoverElement.value = null
  },
})

const coverBlockChips = computed(() =>
  COVER_ELEMENT_IDS.map((id) => ({
    id,
    label: t(`management.coverLayoutEditor.blocks.${id}`),
    // A hidden header row isn't on the cover, so there's nothing to place.
    available: id !== 'header' || form.cover_stage_layout.showCoverHeaderText,
  })),
)

function selectCoverElement(id: CoverElementId): void {
  selectedCoverElement.value = selectedCoverElement.value === id ? null : id
}

/**
 * Writes one block and persists all four.
 *
 * Storing the complete map rather than just the edited block matters for what
 * the template does later: a half-specified `coverElements` leaves the other
 * blocks implicitly tied to the row numbers, so editing an unrelated row height
 * months later would silently move them.
 */
function updateSelectedCoverBox(patch: Partial<CoverElementBox>): void {
  const id = selectedCoverElement.value
  if (!id) return
  const next: CoverElementBoxes = {}
  for (const key of COVER_ELEMENT_IDS) {
    next[key] =
      key === id
        ? { ...resolvedCoverElements.value[key], ...patch }
        : { ...resolvedCoverElements.value[key] }
  }
  form.cover_stage_layout.coverElements = next
}

function coverBoxModel(field: 'x' | 'y' | 'width' | 'height') {
  return computed<number>({
    get: () => selectedCoverBox.value?.[field] ?? 0,
    set: (value) => updateSelectedCoverBox({ [field]: value }),
  })
}

const coverBoxX = coverBoxModel('x')
const coverBoxY = coverBoxModel('y')
const coverBoxWidth = coverBoxModel('width')
const coverBoxHeight = coverBoxModel('height')

// Stored as a multiplier, edited as a percentage — "120%" reads as a size, "1.2"
// reads as an implementation detail.
const coverBoxFontScale = computed<number>({
  get: () => Math.round((selectedCoverBox.value?.fontScale ?? 1) * 100),
  set: (value) => updateSelectedCoverBox({ fontScale: Math.max(0.1, value / 100) }),
})

/** The logo block has no text, so none of the type controls apply to it. */
const selectedCoverBlockHasText = computed(
  () => !!selectedCoverBox.value && selectedCoverElement.value !== 'logo',
)

/**
 * `auto` is the unset state, and it is not the same as picking the slot the
 * block happens to use today: unset means "keep following whatever rule this
 * block has always followed", which for the guest name includes the Great Vibes
 * override for Latin names. Storing `undefined` keeps that rule intact;
 * storing `primary` deliberately overrides it.
 */
const COVER_SLOT_AUTO = 'auto'

const coverFontTypeOptions = computed<TemplateFormSelectOption[]>(() => [
  { value: COVER_SLOT_AUTO, label: t('management.coverLayoutEditor.fontTypes.auto') },
  ...(Object.keys(FONT_TYPE_LABELS) as TemplateFontType[]).map((slot) => ({
    value: slot,
    label: t(`management.coverLayoutEditor.fontTypes.${slot}`),
  })),
])

const coverColorSourceOptions = computed<TemplateFormSelectOption[]>(() => [
  { value: COVER_SLOT_AUTO, label: t('management.coverLayoutEditor.colorSources.auto') },
  ...(['primary', 'secondary', 'accent', 'guestname', 'custom'] as CoverElementColorSource[]).map(
    (source) => ({
      value: source,
      label: t(`management.coverLayoutEditor.colorSources.${source}`),
    }),
  ),
])

const coverBoxFontType = computed<string>({
  get: () => selectedCoverBox.value?.fontType ?? COVER_SLOT_AUTO,
  set: (value) =>
    updateSelectedCoverBox({
      fontType: value === COVER_SLOT_AUTO ? undefined : (value as TemplateFontType),
    }),
})

const coverBoxColorSource = computed<string>({
  get: () => selectedCoverBox.value?.colorSource ?? COVER_SLOT_AUTO,
  set: (value) => {
    const source = value === COVER_SLOT_AUTO ? undefined : (value as CoverElementColorSource)
    updateSelectedCoverBox({
      colorSource: source,
      // Seed the picker with something visible rather than an empty swatch the
      // partner has to notice is empty before the colour can change at all.
      ...(source === 'custom' && !selectedCoverBox.value?.customColor
        ? { customColor: '#FFFFFF' }
        : {}),
    })
  },
})

const coverBoxCustomColor = computed<string>({
  get: () => selectedCoverBox.value?.customColor ?? '#FFFFFF',
  set: (value) => updateSelectedCoverBox({ customColor: value }),
})

/**
 * Puts one block back where the row model would have put it.
 *
 * `updateSelectedCoverBox` merges the patch onto the block's *current* resolved
 * values, so the type slots need to be named with an explicit `undefined`
 * here — omitting the keys entirely (which is what the row model's own boxes
 * do, since they never had a type slot to begin with) would leave the block's
 * existing fontType/colorSource/customColor untouched instead of clearing them.
 */
function resetSelectedCoverBlock(): void {
  const id = selectedCoverElement.value
  if (!id) return
  updateSelectedCoverBox({
    ...rowsToCoverElements(form.cover_stage_layout)[id],
    fontType: undefined,
    colorSource: undefined,
    customColor: undefined,
  })
}

/**
 * Drops every hand-placed box. The template then carries no `coverElements` at
 * all, which is also what makes "reset" a real reset: the blocks go back to
 * tracking the row numbers rather than to a frozen copy of them.
 */
function resetAllCoverBlocks(): void {
  form.cover_stage_layout.coverElements = {}
  selectedCoverElement.value = null
}

/** A block was dragged or resized in the preview frame. */
function onCoverLayoutChange(elements: CoverElementBoxes): void {
  form.cover_stage_layout.coverElements = elements
}

const eventDetailsDesignModel = computed<string>({
  get: () => form.event_details_design_type,
  set: (value) => { form.event_details_design_type = value as EventDetailsDesignType },
})

const eventDetailsMarkerColorSourceModel = computed<string>({
  get: () => form.event_details_marker_color_source,
  set: (value) => { form.event_details_marker_color_source = value as EventDetailsMarkerColorSource },
})

const hostInfoDesignModel = computed<string>({
  get: () => form.host_info_design_type,
  set: (value) => { form.host_info_design_type = value as HostInfoDesignType },
})

const hostFrameStyleModel = computed<string>({
  get: () => form.host_frame_style,
  set: (value) => { form.host_frame_style = value as HostFrameStyle },
})

const hostCoupleOrnamentModel = computed<string>({
  get: () => form.host_couple_ornament,
  set: (value) => { form.host_couple_ornament = value as CoupleOrnament },
})

/**
 * The three host-info choices travel as one config object, because they are one
 * on the wire: `frame_style` and `couple_ornament` are sibling keys on
 * `host_info_design` rather than fields of their own. Shared by the save payload
 * and the live preview draft so the two can't drift.
 */
const buildHostInfoDesignPayload = (): HostInfoDesignConfig => ({
  type: form.host_info_design_type,
  frame_style: form.host_frame_style,
  couple_ornament: form.host_couple_ornament,
})

const infoCardDesignModel = computed<string>({
  get: () => form.info_card_design_type,
  set: (value) => { form.info_card_design_type = value as InfoCardDesignType },
})

const saveTheDateDesignModel = computed<string>({
  get: () => form.save_the_date_design_type,
  set: (value) => {
    form.save_the_date_design_type = value as SaveTheDateDesignType | 'auto'
  },
})

/**
 * `auto` is the absence of a choice, so it persists as `null` rather than as a
 * type — which is what makes the per-stage fallback in SaveTheDate.vue reachable
 * at all. Shared by the save payload and the live preview draft so the two can't
 * drift.
 */
const buildSaveTheDateDesignPayload = (): SaveTheDateDesignConfig | null =>
  form.save_the_date_design_type === 'auto'
    ? null
    : { type: form.save_the_date_design_type }

const fallingTypeModel = computed<string>({
  get: () => form.falling_effect.type,
  set: (value) => { form.falling_effect.type = value as FallingEffectType },
})

const fallingIntensityModel = computed<string>({
  get: () => form.falling_effect.intensity,
  set: (value) => { form.falling_effect.intensity = value as FallingEffectFormState['intensity'] },
})

const fallingColorSourceModel = computed<string>({
  get: () => form.falling_effect.color_source,
  set: (value) => { form.falling_effect.color_source = value as FallingEffectFormState['color_source'] },
})

const creatureSpeedModel = computed<string>({
  get: () => form.ambient_creatures.speed,
  set: (value) => { form.ambient_creatures.speed = value as AmbientCreaturesFormState['speed'] },
})

const creatureColorSourceModel = computed<string>({
  get: () => form.ambient_creatures.color_source,
  set: (value) => { form.ambient_creatures.color_source = value as AmbientCreaturesFormState['color_source'] },
})

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
const localFonts = ref<Array<{ language: TemplateLanguageCode; font: number; font_type: TemplateFontType }>>([])
const availableCustomFonts = ref<CustomFont[]>([])
const fontForm = reactive<{ language: TemplateLanguageCode; font: number | null; font_type: TemplateFontType }>({
  language: 'en',
  font: null,
  font_type: 'primary',
})
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
const fontTypeModel = computed<string>({
  get: () => fontForm.font_type,
  set: (value) => {
    fontForm.font_type = value as TemplateFontType
  },
})

const fontLanguageModel = computed<string | number>({
  get: () => fontForm.language,
  set: (value) => { fontForm.language = value as TemplateLanguageCode },
})

const fontIdModel = computed<string | number | null>({
  get: () => fontForm.font,
  set: (value) => { fontForm.font = Number(value) },
})

// ---------------------------------------------------------------------------
// Sections. The form used to be one long scroll of nine same-looking <details>
// accordions; it's now one section at a time, chosen from a rail. Each section
// also names the showcase stage it affects, so selecting it points the live
// preview at the thing being edited instead of leaving that to the partner.
// ---------------------------------------------------------------------------
// One entry per *stage* of the showcase rather than per kind of setting, so
// anything that only shows on one stage is edited from that stage's section with
// the preview already pointing at it. Hence no 'background' entry (the main
// content backdrop sits in 'content', beside the card it goes behind) and no
// 'effects' entry: falling particles render in the main content stage while
// ambient creatures only ever render over the cover, so a single Effects tab
// could only point the preview at one of its two halves.
// Cover artwork and cover layout are one entry, not two: both only ever change
// the cover stage, and placing a block is done by looking at the artwork it
// moves, so splitting them just meant switching tabs to see the effect.
type SectionId = 'basics' | 'brand' | 'cover' | 'transition' | 'content' | 'effects'

interface SectionDescriptor {
  id: SectionId
  icon: LucideIcon
  /**
   * Preview frame id (see resolvePreviewRenderer) this section's edits show up
   * on. A function where the answer depends on the plan — the two flows draw
   * their middle stage from different sources, so they are two different frames.
   */
  stage: string | ((standard: boolean) => string)
}

const SECTION_DESCRIPTORS: SectionDescriptor[] = [
  { id: 'basics', icon: Info, stage: 'cover' },
  { id: 'brand', icon: Palette, stage: 'cover' },
  { id: 'cover', icon: ImageIcon, stage: 'cover' },
  // The middle stage. Standard plays the template's own film (`event_video`
  // frame); basic composes the event's featured photo (`transition` frame).
  // Both plans get the tab, because the opening animation inside it is what
  // picks that stage's shape on either one — only the film upload is
  // standard-only, and it gates itself inside the section.
  { id: 'transition', icon: Clapperboard, stage: (standard) => (standard ? 'event_video' : 'transition') },
  { id: 'content', icon: AlignLeft, stage: 'main' },
  // Last, and pointed at the cover: the effects sit on top of both stages, and
  // two of the three (creatures, sparks) show there. The preview's own stage
  // tabs still move it to main for the falling particles.
  { id: 'effects', icon: Wand2, stage: 'cover' },
]

const activeSection = ref<SectionId>('basics')

const COVER_ASSET_FIELDS: PartnerTemplateAssetField[] = [
  'basic_decoration_photo',
  'standard_cover_video',
  'cover_top_decoration',
  'cover_bottom_decoration',
  'cover_left_decoration',
  'cover_right_decoration',
  'guest_title_frame_left',
  'guest_title_frame_mid',
  'guest_title_frame_right',
  'sample_logo_1',
  'sample_logo_2',
  'header_text_image',
]

const TRANSITION_ASSET_FIELDS: PartnerTemplateAssetField[] = ['standard_transition_video']

const BACKGROUND_ASSET_FIELDS: PartnerTemplateAssetField[] = [
  'basic_background_photo',
  'standard_background_video',
  'top_decoration',
  'bottom_decoration',
  'left_decoration',
  'right_decoration',
]

/** An asset counts as present whether it was just picked or is already saved. */
function countAssets(fields: PartnerTemplateAssetField[]): number {
  return fields.filter((field) => form[field] instanceof File || !!props.existingTemplate?.[field]).length
}

/** Fixed for every section but the middle stage, whose frame follows the plan. */
function resolveStage(section: SectionDescriptor): string {
  return typeof section.stage === 'function' ? section.stage(isStandardPlan.value) : section.stage
}

const sections = computed(() =>
  SECTION_DESCRIPTORS.map((section) => {
    let badge = ''
    let badgeWarn = false
    switch (section.id) {
      case 'basics':
        if (!canSave.value) {
          badge = '!'
          badgeWarn = true
        }
        break
      case 'brand': {
        const count = pendingColors.value.length + pendingFonts.value.length
        if (count) badge = String(count)
        break
      }
      // A stage's badge counts the assets configured on that stage. The effect
      // toggles used to be added in here because the effects lived in these two
      // tabs; they are counted in their own tab now, so adding them here as well
      // would report the same switch twice in the rail.
      case 'cover': {
        const count = countAssets(COVER_ASSET_FIELDS)
        if (count) badge = String(count)
        break
      }
      case 'transition': {
        // Only the film is countable, and only standard plans have one. A
        // template demoted to basic keeps the uploaded file on the server, so
        // count it only where the tab actually offers the slot.
        const count = isStandardPlan.value ? countAssets(TRANSITION_ASSET_FIELDS) : 0
        if (count) badge = String(count)
        break
      }
      case 'content': {
        const count = countAssets(BACKGROUND_ASSET_FIELDS)
        if (count) badge = String(count)
        break
      }
      case 'effects': {
        const count =
          Number(form.ambient_creatures_enabled) +
          Number(form.falling_effect_enabled) +
          Number(form.sparks_enabled)
        if (count) badge = String(count)
        break
      }
    }
    return {
      ...section,
      stage: resolveStage(section),
      label: t(`management.partnerTemplateForm.sections.${section.id}.label`),
      description: t(`management.partnerTemplateForm.sections.${section.id}.description`),
      badge,
      badgeWarn,
    }
  }),
)

const activeSectionMeta = computed(
  () => sections.value.find((section) => section.id === activeSection.value) ?? sections.value[0],
)

/**
 * Two-way with the preview: the section drives which stage is shown, but the
 * preview's own stage tabs still work — clicking one writes back here, so a
 * later section pick is what re-points it rather than the tab click being undone.
 */
const previewStage = ref<string>('cover')

/**
 * The only way to change section. Deliberately not a `watch(activeSection)`:
 * picking a section has to re-point the preview even when that section is
 * already open. Otherwise, after moving the preview to another stage with its
 * own tabs, clicking the section you were already on — the obvious way to get
 * back — did nothing at all, because `activeSection` never changed.
 */
function selectSection(id: SectionId): void {
  activeSection.value = id
  const descriptor = SECTION_DESCRIPTORS.find((entry) => entry.id === id)
  if (descriptor) previewStage.value = resolveStage(descriptor)
}

/**
 * Every section shows on both plans, so a plan switch can no longer take the
 * open one away — but it can move the middle stage's preview frame under it, and
 * the preview would otherwise sit on a frame the new plan doesn't render.
 */
watch(isStandardPlan, () => {
  if (activeSection.value === 'transition') selectSection('transition')
})

// --- Colors handlers ---
async function fetchColors(): Promise<void> {
  if (!props.existingTemplate) return
  try {
    const res = await partnerTemplateService.listColors(props.existingTemplate.id)
    if (res.success && res.data) {
      const data = res.data as unknown
      // Handle both paginated { results: [...] } and plain array responses
      if (Array.isArray(data)) {
        colors.value = data
      } else if (data && typeof data === 'object' && 'results' in data) {
        colors.value = (data as { results: EventTemplateColor[] }).results
      }
    } else {
      console.warn('[PartnerTemplateForm] Failed to fetch colors:', res.message)
    }
  } catch (err) {
    console.error('[PartnerTemplateForm] Error fetching colors:', err)
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
  if (isEditing.value && props.existingTemplate) {
    colorSaving.value = true
    try {
      let res
      if (editingColorId.value) {
        res = await partnerTemplateService.updateColor(props.existingTemplate.id, editingColorId.value, {
          hex_color_code: colorForm.hex_color_code,
          name: colorForm.name,
        })
      } else {
        res = await partnerTemplateService.createColor(props.existingTemplate.id, {
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
  if (!props.existingTemplate) return
  try {
    const res = await partnerTemplateService.deleteColor(props.existingTemplate.id, colorId)
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
  if (!props.existingTemplate) return
  try {
    // Re-fetch full template to get expanded font objects
    const res = await partnerTemplateService.getTemplate(props.existingTemplate.id)
    if (res.success && res.data) {
      fonts.value = res.data.template_fonts ?? []
    } else {
      console.warn('[PartnerTemplateForm] Failed to fetch template for fonts:', res.message)
    }
  } catch (err) {
    console.error('[PartnerTemplateForm] Error fetching fonts:', err)
  }
}

async function fetchCustomFonts(): Promise<void> {
  if (availableCustomFonts.value.length > 0) return
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

// Helper functions to display font information
function getFontLanguageDisplay(language: string | TemplateLanguageCode): string {
  return LANGUAGE_CODE_LABELS[language as TemplateLanguageCode] || language
}

function getFontNameDisplay(fontId: number | { id: number; name: string } | null): string {
  if (!fontId) return t('management.partnerTemplateForm.fonts.unknownFont')
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
}

function cancelEditFont(): void {
  editingFontId.value = null
  fontForm.language = 'en'
  fontForm.font = null
  fontForm.font_type = 'primary'
}

// Add or update font (handles both editing mode with API and creation mode with local state)
async function handleAddOrUpdateFont(): Promise<void> {
  if (!fontForm.font || !fontForm.language || !fontForm.font_type) return

  // If editing an existing template, save to API
  if (isEditing.value && props.existingTemplate) {
    fontSaving.value = true
    try {
      let res
      if (editingFontId.value) {
        res = await partnerTemplateService.updateFont(props.existingTemplate.id, editingFontId.value, {
          language: fontForm.language,
          font: fontForm.font,
          font_type: fontForm.font_type,
        })
      } else {
        res = await partnerTemplateService.createFont(props.existingTemplate.id, {
          language: fontForm.language,
          font: fontForm.font,
          font_type: fontForm.font_type,
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
    })
    cancelEditFont()
  }
}

function removePendingFont(index: number): void {
  localFonts.value.splice(index, 1)
}

async function handleDeleteFont(fontId: number): Promise<void> {
  if (!props.existingTemplate) return
  try {
    const res = await partnerTemplateService.deleteFont(props.existingTemplate.id, fontId)
    if (res.success) {
      await fetchFonts()
    } else {
      error.value = res.message || t('management.partnerTemplateForm.errors.fontDeleteFailed')
    }
  } catch {
    error.value = t('management.partnerTemplateForm.errors.fontDeleteConnection')
  }
}

// Reset form when template changes
watch(
  () => props.existingTemplate,
  (template) => {
    Object.assign(form, defaultForm())
    previewImagePreview.value = null
    bgPhotoPreview.value = null
    fallingEffectCustomImagePreview.value = null
    sparkCustomImagePreview.value = null
    // Staged removals belong to the template they were staged against.
    clearedAssets.value = new Set()
    error.value = null
    if (template) {
      form.name = template.name
      form.package_plan_id = template.package_plan?.id ?? null
      form.youtube_preview_url = template.youtube_preview_url || ''
      form.display_liquid_glass_background = template.display_liquid_glass_background
      // Merge existing cover_stage_layout with defaults
      if (template.cover_stage_layout) {
        Object.assign(form.cover_stage_layout, template.cover_stage_layout)
        // Re-resolve after the assign: a stored `guestFrame` is free to carry
        // only the keys the partner changed (and templates saved before this
        // feature carry none at all), and Object.assign would drop the rest of
        // the object wholesale rather than merging into it.
        form.cover_stage_layout.guestFrame = resolveGuestFrame(
          template.cover_stage_layout as Required<CoverStageLayout>,
        )
        // Same reason as guestFrame above: a stored `coverGilding` may name only
        // `enabled`, and every control below binds straight to a resolved field.
        form.cover_stage_layout.coverGilding = resolveCoverGilding(
          template.cover_stage_layout as Required<CoverStageLayout>,
        )
      }
      // Hydrate falling effect
      if (template.falling_effect) {
        form.falling_effect_enabled = true
        form.falling_effect.type = template.falling_effect.type
        form.falling_effect.color_source = template.falling_effect.color_source ?? 'primary'
        form.falling_effect.custom_color = template.falling_effect.custom_color ?? '#FFD700'
        form.falling_effect.intensity = template.falling_effect.intensity ?? 'normal'
        // Absent on every template saved before the field existed, which
        // resolves to the original speed — so loading one and saving it back
        // can't silently retime its effect.
        form.falling_effect.speed = resolveFallingSpeed(template.falling_effect.speed)
      } else {
        form.falling_effect_enabled = false
      }
      // Hydrate event details design (panel | calendar) + calendar marker colour
      form.event_details_design_type = template.event_details_design?.type ?? 'panel'
      form.event_details_marker_color_source =
        template.event_details_design?.marker_color_source ?? 'accent'
      form.event_details_marker_custom_color =
        template.event_details_design?.marker_custom_color ?? '#B3261E'
      // Hydrate host info design (standard | simple)
      form.host_info_design_type = template.host_info_design?.type ?? 'standard'
      // Sibling keys on the same config. Absent means the template predates
      // frames, which is exactly 'none' - the look it already has.
      form.host_frame_style = template.host_info_design?.frame_style ?? 'none'
      form.host_couple_ornament = template.host_info_design?.couple_ornament ?? 'none'
      // Hydrate info card design (glass | engraved)
      form.info_card_design_type = template.info_card_design?.type ?? 'glass'
      // Hydrate the Save the Date design. No stored value means 'auto' — each
      // transition stage keeps its own default — which is what every template
      // saved before this field existed has.
      form.save_the_date_design_type = template.save_the_date_design?.type ?? 'auto'
      // Hydrate ambient creatures
      if (template.ambient_creatures) {
        form.ambient_creatures_enabled = true
        const ac = template.ambient_creatures
        form.ambient_creatures.creatures = ac.creatures.length > 0
          ? ac.creatures.map((c) => ({
              type: c.type,
              weight: c.weight ?? 1,
              min_size: c.min_size ?? null,
              max_size: c.max_size ?? null,
            }))
          : [{ type: 'butterfly', weight: 1 }]
        form.ambient_creatures.count = ac.count ?? 6
        form.ambient_creatures.speed = ac.speed ?? 'normal'
        form.ambient_creatures.color_source = ac.color_source ?? 'accent'
        form.ambient_creatures.custom_color = ac.custom_color ?? '#FFD700'
      } else {
        form.ambient_creatures_enabled = false
      }
      // Hydrate the spark field. A template saved before sparks were split out
      // of the gilding has no `sparks` block, so it's seeded from the legacy
      // gilding fields instead — the same fallback the renderer applies. That
      // way opening such a template shows what it actually renders, and saving
      // it writes those values forward rather than silently resetting them.
      if (template.sparks) {
        const sp = template.sparks
        form.sparks_enabled = sp.enabled ?? true
        form.sparks.count = sp.count ?? SPARK_FIELD_DEFAULTS.count
        form.sparks.blink_speed = resolveSparkBlinkSpeed(sp.blink_speed)
        form.sparks.min_size = sp.min_size ?? SPARK_SIZE_DEFAULTS.min
        form.sparks.max_size = sp.max_size ?? SPARK_SIZE_DEFAULTS.max
        form.sparks.shape = sp.shape ?? 'glow'
        form.sparks.color_source = sp.color_source ?? 'accent'
        form.sparks.custom_color = sp.custom_color ?? '#E0B269'
        form.sparks.intensity = sp.intensity ?? 'normal'
      } else {
        const gilding = form.cover_stage_layout.coverGilding
        form.sparks_enabled = gilding.enabled && gilding.sparkCount > 0
        form.sparks.count = gilding.sparkCount
        form.sparks.color_source = gilding.colorSource
        form.sparks.custom_color = gilding.customColor ?? '#E0B269'
        form.sparks.intensity = gilding.intensity
      }
      // Load colors and fonts from existing template
      colors.value = template.template_colors ?? []
      fonts.value = template.template_fonts ?? []
      localColors.value = []
      localFonts.value = []
    } else {
      colors.value = []
      fonts.value = []
      localColors.value = []
      localFonts.value = []
    }
  },
  { immediate: true },
)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      mobilePane.value = 'edit'
      activeSection.value = 'basics'
      previewStage.value = 'cover'
      fetchPlans()
      fetchCustomFonts()
      clearedAssets.value = new Set()
      if (!props.existingTemplate) {
        Object.assign(form, defaultForm())
        previewImagePreview.value = null
        bgPhotoPreview.value = null
        error.value = null
        colors.value = []
        fonts.value = []
        localColors.value = []
        localFonts.value = []
      } else {
        // If opening in edit mode, fetch the latest colors and fonts
        fetchColors()
        fetchFonts()
      }
    }
    if (!open) {
      error.value = null
      cancelEditColor()
      cancelEditFont()
    }
  },
)

function handleFileChange(field: keyof FormState, event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  ;(form[field] as File | null) = file
  // Picking again takes back a pending removal of the same field.
  unmarkAssetCleared(field as ClearableAssetField)
  if (field === 'preview_image') {
    previewImagePreview.value = URL.createObjectURL(file)
  }
  if (field === 'basic_background_photo') {
    bgPhotoPreview.value = URL.createObjectURL(file)
  }
  if (field === 'falling_effect_custom_image') {
    fallingEffectCustomImagePreview.value = URL.createObjectURL(file)
    form.clear_falling_effect_custom_image = false
  }
  if (field === 'spark_custom_image') {
    sparkCustomImagePreview.value = URL.createObjectURL(file)
    form.clear_spark_custom_image = false
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
 *
 * The falling effect's particle image is deliberately not routed through here —
 * it has its own preview thumbnail and its own clear flag on the payload
 * (`falling_effect_custom_image: ''`), which predates this.
 */
function clearAssetField(field: ClearableAssetField): void {
  if (form[field] instanceof File) {
    ;(form[field] as File | null) = null
    if (field === 'preview_image') {
      if (previewImagePreview.value) URL.revokeObjectURL(previewImagePreview.value)
      previewImagePreview.value = null
    }
    if (field === 'basic_background_photo') {
      if (bgPhotoPreview.value) URL.revokeObjectURL(bgPhotoPreview.value)
      bgPhotoPreview.value = null
    }
    return
  }
  if (props.existingTemplate?.[field]) {
    clearedAssets.value = new Set(clearedAssets.value).add(field)
  }
}

function unmarkAssetCleared(field: ClearableAssetField): void {
  if (!clearedAssets.value.has(field)) return
  const next = new Set(clearedAssets.value)
  next.delete(field)
  clearedAssets.value = next
}

function clearFallingEffectCustomImage(): void {
  form.falling_effect_custom_image = null
  fallingEffectCustomImagePreview.value = null
  form.clear_falling_effect_custom_image = true
}

function buildFallingEffectPayload(): FallingEffectConfig | null {
  if (!form.falling_effect_enabled) return null
  const cfg: FallingEffectConfig = {
    type: form.falling_effect.type,
    color_source: form.falling_effect.color_source,
    intensity: form.falling_effect.intensity,
    speed: resolveFallingSpeed(form.falling_effect.speed),
  }
  if (form.falling_effect.color_source === 'custom') {
    cfg.custom_color = form.falling_effect.custom_color
  }
  return cfg
}

function clearSparkCustomImage(): void {
  form.spark_custom_image = null
  sparkCustomImagePreview.value = null
  form.clear_spark_custom_image = true
}

/**
 * Always sends a block — including a disabled one, as `{ enabled: false }`
 * rather than `null`.
 *
 * `null` would mean "no standalone config", which the renderer reads as the
 * legacy instruction to fall back to the gilding's spark fields. For a template
 * that already has band lighting on, that would turn the sparks the partner just
 * switched off straight back on. An explicit `enabled: false` is the only way to
 * say off and be believed. The rest of the settings ride along so toggling the
 * effect back on restores what was there rather than a fresh default.
 */
function buildSparksPayload(): SparkFieldConfig {
  const size = normalizedSparkSizes()
  return {
    enabled: form.sparks_enabled,
    count: form.sparks.count,
    blink_speed: resolveSparkBlinkSpeed(form.sparks.blink_speed),
    min_size: size.min,
    max_size: size.max,
    shape: form.sparks.shape,
    color_source: form.sparks.color_source,
    custom_color: form.sparks.color_source === 'custom' ? form.sparks.custom_color : null,
    intensity: form.sparks.intensity,
  }
}

/**
 * Min/max the right way round. The two are separate number inputs, so a partner
 * mid-edit can legitimately have them inverted for a keystroke; swapping beats
 * both rejecting the save and storing a range the renderer will discard.
 */
function normalizedSparkSizes(): { min: number; max: number } {
  const a = form.sparks.min_size
  const b = form.sparks.max_size
  return a <= b ? { min: a, max: b } : { min: b, max: a }
}

// The marker colour only drives the calendar design, so the panel design sends
// just its type — nothing stale to interpret if the template switches back.
function buildEventDetailsDesignPayload(): EventDetailsDesignConfig {
  const cfg: EventDetailsDesignConfig = { type: form.event_details_design_type }
  if (form.event_details_design_type === 'panel') return cfg

  cfg.marker_color_source = form.event_details_marker_color_source
  if (form.event_details_marker_color_source === 'custom') {
    cfg.marker_custom_color = form.event_details_marker_custom_color
  }
  return cfg
}

function buildAmbientCreaturesPayload(): AmbientCreaturesConfig | null {
  if (!form.ambient_creatures_enabled) return null
  const creatures: AmbientCreatureEntry[] = form.ambient_creatures.creatures.map((c: AmbientCreatureEntry) => {
    const entry: AmbientCreatureEntry = { type: c.type, weight: c.weight ?? 1 }
    if (c.min_size != null) entry.min_size = c.min_size
    if (c.max_size != null) entry.max_size = c.max_size
    return entry
  })
  const cfg: AmbientCreaturesConfig = {
    creatures,
    count: form.ambient_creatures.count,
    speed: form.ambient_creatures.speed,
    color_source: form.ambient_creatures.color_source,
  }
  if (form.ambient_creatures.color_source === 'custom') {
    cfg.custom_color = form.ambient_creatures.custom_color
  }
  return cfg
}

async function handleSave(): Promise<void> {
  if (!canSave.value || !form.package_plan_id) return
  saving.value = true
  error.value = null

  try {
    const payload: PartnerTemplateCreatePayload = {
      name: form.name,
      package_plan_id: form.package_plan_id,
      youtube_preview_url: form.youtube_preview_url || undefined,
      display_liquid_glass_background: form.display_liquid_glass_background,
      cover_stage_layout: form.cover_stage_layout,
      falling_effect: buildFallingEffectPayload(),
      ambient_creatures: buildAmbientCreaturesPayload(),
      sparks: buildSparksPayload(),
      event_details_design: buildEventDetailsDesignPayload(),
      host_info_design: buildHostInfoDesignPayload(),
      info_card_design: { type: form.info_card_design_type },
      save_the_date_design: buildSaveTheDateDesignPayload(),
    }

    // Add file fields that have been set. The asset list is shared with the
    // live preview (see partnerTemplateAssets.ts) so the two can't drift;
    // `preview_image` is the gallery thumbnail, which no stage renders and the
    // preview therefore doesn't carry.
    //
    // An empty string is the delete instruction, matching the convention
    // `falling_effect_custom_image` already used. Untouched fields are simply
    // absent, which is what leaves the saved file alone — so "no file here" and
    // "remove the file that is here" stay distinguishable on the wire.
    const fileFields = ['preview_image', ...PARTNER_TEMPLATE_ASSET_FIELDS] as const
    for (const field of fileFields) {
      const file = form[field]
      if (file instanceof File) {
        ;(payload as unknown as Record<string, unknown>)[field] = file
      } else if (clearedAssets.value.has(field)) {
        ;(payload as unknown as Record<string, unknown>)[field] = ''
      }
    }

    // Falling effect custom image: upload new file, clear existing, or leave as-is
    if (form.falling_effect_custom_image instanceof File) {
      payload.falling_effect_custom_image = form.falling_effect_custom_image
    } else if (form.clear_falling_effect_custom_image) {
      payload.falling_effect_custom_image = ''
    }

    // Custom spark image: same three states as the falling effect's.
    if (form.spark_custom_image instanceof File) {
      payload.spark_custom_image = form.spark_custom_image
    } else if (form.clear_spark_custom_image) {
      payload.spark_custom_image = ''
    }

    let response
    if (isEditing.value && props.existingTemplate) {
      response = await partnerTemplateService.updateTemplate(props.existingTemplate.id, payload)
    } else {
      response = await partnerTemplateService.createTemplate(payload)
    }

    if (response.success && response.data) {
      let finalTemplate = response.data

      // If creating a new template, save pending colors and fonts
      if (!isEditing.value && (localColors.value.length > 0 || localFonts.value.length > 0)) {
        let colorErrors = 0
        let fontErrors = 0

        // Create colors
        for (const color of localColors.value) {
          try {
            const colorRes = await partnerTemplateService.createColor(finalTemplate.id, color)
            if (!colorRes.success) {
              colorErrors++
              console.warn('[PartnerTemplateForm] Failed to create color:', color.name, colorRes.message)
            }
          } catch (err) {
            colorErrors++
            console.error('[PartnerTemplateForm] Error creating color:', color.name, err)
          }
        }

        // Create fonts
        for (const font of localFonts.value) {
          try {
            const fontRes = await partnerTemplateService.createFont(finalTemplate.id, font)
            if (!fontRes.success) {
              fontErrors++
              console.warn('[PartnerTemplateForm] Failed to create font:', font.language, fontRes.message)
            }
          } catch (err) {
            fontErrors++
            console.error('[PartnerTemplateForm] Error creating font:', font.language, err)
          }
        }

        // Show warning if some colors/fonts failed
        if (colorErrors > 0 || fontErrors > 0) {
          const warnings: string[] = []
          if (colorErrors > 0) warnings.push(t('management.partnerTemplateForm.errors.colorsCount', { count: colorErrors }))
          if (fontErrors > 0) warnings.push(t('management.partnerTemplateForm.errors.fontsCount', { count: fontErrors }))
          error.value = t('management.partnerTemplateForm.errors.partialSave', {
            warnings: warnings.join(t('management.partnerTemplateForm.errors.warningsJoin')),
          })
        }

        // Re-fetch the complete template with all colors and fonts
        try {
          const completeTemplateResponse = await partnerTemplateService.getTemplate(finalTemplate.id)
          if (completeTemplateResponse.success && completeTemplateResponse.data) {
            finalTemplate = completeTemplateResponse.data
          }
        } catch (err) {
          console.error('[PartnerTemplateForm] Failed to re-fetch template:', err)
        }
      }

      emit('saved', finalTemplate)
    } else {
      error.value = response.message || t('management.partnerTemplateForm.errors.saveFailed')
    }
  } catch {
    error.value = t('management.partnerTemplateForm.errors.connectionFailed')
  } finally {
    saving.value = false
  }
}

// ---------------------------------------------------------------------------
// Live preview. The draft is handed to PartnerTemplatePreview, which converts it
// to the `TemplateAssets` shape the showcase frames already understand and
// pushes it into a real frame over the preview bridge — the same mechanism the
// manage-page studio uses to try a template on before applying it. Nothing here
// touches the backend; unsaved Files preview from blob URLs.
// ---------------------------------------------------------------------------

/** Below `lg`, the form and the preview take turns (see the header switch). */
const mobilePane = ref<string>('edit')

const paneOptions = computed((): TemplateSegmentedOption[] => [
  { value: 'edit', label: t('management.partnerTemplateForm.header.pane.edit') },
  { value: 'preview', label: t('management.partnerTemplateForm.header.pane.preview') },
])

/**
 * Fonts in the shape the showcase resolves them from. In edit mode the API
 * already returns the font file with each entry; while creating, the selection
 * is still just a custom-font id, so it's joined against the loaded custom-font
 * list here — otherwise picking a font would show nothing until the first save.
 */
const previewFonts = computed<EventTemplateLanguageFont[]>(() => {
  if (isEditing.value) return fonts.value
  return localFonts.value.flatMap((entry, index) => {
    const custom = availableCustomFonts.value.find((cf) => cf.id === entry.font)
    if (!custom) return []
    return [
      {
        // Negative ids keep these distinguishable from saved rows; nothing
        // downstream persists them.
        id: -(index + 1),
        language: entry.language,
        language_display: entry.language,
        font: { id: custom.id, name: custom.name, font_file: custom.font_file },
        font_type: entry.font_type,
        font_type_display: entry.font_type,
      },
    ]
  })
})

const previewDraft = computed<PartnerTemplateDraft>(() => {
  const files: Partial<Record<PartnerTemplateAssetField, File | null>> = {}
  for (const field of PARTNER_TEMPLATE_ASSET_FIELDS) {
    files[field] = form[field]
  }

  return {
    name: form.name,
    display_liquid_glass_background: form.display_liquid_glass_background,
    cover_stage_layout: form.cover_stage_layout,
    // Reuses the exact builders the save path uses, so the preview can't drift
    // from what actually gets persisted.
    falling_effect: buildFallingEffectPayload(),
    ambient_creatures: buildAmbientCreaturesPayload(),
    sparks: buildSparksPayload(),
    event_details_design: buildEventDetailsDesignPayload(),
    host_info_design: buildHostInfoDesignPayload(),
    info_card_design: { type: form.info_card_design_type },
    save_the_date_design: buildSaveTheDateDesignPayload(),
    colors: pendingColors.value,
    fonts: previewFonts.value,
    files,
    // A staged removal has to reach the preview too, or the frame keeps
    // rendering the saved asset and the partner can't see what they just
    // removed until after a save.
    clearedFiles: PARTNER_TEMPLATE_ASSET_FIELDS.filter((field) =>
      clearedAssets.value.has(field),
    ),
    fallingEffectCustomImage: form.falling_effect_custom_image,
    clearFallingEffectCustomImage: form.clear_falling_effect_custom_image,
    sparkCustomImage: form.spark_custom_image,
    clearSparkCustomImage: form.clear_spark_custom_image,
  }
})

onMounted(() => {
  if (props.isOpen) {
    fetchPlans()
    fetchCustomFonts()
  }
})
</script>

<style scoped>
.slide-enter-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-leave-active {
  transition: transform 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* §15 expand/collapse — grid-template-rows, never max-height */
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}
.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

/* Thin scrollbar so the modal's rounded corners stay clean */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgb(203 213 225) transparent;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(203 213 225 / 0.9);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184);
}

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active,
  .slide-enter-active,
  .slide-leave-active {
    transition: none;
  }
}
</style>
