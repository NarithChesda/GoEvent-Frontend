<template>
  <section class="space-y-6">
    <!-- Header -->
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">
          {{ t('management.tickets.title') }}
        </h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1">
          {{ t('management.tickets.subtitle') }}
        </p>
      </div>
      <div v-if="canEdit" class="flex items-center gap-2 flex-shrink-0">
        <!-- Door sale: secondary action (walk-up sales only). -->
        <button
          type="button"
          class="flex bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold p-2 sm:py-2 sm:px-4 rounded-xl transition-colors items-center text-sm sm:text-base"
          :title="t('management.tickets.doorSale.entrypoint.button')"
          :aria-label="t('management.tickets.doorSale.entrypoint.button')"
          @click="openDoorSale"
        >
          <Receipt class="w-4 h-4 sm:mr-2" aria-hidden="true" />
          <span class="hidden sm:inline">{{ t('management.tickets.doorSale.entrypoint.button') }}</span>
        </button>
        <!-- Scan: primary action during live event. -->
        <button
          type="button"
          class="flex bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold p-2 sm:py-2 sm:px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 items-center text-sm sm:text-base"
          :title="t('management.tickets.scan.entrypoint.button')"
          :aria-label="t('management.tickets.scan.entrypoint.button')"
          @click="goToScanner"
        >
          <ScanLine class="w-4 h-4 sm:mr-2" aria-hidden="true" />
          <span class="hidden sm:inline">{{ t('management.tickets.scan.entrypoint.button') }}</span>
        </button>
      </div>
    </header>

    <!-- Sub-tab pills -->
    <nav
      class="flex gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-fit overflow-x-auto scrollbar-hide"
      role="tablist"
      :aria-label="t('management.tickets.title')"
    >
      <button
        v-for="tab in subTabs"
        :key="tab.id"
        type="button"
        class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap"
        :class="
          activeSubTab === tab.id
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
        "
        :aria-selected="activeSubTab === tab.id"
        role="tab"
        @click="setSubTab(tab.id)"
      >
        <component :is="tab.icon" class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span>{{ tab.label }}</span>
      </button>
    </nav>

    <!-- Active sub-tab body -->
    <div class="min-h-[400px]">
      <TicketOrdersList
        v-if="activeSubTab === 'orders'"
        ref="ordersListRef"
        :event-id="eventId"
        :can-edit="canEdit"
        @message="showMessage"
      />
      <TicketTypesManager
        v-else-if="activeSubTab === 'tiers'"
        :event-id="eventId"
        :can-edit="canEdit"
        @message="showMessage"
      />
      <CheckoutQuestionsManager
        v-else-if="activeSubTab === 'questions'"
        :event-id="eventId"
        :can-edit="canEdit"
        @message="showMessage"
      />
    </div>

    <!-- Local toast (matches the guest-tab toast pattern) -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-20 lg:bottom-8 right-4 sm:right-8 left-4 sm:left-auto z-[100]">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg flex items-center text-sm sm:text-base"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <AlertCircle v-else class="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
          <span class="flex-1">{{ message.text }}</span>
        </div>
      </div>
    </Transition>

    <!-- Door-scan drawer — slides over the tab while the camera is in use. -->
    <TicketScanDrawer
      v-model:show="showScanDrawer"
      :event-id="eventId"
    />

    <!-- Walk-up door sale: organizer issues a paid ticket on the spot. -->
    <DoorSaleModal
      :show="showDoorSaleModal"
      :event-id="eventId"
      @close="closeDoorSale"
      @sale-completed="handleSaleCompleted"
      @message="showMessage"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CheckCircle,
  AlertCircle,
  Inbox,
  Ticket,
  MessageSquareText,
  ScanLine,
  Receipt,
} from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import TicketOrdersList from './tickets/TicketOrdersList.vue'
import TicketTypesManager from './tickets/TicketTypesManager.vue'
import CheckoutQuestionsManager from './tickets/CheckoutQuestionsManager.vue'
import TicketScanDrawer from './tickets/scan/TicketScanDrawer.vue'
import DoorSaleModal from './tickets/DoorSaleModal.vue'
import type { TicketOrderDetail } from '@/services/api'

