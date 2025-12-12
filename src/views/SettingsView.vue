<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-r from-[#2ecc71]/[0.02] via-white to-[#1e90ff]/[0.02]">

    <!-- Main Content -->
    <section class="py-4 sm:py-6 lg:py-8">
      <div class="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header with Tabs -->
        <div class="mb-8 sm:mb-10">
          <h1 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
            Settings
          </h1>

          <!-- Tab Navigation -->
          <div class="flex border-b border-slate-200 bg-slate-50/50">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'px-4 py-3 text-sm font-medium transition-colors relative',
                activeTab === tab.id
                  ? 'text-sky-600 bg-white border-b-2 border-sky-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              ]"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Tab Content -->
        <AccountTab v-if="activeTab === 'account'" />

        <SecurityTab v-if="activeTab === 'security'" />

        <BaseCard v-if="activeTab === 'payment'">
          <PaymentTab />
        </BaseCard>

        <VendorTab v-if="activeTab === 'vendor'" />
      </div> <!-- Close max-w-4xl container -->
    </section> <!-- Close py-4 section -->
    </div> <!-- Close gradient background -->
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MainLayout from '@/components/MainLayout.vue'
import BaseCard from '@/components/BaseCard.vue'
import AccountTab from '@/components/settings/AccountTab.vue'
import SecurityTab from '@/components/settings/SecurityTab.vue'
import PaymentTab from '@/components/settings/PaymentTab.vue'
import VendorTab from '@/components/settings/VendorTab.vue'
import { useAuthStore } from '@/stores/auth'

// Types
type TabId = 'account' | 'security' | 'payment' | 'vendor'

interface Tab {
  id: TabId
  label: string
}

// Router and store
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Tab configuration - easily extensible for future tabs
const tabs: Tab[] = [
  { id: 'account', label: 'Account' },
  { id: 'security', label: 'Security' },
  { id: 'payment', label: 'Payment' },
  { id: 'vendor', label: 'Vendor' },
]

// Valid tab IDs for validation
const validTabIds: TabId[] = ['account', 'security', 'payment', 'vendor']

// Get initial tab from URL query or default to 'account'
const getInitialTab = (): TabId => {
  const tabParam = route.query.tab as string
  if (tabParam && validTabIds.includes(tabParam as TabId)) {
    return tabParam as TabId
  }
  return 'account'
}

// Active tab state
const activeTab = ref<TabId>(getInitialTab())

// Update URL when tab changes
watch(activeTab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } })
})

// Authentication check on mount
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/signin')
  }
})
</script>
