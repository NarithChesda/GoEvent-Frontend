<template>
  <div class="space-y-6" @click="dropdownManager.handleClickOutside">
    <!-- Logos Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Primary Logo -->
      <MediaUploadCard
        title="Primary Logo"
        description="Main event or organization logo. For best results, use a transparent image (PNG, WebP)"
        :media-url="getMediaUrl(eventData?.logo_one)"
        :can-edit="canEdit"
        :is-uploading="mediaUpload.isUploading.value('logo_one')"
        :show-dropdown="dropdownManager.isOpen('logoOne')"
        accept-types="image/*"
        content-type="image"
        image-class="h-[100px] object-contain bg-slate-50 p-4"
        empty-state-text="No logo uploaded"
        @upload="(file) => handleUpload('logo_one', file, 'image')"
        @remove="confirmRemove('logo_one', 'Delete Primary Logo', 'Primary Logo')"
        @toggle-dropdown="dropdownManager.toggleDropdown('logoOne')"
        @close-dropdown="dropdownManager.closeAllDropdowns()"
      >
        <template #content="{ mediaUrl }">
          <div class="relative group">
            <div class="h-48 flex items-center justify-center bg-slate-50 rounded-2xl p-6">
              <img
                :src="mediaUrl"
                :alt="eventData?.title + ' primary logo'"
                class="max-w-full max-h-full object-contain"
              />
            </div>
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
              <p class="text-white font-medium">Primary Logo</p>
            </div>
          </div>
        </template>
        <template #empty-state>
          <div class="flex flex-col items-center justify-center min-h-[120px]">
            <div
              :class="[
                'w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300',
                canEdit ? 'bg-slate-200 group-hover:bg-emerald-100' : 'bg-slate-200'
              ]"
            >
              <Plus
                v-if="canEdit"
                :class="[
                  'w-6 h-6 transition-colors',
                  'text-slate-400 group-hover:text-emerald-600'
                ]"
              />
              <ImageIcon v-else class="w-6 h-6 text-slate-400" />
            </div>
            <p
              :class="[
                'text-sm font-semibold transition-colors',
                canEdit ? 'text-slate-600 group-hover:text-slate-900' : 'text-slate-600'
              ]"
            >
              No logo uploaded
            </p>
            <p v-if="canEdit" class="text-xs text-slate-400 mt-1">Click to upload</p>
          </div>
        </template>
      </MediaUploadCard>

      <!-- Secondary Logo -->
      <MediaUploadCard
        title="Secondary Logo"
        description="Displayed when showcase is in other languages (English, etc.). Use transparent image (PNG, WebP)"
        :media-url="getMediaUrl(eventData?.logo_two)"
        :can-edit="canEdit"
        :is-uploading="mediaUpload.isUploading.value('logo_two')"
        :show-dropdown="dropdownManager.isOpen('logoTwo')"
        accept-types="image/*"
        content-type="image"
        image-class="h-[100px] object-contain bg-slate-50 p-4"
        empty-state-text="No logo uploaded"
        @upload="(file) => handleUpload('logo_two', file, 'image')"
        @remove="confirmRemove('logo_two', 'Delete Secondary Logo', 'Secondary Logo')"
        @toggle-dropdown="dropdownManager.toggleDropdown('logoTwo')"
        @close-dropdown="dropdownManager.closeAllDropdowns()"
      >
        <template #content="{ mediaUrl }">
          <div class="relative group">
            <div class="h-48 flex items-center justify-center bg-slate-50 rounded-2xl p-6">
              <img
                :src="mediaUrl"
                :alt="eventData?.title + ' secondary logo'"
                class="max-w-full max-h-full object-contain"
              />
            </div>
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
              <p class="text-white font-medium">Secondary Logo</p>
            </div>
          </div>
        </template>
        <template #empty-state>
          <div class="flex flex-col items-center justify-center min-h-[120px]">
            <div
              :class="[
                'w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300',
                canEdit ? 'bg-slate-200 group-hover:bg-emerald-100' : 'bg-slate-200'
              ]"
            >
              <Plus
                v-if="canEdit"
                :class="[
                  'w-6 h-6 transition-colors',
                  'text-slate-400 group-hover:text-emerald-600'
                ]"
              />
              <ImageIcon v-else class="w-6 h-6 text-slate-400" />
            </div>
            <p
              :class="[
                'text-sm font-semibold transition-colors',
                canEdit ? 'text-slate-600 group-hover:text-slate-900' : 'text-slate-600'
              ]"
            >
              No logo uploaded
            </p>
            <p v-if="canEdit" class="text-xs text-slate-400 mt-1">Click to upload</p>
          </div>
        </template>
      </MediaUploadCard>
    </div>

    <!-- Event Video (only shown for Standard template when active) -->
    <MediaUploadCard
      v-if="shouldShowVideoSection"
      title="Event Video"
      description="Upload a promotional or highlight video (Max 10MB)"
      :media-url="getMediaUrl(eventData?.event_video)"
      :can-edit="canEdit"
      :is-uploading="mediaUpload.isUploading.value('event_video')"
      :show-dropdown="dropdownManager.isOpen('video')"
      accept-types="video/*"
      content-type="video"
      empty-state-text="No video uploaded"
      empty-state-subtext="Consider using YouTube embed for large files"
      @upload="(file) => handleUpload('event_video', file, 'video')"
      @remove="confirmRemove('event_video', 'Delete Event Video', 'Event Video')"
      @toggle-dropdown="dropdownManager.toggleDropdown('video')"
      @close-dropdown="dropdownManager.closeAllDropdowns()"
    />

    <!-- Event Music Section -->
    <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h5 class="font-semibold text-slate-900">Event Music</h5>
          <p class="text-sm text-slate-600">Background music for your event showcase</p>
        </div>

        <!-- Options button when content exists -->
        <div v-if="canEdit && musicSource !== 'none'" class="relative">
          <button
            @click.stop="dropdownManager.toggleDropdown('music')"
            :disabled="mediaUpload.isUploading.value('music') || savingMusicSelection"
            class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MoreHorizontal class="w-5 h-5" />
          </button>

          <!-- Dropdown menu -->
          <Transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <div
              v-if="dropdownManager.isOpen('music')"
              @click.stop
              class="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20 min-w-[180px]"
            >
              <button
                @click="showMusicModal = true; dropdownManager.closeAllDropdowns()"
                :disabled="savingMusicSelection"
                class="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Library class="w-4 h-4 text-slate-500" />
                <span>Browse Library</span>
              </button>
              <button
                v-if="musicSource === 'library'"
                @click="handleClearLibraryMusic(); dropdownManager.closeAllDropdowns()"
                :disabled="savingMusicSelection"
                class="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <X class="w-4 h-4" />
                <span>Remove Music</span>
              </button>
              <button
                v-if="musicSource === 'custom'"
                @click="confirmRemove('music', 'Delete Event Music', 'Event Music'); dropdownManager.closeAllDropdowns()"
                :disabled="mediaUpload.isUploading.value('music')"
                class="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <X class="w-4 h-4" />
                <span>Delete Music</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Content Display - When music exists -->
      <div v-if="musicSource !== 'none'">
        <!-- Library Music Display -->
        <div
          v-if="musicSource === 'library'"
          class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100"
        >
          <div class="flex items-center gap-4">
            <!-- Play/Pause Button -->
            <button
              @click="toggleMusicPlayback"
              :disabled="!currentMusicUrl"
              class="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <Pause v-if="isMusicPlaying" class="w-5 h-5" />
              <Play v-else class="w-5 h-5 ml-0.5" />
            </button>

            <!-- Track Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <Library class="w-3.5 h-3.5 text-emerald-600" />
                <span class="text-xs text-emerald-600 font-medium uppercase tracking-wide">From Library</span>
              </div>
              <p class="font-semibold text-slate-900 truncate">{{ currentMusicName || 'Unknown Track' }}</p>
              <p v-if="eventData?.selected_music_details?.category_display" class="text-sm text-slate-500 mt-0.5">
                {{ eventData.selected_music_details.category_display }}
                <span v-if="eventData.selected_music_details.duration_display" class="text-slate-400">
                  · {{ eventData.selected_music_details.duration_display }}
                </span>
              </p>
            </div>

            <!-- Music visualizer indicator when playing -->
            <div v-if="isMusicPlaying" class="flex items-end gap-0.5 h-4">
              <span class="w-1 bg-emerald-500 rounded-full animate-pulse" style="height: 40%; animation-delay: 0ms"></span>
              <span class="w-1 bg-emerald-500 rounded-full animate-pulse" style="height: 80%; animation-delay: 150ms"></span>
              <span class="w-1 bg-emerald-500 rounded-full animate-pulse" style="height: 60%; animation-delay: 300ms"></span>
              <span class="w-1 bg-emerald-500 rounded-full animate-pulse" style="height: 100%; animation-delay: 450ms"></span>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="mt-4">
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-500 tabular-nums w-10 text-right">{{ formatTime(currentTime) }}</span>
              <div
                class="flex-1 h-1.5 bg-emerald-200 rounded-full cursor-pointer overflow-hidden"
                @click="seekMusic"
                ref="progressBarRef"
              >
                <div
                  class="h-full bg-emerald-500 rounded-full transition-all duration-100"
                  :style="{ width: `${musicProgress}%` }"
                ></div>
              </div>
              <span class="text-xs text-slate-500 tabular-nums w-10">{{ formatTime(musicDuration) }}</span>
            </div>
          </div>
        </div>

        <!-- Custom Music Display -->
        <div
          v-else-if="musicSource === 'custom'"
          class="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-4 border border-violet-100"
        >
          <div class="flex items-center gap-4">
            <!-- Play/Pause Button -->
            <button
              @click="toggleMusicPlayback"
              :disabled="!currentMusicUrl"
              class="w-12 h-12 bg-violet-500 hover:bg-violet-600 text-white rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              <Pause v-if="isMusicPlaying" class="w-5 h-5" />
              <Play v-else class="w-5 h-5 ml-0.5" />
            </button>

            <!-- Track Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <Upload class="w-3.5 h-3.5 text-violet-600" />
                <span class="text-xs text-violet-600 font-medium uppercase tracking-wide">Custom Upload</span>
              </div>
              <p class="font-semibold text-slate-900 truncate">{{ customMusicFilename }}</p>
              <p v-if="musicDuration > 0" class="text-sm text-slate-500 mt-0.5">
                Duration: {{ formatTime(musicDuration) }}
              </p>
            </div>

            <!-- Music visualizer indicator when playing -->
            <div v-if="isMusicPlaying" class="flex items-end gap-0.5 h-4">
              <span class="w-1 bg-violet-500 rounded-full animate-pulse" style="height: 40%; animation-delay: 0ms"></span>
              <span class="w-1 bg-violet-500 rounded-full animate-pulse" style="height: 80%; animation-delay: 150ms"></span>
              <span class="w-1 bg-violet-500 rounded-full animate-pulse" style="height: 60%; animation-delay: 300ms"></span>
              <span class="w-1 bg-violet-500 rounded-full animate-pulse" style="height: 100%; animation-delay: 450ms"></span>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="mt-4">
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-500 tabular-nums w-10 text-right">{{ formatTime(currentTime) }}</span>
              <div
                class="flex-1 h-1.5 bg-violet-200 rounded-full cursor-pointer overflow-hidden"
                @click="seekMusic"
                ref="progressBarRef"
              >
                <div
                  class="h-full bg-violet-500 rounded-full transition-all duration-100"
                  :style="{ width: `${musicProgress}%` }"
                ></div>
              </div>
              <span class="text-xs text-slate-500 tabular-nums w-10">{{ formatTime(musicDuration) }}</span>
            </div>
          </div>
        </div>

        <!-- Hidden audio element with key for reactivity -->
        <audio
          ref="audioPlayerRef"
          :key="currentMusicUrl"
          :src="currentMusicUrl"
          @loadedmetadata="handleAudioLoaded"
          @timeupdate="handleTimeUpdate"
          @ended="handleAudioEnded"
          @error="handleAudioError"
          preload="metadata"
          class="hidden"
        />
      </div>

      <!-- Empty State - No music -->
      <div v-else class="space-y-3">
        <!-- Option 1: Browse Library -->
        <button
          v-if="canEdit"
          @click="showMusicModal = true"
          class="w-full border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-emerald-50/50 hover:border-emerald-400 rounded-2xl p-4 transition-all duration-300 group cursor-pointer text-left"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-slate-200 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center transition-all duration-300">
              <Library class="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">Browse Music Library</p>
              <p class="text-xs text-slate-400">Choose from our curated collection</p>
            </div>
            <ChevronRight class="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </div>
        </button>

        <!-- Option 2: Upload Custom (hidden file input) -->
        <input
          ref="musicFileInputRef"
          type="file"
          accept="audio/*"
          @change="handleMusicFileChange"
          class="hidden"
        />
        <button
          v-if="canEdit"
          @click="triggerMusicFileInput"
          :disabled="mediaUpload.isUploading.value('music')"
          class="w-full border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-violet-50/50 hover:border-violet-400 rounded-2xl p-4 transition-all duration-300 group cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-slate-200 group-hover:bg-violet-100 rounded-xl flex items-center justify-center transition-all duration-300">
              <div v-if="mediaUpload.isUploading.value('music')" class="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <Upload v-else class="w-5 h-5 text-slate-400 group-hover:text-violet-600 transition-colors" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                {{ mediaUpload.isUploading.value('music') ? 'Uploading...' : 'Upload Your Own' }}
              </p>
              <p class="text-xs text-slate-400">MP3, OGG, M4A, WebM (Max 20MB)</p>
            </div>
            <ChevronRight v-if="!mediaUpload.isUploading.value('music')" class="w-5 h-5 text-slate-300 group-hover:text-violet-500 transition-colors" />
          </div>
        </button>

        <!-- View-only empty state -->
        <div
          v-if="!canEdit"
          class="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-4"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Music class="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-600">No music added</p>
              <p class="text-xs text-slate-400">Background music not configured</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="mediaUpload.error.value" class="bg-red-50 border border-red-200 rounded-2xl p-4">
      <div class="flex items-center space-x-2">
        <AlertCircle class="w-5 h-5 text-red-500" />
        <p class="text-red-600 font-medium">{{ mediaUpload.error.value }}</p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :show="showDeleteModal"
      :loading="mediaUpload.deleting.value"
      :title="deleteModalData.title"
      :item-name="deleteModalData.itemName"
      @confirm="handleDeleteConfirm"
      @cancel="showDeleteModal = false"
    />

    <!-- Music Selection Modal -->
    <MusicSelectionModal
      :show="showMusicModal"
      :current-music-id="eventData?.selected_music"
      :saving="savingMusicSelection"
      @close="showMusicModal = false"
      @select="handleMusicSelect"
      @clear="handleClearLibraryMusic"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, toRef, watch, computed, reactive, onUnmounted } from 'vue'
