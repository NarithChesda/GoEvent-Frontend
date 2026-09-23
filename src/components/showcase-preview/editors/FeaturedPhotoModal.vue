<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-[1000] overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-3xl shadow-2xl p-4 sm:p-6 w-full max-w-lg" @click.stop>
            <div class="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 class="text-base font-semibold text-slate-900">
                  {{
                    stackLayout
                      ? t('management.showcasePreview.editors.stackPhotosTitle')
                      : t('management.showcasePreview.editors.featuredPhotoTitle')
                  }}
                </h3>
                <p class="text-xs sm:text-sm text-slate-500 mt-1">
                  {{ description }}
                </p>
              </div>
              <button
                type="button"
                class="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors duration-200 flex-shrink-0"
                :aria-label="t('management.showcasePreview.editors.cancel')"
                @click="close"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="flex items-center justify-center py-12 text-slate-400">
              <Loader class="w-6 h-6 animate-spin" />
            </div>

            <!-- Error -->
            <div
              v-else-if="error"
              class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
            >
              {{ error }}
            </div>

            <!-- Empty: no photos uploaded yet -->
            <div
              v-else-if="photos.length === 0"
              class="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-slate-200"
            >
              <ImagePlus class="w-8 h-8 mx-auto mb-3 text-slate-400" />
              <p class="text-sm font-medium text-slate-700">
                {{ t('management.showcasePreview.editors.featuredPhotoEmpty') }}
              </p>
              <p class="text-xs text-slate-500 mt-1">
                {{ t('management.showcasePreview.editors.featuredPhotoUploadPrompt') }}
              </p>
              <button
                type="button"
                class="mt-4 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-md transition-all duration-200"
                @click="requestUpload"
              >
                {{ t('management.showcasePreview.editors.featuredPhotoUploadButton') }}
              </button>
            </div>

            <template v-else>
              <!-- Which photo vs. how it's framed are separate decisions; the
                   crop tab is only reachable once there's a photo to frame. -->
              <div class="flex items-center gap-1 p-1 mb-4 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  class="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-200"
                  :class="
                    tab === 'choose'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  "
                  @click="tab = 'choose'"
                >
                  {{ t('management.showcasePreview.editors.cropTabChoose') }}
                </button>
                <button
                  type="button"
                  class="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  :class="
                    tab === 'crop'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  "
                  :disabled="!featuredPhoto"
                  :title="
                    featuredPhoto ? undefined : t('management.showcasePreview.editors.cropNeedsPhoto')
                  "
                  @click="tab = 'crop'"
                >
                  {{ t('management.showcasePreview.editors.cropTabAdjust') }}
                </button>
              </div>

              <!-- Grid picker -->
              <div v-if="tab === 'choose'" class="grid grid-cols-3 gap-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
                <button
                  v-for="photo in photos"
                  :key="photo.id"
                  type="button"
                  class="relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-150 disabled:opacity-60 disabled:cursor-wait"
                  :class="photo.is_featured ? 'border-[#1e90ff]' : 'border-transparent hover:border-slate-300'"
                  :disabled="updatingId !== null"
                  @click="toggleFeatured(photo)"
                >
                  <img :src="photo.image" :alt="photo.caption || ''" class="w-full h-full object-cover" />
                  <span
                    v-if="photo.is_featured"
                    class="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-[#1e90ff] text-white shadow"
                  >
                    <Star class="w-3 h-3 fill-current" />
                  </span>
                  <span
                    v-if="updatingId === photo.id"
                    class="absolute inset-0 flex items-center justify-center bg-black/30"
                  >
                    <Loader class="w-4 h-4 text-white animate-spin" />
                  </span>
                </button>
              </div>

              <!-- Frame -->
              <div v-else-if="activeFrame">
                <!-- The photos the stack reveals, in order, each drawn in the
                     shape of the frame it lands in and framed live — so the
                     row is both the picker and the preview. Only for the
                     stack: a full-screen stage draws one photo. -->
                <div
                  v-if="frames.length > 1"
                  class="flex items-center gap-2.5 overflow-x-auto px-1 pt-1 pb-2 mb-2 -mx-1"
                >
                  <button
                    v-for="(frame, k) in frames"
                    :key="frame.photo.id"
                    type="button"
                    class="relative shrink-0 rounded-[3px] transition-[opacity,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e90ff] focus-visible:ring-offset-2"
                    :class="
                      frame.photo.id === activeFrame.photo.id
                        ? 'ring-2 ring-[#1e90ff] ring-offset-2'
                        : 'opacity-60 hover:opacity-100'
                    "
                    :aria-label="
                      t('management.showcasePreview.editors.cropPhotoPosition', {
                        n: k + 1,
                        total: frames.length,
                      })
                    "
                    :aria-pressed="frame.photo.id === activeFrame.photo.id"
                    @click="activeId = frame.photo.id"
                  >
                    <FramedPhotoThumb
                      :image-url="frame.photo.image"
                      :region="regionOf(frame.photo)"
                      :aspect="frame.aspect"
                    />
                    <span
                      v-if="isDirty(frame.photo)"
                      class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#1e90ff] ring-2 ring-white"
                      :title="t('management.showcasePreview.editors.cropUnsaved')"
                    />
                  </button>
                </div>

                <PhotoFramingEditor
                  :key="activeFrame.photo.id"
                  :model-value="regionOf(activeFrame.photo)"
                  :image-url="activeFrame.photo.image"
                  :frame-aspect="activeFrame.aspect"
                  @update:model-value="setDraft(activeFrame.photo, $event)"
                />

                <!-- The PATCH succeeds against a server that doesn't know these
                     fields yet (unknown keys are dropped), so "saved" would be
                     a lie without checking the echo. -->
                <div
                  v-if="cropUnsupported"
                  class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800"
                >
                  {{ t('management.showcasePreview.editors.cropUnsupported') }}
                </div>

                <div
                  v-else-if="cropError"
                  class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700"
                >
                  {{ cropError }}
                </div>

                <div class="flex items-center justify-end gap-2 mt-4">
                  <button
                    type="button"
                    class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                    @click="close"
                  >
                    {{ t('management.showcasePreview.editors.cancel') }}
                  </button>
                  <button
                    type="button"
                    class="px-5 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    :disabled="savingCrop || dirtyPhotos.length === 0"
                    @click="saveCrop"
                  >
                    {{
                      savingCrop
                        ? t('management.showcasePreview.editors.saving')
                        : t('management.showcasePreview.editors.save')
                    }}
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { X, Star, ImagePlus, Loader } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { mediaService, type EventPhoto } from '@/services/api'
import type { StackLayoutType } from '@/services/api/types/template.types'
import {
  SHOWCASE_FRAME_ASPECT,
  cropsEqual,
  resolvePhotoCrop,
  responseSupportsPhotoCrop,
  toPhotoCropPayload,
  type PhotoCrop,
} from '@/utils/photoCrop'
import { stackPhotosFor } from '@/components/showcase/photo-stack/photoStack'
import { stackFrameAspect } from '@/components/showcase/photo-stack/geometry'
import PhotoFramingEditor from './PhotoFramingEditor.vue'
import FramedPhotoThumb from './FramedPhotoThumb.vue'

