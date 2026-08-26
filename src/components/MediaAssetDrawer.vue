<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="drawer-backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="closeDrawer"
      />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="drawer-panel">
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[32.5rem] lg:w-[35rem] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center justify-between px-3 py-2.5">
            <div class="flex items-center gap-2 min-w-0">
              <button
                @click="closeDrawer"
                class="p-1.5 hover:bg-white/20 rounded-lg drawer-close flex-shrink-0"
                :title="t('management.media.mediaUploads.drawer.closeTitle')"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <div class="flex items-center gap-2 min-w-0">
                <component
                  :is="contentType === 'video' ? Video : ImageIcon"
                  class="w-4 h-4 text-white flex-shrink-0"
                  aria-hidden="true"
                />
                <h2 class="text-base font-semibold text-white truncate">{{ title }}</h2>
              </div>
            </div>
            <!-- Delete (when an asset exists) -->
            <button
              v-if="canEdit && mediaUrl"
              type="button"
              @click="emit('remove')"
              :disabled="isUploading"
              :title="t('management.media.mediaUploads.drawer.deleteBtn')"
              :aria-label="t('management.media.mediaUploads.drawer.deleteBtn')"
              class="p-1.5 hover:bg-white/20 rounded-lg drawer-close flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 class="w-5 h-5 text-white" aria-hidden="true" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <div class="p-4 space-y-4 pb-24">
            <!-- Upload error banner -->
            <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p class="flex-1 text-sm text-red-700">{{ error }}</p>
            </div>

            <!-- Where this asset appears -->
            <div class="flex items-start gap-2 p-3 bg-sky-50 border border-sky-100 rounded-xl">
              <Info class="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p class="text-sm text-slate-600">{{ description }}</p>
            </div>

            <!-- Preview -->
            <div v-if="mediaUrl" class="relative">
              <div
                v-if="contentType === 'image'"
                class="min-h-[12.5rem] flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 p-6"
              >
                <img
                  :src="mediaUrl"
                  :alt="title"
                  class="max-w-full max-h-[20rem] object-contain"
                />
              </div>
              <video
                v-else
                :src="mediaUrl"
                controls
                class="w-full max-h-[20rem] object-contain rounded-2xl bg-black"
              >
                {{ t('management.media.mediaUploads.drawer.videoUnsupported') }}
              </video>

              <!-- Uploading overlay -->
              <div
                v-if="isUploading"
                class="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center"
              >
                <div class="flex items-center gap-2 text-slate-600">
                  <div class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span class="text-sm font-medium">{{ t('management.media.mediaUploads.drawer.uploading') }}</span>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-else
              @click="canEdit && !isUploading ? triggerFileInput() : null"
              :class="[
                'border-2 border-dashed rounded-2xl p-8 transition-all duration-300 text-center',
                canEdit
                  ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group'
                  : 'border-slate-300 bg-slate-50'
              ]"
            >
              <div class="flex flex-col items-center justify-center">
                <div
                  v-if="isUploading"
                  class="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"
                ></div>
                <component
                  v-else
                  :is="contentType === 'video' ? Video : ImageIcon"
                  :class="[
                    'w-8 h-8 mb-3 transition-colors',
                    canEdit ? 'text-slate-400 group-hover:text-emerald-600' : 'text-slate-400'
                  ]"
                  aria-hidden="true"
                />
                <p :class="[
                  'text-sm font-semibold transition-colors',
                  canEdit ? 'text-slate-600 group-hover:text-slate-900' : 'text-slate-600'
                ]">
                  {{ isUploading ? t('management.media.mediaUploads.drawer.uploading') : emptyStateText }}
                </p>
                <p v-if="canEdit && !isUploading" class="text-xs text-slate-400 mt-1">
                  {{ t('management.media.mediaUploads.card.clickToUpload') }}
                </p>
              </div>
            </div>

            <!-- Download sample -->
            <button
              v-if="downloadUrl"
              type="button"
              @click="handleDownload"
              :disabled="isDownloading"
              class="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div
                v-if="isDownloading"
                class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              ></div>
              <Download v-else class="w-4 h-4" aria-hidden="true" />
              <span>{{ t('management.media.mediaUploads.card.downloadSample') }}</span>
            </button>

            <!-- Hidden file input -->
            <input
              ref="fileInputRef"
              type="file"
              :accept="acceptTypes"
              @change="handleFileChange"
              class="hidden"
            />
          </div>
        </div>

        <!-- Footer -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <div v-if="canEdit" class="flex items-center gap-2">
              <button
                type="button"
                @click="triggerFileInput"
                :disabled="isUploading"
                class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 drawer-action shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Loader v-if="isUploading" class="w-4 h-4 animate-spin" aria-hidden="true" />
                <Upload v-else class="w-4 h-4" aria-hidden="true" />
                <span>
                  {{ isUploading
                    ? t('management.media.mediaUploads.drawer.uploading')
                    : (mediaUrl ? t('management.media.mediaUploads.card.replace') : t('management.media.mediaUploads.drawer.uploadBtn')) }}
                </span>
              </button>
            </div>
            <span v-else></span>

            <button
              type="button"
              @click="closeDrawer"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors"
            >
              {{ t('management.media.mediaUploads.drawer.close') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import {
  ArrowRight,
  AlertCircle,
  Download,
  ImageIcon,
  Info,
  Loader,
  Trash2,
  Upload,
  Video,
} from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()

interface Props {
  modelValue: boolean
  title: string
  /** Guidance text shown in the info box */
  description: string
  contentType: 'image' | 'video'
  mediaUrl?: string | null
  canEdit: boolean
  isUploading?: boolean
  acceptTypes: string
  emptyStateText: string
  /** Optional sample asset the user can download (e.g. template sample logo) */
  downloadUrl?: string | null
  downloadFilename?: string
  /** Upload error surfaced from the parent's upload composable */
  error?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'upload', file: File): void
  (e: 'remove'): void
}

const props = withDefaults(defineProps<Props>(), {
  mediaUrl: null,
  isUploading: false,
  downloadUrl: null,
  error: null,
})

const emit = defineEmits<Emits>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    emit('upload', file)
  }

  // Reset input to allow re-uploading the same file
  target.value = ''
}

// Download the provided URL as a file. Fetch-and-blob ensures a real "Save
// As" download instead of the browser navigating to the asset; on CORS
// failure we fall back to opening the URL in a new tab so the user can
// still save it manually.
const isDownloading = ref(false)
const handleDownload = async () => {
  if (!props.downloadUrl || isDownloading.value) return
  isDownloading.value = true
  try {
    const response = await fetch(props.downloadUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    const fallback = props.downloadUrl.split('?')[0].split('/').pop() || 'sample-logo'
    a.download = props.downloadFilename || fallback
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  } catch (err) {
    console.error('Download failed, opening URL instead:', err)
    window.open(props.downloadUrl, '_blank', 'noopener,noreferrer')
  } finally {
    isDownloading.value = false
  }
}

const closeDrawer = () => {
  emit('update:modelValue', false)
}

// Prevent layout shift when locking body scroll
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeDrawer()
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
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
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>

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
