// Translation utilities for RSVP section and other components
export type SupportedLanguage = 'en' | 'kh' | 'fr' | 'ja' | 'ko' | 'zh-cn' | 'th' | 'vn'

// RSVP Translation Dictionary
export const rsvpTranslations: Record<SupportedLanguage, {
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
}> = {
  en: {
    // Main headers
    rsvp_header: 'Will you attend our wedding?',
    invite_text: 'You\'re Invited',

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
    rsvp_registration_success: 'Great! You\'re registered with {count} {unit}.',
    rsvp_unregister_success: 'We\'re sorry you can\'t make it. Thank you for letting us know.',
    rsvp_guest_update_success: 'Updated guest count to {count} {unit}',
    rsvp_thank_you_simple: 'Thank you for your response.',

    // Agenda section
    agenda_header: 'Event Schedule',
    agenda_activity: 'activity',
    agenda_activities: 'activities'
  },

  kh: {
    // Main headers
    rsvp_header: 'តើអ្នកនឹងចូលរួមពិធីរៀបការរបស់យើងទេ?',
    invite_text: 'អ្នកត្រូវបានអញ្ជើញ',

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
    agenda_activities: 'សកម្មភាព'
  },

  fr: {
    // Main headers
    rsvp_header: 'Assisterez-vous à notre mariage ?',
    invite_text: 'Vous êtes invité',

    // Buttons
    rsvp_yes_button: 'Oui, je viendrai',
    rsvp_no_button: 'Ne peut pas venir',
    rsvp_sign_in_button: 'Se connecter pour RSVP',

    // Status indicators
    rsvp_attending: 'Participe',
    rsvp_cant_attend: 'Ne peut pas venir',

    // Guest management
    rsvp_additional_guests: 'Invités supplémentaires',
    rsvp_total_attending: 'Total participants',
    rsvp_person: 'personne',
    rsvp_people: 'personnes',

    // Date and time formats
    date_format_long: 'EEEE d MMMM yyyy',
    date_format_compact: 'd MMM',
    time_format: 'HH:mm',

    // Time units
    rsvp_days: 'j',
    rsvp_hours: 'h',
    rsvp_minutes: 'm',
    rsvp_seconds: 's',

    // Status messages
    rsvp_status_live: 'En direct',
    rsvp_status_ended: 'Terminé',
    rsvp_thank_you: 'Merci pour votre réponse',
    rsvp_sign_in: 'Veuillez vous connecter pour confirmer votre présence',

    // Loading and action states
    rsvp_loading_status: 'Chargement de votre statut RSVP...',
    rsvp_registering: 'Inscription...',
    rsvp_updating: 'Mise à jour...',
    rsvp_saving: 'Sauvegarde...',

    // Guest count management
    rsvp_unsaved_changes: 'Modifications non sauvegardées',
    rsvp_save_now: 'Sauvegarder maintenant',
    rsvp_auto_save: 'Sauvegarde automatique dans',

    // System messages
    rsvp_confirmation: 'Confirmation :',
    rsvp_dismiss: 'Ignorer',

    // Success messages
    rsvp_registration_success: 'Parfait ! Vous êtes inscrit avec {count} {unit}.',
    rsvp_unregister_success: 'Nous regrettons que vous ne puissiez pas venir. Merci de nous avoir prévenus.',
    rsvp_guest_update_success: 'Nombre d\'invités mis à jour à {count} {unit}',
    rsvp_thank_you_simple: 'Merci pour votre réponse.',

    // Agenda section
    agenda_header: 'Programme de l\'événement',
    agenda_activity: 'activité',
    agenda_activities: 'activités'
  },

  ja: {
    // Main headers
    rsvp_header: '結婚式にご出席いただけますか？',
    invite_text: 'ご招待',

    // Buttons
    rsvp_yes_button: 'はい、出席します',
    rsvp_no_button: '欠席します',
    rsvp_sign_in_button: 'サインインしてRSVP',

    // Status indicators
    rsvp_attending: '出席',
    rsvp_cant_attend: '欠席',

    // Guest management
    rsvp_additional_guests: '追加ゲスト',
    rsvp_total_attending: '出席者合計',
    rsvp_person: '名',
    rsvp_people: '名',

    // Date and time formats
    date_format_long: 'yyyy年MMMM月d日 EEEE',
    date_format_compact: 'M月d日',
    time_format: 'HH:mm',

    // Time units
    rsvp_days: '日',
    rsvp_hours: '時',
    rsvp_minutes: '分',
    rsvp_seconds: '秒',

    // Status messages
    rsvp_status_live: 'ライブ',
    rsvp_status_ended: '終了',
    rsvp_thank_you: 'ご返答ありがとうございます',
    rsvp_sign_in: 'このイベントにRSVPするためにサインインしてください',

    // Loading and action states
    rsvp_loading_status: 'RSVPステータスを読み込み中...',
    rsvp_registering: '登録中...',
    rsvp_updating: '更新中...',
    rsvp_saving: '保存中...',

    // Guest count management
    rsvp_unsaved_changes: '未保存の変更',
    rsvp_save_now: '今すぐ保存',
    rsvp_auto_save: '自動保存まで',

    // System messages
    rsvp_confirmation: '確認番号：',
    rsvp_dismiss: '閉じる',

    // Success messages
    rsvp_registration_success: '素晴らしい！{count}{unit}で登録されました。',
    rsvp_unregister_success: 'ご出席いただけず残念です。お知らせいただきありがとうございます。',
    rsvp_guest_update_success: 'ゲスト数を{count}{unit}に更新しました',
    rsvp_thank_you_simple: 'ご返答ありがとうございます。',

    // Agenda section
    agenda_header: 'イベントスケジュール',
    agenda_activity: '活動',
    agenda_activities: '活動'
  },

  ko: {
    // Main headers
    rsvp_header: '저희 결혼식에 참석하실 예정인가요?',
    invite_text: '초대합니다',

    // Buttons
    rsvp_yes_button: '네, 참석하겠습니다',
    rsvp_no_button: '참석할 수 없습니다',
    rsvp_sign_in_button: '로그인하여 RSVP',

    // Status indicators
    rsvp_attending: '참석',
    rsvp_cant_attend: '불참',

    // Guest management
    rsvp_additional_guests: '추가 게스트',
    rsvp_total_attending: '총 참석자',
    rsvp_person: '명',
    rsvp_people: '명',

    // Date and time formats
    date_format_long: 'yyyy년 MMMM월 d일 EEEE',
    date_format_compact: 'M월 d일',
    time_format: 'a h:mm',

    // Time units
    rsvp_days: '일',
    rsvp_hours: '시간',
    rsvp_minutes: '분',
    rsvp_seconds: '초',

    // Status messages
    rsvp_status_live: '라이브',
    rsvp_status_ended: '종료됨',
    rsvp_thank_you: '답변해 주셔서 감사합니다',
    rsvp_sign_in: '이 이벤트에 RSVP하려면 로그인해 주세요',

    // Loading and action states
    rsvp_loading_status: 'RSVP 상태를 불러오는 중...',
    rsvp_registering: '등록 중...',
    rsvp_updating: '업데이트 중...',
    rsvp_saving: '저장 중...',

    // Guest count management
    rsvp_unsaved_changes: '저장되지 않은 변경사항',
    rsvp_save_now: '지금 저장',
    rsvp_auto_save: '자동 저장까지',

    // System messages
    rsvp_confirmation: '확인번호:',
    rsvp_dismiss: '닫기',

    // Success messages
    rsvp_registration_success: '훌륭합니다! {count}{unit}으로 등록되었습니다.',
    rsvp_unregister_success: '참석하실 수 없어 아쉽습니다. 알려주셔서 감사합니다.',
    rsvp_guest_update_success: '게스트 수를 {count}{unit}으로 업데이트했습니다',
    rsvp_thank_you_simple: '답변해 주셔서 감사합니다.'
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
    rsvp_thank_you_simple: '谢谢您的回复。'
  },

  th: {
    // Main headers
    rsvp_header: 'คุณจะเข้าร่วมงานแต่งงานของเราไหม?',
    invite_text: 'คุณได้รับเชิญ',

    // Buttons
    rsvp_yes_button: 'ใช่ ฉันจะเข้าร่วม',
    rsvp_no_button: 'ไม่สามารถเข้าร่วมได้',
    rsvp_sign_in_button: 'เข้าสู่ระบบเพื่อ RSVP',

    // Status indicators
    rsvp_attending: 'เข้าร่วม',
    rsvp_cant_attend: 'ไม่สามารถเข้าร่วม',

    // Guest management
    rsvp_additional_guests: 'แขกเพิ่มเติม',
    rsvp_total_attending: 'รวมผู้เข้าร่วม',
    rsvp_person: 'คน',
    rsvp_people: 'คน',

    // Date and time formats
    date_format_long: 'EEEE ที่ d MMMM yyyy',
    date_format_compact: 'd MMM',
    time_format: 'HH:mm',

    // Time units
    rsvp_days: 'วัน',
    rsvp_hours: 'ชั่วโมง',
    rsvp_minutes: 'นาที',
    rsvp_seconds: 'วินาที',

    // Status messages
    rsvp_status_live: 'สด',
    rsvp_status_ended: 'สิ้นสุดแล้ว',
    rsvp_thank_you: 'ขอบคุณสำหรับการตอบกลับ',
    rsvp_sign_in: 'กรุณาเข้าสู่ระบบเพื่อ RSVP สำหรับกิจกรรมนี้',

    // Loading and action states
    rsvp_loading_status: 'กำลังโหลดสถานะ RSVP ของคุณ...',
    rsvp_registering: 'กำลังลงทะเบียน...',
    rsvp_updating: 'กำลังอัปเดต...',
    rsvp_saving: 'กำลังบันทึก...',

    // Guest count management
    rsvp_unsaved_changes: 'การเปลี่ยนแปลงที่ไม่ได้บันทึก',
    rsvp_save_now: 'บันทึกตอนนี้',
    rsvp_auto_save: 'บันทึกอัตโนมัติใน',

    // System messages
    rsvp_confirmation: 'รหัสยืนยัน:',
    rsvp_dismiss: 'ปิด',

    // Success messages
    rsvp_registration_success: 'ยอดเยี่ยม! คุณได้ลงทะเบียนแล้วจำนวน {count} {unit}',
    rsvp_unregister_success: 'เสียใจที่คุณไม่สามารถมาได้ ขอบคุณที่แจ้งให้เราทราบ',
    rsvp_guest_update_success: 'อัปเดตจำนวนแขกเป็น {count} {unit}',
    rsvp_thank_you_simple: 'ขอบคุณสำหรับการตอบกลับ'
  },

  vn: {
    // Main headers
    rsvp_header: 'Bạn có tham dự đám cưới của chúng tôi không?',
    invite_text: 'Bạn được mời',

    // Buttons
    rsvp_yes_button: 'Có, tôi sẽ tham dự',
    rsvp_no_button: 'Không thể tham dự',
    rsvp_sign_in_button: 'Đăng nhập để RSVP',

    // Status indicators
    rsvp_attending: 'Tham dự',
    rsvp_cant_attend: 'Không thể tham dự',

    // Guest management
    rsvp_additional_guests: 'Khách bổ sung',
    rsvp_total_attending: 'Tổng số người tham dự',
    rsvp_person: 'người',
    rsvp_people: 'người',

    // Date and time formats
    date_format_long: 'EEEE, ngày d tháng MMMM năm yyyy',
    date_format_compact: 'd MMM',
    time_format: 'HH:mm',

    // Time units
    rsvp_days: 'ngày',
    rsvp_hours: 'giờ',
    rsvp_minutes: 'phút',
    rsvp_seconds: 'giây',

    // Status messages
    rsvp_status_live: 'Trực tiếp',
    rsvp_status_ended: 'Đã kết thúc',
    rsvp_thank_you: 'Cảm ơn phản hồi của bạn',
    rsvp_sign_in: 'Vui lòng đăng nhập để RSVP cho sự kiện này',

    // Loading and action states
    rsvp_loading_status: 'Đang tải trạng thái RSVP của bạn...',
    rsvp_registering: 'Đang đăng ký...',
    rsvp_updating: 'Đang cập nhật...',
    rsvp_saving: 'Đang lưu...',

    // Guest count management
    rsvp_unsaved_changes: 'Thay đổi chưa lưu',
    rsvp_save_now: 'Lưu ngay',
    rsvp_auto_save: 'Tự động lưu trong',

    // System messages
    rsvp_confirmation: 'Mã xác nhận:',
    rsvp_dismiss: 'Đóng',

    // Success messages
    rsvp_registration_success: 'Tuyệt vời! Bạn đã đăng ký với {count} {unit}.',
    rsvp_unregister_success: 'Chúng tôi rất tiếc vì bạn không thể tham dự. Cảm ơn bạn đã thông báo.',
    rsvp_guest_update_success: 'Đã cập nhật số lượng khách thành {count} {unit}',
    rsvp_thank_you_simple: 'Cảm ơn phản hồi của bạn.'
  }
}

