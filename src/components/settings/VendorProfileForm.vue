<template>
  <div class="space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1">
        <div class="flex items-center gap-3 flex-wrap">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ mode === 'create' ? 'Create Vendor Profile' : 'Vendor Profile' }}
          </h2>
          <!-- Verification Status Badge -->
          <span
            v-if="mode === 'edit' && verificationStatus"
            :class="[
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              verificationStatus === 'verified'
                ? 'bg-emerald-100 text-emerald-700'
                : verificationStatus === 'pending'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
            ]"
          >
            <!-- Verified Icon -->
            <svg v-if="verificationStatus === 'verified'" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <!-- Pending Icon -->
            <svg v-else-if="verificationStatus === 'pending'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <!-- Unverified Icon -->
            <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {{ verificationStatus === 'verified' ? 'Verified' : verificationStatus === 'pending' ? 'Pending' : 'Unverified' }}
          </span>
          <!-- Featured Badge -->
          <span
            v-if="mode === 'edit' && vendorProfile?.is_featured"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700"
            :title="featuredUntilText"
          >
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Featured
          </span>
        </div>
        <p class="text-sm text-gray-500 mt-1">
          {{ mode === 'create'
            ? 'Fill in your business details to get started'
            : 'Manage your business profile and contact information'
          }}
        </p>
        <!-- Listings Count (minimalist stat) -->
        <p v-if="mode === 'edit' && vendorProfile?.listings_count" class="text-xs text-gray-400 mt-1">
          {{ vendorProfile.listings_count }} {{ vendorProfile.listings_count === 1 ? 'listing' : 'listings' }}
        </p>
      </div>
      <button
        v-if="mode === 'create'"
        @click="$emit('cancel')"
        class="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2">
      <div class="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span class="font-medium">{{ successMessage }}</span>
    </div>
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
      <div class="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <span class="font-medium">{{ error }}</span>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column - Form Fields (2/3 width) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Business Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Business Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="localForm.business_name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
              placeholder="Your business or brand name"
            />
          </div>

          <!-- Short Tagline -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Short Tagline</label>
            <input
              v-model="localForm.short_tagline"
              type="text"
              maxlength="100"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
              placeholder="A brief description of what you do"
            />
            <p class="mt-1 text-xs text-gray-500">{{ localForm.short_tagline?.length || 0 }}/100 characters</p>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              v-model="localForm.description"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none bg-white"
              placeholder="Tell potential clients about your services, experience, and what makes you unique..."
            ></textarea>
          </div>

          <!-- Contact Information Section -->
          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Email -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Business Email</label>
                <input
                  v-model="localForm.email"
                  type="email"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
                  placeholder="contact@yourbusiness.com"
                />
              </div>

              <!-- Phone -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  v-model="localForm.phone"
                  type="tel"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <!-- Telegram Username -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Telegram Username</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                  <input
                    v-model="localForm.telegram_username"
                    type="text"
                    class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
                    placeholder="yourusername"
                  />
                </div>
              </div>

              <!-- Website -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input
                  v-model="localForm.website"
                  type="url"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
                  placeholder="https://yourbusiness.com"
                />
              </div>
            </div>
          </div>

          <!-- Location Section -->
          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Location</h3>

            <div class="space-y-4">
              <!-- Address -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  v-model="localForm.address"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
                  placeholder="Street address"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- City -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    v-model="localForm.city"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
                    placeholder="City"
                  />
                </div>

                <!-- Country -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input
                    v-model="localForm.country"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Images (1/3 width) -->
        <div class="lg:col-span-1" v-if="mode === 'edit'">
          <div class="sticky top-8 space-y-8">
            <!-- Logo Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3 text-center">Business Logo</label>
              <div class="relative w-32 h-32 mx-auto mb-4">
                <div
                  v-if="logoUrl"
                  class="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-300 shadow-lg"
                >
                  <img
                    :src="logoUrl"
                    alt="Business Logo"
                    class="w-full h-full object-contain p-2"
                    @error="handleLogoError"
                  />
                </div>
                <div
                  v-else
                  class="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300"
                >
                  <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                <!-- Upload button overlay -->
                <button
                  type="button"
                  @click="triggerLogoUpload"
                  :disabled="isSaving"
                  class="absolute bottom-0 right-0 w-10 h-10 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                  </svg>
                </button>
              </div>
              <p class="text-xs text-gray-500 text-center">Recommended: 200x200px, PNG or JPG</p>

              <input
                ref="logoInputRef"
                type="file"
                accept="image/*"
                @change="handleLogoSelect"
                class="hidden"
              />
            </div>

            <!-- Cover Image Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3 text-center">Cover Image</label>
              <div class="relative w-full aspect-video mx-auto mb-4">
                <div
                  v-if="coverImageUrl"
                  class="w-full h-full rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-300 shadow-lg"
                >
                  <img
                    :src="coverImageUrl"
                    alt="Cover Image"
                    class="w-full h-full object-cover"
                    @error="handleCoverError"
                  />
                </div>
                <div
                  v-else
                  class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300"
                >
                  <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                <!-- Upload button overlay -->
                <button
                  type="button"
                  @click="triggerCoverUpload"
                  :disabled="isSaving"
                  class="absolute bottom-2 right-2 w-10 h-10 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                  </svg>
                </button>
              </div>
              <p class="text-xs text-gray-500 text-center">Recommended: 1200x400px, PNG or JPG</p>

              <input
                ref="coverInputRef"
                type="file"
                accept="image/*"
                @change="handleCoverSelect"
                class="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Submit Buttons -->
      <div :class="[
        'flex items-center pt-6 border-t border-gray-200',
        mode === 'create' ? 'justify-between' : 'justify-start'
      ]">
        <button
          type="submit"
          :disabled="isSaving || !isFormValid"
          class="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow flex items-center gap-2"
        >
          <svg v-if="isSaving" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          {{ isSaving ? 'Saving...' : (mode === 'create' ? 'Create Profile' : 'Save Changes') }}
        </button>

        <button
          v-if="mode === 'create'"
          type="button"
          @click="$emit('cancel')"
          class="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { VendorProfile } from '@/services/api/types'
