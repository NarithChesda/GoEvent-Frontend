/**
 * Browser detection utilities for identifying messaging app browsers
 * and other special browser environments
 */

/**
 * Detects if the user is accessing the page from Telegram's in-app browser
 */
export function isTelegramBrowser(): boolean {
  const userAgent = navigator.userAgent || ''

  // Check for Telegram-specific user agent strings and platform
  // Telegram on different platforms has different signatures
  return /TelegramBot|Telegram/i.test(userAgent) ||
         /TDesktop|TG/i.test(userAgent) ||
         // Check if opened via Telegram's webview
         window.location.href.includes('tgWebAppPlatform') ||
         // Check Telegram Web App API
         !!(window as any).Telegram?.WebApp
}

/**
 * Detects if the user is accessing the page from a messaging app browser
 * (Telegram, WhatsApp, Facebook Messenger, LINE, WeChat, etc.)
 */
export function isMessagingAppBrowser(): boolean {
  const userAgent = navigator.userAgent || ''

  // First check if it's Telegram using the enhanced detection
  if (isTelegramBrowser()) {
    return true
  }

  // Check for various messaging app browsers
  const messagingAppPatterns = [
    /WhatsApp/i,
    /FB_IAB|FBAN|FBAV/i, // Facebook in-app browser
    /Line/i,
    /MicroMessenger/i, // WeChat
    /Viber/i,
    /KakaoTalk/i,
    /Snapchat/i,
    /Instagram/i,
    /Twitter/i,
    /LIFF/i, // LINE Front-end Framework
    /Messenger/i,
  ]

  return messagingAppPatterns.some(pattern => pattern.test(userAgent))
}

/**
 * Detects if the user is accessing the page from Facebook Messenger's in-app browser
 */
export function isFacebookMessenger(): boolean {
  const userAgent = navigator.userAgent || ''
  // FB_IAB = Facebook In-App Browser, FBAN = Facebook App Name, FBAV = Facebook App Version
  // Messenger = Facebook Messenger standalone app
  return /FB_IAB|FBAN|FBAV|Messenger/i.test(userAgent)
}

/**
 * Detects if the user is on a mobile device
 */
export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent || ''

  // Check for mobile device indicators
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(userAgent)
}

/**
 * Detects if the user is accessing the page from a normal web browser
 * (Chrome, Safari, Firefox, Edge, etc.)
 */
export function isNormalBrowser(): boolean {
  return !isMessagingAppBrowser()
}

/**
 * Detects if the user is on a desktop/computer (not mobile)
 */
export function isDesktopDevice(): boolean {
  return !isMobileDevice()
}

/**
 * Gets the browser type for debugging purposes
 */
export function getBrowserType(): string {
  const userAgent = navigator.userAgent || ''

  if (/TelegramBot|Telegram/i.test(userAgent)) return 'Telegram'
  if (/WhatsApp/i.test(userAgent)) return 'WhatsApp'
  if (/FB_IAB|FBAN|FBAV/i.test(userAgent)) return 'Facebook'
  if (/Line/i.test(userAgent)) return 'LINE'
  if (/MicroMessenger/i.test(userAgent)) return 'WeChat'
  if (/Viber/i.test(userAgent)) return 'Viber'
  if (/KakaoTalk/i.test(userAgent)) return 'KakaoTalk'
  if (/Snapchat/i.test(userAgent)) return 'Snapchat'
  if (/Instagram/i.test(userAgent)) return 'Instagram'
  if (/Twitter/i.test(userAgent)) return 'Twitter'
  if (/Chrome/i.test(userAgent)) return 'Chrome'
  if (/Safari/i.test(userAgent)) return 'Safari'
  if (/Firefox/i.test(userAgent)) return 'Firefox'
  if (/Edge/i.test(userAgent)) return 'Edge'

  return 'Unknown'
}
