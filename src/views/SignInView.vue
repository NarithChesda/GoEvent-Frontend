<template>
  <div
    class="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative overflow-hidden"
  >
    <!-- Background Elements -->
    <div class="absolute inset-0">
      <div
        class="absolute top-0 left-0 w-96 h-96 bg-[#5eb3f6]/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
      ></div>
      <div
        class="absolute bottom-0 right-0 w-80 h-80 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"
      ></div>
    </div>

    <div class="relative z-10 w-full max-w-md">
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
          Welcome back
        </h2>
        <p class="text-sm sm:text-base lg:text-lg text-slate-600">
          Sign in to continue to your account
        </p>
      </div>

      <!-- Main Form Card -->
      <div
        class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8"
      >
        <form class="space-y-4 sm:space-y-6" @submit.prevent="handleSignIn">
          <!-- Email Field -->
          <div class="space-y-2">
            <label for="email" class="block text-sm font-semibold text-slate-700">
              Email address
            </label>
            <div class="relative">
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                v-model="form.email"
                :class="[
                  'w-full px-4 py-3 border rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-900 font-medium',
                  (!emailValidation.isValid && form.email.length > 0) || fieldErrors.email
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-200 focus:ring-[#1e90ff]',
                ]"
                placeholder="Enter your email"
              />
            </div>
            <!-- Email validation errors -->
            <div
              v-if="(!emailValidation.isValid && form.email.length > 0) || fieldErrors.email"
              class="mt-1"
            >
              <p
                v-for="error in fieldErrors.email || emailValidation.errors"
                :key="error"
                class="text-sm text-red-600"
              >
                {{ error }}
              </p>
            </div>
          </div>

          <!-- Password Field -->
          <div class="space-y-2">
            <label for="password" class="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                v-model="form.password"
                :class="[
                  'w-full px-4 py-3 border rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent bg-white/50 backdrop-blur-sm text-slate-900 font-medium pr-12',
                  (!passwordValidation.isValid && form.password.length > 0) || fieldErrors.password
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-slate-200 focus:ring-[#1e90ff]',
                ]"
                placeholder="Enter your password"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Eye v-if="!showPassword" class="h-5 w-5" />
                <EyeOff v-else class="h-5 w-5" />
              </button>
            </div>
            <!-- Password validation errors -->
            <div
              v-if="
                (!passwordValidation.isValid && form.password.length > 0) || fieldErrors.password
              "
              class="mt-1"
            >
              <p
                v-for="error in fieldErrors.password || passwordValidation.errors"
                :key="error"
                class="text-sm text-red-600"
              >
                {{ error }}
              </p>
            </div>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <label class="flex items-center space-x-3 cursor-pointer">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                v-model="form.rememberMe"
                class="w-4 h-4 text-[#1e90ff] border-slate-300 rounded focus:ring-[#1e90ff] focus:ring-2"
              />
              <span class="text-sm font-medium text-slate-700">Remember me</span>
            </label>

            <a
              href="#"
              class="text-sm font-semibold text-[#1e90ff] hover:text-[#1873cc] transition-colors"
            >
              Forgot password?
            </a>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div class="flex items-center">
              <AlertCircle class="h-5 w-5 text-red-600 mr-2" />
              <span class="text-red-700 text-sm">{{ errorMessage }}</span>
            </div>
          </div>

          <!-- Sign In Button -->
          <button
            type="submit"
            :disabled="authStore.isLoading || isSubmitting || !isFormValid"
            class="w-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          >
            <div class="flex items-center justify-center">
              <Loader2
                v-if="authStore.isLoading || isSubmitting"
                class="animate-spin -ml-1 mr-3 h-5 w-5"
              />
              {{
                authStore.isLoading || isSubmitting ? 'Signing in...' : 'Sign in to your account'
              }}
            </div>
          </button>

          <!-- Divider -->
          <div class="relative my-6 sm:my-8">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white/80 text-slate-500 font-medium">Or continue with</span>
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
              class="w-full flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1e90ff] group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
              <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900">{{
                isGoogleLoading ? 'Signing in...' : 'Sign in with Google'
              }}</span>
            </button>

            <!-- Telegram Login Widget -->
            <div id="telegram-login-widget" class="flex justify-center"></div>
          </div>
        </form>

        <!-- Footer Link -->
        <div class="mt-6 sm:mt-8 text-center">
          <p class="text-xs sm:text-sm text-slate-600">
            Don't have an account?
            <RouterLink
              to="/signup"
              class="font-semibold text-[#1e90ff] hover:text-[#1873cc] transition-colors"
            >
              Create one now
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
import { inputValidator, validationRules } from '../utils/inputValidation'
import { isNormalBrowser, getBrowserType } from '../utils/browserDetection'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: '',
  rememberMe: false,
})

