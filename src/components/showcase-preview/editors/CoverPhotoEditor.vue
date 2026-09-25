<template>
  <!-- A panel, not a modal, for the photo band editor's reason: the framing is
       judged against the frame artwork around it, which only the preview can
       show. No scrim, and every choice is pushed into the frames live
       (`preview`) until it is saved or abandoned. Both choices are stored on
       the photo itself: a flag beside its featured one, and its own framing,
       which it keeps wherever else it appears.

       One editor for every block drawn from a photo the organizer marks for
       it (`role`): the cover's photo frame (`is_cover_photo`) and the
       countdown's strips (`is_countdown_photo`). They differ only in the flag,
       the words, and what shows until a photo is marked. -->
  <Teleport to="body">
    <Transition name="cpe">
      <div
        v-if="modelValue"
        ref="panelRef"
        class="fixed z-[1000] inset-x-0 bottom-0 max-h-[80dvh] rounded-t-3xl md:inset-x-auto md:bottom-auto md:top-4 md:right-4 md:w-[380px] md:max-h-[calc(100dvh-2rem)] md:rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/5 flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)] md:pb-0 focus:outline-none"
        role="dialog"
        aria-modal="false"
        :aria-labelledby="titleId"
        tabindex="-1"
        @keydown.esc.stop="cancel"
      >
        <div class="md:hidden flex justify-center pt-2.5" aria-hidden="true">
          <span class="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        <div class="flex items-start justify-between gap-3 px-4 sm:px-5 pt-3 md:pt-5">
          <div class="min-w-0">
            <h3 :id="titleId" class="text-base font-semibold text-slate-900">
              {{ t(copy.title) }}
            </h3>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">
              {{ t(copy.description) }}
            </p>
          </div>
          <button
            type="button"
            class="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors duration-200 flex-shrink-0"
            :aria-label="t('management.showcasePreview.editors.cancel')"
            @click="cancel"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-5 pt-4 pb-4 space-y-5">
          <div v-if="loading" class="flex items-center justify-center py-10 text-slate-400">
            <Loader class="w-6 h-6 animate-spin" />
          </div>

          <div
            v-else-if="loadError"
            class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
          >
            {{ loadError }}
          </div>

          <div
            v-else-if="photos.length === 0"
            class="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-slate-200"
          >
            <ImagePlus class="w-8 h-8 mx-auto mb-3 text-slate-400" />
            <p class="text-sm font-medium text-slate-700">
              {{ t('management.showcasePreview.editors.featuredPhotoEmpty') }}
            </p>
            <p class="text-xs text-slate-500 mt-1">
              {{ t(copy.uploadPrompt) }}
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
            <!-- Which photo vs how it is framed: the featured photo's editor
                 makes the same split, and framing needs a photo first. -->
            <div class="flex items-center gap-1 p-1 bg-slate-100 rounded-xl" role="tablist">
              <button
                v-for="option in TABS"
                :key="option"
                type="button"
                role="tab"
                :aria-selected="tab === option"
                :disabled="option === 'crop' && !selectedPhoto"
                :title="option === 'crop' && !selectedPhoto ? t('management.showcasePreview.editors.cropNeedsPhoto') : undefined"
                class="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                :class="
                  tab === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                "
                @click="tab = option"
              >
                {{
                  option === 'choose'
                    ? t('management.showcasePreview.editors.cropTabChoose')
                    : t('management.showcasePreview.editors.cropTabAdjust')
                }}
              </button>
            </div>

            <!-- Each photo in the frame's own shape, framed as it would be,
                 so the choice is made on what the cover will show. -->
            <section v-if="tab === 'choose'">
              <div
                class="grid grid-cols-3 gap-2.5"
                role="radiogroup"
                :aria-label="t(copy.title)"
              >
                <button
                  v-for="(photo, k) in photos"
                  :key="photo.id"
                  type="button"
                  role="radio"
                  :aria-checked="photo.id === draftPhotoId"
                  :aria-label="
                    photo.caption ||
                    t('management.showcasePreview.editors.cropPhotoPosition', {
                      n: k + 1,
                      total: photos.length,
                    })
                  "
                  class="relative flex items-center justify-center p-1.5 rounded-xl bg-slate-50 transition-[opacity,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e90ff] focus-visible:ring-offset-2"
                  :class="
                    photo.id === draftPhotoId
                      ? 'ring-2 ring-[#1e90ff] ring-offset-2'
                      : 'opacity-75 hover:opacity-100'
                  "
                  @click="choosePhoto(photo.id)"
                >
                  <FramedPhotoThumb
                    :image-url="photo.image"
                    :region="regionOf(photo)"
                    :aspect="frameAspect"
                    :height="thumbHeight"
                    :style="shapeThumbStyle ?? undefined"
                  />
                  <span
                    v-if="photo.id === draftPhotoId"
                    class="absolute top-1 right-1 flex items-center justify-center w-4 h-4 rounded-full bg-[#1e90ff] text-white shadow"
                  >
                    <Check class="w-2.5 h-2.5" />
                  </span>
                </button>
              </div>

              <p v-if="storedMarkedId === null" class="mt-3 text-xs text-slate-500">
                {{ t(copy.fallbackHint) }}
              </p>
            </section>

            <section v-else-if="selectedPhoto">
              <p class="text-xs sm:text-sm text-slate-500 mb-3">
                {{ t(copy.cropHint) }}
              </p>
              <PhotoFramingEditor
                :key="selectedPhoto.id"
                :model-value="draftRegion"
                :image-url="selectedPhoto.image"
                :frame-aspect="frameAspect"
                :shape-mask="shape"
                @update:model-value="draftCrop = $event"
              />
            </section>

            <!-- A PATCH to a server that doesn't know the field succeeds and
                 drops it, so "saved" would be a lie without checking the echo. -->
            <div
              v-if="unsupported"
              class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800"
            >
              {{ t(copy.unsupported) }}
            </div>
            <div
              v-else-if="cropUnsupported"
              class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800"
            >
              {{ t('management.showcasePreview.editors.cropUnsupported') }}
            </div>
            <div
              v-else-if="saveError"
              class="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700"
            >
              {{ saveError }}
            </div>
          </template>
        </div>

        <div
          v-if="!loading && !loadError && photos.length > 0"
          class="flex-shrink-0 flex items-center gap-2 border-t border-slate-100 px-4 sm:px-5 py-3"
        >
          <button
            v-if="storedMarkedId !== null"
            type="button"
            class="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="saving"
            @click="remove"
          >
            {{ t(copy.remove) }}
          </button>
          <div class="flex-1" />
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            @click="cancel"
          >
            {{ t('management.showcasePreview.editors.cancel') }}
          </button>
          <button
            type="button"
            class="px-5 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            :disabled="saving || draftPhotoId === null || !isDirty"
            @click="save"
          >
            {{
              saving
                ? t('management.showcasePreview.editors.saving')
                : t('management.showcasePreview.editors.save')
            }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { Check, ImagePlus, Loader, X } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { mediaService, type EventPhoto } from '@/services/api'
import {
  cropsEqual,
  resolvePhotoCrop,
  responseSupportsPhotoCrop,
  toPhotoCropPayload,
  type PhotoCrop,
} from '@/utils/photoCrop'
import { coverPhotoPayload, responseSupportsCoverPhoto } from '@/components/showcase/cover/coverPhoto'
import {
  countdownPhotoPayload,
  responseSupportsCountdownPhoto,
} from '@/components/showcase/countdown-rsvp/countdownRsvp'
import type { PhotoFieldPatch } from '../bridge/previewBridge'
import type { CoverPhotoShapeMask } from '../edit/editContext'
import PhotoFramingEditor from './PhotoFramingEditor.vue'
import FramedPhotoThumb from './FramedPhotoThumb.vue'

type PhotoRole = 'cover' | 'countdown'

interface Props {
  modelValue: boolean
  eventId: string
  /** Which block's photo this is. Absent = the cover's, what this editor began as. */
  role?: PhotoRole
  /** Width ÷ height of the photograph's box — the block's own report. */
  frameAspect?: number
  /** The shape the block cuts the photograph to; null frames a plain rectangle. */
  shape?: CoverPhotoShapeMask | null
}

const props = withDefaults(defineProps<Props>(), { role: 'cover', frameAspect: 1, shape: null })
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** Draw these photos this way in the preview frames now; nothing is saved. */
  preview: [photos: PhotoFieldPatch[]]
  /** The whole photo list after a save, in gallery order. */
  saved: [photos: EventPhoto[]]
  /** No photos to pick from — let the parent open the upload drawer instead. */
  uploadRequested: []
}>()

