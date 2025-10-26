<template>
  <div
    class="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative overflow-hidden"
  >
    <!-- Background Elements -->
    <div class="absolute inset-0">
      <div
        class="absolute top-0 right-0 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
      ></div>
      <div
        class="absolute bottom-0 left-0 w-80 h-80 bg-[#5eb3f6]/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"
      ></div>
    </div>

    <div class="relative z-10 w-full max-w-lg">
      <!-- Logo and Header -->
      <div class="text-center mb-8">
        <RouterLink to="/" class="inline-flex items-center space-x-3 mb-8">
          <img
            :src="LogoSvg"
            alt="GoEvent Logo"
            class="h-32 w-auto"
          />

        </RouterLink>
        <h2
          class="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 leading-tight tracking-tight"
        >
          Create account
        </h2>
        <p class="text-sm sm:text-base lg:text-lg text-slate-600">
          Start organizing amazing events today
        </p>
      </div>

      <!-- Main Form Card -->
      <div
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8"
      >
        <form class="space-y-4 sm:space-y-6" @submit.prevent="handleSignUp">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label for="first-name" class="block text-sm font-semibold text-slate-700">
                First name
              </label>
              <div class="mt-1">
                <input
                  id="first-name"
                  name="first-name"
                  type="text"
                  autocomplete="given-name"
                  required
                  v-model="form.firstName"
                  class="w-full px-4 py-3 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-900 font-medium"
                  placeholder="John"
                />
              </div>
            </div>

            <div>
              <label for="last-name" class="block text-sm font-semibold text-slate-700">
                Last name
              </label>
              <div class="mt-1">
                <input
                  id="last-name"
                  name="last-name"
                  type="text"
                  autocomplete="family-name"
                  required
                  v-model="form.lastName"
                  class="w-full px-4 py-3 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-900 font-medium"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>

          <div>
            <label for="email" class="block text-sm font-semibold text-slate-700">
              Email address
            </label>
            <div class="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                v-model="form.email"
                class="w-full px-4 py-3 border rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-900 font-medium"
                :class="
                  fieldErrors.email ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'
                "
                placeholder="john@example.com"
              />
              <div v-if="fieldErrors.email" class="mt-1 text-sm text-red-600">
                {{ fieldErrors.email[0] }}
              </div>
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <div class="mt-1 relative">
              <input
                id="password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                required
                v-model="form.password"
                class="w-full px-4 py-3 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-900 font-medium pr-12"
                placeholder="Create a password"
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Eye v-if="!showPassword" class="h-5 w-5" />
                  <EyeOff v-else class="h-5 w-5" />
                </button>
              </div>
            </div>
            <div class="mt-2">
              <div class="flex items-center space-x-2 text-sm">
                <div class="flex space-x-1">
                  <div
                    v-for="i in 4"
                    :key="i"
                    class="w-2 h-2 rounded-full"
                    :class="passwordStrength >= i ? 'bg-green-500' : 'bg-gray-200'"
                  ></div>
                </div>
                <span class="text-slate-500">{{ passwordStrengthText }}</span>
              </div>
            </div>
          </div>

          <div>
            <label for="confirm-password" class="block text-sm font-semibold text-slate-700">
              Confirm password
            </label>
            <div class="mt-1">
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autocomplete="new-password"
                required
                v-model="form.confirmPassword"
                class="w-full px-4 py-3 border border-slate-200 rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-900 font-medium"
                placeholder="Confirm your password"
              />
            </div>
            <div v-if="form.confirmPassword && !passwordsMatch" class="mt-1 text-sm text-red-600">
              Passwords do not match
            </div>
          </div>

          <div class="flex items-center">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              required
              v-model="form.agreeTerms"
              class="w-4 h-4 text-[#1e90ff] border-slate-300 rounded focus:ring-[#1e90ff] focus:ring-2"
            />
            <label for="agree-terms" class="ml-2 block text-sm font-medium text-slate-700">
              I agree to the
              <a href="#" class="text-[#1e90ff] hover:text-[#1e90ff]">Terms of Service</a>
              and
              <a href="#" class="text-[#1e90ff] hover:text-[#1e90ff]">Privacy Policy</a>
            </label>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div class="flex items-center">
              <AlertCircle class="h-5 w-5 text-red-600 mr-2" />
              <span class="text-red-700 text-sm">{{ errorMessage }}</span>
            </div>
          </div>

          <!-- Success Message -->
          <div v-if="successMessage" class="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div class="flex items-center">
              <div class="h-5 w-5 bg-green-500 rounded-full mr-2 flex items-center justify-center">
                <div class="h-2 w-2 bg-white rounded-full"></div>
              </div>
              <span class="text-green-700 text-sm">{{ successMessage }}</span>
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="authStore.isLoading || !passwordsMatch || !form.agreeTerms"
              class="w-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex justify-center items-center"
            >
              <Loader2 v-if="authStore.isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5" />
              {{ authStore.isLoading ? 'Creating account...' : 'Create account' }}
            </button>
          </div>

          <div class="mt-6">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-slate-200" />
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-4 bg-white/80 text-slate-500 font-medium">Or continue with</span>
              </div>
            </div>

            <div class="mt-4 sm:mt-6 space-y-3">
              <button
                type="button"
                @click="handleGoogleSignUp"
                :disabled="isGoogleLoading"
                class="w-full flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1e90ff] group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Loader2 v-if="isGoogleLoading" class="animate-spin h-5 w-5 mr-2" />
                <svg v-else class="h-5 w-5" viewBox="0 0 24 24">
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
                <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900 ml-2">{{
                  isGoogleLoading ? 'Signing up...' : 'Sign up with Google'
                }}</span>
              </button>

              <!-- Telegram Login Widget -->
              <div class="telegram-button-container">
                <!-- Custom styled button (always visible) -->
                <button
                  type="button"
                  @click="handleTelegramLoginClick"
                  :disabled="!isRegisteredDomain"
                  class="w-full flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1e90ff] group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg class="h-5 w-5 mr-2" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="telegram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#2AABEE" />
                        <stop offset="100%" style="stop-color:#229ED9" />
                      </linearGradient>
                    </defs>
                    <circle cx="120" cy="120" r="120" fill="url(#telegram-gradient)" />
                    <path
                      fill="#fff"
                      d="M81.229 128.772l14.237 39.406s1.78 3.687 3.686 3.687 30.255-29.492 30.255-29.492l31.525-60.89L81.737 118.6z"
                    />
                    <path
                      fill="#D2E5F1"
                      d="M100.106 138.878l-2.733 29.046s-1.144 8.9 7.754 0 17.415-15.763 17.415-15.763"
                    />
                    <path
                      fill="#B5CFE4"
                      d="M81.486 130.178l-17.8-5.467s-2.06-.8-1.4-2.7c.1-.4.3-.6.9-1 4.4-3.2 81.8-31.1 81.8-31.1s1.7-.7 2.8-.4 1.8.4 2.1 1.2c.1.3.2.7.2 1.1v.6c-.1 1.4-.5 5.3-.9 9.5-1.4 14.5-3.1 32.3-4.2 41.8-.1.8-.4 1.5-.8 2.1-.4.6-1 1-1.7 1.2-.7.2-1.4.1-2.1-.1-1.8-.5-9.2-3.8-16.9-7.3-3.8-1.7-8.1-3.7-10.3-4.8-.3-.2-.6-.4-.9-.6-.5-.4-.9-.9-1.1-1.5-.1-.5 0-1.1.3-1.6.7-1.1 8.5-8.1 17.3-16.5.6-.6 1-1.3.9-2.1s-.6-1.5-1.3-1.9c-.7-.4-1.5-.5-2.3-.2-2.1.8-15.2 9.7-27.9 18.4-1.7 1.2-3.5 2.1-5.4 2.7-2 .6-4.1.8-6.1.5z"
                    />
                  </svg>
                  <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                    Sign up with Telegram
                  </span>
                </button>

                <!-- Hidden Telegram widget (only loaded on registered domains) -->
                <div v-if="isRegisteredDomain" id="telegram-login-widget" class="telegram-widget-hidden"></div>
              </div>
            </div>
          </div>
        </form>

        <!-- Footer Link -->
        <div class="mt-6 sm:mt-8 text-center">
          <p class="text-xs sm:text-sm text-slate-600">
            Already have an account?
            <RouterLink
              to="/signin"
              class="font-semibold text-[#1e90ff] hover:text-[#1873cc] transition-colors"
            >
              Sign in here
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-vue-next'
import LogoSvg from '@/assets/logo.png'
import { useAuthStore } from '../stores/auth'
import { googleTokenLogin } from 'vue3-google-login'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isGoogleLoading = ref(false)

