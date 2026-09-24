<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="drawer-backdrop" appear>
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]" @click="handleClose" />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="drawer-panel" appear>
      <div
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[32.5rem] lg:w-[35rem] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center justify-between px-3 py-2.5">
            <div class="flex items-center gap-2 min-w-0">
              <button
                @click="handleClose"
                :disabled="uploading || closing"
                class="p-1.5 hover:bg-white/20 rounded-lg drawer-close flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                :title="t('management.media.uploadModal.drawer.closeTitle')"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <!-- Named for what it holds now — the event's photos, the ones
                   already there as well as the ones being added. -->
              <div class="flex items-center gap-2 min-w-0">
                <ImagePlus class="w-4 h-4 text-white flex-shrink-0" aria-hidden="true" />
                <h2 class="text-base font-semibold text-white truncate">{{ t('management.media.photos.title') }}</h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Content. The wrapper is the undo bar's positioning box, so the bar
             floats over the foot of the scroller instead of scrolling away
             with it. -->
        <div class="relative flex-1 min-h-0 flex flex-col">
        <div ref="scrollerRef" class="flex-1 overflow-y-auto overscroll-contain">
          <!-- Foot padding clears whichever bars float over the end of the
               scroll, so the last row of photos is never stuck under them. -->
          <form
            id="upload-media-form"
            @submit.prevent="uploadFiles"
            class="p-4 space-y-5"
            :class="selectedPhoto ? 'pb-40' : 'pb-24'"
          >
            <!-- What is already there, first: the way to not upload a photo
                 twice is to see the ones you already have. It is also the one
                 place the phone preview can reach to put them in order or take
                 one out — the Showcase tab's grid is a whole page away from it.
                 Hidden only when the event genuinely has none. -->
            <section
              v-if="photosLoading || photosLoadFailed || photos.length > 0"
              class="space-y-2.5"
              :aria-busy="photosLoading"
            >
              <div>
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {{ t('management.media.uploadModal.gallery.title') }}
                  <span v-if="photos.length" class="text-slate-400">· {{ photos.length }}</span>
                </p>
                <p v-if="photos.length > 0" class="text-xs text-slate-500 mt-1">
                  {{ t('management.media.uploadModal.gallery.hint') }}
                </p>
              </div>

              <div v-if="photosLoading" class="grid grid-cols-3 sm:grid-cols-4 gap-2" aria-hidden="true">
                <div v-for="n in 6" :key="n" class="aspect-square rounded-xl bg-slate-100 animate-pulse" />
              </div>

              <div
                v-else-if="photosLoadFailed"
                class="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
              >
                <p class="text-sm text-slate-600">{{ t('management.media.uploadModal.gallery.loadFailed') }}</p>
                <button
                  type="button"
                  @click="loadPhotos()"
                  class="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {{ t('management.media.photos.tryAgain') }}
                </button>
              </div>

              <PhotoArrangeGrid
                v-else
                ref="gridRef"
                v-model:selected-id="selectedId"
                :photos="photos"
                :disabled="uploading || closing"
                :scroller="scrollerRef"
                @reorder="saveOrder"
                @remove="removePhoto"
              />

              <Transition name="drawer-reveal">
                <div v-if="galleryError" class="grid grid-rows-[1fr]">
                  <p class="min-h-0 overflow-hidden text-xs font-medium text-red-600" role="alert">
                    {{ galleryError }}
                  </p>
                </div>
              </Transition>
            </section>

            <!-- File Upload Area -->
            <div class="space-y-3">
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{
                  photos.length > 0
                    ? t('management.media.photos.addPhotos')
                    : t('management.media.uploadModal.selectImages')
                }}
              </p>

              <!-- Drop Zone. Shorter once there are photos above it: it is the
                   way to add more, not the whole screen any more. -->
              <div
                @drop="handleDrop"
                @dragover.prevent
                @dragenter.prevent
                @dragleave="handleDragLeave"
                :class="[
                  'relative border-2 border-dashed rounded-2xl text-center transition-colors duration-200',
                  photos.length > 0 ? 'p-4 sm:p-5' : 'p-6 sm:p-8',
                  isDragging
                    ? 'border-[#4fa3d9] bg-[#E6F4FF]'
                    : 'border-slate-300 hover:border-slate-400',
                ]"
              >
                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  accept="image/*"
                  @change="handleFileSelect"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div class="space-y-3">
                  <div
                    class="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-2xl flex items-center justify-center mx-auto"
                  >
                    <Upload class="w-7 h-7 sm:w-8 sm:h-8 text-[#1e90ff]" />
                  </div>

                  <div>
                    <p class="text-sm sm:text-base font-medium text-slate-900 mb-1">
                      {{ isDragging ? t('management.media.uploadModal.dropActive') : t('management.media.uploadModal.dropIdle') }}
                    </p>
                    <p class="text-xs sm:text-sm text-slate-600">
                      {{ t('management.media.uploadModal.dropHint') }}
                    </p>
                    <p class="text-[10px] sm:text-xs text-slate-500 mt-1">
                      {{ t('management.media.uploadModal.formatHint', { size: sizeLimitLabel }) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Optimize Toggle — only once there is something to optimize.
                   Flipping it after picking still applies (see
                   toggleOptimizeImages), so nothing is lost by waiting. -->
              <button
                v-if="selectedFiles.length > 0"
                type="button"
                role="switch"
                :aria-checked="optimizeImages"
                :disabled="uploading || compressing"
                @click="toggleOptimizeImages"
                class="w-full flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg text-left hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="flex items-center gap-3 min-w-0">
                  <span class="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                    <ImageDown class="w-4 h-4 text-sky-500" aria-hidden="true" />
                  </span>
                  <span class="min-w-0">
                    <span class="block text-sm font-medium text-slate-700">
                      {{ t('management.media.uploadModal.optimize.label') }}
                    </span>
                    <span class="block text-xs text-slate-500">
                      {{ t('management.media.uploadModal.optimize.hint') }}
                    </span>
                  </span>
                </span>
                <span
                  :class="[
                    'relative inline-block h-6 w-11 rounded-full flex-shrink-0 transition-colors duration-200',
                    optimizeImages ? 'bg-sky-500' : 'bg-slate-200',
                  ]"
                >
                  <span
                    class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
                    :style="{ transform: optimizeImages ? 'translateX(20px)' : 'translateX(0)' }"
                  />
                </span>
              </button>

              <!-- Over-limit Warning -->
              <Transition name="drawer-reveal">
                <div v-if="oversizedFiles.length > 0" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <div
                      class="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2.5"
                    >
                      <div class="flex items-start gap-2">
                        <TriangleAlert class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-amber-800">
                            {{
                              oversizedFiles.length === 1
                                ? t('management.media.uploadModal.oversized.titleOne', { size: sizeLimitLabel })
                                : t('management.media.uploadModal.oversized.titleMany', {
                                    count: oversizedFiles.length,
                                    size: sizeLimitLabel,
                                  })
                            }}
                          </p>
                          <p class="text-sm text-amber-700 mt-0.5">
                            {{
                              canShrinkOversized
                                ? t('management.media.uploadModal.oversized.description')
                                : t('management.media.uploadModal.oversized.descriptionUnshrinkable')
                            }}
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center gap-2 pl-7">
                        <button
                          v-if="canShrinkOversized"
                          type="button"
                          @click="optimizeOversized"
                          :disabled="compressing"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minimize2 class="w-3.5 h-3.5" aria-hidden="true" />
                          {{ t('management.media.uploadModal.oversized.optimizeAll') }}
                        </button>
                        <button
                          type="button"
                          @click="removeOversized"
                          :disabled="compressing"
                          class="px-3 py-1.5 text-amber-700 hover:bg-amber-100 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {{ t('management.media.uploadModal.oversized.removeAll') }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>

              <!-- Selected Files Preview -->
              <div v-if="selectedFiles.length > 0" class="space-y-3">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {{ t('management.media.uploadModal.selectedFiles', { count: selectedFiles.length }) }}
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    v-for="item in selectedFiles"
                    :key="item.id"
                    :class="[
                      'flex items-center gap-3 p-3 rounded-xl border',
                      isOversized(item)
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-slate-50 border-transparent',
                    ]"
                  >
                    <!-- Preview Thumbnail -->
                    <div class="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                      <img
                        v-if="item.preview"
                        :src="item.preview"
                        :alt="item.original.name"
                        class="w-full h-full object-cover"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center">
                        <ImageIcon class="w-5 h-5 text-slate-400" />
                      </div>
                    </div>

                    <!-- File Info -->
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900 truncate">
                        {{ item.original.name }}
                      </p>
                      <p
                        v-if="item.optimizing"
                        class="flex items-center gap-1 text-xs font-medium text-sky-600"
                      >
                        <Loader2 class="w-3 h-3 animate-spin" aria-hidden="true" />
                        {{ t('management.media.uploadModal.optimizing') }}
                      </p>
                      <p v-else-if="isOversized(item)" class="text-xs font-medium text-amber-700 truncate">
                        {{ formatFileSize(activeFile(item).size) }} ·
                        {{
                          isUnshrinkable(item)
                            ? t('management.media.uploadModal.optimize.stillOverLimit')
                            : t('management.media.uploadModal.optimize.overLimit')
                        }}
                      </p>
                      <p v-else-if="isOptimized(item)" class="text-xs text-emerald-600 truncate">
                        <span class="text-slate-400 line-through">{{ formatFileSize(item.original.size) }}</span>
                        → {{ formatFileSize(activeFile(item).size) }}
                      </p>
                      <p v-else class="text-xs text-slate-500">{{ formatFileSize(item.original.size) }}</p>
                    </div>

                    <!-- Row Actions -->
                    <div class="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        v-if="isOversized(item) && !isUnshrinkable(item) && !item.optimizing"
                        type="button"
                        @click="optimizeFiles([item], true)"
                        :title="t('management.media.uploadModal.optimize.optimizeOne')"
                        :aria-label="t('management.media.uploadModal.optimize.optimizeOne')"
                        class="p-1 text-amber-600 hover:text-amber-800 transition-colors duration-200"
                      >
                        <Minimize2 class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        @click="removeFile(item.id)"
                        :title="t('management.media.uploadModal.removeFile')"
                        :aria-label="t('management.media.uploadModal.removeFile')"
                        class="p-1 text-slate-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Upload Options — options for an upload, so they wait for one. -->
            <div v-if="selectedFiles.length > 0" class="space-y-3">
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('management.media.uploadModal.options.title') }}
              </p>

              <!-- Default Caption -->
              <div>
                <label for="defaultCaption" class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('management.media.uploadModal.options.captionLabel') }}
                </label>
                <input
                  id="defaultCaption"
                  v-model="defaultCaption"
                  type="text"
                  :placeholder="t('management.media.uploadModal.options.captionPlaceholder')"
                  class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                />
                <p class="text-xs text-slate-500 mt-1">
                  {{ t('management.media.uploadModal.options.captionHint') }}
                </p>
              </div>

              <!-- Featured Toggle -->
              <div class="flex items-center gap-3">
                <input
                  id="markAsFeatured"
                  v-model="markAsFeatured"
                  type="checkbox"
                  class="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-200"
                />
                <label for="markAsFeatured" class="text-sm font-medium text-slate-700">
                  {{ t('management.media.uploadModal.options.featuredLabel') }}
                </label>
              </div>
            </div>

            <!-- Error Display -->
            <Transition name="drawer-reveal">
              <div v-if="error" class="grid grid-rows-[1fr]">
                <div class="min-h-0 overflow-hidden">
                  <div class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div class="flex-1">
                      <p class="text-sm font-medium text-red-800">{{ t('management.media.uploadModal.error.title') }}</p>
                      <p class="text-sm text-red-700 mt-0.5">{{ error }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- Upload Progress -->
            <div v-if="uploading" class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-slate-700">
                  {{ selectedFiles.length === 1 ? t('management.media.uploadModal.progress.uploadingOne') : t('management.media.uploadModal.progress.uploadingMany', { count: selectedFiles.length }) }}
                </p>
                <p class="text-sm text-slate-500">{{ Math.round(uploadProgress) }}%</p>
              </div>
              <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] h-2 rounded-full drawer-action duration-300"
                  :style="{ width: `${uploadProgress}%` }"
                ></div>
              </div>
            </div>
          </form>
        </div>

        <!-- The floating bars, stacked so both can be up at once: the undo for
             the last removal above, the selected photo's actions below it,
             nearest the thumb. The column itself lets taps through. -->
        <div class="absolute inset-x-4 bottom-3 z-20 flex flex-col gap-2 pointer-events-none">
          <!-- Removing is instant and undoable rather than confirmed: clearing
               out several photos on a phone should be one tap each, not two,
               and a slip costs one more tap to take back. The delete is sent
               when the window closes, when another photo is removed, or when
               the drawer does. -->
          <Transition name="undo-bar">
            <div
              v-if="pendingRemoval"
              class="pointer-events-auto flex items-center gap-3 rounded-xl bg-slate-900/95 pl-4 pr-2 py-2 text-sm text-white shadow-lg"
              role="status"
            >
              <Trash2 class="w-4 h-4 text-slate-300 flex-shrink-0" aria-hidden="true" />
              <span class="flex-1 min-w-0 truncate">{{ t('management.media.uploadModal.gallery.removed') }}</span>
              <button
                type="button"
                @click="undoRemoval"
                class="flex-shrink-0 min-h-[2.5rem] px-3 rounded-lg font-semibold text-sky-300 hover:bg-white/10 active:bg-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                {{ t('management.media.uploadModal.gallery.undo') }}
              </button>
            </div>
          </Transition>

          <!-- The band's sections, opened from the bar below and in its
               material. Choosing one saves at once, like featuring does. -->
          <Transition name="undo-bar">
            <div
              v-if="selectedPhoto && bandMenuOpen"
              class="pointer-events-auto rounded-2xl bg-slate-900/95 p-1 text-white shadow-lg"
            >
              <div
                class="max-h-[min(22rem,45dvh)] overflow-y-auto overscroll-contain"
                role="radiogroup"
                :aria-label="t('management.showcasePreview.editors.photoBandPlacement')"
              >
                <button
                  v-for="option in bandOptions"
                  :key="option.value ?? 'gallery'"
                  type="button"
                  role="radio"
                  class="band-option"
                  :aria-checked="photoBandPlacement(selectedPhoto) === option.value"
                  @click="setBandPlacement(selectedPhoto, option.value)"
                >
                  <span class="flex-1 min-w-0 truncate text-left">{{ option.label }}</span>
                  <Check
                    v-if="photoBandPlacement(selectedPhoto) === option.value"
                    class="w-4 h-4 flex-shrink-0 text-sky-300"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <p class="px-3 pt-1.5 pb-2 text-[11px] leading-snug text-slate-400 border-t border-white/10 mt-1">
                {{ t('management.media.uploadModal.gallery.bandHint') }}
              </p>
            </div>
          </Transition>

          <!-- What can be done to the selected photo, in words — the same bar
               the Photos app raises for a selection. Feature and the two moves
               are what the gallery had no visible way to do; the press-and-hold
               drag is still there for moving far. -->
          <Transition name="undo-bar">
            <div
              v-if="selectedPhoto"
              class="pointer-events-auto flex items-stretch gap-0.5 rounded-2xl bg-slate-900/95 p-1 text-white shadow-lg"
              role="toolbar"
              :aria-label="
                t('management.media.uploadModal.gallery.photoLabel', {
                  n: selectedIndex + 1,
                  total: photos.length,
                })
              "
            >
              <button
                type="button"
                class="sel-action"
                :class="{ 'is-on': selectedPhoto.is_featured }"
                :aria-pressed="selectedPhoto.is_featured"
                :title="t('management.showcasePreview.editors.featuredPhotoDescription')"
                :disabled="featuringId !== null"
                @click="toggleFeatured(selectedPhoto)"
              >
                <Loader2 v-if="featuringId === selectedPhoto.id" class="w-[1.125rem] h-[1.125rem] animate-spin" aria-hidden="true" />
                <Star
                  v-else
                  class="w-[1.125rem] h-[1.125rem]"
                  :class="{ 'fill-current': selectedPhoto.is_featured }"
                  aria-hidden="true"
                />
                <span>
                  {{
                    selectedPhoto.is_featured
                      ? t('management.media.uploadModal.gallery.featuredOn')
                      : t('management.media.uploadModal.gallery.feature')
                  }}
                </span>
              </button>
              <!-- The photo in the cover's photo frame — one per event, like the
                   featured photo. Its crop is set on the cover itself, in the
                   studio preview, where the frame's shape can be seen. -->
              <button
                type="button"
                class="sel-action"
                :class="{ 'is-on is-on--cover': selectedPhoto.is_cover_photo === true }"
                :aria-pressed="selectedPhoto.is_cover_photo === true"
                :title="t('management.media.uploadModal.gallery.coverTitle')"
                :disabled="coveringId !== null"
                @click="toggleCoverPhoto(selectedPhoto)"
              >
                <Loader2 v-if="coveringId === selectedPhoto.id" class="w-[1.125rem] h-[1.125rem] animate-spin" aria-hidden="true" />
                <Frame v-else class="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
                <span>
                  {{
                    selectedPhoto.is_cover_photo === true
                      ? t('management.media.uploadModal.gallery.coverOn')
                      : t('management.media.uploadModal.gallery.cover')
                  }}
                </span>
              </button>
              <!-- Where in the invitation this photo appears as a band — or
                   in the gallery, like any other photo. -->
              <button
                type="button"
                class="sel-action"
                :class="{ 'is-on is-on--band': isPhotoBand(selectedPhoto) }"
                :aria-expanded="bandMenuOpen"
                :aria-pressed="isPhotoBand(selectedPhoto)"
                :title="t('management.showcasePreview.editors.photoBandDescription')"
                :disabled="placingId !== null"
                @click="bandMenuOpen = !bandMenuOpen"
              >
                <Loader2 v-if="placingId === selectedPhoto.id" class="w-[1.125rem] h-[1.125rem] animate-spin" aria-hidden="true" />
                <GalleryHorizontal v-else class="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
                <span>{{ t('management.media.uploadModal.gallery.band') }}</span>
              </button>
              <button
                type="button"
                class="sel-action"
                :disabled="selectedIndex <= 0"
                @click="moveSelected(-1)"
              >
                <ChevronLeft class="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
                <span>{{ t('management.media.uploadModal.gallery.moveEarlier') }}</span>
              </button>
              <button
                type="button"
                class="sel-action"
                :disabled="selectedIndex >= photos.length - 1"
                @click="moveSelected(1)"
              >
                <ChevronRight class="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
                <span>{{ t('management.media.uploadModal.gallery.moveLater') }}</span>
              </button>
              <button type="button" class="sel-action sel-action--danger" @click="removePhoto(selectedPhoto)">
                <Trash2 class="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
                <span>{{ t('management.media.uploadModal.gallery.removeShort') }}</span>
              </button>
              <span class="w-px my-2 mx-0.5 bg-white/15 flex-shrink-0" aria-hidden="true" />
              <button type="button" class="sel-action sel-action--done" @click="selectedId = null">
                <Check class="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
                <span>{{ t('management.media.uploadModal.gallery.done') }}</span>
              </button>
            </div>
          </Transition>
        </div>
        </div>

        <!-- Footer -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <!-- The primary is always something to press: with nothing picked
                 it opens the picker, rather than sitting disabled under the
                 thumb while the way to add lives further up the drawer. -->
            <button
              v-if="selectedFiles.length === 0"
              type="button"
              @click="openPicker"
              :disabled="uploading || closing"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 drawer-action shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus class="w-4 h-4" aria-hidden="true" />
              <span>{{ t('management.media.photos.addPhotos') }}</span>
            </button>
            <button
              v-else
              type="submit"
              form="upload-media-form"
              :disabled="selectedFiles.length === 0 || uploading || compressing || oversizedFiles.length > 0"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 drawer-action shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                v-if="uploading"
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></span>
              <Upload v-else class="w-4 h-4" aria-hidden="true" />
              <span>
                {{
                  uploading
                    ? t('management.media.uploadModal.uploading')
                    : selectedFiles.length === 1
                      ? t('management.media.uploadModal.submitOne')
                      : t('management.media.uploadModal.submitMany', { count: selectedFiles.length })
                }}
              </span>
            </button>

            <button
              type="button"
              @click="handleClose"
              :disabled="uploading || closing"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <!-- "Cancel" only while there is an upload to cancel: arranging and
                   removing are already saved, so closing then is just leaving. -->
              {{
                selectedFiles.length > 0
                  ? t('management.media.uploadModal.cancel')
                  : t('management.media.uploadModal.drawer.closeTitle')
              }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Frame,
  GalleryHorizontal,
  Upload,
  X,
  ImageIcon,
  AlertCircle,
  ImagePlus,
  Loader2,
  ImageDown,
  Minimize2,
  Plus,
  Star,
  Trash2,
  TriangleAlert,
} from 'lucide-vue-next'
import { mediaService, type EventPhoto } from '../services/api'
import type { PhotoBandPlacement } from '@/services/api/types/event.types'
import {
  PHOTO_BAND_PLACEMENTS,
  isPhotoBand,
  photoBandPayload,
  photoBandPlacement,
  responseSupportsPhotoBand,
} from '@/components/showcase/photo-band/photoBand'
import { coverPhotoPayload, responseSupportsCoverPhoto } from '@/components/showcase/cover/coverPhoto'
import { compressImage } from '@/utils/imageCompression'
import { FILE_SIZE_LIMITS } from '@/constants/media'
import { useAppLanguage } from '@/composables/useAppLanguage'
import PhotoArrangeGrid from './PhotoArrangeGrid.vue'

