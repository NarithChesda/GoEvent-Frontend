<template>
  <!-- A panel, not a modal: the blend colour and the framing are judged against
       the template behind the card, which only the preview frame can show. So
       there is no scrim, the frame stays visible and scrollable, and every
       choice here is pushed into it live (`preview`) until it is saved or
       abandoned. Everything here is stored on the photo itself, beside its
       featured flag and framing. -->
  <Teleport to="body">
    <Transition name="pbe">
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
              {{
                isNew
                  ? t('management.showcasePreview.editors.addPhotoBand')
                  : t('management.showcasePreview.editors.photoBandTitle')
              }}
            </h3>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">
              {{ t('management.showcasePreview.editors.photoBandDescription') }}
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
            v-else-if="choosablePhotos.length === 0"
            class="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-slate-200"
          >
            <ImagePlus class="w-8 h-8 mx-auto mb-3 text-slate-400" />
            <p class="text-sm font-medium text-slate-700">
              {{ t('management.showcasePreview.editors.featuredPhotoEmpty') }}
            </p>
            <p class="text-xs text-slate-500 mt-1">
              {{ t('management.showcasePreview.editors.photoBandUploadPrompt') }}
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
            <!-- Which photo, where and in what colour vs how it is framed —
                 the featured photo's editor makes the same split. -->
            <div class="flex items-center gap-1 p-1 bg-slate-100 rounded-xl" role="tablist">
              <button
                v-for="option in TABS"
                :key="option"
                type="button"
                role="tab"
                :aria-selected="tab === option"
                class="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-200"
                :class="
                  tab === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                "
                @click="tab = option"
              >
                {{
                  option === 'band'
                    ? t('management.showcasePreview.editors.photoBandTabBand')
                    : t('management.showcasePreview.editors.cropTabAdjust')
                }}
              </button>
            </div>

            <template v-if="tab === 'band'">
              <section>
                <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  {{ t('management.showcasePreview.editors.photoBandPhoto') }}
                </h4>
                <!-- In the band's own shape, so the choice is made on what the
                     band will actually show. -->
                <div
                  class="flex gap-2.5 overflow-x-auto overscroll-x-contain px-1 pt-1 pb-2 -mx-1"
                  role="radiogroup"
                  :aria-label="t('management.showcasePreview.editors.photoBandPhoto')"
                >
                  <button
                    v-for="(photo, k) in choosablePhotos"
                    :key="photo.id"
                    type="button"
                    role="radio"
                    :aria-checked="photo.id === draftPhotoId"
                    :aria-label="
                      photo.caption ||
                      t('management.showcasePreview.editors.cropPhotoPosition', {
                        n: k + 1,
                        total: choosablePhotos.length,
                      })
                    "
                    class="relative shrink-0 w-16 aspect-[4/5] rounded-lg overflow-hidden bg-slate-100 transition-[opacity,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e90ff] focus-visible:ring-offset-2"
                    :class="
                      photo.id === draftPhotoId
                        ? 'ring-2 ring-[#1e90ff] ring-offset-2'
                        : 'opacity-70 hover:opacity-100'
                    "
                    @click="choosePhoto(photo.id)"
                  >
                    <img
                      :src="photo.image"
                      alt=""
                      class="w-full h-full object-cover"
                      loading="lazy"
                      draggable="false"
                    />
                    <span
                      v-if="photo.id === draftPhotoId"
                      class="absolute top-1 right-1 flex items-center justify-center w-4 h-4 rounded-full bg-[#1e90ff] text-white shadow"
                    >
                      <Check class="w-2.5 h-2.5" />
                    </span>
                  </button>
                </div>
              </section>

              <section>
                <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  {{ t('management.showcasePreview.editors.photoBandPlacement') }}
                </h4>
                <SelectField
                  :model-value="draftPlacement"
                  :options="placementOptions"
                  :placeholder="t('management.showcasePreview.editors.photoBandPlacement')"
                  :title="t('management.showcasePreview.editors.photoBandPlacement')"
                  @update:model-value="setPlacement"
                />
              </section>

              <section>
                <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {{ t('management.showcasePreview.editors.photoBandBlend') }}
                </h4>
                <p class="text-xs text-slate-500 mt-1 mb-3">
                  {{ t('management.showcasePreview.editors.photoBandBlendHint') }}
                </p>

                <div
                  class="flex flex-wrap items-center gap-2.5"
                  role="radiogroup"
                  :aria-label="t('management.showcasePreview.editors.photoBandBlend')"
                >
                  <button
                    type="button"
                    role="radio"
                    :aria-checked="draftColor === null"
                    :aria-label="t('management.showcasePreview.editors.photoBandBlendNone')"
                    :title="t('management.showcasePreview.editors.photoBandBlendNone')"
                    class="pbe-swatch pbe-swatch--none"
                    :class="{ 'is-selected': draftColor === null }"
                    @click="draftColor = null"
                  />
                  <button
                    v-for="swatch in swatchList"
                    :key="swatch.hex"
                    type="button"
                    role="radio"
                    :aria-checked="draftColor === swatch.hex"
                    :aria-label="
                      t('management.showcasePreview.editors.photoBandBlendSwatch', { color: swatch.hex })
                    "
                    :title="swatch.name ? `${swatch.name} · ${swatch.hex}` : swatch.hex"
                    class="pbe-swatch"
                    :class="{ 'is-selected': draftColor === swatch.hex }"
                    :style="{ background: swatch.hex }"
                    @click="draftColor = swatch.hex"
                  />
                  <!-- The native picker, dressed as a swatch. It wears the
                       chosen colour once that colour is its own, i.e. not one
                       above. -->
                  <label
                    class="pbe-swatch pbe-swatch--custom"
                    :class="{ 'is-selected': isCustomColor }"
                    :style="isCustomColor ? { background: draftColor ?? undefined } : undefined"
                    :title="t('management.showcasePreview.editors.photoBandBlendCustom')"
                  >
                    <input
                      type="color"
                      class="pbe-color-input"
                      :value="draftColor ?? '#ffffff'"
                      :aria-label="t('management.showcasePreview.editors.photoBandBlendCustom')"
                      @input="onCustomColor"
                    />
                  </label>
                </div>

                <p class="mt-2.5 text-xs text-slate-500 tabular-nums" aria-live="polite">
                  {{ draftColor ?? t('management.showcasePreview.editors.photoBandBlendNone') }}
                </p>
              </section>
            </template>

            <!-- Framed in the shape of the band's clear middle: what is inside
                 the frame shows sharp, and the fades add a little more of the
                 photo above and below it. -->
            <section v-else-if="selectedPhoto">
              <p class="text-xs sm:text-sm text-slate-500 mb-3">
                {{ t('management.showcasePreview.editors.photoBandCropHint') }}
              </p>
              <PhotoFramingEditor
                :key="selectedPhoto.id"
                :model-value="draftRegion"
                :image-url="selectedPhoto.image"
                :frame-aspect="PHOTO_BAND_FRAME_ASPECT"
                @update:model-value="draftCrop = $event"
              />
            </section>

            <!-- A PATCH to a server that doesn't know the field succeeds and
                 drops it, so "saved" would be a lie without checking the echo. -->
            <div
              v-if="unsupported"
              class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800"
            >
              {{ t('management.showcasePreview.editors.photoBandUnsupported') }}
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
          v-if="!loading && !loadError && choosablePhotos.length > 0"
          class="flex-shrink-0 flex items-center gap-2 border-t border-slate-100 px-4 sm:px-5 py-3"
        >
          <button
            v-if="!isNew"
            type="button"
            class="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="saving"
            @click="remove"
          >
            {{ t('management.showcasePreview.editors.photoBandRemove') }}
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
import type { PhotoBandPlacement } from '@/services/api/types/event.types'
import {
  cropsEqual,
  resolvePhotoCrop,
  responseSupportsPhotoCrop,
  toPhotoCropPayload,
  type PhotoCrop,
} from '@/utils/photoCrop'
import {
  DEFAULT_PHOTO_BAND_PLACEMENT,
  PHOTO_BAND_FRAME_ASPECT,
  PHOTO_BAND_PLACEMENTS,
  normalizeBlendColor,
  photoBandPayload,
  photoBandPlacement,
  responseSupportsPhotoBand,
  type BlendSwatch,
} from '@/components/showcase/photo-band/photoBand'
import type { PhotoFieldPatch } from '../bridge/previewBridge'
import SelectField from '@/components/common/SelectField.vue'
import PhotoFramingEditor from './PhotoFramingEditor.vue'

