<template>
  <div>
    <!-- Loading State -->
    <div v-if="vendorState === 'loading'" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="vendorState === 'error'" class="text-center py-12">
      <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load vendor profile</h3>
      <p class="text-gray-500 mb-4">{{ error }}</p>
      <button
        @click="loadProfile"
        class="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
      >
        Try Again
      </button>
    </div>

    <!-- Not a Vendor Yet - Call to Action -->
    <div v-else-if="vendorState === 'not_vendor'" class="space-y-6">
      <div v-if="!showForm">
        <!-- Promotional Banner -->
        <div class="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 rounded-xl p-6 sm:p-8">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div class="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg class="w-7 h-7 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div class="flex-1">
              <h2 class="text-xl font-semibold text-gray-900 mb-2">Become a Vendor</h2>
              <p class="text-gray-600">
                List your services on GoEvent and reach thousands of event organizers looking for vendors like you.
              </p>
            </div>
          </div>

          <!-- Benefits -->
          <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex items-start gap-3">
              <div class="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900">Create your business profile</p>
                <p class="text-sm text-gray-500">Showcase your brand and expertise</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900">List unlimited services</p>
                <p class="text-sm text-gray-500">Add as many offerings as you want</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900">Track views and inquiries</p>
                <p class="text-sm text-gray-500">Monitor your listing performance</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900">Get verified badge</p>
                <p class="text-sm text-gray-500">Build trust with potential clients</p>
              </div>
            </div>
          </div>

          <!-- CTA Button -->
          <div class="mt-8">
            <button
              @click="showForm = true"
              class="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get Started
            </button>
          </div>
        </div>
      </div>

      <!-- Vendor Profile Form (Create Mode) -->
      <VendorProfileForm
        v-else
        mode="create"
        :form-data="vendorForm"
        :is-saving="isSaving"
        :error="error"
        :success-message="successMessage"
        @submit="handleCreateProfile"
        @cancel="showForm = false"
      />
    </div>

    <!-- Existing Vendor - Edit Profile -->
    <div v-else class="space-y-6">
      <VendorProfileForm
        mode="edit"
        :form-data="vendorForm"
        :vendor-profile="vendorProfile"
        :is-saving="isSaving"
        :error="error"
        :success-message="successMessage"
        :logo-url="logoUrl"
        :cover-image-url="coverImageUrl"
        :verification-status="verificationStatus"
        @submit="handleUpdateProfile"
        @upload-logo="handleLogoUpload"
        @upload-cover="handleCoverUpload"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useVendorProfile } from '@/composables/settings/useVendorProfile'
import VendorProfileForm from './VendorProfileForm.vue'

const {
  vendorProfile,
  vendorForm,
  vendorState,
  verificationStatus,
  isSaving,
  error,
  successMessage,
  logoUrl,
  coverImageUrl,
  loadProfile,
  createProfile,
  updateProfile,
  uploadLogo,
  uploadCoverImage,
  clearSuccessAfterDelay,
} = useVendorProfile()

const showForm = ref(false)

const handleCreateProfile = async () => {
  const result = await createProfile()
  if (result.success) {
    showForm.value = false
    clearSuccessAfterDelay()
  }
}

const handleUpdateProfile = async () => {
  const result = await updateProfile()
  if (result.success) {
    clearSuccessAfterDelay()
  }
}

const handleLogoUpload = async (file: File) => {
  const result = await uploadLogo(file)
  if (result.success) {
    clearSuccessAfterDelay()
  }
}

const handleCoverUpload = async (file: File) => {
  const result = await uploadCoverImage(file)
  if (result.success) {
    clearSuccessAfterDelay()
  }
}
</script>
