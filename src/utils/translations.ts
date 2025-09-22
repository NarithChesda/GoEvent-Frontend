// Translation utilities for RSVP section and other components
export type SupportedLanguage = 'en' | 'kh' | 'zh-cn'

// RSVP Translation Dictionary
export const rsvpTranslations: Record<
  SupportedLanguage,
  {
    // Main headers
    rsvp_header: string
    invite_text: string

    // Buttons
    rsvp_yes_button: string
    rsvp_no_button: string
    rsvp_sign_in_button: string

    // Status indicators
    rsvp_attending: string
    rsvp_cant_attend: string

    // Guest management
    rsvp_additional_guests: string
    rsvp_total_attending: string
    rsvp_person: string
    rsvp_people: string

    // Date and time formats
    date_format_long: string // For full date display
    date_format_compact: string // For compact date display
    time_format: string // For time display

    // Time units
    rsvp_days: string
    rsvp_hours: string
    rsvp_minutes: string
    rsvp_seconds: string

    // Status messages
    rsvp_status_live: string
    rsvp_status_ended: string
    rsvp_thank_you: string
    rsvp_sign_in: string

    // Loading and action states
    rsvp_loading_status: string
    rsvp_registering: string
    rsvp_updating: string
    rsvp_saving: string

    // Guest count management
    rsvp_unsaved_changes: string
    rsvp_save_now: string
    rsvp_auto_save: string

    // System messages
    rsvp_confirmation: string
    rsvp_dismiss: string

    // Success messages
    rsvp_registration_success: string
    rsvp_unregister_success: string
    rsvp_guest_update_success: string
    rsvp_thank_you_simple: string

    // Agenda section
    agenda_header: string
    agenda_activity: string
    agenda_activities: string

    // Location section
    location_header: string

    // Video section
    video_header: string

    // Gallery section
    gallery_header: string

    // Comment section
    comment_header: string
    comment_placeholder: string
    comment_signin_prompt: string
    comment_signin_button: string
    comment_post_button: string
    comment_posting_button: string
    comment_no_comments: string
    comment_loading: string
    comment_already_commented: string
    comment_one_per_user: string
    comment_you_badge: string

    // Payment section
    payment_wedding_gift: string
    payment_birthday_gift: string

    // Footer section
    footer_thank_you: string
    footer_create_invitations: string

    // Floating menu section
    floating_menu_language: string
    floating_menu_music_on: string
    floating_menu_music_off: string
    floating_menu_rsvp: string
    floating_menu_reminder: string
    floating_menu_agenda: string
    floating_menu_location: string
    floating_menu_video: string
    floating_menu_gallery: string
    floating_menu_gift: string
    floating_menu_comment: string
    floating_menu_logout: string
    floating_menu_select_language: string
  }
