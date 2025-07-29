<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

// Initialize auth store when app starts
onMounted(async () => {
  try {
    await authStore.initializeAuth()
  } catch (error) {
    console.error('Failed to initialize auth:', error)
    // Don't let auth failures prevent the app from loading
  }
})
</script>

<template>
  <RouterView />
</template>