import { AlertCircle, Plus, ImageIcon, Music, Library, MoreHorizontal, Upload, X, Play, Pause, ChevronRight } from 'lucide-vue-next'
import type { Event, BackgroundMusic } from '@/services/api'
import { eventsService } from '@/services/api'
import { useMediaUpload, type MediaFieldName, type MediaType } from '@/composables/useMediaUpload'
import { useDropdownManager } from '@/composables/useDropdownManager'
import { useMediaUrl } from '@/composables/useMediaUrl'
import { usePaymentTemplateIntegration } from '@/composables/usePaymentTemplateIntegration'
import MediaUploadCard from './MediaUploadCard.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'
import MusicSelectionModal from './MusicSelectionModal.vue'

interface Props {
  eventData?: Event
  canEdit: boolean
}

interface Emits {
  (e: 'updated', event: Event): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables
const eventDataRef = toRef(props, 'eventData')
const mediaUpload = useMediaUpload(eventDataRef, (event) => emit('updated', event))
const dropdownManager = useDropdownManager(['logoOne', 'logoTwo', 'video', 'music'])
const { getMediaUrl } = useMediaUrl()

// Create a reactive proxy for the event data to use with payment integration
// This is needed because usePaymentTemplateIntegration expects a plain object
const reactiveEventData = reactive({
  id: '',
  event_template: null as number | null | undefined,
  event_template_details: undefined as Event['event_template_details']
})

// Sync reactive event data with props
watch(
  () => props.eventData,
  (newData) => {
    if (newData) {
      reactiveEventData.id = newData.id
      reactiveEventData.event_template = newData.event_template ?? undefined
      reactiveEventData.event_template_details = newData.event_template_details ?? undefined
    }
  },
  { immediate: true }
)

// Initialize payment template integration
const paymentIntegration = usePaymentTemplateIntegration(reactiveEventData as Event)

// Check if video section should be shown
// Video section is only shown for Standard template when it's active
const shouldShowVideoSection = computed(() => {
  if (!props.eventData?.event_template_details || !props.eventData.event_template) {
    return false
  }

  // Check if template package plan name contains "standard" (case-insensitive)
  // The template type is identified by package_plan.name, not template.name
  const packagePlanName = props.eventData.event_template_details.package_plan?.name?.toLowerCase() || ''
  const isStandardTemplate = packagePlanName.includes('standard')

  if (!isStandardTemplate) {
    return false
  }

  // Check if template is activated via payment (confirmed payment exists)
  return paymentIntegration.isTemplateActivated.value
})

// Delete modal state
const showDeleteModal = ref(false)
const deleteModalData = ref<{
  title: string
  itemName: string
  fieldToDelete: MediaFieldName | ''
}>({
  title: '',
  itemName: '',
  fieldToDelete: ''
})

// Music library modal state
const showMusicModal = ref(false)
const savingMusicSelection = ref(false)
const musicFileInputRef = ref<HTMLInputElement | null>(null)

// Computed properties for music display
const musicSource = computed(() => {
  if (props.eventData?.music) {
    return 'custom'
  }
  if (props.eventData?.selected_music) {
    return 'library'
  }
  return 'none'
})

const currentMusicUrl = computed(() => {
  if (props.eventData?.music) {
    return getMediaUrl(props.eventData.music)
  }
  if (props.eventData?.selected_music_details?.audio_file) {
    return getMediaUrl(props.eventData.selected_music_details.audio_file)
  }
  return undefined
})

const currentMusicName = computed(() => {
  if (props.eventData?.selected_music_details) {
    return props.eventData.selected_music_details.name
  }
  return undefined
})

// Extract filename from custom music URL
const customMusicFilename = computed(() => {
  if (!props.eventData?.music) return 'Custom Music'
  try {
    const url = props.eventData.music
    // Extract filename from URL path
    const pathname = url.includes('://') ? new URL(url).pathname : url
    const filename = pathname.split('/').pop() || 'Custom Music'
    // Decode URI components and clean up the filename
    const decoded = decodeURIComponent(filename)
    // Remove any query parameters
    return decoded.split('?')[0] || 'Custom Music'
  } catch {
    return 'Custom Music'
  }
})

// Audio player state
const audioPlayerRef = ref<HTMLAudioElement | null>(null)
const progressBarRef = ref<HTMLDivElement | null>(null)
const isMusicPlaying = ref(false)
const currentTime = ref(0)
const musicDuration = ref(0)

// Computed property for progress percentage
const musicProgress = computed(() => {
  if (musicDuration.value === 0) return 0
  return (currentTime.value / musicDuration.value) * 100
})

/**
 * Format time in MM:SS format
 */
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Toggle music playback
 */
const toggleMusicPlayback = () => {
  if (!audioPlayerRef.value) return

  if (isMusicPlaying.value) {
    audioPlayerRef.value.pause()
    isMusicPlaying.value = false
  } else {
    audioPlayerRef.value.play().catch((error) => {
      console.error('Error playing audio:', error)
    })
    isMusicPlaying.value = true
  }
}

/**
 * Handle audio metadata loaded
 */
const handleAudioLoaded = () => {
  if (audioPlayerRef.value) {
    musicDuration.value = audioPlayerRef.value.duration
  }
}

/**
 * Handle audio time update
 */
const handleTimeUpdate = () => {
  if (audioPlayerRef.value) {
    currentTime.value = audioPlayerRef.value.currentTime
  }
}

/**
 * Handle audio ended
 */
const handleAudioEnded = () => {
  isMusicPlaying.value = false
  currentTime.value = 0
}

/**
 * Handle audio error
 */
const handleAudioError = () => {
  isMusicPlaying.value = false
  console.error('Error loading audio file')
}

/**
 * Seek to position in the track
 */
const seekMusic = (event: MouseEvent) => {
  if (!audioPlayerRef.value || !progressBarRef.value) return

  const rect = progressBarRef.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = clickX / rect.width
  const newTime = percentage * musicDuration.value

  audioPlayerRef.value.currentTime = newTime
  currentTime.value = newTime
}

/**
 * Handle file upload with validation
 */
const handleUpload = async (
  fieldName: MediaFieldName,
  file: File,
  mediaType: MediaType
) => {
  const validation = mediaUpload.validateFile(file, mediaType)

  if (validation.valid) {
    await mediaUpload.uploadMedia(fieldName, file)
  }
}

/**
 * Trigger music file input click
 */
const triggerMusicFileInput = () => {
  musicFileInputRef.value?.click()
}

/**
 * Handle music file selection from file input
 */
const handleMusicFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    handleUpload('music', file, 'audio')
  }

  // Reset input to allow re-uploading the same file
  target.value = ''
}

