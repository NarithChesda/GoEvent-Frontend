<template>
  <div ref="rootRef" class="relative">
    <!-- Desktop: an icon button in the top bar's utility cluster -->
    <button
      v-if="variant === 'desktop'"
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

    <!-- Mobile: an icon in the floating tab pill, sized and shaped like the
         other collapsed tabs there. Only the tab you are *on* carries a label
         in that pill, and this one opens a sheet rather than navigating, so it
         stays an icon and shows its state through the fill instead. -->
    <button
      v-else
      type="button"
      class="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 active:scale-95"
      :class="open ? 'bg-slate-900/[0.06] text-[#2ecc71]' : 'text-slate-500 hover:text-slate-700'"
      :aria-label="t('common.notifications.title')"
      :aria-expanded="open"
      :aria-haspopup="true"
      @click.stop="toggle"
    >
      <span class="relative flex-shrink-0">
        <Bell class="w-5 h-5" aria-hidden="true" />
        <span
          v-if="store.hasUnread"
          class="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center leading-none"
          aria-live="polite"
        >
          {{ store.badgeLabel }}
        </span>
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
import { useExclusiveMenu } from '@/composables/useExclusiveMenu'

const props = withDefaults(
  defineProps<{
    /**
     * `desktop` — icon button in TopNavBar, anchored dropdown.
     * `mobile` — a tab in MobileTabBar, bottom sheet.
     */
    variant?: 'desktop' | 'mobile'
  }>(),
  { variant: 'desktop' },
)

// Shared slot with the top bar's profile/language menus — opening this one
// closes those, and vice versa.
const { isOpen: open, close, toggle: toggleMenu } = useExclusiveMenu()

const rootRef = ref<HTMLElement | null>(null)
const store = useNotificationsStore()
const { t } = useAppLanguage()
const route = useRoute()

function toggle() {
  toggleMenu()
  if (open.value) {
    // Refresh count when opening — keeps badge accurate even if poll is stale.
    store.fetchUnreadCount().catch(() => {
      /* swallow */
    })
  }
}

function handleClickOutside(event: MouseEvent) {
  // Desktop only — the mobile sheet is teleported outside rootRef and
  // closes via its backdrop instead.
  if (!open.value || props.variant === 'mobile') return
  const target = event.target
  if (!(target instanceof Node)) return
  if (rootRef.value && !rootRef.value.contains(target)) {
    close()
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    close()
  }
}

// Close when route changes (e.g. clicking a notification navigates away)
watch(
  () => route.fullPath,
  () => {
    close()
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
  // Unconditional: useExclusiveMenu's own unmount hook runs first and has
  // already released `open`, so checking it here would never restore scroll.
  if (props.variant === 'mobile') {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
/*
  Desktop dropdown. `transition: all` also animated the panel's backdrop blur,
  border and shadow — repainting a 24px blur every frame is what made the open
  read as sluggish. Transform + opacity only, and the panel unfolds from the
  bell it is anchored to rather than sliding in flat.
*/
.dropdown-enter-active {
  transition:
    opacity 0.16s ease-out,
    transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}

.dropdown-leave-active {
  transition:
    opacity 0.14s ease-in,
    transform 0.18s cubic-bezier(0.4, 0, 0.6, 1);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transform-origin: top right;
  will-change: transform, opacity;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: opacity 0.12s ease;
  }

  .dropdown-enter-from,
  .dropdown-leave-to {
    transform: none;
  }
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
