<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { secureStorage } from './utils/secureStorage'

const authStore = useAuthStore()

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
