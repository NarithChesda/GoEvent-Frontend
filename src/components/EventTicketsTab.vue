<template>
  <section class="space-y-6">
    <!-- Header -->
    <header>
      <h2 class="text-2xl font-bold text-slate-900 leading-tight tracking-tight">
        {{ t('management.tickets.title') }}
      </h2>
      <p class="mt-1 text-sm text-slate-600">
        {{ t('management.tickets.subtitle') }}
      </p>
    </header>

    <!-- Sub-tab pills -->
    <nav
      class="flex gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-fit"
      role="tablist"
      :aria-label="t('management.tickets.title')"
    >
      <button
        v-for="tab in subTabs"
        :key="tab.id"
        type="button"
        class="flex-1 sm:flex-initial px-4 py-2 text-sm font-medium rounded-lg transition-colors"
        :class="
          activeSubTab === tab.id
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        "
        :aria-selected="activeSubTab === tab.id"
        role="tab"
        @click="setSubTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- Active sub-tab body -->
    <div>
      <TicketOrdersList
        v-if="activeSubTab === 'orders'"
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

    <!-- Local toast (the parent EventManageView has its own; we keep a lightweight one
         here so feedback is local to the tab and doesn't need plumbing back up). -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-20 lg:bottom-4 right-6 z-50">
        <div
          :class="message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'"
          class="text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-sm"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 flex-shrink-0" />
          <AlertCircle v-else class="w-5 h-5 flex-shrink-0" />
          <span class="text-sm">{{ message.text }}</span>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CheckCircle, AlertCircle } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import TicketOrdersList from './tickets/TicketOrdersList.vue'
import TicketTypesManager from './tickets/TicketTypesManager.vue'
import CheckoutQuestionsManager from './tickets/CheckoutQuestionsManager.vue'

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
  { id: 'orders' as const, label: t('management.tickets.subTabs.orders') },
  { id: 'tiers' as const, label: t('management.tickets.subTabs.tiers') },
  { id: 'questions' as const, label: t('management.tickets.subTabs.questions') },
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
</style>
