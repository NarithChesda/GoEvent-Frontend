<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 pb-20 lg:pb-0">
      <!-- Security Settings Content -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <h2 class="text-2xl font-bold text-slate-900 mb-6">Security Settings</h2>

          <form @submit.prevent="handlePasswordChange" class="space-y-6">
            <!-- Current Password -->
            <div>
              <label
                for="currentPassword"
                class="block text-sm font-semibold text-slate-700 mb-2"
              >
                Current Password
              </label>
              <div class="relative">
                <input
                  id="currentPassword"
                  v-model="passwordForm.old_password"
                  :type="showPasswords.current ? 'text' : 'password'"
                  :class="[
                    'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent pr-12',
                    fieldErrors.old_password
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-slate-200 focus:ring-[#1e90ff]',
                  ]"
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  @click="showPasswords.current = !showPasswords.current"
                  class="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <Eye v-if="!showPasswords.current" class="w-5 h-5" />
                  <EyeOff v-else class="w-5 h-5" />
                </button>
              </div>
              <!-- Current password validation errors -->
              <div v-if="fieldErrors.old_password" class="mt-1">
                <p
                  v-for="error in fieldErrors.old_password"
                  :key="error"
                  class="text-sm text-red-600"
                >
                  {{ error }}
                </p>
              </div>
            </div>

            <!-- New Password -->
            <div>
              <label for="newPassword" class="block text-sm font-semibold text-slate-700 mb-2">
                New Password
              </label>
              <div class="relative">
                <input
                  id="newPassword"
                  v-model="passwordForm.new_password"
                  :type="showPasswords.new ? 'text' : 'password'"
                  :class="[
                    'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent pr-12',
                    fieldErrors.new_password
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-slate-200 focus:ring-[#1e90ff]',
                  ]"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  @click="showPasswords.new = !showPasswords.new"
                  class="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <Eye v-if="!showPasswords.new" class="w-5 h-5" />
                  <EyeOff v-else class="w-5 h-5" />
                </button>
              </div>
              <!-- New password validation errors -->
              <div v-if="fieldErrors.new_password" class="mt-1">
                <p
                  v-for="error in fieldErrors.new_password"
                  :key="error"
                  class="text-sm text-red-600"
                >
                  {{ error }}
                </p>
              </div>
            </div>

            <!-- Confirm New Password -->
            <div>
              <label
                for="confirmPassword"
                class="block text-sm font-semibold text-slate-700 mb-2"
              >
                Confirm New Password
              </label>
              <div class="relative">
                <input
                  id="confirmPassword"
                  v-model="passwordForm.new_password_confirm"
                  :type="showPasswords.confirm ? 'text' : 'password'"
                  :class="[
                    'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent pr-12',
                    fieldErrors.new_password_confirm
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-slate-200 focus:ring-[#1e90ff]',
                  ]"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  @click="showPasswords.confirm = !showPasswords.confirm"
                  class="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <Eye v-if="!showPasswords.confirm" class="w-5 h-5" />
                  <EyeOff v-else class="w-5 h-5" />
                </button>
              </div>
              <!-- Confirm password validation errors -->
              <div v-if="fieldErrors.new_password_confirm" class="mt-1">
                <p
                  v-for="error in fieldErrors.new_password_confirm"
                  :key="error"
                  class="text-sm text-red-600"
                >
                  {{ error }}
                </p>
              </div>
            </div>

            <!-- Enhanced Password Strength Indicator -->
            <div v-if="passwordForm.new_password" class="space-y-3">
              <div class="flex items-center space-x-2 text-sm">
                <div class="flex space-x-1">
                  <div
                    v-for="i in 5"
                    :key="i"
                    class="w-3 h-3 rounded-full transition-colors duration-300"
                    :class="passwordStrength >= i ? passwordStrengthColor : 'bg-gray-200'"
                  ></div>
                </div>
                <span
                  class="font-medium"
                  :class="passwordStrength >= 3 ? 'text-green-600' : 'text-orange-600'"
                >
                  {{ passwordStrengthText }}
                </span>
                <span v-if="passwordStrength >= 3" class="text-green-600 text-xs"
                  >✓ Strong enough</span
                >
                <span v-else class="text-orange-600 text-xs">⚠ Too weak</span>
              </div>

              <!-- Password Requirements Feedback -->
              <div v-if="passwordStrengthData.feedback.length > 0" class="text-xs space-y-1">
                <p class="font-medium text-slate-600">Requirements:</p>
                <ul class="list-disc list-inside space-y-1 text-slate-500">
                  <li v-for="tip in passwordStrengthData.feedback" :key="tip">{{ tip }}</li>
                </ul>
              </div>

              <!-- Minimum strength warning -->
              <div
                v-if="passwordForm.new_password && !isPasswordStrongEnough"
                class="p-2 bg-orange-50 border border-orange-200 rounded-lg"
              >
                <p class="text-sm text-orange-800">
                  <strong>Security Notice:</strong> Password must be at least "Good" strength
                  (3/4) for account security.
                </p>
              </div>
            </div>

            <!-- Success/Error Messages -->
            <div
              v-if="passwordSuccessMessage"
              class="p-4 bg-green-50 border border-green-200 rounded-xl"
            >
              <div class="flex items-center">
                <CheckCircle class="h-5 w-5 text-green-600 mr-2" />
                <span class="text-green-700 text-sm">{{ passwordSuccessMessage }}</span>
              </div>
            </div>

            <div
              v-if="passwordErrorMessage"
              class="p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <div class="flex items-center">
                <AlertCircle class="h-5 w-5 text-red-600 mr-2" />
                <span class="text-red-700 text-sm">{{ passwordErrorMessage }}</span>
              </div>
            </div>

            <!-- Change Password Button -->
            <div class="flex justify-end">
              <button
                type="submit"
                :disabled="
                  authStore.isLoading ||
                  !passwordsMatch ||
                  !isPasswordStrongEnough ||
                  !passwordForm.old_password
                "
                class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg"
              >
                <div class="flex items-center space-x-2">
                  <Loader2 v-if="authStore.isLoading" class="animate-spin w-5 h-5" />
                  <Key class="w-5 h-5" />
                  <span>{{ authStore.isLoading ? 'Changing...' : 'Change Password' }}</span>
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../components/MainLayout.vue'
import { useAuthStore } from '../stores/auth'
import { authService } from '../services/auth'
import { inputValidator, validationRules } from '../utils/inputValidation'
import {
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

// Password form
const passwordForm = ref({
  old_password: '',
  new_password: '',
  new_password_confirm: '',
})

// UI state
const passwordSuccessMessage = ref('')
const passwordErrorMessage = ref('')
const fieldErrors = ref<Record<string, string[]>>({})

const showPasswords = ref({
  current: false,
  new: false,
  confirm: false,
})

// Enhanced password validation using input validator
const passwordStrengthData = computed(() => {
  const password = passwordForm.value.new_password
  if (!password) return { score: 0, feedback: [] }
  return inputValidator.calculatePasswordStrength(password)
})

const passwordStrength = computed(() => passwordStrengthData.value.score)

const passwordStrengthText = computed(() => {
  const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  return texts[passwordStrength.value] || 'Very Weak'
})

const passwordStrengthColor = computed(() => {
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-[#E6F4FF]0', 'bg-green-500']
  return colors[passwordStrength.value] || 'bg-gray-200'
})

const passwordValidation = computed(() => {
  const form = passwordForm.value
  if (!form.new_password && !form.new_password_confirm) {
    return { isValid: true, errors: {} }
  }

  const validation = inputValidator.validateForm(form, {
    new_password: { ...validationRules.newPassword, required: false },
    new_password_confirm: { ...validationRules.confirmPassword, required: false },
  })

  // Add custom validation for password confirmation
  if (
    form.new_password &&
    form.new_password_confirm &&
    form.new_password !== form.new_password_confirm
  ) {
    validation.errors.new_password_confirm = ['Passwords do not match']
    validation.isValid = false
  }

  return validation
})

const passwordsMatch = computed(() => {
  return passwordForm.value.new_password === passwordForm.value.new_password_confirm
})

// Minimum password strength requirement (increased from 2 to 3)
const isPasswordStrongEnough = computed(() => {
  return passwordStrength.value >= 3
})

// Initialize auth check
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/signin')
    return
  }
})