const { t } = useAppLanguage()
const titleId = useId()

type RoleFlag = 'is_cover_photo' | 'is_countdown_photo'

/**
 * Everything that differs between the blocks: which flag marks the photo, the
 * PATCH that sets it, how to tell a server that stores it from one that drops
 * it, and the words. The rest — one photo per event, chosen then framed, live
 * drafts reverted on any close without a save — is the same errand.
 */
const ROLES: Record<
  PhotoRole,
  {
    flag: RoleFlag
    payload: (on: boolean) => Partial<Record<RoleFlag, boolean | null>>
    supports: (photo?: EventPhoto | null) => boolean
    prefix: string
  }
> = {
  cover: {
    flag: 'is_cover_photo',
    payload: coverPhotoPayload,
    supports: responseSupportsCoverPhoto,
    prefix: 'coverPhoto',
  },
  countdown: {
    flag: 'is_countdown_photo',
    payload: countdownPhotoPayload,
    supports: responseSupportsCountdownPhoto,
    prefix: 'countdownPhoto',
  },
}

const role = computed(() => ROLES[props.role])

const copy = computed(() => {
  const key = (name: string) => `management.showcasePreview.editors.${role.value.prefix}${name}`
  return {
    title: key('Title'),
    description: key('Description'),
    uploadPrompt: key('UploadPrompt'),
    fallbackHint: key('FallbackHint'),
    cropHint: key('CropHint'),
    unsupported: key('Unsupported'),
    remove: key('Remove'),
    saveFailed: key('SaveFailed'),
  }
})

