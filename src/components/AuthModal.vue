<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    @click="handleBackdropClick"
  >
    <div
      ref="modalContent"
      class="relative w-full max-w-md bg-white/95 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl p-8 transform transition-all duration-300"
      :class="modalAnimation"
      @click.stop
    >
      <!-- Close Button -->
      <button
        @click="closeModal"
        class="absolute top-6 right-6 p-2 rounded-xl bg-gray-100/50 hover:bg-gray-200/50 transition-colors"
      >
        <X class="w-5 h-5 text-gray-500" />
      </button>

      <!-- Header -->
      <div class="text-center mb-8">
        <img
          :src="LogoSvg"
          alt="GoEvent Logo"
          class="h-24 w-auto mx-auto mb-4"
        />
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome</h2>
        <p class="text-gray-600">Sign in to continue</p>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
        <div class="flex items-center">
          <AlertCircle class="h-5 w-5 text-red-600 mr-2" />
          <span class="text-red-700 text-sm">{{ errorMessage }}</span>
        </div>
      </div>

      <!-- Social Login Buttons -->
      <div class="space-y-3">
        <!-- Google Login Button - Only show in normal browsers (not in messaging apps) -->
        <button
          v-if="shouldShowGoogleLogin"
          type="button"
          @click="handleGoogleLogin"
          :disabled="isGoogleLoading"
          class="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1e90ff] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="isGoogleLoading" class="animate-spin h-5 w-5 mr-2" />
          <svg v-else class="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span class="text-sm font-medium text-gray-700">
            {{ isGoogleLoading ? 'Signing in...' : 'Continue with Google' }}
          </span>
        </button>

        <!-- Telegram Login Widget (legacy - commented out) -->
        <!-- <div id="telegram-login-widget" class="flex justify-center"></div> -->

        <!-- Telegram Bot Login Button (new - works everywhere) -->
        <div v-if="telegramBotStatus === 'pending'" class="p-4 bg-sky-50 border-2 border-sky-200 rounded-xl telegram-pending-pulse">
          <div class="text-center space-y-3">
            <!-- Animated indicator -->
            <div class="flex items-center justify-center space-x-2">
              <div class="relative">
                <Loader2 class="animate-spin h-6 w-6 text-sky-500" />
                <div class="absolute inset-0 animate-ping opacity-30">
                  <Loader2 class="h-6 w-6 text-sky-500" />
                </div>
              </div>
              <span class="text-sm font-semibold text-sky-700">Waiting for confirmation...</span>
            </div>

            <!-- Instructions -->
            <div class="bg-white/60 rounded-lg p-3 space-y-2">
              <p class="text-xs font-medium text-sky-800">
                1. Open Telegram and tap "Start" in the bot
              </p>
              <p class="text-xs font-medium text-sky-800">
                2. Return to this page - you'll be logged in automatically
              </p>
            </div>

            <!-- Countdown timer -->
            <div v-if="telegramCountdown > 0" class="text-xs text-sky-600">
              Session expires in <span class="font-mono font-semibold">{{ formatCountdown(telegramCountdown) }}</span>
            </div>

            <!-- Action buttons -->
            <div class="flex items-center justify-center space-x-2">
              <button
                type="button"
                @click="openTelegram"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors shadow-sm"
              >
                <Send class="h-4 w-4 mr-2" />
                Open Telegram
              </button>
              <button
                type="button"
                @click="resetTelegramBotLogin"
                class="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
              >
                <X class="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          </div>
        </div>
        <button
          v-else
          type="button"
          @click="handleTelegramBotLogin"
          :disabled="isTelegramBotLoading"
          class="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl bg-white/50 hover:bg-sky-50 transition-all duration-200 hover:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <Loader2 v-if="isTelegramBotLoading" class="animate-spin h-5 w-5 mr-3 text-sky-500" />
          <Send v-else class="h-5 w-5 mr-3 text-sky-500 group-hover:text-sky-600" />
          <span class="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            {{ isTelegramBotLoading ? 'Opening Telegram...' : 'Continue with Telegram' }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { X, Loader2, AlertCircle, Send } from 'lucide-vue-next'
import LogoSvg from '@/assets/logo.png'
import { useAuthStore } from '../stores/auth'
import { googleTokenLogin } from 'vue3-google-login'
import { isDesktopDevice, isMessagingAppBrowser } from '../utils/browserDetection'
import { useTelegramBotLogin } from '../composables/useTelegramBotLogin'

interface Props {
  isVisible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  authenticated: []
}>()

const authStore = useAuthStore()

// Telegram Bot Login
const {
  status: telegramBotStatus,
  error: telegramBotError,
  user: telegramBotUser,
  tokens: telegramBotTokens,
  initiateLogin: initiateTelegramBotLogin,
  openTelegram,
  reset: resetTelegramBotLogin,
} = useTelegramBotLogin()

// Countdown timer for Telegram bot login
const telegramCountdown = ref(0)
let countdownInterval: ReturnType<typeof setInterval> | null = null

const startCountdown = (seconds: number) => {
  telegramCountdown.value = seconds
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = setInterval(() => {
    if (telegramCountdown.value > 0) {
      telegramCountdown.value--
    } else {
      if (countdownInterval) clearInterval(countdownInterval)
    }
  }, 1000)
}

const formatCountdown = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Modal state
const modalContent = ref<HTMLElement | null>(null)
const modalAnimation = ref('scale-95 opacity-0')

// Loading states
const isGoogleLoading = ref(false)
const isTelegramBotLoading = ref(false)

// Error handling
const errorMessage = ref('')

