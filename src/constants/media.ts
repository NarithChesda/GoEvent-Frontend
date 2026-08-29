/**
 * Media-related constants for file uploads and validation
 */

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  AUDIO: 50 * 1024 * 1024, // 50MB
} as const

// Accepted file types
export const ACCEPTED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  VIDEO: ['video/mp4', 'video/mov', 'video/avi', 'video/webm'],
  AUDIO: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/mpeg'],
} as const

// Media field names
export const MEDIA_FIELDS = {
  BANNER_IMAGE: 'banner_image',
  LOGO_ONE: 'logo_one',
  LOGO_TWO: 'logo_two',
  EVENT_VIDEO: 'event_video',
  MUSIC: 'music',
} as const

// Dropdown section keys
export const DROPDOWN_SECTIONS = {
  BANNER: 'banner',
  LOGO_ONE: 'logoOne',
  LOGO_TWO: 'logoTwo',
  VIDEO: 'video',
  MUSIC: 'music',
} as const

// Error messages
export const MEDIA_ERROR_MESSAGES = {
  INVALID_IMAGE_TYPE: 'Invalid file type. Please upload JPG, PNG, GIF, or WebP images.',
  INVALID_VIDEO_TYPE: 'Invalid file type. Please upload MP4, MOV, AVI, or WebM videos.',
  INVALID_AUDIO_TYPE: 'Invalid file type. Please upload MP3, WAV, OGG, AAC, or FLAC audio files.',
  IMAGE_TOO_LARGE: 'File too large. Maximum size is 10MB.',
  VIDEO_TOO_LARGE: 'File too large. Maximum size is 100MB.',
  AUDIO_TOO_LARGE: 'File too large. Maximum size is 50MB.',
  NETWORK_ERROR: 'Network error occurred',
  UPLOAD_FAILED: 'Failed to upload media',
  DELETE_FAILED: 'Failed to delete media',
} as const

/**
 * Gallery upload geometry — the bounds of the *stored master*, not of what a
 * viewer downloads.
 *
 * Every showcase surface fetches photos through ImageKit, which resizes per
 * device (see RESPONSIVE_WIDTH_LADDER in useTemplateProcessor). So the client's
 * only jobs here are to keep the browser from decoding a 50MP camera bitmap and
 * to land the upload under FILE_SIZE_LIMITS.IMAGE. Pre-shrinking for display is
 * not one of them: detail thrown away at this step is gone for good, and the
 * CDN then has nothing left to serve a retina laptop.
 *
 * MAX_WIDTH and MAX_HEIGHT are deliberately equal, which turns compressImage's
 * `Math.min(maxW / w, maxH / h)` into a plain long-edge cap. They were
 * 1920x1080 — a 16:9 *box*, which constrains the long edge of anything
 * portrait: a 4000x6000 wedding portrait was stored at 720x1080, and no amount
 * of CDN tuning brings that back. 3000 also sits above the 2560px top rung of
 * the delivery ladder, so the CDN never has to enlarge.
 */
export const IMAGE_COMPRESSION = {
  MAX_WIDTH: 3000,
  MAX_HEIGHT: 3000,
  /**
   * Near-transparent. This is a generation-loss budget, not a delivery size:
   * ImageKit re-encodes every derivative anyway, so a low number here only
   * means the CDN is handed artifacts to compress a second time.
   */
  QUALITY: 0.92,
  OUTPUT_TYPE: 'image/jpeg',
} as const

/**
 * Event banner geometry.
 *
 * The banner is used in two places with different consumers:
 *  - the in-app event card / about hero, and
 *  - the `og:image` link preview rendered by messaging apps.
 *
 * Both converge on 1.91:1 (Open Graph's large-card ratio), so one crop serves
 * both. The CSS side of this lives in tailwind.config.js as `aspect-banner`.
 *
 * The upload is a single 1200x630 file, which is exactly what `og:image` points
 * at. A larger master would be better for the full-bleed hero in
 * EventHeroSection.vue, but it can only happen once the backend derives a
 * separate small OG variant: served directly, anything much over ~300KB makes
 * WhatsApp fall back from the large link card to a corner thumbnail. That
 * backend work was reverted along with an SSR change, so this stays at the OG
 * size — see docs/backend-api-requirements/event-banner-image-sizing.md.
 */
export const BANNER_IMAGE = {
  /** Crop stencil ratio; also the ratio of OUTPUT_WIDTH / OUTPUT_HEIGHT. */
  ASPECT_RATIO: 1200 / 630,
  OUTPUT_WIDTH: 1200,
  OUTPUT_HEIGHT: 630,
  /** Keeps a 1200x630 photo comfortably inside the og:image size budget. */
  QUALITY: 0.85,
  /**
   * JPEG rather than WebP: with the OG variant reverted, `og:image` serves this
   * exact file, and WebP link-preview support is still uneven across smaller
   * messaging clients. Flip to 'image/webp' once a dedicated OG variant exists.
   * Per the HTML spec `toBlob` silently falls back to image/png for a type the
   * browser cannot encode, so the encoder checks the resulting blob type.
   */
  OUTPUT_TYPE: 'image/jpeg',
  FALLBACK_OUTPUT_TYPE: 'image/jpeg',
  /**
   * Bounding box for the working copy handed to the cropper.
   *
   * Sources are downscaled to this before cropping so the browser never decodes
   * a 50MP camera bitmap, but it is deliberately far larger than the output:
   * crop headroom. Downscaling the source to OUTPUT_WIDTH first would mean
   * anyone cropping *into* their photo gets an upscaled result.
   */
  SOURCE_MAX_DIMENSION: 4096,
  /** Near-transparent: the working copy is re-encoded again after cropping. */
  SOURCE_QUALITY: 0.95,
} as const

// Media types
export type MediaType = 'image' | 'video' | 'audio'
export type MediaField = typeof MEDIA_FIELDS[keyof typeof MEDIA_FIELDS]
export type DropdownSection = typeof DROPDOWN_SECTIONS[keyof typeof DROPDOWN_SECTIONS]
