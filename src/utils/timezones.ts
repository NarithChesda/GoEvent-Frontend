/**
 * Timezone utility for event scheduling
 * Provides comprehensive timezone data with UTC offsets and city names
 */

export interface TimezoneOption {
  value: string // IANA timezone identifier
  label: string // Display label with UTC offset and city/region name
  offset: string // UTC offset (e.g., "+05:00", "-08:00")
  region: string // Major city or region name
}

/**
 * Get current UTC offset for a timezone
 * @param timezone IANA timezone identifier
 * @returns UTC offset string (e.g., "+05:00", "-08:00")
 */
export function getTimezoneOffset(timezone: string): string {
  const now = new Date()
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  
  const offsetMs = tzDate.getTime() - utcDate.getTime()
  const offsetHours = Math.floor(offsetMs / (1000 * 60 * 60))
  const offsetMinutes = Math.floor((Math.abs(offsetMs) % (1000 * 60 * 60)) / (1000 * 60))
  
  const sign = offsetMs >= 0 ? '+' : '-'
  const hours = Math.abs(offsetHours).toString().padStart(2, '0')
  const minutes = offsetMinutes.toString().padStart(2, '0')
  
  return `${sign}${hours}:${minutes}`
}

/**
 * Asian timezones only - comprehensive list for regional events
 */
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  {
    value: 'Asia/Dubai',
    label: 'UTC+04:00 - Dubai (Gulf Standard Time)',
    offset: '+04:00',
    region: 'Dubai'
  },
  {
    value: 'Asia/Karachi',
    label: 'UTC+05:00 - Karachi (Pakistan Standard Time)',
    offset: '+05:00',
    region: 'Karachi'
  },
  {
    value: 'Asia/Kolkata',
    label: 'UTC+05:30 - Mumbai/Delhi (India Standard Time)',
    offset: '+05:30',
    region: 'Mumbai/Delhi'
  },
  {
    value: 'Asia/Dhaka',
    label: 'UTC+06:00 - Dhaka (Bangladesh Standard Time)',
    offset: '+06:00',
    region: 'Dhaka'
  },
  {
    value: 'Asia/Jakarta',
    label: 'UTC+07:00 - Jakarta (Western Indonesia Time)',
    offset: '+07:00',
    region: 'Jakarta'
  },
  {
    value: 'Asia/Bangkok',
    label: 'UTC+07:00 - Bangkok (Indochina Time)',
    offset: '+07:00',
    region: 'Bangkok'
  },
  {
    value: 'Asia/Ho_Chi_Minh',
    label: 'UTC+07:00 - Ho Chi Minh City (Indochina Time)',
    offset: '+07:00',
    region: 'Ho Chi Minh City'
  },
  {
    value: 'Asia/Singapore',
    label: 'UTC+08:00 - Singapore (Singapore Standard Time)',
    offset: '+08:00',
    region: 'Singapore'
  },
  {
    value: 'Asia/Hong_Kong',
    label: 'UTC+08:00 - Hong Kong (Hong Kong Standard Time)',
    offset: '+08:00',
    region: 'Hong Kong'
  },
  {
    value: 'Asia/Shanghai',
    label: 'UTC+08:00 - Shanghai (China Standard Time)',
    offset: '+08:00',
    region: 'Shanghai'
  },
  {
    value: 'Asia/Taipei',
    label: 'UTC+08:00 - Taipei (China Standard Time)',
    offset: '+08:00',
    region: 'Taipei'
  },
  {
    value: 'Asia/Manila',
    label: 'UTC+08:00 - Manila (Philippine Standard Time)',
    offset: '+08:00',
    region: 'Manila'
  },
  {
    value: 'Asia/Seoul',
    label: 'UTC+09:00 - Seoul (Korea Standard Time)',
    offset: '+09:00',
    region: 'Seoul'
  },
  {
    value: 'Asia/Tokyo',
    label: 'UTC+09:00 - Tokyo (Japan Standard Time)',
    offset: '+09:00',
    region: 'Tokyo'
  }
]

/**
 * Get timezone options grouped by region for better UX
 * Since we only have Asian timezones, we can organize by time zones
 */
export function getTimezonesByRegion() {
  const regions = {
    'Asia': TIMEZONE_OPTIONS
  }

  return regions
}

/**
 * Get user's local timezone
 * @returns IANA timezone identifier if available, 'UTC' as fallback
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/**
 * Find the closest matching timezone option for a given IANA identifier
 * @param timezoneId IANA timezone identifier
 * @returns TimezoneOption or null if not found
 */
export function findTimezoneOption(timezoneId: string): TimezoneOption | null {
  return TIMEZONE_OPTIONS.find(option => option.value === timezoneId) || null
}

/**
 * Get dynamic timezone offset (accounts for DST)
 * @param timezoneId IANA timezone identifier
 * @param date Date to get offset for (defaults to now)
 * @returns UTC offset string
 */
export function getDynamicTimezoneOffset(timezoneId: string, date: Date = new Date()): string {
  try {
    const utc = new Date(date.getTime() + (date.getTimezoneOffset() * 60000))
    const targetTime = new Date(utc.toLocaleString('en-US', { timeZone: timezoneId }))
    const offsetMs = targetTime.getTime() - utc.getTime()
    
    const offsetHours = Math.floor(offsetMs / (1000 * 60 * 60))
    const offsetMinutes = Math.floor((Math.abs(offsetMs) % (1000 * 60 * 60)) / (1000 * 60))
    
    const sign = offsetMs >= 0 ? '+' : '-'
    const hours = Math.abs(offsetHours).toString().padStart(2, '0')
    const minutes = offsetMinutes.toString().padStart(2, '0')
    
    return `${sign}${hours}:${minutes}`
  } catch {
    return '+00:00'
  }
}