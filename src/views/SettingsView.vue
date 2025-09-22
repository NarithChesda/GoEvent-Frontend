<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <Navigation />

    <!-- Settings Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Settings Navigation - Sidebar -->
        <div class="w-full lg:w-64 flex-shrink-0">
          <div class="p-4 sticky top-24">
            <!-- Account Settings Title -->
            <div class="mb-6">
              <div class="flex items-center space-x-3">
                <div class="w-3 h-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                <h1 class="text-xl font-bold text-slate-900">Account Settings</h1>
              </div>
            </div>
            
            <nav class="space-y-2">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                :class="[
                  'flex items-center space-x-3 w-full px-4 py-3 text-left rounded-xl transition-all duration-200 font-medium',
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                ]"
              >
                <component :is="tab.icon" class="w-5 h-5" />
                <span>{{ tab.name }}</span>
              </button>
            </nav>
          </div>
        </div>

        <!-- Settings Content - Main Area -->
        <div class="flex-1 min-w-0">
          <!-- Profile Settings -->
          <div v-if="activeTab === 'profile'" class="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
            <h2 class="text-2xl font-bold text-slate-900 mb-6">Profile Information</h2>
            
            <form @submit.prevent="handleProfileUpdate" class="space-y-8">
              <!-- Profile Picture Section -->
              <div class="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                <h3 class="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <div class="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Profile Picture</span>
                </h3>
                
                <div class="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <!-- Current Profile Picture -->
                  <div class="relative group">
                    <div 
                      v-if="profilePicturePreview || authStore.user?.profile_picture"
                      class="w-24 h-24 rounded-2xl overflow-hidden shadow-lg ring-4 ring-white group-hover:ring-blue-200 transition-all duration-300"
                    >
                      <img 
                        :src="profilePicturePreview || (apiService.getProfilePictureUrl(authStore.user?.profile_picture) || '')" 
                        alt="Profile"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div 
                      v-else
                      class="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-white group-hover:ring-blue-200 transition-all duration-300"
                    >
                      {{ authStore.userInitials }}
                    </div>
                    
                    <!-- Upload Overlay -->
                    <div class="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Camera class="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <!-- Upload Controls -->
                  <div class="flex-1">
                    <div class="flex flex-col sm:flex-row gap-3">
                      <input
                        ref="fileInput"
                        type="file"
                        accept="image/*"
                        @change="handleFileSelect"
                        class="hidden"
                      />
                      
                      <button
                        type="button"
                        @click="triggerFileUpload"
                        :disabled="uploadLoading"
                        class="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
                      >
                        <Upload class="w-4 h-4" />
                        <span>{{ uploadLoading ? 'Uploading...' : 'Upload New' }}</span>
                      </button>
                      
                      <button
                        v-if="authStore.user?.profile_picture || profilePicturePreview"
                        type="button"
                        @click="removeProfilePicture"
                        class="inline-flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-all duration-200"
                      >
                        <Trash2 class="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                    
                    <p class="text-sm text-slate-500 mt-2">
                      JPG, PNG, GIF, WebP, or AVIF. Max size 3MB. Recommended: 400x400px. Files are scanned for security.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Basic Information -->
              <div class="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                <h3 class="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <div class="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <span>Basic Information</span>
                </h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- First Name -->
                <div>
                  <label for="firstName" class="block text-sm font-semibold text-slate-700 mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    v-model="profileForm.first_name"
                    type="text"
                    class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your first name"
                  />
                </div>

                <!-- Last Name -->
                <div>
                  <label for="lastName" class="block text-sm font-semibold text-slate-700 mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    v-model="profileForm.last_name"
                    type="text"
                    class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your last name"
                  />
                </div>

                <!-- Email -->
                <div>
                  <label for="email" class="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    v-model="profileForm.email"
                    type="email"
                    class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <!-- Username -->
                <div>
                  <label for="username" class="block text-sm font-semibold text-slate-700 mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    v-model="profileForm.username"
                    type="text"
                    class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your username"
                  />
                </div>
                </div>
              </div>

              <!-- User Status -->
              <div class="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                <h3 class="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <div class="w-2 h-2 bg-yellow-600 rounded-full"></div>
                  <span>Account Status</span>
                </h3>

                <div class="flex flex-wrap gap-3">
                  <!-- Verification Status -->
                  <div class="inline-flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium"
                       :class="authStore.user?.is_verified 
                         ? 'bg-green-100 text-green-800 border border-green-200' 
                         : 'bg-orange-100 text-orange-800 border border-orange-200'">
                    <div :class="authStore.user?.is_verified ? 'bg-green-500' : 'bg-orange-500'" 
                         class="w-2 h-2 rounded-full"></div>
                    <span>{{ authStore.user?.is_verified ? 'Verified Account' : 'Unverified Account' }}</span>
                  </div>
                </div>

                <!-- Account Creation Date -->
                <div class="mt-4 pt-4 border-t border-slate-200">
                  <p class="text-sm text-slate-600">
                    <span class="font-medium">Member since:</span> 
                    {{ authStore.user?.date_joined ? new Date(authStore.user.date_joined).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'Unknown' }}
                  </p>
                </div>
              </div>

              <!-- Bio Section -->
              <div class="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                <h3 class="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <div class="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span>About You</span>
                </h3>
                
                <div>
                  <label for="bio" class="block text-sm font-semibold text-slate-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    v-model="profileForm.bio"
                    rows="4"
                    class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Tell us about yourself..."
                  ></textarea>
                  <p class="text-sm text-slate-500 mt-2">Brief description for your profile. Maximum 500 characters.</p>
                </div>
              </div>

              <!-- Success/Error Messages -->
              <div v-if="successMessage" class="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div class="flex items-center">
                  <CheckCircle class="h-5 w-5 text-green-600 mr-2" />
                  <span class="text-green-700 text-sm">{{ successMessage }}</span>
                </div>
              </div>

              <div v-if="errorMessage" class="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div class="flex items-center">
                  <AlertCircle class="h-5 w-5 text-red-600 mr-2" />
                  <span class="text-red-700 text-sm">{{ errorMessage }}</span>
                </div>
              </div>

              <!-- Save Button -->
              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="authStore.isLoading"
                  class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg"
                >
                  <div class="flex items-center space-x-2">
                    <Loader2 v-if="authStore.isLoading" class="animate-spin w-5 h-5" />
                    <Save class="w-5 h-5" />
                    <span>{{ authStore.isLoading ? 'Saving...' : 'Save Changes' }}</span>
                  </div>
                </button>
              </div>
            </form>
          </div>

          <!-- Commission Settings -->
          <CommissionTab v-if="activeTab === 'commission'" />

          <!-- Security Settings -->
          <div v-if="activeTab === 'security'" class="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
            <h2 class="text-2xl font-bold text-slate-900 mb-6">Security Settings</h2>
            
            <form @submit.prevent="handlePasswordChange" class="space-y-6">
              <!-- Current Password -->
              <div>
                <label for="currentPassword" class="block text-sm font-semibold text-slate-700 mb-2">
                  Current Password
                </label>
                <div class="relative">
                  <input
                    id="currentPassword"
                    v-model="passwordForm.old_password"
                    :type="showPasswords.current ? 'text' : 'password'"
                    :class="[
                      'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent pr-12',
                      fieldErrors.old_password ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
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
                  <p v-for="error in fieldErrors.old_password" :key="error" class="text-sm text-red-600">
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
                      fieldErrors.new_password ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
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
                  <p v-for="error in fieldErrors.new_password" :key="error" class="text-sm text-red-600">
                    {{ error }}
                  </p>
                </div>
              </div>

              <!-- Confirm New Password -->
              <div>
                <label for="confirmPassword" class="block text-sm font-semibold text-slate-700 mb-2">
                  Confirm New Password
                </label>
                <div class="relative">
                  <input
                    id="confirmPassword"
                    v-model="passwordForm.new_password_confirm"
                    :type="showPasswords.confirm ? 'text' : 'password'"
                    :class="[
                      'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent pr-12',
                      fieldErrors.new_password_confirm ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
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
                  <p v-for="error in fieldErrors.new_password_confirm" :key="error" class="text-sm text-red-600">
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
                  <span class="font-medium" :class="passwordStrength >= 3 ? 'text-green-600' : 'text-orange-600'">
                    {{ passwordStrengthText }}
                  </span>
                  <span v-if="passwordStrength >= 3" class="text-green-600 text-xs">✓ Strong enough</span>
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
                <div v-if="passwordForm.new_password && !isPasswordStrongEnough" class="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <p class="text-sm text-orange-800">
                    <strong>Security Notice:</strong> Password must be at least "Good" strength (3/4) for account security.
                  </p>
                </div>
              </div>

              <!-- Success/Error Messages -->
              <div v-if="passwordSuccessMessage" class="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div class="flex items-center">
                  <CheckCircle class="h-5 w-5 text-green-600 mr-2" />
                  <span class="text-green-700 text-sm">{{ passwordSuccessMessage }}</span>
                </div>
              </div>

              <div v-if="passwordErrorMessage" class="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div class="flex items-center">
                  <AlertCircle class="h-5 w-5 text-red-600 mr-2" />
                  <span class="text-red-700 text-sm">{{ passwordErrorMessage }}</span>
                </div>
              </div>

              <!-- Change Password Button -->
              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="authStore.isLoading || !passwordsMatch || !isPasswordStrongEnough || !passwordForm.old_password"
                  class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navigation from '../components/Navigation.vue'