interface Props {
  eventId: string
  /** The host's copy of the event's photos, drawn at once so the drawer does
   *  not open on a skeleton. It is refreshed from the server behind the scenes
   *  anyway — a host's copy can be behind (the studio preview's is). */
  initialPhotos?: EventPhoto[]
}

interface Emits {
  close: []
  uploaded: [media: EventPhoto]
  /** Every committed change to the gallery — a reorder, a removal, an upload —
   *  with the whole list in its new order, for the host's own copy. */
  'photos-changed': [photos: EventPhoto[]]
}

/**
 * A picked image. The original is always kept so optimization stays reversible,
 * and the optimized copy is computed at most once and cached — flipping the
 * "optimize" toggle then only swaps which one gets uploaded.
 */
interface SelectedImage {
  id: number
  original: File
  optimizedFile: File | null
  useOptimized: boolean
  /** Optimized by an explicit per-file/bulk action, so the toggle won't revert it. */
  pinned: boolean
  optimizing: boolean
  preview: string
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useAppLanguage()

// State
const selectedFiles = ref<SelectedImage[]>([])
const optimizeImages = ref(true)
const defaultCaption = ref('')
const markAsFeatured = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const currentUpload = ref(0)
const error = ref<string | null>(null)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()
let nextFileId = 0
let errorTimer: ReturnType<typeof setTimeout> | undefined

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/** The file that will actually be uploaded for this entry. */
const activeFile = (item: SelectedImage): File =>
  item.useOptimized && item.optimizedFile ? item.optimizedFile : item.original

const isOptimized = (item: SelectedImage): boolean => activeFile(item) !== item.original

const isOversized = (item: SelectedImage): boolean =>
  activeFile(item).size > FILE_SIZE_LIMITS.IMAGE

/** Already optimized as far as we can, and still too big — only removing helps. */
const isUnshrinkable = (item: SelectedImage): boolean =>
  item.optimizedFile !== null && item.optimizedFile.size > FILE_SIZE_LIMITS.IMAGE

const compressing = computed(() => selectedFiles.value.some((item) => item.optimizing))
const oversizedFiles = computed(() => selectedFiles.value.filter(isOversized))
const canShrinkOversized = computed(() => oversizedFiles.value.some((item) => !isUnshrinkable(item)))
const sizeLimitLabel = computed(() => formatFileSize(FILE_SIZE_LIMITS.IMAGE))

const flashError = (message: string) => {
  error.value = message
  clearTimeout(errorTimer)
  errorTimer = setTimeout(() => (error.value = null), 4000)
}

// ---------------------------------------------------------------------------
// The gallery: the photos already uploaded, arranged and pruned in place.
// ---------------------------------------------------------------------------

const scrollerRef = ref<HTMLElement | null>(null)

const byOrder = (list: EventPhoto[]) => [...list].sort((a, b) => a.order - b.order)

const photos = ref<EventPhoto[]>(byOrder(props.initialPhotos ?? []))
/** Only when there is nothing to draw yet — with a host's copy in hand, the
 *  refresh happens behind it. */
const photosLoading = ref(!props.initialPhotos)
const photosLoadFailed = ref(false)

const galleryError = ref<string | null>(null)
let galleryErrorTimer: ReturnType<typeof setTimeout> | undefined

const flashGalleryError = (message: string) => {
  galleryError.value = message
  clearTimeout(galleryErrorTimer)
  galleryErrorTimer = setTimeout(() => (galleryError.value = null), 4000)
}

const loadPhotos = async () => {
  const silent = photos.value.length > 0 && !photosLoadFailed.value
  if (!silent) photosLoading.value = true
  photosLoadFailed.value = false
  try {
    const response = await mediaService.getEventMedia(props.eventId)
    // Typed as paginated, answered as a bare array (the same unwrap
    // EventMediaTab does) — accept either.
    const data = response.data as unknown as EventPhoto[] | { results?: EventPhoto[] } | undefined
    if (response.success && data) {
      // A photo in the middle of being moved keeps its place: the grid ignores
      // new props while arranging, and the next change reports the real order.
      photos.value = byOrder(Array.isArray(data) ? data : (data.results ?? []))
    } else if (!silent) {
      photosLoadFailed.value = true
    }
  } catch {
    if (!silent) photosLoadFailed.value = true
  } finally {
    photosLoading.value = false
  }
}

// --- Removing, with undo ----------------------------------------------------

interface PendingRemoval {
  photo: EventPhoto
  /** Where it was, to put it back. */
  index: number
  timer: ReturnType<typeof setTimeout>
}

/** How long a removal can be taken back before it is sent. */
const UNDO_WINDOW_MS = 5000

/** At most one: removing another photo makes the previous removal final. */
const pendingRemoval = ref<PendingRemoval | null>(null)

/** The order changed on the server while a removal was pending, so the
 *  pending photo's stored position no longer means anything — an undo then
 *  has to save the whole order again. */
let reorderedWhilePending = false

const withPendingRestored = (list: EventPhoto[], pending: PendingRemoval) => {
  const next = [...list]
  next.splice(Math.min(pending.index, next.length), 0, pending.photo)
  return next
}

/**
 * What the server holds: the list on screen plus a removal not yet sent, with
 * `order` matching position — what a host should draw.
 */
const committedPhotos = (): EventPhoto[] => {
  const list = pendingRemoval.value
    ? withPendingRestored(photos.value, pendingRemoval.value)
    : photos.value
  return list.map((photo, index) => ({ ...photo, order: index }))
}

const commitPendingRemoval = async () => {
  const pending = pendingRemoval.value
  if (!pending) return
  clearTimeout(pending.timer)
  pendingRemoval.value = null
  try {
    const response = await mediaService.deleteEventMedia(props.eventId, pending.photo.id)
    if (!response.success) throw new Error(response.message || 'delete failed')
    emit('photos-changed', committedPhotos())
  } catch {
    photos.value = withPendingRestored(photos.value, pending)
    flashGalleryError(t('management.media.uploadModal.gallery.removeFailed'))
  }
}

const removePhoto = (photo: EventPhoto) => {
  const index = photos.value.findIndex((item) => item.id === photo.id)
  if (index === -1) return
  void commitPendingRemoval()
  if (selectedId.value === photo.id) selectedId.value = null
  photos.value = photos.value.filter((item) => item.id !== photo.id)
  reorderedWhilePending = false
  pendingRemoval.value = {
    photo,
    index,
    timer: setTimeout(() => void commitPendingRemoval(), UNDO_WINDOW_MS),
  }
}

const undoRemoval = () => {
  const pending = pendingRemoval.value
  if (!pending) return
  clearTimeout(pending.timer)
  pendingRemoval.value = null
  photos.value = withPendingRestored(photos.value, pending)
  if (reorderedWhilePending) saveOrder(photos.value)
}

// --- Reordering -------------------------------------------------------------

/** How long the order waits after the last move before it is saved. Three taps
 *  on "Later" are one decision, and one request — three would race, and the
 *  server could end up keeping whichever arrived last rather than the last one
 *  made. */
const ORDER_SAVE_DELAY_MS = 450

let orderSaveTimer: ReturnType<typeof setTimeout> | undefined

/** The order before the first unsaved move — what a failed save puts back. */
let orderBeforeBatch: EventPhoto[] | null = null

/** Show a new order at once, and save it once the moves stop. */
const saveOrder = (next: EventPhoto[]) => {
  if (!orderBeforeBatch) orderBeforeBatch = photos.value
  photos.value = next.map((photo, index) => ({ ...photo, order: index }))
  if (pendingRemoval.value) reorderedWhilePending = true
  clearTimeout(orderSaveTimer)
  orderSaveTimer = setTimeout(() => void flushOrder(), ORDER_SAVE_DELAY_MS)
}

/** Send an order still waiting on its delay — now. */
const flushOrder = async () => {
  clearTimeout(orderSaveTimer)
  orderSaveTimer = undefined
  const previous = orderBeforeBatch
  if (!previous) return
  orderBeforeBatch = null
  const ordered = photos.value
  try {
    const response = await mediaService.bulkReorderEventMedia(props.eventId, {
      updates: ordered.map(({ id, order }) => ({ id, order })),
    })
    if (!response.success) throw new Error(response.message || 'reorder failed')
    emit('photos-changed', committedPhotos())
  } catch {
    // The old order, but today's photos: a star moved or a photo removed since
    // the batch began is not undone along with it.
    const current = new Map(photos.value.map((photo) => [photo.id, photo]))
    photos.value = previous
      .filter((photo) => current.has(photo.id))
      .map((photo) => ({ ...current.get(photo.id)!, order: photo.order }))
    flashGalleryError(t('management.media.uploadModal.gallery.reorderFailed'))
  }
}

// --- Selection: what the bar under the gallery acts on ----------------------

const gridRef = ref<InstanceType<typeof PhotoArrangeGrid> | null>(null)
const selectedId = ref<number | null>(null)

const selectedIndex = computed(() => photos.value.findIndex((photo) => photo.id === selectedId.value))
const selectedPhoto = computed(() => photos.value[selectedIndex.value] ?? null)

// A photo that leaves the gallery (removed, or gone on a refresh) takes its
// selection with it, and the bar with that.
watch(selectedPhoto, (photo) => {
  if (!photo && selectedId.value !== null) selectedId.value = null
})

/** Earlier / later: the grid moves it (animated like a drag) and reports the
 *  new order, which lands in saveOrder like any other. */
const moveSelected = (delta: number) => {
  if (selectedId.value !== null) void gridRef.value?.move(selectedId.value, delta)
}

// --- Featuring --------------------------------------------------------------

const featuringId = ref<number | null>(null)

/**
 * One featured photo, as in the featured-photo picker: featuring a photo
 * un-features whichever was; featuring the featured one clears it. Shown at
 * once. On a failure the gallery is re-read rather than guessed at — with two
 * requests, the first may have gone through.
 */
const toggleFeatured = async (photo: EventPhoto) => {
  if (featuringId.value !== null) return
  const makeFeatured = !photo.is_featured
  const unfeature = makeFeatured
    ? photos.value.filter((item) => item.is_featured && item.id !== photo.id)
    : []
  const before = new Map(photos.value.map((item) => [item.id, item.is_featured]))
  const setFeatured = (decide: (item: EventPhoto) => boolean) => {
    photos.value = photos.value.map((item) => ({ ...item, is_featured: decide(item) }))
  }

  setFeatured((item) =>
    item.id === photo.id ? makeFeatured : unfeature.some((other) => other.id === item.id) ? false : item.is_featured,
  )
  featuringId.value = photo.id
  try {
    for (const other of unfeature) {
      const response = await mediaService.updateEventMedia(props.eventId, other.id, { is_featured: false })
      if (!response.success) throw new Error(response.message || 'unfeature failed')
    }
    const response = await mediaService.updateEventMedia(props.eventId, photo.id, {
      is_featured: makeFeatured,
    })
    if (!response.success) throw new Error(response.message || 'feature failed')
    emit('photos-changed', committedPhotos())
  } catch {
    setFeatured((item) => before.get(item.id) ?? item.is_featured)
    flashGalleryError(t('management.media.uploadModal.gallery.featureFailed'))
    void loadPhotos()
  } finally {
    featuringId.value = null
  }
}

// --- Cover photo ------------------------------------------------------------

const coveringId = ref<number | null>(null)

/**
 * One cover photo, as there is one featured photo: putting a photo on the cover
 * takes the one that was off it; tapping the cover photo clears it (the frame
 * then shows the first host's photo). Shown at once and saved at once.
 *
 * The chosen photo is sent first, because a server that doesn't store the field
 * answers 200 without it — checked before anything else is touched, so nothing
 * is changed that can't be. A later failure re-reads the gallery rather than
 * guessing which of the requests went through.
 */
const toggleCoverPhoto = async (photo: EventPhoto) => {
  if (coveringId.value !== null) return
  const makeCover = photo.is_cover_photo !== true
  const previous = makeCover
    ? photos.value.filter((item) => item.is_cover_photo === true && item.id !== photo.id)
    : []
  const before = new Map(photos.value.map((item) => [item.id, item.is_cover_photo === true]))
  const setCover = (decide: (item: EventPhoto) => boolean) => {
    photos.value = photos.value.map((item) => ({ ...item, is_cover_photo: decide(item) }))
  }
  const revert = () => setCover((item) => before.get(item.id) ?? item.is_cover_photo === true)

  setCover((item) =>
    item.id === photo.id
      ? makeCover
      : previous.some((other) => other.id === item.id)
        ? false
        : item.is_cover_photo === true,
  )
  coveringId.value = photo.id
  try {
    const response = await mediaService.updateEventMedia(props.eventId, photo.id, coverPhotoPayload(makeCover))
    if (!response.success || !response.data) throw new Error(response.message || 'cover failed')
    if (!responseSupportsCoverPhoto(response.data)) {
      revert()
      flashGalleryError(t('management.media.uploadModal.gallery.coverUnsupported'))
      return
    }
    for (const other of previous) {
      const cleared = await mediaService.updateEventMedia(props.eventId, other.id, coverPhotoPayload(false))
      if (!cleared.success) throw new Error(cleared.message || 'cover failed')
    }
    emit('photos-changed', committedPhotos())
  } catch {
    revert()
    flashGalleryError(t('management.media.uploadModal.gallery.coverFailed'))
    void loadPhotos()
  } finally {
    coveringId.value = null
  }
}

// --- Photo band -------------------------------------------------------------

const bandMenuOpen = ref(false)
const placingId = ref<number | null>(null)

// The menu belongs to the photo it was opened on.
watch(selectedId, () => {
  bandMenuOpen.value = false
})

/** "In the gallery" first — the photo as it is by default — then the sections in invitation order. */
const bandOptions = computed(() => [
  { value: null, label: t('management.media.uploadModal.gallery.bandNone') },
  ...PHOTO_BAND_PLACEMENTS.map((placement) => ({
    value: placement,
    label: t(`management.showcasePreview.editors.photoBandPlacements.${placement}`),
  })),
])

/**
 * Makes the photo a band after `placement`, or — with null — a gallery photo
 * again. Shown at once and saved at once, as featuring is. The blend colour is
 * kept across a move: it matches the template behind the card, not the
 * section. A server that doesn't store the fields answers 200 without them, so
 * the echo is checked before this counts as saved.
 */
const setBandPlacement = async (photo: EventPhoto, placement: PhotoBandPlacement | null) => {
  bandMenuOpen.value = false
  if (placingId.value !== null || photoBandPlacement(photo) === placement) return
  const before = { band_placement: photo.band_placement ?? null, band_blend_color: photo.band_blend_color ?? null }
  const payload = photoBandPayload(placement, photo.band_blend_color ?? null)
  const apply = (fields: typeof before) => {
    photos.value = photos.value.map((item) => (item.id === photo.id ? { ...item, ...fields } : item))
  }

  apply(payload)
  placingId.value = photo.id
  try {
    const response = await mediaService.updateEventMedia(props.eventId, photo.id, payload)
    if (!response.success || !response.data) throw new Error(response.message || 'band failed')
    if (!responseSupportsPhotoBand(response.data)) {
      apply(before)
      flashGalleryError(t('management.showcasePreview.editors.photoBandUnsupported'))
      return
    }
    emit('photos-changed', committedPhotos())
  } catch {
    apply(before)
    flashGalleryError(t('management.showcasePreview.editors.photoBandSaveFailed'))
  } finally {
    placingId.value = null
  }
}

// Methods
const closing = ref(false)

/** Anything still waiting — an order inside its delay, a removal inside its
 *  undo window — is sent on the way out. Closing is not taking it back. */
const handleClose = async () => {
  if (uploading.value || closing.value) return
  closing.value = true
  try {
    await flushOrder()
    await commitPendingRemoval()
  } finally {
    closing.value = false
  }
  emit('close')
}

const openPicker = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    addFiles(Array.from(input.files))
  }
  // Allow re-picking the same file after it was removed from the list
  input.value = ''
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files))
  }
}