interface Props {
  modelValue: boolean
  eventId: string
  /** Which tab to open on. The transition stage's crop button asks for
   *  'crop' directly; tapping the photo itself asks for 'choose'. */
  initialFocus?: 'choose' | 'crop'
  /** Set when the preview is showing the photo stack: every photograph it
   *  reveals is framed here, each in its own frame's shape. Absent means a
   *  full-screen stage, which draws the featured photo alone. */
  stackLayout?: StackLayoutType | null
  /** Which photograph to open on — the one that was tapped in the stack. */
  initialPhotoId?: number | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
  /** No photos to pick from — let the parent open the upload drawer instead. */
  uploadRequested: []
}>()

const { t } = useAppLanguage()

const loading = ref(false)
const error = ref<string | null>(null)
const photos = ref<EventPhoto[]>([])
const updatingId = ref<number | null>(null)

const tab = ref<'choose' | 'crop'>('choose')

const featuredPhoto = computed(() => photos.value.find((p) => p.is_featured) ?? null)

const description = computed(() => {
  if (tab.value === 'crop') {
    return props.stackLayout
      ? t('management.showcasePreview.editors.cropStackDescription')
      : t('management.showcasePreview.editors.cropDescription')
  }
  return props.stackLayout
    ? t('management.showcasePreview.editors.featuredPhotoStackDescription')
    : t('management.showcasePreview.editors.featuredPhotoDescription')
})

// --- Frames ------------------------------------------------------------------

interface Frame {
  photo: EventPhoto
  /** Width ÷ height of the frame this photo lands in. */
  aspect: number
}

/**
 * Every photograph the stage will draw, in the order it draws them, with the
 * shape it draws each one in. Derived here rather than handed over by the
 * preview, so choosing a different featured photo on the other tab re-deals
 * the stack exactly as the stage will.
 */
const frames = computed<Frame[]>(() => {
  const layout = props.stackLayout
  if (layout) {
    const chosen = stackPhotosFor(photos.value, layout)
    return chosen.map((photo, k) => ({
      photo,
      aspect: stackFrameAspect(layout, chosen.length, k),
    }))
  }
  return featuredPhoto.value ? [{ photo: featuredPhoto.value, aspect: SHOWCASE_FRAME_ASPECT }] : []
})

const activeId = ref<number | null>(null)

const activeFrame = computed(
  () => frames.value.find((f) => f.photo.id === activeId.value) ?? frames.value[0] ?? null,
)

// --- Drafts --------------------------------------------------------------------
// One per photograph, kept across switching between them, so a whole stack can
// be framed and saved in one go.