// Password change handler with enhanced security
const handlePasswordChange = async () => {
  passwordSuccessMessage.value = ''
  passwordErrorMessage.value = ''
  fieldErrors.value = {}

  // Check rate limiting for password changes
  const clientId = navigator.userAgent + window.location.hostname
  if (inputValidator.isRateLimited(`password_change_${clientId}`, 3, 60 * 60 * 1000)) {
    passwordErrorMessage.value = 'Too many password change attempts. Please try again in 1 hour.'
    return
  }

  // Comprehensive validation
  const validation = inputValidator.validateForm(passwordForm.value, {
    old_password: { required: true, sanitize: false },
    new_password: { ...validationRules.newPassword, required: true },
    new_password_confirm: { required: true, sanitize: false },
  })

  // Additional custom validations
  if (passwordForm.value.new_password && passwordForm.value.new_password_confirm) {
    if (passwordForm.value.new_password !== passwordForm.value.new_password_confirm) {
      validation.errors.new_password_confirm = ['Passwords do not match']
      validation.isValid = false
    }

    if (passwordForm.value.old_password === passwordForm.value.new_password) {
      validation.errors.new_password = ['New password must be different from current password']
      validation.isValid = false
    }

    if (!isPasswordStrongEnough.value) {
      validation.errors.new_password = [
        ...(validation.errors.new_password || []),
        'Password must be at least "Good" strength (score 3/4)',
        ...passwordStrengthData.value.feedback,
      ]
      validation.isValid = false
    }
  }

  if (!validation.isValid) {
    fieldErrors.value = validation.errors
    passwordErrorMessage.value = 'Please fix the validation errors below'
    return
  }

  try {
    const response = await authService.changePassword({
      old_password: validation.sanitizedData.old_password,
      new_password: validation.sanitizedData.new_password,
      new_password_confirm: validation.sanitizedData.new_password_confirm,
    })

    if (response.success) {
      // Clear rate limiting on successful password change
      inputValidator.clearRateLimit(`password_change_${clientId}`)

      passwordSuccessMessage.value =
        'Password changed successfully! Please sign in again with your new password.'
      fieldErrors.value = {}
      passwordForm.value = {
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      }

      setTimeout(() => {
        passwordSuccessMessage.value = ''
      }, 5000)
    } else {
      passwordErrorMessage.value = response.message || 'Failed to change password'
    }
  } catch (error) {
    passwordErrorMessage.value = 'An unexpected error occurred'
  }
}
</script>