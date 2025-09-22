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
        <div
          class="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
        >
          <CalendarDays class="w-8 h-8 text-white" />
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
        <p class="text-gray-600">Sign in to leave a comment</p>
      </div>

      <!-- Auth Tabs -->
      <div class="flex mb-6 bg-gray-100/50 rounded-xl p-1">
        <button
          @click="activeTab = 'signin'"
          :class="[
            'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200',
            activeTab === 'signin'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900',
          ]"
        >
          Sign In
        </button>
        <button
          @click="activeTab = 'signup'"
          :class="[
            'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200',
            activeTab === 'signup'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900',
          ]"
        >
          Sign Up
        </button>
      </div>

      <!-- Sign In Form -->
      <form v-if="activeTab === 'signin'" @submit.prevent="handleSignIn" class="space-y-4">
        <!-- Email Field -->
        <div>
          <label for="signin-email" class="block text-sm font-medium text-gray-700 mb-2">
            Email address
          </label>
          <input
            id="signin-email"
            type="email"
            required
            v-model="signInForm.email"
            :class="[
              'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white/50',
              (!emailValidation.isValid && signInForm.email.length > 0) || fieldErrors.email
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-blue-500',
            ]"
            placeholder="Enter your email"
          />
          <div
            v-if="(!emailValidation.isValid && signInForm.email.length > 0) || fieldErrors.email"
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
        <div>
          <label for="signin-password" class="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div class="relative">
            <input
              id="signin-password"
              :type="showPassword ? 'text' : 'password'"
              required
              v-model="signInForm.password"
              :class="[
                'w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white/50',
                (!passwordValidation.isValid && signInForm.password.length > 0) ||
                fieldErrors.password
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-200 focus:ring-blue-500',
              ]"
              placeholder="Enter your password"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              <Eye v-if="!showPassword" class="h-5 w-5" />
              <EyeOff v-else class="h-5 w-5" />
            </button>
          </div>
          <div
            v-if="
              (!passwordValidation.isValid && signInForm.password.length > 0) ||
              fieldErrors.password
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

        <!-- Sign In Button -->
        <button
          type="submit"
          :disabled="isSigningIn || !isSignInFormValid"
          class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <div class="flex items-center justify-center">
            <Loader2 v-if="isSigningIn" class="animate-spin -ml-1 mr-3 h-5 w-5" />
            {{ isSigningIn ? 'Signing in...' : 'Sign In' }}
          </div>
        </button>
      </form>

      <!-- Sign Up Form -->
      <form v-else @submit.prevent="handleSignUp" class="space-y-4">
        <!-- First Name Field -->
        <div>
          <label for="signup-firstname" class="block text-sm font-medium text-gray-700 mb-2">
            First Name
          </label>
          <input
            id="signup-firstname"
            type="text"
            required
            v-model="signUpForm.firstName"
            :class="[
              'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white/50',
              fieldErrors.first_name
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-blue-500',
            ]"
            placeholder="Enter your first name"
          />
          <div v-if="fieldErrors.first_name" class="mt-1">
            <p v-for="error in fieldErrors.first_name" :key="error" class="text-sm text-red-600">
              {{ error }}
            </p>
          </div>
        </div>

        <!-- Last Name Field -->
        <div>
          <label for="signup-lastname" class="block text-sm font-medium text-gray-700 mb-2">
            Last Name
          </label>
          <input
            id="signup-lastname"
            type="text"
            v-model="signUpForm.lastName"
            :class="[
              'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white/50',
              fieldErrors.last_name
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-blue-500',
            ]"
            placeholder="Enter your last name"
          />
          <div v-if="fieldErrors.last_name" class="mt-1">
            <p v-for="error in fieldErrors.last_name" :key="error" class="text-sm text-red-600">
              {{ error }}
            </p>
          </div>
        </div>

        <!-- Email Field -->
        <div>
          <label for="signup-email" class="block text-sm font-medium text-gray-700 mb-2">
            Email address
          </label>
          <input
            id="signup-email"
            type="email"
            required
            v-model="signUpForm.email"
            :class="[
              'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white/50',
              (!signUpEmailValidation.isValid && signUpForm.email.length > 0) || fieldErrors.email
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-blue-500',
            ]"
            placeholder="Enter your email"
          />
          <div
            v-if="
              (!signUpEmailValidation.isValid && signUpForm.email.length > 0) || fieldErrors.email
            "
            class="mt-1"
          >
            <p
              v-for="error in fieldErrors.email || signUpEmailValidation.errors"
              :key="error"
              class="text-sm text-red-600"
            >
              {{ error }}
            </p>
          </div>
        </div>

        <!-- Username Field -->
        <div>
          <label for="signup-username" class="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            id="signup-username"
            type="text"
            required
            v-model="signUpForm.username"
            :class="[
              'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white/50',
              fieldErrors.username
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-blue-500',
            ]"
            placeholder="Choose a username"
          />
          <div v-if="fieldErrors.username" class="mt-1">
            <p v-for="error in fieldErrors.username" :key="error" class="text-sm text-red-600">
              {{ error }}
            </p>
          </div>
        </div>

        <!-- Password Field -->
        <div>
          <label for="signup-password" class="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div class="relative">
            <input
              id="signup-password"
              :type="showSignUpPassword ? 'text' : 'password'"
              required
              v-model="signUpForm.password"
              :class="[
                'w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white/50',
                (!signUpPasswordValidation.isValid && signUpForm.password.length > 0) ||
                fieldErrors.password
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-200 focus:ring-blue-500',
              ]"
              placeholder="Create a password"
            />
            <button
              type="button"
              @click="showSignUpPassword = !showSignUpPassword"
              class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              <Eye v-if="!showSignUpPassword" class="h-5 w-5" />
              <EyeOff v-else class="h-5 w-5" />
            </button>
          </div>
          <div
            v-if="
              (!signUpPasswordValidation.isValid && signUpForm.password.length > 0) ||
              fieldErrors.password
            "
            class="mt-1"
          >
            <p
              v-for="error in fieldErrors.password || signUpPasswordValidation.errors"
              :key="error"
              class="text-sm text-red-600"
            >
              {{ error }}
            </p>
          </div>
        </div>

        <!-- Confirm Password Field -->
        <div>
          <label for="signup-confirm-password" class="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div class="relative">
            <input
              id="signup-confirm-password"
              :type="showConfirmPassword ? 'text' : 'password'"
              required
              v-model="signUpForm.confirmPassword"
              :class="[
                'w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white/50',
                (!passwordsMatch && signUpForm.confirmPassword.length > 0) ||
                fieldErrors.password_confirm
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-200 focus:ring-blue-500',
              ]"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              <Eye v-if="!showConfirmPassword" class="h-5 w-5" />
              <EyeOff v-else class="h-5 w-5" />
            </button>
          </div>
          <div
            v-if="
              (!passwordsMatch && signUpForm.confirmPassword.length > 0) ||
              fieldErrors.password_confirm
            "
            class="mt-1"
          >
            <p
              v-for="error in fieldErrors.password_confirm || ['Passwords do not match']"
              :key="error"
              class="text-sm text-red-600"
            >
              {{ error }}
            </p>
          </div>
        </div>

        <!-- Sign Up Button -->
        <button
          type="submit"
          :disabled="isSigningUp || !isSignUpFormValid"
          class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <div class="flex items-center justify-center">
            <Loader2 v-if="isSigningUp" class="animate-spin -ml-1 mr-3 h-5 w-5" />
            {{ isSigningUp ? 'Creating account...' : 'Create Account' }}
          </div>
        </button>
      </form>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
        <div class="flex items-center">
          <AlertCircle class="h-5 w-5 text-red-600 mr-2" />
          <span class="text-red-700 text-sm">{{ errorMessage }}</span>
        </div>
      </div>

      <!-- Divider -->
      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
        </div>
      </div>

      <!-- Google Login Button -->
      <button
        type="button"
        @click="handleGoogleLogin"
        :disabled="isGoogleLoading"
        class="w-full flex items-center justify-center px-4 py-3 border border-gray-200 rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { CalendarDays, X, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { googleTokenLogin } from 'vue3-google-login'
