<template>
  <div class="space-y-6" @click="dropdownManager.handleClickOutside">
    <!-- Brand Assets Section (logos + event video) -->
    <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 border border-white/20">
      <!-- Header -->
      <div class="mb-6">
        <h5 class="font-semibold text-slate-900">{{ t('management.media.mediaUploads.brandAssets.title') }}</h5>
        <p class="text-sm text-slate-600">{{ t('management.media.mediaUploads.brandAssets.subtitle') }}</p>
      </div>

      <!-- Asset rows -->
      <div class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        <button
          v-for="row in assetRows"
          :key="row.field"
          @click="openAsset(row.field)"
          :aria-label="t('management.media.mediaUploads.row.ariaLabel', { name: row.title })"
          class="w-full flex items-center gap-3 p-3 sm:p-4 min-h-[56px] text-left hover:bg-slate-50 active:bg-slate-100 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-inset"
        >
          <!-- Leading: thumbnail or icon disc -->
          <div
            v-if="row.contentType === 'image' && row.mediaUrl"
            class="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden p-1"
          >
            <img :src="row.mediaUrl" :alt="row.title" class="max-w-full max-h-full object-contain" />
          </div>
          <div
            v-else
            class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border"
            :class="row.mediaUrl ? 'bg-sky-50 border-sky-100' : 'bg-slate-50 border-slate-100'"
          >
            <component
              :is="row.contentType === 'video' ? Video : ImageIcon"
              class="w-4 h-4"
              :class="row.mediaUrl ? 'text-[#1e90ff]' : 'text-slate-400'"
              aria-hidden="true"
            />
          </div>

          <!-- Body -->
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-medium truncate"
              :class="row.mediaUrl ? 'text-slate-900' : 'text-slate-500'"
            >
              {{ row.title }}
            </p>
            <p v-if="row.mediaUrl" class="text-xs sm:text-sm text-slate-500 line-clamp-1 mt-0.5">
              {{ filenameFromUrl(row.rawUrl) || t('management.media.mediaUploads.row.uploaded') }}
            </p>
            <p v-else class="text-xs sm:text-sm text-slate-400 italic mt-0.5">
              {{ t('management.media.mediaUploads.row.emptyPreview') }}
            </p>
          </div>

          <!-- Trailing: uploading spinner or chevron -->
          <div
            v-if="mediaUpload.isUploading.value(row.field)"
            class="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin flex-shrink-0"
          ></div>
          <ChevronRight v-else class="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Event Music Section -->
    <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 border border-white/20">
      <!-- Header -->
      <div class="flex items-center justify-between gap-3 mb-6">
        <div class="min-w-0">
          <h5 class="font-semibold text-slate-900">{{ t('management.media.mediaUploads.music.title') }}</h5>
          <p class="text-sm text-slate-600">{{ t('management.media.mediaUploads.music.description') }}</p>
        </div>

        <!-- Options button when content exists -->
        <div v-if="canEdit && musicSource !== 'none'" class="relative flex-shrink-0">
          <button
            @click.stop="dropdownManager.toggleDropdown('music')"
            :disabled="mediaUpload.isUploading.value('music') || savingMusicSelection"
            :title="t('management.media.mediaUploads.music.optionsAriaLabel')"
            :aria-label="t('management.media.mediaUploads.music.optionsAriaLabel')"
            class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MoreHorizontal class="w-5 h-5" aria-hidden="true" />
          </button>

          <!-- Dropdown menu -->
          <Transition name="dropdown">
            <div
              v-if="dropdownManager.isOpen('music')"
              @click.stop
              class="absolute right-0 top-full mt-2 min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-xl z-[100] py-1"
            >
              <button
                @click="showMusicModal = true; dropdownManager.closeAllDropdowns()"
                :disabled="savingMusicSelection"
                class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Library class="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span>{{ t('management.media.mediaUploads.music.library.browse') }}</span>
              </button>
              <button
                v-if="musicSource === 'library'"
                @click="handleClearLibraryMusic(); dropdownManager.closeAllDropdowns()"
                :disabled="savingMusicSelection"
                class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 text-left border-t border-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X class="w-4 h-4" aria-hidden="true" />
                <span>{{ t('management.media.mediaUploads.music.library.remove') }}</span>
              </button>
              <button
                v-if="musicSource === 'custom'"
                @click="confirmRemove('music', t('management.media.mediaUploads.music.deleteTitle'), t('management.media.mediaUploads.music.title')); dropdownManager.closeAllDropdowns()"
                :disabled="mediaUpload.isUploading.value('music')"
                class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 text-left border-t border-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X class="w-4 h-4" aria-hidden="true" />
                <span>{{ t('management.media.mediaUploads.music.custom.delete') }}</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Player - when music exists -->
      <div v-if="musicSource !== 'none'">
        <div class="bg-white rounded-2xl border border-slate-200 p-4">
          <div class="flex items-center gap-4">
            <!-- Play/Pause Button -->
            <button
              @click="toggleMusicPlayback"
              :disabled="!currentMusicUrl"
              :aria-label="isMusicPlaying ? t('management.media.mediaUploads.music.pauseAriaLabel') : t('management.media.mediaUploads.music.playAriaLabel')"
              class="w-12 h-12 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:opacity-90 text-white rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2"
            >
              <Pause v-if="isMusicPlaying" class="w-5 h-5" aria-hidden="true" />
              <Play v-else class="w-5 h-5 ml-0.5" aria-hidden="true" />
            </button>

            <!-- Track Info -->
            <div class="flex-1 min-w-0">
              <span
                class="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase mb-1"
                :class="musicSource === 'library'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-sky-50 text-sky-700 border-sky-200'"
              >
                {{ musicSource === 'library' ? t('management.media.mediaUploads.music.library.badge') : t('management.media.mediaUploads.music.custom.badge') }}
              </span>
              <p class="text-sm font-semibold text-slate-900 truncate">{{ musicTitle }}</p>
              <p v-if="musicMeta" class="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{{ musicMeta }}</p>
            </div>

            <!-- Music visualizer indicator when playing -->
            <div v-if="isMusicPlaying" class="flex items-end gap-0.5 h-4 flex-shrink-0" aria-hidden="true">
              <span class="w-1 bg-[#2ecc71] rounded-full animate-pulse" style="height: 40%; animation-delay: 0ms"></span>
              <span class="w-1 bg-[#2ecc71] rounded-full animate-pulse" style="height: 80%; animation-delay: 150ms"></span>
              <span class="w-1 bg-[#2ecc71] rounded-full animate-pulse" style="height: 60%; animation-delay: 300ms"></span>
              <span class="w-1 bg-[#2ecc71] rounded-full animate-pulse" style="height: 100%; animation-delay: 450ms"></span>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="mt-4">
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-500 tabular-nums w-10 text-right">{{ formatTime(currentTime) }}</span>
              <div
                class="flex-1 h-1.5 bg-slate-100 rounded-full cursor-pointer overflow-hidden"
                @click="seekMusic"
                ref="progressBarRef"
              >
                <div
                  class="h-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] rounded-full transition-all duration-100"
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
      <div v-else>
        <!-- Editable: two source option rows -->
        <div
          v-if="canEdit"
          class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden"
        >
          <button
            @click="showMusicModal = true"
            class="w-full flex items-center gap-3 p-3 sm:p-4 min-h-[56px] text-left hover:bg-slate-50 active:bg-slate-100 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-inset"
          >
            <div class="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
              <Library class="w-4 h-4 text-slate-400" aria-hidden="true" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-900 truncate">{{ t('management.media.mediaUploads.music.library.browse') }}</p>
              <p class="text-xs sm:text-sm text-slate-500 line-clamp-1 mt-0.5">{{ t('management.media.mediaUploads.music.library.browseSub') }}</p>
            </div>
            <ChevronRight class="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
          </button>

          <button
            @click="triggerMusicFileInput"
            :disabled="mediaUpload.isUploading.value('music')"
            class="w-full flex items-center gap-3 p-3 sm:p-4 min-h-[56px] text-left hover:bg-slate-50 active:bg-slate-100 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-inset disabled:cursor-not-allowed"
          >
            <div class="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
              <div
                v-if="mediaUpload.isUploading.value('music')"
                class="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"
              ></div>
              <Upload v-else class="w-4 h-4 text-slate-400" aria-hidden="true" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-900 truncate">
                {{ mediaUpload.isUploading.value('music') ? t('management.media.mediaUploads.music.custom.uploading') : t('management.media.mediaUploads.music.custom.upload') }}
              </p>
              <p class="text-xs sm:text-sm text-slate-500 line-clamp-1 mt-0.5">{{ t('management.media.mediaUploads.music.custom.uploadSub') }}</p>
            </div>
            <ChevronRight v-if="!mediaUpload.isUploading.value('music')" class="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
          </button>
        </div>

        <!-- View-only empty state -->
        <div
          v-else
          class="border-2 border-dashed border-slate-300 bg-slate-50 rounded-2xl p-8 text-center"
        >
          <div class="flex flex-col items-center justify-center">
            <Music class="w-8 h-8 text-slate-400 mb-3" aria-hidden="true" />
            <p class="text-sm font-semibold text-slate-600">{{ t('management.media.mediaUploads.music.empty') }}</p>
            <p class="text-xs text-slate-400 mt-1">{{ t('management.media.mediaUploads.music.emptySub') }}</p>
          </div>
        </div>

        <!-- Hidden file input for custom music -->
        <input
          ref="musicFileInputRef"
          type="file"
          accept="audio/*"
          @change="handleMusicFileChange"
          class="hidden"
        />
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="mediaUpload.error.value" class="bg-red-50 border border-red-200 rounded-2xl p-4">
      <div class="flex items-center space-x-2">
        <AlertCircle class="w-5 h-5 text-red-500" aria-hidden="true" />
        <p class="text-red-600 font-medium">{{ mediaUpload.error.value }}</p>
      </div>
    </div>

    <!-- Asset detail drawer -->
    <MediaAssetDrawer
      v-model="showAssetDrawer"
      :title="activeAsset?.title ?? ''"
      :description="activeAsset?.description ?? ''"
      :content-type="activeAsset?.contentType ?? 'image'"
      :media-url="activeAsset?.mediaUrl ?? null"
      :can-edit="canEdit"
      :is-uploading="activeAsset ? mediaUpload.isUploading.value(activeAsset.field) : false"
      :accept-types="activeAsset?.acceptTypes ?? 'image/*'"
      :empty-state-text="activeAsset?.emptyText ?? ''"
      :download-url="activeAsset?.downloadUrl ?? null"
      :error="mediaUpload.error.value"
      @upload="handleAssetUpload"
      @remove="handleAssetRemove"
    />

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
import { useAppLanguage } from '@/composables/useAppLanguage'
import { AlertCircle, ChevronRight, ImageIcon, Library, MoreHorizontal, Music, Pause, Play, Upload, Video, X } from 'lucide-vue-next'
import type { Event, BackgroundMusic } from '@/services/api'
import { eventsService } from '@/services/api'
import { useMediaUpload, type MediaFieldName, type MediaType } from '@/composables/useMediaUpload'
import { useDropdownManager } from '@/composables/useDropdownManager'
import { useMediaUrl } from '@/composables/useMediaUrl'
import { usePaymentTemplateIntegration } from '@/composables/usePaymentTemplateIntegration'
import MediaAssetDrawer from './MediaAssetDrawer.vue'
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

