/**
 * The homepage below the hero, as data: which feature sits in which group, the
 * steps, the questions. Shared by the page (LandingSections and its parts) and
 * by build/prerenderBodies.ts, which writes the same sections into the static
 * HTML crawlers read — so this file imports nothing at all. Key order is page
 * order; every key names a message under `events.landing.*`.
 */

/**
 * The six features, split by who they are for. Four live on the invitation a
 * guest opens; two live in the organizer's own tools. That split is the
 * section's structure, because it is the question a visitor is asking: what
 * will my guests see, and what do I get.
 */
export const FEATURE_GROUPS = [
  { key: 'forGuests', features: ['personal', 'bilingual', 'media', 'rsvp'] },
  { key: 'forYou', features: ['guests', 'tickets'] },
] as const

export type FeatureKey = (typeof FEATURE_GROUPS)[number]['features'][number]

export const STEPS = ['create', 'design', 'share'] as const

/** The step that carries the design catalogue: choosing a design is where the designs belong. */
export const DESIGN_STEP: (typeof STEPS)[number] = 'design'

export const FAQ = ['guests', 'languages', 'cost', 'edit', 'help'] as const