const showPassword = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string[]>>({})
const isGoogleLoading = ref(false)
const isSubmitting = ref(false)

// Browser detection - only show Google login in normal browsers
const shouldShowGoogleLogin = computed(() => isNormalBrowser())

// Real-time validation
const emailValidation = computed(() => {
  if (!form.value.email) return { isValid: true, errors: [] }
  return inputValidator.validateEmail(form.value.email)
})

const passwordValidation = computed(() => {
  if (!form.value.password) return { isValid: true, errors: [] }
  return inputValidator.validatePassword(form.value.password)
})

// Check if form is valid
const isFormValid = computed(() => {
  return (
    emailValidation.value.isValid &&
    passwordValidation.value.isValid &&
    form.value.email.length > 0 &&
    form.value.password.length > 0
  )
})

// Helper function to handle redirect after login
const handleRedirectAfterLogin = () => {
  const redirectPath = route.query.redirect as string
  if (redirectPath) {
    // Use replace to avoid login page in history
    router.replace(redirectPath)
  } else {
    router.push('/events')
  }
}

const handleSignIn = async () => {
  // Prevent double submission
  if (isSubmitting.value) return

  // Clear previous errors
  errorMessage.value = ''
  fieldErrors.value = {}

  // Check rate limiting
  const clientId = navigator.userAgent + window.location.hostname
  if (inputValidator.isRateLimited(`signin_${clientId}`, 5, 15 * 60 * 1000)) {
    errorMessage.value = 'Too many login attempts. Please try again in 15 minutes.'
    return
  }

  // Comprehensive validation
  const validation = inputValidator.validateForm(form.value, {
    email: validationRules.email,
    password: validationRules.password,
  })

  if (!validation.isValid) {
    fieldErrors.value = validation.errors
    errorMessage.value = 'Please fix the errors below'
    return
  }

  isSubmitting.value = true

  try {
    const result = await authStore.login({
      email: validation.sanitizedData.email,
      password: validation.sanitizedData.password,
    })

    if (result.success) {
      // Clear rate limiting on successful login
      inputValidator.clearRateLimit(`signin_${clientId}`)
      // Redirect after successful sign in
      handleRedirectAfterLogin()
    } else {
      errorMessage.value = result.error || 'Login failed'
    }
  } catch (error) {
    console.error('Sign in error:', error)
    errorMessage.value = 'An unexpected error occurred'
  } finally {
    isSubmitting.value = false
  }
}

const handleGoogleLogin = async () => {
  isGoogleLoading.value = true
  errorMessage.value = ''

  try {
    const response = await googleTokenLogin()

    if (response.access_token) {
      const result = await authStore.googleLogin(response.access_token)

      if (result.success) {
        handleRedirectAfterLogin()
      } else {
        errorMessage.value = result.error || 'Google login failed'
        console.error('Backend error:', result)
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
      handleRedirectAfterLogin()
    } else {
      errorMessage.value = result.error || 'Telegram login failed'
    }
  } catch (error: any) {
    console.error('Telegram login error:', error)
    errorMessage.value = 'Telegram sign-in failed. Please try again.'
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
    loadTelegramWidget()
  })
})

onUnmounted(() => {
  // Clean up global callback
  delete (window as any).onTelegramAuth
})
</script>
