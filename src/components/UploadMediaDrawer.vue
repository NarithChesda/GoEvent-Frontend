<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade" appear>
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]" @click="handleClose" />
    </Transition>

    <!-- Drawer Panel -->
    <Transition name="slide-right" appear>
      <div
        class="fixed inset-y-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[520px] lg:w-[560px] md:max-w-[calc(100vw-32px)] bg-white md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center justify-between px-3 py-2.5">
            <div class="flex items-center gap-2 min-w-0">
              <button
                @click="handleClose"
                :disabled="uploading"
                class="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      {{ t('management.media.uploadModal.formatHint') }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Compressing Indicator -->
              <div v-if="compressing" class="flex items-center gap-2 p-3 bg-sky-50 border border-sky-200 rounded-xl">
                <Loader2 class="w-4 h-4 text-sky-600 animate-spin" />
                <p class="text-sm text-sky-700 font-medium">{{ t('management.media.uploadModal.optimizing') }}</p>
              </div>

              <!-- Selected Files Preview -->
              <div v-if="selectedFiles.length > 0" class="space-y-3">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {{ t('management.media.uploadModal.selectedFiles', { count: selectedFiles.length }) }}
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    v-for="(file, index) in selectedFiles"
                    :key="index"
                    class="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl"
                  >
                    <!-- Preview Thumbnail -->
                    <div class="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                      <img
                        v-if="file.preview"
                        :src="file.preview"
                        :alt="file.file.name"
                        class="w-full h-full object-cover"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center">
                        <ImageIcon class="w-5 h-5 text-slate-400" />
                      </div>
                    </div>

                    <!-- File Info -->
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900 truncate">
                        {{ file.file.name }}
                      </p>
                      <p class="text-xs text-slate-500">{{ formatFileSize(file.file.size) }}</p>
                    </div>

                    <!-- Remove Button -->
                    <button
                      type="button"
                      @click="removeFile(index)"
                      class="p-1 text-slate-400 hover:text-red-500 transition-colors duration-200"
                    >
                      <X class="w-4 h-4" />
                    </button>
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
            <Transition name="slide-fade">
              <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-red-800">{{ t('management.media.uploadModal.error.title') }}</p>
                  <p class="text-sm text-red-700 mt-0.5">{{ error }}</p>
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
                  class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] h-2 rounded-full transition-all duration-300"
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
              :disabled="selectedFiles.length === 0 || uploading || compressing"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowRight, Upload, X, ImageIcon, AlertCircle, ImagePlus, Loader2 } from 'lucide-vue-next'
import { mediaService, type EventPhoto } from '../services/api'
import { compressImage } from '@/utils/imageCompression'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface Props {
  eventId: string
}

interface Emits {
  close: []
  uploaded: [media: EventPhoto]
}

interface FileWithPreview {
  file: File
  preview: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useAppLanguage()

// State
const selectedFiles = ref<FileWithPreview[]>([])
const defaultCaption = ref('')
const markAsFeatured = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const currentUpload = ref(0)
const error = ref<string | null>(null)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()
const compressing = ref(false)

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

const addFiles = async (files: File[]) => {
  const imageFiles = files.filter((file) => file.type.startsWith('image/'))

  if (imageFiles.length !== files.length) {
    error.value = t('management.media.uploadModal.error.onlyImages')
    setTimeout(() => (error.value = null), 3000)
  }

  if (imageFiles.length === 0) return

  compressing.value = true
  try {
    const compressed = await Promise.all(imageFiles.map((file) => compressImage(file)))

    for (const file of compressed) {
      const preview = await readAsDataURL(file)
      selectedFiles.value.push({ file, preview })
    }
  } catch {
    error.value = t('management.media.uploadModal.error.processFailed')
    setTimeout(() => (error.value = null), 3000)
  } finally {
    compressing.value = false
  }
}

const readAsDataURL = (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string ?? null)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const uploadFiles = async () => {
  if (selectedFiles.value.length === 0) return

  uploading.value = true
  uploadProgress.value = 0
  currentUpload.value = 1
  error.value = null

  try {
    const files = selectedFiles.value.map((f) => f.file)
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
})
</script>

<style scoped>
/* Fade transition for backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide from right on desktop, from bottom on mobile */
.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}

.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
  }
}

/* Conditional field transition */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

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
}
</style>
