<template>
  <div class="space-y-8">
    <div>
      <h4 class="text-lg font-semibold text-slate-900 mb-2">Basic Media</h4>
      <p class="text-sm text-slate-600 mb-6">Upload banner image, logos, and event video</p>
    </div>

    <!-- Banner Image -->
    <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h5 class="font-semibold text-slate-900">Event Banner</h5>
          <p class="text-sm text-slate-600">Main hero image for your event (1200x800px recommended)</p>
        </div>
        <div class="flex space-x-2">
          <input
            ref="bannerInput"
            type="file"
            accept="image/*"
            @change="handleBannerUpload"
            class="hidden"
          />
          <button
            v-if="canEdit"
            @click="($refs.bannerInput as HTMLInputElement)?.click()"
            :disabled="uploading.banner_image"
            class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload class="w-4 h-4" />
            <span>{{ uploading.banner_image ? 'Uploading...' : 'Upload Banner' }}</span>
          </button>
          <button
            v-if="eventData?.banner_image && canEdit"
            @click="confirmRemoveBanner"
            :disabled="uploading.banner_image"
            class="text-slate-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div v-if="eventData?.banner_image" class="relative group">
        <img
          :src="getMediaUrl(eventData.banner_image)"
          :alt="eventData.title + ' banner'"
          class="w-full h-48 object-cover rounded-2xl"
        />
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
          <p class="text-white font-medium">Banner Image</p>
        </div>
      </div>
      <div v-else class="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center">
        <ImageIcon class="w-12 h-12 text-slate-400 mx-auto mb-2" />
        <p class="text-slate-600">No banner image uploaded</p>
      </div>
    </div>

    <!-- Logos Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Primary Logo -->
      <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h5 class="font-semibold text-slate-900">Primary Logo</h5>
            <p class="text-sm text-slate-600">Main event or organization logo</p>
          </div>
          <div class="flex space-x-2">
            <input
              ref="logoOneInput"
              type="file"
              accept="image/*"
              @change="handleLogoOneUpload"
              class="hidden"
            />
            <button
              v-if="canEdit"
              @click="($refs.logoOneInput as HTMLInputElement)?.click()"
              :disabled="uploading.logo_one"
              class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload class="w-4 h-4" />
              <span class="hidden sm:inline">{{ uploading.logo_one ? 'Uploading...' : 'Upload' }}</span>
            </button>
            <button
              v-if="eventData?.logo_one && canEdit"
              @click="confirmRemoveLogoOne"
              :disabled="uploading.logo_one"
              class="text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div v-if="eventData?.logo_one" class="relative group">
          <img
            :src="getMediaUrl(eventData.logo_one)"
            :alt="eventData.title + ' primary logo'"
            class="w-full h-32 object-contain bg-slate-50 rounded-2xl p-4"
          />
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
            <p class="text-white font-medium">Primary Logo</p>
          </div>
        </div>
        <div v-else class="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center">
          <ImageIcon class="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p class="text-sm text-slate-600">No logo uploaded</p>
        </div>
      </div>

      <!-- Secondary Logo -->
      <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h5 class="font-semibold text-slate-900">Secondary Logo</h5>
            <p class="text-sm text-slate-600">Partner or sponsor logo</p>
          </div>
          <div class="flex space-x-2">
            <input
              ref="logoTwoInput"
              type="file"
              accept="image/*"
              @change="handleLogoTwoUpload"
              class="hidden"
            />
            <button
              v-if="canEdit"
              @click="($refs.logoTwoInput as HTMLInputElement)?.click()"
              :disabled="uploading.logo_two"
              class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload class="w-4 h-4" />
              <span class="hidden sm:inline">{{ uploading.logo_two ? 'Uploading...' : 'Upload' }}</span>
            </button>
            <button
              v-if="eventData?.logo_two && canEdit"
              @click="confirmRemoveLogoTwo"
              :disabled="uploading.logo_two"
              class="text-slate-400 hover:text-red-600 hover:bg-red-50 px-2 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div v-if="eventData?.logo_two" class="relative group">
          <img
            :src="getMediaUrl(eventData.logo_two)"
            :alt="eventData.title + ' secondary logo'"
            class="w-full h-32 object-contain bg-slate-50 rounded-2xl p-4"
          />
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
            <p class="text-white font-medium">Secondary Logo</p>
          </div>
        </div>
        <div v-else class="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center">
          <ImageIcon class="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p class="text-sm text-slate-600">No logo uploaded</p>
        </div>
      </div>
    </div>

    <!-- Event Video -->
    <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h5 class="font-semibold text-slate-900">Event Video</h5>
          <p class="text-sm text-slate-600">Upload a promotional or highlight video (Max 100MB)</p>
        </div>
        <div class="flex space-x-2">
          <input
            ref="videoInput"
            type="file"
            accept="video/*"
            @change="handleVideoUpload"
            class="hidden"
          />
          <button
            v-if="canEdit"
            @click="($refs.videoInput as HTMLInputElement)?.click()"
            :disabled="uploading.event_video"
            class="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload class="w-4 h-4" />
            <span>{{ uploading.event_video ? 'Uploading...' : 'Upload Video' }}</span>
          </button>
          <button
            v-if="eventData?.event_video && canEdit"
            @click="confirmRemoveVideo"
            :disabled="uploading.event_video"
            class="text-slate-400 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div v-if="eventData?.event_video" class="relative group">
        <video
          :src="getMediaUrl(eventData.event_video)"
          controls
          class="w-full h-48 object-cover rounded-2xl bg-black"
        >
          Your browser does not support the video tag.
        </video>
        <div class="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
          Event Video
        </div>
      </div>
      <div v-else class="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center">
        <Play class="w-12 h-12 text-slate-400 mx-auto mb-2" />
        <p class="text-slate-600">No video uploaded</p>
        <p class="text-sm text-slate-500 mt-1">Consider using YouTube embed for large files</p>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-2xl p-4">
      <div class="flex items-center space-x-2">
        <AlertCircle class="w-5 h-5 text-red-500" />
        <p class="text-red-600 font-medium">{{ error }}</p>
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Upload, ImageIcon, Play, X, AlertCircle } from 'lucide-vue-next'
import { eventsService, type Event } from '../services/api'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