interface Props {
  modelValue: boolean
  eventId: string
  /** The band that was tapped — its photo's id. Absent/null adds a new band. */
  photoId?: number | null
  /** The applied template's colours — the likeliest match for the backdrop. */
  swatches?: BlendSwatch[]
}

const props = withDefaults(defineProps<Props>(), { photoId: null, swatches: () => [] })
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

const TABS = ['band', 'crop'] as const
const tab = ref<(typeof TABS)[number]>('band')

const panelRef = ref<HTMLElement | null>(null)
const loading = ref(false)
const loadError = ref<string | null>(null)
/** The event's photos as stored — what every revert puts back. */
const photos = ref<EventPhoto[]>([])

/** The photo that was a band when the panel opened; null when adding one. */
const editingPhotoId = ref<number | null>(null)
const draftPhotoId = ref<number | null>(null)
const draftPlacement = ref<PhotoBandPlacement>(DEFAULT_PHOTO_BAND_PLACEMENT)
const draftColor = ref<string | null>(null)
/** A new framing for the photo; null leaves its stored framing alone. */
const draftCrop = ref<PhotoCrop | null>(null)

const isNew = computed(() => editingPhotoId.value === null)

const storedPhoto = (id: number | null) => photos.value.find((p) => p.id === id) ?? null

