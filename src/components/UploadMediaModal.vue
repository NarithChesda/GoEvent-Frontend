<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="true" class="fixed inset-0 z-50 overflow-y-auto" @click="handleBackdropClick">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
        
        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div 
            ref="modalRef"
            class="relative w-full max-w-2xl bg-white/95 backdrop-blur-sm border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <ImagePlus class="w-5 h-5" />
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold">Upload Media</h2>
                    <p class="text-white/90 text-sm mt-1">Add photos and visual content to your event</p>
                  </div>
                </div>
                <button
                  @click="$emit('close')"
                  class="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="p-8 space-y-6">
              <!-- File Upload Area -->
              <div class="space-y-4">
                <label class="block text-sm font-semibold text-slate-700">Select Images</label>
                
                <!-- Drop Zone -->
                <div
                  @drop="handleDrop"
                  @dragover.prevent
                  @dragenter.prevent
                  @dragleave="handleDragLeave"
                  :class="[
                    'relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors duration-200',
                    isDragging 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
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
                  
                  <div class="space-y-4">
                    <div class="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Upload class="w-8 h-8 text-blue-600" />
                    </div>
                    
                    <div>
                      <p class="text-lg font-medium text-slate-900 mb-1">
                        {{ isDragging ? 'Drop your images here' : 'Upload your images' }}
                      </p>
                      <p class="text-sm text-slate-600">
                        Drag and drop images here, or click to browse
                      </p>
                      <p class="text-xs text-slate-500 mt-1">
                        Supports: JPG, PNG, WebP (Max 10MB per file)
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Selected Files Preview -->
                <div v-if="selectedFiles.length > 0" class="space-y-3">
                  <h4 class="text-sm font-medium text-slate-700">Selected Files ({{ selectedFiles.length }})</h4>
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
                        <p class="text-sm font-medium text-slate-900 truncate">{{ file.file.name }}</p>
                        <p class="text-xs text-slate-500">{{ formatFileSize(file.file.size) }}</p>
                      </div>

                      <!-- Remove Button -->
                      <button
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
              <div class="space-y-4">
                <h4 class="text-sm font-semibold text-slate-700">Upload Options</h4>
                
                <!-- Default Caption -->
                <div>
                  <label for="defaultCaption" class="block text-sm font-semibold text-slate-700 mb-2">
                    Default Caption (Optional)
                  </label>
                  <input
                    id="defaultCaption"
                    v-model="defaultCaption"
                    type="text"
                    placeholder="Enter a caption for all images"
                    class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                  />
                  <p class="text-xs text-slate-500 mt-1">This caption will be applied to all uploaded images</p>
                </div>

                <!-- Featured Toggle -->
                <div class="flex items-center space-x-3">
                  <input
                    id="markAsFeatured"
                    v-model="markAsFeatured"
                    type="checkbox"
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label for="markAsFeatured" class="text-sm font-semibold text-slate-700">
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
                    Uploading {{ currentUpload }} of {{ selectedFiles.length }}...
                  </p>
                  <p class="text-sm text-slate-500">{{ Math.round(uploadProgress) }}%</p>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    class="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${uploadProgress}%` }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 p-8 border-t border-gray-200">
              <button
                type="button"
                @click="$emit('close')"
                :disabled="uploading"
                class="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="uploadFiles"
                :disabled="selectedFiles.length === 0 || uploading"
                class="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-600/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                <div v-if="uploading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <Upload v-else class="w-5 h-5 mr-2" />
                {{ uploading ? 'Uploading...' : `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'File' : 'Files'}` }}
              </button>
            </div>
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
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length !== files.length) {
    error.value = 'Only image files are allowed'
    setTimeout(() => error.value = null, 3000)
  }
  
  imageFiles.forEach(file => {
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
        preview: e.target?.result as string
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
  currentUpload.value = 0
  error.value = null
  
  try {
    const totalFiles = selectedFiles.value.length
    let uploadedCount = 0
    
    for (let i = 0; i < selectedFiles.value.length; i++) {
      const fileWithPreview = selectedFiles.value[i]
      currentUpload.value = i + 1
      
      try {
        const response = await mediaService.uploadEventMedia(props.eventId, fileWithPreview.file, {
          caption: defaultCaption.value || undefined,
          is_featured: markAsFeatured.value
        })
        
        if (response.success && response.data) {
          emit('uploaded', response.data)
          uploadedCount++
        } else {
          console.error(`Failed to upload ${fileWithPreview.file.name}:`, response.message)
        }
      } catch (err) {
        console.error(`Error uploading ${fileWithPreview.file.name}:`, err)
      }
      
      uploadProgress.value = ((i + 1) / totalFiles) * 100
    }
    
    if (uploadedCount === totalFiles) {
      // All files uploaded successfully
      emit('close')
    } else if (uploadedCount > 0) {
      error.value = `${uploadedCount} of ${totalFiles} files uploaded successfully. Some uploads failed.`
    } else {
      error.value = 'All uploads failed. Please try again.'
    }
    
  } catch {
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