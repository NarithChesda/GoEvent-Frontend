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
          aria-label="Go back"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <h3 class="text-lg font-semibold text-slate-900">
          {{ isEditing ? 'Edit Template' : 'Create Template' }}
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
                Template Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="e.g. Elegant Gold Wedding"
                maxlength="100"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
              />
            </div>

            <!-- Package Plan Selection -->
            <div class="space-y-1.5">
              <label class="block text-sm font-medium text-slate-700">
                Package Plan <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.package_plan_id"
                class="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 bg-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
                :disabled="plansLoading"
              >
                <option :value="null" disabled>
                  {{ plansLoading ? 'Loading plans...' : 'Select a package plan' }}
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
              <label class="block text-sm font-medium text-slate-700">Preview URL</label>
              <input
                v-model="form.youtube_preview_url"
                type="url"
                placeholder="https://goevent.online/g/dPmdHn?lang=kh"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
              />
            </div>

            <!-- Template Colors -->
            <details class="border border-slate-200 rounded-lg overflow-hidden">
              <summary class="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 select-none flex items-center justify-between">
                <span>Template Colors ({{ colors.length }})</span>
                <ChevronDown class="w-4 h-4 text-slate-400" />
              </summary>
              <div class="p-4 space-y-3 border-t border-slate-100">
                <p v-if="!isEditing" class="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  Save the template first, then edit it to manage colors.
                </p>
                <template v-else>
                  <!-- Existing colors list -->
                  <div v-for="color in colors" :key="color.id" class="flex items-center gap-2 py-1.5">
                    <span
                      class="w-6 h-6 rounded-full border border-slate-200 flex-shrink-0"
                      :style="{ backgroundColor: color.hex_color_code }"
                    />
                    <span class="text-sm text-slate-700 flex-1 truncate">
                      {{ color.name }} <span class="text-slate-400">({{ color.hex_color_code }})</span>
                    </span>
                    <button
                      type="button"
                      @click="startEditColor(color)"
                      class="text-xs text-sky-600 hover:text-sky-700 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      @click="handleDeleteColor(color.id)"
                      class="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                  <!-- Add / Edit color form -->
                  <div class="flex items-end gap-2">
                    <div class="space-y-1">
                      <label class="block text-xs text-slate-500">Color</label>
                      <input
                        v-model="colorForm.hex_color_code"
                        type="color"
                        class="w-10 h-[34px] p-0.5 border border-slate-300 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div class="space-y-1 flex-1">
                      <label class="block text-xs text-slate-500">Hex</label>
                      <input
                        v-model="colorForm.hex_color_code"
                        type="text"
                        maxlength="7"
                        placeholder="#FF0000"
                        class="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                      />
                    </div>
                    <div class="space-y-1 flex-1">
                      <label class="block text-xs text-slate-500">Name</label>
                      <input
                        v-model="colorForm.name"
                        type="text"
                        maxlength="50"
                        placeholder="Primary"
                        class="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                      />
                    </div>
                    <button
                      type="button"
                      @click="handleSaveColor"
                      :disabled="colorSaving || !colorForm.hex_color_code || !colorForm.name"
                      class="px-3 py-1.5 rounded-lg text-sm font-semibold bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      <Loader2 v-if="colorSaving" class="w-3 h-3 animate-spin inline" />
                      <template v-else>{{ editingColorId ? 'Update' : 'Add' }}</template>
                    </button>
                    <button
                      v-if="editingColorId"
                      type="button"
                      @click="cancelEditColor"
                      class="px-2 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </template>
              </div>
            </details>

            <!-- Template Fonts -->
            <details class="border border-slate-200 rounded-lg overflow-hidden">
              <summary class="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 select-none flex items-center justify-between">
                <span>Template Fonts ({{ fonts.length }})</span>
                <ChevronDown class="w-4 h-4 text-slate-400" />
              </summary>
              <div class="p-4 space-y-3 border-t border-slate-100">
                <p v-if="!isEditing" class="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  Save the template first, then edit it to manage fonts.
                </p>
                <template v-else>
                  <!-- Existing fonts list -->
                  <div v-for="f in fonts" :key="f.id" class="flex items-center gap-2 py-1.5">
                    <span class="text-sm text-slate-700 flex-1 truncate">
                      {{ f.language_display }} &mdash; {{ f.font?.name || 'Unknown font' }}
                      <span class="text-slate-400">({{ f.font_type_display }})</span>
                    </span>
                    <button
                      type="button"
                      @click="startEditFont(f)"
                      class="text-xs text-sky-600 hover:text-sky-700 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      @click="handleDeleteFont(f.id)"
                      class="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                  <!-- Add / Edit font form -->
                  <div class="flex items-end gap-2">
                    <div class="space-y-1 flex-1">
                      <label class="block text-xs text-slate-500">Language</label>
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
                      <label class="block text-xs text-slate-500">Font</label>
                      <select
                        v-model="fontForm.font"
                        :class="selectClass"
                      >
                        <option :value="null" disabled>{{ availableCustomFonts.length ? 'Select' : '...' }}</option>
                        <option v-for="cf in availableCustomFonts" :key="cf.id" :value="cf.id">
                          {{ cf.name }}
                        </option>
                      </select>
                    </div>
                    <div class="space-y-1 flex-1">
                      <label class="block text-xs text-slate-500">Type</label>
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
                      @click="handleSaveFont"
                      :disabled="fontSaving || !fontForm.font || !fontForm.language || !fontForm.font_type"
                      class="px-3 py-1.5 rounded-lg text-sm font-semibold bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      <Loader2 v-if="fontSaving" class="w-3 h-3 animate-spin inline" />
                      <template v-else>{{ editingFontId ? 'Update' : 'Add' }}</template>
                    </button>
                    <button
                      v-if="editingFontId"
                      type="button"
                      @click="cancelEditFont"
                      class="px-2 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </template>
              </div>
            </details>

            <!-- Liquid Glass Toggle -->
            <div class="flex items-center justify-between py-2 px-1">
              <div>
                <p class="text-sm font-medium text-slate-700">Liquid Glass Background</p>
                <p class="text-xs text-slate-400">Show liquid glass visual effect</p>
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
              Preview Image
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
                    Change
                    <input type="file" accept="image/*" class="sr-only" @change="handleFileChange('preview_image', $event)" />
                  </label>
                </div>
              </div>
              <!-- Upload placeholder -->
              <label v-else class="flex flex-col items-center justify-center py-8 cursor-pointer">
                <Upload class="w-6 h-6 text-slate-400 mb-1" />
                <span class="text-xs font-medium text-slate-500 text-center">Upload preview</span>
                <span class="text-[10px] text-slate-400 mt-0.5 text-center">9:16 portrait</span>
                <input type="file" accept="image/*" class="sr-only" @change="handleFileChange('preview_image', $event)" />
              </label>
            </div>
          </div>
        </div>

        <!-- Background Stage (collapsible) -->
        <details v-if="form.package_plan_id" class="border border-slate-200 rounded-lg overflow-hidden" open>
          <summary class="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 select-none flex items-center justify-between">
            <span>Background Stage</span>
            <ChevronDown class="w-4 h-4 text-slate-400" />
          </summary>
          <div class="p-4 space-y-3 border-t border-slate-100">
            <!-- Basic: Background Photo -->
            <FileUploadField
              v-if="isBasicPlan"
              label="Background Photo"
              accept="image/*"
              :file-name="form.basic_background_photo?.name"
              :has-existing-file="!!existingTemplate?.basic_background_photo"
              @change="handleFileChange('basic_background_photo', $event)"
            />
            <!-- Standard: Background Video -->
            <FileUploadField
              v-if="isStandardPlan"
              label="Background Video"
              accept="video/*"
              :file-name="form.standard_background_video?.name"
              :has-existing-file="!!existingTemplate?.standard_background_video"
              @change="handleFileChange('standard_background_video', $event)"
            />
            <!-- Decorations (basic plan only) -->
            <div v-if="isBasicPlan" class="grid grid-cols-2 gap-3">
              <FileUploadField label="Top Decoration" accept="image/*" :file-name="form.top_decoration?.name" :has-existing-file="!!existingTemplate?.top_decoration" @change="handleFileChange('top_decoration', $event)" />
              <FileUploadField label="Bottom Decoration" accept="image/*" :file-name="form.bottom_decoration?.name" :has-existing-file="!!existingTemplate?.bottom_decoration" @change="handleFileChange('bottom_decoration', $event)" />
              <FileUploadField label="Left Decoration" accept="image/*" :file-name="form.left_decoration?.name" :has-existing-file="!!existingTemplate?.left_decoration" @change="handleFileChange('left_decoration', $event)" />
              <FileUploadField label="Right Decoration" accept="image/*" :file-name="form.right_decoration?.name" :has-existing-file="!!existingTemplate?.right_decoration" @change="handleFileChange('right_decoration', $event)" />
            </div>
          </div>
        </details>

        <!-- Cover Stage Decorations (collapsible) -->
        <details v-if="form.package_plan_id" class="border border-slate-200 rounded-lg overflow-hidden">
          <summary class="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 select-none flex items-center justify-between">
            <span>Cover Stage Decorations</span>
            <ChevronDown class="w-4 h-4 text-slate-400" />
          </summary>
          <div class="p-4 space-y-3 border-t border-slate-100">
            <!-- Basic: Cover Background Photo -->
            <FileUploadField
              v-if="isBasicPlan"
              label="Cover Stage Background"
              accept="image/*"
              :file-name="form.basic_decoration_photo?.name"
              :has-existing-file="!!existingTemplate?.basic_decoration_photo"
              @change="handleFileChange('basic_decoration_photo', $event)"
            />
            <!-- Standard: Cover Background Video -->
            <FileUploadField
              v-if="isStandardPlan"
              label="Cover Stage Background"
              accept="video/*"
              :file-name="form.standard_cover_video?.name"
              :has-existing-file="!!existingTemplate?.standard_cover_video"
              @change="handleFileChange('standard_cover_video', $event)"
            />
            <div v-if="isBasicPlan" class="grid grid-cols-2 gap-3">
              <FileUploadField label="Cover Top" accept="image/*" :file-name="form.cover_top_decoration?.name" :has-existing-file="!!existingTemplate?.cover_top_decoration" @change="handleFileChange('cover_top_decoration', $event)" />
              <FileUploadField label="Cover Bottom" accept="image/*" :file-name="form.cover_bottom_decoration?.name" :has-existing-file="!!existingTemplate?.cover_bottom_decoration" @change="handleFileChange('cover_bottom_decoration', $event)" />
              <FileUploadField label="Cover Left" accept="image/*" :file-name="form.cover_left_decoration?.name" :has-existing-file="!!existingTemplate?.cover_left_decoration" @change="handleFileChange('cover_left_decoration', $event)" />
              <FileUploadField label="Cover Right" accept="image/*" :file-name="form.cover_right_decoration?.name" :has-existing-file="!!existingTemplate?.cover_right_decoration" @change="handleFileChange('cover_right_decoration', $event)" />
            </div>
            <div class="grid grid-cols-3 gap-3">
              <FileUploadField label="Frame Left" accept="image/*" :file-name="form.guest_title_frame_left?.name" :has-existing-file="!!existingTemplate?.guest_title_frame_left" @change="handleFileChange('guest_title_frame_left', $event)" />
              <FileUploadField label="Frame Mid" accept="image/*" :file-name="form.guest_title_frame_mid?.name" :has-existing-file="!!existingTemplate?.guest_title_frame_mid" @change="handleFileChange('guest_title_frame_mid', $event)" />
              <FileUploadField label="Frame Right" accept="image/*" :file-name="form.guest_title_frame_right?.name" :has-existing-file="!!existingTemplate?.guest_title_frame_right" @change="handleFileChange('guest_title_frame_right', $event)" />
            </div>
          </div>
        </details>

        <!-- Cover Stage Layout (collapsible) -->
        <details class="border border-slate-200 rounded-lg overflow-hidden">
          <summary class="px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 select-none flex items-center justify-between">
            <span>Cover Stage Layout</span>
            <ChevronDown class="w-4 h-4 text-slate-400" />
          </summary>
          <div class="p-4 space-y-4 border-t border-slate-100">
            <!-- Animation Type -->
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-slate-600">Animation Type</label>
              <select
                v-model="form.cover_stage_layout.showcaseAnimationType"
                class="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 bg-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
              >
                <option value="decoration">Decoration (slide out)</option>
                <option value="door">Door (split open)</option>
              </select>
            </div>
            <!-- Container Positioning -->
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Container Positioning (vh)</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">Content Top</label>
                <input v-model.number="form.cover_stage_layout.contentTopPosition" type="number" step="0.5" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">Inner Height</label>
                <input v-model.number="form.cover_stage_layout.innerContainerHeight" type="number" step="0.5" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
            </div>
            <!-- Row Heights -->
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Row Heights (%)</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">Event Title</label>
                <input v-model.number="form.cover_stage_layout.eventTitleHeight" type="number" step="0.25" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">Logo</label>
                <input v-model.number="form.cover_stage_layout.logoHeight" type="number" step="0.25" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">Invite Text</label>
                <input v-model.number="form.cover_stage_layout.inviteTextHeight" type="number" step="0.25" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">Guest Name</label>
                <input v-model.number="form.cover_stage_layout.guestNameHeight" type="number" step="0.25" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
            </div>
            <!-- Swipe Arrow -->
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">Swipe Arrow Bottom (vh)</label>
                <input v-model.number="form.cover_stage_layout.swipeArrowBottom" type="number" step="0.5" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
            </div>
            <!-- Z-Indexes -->
            <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Decoration Z-Indexes</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">Left</label>
                <input v-model.number="form.cover_stage_layout.leftDecorationZIndex" type="number" step="1" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">Right</label>
                <input v-model.number="form.cover_stage_layout.rightDecorationZIndex" type="number" step="1" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">Top</label>
                <input v-model.number="form.cover_stage_layout.topDecorationZIndex" type="number" step="1" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
              </div>
              <div class="space-y-1">
                <label class="block text-xs text-slate-500">Bottom</label>
                <input v-model.number="form.cover_stage_layout.bottomDecorationZIndex" type="number" step="1" class="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400" />
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
          Cancel
        </button>
        <button
          type="button"
          @click="handleSave"
          :disabled="saving || !form.name.trim() || !form.package_plan_id"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white hover:from-[#27ae60] hover:to-[#1873cc] disabled:opacity-60 transition-all"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          {{ saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Template') }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue'
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
} from '../../services/api'
import PartnerTemplateFileField from './PartnerTemplateFileField.vue'

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
  swipeArrowBottom: 5,
  leftDecorationZIndex: 24,
  rightDecorationZIndex: 24,
  topDecorationZIndex: 25,
  bottomDecorationZIndex: 25,
  showcaseAnimationType: 'decoration',
})

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
}

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
})