const handleDragLeave = (event: DragEvent) => {
  // Only set isDragging to false if we're leaving the drop zone entirely
  const currentTarget = event.currentTarget as HTMLElement
  const relatedTarget = event.relatedTarget as Node
  if (currentTarget && !currentTarget.contains(relatedTarget)) {
    isDragging.value = false
  }
}

const addFiles = (files: File[]) => {
  const imageFiles = files.filter((file) => file.type.startsWith('image/'))

  if (imageFiles.length !== files.length) {
    flashError(t('management.media.uploadModal.error.onlyImages'))
  }

  if (imageFiles.length === 0) return

  const entries: SelectedImage[] = imageFiles.map((file) => ({
    id: nextFileId++,
    original: file,
    optimizedFile: null,
    useOptimized: false,
    pinned: false,
    optimizing: false,
    preview: URL.createObjectURL(file),
  }))
  selectedFiles.value.push(...entries)

  if (optimizeImages.value) {
    // Read the entries back out of the ref: optimizeFiles mutates them from an
    // async callback, and writes to the raw objects would bypass the reactive
    // proxy — the per-row spinner would then never clear on its own.
    void optimizeFiles(selectedFiles.value.slice(-entries.length), false)
  }
}

/** Compute (once) and cache the optimized copy of an entry. */
const ensureOptimizedFile = async (item: SelectedImage) => {
  if (item.optimizedFile || item.optimizing) return
  item.optimizing = true
  try {
    item.optimizedFile = await compressImage(item.original)
  } catch {
    flashError(t('management.media.uploadModal.error.processFailed'))
  } finally {
    item.optimizing = false
  }
}

