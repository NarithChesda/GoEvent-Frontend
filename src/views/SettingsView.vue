<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 pb-20 lg:pb-0">

    <!-- Settings Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col gap-8">
        <!-- Profile Settings -->
        <div class="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
            <h2 class="text-2xl font-bold text-slate-900 mb-6">Profile Information</h2>

            <form @submit.prevent="handleProfileUpdate" class="space-y-8">
              <!-- Profile Picture Section -->
              <div class="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                <h3 class="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
                  <div class="w-2 h-2 bg-[#1e90ff] rounded-full"></div>
                  <span>Profile Picture</span>
                </h3>

                <div
                  class="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6"
                >
                  <!-- Current Profile Picture -->
                  <div class="relative group">
                    <div
                      v-if="profilePicturePreview || authStore.user?.profile_picture"
                      class="w-24 h-24 rounded-2xl overflow-hidden shadow-lg ring-4 ring-white group-hover:ring-[#87CEEB] transition-all duration-300"
                    >
                      <img
                        :src="
                          profilePicturePreview ||
                          apiService.getProfilePictureUrl(authStore.user?.profile_picture) ||
                          ''
                        "
                        alt="Profile"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div
                      v-else
                      class="w-24 h-24 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff] rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-white group-hover:ring-[#87CEEB] transition-all duration-300"
                    >
                      {{ authStore.userInitials }}
                    </div>

                    <!-- Upload Overlay -->
                    <div
                      class="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                    >
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
                        class="inline-flex items-center space-x-2 px-4 py-2 bg-[#1e90ff] hover:bg-[#1873cc] disabled:bg-gray-400 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-emerald-500/25"
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
                      JPG, PNG, GIF, WebP, or AVIF. Max size 3MB. Recommended: 400x400px. Files are
                      scanned for security.
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
                      class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
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
                      class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
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
                      class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
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
                      class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                      placeholder="Enter your username"
                    />
                  </div>
                </div>

                <!-- Partner Information Section (only for partners) -->
                <div v-if="authStore.user?.is_partner" class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <!-- Phone Number -->
                  <div>
                    <label for="phone_number" class="block text-sm font-semibold text-slate-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      id="phone_number"
                      v-model="profileForm.phone_number"
                      type="tel"
                      class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <!-- Telegram Link -->
                  <div>
                    <label for="telegram_link" class="block text-sm font-semibold text-slate-700 mb-2">
                      Telegram Link
                    </label>
                    <input
                      id="telegram_link"
                      v-model="profileForm.telegram_link"
                      type="text"
                      class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                      placeholder="t.me/yourusername or @yourusername"
                    />
                  </div>

                  <!-- Payment Link -->
                  <div class="md:col-span-2">
                    <label for="payment_link" class="block text-sm font-semibold text-slate-700 mb-2">
                      Payment URL
                    </label>
                    <input
                      id="payment_link"
                      v-model="profileForm.payment_link"
                      type="text"
                      class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                      placeholder="your-payment-platform.com/username"
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
                  <div
                    class="inline-flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium"
                    :class="
                      authStore.user?.is_verified
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-orange-100 text-orange-800 border border-orange-200'
                    "
                  >
                    <div
                      :class="authStore.user?.is_verified ? 'bg-green-500' : 'bg-orange-500'"
                      class="w-2 h-2 rounded-full"
                    ></div>
                    <span>{{
                      authStore.user?.is_verified ? 'Verified Account' : 'Unverified Account'
                    }}</span>
                  </div>

                  <!-- Partner Status -->
                  <div
                    v-if="authStore.user?.is_partner"
                    class="inline-flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border border-purple-200"
                  >
                    <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Partner Account</span>
                  </div>
                </div>

                <!-- Partner Information (shown only for partners) -->
                <div v-if="authStore.user?.is_partner" class="mt-4 pt-4 border-t border-slate-200">
                  <h4 class="text-sm font-semibold text-slate-700 mb-3">Partner Information</h4>
                  <div class="space-y-3">
                    <div v-if="authStore.user.phone_number" class="flex items-center justify-between">
                      <span class="text-sm text-slate-600 font-medium">Phone Number:</span>
                      <span class="text-sm text-slate-900">{{ authStore.user.phone_number }}</span>
                    </div>
                    <div v-if="authStore.user.telegram_link" class="flex items-center justify-between">
                      <span class="text-sm text-slate-600 font-medium">Telegram:</span>
                      <a
                        :href="authStore.user.telegram_link"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-sm text-[#1e90ff] hover:text-[#1873cc] underline"
                      >
                        {{ authStore.user.telegram_link }}
                      </a>
                    </div>
                    <div v-if="authStore.user.payment_link" class="flex items-center justify-between">
                      <span class="text-sm text-slate-600 font-medium">Payment URL:</span>
                      <a
                        :href="authStore.user.payment_link"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-sm text-[#1e90ff] hover:text-[#1873cc] underline"
                      >
                        {{ authStore.user.payment_link }}
                      </a>
                    </div>
                  </div>
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
                    class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent resize-none"
                    placeholder="Tell us about yourself..."
                  ></textarea>
                  <p class="text-sm text-slate-500 mt-2">
                    Brief description for your profile. Maximum 500 characters.
                  </p>
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
                  class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg"
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
import { uploadService } from '../services/upload'
import { apiService } from '../services/api'
import { inputValidator, validationRules } from '../utils/inputValidation'
import {
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  Upload,
  Trash2,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

// Profile form
const profileForm = ref({
  first_name: '',
  last_name: '',
  email: '',
  username: '',
  bio: '',
  phone_number: '',
  telegram_link: '',
  payment_link: '',
})

// UI state
const successMessage = ref('')
const errorMessage = ref('')
const uploadLoading = ref(false)
const fileInput = ref<HTMLInputElement>()
const profilePicturePreview = ref<string>('')
const fieldErrors = ref<Record<string, string[]>>({})


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
    bio: validationRules.bio,
  })
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
      bio: authStore.user.bio || '',
      phone_number: authStore.user.phone_number || '',
      telegram_link: authStore.user.telegram_link || '',
      payment_link: authStore.user.payment_link || '',
    }
  }
})

