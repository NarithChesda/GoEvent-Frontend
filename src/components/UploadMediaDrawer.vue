<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="drawer-backdrop" appear>
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]" @click="handleClose" />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="drawer-panel" appear>
      <div
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[32.5rem] lg:w-[35rem] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center justify-between px-3 py-2.5">
            <div class="flex items-center gap-2 min-w-0">
              <button
                @click="handleClose"
                :disabled="uploading"
                class="p-1.5 hover:bg-white/20 rounded-lg drawer-close flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                :title="t('management.media.uploadModal.drawer.closeTitle')"
              >
                <ArrowRight class="w-5 h-5 text-white" />
              </button>
              <div class="flex items-center gap-2 min-w-0">
                <ImagePlus class="w-4 h-4 text-white flex-shrink-0" aria-hidden="true" />
                <h2 class="text-base font-semibold text-white truncate">{{ t('management.media.uploadModal.title') }}</h2>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto overscroll-contain">
          <form id="upload-media-form" @submit.prevent="uploadFiles" class="p-4 space-y-5 pb-24">
            <!-- File Upload Area -->
            <div class="space-y-3">
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('management.media.uploadModal.selectImages') }}
              </p>

              <!-- Drop Zone -->
              <div
                @drop="handleDrop"
                @dragover.prevent
                @dragenter.prevent
                @dragleave="handleDragLeave"
                :class="[
                  'relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-colors duration-200',
                  isDragging
                    ? 'border-[#4fa3d9] bg-[#E6F4FF]'
                    : 'border-slate-300 hover:border-slate-400',
                ]"
              >
                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  accept="image/*"
                  @change="handleFileSelect"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div class="space-y-3">
                  <div
                    class="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-2xl flex items-center justify-center mx-auto"
                  >
                    <Upload class="w-7 h-7 sm:w-8 sm:h-8 text-[#1e90ff]" />
                  </div>

                  <div>
                    <p class="text-sm sm:text-base font-medium text-slate-900 mb-1">
                      {{ isDragging ? t('management.media.uploadModal.dropActive') : t('management.media.uploadModal.dropIdle') }}
                    </p>
                    <p class="text-xs sm:text-sm text-slate-600">
                      {{ t('management.media.uploadModal.dropHint') }}
                    </p>
                    <p class="text-[10px] sm:text-xs text-slate-500 mt-1">
                      {{ t('management.media.uploadModal.formatHint', { size: sizeLimitLabel }) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Optimize Toggle -->
              <button
                type="button"
                role="switch"
                :aria-checked="optimizeImages"
                :disabled="uploading || compressing"
                @click="toggleOptimizeImages"
                class="w-full flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg text-left hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="flex items-center gap-3 min-w-0">
                  <span class="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                    <ImageDown class="w-4 h-4 text-sky-500" aria-hidden="true" />
                  </span>
                  <span class="min-w-0">
                    <span class="block text-sm font-medium text-slate-700">
                      {{ t('management.media.uploadModal.optimize.label') }}
                    </span>
                    <span class="block text-xs text-slate-500">
                      {{ t('management.media.uploadModal.optimize.hint') }}
                    </span>
                  </span>
                </span>
                <span
                  :class="[
                    'relative inline-block h-6 w-11 rounded-full flex-shrink-0 transition-colors duration-200',
                    optimizeImages ? 'bg-sky-500' : 'bg-slate-200',
                  ]"
                >
                  <span
                    class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
                    :style="{ transform: optimizeImages ? 'translateX(20px)' : 'translateX(0)' }"
                  />
                </span>
              </button>

              <!-- Over-limit Warning -->
              <Transition name="drawer-reveal">
                <div v-if="oversizedFiles.length > 0" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <div
                      class="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2.5"
                    >
                      <div class="flex items-start gap-2">
                        <TriangleAlert class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-amber-800">
                            {{
                              oversizedFiles.length === 1
                                ? t('management.media.uploadModal.oversized.titleOne', { size: sizeLimitLabel })
                                : t('management.media.uploadModal.oversized.titleMany', {
                                    count: oversizedFiles.length,
                                    size: sizeLimitLabel,
                                  })
                            }}
                          </p>
                          <p class="text-sm text-amber-700 mt-0.5">
                            {{
                              canShrinkOversized
                                ? t('management.media.uploadModal.oversized.description')
                                : t('management.media.uploadModal.oversized.descriptionUnshrinkable')
                            }}
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center gap-2 pl-7">
                        <button
                          v-if="canShrinkOversized"
                          type="button"
                          @click="optimizeOversized"
                          :disabled="compressing"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minimize2 class="w-3.5 h-3.5" aria-hidden="true" />
                          {{ t('management.media.uploadModal.oversized.optimizeAll') }}
                        </button>
                        <button
                          type="button"
                          @click="removeOversized"
                          :disabled="compressing"
                          class="px-3 py-1.5 text-amber-700 hover:bg-amber-100 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {{ t('management.media.uploadModal.oversized.removeAll') }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition>

              <!-- Selected Files Preview -->
              <div v-if="selectedFiles.length > 0" class="space-y-3">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {{ t('management.media.uploadModal.selectedFiles', { count: selectedFiles.length }) }}
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    v-for="item in selectedFiles"
                    :key="item.id"
                    :class="[
                      'flex items-center gap-3 p-3 rounded-xl border',
                      isOversized(item)
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-slate-50 border-transparent',
                    ]"
                  >
                    <!-- Preview Thumbnail -->
                    <div class="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                      <img
                        v-if="item.preview"
                        :src="item.preview"
                        :alt="item.original.name"
                        class="w-full h-full object-cover"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center">
                        <ImageIcon class="w-5 h-5 text-slate-400" />
                      </div>
                    </div>

                    <!-- File Info -->
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900 truncate">
                        {{ item.original.name }}
                      </p>
                      <p
                        v-if="item.optimizing"
                        class="flex items-center gap-1 text-xs font-medium text-sky-600"
                      >
                        <Loader2 class="w-3 h-3 animate-spin" aria-hidden="true" />
                        {{ t('management.media.uploadModal.optimizing') }}
                      </p>
                      <p v-else-if="isOversized(item)" class="text-xs font-medium text-amber-700 truncate">
                        {{ formatFileSize(activeFile(item).size) }} ·
                        {{
                          isUnshrinkable(item)
                            ? t('management.media.uploadModal.optimize.stillOverLimit')
                            : t('management.media.uploadModal.optimize.overLimit')
                        }}
                      </p>
                      <p v-else-if="isOptimized(item)" class="text-xs text-emerald-600 truncate">
                        <span class="text-slate-400 line-through">{{ formatFileSize(item.original.size) }}</span>
                        → {{ formatFileSize(activeFile(item).size) }}
                      </p>
                      <p v-else class="text-xs text-slate-500">{{ formatFileSize(item.original.size) }}</p>
                    </div>

                    <!-- Row Actions -->
                    <div class="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        v-if="isOversized(item) && !isUnshrinkable(item) && !item.optimizing"
                        type="button"
                        @click="optimizeFiles([item], true)"
                        :title="t('management.media.uploadModal.optimize.optimizeOne')"
                        :aria-label="t('management.media.uploadModal.optimize.optimizeOne')"
                        class="p-1 text-amber-600 hover:text-amber-800 transition-colors duration-200"
                      >
                        <Minimize2 class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        @click="removeFile(item.id)"
                        :title="t('management.media.uploadModal.removeFile')"
                        :aria-label="t('management.media.uploadModal.removeFile')"
                        class="p-1 text-slate-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Upload Options -->
            <div class="space-y-3">
              <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('management.media.uploadModal.options.title') }}
              </p>

              <!-- Default Caption -->
              <div>
                <label for="defaultCaption" class="block text-sm font-medium text-slate-700 mb-2">
                  {{ t('management.media.uploadModal.options.captionLabel') }}
                </label>
                <input
                  id="defaultCaption"
                  v-model="defaultCaption"
                  type="text"
                  :placeholder="t('management.media.uploadModal.options.captionPlaceholder')"
                  class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white"
                />
                <p class="text-xs text-slate-500 mt-1">
                  {{ t('management.media.uploadModal.options.captionHint') }}
                </p>
              </div>

              <!-- Featured Toggle -->
              <div class="flex items-center gap-3">
                <input
                  id="markAsFeatured"
                  v-model="markAsFeatured"
                  type="checkbox"
                  class="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-200"
                />
                <label for="markAsFeatured" class="text-sm font-medium text-slate-700">
                  {{ t('management.media.uploadModal.options.featuredLabel') }}
                </label>
              </div>
            </div>

            <!-- Error Display -->
            <Transition name="drawer-reveal">
              <div v-if="error" class="grid grid-rows-[1fr]">
                <div class="min-h-0 overflow-hidden">
                  <div class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div class="flex-1">
                      <p class="text-sm font-medium text-red-800">{{ t('management.media.uploadModal.error.title') }}</p>
                      <p class="text-sm text-red-700 mt-0.5">{{ error }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- Upload Progress -->
            <div v-if="uploading" class="space-y-3">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-slate-700">
                  {{ selectedFiles.length === 1 ? t('management.media.uploadModal.progress.uploadingOne') : t('management.media.uploadModal.progress.uploadingMany', { count: selectedFiles.length }) }}
                </p>
                <p class="text-sm text-slate-500">{{ Math.round(uploadProgress) }}%</p>
              </div>
              <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] h-2 rounded-full drawer-action duration-300"
                  :style="{ width: `${uploadProgress}%` }"
                ></div>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <button
              type="submit"
              form="upload-media-form"
              :disabled="selectedFiles.length === 0 || uploading || compressing || oversizedFiles.length > 0"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 drawer-action shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                v-if="uploading"
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></span>
              <Upload v-else class="w-4 h-4" aria-hidden="true" />
              <span>
                {{
                  uploading
                    ? t('management.media.uploadModal.uploading')
                    : selectedFiles.length === 1
                      ? t('management.media.uploadModal.submitOne')
                      : t('management.media.uploadModal.submitMany', { count: selectedFiles.length })
                }}
              </span>
            </button>

            <button
              type="button"
              @click="handleClose"
              :disabled="uploading"
              class="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ t('management.media.uploadModal.cancel') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  ArrowRight,
  Upload,
  X,
  ImageIcon,
  AlertCircle,
  ImagePlus,
  Loader2,
  ImageDown,
  Minimize2,
  TriangleAlert,
} from 'lucide-vue-next'
import { mediaService, type EventPhoto } from '../services/api'
import { compressImage } from '@/utils/imageCompression'
import { FILE_SIZE_LIMITS } from '@/constants/media'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface Props {
  eventId: string
}