const isMarked = (photo: EventPhoto | null | undefined): boolean =>
  photo?.[role.value.flag] === true

const TABS = ['choose', 'crop'] as const
const tab = ref<(typeof TABS)[number]>('choose')

const panelRef = ref<HTMLElement | null>(null)
const loading = ref(false)
const loadError = ref<string | null>(null)
/** The event's photos as stored — what every revert puts back. */
const photos = ref<EventPhoto[]>([])

const storedPhoto = (id: number | null) => photos.value.find((p) => p.id === id) ?? null

/** The photo that was marked for this block when the panel opened. */
const storedMarkedId = ref<number | null>(null)
const draftPhotoId = ref<number | null>(null)
/** A new framing for the chosen photo; null leaves its stored framing alone. */
const draftCrop = ref<PhotoCrop | null>(null)

const selectedPhoto = computed(() => storedPhoto(draftPhotoId.value))

/** The chosen photo's framing: the draft over it, else its own. */
const draftRegion = computed<PhotoCrop>(() => draftCrop.value ?? resolvePhotoCrop(selectedPhoto.value))

/** A thumbnail shows the photo's own framing, or the draft's for the chosen one. */
const regionOf = (photo: EventPhoto): PhotoCrop =>
  photo.id === draftPhotoId.value ? draftRegion.value : resolvePhotoCrop(photo)

/**
 * Thumbnails in the frame's true shape — a squashed one would preview a framing
 * the cover never draws — so a wide frame gets a shorter thumbnail rather than
 * a narrower one, and every one fits its grid cell.
 */
const THUMB_MAX = { width: 88, height: 72 } as const
const thumbHeight = computed(() =>
  Math.max(16, Math.round(Math.min(THUMB_MAX.height, THUMB_MAX.width / Math.max(props.frameAspect, 0.01)))),
)

/**
 * The thumbnails cut to the cover's shape, when it has one — the same mask the
 * cover applies, positioned as the framing editor positions it, so the grid
 * previews the silhouette as well as the framing.
 */
const shapeThumbStyle = computed<Record<string, string> | null>(() => {
  const shape = props.shape
  if (!shape) return null
  const { x, y, width, height } = shape.bounds
  if (!(width > 0) || !(height > 0)) return null
  const at = (offset: number, span: number) => (span >= 1 ? 0 : (offset / (1 - span)) * 100)
  const image = `url("${shape.url}")`
  const size = `${100 / width}% ${100 / height}%`
  const position = `${at(x, width)}% ${at(y, height)}%`
  return {
    maskImage: image,
    WebkitMaskImage: image,
    maskSize: size,
    WebkitMaskSize: size,
    maskPosition: position,
    WebkitMaskPosition: position,
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
  }
})

