import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * Countdown composable that calculates days remaining until an event
 * Returns a 2-digit countdown (max 99 days)
 */
export function useCountdown(eventStartDate: string | Date) {
  const currentTime = ref(new Date())
  let intervalId: number | undefined

  // Update current time every minute
  onMounted(() => {
    intervalId = window.setInterval(() => {
      currentTime.value = new Date()
    }, 60000) // Update every minute
  })

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })

  /**
   * Calculate time remaining until event
   * Returns days and hours remaining
   */
  const timeRemaining = computed(() => {
    const startDate = new Date(eventStartDate)
    const now = currentTime.value

    // Calculate difference in milliseconds from now to event start
    const diffMs = startDate.getTime() - now.getTime()

    // If event has passed, return -1 days
    if (diffMs < 0) {
      return { days: -1, hours: 0 }
    }

    // Calculate days and hours
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
    const days = Math.floor(totalHours / 24)
    const hours = totalHours % 24

    // If event is today (less than 24 hours)
    if (days === 0) {
      return { days: 0, hours }
    }

    // Cap days at 99 for 2-digit display
    return { days: Math.min(days, 99), hours }
  })

  /**
   * Calculate days remaining until event
   * Returns 0 if event is today or in the past
   */
  const daysRemaining = computed(() => {
    return timeRemaining.value.days
  })

  /**
   * Hours remaining within the current day
   */
  const hoursRemaining = computed(() => {
    return timeRemaining.value.hours
  })

  /**
   * Format as 2-digit string with leading zero
   */
  const formattedDays = computed(() => {
    const days = daysRemaining.value
    // If negative (past), don't show
    if (days < 0) return '00'
    return days.toString().padStart(2, '0')
  })

  /**
   * Format hours as 2-digit string with leading zero
   */
  const formattedHours = computed(() => {
    const hours = hoursRemaining.value
    return hours.toString().padStart(2, '0')
  })

  /**
   * Combined DD:HH format
   */
  const formattedTime = computed(() => {
    return `${formattedDays.value}:${formattedHours.value}`
  })

  /**
   * Check if event is today
   */
  const isToday = computed(() => {
    return daysRemaining.value === 0
  })

  /**
   * Check if event has passed (before today)
   */
  const hasPassed = computed(() => {
    return daysRemaining.value < 0
  })

  return {
    daysRemaining,
    hoursRemaining,
    formattedDays,
    formattedHours,
    formattedTime,
    isToday,
    hasPassed,
  }
}