interface Emits {
  close: []
  uploaded: [media: EventPhoto]
}

/**
 * A picked image. The original is always kept so optimization stays reversible,
 * and the optimized copy is computed at most once and cached — flipping the
 * "optimize" toggle then only swaps which one gets uploaded.
 */
interface SelectedImage {
  id: number
  original: File
  optimizedFile: File | null
  useOptimized: boolean
  /** Optimized by an explicit per-file/bulk action, so the toggle won't revert it. */
  pinned: boolean
  optimizing: boolean
  preview: string
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useAppLanguage()

// State
const selectedFiles = ref<SelectedImage[]>([])
const optimizeImages = ref(true)
const defaultCaption = ref('')
const markAsFeatured = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const currentUpload = ref(0)
const error = ref<string | null>(null)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()
let nextFileId = 0
let errorTimer: ReturnType<typeof setTimeout> | undefined

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/** The file that will actually be uploaded for this entry. */
const activeFile = (item: SelectedImage): File =>
  item.useOptimized && item.optimizedFile ? item.optimizedFile : item.original

const isOptimized = (item: SelectedImage): boolean => activeFile(item) !== item.original

const isOversized = (item: SelectedImage): boolean =>
  activeFile(item).size > FILE_SIZE_LIMITS.IMAGE

/** Already optimized as far as we can, and still too big — only removing helps. */
const isUnshrinkable = (item: SelectedImage): boolean =>
  item.optimizedFile !== null && item.optimizedFile.size > FILE_SIZE_LIMITS.IMAGE

const compressing = computed(() => selectedFiles.value.some((item) => item.optimizing))
const oversizedFiles = computed(() => selectedFiles.value.filter(isOversized))
const canShrinkOversized = computed(() => oversizedFiles.value.some((item) => !isUnshrinkable(item)))
const sizeLimitLabel = computed(() => formatFileSize(FILE_SIZE_LIMITS.IMAGE))

const flashError = (message: string) => {
  error.value = message
  clearTimeout(errorTimer)
  errorTimer = setTimeout(() => (error.value = null), 4000)
}

// Methods
const handleClose = () => {
  if (uploading.value) return
  emit('close')
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    addFiles(Array.from(input.files))
  }
  // Allow re-picking the same file after it was removed from the list
  input.value = ''
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files))
  }
}