const { t } = useAppLanguage()

// Composables
const eventDataRef = toRef(props, 'eventData')
const mediaUpload = useMediaUpload(eventDataRef, (event) => emit('updated', event))
const dropdownManager = useDropdownManager(['music'])
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

// ---- Brand asset rows ----

type AssetField = Extract<MediaFieldName, 'logo_one' | 'logo_two' | 'event_video'>

interface AssetRow {
  field: AssetField
  contentType: 'image' | 'video'
  mediaType: MediaType
  acceptTypes: string
  title: string
  description: string
  emptyText: string
  deleteTitle: string
  /** Raw URL from the API (used to derive the filename preview) */
  rawUrl?: string | null
  /** Resolved absolute URL for display */
  mediaUrl?: string
  downloadUrl?: string | null
}

const assetRows = computed<AssetRow[]>(() => {
  const rows: AssetRow[] = [
    {
      field: 'logo_one',
      contentType: 'image',
      mediaType: 'image',
      acceptTypes: 'image/*',
      title: t('management.media.mediaUploads.primaryLogo.title'),
      description: t('management.media.mediaUploads.primaryLogo.description'),
      emptyText: t('management.media.mediaUploads.primaryLogo.empty'),
      deleteTitle: t('management.media.mediaUploads.primaryLogo.deleteTitle'),
      rawUrl: props.eventData?.logo_one,
      mediaUrl: getMediaUrl(props.eventData?.logo_one),
      downloadUrl: props.eventData?.event_template_details?.sample_logo_1 ?? null,
    },
    {
      field: 'logo_two',
      contentType: 'image',
      mediaType: 'image',
      acceptTypes: 'image/*',
      title: t('management.media.mediaUploads.secondaryLogo.title'),
      description: t('management.media.mediaUploads.secondaryLogo.description'),
      emptyText: t('management.media.mediaUploads.secondaryLogo.empty'),
      deleteTitle: t('management.media.mediaUploads.secondaryLogo.deleteTitle'),
      rawUrl: props.eventData?.logo_two,
      mediaUrl: getMediaUrl(props.eventData?.logo_two),
      downloadUrl: null,
    },
  ]

  if (shouldShowVideoSection.value) {
    rows.push({
      field: 'event_video',
      contentType: 'video',
      mediaType: 'video',
      acceptTypes: 'video/*',
      title: t('management.media.mediaUploads.video.title'),
      description: t('management.media.mediaUploads.video.description'),
      emptyText: t('management.media.mediaUploads.video.empty'),
      deleteTitle: t('management.media.mediaUploads.video.deleteTitle'),
      rawUrl: props.eventData?.event_video,
      mediaUrl: getMediaUrl(props.eventData?.event_video),
      downloadUrl: null,
    })
  }

  return rows
})

