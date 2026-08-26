<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="drawer-backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="!showCropper && closeDrawer()"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="drawer-panel">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[32.5rem] laptop-sm:w-[35rem] laptop-md:w-[38.75rem] desktop:w-[42.5rem] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center justify-between px-3 py-2.5">
            <!-- Left: Close button & Title -->
            <div class="flex items-center gap-2 min-w-0">
              <button
                @click="closeDrawer"
                class="p-1.5 hover:bg-white/20 rounded-lg drawer-close flex-shrink-0"
                :title="t('management.hostsDrawer.close')"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <h2 class="text-base font-semibold text-white truncate">
                {{ isEditMode ? t('management.hostsDrawer.titleEdit') : t('management.hostsDrawer.titleAdd') }}
              </h2>
            </div>
            <!-- Right: Delete (edit mode only) -->
            <button
              v-if="isEditMode && host"
              type="button"
              @click="handleDelete"
              :title="t('management.hostsDrawer.deleteBtn')"
              :aria-label="t('management.hostsDrawer.deleteBtn')"
              class="p-1.5 hover:bg-white/20 rounded-lg drawer-close flex-shrink-0"
            >
              <Trash2 class="w-5 h-5 text-white" aria-hidden="true" />
            </button>
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
                {{ t('management.hostsDrawer.dismiss') }}
              </button>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="p-3 laptop-sm:p-4 space-y-4 laptop-sm:space-y-5 pb-24">
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

            <!-- One seamless editor card per language (EditEventTextDrawer pattern) -->
            <div class="border-t border-slate-100 pt-4 laptop-sm:pt-5 space-y-4">
              <div
                v-for="entry in languageEntries"
                :key="entry.lang"
                class="rounded-xl border border-slate-200 bg-white transition-all focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-100"
              >
                <!-- Card header: language + compact actions -->
                <div class="flex items-center justify-between gap-2 pl-4 pr-2 pt-2.5">
                  <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {{ languageLabel(entry.lang) }}
                  </span>
                  <div class="flex items-center gap-0.5">
                    <button
                      v-if="!entry.isBase && canCopyFromEnglish"
                      type="button"
                      @click="copyFromEnglish(entry.model)"
                      class="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors"
                    >
                      <Copy class="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{{ t('management.hostsDrawer.languages.copyFromEnglish') }}</span>
                    </button>
                    <button
                      v-if="!entry.isBase"
                      type="button"
                      @click="removeTranslation(entry.index)"
                      :aria-label="t('management.hostsDrawer.languages.removeAria', { language: languageLabel(entry.lang) })"
                      class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 class="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <!-- Seamless fields: the card is the input.
                     Title comes before name to match the showcase display order. -->
                <div class="px-4 pb-2 pt-1 divide-y divide-slate-100">
                  <div class="py-1.5 flex items-center gap-2">
                    <Briefcase class="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                    <input
                      v-model="entry.model.title"
                      type="text"
                      class="flex-1 min-w-0 p-0 py-1 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0"
                      :placeholder="entry.isBase
                        ? t('management.hostsDrawer.fields.titlePlaceholder')
                        : t('management.hostsDrawer.fields.titlePlaceholderLang', { lang: languageLabel(entry.lang) })"
                      :aria-label="t('management.hostsDrawer.fields.title')"
                    />
                  </div>

                  <div class="py-1">
                    <input
                      v-model="entry.model.name"
                      type="text"
                      :required="entry.isBase"
                      :aria-invalid="entry.isBase && fieldErrors?.name ? 'true' : 'false'"
                      class="w-full p-0 py-1 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent border-0 focus:outline-none focus:ring-0"
                      :placeholder="entry.isBase
                        ? t('management.hostsDrawer.fields.namePlaceholder')
                        : t('management.hostsDrawer.fields.namePlaceholderLang', { lang: languageLabel(entry.lang) })"
                      :aria-label="t('management.hostsDrawer.fields.name')"
                    />
                    <div v-if="entry.isBase && fieldErrors?.name" role="alert" class="pb-1">
                      <p v-for="error in fieldErrors.name" :key="error" class="text-xs text-red-600">
                        {{ error }}
                      </p>
                    </div>
                  </div>

                  <div v-if="showParentFields" class="py-1.5 flex items-center gap-2">
                    <Users class="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                    <input
                      v-model="entry.model.parent_a_name"
                      type="text"
                      class="flex-1 min-w-0 p-0 py-1 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0"
                      :placeholder="entry.isBase
                        ? t('management.hostsDrawer.fields.parentANamePlaceholder')
                        : t('management.hostsDrawer.fields.parentANamePlaceholderLang', { lang: languageLabel(entry.lang) })"
                      :aria-label="t('management.hostsDrawer.fields.parentAName')"
                    />
                    <span class="text-slate-300 flex-shrink-0" aria-hidden="true">&amp;</span>
                    <input
                      v-model="entry.model.parent_b_name"
                      type="text"
                      class="flex-1 min-w-0 p-0 py-1 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0"
                      :placeholder="entry.isBase
                        ? t('management.hostsDrawer.fields.parentBNamePlaceholder')
                        : t('management.hostsDrawer.fields.parentBNamePlaceholderLang', { lang: languageLabel(entry.lang) })"
                      :aria-label="t('management.hostsDrawer.fields.parentBName')"
                    />
                  </div>

                  <div class="py-1">
                    <textarea
                      v-model="entry.model.bio"
                      rows="2"
                      class="w-full p-0 py-1 text-sm text-slate-700 leading-relaxed placeholder:text-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none min-h-[48px] [field-sizing:content]"
                      :placeholder="entry.isBase
                        ? t('management.hostsDrawer.fields.biographyPlaceholder')
                        : t('management.hostsDrawer.fields.biographyPlaceholderLang', { lang: languageLabel(entry.lang) })"
                      :aria-label="t('management.hostsDrawer.fields.biography')"
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- Add Language -->
              <div v-if="availableLanguagesForAdd.length > 0" class="relative">
                <button
                  type="button"
                  @click="showLanguageMenu = !showLanguageMenu"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 border border-dashed border-slate-300 rounded-full hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-50 transition-all"
                >
                  <Plus class="w-3.5 h-3.5" aria-hidden="true" />
                  {{ t('management.hostsDrawer.languages.add') }}
                </button>

                <div v-if="showLanguageMenu" class="fixed inset-0 z-[90]" @click="showLanguageMenu = false"></div>
                <Transition name="dropdown">
                  <div
                    v-if="showLanguageMenu"
                    class="absolute top-full left-0 mt-2 min-w-[12.5rem] bg-white border border-slate-200 rounded-xl shadow-xl z-[100] max-h-[17.5rem] overflow-y-auto py-1"
                    role="menu"
                    :aria-label="t('management.hostsDrawer.languages.menuAria')"
                  >
                    <button
                      v-for="lang in availableLanguagesForAdd"
                      :key="lang.code"
                      type="button"
                      role="menuitem"
                      @click="addLanguage(lang.code)"
                      class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200 text-left"
                    >
                      {{ languageLabel(lang.code) }}
                    </button>
                  </div>
                </Transition>
              </div>
            </div>

            <!-- Position Control (Mobile Only) -->
            <div v-if="maxOrder > 0" class="border-t border-slate-100 pt-4 laptop-sm:pt-5 sm:hidden">
              <label class="block text-sm font-medium text-slate-700 mb-2">
                <span class="flex items-center gap-1.5">
                  <ArrowUpDown class="w-3.5 h-3.5" aria-hidden="true" />
                  {{ t('management.hostsDrawer.position.label') }}
                </span>
              </label>
              <div class="flex items-center gap-2">
                <!-- Move to First -->
                <button
                  type="button"
                  @click="moveToFirst"
                  :disabled="formData.order <= 0"
                  class="p-2 rounded-lg border transition-all duration-150"
                  :class="formData.order <= 0
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 active:bg-slate-200'"
                  :title="t('management.hostsDrawer.position.moveToFirst')"
                >
                  <ChevronsUp class="w-4 h-4" />
                </button>

                <!-- Move Up -->
                <button
                  type="button"
                  @click="moveUp"
                  :disabled="formData.order <= 0"
                  class="p-2 rounded-lg border transition-all duration-150"
                  :class="formData.order <= 0
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 active:bg-slate-200'"
                  :title="t('management.hostsDrawer.position.moveUp')"
                >
                  <ChevronUp class="w-4 h-4" />
                </button>

                <!-- Position Display -->
                <div class="flex-1 text-center">
                  <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg">
                    <span class="text-sm font-semibold text-slate-900">{{ formData.order + 1 }}</span>
                    <span class="text-xs text-slate-500">{{ t('management.hostsDrawer.position.of') }} {{ maxOrder + 1 }}</span>
                  </span>
                </div>

                <!-- Move Down -->
                <button
                  type="button"
                  @click="moveDown"
                  :disabled="formData.order >= maxOrder"
                  class="p-2 rounded-lg border transition-all duration-150"
                  :class="formData.order >= maxOrder
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 active:bg-slate-200'"
                  :title="t('management.hostsDrawer.position.moveDown')"
                >
                  <ChevronDown class="w-4 h-4" />
                </button>

                <!-- Move to Last -->
                <button
                  type="button"
                  @click="moveToLast"
                  :disabled="formData.order >= maxOrder"
                  class="p-2 rounded-lg border transition-all duration-150"
                  :class="formData.order >= maxOrder
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 active:bg-slate-200'"
                  :title="t('management.hostsDrawer.position.moveToLast')"
                >
                  <ChevronsDown class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Contact Information Section -->
            <div class="border-t border-slate-100 pt-4 laptop-sm:pt-5">
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
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <div class="flex items-center justify-between">
            <button
              @click="handleSubmit"
              :disabled="loading || !formData.name"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 drawer-action shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader v-if="loading" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              <span>{{ loading ? (isEditMode ? t('management.hostsDrawer.updating') : t('management.hostsDrawer.creating')) : (isEditMode ? t('management.hostsDrawer.updateBtn') : t('management.hostsDrawer.createBtn')) }}</span>
            </button>

            <button
              type="button"
              @click="closeDrawer"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
            >
              {{ t('management.hostsDrawer.cancel') }}
            </button>
          </div>
        </div>

        <!-- Success/Error Toast -->
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
import { ref, computed, onMounted, onBeforeUnmount, toRef, watch } from 'vue'
import {
  ArrowRight,
  AlertCircle,
  Loader,
  Save,
  Copy,
  Plus,
  Trash2,
  Briefcase,
  Users,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
} from 'lucide-vue-next'
import type { EventHost, HostTranslation } from '@/services/api'
import { apiService } from '@/services/api'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()

