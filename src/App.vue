<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { authService } from './services/auth'
import { useNotificationsStore } from './stores/notifications'
import { resetVendorProfileCache } from './composables/settings'
import { resetEventListCache } from './composables/useEventsData'
import { resetServicesCache } from './composables/useServices'
import { secureStorage } from './utils/secureStorage'
import { SESSION_EXPIRED_EVENT } from './services/tokenManager'
import { isPreviewFrameDocument } from './utils/previewFrameContext'
import ToastHost from './components/ToastHost.vue'

const router = useRouter()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()

/**
 * The Design Studio's preview iframes each run this component (see
 * previewFrameContext.ts). None of the session bootstrapping below serves
 * them — a preview frame renders one showcase stage, shows no notification
 * bell, and never handles an invitation redirect — while all of it costs real
 * requests, multiplied by however many frames are mounted:
 *
 *   - initializeAuth() → a profile GET per frame
 *   - the isAuthenticated watcher → startPolling(), i.e. an immediate
 *     unread-count GET per frame plus a 30s interval per frame, for as long as
 *     the Studio tab stays open
 *
 * Skipping it does NOT log the frame out: API calls read their bearer token
 * straight from tokenManager (see ApiClient.getAuthHeaders), which is backed by
 * storage, not by this store — so the frame's inline-edit saves still
 * authenticate, and ApiClient still refreshes on a 401 by itself.
 */
const isPreviewFrame = isPreviewFrameDocument()

/**
 * Handle pending collaborator invitation after authentication
 * This handles the case where a user signs up/in via Google/Telegram
 * from a different page (e.g., /signin with redirect to /invitation/xxx)
 *
 * Note: Backend auto-accepts invitations when user logs in with matching email,
 * so we just redirect to the invitation page to let it handle the redirect
 */
async function handlePendingInvitation() {
  const token = sessionStorage.getItem('pending_invitation_token')
  if (!token || !authStore.isAuthenticated) return

  // Clear the token immediately to prevent duplicate attempts
  sessionStorage.removeItem('pending_invitation_token')

  // Redirect to invitation page - it will validate and redirect to event
  router.push(`/invitation/${token}`)
}

// Watch for authentication changes to handle pending invitations + notifications polling
if (!isPreviewFrame) {
  watch(
    () => authStore.isAuthenticated,
    async (isAuthenticated) => {
      if (isAuthenticated) {
        notificationsStore.startPolling()
        await handlePendingInvitation()
      } else {
        notificationsStore.reset()
        resetVendorProfileCache()
        // The tab list caches outlive the session — see resetEventListCache.
        resetEventListCache()
        resetServicesCache()
      }
    }
  )
}

/**
 * The session ended server-side, somewhere inside an API call.
 *
 * Storage has already been emptied by tokenManager; without this the Pinia
 * store went on rendering a signed-in shell — avatar, event list, tab bar —
 * over a session every request would now refuse, until the next full reload.
 * Clearing the user here flips `isAuthenticated`, which tears the shell down
 * through the watcher above, and the redirect carries the current page so the
 * user comes back to where they were instead of a generic landing.
 */
const handleSessionExpired = () => {
  authStore.handleSessionExpired()

  const current = router.currentRoute.value
  if (!current.meta.requiresAuth || current.name === 'signin') return

  router.replace(`/signin?redirect=${encodeURIComponent(current.fullPath)}`)
}

/**
 * Another tab signed in or out. localStorage is shared across them and the
 * Telegram sign-in opens its deep link with `window.open(_, '_blank')`, so a
 * phone routinely has two tabs of this app alive at once — without this, the
 * one left behind keeps showing the previous account (or a signed-out shell)
 * until it is reloaded by hand.
 *
 * `key === null` is a `localStorage.clear()` from a sibling tab and has to be
 * treated as a change to everything.
 */
const handleStorageChange = (event: StorageEvent) => {
  if (event.key !== null && !event.key.includes('user') && !event.key.includes('token')) return

  const storedUser = authService.getUser()

  if (!storedUser || !authService.hasSession()) {
    // A sign-out in the other tab. Same treatment as an expired session: drop
    // the shell here too, and leave a protected page rather than sit on one
    // whose next request will 401.
    handleSessionExpired()
    return
  }

  if (storedUser.id !== authStore.user?.id) {
    authStore.setUser(storedUser)
  }
}

if (!isPreviewFrame) {
  window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
  window.addEventListener('storage', handleStorageChange)
}

onUnmounted(() => {
  notificationsStore.stopPolling()
  window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
  window.removeEventListener('storage', handleStorageChange)
})

/**
 * App initialization
 *
 * IMPROVEMENTS:
 * - Explicitly migrates legacy storage on startup
 * - Migration happens once, not on every token retrieval
 * - Better error handling
 */
onMounted(async () => {
  if (isPreviewFrame) return

  try {
    // Migrate legacy storage explicitly on app startup
    // This only happens once, ensuring clean migration from v2 encrypted format
    secureStorage.migrateFromLegacyStorage(['access_token', 'refresh_token', 'user'])

    // Initialize authentication
    await authStore.initializeAuth()
  } catch {
    // Don't let initialization failures prevent the app from loading
  }
})
</script>

<template>
  <RouterView />
  <ToastHost />
</template>
