/**
 * The scroll story's tone: how much the invitation moves as it is read.
 *
 * The motion itself is the same set of gestures for every event (scroll-story.css):
 * chapters rise into place, a chapter's title comes into focus, the divider
 * between chapters draws itself open. What
 * the occasion changes is how far and how fast. A birthday invitation can
 * travel and tilt; a funeral or merit-making ceremony should barely move, and
 * arrive by coming into focus rather than by sliding. The tone is published as
 * `data-story-tone` on the scroller and read there as a handful of CSS
 * variables, so no component branches on the category.
 *
 * - `elegant`  weddings, housewarmings and everything without a tone of its own.
 * - `playful`  birthdays: more travel, a slight tilt on titles, a crisp focus.
 * - `solemn`   funerals and ceremonies: light travel, a slow and soft focus.
 *
 * Category names arrive as the backend's English names (`category_details.name`),
 * matched case-insensitively — the same keys HostInfo picks its layout by.
 */
export type StoryTone = 'elegant' | 'playful' | 'solemn'

const TONE_BY_CATEGORY: Record<string, StoryTone> = {
  birthday: 'playful',
  'birthday party': 'playful',
  funeral: 'solemn',
  'funeral service': 'solemn',
}

export function resolveStoryTone(category: string | null | undefined): StoryTone {
  return TONE_BY_CATEGORY[(category ?? '').trim().toLowerCase()] ?? 'elegant'
}