import { inputValidator, validationRules } from '../utils/inputValidation'

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

// Form state
const activeTab = ref<'signin' | 'signup'>('signin')
const showPassword = ref(false)
const showSignUpPassword = ref(false)
const showConfirmPassword = ref(false)

// Sign In Form
const signInForm = ref({
  email: '',
  password: '',
})

// Sign Up Form
const signUpForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
})

// Loading states
const isSigningIn = ref(false)
const isSigningUp = ref(false)
const isGoogleLoading = ref(false)

// Error handling
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

// Validation for Sign In
const emailValidation = computed(() => {
  if (!signInForm.value.email) return { isValid: true, errors: [] }
  return inputValidator.validateEmail(signInForm.value.email)
})

const passwordValidation = computed(() => {
  if (!signInForm.value.password) return { isValid: true, errors: [] }
  return inputValidator.validatePassword(signInForm.value.password)
})

const isSignInFormValid = computed(() => {
  return (
    emailValidation.value.isValid &&
    passwordValidation.value.isValid &&
    signInForm.value.email.length > 0 &&
    signInForm.value.password.length > 0
  )
})

// Validation for Sign Up
const signUpEmailValidation = computed(() => {
  if (!signUpForm.value.email) return { isValid: true, errors: [] }
  return inputValidator.validateEmail(signUpForm.value.email)
})