const isDirty = computed(() => {
  const target = selectedPhoto.value
  if (!target) return false
  if (target.id !== storedMarkedId.value) return true
  return draftCrop.value !== null && !cropsEqual(draftCrop.value, resolvePhotoCrop(target))
})

/** A different photo starts from its own framing, not the last photo's. */
const choosePhoto = (id: number) => {
  if (id === draftPhotoId.value) return
  draftPhotoId.value = id
  draftCrop.value = null
}

const saving = ref(false)
const saveError = ref<string | null>(null)
const unsupported = ref(false)
const cropUnsupported = ref(false)

// --- What the frames are shown ----------------------------------------------------

/** A photo as stored: its flag and its framing. */
const restorePatch = (id: number): PhotoFieldPatch => {
  const photo = storedPhoto(id)
  return {
    id,
    [role.value.flag]: isMarked(photo),
    crop_x: photo?.crop_x ?? null,
    crop_y: photo?.crop_y ?? null,
    crop_width: photo?.crop_width ?? null,
    crop_height: photo?.crop_height ?? null,
  }
}

/** The draft, as changes to photos: the chosen one becomes this block's photo,
 *  and the one that was stops being it. */
const draftPatches = computed<PhotoFieldPatch[]>(() => {
  const target = draftPhotoId.value
  if (target === null) return []
  const patches: PhotoFieldPatch[] = []
  if (storedMarkedId.value !== null && storedMarkedId.value !== target) {
    patches.push({ id: storedMarkedId.value, ...role.value.payload(false) })
  }
  patches.push({
    id: target,
    ...role.value.payload(true),
    ...(draftCrop.value ? toPhotoCropPayload(draftCrop.value) : {}),
  })
  return patches
})

// Throttled: the zoom slider and the wheel commit a new framing on every step,
// and each patch re-renders the frame's whole stage.
const PREVIEW_INTERVAL_MS = 120
let previewTimer: ReturnType<typeof setTimeout> | null = null
let lastPreviewAt = 0
/** Every photo the frames have been shown a draft of since opening. */
const previewedIds = new Set<number>()
/** Open as far as this panel is concerned — false from the moment it asks to close. */
const active = ref(false)

/**
 * Each photo is sent whole — as stored, with the draft over it — so a photo
 * chosen earlier and then abandoned goes back to how it is stored in the same
 * message.
 */
const flushPreview = () => {
  previewTimer = null
  lastPreviewAt = Date.now()
  const draft = new Map(draftPatches.value.map((patch) => [patch.id, patch]))
  for (const id of draft.keys()) previewedIds.add(id)
  emit(
    'preview',
    [...previewedIds].map((id) => ({ ...restorePatch(id), ...draft.get(id) })),
  )
}

const schedulePreview = () => {
  if (previewTimer) return
  const wait = PREVIEW_INTERVAL_MS - (Date.now() - lastPreviewAt)
  if (wait <= 0) flushPreview()
  else previewTimer = setTimeout(flushPreview, wait)
}

const cancelPreview = () => {
  if (previewTimer) clearTimeout(previewTimer)
  previewTimer = null
}

onBeforeUnmount(cancelPreview)

watch(draftPatches, () => {
  if (active.value && draftPatches.value.length) schedulePreview()
})

// --- Open / close ----------------------------------------------------------------

const loadPhotos = async () => {
  loading.value = true
  loadError.value = null
  try {
    const response = await mediaService.getEventMedia(props.eventId)
    if (response.success && response.data) {
      photos.value = [...response.data.results].sort((a, b) => a.order - b.order)
    } else {
      loadError.value = t('management.showcasePreview.editors.featuredPhotoLoadFailed')
    }
  } catch {
    loadError.value = t('management.showcasePreview.editors.featuredPhotoLoadFailed')
  } finally {
    loading.value = false
  }
}

/**
 * Open on the marked photo as stored, straight on its framing — the likelier
 * errand once one is chosen. With none chosen, nothing is selected and nothing
 * is previewed: the block keeps showing its fallback (the cover the host's
 * photo, the strips the featured one) until a photo is actually picked, rather
 * than swapping it for one the organizer didn't choose.
 */
