import type { EventPhoto } from '@/types/showcase'

/**
 * The contract between PhotoGallery.vue (the shell) and a gallery design.
 *
 * The split the agenda and the dress code follow: **the design owns the
 * composition and the arrival; the section owns the chrome.** The shell draws
 * the header, resolves the design, and publishes the colours as CSS variables
 * on its root (`--gd-ink`, `--gd-accent`, the eases — see PhotoGallery.vue).
 * A design receives the photographs already in gallery order, with the band,
 * cover and countdown photos already taken out, and decides only how they are
 * laid down and how each one arrives.
 *
 * Every design emits `openPhoto` for a tap. The stage decides what that means:
 * the lightbox for a guest, nothing while the studio is editing (the gallery's
 * EditableRegion hears the same tap and opens the photos drawer).
 */
export interface GalleryDesignProps {
  photos: EventPhoto[]
  /** Template primary. The column draws its placeholders in it; the framed
   *  designs read `--gd-ink` instead. */
  primaryColor: string
  /**
   * Negative inline margins that take a block out to the card's edges — the
   * stage's `bleedMarginClasses`. Only `reel` spends it: a strip that runs off
   * both sides reads as continuing past them, which is the point of a reel.
   */
  bleedClass?: string
  /** The text a photograph without a caption is announced by. */
  alt: string
}

export interface GalleryDesignEmits {
  openPhoto: [photo: EventPhoto]
}
