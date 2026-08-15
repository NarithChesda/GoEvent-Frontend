<template>
  <div
    ref="panelRef"
    class="flex flex-col overflow-hidden"
    :class="panelPositionClass"
    :role="variant === 'mobile' ? 'dialog' : 'menu'"
    :aria-modal="variant === 'mobile' ? 'true' : undefined"
    aria-label="Notifications"
  >
    <!-- Drag-to-close area (mobile sheet): handle + header, kept out of the
         scrollable body so it doesn't fight list scrolling -->
    <div
      v-if="variant === 'mobile'"
      class="flex-shrink-0 touch-none"
      @touchstart.passive="onDragStart"
      @touchmove.passive="onDragMove"
      @touchend="onDragEnd"
      @touchcancel="onDragEnd"
    >
      <div class="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-3" aria-hidden="true" />

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
    </div>

    <!-- Header (desktop) -->
    <div
      v-if="variant !== 'mobile'"
      class="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0"
    >
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
    <div class="flex-1 overflow-y-auto overscroll-contain" role="list">
      <!-- Initial loading — skeleton rows, not a centred spinner: the panel
           opens at roughly its loaded height, so the list arriving swaps
           content in place instead of snapping the panel taller mid-animation. -->
      <div
        v-if="store.loadingList && store.items.length === 0"
        class="divide-y divide-slate-100"
        role="status"
        :aria-label="t('common.actions.loading')"
      >
        <div
          v-for="n in 3"
          :key="n"
          class="flex items-start gap-3 px-4 py-3.5 animate-pulse"
          aria-hidden="true"
        >
          <div class="flex-shrink-0 w-9 h-9 rounded-full bg-slate-200"></div>
          <div class="min-w-0 flex-1 space-y-2 pt-0.5">
            <div class="h-3.5 bg-slate-200 rounded w-2/5"></div>
            <div class="h-3 bg-slate-200 rounded w-4/5"></div>
            <div class="h-2.5 bg-slate-200 rounded w-1/4"></div>
          </div>
          <div class="flex-shrink-0 w-6 flex justify-center pt-2">
            <span class="w-2 h-2 rounded-full bg-slate-200"></span>
          </div>
        </div>
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
    <div
      class="px-5 py-2.5 border-t border-slate-100 flex items-center justify-between flex-shrink-0"
      :class="variant === 'mobile' ? 'pb-[max(env(safe-area-inset-bottom),0.625rem)]' : ''"
    >
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

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const store = useNotificationsStore()
const { t } = useAppLanguage()

const markingAll = ref(false)
const panelRef = ref<HTMLElement | null>(null)

// Swipe-to-close for the mobile bottom sheet — dragged from the handle/header
// only, so it doesn't fight scrolling inside the notification list.
const CLOSE_DISTANCE_PX = 120
const CLOSE_VELOCITY_PX_PER_MS = 0.5
let dragging = false
let dragStartY = 0
let dragOffset = 0
let dragStartedAt = 0

function onDragStart(event: TouchEvent) {
  if (props.variant !== 'mobile') return
  dragging = true
  dragStartY = event.touches[0].clientY
  dragOffset = 0
  dragStartedAt = Date.now()
  if (panelRef.value) panelRef.value.style.transition = 'none'
}

function onDragMove(event: TouchEvent) {
  if (!dragging) return
  dragOffset = Math.max(0, event.touches[0].clientY - dragStartY)
  if (panelRef.value) panelRef.value.style.transform = `translateY(${dragOffset}px)`
}

function onDragEnd() {
  if (!dragging) return
  dragging = false

  const elapsedMs = Math.max(Date.now() - dragStartedAt, 1)
  const velocity = dragOffset / elapsedMs
  const shouldClose = dragOffset > CLOSE_DISTANCE_PX || velocity > CLOSE_VELOCITY_PX_PER_MS

  const panel = panelRef.value
  if (!panel) {
    if (shouldClose) emit('close')
    return
  }

  panel.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.6, 1)'
  if (shouldClose) {
    panel.style.transform = 'translateY(100%)'
    const handleTransitionEnd = () => {
      panel.removeEventListener('transitionend', handleTransitionEnd)
      emit('close')
    }
    panel.addEventListener('transitionend', handleTransitionEnd)
  } else {
    panel.style.transform = ''
  }
}

// Mobile: bottom sheet teleported to <body> by NotificationBell — sits above
// the FABs and mobile tab bar (overlay z ladder) with its own backdrop.
//
// Desktop: classic right-aligned glass dropdown anchored to the bell.
const panelPositionClass = computed(() =>
  props.variant === 'mobile'
    ? 'fixed inset-x-0 bottom-0 z-[999] bg-white rounded-t-3xl shadow-2xl max-h-[85vh]'
    : 'glass-dropdown absolute right-0 top-full mt-2 w-[23.75rem] max-h-[70vh] rounded-2xl z-[100]',
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
/* Match the language dropdown / global search modal so the brand glass look
   is consistent across the top-bar surfaces. Kept near-opaque so the
   notification list stays readable over busy page content behind it. */
.glass-dropdown {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow:
    0 12px 40px rgba(15, 23, 42, 0.12),
    0 4px 12px rgba(30, 144, 255, 0.08);
}

/* The list scrolls, and the platform scrollbar is far heavier than this panel's
   chrome. Thin 6px style, design standard §10 — same as the filter menus. */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
