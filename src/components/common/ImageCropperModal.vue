<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[10000] overflow-y-auto" @click.stop>
        <div class="fixed inset-0 bg-black/70 backdrop-blur-sm" @click.stop></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
            :class="maxWidthClass"
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>
                <button
                  @click="$emit('close')"
                  class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Close cropper"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Cropper Content -->
            <div class="p-6">
              <div
                v-if="imageSource"
                class="bg-slate-100 rounded-lg overflow-hidden"
                :style="{ height: cropperHeight, ...safeZoneVars }"
              >
                <Cropper
                  ref="cropperRef"
                  :src="imageSource"
                  :stencil-component="stencilComponent"
                  :stencil-props="stencilProps"
                  :image-restriction="imageRestriction"
                  :default-visible-area="defaultVisibleArea"
                  class="h-full w-full"
                  @error="handleCropperError"
                  @ready="handleCropperReady"
                />
              </div>
              <div v-else class="bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center" :style="{ height: cropperHeight }">
                <p class="text-slate-500">No image loaded</p>
              </div>

              <!-- Image controls -->
              <div v-if="allowFlip && imageSource" class="mt-3 flex items-center">
                <button
                  type="button"
                  @click="flipHorizontally"
                  :disabled="!isCropperReady"
                  :title="t('common.imageCropper.flipHint')"
                  class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FlipHorizontal2 class="w-4 h-4" />
                  <span>{{ t('common.imageCropper.flip') }}</span>
                </button>
              </div>

              <div v-if="errorMessage" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-sm text-red-600">{{ errorMessage }}</p>
              </div>

              <!-- Help text if provided -->
              <p v-if="helpText" class="mt-3 text-sm text-slate-600">
                {{ helpText }}
              </p>
            </div>

            <!-- Actions -->
            <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                @click="$emit('close')"
                class="px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="handleApply"
                class="px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, watch, nextTick } from 'vue'
import { FlipHorizontal2, X } from 'lucide-vue-next'
import { CircleStencil, Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()

interface Props {
  show: boolean
  imageSource: string | null
  title?: string
  aspectRatio?: number
  cropperHeight?: string
  /**
   * Tailwind max-width of the dialog. A 1:1 crop wants a box close to square —
   * on the default wide shell most of a tall photo's row is the cropper's own
   * black backdrop rather than the photo.
   */
  maxWidthClass?: string
  helpText?: string
  /**
   * Draw framing guides inside the crop box. Off by default — only the event
   * banner needs them, because it is the one crop whose output gets re-cropped
   * by consumers we don't control (messaging-app link previews) and overlaid
   * with text by consumers we do (PublicEventBanner's title gradient).
   */
  safeZones?: boolean
  /** Share of the crop height covered by a title/gradient overlay downstream. */
  safeZoneBottomPercent?: number
  /**
   * How far the image may be zoomed out / panned relative to the crop box.
   *
   * `fill-area` (vue-advanced-cropper's default) forces the image to cover the
   * whole cropper viewport, so a portrait or square source can never be zoomed
   * out far enough to show all of itself — the edges are simply unreachable.
   * `fit-area` is the opposite bound: the image is never smaller than the
   * viewport can show in full, so zooming out stops exactly when the whole
   * photo is visible. `stencil` only requires the image to cover the crop box
   * itself, leaving zoom-out otherwise unlimited.
   *
   * All three keep the stencil inside the image, so no mode can produce a crop
   * with empty regions.
   */
  imageRestriction?: 'fill-area' | 'fit-area' | 'stencil' | 'none'
  /**
   * Shape of the crop stencil. `circle` for crops whose result is only ever
   * displayed inside a circle (host avatars), so the frame shown while cropping
   * is the frame the photo ends up in.
   */
  stencilShape?: 'rectangle' | 'circle'
  /**
   * Open with the entire image in view, letterboxed inside the crop box.
   *
   * The cropper's own default visible area spans the image's full *width* at the
   * crop box's aspect ratio, so a tall photo opens as a horizontal band through
   * its middle — and under `fill-area` the parts outside that band cannot be
   * reached at all. Fitting the whole image instead means every part of it is on
   * screen the moment the cropper opens, whatever its dimensions.
   *
   * Pair it with an `imageRestriction` other than `fill-area`; that mode's area
   * restrictions clamp the visible area straight back to the band.
   */
  fitImage?: boolean
  /**
   * Offer a "flip left to right" control. Opt-in: mirroring a QR code makes it
   * unscannable, so this is only right for crops that are photographs.
   */
  allowFlip?: boolean
  /**
   * Whether the image starts mirrored — the state left behind by the previous
   * crop of the same photo, so re-cropping shows what the caller already has
   * rather than silently un-mirroring it.
   *
   * Applied on top of whatever the cropper derived from the file's EXIF
   * orientation, which is why it is flipped imperatively once the cropper is
   * ready rather than passed as `defaultTransforms` — that prop *replaces* the
   * EXIF-derived transforms, and would leave portrait phone photos sideways.
   */
  flipped?: boolean
}

interface Emits {
  close: []
  apply: []
  'update:flipped': [flipped: boolean]
  'update:cropperRef': [ref: any]
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Crop Image',
  aspectRatio: 1,
  cropperHeight: '400px',
  maxWidthClass: 'max-w-3xl',
  helpText: '',
  safeZones: false,
  safeZoneBottomPercent: 35,
  // Unchanged for existing callers (payment QR); the banner opts into `stencil`
  // and the host avatar into `fit-area`.
  imageRestriction: 'fill-area',
  stencilShape: 'rectangle',
  fitImage: false,
  allowFlip: false,
  flipped: false,
})

