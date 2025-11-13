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

// Media types
export type MediaType = 'image' | 'video' | 'audio'
export type MediaField = typeof MEDIA_FIELDS[keyof typeof MEDIA_FIELDS]
export type DropdownSection = typeof DROPDOWN_SECTIONS[keyof typeof DROPDOWN_SECTIONS]
