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
            <form @submit.prevent="submitHost" class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
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

              <!-- Profile Picture Section (Always Visible) -->
              <div class="flex flex-col items-center space-y-4 py-4">
                <h4 class="text-sm font-semibold text-slate-900 self-start">Profile Picture</h4>

                <!-- Circular Avatar Preview -->
                <div class="relative">
                  <div
                    v-if="
                      profilePicturePreview ||
                      (formData.profile_image && formData.profile_image !== '')
                    "
                    class="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-200 shadow-lg"
                  >
                    <img
                      :src="profilePicturePreview || formData.profile_image || ''"
                      alt="Profile preview"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    v-else
                    class="w-32 h-32 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center shadow-lg"
                  >
                    <User class="w-12 h-12 text-slate-400" />
                  </div>
                </div>

                <!-- Upload Controls -->
                <input
                  ref="profilePictureInput"
                  type="file"
                  accept="image/*"
                  @change="handleProfilePictureSelect"
                  class="hidden"
                />
                <div class="flex flex-col items-center space-y-2">
                  <div class="flex space-x-2">
                    <button
                      type="button"
                      @click="triggerProfilePictureUpload"
                      :disabled="profilePictureUploading"
                      class="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                      <Upload class="w-4 h-4" />
                      <span>{{ profilePictureUploading ? 'Uploading...' : 'Upload Photo' }}</span>
                    </button>
                    <button
                      v-if="
                        profilePicturePreview ||
                        (formData.profile_image && formData.profile_image !== '')
                      "
                      type="button"
                      @click="removeProfilePicture"
                      class="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                      Remove
                    </button>
                  </div>
                  <p class="text-xs text-slate-500 text-center">JPG, PNG, or WebP. Max 3MB.</p>
                </div>
              </div>

              <!-- Language Tabs Section -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h4 class="font-semibold text-slate-900 flex items-center">
                    <Languages class="w-4 h-4 mr-2" />
                    Language
                  </h4>
                  <button
                    type="button"
                    @click="showAddTranslation = true"
                    class="text-[#1e90ff] hover:text-[#1873cc] text-sm font-medium flex items-center space-x-1"
                  >
                    <Plus class="w-4 h-4" />
                    <span>Add Language</span>
                  </button>
                </div>

                <!-- Language Tab Headers -->
                <div role="tablist" aria-label="Host information languages" class="flex overflow-x-auto border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
                  <!-- English Tab (Always first) -->
                  <button
                    type="button"
                    role="tab"
                    :id="'tab-en'"
                    :aria-selected="activeTab === 'en'"
                    :aria-controls="'tabpanel-en'"
                    :tabindex="activeTab === 'en' ? 0 : -1"
                    @click="activeTab = 'en'"
                    @keydown.right="focusNextTab"
                    @keydown.left="focusPreviousTab"
                    :class="[
                      'flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors relative',
                      activeTab === 'en'
                        ? 'text-sky-600 bg-white border-b-2 border-sky-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    ]"
                  >
                    <span class="flex items-center gap-2">
                      <span>English</span>
                      <span class="text-xs text-slate-500">(Default)</span>
                    </span>
                  </button>

                  <!-- Other Language Tabs -->
                  <button
                    v-for="(translation, index) in formData.translations"
                    :key="translation.id || index"
                    type="button"
                    role="tab"
                    :id="'tab-' + translation.language"
                    :aria-selected="activeTab === translation.language"
                    :aria-controls="'tabpanel-' + translation.language"
                    :tabindex="activeTab === translation.language ? 0 : -1"
                    @click="activeTab = translation.language"
                    @keydown.right="focusNextTab"
                    @keydown.left="focusPreviousTab"
                    :class="[
                      'flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors relative group',
                      activeTab === translation.language
                        ? 'text-sky-600 bg-white border-b-2 border-sky-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    ]"
                  >
                    <span class="flex items-center gap-2">
                      <span>{{ getLanguageName(translation.language) }}</span>
                      <button
                        type="button"
                        @click.stop="removeTranslation(index)"
                        :aria-label="'Remove ' + getLanguageName(translation.language) + ' translation'"
                        class="opacity-0 group-hover:opacity-100 transition-opacity"
                        :class="activeTab === translation.language ? 'opacity-100' : ''"
                      >
                        <X class="w-3.5 h-3.5 text-red-500 hover:text-red-700" />
                      </button>
                      <span
                        v-if="translation.id"
                        class="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full font-medium"
                      >
                        Saved
                      </span>
                    </span>
                  </button>
                </div>

                <!-- Add Translation Modal -->
                <div
                  v-if="showAddTranslation"
                  class="bg-[#E6F4FF] border border-[#87CEEB] rounded-xl p-4"
                >
                  <div class="flex items-center justify-between mb-3">
                    <h5 class="font-medium text-slate-900">Add Language</h5>
                    <button
                      type="button"
                      @click="showAddTranslation = false"
                      class="text-gray-400 hover:text-gray-600"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>

                  <div class="space-y-3">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 mb-2">
                        Select Language
                      </label>
                      <select
                        v-model="newTranslation.language"
                        class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
                      >
                        <option value="">Choose a language...</option>
                        <option
                          v-for="lang in availableLanguagesForAdd"
                          :key="lang.code"
                          :value="lang.code"
                        >
                          {{ lang.name }}
                        </option>
                      </select>
                    </div>

                    <div class="flex space-x-2">
                      <button
                        type="button"
                        @click="addTranslation"
                        :disabled="!newTranslation.language"
                        class="px-4 py-2 bg-[#1e90ff] text-white rounded-lg hover:bg-[#1873cc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Add Language
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

              <div class="space-y-5">
                <!-- English Content (Default Language) -->
                <div
                  v-if="activeTab === 'en'"
                  role="tabpanel"
                  :id="'tabpanel-en'"
                  :aria-labelledby="'tab-en'"
                  tabindex="0"
                  class="space-y-5"
                >
                  <div class="space-y-3">
                    <!-- Title and Name -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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

                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                          Name <span class="text-red-500">*</span>
                        </label>
                        <input
                          v-model="formData.name"
                          type="text"
                          required
                          :aria-invalid="fieldErrors.name ? 'true' : 'false'"
                          :aria-describedby="fieldErrors.name ? 'name-error' : undefined"
                          :class="[
                            'w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2',
                            fieldErrors.name
                              ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                              : 'border-slate-300 focus:ring-sky-200 focus:border-sky-400',
                            'bg-white/90'
                          ]"
                          placeholder="Enter host name"
                        />
                        <div v-if="fieldErrors.name" id="name-error" role="alert" class="mt-1">
                          <p v-for="error in fieldErrors.name" :key="error" class="text-xs text-red-600">
                            {{ error }}
                          </p>
                        </div>
                      </div>
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
                  <div class="space-y-3">
                    <!-- Title and Name -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                          Title/Position
                        </label>
                        <input
                          v-model="translation.title"
                          type="text"
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                          :placeholder="`Enter title in ${getLanguageName(translation.language)}`"
                        />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                          Name <span class="text-red-500">*</span>
                        </label>
                        <input
                          v-model="translation.name"
                          type="text"
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                          :placeholder="`Enter name in ${getLanguageName(translation.language)}`"
                        />
                      </div>
                    </div>

                    <!-- Parent Names -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                          Parent A Name
                        </label>
                        <input
                          v-model="translation.parent_a_name"
                          type="text"
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                          :placeholder="`First parent's name in ${getLanguageName(translation.language)}`"
                        />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">
                          Parent B Name
                        </label>
                        <input
                          v-model="translation.parent_b_name"
                          type="text"
                          class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                          :placeholder="`Second parent's name in ${getLanguageName(translation.language)}`"
                        />
                      </div>
                    </div>

                    <!-- Biography (collapsible) -->
                    <div class="rounded-xl border border-slate-200 bg-white/70">
                      <button
                        type="button"
                        class="w-full flex items-center justify-between px-4 py-3"
                        @click="bioOpen = !bioOpen"
                        :aria-expanded="bioOpen ? 'true' : 'false'"
                        :aria-controls="`bio-section-${translation.language}`"
                      >
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium text-slate-700">Biography</span>
                          <span class="hidden sm:inline text-xs text-slate-500">
                            {{ translation.bio && translation.bio.trim()
                              ? (translation.bio.length > 60 ? translation.bio.slice(0, 60) + '…' : translation.bio)
                              : 'No bio' }}
                          </span>
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
                        <div v-show="bioOpen" :id="`bio-section-${translation.language}`" class="px-4 pb-4">
                          <textarea
                            v-model="translation.bio"
                            rows="4"
                            class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90 resize-none"
                            :placeholder="`Enter biography in ${getLanguageName(translation.language)}`"
                          ></textarea>
                        </div>
                      </Transition>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Contact Information Section (Always Visible) -->
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
                          @blur="validateEmail"
                          :aria-invalid="emailError ? 'true' : 'false'"
                          :aria-describedby="emailError ? 'email-error' : undefined"
                          :class="[
                            'w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2',
                            emailError
                              ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                              : 'border-slate-300 focus:ring-sky-200 focus:border-sky-400',
                            'bg-white/90'
                          ]"
                          placeholder="email@example.com"
                        />
                        <div v-if="emailError" id="email-error" role="alert" class="mt-1">
                          <p class="text-xs text-red-600">{{ emailError }}</p>
                        </div>
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
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { X, UserPen, UserPlus, User, Languages, Plus, Upload, AlertCircle } from 'lucide-vue-next'
import { hostsService, type EventHost, type HostTranslation, type CreateHostRequest } from '../services/api'
import { sanitizePlainText, sanitizeRichContent } from '@/utils/sanitize'
import { inputValidator } from '@/utils/inputValidation'

