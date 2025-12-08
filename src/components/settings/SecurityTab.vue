<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-900 mb-2">Change Password</h2>
    <p class="text-sm text-gray-500 mb-8">Update your password to keep your account secure.</p>

    <form @submit.prevent="handlePasswordChange" class="space-y-6 max-w-2xl">
      <!-- Current Password -->
      <div>
        <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-2">
          Current Password
        </label>
        <div class="relative">
          <input
            id="currentPassword"
            v-model="passwordForm.old_password"
            :type="showPasswords.current ? 'text' : 'password'"
            :class="[
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent pr-12',
              fieldErrors.old_password
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500',
            ]"
            placeholder="Enter your current password"
          />
          <button
            type="button"
            @click="togglePasswordVisibility('current')"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg v-if="!showPasswords.current" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </button>
        </div>
        <div v-if="fieldErrors.old_password" class="mt-1">
          <p v-for="error in fieldErrors.old_password" :key="error" class="text-sm text-red-600">
            {{ error }}
          </p>
        </div>
      </div>

      <!-- New Password -->
      <div>
        <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
          New Password
        </label>
        <div class="relative">
          <input
            id="newPassword"
            v-model="passwordForm.new_password"
            :type="showPasswords.new ? 'text' : 'password'"
            :class="[
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent pr-12',
              fieldErrors.new_password
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500',
            ]"
            placeholder="Enter your new password"
          />
          <button
            type="button"
            @click="togglePasswordVisibility('new')"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg v-if="!showPasswords.new" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </button>
        </div>
        <div v-if="fieldErrors.new_password" class="mt-1">
          <p v-for="error in fieldErrors.new_password" :key="error" class="text-sm text-red-600">
            {{ error }}
          </p>
        </div>
      </div>

      <!-- Confirm New Password -->
      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
          Confirm New Password
        </label>
        <div class="relative">
          <input
            id="confirmPassword"
            v-model="passwordForm.new_password_confirm"
            :type="showPasswords.confirm ? 'text' : 'password'"
            :class="[
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent pr-12',
              fieldErrors.new_password_confirm
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500',
            ]"
            placeholder="Confirm your new password"
          />
          <button
            type="button"
            @click="togglePasswordVisibility('confirm')"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg v-if="!showPasswords.confirm" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </button>
        </div>
        <div v-if="fieldErrors.new_password_confirm" class="mt-1">
          <p v-for="error in fieldErrors.new_password_confirm" :key="error" class="text-sm text-red-600">
            {{ error }}
          </p>
        </div>
      </div>

      <!-- Password Strength Indicator -->
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
          <span class="font-medium" :class="passwordStrength >= 3 ? 'text-green-600' : 'text-orange-600'">
            {{ passwordStrengthText }}
          </span>
          <span v-if="passwordStrength >= 3" class="text-green-600 text-xs">Strong enough</span>
          <span v-else class="text-orange-600 text-xs">Too weak</span>
        </div>

        <!-- Password Requirements Feedback -->
        <div v-if="passwordStrengthData.feedback.length > 0" class="text-xs space-y-1">
          <p class="font-medium text-gray-600">Requirements:</p>
          <ul class="list-disc list-inside space-y-1 text-gray-500">
            <li v-for="tip in passwordStrengthData.feedback" :key="tip">{{ tip }}</li>
          </ul>
        </div>

        <!-- Minimum strength warning -->
        <div v-if="passwordForm.new_password && !isPasswordStrongEnough" class="p-2 bg-orange-50 border border-orange-200 rounded-lg">
          <p class="text-sm text-orange-800">
            <strong>Security Notice:</strong> Password must be at least "Good" strength (3/5) for account security.
          </p>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="passwordSuccessMessage" class="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2">
        <div class="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="font-medium">{{ passwordSuccessMessage }}</span>
      </div>

      <div v-if="passwordErrorMessage" class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
        <div class="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <span class="font-medium">{{ passwordErrorMessage }}</span>
      </div>

      <!-- Change Password Button -->
      <div class="flex justify-start pt-4">
        <button
          type="submit"
          :disabled="!canSubmit"
          class="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          {{ isSubmitting ? 'Changing Password...' : 'Change Password' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { usePasswordChange } from '@/composables/settings/usePasswordChange'

const {
  // State
  passwordForm,
  passwordSuccessMessage,
  passwordErrorMessage,
  fieldErrors,
  showPasswords,
  isSubmitting,

  // Computed
  passwordStrengthData,
  passwordStrength,
  passwordStrengthText,
  passwordStrengthColor,
  isPasswordStrongEnough,
  canSubmit,

  // Methods
  togglePasswordVisibility,
  handlePasswordChange,
} = usePasswordChange()
</script>