const handleDragLeave = (event: DragEvent) => {
  // Only set isDragging to false if we're leaving the drop zone entirely
  const currentTarget = event.currentTarget as HTMLElement
  const relatedTarget = event.relatedTarget as Node
  if (currentTarget && !currentTarget.contains(relatedTarget)) {
    isDragging.value = false
  }
}

const addFiles = (files: File[]) => {
  const imageFiles = files.filter((file) => file.type.startsWith('image/'))

  if (imageFiles.length !== files.length) {
    flashError(t('management.media.uploadModal.error.onlyImages'))
  }

  if (imageFiles.length === 0) return

  const entries: SelectedImage[] = imageFiles.map((file) => ({
    id: nextFileId++,
    original: file,
    optimizedFile: null,
    useOptimized: false,
    pinned: false,
    optimizing: false,
    preview: URL.createObjectURL(file),
  }))
  selectedFiles.value.push(...entries)

  if (optimizeImages.value) {
    // Read the entries back out of the ref: optimizeFiles mutates them from an
    // async callback, and writes to the raw objects would bypass the reactive
    // proxy — the per-row spinner would then never clear on its own.
    void optimizeFiles(selectedFiles.value.slice(-entries.length), false)
  }
}

/** Compute (once) and cache the optimized copy of an entry. */
const ensureOptimizedFile = async (item: SelectedImage) => {
  if (item.optimizedFile || item.optimizing) return
  item.optimizing = true
  try {
    item.optimizedFile = await compressImage(item.original)
  } catch {
    flashError(t('management.media.uploadModal.error.processFailed'))
  } finally {
    item.optimizing = false
  }
}