const emit = defineEmits<Emits>()

const cropperRef = ref<any>(null)
const errorMessage = ref<string>('')
const isCropperReady = ref(false)
/** Mirror state for this crop session; committed to the caller on apply. */
const localFlipped = ref(props.flipped)
const flipRestored = ref(false)

// markRaw: the stencil is a component definition handed straight to the cropper,
// not reactive state — without it Vue would wrap it in a proxy and warn.
const stencilComponent = computed(() =>
  props.stencilShape === 'circle' ? markRaw(CircleStencil) : undefined,
)

const stencilProps = computed(() => ({
  // CircleStencil is 1:1 by definition and ignores an aspect ratio of its own.
  ...(props.stencilShape === 'circle' ? {} : { aspectRatio: props.aspectRatio }),
  ...(props.safeZones ? { previewClass: 'crop-safe-zones' } : {}),
}))

/**
 * Visible area that contains the whole image (see the `fitImage` prop).
 *
 * The returned rect has to match the crop box's aspect ratio already: the
 * cropper recomputes `height` from `width` afterwards and keeps `top` as given,
 * so an off-ratio rect would be re-stretched off centre. Returning `undefined`
 * leaves the cropper on its own default.
 */
const defaultVisibleArea = computed(() => {
  if (!props.fitImage) return undefined
  return ({
    imageSize,
    boundaries,
  }: {
    imageSize: { width: number; height: number }
    boundaries: { width: number; height: number }
  }) => {
    const boxRatio = boundaries.width / boundaries.height
    const imageRatio = imageSize.width / imageSize.height
    const width = imageRatio > boxRatio ? imageSize.width : imageSize.height * boxRatio
    const height = width / boxRatio
    return {
      width,
      height,
      left: (imageSize.width - width) / 2,
      top: (imageSize.height - height) / 2,
    }
  }
})

/**
 * Horizontal inset of the centred square guide, as a share of the crop width.
 * A 1:1 centre crop of an `aspectRatio`-wide box keeps `1 / aspectRatio` of the
 * width, so each side loses half the remainder.
 */