interface Props {
  eventId: string
  canEdit: boolean
}

const props = defineProps<Props>()
void props // referenced via template; satisfies the no-unused-vars hint

const { t } = useAppLanguage()
const route = useRoute()
const router = useRouter()

type SubTabId = 'orders' | 'tiers' | 'questions'

const subTabs = computed(() => [
  { id: 'orders' as const, label: t('management.tickets.subTabs.orders'), icon: Inbox },
  { id: 'tiers' as const, label: t('management.tickets.subTabs.tiers'), icon: Ticket },
  { id: 'questions' as const, label: t('management.tickets.subTabs.questions'), icon: MessageSquareText },
])

const validSubTabs: SubTabId[] = ['orders', 'tiers', 'questions']
const initialSub = (): SubTabId => {
  const fromQuery = route.query.sub
  if (typeof fromQuery === 'string' && (validSubTabs as string[]).includes(fromQuery)) {
    return fromQuery as SubTabId
  }
  // If a deep-link points at a specific order (?order=...) without specifying
  // ?sub, jump straight to the orders list so the drawer pops over the right tab.
  if (typeof route.query.order === 'string' && route.query.order) {
    return 'orders'
  }
  return 'orders'
}

const activeSubTab = ref<SubTabId>(initialSub())

const setSubTab = (id: SubTabId) => {
  activeSubTab.value = id
}

const showScanDrawer = ref(false)

const goToScanner = () => {
  showScanDrawer.value = true
}

// Walk-up door sale entry point — opened from the header, fully self-contained.
const showDoorSaleModal = ref(false)
const ordersListRef = ref<InstanceType<typeof TicketOrdersList> | null>(null)

const openDoorSale = () => {
  showDoorSaleModal.value = true
}

const closeDoorSale = () => {
  showDoorSaleModal.value = false
}

const handleSaleCompleted = (order: TicketOrderDetail) => {
  // Make sure the new sale shows up in the Orders sub-tab without a manual
  // refresh. If the user is already viewing it, refetch in place; otherwise
  // jump to the tab so the badge / new row is visible immediately.
  if (activeSubTab.value === 'orders') {
    ordersListRef.value?.refresh?.()
  } else {
    setSubTab('orders')
  }
  showMessage(
    'success',
    t('management.tickets.doorSale.receipt.subtitleCheckedIn'),
  )
  void order
}

// Sync `?sub=` to the URL whenever it changes — preserves any other query
// params (e.g. the `tab=tickets` written by EventManageView).
watch(activeSubTab, (next) => {
  if (route.query.sub === next) return
  router.replace({ query: { ...route.query, sub: next } })
})

// Honour browser back/forward updates to the query string.
watch(
  () => route.query.sub,
  (next) => {
    if (typeof next === 'string' && (validSubTabs as string[]).includes(next)) {
      if (next !== activeSubTab.value) activeSubTab.value = next as SubTabId
    }
  },
)

onMounted(() => {
  // Make the URL match the rendered state on first paint (e.g. user landed on
  // /events/:id/manage?tab=tickets without a `sub` param).
  if (typeof route.query.sub !== 'string' || !(validSubTabs as string[]).includes(route.query.sub)) {
    router.replace({ query: { ...route.query, sub: activeSubTab.value } })
  }
})

// ---- Toast --------------------------------------------------------------
interface Toast {
  type: 'success' | 'error'
  text: string
}

const message = ref<Toast | null>(null)
let messageTimer: number | null = null

const showMessage = (type: Toast['type'], text: string) => {
  message.value = { type, text }
  if (messageTimer !== null) {
    clearTimeout(messageTimer)
  }
  messageTimer = window.setTimeout(() => {
    message.value = null
    messageTimer = null
  }, 4000)
}
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