const optimizeFiles = async (items: SelectedImage[], pin: boolean) => {
  const targets = items.filter((item) => !item.useOptimized || !item.optimizedFile)
  if (targets.length === 0) return

  for (const item of targets) {
    item.useOptimized = true
    if (pin) item.pinned = true
  }

  await Promise.all(targets.map(ensureOptimizedFile))
}

const optimizeOversized = () => {
  void optimizeFiles(
    oversizedFiles.value.filter((item) => !isUnshrinkable(item)),
    true,
  )
}

const removeOversized = () => {
  for (const item of oversizedFiles.value) {
    URL.revokeObjectURL(item.preview)
  }
  selectedFiles.value = selectedFiles.value.filter((item) => !isOversized(item))
}

const toggleOptimizeImages = () => {
  optimizeImages.value = !optimizeImages.value

  if (optimizeImages.value) {
    void optimizeFiles(selectedFiles.value, false)
    return
  }

  // Back to the originals, except where the user optimized a file on purpose
  for (const item of selectedFiles.value) {
    if (!item.pinned) item.useOptimized = false
  }
}

const removeFile = (id: number) => {
  const index = selectedFiles.value.findIndex((item) => item.id === id)
  if (index === -1) return
  URL.revokeObjectURL(selectedFiles.value[index].preview)
  selectedFiles.value.splice(index, 1)
}

