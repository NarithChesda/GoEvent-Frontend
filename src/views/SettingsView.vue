<template>
  <MainLayout>
    <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">

    <!-- Settings Content -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div class="flex flex-col gap-6">
        <!-- Profile Settings -->
        <BaseCard class="p-0 overflow-hidden">
            <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 text-center py-8 sm:py-12 bg-gradient-to-br from-white via-emerald-50/30 to-sky-50/30">Your Profile</h1>

            <form @submit.prevent="handleProfileUpdate" class="p-6 sm:p-8 space-y-8 sm:space-y-10">
              <!-- Success/Error Messages -->
              <div v-if="successMessage" class="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm">
                <div class="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="font-medium">{{ successMessage }}</span>
              </div>
              <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm">
                <div class="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span class="font-medium">{{ errorMessage }}</span>
              </div>

              <!-- Profile Picture Section -->
              <div class="pb-8 border-b border-slate-200">
                <div class="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
                  <div class="flex flex-col lg:flex-row items-center lg:items-start gap-6 flex-1">
                    <div class="flex flex-col items-center lg:items-start gap-3">
                      <label class="block text-sm font-semibold text-slate-700">Profile Photo</label>

                      <!-- Current Profile Picture -->
                      <div class="relative w-20 h-20">
                        <!-- Partner Badge Ring -->
                        <div
                          v-if="authStore.user?.is_partner"
                          class="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 animate-pulse"
                        ></div>

                        <div
                          v-if="profilePictureUrl"
                          class="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200"
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
                          class="relative w-20 h-20 bg-pink-600 rounded-full flex items-center justify-center text-white font-medium text-2xl"
                        >
                          {{ authStore.userInitials }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Upload Controls -->
                  <div class="flex flex-col sm:flex-row items-center gap-3 lg:mt-7">
                    <input
                      ref="fileInput"
                      type="file"
                      accept="image/*"
                      @change="handleFileSelect"
                      class="hidden"
                    />

                    <button
                      v-if="authStore.user?.profile_picture || profilePicturePreview"
                      type="button"
                      @click="removeProfilePicture"
                      class="w-full sm:w-auto px-5 py-2.5 text-slate-700 hover:text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-all duration-200 border border-transparent hover:border-slate-200"
                    >
                      Remove photo
                    </button>

                    <button
                      type="button"
                      @click="triggerFileUpload"
                      :disabled="uploadLoading"
                      class="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      {{ uploadLoading ? 'Uploading...' : 'Change photo' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Partner Logo Section -->
              <div v-if="authStore.user?.is_partner" class="pb-8 border-b border-slate-200">
                <div class="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
                  <div class="flex flex-col lg:flex-row items-center lg:items-start gap-6 flex-1">
                    <div class="flex flex-col items-center lg:items-start gap-3">
                      <label class="block text-sm font-semibold text-slate-700">Partner Logo</label>

                      <!-- Current Logo -->
                      <div class="relative w-20 h-20">
                        <div
                          v-if="logoUrl"
                          class="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-200 border-2 border-slate-300"
                        >
                          <img
                            :src="logoUrl"
                            :key="logoUrl"
                            alt="Logo"
                            class="w-full h-full object-contain p-1"
                            @error="handleLogoImageError"
                            @load="handleLogoImageLoad"
                          />
                        </div>
                        <div
                          v-else
                          class="relative w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-slate-400 font-medium text-xs border-2 border-slate-300"
                        >
                          No Logo
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Upload Controls -->
                  <div class="flex flex-col sm:flex-row items-center gap-3 lg:mt-7">
                    <input
                      ref="logoFileInput"
                      type="file"
                      accept="image/*"
                      @change="handleLogoFileSelect"
                      class="hidden"
                    />

                    <button
                      v-if="authStore.user?.logo || logoPreview"
                      type="button"
                      @click="removeLogo"
                      class="w-full sm:w-auto px-5 py-2.5 text-slate-700 hover:text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-all duration-200 border border-transparent hover:border-slate-200"
                    >
                      Remove logo
                    </button>

                    <button
                      type="button"
                      @click="triggerLogoUpload"
                      :disabled="logoUploadLoading"
                      class="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      {{ logoUploadLoading ? 'Uploading...' : 'Change logo' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Name Field -->
              <div class="border-b border-slate-200 pb-8">
                <div class="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                  <div class="flex-1 w-full">
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                    <div v-if="!editingField || editingField !== 'name'" class="text-base text-slate-900 font-medium">
                      {{ fullName || 'Not set' }}
                    </div>
                    <div v-else class="flex flex-col sm:flex-row gap-3">
                      <input
                        v-model="profileForm.first_name"
                        type="text"
                        class="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-slate-400"
                        placeholder="First name"
                      />
                      <input
                        v-model="profileForm.last_name"
                        type="text"
                        class="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-slate-400"
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  <div v-if="editingField === 'name'" class="flex items-center gap-2 w-full sm:w-auto sm:mt-7">
                    <button
                      type="button"
                      @click="cancelEdit('name')"
                      class="flex-1 sm:flex-none px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      @click="saveEdit('name')"
                      class="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Save
                    </button>
                  </div>
                  <button
                    v-else
                    type="button"
                    @click="startEdit('name')"
                    class="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow sm:mt-7"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <!-- Email Field -->
              <div class="border-b border-slate-200 pb-8">
                <div class="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                  <div class="flex-1 w-full">
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Email address</label>
                    <div v-if="!editingField || editingField !== 'email'" class="text-base text-slate-900 font-medium break-all">
                      {{ profileForm.email || 'Not set' }}
                    </div>
                    <input
                      v-else
                      v-model="profileForm.email"
                      type="email"
                      class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-slate-400"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div v-if="editingField === 'email'" class="flex items-center gap-2 w-full sm:w-auto sm:mt-7">
                    <button
                      type="button"
                      @click="cancelEdit('email')"
                      class="flex-1 sm:flex-none px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      @click="saveEdit('email')"
                      class="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Save
                    </button>
                  </div>
                  <button
                    v-else
                    type="button"
                    @click="startEdit('email')"
                    class="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow sm:mt-7"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <!-- Username Field -->
              <div class="border-b border-slate-200 pb-8">
                <div class="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                  <div class="flex-1 w-full">
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                    <div v-if="!editingField || editingField !== 'username'" class="text-base text-slate-900 font-medium">
                      {{ profileForm.username || 'Not set' }}
                    </div>
                    <input
                      v-else
                      v-model="profileForm.username"
                      type="text"
                      class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-slate-400"
                      placeholder="Enter your username"
                    />
                  </div>
                  <div v-if="editingField === 'username'" class="flex items-center gap-2 w-full sm:w-auto sm:mt-7">
                    <button
                      type="button"
                      @click="cancelEdit('username')"
                      class="flex-1 sm:flex-none px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      @click="saveEdit('username')"
                      class="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Save
                    </button>
                  </div>
                  <button
                    v-else
                    type="button"
                    @click="startEdit('username')"
                    class="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow sm:mt-7"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <!-- Bio Field -->
              <div class="border-b border-slate-200 pb-8">
                <div class="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                  <div class="flex-1 w-full">
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Bio</label>
                    <div v-if="!editingField || editingField !== 'bio'" class="text-base text-slate-900 font-medium whitespace-pre-wrap">
                      {{ profileForm.bio || 'Not set' }}
                    </div>
                    <textarea
                      v-else
                      v-model="profileForm.bio"
                      rows="4"
                      class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 bg-white hover:border-slate-400"
                      placeholder="Tell us about yourself..."
                    ></textarea>
                  </div>
                  <div v-if="editingField === 'bio'" class="flex items-center gap-2 w-full sm:w-auto sm:mt-7">
                    <button
                      type="button"
                      @click="cancelEdit('bio')"
                      class="flex-1 sm:flex-none px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      @click="saveEdit('bio')"
                      class="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Save
                    </button>
                  </div>
                  <button
                    v-else
                    type="button"
                    @click="startEdit('bio')"
                    class="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow sm:mt-7"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <!-- Phone Number Field -->
              <div class="border-b border-slate-200 pb-8">
                <div class="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                  <div class="flex-1 w-full">
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                    <div v-if="!editingField || editingField !== 'phone_number'" class="text-base text-slate-900 font-medium">
                      {{ profileForm.phone_number || 'Not set' }}
                    </div>
                    <input
                      v-else
                      v-model="profileForm.phone_number"
                      type="tel"
                      class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-slate-400"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div v-if="editingField === 'phone_number'" class="flex items-center gap-2 w-full sm:w-auto sm:mt-7">
                    <button
                      type="button"
                      @click="cancelEdit('phone_number')"
                      class="flex-1 sm:flex-none px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      @click="saveEdit('phone_number')"
                      class="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Save
                    </button>
                  </div>
                  <button
                    v-else
                    type="button"
                    @click="startEdit('phone_number')"
                    class="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow sm:mt-7"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <!-- Telegram URL Field -->
              <div class="border-b border-slate-200 pb-8">
                <div class="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                  <div class="flex-1 w-full">
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Telegram URL</label>
                    <div v-if="!editingField || editingField !== 'telegram_link'" class="text-base text-slate-900 font-medium break-all">
                      {{ profileForm.telegram_link || 'Not set' }}
                    </div>
                    <input
                      v-else
                      v-model="profileForm.telegram_link"
                      type="text"
                      class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-slate-400"
                      placeholder="t.me/yourusername or @yourusername"
                    />
                  </div>
                  <div v-if="editingField === 'telegram_link'" class="flex items-center gap-2 w-full sm:w-auto sm:mt-7">
                    <button
                      type="button"
                      @click="cancelEdit('telegram_link')"
                      class="flex-1 sm:flex-none px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      @click="saveEdit('telegram_link')"
                      class="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Save
                    </button>
                  </div>
                  <button
                    v-else
                    type="button"
                    @click="startEdit('telegram_link')"
                    class="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow sm:mt-7"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <!-- Payment URL Field -->
              <div v-if="authStore.user?.is_partner">
                <div class="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                  <div class="flex-1 w-full">
                    <label class="block text-sm font-semibold text-slate-700 mb-2">Payment URL</label>
                    <div v-if="!editingField || editingField !== 'payment_link'" class="text-base text-slate-900 font-medium break-all">
                      {{ profileForm.payment_link || 'Not set' }}
                    </div>
                    <input
                      v-else
                      v-model="profileForm.payment_link"
                      type="text"
                      class="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-slate-400"
                      placeholder="your-payment-platform.com/username"
                    />
                  </div>
                  <div v-if="editingField === 'payment_link'" class="flex items-center gap-2 w-full sm:w-auto sm:mt-7">
                    <button
                      type="button"
                      @click="cancelEdit('payment_link')"
                      class="flex-1 sm:flex-none px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      @click="saveEdit('payment_link')"
                      class="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Save
                    </button>
                  </div>
                  <button
                    v-else
                    type="button"
                    @click="startEdit('payment_link')"
                    class="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-300 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow sm:mt-7"
                  >
                    Edit
                  </button>
                </div>
              </div>

            </form>
        </BaseCard>
      </div>
    </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../components/MainLayout.vue'
import BaseCard from '../components/BaseCard.vue'
import { useAuthStore } from '../stores/auth'
import { uploadService } from '../services/upload'
import { apiService } from '../services/api'
import { inputValidator, validationRules } from '../utils/inputValidation'

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

// Add editing state and original values for canceling
const editingField = ref<string | null>(null)
const originalValues = ref<any>({})

// UI state
const successMessage = ref('')
const errorMessage = ref('')
const uploadLoading = ref(false)
const fileInput = ref<HTMLInputElement>()
const profilePicturePreview = ref<string>('')
const fieldErrors = ref<Record<string, string[]>>({})
const profilePictureTimestamp = ref(Date.now()) // Track when profile picture changes

// Logo upload state
const logoUploadLoading = ref(false)
const logoFileInput = ref<HTMLInputElement>()
const logoPreview = ref<string>('')
const logoTimestamp = ref(Date.now()) // Track when logo changes

// Computed properties
const fullName = computed(() => {
  const first = profileForm.value.first_name || ''
  const last = profileForm.value.last_name || ''
  return `${first} ${last}`.trim()
})

// Profile picture URL with cache busting to force browser refresh
const profilePictureUrl = computed(() => {
  if (profilePicturePreview.value) {
    return profilePicturePreview.value
  }

  if (authStore.user?.profile_picture) {
    const baseUrl = apiService.getProfilePictureUrl(authStore.user.profile_picture)
    if (baseUrl) {
      // Add timestamp to bust browser cache when image changes
      const separator = baseUrl.includes('?') ? '&' : '?'
      return `${baseUrl}${separator}t=${profilePictureTimestamp.value}`
    }
  }

  return null
})

// Logo URL with cache busting to force browser refresh
const logoUrl = computed(() => {
  if (logoPreview.value) {
    return logoPreview.value
  }

  if (authStore.user?.logo) {
    const baseUrl = apiService.getProfilePictureUrl(authStore.user.logo)
    if (baseUrl) {
      // Add timestamp to bust browser cache when image changes
      const separator = baseUrl.includes('?') ? '&' : '?'
      return `${baseUrl}${separator}t=${logoTimestamp.value}`
    }
  }

  return null
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
    bio: validationRules.bio,
  })
})