/**
 * Show delete confirmation modal
 */
const confirmRemove = (
  fieldName: MediaFieldName,
  title: string,
  itemName: string
) => {
  deleteModalData.value = {
    title,
    itemName,
    fieldToDelete: fieldName
  }
  showDeleteModal.value = true
}

/**
 * Handle delete confirmation
 */
const handleDeleteConfirm = async () => {
  if (deleteModalData.value.fieldToDelete) {
    const success = await mediaUpload.removeMedia(deleteModalData.value.fieldToDelete)
    if (success) {
      showDeleteModal.value = false
    }
  }
}

/**
 * Handle library music selection
 */
const handleMusicSelect = async (track: BackgroundMusic) => {
  if (!props.eventData?.id) return

  savingMusicSelection.value = true
  try {
    const response = await eventsService.patchEvent(props.eventData.id, {
      selected_music: track.id,
    })

    if (response.success && response.data) {
      // The API response may not include selected_music_details,
      // so we merge the track info we already have from the selection
      const updatedEvent = {
        ...response.data,
        selected_music: track.id,
        selected_music_details: response.data.selected_music_details || track,
      }
      emit('updated', updatedEvent)
      showMusicModal.value = false
    }
  } finally {
    savingMusicSelection.value = false
  }
}

/**
 * Clear library music selection
 */
const handleClearLibraryMusic = async () => {
  if (!props.eventData?.id) return

  savingMusicSelection.value = true
  try {
    const response = await eventsService.patchEvent(props.eventData.id, {
      selected_music: null,
    })

    if (response.success && response.data) {
      emit('updated', response.data)
      showMusicModal.value = false
    }
  } finally {
    savingMusicSelection.value = false
  }
}

// Clear error when eventData changes
watch(() => props.eventData, () => {
  mediaUpload.clearError()
})

// Reset audio player state when music URL changes
watch(currentMusicUrl, () => {
  isMusicPlaying.value = false
  currentTime.value = 0
  musicDuration.value = 0
})

// Cleanup audio player on unmount
onUnmounted(() => {
  if (audioPlayerRef.value) {
    audioPlayerRef.value.pause()
    audioPlayerRef.value.src = ''
  }
})

// Load payments when event data is available
watch(
  () => props.eventData?.id,
  (eventId) => {
    if (eventId && props.eventData?.event_template) {
      paymentIntegration.loadPayments()
    }
  },
  { immediate: true }
)
</script>