import CommissionTab from '../components/settings/CommissionTab.vue'
import { useAuthStore } from '../stores/auth'
import { authService } from '../services/auth'
import { uploadService } from '../services/upload'
import { apiService } from '../services/api'
import { inputValidator, validationRules } from '../utils/inputValidation'
import {
  User,
  Lock,
  Save,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  Upload,
  Trash2,
  Wallet,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

// Tab management
const activeTab = ref('profile')
const tabs = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'security', name: 'Security', icon: Lock },
  { id: 'commission', name: 'Commission', icon: Wallet }
]

// Profile form
const profileForm = ref({
  first_name: '',
  last_name: '',
  email: '',
  username: '',
  bio: ''
})

// Password form
const passwordForm = ref({
  old_password: '',
  new_password: '',
  new_password_confirm: ''
})

// UI state
const successMessage = ref('')
const errorMessage = ref('')
const passwordSuccessMessage = ref('')
const passwordErrorMessage = ref('')
const uploadLoading = ref(false)
const fileInput = ref<HTMLInputElement>()
const profilePicturePreview = ref<string>('')
const fieldErrors = ref<Record<string, string[]>>({})

const showPasswords = ref({
  current: false,
  new: false,
  confirm: false
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
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
  return colors[passwordStrength.value] || 'bg-gray-200'
})

