<template>
  <div>
    <!-- YouTube Embed -->
    <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 border border-white/20">
      <div class="mb-6">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <h5 class="font-semibold text-slate-900">{{ t('management.embeds.youtube.title') }}</h5>
            <p class="text-sm text-slate-600">{{ t('management.embeds.youtube.description') }}</p>
          </div>

          <!-- Help Button -->
          <button
            @click="showYouTubeHelpModal = true"
            class="p-2 text-slate-400 hover:text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors duration-200 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
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
            class="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors duration-200"
            :aria-label="t('management.embeds.deleteModal.title')"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <button
          v-else
          type="button"
          :disabled="!canEdit"
          @click="focusUrlInput"
          :class="[
            'w-full border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-300',
            canEdit
              ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200'
              : 'border-slate-300 bg-slate-50 cursor-default'
          ]"
        >
          <Youtube class="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-1.5 sm:mb-2 transition-colors group-hover:text-emerald-600" />
          <p class="text-xs sm:text-sm text-slate-600">{{ t('management.embeds.youtube.empty') }}</p>
        </button>

        <div>
          <input
            ref="urlInputRef"
            v-model="formData.youtube_embed_link"
            type="url"
            :disabled="!canEdit"
            :placeholder="t('management.embeds.youtube.inputPlaceholder')"
            @paste="handleYouTubePaste"
            :class="[
              'w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white transition-colors duration-200 disabled:bg-slate-100 disabled:cursor-not-allowed',
              urlError
                ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                : 'border-slate-300 focus:ring-sky-200 focus:border-sky-400'
            ]"
          />
          <p v-if="urlError" class="text-xs sm:text-sm text-red-600 mt-1">{{ urlError }}</p>
        </div>

        <!-- Save Button -->
        <div v-if="canEdit && eventData && hasChanges" class="flex justify-end">
          <button
            @click="saveChanges"
            :disabled="saving || !!urlError"
            class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div
              v-if="saving"
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <Save v-else class="w-4 h-4" />
            <span>{{ saving ? t('management.embeds.youtube.saving') : t('management.embeds.youtube.saveBtn') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Feedback -->
    <Transition name="slide-up">
      <div v-if="message" class="fixed bottom-20 lg:bottom-4 right-6 z-50">
        <div
          :class="message.type === 'success' ? 'bg-green-500' : 'bg-red-500'"
          class="text-white px-6 py-4 rounded-xl shadow-lg flex items-center"
        >
          <CheckCircle v-if="message.type === 'success'" class="w-5 h-5 mr-2" />
          <AlertCircle v-else class="w-5 h-5 mr-2" />
          {{ message.text }}
        </div>
      </div>
    </Transition>

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
          class="fixed inset-0 z-[1000] overflow-y-auto"
          @click="showYouTubeHelpModal = false"
        >
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div class="flex min-h-full items-center justify-center p-4">
            <div class="relative bg-white rounded-3xl shadow-2xl p-4 sm:p-6 max-w-lg w-full" @click.stop>
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
                  class="text-slate-400 hover:text-slate-600 transition-colors duration-200"
                >
                  <X class="w-5 h-5" />
                </button>
              </div>

              <!-- Content -->
              <div class="space-y-4">
                <div class="bg-sky-50 border border-sky-200 rounded-xl p-4">
                  <p class="text-sm text-sky-900 mb-3 font-medium">
                    {{ t('management.embeds.helpModal.intro') }}
                  </p>

                  <div class="space-y-3">
                    <div>
                      <h4 class="text-sm font-semibold text-sky-900 mb-2 flex items-center gap-2">
                        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 text-white text-xs">1</span>
                        {{ t('management.embeds.helpModal.step1Title') }}
                      </h4>
                      <p class="text-sm text-slate-600 ml-7">
                        {{ t('management.embeds.helpModal.step1Desc') }}
                      </p>
                    </div>

                    <div>
                      <h4 class="text-sm font-semibold text-sky-900 mb-2 flex items-center gap-2">
                        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 text-white text-xs">2</span>
                        {{ t('management.embeds.helpModal.step2Title') }}
                      </h4>
                      <p class="text-sm text-slate-600 ml-7">
                        {{ t('management.embeds.helpModal.step2Desc') }}
                      </p>
                    </div>

                    <div>
                      <h4 class="text-sm font-semibold text-sky-900 mb-2 flex items-center gap-2">
                        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 text-white text-xs">3</span>
                        {{ t('management.embeds.helpModal.step3Title') }}
                      </h4>
                      <p class="text-sm text-slate-600 ml-7">
                        {{ t('management.embeds.helpModal.step3Desc') }}
                      </p>
                    </div>

                    <div>
                      <h4 class="text-sm font-semibold text-sky-900 mb-2 flex items-center gap-2">
                        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 text-white text-xs">4</span>
                        {{ t('management.embeds.helpModal.step4Title') }}
                      </h4>
                      <p class="text-sm text-slate-600 ml-7">
                        {{ t('management.embeds.helpModal.step4Desc') }}
                      </p>
                    </div>

                    <div>
                      <h4 class="text-sm font-semibold text-sky-900 mb-2 flex items-center gap-2">
                        <span class="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 text-white text-xs">5</span>
                        {{ t('management.embeds.helpModal.step5Title') }}
                      </h4>
                      <p class="text-sm text-slate-600 ml-7">
                        {{ t('management.embeds.helpModal.step5Desc') }}
                      </p>
                    </div>

                    <div class="pt-3 border-t border-sky-200">
                      <h4 class="text-sm font-semibold text-sky-900 mb-2 flex items-center gap-1.5">
                        <span>💡</span>
                        <span>{{ t('management.embeds.helpModal.exampleLabel') }}</span>
                      </h4>
                      <p class="text-xs text-slate-600 mb-2">{{ t('management.embeds.helpModal.exampleHint') }}</p>
                      <code class="block text-xs bg-sky-100 p-2 rounded text-sky-900 break-all">
                        https://www.youtube.com/embed/VIDEO_ID
                      </code>
                    </div>
                  </div>
                </div>

                <!-- Close Button -->
                <div class="flex justify-end pt-2">
                  <button
                    @click="showYouTubeHelpModal = false"
                    class="px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-md transition-all duration-200"
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
import { useToast } from '../composables/useToast'

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
const { message, showSuccess, showError } = useToast()

// State
const formData = ref({
  youtube_embed_link: props.eventData?.youtube_embed_link || '',
})

const saving = ref(false)
const showDeleteModal = ref(false)
const deleting = ref(false)
const deleteModalData = ref({
  title: '',
  itemName: '',
  fieldToDelete: '',
})
const showYouTubeHelpModal = ref(false)
const urlInputRef = ref<HTMLInputElement | null>(null)

// Computed
const hasChanges = computed(() => {
  if (!props.eventData) return false

  return formData.value.youtube_embed_link !== (props.eventData.youtube_embed_link || '')
})

const urlError = computed(() => {
  const url = formData.value.youtube_embed_link
  return url && !validateYouTubeUrl(url) ? t('management.embeds.errors.invalidUrl') : null
})

const focusUrlInput = () => {
  if (props.canEdit) urlInputRef.value?.focus()
}

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
  if (!props.eventData || urlError.value) return

  saving.value = true

  try {
    // Prepare data - convert empty strings to null for removal
    const updateData = {
      youtube_embed_link: formData.value.youtube_embed_link.trim() || null,
    }

    const response = await eventsService.patchEvent(props.eventData.id, updateData)

    if (response.success && response.data) {
      emit('updated', response.data)
      showSuccess(t('management.embeds.youtube.successMessage'))
    } else {
      showError(response.message || t('management.embeds.errors.updateFailed'))
    }
  } catch {
    showError(t('management.embeds.errors.updateNetworkError'))
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
      showSuccess(t('management.embeds.youtube.successMessage'))
    } else {
      showError(response.message || t('management.embeds.errors.removeFailed'))
    }
  } catch {
    showError(t('management.embeds.errors.removeNetworkError'))
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
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

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
</style>