import type { VendorFormData } from '@/composables/settings/useVendorProfile'

interface Props {
  mode: 'create' | 'edit'
  formData: VendorFormData
  vendorProfile?: VendorProfile | null
  isSaving: boolean
  error: string | null
  successMessage: string | null
  logoUrl?: string | null
  coverImageUrl?: string | null
  verificationStatus?: 'unverified' | 'pending' | 'verified' | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: []
  cancel: []
  'upload-logo': [file: File]
  'upload-cover': [file: File]
}>()

// Local form state (synced with parent)
const localForm = ref<VendorFormData>({ ...props.formData })

// Watch for external form data changes
watch(
  () => props.formData,
  (newData) => {
    localForm.value = { ...newData }
  },
  { deep: true }
)

// Sync local changes back to parent form
watch(
  localForm,
  (newForm) => {
    Object.assign(props.formData, newForm)
  },
  { deep: true }
)

// File inputs
const logoInputRef = ref<HTMLInputElement | null>(null)
const coverInputRef = ref<HTMLInputElement | null>(null)

// Image error states
const logoError = ref(false)
const coverError = ref(false)

// Computed
const isFormValid = computed(() => {
  return localForm.value.business_name?.trim().length > 0
})

const featuredUntilText = computed(() => {
  if (!props.vendorProfile?.featured_until) return 'Featured vendor'
  const date = new Date(props.vendorProfile.featured_until)
  return `Featured until ${date.toLocaleDateString()}`
})

// Methods
const triggerLogoUpload = () => {
  logoInputRef.value?.click()
}

const triggerCoverUpload = () => {
  coverInputRef.value?.click()
}

const handleLogoSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    emit('upload-logo', file)
    // Reset input so same file can be selected again
    target.value = ''
  }
}

const handleCoverSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    emit('upload-cover', file)
    // Reset input so same file can be selected again
    target.value = ''
  }
}

const handleLogoError = () => {
  logoError.value = true
}

const handleCoverError = () => {
  coverError.value = true
}

const handleSubmit = () => {
  if (isFormValid.value) {
    emit('submit')
  }
}
</script>