// Profile update handler
const handleProfileUpdate = async () => {
  successMessage.value = ''
  errorMessage.value = ''
  fieldErrors.value = {}

  // Comprehensive validation
  const validationConfig: Record<string, any> = {
    email: validationRules.email,
    username: validationRules.username,
    first_name: validationRules.firstName,
    last_name: validationRules.lastName,
    bio: validationRules.bio,
  }

  // Add partner field validation if user is a partner
  if (authStore.user?.is_partner) {
    validationConfig.phone_number = {
      required: false,
      pattern: /^[\+]?[\d\s\-\(\)]+$/,
      message: 'Please enter a valid phone number'
    }
    validationConfig.telegram_link = {
      required: false,
      pattern: /^(https?:\/\/)?(t\.me\/|telegram\.me\/).+$/i,
      message: 'Please enter a valid Telegram URL (e.g., https://t.me/username)'
    }
    validationConfig.payment_link = {
      required: false,
      pattern: /^https?:\/\/.+/,
      message: 'Please enter a valid URL starting with http:// or https://'
    }
  }

  const validation = inputValidator.validateForm(profileForm.value, validationConfig)

  if (!validation.isValid) {
    fieldErrors.value = validation.errors
    errorMessage.value = 'Please fix the validation errors below'
    return
  }

  try {
    // Use sanitized data, but handle partner fields specially
    const updateData: Record<string, any> = {}

    // Process all fields from the form
    Object.entries(profileForm.value).forEach(([key, value]) => {
      const partnerFields = ['phone_number', 'telegram_link', 'payment_link']
      const urlFields = ['telegram_link', 'payment_link']

      if (partnerFields.includes(key) && authStore.user?.is_partner) {
        // For URL fields, handle both empty and filled values
        if (urlFields.includes(key)) {
          if (value === '' || value === null) {
            updateData[key] = null
          } else {
            // Ensure URLs are properly formatted
            let formattedUrl = value.trim()
            if (key === 'telegram_link' && !formattedUrl.startsWith('http')) {
              // Auto-prepend https:// for telegram links if missing
              if (formattedUrl.startsWith('t.me/')) {
                formattedUrl = 'https://' + formattedUrl
              } else if (!formattedUrl.includes('t.me/') && !formattedUrl.includes('telegram.me/')) {
                // Assume it's just the username
                formattedUrl = 'https://t.me/' + formattedUrl.replace('@', '')
              }
            } else if (key === 'payment_link' && !formattedUrl.startsWith('http')) {
              // Auto-prepend https:// for payment links if missing
              formattedUrl = 'https://' + formattedUrl
            }
            updateData[key] = formattedUrl
          }
        } else {
          // Phone number field
          updateData[key] = value || null
        }
      } else if (!partnerFields.includes(key)) {
        // For non-partner fields, include the value
        if (value !== undefined && value !== null && value !== '') {
          updateData[key] = value
        }
      }
    })

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
          bio: authStore.user.bio || '',
          phone_number: authStore.user.phone_number || '',
          telegram_link: authStore.user.telegram_link || '',
          payment_link: authStore.user.payment_link || '',
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

// Temporary function for testing partner features
const togglePartnerStatus = () => {
  if (authStore.user) {
    // Temporarily modify the user object for testing
    authStore.user.is_partner = !authStore.user.is_partner

    // Add some sample data if becoming a partner
    if (authStore.user.is_partner) {
      authStore.user.phone_number = authStore.user.phone_number || '+1234567890'
      authStore.user.telegram_link = authStore.user.telegram_link || 'https://t.me/sample_user'
      authStore.user.payment_link = authStore.user.payment_link || 'https://paypal.me/sample_user'

      // Update form with sample data
      profileForm.value.phone_number = authStore.user.phone_number
      profileForm.value.telegram_link = authStore.user.telegram_link
      profileForm.value.payment_link = authStore.user.payment_link
    } else {
      // Clear partner data when removing partner status
      authStore.user.phone_number = undefined
      authStore.user.telegram_link = undefined
      authStore.user.payment_link = undefined

      // Clear form data
      profileForm.value.phone_number = ''
      profileForm.value.telegram_link = ''
      profileForm.value.payment_link = ''
    }
  }
}
</script>