const signUpPasswordValidation = computed(() => {
  if (!signUpForm.value.password) return { isValid: true, errors: [] }
  return inputValidator.validatePassword(signUpForm.value.password)
})

const passwordsMatch = computed(() => {
  return signUpForm.value.password === signUpForm.value.confirmPassword
})

const isSignUpFormValid = computed(() => {
  return (
    signUpEmailValidation.value.isValid &&
    signUpPasswordValidation.value.isValid &&
    passwordsMatch.value &&
    signUpForm.value.firstName.length > 0 &&
    signUpForm.value.email.length > 0 &&
    signUpForm.value.username.length > 0 &&
    signUpForm.value.password.length > 0 &&
    signUpForm.value.confirmPassword.length > 0
  )
})

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
  signInForm.value = { email: '', password: '' }
  signUpForm.value = {
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  }
  errorMessage.value = ''
  fieldErrors.value = {}
  showPassword.value = false
  showSignUpPassword.value = false
  showConfirmPassword.value = false
  activeTab.value = 'signin'
}

// Authentication methods
const handleSignIn = async () => {
  if (isSigningIn.value) return

  // Clear previous errors
  errorMessage.value = ''
  fieldErrors.value = {}

  // Comprehensive validation
  const validation = inputValidator.validateForm(signInForm.value, {
    email: validationRules.email,
    password: validationRules.password,
  })

  if (!validation.isValid) {
    fieldErrors.value = validation.errors
    errorMessage.value = 'Please fix the errors below'
    return
  }

  isSigningIn.value = true

  try {
    const result = await authStore.login({
      email: validation.sanitizedData.email,
      password: validation.sanitizedData.password,
    })

    if (result.success) {
      emit('authenticated')
      closeModal()
    } else {
      errorMessage.value = result.error || 'Login failed'
    }
  } catch (error) {
    console.error('Sign in error:', error)
    errorMessage.value = 'An unexpected error occurred'
  } finally {
    isSigningIn.value = false
  }
}

const handleSignUp = async () => {
  if (isSigningUp.value) return

  // Clear previous errors
  errorMessage.value = ''
  fieldErrors.value = {}

  // Comprehensive validation
  const validation = inputValidator.validateForm(signUpForm.value, {
    firstName: { required: true, minLength: 1 },
    lastName: { required: false },
    email: validationRules.email,
    username: { required: true, minLength: 3, pattern: /^[a-zA-Z0-9_-]+$/ },
    password: validationRules.password,
    confirmPassword: { required: true },
  })

  if (!validation.isValid) {
    fieldErrors.value = validation.errors
    errorMessage.value = 'Please fix the errors below'
    return
  }

  if (!passwordsMatch.value) {
    fieldErrors.value = { password_confirm: ['Passwords do not match'] }
    errorMessage.value = 'Please fix the errors below'
    return
  }

  isSigningUp.value = true

  try {
    const result = await authStore.register({
      email: validation.sanitizedData.email,
      username: validation.sanitizedData.username,
      password: validation.sanitizedData.password,
      password_confirm: validation.sanitizedData.confirmPassword,
      first_name: validation.sanitizedData.firstName,
      last_name: validation.sanitizedData.lastName || '',
    })

    if (result.success) {
      emit('authenticated')
      closeModal()
    } else {
      if (result.errors) {
        fieldErrors.value = result.errors
      }
      errorMessage.value = result.error || 'Registration failed'
    }
  } catch (error) {
    console.error('Sign up error:', error)
    errorMessage.value = 'An unexpected error occurred'
  } finally {
    isSigningUp.value = false
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

// Handle modal animation
watch(
  () => props.isVisible,
  (visible) => {
    if (visible) {
      nextTick(() => {
        modalAnimation.value = 'scale-100 opacity-100'
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
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
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