const safeZoneVars = computed(() => {
  if (!props.safeZones) return {}
  const squareInset = Math.max(0, (1 - 1 / props.aspectRatio) / 2) * 100
  return {
    '--safe-square-inset': `${squareInset.toFixed(2)}%`,
    '--safe-bottom': `${props.safeZoneBottomPercent}%`,
  }
})

const handleCropperError = (error: any) => {
  console.error('Cropper error:', error)
  errorMessage.value = 'Failed to load image. Please try again.'
  isCropperReady.value = false
}

const handleCropperReady = () => {
  errorMessage.value = ''
  isCropperReady.value = true
  // Emit the cropper ref when the cropper is actually ready
  if (cropperRef.value) {
    emit('update:cropperRef', cropperRef.value)
  }
  restoreFlip()
}

/**
 * Re-apply the incoming mirror once, without animating it.
 *
 * `flip()` toggles rather than sets, so this has to run exactly once per loaded
 * image — `ready` fires again on every re-load (a new `src`, a resize that
 * re-decodes), and a second call would quietly cancel the first.
 */
const restoreFlip = () => {
  if (!props.allowFlip || flipRestored.value) return
  flipRestored.value = true
  localFlipped.value = props.flipped
  if (props.flipped) {
    cropperRef.value?.flip(true, false, { transitions: false })
  }
}

const flipHorizontally = () => {
  if (!cropperRef.value) return
  cropperRef.value.flip(true, false)
  localFlipped.value = !localFlipped.value
}

/**
 * The mirror is part of the crop's result, so it is committed with it — cancel
 * leaves the caller's stored value alone, exactly like a discarded crop box.
 */
const handleApply = () => {
  if (props.allowFlip && localFlipped.value !== props.flipped) {
    emit('update:flipped', localFlipped.value)
  }
  emit('apply')
}

// Reset ready state when modal closes
watch(
  () => props.show,
  (isShown) => {
    if (!isShown) {
      isCropperReady.value = false
      flipRestored.value = false
    } else {
      localFlipped.value = props.flipped
      // When modal opens, wait for next tick and emit ref if already available
      nextTick(() => {
        if (cropperRef.value) {
          emit('update:cropperRef', cropperRef.value)
        }
      })
    }
  }
)

// Watch the cropperRef for initial availability
watch(
  cropperRef,
  (newRef) => {
    if (newRef && props.show) {
      emit('update:cropperRef', newRef)
    }
  },
  { flush: 'post' }
)
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Framing guides drawn inside the stencil preview (opt-in via `safeZones`).
   `.crop-safe-zones` is rendered by vue-advanced-cropper's stencil, so it has
   to be reached with :deep() from here. The CSS vars are set on the cropper
   wrapper above and inherit down to it. */
:deep(.crop-safe-zones)::before,
:deep(.crop-safe-zones)::after {
  content: '';
  position: absolute;
  pointer-events: none;
  z-index: 1;
}

/* Centre square — the only region guaranteed to survive a 1:1 re-crop
   (WhatsApp's small preview, Twitter's summary card, some Android
   notification previews). Faces and text belong inside it. */
:deep(.crop-safe-zones)::before {
  top: 0;
  bottom: 0;
  left: var(--safe-square-inset, 0%);
  right: var(--safe-square-inset, 0%);
  border-left: 1px dashed rgba(255, 255, 255, 0.9);
  border-right: 1px dashed rgba(255, 255, 255, 0.9);
  background:
    linear-gradient(to right, rgba(15, 23, 42, 0.25), transparent 12px),
    linear-gradient(to left, rgba(15, 23, 42, 0.25), transparent 12px);
}

/* Bottom band — mirrors the title/organizer gradient that
   PublicEventBanner.vue lays over the banner at render time. */
:deep(.crop-safe-zones)::after {
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--safe-bottom, 35%);
  border-top: 1px dashed rgba(255, 255, 255, 0.55);
  background: linear-gradient(to top, rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0));
}
</style>
