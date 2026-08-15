<template>
  <!--
    One positioned column holding the button and the popup that belongs to it,
    rather than two independently-fixed elements. The popup used to restate the
    button's offset plus its own height in a comment block of arithmetic that
    had to be redone for every size or breakpoint; anchoring it to `bottom-full`
    of the shared wrapper means it simply sits above whatever the button is and
    wherever the button has landed.

    The wrapper's own bottom edge comes from the shared FAB slots — `--fab-bottom`
    when this is the only floating action on the page, the slot above it when a
    page-level FAB is already there. Both are defined in MainLayout and track
    the floating tab bar's real footprint.
  -->
  <div
    class="fixed right-4 lg:right-6 z-[55]"
    :class="hasFabBelow ? 'bottom-[var(--fab-stack-2)]' : 'bottom-[var(--fab-bottom)]'"
  >
    <!-- Help Chat Popup -->
    <Transition name="chat-popup">
      <div
        v-if="showChatPopup"
        class="absolute bottom-full right-0 mb-3 bg-white rounded-2xl shadow-2xl p-4 w-72 border border-slate-100"
      >
        <!-- Arrow, centred on the button below it (half of w-10 / lg:w-14,
             less half the arrow's own 1rem). -->
        <div class="absolute -bottom-2 right-3 lg:right-5 w-4 h-4 bg-white border-r border-b border-slate-100 transform rotate-45"></div>

        <!-- Close button -->
        <button
          @click="dismissPopup"
          class="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close"
        >
          <X class="w-4 h-4" />
        </button>

        <!-- Content -->
        <div class="flex items-start gap-3 mb-3">
          <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#0088cc] to-[#229ED9] rounded-full flex items-center justify-center">
            <MessageCircle class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1 pt-1">
            <p class="text-sm text-slate-700 leading-relaxed">
              Need help? Contact us!<br />
              <span class="font-kantumruy">ត្រូវការជំនួយ? ទាក់ទងមកយើង!</span>
            </p>
          </div>
        </div>

        <!-- Don't show again checkbox -->
        <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-500 hover:text-slate-700 transition-colors">
          <input
            type="checkbox"
            v-model="dontShowAgain"
            @change="handleDontShowAgainChange"
            class="w-3.5 h-3.5 rounded border-slate-300 text-[#0088cc] focus:ring-[#0088cc] focus:ring-offset-0"
          />
          <span>Don't show again / <span class="font-kantumruy">កុំបង្ហាញម្តងទៀត</span></span>
        </label>
      </div>
    </Transition>

    <!-- Contact Us FAB - Telegram Link. Deliberately a size down from the
         page's own FAB on mobile (mini chip; full size on desktop, where
         there is room): support is the secondary action of any page it
         appears on, and the descending sizes going up the column are what
         keep the stack from reading as two peers. Tooltip is desktop-only —
         on touch there is no hover to reveal it. -->
    <a
      :href="telegramLink"
      target="_blank"
      rel="noopener noreferrer"
      class="relative bg-gradient-to-r from-[#0088cc] to-[#229ED9] hover:from-[#006ca8] hover:to-[#1c7fb5] text-white rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 flex items-center justify-center w-10 h-10 lg:w-14 lg:h-14 hover:scale-110 active:scale-95 group"
      aria-label="Contact support"
      @click="dismissPopup"
    >
      <Send class="w-5 h-5 lg:w-6 lg:h-6 transition-transform duration-300 group-hover:rotate-12" />
      <div
        class="hidden lg:block absolute right-full mr-4 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none"
      >
        Contact Us
      </div>
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Send, X, MessageCircle } from 'lucide-vue-next'
import { secureStorage } from '@/utils/secureStorage'
import { useAuthStore } from '@/stores/auth'

interface Props {
  canEdit?: boolean
  hasFabBelow?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: false,
  hasFabBelow: false
})
const route = useRoute()
const authStore = useAuthStore()

const STORAGE_KEY_PREFIX = 'contact_fab_dont_show_'
const POPUP_DELAY = 5000
const EXPIRY_MS = 24 * 60 * 60 * 1000 // 1 day

const showChatPopup = ref(false)
const dontShowAgain = ref(false)
let popupTimer: ReturnType<typeof setTimeout> | null = null

// Get user-specific storage key
const storageKey = computed(() => {
  const userId = authStore.user?.id
  return userId ? `${STORAGE_KEY_PREFIX}${userId}` : null
})

// Check if user is on their own event manage page
const isOwnEventPage = computed(() => {
  return route.name === 'event-manage' && props.canEdit === true
})

// Create Telegram link
const telegramLink = computed(() => {
  return `https://t.me/goeventkh`
})

// Check if popup should be shown (with 1-day expiry)
const shouldShowPopup = () => {
  if (!storageKey.value) return false
  const stored = secureStorage.getItem(storageKey.value)
  if (!stored) return true

  const timestamp = parseInt(stored, 10)
  if (isNaN(timestamp)) return true

  return Date.now() - timestamp > EXPIRY_MS
}

// Start popup timer when on own event page
const startPopupTimer = () => {
  if (popupTimer) clearTimeout(popupTimer)

  if (isOwnEventPage.value && shouldShowPopup()) {
    popupTimer = setTimeout(() => {
      showChatPopup.value = true
    }, POPUP_DELAY)
  }
}

// Dismiss popup
const dismissPopup = () => {
  showChatPopup.value = false
  if (popupTimer) {
    clearTimeout(popupTimer)
    popupTimer = null
  }
}

// Handle don't show again change
const handleDontShowAgainChange = () => {
  if (dontShowAgain.value && storageKey.value) {
    secureStorage.setItem(storageKey.value, Date.now().toString())
    dismissPopup()
  }
}

// Watch for route/canEdit changes
watch(
  () => [route.name, props.canEdit],
  ([newRouteName], [oldRouteName]) => {
    // Only dismiss if route changed (not just canEdit becoming true)
    if (newRouteName !== oldRouteName) {
      dismissPopup()
    }
    startPopupTimer()
  }
)

// Watch for user changes (account switch) and initial load
watch(
  () => authStore.user?.id,
  (newUserId) => {
    // Reset state for new user or on initial load
    dontShowAgain.value = false
    dismissPopup()
    if (newUserId) {
      startPopupTimer()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (popupTimer) {
    clearTimeout(popupTimer)
  }
})
</script>

<style scoped>
/* Chat popup transitions */
.chat-popup-enter-active {
  animation: chat-popup-in 0.3s ease-out;
}

.chat-popup-leave-active {
  animation: chat-popup-out 0.2s ease-in;
}

@keyframes chat-popup-in {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes chat-popup-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
}
</style>
