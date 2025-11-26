<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="!showCropper && closeDrawer()"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[580px] lg:w-[640px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2">
              <button
                @click="closeDrawer"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-semibold text-white">
                  {{ isEditMode ? 'Edit Host' : 'Add Host' }}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <!-- General error banner -->
          <div v-if="generalError" class="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
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

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="p-4 space-y-5 pb-24">
            <!-- Profile Picture Section -->
            <div>
              <ProfilePictureSection
                :profile-picture-preview="profilePicturePreview"
                :profile-image="profileImageFullUrl"
                :profile-picture-uploading="profilePictureUploading"
                :profile-picture-input="profilePictureInput || undefined"
                @trigger-upload="triggerProfilePictureUpload"
                @select-image="handleProfilePictureSelect"
                @crop-image="handleCropExistingImage"
                @remove-image="handleRemoveProfilePicture"
                @update:profile-picture-input="profilePictureInput = $event"
              />
            </div>

            <!-- Language Tabs Section -->
            <div class="border-t border-slate-100 pt-5">
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
            </div>

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
            <div class="border-t border-slate-100 pt-5">
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
            </div>
          </form>
        </div>

        <!-- Footer with Action Buttons -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <button
              @click="handleSubmit"
              :disabled="loading || !formData.name"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader v-if="loading" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              <span>{{ loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Host' : 'Create Host') }}</span>
            </button>

            <button
              type="button"
              @click="closeDrawer"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Success/Error Toast -->
        <Transition name="slide-up">
          <div v-if="message" class="absolute bottom-16 left-4 right-4 z-10">
            <div
              :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
              class="text-white px-3 py-2.5 rounded-lg shadow-lg flex items-center"
            >
              <CheckCircle v-if="message.type === 'success'" class="w-4 h-4 mr-2 flex-shrink-0" />
              <AlertCircle v-else class="w-4 h-4 mr-2 flex-shrink-0" />
              <span class="text-xs">{{ message.text }}</span>
            </div>
          </div>
        </Transition>
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
import { ref, computed, onMounted, toRef, watch } from 'vue'
import { ArrowRight, UserPen, UserPlus, AlertCircle, CheckCircle, Loader, Save } from 'lucide-vue-next'
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
  modelValue: boolean
  eventId: string
  host?: EventHost
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated', host: EventHost): void
  (e: 'created', host: EventHost): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Message state for toast notifications
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

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
  resetForm,
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
  resetProfilePicture,
} = useProfilePictureUpload(props.host?.profile_image || undefined, true) // Enable cropping

// Local UI state
const bioOpen = ref(false)
const contactOpen = ref(false)

// Computed full URL for profile image display
const profileImageFullUrl = computed(() => {
  if (!formData.profile_image || imageRemoved.value) return ''
  return apiService.getProfilePictureUrl(formData.profile_image) || ''
})

// Handle removing profile picture
const handleRemoveProfilePicture = () => {
  // Clear the form data
  formData.profile_image = ''
  // Use the composable's remove function to clear preview and set imageRemoved flag
  removeProfilePicture(toRef(formData, 'profile_image'))
}

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

// Show toast message
const showMessage = (type: 'success' | 'error', text: string) => {
  message.value = { type, text }
  setTimeout(() => {
    message.value = null
  }, 4000)
}

// Close drawer
const closeDrawer = () => {
  emit('update:modelValue', false)
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

  if (result.success) {
    if (result.data) {
      // Actual update/create happened
      if (isEditMode.value) {
        emit('updated', result.data)
        showMessage('success', 'Host updated successfully!')
      } else {
        emit('created', result.data)
        showMessage('success', 'Host created successfully!')
      }
      setTimeout(() => {
        closeDrawer()
      }, 1000)
    } else if (result.message === 'No changes to save') {
      // No changes were made - just inform user, don't close
      showMessage('success', 'No changes to save')
    }
  } else {
    showMessage('error', result.message || 'An error occurred')
  }
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

// Watch for drawer open/close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      // Reset form with current host data when drawer opens
      resetForm(props.host)
      // Reset profile picture state
      resetProfilePicture(props.host?.profile_image || undefined)
      // Reset UI state
      activeTab.value = 'en'
      bioOpen.value = false
      contactOpen.value = false

      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }
)

// Reset error states when drawer opens
onMounted(() => {
  resetErrors()
})
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide from right on desktop, from bottom on mobile */
.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
  }
}

/* Slide up transition for toast */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Custom scrollbar */
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
</style>
