<template>
  <div ref="rootRef" class="relative">
    <button
      type="button"
      class="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white/60 transition-all duration-200 relative"
      :aria-label="t('common.notifications.title')"
      :aria-expanded="open"
      :aria-haspopup="true"
      @click.stop="toggle"
    >
      <Bell class="w-[18px] h-[18px]" />
      <span
        v-if="store.hasUnread"
        class="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center leading-none"
        aria-live="polite"
      >
        {{ store.badgeLabel }}
      </span>
    </button>

    <!-- Desktop: anchored dropdown -->
    <Transition name="dropdown">
      <NotificationDropdown
        v-if="open && variant === 'desktop'"
        variant="desktop"
        @close="close"
      />
    </Transition>

    <!-- Mobile: bottom sheet with backdrop, teleported above FABs/tab bar -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="open && variant === 'mobile'"
          class="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm"
          @click="close"
        />
      </Transition>
      <Transition name="sheet">
        <NotificationDropdown
          v-if="open && variant === 'mobile'"
          variant="mobile"
          @close="close"
        />
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Bell } from 'lucide-vue-next'
import NotificationDropdown from './NotificationDropdown.vue'
import { useNotificationsStore } from '@/stores/notifications'
import { useAppLanguage } from '@/composables/useAppLanguage'

const props = withDefaults(
  defineProps<{
    variant?: 'desktop' | 'mobile'
  }>(),
  { variant: 'desktop' },
)

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const store = useNotificationsStore()
const { t } = useAppLanguage()
const route = useRoute()

function toggle() {
  open.value = !open.value
  if (open.value) {
    // Refresh count when opening — keeps badge accurate even if poll is stale.
    store.fetchUnreadCount().catch(() => {
      /* swallow */
    })
  }
}

function close() {
  open.value = false
}

function handleClickOutside(event: MouseEvent) {
  // Desktop only — the mobile sheet is teleported outside rootRef and
  // closes via its backdrop instead.
  if (!open.value || props.variant === 'mobile') return
  const target = event.target
  if (!(target instanceof Node)) return
  if (rootRef.value && !rootRef.value.contains(target)) {
    open.value = false
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    open.value = false
  }
}

// Close when route changes (e.g. clicking a notification navigates away)
watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)

// Lock body scroll while the mobile sheet is open
watch(open, (isOpen) => {
  if (props.variant === 'mobile') {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
  if (props.variant === 'mobile' && open.value) {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Mobile bottom sheet: backdrop fade + panel slide-up */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.sheet-enter-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.6, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active,
  .sheet-leave-active,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