// Browser detection - only show Google login on desktop devices (computers)
const shouldShowGoogleLogin = computed(() => isDesktopDevice())

// Modal control methods
const closeModal = () => {
  modalAnimation.value = 'scale-95 opacity-0'
  setTimeout(() => {
    emit('close')
    resetForms()
  }, 150)
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    closeModal()
  }
}

const resetForms = () => {
  errorMessage.value = ''
}

// Authentication methods
const handleGoogleLogin = async () => {
  isGoogleLoading.value = true
  errorMessage.value = ''

  try {
    const response = await googleTokenLogin()

    if (response.access_token) {
      const result = await authStore.googleLogin(response.access_token)

      if (result.success) {
        emit('authenticated')
        closeModal()
      } else {
        errorMessage.value = result.error || 'Google login failed'
      }
    }
  } catch (error: any) {
    console.error('Google login error:', error)
    if (error.message && error.message.includes('popup_closed_by_user')) {
      errorMessage.value = 'Google sign-in was cancelled'
    } else {
      errorMessage.value = 'Google sign-in failed. Please try again.'
    }
  } finally {
    isGoogleLoading.value = false
  }
}

const handleTelegramAuth = async (user: any) => {
  errorMessage.value = ''

  try {
    const result = await authStore.telegramLogin(user)

    if (result.success) {
      emit('authenticated')
      closeModal()
    } else {
      errorMessage.value = result.error || 'Telegram login failed'
    }
  } catch (error: any) {
    console.error('Telegram login error:', error)
    errorMessage.value = 'Telegram sign-in failed. Please try again.'
  }
}

// Handle Telegram Bot Login
const handleTelegramBotLogin = async () => {
  if (isTelegramBotLoading.value || telegramBotStatus.value === 'pending') return

  isTelegramBotLoading.value = true
  errorMessage.value = ''

  try {
    const tokenData = await initiateTelegramBotLogin()
    if (tokenData) {
      // Start countdown timer
      startCountdown(tokenData.expires_in)
      // Automatically open Telegram
      window.open(tokenData.deep_link, '_blank')
    }
  } catch (error: any) {
    console.error('Telegram bot login error:', error)
    errorMessage.value = 'Failed to initiate Telegram login. Please try again.'
  } finally {
    isTelegramBotLoading.value = false
  }
}

// Watch for Telegram bot login completion
watch(telegramBotStatus, async (newStatus) => {
  if (newStatus === 'completed' && telegramBotUser.value && telegramBotTokens.value) {
    // Clear countdown
    if (countdownInterval) clearInterval(countdownInterval)
    telegramCountdown.value = 0

    const result = await authStore.telegramBotLogin(
      telegramBotUser.value,
      telegramBotTokens.value.access,
      telegramBotTokens.value.refresh
    )

    if (result.success) {
      // On messaging app browsers (like Telegram's in-app browser),
      // reload the page to ensure the authenticated state is reflected
      if (isMessagingAppBrowser()) {
        window.location.reload()
      } else {
        emit('authenticated')
        closeModal()
      }
    } else {
      errorMessage.value = result.error || 'Telegram login failed'
      resetTelegramBotLogin()
    }
  } else if (newStatus === 'expired') {
    if (countdownInterval) clearInterval(countdownInterval)
    telegramCountdown.value = 0
    errorMessage.value = 'Telegram login session expired. Please try again.'
  } else if (newStatus === 'error' && telegramBotError.value) {
    if (countdownInterval) clearInterval(countdownInterval)
    telegramCountdown.value = 0
    errorMessage.value = telegramBotError.value
  } else if (newStatus === 'idle') {
    // Reset was called
    if (countdownInterval) clearInterval(countdownInterval)
    telegramCountdown.value = 0
  }
})

const loadTelegramWidget = () => {
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'goevent_authentication_bot'

  const container = document.getElementById('telegram-login-widget')
  if (!container) return

  container.innerHTML = ''

  // Define global callback
  ;(window as any).onTelegramAuth = handleTelegramAuth

  // Create Telegram widget script
  const script = document.createElement('script')
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.async = true
  script.setAttribute('data-telegram-login', botUsername)
  script.setAttribute('data-size', 'large')
  script.setAttribute('data-onauth', 'onTelegramAuth(user)')
  script.setAttribute('data-request-access', 'write')

  container.appendChild(script)
}

// Handle modal animation
watch(
  () => props.isVisible,
  (visible) => {
    if (visible) {
      nextTick(() => {
        modalAnimation.value = 'scale-100 opacity-100'
        loadTelegramWidget()
      })
    }
  },
)

// Handle escape key
const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.isVisible) {
    closeModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
  if (props.isVisible) {
    loadTelegramWidget()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  // Clean up global callback
  delete (window as any).onTelegramAuth
  // Clean up countdown interval
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>

<style scoped>
/* Custom scrollbar for modal content if needed */
.modal-content::-webkit-scrollbar {
  width: 4px;
}

.modal-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}

/* Smooth transitions for form animations */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Focus ring customization */
input:focus {
  --tw-ring-opacity: 0.5;
  box-shadow: 0 0 0 2px rgba(var(--tw-ring-color), var(--tw-ring-opacity));
}

/* Backdrop blur support */
@supports not (backdrop-filter: blur(8px)) {
  .backdrop-blur-sm {
    background-color: rgba(0, 0, 0, 0.6);
  }
  .backdrop-blur-md {
    background-color: rgba(255, 255, 255, 0.9);
  }
}

/* Telegram pending state pulse animation */
.telegram-pending-pulse {
  animation: telegram-pulse 2s ease-in-out infinite;
}

@keyframes telegram-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(14, 165, 233, 0);
  }
}
</style>
