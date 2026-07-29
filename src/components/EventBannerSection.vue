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
      <button
        type="button"
        class="p-2 -mt-1 -mr-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
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

            <!-- Link preview card: a mock-up of the card messaging apps render
                 for a shared showcase link. Nothing overlays the image — the
                 whole point is seeing the banner exactly as guests will. The
                 card doubles as a shortcut to the picker; the labelled buttons
                 below are the discoverable path. -->
            <component
              :is="canEdit ? 'button' : 'div'"
              :type="canEdit ? 'button' : undefined"
              :disabled="canEdit ? isBusy : undefined"
              :aria-label="canEdit ? changeLabel : undefined"
              class="block w-full text-left border border-slate-300 rounded-xl overflow-hidden bg-white"
              :class="
                canEdit
                  ? 'transition-all duration-300 hover:border-slate-400 hover:shadow-lg hover:shadow-slate-200/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 disabled:opacity-60 disabled:cursor-not-allowed'
                  : ''
              "
              @click="canEdit ? pickFile() : undefined"
            >
              <div class="aspect-banner relative overflow-hidden bg-slate-200">
                <img
                  v-if="previewImage"
                  :src="previewImage"
                  :alt="event?.title || t('management.media.eventBanner.title')"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex flex-col items-center justify-center gap-2">
                  <ImageIcon class="w-10 h-10 text-slate-400" aria-hidden="true" />
                  <span class="text-xs font-medium text-slate-500">
                    {{ t('management.media.eventBanner.empty') }}
                  </span>
                </div>

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
              </div>

              <div class="p-4 border-t border-slate-100">
                <div class="text-xs text-slate-500 uppercase tracking-wide mb-1">{{ hostname }}</div>
                <div class="text-base font-semibold text-slate-900 mb-1 line-clamp-2">{{ metaTitle }}</div>
                <div class="text-sm text-slate-600 line-clamp-2">{{ metaDescription }}</div>
              </div>
            </component>

            <!-- Actions. Always one row: labels drop out as the section
                 narrows (see the container queries below) rather than wrapping.
                 Deliberately not the dashed "Add X" pill recipe — the Design
                 Studio panel strips the label off those (see
                 ShowcasePreviewTab.vue), leaving a bare icon. -->
            <div v-if="canEdit" class="space-y-2">
              <div class="banner-actions">
                <div class="flex items-center gap-2 overflow-hidden">
                  <button
                    type="button"
                    @click="pickFile"
                    :disabled="isBusy"
                    :title="changeLabel"
                    :aria-label="changeLabel"
                    class="banner-action bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white font-semibold shadow-md hover:opacity-90 transition-all duration-200"
                  >
                    <Loader v-if="isBusy" class="w-4 h-4 flex-shrink-0 animate-spin" aria-hidden="true" />
                    <ImagePlus v-else class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span class="banner-action__label">{{ changeLabel }}</span>
                  </button>
                  <button
                    v-if="hasBanner"
                    type="button"
                    @click="openCropperForCurrent"
                    :disabled="isBusy"
                    :title="t('management.media.mediaUploads.banner.crop')"
                    :aria-label="t('management.media.mediaUploads.banner.crop')"
                    class="banner-action banner-action--secondary font-medium text-slate-600 hover:bg-slate-100 transition-colors duration-200"
                  >
                    <Crop class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span class="banner-action__label">{{ t('management.media.mediaUploads.banner.crop') }}</span>
                  </button>
                  <button
                    v-if="hasBanner"
                    type="button"
                    @click="showDeleteModal = true"
                    :disabled="isBusy"
                    :title="t('management.media.eventBanner.remove')"
                    :aria-label="t('management.media.eventBanner.remove')"
                    class="banner-action banner-action--secondary font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
                  >
                    <Trash2 class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span class="banner-action__label">{{ t('management.media.eventBanner.remove') }}</span>
                  </button>
                </div>
              </div>

              <p class="text-xs text-slate-500">
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
 */
import { computed, ref, toRef } from 'vue'
import { AlertCircle, ChevronDown, Crop, ImageIcon, ImagePlus, Loader, Trash2 } from 'lucide-vue-next'
import type { Event } from '@/services/api'
import { useAppLanguage } from '@/composables/useAppLanguage'
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

// Kept in sync with updateEventMetaTags() in EventShowcaseRefactored.vue.
const metaTitle = computed(() => {
  if (!props.event?.title) return 'សូមគោរពអញ្ជើញ ភ្ញៀវកិត្តិយស'
  return `${props.event.title} - សូមគោរពអញ្ជើញ ភ្ញៀវកិត្តិយស`
})

const metaDescription = computed(() =>
  props.event ? createEventDescription(metaSource.value) : '',
)

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
/* The action row must stay on a single line at every width, shedding labels
   instead of wrapping. This is a *container* query, not a `sm:` breakpoint:
   the section is reused inside the Design Studio's fixed ~440px panel, where
   viewport breakpoints still report "desktop" and would keep every label —
   the same trap ShowcasePreviewTab.vue's own CSS documents. */
.banner-actions {
  container-type: inline-size;
}

.banner-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  min-height: 40px;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  white-space: nowrap;
}

.banner-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Crop/Remove shed their labels first — the primary action keeps its wording
   longest, since it is the one a host is looking for. */
@container (max-width: 400px) {
  .banner-action--secondary .banner-action__label {
    display: none;
  }

  .banner-action--secondary {
    padding-left: 0.625rem;
    padding-right: 0.625rem;
  }
}

/* Safety net for extremely narrow hosts: everything collapses to icons. Each
   button carries title + aria-label, so it stays labelled for pointer and
   assistive tech alike. */
@container (max-width: 250px) {
  .banner-action__label {
    display: none;
  }

  .banner-action {
    padding-left: 0.625rem;
    padding-right: 0.625rem;
  }
}

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
