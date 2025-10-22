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
            <!-- Header (neutral) -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <UserPen class="w-4.5 h-4.5" />
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">Edit Host</h2>
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
            <form @submit.prevent="updateHost" class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div class="space-y-5">
                <!-- Basic Information -->
                <div class="space-y-3">
                  <h4 class="text-sm font-semibold text-slate-900 flex items-center">
                    <User class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Basic Information
                  </h4>

                  <!-- Name -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="formData.name"
                      type="text"
                      required
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                      placeholder="Enter host name"
                    />
                  </div>

                  <!-- Parent Names -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Parent A Name
                      </label>
                      <input
                        v-model="formData.parent_a_name"
                        type="text"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                        placeholder="First parent's name"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Parent B Name
                      </label>
                      <input
                        v-model="formData.parent_b_name"
                        type="text"
                        class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                        placeholder="Second parent's name"
                      />
                    </div>
                  </div>

                  <!-- Title -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      Title/Position
                    </label>
                    <input
                      v-model="formData.title"
                      type="text"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                      placeholder="e.g., Chief Technology Officer"
                    />
                  </div>

                  <!-- Profile Picture -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      Profile Picture
                    </label>
                    <div class="flex items-start space-x-3 sm:space-x-4">
                      <!-- Preview -->
                      <div class="flex-shrink-0">
                        <div
                          v-if="
                            profilePicturePreview ||
                            (formData.profile_image && formData.profile_image !== '')
                          "
                          class="w-20 h-20 rounded-lg overflow-hidden border border-slate-200"
                        >
                          <img
                            :src="profilePicturePreview || formData.profile_image || ''"
                            alt="Profile preview"
                            class="w-full h-full object-cover"
                          />
                        </div>
                        <div
                          v-else
                          class="w-20 h-20 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-lg border border-dashed border-slate-300 flex items-center justify-center"
                        >
                          <User class="w-7 h-7 text-slate-400" />
                        </div>
                      </div>

                      <!-- Upload Controls -->
                      <div class="flex-1 space-y-2">
                        <input
                          ref="profilePictureInput"
                          type="file"
                          accept="image/*"
                          @change="handleProfilePictureSelect"
                          class="hidden"
                        />
                        <div class="flex space-x-2">
                          <button
                            type="button"
                            @click="triggerProfilePictureUpload"
                            :disabled="profilePictureUploading"
                            class="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                          >
                            <Upload class="w-4 h-4" />
                            <span>{{ profilePictureUploading ? 'Uploading...' : 'Upload' }}</span>
                          </button>
                          <button
                            v-if="
                              profilePicturePreview ||
                              (formData.profile_image && formData.profile_image !== '')
                            "
                            type="button"
                            @click="removeProfilePicture"
                            class="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors duration-200"
                          >
                            Remove
                          </button>
                        </div>
                        <p class="text-xs text-slate-500">JPG, PNG, or WebP. Max 3MB.</p>
                      </div>
                    </div>
                  </div>

                  <!-- Biography (collapsible) -->
                  <div class="rounded-xl border border-slate-200 bg-white/70">
                    <button
                      type="button"
                      class="w-full flex items-center justify-between px-4 py-3"
                      @click="bioOpen = !bioOpen"
                      :aria-expanded="bioOpen ? 'true' : 'false'"
                      aria-controls="bio-section"
                    >
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium text-slate-700">Biography</span>
                        <span class="hidden sm:inline text-xs text-slate-500">{{ bioSummary }}</span>
                      </div>
                      <svg
                        class="h-4 w-4 text-slate-500 transition-transform"
                        :class="bioOpen ? 'rotate-180' : ''"
                        viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    <Transition name="collapse">
                      <div v-show="bioOpen" id="bio-section" class="px-4 pb-4">
                        <textarea
                          v-model="formData.bio"
                          rows="4"
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-none"
                          placeholder="Brief biography or description"
                        ></textarea>
                      </div>
                    </Transition>
                  </div>
                </div>

                <!-- Contact Information (collapsible) -->
                <div class="rounded-xl border border-slate-200 bg-white/70">
                  <button
                    type="button"
                    class="w-full flex items-center justify-between px-4 py-3"
                    @click="contactOpen = !contactOpen"
                    :aria-expanded="contactOpen ? 'true' : 'false'"
                    aria-controls="contact-section"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-slate-700">Contact & Social Media</span>
                      <span class="hidden sm:inline text-xs text-slate-500">{{ contactSummary }}</span>
                    </div>
                    <svg
                      class="h-4 w-4 text-slate-500 transition-transform"
                      :class="contactOpen ? 'rotate-180' : ''"
                      viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <Transition name="collapse">
                    <div v-show="contactOpen" id="contact-section" class="px-4 pb-4">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <!-- Email -->
                        <div>
                          <label class="block text-sm font-medium text-slate-700 mb-2"> Email </label>
                          <input
                            v-model="formData.email"
                            type="email"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                            placeholder="email@example.com"
                          />
                        </div>

                        <!-- LinkedIn -->
                        <div>
                          <label class="block text-sm font-medium text-slate-700 mb-2">
                            LinkedIn URL
                          </label>
                          <input
                            v-model="formData.linkedin_url"
                            type="url"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                            placeholder="https://linkedin.com/in/username"
                          />
                        </div>

                        <!-- Twitter -->
                        <div>
                          <label class="block text-sm font-medium text-slate-700 mb-2">
                            Twitter URL
                          </label>
                          <input
                            v-model="formData.twitter_url"
                            type="url"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                            placeholder="https://twitter.com/username"
                          />
                        </div>

                        <!-- Website -->
                        <div>
                          <label class="block text-sm font-medium text-slate-700 mb-2">
                            Website URL
                          </label>
                          <input
                            v-model="formData.website_url"
                            type="url"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                    </div>
                  </Transition>
                </div>

                <!-- Translations Section -->
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h4 class="font-semibold text-slate-900 flex items-center">
                      <Languages class="w-4 h-4 mr-2" />
                      Translations
                    </h4>
                    <button
                      type="button"
                      @click="showAddTranslation = true"
                      class="text-[#1e90ff] hover:text-[#1873cc] text-sm font-medium flex items-center space-x-1"
                    >
                      <Plus class="w-4 h-4" />
                      <span>Add Translation</span>
                    </button>
                  </div>

                  <!-- Translation List -->
                  <div
                    v-if="formData.translations && formData.translations.length > 0"
                    class="space-y-3"
                  >
                    <div
                      v-for="(translation, index) in formData.translations"
                      :key="translation.id || index"
                      class="bg-gray-50 rounded-xl p-4 relative"
                    >
                      <button
                        type="button"
                        @click="removeTranslation(index)"
                        class="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <X class="w-4 h-4" />
                      </button>

                      <div class="space-y-3 pr-8">
                        <div class="flex items-center justify-between">
                          <label class="block text-xs font-medium text-slate-600">
                            Language: {{ getLanguageName(translation.language) }}
                          </label>
                          <span
                            v-if="translation.id"
                            class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full"
                          >
                            Saved
                          </span>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input
                              v-model="translation.name"
                              type="text"
                              placeholder="Translated name"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                            />
                          </div>
                          <div>
                            <input
                              v-model="translation.title"
                              type="text"
                              placeholder="Translated title"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                            />
                          </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input
                              v-model="translation.parent_a_name"
                              type="text"
                              placeholder="Translated parent A name"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                            />
                          </div>
                          <div>
                            <input
                              v-model="translation.parent_b_name"
                              type="text"
                              placeholder="Translated parent B name"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                            />
                          </div>
                        </div>

                        <textarea
                          v-model="translation.bio"
                          rows="2"
                          placeholder="Translated biography"
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <!-- Add Translation Modal -->
                  <div
                    v-if="showAddTranslation"
                    class="bg-[#E6F4FF] border border-[#87CEEB] rounded-xl p-4"
                  >
                    <div class="flex items-center justify-between mb-3">
                      <h5 class="font-medium text-slate-900">Add Translation</h5>
                      <button
                        type="button"
                        @click="showAddTranslation = false"
                        class="text-gray-400 hover:text-gray-600"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>

                    <div class="space-y-3">
                      <select
                        v-model="newTranslation.language"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                      >
                        <option value="">Select language</option>
                        <option
                          v-for="lang in availableLanguagesForAdd"
                          :key="lang.code"
                          :value="lang.code"
                        >
                          {{ lang.name }}
                        </option>
                      </select>

                      <div class="flex space-x-2">
                        <button
                          type="button"
                          @click="addTranslation"
                          :disabled="!newTranslation.language"
                          class="px-4 py-2 bg-[#1e90ff] text-white rounded-lg hover:bg-[#1873cc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          @click="showAddTranslation = false"
                          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
                  {{ loading ? 'Updating...' : 'Update Host' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { X, UserPen, User, Mail, Languages, Plus, Loader, Upload } from 'lucide-vue-next'
import { hostsService, type EventHost, type HostTranslation, type CreateHostRequest } from '../services/api'

interface Props {
  eventId: string
  host: EventHost
}

interface Emits {
  close: []
  updated: [host: EventHost]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const loading = ref(false)
const showAddTranslation = ref(false)
const bioOpen = ref(false)
const contactOpen = ref(false)
const profilePictureInput = ref<HTMLInputElement>()
const profilePicturePreview = ref<string | null>(null)
const profilePictureUploading = ref(false)
const selectedProfileImageFile = ref<File | null>(null)

// Available languages (matching API documentation)
const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'kh', name: 'Khmer' },
  { code: 'fr', name: 'French' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh-cn', name: 'Chinese (Simplified)' },
  { code: 'th', name: 'Thai' },
  { code: 'vn', name: 'Vietnamese' },
]

// Form data - initialize with host data
const formData = reactive({
  name: props.host.name,
  parent_a_name: props.host.parent_a_name,
  parent_b_name: props.host.parent_b_name,
  title: props.host.title,
  bio: props.host.bio,
  profile_image: props.host.profile_image,
  email: props.host.email,
  linkedin_url: props.host.linkedin_url,
  twitter_url: props.host.twitter_url,
  website_url: props.host.website_url,
  order: props.host.order,
  translations: [...props.host.translations], // Create a copy
})

// New translation
const newTranslation = reactive<Omit<HostTranslation, 'id' | 'host' | 'created_at' | 'updated_at'>>(
  {
    language: '',
    name: '',
    parent_a_name: '',
    parent_b_name: '',
    title: '',
    bio: '',
  },
)

// Computed
const availableLanguagesForAdd = computed(() => {
  return availableLanguages.filter(
    (lang) => !formData.translations.some((t) => t.language === lang.code),
  )
})

const bioSummary = computed(() => {
  const text = (formData.bio || '').trim()
  if (!text) return 'No bio'
  return text.length > 60 ? text.slice(0, 60) + '…' : text
})

const contactSummary = computed(() => {
  const items = [formData.email, formData.linkedin_url, formData.twitter_url, formData.website_url]
  const count = items.filter((v) => v && String(v).trim() !== '').length
  return count > 0 ? `${count} ${count === 1 ? 'link' : 'links'}` : 'No links'
})

// Methods
const getLanguageName = (code: string) => {
  return availableLanguages.find((lang) => lang.code === code)?.name || code
}

const addTranslation = () => {
  if (!newTranslation.language) return

  // Check if translation for this language already exists
  if (formData.translations.some((t) => t.language === newTranslation.language)) {
    alert('Translation for this language already exists')
    return
  }

  formData.translations.push({ ...newTranslation })

  // Reset form
  Object.assign(newTranslation, {
    language: '',
    name: '',
    parent_a_name: '',
    parent_b_name: '',
    title: '',
    bio: '',
  })

  showAddTranslation.value = false
}

const removeTranslation = (index: number) => {
  formData.translations.splice(index, 1)
}

// Profile picture methods
const triggerProfilePictureUpload = () => {
  profilePictureInput.value?.click()
}

const handleProfilePictureSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  // Validate file
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file')
    return
  }

  if (file.size > 3 * 1024 * 1024) {
    // 3MB limit
    alert('File size must be less than 3MB')
    return
  }

  // Store the file for later upload
  selectedProfileImageFile.value = file

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    profilePicturePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // Clear input
  if (input) input.value = ''
}

