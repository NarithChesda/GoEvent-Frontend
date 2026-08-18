<template>
  <!--
    Settings runs without the app's top bar. It is one page of seven sections
    with a tab row of its own, and stacking that under a second row of app-level
    navigation gave the screen two headers competing for the same job. So the
    heading and its tabs *are* the header here, with the way back to the rest
    of the app standing beside them.
  -->
  <MainLayout hide-top-nav hide-contact-fab>
    <div
      class="min-h-screen bg-gradient-to-r from-[#2ecc71]/[0.02] via-white/0 to-[#1e90ff]/[0.02]"
    >
      <!-- Main Content. Taller top padding than the list pages carry, because
         there is no 4rem bar above this one to hold it off the viewport edge. -->
      <section class="py-6 sm:py-8 lg:py-10">
        <!-- The heading gets a wrapper of its own so the way out can be centred on
           that one line rather than on the whole header. -->
        <div
          class="settings-heading relative max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 sm:mb-5"
        >
          <!-- The way out, on the heading's own line — which is where every mobile
             platform puts it: the leading slot of the header bar, sharing the
             title's baseline. It used to sit on a row of its own above the
             title, as a filled glass disc, and that is the vocabulary of a FAB
             — so the loudest object on the screen was the one that means leave,
             and it spent 56px of a phone's height before the page named itself.
             Here it is a bare icon, pulled left by its own optical padding so
             the arrow starts on the text column's edge rather than 12px inside
             it.

             On a wide window it steps out of the column entirely, into the
             gutter beside the heading, landing on the viewport's left edge at
             the inset the top bar's logo used to hold — and only there does it
             take the disc's ground and edge back. That is not a decoration:
             alone in a wide gutter, a loose arrow reads as something dropped
             there, while an object with an edge reads as something placed. In
             flow beside a heading the reasoning inverts, which is why the two
             skins differ. Both live in the style block, against the one
             threshold that decides which applies. -->
          <div class="flex items-center gap-1">
            <RouterLink
              to="/events"
              class="settings-back group -ml-3 inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ecc71]/30"
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
        </div>
        <!-- Close max-w-4xl container -->
      </section>
      <!-- Close py-4 section -->
    </div>
    <!-- Close gradient background -->
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
  },
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
  The way back out, in two skins against one threshold.

  Below 1152px it stays where it is written: in flow, on the heading's own line,
  a bare icon on the leading edge — the arrangement every mobile platform uses
  for a header's back control, and the reason it is written inside the title row
  rather than above it.

  At 1152px it leaves the column for the gutter beside the heading, and takes a
  ground and an edge with it. It holds the same inset the top bar's logo held —
  1.5rem from the viewport's left — so the page still opens where the app's
  chrome always opened, even though the bar itself is gone. Reaching that edge
  means measuring from the viewport rather than from the column this is nested
  in: `50vw` less the column's half-width is the gutter, and 1.5rem into it is
  the disc's own left edge, since a disc has no padding to discount.

  `top: 50%` centres it on the heading and nothing else, which is why the
  heading has a wrapper of its own — measured against the whole header it would
  sit somewhere between the title and the tabs.

  The threshold is where the gutter first gets wider than the disc. Being
  icon-only is what keeps it this low and, more usefully, keeps it a constant: a
  labelled control would have to clear the Khmer word for Events, which runs
  half again as wide as the English one.
*/
/* In the header row: a bare icon, the way a mobile header's leading control is
   drawn everywhere. Colour and hover live here rather than as `hover:`
   utilities so they don't race the disc skin below at equal specificity. */
.settings-back {
  color: rgb(100 116 139); /* slate-500 */
}

.settings-back:hover {
  background: rgb(15 23 42 / 0.04);
  color: rgb(15 23 42); /* slate-900 */
}

@media (min-width: 1152px) {
  .settings-back {
    position: absolute;
    top: 50%;
    left: calc(33.5rem - 50vw);
    margin: 0;
    transform: translateY(-50%);

    /* The disc, and only out here. Written out rather than left as utilities so
       the skin and the threshold that selects it stay in one place — the values
       are Tailwind's own `bg-white/70`, `border-white/60` and `shadow-sm`. */
    background: rgb(255 255 255 / 0.7);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgb(255 255 255 / 0.6);
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  }

  .settings-back:hover {
    background: rgb(255 255 255);
    color: rgb(15 23 42); /* slate-900 */
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1); /* shadow-md */
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
