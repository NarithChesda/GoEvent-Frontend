<template>
  <div class="space-y-6">
    <!-- Google Maps Embed -->
    <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 border border-white/20">
      <!-- Header (click to expand/collapse) -->
      <div class="flex items-start justify-between gap-3">
        <button
          type="button"
          class="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 rounded-lg"
          :aria-expanded="isMapExpanded"
          :aria-label="t('management.media.sectionToggle')"
          @click="toggleMap"
        >
          <h5 class="font-semibold text-slate-900">{{ t('management.embeds.map.title') }}</h5>
          <p class="text-sm text-slate-600">{{ t('management.embeds.map.description') }}</p>
        </button>
        <button
          type="button"
          class="p-2 -mt-1 -mr-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          :aria-expanded="isMapExpanded"
          :aria-label="t('management.media.sectionToggle')"
          :title="t('management.media.sectionToggle')"
          @click="toggleMap"
        >
          <ChevronDown class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': isMapExpanded }" aria-hidden="true" />
        </button>
      </div>

      <Transition name="collapse">
      <div v-if="isMapExpanded" class="grid grid-rows-[1fr]">
      <div class="min-h-0 overflow-hidden">
      <div class="pt-6">
        <!-- Set: the map itself, in the same 16:9 rounded frame the showcase
             gives it, with the actions that change it attached underneath.
             The embed URL never appears — it's plumbing, and the identity line
             says what's pinned in words the organizer recognises. -->
        <div v-if="mapPreviewUrl" class="rounded-2xl border border-slate-200 overflow-hidden bg-white">
          <div class="aspect-video">
            <iframe
              :src="mapPreviewUrl"
              width="100%"
              height="100%"
              style="border: 0"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              :title="t('management.embeds.map.title')"
            ></iframe>
          </div>

          <div class="flex items-center gap-2 px-3 py-2.5 border-t border-slate-100">
            <MapPin class="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
            <span class="flex-1 min-w-0">
              <span class="block text-sm font-medium text-slate-900 truncate">{{ mapSourceLabel }}</span>
              <span class="block text-xs text-slate-500 truncate">{{ mapSourceHint }}</span>
            </span>

            <template v-if="canEdit && eventData">
              <button
                type="button"
                @click="gmapModalOpen = true"
                class="inline-flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              >
                <Pencil class="w-3.5 h-3.5" aria-hidden="true" />
                <span>{{ t('management.embeds.map.changeBtn') }}</span>
              </button>
              <button
                type="button"
                @click="confirmRemoveMap"
                class="p-2 flex-shrink-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                :title="t('management.embeds.map.removeBtn')"
                :aria-label="t('management.embeds.map.removeBtn')"
              >
                <Trash2 class="w-4 h-4" aria-hidden="true" />
              </button>
            </template>
          </div>
        </div>

        <!-- Not set: the same add-a-map affordance the live preview shows on the
             invitation, opening the same editor, so the two entry points behave
             identically. -->
        <button
          v-else
          type="button"
          :disabled="!canEdit"
          @click="gmapModalOpen = true"
          :class="[
            'w-full aspect-video flex flex-col items-center justify-center gap-1.5 px-4 border-2 border-dashed rounded-2xl text-center transition-all duration-300',
            canEdit
              ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200'
              : 'border-slate-300 bg-slate-50 cursor-default'
          ]"
        >
          <Map
            class="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 transition-colors"
            :class="canEdit ? 'group-hover:text-emerald-600' : ''"
            aria-hidden="true"
          />
          <span class="text-sm font-semibold text-slate-700">
            {{ canEdit ? t('management.showcasePreview.editors.addMap') : t('management.embeds.map.empty') }}
          </span>
          <span v-if="canEdit" class="text-xs sm:text-sm text-slate-500">
            {{ t('management.embeds.map.emptyHint') }}
          </span>
        </button>
      </div>
      </div>
      </div>
      </Transition>
    </div>

    <!-- YouTube Embed -->
    <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 border border-white/20">
      <!-- Header (click to expand/collapse) -->
      <div class="flex items-start justify-between gap-3">
        <button
          type="button"
          class="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 rounded-lg"
          :aria-expanded="isYoutubeExpanded"
          :aria-label="t('management.media.sectionToggle')"
          @click="toggleYoutube"
        >
          <h5 class="font-semibold text-slate-900">{{ t('management.embeds.youtube.title') }}</h5>
          <p class="text-sm text-slate-600">{{ t('management.embeds.youtube.description') }}</p>
        </button>

        <div class="flex items-center gap-1 flex-shrink-0">
          <!-- Help Button — only while the section is open; a collapsed card
               shows nothing but its chevron. -->
          <button
            v-if="isYoutubeExpanded"
            @click="showYouTubeHelpModal = true"
            class="p-2 text-slate-400 hover:text-[#1e90ff] hover:bg-sky-50 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            :title="t('management.embeds.youtube.helpButtonTitle')"
          >
            <Info class="w-4 h-4" />
          </button>
          <button
            type="button"
            class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            :aria-expanded="isYoutubeExpanded"
            :aria-label="t('management.media.sectionToggle')"
            :title="t('management.media.sectionToggle')"
            @click="toggleYoutube"
          >
            <ChevronDown class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': isYoutubeExpanded }" aria-hidden="true" />
          </button>
        </div>
      </div>

      <Transition name="collapse">
      <div v-if="isYoutubeExpanded" class="grid grid-rows-[1fr]">
      <div class="min-h-0 overflow-hidden">
      <div class="space-y-3 sm:space-y-4 pt-6">
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
        <div v-if="canEdit && eventData && hasYoutubeChanges" class="flex justify-end">
          <button
            @click="saveYoutubeChanges"
            :disabled="savingYoutube || !!urlError"
            class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div
              v-if="savingYoutube"
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <Save v-else class="w-4 h-4" />
            <span>{{ savingYoutube ? t('management.embeds.youtube.saving') : t('management.embeds.youtube.saveBtn') }}</span>
          </button>
        </div>
      </div>
      </div>
      </div>
      </Transition>
    </div>

    <!-- The one map editor — the same component the showcase preview opens, so
         both entry points behave identically. It saves straight to the API. -->
    <GmapEmbedModal
      v-if="eventData"
      v-model="gmapModalOpen"
      :event-id="eventData.id"
      :current-link="formData.google_map_embed_link"
      @saved="handleGmapModalSaved"
    />

    <!-- Toast Feedback -->
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
import { Youtube, Map, MapPin, Pencil, Trash2, X, Save, ChevronDown, Info } from 'lucide-vue-next'
import { eventsService, type Event } from '../services/api'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import GmapEmbedModal from './showcase-preview/editors/GmapEmbedModal.vue'
import { extractYouTubeEmbedUrl, isGoogleMapsEmbedUrl } from '../utils/embedExtractor'
import { useVenueMapPresets } from '@/composables/useVenueMapPresets'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useToast } from '../composables/useToast'
import { useCollapsibleSection } from '@/composables/useCollapsibleSection'

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
const { showSuccess, showError } = useToast()
const { isExpanded: isMapExpanded, toggle: toggleMap } = useCollapsibleSection('map')
const { isExpanded: isYoutubeExpanded, toggle: toggleYoutube } = useCollapsibleSection('youtube')

