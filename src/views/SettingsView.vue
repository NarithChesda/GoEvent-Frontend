<template>
  <!--
    Settings runs without the app's top bar. It is one page of seven sections
    with a tab row of its own, and stacking that under a second row of app-level
    navigation gave the screen two headers competing for the same job. So the
    heading and its tabs *are* the header here, with the way back to the rest
    of the app standing beside them.
  -->
  <MainLayout hide-top-nav>
    <div class="min-h-screen bg-gradient-to-r from-[#2ecc71]/[0.02] via-white/0 to-[#1e90ff]/[0.02]">

    <!-- Main Content. Taller top padding than the list pages carry, because
         there is no 4rem bar above this one to hold it off the viewport edge. -->
    <section class="py-6 sm:py-8 lg:py-10">
      <!-- The heading gets a wrapper of its own so the way out can be centred on
           that one line rather than on the whole header. -->
      <div
        class="settings-heading relative max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 sm:mb-5"
      >
        <!-- The way out. On a wide window it steps out of the content column
             into the gutter beside the heading, landing on the viewport's left
             edge at the inset the top bar's logo used to hold — see the style
             block, which is also where it drops back above the heading once
             that gutter is too narrow to hold it.

             A disc rather than a labelled link, and that is the point: alone in
             a wide gutter, loose text reads as something dropped there. An
             object with an edge and a ground reads as something placed. The
             destination is in the tooltip instead, where a control this
             conventional can afford to keep it. -->
        <RouterLink
          to="/events"
          class="settings-back group inline-flex items-center justify-center w-11 h-11 mb-3 sm:mb-4 rounded-full bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm text-slate-600 transition-all duration-200 hover:bg-white hover:text-slate-900 hover:shadow-md active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ecc71]/30"
          :aria-label="t('common.nav.events')"
          :title="t('common.nav.events')"
        >
          <ArrowLeft
            class="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
        </RouterLink>

        <h1 class="min-w-0 truncate text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
          {{ t('settings.title') }}
        </h1>
      </div>

      <div class="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- The header's second line. -->
        <SettingsTabBar
          :model-value="activeTab"
          :tabs="tabs"
          class="mb-6 sm:mb-8"
          @update:model-value="(id: string) => (activeTab = id as TabId)"
        />

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
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeft,
  Bell,
  HeartHandshake,
  LayoutList,
  ShieldCheck,
  Store,
  Ticket,
  User,
} from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import SettingsTabBar, { type SettingsTabItem } from '@/components/settings/SettingsTabBar.vue'
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

// Router and store
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

// Tab configuration - easily extensible for future tabs. The icon is what the
// row is scanned by once it scrolls on a phone, so pick one that names the
// section rather than one that decorates it.
const tabs = computed<SettingsTabItem[]>(() => [
  { id: 'account', label: t('settings.tabs.account'), icon: User },
  { id: 'tickets', label: t('settings.tabs.tickets'), icon: Ticket },
  { id: 'security', label: t('settings.tabs.security'), icon: ShieldCheck },
  { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
  { id: 'vendor', label: t('settings.tabs.vendor'), icon: Store },
  { id: 'donations', label: t('settings.tabs.donations'), icon: HeartHandshake },
  { id: 'listings', label: t('settings.tabs.listings'), icon: LayoutList },
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

// Update URL when tab changes
watch(activeTab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } })
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
  }
})
</script>

<style scoped>
/*
  The way back out, standing in the gutter beside the heading.

  It holds the same edge and the same inset the top bar's logo held — 1.5rem
  from the viewport's left — so the page still opens where the app's chrome
  always opened, even though the bar itself is gone. Reaching that edge means
  measuring from the viewport rather than from the column this is nested in:
  `50vw` less the column's half-width is the gutter, and 1.5rem into it is the
  disc's own left edge, since a disc has no padding to discount.

  `top: 50%` centres it on the heading and nothing else, which is why the
  heading has a wrapper of its own — measured against the whole header it would
  sit somewhere between the title and the tabs.

  Below 1152px it stays where it is written: in flow, above the heading, on the
  column's own left edge. That is the other half of the design rather than a
  fallback — under that width the gutter is narrower than the disc, and the same
  control simply sits where a back button conventionally sits. Being icon-only
  is what keeps the threshold this low and, more usefully, keeps it a constant:
  a labelled control would have to clear the Khmer word for Events, which runs
  half again as wide as the English one.
*/
@media (min-width: 1152px) {
  .settings-back {
    position: absolute;
    top: 50%;
    left: calc(33.5rem - 50vw);
    margin: 0;
    transform: translateY(-50%);
  }

  /* The press keeps its own transform, which would otherwise drop the disc by
     half its height the moment it is touched. */
  .settings-back:active {
    transform: translateY(-50%) scale(0.95);
  }
}

/* Same rule against the wider `2xl:max-w-6xl` column: 72rem ÷ 2 + 1.5rem. */
@media (min-width: 1536px) {
  .settings-back {
    left: calc(37.5rem - 50vw);
  }
}
</style>