const form = reactive<FormState>(defaultForm())
const previewImagePreview = ref<string | null>(null)
const bgPhotoPreview = ref<string | null>(null)
const saving = ref(false)
const error = ref<string | null>(null)

// --- Colors CRUD state ---
const colors = ref<EventTemplateColor[]>([])
const colorForm = reactive({ hex_color_code: '#000000', name: '' })
const editingColorId = ref<number | null>(null)
const colorSaving = ref(false)

// --- Fonts CRUD state ---
const fonts = ref<EventTemplateLanguageFont[]>([])
const availableCustomFonts = ref<CustomFont[]>([])
const fontForm = reactive<{ language: TemplateLanguageCode; font: number | null; font_type: TemplateFontType }>({
  language: 'en',
  font: null,
  font_type: 'primary',
})
const editingFontId = ref<number | null>(null)
const fontSaving = ref(false)

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
    }
  } catch { /* ignore */ }
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

async function handleSaveColor(): Promise<void> {
  if (!props.existingTemplate || !colorForm.hex_color_code || !colorForm.name) return
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
      error.value = res.message || 'Failed to save color.'
    }
  } catch {
    error.value = 'Unable to save color. Please check your connection.'
  } finally {
    colorSaving.value = false
  }
}

async function handleDeleteColor(colorId: number): Promise<void> {
  if (!props.existingTemplate) return
  try {
    const res = await partnerTemplateService.deleteColor(props.existingTemplate.id, colorId)
    if (res.success) {
      await fetchColors()
    } else {
      error.value = res.message || 'Failed to delete color.'
    }
  } catch {
    error.value = 'Unable to delete color. Please check your connection.'
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
    }
  } catch { /* ignore */ }
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