interface Props {
  eventData?: Event
  canEdit: boolean
}

interface Emits {
  'updated': [event: Event]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const uploading = ref({
  banner_image: false,
  logo_one: false,
  logo_two: false,
  event_video: false
})

const error = ref<string | null>(null)
const showDeleteModal = ref(false)
const deleting = ref(false)
const deleteModalData = ref({
  title: '',
  itemName: '',
  fieldToDelete: ''
})

// Helper methods
const getMediaUrl = (mediaUrl: string | null): string | undefined => {
  if (!mediaUrl) return undefined
  
  // If it's already a full URL, return as is
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    return mediaUrl
  }
  
  // If it's a relative URL, prepend the API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
  if (mediaUrl.startsWith('/')) {
    return `${API_BASE_URL}${mediaUrl}`
  }
  
  // If it doesn't start with /, assume it needs /media/ prefix
  return `${API_BASE_URL}/media/${mediaUrl}`
}

const validateFile = (file: File, type: 'image' | 'video'): boolean => {
  error.value = null
  
  if (type === 'image') {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (!validTypes.includes(file.type)) {
      error.value = 'Invalid file type. Please upload JPG, PNG, GIF, or WebP images.'
      return false
    }
    
    if (file.size > maxSize) {
      error.value = 'File too large. Maximum size is 10MB.'
      return false
    }
  } else if (type === 'video') {
    const validTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm']
    const maxSize = 100 * 1024 * 1024 // 100MB
    
    if (!validTypes.includes(file.type)) {
      error.value = 'Invalid file type. Please upload MP4, MOV, AVI, or WebM videos.'
      return false
    }
    
    if (file.size > maxSize) {
      error.value = 'File too large. Maximum size is 100MB.'
      return false
    }
  }
  
  return true
}

const uploadMedia = async (field: string, file: File) => {
  if (!props.eventData?.id) return
  
  uploading.value[field as keyof typeof uploading.value] = true
  error.value = null
  
  try {
    const formData = new FormData()
    formData.append(field, file)
    
    const response = await eventsService.updateEventWithFiles(props.eventData.id, formData)
    
    if (response.success && response.data) {
      emit('updated', response.data)
    } else {
      error.value = response.message || `Failed to upload ${field}`
    }
  } catch (err) {
    console.error(`Error uploading ${field}:`, err)
    error.value = 'Network error occurred while uploading'
  } finally {
    uploading.value[field as keyof typeof uploading.value] = false
  }
}

const removeMedia = async (field: string) => {
  if (!props.eventData?.id) return
  
  deleting.value = true
  error.value = null
  
  try {
    const updateData = { [field]: null }
    
    const response = await eventsService.patchEvent(props.eventData.id, updateData)
    
    if (response.success && response.data) {
      emit('updated', response.data)
      showDeleteModal.value = false
    } else {
      error.value = response.message || `Failed to remove ${field}`
    }
  } catch (err) {
    console.error(`Error removing ${field}:`, err)
    error.value = 'Network error occurred while removing media'
  } finally {
    deleting.value = false
  }
}

// File upload handlers
const handleBannerUpload = (event: InputEvent) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && validateFile(file, 'image')) {
    uploadMedia('banner_image', file)
  }
  target.value = '' // Reset input
}

const handleLogoOneUpload = (event: InputEvent) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && validateFile(file, 'image')) {
    uploadMedia('logo_one', file)
  }
  target.value = '' // Reset input
}

const handleLogoTwoUpload = (event: InputEvent) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && validateFile(file, 'image')) {
    uploadMedia('logo_two', file)
  }
  target.value = '' // Reset input
}

const handleVideoUpload = (event: InputEvent) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && validateFile(file, 'video')) {
    uploadMedia('event_video', file)
  }
  target.value = '' // Reset input
}

// Delete confirmation handlers
const confirmRemoveBanner = () => {
  deleteModalData.value = {
    title: 'Delete Banner Image',
    itemName: 'Event Banner',
    fieldToDelete: 'banner_image'
  }
  showDeleteModal.value = true
}

const confirmRemoveLogoOne = () => {
  deleteModalData.value = {
    title: 'Delete Primary Logo',
    itemName: 'Primary Logo',
    fieldToDelete: 'logo_one'
  }
  showDeleteModal.value = true
}

const confirmRemoveLogoTwo = () => {
  deleteModalData.value = {
    title: 'Delete Secondary Logo',
    itemName: 'Secondary Logo', 
    fieldToDelete: 'logo_two'
  }
  showDeleteModal.value = true
}

const confirmRemoveVideo = () => {
  deleteModalData.value = {
    title: 'Delete Event Video',
    itemName: 'Event Video',
    fieldToDelete: 'event_video'
  }
  showDeleteModal.value = true
}

const handleDeleteConfirm = () => {
  removeMedia(deleteModalData.value.fieldToDelete)
}

// Remove media handlers (kept for backward compatibility)
const removeBanner = () => removeMedia('banner_image')
const removeLogoOne = () => removeMedia('logo_one')
const removeLogoTwo = () => removeMedia('logo_two')
const removeVideo = () => removeMedia('event_video')

// Clear error when eventData changes
watch(() => props.eventData, () => {
  error.value = null
})
</script>