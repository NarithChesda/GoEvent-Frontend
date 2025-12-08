<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-900 mb-2">Your Profile</h2>
    <p class="text-sm text-gray-500 mb-8">Choose how you are displayed as a host or guest.</p>

    <form @submit.prevent="handleProfileUpdate" class="space-y-6">
      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2">
        <div class="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span class="font-medium">{{ successMessage }}</span>
      </div>
      <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
        <div class="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <span class="font-medium">{{ errorMessage }}</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Mobile Profile Section - Shows first on mobile -->
        <div class="lg:hidden order-first">
          <div :class="isPartner ? 'grid grid-cols-2 gap-4' : 'flex justify-center'">
            <!-- Profile Picture for Mobile -->
            <div class="flex flex-col items-center">
              <label class="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
              <div class="relative w-28 h-28 mx-auto mb-2">
                <!-- Partner Badge Ring -->
                <div
                  v-if="isPartner"
                  class="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 animate-pulse"
                ></div>

                <div
                  v-if="profilePictureUrl"
                  class="relative w-28 h-28 rounded-full overflow-hidden bg-orange-100 border-4 border-white shadow-lg"
                >
                  <img
                    :src="profilePictureUrl"
                    :key="profilePictureUrl"
                    alt="Profile"
                    class="w-full h-full object-cover"
                    @error="handleImageError"
                    @load="handleImageLoad"
                  />
                </div>
                <div
                  v-else
                  class="relative w-28 h-28 bg-orange-400 rounded-full flex items-center justify-center text-gray-800 font-medium text-3xl border-4 border-white shadow-lg"
                >
                  {{ userInitials }}
                </div>

                <!-- Upload button overlay -->
                <button
                  type="button"
                  @click="triggerFileUpload"
                  class="absolute bottom-0 right-0 w-9 h-9 bg-gray-900 hover:bg-gray-800 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Partner Logo for Mobile (only for partners) -->
            <div v-if="isPartner" class="flex flex-col items-center">
              <label class="block text-sm font-medium text-gray-700 mb-3">Partner Logo</label>
              <div class="relative w-28 h-28 mx-auto mb-2">
                <div
                  v-if="logoUrl"
                  class="relative w-28 h-28 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-300 shadow-lg"
                >
                  <img
                    :src="logoUrl"
                    :key="logoUrl"
                    alt="Logo"
                    class="w-full h-full object-contain p-2"
                    @error="handleLogoImageError"
                    @load="handleLogoImageLoad"
                  />
                </div>
                <div
                  v-else
                  class="relative w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-400 font-medium text-xs border-2 border-gray-300 shadow-lg"
                >
                  No Logo
                </div>

                <!-- Upload button overlay -->
                <button
                  type="button"
                  @click="triggerLogoUpload"
                  :disabled="logoUploadLoading"
                  class="absolute bottom-0 right-0 w-9 h-9 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Left Column - Form Fields (2/3 width) -->
        <div class="lg:col-span-2 space-y-6 order-2 lg:order-1">
          <!-- Name Fields -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                v-model="profileForm.first_name"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="Narith"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                v-model="profileForm.last_name"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="Chesda"
              />
            </div>
          </div>

          <!-- Email Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email address</label>
            <input
              v-model="profileForm.email"
              type="email"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              placeholder="Enter your email"
            />
          </div>

          <!-- Username Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
              <input
                v-model="profileForm.username"
                type="text"
                class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="username"
              />
            </div>
          </div>

          <!-- Bio Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              v-model="profileForm.bio"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
              placeholder="Share a little about your background and interests."
            ></textarea>
          </div>

          <!-- Phone Number Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              v-model="profileForm.phone_number"
              type="tel"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              placeholder="Enter your phone number"
            />
          </div>

          <!-- Telegram URL Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Telegram URL</label>
            <input
              v-model="profileForm.telegram_link"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              placeholder="t.me/yourusername or @yourusername"
            />
          </div>

          <!-- Payment URL Field (only for partners) -->
          <div v-if="isPartner">
            <label class="block text-sm font-medium text-gray-700 mb-2">Payment URL</label>
            <input
              v-model="profileForm.payment_link"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              placeholder="your-payment-platform.com/username"
            />
          </div>
        </div>

        <!-- Right Column - Profile Picture (1/3 width) - Desktop only -->
        <div class="hidden lg:block lg:col-span-1 order-3 lg:order-2">
          <div class="sticky top-8 space-y-8">
            <!-- Profile Picture Section -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3 text-center">Profile Picture</label>

              <!-- Current Profile Picture -->
              <div class="relative w-32 h-32 mx-auto mb-4">
                <!-- Partner Badge Ring -->
                <div
                  v-if="isPartner"
                  class="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 animate-pulse"
                ></div>

                <div
                  v-if="profilePictureUrl"
                  class="relative w-32 h-32 rounded-full overflow-hidden bg-orange-100 border-4 border-white shadow-lg"
                >
                  <img
                    :src="profilePictureUrl"
                    :key="profilePictureUrl"
                    alt="Profile"
                    class="w-full h-full object-cover"
                    @error="handleImageError"
                    @load="handleImageLoad"
                  />
                </div>
                <div
                  v-else
                  class="relative w-32 h-32 bg-orange-400 rounded-full flex items-center justify-center text-gray-800 font-medium text-4xl border-4 border-white shadow-lg"
                >
                  {{ userInitials }}
                </div>

                <!-- Upload button overlay -->
                <button
                  type="button"
                  @click="triggerFileUpload"
                  class="absolute bottom-0 right-0 w-10 h-10 bg-gray-900 hover:bg-gray-800 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                  </svg>
                </button>
              </div>

              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                @change="handleFileSelect"
                class="hidden"
              />
            </div>

            <!-- Partner Logo Section (only for partners) -->
            <div v-if="isPartner">
              <label class="block text-sm font-medium text-gray-700 mb-3 text-center">Partner Logo</label>

              <!-- Current Logo -->
              <div class="relative w-32 h-32 mx-auto mb-4">
                <div
                  v-if="logoUrl"
                  class="relative w-32 h-32 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-300 shadow-lg"
                >
                  <img
                    :src="logoUrl"
                    :key="logoUrl"
                    alt="Logo"
                    class="w-full h-full object-contain p-2"
                    @error="handleLogoImageError"
                    @load="handleLogoImageLoad"
                  />
                </div>
                <div
                  v-else
                  class="relative w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-400 font-medium text-xs border-2 border-gray-300 shadow-lg"
                >
                  No Logo
                </div>

                <!-- Upload button overlay -->
                <button
                  type="button"
                  @click="triggerLogoUpload"
                  :disabled="logoUploadLoading"
                  class="absolute bottom-0 right-0 w-10 h-10 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                  </svg>
                </button>
              </div>

              <input
                ref="logoFileInputRef"
                type="file"
                accept="image/*"
                @change="handleLogoFileSelect"
                class="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Save Changes Button -->
      <div class="flex justify-start pt-4">
        <button
          type="submit"
          :disabled="uploadLoading || isSubmitting"
          class="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          {{ uploadLoading || isSubmitting ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>

    </form>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileForm } from '@/composables/settings/useProfileForm'
import { useProfilePictureUpload } from '@/composables/settings/useProfilePictureUpload'
import { useLogoUpload } from '@/composables/settings/useLogoUpload'

const authStore = useAuthStore()

// Use profile form composable
const {
  profileForm,
  successMessage,
  errorMessage,
  isSubmitting,
  isPartner,
  handleProfileUpdate,
  setSuccessMessage,
  setErrorMessage,
} = useProfileForm({ redirectOnUnauthenticated: false })

// Use profile picture upload composable
const {
  fileInput: fileInputRef,
  profilePictureUrl,
  uploadLoading,
  triggerFileUpload,
  handleFileSelect,
  handleImageError,
  handleImageLoad,
} = useProfilePictureUpload({
  onSuccess: setSuccessMessage,
  onError: setErrorMessage,
})

// Use logo upload composable
const {
  logoFileInput: logoFileInputRef,
  logoUrl,
  logoUploadLoading,
  triggerLogoUpload,
  handleLogoFileSelect,
  handleLogoImageError,
  handleLogoImageLoad,
} = useLogoUpload({
  onSuccess: setSuccessMessage,
  onError: setErrorMessage,
})

// Computed
const userInitials = computed(() => authStore.userInitials)
</script>
