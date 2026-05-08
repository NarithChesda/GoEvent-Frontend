<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-r from-[#2ecc71]/[0.02] via-white to-[#1e90ff]/[0.02]">

    <!-- Main Content -->
    <section class="py-4 sm:py-6 lg:py-8">
      <div class="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header with Tabs -->
        <div class="mb-8 sm:mb-10">
          <h1 class="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
            {{ t('settings.title') }}
          </h1>

          <!-- Tab Navigation — horizontally scrollable on mobile, justifies
               from the start so first tab is always reachable. Active tab
               scrolls into view via the ref below. -->
          <div
            ref="tabBarEl"
            class="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0 snap-x snap-mandatory"
            role="tablist"
          >
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :ref="(el) => setTabRef(tab.id, el as HTMLElement | null)"
              @click="activeTab = tab.id"
              :class="[
                'flex-shrink-0 snap-start px-4 sm:px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative',
                activeTab === tab.id
                  ? 'text-sky-600 bg-white border-b-2 border-sky-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 border-b-2 border-transparent'
              ]"
              role="tab"
              :aria-selected="activeTab === tab.id"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Tab Content -->
        <AccountTab v-if="activeTab === 'account'" />

        <SecurityTab v-if="activeTab === 'security'" />

        <NotificationsTab v-if="activeTab === 'notifications'" />

        <VendorTab v-if="activeTab === 'vendor'" />

        <DonationsTab v-if="activeTab === 'donations'" />

        <ListingsTab v-if="activeTab === 'listings'" />

        <TicketsTab v-if="activeTab === 'tickets'" />
      </div> <!-- Close max-w-4xl container -->
    </section> <!-- Close py-4 section -->
    </div> <!-- Close gradient background -->
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import MainLayout from '@/components/MainLayout.vue'
import AccountTab from '@/components/settings/AccountTab.vue'
import SecurityTab from '@/components/settings/SecurityTab.vue'
import NotificationsTab from '@/components/settings/NotificationsTab.vue'
import VendorTab from '@/components/settings/VendorTab.vue'
import ListingsTab from '@/components/settings/ListingsTab.vue'
import DonationsTab from '@/components/settings/DonationsTab.vue'
import TicketsTab from '@/components/settings/TicketsTab.vue'
import { useAuthStore } from '@/stores/auth'

// Types
type TabId =
  | 'account'
  | 'security'
  | 'notifications'
  | 'vendor'
  | 'donations'
  | 'listings'
  | 'tickets'

interface Tab {
  id: TabId
  label: string
}

// Router and store
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

// Tab configuration - easily extensible for future tabs
const tabs = computed<Tab[]>(() => [
  { id: 'account', label: t('settings.tabs.account') },
  { id: 'tickets', label: t('settings.tabs.tickets') },
  { id: 'security', label: t('settings.tabs.security') },
  { id: 'notifications', label: t('settings.tabs.notifications') },
  { id: 'vendor', label: t('settings.tabs.vendor') },
  { id: 'donations', label: t('settings.tabs.donations') },
  { id: 'listings', label: t('settings.tabs.listings') },
])

// Valid tab IDs for validation
const validTabIds: TabId[] = [
  'account',
  'security',
  'notifications',
  'vendor',
  'donations',
  'listings',
  'tickets',
]

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

// Refs for the scrollable tab bar — used to scroll the active tab into
// view on mobile when the user picks one near the right edge or arrives
// via a deep link.
const tabBarEl = ref<HTMLElement | null>(null)
const tabRefs = ref<Record<string, HTMLElement | null>>({})

const setTabRef = (id: TabId, el: HTMLElement | null) => {
  tabRefs.value[id] = el
}

const scrollActiveTabIntoView = () => {
  const bar = tabBarEl.value
  const btn = tabRefs.value[activeTab.value]
  if (!bar || !btn) return
  // Centre the active tab in the scroll viewport when it would otherwise
  // be clipped on either side. `inline: 'center'` is what makes 'Listings'
  // (last tab) reachable on a 360px screen.
  btn.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center',
  })
}

// Update URL when tab changes
watch(activeTab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } })
  nextTick(scrollActiveTabIntoView)
})

// Watch for URL query changes (e.g., when navigating from menu)
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && validTabIds.includes(newTab as TabId)) {
      activeTab.value = newTab as TabId
    }
  }
)

// Authentication check on mount
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/signin')
    return
  }
  // If the user landed on a tab that's off-screen on mobile (e.g. deep
  // link to ?tab=listings on a phone), pull it into view after the DOM
  // has had a chance to lay out.
  nextTick(scrollActiveTabIntoView)
})
</script>
