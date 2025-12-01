<template>
  <div class="relative min-h-screen">
    <!-- Clean Minimal Gradient Background (matching MainLayout) -->
    <div class="fixed inset-0 -z-10 premium-bg"></div>

    <!-- Main Content -->
    <main class="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div class="w-full max-w-md">
        <!-- Logo and Header -->
        <div class="text-center mb-8">
          <RouterLink to="/" class="inline-block mb-6">
            <img
              :src="LogoSvg"
              alt="GoEvent Logo"
              class="h-24 w-auto max-w-full object-contain sm:h-32 mx-auto"
            />
          </RouterLink>
          <p class="text-sm sm:text-base text-slate-500">
            Sign in to continue
          </p>
        </div>

        <!-- Main Form Card -->
        <div class="glass-card rounded-2xl p-6 sm:p-8">
          <!-- Error Message -->
          <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
            <div class="flex items-center">
              <AlertCircle class="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <span class="text-red-700 text-sm">{{ errorMessage }}</span>
            </div>
          </div>

          <!-- Social Login Buttons -->
          <div class="space-y-3">
            <!-- Google Login Button -->
            <button
              v-if="shouldShowGoogleLogin"
              type="button"
              @click="handleGoogleLogin"
              :disabled="isGoogleLoading"
              class="w-full flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all duration-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2ecc71]/20 focus:border-[#2ecc71] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Loader2 v-if="isGoogleLoading" class="animate-spin h-5 w-5 mr-3 text-slate-400" />
              <svg v-else class="h-5 w-5 mr-3" viewBox="0 0 24 24">
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
              <span class="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                {{ isGoogleLoading ? 'Signing in...' : 'Continue with Google' }}
              </span>
            </button>

            <!-- Telegram Login Widget -->
            <div v-if="isRegisteredDomain" id="telegram-login-widget" class="flex justify-center"></div>
            <div v-else class="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p class="text-sm text-amber-700 text-center">
                Telegram login is only available on registered domains
              </p>
            </div>
          </div>

          <!-- Divider -->
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-slate-400 font-medium">or</span>
            </div>
          </div>

          <!-- Collapsible Legacy Sign In Section -->
          <div class="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              @click="showLegacySignIn = !showLegacySignIn"
              class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span class="text-sm font-medium text-slate-600">Sign in with email</span>
              <ChevronDown
                :class="['w-5 h-5 text-slate-400 transition-transform duration-200', showLegacySignIn ? 'rotate-180' : '']"
              />
            </button>

            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-[500px]"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 max-h-[500px]"
              leave-to-class="opacity-0 max-h-0"
            >
              <div v-show="showLegacySignIn" class="overflow-hidden">
                <div class="p-4 bg-white border-t border-slate-100">
                  <form class="space-y-4" @submit.prevent="handleSignIn">
                    <!-- Email Field -->
                    <div class="space-y-1.5">
                      <label for="email" class="block text-sm font-medium text-slate-700">
                        Email address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autocomplete="email"
                        required
                        v-model="form.email"
                        :class="[
                          'w-full px-4 py-3 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors',
                          (!emailValidation.isValid && form.email.length > 0) || fieldErrors.email
                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                            : 'border-slate-200 focus:ring-[#2ecc71]/20 focus:border-[#2ecc71]',
                        ]"
                        placeholder="you@example.com"
                      />
                      <div
                        v-if="(!emailValidation.isValid && form.email.length > 0) || fieldErrors.email"
                      >
                        <p
                          v-for="error in fieldErrors.email || emailValidation.errors"
                          :key="error"
                          class="text-xs text-red-600 mt-1"
                        >
                          {{ error }}
                        </p>
                      </div>
                    </div>

                    <!-- Password Field -->
                    <div class="space-y-1.5">
                      <label for="password" class="block text-sm font-medium text-slate-700">
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
                            'w-full px-4 py-3 pr-12 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors',
                            (!passwordValidation.isValid && form.password.length > 0) || fieldErrors.password
                              ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                              : 'border-slate-200 focus:ring-[#2ecc71]/20 focus:border-[#2ecc71]',
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
                      <div
                        v-if="(!passwordValidation.isValid && form.password.length > 0) || fieldErrors.password"
                      >
                        <p
                          v-for="error in fieldErrors.password || passwordValidation.errors"
                          :key="error"
                          class="text-xs text-red-600 mt-1"
                        >
                          {{ error }}
                        </p>
                      </div>
                    </div>

                    <!-- Remember Me -->
                    <div class="flex items-center">
                      <label class="flex items-center space-x-2 cursor-pointer group">
                        <input
                          id="remember-me"
                          name="remember-me"
                          type="checkbox"
                          v-model="form.rememberMe"
                          class="w-4 h-4 text-[#2ecc71] border-slate-300 rounded focus:ring-[#2ecc71] focus:ring-offset-0"
                        />
                        <span class="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Remember me</span>
                      </label>
                    </div>

                    <!-- Sign In Button -->
                    <button
                      type="submit"
                      :disabled="authStore.isLoading || isSubmitting || !isFormValid"
                      class="w-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#2ecc71]/25 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#2ecc71]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                      <div class="flex items-center justify-center">
                        <Loader2
                          v-if="authStore.isLoading || isSubmitting"
                          class="animate-spin -ml-1 mr-2 h-5 w-5"
                        />
                        {{ authStore.isLoading || isSubmitting ? 'Signing in...' : 'Sign in' }}
                      </div>
                    </button>
                  </form>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Footer Link -->
        <p class="text-center text-sm text-slate-500 mt-6">
          By signing in, you agree to our
          <a href="/terms" class="text-[#2ecc71] hover:text-[#27ae60] font-medium">Terms of Service</a>
          and
          <a href="/privacy" class="text-[#2ecc71] hover:text-[#27ae60] font-medium">Privacy Policy</a>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { Eye, EyeOff, Loader2, AlertCircle, ChevronDown } from 'lucide-vue-next'
