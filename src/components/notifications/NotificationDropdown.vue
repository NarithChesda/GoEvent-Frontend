<template>
  <div
    class="glass-dropdown absolute right-0 top-full mt-2 rounded-2xl overflow-hidden z-[100] flex flex-col"
    :class="panelSizeClass"
    role="menu"
    aria-label="Notifications"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div class="flex items-center gap-2">
        <div class="font-semibold text-slate-900">{{ t('common.notifications.title') }}</div>
        <span
          v-if="store.unreadCount > 0"
          class="px-1.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#2ecc71]/10 text-[#27ae60]"
        >
          {{ store.unreadCount }}
        </span>
      </div>
      <button
        v-if="store.unreadCount > 0"
        type="button"
        class="text-xs font-medium text-[#1e90ff] hover:text-[#1873cc] disabled:opacity-50"
        :disabled="markingAll"
        @click="handleMarkAllRead"
      >
        {{ t('common.notifications.actions.markAllRead') }}
      </button>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto" role="list">
      <!-- Initial loading -->
      <div
        v-if="store.loadingList && store.items.length === 0"
        class="flex flex-col items-center justify-center py-12 px-4 text-slate-400"
      >
        <Loader2 class="w-6 h-6 animate-spin mb-2" />
        <span class="text-sm">{{ t('common.actions.loading') }}</span>
      </div>

      <!-- Error state -->
      <div
        v-else-if="store.listError && store.items.length === 0"
        class="flex flex-col items-center justify-center py-12 px-4 text-center"
      >
        <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
          <AlertCircle class="w-6 h-6 text-red-500" />
        </div>
        <div class="text-sm text-slate-700 mb-2">{{ store.listError }}</div>
        <button
          type="button"
          class="text-sm text-[#1e90ff] hover:text-[#1873cc] font-medium"
          @click="reload"
        >
          {{ t('common.actions.retry') }}
        </button>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="store.items.length === 0"
        class="flex flex-col items-center justify-center py-12 px-4 text-center"
      >
        <div class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
          <BellOff class="w-6 h-6 text-slate-400" />
        </div>
        <div class="text-sm font-medium text-slate-700">
          {{ t('common.notifications.empty.title') }}
        </div>
        <div class="text-xs text-slate-400 mt-1">
          {{ t('common.notifications.empty.subtitle') }}
        </div>
      </div>

      <!-- List -->
      <div v-else class="divide-y divide-slate-100">
        <NotificationItemRow
          v-for="item in store.items"
          :key="item.id"
          :notification="item"
          @activate="handleActivate"
          @delete="handleDelete"
        />

        <!-- Load more -->
        <div v-if="store.hasMore" class="p-3 text-center">
          <button
            type="button"
            class="text-sm text-[#1e90ff] hover:text-[#1873cc] font-medium disabled:opacity-50"
            :disabled="store.loadingMore"
            @click="store.loadMore()"
          >
            <span v-if="store.loadingMore" class="flex items-center justify-center gap-1.5">
              <Loader2 class="w-3.5 h-3.5 animate-spin" />
              {{ t('common.actions.loading') }}
            </span>
            <span v-else>{{ t('common.actions.seeMore') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="px-5 py-2.5 border-t border-slate-100 flex items-center justify-between">
      <RouterLink
        to="/settings?tab=notifications"
        class="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
        @click="$emit('close')"
      >
        <Settings class="w-3 h-3" />
        {{ t('common.notifications.actions.preferences') }}
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Loader2, AlertCircle, BellOff, Settings } from 'lucide-vue-next'
import NotificationItemRow from './NotificationItem.vue'
import { useNotificationsStore } from '@/stores/notifications'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = defineProps<{
  variant?: 'desktop' | 'mobile'
}>()

defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const store = useNotificationsStore()
const { t } = useAppLanguage()

const markingAll = ref(false)

const panelSizeClass = computed(() =>
  props.variant === 'mobile'
    ? 'w-[calc(100vw-1.5rem)] max-w-sm max-h-[70vh]'
    : 'w-[380px] max-h-[70vh]',
)

onMounted(() => {
  // Refresh on every open — list state can be stale.
  store.fetchNotifications({ reset: true })
})

function reload() {
  store.fetchNotifications({ reset: true })
}

async function handleActivate(id: string, actionUrl: string) {
  await store.markRead(id)
  if (actionUrl) {
    router.push(actionUrl)
  }
}

async function handleDelete(id: string) {
  await store.remove(id)
}

async function handleMarkAllRead() {
  markingAll.value = true
  try {
    await store.markAllRead()
  } finally {
    markingAll.value = false
  }
}
</script>

<style scoped>
.glass-dropdown {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 8px 32px rgba(46, 204, 113, 0.1),
    0 4px 12px rgba(30, 144, 255, 0.08);
}
</style>