// Constants
const MAX_PROFILE_IMAGE_SIZE = 3 * 1024 * 1024 // 3MB
const MAX_NAME_LENGTH = 100
const MAX_TITLE_LENGTH = 150
const MAX_BIO_LENGTH = 1000

interface Props {
  eventId: string
  host?: EventHost  // Make optional for create mode
}

interface Emits {
  close: []
  updated: [host: EventHost]
  created: [host: EventHost]  // Add created event
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Computed: Check if we're in edit mode (has host prop) or create mode (no host prop)
const isEditMode = computed(() => !!props.host)

// State
const loading = ref(false)
const showAddTranslation = ref(false)
const bioOpen = ref(false)
const contactOpen = ref(false)
const profilePictureInput = ref<HTMLInputElement>()
const profilePicturePreview = ref<string | null>(null)
const profilePictureUploading = ref(false)
const selectedProfileImageFile = ref<File | null>(null)
const activeTab = ref<string>('en') // Default to English tab
const imageRemoved = ref(false) // Explicit tracking for image removal

// Error states
const fieldErrors = ref<Record<string, string[]>>({})
const generalError = ref<string>('')
const emailError = ref<string>('')

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

// Form data - initialize with host data (edit mode) or empty values (create mode)
const formData = reactive({
  name: props.host?.name || '',
  parent_a_name: props.host?.parent_a_name || '',
  parent_b_name: props.host?.parent_b_name || '',
  title: props.host?.title || '',
  bio: props.host?.bio || '',
  profile_image: props.host?.profile_image || '',
  email: props.host?.email || '',
  linkedin_url: props.host?.linkedin_url || '',
  twitter_url: props.host?.twitter_url || '',
  website_url: props.host?.website_url || '',
  order: props.host?.order || 0,
  translations: props.host ? [...props.host.translations] : [], // Create a copy if editing
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
    (lang) => lang.code !== 'en' && !formData.translations.some((t) => t.language === lang.code),
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

// Validation functions
const isValidHttpUrl = (urlString: string): boolean => {
  if (!urlString || urlString.trim() === '') return true // Optional field

  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const validateEmail = (): boolean => {
  emailError.value = ''

  if (formData.email && formData.email.trim() !== '') {
    const result = inputValidator.validateEmail(formData.email)
    if (!result.isValid) {
      emailError.value = result.errors[0] || 'Invalid email address'
      return false
    } else {
      formData.email = result.sanitizedValue || formData.email
    }
  }
  return true
}

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

  const languageCode = newTranslation.language
  formData.translations.push({ ...newTranslation })

  // Switch to the newly added language tab
  activeTab.value = languageCode

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
  const removedLanguage = formData.translations[index].language
  formData.translations.splice(index, 1)

  // If we're removing the currently active tab, switch to English
  if (activeTab.value === removedLanguage) {
    activeTab.value = 'en'
  }
}

// Keyboard navigation for tabs
const focusNextTab = () => {
  const tabs = ['en', ...formData.translations.map(t => t.language)]
  const currentIndex = tabs.indexOf(activeTab.value)
  const nextIndex = (currentIndex + 1) % tabs.length
  activeTab.value = tabs[nextIndex]
}

const focusPreviousTab = () => {
  const tabs = ['en', ...formData.translations.map(t => t.language)]
  const currentIndex = tabs.indexOf(activeTab.value)
  const previousIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
  activeTab.value = tabs[previousIndex]
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

  if (file.size > MAX_PROFILE_IMAGE_SIZE) {
    alert('File size must be less than 3MB')
    return
  }

  // Store the file for later upload
  selectedProfileImageFile.value = file
  imageRemoved.value = false // Reset removal flag when new image is selected

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
  imageRemoved.value = true // Explicit tracking
}

// Unified submit handler - delegates to create or update based on mode
const submitHost = async () => {
  if (isEditMode.value) {
    await updateHost()
  } else {
    await createHost()
  }
}

// Create new host
const createHost = async () => {
  loading.value = true
  fieldErrors.value = {}
  generalError.value = ''

  try {
    // Validate email
    if (!validateEmail()) {
      loading.value = false
      return
    }

    // Validate URLs
    const urls = [
      { field: 'LinkedIn', value: formData.linkedin_url },
      { field: 'Twitter', value: formData.twitter_url },
      { field: 'Website', value: formData.website_url },
    ]

    for (const { field, value } of urls) {
      if (value && !isValidHttpUrl(value)) {
        generalError.value = `Invalid ${field} URL. Please use http:// or https:// URLs only.`
        loading.value = false
        return
      }
    }

    // Validate file at submission time
    if (selectedProfileImageFile.value) {
      const file = selectedProfileImageFile.value

      if (!file.type.startsWith('image/')) {
        generalError.value = 'Invalid file type. Please select an image file.'
        selectedProfileImageFile.value = null
        profilePicturePreview.value = null
        loading.value = false
        return
      }

      if (file.size > MAX_PROFILE_IMAGE_SIZE) {
        generalError.value = 'File size exceeds 3MB limit. Please select a smaller image.'
        selectedProfileImageFile.value = null
        profilePicturePreview.value = null
        loading.value = false
        return
      }
    }

    // Sanitize all text inputs
    const requestData: CreateHostRequest = {
      name: sanitizePlainText(formData.name, MAX_NAME_LENGTH),
      parent_a_name: sanitizePlainText(formData.parent_a_name || '', MAX_NAME_LENGTH),
      parent_b_name: sanitizePlainText(formData.parent_b_name || '', MAX_NAME_LENGTH),
      title: sanitizePlainText(formData.title || '', MAX_TITLE_LENGTH),
      bio: sanitizeRichContent(formData.bio || '', MAX_BIO_LENGTH),
      email: formData.email || '',
      linkedin_url: formData.linkedin_url || '',
      twitter_url: formData.twitter_url || '',
      website_url: formData.website_url || '',
      order: formData.order || 0,
    }

    // Sanitize translations
    const cleanedTranslations = formData.translations.map((translation) => ({
      language: translation.language,
      name: sanitizePlainText(translation.name || '', MAX_NAME_LENGTH),
      parent_a_name: sanitizePlainText(translation.parent_a_name || '', MAX_NAME_LENGTH),
      parent_b_name: sanitizePlainText(translation.parent_b_name || '', MAX_NAME_LENGTH),
      title: sanitizePlainText(translation.title || '', MAX_TITLE_LENGTH),
      bio: sanitizeRichContent(translation.bio || '', MAX_BIO_LENGTH),
    }))

    requestData.translations = cleanedTranslations.filter(t => t.language && t.language.trim() !== '')

    let response

    if (selectedProfileImageFile.value) {
      // Use FormData for file upload
      response = await hostsService.createHostWithFile(
        props.eventId,
        requestData,
        selectedProfileImageFile.value,
      )
    } else {
      // No file, use JSON
      response = await hostsService.createHost(props.eventId, requestData)
    }

    if (response.success && response.data) {
      emit('created', response.data)
    } else {
      // Handle field-specific errors from API
      if (response.errors && typeof response.errors === 'object') {
        fieldErrors.value = response.errors as Record<string, string[]>
      }
      generalError.value = response.message || 'Failed to create host'
    }
  } catch (error) {
    console.error('Error creating host:', error)
    generalError.value = 'Network error. Please check your connection and try again.'
  } finally {
    loading.value = false
  }
}

// Update existing host
const updateHost = async () => {
  loading.value = true
  fieldErrors.value = {}
  generalError.value = ''

  try {
    // Validate email
    if (!validateEmail()) {
      loading.value = false
      return
    }

    // Validate URLs
    const urls = [
      { field: 'LinkedIn', value: formData.linkedin_url },
      { field: 'Twitter', value: formData.twitter_url },
      { field: 'Website', value: formData.website_url },
    ]

    for (const { field, value } of urls) {
      if (value && !isValidHttpUrl(value)) {
        generalError.value = `Invalid ${field} URL. Please use http:// or https:// URLs only.`
        loading.value = false
        return
      }
    }

    // Validate file at submission time
    if (selectedProfileImageFile.value) {
      const file = selectedProfileImageFile.value

      if (!file.type.startsWith('image/')) {
        generalError.value = 'Invalid file type. Please select an image file.'
        selectedProfileImageFile.value = null
        profilePicturePreview.value = null
        loading.value = false
        return
      }

      if (file.size > MAX_PROFILE_IMAGE_SIZE) {
        generalError.value = 'File size exceeds 3MB limit. Please select a smaller image.'
        selectedProfileImageFile.value = null
        profilePicturePreview.value = null
        loading.value = false
        return
      }
    }

    // Sanitize all text inputs
    const requestData: Partial<CreateHostRequest> = {
      name: sanitizePlainText(formData.name, MAX_NAME_LENGTH),
      parent_a_name: sanitizePlainText(formData.parent_a_name || '', MAX_NAME_LENGTH),
      parent_b_name: sanitizePlainText(formData.parent_b_name || '', MAX_NAME_LENGTH),
      title: sanitizePlainText(formData.title || '', MAX_TITLE_LENGTH),
      bio: sanitizeRichContent(formData.bio || '', MAX_BIO_LENGTH),
      email: formData.email || '',
      linkedin_url: formData.linkedin_url || '',
      twitter_url: formData.twitter_url || '',
      website_url: formData.website_url || '',
      order: formData.order || 0,
    }

    // Sanitize translations
    const cleanedTranslations = formData.translations.map((translation) => ({
      language: translation.language,
      name: sanitizePlainText(translation.name || '', MAX_NAME_LENGTH),
      parent_a_name: sanitizePlainText(translation.parent_a_name || '', MAX_NAME_LENGTH),
      parent_b_name: sanitizePlainText(translation.parent_b_name || '', MAX_NAME_LENGTH),
      title: sanitizePlainText(translation.title || '', MAX_TITLE_LENGTH),
      bio: sanitizeRichContent(translation.bio || '', MAX_BIO_LENGTH),
    }))

    requestData.translations = cleanedTranslations.filter((t) => t.language && t.language.trim() !== '')

    // Clearer image change detection
    const hasNewImage = !!selectedProfileImageFile.value
    const isRemovingImage = imageRemoved.value && !!props.host?.profile_image
    const imageChanged = hasNewImage || isRemovingImage

    let response

    if (imageChanged) {
      // Use FormData for image changes
      response = await hostsService.updateHostWithFile(
        props.eventId,
        props.host!.id,
        requestData,
        selectedProfileImageFile.value || undefined,
      )
    } else {
      // No image changes, use PATCH
      response = await hostsService.patchHost(props.eventId, props.host!.id, requestData)
    }

    if (response.success && response.data) {
      emit('updated', response.data)
    } else {
      // Handle field-specific errors from API
      if (response.errors && typeof response.errors === 'object') {
        fieldErrors.value = response.errors as Record<string, string[]>
      }
      generalError.value = response.message || 'Failed to update host'
    }
  } catch (error) {
    console.error('Error updating host:', error)
    generalError.value = 'Network error. Please check your connection and try again.'
  } finally {
    loading.value = false
  }
}

// Reset error states when modal opens
onMounted(() => {
  fieldErrors.value = {}
  generalError.value = ''
  emailError.value = ''
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