// Enter edit mode for a field
const startEdit = (field: string) => {
  // Store original values for potential cancel
  if (field === 'name') {
    originalValues.value = {
      first_name: profileForm.value.first_name,
      last_name: profileForm.value.last_name,
    }
  } else {
    originalValues.value = {
      [field]: profileForm.value[field as keyof typeof profileForm.value],
    }
  }
  editingField.value = field
}

// Save the field
const saveEdit = async (field: string) => {
  await handleFieldUpdate(field)
  if (!errorMessage.value) {
    editingField.value = null
    originalValues.value = {}
  }
}

// Cancel editing and restore original values
const cancelEdit = (field: string) => {
  if (field === 'name') {
    profileForm.value.first_name = originalValues.value.first_name || ''
    profileForm.value.last_name = originalValues.value.last_name || ''
  } else {
    profileForm.value[field as keyof typeof profileForm.value] = originalValues.value[field] || ''
  }
  editingField.value = null
  originalValues.value = {}
}

// Handle individual field update
const handleFieldUpdate = async (field: string) => {
  try {
    errorMessage.value = ''
    let updateData: any = {}

    if (field === 'name') {
      // Validate name fields
      if (!profileForm.value.first_name?.trim()) {
        errorMessage.value = 'First name is required'
        return
      }
      updateData = {
        first_name: profileForm.value.first_name.trim(),
        last_name: profileForm.value.last_name?.trim() || '',
      }
    } else if (field === 'email') {
      // Validate email
      if (!profileForm.value.email?.trim()) {
        errorMessage.value = 'Email is required'
        return
      }
      updateData = { email: profileForm.value.email.trim() }
    } else if (field === 'username') {
      // Validate username
      if (!profileForm.value.username?.trim()) {
        errorMessage.value = 'Username is required'
        return
      }
      updateData = { username: profileForm.value.username.trim() }
    } else if (field === 'bio') {
      // Bio is optional
      const bioValue = profileForm.value.bio?.trim() || ''
      updateData = { bio: bioValue }
    } else if (field === 'telegram_link') {
      // Format telegram link properly
      let telegramValue = profileForm.value.telegram_link?.trim() || ''

      if (telegramValue) {
        // Auto-format telegram links
        if (!telegramValue.startsWith('http')) {
          if (telegramValue.startsWith('t.me/') || telegramValue.startsWith('telegram.me/')) {
            telegramValue = 'https://' + telegramValue
          } else if (telegramValue.startsWith('@')) {
            telegramValue = 'https://t.me/' + telegramValue.substring(1)
          } else if (!telegramValue.includes('/')) {
            telegramValue = 'https://t.me/' + telegramValue
          }
        }
      }

      updateData = { telegram_link: telegramValue }
    } else if (field === 'payment_link') {
      // Format payment link properly
      let paymentValue = profileForm.value.payment_link?.trim() || ''

      if (paymentValue && !paymentValue.startsWith('http')) {
        paymentValue = 'https://' + paymentValue
      }

      updateData = { payment_link: paymentValue }
    } else if (field === 'phone_number') {
      // Phone number is optional
      updateData = { phone_number: profileForm.value.phone_number?.trim() || '' }
    }

    const result = await authStore.updateProfile(updateData)
    if (result.success) {
      // Form will be synced automatically by the watcher on authStore.user
      // The watcher will trigger once editingField is cleared by saveEdit()

      successMessage.value = 'Updated successfully!'
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      console.error('Failed to update field:', result.error)
      errorMessage.value = result.error || 'Failed to update'
    }
  } catch (error) {
    console.error('Error updating field:', error)
    errorMessage.value = 'An error occurred'
  }
}