const removeProfilePicture = () => {
  formData.profile_image = ''
  profilePicturePreview.value = null
  selectedProfileImageFile.value = null
}

const updateHost = async () => {
  loading.value = true

  try {
    // Clean the translations data - remove server-generated fields
    const cleanedTranslations = formData.translations.map((translation) => ({
      language: translation.language,
      name: translation.name || '',
      parent_a_name: translation.parent_a_name || '',
      parent_b_name: translation.parent_b_name || '',
      title: translation.title || '',
      bio: translation.bio || '',
      // Note: Exclude server-generated fields like id, host, created_at, updated_at
    }))

    // Build request data
    const requestData: Partial<CreateHostRequest> = {
      name: formData.name,
      parent_a_name: formData.parent_a_name || '',
      parent_b_name: formData.parent_b_name || '',
      title: formData.title || '',
      bio: formData.bio || '',
      email: formData.email || '',
      linkedin_url: formData.linkedin_url || '',
      twitter_url: formData.twitter_url || '',
      website_url: formData.website_url || '',
      order: formData.order || 0,
      translations: cleanedTranslations.filter((t) => t.language && t.language.trim() !== ''),
    }

    // Determine if user is removing the image
    const isRemovingImage = !selectedProfileImageFile.value &&
                           formData.profile_image === '' &&
                           props.host.profile_image

    let response

    if (selectedProfileImageFile.value || isRemovingImage) {
      // Use FormData for both uploading new file and removing image
      // When removing, we'll pass undefined as the file which should clear it
      response = await hostsService.updateHostWithFile(
        props.eventId,
        props.host.id,
        requestData,
        selectedProfileImageFile.value || undefined,
      )
    } else {
      // No image changes, use PATCH for other fields
      response = await hostsService.patchHost(props.eventId, props.host.id, requestData)
    }

    if (response.success && response.data) {
      emit('updated', response.data)
    } else {
      alert(response.message || 'Failed to update host')
    }
  } catch {
    alert('Network error while updating host')
  } finally {
    loading.value = false
  }
}
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
</style>
