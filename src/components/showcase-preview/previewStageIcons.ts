import type { Component } from 'vue'
import { BookOpen, Clapperboard, DoorOpen, Layers, ScrollText } from 'lucide-vue-next'

/**
 * The glyph for each preview stage, shared by every phone-sized control bar
 * that picks one — the studio's mobile preview sheet and the public design
 * catalogue — so the same stage never wears two different icons.
 *
 * Frame ids are renderer-defined vocabulary (V1's cover/transition/main today, a
 * V2 renderer will declare its own pages), so an unknown id degrades to a
 * generic icon rather than rendering nothing; the labels still come from the
 * descriptor's own labelKey.
 */
const STAGE_ICONS: Record<string, Component> = {
  cover: BookOpen,
  transition: DoorOpen,
  event_video: Clapperboard,
  main: ScrollText,
}

export const previewStageIcon = (id: string): Component => STAGE_ICONS[id] ?? Layers