// Sync profileForm with authStore.user whenever it changes
const syncFormWithStore = () => {
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
}

// Initialize form with user data
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/signin')
    return
  }

  syncFormWithStore()
})

// Watch for changes to authStore.user and sync the form
watch(
  () => authStore.user,
  (newUser) => {
    if (newUser && !editingField.value) {
      // Only sync if not currently editing a field to avoid overwriting user's input
      syncFormWithStore()
    }
  },
  { deep: true }
)

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

      // Form will be synced automatically by the watcher on authStore.user

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
      // The API can return the user object in different formats:
      // Format 1: { user: {...} } - nested user object
      // Format 2: { id, email, ... } - direct user object
      let userData = null

      if (response.data.user && response.data.user.id) {
        // Nested user object
        userData = response.data.user
      } else if (response.data.id && response.data.email) {
        // Direct user object
        userData = response.data
      }

      if (userData) {
        // Update the entire user in the store
        authStore.setUser(userData as any)
      } else {
        // Fallback: just update profile_picture field
        const profilePictureUrl = response.data.profile_picture || response.data.url
        await authStore.updateProfile({ profile_picture: profilePictureUrl })
      }

      // Wait for Vue to update the DOM, then update timestamp and clear preview
      await nextTick()

      // Update timestamp to force image reload
      profilePictureTimestamp.value = Date.now()

      // Clear preview AFTER store is updated
      profilePicturePreview.value = ''

      successMessage.value = 'Profile picture updated successfully!'

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

    // Wait for Vue to update
    await nextTick()

    // Update timestamp to force UI refresh
    profilePictureTimestamp.value = Date.now()
    profilePicturePreview.value = ''

    successMessage.value = 'Profile picture removed successfully!'

    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    errorMessage.value = 'Failed to remove profile picture'
  }
}

