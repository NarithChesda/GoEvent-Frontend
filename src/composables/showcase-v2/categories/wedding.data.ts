import type { SupportedLanguage } from '../../../utils/translations'
import type { V2ColorPalette, V2Fonts } from '../v2Theme'
import type { V2CategoryTranslations } from '../v2Translations'

/**
 * "Storybook Romance" — the wedding V2 look. Default palette/fonts used
 * whenever a wedding template doesn't define its own `v2-*` colors/fonts
 * (see `v2Theme.ts`'s `resolveV2Colors`).
 *
 * Pure data only (no component imports) so both `categories/wedding.ts`
 * (which imports the wedding .vue components) and the wedding components
 * themselves (which need `WEDDING_TRANSLATIONS`) can import from here
 * without a circular dependency.
 */
export const WEDDING_COLORS: V2ColorPalette = {
  ivory: '#FAF6F0',
  blush: '#E8B4B8',
  blushDeep: '#C98A90',
  sage: '#A8B5A0',
  sageDeep: '#7C8B74',
  charcoal: '#3E3A36',
  gold: '#C9A66B',
  inkSoft: '#5C564F',
}

export const WEDDING_FONTS: V2Fonts = {
  /** Serif display — chapter titles, names, editorial passages. */
  display: `'Cormorant Garamond', 'Kantumruy Pro', Georgia, serif`,
  /** Clean sans body. */
  body: `'Karla', 'Kantumruy Pro', system-ui, sans-serif`,
}

/** Fallback glyph for the cover seal / footer monogram when no names resolve. */
export const WEDDING_MONOGRAM_FALLBACK = '♥'

/**
 * Wedding-only strings (no reasonable generic default, e.g. "We're tying the
 * knot") plus romance-specific overrides of shared `v2Translations.ts` keys
 * (e.g. "Wedding Gift" instead of the generic "Gift").
 */
const weddingTranslationsRaw = {
  en: {
    eyebrow_families: 'Together with their families',
    getting_married: 'are getting married',
    tying_knot: "We're tying the knot",
    with_love: 'with love',
    scroll_to_begin: 'Scroll to read our story',
    chapter_story: 'Our Story',
    chapter_gift: 'Wedding Gift',
    gift_note:
      'Your presence is the greatest gift. Should you wish to honor us with more, a token via the details above is warmly appreciated.',
    countdown_title: 'Counting down to our special day',
    leave_blessing: 'Leave a blessing for the couple…',
    be_first: 'Be the first to leave a blessing',
    already_blessed: 'Thank you for your blessing!',
    sign_in_to_comment: 'Sign in to leave a blessing',
    delete_confirm: 'Delete your blessing?',
    footer_thank_you: 'Thank you for being part of our story',
  },
  kh: {
    eyebrow_families: 'រួមជាមួយក្រុមគ្រួសារទាំងពីរ',
    getting_married: 'នឹងរៀបអាពាហ៍ពិពាហ៍',
    tying_knot: 'យើងនឹងរៀបការហើយ',
    with_love: 'ដោយក្តីស្រឡាញ់',
    scroll_to_begin: 'អូសចុះក្រោមដើម្បីអានរឿងរ៉ាវរបស់យើង',
    chapter_story: 'រឿងរ៉ាវរបស់យើង',
    chapter_gift: 'ចងដៃ',
    gift_note: 'វត្តមានរបស់អ្នកគឺជាអំណោយដ៏ធំបំផុតរបស់យើង។ ប្រសិនបើអ្នកចង់ជូនអំណោយបន្ថែម សូមប្រើព័ត៌មានខាងលើ។',
    countdown_title: 'រាប់ថយក្រោយដល់ថ្ងៃពិសេសរបស់យើង',
    leave_blessing: 'សូមផ្ញើពាក្យជូនពរដល់គូស្វាមីភរិយា…',
    be_first: 'ក្លាយជាអ្នកដំបូងដែលផ្ញើពាក្យជូនពរ',
    already_blessed: 'សូមអរគុណសម្រាប់ពាក្យជូនពររបស់អ្នក!',
    sign_in_to_comment: 'ចូលគណនីដើម្បីផ្ញើពាក្យជូនពរ',
    delete_confirm: 'លុបពាក្យជូនពររបស់អ្នក?',
    footer_thank_you: 'សូមអរគុណដែលបានចូលរួមក្នុងរឿងរ៉ាវរបស់យើង',
  },
  'zh-cn': {
    eyebrow_families: '两个家庭携手',
    getting_married: '即将喜结连理',
    tying_knot: '我们要结婚啦',
    with_love: '爱意满满',
    scroll_to_begin: '向下滑动阅读我们的故事',
    chapter_story: '我们的故事',
    chapter_gift: '礼金',
    gift_note: '您的到来就是给我们最好的礼物。如您仍希望表达心意，欢迎使用上方信息。',
    countdown_title: '距离我们的大喜之日',
    leave_blessing: '为新人留下祝福…',
    be_first: '成为第一个送上祝福的人',
    already_blessed: '感谢您的祝福！',
    sign_in_to_comment: '登录后留下祝福',
    delete_confirm: '删除您的祝福？',
    footer_thank_you: '感谢您成为我们故事的一部分',
  },
} satisfies Partial<Record<SupportedLanguage, Record<string, string>>>

/** Keys only the wedding variant defines (no generic default in v2Translations.ts). */
export type WeddingTranslationKey = keyof (typeof weddingTranslationsRaw)['en']

export const WEDDING_TRANSLATIONS: V2CategoryTranslations = weddingTranslationsRaw