const uploadFiles = async () => {
  if (selectedFiles.value.length === 0) return
  if (compressing.value || oversizedFiles.value.length > 0) return

  uploading.value = true
  uploadProgress.value = 0
  currentUpload.value = 1
  error.value = null

  try {
    const files = selectedFiles.value.map(activeFile)
    const totalFiles = files.length

    // Prepare captions array if default caption is provided
    const captions = defaultCaption.value
      ? Array(totalFiles).fill(defaultCaption.value)
      : undefined

    // Simulate progress during upload
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 300)

    // Use bulk upload API
    const response = await mediaService.bulkUploadEventMedia(props.eventId, files, {
      captions,
    })

    // Clear progress simulation
    clearInterval(progressInterval)

    if (response.success && response.data) {
      uploadProgress.value = 100

      // Emit each uploaded photo individually to maintain compatibility
      response.data.photos.forEach((photo) => {
        emit('uploaded', photo)
      })

      // Then the whole gallery as it now stands, for hosts that keep a copy —
      // after sending any removal still waiting on its undo, since the drawer
      // is about to close on it.
      await flushOrder()
      photos.value = byOrder([...photos.value, ...response.data.photos])
      await commitPendingRemoval()
      emit('photos-changed', committedPhotos())

      // Close drawer after successful upload
      emit('close')
    } else {
      error.value = response.message || t('management.media.uploadModal.error.uploadFailed')
    }
  } catch (err) {
    console.error('Upload error:', err)
    error.value = t('management.media.uploadModal.error.uploadFailed')
  } finally {
    uploading.value = false
    currentUpload.value = 0
    uploadProgress.value = 0
  }
}

