<template>
  <div class="space-y-6" @click="dropdownManager.handleClickOutside">
    <!-- Banner Image -->
    <MediaUploadCard
      title="Event Banner"
      description="Main hero image for your event (1200x800px recommended)"
      :media-url="getMediaUrl(eventData?.banner_image)"
      :can-edit="canEdit"
      :is-uploading="mediaUpload.isUploading.value('banner_image')"
      :show-dropdown="dropdownManager.isOpen('banner')"
      accept-types="image/*"
      content-type="image"
      empty-state-text="No banner image uploaded"
      @upload="(file) => handleUpload('banner_image', file, 'image')"
      @remove="confirmRemove('banner_image', 'Delete Banner Image', 'Event Banner')"
      @toggle-dropdown="dropdownManager.toggleDropdown('banner')"
      @close-dropdown="dropdownManager.closeAllDropdowns()"
    />

    <!-- Logos Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Primary Logo -->
      <MediaUploadCard
        title="Primary Logo"
        description="Main event or organization logo"
        :media-url="getMediaUrl(eventData?.logo_one)"
        :can-edit="canEdit"
        :is-uploading="mediaUpload.isUploading.value('logo_one')"
        :show-dropdown="dropdownManager.isOpen('logoOne')"
        accept-types="image/*"
        content-type="image"
        image-class="h-32 object-contain bg-slate-50 p-4"
        empty-state-text="No logo uploaded"
        @upload="(file) => handleUpload('logo_one', file, 'image')"
        @remove="confirmRemove('logo_one', 'Delete Primary Logo', 'Primary Logo')"
        @toggle-dropdown="dropdownManager.toggleDropdown('logoOne')"
        @close-dropdown="dropdownManager.closeAllDropdowns()"
      />

      <!-- Secondary Logo -->
      <MediaUploadCard
        title="Secondary Logo"
        description="Partner or sponsor logo"
        :media-url="getMediaUrl(eventData?.logo_two)"
        :can-edit="canEdit"
        :is-uploading="mediaUpload.isUploading.value('logo_two')"
        :show-dropdown="dropdownManager.isOpen('logoTwo')"
        accept-types="image/*"
        content-type="image"
        image-class="h-32 object-contain bg-slate-50 p-4"
        empty-state-text="No logo uploaded"
        @upload="(file) => handleUpload('logo_two', file, 'image')"
        @remove="confirmRemove('logo_two', 'Delete Secondary Logo', 'Secondary Logo')"
        @toggle-dropdown="dropdownManager.toggleDropdown('logoTwo')"
        @close-dropdown="dropdownManager.closeAllDropdowns()"
      />
    </div>

    <!-- Event Video -->
    <MediaUploadCard
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

    <!-- Event Music -->
    <MediaUploadCard
      title="Event Music"
      description="Upload background music or audio content (Max 10MB)"
      :media-url="getMediaUrl(eventData?.music)"
      :can-edit="canEdit"
      :is-uploading="mediaUpload.isUploading.value('music')"
      :show-dropdown="dropdownManager.isOpen('music')"
      accept-types="audio/*"
      content-type="audio"
      empty-state-text="No music uploaded"
      empty-state-subtext="Upload audio files for background music"
      @upload="(file) => handleUpload('music', file, 'audio')"
      @remove="confirmRemove('music', 'Delete Event Music', 'Event Music')"
      @toggle-dropdown="dropdownManager.toggleDropdown('music')"
      @close-dropdown="dropdownManager.closeAllDropdowns()"
    />

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
  </div>
</template>

<script setup lang="ts">
import { ref, toRef, watch } from 'vue'
import { AlertCircle } from 'lucide-vue-next'
import type { Event } from '@/services/api'
import { useMediaUpload, type MediaFieldName, type MediaType } from '@/composables/useMediaUpload'
import { useDropdownManager } from '@/composables/useDropdownManager'
import { useMediaUrl } from '@/composables/useMediaUrl'
import MediaUploadCard from './MediaUploadCard.vue'
import DeleteConfirmModal from './DeleteConfirmModal.vue'

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
const dropdownManager = useDropdownManager(['banner', 'logoOne', 'logoTwo', 'video', 'music'])
const { getMediaUrl } = useMediaUrl()

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

// Clear error when eventData changes
watch(() => props.eventData, () => {
  mediaUpload.clearError()
})
</script>