> = {
  en: {
    // Main headers
    rsvp_header: 'Will you attend our wedding?',
    invite_text: "You're Invited",

    // Buttons
    rsvp_yes_button: "Yes, I'll attend",
    rsvp_no_button: "Can't attend",
    rsvp_sign_in_button: 'Sign In to RSVP',

    // Status indicators
    rsvp_attending: 'Attending',
    rsvp_cant_attend: "Can't attend",

    // Guest management
    rsvp_additional_guests: 'Additional guests',
    rsvp_total_attending: 'Total attending',
    rsvp_person: 'person',
    rsvp_people: 'people',

    // Date and time formats
    date_format_long: 'EEEE, MMMM d, yyyy', // e.g., "Friday, December 25, 2024"
    date_format_compact: 'MMM d', // e.g., "Dec 25"
    time_format: 'h:mm a', // e.g., "3:30 PM"

    // Time units
    rsvp_days: 'd',
    rsvp_hours: 'h',
    rsvp_minutes: 'm',
    rsvp_seconds: 's',

    // Status messages
    rsvp_status_live: 'Live',
    rsvp_status_ended: 'Ended',
    rsvp_thank_you: 'Thank you for your response',
    rsvp_sign_in: 'Please sign in to RSVP for this event',

    // Loading and action states
    rsvp_loading_status: 'Loading your RSVP status...',
    rsvp_registering: 'Registering...',
    rsvp_updating: 'Updating...',
    rsvp_saving: 'Saving...',

    // Guest count management
    rsvp_unsaved_changes: 'Unsaved changes',
    rsvp_save_now: 'Save now',
    rsvp_auto_save: 'Auto-saves in',

    // System messages
    rsvp_confirmation: 'Confirmation:',
    rsvp_dismiss: 'Dismiss',

    // Success messages
    rsvp_registration_success: "Great! You're registered with {count} {unit}.",
    rsvp_unregister_success: "We're sorry you can't make it. Thank you for letting us know.",
    rsvp_guest_update_success: 'Updated guest count to {count} {unit}',
    rsvp_thank_you_simple: 'Thank you for your response.',

    // Agenda section
    agenda_header: 'Event Schedule',
    agenda_activity: 'activity',
    agenda_activities: 'activities',

    // Location section
    location_header: 'Location',

    // Video section
    video_header: 'Video',

    // Gallery section
    gallery_header: 'Photo Gallery',

    // Comment section
    comment_header: 'Comments & Wishes',
    comment_placeholder: 'Share your thoughts, wishes, or congratulations...',
    comment_signin_prompt: 'Please sign in to leave a comment',
    comment_signin_button: 'Sign In to Comment',
    comment_post_button: 'Post Comment',
    comment_posting_button: 'Posting...',
    comment_no_comments: 'Be the first to leave a comment!',
    comment_loading: 'Loading comments...',
    comment_already_commented: 'You have already left a comment for this event',
    comment_one_per_user: 'Each user can only comment once per event',
    comment_you_badge: 'You',

    // Payment section
    payment_wedding_gift: 'Wedding Gift',
    payment_birthday_gift: 'Birthday Gift',

    // Footer section
    footer_thank_you: 'Thank you for celebrating with us',
    footer_create_invitations: 'Create beautiful event invitations',

    // Floating menu section
    floating_menu_language: 'Language',
    floating_menu_music_on: 'Music On',
    floating_menu_music_off: 'Music Off',
    floating_menu_rsvp: 'RSVP',
    floating_menu_reminder: 'Reminder',
    floating_menu_agenda: 'Agenda',
    floating_menu_location: 'Location',
    floating_menu_video: 'Video',
    floating_menu_gallery: 'Gallery',
    floating_menu_gift: 'Gift',
    floating_menu_comment: 'Comment',
    floating_menu_logout: 'Logout',
    floating_menu_select_language: 'Select Language',
  },

  kh: {
    // Main headers
    rsvp_header: 'តើអ្នកនឹងបានចូលរួមពិធីអាពាហ៍ពិពាហ៍របស់យើងទេ?',
    invite_text: 'សូមគោរពអញ្ជើញ',

    // Buttons
    rsvp_yes_button: 'ខ្ញុំនឹងចូលរួម',
    rsvp_no_button: 'មិនចូលរួម',
    rsvp_sign_in_button: 'ចូលគណនី ដើម្បី RSVP',

    // Status indicators
    rsvp_attending: 'ចូលរួម',
    rsvp_cant_attend: 'មិនចូលរួម',

    // Guest management
    rsvp_additional_guests: 'ភ្ញៀវបន្ថែម',
    rsvp_total_attending: 'សរុបចូលរួម',
    rsvp_person: 'នាក់',
    rsvp_people: 'នាក់',

    // Date and time formats
    date_format_long: 'EEEE ទី d ខែ MMMM ឆ្នាំ yyyy', // Khmer date format
    date_format_compact: 'd MMM', // Short format
    time_format: 'H:mm', // 24-hour format commonly used in Cambodia

    // Time units
    rsvp_days: 'ថ្ងៃ',
    rsvp_hours: 'ម៉ោង',
    rsvp_minutes: 'នាទី',
    rsvp_seconds: 'វិ',

    // Status messages
    rsvp_status_live: 'Live',
    rsvp_status_ended: 'Ended',
    rsvp_thank_you: 'សូមអរគុណចំពោះការឆ្លើយតប',
    rsvp_sign_in: 'សូមចូលគណនី ដើម្បីធ្វើ RSVP សម្រាប់ព្រឹត្តិការណ៍នេះ',

    // Loading and action states
    rsvp_loading_status: 'កំពុងផ្ទុកស្ថានភាព RSVP របស់អ្នក...',
    rsvp_registering: 'កំពុងចុះឈ្មោះ...',
    rsvp_updating: 'កំពុងកែប្រែ...',
    rsvp_saving: 'កំពុងរក្សាទុក...',

    // Guest count management
    rsvp_unsaved_changes: 'មានការផ្លាស់ប្តូរមិនទាន់រក្សាទុក',
    rsvp_save_now: 'រក្សាទុកឥឡូវ',
    rsvp_auto_save: 'រក្សាទុកស្វ័យប្រវត្តិក្នុងរយៈពេល',

    // System messages
    rsvp_confirmation: 'លេខបញ្ជាក់៖',
    rsvp_dismiss: 'បោះបង់',

    // Success messages
    rsvp_registration_success: 'អស្ចារ្យ! អ្នកបានចុះឈ្មោះជាមួយ {count} {unit}។',
    rsvp_unregister_success: 'យើងសោកស្តាយដែលអ្នកមិនអាចមកបាន។ សូមអរគុណដែលបានជូនដំណឹង។',
    rsvp_guest_update_success: 'បានកែប្រែចំនួនភ្ញៀវទៅ {count} {unit}',
    rsvp_thank_you_simple: 'សូមអរគុណចំពោះការឆ្លើយតប។',

    // Agenda section
    agenda_header: 'កាលវិភាគព្រឹត្តិការណ៍',
    agenda_activity: 'សកម្មភាព',
    agenda_activities: 'សកម្មភាព',

    // Location section
    location_header: 'ទីតាំង',

    // Video section
    video_header: 'វីដេអូ',

    // Gallery section
    gallery_header: 'រូបថត',

    // Comment section
    comment_header: 'សារជូនពរ',
    comment_placeholder: 'ចាំរូបការគិត, ប្រារ្ថនា, ឬ សំឌើងអារម្មណ៍របស់អ្នក...',
    comment_signin_prompt: 'សូមចូលគណនី ដើម្បីដាក់មតិយោបល់',
    comment_signin_button: 'ចូលគណនី ដើម្បីមតិយោបល់',
    comment_post_button: 'ប៉ុព្វមតិយោបល់',
    comment_posting_button: 'កំពុងប៉ុព្វ...',
    comment_no_comments: 'ក្លាយជាអ្នកដំបូងក្នុងការដាក់មតិយោបល់!',
    comment_loading: 'កំពុងនីមតិយោបល់...',
    comment_already_commented: 'អ្នកបានបញ្ចេញមតិរួចហើយ',
    comment_one_per_user: 'អ្នកប្រើប្រាស់ម្នាក់អាចមតិយោបល់បានជំនាញសម្រាប់ព្រឹត្តិការណ៍មួយ',
    comment_you_badge: 'You',

    // Payment section
    payment_wedding_gift: 'ចងដៃ',
    payment_birthday_gift: 'អំណោយ',

    // Footer section
    footer_thank_you: 'អរគុណសម្រាប់ការចូលរួមអបអរសាទរជាមួយយើង',
    footer_create_invitations: 'ងាយស្រួលពេលមានកម្មវិធី',

    // Floating menu section
    floating_menu_language: 'ភាសា',
    floating_menu_music_on: 'បើកតន្ត្រី',
    floating_menu_music_off: 'បិទតន្ត្រី',
    floating_menu_rsvp: 'RSVP',
    floating_menu_reminder: 'រំលឹក',
    floating_menu_agenda: 'កាលវិភាគ',
    floating_menu_location: 'ទីតាំង',
    floating_menu_video: 'វីដេអូ',
    floating_menu_gallery: 'រូបថត',
    floating_menu_gift: 'អំណោយ',
    floating_menu_comment: 'មតិយោបល់',
    floating_menu_logout: 'ចាកចេញ',
    floating_menu_select_language: 'ជ្រើសរើសភាសា',
  },

  'zh-cn': {
    // Main headers
    rsvp_header: '您会参加我们的婚礼吗？',
    invite_text: '诚邀您',

    // Buttons
    rsvp_yes_button: '是的，我会参加',
    rsvp_no_button: '无法参加',
    rsvp_sign_in_button: '登录以回复',

    // Status indicators
    rsvp_attending: '参加',
    rsvp_cant_attend: '无法参加',

    // Guest management
    rsvp_additional_guests: '额外客人',
    rsvp_total_attending: '总参加人数',
    rsvp_person: '人',
    rsvp_people: '人',

    // Date and time formats
    date_format_long: 'yyyy年MMMM月d日 EEEE',
    date_format_compact: 'M月d日',
    time_format: 'HH:mm',

    // Time units
    rsvp_days: '天',
    rsvp_hours: '小时',
    rsvp_minutes: '分钟',
    rsvp_seconds: '秒',

    // Status messages
    rsvp_status_live: '进行中',
    rsvp_status_ended: '已结束',
    rsvp_thank_you: '谢谢您的回复',
    rsvp_sign_in: '请登录以回复此活动',

    // Loading and action states
    rsvp_loading_status: '正在加载您的回复状态...',
    rsvp_registering: '注册中...',
    rsvp_updating: '更新中...',
    rsvp_saving: '保存中...',

    // Guest count management
    rsvp_unsaved_changes: '未保存的更改',
    rsvp_save_now: '立即保存',
    rsvp_auto_save: '自动保存于',

    // System messages
    rsvp_confirmation: '确认码：',
    rsvp_dismiss: '关闭',

    // Success messages
    rsvp_registration_success: '太好了！您已注册{count}{unit}。',
    rsvp_unregister_success: '很遗憾您无法参加。感谢您告知我们。',
    rsvp_guest_update_success: '已将客人数量更新为{count}{unit}',
    rsvp_thank_you_simple: '谢谢您的回复。',

    // Agenda section
    agenda_header: '活动日程',
    agenda_activity: '活动',
    agenda_activities: '活动',

    // Location section
    location_header: '位置',

    // Video section
    video_header: '视频',

    // Gallery section
    gallery_header: '照片库',

    // Comment section
    comment_header: '评论与祈愿',
    comment_placeholder: '分享您的想法、祈愿或祝贺...',
    comment_signin_prompt: '请登录后留言',
    comment_signin_button: '登录评论',
    comment_post_button: '发表评论',
    comment_posting_button: '发表中...',
    comment_no_comments: '成为第一个留言的人吧！',
    comment_loading: '加载评论中...',
    comment_already_commented: '您已经为此活动留言了',
    comment_one_per_user: '每个用户每个活动只能评论一次',
    comment_you_badge: '您',

    // Payment section
    payment_wedding_gift: '结婚礼品',
    payment_birthday_gift: '生日礼品',

    // Footer section
    footer_thank_you: '感谢您与我们一同庆祝',
    footer_create_invitations: '创建精美的活动邀请函',

    // Floating menu section
    floating_menu_language: '语言',
    floating_menu_music_on: '打开音乐',
    floating_menu_music_off: '关闭音乐',
    floating_menu_rsvp: 'RSVP',
    floating_menu_reminder: '提醒',
    floating_menu_agenda: '日程',
    floating_menu_location: '位置',
    floating_menu_video: '视频',
    floating_menu_gallery: '照片库',
    floating_menu_gift: '礼物',
    floating_menu_comment: '评论',
    floating_menu_logout: '退出',
    floating_menu_select_language: '选择语言',
  },
}