const drafts = reactive<Record<number, PhotoCrop>>({})

const regionOf = (photo: EventPhoto): PhotoCrop => drafts[photo.id] ?? resolvePhotoCrop(photo)

/** The editor never emits for merely opening a photo, so any draft that
 *  differs from what is stored is a real edit. */
const isDirty = (photo: EventPhoto): boolean =>
  photo.id in drafts && !cropsEqual(drafts[photo.id], resolvePhotoCrop(photo))

const dirtyPhotos = computed(() => frames.value.map((f) => f.photo).filter(isDirty))

const setDraft = (photo: EventPhoto, region: PhotoCrop) => {
  drafts[photo.id] = region
  cropError.value = null
  cropUnsupported.value = false
}

const clearDrafts = () => {
  for (const id of Object.keys(drafts)) delete drafts[Number(id)]
}

const savingCrop = ref(false)
const cropError = ref<string | null>(null)
/** Set when a save round-trips without the crop fields coming back. */
const cropUnsupported = ref(false)

// --- Load --------------------------------------------------------------------

const loadPhotos = async () => {
  loading.value = true
  error.value = null
  clearDrafts()
  cropError.value = null
  cropUnsupported.value = false
  try {
    const response = await mediaService.getEventMedia(props.eventId)
    if (response.success && response.data) {
      photos.value = response.data.results
      activeId.value = props.initialPhotoId ?? null
      // Honour the requested tab only once we know there's something to frame.
      tab.value = props.initialFocus === 'crop' && featuredPhoto.value ? 'crop' : 'choose'
    } else {
      error.value = t('management.showcasePreview.editors.featuredPhotoLoadFailed')
    }
  } catch {
    error.value = t('management.showcasePreview.editors.featuredPhotoLoadFailed')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) loadPhotos()
  },
)

const close = () => emit('update:modelValue', false)

const requestUpload = () => {
  close()
  emit('uploadRequested')
}

// --- Choose which photo ------------------------------------------------------

// Single-select: picking a photo features it and un-features whichever one
// was featured before; clicking the already-featured photo clears it.
const toggleFeatured = async (photo: EventPhoto) => {
  if (updatingId.value !== null) return
  const makeFeatured = !photo.is_featured
  const previousFeatured = photos.value.find((p) => p.is_featured && p.id !== photo.id)

  updatingId.value = photo.id
  try {
    if (makeFeatured && previousFeatured) {
      await mediaService.updateEventMedia(props.eventId, previousFeatured.id, { is_featured: false })
    }
    const response = await mediaService.updateEventMedia(props.eventId, photo.id, {
      is_featured: makeFeatured,
    })
    if (response.success && response.data) {
      photos.value = photos.value.map((p) => {
        if (p.id === photo.id) return response.data as EventPhoto
        if (makeFeatured && previousFeatured && p.id === previousFeatured.id) {
          return { ...p, is_featured: false }
        }
        return p
      })
      emit('saved')
      // Choosing a photo and framing it are one continuous decision — hand the
      // organizer straight to the frame, on the photo they just chose.
      if (makeFeatured) {
        activeId.value = photo.id
        tab.value = 'crop'
      }
    } else {
      error.value = t('management.showcasePreview.editors.featuredPhotoUpdateFailed')
    }
  } catch {
    error.value = t('management.showcasePreview.editors.featuredPhotoUpdateFailed')
  } finally {
    updatingId.value = null
  }
}

// --- Save --------------------------------------------------------------------

const saveCrop = async () => {
  const targets = dirtyPhotos.value
  if (!targets.length || savingCrop.value) return

  savingCrop.value = true
  cropError.value = null
  cropUnsupported.value = false
  try {
    const results = await Promise.all(
      targets.map((photo) =>
        mediaService
          .updateEventMedia(props.eventId, photo.id, toPhotoCropPayload(drafts[photo.id]))
          .catch(() => null),
      ),
    )
    let savedAny = false
    results.forEach((response, k) => {
      const photo = targets[k]
      if (!response?.success || !response.data) {
        cropError.value =
          response?.message || t('management.showcasePreview.editors.cropSaveFailed')
        return
      }
      if (!responseSupportsPhotoCrop(response.data)) {
        // Keep the draft on screen — it isn't stored, and saying otherwise would
        // send the organizer off to look for a change that never happened.
        cropUnsupported.value = true
        return
      }
      const saved = response.data
      photos.value = photos.value.map((p) => (p.id === photo.id ? saved : p))
      delete drafts[photo.id]
      savedAny = true
    })
    // Refreshes the preview frames so the new framing is visible immediately.
    if (savedAny) emit('saved')
  } finally {
    savingCrop.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active > div:last-child > div,
.modal-leave-active > div:last-child > div {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child > div,
.modal-leave-to > div:last-child > div {
  transform: scale(0.95);
}
</style>
