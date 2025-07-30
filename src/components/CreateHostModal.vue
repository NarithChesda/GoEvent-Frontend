<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="true" class="fixed inset-0 z-50 overflow-y-auto" @click="$emit('close')">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
        
        <div class="flex min-h-full items-center justify-center p-4">
          <div 
            class="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 class="text-xl font-bold text-slate-900">Add Host</h3>
                <p class="text-sm text-slate-600 mt-1">Add a new speaker, host, or featured guest</p>
              </div>
              <button
                @click="$emit('close')"
                class="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X class="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="createHost" class="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div class="p-6 space-y-6">
                <!-- Basic Information -->
                <div class="space-y-4">
                  <h4 class="font-semibold text-slate-900 flex items-center">
                    <User class="w-4 h-4 mr-2" />
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
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="Enter host name"
                    />
                  </div>

                  <!-- Parent Names -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Parent A Name
                      </label>
                      <input
                        v-model="formData.parent_a_name"
                        type="text"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="e.g., Chief Technology Officer"
                    />
                  </div>

                  <!-- Bio -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">
                      Biography
                    </label>
                    <textarea
                      v-model="formData.bio"
                      rows="3"
                      class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 resize-none"
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
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Email
                      </label>
                      <input
                        v-model="formData.email"
                        type="email"
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                        class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                      class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <Plus class="w-4 h-4" />
                      <span>Add Translation</span>
                    </button>
                  </div>

                  <!-- Translation List -->
                  <div v-if="formData.translations && formData.translations.length > 0" class="space-y-3">
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
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <input
                              v-model="translation.title"
                              type="text"
                              placeholder="Translated title"
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <input
                              v-model="translation.parent_a_name"
                              type="text"
                              placeholder="Translated parent A name"
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <input
                              v-model="translation.parent_b_name"
                              type="text"
                              placeholder="Translated parent B name"
                              class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        
                        <textarea
                          v-model="translation.bio"
                          rows="2"
                          placeholder="Translated biography"
                          class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <!-- Add Translation Modal -->
                  <div v-if="showAddTranslation" class="bg-blue-50 border border-blue-200 rounded-xl p-4">
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
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select language</option>
                        <option v-for="lang in availableLanguagesForAdd" :key="lang.code" :value="lang.code">
                          {{ lang.name }}
                        </option>
                      </select>
                      
                      <div class="flex space-x-2">
                        <button
                          type="button"
                          @click="addTranslation"
                          :disabled="!newTranslation.language"
                          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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

              <!-- Footer -->
              <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-100 bg-gray-50">
                <button
                  type="button"
                  @click="$emit('close')"
                  class="px-6 py-3 text-slate-600 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="loading || !formData.name"
                  class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
import { X, User, Mail, Languages, Plus } from 'lucide-vue-next'
import { hostsService, type EventHost, type CreateHostRequest, type HostTranslation } from '../services/api'

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

// Available languages (matching API documentation)
const availableLanguages = [
  { code: 'en', name: 'English' },
  { code: 'kh', name: 'Khmer' },
  { code: 'fr', name: 'French' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh-cn', name: 'Chinese (Simplified)' },
  { code: 'th', name: 'Thai' },
  { code: 'vn', name: 'Vietnamese' }
]

// Form data
const formData = reactive<CreateHostRequest>({
  name: '',
  parent_a_name: '',
  parent_b_name: '',
  title: '',
  bio: '',
  email: '',
  linkedin_url: '',
  twitter_url: '',
  website_url: '',
  order: 0,
  translations: []
})

// New translation
const newTranslation = reactive<Omit<HostTranslation, 'id' | 'host' | 'created_at' | 'updated_at'>>({
  language: '',
  name: '',
  parent_a_name: '',
  parent_b_name: '',
  title: '',
  bio: ''
})

// Computed
const availableLanguagesForAdd = computed(() => {
  return availableLanguages.filter(lang => 
    !formData.translations?.some(t => t.language === lang.code)
  )
})

// Methods
const getLanguageName = (code: string) => {
  return availableLanguages.find(lang => lang.code === code)?.name || code
}

const addTranslation = () => {
  if (!newTranslation.language) return
  
  // Check if translation for this language already exists
  if (formData.translations?.some(t => t.language === newTranslation.language)) {
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
    bio: ''
  })
  
  showAddTranslation.value = false
}

const removeTranslation = (index: number) => {
  if (formData.translations) {
    formData.translations.splice(index, 1)
  }
}

const createHost = async () => {
  loading.value = true
  
  try {
    // Clean the translations data
    const requestData = { ...formData }
    
    if (requestData.translations && requestData.translations.length > 0) {
      // Only include translations with valid language codes
      const validTranslations = requestData.translations.filter(t => 
        t.language && t.language.trim() !== ''
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
    
    const response = await hostsService.createHost(props.eventId, requestData)
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
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>