// Image error handler
const handleImageError = (event: Event) => {
  console.error('Image failed to load:', (event.target as HTMLImageElement)?.src)
  errorMessage.value = 'Failed to load profile picture. Please try refreshing the page.'
}

// Image load handler - Silent success, no logging needed
const handleImageLoad = () => {
  // Image loaded successfully
}

// Logo upload handlers
const triggerLogoUpload = () => {
  logoFileInput.value?.click()
}

const handleLogoFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  try {
    logoUploadLoading.value = true
    errorMessage.value = ''

    // Create preview first for better UX
    const reader = new FileReader()
    reader.onload = (e) => {
      logoPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)

    // Upload file with enhanced security validation
    const response = await uploadService.uploadLogo(file)

    if (response.success && response.data) {
      // The API can return the user object in different formats
      let userData = null

      if (response.data.user && response.data.user.id) {
        userData = response.data.user
      } else if (response.data.id && response.data.email) {
        userData = response.data
      }

      if (userData) {
        authStore.setUser(userData as any)
      } else {
        const logoUrl = response.data.logo || response.data.url
        await authStore.updateProfile({ logo: logoUrl })
      }

      await nextTick()
      logoTimestamp.value = Date.now()
      logoPreview.value = ''

      successMessage.value = 'Logo updated successfully!'

      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = response.message || 'Failed to upload logo'
      logoPreview.value = ''
    }
  } catch (error) {
    console.error('Logo upload error:', error)
    errorMessage.value = 'Failed to upload logo'
    logoPreview.value = ''
  } finally {
    logoUploadLoading.value = false
    if (target) target.value = ''
  }
}

const removeLogo = async () => {
  try {
    errorMessage.value = ''

    await authStore.updateProfile({ logo: '' })

    await nextTick()

    logoTimestamp.value = Date.now()
    logoPreview.value = ''

    successMessage.value = 'Logo removed successfully!'

    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (error) {
    errorMessage.value = 'Failed to remove logo'
  }
}

// Logo image error handler
const handleLogoImageError = (event: Event) => {
  console.error('Logo failed to load:', (event.target as HTMLImageElement)?.src)
  errorMessage.value = 'Failed to load logo. Please try refreshing the page.'
}

// Logo image load handler
const handleLogoImageLoad = () => {
  // Logo loaded successfully
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