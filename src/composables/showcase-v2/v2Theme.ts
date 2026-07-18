/**
 * "Storybook Romance" theme for the V2 showcase template.
 *
 * The V2 template is intentionally self-contained: it does NOT read event
 * template data (colors/fonts/assets). Every color and font comes from here,
 * so all weddings render the same editorial storybook look.
 */
export const V2_COLORS = {
  ivory: '#FAF6F0',
  blush: '#E8B4B8',
  blushDeep: '#C98A90',
  sage: '#A8B5A0',
  sageDeep: '#7C8B74',
  charcoal: '#3E3A36',
  gold: '#C9A66B',
  inkSoft: '#5C564F',
} as const

export const V2_FONTS = {
  /** Serif display — chapter titles, names, editorial passages. */
  display: `'Cormorant Garamond', 'Kantumruy Pro', Georgia, serif`,
  /** Clean sans body. */
  body: `'Karla', 'Kantumruy Pro', system-ui, sans-serif`,
} as const

/** CSS custom properties applied on the V2 experience root. */
export const V2_CSS_VARS: Record<string, string> = {
  '--v2-ivory': V2_COLORS.ivory,
  '--v2-blush': V2_COLORS.blush,
  '--v2-blush-deep': V2_COLORS.blushDeep,
  '--v2-sage': V2_COLORS.sage,
  '--v2-sage-deep': V2_COLORS.sageDeep,
  '--v2-charcoal': V2_COLORS.charcoal,
  '--v2-gold': V2_COLORS.gold,
  '--v2-ink-soft': V2_COLORS.inkSoft,
  '--v2-display': V2_FONTS.display,
  '--v2-body': V2_FONTS.body,
}
