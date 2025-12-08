import { ref, computed } from 'vue'
import { authService } from '@/services/auth'
import { inputValidator, validationRules } from '@/utils/inputValidation'

export interface PasswordFormData {
  old_password: string
  new_password: string
  new_password_confirm: string
}

export interface PasswordVisibility {
  current: boolean
  new: boolean
  confirm: boolean
}

export interface PasswordStrengthResult {
  score: number
  feedback: string[]
}

export function usePasswordChange() {
  // Form state
  const passwordForm = ref<PasswordFormData>({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  })

  // UI state
  const passwordSuccessMessage = ref('')
  const passwordErrorMessage = ref('')
  const fieldErrors = ref<Record<string, string[]>>({})
  const isSubmitting = ref(false)

  // Password visibility toggles
  const showPasswords = ref<PasswordVisibility>({
    current: false,
    new: false,
    confirm: false,
  })

  // Computed: Password strength data
  const passwordStrengthData = computed<PasswordStrengthResult>(() => {
    const password = passwordForm.value.new_password
    if (!password) return { score: 0, feedback: [] }
    return inputValidator.calculatePasswordStrength(password)
  })

  // Computed: Password strength score (0-4)
  const passwordStrength = computed(() => passwordStrengthData.value.score)

  // Computed: Password strength text label
  const passwordStrengthText = computed(() => {
    const texts = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
    return texts[passwordStrength.value] || 'Very Weak'
  })

  // Computed: Password strength color class
  const passwordStrengthColor = computed(() => {
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
    return colors[passwordStrength.value] || 'bg-gray-200'
  })

  // Computed: Check if passwords match
  const passwordsMatch = computed(() => {
    return passwordForm.value.new_password === passwordForm.value.new_password_confirm
  })

  // Computed: Check if password is strong enough (minimum score of 3)
  const isPasswordStrongEnough = computed(() => {
    return passwordStrength.value >= 3
  })

  // Computed: Check if form can be submitted
  const canSubmit = computed(() => {
    return (
      passwordForm.value.old_password &&
      passwordForm.value.new_password &&
      passwordForm.value.new_password_confirm &&
      passwordsMatch.value &&
      isPasswordStrongEnough.value &&
      !isSubmitting.value
    )
  })

  /**
   * Toggle password visibility for a specific field
   */
  const togglePasswordVisibility = (field: keyof PasswordVisibility) => {
    showPasswords.value[field] = !showPasswords.value[field]
  }

  /**
   * Reset the password form to initial state
   */
  const resetForm = () => {
    passwordForm.value = {
      old_password: '',
      new_password: '',
      new_password_confirm: '',
    }
    fieldErrors.value = {}
    passwordSuccessMessage.value = ''
    passwordErrorMessage.value = ''
    showPasswords.value = {
      current: false,
      new: false,
      confirm: false,
    }
  }

  /**
   * Clear messages
   */
  const clearMessages = () => {
    passwordSuccessMessage.value = ''
    passwordErrorMessage.value = ''
  }

  /**
   * Handle password change form submission
   */
  const handlePasswordChange = async () => {
    passwordSuccessMessage.value = ''
    passwordErrorMessage.value = ''
    fieldErrors.value = {}

    // Rate limiting
    const clientId = navigator.userAgent + window.location.hostname
    if (inputValidator.isRateLimited(`password_change_${clientId}`, 3, 60 * 60 * 1000)) {
      passwordErrorMessage.value = 'Too many password change attempts. Please try again in 1 hour.'
      return { success: false, error: passwordErrorMessage.value }
    }

    // Validation
    const validation = inputValidator.validateForm(passwordForm.value, {
      old_password: { required: true, sanitize: false },
      new_password: { ...validationRules.newPassword, required: true },
      new_password_confirm: { required: true, sanitize: false },
    })

    // Additional validations
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
          'Password must be at least "Good" strength (score 3/5)',
          ...passwordStrengthData.value.feedback,
        ]
        validation.isValid = false
      }
    }

    if (!validation.isValid) {
      fieldErrors.value = validation.errors
      passwordErrorMessage.value = 'Please fix the validation errors below'
      return { success: false, error: passwordErrorMessage.value, fieldErrors: validation.errors }
    }

    try {
      isSubmitting.value = true

      const response = await authService.changePassword({
        old_password: validation.sanitizedData.old_password,
        new_password: validation.sanitizedData.new_password,
        new_password_confirm: validation.sanitizedData.new_password_confirm,
      })

      if (response.success) {
        inputValidator.clearRateLimit(`password_change_${clientId}`)

        passwordSuccessMessage.value = 'Password changed successfully!'
        fieldErrors.value = {}
        passwordForm.value = {
          old_password: '',
          new_password: '',
          new_password_confirm: '',
        }

        setTimeout(() => {
          passwordSuccessMessage.value = ''
        }, 5000)

        return { success: true }
      } else {
        passwordErrorMessage.value = response.message || 'Failed to change password'
        return { success: false, error: passwordErrorMessage.value }
      }
    } catch (error) {
      console.error('Password change error:', error)
      passwordErrorMessage.value = 'An unexpected error occurred'
      return { success: false, error: passwordErrorMessage.value }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
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
    passwordsMatch,
    isPasswordStrongEnough,
    canSubmit,

    // Methods
    togglePasswordVisibility,
    handlePasswordChange,
    resetForm,
    clearMessages,
  }
}
