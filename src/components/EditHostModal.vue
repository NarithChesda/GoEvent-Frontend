<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="true" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <UserPen v-if="isEditMode" class="w-4.5 h-4.5" />
                    <UserPlus v-else class="w-4.5 h-4.5" />
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">
                    {{ isEditMode ? 'Edit Host' : 'Add Host' }}
                  </h2>
                </div>
                <button
                  @click="$emit('close')"
                  class="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <!-- General error banner -->
              <div v-if="generalError" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-red-700">{{ generalError }}</p>
                  <button
                    type="button"
                    @click="generalError = ''"
                    class="text-xs text-red-600 hover:text-red-700 underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              <!-- Profile Picture Section -->
              <ProfilePictureSection
                :profile-picture-preview="profilePicturePreview"
                :profile-image="formData.profile_image"
                :profile-picture-uploading="profilePictureUploading"
                :profile-picture-input="profilePictureInput"
                @trigger-upload="triggerProfilePictureUpload"
                @select-image="handleProfilePictureSelect"
                @crop-image="handleCropExistingImage"
                @remove-image="removeProfilePicture(toRef(formData, 'profile_image'))"
                @update:profile-picture-input="profilePictureInput = $event"
              />

              <!-- Language Tabs Section -->
              <LanguageTabs
                :active-tab="activeTab"
                :translations="formData.translations"
                :show-add-translation="showAddTranslation"
                :new-translation="newTranslation"
                :available-languages-for-add="availableLanguagesForAdd"
                :get-language-name="getLanguageName"
                @update:active-tab="activeTab = $event"
                @update:show-add-translation="showAddTranslation = $event"
                @update:new-translation="Object.assign(newTranslation, $event)"
                @add-translation="addTranslation"
                @remove-translation="removeTranslation"
                @focus-next-tab="focusNextTab"
                @focus-previous-tab="focusPreviousTab"
              />

              <!-- Form Content -->
              <div class="space-y-5">
                <!-- English Content (Default Language) -->
                <div
                  v-if="activeTab === 'en'"
                  role="tabpanel"
                  id="tabpanel-en"
                  aria-labelledby="tab-en"
                  tabindex="0"
                  class="space-y-5"
                >
                  <HostFormFields
                    v-model:title="formData.title"
                    v-model:name="formData.name"
                    v-model:parent-a-name="formData.parent_a_name"
                    v-model:parent-b-name="formData.parent_b_name"
                    v-model:bio="formData.bio"
                    :field-errors="fieldErrors"
                    :bio-open="bioOpen"
                    @update:bio-open="bioOpen = $event"
                  />
                </div>

                <!-- Other Language Tabs Content -->
                <div
                  v-for="(translation, index) in formData.translations"
                  :key="translation.id || index"
                  v-show="activeTab === translation.language"
                  role="tabpanel"
                  :id="'tabpanel-' + translation.language"
                  :aria-labelledby="'tab-' + translation.language"
                  tabindex="0"
                  class="space-y-5"
                >
                  <HostFormFields
                    v-model:title="translation.title"
                    v-model:name="translation.name"
                    v-model:parent-a-name="translation.parent_a_name"
                    v-model:parent-b-name="translation.parent_b_name"
                    v-model:bio="translation.bio"
                    :language-name="getLanguageName(translation.language)"
                    :bio-open="bioOpen"
                    @update:bio-open="bioOpen = $event"
                  />
                </div>
              </div>

              <!-- Contact Information Section -->
              <ContactSection
                v-model:email="formData.email"
                v-model:linkedin-url="formData.linkedin_url"
                v-model:twitter-url="formData.twitter_url"
                v-model:website-url="formData.website_url"
                :contact-open="contactOpen"
                :email-error="emailError"
                @update:contact-open="contactOpen = $event"
                @validate-email="validateEmail"
              />

              <!-- Action Buttons -->
              <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="loading || !formData.name"
                  class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <span
                    v-if="loading"
                    class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  {{ loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Host' : 'Create Host') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Image Cropper Modal -->
    <ImageCropperModal
      v-if="showCropper"
      :show="showCropper"
      :image-source="cropperImage || ''"
      title="Crop Avatar"
      :aspect-ratio="1"
      help-text="Adjust the crop area to frame your avatar image"
      @close="closeCropper"
      @apply="handleCropApply"
      @update:cropper-ref="setCropperRef"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, toRef } from 'vue'
import { X, UserPen, UserPlus, AlertCircle } from 'lucide-vue-next'
import type { EventHost, HostTranslation } from '@/services/api'
import { apiService } from '@/services/api'

// Composables
import { useHostForm } from '@/composables/useHostForm'
import { useTranslations } from '@/composables/useTranslations'
import { useProfilePictureUpload } from '@/composables/useProfilePictureUpload'

// Child components
import ProfilePictureSection from './host/ProfilePictureSection.vue'
import LanguageTabs from './host/LanguageTabs.vue'
import HostFormFields from './host/HostFormFields.vue'
import ContactSection from './host/ContactSection.vue'
import ImageCropperModal from './common/ImageCropperModal.vue'

interface Props {
  eventId: string
  host?: EventHost
}

interface Emits {
  close: []
  updated: [host: EventHost]
  created: [host: EventHost]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Use composables
const {
  formData,
  loading,
  isEditMode,
  fieldErrors,
  generalError,
  emailError,
  validateEmail,
  createHost,
  updateHost,
  resetErrors,
} = useHostForm(props.eventId, props.host)

const defaultTranslation: Omit<HostTranslation, 'id' | 'host' | 'created_at' | 'updated_at'> = {
  language: '',
  name: '',
  parent_a_name: '',
  parent_b_name: '',
  title: '',
  bio: '',
}

const {
  activeTab,
  showAddTranslation,
  newTranslation,
  availableLanguagesForAdd,
  getLanguageName,
  addTranslation,
  removeTranslation,
  focusNextTab,
  focusPreviousTab,
} = useTranslations(toRef(formData, 'translations'), defaultTranslation)

const {
  profilePictureInput,
  profilePicturePreview,
  profilePictureUploading,
  selectedProfileImageFile,
  imageRemoved,
  showCropper,
  cropperImage,
  closeCropper,
  setCropperRef,
  triggerProfilePictureUpload,
  handleProfilePictureSelect,
  removeProfilePicture,
  handleCropApply,
  validateFileSize,
  openCropperWithExistingImage,
} = useProfilePictureUpload(props.host?.profile_image || undefined, true) // Enable cropping

// Local UI state
const bioOpen = ref(false)
const contactOpen = ref(false)

// Handle cropping existing image
const handleCropExistingImage = () => {
  // Determine which image to crop: preview (if new image uploaded) or existing profile_image
  let imageUrl = profilePicturePreview.value

  // If no preview, use the existing profile_image with full URL
  if (!imageUrl && formData.profile_image) {
    imageUrl = apiService.getProfilePictureUrl(formData.profile_image)
  }

  if (imageUrl && openCropperWithExistingImage) {
    openCropperWithExistingImage(imageUrl)
  }
}

// Unified submit handler
const handleSubmit = async () => {
  // Validate file size before submission
  const fileSizeValidation = validateFileSize()
  if (!fileSizeValidation.valid) {
    generalError.value = fileSizeValidation.error || 'Image file size is too large'
    return
  }

  const result = isEditMode.value
    ? await updateHost(selectedProfileImageFile.value, imageRemoved.value)
    : await createHost(selectedProfileImageFile.value)

  if (result.success && result.data) {
    if (isEditMode.value) {
      emit('updated', result.data)
    } else {
      emit('created', result.data)
    }
  }
}

// Reset error states when modal opens
onMounted(() => {
  resetErrors()
})
</script>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.2s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 1000px;
  opacity: 1;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Custom scrollbar for modal content */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Custom scrollbar for tab headers */
.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
