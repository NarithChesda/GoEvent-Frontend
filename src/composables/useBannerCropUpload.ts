import { ref, onUnmounted, type Ref } from 'vue'
import type { Event as ApiEvent } from '@/services/api'
import type { useMediaUpload } from './useMediaUpload'
import { useAppLanguage } from './useAppLanguage'
import { BANNER_IMAGE } from '@/constants/media'
import { compressImage } from '@/utils/imageCompression'
import { resolveMediaUrl } from '@/utils/mediaUrl'

/**
 * Pick → crop → upload flow for the event banner image.
 *
 * Shared by the two places that can change the banner: the Brand Assets row in
 * MediaUploadsSection.vue and the shareable-link preview card in
 * SocialSharePreviewSection.vue. Both must produce byte-identical output, since
 * the same file is what `og:image` serves — hence one implementation rather
 * than two.
 *
 * The caller owns the ImageCropperModal markup and wires `showCropper` /
 * `cropperImage` / `setCropperRef` / `closeCropper` / `applyCrop` to it; this
 * composable owns everything between picking a file and the upload call.
 */
export function useBannerCropUpload(
  eventData: Ref<ApiEvent | undefined>,
  mediaUpload: ReturnType<typeof useMediaUpload>,
) {
  const { t } = useAppLanguage()

  const showCropper = ref(false)
  const cropperImage = ref<string | null>(null)
  const cropperRef = ref<{ getResult: () => { canvas: HTMLCanvasElement | null } } | null>(null)
  const pendingFile = ref<File | null>(null)
  /** True while an oversized source is being downscaled for the cropper. */
  const preparing = ref(false)
  /** Object URL for the working copy, revoked when the cropper closes. */
  const objectUrl = ref<string | null>(null)

  /**
   * Open the cropper for a newly picked banner file.
   *
   * Only the file *type* is checked, not its size. The crop step always re-encodes
   * to a fixed BANNER_IMAGE.OUTPUT_WIDTH x OUTPUT_HEIGHT image, so a 40MB camera
   * original and a 2MB phone snap produce byte-comparable uploads — rejecting the
   * former on size told hosts to go find image-editing software for no benefit.
   * (The event-photo flow in UploadMediaDrawer.vue has always downscaled instead.)
   *
   * Oversized sources are downscaled to a working copy first, which keeps the
   * cropper from decoding a 50MP bitmap on a mid-range phone.
   */
  const startCrop = async (file: File) => {
    const validation = mediaUpload.validateFile(file, 'image', { checkSize: false })
    if (!validation.valid) return

    preparing.value = true
    try {
      const working = await compressImage(file, {
        maxWidth: BANNER_IMAGE.SOURCE_MAX_DIMENSION,
        maxHeight: BANNER_IMAGE.SOURCE_MAX_DIMENSION,
        quality: BANNER_IMAGE.SOURCE_QUALITY,
      })

      pendingFile.value = working
      // Object URL rather than a data URL: sources can now be tens of megabytes,
      // and base64 would inflate that by a third again in memory.
      objectUrl.value = URL.createObjectURL(working)
      cropperImage.value = objectUrl.value
      showCropper.value = true
    } catch {
      mediaUpload.setError(t('management.media.mediaUploads.banner.prepareFailed'))
    } finally {
      preparing.value = false
    }
  }

  /** Re-crop the banner already stored on the event, with no new upload picked. */
  const openCropperForCurrent = () => {
    const bannerUrl = resolveMediaUrl(eventData.value?.banner_image)
    if (bannerUrl) {
      pendingFile.value = null
      cropperImage.value = bannerUrl
      showCropper.value = true
    }
  }

  const closeCropper = () => {
    showCropper.value = false
    cropperImage.value = null
    pendingFile.value = null
    if (objectUrl.value) {
      URL.revokeObjectURL(objectUrl.value)
      objectUrl.value = null
    }
  }

  const setCropperRef = (instance: unknown) => {
    cropperRef.value = instance as typeof cropperRef.value
  }

  /**
   * Encode the banner canvas as BANNER_IMAGE.OUTPUT_TYPE. `toBlob` silently falls
   * back to image/png for a type the browser cannot encode, so check the returned
   * type and retry with the fallback format rather than uploading a huge PNG.
   */
  const encodeCanvas = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
    new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob?.type === BANNER_IMAGE.OUTPUT_TYPE) {
            resolve(blob)
            return
          }
          canvas.toBlob(resolve, BANNER_IMAGE.FALLBACK_OUTPUT_TYPE, BANNER_IMAGE.QUALITY)
        },
        BANNER_IMAGE.OUTPUT_TYPE,
        BANNER_IMAGE.QUALITY,
      )
    })

  const applyCrop = async () => {
    if (!cropperRef.value) return

    const { canvas } = cropperRef.value.getResult()
    if (!canvas) return

    // Normalise to the banner size. The cropper's own canvas is however many
    // pixels the source crop happened to cover; every consumer assumes a fixed
    // 1.91:1 image at BANNER_IMAGE's dimensions.
    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = BANNER_IMAGE.OUTPUT_WIDTH
    outputCanvas.height = BANNER_IMAGE.OUTPUT_HEIGHT
    const ctx = outputCanvas.getContext('2d')
    if (!ctx) return

    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(canvas, 0, 0, BANNER_IMAGE.OUTPUT_WIDTH, BANNER_IMAGE.OUTPUT_HEIGHT)

    const blob = await encodeCanvas(outputCanvas)
    if (!blob) return

    const extension = blob.type === 'image/webp' ? 'webp' : 'jpg'
    const fileName =
      pendingFile.value?.name?.replace(/\.[^/.]+$/, `.${extension}`) || `banner.${extension}`
    const croppedFile = new File([blob], fileName, { type: blob.type })

    closeCropper()
    await mediaUpload.uploadMedia('banner_image', croppedFile)
  }

  onUnmounted(() => {
    if (objectUrl.value) {
      URL.revokeObjectURL(objectUrl.value)
      objectUrl.value = null
    }
  })

  return {
    showCropper,
    cropperImage,
    preparing,
    startCrop,
    openCropperForCurrent,
    closeCropper,
    setCropperRef,
    applyCrop,
  }
}
