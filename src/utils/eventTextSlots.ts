/**
 * Shared configuration for event showcase text "slots".
 *
 * Event texts are a fixed matrix: known text_type slots × languages. Each slot
 * renders in one specific place on the showcase (cover stage, main content,
 * host messages). Both the management tab and the edit drawer read this config
 * so labels, grouping and title support stay in sync.
 */
import type { Component } from 'vue'
import {
  FileText,
  MessageSquare,
  Info,
  Calendar,
  Clock,
  MapPin,
  Heart,
  AlignLeft,
  Type,
} from 'lucide-vue-next'

export type EventTextSlotGroup = 'cover' | 'main' | 'messages' | 'other'

export interface EventTextSlot {
  value: string
  icon: Component
  group: EventTextSlotGroup
  /** Whether the showcase actually renders this slot's title field */
  hasTitle: boolean
}

export const EVENT_TEXT_SLOTS: EventTextSlot[] = [
  { value: 'cover_header', icon: Type, group: 'cover', hasTitle: false },
  { value: 'invite_text', icon: MessageSquare, group: 'cover', hasTitle: false },
  { value: 'welcome_message', icon: MessageSquare, group: 'main', hasTitle: false },
  { value: 'description', icon: AlignLeft, group: 'main', hasTitle: true },
  { value: 'date_text', icon: Calendar, group: 'main', hasTitle: false },
  { value: 'time_text', icon: Clock, group: 'main', hasTitle: false },
  { value: 'location_text', icon: MapPin, group: 'main', hasTitle: false },
  { value: 'instructions', icon: Info, group: 'main', hasTitle: false },
  { value: 'thank_you_message', icon: Heart, group: 'messages', hasTitle: true },
  { value: 'sorry_message', icon: MessageSquare, group: 'messages', hasTitle: true },
  { value: 'short_description', icon: FileText, group: 'other', hasTitle: false },
  { value: 'custom', icon: FileText, group: 'other', hasTitle: true },
]

export const EVENT_TEXT_SLOT_GROUPS: EventTextSlotGroup[] = ['cover', 'main', 'messages', 'other']

export const EVENT_TEXT_LANGUAGES = ['en', 'kh', 'fr', 'ja', 'ko', 'zh-cn', 'th', 'vn']

/** Sort language codes by the canonical priority order, unknown codes last */
export function sortEventTextLanguages(langs: string[]): string[] {
  return [...langs].sort((a, b) => {
    const aIdx = EVENT_TEXT_LANGUAGES.indexOf(a)
    const bIdx = EVENT_TEXT_LANGUAGES.indexOf(b)
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b)
    if (aIdx === -1) return 1
    if (bIdx === -1) return -1
    return aIdx - bIdx
  })
}
