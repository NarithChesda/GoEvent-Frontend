<template>
  <div>
    <!-- Help Chat Popup -->
    <Transition name="chat-popup">
      <div
        v-if="showChatPopup"
        :class="chatPopupPositionClass"
        class="fixed right-6 z-[59] bg-white rounded-2xl shadow-2xl p-4 w-72 border border-gray-100"
      >
        <!-- Arrow pointing to FAB -->
        <div class="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-gray-100 transform rotate-45"></div>

        <!-- Close button -->
        <button
          @click="dismissPopup"
          class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
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
            <p class="text-sm text-gray-700 leading-relaxed">
              Need help? Contact us!<br />
              <span class="font-kantumruy">ត្រូវការជំនួយ? ទាក់ទងមកយើង!</span>
            </p>
          </div>
        </div>

        <!-- Don't show again checkbox -->
        <label class="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-gray-700 transition-colors">
          <input
            type="checkbox"
            v-model="dontShowAgain"
            @change="handleDontShowAgainChange"
            class="w-3.5 h-3.5 rounded border-gray-300 text-[#0088cc] focus:ring-[#0088cc] focus:ring-offset-0"
          />
          <span>Don't show again / <span class="font-kantumruy">កុំបង្ហាញម្តងទៀត</span></span>
        </label>
      </div>
    </Transition>

    <!-- Contact Us FAB - Telegram Link -->
    <a
      :href="telegramLink"
      target="_blank"
      rel="noopener noreferrer"
      :class="fabPositionClass"
      class="fixed right-6 z-[60] bg-gradient-to-r from-[#0088cc] to-[#229ED9] hover:from-[#006ca8] hover:to-[#1c7fb5] text-white rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center h-14 w-14 hover:scale-110 group"
      aria-label="Contact support"
      @click="dismissPopup"
    >
      <Send class="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" />
      <div
        class="absolute right-full mr-4 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none"
      >
        Contact Us
      </div>
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Send, X, MessageCircle } from 'lucide-vue-next'
import { secureStorage } from '@/utils/secureStorage'
import { useAuthStore } from '@/stores/auth'

interface Props {
  canEdit?: boolean
}

const props = defineProps<Props>()
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

// Check if user is on their own event detail page
const isOwnEventDetailPage = computed(() => {
  return route.name === 'event-detail' && props.canEdit === true
})

// Create Telegram link
const telegramLink = computed(() => {
  return `https://t.me/goeventkh`
})

// FAB position
const fabPositionClass = computed(() => {
  return 'bottom-20 lg:bottom-4'
})

// Chat popup position (above the FAB)
const chatPopupPositionClass = computed(() => {
  return 'bottom-[150px] lg:bottom-[78px]'
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

  if (isOwnEventDetailPage.value && shouldShowPopup()) {
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
  () => {
    dismissPopup()
    startPopupTimer()
  }
)

onMounted(() => {
  startPopupTimer()
})

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