async function handleSaveFont(): Promise<void> {
  if (!props.existingTemplate || !fontForm.font || !fontForm.language || !fontForm.font_type) return
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
      error.value = res.message || 'Failed to save font.'
    }
  } catch {
    error.value = 'Unable to save font. Please check your connection.'
  } finally {
    fontSaving.value = false
  }
}

async function handleDeleteFont(fontId: number): Promise<void> {
  if (!props.existingTemplate) return
  try {
    const res = await partnerTemplateService.deleteFont(props.existingTemplate.id, fontId)
    if (res.success) {
      await fetchFonts()
    } else {
      error.value = res.message || 'Failed to delete font.'
    }
  } catch {
    error.value = 'Unable to delete font. Please check your connection.'
  }
}

// Reset form when template changes
watch(
  () => props.existingTemplate,
  (template) => {
    Object.assign(form, defaultForm())
    previewImagePreview.value = null
    bgPhotoPreview.value = null
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
      // Load colors and fonts from existing template
      colors.value = template.template_colors ?? []
      fonts.value = template.template_fonts ?? []
    } else {
      colors.value = []
      fonts.value = []
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

    let response
    if (isEditing.value && props.existingTemplate) {
      response = await partnerTemplateService.updateTemplate(props.existingTemplate.id, payload)
    } else {
      response = await partnerTemplateService.createTemplate(payload)
    }

    if (response.success && response.data) {
      emit('saved', response.data)
    } else {
      error.value = response.message || 'Failed to save template. Please try again.'
    }
  } catch {
    error.value = 'Unable to connect. Please check your connection and try again.'
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
