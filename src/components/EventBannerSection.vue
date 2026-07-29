<template>
  <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 border border-white/20">
    <!-- Header (click to expand/collapse) -->
    <div class="flex items-start justify-between gap-3">
      <button
        type="button"
        class="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 rounded-lg"
        :aria-expanded="isExpanded"
        :aria-label="t('management.media.sectionToggle')"
        @click="toggle"
      >
        <h5 class="font-semibold text-slate-900">{{ t('management.media.eventBanner.title') }}</h5>
        <p class="text-sm text-slate-600">{{ t('management.media.eventBanner.subtitle') }}</p>
      </button>
      <div class="flex items-center gap-1 flex-shrink-0">
        <button
          v-if="canEdit"
          type="button"
          @click="pickFile"
          :disabled="isBusy"
          :title="changeLabel"
          :aria-label="changeLabel"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 border border-dashed border-slate-300 rounded-full hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loader v-if="isBusy" class="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          <ImagePlus v-else class="w-3.5 h-3.5" aria-hidden="true" />
          <span>{{ changeLabel }}</span>
        </button>
        <button
          type="button"
          class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          :aria-expanded="isExpanded"
          :aria-label="t('management.media.sectionToggle')"
          :title="t('management.media.sectionToggle')"
          @click="toggle"
        >
          <ChevronDown
            class="w-4 h-4 transition-transform duration-200"
            :class="{ 'rotate-180': isExpanded }"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>

    <Transition name="collapse">
      <div v-if="isExpanded" class="grid grid-rows-[1fr]">
        <div class="min-h-0 overflow-hidden">
          <div class="pt-6 space-y-4">
            <!-- Upload error -->
            <div
              v-if="mediaUpload.error.value"
              class="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2"
            >
              <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p class="flex-1 text-sm text-red-700">{{ mediaUpload.error.value }}</p>
            </div>

            <!-- Empty State — only when there is nothing at all to preview.
                 With no banner but a logo/photo to fall back on, the card below
                 still renders it: that fallback *is* what recipients get. -->
            <button
              v-if="!previewImage"
              type="button"
              :disabled="!canEdit || isBusy"
              @click="pickFile"
              class="w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300"
              :class="
                canEdit
                  ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200'
                  : 'border-slate-300 bg-slate-50 cursor-default'
              "
            >
              <ImagePlus
                class="w-8 h-8 text-slate-400 mx-auto mb-3"
                :class="{ 'group-hover:text-emerald-600 transition-colors': canEdit }"
                aria-hidden="true"
              />
              <span
                class="block font-semibold text-slate-600"
                :class="{ 'group-hover:text-slate-900 transition-colors': canEdit }"
              >
                {{ t('management.media.eventBanner.empty.title') }}
              </span>
              <span class="block text-sm text-slate-500 mt-1">
                {{ t('management.media.eventBanner.empty.description') }}
              </span>
              <span v-if="canEdit" class="block text-xs text-slate-400 mt-1">
                {{ t('management.media.eventBanner.empty.hint') }}
              </span>
            </button>

            <!-- Link preview group: micro-heading + per-item icon actions, then
                 the preview card itself — the same anatomy the Agenda section
                 uses for a day group. -->
            <div v-else class="space-y-2">
              <div class="flex items-center justify-between gap-2">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-0 truncate">
                  {{ t('management.media.eventBanner.previewLabel') }}
                </p>
                <!-- Crop/Remove act on the banner itself, so they only exist
                     once there is one — not for a logo/photo fallback. -->
                <div v-if="canEdit && hasBanner" class="flex items-center flex-shrink-0">
                  <button
                    type="button"
                    @click="openCropperForCurrent"
                    :disabled="isBusy"
                    :title="t('management.media.mediaUploads.banner.crop')"
                    :aria-label="t('management.media.mediaUploads.banner.crop')"
                    class="p-1.5 text-slate-400 hover:text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Crop class="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    @click="showDeleteModal = true"
                    :disabled="isBusy"
                    :title="t('management.media.eventBanner.remove')"
                    :aria-label="t('management.media.eventBanner.remove')"
                    class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 class="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <!-- A mock-up of the card messaging apps render for a shared
                   showcase link. Nothing overlays the image — the whole point
                   is seeing the banner exactly as guests will. The image is the
                   shortcut to the picker (the header pill is the discoverable
                   path); the text below it is click-to-edit, so the card can't
                   be one big button. -->
              <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <component
                  :is="canEdit ? 'button' : 'div'"
                  :type="canEdit ? 'button' : undefined"
                  :disabled="canEdit ? isBusy : undefined"
                  :aria-label="canEdit ? changeLabel : undefined"
                  :title="canEdit ? changeLabel : undefined"
                  class="block w-full aspect-banner relative overflow-hidden bg-slate-100"
                  :class="
                    canEdit
                      ? 'cursor-pointer transition-opacity duration-200 hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 disabled:opacity-60 disabled:cursor-not-allowed'
                      : ''
                  "
                  @click="canEdit ? pickFile() : undefined"
                >
                  <img
                    :src="previewImage"
                    :alt="event?.title || t('management.media.eventBanner.title')"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />

                  <!-- Busy overlay (preparing the crop source, or uploading) -->
                  <div
                    v-if="isBusy"
                    class="absolute inset-0 bg-white/70 flex items-center justify-center"
                  >
                    <div class="flex items-center gap-2 text-slate-600">
                      <div
                        class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
                      ></div>
                      <span class="text-sm font-medium">
                        {{ t('management.media.mediaUploads.drawer.uploading') }}
                      </span>
                    </div>
                  </div>
                </component>

                <div class="p-4 border-t border-slate-100">
                  <div class="text-xs text-slate-500 uppercase tracking-wide mb-1">{{ hostname }}</div>

                  <!-- Title: the event title plus the fixed greeting the
                       showcase appends. Clicking the line edits the title only
                       — the suffix is a constant in EventShowcaseRefactored.vue.
                       No `block` alongside `line-clamp-2`: the clamp sets its
                       own display, and which utility wins would come down to
                       stylesheet order. -->
                  <div class="text-base font-semibold text-slate-900 mb-1">
                    <input
                      v-if="editingField === 'title'"
                      :ref="setEditInputRef"
                      v-model="draft"
                      type="text"
                      @keydown.enter.prevent="commitEdit"
                      @keydown.esc.prevent="cancelEdit"
                      @blur="commitEdit"
                      class="w-full px-1 -mx-1 py-0 text-base font-semibold text-slate-900 bg-white border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                    <button
                      v-else-if="canEdit"
                      type="button"
                      @click="startEdit('title')"
                      :disabled="!!savingField"
                      :title="t('management.media.eventBanner.inlineEdit.titleHint')"
                      class="w-full text-left line-clamp-2 rounded px-0.5 -mx-0.5 hover:text-sky-600 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 transition-colors"
                      :class="{ 'opacity-50': savingField === 'title' }"
                    >{{ eventTitle }}{{ META_TITLE_SUFFIX }}</button>
                    <span v-else class="line-clamp-2">{{ eventTitle }}{{ META_TITLE_SUFFIX }}</span>
                  </div>

                  <!-- Description: saved as the event's short description, the
                       first thing createEventDescription() reaches for. -->
                  <div class="text-sm text-slate-600">
                    <textarea
                      v-if="editingField === 'description'"
                      :ref="setEditInputRef"
                      v-model="draft"
                      rows="3"
                      maxlength="300"
                      @keydown.enter.prevent="commitEdit"
                      @keydown.esc.prevent="cancelEdit"
                      @blur="commitEdit"
                      class="w-full px-1 -mx-1 py-0 text-sm text-slate-600 bg-white border border-sky-300 rounded resize-none overflow-y-auto focus:outline-none focus:ring-2 focus:ring-sky-200"
                    ></textarea>
                    <button
                      v-else-if="canEdit"
                      type="button"
                      @click="startEdit('description')"
                      :disabled="!!savingField"
                      :title="t('management.media.eventBanner.inlineEdit.descriptionHint')"
                      class="w-full text-left line-clamp-2 rounded px-0.5 -mx-0.5 hover:text-sky-600 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 transition-colors"
                      :class="{ 'opacity-50': savingField === 'description' }"
                    >
                      {{ metaDescription }}
                    </button>
                    <span v-else class="line-clamp-2">{{ metaDescription }}</span>
                  </div>
                </div>
              </div>

              <p v-if="canEdit" class="text-xs text-slate-500">
                {{
                  hasBanner
                    ? t('management.media.eventBanner.sizeNote')
                    : t('management.media.eventBanner.noBannerHint')
                }}
              </p>
            </div>

            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileChange"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Banner Image Cropper Modal -->
    <ImageCropperModal
      v-if="showCropper"
      :show="showCropper"
      :image-source="cropperImage"
      :title="t('management.media.mediaUploads.banner.cropperTitle')"
      :aspect-ratio="BANNER_IMAGE.ASPECT_RATIO"
      cropper-height="400px"
      safe-zones
      image-restriction="stencil"
      :help-text="t('management.media.mediaUploads.banner.cropperHelpText')"
      @close="closeCropper"
      @apply="applyCrop"
      @update:cropper-ref="setCropperRef"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="mediaUpload.deleting.value"
      :title="t('management.media.eventBanner.deleteTitle')"
      :item-name="t('management.media.eventBanner.title')"
      @confirm="handleRemove"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * The event banner image, presented as the link-preview card messaging apps
 * render when a host shares their showcase URL.
 *
 * The banner's only real job is being that preview image (it is exactly what
 * `og:image` serves), so it is edited in the shape it will be seen in rather
 * than as a filename row — this is why it lives here instead of alongside the
 * logos in MediaUploadsSection's Brand Assets list.
 *
 * The card's headline and blurb are click-to-edit for the same reason: they are
 * `og:title` and `og:description`, so the place to fix a bad one is the mock-up
 * that shows it being bad — not a form field two tabs away.
 */
