<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="true" class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            ref="modalRef"
            class="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Header (neutral style) -->
            <div class="px-6 py-4 border-b border-slate-200 bg-white/90">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <ImagePlus class="w-4.5 h-4.5" />
                  </div>
                  <h2 class="text-lg sm:text-xl font-semibold text-slate-900">Upload Media</h2>
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
            <form @submit.prevent="uploadFiles" class="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div class="space-y-5">
                <!-- File Upload Area -->
                <div class="space-y-3 sm:space-y-4">
                  <h4 class="text-sm font-semibold text-slate-900 flex items-center">
                    <ImageIcon class="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Select Images
                  </h4>

                <!-- Drop Zone -->
                <div
                  @drop="handleDrop"
                  @dragover.prevent
                  @dragenter.prevent
                  @dragleave="handleDragLeave"
                  :class="[
                    'relative border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-center transition-colors duration-200',
                    isDragging
                      ? 'border-[#4fa3d9] bg-[#E6F4FF]'
                      : 'border-gray-300 hover:border-gray-400',
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

                  <div class="space-y-2 sm:space-y-3 md:space-y-4">
                    <div
                      class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto"
                    >
                      <Upload class="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#1e90ff]" />
                    </div>

                    <div>
                      <p class="text-sm sm:text-base md:text-lg font-medium text-slate-900 mb-0.5 sm:mb-1">
                        {{ isDragging ? 'Drop your images here' : 'Upload your images' }}
                      </p>
                      <p class="text-xs sm:text-sm text-slate-600">
                        Drag and drop images here, or click to browse
                      </p>
                      <p class="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
                        Supports: JPG, PNG, WebP (Max 10MB per file)
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Selected Files Preview -->
                <div v-if="selectedFiles.length > 0" class="space-y-3">
                  <h4 class="text-sm font-medium text-slate-700">
                    Selected Files ({{ selectedFiles.length }})
                  </h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div
                      v-for="(file, index) in selectedFiles"
                      :key="index"
                      class="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <!-- Preview Thumbnail -->
                      <div class="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                        <img
                          v-if="file.preview"
                          :src="file.preview"
                          :alt="file.file.name"
                          class="w-full h-full object-cover"
                        />
                        <div v-else class="w-full h-full flex items-center justify-center">
                          <ImageIcon class="w-5 h-5 text-gray-400" />
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
                <div class="space-y-3 sm:space-y-4">
                  <h4 class="text-sm font-semibold text-slate-900">Upload Options</h4>

                  <!-- Default Caption -->
                  <div>
                    <label
                      for="defaultCaption"
                      class="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Default Caption (Optional)
                    </label>
                    <input
                      id="defaultCaption"
                      v-model="defaultCaption"
                      type="text"
                      placeholder="Enter a caption for all images"
                      class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 bg-white/90"
                    />
                    <p class="text-xs text-slate-500 mt-1">
                      This caption will be applied to all uploaded images
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
                      Mark as featured content
                    </label>
                  </div>
                </div>

                <!-- Error Display -->
                <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div class="flex items-start space-x-3">
                    <AlertCircle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p class="text-sm font-medium text-red-800">Upload Error</p>
                      <p class="text-sm text-red-600 mt-1">{{ error }}</p>
                    </div>
                  </div>
                </div>

                <!-- Upload Progress -->
                <div v-if="uploading" class="space-y-3">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-medium text-slate-700">
                      Uploading {{ selectedFiles.length }} {{ selectedFiles.length === 1 ? 'photo' : 'photos' }}...
                    </p>
                    <p class="text-sm text-slate-500">{{ Math.round(uploadProgress) }}%</p>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      class="bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] h-2 rounded-full transition-all duration-300"
                      :style="{ width: `${uploadProgress}%` }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-row justify-end gap-3 pt-5 border-t border-slate-200">
                <button
                  type="button"
                  @click="$emit('close')"
                  :disabled="uploading"
                  class="flex-1 sm:flex-none px-5 py-2.5 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="selectedFiles.length === 0 || uploading"
                  class="flex-1 sm:flex-none px-6 py-2.5 text-sm bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] hover:from-[#27ae60] hover:to-[#1873cc] text-white rounded-lg font-semibold transition-colors shadow-lg shadow-emerald-500/25 hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <span
                    v-if="uploading"
                    class="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"
                  ></span>
                  {{
                    uploading
                      ? 'Uploading...'
                      : `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'File' : 'Files'}`
                  }}
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
import { ref } from 'vue'
import { Upload, X, ImageIcon, AlertCircle, ImagePlus } from 'lucide-vue-next'
import { mediaService, type EventPhoto } from '../services/api'

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

// Refs
const modalRef = ref<HTMLElement>()

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

// Methods
const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    emit('close')
  }
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

const addFiles = (files: File[]) => {
  const imageFiles = files.filter((file) => file.type.startsWith('image/'))

  if (imageFiles.length !== files.length) {
    error.value = 'Only image files are allowed'
    setTimeout(() => (error.value = null), 3000)
  }

  imageFiles.forEach((file) => {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      error.value = `File "${file.name}" is too large. Maximum size is 10MB.`
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      selectedFiles.value.push({
        file,
        preview: e.target?.result as string,
      })
    }
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

      // Close modal after successful upload
      emit('close')
    } else {
      error.value = response.message || 'Upload failed. Please try again.'
    }
  } catch (err) {
    console.error('Upload error:', err)
    error.value = 'Upload failed. Please try again.'
  } finally {
    uploading.value = false
    currentUpload.value = 0
    uploadProgress.value = 0
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
</style>
