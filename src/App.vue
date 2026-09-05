<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useNotificationsStore } from './stores/notifications'
import { resetVendorProfileCache } from './composables/settings'
import { resetEventListCache } from './composables/useEventsData'
import { resetServicesCache } from './composables/useServices'
import { secureStorage } from './utils/secureStorage'
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

onUnmounted(() => {
  notificationsStore.stopPolling()
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
