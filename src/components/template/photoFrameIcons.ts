import { createLucideIcon, type LucideIcon } from 'lucide-vue-next'
import type { HostPhotoFrame } from '@/services/api'

/**
 * The arch host design's frame shapes, each drawn as its own icon.
 *
 * A choice between silhouettes is answered fastest by showing the silhouettes,
 * and no stock icon is one of these: the nearest — a church for the arch, a
 * triangle for the pointed window — say "building" and "warning" before they
 * say "frame". These are drawn on lucide's 24-unit grid with its stroke, so
 * they sit in TemplateFormChoice beside every other icon in the editor.
 *
 * The four tall shapes share one 12 × 15 box, the frames' own 4:5; the pointed
 * window is the showcase's path (POINTED_FRAME_PATH) at that scale. The circle
 * is drawn a little larger than the box's width, as a round icon has to be to
 * read at the same weight as its square neighbours.
 */
export const PHOTO_FRAME_ICONS: Record<HostPhotoFrame, LucideIcon> = {
  arch: createLucideIcon('photo-frame-arch', [
    ['path', { d: 'M6 19.5v-9a6 6 0 0 1 12 0v9Z', key: 'arch' }],
  ]),
  pointed: createLucideIcon('photo-frame-pointed', [
    ['path', { d: 'M6 19.5v-7.3A7.9 7.9 0 0 1 12 4.5a7.9 7.9 0 0 1 6 7.7v7.3Z', key: 'pointed' }],
  ]),
  oval: createLucideIcon('photo-frame-oval', [
    ['ellipse', { cx: '12', cy: '12', rx: '6', ry: '7.5', key: 'oval' }],
  ]),
  circle: createLucideIcon('photo-frame-circle', [
    ['circle', { cx: '12', cy: '12', r: '6.75', key: 'circle' }],
  ]),
  rectangle: createLucideIcon('photo-frame-rectangle', [
    ['rect', { x: '6', y: '4.5', width: '12', height: '15', rx: '1', key: 'rectangle' }],
  ]),
}