// Translation function with fallback support
export function translateRSVP(
  key: keyof typeof rsvpTranslations.en,
  language: SupportedLanguage = 'en',
  replacements?: Record<string, string | number>,
): string {
  // Get translation from dictionary, fallback to English if not found
  const translations = rsvpTranslations[language] || rsvpTranslations.en
  let translation = translations[key] || rsvpTranslations.en[key] || key

  // Apply string replacements if provided
  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, value]) => {
      translation = translation.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value))
    })
  }

  return translation
}

// Date formatting with localization support
export function formatDateLocalized(
  date: Date | string,
  format: 'long' | 'compact',
  language: SupportedLanguage = 'en',
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (language === 'kh') {
      // Custom Khmer date formatting
      const khmerMonths = [
        'មករា',
        'កុម្ភៈ',
        'មីនា',
        'មេសា',
        'ឧសភា',
        'មិថុនា',
        'កក្កដា',
        'សីហា',
        'កញ្ញា',
        'តុលា',
        'វិច្ឆិកា',
        'ធ្នូ',
      ]
      const khmerDays = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍']

      if (format === 'long') {
        return `${khmerDays[dateObj.getDay()]} ទី${dateObj.getDate()} ខែ${khmerMonths[dateObj.getMonth()]} ឆ្នាំ${dateObj.getFullYear()}`
      } else {
        return `${dateObj.getDate()} ${khmerMonths[dateObj.getMonth()]}`
      }
    }

    // Use standard Intl.DateTimeFormat for other languages
    const localeMap: Record<SupportedLanguage, string> = {
      en: 'en-US',
      kh: 'km-KH',
      'zh-cn': 'zh-CN',
    }

    const locale = localeMap[language] || 'en-US'
    const options: Intl.DateTimeFormatOptions =
      format === 'long'
        ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        : { month: 'short', day: 'numeric' }

    return dateObj.toLocaleDateString(locale, options)
  } catch (error) {
    console.error('Error formatting date:', error)
    return typeof date === 'string' ? date : date.toLocaleDateString()
  }
}

