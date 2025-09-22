<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="true" class="fixed inset-0 z-50 overflow-y-auto" @click="$emit('close')">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-8 py-6 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <UserPlus class="w-5 h-5" />
                  </div>
                  <h2 class="text-2xl font-bold">Add Host</h2>
                </div>
                <button
                  @click="$emit('close')"
                  class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="createHost" class="p-8 space-y-6">
              <div class="space-y-6">
                <!-- Basic Information -->
                <div class="space-y-4">
                  <h4 class="font-semibold text-slate-900 flex items-center">
                    <User class="w-4 h-4 mr-2" />
                    Basic Information
                  </h4>

                  <!-- Name -->
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">
                      Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      v-model="formData.name"
                      type="text"
                      required
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      placeholder="Enter host name"
                    />
                  </div>

                  <!-- Parent Names -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-semibold text-slate-700 mb-2">
                        Parent A Name
                      </label>
                      <input
                        v-model="formData.parent_a_name"
                        type="text"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
                        placeholder="First parent's name"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-semibold text-slate-700 mb-2">
                        Parent B Name
                      </label>
                      <input
                        v-model="formData.parent_b_name"
                        type="text"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
                        placeholder="Second parent's name"
                      />
                    </div>
                  </div>

                  <!-- Title -->
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">
                      Title/Position
                    </label>
                    <input
                      v-model="formData.title"
                      type="text"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm"
                      placeholder="e.g., Chief Technology Officer"
                    />
                  </div>

                  <!-- Profile Picture -->
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">
                      Profile Picture
                    </label>
                    <div class="flex items-start space-x-4">
                      <!-- Preview -->
                      <div class="flex-shrink-0">
                        <div
                          v-if="profilePicturePreview"
                          class="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200"
                        >
                          <img
                            :src="profilePicturePreview"
                            alt="Profile preview"
                            class="w-full h-full object-cover"
                          />
                        </div>
                        <div
                          v-else
                          class="w-20 h-20 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center"
                        >
                          <User class="w-8 h-8 text-gray-400" />
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
                            class="px-3 py-2 bg-[#1e90ff] hover:bg-[#1873cc] disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-1"
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
                            class="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors duration-200"
                          >
                            Remove
                          </button>
                        </div>
                        <p class="text-xs text-slate-500">JPG, PNG, or WebP. Max 3MB.</p>
                      </div>
                    </div>
                  </div>

                  <!-- Bio -->
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">
                      Biography
                    </label>
                    <textarea
                      v-model="formData.bio"
                      rows="3"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-[#1e90ff] transition-all duration-200 bg-white/70 backdrop-blur-sm resize-none"
                      placeholder="Brief biography or description"
                    ></textarea>
                  </div>
                </div>

                <!-- Contact Information -->
                <div class="space-y-4">
                  <h4 class="font-semibold text-slate-900 flex items-center">
                    <Mail class="w-4 h-4 mr-2" />
                    Contact & Social Media
                  </h4>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Email -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2"> Email </label>
                      <input
                        v-model="formData.email"
                        type="email"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-colors duration-200"
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
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-colors duration-200"
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
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-colors duration-200"
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
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-colors duration-200"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
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
                      :key="index"
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
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input
                              v-model="translation.name"
                              type="text"
                              placeholder="Translated name"
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <input
                              v-model="translation.title"
                              type="text"
                              placeholder="Translated title"
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                            />
                          </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input
                              v-model="translation.parent_a_name"
                              type="text"
                              placeholder="Translated parent A name"
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <input
                              v-model="translation.parent_b_name"
                              type="text"
                              placeholder="Translated parent B name"
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                            />
                          </div>
                        </div>

                        <textarea
                          v-model="translation.bio"
                          rows="2"
                          placeholder="Translated biography"
                          class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent resize-none"
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
              <div
                class="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200"
              >
                <button
                  type="button"
                  @click="$emit('close')"
                  class="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="loading || !formData.name"
                  class="px-8 py-3 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                >
                  <span
                    v-if="loading"
                    class="w-5 h-5 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  {{ loading ? 'Creating...' : 'Create Host' }}
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
import { X, User, Mail, Languages, Plus, UserPlus, Upload } from 'lucide-vue-next'
import {
  hostsService,
  type EventHost,
  type CreateHostRequest,
  type HostTranslation,
} from '../services/api'

interface Props {
  eventId: string
}

interface Emits {
  close: []
  created: [host: EventHost]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const loading = ref(false)
const showAddTranslation = ref(false)
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

// Form data
const formData = reactive<CreateHostRequest>({
  name: '',
  parent_a_name: '',
  parent_b_name: '',
  title: '',
  bio: '',
  profile_image: '',
  email: '',
  linkedin_url: '',
  twitter_url: '',
  website_url: '',
  order: 0,
  translations: [],
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
    (lang) => !formData.translations?.some((t) => t.language === lang.code),
  )
})

// Methods
const getLanguageName = (code: string) => {
  return availableLanguages.find((lang) => lang.code === code)?.name || code
}

const addTranslation = () => {
  if (!newTranslation.language) return

  // Check if translation for this language already exists
  if (formData.translations?.some((t) => t.language === newTranslation.language)) {
    alert('Translation for this language already exists')
    return
  }

  if (!formData.translations) {
    formData.translations = []
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
  if (formData.translations) {
    formData.translations.splice(index, 1)
  }
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

const createHost = async () => {
  loading.value = true

  try {
    // Clean the translations data
    const requestData = { ...formData }

    if (requestData.translations && requestData.translations.length > 0) {
      // Only include translations with valid language codes
      const validTranslations = requestData.translations.filter(
        (t) => t.language && t.language.trim() !== '',
      )

      if (validTranslations.length > 0) {
        requestData.translations = validTranslations
      } else {
        // If no valid translations, omit the field entirely
        delete requestData.translations
      }
    } else {
      // If no translations, omit the field entirely
      delete requestData.translations
    }

    // Remove profile_image from requestData since we'll send the file separately
    delete requestData.profile_image

    // Use the appropriate method based on whether we have a file
    const response = selectedProfileImageFile.value
      ? await hostsService.createHostWithFile(
          props.eventId,
          requestData,
          selectedProfileImageFile.value,
        )
      : await hostsService.createHost(props.eventId, requestData)

    if (response.success && response.data) {
      emit('created', response.data)
    } else {
      alert(response.message || 'Failed to create host')
    }
  } catch (error) {
    alert('Network error while creating host')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
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