// State
const formData = ref({
  youtube_embed_link: props.eventData?.youtube_embed_link || '',
  google_map_embed_link: props.eventData?.google_map_embed_link || '',
})

const savingYoutube = ref(false)
const showDeleteModal = ref(false)
const deleting = ref(false)
const deleteModalData = ref({
  title: '',
  itemName: '',
  fieldToDelete: '',
})
const showYouTubeHelpModal = ref(false)
const urlInputRef = ref<HTMLInputElement | null>(null)
/** The map editor, the same one the showcase preview opens. */
const gmapModalOpen = ref(false)

// Computed
const hasYoutubeChanges = computed(() => {
  if (!props.eventData) return false

  return formData.value.youtube_embed_link !== (props.eventData.youtube_embed_link || '')
})

const urlError = computed(() => {
  const url = formData.value.youtube_embed_link
  return url && !validateYouTubeUrl(url) ? t('management.embeds.errors.invalidUrl') : null
})

// Only preview a link we've validated — the map link lands in a live iframe
// src, so never feed it anything but a Google Maps embed URL.
const mapPreviewUrl = computed(() => {
  const url = formData.value.google_map_embed_link.trim()
  return url && isGoogleMapsEmbedUrl(url) ? url : ''
})

const { presets, activePresetId } = useVenueMapPresets(mapPreviewUrl)

const activeMapPreset = computed(
  () => presets.value.find((preset) => preset.id === activePresetId.value) ?? null,
)

// Name the map in words the organizer recognises. The `?pb=…` embed URL is
// machine plumbing — it only ever appears in the field you paste it into.
const mapSourceLabel = computed(
  () => activeMapPreset.value?.displayName ?? t('management.embeds.map.source.custom'),
)

const mapSourceHint = computed(() =>
  activeMapPreset.value
    ? activeMapPreset.value.displayCity || t('management.embeds.map.source.preset')
    : t('management.embeds.map.source.customHint'),
)

// The modal saves to the API itself, so adopt its result as the new baseline.
const handleGmapModalSaved = (updated: Event) => {
  formData.value.google_map_embed_link = updated.google_map_embed_link || ''
  emit('updated', updated)
  showSuccess(t('management.embeds.map.successMessage'))
}

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
        google_map_embed_link: newEventData.google_map_embed_link || '',
      }
    }
  },
  { immediate: true },
)

// Methods
const saveYoutubeChanges = async () => {
  if (!props.eventData || urlError.value) return

  savingYoutube.value = true

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
    savingYoutube.value = false
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

const confirmRemoveMap = () => {
  deleteModalData.value = {
    title: t('management.embeds.map.deleteModal.title'),
    itemName: t('management.embeds.map.deleteModal.itemName'),
    fieldToDelete: 'google_map_embed_link',
  }
  showDeleteModal.value = true
}

const handleDeleteConfirm = async () => {
  if (!props.eventData) return

  deleting.value = true

  try {
    const fieldToDelete = deleteModalData.value.fieldToDelete
    const updateData = {
      [fieldToDelete]: null,
    }

    const response = await eventsService.patchEvent(props.eventData.id, updateData)

    if (response.success && response.data) {
      // Update local form data
      if (fieldToDelete === 'youtube_embed_link') {
        formData.value.youtube_embed_link = ''
      } else if (fieldToDelete === 'google_map_embed_link') {
        formData.value.google_map_embed_link = ''
      }

      emit('updated', response.data)
      showDeleteModal.value = false
      showSuccess(
        fieldToDelete === 'google_map_embed_link'
          ? t('management.embeds.map.successMessage')
          : t('management.embeds.youtube.successMessage'),
      )
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

// The map editor handles its own iframe-paste extraction (GmapEmbedFields).
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

/* Collapse/expand via grid-template-rows 0fr↔1fr — tracks real content
   height so both directions ease evenly (no max-height dead time) */
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none !important;
  }
}
</style>