const optimizeFiles = async (items: SelectedImage[], pin: boolean) => {
  const targets = items.filter((item) => !item.useOptimized || !item.optimizedFile)
  if (targets.length === 0) return

  for (const item of targets) {
    item.useOptimized = true
    if (pin) item.pinned = true
  }

  await Promise.all(targets.map(ensureOptimizedFile))
}

const optimizeOversized = () => {
  void optimizeFiles(
    oversizedFiles.value.filter((item) => !isUnshrinkable(item)),
    true,
  )
}

const removeOversized = () => {
  for (const item of oversizedFiles.value) {
    URL.revokeObjectURL(item.preview)
  }
  selectedFiles.value = selectedFiles.value.filter((item) => !isOversized(item))
}

const toggleOptimizeImages = () => {
  optimizeImages.value = !optimizeImages.value

  if (optimizeImages.value) {
    void optimizeFiles(selectedFiles.value, false)
    return
  }

  // Back to the originals, except where the user optimized a file on purpose
  for (const item of selectedFiles.value) {
    if (!item.pinned) item.useOptimized = false
  }
}

const removeFile = (id: number) => {
  const index = selectedFiles.value.findIndex((item) => item.id === id)
  if (index === -1) return
  URL.revokeObjectURL(selectedFiles.value[index].preview)
  selectedFiles.value.splice(index, 1)
}

const uploadFiles = async () => {
  if (selectedFiles.value.length === 0) return
  if (compressing.value || oversizedFiles.value.length > 0) return

  uploading.value = true
  uploadProgress.value = 0
  currentUpload.value = 1
  error.value = null

  try {
    const files = selectedFiles.value.map(activeFile)
    const totalFiles = files.length

    // Prepare captions array if default caption is provided
    const captions = defaultCaption.value
      ? Array(totalFiles).fill(defaultCaption.value)
      : undefined

    // Simulate progress during upload
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 300)

    // Use bulk upload API
    const response = await mediaService.bulkUploadEventMedia(props.eventId, files, {
      captions,
    })

    // Clear progress simulation
    clearInterval(progressInterval)

    if (response.success && response.data) {
      uploadProgress.value = 100

      // Emit each uploaded photo individually to maintain compatibility
      response.data.photos.forEach((photo) => {
        emit('uploaded', photo)
      })

      // Close drawer after successful upload
      emit('close')
    } else {
      error.value = response.message || t('management.media.uploadModal.error.uploadFailed')
    }
  } catch (err) {
    console.error('Upload error:', err)
    error.value = t('management.media.uploadModal.error.uploadFailed')
  } finally {
    uploading.value = false
    currentUpload.value = 0
    uploadProgress.value = 0
  }
}

// Prevent layout shift when locking body scroll
const getScrollbarWidth = (): number => {
  return window.innerWidth - document.documentElement.clientWidth
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') handleClose()
}

onMounted(() => {
  const scrollbarWidth = getScrollbarWidth()
  document.body.style.overflow = 'hidden'
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`
  }
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.removeEventListener('keydown', handleKeydown)
  clearTimeout(errorTimer)
  for (const item of selectedFiles.value) {
    URL.revokeObjectURL(item.preview)
  }
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