// Check if running on a registered domain (not localhost)
const isRegisteredDomain = computed(() => {
  const hostname = window.location.hostname
  // Add your registered domains here
  const registeredDomains = ['goevent.com', 'www.goevent.com', 'goevent.online', 'www.goevent.online']
  return registeredDomains.includes(hostname)
})

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
})

const showPassword = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string[]>>({})
const successMessage = ref('')

const passwordStrength = computed(() => {
  const password = form.value.password
  let strength = 0

  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++

  return strength
})

const passwordStrengthText = computed(() => {
  const texts = ['Weak', 'Fair', 'Good', 'Strong']
  return texts[passwordStrength.value - 1] || 'Too weak'
})

const passwordsMatch = computed(() => {
  return form.value.password === form.value.confirmPassword
})

const handleSignUp = async () => {
  // Clear previous errors
  errorMessage.value = ''
  fieldErrors.value = {}
  successMessage.value = ''

  // Basic validation
  if (!form.value.firstName || !form.value.lastName || !form.value.email || !form.value.password) {
    errorMessage.value = 'Please fill in all required fields'
    return
  }

  if (!passwordsMatch.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  if (!form.value.agreeTerms) {
    errorMessage.value = 'Please agree to the Terms of Service and Privacy Policy'
    return
  }

  try {
    const result = await authStore.register({
      email: form.value.email,
      username: form.value.email, // Use email as username
      password: form.value.password,
      password_confirm: form.value.confirmPassword,
      first_name: form.value.firstName,
      last_name: form.value.lastName,
    })

    if (result.success) {
      if (result.message) {
        successMessage.value = result.message
        // If registration successful but not auto-logged in
        setTimeout(() => {
          router.push('/signin')
        }, 2000)
      } else {
        // Auto-logged in, redirect to home
        router.push('/events')
      }
    } else {
      errorMessage.value = result.error || 'Registration failed'
      fieldErrors.value = result.errors || {}
    }
  } catch (error) {
    console.error('Sign up error:', error)
    errorMessage.value = 'An unexpected error occurred'
  }
}

const handleRedirectAfterLogin = () => {
  const redirectPath = route.query.redirect as string
  if (redirectPath) {
    router.replace(redirectPath)
  } else {
    router.push('/events')
  }
}

const handleGoogleSignUp = async () => {
  isGoogleLoading.value = true
  errorMessage.value = ''

  try {
    const response = await googleTokenLogin()

    if (response.access_token) {
      const result = await authStore.googleLogin(response.access_token)

      if (result.success) {
        handleRedirectAfterLogin()
      } else {
        errorMessage.value = result.error || 'Google sign-up failed'
        console.error('Backend error:', result)
      }
    }
  } catch (error: any) {
    console.error('Google sign-up error:', error)
    if (error.message && error.message.includes('popup_closed_by_user')) {
      errorMessage.value = 'Google sign-up was cancelled'
    } else {
      errorMessage.value = 'Google sign-up failed. Please try again.'
    }
  } finally {
    isGoogleLoading.value = false
  }
}

const handleTelegramLoginClick = () => {
  if (!isRegisteredDomain.value) {
    errorMessage.value =
      'Telegram login is only available on the registered domain. Please use email/password signup for local development.'
    return
  }

  // Find and click the Telegram widget iframe button
  const widgetContainer = document.getElementById('telegram-login-widget')
  if (widgetContainer) {
    const iframe = widgetContainer.querySelector('iframe')
    if (iframe) {
      // Trigger click on the iframe (Telegram will handle the popup)
      iframe.click()
    }
  }
}

const handleTelegramAuth = async (user: any) => {
  errorMessage.value = ''

  try {
    const result = await authStore.telegramLogin(user)

    if (result.success) {
      handleRedirectAfterLogin()
    } else {
      errorMessage.value = result.error || 'Telegram sign-up failed'
    }
  } catch (error: any) {
    console.error('Telegram sign-up error:', error)
    errorMessage.value = 'Telegram sign-up failed. Please try again.'
  }
}

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

onMounted(() => {
  nextTick(() => {
    // Only load the real Telegram widget on registered domains
    if (isRegisteredDomain.value) {
      loadTelegramWidget()
    }
  })
})

onUnmounted(() => {
  // Clean up global callback
  delete (window as any).onTelegramAuth
})
</script>

<style scoped>
/* Telegram button container */
.telegram-button-container {
  position: relative;
  width: 100%;
}

/* Hide the Telegram widget completely (positioned off-screen for accessibility) */
.telegram-widget-hidden {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
</style>