// Composables
import { useHostForm } from '@/composables/useHostForm'
import { useTranslations } from '@/composables/useTranslations'
import { useProfilePictureUpload } from '@/composables/useProfilePictureUpload'

// Child components
import ProfilePictureSection from './host/ProfilePictureSection.vue'
import ContactSection from './host/ContactSection.vue'
import ImageCropperModal from './common/ImageCropperModal.vue'
import { useToast } from '@/composables/useToast'

interface Props {
  modelValue: boolean
  eventId: string
  host?: EventHost
  eventCategory?: string
  existingHosts?: EventHost[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'updated', host: EventHost): void
  (e: 'created', host: EventHost): void
  (e: 'delete', host: EventHost): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Message state for toast notifications

// Use composables
const {
  formData,
  loading,
  isEditMode,
  maxOrder,
  fieldErrors,
  generalError,
  emailError,
  validateEmail,
  createHost,
  updateHost,
  resetErrors,
  resetForm,
} = useHostForm(props.eventId, props.host, props.existingHosts)

const defaultTranslation: Omit<HostTranslation, 'id' | 'host' | 'created_at' | 'updated_at'> = {
  language: '',
  name: '',
  parent_a_name: '',
  parent_b_name: '',
  title: '',
  bio: '',
}

const {
  availableLanguagesForAdd,
  getLanguageName,
  removeTranslation,
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

// Show parent fields only for wedding and birthday events
const showParentFields = computed(() => {
  const category = props.eventCategory?.toLowerCase() || ''
  return category === 'wedding' || category === 'birthday'
})

// Local UI state
const contactOpen = ref(false)
const showLanguageMenu = ref(false)

// Mobile position control (mirrors the agenda drawer's move-up/down control)
const moveUp = () => {
  if (formData.order > 0) formData.order -= 1
}

const moveDown = () => {
  if (formData.order < maxOrder.value) formData.order += 1
}

const moveToFirst = () => {
  formData.order = 0
}

const moveToLast = () => {
  formData.order = maxOrder.value
}

// --- Per-language editor cards (EditEventTextDrawer pattern) ---

// The translatable text fields shared by the base host and its translations
interface HostTextFields {
  name: string
  title: string
  parent_a_name: string
  parent_b_name: string
  bio: string
}

// English (base fields) first, then one card per translation
const languageEntries = computed(() => [
  { lang: 'en', model: formData as HostTextFields, isBase: true, index: -1 },
  ...formData.translations.map((translation, index) => ({
    lang: translation.language,
    model: translation as HostTextFields,
    isBase: false,
    index,
  })),
])

// Prefer the showcase-texts localized language names, falling back to the
// composable's English names for languages without a locale entry
const languageLabel = (code: string): string =>
  t(`management.eventTextTab.languages.${code}`, getLanguageName(code))

const addLanguage = (code: string) => {
  if (!formData.translations.some((translation) => translation.language === code)) {
    formData.translations.push({ ...defaultTranslation, language: code })
  }
  showLanguageMenu.value = false
}

const canCopyFromEnglish = computed(
  () =>
    !!(
      formData.name ||
      formData.title ||
      formData.parent_a_name ||
      formData.parent_b_name ||
      formData.bio
    ),
)

const copyFromEnglish = (model: HostTextFields) => {
  model.name = formData.name
  model.title = formData.title
  model.parent_a_name = formData.parent_a_name
  model.parent_b_name = formData.parent_b_name
  model.bio = formData.bio
}

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
const { showToast } = useToast()

const showMessage = (type: 'success' | 'error', text: string) => {
  showToast(type, text)
}

// Close drawer
const closeDrawer = () => {
  emit('update:modelValue', false)
}

// Hand deletion to the parent (which owns the confirm modal), then close
const handleDelete = () => {
  if (props.host) {
    emit('delete', props.host)
    closeDrawer()
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

  if (result.success) {
    if (result.data) {
      // Actual update/create happened
      if (isEditMode.value) {
        emit('updated', result.data)
        showMessage('success', t('management.hostsDrawer.toast.updateSuccess'))
      } else {
        emit('created', result.data)
        showMessage('success', t('management.hostsDrawer.toast.createSuccess'))
      }
      setTimeout(() => {
        closeDrawer()
      }, 1000)
    } else if (result.message === 'No changes to save') {
      // No changes were made - just inform user, don't close
      showMessage('success', t('management.hostsDrawer.toast.noChanges'))
    }
  } else {
    showMessage('error', result.message || t('management.hostsDrawer.toast.error'))
  }
}

// Calculate scrollbar width to prevent layout shift
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return
  if (showLanguageMenu.value) {
    showLanguageMenu.value = false
    return
  }
  // Let the cropper modal own Escape while it's open
  if (showCropper.value) return
  closeDrawer()
}

// Watch for drawer open/close
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      // Reset form with current host data when drawer opens
      resetForm(props.host, props.existingHosts)
      // Reset profile picture state
      resetProfilePicture(props.host?.profile_image || undefined)
      // Reset UI state
      contactOpen.value = false
      showLanguageMenu.value = false

      const scrollbarWidth = getScrollbarWidth()
      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
      document.addEventListener('keydown', handleKeydown)
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      document.removeEventListener('keydown', handleKeydown)
    }
  }
)

// Reset error states when drawer opens
onMounted(() => {
  resetErrors()
})

// Cleanup if component unmounts while drawer is open
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>

/* Dropdown transition for the add-language menu */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
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
}</style>