// Time formatting with localization support
export function formatTimeLocalized(
  date: Date | string,
  language: SupportedLanguage = 'en',
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    const localeMap: Record<SupportedLanguage, string> = {
      en: 'en-US',
      kh: 'km-KH',
      'zh-cn': 'zh-CN',
    }

    const locale = localeMap[language] || 'en-US'

    // Use 24-hour format for most Asian languages, 12-hour for English
    const options: Intl.DateTimeFormatOptions =
      language === 'en'
        ? { hour: 'numeric', minute: '2-digit', hour12: true }
        : { hour: '2-digit', minute: '2-digit', hour12: false }

    return dateObj.toLocaleTimeString(locale, options)
  } catch (error) {
    console.error('Error formatting time:', error)
    return typeof date === 'string' ? date : date.toLocaleTimeString()
  }
}

// Utility to get person/people unit based on count and language
export function getPersonUnit(count: number, language: SupportedLanguage = 'en'): string {
  const translations = rsvpTranslations[language] || rsvpTranslations.en

  // For most Asian languages, singular and plural are the same
  if (['kh', 'zh-cn'].includes(language)) {
    return translations.rsvp_person
  }

  // For Western languages, use singular/plural distinction
  return count === 1 ? translations.rsvp_person : translations.rsvp_people
}
