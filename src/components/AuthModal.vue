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

        <!-- Telegram Login Button -->
        <button
          type="button"
          @click="handleTelegramLogin"
          :disabled="isTelegramLoading"
          class="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1e90ff] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="isTelegramLoading" class="animate-spin h-5 w-5 mr-2" />
          <svg v-else class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#0088cc"/>
            <path d="M5.55 11.47c3.68-1.61 6.14-2.67 7.38-3.18 3.52-1.46 4.25-1.72 4.73-1.72.1 0 .34.02.5.15.13.1.16.24.18.34.02.1.04.32.02.49-.19 1.97-.99 6.75-1.4 8.96-.17.93-.51 1.24-.84 1.27-.71.07-1.25-.47-1.94-.92-1.08-.71-1.69-1.15-2.74-1.84-1.21-.8-.42-1.24.26-1.96.18-.19 3.26-2.99 3.32-3.24.01-.03.01-.15-.06-.21-.07-.06-.17-.04-.24-.02-.1.02-1.73 1.1-4.88 3.23-.46.32-.88.47-1.25.46-.41-.01-1.2-.23-1.79-.42-.72-.24-1.29-.36-1.24-.76.03-.21.32-.42.89-.64z" fill="white"/>
          </svg>
          <span class="text-sm font-medium text-gray-700">
            {{ isTelegramLoading ? 'Signing in...' : 'Continue with Telegram' }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { X, Loader2, AlertCircle } from 'lucide-vue-next'
import LogoSvg from '@/assets/logo.png'
import { useAuthStore } from '../stores/auth'
import { googleTokenLogin } from 'vue3-google-login'
import { isNormalBrowser, getBrowserType } from '../utils/browserDetection'

interface Props {
  isVisible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  authenticated: []
}>()

const authStore = useAuthStore()

// Modal state
const modalContent = ref<HTMLElement | null>(null)
const modalAnimation = ref('scale-95 opacity-0')

// Loading states
const isGoogleLoading = ref(false)
const isTelegramLoading = ref(false)

// Error handling
const errorMessage = ref('')

// Browser detection - only show Google login in normal browsers
const shouldShowGoogleLogin = computed(() => isNormalBrowser())

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
  isTelegramLoading.value = true
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
  } finally {
    isTelegramLoading.value = false
  }
}

const handleTelegramLogin = () => {
  // Trigger click on the hidden Telegram widget button
  const telegramButton = document.querySelector<HTMLIFrameElement>('#telegram-widget-hidden iframe')
  if (telegramButton) {
    telegramButton.click()
  }
}

const loadTelegramWidget = () => {
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'goevent_authentication_bot'

  if (!botUsername) {
    console.warn('Telegram bot username not configured')
    return
  }

  // Remove existing script if any
  const existingScript = document.querySelector('script[src*="telegram-widget"]')
  if (existingScript) {
    existingScript.remove()
  }

  // Create hidden container for Telegram widget
  let container = document.getElementById('telegram-widget-hidden')
  if (!container) {
    container = document.createElement('div')
    container.id = 'telegram-widget-hidden'
    container.style.display = 'none'
    document.body.appendChild(container)
  }
  container.innerHTML = ''

  // Create Telegram widget script
  const script = document.createElement('script')
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.async = true
  script.setAttribute('data-telegram-login', botUsername)
  script.setAttribute('data-size', 'large')
  script.setAttribute('data-onauth', 'onTelegramAuth(user)')
  script.setAttribute('data-request-access', 'write')

  // Define global callback
  ;(window as any).onTelegramAuth = handleTelegramAuth

  // Append to hidden container
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

  // Log browser detection for debugging
  console.log('Browser type detected:', getBrowserType())
  console.log('Should show Google login:', shouldShowGoogleLogin.value)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
  // Clean up global callback
  delete (window as any).onTelegramAuth

  // Clean up hidden container
  const container = document.getElementById('telegram-widget-hidden')
  if (container) {
    container.remove()
  }
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
</style>
