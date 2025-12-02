<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { secureStorage } from './utils/secureStorage'

const router = useRouter()
const authStore = useAuthStore()

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

// Watch for authentication changes to handle pending invitations
watch(
  () => authStore.isAuthenticated,
  async (isAuthenticated) => {
    if (isAuthenticated) {
      await handlePendingInvitation()
    }
  }
)

/**
 * App initialization
 *
 * IMPROVEMENTS:
 * - Explicitly migrates legacy storage on startup
 * - Migration happens once, not on every token retrieval
 * - Better error handling
 */
onMounted(async () => {
  try {
    // Migrate legacy storage explicitly on app startup
    // This only happens once, ensuring clean migration from v2 encrypted format
    secureStorage.migrateFromLegacyStorage(['access_token', 'refresh_token', 'user'])

    // Initialize authentication
    await authStore.initializeAuth()
  } catch (error) {
    // Don't let initialization failures prevent the app from loading
  }
})
</script>

<template>
  <RouterView />
</template>