const seedDraft = () => {
  const stored = photos.value.find((p) => isMarked(p)) ?? null
  storedMarkedId.value = stored?.id ?? null
  draftPhotoId.value = stored?.id ?? null
  draftCrop.value = null
  tab.value = stored ? 'crop' : 'choose'
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) {
      // However the panel closes — cancel, Escape, another editor opening over
      // it — any photo the frames were shown a draft of goes back to how it is
      // stored. After a save that is what they already show.
      active.value = false
      cancelPreview()
      if (previewedIds.size) emit('preview', [...previewedIds].map(restorePatch))
      previewedIds.clear()
      return
    }
    active.value = true
    saveError.value = null
    unsupported.value = false
    cropUnsupported.value = false
    draftPhotoId.value = null
    previewedIds.clear()
    await loadPhotos()
    seedDraft()
    await nextTick()
    panelRef.value?.focus({ preventScroll: true })
  },
)

const close = () => {
  active.value = false
  cancelPreview()
  emit('update:modelValue', false)
}

/** Leave without saving. The frames are put back by the watcher above. */
const cancel = () => {
  if (saving.value) return
  close()
}

const requestUpload = () => {
  cancel()
  emit('uploadRequested')
}

// --- Save --------------------------------------------------------------------------

/**
 * PATCH each photo the draft touches. Resolves to the saved photos, or null
 * after saying why — a server that doesn't know the flag answers 200
 * without it.
 */
const patchPhotos = async (patches: PhotoFieldPatch[]): Promise<EventPhoto[] | null> => {
  const responses = await Promise.all(
    patches.map(({ id, ...fields }) =>
      mediaService
        .updateEventMedia(props.eventId, id, fields as Partial<EventPhoto>)
        .catch(() => null),
    ),
  )
  const saved: EventPhoto[] = []
  for (const response of responses) {
    if (!response?.success || !response.data) {
      saveError.value = response?.message || t(copy.value.saveFailed)
      return null
    }
    if (!role.value.supports(response.data)) {
      unsupported.value = true
      return null
    }
    saved.push(response.data)
  }
  return saved
}

const commit = async (patches: PhotoFieldPatch[], sentCrop: boolean) => {
  if (saving.value) return
  saving.value = true
  saveError.value = null
  unsupported.value = false
  cropUnsupported.value = false
  try {
    const saved = await patchPhotos(patches)
    if (!saved) return
    const byId = new Map(saved.map((photo) => [photo.id, photo]))
    photos.value = photos.value.map((photo) => byId.get(photo.id) ?? photo)
    // The save's own photos reach the frames through the host, so nothing is
    // left to revert.
    previewedIds.clear()
    emit('saved', photos.value)
    if (sentCrop && !saved.every(responseSupportsPhotoCrop)) {
      // The choice is stored; the framing isn't. Say so and stay, rather than
      // closing on a framing that will be gone on the next load.
      cropUnsupported.value = true
      storedMarkedId.value = draftPhotoId.value
      draftCrop.value = null
      return
    }
    close()
  } finally {
    saving.value = false
  }
}

const save = () => commit(draftPatches.value, draftCrop.value !== null)

/** Back to the block's fallback: the stored photo stops being marked for it. */
const remove = () => {
  if (storedMarkedId.value === null) return
  commit([{ id: storedMarkedId.value, ...role.value.payload(false) }], false)
}
</script>

<style scoped>
/* Bottom sheet on phones, side panel from md — each enters from its own edge. */
.cpe-enter-active {
  transition:
    transform 0.4s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.25s ease;
}

.cpe-leave-active {
  transition:
    transform 0.25s cubic-bezier(0.4, 0, 0.6, 1),
    opacity 0.2s ease;
}

.cpe-enter-from,
.cpe-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .cpe-enter-from,
  .cpe-leave-to {
    opacity: 0;
    transform: translateX(1.5rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cpe-enter-active,
  .cpe-leave-active {
    transition: opacity 0.2s ease;
  }

  .cpe-enter-from,
  .cpe-leave-to {
    opacity: 0;
    transform: none;
  }
}
</style>