/**
 * What a band can be made of: every photo that isn't already one — plus, when
 * editing, the band's own photo. One photo is at most one band; another band's
 * photo is changed by tapping that band.
 */
const choosablePhotos = computed(() =>
  photos.value.filter((p) => p.id === editingPhotoId.value || !photoBandPlacement(p)),
)

const selectedPhoto = computed(() => storedPhoto(draftPhotoId.value))

/** What the framing editor opens on: the new framing, else the photo's own. */
const draftRegion = computed<PhotoCrop>(() => draftCrop.value ?? resolvePhotoCrop(selectedPhoto.value))

const isDirty = computed(() => {
  const target = selectedPhoto.value
  if (!target) return false
  if (isNew.value || target.id !== editingPhotoId.value) return true
  return (
    draftPlacement.value !== photoBandPlacement(target) ||
    draftColor.value !== normalizeBlendColor(target.band_blend_color) ||
    (draftCrop.value !== null && !cropsEqual(draftCrop.value, resolvePhotoCrop(target)))
  )
})

const placementOptions = computed(() =>
  PHOTO_BAND_PLACEMENTS.map((placement) => ({
    value: placement,
    label: t(`management.showcasePreview.editors.photoBandPlacements.${placement}`),
  })),
)

const setPlacement = (value: string | number) => {
  const placement = PHOTO_BAND_PLACEMENTS.find((p) => p === value)
  if (placement) draftPlacement.value = placement
}

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

// --- Swatches ------------------------------------------------------------------

/** The template's colours, normalised and de-duplicated, plus white — the
 *  glass card's own film, and the commonest thing behind a pale template. */
const swatchList = computed<BlendSwatch[]>(() => {
  const seen = new Set<string>()
  const list: BlendSwatch[] = []
  for (const swatch of [...props.swatches, { hex: '#ffffff' }]) {
    const hex = normalizeBlendColor(swatch.hex)
    if (!hex || seen.has(hex)) continue
    seen.add(hex)
    list.push({ hex, name: swatch.name })
  }
  return list
})

const isCustomColor = computed(
  () => draftColor.value !== null && !swatchList.value.some((s) => s.hex === draftColor.value),
)

const onCustomColor = (event: globalThis.Event) => {
  draftColor.value = normalizeBlendColor((event.target as HTMLInputElement).value)
}

// --- What the frames are shown ----------------------------------------------------

/** A photo as stored: its band settings and its framing. */
const restorePatch = (id: number): PhotoFieldPatch => {
  const photo = storedPhoto(id)
  return {
    id,
    band_placement: photo?.band_placement ?? null,
    band_blend_color: photo?.band_blend_color ?? null,
    crop_x: photo?.crop_x ?? null,
    crop_y: photo?.crop_y ?? null,
    crop_width: photo?.crop_width ?? null,
    crop_height: photo?.crop_height ?? null,
  }
}

/** The draft, as changes to photos: the chosen one becomes the band, and a band
 *  that moved to another photo leaves its old one. */
