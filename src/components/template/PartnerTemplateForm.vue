<template>
  <!-- Slide-over form panel -->
  <Transition name="slide">
    <div v-if="isOpen" class="absolute inset-0 z-10 flex flex-col bg-white overflow-hidden">
      <!-- Header -->
      <div class="flex items-center gap-3 px-4 py-4 border-b border-slate-200 flex-shrink-0">
        <button
          type="button"
          @click="emit('close')"
          class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-600 transition-colors"
          :aria-label="t('management.partnerTemplateForm.header.goBack')"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <h3 class="text-lg font-semibold text-slate-900">
          {{ isEditing ? t('management.partnerTemplateForm.header.edit') : t('management.partnerTemplateForm.header.create') }}
        </h3>
      </div>

      <!-- Form Content (scrollable) -->
      <div class="flex-1 overflow-y-auto p-4 space-y-5">
        <!-- Error Banner -->
        <div v-if="error" class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{{ error }}</span>
        </div>

        <!-- Two-column layout for basic info and preview -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <!-- Left column: Form fields (2/3 width) -->
          <div class="space-y-4 lg:col-span-2">
            <!-- Template Name -->
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">
                {{ t('management.partnerTemplateForm.fields.nameLabel') }} <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                :placeholder="t('management.partnerTemplateForm.fields.namePlaceholder')"
                maxlength="100"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
              />
            </div>

            <!-- Package Plan Selection -->
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">
                {{ t('management.partnerTemplateForm.fields.planLabel') }} <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.package_plan_id"
                class="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 bg-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
                :disabled="plansLoading"
              >
                <option :value="null" disabled>
                  {{ plansLoading ? t('management.partnerTemplateForm.fields.planLoading') : t('management.partnerTemplateForm.fields.planSelect') }}
                </option>
                <option
                  v-for="plan in availablePlans"
                  :key="plan.id"
                  :value="plan.id"
                >
                  {{ plan.category ? `${plan.category.name} - ` : '' }}{{ plan.name }} — ${{ plan.price }}
                </option>
              </select>
            </div>

            <!-- Preview URL -->
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">{{ t('management.partnerTemplateForm.fields.previewUrlLabel') }}</label>
              <input
                v-model="form.youtube_preview_url"
                type="url"
                placeholder="https://goevent.online/g/dPmdHn?lang=kh"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
              />
            </div>

            <!-- Template Colors -->
            <details :open="detailsOpenState.colors" @toggle="(e) => detailsOpenState.colors = (e.target as HTMLDetailsElement).open" class="border border-slate-200 rounded-lg overflow-hidden">
              <summary class="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 select-none flex items-center justify-between">
                <span>{{ t('management.partnerTemplateForm.colors.sectionTitle') }} ({{ pendingColors.length }})</span>
                <ChevronDown class="w-4 h-4 text-slate-400" />
              </summary>
              <div class="p-4 space-y-3 border-t border-slate-100">
                <!-- Existing/Pending colors list -->
                <div v-for="(color, index) in pendingColors" :key="isEditing ? (color as EventTemplateColor).id : index" class="flex items-center gap-2 py-1.5">
                  <span
                    class="w-6 h-6 rounded-full border border-slate-200 flex-shrink-0"
                    :style="{ backgroundColor: color.hex_color_code }"
                  />
                  <span class="text-sm text-slate-700 flex-1 truncate">
                    {{ color.name }} <span class="text-slate-400">({{ color.hex_color_code }})</span>
                  </span>
                  <button
                    v-if="isEditing"
                    type="button"
                    @click="startEditColor(color as EventTemplateColor)"
                    class="text-xs text-sky-600 hover:text-sky-700 font-medium"
                  >
                    {{ t('management.partnerTemplateForm.colors.editBtn') }}
                  </button>
                  <button
                    type="button"
                    @click="isEditing ? handleDeleteColor((color as EventTemplateColor).id) : removePendingColor(index)"
                    class="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    {{ t('management.partnerTemplateForm.colors.deleteBtn') }}
                  </button>
                </div>
                <!-- Add / Edit color form -->
                <div class="flex items-end gap-2">
                  <div class="space-y-1">
                    <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.colors.colorLabel') }}</label>
                    <input
                      v-model="colorForm.hex_color_code"
                      type="color"
                      class="w-10 h-[34px] p-0.5 border border-slate-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div class="space-y-1 flex-1">
                    <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.colors.hexLabel') }}</label>
                    <input
                      v-model="colorForm.hex_color_code"
                      type="text"
                      maxlength="7"
                      :placeholder="t('management.partnerTemplateForm.colors.hexPlaceholder')"
                      class="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                    />
                  </div>
                  <div class="space-y-1 flex-1">
                    <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.colors.nameLabel') }}</label>
                    <input
                      v-model="colorForm.name"
                      type="text"
                      maxlength="50"
                      :placeholder="t('management.partnerTemplateForm.colors.namePlaceholder')"
                      class="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                    />
                  </div>
                  <button
                    type="button"
                    @click="handleAddOrUpdateColor"
                    :disabled="colorSaving || !colorForm.hex_color_code || !colorForm.name"
                    class="px-3 py-1.5 rounded-lg text-sm font-semibold bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    <Loader2 v-if="colorSaving" class="w-3 h-3 animate-spin inline" />
                    <template v-else>{{ editingColorId ? t('management.partnerTemplateForm.colors.updateBtn') : t('management.partnerTemplateForm.colors.addBtn') }}</template>
                  </button>
                  <button
                    v-if="editingColorId"
                    type="button"
                    @click="cancelEditColor"
                    class="px-2 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    {{ t('management.partnerTemplateForm.colors.cancelBtn') }}
                  </button>
                </div>
              </div>
            </details>

            <!-- Template Fonts -->
            <details :open="detailsOpenState.fonts" @toggle="(e) => detailsOpenState.fonts = (e.target as HTMLDetailsElement).open" class="border border-slate-200 rounded-lg overflow-hidden">
              <summary class="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 select-none flex items-center justify-between">
                <span>{{ t('management.partnerTemplateForm.fonts.sectionTitle') }} ({{ pendingFonts.length }})</span>
                <ChevronDown class="w-4 h-4 text-slate-400" />
              </summary>
              <div class="p-4 space-y-3 border-t border-slate-100">
                <!-- Existing/Pending fonts list -->
                <div v-for="(f, index) in pendingFonts" :key="isEditing ? (f as EventTemplateLanguageFont).id : index" class="flex items-center gap-2 py-1.5">
                  <span class="text-sm text-slate-700 flex-1 truncate">
                    {{ getFontLanguageDisplay(f.language) }} &mdash; {{ getFontNameDisplay(isEditing ? (f as EventTemplateLanguageFont).font : f.font) }}
                    <span class="text-slate-400">({{ getFontTypeDisplay(f.font_type) }})</span>
                  </span>
                  <button
                    v-if="isEditing"
                    type="button"
                    @click="startEditFont(f as EventTemplateLanguageFont)"
                    class="text-xs text-sky-600 hover:text-sky-700 font-medium"
                  >
                    {{ t('management.partnerTemplateForm.fonts.editBtn') }}
                  </button>
                  <button
                    type="button"
                    @click="isEditing ? handleDeleteFont((f as EventTemplateLanguageFont).id) : removePendingFont(index)"
                    class="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    {{ t('management.partnerTemplateForm.fonts.deleteBtn') }}
                  </button>
                </div>
                <!-- Add / Edit font form -->
                <div class="flex items-end gap-2">
                  <div class="space-y-1 flex-1">
                    <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.fonts.languageLabel') }}</label>
                    <select
                      v-model="fontForm.language"
                      :class="selectClass"
                    >
                      <option v-for="(label, code) in LANGUAGE_CODE_LABELS" :key="code" :value="code">
                        {{ label }}
                      </option>
                    </select>
                  </div>
                  <div class="space-y-1 flex-1">
                    <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.fonts.fontLabel') }}</label>
                    <select
                      v-model="fontForm.font"
                      :class="selectClass"
                    >
                      <option :value="null" disabled>{{ availableCustomFonts.length ? t('management.partnerTemplateForm.fonts.fontSelect') : t('management.partnerTemplateForm.fonts.fontSelectLoading') }}</option>
                      <option v-for="cf in availableCustomFonts" :key="cf.id" :value="cf.id">
                        {{ cf.name }}
                      </option>
                    </select>
                  </div>
                  <div class="space-y-1 flex-1">
                    <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.fonts.typeLabel') }}</label>
                    <select
                      v-model="fontForm.font_type"
                      :class="selectClass"
                    >
                      <option v-for="(label, type) in FONT_TYPE_LABELS" :key="type" :value="type">
                        {{ label }}
                      </option>
                    </select>
                  </div>
                  <button
                    type="button"
                    @click="handleAddOrUpdateFont"
                    :disabled="fontSaving || !fontForm.font || !fontForm.language || !fontForm.font_type"
                    class="px-3 py-1.5 rounded-lg text-sm font-semibold bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    <Loader2 v-if="fontSaving" class="w-3 h-3 animate-spin inline" />
                    <template v-else>{{ editingFontId ? t('management.partnerTemplateForm.fonts.updateBtn') : t('management.partnerTemplateForm.fonts.addBtn') }}</template>
                  </button>
                  <button
                    v-if="editingFontId"
                    type="button"
                    @click="cancelEditFont"
                    class="px-2 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    {{ t('management.partnerTemplateForm.fonts.cancelBtn') }}
                  </button>
                </div>
              </div>
            </details>

            <!-- Liquid Glass Toggle -->
            <div class="flex items-center justify-between py-2 px-1">
              <div>
                <p class="text-sm font-medium text-slate-700">{{ t('management.partnerTemplateForm.fields.liquidGlass') }}</p>
                <p class="text-xs text-slate-400">{{ t('management.partnerTemplateForm.fields.liquidGlassHint') }}</p>
              </div>
              <button
                type="button"
                @click="form.display_liquid_glass_background = !form.display_liquid_glass_background"
                :class="[
                  'relative w-10 h-6 rounded-full transition-colors',
                  form.display_liquid_glass_background ? 'bg-sky-500' : 'bg-slate-300',
                ]"
                role="switch"
                :aria-checked="form.display_liquid_glass_background"
              >
                <span
                  :class="[
                    'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                    form.display_liquid_glass_background ? 'left-5' : 'left-1',
                  ]"
                />
              </button>
            </div>
          </div>

          <!-- Right column: Preview Image (1/3 width) -->
          <div class="space-y-1.5 lg:col-span-1">
            <label class="block text-sm font-medium text-slate-700">
              {{ t('management.partnerTemplateForm.fields.previewImageLabel') }}
            </label>
            <div
              class="relative border-2 border-dashed rounded-lg overflow-hidden transition-colors"
              :class="previewImagePreview || existingTemplate?.preview_image ? 'border-slate-200' : 'border-slate-300 hover:border-sky-400'"
            >
              <!-- Image preview -->
              <div v-if="previewImagePreview || existingTemplate?.preview_image" class="relative aspect-[9/16] overflow-hidden">
                <img
                  :src="previewImagePreview || existingTemplate?.preview_image || ''"
                  alt="Preview"
                  class="w-full h-full object-cover"
                />
                <div class="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label class="cursor-pointer px-2 py-1 bg-white/90 rounded text-[10px] font-medium text-slate-700">
                    {{ t('management.partnerTemplateForm.fields.previewImageChange') }}
                    <input type="file" accept="image/*" class="sr-only" @change="handleFileChange('preview_image', $event)" />
                  </label>
                </div>
              </div>
              <!-- Upload placeholder -->
              <label v-else class="flex flex-col items-center justify-center py-8 cursor-pointer">
                <Upload class="w-6 h-6 text-slate-400 mb-1" />
                <span class="text-xs font-medium text-slate-500 text-center">{{ t('management.partnerTemplateForm.fields.previewImageUpload') }}</span>
                <span class="text-[10px] text-slate-400 mt-0.5 text-center">{{ t('management.partnerTemplateForm.fields.previewImageAspect') }}</span>
                <input type="file" accept="image/*" class="sr-only" @change="handleFileChange('preview_image', $event)" />
              </label>
            </div>
          </div>
        </div>

        <!-- Background Stage (collapsible) -->
        <details v-if="form.package_plan_id" :open="detailsOpenState.backgroundStage" @toggle="(e) => detailsOpenState.backgroundStage = (e.target as HTMLDetailsElement).open" class="border border-slate-200 rounded-lg overflow-hidden">
          <summary class="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 select-none flex items-center justify-between">
            <span>{{ t('management.partnerTemplateForm.backgroundStage.sectionTitle') }}</span>
            <ChevronDown class="w-4 h-4 text-slate-400" />
          </summary>
          <div class="p-4 space-y-3 border-t border-slate-100">
            <!-- Basic: Background Photo -->
            <FileUploadField
              v-if="isBasicPlan"
              :label="t('management.partnerTemplateForm.backgroundStage.backgroundPhoto')"
              accept="image/*"
              :file-name="form.basic_background_photo?.name"
              :has-existing-file="!!existingTemplate?.basic_background_photo"
              @change="handleFileChange('basic_background_photo', $event)"
            />
            <!-- Standard: Background Video -->
            <FileUploadField
              v-if="isStandardPlan"
              :label="t('management.partnerTemplateForm.backgroundStage.backgroundVideo')"
              accept="video/*"
              :file-name="form.standard_background_video?.name"
              :has-existing-file="!!existingTemplate?.standard_background_video"
              @change="handleFileChange('standard_background_video', $event)"
            />
            <!-- Decorations (basic plan only) -->
            <div v-if="isBasicPlan" class="grid grid-cols-2 gap-3">
              <FileUploadField :label="t('management.partnerTemplateForm.backgroundStage.topDecoration')" accept="image/*" :file-name="form.top_decoration?.name" :has-existing-file="!!existingTemplate?.top_decoration" @change="handleFileChange('top_decoration', $event)" />
              <FileUploadField :label="t('management.partnerTemplateForm.backgroundStage.bottomDecoration')" accept="image/*" :file-name="form.bottom_decoration?.name" :has-existing-file="!!existingTemplate?.bottom_decoration" @change="handleFileChange('bottom_decoration', $event)" />
              <FileUploadField :label="t('management.partnerTemplateForm.backgroundStage.leftDecoration')" accept="image/*" :file-name="form.left_decoration?.name" :has-existing-file="!!existingTemplate?.left_decoration" @change="handleFileChange('left_decoration', $event)" />
              <FileUploadField :label="t('management.partnerTemplateForm.backgroundStage.rightDecoration')" accept="image/*" :file-name="form.right_decoration?.name" :has-existing-file="!!existingTemplate?.right_decoration" @change="handleFileChange('right_decoration', $event)" />
            </div>
          </div>
        </details>

        <!-- Cover Stage Decorations (collapsible) -->
        <details v-if="form.package_plan_id" :open="detailsOpenState.coverDecorations" @toggle="(e) => detailsOpenState.coverDecorations = (e.target as HTMLDetailsElement).open" class="border border-slate-200 rounded-lg overflow-hidden">
          <summary class="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 select-none flex items-center justify-between">
            <span>{{ t('management.partnerTemplateForm.coverDecorations.sectionTitle') }}</span>
            <ChevronDown class="w-4 h-4 text-slate-400" />
          </summary>
          <div class="p-4 space-y-3 border-t border-slate-100">
            <!-- Basic: Cover Background Photo -->
            <FileUploadField
              v-if="isBasicPlan"
              :label="t('management.partnerTemplateForm.coverDecorations.coverBackground')"
              accept="image/*"
              :file-name="form.basic_decoration_photo?.name"
              :has-existing-file="!!existingTemplate?.basic_decoration_photo"
              @change="handleFileChange('basic_decoration_photo', $event)"
            />
            <!-- Standard: Cover Background Video -->
            <FileUploadField
              v-if="isStandardPlan"
              :label="t('management.partnerTemplateForm.coverDecorations.coverBackground')"
              accept="video/*"
              :file-name="form.standard_cover_video?.name"
              :has-existing-file="!!existingTemplate?.standard_cover_video"
              @change="handleFileChange('standard_cover_video', $event)"
            />
            <div v-if="isBasicPlan" class="grid grid-cols-2 gap-3">
              <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.coverTop')" accept="image/*" :file-name="form.cover_top_decoration?.name" :has-existing-file="!!existingTemplate?.cover_top_decoration" @change="handleFileChange('cover_top_decoration', $event)" />
              <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.coverBottom')" accept="image/*" :file-name="form.cover_bottom_decoration?.name" :has-existing-file="!!existingTemplate?.cover_bottom_decoration" @change="handleFileChange('cover_bottom_decoration', $event)" />
              <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.coverLeft')" accept="image/*" :file-name="form.cover_left_decoration?.name" :has-existing-file="!!existingTemplate?.cover_left_decoration" @change="handleFileChange('cover_left_decoration', $event)" />
              <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.coverRight')" accept="image/*" :file-name="form.cover_right_decoration?.name" :has-existing-file="!!existingTemplate?.cover_right_decoration" @change="handleFileChange('cover_right_decoration', $event)" />
            </div>
            <div class="grid grid-cols-3 gap-3">
              <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.frameLeft')" accept="image/*" :file-name="form.guest_title_frame_left?.name" :has-existing-file="!!existingTemplate?.guest_title_frame_left" @change="handleFileChange('guest_title_frame_left', $event)" />
              <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.frameMid')" accept="image/*" :file-name="form.guest_title_frame_mid?.name" :has-existing-file="!!existingTemplate?.guest_title_frame_mid" @change="handleFileChange('guest_title_frame_mid', $event)" />
              <FileUploadField :label="t('management.partnerTemplateForm.coverDecorations.frameRight')" accept="image/*" :file-name="form.guest_title_frame_right?.name" :has-existing-file="!!existingTemplate?.guest_title_frame_right" @change="handleFileChange('guest_title_frame_right', $event)" />
            </div>
          </div>
        </details>

        <!-- Cover Stage Layout (collapsible) -->
        <details :open="detailsOpenState.coverLayout" @toggle="(e) => detailsOpenState.coverLayout = (e.target as HTMLDetailsElement).open" class="border border-slate-200 rounded-lg overflow-hidden">
          <summary class="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 select-none flex items-center justify-between">
            <span>{{ t('management.partnerTemplateForm.coverLayout.sectionTitle') }}</span>
            <ChevronDown class="w-4 h-4 text-slate-400" />
          </summary>
          <div class="p-4 space-y-4 border-t border-slate-100">
            <!-- Animation Type -->
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-600">{{ t('management.partnerTemplateForm.coverLayout.animationType') }}</label>
              <select
                v-model="form.cover_stage_layout.showcaseAnimationType"
                class="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 bg-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
              >
                <option value="decoration">{{ t('management.partnerTemplateForm.coverLayout.animationDecoration') }}</option>
                <option value="door">{{ t('management.partnerTemplateForm.coverLayout.animationDoor') }}</option>
              </select>
            </div>
            <!-- Container Positioning -->
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ t('management.partnerTemplateForm.coverLayout.containerPositioning') }}</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.coverLayout.contentTop') }}</label>
                <input v-model.number="form.cover_stage_layout.contentTopPosition" type="number" step="0.5" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.coverLayout.innerHeight') }}</label>
                <input v-model.number="form.cover_stage_layout.innerContainerHeight" type="number" step="0.5" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
            </div>
            <!-- Row Heights -->
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ t('management.partnerTemplateForm.coverLayout.rowHeights') }}</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.coverLayout.eventTitle') }}</label>
                <input v-model.number="form.cover_stage_layout.eventTitleHeight" type="number" step="0.25" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.coverLayout.logo') }}</label>
                <input v-model.number="form.cover_stage_layout.logoHeight" type="number" step="0.25" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.coverLayout.inviteText') }}</label>
                <input v-model.number="form.cover_stage_layout.inviteTextHeight" type="number" step="0.25" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.coverLayout.guestName') }}</label>
                <input v-model.number="form.cover_stage_layout.guestNameHeight" type="number" step="0.25" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
            </div>
            <!-- Guest Name Max Width -->
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.coverLayout.guestNameMaxWidthPercent') }}</label>
                <input v-model.number="form.cover_stage_layout.guestNameMaxWidthPercent" type="number" min="10" max="100" step="1" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
            </div>
            <!-- Swipe Arrow -->
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.coverLayout.swipeArrowBottom') }}</label>
                <input v-model.number="form.cover_stage_layout.swipeArrowBottom" type="number" step="0.5" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
            </div>
            <!-- Z-Indexes -->
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ t('management.partnerTemplateForm.coverLayout.zIndexes') }}</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.coverLayout.left') }}</label>
                <input v-model.number="form.cover_stage_layout.leftDecorationZIndex" type="number" step="1" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.coverLayout.right') }}</label>
                <input v-model.number="form.cover_stage_layout.rightDecorationZIndex" type="number" step="1" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.coverLayout.top') }}</label>
                <input v-model.number="form.cover_stage_layout.topDecorationZIndex" type="number" step="1" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.coverLayout.bottom') }}</label>
                <input v-model.number="form.cover_stage_layout.bottomDecorationZIndex" type="number" step="1" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
            </div>
          </div>
        </details>

        <!-- Falling Effect (collapsible) -->
        <details :open="detailsOpenState.fallingEffect" @toggle="(e) => detailsOpenState.fallingEffect = (e.target as HTMLDetailsElement).open" class="border border-slate-200 rounded-lg overflow-hidden">
          <summary class="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 select-none flex items-center justify-between">
            <span>{{ t('management.partnerTemplateForm.fallingEffect.sectionTitle') }} <span class="text-xs text-slate-400 font-normal">({{ form.falling_effect_enabled ? t('management.partnerTemplateForm.fallingEffect.enabled') : t('management.partnerTemplateForm.fallingEffect.disabled') }})</span></span>
            <ChevronDown class="w-4 h-4 text-slate-400" />
          </summary>
          <div class="p-4 space-y-4 border-t border-slate-100">
            <!-- Enable toggle -->
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-700">{{ t('management.partnerTemplateForm.fallingEffect.enableLabel') }}</p>
                <p class="text-xs text-slate-400">{{ t('management.partnerTemplateForm.fallingEffect.enableHint') }}</p>
              </div>
              <button
                type="button"
                @click="form.falling_effect_enabled = !form.falling_effect_enabled"
                :class="[
                  'relative w-10 h-6 rounded-full transition-colors',
                  form.falling_effect_enabled ? 'bg-sky-500' : 'bg-slate-300',
                ]"
                role="switch"
                :aria-checked="form.falling_effect_enabled"
              >
                <span
                  :class="[
                    'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                    form.falling_effect_enabled ? 'left-5' : 'left-1',
                  ]"
                />
              </button>
            </div>

            <div v-if="form.falling_effect_enabled" class="space-y-3">
              <!-- Particle Type -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-600">{{ t('management.partnerTemplateForm.fallingEffect.particleType') }}</label>
                <select v-model="form.falling_effect.type" :class="selectClass">
                  <option v-for="(label, value) in fallingTypeLabels" :key="value" :value="value">{{ label }}</option>
                </select>
              </div>

              <!-- Intensity -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-600">{{ t('management.partnerTemplateForm.fallingEffect.intensity') }}</label>
                <select v-model="form.falling_effect.intensity" :class="selectClass">
                  <option value="light">{{ t('management.partnerTemplateForm.fallingEffect.intensityLight') }}</option>
                  <option value="normal">{{ t('management.partnerTemplateForm.fallingEffect.intensityNormal') }}</option>
                  <option value="heavy">{{ t('management.partnerTemplateForm.fallingEffect.intensityHeavy') }}</option>
                </select>
              </div>

              <!-- Color Source -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-600">{{ t('management.partnerTemplateForm.fallingEffect.colorSource') }}</label>
                <select v-model="form.falling_effect.color_source" :class="selectClass">
                  <option value="primary">{{ t('management.partnerTemplateForm.fallingEffect.sourcePrimary') }}</option>
                  <option value="accent">{{ t('management.partnerTemplateForm.fallingEffect.sourceAccent') }}</option>
                  <option value="custom">{{ t('management.partnerTemplateForm.fallingEffect.sourceCustom') }}</option>
                </select>
              </div>

              <!-- Custom Color -->
              <div v-if="form.falling_effect.color_source === 'custom'" class="flex items-end gap-2">
                <div class="space-y-1">
                  <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.fallingEffect.pickLabel') }}</label>
                  <input
                    v-model="form.falling_effect.custom_color"
                    type="color"
                    class="w-10 h-[34px] p-0.5 border border-slate-300 rounded-lg cursor-pointer"
                  />
                </div>
                <div class="space-y-1 flex-1">
                  <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.fallingEffect.hexLabel') }}</label>
                  <input
                    v-model="form.falling_effect.custom_color"
                    type="text"
                    maxlength="7"
                    placeholder="#FFD700"
                    class="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                  />
                </div>
              </div>

              <!-- Custom Image -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-600">{{ t('management.partnerTemplateForm.fallingEffect.customImage') }}</label>
                <p class="text-[11px] text-slate-400 leading-tight">{{ t('management.partnerTemplateForm.fallingEffect.customImageHint') }}</p>
                <div v-if="fallingEffectCustomImagePreview || (existingTemplate?.falling_effect?.custom_image && !form.clear_falling_effect_custom_image)" class="flex items-center gap-3 p-2 border border-slate-200 rounded-lg">
                  <img
                    :src="fallingEffectCustomImagePreview || existingTemplate?.falling_effect?.custom_image || ''"
                    alt="Custom particle"
                    class="w-12 h-12 object-contain bg-slate-100 rounded"
                  />
                  <div class="flex-1 text-xs text-slate-600 truncate">
                    {{ form.falling_effect_custom_image?.name || t('management.partnerTemplateForm.fallingEffect.currentImage') }}
                  </div>
                  <label class="cursor-pointer text-xs font-medium text-sky-600 hover:text-sky-700">
                    {{ t('management.partnerTemplateForm.fallingEffect.replace') }}
                    <input type="file" accept="image/png,image/svg+xml" class="sr-only" @change="handleFileChange('falling_effect_custom_image', $event)" />
                  </label>
                  <button type="button" @click="clearFallingEffectCustomImage" class="text-xs font-medium text-red-500 hover:text-red-600">
                    {{ t('management.partnerTemplateForm.fallingEffect.remove') }}
                  </button>
                </div>
                <label v-else class="flex items-center justify-center gap-2 py-3 cursor-pointer border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-lg">
                  <Upload class="w-4 h-4 text-slate-400" />
                  <span class="text-xs font-medium text-slate-500">{{ t('management.partnerTemplateForm.fallingEffect.uploadCustom') }}</span>
                  <input type="file" accept="image/png,image/svg+xml" class="sr-only" @change="handleFileChange('falling_effect_custom_image', $event)" />
                </label>
              </div>
            </div>
          </div>
        </details>

        <!-- Ambient Creatures (collapsible) -->
        <details :open="detailsOpenState.ambientCreatures" @toggle="(e) => detailsOpenState.ambientCreatures = (e.target as HTMLDetailsElement).open" class="border border-slate-200 rounded-lg overflow-hidden">
          <summary class="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 select-none flex items-center justify-between">
            <span>{{ t('management.partnerTemplateForm.ambientCreatures.sectionTitle') }} <span class="text-xs text-slate-400 font-normal">({{ form.ambient_creatures_enabled ? t('management.partnerTemplateForm.ambientCreatures.enabled') : t('management.partnerTemplateForm.ambientCreatures.disabled') }})</span></span>
            <ChevronDown class="w-4 h-4 text-slate-400" />
          </summary>
          <div class="p-4 space-y-4 border-t border-slate-100">
            <!-- Enable toggle -->
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-slate-700">{{ t('management.partnerTemplateForm.ambientCreatures.enableLabel') }}</p>
                <p class="text-xs text-slate-400">{{ t('management.partnerTemplateForm.ambientCreatures.enableHint') }}</p>
              </div>
              <button
                type="button"
                @click="form.ambient_creatures_enabled = !form.ambient_creatures_enabled"
                :class="[
                  'relative w-10 h-6 rounded-full transition-colors',
                  form.ambient_creatures_enabled ? 'bg-sky-500' : 'bg-slate-300',
                ]"
                role="switch"
                :aria-checked="form.ambient_creatures_enabled"
              >
                <span
                  :class="[
                    'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                    form.ambient_creatures_enabled ? 'left-5' : 'left-1',
                  ]"
                />
              </button>
            </div>

            <div v-if="form.ambient_creatures_enabled" class="space-y-4">
              <!-- Global controls -->
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.ambientCreatures.count') }}</label>
                  <input v-model.number="form.ambient_creatures.count" type="number" min="1" max="15" step="1" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
                </div>
                <div class="space-y-1">
                  <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.ambientCreatures.speed') }}</label>
                  <select v-model="form.ambient_creatures.speed" :class="selectClass">
                    <option value="slow">{{ t('management.partnerTemplateForm.ambientCreatures.speedSlow') }}</option>
                    <option value="normal">{{ t('management.partnerTemplateForm.ambientCreatures.speedNormal') }}</option>
                    <option value="fast">{{ t('management.partnerTemplateForm.ambientCreatures.speedFast') }}</option>
                  </select>
                </div>
              </div>

              <!-- Color source -->
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-600">{{ t('management.partnerTemplateForm.ambientCreatures.colorSource') }}</label>
                <select v-model="form.ambient_creatures.color_source" :class="selectClass">
                  <option value="primary">{{ t('management.partnerTemplateForm.ambientCreatures.sourcePrimary') }}</option>
                  <option value="accent">{{ t('management.partnerTemplateForm.ambientCreatures.sourceAccent') }}</option>
                  <option value="custom">{{ t('management.partnerTemplateForm.ambientCreatures.sourceCustom') }}</option>
                </select>
              </div>

              <div v-if="form.ambient_creatures.color_source === 'custom'" class="flex items-end gap-2">
                <div class="space-y-1">
                  <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.ambientCreatures.pickLabel') }}</label>
                  <input
                    v-model="form.ambient_creatures.custom_color"
                    type="color"
                    class="w-10 h-[34px] p-0.5 border border-slate-300 rounded-lg cursor-pointer"
                  />
                </div>
                <div class="space-y-1 flex-1">
                  <label class="block text-xs text-slate-500">{{ t('management.partnerTemplateForm.ambientCreatures.hexLabel') }}</label>
                  <input
                    v-model="form.ambient_creatures.custom_color"
                    type="text"
                    maxlength="7"
                    placeholder="#FFD700"
                    class="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                  />
                </div>
              </div>

              <!-- Creature entries -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-medium text-slate-600">{{ t('management.partnerTemplateForm.ambientCreatures.creaturesLabel') }} ({{ form.ambient_creatures.creatures.length }}/4)</label>
                  <button
                    type="button"
                    @click="addCreatureEntry"
                    :disabled="form.ambient_creatures.creatures.length >= 4 || availableCreatureTypes.length === 0"
                    class="text-xs font-semibold text-sky-600 hover:text-sky-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {{ t('management.partnerTemplateForm.ambientCreatures.addCreature') }}
                  </button>
                </div>

                <div
                  v-for="(entry, index) in form.ambient_creatures.creatures"
                  :key="index"
                  class="p-3 border border-slate-200 rounded-lg space-y-2 bg-slate-50/50"
                >
                  <div class="grid grid-cols-2 gap-2">
                    <div class="space-y-1">
                      <label class="block text-[11px] text-slate-500">{{ t('management.partnerTemplateForm.ambientCreatures.typeLabel') }}</label>
                      <select v-model="entry.type" :class="selectClass">
                        <option v-for="ct in creatureTypeOptionsFor(index)" :key="ct" :value="ct">{{ creatureTypeLabels[ct] }}</option>
                      </select>
                    </div>
                    <div class="space-y-1">
                      <label class="block text-[11px] text-slate-500">{{ t('management.partnerTemplateForm.ambientCreatures.weightLabel') }}</label>
                      <input v-model.number="entry.weight" type="number" min="1" max="10" step="1" class="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
                    </div>
                    <div class="space-y-1">
                      <label class="block text-[11px] text-slate-500">{{ t('management.partnerTemplateForm.ambientCreatures.minSize') }}</label>
                      <input v-model.number="entry.min_size" type="number" min="4" max="200" step="1" :placeholder="t('management.partnerTemplateForm.ambientCreatures.sizeAuto')" class="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
                    </div>
                    <div class="space-y-1">
                      <label class="block text-[11px] text-slate-500">{{ t('management.partnerTemplateForm.ambientCreatures.maxSize') }}</label>
                      <input v-model.number="entry.max_size" type="number" min="4" max="200" step="1" :placeholder="t('management.partnerTemplateForm.ambientCreatures.sizeAuto')" class="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
                    </div>
                  </div>
                  <button
                    v-if="form.ambient_creatures.creatures.length > 1"
                    type="button"
                    @click="removeCreatureEntry(index)"
                    class="text-xs font-medium text-red-500 hover:text-red-600"
                  >
                    {{ t('management.partnerTemplateForm.ambientCreatures.removeBtn') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>

      <!-- Footer Actions -->
      <div class="flex-shrink-0 px-4 py-3 border-t border-slate-200 bg-white flex items-center gap-3">
        <button
          type="button"
          @click="emit('close')"
          class="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {{ t('management.partnerTemplateForm.footer.cancel') }}
        </button>
        <button
          type="button"
          @click="handleSave"
          :disabled="saving || !form.name.trim() || !form.package_plan_id"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white hover:from-[#27ae60] hover:to-[#1873cc] disabled:opacity-60 transition-all"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          {{ saving ? t('management.partnerTemplateForm.footer.saving') : (isEditing ? t('management.partnerTemplateForm.footer.saveChanges') : t('management.partnerTemplateForm.footer.createTemplate')) }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Upload, AlertCircle, Loader2, ChevronDown } from 'lucide-vue-next'
import { partnerTemplateService, packagePlanService, customFontsService, FONT_TYPE_LABELS, LANGUAGE_CODE_LABELS } from '../../services/api'
import type {
  PartnerTemplate,
  PartnerTemplateCreatePayload,
  PackagePlan,
  CoverStageLayout,
  EventTemplateColor,
  EventTemplateLanguageFont,
  CustomFont,
  TemplateFontType,
  TemplateLanguageCode,
  FallingEffectConfig,
  FallingEffectType,
  AmbientCreaturesConfig,
  AmbientCreatureEntry,
  AmbientCreatureEffectType,
} from '../../services/api'
import PartnerTemplateFileField from './PartnerTemplateFileField.vue'

const { t } = useI18n()

// Alias for cleaner template usage
const FileUploadField = PartnerTemplateFileField

// Shared select styling matching the header selects (custom arrow, proper spacing)
const selectClass = "w-full px-2 py-1.5 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 bg-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"

interface Props {
  isOpen: boolean
  existingTemplate?: PartnerTemplate | null
}

const props = withDefaults(defineProps<Props>(), { existingTemplate: null })

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
const defaultCoverStageLayout = (): CoverStageLayout => ({
  contentTopPosition: 23.5,
  innerContainerHeight: 53,
  eventTitleHeight: 18.75,
  logoHeight: 48,
  inviteTextHeight: 8.75,
  guestNameHeight: 16,
  guestNameMaxWidthPercent: 60,
  swipeArrowBottom: 5,
  leftDecorationZIndex: 24,
  rightDecorationZIndex: 24,
  topDecorationZIndex: 25,
  bottomDecorationZIndex: 25,
  showcaseAnimationType: 'decoration',
})

interface FallingEffectFormState {
  type: FallingEffectType
  color_source: 'primary' | 'accent' | 'custom'
  custom_color: string
  intensity: 'light' | 'normal' | 'heavy'
}

interface AmbientCreaturesFormState {
  creatures: AmbientCreatureEntry[]
  count: number
  speed: 'slow' | 'normal' | 'fast'
  color_source: 'primary' | 'accent' | 'custom'
  custom_color: string
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
  cover_stage_layout: CoverStageLayout
  falling_effect_enabled: boolean
  falling_effect: FallingEffectFormState
  falling_effect_custom_image: File | null
  clear_falling_effect_custom_image: boolean
  ambient_creatures_enabled: boolean
  ambient_creatures: AmbientCreaturesFormState
}

const defaultFallingEffect = (): FallingEffectFormState => ({
  type: 'petals',
  color_source: 'primary',
  custom_color: '#FFD700',
  intensity: 'normal',
})

const defaultAmbientCreatures = (): AmbientCreaturesFormState => ({
  creatures: [{ type: 'butterfly', weight: 1 }],
  count: 6,
  speed: 'normal',
  color_source: 'accent',
  custom_color: '#FFD700',
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
  cover_stage_layout: defaultCoverStageLayout(),
  falling_effect_enabled: false,
  falling_effect: defaultFallingEffect(),
  falling_effect_custom_image: null,
  clear_falling_effect_custom_image: false,
  ambient_creatures_enabled: false,
  ambient_creatures: defaultAmbientCreatures(),
})

const CREATURE_TYPES: AmbientCreatureEffectType[] = ['butterfly', 'dove', 'firefly', 'dragonfly']
const creatureTypeLabels = computed<Record<AmbientCreatureEffectType, string>>(() => ({
  butterfly: t('management.partnerTemplateForm.ambientCreatures.types.butterfly'),
  dove: t('management.partnerTemplateForm.ambientCreatures.types.dove'),
  firefly: t('management.partnerTemplateForm.ambientCreatures.types.firefly'),
  dragonfly: t('management.partnerTemplateForm.ambientCreatures.types.dragonfly'),
}))
const fallingTypeLabels = computed<Record<FallingEffectType, string>>(() => ({
  petals: t('management.partnerTemplateForm.fallingEffect.types.petals'),
  confetti: t('management.partnerTemplateForm.fallingEffect.types.confetti'),
  snowflakes: t('management.partnerTemplateForm.fallingEffect.types.snowflakes'),
  stars: t('management.partnerTemplateForm.fallingEffect.types.stars'),
  leaves: t('management.partnerTemplateForm.fallingEffect.types.leaves'),
  none: t('management.partnerTemplateForm.fallingEffect.types.none'),
}))

const form = reactive<FormState>(defaultForm())
const previewImagePreview = ref<string | null>(null)
const bgPhotoPreview = ref<string | null>(null)
const fallingEffectCustomImagePreview = ref<string | null>(null)
const saving = ref(false)
const error = ref<string | null>(null)

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
function creatureTypeOptionsFor(index: number): AmbientCreatureEffectType[] {
  const current = form.ambient_creatures.creatures[index]?.type
  const used = new Set(form.ambient_creatures.creatures.map((c: AmbientCreatureEntry) => c.type))
  return CREATURE_TYPES.filter((t) => !used.has(t) || t === current)
}

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

// Track open state of details elements
const detailsOpenState = reactive({
  colors: false,
  fonts: false,
  backgroundStage: true,  // Open by default
  coverDecorations: false,
  coverLayout: false,
  fallingEffect: false,
  ambientCreatures: false,
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
  if (!fontId) return 'Unknown font'
  if (typeof fontId === 'object' && 'name' in fontId) return fontId.name
  const font = availableCustomFonts.value.find(f => f.id === fontId)
  return font?.name || 'Unknown font'
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
    error.value = null
    if (template) {
      form.name = template.name
      form.package_plan_id = template.package_plan?.id ?? null
      form.youtube_preview_url = template.youtube_preview_url || ''
      form.display_liquid_glass_background = template.display_liquid_glass_background
      // Merge existing cover_stage_layout with defaults
      if (template.cover_stage_layout) {
        Object.assign(form.cover_stage_layout, template.cover_stage_layout)
      }
      // Hydrate falling effect
      if (template.falling_effect) {
        form.falling_effect_enabled = true
        form.falling_effect.type = template.falling_effect.type
        form.falling_effect.color_source = template.falling_effect.color_source ?? 'primary'
        form.falling_effect.custom_color = template.falling_effect.custom_color ?? '#FFD700'
        form.falling_effect.intensity = template.falling_effect.intensity ?? 'normal'
      } else {
        form.falling_effect_enabled = false
      }
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
      fetchPlans()
      fetchCustomFonts()
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
  }
  if (form.falling_effect.color_source === 'custom') {
    cfg.custom_color = form.falling_effect.custom_color
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
  if (!form.name.trim() || !form.package_plan_id) return
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
    }

    // Add file fields that have been set
    const fileFields = [
      'preview_image', 'basic_background_photo', 'basic_decoration_photo',
      'standard_background_video', 'standard_cover_video',
      'top_decoration', 'bottom_decoration', 'left_decoration', 'right_decoration',
      'cover_top_decoration', 'cover_bottom_decoration', 'cover_left_decoration', 'cover_right_decoration',
      'guest_title_frame_left', 'guest_title_frame_mid', 'guest_title_frame_right',
    ] as const
    for (const field of fileFields) {
      const file = form[field]
      if (file instanceof File) {
        ;(payload as unknown as Record<string, unknown>)[field] = file
      }
    }

    // Falling effect custom image: upload new file, clear existing, or leave as-is
    if (form.falling_effect_custom_image instanceof File) {
      payload.falling_effect_custom_image = form.falling_effect_custom_image
    } else if (form.clear_falling_effect_custom_image) {
      payload.falling_effect_custom_image = ''
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

onMounted(() => {
  if (props.isOpen) {
    fetchPlans()
    fetchCustomFonts()
  }
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

details > summary::-webkit-details-marker {
  display: none;
}
</style>