import LogoSvg from '@/assets/logo.png'
import { useAuthStore } from '../stores/auth'
import { googleTokenLogin } from 'vue3-google-login'
import { inputValidator, validationRules } from '../utils/inputValidation'
import { isNormalBrowser } from '../utils/browserDetection'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: '',
  rememberMe: false,
})

const showPassword = ref(false)
const showLegacySignIn = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string[]>>({})
const isGoogleLoading = ref(false)
const isSubmitting = ref(false)

// Browser detection - only show Google login in normal browsers
const shouldShowGoogleLogin = computed(() => isNormalBrowser())

// Check if running on a registered domain (not localhost)
const isRegisteredDomain = computed(() => {
  const hostname = window.location.hostname
  const registeredDomains = ['goevent.com', 'www.goevent.com', 'goevent.online', 'www.goevent.online']
  return registeredDomains.includes(hostname)
})

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
    router.replace(redirectPath)
  } else {
    router.push('/events')
  }
}

const handleSignIn = async () => {
  if (isSubmitting.value) return

  errorMessage.value = ''
  fieldErrors.value = {}

  const clientId = navigator.userAgent + window.location.hostname
  if (inputValidator.isRateLimited(`signin_${clientId}`, 5, 15 * 60 * 1000)) {
    errorMessage.value = 'Too many login attempts. Please try again in 15 minutes.'
    return
  }

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
      inputValidator.clearRateLimit(`signin_${clientId}`)
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

  ;(window as any).onTelegramAuth = handleTelegramAuth

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
    if (isRegisteredDomain.value) {
      loadTelegramWidget()
    }
  })
})

onUnmounted(() => {
  delete (window as any).onTelegramAuth
})
</script>

<style scoped>
/* Premium minimal gradient background (matching MainLayout) */
.premium-bg {
  background: linear-gradient(
    135deg,
    #f8fffe 0%,
    #f0fdf9 25%,
    #f5fbff 50%,
    #f0f9ff 75%,
    #f8fffe 100%
  );
}

/* Glass card effect */
.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 8px 32px rgba(46, 204, 113, 0.08),
    0 4px 12px rgba(30, 144, 255, 0.05);
}
</style>
