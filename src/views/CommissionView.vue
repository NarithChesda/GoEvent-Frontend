<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 pb-20 lg:pb-0">
      <!-- Commission Settings Content -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CommissionTab />
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../components/MainLayout.vue'
import CommissionTab from '../components/settings/CommissionTab.vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Initialize auth check
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/signin')
    return
  }
})
</script>