const draftPatches = computed<PhotoFieldPatch[]>(() => {
  const target = draftPhotoId.value
  if (target === null) return []
  const patches: PhotoFieldPatch[] = []
  if (editingPhotoId.value !== null && editingPhotoId.value !== target) {
    patches.push({ id: editingPhotoId.value, ...photoBandPayload(null) })
  }
  patches.push({
    id: target,
    ...photoBandPayload(draftPlacement.value, draftColor.value),
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
/**
 * Open as far as this panel is concerned. False from the moment it asks to
 * close, not from when the parent's prop catches up a render later — or a
 * draft just saved would be previewed once more on the way out.
 */
const active = ref(false)

/**
 * Each photo is sent whole — as stored, with the draft over it — so a photo
 * that was part of an earlier draft (the one chosen before this one) goes back
 * to how it is stored in the same message.
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
 * Open on the tapped band as stored — or, adding one, on a photo that isn't a
 * band yet (the featured one first) after the first section without a band,
 * so a second band doesn't land on top of the first. The frame shows it the
 * moment the panel opens, rather than waiting for a first choice to show what
 * a band even is.
 */
const seedDraft = () => {
  const tapped = storedPhoto(props.photoId ?? null)
  const tappedPlacement = photoBandPlacement(tapped)
  if (tapped && tappedPlacement) {
    editingPhotoId.value = tapped.id
    draftPhotoId.value = tapped.id
    draftPlacement.value = tappedPlacement
    draftColor.value = normalizeBlendColor(tapped.band_blend_color)
    draftCrop.value = null
    return
  }
  editingPhotoId.value = null
  const free = choosablePhotos.value
  draftPhotoId.value = (free.find((p) => p.is_featured) ?? free[0])?.id ?? null
  const used = new Set(photos.value.map(photoBandPlacement))
  const start = PHOTO_BAND_PLACEMENTS.indexOf(DEFAULT_PHOTO_BAND_PLACEMENT)
  draftPlacement.value =
    [...PHOTO_BAND_PLACEMENTS.slice(start), ...PHOTO_BAND_PLACEMENTS.slice(0, start)].find(
      (p) => !used.has(p),
    ) ?? DEFAULT_PHOTO_BAND_PLACEMENT
  draftColor.value = null
  draftCrop.value = null
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
    tab.value = 'band'
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
 * after saying why — a server that drops the band fields answers 200 without
 * them, so "saved" would be a lie without checking the echo.
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
      saveError.value = response?.message || t('management.showcasePreview.editors.photoBandSaveFailed')
      return null
    }
    if (!responseSupportsPhotoBand(response.data)) {
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
      // The band is stored; the framing isn't. Say so and stay, rather than
      // closing on a framing that will be gone on the next load.
      cropUnsupported.value = true
      editingPhotoId.value = draftPhotoId.value
      draftCrop.value = null
      return
    }
    close()
  } finally {
    saving.value = false
  }
}

const save = () => commit(draftPatches.value, draftCrop.value !== null)

const remove = () => {
  if (editingPhotoId.value === null) return
  commit([{ id: editingPhotoId.value, ...photoBandPayload(null) }], false)
}
</script>

<style scoped>
.pbe-swatch {
  position: relative;
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
  border-radius: 9999px;
  /* A hairline inside, so white and near-white swatches still have an edge. */
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.12);
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

@media (min-width: 640px) {
  .pbe-swatch {
    width: 2.25rem;
    height: 2.25rem;
  }
}

.pbe-swatch.is-selected {
  box-shadow:
    inset 0 0 0 1px rgba(15, 23, 42, 0.12),
    0 0 0 2px #fff,
    0 0 0 4px #1e90ff;
}

.pbe-swatch:focus-visible,
.pbe-swatch--custom:focus-within {
  outline: 2px solid #1e90ff;
  outline-offset: 3px;
}

/* "No colour": a white disc struck through, the convention every colour
   picker uses for none. */
.pbe-swatch--none {
  background: linear-gradient(
    135deg,
    #fff calc(50% - 1px),
    #ef4444 calc(50% - 1px),
    #ef4444 calc(50% + 1px),
    #fff calc(50% + 1px)
  );
}

.pbe-swatch--custom {
  display: block;
  background: conic-gradient(#f87171, #fbbf24, #4ade80, #22d3ee, #818cf8, #e879f9, #f87171);
}

/* Covers the swatch, invisible, so a tap anywhere on it opens the native
   picker — which is also what keyboard focus lands on. */
.pbe-color-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: 0;
  padding: 0;
}

/* Bottom sheet on phones, side panel from md — each enters from its own edge. */
.pbe-enter-active {
  transition:
    transform 0.4s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.25s ease;
}

.pbe-leave-active {
  transition:
    transform 0.25s cubic-bezier(0.4, 0, 0.6, 1),
    opacity 0.2s ease;
}

.pbe-enter-from,
.pbe-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .pbe-enter-from,
  .pbe-leave-to {
    opacity: 0;
    transform: translateX(1.5rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pbe-enter-active,
  .pbe-leave-active {
    transition: opacity 0.2s ease;
  }

  .pbe-enter-from,
  .pbe-leave-to {
    opacity: 0;
    transform: none;
  }
}
</style>
