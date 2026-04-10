<template>
  <div class="space-y-6 sm:space-y-8">
    <!-- YouTube Embed -->
    <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
      <div class="mb-6">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <h5 class="font-semibold text-slate-900">{{ t('management.embeds.youtube.title') }}</h5>
            <p class="text-sm text-slate-600">{{ t('management.embeds.youtube.description') }}</p>
          </div>

          <!-- Help Button -->
          <button
            @click="showYouTubeHelpModal = true"
            class="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-lg hover:bg-blue-50 border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            :title="t('management.embeds.youtube.helpButtonTitle')"
          >
            <Info class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="space-y-3 sm:space-y-4">
        <!-- YouTube Preview -->
        <div v-if="formData.youtube_embed_link" class="relative">
          <iframe
            :src="formData.youtube_embed_link"
            class="w-full h-48 sm:h-56 md:h-64 rounded-xl sm:rounded-2xl"
            frameborder="0"
            allowfullscreen
          ></iframe>
          <button
            v-if="canEdit && eventData"
            @click="confirmRemoveYouTube"
            class="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 sm:p-2 rounded-full transition-colors duration-200"
          >
            <X class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div v-else class="border-2 border-dashed border-slate-300 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
          <Youtube class="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-1.5 sm:mb-2" />
          <p class="text-xs sm:text-sm text-slate-600">{{ t('management.embeds.youtube.empty') }}</p>
        </div>

        <div>
          <input
            v-model="formData.youtube_embed_link"
            type="url"
            :disabled="!canEdit"
            :placeholder="t('management.embeds.youtube.inputPlaceholder')"
            @paste="handleYouTubePaste"
            class="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent transition-colors duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div v-if="canEdit && eventData && hasChanges" class="flex justify-end">
      <button
        @click="saveChanges"
        :disabled="saving"
        class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-xl font-medium transition-all duration-300 sm:hover:scale-105 shadow-lg shadow-emerald-500/25 flex items-center space-x-1.5 sm:space-x-2 disabled:opacity-50"
      >
        <div
          v-if="saving"
          class="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
        ></div>
        <Save v-else class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span>{{ saving ? t('management.embeds.youtube.saving') : t('management.embeds.youtube.saveBtn') }}</span>
      </button>
    </div>

    <!-- Success Message -->
    <div v-if="showSuccess" class="bg-green-50 border border-green-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
      <div class="flex items-center space-x-2 sm:space-x-3">
        <CheckCircle class="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
        <p class="text-xs sm:text-sm text-green-700 font-medium">{{ t('management.embeds.youtube.successMessage') }}</p>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
      <div class="flex items-center space-x-2 sm:space-x-3">
        <AlertCircle class="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
        <p class="text-xs sm:text-sm text-red-700 font-medium">{{ error }}</p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="deleting"
      :title="deleteModalData.title"
      :item-name="deleteModalData.itemName"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteModal = false"
    />

    <!-- YouTube Help Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showYouTubeHelpModal"
          class="fixed inset-0 z-[70] overflow-y-auto"
          @click="showYouTubeHelpModal = false"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full" @click.stop>
              <!-- Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <Youtube class="w-5 h-5 text-red-600" />
                  </div>
                  <h3 class="text-lg font-semibold text-slate-900">{{ t('management.embeds.helpModal.title') }}</h3>
                </div>
                <button
                  @click="showYouTubeHelpModal = false"
                  class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>

              <!-- Content -->
              <div class="space-y-4">
                <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p class="text-sm text-blue-900 mb-3 font-medium">
                    {{ t('management.embeds.helpModal.intro') }}
                  </p>

                  <div class="space-y-3">
                    <div>
                      <h4 class="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs">1</span>
                        {{ t('management.embeds.helpModal.step1Title') }}
                      </h4>
                      <p class="text-sm text-blue-800 ml-7">
                        {{ t('management.embeds.helpModal.step1Desc') }}
                      </p>
                    </div>

                    <div>
                      <h4 class="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs">2</span>
                        {{ t('management.embeds.helpModal.step2Title') }}
                      </h4>
                      <p class="text-sm text-blue-800 ml-7">
                        {{ t('management.embeds.helpModal.step2Desc') }}
                      </p>
                    </div>

                    <div>
                      <h4 class="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs">3</span>
                        {{ t('management.embeds.helpModal.step3Title') }}
                      </h4>
                      <p class="text-sm text-blue-800 ml-7">
                        {{ t('management.embeds.helpModal.step3Desc') }}
                      </p>
                    </div>

                    <div>
                      <h4 class="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs">4</span>
                        {{ t('management.embeds.helpModal.step4Title') }}
                      </h4>
                      <p class="text-sm text-blue-800 ml-7">
                        {{ t('management.embeds.helpModal.step4Desc') }}
                      </p>
                    </div>

                    <div>
                      <h4 class="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs">5</span>
                        {{ t('management.embeds.helpModal.step5Title') }}
                      </h4>
                      <p class="text-sm text-blue-800 ml-7">
                        {{ t('management.embeds.helpModal.step5Desc') }}
                      </p>
                    </div>

                    <div class="pt-3 border-t border-blue-200">
                      <h4 class="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1.5">
                        <span>💡</span>
                        <span>{{ t('management.embeds.helpModal.exampleLabel') }}</span>
                      </h4>
                      <p class="text-xs text-blue-800 mb-2">{{ t('management.embeds.helpModal.exampleHint') }}</p>
                      <code class="block text-xs bg-blue-100 p-2 rounded text-blue-900 break-all">
                        https://www.youtube.com/embed/VIDEO_ID
                      </code>
                    </div>
                  </div>
                </div>

                <!-- Close Button -->
                <div class="flex justify-end pt-2">
                  <button
                    @click="showYouTubeHelpModal = false"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-200"
                  >
                    {{ t('management.embeds.helpModal.gotIt') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Youtube, X, Save, CheckCircle, AlertCircle, Info } from 'lucide-vue-next'
import { eventsService, type Event } from '../services/api'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import { extractYouTubeEmbedUrl } from '../utils/embedExtractor'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface Props {
  eventData?: Event
  canEdit: boolean
}

interface Emits {
  updated: [event: Event]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useAppLanguage()

// State
const formData = ref({
  youtube_embed_link: props.eventData?.youtube_embed_link || '',
})

const saving = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const showDeleteModal = ref(false)
const deleting = ref(false)
const deleteModalData = ref({
  title: '',
  itemName: '',
  fieldToDelete: '',
})
const showYouTubeHelpModal = ref(false)

// Computed
const hasChanges = computed(() => {
  if (!props.eventData) return false

  return formData.value.youtube_embed_link !== (props.eventData.youtube_embed_link || '')
})

// Watch for prop changes
watch(
  () => props.eventData,
  (newEventData) => {
    if (newEventData) {
      formData.value = {
        youtube_embed_link: newEventData.youtube_embed_link || '',
      }
    }
  },
  { immediate: true },
)

// Methods
const saveChanges = async () => {
  if (!props.eventData) return

  saving.value = true
  error.value = null
  showSuccess.value = false

  try {
    // Prepare data - convert empty strings to null for removal
    const updateData = {
      youtube_embed_link: formData.value.youtube_embed_link.trim() || null,
    }

    const response = await eventsService.patchEvent(props.eventData.id, updateData)

    if (response.success && response.data) {
      emit('updated', response.data)
      showSuccess.value = true

      // Hide success message after 3 seconds
      setTimeout(() => {
        showSuccess.value = false
      }, 3000)
    } else {
      error.value = response.message || t('management.embeds.errors.updateFailed')
    }
  } catch (err) {
    error.value = t('management.embeds.errors.updateNetworkError')
  } finally {
    saving.value = false
  }
}

// Delete confirmation functions
const confirmRemoveYouTube = () => {
  deleteModalData.value = {
    title: t('management.embeds.deleteModal.title'),
    itemName: t('management.embeds.deleteModal.itemName'),
    fieldToDelete: 'youtube_embed_link',
  }
  showDeleteModal.value = true
}

const handleDeleteConfirm = async () => {
  if (!props.eventData) return

  deleting.value = true
  error.value = null
  showSuccess.value = false

  try {
    const updateData = {
      [deleteModalData.value.fieldToDelete]: null,
    }

    const response = await eventsService.patchEvent(props.eventData.id, updateData)

    if (response.success && response.data) {
      // Update local form data
      if (deleteModalData.value.fieldToDelete === 'youtube_embed_link') {
        formData.value.youtube_embed_link = ''
      }

      emit('updated', response.data)
      showDeleteModal.value = false
      showSuccess.value = true

      // Hide success message after 3 seconds
      setTimeout(() => {
        showSuccess.value = false
      }, 3000)
    } else {
      error.value = response.message || t('management.embeds.errors.removeFailed')
    }
  } catch (err) {
    error.value = t('management.embeds.errors.removeNetworkError')
  } finally {
    deleting.value = false
  }
}

// Validate URLs
const validateYouTubeUrl = (url: string): boolean => {
  if (!url) return true // Empty is valid
  // Updated pattern to allow query parameters and additional URL components
  const youtubeEmbedPattern = /^https:\/\/www\.youtube\.com\/embed\/[a-zA-Z0-9_-]+(\?.*)?$/
  return youtubeEmbedPattern.test(url)
}

// Handle paste events for YouTube iframe
const handleYouTubePaste = (event: ClipboardEvent) => {
  const pastedText = event.clipboardData?.getData('text')
  if (!pastedText) return

  // Try to extract YouTube URL from iframe code
  const extractedUrl = extractYouTubeEmbedUrl(pastedText)

  if (extractedUrl) {
    event.preventDefault()
    formData.value.youtube_embed_link = extractedUrl
  }
}

// Watch for URL validation
watch(
  () => formData.value.youtube_embed_link,
  (newValue) => {
    if (newValue && !validateYouTubeUrl(newValue)) {
      error.value = t('management.embeds.errors.invalidUrl')
    } else if (error.value?.includes('YouTube')) {
      error.value = null
    }
  },
)

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
</style>