// Real-time validation for form fields
const profileValidation = computed(() => {
  if (!profileForm.value.email && !profileForm.value.username) {
    return { isValid: true, errors: {} }
  }
  
  return inputValidator.validateForm(profileForm.value, {
    email: validationRules.email,
    username: validationRules.username,
    firstName: validationRules.firstName,
    lastName: validationRules.lastName,
    bio: validationRules.bio
  })
})

const passwordValidation = computed(() => {
  const form = passwordForm.value
  if (!form.new_password && !form.new_password_confirm) {
    return { isValid: true, errors: {} }
  }
  
  const validation = inputValidator.validateForm(form, {
    new_password: { ...validationRules.newPassword, required: false },
    new_password_confirm: { ...validationRules.confirmPassword, required: false }
  })
  
  // Add custom validation for password confirmation
  if (form.new_password && form.new_password_confirm && form.new_password !== form.new_password_confirm) {
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

// Initialize form with user data
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/signin')
    return
  }

  if (authStore.user) {
    profileForm.value = {
      first_name: authStore.user.first_name || '',
      last_name: authStore.user.last_name || '',
      email: authStore.user.email || '',
      username: authStore.user.username || '',
      bio: authStore.user.bio || ''
    }
  }
})

// Profile update handler
const handleProfileUpdate = async () => {
  successMessage.value = ''
  errorMessage.value = ''
  fieldErrors.value = {}
  
  // Comprehensive validation
  const validation = inputValidator.validateForm(profileForm.value, {
    email: validationRules.email,
    username: validationRules.username,
    first_name: validationRules.firstName,
    last_name: validationRules.lastName,
    bio: validationRules.bio
  })
  
  if (!validation.isValid) {
    fieldErrors.value = validation.errors
    errorMessage.value = 'Please fix the validation errors below'
    return
  }
  
  try {
    // Use sanitized data
    const updateData = Object.fromEntries(
      Object.entries(validation.sanitizedData).filter(([key, value]) => value !== '')
    )
    
    const result = await authStore.updateProfile(updateData)
    
    if (result.success) {
      successMessage.value = 'Profile updated successfully!'
      fieldErrors.value = {}
      
      // Refresh the form with updated user data
      if (authStore.user) {
        profileForm.value = {
          first_name: authStore.user.first_name || '',
          last_name: authStore.user.last_name || '',
          email: authStore.user.email || '',
          username: authStore.user.username || '',
          bio: authStore.user.bio || ''
        }
      }
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.error || 'Failed to update profile'
    }
  } catch (error) {
    errorMessage.value = 'An unexpected error occurred'
  }
}

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
    new_password_confirm: { required: true, sanitize: false }
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
        ...validation.errors.new_password || [],
        'Password must be at least "Good" strength (score 3/4)',
        ...passwordStrengthData.value.feedback
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
      new_password_confirm: validation.sanitizedData.new_password_confirm
    })
    
    if (response.success) {
      // Clear rate limiting on successful password change
      inputValidator.clearRateLimit(`password_change_${clientId}`)
      
      passwordSuccessMessage.value = 'Password changed successfully! Please sign in again with your new password.'
      fieldErrors.value = {}
      passwordForm.value = {
        old_password: '',
        new_password: '',
        new_password_confirm: ''
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

// Profile picture upload handlers
const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  try {
    uploadLoading.value = true
    errorMessage.value = ''
    
    // Enhanced file validation (will be done by uploadService)
    // Create preview first for better UX
    const reader = new FileReader()
    reader.onload = (e) => {
      profilePicturePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
    
    // Upload file with enhanced security validation
    const response = await uploadService.uploadProfilePicture(file)
    
    if (response.success && response.data) {
      // The API returns the user object with updated profile_picture
      const profilePictureUrl = response.data.profile_picture || response.data.url
      await authStore.updateProfile({ profile_picture: profilePictureUrl })
      successMessage.value = 'Profile picture updated successfully!'
      profilePicturePreview.value = ''
      
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = response.message || 'Failed to upload profile picture'
      profilePicturePreview.value = ''
    }
  } catch (error) {
    console.error('File upload error:', error)
    errorMessage.value = 'Failed to upload profile picture'
    profilePicturePreview.value = ''
  } finally {
    uploadLoading.value = false
    // Clear the input
    if (target) target.value = ''
  }
}

const removeProfilePicture = async () => {
  try {
    errorMessage.value = ''
    
    await authStore.updateProfile({ profile_picture: '' })
    profilePicturePreview.value = ''
    successMessage.value = 'Profile picture removed successfully!'
    
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    errorMessage.value = 'Failed to remove profile picture'
  }
}
</script>