/**
 * Notifications Store
 *
 * Centralized state for the in-app notifications feature:
 *  - unread badge count (polled while user is authenticated and tab is visible)
 *  - paginated notification list (loaded lazily when the user opens the dropdown)
 *  - mark-read / mark-all-read / delete with optimistic updates
 *  - user preferences (loaded on demand by the settings tab)
 *
 * Polling design:
 *  - Poll /unread-count/ every UNREAD_POLL_INTERVAL while the tab is visible.
 *  - Pause when document.hidden, resume on visibilitychange.
 *  - Caller (App.vue / auth flow) starts/stops polling via startPolling/stopPolling.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notificationsService } from '../services/api'
import type {
  NotificationItem,
  NotificationPreferences,
  UpdateNotificationPreferencesRequest,
} from '../services/api'

const UNREAD_POLL_INTERVAL = 30_000
const PAGE_SIZE = 20

export const useNotificationsStore = defineStore('notifications', () => {
  // ============================================================================
  // STATE
  // ============================================================================
  const unreadCount = ref(0)

  const items = ref<NotificationItem[]>([])
  const totalCount = ref(0)
  const currentPage = ref(1)
  const hasMore = ref(false)
  const loadingList = ref(false)
  const loadingMore = ref(false)
  const listError = ref<string | null>(null)
  const lastLoadedAt = ref<number>(0)

  const preferences = ref<NotificationPreferences | null>(null)
  const loadingPreferences = ref(false)
  const savingPreferences = ref(false)
  const preferencesError = ref<string | null>(null)

  // Polling internals
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let visibilityHandler: (() => void) | null = null

  // ============================================================================
  // GETTERS
  // ============================================================================
  const hasUnread = computed(() => unreadCount.value > 0)
  const badgeLabel = computed(() => (unreadCount.value > 99 ? '99+' : String(unreadCount.value)))

  // ============================================================================
  // ACTIONS — unread count + polling
  // ============================================================================
  async function fetchUnreadCount() {
    const response = await notificationsService.unreadCount()
    if (response.success && response.data) {
      unreadCount.value = response.data.count
    }
    return response
  }

  function startPolling() {
    if (pollTimer) return
    // Fetch immediately on start.
    fetchUnreadCount().catch(() => {
      // Errors are non-fatal — leave the previous count in place.
    })
    pollTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      fetchUnreadCount().catch(() => {
        /* swallow */
      })
    }, UNREAD_POLL_INTERVAL)

    if (typeof document !== 'undefined') {
      visibilityHandler = () => {
        if (!document.hidden) {
          fetchUnreadCount().catch(() => {
            /* swallow */
          })
        }
      }
      document.addEventListener('visibilitychange', visibilityHandler)
    }
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler)
      visibilityHandler = null
    }
  }

  function reset() {
    stopPolling()
    unreadCount.value = 0
    items.value = []
    totalCount.value = 0
    currentPage.value = 1
    hasMore.value = false
    loadingList.value = false
    loadingMore.value = false
    listError.value = null
    lastLoadedAt.value = 0
    preferences.value = null
    loadingPreferences.value = false
    preferencesError.value = null
  }

  // ============================================================================
  // ACTIONS — list
  // ============================================================================
  async function fetchNotifications(options: { reset?: boolean } = {}) {
    if (loadingList.value) return
    if (options.reset) {
      currentPage.value = 1
      items.value = []
      hasMore.value = false
    }
    loadingList.value = true
    listError.value = null

    try {
      const response = await notificationsService.list({
        page: currentPage.value,
        page_size: PAGE_SIZE,
      })
      if (response.success && response.data) {
        const data = response.data
        items.value =
          currentPage.value === 1 ? data.results : [...items.value, ...data.results]
        totalCount.value = data.count
        hasMore.value = !!data.next
        lastLoadedAt.value = Date.now()
      } else {
        listError.value = response.message || 'Failed to load notifications'
      }
    } finally {
      loadingList.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value || loadingList.value) return
    loadingMore.value = true
    try {
      currentPage.value += 1
      const response = await notificationsService.list({
        page: currentPage.value,
        page_size: PAGE_SIZE,
      })
      if (response.success && response.data) {
        items.value = [...items.value, ...response.data.results]
        hasMore.value = !!response.data.next
      } else {
        // Roll back the page increment if it failed
        currentPage.value = Math.max(1, currentPage.value - 1)
        listError.value = response.message || 'Failed to load more notifications'
      }
    } finally {
      loadingMore.value = false
    }
  }

  // ============================================================================
  // ACTIONS — read / delete (optimistic)
  // ============================================================================
  async function markRead(id: string) {
    const target = items.value.find((n) => n.id === id)
    if (!target || target.is_read) {
      // Still call the API to keep server state consistent if local state is stale.
      if (!target) await notificationsService.markRead(id)
      return
    }

    // Optimistic update
    target.is_read = true
    target.read_at = new Date().toISOString()
    if (unreadCount.value > 0) unreadCount.value -= 1

    const response = await notificationsService.markRead(id)
    if (!response.success) {
      // Revert on failure
      target.is_read = false
      target.read_at = null
      unreadCount.value += 1
    }
  }

  async function markAllRead() {
    if (unreadCount.value === 0 && items.value.every((n) => n.is_read)) return

    // Snapshot for rollback
    const previousUnread = unreadCount.value
    const previous = items.value.map((n) => ({
      id: n.id,
      is_read: n.is_read,
      read_at: n.read_at,
    }))

    const now = new Date().toISOString()
    items.value.forEach((n) => {
      if (!n.is_read) {
        n.is_read = true
        n.read_at = now
      }
    })
    unreadCount.value = 0

    const response = await notificationsService.markAllRead()
    if (!response.success) {
      unreadCount.value = previousUnread
      const map = new Map(previous.map((p) => [p.id, p]))
      items.value.forEach((n) => {
        const prev = map.get(n.id)
        if (prev) {
          n.is_read = prev.is_read
          n.read_at = prev.read_at
        }
      })
    }
  }

  async function remove(id: string) {
    const index = items.value.findIndex((n) => n.id === id)
    if (index === -1) return

    const [removed] = items.value.splice(index, 1)
    if (!removed.is_read && unreadCount.value > 0) unreadCount.value -= 1
    totalCount.value = Math.max(0, totalCount.value - 1)

    const response = await notificationsService.remove(id)
    if (!response.success) {
      // Reinsert at original position on failure
      items.value.splice(index, 0, removed)
      if (!removed.is_read) unreadCount.value += 1
      totalCount.value += 1
    }
  }

  // ============================================================================
  // ACTIONS — preferences
  // ============================================================================
  async function fetchPreferences(force = false) {
    if (preferences.value && !force) return preferences.value
    loadingPreferences.value = true
    preferencesError.value = null
    try {
      const response = await notificationsService.getPreferences()
      if (response.success && response.data) {
        preferences.value = response.data
      } else {
        preferencesError.value = response.message || 'Failed to load preferences'
      }
      return preferences.value
    } finally {
      loadingPreferences.value = false
    }
  }

  async function updatePreferences(patch: UpdateNotificationPreferencesRequest) {
    const previous = preferences.value ? { ...preferences.value } : null

    // Optimistic update
    if (preferences.value) {
      preferences.value = { ...preferences.value, ...patch }
    }
    savingPreferences.value = true
    preferencesError.value = null
    try {
      const response = await notificationsService.updatePreferences(patch)
      if (response.success && response.data) {
        preferences.value = response.data
        return true
      }
      // Revert
      if (previous) preferences.value = previous
      preferencesError.value = response.message || 'Failed to update preferences'
      return false
    } finally {
      savingPreferences.value = false
    }
  }

  return {
    // state
    unreadCount,
    items,
    totalCount,
    hasMore,
    loadingList,
    loadingMore,
    listError,
    lastLoadedAt,
    preferences,
    loadingPreferences,
    savingPreferences,
    preferencesError,
    // getters
    hasUnread,
    badgeLabel,
    // actions
    startPolling,
    stopPolling,
    reset,
    fetchUnreadCount,
    fetchNotifications,
    loadMore,
    markRead,
    markAllRead,
    remove,
    fetchPreferences,
    updatePreferences,
  }
})