// Prevent layout shift when locking body scroll
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Escape takes down the top layer: a selection before the drawer.
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return
  if (selectedId.value !== null) selectedId.value = null
  else void handleClose()
}

onMounted(() => {
  void loadPhotos()
  const scrollbarWidth = getScrollbarWidth()
  document.body.style.overflow = 'hidden'
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`
  }
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.removeEventListener('keydown', handleKeydown)
  clearTimeout(errorTimer)
  clearTimeout(galleryErrorTimer)
  // Taken down without going through handleClose (a host unmounting it): what
  // was waiting still goes to the server, even if no one is left to hear back.
  void flushOrder()
  void commitPendingRemoval()
  for (const item of selectedFiles.value) {
    URL.revokeObjectURL(item.preview)
  }
})
</script>

<style scoped>
/* The undo bar rises a little from the footer it sits on, and sinks back into
   it. Out faster than in. */
.undo-bar-enter-active {
  transition:
    opacity 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.undo-bar-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.undo-bar-enter-from,
.undo-bar-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}

/* The selection bar's actions: an icon over a short name, the way a toolbar
   names its tools. Seven share a 390px phone's width at a 44px target; a name too long
   for its column is cut rather than wrapped, so every button keeps one height. */
.sel-action {
  flex: 1 1 0;
  min-width: 0;
  min-height: 2.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  padding: 0.375rem 0.25rem;
  border-radius: 0.75rem;
  color: rgb(226 232 240);
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color 150ms ease,
    color 150ms ease,
    opacity 150ms ease,
    transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.sel-action > span {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (hover: hover) and (pointer: fine) {
  .sel-action:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }
}

/* On the press, not the release. */
.sel-action:active:not(:disabled) {
  background: rgba(255, 255, 255, 0.16);
  transform: scale(0.96);
}

.sel-action:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgb(56 189 248);
}

.sel-action:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Featured: the star's own amber, as on the photo's badge. */
.sel-action.is-on {
  color: rgb(251 191 36);
}

/* A band: the sky of the band badge on its thumbnail, not the star's amber. */
.sel-action.is-on--band {
  color: rgb(125 211 252);
}

/* The cover photo: the emerald of its badge on the thumbnail. */
.sel-action.is-on--cover {
  color: rgb(110 231 183);
}

/* The band menu's rows: the bar's own material, one section per row. */
.band-option {
  width: 100%;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  color: rgb(226 232 240);
  font-size: 0.8125rem;
  font-weight: 500;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 150ms ease;
}

.band-option[aria-checked='true'] {
  color: #fff;
  font-weight: 600;
}

@media (hover: hover) and (pointer: fine) {
  .band-option:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.band-option:active {
  background: rgba(255, 255, 255, 0.16);
  transition: none;
}

.band-option:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px rgb(56 189 248);
}

.sel-action--danger {
  color: rgb(252 165 165);
}

/* Done sizes to its word: it closes the bar rather than acting on the photo,
   and the divider before it says so. */
.sel-action--done {
  flex: 0 0 auto;
  padding-inline: 0.625rem;
  color: rgb(125 211 252);
}

@media (prefers-reduced-motion: reduce) {
  .undo-bar-enter-from,
  .undo-bar-leave-to {
    transform: none;
  }

  .sel-action:active:not(:disabled) {
    transform: none;
  }
}

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}</style>