import { computed, nextTick, ref, toRef } from 'vue'
import { AlertCircle, ChevronDown, Crop, ImagePlus, Loader, Trash2 } from 'lucide-vue-next'
import { eventsService, type Event } from '@/services/api'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useNotifications } from '@/composables/useNotifications'
import { useCollapsibleSection } from '@/composables/useCollapsibleSection'
import { useMediaUpload } from '@/composables/useMediaUpload'
import { useBannerCropUpload } from '@/composables/useBannerCropUpload'
import { BANNER_IMAGE } from '@/constants/media'
import { BANNER_WIDTHS, getBannerUrl } from '@/utils/mediaUrl'
import { createEventDescription, getBestEventImage } from '@/utils/metaUtils'
import ImageCropperModal from './common/ImageCropperModal.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

interface Props {
  event?: Event
  canEdit: boolean
}

interface Emits {
  (e: 'updated', event: Event): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useAppLanguage()
const { error: notifyError } = useNotifications()

const { isExpanded, toggle } = useCollapsibleSection('eventBanner')

const eventRef = toRef(props, 'event')
const mediaUpload = useMediaUpload(eventRef, (updated) => emit('updated', updated))
const {
  showCropper,
  cropperImage,
  preparing,
  startCrop,
  openCropperForCurrent,
  closeCropper,
  setCropperRef,
  applyCrop,
} = useBannerCropUpload(eventRef, mediaUpload)

const isBusy = computed(() => preparing.value || mediaUpload.isUploading.value('banner_image'))

const hasBanner = computed(() => !!props.event?.banner_image)

const changeLabel = computed(() =>
  hasBanner.value
    ? t('management.media.eventBanner.change')
    : t('management.media.eventBanner.add'),
)

/** metaUtils works on plain records; Event satisfies the fields it reads. */
const metaSource = computed(() => (props.event ?? {}) as unknown as Record<string, unknown>)

// Mirror what the showcase actually puts in og:image — banner first, then the
// logo/photo fallbacks — so the card shows what recipients really see, not an
// idealised version of it. `page` width because the card spans the full section
// in the full-width Showcase tab, not just a narrow column.
const previewImage = computed(
  () => getBannerUrl(getBestEventImage(metaSource.value), BANNER_WIDTHS.page) ?? null,
)

const hostname = computed(() => window.location.hostname)

/** The greeting the showcase appends to every og:title — a constant there, so
 *  it is shown but not editable here. Kept in sync with updateEventMetaTags()
 *  in EventShowcaseRefactored.vue. */
const META_TITLE_SUFFIX = ' - សូមគោរពអញ្ជើញ ភ្ញៀវកិត្តិយស'

const eventTitle = computed(
  () => props.event?.title || t('management.media.eventBanner.inlineEdit.titlePlaceholder'),
)

const metaDescription = computed(() =>
  props.event ? createEventDescription(metaSource.value) : '',
)

// ---- Editing the preview text in place ----
//
// Both lines are derived, not stored: the title is `event.title` plus the
// constant above, and the description is whatever createEventDescription()
// resolves — short_description, else a truncation of the full description, else
// a generated sentence. Editing therefore writes to the two fields those come
// from, and the description opens on the text as *displayed* so click-to-edit
// promotes a fallback into short_description instead of starting from blank.

type MetaField = 'title' | 'description'

const editingField = ref<MetaField | null>(null)
const savingField = ref<MetaField | null>(null)
const draft = ref('')

/** Function ref: focus + select the field as it renders, guarded so re-renders
 *  while typing don't re-select the text. */
const setEditInputRef = (el: unknown) => {
  if (
    (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) &&
    document.activeElement !== el
  ) {
    nextTick(() => {
      el.focus()
      el.select()
    })
  }
}

const currentValue = (field: MetaField) =>
  field === 'title' ? (props.event?.title ?? '') : metaDescription.value

const startEdit = (field: MetaField) => {
  if (savingField.value) return
  draft.value = currentValue(field)
  editingField.value = field
}

const cancelEdit = () => {
  editingField.value = null
}

const commitEdit = async () => {
  const field = editingField.value
  // Also the guard for the blur that follows Enter/Escape closing the field.
  if (!field) return
  editingField.value = null

  const next = draft.value.trim()
  // Comparing against what was on screen keeps a click in and straight back out
  // of a derived description from persisting that derived text.
  if (!props.event?.id || next === currentValue(field).trim()) return
  // The title is required — the showcase headline is built from it.
  if (field === 'title' && !next) return

  savingField.value = field
  try {
    const response = await eventsService.patchEvent(
      props.event.id,
      field === 'title' ? { title: next } : { short_description: next },
    )
    if (response.success && response.data) {
      emit('updated', response.data)
    } else {
      notifyError(t('management.media.eventBanner.inlineEdit.saveFailed'), response.message)
    }
  } catch {
    notifyError(t('management.media.eventBanner.inlineEdit.saveFailed'))
  } finally {
    savingField.value = null
  }
}

// ---- Picking a new banner ----

const fileInputRef = ref<HTMLInputElement | null>(null)

const pickFile = () => {
  if (isBusy.value) return
  mediaUpload.clearError()
  fileInputRef.value?.click()
}

const handleFileChange = (e: globalThis.Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  // Reset first so picking the same file again still fires `change`
  target.value = ''
  if (file) startCrop(file)
}

// ---- Removing the banner ----

const showDeleteModal = ref(false)

const handleRemove = async () => {
  await mediaUpload.removeMedia('banner_image')
  showDeleteModal.value = false
}
</script>

<style scoped>
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

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none;
  }
}
</style>