// Asset drawer state
const showAssetDrawer = ref(false)
const activeAssetField = ref<AssetField | null>(null)

const activeAsset = computed(() =>
  assetRows.value.find((row) => row.field === activeAssetField.value) ?? null
)

const openAsset = (field: AssetField) => {
  mediaUpload.clearError()
  activeAssetField.value = field
  showAssetDrawer.value = true
}

const handleAssetUpload = (file: File) => {
  if (activeAsset.value) {
    handleUpload(activeAsset.value.field, file, activeAsset.value.mediaType)
  }
}

const handleAssetRemove = () => {
  if (activeAsset.value) {
    confirmRemove(activeAsset.value.field, activeAsset.value.deleteTitle, activeAsset.value.title)
  }
}

/** Extract a readable filename from a media URL */
const filenameFromUrl = (url?: string | null): string | null => {
  if (!url) return null
  try {
    const pathname = url.includes('://') ? new URL(url).pathname : url
    const filename = pathname.split('/').pop() || ''
    return decodeURIComponent(filename).split('?')[0] || null
  } catch {
    return null
  }
}

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
  const fallback = t('management.media.mediaUploads.music.custom.filename')
  return filenameFromUrl(props.eventData?.music) || fallback
})

const musicTitle = computed(() => {
  if (musicSource.value === 'library') {
    return currentMusicName.value || t('management.media.mediaUploads.music.library.unknown')
  }
  return customMusicFilename.value
})

const musicMeta = computed(() => {
  if (musicSource.value === 'library') {
    const details = props.eventData?.selected_music_details
    if (!details?.category_display) return ''
    return details.duration_display
      ? `${details.category_display} · ${details.duration_display}`
      : details.category_display
  }
  if (musicDuration.value > 0) {
    return `${t('management.media.mediaUploads.music.custom.duration')}: ${formatTime(musicDuration.value)}`
  }
  return ''
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
const handleMusicFileChange = (event: globalThis.Event) => {
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

<style scoped>
/* Dropdown menu transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