// Translation function with fallback support
export function translateRSVP(
  key: keyof typeof rsvpTranslations.en,
  language: SupportedLanguage = 'en',
  replacements?: Record<string, string | number>
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
  language: SupportedLanguage = 'en'
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (language === 'kh') {
      // Custom Khmer date formatting
      const khmerMonths = [
        'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
        'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
      ]
      const khmerDays = [
        'អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'
      ]

      if (format === 'long') {
        return `${khmerDays[dateObj.getDay()]} ទី${dateObj.getDate()} ខែ${khmerMonths[dateObj.getMonth()]} ឆ្នាំ${dateObj.getFullYear()}`
      } else {
        return `${dateObj.getDate()} ${khmerMonths[dateObj.getMonth()]}`
      }
    }

    // Use standard Intl.DateTimeFormat for other languages
    const localeMap: Record<SupportedLanguage, string> = {
      'en': 'en-US',
      'kh': 'km-KH',
      'fr': 'fr-FR',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh-cn': 'zh-CN',
      'th': 'th-TH',
      'vn': 'vi-VN'
    }

    const locale = localeMap[language] || 'en-US'
    const options: Intl.DateTimeFormatOptions = format === 'long'
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
  language: SupportedLanguage = 'en'
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    const localeMap: Record<SupportedLanguage, string> = {
      'en': 'en-US',
      'kh': 'km-KH',
      'fr': 'fr-FR',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh-cn': 'zh-CN',
      'th': 'th-TH',
      'vn': 'vi-VN'
    }

    const locale = localeMap[language] || 'en-US'

    // Use 24-hour format for most Asian languages, 12-hour for English
    const options: Intl.DateTimeFormatOptions = language === 'en' || language === 'ko'
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
  if (['kh', 'ja', 'ko', 'zh-cn', 'th', 'vn'].includes(language)) {
    return translations.rsvp_person
  }

  // For Western languages, use singular/plural distinction
  return count === 1 ? translations.rsvp_person : translations.rsvp_people
}
